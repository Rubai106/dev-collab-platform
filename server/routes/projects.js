const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { deleteProjectResources } = require('../utils/deleteProjectResources');

const router = express.Router();

const transactionUnsupportedMessages = [
  'Transaction numbers are only allowed on a replica set member or mongos',
  'Standalone servers do not support transactions',
  'Transaction support is not available',
];

const isTransactionUnsupported = (error) =>
  transactionUnsupportedMessages.some((message) => error.message.includes(message));

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const { search, status, tech } = req.query;
    const filter = {};

    if (search) {
      filter.$text = { $search: search };
    }
    if (status) {
      filter.status = status;
    }
    if (tech) {
      filter.techStack = { $in: tech.split(',') };
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/my
router.get('/my', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }],
    })
      .populate('owner', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email profilePicture skills')
      .populate('members', 'name email profilePicture skills')
      .populate('joinRequests.user', 'name email profilePicture skills');

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('techStack').optional().isArray(),
    body('teamSize').optional().isInt({ min: 1, max: 20 }),
    body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.create({
        ...req.body,
        owner: req.user._id,
        members: [req.user._id],
      });

      const populated = await Project.findById(project._id)
        .populate('owner', 'name profilePicture')
        .populate('members', 'name profilePicture');

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can update this project' });
    }

    const allowedFields = ['title', 'description', 'techStack', 'difficulty', 'teamSize', 'status', 'githubRepo'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    }

    await project.save();

    const populated = await Project.findById(project._id)
      .populate('owner', 'name profilePicture')
      .populate('members', 'name profilePicture');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this project' });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await deleteProjectResources(project._id, session);
        await Project.findByIdAndDelete(project._id, { session });
      });
    } catch (error) {
      if (!isTransactionUnsupported(error)) {
        throw error;
      }

      await deleteProjectResources(project._id);
      await Project.findByIdAndDelete(project._id);
    } finally {
      await session.endSession();
    }

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    const alreadyRequested = project.joinRequests.some(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyRequested) {
      return res.status(400).json({ message: 'Join request already sent' });
    }

    if (project.members.length >= project.teamSize) {
      return res.status(400).json({ message: 'Team is full' });
    }

    project.joinRequests.push({
      user: req.user._id,
      message: req.body.message || '',
    });
    await project.save();

    await Notification.create({
      recipient: project.owner,
      type: 'join_request',
      message: `${req.user.name} wants to join "${project.title}"`,
      project: project._id,
    });

    res.json({ message: 'Join request sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/approve/:userId
router.post('/:id/approve/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can approve members' });
    }

    if (project.members.length >= project.teamSize) {
      return res.status(400).json({ message: 'Team is full' });
    }

    project.joinRequests = project.joinRequests.filter(
      (r) => r.user.toString() !== req.params.userId
    );
    project.members.push(req.params.userId);
    await project.save();

    await Notification.create({
      recipient: req.params.userId,
      type: 'join_approved',
      message: `You've been accepted into "${project.title}"`,
      project: project._id,
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .populate('joinRequests.user', 'name profilePicture');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/reject/:userId
router.post('/:id/reject/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can reject requests' });
    }

    project.joinRequests = project.joinRequests.filter(
      (r) => r.user.toString() !== req.params.userId
    );
    await project.save();

    await Notification.create({
      recipient: req.params.userId,
      type: 'join_rejected',
      message: `Your request to join "${project.title}" was declined`,
      project: project._id,
    });

    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Owner cannot leave. Transfer or delete the project.' });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await project.save();

    res.json({ message: 'Left the project' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

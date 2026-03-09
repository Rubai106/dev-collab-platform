const express = require('express');
const { body, validationResult } = require('express-validator');
const Blocker = require('../models/Blocker');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/blockers/:projectId
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name skills profilePicture');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const blockers = await Blocker.find({ project: req.params.projectId })
      .populate('reportedBy', 'name profilePicture')
      .populate('resolvedBy', 'name profilePicture')
      .populate('suggestedHelpers', 'name profilePicture skills')
      .populate('relatedTask', 'title status')
      .sort({ status: 1, createdAt: -1 });

    res.json(blockers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/blockers
router.post(
  '/',
  auth,
  [
    body('project').notEmpty().withMessage('Project ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.findById(req.body.project)
        .populate('members', 'name skills profilePicture');
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isMember = project.members.some(
        (m) => m._id.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a project member' });
      }

      // Auto-suggest helpers based on skills matching keywords in the blocker
      const descWords = (req.body.title + ' ' + req.body.description)
        .toLowerCase()
        .split(/\s+/);
      const suggestedHelpers = project.members
        .filter((m) => m._id.toString() !== req.user._id.toString())
        .filter((m) =>
          m.skills?.some((skill) =>
            descWords.some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))
          )
        )
        .map((m) => m._id);

      const blocker = await Blocker.create({
        project: req.body.project,
        title: req.body.title,
        description: req.body.description,
        reportedBy: req.user._id,
        relatedTask: req.body.relatedTask || null,
        suggestedHelpers,
      });

      // Notify suggested helpers
      for (const helperId of suggestedHelpers) {
        await Notification.create({
          recipient: helperId,
          type: 'project_update',
          message: `${req.user.name} is blocked and might need your help: "${blocker.title}"`,
          project: project._id,
        });
      }

      const populated = await Blocker.findById(blocker._id)
        .populate('reportedBy', 'name profilePicture')
        .populate('suggestedHelpers', 'name profilePicture skills')
        .populate('relatedTask', 'title status');

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/blockers/:id — update blocker (resolve, change status)
router.put('/:id', auth, async (req, res) => {
  try {
    const blocker = await Blocker.findById(req.params.id);
    if (!blocker) return res.status(404).json({ message: 'Blocker not found' });

    const project = await Project.findById(blocker.project);
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    if (req.body.status === 'resolved' && blocker.status !== 'resolved') {
      blocker.resolvedBy = req.user._id;
      blocker.resolvedAt = new Date();
      blocker.resolution = req.body.resolution || '';
    }

    const allowedFields = ['title', 'description', 'status', 'resolution'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        blocker[field] = req.body[field];
      }
    }
    await blocker.save();

    const populated = await Blocker.findById(blocker._id)
      .populate('reportedBy', 'name profilePicture')
      .populate('resolvedBy', 'name profilePicture')
      .populate('suggestedHelpers', 'name profilePicture skills')
      .populate('relatedTask', 'title status');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/blockers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const blocker = await Blocker.findById(req.params.id);
    if (!blocker) return res.status(404).json({ message: 'Blocker not found' });

    const project = await Project.findById(blocker.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isReporter = blocker.reportedBy.toString() === req.user._id.toString();

    if (!isOwner && !isReporter) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Blocker.findByIdAndDelete(req.params.id);
    res.json({ message: 'Blocker deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

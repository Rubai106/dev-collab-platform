const express = require('express');
const { body, validationResult } = require('express-validator');
const Decision = require('../models/Decision');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/decisions/:projectId
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const { tag, search } = req.query;
    const filter = { project: req.params.projectId };
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { decision: { $regex: search, $options: 'i' } },
      ];
    }

    const decisions = await Decision.find(filter)
      .populate('createdBy', 'name profilePicture')
      .populate('participants', 'name profilePicture')
      .populate('relatedTask', 'title status')
      .sort({ createdAt: -1 });

    res.json(decisions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/decisions
router.post(
  '/',
  auth,
  [
    body('project').notEmpty().withMessage('Project ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('decision').trim().notEmpty().withMessage('Decision is required'),
    body('alternatives').optional().isArray(),
    body('reasoning').optional().isLength({ max: 2000 }),
    body('tags').optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.findById(req.body.project);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      const isMember = project.members.some(
        (m) => m.toString() === req.user._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a project member' });
      }

      const decision = await Decision.create({
        ...req.body,
        createdBy: req.user._id,
      });

      const populated = await Decision.findById(decision._id)
        .populate('createdBy', 'name profilePicture')
        .populate('participants', 'name profilePicture')
        .populate('relatedTask', 'title status');

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/decisions/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) return res.status(404).json({ message: 'Decision not found' });

    const project = await Project.findById(decision.project);
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const allowedFields = ['title', 'decision', 'alternatives', 'reasoning', 'participants', 'relatedTask', 'tags'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        decision[field] = req.body[field];
      }
    }
    await decision.save();

    const populated = await Decision.findById(decision._id)
      .populate('createdBy', 'name profilePicture')
      .populate('participants', 'name profilePicture')
      .populate('relatedTask', 'title status');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/decisions/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);
    if (!decision) return res.status(404).json({ message: 'Decision not found' });

    if (decision.createdBy.toString() !== req.user._id.toString()) {
      const project = await Project.findById(decision.project);
      if (project.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    await Decision.findByIdAndDelete(req.params.id);
    res.json({ message: 'Decision deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const TechDebt = require('../models/TechDebt');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/techdebt/:projectId
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

    const filter = { project: req.params.projectId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.severity) filter.severity = req.query.severity;

    const debts = await TechDebt.find(filter)
      .populate('reportedBy', 'name profilePicture')
      .populate('assignedTo', 'name profilePicture')
      .populate('relatedTask', 'title status')
      .sort({ createdAt: 1 });

    // Calculate debt score based on age and severity
    const now = new Date();
    const severityWeight = { low: 1, medium: 2, high: 3, critical: 5 };

    const items = debts.map((d) => {
      const ageDays = Math.floor((now - d.createdAt) / (1000 * 60 * 60 * 24));
      let ageLevel = 'fresh'; // <7 days
      if (ageDays > 90) ageLevel = 'critical';
      else if (ageDays > 30) ageLevel = 'old';
      else if (ageDays > 7) ageLevel = 'aging';

      return {
        ...d.toObject(),
        ageDays,
        ageLevel,
        debtScore:
          d.status === 'resolved'
            ? 0
            : ageDays * (severityWeight[d.severity] || 1),
      };
    });

    const totalDebtScore = items.reduce((sum, i) => sum + i.debtScore, 0);
    const openCount = items.filter((i) => i.status !== 'resolved').length;

    res.json({
      items,
      stats: {
        totalDebtScore,
        openCount,
        resolvedCount: items.length - openCount,
        total: items.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/techdebt
router.post(
  '/',
  auth,
  [
    body('project').notEmpty().withMessage('Project ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('category')
      .optional()
      .isIn(['code-smell', 'architecture', 'dependency', 'testing', 'documentation', 'performance', 'security', 'other']),
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

      const debt = await TechDebt.create({
        ...req.body,
        reportedBy: req.user._id,
      });

      const populated = await TechDebt.findById(debt._id)
        .populate('reportedBy', 'name profilePicture')
        .populate('assignedTo', 'name profilePicture');

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/techdebt/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const debt = await TechDebt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Tech debt not found' });

    const project = await Project.findById(debt.project);
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    if (req.body.status === 'resolved' && debt.status !== 'resolved') {
      debt.resolvedAt = new Date();
    }

    const allowedFields = ['title', 'description', 'severity', 'category', 'status', 'assignedTo'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        debt[field] = req.body[field];
      }
    }
    await debt.save();

    const populated = await TechDebt.findById(debt._id)
      .populate('reportedBy', 'name profilePicture')
      .populate('assignedTo', 'name profilePicture');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/techdebt/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const debt = await TechDebt.findById(req.params.id);
    if (!debt) return res.status(404).json({ message: 'Not found' });

    const project = await Project.findById(debt.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isReporter = debt.reportedBy.toString() === req.user._id.toString();

    if (!isOwner && !isReporter) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await TechDebt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tech debt deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

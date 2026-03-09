const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name profilePicture')
      .populate('createdBy', 'name')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post(
  '/',
  auth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Todo', 'In Progress', 'Completed']),
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

      const taskCount = await Task.countDocuments({ project: req.body.project });

      const task = await Task.create({
        ...req.body,
        createdBy: req.user._id,
        order: taskCount,
      });

      const populated = await Task.findById(task._id)
        .populate('assignedTo', 'name profilePicture')
        .populate('createdBy', 'name');

      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: task.assignedTo,
          type: 'task_assigned',
          message: `You've been assigned "${task.title}" in "${project.title}"`,
          project: project._id,
        });
      }

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/tasks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const allowedFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'order'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    }
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name profilePicture')
      .populate('createdBy', 'name');

    if (req.body.assignedTo && req.body.assignedTo !== req.user._id.toString()) {
      await Notification.create({
        recipient: req.body.assignedTo,
        type: 'task_assigned',
        message: `You've been assigned "${task.title}" in "${project.title}"`,
        project: project._id,
      });
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/reorder/batch
router.put('/reorder/batch', auth, async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks array is required' });
    }

    const bulkOps = tasks.map((t) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { status: t.status, order: t.order } },
      },
    }));

    await Task.bulkWrite(bulkOps);
    res.json({ message: 'Tasks reordered' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

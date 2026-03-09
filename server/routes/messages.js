const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:projectId
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Only members can view messages' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ project: req.params.projectId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/messages
router.post(
  '/',
  auth,
  [
    body('text').trim().notEmpty().withMessage('Message text is required'),
    body('project').notEmpty().withMessage('Project ID is required'),
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
        return res.status(403).json({ message: 'Only members can send messages' });
      }

      const message = await Message.create({
        text: req.body.text,
        project: req.body.project,
        sender: req.user._id,
      });

      const populated = await Message.findById(message._id).populate(
        'sender',
        'name profilePicture'
      );

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

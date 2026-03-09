const express = require('express');
const { body, validationResult } = require('express-validator');
const FocusSession = require('../models/FocusSession');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/focus/start — start a focus session
router.post(
  '/start',
  auth,
  [
    body('project').notEmpty().withMessage('Project ID is required'),
    body('durationMinutes').optional().isInt({ min: 15, max: 480 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      // End any existing active session
      await FocusSession.updateMany(
        { user: req.user._id, active: true },
        { active: false, endTime: new Date() }
      );

      const session = await FocusSession.create({
        user: req.user._id,
        project: req.body.project,
        task: req.body.task || null,
        taskTitle: req.body.taskTitle || '',
        durationMinutes: req.body.durationMinutes || 120,
      });

      const populated = await FocusSession.findById(session._id)
        .populate('user', 'name profilePicture')
        .populate('project', 'title')
        .populate('task', 'title');

      res.status(201).json(populated);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/focus/end — end current focus session
router.post('/end', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOneAndUpdate(
      { user: req.user._id, active: true },
      { active: false, endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'No active focus session' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/focus/active — get current user's active focus session
router.get('/active', auth, async (req, res) => {
  try {
    const session = await FocusSession.findOne({
      user: req.user._id,
      active: true,
    })
      .populate('project', 'title')
      .populate('task', 'title');

    // Auto-expire if past duration
    if (session) {
      const elapsed = (Date.now() - session.startTime) / (1000 * 60);
      if (elapsed >= session.durationMinutes) {
        session.active = false;
        session.endTime = new Date(session.startTime.getTime() + session.durationMinutes * 60000);
        await session.save();
        return res.json(null);
      }
    }

    res.json(session || null);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/focus/team/:projectId — who is in focus mode
router.get('/team/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const sessions = await FocusSession.find({
      project: req.params.projectId,
      active: true,
    })
      .populate('user', 'name profilePicture')
      .populate('task', 'title');

    // Filter out expired sessions
    const now = Date.now();
    const activeSessions = sessions.filter((s) => {
      const elapsed = (now - s.startTime) / (1000 * 60);
      return elapsed < s.durationMinutes;
    });

    res.json(activeSessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/focus/stats — weekly focus stats for current user
router.get('/stats', auth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 7, 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = await FocusSession.find({
      user: req.user._id,
      startTime: { $gte: since },
    }).sort({ startTime: -1 });

    let totalMinutes = 0;
    sessions.forEach((s) => {
      if (s.endTime) {
        totalMinutes += (s.endTime - s.startTime) / (1000 * 60);
      } else if (s.active) {
        const elapsed = (Date.now() - s.startTime) / (1000 * 60);
        totalMinutes += Math.min(elapsed, s.durationMinutes);
      }
    });

    res.json({
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalMinutes),
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      avgSessionMinutes:
        sessions.length > 0
          ? Math.round(totalMinutes / sessions.length)
          : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

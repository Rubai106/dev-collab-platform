const express = require('express');
const { body, validationResult } = require('express-validator');
const MoodCheckin = require('../models/MoodCheckin');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/mood — daily check-in
router.post(
  '/',
  auth,
  [
    body('energy').isInt({ min: 1, max: 5 }).withMessage('Energy must be 1-5'),
    body('mood')
      .isIn(['focused', 'drained', 'creative', 'routine'])
      .withMessage('Invalid mood'),
    body('note').optional().isLength({ max: 200 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const today = new Date().toISOString().split('T')[0];

      const existing = await MoodCheckin.findOne({
        user: req.user._id,
        date: today,
      });

      if (existing) {
        existing.energy = req.body.energy;
        existing.mood = req.body.mood;
        existing.note = req.body.note || '';
        await existing.save();
        return res.json(existing);
      }

      const checkin = await MoodCheckin.create({
        user: req.user._id,
        energy: req.body.energy,
        mood: req.body.mood,
        note: req.body.note || '',
        date: today,
      });

      res.status(201).json(checkin);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/mood/today — get today's check-in
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkin = await MoodCheckin.findOne({
      user: req.user._id,
      date: today,
    });
    res.json(checkin || null);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mood/history — get user's mood history (last 30 days)
router.get('/history', auth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const checkins = await MoodCheckin.find({
      user: req.user._id,
      createdAt: { $gte: since },
    }).sort({ date: -1 });

    res.json(checkins);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mood/team/:projectId — team energy trends (anonymous)
router.get('/team/:projectId', auth, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const days = Math.min(parseInt(req.query.days) || 14, 30);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const memberIds = project.members;
    const checkins = await MoodCheckin.find({
      user: { $in: memberIds },
      createdAt: { $gte: since },
    }).sort({ date: 1 });

    // Aggregate anonymously by date
    const byDate = {};
    checkins.forEach((c) => {
      if (!byDate[c.date]) {
        byDate[c.date] = { energySum: 0, count: 0, moods: {} };
      }
      byDate[c.date].energySum += c.energy;
      byDate[c.date].count++;
      byDate[c.date].moods[c.mood] = (byDate[c.date].moods[c.mood] || 0) + 1;
    });

    const trends = Object.entries(byDate).map(([date, data]) => ({
      date,
      avgEnergy: Math.round((data.energySum / data.count) * 10) / 10,
      checkInCount: data.count,
      moods: data.moods,
    }));

    // Streak detection — how many consecutive days below 3 avg energy
    const drainedDays = trends
      .slice(-7)
      .filter((t) => t.avgEnergy < 3).length;

    res.json({
      trends,
      alerts: {
        teamDrainedDays: drainedDays,
        warning: drainedDays >= 3,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/mood/suggest-tasks/:projectId — smart task suggestions
router.get('/suggest-tasks/:projectId', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkin = await MoodCheckin.findOne({
      user: req.user._id,
      date: today,
    });

    if (!checkin) {
      return res.json({ suggestion: null, message: 'No check-in today' });
    }

    const Project = require('../models/Project');
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    let priorityFilter = {};
    let suggestion = '';

    if (checkin.mood === 'drained' || checkin.energy <= 2) {
      priorityFilter = { priority: 'Low' };
      suggestion = 'You seem low on energy. Here are some lighter tasks:';
    } else if (checkin.mood === 'creative' || checkin.energy >= 4) {
      priorityFilter = { priority: 'High' };
      suggestion = 'You are feeling great! Take on a challenge:';
    } else if (checkin.mood === 'focused') {
      priorityFilter = { priority: { $in: ['Medium', 'High'] } };
      suggestion = 'You are focused — tackle these important tasks:';
    } else {
      priorityFilter = { priority: 'Medium' };
      suggestion = 'Here are some routine tasks to keep the momentum:';
    }

    const tasks = await Task.find({
      project: req.params.projectId,
      status: { $ne: 'Completed' },
      ...priorityFilter,
    })
      .populate('assignedTo', 'name profilePicture')
      .sort({ order: 1 })
      .limit(5);

    res.json({ suggestion, mood: checkin.mood, energy: checkin.energy, tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

// Log an event
router.post('/event', auth, async (req, res) => {
  try {
    const { eventType, project, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ message: 'Event type is required' });
    }

    const event = await Analytics.create({
      user: req.user.id,
      project,
      eventType,
      metadata: metadata || {},
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get task statistics
    const tasksCreated = await Task.countDocuments({
      createdBy: req.user.id,
      createdAt: { $gte: startDate },
    });

    const tasksCompleted = await Task.countDocuments({
      assignedTo: req.user.id,
      status: 'Completed',
      updatedAt: { $gte: startDate },
    });

    // Get analytics events
    const events = await Analytics.find({
      user: req.user.id,
      createdAt: { $gte: startDate },
    });

    // Breakdown by event type
    const eventBreakdown = {};
    events.forEach((event) => {
      eventBreakdown[event.eventType] = (eventBreakdown[event.eventType] || 0) + 1;
    });

    // Get activity timeline (past 7 days)
    const activityTimeline = await Analytics.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      period: { days, startDate },
      summary: {
        tasksCreated,
        tasksCompleted,
        totalEvents: events.length,
      },
      eventBreakdown,
      activityTimeline,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project analytics
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Task metrics
    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({
      project: projectId,
      status: 'Completed',
    });
    const inProgressTasks = await Task.countDocuments({
      project: projectId,
      status: 'In Progress',
    });

    // Team activity
    const teamEvents = await Analytics.find({
      project: projectId,
      createdAt: { $gte: startDate },
    });

    // Top contributors
    const contributorStats = await Analytics.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
    ]);

    res.json({
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        completionRate:
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
      },
      teamActivity: teamEvents.length,
      topContributors: contributorStats.map((stat) => ({
        user: stat.userInfo[0],
        contributions: stat.count,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity feed
router.get('/feed', auth, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;

    const feed = await Analytics.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('project', 'title')
      .lean();

    const total = await Analytics.countDocuments({ user: req.user.id });

    res.json({
      feed,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

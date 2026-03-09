const express = require('express');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/catchup/:projectId — personalized "Catch Me Up" summary
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name profilePicture');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    // Default to last 3 days, max 30 days
    const daysParam = Math.min(parseInt(req.query.days) || 3, 30);
    const since = new Date();
    since.setDate(since.getDate() - daysParam);

    const [tasks, messages, notifications] = await Promise.all([
      Task.find({
        project: req.params.projectId,
        updatedAt: { $gte: since },
      })
        .populate('assignedTo', 'name profilePicture')
        .populate('createdBy', 'name')
        .sort({ updatedAt: -1 }),
      Message.find({
        project: req.params.projectId,
        createdAt: { $gte: since },
      })
        .populate('sender', 'name profilePicture')
        .sort({ createdAt: -1 })
        .limit(100),
      Notification.find({
        recipient: req.user._id,
        project: req.params.projectId,
        createdAt: { $gte: since },
      }).sort({ createdAt: -1 }),
    ]);

    // Tasks involving the current user
    const myReassignedTasks = tasks.filter(
      (t) => t.assignedTo && t.assignedTo._id.toString() !== req.user._id.toString()
    );

    const newTasksCreated = tasks.filter(
      (t) => t.createdAt >= since
    );

    const completedTasks = tasks.filter((t) => t.status === 'Completed');
    const inProgressTasks = tasks.filter((t) => t.status === 'In Progress');

    // Summarize messages by sender
    const messageSummary = {};
    messages.forEach((m) => {
      const name = m.sender?.name || 'Unknown';
      if (!messageSummary[name]) messageSummary[name] = 0;
      messageSummary[name]++;
    });

    // Active discussions — senders with most messages
    const topDiscussions = Object.entries(messageSummary)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, messageCount: count }));

    const summary = {
      period: { days: daysParam, since: since.toISOString() },
      tasks: {
        newCreated: newTasksCreated.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        total: tasks.length,
        items: tasks.slice(0, 20),
      },
      messages: {
        totalCount: messages.length,
        topDiscussions,
        recentMessages: messages.slice(0, 10),
      },
      notifications: {
        count: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
        items: notifications.slice(0, 15),
      },
      team: {
        members: project.members,
        memberCount: project.members.length,
      },
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

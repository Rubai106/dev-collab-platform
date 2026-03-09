const express = require('express');
const Task = require('../models/Task');
const Message = require('../models/Message');
const Blocker = require('../models/Blocker');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/contributions/:projectId — contribution equity dashboard
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name profilePicture skills');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a project member' });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();

    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const since = new Date();
    since.setDate(since.getDate() - days);

    const memberIds = project.members.map((m) => m._id);

    const [allTasks, messages, resolvedBlockers] = await Promise.all([
      Task.find({ project: project._id }),
      Message.find({
        project: project._id,
        createdAt: { $gte: since },
      }),
      Blocker.find({
        project: project._id,
        status: 'resolved',
        resolvedBy: { $in: memberIds },
      }),
    ]);

    const priorityWeight = { Low: 1, Medium: 2, High: 3 };

    const contributions = project.members.map((member) => {
      const memberId = member._id.toString();

      // Tasks
      const tasksCreated = allTasks.filter(
        (t) => t.createdBy?.toString() === memberId
      ).length;
      const tasksCompleted = allTasks.filter(
        (t) =>
          t.assignedTo?.toString() === memberId && t.status === 'Completed'
      );
      const taskScore = tasksCompleted.reduce(
        (sum, t) => sum + (priorityWeight[t.priority] || 1),
        0
      );

      // Messages
      const messageCount = messages.filter(
        (m) => m.sender?.toString() === memberId
      ).length;

      // Blocker resolutions
      const blockersResolved = resolvedBlockers.filter(
        (b) => b.resolvedBy?.toString() === memberId
      ).length;

      // Task type breakdown
      const tasksByPriority = { Low: 0, Medium: 0, High: 0 };
      tasksCompleted.forEach((t) => {
        tasksByPriority[t.priority] = (tasksByPriority[t.priority] || 0) + 1;
      });

      const totalScore = taskScore + messageCount * 0.1 + blockersResolved * 3;

      return {
        member: {
          _id: member._id,
          name: member.name,
          profilePicture: member.profilePicture,
        },
        tasksCreated,
        tasksCompleted: tasksCompleted.length,
        taskScore,
        tasksByPriority,
        messageCount,
        blockersResolved,
        totalScore: Math.round(totalScore * 10) / 10,
      };
    });

    // Calculate fairness score (0-100, 100 = perfectly equal)
    const scores = contributions.map((c) => c.totalScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length || 1;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) /
        scores.length || 0;
    const stdDev = Math.sqrt(variance);
    const cv = avgScore > 0 ? stdDev / avgScore : 0;
    const fairnessScore = Math.max(0, Math.round((1 - cv) * 100));

    res.json({
      contributions: contributions.sort((a, b) => b.totalScore - a.totalScore),
      fairness: {
        score: fairnessScore,
        avgScore: Math.round(avgScore * 10) / 10,
        // Only owner can see detailed fairness breakdown
        detailed: isOwner,
      },
      period: { days, since: since.toISOString() },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

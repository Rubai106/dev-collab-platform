const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/pairing/:projectId — get skill-gap pairing suggestions
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

    const currentUser = project.members.find(
      (m) => m._id.toString() === req.user._id.toString()
    );
    const userSkills = (currentUser?.skills || []).map((s) => s.toLowerCase());

    // Get tasks completed by each member to verify practical skill usage
    const tasksByMember = await Task.aggregate([
      { $match: { project: project._id, status: 'Completed', assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          completedCount: { $sum: 1 },
          taskTitles: { $push: '$title' },
        },
      },
    ]);

    const taskMap = {};
    tasksByMember.forEach((t) => {
      taskMap[t._id.toString()] = t;
    });

    // Find members with complementary skills
    const suggestions = project.members
      .filter((m) => m._id.toString() !== req.user._id.toString())
      .map((member) => {
        const memberSkills = (member.skills || []).map((s) => s.toLowerCase());
        // Skills they have that user doesn't
        const canTeach = memberSkills.filter((s) => !userSkills.includes(s));
        // Skills user has that they don't
        const canLearn = userSkills.filter((s) => !memberSkills.includes(s));
        // Shared skills
        const shared = memberSkills.filter((s) => userSkills.includes(s));

        const completedTasks = taskMap[member._id.toString()]?.completedCount || 0;

        return {
          member: {
            _id: member._id,
            name: member.name,
            profilePicture: member.profilePicture,
            skills: member.skills,
          },
          canTeachYou: canTeach,
          youCanTeach: canLearn,
          sharedSkills: shared,
          completedTasks,
          complementaryScore: canTeach.length + canLearn.length,
        };
      })
      .sort((a, b) => b.complementaryScore - a.complementaryScore);

    // Mode: "need help" or "want to learn"
    const mode = req.query.mode || 'learn';
    let filtered = suggestions;
    if (mode === 'help' && req.query.skill) {
      const skill = req.query.skill.toLowerCase();
      filtered = suggestions.filter((s) =>
        s.canTeachYou.some((t) => t.includes(skill))
      );
    }

    res.json({
      yourSkills: currentUser?.skills || [],
      suggestions: filtered,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

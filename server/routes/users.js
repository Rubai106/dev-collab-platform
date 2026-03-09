const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?q=keyword
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { skills: { $in: [new RegExp(query, 'i')] } },
      ],
      _id: { $ne: req.user._id },
    }).limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/profile
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty(),
    body('bio').optional().isLength({ max: 300 }),
    body('skills').optional().isArray(),
    body('githubLink').optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const allowedFields = ['name', 'bio', 'skills', 'githubLink', 'profilePicture'];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

const mongoose = require('mongoose');

const moodCheckinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    energy: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    mood: {
      type: String,
      enum: ['focused', 'drained', 'creative', 'routine'],
      required: true,
    },
    note: {
      type: String,
      maxlength: 200,
      default: '',
    },
    date: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

moodCheckinSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MoodCheckin', moodCheckinSchema);

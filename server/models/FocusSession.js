const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    taskTitle: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 120,
      min: 15,
      max: 480,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

focusSessionSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('FocusSession', focusSessionSchema);

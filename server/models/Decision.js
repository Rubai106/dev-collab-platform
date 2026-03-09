const mongoose = require('mongoose');

const decisionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Decision title is required'],
      trim: true,
      maxlength: 200,
    },
    decision: {
      type: String,
      required: [true, 'Decision description is required'],
      maxlength: 2000,
    },
    alternatives: [
      {
        text: { type: String, maxlength: 500 },
      },
    ],
    reasoning: {
      type: String,
      maxlength: 2000,
      default: '',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

decisionSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('Decision', decisionSchema);

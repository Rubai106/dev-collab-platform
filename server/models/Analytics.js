const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'task_created',
        'task_completed',
        'task_assigned',
        'project_joined',
        'focus_session_started',
        'focus_session_ended',
        'message_sent',
        'decision_made',
        'blocker_reported',
        'tech_debt_logged',
      ],
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Add compound indexes for performance
analyticsSchema.index({ user: 1, createdAt: -1 });
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ project: 1, eventType: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);

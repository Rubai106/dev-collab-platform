const Task = require('../models/Task');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Blocker = require('../models/Blocker');
const Decision = require('../models/Decision');
const TechDebt = require('../models/TechDebt');
const FocusSession = require('../models/FocusSession');

async function deleteProjectResources(projectId, session) {
  const options = session ? { session } : undefined;

  await Promise.all([
    Task.deleteMany({ project: projectId }, options),
    Message.deleteMany({ project: projectId }, options),
    Notification.deleteMany({ project: projectId }, options),
    Blocker.deleteMany({ project: projectId }, options),
    Decision.deleteMany({ project: projectId }, options),
    TechDebt.deleteMany({ project: projectId }, options),
    FocusSession.deleteMany({ project: projectId }, options),
  ]);
}

module.exports = { deleteProjectResources };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const onlineUsers = new Map();

function initializeSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName}`);
    onlineUsers.set(socket.userId, socket.id);

    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    socket.on('joinRoom', (projectId) => {
      socket.join(projectId);
      console.log(`${socket.userName} joined room ${projectId}`);
    });

    socket.on('leaveRoom', (projectId) => {
      socket.leave(projectId);
    });

    socket.on('sendMessage', (data) => {
      io.to(data.projectId).emit('newMessage', {
        _id: data._id,
        text: data.text,
        sender: {
          _id: socket.userId,
          name: socket.userName,
        },
        project: data.projectId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on('typing', (data) => {
      socket.to(data.projectId).emit('userTyping', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(data.projectId).emit('userStopTyping', {
        userId: socket.userId,
      });
    });

    socket.on('sendNotification', (data) => {
      const recipientSocketId = onlineUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('newNotification', data.notification);
      }
    });

    socket.on('taskUpdate', (data) => {
      io.to(data.projectId).emit('taskUpdated', data);
    });

    socket.on('focusStart', (data) => {
      io.to(data.projectId).emit('memberFocusStart', {
        userId: socket.userId,
        userName: socket.userName,
        taskTitle: data.taskTitle || '',
        durationMinutes: data.durationMinutes || 120,
      });
    });

    socket.on('focusEnd', (data) => {
      io.to(data.projectId).emit('memberFocusEnd', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('blockerUpdate', (data) => {
      io.to(data.projectId).emit('blockerUpdated', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName}`);
      onlineUsers.delete(socket.userId);
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });
}

module.exports = { initializeSocket, onlineUsers };

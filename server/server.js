const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/catchup', require('./routes/catchup'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/decisions', require('./routes/decisions'));
app.use('/api/blockers', require('./routes/blockers'));
app.use('/api/pairing', require('./routes/pairing'));
app.use('/api/techdebt', require('./routes/techdebt'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/contributions', require('./routes/contributions'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ status: 'DevCollab API running', timestamp: new Date().toISOString() });
});

// Socket.io
initializeSocket(io);

// Start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

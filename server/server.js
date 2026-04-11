const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const compression = require('compression');
const connectDB = require('./config/db');
const { initializeSocket } = require('./socket/socket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Add compression middleware for faster responses
app.use(compression());
app.use(helmet());

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : ['http://localhost:5173', 'http://localhost:3000'];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.length === 0) return true;
  return allowedOrigins.some(allowed => 
    allowed === origin || 
    (allowed.includes('*') && new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$').test(origin))
  );
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS for Socket.io`));
    },
    methods: corsOptions.methods,
    credentials: true
  },
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add caching middleware for GET requests
const { cacheMiddleware } = require('./middleware/cache');
app.use('/api', cacheMiddleware);

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
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ status: 'DevCollab API running', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
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

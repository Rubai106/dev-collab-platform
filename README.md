# DevCollab - Developer Collaboration Platform

A full-stack MERN application for developer collaboration — a mini GitHub + Trello + Discord for developers.

## Features

- **Authentication**: JWT-based registration/login
- **Project Management**: Create, browse, join projects with team management
- **Task Boards**: Drag-and-drop Kanban boards (To Do / In Progress / Completed)
- **Real-time Chat**: Socket.io-powered project chat with typing indicators
- **Notifications**: Real-time notifications for join requests, approvals, task assignments
- **Dark/Light Mode**: Full theme support with CSS custom properties
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- express-validator

### Frontend
- React 18 + Vite
- React Router v6
- Socket.io Client
- react-beautiful-dnd
- react-icons + react-hot-toast

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup

1. **Clone & install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Configure environment**: Copy `.env.example` to `.env` and update:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/dev-collab
   JWT_SECRET=your-secret-key-change-this
   CLIENT_URL=http://localhost:5173
   ```

3. **Install frontend dependencies**:
   ```bash
   cd client
   npm install
   ```

4. **Run the app**:
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

5. Visit `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/users/search?q= | Search users |
| GET | /api/users/:id | Get user by ID |
| PUT | /api/users/profile | Update profile |
| GET | /api/projects | List all projects |
| GET | /api/projects/my | List user's projects |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| POST | /api/projects/:id/join | Request to join |
| POST | /api/projects/:id/approve/:uid | Approve join request |
| POST | /api/projects/:id/reject/:uid | Reject join request |
| POST | /api/projects/:id/leave | Leave project |
| GET | /api/tasks/project/:pid | Get project tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PUT | /api/tasks/reorder/batch | Batch reorder tasks |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/messages/:pid | Get messages (paginated) |
| POST | /api/messages | Send message |
| GET | /api/notifications | Get notifications |
| GET | /api/notifications/unread-count | Unread count |
| PUT | /api/notifications/read-all | Mark all read |
| PUT | /api/notifications/:id/read | Mark one read |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| joinRoom | Client → Server | Join a project room |
| leaveRoom | Client → Server | Leave a project room |
| sendMessage | Client → Server | Send chat message |
| newMessage | Server → Client | Receive chat message |
| typing | Bidirectional | User typing indicator |
| stopTyping | Bidirectional | User stopped typing |
| taskUpdate | Client → Server | Task board changed |
| taskUpdated | Server → Client | Receive task update |
| sendNotification | Client → Server | Trigger notification |
| notification | Server → Client | Receive notification |
| onlineUsers | Server → Client | Online users list |

## Project Structure

```
dev-collab-platform/
├── server/
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/ (User, Project, Task, Message, Notification)
│   ├── routes/ (auth, users, projects, tasks, messages, notifications)
│   ├── socket/socket.js
│   └── server.js
├── client/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/ (Navbar, PrivateRoute, TaskCard, TaskColumn, TaskModal, NotificationBell)
│   │   ├── context/ (AuthContext, SocketContext, ThemeContext)
│   │   ├── pages/ (Landing, Login, Register, Dashboard, Projects, CreateProject, ProjectDetails, TaskBoard, Chat, Profile)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── index.html
└── README.md
```

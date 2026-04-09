# DevCollab - Developer Collaboration Platform

A full-stack MERN app for developer collaboration: a mini GitHub + Trello + Discord for project teams.

## Features

- JWT-based authentication
- Project creation, discovery, and team management
- Kanban task boards
- Real-time chat and notifications with Socket.IO
- Dark/light theme support
- Responsive UI for desktop and mobile

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT

### Frontend
- React 18
- Vite
- React Router v6
- Socket.IO Client
- react-beautiful-dnd

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB local instance or MongoDB Atlas

### Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Create `server/.env` from `server/.env.example` and update the values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/dev-collab
JWT_SECRET=change-this-secret
CLIENT_URL=http://localhost:5173
```

3. Start the backend:

```bash
npm run dev:server
```

4. Start the frontend in a second terminal:

```bash
npm run dev:client
```

5. Open `http://localhost:5173`

The Vite dev server proxies `/api` to `http://localhost:5000`, so local development still works without a frontend env file.

## Production Deployment

This repo is now wired for a single-origin deployment where the Express server serves the built React app in production. That is the recommended setup because it keeps:

- the React app
- the Express API
- the Socket.IO server

on the same public URL.

### Recommended: Render web service

The repo includes [render.yaml](./render.yaml) for a Node web service deployment.

1. Push this repo to GitHub.
2. Create a new Render Blueprint or Web Service from the repo.
3. Set these environment variables in Render:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-production-secret
CLIENT_URL=https://your-render-app.onrender.com
```

4. Deploy.
5. After the first successful deploy, update the repository homepage on GitHub to your new Render URL if you want the GitHub "website" link to point to the working deployment.

### Optional: Split frontend/backend deployment

If you still want a Vercel frontend plus a separate backend host:

1. Deploy the backend somewhere that supports long-running Node processes and WebSockets, such as Render or Railway.
2. In the frontend deployment, set:

```env
VITE_API_URL=https://your-backend.example.com/api
VITE_SOCKET_URL=https://your-backend.example.com
```

You can copy `client/.env.example` for local reference.

## Environment Files

### Server

See [server/.env.example](./server/.env.example).

### Client

The client env file is optional. See [client/.env.example](./client/.env.example).

- Leave it empty for same-origin deployments where Express serves the frontend.
- Set `VITE_API_URL` and optionally `VITE_SOCKET_URL` for split deployments.

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
| GET | /api/messages/:pid | Get messages |
| POST | /api/messages | Send message |
| GET | /api/notifications | Get notifications |
| GET | /api/notifications/unread-count | Unread count |
| PUT | /api/notifications/read-all | Mark all read |
| PUT | /api/notifications/:id/read | Mark one read |
| GET | /api/health | Health check |

## Project Structure

```text
dev-collab-platform/
|-- client/
|   |-- src/
|   |-- .env.example
|   |-- package.json
|   `-- vercel.json
|-- server/
|   |-- config/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- socket/
|   |-- .env.example
|   `-- server.js
|-- package.json
|-- render.yaml
`-- README.md
```

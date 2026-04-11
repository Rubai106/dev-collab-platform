# DevCollab - Developer Collaboration Platform

A full-stack MERN application designed for seamless developer collaboration. DevCollab merges the best aspects of version integration, Kanban task management, and real-time communication into a unified workspace.

## Features

- **Secure Authentication**: JWT-based user login and management.
- **Project Discovery**: Create diverse projects, manage team size, and invite members.
- **Task Boards**: Drag-and-drop Kanban boards for efficient sprint tracking.
- **Live Communication**: Real-time integrated team chat powered by Socket.IO.
- **Dynamic Theming**: Premium responsive UI with built-in dark and light modes.

## Tech Stack

**Frontend**: React 18, Vite, React Router, Socket.IO Client
**Backend**: Node.js, Express, MongoDB, Socket.IO

## Local Setup

1. Install all dependencies from the root directory:
```bash
npm run install:all
```

2. Create the backend environment file (`server/.env`) using `.env.example` as a template and provide your local metrics:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dev-collab
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

3. Spin up the backend and frontend simultaneously in separate terminals:
```bash
npm run dev:server
npm run dev:client
```

4. Open your browser to `http://localhost:5173` to view the live environment.

## Deployment

DevCollab supports flexible split-stack deployment structures (e.g., Vercel for frontend, Render/Railway for backend). 

Make sure to map the frontend environment values (`client/.env`) properly:
```env
VITE_API_URL=https://your-backend-api.com/api
VITE_SOCKET_URL=https://your-backend-api.com
```

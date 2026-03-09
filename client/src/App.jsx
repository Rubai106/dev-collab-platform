import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import TaskBoard from './pages/TaskBoard';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import CatchUp from './pages/CatchUp';
import MoodCheckIn from './pages/MoodCheckIn';
import DecisionJournal from './pages/DecisionJournal';
import BlockerBoard from './pages/BlockerBoard';
import SkillPairing from './pages/SkillPairing';
import TechDebtTracker from './pages/TechDebtTracker';
import FocusMode from './pages/FocusMode';
import ContributionDashboard from './pages/ContributionDashboard';

function App() {
  return (
    <SocketProvider>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
          <Route path="/projects/create" element={<PrivateRoute><CreateProject /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
          <Route path="/projects/:id/tasks" element={<PrivateRoute><TaskBoard /></PrivateRoute>} />
          <Route path="/projects/:id/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/projects/:id/catchup" element={<PrivateRoute><CatchUp /></PrivateRoute>} />
          <Route path="/projects/:id/mood" element={<PrivateRoute><MoodCheckIn /></PrivateRoute>} />
          <Route path="/projects/:id/decisions" element={<PrivateRoute><DecisionJournal /></PrivateRoute>} />
          <Route path="/projects/:id/blockers" element={<PrivateRoute><BlockerBoard /></PrivateRoute>} />
          <Route path="/projects/:id/pairing" element={<PrivateRoute><SkillPairing /></PrivateRoute>} />
          <Route path="/projects/:id/techdebt" element={<PrivateRoute><TechDebtTracker /></PrivateRoute>} />
          <Route path="/projects/:id/focus" element={<PrivateRoute><FocusMode /></PrivateRoute>} />
          <Route path="/projects/:id/contributions" element={<PrivateRoute><ContributionDashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </main>
    </SocketProvider>
  );
}

export default App;

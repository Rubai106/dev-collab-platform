import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const CreateProject = lazy(() => import('./pages/CreateProject'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const CatchUp = lazy(() => import('./pages/CatchUp'));
const MoodCheckIn = lazy(() => import('./pages/MoodCheckIn'));
const DecisionJournal = lazy(() => import('./pages/DecisionJournal'));
const BlockerBoard = lazy(() => import('./pages/BlockerBoard'));
const SkillPairing = lazy(() => import('./pages/SkillPairing'));
const TechDebtTracker = lazy(() => import('./pages/TechDebtTracker'));
const FocusMode = lazy(() => import('./pages/FocusMode'));
const ContributionDashboard = lazy(() => import('./pages/ContributionDashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const QuickSearch = lazy(() => import('./pages/QuickSearch'));

// Loading component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e5e7eb',
      borderTopColor: '#7c3aed',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      '@keyframes spin': {
        'from': { transform: 'rotate(0deg)' },
        'to': { transform: 'rotate(360deg)' }
      }
    }} />
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <SocketProvider>
      <Navbar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
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
            <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
            <Route path="/search" element={<PrivateRoute><QuickSearch /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </main>
    </SocketProvider>
  );
}

export default App;

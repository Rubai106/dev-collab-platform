import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiTarget, FiArrowLeft, FiPlay, FiSquare, FiClock, FiUsers } from 'react-icons/fi';

const FocusMode = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeSession, setActiveSession] = useState(null);
  const [teamFocus, setTeamFocus] = useState([]);
  const [stats, setStats] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState('');
  const [duration, setDuration] = useState(120);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const [activeRes, teamRes, statsRes, projRes, tasksRes] = await Promise.all([
        api.get('/focus/active'),
        api.get(`/focus/team/${projectId}`),
        api.get('/focus/stats'),
        api.get(`/projects/${projectId}`),
        api.get(`/tasks/project/${projectId}`),
      ]);
      setActiveSession(activeRes.data);
      setTeamFocus(teamRes.data);
      setStats(statsRes.data);
      setProject(projRes.data);
      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTasks(tasksData.filter((t) => t.status !== 'Completed'));
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (activeSession) {
      const updateElapsed = () => {
        const mins = (Date.now() - new Date(activeSession.startTime)) / (1000 * 60);
        setElapsed(Math.floor(mins));
      };
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 60000);
      return () => clearInterval(timerRef.current);
    } else {
      setElapsed(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeSession]);

  useEffect(() => {
    if (socket) {
      socket.emit('joinRoom', projectId);
      socket.on('memberFocusStart', (data) => {
        setTeamFocus((prev) => {
          if (prev.some((s) => s.user?._id === data.userId)) return prev;
          return [...prev, { user: { _id: data.userId, name: data.userName }, taskTitle: data.taskTitle }];
        });
      });
      socket.on('memberFocusEnd', (data) => {
        setTeamFocus((prev) => prev.filter((s) => s.user?._id !== data.userId));
      });
      return () => {
        socket.emit('leaveRoom', projectId);
        socket.off('memberFocusStart');
        socket.off('memberFocusEnd');
      };
    }
  }, [socket, projectId]);

  const handleStart = async () => {
    try {
      const taskObj = tasks.find((t) => t._id === selectedTask);
      const res = await api.post('/focus/start', {
        project: projectId,
        task: selectedTask || null,
        taskTitle: taskObj?.title || '',
        durationMinutes: duration,
      });
      setActiveSession(res.data);
      toast.success('Focus mode started! 🎯');
      if (socket) {
        socket.emit('focusStart', {
          projectId,
          taskTitle: taskObj?.title || '',
          durationMinutes: duration,
        });
      }
    } catch (err) {
      toast.error('Failed to start focus session');
    }
  };

  const handleEnd = async () => {
    try {
      await api.post('/focus/end');
      setActiveSession(null);
      toast.success('Focus session ended');
      if (socket) socket.emit('focusEnd', { projectId });
      // Refresh stats
      const statsRes = await api.get('/focus/stats');
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed');
    }
  };

  const remaining = activeSession
    ? Math.max(0, (activeSession.durationMinutes || 120) - elapsed)
    : 0;

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="focus-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiTarget /> Focus Time</h1>
        </div>
      </div>

      <div className="focus-grid">
        {/* Focus Control */}
        <div className="focus-card focus-control">
          {activeSession ? (
            <div className="active-focus">
              <div className="focus-timer">
                <div className="timer-circle">
                  <span className="timer-remaining">{remaining}</span>
                  <span className="timer-label">min left</span>
                </div>
              </div>
              <h3>🎯 Deep Work Mode Active</h3>
              {activeSession.taskTitle && (
                <p className="focus-task">Working on: <strong>{activeSession.taskTitle}</strong></p>
              )}
              <p className="focus-info">
                Started {elapsed} min ago · {activeSession.durationMinutes}min session
              </p>
              <button className="btn btn-danger" onClick={handleEnd}>
                <FiSquare /> End Focus Session
              </button>
            </div>
          ) : (
            <div className="start-focus">
              <h3>Start a Focus Session</h3>
              <p className="focus-subtitle">
                Your teammates will see you're in deep work. Notifications will be marked as queued.
              </p>
              <div className="form-group">
                <label>What are you working on?</label>
                <select
                  value={selectedTask}
                  onChange={(e) => setSelectedTask(e.target.value)}
                >
                  <option value="">Select a task (optional)</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Duration</label>
                <div className="duration-options">
                  {[30, 60, 90, 120, 180].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`duration-btn ${duration === d ? 'active' : ''}`}
                      onClick={() => setDuration(d)}
                    >
                      {d >= 60 ? `${d / 60}h` : `${d}m`}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-block" onClick={handleStart}>
                <FiPlay /> Start Focus Mode
              </button>
            </div>
          )}
        </div>

        {/* Team Focus Status */}
        <div className="focus-card">
          <h3><FiUsers /> Team Focus Status</h3>
          {teamFocus.length === 0 ? (
            <p className="empty-text">No one is in focus mode right now.</p>
          ) : (
            <div className="team-focus-list">
              {teamFocus.map((s) => (
                <div key={s.user?._id || s._id} className="team-focus-item">
                  <div className="focus-indicator"></div>
                  <div className="avatar-small">
                    {s.user?.profilePicture ? (
                      <img src={s.user.profilePicture} alt={s.user.name} />
                    ) : (
                      <span>{s.user?.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <strong>{s.user?.name}</strong>
                    {(s.taskTitle || s.task?.title) && (
                      <small>Working on: {s.taskTitle || s.task?.title}</small>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Stats */}
        {stats && (
          <div className="focus-card">
            <h3><FiClock /> Your Weekly Focus Stats</h3>
            <div className="focus-stats">
              <div className="focus-stat">
                <span className="stat-number">{stats.totalHours}</span>
                <span className="stat-label">Hours Focused</span>
              </div>
              <div className="focus-stat">
                <span className="stat-number">{stats.totalSessions}</span>
                <span className="stat-label">Sessions</span>
              </div>
              <div className="focus-stat">
                <span className="stat-number">{stats.avgSessionMinutes}</span>
                <span className="stat-label">Avg Minutes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusMode;

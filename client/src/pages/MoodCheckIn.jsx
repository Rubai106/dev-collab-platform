import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSmile, FiZap, FiSun, FiCoffee, FiRepeat, FiArrowLeft, FiTrendingUp } from 'react-icons/fi';

const moodIcons = {
  focused: <FiZap />,
  drained: <FiCoffee />,
  creative: <FiSun />,
  routine: <FiRepeat />,
};

const moodLabels = {
  focused: 'Focused',
  drained: 'Drained',
  creative: 'Creative',
  routine: 'Routine',
};

const MoodCheckIn = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [energy, setEnergy] = useState(3);
  const [mood, setMood] = useState('focused');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [teamTrends, setTeamTrends] = useState(null);
  const [suggestedTasks, setSuggestedTasks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [todayRes, historyRes, teamRes] = await Promise.all([
          api.get('/mood/today'),
          api.get('/mood/history?days=14'),
          api.get(`/mood/team/${projectId}`),
        ]);
        setTodayCheckin(todayRes.data);
        setHistory(historyRes.data);
        setTeamTrends(teamRes.data);
        if (todayRes.data) {
          setEnergy(todayRes.data.energy);
          setMood(todayRes.data.mood);
          setNote(todayRes.data.note || '');
          // Fetch suggestions if checked in
          const sugRes = await api.get(`/mood/suggest-tasks/${projectId}`);
          setSuggestedTasks(sugRes.data);
        }
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleCheckin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/mood', { energy, mood, note });
      setTodayCheckin(res.data);
      toast.success('Check-in recorded!');
      const sugRes = await api.get(`/mood/suggest-tasks/${projectId}`);
      setSuggestedTasks(sugRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="mood-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiSmile /> Energy & Mood</h1>
        </div>
      </div>

      <div className="mood-grid">
        {/* Check-in Card */}
        <div className="mood-card checkin-card">
          <h3>{todayCheckin ? 'Update Today\'s Check-In' : 'How are you feeling today?'}</h3>
          <form onSubmit={handleCheckin}>
            <div className="energy-selector">
              <label>Energy Level</label>
              <div className="energy-bars">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`energy-bar ${energy >= level ? 'active' : ''} level-${level}`}
                    onClick={() => setEnergy(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="energy-labels">
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
            </div>

            <div className="mood-selector">
              <label>Mood</label>
              <div className="mood-options">
                {Object.entries(moodLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`mood-option ${mood === key ? 'selected' : ''}`}
                    onClick={() => setMood(key)}
                  >
                    {moodIcons[key]} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Quick note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything on your mind?"
                maxLength={200}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              {todayCheckin ? 'Update Check-In' : 'Check In'}
            </button>
          </form>
        </div>

        {/* Suggested Tasks */}
        {suggestedTasks?.suggestion && (
          <div className="mood-card suggestions-card">
            <h3><FiZap /> Smart Task Suggestions</h3>
            <p className="suggestion-text">{suggestedTasks.suggestion}</p>
            {suggestedTasks.tasks?.length > 0 ? (
              <div className="suggested-tasks">
                {suggestedTasks.tasks.map((task) => (
                  <div key={task._id} className="suggested-task-item">
                    <div className="task-info">
                      <strong>{task.title}</strong>
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.assignedTo && (
                      <small>Assigned to {task.assignedTo.name}</small>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-text">No matching tasks right now.</p>
            )}
          </div>
        )}

        {/* Personal History */}
        <div className="mood-card history-card">
          <h3>Your 2-Week History</h3>
          {history.length === 0 ? (
            <p className="empty-text">No check-ins yet. Start today!</p>
          ) : (
            <div className="mood-history">
              {history.map((h) => (
                <div key={h._id} className="history-item">
                  <span className="history-date">{h.date}</span>
                  <div className="history-energy">
                    {[1, 2, 3, 4, 5].map((l) => (
                      <span key={l} className={`mini-bar ${h.energy >= l ? 'filled' : ''} level-${l}`}></span>
                    ))}
                  </div>
                  <span className="history-mood">{moodIcons[h.mood]} {moodLabels[h.mood]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Trends */}
        {teamTrends && (
          <div className="mood-card team-card">
            <h3><FiTrendingUp /> Team Energy Trends</h3>
            {teamTrends.alerts?.warning && (
              <div className="team-alert warning">
                ⚠️ Team energy has been low for {teamTrends.alerts.teamDrainedDays} of the last 7 days.
                Consider reducing workload or taking a break.
              </div>
            )}
            {teamTrends.trends.length === 0 ? (
              <p className="empty-text">Not enough data yet. Check in daily!</p>
            ) : (
              <div className="team-trends">
                {teamTrends.trends.slice(-14).map((t) => (
                  <div key={t.date} className="trend-item">
                    <span className="trend-date">{t.date.slice(5)}</span>
                    <div className="trend-bar-container">
                      <div
                        className={`trend-bar ${t.avgEnergy < 3 ? 'low' : t.avgEnergy >= 4 ? 'high' : 'medium'}`}
                        style={{ width: `${(t.avgEnergy / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="trend-value">{t.avgEnergy}</span>
                    <span className="trend-count">({t.checkInCount})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodCheckIn;

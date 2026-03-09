import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { FiClock, FiCheckSquare, FiMessageSquare, FiBell, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const CatchUp = () => {
  const { id: projectId } = useParams();
  const [summary, setSummary] = useState(null);
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/catchup/${projectId}?days=${days}`);
      setSummary(res.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [projectId, days]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!summary) return <div className="empty-state"><p>Could not generate summary.</p></div>;

  return (
    <div className="catchup-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiRefreshCw /> Catch Me Up</h1>
        </div>
        <div className="catchup-controls">
          <label>Period:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Last 24 hours</option>
            <option value={3}>Last 3 days</option>
            <option value={7}>Last week</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last month</option>
          </select>
        </div>
      </div>

      <div className="catchup-grid">
        {/* Task Summary */}
        <div className="catchup-card">
          <div className="catchup-card-header">
            <FiCheckSquare /> <h3>Task Activity</h3>
          </div>
          <div className="catchup-stats">
            <div className="catchup-stat">
              <span className="stat-number">{summary.tasks.newCreated}</span>
              <span className="stat-label">New Tasks</span>
            </div>
            <div className="catchup-stat">
              <span className="stat-number">{summary.tasks.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="catchup-stat">
              <span className="stat-number">{summary.tasks.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          {summary.tasks.items.length > 0 && (
            <div className="catchup-list">
              {summary.tasks.items.slice(0, 8).map((task) => (
                <div key={task._id} className="catchup-item">
                  <span className={`status-dot status-${task.status.toLowerCase().replace(' ', '-')}`}></span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>
                      {task.assignedTo ? `Assigned to ${task.assignedTo.name}` : 'Unassigned'}
                      {' · '}{task.priority} priority
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Summary */}
        <div className="catchup-card">
          <div className="catchup-card-header">
            <FiMessageSquare /> <h3>Conversations</h3>
          </div>
          <div className="catchup-stats">
            <div className="catchup-stat">
              <span className="stat-number">{summary.messages.totalCount}</span>
              <span className="stat-label">Messages</span>
            </div>
          </div>
          {summary.messages.topDiscussions.length > 0 && (
            <>
              <h4 className="catchup-subheader">Most Active</h4>
              <div className="catchup-list">
                {summary.messages.topDiscussions.map((d, i) => (
                  <div key={i} className="catchup-item">
                    <span className="msg-count-badge">{d.messageCount}</span>
                    <span>{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {summary.messages.recentMessages.length > 0 && (
            <>
              <h4 className="catchup-subheader">Recent Messages</h4>
              <div className="catchup-list">
                {summary.messages.recentMessages.slice(0, 5).map((m) => (
                  <div key={m._id} className="catchup-item message-preview">
                    <strong>{m.sender?.name}:</strong>
                    <span>{m.text?.substring(0, 80)}{m.text?.length > 80 ? '...' : ''}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="catchup-card">
          <div className="catchup-card-header">
            <FiBell /> <h3>Your Notifications</h3>
          </div>
          <div className="catchup-stats">
            <div className="catchup-stat">
              <span className="stat-number">{summary.notifications.unread}</span>
              <span className="stat-label">Unread</span>
            </div>
            <div className="catchup-stat">
              <span className="stat-number">{summary.notifications.count}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          {summary.notifications.items.length > 0 && (
            <div className="catchup-list">
              {summary.notifications.items.map((n) => (
                <div key={n._id} className={`catchup-item ${!n.read ? 'unread' : ''}`}>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team */}
        <div className="catchup-card">
          <div className="catchup-card-header">
            <FiClock /> <h3>Team Overview</h3>
          </div>
          <p className="catchup-text">{summary.team.memberCount} team members active in this project.</p>
          <div className="catchup-members">
            {summary.team.members.map((m) => (
              <div key={m._id} className="avatar-small" title={m.name}>
                {m.profilePicture ? (
                  <img src={m.profilePicture} alt={m.name} />
                ) : (
                  <span>{m.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatchUp;

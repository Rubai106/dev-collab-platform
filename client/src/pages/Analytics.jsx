import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiTrendingUp, FiCheckCircle, FiActivity, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Analytics.css';

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchActivityFeed();
  }, [days]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/stats?days=${days}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityFeed = async () => {
    try {
      const response = await api.get('/analytics/feed?limit=10&skip=0');
      setActivityFeed(response.data.feed);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
    }
  };

  const getEventLabel = (eventType) => {
    const labels = {
      task_created: '📝 Created task',
      task_completed: '✅ Completed task',
      task_assigned: '👤 Task assigned',
      project_joined: '🚀 Joined project',
      focus_session_started: '⏱️ Started focus session',
      focus_session_ended: '⏸️ Ended focus session',
      message_sent: '💬 Sent message',
      decision_made: '🎯 Made decision',
      blocker_reported: '⚠️ Reported blocker',
      tech_debt_logged: '📊 Logged tech debt',
    };
    return labels[eventType] || eventType;
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>📊 Your Analytics</h1>
        <div className="analytics-controls">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="days-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FiCheckCircle />
              </div>
              <div className="stat-content">
                <h3>Tasks Completed</h3>
                <p className="stat-value">{stats.summary.tasksCompleted}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiTrendingUp />
              </div>
              <div className="stat-content">
                <h3>Tasks Created</h3>
                <p className="stat-value">{stats.summary.tasksCreated}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiActivity />
              </div>
              <div className="stat-content">
                <h3>Total Events</h3>
                <p className="stat-value">{stats.summary.totalEvents}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FiBarChart2 />
              </div>
              <div className="stat-content">
                <h3>Active Days</h3>
                <p className="stat-value">
                  {Array.isArray(stats.activityTimeline) ? stats.activityTimeline.length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="analytics-content">
            <div className="analytics-section">
              <h2>Event Breakdown</h2>
              <div className="event-breakdown">
                {Object.entries(stats.eventBreakdown).map(([event, count]) => (
                  <div key={event} className="event-item">
                    <span className="event-label">
                      {getEventLabel(event)}
                    </span>
                    <span className="event-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-section">
              <h2>Recent Activity</h2>
              <div className="activity-feed">
                {activityFeed.length > 0 ? (
                  activityFeed.map((activity) => (
                    <div key={activity._id} className="activity-item">
                      <span className="activity-event">
                        {getEventLabel(activity.eventType)}
                      </span>
                      {activity.project && (
                        <span className="activity-project">
                          in {activity.project.title}
                        </span>
                      )}
                      <span className="activity-time">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No activity yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;

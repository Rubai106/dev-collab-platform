import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiPieChart, FiArrowLeft } from 'react-icons/fi';

const ContributionDashboard = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/contributions/${projectId}?days=${days}`);
        setData(res.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, days]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state"><p>Could not load contributions.</p></div>;

  const maxScore = Math.max(...data.contributions.map((c) => c.totalScore), 1);

  return (
    <div className="contributions-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiPieChart /> Contribution Equity</h1>
        </div>
        <div className="controls">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Fairness Score */}
      <div className="fairness-card">
        <div className={`fairness-score ${data.fairness.score >= 70 ? 'fair' : data.fairness.score >= 40 ? 'moderate' : 'unfair'}`}>
          <span className="fairness-number">{data.fairness.score}</span>
          <span className="fairness-label">
            Fairness Score
            {data.fairness.score >= 70 ? ' — Well Balanced' : data.fairness.score >= 40 ? ' — Moderate' : ' — Imbalanced'}
          </span>
        </div>
        <p className="fairness-desc">
          Measures how evenly work is distributed across the team.
          100 = perfectly equal, 0 = one person doing everything.
        </p>
      </div>

      {/* Contribution Bars */}
      <div className="contributions-list">
        {data.contributions.map((c) => (
          <div key={c.member._id} className="contribution-card">
            <div className="contribution-header">
              <div className="contribution-member">
                <div className="avatar-small">
                  {c.member.profilePicture ? (
                    <img src={c.member.profilePicture} alt={c.member.name} />
                  ) : (
                    <span>{c.member.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3>{c.member.name}</h3>
              </div>
              <span className="contribution-total-score">{c.totalScore}</span>
            </div>

            <div className="contribution-bar-container">
              <div
                className="contribution-bar"
                style={{ width: `${(c.totalScore / maxScore) * 100}%` }}
              ></div>
            </div>

            <div className="contribution-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Tasks Completed</span>
                <span className="breakdown-value">{c.tasksCompleted}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Tasks Created</span>
                <span className="breakdown-value">{c.tasksCreated}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Messages</span>
                <span className="breakdown-value">{c.messageCount}</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Blockers Resolved</span>
                <span className="breakdown-value">{c.blockersResolved}</span>
              </div>
            </div>

            <div className="task-priority-bars">
              <span className="priority-mini high">{c.tasksByPriority.High || 0} High</span>
              <span className="priority-mini medium">{c.tasksByPriority.Medium || 0} Med</span>
              <span className="priority-mini low">{c.tasksByPriority.Low || 0} Low</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContributionDashboard;

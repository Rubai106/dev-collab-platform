import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiAlertCircle, FiPlus, FiArrowLeft, FiTrash2 } from 'react-icons/fi';

const severityColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const ageLevelColors = {
  fresh: 'var(--success)',
  aging: 'var(--warning)',
  old: '#f97316',
  critical: 'var(--danger)',
};

const categoryLabels = {
  'code-smell': '🔧 Code Smell',
  'architecture': '🏗️ Architecture',
  'dependency': '📦 Dependency',
  'testing': '🧪 Testing',
  'documentation': '📝 Documentation',
  'performance': '⚡ Performance',
  'security': '🔒 Security',
  'other': '📌 Other',
};

const TechDebtTracker = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', category: '', severity: '' });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    category: 'other',
  });

  const fetchData = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;

      const [debtRes, projRes] = await Promise.all([
        api.get(`/techdebt/${projectId}`, { params }),
        api.get(`/projects/${projectId}`),
      ]);
      setData(debtRes.data);
      setProject(projRes.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and description are required');
    }
    try {
      await api.post('/techdebt', { ...form, project: projectId });
      setShowForm(false);
      setForm({ title: '', description: '', severity: 'medium', category: 'other' });
      fetchData();
      toast.success('Tech debt logged!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/techdebt/${id}`, { status });
      fetchData();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this debt item?')) return;
    try {
      await api.delete(`/techdebt/${id}`);
      fetchData();
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="techdebt-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiAlertCircle /> Tech Debt Tracker</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Log Debt
        </button>
      </div>

      {/* Debt Score */}
      {data?.stats && (
        <div className="debt-score-bar">
          <div className="debt-score-card">
            <h2 className={`debt-score ${data.stats.totalDebtScore > 100 ? 'score-high' : data.stats.totalDebtScore > 30 ? 'score-medium' : 'score-low'}`}>
              {data.stats.totalDebtScore}
            </h2>
            <span>Debt Score</span>
          </div>
          <div className="debt-score-card">
            <h2>{data.stats.openCount}</h2>
            <span>Open</span>
          </div>
          <div className="debt-score-card">
            <h2>{data.stats.resolvedCount}</h2>
            <span>Resolved</span>
          </div>
          <div className="debt-score-card">
            <h2>{data.stats.total}</h2>
            <span>Total</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="techdebt-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>What's the debt?</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., No error handling in API calls"
                required
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Where is it? What's the impact?"
                rows={3}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Severity</label>
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Log Debt</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="techdebt-filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
          <option value="">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Debt Items */}
      {!data?.items?.length ? (
        <div className="empty-state"><p>No tech debt logged. (Lucky you!)</p></div>
      ) : (
        <div className="techdebt-list">
          {data.items.map((item) => (
            <div
              key={item._id}
              className={`techdebt-card age-${item.ageLevel}`}
              style={{
                borderLeftColor: ageLevelColors[item.ageLevel],
                transform: item.ageLevel === 'critical' ? 'scale(1.02)' : 'none',
              }}
            >
              <div className="techdebt-header">
                <div>
                  <h3>{item.title}</h3>
                  <div className="techdebt-badges">
                    <span className="severity-badge" style={{ background: severityColors[item.severity] }}>
                      {item.severity}
                    </span>
                    <span className="category-badge">{categoryLabels[item.category]}</span>
                    <span className="age-badge">{item.ageDays}d old</span>
                    {item.debtScore > 0 && (
                      <span className="score-badge">Score: {item.debtScore}</span>
                    )}
                  </div>
                </div>
                <div className="techdebt-actions">
                  {item.status !== 'resolved' && (
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                      className="status-select"
                    >
                      <option value="open">Open</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                  {(item.reportedBy?._id === user._id || project?.owner?._id === user._id) && (
                    <button className="btn-icon" onClick={() => handleDelete(item._id)}>
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="techdebt-desc">{item.description}</p>
              <small className="techdebt-reporter">Reported by {item.reportedBy?.name}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechDebtTracker;

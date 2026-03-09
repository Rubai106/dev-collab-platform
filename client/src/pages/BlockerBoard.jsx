import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiPlus, FiArrowLeft, FiCheck, FiClock, FiUser } from 'react-icons/fi';

const BlockerBoard = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [blockers, setBlockers] = useState([]);
  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '' });

  const fetchData = async () => {
    try {
      const [blockRes, projRes] = await Promise.all([
        api.get(`/blockers/${projectId}`),
        api.get(`/projects/${projectId}`),
      ]);
      setBlockers(blockRes.data);
      setProject(projRes.data);
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
    if (socket) {
      socket.emit('joinRoom', projectId);
      socket.on('blockerUpdated', () => fetchData());
      return () => {
        socket.emit('leaveRoom', projectId);
        socket.off('blockerUpdated');
      };
    }
  }, [socket, projectId]);

  const getAgeInfo = (createdAt) => {
    const hours = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60);
    if (hours > 48) return { level: 'critical', label: `${Math.floor(hours / 24)}d`, pulse: true };
    if (hours > 24) return { level: 'warning', label: `${Math.floor(hours)}h`, pulse: false };
    return { level: 'fresh', label: `${Math.floor(hours)}h`, pulse: false };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and description are required');
    }
    try {
      const res = await api.post('/blockers', { ...form, project: projectId });
      setBlockers([res.data, ...blockers]);
      setShowForm(false);
      setForm({ title: '', description: '' });
      toast.success('Blocker reported!');
      if (socket) socket.emit('blockerUpdate', { projectId });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleResolve = async (blockerId) => {
    try {
      const res = await api.put(`/blockers/${blockerId}`, {
        status: 'resolved',
        resolution,
      });
      setBlockers(blockers.map((b) => (b._id === blockerId ? res.data : b)));
      setResolving(null);
      setResolution('');
      toast.success('Blocker resolved!');
      if (socket) socket.emit('blockerUpdate', { projectId });
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  const handlePickUp = async (blockerId) => {
    try {
      const res = await api.put(`/blockers/${blockerId}`, { status: 'in-progress' });
      setBlockers(blockers.map((b) => (b._id === blockerId ? res.data : b)));
      if (socket) socket.emit('blockerUpdate', { projectId });
    } catch (err) {
      toast.error('Failed');
    }
  };

  const openBlockers = blockers.filter((b) => b.status !== 'resolved');
  const resolved = blockers.filter((b) => b.status === 'resolved');

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="blockers-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiAlertTriangle /> Blocker Board</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> I'm Blocked
        </button>
      </div>

      {showForm && (
        <div className="blocker-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>What's blocking you?</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Can't figure out WebSocket authentication"
                required
              />
            </div>
            <div className="form-group">
              <label>Details</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what you've tried and where you're stuck..."
                rows={4}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Report Blocker</button>
            </div>
          </form>
        </div>
      )}

      <div className="blockers-board">
        <div className="blockers-section">
          <h2 className="section-title open-title">
            <FiAlertTriangle /> Open Blockers ({openBlockers.length})
          </h2>
          {openBlockers.length === 0 ? (
            <div className="empty-state"><p>No blockers! 🎉 The team is unblocked.</p></div>
          ) : (
            <div className="blockers-list">
              {openBlockers.map((b) => {
                const age = getAgeInfo(b.createdAt);
                return (
                  <div key={b._id} className={`blocker-card blocker-${age.level} ${age.pulse ? 'pulse' : ''}`}>
                    <div className="blocker-header">
                      <div>
                        <h3>{b.title}</h3>
                        <div className="blocker-meta">
                          <span><FiUser size={12} /> {b.reportedBy?.name}</span>
                          <span><FiClock size={12} /> {age.label} ago</span>
                          <span className={`blocker-status-badge ${b.status}`}>{b.status}</span>
                        </div>
                      </div>
                    </div>
                    <p className="blocker-desc">{b.description}</p>

                    {b.suggestedHelpers?.length > 0 && (
                      <div className="suggested-helpers">
                        <small>Suggested helpers (based on skills):</small>
                        <div className="helper-chips">
                          {b.suggestedHelpers.map((h) => (
                            <span key={h._id} className="participant-chip">
                              {h.name}
                              {h.skills?.length > 0 && <small> · {h.skills.slice(0, 2).join(', ')}</small>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="blocker-actions">
                      {b.status === 'open' && b.reportedBy?._id !== user._id && (
                        <button className="btn btn-sm btn-outline" onClick={() => handlePickUp(b._id)}>
                          🙋 I'll Help
                        </button>
                      )}
                      {resolving === b._id ? (
                        <div className="resolve-form">
                          <input
                            type="text"
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="How was it resolved?"
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => handleResolve(b._id)}>
                            <FiCheck /> Resolve
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => setResolving(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-primary" onClick={() => setResolving(b._id)}>
                          <FiCheck /> Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {resolved.length > 0 && (
          <div className="blockers-section">
            <h2 className="section-title resolved-title">
              <FiCheck /> Resolved ({resolved.length})
            </h2>
            <div className="blockers-list resolved-list">
              {resolved.map((b) => (
                <div key={b._id} className="blocker-card blocker-resolved">
                  <h3>{b.title}</h3>
                  <p className="blocker-desc">{b.description}</p>
                  {b.resolution && <p className="resolution-text">✅ {b.resolution}</p>}
                  <div className="blocker-meta">
                    <span>Reported by {b.reportedBy?.name}</span>
                    {b.resolvedBy && <span> · Resolved by {b.resolvedBy.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockerBoard;

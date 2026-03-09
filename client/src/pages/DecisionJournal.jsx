import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiBook, FiPlus, FiArrowLeft, FiX, FiSearch, FiTrash2, FiTag, FiUsers } from 'react-icons/fi';

const DecisionJournal = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    decision: '',
    alternatives: [],
    reasoning: '',
    participants: [],
    tags: [],
  });
  const [altInput, setAltInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (tagFilter) params.tag = tagFilter;
      const [decRes, projRes] = await Promise.all([
        api.get(`/decisions/${projectId}`, { params }),
        api.get(`/projects/${projectId}`),
      ]);
      setDecisions(decRes.data);
      setProject(projRes.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, tagFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const addAlternative = () => {
    if (altInput.trim()) {
      setForm({ ...form, alternatives: [...form.alternatives, { text: altInput.trim() }] });
      setAltInput('');
    }
  };

  const removeAlternative = (idx) => {
    setForm({ ...form, alternatives: form.alternatives.filter((_, i) => i !== idx) });
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const toggleParticipant = (memberId) => {
    setForm({
      ...form,
      participants: form.participants.includes(memberId)
        ? form.participants.filter((p) => p !== memberId)
        : [...form.participants, memberId],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.decision.trim()) {
      return toast.error('Title and decision are required');
    }
    try {
      const res = await api.post('/decisions', { ...form, project: projectId });
      setDecisions([res.data, ...decisions]);
      setShowForm(false);
      setForm({ title: '', decision: '', alternatives: [], reasoning: '', participants: [], tags: [] });
      toast.success('Decision recorded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this decision?')) return;
    try {
      await api.delete(`/decisions/${id}`);
      setDecisions(decisions.filter((d) => d._id !== id));
      toast.success('Deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const allTags = [...new Set(decisions.flatMap((d) => d.tags || []))];

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="decisions-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiBook /> Decision Journal</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <FiPlus /> Record Decision
        </button>
      </div>

      {showForm && (
        <div className="decision-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>What was decided?</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Switching from REST to GraphQL"
                required
              />
            </div>
            <div className="form-group">
              <label>Decision Details</label>
              <textarea
                value={form.decision}
                onChange={(e) => setForm({ ...form, decision: e.target.value })}
                placeholder="Describe the decision in detail..."
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Alternatives Considered</label>
              <div className="tech-input-group">
                <input
                  type="text"
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="Add an alternative that was considered"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlternative())}
                />
                <button type="button" className="btn btn-outline" onClick={addAlternative}>Add</button>
              </div>
              {form.alternatives.map((alt, i) => (
                <div key={i} className="alt-item">
                  <span>{alt.text}</span>
                  <FiX className="remove-tag" onClick={() => removeAlternative(i)} />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label>Why was this chosen?</label>
              <textarea
                value={form.reasoning}
                onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
                placeholder="Explain the reasoning behind this decision..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Tags</label>
              <div className="tech-input-group">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g., architecture, api"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button type="button" className="btn btn-outline" onClick={addTag}>Add</button>
              </div>
              <div className="tech-tags">
                {form.tags.map((t, i) => (
                  <span key={i} className="tech-tag">{t} <FiX onClick={() => removeTag(t)} className="remove-tag" /></span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label><FiUsers /> Who was involved?</label>
              <div className="participant-selector">
                {project?.members?.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    className={`participant-btn ${form.participants.includes(m._id) ? 'selected' : ''}`}
                    onClick={() => toggleParticipant(m._id)}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Decision</button>
            </div>
          </form>
        </div>
      )}

      <div className="decisions-filters">
        <form className="search-form" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        {allTags.length > 0 && (
          <div className="tag-filters">
            <button
              className={`tag-filter ${!tagFilter ? 'active' : ''}`}
              onClick={() => setTagFilter('')}
            >All</button>
            {allTags.map((t) => (
              <button
                key={t}
                className={`tag-filter ${tagFilter === t ? 'active' : ''}`}
                onClick={() => setTagFilter(t)}
              >
                <FiTag size={12} /> {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {decisions.length === 0 ? (
        <div className="empty-state">
          <p>No decisions recorded yet. Start documenting your technical decisions!</p>
        </div>
      ) : (
        <div className="decisions-list">
          {decisions.map((d) => (
            <div key={d._id} className="decision-card" onClick={() => setExpandedId(expandedId === d._id ? null : d._id)}>
              <div className="decision-header">
                <h3>{d.title}</h3>
                <div className="decision-meta">
                  <small>{new Date(d.createdAt).toLocaleDateString()}</small>
                  <small>by {d.createdBy?.name}</small>
                  {(d.createdBy?._id === user._id || project?.owner?._id === user._id) && (
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDelete(d._id); }}>
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="decision-text">{d.decision}</p>
              {d.tags?.length > 0 && (
                <div className="tech-tags">
                  {d.tags.map((t, i) => <span key={i} className="tech-tag">{t}</span>)}
                </div>
              )}
              {expandedId === d._id && (
                <div className="decision-details">
                  {d.alternatives?.length > 0 && (
                    <div className="detail-section">
                      <h4>Alternatives Considered</h4>
                      <ul>{d.alternatives.map((a, i) => <li key={i}>{a.text}</li>)}</ul>
                    </div>
                  )}
                  {d.reasoning && (
                    <div className="detail-section">
                      <h4>Reasoning</h4>
                      <p>{d.reasoning}</p>
                    </div>
                  )}
                  {d.participants?.length > 0 && (
                    <div className="detail-section">
                      <h4>Participants</h4>
                      <div className="participant-list">
                        {d.participants.map((p) => (
                          <span key={p._id} className="participant-chip">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {d.relatedTask && (
                    <div className="detail-section">
                      <h4>Related Task</h4>
                      <p>{d.relatedTask.title} ({d.relatedTask.status})</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionJournal;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  FiUsers, FiGitBranch, FiLayout, FiMessageSquare, FiEdit2, FiTrash2,
  FiUserPlus, FiUserX, FiCheck, FiX, FiRefreshCw, FiSmile, FiBook,
  FiAlertTriangle, FiTarget, FiAlertCircle, FiClock, FiPieChart,
} from 'react-icons/fi';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
      setEditForm({
        title: res.data.title,
        description: res.data.description,
        status: res.data.status,
        githubRepo: res.data.githubRepo || '',
      });
    } catch (err) {
      toast.error('Project not found');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!project) return null;

  const isOwner = project.owner._id === user._id;
  const isMember = project.members.some((m) => m._id === user._id);

  const handleJoin = async () => {
    try {
      await api.post(`/projects/${id}/join`);
      toast.success('Join request sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/projects/${id}/leave`);
      toast.success('Left the project');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleApprove = async (userId) => {
    try {
      const res = await api.post(`/projects/${id}/approve/${userId}`);
      setProject(res.data);
      toast.success('Member approved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/projects/${id}/reject/${userId}`);
      toast.success('Request rejected');
      fetchProject();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${id}`, editForm);
      setProject(res.data);
      setEditing(false);
      toast.success('Updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="project-details">
      <div className="project-details-header">
        {editing ? (
          <form onSubmit={handleUpdate} className="edit-form">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={3}
            />
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <input
              type="text"
              value={editForm.githubRepo}
              onChange={(e) => setEditForm({ ...editForm, githubRepo: e.target.value })}
              placeholder="GitHub repo URL"
            />
            <div className="edit-actions">
              <button type="submit" className="btn btn-primary"><FiCheck /> Save</button>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}><FiX /> Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <div>
              <h1>{project.title}</h1>
              <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                {project.status}
              </span>
            </div>
            <div className="header-actions">
              {isMember && (
                <>
                  <Link to={`/projects/${id}/tasks`} className="btn btn-outline"><FiLayout /> Tasks</Link>
                  <Link to={`/projects/${id}/chat`} className="btn btn-outline"><FiMessageSquare /> Chat</Link>
                </>
              )}
              {isMember && (
                <div className="feature-links">
                  <Link to={`/projects/${id}/catchup`} className="btn btn-sm btn-outline"><FiRefreshCw /> Catch Up</Link>
                  <Link to={`/projects/${id}/mood`} className="btn btn-sm btn-outline"><FiSmile /> Mood</Link>
                  <Link to={`/projects/${id}/decisions`} className="btn btn-sm btn-outline"><FiBook /> Decisions</Link>
                  <Link to={`/projects/${id}/blockers`} className="btn btn-sm btn-outline"><FiAlertTriangle /> Blockers</Link>
                  <Link to={`/projects/${id}/pairing`} className="btn btn-sm btn-outline"><FiTarget /> Pair Me</Link>
                  <Link to={`/projects/${id}/techdebt`} className="btn btn-sm btn-outline"><FiAlertCircle /> Tech Debt</Link>
                  <Link to={`/projects/${id}/focus`} className="btn btn-sm btn-outline"><FiClock /> Focus</Link>
                  <Link to={`/projects/${id}/contributions`} className="btn btn-sm btn-outline"><FiPieChart /> Contributions</Link>
                </div>
              )}
              {isOwner && (
                <>
                  <button className="btn btn-outline" onClick={() => setEditing(true)}><FiEdit2 /> Edit</button>
                  <button className="btn btn-danger" onClick={handleDelete}><FiTrash2 /> Delete</button>
                </>
              )}
              {!isMember && (
                <button className="btn btn-primary" onClick={handleJoin}><FiUserPlus /> Join Project</button>
              )}
              {isMember && !isOwner && (
                <button className="btn btn-outline" onClick={handleLeave}><FiUserX /> Leave</button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="project-details-body">
        <div className="project-info">
          <p className="project-description">{project.description}</p>
          <div className="project-meta-details">
            <div><strong>Difficulty:</strong> {project.difficulty}</div>
            <div><strong>Team Size:</strong> {project.members.length}/{project.teamSize}</div>
            <div><strong>Owner:</strong> {project.owner.name}</div>
            {project.githubRepo && (
              <div>
                <FiGitBranch /> <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">GitHub Repository</a>
              </div>
            )}
          </div>
          <div className="tech-tags">
            {project.techStack?.map((t, i) => (
              <span key={i} className="tech-tag">{t}</span>
            ))}
          </div>
        </div>

        <div className="project-sidebar">
          <div className="members-section">
            <h3><FiUsers /> Members ({project.members.length})</h3>
            <div className="members-list">
              {project.members.map((m) => (
                <div key={m._id} className="member-item">
                  <div className="avatar-small">
                    {m.profilePicture ? (
                      <img src={m.profilePicture} alt={m.name} />
                    ) : (
                      <span>{m.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <strong>{m.name}</strong>
                    {m._id === project.owner._id && <span className="owner-badge">Owner</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isOwner && project.joinRequests?.length > 0 && (
            <div className="join-requests-section">
              <h3>Join Requests ({project.joinRequests.length})</h3>
              {project.joinRequests.map((r) => (
                <div key={r.user._id} className="request-item">
                  <div className="request-user">
                    <div className="avatar-small">
                      <span>{r.user.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <strong>{r.user.name}</strong>
                      {r.message && <p className="request-msg">{r.message}</p>}
                    </div>
                  </div>
                  <div className="request-actions">
                    <button className="btn btn-sm btn-primary" onClick={() => handleApprove(r.user._id)}>
                      <FiCheck />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleReject(r.user._id)}>
                      <FiX />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;

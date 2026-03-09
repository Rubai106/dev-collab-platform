import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiFolder, FiUsers, FiCheckSquare, FiPlus } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects/my');
        setProjects(res.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const ownedProjects = projects.filter((p) => p.owner._id === user._id);
  const memberProjects = projects.filter((p) => p.owner._id !== user._id);

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome, {user.name}!</h1>
        <Link to="/projects/create" className="btn btn-primary">
          <FiPlus /> New Project
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <FiFolder />
          <div>
            <h3>{ownedProjects.length}</h3>
            <p>Owned Projects</p>
          </div>
        </div>
        <div className="stat-card">
          <FiUsers />
          <div>
            <h3>{memberProjects.length}</h3>
            <p>Joined Projects</p>
          </div>
        </div>
        <div className="stat-card">
          <FiCheckSquare />
          <div>
            <h3>{projects.length}</h3>
            <p>Total Projects</p>
          </div>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>My Projects</h2>
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create your first project!</p>
            <Link to="/projects/create" className="btn btn-primary"><FiPlus /> Create Project</Link>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <Link to={`/projects/${project._id}`} key={project._id} className="project-card">
                <div className="project-card-header">
                  <h3>{project.title}</h3>
                  <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                    {project.status}
                  </span>
                </div>
                <p>{project.description?.substring(0, 100)}...</p>
                <div className="project-card-meta">
                  <div className="tech-tags">
                    {project.techStack?.slice(0, 3).map((t, i) => (
                      <span key={i} className="tech-tag">{t}</span>
                    ))}
                  </div>
                  <span className="member-count">
                    <FiUsers /> {project.members?.length}/{project.teamSize}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

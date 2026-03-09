import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiSearch, FiUsers, FiPlus } from 'react-icons/fi';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/projects', { params });
      setProjects(res.data);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [status]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>Explore Projects</h1>
        <Link to="/projects/create" className="btn btn-primary">
          <FiPlus /> New Project
        </Link>
      </div>

      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects found matching your criteria.</p>
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
              <p>{project.description?.substring(0, 120)}...</p>
              <div className="project-card-footer">
                <span className="difficulty-badge">{project.difficulty}</span>
                <div className="tech-tags">
                  {project.techStack?.slice(0, 3).map((t, i) => (
                    <span key={i} className="tech-tag">{t}</span>
                  ))}
                </div>
              </div>
              <div className="project-card-meta">
                <span className="owner-info">by {project.owner?.name}</span>
                <span className="member-count">
                  <FiUsers /> {project.members?.length}/{project.teamSize}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;

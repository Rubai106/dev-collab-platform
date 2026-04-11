import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

const CreateProject = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    techStack: [],
    difficulty: 'Intermediate',
    teamSize: 5,
    githubRepo: '',
  });
  const [techInput, setTechInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addTech = (e) => {
    e.preventDefault();
    const value = techInput.trim();
    if (value && !form.techStack.includes(value)) {
      setForm({ ...form, techStack: [...form.techStack, value] });
      setTechInput('');
    }
  };

  const removeTech = (tech) => {
    setForm({ ...form, techStack: form.techStack.filter((t) => t !== tech) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      return toast.error('Title and description are required');
    }
    setLoading(true);
    try {
      const res = await api.post('/projects', form);
      toast.success('Project created!');
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-project-page">
      <h1>Create New Project</h1>
      <form className="project-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Project Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="My Awesome Project"
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe your project, goals, and what you're looking for..."
            rows={5}
            required
          />
        </div>
        <div className="form-group">
          <label>Tech Stack</label>
          <div className="tech-input-group">
            <input
              type="text"
              list="tech-options"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="Add a technology (e.g. React)"
              onKeyDown={(e) => e.key === 'Enter' && addTech(e)}
            />
            <datalist id="tech-options">
              <option value="React" />
              <option value="Node.js" />
              <option value="MongoDB" />
              <option value="Express" />
              <option value="TypeScript" />
              <option value="Python" />
              <option value="Django" />
              <option value="PostgreSQL" />
              <option value="Next.js" />
              <option value="TailwindCSS" />
            </datalist>
            <button type="button" className="btn btn-outline" onClick={addTech}>Add</button>
          </div>
          <div className="tech-tags">
            {form.techStack.map((t, i) => (
              <span key={i} className="tech-tag">
                {t} <FiX onClick={() => removeTech(t)} className="remove-tag" />
              </span>
            ))}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Difficulty</label>
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div className="form-group">
            <label>Team Size</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.teamSize}
              onChange={(e) => setForm({ ...form, teamSize: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>GitHub Repository (optional)</label>
          <input
            type="text"
            value={form.githubRepo}
            onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
            placeholder="https://github.com/user/repo"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
};

export default CreateProject;

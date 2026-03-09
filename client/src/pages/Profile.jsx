import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiGithub, FiSave, FiX } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    skills: user?.skills || [],
    githubLink: user?.githubLink || '',
    profilePicture: user?.profilePicture || '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);

  const addSkill = (e) => {
    e.preventDefault();
    const value = skillInput.trim();
    if (value && !form.skills.includes(value)) {
      setForm({ ...form, skills: [...form.skills, value] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', form);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-large">
            {form.profilePicture ? (
              <img src={form.profilePicture} alt={form.name} />
            ) : (
              <span>{form.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <h2>{form.name}</h2>
          <p className="profile-email"><FiMail /> {user?.email}</p>
          {form.bio && <p className="profile-bio">{form.bio}</p>}
          {form.skills.length > 0 && (
            <div className="tech-tags">
              {form.skills.map((s, i) => (
                <span key={i} className="tech-tag">{s}</span>
              ))}
            </div>
          )}
          {form.githubLink && (
            <a href={form.githubLink} target="_blank" rel="noopener noreferrer" className="github-link">
              <FiGithub /> GitHub Profile
            </a>
          )}
        </div>

        <div className="profile-form-section">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FiUser /> Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                maxLength={300}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="form-group">
              <label>Skills</label>
              <div className="tech-input-group">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  onKeyDown={(e) => e.key === 'Enter' && addSkill(e)}
                />
                <button type="button" className="btn btn-outline" onClick={addSkill}>Add</button>
              </div>
              <div className="tech-tags">
                {form.skills.map((s, i) => (
                  <span key={i} className="tech-tag">
                    {s} <FiX onClick={() => removeSkill(s)} className="remove-tag" />
                  </span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label><FiGithub /> GitHub Link</label>
              <input
                type="text"
                value={form.githubLink}
                onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>
            <div className="form-group">
              <label>Profile Picture URL</label>
              <input
                type="text"
                value={form.profilePicture}
                onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

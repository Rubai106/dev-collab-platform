import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FiUsers, FiArrowLeft, FiArrowRight, FiStar } from 'react-icons/fi';

const SkillPairing = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('learn');
  const [skillFilter, setSkillFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPairings = async () => {
      setLoading(true);
      try {
        const params = { mode };
        if (mode === 'help' && skillFilter) params.skill = skillFilter;
        const res = await api.get(`/pairing/${projectId}`, { params });
        setData(res.data);
      } catch (err) {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchPairings();
  }, [projectId, mode, skillFilter]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="pairing-page">
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="back-link"><FiArrowLeft /> Back to Project</Link>
          <h1><FiUsers /> Pair Me</h1>
        </div>
      </div>

      <div className="pairing-controls">
        <button
          className={`btn ${mode === 'learn' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setMode('learn'); setSkillFilter(''); }}
        >
          🎓 I Want to Learn
        </button>
        <button
          className={`btn ${mode === 'help' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setMode('help')}
        >
          🆘 I Need Help
        </button>
      </div>

      {mode === 'help' && (
        <div className="skill-filter">
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="What skill do you need help with? (e.g., React, MongoDB)"
          />
        </div>
      )}

      {data?.yourSkills?.length > 0 && (
        <div className="your-skills">
          <h3>Your Skills</h3>
          <div className="tech-tags">
            {data.yourSkills.map((s, i) => (
              <span key={i} className="tech-tag">{s}</span>
            ))}
          </div>
        </div>
      )}

      {data?.suggestions?.length === 0 ? (
        <div className="empty-state">
          <p>
            {mode === 'help'
              ? 'No team members found matching that skill. Try a different keyword.'
              : 'No pairing suggestions available. Make sure team members have set their skills.'}
          </p>
        </div>
      ) : (
        <div className="pairing-list">
          {data?.suggestions?.map((s, i) => (
            <div key={s.member._id} className="pairing-card">
              <div className="pairing-member">
                <div className="avatar-small">
                  {s.member.profilePicture ? (
                    <img src={s.member.profilePicture} alt={s.member.name} />
                  ) : (
                    <span>{s.member.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3>{s.member.name}</h3>
                  <span className="pairing-score">
                    <FiStar size={12} /> Complementary Score: {s.complementaryScore}
                  </span>
                  <span className="tasks-completed">
                    {s.completedTasks} tasks completed
                  </span>
                </div>
              </div>

              <div className="skill-exchange">
                {s.canTeachYou.length > 0 && (
                  <div className="skill-section can-teach">
                    <h4><FiArrowRight /> They can teach you</h4>
                    <div className="tech-tags">
                      {s.canTeachYou.map((sk, j) => (
                        <span key={j} className="tech-tag teach-tag">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
                {s.youCanTeach.length > 0 && (
                  <div className="skill-section you-teach">
                    <h4><FiArrowLeft /> You can teach them</h4>
                    <div className="tech-tags">
                      {s.youCanTeach.map((sk, j) => (
                        <span key={j} className="tech-tag learn-tag">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
                {s.sharedSkills.length > 0 && (
                  <div className="skill-section shared">
                    <h4>Shared Skills</h4>
                    <div className="tech-tags">
                      {s.sharedSkills.map((sk, j) => (
                        <span key={j} className="tech-tag">{sk}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillPairing;

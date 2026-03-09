import { Link } from 'react-router-dom';
import { FiUsers, FiLayout, FiMessageSquare, FiZap, FiShield, FiGlobe } from 'react-icons/fi';

const features = [
  { icon: <FiUsers />, title: 'Team Building', desc: 'Find developers and build your dream team for any project.' },
  { icon: <FiLayout />, title: 'Task Boards', desc: 'Drag-and-drop Kanban boards to manage tasks efficiently.' },
  { icon: <FiMessageSquare />, title: 'Real-time Chat', desc: 'Communicate with your team instantly with built-in chat.' },
  { icon: <FiZap />, title: 'Live Updates', desc: 'See changes in real-time as your team collaborates.' },
  { icon: <FiShield />, title: 'Role Management', desc: 'Project owners control membership and task assignments.' },
  { icon: <FiGlobe />, title: 'Open Projects', desc: 'Discover and join open-source and collaborative projects.' },
];

const Landing = () => {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <h1>Build Together,<br /><span className="gradient-text">Ship Faster</span></h1>
          <p>The all-in-one platform for developer collaboration. Find teammates, manage tasks, and communicate — all in one place.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sign In</Link>
          </div>
        </div>
      </section>

      <section className="features">
        <h2>Everything you need to collaborate</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h2>Ready to start collaborating?</h2>
        <p>Join developers who are already building amazing projects together.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Create Your Account</Link>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} DevCollab. Built for developers, by developers.</p>
      </footer>
    </div>
  );
};

export default Landing;

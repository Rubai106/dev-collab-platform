import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import { FiSun, FiMoon, FiMenu, FiX, FiCode, FiLogOut, FiBarChart2, FiSearch } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
          <FiCode /> DevCollab
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/analytics" onClick={() => setMenuOpen(false)}>
                <FiBarChart2 style={{ marginRight: '0.25rem' }} /> Analytics
              </Link>
              <Link to="/search" onClick={() => setMenuOpen(false)}>
                <FiSearch style={{ marginRight: '0.25rem' }} /> Search
              </Link>
              <Link to="/projects" onClick={() => setMenuOpen(false)}>Projects</Link>
              <Link to="/projects/create" onClick={() => setMenuOpen(false)}>Create</Link>
              <NotificationBell />
              <button className="btn btn-icon" onClick={toggleTheme}>
                {darkMode ? <FiSun /> : <FiMoon />}
              </button>
              <Link to="/profile" className="nav-avatar" onClick={() => setMenuOpen(false)}>
                <div className="avatar-small">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} />
                  ) : (
                    <span>{user.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </Link>
              <button className="btn btn-outline" onClick={handleLogout} style={{ marginLeft: '8px' }}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-icon" onClick={toggleTheme}>
                {darkMode ? <FiSun /> : <FiMoon />}
              </button>
              <Link to="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

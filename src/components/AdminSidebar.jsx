import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { FaDice, FaStar, FaUsersCog, FaSignOutAlt, FaMoon, FaSun, FaBars, FaTimes } from 'react-icons/fa';
import './AdminSidebar.css';

const AdminSidebar = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const close = () => setMobileOpen(false);

  return (
    <div className="admin-layout">
      {mobileOpen && <div className="admin-sidebar-overlay" onClick={close} />}

      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <FaDice className="admin-sidebar-logo-icon" />
          <span className="admin-sidebar-brand">Whotopia Admin</span>
          <button className="admin-sidebar-close" onClick={close} aria-label="Close menu">
            <FaTimes />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <span className="admin-sidebar-section-label">Menu</span>
          <NavLink
            to="/admin-reviews"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            onClick={close}
          >
            <FaStar className="admin-sidebar-link-icon" />
            <span className="admin-sidebar-link-label">Review</span>
          </NavLink>
          <NavLink
            to="/admin-players"
            className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            onClick={close}
          >
            <FaUsersCog className="admin-sidebar-link-icon" />
            <span className="admin-sidebar-link-label">Players Management</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-sidebar-link" onClick={toggleTheme}>
            <span className="admin-sidebar-link-icon">{isDark ? <FaSun /> : <FaMoon />}</span>
            <span className="admin-sidebar-link-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="admin-sidebar-link" onClick={handleSignOut}>
            <span className="admin-sidebar-link-icon"><FaSignOutAlt /></span>
            <span className="admin-sidebar-link-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-mobile-topbar">
          <button className="admin-mobile-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <FaBars />
          </button>
          <span className="admin-mobile-brand">
            <FaDice className="admin-mobile-brand-icon" />
            Whotopia Admin
          </span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AdminSidebar;

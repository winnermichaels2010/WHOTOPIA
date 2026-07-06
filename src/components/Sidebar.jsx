import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { FaHome, FaGamepad, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes, FaMoon, FaSun, FaDice, FaRobot, FaGlobe } from 'react-icons/fa';
import './Sidebar.css';

const navItems = [
  { path: '/home', icon: <FaHome />, label: 'Home' },
  { path: '/play', icon: <FaGamepad />, label: 'Play', children: [
    { path: '/play/ai', icon: <FaRobot />, label: 'vs Computer' },
    { path: '/lobby', icon: <FaGlobe />, label: 'vs Players' },
  ]},
];

const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedPlay, setExpandedPlay] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthContext();

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className={`sidebar-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Mobile hamburger */}
      <button className={`mobile-hamburger ${mobileOpen ? 'hidden' : ''}`} onClick={() => setMobileOpen(true)}>
        <FaBars />
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaDice className="logo-icon" />
            {!collapsed && <span className="logo-text">Whotopia</span>}
          </div>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.path} className="nav-item-group">
              <button
                className={`nav-item ${location.pathname === item.path || item.children?.some(c => location.pathname === c.path) ? 'active' : ''}`}
                onClick={() => {
                  if (item.children) {
                    setExpandedPlay(!expandedPlay);
                  } else {
                    handleNav(item.path);
                  }
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
                {item.children && !collapsed && (
                  <span className={`nav-arrow ${expandedPlay ? 'expanded' : ''}`}>▾</span>
                )}
              </button>
              {item.children && expandedPlay && !collapsed && (
                <div className="nav-submenu">
                  {item.children.map((child) => (
                    <button
                      key={child.path}
                      className={`nav-item sub-item ${location.pathname === child.path ? 'active' : ''}`}
                      onClick={() => handleNav(child.path)}
                    >
                      <span className="nav-icon">{child.icon}</span>
                      <span className="nav-label">{child.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item theme-toggle" onClick={toggleTheme}>
            <span className="nav-icon">{isDark ? <FaSun /> : <FaMoon />}</span>
            {!collapsed && <span className="nav-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          {user ? (
            <button className="nav-item logout-btn" onClick={() => { logout(); navigate('/login'); }}>
              <span className="nav-icon"><FaSignOutAlt /></span>
              {!collapsed && <span className="nav-label">Sign Out</span>}
            </button>
          ) : (
            <button className="nav-item logout-btn" onClick={() => navigate('/login')}>
              <span className="nav-icon"><FaSignInAlt /></span>
              {!collapsed && <span className="nav-label">Sign In</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="sidebar-main">
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuthContext } from '../context/AuthContext';
import { useNotifications } from '../firebase/hooks';
import { hasLocalReview, REVIEW_SUBMITTED_EVENT } from '../utils/reviewStatus';
import { FaHome, FaGamepad, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes, FaMoon, FaSun, FaDice, FaRobot, FaGlobe, FaBook, FaFileContract, FaCog, FaUsers, FaStar, FaBell } from 'react-icons/fa';
import './Sidebar.css';

const allNavItems = [
  { path: '/', icon: <FaHome />, label: 'Home' },
  { path: '/dashboard', icon: <FaDice />, label: 'Dashboard' },
  { path: '/players', icon: <FaUsers />, label: 'Players' },
  { path: '/play', icon: <FaGamepad />, label: 'Play', children: [
    { path: '/play/ai', icon: <FaRobot />, label: 'vs Computer' },
    { path: '/lobby', icon: <FaGlobe />, label: 'vs Players' },
  ]},
  { path: '/how-to-play', icon: <FaBook />, label: 'How to Play' },
  { path: '/settings', icon: <FaCog />, label: 'Settings' },
  { path: '/review', icon: <FaStar />, label: 'Review' },
  { path: '/terms', icon: <FaFileContract />, label: 'Terms & Conditions' },
];

const Sidebar = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedPlay, setExpandedPlay] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthContext();
  const { unreadCount } = useNotifications(user?.uid);
  const [hasReviewed, setHasReviewed] = useState(() => hasLocalReview(user?.uid));

  const notificationBadge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null;

  const handleNotifications = () => {
    navigate('/notifications');
    setMobileOpen(false);
  };

  useEffect(() => {
    setHasReviewed(hasLocalReview(user?.uid));
  }, [user, location.pathname]);

  useEffect(() => {
    const onReviewSubmitted = () => setHasReviewed(true);
    window.addEventListener(REVIEW_SUBMITTED_EVENT, onReviewSubmitted);
    return () => window.removeEventListener(REVIEW_SUBMITTED_EVENT, onReviewSubmitted);
  }, []);

  const isAdmin = user?.email === 'review@gmail.com';

  const navItems = allNavItems.filter(item => {
    if (item.path === '/' && user) return false;
    if (!user && ['/dashboard', '/settings', '/play', '/players', '/review'].includes(item.path)) return false;
    if (item.path === '/review' && user && !isAdmin && hasReviewed) return false;
    return true;
  }).map(item => {
    if (item.path === '/review' && isAdmin) {
      return { ...item, path: '/admin-reviews', label: 'Reviews' };
    }
    return item;
  });

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className={`sidebar-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className={`mobile-hamburger ${mobileOpen ? 'hidden' : ''}`}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <span className="mobile-topbar-brand">
          <FaDice className="mobile-topbar-brand-icon" />
          <span className="mobile-topbar-brand-text">Whotopia</span>
        </span>
        <div className="mobile-topbar-actions">
          {user && (
            <button
              className="mobile-notif-toggle"
              onClick={handleNotifications}
              aria-label="Notifications"
            >
              <FaBell />
              {notificationBadge && <span className="notification-badge">{notificationBadge}</span>}
            </button>
          )}
          <button
            className="mobile-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </div>

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
          {user && (
            <button className="nav-item notifications-toggle" onClick={handleNotifications}>
              <span className="nav-icon">
                <FaBell />
                {notificationBadge && <span className="notification-badge">{notificationBadge}</span>}
              </span>
              {!collapsed && <span className="nav-label">Notifications</span>}
            </button>
          )}
          <button className="nav-item theme-toggle theme-toggle-desktop" onClick={toggleTheme}>
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
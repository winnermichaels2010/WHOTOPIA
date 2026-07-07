import { useState, useEffect, useRef } from 'react';
import { FaShieldAlt, FaUserCheck, FaGavel, FaGamepad, FaCopyright, FaLock, FaExclamationTriangle, FaSyncAlt, FaUserTimes, FaEnvelope, FaChevronRight } from 'react-icons/fa';
import './TermsPage.css';

const sections = [
  { id: 'acceptance', icon: <FaShieldAlt />, title: 'Acceptance of Terms', content: 'By creating an account or using Whotopia, you agree to these Terms & Conditions. If you do not agree, please do not use the service.' },
  { id: 'registration', icon: <FaUserCheck />, title: 'Account Registration', content: 'You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. You must be at least 13 years old to use this service.' },
  { id: 'conduct', icon: <FaGavel />, title: 'User Conduct', content: 'You agree not to:', list: ['Use the service for any illegal purpose', 'Harass, abuse, or harm other players', 'Cheat, hack, or exploit game mechanics', 'Create multiple accounts to circumvent rules', 'Share inappropriate content through chat'] },
  { id: 'fairplay', icon: <FaGamepad />, title: 'Fair Play', content: 'We promote fair play. Any form of cheating, botting, or exploiting bugs is strictly prohibited and may result in account suspension or permanent ban.' },
  { id: 'ip', icon: <FaCopyright />, title: 'Intellectual Property', content: 'Whotopia and its content, including the game design, code, graphics, and branding, are owned by Whotopia. You may not copy, modify, or distribute any part of the service without permission.' },
  { id: 'privacy', icon: <FaLock />, title: 'Privacy', content: 'We collect basic account information (email, display name) for authentication purposes. We do not share your personal data with third parties. Game statistics may be stored for leaderboard purposes.' },
  { id: 'liability', icon: <FaExclamationTriangle />, title: 'Limitation of Liability', content: 'Whotopia is provided "as is" without warranties. We are not liable for any damages arising from your use of the service, including data loss or gameplay interruptions.' },
  { id: 'changes', icon: <FaSyncAlt />, title: 'Changes to Terms', content: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.' },
  { id: 'termination', icon: <FaUserTimes />, title: 'Account Termination', content: 'We may suspend or terminate accounts for violations of these terms. You may delete your account at any time by contacting support.' },
  { id: 'contact', icon: <FaEnvelope />, title: 'Contact', content: 'For questions about these terms, please contact us through our support channels.' },
];

const TermsPage = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [visibleSections, setVisibleSections] = useState([]);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => [...new Set([...prev, entry.target.dataset.id])]);
          }
        });
      },
      { threshold: 0.15 }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="terms-page">
      <div className="terms-hero">
        <div className="terms-hero-bg">
          <div className="terms-orb terms-orb-1"></div>
          <div className="terms-orb terms-orb-2"></div>
          <div className="terms-orb terms-orb-3"></div>
        </div>
        <div className="terms-hero-content">
          <div className="terms-hero-icon">
            <FaShieldAlt />
          </div>
          <h1>Terms & Conditions</h1>
          <p>Please read these terms carefully before using Whotopia</p>
          <div className="terms-hero-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <div className="terms-body">
        <nav className="terms-side-nav">
          <h3>Jump to</h3>
          {sections.map((s, i) => (
            <button
              key={s.id}
              className={`terms-side-link ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => scrollToSection(s.id)}
            >
              <FaChevronRight className="terms-side-arrow" />
              <span>{i + 1}. {s.title}</span>
            </button>
          ))}
        </nav>

        <div className="terms-sections">
          {sections.map((s, i) => (
            <div
              key={s.id}
              ref={el => sectionRefs.current[s.id] = el}
              data-id={s.id}
              className={`terms-card ${visibleSections.includes(s.id) ? 'visible' : ''}`}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="terms-card-number">{String(i + 1).padStart(2, '0')}</div>
              <div className="terms-card-icon">{s.icon}</div>
              <h2>{s.title}</h2>
              <p>{s.content}</p>
              {s.list && (
                <ul>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ animationDelay: `${j * 0.1}s` }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="terms-footer-note">
            <p>These terms were last updated on July 7, 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

/**
 * LandingPage Component
 * 
 * Modern landing page for Whotopia with:
 * - Hero section with animations
 * - Features section
 * - How-to-play section
 * - Testimonials section
 * - Footer
 * - Mobile responsive design
 */

import { useNavigate } from 'react-router-dom';
import { FaPlay, FaUsers, FaTrophy, FaGamepad, FaStar, FaArrowRight, FaCheckCircle, FaTwitter, FaInstagram, FaDiscord } from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-gradient">Play Whot</span>
              <br />
              <span className="title-white">Like Never Before</span>
            </h1>
            <p className="hero-subtitle">
              Experience the classic Nigerian card game reimagined for the digital age.
              Play with friends, compete on leaderboards, and become a Whot champion.
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary" onClick={handleGetStarted}>
                <FaPlay className="button-icon" />
                Start Playing
              </button>
              <button className="cta-button secondary" onClick={() => document.getElementById('how-to-play').scrollIntoView({ behavior: 'smooth' })}>
                Learn More
                <FaArrowRight className="button-icon" />
              </button>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Players</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Games Played</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4.9</div>
                <div className="stat-label">User Rating</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="card-stack">
              <div className="card card-1">
                <div className="card-inner">
                  <div className="card-symbol">★</div>
                  <div className="card-value">7</div>
                </div>
              </div>
              <div className="card card-2">
                <div className="card-inner">
                  <div className="card-symbol">◆</div>
                  <div className="card-value">5</div>
                </div>
              </div>
              <div className="card card-3">
                <div className="card-inner">
                  <div className="card-symbol">●</div>
                  <div className="card-value">3</div>
                </div>
              </div>
              <div className="card card-4">
                <div className="card-inner">
                  <div className="card-symbol whot">W</div>
                  <div className="card-value">14</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-gradient"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Whotopia?</h2>
            <p className="section-subtitle">
              Discover the features that make Whotopia the ultimate Whot card game experience
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3 className="feature-title">Multiplayer</h3>
              <p className="feature-description">
                Play with friends or join public rooms. Real-time multiplayer with seamless sync.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaTrophy />
              </div>
              <h3 className="feature-title">Leaderboards</h3>
              <p className="feature-description">
                Compete for the top spot. Track your progress and climb the global rankings.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaGamepad />
              </div>
              <h3 className="feature-title">Easy to Learn</h3>
              <p className="feature-description">
                Intuitive interface perfect for beginners and experts alike.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaStar />
              </div>
              <h3 className="feature-title">Match History</h3>
              <p className="feature-description">
                Review your past games, analyze your performance, and improve your strategy.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3 className="feature-title">In-Game Chat</h3>
              <p className="feature-description">
                Communicate with opponents during games. Share strategies and have fun.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaCheckCircle />
              </div>
              <h3 className="feature-title">Secure & Fair</h3>
              <p className="feature-description">
                Secure authentication and fair gameplay. Your data is always protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="how-to-play-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How to Play</h2>
            <p className="section-subtitle">
              Learn the basics of Whot in just a few simple steps
            </p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Create an Account</h3>
                <p className="step-description">
                   Sign up with your email or Google account. It&apos;s quick and free.
                </p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Join or Create a Room</h3>
                <p className="step-description">
                  Find an available game room or create your own and invite friends.
                </p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Play & Win</h3>
                <p className="step-description">
                  Match cards by number or symbol. Be the first to empty your hand to win!
                </p>
              </div>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Climb the Ranks</h3>
                <p className="step-description">
                  Win games to earn points and climb the leaderboards.
                </p>
              </div>
            </div>
          </div>
          <div className="game-rules">
            <h3 className="rules-title">Quick Rules</h3>
            <ul className="rules-list">
              <li>Match cards by number or symbol</li>
              <li>Use special cards strategically</li>
              <li>Be the first to empty your hand</li>
              <li>Whot card is wild - match any card</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">What Players Say</h2>
            <p className="section-subtitle">
              Join thousands of happy players enjoying Whotopia
            </p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star" />
                ))}
              </div>
              <p className="testimonial-text">
                &ldquo;Whotopia brings back childhood memories! The multiplayer feature is amazing - I can play with my friends who live in different cities.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">A</div>
                <div className="author-info">
                  <div className="author-name">Adewale O.</div>
                  <div className="author-location">Lagos, Nigeria</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star" />
                ))}
              </div>
              <p className="testimonial-text">
                &ldquo;The best online Whot game I&apos;ve played. Smooth gameplay, great design, and the leaderboards keep me coming back for more!&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">N</div>
                <div className="author-info">
                  <div className="author-name">Ngozi M.</div>
                  <div className="author-location">Abuja, Nigeria</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="star" />
                ))}
              </div>
              <p className="testimonial-text">
                &ldquo;Finally, a proper Whot game online! The in-game chat makes it so much fun. Highly recommend to all card game lovers.&rdquo;
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">C</div>
                <div className="author-info">
                  <div className="author-name">Chinedu E.</div>
                  <div className="author-location">Port Harcourt, Nigeria</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Ready to Play?</h2>
          <p className="cta-subtitle">
            Join thousands of players and start your Whot journey today
          </p>
          <button className="cta-button large" onClick={handleGetStarted}>
            <FaPlay className="button-icon" />
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">Whotopia</h3>
              <p className="footer-description">
                The modern way to play the classic Nigerian Whot card game online.
              </p>
              <div className="social-links">
                <a href="#" className="social-link"><FaTwitter /></a>
                <a href="#" className="social-link"><FaInstagram /></a>
                <a href="#" className="social-link"><FaDiscord /></a>
              </div>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">Quick Links</h3>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#how-to-play">How to Play</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
                <li><a href="#" onClick={handleGetStarted}>Get Started</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">Support</h3>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3 className="footer-title">Newsletter</h3>
              <p className="footer-description">
                Stay updated with new features and game updates.
              </p>
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" className="newsletter-input" />
                <button className="newsletter-button">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Whotopia. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

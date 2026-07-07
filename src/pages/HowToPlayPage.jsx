import { useState, useEffect, useRef } from 'react';
import { FaDice, FaStar, FaCircle, FaPlus, FaMinus, FaBan, FaForward, FaShoppingBasket, FaChevronDown, FaBookOpen, FaBullseye, FaLightbulb, FaLayerGroup } from 'react-icons/fa';
import './HowToPlayPage.css';

const sections = [
  { id: 'overview', icon: <FaBookOpen />, label: 'Overview', color: '#e63946' },
  { id: 'deck', icon: <FaLayerGroup />, label: 'Card Deck', color: '#f72585' },
  { id: 'rules', icon: <FaBullseye />, label: 'Basic Rules', color: '#FF9800' },
  { id: 'specials', icon: <FaDice />, label: 'Special Cards', color: '#2196F3' },
  { id: 'tips', icon: <FaLightbulb />, label: 'Tips', color: '#4CAF50' },
];

const symbols = [
  { icon: <FaStar />, name: 'Star', symbol: '★', color: '#e63946' },
  { icon: <FaCircle />, name: 'Circle', symbol: '●', color: '#2196F3' },
  { icon: <FaPlus />, name: 'Cross', symbol: '✚', color: '#4CAF50' },
  { icon: <FaMinus />, name: 'Square', symbol: '■', color: '#FF9800' },
  { icon: <FaDice />, name: 'Triangle', symbol: '▲', color: '#9C27B0' },
];

const specials = [
  { icon: <FaBan />, title: 'Hold On (20)', desc: 'Play this card to force the same player to play again. It also lets you change the current symbol.', gradient: 'linear-gradient(135deg, #e63946, #f72585)' },
  { icon: <FaPlus />, title: 'Pick Two (2)', desc: 'Force the next player to draw 2 cards and lose their turn.', gradient: 'linear-gradient(135deg, #FF9800, #ff5722)' },
  { icon: <FaPlus />, title: 'Pick Three (14)', desc: 'Force the next player to draw 3 cards and lose their turn.', gradient: 'linear-gradient(135deg, #f44336, #b71c1c)' },
  { icon: <FaForward />, title: 'Suspension (8)', desc: 'Skip the next player\'s turn entirely.', gradient: 'linear-gradient(135deg, #2196F3, #1565C0)' },
  { icon: <FaShoppingBasket />, title: 'General Market (1)', desc: 'Force the next player to draw 1 card and lose their turn.', gradient: 'linear-gradient(135deg, #4CAF50, #2E7D32)' },
  { icon: <FaDice />, title: 'Whot! (20)', desc: 'The most powerful card! Can be played on any card and lets you choose a new symbol for the game.', gradient: 'linear-gradient(135deg, #e63946, #f72585)' },
];

const tips = [
  { text: 'Hold onto Whot cards — They can be played at any time and give you control over the game.', color: '#e63946' },
  { text: 'Watch opponent card counts — When an opponent has only 1 card, they could win at any moment.', color: '#f72585' },
  { text: 'Use Pick cards wisely — Stacking Pick Two and Pick Three cards can be devastating to opponents.', color: '#FF9800' },
  { text: 'Change symbols strategically — Use Whot cards to change to a symbol you have many of.', color: '#2196F3' },
  { text: 'Count cards — Pay attention to which symbols and values have been played to predict what opponents hold.', color: '#4CAF50' },
];

const HowToPlayPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [flippedCard, setFlippedCard] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRefs = useRef({});
  const observerRef = useRef(null);
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);

      if (parallaxRef.current) {
        const rect = parallaxRef.current.getBoundingClientRect();
        const speed = 0.3;
        parallaxRef.current.style.transform = `translateY(${rect.top * speed}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.dataset.section);
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.2, rootMargin: '-80px 0px -20% 0px' }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observerRef.current.observe(ref);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollToSection = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="how-to-play-page">
      {/* Scroll Progress Bar */}
      <div className="htp-progress-bar">
        <div className="htp-progress-fill" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Hero Section */}
      <section className="htp-hero" ref={parallaxRef}>
        <div className="htp-hero-bg">
          <div className="htp-particle p1"></div>
          <div className="htp-particle p2"></div>
          <div className="htp-particle p3"></div>
          <div className="htp-particle p4"></div>
          <div className="htp-particle p5"></div>
        </div>

        <div className="htp-hero-deck">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="htp-floating-card"
              style={{
                '--i': i,
                '--tx': `${Math.sin(i * 1.2) * 30}px`,
                '--ty': `${Math.cos(i * 0.8) * -20}px`,
                '--rot': `${Math.sin(i * 0.5) * 15}deg`,
                '--delay': `${i * 0.15}s`,
                '--symbol': symbols[i].symbol,
                '--color': symbols[i].color,
              }}
            >
              <span className="htp-floating-symbol">{symbols[i].symbol}</span>
            </div>
          ))}
        </div>

        <div className="htp-hero-content">
          <div className="htp-hero-icon-wrap">
            <FaDice />
          </div>
          <h1 className="htp-hero-title">
            <span className="htp-title-line">How to Play</span>
            <span className="htp-title-line accent">Whot</span>
          </h1>
          <p className="htp-hero-sub">Master the classic Nigerian card game</p>
          <button className="htp-hero-cta" onClick={() => scrollToSection('overview')}>
            <span>Start Learning</span>
            <FaChevronDown className="htp-cta-arrow" />
          </button>
        </div>

        <div className="htp-scroll-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </section>

      {/* Floating Nav */}
      <nav className="htp-float-nav">
        {sections.map((s) => (
          <button
            key={s.id}
            className={`htp-float-dot ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => scrollToSection(s.id)}
            style={{ '--dot-color': s.color }}
            title={s.label}
          >
            <span className="htp-dot-tooltip">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* Overview */}
      <section
        id="overview"
        ref={el => sectionRefs.current.overview = el}
        data-section="overview"
        className="htp-block"
      >
        <div className="htp-block-inner">
          <div className="htp-block-number">01</div>
          <div className="htp-block-header">
            <div className="htp-block-icon" style={{ background: 'linear-gradient(135deg, #e63946, #f72585)' }}>
              <FaBookOpen />
            </div>
            <h2>Overview</h2>
          </div>
          <p>
            Whot is a popular Nigerian card game similar to Crazy Eights or Uno. The goal
            is to be the <strong>first player to get rid of all your cards</strong> by matching the top card
            on the discard pile by either symbol or value.
          </p>
          <div className="htp-stats-row">
            <div className="htp-stat">
              <span className="htp-stat-num">2</span>
              <span className="htp-stat-label">Players</span>
            </div>
            <div className="htp-stat">
              <span className="htp-stat-num">54</span>
              <span className="htp-stat-label">Cards</span>
            </div>
            <div className="htp-stat">
              <span className="htp-stat-num">5</span>
              <span className="htp-stat-label">Symbols</span>
            </div>
            <div className="htp-stat">
              <span className="htp-stat-num">5</span>
              <span className="htp-stat-label">Start Hand</span>
            </div>
          </div>
        </div>
      </section>

      {/* Card Deck */}
      <section
        id="deck"
        ref={el => sectionRefs.current.deck = el}
        data-section="deck"
        className="htp-block"
      >
        <div className="htp-block-inner">
          <div className="htp-block-header">
            <div className="htp-block-icon" style={{ background: 'linear-gradient(135deg, #f72585, #b5179e)' }}>
              <FaLayerGroup />
            </div>
            <h2>Card Deck</h2>
          </div>
          <p>A Whot deck consists of <strong>54 cards</strong> across 5 unique symbols:</p>

          <div className="htp-symbol-grid">
            {symbols.map((s, i) => (
              <div
                key={s.name}
                className="htp-symbol-card"
                style={{ '--hue': i * 72, '--card-color': s.color }}
              >
                <div className="htp-symbol-visual" style={{ color: s.color }}>
                  {s.icon}
                </div>
                <div className="htp-symbol-name">{s.name}</div>
                <div className="htp-symbol-char">{s.symbol}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Basic Rules */}
      <section
        id="rules"
        ref={el => sectionRefs.current.rules = el}
        data-section="rules"
        className="htp-block"
      >
        <div className="htp-block-inner">
          <div className="htp-block-header">
            <div className="htp-block-icon" style={{ background: 'linear-gradient(135deg, #FF9800, #ff5722)' }}>
              <FaBullseye />
            </div>
            <h2>Basic Rules</h2>
          </div>

          <div className="htp-rules-timeline">
            {[
              { num: '1', text: 'Each player is dealt 5 cards at the start of the game.' },
              { num: '2', text: 'The top card of the discard pile determines the current symbol and value.' },
              { num: '3', text: 'On your turn, play a card that matches either the current symbol or the current value.' },
              { num: '4', text: 'If you cannot play, draw a card from the draw pile.' },
              { num: '5', text: 'If the drawn card can be played, you may play it immediately.' },
              { num: '6', text: 'If you cannot play after drawing, your turn passes to the next player.' },
              { num: '7', text: 'The first player to empty their hand wins the game!' },
            ].map((rule, i) => (
              <div
                key={i}
                className="htp-rule-step"
                style={{ '--step-delay': `${i * 0.1}s` }}
              >
                <div className="htp-step-marker">
                  <span>{rule.num}</span>
                </div>
                <div className="htp-step-line" />
                <div className="htp-step-content">
                  <p>{rule.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Cards */}
      <section
        id="specials"
        ref={el => sectionRefs.current.specials = el}
        data-section="specials"
        className="htp-block"
      >
        <div className="htp-block-inner">
          <div className="htp-block-header">
            <div className="htp-block-icon" style={{ background: 'linear-gradient(135deg, #2196F3, #1565C0)' }}>
              <FaDice />
            </div>
            <h2>Special Cards</h2>
          </div>
          <p>These cards have special effects that can change the tide of the game:</p>

          <div className="htp-specials-grid">
            {specials.map((card, i) => (
              <div
                key={i}
                className={`htp-special-card ${flippedCard === i ? 'flipped' : ''}`}
                onClick={() => setFlippedCard(flippedCard === i ? null : i)}
                style={{ '--card-delay': `${i * 0.1}s` }}
              >
                <div className="htp-special-front">
                  <div className="htp-special-glow" style={{ background: card.gradient }} />
                  <div className="htp-special-icon" style={{ background: card.gradient }}>
                    {card.icon}
                  </div>
                  <h3>{card.title}</h3>
                  <span className="htp-special-tap">Tap to reveal</span>
                </div>
                <div className="htp-special-back">
                  <p>{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section
        id="tips"
        ref={el => sectionRefs.current.tips = el}
        data-section="tips"
        className="htp-block"
      >
        <div className="htp-block-inner">
          <div className="htp-block-header">
            <div className="htp-block-icon" style={{ background: 'linear-gradient(135deg, #4CAF50, #2E7D32)' }}>
              <FaLightbulb />
            </div>
            <h2>Tips & Strategies</h2>
          </div>

          <div className="htp-tips-grid">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="htp-tip-card"
                style={{ '--tip-color': tip.color, '--tip-delay': `${i * 0.12}s` }}
              >
                <div className="htp-tip-number">{String(i + 1).padStart(2, '0')}</div>
                <div className="htp-tip-bar" style={{ background: tip.color }} />
                <p>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="htp-footer">
        <div className="htp-footer-glow" />
        <p>Now that you know the rules, jump into a game!</p>
        <button className="htp-footer-btn" onClick={() => document.querySelector('.htp-hero')?.scrollIntoView({ behavior: 'smooth' })}>
          <FaDice /> Ready to Play
        </button>
      </section>
    </div>
  );
};

export default HowToPlayPage;

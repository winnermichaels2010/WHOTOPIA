import { FaDice, FaStar, FaCircle, FaPlus, FaMinus, FaBan, FaForward, FaRedo, FaShoppingBasket } from 'react-icons/fa';
import './HowToPlayPage.css';

const HowToPlayPage = () => {
  return (
    <div className="how-to-play-page">
      <div className="htp-header">
        <h1>How to Play Whot</h1>
        <p>Learn the rules of the classic Nigerian card game</p>
      </div>

      <div className="htp-section">
        <h2>Overview</h2>
        <p>
          Whot is a popular Nigerian card game similar to Crazy Eights or Uno. The goal
          is to be the first player to get rid of all your cards by matching the top card
          on the discard pile by either symbol or value.
        </p>
      </div>

      <div className="htp-section">
        <h2>Card Deck</h2>
        <p>A Whot deck consists of cards with 5 symbols and various values:</p>
        <div className="htp-symbols">
          <div className="htp-symbol"><FaStar style={{color: '#e63946'}} /> Star (★)</div>
          <div className="htp-symbol"><FaCircle style={{color: '#2196F3'}} /> Circle (●)</div>
          <div className="htp-symbol"><FaPlus style={{color: '#4CAF50'}} /> Cross (✚)</div>
          <div className="htp-symbol"><FaMinus style={{color: '#FF9800'}} /> Square (■)</div>
          <div className="htp-symbol"><FaDice style={{color: '#9C27B0'}} /> Triangle (▲)</div>
        </div>
      </div>

      <div className="htp-section">
        <h2>Basic Rules</h2>
        <ul className="htp-rules-list">
          <li>Each player is dealt 5 cards at the start of the game.</li>
          <li>The top card of the discard pile determines the current symbol and value.</li>
          <li>On your turn, play a card that matches <strong>either</strong> the current symbol <strong>or</strong> the current value.</li>
          <li>If you cannot play, draw a card from the draw pile.</li>
          <li>If the drawn card can be played, you may play it immediately.</li>
          <li>If you cannot play after drawing, your turn passes to the next player.</li>
          <li>The first player to empty their hand wins the game!</li>
        </ul>
      </div>

      <div className="htp-section">
        <h2>Special Cards</h2>
        <div className="htp-cards-grid">
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon hold-on"><FaBan /></div>
            <h3>Hold On (20)</h3>
            <p>Play this card to force the same player to play again. It also lets you change the current symbol.</p>
          </div>
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon pick-two"><FaPlus /></div>
            <h3>Pick Two (2)</h3>
            <p>Force the next player to draw 2 cards and lose their turn.</p>
          </div>
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon pick-three"><FaPlus /></div>
            <h3>Pick Three (14)</h3>
            <p>Force the next player to draw 3 cards and lose their turn.</p>
          </div>
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon suspension"><FaForward /></div>
            <h3>Suspension (8)</h3>
            <p>Skip the next player's turn entirely.</p>
          </div>
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon general-market"><FaShoppingBasket /></div>
            <h3>General Market (1)</h3>
            <p>Force the next player to draw 1 card and lose their turn.</p>
          </div>
          <div className="htp-card-rule">
            <div className="htp-card-rule-icon whot"><FaDice /></div>
            <h3>Whot! (20)</h3>
            <p>The most powerful card! Can be played on any card and lets you choose a new symbol for the game.</p>
          </div>
        </div>
      </div>

      <div className="htp-section">
        <h2>Tips & Strategies</h2>
        <ul className="htp-tips-list">
          <li><strong>Hold onto Whot cards</strong> — They can be played at any time and give you control over the game.</li>
          <li><strong>Watch opponent card counts</strong> — When an opponent has only 1 card, they could win at any moment.</li>
          <li><strong>Use Pick cards wisely</strong> — Stacking Pick Two and Pick Three cards can be devastating to opponents.</li>
          <li><strong>Change symbols strategically</strong> — Use Whot cards to change to a symbol you have many of.</li>
          <li><strong>Count cards</strong> — Pay attention to which symbols and values have been played to predict what opponents hold.</li>
        </ul>
      </div>
    </div>
  );
};

export default HowToPlayPage;

import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameEngine from '../game/GameEngine';
import AIEngine from '../game/AIEngine';
import PlayerHand from '../components/game/PlayerHand';
import OpponentArea from '../components/game/OpponentArea';
import Card from '../components/game/Card';
import { FaArrowLeft, FaPlay, FaRedo, FaRobot, FaGlobe, FaTrophy, FaMeh } from 'react-icons/fa';
import './GamePage.css';

const SYMBOLS = [
  { id: 'star', symbol: '★', name: 'Star' },
  { id: 'circle', symbol: '●', name: 'Circle' },
  { id: 'cross', symbol: '✚', name: 'Cross' },
  { id: 'square', symbol: '■', name: 'Square' },
  { id: 'triangle', symbol: '▲', name: 'Triangle' },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', desc: 'AI plays randomly' },
  { id: 'medium', name: 'Medium', desc: 'AI uses basic strategy' },
  { id: 'hard', name: 'Hard', desc: 'AI uses advanced strategy' },
];

const GamePage = () => {
  const { mode } = useParams();
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const aiRef = useRef(null);

  const [gameState, setGameState] = useState(null);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [dealPhase, setDealPhase] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const updateGameState = useCallback(() => {
    if (gameRef.current) {
      const state = gameRef.current.getGameState(0);
      setGameState({ ...state });
    }
  }, []);

  const startGame = () => {
    const engine = new GameEngine();
    gameRef.current = engine;

    const playerName = mode === 'ai' ? 'You' : 'Player 1';
    const aiName = mode === 'ai' ? 'Computer' : 'Player 2';

    engine.initGame([playerName, aiName], 5);
    if (mode === 'ai') {
      engine.players[1].isAI = true;
      aiRef.current = new AIEngine(difficulty);
    }

    setShowStartScreen(false);
    setDealing(true);
    setDealPhase(0);
    setRevealed(false);
    setGameState(null);

    setTimeout(() => setDealPhase(1), 400);
    setTimeout(() => setDealPhase(2), 900);
    setTimeout(() => {
      setDealPhase(3);
      setRevealed(true);
      updateGameState();
    }, 1400);
    setTimeout(() => {
      setDealing(false);
      if (engine.currentTurn === 1) {
        setTimeout(() => handleAITurn(), 600);
      }
    }, 2000);
  };

  const handleCardClick = (card) => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== 0) return;
    if (gameRef.current.drawPenalty > 0) return;

    if (card.value === 20) {
      setPendingCard(card);
      setShowSymbolPicker(true);
      return;
    }

    const result = gameRef.current.playCard(card, 0);
    if (result.success) {
      updateGameState();
      if (result.gameOver) {
        return;
      }
      if (gameRef.current.currentTurn === 1) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleSymbolSelect = (symbolId) => {
    if (!pendingCard) return;

    const result = gameRef.current.playCard(pendingCard, 0, symbolId);
    setShowSymbolPicker(false);
    setPendingCard(null);

    if (result.success) {
      updateGameState();
      if (result.gameOver) {
        return;
      }
      if (gameRef.current.currentTurn === 1) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleDrawCard = () => {
    if (!gameRef.current || gameRef.current.currentTurn !== 0) return;

    const result = gameRef.current.drawCard(0);
    if (result.success) {
      updateGameState();
      if (!result.isPlayable && gameRef.current.currentTurn === 1) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handlePassAfterDraw = () => {
    if (!gameRef.current) return;
    gameRef.current.passAfterDraw(0);
    updateGameState();
    if (gameRef.current.currentTurn === 1) {
      setTimeout(() => handleAITurn(), 600);
    }
  };

  const handleAITurn = () => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== 1) return;
    if (!aiRef.current) return;

    setIsAIThinking(true);

    setTimeout(() => {
      const engine = gameRef.current;
      const ai = aiRef.current;

      if (engine.drawPenalty > 0) {
        setIsAIThinking(false);
        if (engine.currentTurn === 0) return;
        return;
      }

      const validCards = engine.getValidCards(1);
      const state = engine.getGameState(1);
      const shouldDraw = ai.shouldDraw(validCards, state);

      if (shouldDraw || validCards.length === 0) {
        const result = engine.drawCard(1);
        if (result.success) {
          updateGameState();
          if (result.isPlayable && ai.shouldPlayDrawnCard(result.card, state)) {
            const symbol = result.card.value === 20 ? ai.chooseSymbol(engine.getGameState(1)) : null;
            const playResult = engine.playCard(result.card, 1, symbol);
            if (playResult.success) {
              updateGameState();
              if (playResult.gameOver) {
                setIsAIThinking(false);
                return;
              }
            }
          }
        } else {
          updateGameState();
        }

        setIsAIThinking(false);
        if (engine.currentTurn === 0) return;
        setTimeout(() => handleAITurn(), 500);
        return;
      }

      const chosenCard = ai.chooseCard(validCards, state);

      if (chosenCard && chosenCard.value === 20) {
        const chosenSymbol = ai.chooseSymbol(engine.getGameState(1));
        const result = engine.playCard(chosenCard, 1, chosenSymbol);
        if (result.success) {
          updateGameState();
          if (result.gameOver) {
            setIsAIThinking(false);
            return;
          }
        }
      } else if (chosenCard) {
        const result = engine.playCard(chosenCard, 1);
        if (result.success) {
          updateGameState();
          if (result.gameOver) {
            setIsAIThinking(false);
            return;
          }
        }
      }

      setIsAIThinking(false);

      if (engine.currentTurn === 1 && engine.gameStatus === 'playing') {
        setTimeout(() => handleAITurn(), 500);
      }
    }, 1000);
  };

  const handleRestart = () => {
    setShowStartScreen(true);
    setShowSymbolPicker(false);
    setPendingCard(null);
    setIsAIThinking(false);
    setDealing(false);
    gameRef.current = null;
    aiRef.current = null;
  };

  if (showStartScreen) {
    return (
      <div className="game-page">
        <div className="game-start-screen">
          <button className="game-back-btn" onClick={() => navigate('/')}>
            <FaArrowLeft /> Back
          </button>

          <div className="start-content">
            <div className="start-icon">
              {mode === 'ai' ? <FaRobot /> : <FaGlobe />}
            </div>
            <h1 className="start-title">
              {mode === 'ai' ? 'Play vs Computer' : 'Online Multiplayer'}
            </h1>
            <p className="start-subtitle">
              {mode === 'ai'
                ? 'Challenge the computer in a game of Whot. Choose your difficulty level!'
                : 'Coming soon! Play against friends online.'}
            </p>

            {mode === 'ai' && (
              <div className="difficulty-selector">
                <h3>Select Difficulty</h3>
                <div className="difficulty-options">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d.id}
                      className={`difficulty-btn ${difficulty === d.id ? 'active' : ''}`}
                      onClick={() => setDifficulty(d.id)}
                    >
                      <span className="diff-name">{d.name}</span>
                      <span className="diff-desc">{d.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="start-game-btn"
              onClick={startGame}
              disabled={mode !== 'ai'}
            >
              <FaPlay /> Start Game
            </button>

            {mode !== 'ai' && (
              <div className="coming-soon-badge">Coming Soon</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (dealing) {
    return (
      <div className="game-page">
        <div className="dealing-overlay">
          <div className="deal-animation">
            <div className={`deal-deck ${dealPhase >= 1 ? 'deal-deck-shuffling' : ''}`}>
              <div className="deal-card back"></div>
              <div className="deal-card back"></div>
              <div className="deal-card back"></div>
            </div>
            <div className="deal-players">
              <div className="deal-player opponent-cards-deal">
                <div className={`deal-card back ${dealPhase >= 2 ? 'dealt' : ''}`}></div>
                <div className={`deal-card back ${dealPhase >= 2 ? 'dealt' : ''}`}></div>
                <div className={`deal-card back ${dealPhase >= 2 ? 'dealt' : ''}`}></div>
                <div className="deal-label">Computer</div>
              </div>
              <div className="deal-player player-cards-deal">
                <div className={`deal-card ${dealPhase >= 3 && revealed ? 'front' : 'back'} ${dealPhase >= 2 ? 'dealt' : ''}`}>
                  {dealPhase >= 3 && revealed && <span className="deal-card-value">?</span>}
                </div>
                <div className={`deal-card ${dealPhase >= 3 && revealed ? 'front' : 'back'} ${dealPhase >= 2 ? 'dealt' : ''}`}>
                  {dealPhase >= 3 && revealed && <span className="deal-card-value">?</span>}
                </div>
                <div className={`deal-card back ${dealPhase >= 2 ? 'dealt' : ''}`}></div>
                <div className="deal-label">You</div>
              </div>
            </div>
            <div className="deal-text">
              {dealPhase === 0 && 'Shuffling deck...'}
              {dealPhase === 1 && 'Shuffling deck...'}
              {dealPhase === 2 && 'Dealing cards...'}
              {dealPhase === 3 && 'Ready!'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState?.gameStatus === 'finished') {
    const isWinner = gameState.winner === 0;
    return (
      <div className="game-page">
        <div className="game-over-screen">
          <div className="game-over-content">
            <div className="game-over-icon">{isWinner ? <FaTrophy /> : <FaMeh />}</div>
            <h1 className="game-over-title">{isWinner ? 'You Win!' : 'You Lose!'}</h1>
            <p className="game-over-subtitle">
              {isWinner
                ? 'Congratulations! You defeated the computer!'
                : 'Better luck next time! Try again.'}
            </p>
            <div className="game-over-actions">
              <button className="game-over-btn primary" onClick={handleRestart}>
                <FaRedo /> Play Again
              </button>
              <button className="game-over-btn secondary" onClick={() => navigate('/')}>
                <FaArrowLeft /> Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showSymbolPicker) {
    return (
      <div className="symbol-picker-overlay">
        <div className="symbol-picker-modal">
          <h2>Choose a Symbol</h2>
          <p>Select the symbol for your Whot card</p>
          <div className="symbol-options">
            {SYMBOLS.map(sym => (
              <button
                key={sym.id}
                className="symbol-option"
                onClick={() => handleSymbolSelect(sym.id)}
              >
                <span className="symbol-display">{sym.symbol}</span>
                <span className="symbol-name">{sym.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <button className="game-back-btn" onClick={() => navigate('/')}>
          <FaArrowLeft />
        </button>
        <div className="game-info-bar">
          <div className="game-status">
            {gameState?.currentTurn === 0 ? 'Your Turn' : "Opponent's Turn"}
            {isAIThinking && <span className="thinking-dots"> thinking<span>.</span><span>.</span><span>.</span></span>}
            {gameState?.drawPenalty > 0 && gameState?.currentTurn === 0 && (
              <span className="draw-penalty-warning"> (Draw {gameState.drawPenalty}!)</span>
            )}
          </div>
          <div className="game-symbol-display">
            Symbol: <strong>{gameState?.currentSymbol ? SYMBOLS.find(s => s.id === gameState.currentSymbol)?.symbol || '⭐' : '-'}</strong>
          </div>
          <div className="game-actions-header">
            <button className="header-action-btn" onClick={handleRestart} title="Restart">
              <FaRedo />
            </button>
          </div>
        </div>
      </div>

      <div className="game-layout">
        <OpponentArea
          players={gameState?.players || []}
          currentPlayerId={0}
        />

        <div className="game-board">
          <div className="board-center">
            <div className="draw-pile" onClick={handleDrawCard}>
              <div className="draw-pile-stack">
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
              </div>
              <span className="draw-label">Draw</span>
              <span className="draw-count">{gameState?.deckSize || 0} left</span>
            </div>

            <div className="played-card-area">
              {gameState?.topCard ? (
                <Card card={gameState.topCard} disabled small={false} />
              ) : (
                <div className="empty-play-area">
                  <span>Play Area</span>
                </div>
              )}
            </div>

            <div className="last-action">{gameState?.lastAction}</div>
          </div>
        </div>

        {gameState?.canPlayDrawnCard && gameState?.currentTurn === 0 && (
          <div className="game-actions">
            <button className="pass-btn" onClick={handlePassAfterDraw}>
              Pass
            </button>
          </div>
        )}

        <div className="player-area">
          <div className="player-label">
            Your Hand ({gameState?.myHand?.length || 0} cards)
          </div>
          <PlayerHand
            cards={gameState?.myHand || []}
            onCardClick={handleCardClick}
            disabled={gameState?.currentTurn !== 0 || isAIThinking || gameState?.drawPenalty > 0}
            validMoves={gameState?.validMoves || []}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;

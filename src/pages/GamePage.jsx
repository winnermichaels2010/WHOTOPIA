import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GameEngine from '../game/GameEngine';
import AIEngine from '../game/AIEngine';
import PlayerHand from '../components/game/PlayerHand';
import OpponentArea from '../components/game/OpponentArea';
import Card from '../components/game/Card';
import { onGameStateChange, setGameState, getGameState } from '../firebase/services/realtimeDBService.js';
import { FaArrowLeft, FaRedo, FaRobot, FaSpinner, FaTrophy, FaMeh } from 'react-icons/fa';
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
  const { mode, roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const gameRef = useRef(null);
  const aiRef = useRef(null);
  const dbUnsubRef = useRef(null);
  const isHost = location.state?.isHost === true;
  const isOnline = !!roomId;
  const myPlayerIndex = isOnline ? (isHost ? 0 : 1) : 0;
  const opponentIndex = myPlayerIndex === 0 ? 1 : 0;

  const [gameState, setGs] = useState(null);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [dealPhase, setDealPhase] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [wrongMoveMessage, setWrongMoveMessage] = useState(null);
  const [waitingForGame, setWaitingForGame] = useState(false);
  const wrongMoveTimeout = useRef(null);

  const updateGameState = useCallback(() => {
    if (gameRef.current) {
      const state = gameRef.current.getGameState(myPlayerIndex);
      setGs({ ...state });
    }
  }, [myPlayerIndex]);

  const syncStateToDB = useCallback(async () => {
    if (!isOnline || !roomId || !gameRef.current) return;
    try {
      const state = gameRef.current.exportState();
      await setGameState(roomId, state);
    } catch (err) {
      console.error('Failed to sync game state:', err);
      setWrongMoveMessage(`Sync error: ${err.message}`);
      try {
        const snapshot = await getGameState(roomId);
        if (snapshot.exists()) {
          const cleanState = { ...snapshot.val() };
          delete cleanState.lastUpdated;
          gameRef.current.importState(cleanState);
        }
      } catch (reloadErr) {
        console.error('Failed to reload state from Firebase:', reloadErr);
      }
    }
  }, [isOnline, roomId]);

  const startGame = (diff) => {
    const engine = new GameEngine();
    gameRef.current = engine;

    const playerName = mode === 'ai' ? 'You' : 'Player 1';
    const aiName = mode === 'ai' ? 'Computer' : 'Player 2';

    engine.initGame([playerName, aiName], 5);
    if (mode === 'ai') {
      engine.players[1].isAI = true;
      aiRef.current = new AIEngine(diff || difficulty);
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

  const handleCardClick = async (card) => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== myPlayerIndex) return;
    if (gameRef.current.drawPenalty > 0) return;

    const validation = gameRef.current.canPlayCard(card, myPlayerIndex);
    if (!validation.valid) {
      if (wrongMoveTimeout.current) clearTimeout(wrongMoveTimeout.current);
      setWrongMoveMessage('Wrong move 😜');
      wrongMoveTimeout.current = setTimeout(() => setWrongMoveMessage(null), 1500);
      return;
    }

    if (card.value === 20) {
      setPendingCard(card);
      setShowSymbolPicker(true);
      return;
    }

    const result = gameRef.current.playCard(card, myPlayerIndex);
    if (result.success) {
      await syncStateToDB();
      if (result.gameOver) {
        return;
      }
      if (isOnline && gameRef.current.currentTurn === opponentIndex) {
        return;
      }
      if (gameRef.current.currentTurn === opponentIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleSymbolSelect = async (symbolId) => {
    if (!pendingCard) return;

    const result = gameRef.current.playCard(pendingCard, myPlayerIndex, symbolId);
    setShowSymbolPicker(false);
    setPendingCard(null);

    if (result.success) {
      await syncStateToDB();
      if (result.gameOver) {
        return;
      }
      if (isOnline && gameRef.current.currentTurn === opponentIndex) {
        return;
      }
      if (gameRef.current.currentTurn === opponentIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleDrawCard = async () => {
    if (!gameRef.current || gameRef.current.currentTurn !== myPlayerIndex) return;

    const result = gameRef.current.drawCard(myPlayerIndex);
    if (result.success) {
      await syncStateToDB();
      if (isOnline) return;
      if (!result.isPlayable && gameRef.current.currentTurn === opponentIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
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
        const result = engine.drawCard(1);
        if (result.success) {
          updateGameState();
        }
        setIsAIThinking(false);
        if (engine.currentTurn === 1 && engine.gameStatus === 'playing') {
          setTimeout(() => handleAITurn(), 500);
        }
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

  useEffect(() => {
    return () => {
      if (wrongMoveTimeout.current) clearTimeout(wrongMoveTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !roomId) return;

    setShowStartScreen(false);
    setWaitingForGame(true);

    dbUnsubRef.current = onGameStateChange(roomId, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const dbState = snapshot.val();
          const cleanState = { ...dbState };
          delete cleanState.lastUpdated;
          setWrongMoveMessage(null);
          if (gameRef.current) {
            gameRef.current.importState(cleanState);
            updateGameState();
          } else {
            const engine = new GameEngine();
            engine.importState(cleanState);
            gameRef.current = engine;
            setWaitingForGame(false);
            setShowStartScreen(false);
            updateGameState();
          }
        } else if (isHost) {
          const engine = new GameEngine();
          gameRef.current = engine;
          engine.initGame(['You', 'Opponent'], 5);
          engine.players[0].name = 'You';
          engine.players[1].name = 'Opponent';

          const state = engine.exportState();
          (async () => {
            try {
              await setGameState(roomId, state);
              setWaitingForGame(false);
            } catch (err) {
              console.error('Failed to write initial game state:', err);
              gameRef.current = null;
              setWrongMoveMessage(`Failed to initialize game: ${err.message}`);
            }
          })();
        }
      } catch (err) {
        console.error('Error processing game state update:', err);
      }
    }, (error) => {
      console.error('Game state listener error:', error);
      if (wrongMoveTimeout.current) clearTimeout(wrongMoveTimeout.current);
      setWrongMoveMessage('Connection lost — trying to reconnect...');
      wrongMoveTimeout.current = setTimeout(() => setWrongMoveMessage(null), 5000);
    });

    return () => {
      if (dbUnsubRef.current) {
        dbUnsubRef.current();
        dbUnsubRef.current = null;
      }
    };
  }, [isOnline, roomId, isHost, updateGameState]);

  const handleRestart = () => {
    if (dbUnsubRef.current) {
      dbUnsubRef.current();
      dbUnsubRef.current = null;
    }
    setShowStartScreen(true);
    setShowSymbolPicker(false);
    setPendingCard(null);
    setIsAIThinking(false);
    setDealing(false);
    setWaitingForGame(false);
    setWrongMoveMessage(null);
    if (wrongMoveTimeout.current) clearTimeout(wrongMoveTimeout.current);
    gameRef.current = null;
    aiRef.current = null;
    if (isOnline) {
      navigate('/lobby');
    }
  };

  if (showStartScreen) {
    if (isOnline) {
      return (
        <div className="game-page">
          <div className="game-start-screen">
            <button className="game-back-btn" onClick={() => navigate('/lobby')}>
              <FaArrowLeft /> Back
            </button>
            <div className="start-content">
              <div className="start-icon">
                <FaSpinner className="spinner-icon" />
              </div>
              <h1 className="start-title">Joining Game</h1>
              <p className="start-subtitle">Connecting to game server...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="game-page">
        <div className="game-start-screen">
          <button className="game-back-btn" onClick={() => navigate('/')}>
            <FaArrowLeft /> Back
          </button>

          <div className="start-content">
            <div className="start-icon">
              <FaRobot />
            </div>
            <h1 className="start-title">Play vs Computer</h1>
            <p className="start-subtitle">
              Challenge the computer in a game of Whot. Choose your difficulty level!
            </p>

            <div className="difficulty-selector">
              <h3>Select Difficulty</h3>
              <div className="difficulty-options">
                {DIFFICULTIES.map(d => (
                  <button
                    key={d.id}
                    className={`difficulty-btn ${difficulty === d.id ? 'active' : ''}`}
                    onClick={() => {
                      setDifficulty(d.id);
                      startGame(d.id);
                    }}
                  >
                    <span className="diff-name">{d.name}</span>
                    <span className="diff-desc">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOnline && waitingForGame) {
    return (
      <div className="game-page">
        <div className="game-start-screen">
          <button className="game-back-btn" onClick={() => navigate('/lobby')}>
            <FaArrowLeft /> Back
          </button>
          <div className="start-content">
            <div className="start-icon">
              <FaSpinner className="spinner-icon" />
            </div>
            <h1 className="start-title">Waiting for opponent...</h1>
            <p className="start-subtitle">The game will start once your opponent connects.</p>
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
    const isWinner = gameState.winner === myPlayerIndex;
    const opponentName = isOnline ? 'Opponent' : 'the computer';
    return (
      <div className="game-page">
        <div className="game-over-screen">
          <div className="game-over-content">
            <div className="game-over-icon">{isWinner ? <FaTrophy /> : <FaMeh />}</div>
            <h1 className="game-over-title">{isWinner ? 'You Win!' : 'You Lose!'}</h1>
            <p className="game-over-subtitle">
              {isWinner
                ? `Congratulations! You defeated ${opponentName}!`
                : `Better luck next time! ${opponentName.charAt(0).toUpperCase() + opponentName.slice(1)} got you.`}
            </p>
            <div className="game-over-actions">
              {!isOnline && (
                <button className="game-over-btn primary" onClick={handleRestart}>
                  <FaRedo /> Play Again
                </button>
              )}
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
      <div className="symbol-picker-overlay" onClick={() => {
        setShowSymbolPicker(false);
        setPendingCard(null);
      }}>
        <div className="symbol-picker-modal" onClick={e => e.stopPropagation()}>
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
          <button className="symbol-picker-back-btn" onClick={() => {
            setShowSymbolPicker(false);
            setPendingCard(null);
          }}>
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
          <button className="game-back-btn" onClick={() => navigate(isOnline ? '/lobby' : '/')}>
            <FaArrowLeft />
          </button>
          <div className="game-info-bar">
            <div className="game-status">
              {gameState?.currentTurn === myPlayerIndex ? 'Your Turn' : "Opponent's Turn"}
              {isAIThinking && <span className="thinking-dots"> thinking<span>.</span><span>.</span><span>.</span></span>}
              {gameState?.drawPenalty > 0 && gameState?.currentTurn === myPlayerIndex && (
                <span className="draw-penalty-warning"> (Draw {gameState.drawPenalty}!)</span>
              )}
            </div>
            <div className="game-symbol-display">
              Symbol: <strong>{gameState?.currentSymbol ? SYMBOLS.find(s => s.id === gameState.currentSymbol)?.symbol || '⭐' : '-'}</strong>
            </div>
            <div className="game-actions-header">
              {!isOnline && (
                <button className="header-action-btn" onClick={handleRestart} title="Restart">
                  <FaRedo />
                </button>
              )}
            </div>
          </div>
      </div>

      <div className="game-layout">
        <OpponentArea
          players={gameState?.players || []}
          currentPlayerId={myPlayerIndex}
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

        <div className="player-area">
          <div className="player-label">
            Your Hand ({gameState?.myHand?.length || 0} cards)
          </div>
          {wrongMoveMessage && (
            <div className="wrong-move-message">{wrongMoveMessage}</div>
          )}
          <PlayerHand
            cards={gameState?.myHand || []}
            onCardClick={handleCardClick}
            disabled={gameState?.currentTurn !== myPlayerIndex || isAIThinking || gameState?.drawPenalty > 0}
          />
        </div>
      </div>
    </div>
  );
};

export default GamePage;

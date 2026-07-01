import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameEngine from '../game/GameEngine';
import AIEngine from '../game/AIEngine';
import PlayerHand from '../components/game/PlayerHand';
import OpponentArea from '../components/game/OpponentArea';
import Card from '../components/game/Card';
import { FaArrowLeft, FaPlay, FaRedo, FaStepForward, FaTimes, FaRobot, FaGlobe, FaTrophy, FaSmile, FaMeh } from 'react-icons/fa';
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
  const { mode } = useParams(); // 'ai' or 'online'
  const navigate = useNavigate();
  const gameRef = useRef(null);
  const aiRef = useRef(null);

  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [pendingCard, setPendingCard] = useState(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameLog, setGameLog] = useState([]);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const updateGameState = useCallback(() => {
    if (gameRef.current) {
      const state = gameRef.current.getGameState(0);
      setGameState({ ...state });
    }
  }, []);

  const addLog = (message) => {
    setGameLog(prev => [{ text: message, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  };

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
    setSelectedCard(null);
    setGameLog([]);
    updateGameState();
    addLog('Game started! Good luck!');
  };

  const handleCardClick = (card) => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== 0) return;
    if (gameRef.current.pendingPick2 > 0) return;

    setSelectedCard(prev => prev?.id === card.id ? null : card);

    // Check if card needs symbol selection
    if (card && (card.specialType === 'market' || card.specialType === 'whot')) {
      setPendingCard(card);
      setShowSymbolPicker(true);
      setSelectedCard(null);
    }
  };

  const handleSymbolSelect = (symbolId) => {
    if (!pendingCard) return;

    const result = gameRef.current.playCard(pendingCard, 0, symbolId);
    setShowSymbolPicker(false);
    setPendingCard(null);

    if (result.success) {
      addLog(`You played ${pendingCard.name} > ${symbolId}`);
      updateGameState();

      if (result.gameOver) {
        addLog('You win!');
        return;
      }

      // AI turn
      setTimeout(() => handleAITurn(), 800);
    }
  };

  const handlePlayCard = () => {
    if (!selectedCard) return;

    if (selectedCard.specialType === 'market' || selectedCard.specialType === 'whot') {
      setPendingCard(selectedCard);
      setShowSymbolPicker(true);
      setSelectedCard(null);
      return;
    }

    const result = gameRef.current.playCard(selectedCard, 0);
    if (result.success) {
      addLog(`You played ${selectedCard.name}`);
      setSelectedCard(null);
      updateGameState();

      if (result.gameOver) {
        addLog('You win!');
        return;
      }

      // AI turn
      setTimeout(() => handleAITurn(), 800);
    }
  };

  const handleDrawCard = () => {
    if (!gameRef.current || gameRef.current.currentTurn !== 0) return;

    const drawn = gameRef.current.drawCards(0, gameRef.current.pendingPick2 > 0 ? gameRef.current.pendingPick2 : 1);
    addLog(`You drew ${drawn.length} card(s)`);
    setSelectedCard(null);
    updateGameState();

    // AI turn
    setTimeout(() => handleAITurn(), 800);
  };

  const handleAITurn = () => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== 1) return;
    if (!aiRef.current) return;

    setIsAIThinking(true);

    // AI turn with a small delay for realism
    setTimeout(() => {
      const engine = gameRef.current;
      const ai = aiRef.current;
      const state = engine.getGameState(1);

      // Handle pending pick 2
      if (engine.pendingPick2 > 0) {
        const drawn = engine.drawCards(1, engine.pendingPick2);
        addLog(`Computer drew ${drawn.length} card(s)`);
        updateGameState();
        setIsAIThinking(false);

        if (engine.currentTurn === 0) return;

        setTimeout(() => handleAITurn(), 500);
        return;
      }

      const validMoves = engine.getValidMoves(1);
      const shouldDraw = ai.shouldDraw(validMoves, { ...state, myHand: engine.players[1].hand });

      if (shouldDraw || validMoves.length === 0) {
        const drawn = engine.drawCards(1, 1);
        addLog(`Computer drew ${drawn.length} card(s)`);
        updateGameState();
        setIsAIThinking(false);

        if (engine.currentTurn === 0) return;
        setTimeout(() => handleAITurn(), 500);
        return;
      }

      const chosenCard = ai.chooseCard(validMoves, { ...state, myHand: engine.players[1].hand });

      if (chosenCard && (chosenCard.specialType === 'market' || chosenCard.specialType === 'whot')) {
        const chosenSymbol = ai.chooseSymbol({ ...state, myHand: engine.players[1].hand });
        const result = engine.playCard(chosenCard, 1, chosenSymbol);
        if (result.success) {
          addLog(`Computer played ${chosenCard.name} > ${chosenSymbol}`);
          updateGameState();
          if (result.gameOver) {
            addLog('Computer wins!');
            setIsAIThinking(false);
            return;
          }
        }
      } else if (chosenCard) {
        const result = engine.playCard(chosenCard, 1);
        if (result.success) {
          addLog(`Computer played ${chosenCard.name}`);
          updateGameState();
          if (result.gameOver) {
            addLog('Computer wins!');
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
    setSelectedCard(null);
    setGameLog([]);
    setShowSymbolPicker(false);
    setPendingCard(null);
    setIsAIThinking(false);
    gameRef.current = null;
    aiRef.current = null;
  };

  // Render start screen
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

  // Render game over screen
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

  // Symbol picker modal
  if (showSymbolPicker) {
    return (
      <div className="symbol-picker-overlay">
        <div className="symbol-picker-modal">
          <h2>Choose a Symbol</h2>
          <p>Select the symbol for your {pendingCard?.name} card</p>
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
      {/* Game Header */}
      <div className="game-header">
        <button className="game-back-btn" onClick={() => navigate('/')}>
          <FaArrowLeft />
        </button>
        <div className="game-info-bar">
          <div className="game-status">
            {gameState?.currentTurn === 0 ? 'Your Turn' : "Opponent's Turn"}
            {isAIThinking && <span className="thinking-dots"> thinking<span>.</span><span>.</span><span>.</span></span>}
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
        {/* Opponent Area */}
        <OpponentArea
          players={gameState?.players || []}
          currentPlayerId={0}
          currentTurn={gameState?.currentTurn}
        />

        {/* Game Board */}
        <div className="game-board">
          <div className="board-center">
            {/* Draw pile */}
            <div className="draw-pile" onClick={handleDrawCard}>
              <div className="draw-pile-stack">
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
              </div>
              <span className="draw-label">
                {gameState?.pendingPick2 > 0
                  ? `Draw ${gameState.pendingPick2}`
                  : 'Draw'}
              </span>
              <span className="draw-count">{gameState?.deckSize || 0} left</span>
            </div>

            {/* Played card */}
            <div className="played-card-area">
              {gameState?.topCard ? (
                <Card card={gameState.topCard} disabled small={false} />
              ) : (
                <div className="empty-play-area">
                  <span>Play Area</span>
                </div>
              )}
            </div>

            {/* Last action */}
            <div className="last-action">{gameState?.lastAction}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="game-actions">
          {selectedCard && gameState?.currentTurn === 0 && (
            <button className="play-card-btn" onClick={handlePlayCard}>
              <FaStepForward /> Play Card
            </button>
          )}
          {gameState?.currentTurn === 0 && gameState?.pendingPick2 === 0 && !selectedCard && (
            <button className="draw-card-btn" onClick={handleDrawCard}>
              Draw Card
            </button>
          )}
        </div>

        {/* Player Hand */}
        <div className="player-area">
          <div className="player-label">
            Your Hand ({gameState?.myHand?.length || 0} cards)
          </div>
          <PlayerHand
            cards={gameState?.myHand || []}
            onCardClick={handleCardClick}
            selectedCard={selectedCard}
            disabled={gameState?.currentTurn !== 0 || isAIThinking}
            validMoves={gameRef.current?.getValidMoves(0) || []}
          />
        </div>
      </div>

      {/* Game Log */}
      <div className="game-log">
        <div className="game-log-header">Game Log</div>
        <div className="game-log-entries">
          {gameLog.map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">{entry.time}</span>
              <span className="log-text">{entry.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
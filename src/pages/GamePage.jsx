import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GameEngine from '../game/GameEngine';
import AIEngine from '../game/AIEngine';
import PlayerHand from '../components/game/PlayerHand';
import OpponentArea from '../components/game/OpponentArea';
import Card from '../components/game/Card';
import CardAnimationLayer from '../components/game/CardAnimationLayer';
import { onGameStateChange, setGameState, getGameState, getGameRoom, onRoomPlayersChange, removePlayerFromRoom, realtimeDB } from '../firebase/services/realtimeDBService.js';
import { ref, remove, onDisconnect } from 'firebase/database';
import { recordMatch } from '../firebase/services/firestoreService.js';
import ChatAside from '../components/ChatAside';
import { FaArrowLeft, FaRedo, FaRobot, FaSpinner, FaTrophy, FaMeh } from 'react-icons/fa';
import { useAuthContext } from '../context/AuthContext';
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
  const { user } = useAuthContext();
  const gameRef = useRef(null);
  const aiRef = useRef(null);
  const dbUnsubRef = useRef(null);
  const isHost = location.state?.isHost === true;
  const isOnline = !!roomId;
  const [myPlayerIndex, setMyPlayerIndex] = useState(
    isOnline ? (location.state?.playerIndex ?? (isHost ? 0 : 1)) : 0
  );
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
  const [oneCardWarning, setOneCardWarning] = useState(null);
  const wrongMoveTimeout = useRef(null);
  const prevCardCountsRef = useRef({});
  const drawPileRef = useRef(null);
  const playAreaRef = useRef(null);
  const playerAreaRef = useRef(null);
  const opponentAreaRef = useRef(null);
  const [flyingAnims, setFlyingAnims] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCup, setShowCup] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [leftNotification, setLeftNotification] = useState(null);
  const leftNotificationTimer = useRef(null);
  const initialPlayerCountRef = useRef(null);
  const roomPlayersUnsubRef = useRef(null);
  const nextAnimId = useRef(0);
  const matchSavedRef = useRef(false);

  const removeFlyingCard = useCallback((id) => {
    setFlyingAnims((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addFlyingCard = useCallback((animData) => {
    const id = nextAnimId.current++;
    setFlyingAnims((prev) => [...prev, { ...animData, id }]);
  }, []);

  useEffect(() => {
    if (!isOnline || !roomId || location.state?.playerIndex != null) return;
    const fetchIndex = async () => {
      try {
        const snapshot = await getGameRoom(roomId);
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          const roomPlayers = roomData.players || {};
          const entries = Object.entries(roomPlayers);
          const myId = user?.uid || 'guest';
          const idx = entries.findIndex(([id]) => id === myId);
          if (idx >= 0) setMyPlayerIndex(idx);
        }
      } catch (err) {
        console.error('Failed to fetch player index:', err);
      }
    };
    fetchIndex();
  }, [isOnline, roomId, isHost, user, location.state]);

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
      updateGameState();
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

  const handleCardClick = async (card, event) => {
    if (!gameRef.current || gameRef.current.gameStatus !== 'playing') return;
    if (gameRef.current.currentTurn !== myPlayerIndex) return;

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

    const cardRect = event?.currentTarget?.getBoundingClientRect();
    const playRect = playAreaRef.current?.getBoundingClientRect();

    const result = gameRef.current.playCard(card, myPlayerIndex);
    if (result.success) {
      await syncStateToDB();
      updateGameState();

      if (cardRect && playRect) {
        addFlyingCard({
          card,
          faceDown: false,
          small: true,
          startX: cardRect.left,
          startY: cardRect.top,
          endX: playRect.left + playRect.width / 2 - cardRect.width / 2,
          endY: playRect.top + playRect.height / 2 - cardRect.height / 2,
          width: cardRect.width,
          height: cardRect.height,
          type: 'play',
        });
      }

      if (result.gameOver) {
        return;
      }
      if (!isOnline && gameRef.current.currentTurn !== myPlayerIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleSymbolSelect = async (symbolId) => {
    if (!pendingCard) return;

    const playRect = playAreaRef.current?.getBoundingClientRect();
    const cardW = 90;
    const cardH = 130;

    const result = gameRef.current.playCard(pendingCard, myPlayerIndex, symbolId);
    setShowSymbolPicker(false);
    setPendingCard(null);

    if (result.success) {
      await syncStateToDB();
      updateGameState();

      if (playRect) {
        addFlyingCard({
          card: pendingCard,
          faceDown: false,
          small: false,
          startX: window.innerWidth / 2 - cardW / 2,
          startY: window.innerHeight / 2 - cardH / 2,
          endX: playRect.left + playRect.width / 2 - cardW / 2,
          endY: playRect.top + playRect.height / 2 - cardH / 2,
          width: cardW,
          height: cardH,
          type: 'play',
        });
      }

      if (result.gameOver) {
        return;
      }
      if (!isOnline && gameRef.current.currentTurn !== myPlayerIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const handleDrawCard = async () => {
    if (!gameRef.current || gameRef.current.currentTurn !== myPlayerIndex) return;

    const drawRect = drawPileRef.current?.getBoundingClientRect();
    const handRect = playerAreaRef.current?.getBoundingClientRect();
    const backW = 55;
    const backH = 78;

    if (drawRect && handRect) {
      addFlyingCard({
        card: null,
        faceDown: true,
        small: false,
        startX: drawRect.left + drawRect.width / 2 - backW / 2,
        startY: drawRect.top,
        endX: handRect.left + handRect.width / 2 - backW / 2,
        endY: handRect.top + handRect.height / 2 - backH / 2,
        width: backW,
        height: backH,
        type: 'draw',
      });
      await new Promise((r) => setTimeout(r, 500));
    }

    const result = gameRef.current.drawCard(myPlayerIndex);
    if (result.success) {
      await syncStateToDB();
      updateGameState();
      if (isOnline) return;
      if (gameRef.current.currentTurn === opponentIndex) {
        setTimeout(() => handleAITurn(), 600);
      }
    }
  };

  const animateAICard = (card, type) => {
    const oppRect = opponentAreaRef.current?.getBoundingClientRect();
    const drawRect = drawPileRef.current?.getBoundingClientRect();
    const playRect = playAreaRef.current?.getBoundingClientRect();

    if (type === 'play' && oppRect && playRect) {
      const w = 65;
      const h = 95;
      addFlyingCard({
        card,
        faceDown: false,
        small: true,
        startX: oppRect.left + oppRect.width / 2 - w / 2,
        startY: oppRect.top,
        endX: playRect.left + playRect.width / 2 - w / 2,
        endY: playRect.top + playRect.height / 2 - h / 2,
        width: w,
        height: h,
        type: 'play',
      });
    } else if (type === 'draw' && drawRect && oppRect) {
      const w = 55;
      const h = 78;
      addFlyingCard({
        card: null,
        faceDown: true,
        small: false,
        startX: drawRect.left + drawRect.width / 2 - w / 2,
        startY: drawRect.top,
        endX: oppRect.left + oppRect.width / 2 - w / 2,
        endY: oppRect.top + oppRect.height / 2 - h / 2,
        width: w,
        height: h,
        type: 'draw',
      });
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
        const validCards = engine.getValidCards(1);
        if (validCards.length > 0) {
          const chosenCard = validCards[0];
          const result = engine.playCard(chosenCard, 1);
          if (result.success) {
            animateAICard(chosenCard, 'play');
            updateGameState();
            setIsAIThinking(false);
            if (engine.gameStatus === 'playing' && engine.currentTurn === 1) {
              setTimeout(() => handleAITurn(), 500);
            }
            return;
          }
        }
        animateAICard(null, 'draw');
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
        animateAICard(null, 'draw');
        const result = engine.drawCard(1);
        if (result.success) {
          updateGameState();
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
          animateAICard(chosenCard, 'play');
          updateGameState();
          if (result.gameOver) {
            setIsAIThinking(false);
            return;
          }
        }
      } else if (chosenCard) {
        const result = engine.playCard(chosenCard, 1);
        if (result.success) {
          animateAICard(chosenCard, 'play');
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
    if (!gameState?.players) return;
    const current = {};
    for (const p of gameState.players) {
      current[p.id] = p.cardCount;
      if (p.id !== myPlayerIndex && p.cardCount === 1 && prevCardCountsRef.current[p.id] !== 1) {
        setOneCardWarning(`${p.name} has one card remaining!`);
      }
    }
    prevCardCountsRef.current = current;
  }, [gameState, myPlayerIndex]);

  const prevTopCardRef = useRef(null);
  useEffect(() => {
    if (!isOnline || !gameState?.topCard || !gameRef.current) return;
    const prevTop = prevTopCardRef.current;
    const newTop = gameState.topCard;
    if (prevTop && newTop && prevTop.id !== newTop.id && gameState.currentTurn === myPlayerIndex) {
      const oppRect = opponentAreaRef.current?.getBoundingClientRect();
      const playRect = playAreaRef.current?.getBoundingClientRect();
      if (oppRect && playRect) {
        const w = 65;
        const h = 95;
        addFlyingCard({
          card: newTop,
          faceDown: false,
          small: true,
          startX: oppRect.left + oppRect.width / 2 - w / 2,
          startY: oppRect.top,
          endX: playRect.left + playRect.width / 2 - w / 2,
          endY: playRect.top + playRect.height / 2 - h / 2,
          width: w,
          height: h,
          type: 'play',
        });
      }
    }
    prevTopCardRef.current = newTop;
  }, [gameState?.topCard, gameState?.currentTurn, isOnline, myPlayerIndex, addFlyingCard]);

  const prevOppCardCountRef = useRef(null);
  useEffect(() => {
    if (!isOnline || !gameState?.players || !gameRef.current) return;
    const opp = gameState.players.find((p) => p.id !== myPlayerIndex);
    if (!opp) return;
    const prevCount = prevOppCardCountRef.current;
    if (prevCount !== null && opp.cardCount > prevCount && gameState.currentTurn === myPlayerIndex) {
      const drawRect = drawPileRef.current?.getBoundingClientRect();
      const oppRect = opponentAreaRef.current?.getBoundingClientRect();
      if (drawRect && oppRect) {
        const w = 55;
        const h = 78;
        addFlyingCard({
          card: null,
          faceDown: true,
          small: false,
          startX: drawRect.left + drawRect.width / 2 - w / 2,
          startY: drawRect.top,
          endX: oppRect.left + oppRect.width / 2 - w / 2,
          endY: oppRect.top + oppRect.height / 2 - h / 2,
          width: w,
          height: h,
          type: 'draw',
        });
      }
    }
    prevOppCardCountRef.current = opp.cardCount;
  }, [gameState?.players, gameState?.currentTurn, isOnline, myPlayerIndex, addFlyingCard]);

  useEffect(() => {
    if (oneCardWarning) {
      const t = setTimeout(() => setOneCardWarning(null), 4000);
      return () => clearTimeout(t);
    }
  }, [oneCardWarning]);

  useEffect(() => {
    return () => {
      if (wrongMoveTimeout.current) clearTimeout(wrongMoveTimeout.current);
      if (leftNotificationTimer.current) clearTimeout(leftNotificationTimer.current);
    };
  }, []);

  useEffect(() => {
    if (gameState?.gameStatus !== 'finished' || !gameRef.current || matchSavedRef.current) return;
    matchSavedRef.current = true;

    const myId = user?.uid || 'local-player';
    const isWinner = gameState.winner === myPlayerIndex;

    const players = isOnline
      ? [myId, 'opponent']
      : [myId];

    const winnerId = isWinner ? myId : (isOnline ? 'opponent' : null);

    recordMatch({
      players,
      winner: winnerId,
      gameMode: isOnline ? 'online' : 'ai',
      duration: 0,
      scores: {}
    }).catch(() => {});
  }, [gameState?.gameStatus, isOnline, myPlayerIndex, user]);

  useEffect(() => {
    if (!isOnline || !roomId) return;

    setShowStartScreen(false);
    setWaitingForGame(true);

    dbUnsubRef.current = onGameStateChange(roomId, async (snapshot) => {
      try {
        if (snapshot.exists()) {
          const dbState = snapshot.val();
          const cleanState = { ...dbState };
          delete cleanState.lastUpdated;
          setWrongMoveMessage(null);
          if (gameRef.current) {
            gameRef.current.importState(cleanState);

            const engine = gameRef.current;
            if (engine.gameStatus === 'playing') {
              const emptyIdx = engine.players.findIndex(p => p.hand.length === 0);
              if (emptyIdx !== -1) {
                engine.gameStatus = 'finished';
                engine.winner = emptyIdx;
                engine.lastAction = `${engine.players[emptyIdx].name} wins!`;
                syncStateToDB();
              }
            }

            updateGameState();
          } else {
            const engine = new GameEngine();
            engine.importState(cleanState);

            if (engine.gameStatus === 'playing') {
              const emptyIdx = engine.players.findIndex(p => p.hand.length === 0);
              if (emptyIdx !== -1) {
                engine.gameStatus = 'finished';
                engine.winner = emptyIdx;
                engine.lastAction = `${engine.players[emptyIdx].name} wins!`;
              }
            }

            gameRef.current = engine;
            setWaitingForGame(false);
            setShowStartScreen(false);
            updateGameState();
          }
        } else if (isHost) {
          const engine = new GameEngine();
          gameRef.current = engine;

          let names = ['Player 1', 'Player 2'];
          try {
            const roomSnapshot = await getGameRoom(roomId);
            if (roomSnapshot.exists()) {
              const roomData = roomSnapshot.val();
              const roomPlayers = roomData.players || {};
              const entries = Object.entries(roomPlayers);
              if (entries.length >= 2) {
                names = entries.map(([, p]) => p.displayName || 'Player');
              }
            }
          } catch (err) {
            console.error('Failed to fetch room players:', err);
          }

          engine.initGame(names, 5);

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

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !roomId || showStartScreen) return;

    roomPlayersUnsubRef.current = onRoomPlayersChange(roomId, (snapshot) => {
      if (!snapshot.exists()) return;
      const currentPlayers = snapshot.val();
      const entries = Object.entries(currentPlayers);
      const count = entries.length;
      const myId = user?.uid || 'guest';

      if (initialPlayerCountRef.current === null) {
        initialPlayerCountRef.current = count;
        return;
      }

      if (count < initialPlayerCountRef.current) {
        const leftEntry = entries.find(([id]) => id !== myId);
        const leftName = leftEntry?.[1]?.displayName || 'A player';

        if (initialPlayerCountRef.current === 2) {
          setOpponentLeft(true);
        } else {
          setLeftNotification(`${leftName} left the game`);
          if (leftNotificationTimer.current) clearTimeout(leftNotificationTimer.current);
          leftNotificationTimer.current = setTimeout(() => setLeftNotification(null), 7000);
        }
      }
      initialPlayerCountRef.current = count;
    });

    return () => {
      if (roomPlayersUnsubRef.current) {
        roomPlayersUnsubRef.current();
        roomPlayersUnsubRef.current = null;
      }
      if (leftNotificationTimer.current) clearTimeout(leftNotificationTimer.current);
    };
  }, [isOnline, roomId, showStartScreen, user]);

  useEffect(() => {
    if (!isOnline || !roomId) return;
    const myId = user?.uid || 'guest';
    const playerRef = ref(realtimeDB, `gameRooms/${roomId}/players/${myId}`);
    onDisconnect(playerRef).remove();
    const countRef = ref(realtimeDB, `gameRooms/${roomId}/currentPlayers`);
    onDisconnect(countRef).transaction((current) => Math.max(0, (current || 0) - 1));
    return () => {
      onDisconnect(playerRef).cancel();
      onDisconnect(countRef).cancel();
    };
  }, [isOnline, roomId, user]);

  const handleRestart = () => {
    if (dbUnsubRef.current) {
      dbUnsubRef.current();
      dbUnsubRef.current = null;
    }
    if (roomPlayersUnsubRef.current) {
      roomPlayersUnsubRef.current();
      roomPlayersUnsubRef.current = null;
    }
    if (leftNotificationTimer.current) clearTimeout(leftNotificationTimer.current);
    initialPlayerCountRef.current = null;
    matchSavedRef.current = false;
    setShowStartScreen(true);
    setShowSymbolPicker(false);
    setPendingCard(null);
    setIsAIThinking(false);
    setDealing(false);
    setWaitingForGame(false);
    setWrongMoveMessage(null);
    setShowCelebration(false);
    setShowCup(false);
    setIsOffline(false);
    setOpponentLeft(false);
    setLeftNotification(null);
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
          <button className="game-back-btn" onClick={() => navigate('/dashboard')}>
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
    const winnerName = gameState.players?.[gameState.winner]?.name || (isOnline ? 'Opponent' : 'Computer');
    const opponentNames = gameState.players
      ?.filter((_, i) => i !== myPlayerIndex)
      .map(p => p.name)
      .join(', ') || (isOnline ? 'Opponent' : 'Computer');

    if (isWinner && !showCelebration && !showCup) {
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        setShowCup(true);
      }, 2800);
    }

    if (showCelebration && isWinner) {
      return (
        <div className="game-page">
          <div className="celebration-screen">
            <div className="bubble-container">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="celebration-bubble"
                  style={{
                    '--delay': `${Math.random() * 0.8}s`,
                    '--x': `${Math.random() * 100}%`,
                    '--size': `${Math.random() * 30 + 15}px`,
                    '--drift': `${(Math.random() - 0.5) * 200}px`,
                    '--hue': `${Math.random() * 60 + 340}`,
                  }}
                />
              ))}
            </div>
            <div className="celebration-text">
              <FaTrophy className="celebration-trophy-icon" />
              <span>You Win!</span>
            </div>
          </div>
        </div>
      );
    }

    if (showCup && isWinner) {
      return (
        <div className="game-page">
          <div className="game-over-screen cup-screen">
            <div className="winner-cup-container">
              <div className="cup-glow" />
              <div className="cup-particles">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="cup-particle" style={{ '--angle': `${i * 30}deg`, '--delay': `${i * 0.1}s` }} />
                ))}
              </div>
              <div className="winner-cup">
                <div className="cup-body">
                  <div className="cup-rim" />
                  <div className="cup-bowl">
                    <div className="cup-shine" />
                  </div>
                  <div className="cup-stem" />
                  <div className="cup-base" />
                </div>
                <div className="cup-ring cup-ring-1" />
                <div className="cup-ring cup-ring-2" />
                <div className="cup-ring cup-ring-3" />
              </div>
              <div className="winner-crown">
                <span>👑</span>
              </div>
            </div>
            <h1 className="game-over-title victory-title">Victory!</h1>
            <p className="game-over-subtitle">
              {gameState.players.length > 2
                ? 'Congratulations! You won the game!'
                : `Congratulations! You defeated ${opponentNames}!`}
            </p>
            <div className="game-over-actions">
              {!isOnline && (
                <button className="game-over-btn primary" onClick={handleRestart}>
                  <FaRedo /> Play Again
                </button>
              )}
              <button className="game-over-btn secondary" onClick={() => navigate('/dashboard')}>
                <FaArrowLeft /> Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="game-page">
        <div className="game-over-screen">
          <div className="game-over-content">
            <div className="game-over-icon loss-icon"><FaMeh /></div>
            <h1 className="game-over-title">You Lost!</h1>
            <p className="game-over-subtitle">{winnerName} won. Try again next time.</p>
            <div className="game-over-actions">
              {!isOnline && (
                <button className="game-over-btn primary" onClick={handleRestart}>
                  <FaRedo /> Play Again
                </button>
              )}
              <button className="game-over-btn secondary" onClick={() => navigate('/dashboard')}>
                <FaArrowLeft /> Back to Dashboard
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
          <button className="game-back-btn" onClick={() => navigate(isOnline ? '/lobby' : '/dashboard')}>
            <FaArrowLeft />
          </button>
          <div className="game-info-bar">
            <div className="game-status">
              {gameState?.currentTurn === myPlayerIndex
                ? 'Your Turn'
                : `${gameState?.players?.[gameState?.currentTurn]?.name || 'Opponent'}'s Turn`}
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

      {isOnline && <ChatAside roomId={roomId} />}

      {oneCardWarning && (
        <div className="one-card-warning">{oneCardWarning}</div>
      )}

      {leftNotification && (
        <div className="player-left-notification">{leftNotification}</div>
      )}

      {isOffline && isOnline && (
        <div className="connection-overlay">
          <div className="connection-popup">
            <div className="connection-popup-icon offline-icon">
              <span>📡</span>
            </div>
            <h2>Connection Lost</h2>
            <p>Trying to reconnect...</p>
            <button className="connection-leave-btn" onClick={() => navigate('/dashboard')}>
              Leave Game
            </button>
          </div>
        </div>
      )}

      {opponentLeft && isOnline && (
        <div className="connection-overlay">
          <div className="connection-popup">
            <div className="connection-popup-icon opponent-left-icon">
              <span>👋</span>
            </div>
            <h2>Opponent Left</h2>
            <p>Your opponent has disconnected.</p>
            <button className="connection-leave-btn" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="game-layout">
        <div ref={opponentAreaRef}>
          <OpponentArea
            players={gameState?.players || []}
            currentPlayerId={myPlayerIndex}
          />
        </div>

        <div className="game-board">
          <div className="board-center">
            <div ref={drawPileRef} className="draw-pile" onClick={handleDrawCard}>
              <div className="draw-pile-stack">
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
                <div className="draw-pile-card back"></div>
              </div>
              <span className="draw-label">Draw</span>
              <span className="draw-count">{gameState?.deckSize || 0} left</span>
            </div>

            <div ref={playAreaRef} className="played-card-area">
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

        <div ref={playerAreaRef} className="player-area">
          <div className="player-label">
            Your Hand ({gameState?.myHand?.length || 0} cards)
          </div>
          {wrongMoveMessage && (
            <div className="wrong-move-message">{wrongMoveMessage}</div>
          )}
          <PlayerHand
            cards={gameState?.myHand || []}
            onCardClick={handleCardClick}
            disabled={gameState?.currentTurn !== myPlayerIndex || isAIThinking}
          />
        </div>
      </div>

      <CardAnimationLayer animations={flyingAnims} onRemove={removeFlyingCard} />
    </div>
  );
};

export default GamePage;

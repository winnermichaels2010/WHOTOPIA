import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database';
import { useAuthContext } from '../context/AuthContext';
import {
  FaArrowLeft, FaGamepad, FaCopy, FaCheck, FaSpinner, FaUsers, FaUser,
  FaPlay, FaCog, FaChevronDown, FaShieldAlt, FaLayerGroup, FaMagic,
} from 'react-icons/fa';
import {
  getGameRoom,
  updateGameRoom,
  onGameRoomChange,
  onRoomPlayersChange,
  removePlayerFromRoom,
  realtimeDB,
} from '../firebase/services/realtimeDBService.js';
import { addPlayerToRoom } from '../firebase/services/realtimeDBService.js';
import './LobbyPage.css';

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const DEFAULT_RULES = {
  startingCards: 5,
  stackingPenalties: true,
  allowMultiPlay: false,
  enablePick2: true,
  enablePick3: true,
  enableSuspension: true,
  enableHoldOn: true,
  enableGeneralMarket: true,
  allowDefendPick2: true,
  allowDefendPick3: true,
};

const generateRoomCode = () => {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
};

const LobbyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [joining, setJoining] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState({});
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [gameRules, setGameRules] = useState({ ...DEFAULT_RULES });
  const roomListenerRef = useRef(null);
  const playersListenerRef = useRef(null);
  const playersRef = useRef({});

  const cleanupListeners = useCallback(() => {
    if (roomListenerRef.current) {
      roomListenerRef.current();
      roomListenerRef.current = null;
    }
    if (playersListenerRef.current) {
      playersListenerRef.current();
      playersListenerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const startRoomListeners = useCallback((roomId) => {
    cleanupListeners();

    roomListenerRef.current = onGameRoomChange(roomId, (snapshot) => {
      if (snapshot.exists()) {
        const data = { id: snapshot.key, ...snapshot.val() };
        setCurrentRoom(data);
        if (data.status === 'playing') {
          const currentPlayers = playersRef.current;
          const entries = Object.entries(currentPlayers);
          const myIndex = entries.findIndex(([id]) => id === (user?.uid || 'guest'));
          navigate(`/play/online/${roomId}`, {
            state: {
              isHost: user?.uid === data.hostId,
              playerIndex: myIndex >= 0 ? myIndex : 0,
            }
          });
        }
      } else {
        setCurrentRoom(null);
      }
    });

    playersListenerRef.current = onRoomPlayersChange(roomId, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(snapshot.val());
      } else {
        setPlayers({});
      }
    });
  }, [cleanupListeners, navigate, user]);

  const handleCreateRoom = async () => {
    setCreating(true);
    setCreateError('');
    try {
      let roomCode = generateRoomCode();
      let attempts = 0;
      let existing = await getGameRoom(roomCode);
      while (existing.exists() && attempts < 10) {
        roomCode = generateRoomCode();
        existing = await getGameRoom(roomCode);
        attempts++;
      }

      if (existing.exists()) {
        setCreateError('Could not generate a unique room code. Please try again.');
        setCreating(false);
        return;
      }

      const roomRef = ref(realtimeDB, `gameRooms/${roomCode}`);
      await set(roomRef, {
        roomId: roomCode,
        name: `${user?.displayName || 'Player'}'s Game`,
        hostId: user?.uid || 'guest',
        maxPlayers: 6,
        gameMode: 'online',
        status: 'waiting',
        createdAt: Date.now(),
      });

      await addPlayerToRoom(roomCode, user?.uid || 'guest', {
        displayName: user?.displayName || 'Player',
        photoURL: user?.photoURL || null,
        status: 'ready',
        isHost: true,
      });

      startRoomListeners(roomCode);
      setShowRulesPopup(true);
    } catch (err) {
      console.error('Failed to create room:', err);
      setCreateError('Failed to create room. Check your connection and try again.');
    }
    setCreating(false);
  };

  const handleJoinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setJoinError('Please enter a valid room code');
      return;
    }

    setJoining(true);
    setJoinError('');

    try {
      const snapshot = await getGameRoom(code);
      if (!snapshot.exists()) {
        setJoinError('Room not found. Check the code and try again.');
        setJoining(false);
        return;
      }

      const room = snapshot.val();
      if (room.status !== 'waiting') {
        setJoinError('This game has already started.');
        setJoining(false);
        return;
      }

      if (room.currentPlayers >= room.maxPlayers) {
        setJoinError('Room is full.');
        setJoining(false);
        return;
      }

      await addPlayerToRoom(code, user?.uid || 'guest', {
        displayName: user?.displayName || 'Player',
        photoURL: user?.photoURL || null,
        status: 'ready',
        isHost: false,
      });

      startRoomListeners(code);
    } catch (err) {
      setJoinError('Failed to join room. Try again.');
      console.error('Join room error:', err);
    }
    setJoining(false);
  };

  const handleStartGame = async () => {
    if (!currentRoom) return;
    setStarting(true);
    try {
      const entries = Object.entries(playerList);
      const myIndex = entries.findIndex(([id]) => id === (user?.uid || 'guest'));
      await updateGameRoom(currentRoom.id, { status: 'playing', rules: gameRules });
      navigate(`/play/online/${currentRoom.id}`, {
        state: {
          isHost: true,
          rules: gameRules,
          playerIndex: myIndex >= 0 ? myIndex : 0,
        }
      });
    } catch (err) {
      console.error('Failed to start game:', err);
    }
    setStarting(false);
  };

  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    try {
      await removePlayerFromRoom(currentRoom.id, user?.uid || 'guest');
      const snapshot = await getGameRoom(currentRoom.id);
      if (snapshot.exists()) {
        const room = snapshot.val();
        if (!room.players || Object.keys(room.players).length === 0) {
          await updateGameRoom(currentRoom.id, { status: 'finished' });
        }
      }
    } catch (err) {
      console.error('Failed to leave room:', err);
    }
    cleanupListeners();
    setCurrentRoom(null);
    setPlayers({});
  };

  const handleCopyCode = () => {
    if (currentRoom?.id) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyDefaultRules = () => {
    setGameRules({ ...DEFAULT_RULES });
  };

  const handleSaveRulesAndClose = async () => {
    if (currentRoom) {
      try {
        await updateGameRoom(currentRoom.id, { rules: gameRules });
      } catch (err) {
        console.error('Failed to save rules:', err);
      }
    }
    setShowRulesPopup(false);
  };

  const isHost = currentRoom && (user?.uid === currentRoom.hostId);
  const playerList = Object.entries(players || {});

  if (currentRoom) {
    return (
      <div className="lobby-page">
        <div className="lobby-container">
          <button className="lobby-back-btn" onClick={handleLeaveRoom}>
            <FaArrowLeft /> Leave
          </button>

          <div className="lobby-room-view">
            <div className="room-code-section">
              <FaGamepad className="room-code-icon" />
              <h2>Room Code</h2>
              <div className="room-code-display">
                <span className="room-code">{currentRoom.id}</span>
                <button className="copy-btn" onClick={handleCopyCode}>
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
              <p className="room-code-hint">Share this code with friends to play</p>
            </div>

            <div className="room-players-section">
              <h3><FaUsers /> Players ({playerList.length}/{currentRoom.maxPlayers || 6})</h3>
              <div className="room-players-list">
                {playerList.map(([id, player]) => (
                  <div key={id} className={`room-player ${player.isHost ? 'host' : ''}`}>
                    <div className="player-avatar">
                      {player.photoURL ? (
                        <img src={player.photoURL} alt="" />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className="player-info">
                      <span className="player-name">
                        {player.displayName}
                        {player.isHost && <span className="host-badge">Host</span>}
                      </span>
                      <span className="player-status">{player.isHost ? 'Ready' : 'Joined'}</span>
                    </div>
                  </div>
                ))}
                {playerList.length < (currentRoom.maxPlayers || 6) && (
                  <div className="room-player waiting">
                    <div className="player-avatar waiting-avatar">
                      <FaSpinner className="spinner-icon" />
                    </div>
                    <div className="player-info">
                      <span className="player-name waiting-text">Waiting for players...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isHost && (
              <div className="room-rules-section">
                <button
                  className="room-rules-toggle"
                  onClick={() => setShowRules(!showRules)}
                >
                  <FaCog />
                  <span>Game Rules {showRules ? '(optional)' : ''}</span>
                  <FaChevronDown className={`rules-arrow ${showRules ? 'expanded' : ''}`} />
                </button>

                {showRules && (
                  <div className="room-rules-content">
                    <div className="rule-item">
                      <label>Starting Cards</label>
                      <select
                        value={gameRules.startingCards}
                        onChange={(e) => setGameRules(prev => ({ ...prev, startingCards: Number(e.target.value) }))}
                      >
                        <option value={3}>3 cards</option>
                        <option value={5}>5 cards</option>
                        <option value={7}>7 cards</option>
                      </select>
                    </div>
                    <div className="rule-item">
                      <label>Stack Penalties</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={gameRules.stackingPenalties}
                          onChange={(e) => setGameRules(prev => ({ ...prev, stackingPenalties: e.target.checked }))}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="rule-item">
                      <label>Allow Multi-Play</label>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={gameRules.allowMultiPlay}
                          onChange={(e) => setGameRules(prev => ({ ...prev, allowMultiPlay: e.target.checked }))}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isHost && playerList.length >= 2 && (
              <button
                className="start-game-btn"
                onClick={handleStartGame}
                disabled={starting}
              >
                <FaPlay /> {starting ? 'Starting...' : 'Start Game'}
              </button>
            )}

            {!isHost && playerList.length >= 2 && (
              <p className="waiting-for-host">Waiting for host to start the game...</p>
            )}
          </div>
        </div>

        {/* Room Rules Popup */}
        {showRulesPopup && (
          <div className="rules-popup-overlay" onClick={() => setShowRulesPopup(false)}>
            <div className="rules-popup" onClick={e => e.stopPropagation()}>
              <div className="rules-popup-header">
                <div className="rules-popup-icon">
                  <FaCog />
                </div>
                <h2>Set Game Rules</h2>
                <p>Configure the rules for this match. Players will see these rules before joining.</p>
              </div>

              <div className="rules-popup-body">
                <div className="rules-popup-section">
                  <h4><FaLayerGroup /> Card Effects</h4>
                  <p className="rules-section-desc">Enable or disable special card effects</p>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Pick 2</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.enablePick2}
                        onChange={(e) => setGameRules(prev => ({ ...prev, enablePick2: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Pick 3</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.enablePick3}
                        onChange={(e) => setGameRules(prev => ({ ...prev, enablePick3: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Suspension</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.enableSuspension}
                        onChange={(e) => setGameRules(prev => ({ ...prev, enableSuspension: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Hold On</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.enableHoldOn}
                        onChange={(e) => setGameRules(prev => ({ ...prev, enableHoldOn: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">General Market</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.enableGeneralMarket}
                        onChange={(e) => setGameRules(prev => ({ ...prev, enableGeneralMarket: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="rules-popup-section">
                  <h4><FaShieldAlt /> Defense Rules</h4>
                  <p className="rules-section-desc">Allow players to counter penalty cards</p>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Defend Pick 2</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.allowDefendPick2}
                        onChange={(e) => setGameRules(prev => ({ ...prev, allowDefendPick2: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Defend Pick 3</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.allowDefendPick3}
                        onChange={(e) => setGameRules(prev => ({ ...prev, allowDefendPick3: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Stack Penalties</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={gameRules.stackingPenalties}
                        onChange={(e) => setGameRules(prev => ({ ...prev, stackingPenalties: e.target.checked }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="rules-popup-section">
                  <h4><FaGamepad /> Game Setup</h4>

                  <div className="rules-popup-item">
                    <span className="rules-popup-label">Starting Cards</span>
                    <select
                      value={gameRules.startingCards}
                      onChange={(e) => setGameRules(prev => ({ ...prev, startingCards: Number(e.target.value) }))}
                    >
                      <option value={3}>3 cards</option>
                      <option value={5}>5 cards</option>
                      <option value={7}>7 cards</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rules-popup-footer">
                <button className="rules-popup-btn default" onClick={handleApplyDefaultRules}>
                  <FaMagic /> Use Default Settings
                </button>
                <button className="rules-popup-btn save" onClick={handleSaveRulesAndClose}>
                  <FaCheck /> Save & Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="lobby-page">
      <div className="lobby-container">
        <button className="lobby-back-btn" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> Back
        </button>

        <div className="lobby-header">
          <FaGamepad className="lobby-header-icon" />
          <h1>Multiplayer</h1>
          <p>Create a room or join an existing game</p>
        </div>

        <div className="lobby-tabs">
          <button
            className={`lobby-tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setCreateError(''); }}
          >
            Create Room
          </button>
          <button
            className={`lobby-tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => setTab('join')}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <div className="lobby-tab-content">
            <p className="tab-description">
              Create a new room and share the code with a friend to play.
            </p>
            <button
              className="create-room-btn"
              onClick={handleCreateRoom}
              disabled={creating}
            >
              {creating ? <FaSpinner className="spinner-icon" /> : <FaGamepad />}
              {creating ? 'Creating...' : 'Create Room'}
            </button>
            {createError && <p className="join-error">{createError}</p>}
          </div>
        ) : (
          <div className="lobby-tab-content">
            <p className="tab-description">
              Enter the 4-character room code from your friend.
            </p>
            <div className="join-input-group">
              <label className="join-input-label" htmlFor="room-code-input">Room Code</label>
              <input
                id="room-code-input"
                type="text"
                className="join-input"
                placeholder="e.g. ABCD"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase().slice(0, 4));
                  setJoinError('');
                }}
                maxLength={4}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
              />
              <button
                className="join-btn"
                onClick={handleJoinRoom}
                disabled={joining || joinCode.length < 4}
              >
                {joining ? <FaSpinner className="spinner-icon" /> : 'Join Room'}
              </button>
            </div>
            {joinError && <p className="join-error">{joinError}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;

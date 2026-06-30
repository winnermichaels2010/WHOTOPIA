/**
 * useRealtimeDB Hook
 * 
 * React hook for Realtime Database operations.
 * Provides methods for game rooms, active games, chat, and player presence.
 * 
 * USAGE:
 * const { createRoom, joinRoom, leaveRoom, sendMessage, setPresence } = useRealtimeDB();
 * 
 * ARCHITECTURE NOTES:
 * - Wraps Realtime Database service functions in React hooks
 * - Provides real-time subscriptions for live game state
 * - Manages connection lifecycle (connect/disconnect handlers)
 * - Optimized for low-latency multiplayer game updates
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createGameRoom,
  getGameRoom,
  updateGameRoom,
  deleteGameRoom,
  onGameRoomChange,
  getAvailableRooms,
  onAvailableRoomsChange,
  addPlayerToRoom,
  removePlayerFromRoom,
  onRoomPlayersChange,
  setGameState,
  getGameState,
  updateGameState,
  onGameStateChange,
  deleteActiveGame,
  sendChatMessage,
  onChatMessages,
  onNewChatMessage,
  clearChat,
  setUserPresence,
  getUserPresence,
  onUserPresenceChange,
  setUserOffline,
  getOnlineUsers
} from '../services/realtimeDBService.js';

/**
 * Custom hook for Game Room operations
 * @param {string} roomId - Room ID to monitor (optional)
 * @returns {Object} Room data and methods
 */
export const useGameRoom = (roomId = null) => {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onGameRoomChange(roomId, (snapshot) => {
      if (snapshot.exists()) {
        setRoom({ id: snapshot.key, ...snapshot.val() });
      } else {
        setRoom(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const createRoom = useCallback(async (roomData) => {
    try {
      setError(null);
      const newRoomId = await createGameRoom(roomData);
      return { success: true, roomId: newRoomId };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  const updateRoom = useCallback(async (updates) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await updateGameRoom(roomId, updates);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  const removeRoom = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await deleteGameRoom(roomId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  return {
    room,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom: removeRoom
  };
};

/**
 * Custom hook for Available Rooms list
 * @returns {Object} Available rooms and methods
 */
export const useAvailableRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAvailableRoomsChange((snapshot) => {
      if (snapshot.exists()) {
        const roomsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setRooms(roomsData);
      } else {
        setRooms([]);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const snapshot = await getAvailableRooms();
      if (snapshot.exists()) {
        const roomsData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setRooms(roomsData);
      } else {
        setRooms([]);
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    rooms,
    loading,
    error,
    fetchRooms
  };
};

/**
 * Custom hook for Room Players
 * @param {string} roomId - Room ID to monitor players for
 * @returns {Object} Players data and methods
 */
export const useRoomPlayers = (roomId) => {
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onRoomPlayersChange(roomId, (snapshot) => {
      if (snapshot.exists()) {
        setPlayers(snapshot.val());
      } else {
        setPlayers({});
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const addPlayer = useCallback(async (playerId, playerData) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await addPlayerToRoom(roomId, playerId, playerData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  const removePlayer = useCallback(async (playerId) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await removePlayerFromRoom(roomId, playerId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  return {
    players,
    loading,
    error,
    addPlayer,
    removePlayer
  };
};

/**
 * Custom hook for Active Game State
 * @param {string} roomId - Room ID to monitor game state for
 * @returns {Object} Game state and methods
 */
export const useGameState = (roomId) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onGameStateChange(roomId, (snapshot) => {
      if (snapshot.exists()) {
        setGameState(snapshot.val());
      } else {
        setGameState(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const setGame = useCallback(async (state) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await setGameState(roomId, state);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  const updateGame = useCallback(async (updates) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await updateGameState(roomId, updates);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  const endGame = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await deleteActiveGame(roomId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  return {
    gameState,
    loading,
    error,
    setGame,
    updateGame,
    endGame
  };
};

/**
 * Custom hook for Chat Messages
 * @param {string} roomId - Room ID to monitor chat for
 * @returns {Object} Chat messages and methods
 */
export const useChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onChatMessages(roomId, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = Object.entries(snapshot.val()).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setMessages(messagesData);
      } else {
        setMessages([]);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = useCallback(async (messageData) => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await sendChatMessage(roomId, messageData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  const clearMessages = useCallback(async () => {
    if (!roomId) return { success: false, error: 'No room ID' };
    
    try {
      setError(null);
      await clearChat(roomId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [roomId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  };
};

/**
 * Custom hook for Player Presence
 * @param {string} userId - User ID to monitor presence for
 * @returns {Object} Presence data and methods
 */
export const usePresence = (userId) => {
  const [presence, setPresence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onUserPresenceChange(userId, (snapshot) => {
      if (snapshot.exists()) {
        setPresence(snapshot.val());
      } else {
        setPresence(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const setOnline = useCallback(async (presenceData) => {
    if (!userId) return { success: false, error: 'No user ID' };
    
    try {
      setError(null);
      await setUserPresence(userId, presenceData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [userId]);

  const setOffline = useCallback(async () => {
    if (!userId) return { success: false, error: 'No user ID' };
    
    try {
      setError(null);
      await setUserOffline(userId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [userId]);

  return {
    presence,
    loading,
    error,
    setOnline,
    setOffline
  };
};

/**
 * Combined hook for all Realtime Database operations
 * @returns {Object} All Realtime Database methods and hooks
 */
export const useRealtimeDB = () => {
  return {
    // Room hooks
    useGameRoom,
    useAvailableRooms,
    useRoomPlayers,
    
    // Game state hooks
    useGameState,
    
    // Chat hooks
    useChat,
    
    // Presence hooks
    usePresence,
    
    // Direct service methods (for advanced usage)
    createGameRoom,
    getGameRoom,
    updateGameRoom,
    deleteGameRoom,
    getAvailableRooms,
    addPlayerToRoom,
    removePlayerFromRoom,
    setGameState,
    getGameState,
    updateGameState,
    deleteActiveGame,
    sendChatMessage,
    clearChat,
    setUserPresence,
    getUserPresence,
    setUserOffline,
    getOnlineUsers
  };
};

export default useRealtimeDB;

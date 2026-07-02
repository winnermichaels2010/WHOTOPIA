/**
 * Realtime Database Service
 * 
 * This service handles all Realtime Database operations for Whotopia.
 * Realtime Database is used for real-time synchronization and low-latency updates.
 * 
 * DATA STRUCTURE:
 * 
 * Paths:
 * 1. /gameRooms/{roomId} - Active game rooms
 *    - { roomId, name, hostId, maxPlayers, currentPlayers, status, gameMode, createdAt }
 * 
 * 2. /gameRooms/{roomId}/players/{playerId} - Players in a room
 *    - { displayName, photoURL, status, joinedAt, isHost }
 * 
 * 3. /activeGames/{roomId} - Live game state
 *    - { currentTurn, deck, players, lastPlayedCard, gameStatus, timestamp }
 * 
 * 4. /chat/{roomId} - Chat messages
 *    - /{messageId}: { senderId, senderName, message, timestamp }
 * 
 * 5. /presence/{userId} - Online status
 *    - { online, lastSeen, currentRoom }
 * 
 * ARCHITECTURE NOTES:
 * - Realtime Database provides true real-time sync with minimal latency
 * - Ideal for game state that updates frequently
 * - Better for presence systems than Firestore
 * - Use .on() for real-time listeners, .once() for single reads
 * - Structure data for efficient reads (avoid deep nesting)
 */

import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onChildAdded,
  push,
  serverTimestamp,
  onDisconnect,
  off
} from 'firebase/database';
import { realtimeDB } from '../index.js';

// ============ GAME ROOMS ============

const GAME_ROOMS_PATH = 'gameRooms';

/**
 * Create a new game room
 * @param {Object} roomData - Room configuration
 * @returns {Promise<string>} Room ID
 */
export const createGameRoom = async (roomData) => {
  const newRoomRef = push(ref(realtimeDB, GAME_ROOMS_PATH));
  const roomId = newRoomRef.key;
  
  await set(newRoomRef, {
    ...roomData,
    roomId,
    status: 'waiting',
    currentPlayers: 0,
    createdAt: serverTimestamp()
  });
  
  return roomId;
};

/**
 * Get a game room by ID
 * @param {string} roomId - Room ID
 * @returns {Promise<DataSnapshot>} Room data snapshot
 */
export const getGameRoom = async (roomId) => {
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);
  return snapshot;
};

/**
 * Update a game room
 * @param {string} roomId - Room ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateGameRoom = async (roomId, updates) => {
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}`);
  await update(roomRef, updates);
};

/**
 * Delete a game room
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export const deleteGameRoom = async (roomId) => {
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}`);
  await remove(roomRef);
};

/**
 * Listen to real-time updates of a game room
 * @param {string} roomId - Room ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onGameRoomChange = (roomId, callback) => {
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}`);
  return onValue(roomRef, callback);
};

/**
 * Get all available game rooms
 * @returns {Promise<DataSnapshot>} All rooms snapshot
 */
export const getAvailableRooms = async () => {
  const roomsRef = ref(realtimeDB, GAME_ROOMS_PATH);
  const snapshot = await get(roomsRef);
  return snapshot;
};

/**
 * Listen to available rooms updates
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onAvailableRoomsChange = (callback) => {
  const roomsRef = ref(realtimeDB, GAME_ROOMS_PATH);
  return onValue(roomsRef, callback);
};

// ============ ROOM PLAYERS ============

/**
 * Add a player to a room
 * @param {string} roomId - Room ID
 * @param {string} playerId - Player ID
 * @param {Object} playerData - Player information
 * @returns {Promise<void>}
 */
export const addPlayerToRoom = async (roomId, playerId, playerData) => {
  const playerRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}/players/${playerId}`);
  await set(playerRef, {
    ...playerData,
    joinedAt: serverTimestamp()
  });
  
  // Increment player count
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}/currentPlayers`);
  const snapshot = await get(roomRef);
  const currentCount = snapshot.val() || 0;
  await set(roomRef, currentCount + 1);
};

/**
 * Remove a player from a room
 * @param {string} roomId - Room ID
 * @param {string} playerId - Player ID
 * @returns {Promise<void>}
 */
export const removePlayerFromRoom = async (roomId, playerId) => {
  const playerRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}/players/${playerId}`);
  await remove(playerRef);
  
  // Decrement player count
  const roomRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}/currentPlayers`);
  const snapshot = await get(roomRef);
  const currentCount = snapshot.val() || 0;
  await set(roomRef, Math.max(0, currentCount - 1));
};

/**
 * Listen to players in a room
 * @param {string} roomId - Room ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onRoomPlayersChange = (roomId, callback) => {
  const playersRef = ref(realtimeDB, `${GAME_ROOMS_PATH}/${roomId}/players`);
  return onValue(playersRef, callback);
};

// ============ ACTIVE GAMES ============

const ACTIVE_GAMES_PATH = 'activeGames';

/**
 * Create or update an active game
 * @param {string} roomId - Room ID
 * @param {Object} gameState - Game state data
 * @returns {Promise<void>}
 */
export const setGameState = async (roomId, gameState) => {
  const gameRef = ref(realtimeDB, `${ACTIVE_GAMES_PATH}/${roomId}`);
  await set(gameRef, {
    ...gameState,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Get current game state
 * @param {string} roomId - Room ID
 * @returns {Promise<DataSnapshot>} Game state snapshot
 */
export const getGameState = async (roomId) => {
  const gameRef = ref(realtimeDB, `${ACTIVE_GAMES_PATH}/${roomId}`);
  const snapshot = await get(gameRef);
  return snapshot;
};

/**
 * Update specific game state fields
 * @param {string} roomId - Room ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateGameState = async (roomId, updates) => {
  const gameRef = ref(realtimeDB, `${ACTIVE_GAMES_PATH}/${roomId}`);
  await update(gameRef, {
    ...updates,
    lastUpdated: serverTimestamp()
  });
};

/**
 * Listen to real-time game state updates
 * @param {string} roomId - Room ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onGameStateChange = (roomId, callback) => {
  const gameRef = ref(realtimeDB, `${ACTIVE_GAMES_PATH}/${roomId}`);
  return onValue(gameRef, callback);
};

/**
 * Delete an active game
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export const deleteActiveGame = async (roomId) => {
  const gameRef = ref(realtimeDB, `${ACTIVE_GAMES_PATH}/${roomId}`);
  await remove(gameRef);
};

// ============ CHAT ============

const CHAT_PATH = 'chat';

/**
 * Send a chat message
 * @param {string} roomId - Room ID
 * @param {Object} messageData - Message data
 * @returns {Promise<string>} Message ID
 */
export const sendChatMessage = async (roomId, messageData) => {
  const messagesRef = ref(realtimeDB, `${CHAT_PATH}/${roomId}`);
  const newMessageRef = push(messagesRef);
  
  await set(newMessageRef, {
    ...messageData,
    timestamp: serverTimestamp()
  });
  
  return newMessageRef.key;
};

/**
 * Listen to chat messages in a room
 * @param {string} roomId - Room ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onChatMessages = (roomId, callback) => {
  const messagesRef = ref(realtimeDB, `${CHAT_PATH}/${roomId}`);
  return onValue(messagesRef, callback);
};

/**
 * Listen to new chat messages only
 * @param {string} roomId - Room ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onNewChatMessage = (roomId, callback) => {
  const messagesRef = ref(realtimeDB, `${CHAT_PATH}/${roomId}`);
  return onChildAdded(messagesRef, callback);
};

/**
 * Clear chat history for a room
 * @param {string} roomId - Room ID
 * @returns {Promise<void>}
 */
export const clearChat = async (roomId) => {
  const messagesRef = ref(realtimeDB, `${CHAT_PATH}/${roomId}`);
  await remove(messagesRef);
};

// ============ PLAYER PRESENCE ============

const PRESENCE_PATH = 'presence';

/**
 * Set user online status
 * @param {string} userId - User ID
 * @param {Object} presenceData - Presence information
 * @returns {Promise<void>}
 */
export const setUserPresence = async (userId, presenceData) => {
  const presenceRef = ref(realtimeDB, `${PRESENCE_PATH}/${userId}`);
  await set(presenceRef, {
    ...presenceData,
    lastSeen: serverTimestamp()
  });
  
  // Set up disconnect handler
  const disconnectRef = ref(realtimeDB, `${PRESENCE_PATH}/${userId}`);
  onDisconnect(disconnectRef).set({
    online: false,
    lastSeen: serverTimestamp(),
    currentRoom: null
  });
};

/**
 * Get user presence status
 * @param {string} userId - User ID
 * @returns {Promise<DataSnapshot>} Presence snapshot
 */
export const getUserPresence = async (userId) => {
  const presenceRef = ref(realtimeDB, `${PRESENCE_PATH}/${userId}`);
  const snapshot = await get(presenceRef);
  return snapshot;
};

/**
 * Listen to user presence changes
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onUserPresenceChange = (userId, callback) => {
  const presenceRef = ref(realtimeDB, `${PRESENCE_PATH}/${userId}`);
  return onValue(presenceRef, callback);
};

/**
 * Set user offline
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const setUserOffline = async (userId) => {
  const presenceRef = ref(realtimeDB, `${PRESENCE_PATH}/${userId}`);
  await set(presenceRef, {
    online: false,
    lastSeen: serverTimestamp(),
    currentRoom: null
  });
};

/**
 * Get all online users
 * @returns {Promise<DataSnapshot>} Online users snapshot
 */
export const getOnlineUsers = async () => {
  const presenceRef = ref(realtimeDB, PRESENCE_PATH);
  const snapshot = await get(presenceRef);
  return snapshot;
};

// ============ UTILITY FUNCTIONS ============

/**
 * Remove a listener
 * @param {Reference} databaseRef - Database reference
 * @param {Function} callback - Callback function to remove
 */
export const removeListener = (databaseRef, callback) => {
  off(databaseRef, 'value', callback);
};

/**
 * Remove all listeners for a reference
 * @param {Reference} databaseRef - Database reference
 */
export const removeAllListeners = (databaseRef) => {
  off(databaseRef);
};

// Export realtimeDB instance for direct access if needed
export { realtimeDB };

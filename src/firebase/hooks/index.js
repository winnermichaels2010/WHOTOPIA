/**
 * Firebase Hooks Index
 * 
 * This file exports all custom Firebase hooks for easy importing.
 * 
 * USAGE:
 * import { useAuth, useUserProfile, useMatchHistory, useGameRoom, useChat } from './firebase/hooks';
 * 
 * ARCHITECTURE NOTES:
 * - Centralizes all hook exports for cleaner imports
 * - Provides both individual hooks and combined hooks
 * - Maintains separation of concerns by Firebase service
 */

export { useAuth } from './useAuth.js';
export { useUserProfile, useMatchHistory, useLeaderboard, useFirestore } from './useFirestore.js';
export { 
  useGameRoom, 
  useAvailableRooms, 
  useRoomPlayers, 
  useGameState, 
  useChat, 
  usePresence, 
  useRealtimeDB 
} from './useRealtimeDB.js';

// Default exports for combined hooks
export { default as useAuth } from './useAuth.js';
export { default as useFirestore } from './useFirestore.js';
export { default as useRealtimeDB } from './useRealtimeDB.js';

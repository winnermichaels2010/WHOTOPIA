/**
 * Firebase Initialization
 * 
 * This file initializes all Firebase services for the Whotopia application.
 * It exports initialized instances of:
 * - Firebase App
 * - Authentication
 * - Firestore Database
 * - Realtime Database
 * 
 * ARCHITECTURE OVERVIEW:
 * 
 * Firebase Services Used:
 * 1. Authentication: Handles user login/registration (Email, Google, Guest)
 * 2. Firestore: NoSQL database for persistent data (profiles, history, leaderboards)
 * 3. Realtime Database: Real-time sync for game state (rooms, chat, presence)
 * 
 * Why Two Databases?
 * - Firestore: Best for structured, queryable data that persists long-term
 * - Realtime Database: Best for real-time synchronization and low-latency updates
 * 
 * Data Separation Strategy:
 * - User profiles, match history, leaderboards → Firestore
 * - Active game rooms, live game state, chat messages, player presence → Realtime Database
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore Database
// Used for: User profiles, match history, leaderboards
const firestore = getFirestore(app);

// Initialize Realtime Database
// Used for: Game rooms, active games, chat, player presence
const realtimeDB = getDatabase(app);

// Export all Firebase instances
export { app, auth, firestore, realtimeDB };

// Export default app instance
export default app;

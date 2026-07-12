/**
 * Firestore Service
 * 
 * This service handles all Firestore database operations for Whotopia.
 * Firestore is used for persistent, structured data that requires querying.
 * 
 * DATA STRUCTURE:
 * 
 * Collections:
 * 1. users/ - User profiles and account data
 *    - {userId}: { displayName, email, photoURL, createdAt, stats, settings }
 * 
 * 2. matchHistory/ - Historical match records
 *    - {matchId}: { players, winner, duration, timestamp, gameMode, scores }
 * 
 * 3. leaderboards/ - Ranking data
 *    - global: { rankings: [{ userId, displayName, score, wins }] }
 *    - weekly: { rankings: [...], periodStart, periodEnd }
 * 
 * ARCHITECTURE NOTES:
 * - Firestore provides offline support and automatic sync
 * - Ideal for complex queries and structured data
 * - Better for long-term storage than Realtime Database
 * - Use indexes for frequently queried fields
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { firestore } from '../index.js';

// ============ USER PROFILES ============

const USERS_COLLECTION = 'users';

/**
 * Create or update a user profile
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} userData - User profile data
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, userData) => {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      winStreak: 0,
      bestWinStreak: 0
    }
  }, { merge: true });
};

/**
 * Get a user profile by ID
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<DocumentSnapshot>} User document snapshot
 */
export const getUserProfile = async (userId) => {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  return userSnap;
};

/**
 * Update a user profile
 * @param {string} userId - Firebase Auth user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updates) => {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

/**
 * Listen to real-time updates of a user profile
 * @param {string} userId - Firebase Auth user ID
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onUserProfileChange = (userId, callback) => {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  return onSnapshot(userRef, callback);
};

// ============ MATCH HISTORY ============

const MATCH_HISTORY_COLLECTION = 'matchHistory';

/**
 * Record a completed match
 * @param {Object} matchData - Match details
 * @returns {Promise<DocumentReference>} Match document reference
 */
export const recordMatch = async (matchData) => {
  const matchRef = await addDoc(collection(firestore, MATCH_HISTORY_COLLECTION), {
    ...matchData,
    timestamp: serverTimestamp()
  });
  
  // Update player stats
  await updatePlayerStats(matchData.players, matchData.winner);
  
  return matchRef;
};

/**
 * Get match history for a specific user
 * @param {string} userId - Firebase Auth user ID
 * @param {number} limitCount - Maximum number of matches to retrieve
 * @returns {Promise<QuerySnapshot>} Match history snapshot
 */
export const getUserMatchHistory = async (userId, limitCount = 20) => {
  const q = query(
    collection(firestore, MATCH_HISTORY_COLLECTION),
    where('players', 'array-contains', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot;
};

/**
 * Update player statistics after a match
 * @param {Array} players - Array of player IDs
 * @param {string} winner - ID of the winning player
 * @returns {Promise<void>}
 */
export const updatePlayerStats = async (players, winner) => {
  for (const playerId of players) {
    const userRef = doc(firestore, USERS_COLLECTION, playerId);
    const isWinner = playerId === winner;

    await runTransaction(firestore, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        transaction.set(userRef, {
          stats: {
            totalMatches: 1,
            wins: isWinner ? 1 : 0,
            losses: isWinner ? 0 : 1,
            winRate: isWinner ? 100 : 0,
            winStreak: isWinner ? 1 : 0,
            bestWinStreak: isWinner ? 1 : 0
          }
        }, { merge: true });
        return;
      }

      const stats = userSnap.data().stats || {};
      const totalMatches = (stats.totalMatches || 0) + 1;
      const wins = (stats.wins || 0) + (isWinner ? 1 : 0);
      const losses = (stats.losses || 0) + (isWinner ? 0 : 1);
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
      const winStreak = isWinner ? (stats.winStreak || 0) + 1 : 0;
      const bestWinStreak = Math.max(stats.bestWinStreak || 0, winStreak);

      transaction.update(userRef, {
        'stats.totalMatches': totalMatches,
        'stats.wins': wins,
        'stats.losses': losses,
        'stats.winRate': winRate,
        'stats.winStreak': winStreak,
        'stats.bestWinStreak': bestWinStreak
      });
    });
  }
};

// ============ LEADERBOARDS ============

const LEADERBOARDS_COLLECTION = 'leaderboards';

/**
 * Get all registered users (no limit)
 * @returns {Promise<QuerySnapshot>} All users snapshot
 */
export const getAllUsers = async () => {
  const q = query(collection(firestore, USERS_COLLECTION));
  const querySnapshot = await getDocs(q);
  return querySnapshot;
};

/**
 * Get global leaderboard
 * @param {number} limitCount - Maximum number of players to retrieve
 * @returns {Promise<QuerySnapshot>} Leaderboard snapshot
 */
export const getGlobalLeaderboard = async (limitCount = 50) => {
  const q = query(
    collection(firestore, USERS_COLLECTION),
    orderBy('stats.wins', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot;
};

/**
 * Get weekly leaderboard
 * @param {number} limitCount - Maximum number of players to retrieve
 * @returns {Promise<DocumentSnapshot>} Weekly leaderboard snapshot
 */
export const getWeeklyLeaderboard = async (_limitCount = 50) => {
  const leaderboardRef = doc(firestore, LEADERBOARDS_COLLECTION, 'weekly');
  const leaderboardSnap = await getDoc(leaderboardRef);
  return leaderboardSnap;
};

/**
 * Listen to real-time leaderboard updates
 * @param {string} leaderboardType - 'global' or 'weekly'
 * @param {Function} callback - Callback function with (snapshot)
 * @returns {Function} Unsubscribe function
 */
export const onLeaderboardChange = (leaderboardType = 'global', callback) => {
  if (leaderboardType === 'global') {
    const q = query(
      collection(firestore, USERS_COLLECTION),
      orderBy('stats.wins', 'desc'),
      limit(50)
    );
    return onSnapshot(q, callback);
  } else {
    const leaderboardRef = doc(firestore, LEADERBOARDS_COLLECTION, 'weekly');
    return onSnapshot(leaderboardRef, callback);
  }
};

// ============ UTILITY FUNCTIONS ============

/**
 * Execute a transaction for atomic operations
 * @param {Function} transactionFunction - Function to execute within transaction
 * @returns {Promise<any>} Transaction result
 */
export const executeTransaction = async (transactionFunction) => {
  return await runTransaction(firestore, transactionFunction);
};

/**
 * Delete a document from a collection
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  await deleteDoc(doc(firestore, collectionName, docId));
};

/**
 * Clear all match history for a specific user
 * Deletes all match documents where the user is a player, then resets their stats.
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<void>}
 */
export const clearUserMatchHistory = async (userId) => {
  const q = query(
    collection(firestore, MATCH_HISTORY_COLLECTION),
    where('players', 'array-contains', userId)
  );
  const snapshot = await getDocs(q);
  const batch = [];
  snapshot.docs.forEach((docSnap) => {
    batch.push(deleteDoc(doc(firestore, MATCH_HISTORY_COLLECTION, docSnap.id)));
  });
  await Promise.all(batch);

  const userRef = doc(firestore, USERS_COLLECTION, userId);
  await updateDoc(userRef, {
    stats: {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      winStreak: 0,
      bestWinStreak: 0,
    },
    updatedAt: serverTimestamp(),
  });
};

// Export firestore instance for direct access if needed
export { firestore };

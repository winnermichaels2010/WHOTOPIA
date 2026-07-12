/**
 * useFirestore Hook
 * 
 * React hook for Firestore Database operations.
 * Provides methods for user profiles, match history, and leaderboards.
 * 
 * USAGE:
 * const { getUserProfile, updateUserProfile, getMatchHistory, getLeaderboard } = useFirestore();
 * 
 * ARCHITECTURE NOTES:
 * - Wraps Firestore service functions in React hooks
 * - Provides loading and error states for async operations
 * - Includes real-time subscription hooks for live updates
 * - Separates concerns by data type (users, matches, leaderboards)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile as updateFirestoreProfile,
  onUserProfileChange,
  recordMatch,
  getUserMatchHistory,
  updatePlayerStats,
  getGlobalLeaderboard,
  getWeeklyLeaderboard,
  onLeaderboardChange,
  clearUserMatchHistory
} from '../services/firestoreService.js';

/**
 * Custom hook for Firestore User Profile operations
 * @param {string} userId - User ID to fetch profile for
 * @returns {Object} User profile data and methods
 */
export const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onUserProfileChange(userId, (snapshot) => {
      if (snapshot.exists()) {
        setProfile({ id: snapshot.id, ...snapshot.data() });
      } else {
        setProfile(null);
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null);
      await updateFirestoreProfile(userId, updates);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [userId]);

  const createProfile = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);
      await createUserProfile(userId, userData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, [userId]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile
  };
};

/**
 * Custom hook for Firestore Match History operations
 * @param {string} userId - User ID to fetch match history for
 * @param {number} limitCount - Maximum number of matches to retrieve
 * @returns {Object} Match history data and methods
 */
export const useMatchHistory = (userId, limitCount = 20) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatchHistory = useCallback(async () => {
    if (!userId) return;
    
    try {
      setError(null);
      setLoading(true);
      const snapshot = await getUserMatchHistory(userId, limitCount);
      const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(matchesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, limitCount]);

  useEffect(() => {
    fetchMatchHistory();
  }, [fetchMatchHistory]);

  const recordNewMatch = useCallback(async (matchData) => {
    try {
      setError(null);
      await recordMatch(matchData);
      await fetchMatchHistory(); // Refresh match history
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [fetchMatchHistory]);

  return {
    matches,
    loading,
    error,
    fetchMatchHistory,
    recordMatch: recordNewMatch,
    clearHistory: async () => {
      if (!userId) return { success: false, error: 'No user ID' };
      try {
        await clearUserMatchHistory(userId);
        setMatches([]);
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  };
};

/**
 * Custom hook for Firestore Leaderboard operations
 * @param {string} leaderboardType - 'global' or 'weekly'
 * @returns {Object} Leaderboard data and methods
 */
export const useLeaderboard = (leaderboardType = 'global') => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onLeaderboardChange(leaderboardType, (snapshot) => {
      if (leaderboardType === 'global') {
        const leaderboardData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setLeaderboard(leaderboardData);
      } else {
        if (snapshot.exists()) {
          setLeaderboard(snapshot.data().rankings || []);
        } else {
          setLeaderboard([]);
        }
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [leaderboardType]);

  return {
    leaderboard,
    loading,
    error
  };
};

/**
 * Combined hook for all Firestore operations
 * @returns {Object} All Firestore methods and hooks
 */
export const useFirestore = () => {
  return {
    // User profile hooks
    useUserProfile,
    
    // Match history hooks
    useMatchHistory,
    
    // Leaderboard hooks
    useLeaderboard,
    
    // Direct service methods (for advanced usage)
    createUserProfile,
    getUserProfile,
    updateUserProfile: updateFirestoreProfile,
    recordMatch,
    getUserMatchHistory,
    updatePlayerStats,
    getGlobalLeaderboard,
    getWeeklyLeaderboard
  };
};

export default useFirestore;

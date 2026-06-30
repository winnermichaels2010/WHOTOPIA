/**
 * useAuth Hook
 * 
 * React hook for Firebase Authentication.
 * Provides authentication state and authentication methods.
 * 
 * USAGE:
 * const { user, loading, error } = useAuth();
 * const { signIn, signUp, signOut, signInWithGoogle, signInAsGuest } = useAuth();
 * 
 * ARCHITECTURE NOTES:
 * - Automatically subscribes to auth state changes on mount
 * - Unsubscribes on unmount to prevent memory leaks
 * - Provides loading state for initial auth check
 * - Returns error state for failed operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChange,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInAsGuest,
  signOut,
  updateUserProfile,
  resetPassword,
  deleteUser
} from '../services/authService.js';

/**
 * Custom hook for Firebase Authentication
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await registerWithEmail(email, password, displayName);
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const loggedInUser = await signInWithEmail(email, password);
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign in with Google
  const googleSignIn = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const googleUser = await signInWithGoogle();
      setUser(googleUser);
      return { success: true, user: googleUser };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign in as guest
  const guestSignIn = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const guestUser = await signInAsGuest();
      setUser(guestUser);
      return { success: true, user: guestUser };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut();
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      await updateUserProfile(profileData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Reset password
  const resetUserPassword = useCallback(async (email) => {
    try {
      setError(null);
      await resetPassword(email);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Delete user account
  const deleteAccount = useCallback(async () => {
    try {
      setError(null);
      await deleteUser();
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isGuest: user?.isAnonymous || false,
    
    // Methods
    signUp,
    signIn,
    googleSignIn,
    guestSignIn,
    logout,
    updateProfile,
    resetPassword: resetUserPassword,
    deleteAccount
  };
};

export default useAuth;

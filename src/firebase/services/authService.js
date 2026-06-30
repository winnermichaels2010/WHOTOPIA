/**
 * Authentication Service
 * 
 * This service handles all authentication operations for Whotopia.
 * Supports three authentication methods:
 * 1. Email/Password - Traditional account creation
 * 2. Google Sign-In - OAuth authentication
 * 3. Guest/Anonymous - Temporary accounts for quick play
 * 
 * ARCHITECTURE NOTES:
 * - All auth methods return Firebase User objects
 * - User session is automatically managed by Firebase
 * - Auth state changes can be listened to via onAuthStateChanged
 * - Guest accounts can be upgraded to permanent accounts later
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  deleteUser as firebaseDeleteUser
} from 'firebase/auth';
import { auth } from '../index.js';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Register a new user with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} displayName - Optional display name
 * @returns {Promise<User>} Firebase User object
 */
export const registerWithEmail = async (email, password, displayName = null) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update profile if display name is provided
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  return userCredential.user;
};

/**
 * Sign in with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<User>} Firebase User object
 */
export const signInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign in with Google OAuth
 * @returns {Promise<User>} Firebase User object
 */
export const signInWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
};

/**
 * Sign in as a guest (anonymous user)
 * Useful for quick play without account creation
 * @returns {Promise<User>} Firebase User object
 */
export const signInAsGuest = async () => {
  const userCredential = await signInAnonymously(auth);
  return userCredential.user;
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  await firebaseSignOut(auth);
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Function called with (user) on auth state change
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Update user profile
 * @param {Object} profileData - Object containing displayName, photoURL, etc.
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (profileData) => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  await updateProfile(auth.currentUser, profileData);
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Delete the current user's account
 * @returns {Promise<void>}
 */
export const deleteUser = async () => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }
  await firebaseDeleteUser(auth.currentUser);
};

/**
 * Get the current authenticated user
 * @returns {User|null} Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Export auth instance for direct access if needed
export { auth };

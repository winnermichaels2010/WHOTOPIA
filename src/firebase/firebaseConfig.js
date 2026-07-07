/**
 * Firebase Configuration
 * 
 * This file contains the Firebase configuration for the Whotopia project.
 * Configuration values are loaded from environment variables (.env file).
 * 
 * To get your Firebase configuration:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select an existing one
 * 3. Navigate to Project Settings (gear icon)
 * 4. Scroll down to "Your apps" section
 * 5. Add a web app and copy the configuration object
 * 6. Update the .env file with your credentials
 * 
 * REQUIRED FIREBASE SERVICES:
 * - Authentication: Email/Password, Google Sign-In, Anonymous (Guest)
 * - Firestore Database: For user profiles, match history, leaderboards
 * - Realtime Database: For game rooms, active games, chat, player presence
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Measurement ID is optional (for Google Analytics)
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export default firebaseConfig;

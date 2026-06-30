/**
 * AuthContext
 * 
 * Provides authentication state and methods to the entire application.
 * Wraps the useAuth hook in a React Context for easy access across components.
 */

import { createContext, useContext } from 'react';
import { useAuth } from '../firebase/hooks';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Wraps the application to provide authentication context
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * @returns {Object} Authentication state and methods
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

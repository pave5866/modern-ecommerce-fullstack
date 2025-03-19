import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Authentication hook that provides access to auth context
 * @returns {Object} Authentication context with user info and auth methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 
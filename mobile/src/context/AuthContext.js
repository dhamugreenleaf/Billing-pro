import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage } from '../services/storage';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await Storage.clearSession();
    } catch (e) {
      console.warn('Logout storage error:', e);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  // Restore authenticated session from SecureStore on startup
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const storedToken = await Storage.getToken();
        const storedUser = await Storage.getUser();

        if (storedToken && storedUser) {
          if (isMounted) {
            setToken(storedToken);
            setUser(storedUser);
          }

          // Silently verify session with backend
          try {
            const meData = await authService.getMe();
            if (meData?.user && isMounted) {
              setUser(meData.user);
              await Storage.setUser(meData.user);
            }
          } catch (verifyErr) {
            if (verifyErr.status === 401) {
              await logout();
            }
          }
        }
      } catch (err) {
        console.warn('Session restoration error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    // Register 401 unauthorized interceptor handler
    setUnauthorizedHandler(() => {
      if (isMounted) {
        logout();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (newToken, newUser) => {
    await Storage.setToken(newToken);
    await Storage.setUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = async (updatedFields) => {
    const updated = { ...(user || {}), ...updatedFields };
    setUser(updated);
    await Storage.setUser(updated);
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

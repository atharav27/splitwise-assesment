import { createContext, useContext, useState } from 'react';
import { useLoginMutation, useSignupMutation } from '../hooks/useAuth';

const AuthContext = createContext(null);
const setStorageItem = (key, value) => {
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
};
const getStorageItem = (key) => localStorage.getItem(key);
const removeStorageItem = (key) => localStorage.removeItem(key);
const persistAuthData = (token, user) => {
  setStorageItem('token', token);
  setStorageItem('user', user);
};
const clearAuthData = () => {
  removeStorageItem('token');
  removeStorageItem('user');
};
const getInitialAuthState = () => {
  const storedToken = getStorageItem('token');
  const storedUser = getStorageItem('user');

  if (!storedToken || !storedUser) {
    clearAuthData();
    return { token: null, user: null };
  }

  try {
    return {
      token: storedToken,
      user: JSON.parse(storedUser),
    };
  } catch {
    clearAuthData();
    return { token: null, user: null };
  }
};

const initialAuthState = getInitialAuthState();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialAuthState.user);
  const [token, setToken] = useState(initialAuthState.token);
  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();
  const isInitializing = false;

  const login = async (credentials) => {
    const authData = await loginMutation.mutateAsync(credentials);
    persistAuthData(authData.token, authData.user);
    setToken(authData.token);
    setUser(authData.user);
    return authData.user;
  };

  const signup = async (credentials) => {
    const authData = await signupMutation.mutateAsync(credentials);
    persistAuthData(authData.token, authData.user);
    setToken(authData.token);
    setUser(authData.user);
    return authData.user;
  };

  const logout = () => {
    clearAuthData();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = Boolean(token && user);
  const loading = isInitializing || loginMutation.isPending || signupMutation.isPending;

  return (
    <AuthContext.Provider
      value={{ user, loading, isInitializing, isAuthenticated, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);
const DEV_AUTH_BYPASS = import.meta.env.DEV;
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

const storedUser = getStorageItem('user');
const hasToken = Boolean(getStorageItem('token'));
const initialUser = storedUser && hasToken ? JSON.parse(storedUser) : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialUser);
  const [loading] = useState(false);

  const login = async (credentials) => {
    if (DEV_AUTH_BYPASS) {
      const mockUser = {
        _id: `dev-${Date.now()}`,
        name: credentials?.name || credentials?.email || 'Dev User',
        email: credentials?.email || 'dev@local.test',
      };
      persistAuthData('dev-token', mockUser);
      setUser(mockUser);
      return mockUser;
    }

    const { data } = await authAPI.login(credentials);
    persistAuthData(data.data.token, data.data.user);
    setUser(data.data.user);
    return data.data.user;
  };

  const signup = async (credentials) => {
    if (DEV_AUTH_BYPASS) {
      const mockUser = {
        _id: `dev-${Date.now()}`,
        name: credentials?.name || credentials?.email || 'Dev User',
        email: credentials?.email || 'dev@local.test',
      };
      persistAuthData('dev-token', mockUser);
      setUser(mockUser);
      return mockUser;
    }

    const { data } = await authAPI.signup(credentials);
    persistAuthData(data.data.token, data.data.user);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../services/api';

const mapAuthResponse = (response) => {
  const payload = response?.data?.data || {};
  return {
    token: payload.token,
    user: payload.user,
  };
};

export const loginRequest = async (credentials) => {
  const response = await authAPI.login(credentials);
  return mapAuthResponse(response);
};

export const signupRequest = async (credentials) => {
  const response = await authAPI.signup(credentials);
  return mapAuthResponse(response);
};

export const useLoginMutation = (options = {}) =>
  useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: loginRequest,
    ...options,
  });

export const useSignupMutation = (options = {}) =>
  useMutation({
    mutationKey: ['auth', 'signup'],
    mutationFn: signupRequest,
    ...options,
  });

import { request } from './client';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  UpdateProfileRequest,
  UserSummary,
} from '../types/auth';

export function signup(data: SignupRequest) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: data,
    auth: false,
  });
}

export function login(data: LoginRequest) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: data,
    auth: false,
  });
}

export function logout() {
  return request<null>('/auth/logout', {
    method: 'POST',
  });
}

export function getMe() {
  return request<UserSummary>('/me');
}

export function updateProfile(data: UpdateProfileRequest) {
  return request<UserSummary>('/me', {
    method: 'PATCH',
    body: data,
  });
}

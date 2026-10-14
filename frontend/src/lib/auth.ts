/**
 * CargoSync — Auth utility functions
 */

import { User, AuthTokens } from '@/types';

export function saveAuth(data: AuthTokens) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout() {
  const user = getUser();
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  const roleParam = user?.user_type ? `?role=${user.user_type}` : '';
  window.location.href = `/${roleParam}#access`;
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.user_type === 'admin';
}

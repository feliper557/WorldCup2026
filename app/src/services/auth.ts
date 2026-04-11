export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

export interface AuthMe {
  clientPrincipal: ClientPrincipal | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  userId?: string;
  email?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
    role: string;
    totalPoints: number;
    totalPredictions: number;
    correctPredictions: number;
    accuracyPercentage: number;
    leaderboardRank: number;
  };
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: string;
  isEmailVerified: boolean;
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyPercentage: number;
  leaderboardRank: number;
  createdAt: string;
  lastLoginAt?: string;
}

import { getApiBase } from './apiClient';

const API_BASE = getApiBase();

/**
 * Login con usuario y contraseña
 */
export async function loginWithCredentials(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al iniciar sesión');
    }

    const data = await response.json() as LoginResponse;

    // Guardar token en localStorage
    if (data.token) {
      localStorage.setItem('jwtToken', data.token);
      localStorage.setItem('userId', data.userId || '');
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Obtener perfil del usuario autenticado
 */
export async function getUserProfile(token: string): Promise<UserProfile> {
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener perfil');
    }

    return await response.json();
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

/**
 * Obtener información de autenticación desde Azure Static Web Apps
 * En producción: /.auth/me
 * En desarrollo local: devuelve null (mockeable)
 */
export async function getAuthMe(): Promise<AuthMe> {
  try {
    const response = await fetch('/.auth/me');
    if (!response.ok) {
      return { clientPrincipal: null };
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching auth info:', error);
    return { clientPrincipal: null };
  }
}

/**
 * Obtener token JWT almacenado
 */
export function getStoredToken(): string | null {
  return localStorage.getItem('jwtToken');
}

/**
 * Obtener usuario almacenado
 */
export function getStoredUser(): any {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function getLoginUrl(provider: string = 'github'): string {
  return `/.auth/login/${provider}`;
}

export function getLogoutUrl(): string {
  return '/.auth/logout';
}

/**
 * Logout
 */
export function logout(): void {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-logout'));
}

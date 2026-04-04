export interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

export interface AuthMe {
  clientPrincipal: ClientPrincipal | null;
}

/**
 * Obtiene información de autenticación desde Azure Static Web Apps
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

export function getLoginUrl(provider: string = 'github'): string {
  return `/.auth/login/${provider}`;
}

export function getLogoutUrl(): string {
  return '/.auth/logout';
}

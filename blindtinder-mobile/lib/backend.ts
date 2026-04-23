import { apiRequest, isBackendConfigured } from '@/lib/api';

export { isBackendConfigured };

export type BackendAuthResponse<TUser> = {
  token?: string;
  user?: TUser;
  data?: {
    token?: string;
    user?: TUser;
  };
};

export async function postAuth<TUser>(
  path: '/auth/login' | '/auth/register',
  payload: Record<string, string>
) {
  return apiRequest<BackendAuthResponse<TUser>>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe<TUser>(token: string) {
  return apiRequest<TUser>('/profile/me', { token });
}

export async function updateMe<TUser>(token: string, payload: Record<string, unknown>) {
  return apiRequest<TUser>('/profile/me', {
    token,
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getDiscovery<TItem>(token: string) {
  return apiRequest<TItem[]>('/discovery', { token });
}

export async function createSwipe<TItem>(
  token: string,
  payload: Record<string, unknown>
) {
  return apiRequest<TItem>('/swipes', {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMatches<TItem>(token: string) {
  return apiRequest<TItem[]>('/matches', { token });
}

export async function getMatchMessages<TItem>(token: string, matchId: string) {
  return apiRequest<TItem[]>(`/matches/${matchId}/messages`, { token });
}

export async function sendMatchMessage<TItem>(
  token: string,
  matchId: string,
  payload: Record<string, unknown>
) {
  return apiRequest<TItem>(`/matches/${matchId}/messages`, {
    token,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
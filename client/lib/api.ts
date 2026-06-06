import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class NetworkError extends Error {
  constructor(message = 'Network unavailable. Your request was saved locally.') {
    super(message);
    this.name = 'NetworkError';
  }
}

const FRIENDLY_ERRORS: Record<string, string> = {
  'Missing or invalid authorization header': 'Session not ready. Please wait a moment.',
  'Invalid or expired token': 'Your session expired. Please refresh the page.',
  'Too many SOS requests': 'An alert is already active or you triggered too recently.',
  'An active SOS alert already exists': 'You already have an active emergency alert.',
  'No active alert found': 'No active emergency was found.',
  'Contact not found': 'That contact no longer exists.',
  'Profile not found': 'Profile not set up yet.',
  'Validation failed': 'Please check the form and try again.',
  'Internal server error': 'Something went wrong on our end. Please try again.',
};

const friendlyMessage = (raw: string): string => {
  for (const [key, friendly] of Object.entries(FRIENDLY_ERRORS)) {
    if (raw?.includes(key)) return friendly;
  }
  // Strip any Supabase/Firebase/JWT internal detail
  if (raw?.toLowerCase().includes('jwt') || raw?.toLowerCase().includes('supabase')) {
    return 'Session error. Please refresh the page.';
  }
  return raw || 'Something went wrong. Please try again.';
};

const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers = await getAuthHeaders();
  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
  } catch {
    throw new NetworkError();
  }

  const json = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(friendlyMessage(json.error));
  return json.data;
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

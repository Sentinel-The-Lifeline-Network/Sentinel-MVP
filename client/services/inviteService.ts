const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface InviteInfo {
  contactName: string;
  userName: string;
  status: string;
}

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  });

  const json = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
  return json.data;
};

export const inviteService = {
  getInvite: (token: string) => request<InviteInfo>(`/api/invite/${token}`),
  acceptInvite: (token: string) => request(`/api/invite/${token}/accept`, { method: 'POST', body: JSON.stringify({}) }),
  registerPushToken: (token: string, fcmToken: string) =>
    request(`/api/invite/${token}/push-token`, { method: 'POST', body: JSON.stringify({ token: fcmToken }) }),
};

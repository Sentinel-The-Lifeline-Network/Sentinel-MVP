export const SESSION_COOKIE = 'sentinel_admin_session';

const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_DASHBOARD_PASSWORD || 'sentinel-admin';

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const getSessionToken = async (): Promise<string> => {
  const password = process.env.ADMIN_DASHBOARD_PASSWORD || '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(password));
  return toHex(signature);
};

export const isValidSession = async (cookieValue: string | undefined): Promise<boolean> => {
  if (!cookieValue) return false;
  const expected = await getSessionToken();
  if (cookieValue.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
};

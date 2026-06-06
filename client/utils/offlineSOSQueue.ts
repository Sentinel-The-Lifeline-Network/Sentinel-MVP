import type { SOSAlert } from '@/services/sosService';

const QUEUE_KEY = 'sentinel:offline-sos-queue';
const LAST_LOCATION_KEY = 'sentinel:last-known-location';

export interface SOSCoordinates {
  latitude: number;
  longitude: number;
}

export interface OfflineSOSRequest {
  id: string;
  coords?: SOSCoordinates;
  createdAt: string;
  attempts: number;
}

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

const readQueue = (): OfflineSOSRequest[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: OfflineSOSRequest[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const offlineSOSQueue = {
  all: readQueue,

  hasPending: () => readQueue().length > 0,

  enqueue(coords?: SOSCoordinates): OfflineSOSRequest {
    const queue = readQueue();
    const existing = queue[0];

    if (existing) return existing;

    const request: OfflineSOSRequest = {
      id: `offline-${Date.now()}`,
      coords,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    writeQueue([request]);
    return request;
  },

  incrementAttempt(id: string) {
    writeQueue(readQueue().map((item) => (item.id === id ? { ...item, attempts: item.attempts + 1 } : item)));
  },

  remove(id: string) {
    writeQueue(readQueue().filter((item) => item.id !== id));
  },

  clear() {
    writeQueue([]);
  },

  saveLastKnownLocation(coords: SOSCoordinates) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(coords));
  },

  getLastKnownLocation(): SOSCoordinates | undefined {
    if (!canUseStorage()) return undefined;

    try {
      const raw = window.localStorage.getItem(LAST_LOCATION_KEY);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  },

  toLocalAlert(request: OfflineSOSRequest): SOSAlert {
    return {
      id: request.id,
      user_id: 'offline',
      status: 'active',
      started_at: request.createdAt,
      ended_at: null,
      last_latitude: request.coords?.latitude ?? null,
      last_longitude: request.coords?.longitude ?? null,
      last_location_timestamp: request.coords ? request.createdAt : null,
      tracking_token: '',
      created_at: request.createdAt,
      sync_status: 'pending',
    };
  },
};

import { api } from '@/lib/api';
import { offlineSOSQueue } from '@/utils/offlineSOSQueue';

export interface SOSAlert {
  id: string;
  user_id: string;
  status: 'active' | 'resolved' | 'cancelled';
  started_at: string;
  ended_at: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_location_timestamp: string | null;
  tracking_token: string;
  created_at: string;
  sync_status?: 'synced' | 'pending';
  notifications_log?: Array<{
    id: string;
    contact_id: string;
    channel: 'whatsapp' | 'push';
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sent_at: string | null;
  }>;
  notification_summary?: {
    status?: 'queued' | 'completed';
    contactCount: number;
    deliveryCount: number;
    sentCount: number;
    failedCount: number;
    channels: string[];
    failures: Array<{
      contactId: string;
      contactName?: string;
      channel: string;
      message: string;
    }>;
  } | null;
}

export const sosService = {
  trigger: (coords?: { latitude: number; longitude: number }) =>
    api.post<SOSAlert>('/api/sos/trigger', coords || {}),

  syncOfflineQueue: async () => {
    const pending = offlineSOSQueue.all();
    const synced: SOSAlert[] = [];

    for (const item of pending) {
      offlineSOSQueue.incrementAttempt(item.id);
      const alert = await api.post<SOSAlert>('/api/sos/trigger', item.coords || {});
      offlineSOSQueue.remove(item.id);
      synced.push(alert);
    }

    return synced;
  },

  getActive: () => api.get<SOSAlert | null>('/api/sos/active'),

  updateLocation: (
    alertId: string,
    coords: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }
  ) => api.put(`/api/sos/${alertId}/location`, coords),

  markSafe: (alertId: string, pin?: string) =>
    api.post<SOSAlert>(`/api/sos/${alertId}/mark-safe`, { pin }),

  stopAlert: (alertId: string, pin?: string) =>
    api.post<SOSAlert>(`/api/sos/${alertId}/stop`, { pin }),

  getHistory: () => api.get<SOSAlert[]>('/api/sos/history'),

  getById: (id: string) => api.get<SOSAlert>(`/api/sos/${id}`),
};

'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NetworkError } from '@/lib/api';
import { sosService, SOSAlert } from '@/services/sosService';
import { offlineSOSQueue } from '@/utils/offlineSOSQueue';
import { useGeolocation } from './useGeolocation';
import { useAuth } from '@/lib/authContext';

export type SOSState = 'idle' | 'activating' | 'active' | 'stopping';

type ServiceWorkerWithSync = ServiceWorkerRegistration & {
  sync?: { register: (tag: string) => Promise<void> };
};

const storeNotificationSummary = (alert: SOSAlert) => {
  if (typeof window === 'undefined' || !alert.notification_summary) return;
  sessionStorage.setItem('sentinel-notification-summary', JSON.stringify(alert.notification_summary));
};

export const useSOS = () => {
  const [state, setState] = useState<SOSState>('idle');
  const [alert, setAlert] = useState<SOSAlert | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { getCurrentPosition, watchPosition } = useGeolocation();
  const { session } = useAuth();
  const router = useRouter();
  const stopWatchRef = useRef<(() => void) | null>(null);
  const lastLocationUpdateRef = useRef(0);

  const syncOfflineSOS = useCallback(async () => {
    if (!offlineSOSQueue.hasPending() || !navigator.onLine) return;

    try {
      setSyncStatus('Syncing saved SOS alert...');
      const synced = await sosService.syncOfflineQueue();
      if (synced[0]) {
        setAlert(synced[0]);
        setState('active');
        setSyncStatus('SOS synced successfully. Your trusted contacts can now follow the alert.');
      }
    } catch {
      setSyncStatus('SOS saved locally. Syncing when network returns.');
    }
  }, []);

  useEffect(() => {
    syncOfflineSOS();

    const handleOnline = () => syncOfflineSOS();
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_OFFLINE_SOS') syncOfflineSOS();
    };

    window.addEventListener('online', handleOnline);
    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [syncOfflineSOS]);

  useEffect(() => {
    if (!session?.access_token) return;
    setInitialized(false);
    sosService
      .getActive()
      .then((active) => {
        if (active) {
          setAlert(active);
          setState('active');
        }
        setInitialized(true);
      })
      .catch(() => {
        if (offlineSOSQueue.hasPending()) {
          const pending = offlineSOSQueue.all()[0];
          setAlert(offlineSOSQueue.toLocalAlert(pending));
          setState('active');
          setSyncStatus('SOS saved locally. Syncing when network returns.');
        }
      });
  }, [session?.access_token]);

  useEffect(() => {
    if (state !== 'active' || !alert || alert.sync_status === 'pending') return;
    const alertId = alert.id;
    const stop = watchPosition(alertId, async (coords) => {
      const now = Date.now();
      if (now - lastLocationUpdateRef.current < 10000) return;
      lastLocationUpdateRef.current = now;

      try {
        await sosService.updateLocation(alertId, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? undefined,
          speed: coords.speed ?? undefined,
          heading: coords.heading ?? undefined,
        });
      } catch {}
    });
    stopWatchRef.current = stop;
    return stop;
  }, [state, alert?.id, alert?.sync_status, watchPosition]);

  const triggerSOS = useCallback(async () => {
    try {
      setState('activating');
      setError(null);
      setSyncStatus(null);
      const coords = await getCurrentPosition();
      const payload = coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined;
      const newAlert = await sosService.trigger(payload);
      storeNotificationSummary(newAlert);
      if (newAlert.notification_summary) {
        const { sentCount, failedCount } = newAlert.notification_summary;
        setSyncStatus(
          failedCount > 0
            ? `${sentCount} notification(s) sent, ${failedCount} failed.`
            : `${sentCount} notification(s) sent successfully.`
        );
      }
      setAlert(newAlert);
      setState('active');
      router.replace('/active-alert');
    } catch (err: any) {
      if (err instanceof NetworkError || !navigator.onLine) {
        const coords = await getCurrentPosition();
        const payload = coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined;
        const pending = offlineSOSQueue.enqueue(payload);

        setAlert(offlineSOSQueue.toLocalAlert(pending));
        setState('active');
        setError(null);
        setSyncStatus('SOS saved locally. Syncing when network returns.');

        navigator.serviceWorker?.ready
          .then((registration) => (registration as ServiceWorkerWithSync).sync?.register('sentinel-sync-sos'))
          .catch(() => {});

        router.replace('/active-alert');
        return;
      }

      if (err.message?.includes('already active') || err.message?.includes('already exists')) {
        const existing = await sosService.getActive().catch(() => null);
        if (existing) {
          setAlert(existing);
          setState('active');
          setInitialized(true);
          router.replace('/active-alert');
          return;
        }
      }
      setError(err.message || 'Failed to trigger SOS. Check your connection.');
      setState('idle');
    }
  }, [getCurrentPosition, router]);

  const markSafe = useCallback(
    async (pin?: string) => {
      if (!alert) return;
      try {
        setState('stopping');
        if (alert.sync_status === 'pending') {
          offlineSOSQueue.clear();
          setAlert(null);
          setSyncStatus(null);
          setState('idle');
          router.replace('/');
          return;
        }
        const updated = await sosService.markSafe(alert.id, pin);
        storeNotificationSummary(updated);
        setAlert(updated);
        setState('idle');
        router.replace('/');
      } catch (err: any) {
        setError(err.message);
        setState('active');
      }
    },
    [alert, router]
  );

  const stopAlert = useCallback(
    async (pin?: string) => {
      if (!alert) return;
      try {
        setState('stopping');
        if (alert.sync_status === 'pending') {
          offlineSOSQueue.clear();
          setAlert(null);
          setSyncStatus(null);
          setState('idle');
          router.replace('/');
          return;
        }
        const updated = await sosService.stopAlert(alert.id, pin);
        storeNotificationSummary(updated);
        setAlert(updated);
        setState('idle');
        router.replace('/');
      } catch (err: any) {
        setError(err.message);
        setState('active');
      }
    },
    [alert, router]
  );

  return { state, alert, error, initialized, syncStatus, triggerSOS, markSafe, stopAlert, syncOfflineSOS };
};

'use client';
import { useState, useCallback } from 'react';
import { offlineSOSQueue } from '@/utils/offlineSOSQueue';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const getCurrentPosition = useCallback((): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState((s) => ({ ...s, error: 'Geolocation not supported' }));
        resolve(null);
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          offlineSOSQueue.saveLastKnownLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setState({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            error: null,
            loading: false,
          });
          resolve(pos.coords);
        },
        (err) => {
          setState((s) => ({ ...s, error: err.message, loading: false }));
          const cached = offlineSOSQueue.getLastKnownLocation();
          resolve(cached ? ({ ...cached, accuracy: null } as unknown as GeolocationCoordinates) : null);
        },
        { enableHighAccuracy: true, timeout: 3000, maximumAge: 15000 }
      );
    });
  }, []);

  const watchPosition = useCallback((alertId: string, onUpdate: (coords: GeolocationCoordinates) => void) => {
    if (!navigator.geolocation) return () => {};

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        offlineSOSQueue.saveLastKnownLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
        onUpdate(pos.coords);
      },
      (err) => setState((s) => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { ...state, getCurrentPosition, watchPosition };
};

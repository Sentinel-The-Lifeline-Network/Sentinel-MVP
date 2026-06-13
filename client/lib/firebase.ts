import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const isFirebaseConfigured = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | null = null;

const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
};

export const requestPushPermissionAndToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    console.warn('[Firebase] Push notifications are not configured.');
    return null;
  }

  if (!(await isSupported())) {
    console.warn('[Firebase] Push messaging is not supported in this browser.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const swQuery = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swQuery}`);

  const messaging = getMessaging(firebaseApp);
  return getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
};

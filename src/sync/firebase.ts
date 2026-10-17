/**
 * Firebase Realtime Database – wird nur geladen, wenn VITE_FIREBASE_* gesetzt ist.
 * Ohne Config bleibt die App komplett lokal (LocalStorage).
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL);

export interface RoomRecord {
  v: number;
  updatedAt: number;
  /** JSON-String des synchronisierten States (RTDB verwirft sonst leere Arrays/null). */
  payload: string;
}

export interface RoomConnection {
  write: (payload: string) => Promise<void>;
  read: () => Promise<RoomRecord | null>;
  subscribe: (cb: (rec: RoomRecord | null) => void, onError: (e: Error) => void) => () => void;
  onConnectionChange: (cb: (connected: boolean) => void) => () => void;
}

export async function openRoom(roomId: string): Promise<RoomConnection> {
  const [{ initializeApp, getApps }, db] = await Promise.all([import('firebase/app'), import('firebase/database')]);
  const app = getApps()[0] ?? initializeApp(config);
  const database = db.getDatabase(app);
  const roomRef = db.ref(database, `rooms/${roomId}`);

  return {
    write: payload => db.set(roomRef, { v: 1, updatedAt: db.serverTimestamp(), payload }),
    read: async () => (await db.get(roomRef)).val() as RoomRecord | null,
    subscribe: (cb, onError) => db.onValue(roomRef, snap => cb(snap.val() as RoomRecord | null), onError),
    onConnectionChange: cb => db.onValue(db.ref(database, '.info/connected'), snap => cb(snap.val() === true)),
  };
}

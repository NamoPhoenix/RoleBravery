/**
 * URL-Parameter für Räume und Overlay:
 *   Control: ?room=<id>
 *   Overlay: ?room=<id>&overlay=1[&bg=transparent]
 */

const ROOM_STORAGE_KEY = 'role-bravery-room-id';
const ROOM_ID_LENGTH = 24;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const params = new URLSearchParams(window.location.search);

export const isOverlayMode = params.get('overlay') === '1';
export const isTransparentOverlay = params.get('bg') === 'transparent';

export function generateRoomId(): string {
  const bytes = new Uint8Array(ROOM_ID_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
}

const isValidRoomId = (id: string | null): id is string => !!id && /^[A-Za-z0-9_-]{20,64}$/.test(id);

const safeStorage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
};

function writeRoomToUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', id);
  window.history.replaceState(null, '', url.toString());
}

/**
 * Raum-ID aus der URL; im Control-Panel ohne ID wird die zuletzt genutzte
 * wiederverwendet oder eine neue erzeugt (damit der OBS-Link stabil bleibt).
 */
export function resolveRoomId(): string | null {
  const fromUrl = params.get('room');
  if (isValidRoomId(fromUrl)) {
    if (!isOverlayMode) safeStorage.set(ROOM_STORAGE_KEY, fromUrl);
    return fromUrl;
  }
  if (isOverlayMode) return null;
  const stored = safeStorage.get(ROOM_STORAGE_KEY);
  const id = isValidRoomId(stored) ? stored : generateRoomId();
  safeStorage.set(ROOM_STORAGE_KEY, id);
  writeRoomToUrl(id);
  return id;
}

/** Neuen Raum anlegen (neue URL, neuer OBS-Link). */
export function createNewRoom(): void {
  const id = generateRoomId();
  safeStorage.set(ROOM_STORAGE_KEY, id);
  writeRoomToUrl(id);
  window.location.reload();
}

export function buildOverlayUrl(roomId: string | null, transparent = false): string {
  const url = new URL(window.location.origin + window.location.pathname);
  if (roomId) url.searchParams.set('room', roomId);
  url.searchParams.set('overlay', '1');
  if (transparent) url.searchParams.set('bg', 'transparent');
  return url.toString();
}

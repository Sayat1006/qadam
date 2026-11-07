/* PWA: service worker тіркеу және «Телефонға орнату» */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: BIPEvent | null = null;
const subs = new Set<() => void>();

export function registerPwa() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    subs.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    subs.forEach((f) => f());
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
  }
}

export function onInstallChange(f: () => void) {
  subs.add(f);
  return () => void subs.delete(f);
}

export function canInstall() {
  return !!deferred;
}

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export async function promptInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  subs.forEach((f) => f());
  return outcome === 'accepted';
}

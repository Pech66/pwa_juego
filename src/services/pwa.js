/* Estado de la PWA. La instalación se gestiona desde el navegador. */
const subs = new Set();
let serviceWorkerError = false;

export const pwa = {
  get online() { return navigator.onLine; },
  get offlineReady() { return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller; },
  get development() { return import.meta.env.DEV; },
  get serviceWorkerError() { return serviceWorkerError; },
  subscribe(cb) { subs.add(cb); return () => subs.delete(cb); }
};

export function reportServiceWorkerError() {
  serviceWorkerError = true;
  notify();
}
function notify() { subs.forEach((cb) => cb(pwa)); }

// No se intercepta beforeinstallprompt: el navegador conserva su flujo nativo.
navigator.serviceWorker?.addEventListener('controllerchange', notify);
addEventListener('online', notify);
addEventListener('offline', notify);

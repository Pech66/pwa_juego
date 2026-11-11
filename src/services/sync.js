import { storage } from './storage.js';
import { flushPending, SYNC_TAG } from './sync-core.js';
const subscribers = new Set();
let started = false, timer, sending = false;
async function notify() {
  const status = { ...await storage.outbox.status(), sending };
  subscribers.forEach(callback => callback(status));
}
async function registerBackground() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active && registration.sync) await registration.sync.register(SYNC_TAG);
  } catch { /* Se reintentará al recuperar red, abrir o enfocar la app. */ }
}
function schedule() {
  clearTimeout(timer);
  void notify();
  timer = setTimeout(attempt, 500);
}
async function attempt() {
  if (sending) return;
  const status = await storage.outbox.status();
  if (!status.pending || status.memoryOnly) { await notify(); return; }
  // Registra primero el reintento para conservarlo aunque se cierre la ventana.
  await registerBackground();
  if (!navigator.onLine) { await notify(); return; }
  sending = true; await notify();
  try { await flushPending(); } catch { /* La cola se conserva hasta recibir confirmación. */ }
  finally { sending = false; await notify(); }
}
export const synchronization = {
  async start() {
    if (started) return;
    started = true;
    await storage.outbox.initialize();
    storage.subscribe('outbox', schedule);
    if ('BroadcastChannel' in self) {
      const channel = new BroadcastChannel('lom-data');
      channel.onmessage = schedule;
    }
    addEventListener('online', schedule);
    addEventListener('focus', schedule);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
    navigator.serviceWorker?.addEventListener('controllerchange', schedule);
    setInterval(() => { if (!document.hidden) void attempt(); }, 30000);
    schedule();
  },
  getStatus() { return storage.outbox.status().then(status => ({ ...status, sending })); },
  subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); }
};

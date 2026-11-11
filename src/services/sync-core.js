import { storage } from './storage.js';
export const SYNC_TAG = 'lab-of-mutant-sync';
export const SYNC_ENDPOINT = import.meta.env.VITE_SYNC_API_URL || '/api/sync';
let active;
async function sendAll() {
  await storage.outbox.initialize();
  if (storage.isMemoryOnly) return;
  const token = await storage.outbox.credentials();
  for (let batch = 0; batch < 10; batch++) {
    const operations = await storage.outbox.list(50);
    if (!operations.length) return;
    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST', credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ operations }), signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('El servidor no confirmó los cambios (' + response.status + ').');
    const receipt = await response.json();
    const sent = operations.map(operation => operation.seq);
    if (!Array.isArray(receipt.accepted) || receipt.accepted.length !== sent.length ||
        new Set(receipt.accepted).size !== sent.length || sent.some(seq => !receipt.accepted.includes(seq))) {
      throw new Error('La respuesta del servidor no confirma todos los cambios.');
    }
    await storage.outbox.acknowledge(sent);
  }
  if ((await storage.outbox.status()).pending) throw new Error('Quedan cambios pendientes para el próximo envío.');
}
export function flushPending() {
  if (active) return active;
  const run = () => sendAll().catch(async error => { await storage.outbox.error(error.message); throw error; });
  const locks = navigator.locks;
  active = (locks ? locks.request('lom-sync-send', run) : run()).finally(() => { active = null; });
  return active;
}

/* Datos locales y cola de envío en una misma transacción de IndexedDB. */
const DB_NAME = 'lab-of-mutant';
const DB_VERSION = 2;
const META = 'sync.meta';
const SYNC_KEYS = new Set(['profile', 'prefs', 'stats']);
export const DEFAULTS = {
  prefs: { torch: true, guideTab: 't1' },
  stats: { visits: 0, firstVisit: null, lastVisit: null, timesSeen: 0, bestHidden: 0, keysTried: [] },
  profile: { name: '' }
};
let dbPromise, useMemory = false;
const mem = { kv: new Map(), notes: new Map(), nextId: 1 };
const listeners = new Map();
const clone = value => value == null ? value : structuredClone(value);
const merged = (key, value) => {
  const base = clone(DEFAULTS[key]);
  return value === undefined ? base : base && typeof base === 'object' ? { ...base, ...value } : value;
};
function emit(key, value) { (listeners.get(key) || []).forEach(callback => callback(value)); }
function changed() {
  emit('outbox');
  if ('BroadcastChannel' in self) {
    const channel = new BroadcastChannel('lom-data');
    channel.postMessage('changed'); channel.close();
  }
}
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) return reject(new Error('IndexedDB no disponible'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('notes')) {
        const notes = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        notes.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
    };
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); dbPromise = null; }; resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => emit('blocked');
  }).catch(error => { console.warn('[storage]', error.message); useMemory = true; return null; });
  return dbPromise;
}
async function transaction(names, mode, action) {
  const db = await openDB();
  if (!db) return undefined;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, mode);
    let result, failure;
    tx.oncomplete = () => resolve(result);
    tx.onerror = tx.onabort = () => reject(failure || tx.error || new Error('No se pudo guardar'));
    try { action(tx, value => { result = value; }); }
    catch (error) { failure = error; tx.abort(); }
  });
}
const enqueue = (tx, operation) => tx.objectStore('outbox').add({ ...operation, createdAt: Date.now() });
async function write(key, update) {
  let value;
  if (await openDB()) {
    value = await transaction(['kv', 'outbox'], 'readwrite', (tx, done) => {
      const kv = tx.objectStore('kv');
      kv.get(key).onsuccess = event => {
        try {
          const next = update(merged(key, event.target.result));
          kv.put(next, key);
          if (SYNC_KEYS.has(key)) enqueue(tx, { kind: 'set', key, value: next });
          done(next);
        } catch { tx.abort(); }
      };
    });
  } else { value = update(merged(key, mem.kv.get(key))); mem.kv.set(key, clone(value)); }
  emit(key, value); if (SYNC_KEYS.has(key)) changed();
  return value;
}
export const storage = {
  get isMemoryOnly() { return useMemory; },
  async get(key) {
    if (!await openDB()) return merged(key, clone(mem.kv.get(key)));
    const value = await transaction(['kv'], 'readonly', (tx, done) => {
      tx.objectStore('kv').get(key).onsuccess = event => done(event.target.result);
    });
    return merged(key, value);
  },
  set(key, value) { return write(key, () => value); },
  update(key, update) { return write(key, update); },
  subscribe(key, callback) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
  },
  notes: {
    async list() {
      const notes = await openDB() ? await transaction(['notes'], 'readonly', (tx, done) => {
        tx.objectStore('notes').getAll().onsuccess = event => done(event.target.result);
      }) : [...mem.notes.values()];
      return (notes || []).sort((a, b) => b.createdAt - a.createdAt);
    },
    async add(text) {
      const note = { text: String(text).trim().slice(0, 600), createdAt: Date.now() };
      if (!note.text) return null;
      if (await openDB()) await transaction(['notes', 'outbox'], 'readwrite', tx => {
        tx.objectStore('notes').add(note).onsuccess = event => {
          note.id = event.target.result;
          enqueue(tx, { kind: 'note.put', note });
        };
      });
      else { note.id = mem.nextId++; mem.notes.set(note.id, clone(note)); }
      emit('notes', note); changed(); return note;
    },
    async remove(id) {
      if (await openDB()) await transaction(['notes', 'outbox'], 'readwrite', tx => {
        tx.objectStore('notes').delete(id); enqueue(tx, { kind: 'note.delete', noteId: id });
      });
      else mem.notes.delete(id);
      emit('notes', null); changed();
    }
  },
  async clearAll() {
    if (await openDB()) await transaction(['kv', 'notes', 'outbox'], 'readwrite', tx => {
      const kv = tx.objectStore('kv');
      kv.get(META).onsuccess = event => {
        const meta = event.target.result;
        kv.clear(); if (meta) kv.put(meta, META);
        tx.objectStore('notes').clear(); tx.objectStore('outbox').clear();
        enqueue(tx, { kind: 'reset' });
      };
    });
    else { mem.kv.clear(); mem.notes.clear(); }
    try { localStorage.removeItem('lom-journal-draft'); } catch { /* Puede ejecutarse en un worker. */ }
    ['prefs', 'stats', 'profile', 'notes'].forEach(key => emit(key, null)); changed();
  },
  outbox: {
    async initialize() {
      if (!await openDB()) return;
      await transaction(['kv', 'notes', 'outbox'], 'readwrite', tx => {
        const kv = tx.objectStore('kv');
        kv.get(META).onsuccess = event => {
          const existing = event.target.result;
          if (existing?.mirrorVersion === 'sqlserver-v1') return;
          kv.put({ token: crypto.randomUUID(), lastSyncedAt: null, lastError: null, ...existing, mirrorVersion: 'sqlserver-v1' }, META);
          // Reenvía una vez los datos locales al pasar del receptor de archivos a SQL Server.
          for (const key of SYNC_KEYS) kv.get(key).onsuccess = result => {
            if (result.target.result !== undefined) enqueue(tx, { kind: 'set', key, value: result.target.result });
          };
          tx.objectStore('notes').getAll().onsuccess = result => {
            for (const note of result.target.result) enqueue(tx, { kind: 'note.put', note });
          };
        };
      });
    },
    async list(limit = 50) {
      return await transaction(['outbox'], 'readonly', (tx, done) => {
        tx.objectStore('outbox').getAll(null, limit).onsuccess = event => done(event.target.result);
      }) || [];
    },
    async status() {
      const meta = await storage.get(META);
      const pending = await transaction(['outbox'], 'readonly', (tx, done) => {
        tx.objectStore('outbox').count().onsuccess = event => done(event.target.result);
      }) || 0;
      return { pending, lastSyncedAt: meta?.lastSyncedAt || null, lastError: meta?.lastError || null, memoryOnly: useMemory };
    },
    async credentials() { await this.initialize(); return (await storage.get(META))?.token; },
    async acknowledge(sequences) {
      await transaction(['kv', 'outbox'], 'readwrite', tx => {
        for (const seq of sequences) tx.objectStore('outbox').delete(seq);
        const kv = tx.objectStore('kv');
        kv.get(META).onsuccess = event => kv.put({ ...event.target.result, lastSyncedAt: Date.now(), lastError: null }, META);
      });
      changed();
    },
    async error(message) {
      await transaction(['kv'], 'readwrite', tx => {
        const kv = tx.objectStore('kv');
        kv.get(META).onsuccess = event => { if (event.target.result) kv.put({ ...event.target.result, lastError: message }, META); };
      });
      emit('sync-status');
    }
  },
  async requestPersistence() {
    if (!navigator.storage?.persist) return false;
    try { return await navigator.storage.persisted() || await navigator.storage.persist(); } catch { return false; }
  },
  async info() {
    const info = { persisted: false, usage: 0, quota: 0 };
    try {
      if (navigator.storage?.persisted) info.persisted = await navigator.storage.persisted();
      if (navigator.storage?.estimate) Object.assign(info, await navigator.storage.estimate());
    } catch { /* Sin soporte. */ }
    return info;
  }
};

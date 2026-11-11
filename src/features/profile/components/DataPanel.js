import { h } from '../../../utils/dom.js';
import { storage } from '../../../services/storage.js';
import { pwa } from '../../../services/pwa.js';
import { synchronization } from '../../../services/sync.js';
import { Button } from '../../../components/Button/Button.js';
import { toast } from '../../../components/Toast/Toast.js';

const kb = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

/* Estado de la app: conexión, instalación, almacenamiento, exportar y borrar datos. */
export function DataPanel({ signal }) {
  const el = h(`
    <div class="data card">
      <dl class="data__list">
        <div><dt>Conexión</dt><dd data-net></dd></div>
        <div><dt>Modo sin conexión</dt><dd data-sw></dd></div>
        <div><dt>Sincronización</dt><dd data-sync aria-live="polite"></dd></div>
        <div><dt>Almacenamiento</dt><dd data-store></dd></div>
        <div><dt>Espacio usado</dt><dd data-usage></dd></div>
      </dl>
      <div class="data__actions"></div>
    </div>`);

  const $ = (s) => el.querySelector(s);
  const actions = $('.data__actions');

  const exportBtn = Button({ label: 'Exportar mis datos', icon: 'i-dl', iconPos: 'start', variant: 'ghost', onClick: exportData });
  const clearBtn = Button({ label: 'Borrar mis datos', icon: 'i-trash', iconPos: 'start', variant: 'danger', onClick: clearData });
  actions.append(exportBtn, clearBtn);

  async function render() {
    const sync = await synchronization.getStatus();
    $('[data-sync]').textContent = sync.memoryOnly ? 'Solo en memoria: no se pueden conservar envíos pendientes'
      : sync.sending ? 'Enviando cambios…'
      : sync.pending ? `${sync.pending} cambio${sync.pending === 1 ? '' : 's'} pendiente${sync.pending === 1 ? '' : 's'} · ${pwa.online ? 'Se reintentará el envío' : 'Esperando conexión'}`
      : sync.lastSyncedAt ? 'Cambios confirmados por el servidor' : 'Sin cambios pendientes';
    $('[data-sync]').className = sync.pending ? 'warn' : 'ok';
    $('[data-net]').textContent = pwa.online ? 'En línea' : 'Sin conexión';
    $('[data-net]').className = pwa.online ? 'ok' : 'warn';

    const sw = pwa.offlineReady;
    $('[data-sw]').textContent = sw ? 'Activo' : pwa.development ? 'Disponible en la versión final' : pwa.serviceWorkerError ? 'No disponible: vuelve a abrir la app con conexión' : 'Preparando la app para usarla sin conexión';
    $('[data-sw]').className = sw ? 'ok' : '';

    const info = await storage.info();
    $('[data-store]').textContent = storage.isMemoryOnly
      ? 'Solo en memoria (este navegador no permite guardar)'
      : info.persisted ? 'Persistente (el navegador no lo borrará)' : 'Local (puede borrarse si falta espacio)';
    $('[data-usage]').textContent = info.quota ? `${kb(info.usage)} de ${kb(info.quota)}` : '—';

  }

  async function exportData() {
    const data = {
      app: 'LAB OF MUTANT', exportedAt: new Date().toISOString(),
      profile: await storage.get('profile'), prefs: await storage.get('prefs'),
      stats: await storage.get('stats'), notes: await storage.notes.list()
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'lab-of-mutant-datos.json' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function clearData() {
    if (!confirm('¿Borrar tu diario, récords y preferencias? También se enviará el borrado al servidor cuando haya conexión. No se puede deshacer.')) return;
    await storage.clearAll();
    toast('Datos borrados.');
    render();
  }

  const off = pwa.subscribe(render);
  const offSync = synchronization.subscribe(render);
  signal.addEventListener('abort', off);
  signal.addEventListener('abort', offSync);
  render();
  return el;
}

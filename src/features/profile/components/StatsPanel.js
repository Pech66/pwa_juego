import { h } from '../../../utils/dom.js';
import { storage } from '../../../services/storage.js';

const TOTAL_KEYS = 13;
const fmtDate = (t) => (t ? new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (s) => (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`);

/* Estadísticas guardadas en el dispositivo. */
export function StatsPanel({ signal }) {
  const el = h(`<div class="stats"></div>`);

  async function render() {
    const s = await storage.get('stats');
    const items = [
      ['Visitas', s.visits || 0],
      ['Primera visita', fmtDate(s.firstVisit)],
      ['Récord oculto', fmtTime(s.bestHidden || 0)],
      ['Veces detectado', s.timesSeen || 0],
      ['Controles probados', `${(s.keysTried || []).length} / ${TOTAL_KEYS}`]
    ];
    el.innerHTML = items.map(([k, v]) => `<div class="stat card"><span>${k}</span><b>${v}</b></div>`).join('');
  }
  const off = storage.subscribe('stats', render);
  signal.addEventListener('abort', off);
  render();
  return el;
}

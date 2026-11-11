import { h, esc } from '../../../utils/dom.js';
import './Event.css';

export function Event({ signal }) {
  const el = h('<section class="s" id="evento"><h2 class="h">Nos vemos en la exposición</h2><div class="event card"><p role="status">Consultando información del evento…</p></div></section>');
  const panel = el.querySelector('.event');
  async function load() {
    let data;
    const abort = new AbortController();
    const stop = () => abort.abort();
    signal.addEventListener('abort', stop, { once: true });
    const timer = setTimeout(stop, 7000);
    try {
      const response = await fetch('/api/evento', { signal: abort.signal, cache: 'no-store' });
      if (!response.ok) throw new Error();
      data = await response.json();
      if (typeof data.titulo !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha) || typeof data.direccion !== 'string') throw new Error();
      try { localStorage.setItem('lom-evento', JSON.stringify(data)); } catch { /* Sin almacenamiento. */ }
    } catch {
      if (signal.aborted) return;
      try { data = JSON.parse(localStorage.getItem('lom-evento')); } catch { /* Sin caché. */ }
      if (!data) { try { data = await fetch('/evento.json', { signal }).then(r => r.ok ? r.json() : null); } catch { /* Sin conexión. */ } }
    } finally { clearTimeout(timer); signal.removeEventListener('abort', stop); }
    if (signal.aborted) return;
    if (!data) { panel.replaceChildren(h('<p>No se pudo obtener el evento.</p>')); return; }
    const date = new Date(data.fecha + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
    panel.innerHTML = `<div class="event__details"><p class="event__tag">PRESENTACIÓN DEL PROYECTO</p><h3>${esc(data.titulo)}</h3><p>${esc(data.descripcion || '')}</p><dl><div><dt>Fecha</dt><dd>${esc(date)}</dd></div><div><dt>Hora</dt><dd>${esc(data.hora || 'Por confirmar')}</dd></div><div><dt>Lugar</dt><dd>${esc(data.lugar || 'Por confirmar')}</dd></div></dl><address class="event__address">${esc(data.direccion)}</address></div><div class="event__location"><iframe class="event__frame" title="Ubicación del evento: ${esc(data.lugar || 'Edificio B')}" src="https://www.openstreetmap.org/export/embed.html?bbox=-86.852%2C21.044%2C-86.842%2C21.053&amp;layer=mapnik&amp;marker=21.04845%2C-86.84675" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><p class="event__map-note">El mapa interactivo necesita conexión a internet. La dirección permanece disponible sin conexión.</p></div>`;
  }
  void load();
  return el;
}

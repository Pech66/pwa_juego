import './Profile.css';
import { h } from '../../utils/dom.js';
import { storage } from '../../services/storage.js';
import { StatsPanel } from './components/StatsPanel.js';
import { Journal } from './components/Journal.js';
import { DataPanel } from './components/DataPanel.js';

/* Perfil del explorador: nombre, estadísticas, diario y datos guardados. */
export function ProfileView(ctx) {
  const el = h(`
    <section class="s profile">
      <p class="profile__kicker">Expediente del explorador</p>
      <label class="profile__name">
        <span class="sr-only">Tu nombre</span>
        <input type="text" maxlength="40" placeholder="Escribe tu nombre" autocomplete="nickname">
      </label>
      <p class="lead">Tu información se guarda en este dispositivo para usarla sin conexión. Los cambios pendientes se envían al servidor cuando vuelve a estar disponible.</p>

      <h3 class="sh profile__h">Tu progreso</h3>
      <div data-slot="stats"></div>

      <h3 class="sh profile__h">Diario</h3>
      <div data-slot="journal"></div>

      <h3 class="sh profile__h">Datos y aplicación</h3>
      <div data-slot="data"></div>
    </section>`);

  el.querySelector('[data-slot="stats"]').replaceWith(StatsPanel(ctx));
  el.querySelector('[data-slot="journal"]').replaceWith(Journal(ctx));
  el.querySelector('[data-slot="data"]').replaceWith(DataPanel(ctx));

  // Nombre: se guarda mientras escribes
  const input = el.querySelector('input');
  let t;
  storage.get('profile').then((p) => (input.value = p.name || ''));
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => storage.update('profile', (p) => ({ ...p, name: input.value.trim() })), 300);
  });
  const off = storage.subscribe('profile', (p) => { if (!p) input.value = ''; });
  ctx.signal.addEventListener('abort', off);

  return el;
}

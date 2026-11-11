import { h, esc } from '../../../utils/dom.js';
import { storage } from '../../../services/storage.js';
import { Button } from '../../../components/Button/Button.js';

const fmt = (t) => new Date(t).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* Diario del explorador: notas guardadas en IndexedDB (funcionan sin conexión). */
export function Journal({ signal }) {
  const el = h(`
    <div class="journal card">
      <form class="journal__form">
        <label for="note" class="sr-only">Nueva nota</label>
        <textarea id="note" rows="3" maxlength="600" placeholder="Anota pistas, rutas seguras o lo que viste en el bosque…"></textarea>
        <div class="journal__bar"><small class="journal__count">0 / 600</small></div>
      </form>
      <ul class="journal__list" aria-live="polite"></ul>
    </div>`);

  const form = el.querySelector('form');
  const ta = el.querySelector('textarea');
  const count = el.querySelector('.journal__count');
  const list = el.querySelector('.journal__list');
  form.querySelector('.journal__bar').append(Button({ label: 'Guardar nota', icon: 'i-plus', iconPos: 'start', type: 'submit' }));

  // Borrador sin guardar: se conserva aunque recargues
  const DRAFT = 'lom-journal-draft';
  try { ta.value = localStorage.getItem(DRAFT) || ''; } catch { /* sin acceso */ }
  const updateCount = () => (count.textContent = `${ta.value.length} / 600`);
  updateCount();
  ta.addEventListener('input', () => {
    updateCount();
    try { localStorage.setItem(DRAFT, ta.value); } catch { /* sin acceso */ }
  });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ta.value.trim()) return ta.focus();
    await storage.notes.add(ta.value);
    ta.value = ''; updateCount();
    try { localStorage.removeItem(DRAFT); } catch { /* sin acceso */ }
  });

  async function render() {
    const notes = await storage.notes.list();
    list.replaceChildren();
    if (!notes.length) {
      list.innerHTML = '<li class="journal__empty">Tu diario está vacío. Puedes escribir sin conexión; los cambios se enviarán cuando el servidor esté disponible.</li>';
      return;
    }
    notes.forEach((n) => {
      const li = h(`<li class="journal__item"><div><time>${fmt(n.createdAt)}</time><p>${esc(n.text)}</p></div></li>`);
      const del = Button({ label: '', icon: 'i-trash', variant: 'icon', onClick: () => storage.notes.remove(n.id) });
      del.setAttribute('aria-label', 'Borrar nota');
      li.append(del);
      list.append(li);
    });
  }
  const off = storage.subscribe('notes', render);
  signal.addEventListener('abort', off);
  render();
  return el;
}

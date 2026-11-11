import './Guide.css';
import { h } from '../../../utils/dom.js';
import { storage } from '../../../services/storage.js';
import { ControlsTester } from './ControlsTester.js';
import { StealthGame } from './StealthGame.js';
import { Flashlight } from './Flashlight.js';

const TABS = [
  { id: 't1', title: 'Controles esenciales', sub: 'Teclado y mouse' },
  { id: 't2', title: 'Sigilo', sub: 'Supervivencia',
    intro: 'Agáchate para reducir el ruido y aprovecha las coberturas para salir de la vista de la criatura. Correr puede atraer su atención.',
    tip: 'Mueve el cursor (o desliza el dedo) o usa W A S D. Mantén Shift para correr y pulsa Ctrl para agacharte.' },
  { id: 't3', title: 'La linterna', sub: 'Herramientas',
    intro: 'Enciéndela o apágala con F. Mantén el clic derecho para una luz intensa que revela más del camino, aunque la luz también puede atraer la atención.' }
];

/* Guía con pestañas. La pestaña abierta se recuerda entre visitas. */
export function Guide(ctx) {
  const el = h(`
    <section class="s guide-section" id="guia">
      <span class="film__eyebrow rv">MANUAL DE CAMPO / SUPERVIVENCIA</span>
      <h2 class="h rv">Antes de adentrarte</h2>
      <p class="lead rv">Aprende a explorar, mantenerte oculto y utilizar tus herramientas.</p>
      <div class="guide">
        <div class="guide__tabs" role="tablist" aria-label="Secciones de la guía">
          ${TABS.map((t, i) => `<button class="guide__tb${i ? '' : ' on'}" role="tab" id="tab-${t.id}" aria-controls="${t.id}" aria-selected="${!i}" tabindex="${i ? -1 : 0}" data-t="${t.id}"><span class="guide__number">0${i + 1}</span><span>${t.title}<small>${t.sub}</small></span><span class="guide__arrow" aria-hidden="true">↗</span></button>`).join('')}
        </div>
        <div>
          ${TABS.map((t, i) => `
          <div class="guide__tp${i ? '' : ' on'}" id="${t.id}" role="tabpanel" aria-labelledby="tab-${t.id}">
            <div class="guide__panel-head"><span class="film__eyebrow">LECCIÓN 0${i + 1}</span><h3>${t.title}</h3>${t.intro ? `<p class="guide__intro">${t.intro}</p>` : '<p class="guide__intro">Prueba las teclas y familiarízate con los movimientos antes de entrar al bosque.</p>'}</div>
            <div class="guide__slot"></div>
            ${t.tip ? `<p class="tip">${t.tip}</p>` : ''}
          </div>`).join('')}
        </div>
      </div>
      <div class="guide__notes"><article><span>01 / OCÚLTATE</span><p>Usa el entorno para romper la línea de visión de la criatura.</p></article><article><span>02 / INVESTIGA</span><p>Reúne notas, fotografías y expedientes para reconstruir el pasado.</p></article><article><span>03 / ESCUCHA</span><p>Explora con cautela: la amenaza sigue presente mientras buscas respuestas.</p></article></div>
    </section>`);

  const slots = el.querySelectorAll('.guide__slot');
  slots[0].append(ControlsTester(ctx));
  slots[1].append(StealthGame(ctx));
  slots[2].append(Flashlight(ctx));

  const tabs = [...el.querySelectorAll('.guide__tb')];
  const panels = [...el.querySelectorAll('.guide__tp')];

  function select(id, persist = true) {
    if (!TABS.some((tab) => tab.id === id)) return;
    tabs.forEach((b) => { const on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    panels.forEach((p) => p.classList.toggle('on', p.id === id));
    if (persist) storage.update('prefs', (p) => ({ ...p, guideTab: id }));
  }

  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.t));
    b.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); select(n.dataset.t);
    });
  });
  storage.get('prefs').then((p) => p.guideTab && select(p.guideTab, false));
  return el;
}

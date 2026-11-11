import { h } from '../../utils/dom.js';
import { Hero } from './components/Hero.js';
import { StoryFilm } from './components/StoryFilm.js';
import { Characters } from './components/Characters.js';
import { Guide } from './components/Guide.js';
import { PcExtras } from './components/PcExtras.js';
import { Event } from './components/Event.js';

const SPY = ['inicio', 'universo', 'guia', 'pc', 'evento'];

/* Vista principal: une las secciones y controla el scroll (aparición + menú activo). */
export function HomeView(ctx) {
  const { signal, setActive } = ctx;
  const view = document.createElement('div');

  const intro = h(`
    <section class="s" id="universo" style="padding-bottom:0">
      <h2 class="h rv">Historia y personajes</h2>
      <p class="lead rv">Conoce la historia y a los personajes que navegan en ella.</p>
    </section>`);

  view.append(Hero(ctx), intro, StoryFilm(ctx), Characters(ctx), Guide(ctx), PcExtras(ctx), Event(ctx));

  requestAnimationFrame(() => {
    if (signal.aborted) return;

    // Aparición al hacer scroll
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    view.querySelectorAll('.rv').forEach((e, i) => { e.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(e); });

    // Sección activa en el menú
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) setActive(e.target.dataset.spy);
    }), { rootMargin: '-45% 0px -50% 0px' });
    SPY.forEach((id) => {
      const sec = view.querySelector('#' + id);
      sec.dataset.spy = id;
      spy.observe(sec);
    });
    // La historia y los personajes cuentan como "Universo"
    view.querySelectorAll('.film, #personajes').forEach((e) => { e.dataset.spy = 'universo'; spy.observe(e); });

    signal.addEventListener('abort', () => { io.disconnect(); spy.disconnect(); });
  });

  return view;
}

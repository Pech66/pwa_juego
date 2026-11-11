import './Navbar.css';
import { h } from '../../utils/dom.js';
import { pwa } from '../../services/pwa.js';

const ITEMS = [
  { id: 'inicio', label: 'Inicio', icon: 'i-home' },
  { id: 'universo', label: 'Universo', icon: 'i-book' },
  { id: 'guia', label: 'Guía', icon: 'i-comp' },
  { id: 'pc', label: 'PC/extras', icon: 'i-pc' },
  { id: 'evento', label: 'Evento', icon: 'i-book' },
  { id: 'perfil', label: 'Perfil', icon: 'i-user', href: '#/perfil' }
];

/**
 * Barra de navegación con píldora animada.
 * @param {{ onNavigate: (id: string) => void }} props
 * @returns {HTMLElement & { setActive: (id: string) => void }}
 */
export function Navbar({ onNavigate }) {
  const el = h(`
    <nav class="nav" aria-label="Principal">
      <a class="nav__logo" href="#/" data-target="inicio">LAB OF MUTANT</a>
      <ul class="nav__menu">
        <span class="nav__pill" aria-hidden="true"></span>
        ${ITEMS.map((i) => `<li><a href="${i.href || '#/'}" data-target="${i.id}" aria-label="${i.label}"><svg aria-hidden="true"><use href="#${i.icon}"/></svg><span>${i.label}</span></a></li>`).join('')}
      </ul>
      <span class="nav__net" role="status"></span>
    </nav>`);

  const links = [...el.querySelectorAll('.nav__menu a')];
  const pill = el.querySelector('.nav__pill');
  const net = el.querySelector('.nav__net');
  let active = null;

  function movePill() {
    const a = links.find((l) => l.dataset.target === active);
    if (!a) return;
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  }

  el.setActive = (id) => {
    if (id === active) return;
    active = id;
    links.forEach((a) => {
      const on = a.dataset.target === id;
      a.classList.toggle('on', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
    movePill();
  };

  el.querySelectorAll('[data-target]').forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); onNavigate(a.dataset.target); })
  );

  function renderNet() {
    net.classList.toggle('off', !pwa.online);
    net.textContent = pwa.online ? '' : 'Sin conexión';
  }
  pwa.subscribe(renderNet);
  renderNet();

  addEventListener('resize', movePill);
  document.fonts?.ready.then(movePill);
  requestAnimationFrame(movePill);
  return el;
}

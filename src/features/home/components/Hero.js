import './Hero.css';
import { h, loop, later } from '../../../utils/dom.js';
import { Button } from '../../../components/Button/Button.js';
import { storage } from '../../../services/storage.js';

/* Portada: lluvia, linterna que sigue al cursor (F la apaga) y relámpagos. */
export function Hero({ signal }) {
  const el = h(`
    <header id="inicio" class="hero">
      <div class="hero__bg"><img src="/images/portada-dark-mutant.jpeg" alt="Un explorador ilumina el bosque bajo la lluvia"></div>
      <canvas class="hero__rain" aria-hidden="true"></canvas>
      <div class="hero__dark"></div>
      <div class="hero__flash"></div>
      <div class="hero__in">
        <h1 class="hero__title"><span>LAB OF</span><span>MUTANT</span></h1>
        <p class="hero__sub">Sumérgete en el universo de LAB OF MUTANT.</p>
      </div>
      <p class="hero__hint">Mueve el mouse para alumbrar el bosque · pulsa <span class="kbd">F</span> para encender o apagar la linterna</p>
    </header>`);

  const cta = Button({
    label: 'Explorar', icon: 'i-rt', variant: 'light', className: 'hero__cta',
    onClick: () => document.getElementById('universo')?.scrollIntoView({ behavior: 'smooth' })
  });
  el.querySelector('.hero__in').append(cta);

  /* Lluvia */
  const cv = el.querySelector('.hero__rain'), cx = cv.getContext('2d');
  let W = 0, H = 0, drops = [], visible = true;
  const fit = () => {
    W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight;
    drops = Array.from({ length: Math.min(220, W / 5) }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 10 + Math.random() * 16, v: 12 + Math.random() * 10 }));
  };
  const ro = new ResizeObserver(fit); ro.observe(cv);
  const vis = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); vis.observe(el);
  signal.addEventListener('abort', () => { ro.disconnect(); vis.disconnect(); });

  loop(signal, () => {
    if (!visible || !W) return;
    cx.clearRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(190,215,255,.28)'; cx.lineWidth = 1; cx.beginPath();
    for (const d of drops) {
      cx.moveTo(d.x, d.y); cx.lineTo(d.x - 2, d.y + d.l);
      d.y += d.v; d.x -= 0.6;
      if (d.y > H) { d.y = -20; d.x = Math.random() * W; }
    }
    cx.stroke();
  });

  /* Linterna (estado guardado en IndexedDB) */
  const dark = el.querySelector('.hero__dark');
  let torch = true;
  const applyTorch = () => { dark.style.opacity = torch ? 1 : 0; el.style.filter = torch ? '' : 'brightness(.45)'; };
  storage.get('prefs').then((p) => { torch = p.torch; applyTorch(); });

  el.addEventListener('pointermove', (e) => {
    const b = el.getBoundingClientRect();
    dark.style.setProperty('--mx', e.clientX - b.left + 'px');
    dark.style.setProperty('--my', e.clientY - b.top + 'px');
  }, { signal });

  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyF' || e.ctrlKey || e.metaKey || e.target.closest?.('input,textarea')) return;
    if (scrollY >= innerHeight * 0.6) return; // más abajo, F controla la demo de la linterna
    torch = !torch; applyTorch();
    storage.update('prefs', (p) => ({ ...p, torch }));
  }, { signal });

  /* Relámpagos */
  const flash = el.querySelector('.hero__flash');
  const bolt = () => {
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    later(signal, 7000 + Math.random() * 9000, bolt);
  };
  later(signal, 4500, bolt);

  return el;
}

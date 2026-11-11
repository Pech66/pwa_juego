import { h, loop } from '../../../utils/dom.js';

export function Flashlight({ signal }) {
  const el = h(`
    <div class="flashlight">
      <div class="demo frame" tabindex="0" aria-label="Prueba de linterna en el bosque. Mueve el cursor para iluminar; F para encender o apagar.">
        <div class="demo__scene"><img src="/images/portada-dark-mutant.jpeg" alt="El bosque y su sendero bajo la lluvia"></div>
        <div class="demo__dark"></div>
        <span class="demo__status" aria-live="polite">Linterna encendida</span>
      </div>
      <div class="demo__toolbar"><p class="demo__label">Explora con el cursor · <span class="kbd">F</span> enciende o apaga · Mantén el clic derecho para intensificar la luz. En móvil, mantén pulsada la imagen.</p><button class="demo__toggle" type="button" aria-pressed="true">Apagar linterna</button></div>
    </div>`);
  const demo = el.querySelector('.demo');
  const dark = el.querySelector('.demo__dark');
  const status = el.querySelector('.demo__status');
  const button = el.querySelector('.demo__toggle');
  let on = true, intense = false, radius = 160;
  const visible = () => {
    const box = demo.getBoundingClientRect();
    return demo.offsetParent !== null && box.bottom > 0 && box.top < innerHeight;
  };
  function toggle() {
    on = !on;
    demo.classList.toggle('is-off', !on);
    status.textContent = on ? 'Linterna encendida' : 'Linterna apagada';
    button.textContent = on ? 'Apagar linterna' : 'Encender linterna';
    button.setAttribute('aria-pressed', String(on));
  }
  const move = (event) => {
    const box = demo.getBoundingClientRect();
    dark.style.setProperty('--x', event.clientX - box.left + 'px');
    dark.style.setProperty('--y', event.clientY - box.top + 'px');
  };
  demo.addEventListener('pointermove', move);
  demo.addEventListener('pointerdown', (event) => {
    move(event);
    if (event.button === 2 || event.pointerType === 'touch') {
      intense = true;
      demo.setPointerCapture(event.pointerId);
    }
  });
  const release = () => { intense = false; };
  demo.addEventListener('pointercancel', release);
  demo.addEventListener('lostpointercapture', release);
  demo.addEventListener('contextmenu', (event) => event.preventDefault());
  addEventListener('pointerup', release, { signal });
  addEventListener('blur', release, { signal });
  button.addEventListener('click', toggle);
  addEventListener('keydown', (event) => {
    if (event.code !== 'KeyF' || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input,textarea,[contenteditable="true"]') || !visible()) return;
    toggle();
  }, { signal });
  loop(signal, () => {
    if (!visible()) return;
    const base = Math.max(100, Math.min(190, demo.clientWidth * 0.24));
    const target = intense ? base * 1.75 : base;
    radius += (target - radius) * 0.15;
    dark.style.setProperty('--r', radius + 'px');
  });
  return el;
}

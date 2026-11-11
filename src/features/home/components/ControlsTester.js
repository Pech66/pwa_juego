import { h } from '../../../utils/dom.js';
import { storage } from '../../../services/storage.js';

const GROUPS = [
  { title: 'Moverte', rows: [
    [[['KeyW', 'W'], ['KeyA', 'A'], ['KeyS', 'S'], ['KeyD', 'D']], 'Moverte'],
    [[['mouse', 'Mouse']], 'Mover la cámara'],
    [[['ShiftLeft', 'Shift Izq.']], 'Correr (Mantener)'],
    [[['ControlLeft', 'Ctrl Izq.']], 'Agacharte (Alternar)']
  ] },
  { title: 'Luz', rows: [
    [[['KeyF', 'F']], 'Encender / apagar linterna'],
    [[['mouseRight', 'Clic derecho']], 'Luz intensa (Mantener)']
  ] },
  { title: 'Acciones', rows: [
    [[['KeyE', 'E']], 'Interactuar'],
    [[['mouseLeft', 'Clic izquierdo']], 'Golpe defensivo'],
    [[['Tab', 'Tab']], 'Diario e inventario'],
    [[['Escape', 'Esc']], 'Pausar / cerrar panel']
  ] }
];

/* Tabla de controles que se ilumina al pulsar. Recuerda qué teclas ya probaste. */
export function ControlsTester({ signal }) {
  const el = h(`
    <div>
      <div class="grps">
        ${GROUPS.map((g) => `
        <div class="grp card"><h4>${g.title}</h4>
          ${g.rows.map(([keys, label]) => `<div class="it"><span class="keys">${keys.map(([c, t]) => `<b class="k" data-c="${c}">${t}</b>`).join('')}</span>${label}</div>`).join('')}
        </div>`).join('')}
      </div>
      <p class="tip">Prueba tu teclado: las teclas se iluminan al pulsarlas. <span class="ct-count"></span></p>
    </div>`);

  const map = {};
  el.querySelectorAll('.k').forEach((k) => (map[k.dataset.c] = k));
  const total = Object.keys(map).length;
  const countEl = el.querySelector('.ct-count');
  const tried = new Set();
  let saveTimer;

  const render = () => {
    countEl.textContent = `Has probado ${tried.size} de ${total}.`;
    tried.forEach((c) => map[c]?.classList.add('tried'));
  };
  storage.get('stats').then((s) => { (s.keysTried || []).forEach((c) => map[c] && tried.add(c)); render(); });

  function press(code) {
    const k = map[code];
    if (!k) return;
    k.classList.add('dn');
    if (!tried.has(code)) {
      tried.add(code); render();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => storage.update('stats', (s) => ({ ...s, keysTried: [...tried] })), 400);
    }
  }
  const release = (code) => map[code]?.classList.remove('dn');

  const o = { signal };
  addEventListener('keydown', (e) => press(e.code), o);
  addEventListener('keyup', (e) => release(e.code), o);
  addEventListener('blur', () => Object.values(map).forEach((k) => k.classList.remove('dn')), o);
  let mt;
  addEventListener('mousemove', () => { press('mouse'); clearTimeout(mt); mt = setTimeout(() => release('mouse'), 180); }, o);
  addEventListener('mousedown', (e) => press(e.button === 2 ? 'mouseRight' : e.button === 0 ? 'mouseLeft' : ''), o);
  addEventListener('mouseup', () => { release('mouseRight'); release('mouseLeft'); }, o);
  return el;
}

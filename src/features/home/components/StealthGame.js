import { h, loop } from '../../../utils/dom.js';
import { Button } from '../../../components/Button/Button.js';
import { storage } from '../../../services/storage.js';

/* Mini juego de sigilo (fusión de las dos versiones):
 *  - Coberturas: la criatura solo te ve si no hay un árbol en medio.
 *  - Ruido: correr hace ruido y la criatura gira hacia ti; agachado eres más difícil de ver.
 *  - Guarda en IndexedDB tu récord oculto y cuántas veces te detectó.
 */
const TREES = [{ x: 230, y: 230, r: 30 }, { x: 480, y: 150, r: 26 }, { x: 610, y: 290, r: 34 }, { x: 360, y: 330, r: 24 }];
const CREATURE = { x: 400, y: 40 };

export function StealthGame({ signal }) {
  const el = h(`
    <div class="stealth card">
      <div class="stealth__heading"><span>Zona de práctica / Vista superior</span><div class="stealth__legend"><span>Tú</span><span>Criatura</span><span>Cobertura</span></div></div>
      <canvas width="800" height="400" tabindex="0" aria-label="Zona de sigilo: mueve el explorador azul y escóndete detrás de los árboles"></canvas>
      <div class="stealth__hud">
        <div class="meter"><span>Ruido</span><div class="bar"><i data-n></i></div><b data-nl>Bajo</b></div>
        <div class="meter"><span>Detección</span><div class="bar"><i data-d></i></div><b data-dl>A salvo</b></div>
      </div>
      <div class="stealth__foot"><div class="stealth__btns"></div><p class="stealth__rec" aria-live="off"></p></div>
    </div>`);

  const cv = el.querySelector('canvas'), g = cv.getContext('2d');
  const nBar = el.querySelector('[data-n]'), nLbl = el.querySelector('[data-nl]');
  const dBar = el.querySelector('[data-d]'), dLbl = el.querySelector('[data-dl]');
  const rec = el.querySelector('.stealth__rec');

  let running = false, runHeld = false, crouch = false;
  const runBtn = Button({ label: 'Mantén para correr', variant: 'ghost' });
  const crBtn = Button({ label: 'Agacharte', variant: 'ghost', onClick: () => toggleCrouch() });
  runBtn.style.touchAction = 'none';
  runBtn.addEventListener('pointerdown', () => { runHeld = true; runBtn.classList.add('is-on'); });
  addEventListener('pointerup', () => { runHeld = false; runBtn.classList.remove('is-on'); }, { signal });
  runBtn.addEventListener('pointercancel', () => { runHeld = false; runBtn.classList.remove('is-on'); });
  el.querySelector('.stealth__btns').append(runBtn, crBtn);

  function toggleCrouch() {
    crouch = !crouch;
    crBtn.classList.toggle('is-on', crouch);
    crBtn.setLabel(crouch ? 'Agachado' : 'Agacharte');
  }

  /* Entrada: cursor / dedo y teclado (W A S D, Shift, Ctrl) */
  const pl = { x: 80, y: 340 }, tg = { x: 80, y: 340 };
  const toCanvas = (e) => { const b = cv.getBoundingClientRect(); tg.x = (e.clientX - b.left) * 800 / b.width; tg.y = (e.clientY - b.top) * 400 / b.height; };
  cv.addEventListener('pointermove', toCanvas);
  cv.addEventListener('pointerdown', toCanvas);

  const keys = {};
  const active = () => { const box = cv.getBoundingClientRect(); return cv.offsetParent !== null && box.bottom > 0 && box.top < innerHeight; };
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input,textarea,[contenteditable="true"]') || !active() || e.metaKey || e.altKey) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ControlLeft'].includes(e.code)) e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'ControlLeft' && !e.repeat && active()) toggleCrouch();
  }, { signal });
  addEventListener('keyup', (e) => { keys[e.code] = false; }, { signal });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; runHeld = false; runBtn.classList.remove('is-on'); }, { signal });

  /* Récords guardados */
  let best = 0, timesSeen = 0, streak = 0, savedBest = 0;
  storage.get('stats').then((s) => { best = savedBest = s.bestHidden || 0; timesSeen = s.timesSeen || 0; });
  const save = () => {
    savedBest = Math.max(savedBest, Math.floor(best));
    storage.update('stats', (s) => ({ ...s, timesSeen, bestHidden: Math.max(s.bestHidden || 0, savedBest) }));
  };
  signal.addEventListener('abort', () => { if (Math.floor(best) > savedBest) save(); });

  const blocked = (a, b) => TREES.some((t) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    let u = ((t.x - a.x) * dx + (t.y - a.y) * dy) / (dx * dx + dy * dy);
    u = Math.max(0, Math.min(1, u));
    const px = a.x + u * dx - t.x, py = a.y + u * dy - t.y;
    return px * px + py * py < t.r * t.r;
  });
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  let ang = Math.PI / 2, noise = 30, det = 0, caught = 0, last = 0, lastSave = 0;

  loop(signal, (ts) => {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
    if (!active()) return;

    running = runHeld || keys.ShiftLeft || keys.ShiftRight;

    // Movimiento con teclado
    const mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), my = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
    if (mx || my) {
      const sp = (running ? 7 : crouch ? 2 : 3.8) * dt * 60;
      tg.x = Math.max(10, Math.min(790, tg.x + mx * sp));
      tg.y = Math.max(10, Math.min(390, tg.y + my * sp));
    }
    pl.x += (tg.x - pl.x) * 0.15; pl.y += (tg.y - pl.y) * 0.15;

    // Ruido
    const target = running ? 100 : crouch ? 8 : 35;
    noise += (target - noise) * 0.06;
    const heard = noise > 70;

    // La criatura vigila; si te oye, gira hacia ti
    const toPlayer = Math.atan2(pl.y - CREATURE.y, pl.x - CREATURE.x);
    const sweep = Math.PI / 2 + Math.sin(ts / 1400) * 0.8;
    ang += wrap((heard ? toPlayer : sweep) - ang) * (heard ? 0.08 : 0.2);

    const range = crouch ? 340 : 430;
    const d = Math.hypot(pl.x - CREATURE.x, pl.y - CREATURE.y);
    const inCone = d < range && Math.abs(wrap(toPlayer - ang)) < 0.34;
    const seen = inCone && !blocked(CREATURE, pl);

    const rate = running ? 0.02 : crouch ? 0.008 : 0.012;
    det = Math.max(0, Math.min(1, det + (seen ? rate : -0.01)));
    if (det >= 1) {
      caught = 60; det = 0; timesSeen++;
      best = Math.max(best, streak); streak = 0; save();
    } else {
      streak += dt;
      if (streak > best) best = streak;
      if (best - savedBest >= 5 && ts - lastSave > 3000) { lastSave = ts; save(); }
    }
    if (caught > 0) caught--;

    // Dibujo
    g.clearRect(0, 0, 800, 400);
    const ground = g.createLinearGradient(0, 0, 800, 400);
    ground.addColorStop(0, '#10232a'); ground.addColorStop(1, '#081318');
    g.fillStyle = ground; g.fillRect(0, 0, 800, 400);
    g.strokeStyle = '#93c9c608'; g.lineWidth = 1;
    for (let x = 0; x <= 800; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 400); g.stroke(); }
    for (let y = 0; y <= 400; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(800, y); g.stroke(); }
    g.strokeStyle = '#9cb6a011'; g.lineWidth = 60; g.lineCap = 'round';
    g.beginPath(); g.moveTo(60, 420); g.bezierCurveTo(150, 240, 550, 330, 740, -20); g.stroke();
    g.lineCap = 'butt';
    g.strokeStyle = '#94bbb91c'; g.lineWidth = 1; g.strokeRect(14, 14, 772, 372);
    g.fillStyle = '#91b4b877'; g.font = '10px sans-serif';
    g.fillText('N ↑', 752, 32); g.fillText('BOSQUE / SECTOR 01', 28, 376);
    const grad = g.createRadialGradient(CREATURE.x, CREATURE.y, 10, CREATURE.x, CREATURE.y, range);
    grad.addColorStop(0, seen ? 'rgba(224,75,75,.55)' : 'rgba(224,75,75,.3)');
    grad.addColorStop(1, 'rgba(224,75,75,0)');
    g.fillStyle = grad; g.beginPath(); g.moveTo(CREATURE.x, CREATURE.y); g.arc(CREATURE.x, CREATURE.y, range, ang - 0.34, ang + 0.34); g.fill();

    TREES.forEach((t) => {
      g.fillStyle = '#02090b66'; g.beginPath(); g.ellipse(t.x + 10, t.y + 12, t.r + 6, t.r, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#183b38'; g.strokeStyle = '#4c7771'; g.lineWidth = 1.5;
      g.beginPath();
      for (let n = 0; n < 20; n++) { const a = n * Math.PI / 10; const radius = t.r * (n % 2 ? 0.83 : 1); const x = t.x + Math.cos(a) * radius, y = t.y + Math.sin(a) * radius; n ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#2d5550'; g.beginPath(); g.arc(t.x - 5, t.y - 6, t.r * 0.55, 0, 7); g.fill();
      g.fillStyle = '#72918a'; g.beginPath(); g.arc(t.x, t.y, 4, 0, 7); g.fill();
    });

    g.fillStyle = '#e04b4b'; g.shadowColor = '#e04b4b'; g.shadowBlur = heard ? 34 : 22;
    g.save(); g.translate(CREATURE.x, CREATURE.y); g.rotate(ang - Math.PI / 2);
    g.beginPath(); g.arc(0, -7, 5, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.lineTo(10, 15); g.lineTo(0, 9); g.lineTo(-10, 15); g.closePath(); g.fill();
    g.restore(); g.shadowBlur = 0;

    if (noise > 40) { // ondas de ruido
      g.strokeStyle = `rgba(30,134,224,${(noise - 40) / 150})`; g.lineWidth = 1.5;
      g.beginPath(); g.arc(pl.x, pl.y, 10 + ((ts / 12) % (noise * 0.6)), 0, 7); g.stroke();
    }
    g.strokeStyle = '#9cdbff55'; g.lineWidth = 1; g.beginPath(); g.arc(pl.x, pl.y, crouch ? 11 : 15, 0, 7); g.stroke();
    g.fillStyle = seen ? '#ff7a7a' : '#80ceff';
    g.beginPath(); g.arc(pl.x, pl.y, crouch ? 5 : 7, 0, 7); g.fill();
    g.fillStyle = '#ccedff'; g.beginPath(); g.arc(pl.x - 1, pl.y - 2, 2, 0, 7); g.fill();

    // Indicadores
    nBar.style.width = noise + '%'; nBar.classList.toggle('hi', noise > 65);
    nLbl.textContent = noise < 25 ? 'Bajo' : noise < 65 ? 'Medio' : 'Alto';
    dBar.style.width = det * 100 + '%'; dBar.classList.toggle('hi', seen);
    dLbl.textContent = caught > 0 ? '¡Te vio!' : seen ? 'Visible' : heard ? 'Te ha oído' : inCone ? 'A cubierto' : 'A salvo';
    rec.textContent = `Racha ${Math.floor(streak)} s · Récord ${Math.floor(best)} s · Detectado ${timesSeen} ${timesSeen === 1 ? 'vez' : 'veces'}`;
  });

  return el;
}

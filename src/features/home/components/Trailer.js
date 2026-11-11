import { h, every } from '../../../utils/dom.js';
import { toast } from '../../../components/Toast/Toast.js';

/* Marco del tráiler con línea de escaneo y contador de grabación. */
export function Trailer({ signal }) {
  const el = h(`
    <div class="trl frame" role="button" tabindex="0" aria-label="Reproducir tráiler">
      <img src="/images/coverflow-dark-mutant.jpeg" alt="El explorador busca respuestas en el bosque">
      <i class="trl__scan"></i>
      <span class="trl__tc"><u></u><em>00:00:00</em></span>
      <div class="trl__play"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></div>
      <small class="trl__note">Tráiler en camino…</small>
    </div>`);
  const tc = el.querySelector('em');
  let sec = 0;
  every(signal, 1000, () => {
    sec++;
    tc.textContent = '00:' + String(Math.floor(sec / 60) % 60).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  });
  const play = () => toast('El tráiler todavía está en producción.');
  el.addEventListener('click', play);
  el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), play()));
  return el;
}

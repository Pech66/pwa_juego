import './PcExtras.css';
import { h } from '../../../utils/dom.js';
import { Button } from '../../../components/Button/Button.js';
import { toast } from '../../../components/Toast/Toast.js';
import { Trailer } from './Trailer.js';
import { Gallery } from './Gallery.js';

const REQS = [
  ['i-pc', 'Windows', 'La versión para PC está pensada para el sistema operativo Windows.'],
  ['i-user', 'Un jugador', 'Una experiencia individual: exploras y sobrevives sin compañía.'],
  ['i-book', 'Teclado y mouse', 'Te mueves con W A S D y diriges la cámara con el mouse. No hace falta otro periférico.'],
  ['i-comp', 'Primera persona', 'Ves el bosque con los ojos del protagonista, con la linterna como única guía.']
];

/* Requisitos, estado del desarrollo, tráiler y arte conceptual. */
export function PcExtras(ctx) {
  const el = h(`
    <section class="s" id="pc">
      <h2 class="h rv">Versión PC y extras</h2>
      <p class="lead rv">Información de la versión para PC y una mirada al mundo de LAB OF MUTANT.</p>

      <h3 class="sh pc__h">Requisitos del sistema</h3>
      <div class="reqs">
        ${REQS.map(([i, t, d]) => `<div class="rq card rv"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#${i}"/></svg><h4>${t}</h4><p>${d}</p></div>`).join('')}
      </div>
      <div class="status rv">
        <div><span class="badge">En desarrollo</span><div class="wip"><i></i></div></div>
        <div><h4>¿Y los requisitos técnicos?</h4><p>La versión para PC de LAB OF MUTANT se encuentra en desarrollo, así que aún no se han publicado el procesador, la memoria ni la tarjeta gráfica recomendados.</p></div>
      </div>

      <h3 class="sh pc__h pc__h--far" id="extras">Tráiler</h3>
      <div data-slot="trailer"></div>

      <h3 class="sh pc__h pc__h--far">Arte conceptual</h3>
      <p class="lead" style="margin:0 0 16px">Los diseños de Jereth, Vadrik y el Dr. Cooper, en sus vistas de frente y perfil.</p>
      <div data-slot="gallery"></div>
    </section>`);

  el.querySelector('.status').append(Button({
    label: 'Prueba LAB OF MUTANT', icon: 'i-ext', variant: 'primary', className: 'status__try',
    onClick: () => toast('La versión jugable llegará muy pronto. ¡Mantente atento!')
  }));
  el.querySelector('[data-slot="trailer"]').replaceWith(Trailer(ctx));
  el.querySelector('[data-slot="gallery"]').replaceWith(Gallery(ctx));
  return el;
}

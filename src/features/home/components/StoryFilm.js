import './StoryFilm.css';
import { h } from '../../../utils/dom.js';

export function StoryFilm() {
  return h(`
    <div class="film" aria-label="La historia de Vadrik y Jereth">
      <article class="film__opening rv">
        <img src="/images/portada-dark-mutant.jpeg" alt="Vadrik ilumina el bosque mientras una figura acecha entre los árboles">
        <div class="film__opening-copy">
          <span class="film__eyebrow">01 / EL BOSQUE</span>
          <h3>Una última esperanza.</h3>
          <p>Vadrik D. Sang llega a un centro de investigación aislado en el bosque. Confía en que el tratamiento del Dr. Cooper pueda salvar a su hijo, Jereth.</p>
        </div>
      </article>
      <div class="film__evidence">
        <article class="film__chapter rv">
          <div class="film__artifact film__artifact--file"><img src="/images/reference/expediente.png" alt="Expediente médico del centro de investigación" loading="lazy"></div>
          <div class="film__copy"><span class="film__eyebrow">02 / EL EXPERIMENTO</span><h3>La promesa escondía otra verdad.</h3><p>Cooper ofrece un falso tratamiento y oculta sus verdaderos objetivos. El experimento transforma a Jereth y convierte la búsqueda de una cura en una pesadilla.</p></div>
        </article>
        <article class="film__chapter rv">
          <div class="film__artifact film__artifact--photo"><img src="/images/reference/laboratorio.png" alt="Fotografía de una sala abandonada del laboratorio" loading="lazy"></div>
          <div class="film__copy"><span class="film__eyebrow">03 / LAS PISTAS</span><h3>Cada hallazgo cuenta una parte.</h3><p>Entre notas, archivos médicos, mensajes y fotografías, Vadrik reconstruye lo ocurrido. La criatura recorre las mismas instalaciones: investigar también significa aprender a esconderse.</p></div>
        </article>
      </div>
    </div>`);
}

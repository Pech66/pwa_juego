import './Characters.css';
import { h } from '../../../utils/dom.js';
import { CHARACTER_PROFILES } from './characterProfiles.js';

export function Characters() {
  return h(`
    <section class="s chars" id="personajes">
      <span class="film__eyebrow rv">LOS ROSTROS DE LA HISTORIA</span>
      <h3 class="h rv">Personajes</h3>
      <p class="lead rv">Un padre, un hijo y una promesa que nunca debió hacerse.</p>
      <div class="chars__grid">
        ${CHARACTER_PROFILES.map(({ image, name, role, description }, i) => `
          <article class="character-card rv">
            <img class="character-card__sheet" src="${image}" alt="${name}: diseño de frente y perfil con su nombre vertical" width="778" height="971" loading="lazy">
            <div class="character-card__in"><span class="character-card__number">0${i + 1}</span><h4>${name}</h4><p class="character-card__role">${role}</p><p class="character-card__description">${description}</p></div>
          </article>`).join('')}
      </div>
      <details class="mutant-dossier rv">
        <summary>El resultado del experimento <span>Revelar la identidad de la criatura</span></summary>
        <div class="mutant-dossier__body"><div class="mutant-dossier__art"><img src="/images/reference/jereth-mutante.png" alt="Jereth tras su transformación: vistas de frente y perfil" loading="lazy"></div><div><span class="film__eyebrow">JERETH D. SANG / TRANSFORMADO</span><h4>Un rostro que Vadrik aún busca.</h4><p>La criatura es Jereth, transformado por el experimento del Dr. Cooper. Ahora acecha al jugador por el bosque y las instalaciones. Para sobrevivir y seguir investigando, Vadrik debe aprovechar los escondites del entorno.</p></div></div>
      </details>
    </section>`);
}

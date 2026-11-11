import { h } from '../../../utils/dom.js';
import { CHARACTER_PROFILES } from './characterProfiles.js';

export function Gallery() {
  return h(`<div class="concept-grid">${CHARACTER_PROFILES.map(({ image, name }) => `<figure class="concept-card rv"><img src="${image}" alt="Arte conceptual de ${name}, recortado a sus vistas de frente y perfil" width="778" height="971" loading="lazy"><figcaption>${name}<span>Estudio de personaje · Frente y perfil</span></figcaption></figure>`).join('')}</div>`);
}

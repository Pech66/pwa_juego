import './Button.css';

/**
 * Botón reutilizable.
 * @param {object} o
 * @param {string} o.label     Texto visible
 * @param {'primary'|'light'|'ghost'|'danger'} [o.variant]
 * @param {string} [o.icon]    id de un <symbol> del sprite (p. ej. 'i-rt')
 * @param {'start'|'end'} [o.iconPos]
 * @param {string} [o.href]    Si se indica, se crea un <a>
 * @param {Function} [o.onClick]
 * @param {string} [o.className]
 * @param {string} [o.type]    type del <button> (button | submit)
 */
export function Button({ label, variant = 'primary', icon, iconPos = 'end', href, onClick, className = '', type = 'button' }) {
  const el = document.createElement(href ? 'a' : 'button');
  el.className = `btn btn--${variant} ${className}`.trim();
  if (href) el.href = href; else el.type = type;

  const text = document.createElement('span');
  text.className = 'btn__label';
  text.textContent = label;

  const svg = icon ? `<svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true"><use href="#${icon}"/></svg>` : '';
  el.innerHTML = iconPos === 'start' ? svg : '';
  el.append(text);
  if (iconPos === 'end') el.insertAdjacentHTML('beforeend', svg);

  if (onClick) el.addEventListener('click', onClick);
  el.setLabel = (t) => { text.textContent = t; };
  return el;
}

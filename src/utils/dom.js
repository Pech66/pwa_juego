/* Crea un elemento a partir de un string HTML (un solo nodo raíz). */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* Escapa texto del usuario antes de meterlo en HTML. */
export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* requestAnimationFrame que se detiene solo cuando la vista se desmonta. */
export function loop(signal, fn) {
  const step = (t) => { if (signal.aborted) return; fn(t); requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* setInterval / setTimeout ligados al ciclo de vida de la vista. */
export function every(signal, ms, fn) {
  const id = setInterval(fn, ms);
  signal.addEventListener('abort', () => clearInterval(id));
}
export function later(signal, ms, fn) {
  const id = setTimeout(() => !signal.aborted && fn(), ms);
  signal.addEventListener('abort', () => clearTimeout(id));
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

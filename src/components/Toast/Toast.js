import './Toast.css';
import { Button } from '../Button/Button.js';

let host;

/**
 * Aviso flotante.
 * @param {string} message
 * @param {{ action?: string, onAction?: Function, duration?: number }} [opts]
 */
export function toast(message, { action, onAction, duration = 4000 } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.className = 'toasts';
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  const p = document.createElement('p');
  p.textContent = message;
  el.append(p);

  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); };
  if (action) el.append(Button({ label: action, variant: 'primary', onClick: () => { onAction?.(); close(); } }));
  host.append(el);
  if (duration) setTimeout(close, duration);
  return close;
}

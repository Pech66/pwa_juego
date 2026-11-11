/* Componente raíz: navbar + enrutador por hash + pie.
 *   #/         → HomeView (Inicio, Universo, Guía, PC/extras)
 *   #/perfil   → ProfileView (diario, estadísticas y datos guardados)
 */
import { Navbar } from './components/Navbar/Navbar.js';
import { HomeView } from './features/home/HomeView.js';
import { ProfileView } from './features/profile/ProfileView.js';
import { h } from './utils/dom.js';

export function App(root) {
  const main = h('<main id="view"></main>');
  const footer = h('<footer class="footer"><b>LAB OF MUTANT</b>Funciona sin conexión · tus datos se guardan en este dispositivo</footer>');
  const nav = Navbar({ onNavigate });
  root.append(nav, main, footer);

  let route = null;
  let controller = null;
  let pendingSection = null;

  const currentRoute = () => (location.hash.startsWith('#/perfil') ? 'perfil' : 'home');

  function render() {
    const next = currentRoute();
    if (next === route) return;
    route = next;

    // Desmontar la vista anterior (detiene animaciones y listeners)
    controller?.abort();
    controller = new AbortController();
    const ctx = { signal: controller.signal, setActive: nav.setActive };

    main.replaceChildren(route === 'perfil' ? ProfileView(ctx) : HomeView(ctx));
    nav.setActive(route === 'perfil' ? 'perfil' : 'inicio');
    document.title = route === 'perfil' ? 'Perfil · LAB OF MUTANT' : 'LAB OF MUTANT';

    if (route === 'home' && pendingSection) {
      const id = pendingSection;
      pendingSection = null;
      requestAnimationFrame(() => scrollToSection(id, 'instant'));
    } else {
      scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function scrollToSection(id, behavior = 'smooth') {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'inicio') scrollTo({ top: 0, behavior });
    else el.scrollIntoView({ behavior });
  }

  function onNavigate(id) {
    if (id === 'perfil') { location.hash = '#/perfil'; return; }
    if (route !== 'home') { pendingSection = id; location.hash = '#/'; return; }
    scrollToSection(id);
  }

  addEventListener('hashchange', render);
  render();
}

/* Punto de entrada: estilos globales, App, Service Worker y datos persistentes. */
import './assets/global.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App.js';
import { storage } from './services/storage.js';
import { toast } from './components/Toast/Toast.js';
import { reportServiceWorkerError } from './services/pwa.js';
import { synchronization } from './services/sync.js';

storage.subscribe('blocked', () => toast('Cierra las otras ventanas de LAB OF MUTANT para actualizar tus datos locales.', { duration: 0 }));
void synchronization.start();

// 1. Montar la aplicación
App(document.getElementById('app'));

// 2. Registrar el Service Worker (modo offline + aviso de nueva versión)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onRegisterError() {
      reportServiceWorkerError();
      toast('No se pudo preparar el modo sin conexión. Comprueba tu conexión y vuelve a abrir la app.');
    },
    onNeedRefresh() {
      toast('Hay una nueva versión de LAB OF MUTANT.', {
        action: 'Actualizar',
        onAction: () => updateSW(true),
        duration: 0
      });
    },
    onOfflineReady() {
      toast('Listo: ya puedes usar LAB OF MUTANT sin conexión.');
    }
  });
}

// 3. Datos que se conservan entre visitas (IndexedDB)
storage.update('stats', (s) => ({
  ...s,
  visits: (s.visits || 0) + 1,
  firstVisit: s.firstVisit || Date.now(),
  lastVisit: Date.now()
}));
storage.requestPersistence();

// 4. Avisos de conexión
addEventListener('offline', () => toast('Sin conexión. Tus datos se siguen guardando en este dispositivo.'));
addEventListener('online', () => toast('Conexión recuperada.'));

# LAB OF MUTANT — PWA

Sitio del juego hecho con **Vite + JavaScript (sin framework)**, dividido en componentes y preparado como **PWA**: se instala, abre sin conexión y guarda los datos del usuario en el dispositivo.

## Cómo ejecutarlo

Necesitas Node.js 20 o superior.

> No abras `index.html` haciendo doble clic ni uses `file://`. Esta aplicación
> usa módulos de Vite y debe ejecutarse mediante un servidor local.

```bash
npm install
npm run dev       # desarrollo → http://127.0.0.1:5187
npm run build     # genera la carpeta dist/ con el Service Worker
npm run preview   # versión final → http://127.0.0.1:5188 (modo offline real)
```

El servidor abre automáticamente su dirección. Desarrollo y vista previa usan puertos distintos y fijos para evitar compartir el Service Worker con otros proyectos en localhost:5173. Si el puerto está ocupado, Vite avisa y se detiene. El Service Worker solo se registra en la versión compilada. Los datos guardados en la dirección anterior permanecen allí y no se trasladan a la nueva dirección.

Para probar el modo sin conexión: `npm run build && npm run preview`, abre la página una vez, luego en DevTools → Network marca **Offline** y recarga.

## Instalar la app en tu equipo

Ejecuta desde esta carpeta:

```bash
npm run pwa
```

Este comando compila la app y abre la versión instalable en `http://127.0.0.1:5188`.

1. Abre esa dirección en una ventana normal de Chrome o Edge.
2. Espera a que termine la primera carga y aparezca el aviso de que la app está lista sin conexión.
3. Usa el icono de instalación de la barra de direcciones o la opción de instalar la aplicación en el menú de Chrome o Edge. Confirma el diálogo nativo del navegador.
4. El navegador decide cuándo ofrecer el aviso; puede requerir interacción o tiempo de uso y no lo ofrece si ya está instalada. La página no intercepta el aviso nativo ni muestra botones o secciones de instalación.
5. Abre LAB OF MUTANT desde el menú Inicio de Windows. Se abrirá en su propia ventana.

`npm run dev` sirve para editar y no registra el Service Worker. No lo uses para comprobar el modo sin conexión. La instalación añade esta aplicación web a tu dispositivo; no descarga la versión del videojuego para PC.

Para comprobar el funcionamiento sin conexión, carga la versión instalable una vez, espera a que esté preparada y después desconecta la red o activa **Offline** en DevTools. Recarga el inicio, abre el Perfil y revisa las imágenes y el diario. El Service Worker conserva los archivos de la aplicación, incluidos JPEG y WebP; los datos personales se conservan por separado en IndexedDB. Las tipografías externas se guardan cuando se han descargado; si no están disponibles, se usan las fuentes de respaldo.

Para instalarla desde otros equipos o móviles, publica el contenido de `dist/` en la raíz de un sitio con **HTTPS**. La dirección `127.0.0.1` solo funciona en el equipo que está ejecutando el servidor. Mantén una dirección estable para las futuras actualizaciones. En iPhone o iPad, usa Safari → Compartir → Añadir a la pantalla de inicio.

El navegador controla la instalación y sus avisos; la app no puede instalarse sin la confirmación del usuario. Referencia: [criterios de instalación](https://web.dev/articles/install-criteria).

## Estructura

```
mi-pwa-componentes/
├── public/
│   ├── manifest.json            Nombre, colores, iconos y atajo al perfil
│   ├── favicon.ico
│   └── icons/                   icon-192x192.png, icon-512x512.png, apple-touch-icon.png
├── src/
│   ├── main.js                  Arranque: monta App, registra el Service Worker, cuenta visitas
│   ├── App.js                   Navbar + rutas (#/ inicio, #/perfil) + pie
│   ├── components/              Reutilizables
│   │   ├── Button/              Button.js + Button.css (variantes primary, light, ghost, danger, icon)
│   │   ├── Navbar/              Navbar.js + Navbar.css (píldora animada + aviso "Sin conexión")
│   │   └── Toast/               Avisos flotantes (actualizar, offline, etc.)
│   ├── features/
│   │   ├── home/
│   │   │   ├── HomeView.js      Une las secciones y controla el scroll
│   │   │   └── components/      Hero, StoryFilm, Characters, Guide (ControlsTester,
│   │   │                        StealthGame, Flashlight), PcExtras (Trailer, Gallery)
│   │   └── profile/
│   │       ├── ProfileView.js   Nombre del explorador
│   │       ├── Profile.css
│   │       └── components/      StatsPanel, Journal (diario), DataPanel
│   ├── services/
│   │   ├── storage.js           ★ IndexedDB: guarda y lee los datos
│   │   └── pwa.js               Instalación y estado de conexión
│   ├── service-worker/sw.js     ★ Caché offline (Workbox)
│   ├── utils/dom.js             Ayudas: crear elementos, bucles que se limpian solos
│   └── assets/global.css        Variables, base y estilos compartidos
├── index.html                   Enlaza manifest.json e iconos
├── package.json
└── vite.config.js               Vite + vite-plugin-pwa (estrategia injectManifest)
```

## Cómo se conserva la información

Hay dos capas, y cada una guarda algo distinto:

| Qué se guarda | Dónde | Archivo |
|---|---|---|
| La app en sí (HTML, JS, CSS, iconos, fuentes) | Cache Storage | `src/service-worker/sw.js` |
| Los datos del usuario | IndexedDB, base `lab-of-mutant` | `src/services/storage.js` |
| Borrador del diario sin guardar | localStorage | `features/profile/components/Journal.js` |

Datos que se guardan en IndexedDB:

- **prefs** → linterna encendida/apagada, pestaña abierta de la guía
- **stats** → visitas, primera visita, récord oculto en el juego de sigilo, veces detectado, teclas probadas
- **profile** → nombre del explorador
- **notes** → entradas del diario

Además, `storage.requestPersistence()` pide al navegador que no borre esos datos cuando falte espacio, y desde el Perfil se pueden **exportar** (JSON) o **borrar**.

Para guardar algo nuevo desde cualquier componente:

```js
import { storage } from '../services/storage.js';

const prefs = await storage.get('prefs');
await storage.update('prefs', (p) => ({ ...p, volumen: 0.8 }));
storage.subscribe('prefs', (nuevo) => console.log(nuevo));
```

`storage.js` guarda los cambios y su cola de envío en IndexedDB. `sync.js` reintenta desde la app y `sync-core.js` comparte el envío confirmado con el Service Worker. La API de C# recibe los cambios en un proyecto independiente.

## Qué se tomó de cada versión

- **Portada, navegación, controles, linterna y tráiler**: iguales en ambas.
- **Historia**: la versión cinematográfica fija con 3 escenas (archivo 1).
- **Personajes**: la ficha con datos del Padre (archivo 1).
- **Sigilo**: fusión de las dos — el mapa con coberturas (archivo 1) + el medidor de ruido y los botones correr/agacharse (archivo 2). Correr hace que la criatura gire hacia ti; agachado te ve desde menos distancia.
- **Requisitos y arte conceptual**: tarjetas y galería con miniaturas (archivo 1).
- **Nuevo**: página de Perfil con diario, estadísticas y gestión de datos; aviso sin conexión; botón de instalar; aviso de actualización.

## Sincronización con la API de C#

La solución independiente LABOFMUTANTAPI recibe los cambios del perfil, diario, preferencias y progreso. Primero inicia esa solución en Visual Studio (F5, http://localhost:5000) y después ejecuta npm run pwa en esta carpeta.

El servidor de Vite reenvía /api al receptor en C#. Puedes cambiar su destino con la variable SYNC_API_TARGET. Para una API publicada en otro origen, define VITE_SYNC_API_URL antes de compilar y configura CORS en la API. En producción, tanto la aplicación como el receptor deben estar publicados mediante HTTPS; una publicación estática por sí sola no ejecuta la API.

Los datos se guardan localmente junto con una cola persistente en IndexedDB. Se conserva la información anterior al actualizar la base de datos. Solo se retiran operaciones de la cola después de recibir la confirmación de sus secuencias. Se reintenta al volver la red, abrir o enfocar la app y cada 30 segundos mientras permanece visible. Los navegadores con Background Sync también pueden reintentar con la ventana cerrada, según su programación; si el navegador está cerrado completamente o no ofrece esa función, vuelve a abrir la app.

Puedes comprobarlo: apaga la API, guarda una nota y revisa que aparezca como pendiente en Perfil > Datos y aplicación. Recarga la PWA sin red: la nota y su pendiente deben continuar. Inicia otra vez la API y recupera la red: el pendiente desaparecerá después de que la API lo confirme en la base LABOFMUTANT_PWA de SQL Server. El borrado de una nota y el borrado de todos los datos también se envían.

Esta implementación envía los cambios de este dispositivo al receptor; no incorpora inicio de sesión ni recuperación del perfil en otro dispositivo. El identificador secreto del receptor se guarda localmente y no debe compartirse.

## Base de datos SQL Server

La API del proyecto LABOFMUTANTAPI usa Entity Framework Core con la base LABOFMUTANT_PWA en localhost\SQLEXPRESS. El primer arranque desde Visual Studio aplica la migración y crea las tablas Dispositivos, Perfiles, Preferencias, Progresos y NotasDiario. Al actualizar la PWA se encola una copia inicial de los datos locales existentes para poblar el nuevo receptor SQL sin borrar lo que hay en la laptop. La base y el proyecto WebApiProMajoOrigina no se modifican.

## Revisión de entrega

Consulta ENTREGA.md para el estado de los siete requisitos, la sección de Evento, el consumo visible de la API y los pasos de publicación HTTPS.

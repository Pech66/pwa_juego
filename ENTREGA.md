# Revisión de entrega

1. **PWA funcional:** Vite y JavaScript, manifest standalone, iconos 192/512, Service Worker de producción y archivos precargados. La instalación se ofrece desde el navegador. La prueba local no acredita por sí sola una instalación en una URL pública.
2. **Contenido:** historia, personajes, guía, mecánicas y arte del videojuego. Se añadió Evento: 20 de noviembre de 2026, Edificio B, Carretera Cancún-Aeropuerto, S.M. 299, Km. 11.5, 77565, Quintana Roo. Horario confirmado: **9:00 a. m. a 7:00 p. m.**
3. **Navegación e interacción:** menú propio con acceso a Evento y Perfil, selección de personajes, controles interactivos, linterna, sigilo, nombre, notas, estadísticas y exportación.
4. **Consumo visible de API:** Evento consulta `GET /api/evento` y muestra los datos recibidos. Indica expresamente si utiliza el respaldo local en lugar de la API. Permite actualizar la consulta. La sincronización usa `POST /api/sync` y confirma secuencias antes de retirar pendientes.
5. **Servicios:** API REST ASP.NET Core, SQL Server mediante EF Core y almacenamiento local IndexedDB.
6. **Datos dinámicos:** perfil, notas, estadísticas y cola persistente; el evento se consulta al backend y conserva una copia local para funcionar sin conexión.
7. **Despliegue:** **pendiente una URL pública HTTPS y su comprobación real.** Se preparó la API para servir el front desde `wwwroot`, conservando `/api` en el mismo origen. No se ha publicado en Internet.

## Preparar una entrega con el mismo origen

Desde el front:

```
npm run preparar:entrega -- "C:/Users/pechm/source/repos/LABOFMUNTANTAPI"
```

Después, desde la API:

```
dotnet publish -c Release -o ./publish
```

Publicar esa salida en un alojamiento compatible con ASP.NET Core y SQL Server (por ejemplo IIS con el módulo de hosting), configurar certificado HTTPS y `ASPNETCORE_ENVIRONMENT=Production`. Configurar `ConnectionStrings__DefaultConnection` en el alojamiento; la conexión de Windows de desarrollo no funcionará automáticamente en otro servidor. No publicar únicamente el front esperando que el proxy de Vite exista en producción.

El script copia sin borrar archivos del servidor. Si se regenera una entrega varias veces, conservará paquetes antiguos; preparar la publicación en una carpeta limpia del alojamiento, preservando la base de datos.

Los datos del evento se configuran en `Evento` de appsettings.json. `public/evento.json` es el respaldo offline; mantenerlo actualizado con los mismos datos. No incluir credenciales en esa copia pública.

## Comprobación final en la URL real

- Abrir en móvil y escritorio; navegar a todas las secciones.
- Consultar Evento y comprobar «Información actualizada desde la API».
- Guardar nombre y nota; comprobar que SQL Server los recibió.
- Instalar con el navegador, abrir la ventana independiente y recargar sin red.
- Crear una nota sin red, recuperar conexión y comprobar la confirmación de envío.
- Probar actualización del Service Worker sin perder notas.

## Limpieza

Se retiró `src/components/Scene/scene.js`, un generador SVG sin importaciones en el código actual. Se quitaron sus reglas de animación exclusivas y su referencia obsoleta en README. Se conservan las migraciones y entidades de SQL Server para no borrar tablas ni datos; tampoco se retiran endpoints solo por no aparecer en el front, porque pueden tener otros consumidores.


## Resultados de esta revisión

Compilación Vite y Service Worker correctos. Compilación .NET correcta. Prueba de producción en 320, 390 y 1280 píxeles: consulta real del evento, navegación, control del Service Worker, recarga sin conexión, diario persistente y sincronización real de perfil y nota con SQL Server. Se limpiaron los datos del dispositivo de prueba. Falta publicar y verificar la URL pública HTTPS.

El navegador Chromium/Brave en un perfil normal no informó errores de instalabilidad en la versión local de producción. La instalación y el acceso desde la URL pública siguen pendientes de comprobar tras el despliegue.

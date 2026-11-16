# Cómo tener "Mis Finanzas" en tu iPhone

## A. Publicarla gratis en GitHub Pages (una sola vez, ~10 min, desde la PC)

1. Entra a https://github.com/signup y crea tu cuenta (gratis).
2. Arriba a la derecha: **＋ → New repository**.
   - Repository name: `finanzas` (o el que quieras).
   - Marca **Public** (GitHub Pages gratis lo pide). Nadie verá tus datos: el código no tiene tus movimientos, que se guardan solo en tu iPhone. Lo único visible son los montos iniciales del plan que vienen en `app.js`.
   - Clic en **Create repository**.
3. En la página del repo vacío, clic en **uploading an existing file**.
4. Abre la carpeta `mis-finanzas` en el Explorador, selecciona **todo su contenido** (index.html, app.js, styles.css, sw.js, manifest.json y la carpeta `icons`) y arrástralo a la página. Clic en **Commit changes**.
5. Ve a **Settings → Pages**. En *Branch* elige `main` y carpeta `/ (root)`, y luego **Save**.
6. Espera 1–2 minutos y recarga. Aparecerá tu link: `https://TU-USUARIO.github.io/finanzas/`.

## B. Instalarla en el iPhone 15 Pro Max

1. Abre ese link en **Safari** (no en Chrome).
2. Toca **Compartir** (el cuadrado con flecha) → **Agregar a pantalla de inicio** → **Agregar**.
3. Ábrela siempre desde el ícono **S/**: se ve a pantalla completa y funciona sin internet.
4. Consejo de fácil acceso: arrastra el ícono al **Dock** (la fila de abajo) para tenerla siempre a un toque.

## C. Respaldos (importante)

- Los datos viven solo en el iPhone, dentro de la app instalada (aparte de Safari).
- Una vez por semana: **Más → Ajustes → Exportar JSON → Guardar en Archivos** (iCloud Drive).
- Para restaurar: **Importar** y elegir ese archivo.
- Si borras el ícono de la pantalla de inicio, se borran sus datos. Exporta antes.

## D. Actualizar la app (si te paso una versión nueva)

En GitHub: **Add file → Upload files**, arrastra los archivos nuevos y luego **Commit**.
En el iPhone, abre la app dos veces: la primera descarga la versión nueva y la segunda la muestra. Tus datos no se tocan.

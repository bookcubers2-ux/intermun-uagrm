/* ====================================================================
   InterMUN UAGRM | Service Worker
   --------------------------------------------------------------------
   Guarda la aplicacion en el dispositivo para que abra aunque el wifi
   del campus este caido, y para que se pueda instalar como aplicacion.

   Las consultas a la base de datos NUNCA se guardan: el control de
   comidas siempre tiene que trabajar con datos frescos.
   ==================================================================== */

var CACHE = 'intermun-v7-interbot-abierto';

var ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/estilos.css',
  './fuentes/atkinson-400.woff2',
  './fuentes/atkinson-400-ext.woff2',
  './fuentes/atkinson-700.woff2',
  './fuentes/atkinson-700-ext.woff2',
  './fuentes/archivo-black.woff2',
  './img/icono-192.png',
  './img/icono-512.png',
  './img/icono-maskable-512.png',
  './img/logo-240.png',
  './img/logo-480.png',
  './js/config.js',
  './js/contenido.js',
  './js/middleware.js',
  './js/a11y.js',
  './js/voz.js',
  './js/instalar.js',
  './js/ui.js',
  './js/db.js',
  './js/app.js',
  './js/vistas-publicas.js',
  './js/vistas-admin.js',
  './js/identidad.js',
  './js/interbot.js',
  './js/chat.js',
  './js/vendor/supabase.min.js',
  './js/vendor/qrcode-generator.js',
  './js/vendor/html5-qrcode.min.js'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ARCHIVOS.map(function (a) {
        return c.add(a).catch(function () { /* si uno falla, no rompe la instalacion */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (llaves) {
      return Promise.all(llaves.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* Nunca guardar la base de datos ni la autenticacion. */
  if (url.hostname.indexOf('supabase') >= 0) return;

  /* Solo se maneja lo que vive en este mismo dominio. */
  if (url.origin !== location.origin) return;

  /* Estrategia "red primero": con internet, siempre se sirve la version
     mas nueva del sitio (asi las actualizaciones aparecen a la primera
     recarga, sin esperar a que el cache se renueve). Sin internet, se
     sirve lo guardado. Las fuentes e imagenes, que no cambian, van
     "cache primero" para que la pagina cargue al instante. */
  var esEstatico = /\.(woff2|png|jpg|jpeg|svg|ico)$/i.test(url.pathname);

  if (esEstatico) {
    ev.respondWith(
      caches.match(req).then(function (guardado) {
        return guardado || fetch(req).then(function (resp) {
          if (resp && resp.status === 200 && resp.type === 'basic') {
            var copia = resp.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copia); });
          }
          return resp;
        });
      })
    );
    return;
  }

  ev.respondWith(
    fetch(req).then(function (resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(req).then(function (guardado) {
        return guardado || caches.match('./index.html');
      });
    })
  );
});

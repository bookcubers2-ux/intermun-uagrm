/* ==============================================================
   InterMUN UAGRM - Service Worker
   --------------------------------------------------------------
   Guarda el sitio en el telefono para que abra aunque el wifi
   del campus este caido. Las consultas a la base de datos NUNCA
   se guardan en cache: siempre tienen que ser datos frescos.
   ============================================================== */

var CACHE = 'intermun-v1';

var ARCHIVOS = [
  './',
  './index.html',
  './css/estilos.css',
  './js/config.js',
  './js/contenido.js',
  './js/ui.js',
  './js/db.js',
  './js/app.js',
  './js/vistas-publicas.js',
  './js/vistas-admin.js',
  './js/vendor/supabase.min.js',
  './js/vendor/qrcode-generator.js',
  './js/vendor/html5-qrcode.min.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ARCHIVOS.map(function (a) {
        return c.add(a).catch(function () { /* si uno falla no rompe la instalacion */ });
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

  var url = new URL(req.url);

  /* Nunca cachear la base de datos ni la autenticacion */
  if (url.hostname.indexOf('supabase') >= 0) return;

  /* Solo manejamos lo que vive en nuestro propio dominio */
  if (url.origin !== location.origin) return;

  ev.respondWith(
    caches.match(req).then(function (guardado) {
      var red = fetch(req).then(function (resp) {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copia = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return resp;
      }).catch(function () {
        return guardado || caches.match('./index.html');
      });

      /* Devuelve lo guardado al instante y actualiza por detras */
      return guardado || red;
    })
  );
});

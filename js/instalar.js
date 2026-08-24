/* ====================================================================
   InterMUN UAGRM | Instalacion como aplicacion en el telefono (PWA)
   --------------------------------------------------------------------
   Seccion fija, nunca una ventana emergente: las ventanas que aparecen
   solas desorientan a quien usa lector de pantalla e incomodan a
   personas neurodivergentes.

   - Android, Chrome y Edge: un solo boton dispara la instalacion nativa.
   - iPhone y iPad: Apple no permite instalar con un boton, asi que se
     explican los cuatro pasos exactos.
   - Ya instalada: la seccion lo confirma y no ofrece nada mas.
   ==================================================================== */

window.INSTALAR = (function () {
  'use strict';

  var eventoInstalacion = null;

  function esIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function yaInstalada() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  function navegador() {
    var ua = navigator.userAgent;
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/Firefox/i.test(ua)) return 'firefox';
    if (/OPR|Opera/i.test(ua)) return 'opera';
    if (/Edg/i.test(ua)) return 'edge';
    if (/Chrome/i.test(ua)) return 'chrome';
    return 'otro';
  }

  function pasosManuales() {
    switch (navegador()) {
      case 'samsung':
        return 'En el navegador de Samsung: toca el menú de las tres líneas, abajo a la derecha, elige "Añadir página a" y luego "Pantalla de inicio".';
      case 'firefox':
        return 'En Firefox: toca el menú de los tres puntos y elige "Instalar" o "Añadir a pantalla de inicio".';
      case 'opera':
        return 'En Opera: toca el menú y elige "Añadir a" y luego "Pantalla de inicio".';
      default:
        return 'Toca el menú de los tres puntos de tu navegador y elige "Instalar aplicación" o "Añadir a pantalla de inicio".';
    }
  }

  function decir(texto) {
    var e = document.getElementById('estado-instalar');
    if (e) e.textContent = texto;
    if (window.A11Y) window.A11Y.anunciar(texto);
  }

  function lanzar() {
    var boton = document.getElementById('btn-instalar');
    eventoInstalacion.prompt();
    eventoInstalacion.userChoice.then(function (r) {
      if (r.outcome === 'accepted') {
        decir('Instalando InterMUN. En unos segundos aparecerá junto a tus aplicaciones.');
        if (boton) boton.hidden = true;
      } else {
        decir('Instalación cancelada. Puedes instalarla cuando quieras con este mismo botón.');
      }
      eventoInstalacion = null;
    });
  }

  function intentar() {
    if (eventoInstalacion) { lanzar(); return; }
    /* El aviso del navegador puede tardar: Chrome lo emite recien cuando
       termina de verificar el manifiesto y el service worker. */
    decir('Preparando la instalación, un momento por favor.');
    var intentos = 0;
    var reloj = setInterval(function () {
      intentos++;
      if (eventoInstalacion) { clearInterval(reloj); lanzar(); }
      else if (intentos >= 12) {
        clearInterval(reloj);
        decir('Tu navegador no permite instalar con un botón. ' + pasosManuales() +
              ' Se hace una sola vez: después InterMUN queda como una aplicación más.');
      }
    }, 500);
  }

  function construir() {
    var hueco = document.getElementById('seccion-instalar');
    if (!hueco) return;

    var html = '<h2 id="titulo-instalar">Lleva InterMUN en tu teléfono</h2>';

    if (yaInstalada()) {
      html += '<p>InterMUN ya está instalada en este dispositivo. Las reglas, el glosario y la guía ' +
              'funcionan aunque te quedes sin internet.</p>';
    } else if (esIos()) {
      html += '<p>InterMUN se instala desde el navegador, sin tienda de aplicaciones y sin ocupar casi espacio. ' +
              'Una vez instalada, el contenido funciona sin internet.</p>' +
              '<p><strong>Para instalarla en tu iPhone o iPad</strong>, Apple no permite hacerlo con un solo botón:</p>' +
              '<ol>' +
                '<li>Abre esta página en Safari.</li>' +
                '<li>Toca el botón Compartir, el cuadrado con una flecha hacia arriba.</li>' +
                '<li>Desliza y toca "Añadir a pantalla de inicio".</li>' +
                '<li>Toca "Añadir". Listo: InterMUN queda como una aplicación más.</li>' +
              '</ol>';
    } else {
      html += '<p>InterMUN se instala con un solo botón, sin tienda de aplicaciones y sin ocupar casi espacio. ' +
              'Una vez instalada, las reglas, el glosario y la guía funcionan sin internet.</p>' +
              '<button type="button" class="btn" id="btn-instalar">Instalar InterMUN como aplicación</button>';
    }

    html += '<p id="estado-instalar" role="status" aria-live="polite"></p>';

    hueco.innerHTML = html;
    hueco.setAttribute('aria-labelledby', 'titulo-instalar');

    var b = document.getElementById('btn-instalar');
    if (b) b.addEventListener('click', intentar);
  }

  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();          /* nunca una ventana emergente automatica */
    eventoInstalacion = ev;
  });

  window.addEventListener('appinstalled', function () {
    decir('InterMUN quedó instalada en este dispositivo.');
    var b = document.getElementById('btn-instalar');
    if (b) b.hidden = true;
  });

  return { construir: construir, yaInstalada: yaInstalada };
})();

/* ====================================================================
   InterMUN UAGRM | Nucleo de accesibilidad
   --------------------------------------------------------------------
   - Barra de herramientas presente en toda la aplicacion:
     tamano de letra, espaciado, contraste y lectura en voz alta.
   - Perfiles sensoriales: la persona elige una vez y todo se adapta.
   - Preferencias guardadas en el dispositivo y aplicadas antes del
     primer pintado (el HTML las aplica en linea para evitar destellos).
   - Gestion del foco al cambiar de vista, que es el punto donde casi
     todas las aplicaciones de una sola pagina fallan con lector de
     pantalla: la persona toca un modulo y el lector la devuelve al
     principio del documento en lugar de llevarla al contenido.
   ==================================================================== */

window.A11Y = (function () {
  'use strict';

  var CLAVE = 'intermun_accesibilidad';

  var porDefecto = {
    escala: 1,          // multiplicador del tamano de letra (1 = 20px)
    espaciado: false,   // espaciado amplio entre letras, palabras y lineas
    tema: 'claro',      // 'claro' u 'oscuro'
    perfil: ''          // '', 'ceguera', 'bajavision', 'neurodivergente'
  };

  function leer() {
    try {
      var g = JSON.parse(localStorage.getItem(CLAVE) || '{}');
      var r = {};
      Object.keys(porDefecto).forEach(function (k) {
        r[k] = (g[k] === undefined) ? porDefecto[k] : g[k];
      });
      return r;
    } catch (e) { return JSON.parse(JSON.stringify(porDefecto)); }
  }

  function guardar(p) {
    try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) {}
  }

  function aplicar(p) {
    var h = document.documentElement;
    h.style.setProperty('--escala-texto', p.escala);
    h.setAttribute('data-tema', p.tema);
    h.setAttribute('data-espaciado', p.espaciado ? 'amplio' : 'normal');
    h.setAttribute('data-perfil', p.perfil || 'ninguno');
  }

  var prefs = leer();
  aplicar(prefs);

  function cambiar(cambios) {
    prefs = leer();
    Object.keys(cambios).forEach(function (k) { prefs[k] = cambios[k]; });
    guardar(prefs);
    aplicar(prefs);
    refrescarBarra();
  }

  /* Aplica un perfil sensorial completo con un solo gesto. */
  function aplicarPerfil(nombre) {
    if (nombre === 'ceguera') {
      cambiar({ perfil: 'ceguera', escala: 1, espaciado: false, tema: 'claro' });
      anunciar('Perfil para lector de pantalla activado. Se simplificaron los adornos visuales.');
    } else if (nombre === 'bajavision') {
      cambiar({ perfil: 'bajavision', escala: 1.5, espaciado: true, tema: 'oscuro' });
      anunciar('Perfil de baja vision activado. Letra mas grande, espaciado amplio y alto contraste.');
    } else if (nombre === 'neurodivergente') {
      cambiar({ perfil: 'neurodivergente', escala: 1.15, espaciado: true, tema: 'claro' });
      anunciar('Perfil de lectura tranquila activado. Mas espacio entre los elementos.');
    } else {
      cambiar({ perfil: '', escala: 1, espaciado: false, tema: 'claro' });
      anunciar('Preferencias restablecidas.');
    }
  }


  /* ================================================================
     ANUNCIOS PARA LECTOR DE PANTALLA
     Regla de oro: si algo pasa en pantalla y no se anuncia, para una
     persona ciega no paso.
     ================================================================ */
  function anunciar(texto, urgente) {
    var id = urgente ? 'anuncio-alerta' : 'anuncio-vivo';
    var region = document.getElementById(id);
    if (!region) return;
    /* Se limpia primero para que el lector vuelva a anunciar aunque el
       texto sea idéntico al anterior. */
    region.textContent = '';
    window.setTimeout(function () { region.textContent = texto; }, 60);
  }


  /* ================================================================
     FOCO AL CAMBIAR DE VISTA
     ================================================================ */
  function enfocarTitulo() {
    var main = document.getElementById('contenido');
    if (!main) return;
    var destino = main.querySelector('h1') || main;
    if (!destino.hasAttribute('tabindex')) destino.setAttribute('tabindex', '-1');
    try { destino.focus({ preventScroll: false }); } catch (e) { destino.focus(); }
  }

  /* Llamar cada vez que el enrutador termina de pintar una vista. */
  function vistaCambiada(nombreVista, primeraCarga) {
    marcarNavActual();
    reflejarAltComoTitulo();
    if (primeraCarga) {
      /* Llegada externa (por ejemplo, escaneando un QR): se respeta el
         orden completo del documento para que la persona se oriente. */
      return;
    }
    enfocarTitulo();
    if (nombreVista) anunciar(nombreVista + '. Contenido cargado.');
  }

  function marcarNavActual() {
    var actual = (location.hash || '#/').split('/')[1] || '';
    var nav = document.getElementById('navegacion');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(function (a) {
      var destino = (a.getAttribute('href') || '').split('/')[1] || '';
      if (destino === actual) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* El texto alternativo tambien como tooltip: ayuda a baja vision. */
  function reflejarAltComoTitulo() {
    document.querySelectorAll('img[alt]').forEach(function (img) {
      if (!img.title && img.alt) img.title = img.alt;
    });
  }


  /* ================================================================
     BARRA DE ACCESIBILIDAD
     ================================================================ */
  function construirBarra() {
    var hueco = document.getElementById('barra-accesibilidad');
    if (!hueco) return;

    /* El landmark y su nombre ya los aporta la seccion contenedora,
       asi que aqui no se repite el rol para no anunciarlo dos veces. */
    hueco.innerHTML =
      '<div class="barra-a11y">' +
        '<button type="button" id="a11y-menos">Letra mas chica</button>' +
        '<button type="button" id="a11y-mas">Letra mas grande</button>' +
        '<button type="button" id="a11y-espaciado" aria-pressed="false">Espaciado amplio</button>' +
        '<button type="button" id="a11y-tema" aria-pressed="false">Alto contraste</button>' +
        '<button type="button" id="a11y-leer">Leer esta pagina</button>' +
        '<button type="button" id="a11y-parar" hidden>Detener la lectura</button>' +
        '<a class="enlace-barra" href="#/accesibilidad">Mi perfil de accesibilidad</a>' +
      '</div>';

    document.getElementById('a11y-menos').addEventListener('click', function () {
      var n = Math.max(0.8, Math.round((leer().escala - 0.1) * 10) / 10);
      cambiar({ escala: n });
      anunciar('Tamano de letra: ' + Math.round(n * 100) + ' por ciento.');
    });

    document.getElementById('a11y-mas').addEventListener('click', function () {
      var n = Math.min(2.2, Math.round((leer().escala + 0.1) * 10) / 10);
      cambiar({ escala: n });
      anunciar('Tamano de letra: ' + Math.round(n * 100) + ' por ciento.');
    });

    document.getElementById('a11y-espaciado').addEventListener('click', function () {
      var v = !leer().espaciado;
      cambiar({ espaciado: v });
      anunciar(v ? 'Espaciado amplio activado.' : 'Espaciado normal.');
    });

    document.getElementById('a11y-tema').addEventListener('click', function () {
      var v = leer().tema === 'oscuro' ? 'claro' : 'oscuro';
      cambiar({ tema: v });
      anunciar(v === 'oscuro' ? 'Alto contraste activado, fondo oscuro.' : 'Contraste normal, fondo claro.');
    });

    document.getElementById('a11y-leer').addEventListener('click', function () {
      if (!window.VOZ) { anunciar('La lectura en voz alta no esta disponible en este navegador.'); return; }
      window.VOZ.leerPagina();
    });

    document.getElementById('a11y-parar').addEventListener('click', function () {
      if (window.VOZ) window.VOZ.detener();
    });

    document.addEventListener('intermun:voz-inicio', function () {
      document.getElementById('a11y-leer').hidden = true;
      document.getElementById('a11y-parar').hidden = false;
    });
    document.addEventListener('intermun:voz-fin', function () {
      document.getElementById('a11y-leer').hidden = false;
      document.getElementById('a11y-parar').hidden = true;
    });

    refrescarBarra();
  }

  function refrescarBarra() {
    var p = leer();
    var e = document.getElementById('a11y-espaciado');
    var t = document.getElementById('a11y-tema');
    if (e) e.setAttribute('aria-pressed', p.espaciado ? 'true' : 'false');
    if (t) t.setAttribute('aria-pressed', p.tema === 'oscuro' ? 'true' : 'false');
  }


  /* ================================================================
     BOTON DE SALIDA RAPIDA AL FINAL DE LA PAGINA
     Evita tener que retroceder gesto por gesto desde el final de una
     pagina larga con lector de pantalla.
     ================================================================ */
  function construirVolverArriba() {
    var pie = document.getElementById('pie');
    if (!pie || document.getElementById('btn-volver-arriba')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'btn-volver-arriba';
    b.textContent = 'Volver al inicio de la pagina';
    b.addEventListener('click', function () {
      window.scrollTo(0, 0);
      var primero = document.getElementById('a11y-menos') ||
                    document.querySelector('.saltar');
      if (primero) primero.focus();
      anunciar('Volviste al inicio de la pagina.');
    });
    pie.appendChild(b);
  }


  /* ================================================================
     ATAJOS DE TECLADO
     Siempre con Alt para no pisar los atajos del lector de pantalla.
     ================================================================ */
  var ATAJOS = {
    '1': '#/',
    '2': '#/reglas',
    '3': '#/guia',
    '4': '#/buscar',
    '5': '#/staff',
    '9': '#/accesibilidad'
  };

  function activarAtajos() {
    document.addEventListener('keydown', function (e) {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      if (ATAJOS[e.key]) { e.preventDefault(); location.hash = ATAJOS[e.key]; return; }
      if (e.key === '0') {
        e.preventDefault();
        var b = document.getElementById('a11y-leer');
        if (b && !b.hidden) b.click();
      }
    });
  }


  /* ================================================================
     Arranque
     ================================================================ */
  function iniciar() {
    construirBarra();
    construirVolverArriba();
    activarAtajos();
    reflejarAltComoTitulo();
  }

  return {
    preferencias: leer,
    cambiar: cambiar,
    aplicarPerfil: aplicarPerfil,
    anunciar: anunciar,
    enfocarTitulo: enfocarTitulo,
    vistaCambiada: vistaCambiada,
    iniciar: iniciar,
    ATAJOS: ATAJOS
  };
})();

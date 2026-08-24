/* ====================================================================
   InterMUN UAGRM | Nucleo de la aplicacion
   Ruteo, navegacion y arranque.

   En una aplicacion de una sola pagina, el cambio de vista no recarga
   el documento, asi que el lector de pantalla no se entera de nada por
   si solo. Aqui se resuelve de dos formas complementarias:
     1. El foco se mueve al titulo de la vista nueva.
     2. El cambio se anuncia en una region aria-live.
   ==================================================================== */

window.APP = (function () {
  'use strict';

  var usuario = null;
  var canalVivo = null;
  var primeraCarga = true;

  /* Cada ruta declara su nombre hablado, que es lo que escucha la
     persona al llegar, y si exige sesion de staff. */
  var RUTAS = {
    '':              { nav: 'Inicio',           titulo: 'Inicio',                      ver: function () { VISTAS.inicio(); } },
    'reglas':        { nav: 'Reglas',           titulo: 'Reglas de procedimiento',     ver: function () { VISTAS.reglas(); } },
    'guia':          { nav: 'Guía',             titulo: 'Guía del delegado',           ver: function () { VISTAS.guia(); } },
    'comites':       { nav: 'Comités',          titulo: 'Los comités',                 ver: function () { VISTAS.comites(); } },
    'datos':         { nav: 'Curiosidades',     titulo: 'Curiosidades',                ver: function () { VISTAS.curiosidades(); } },
    'buscar':        { nav: 'Mi credencial',    titulo: 'Mi credencial',               ver: function () { VISTAS.buscarCredencial(); } },
    'c':             { nav: null,               titulo: 'Credencial',                  ver: function (p) { VISTAS.credencial(p); } },
    'accesibilidad': { nav: 'Accesibilidad',    titulo: 'Mi perfil de accesibilidad',  ver: function () { VISTAS.accesibilidad(); } },
    'interbot':      { nav: 'InterBot',         titulo: 'InterBot',                    ver: function () { INTERBOT.vista(); } },
    'chat':          { nav: 'Chat',             titulo: 'Chat de InterMUN',            ver: function (p) { CHAT.vista(p); } },

    'staff':         { nav: 'Control',          titulo: 'Control de InterMUN',         ver: function () { ADMIN.panel(); } },
    'escanear':      { nav: null,               titulo: 'Escanear credencial',         ver: function () { ADMIN.escanear(); },  staff: true },
    'tablero':       { nav: null,               titulo: 'Tablero en vivo',             ver: function () { ADMIN.tablero(); },   staff: true },
    'delegados':     { nav: null,               titulo: 'Delegados',                   ver: function () { ADMIN.delegados(); }, staff: true },
    'comidas':       { nav: null,               titulo: 'Comidas del evento',          ver: function () { ADMIN.comidas(); },   staff: true },
    'qr':            { nav: null,               titulo: 'Generar los códigos QR',      ver: function () { ADMIN.qr(); },        staff: true },
    'salas':         { nav: null,               titulo: 'Salas de chat',               ver: function () { ADMIN.salas(); },     staff: true },
    'ajustes':       { nav: null,               titulo: 'Ajustes y estado',            ver: function () { ADMIN.ajustes(); } }
  };


  function rutaActual() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var partes = h.split('/').filter(function (x) { return x !== ''; });
    return {
      nombre: partes[0] || '',
      param: partes[1] ? decodeURIComponent(partes[1]) : null
    };
  }


  /* ---------- Navegacion ---------- */
  function pintarNav() {
    var actual = rutaActual().nombre;
    var html = '';
    Object.keys(RUTAS).forEach(function (k) {
      var r = RUTAS[k];
      if (!r.nav) return;
      var esActual = (k === actual);
      html += '<a href="#/' + k + '"' + (esActual ? ' aria-current="page"' : '') + '>' +
                UI.esc(r.nav) +
                (k === 'staff' ? '<span class="marca-staff">staff</span>' : '') +
              '</a>';
    });
    document.getElementById('navegacion').innerHTML = html;
  }


  /* ---------- Mostrar la vista ---------- */
  function enrutar() {
    cerrarCanalVivo();

    var r = rutaActual();
    var def = RUTAS[r.nombre];

    pintarNav();

    if (!def) {
      UI.esperarFoco('Página no encontrada');
      UI.pintar(
        '<h1>Página no encontrada</h1>' +
        UI.aviso('warn', null, 'La dirección que abriste no existe en el sistema. Puede que el enlace esté incompleto.') +
        '<p><a class="btn" href="#/">Ir al inicio del portal</a></p>'
      );
      primeraCarga = false;
      return;
    }

    if (def.staff === true && !usuario) {
      UI.esperarFoco('Acceso del staff');
      ADMIN.login('Esta sección es del equipo organizador. Inicia sesión para continuar.');
      primeraCarga = false;
      return;
    }

    /* En la primera carga (por ejemplo, alguien que llega escaneando un
       codigo QR) NO se mueve el foco: se respeta el orden completo del
       documento para que la persona pueda orientarse desde el principio. */
    if (!primeraCarga) UI.esperarFoco(def.titulo);

    try {
      def.ver(r.param);
    } catch (e) {
      console.error(e);
      UI.pintar('<h1>Ocurrió un error</h1>' + UI.aviso('err', 'No se pudo abrir esta sección', UI.explicarError(e)));
    }

    if (window.A11Y) window.A11Y.vistaCambiada(def.titulo, primeraCarga);
    primeraCarga = false;
  }


  /* ---------- Tiempo real ---------- */
  function abrirCanalVivo(alCambiar) {
    cerrarCanalVivo();
    canalVivo = DB.entregas.escuchar(alCambiar);
  }

  function cerrarCanalVivo() {
    if (canalVivo) { DB.entregas.dejarDeEscuchar(canalVivo); canalVivo = null; }
    canalesExtra.forEach(function (c) { DB.chat.dejarDeEscuchar(c); });
    canalesExtra = [];
  }

  /* Canales de tiempo real de otras vistas (por ejemplo, una sala de
     chat). Se cierran solos al cambiar de vista. */
  var canalesExtra = [];
  function registrarCanal(c) { if (c) canalesExtra.push(c); }


  /* ---------- Sesion ---------- */
  function pintarSesion() {
    var chip = document.getElementById('chipSesion');
    var btn = document.getElementById('btnSalir');
    if (usuario) {
      chip.textContent = 'Sesión de staff: ' + usuario.email;
      chip.classList.remove('oculto');
      btn.hidden = false;
    } else {
      chip.classList.add('oculto');
      btn.hidden = true;
    }
  }

  function fijarUsuario(u) {
    var cambio = (!!usuario) !== (!!u);
    usuario = u;
    pintarSesion();
    pintarNav();
    if (cambio) enrutar();
  }

  function usuarioActual() { return usuario; }


  /* ---------- Pie de pagina ---------- */
  function pintarPie() {
    var e = window.CONFIG.EVENTO;
    var atajos = window.A11Y ? window.A11Y.ATAJOS : {};
    var lista = Object.keys(atajos).map(function (k) {
      var destino = atajos[k].replace('#/', '') || 'inicio';
      return 'Alt más ' + k + ', ' + destino;
    }).join('. ');

    document.getElementById('pie').innerHTML =
      '<h2>Sobre este sitio</h2>' +
      '<p>' + UI.esc(e.nombre) + ', ' + UI.esc(e.edicion) + ', ' + UI.esc(e.anio) + '. ' +
        UI.esc(e.carrera) + ', ' + UI.esc(e.institucion) + '. ' + UI.esc(e.ciudad) + '.</p>' +
      '<h3>Atajos de teclado</h3>' +
      '<p>' + UI.esc(lista) + '. Alt más 0 lee la página en voz alta.</p>' +
      '<p><a href="#/accesibilidad">Mi perfil de accesibilidad</a> ' +
         '&middot; <a href="#/ajustes">Estado del sistema</a></p>';
  }


  /* ---------- Arranque ---------- */
  function arrancar() {
    var e = window.CONFIG.EVENTO;
    document.getElementById('marcaNombre').textContent = e.nombre;
    document.title = e.nombre + ' ' + e.anio + ' | ' + e.subtitulo;

    /* El pie se pinta ANTES de iniciar accesibilidad: el boton de
       "volver al inicio de la página" se agrega al final del pie, y si
       el pie se repintara despues, ese boton desapareceria. */
    pintarPie();
    if (window.A11Y) window.A11Y.iniciar();
    if (window.INSTALAR) window.INSTALAR.construir();

    document.getElementById('btnSalir').addEventListener('click', function () {
      if (!UI.confirmar('Vas a cerrar la sesión de staff en este dispositivo. Confirmas?')) return;
      DB.sesion.salir().then(function () {
        fijarUsuario(null);
        UI.tostada('Sesión cerrada.', 'ok');
        location.hash = '#/';
      });
    });

    window.addEventListener('hashchange', enrutar);

    if (!DB.iniciar()) { enrutar(); return; }

    DB.sesion.alCambiar(function (u) { fijarUsuario(u); });

    DB.sesion.actual()
      .then(function (u) { usuario = u; pintarSesion(); enrutar(); })
      .catch(function () { enrutar(); });

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }


  return {
    arrancar: arrancar,
    enrutar: enrutar,
    rutaActual: rutaActual,
    usuarioActual: usuarioActual,
    fijarUsuario: fijarUsuario,
    abrirCanalVivo: abrirCanalVivo,
    cerrarCanalVivo: cerrarCanalVivo,
    registrarCanal: registrarCanal
  };
})();

document.addEventListener('DOMContentLoaded', window.APP.arrancar);

/* ==============================================================
   InterMUN UAGRM - Nucleo de la aplicacion
   Ruteo, navegacion y arranque
   ============================================================== */

window.APP = (function () {

  var usuario = null;          // usuario del staff con sesion abierta
  var canalVivo = null;        // suscripcion de tiempo real activa

  /* ---------- Rutas disponibles ---------- */
  var RUTAS = {
    '':            { nav: 'Inicio',      ver: function () { VISTAS.inicio(); } },
    'reglas':      { nav: 'Reglas',      ver: function () { VISTAS.reglas(); } },
    'guia':        { nav: 'Guia',        ver: function () { VISTAS.guia(); } },
    'comites':     { nav: 'Comites',     ver: function () { VISTAS.comites(); } },
    'datos':       { nav: 'Curiosidades',ver: function () { VISTAS.curiosidades(); } },
    'c':           { nav: null,          ver: function (p) { VISTAS.credencial(p); } },
    'buscar':      { nav: 'Mi credencial', ver: function () { VISTAS.buscarCredencial(); } },

    'staff':       { nav: 'Control',     ver: function () { ADMIN.panel(); },      staff: 'suave' },
    'escanear':    { nav: null,          ver: function () { ADMIN.escanear(); },   staff: true },
    'tablero':     { nav: null,          ver: function () { ADMIN.tablero(); },    staff: true },
    'delegados':   { nav: null,          ver: function () { ADMIN.delegados(); },  staff: true },
    'comidas':     { nav: null,          ver: function () { ADMIN.comidas(); },    staff: true },
    'qr':          { nav: null,          ver: function () { ADMIN.qr(); },         staff: true },
    'ajustes':     { nav: null,          ver: function () { ADMIN.ajustes(); } }
  };


  /* ---------- Navegacion superior ---------- */
  function pintarNav() {
    var actual = rutaActual().nombre;
    var html = '';
    Object.keys(RUTAS).forEach(function (k) {
      var r = RUTAS[k];
      if (!r.nav) return;
      var clases = [];
      if (k === actual) clases.push('on');
      if (r.staff === true) clases.push('solo-staff');
      html += '<a href="#/' + k + '" class="' + clases.join(' ') + '">' + UI.esc(r.nav) + '</a>';
    });
    document.getElementById('navegacion').innerHTML = html;
  }


  /* ---------- Leer la ruta del hash ---------- */
  function rutaActual() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var partes = h.split('/').filter(function (x) { return x !== ''; });
    return {
      nombre: partes[0] || '',
      param:  partes[1] ? decodeURIComponent(partes[1]) : null
    };
  }


  /* ---------- Mostrar la vista que toca ---------- */
  function enrutar() {
    cerrarCanalVivo();

    var r = rutaActual();
    var def = RUTAS[r.nombre];

    if (!def) {
      UI.pintar(
        '<div class="tarjeta">' +
          '<h1>Pagina no encontrada</h1>' +
          '<p class="silencio">La direccion que abriste no existe en el sistema.</p>' +
          '<p><a class="btn" href="#/">Volver al inicio</a></p>' +
        '</div>'
      );
      pintarNav();
      return;
    }

    /* Rutas que exigen sesion de staff */
    if (def.staff === true && !usuario) {
      ADMIN.login('Necesitas iniciar sesion como staff para entrar a esta seccion.');
      pintarNav();
      return;
    }

    try {
      def.ver(r.param);
    } catch (e) {
      console.error(e);
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Ocurrio un error', UI.explicarError(e)) + '</div>');
    }
    pintarNav();
  }


  /* ---------- Tiempo real ---------- */
  function abrirCanalVivo(alCambiar) {
    cerrarCanalVivo();
    canalVivo = DB.entregas.escuchar(alCambiar);
  }

  function cerrarCanalVivo() {
    if (canalVivo) { DB.entregas.dejarDeEscuchar(canalVivo); canalVivo = null; }
  }


  /* ---------- Sesion ---------- */
  function pintarSesion() {
    var chip = document.getElementById('chipSesion');
    var btn  = document.getElementById('btnSalir');
    if (usuario) {
      chip.textContent = usuario.email;
      chip.classList.remove('oculto');
      btn.style.display = '';
    } else {
      chip.classList.add('oculto');
      btn.style.display = 'none';
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
    document.getElementById('pie').innerHTML =
      UI.esc(e.nombre) + ' ' + UI.esc(e.edicion) + ' &middot; ' + UI.esc(e.anio) + '<br>' +
      UI.esc(e.carrera) + ' &middot; ' + UI.esc(e.institucion) + '<br>' +
      '<a href="#/ajustes" style="color:inherit">Estado del sistema</a>';
  }


  /* ---------- Arranque ---------- */
  function arrancar() {
    var e = window.CONFIG.EVENTO;
    document.getElementById('marcaNombre').textContent = e.nombre;
    document.getElementById('marcaSub').textContent = 'UAGRM';
    document.title = e.nombre + ' ' + e.anio;
    pintarPie();

    document.getElementById('btnSalir').addEventListener('click', function () {
      if (!UI.confirmar('Cerrar la sesion de staff en este dispositivo?')) return;
      DB.sesion.salir().then(function () {
        fijarUsuario(null);
        UI.tostada('Sesion cerrada', 'ok');
        location.hash = '#/';
      });
    });

    window.addEventListener('hashchange', enrutar);

    var conectado = DB.iniciar();

    if (!conectado) {
      pintarNav();
      enrutar();
      return;
    }

    DB.sesion.alCambiar(function (u) { fijarUsuario(u); });

    DB.sesion.actual().then(function (u) {
      usuario = u;
      pintarSesion();
      pintarNav();
      enrutar();
    }).catch(function () {
      pintarNav();
      enrutar();
    });

    /* Registrar el modo sin conexion */
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }


  return {
    arrancar:       arrancar,
    enrutar:        enrutar,
    rutaActual:     rutaActual,
    usuarioActual:  usuarioActual,
    fijarUsuario:   fijarUsuario,
    abrirCanalVivo: abrirCanalVivo,
    cerrarCanalVivo:cerrarCanalVivo
  };
})();

document.addEventListener('DOMContentLoaded', window.APP.arrancar);

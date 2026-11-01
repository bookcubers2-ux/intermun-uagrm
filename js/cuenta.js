/* ====================================================================
   InterMUN UAGRM | Mi cuenta
   --------------------------------------------------------------------
   El punto de partida de cada delegada y delegado después de entrar con
   su correo o su ID: su código QR, el foro que pidió (o el que le
   asignaron), el acceso a su sala de chat y a todos los módulos
   personales. Todo sale de la función mi_cuenta, que la base verifica.

   Accesibilidad: encabezados en orden, listas reales, el QR con nombre
   accesible y su valor en texto, y ningún estado dicho solo con color.
   ==================================================================== */

window.CUENTA = (function () {
  'use strict';

  function vista() {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>Mi cuenta</h1>' +
        UI.aviso('warn', 'El sistema todavía no está conectado', 'Inténtalo de nuevo en un momento.'));
      return;
    }
    IDENT.exigir({
      titulo: 'Ingresar a mi cuenta',
      intro: '<p>Tu cuenta reúne tu código QR para la fila de comidas, tu foro, tus puntos y el chat.</p>',
      boton: 'Entrar a mi cuenta'
    }, function (yo) {
      UI.cargando('Cargando tu cuenta');
      Promise.all([DB.identidad.miCuenta(yo), DB.chat.salasActivas()])
        .then(function (r) {
          if (!r[0]) throw new Error('CREDENCIAL_INVALIDA');
          pintar(yo, r[0], r[1]);
        })
        .catch(function (e) {
          if (VISTAS.pinRechazado(e, vista)) return;
          UI.pintar('<h1>Mi cuenta</h1>' + UI.aviso('err', 'No se pudo cargar tu cuenta', UI.explicarError(e)));
        });
    });
  }

  /* El QR abre la credencial pública de la persona; es el mismo que se imprime. */
  function urlCredencial(codigo) {
    var base = location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
    return base + '/#/c/' + encodeURIComponent(codigo);
  }

  function svgQR(url) {
    try {
      var g = qrcode(0, 'M');
      g.addData(url);
      g.make();
      return g.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch (e) { return ''; }
  }

  function sigla(texto) {
    var m = /\(([^)]+)\)/.exec(texto || '');
    return m ? m[1] : (texto || '');
  }

  function pintar(yo, c, salas) {
    var foros = PUNTOS.soloForos(salas);
    var general = salas.filter(function (s) { return s.tipo === 'general'; })[0] || null;
    var miForo = c.comite ? PUNTOS.foroDelDelegado(c, foros) : null;
    var url = urlCredencial(c.codigo);

    var html = '<h1>Mi cuenta</h1>' +
      '<p class="silencio">Entraste como <strong>' + UI.esc(c.nombre) + '</strong> ' +
        '<span class="mono">(' + UI.esc(c.codigo) + ')</span>. ' +
        '<button type="button" class="btn sec chico" id="cuSalir">Cerrar sesión</button></p>' +
      VISTAS.tarjetaCredencial(c);

    /* ---- Foro ---- */
    html += '<section aria-labelledby="t-cu-foro"><h2 id="t-cu-foro">Mi foro</h2>';
    if (c.comite) {
      html += '<p>Estás en <strong>' + UI.esc(c.comite) + '</strong>' +
        (c.pais ? ', representando a <strong>' + UI.esc(c.pais) + '</strong>.' : '. Tu país todavía se está asignando.') + '</p>';
      if (miForo) {
        html += '<div class="fila-btn">' +
          '<a class="btn" href="#/chat/' + encodeURIComponent(miForo.clave) + '">Abrir el chat de mi foro</a>' +
          '<a class="btn sec" href="#/puntuaciones/' + encodeURIComponent(miForo.clave) + '">Ver el ranking de mi foro</a>' +
        '</div>';
      }
    } else {
      html += UI.aviso('info', 'Tu foro todavía no está asignado. ',
        'El Secretariado asigna los foros y, cuando lo haga, aparece aquí y se abre el chat de tu foro. ' +
        'Mientras tanto puedes usar la sala general.');
      if (c.foro_1 || c.foro_2) {
        html += '<p>Lo que pediste al inscribirte:</p><ul>' +
          (c.foro_1 ? '<li>Primera opción: <strong>' + UI.esc(c.foro_1) + '</strong></li>' : '') +
          (c.foro_2 ? '<li>Segunda opción: <strong>' + UI.esc(c.foro_2) + '</strong></li>' : '') +
        '</ul>';
      }
    }
    html += '</section>';

    /* ---- QR ---- */
    var qr = svgQR(url);
    if (qr) {
      html += '<section aria-labelledby="t-cu-qr"><h2 id="t-cu-qr">Mi código QR</h2>' +
        '<p>Muéstralo en la fila de comidas: el personal lo escanea y la entrega queda registrada. ' +
          'Si tu teléfono no tiene batería, basta con decir tu ID, <strong>' + UI.esc(c.codigo) + '</strong>.</p>' +
        '<figure class="qr-cuenta">' +
          '<div role="img" aria-label="Código QR de ' + UI.esc(c.nombre) + ', ID ' + UI.esc(c.codigo) + '">' + qr + '</div>' +
          '<figcaption><strong>' + UI.esc(c.nombre) + '</strong><br><span class="mono">ID: ' + UI.esc(c.codigo) + '</span></figcaption>' +
        '</figure></section>';
    }

    /* ---- Módulos personales ---- */
    var modulos = [
      { href: '#/mis-comidas',  ico: '&#127869;', t: 'Mis comidas',
        d: 'Desayuno, almuerzo y meriendas de cada día: cuáles ya recibiste y a qué hora.' },
      { href: '#/mi-desempeno', ico: '&#127942;', t: 'Mi desempeño',
        d: 'Tus puntos por criterio, tu puesto en el foro y el detalle de cada puntuación, en vivo.' }
    ];
    if (miForo) modulos.push({ href: '#/chat/' + encodeURIComponent(miForo.clave), ico: '&#128172;', t: 'Chat de mi foro',
      d: 'La sala de ' + sigla(miForo.comite || miForo.nombre) + ': conversa con tu comité y comparte archivos PDF.' });
    if (general) modulos.push({ href: '#/chat/' + encodeURIComponent(general.clave), ico: '&#127760;', t: 'Sala general',
      d: 'El chat de todas las personas acreditadas en InterMUN.' });
    modulos.push(
      { href: '#/interbot',  ico: '&#129302;', t: 'InterBot',
        d: 'Pregúntale al asistente cómo proponer una moción o redactar una cláusula. Te responde con ejemplos de tu país y tu foro.' },
      { href: '#/material',  ico: '&#128220;', t: 'Material para delegados',
        d: 'Reglamento, modelo y ejemplo de posición oficial, resolución de ejemplo y vocabulario protocolar.' },
      { href: '#/capacitaciones', ico: '&#127909;', t: 'Capacitaciones',
        d: 'Las clases de preparación con el enlace a cada video.' });
    html += '<h2>Todo lo tuyo</h2>' + VISTAS.listaModulos(modulos);

    /* ---- Datos ---- */
    html += '<section aria-labelledby="t-cu-datos"><h2 id="t-cu-datos">Mis datos</h2><ul>' +
      '<li>Cuenta: <strong>' + UI.esc(c.correo || 'sin correo registrado') + '</strong> o tu ID <strong>' + UI.esc(c.codigo) + '</strong></li>' +
      '<li>Contraseña: tu número de carnet</li>' +
      (c.celular ? '<li>Celular registrado: ' + UI.esc(c.celular) + '</li>' : '') +
      (c.tipo ? '<li>Inscripción: ' + (c.tipo === 'externo' ? 'participante externo' : 'estudiante de la UAGRM') + '</li>' : '') +
      '<li>Alergia o restricción alimentaria: <strong>' + UI.esc(c.alergia || 'ninguna registrada') + '</strong></li>' +
    '</ul><p class="silencio">Si algún dato está mal, avísale al Secretariado en la mesa de acreditación.</p></section>';

    UI.pintar(html);
    UI.q('#cuSalir').addEventListener('click', function () {
      DB.identidad.limpiar();
      UI.tostada('Cerraste tu sesión.', 'ok');
      location.hash = '#/';
    });
  }

  return { vista: vista };
})();

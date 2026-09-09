/* ====================================================================
   InterMUN UAGRM | Vistas publicas
   --------------------------------------------------------------------
   Marcado semantico real: listas que son listas, encabezados en orden
   sin saltos, tablas con encabezados asociados y ningun div clicable.
   El lector de pantalla no ve la pantalla, navega esta estructura.
   ==================================================================== */

window.VISTAS = (function () {
  'use strict';

  var C = window.CONTENIDO;


  /* ---------- Rejilla de modulos como LISTA de enlaces ----------
     Anunciar "lista de 6 elementos" le da a la persona ciega el mapa
     completo antes de recorrerlo. ------------------------------------ */
  function listaModulos(items) {
    var html = '<ul class="rejilla" role="list">';
    items.forEach(function (m) {
      html += '<li>' +
                '<a class="modulo" href="' + m.href + '">' +
                  UI.icono(m.ico) +
                  '<strong>' + UI.esc(m.t) + '</strong>' +
                  '<span class="d">' + UI.esc(m.d) + '</span>' +
                '</a>' +
              '</li>';
    });
    return html + '</ul>';
  }


  /* ================================================================
     INICIO
     ================================================================ */
  function inicio() {
    var e = window.CONFIG.EVENTO;
    var hayStaff = !!APP.usuarioActual();

    var html =
      '<div class="portada">' +
        /* El logotipo es decorativo aqui: el H1 que sigue ya dice el
           nombre, asi que el alt va vacio para no repetirlo. */
        '<img class="portada-logo" src="img/logo-480.png" alt="" width="150" height="173">' +
        '<p class="kicker">' + UI.esc(e.carrera) + '</p>' +
        '<h1>' + UI.esc(e.nombre) + '</h1>' +
        '<p>' + UI.esc(e.subtitulo) + ' de la ' + UI.esc(e.institucion) + '. ' +
          'Aquí están las reglas de procedimiento, la guía del delegado y tu credencial digital.</p>' +
        '<p class="sello">' + UI.esc(e.edicion) + ', ' + UI.esc(e.anio) + ', ' + UI.esc(e.ciudad) + '</p>' +
      '</div>';

    if (!DB.hayConexion()) {
      html += UI.aviso('warn', 'El portal está en modo de solo lectura',
        'Todavía no hay conexión con la base de datos, así que las credenciales y el control de comidas no funcionan. El contenido académico sí está disponible.');
    }

    html += '<h2>Qué quieres hacer</h2>' +
      listaModulos([
        { href: '#/buscar',        ico: '&#127915;', t: 'Mi credencial',
          d: 'Tus datos de acreditación: nombre, país, comité e institución.' },
        { href: '#/mis-comidas',   ico: '&#127869;', t: 'Mis comidas',
          d: 'Desayuno, almuerzo y meriendas de cada día: cuáles ya recibiste. Pide tu código y tu PIN.' },
        { href: '#/mi-desempeno',  ico: '&#127942;', t: 'Mi desempeño',
          d: 'Tus puntos por criterio, tu puesto en el foro y el detalle de cada puntuación. Pide tu código y tu PIN.' },
        { href: '#/reglas',        ico: '&#9878;',   t: 'Reglas de procedimiento',
          d: 'Los sistemas de reglas, el flujo de una sesión y el glosario completo.' },
        { href: '#/guia',          ico: '&#128218;', t: 'Guía del delegado',
          d: 'Protocolo, formas de tratamiento, vestimenta y consejos prácticos.' },
        { href: '#/comites',       ico: '&#127760;', t: 'Comités y tópicos',
          d: 'Los diez foros oficiales de InterMUN 2026 con sus tópicos. Uno de ellos sesiona en inglés.' },
        { href: '#/puntuaciones',  ico: '&#128202;', t: 'Ranking por foro',
          d: 'El ranking público de cada foro, actualizado en vivo cuando los chairs puntúan.' },
        { href: '#/datos',         ico: '&#128161;', t: 'Curiosidades',
          d: 'Datos del mundo de los Modelos de Naciones Unidas que casi nadie conoce.' },
        { href: '#/interbot',      ico: '&#129302;', t: 'InterBot',
          d: 'Pregúntale al asistente de InterMUN cómo proponer una moción, qué hacer en tu comité o cómo redactar. No necesitas credencial.' },
        { href: '#/chat',          ico: '&#128172;', t: 'Chat por comités',
          d: 'Conversa con las demás delegaciones y comparte archivos PDF, en la sala general o en la de tu comité. Pide tu código y tu PIN.' },
        { href: '#/accesibilidad', ico: '&#9855;',   t: 'Mi perfil de accesibilidad',
          d: 'Ajusta la letra, el contraste y la lectura en voz alta a tu medida.' },
        { href: '#/staff',         ico: '&#128274;', t: hayStaff ? 'Control de InterMUN' : 'Acceso del staff',
          d: hayStaff ? 'Escanear credenciales, marcar comidas, puntuar y ver el tablero.'
                      : 'Solo para el equipo organizador de InterMUN.' }
      ]);

    UI.pintar(html);
  }


  /* ================================================================
     REGLAS DE PROCEDIMIENTO
     ================================================================ */
  function reglas() {
    var html = '<h1>Reglas de procedimiento</h1>' +
               '<p>' + UI.esc(C.reglas.intro) + '</p>';

    html += '<section aria-labelledby="t-sistemas">' +
              '<h2 id="t-sistemas">Los sistemas de reglas</h2>';
    C.reglas.sistemas.forEach(function (s) {
      html += '<details class="acordeon"><summary>' + UI.esc(s.t) + '</summary>' +
                '<div class="cuerpo"><p>' + UI.esc(s.c) + '</p></div></details>';
    });
    html += '</section>';

    html += '<section aria-labelledby="t-flujo">' +
              '<h2 id="t-flujo">Cómo transcurre una sesión</h2>' +
              '<p>Estas son las diez etapas, en orden, de principio a fin.</p>' +
              '<ol class="lista-flujo">';
    C.reglas.flujo.forEach(function (f) {
      html += '<li><strong>' + UI.esc(f.t) + '.</strong> ' + UI.esc(f.c) + '</li>';
    });
    html += '</ol></section>';

    html += '<section aria-labelledby="t-glosario">' +
              '<h2 id="t-glosario">Glosario</h2>' +
              '<label class="campo" for="filtroGlosario">' +
                '<span>Buscar un término</span>' +
                '<input type="search" id="filtroGlosario" autocomplete="off" ' +
                  'aria-describedby="ayuda-glosario">' +
              '</label>' +
              '<p class="ayuda-campo" id="ayuda-glosario">Escribe una palabra y la lista se reduce sola.</p>' +
              '<p class="solo-lector" role="status" aria-live="polite" id="conteo-glosario"></p>' +
              '<dl class="glosario" id="listaGlosario">';
    C.reglas.glosario.forEach(function (g) {
      html += '<div class="termino">' +
                '<dt>' + UI.esc(g.es) + ' <span class="ingles">(en inglés, ' + UI.esc(g.en) + ')</span></dt>' +
                '<dd>' + UI.esc(g.d) + '</dd>' +
              '</div>';
    });
    html += '</dl></section>';

    html += '<section aria-labelledby="t-frases">' +
              '<h2 id="t-frases">Si escuchas esto en tu comité</h2>' +
              '<dl class="glosario">';
    C.reglas.frases.forEach(function (f) {
      html += '<div class="termino"><dt>' + UI.esc(f.d) + '</dt><dd>' + UI.esc(f.s) + '</dd></div>';
    });
    html += '</dl></section>';

    UI.pintar(html);

    var filtro = document.getElementById('filtroGlosario');
    var conteo = document.getElementById('conteo-glosario');
    filtro.addEventListener('input', function () {
      var t = filtro.value.toLowerCase();
      var visibles = 0;
      UI.qq('#listaGlosario .término').forEach(function (d) {
        var ok = d.textContent.toLowerCase().indexOf(t) >= 0;
        d.style.display = ok ? '' : 'none';
        if (ok) visibles++;
      });
      conteo.textContent = visibles + (visibles === 1 ? ' término encontrado.' : ' términos encontrados.');
    });
  }


  /* ================================================================
     GUIA DEL DELEGADO
     ================================================================ */
  function guia() {
    var html = '<h1>Guía del delegado</h1>';

    html += '<section aria-labelledby="t-quees"><h2 id="t-quees">Qué es todo esto</h2>';
    C.quienesSomos.forEach(function (s) {
      html += '<details class="acordeon"><summary>' + UI.esc(s.t) + '</summary>' +
                '<div class="cuerpo"><p>' + UI.esc(s.c) + '</p></div></details>';
    });
    html += '</section>';

    html += '<section aria-labelledby="t-protocolo"><h2 id="t-protocolo">Protocolo y etiqueta</h2>';
    C.protocolo.forEach(function (p) {
      html += '<details class="acordeon"><summary>' + UI.esc(p.t) + '</summary>' +
                '<div class="cuerpo"><p>' + UI.esc(p.c) + '</p></div></details>';
    });
    html += '</section>';

    html += '<section aria-labelledby="t-consejos">' +
              '<h2 id="t-consejos">Consejos prácticos</h2>' +
              '<ul class="rejilla" role="list">';
    C.tips.forEach(function (t) {
      html += '<li><div class="modulo tarjeta-info">' +
                '<strong>' + UI.esc(t.t) + '</strong>' +
                '<span class="d">' + UI.esc(t.c) + '</span>' +
              '</div></li>';
    });
    html += '</ul></section>';

    UI.pintar(html);
  }


  /* ================================================================
     COMITES
     ================================================================ */
  function comites() {
    var html = '<h1>Comités y tópicos oficiales</h1>' +
      '<p>InterMUN 2026 sesiona en diez foros, del 4 al 6 de noviembre. Cada delegación debate los tópicos ' +
        'de su foro desde la política exterior del país que representa. La asignación de foro y país la hace ' +
        'la Secretaría Académica al confirmar la inscripción.</p>' +
      UI.aviso('info', 'Un comité en inglés',
        'La Primera Comisión (DISEC) sesiona íntegramente en inglés: discursos, mociones, documento de posición y ' +
        'resoluciones. Los otros nueve foros sesionan en español.');

    var secciones = [];
    C.comites.forEach(function (c) { if (secciones.indexOf(c.seccion) < 0) secciones.push(c.seccion); });

    secciones.forEach(function (sec, i) {
      html += '<section aria-labelledby="t-sec-' + i + '"><h2 id="t-sec-' + i + '">' + UI.esc(sec) + '</h2>';
      C.comites.filter(function (c) { return c.seccion === sec; }).forEach(function (c) {
        html += '<article class="tarjeta comite' + (c.en ? ' comite-en' : '') + '" aria-labelledby="t-com-' + UI.esc(c.sigla).replace(/\s+/g, '-') + '">' +
          '<p>' + '<span class="chip rol">' + UI.esc(c.sigla) + '</span> ' +
                  '<span class="chip">Nivel ' + UI.esc(c.nivel) + '</span> ' +
                  (c.en ? '<span class="chip err"><strong>En inglés</strong></span>' : '<span class="chip si">En español</span>') + '</p>' +
          '<h3 id="t-com-' + UI.esc(c.sigla).replace(/\s+/g, '-') + '">' + UI.esc(c.n) + (c.sigla !== c.n ? ' (' + UI.esc(c.sigla) + ')' : '') + '</h3>' +
          '<p>' + UI.esc(c.d) + '</p>' +
          (c.idioma ? UI.aviso('warn', 'Sesiona en inglés', c.idioma) : '') +
          '<h4>' + (c.topicos.length === 1 ? 'Tópico único' : 'Tópicos') + '</h4>' +
          '<ol class="lista-flujo">' +
            c.topicos.map(function (t, j) {
              return '<li>' + (c.topicos.length > 1 ? '<strong>Tópico ' + String.fromCharCode(65 + j) + '.</strong> ' : '') +
                     (c.en ? '<span lang="en">' + UI.esc(t) + '</span>' : UI.esc(t)) + '</li>';
            }).join('') +
          '</ol>' +
          '<p><a class="enlace-chico" href="#/puntuaciones">Ver el ranking en vivo</a> &middot; ' +
             '<a class="enlace-chico" href="#/chat">Ir a la sala de chat</a></p>' +
        '</article>';
      });
      html += '</section>';
    });

    html += UI.aviso('info', 'Cómo se asigna el foro',
      'Se toma como prioritaria la primera opción marcada en el formulario de inscripción. Si ese foro ya está completo, ' +
      'se asigna la segunda opción u otro foro. El país se asigna según la experiencia previa en modelos y no se cambia.');
    UI.pintar(html);
  }


  /* ================================================================
     CURIOSIDADES
     ================================================================ */
  function curiosidades() {
    var html = '<h1>Curiosidades del mundo MUN</h1>' +
      '<p>Datos que normalmente solo conoce quien lleva años en el circuito.</p>';
    C.curiosidades.forEach(function (c, i) {
      html += '<section class="tarjeta" aria-labelledby="cur-' + i + '">' +
                '<h2 id="cur-' + i + '">' + UI.esc(c.t) + '</h2>' +
                '<p>' + UI.esc(c.c) + '</p>' +
              '</section>';
    });
    UI.pintar(html);
  }


  /* ================================================================
     MI PERFIL DE ACCESIBILIDAD
     ================================================================ */
  function accesibilidad() {
    var p = window.A11Y ? window.A11Y.preferencias() : {};
    var vozOk = !!window.VOZ;

    var html =
      '<h1>Mi perfil de accesibilidad</h1>' +
      '<p>Elige como quieres leer y escuchar InterMUN. Tu elección queda guardada en este ' +
        'dispositivo y se aplica a todas las secciones. Puedes cambiarla cuando quieras.</p>' +

      '<section aria-labelledby="t-perfiles">' +
        '<h2 id="t-perfiles">Perfiles rápidos</h2>' +
        '<p>Cada perfil ajusta varias cosas a la vez, con un solo toque.</p>' +
        '<ul class="rejilla" role="list">' +
          perfil('ceguera', '&#128065;', 'Uso lector de pantalla',
                 'Simplifica los adornos visuales y deja la estructura limpia para navegar por encabezados.') +
          perfil('bajavision', '&#128083;', 'Veo poco',
                 'Letra al 150 por ciento, espaciado amplio y alto contraste con fondo oscuro.') +
          perfil('neurodivergente', '&#129504;', 'Prefiero lectura tranquila',
                 'Más espacio entre los elementos, letra algo mayor y menos densidad en pantalla.') +
          perfil('', '&#8634;', 'Sin perfil',
                 'Vuelve a la presentación original de la aplicación.') +
        '</ul>' +
        (p.perfil ? '<p class="chip si">Perfil activo: ' + UI.esc(nombrePerfil(p.perfil)) + '</p>'
                  : '<p class="chip no">Ahora mismo no tienes ningún perfil activo</p>') +
      '</section>' +

      '<section aria-labelledby="t-ajuste-fino">' +
        '<h2 id="t-ajuste-fino">Ajuste fino</h2>' +
        '<p>También puedes cambiar cada cosa por separado desde la barra de herramientas ' +
          'que está al principio de todas las páginas.</p>' +
        '<ul>' +
          '<li>Tamaño de letra actual: <strong>' + Math.round((p.escala || 1) * 100) + ' por ciento</strong>.</li>' +
          '<li>Espaciado: <strong>' + (p.espaciado ? 'amplio' : 'normal') + '</strong>.</li>' +
          '<li>Contraste: <strong>' + (p.tema === 'oscuro' ? 'alto, fondo oscuro' : 'normal, fondo claro') + '</strong>.</li>' +
        '</ul>' +
      '</section>' +

      '<section aria-labelledby="t-voz">' +
        '<h2 id="t-voz">Lectura en voz alta</h2>' +
        (vozOk
          ? '<p>InterMUN puede leerte cualquier página usando la voz que ya trae tu dispositivo. ' +
            'El texto no sale de tu teléfono: no se envia a ningún servidor y funciona sin internet.</p>' +
            '<p>Voz que se usará: <strong>' + UI.esc(window.VOZ.vozActual() || 'la voz por defecto del sistema') + '</strong>.</p>' +
            '<label class="campo" for="velVoz"><span>Velocidad de la voz</span>' +
              '<input type="range" id="velVoz" min="0.6" max="1.6" step="0.1" value="' + window.VOZ.velocidad() + '" ' +
                'aria-describedby="ayuda-vel"></label>' +
            '<p class="ayuda-campo" id="ayuda-vel">Mueve hacia la izquierda para una voz más lenta.</p>' +
            '<p class="solo-lector" role="status" aria-live="polite" id="estado-vel"></p>' +
            '<div class="fila-btn">' +
              '<button type="button" class="btn" id="probarVoz">Probar la voz</button>' +
              '<button type="button" class="btn sec" id="pararVoz">Detener</button>' +
            '</div>'
          : UI.aviso('warn', 'Tu navegador no permite lectura en voz alta',
              'Puedes seguir usando el lector de pantalla de tu teléfono, que funciona perfectamente con esta aplicación.')) +
      '</section>' +

      '<section aria-labelledby="t-atajos">' +
        '<h2 id="t-atajos">Atajos de teclado</h2>' +
        '<p>En una computadora, manten presionada la tecla Alt y pulsa un número.</p>' +
        '<ul>' +
          '<li><strong>Alt más 1</strong>: inicio del portal.</li>' +
          '<li><strong>Alt más 2</strong>: reglas de procedimiento.</li>' +
          '<li><strong>Alt más 3</strong>: guía del delegado.</li>' +
          '<li><strong>Alt más 4</strong>: mi credencial.</li>' +
          '<li><strong>Alt más 5</strong>: control del staff.</li>' +
          '<li><strong>Alt más 6</strong>: InterBot.</li>' +
          '<li><strong>Alt más 7</strong>: chat por comités.</li>' +
          '<li><strong>Alt más 9</strong>: esta página de accesibilidad.</li>' +
          '<li><strong>Alt más 0</strong>: leer la página en voz alta.</li>' +
        '</ul>' +
        '<p>Se usa siempre la tecla Alt para no interferir con los atajos propios ' +
          'de tu lector de pantalla.</p>' +
      '</section>' +

      '<section aria-labelledby="t-compromiso">' +
        '<h2 id="t-compromiso">Cómo se construyó esta aplicación</h2>' +
        '<ul>' +
          '<li>Todos los colores se midieron: ninguno baja de una relación de contraste de siete a uno, el nivel más exigente de la norma internacional.</li>' +
          '<li>Ningún estado se comunica solo con color: siempre hay además texto, borde o símbolo.</li>' +
          '<li>Nada se mueve solo. No hay carruseles, ni ventanas emergentes automáticas, ni animaciones.</li>' +
          '<li>La tipografía es Atkinson Hyperlegible, diseñada por el Braille Institute para distinguir letras que suelen confundirse.</li>' +
          '<li>Todo botón mide al menos cuarenta y ocho píxeles, comodo para tocar con precisión limitada.</li>' +
          '<li>Al cambiar de sección, el foco viaja al título de la sección nueva y el cambio se anuncia.</li>' +
        '</ul>' +
      '</section>';

    UI.pintar(html);

    UI.qq('[data-perfil]').forEach(function (b) {
      b.addEventListener('click', function () {
        window.A11Y.aplicarPerfil(b.getAttribute('data-perfil'));
        accesibilidad();
        window.A11Y.enfocarTitulo();
      });
    });

    if (vozOk) {
      var vel = document.getElementById('velVoz');
      vel.addEventListener('change', function () {
        var v = window.VOZ.fijarVelocidad(vel.value);
        document.getElementById('estado-vel').textContent = 'Velocidad ajustada a ' + v.toFixed(1) + '.';
      });
      document.getElementById('probarVoz').addEventListener('click', function () {
        window.VOZ.hablar('Así se escucha la voz de InterMUN. Bienvenida y bienvenido al Modelo de Naciones Unidas de la Universidad Autónoma Gabriel René Moreno.');
      });
      document.getElementById('pararVoz').addEventListener('click', function () {
        window.VOZ.detener();
      });
    }
  }

  function perfil(clave, ico, titulo, desc) {
    return '<li><button type="button" class="modulo" data-perfil="' + clave + '" style="width:100%;text-align:left">' +
             UI.icono(ico) +
             '<strong>' + UI.esc(titulo) + '</strong>' +
             '<span class="d">' + UI.esc(desc) + '</span>' +
           '</button></li>';
  }

  function nombrePerfil(p) {
    if (p === 'ceguera') return 'uso lector de pantalla';
    if (p === 'bajavision') return 'veo poco';
    if (p === 'neurodivergente') return 'lectura tranquila';
    return 'ninguno';
  }


  /* ================================================================
     BUSCAR MI CREDENCIAL
     ================================================================ */
  function buscarCredencial() {
    UI.pintar(
      '<h1>Mi credencial</h1>' +
      '<p>Escanea el código QR del reverso de tu credencial con la cámara de tu teléfono, ' +
        'o escribe aquí el código que aparece impreso en ella.</p>' +
      '<div class="tarjeta angosto">' +
        '<label class="campo" for="codigoBuscar">' +
          '<span>Código de credencial</span>' +
          '<input type="text" id="codigoBuscar" autocomplete="off" autocapitalize="characters" ' +
            'aria-describedby="ayuda-codigo" placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001">' +
        '</label>' +
        '<p class="ayuda-campo" id="ayuda-codigo">Son dos letras, un guion y cuatro números. ' +
          'Por ejemplo: ' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + ' guion 0001.</p>' +
        '<button type="button" class="btn bloque" id="btnBuscar">Ver mi credencial</button>' +
      '</div>'
    );

    function ir() {
      var v = document.getElementById('codigoBuscar').value.trim().toUpperCase();
      if (!v) {
        UI.tostada('Escribe tu código de credencial para continuar.', 'err');
        document.getElementById('codigoBuscar').focus();
        return;
      }
      location.hash = '#/c/' + encodeURIComponent(v);
    }

    document.getElementById('btnBuscar').addEventListener('click', ir);
    document.getElementById('codigoBuscar').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') ir();
    });
  }


  /* ================================================================
     CREDENCIAL DEL DELEGADO
     Es la vista que abre el codigo QR de la credencial. Es publica:
     muestra solo los datos de acreditacion. Las comidas y el
     desempeno viven en sus propios modulos y exigen codigo + PIN.
     Si quien la abre es staff con sesion, aparecen ademas las
     comidas con los botones para marcar la entrega.
     ================================================================ */
  function credencial(codigo) {
    if (!codigo) { buscarCredencial(); return; }

    if (!DB.hayConexion()) {
      UI.pintar('<h1>Credencial</h1>' +
        UI.aviso('warn', 'El sistema todavía no está conectado',
          'Las credenciales no están disponibles porque falta configurar la base de datos.') +
        '<p><a class="btn sec" href="#/">Ir al inicio del portal</a></p>');
      return;
    }

    UI.cargando('Buscando la credencial');

    var delegado = null, listaComidas = [], entregas = [];
    var esStaff = !!APP.usuarioActual();

    DB.delegados.porCodigo(codigo)
      .then(function (d) {
        if (!d) throw new Error('__no_existe__');
        delegado = d;
        if (!esStaff) return null;
        return Promise.all([DB.comidas.activas(), DB.entregas.deDelegado(d.id)]);
      })
      .then(function (r) {
        if (r) { listaComidas = r[0]; entregas = r[1]; }
        pintarCredencial();
        if (esStaff) {
          APP.abrirCanalVivo(function () {
            DB.entregas.deDelegado(delegado.id).then(function (e) { entregas = e; pintarCredencial(true); });
          });
        }
      })
      .catch(function (e) {
        if (e.message === '__no_existe__') {
          UI.pintar('<h1>Credencial no encontrada</h1>' +
            UI.aviso('err', 'No existe ninguna credencial con el código ' + codigo,
              'Revisa que esté bien escrito, o acercate a la mesa de acreditación para que te ayuden.') +
            '<p><a class="btn sec" href="#/buscar">Probar con otro código</a></p>');
        } else {
          UI.pintar('<h1>Credencial</h1>' + UI.aviso('err', 'No se pudo cargar la credencial', UI.explicarError(e)));
        }
      });

    function pintarCredencial(transitorio) {
      var html = '<h1>Credencial de ' + UI.esc(delegado.nombre) + '</h1>' + tarjetaCredencial(delegado);

      if (!delegado.activo) {
        html += UI.aviso('err', 'Esta credencial fue dada de baja',
          'El Secretariado la desactivó. Acercate a la mesa de acreditación para resolverlo.');
      }

      if (esStaff) {
        html += '<section aria-labelledby="t-comidas">' +
                  '<h2 id="t-comidas">Comidas de esta persona</h2>' +
                  htmlComidas(listaComidas, entregas, true) +
                '</section>' +
                '<div class="fila-btn no-imprimir">' +
                  '<a class="btn" href="#/escanear">Escanear la siguiente credencial</a>' +
                  '<a class="btn sec" href="#/tablero">Ver el tablero en vivo</a>' +
                  '<a class="btn sec" href="#/puntuar">Puntuar</a>' +
                '</div>';
      } else {
        html += '<h2>Tu información personal</h2>' +
          '<p>Lo que sigue es privado. Cada sección te pedirá tu código y tu PIN personal, el que recibiste en acreditación.</p>' +
          listaModulos([
            { href: '#/mis-comidas',  ico: '&#127869;', t: 'Mis comidas',
              d: 'Desayuno, almuerzo y meriendas de cada día: cuáles ya recibiste.' },
            { href: '#/mi-desempeno', ico: '&#127942;', t: 'Mi desempeño',
              d: 'Tus puntos por criterio, tu puesto en el foro y el detalle de cada puntuación.' },
            { href: '#/chat',         ico: '&#128172;', t: 'Chat por comités',
              d: 'La sala general y la sala de tu comité, con archivos PDF.' }
          ]) +
          UI.aviso('info', 'Cómo funciona en la fila de comidas',
            'Muestra el código QR del reverso de tu credencial. El personal lo escanea y la entrega queda registrada ' +
            'al instante; puedes verla en "Mis comidas".') +
          '<p><a class="btn sec" href="#/">Volver al inicio del portal</a></p>';
      }

      UI.pintar(html, { transitorio: !!transitorio });
      if (esStaff) enlazarBotonesComida(delegado, function (e) { entregas = e; pintarCredencial(true); });
    }
  }


  /* ---------- Piezas compartidas por credencial, Mis comidas y Mi desempeño ---------- */
  function tarjetaCredencial(delegado) {
    return '<div class="credencial">' +
      '<p class="cred-cod">Código ' + UI.esc(delegado.codigo) + '</p>' +
      '<h2>' + UI.esc(delegado.nombre) + '</h2>' +
      '<p><span class="chip-cred">' + UI.esc(delegado.rol || 'delegado') + '</span></p>' +
      '<div class="cred-datos">' +
        dato('País que representa', delegado.pais) +
        dato('Comité', delegado.comite) +
        dato('Institución', delegado.institucion) +
      '</div>' +
    '</div>';
  }

  function dato(k, v) {
    if (!v) return '';
    return '<span class="cred-dato"><span class="k">' + UI.esc(k) + '</span>' +
           '<span class="v">' + UI.esc(v) + '</span></span>';
  }

  function nombreTipo(t) {
    return { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', refrigerio: 'Refrigerio', cena: 'Cena', coffee: 'Coffee break' }[t] || t;
  }

  /* Lista de comidas por día con su estado. Con botones = true agrega
     Entregar / Deshacer (solo tiene sentido con sesión de staff). */
  function htmlComidas(listaComidas, entregas, botones) {
    var mapa = {};
    entregas.forEach(function (x) { mapa[x.comida_id] = x; });
    var entregadas = listaComidas.filter(function (c) { return mapa[c.id]; }).length;
    var html = '<p><strong>' + (botones ? 'Lleva ' : 'Llevas ') + entregadas + ' de ' + listaComidas.length + '.</strong></p>';

    if (!listaComidas.length) {
      return html + UI.vacio('&#127869;', 'Todavía no se cargó el cronograma de comidas del evento.');
    }
    var porDia = {};
    listaComidas.forEach(function (c) { (porDia[c.dia] = porDia[c.dia] || []).push(c); });

    Object.keys(porDia).sort(function (a, b) { return a - b; }).forEach(function (dia) {
      var delDia = porDia[dia], hechas = delDia.filter(function (c) { return mapa[c.id]; }).length;
      html += '<h3>Día ' + UI.esc(dia) + ' <small class="silencio">(' + hechas + ' de ' + delDia.length + ')</small></h3><ul class="lista-comidas" role="list">';
      delDia.forEach(function (c) {
        var e = mapa[c.id];
        var estado = e ? 'Ya entregado' : 'Pendiente';
        var detalle = e
          ? 'Entregado a las ' + UI.hora(e.entregado_en) + (e.estacion ? ', en ' + UI.esc(e.estacion) : '')
          : 'Todavía no lo recibes';
        html +=
          '<li class="comida-fila">' +
            '<span class="marca-est ' + (e ? 'si' : 'no') + '" aria-hidden="true">' + (e ? '&#10003;' : '&middot;') + '</span>' +
            '<span class="info">' +
              '<b>' + UI.esc(c.nombre) + '</b>' +
              '<small>' + UI.esc(nombreTipo(c.tipo)) + '. ' + detalle + '.</small>' +
            '</span>' +
            (botones
              ? (e
                  ? '<button type="button" class="btn sec chico" data-quitar="' + c.id + '">' +
                      'Deshacer <span class="solo-lector">la entrega de ' + UI.esc(c.nombre) + ' del día ' + UI.esc(dia) + '</span></button>'
                  : '<button type="button" class="btn verde chico" data-marcar="' + c.id + '">' +
                      'Entregar <span class="solo-lector">' + UI.esc(c.nombre) + ' del día ' + UI.esc(dia) + '</span></button>')
              : '<span class="chip ' + (e ? 'si' : 'no') + '">' + estado + '</span>') +
          '</li>';
      });
      html += '</ul>';
    });
    return html;
  }

  function enlazarBotonesComida(delegado, alCambiar) {
    UI.qq('[data-marcar]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.disabled = true;
        var u = APP.usuarioActual();
        DB.entregas.marcar(delegado.id, b.dataset.marcar, u ? u.email : null, estacionGuardada())
          .then(function (r) {
            UI.tostada(r.duplicado ? 'Esa comida ya había sido entregada antes.' : 'Entrega registrada.', r.duplicado ? 'err' : 'ok');
            return DB.entregas.deDelegado(delegado.id);
          })
          .then(alCambiar)
          .catch(function (err) { UI.tostada(UI.explicarError(err), 'err'); b.disabled = false; });
      });
    });
    UI.qq('[data-quitar]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!UI.confirmar('Vas a deshacer esta entrega. Se usa solo si fue marcada por error. Confirmas?')) return;
        b.disabled = true;
        DB.entregas.desmarcar(delegado.id, b.dataset.quitar)
          .then(function () { UI.tostada('Entrega deshecha.', 'ok'); return DB.entregas.deDelegado(delegado.id); })
          .then(alCambiar)
          .catch(function (err) { UI.tostada(UI.explicarError(err), 'err'); b.disabled = false; });
      });
    });
  }

  /* Si la base rechaza el PIN guardado (por ejemplo, el administrador
     lo cambió), se borra la identidad y se vuelve a pedir. */
  function pinRechazado(e, reintentar) {
    var m = (e && e.message) || '';
    if (/PIN no coincide|PIN_INVALIDO|no está activa|CREDENCIAL_INVALIDA/i.test(m)) {
      DB.identidad.limpiar();
      UI.tostada(m, 'err');
      reintentar();
      return true;
    }
    return false;
  }


  /* ================================================================
     MIS COMIDAS (privado: código + PIN)
     ================================================================ */
  function misComidas() {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>Mis comidas</h1>' + UI.aviso('warn', 'El sistema todavía no está conectado', 'Inténtalo de nuevo en un momento.'));
      return;
    }
    IDENT.exigir({
      titulo: 'Mis comidas',
      intro: '<p>Durante los tres días del evento tienes desayuno, almuerzo y cuatro meriendas por día. ' +
             'Aquí ves cuáles ya recibiste y a qué hora.</p>',
      boton: 'Ver mis comidas'
    }, function (yo) {
      UI.cargando('Cargando tus comidas');
      var listaComidas = [], entregas = [];

      function traer() {
        return Promise.all([DB.comidas.activas(), DB.entregas.mias(yo.codigo, yo.pin)])
          .then(function (r) { listaComidas = r[0]; entregas = r[1]; });
      }

      traer().then(function () {
        pintar();
        /* Las entregas son privadas, así que el navegador no recibe avisos
           en vivo: se consulta cada 20 segundos mientras la pantalla esté abierta. */
        var reloj = setInterval(function () {
          var antes = entregas.length;
          traer().then(function () {
            if (entregas.length !== antes) { pintar(true); UI.tostada('Se registró una entrega nueva.', 'ok'); }
          }).catch(function () {});
        }, 20000);
        APP.registrarLimpieza(function () { clearInterval(reloj); });
      }).catch(function (e) {
        if (pinRechazado(e, misComidas)) return;
        UI.pintar('<h1>Mis comidas</h1>' + UI.aviso('err', 'No se pudieron cargar', UI.explicarError(e)));
      });

      function pintar(transitorio) {
        UI.pintar(
          '<h1>Mis comidas</h1>' +
          IDENT.lineaIdentidad(yo, 'mcCambiar') +
          '<section aria-labelledby="t-mc"><h2 id="t-mc">Refrigerios y almuerzos</h2>' +
            htmlComidas(listaComidas, entregas, false) +
          '</section>' +
          UI.aviso('info', 'Cómo funciona',
            'En la fila, muestra el código QR de tu credencial. El personal lo escanea y esta pantalla se actualiza sola en menos de un minuto. ' +
            'Cada comida se entrega una sola vez por persona.') +
          '<div class="fila-btn"><a class="btn sec" href="#/mi-desempeno">Ver mi desempeño</a><a class="btn sec" href="#/">Inicio</a></div>',
          { transitorio: !!transitorio });
        UI.q('#mcCambiar').addEventListener('click', function () { DB.identidad.limpiar(); misComidas(); });
      }
    });
  }


  /* ================================================================
     MI DESEMPEÑO (privado: código + PIN)
     ================================================================ */
  function miDesempeno() {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>Mi desempeño</h1>' + UI.aviso('warn', 'El sistema todavía no está conectado', 'Inténtalo de nuevo en un momento.'));
      return;
    }
    IDENT.exigir({
      titulo: 'Mi desempeño',
      intro: '<p>Los chairs puntúan a cada delegación durante las sesiones. Aquí ves tus puntos por criterio, ' +
             'tu puesto en el foro y el detalle de cada puntuación, en vivo.</p>',
      boton: 'Ver mi desempeño'
    }, function (yo) {
      UI.cargando('Cargando tu desempeño');
      var delegado = null, foros = [], misPuntos = [], puntosForo = [], delegadosForo = [], miForo = null;

      function cargar() {
        return Promise.all([DB.chat.salasActivas(), DB.puntos.deDelegado(delegado.id)])
          .then(function (r) {
            foros = PUNTOS.soloForos(r[0]);
            misPuntos = r[1];
            miForo = PUNTOS.foroDelDelegado(delegado, foros);
            if (!miForo) { puntosForo = []; delegadosForo = []; return; }
            return Promise.all([DB.puntos.deForo(miForo.clave), DB.delegados.listar()]).then(function (q) {
              puntosForo = q[0];
              delegadosForo = PUNTOS.delegadosDelForo(q[1], miForo);
            });
          });
      }

      DB.delegados.porCodigo(yo.codigo)
        .then(function (d) {
          if (!d || !d.activo) throw new Error('CREDENCIAL_INVALIDA');
          delegado = d;
          return cargar();
        })
        .then(function () {
          pintar();
          APP.registrarCanal(DB.puntos.escuchar(function () {
            cargar().then(function () { pintar(true); UI.tostada('Tus puntuaciones se actualizaron.', 'ok'); });
          }));
        })
        .catch(function (e) {
          if (pinRechazado(e, miDesempeno)) return;
          UI.pintar('<h1>Mi desempeño</h1>' + UI.aviso('err', 'No se pudo cargar', UI.explicarError(e)));
        });

      function pintar(transitorio) {
        UI.pintar(
          '<h1>Mi desempeño</h1>' +
          IDENT.lineaIdentidad(yo, 'mdCambiar') +
          tarjetaCredencial(delegado) +
          PUNTOS.seccionCredencial(delegado, foros, misPuntos, puntosForo, delegadosForo) +
          '<div class="fila-btn"><a class="btn sec" href="#/mis-comidas">Ver mis comidas</a><a class="btn sec" href="#/">Inicio</a></div>',
          { transitorio: !!transitorio });
        UI.q('#mdCambiar').addEventListener('click', function () { DB.identidad.limpiar(); miDesempeno(); });
      }
    });
  }


  function estacionGuardada() {
    try { return localStorage.getItem('intermun_estacion') || null; } catch (e) { return null; }
  }


  return {
    inicio: inicio,
    reglas: reglas,
    guia: guia,
    comites: comites,
    curiosidades: curiosidades,
    accesibilidad: accesibilidad,
    credencial: credencial,
    misComidas: misComidas,
    miDesempeno: miDesempeno,
    buscarCredencial: buscarCredencial,
    estacionGuardada: estacionGuardada
  };
})();

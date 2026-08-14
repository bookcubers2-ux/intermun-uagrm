/* ==============================================================
   InterMUN UAGRM - Vistas publicas
   Lo que ve cualquier persona que escanea un QR o entra al sitio
   ============================================================== */

window.VISTAS = (function () {

  var C = window.CONTENIDO;

  /* ============================================================
     INICIO
     ============================================================ */
  function inicio() {
    var e = window.CONFIG.EVENTO;
    var hayStaff = !!APP.usuarioActual();

    var html =
      '<section class="portada">' +
        '<div class="kicker">' + UI.esc(e.carrera) + '</div>' +
        '<h1>' + UI.esc(e.nombre) + '</h1>' +
        '<p>' + UI.esc(e.subtitulo) + ' de la ' + UI.esc(e.institucion) + '. ' +
        'Aqui encuentras las reglas de procedimiento, la guia del delegado y tu credencial digital.</p>' +
        '<span class="sello">' + UI.esc(e.edicion) + ' &middot; ' + UI.esc(e.anio) + ' &middot; ' + UI.esc(e.ciudad) + '</span>' +
      '</section>';

    if (!DB.hayConexion()) {
      html += UI.aviso('warn', 'Sistema en modo de solo lectura',
        'El portal todavia no esta conectado a la base de datos, asi que las credenciales y el control de comidas no funcionan aun. El contenido academico si esta disponible.');
    }

    html +=
      '<div class="rejilla">' +
        modulo('#/buscar',   '&#127915;', 'Mi credencial',       'Consulta tus datos y el estado de tus refrigerios y almuerzos.') +
        modulo('#/reglas',   '&#9878;',   'Reglas de procedimiento', 'Los dos sistemas, el flujo de una sesion y el glosario completo.') +
        modulo('#/guia',     '&#128218;', 'Guia del delegado',   'Protocolo, formas de tratamiento, vestimenta y consejos practicos.') +
        modulo('#/comites',  '&#127760;', 'Comites',             'Que comite es cual y que nivel de experiencia exige cada uno.') +
        modulo('#/datos',    '&#128161;', 'Curiosidades',        'Datos del mundo MUN que casi nadie conoce.') +
        modulo('#/staff',    '&#128274;', hayStaff ? 'Control de comidas' : 'Acceso staff',
               hayStaff ? 'Escanear credenciales, marcar entregas y ver el tablero.' : 'Solo para el equipo organizador de InterMUN.') +
      '</div>';

    UI.pintar(html);
  }

  function modulo(href, ico, titulo, desc) {
    return '<a class="modulo" href="' + href + '">' +
             '<span class="ico">' + ico + '</span>' +
             '<strong>' + UI.esc(titulo) + '</strong>' +
             '<span class="d">' + UI.esc(desc) + '</span>' +
           '</a>';
  }


  /* ============================================================
     QUIENES SOMOS + REGLAS
     ============================================================ */
  function reglas() {
    var html = '<h1>Reglas de procedimiento</h1>' +
               '<p class="silencio">' + UI.esc(C.reglas.intro) + '</p>';

    /* Los tres sistemas */
    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Los sistemas de reglas</h2></div>';
    C.reglas.sistemas.forEach(function (s) {
      html += '<details class="acordeon"><summary>' + UI.esc(s.t) + '</summary>' +
                '<div class="cuerpo">' + UI.esc(s.c) + '</div></details>';
    });
    html += '</div>';

    /* Flujo de la sesion */
    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Como transcurre una sesion</h2></div>' +
            '<div class="tabla-env"><table class="datos">' +
            '<thead><tr><th style="width:38px">#</th><th>Etapa</th><th>Que pasa</th></tr></thead><tbody>';
    C.reglas.flujo.forEach(function (f) {
      html += '<tr><td class="num"><b>' + f.n + '</b></td><td><b>' + UI.esc(f.t) + '</b></td><td>' + UI.esc(f.c) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    /* Glosario */
    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Glosario</h2>' +
            '<span class="sp"></span><input type="search" id="filtroGlosario" placeholder="Buscar termino..." style="max-width:210px">' +
            '</div>' +
            '<div class="tabla-env"><table class="datos" id="tablaGlosario">' +
            '<thead><tr><th>Termino</th><th>En ingles</th><th>Que significa</th></tr></thead><tbody>';
    C.reglas.glosario.forEach(function (g) {
      html += '<tr><td><b>' + UI.esc(g.es) + '</b></td><td class="silencio">' + UI.esc(g.en) + '</td><td>' + UI.esc(g.d) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    /* Frases */
    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Si escuchas esto en tu comite</h2></div>' +
            '<div class="tabla-env"><table class="datos">' +
            '<thead><tr><th>Frase</th><th>Significa</th></tr></thead><tbody>';
    C.reglas.frases.forEach(function (f) {
      html += '<tr><td><b>' + UI.esc(f.d) + '</b></td><td>' + UI.esc(f.s) + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    UI.pintar(html);

    var filtro = document.getElementById('filtroGlosario');
    filtro.addEventListener('input', function () {
      var t = filtro.value.toLowerCase();
      UI.qq('#tablaGlosario tbody tr').forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(t) >= 0 ? '' : 'none';
      });
    });
  }


  /* ============================================================
     GUIA DEL DELEGADO
     ============================================================ */
  function guia() {
    var html = '<h1>Guia del delegado</h1>';

    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Que es todo esto</h2></div>';
    C.quienesSomos.forEach(function (s) {
      html += '<details class="acordeon"><summary>' + UI.esc(s.t) + '</summary>' +
                '<div class="cuerpo">' + UI.esc(s.c) + '</div></details>';
    });
    html += '</div>';

    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Protocolo y etiqueta</h2></div>';
    C.protocolo.forEach(function (p) {
      html += '<details class="acordeon"><summary>' + UI.esc(p.t) + '</summary>' +
                '<div class="cuerpo">' + UI.esc(p.c) + '</div></details>';
    });
    html += '</div>';

    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Consejos practicos</h2></div><div class="rejilla">';
    C.tips.forEach(function (t) {
      html += '<div class="modulo" style="cursor:default">' +
                '<strong>' + UI.esc(t.t) + '</strong>' +
                '<span class="d">' + UI.esc(t.c) + '</span>' +
              '</div>';
    });
    html += '</div></div>';

    UI.pintar(html);
  }


  /* ============================================================
     COMITES
     ============================================================ */
  function comites() {
    var html = '<h1>Los comites</h1>' +
               '<p class="silencio">No todos exigen la misma experiencia. Esta es la referencia que usa el circuito.</p>' +
               '<div class="rejilla">';
    C.comites.forEach(function (c) {
      html += '<div class="modulo" style="cursor:default">' +
                '<span class="chip rol">' + UI.esc(c.nivel) + '</span>' +
                '<strong style="margin-top:.4rem">' + UI.esc(c.n) + '</strong>' +
                '<span class="d"><b>' + UI.esc(c.t) + '</b><br>' + UI.esc(c.d) + '</span>' +
              '</div>';
    });
    html += '</div>';
    UI.pintar(html);
  }


  /* ============================================================
     CURIOSIDADES
     ============================================================ */
  function curiosidades() {
    var html = '<h1>Curiosidades del mundo MUN</h1>' +
               '<p class="silencio">Datos que normalmente solo conoce quien lleva anos en el circuito.</p>';
    C.curiosidades.forEach(function (c) {
      html += '<div class="tarjeta"><h3>' + UI.esc(c.t) + '</h3><p>' + UI.esc(c.c) + '</p></div>';
    });
    UI.pintar(html);
  }


  /* ============================================================
     BUSCAR MI CREDENCIAL
     ============================================================ */
  function buscarCredencial() {
    UI.pintar(
      '<h1>Mi credencial</h1>' +
      '<div class="tarjeta angosto">' +
        '<p class="silencio">Escanea el codigo QR del reverso de tu credencial, o escribe aqui el codigo que aparece impreso en ella.</p>' +
        '<label class="campo"><span>Codigo de credencial</span>' +
          '<input type="text" id="codigoBuscar" placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001" autocomplete="off" autocapitalize="characters">' +
        '</label>' +
        '<button class="btn bloque" id="btnBuscar">Ver mi credencial</button>' +
      '</div>'
    );

    function ir() {
      var v = document.getElementById('codigoBuscar').value.trim().toUpperCase();
      if (!v) { UI.tostada('Escribe tu codigo', 'err'); return; }
      location.hash = '#/c/' + encodeURIComponent(v);
    }

    document.getElementById('btnBuscar').addEventListener('click', ir);
    document.getElementById('codigoBuscar').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') ir();
    });
  }


  /* ============================================================
     CREDENCIAL DEL DELEGADO
     Es la vista que abre el QR de la credencial.
     Si quien la abre es staff con sesion, ademas puede marcar
     las comidas desde aqui mismo.
     ============================================================ */
  function credencial(codigo) {
    if (!codigo) { buscarCredencial(); return; }

    if (!DB.hayConexion()) {
      UI.pintar('<div class="tarjeta">' +
        UI.aviso('warn', 'Sistema sin conectar', 'Las credenciales todavia no estan disponibles porque el sistema no fue configurado.') +
        '<a class="btn sec" href="#/">Volver al inicio</a></div>');
      return;
    }

    UI.cargando('Buscando la credencial...');

    var delegado = null, listaComidas = [], entregas = [];

    DB.delegados.porCodigo(codigo)
      .then(function (d) {
        if (!d) throw new Error('__no_existe__');
        delegado = d;
        return Promise.all([DB.comidas.activas(), DB.entregas.deDelegado(d.id)]);
      })
      .then(function (res) {
        listaComidas = res[0];
        entregas     = res[1];
        pintarCredencial();
        APP.abrirCanalVivo(function () {
          DB.entregas.deDelegado(delegado.id).then(function (e) {
            entregas = e;
            pintarCredencial();
          });
        });
      })
      .catch(function (e) {
        if (e.message === '__no_existe__') {
          UI.pintar('<div class="tarjeta angosto">' +
            UI.aviso('err', 'Credencial no encontrada',
              'No existe ninguna credencial con el codigo ' + codigo + '. Revisa que este bien escrito o acercate a la mesa de acreditacion.') +
            '<a class="btn sec" href="#/buscar">Intentar con otro codigo</a></div>');
        } else {
          UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
        }
      });


    function pintarCredencial() {
      var esStaff = !!APP.usuarioActual();
      var mapa = {};
      entregas.forEach(function (x) { mapa[x.comida_id] = x; });

      var entregadas = listaComidas.filter(function (c) { return mapa[c.id]; }).length;

      var html =
        '<div class="credencial">' +
          '<div class="cred-cod">' + UI.esc(delegado.codigo) + '</div>' +
          '<h2>' + UI.esc(delegado.nombre) + '</h2>' +
          '<span class="chip rol" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.25)">' +
            UI.esc(delegado.rol || 'delegado') + '</span>' +
          (delegado.activo ? '' : ' <span class="chip err">credencial inactiva</span>') +
          '<div class="cred-datos">' +
            dato('Pais que representa', delegado.pais) +
            dato('Comite', delegado.comite) +
            dato('Institucion', delegado.institucion) +
          '</div>' +
        '</div>';

      if (!delegado.activo) {
        html += UI.aviso('err', 'Credencial dada de baja',
          'Esta credencial fue desactivada por el Secretariado. Acercate a la mesa de acreditacion.');
      }

      /* Resumen */
      html +=
        '<div class="tarjeta">' +
          '<div class="tarjeta-tit"><h2>Refrigerios y almuerzos</h2><span class="sp"></span>' +
            '<span class="chip ' + (entregadas === listaComidas.length && listaComidas.length ? 'si' : 'no') + '">' +
              entregadas + ' de ' + listaComidas.length + '</span>' +
          '</div>';

      if (!listaComidas.length) {
        html += UI.vacio('&#127869;', 'Todavia no se cargo el cronograma de comidas del evento.');
      } else {
        var porDia = {};
        listaComidas.forEach(function (c) {
          if (!porDia[c.dia]) porDia[c.dia] = [];
          porDia[c.dia].push(c);
        });

        Object.keys(porDia).sort(function (a, b) { return a - b; }).forEach(function (dia) {
          html += '<h3 style="margin-top:.9rem">Dia ' + UI.esc(dia) + '</h3>';
          porDia[dia].forEach(function (c) {
            var e = mapa[c.id];
            html +=
              '<div class="comida-fila">' +
                '<span class="marca-est ' + (e ? 'si' : 'no') + '">' + (e ? '&#10003;' : '&#183;') + '</span>' +
                '<span class="info">' +
                  '<b>' + UI.esc(c.nombre) + '</b>' +
                  '<small>' + UI.esc(c.tipo) +
                    (e ? ' &middot; entregado ' + UI.hora(e.entregado_en) +
                         (e.estacion ? ' en ' + UI.esc(e.estacion) : '') : ' &middot; pendiente') +
                  '</small>' +
                '</span>' +
                (esStaff
                  ? (e
                      ? '<button class="btn sec chico" data-quitar="' + c.id + '">Deshacer</button>'
                      : '<button class="btn verde chico" data-marcar="' + c.id + '">Entregar</button>')
                  : '<span class="chip ' + (e ? 'si' : 'no') + '">' + (e ? 'entregado' : 'pendiente') + '</span>') +
              '</div>';
          });
        });
      }

      html += '</div>';

      if (esStaff) {
        html += '<div class="fila-btn no-imprimir">' +
                  '<a class="btn" href="#/escanear">Escanear la siguiente credencial</a>' +
                  '<a class="btn sec" href="#/tablero">Ver el tablero</a>' +
                '</div>';
      } else {
        html += '<div class="aviso info">' +
                  '<b>Como funciona</b>' +
                  'Cuando pases por la mesa de refrigerios, muestra el codigo QR del reverso de tu credencial. ' +
                  'El personal lo escanea y esta pantalla se actualiza sola.' +
                '</div>' +
                '<a class="btn sec" href="#/">Volver al portal</a>';
      }

      UI.pintar(html);

      if (esStaff) {
        UI.qq('[data-marcar]').forEach(function (b) {
          b.addEventListener('click', function () {
            b.disabled = true;
            var u = APP.usuarioActual();
            DB.entregas.marcar(delegado.id, b.dataset.marcar, u ? u.email : null, estacionGuardada())
              .then(function (r) {
                if (r.duplicado) UI.tostada('Esa comida ya habia sido entregada', 'err');
                else UI.tostada('Entrega registrada', 'ok');
                return DB.entregas.deDelegado(delegado.id);
              })
              .then(function (e) { entregas = e; pintarCredencial(); })
              .catch(function (err) { UI.tostada(UI.explicarError(err), 'err'); b.disabled = false; });
          });
        });

        UI.qq('[data-quitar]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (!UI.confirmar('Deshacer esta entrega? Se usa solo si fue marcada por error.')) return;
            b.disabled = true;
            DB.entregas.desmarcar(delegado.id, b.dataset.quitar)
              .then(function () {
                UI.tostada('Entrega deshecha', 'ok');
                return DB.entregas.deDelegado(delegado.id);
              })
              .then(function (e) { entregas = e; pintarCredencial(); })
              .catch(function (err) { UI.tostada(UI.explicarError(err), 'err'); b.disabled = false; });
          });
        });
      }
    }

    function dato(k, v) {
      if (!v) return '';
      return '<span class="cred-dato"><span class="k">' + UI.esc(k) + '</span>' +
             '<span class="v">' + UI.esc(v) + '</span></span>';
    }
  }


  /* Estacion elegida por el staff en este dispositivo */
  function estacionGuardada() {
    try { return localStorage.getItem('intermun_estacion') || null; } catch (e) { return null; }
  }


  return {
    inicio: inicio,
    reglas: reglas,
    guia: guia,
    comites: comites,
    curiosidades: curiosidades,
    credencial: credencial,
    buscarCredencial: buscarCredencial,
    estacionGuardada: estacionGuardada
  };
})();

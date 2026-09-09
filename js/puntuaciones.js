/* ==============================================================
   InterMUN UAGRM - Puntuaciones por foro
   --------------------------------------------------------------
   Los chairs otorgan puntos a cada delegado durante las sesiones,
   por criterio (discursos, mociones, negociacion, documento,
   resoluciones, conducta). Las puntuaciones son publicas: el
   ranking de cada foro se ve en el portal y se actualiza solo, y
   cada delegado ve las suyas en su credencial.

   Los foros son las mismas salas de chat de tipo "comite", asi no
   hay que mantener dos listas. El comite escrito en la credencial
   se empareja con el foro por nombre, sigla o clave.

   Accesibilidad: tablas con encabezados reales, region en vivo
   para anunciar cambios, botones con nombre completo para lector
   de pantalla, y nada que dependa solo del color.
   ============================================================== */
var PUNTOS = (function () {
  'use strict';

  /* ---------- Utilidades ---------- */
  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function coincide(foro, comiteDelegado) {
    if (!foro || !comiteDelegado || foro.tipo === 'general') return false;
    var a = normalizar(foro.comite || foro.nombre), b = normalizar(comiteDelegado);
    if (!a || !b) return false;
    if (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0) return true;
    var sigla = /\(([^)]+)\)/.exec(foro.comite || foro.nombre);
    if (sigla && normalizar(sigla[1]) === b) return true;
    if (foro.clave && normalizar(foro.clave) === b) return true;
    return false;
  }

  function criterios() { return (window.CONFIG && window.CONFIG.CRITERIOS_PUNTAJE) || []; }
  function criterio(clave) {
    return criterios().filter(function (c) { return c.clave === clave; })[0] ||
           { clave: clave, nombre: clave, max: 10, rapidos: [1, 2, 3] };
  }
  function sesiones() { return (window.CONFIG && window.CONFIG.SESIONES_PUNTAJE) || 6; }

  function soloForos(salas) {
    return (salas || []).filter(function (s) { return s.tipo !== 'general'; });
  }

  function foroDelDelegado(d, foros) {
    return foros.filter(function (f) { return coincide(f, d.comite); })[0] || null;
  }

  function delegadosDelForo(lista, foro) {
    return lista.filter(function (d) { return d.activo !== false && coincide(foro, d.comite); });
  }

  function num(n) {
    n = Number(n) || 0;
    return (Math.round(n * 10) / 10).toLocaleString('es-BO');
  }

  function siglaDe(foro) {
    var m = /\(([^)]+)\)/.exec(foro.comite || foro.nombre);
    return m ? m[1] : foro.nombre;
  }

  /* Ranking: filas ordenadas por total, con puesto (empates comparten puesto). */
  function ranking(delegados, lista) {
    var mapa = {};
    delegados.forEach(function (d) {
      mapa[d.id] = { delegado: d, total: 0, porCriterio: {}, n: 0, ultimo: null };
    });
    lista.forEach(function (p) {
      var r = mapa[p.delegado_id];
      if (!r) return;
      var v = Number(p.puntos) || 0;
      r.total += v;
      r.porCriterio[p.criterio] = (r.porCriterio[p.criterio] || 0) + v;
      r.n += 1;
      if (!r.ultimo || p.creado_en > r.ultimo) r.ultimo = p.creado_en;
    });
    var filas = Object.keys(mapa).map(function (k) { return mapa[k]; });
    filas.sort(function (a, b) {
      return (b.total - a.total) || String(a.delegado.pais || a.delegado.nombre).localeCompare(String(b.delegado.pais || b.delegado.nombre), 'es');
    });
    var puesto = 0, previo = null;
    filas.forEach(function (f, i) {
      if (previo === null || f.total !== previo) puesto = i + 1;
      f.puesto = puesto;
      previo = f.total;
    });
    return filas;
  }

  function medalla(puesto) {
    if (puesto === 1) return '<span class="puesto oro">1&#186;</span>';
    if (puesto === 2) return '<span class="puesto plata">2&#186;</span>';
    if (puesto === 3) return '<span class="puesto bronce">3&#186;</span>';
    return '<span class="puesto">' + puesto + '&#186;</span>';
  }

  function delegacion(d) {
    return '<b>' + UI.esc(d.pais || 'Sin país asignado') + '</b>' +
           '<small>' + UI.esc(d.nombre) + (d.institucion ? ' &middot; ' + UI.esc(d.institucion) : '') + '</small>';
  }


  /* ================================================================
     VISTA PUBLICA: lista de foros o ranking de un foro
     ================================================================ */
  function vista(claveForo) {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>Puntuaciones</h1>' +
        UI.aviso('warn', 'El sistema todavía no está conectado', 'Las puntuaciones no están disponibles porque falta configurar la base de datos.'));
      return;
    }
    if (claveForo) rankingForo(claveForo); else listaForos();
  }

  function listaForos() {
    UI.cargando('Cargando los foros');
    Promise.all([DB.chat.salasActivas(), DB.delegados.listar(), DB.puntos.todas()])
      .then(function (r) {
        var foros = soloForos(r[0]), delegados = r[1], todas = r[2];
        var html = '<h1>Puntuaciones en vivo</h1>' +
          '<p>Cada foro puntúa a sus delegaciones durante las sesiones. Las puntuaciones son públicas y se actualizan ' +
          'solas en esta pantalla y en la credencial de cada delegado. Elige un foro para ver su ranking.</p>';

        if (!foros.length) {
          html += UI.vacio('&#127942;', 'Todavía no hay foros abiertos. El Secretariado los habilita desde el panel de control.');
          UI.pintar(html);
          return;
        }

        html += '<ul class="rejilla" role="list">';
        foros.forEach(function (f) {
          var dels = delegadosDelForo(delegados, f);
          var puntosForo = todas.filter(function (p) { return p.foro === f.clave; });
          var top = ranking(dels, puntosForo)[0];
          var lider = top && top.total > 0
            ? 'Lidera ' + UI.esc(top.delegado.pais || top.delegado.nombre) + ' con ' + num(top.total) + ' puntos.'
            : 'Todavía sin puntuaciones.';
          html += '<li><a class="modulo" href="#/puntuaciones/' + encodeURIComponent(f.clave) + '">' +
                    '<span class="ico" aria-hidden="true">&#127942;</span>' +
                    '<strong>' + UI.esc(f.comite || f.nombre) + '</strong>' +
                    '<span class="d">' + dels.length + ' delegaciones &middot; ' + puntosForo.length + ' puntuaciones. ' + lider + '</span>' +
                  '</a></li>';
        });
        html += '</ul>';
        html += UI.aviso('info', 'Cómo se puntúa',
          'Los chairs de cada foro otorgan puntos por ' + criterios().map(function (c) { return c.nombre.toLowerCase(); }).join(', ') +
          '. Cada puntuación queda registrada con su sesión y quién la otorgó.');
        UI.pintar(html);
      })
      .catch(function (e) {
        UI.pintar('<h1>Puntuaciones</h1>' + UI.aviso('err', 'No se pudieron cargar los foros', UI.explicarError(e)));
      });
  }

  function rankingForo(clave) {
    UI.cargando('Cargando el ranking');
    var foro = null, delegados = [], lista = [];

    Promise.all([DB.chat.salaPorClave(clave), DB.delegados.listar()])
      .then(function (r) {
        foro = r[0];
        if (!foro || foro.tipo === 'general') throw new Error('__no_foro__');
        delegados = delegadosDelForo(r[1], foro);
        return DB.puntos.deForo(foro.clave);
      })
      .then(function (p) {
        lista = p;
        pintar(true);
        APP.registrarCanal(DB.puntos.escuchar(function () {
          DB.puntos.deForo(foro.clave).then(function (p2) {
            lista = p2;
            pintar(false);
            anunciar('Puntuaciones actualizadas.');
          });
        }));
      })
      .catch(function (e) {
        if (e.message === '__no_foro__') {
          UI.pintar('<h1>Puntuaciones</h1>' +
            UI.aviso('warn', 'Ese foro no existe o está cerrado', 'Vuelve a la lista para elegir otro.') +
            '<p><a class="btn sec" href="#/puntuaciones">Ver los foros</a></p>');
        } else {
          UI.pintar('<h1>Puntuaciones</h1>' + UI.aviso('err', 'No se pudo cargar el ranking', UI.explicarError(e)));
        }
      });

    function pintar(primera) {
      var filas = ranking(delegados, lista);
      var crits = criterios();
      var totalPuntos = lista.reduce(function (s, p) { return s + (Number(p.puntos) || 0); }, 0);
      var ultima = lista.length ? lista[0].creado_en : null;

      var html = '<p class="migas"><a href="#/puntuaciones">Puntuaciones</a> &rsaquo; ' + UI.esc(siglaDe(foro)) + '</p>' +
        '<h1>' + UI.esc(foro.comite || foro.nombre) + '</h1>' +
        '<p class="en-vivo"><span class="punto-vivo" aria-hidden="true"></span> En vivo: esta pantalla se actualiza sola cuando los chairs puntúan.</p>' +
        '<ul class="metricas" role="list">' +
          '<li class="metrica"><span class="n">' + filas.length + '</span><span class="e">Delegaciones</span></li>' +
          '<li class="metrica verde"><span class="n">' + lista.length + '</span><span class="e">Puntuaciones otorgadas</span></li>' +
          '<li class="metrica oro"><span class="n">' + num(totalPuntos) + '</span><span class="e">Puntos en juego</span></li>' +
          '<li class="metrica"><span class="n">' + (ultima ? UI.hora(ultima) : '&ndash;') + '</span><span class="e">Última actualización</span></li>' +
        '</ul>' +
        '<div id="anuncioPuntos" class="solo-lector" aria-live="polite"></div>';

      if (!filas.length) {
        html += UI.vacio('&#128100;', 'Todavía no hay delegaciones acreditadas en este foro.');
      } else {
        html += '<div class="tabla-env"><table class="datos ranking">' +
          '<caption class="solo-lector">Ranking de ' + UI.esc(foro.comite || foro.nombre) + '</caption>' +
          '<thead><tr><th scope="col">Puesto</th><th scope="col">Delegación</th><th scope="col" class="num">Total</th>';
        crits.forEach(function (c) { html += '<th scope="col" class="num"><abbr title="' + UI.esc(c.nombre) + '">' + UI.esc(corto(c.nombre)) + '</abbr></th>'; });
        html += '</tr></thead><tbody>';
        filas.forEach(function (f) {
          html += '<tr class="' + (f.puesto <= 3 && f.total > 0 ? 'podio' : '') + '">' +
            '<td>' + medalla(f.puesto) + '</td>' +
            '<td class="deleg">' + delegacion(f.delegado) +
              ' <a class="enlace-chico" href="#/c/' + encodeURIComponent(f.delegado.codigo) + '">Ver credencial<span class="solo-lector"> de ' + UI.esc(f.delegado.nombre) + '</span></a></td>' +
            '<td class="num total">' + num(f.total) + '</td>';
          crits.forEach(function (c) {
            var v = f.porCriterio[c.clave] || 0;
            html += '<td class="num">' + (v ? num(v) : '<span class="cero">&middot;</span>') + '</td>';
          });
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }

      if (lista.length) {
        html += '<details class="acordeon"><summary>Últimas puntuaciones otorgadas</summary><div class="cuerpo">' +
          '<ul class="historial" role="list">';
        lista.slice(0, 20).forEach(function (p) {
          var d = delegados.filter(function (x) { return x.id === p.delegado_id; })[0];
          html += '<li><b>' + signo(p.puntos) + '</b> ' +
            UI.esc(d ? (d.pais || d.nombre) : 'Delegación') + ' &middot; ' + UI.esc(criterio(p.criterio).nombre) +
            ' &middot; sesión ' + p.sesion + ' &middot; ' + UI.hora(p.creado_en) +
            (p.nota ? '<small>' + UI.esc(p.nota) + '</small>' : '') + '</li>';
        });
        html += '</ul></div></details>';
      }

      html += '<div class="fila-btn">' +
        '<a class="btn sec" href="#/puntuaciones">Ver otro foro</a>' +
        (APP.usuarioActual() ? '<a class="btn" href="#/puntuar/' + encodeURIComponent(foro.clave) + '">Puntuar en este foro</a>' : '') +
        '</div>';

      UI.pintar(html, { transitorio: !primera });
    }
  }

  function corto(nombre) {
    var partes = String(nombre).split(' ');
    return partes[0];
  }

  function signo(v) {
    v = Number(v) || 0;
    return (v > 0 ? '+' : '') + num(v);
  }

  function anunciar(t) {
    var a = document.getElementById('anuncioPuntos');
    if (a) { a.textContent = ''; setTimeout(function () { a.textContent = t; }, 50); }
  }


  /* ================================================================
     SECCION PARA LA CREDENCIAL: "Mis puntuaciones"
     Devuelve HTML listo; la credencial ya cargo delegado, foros y
     puntos del delegado y del foro.
     ================================================================ */
  function seccionCredencial(delegado, foros, misPuntos, puntosForo, delegadosForo) {
    var foro = foroDelDelegado(delegado, foros);
    var html = '<section aria-labelledby="t-puntos"><h2 id="t-puntos">Mis puntuaciones</h2>';

    if (!foro) {
      html += '<p>Tu credencial no tiene un foro asignado todavía. Cuando el Secretariado lo asigne, aquí verás tus puntos.</p></section>';
      return html;
    }

    var total = misPuntos.reduce(function (s, p) { return s + (Number(p.puntos) || 0); }, 0);
    var filas = ranking(delegadosForo, puntosForo);
    var mia = filas.filter(function (f) { return f.delegado.id === delegado.id; })[0];
    var puesto = mia ? mia.puesto : null;

    html += '<div class="resumen-puntos">' +
      '<div class="total-puntos"><span class="n">' + num(total) + '</span><span class="e">puntos en ' + UI.esc(siglaDe(foro)) + '</span></div>' +
      '<div class="puesto-puntos">' + (puesto && total > 0 ? medalla(puesto) + '<span class="e">de ' + filas.length + ' delegaciones</span>' : '<span class="e">Todavía sin puntuaciones en este foro.</span>') + '</div>' +
      '</div>';

    var crits = criterios();
    var maxCrit = 1;
    crits.forEach(function (c) { var v = mia ? (mia.porCriterio[c.clave] || 0) : 0; if (v > maxCrit) maxCrit = v; });
    html += '<ul class="barras-puntos" role="list">';
    crits.forEach(function (c) {
      var v = mia ? (mia.porCriterio[c.clave] || 0) : 0;
      var pct = Math.max(0, Math.min(100, Math.round((v / maxCrit) * 100)));
      html += '<li><span class="et">' + UI.esc(c.nombre) + '</span>' +
        '<span class="barra-p" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
        '<span class="v">' + num(v) + '<span class="solo-lector"> puntos</span></span></li>';
    });
    html += '</ul>';

    if (misPuntos.length) {
      html += '<details class="acordeon"><summary>Detalle de mis puntuaciones (' + misPuntos.length + ')</summary><div class="cuerpo"><ul class="historial" role="list">';
      misPuntos.slice(0, 30).forEach(function (p) {
        html += '<li><b>' + signo(p.puntos) + '</b> ' + UI.esc(criterio(p.criterio).nombre) + ' &middot; sesión ' + p.sesion + ' &middot; ' + UI.fechaHora(p.creado_en) +
          (p.nota ? '<small>' + UI.esc(p.nota) + '</small>' : '') + '</li>';
      });
      html += '</ul></div></details>';
    }

    html += '<p><a class="btn sec" href="#/puntuaciones/' + encodeURIComponent(foro.clave) + '">Ver el ranking completo de ' + UI.esc(siglaDe(foro)) + '</a></p></section>';
    return html;
  }


  /* ================================================================
     PANEL DEL STAFF: otorgar y corregir puntuaciones
     ================================================================ */
  function panel(claveForo) {
    UI.cargando('Cargando los foros');
    Promise.all([DB.chat.salasActivas(), DB.delegados.listar()])
      .then(function (r) {
        var foros = soloForos(r[0]), delegados = r[1];
        if (!foros.length) {
          UI.pintar('<h1>Puntuar a los delegados</h1>' +
            UI.vacio('&#127942;', 'Primero abre las salas de los foros desde "Salas de chat": los foros de puntuación son los mismos.') +
            '<p><a class="btn" href="#/salas">Ir a salas de chat</a></p>');
          return;
        }
        var foro = foros.filter(function (f) { return f.clave === claveForo; })[0];
        if (!foro) { elegirForo(foros, delegados); return; }
        panelForo(foro, delegadosDelForo(delegados, foro));
      })
      .catch(function (e) {
        UI.pintar('<h1>Puntuar</h1>' + UI.aviso('err', 'No se pudo cargar', UI.explicarError(e)));
      });
  }

  function elegirForo(foros, delegados) {
    var html = '<h1>Puntuar a los delegados</h1>' +
      '<p>Elige el foro que estás presidiendo. Cada puntuación se publica al instante en el ranking y en la credencial del delegado.</p>' +
      '<ul class="rejilla" role="list">';
    foros.forEach(function (f) {
      var n = delegadosDelForo(delegados, f).length;
      html += '<li><a class="modulo" href="#/puntuar/' + encodeURIComponent(f.clave) + '">' +
        '<span class="ico" aria-hidden="true">&#127942;</span><strong>' + UI.esc(f.comite || f.nombre) + '</strong>' +
        '<span class="d">' + n + ' delegaciones acreditadas</span></a></li>';
    });
    html += '</ul>';
    UI.pintar(html);
  }

  function panelForo(foro, delegados) {
    var lista = [];
    var sesionActual = parseInt(localStorage.getItem('intermun_sesion_puntaje') || '1', 10) || 1;
    var seleccionado = null;

    DB.puntos.deForo(foro.clave).then(function (p) {
      lista = p;
      pintar(true);
      APP.registrarCanal(DB.puntos.escuchar(function () {
        DB.puntos.deForo(foro.clave).then(function (p2) { lista = p2; pintarTabla(); });
      }));
    });

    function pintar(primera) {
      var crits = criterios();
      var html = '<p class="migas"><a href="#/puntuar">Puntuar</a> &rsaquo; ' + UI.esc(siglaDe(foro)) + '</p>' +
        '<h1>Puntuar: ' + UI.esc(foro.comite || foro.nombre) + '</h1>' +
        '<p>Toca una delegación de la tabla, elige el criterio y los puntos. Se publica al instante.</p>';

      if (!delegados.length) {
        html += UI.vacio('&#128100;', 'No hay delegaciones acreditadas con este comité. Revisa que el comité de cada credencial coincida con el nombre del foro.') +
          '<p><a class="btn sec" href="#/delegados">Ir a delegados</a></p>';
        UI.pintar(html);
        return;
      }

      html += '<div class="tarjeta formulario-puntos" id="formPuntos">' +
        '<div class="fila-campos">' +
          '<label class="campo" for="ptDelegado"><span>Delegación</span><select id="ptDelegado">' +
            '<option value="">Elige una delegación</option>' +
            delegados.slice().sort(function (a, b) { return String(a.pais || a.nombre).localeCompare(String(b.pais || b.nombre), 'es'); })
              .map(function (d) { return '<option value="' + d.id + '">' + UI.esc((d.pais || 'Sin país') + ' · ' + d.nombre) + '</option>'; }).join('') +
          '</select></label>' +
          '<label class="campo" for="ptCriterio"><span>Criterio</span><select id="ptCriterio">' +
            crits.map(function (c) { return '<option value="' + c.clave + '">' + UI.esc(c.nombre) + ' (máx. ' + c.max + ')</option>'; }).join('') +
          '</select></label>' +
          '<label class="campo" for="ptSesion"><span>Sesión</span><select id="ptSesion">' +
            (function () { var o = ''; for (var i = 1; i <= sesiones(); i++) o += '<option value="' + i + '"' + (i === sesionActual ? ' selected' : '') + '>Sesión ' + i + '</option>'; return o; })() +
          '</select></label>' +
        '</div>' +
        '<p class="ayuda-campo" id="ptCritAyuda">' + UI.esc(crits[0] ? crits[0].d : '') + '</p>' +
        '<div class="rapidos" id="ptRapidos" role="group" aria-label="Puntos rápidos"></div>' +
        '<div class="fila-campos">' +
          '<label class="campo" for="ptPuntos"><span>Puntos (o escribe otro valor)</span><input type="number" id="ptPuntos" step="0.5" min="-20" max="100" value="1"></label>' +
          '<label class="campo" for="ptNota"><span>Nota, opcional</span><input type="text" id="ptNota" maxlength="140" placeholder="Por ejemplo: discurso de apertura"></label>' +
        '</div>' +
        '<button type="button" class="btn grande" id="btnOtorgar">Otorgar puntos</button>' +
        '</div>';

      html += '<div id="anuncioPuntos" class="solo-lector" aria-live="polite"></div>' +
        '<div id="tablaPuntos"></div>';

      UI.pintar(html, { transitorio: !primera });
      pintarTabla();
      enlazar();
    }

    function pintarTabla() {
      var cont = document.getElementById('tablaPuntos');
      if (!cont) return;
      var filas = ranking(delegados, lista);
      var crits = criterios();
      var html = '<h2>Ranking en vivo</h2><div class="tabla-env"><table class="datos ranking">' +
        '<caption class="solo-lector">Ranking del foro</caption>' +
        '<thead><tr><th scope="col">Puesto</th><th scope="col">Delegación</th><th scope="col" class="num">Total</th>';
      crits.forEach(function (c) { html += '<th scope="col" class="num"><abbr title="' + UI.esc(c.nombre) + '">' + UI.esc(corto(c.nombre)) + '</abbr></th>'; });
      html += '<th scope="col">Acción</th></tr></thead><tbody>';
      filas.forEach(function (f) {
        html += '<tr' + (seleccionado === f.delegado.id ? ' class="elegida"' : '') + '><td>' + medalla(f.puesto) + '</td>' +
          '<td class="deleg">' + delegacion(f.delegado) + '</td>' +
          '<td class="num total">' + num(f.total) + '</td>';
        crits.forEach(function (c) { var v = f.porCriterio[c.clave] || 0; html += '<td class="num">' + (v ? num(v) : '<span class="cero">&middot;</span>') + '</td>'; });
        html += '<td><button type="button" class="btn sec chico" data-elegir="' + f.delegado.id + '">Puntuar<span class="solo-lector"> a ' + UI.esc(f.delegado.pais || f.delegado.nombre) + '</span></button></td></tr>';
      });
      html += '</tbody></table></div>';

      html += '<h2>Últimas puntuaciones</h2>';
      if (!lista.length) {
        html += '<p>Todavía no se otorgó ninguna puntuación en este foro.</p>';
      } else {
        html += '<ul class="historial" role="list">';
        lista.slice(0, 25).forEach(function (p) {
          var d = delegados.filter(function (x) { return x.id === p.delegado_id; })[0];
          html += '<li><b>' + signo(p.puntos) + '</b> ' + UI.esc(d ? (d.pais || d.nombre) : 'Delegación') + ' &middot; ' +
            UI.esc(criterio(p.criterio).nombre) + ' &middot; sesión ' + p.sesion + ' &middot; ' + UI.hora(p.creado_en) +
            (p.otorgado_por ? ' &middot; ' + UI.esc(p.otorgado_por) : '') +
            (p.nota ? '<small>' + UI.esc(p.nota) + '</small>' : '') +
            ' <button type="button" class="btn rojo chico" data-quitar="' + p.id + '">Quitar<span class="solo-lector"> esta puntuación de ' + UI.esc(d ? (d.pais || d.nombre) : '') + '</span></button></li>';
        });
        html += '</ul>';
      }
      cont.innerHTML = html;

      UI.qq('[data-elegir]', cont).forEach(function (b) {
        b.addEventListener('click', function () {
          seleccionado = b.dataset.elegir;
          UI.q('#ptDelegado').value = seleccionado;
          UI.qq('#tablaPuntos tr').forEach(function (tr) { tr.classList.remove('elegida'); });
          b.closest('tr').classList.add('elegida');
          document.getElementById('formPuntos').scrollIntoView({ block: 'start' });
          UI.q('#ptCriterio').focus();
        });
      });
      UI.qq('[data-quitar]', cont).forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('¿Quitar esta puntuación? Se borra del ranking al instante.')) return;
          b.disabled = true;
          DB.puntos.quitar(b.dataset.quitar)
            .then(function () { return DB.puntos.deForo(foro.clave); })
            .then(function (p) { lista = p; pintarTabla(); UI.tostada('Puntuación quitada.', 'ok'); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); b.disabled = false; });
        });
      });
    }

    function pintarRapidos() {
      var c = criterio(UI.q('#ptCriterio').value);
      UI.q('#ptCritAyuda').textContent = c.d || '';
      UI.q('#ptRapidos').innerHTML = (c.rapidos || []).map(function (v) {
        return '<button type="button" class="btn ' + (v < 0 ? 'rojo' : 'sec') + '" data-rapido="' + v + '">' + signo(v) + '<span class="solo-lector"> puntos</span></button>';
      }).join('');
      UI.qq('[data-rapido]').forEach(function (b) {
        b.addEventListener('click', function () { UI.q('#ptPuntos').value = b.dataset.rapido; otorgar(); });
      });
    }

    function enlazar() {
      pintarRapidos();
      UI.q('#ptCriterio').addEventListener('change', pintarRapidos);
      UI.q('#ptDelegado').addEventListener('change', function () { seleccionado = UI.q('#ptDelegado').value || null; });
      UI.q('#ptSesion').addEventListener('change', function () {
        sesionActual = parseInt(UI.q('#ptSesion').value, 10) || 1;
        try { localStorage.setItem('intermun_sesion_puntaje', String(sesionActual)); } catch (e) {}
      });
      UI.q('#btnOtorgar').addEventListener('click', otorgar);
    }

    function otorgar() {
      var delegadoId = UI.q('#ptDelegado').value;
      var crit = UI.q('#ptCriterio').value;
      var pts = parseFloat(UI.q('#ptPuntos').value);
      var sesion = parseInt(UI.q('#ptSesion').value, 10) || 1;
      var nota = UI.q('#ptNota').value.trim();
      if (!delegadoId) { UI.tostada('Elige primero la delegación.', 'err'); UI.q('#ptDelegado').focus(); return; }
      if (isNaN(pts) || pts === 0) { UI.tostada('Indica cuántos puntos.', 'err'); UI.q('#ptPuntos').focus(); return; }
      var c = criterio(crit);
      if (pts > c.max && !UI.confirmar('Ese valor supera el máximo sugerido de ' + c.max + ' para ' + c.nombre + '. ¿Otorgarlo igual?')) return;
      var u = APP.usuarioActual();
      var btn = UI.q('#btnOtorgar'); btn.disabled = true;
      DB.puntos.otorgar({ delegado_id: delegadoId, foro: foro.clave, criterio: crit, puntos: pts, sesion: sesion, nota: nota || null, otorgado_por: u ? u.email : null })
        .then(function () {
          var d = delegados.filter(function (x) { return x.id === delegadoId; })[0];
          UI.tostada(signo(pts) + ' para ' + (d ? (d.pais || d.nombre) : 'la delegación') + '.', 'ok');
          anunciar('Puntuación registrada.');
          UI.q('#ptNota').value = '';
          return DB.puntos.deForo(foro.clave);
        })
        .then(function (p) { lista = p; pintarTabla(); })
        .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); })
        .then(function () { btn.disabled = false; });
    }
  }


  return {
    vista: vista,
    panel: panel,
    seccionCredencial: seccionCredencial,
    soloForos: soloForos,
    foroDelDelegado: foroDelDelegado,
    delegadosDelForo: delegadosDelForo
  };
})();

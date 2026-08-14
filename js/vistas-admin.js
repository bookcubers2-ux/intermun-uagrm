/* ==============================================================
   InterMUN UAGRM - Modulo de control (staff)
   ============================================================== */

window.ADMIN = (function () {

  var escanerActivo = null;     // instancia del lector de QR

  /* ============================================================
     INICIO DE SESION
     ============================================================ */
  function login(motivo) {
    if (!DB.hayConexion()) { sinConfigurar(); return; }

    UI.pintar(
      '<h1>Acceso del staff</h1>' +
      (motivo ? UI.aviso('info', null, motivo) : '') +
      '<div class="tarjeta angosto">' +
        '<label class="campo"><span>Correo</span>' +
          '<input type="email" id="correo" autocomplete="username" placeholder="tu.correo@ejemplo.com"></label>' +
        '<label class="campo"><span>Contrasena</span>' +
          '<input type="password" id="clave" autocomplete="current-password"></label>' +
        '<button class="btn bloque" id="btnEntrar">Iniciar sesion</button>' +
        '<p class="silencio" style="margin-top:.8rem">Las cuentas del staff las crea el Secretariado desde el panel de Supabase. ' +
        'Si no tienes una, pidesela a quien administra el sistema.</p>' +
      '</div>'
    );

    function entrar() {
      var c = UI.q('#correo').value.trim();
      var k = UI.q('#clave').value;
      if (!c || !k) { UI.tostada('Completa correo y contrasena', 'err'); return; }
      var b = UI.q('#btnEntrar');
      b.disabled = true; b.textContent = 'Verificando...';
      DB.sesion.entrar(c, k)
        .then(function (u) {
          APP.fijarUsuario(u);
          UI.tostada('Bienvenido', 'ok');
          location.hash = '#/staff';
        })
        .catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false; b.textContent = 'Iniciar sesion';
        });
    }

    UI.q('#btnEntrar').addEventListener('click', entrar);
    UI.q('#clave').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') entrar(); });
  }


  /* ============================================================
     PANEL PRINCIPAL DEL STAFF
     ============================================================ */
  function panel() {
    if (!DB.hayConexion()) { sinConfigurar(); return; }
    if (!APP.usuarioActual()) { login(); return; }

    var est = VISTAS.estacionGuardada();

    UI.pintar(
      '<h1>Control de InterMUN</h1>' +
      '<p class="silencio">Sesion iniciada como ' + UI.esc(APP.usuarioActual().email) +
      (est ? ' &middot; estacion: <b>' + UI.esc(est) + '</b>' : '') + '</p>' +
      '<div class="rejilla">' +
        mod('#/escanear',  '&#128247;', 'Escanear credencial', 'Modo rapido para la fila de refrigerios: escanea y marca al instante.') +
        mod('#/tablero',   '&#128202;', 'Tablero en vivo',     'Cuantos recibieron cada comida, en tiempo real, y exportar a Excel.') +
        mod('#/delegados', '&#128100;', 'Delegados',           'Cargar la lista, editar datos y dar de baja credenciales.') +
        mod('#/comidas',   '&#127869;', 'Comidas',             'Definir los refrigerios y almuerzos de cada dia.') +
        mod('#/qr',        '&#128290;', 'Generar los QR',      'Crear e imprimir los codigos que van al reverso de cada credencial.') +
        mod('#/ajustes',   '&#9881;',   'Ajustes',             'Elegir tu estacion de entrega y revisar el estado del sistema.') +
      '</div>'
    );
  }

  function mod(href, ico, t, d) {
    return '<a class="modulo" href="' + href + '">' +
             '<span class="ico">' + ico + '</span><strong>' + UI.esc(t) + '</strong>' +
             '<span class="d">' + UI.esc(d) + '</span></a>';
  }


  /* ============================================================
     ESCANER
     ============================================================ */
  function escanear() {
    detenerEscaner();

    UI.cargando('Preparando el escaner...');

    DB.comidas.activas().then(function (comidas) {
      if (!comidas.length) {
        UI.pintar('<h1>Escanear</h1>' +
          UI.aviso('warn', 'No hay comidas cargadas',
            'Primero define los refrigerios y almuerzos del evento para poder marcarlos.') +
          '<a class="btn" href="#/comidas">Ir a Comidas</a>');
        return;
      }

      var guardada = null;
      try { guardada = localStorage.getItem('intermun_comida_activa'); } catch (e) {}
      var elegida = comidas.filter(function (c) { return c.id === guardada; })[0] || comidas[0];

      var opciones = comidas.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === elegida.id ? ' selected' : '') + '>' +
               'Dia ' + c.dia + ' &middot; ' + UI.esc(c.nombre) + '</option>';
      }).join('');

      UI.pintar(
        '<h1>Escanear credencial</h1>' +
        '<div class="tarjeta">' +
          '<label class="campo"><span>Comida que estas entregando ahora</span>' +
            '<select id="selComida">' + opciones + '</select></label>' +
          '<div class="fila-btn">' +
            '<button class="btn verde" id="btnCam">Encender camara</button>' +
            '<button class="btn sec" id="btnApagar" disabled>Apagar</button>' +
          '</div>' +
          '<div class="escaner-caja" style="margin-top:.8rem"><div id="lector"></div></div>' +
        '</div>' +

        '<div class="tarjeta">' +
          '<div class="tarjeta-tit"><h3>O busca a mano</h3></div>' +
          '<label class="campo"><span>Codigo de credencial</span>' +
            '<input type="text" id="codManual" placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001" autocomplete="off" autocapitalize="characters"></label>' +
          '<button class="btn bloque" id="btnManual">Registrar entrega</button>' +
        '</div>' +

        '<div id="resultado" class="resultado-scan"></div>' +
        '<div class="tarjeta"><div class="tarjeta-tit"><h3>Entregas de esta sesion</h3>' +
          '<span class="sp"></span><span class="chip si" id="contador">0</span></div>' +
          '<div id="historial">' + UI.vacio('&#128220;', 'Todavia no registraste ninguna entrega.') + '</div>' +
        '</div>'
      );

      var historial = [];

      UI.q('#selComida').addEventListener('change', function () {
        try { localStorage.setItem('intermun_comida_activa', this.value); } catch (e) {}
      });

      UI.q('#btnCam').addEventListener('click', encenderCamara);
      UI.q('#btnApagar').addEventListener('click', function () {
        detenerEscaner();
        UI.q('#btnCam').disabled = false;
        UI.q('#btnApagar').disabled = true;
      });

      UI.q('#btnManual').addEventListener('click', function () {
        var v = UI.q('#codManual').value.trim().toUpperCase();
        if (!v) { UI.tostada('Escribe un codigo', 'err'); return; }
        procesar(v);
        UI.q('#codManual').value = '';
      });
      UI.q('#codManual').addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') UI.q('#btnManual').click();
      });


      /* ---------- Camara ---------- */
      function encenderCamara() {
        UI.q('#btnCam').disabled = true;
        cargarLibreriaEscaner().then(function () {
          try {
            escanerActivo = new Html5Qrcode('lector', { verbose: false });
            escanerActivo.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: { width: 240, height: 240 } },
              function (texto) { procesar(texto); },
              function () {}
            ).then(function () {
              UI.q('#btnApagar').disabled = false;
              UI.tostada('Camara lista. Apunta al QR de la credencial.', 'ok');
            }).catch(function (e) {
              UI.q('#btnCam').disabled = false;
              UI.tostada('No se pudo abrir la camara: ' + (e.message || e), 'err');
            });
          } catch (e) {
            UI.q('#btnCam').disabled = false;
            UI.tostada('Este navegador no permite usar la camara aqui.', 'err');
          }
        }).catch(function () {
          UI.q('#btnCam').disabled = false;
          UI.tostada('No se pudo cargar el escaner.', 'err');
        });
      }


      /* ---------- Procesar un codigo leido ---------- */
      var ultimo = '', ultimoMomento = 0;

      function procesar(texto) {
        var codigo = extraerCodigo(texto);
        var ahora = Date.now();
        /* Evita registrar mil veces el mismo QR mientras sigue frente a la camara */
        if (codigo === ultimo && ahora - ultimoMomento < 2500) return;
        ultimo = codigo; ultimoMomento = ahora;

        var comidaId = UI.q('#selComida').value;
        var comida   = comidas.filter(function (c) { return c.id === comidaId; })[0];
        var u        = APP.usuarioActual();

        DB.delegados.porCodigo(codigo).then(function (d) {
          if (!d) {
            pitar(false);
            mostrar('err', 'Credencial desconocida', 'El codigo ' + codigo + ' no esta en la lista de acreditados.');
            return;
          }
          if (!d.activo) {
            pitar(false);
            mostrar('err', 'Credencial dada de baja', UI.esc(d.nombre) + ' tiene la credencial desactivada.');
            return;
          }
          return DB.entregas.marcar(d.id, comidaId, u ? u.email : null, VISTAS.estacionGuardada())
            .then(function (r) {
              if (r.duplicado) {
                pitar(false);
                mostrar('warn', 'Ya habia recibido esta comida',
                  UI.esc(d.nombre) + ' ya tiene registrado el ' + UI.esc(comida.nombre) + ' del dia ' + comida.dia + '.', d);
              } else {
                pitar(true);
                mostrar('ok', 'Entrega registrada',
                  UI.esc(d.nombre) + ' &middot; ' + UI.esc(comida.nombre) + ' dia ' + comida.dia, d);
                historial.unshift({ nombre: d.nombre, codigo: d.codigo, hora: new Date().toISOString() });
                pintarHistorial();
              }
            });
        }).catch(function (e) {
          pitar(false);
          mostrar('err', 'Error', UI.explicarError(e));
        });
      }

      function mostrar(tipo, titulo, texto, d) {
        var extra = '';
        if (d) {
          extra = '<div class="fila-btn" style="margin-top:.5rem">' +
                    '<a class="btn sec chico" href="#/c/' + encodeURIComponent(d.codigo) + '">Ver credencial completa</a>' +
                  '</div>';
        }
        UI.q('#resultado').innerHTML =
          '<div class="aviso ' + tipo + '"><b>' + titulo + '</b>' + texto + extra + '</div>';
      }

      function pintarHistorial() {
        UI.q('#contador').textContent = historial.length;
        if (!historial.length) return;
        UI.q('#historial').innerHTML =
          '<div class="tabla-env"><table class="datos"><thead><tr>' +
          '<th>Hora</th><th>Codigo</th><th>Nombre</th></tr></thead><tbody>' +
          historial.slice(0, 40).map(function (h) {
            return '<tr><td class="mono">' + UI.hora(h.hora) + '</td>' +
                   '<td class="mono">' + UI.esc(h.codigo) + '</td>' +
                   '<td>' + UI.esc(h.nombre) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    }).catch(function (e) {
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
    });
  }


  /* Del texto del QR saca el codigo de credencial */
  function extraerCodigo(texto) {
    var t = String(texto || '').trim();
    var m = /#\/c\/([^/?&#\s]+)/.exec(t);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    m = /([A-Za-z]{1,6}-\d{2,6})\s*$/.exec(t);
    if (m) return m[1].toUpperCase();
    return t.toUpperCase();
  }


  /* Sonido corto de confirmacion (importante en una fila ruidosa) */
  function pitar(exito) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = exito ? 880 : 240;
      o.type = 'sine';
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (exito ? 0.16 : 0.36));
      o.start();
      o.stop(ctx.currentTime + (exito ? 0.18 : 0.4));
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 700);
    } catch (e) {}
    if (navigator.vibrate) navigator.vibrate(exito ? 60 : [60, 60, 60]);
  }


  function cargarLibreriaEscaner() {
    if (window.Html5Qrcode) return Promise.resolve();
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = 'js/vendor/html5-qrcode.min.js';
      s.onload = ok; s.onerror = mal;
      document.head.appendChild(s);
    });
  }

  function detenerEscaner() {
    if (!escanerActivo) return;
    try { escanerActivo.stop().then(function () { try { escanerActivo.clear(); } catch (e) {} }); } catch (e) {}
    escanerActivo = null;
  }


  /* ============================================================
     TABLERO EN VIVO
     ============================================================ */
  function tablero() {
    UI.cargando('Cargando el tablero...');

    var delegados = [], comidas = [], entregas = [];

    function traer() {
      return Promise.all([DB.delegados.listar(), DB.comidas.activas(), DB.entregas.listar()])
        .then(function (r) { delegados = r[0]; comidas = r[1]; entregas = r[2]; });
    }

    traer().then(function () {
      pintar();
      APP.abrirCanalVivo(function () { traer().then(pintar); });
    }).catch(function (e) {
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
    });

    function pintar() {
      var activos = delegados.filter(function (d) { return d.activo; });
      var porComida = {};
      entregas.forEach(function (e) { porComida[e.comida_id] = (porComida[e.comida_id] || 0) + 1; });

      var html = '<h1>Tablero en vivo</h1>' +
                 '<p class="silencio">Se actualiza solo cuando cualquier estacion registra una entrega.</p>';

      html += '<div class="metricas">' +
                met(activos.length, 'Acreditados activos', '') +
                met(comidas.length, 'Comidas programadas', 'oro') +
                met(entregas.length, 'Entregas registradas', 'verde') +
              '</div>';

      if (!comidas.length) {
        html += UI.vacio('&#127869;', 'Todavia no hay comidas cargadas.');
        UI.pintar(html);
        return;
      }

      html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Avance por comida</h2></div>';
      comidas.forEach(function (c) {
        var n = porComida[c.id] || 0;
        var pct = activos.length ? Math.round(n * 100 / activos.length) : 0;
        html += '<div style="margin-bottom:.85rem">' +
                  '<div style="display:flex;align-items:baseline;gap:.5rem">' +
                    '<b>Dia ' + c.dia + ' &middot; ' + UI.esc(c.nombre) + '</b>' +
                    '<span class="sp" style="flex:1"></span>' +
                    '<span class="mono">' + n + ' / ' + activos.length + '</span>' +
                    '<span class="chip ' + (pct >= 90 ? 'si' : pct > 0 ? 'ojo' : 'no') + '">' + pct + '%</span>' +
                  '</div>' +
                  '<div class="progreso"><i style="width:' + pct + '%"></i></div>' +
                '</div>';
      });
      html += '</div>';

      /* Quien falta por la comida seleccionada */
      html += '<div class="tarjeta">' +
                '<div class="tarjeta-tit"><h2>Quien falta</h2><span class="sp"></span>' +
                  '<select id="selFalta" style="max-width:230px">' +
                    comidas.map(function (c) {
                      return '<option value="' + c.id + '">Dia ' + c.dia + ' &middot; ' + UI.esc(c.nombre) + '</option>';
                    }).join('') +
                  '</select>' +
                '</div><div id="listaFalta"></div></div>';

      html += '<div class="fila-btn no-imprimir">' +
                '<button class="btn" id="btnCSV">Exportar todo a Excel (CSV)</button>' +
                '<a class="btn sec" href="#/escanear">Ir a escanear</a>' +
              '</div>';

      UI.pintar(html);

      var sel = UI.q('#selFalta');
      sel.addEventListener('change', pintarFaltantes);
      pintarFaltantes();

      function pintarFaltantes() {
        var cid = sel.value;
        var yaRecibio = {};
        entregas.forEach(function (e) { if (e.comida_id === cid) yaRecibio[e.delegado_id] = true; });
        var faltan = activos.filter(function (d) { return !yaRecibio[d.id]; });

        if (!faltan.length) {
          UI.q('#listaFalta').innerHTML = UI.aviso('ok', 'Nadie falta', 'Todos los acreditados activos recibieron esta comida.');
          return;
        }
        UI.q('#listaFalta').innerHTML =
          '<p class="silencio">' + faltan.length + ' persona(s) todavia no reciben esta comida.</p>' +
          '<div class="tabla-env"><table class="datos"><thead><tr>' +
          '<th>Codigo</th><th>Nombre</th><th>Comite</th><th>Institucion</th></tr></thead><tbody>' +
          faltan.map(function (d) {
            return '<tr><td class="mono"><a href="#/c/' + encodeURIComponent(d.codigo) + '">' + UI.esc(d.codigo) + '</a></td>' +
                   '<td>' + UI.esc(d.nombre) + '</td><td>' + UI.esc(d.comite || '') + '</td>' +
                   '<td>' + UI.esc(d.institucion || '') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }

      UI.q('#btnCSV').addEventListener('click', function () {
        var enc = ['Codigo', 'Nombre', 'Pais', 'Comite', 'Institucion', 'Rol', 'Activo'];
        comidas.forEach(function (c) { enc.push('D' + c.dia + ' ' + c.nombre); });
        enc.push('Total recibidas');

        var mapa = {};
        entregas.forEach(function (e) {
          if (!mapa[e.delegado_id]) mapa[e.delegado_id] = {};
          mapa[e.delegado_id][e.comida_id] = e;
        });

        var filas = delegados.map(function (d) {
          var f = [d.codigo, d.nombre, d.pais || '', d.comite || '', d.institucion || '', d.rol || '', d.activo ? 'si' : 'no'];
          var total = 0;
          comidas.forEach(function (c) {
            var e = mapa[d.id] && mapa[d.id][c.id];
            if (e) { total++; f.push(UI.fechaHora(e.entregado_en)); }
            else f.push('');
          });
          f.push(total);
          return f;
        });

        var fecha = new Date().toISOString().slice(0, 10);
        UI.descargar('intermun-control-comidas-' + fecha + '.csv', UI.aCSV(enc, filas));
        UI.tostada('Archivo descargado', 'ok');
      });
    }

    function met(n, etiqueta, clase) {
      return '<div class="metrica ' + (clase || '') + '"><div class="n">' + n + '</div>' +
             '<div class="e">' + UI.esc(etiqueta) + '</div></div>';
    }
  }


  /* ============================================================
     DELEGADOS
     ============================================================ */
  function delegados() {
    UI.cargando('Cargando delegados...');

    DB.delegados.listar().then(function (lista) {
      var html = '<h1>Delegados</h1>' +
                 '<p class="silencio">' + lista.length + ' persona(s) acreditada(s).</p>';

      /* Alta individual */
      html += '<details class="acordeon"><summary>Agregar una persona</summary><div class="cuerpo">' +
                '<div class="fila-campos">' +
                  campo('nvCodigo', 'Codigo', 'se genera solo si lo dejas vacio') +
                  campo('nvNombre', 'Nombre completo', '') +
                  campo('nvPais', 'Pais que representa', '') +
                  campo('nvComite', 'Comite', '') +
                  campo('nvInst', 'Institucion', '') +
                '</div>' +
                '<label class="campo"><span>Rol</span><select id="nvRol">' +
                  ['delegado', 'chair', 'secretariado', 'prensa', 'observador', 'staff']
                    .map(function (r) { return '<option>' + r + '</option>'; }).join('') +
                '</select></label>' +
                '<button class="btn" id="btnAgregar">Agregar</button>' +
              '</div></details>';

      /* Carga masiva */
      html += '<details class="acordeon"><summary>Cargar la lista completa de una vez</summary><div class="cuerpo">' +
                '<p class="silencio">Pega aqui la lista, una persona por linea, separando los datos con punto y coma. ' +
                'Puedes copiarla directo de Excel (usa el orden de columnas de abajo).</p>' +
                '<p class="mono" style="font-size:.8rem;background:#f4f2ed;padding:.5rem;border-radius:6px">' +
                  'nombre ; pais ; comite ; institucion ; rol' +
                '</p>' +
                '<textarea id="masivo" placeholder="Ana Rodriguez ; Bolivia ; Consejo de Seguridad ; UAGRM ; delegado&#10;Luis Mendez ; Francia ; SOCHUM ; UPDS ; delegado"></textarea>' +
                '<div class="fila-btn" style="margin-top:.5rem">' +
                  '<button class="btn" id="btnMasivo">Cargar lista</button>' +
                  '<button class="btn sec" id="btnPlantilla">Descargar plantilla</button>' +
                '</div>' +
              '</div></details>';

      if (!lista.length) {
        html += UI.vacio('&#128100;', 'Todavia no hay nadie acreditado. Usa la carga masiva de arriba.');
        UI.pintar(html);
        enlazarAltas();
        return;
      }

      html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Lista</h2><span class="sp"></span>' +
                '<input type="search" id="filtroDel" placeholder="Buscar..." style="max-width:190px"></div>' +
              '<div class="tabla-env"><table class="datos" id="tablaDel"><thead><tr>' +
              '<th>Codigo</th><th>Nombre</th><th>Pais</th><th>Comite</th><th>Institucion</th><th>Rol</th><th>Estado</th><th></th>' +
              '</tr></thead><tbody>';

      lista.forEach(function (d) {
        html += '<tr>' +
          '<td class="mono"><a href="#/c/' + encodeURIComponent(d.codigo) + '">' + UI.esc(d.codigo) + '</a></td>' +
          '<td>' + UI.esc(d.nombre) + '</td>' +
          '<td>' + UI.esc(d.pais || '') + '</td>' +
          '<td>' + UI.esc(d.comite || '') + '</td>' +
          '<td>' + UI.esc(d.institucion || '') + '</td>' +
          '<td><span class="chip rol">' + UI.esc(d.rol || '') + '</span></td>' +
          '<td><span class="chip ' + (d.activo ? 'si' : 'err') + '">' + (d.activo ? 'activa' : 'de baja') + '</span></td>' +
          '<td style="white-space:nowrap">' +
            '<button class="btn sec chico" data-baja="' + d.id + '" data-est="' + (d.activo ? '1' : '0') + '">' +
              (d.activo ? 'Dar de baja' : 'Reactivar') + '</button> ' +
            '<button class="btn rojo chico" data-borrar="' + d.id + '" data-nom="' + UI.esc(d.nombre) + '">Borrar</button>' +
          '</td></tr>';
      });

      html += '</tbody></table></div></div>';

      html += '<div class="fila-btn"><button class="btn sec" id="btnExpDel">Exportar lista a CSV</button></div>';

      UI.pintar(html);
      enlazarAltas();

      UI.q('#filtroDel').addEventListener('input', function () {
        var t = this.value.toLowerCase();
        UI.qq('#tablaDel tbody tr').forEach(function (tr) {
          tr.style.display = tr.textContent.toLowerCase().indexOf(t) >= 0 ? '' : 'none';
        });
      });

      UI.qq('[data-baja]').forEach(function (b) {
        b.addEventListener('click', function () {
          var activar = b.dataset.est === '0';
          DB.delegados.actualizar(b.dataset.baja, { activo: activar })
            .then(function () { UI.tostada(activar ? 'Credencial reactivada' : 'Credencial dada de baja', 'ok'); delegados(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.qq('[data-borrar]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('Borrar definitivamente a ' + b.dataset.nom + '? Se pierde tambien su registro de comidas.')) return;
          DB.delegados.borrar(b.dataset.borrar)
            .then(function () { UI.tostada('Eliminado', 'ok'); delegados(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.q('#btnExpDel').addEventListener('click', function () {
        var filas = lista.map(function (d) {
          return [d.codigo, d.nombre, d.pais || '', d.comite || '', d.institucion || '', d.rol || '', d.activo ? 'si' : 'no'];
        });
        UI.descargar('intermun-delegados.csv',
          UI.aCSV(['Codigo', 'Nombre', 'Pais', 'Comite', 'Institucion', 'Rol', 'Activo'], filas));
      });
    }).catch(function (e) {
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
    });


    function enlazarAltas() {
      UI.q('#btnAgregar').addEventListener('click', function () {
        var nombre = UI.q('#nvNombre').value.trim();
        if (!nombre) { UI.tostada('El nombre es obligatorio', 'err'); return; }
        var cod = UI.q('#nvCodigo').value.trim().toUpperCase();

        var paso = cod ? Promise.resolve(cod) : DB.delegados.siguienteCodigo();
        paso.then(function (codigo) {
          return DB.delegados.crear({
            codigo: codigo,
            nombre: nombre,
            pais: UI.q('#nvPais').value.trim() || null,
            comite: UI.q('#nvComite').value.trim() || null,
            institucion: UI.q('#nvInst').value.trim() || null,
            rol: UI.q('#nvRol').value
          });
        }).then(function () {
          UI.tostada('Agregado', 'ok');
          delegados();
        }).catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });

      UI.q('#btnPlantilla').addEventListener('click', function () {
        UI.descargar('intermun-plantilla-delegados.csv',
          UI.aCSV(['nombre', 'pais', 'comite', 'institucion', 'rol'],
                  [['Ana Rodriguez', 'Bolivia', 'Consejo de Seguridad', 'UAGRM', 'delegado'],
                   ['Luis Mendez', 'Francia', 'SOCHUM', 'UPDS', 'delegado']]));
      });

      UI.q('#btnMasivo').addEventListener('click', function () {
        var texto = UI.q('#masivo').value.trim();
        if (!texto) { UI.tostada('Pega la lista primero', 'err'); return; }

        var lineas = texto.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
        var b = UI.q('#btnMasivo');
        b.disabled = true; b.textContent = 'Cargando...';

        DB.delegados.siguienteCodigo().then(function (primer) {
          var m = /(\d+)\s*$/.exec(primer);
          var n = m ? parseInt(m[1], 10) : 1;
          var pref = window.CONFIG.PREFIJO_CODIGO;

          var nuevos = lineas.map(function (l, i) {
            var p = l.split(';').map(function (x) { return x.trim(); });
            /* Si la primera linea parece encabezado, se ignora */
            if (i === 0 && /^nombre$/i.test(p[0])) return null;
            return {
              codigo:      pref + '-' + String(n++).padStart(4, '0'),
              nombre:      p[0] || 'Sin nombre',
              pais:        p[1] || null,
              comite:      p[2] || null,
              institucion: p[3] || null,
              rol:         p[4] || 'delegado'
            };
          }).filter(Boolean);

          if (!nuevos.length) throw new Error('No se encontro ninguna fila valida.');
          return DB.delegados.crearVarios(nuevos).then(function () { return nuevos.length; });
        }).then(function (n) {
          UI.tostada(n + ' persona(s) cargada(s)', 'ok');
          delegados();
        }).catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false; b.textContent = 'Cargar lista';
        });
      });
    }
  }

  function campo(id, etiqueta, ayuda) {
    return '<label class="campo"><span>' + UI.esc(etiqueta) + '</span>' +
           '<input type="text" id="' + id + '" placeholder="' + UI.esc(ayuda) + '"></label>';
  }


  /* ============================================================
     COMIDAS
     ============================================================ */
  function comidas() {
    UI.cargando('Cargando comidas...');

    DB.comidas.listar().then(function (lista) {
      var html = '<h1>Comidas del evento</h1>' +
                 '<p class="silencio">Define aqui cada refrigerio y almuerzo. Es lo que el staff podra marcar al escanear.</p>';

      html += '<details class="acordeon"><summary>Agregar una comida</summary><div class="cuerpo">' +
                '<div class="fila-campos">' +
                  campo('cmNombre', 'Nombre', 'Almuerzo') +
                  '<label class="campo"><span>Dia</span><input type="number" id="cmDia" value="1" min="1" max="10"></label>' +
                  '<label class="campo"><span>Tipo</span><select id="cmTipo">' +
                    ['almuerzo', 'refrigerio', 'cena', 'coffee'].map(function (t) { return '<option>' + t + '</option>'; }).join('') +
                  '</select></label>' +
                  '<label class="campo"><span>Fecha (opcional)</span><input type="date" id="cmFecha"></label>' +
                '</div>' +
                '<button class="btn" id="btnAddComida">Agregar</button>' +
              '</div></details>';

      if (!lista.length) {
        html += UI.vacio('&#127869;', 'No hay comidas cargadas todavia.');
      } else {
        html += '<div class="tabla-env"><table class="datos"><thead><tr>' +
                '<th>Dia</th><th>Nombre</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>';
        lista.forEach(function (c) {
          html += '<tr>' +
            '<td class="num">' + c.dia + '</td>' +
            '<td><b>' + UI.esc(c.nombre) + '</b><br><small class="mono silencio">' + UI.esc(c.clave) + '</small></td>' +
            '<td>' + UI.esc(c.tipo) + '</td>' +
            '<td>' + UI.esc(c.fecha || '') + '</td>' +
            '<td><span class="chip ' + (c.activa ? 'si' : 'no') + '">' + (c.activa ? 'activa' : 'oculta') + '</span></td>' +
            '<td style="white-space:nowrap">' +
              '<button class="btn sec chico" data-tog="' + c.id + '" data-a="' + (c.activa ? '1' : '0') + '">' +
                (c.activa ? 'Ocultar' : 'Activar') + '</button> ' +
              '<button class="btn rojo chico" data-delc="' + c.id + '" data-n="' + UI.esc(c.nombre) + '">Borrar</button>' +
            '</td></tr>';
        });
        html += '</tbody></table></div>';
      }

      UI.pintar(html);

      UI.q('#btnAddComida').addEventListener('click', function () {
        var nombre = UI.q('#cmNombre').value.trim();
        var dia    = parseInt(UI.q('#cmDia').value, 10) || 1;
        var tipo   = UI.q('#cmTipo').value;
        var fecha  = UI.q('#cmFecha').value || null;
        if (!nombre) { UI.tostada('Ponle un nombre', 'err'); return; }

        var clave = 'd' + dia + '-' + nombre.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) + '-' + Date.now().toString().slice(-4);

        DB.comidas.crear({
          clave: clave, nombre: nombre, dia: dia, tipo: tipo, fecha: fecha,
          orden: (lista.length ? Math.max.apply(null, lista.map(function (x) { return x.orden || 0; })) : 0) + 1
        }).then(function () { UI.tostada('Comida agregada', 'ok'); comidas(); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });

      UI.qq('[data-tog]').forEach(function (b) {
        b.addEventListener('click', function () {
          DB.comidas.actualizar(b.dataset.tog, { activa: b.dataset.a === '0' })
            .then(function () { comidas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.qq('[data-delc]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('Borrar "' + b.dataset.n + '"? Se pierden los registros de entrega de esa comida.')) return;
          DB.comidas.borrar(b.dataset.delc)
            .then(function () { UI.tostada('Borrada', 'ok'); comidas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });
    }).catch(function (e) {
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
    });
  }


  /* ============================================================
     GENERADOR DE QR
     ============================================================ */
  function qr() {
    UI.cargando('Cargando delegados...');

    DB.delegados.listar().then(function (lista) {
      var base = urlBase();

      var html = '<h1>Generar los codigos QR</h1>' +
        '<div class="tarjeta no-imprimir">' +
          '<label class="campo"><span>Direccion publica del sitio</span>' +
            '<input type="text" id="urlBase" value="' + UI.esc(base) + '"></label>' +
          '<p class="silencio">Cada QR abre la credencial de esa persona. Verifica que esta direccion sea la definitiva ' +
          '(la de GitHub Pages), no la de tu computadora, antes de imprimir.</p>' +
          '<div class="fila-campos">' +
            '<label class="campo"><span>Tamano del QR</span><select id="qrTam">' +
              '<option value="3">Chico</option><option value="4" selected>Mediano</option><option value="6">Grande</option>' +
            '</select></label>' +
            '<label class="campo"><span>Mostrar</span><select id="qrDatos">' +
              '<option value="full" selected>Nombre, codigo y comite</option>' +
              '<option value="min">Solo el codigo</option>' +
            '</select></label>' +
          '</div>' +
          '<div class="fila-btn">' +
            '<button class="btn" id="btnGen">Generar</button>' +
            '<button class="btn oro" id="btnImp">Imprimir</button>' +
          '</div>' +
        '</div>';

      if (!lista.length) {
        html += UI.vacio('&#128290;', 'Primero carga la lista de delegados.');
        UI.pintar(html);
        return;
      }

      html += '<div class="tarjeta"><div id="hojaQR" class="qr-hoja"></div></div>';
      UI.pintar(html);

      UI.q('#btnGen').addEventListener('click', generar);
      UI.q('#btnImp').addEventListener('click', function () { window.print(); });
      generar();

      function generar() {
        var b   = UI.q('#urlBase').value.trim().replace(/#.*$/, '').replace(/\/$/, '');
        var tam = parseInt(UI.q('#qrTam').value, 10);
        var modo= UI.q('#qrDatos').value;
        var cont = UI.q('#hojaQR');
        cont.innerHTML = '';

        lista.forEach(function (d) {
          var url = b + '/#/c/' + encodeURIComponent(d.codigo);
          var g;
          try {
            g = qrcode(0, 'M');
            g.addData(url);
            g.make();
          } catch (e) { return; }

          var caja = document.createElement('div');
          caja.className = 'qr-tarjeta';
          caja.innerHTML =
            g.createSvgTag({ cellSize: tam, margin: 1, scalable: true }) +
            (modo === 'full'
              ? '<div class="qr-nom">' + UI.esc(d.nombre) + '</div>' +
                '<div class="qr-cod">' + UI.esc(d.codigo) + '</div>' +
                '<div class="qr-meta">' + UI.esc([d.pais, d.comite].filter(Boolean).join(' &middot; ')) + '</div>'
              : '<div class="qr-cod" style="margin-top:5px">' + UI.esc(d.codigo) + '</div>');
          cont.appendChild(caja);
        });

        UI.tostada(lista.length + ' codigo(s) generado(s)', 'ok');
      }
    }).catch(function (e) {
      UI.pintar('<div class="tarjeta">' + UI.aviso('err', 'Error', UI.explicarError(e)) + '</div>');
    });
  }

  function urlBase() {
    var guardada = null;
    try { guardada = localStorage.getItem('intermun_url'); } catch (e) {}
    if (guardada) return guardada;
    return location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  }


  /* ============================================================
     AJUSTES / ESTADO
     ============================================================ */
  function ajustes() {
    var est = VISTAS.estacionGuardada();
    var u = APP.usuarioActual();

    var html = '<h1>Ajustes y estado</h1>';

    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Este dispositivo</h2></div>' +
              '<label class="campo"><span>Estacion de entrega</span><select id="selEst">' +
                '<option value="">Sin especificar</option>' +
                window.CONFIG.ESTACIONES.map(function (e) {
                  return '<option value="' + UI.esc(e) + '"' + (e === est ? ' selected' : '') + '>' + UI.esc(e) + '</option>';
                }).join('') +
              '</select></label>' +
              '<p class="silencio">Queda guardado en este celular. Sirve para saber despues por que puerta paso cada delegado.</p>' +
              '<label class="campo"><span>Direccion publica del sitio (para los QR)</span>' +
                '<input type="text" id="urlPub" value="' + UI.esc(urlBase()) + '"></label>' +
              '<button class="btn" id="btnGuardarAj">Guardar</button>' +
            '</div>';

    html += '<div class="tarjeta"><div class="tarjeta-tit"><h2>Estado del sistema</h2></div><div id="estado">' +
              '<p class="silencio">Comprobando...</p></div></div>';

    UI.pintar(html);

    UI.q('#btnGuardarAj').addEventListener('click', function () {
      try {
        var v = UI.q('#selEst').value;
        if (v) localStorage.setItem('intermun_estacion', v);
        else localStorage.removeItem('intermun_estacion');

        var u2 = UI.q('#urlPub').value.trim().replace(/\/$/, '');
        if (u2) localStorage.setItem('intermun_url', u2);
        else localStorage.removeItem('intermun_url');

        UI.tostada('Guardado', 'ok');
      } catch (e) { UI.tostada('No se pudo guardar en este navegador', 'err'); }
    });

    var filas = [
      ['Configuracion de conexion', window.CONFIG.estaConfigurado() ? ['si', 'Lista'] : ['err', 'Falta editar js/config.js']],
      ['Sesion de staff', u ? ['si', u.email] : ['no', 'Sin sesion iniciada']]
    ];

    DB.probar().then(function (r) {
      filas.push(['Base de datos', r.ok ? ['si', 'Respondiendo'] : ['err', r.motivo]]);
      return window.CONFIG.estaConfigurado() && r.ok
        ? Promise.all([DB.delegados.listar(), DB.comidas.listar(), DB.entregas.listar()])
        : null;
    }).then(function (d) {
      if (d) {
        filas.push(['Delegados cargados', ['si', d[0].length + '']]);
        filas.push(['Comidas cargadas', ['si', d[1].length + '']]);
        filas.push(['Entregas registradas', ['si', d[2].length + '']]);
      }
      UI.q('#estado').innerHTML =
        '<div class="tabla-env"><table class="datos"><tbody>' +
        filas.map(function (f) {
          return '<tr><td><b>' + UI.esc(f[0]) + '</b></td>' +
                 '<td><span class="chip ' + f[1][0] + '">' + UI.esc(f[1][1]) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
    }).catch(function (e) {
      UI.q('#estado').innerHTML = UI.aviso('err', 'Error', UI.explicarError(e));
    });
  }


  /* ---------- Pantalla cuando falta configurar ---------- */
  function sinConfigurar() {
    UI.pintar(
      '<h1>Falta conectar el sistema</h1>' +
      UI.aviso('warn', 'Todavia no esta configurado',
        'El portal funciona, pero las credenciales y el control de comidas necesitan la conexion a la base de datos.') +
      '<div class="tarjeta">' +
        '<h3>Que hay que hacer</h3>' +
        '<ol>' +
          '<li>Crear un proyecto gratuito en supabase.com</li>' +
          '<li>Ejecutar el archivo <span class="mono">INSTALACION-SUPABASE.sql</span> en su editor SQL</li>' +
          '<li>Copiar la URL y la clave anon del proyecto dentro de <span class="mono">js/config.js</span></li>' +
          '<li>Crear los usuarios del staff en Authentication</li>' +
        '</ol>' +
        '<p class="silencio">Los pasos completos estan en el archivo GUIA-DE-INSTALACION.md que viene con el sistema.</p>' +
        '<a class="btn sec" href="#/">Volver al portal</a>' +
      '</div>'
    );
  }


  return {
    login: login,
    panel: panel,
    escanear: escanear,
    tablero: tablero,
    delegados: delegados,
    comidas: comidas,
    qr: qr,
    ajustes: ajustes
  };
})();

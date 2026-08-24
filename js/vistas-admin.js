/* ====================================================================
   InterMUN UAGRM | Modulo de control (staff)
   Mismo estandar de accesibilidad que el portal publico: etiquetas
   reales en cada campo, tablas con encabezados asociados, resultados
   anunciados en vivo y ningun estado comunicado solo con color.
   ==================================================================== */

window.ADMIN = (function () {
  'use strict';

  var escanerActivo = null;


  /* ---------- Lista de modulos del panel ---------- */
  function listaModulos(items) {
    var html = '<ul class="rejilla" role="list">';
    items.forEach(function (m) {
      html += '<li><a class="modulo" href="' + m.href + '">' +
                UI.icono(m.ico) +
                '<strong>' + UI.esc(m.t) + '</strong>' +
                '<span class="d">' + UI.esc(m.d) + '</span>' +
              '</a></li>';
    });
    return html + '</ul>';
  }

  function campo(id, etiqueta, ayuda, tipo) {
    var idAyuda = id + '-ayuda';
    return '<label class="campo" for="' + id + '"><span>' + UI.esc(etiqueta) + '</span>' +
             '<input type="' + (tipo || 'text') + '" id="' + id + '"' +
               (ayuda ? ' aria-describedby="' + idAyuda + '"' : '') + '></label>' +
           (ayuda ? '<p class="ayuda-campo" id="' + idAyuda + '">' + UI.esc(ayuda) + '</p>' : '');
  }


  /* ================================================================
     INICIO DE SESION
     ================================================================ */
  function login(motivo) {
    if (!DB.hayConexion()) { sinConfigurar(); return; }

    UI.pintar(
      '<h1>Acceso del staff</h1>' +
      (motivo ? UI.aviso('info', null, motivo) : '') +
      '<div class="tarjeta angosto">' +
        '<label class="campo" for="correo"><span>Correo</span>' +
          '<input type="email" id="correo" autocomplete="username" ' +
            'aria-describedby="ayuda-correo"></label>' +
        '<p class="ayuda-campo" id="ayuda-correo">El correo con el que el Secretariado creo tu cuenta.</p>' +
        '<label class="campo" for="clave"><span>Contraseña</span>' +
          '<input type="password" id="clave" autocomplete="current-password"></label>' +
        '<button type="button" class="btn bloque" id="btnEntrar">Iniciar sesión</button>' +
      '</div>' +
      '<p>Las cuentas del staff las crea el Secretariado. Si no tienes una, pidesela a quien administra el sistema.</p>'
    );

    function entrar() {
      var c = UI.q('#correo').value.trim();
      var k = UI.q('#clave').value;
      if (!c || !k) {
        UI.tostada('Completa el correo y la contraseña para continuar.', 'err');
        UI.q(c ? '#clave' : '#correo').focus();
        return;
      }
      var b = UI.q('#btnEntrar');
      b.disabled = true;
      b.textContent = 'Verificando, un momento';
      DB.sesion.entrar(c, k)
        .then(function (u) {
          APP.fijarUsuario(u);
          UI.tostada('Sesión iniciada como ' + u.email + '.', 'ok');
          location.hash = '#/staff';
        })
        .catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false;
          b.textContent = 'Iniciar sesión';
          UI.q('#clave').focus();
        });
    }

    UI.q('#btnEntrar').addEventListener('click', entrar);
    UI.q('#clave').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') entrar(); });
  }


  /* ================================================================
     PANEL DEL STAFF
     ================================================================ */
  function panel() {
    if (!DB.hayConexion()) { sinConfigurar(); return; }
    if (!APP.usuarioActual()) { login(); return; }

    var est = VISTAS.estacionGuardada();

    UI.pintar(
      '<h1>Control de InterMUN</h1>' +
      '<p>Sesión iniciada como <strong>' + UI.esc(APP.usuarioActual().email) + '</strong>.' +
        (est ? ' Estación de entrega: <strong>' + UI.esc(est) + '</strong>.' : '') + '</p>' +
      listaModulos([
        { href: '#/escanear',  ico: '&#128247;', t: 'Escanear credencial',
          d: 'Modo rápido para la fila de refrigerios: escanea y marca al instante.' },
        { href: '#/tablero',   ico: '&#128202;', t: 'Tablero en vivo',
          d: 'Cuántos recibieron cada comida, en tiempo real, y descarga para Excel.' },
        { href: '#/delegados', ico: '&#128100;', t: 'Delegados',
          d: 'Cargar la lista, editar datos y dar de baja credenciales.' },
        { href: '#/comidas',   ico: '&#127869;', t: 'Comidas',
          d: 'Definir los refrigerios y almuerzos de cada día.' },
        { href: '#/salas',     ico: '&#128172;', t: 'Salas de chat',
          d: 'Abrir la sala general y una sala por cada comité, y moderar.' },
        { href: '#/qr',        ico: '&#128290;', t: 'Generar los códigos QR',
          d: 'Crear e imprimir los códigos del reverso de cada credencial.' },
        { href: '#/ajustes',   ico: '&#9881;',   t: 'Ajustes y estado',
          d: 'Elegir tu estación de entrega y revisar el estado del sistema.' }
      ])
    );
  }


  /* ================================================================
     ESCANER
     ================================================================ */
  function escanear() {
    detenerEscaner();
    UI.cargando('Preparando el escáner');

    DB.comidas.activas().then(function (comidas) {
      if (!comidas.length) {
        UI.pintar('<h1>Escanear credencial</h1>' +
          UI.aviso('warn', 'Todavía no hay comidas cargadas',
            'Primero define los refrigerios y almuerzos del evento para poder marcarlos.') +
          '<p><a class="btn" href="#/comidas">Ir a definir las comidas</a></p>');
        return;
      }

      var guardada = null;
      try { guardada = localStorage.getItem('intermun_comida_activa'); } catch (e) {}
      var elegida = comidas.filter(function (c) { return c.id === guardada; })[0] || comidas[0];

      var opciones = comidas.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === elegida.id ? ' selected' : '') + '>' +
               'Día ' + c.dia + ', ' + UI.esc(c.nombre) + '</option>';
      }).join('');

      UI.pintar(
        '<h1>Escanear credencial</h1>' +

        '<section class="tarjeta" aria-labelledby="t-que-comida">' +
          '<h2 id="t-que-comida">Qué estás entregando</h2>' +
          '<label class="campo" for="selComida"><span>Comida que se entrega ahora</span>' +
            '<select id="selComida" aria-describedby="ayuda-comida">' + opciones + '</select></label>' +
          '<p class="ayuda-campo" id="ayuda-comida">Todo lo que escanees se registrará como esta comida ' +
            'hasta que la cambies aquí.</p>' +
        '</section>' +

        '<section class="tarjeta" aria-labelledby="t-camara">' +
          '<h2 id="t-camara">Con la cámara</h2>' +
          '<div class="fila-btn">' +
            '<button type="button" class="btn verde" id="btnCam">Encender la cámara</button>' +
            '<button type="button" class="btn sec" id="btnApagar" disabled>Apagar la cámara</button>' +
          '</div>' +
          '<div id="lector"></div>' +
        '</section>' +

        '<section class="tarjeta" aria-labelledby="t-mano">' +
          '<h2 id="t-mano">O escribiendo el código</h2>' +
          '<p>Sirve si la cámara falla o el código QR está dañado.</p>' +
          '<label class="campo" for="codManual"><span>Código de credencial</span>' +
            '<input type="text" id="codManual" autocomplete="off" autocapitalize="characters" ' +
              'placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001"></label>' +
          '<button type="button" class="btn bloque" id="btnManual">Registrar la entrega</button>' +
        '</section>' +

        '<section aria-labelledby="t-resultado">' +
          '<h2 id="t-resultado">Resultado</h2>' +
          '<div id="resultado" role="status" aria-live="assertive" aria-atomic="true">' +
            '<p class="silencio">Aquí aparece que paso con cada credencial que escanees.</p>' +
          '</div>' +
        '</section>' +

        '<section aria-labelledby="t-historial">' +
          '<h2 id="t-historial">Entregas de esta sesión</h2>' +
          '<p id="contador" role="status" aria-live="polite">Todavía no registraste ninguna entrega.</p>' +
          '<div id="historial"></div>' +
        '</section>'
      );

      var historial = [];

      UI.q('#selComida').addEventListener('change', function () {
        try { localStorage.setItem('intermun_comida_activa', this.value); } catch (e) {}
        var txt = this.options[this.selectedIndex].textContent;
        if (window.A11Y) window.A11Y.anunciar('Ahora se registrará: ' + txt + '.');
      });

      UI.q('#btnCam').addEventListener('click', encenderCamara);
      UI.q('#btnApagar').addEventListener('click', function () {
        detenerEscaner();
        UI.q('#btnCam').disabled = false;
        UI.q('#btnApagar').disabled = true;
        if (window.A11Y) window.A11Y.anunciar('Cámara apagada.');
      });

      UI.q('#btnManual').addEventListener('click', function () {
        var v = UI.q('#codManual').value.trim().toUpperCase();
        if (!v) {
          UI.tostada('Escribe un código de credencial.', 'err');
          UI.q('#codManual').focus();
          return;
        }
        procesar(v);
        UI.q('#codManual').value = '';
        UI.q('#codManual').focus();
      });
      UI.q('#codManual').addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') UI.q('#btnManual').click();
      });


      function encenderCamara() {
        UI.q('#btnCam').disabled = true;
        if (window.A11Y) window.A11Y.anunciar('Encendiendo la cámara.');
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
              UI.tostada('Cámara lista. Apunta al código QR de la credencial.', 'ok');
            }).catch(function (e) {
              UI.q('#btnCam').disabled = false;
              UI.tostada('No se pudo abrir la cámara. ' + (e.message || '') +
                ' Puedes escribir el código a mano más abajo.', 'err');
            });
          } catch (e) {
            UI.q('#btnCam').disabled = false;
            UI.tostada('Este navegador no permite usar la cámara aquí. Escribe el código a mano.', 'err');
          }
        }).catch(function () {
          UI.q('#btnCam').disabled = false;
          UI.tostada('No se pudo cargar el escáner. Escribe el código a mano.', 'err');
        });
      }


      var ultimo = '', ultimoMomento = 0;

      function procesar(texto) {
        var codigo = extraerCodigo(texto);
        var ahora = Date.now();
        if (codigo === ultimo && ahora - ultimoMomento < 2500) return;
        ultimo = codigo; ultimoMomento = ahora;

        var comidaId = UI.q('#selComida').value;
        var comida = comidas.filter(function (c) { return c.id === comidaId; })[0];
        var u = APP.usuarioActual();

        DB.delegados.porCodigo(codigo).then(function (d) {
          if (!d) {
            pitar(false);
            mostrar('err', 'Credencial desconocida',
              'El código ' + codigo + ' no está en la lista de acreditados.');
            return;
          }
          if (!d.activo) {
            pitar(false);
            mostrar('err', 'Credencial dada de baja',
              d.nombre + ' tiene la credencial desactivada. No corresponde entregar.');
            return;
          }
          return DB.entregas.marcar(d.id, comidaId, u ? u.email : null, VISTAS.estacionGuardada())
            .then(function (r) {
              if (r.duplicado) {
                pitar(false);
                mostrar('warn', 'Ya había recibido esta comida',
                  d.nombre + ' ya tiene registrado el ' + comida.nombre + ' del día ' + comida.dia + '.', d);
              } else {
                pitar(true);
                mostrar('ok', 'Entrega registrada',
                  d.nombre + '. ' + comida.nombre + ' del día ' + comida.dia + '.', d);
                historial.unshift({ nombre: d.nombre, codigo: d.codigo, hora: new Date().toISOString() });
                pintarHistorial();
              }
            });
        }).catch(function (e) {
          pitar(false);
          mostrar('err', 'No se pudo registrar', UI.explicarError(e));
        });
      }

      function mostrar(tipo, titulo, texto, d) {
        var extra = d
          ? '<p><a class="btn sec chico" href="#/c/' + encodeURIComponent(d.codigo) + '">' +
            'Ver la credencial completa de ' + UI.esc(d.nombre) + '</a></p>'
          : '';
        UI.q('#resultado').innerHTML =
          '<div class="aviso ' + tipo + '"><b>' + UI.esc(titulo) + '</b>' + UI.esc(texto) + extra + '</div>';
      }

      function pintarHistorial() {
        UI.q('#contador').textContent = historial.length === 1
          ? 'Registraste 1 entrega en esta sesión.'
          : 'Registraste ' + historial.length + ' entregas en esta sesión.';

        UI.q('#historial').innerHTML =
          '<div class="tabla-env"><table class="datos">' +
          '<caption class="solo-lector">Entregas registradas en esta sesión, de la más reciente a la más antigua</caption>' +
          '<thead><tr><th scope="col">Hora</th><th scope="col">Código</th><th scope="col">Nombre</th></tr></thead><tbody>' +
          historial.slice(0, 40).map(function (h) {
            return '<tr><td class="mono">' + UI.hora(h.hora) + '</td>' +
                   '<td class="mono">' + UI.esc(h.codigo) + '</td>' +
                   '<td>' + UI.esc(h.nombre) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
    }).catch(function (e) {
      UI.pintar('<h1>Escanear credencial</h1>' + UI.aviso('err', 'No se pudo preparar el escáner', UI.explicarError(e)));
    });
  }


  function extraerCodigo(texto) {
    var t = String(texto || '').trim();
    var m = /#\/c\/([^/?&#\s]+)/.exec(t);
    if (m) return decodeURIComponent(m[1]).toUpperCase();
    m = /([A-Za-z]{1,6}-\d{2,6})\s*$/.exec(t);
    if (m) return m[1].toUpperCase();
    return t.toUpperCase();
  }

  /* Confirmacion sonora y por vibracion: en una fila ruidosa, mirar la
     pantalla en cada persona es inviable. Grave significa revisar. */
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
      o.start(); o.stop(ctx.currentTime + (exito ? 0.18 : 0.4));
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


  /* ================================================================
     TABLERO EN VIVO
     ================================================================ */
  function tablero() {
    UI.cargando('Cargando el tablero');

    var delegados = [], comidas = [], entregas = [];

    function traer() {
      return Promise.all([DB.delegados.listar(), DB.comidas.activas(), DB.entregas.listar()])
        .then(function (r) { delegados = r[0]; comidas = r[1]; entregas = r[2]; });
    }

    traer().then(function () {
      pintar();
      APP.abrirCanalVivo(function () { traer().then(pintar); });
    }).catch(function (e) {
      UI.pintar('<h1>Tablero en vivo</h1>' + UI.aviso('err', 'No se pudo cargar el tablero', UI.explicarError(e)));
    });

    function pintar() {
      var activos = delegados.filter(function (d) { return d.activo; });
      var porComida = {};
      entregas.forEach(function (e) { porComida[e.comida_id] = (porComida[e.comida_id] || 0) + 1; });

      var html = '<h1>Tablero en vivo</h1>' +
        '<p>Se actualiza solo cuando cualquier estación registra una entrega.</p>' +
        '<ul class="metricas" role="list">' +
          met(activos.length, 'Acreditados activos', '') +
          met(comidas.length, 'Comidas programadas', 'oro') +
          met(entregas.length, 'Entregas registradas', 'verde') +
        '</ul>';

      if (!comidas.length) {
        html += UI.vacio('&#127869;', 'Todavía no hay comidas cargadas.');
        UI.pintar(html);
        return;
      }

      html += '<section aria-labelledby="t-avance"><h2 id="t-avance">Avance por comida</h2>';
      comidas.forEach(function (c) {
        var n = porComida[c.id] || 0;
        var pct = activos.length ? Math.round(n * 100 / activos.length) : 0;
        html += '<div class="avance-comida">' +
                  '<p><strong>Día ' + c.dia + ', ' + UI.esc(c.nombre) + '.</strong> ' +
                    n + ' de ' + activos.length + ' personas, ' + pct + ' por ciento.</p>' +
                  '<div class="progreso" role="img" aria-label="' + pct + ' por ciento completado">' +
                    '<i style="width:' + pct + '%"></i></div>' +
                '</div>';
      });
      html += '</section>';

      html += '<section aria-labelledby="t-falta">' +
                '<h2 id="t-falta">Quién falta</h2>' +
                '<label class="campo" for="selFalta"><span>Elige la comida</span>' +
                  '<select id="selFalta">' +
                    comidas.map(function (c) {
                      return '<option value="' + c.id + '">Día ' + c.dia + ', ' + UI.esc(c.nombre) + '</option>';
                    }).join('') +
                  '</select></label>' +
                '<div id="listaFalta" role="region" aria-live="polite"></div>' +
              '</section>';

      html += '<div class="fila-btn no-imprimir">' +
                '<button type="button" class="btn" id="btnCSV">Descargar todo para Excel</button>' +
                '<a class="btn sec" href="#/escanear">Ir a escanear</a>' +
              '</div>';

      UI.pintar(html);

      var sel = UI.q('#selFalta');
      sel.addEventListener('change', pintarFaltantes);
      pintarFaltantes();

      function pintarFaltantes() {
        var cid = sel.value;
        var ya = {};
        entregas.forEach(function (e) { if (e.comida_id === cid) ya[e.delegado_id] = true; });
        var faltan = activos.filter(function (d) { return !ya[d.id]; });

        if (!faltan.length) {
          UI.q('#listaFalta').innerHTML =
            UI.aviso('ok', 'No falta nadie', 'Todos los acreditados activos recibieron esta comida.');
          return;
        }
        UI.q('#listaFalta').innerHTML =
          '<p>' + faltan.length + (faltan.length === 1 ? ' persona todavía no la recibe.' : ' personas todavía no la reciben.') + '</p>' +
          '<div class="tabla-env"><table class="datos">' +
          '<caption class="solo-lector">Personas que todavía no reciben la comida seleccionada</caption>' +
          '<thead><tr><th scope="col">Código</th><th scope="col">Nombre</th>' +
          '<th scope="col">Comité</th><th scope="col">Institución</th></tr></thead><tbody>' +
          faltan.map(function (d) {
            return '<tr><td class="mono"><a href="#/c/' + encodeURIComponent(d.codigo) + '">' + UI.esc(d.codigo) + '</a></td>' +
                   '<td>' + UI.esc(d.nombre) + '</td><td>' + UI.esc(d.comite || 'sin comité') + '</td>' +
                   '<td>' + UI.esc(d.institucion || 'sin institución') + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }

      UI.q('#btnCSV').addEventListener('click', function () {
        var enc = ['Código', 'Nombre', 'País', 'Comité', 'Institución', 'Rol', 'Activo'];
        comidas.forEach(function (c) { enc.push('D' + c.dia + ' ' + c.nombre); });
        enc.push('Total recibidas');

        var mapa = {};
        entregas.forEach(function (e) {
          if (!mapa[e.delegado_id]) mapa[e.delegado_id] = {};
          mapa[e.delegado_id][e.comida_id] = e;
        });

        var filas = delegados.map(function (d) {
          var f = [d.codigo, d.nombre, d.pais || '', d.comite || '', d.institucion || '', d.rol || '', d.activo ? 'sí' : 'no'];
          var total = 0;
          comidas.forEach(function (c) {
            var e = mapa[d.id] && mapa[d.id][c.id];
            if (e) { total++; f.push(UI.fechaHora(e.entregado_en)); } else f.push('');
          });
          f.push(total);
          return f;
        });

        UI.descargar('intermun-control-comidas-' + new Date().toISOString().slice(0, 10) + '.csv',
                     UI.aCSV(enc, filas));
        UI.tostada('Archivo descargado.', 'ok');
      });
    }

    function met(n, etiqueta, clase) {
      return '<li class="metrica ' + (clase || '') + '">' +
               '<span class="n">' + n + '</span> ' +
               '<span class="e">' + UI.esc(etiqueta) + '</span></li>';
    }
  }


  /* ================================================================
     DELEGADOS
     ================================================================ */
  function delegados() {
    UI.cargando('Cargando delegados');

    DB.delegados.listar().then(function (lista) {
      var html = '<h1>Delegados</h1>' +
        '<p>' + (lista.length === 1 ? 'Hay 1 persona acreditada.' : 'Hay ' + lista.length + ' personas acreditadas.') + '</p>';

      html += '<details class="acordeon"><summary>Agregar una persona</summary><div class="cuerpo">' +
                '<div class="fila-campos">' +
                  campo('nvCodigo', 'Código', 'Si lo dejas vacío, se genera solo.') +
                  campo('nvNombre', 'Nombre completo', 'Es el único dato obligatorio.') +
                  campo('nvPais', 'País que representa', '') +
                  campo('nvComite', 'Comité', '') +
                  campo('nvInst', 'Institución', '') +
                '</div>' +
                '<label class="campo" for="nvRol"><span>Rol</span><select id="nvRol">' +
                  ['delegado', 'chair', 'secretariado', 'prensa', 'observador', 'staff']
                    .map(function (r) { return '<option>' + r + '</option>'; }).join('') +
                '</select></label>' +
                '<button type="button" class="btn" id="btnAgregar">Agregar persona</button>' +
              '</div></details>';

      html += '<details class="acordeon"><summary>Cargar la lista completa de una vez</summary><div class="cuerpo">' +
                '<p>Pega la lista con una persona por línea, separando los datos con punto y coma. ' +
                  'Puedes copiarla directo de Excel si ordenas las columnas en este orden:</p>' +
                '<p class="mono"><strong>nombre ; país ; comité ; institución ; rol</strong></p>' +
                '<label class="campo" for="masivo"><span>Lista de personas</span>' +
                  '<textarea id="masivo" aria-describedby="ayuda-masivo" ' +
                    'placeholder="Ana Rodríguez ; Bolivia ; Consejo de Seguridad ; UAGRM ; delegado"></textarea></label>' +
                '<p class="ayuda-campo" id="ayuda-masivo">Los códigos de credencial se generan solos, ' +
                  'en orden, empezando por el siguiente libre.</p>' +
                '<div class="fila-btn">' +
                  '<button type="button" class="btn" id="btnMasivo">Cargar la lista</button>' +
                  '<button type="button" class="btn sec" id="btnPlantilla">Descargar una plantilla</button>' +
                '</div>' +
              '</div></details>';

      if (!lista.length) {
        html += UI.vacio('&#128100;', 'Todavía no hay nadie acreditado. Usa la carga masiva de arriba.');
        UI.pintar(html);
        enlazarAltas();
        return;
      }

      html += '<section aria-labelledby="t-lista"><h2 id="t-lista">Lista de acreditados</h2>' +
              '<label class="campo" for="filtroDel"><span>Buscar</span>' +
                '<input type="search" id="filtroDel" autocomplete="off"></label>' +
              '<p class="solo-lector" role="status" aria-live="polite" id="conteoDel"></p>' +
              '<div class="tabla-env"><table class="datos" id="tablaDel">' +
              '<caption class="solo-lector">Personas acreditadas en InterMUN</caption>' +
              '<thead><tr>' +
                '<th scope="col">Código</th><th scope="col">Nombre</th><th scope="col">País</th>' +
                '<th scope="col">Comité</th><th scope="col">Institución</th><th scope="col">Rol</th>' +
                '<th scope="col">Estado</th><th scope="col">Acciones</th>' +
              '</tr></thead><tbody>';

      lista.forEach(function (d) {
        html += '<tr>' +
          '<td class="mono"><a href="#/c/' + encodeURIComponent(d.codigo) + '">' + UI.esc(d.codigo) + '</a></td>' +
          '<td>' + UI.esc(d.nombre) + '</td>' +
          '<td>' + UI.esc(d.pais || '') + '</td>' +
          '<td>' + UI.esc(d.comite || '') + '</td>' +
          '<td>' + UI.esc(d.institucion || '') + '</td>' +
          '<td>' + UI.esc(d.rol || '') + '</td>' +
          '<td><span class="chip ' + (d.activo ? 'si' : 'err') + '">' + (d.activo ? 'Activa' : 'De baja') + '</span></td>' +
          '<td>' +
            '<button type="button" class="btn sec chico" data-baja="' + d.id + '" data-est="' + (d.activo ? '1' : '0') + '">' +
              (d.activo ? 'Dar de baja' : 'Reactivar') +
              '<span class="solo-lector"> la credencial de ' + UI.esc(d.nombre) + '</span></button> ' +
            '<button type="button" class="btn rojo chico" data-borrar="' + d.id + '" data-nom="' + UI.esc(d.nombre) + '">' +
              'Borrar<span class="solo-lector"> a ' + UI.esc(d.nombre) + '</span></button>' +
          '</td></tr>';
      });

      html += '</tbody></table></div></section>' +
              '<div class="fila-btn"><button type="button" class="btn sec" id="btnExpDel">' +
              'Descargar la lista para Excel</button></div>';

      UI.pintar(html);
      enlazarAltas();

      var conteo = UI.q('#conteoDel');
      UI.q('#filtroDel').addEventListener('input', function () {
        var t = this.value.toLowerCase();
        var n = 0;
        UI.qq('#tablaDel tbody tr').forEach(function (tr) {
          var ok = tr.textContent.toLowerCase().indexOf(t) >= 0;
          tr.style.display = ok ? '' : 'none';
          if (ok) n++;
        });
        conteo.textContent = n + (n === 1 ? ' persona encontrada.' : ' personas encontradas.');
      });

      UI.qq('[data-baja]').forEach(function (b) {
        b.addEventListener('click', function () {
          var activar = b.dataset.est === '0';
          DB.delegados.actualizar(b.dataset.baja, { activo: activar })
            .then(function () {
              UI.tostada(activar ? 'Credencial reactivada.' : 'Credencial dada de baja.', 'ok');
              delegados();
            })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.qq('[data-borrar]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('Vas a borrar definitivamente a ' + b.dataset.nom +
                            ', junto con su registro de comidas. Esta acción no se puede deshacer. Confirmas?')) return;
          DB.delegados.borrar(b.dataset.borrar)
            .then(function () { UI.tostada('Persona eliminada.', 'ok'); delegados(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.q('#btnExpDel').addEventListener('click', function () {
        var filas = lista.map(function (d) {
          return [d.codigo, d.nombre, d.pais || '', d.comite || '', d.institucion || '', d.rol || '', d.activo ? 'sí' : 'no'];
        });
        UI.descargar('intermun-delegados.csv',
          UI.aCSV(['Código', 'Nombre', 'País', 'Comité', 'Institución', 'Rol', 'Activo'], filas));
        UI.tostada('Lista descargada.', 'ok');
      });
    }).catch(function (e) {
      UI.pintar('<h1>Delegados</h1>' + UI.aviso('err', 'No se pudo cargar la lista', UI.explicarError(e)));
    });


    function enlazarAltas() {
      UI.q('#btnAgregar').addEventListener('click', function () {
        var nombre = UI.q('#nvNombre').value.trim();
        if (!nombre) {
          UI.tostada('El nombre es obligatorio.', 'err');
          UI.q('#nvNombre').focus();
          return;
        }
        var cod = UI.q('#nvCodigo').value.trim().toUpperCase();
        (cod ? Promise.resolve(cod) : DB.delegados.siguienteCodigo())
          .then(function (codigo) {
            return DB.delegados.crear({
              codigo: codigo,
              nombre: nombre,
              pais: UI.q('#nvPais').value.trim() || null,
              comite: UI.q('#nvComite').value.trim() || null,
              institucion: UI.q('#nvInst').value.trim() || null,
              rol: UI.q('#nvRol').value
            });
          })
          .then(function () { UI.tostada('Persona agregada.', 'ok'); delegados(); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });

      UI.q('#btnPlantilla').addEventListener('click', function () {
        UI.descargar('intermun-plantilla-delegados.csv',
          UI.aCSV(['nombre', 'pais', 'comite', 'institucion', 'rol'],
                  [['Ana Rodríguez', 'Bolivia', 'Consejo de Seguridad', 'UAGRM', 'delegado'],
                   ['Luis Méndez', 'Francia', 'SOCHUM', 'UPDS', 'delegado']]));
        UI.tostada('Plantilla descargada.', 'ok');
      });

      UI.q('#btnMasivo').addEventListener('click', function () {
        var texto = UI.q('#masivo').value.trim();
        if (!texto) {
          UI.tostada('Pega primero la lista de personas.', 'err');
          UI.q('#masivo').focus();
          return;
        }
        var lineas = texto.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
        var b = UI.q('#btnMasivo');
        b.disabled = true; b.textContent = 'Cargando, un momento';

        DB.delegados.siguienteCodigo().then(function (primer) {
          var m = /(\d+)\s*$/.exec(primer);
          var n = m ? parseInt(m[1], 10) : 1;
          var pref = window.CONFIG.PREFIJO_CODIGO;

          var nuevos = lineas.map(function (l, i) {
            var p = l.split(';').map(function (x) { return x.trim(); });
            if (i === 0 && /^nombre$/i.test(p[0])) return null;   /* encabezado de Excel */
            return {
              codigo: pref + '-' + String(n++).padStart(4, '0'),
              nombre: p[0] || 'Sin nombre',
              pais: p[1] || null,
              comite: p[2] || null,
              institucion: p[3] || null,
              rol: p[4] || 'delegado'
            };
          }).filter(Boolean);

          if (!nuevos.length) throw new Error('No se encontró ninguna fila válida en lo que pegaste.');
          return DB.delegados.crearVarios(nuevos).then(function () { return nuevos.length; });
        }).then(function (n) {
          UI.tostada(n + (n === 1 ? ' persona cargada.' : ' personas cargadas.'), 'ok');
          delegados();
        }).catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false; b.textContent = 'Cargar la lista';
        });
      });
    }
  }


  /* ================================================================
     COMIDAS
     ================================================================ */
  function comidas() {
    UI.cargando('Cargando las comidas');

    DB.comidas.listar().then(function (lista) {
      var html = '<h1>Comidas del evento</h1>' +
        '<p>Define aquí cada refrigerio y almuerzo. Es lo que el staff podrá marcar al escanear.</p>';

      html += '<details class="acordeon"><summary>Agregar una comida</summary><div class="cuerpo">' +
                '<div class="fila-campos">' +
                  campo('cmNombre', 'Nombre', 'Por ejemplo: Almuerzo, o Refrigerio de la mañana.') +
                  '<label class="campo" for="cmDia"><span>Día</span>' +
                    '<input type="number" id="cmDia" value="1" min="1" max="10"></label>' +
                  '<label class="campo" for="cmTipo"><span>Tipo</span><select id="cmTipo">' +
                    ['almuerzo', 'refrigerio', 'cena', 'coffee'].map(function (t) {
                      return '<option>' + t + '</option>'; }).join('') +
                  '</select></label>' +
                  '<label class="campo" for="cmFecha"><span>Fecha, opcional</span>' +
                    '<input type="date" id="cmFecha"></label>' +
                '</div>' +
                '<button type="button" class="btn" id="btnAddComida">Agregar comida</button>' +
              '</div></details>';

      if (!lista.length) {
        html += UI.vacio('&#127869;', 'Todavía no hay comidas cargadas.');
      } else {
        html += '<div class="tabla-env"><table class="datos">' +
                '<caption class="solo-lector">Comidas programadas del evento</caption>' +
                '<thead><tr><th scope="col">Día</th><th scope="col">Nombre</th><th scope="col">Tipo</th>' +
                '<th scope="col">Fecha</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>';
        lista.forEach(function (c) {
          html += '<tr>' +
            '<td class="num">' + c.dia + '</td>' +
            '<td><strong>' + UI.esc(c.nombre) + '</strong></td>' +
            '<td>' + UI.esc(c.tipo) + '</td>' +
            '<td>' + UI.esc(c.fecha || 'sin fecha') + '</td>' +
            '<td><span class="chip ' + (c.activa ? 'si' : 'no') + '">' + (c.activa ? 'Activa' : 'Oculta') + '</span></td>' +
            '<td>' +
              '<button type="button" class="btn sec chico" data-tog="' + c.id + '" data-a="' + (c.activa ? '1' : '0') + '">' +
                (c.activa ? 'Ocultar' : 'Activar') +
                '<span class="solo-lector"> ' + UI.esc(c.nombre) + ' del día ' + c.dia + '</span></button> ' +
              '<button type="button" class="btn rojo chico" data-delc="' + c.id + '" data-n="' + UI.esc(c.nombre) + '">' +
                'Borrar<span class="solo-lector"> ' + UI.esc(c.nombre) + ' del día ' + c.dia + '</span></button>' +
            '</td></tr>';
        });
        html += '</tbody></table></div>';
      }

      UI.pintar(html);

      UI.q('#btnAddComida').addEventListener('click', function () {
        var nombre = UI.q('#cmNombre').value.trim();
        var dia = parseInt(UI.q('#cmDia').value, 10) || 1;
        if (!nombre) {
          UI.tostada('Ponle un nombre a la comida.', 'err');
          UI.q('#cmNombre').focus();
          return;
        }
        var clave = 'd' + dia + '-' + nombre.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) +
          '-' + Date.now().toString().slice(-4);

        DB.comidas.crear({
          clave: clave, nombre: nombre, dia: dia,
          tipo: UI.q('#cmTipo').value,
          fecha: UI.q('#cmFecha').value || null,
          orden: (lista.length ? Math.max.apply(null, lista.map(function (x) { return x.orden || 0; })) : 0) + 1
        }).then(function () { UI.tostada('Comida agregada.', 'ok'); comidas(); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });

      UI.qq('[data-tog]').forEach(function (b) {
        b.addEventListener('click', function () {
          DB.comidas.actualizar(b.dataset.tog, { activa: b.dataset.a === '0' })
            .then(function () { UI.tostada('Comida actualizada.', 'ok'); comidas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.qq('[data-delc]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('Vas a borrar "' + b.dataset.n + '" y todos sus registros de entrega. ' +
                            'Esta acción no se puede deshacer. Confirmas?')) return;
          DB.comidas.borrar(b.dataset.delc)
            .then(function () { UI.tostada('Comida borrada.', 'ok'); comidas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });
    }).catch(function (e) {
      UI.pintar('<h1>Comidas del evento</h1>' + UI.aviso('err', 'No se pudieron cargar', UI.explicarError(e)));
    });
  }


  /* ================================================================
     GENERADOR DE CODIGOS QR
     ================================================================ */
  function qr() {
    UI.cargando('Cargando delegados');

    DB.delegados.listar().then(function (lista) {
      var html = '<h1>Generar los códigos QR</h1>' +
        '<section class="tarjeta no-imprimir" aria-labelledby="t-conf-qr">' +
          '<h2 id="t-conf-qr">Configuración</h2>' +
          '<label class="campo" for="urlBase"><span>Dirección pública del sitio</span>' +
            '<input type="text" id="urlBase" value="' + UI.esc(urlBase()) + '" ' +
              'aria-describedby="ayuda-url"></label>' +
          '<p class="ayuda-campo" id="ayuda-url">Cada código QR abre la credencial de esa persona. ' +
            'Verifica que esta sea la dirección definitiva antes de imprimir: un código QR no se puede ' +
            'corregir después de impreso.</p>' +
          '<div class="fila-campos">' +
            '<label class="campo" for="qrTam"><span>Tamaño del código</span><select id="qrTam">' +
              '<option value="3">Chico</option><option value="4" selected>Mediano</option>' +
              '<option value="6">Grande</option></select></label>' +
            '<label class="campo" for="qrDatos"><span>Datos impresos</span><select id="qrDatos">' +
              '<option value="full" selected>Nombre, código y comité</option>' +
              '<option value="min">Solo el código</option></select></label>' +
          '</div>' +
          '<div class="fila-btn">' +
            '<button type="button" class="btn" id="btnGen">Generar los códigos</button>' +
            '<button type="button" class="btn oro" id="btnImp">Imprimir</button>' +
          '</div>' +
          '<p role="status" aria-live="polite" id="estadoQR"></p>' +
        '</section>';

      if (!lista.length) {
        html += UI.vacio('&#128290;', 'Primero carga la lista de delegados.');
        UI.pintar(html);
        return;
      }

      html += '<section aria-labelledby="t-hoja"><h2 id="t-hoja" class="no-imprimir">Hoja para imprimir</h2>' +
              '<div id="hojaQR" class="qr-hoja"></div></section>';
      UI.pintar(html);

      UI.q('#btnGen').addEventListener('click', generar);
      UI.q('#btnImp').addEventListener('click', function () { window.print(); });
      generar();

      function generar() {
        var b = UI.q('#urlBase').value.trim().replace(/#.*$/, '').replace(/\/$/, '');
        var tam = parseInt(UI.q('#qrTam').value, 10);
        var modo = UI.q('#qrDatos').value;
        var cont = UI.q('#hojaQR');
        cont.innerHTML = '';

        lista.forEach(function (d) {
          var url = b + '/#/c/' + encodeURIComponent(d.codigo);
          var g;
          try { g = qrcode(0, 'M'); g.addData(url); g.make(); } catch (e) { return; }

          var caja = document.createElement('div');
          caja.className = 'qr-tarjeta';
          /* El SVG es una imagen con significado: se le da nombre para
             quien revise la hoja con lector de pantalla. */
          caja.innerHTML =
            '<div role="img" aria-label="Código QR de ' + UI.esc(d.nombre) + ', credencial ' + UI.esc(d.codigo) + '">' +
              g.createSvgTag({ cellSize: tam, margin: 1, scalable: true }) +
            '</div>' +
            (modo === 'full'
              ? '<p class="qr-nom">' + UI.esc(d.nombre) + '</p>' +
                '<p class="qr-cod">' + UI.esc(d.codigo) + '</p>' +
                '<p class="qr-meta">' + UI.esc([d.pais, d.comite].filter(Boolean).join(', ')) + '</p>'
              : '<p class="qr-cod">' + UI.esc(d.codigo) + '</p>');
          cont.appendChild(caja);
        });

        UI.q('#estadoQR').textContent = lista.length === 1
          ? 'Se genero 1 código QR.'
          : 'Se generaron ' + lista.length + ' códigos QR.';
      }
    }).catch(function (e) {
      UI.pintar('<h1>Generar los códigos QR</h1>' + UI.aviso('err', 'No se pudo cargar', UI.explicarError(e)));
    });
  }

  function urlBase() {
    var g = null;
    try { g = localStorage.getItem('intermun_url'); } catch (e) {}
    if (g) return g;
    return location.origin + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  }


  /* ================================================================
     AJUSTES Y ESTADO
     ================================================================ */
  function ajustes() {
    var est = VISTAS.estacionGuardada();
    var u = APP.usuarioActual();

    UI.pintar(
      '<h1>Ajustes y estado</h1>' +

      '<section class="tarjeta" aria-labelledby="t-dispositivo">' +
        '<h2 id="t-dispositivo">Este dispositivo</h2>' +
        '<label class="campo" for="selEst"><span>Estación de entrega</span>' +
          '<select id="selEst" aria-describedby="ayuda-est">' +
            '<option value="">Sin especificar</option>' +
            window.CONFIG.ESTACIONES.map(function (e) {
              return '<option value="' + UI.esc(e) + '"' + (e === est ? ' selected' : '') + '>' + UI.esc(e) + '</option>';
            }).join('') +
          '</select></label>' +
        '<p class="ayuda-campo" id="ayuda-est">Queda guardada en este teléfono. Sirve para saber después ' +
          'por que puerta paso cada delegado.</p>' +
        '<label class="campo" for="urlPub"><span>Dirección pública del sitio</span>' +
          '<input type="text" id="urlPub" value="' + UI.esc(urlBase()) + '"></label>' +
        '<button type="button" class="btn" id="btnGuardarAj">Guardar</button>' +
      '</section>' +

      '<section aria-labelledby="t-estado">' +
        '<h2 id="t-estado">Estado del sistema</h2>' +
        '<div id="estado" role="status" aria-live="polite"><p>Comprobando el estado, un momento.</p></div>' +
      '</section>'
    );

    UI.q('#btnGuardarAj').addEventListener('click', function () {
      try {
        var v = UI.q('#selEst').value;
        if (v) localStorage.setItem('intermun_estacion', v);
        else localStorage.removeItem('intermun_estacion');

        var u2 = UI.q('#urlPub').value.trim().replace(/\/$/, '');
        if (u2) localStorage.setItem('intermun_url', u2);
        else localStorage.removeItem('intermun_url');

        UI.tostada('Ajustes guardados en este dispositivo.', 'ok');
      } catch (e) {
        UI.tostada('Este navegador no permite guardar ajustes.', 'err');
      }
    });

    var filas = [
      ['Configuración de conexión', window.CONFIG.estaConfigurado()
        ? ['si', 'Lista'] : ['err', 'Falta editar el archivo de configuración']],
      ['Sesión de staff', u ? ['si', u.email] : ['no', 'Sin sesión iniciada']],
      ['Lectura en voz alta', window.VOZ ? ['si', 'Disponible'] : ['no', 'No disponible en este navegador']],
      ['Instalada como aplicación', (window.INSTALAR && window.INSTALAR.yaInstalada())
        ? ['si', 'Sí'] : ['no', 'Todavía no']]
    ];

    DB.probar().then(function (r) {
      filas.push(['Base de datos', r.ok ? ['si', 'Respondiendo'] : ['err', r.motivo]]);
      return (window.CONFIG.estaConfigurado() && r.ok)
        ? Promise.all([DB.delegados.listar(), DB.comidas.listar(), DB.entregas.listar()])
        : null;
    }).then(function (d) {
      if (d) {
        filas.push(['Delegados cargados', ['si', String(d[0].length)]]);
        filas.push(['Comidas cargadas', ['si', String(d[1].length)]]);
        filas.push(['Entregas registradas', ['si', String(d[2].length)]]);
      }
      UI.q('#estado').innerHTML =
        '<div class="tabla-env"><table class="datos">' +
        '<caption class="solo-lector">Estado de cada parte del sistema</caption>' +
        '<thead><tr><th scope="col">Componente</th><th scope="col">Estado</th></tr></thead><tbody>' +
        filas.map(function (f) {
          return '<tr><th scope="row">' + UI.esc(f[0]) + '</th>' +
                 '<td><span class="chip ' + f[1][0] + '">' + UI.esc(f[1][1]) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
    }).catch(function (e) {
      UI.q('#estado').innerHTML = UI.aviso('err', 'No se pudo comprobar', UI.explicarError(e));
    });
  }


  /* ================================================================
     SALAS DE CHAT
     ================================================================ */
  function salas() {
    UI.cargando('Cargando las salas');

    Promise.all([DB.chat.salas(), DB.delegados.listar()]).then(function (r) {
      var lista = r[0], delegados = r[1];

      /* Comités que aparecen en la lista de delegados y todavía no tienen sala */
      var existentes = {};
      lista.forEach(function (x) { if (x.comite) existentes[x.comite.toLowerCase()] = true; });
      var comites = {};
      delegados.forEach(function (d) { if (d.comite && d.comite.trim()) comites[d.comite.trim()] = true; });
      var faltantes = Object.keys(comites).filter(function (c) { return !existentes[c.toLowerCase()]; }).sort();

      var html = '<h1>Salas de chat</h1>' +
        '<p>Cada sala es un espacio de conversación con archivos PDF. La sala general es para todas las personas ' +
        'acreditadas; las demás corresponden a un comité.</p>';

      if (faltantes.length) {
        html += '<div class="aviso info" role="note"><b>Comités sin sala</b>' +
          'En la lista de delegados hay ' + faltantes.length + ' comité(s) que todavía no tienen sala: ' +
          UI.esc(faltantes.join(', ')) + '. ' +
          '<button type="button" class="btn chico" id="btnSalasComites" style="margin-top:.5rem">Crear una sala por cada uno</button></div>';
      }

      html += '<details class="acordeon"><summary>Crear una sala</summary><div class="cuerpo">' +
        '<div class="fila-campos">' +
          campo('slNombre', 'Nombre de la sala', 'Por ejemplo: Consejo de Seguridad.') +
          campo('slComite', 'Comité asociado (opcional)', 'Exactamente como figura en la lista de delegados, para sugerirla como "tu comité".') +
        '</div>' +
        '<label class="campo" for="slDesc"><span>Descripción (opcional)</span><input type="text" id="slDesc"></label>' +
        '<button type="button" class="btn" id="btnCrearSala">Crear sala</button>' +
      '</div></details>';

      if (!lista.length) {
        html += UI.vacio('&#128172;', 'No hay salas todavía. Ejecuta el script INSTALACION-INTERBOT-Y-CHAT.sql para crear la sala general.');
      } else {
        html += '<div class="tabla-env"><table class="datos">' +
          '<caption class="solo-lector">Salas de chat del evento</caption>' +
          '<thead><tr><th scope="col">Sala</th><th scope="col">Tipo</th><th scope="col">Comité</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead><tbody>';
        lista.forEach(function (x) {
          html += '<tr>' +
            '<td><strong>' + UI.esc(x.nombre) + '</strong><br><small class="silencio">' + UI.esc(x.descripcion || '') + '</small></td>' +
            '<td>' + UI.esc(x.tipo) + '</td>' +
            '<td>' + UI.esc(x.comite || '') + '</td>' +
            '<td><span class="chip ' + (x.activa ? 'si' : 'no') + '">' + (x.activa ? 'Abierta' : 'Cerrada') + '</span></td>' +
            '<td>' +
              '<a class="btn sec chico" href="#/chat/' + encodeURIComponent(x.clave) + '">Entrar<span class="solo-lector"> a ' + UI.esc(x.nombre) + '</span></a> ' +
              '<button type="button" class="btn sec chico" data-tog-sala="' + x.id + '" data-a="' + (x.activa ? '1' : '0') + '">' +
                (x.activa ? 'Cerrar' : 'Abrir') + '<span class="solo-lector"> ' + UI.esc(x.nombre) + '</span></button> ' +
              (x.tipo === 'general' ? '' :
                '<button type="button" class="btn rojo chico" data-del-sala="' + x.id + '" data-n="' + UI.esc(x.nombre) + '">Borrar<span class="solo-lector"> ' + UI.esc(x.nombre) + '</span></button>') +
            '</td></tr>';
        });
        html += '</tbody></table></div>';
      }

      UI.pintar(html);

      function claveDe(nombre) {
        return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || ('sala-' + Date.now());
      }

      function crear(nombre, comite, desc) {
        return DB.chat.crearSala({
          clave: claveDe(nombre), nombre: nombre, comite: comite || null,
          descripcion: desc || null, tipo: 'comite',
          orden: (lista.length ? Math.max.apply(null, lista.map(function (x) { return x.orden || 0; })) : 0) + 1
        });
      }

      UI.q('#btnCrearSala').addEventListener('click', function () {
        var nombre = UI.q('#slNombre').value.trim();
        if (!nombre) { UI.tostada('Ponle un nombre a la sala.', 'err'); UI.q('#slNombre').focus(); return; }
        crear(nombre, UI.q('#slComite').value.trim(), UI.q('#slDesc').value.trim())
          .then(function () { UI.tostada('Sala creada.', 'ok'); salas(); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });

      var btnAuto = UI.q('#btnSalasComites');
      if (btnAuto) btnAuto.addEventListener('click', function () {
        btnAuto.disabled = true;
        var cadena = Promise.resolve();
        faltantes.forEach(function (c) {
          cadena = cadena.then(function () { return crear(c, c, 'Sala del comité ' + c + '.'); });
        });
        cadena.then(function () { UI.tostada(faltantes.length + ' sala(s) creada(s).', 'ok'); salas(); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); btnAuto.disabled = false; });
      });

      UI.qq('[data-tog-sala]').forEach(function (b) {
        b.addEventListener('click', function () {
          DB.chat.actualizarSala(b.dataset.togSala, { activa: b.dataset.a === '0' })
            .then(function () { UI.tostada('Sala actualizada.', 'ok'); salas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });

      UI.qq('[data-del-sala]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!UI.confirmar('Vas a borrar la sala "' + b.dataset.n + '" con TODOS sus mensajes. No se puede deshacer. Confirmas?')) return;
          DB.chat.borrarSala(b.dataset.delSala)
            .then(function () { UI.tostada('Sala borrada.', 'ok'); salas(); })
            .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
        });
      });
    }).catch(function (e) {
      UI.pintar('<h1>Salas de chat</h1>' + UI.aviso('err', 'No se pudieron cargar las salas',
        UI.explicarError(e) + ' Si las tablas del chat no existen todavía, ejecuta INSTALACION-INTERBOT-Y-CHAT.sql.'));
    });
  }


  /* ---------- Pantalla cuando falta configurar ---------- */
  function sinConfigurar() {
    UI.pintar(
      '<h1>Falta conectar el sistema</h1>' +
      UI.aviso('warn', 'Todavía no está configurado',
        'El portal funciona, pero las credenciales y el control de comidas necesitan la conexión con la base de datos.') +
      '<h2>Qué hay que hacer</h2>' +
      '<ol>' +
        '<li>Crear un proyecto gratuito en supabase punto com.</li>' +
        '<li>Ejecutar el archivo de instalación en su editor de consultas.</li>' +
        '<li>Copiar la dirección y la clave pública del proyecto en el archivo de configuración.</li>' +
        '<li>Crear los usuarios del staff.</li>' +
      '</ol>' +
      '<p>Los pasos completos están en la guía de instalación que acompaña al sistema.</p>' +
      '<p><a class="btn sec" href="#/">Volver al portal</a></p>'
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
    salas: salas,
    ajustes: ajustes
  };
})();

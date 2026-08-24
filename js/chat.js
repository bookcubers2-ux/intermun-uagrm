/* ====================================================================
   InterMUN UAGRM | Chat por comités
   --------------------------------------------------------------------
   Una sala general y una sala por comité. Cualquier persona con un
   código de credencial activo puede leer, escribir y compartir PDF.
   Los mensajes llegan en tiempo real desde la base de datos.

   Accesibilidad:
   - Los mensajes viven en una región de registro (role="log") con
     aria-live, así el lector de pantalla anuncia los nuevos.
   - Los mensajes propios se distinguen con la etiqueta "Tú", no solo
     con color.
   - El estado (enviando, subiendo archivo) se dice con texto.
   ==================================================================== */

window.CHAT = (function () {
  'use strict';

  var MAX_PDF = 10 * 1024 * 1024;

  /* ================================================================
     ENTRADA: lista de salas o una sala concreta
     ================================================================ */
  function vista(claveSala) {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>Chat</h1>' +
        UI.aviso('warn', 'El sistema todavía no está conectado',
          'El chat necesita la conexión con la base de datos.'));
      return;
    }
    var yo = DB.identidad.obtener();
    if (!yo) {
      IDENT.pedir({
        titulo: 'Chat de InterMUN',
        intro: '<p>Un espacio para conversar con las demás delegaciones: una sala general y una sala por ' +
               'comité. Puedes compartir archivos PDF para que los demás los lean.</p>',
        boton: 'Entrar al chat',
        alListo: function () { vista(claveSala); }
      });
      return;
    }
    if (claveSala) sala(yo, claveSala); else listaSalas(yo);
  }


  /* ================================================================
     LISTA DE SALAS
     ================================================================ */
  function listaSalas(yo) {
    UI.cargando('Cargando las salas');
    DB.chat.salasActivas().then(function (salas) {
      var html = '<h1>Chat de InterMUN</h1>' + IDENT.lineaIdentidad(yo, 'chCambiar');

      if (!salas.length) {
        html += UI.vacio('&#128172;', 'Todavía no hay salas abiertas. El Secretariado las habilita desde el panel de control.');
      } else {
        var propia = salas.filter(function (s) { return esMiForo(s, yo.comite); })[0];
        html += '<h2>Salas disponibles</h2><ul class="rejilla" role="list">';
        salas.forEach(function (s) {
          var esPropia = propia && propia.id === s.id;
          html += '<li><a class="modulo" href="#/chat/' + encodeURIComponent(s.clave) + '">' +
                    UI.icono(s.tipo === 'general' ? '&#127760;' : '&#128172;') +
                    '<strong>' + UI.esc(s.nombre) + (esPropia ? ' <span class="chip si">Tu comité</span>' : '') + '</strong>' +
                    '<span class="d">' + UI.esc(s.descripcion || (s.tipo === 'general' ? 'Para todas las personas acreditadas.' : 'Sala del comité ' + (s.comite || s.nombre) + '.')) + '</span>' +
                  '</a></li>';
        });
        html += '</ul>';
      }

      html += UI.aviso('info', 'Normas del chat',
        'Trato respetuoso siempre, como en el comité. Los mensajes llevan tu nombre y tu código. ' +
        'El Secretariado puede retirar mensajes que falten a las normas. Solo se pueden adjuntar archivos PDF de hasta 10 MB.');

      UI.pintar(html);
      UI.q('#chCambiar').addEventListener('click', function () {
        DB.identidad.limpiar(); vista();
        if (window.A11Y) window.A11Y.enfocarTitulo();
      });
    }).catch(function (e) {
      var m = (e && e.message) || '';
      if (/does not exist|42P01|schema cache/i.test(m)) {
        UI.pintar('<h1>Chat de InterMUN</h1>' +
          UI.aviso('warn', 'El chat todavía no fue activado',
            'El Secretariado lo habilitará antes del evento. Mientras tanto puedes usar el resto del portal.') +
          '<p><a class="btn sec" href="#/">Ir al inicio del portal</a></p>');
        return;
      }
      UI.pintar('<h1>Chat de InterMUN</h1>' + UI.aviso('err', 'No se pudieron cargar las salas', UI.explicarError(e)));
    });
  }


  /* ================================================================
     UNA SALA
     ================================================================ */
  function sala(yo, clave) {
    UI.cargando('Abriendo la sala');

    var s = null, mensajes = [], archivoElegido = null;

    DB.chat.salaPorClave(clave).then(function (encontrada) {
      if (!encontrada || !encontrada.activa) throw new Error('__no_sala__');
      s = encontrada;
      return DB.chat.mensajes(s.id, 100);
    }).then(function (lista) {
      mensajes = lista;
      pintar();
      /* El canal se cierra solo al cambiar de vista. */
      APP.registrarCanal(DB.chat.escuchar(s.id, alCambio));
    }).catch(function (e) {
      if (e.message === '__no_sala__') {
        UI.pintar('<h1>Sala no encontrada</h1>' +
          UI.aviso('warn', 'Esta sala no existe o fue cerrada', 'Vuelve a la lista de salas para elegir otra.') +
          '<p><a class="btn sec" href="#/chat">Ver las salas</a></p>');
      } else {
        UI.pintar('<h1>Chat</h1>' + UI.aviso('err', 'No se pudo abrir la sala', UI.explicarError(e)));
      }
    });


    function pintar() {
      var esStaff = !!APP.usuarioActual();
      UI.pintar(
        '<h1>' + UI.esc(s.nombre) + '</h1>' +
        '<p><a href="#/chat">Volver a la lista de salas</a></p>' +
        IDENT.lineaIdentidad(yo, 'chCambiar') +

        '<section aria-labelledby="t-ch-msgs">' +
          '<h2 id="t-ch-msgs">Mensajes</h2>' +
          '<p class="silencio" id="chConteo"></p>' +
          '<div class="ch-log" id="chLog" role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensajes de la sala"></div>' +
        '</section>' +

        '<section aria-labelledby="t-ch-escribir">' +
          '<h2 id="t-ch-escribir">Escribir</h2>' +
          '<label class="campo" for="chTexto"><span>Tu mensaje</span>' +
            '<textarea id="chTexto" rows="3" aria-describedby="ch-ayuda"></textarea></label>' +
          '<p class="ayuda-campo" id="ch-ayuda">Enter envía. Shift más Enter hace un salto de línea. Máximo 2000 caracteres.</p>' +
          '<label class="campo" for="chArchivo"><span>Adjuntar un PDF (opcional)</span>' +
            '<input type="file" id="chArchivo" accept="application/pdf,.pdf" aria-describedby="ch-ayuda-pdf"></label>' +
          '<p class="ayuda-campo" id="ch-ayuda-pdf">Solo archivos PDF, hasta 10 MB. Se comparten con toda la sala.</p>' +
          '<p role="status" aria-live="polite" id="chEstado" class="silencio"></p>' +
          '<div class="fila-btn">' +
            '<button type="button" class="btn" id="chEnviar">Enviar</button>' +
          '</div>' +
        '</section>'
      );

      var log = UI.q('#chLog');
      log.innerHTML = '';
      mensajes.forEach(function (m) { agregar(m, esStaff); });
      actualizarConteo();

      UI.q('#chCambiar').addEventListener('click', function () {
        DB.identidad.limpiar(); vista(clave);
        if (window.A11Y) window.A11Y.enfocarTitulo();
      });
      UI.q('#chArchivo').addEventListener('change', function () {
        var f = this.files && this.files[0];
        archivoElegido = null;
        if (!f) return;
        if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
          UI.tostada('Solo se pueden adjuntar archivos PDF.', 'err'); this.value = ''; return;
        }
        if (f.size > MAX_PDF) {
          UI.tostada('El archivo supera los 10 MB. Reduce su tamaño e inténtalo de nuevo.', 'err'); this.value = ''; return;
        }
        archivoElegido = f;
        UI.q('#chEstado').textContent = 'Archivo listo para enviar: ' + f.name + ' (' + tamano(f.size) + ').';
      });
      UI.q('#chEnviar').addEventListener('click', enviar);
      UI.q('#chTexto').addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enviar(); }
      });
    }

    function actualizarConteo() {
      var c = UI.q('#chConteo');
      if (!c) return;
      c.textContent = mensajes.length
        ? (mensajes.length === 1 ? 'Hay 1 mensaje en esta sala.' : 'Hay ' + mensajes.length + ' mensajes en esta sala. Se muestran los últimos 100.')
        : 'Todavía no hay mensajes. Escribe el primero.';
    }

    function agregar(m, esStaff) {
      var log = UI.q('#chLog');
      if (!log || UI.q('[data-msg="' + m.id + '"]')) return;
      var mio = m.codigo === yo.codigo;
      var art = document.createElement('article');
      art.className = 'ch-msg' + (mio ? ' ch-mio' : '');
      art.setAttribute('data-msg', m.id);

      var cab = '<p class="ch-cab"><strong>' + UI.esc(mio ? 'Tú' : m.nombre) + '</strong> ' +
                '<span class="ch-cod mono">' + UI.esc(m.codigo) + '</span> ' +
                '<time datetime="' + UI.esc(m.creado_en) + '">' + UI.hora(m.creado_en) + '</time>' +
                (esStaff ? ' <button type="button" class="btn rojo chico" data-borrar-msg="' + m.id + '">Retirar<span class="solo-lector"> el mensaje de ' + UI.esc(m.nombre) + '</span></button>' : '') +
                '</p>';
      var cuerpo = '';
      if (m.texto) {
        cuerpo += String(m.texto).split(/\n{2,}/).map(function (p) { return '<p>' + UI.esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
      }
      if (m.archivo_ruta) {
        cuerpo += '<p class="ch-archivo"><a href="' + UI.esc(DB.chat.urlArchivo(m.archivo_ruta)) + '" target="_blank" rel="noopener">' +
                  'PDF: ' + UI.esc(m.archivo_nombre || 'archivo.pdf') + (m.archivo_tamano ? ' (' + tamano(m.archivo_tamano) + ')' : '') +
                  '<span class="solo-lector">, se abre en una pestaña nueva</span></a></p>';
      }
      art.innerHTML = cab + cuerpo;
      log.appendChild(art);

      var b = art.querySelector('[data-borrar-msg]');
      if (b) b.addEventListener('click', function () {
        if (!UI.confirmar('Vas a retirar este mensaje de la sala para todo el mundo. Confirmas?')) return;
        DB.chat.borrar(m.id).then(function () { UI.tostada('Mensaje retirado.', 'ok'); })
          .catch(function (e) { UI.tostada(UI.explicarError(e), 'err'); });
      });
      return art;
    }

    function alCambio(p) {
      if (p.eventType === 'INSERT' && p.new) {
        if (UI.q('[data-msg="' + p.new.id + '"]')) return;
        mensajes.push(p.new);
        var art = agregar(p.new, !!APP.usuarioActual());
        actualizarConteo();
        if (art && p.new.codigo !== yo.codigo && window.A11Y) {
          window.A11Y.anunciar('Nuevo mensaje de ' + p.new.nombre + '.');
        }
      } else if (p.eventType === 'DELETE' && p.old) {
        var el = UI.q('[data-msg="' + p.old.id + '"]');
        if (el) el.remove();
        mensajes = mensajes.filter(function (m) { return m.id !== p.old.id; });
        actualizarConteo();
      }
    }

    function enviar() {
      var texto = UI.q('#chTexto').value.trim();
      if (!texto && !archivoElegido) { UI.tostada('Escribe un mensaje o adjunta un PDF.', 'err'); UI.q('#chTexto').focus(); return; }
      if (texto.length > 2000) { UI.tostada('El mensaje supera los 2000 caracteres.', 'err'); return; }

      var btn = UI.q('#chEnviar'), estado = UI.q('#chEstado');
      btn.disabled = true;

      var paso = Promise.resolve(null);
      if (archivoElegido) {
        estado.textContent = 'Subiendo el archivo, un momento.';
        paso = DB.chat.subirArchivo(yo.codigo, archivoElegido);
      }
      paso.then(function (archivo) {
        estado.textContent = 'Enviando.';
        return DB.chat.enviar(yo.codigo, s.id, texto, archivo);
      }).then(function (m) {
        estado.textContent = '';
        UI.q('#chTexto').value = '';
        UI.q('#chArchivo').value = '';
        archivoElegido = null;
        if (m && !UI.q('[data-msg="' + m.id + '"]')) { mensajes.push(m); agregar(m, !!APP.usuarioActual()); actualizarConteo(); }
        UI.tostada('Mensaje enviado.', 'ok');
      }).catch(function (e) {
        estado.textContent = '';
        UI.tostada(UI.explicarError(e), 'err');
      }).then(function () {
        btn.disabled = false;
        UI.q('#chTexto').focus();
      });
    }
  }

  /* Reconoce la sala del propio comité aunque el nombre registrado en la
     credencial no coincida letra por letra: compara sin tildes ni
     mayúsculas, acepta la sigla entre paréntesis (CSI, DISEC...) y que
     un nombre contenga al otro. */
  function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function esMiForo(sala, comiteDelegado) {
    if (!sala || !comiteDelegado || sala.tipo === 'general') return false;
    var a = normalizar(sala.comite || sala.nombre), b = normalizar(comiteDelegado);
    if (!a || !b) return false;
    if (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0) return true;
    var sigla = /\(([^)]+)\)/.exec(sala.comite || sala.nombre);
    if (sigla && normalizar(sigla[1]) === b) return true;
    if (sala.clave && normalizar(sala.clave) === b) return true;
    return false;
  }

  function tamano(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  return { vista: vista };
})();

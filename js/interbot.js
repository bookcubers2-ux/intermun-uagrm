/* ====================================================================
   InterMUN UAGRM | InterBot, el asistente con inteligencia artificial
   --------------------------------------------------------------------
   Solo texto. Cada delegada o delegado conversa identificándose con
   su código de credencial; la respuesta la produce la función en la
   nube "interbot" (que es la que guarda la clave del proveedor).

   Accesibilidad:
   - La conversación es una región de registro (role="log") con
     aria-live, así el lector de pantalla anuncia cada respuesta.
   - Nada de indicadores giratorios: el estado se dice con texto.
   - Enter envía, Shift+Enter hace salto de línea; también hay botón.
   ==================================================================== */

window.INTERBOT = (function () {
  'use strict';

  var MAX_HISTORIAL = 30;

  var SUGERENCIAS = [
    '¿Cómo propongo un caucus moderado?',
    '¿Qué hago si el chair no me da la palabra?',
    '¿Cómo redacto una cláusula operativa?',
    '¿Cuál es la diferencia entre sponsor y signatario?',
    '¿Cómo empiezo mi discurso de apertura?'
  ];

  function claveHistorial(codigo) { return 'intermun_interbot_' + codigo; }

  function leerHistorial(codigo) {
    try { return JSON.parse(localStorage.getItem(claveHistorial(codigo)) || '[]'); }
    catch (e) { return []; }
  }

  function guardarHistorial(codigo, h) {
    try { localStorage.setItem(claveHistorial(codigo), JSON.stringify(h.slice(-MAX_HISTORIAL))); } catch (e) {}
  }


  /* ================================================================
     VISTA
     ================================================================ */
  function vista() {
    if (!DB.hayConexion()) {
      UI.pintar('<h1>InterBot</h1>' +
        UI.aviso('warn', 'El sistema todavía no está conectado',
          'InterBot necesita la conexión con la base de datos para verificar tu credencial.'));
      return;
    }

    var yo = DB.identidad.obtener();
    if (!yo) { pedirCredencial(); return; }
    pintarChat(yo);
  }


  /* ---------- Paso 1: identificarse con el código ---------- */
  function pedirCredencial() {
    IDENT.pedir({
      titulo: 'InterBot',
      intro: '<p>InterBot es el asistente de InterMUN. Le puedes preguntar cómo proponer una moción, ' +
             'qué hacer en una situación del comité, cómo redactar una cláusula, o cualquier duda ' +
             'sobre el procedimiento y la plataforma.</p>',
      boton: 'Empezar a conversar',
      alListo: function (d) { pintarChat(d); }
    });
  }


  /* ---------- Paso 2: la conversación ---------- */
  function pintarChat(yo) {
    var historial = leerHistorial(yo.codigo);

    UI.pintar(
      '<h1>InterBot</h1>' +
      '<p class="silencio">Conversas como <strong>' + UI.esc(yo.nombre) + '</strong>' +
        (yo.pais ? ', ' + UI.esc(yo.pais) : '') + (yo.comite ? ', ' + UI.esc(yo.comite) : '') +
        '. <button type="button" class="btn sec chico" id="ibCambiar">Cambiar de credencial</button></p>' +

      '<section aria-labelledby="t-ib-conv">' +
        '<h2 id="t-ib-conv">Conversación</h2>' +
        '<div class="ib-log" id="ibLog" role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensajes de la conversación"></div>' +
        '<p role="status" aria-live="polite" id="ibEstado" class="silencio"></p>' +
      '</section>' +

      '<section aria-labelledby="t-ib-preg">' +
        '<h2 id="t-ib-preg">Tu pregunta</h2>' +
        '<div id="ibSugerencias" class="ib-sugerencias"></div>' +
        '<label class="campo" for="ibTexto"><span>Escribe tu pregunta</span>' +
          '<textarea id="ibTexto" rows="3" aria-describedby="ib-ayuda-texto"></textarea></label>' +
        '<p class="ayuda-campo" id="ib-ayuda-texto">Enter envía. Shift más Enter hace un salto de línea.</p>' +
        '<div class="fila-btn">' +
          '<button type="button" class="btn" id="ibEnviar">Preguntar a InterBot</button>' +
          '<button type="button" class="btn sec" id="ibNueva">Nueva conversación</button>' +
        '</div>' +
      '</section>' +

      UI.aviso('info', 'Cómo usar InterBot',
        'Es un asistente automático: orienta sobre procedimiento, redacción y estrategia, pero no conoce la ' +
        'logística del evento. Para fechas, aulas u horarios, consulta al Secretariado. Sus respuestas son una ' +
        'guía, no una decisión oficial de la Mesa.')
    );

    var log = UI.q('#ibLog');
    var estado = UI.q('#ibEstado');
    var texto = UI.q('#ibTexto');
    var btn = UI.q('#ibEnviar');

    /* Historial previo, o bienvenida */
    if (historial.length) {
      historial.forEach(function (m) { agregar(m.rol, m.texto, true); });
    } else {
      agregar('bot', 'Hola, ' + yo.nombre.split(' ')[0] + '. Soy InterBot. Pregúntame lo que necesites sobre ' +
        'el procedimiento, cómo intervenir en tu comité o cómo redactar tus documentos.', true);
    }
    pintarSugerencias(!historial.length);

    UI.q('#ibCambiar').addEventListener('click', function () {
      DB.identidad.limpiar();
      pedirCredencial();
      if (window.A11Y) window.A11Y.enfocarTitulo();
    });

    UI.q('#ibNueva').addEventListener('click', function () {
      if (historial.length && !UI.confirmar('Se borrará esta conversación de tu dispositivo. Confirmas?')) return;
      historial = [];
      guardarHistorial(yo.codigo, historial);
      log.innerHTML = '';
      agregar('bot', 'Conversación nueva. Pregúntame lo que quieras.', true);
      pintarSugerencias(true);
      texto.focus();
    });

    btn.addEventListener('click', enviar);
    texto.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); enviar(); }
    });


    function pintarSugerencias(mostrar) {
      var c = UI.q('#ibSugerencias');
      if (!mostrar) { c.innerHTML = ''; return; }
      c.innerHTML = '<p class="silencio">Ejemplos de preguntas:</p><ul class="ib-chips" role="list">' +
        SUGERENCIAS.map(function (s) {
          return '<li><button type="button" class="btn sec chico" data-sug="' + UI.esc(s) + '">' + UI.esc(s) + '</button></li>';
        }).join('') + '</ul>';
      UI.qq('[data-sug]').forEach(function (b) {
        b.addEventListener('click', function () { texto.value = b.getAttribute('data-sug'); enviar(); });
      });
    }

    function agregar(rol, contenido, silencioso) {
      var art = document.createElement('article');
      art.className = 'ib-msg ' + (rol === 'usuario' ? 'ib-yo' : 'ib-bot');
      var quien = document.createElement('p');
      quien.className = 'ib-quien';
      quien.textContent = rol === 'usuario' ? 'Tú' : 'InterBot';
      art.appendChild(quien);
      String(contenido).split(/\n{2,}|\n(?=\d+\.\s)/).forEach(function (parrafo) {
        var p = document.createElement('p');
        p.textContent = parrafo.trim();
        if (p.textContent) art.appendChild(p);
      });
      log.appendChild(art);
      if (!silencioso) art.scrollIntoView({ block: 'nearest' });
      return art;
    }

    function enviar() {
      var pregunta = texto.value.trim();
      if (!pregunta) { UI.tostada('Escribe una pregunta primero.', 'err'); texto.focus(); return; }
      if (pregunta.length > 1500) { UI.tostada('La pregunta es muy larga. Resúmela en menos de 1500 caracteres.', 'err'); return; }

      pintarSugerencias(false);
      texto.value = '';
      agregar('usuario', pregunta);
      historial.push({ rol: 'usuario', texto: pregunta });
      guardarHistorial(yo.codigo, historial);

      btn.disabled = true;
      estado.textContent = 'InterBot está escribiendo la respuesta.';

      DB.interbot.preguntar(yo.codigo, historial.slice(-12))
        .then(function (r) {
          estado.textContent = '';
          agregar('bot', r.respuesta);
          historial.push({ rol: 'bot', texto: r.respuesta });
          guardarHistorial(yo.codigo, historial);
        })
        .catch(function (e) {
          estado.textContent = '';
          var msg = explicar(e);
          agregar('bot', msg);
          if (window.A11Y) window.A11Y.anunciar(msg, true);
        })
        .then(function () {
          btn.disabled = false;
          texto.focus();
        });
    }
  }


  function explicar(e) {
    var c = (e && e.codigo) || '';
    if (c === 'CREDENCIAL_INVALIDA') { DB.identidad.limpiar(); return 'Tu credencial ya no está activa. Vuelve a identificarte o acércate a la mesa de acreditación.'; }
    if (c === 'MUY_RAPIDO') return 'Vas muy rápido. Espera un momento y vuelve a preguntar.';
    if (c === 'LIMITE_DIARIO') return 'Llegaste al máximo de preguntas por día para tu credencial. Mañana podrás seguir. Mientras tanto, revisa las secciones de Reglas y Guía del portal.';
    if (c === 'LIMITE_GLOBAL') return 'InterBot alcanzó su cupo de preguntas de hoy para todo el evento. Vuelve a intentarlo mañana, o revisa las secciones de Reglas y Guía.';
    if (c === 'CUOTA_PROVEEDOR') return 'El servicio de inteligencia artificial está saturado en este momento. Espera un minuto y vuelve a intentarlo.';
    if (c === 'SIN_CLAVE') return 'InterBot todavía no fue activado por el Secretariado.';
    if (c === 'BLOQUEADO') return 'No puedo responder a esa pregunta. Intenta formularla de otra manera.';
    if (/Failed to fetch|NetworkError|network/i.test((e && e.message) || '')) return 'No hay conexión con InterBot. Revisa tu internet y vuelve a intentarlo.';
    return 'InterBot no pudo responder ahora mismo. Vuelve a intentarlo en un momento.';
  }

  return { vista: vista };
})();

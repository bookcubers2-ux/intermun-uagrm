/* ====================================================================
   InterMUN UAGRM | Lectura en voz alta
   --------------------------------------------------------------------
   Segundo lector, complementario al lector de pantalla. Sirve a quien
   no usa lector de pantalla pero le cuesta leer: baja vision, dislexia,
   fatiga visual, o simplemente prefiere escuchar.

   Usa la voz que ya trae el dispositivo (Web Speech API): no envia el
   texto a ningun servidor, funciona sin conexion y no cuesta nada.

   Todo texto pasa antes por el filtro de TEXTO.paraVoz, para que las
   siglas y los codigos de credencial suenen bien.
   ==================================================================== */

window.VOZ = (function () {
  'use strict';

  var sintetizador = window.speechSynthesis;
  if (!sintetizador) return null;

  var cola = [];
  var hablando = false;
  var vozElegida = null;
  var velocidad = 1;

  /* Elige la mejor voz en espanol disponible en el dispositivo.
     Se prefiere una voz local (funciona sin internet) y de America
     Latina, que es la que suena natural para el publico boliviano. */
  function puntuar(v) {
    var p = 0;
    var lang = (v.lang || '').toLowerCase();
    if (lang.indexOf('es') !== 0) return -1;
    if (v.localService) p += 8;
    if (/es-(bo|pe|cl|ar|co|mx|us|419)/.test(lang)) p += 5;
    if (/es-es/.test(lang)) p += 1;
    if (/google/i.test(v.name || '')) p += 2;
    return p;
  }

  function elegirVoz() {
    var voces = sintetizador.getVoices() || [];
    var candidatas = voces.filter(function (v) { return puntuar(v) >= 0; });
    if (!candidatas.length) return null;
    candidatas.sort(function (a, b) { return puntuar(b) - puntuar(a); });
    return candidatas[0];
  }

  vozElegida = elegirVoz();
  if (typeof sintetizador.onvoiceschanged !== 'undefined') {
    sintetizador.onvoiceschanged = function () { vozElegida = elegirVoz(); };
  }

  function avisar(nombre) {
    document.dispatchEvent(new CustomEvent(nombre));
  }

  function detener() {
    cola = [];
    hablando = false;
    try { sintetizador.cancel(); } catch (e) {}
    quitarResaltado();
    avisar('intermun:voz-fin');
  }

  function quitarResaltado() {
    document.querySelectorAll('.voz-leyendo').forEach(function (el) {
      el.classList.remove('voz-leyendo');
    });
  }

  function siguiente() {
    if (!cola.length) {
      hablando = false;
      quitarResaltado();
      avisar('intermun:voz-fin');
      return;
    }
    var item = cola.shift();
    var limpio = window.TEXTO ? window.TEXTO.paraVoz(item.texto) : item.texto;
    if (!limpio) { siguiente(); return; }

    var u = new SpeechSynthesisUtterance(limpio);
    u.lang = (vozElegida && vozElegida.lang) || 'es-ES';
    if (vozElegida) u.voice = vozElegida;
    u.rate = velocidad;
    u.pitch = 1;

    quitarResaltado();
    if (item.elemento) item.elemento.classList.add('voz-leyendo');

    u.onend = function () { siguiente(); };
    u.onerror = function () { siguiente(); };

    try { sintetizador.speak(u); }
    catch (e) { siguiente(); }
  }

  function hablarBloques(elementos) {
    detener();
    elementos.forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (t) cola.push({ texto: t, elemento: el });
    });
    if (!cola.length) return;
    hablando = true;
    avisar('intermun:voz-inicio');
    siguiente();
  }

  function hablar(texto) {
    detener();
    cola.push({ texto: texto, elemento: null });
    hablando = true;
    avisar('intermun:voz-inicio');
    siguiente();
  }

  /* Lee el contenido principal en el orden en que esta escrito. */
  function leerPagina() {
    var main = document.getElementById('contenido');
    if (!main) return;
    var seleccion = main.querySelectorAll(
      'h1, h2, h3, p, li, caption, .aviso, .metrica, .cred-dato, td, .qr-nom'
    );
    var elementos = Array.prototype.slice.call(seleccion).filter(function (el) {
      if (!el.textContent || !el.textContent.trim()) return false;
      if (el.closest('.no-imprimir')) return true;
      return true;
    });
    if (!elementos.length) { hablar('Esta pagina no tiene texto para leer.'); return; }
    hablarBloques(elementos);
  }

  function fijarVelocidad(v) {
    velocidad = Math.min(1.6, Math.max(0.6, Number(v) || 1));
    return velocidad;
  }

  /* Si la persona cambia de vista, la voz anterior deja de tener
     sentido: se detiene sola. */
  window.addEventListener('hashchange', function () {
    if (hablando) detener();
  });

  return {
    leerPagina: leerPagina,
    hablar: hablar,
    hablarBloques: hablarBloques,
    detener: detener,
    fijarVelocidad: fijarVelocidad,
    velocidad: function () { return velocidad; },
    estaHablando: function () { return hablando; },
    vozActual: function () { return vozElegida ? (vozElegida.name + ' (' + vozElegida.lang + ')') : null; }
  };
})();

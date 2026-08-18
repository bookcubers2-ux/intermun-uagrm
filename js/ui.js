/* ====================================================================
   InterMUN UAGRM | Utilidades de interfaz
   Todas construyen marcado accesible por defecto.
   ==================================================================== */

window.UI = (function () {
  'use strict';

  /* ---------- Escapar texto antes de insertarlo en HTML ---------- */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------- Aviso breve.
     Se ve en pantalla y ademas se anuncia al lector de pantalla. ---- */
  var relojTostada = null;
  function tostada(mensaje, tipo) {
    var t = document.getElementById('tostada');
    if (t) {
      t.textContent = mensaje;
      t.className = 'anuncio' + (tipo ? ' ' + tipo : '');
      t.style.position = 'fixed';
      t.style.left = '50%';
      t.style.bottom = '1rem';
      t.style.transform = 'translateX(-50%)';
      t.style.zIndex = '150';
      t.style.maxWidth = '92vw';
      clearTimeout(relojTostada);
      relojTostada = setTimeout(function () {
        t.className = 'oculto';
      }, tipo === 'err' ? 7000 : 4500);
    }
    if (window.A11Y) window.A11Y.anunciar(mensaje, tipo === 'err');
  }

  /* ---------- Pintar el contenido principal ----------
     Las vistas pintan primero un "cargando" y despues el contenido
     real, cuando llegan los datos. Si el foco se moviera al primer
     pintado, se perderia al llegar el segundo y la persona ciega
     quedaria de vuelta al principio del documento.

     Por eso el foco queda PENDIENTE al cambiar de vista y lo consume
     el primer pintado definitivo (no el transitorio). Los repintados
     posteriores, por ejemplo al marcar una comida, ya no roban el
     foco: la persona sigue donde estaba. ------------------------------ */
  var focoPendiente = null;

  function esperarFoco(nombreVista) {
    focoPendiente = nombreVista || '';
  }

  function pintar(html, opciones) {
    var c = document.getElementById('contenido');
    c.innerHTML = html;

    var transitorio = !!(opciones && opciones.transitorio);
    if (focoPendiente !== null && !transitorio) {
      var nombre = focoPendiente;
      focoPendiente = null;
      if (window.A11Y) {
        window.A11Y.enfocarTitulo();
        var titulo = c.querySelector('h1');
        var dicho = (titulo && titulo.textContent.trim()) || nombre;
        if (dicho) window.A11Y.anunciar(dicho + '. Contenido cargado.');
      }
    }
    return c;
  }

  function cargando(texto) {
    pintar('<h1>' + esc(texto || 'Cargando') + '</h1>' +
           '<p class="cargando">Un momento, por favor.</p>',
           { transitorio: true });
    if (window.A11Y) window.A11Y.anunciar((texto || 'Cargando') + '. Un momento, por favor.');
  }

  /* ---------- Atajos de seleccion ---------- */
  function q(sel, raiz) { return (raiz || document).querySelector(sel); }
  function qq(sel, raiz) {
    return Array.prototype.slice.call((raiz || document).querySelectorAll(sel));
  }

  /* ---------- Fechas ---------- */
  function hora(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function fechaHora(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return ''; }
  }

  /* ---------- Descargar un archivo ---------- */
  function descargar(nombre, contenido, tipo) {
    var blob = new Blob(['﻿' + contenido], { type: (tipo || 'text/csv') + ';charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function aCSV(encabezados, filas) {
    function celda(v) {
      if (v === null || v === undefined) return '';
      var s = String(v);
      if (/[",;\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    var out = [encabezados.map(celda).join(';')];
    filas.forEach(function (f) { out.push(f.map(celda).join(';')); });
    return out.join('\r\n');
  }

  function confirmar(mensaje) { return window.confirm(mensaje); }

  /* ---------- Bloques accesibles ----------
     Los iconos son decorativos: se ocultan al lector de pantalla para
     que no lea "pictograma de cara sonriente" antes de cada titulo. --- */
  function icono(simbolo) {
    return '<span class="ico" aria-hidden="true">' + simbolo + '</span>';
  }

  function vacio(simbolo, texto) {
    return '<p class="vacio">' + icono(simbolo) + esc(texto) + '</p>';
  }

  function aviso(tipo, titulo, texto) {
    /* Los errores se anuncian de inmediato; el resto espera su turno. */
    var rol = (tipo === 'err') ? ' role="alert"' : ' role="note"';
    return '<div class="aviso ' + tipo + '"' + rol + '>' +
             (titulo ? '<b>' + esc(titulo) + '</b>' : '') +
             esc(texto) +
           '</div>';
  }

  /* ---------- Errores en lenguaje humano ----------
     Nunca se muestra un error tecnico crudo: se dice que paso y,
     sobre todo, que hacer para resolverlo. --------------------------- */
  function explicarError(e) {
    var m = (e && e.message) ? e.message : String(e);
    if (/Invalid login credentials/i.test(m)) {
      return 'El correo o la contrasena no coinciden. Revisa que no haya espacios de mas y vuelve a intentarlo.';
    }
    if (/Failed to fetch|NetworkError|network/i.test(m)) {
      return 'No hay conexion con la base de datos. Revisa tu internet y vuelve a intentarlo.';
    }
    if (/JWT|not authenticated|permission denied|row-level security|42501/i.test(m)) {
      return 'No tienes permiso para hacer esto. Inicia sesion como staff desde el menu Control.';
    }
    if (/duplicate key|23505/i.test(m)) {
      return 'Ese registro ya existe. Revisa la lista antes de volver a crearlo.';
    }
    return m;
  }

  return {
    esc: esc,
    tostada: tostada,
    pintar: pintar,
    esperarFoco: esperarFoco,
    cargando: cargando,
    q: q, qq: qq,
    hora: hora,
    fechaHora: fechaHora,
    descargar: descargar,
    aCSV: aCSV,
    confirmar: confirmar,
    icono: icono,
    vacio: vacio,
    aviso: aviso,
    explicarError: explicarError
  };
})();

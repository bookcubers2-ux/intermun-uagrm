/* ==============================================================
   InterMUN UAGRM - Utilidades de interfaz
   ============================================================== */

window.UI = (function () {

  /* ---------- Escapar texto para insertar en HTML ---------- */
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ---------- Aviso flotante ---------- */
  var tempTostada = null;
  function tostada(mensaje, tipo) {
    var t = document.getElementById('tostada');
    if (!t) return;
    t.textContent = mensaje;
    t.className = 'ver' + (tipo ? ' ' + tipo : '');
    clearTimeout(tempTostada);
    tempTostada = setTimeout(function () { t.className = ''; }, 3200);
  }

  /* ---------- Pintar en el contenedor principal ---------- */
  function pintar(html) {
    var c = document.getElementById('contenido');
    c.innerHTML = html;
    window.scrollTo(0, 0);
    return c;
  }

  function cargando(texto) {
    pintar('<div class="cargando">' + esc(texto || 'Cargando...') + '</div>');
  }

  /* ---------- Atajos de seleccion ---------- */
  function q(sel, raiz)  { return (raiz || document).querySelector(sel); }
  function qq(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  /* ---------- Enlazar eventos por atributo data-accion ---------- */
  function alHacerClic(accion, fn) {
    qq('[data-accion="' + accion + '"]').forEach(function (el) {
      el.addEventListener('click', function (ev) { fn(el, ev); });
    });
  }

  /* ---------- Fechas legibles ---------- */
  function hora(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function fechaHora(iso) {
    if (!iso) return '';
    try {
      var d = new Date(iso);
      return d.toLocaleString('es-BO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { return ''; }
  }

  /* ---------- Descargar un archivo generado ---------- */
  function descargar(nombre, contenido, tipo) {
    var blob = new Blob(['﻿' + contenido], { type: (tipo || 'text/csv') + ';charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /* ---------- Construir un CSV a partir de filas ---------- */
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

  /* ---------- Confirmacion ---------- */
  function confirmar(mensaje) {
    return window.confirm(mensaje);
  }

  /* ---------- Estado vacio ---------- */
  function vacio(icono, texto) {
    return '<div class="vacio"><span class="ico">' + icono + '</span>' + esc(texto) + '</div>';
  }

  /* ---------- Aviso en bloque ---------- */
  function aviso(tipo, titulo, texto) {
    return '<div class="aviso ' + tipo + '">' +
             (titulo ? '<b>' + esc(titulo) + '</b>' : '') +
             esc(texto) +
           '</div>';
  }

  /* ---------- Mensaje de error tecnico legible ---------- */
  function explicarError(e) {
    var m = (e && e.message) ? e.message : String(e);
    if (/Invalid login credentials/i.test(m)) return 'Correo o contrasena incorrectos.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexion con la base de datos. Revisa tu internet.';
    if (/JWT|not authenticated|permission denied|row-level security/i.test(m)) {
      return 'No tienes permiso para hacer esto. Inicia sesion como staff.';
    }
    if (/duplicate key|23505/i.test(m)) return 'Ese registro ya existe.';
    return m;
  }

  return {
    esc: esc,
    tostada: tostada,
    pintar: pintar,
    cargando: cargando,
    q: q, qq: qq,
    alHacerClic: alHacerClic,
    hora: hora,
    fechaHora: fechaHora,
    descargar: descargar,
    aCSV: aCSV,
    confirmar: confirmar,
    vacio: vacio,
    aviso: aviso,
    explicarError: explicarError
  };
})();

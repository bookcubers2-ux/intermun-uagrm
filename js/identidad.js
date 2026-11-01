/* ====================================================================
   InterMUN UAGRM | Ingreso a la cuenta de delegado
   --------------------------------------------------------------------
   Cada delegada y delegado tiene una cuenta:
     1. Cuenta: su correo, o su ID (IM-0001), el que está impreso bajo
        su código QR.
     2. Contraseña: su número de carnet de identidad. A quien todavía no
        entregó su carnet, el staff le da un PIN de cuatro dígitos.
   Toda sección con datos personales (comidas, desempeño, chat) pide la
   cuenta. Así nadie escribe ni consulta con una credencial ajena. Este
   módulo pinta el formulario y lo comparten todas las secciones.
   La base de datos verifica el par; el navegador solo lo guarda para no
   pedirlo en cada sección.
   ==================================================================== */

window.IDENT = (function () {
  'use strict';

  /* "im0001", "IM 1" o "im-0001" valen igual que "IM-0001"; un correo se
     compara siempre en minúsculas. */
  function normalizarCuenta(texto) {
    var t = String(texto || '').trim();
    if (t.indexOf('@') >= 0) return t.toLowerCase();
    var pref = window.CONFIG.PREFIJO_CODIGO;
    var m = /^([A-Za-z]{1,6})\s*-?\s*(\d{1,6})$/.exec(t);
    if (m) {
      var num = m[2];
      if (m[1].toUpperCase() === pref) num = ('0000' + num).slice(-Math.max(4, num.length));
      return m[1].toUpperCase() + '-' + num;
    }
    return t.toUpperCase();
  }

  /* opciones: { titulo, intro, boton, alListo(identidad) } */
  function pedir(op) {
    var recordada = '';
    try { recordada = localStorage.getItem('intermun_ultima_cuenta') || ''; } catch (e) {}

    UI.pintar(
      '<h1>' + UI.esc(op.titulo) + '</h1>' +
      (op.intro || '') +
      '<p>Para continuar, entra con tu cuenta de InterMUN.</p>' +
      '<form class="tarjeta angosto" id="idForm" novalidate>' +
        '<label class="campo" for="idCuenta"><span>Correo o ID</span>' +
          '<input type="text" id="idCuenta" autocomplete="username" autocapitalize="none" spellcheck="false" ' +
            'value="' + UI.esc(recordada) + '" aria-describedby="id-ayuda" ' +
            'placeholder="tucorreo@gmail.com o ' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001"></label>' +
        '<p class="ayuda-campo" id="id-ayuda">Escribe el correo con el que te inscribiste, o tu ID: está impreso ' +
          'debajo de tu código QR, por ejemplo ' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001.</p>' +
        '<label class="campo" for="idClave"><span>Contraseña</span>' +
          '<input type="password" id="idClave" autocomplete="current-password" ' +
            'aria-describedby="id-ayuda-clave"></label>' +
        '<p class="ayuda-campo" id="id-ayuda-clave">Es tu número de carnet de identidad, solo los números. ' +
          'Si todavía no entregaste tu carnet, usa el PIN de cuatro dígitos que te dio el Secretariado.</p>' +
        '<button type="submit" class="btn bloque" id="idEntrar">' + UI.esc(op.boton || 'Entrar') + '</button>' +
      '</form>' +
      UI.aviso('info', 'Por qué se pide la contraseña',
        'Tu ID lo puede ver cualquiera. La contraseña garantiza que solo tú consultes tus comidas ' +
        'y tu desempeño, y que nadie escriba en el chat en tu nombre. Queda guardada solo en este dispositivo; ' +
        'puedes cerrar la sesión cuando quieras. Si no logras entrar, acércate a la mesa de acreditación.')
    );

    var formulario = UI.q('#idForm');
    var enviando = false;

    function entrar(ev) {
      if (ev) ev.preventDefault();
      if (enviando) return;
      var cuenta = normalizarCuenta(UI.q('#idCuenta').value);
      var clave = UI.q('#idClave').value.trim();
      if (!cuenta) { UI.tostada('Escribe tu correo o tu ID.', 'err'); UI.q('#idCuenta').focus(); return; }
      if (!clave) { UI.tostada('Escribe tu contraseña.', 'err'); UI.q('#idClave').focus(); return; }
      var b = UI.q('#idEntrar');
      enviando = true;
      b.disabled = true; b.textContent = 'Verificando, un momento';
      DB.identidad.entrar(cuenta, clave)
        .then(function (d) {
          if (!d) throw new Error('La cuenta y la contraseña no coinciden, o la credencial no está activa. ' +
            'Revisa tu correo o ID y tu número de carnet, o acércate a la mesa de acreditación.');
          try { localStorage.setItem('intermun_ultima_cuenta', cuenta); } catch (e) {}
          UI.tostada('Hola, ' + d.nombre + '.', 'ok');
          op.alListo(d);
          if (window.A11Y) window.A11Y.enfocarTitulo();
        })
        .catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          enviando = false;
          b.disabled = false; b.textContent = op.boton || 'Entrar';
          UI.q('#idClave').value = '';
          UI.q('#idClave').focus();
        });
    }
    formulario.addEventListener('submit', entrar);
    if (recordada) UI.q('#idClave').focus();
  }

  /* Línea "Participas como ..." con botón para cerrar la sesión */
  function lineaIdentidad(yo, idBoton) {
    return '<p class="silencio">Participas como <strong>' + UI.esc(yo.nombre) + '</strong>' +
      (yo.pais ? ', ' + UI.esc(yo.pais) : '') + (yo.comite ? ', ' + UI.esc(yo.comite) : '') +
      ' <span class="mono">(' + UI.esc(yo.codigo) + ')</span>. ' +
      '<button type="button" class="btn sec chico" id="' + idBoton + '">Entrar con otra cuenta</button></p>';
  }

  /* Exige identidad verificada antes de mostrar una sección personal.
     Si ya está guardada en el dispositivo, entra directo. */
  function exigir(op, vista) {
    var yo = DB.identidad.obtener();
    if (yo) { vista(yo); return; }
    op.alListo = function (d) { vista(d); };
    pedir(op);
  }

  return { pedir: pedir, lineaIdentidad: lineaIdentidad, exigir: exigir, normalizarCuenta: normalizarCuenta };
})();

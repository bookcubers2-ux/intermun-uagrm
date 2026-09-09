/* ====================================================================
   InterMUN UAGRM | Identificación por credencial
   --------------------------------------------------------------------
   La identidad de cada delegada y delegado tiene dos partes:
     1. El código de credencial (IM-0001), impreso bajo el código QR.
        Es público: cualquiera que vea la credencial lo conoce.
     2. El PIN personal, de cuatro dígitos, entregado en acreditación.
        Es privado: solo lo sabe la persona y el administrador.
   Toda sección con datos personales (comidas, desempeño, chat) pide
   las dos partes. Así nadie escribe ni consulta con una credencial
   ajena. Este módulo pinta el formulario y lo comparten todas.
   ==================================================================== */

window.IDENT = (function () {
  'use strict';

  /* opciones: { titulo, intro, boton, alListo(identidad) } */
  function pedir(op) {
    var recordado = '';
    try { recordado = localStorage.getItem('intermun_ultimo_codigo') || ''; } catch (e) {}

    UI.pintar(
      '<h1>' + UI.esc(op.titulo) + '</h1>' +
      (op.intro || '') +
      '<p>Para continuar, identifícate con el código de tu credencial y tu PIN personal.</p>' +
      '<div class="tarjeta angosto">' +
        '<label class="campo" for="idCodigo"><span>Código de credencial</span>' +
          '<input type="text" id="idCodigo" autocomplete="off" autocapitalize="characters" value="' + UI.esc(recordado) + '" ' +
            'aria-describedby="id-ayuda" placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001"></label>' +
        '<p class="ayuda-campo" id="id-ayuda">Está impreso en tu credencial, debajo del código QR.</p>' +
        '<label class="campo" for="idPin"><span>PIN personal</span>' +
          '<input type="password" id="idPin" inputmode="numeric" autocomplete="off" maxlength="8" ' +
            'aria-describedby="id-ayuda-pin"></label>' +
        '<p class="ayuda-campo" id="id-ayuda-pin">Cuatro dígitos. Te lo entregaron en la mesa de acreditación; ' +
          'si lo olvidaste, acércate a la mesa y te lo dan de nuevo.</p>' +
        '<button type="button" class="btn bloque" id="idEntrar">' + UI.esc(op.boton || 'Continuar') + '</button>' +
      '</div>' +
      UI.aviso('info', 'Por qué se pide el PIN',
        'El código de tu credencial lo puede ver cualquiera. El PIN garantiza que solo tú consultes tus comidas ' +
        'y tu desempeño, y que nadie escriba en el chat en tu nombre. Queda guardado solo en este dispositivo.')
    );

    function entrar() {
      var cod = UI.q('#idCodigo').value.trim().toUpperCase();
      var pin = UI.q('#idPin').value.trim();
      if (!cod) { UI.tostada('Escribe tu código de credencial.', 'err'); UI.q('#idCodigo').focus(); return; }
      if (!pin) { UI.tostada('Escribe tu PIN personal.', 'err'); UI.q('#idPin').focus(); return; }
      var b = UI.q('#idEntrar');
      b.disabled = true; b.textContent = 'Verificando, un momento';
      DB.identidad.verificar(cod, pin)
        .then(function (d) {
          if (!d) throw new Error('El código y el PIN no coinciden, o la credencial no está activa. Revísalos o acércate a la mesa de acreditación.');
          try { localStorage.setItem('intermun_ultimo_codigo', d.codigo); } catch (e) {}
          UI.tostada('Hola, ' + d.nombre + '.', 'ok');
          op.alListo(d);
          if (window.A11Y) window.A11Y.enfocarTitulo();
        })
        .catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false; b.textContent = op.boton || 'Continuar';
          UI.q('#idPin').value = '';
          UI.q('#idPin').focus();
        });
    }
    UI.q('#idEntrar').addEventListener('click', entrar);
    UI.q('#idCodigo').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') UI.q('#idPin').focus(); });
    UI.q('#idPin').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') entrar(); });
    if (recordado) UI.q('#idPin').focus();
  }

  /* Línea "Participas como ..." con botón para cambiar de credencial */
  function lineaIdentidad(yo, idBoton) {
    return '<p class="silencio">Participas como <strong>' + UI.esc(yo.nombre) + '</strong>' +
      (yo.pais ? ', ' + UI.esc(yo.pais) : '') + (yo.comite ? ', ' + UI.esc(yo.comite) : '') +
      ' <span class="mono">(' + UI.esc(yo.codigo) + ')</span>. ' +
      '<button type="button" class="btn sec chico" id="' + idBoton + '">Cambiar de credencial</button></p>';
  }

  /* Exige identidad verificada antes de mostrar una sección personal.
     Si ya está guardada en el dispositivo, entra directo. */
  function exigir(op, vista) {
    var yo = DB.identidad.obtener();
    if (yo) { vista(yo); return; }
    op.alListo = function (d) { vista(d); };
    pedir(op);
  }

  return { pedir: pedir, lineaIdentidad: lineaIdentidad, exigir: exigir };
})();

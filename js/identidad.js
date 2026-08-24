/* ====================================================================
   InterMUN UAGRM | Identificación por credencial
   --------------------------------------------------------------------
   Las delegadas y delegados no tienen contraseña: su identidad en la
   plataforma es el código de su credencial (IM-0001). Este módulo
   pinta el formulario para identificarse y lo comparten InterBot y
   el chat, para que la experiencia sea idéntica en los dos.
   ==================================================================== */

window.IDENT = (function () {
  'use strict';

  /* opciones: { titulo, intro, boton, alListo(identidad) } */
  function pedir(op) {
    UI.pintar(
      '<h1>' + UI.esc(op.titulo) + '</h1>' +
      (op.intro || '') +
      '<p>Para continuar, identifícate con el código de tu credencial.</p>' +
      '<div class="tarjeta angosto">' +
        '<label class="campo" for="idCodigo"><span>Código de credencial</span>' +
          '<input type="text" id="idCodigo" autocomplete="off" autocapitalize="characters" ' +
            'aria-describedby="id-ayuda" placeholder="' + UI.esc(window.CONFIG.PREFIJO_CODIGO) + '-0001"></label>' +
        '<p class="ayuda-campo" id="id-ayuda">Está impreso en tu credencial, debajo del código QR. ' +
          'Son dos letras, un guion y cuatro números.</p>' +
        '<button type="button" class="btn bloque" id="idEntrar">' + UI.esc(op.boton || 'Continuar') + '</button>' +
      '</div>' +
      UI.aviso('info', 'Tu identidad en la plataforma',
        'Tu nombre aparecerá tal como fue registrado en la acreditación. Queda guardado solo en este ' +
        'dispositivo; puedes cambiar de credencial cuando quieras.')
    );

    function entrar() {
      var cod = UI.q('#idCodigo').value.trim().toUpperCase();
      if (!cod) { UI.tostada('Escribe tu código de credencial.', 'err'); UI.q('#idCodigo').focus(); return; }
      var b = UI.q('#idEntrar');
      b.disabled = true; b.textContent = 'Verificando, un momento';
      DB.identidad.verificar(cod)
        .then(function (d) {
          if (!d) throw new Error('No existe ninguna credencial activa con ese código. Revísalo o acércate a la mesa de acreditación.');
          UI.tostada('Hola, ' + d.nombre + '.', 'ok');
          op.alListo(d);
          if (window.A11Y) window.A11Y.enfocarTitulo();
        })
        .catch(function (e) {
          UI.tostada(UI.explicarError(e), 'err');
          b.disabled = false; b.textContent = op.boton || 'Continuar';
          UI.q('#idCodigo').focus();
        });
    }
    UI.q('#idEntrar').addEventListener('click', entrar);
    UI.q('#idCodigo').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') entrar(); });
  }

  /* Línea "Conversas como ..." con botón para cambiar de credencial */
  function lineaIdentidad(yo, idBoton) {
    return '<p class="silencio">Participas como <strong>' + UI.esc(yo.nombre) + '</strong>' +
      (yo.pais ? ', ' + UI.esc(yo.pais) : '') + (yo.comite ? ', ' + UI.esc(yo.comite) : '') +
      ' <span class="mono">(' + UI.esc(yo.codigo) + ')</span>. ' +
      '<button type="button" class="btn sec chico" id="' + idBoton + '">Cambiar de credencial</button></p>';
  }

  return { pedir: pedir, lineaIdentidad: lineaIdentidad };
})();

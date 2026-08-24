/* ==============================================================
   InterMUN UAGRM - Capa de datos (Supabase)
   --------------------------------------------------------------
   Todo el dialogo con la base de datos pasa por aqui.
   ============================================================== */

window.DB = (function () {

  var cliente = null;
  var listo   = false;

  /* ---------- Arranque ---------- */
  function iniciar() {
    if (!window.CONFIG.estaConfigurado()) return false;
    if (cliente) return true;
    try {
      cliente = window.supabase.createClient(
        window.CONFIG.SUPABASE_URL,
        window.CONFIG.SUPABASE_ANON,
        { auth: { persistSession: true, autoRefreshToken: true } }
      );
      listo = true;
      return true;
    } catch (e) {
      console.error('No se pudo conectar con la base de datos:', e);
      return false;
    }
  }

  function hayConexion() { return listo && cliente !== null; }

  function exigir() {
    if (!hayConexion()) {
      throw new Error('El sistema todavia no esta conectado a la base de datos. Revisa js/config.js');
    }
    return cliente;
  }


  /* ============================================================
     SESION DEL STAFF
     ============================================================ */
  var sesion = {

    entrar: function (correo, clave) {
      return exigir().auth.signInWithPassword({ email: correo, password: clave })
        .then(function (r) {
          if (r.error) throw r.error;
          return r.data.user;
        });
    },

    salir: function () {
      return exigir().auth.signOut();
    },

    actual: function () {
      if (!hayConexion()) return Promise.resolve(null);
      return cliente.auth.getSession().then(function (r) {
        return (r.data && r.data.session) ? r.data.session.user : null;
      });
    },

    alCambiar: function (fn) {
      if (!hayConexion()) return;
      cliente.auth.onAuthStateChange(function (_evento, ses) {
        fn(ses ? ses.user : null);
      });
    }
  };


  /* ============================================================
     DELEGADOS
     ============================================================ */
  var delegados = {

    listar: function () {
      return exigir()
        .from('delegados')
        .select('*')
        .order('codigo', { ascending: true })
        .then(revisar);
    },

    porCodigo: function (codigo) {
      return exigir()
        .from('delegados')
        .select('*')
        .eq('codigo', String(codigo).trim().toUpperCase())
        .maybeSingle()
        .then(function (r) {
          if (r.error) throw r.error;
          return r.data;
        });
    },

    crear: function (d) {
      return exigir().from('delegados').insert(d).select().then(revisar);
    },

    crearVarios: function (lista) {
      return exigir().from('delegados').insert(lista).select().then(revisar);
    },

    actualizar: function (id, cambios) {
      return exigir().from('delegados').update(cambios).eq('id', id).select().then(revisar);
    },

    borrar: function (id) {
      return exigir().from('delegados').delete().eq('id', id).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    },

    borrarTodos: function () {
      return exigir().from('delegados').delete().neq('codigo', '__nunca__').then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    },

    /* Sugiere el proximo codigo libre: IM-0001, IM-0002... */
    siguienteCodigo: function () {
      var pref = window.CONFIG.PREFIJO_CODIGO;
      return delegados.listar().then(function (lista) {
        var max = 0;
        lista.forEach(function (d) {
          var m = /(\d+)\s*$/.exec(d.codigo || '');
          if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
        });
        return pref + '-' + String(max + 1).padStart(4, '0');
      });
    }
  };


  /* ============================================================
     DIETA (solo staff autenticado)
     ============================================================ */
  var dieta = {

    listar: function () {
      return exigir().from('delegados_dieta').select('*').then(function (r) {
        if (r.error) return [];   // anonimo: RLS la oculta, no es un error real
        return r.data || [];
      });
    },

    guardar: function (delegadoId, restriccion, notas) {
      return exigir()
        .from('delegados_dieta')
        .upsert({ delegado_id: delegadoId, restriccion: restriccion, notas: notas })
        .then(function (r) { if (r.error) throw r.error; return true; });
    }
  };


  /* ============================================================
     COMIDAS
     ============================================================ */
  var comidas = {

    listar: function () {
      return exigir()
        .from('comidas')
        .select('*')
        .order('orden', { ascending: true })
        .then(revisar);
    },

    activas: function () {
      return comidas.listar().then(function (l) {
        return l.filter(function (c) { return c.activa; });
      });
    },

    crear: function (c) {
      return exigir().from('comidas').insert(c).select().then(revisar);
    },

    actualizar: function (id, cambios) {
      return exigir().from('comidas').update(cambios).eq('id', id).select().then(revisar);
    },

    borrar: function (id) {
      return exigir().from('comidas').delete().eq('id', id).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    }
  };


  /* ============================================================
     ENTREGAS
     ============================================================ */
  var entregas = {

    listar: function () {
      return exigir().from('entregas').select('*').then(revisar);
    },

    deDelegado: function (delegadoId) {
      return exigir()
        .from('entregas')
        .select('*')
        .eq('delegado_id', delegadoId)
        .then(revisar);
    },

    deComida: function (comidaId) {
      return exigir()
        .from('entregas')
        .select('*')
        .eq('comida_id', comidaId)
        .then(revisar);
    },

    /* Registra la entrega. Si ya existia, la base la rechaza por
       la restriccion UNIQUE y devolvemos un aviso claro en vez
       de un error tecnico. */
    marcar: function (delegadoId, comidaId, quien, estacion) {
      return exigir()
        .from('entregas')
        .insert({
          delegado_id:   delegadoId,
          comida_id:     comidaId,
          entregado_por: quien || null,
          estacion:      estacion || null
        })
        .select()
        .then(function (r) {
          if (r.error) {
            if (r.error.code === '23505') {
              return { duplicado: true };
            }
            throw r.error;
          }
          return { ok: true, fila: r.data[0] };
        });
    },

    desmarcar: function (delegadoId, comidaId) {
      return exigir()
        .from('entregas')
        .delete()
        .eq('delegado_id', delegadoId)
        .eq('comida_id', comidaId)
        .then(function (r) {
          if (r.error) throw r.error;
          return true;
        });
    },

    /* Escucha cambios en vivo desde otras estaciones */
    escuchar: function (fn) {
      if (!hayConexion()) return null;
      var canal = cliente
        .channel('entregas-vivo')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'entregas' },
            function (p) { fn(p); })
        .subscribe();
      return canal;
    },

    dejarDeEscuchar: function (canal) {
      if (canal && cliente) { try { cliente.removeChannel(canal); } catch (e) {} }
    }
  };


  /* ============================================================
     IDENTIDAD DEL DELEGADO
     Sin contraseña: la identidad es el código de la credencial,
     verificado contra la tabla de delegados y guardado en el
     dispositivo. Se usa para InterBot y para el chat.
     ============================================================ */
  var identidad = {
    obtener: function () {
      try {
        var g = JSON.parse(localStorage.getItem('intermun_identidad') || 'null');
        return (g && g.codigo) ? g : null;
      } catch (e) { return null; }
    },
    verificar: function (codigo) {
      return delegados.porCodigo(codigo).then(function (d) {
        if (!d || !d.activo) return null;
        var yo = { id: d.id, codigo: d.codigo, nombre: d.nombre, pais: d.pais || '', comite: d.comite || '', rol: d.rol || 'delegado' };
        try { localStorage.setItem('intermun_identidad', JSON.stringify(yo)); } catch (e) {}
        return yo;
      });
    },
    limpiar: function () { try { localStorage.removeItem('intermun_identidad'); } catch (e) {} }
  };


  /* ============================================================
     INTERBOT (llama a la función en la nube, nunca al proveedor)
     ============================================================ */
  var interbot = {
    preguntar: function (codigo, mensajes) {
      var url = window.CONFIG.SUPABASE_URL + '/functions/v1/interbot';
      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': window.CONFIG.SUPABASE_ANON,
          'Authorization': 'Bearer ' + window.CONFIG.SUPABASE_ANON
        },
        body: JSON.stringify({ codigo: codigo, mensajes: mensajes })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok || d.error) {
            var e = new Error(d.error || ('HTTP ' + r.status));
            e.codigo = d.error || '';
            e.detalle = d.detalle || '';
            throw e;
          }
          return d;
        });
      });
    }
  };


  /* ============================================================
     CHAT POR COMITÉS
     ============================================================ */
  function traducirErrorChat(err) {
    var m = (err && err.message) || '';
    var mapa = {
      'CREDENCIAL_INVALIDA': 'Tu credencial no está activa. Vuelve a identificarte o acércate a la mesa de acreditación.',
      'SALA_INVALIDA': 'Esta sala ya no está disponible.',
      'MENSAJE_VACIO': 'Escribe un mensaje o adjunta un PDF.',
      'MENSAJE_LARGO': 'El mensaje supera los 2000 caracteres.',
      'DEMASIADOS_MENSAJES': 'Estás enviando demasiados mensajes seguidos. Espera un minuto.'
    };
    for (var k in mapa) { if (m.indexOf(k) >= 0) return new Error(mapa[k]); }
    return err;
  }

  function limpiarNombreArchivo(n) {
    return String(n || 'archivo.pdf')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'archivo.pdf';
  }

  var chat = {
    salas: function () {
      return exigir().from('chat_salas').select('*').order('orden', { ascending: true }).order('nombre', { ascending: true }).then(revisar);
    },
    salasActivas: function () {
      return chat.salas().then(function (l) { return l.filter(function (s) { return s.activa; }); });
    },
    salaPorClave: function (clave) {
      return exigir().from('chat_salas').select('*').eq('clave', clave).maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
    },
    crearSala: function (s) { return exigir().from('chat_salas').insert(s).select().then(revisar); },
    actualizarSala: function (id, cambios) { return exigir().from('chat_salas').update(cambios).eq('id', id).select().then(revisar); },
    borrarSala: function (id) {
      return exigir().from('chat_salas').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },

    mensajes: function (salaId, limite) {
      return exigir().from('chat_mensajes').select('*')
        .eq('sala_id', salaId)
        .order('creado_en', { ascending: false })
        .limit(limite || 100)
        .then(revisar)
        .then(function (l) { return l.reverse(); });
    },
    enviar: function (codigo, salaId, texto, archivo) {
      return exigir().rpc('chat_enviar', {
        p_codigo: codigo,
        p_sala: salaId,
        p_texto: texto || null,
        p_archivo_ruta: archivo ? archivo.ruta : null,
        p_archivo_nombre: archivo ? archivo.nombre : null,
        p_archivo_tamano: archivo ? archivo.tamano : null
      }).then(function (r) {
        if (r.error) throw traducirErrorChat(r.error);
        return r.data;
      });
    },
    subirArchivo: function (codigo, file) {
      var ruta = codigo + '/' + Date.now() + '-' + limpiarNombreArchivo(file.name);
      return exigir().storage.from('chat-archivos')
        .upload(ruta, file, { contentType: 'application/pdf', upsert: false })
        .then(function (r) {
          if (r.error) {
            var m = r.error.message || '';
            if (/row-level security|policy|403|Unauthorized/i.test(m)) throw new Error('No se pudo subir el archivo: tu credencial no está autorizada.');
            if (/size|too large|413/i.test(m)) throw new Error('El archivo supera el tamaño permitido (10 MB).');
            if (/mime|type/i.test(m)) throw new Error('Solo se pueden adjuntar archivos PDF.');
            throw r.error;
          }
          return { ruta: ruta, nombre: file.name, tamano: file.size };
        });
    },
    urlArchivo: function (ruta) {
      return exigir().storage.from('chat-archivos').getPublicUrl(ruta).data.publicUrl;
    },
    borrar: function (id) {
      return exigir().from('chat_mensajes').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; return true; });
    },
    escuchar: function (salaId, fn) {
      if (!hayConexion()) return null;
      return cliente
        .channel('chat-' + salaId)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'chat_mensajes', filter: 'sala_id=eq.' + salaId },
            function (p) { fn(p); })
        .subscribe();
    },
    dejarDeEscuchar: function (canal) {
      if (canal && cliente) { try { cliente.removeChannel(canal); } catch (e) {} }
    }
  };


  /* ---------- Utilidad interna ---------- */
  function revisar(r) {
    if (r.error) throw r.error;
    return r.data || [];
  }


  /* ---------- Prueba de conexion ---------- */
  function probar() {
    if (!hayConexion()) return Promise.resolve({ ok: false, motivo: 'sin-configurar' });
    return cliente.from('comidas').select('id').limit(1).then(function (r) {
      if (r.error) return { ok: false, motivo: r.error.message };
      return { ok: true };
    }).catch(function (e) {
      return { ok: false, motivo: e.message };
    });
  }


  return {
    iniciar:      iniciar,
    hayConexion:  hayConexion,
    probar:       probar,
    sesion:       sesion,
    delegados:    delegados,
    dieta:        dieta,
    comidas:      comidas,
    entregas:     entregas,
    identidad:    identidad,
    interbot:     interbot,
    chat:         chat
  };
})();

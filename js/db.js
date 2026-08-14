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
    entregas:     entregas
  };
})();

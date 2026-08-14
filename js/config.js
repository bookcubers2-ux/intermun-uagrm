/* ==============================================================
   InterMUN UAGRM - Configuracion del sistema
   --------------------------------------------------------------
   ESTE ES EL UNICO ARCHIVO QUE TIENES QUE EDITAR A MANO.
   Sigue los pasos del archivo GUIA-DE-INSTALACION.md
   ============================================================== */

window.CONFIG = {

  /* ---- 1. CONEXION A LA BASE DE DATOS (Supabase) --------------
     Los sacas de: supabase.com -> tu proyecto ->
     Project Settings -> API
       SUPABASE_URL   = "Project URL"
       SUPABASE_ANON  = "anon public" (la clave larga)

     La clave "anon" es publica por diseno: esta hecha para ir
     en el navegador. La seguridad real la da el Row Level
     Security que instalaste con el archivo .sql, que impide
     escribir a quien no tiene sesion de staff.
     NUNCA pongas aqui la clave "service_role".
  ------------------------------------------------------------ */
  SUPABASE_URL:  'PEGA-AQUI-TU-PROJECT-URL',
  SUPABASE_ANON: 'PEGA-AQUI-TU-CLAVE-ANON',


  /* ---- 2. DATOS DEL EVENTO ---------------------------------- */
  EVENTO: {
    nombre:      'InterMUN',
    subtitulo:   'Modelo de Naciones Unidas',
    institucion: 'Universidad Autonoma Gabriel Rene Moreno',
    carrera:     'Carrera de Relaciones Internacionales',
    ciudad:      'Santa Cruz de la Sierra, Bolivia',
    edicion:     'I Edicion',
    anio:        '2026',
    sede:        'Campus Universitario UAGRM',
    contacto:    'intermun@uagrm.edu.bo'
  },


  /* ---- 3. PREFIJO DE LOS CODIGOS DE CREDENCIAL --------------
     Con esto se generan los codigos automaticos: IM-0001,
     IM-0002, etc. Cambialo si prefieres otro formato.
  ------------------------------------------------------------ */
  PREFIJO_CODIGO: 'IM',


  /* ---- 4. ESTACIONES DE ENTREGA -----------------------------
     Los puntos fisicos donde se entrega la comida. Sirve para
     saber despues por que puerta paso cada delegado.
  ------------------------------------------------------------ */
  ESTACIONES: [
    'Estacion 1',
    'Estacion 2',
    'Estacion 3',
    'Mesa principal'
  ]
};


/* --------------------------------------------------------------
   Aviso en pantalla si el sistema todavia no fue configurado.
   -------------------------------------------------------------- */
window.CONFIG.estaConfigurado = function () {
  var c = window.CONFIG;
  return c.SUPABASE_URL.indexOf('http') === 0 &&
         c.SUPABASE_ANON.length > 40;
};

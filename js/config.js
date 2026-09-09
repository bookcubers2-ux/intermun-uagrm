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
  SUPABASE_URL:  'https://akdzvhnxkajwbrfyqqmt.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrZHp2aG54a2Fqd2JyZnlxcW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3Mjk1MjIsImV4cCI6MjEwMjMwNTUyMn0.GxvsCs3cTLNfe-cAhfHFWFF_O9mG3QHicE3bL_qAXeg',


  /* ---- 2. DATOS DEL EVENTO ---------------------------------- */
  EVENTO: {
    nombre:      'InterMUN',
    subtitulo:   'Modelo de Naciones Unidas',
    institucion: 'Universidad Autónoma Gabriel René Moreno',
    carrera:     'Carrera de Relaciones Internacionales',
    ciudad:      'Santa Cruz de la Sierra, Bolivia',
    edicion:     'I Edición',
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
    'Estación 1',
    'Estación 2',
    'Estación 3',
    'Mesa principal'
  ],


  /* ---- 5. CRITERIOS DE PUNTUACION -----------------------------
     Con estos criterios los chairs puntuan a cada delegado durante
     las sesiones. Las puntuaciones son publicas: se ven en vivo en
     el portal (Puntuaciones) y en la credencial de cada delegado.
     "max" es el maximo sugerido por sesion, "rapidos" son los
     botones de un toque que ve el chair.
  ------------------------------------------------------------ */
  SESIONES_PUNTAJE: 6,
  CRITERIOS_PUNTAJE: [
    { clave: 'discurso',    nombre: 'Discursos e intervenciones',    max: 10, rapidos: [1, 2, 3, 5],
      d: 'Claridad, argumentación y uso del tiempo en la lista de oradores y los caucus.' },
    { clave: 'procedimiento', nombre: 'Mociones y procedimiento',    max: 5,  rapidos: [1, 2, 3],
      d: 'Mociones bien formuladas y oportunas, puntos usados correctamente.' },
    { clave: 'negociacion', nombre: 'Negociación y diplomacia',      max: 10, rapidos: [1, 2, 3, 5],
      d: 'Construcción de bloques, liderazgo en el caucus no moderado y acuerdos.' },
    { clave: 'documento',   nombre: 'Documento de posición',         max: 10, rapidos: [2, 5, 8, 10],
      d: 'Investigación, coherencia con la política exterior del pais y propuestas.' },
    { clave: 'resolucion',  nombre: 'Redacción de resoluciones',     max: 10, rapidos: [1, 2, 3, 5],
      d: 'Cláusulas propuestas, patrocinio y enmiendas aprobadas.' },
    { clave: 'conducta',    nombre: 'Protocolo y conducta',          max: 5,  rapidos: [1, 2, -1, -2],
      d: 'Lenguaje diplomático, respeto al reglamento y puntualidad. Admite descuentos.' }
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

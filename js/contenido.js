/* ==============================================================
   InterMUN UAGRM - Contenido academico del portal
   --------------------------------------------------------------
   Todo el material educativo vive aqui, en un solo archivo, para
   que puedas editarlo sin tocar el codigo del sistema.
   ============================================================== */

window.CONTENIDO = {

  /* ============================================================
     QUE ES INTERMUN
     ============================================================ */
  quienesSomos: [
    {
      t: 'Que es un Modelo de Naciones Unidas',
      c: 'Es una simulacion educativa donde los estudiantes representan a paises (o, en formatos avanzados, a personajes individuales) y debaten un tema siguiendo un reglamento de procedimiento inspirado en el funcionamiento real de la ONU. Se aprende oratoria, negociacion, redaccion de resoluciones y analisis de coyuntura internacional practicando el rol, no estudiandolo de un libro.'
    },
    {
      t: 'Que es InterMUN',
      c: 'InterMUN es el Modelo de Naciones Unidas de la Carrera de Relaciones Internacionales de la Universidad Autonoma Gabriel Rene Moreno. Es una propuesta academica nacida dentro de la propia carrera, registrada ante el Centro de Informacion de las Naciones Unidas (CINU) Bolivia, la instancia que registra, avala, asesora y certifica los modelos en el pais.'
    },
    {
      t: 'Quien regula los Modelos de Naciones Unidas',
      c: 'Conviene saberlo con precision: la ONU no regula ni acredita formalmente los Modelos de Naciones Unidas en ningun pais. La Asamblea General aprobo en 2023 la resolucion A/RES/77/336, que reconoce su valor educativo, pero es un respaldo simbolico, no un mecanismo de supervision. En Bolivia, la unica instancia de coordinacion es el CINU, con sede en La Paz, cuyo aval es voluntario y administrativo. La legitimidad de un modelo se construye con antiguedad, respaldo institucional y reconocimiento entre pares, no con un certificado superior.'
    },
    {
      t: 'El ecosistema boliviano',
      c: 'Bolivia tiene un circuito activo de modelos universitarios: PazMun (UCB La Paz, el mas grande del pais con mas de una decada de ediciones), CRUZMUN (UPDS), DERMUN (UCB Santa Cruz), FRANZMUN (UNIFRANZ), NMUN (Universidad NUR), UPBMUN, UDAMUN (UDABOL), UTEPMUN (UTEPSA), CATMUN (UCB Tarija) y CP-MUN (UMSA). Siete modelos crucenos firmaron en abril de 2025 una alianza de cooperacion con intercambio de delegaciones y apoyo mutuo. El modelo mas antiguo del pais es BOLMUN, nacido en 2001 en el Colegio Aleman Federico Froebel de Cochabamba.'
    }
  ],


  /* ============================================================
     REGLAS DE PROCEDIMIENTO
     ============================================================ */
  reglas: {
    intro: 'No existe un reglamento unico mundial. Coexisten dos grandes familias, y en Latinoamerica se usa un hibrido de las dos. Esto es lo que necesitas saber para no perderte en tu primer comite.',

    sistemas: [
      {
        t: 'Estilo UNA-USA (norteamericano)',
        c: 'Predomina en Norteamerica y en las conferencias universitarias grandes. El debate fluye mediante una lista de oradores que se interrumpe con mociones (caucus moderado, caucus no moderado). Es competitivo: se entregan premios. El procedimiento mismo se usa como herramienta de estrategia diplomatica.'
      },
      {
        t: 'Estilo THIMUN (europeo)',
        c: 'Desarrollado por la Fundacion THIMUN de La Haya, con mas de cincuenta anos de historia. Es el mas cercano al reglamento real de la Asamblea General. No usa caucus puntuales: dedica el primer dia completo al lobbying. Los proyectos de resolucion pasan por un panel de aprobacion antes de debatirse. Es puramente educativo y, por decision filosofica, no entrega premios.'
      },
      {
        t: 'El hibrido latinoamericano',
        c: 'Es lo que se usa en la practica en la region, y lo mas probable que uses en Bolivia. Toma la mecanica de mociones del estilo UNA-USA pero la viste con terminologia oficial de la ONU: Presidente, Vicepresidente y Relator en vez de Chair, Vice-Chair y Rapporteur. El reglamento de referencia regional deriva del publicado por el CINU y de los materiales UN4MUN de la propia ONU.'
      }
    ],

    flujo: [
      { n: 1,  t: 'Pase de lista',                c: 'La Mesa llama a los paises y cada delegado responde presente. Se verifica el quorum.' },
      { n: 2,  t: 'Adopcion de la agenda',        c: 'Si el comite tiene mas de un tema, se debate y se vota cual se trata primero.' },
      { n: 3,  t: 'Discursos de apertura',        c: 'Cada delegacion expone brevemente la postura de su pais sobre el tema.' },
      { n: 4,  t: 'Debate general',               c: 'Se abre la lista de oradores permanente. Es el flujo por defecto de la sesion.' },
      { n: 5,  t: 'Caucuses',                     c: 'Intercalados en el debate: moderados para profundizar un subtema, no moderados para negociar libremente y formar bloques.' },
      { n: 6,  t: 'Documentos de trabajo',        c: 'Borradores informales que plasman por escrito las ideas del debate. No se votan.' },
      { n: 7,  t: 'Proyectos de resolucion',      c: 'Cuando un documento madura y reune las firmas minimas, se presenta formalmente y se vota su introduccion.' },
      { n: 8,  t: 'Enmiendas',                    c: 'Propuestas de cambio al proyecto ya introducido. Se debaten y se votan una por una.' },
      { n: 9,  t: 'Cierre del debate',            c: 'Requiere mayoria de dos tercios. A partir de aqui solo quedan en orden las mociones de votacion.' },
      { n: 10, t: 'Votacion final',               c: 'Cada pais vota si, no o abstencion. Solo puede aprobarse una resolucion por tema de agenda.' }
    ],

    glosario: [
      { es: 'Quorum',                    en: 'Quorum',                        d: 'Numero minimo de delegados presentes para que el comite pueda sesionar. Suele ser un tercio o un cuarto para abrir, y mayoria para votar.' },
      { es: 'Lista de oradores',         en: 'Speakers List',                 d: 'Orden cronologico de quienes pidieron la palabra sobre el tema en debate. Rige el flujo por defecto de la sesion.' },
      { es: 'Caucus moderado',           en: 'Moderated Caucus',              d: 'Receso donde la Mesa cede la palabra por turnos cortos sobre un subtema anunciado. Se especifica tema, tiempo total y tiempo por orador.' },
      { es: 'Caucus no moderado',        en: 'Unmoderated Caucus',            d: 'Receso donde los delegados se levantan de sus asientos y negocian libremente entre si. Es donde de verdad se arman los bloques.' },
      { es: 'Mocion',                    en: 'Motion',                        d: 'Propuesta formal que un delegado presenta a la Mesa para modificar el curso del debate. Solo procede cuando el piso esta abierto.' },
      { es: 'Punto de orden',            en: 'Point of Order',                d: 'Senala que se esta aplicando mal el reglamento. Nunca sirve para discutir el fondo del tema.' },
      { es: 'Punto de privilegio personal', en: 'Point of Personal Privilege', d: 'Incomodidad fisica que impide participar (no se escucha, hace frio). Es lo unico que puede interrumpir a un orador, y solo por audibilidad.' },
      { es: 'Consulta parlamentaria',    en: 'Point of Parliamentary Inquiry', d: 'Pregunta dirigida solo a la Mesa sobre como funciona una regla. Nunca sobre el contenido del debate.' },
      { es: 'Documento de trabajo',      en: 'Working Paper',                 d: 'Borrador informal previo a la resolucion. No requiere formato ni firmas minimas y no se somete a votacion.' },
      { es: 'Proyecto de resolucion',    en: 'Draft Resolution',              d: 'Documento formal con clausulas preambulares y operativas. Requiere firmantes minimos y aprobacion de la Mesa para introducirse.' },
      { es: 'Enmienda amistosa',         en: 'Friendly Amendment',            d: 'Cambio que todos los patrocinadores aceptan; se incorpora sin votacion. Ojo: no es universal, hay reglamentos que la eliminan.' },
      { es: 'Enmienda no amistosa',      en: 'Unfriendly Amendment',          d: 'Cambio que algun patrocinador rechaza. Requiere firmantes propios y debe votarse en el comite.' },
      { es: 'Mayoria simple',            en: 'Simple Majority',               d: 'Mas votos a favor que en contra entre los presentes y votantes. Las abstenciones no cuentan.' },
      { es: 'Mayoria de dos tercios',    en: 'Two-Thirds Majority',           d: 'Umbral reforzado. Rige el cierre de debate y las apelaciones a decisiones de la Mesa.' },
      { es: 'Votacion nominal',          en: 'Roll Call Vote',                d: 'Se llama a cada pais por su nombre y responde en voz alta. Da transparencia y peso a una votacion renida.' },
      { es: 'Documento de posicion',     en: 'Position Paper',                d: 'Una o dos paginas con la postura del pais en cada tema. Se entrega ANTES de la conferencia, nunca durante.' },
      { es: 'Derecho a replica',         en: 'Right of Reply',                d: 'Turno extra que se concede cuando un pais se siente aludido de forma directa por otro.' },
      { es: 'Mazo',                      en: 'Gavel',                         d: 'Simbolo de autoridad de la Mesa. Marca cada transicion formal: apertura, cierre, aprobacion.' }
    ],

    frases: [
      { d: 'Mociono un caucus moderado de X minutos sobre Y',   s: 'Quiere turnos cortos y ordenados para profundizar un subtema especifico.' },
      { d: 'Mociono un caucus no moderado de X minutos',        s: 'Quiere que los delegados se levanten a negociar libremente.' },
      { d: 'Punto de orden',                                    s: 'Cree que la Mesa aplico mal el reglamento. No discute el fondo del tema.' },
      { d: 'Punto de privilegio personal',                      s: 'Molestia fisica. Es lo unico que puede interrumpir un discurso.' },
      { d: 'Se cede el tiempo a preguntas',                     s: 'El orador termina y abre su tiempo restante a preguntas del comite.' },
      { d: 'Se cierra la lista de oradores',                    s: 'Nadie mas puede anotarse a hablar sobre ese tema.' },
      { d: 'Se cierra el debate',                               s: 'Se pasa directo a votacion. Requiere normalmente dos tercios.' },
      { d: 'Votacion por lista o nominal',                      s: 'Cada pais responde en voz alta cuando se le llama por nombre.' }
    ]
  },


  /* ============================================================
     PROTOCOLO Y ETIQUETA
     ============================================================ */
  protocolo: [
    {
      t: 'Como se habla dentro de la sala',
      c: 'Un delegado nunca se dirige directamente a otro: todo comentario va dirigido a la presidencia, refiriendose a los demas en tercera persona como "el Distinguido Representante de [pais]". Omitir la palabra "Distinguido" se considera casi un desaire deliberado. Al recibir la palabra se agradece siempre: "Gracias, senor Presidente, por concederme el uso de la palabra".'
    },
    {
      t: 'Nunca en primera persona',
      c: 'Dentro del comite nadie usa su nombre real ni pronombres personales. Se habla como "nuestro gobierno", "nuestra delegacion" o "nuestra nacion", porque el delegado representa a un Estado, no una opinion propia.'
    },
    {
      t: 'Vestimenta formal (Western Business Attire)',
      c: 'Es el estandar en casi todas las conferencias. Para hombres: traje y corbata. Para mujeres: blazer con pantalon de vestir o falda a la rodilla con blusa o camisa formal. Queda prohibido: zapatillas deportivas, sandalias, gorras, ropa desgastada o casual, y la vestimenta tipica del pais que se representa. La vestimenta de genero neutro o el atuendo cultural tradicional formal son plenamente aceptables: lo que importa es el nivel de formalidad.'
    },
    {
      t: 'La credencial',
      c: 'Se porta visible en todo momento. Es tu identificacion dentro de la conferencia, tu acceso a la sala de comite y, en InterMUN, tambien tu acceso a los refrigerios y almuerzos a traves del codigo QR del reverso.'
    }
  ],


  /* ============================================================
     TIPS PARA DELEGADOS
     ============================================================ */
  tips: [
    { t: 'El podio no gana comites',           c: 'Los resultados de un comite rara vez se deciden por el discurso mas elocuente. Se deciden en las negociaciones informales del caucus no moderado. Los delegados expertos lo saben; los novatos lo subestiman.' },
    { t: 'Investiga mas de un tema',           c: 'Si la agenda tiene varios puntos, el comite puede votar tratar el segundo primero. Llegar preparado en uno solo es la forma mas facil de quedarse en blanco.' },
    { t: 'No abuses del privilegio personal',  c: 'Usarlo para colarse en el debate o interrumpir por motivos triviales es el error de etiqueta mas comun entre principiantes. No oir bien es valido; estar en desacuerdo no lo es.' },
    { t: 'Cede el tiempo con intencion',       c: 'Si no especificas a quien cedes tu tiempo restante, pasa automaticamente a la Mesa. Cederlo a preguntas despues de un argumento fuerte te permite reforzarlo con tus propias respuestas.' },
    { t: 'Las enmiendas son estrategia',       c: 'No sirven solo para mejorar un texto. Sirven para sumar apoyo de bloques indecisos, y a veces para generar friccion entre los patrocinadores de una resolucion rival.' },
    { t: 'Varia tu formula de apertura',       c: 'Empezar cada discurso con la misma frase generica aburre a la Mesa y baja tu evaluacion. Cambia el registro.' },
    { t: 'Conoce el orden de precedencia',     c: 'Saber que mocion se vota antes que cual es conocimiento tecnico que da ventaja real: permite forzar una votacion cuando te conviene aunque otros quieran seguir hablando.' },
    { t: 'El documento de posicion importa',   c: 'En la mayoria de conferencias es requisito para optar a premios. Se entrega antes del evento, y respetar la fecha limite del comite organizador es innegociable.' }
  ],


  /* ============================================================
     COMITES
     ============================================================ */
  comites: [
    { n: 'Consejo de Seguridad',    t: '15 miembros, 5 con veto', d: 'El mas prestigioso de casi cualquier conferencia. Los cinco permanentes (China, Francia, Rusia, Reino Unido y Estados Unidos) tienen derecho a veto, asi que ninguna resolucion pasa sin negociar con ellos. Reservado por convencion a los delegados mas experimentados.', nivel: 'Avanzado' },
    { n: 'Comites de crisis',       t: '15 a 30 delegados',       d: 'Los delegados representan personas, no paises. Se dividen en front room (debate publico) y back room (notas privadas de crisis que un Director de Crisis resuelve en tiempo real). Rapido e impredecible.', nivel: 'Experto' },
    { n: 'Comites especializados',  t: '20 a 40 delegados',       d: 'DISEC (desarme), ECOFIN (economia), SOCHUM (asuntos sociales y humanitarios), SPECPOL (politica especial), Consejo de Derechos Humanos. Enfocados y de tamano manejable.', nivel: 'Intermedio' },
    { n: 'Asamblea General',        t: '100 a 400 delegados',     d: 'El punto de entrada recomendado para quien nunca participo. Mas estructurado y predecible, aunque exige paciencia: al ser tantos, cada delegado habla menos veces.', nivel: 'Inicial' }
  ],


  /* ============================================================
     CURIOSIDADES
     ============================================================ */
  curiosidades: [
    { t: 'El mazo tiene mil anos de historia', c: 'El mazo original de la Asamblea General de la ONU fue tallado por el escultor islandes Asmundur Sveinsson y donado por Islandia en 1952, en referencia al Althing, el parlamento vikingo del ano 930. Lleva grabada la frase "la sociedad debe construirse sobre la base de las leyes".' },
    { t: 'Un chair fuerte no golpea el mazo',  c: 'En el circuito MUN, golpear el mazo repetidamente o alzar la voz para pedir orden se lee como senal inequivoca de una Mesa debil. Un presidente con autoridad pide silencio una sola vez.' },
    { t: 'THIMUN no entrega premios',          c: 'No es un descuido: es una decision filosofica. La fundacion sostiene que el aprendizaje florece mejor en ambientes no competitivos, con validacion intrinseca en lugar de externa.' },
    { t: 'Las MUN families',                   c: 'El circuito esta tan interconectado que casi todos tienen amigos en comun. Muchos participantes vuelven conferencia tras conferencia menos por competir y mas por la comunidad que se forma alrededor.' },
    { t: 'Del delegado al chair',              c: 'Existe una progresion informal llamada chairing circuit: veteranos que dejan de competir y se vuelven presidentes itinerantes de multiples conferencias, formando una clase de organizadores experimentados.' },
    { t: 'Bolivia y el Silala en un MUN',      c: 'En 2018, LexMun, un modelo previo de la misma facultad de la UAGRM, simulo en su Corte Internacional de Justicia la demanda entre Bolivia y Chile por las aguas del Silala, un caso real que se litigaba en La Haya en esos mismos anos.' },
    { t: 'La regla etica del circuito',        c: 'Frente a las criticas por competitividad excesiva, la comunidad MUN se autorregula con un principio simple y repetido: ser una buena persona viene antes que ser un buen delegado.' }
  ]
};

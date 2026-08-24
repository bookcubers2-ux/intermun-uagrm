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
      t: 'Qué es un Modelo de Naciones Unidas',
      c: 'Es una simulación educativa donde los estudiantes representan a países (o, en formatos avanzados, a personajes individuales) y debaten un tema siguiendo un reglamento de procedimiento inspirado en el funcionamiento real de la ONU. Se aprende oratoria, negociación, redacción de resoluciones y análisis de coyuntura internacional practicando el rol, no estudiándolo de un libro.'
    },
    {
      t: 'Qué es InterMUN',
      c: 'InterMUN es el Modelo de Naciones Unidas de la Carrera de Relaciones Internacionales de la Universidad Autónoma Gabriel René Moreno. Es una propuesta académica nacida dentro de la propia carrera, registrada ante el Centro de Información de las Naciones Unidas (CINU) Bolivia, la instancia que registra, avala, asesora y certifica los modelos en el país.'
    },
    {
      t: 'Quién regula los Modelos de Naciones Unidas',
      c: 'Conviene saberlo con precisión: la ONU no regula ni acredita formalmente los Modelos de Naciones Unidas en ningún país. La Asamblea General aprobó en 2023 la resolución A/RES/77/336, que reconoce su valor educativo, pero es un respaldo simbólico, no un mecanismo de supervisión. En Bolivia, la única instancia de coordinación es el CINU, con sede en La Paz, cuyo aval es voluntario y administrativo. La legitimidad de un modelo se construye con antigüedad, respaldo institucional y reconocimiento entre pares, no con un certificado superior.'
    },
    {
      t: 'El ecosistema boliviano',
      c: 'Bolivia tiene un circuito activo de modelos universitarios: PazMun (UCB La Paz, el más grande del país con más de una década de ediciones), CRUZMUN (UPDS), DERMUN (UCB Santa Cruz), FRANZMUN (UNIFRANZ), NMUN (Universidad NUR), UPBMUN, UDAMUN (UDABOL), UTEPMUN (UTEPSA), CATMUN (UCB Tarija) y CP-MUN (UMSA). Siete modelos cruceños firmaron en abril de 2025 una alianza de cooperación con intercambio de delegaciones y apoyo mutuo. El modelo más antiguo del país es BOLMUN, nacido en 2001 en el Colegio Alemán Federico Froebel de Cochabamba.'
    }
  ],


  /* ============================================================
     REGLAS DE PROCEDIMIENTO
     ============================================================ */
  reglas: {
    intro: 'No existe un reglamento único mundial. Coexisten dos grandes familias, y en Latinoamérica se usa un híbrido de las dos. Esto es lo que necesitas saber para no perderte en tu primer comité.',

    sistemas: [
      {
        t: 'Estilo UNA-USA (norteamericano)',
        c: 'Predomina en Norteamérica y en las conferencias universitarias grandes. El debate fluye mediante una lista de oradores que se interrumpe con mociones (caucus moderado, caucus no moderado). Es competitivo: se entregan premios. El procedimiento mismo se usa como herramienta de estrategia diplomática.'
      },
      {
        t: 'Estilo THIMUN (europeo)',
        c: 'Desarrollado por la Fundación THIMUN de La Haya, con más de cincuenta años de historia. Es el más cercano al reglamento real de la Asamblea General. No usa caucus puntuales: dedica el primer día completo al lobbying. Los proyectos de resolución pasan por un panel de aprobación antes de debatirse. Es puramente educativo y, por decisión filosófica, no entrega premios.'
      },
      {
        t: 'El híbrido latinoamericano',
        c: 'Es lo que se usa en la práctica en la región, y lo más probable que uses en Bolivia. Toma la mecánica de mociones del estilo UNA-USA pero la viste con terminología oficial de la ONU: Presidente, Vicepresidente y Relator en vez de Chair, Vice-Chair y Rapporteur. El reglamento de referencia regional deriva del publicado por el CINU y de los materiales UN4MUN de la propia ONU.'
      }
    ],

    flujo: [
      { n: 1,  t: 'Pase de lista',                c: 'La Mesa llama a los países y cada delegado responde presente. Se verifica el quórum.' },
      { n: 2,  t: 'Adopción de la agenda',        c: 'Si el comité tiene más de un tema, se debate y se vota cuál se trata primero.' },
      { n: 3,  t: 'Discursos de apertura',        c: 'Cada delegación expone brevemente la postura de su país sobre el tema.' },
      { n: 4,  t: 'Debate general',               c: 'Se abre la lista de oradores permanente. Es el flujo por defecto de la sesión.' },
      { n: 5,  t: 'Caucuses',                     c: 'Intercalados en el debate: moderados para profundizar un subtema, no moderados para negociar libremente y formar bloques.' },
      { n: 6,  t: 'Documentos de trabajo',        c: 'Borradores informales que plasman por escrito las ideas del debate. No se votan.' },
      { n: 7,  t: 'Proyectos de resolución',      c: 'Cuando un documento madura y reúne las firmas mínimas, se presenta formalmente y se vota su introducción.' },
      { n: 8,  t: 'Enmiendas',                    c: 'Propuestas de cambio al proyecto ya introducido. Se debaten y se votan una por una.' },
      { n: 9,  t: 'Cierre del debate',            c: 'Requiere mayoría de dos tercios. A partir de aquí solo quedan en orden las mociones de votación.' },
      { n: 10, t: 'Votación final',               c: 'Cada país vota sí, no o abstención. Solo puede aprobarse una resolución por tema de agenda.' }
    ],

    glosario: [
      { es: 'Quórum',                    en: 'Quorum',                        d: 'Número mínimo de delegados presentes para que el comité pueda sesionar. Suele ser un tercio o un cuarto para abrir, y mayoría para votar.' },
      { es: 'Lista de oradores',         en: 'Speakers List',                 d: 'Orden cronológico de quienes pidieron la palabra sobre el tema en debate. Rige el flujo por defecto de la sesión.' },
      { es: 'Caucus moderado',           en: 'Moderated Caucus',              d: 'Receso donde la Mesa cede la palabra por turnos cortos sobre un subtema anunciado. Se especifica tema, tiempo total y tiempo por orador.' },
      { es: 'Caucus no moderado',        en: 'Unmoderated Caucus',            d: 'Receso donde los delegados se levantan de sus asientos y negocian libremente entre sí. Es donde de verdad se arman los bloques.' },
      { es: 'Moción',                    en: 'Motion',                        d: 'Propuesta formal que un delegado presenta a la Mesa para modificar el curso del debate. Solo procede cuando el piso está abierto.' },
      { es: 'Punto de orden',            en: 'Point of Order',                d: 'Señala que se está aplicando mal el reglamento. Nunca sirve para discutir el fondo del tema.' },
      { es: 'Punto de privilegio personal', en: 'Point of Personal Privilege', d: 'Incomodidad física que impide participar (no se escucha, hace frío). Es lo único que puede interrumpir a un orador, y solo por audibilidad.' },
      { es: 'Consulta parlamentaria',    en: 'Point of Parliamentary Inquiry', d: 'Pregunta dirigida solo a la Mesa sobre cómo funciona una regla. Nunca sobre el contenido del debate.' },
      { es: 'Documento de trabajo',      en: 'Working Paper',                 d: 'Borrador informal previo a la resolución. No requiere formato ni firmas mínimas y no se somete a votación.' },
      { es: 'Proyecto de resolución',    en: 'Draft Resolution',              d: 'Documento formal con cláusulas preambulares y operativas. Requiere firmantes mínimos y aprobación de la Mesa para introducirse.' },
      { es: 'Enmienda amistosa',         en: 'Friendly Amendment',            d: 'Cambio que todos los patrocinadores aceptan; se incorpora sin votación. Ojo: no es universal, hay reglamentos que la eliminan.' },
      { es: 'Enmienda no amistosa',      en: 'Unfriendly Amendment',          d: 'Cambio que algun patrocinador rechaza. Requiere firmantes propios y debe votarse en el comité.' },
      { es: 'Mayoría simple',            en: 'Simple Majority',               d: 'Más votos a favor que en contra entre los presentes y votantes. Las abstenciones no cuentan.' },
      { es: 'Mayoría de dos tercios',    en: 'Two-Thirds Majority',           d: 'Umbral reforzado. Rige el cierre de debate y las apelaciones a decisiones de la Mesa.' },
      { es: 'Votación nominal',          en: 'Roll Call Vote',                d: 'Se llama a cada país por su nombre y responde en voz alta. Da transparencia y peso a una votación reñida.' },
      { es: 'Documento de posición',     en: 'Position Paper',                d: 'Una o dos páginas con la postura del país en cada tema. Se entrega ANTES de la conferencia, nunca durante.' },
      { es: 'Derecho a replica',         en: 'Right of Reply',                d: 'Turno extra que se concede cuando un país se siente aludido de forma directa por otro.' },
      { es: 'Mazo',                      en: 'Gavel',                         d: 'Símbolo de autoridad de la Mesa. Marca cada transición formal: apertura, cierre, aprobación.' }
    ],

    frases: [
      { d: 'Mociono un caucus moderado de X minutos sobre Y',   s: 'Quiere turnos cortos y ordenados para profundizar un subtema específico.' },
      { d: 'Mociono un caucus no moderado de X minutos',        s: 'Quiere que los delegados se levanten a negociar libremente.' },
      { d: 'Punto de orden',                                    s: 'Cree que la Mesa aplico mal el reglamento. No discute el fondo del tema.' },
      { d: 'Punto de privilegio personal',                      s: 'Molestia física. Es lo único que puede interrumpir un discurso.' },
      { d: 'Se cede el tiempo a preguntas',                     s: 'El orador termina y abre su tiempo restante a preguntas del comité.' },
      { d: 'Se cierra la lista de oradores',                    s: 'Nadie más puede anotarse a hablar sobre ese tema.' },
      { d: 'Se cierra el debate',                               s: 'Se pasa directo a votación. Requiere normalmente dos tercios.' },
      { d: 'Votación por lista o nominal',                      s: 'Cada país responde en voz alta cuando se le llama por nombre.' }
    ]
  },


  /* ============================================================
     PROTOCOLO Y ETIQUETA
     ============================================================ */
  protocolo: [
    {
      t: 'Cómo se habla dentro de la sala',
      c: 'Un delegado nunca se dirige directamente a otro: todo comentario va dirigido a la presidencia, refiriendose a los demas en tercera persona como "el Distinguido Representante de [país]". Omitir la palabra "Distinguido" se considera casi un desaire deliberado. Al recibir la palabra se agradece siempre: "Gracias, señor Presidente, por concederme el uso de la palabra".'
    },
    {
      t: 'Nunca en primera persona',
      c: 'Dentro del comité nadie usa su nombre real ni pronombres personales. Se habla como "nuestro gobierno", "nuestra delegación" o "nuestra nación", porque el delegado representa a un Estado, no una opinión propia.'
    },
    {
      t: 'Vestimenta formal (Western Business Attire)',
      c: 'Es el estandar en casi todas las conferencias. Para hombres: traje y corbata. Para mujeres: blazer con pantalon de vestir o falda a la rodilla con blusa o camisa formal. Queda prohibido: zapatillas deportivas, sandalias, gorras, ropa desgastada o casual, y la vestimenta típica del país que se representa. La vestimenta de genero neutro o el atuendo cultural tradicional formal son plenamente aceptables: lo que importa es el nivel de formalidad.'
    },
    {
      t: 'La credencial',
      c: 'Se porta visible en todo momento. Es tu identificación dentro de la conferencia, tu acceso a la sala de comité y, en InterMUN, también tu acceso a los refrigerios y almuerzos a través del código QR del reverso.'
    }
  ],


  /* ============================================================
     TIPS PARA DELEGADOS
     ============================================================ */
  tips: [
    { t: 'El podio no gana comités',           c: 'Los resultados de un comité rara vez se deciden por el discurso más elocuente. Se deciden en las negociaciones informales del caucus no moderado. Los delegados expertos lo saben; los novatos lo subestiman.' },
    { t: 'Investiga más de un tema',           c: 'Si la agenda tiene varios puntos, el comité puede votar tratar el segundo primero. Llegar preparado en uno solo es la forma más fácil de quedarse en blanco.' },
    { t: 'No abuses del privilegio personal',  c: 'Usarlo para colarse en el debate o interrumpir por motivos triviales es el error de etiqueta más comun entre principiantes. No oír bien es válido; estar en desacuerdo no lo es.' },
    { t: 'Cede el tiempo con intención',       c: 'Si no específicas a quien cedes tu tiempo restante, pasa automáticamente a la Mesa. Cederlo a preguntas después de un argumento fuerte te permite reforzarlo con tus propias respuestas.' },
    { t: 'Las enmiendas son estrategia',       c: 'No sirven solo para mejorar un texto. Sirven para sumar apoyo de bloques indecisos, y a veces para generar fricción entre los patrocinadores de una resolución rival.' },
    { t: 'Varia tu fórmula de apertura',       c: 'Empezar cada discurso con la misma frase genérica aburre a la Mesa y baja tu evaluación. Cambia el registro.' },
    { t: 'Conoce el orden de precedencia',     c: 'Saber que moción se vota antes que cual es conocimiento técnico que da ventaja real: permite forzar una votación cuando te conviene aunque otros quieran seguir hablando.' },
    { t: 'El documento de posición importa',   c: 'En la mayoría de conferencias es requisito para optar a premios. Se entrega antes del evento, y respetar la fecha límite del comité organizador es innegociable.' }
  ],


  /* ============================================================
     COMITES
     ============================================================ */
  comites: [
    { n: 'Consejo de Seguridad',    t: '15 miembros, 5 con veto', d: 'El más prestigioso de casi cualquier conferencia. Los cinco permanentes (China, Francia, Rusia, Reino Unido y Estados Unidos) tienen derecho a veto, así que ninguna resolución pasa sin negociar con ellos. Reservado por convención a los delegados más experimentados.', nivel: 'Avanzado' },
    { n: 'Comités de crisis',       t: '15 a 30 delegados',       d: 'Los delegados representan personas, no países. Se dividen en front room (debate público) y back room (notas privadas de crisis que un Director de Crisis resuelve en tiempo real). Rápido e impredecible.', nivel: 'Experto' },
    { n: 'Comités especializados',  t: '20 a 40 delegados',       d: 'DISEC (desarme), ECOFIN (economía), SOCHUM (asuntos sociales y humanitarios), SPECPOL (política especial), Consejo de Derechos Humanos. Enfocados y de tamaño manejable.', nivel: 'Intermedio' },
    { n: 'Asamblea General',        t: '100 a 400 delegados',     d: 'El punto de entrada recomendado para quien nunca participó. Más estructurado y predecible, aunque exige paciencia: al ser tantos, cada delegado habla menos veces.', nivel: 'Inicial' }
  ],


  /* ============================================================
     CURIOSIDADES
     ============================================================ */
  curiosidades: [
    { t: 'El mazo tiene mil años de historia', c: 'El mazo original de la Asamblea General de la ONU fue tallado por el escultor islandés Ásmundur Sveinsson y donado por Islandia en 1952, en referencia al Althing, el parlamento vikingo del año 930. Lleva grabada la frase "la sociedad debe construirse sobre la base de las leyes".' },
    { t: 'Un chair fuerte no golpea el mazo',  c: 'En el circuito MUN, golpear el mazo repetidamente o alzar la voz para pedir orden se lee como señal inequívoca de una Mesa débil. Un presidente con autoridad pide silencio una sola vez.' },
    { t: 'THIMUN no entrega premios',          c: 'No es un descuido: es una decisión filosofica. La fundación sostiene que el aprendizaje florece mejor en ambientes no competitivos, con validación intrínseca en lugar de externa.' },
    { t: 'Las MUN families',                   c: 'El circuito está tan interconectado que casi todos tienen amigos en comun. Muchos participantes vuelven conferencia tras conferencia menos por competir y más por la comunidad que se forma alrededor.' },
    { t: 'Del delegado al chair',              c: 'Existe una progresión informal llamada chairing circuit: veteranos que dejan de competir y se vuelven presidentes itinerantes de múltiples conferencias, formando una clase de organizadores experimentados.' },
    { t: 'Bolivia y el Silala en un MUN',      c: 'En 2018, LexMun, un modelo previo de la misma facultad de la UAGRM, simuló en su Corte Internacional de Justicia la demanda entre Bolivia y Chile por las aguas del Silala, un caso real que se litigaba en La Haya en esos mismos años.' },
    { t: 'La regla ética del circuito',        c: 'Frente a las críticas por competitividad excesiva, la comunidad MUN se autorregula con un principio simple y repetido: ser una buena persona viene antes que ser un buen delegado.' }
  ]
};

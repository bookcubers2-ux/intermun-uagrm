# Decisiones de accesibilidad de InterMUN

Este documento explica **por qué** la aplicación está construida así. No es una lista de buenas intenciones: cada decisión responde a una norma y fue verificada con pruebas automatizadas.

---

## Jerarquía de diseño (irrompible)

Cuando una decisión estética choca con una regla de accesibilidad, gana la regla. El orden de prioridad es:

1. **Personas sin visión** (lector de pantalla y línea braille). Si la navegación con lector de pantalla no funciona, nada más importa.
2. **Personas neurodivergentes** (carga cognitiva mínima, cero elementos que se muevan).
3. **Personas con baja visión** (alto contraste, letra grande, espaciado configurable).

Todo lo construido para estos tres grupos mejora la aplicación para cualquiera, incluido el staff que marca comidas a las siete de la mañana en una fila de doscientas personas.

---

## Por qué esta paleta

La paleta sale del manual de marca oficial de InterMUN: azul `#0d00a4`, rojo `#f80000`, gris azulado `#7f87ad` y blanco, más los dos degradados oficiales.

Al medir cada color contra el requisito de nivel AAA (7 a 1), el resultado fue claro:

| Color de marca | Contraste sobre blanco | Uso permitido |
|---|---|---|
| Azul `#0d00a4` | 13.52 a 1 | **Texto y fondos.** Es el color principal |
| Rojo `#f80000` | 4.21 a 1 | **Solo decorativo**: filetes, bordes, remates |
| Gris azulado `#7f87ad` | 3.52 a 1 | **Solo decorativo** |

El rojo de marca y el gris azulado no alcanzan el umbral, así que nunca llevan texto encima. Cuando hace falta un rojo que sí pueda llevar texto (botón de borrar, insignia del staff, estados de error), se usa el **vino `#790000`**, que es el extremo oscuro del degradado rojo del propio manual y da 11.58 a 1. No se inventó ningún color: el tono accesible ya estaba en la marca.

Los tonos oscuros del degradado azul aportan las superficies profundas: `#040635` para la cabecera y las tarjetas de credencial (19.40 a 1 con texto blanco), y `#000315` como fondo del tema de alto contraste (20.51 a 1).

**Ningún estado se comunica solo con color.** Un botón activo lleva `aria-pressed="true"`, cambio de relleno *y* subrayado grueso. Una credencial dada de baja dice "De baja" con texto, no solo en rojo.

---

## Por qué estas tipografías

El manual de marca indica **Arial Black** para títulos y **Monotype Corsiva** para redes sociales.

Para los títulos se usa **Archivo Black**, la versión libre y de código abierto de Arial Black, servida desde el propio sitio.

**Monotype Corsiva no se usa en la aplicación**, y es una decisión deliberada: una tipografía cursiva es de las peores opciones posibles para baja visión y para dislexia, porque las letras se enlazan y pierden su forma distintiva. El propio manual la reserva para redes sociales, así que no hay conflicto: sigue siendo la tipografía de las piezas gráficas, pero no de una interfaz que tiene que poder leerse con poca visión.

Para todo el texto de lectura se conserva **Atkinson Hyperlegible**, diseñada por el Braille Institute específicamente para baja visión: diferencia los caracteres que más se confunden (I, l, 1 y también O, 0). Se sirve desde el propio sitio, no desde Google Fonts, para no depender de terceros el día del evento y para no enviarles la dirección IP de cada delegado.

La base es de **20 píxeles, no 16**, y se puede escalar hasta 44 desde la barra de herramientas.

---

## Por qué cero movimiento

No hay una sola animación ni transición en toda la aplicación. La regla está aplicada de forma global con `!important`, y además se respeta `prefers-reduced-motion`.

No es una preferencia estética. Sirve simultáneamente a personas neurodivergentes (el movimiento roba atención), a quien tiene vértigo, y a personas con epilepsia fotosensible. Están prohibidos por diseño: carruseles, ventanas emergentes automáticas, contenido que se mueve solo y banners que aparecen encima del contenido.

Por eso la sección para instalar la aplicación es una **sección fija** en la página, nunca una ventana emergente.

---

## Los dos errores que solo se descubren probando

Ninguna herramienta automática detecta estos dos, y los dos arruinan la experiencia con lector de pantalla:

### El foco al cambiar de vista

Esta aplicación es de una sola página: al tocar un módulo no se recarga el documento, así que el lector de pantalla no se entera de nada y deja a la persona donde estaba, normalmente al principio de la página, obligándola a deslizar decenas de veces hasta el contenido que eligió.

La solución tiene dos partes: el foco viaja al `<h1>` de la vista nueva, y el cambio se anuncia en una región `aria-live`.

Hay un detalle fino: las vistas pintan primero un "cargando" y después el contenido real, cuando llegan los datos de la base. Si el foco se moviera al primer pintado, se perdería al llegar el segundo. Por eso el foco queda **pendiente** y lo consume el primer pintado definitivo. Los repintados posteriores, por ejemplo al marcar una comida, ya no roban el foco: la persona sigue donde estaba.

Excepción deliberada: cuando alguien llega **desde afuera** (escaneando el código QR de su credencial), no se mueve el foco, para que pueda recorrer el documento completo y orientarse.

### La salida desde el final de la página

Quien llega al final de una página larga con lector de pantalla tiene que retroceder gesto por gesto para volver arriba. Es agotador. El último elemento de cada página es un botón que devuelve el foco al principio.

---

## Cómo funciona la lectura en voz alta

Usa la voz que ya trae el dispositivo (Web Speech API). El texto **nunca sale del teléfono**: no se envía a ningún servidor, funciona sin conexión y no cuesta nada. Se prefiere una voz local y de América Latina cuando el dispositivo la tiene.

Es un segundo lector, complementario y no sustituto del lector de pantalla: sirve a quien no usa lector de pantalla pero le cuesta leer por dislexia, fatiga visual o baja visión.

---

## El filtro de texto: lo que casi nadie hace

Todo texto pasa por un filtro **antes** de llegar a la voz, porque sin él:

- "ONU" se lee "onu" y "CINU" se lee "sinu".
- "P5" suena "pe cinco" en lugar de "los cinco miembros permanentes".
- El código de credencial "IM-0042" se lee "im menos cuarenta y dos" en vez de deletrearse.
- "tod@s" se lee literalmente "tod arroba ese".

El filtro expande las siglas del mundo MUN y de las universidades bolivianas, deletrea los códigos de credencial, expande abreviaturas y convierte el lenguaje con arroba en dobletes explícitos ("todas y todos").

Dos precauciones que están cubiertas por pruebas: las formas con equis se listan una por una para no romper palabras legítimas ("rayos x", "examen"), y las direcciones de correo se apartan antes de tocar las arrobas, para que `bookcubers2@gmail.com` no se convierta en un disparate.

---

## Perfiles sensoriales

En lugar de obligar a cada persona a configurar cinco cosas, hay cuatro perfiles que se aplican con un toque desde **Mi perfil de accesibilidad**:

| Perfil | Qué hace |
|---|---|
| Uso lector de pantalla | Oculta los adornos visuales y deja la estructura limpia |
| Veo poco | Letra al 150 por ciento, espaciado amplio, alto contraste con fondo oscuro |
| Prefiero lectura tranquila | Más espacio entre elementos, letra algo mayor, menos densidad |
| Sin perfil | Vuelve a la presentación original |

La elección queda guardada en el dispositivo y se aplica **antes del primer pintado**, con un script en línea en el encabezado, para que nadie vea un destello con el tamaño o el contraste equivocado.

---

## Verificación

No se afirma nada que no se haya medido. Estas son las pruebas que se corren:

**Auditoría automática con axe-core** (reglas WCAG 2.0, 2.1 y 2.2 niveles A y AA, más buenas prácticas), sobre las 10 rutas de la aplicación, emulando un teléfono de 390 píxeles:

> Resultado: **0 violaciones**, entre 38 y 47 reglas superadas por ruta, 0 errores de consola.

**Pruebas de comportamiento** (20 pruebas de lo que axe no puede detectar):

- El primer elemento del documento es un enlace de salto, invisible hasta recibir el foco.
- Están los cinco landmarks: barra de accesibilidad, header, nav, main y footer.
- Un solo `<h1>` por vista.
- Al cambiar de vista, el foco viaja al título y el cambio se anuncia.
- Todo elemento interactivo mide al menos 44 píxeles de alto.
- En tema oscuro, el contraste medido sobre el pintado real supera 17 a 1.
- Ningún elemento tiene animación ni transición.
- El filtro de voz expande siglas, deletrea códigos, corrige arrobas y no rompe correos ni "rayos x".
- Los atajos de teclado funcionan.
- La aplicación es instalable, con manifiesto válido e ícono maskable.

---

## Limitaciones conocidas (honestas)

- **No hay salida a braille.** La aplicación funciona con línea braille a través del lector de pantalla, pero no exporta archivos en formato Braille Ready Format. Si InterMUN llega a necesitar entregar documentos en braille físico, es un trabajo pendiente.
- **No hay modo de Lectura Fácil validado.** El contenido está escrito en lenguaje claro, con frases cortas y sin jerga sin explicar, pero no existe una versión redactada y validada por personas usuarias según la norma UNE 153101, que es la única que cuenta como Lectura Fácil plena.
- **No hay pictogramas.** No se integró un banco de pictogramas de apoyo (ARASAAC u otro).
- **La lectura en voz alta depende del dispositivo.** Si el teléfono no trae ninguna voz en español instalada, el botón lo informa y no hace nada más.
- **La verificación es automatizada, no humana.** Pasar axe-core con cero violaciones y las 20 pruebas de comportamiento es una base sólida, pero no reemplaza una prueba real con una persona ciega usando su propio lector de pantalla. Esa prueba sigue pendiente y es la que más valor agregaría.

---

## Lista de verificación antes de cada publicación

- [ ] Correr la auditoría axe-core: debe dar 0 violaciones.
- [ ] Correr las pruebas de comportamiento: deben pasar las 20.
- [ ] Navegar una vista completa usando solo el teclado (Tab, Shift+Tab, Enter).
- [ ] Verificar que el foco se ve en todo momento y nunca se pierde.
- [ ] Medir cualquier color nuevo antes de aprobarlo (mínimo 7 a 1).
- [ ] Confirmar que ningún estado nuevo se comunica solo con color.
- [ ] Confirmar que nada nuevo se mueve, aparece solo ni reproduce sonido sin pedirlo.

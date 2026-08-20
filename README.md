# InterMUN UAGRM

Portal y sistema de acreditación de **InterMUN**, el Modelo de Naciones Unidas de la Carrera de Relaciones Internacionales de la Universidad Autónoma Gabriel René Moreno.

**Sitio en línea:** https://bookcubers2-ux.github.io/intermun-uagrm/

---

## Qué hace

**Para los delegados.** Escanean el código QR del reverso de su credencial y acceden a su credencial digital, donde ven sus datos y qué refrigerios y almuerzos ya recibieron. Sin contraseña y sin instalar nada. El portal incluye además las reglas de procedimiento, el flujo de una sesión de comité, un glosario de términos, la guía de protocolo y consejos prácticos.

**Para el staff.** Escáner de credenciales con la cámara del celular para registrar entregas de comida en la fila, con confirmación por sonido y vibración. Tablero en vivo que se actualiza solo entre estaciones, gestión de delegados con carga masiva, generador de códigos QR imprimibles y exportación de todo a Excel.

El mismo código QR sirve para las dos cosas: si lo abre un delegado ve su estado en modo lectura, y si lo abre alguien del staff con sesión iniciada aparecen los botones para marcar la entrega.

---

## Identidad visual

Aplica el manual de marca oficial de InterMUN: logotipo del globo con la pieza de ajedrez, azul `#0d00a4`, rojo `#f80000` y gris azulado `#7f87ad`, con Archivo Black (version libre de Arial Black) para los titulos.

El logotipo se reconstruyo a 709 pixeles con transparencia real a partir del PDF oficial, y de ahi salen el icono de la aplicacion y las versiones de cabecera y portada.

Dos colores de la marca no alcanzan el contraste minimo para llevar texto encima, asi que quedan reservados a bordes y filetes; cuando hace falta un rojo con texto se usa el vino `#790000` del degradado oficial. El detalle esta en [ACCESIBILIDAD.md](ACCESIBILIDAD.md).

## Accesibilidad

La aplicación está construida para personas ciegas, con baja visión y neurodivergentes, y esa prioridad manda sobre cualquier decisión estética.

- **Contraste nivel AAA** en toda la interfaz: cada par de color fue medido y ninguno baja de 7 a 1.
- **Tipografía Atkinson Hyperlegible**, diseñada por el Braille Institute, servida desde el propio sitio.
- **Cero movimiento**: sin animaciones, carruseles ni ventanas emergentes.
- **Perfiles sensoriales** que se aplican con un toque, y barra de herramientas en todas las páginas para ajustar letra, espaciado y contraste.
- **Lectura en voz alta** con la voz del dispositivo, sin enviar el texto a ningún servidor.
- **Gestión del foco** al cambiar de vista, con anuncio en región `aria-live`.
- **Objetivos táctiles de 48 píxeles** en todo elemento interactivo.

Verificado con axe-core (0 violaciones en 10 rutas) y 20 pruebas de comportamiento. Las decisiones, las mediciones y las limitaciones conocidas están en [ACCESIBILIDAD.md](ACCESIBILIDAD.md).

## Instalable en el teléfono

Se instala como aplicación desde el navegador, sin tienda de aplicaciones. Una vez instalada, las reglas, el glosario y la guía del delegado funcionan sin conexión.

---

## Cómo está hecho

Sitio estático sin proceso de compilación: HTML, CSS y JavaScript puro, servido desde GitHub Pages. Las librerías están incluidas en el repositorio en lugar de traerse de un CDN externo, para que el sistema no dependa de servicios de terceros el día del evento.

La base de datos es PostgreSQL en Supabase, con las políticas de seguridad a nivel de fila activadas.

| Carpeta | Contenido |
|---|---|
| `js/config.js` | Configuración del evento y conexión |
| `js/contenido.js` | Reglas, glosario y consejos (editable sin programar) |
| `js/db.js` | Capa de acceso a datos |
| `js/vistas-publicas.js` | Portal y credenciales |
| `js/vistas-admin.js` | Control de comidas |
| `js/vendor/` | Librerías incluidas |

---

## Decisiones de diseño

**La doble entrega es imposible por construcción.** No la evita el código de la aplicación sino una restricción de unicidad en la base de datos sobre el par delegado y comida. Aunque dos personas del staff marquen a la misma persona en el mismo instante desde dispositivos distintos, la segunda operación es rechazada.

**La información sensible está separada.** Nombre, país y comité son datos que van impresos en la credencial y se leen públicamente. Las restricciones alimentarias y alergias viven en una tabla aparte, legible únicamente por el staff autenticado.

**Funciona sin conexión.** El contenido académico queda guardado en el dispositivo mediante un service worker, de modo que las reglas y la guía siguen disponibles aunque la red del campus falle. El registro de comidas sí requiere conexión, porque debe sincronizarse entre estaciones.

---

## Documentación

- `GUIA-DE-INSTALACION.md`, instalación, operación durante el evento y solución de problemas
- `INSTALACION-SUPABASE.sql`, esquema de la base de datos y políticas de seguridad

---

Carrera de Relaciones Internacionales, UAGRM. Santa Cruz de la Sierra, Bolivia.

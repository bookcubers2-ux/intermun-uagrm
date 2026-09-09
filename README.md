# InterMUN UAGRM

Portal y sistema de acreditación de **InterMUN**, el Modelo de Naciones Unidas de la Carrera de Relaciones Internacionales de la Universidad Autónoma Gabriel René Moreno.

**Sitio en línea:** https://bookcubers2-ux.github.io/intermun-uagrm/

---

## Qué hace

**Para los delegados.** Escanean el código QR del reverso de su credencial y acceden a su credencial digital, con sus datos de acreditación. Todo lo personal (sus comidas, su desempeño, el chat) vive en módulos aparte que piden dos cosas: el **código de credencial** (público, impreso bajo el QR) y el **PIN personal** de cuatro dígitos, que se entrega en acreditación. Así nadie consulta ni escribe con una credencial ajena. Sin contraseña de correo y sin instalar nada. El portal incluye además las reglas de procedimiento, el flujo de una sesión de comité, un glosario de términos, la guía de protocolo y consejos prácticos.

**Para el staff.** Escáner de credenciales con la cámara del celular para registrar entregas de comida en la fila, con confirmación por sonido y vibración. Tablero en vivo que se actualiza solo entre estaciones, gestión de delegados con carga masiva, generador de códigos QR imprimibles y exportación de todo a Excel.

El mismo código QR sirve para las dos cosas: si lo abre un delegado ve su credencial y los accesos a sus módulos privados, y si lo abre alguien del staff con sesión iniciada aparecen las comidas de esa persona con los botones para marcar la entrega.

## Roles del staff

Dos niveles, decididos por la base de datos (tabla `staff`), no por el navegador:

- **Operador**: escanear credenciales y marcar comidas, puntuar, leer los chats y descargar los archivos compartidos.
- **Administrador**: todo lo anterior y además delegados y sus PIN, comidas del evento, salas de chat, códigos QR y cuentas del staff.

Las cuentas se crean desde el propio panel (**Cuentas del staff**); la persona recibe un correo de confirmación. Nadie puede ver ni modificar el código de la plataforma desde el panel. La instalación de PIN y roles está en `INSTALACION-IDENTIDAD-Y-ROLES.sql`.

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

## InterBot y chat por comités

**InterBot** es un asistente con inteligencia artificial, solo de texto, que responde dudas de procedimiento, redacción, estrategia y uso de la plataforma con el reglamento y las fórmulas exactas de InterMUN como base. La clave del proveedor (Gemini, nivel gratuito) nunca está en el sitio: vive como secreto en una función de Supabase (`funciones/interbot/index.ts`) que además limita el uso por credencial y por día para proteger la cuota.

**El chat** ofrece una sala general y una por cada uno de los diez foros oficiales. La identidad es el código de credencial más el PIN personal, verificados en la base; los mensajes solo se escriben a través de una función de base de datos que valida el código y limita el ritmo. Se pueden compartir archivos PDF (hasta 10 MB, solo PDF, en una carpeta con el nombre de la credencial). El staff modera y administra las salas desde el panel de control.

Ambos módulos siguen el mismo estándar de accesibilidad del resto del sitio: regiones en vivo para que el lector de pantalla anuncie cada respuesta y cada mensaje nuevo, estados en texto (nunca un indicador giratorio), y mensajes propios marcados con la palabra "Tú" y no solo con color.

## Puntuaciones en vivo por foro

Los chairs puntúan a cada delegación durante las sesiones desde el celular, con sesión de staff: eligen el foro, tocan la delegación, el criterio (discursos, mociones y procedimiento, negociación, documento de posición, redacción de resoluciones, protocolo y conducta) y los puntos. Cada puntuación se publica al instante: el ranking del foro (**Puntuaciones** en el menú) y el módulo "Mi desempeño" de cada delegado (con código y PIN) se actualizan solos, sin recargar. Las puntuaciones son públicas por diseño y quedan registradas con sesión, nota y quién las otorgó; el staff puede quitar una puntuación equivocada. Los criterios y los botones rápidos se ajustan en `js/config.js`; la tabla y sus políticas están en `INSTALACION-PUNTUACIONES.sql`.

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
| `js/vistas-publicas.js` | Portal, credencial, Mis comidas, Mi desempeño y comités |
| `js/identidad.js` | Formulario de código + PIN compartido por los módulos privados |
| `js/vistas-admin.js` | Panel del staff por rol: comidas, delegados y PIN, archivos, cuentas |
| `js/puntuaciones.js` | Puntuaciones por foro: ranking público, panel de los chairs y sección en la credencial |
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
- `INSTALACION-IDENTIDAD-Y-ROLES.sql`, PIN personal por delegado, comidas privadas y roles admin / operador

---

Carrera de Relaciones Internacionales, UAGRM. Santa Cruz de la Sierra, Bolivia.

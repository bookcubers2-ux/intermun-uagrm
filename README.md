# InterMUN UAGRM

Portal y sistema de acreditación de **InterMUN**, el Modelo de Naciones Unidas de la Carrera de Relaciones Internacionales de la Universidad Autónoma Gabriel René Moreno.

**Sitio en línea:** https://bookcubers2-ux.github.io/intermun-uagrm/

---

## Qué hace

**Para los delegados.** Escanean el código QR del reverso de su credencial y acceden a su credencial digital, donde ven sus datos y qué refrigerios y almuerzos ya recibieron. Sin contraseña y sin instalar nada. El portal incluye además las reglas de procedimiento, el flujo de una sesión de comité, un glosario de términos, la guía de protocolo y consejos prácticos.

**Para el staff.** Escáner de credenciales con la cámara del celular para registrar entregas de comida en la fila, con confirmación por sonido y vibración. Tablero en vivo que se actualiza solo entre estaciones, gestión de delegados con carga masiva, generador de códigos QR imprimibles y exportación de todo a Excel.

El mismo código QR sirve para las dos cosas: si lo abre un delegado ve su estado en modo lectura, y si lo abre alguien del staff con sesión iniciada aparecen los botones para marcar la entrega.

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

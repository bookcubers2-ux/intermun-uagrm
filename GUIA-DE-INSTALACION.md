# Guía de instalación, InterMUN UAGRM

> ## ✅ Las partes 1 y 2 ya están hechas
>
> El sistema **ya está instalado, publicado y funcionando** en
> **https://bookcubers2-ux.github.io/intermun-uagrm/**
>
> La base de datos está creada, el sitio está conectado y ya existe una cuenta de staff
> con el correo `bookcubers2@gmail.com`. La contraseña está en el archivo
> `CLAVE-STAFF.txt`, dentro de la carpeta `APPS/InterMUN` de tu computadora.
>
> **Lo único que te queda es la Parte 3:** cargar tus comidas reales, tus delegados
> e imprimir los códigos QR.
>
> Las partes 1 y 2 quedan abajo solo como referencia, por si algún día necesitas
> reinstalar todo desde cero o entender cómo está armado.

---

Todo el proceso toma entre 20 y 30 minutos y no cuesta nada. No necesitas saber programar: es copiar, pegar y hacer clic.

Hazlo en este orden.

---

## Parte 1. Crear la base de datos (10 minutos)

### 1.1 Crear la cuenta

1. Entra a **supabase.com** y haz clic en "Start your project".
2. Regístrate con tu correo o con tu cuenta de GitHub.
3. Haz clic en "New project".
4. Llena así:
   - **Name:** `intermun`
   - **Database Password:** genera una y **guárdala en un lugar seguro** (no la vas a necesitar para el sistema, pero perderla complica cualquier reparación futura).
   - **Region:** elige `South America (São Paulo)`, que es la más cercana a Bolivia y por lo tanto la más rápida.
5. Haz clic en "Create new project" y espera uno o dos minutos mientras se prepara.

### 1.2 Crear las tablas

1. En el menú de la izquierda, entra a **SQL Editor**.
2. Haz clic en **New query**.
3. Abre el archivo `INSTALACION-SUPABASE.sql` que viene en esta carpeta, copia **todo** su contenido y pégalo ahí.
4. Presiona **Run** (o Ctrl+Enter).
5. Debe aparecer "Success. No rows returned". Eso significa que todo salió bien.

Con eso quedan creadas las tablas, la seguridad, el cronograma de comidas de ejemplo y tres delegados de prueba.

### 1.3 Copiar las llaves de conexión

1. Menú izquierdo, abajo del todo: **Project Settings** (el engranaje).
2. Entra a **API**.
3. Vas a ver dos datos que necesitas:
   - **Project URL**, algo como `https://abcdefghijk.supabase.co`
   - **anon public**, una clave muy larga que empieza con `eyJ...`

Déjalos a mano para el paso siguiente.

> **Sobre la clave anon:** es pública por diseño, está hecha para ir dentro del navegador y no es un secreto. Quien la tenga solo puede *leer* datos, nunca escribir, porque el archivo SQL que ejecutaste activó las políticas de seguridad que exigen sesión de staff para modificar cualquier cosa.
>
> Lo que **nunca** debes poner en el sistema ni compartir con nadie es la clave `service_role`, que aparece en esa misma pantalla. Esa sí lo abre todo.

### 1.4 Configurar el sistema

1. Abre el archivo `js/config.js` con el Bloc de notas o cualquier editor.
2. Reemplaza estas dos líneas con tus datos reales:

```js
SUPABASE_URL:  'https://abcdefghijk.supabase.co',
SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
```

3. Aprovecha y ajusta los datos del evento (nombre, edición, año, sede) un poco más abajo en el mismo archivo.
4. Guarda.

### 1.5 Crear las cuentas del staff

Cada persona que vaya a marcar comidas necesita su propia cuenta.

1. Menú izquierdo: **Authentication** y luego **Users**.
2. Haz clic en **Add user** y elige **Create new user**.
3. Pon el correo y una contraseña.
4. **Importante:** activa la casilla **Auto Confirm User**. Si no la marcas, la persona no podrá entrar.
5. Repite para cada miembro del equipo.

Recomendación: crea una cuenta por persona, no una compartida. Así el sistema registra quién marcó cada entrega, y si alguien pierde el celular puedes desactivar solo esa cuenta.

---

## Parte 2. Publicar el sitio en internet (10 minutos)

El código QR necesita apuntar a una dirección web real, así que el sitio tiene que estar publicado.

### 2.1 Subir a GitHub

1. Entra a **github.com** y crea una cuenta si no tienes.
2. Haz clic en **New repository**.
   - **Repository name:** `intermun`
   - Márcalo como **Public**.
   - No agregues README ni nada más.
   - Haz clic en "Create repository".
3. En la página que aparece, busca el enlace **uploading an existing file**.
4. Arrastra ahí **todo el contenido de la carpeta `sistema`** (los archivos y las carpetas `css`, `js`, `img`).
5. Abajo, haz clic en **Commit changes**.

### 2.2 Activar GitHub Pages

1. Dentro del repositorio, entra a **Settings** (arriba).
2. En el menú izquierdo, entra a **Pages**.
3. En "Source" elige **Deploy from a branch**.
4. En "Branch" elige `main` y carpeta `/ (root)`. Haz clic en **Save**.
5. Espera de uno a tres minutos y recarga la página. Aparecerá tu dirección, algo como:

```
https://tuusuario.github.io/intermun/
```

Esa es la dirección oficial del sistema. Ábrela para comprobar que funciona.

### 2.3 Comprobar que quedó bien conectado

1. Entra a tu sitio publicado.
2. Baja hasta el pie de página y haz clic en **Estado del sistema**.
3. Debe decir:
   - Configuración de conexión: **Lista**
   - Base de datos: **Respondiendo**

Si dice que falta configurar, revisa que hayas guardado bien `js/config.js` y que lo hayas subido a GitHub.

---

## Parte 3. Cargar tu evento (5 minutos)

### 3.1 Entrar como staff

1. En el sitio, entra a **Control** y luego inicia sesión con una de las cuentas que creaste.

### 3.2 Definir las comidas

1. Ve a **Comidas**.
2. Vienen ocho de ejemplo (tres días). Bórralas o ajústalas a tu cronograma real.

### 3.3 Cargar los delegados

1. Ve a **Delegados**.
2. Borra los tres de prueba.
3. Abre **Cargar la lista completa de una vez**.
4. Pega la lista con este formato, una persona por línea:

```
nombre ; pais ; comite ; institucion ; rol
```

Por ejemplo:

```
Ana Rodriguez ; Bolivia ; Consejo de Seguridad ; UAGRM ; delegado
Luis Mendez ; Francia ; SOCHUM ; UPDS ; delegado
```

Los códigos de credencial (`IM-0001`, `IM-0002`...) se generan solos.

> Si tienes la lista en Excel, ordena las columnas en ese mismo orden, selecciona los datos, cópialos y pégalos. También puedes descargar la plantilla desde ese mismo panel.

### 3.4 Generar e imprimir los QR

1. Ve a **Generar los QR**.
2. **Verifica que la dirección que aparece arriba sea la de GitHub Pages**, no la de tu computadora. Este es el error más costoso posible: si imprimes cientos de credenciales con la dirección equivocada, ningún QR va a funcionar.
3. Haz clic en **Generar** y luego en **Imprimir**.
4. Recorta y pega cada QR en el reverso de la credencial que corresponde.

---

## Parte 4. El día del evento

### Para el staff de comidas

1. Abrir el sitio en el celular e iniciar sesión.
2. Ir a **Ajustes** y elegir su estación de entrega (Estación 1, Estación 2, etc.).
3. Ir a **Escanear**.
4. Elegir arriba qué comida se está entregando en ese momento.
5. Presionar **Encender cámara** y escanear credencial tras credencial.

El sistema avisa con sonido y vibración: un tono agudo si la entrega se registró, y un tono grave si esa persona ya había recibido esa comida.

Si la cámara falla o el QR está dañado, se puede escribir el código a mano en el mismo panel.

### Para el Secretariado

Abre **Tablero en vivo** en una laptop. Se actualiza solo cada vez que cualquier estación registra una entrega, y desde ahí puedes:

- Ver el porcentaje de avance de cada comida.
- Ver exactamente quién falta por pasar.
- Descargar todo a Excel al terminar.

### Para los delegados

Escanean su propio QR con la cámara del celular y ven su credencial y qué comidas ya recibieron. No necesitan contraseña ni instalar nada.

---

## Preguntas frecuentes

**¿Y si se cae el internet en el campus?**
El contenido del portal (reglas, guía, glosario) sigue funcionando porque queda guardado en el teléfono. El marcado de comidas sí necesita conexión, porque tiene que sincronizarse entre todas las estaciones. Si el wifi del campus es dudoso, la recomendación práctica es que el staff de comidas use datos móviles, que consume muy poco: cada marcado son unos pocos kilobytes.

**¿Alguien puede marcarse su propia comida?**
No. Marcar exige una cuenta de staff con contraseña. Un delegado que escanee su QR solo puede *ver* su estado.

**¿Y si alguien intenta pasar dos veces?**
Es imposible por diseño. La base de datos rechaza el registro duplicado, incluso si dos personas del staff lo intentan al mismo tiempo desde celulares distintos. El sistema avisa con un tono grave y muestra que esa comida ya fue entregada.

**¿Se puede corregir un error?**
Sí. Abre la credencial de la persona y presiona **Deshacer** en la comida marcada por error.

**¿Qué pasa si alguien pierde su credencial?**
Entra a **Delegados**, dale de baja a la credencial perdida (queda inutilizada al instante) y crea una nueva para esa persona.

**¿Cuánto cuesta mantener esto?**
Nada. El plan gratuito de Supabase cubre de sobra un evento de este tamaño, y GitHub Pages es gratuito para repositorios públicos.

**¿Qué datos ven los delegados?**
Al escanear un QR se ve nombre, país, comité, institución y estado de comidas de esa credencial. Las restricciones alimentarias y alergias están guardadas en una tabla aparte que **solo** el staff con sesión iniciada puede leer, precisamente porque es información sensible.

---

## Si algo falla

| Síntoma | Causa más probable | Solución |
|---|---|---|
| "Falta conectar el sistema" | `js/config.js` sin editar o sin subir | Revisa que pegaste la URL y la clave, y que subiste el archivo a GitHub |
| "Correo o contraseña incorrectos" | El usuario no fue confirmado | En Supabase, vuelve a crear el usuario marcando "Auto Confirm User" |
| "No tienes permiso para hacer esto" | Sesión cerrada o expirada | Vuelve a iniciar sesión desde **Control** |
| La cámara no abre | El navegador exige conexión segura | Usa la dirección `https://` de GitHub Pages, no `http://` |
| El QR abre una página en blanco | Se imprimió con la dirección equivocada | Regenera los QR con la dirección correcta en **Ajustes** |
| Los cambios no se ven | El navegador guardó la versión vieja | Cierra y vuelve a abrir la página, o recarga con Ctrl+Shift+R |

---

## Parte 5. InterBot y el chat por comités

Estos dos módulos se agregaron después de la instalación inicial y necesitan un paso más en Supabase.

### Qué son

**InterBot** es un asistente con inteligencia artificial al que cualquier persona acreditada puede preguntarle, por escrito, cómo proponer una moción, qué hacer en una situación del comité, cómo redactar una cláusula, o dudas sobre la plataforma. Solo texto: no recibe imágenes ni archivos. Conoce el reglamento, el glosario, las fórmulas exactas de las mociones y el funcionamiento de la plataforma, y no inventa logística del evento (si le preguntan por aulas u horarios, remite al Secretariado).

**El chat** tiene una sala general y una sala por comité. Se entra con el código de credencial (sin contraseña), se puede escribir y adjuntar archivos PDF de hasta 10 MB. Los mensajes llegan en tiempo real. El staff puede retirar mensajes y abrir o cerrar salas.

### Por qué InterBot necesita una "función en la nube"

La inteligencia artificial la provee Google (Gemini) con una clave gratuita. Esa clave **no puede ir en el sitio público**: cualquiera la copiaría y agotaría la cuota en minutos. Por eso la clave vive como secreto dentro de Supabase, en una pequeña función (`funciones/interbot/index.ts`) que es la única que habla con Google. El sitio le manda la pregunta a esa función, y la función responde.

Además, la función limita el uso para cuidar la cuota gratuita: 40 preguntas por credencial al día, 5 por minuto, y 800 en total por día para todo el evento. Todos esos números se pueden cambiar sin tocar código (son secretos del proyecto: `LIMITE_CODIGO_DIA`, `LIMITE_CODIGO_MINUTO`, `LIMITE_GLOBAL_DIA`).

### Cómo se activa (una sola vez, 10 minutos)

1. **Clave de Gemini (gratis).** Entra a **aistudio.google.com**, inicia sesión con una cuenta de Google, y en "Get API key" crea una clave. Empieza con `AIza...`. No hace falta poner tarjeta: el nivel gratuito alcanza para el evento con los límites configurados.

2. **Token de Supabase.** En **supabase.com/dashboard/account/tokens** genera un token (nombre sugerido: `intermun-despliegue`). Empieza con `sbp_...`. Sirve solo para ejecutar el despliegue; revócalo al terminar.

3. **Ejecutar el despliegue.** En PowerShell, dentro de la carpeta `sistema`:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
$env:GEMINI_API_KEY        = "AIza..."
python funciones\desplegar-interbot.py
```

El script crea las tablas del chat, guarda la clave como secreto, despliega la función y hace una pregunta de prueba. Si al final imprime `"respuesta": "..."`, InterBot está funcionando.

4. **Revocar el token** en la misma página donde lo creaste. El sistema no lo necesita para funcionar.

### Abrir las salas por comité

Entra a **Control** y luego a **Salas de chat**. Si ya cargaste la lista de delegados, el panel detecta solos los comités que todavía no tienen sala y ofrece un botón para crear una por cada uno. También puedes crearlas a mano, cerrarlas temporalmente o borrarlas.

### Si Gemini no funciona

La función también acepta Groq como proveedor alternativo (groq.com, también gratuito). Guarda `GROQ_API_KEY` y `INTERBOT_PROVEEDOR=groq` como variables de entorno antes de correr el script de despliegue.

---

## Parte 6. Puntuaciones por foro

Se instala con una sola consulta: abre el **SQL Editor** de Supabase, pega el contenido de `INSTALACION-PUNTUACIONES.sql` y presiona **Run**. (En el proyecto actual ya está hecho.)

**Para los chairs.** Entrar a **Control**, luego **Puntuar a los delegados**, elegir el foro. Se toca la delegación en la tabla, se elige el criterio y la sesión, y se presiona un botón rápido (+1, +2, +3, +5) o se escribe otro valor. Los criterios que admiten descuento (protocolo y conducta) tienen botones negativos. Si algo se otorgó por error, en "Últimas puntuaciones" está el botón **Quitar**.

**Para los delegados.** En el menú **Puntuaciones** ven el ranking en vivo de cada foro, y en su credencial la sección "Mis puntuaciones" con su total, su puesto y el desglose por criterio.

**Requisito.** El comité escrito en cada credencial tiene que coincidir con el nombre, la sigla o la clave de la sala del foro (por ejemplo "CSI", "Consejo de Seguridad Internacional" o "csi"). Si un foro muestra 0 delegaciones, revisa ese campo en **Delegados**.

Los criterios, los máximos sugeridos, los botones rápidos y la cantidad de sesiones se cambian en `js/config.js`, sección 5.

---

## Estructura de los archivos

```
sistema/
├── index.html                   Página principal
├── manifest.webmanifest         Permite instalarlo como app
├── sw.js                        Hace que funcione sin conexión
├── INSTALACION-SUPABASE.sql     Script de la base de datos
├── GUIA-DE-INSTALACION.md       Este archivo
├── css/estilos.css              Diseño
├── img/                         Iconos
└── js/
    ├── config.js                LO ÚNICO QUE EDITAS A MANO
    ├── contenido.js             Reglas, glosario, tips (editable)
    ├── ui.js                    Utilidades de interfaz
    ├── db.js                    Conexión con la base de datos
    ├── app.js                   Navegación
    ├── vistas-publicas.js       Portal y credenciales
    ├── vistas-admin.js          Control de comidas y salas de chat
    ├── identidad.js             Ingreso con correo o ID y contraseña (el carnet)
    ├── cuenta.js                Mi cuenta: QR, foro, chat y módulos del delegado
    ├── interbot.js              Conversación con InterBot
    ├── chat.js                  Chat por comités con archivos PDF
    ├── puntuaciones.js          Puntuaciones por foro en vivo
    └── vendor/                  Librerías (no tocar)
├── funciones/
│   ├── interbot/index.ts        Función en la nube de InterBot (guarda la clave de IA)
│   └── desplegar-interbot.py    Despliegue en un solo comando
├── INSTALACION-INTERBOT-Y-CHAT.sql  Tablas y políticas del chat
├── INSTALACION-PUNTUACIONES.sql     Tabla y políticas de puntuaciones
├── INSTALACION-IDENTIDAD-Y-ROLES.sql PIN por delegado, comidas privadas, roles admin/operador
├── INSTALACION-CUENTAS-DELEGADOS.sql Datos privados, login por correo o ID, mi cuenta
├── INSTALACION-SECRETARIADO-CHAT.sql El administrador escribe en los foros como Secretariado
├── INSTALACION-HORARIOS-COMIDAS.sql  Hora de cada comida
├── INSTALACION-AUTORIDADES.sql       Cargo de las autoridades de mesa
├── INSTALACION-FOROS-EXCLUSIVOS.sql  Cada uno escribe solo en su foro
```

Para cambiar textos del portal (reglas, glosario, consejos, curiosidades), edita `js/contenido.js`. Está escrito para que se pueda modificar sin saber programar.


---

## PIN personal y roles del staff

Se instala con `INSTALACION-IDENTIDAD-Y-ROLES.sql` en el SQL Editor de Supabase. (En el proyecto actual ya está hecho.) Hace cuatro cosas:

1. Crea un PIN de cuatro dígitos para cada delegado (tabla `delegados_pin`) y lo genera solo para cada persona nueva. El administrador lo ve y lo cambia en **Delegados y PIN**, y puede imprimirlo en la hoja de códigos QR (opción "con PIN", para la copia que se entrega en mano).
2. Verifica en la base el par código + PIN (`verificar_delegado`) y entrega las comidas de cada persona solo con ese par (`mis_entregas`). Las entregas dejan de ser públicas.
3. Exige el PIN para escribir en el chat (`chat_enviar`).
4. Crea la tabla `staff` con dos roles. **admin**: todo. **operador**: escanear y marcar comidas, puntuar, leer chats y descargar archivos. Una cuenta que no figure en la tabla entra como operador.

Para dar acceso a alguien: panel de control, **Cuentas del staff**, correo, contraseña inicial y nivel. La persona recibe un correo de confirmación de Supabase y recién después puede iniciar sesión. Si el correo no llega, se confirma desde Supabase, en **Authentication**, botón "Confirm email".


---

## Cuentas de los delegados (correo o ID + carnet)

Se instala con `INSTALACION-CUENTAS-DELEGADOS.sql` (requiere haber instalado antes el de identidad y roles). Cada delegado entra con:

- **Cuenta:** su correo o su ID (`IM-0001`, el que va impreso debajo de su QR).
- **Contraseña:** su número de carnet. Es el mismo PIN de siempre: el administrador lo ve y lo cambia en **Delegados y contraseñas**. Quien todavía no entregó su carnet usa un PIN de cuatro dígitos.

Al entrar llegan a **Mi cuenta** (`#/mi-cuenta`): su código QR para la fila de comidas, el foro que pidió o el que se le asignó, el chat de su foro y todos los módulos personales. Comidas, desempeño, chat e InterBot reconocen esa misma sesión.

Por diseño:

- **Los delegados no son usuarios de Supabase Auth.** Si lo fueran tendrían el rol `authenticated`, que en este sistema significa staff. La sesión de delegado la verifica la función `login_delegado`.
- **Correo, carnet, celular y foros pedidos viven en `delegados_privado`**, que solo el administrador lee. La tabla pública `delegados` sigue mostrando solo lo de la credencial.
- **`login_delegado` frena** a quien falla 8 veces seguidas con la misma cuenta (10 minutos de espera) y acepta el carnet escrito con puntos o espacios.
- **Asignar foros** (`#/foros`, solo administrador): muestra cuántos pidieron cada foro, permite asignar a mano o aplicar la primera opción a todos los que no tienen foro. Asignar el foro es lo que abre su chat y lo que hace que los chairs lo vean al puntuar.
- **Alergias:** el escáner avisa en pantalla amarilla, y el tablero y la credencial (con sesión de staff) las muestran, para quien reparte la comida.

La carga de las personas desde los Excel de inscripción se hace desde la carpeta privada `InterMUN/CARGA-DELEGADOS-2026/` (fuera de este repositorio): `python generar.py` y `python aplicar.py`. Los datos personales nunca se suben a GitHub.

### El Secretariado escribe en los foros

`INSTALACION-SECRETARIADO-CHAT.sql` agrega la función `chat_enviar_secretariado`. Un **administrador** con sesión de staff (por ejemplo la cuenta compartida del Secretariado) abre cualquier sala del chat y escribe o comparte un PDF; el mensaje sale como **Secretariado**, con el código `SECRETARIADO` y un borde propio para que los delegados lo reconozcan. Los operadores siguen solo leyendo. Los PDF van a la carpeta `SECRETARIADO` del bucket `chat-archivos`, y hay un límite de 60 mensajes por minuto en total, porque varios dispositivos comparten la cuenta.

## Servicio de comidas (entrega y aviso al instante)

La pantalla **Servicio de comidas** (`#/escanear`, administradores y operadores) reemplaza al escáner anterior:

- **Qué se entrega:** botones por día y por comida, con su hora y cuántas personas ya la recibieron (por ejemplo "Almuerzo 12:00, 23 de 59"). Abre sola en la comida que toca según el reloj (la última que ya empezó; se abre 30 minutos antes de su hora), y un dispositivo que ya venía entregando conserva su comida durante 20 minutos al recargar.
- **Dos formas de registrar:** con la cámara (QR, un solo paso) o por lista (se toca *Entregar* junto al nombre; hay buscador y filtro por foro). Con la lista también se puede **entregar a todas las personas que faltan** de un foro, por ejemplo cuando el refrigerio se lleva a la sala.
- **Resultado grande:** verde "Entregado", amarillo "Ya recibió" (con la hora y la estación, para no darle otra), rojo si la credencial no existe o está de baja. Si la persona tiene alergia, avisa antes de entregar.
- **Deshacer con un toque**, desde la lista o desde el historial del dispositivo.
- **En vivo entre dispositivos:** lo que entrega un teléfono aparece solo en los demás.
- **En vivo para el delegado:** al registrar o deshacer una entrega, el servicio manda un aviso por el canal `entrega-<código>` (Realtime Broadcast, sin datos personales) y el teléfono del delegado vuelve a pedir sus comidas a la base. Si el aviso se pierde, su pantalla se actualiza sola cada 10 segundos. Las entregas siguen siendo privadas.

**Horario oficial de las comidas (2026-11-01):** solo el 5 y el 6 de noviembre (Día 2 y Día 3). Cada día, Merienda 1 a las 10:00, Almuerzo a las 12:00 y Merienda 2 a las 14:30: seis comidas. Las comidas que no se usan quedan ocultas (se pueden reactivar desde **Comidas del evento**, donde también se cambia la hora de cada una). El delegado ve en **Mis comidas** la hora de cada comida y cuál es la que sigue.

## Autoridades de mesa

Presidentes, moderadores y oficiales de conferencia son personas acreditadas como cualquier delegado (QR, cuenta con correo o ID y carnet, comidas, chat de su foro), con un **cargo** y un **foro ya asignado**. Se instalan con `INSTALACION-AUTORIDADES.sql` y se cargan desde la carpeta privada `CARGA-DELEGADOS-2026` junto con los delegados (`python generar.py` y `python aplicar.py`).

- Su QR (`InterMUN/QR-AUTORIDADES/`) lleva debajo del código su **cargo en una franja azul con letra blanca muy grande**, y el foro.
- Tienen `rol = chair` y el cargo en `delegados.cargo` (público, como el resto de la credencial). En su credencial figura el cargo en lugar del rol.
- **No entran al ranking ni a Puntuar**: solo se puntúa a quien tiene rol `delegado`.
- En **Mi cuenta** ven "Eres Presidente de ..." y no ven "Mi desempeño".
- En **Asignar foros** se cuentan aparte (columna *Autoridades de mesa*) y la "primera opción a todos" no las toca.
- Comen como todos: el Servicio de comidas las incluye en los totales y en el foro, y avisa su alergia.
- Si se vuelve a correr `INSTALACION-CUENTAS-DELEGADOS.sql`, correr después `INSTALACION-AUTORIDADES.sql` (recrea `mi_cuenta` con el cargo).

## Cada delegado participa solo en su foro

`INSTALACION-FOROS-EXCLUSIVOS.sql` aplica esta regla en la base de datos (no solo en la pantalla):

- **Dónde se puede escribir y compartir archivos:** en la **Sala general** y en el **chat del propio foro** (el de `delegados.comite`). Quien todavía no tiene foro asignado solo escribe en la Sala general.
- **Qué se puede hacer en los demás foros:** leer todos los mensajes y ver los puntajes y el ranking. No escribir ni subir archivos.
- **Cómo se exige:** `chat_enviar` rechaza el mensaje (`FORO_AJENO` o `SIN_FORO`); los PDF se suben a `CODIGO/SALA/archivo.pdf` y la política de almacenamiento solo acepta una sala permitida; un mensaje solo puede citar un archivo de su propia carpeta y de su propia sala.
- **Quién queda fuera de la regla:** el Secretariado (administrador) escribe en todas con `chat_enviar_secretariado`.
- **En la pantalla:** la lista de salas marca "Tu foro: puedes escribir" y "Solo lectura"; en un foro ajeno no aparece el cuadro de mensaje. El foro se vuelve a leer al abrir el chat, así que un cambio del Secretariado se refleja sin que el delegado vuelva a iniciar sesión.
- **Asignación:** el foro y el país de cada delegado salen de la "Lista de delegados" (una hoja por foro) con `python asignar_foros.py` y `python aplicar.py --foros` desde la carpeta privada `CARGA-DELEGADOS-2026`. Si se vuelve a correr el instalador `INSTALACION-INTERBOT-Y-CHAT.sql`, correr después este archivo (el otro restaura la subida sin regla de foro).

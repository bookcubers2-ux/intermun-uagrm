# Guía de instalación, InterMUN UAGRM

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
    ├── vistas-admin.js          Control de comidas
    └── vendor/                  Librerías (no tocar)
```

Para cambiar textos del portal (reglas, glosario, consejos, curiosidades), edita `js/contenido.js`. Está escrito para que se pueda modificar sin saber programar.

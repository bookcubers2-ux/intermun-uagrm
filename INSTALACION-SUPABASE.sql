-- ==============================================================
-- InterMUN UAGRM
-- Sistema de acreditacion y control de comidas
-- Script de instalacion de la base de datos (Supabase / PostgreSQL)
--
-- COMO USARLO:
--   1. Entra a tu proyecto en supabase.com
--   2. Menu lateral -> SQL Editor -> New query
--   3. Pega TODO este archivo y presiona "Run"
--   4. Listo. Se crean las tablas, la seguridad y datos de ejemplo.
--
-- Es seguro ejecutarlo mas de una vez: no borra datos existentes.
-- ==============================================================


-- --------------------------------------------------------------
-- 1. TABLA: delegados
--    Datos que van impresos en la credencial. Lectura publica,
--    porque el delegado necesita ver su propia credencial al
--    escanear su QR sin tener que iniciar sesion.
-- --------------------------------------------------------------
create table if not exists public.delegados (
  id           uuid primary key default gen_random_uuid(),
  codigo       text unique not null,
  nombre       text not null,
  pais         text,
  comite       text,
  institucion  text,
  rol          text not null default 'delegado',
  activo       boolean not null default true,
  creado_en    timestamptz not null default now()
);

comment on table public.delegados is 'Participantes acreditados de InterMUN';
comment on column public.delegados.codigo is 'Codigo corto que va dentro del QR de la credencial, ej: IM-0001';
comment on column public.delegados.rol is 'delegado | chair | secretariado | prensa | observador | staff';


-- --------------------------------------------------------------
-- 2. TABLA: delegados_dieta
--    Informacion sensible (alergias, restricciones medicas).
--    Se guarda SEPARADA a proposito: solo el staff autenticado
--    puede leerla. Nunca es visible para el publico.
-- --------------------------------------------------------------
create table if not exists public.delegados_dieta (
  delegado_id  uuid primary key references public.delegados(id) on delete cascade,
  restriccion  text,
  notas        text
);

comment on table public.delegados_dieta is 'Restricciones alimentarias. Acceso restringido a staff autenticado.';


-- --------------------------------------------------------------
-- 3. TABLA: comidas
--    Cada refrigerio o almuerzo del evento.
-- --------------------------------------------------------------
create table if not exists public.comidas (
  id      uuid primary key default gen_random_uuid(),
  clave   text unique not null,
  nombre  text not null,
  dia     int not null default 1,
  fecha   date,
  tipo    text not null default 'almuerzo',
  orden   int not null default 0,
  activa  boolean not null default true
);

comment on column public.comidas.clave is 'Identificador corto y estable, ej: d1-almuerzo';
comment on column public.comidas.tipo is 'almuerzo | refrigerio | cena | coffee';


-- --------------------------------------------------------------
-- 4. TABLA: entregas
--    El registro central. Una fila = a este delegado se le
--    entrego esta comida.
--
--    La restriccion UNIQUE es la pieza antifraude clave:
--    la base de datos hace fisicamente imposible registrar
--    dos veces la misma comida al mismo delegado, aunque dos
--    personas del staff lo marquen al mismo tiempo desde
--    celulares distintos.
-- --------------------------------------------------------------
create table if not exists public.entregas (
  id             uuid primary key default gen_random_uuid(),
  delegado_id    uuid not null references public.delegados(id) on delete cascade,
  comida_id      uuid not null references public.comidas(id) on delete cascade,
  entregado_en   timestamptz not null default now(),
  entregado_por  text,
  estacion       text,
  nota           text,
  constraint entregas_unicas unique (delegado_id, comida_id)
);


-- --------------------------------------------------------------
-- 5. INDICES (para que las consultas sean rapidas con cientos
--    de delegados y miles de entregas)
-- --------------------------------------------------------------
create index if not exists idx_entregas_comida   on public.entregas (comida_id);
create index if not exists idx_entregas_delegado on public.entregas (delegado_id);
create index if not exists idx_delegados_codigo  on public.delegados (codigo);
create index if not exists idx_delegados_activo  on public.delegados (activo);


-- --------------------------------------------------------------
-- 6. SEGURIDAD (Row Level Security)
--
--    Regla general del sistema:
--      - CUALQUIERA puede LEER delegados, comidas y entregas.
--        Esto permite que un delegado escanee su QR y vea su
--        propio estado sin necesitar contrasena.
--      - SOLO el staff con sesion iniciada puede ESCRIBIR
--        (marcar comidas, crear delegados, borrar).
--      - La informacion de dieta NO es publica en ningun caso.
-- --------------------------------------------------------------
alter table public.delegados       enable row level security;
alter table public.delegados_dieta enable row level security;
alter table public.comidas         enable row level security;
alter table public.entregas        enable row level security;

-- delegados
drop policy if exists "delegados_lectura_publica" on public.delegados;
create policy "delegados_lectura_publica"
  on public.delegados for select
  using (true);

drop policy if exists "delegados_escritura_staff" on public.delegados;
create policy "delegados_escritura_staff"
  on public.delegados for all
  to authenticated
  using (true) with check (true);

-- dieta (sin politica publica: queda invisible para anonimos)
drop policy if exists "dieta_solo_staff" on public.delegados_dieta;
create policy "dieta_solo_staff"
  on public.delegados_dieta for all
  to authenticated
  using (true) with check (true);

-- comidas
drop policy if exists "comidas_lectura_publica" on public.comidas;
create policy "comidas_lectura_publica"
  on public.comidas for select
  using (true);

drop policy if exists "comidas_escritura_staff" on public.comidas;
create policy "comidas_escritura_staff"
  on public.comidas for all
  to authenticated
  using (true) with check (true);

-- entregas
drop policy if exists "entregas_lectura_publica" on public.entregas;
create policy "entregas_lectura_publica"
  on public.entregas for select
  using (true);

drop policy if exists "entregas_escritura_staff" on public.entregas;
create policy "entregas_escritura_staff"
  on public.entregas for all
  to authenticated
  using (true) with check (true);


-- --------------------------------------------------------------
-- 7. TIEMPO REAL
--    Hace que cuando una estacion marca una entrega, las otras
--    pantallas se actualicen solas al instante.
-- --------------------------------------------------------------
do $migracion$
begin
  begin
    alter publication supabase_realtime add table public.entregas;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.delegados;
  exception when others then null;
  end;
end
$migracion$;


-- --------------------------------------------------------------
-- 8. DATOS DE EJEMPLO (comidas)
--    Estructura tentativa de 3 dias. Puedes editarla, borrarla
--    o crear la tuya desde el modulo "Comidas" del sistema.
-- --------------------------------------------------------------
insert into public.comidas (clave, nombre, dia, tipo, orden) values
  ('d1-refrigerio-am', 'Refrigerio de la manana', 1, 'refrigerio', 1),
  ('d1-almuerzo',      'Almuerzo',                1, 'almuerzo',   2),
  ('d1-refrigerio-pm', 'Refrigerio de la tarde',  1, 'refrigerio', 3),
  ('d2-refrigerio-am', 'Refrigerio de la manana', 2, 'refrigerio', 4),
  ('d2-almuerzo',      'Almuerzo',                2, 'almuerzo',   5),
  ('d2-refrigerio-pm', 'Refrigerio de la tarde',  2, 'refrigerio', 6),
  ('d3-refrigerio-am', 'Refrigerio de la manana', 3, 'refrigerio', 7),
  ('d3-almuerzo',      'Almuerzo de clausura',    3, 'almuerzo',   8)
on conflict (clave) do nothing;


-- --------------------------------------------------------------
-- 9. DELEGADOS DE PRUEBA
--    Para que puedas probar el escaner y el tablero antes de
--    tener la lista real. Cuando cargues la lista verdadera,
--    borralos desde el modulo "Delegados".
-- --------------------------------------------------------------
insert into public.delegados (codigo, nombre, pais, comite, institucion, rol) values
  ('IM-0001', 'Delegado de prueba 1', 'Bolivia',  'Consejo de Seguridad', 'UAGRM', 'delegado'),
  ('IM-0002', 'Delegado de prueba 2', 'Francia',  'Consejo de Seguridad', 'UAGRM', 'delegado'),
  ('IM-0003', 'Delegado de prueba 3', 'Japon',    'SOCHUM',               'UPDS',  'delegado')
on conflict (codigo) do nothing;


-- ==============================================================
-- FIN. Si llegaste hasta aca sin errores, la base esta lista.
--
-- SIGUIENTE PASO: crear los usuarios del staff.
--   Menu lateral -> Authentication -> Users -> Add user
--   Crea un usuario (correo + contrasena) para cada persona
--   que vaya a marcar comidas. Marca "Auto Confirm User".
-- ==============================================================

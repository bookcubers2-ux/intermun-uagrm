-- ==============================================================
-- InterMUN UAGRM
-- InterBot (asistente) y Chat por comités
-- Script de instalación de la base de datos (Supabase / PostgreSQL)
--
-- Es seguro ejecutarlo más de una vez: no borra datos existentes.
-- Requiere que ya exista la tabla public.delegados (INSTALACION-SUPABASE.sql).
-- ==============================================================


-- --------------------------------------------------------------
-- 1. INTERBOT: registro de uso
--    Cada pregunta deja una fila. Con eso la función en la nube
--    limita cuántas preguntas por día puede hacer cada credencial
--    y cuántas en total, para no agotar la cuota gratuita.
--    No tiene políticas públicas: solo la función (con clave de
--    servicio) la lee y escribe.
-- --------------------------------------------------------------
create table if not exists public.interbot_uso (
  id         bigserial primary key,
  codigo     text not null,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_interbot_uso_codigo_fecha on public.interbot_uso (codigo, creado_en);
create index if not exists idx_interbot_uso_fecha on public.interbot_uso (creado_en);
alter table public.interbot_uso enable row level security;


-- --------------------------------------------------------------
-- 2. CHAT: salas
--    Una sala general y una por comité. El staff las administra
--    desde el módulo "Salas de chat".
-- --------------------------------------------------------------
create table if not exists public.chat_salas (
  id           uuid primary key default gen_random_uuid(),
  clave        text unique not null,
  nombre       text not null,
  descripcion  text,
  tipo         text not null default 'comite',
  comite       text,
  orden        int not null default 0,
  activa       boolean not null default true,
  creado_en    timestamptz not null default now()
);
comment on column public.chat_salas.tipo is 'general | comite';
comment on column public.chat_salas.comite is 'Nombre del comité tal como figura en delegados.comite, para sugerir la sala propia';


-- --------------------------------------------------------------
-- 3. CHAT: mensajes
--    Un mensaje puede ser texto, un archivo PDF, o ambos.
-- --------------------------------------------------------------
create table if not exists public.chat_mensajes (
  id              bigserial primary key,
  sala_id         uuid not null references public.chat_salas(id) on delete cascade,
  delegado_id     uuid references public.delegados(id) on delete set null,
  codigo          text not null,
  nombre          text not null,
  texto           text,
  archivo_ruta    text,
  archivo_nombre  text,
  archivo_tamano  int,
  creado_en       timestamptz not null default now(),
  constraint chat_texto_o_archivo check (texto is not null or archivo_ruta is not null)
);
create index if not exists idx_chat_mensajes_sala_fecha on public.chat_mensajes (sala_id, creado_en);
create index if not exists idx_chat_mensajes_codigo_fecha on public.chat_mensajes (codigo, creado_en);


-- --------------------------------------------------------------
-- 4. SEGURIDAD
--    - Cualquiera puede LEER salas y mensajes (los delegados no
--      tienen contraseña; su identidad es el código de credencial).
--    - Nadie escribe mensajes directamente: solo a través de la
--      función chat_enviar, que verifica que el código exista y
--      esté activo, y limita el ritmo.
--    - El staff con sesión puede borrar mensajes (moderación) y
--      administrar salas.
-- --------------------------------------------------------------
alter table public.chat_salas    enable row level security;
alter table public.chat_mensajes enable row level security;

drop policy if exists "salas_lectura_publica" on public.chat_salas;
create policy "salas_lectura_publica" on public.chat_salas for select using (true);

drop policy if exists "salas_staff" on public.chat_salas;
create policy "salas_staff" on public.chat_salas for all to authenticated using (true) with check (true);

drop policy if exists "mensajes_lectura_publica" on public.chat_mensajes;
create policy "mensajes_lectura_publica" on public.chat_mensajes for select using (true);

drop policy if exists "mensajes_borrado_staff" on public.chat_mensajes;
create policy "mensajes_borrado_staff" on public.chat_mensajes for delete to authenticated using (true);


-- --------------------------------------------------------------
-- 5. FUNCIÓN chat_enviar
--    Es la ÚNICA puerta de entrada para escribir un mensaje.
-- --------------------------------------------------------------
create or replace function public.chat_enviar(
  p_codigo          text,
  p_sala            uuid,
  p_texto           text default null,
  p_archivo_ruta    text default null,
  p_archivo_nombre  text default null,
  p_archivo_tamano  int  default null
)
returns public.chat_mensajes
language plpgsql
security definer
set search_path = public
as $fn$
declare
  d public.delegados%rowtype;
  s public.chat_salas%rowtype;
  m public.chat_mensajes%rowtype;
  t text;
begin
  select * into d from public.delegados
   where codigo = upper(trim(coalesce(p_codigo, ''))) and activo;
  if not found then
    raise exception 'CREDENCIAL_INVALIDA';
  end if;

  select * into s from public.chat_salas where id = p_sala and activa;
  if not found then
    raise exception 'SALA_INVALIDA';
  end if;

  t := nullif(trim(coalesce(p_texto, '')), '');
  if t is null and p_archivo_ruta is null then
    raise exception 'MENSAJE_VACIO';
  end if;
  if length(t) > 2000 then
    raise exception 'MENSAJE_LARGO';
  end if;

  -- Anti-spam: máximo 20 mensajes por minuto por credencial
  if (select count(*) from public.chat_mensajes
       where codigo = d.codigo and creado_en > now() - interval '1 minute') >= 20 then
    raise exception 'DEMASIADOS_MENSAJES';
  end if;

  insert into public.chat_mensajes
    (sala_id, delegado_id, codigo, nombre, texto, archivo_ruta, archivo_nombre, archivo_tamano)
  values
    (s.id, d.id, d.codigo, d.nombre, t, p_archivo_ruta, p_archivo_nombre, p_archivo_tamano)
  returning * into m;

  return m;
end
$fn$;

grant execute on function public.chat_enviar(text, uuid, text, text, text, int) to anon, authenticated;


-- --------------------------------------------------------------
-- 6. ARCHIVOS: bucket para los PDF del chat
--    Lectura pública. Subida permitida solo a la carpeta cuyo
--    nombre sea un código de credencial activo, solo PDF y hasta
--    10 MB (límites aplicados por el propio bucket).
-- --------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-archivos', 'chat-archivos', true, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf'];

drop policy if exists "chat_archivos_lectura" on storage.objects;
create policy "chat_archivos_lectura" on storage.objects
  for select using (bucket_id = 'chat-archivos');

drop policy if exists "chat_archivos_subida" on storage.objects;
create policy "chat_archivos_subida" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'chat-archivos'
    and exists (
      select 1 from public.delegados
       where codigo = (storage.foldername(name))[1] and activo
    )
  );

drop policy if exists "chat_archivos_borrado_staff" on storage.objects;
create policy "chat_archivos_borrado_staff" on storage.objects
  for delete to authenticated using (bucket_id = 'chat-archivos');


-- --------------------------------------------------------------
-- 7. TIEMPO REAL para los mensajes
-- --------------------------------------------------------------
do $migracion$
begin
  begin
    alter publication supabase_realtime add table public.chat_mensajes;
  exception when others then null;
  end;
end
$migracion$;


-- --------------------------------------------------------------
-- 8. SALA GENERAL (las salas por comité se crean desde el sistema)
-- --------------------------------------------------------------
insert into public.chat_salas (clave, nombre, descripcion, tipo, orden)
values ('general', 'Sala general', 'Para todas las personas acreditadas en InterMUN.', 'general', 0)
on conflict (clave) do nothing;


-- ==============================================================
-- FIN. Siguiente paso: desplegar la función "interbot" y cargar
-- la clave del proveedor de IA (ver GUIA-DE-INSTALACION.md).
-- ==============================================================

-- ==============================================================
-- InterMUN UAGRM - Cada delegado participa solo en su foro
-- --------------------------------------------------------------
-- Regla: en el chat, un delegado (o autoridad de mesa) solo puede
-- escribir y compartir archivos en
--   1. la Sala general, y
--   2. el chat de SU foro (el que figura en delegados.comite).
-- En los demas foros puede LEER los mensajes y ver los puntajes,
-- pero no escribir ni subir archivos. Quien todavia no tiene foro
-- asignado solo escribe en la Sala general.
--
-- La regla se aplica en la base de datos, no solo en la pantalla:
--   - chat_enviar rechaza el mensaje (FORO_AJENO o SIN_FORO).
--   - Los PDF se suben a  <codigo>/<sala>/<archivo>  y la politica
--     del almacenamiento solo deja subir a una sala permitida.
--   - El Secretariado (administrador) sigue escribiendo en todas
--     con chat_enviar_secretariado.
-- Leer los mensajes y los puntajes sigue siendo publico.
--
-- Requiere INSTALACION-INTERBOT-Y-CHAT.sql e INSTALACION-IDENTIDAD-Y-ROLES.sql.
-- Es seguro correrlo mas de una vez.
-- ==============================================================


-- Texto sin tildes ni signos, en minusculas: para comparar nombres de foros
-- ("Consejo de Seguridad Internacional (CSI)" contra "CSI" o contra el nombre sin sigla).
create or replace function public.norm_foro(t text) returns text
language sql immutable as $$
  select trim(regexp_replace(lower(translate(coalesce(t, ''),
    'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')), '[^a-z0-9]+', ' ', 'g'));
$$;


-- ¿Esta persona puede participar en esta sala? La general es de todos; un foro, solo de quien
-- esta asignado a el. Mismas reglas de coincidencia que el sitio (js/puntuaciones.js).
create or replace function public.sala_es_de(p_sala_id uuid, p_comite text) returns boolean
language plpgsql stable security definer set search_path = public as $fn$
declare
  s    public.chat_salas%rowtype;
  a    text;
  b    text;
  sigla text;
begin
  select * into s from public.chat_salas where id = p_sala_id;
  if not found then return false; end if;
  if s.tipo = 'general' then return true; end if;

  b := public.norm_foro(p_comite);
  if b = '' then return false; end if;
  a := public.norm_foro(coalesce(s.comite, s.nombre));
  if a = b or position(b in a) > 0 or position(a in b) > 0 then return true; end if;

  sigla := substring(coalesce(s.comite, s.nombre) from '\(([^)]+)\)');
  if sigla is not null and public.norm_foro(sigla) = b then return true; end if;
  if public.norm_foro(s.clave) = b then return true; end if;
  return false;
end
$fn$;
grant execute on function public.sala_es_de(uuid, text) to anon, authenticated;


-- Subida de PDF: la ruta es  CODIGO/CLAVE-DE-SALA/archivo.pdf. Solo se acepta si el codigo es de una
-- persona activa y esa persona puede participar en esa sala.
create or replace function public.puede_subir_chat(p_ruta text) returns boolean
language plpgsql stable security definer set search_path = public as $fn$
declare
  partes text[] := string_to_array(coalesce(p_ruta, ''), '/');
  d public.delegados%rowtype;
  s public.chat_salas%rowtype;
begin
  if array_length(partes, 1) is null or array_length(partes, 1) < 3 then return false; end if;
  select * into d from public.delegados where codigo = partes[1] and activo;
  if not found then return false; end if;
  select * into s from public.chat_salas where clave = partes[2] and activa;
  if not found then return false; end if;
  return public.sala_es_de(s.id, d.comite);
end
$fn$;
grant execute on function public.puede_subir_chat(text) to anon, authenticated;

drop policy if exists "chat_archivos_subida" on storage.objects;
create policy "chat_archivos_subida" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'chat-archivos' and public.puede_subir_chat(name));
-- (la politica "chat_archivos_subida_secretariado" del administrador no cambia)


-- chat_enviar con la regla del foro
create or replace function public.chat_enviar(
  p_codigo          text,
  p_pin             text,
  p_sala            uuid,
  p_texto           text default null,
  p_archivo_ruta    text default null,
  p_archivo_nombre  text default null,
  p_archivo_tamano  int  default null
)
returns public.chat_mensajes
language plpgsql security definer set search_path = public as $fn$
declare
  d public.delegados%rowtype;
  s public.chat_salas%rowtype;
  m public.chat_mensajes%rowtype;
  t text;
begin
  select * into d from public.delegados
   where codigo = upper(trim(coalesce(p_codigo, ''))) and activo;
  if not found then raise exception 'CREDENCIAL_INVALIDA'; end if;
  if not exists (select 1 from public.delegados_pin p where p.delegado_id = d.id and p.pin = trim(coalesce(p_pin, ''))) then
    raise exception 'PIN_INVALIDO';
  end if;

  select * into s from public.chat_salas where id = p_sala and activa;
  if not found then raise exception 'SALA_INVALIDA'; end if;

  -- Solo la sala general y el propio foro
  if s.tipo <> 'general' then
    if coalesce(trim(d.comite), '') = '' then raise exception 'SIN_FORO'; end if;
    if not public.sala_es_de(s.id, d.comite) then raise exception 'FORO_AJENO'; end if;
  end if;

  t := nullif(trim(coalesce(p_texto, '')), '');
  if t is null and p_archivo_ruta is null then raise exception 'MENSAJE_VACIO'; end if;
  if length(t) > 2000 then raise exception 'MENSAJE_LARGO'; end if;
  -- El archivo tiene que estar en la carpeta de esta persona y de esta sala
  if p_archivo_ruta is not null and p_archivo_ruta not like d.codigo || '/' || s.clave || '/%' then
    raise exception 'ARCHIVO_INVALIDO';
  end if;

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
grant execute on function public.chat_enviar(text, text, uuid, text, text, text, int) to anon, authenticated;

-- ==============================================================
-- InterMUN UAGRM - El Secretariado escribe en los foros
-- --------------------------------------------------------------
-- Hasta ahora el chat solo aceptaba mensajes de delegados (codigo +
-- PIN). Esta funcion deja que un ADMINISTRADOR con sesion de staff
-- escriba y comparta PDF como "Secretariado".
--
--   - Solo el administrador (tabla staff, rol admin). Un operador no.
--   - El mensaje sale con el codigo SECRETARIADO y el nombre
--     "Secretariado", sin delegado asociado.
--   - Los PDF van a la carpeta SECRETARIADO del bucket chat-archivos.
--   - Limite: 60 mensajes por minuto en total (varios dispositivos
--     comparten la misma cuenta).
--
-- Requiere INSTALACION-INTERBOT-Y-CHAT.sql e
-- INSTALACION-IDENTIDAD-Y-ROLES.sql. Es seguro correrlo mas de una vez.
-- ==============================================================

create or replace function public.chat_enviar_secretariado(
  p_sala            uuid,
  p_texto           text default null,
  p_archivo_ruta    text default null,
  p_archivo_nombre  text default null,
  p_archivo_tamano  int  default null
)
returns public.chat_mensajes
language plpgsql security definer set search_path = public as $fn$
declare
  s public.chat_salas%rowtype;
  m public.chat_mensajes%rowtype;
  t text;
begin
  if not public.es_admin() then raise exception 'SOLO_ADMIN'; end if;

  select * into s from public.chat_salas where id = p_sala and activa;
  if not found then raise exception 'SALA_INVALIDA'; end if;

  t := nullif(trim(coalesce(p_texto, '')), '');
  if t is null and p_archivo_ruta is null then raise exception 'MENSAJE_VACIO'; end if;
  if length(t) > 2000 then raise exception 'MENSAJE_LARGO'; end if;
  if p_archivo_ruta is not null and p_archivo_ruta not like 'SECRETARIADO/%' then
    raise exception 'ARCHIVO_INVALIDO';
  end if;

  if (select count(*) from public.chat_mensajes
       where codigo = 'SECRETARIADO' and creado_en > now() - interval '1 minute') >= 60 then
    raise exception 'DEMASIADOS_MENSAJES';
  end if;

  insert into public.chat_mensajes
    (sala_id, delegado_id, codigo, nombre, texto, archivo_ruta, archivo_nombre, archivo_tamano)
  values
    (s.id, null, 'SECRETARIADO', 'Secretariado', t, p_archivo_ruta, p_archivo_nombre, p_archivo_tamano)
  returning * into m;
  return m;
end
$fn$;

revoke execute on function public.chat_enviar_secretariado(uuid, text, text, text, int) from public, anon;
grant  execute on function public.chat_enviar_secretariado(uuid, text, text, text, int) to authenticated;


-- Subida de PDF: el administrador puede escribir en la carpeta SECRETARIADO.
-- (Los delegados siguen subiendo solo a la carpeta con su propio codigo.)
drop policy if exists "chat_archivos_subida_secretariado" on storage.objects;
create policy "chat_archivos_subida_secretariado" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'chat-archivos'
    and (storage.foldername(name))[1] = 'SECRETARIADO'
    and public.es_admin()
  );

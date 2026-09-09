-- ==============================================================
-- InterMUN UAGRM - Identidad de dos partes y roles del staff
-- --------------------------------------------------------------
-- 1. PIN personal por delegado (codigo de credencial + PIN)
-- 2. Verificacion en el servidor: verificar_delegado, mis_entregas
-- 3. chat_enviar exige el PIN (nadie escribe con credencial ajena)
-- 4. Roles del staff: admin (todo) y operador (puntuar, comidas,
--    ver chats y descargar archivos)
-- 5. Comidas privadas: solo el staff y el propio delegado (con PIN)
-- ==============================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------
-- 1. PIN personal
-- --------------------------------------------------------------
create table if not exists public.delegados_pin (
  delegado_id  uuid primary key references public.delegados(id) on delete cascade,
  pin          text not null,
  creado_en    timestamptz not null default now()
);
comment on table public.delegados_pin is 'PIN personal de cada delegado. Solo lo ve el staff administrador; el delegado lo recibe en acreditacion.';

alter table public.delegados_pin enable row level security;

create or replace function public.pin_nuevo() returns text
language sql volatile as $$
  select lpad((floor(random() * 10000))::int::text, 4, '0');
$$;

create or replace function public.delegados_pin_auto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.delegados_pin (delegado_id, pin) values (new.id, public.pin_nuevo())
  on conflict (delegado_id) do nothing;
  return new;
end $$;

drop trigger if exists delegados_pin_auto on public.delegados;
create trigger delegados_pin_auto after insert on public.delegados
  for each row execute function public.delegados_pin_auto();

-- PIN para los delegados que ya existian
insert into public.delegados_pin (delegado_id, pin)
select d.id, public.pin_nuevo() from public.delegados d
where not exists (select 1 from public.delegados_pin p where p.delegado_id = d.id);


-- --------------------------------------------------------------
-- 4. Roles del staff
-- --------------------------------------------------------------
create table if not exists public.staff (
  email      text primary key,
  nombre     text,
  rol        text not null default 'operador' check (rol in ('admin', 'operador')),
  creado_en  timestamptz not null default now()
);
comment on table public.staff is 'Cuentas del staff y su rol. admin: todo. operador: puntuar, marcar comidas, ver chats y archivos.';
alter table public.staff enable row level security;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.role() = 'authenticated';
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) and rol = 'admin'
  );
$$;

create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select rol from public.staff where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))),
    case when auth.role() = 'authenticated' then 'operador' else null end);
$$;
grant execute on function public.mi_rol() to anon, authenticated;

drop policy if exists "staff_lectura" on public.staff;
create policy "staff_lectura" on public.staff for select to authenticated using (true);
drop policy if exists "staff_admin" on public.staff;
create policy "staff_admin" on public.staff for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- PIN: solo el administrador lo ve y lo cambia
drop policy if exists "pin_admin" on public.delegados_pin;
create policy "pin_admin" on public.delegados_pin for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Delegados, comidas y salas: solo el administrador modifica
drop policy if exists "delegados_escritura_staff" on public.delegados;
create policy "delegados_escritura_staff" on public.delegados for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "dieta_solo_staff" on public.delegados_dieta;
drop policy if exists "dieta_lectura_staff" on public.delegados_dieta;
create policy "dieta_lectura_staff" on public.delegados_dieta for select to authenticated using (true);
drop policy if exists "dieta_escritura_admin" on public.delegados_dieta;
create policy "dieta_escritura_admin" on public.delegados_dieta for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "comidas_escritura_staff" on public.comidas;
create policy "comidas_escritura_staff" on public.comidas for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "salas_staff" on public.chat_salas;
create policy "salas_staff" on public.chat_salas for all to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "mensajes_borrado_staff" on public.chat_mensajes;
create policy "mensajes_borrado_staff" on public.chat_mensajes for delete to authenticated using (public.es_admin());
drop policy if exists "chat_archivos_borrado_staff" on storage.objects;
create policy "chat_archivos_borrado_staff" on storage.objects for delete to authenticated using (bucket_id = 'chat-archivos' and public.es_admin());

-- Entregas y puntuaciones: cualquier miembro del staff (admin u operador)
drop policy if exists "entregas_escritura_staff" on public.entregas;
create policy "entregas_escritura_staff" on public.entregas for all to authenticated using (true) with check (true);
drop policy if exists "puntuaciones_escritura_staff" on public.puntuaciones;
create policy "puntuaciones_escritura_staff" on public.puntuaciones for all to authenticated using (true) with check (true);


-- --------------------------------------------------------------
-- 5. Comidas privadas: las entregas las lee el staff; el delegado
--    las consulta con su codigo y su PIN (mis_entregas)
-- --------------------------------------------------------------
drop policy if exists "entregas_lectura_publica" on public.entregas;
drop policy if exists "entregas_lectura_staff" on public.entregas;
create policy "entregas_lectura_staff" on public.entregas for select to authenticated using (true);


-- --------------------------------------------------------------
-- 2. Verificacion en el servidor
-- --------------------------------------------------------------
create or replace function public.verificar_delegado(p_codigo text, p_pin text)
returns table (id uuid, codigo text, nombre text, pais text, comite text, institucion text, rol text)
language plpgsql security definer set search_path = public as $$
declare d public.delegados%rowtype;
begin
  select * into d from public.delegados
   where public.delegados.codigo = upper(trim(coalesce(p_codigo, ''))) and activo;
  if not found then return; end if;
  if not exists (select 1 from public.delegados_pin p where p.delegado_id = d.id and p.pin = trim(coalesce(p_pin, ''))) then
    return;
  end if;
  return query select d.id, d.codigo, d.nombre, d.pais, d.comite, d.institucion, d.rol;
end $$;
grant execute on function public.verificar_delegado(text, text) to anon, authenticated;

create or replace function public.mis_entregas(p_codigo text, p_pin text)
returns setof public.entregas
language plpgsql security definer set search_path = public as $$
declare d public.delegados%rowtype;
begin
  select * into d from public.delegados
   where codigo = upper(trim(coalesce(p_codigo, ''))) and activo;
  if not found then raise exception 'CREDENCIAL_INVALIDA'; end if;
  if not exists (select 1 from public.delegados_pin p where p.delegado_id = d.id and p.pin = trim(coalesce(p_pin, ''))) then
    raise exception 'PIN_INVALIDO';
  end if;
  return query select * from public.entregas e where e.delegado_id = d.id order by e.entregado_en;
end $$;
grant execute on function public.mis_entregas(text, text) to anon, authenticated;


-- --------------------------------------------------------------
-- 3. chat_enviar con PIN (la version sin PIN se elimina)
-- --------------------------------------------------------------
drop function if exists public.chat_enviar(text, uuid, text, text, text, int);

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

  t := nullif(trim(coalesce(p_texto, '')), '');
  if t is null and p_archivo_ruta is null then raise exception 'MENSAJE_VACIO'; end if;
  if length(t) > 2000 then raise exception 'MENSAJE_LARGO'; end if;

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

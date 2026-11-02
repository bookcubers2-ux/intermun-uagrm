-- ==============================================================
-- InterMUN UAGRM - Cuentas de delegados
-- --------------------------------------------------------------
-- La cuenta de cada delegado es su correo o su ID (IM-0001) y la
-- contrasena es su numero de carnet. Por dentro la contrasena es el
-- mismo PIN que ya usan Mis comidas, Mi desempeno y el chat, de modo
-- que esos modulos siguen funcionando sin cambios.
--
--   1. delegados_privado: correo, carnet, celular, foros pedidos...
--      Solo el administrador la lee. NUNCA es publica.
--   2. login_delegado: inicia sesion con correo o ID + contrasena.
--      Frena a quien falla muchas veces seguidas.
--   3. mi_cuenta: lo que cada delegado ve de si mismo (con su
--      contrasena), incluidos sus foros pedidos y su alergia.
--
-- Importante: los delegados NO son usuarios de Supabase Auth. Si lo
-- fueran, tendrian el rol "authenticated", que aqui significa staff.
--
-- Requiere INSTALACION-SUPABASE.sql e INSTALACION-IDENTIDAD-Y-ROLES.sql.
-- Es seguro correrlo mas de una vez.
-- ==============================================================


-- --------------------------------------------------------------
-- 1. Datos privados de cada delegado
-- --------------------------------------------------------------
create table if not exists public.delegados_privado (
  delegado_id     uuid primary key references public.delegados(id) on delete cascade,
  tipo            text not null default 'interno' check (tipo in ('interno', 'externo')),
  correo          text,
  carnet          text,
  registro        text,
  celular         text,
  edad            int,
  sexo            text,
  semestre        text,
  nivel_estudios  text,
  experiencia     text,
  foro_1          text,
  foro_2          text,
  comprobante     text,
  creado_en       timestamptz not null default now()
);
comment on table public.delegados_privado is 'Datos personales del formulario de inscripcion. Solo el administrador; el delegado ve los suyos con mi_cuenta.';
comment on column public.delegados_privado.foro_1 is 'Foro pedido en primera opcion, con el nombre exacto de chat_salas.comite';

-- Un correo identifica a una sola persona: es lo que permite entrar con el correo.
create unique index if not exists idx_delegados_privado_correo
  on public.delegados_privado (lower(correo)) where correo is not null and correo <> '';

alter table public.delegados_privado enable row level security;

drop policy if exists "privado_admin" on public.delegados_privado;
create policy "privado_admin" on public.delegados_privado
  for all to authenticated using (public.es_admin()) with check (public.es_admin());


-- --------------------------------------------------------------
-- 2. Registro de intentos fallidos de inicio de sesion
--    Sin politicas: solo las funciones de abajo la tocan.
-- --------------------------------------------------------------
create table if not exists public.login_intentos (
  id         bigserial primary key,
  cuenta     text not null,
  creado_en  timestamptz not null default now()
);
create index if not exists idx_login_intentos_cuenta on public.login_intentos (cuenta, creado_en);
alter table public.login_intentos enable row level security;


-- --------------------------------------------------------------
-- 3. login_delegado(cuenta, clave)
--    cuenta = correo o ID (IM-0001); clave = carnet (o el PIN que
--    el staff haya puesto). Devuelve una fila si coinciden, ninguna
--    si no. Tras 8 fallos en 10 minutos con la misma cuenta, avisa
--    DEMASIADOS_INTENTOS. Devuelve tambien el PIN guardado, para que
--    el navegador use siempre la forma exacta (sin puntos ni espacios).
-- --------------------------------------------------------------
create or replace function public.login_delegado(p_cuenta text, p_clave text)
returns table (id uuid, codigo text, nombre text, pais text, comite text, institucion text, rol text, pin text)
language plpgsql security definer set search_path = public as $fn$
declare
  v_cuenta text := lower(trim(coalesce(p_cuenta, '')));
  v_clave  text := trim(coalesce(p_clave, ''));
  v_solo   text;
  d        public.delegados%rowtype;
  v_pin    text;
begin
  if v_cuenta = '' or v_clave = '' then return; end if;

  if (select count(*) from public.login_intentos li
       where li.cuenta = v_cuenta and li.creado_en > now() - interval '10 minutes') >= 8 then
    raise exception 'DEMASIADOS_INTENTOS';
  end if;

  -- "11.361.309" o "11 361 309" valen igual que "11361309"
  v_solo := regexp_replace(v_clave, '[ .\-]', '', 'g');

  select dd.* into d
    from public.delegados dd
   where dd.activo
     and (dd.codigo = upper(v_cuenta)
          or dd.id in (select p.delegado_id from public.delegados_privado p
                        where lower(p.correo) = v_cuenta))
   limit 1;

  if found then
    select pn.pin into v_pin
      from public.delegados_pin pn
     where pn.delegado_id = d.id
       and (pn.pin = v_clave or (pn.pin ~ '^[0-9]+$' and pn.pin = v_solo))
     limit 1;
  end if;

  if v_pin is not null then
    delete from public.login_intentos li where li.cuenta = v_cuenta;
    return query select d.id, d.codigo, d.nombre, d.pais, d.comite, d.institucion, d.rol, v_pin;
    return;
  end if;

  insert into public.login_intentos (cuenta) values (v_cuenta);
  delete from public.login_intentos li where li.creado_en < now() - interval '1 day';
  return;
end
$fn$;
grant execute on function public.login_delegado(text, text) to anon, authenticated;


-- --------------------------------------------------------------
-- 4. mi_cuenta(codigo, pin)
--    Lo que cada delegado ve de si mismo. Verifica el par igual que
--    mis_entregas; no filtra nada de otras personas.
-- --------------------------------------------------------------
-- Se vuelve a crear desde cero para poder correr este archivo otra vez aunque INSTALACION-AUTORIDADES.sql
-- ya haya cambiado la funcion (corre INSTALACION-AUTORIDADES.sql despues para recuperar el cargo).
drop function if exists public.mi_cuenta(text, text);
create or replace function public.mi_cuenta(p_codigo text, p_pin text)
returns table (id uuid, codigo text, nombre text, pais text, comite text, institucion text, rol text,
               tipo text, correo text, celular text, foro_1 text, foro_2 text, alergia text)
language plpgsql security definer set search_path = public as $fn$
declare d public.delegados%rowtype;
begin
  select dd.* into d from public.delegados dd
   where dd.codigo = upper(trim(coalesce(p_codigo, ''))) and dd.activo;
  if not found then raise exception 'CREDENCIAL_INVALIDA'; end if;
  if not exists (select 1 from public.delegados_pin pn
                  where pn.delegado_id = d.id and pn.pin = trim(coalesce(p_pin, ''))) then
    raise exception 'PIN_INVALIDO';
  end if;

  return query
    select d.id, d.codigo, d.nombre, d.pais, d.comite, d.institucion, d.rol,
           pv.tipo, pv.correo, pv.celular, pv.foro_1, pv.foro_2, di.restriccion
      from (select 1) x
      left join public.delegados_privado pv on pv.delegado_id = d.id
      left join public.delegados_dieta  di on di.delegado_id = d.id;
end
$fn$;
grant execute on function public.mi_cuenta(text, text) to anon, authenticated;

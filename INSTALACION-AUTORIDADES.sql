-- ==============================================================
-- InterMUN UAGRM - Autoridades de mesa
-- --------------------------------------------------------------
-- Presidentes, moderadores y oficiales de conferencia son personas
-- acreditadas como los delegados (QR, cuenta, comidas, chat de su
-- foro), pero con un CARGO que se imprime en su credencial.
--
--   - delegados.cargo: el cargo, publico como el resto de la credencial.
--   - delegados_privado.tipo acepta 'autoridad'.
--   - mi_cuenta devuelve tambien el cargo.
--
-- Su rol es 'chair'; las puntuaciones solo cuentan a quien tiene rol
-- 'delegado' (se aplica en el sitio, js/puntuaciones.js).
-- Requiere INSTALACION-CUENTAS-DELEGADOS.sql. Es seguro correrlo mas de una vez.
-- ==============================================================

alter table public.delegados add column if not exists cargo text;
comment on column public.delegados.cargo is 'Cargo de una autoridad de mesa: Presidente, Moderador, Oficial de conferencia. Vacio en los delegados.';

alter table public.delegados_privado drop constraint if exists delegados_privado_tipo_check;
alter table public.delegados_privado
  add constraint delegados_privado_tipo_check check (tipo in ('interno', 'externo', 'autoridad'));

-- El tipo de retorno cambia (se agrega "cargo"), asi que la funcion se vuelve a crear.
drop function if exists public.mi_cuenta(text, text);
create or replace function public.mi_cuenta(p_codigo text, p_pin text)
returns table (id uuid, codigo text, nombre text, pais text, comite text, institucion text, rol text,
               tipo text, correo text, celular text, foro_1 text, foro_2 text, alergia text, cargo text)
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
           pv.tipo, pv.correo, pv.celular, pv.foro_1, pv.foro_2, di.restriccion, d.cargo
      from (select 1) x
      left join public.delegados_privado pv on pv.delegado_id = d.id
      left join public.delegados_dieta  di on di.delegado_id = d.id;
end
$fn$;
grant execute on function public.mi_cuenta(text, text) to anon, authenticated;

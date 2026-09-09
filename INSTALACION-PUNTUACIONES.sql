-- ==============================================================
-- InterMUN UAGRM - Modulo de puntuaciones por foro
-- --------------------------------------------------------------
-- Cada fila es un puntaje que un chair o el Secretariado otorga
-- a un delegado en un foro, por un criterio y en una sesion.
-- Las puntuaciones son PUBLICAS (cualquiera las lee, se muestran
-- en vivo en el portal y en cada credencial); solo el staff con
-- sesion iniciada puede otorgarlas o corregirlas.
-- ==============================================================

create table if not exists public.puntuaciones (
  id            bigserial primary key,
  delegado_id   uuid not null references public.delegados(id) on delete cascade,
  foro          text not null,
  criterio      text not null,
  puntos        numeric(6,1) not null check (puntos >= -20 and puntos <= 100),
  sesion        int not null default 1 check (sesion >= 1 and sesion <= 20),
  nota          text,
  otorgado_por  text,
  creado_en     timestamptz not null default now()
);

comment on table  public.puntuaciones is 'Puntajes otorgados a los delegados en cada foro. Lectura publica, escritura de staff.';
comment on column public.puntuaciones.foro is 'Clave del foro, la misma que la sala de chat: csi, disec, ecofin, sochum, cstd, unea, csw, cnd, foro-nacional, foro-municipal';
comment on column public.puntuaciones.criterio is 'Clave del criterio definido en js/config.js (CRITERIOS_PUNTAJE)';

create index if not exists idx_puntuaciones_delegado on public.puntuaciones (delegado_id);
create index if not exists idx_puntuaciones_foro     on public.puntuaciones (foro);

alter table public.puntuaciones enable row level security;

drop policy if exists "puntuaciones_lectura_publica" on public.puntuaciones;
create policy "puntuaciones_lectura_publica"
  on public.puntuaciones for select using (true);

drop policy if exists "puntuaciones_escritura_staff" on public.puntuaciones;
create policy "puntuaciones_escritura_staff"
  on public.puntuaciones for all to authenticated using (true) with check (true);

-- Tiempo real: el portal y las credenciales se actualizan solos.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'puntuaciones'
  ) then
    alter publication supabase_realtime add table public.puntuaciones;
  end if;
end $$;

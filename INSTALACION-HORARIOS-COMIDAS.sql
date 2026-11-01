-- ==============================================================
-- InterMUN UAGRM - Hora de cada comida
-- --------------------------------------------------------------
-- Agrega la hora a las comidas. Con ella el Servicio de comidas abre
-- solo en la comida que toca segun el reloj, y cada delegado ve a que
-- hora es su proxima comida.
-- Es seguro correrlo mas de una vez.
-- ==============================================================

alter table public.comidas add column if not exists hora time;
comment on column public.comidas.hora is 'Hora a la que se entrega (hora de Bolivia), por ejemplo 12:00. Opcional.';

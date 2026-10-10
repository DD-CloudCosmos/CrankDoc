-- Keep raw stored make/model values inside their limits as well as rejecting blanks.
-- The original migration has already run locally; preserve its history.
alter table public.garage_bikes
  add constraint garage_bikes_make_model_length
  check (length(make) between 1 and 120 and length(model) between 1 and 120);

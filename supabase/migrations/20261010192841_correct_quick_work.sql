-- Correct the sole quick-entry work definition in the same locked transaction.
-- Task state, observations, origins and completion timestamps are unchanged.
create or replace function public.edit_job_details(p_job_id uuid,p_expected_revision integer,p_details jsonb) returns public.maintenance_jobs
language plpgsql security invoker set search_path = '' as $$
declare result public.maintenance_jobs; target uuid;
begin
  if not coalesce(public.maintenance_details_valid(p_details),false) or p_expected_revision is null or p_expected_revision < 1 then raise exception using errcode='22023',message='Invalid maintenance record'; end if;
  select bike_id into target from public.maintenance_jobs where id=p_job_id and owner_id=(select auth.uid());
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  -- All mileage-changing transactions lock the bike before the job.
  perform 1 from public.garage_bikes where id=target and owner_id=(select auth.uid()) for update;
  select * into result from public.maintenance_jobs where id=p_job_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  if result.revision <> p_expected_revision then raise exception using errcode='PT409',message='Job changed on another device',detail=row_to_json(result)::text; end if;
  update public.maintenance_jobs set title=p_details->>'title',job_date=(p_details->>'date')::date,mileage_km=(p_details->>'mileageKm')::numeric,
    tasks=case when template_snapshot is null and jsonb_array_length(tasks)=1 and tasks->0->'key'='null'::jsonb and tasks->0->'origin'='null'::jsonb and tasks->0->>'action'='other'
      then jsonb_set(tasks,'{0,label}',p_details->'title') else tasks end,
    notes=p_details->>'notes',parts=p_details->>'parts',performer=p_details->>'performer',cost_minor=(p_details->>'costMinor')::bigint,currency=p_details->>'currency',revision=revision+1
    where id=p_job_id and owner_id=(select auth.uid()) returning * into result;
  update public.garage_bikes set mileage_km=greatest(coalesce(mileage_km,0),result.mileage_km) where id=target and owner_id=(select auth.uid());
  return result;
end;
$$;

-- Task changes and their closure state are one revision-checked write.
-- Existing task/template and closure CHECK constraints remain in force for direct writes.
create function public.save_task_patch(p_job_id uuid,p_expected_revision integer,p_task_id uuid,p_patch jsonb)
returns public.maintenance_jobs language plpgsql security invoker set search_path = '' as $$
declare result public.maintenance_jobs; t jsonb; changed jsonb; tasks jsonb := '[]';
  matched boolean := false; all_done boolean; applicable_done boolean; stamp timestamptz := now();
begin
  if p_expected_revision is null or p_expected_revision < 1 or p_task_id is null or
    jsonb_typeof(p_patch) is distinct from 'object' then
    raise exception using errcode='22023',message='Invalid task patch';
  end if;
  if exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('state','reason','notes')) or
    (p_patch ? 'state' and (jsonb_typeof(p_patch->'state') <> 'string' or p_patch->>'state' not in ('todo','done','skipped','not_applicable'))) or
    (p_patch ? 'reason' and (jsonb_typeof(p_patch->'reason') <> 'string' or length(p_patch->>'reason') > 500)) or
    (p_patch ? 'notes' and (jsonb_typeof(p_patch->'notes') <> 'string' or length(p_patch->>'notes') > 4000)) then
    raise exception using errcode='22023',message='Invalid task patch';
  end if;
  select * into result from public.maintenance_jobs where id=p_job_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  if result.revision <> p_expected_revision then raise exception using errcode='PT409',message='Job changed on another device',detail=row_to_json(result)::text; end if;
  for t in select value from jsonb_array_elements(result.tasks) loop
    changed := t;
    if (t->>'id')::uuid = p_task_id then
      matched := true;
      changed := t || p_patch;
      changed := changed || jsonb_build_object('doneAt',case when changed->>'state'='done' then
        case when t->>'state'='done' then t->'doneAt' else to_jsonb(stamp) end else 'null'::jsonb end);
    end if;
    tasks := tasks || jsonb_build_array(changed);
  end loop;
  if not matched or not public.maintenance_tasks_valid(tasks) then raise exception using errcode='22023',message='Invalid task patch'; end if;
  all_done := jsonb_array_length(tasks)>0 and not jsonb_path_exists(tasks,'$[*] ? (@.state != "done")');
  applicable_done := jsonb_array_length(tasks)>0 and not jsonb_path_exists(tasks,'$[*] ? (@.state != "done" && @.state != "not_applicable")');
  update public.maintenance_jobs set tasks=save_task_patch.tasks,revision=revision+1,
    status=case when result.close_reason='manual' then case when applicable_done then 'completed' else 'partial' end
      when all_done then 'completed' else 'in_progress' end,
    close_reason=case when result.close_reason='manual' then 'manual' when all_done then 'all_done' else null end,
    closed_at=case when result.close_reason='manual' or all_done then coalesce(result.closed_at,stamp) else null end
    where id=p_job_id and owner_id=(select auth.uid()) returning * into result;
  return result;
end;
$$;

create function public.close_maintenance_job(p_job_id uuid,p_expected_revision integer,p_date date,p_mileage numeric)
returns public.maintenance_jobs language plpgsql security invoker set search_path = '' as $$
declare result public.maintenance_jobs; target uuid; applicable_done boolean;
begin
  if p_expected_revision is null or p_expected_revision < 1 or p_date is null or
    p_date not between date '0001-01-01' and date '9999-12-31' or p_mileage is null or
    not (p_mileage >= 0 and p_mileage < 1000000000) or round(p_mileage,3) <> p_mileage then
    raise exception using errcode='22023',message='Invalid completion details';
  end if;
  select bike_id into target from public.maintenance_jobs where id=p_job_id and owner_id=(select auth.uid());
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  -- Global lock order: bike before job whenever both rows are needed.
  perform 1 from public.garage_bikes where id=target and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  select * into result from public.maintenance_jobs where id=p_job_id and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  if result.revision <> p_expected_revision then raise exception using errcode='PT409',message='Job changed on another device',detail=row_to_json(result)::text; end if;
  applicable_done := jsonb_array_length(result.tasks)>0 and not jsonb_path_exists(result.tasks,'$[*] ? (@.state != "done" && @.state != "not_applicable")');
  update public.maintenance_jobs set job_date=p_date,mileage_km=p_mileage,revision=revision+1,
    status=case when applicable_done then 'completed' else 'partial' end,
    close_reason='manual',closed_at=coalesce(result.closed_at,now())
    where id=p_job_id and owner_id=(select auth.uid()) returning * into result;
  update public.garage_bikes set mileage_km=greatest(coalesce(mileage_km,0),p_mileage)
    where id=target and owner_id=(select auth.uid());
  return result;
end;
$$;
revoke all on function public.save_task_patch(uuid,integer,uuid,jsonb),public.close_maintenance_job(uuid,integer,date,numeric) from public,anon;
grant execute on function public.save_task_patch(uuid,integer,uuid,jsonb),public.close_maintenance_job(uuid,integer,date,numeric) to authenticated;

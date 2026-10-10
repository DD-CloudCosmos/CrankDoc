-- Correct task accumulator qualification; retain grants and all validation.
create or replace function public.save_task_patch(p_job_id uuid,p_expected_revision integer,p_task_id uuid,p_patch jsonb)
returns public.maintenance_jobs language plpgsql security invoker set search_path = '' as $$
declare result public.maintenance_jobs; t jsonb; changed jsonb; updated_tasks jsonb := '[]';
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
    updated_tasks := updated_tasks || jsonb_build_array(changed);
  end loop;
  if not matched or not public.maintenance_tasks_valid(updated_tasks) then raise exception using errcode='22023',message='Invalid task patch'; end if;
  all_done := jsonb_array_length(updated_tasks)>0 and not jsonb_path_exists(updated_tasks,'$[*] ? (@.state != "done")');
  applicable_done := jsonb_array_length(updated_tasks)>0 and not jsonb_path_exists(updated_tasks,'$[*] ? (@.state != "done" && @.state != "not_applicable")');
  update public.maintenance_jobs set tasks=updated_tasks,revision=revision+1,
    status=case when result.close_reason='manual' then case when applicable_done then 'completed' else 'partial' end
      when all_done then 'completed' else 'in_progress' end,
    close_reason=case when result.close_reason='manual' then 'manual' when all_done then 'all_done' else null end,
    closed_at=case when result.close_reason='manual' or all_done then coalesce(result.closed_at,stamp) else null end
    where id=p_job_id and owner_id=(select auth.uid()) returning * into result;
  return result;
end;
$$;


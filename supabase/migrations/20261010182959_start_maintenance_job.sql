create function public.start_maintenance_job(p_draft jsonb,p_source_job_id uuid default null,p_source_revision integer default null,p_task_ids uuid[] default '{}',p_close_previous boolean default false)
returns public.maintenance_jobs language plpgsql security invoker set search_path='' as $$
declare result public.maintenance_jobs; source public.maintenance_jobs; bike public.garage_bikes;
 target uuid; job_id uuid; previous_id uuid; t jsonb; item jsonb; collected jsonb; merged jsonb; origin jsonb; matched boolean; all_done boolean;
begin
 if not coalesce(public.maintenance_details_valid(p_draft),false) or not coalesce(public.maintenance_tasks_valid(p_draft->'tasks'),false) or
 jsonb_typeof(p_draft->'id') is distinct from 'string' or jsonb_typeof(p_draft->'bikeId') is distinct from 'string' or
 p_draft->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or p_draft->>'bikeId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
 (p_draft->'template' is distinct from 'null'::jsonb and not coalesce(public.maintenance_template_valid(p_draft->'template'),false)) then raise exception using errcode='22023',message='Invalid draft'; end if;
 target:=(p_draft->>'bikeId')::uuid; job_id:=(p_draft->>'id')::uuid;
 select * into bike from public.garage_bikes where id=target and owner_id=(select auth.uid()) for update;
 if not found then raise exception using errcode='PT404',message='Bike not found'; end if;
 select * into result from public.maintenance_jobs where id=job_id and owner_id=(select auth.uid());
 if found then
  if result.bike_id<>target then raise exception using errcode='22023',message='Draft identifier already used'; end if;
  return result;
 end if;
 if bike.archived_at is not null then raise exception using errcode='22023',message='Bike is archived'; end if;
 if p_task_ids is null or p_close_previous is null or cardinality(p_task_ids)>100 or
 cardinality(p_task_ids)<>(select count(distinct id) from unnest(p_task_ids) id) then raise exception using errcode='22023',message='Invalid carry selection'; end if;
 collected:=p_draft->'tasks';
 for t in select value from jsonb_array_elements(collected) loop
  if t->'origin' is distinct from 'null'::jsonb or t->>'state' not in ('todo','done') or
   (t->>'state'='todo' and (t->>'notes'<>'' or t->>'reason'<>'')) then raise exception using errcode='22023',message='New tasks need fresh observations'; end if;
 end loop;
 if p_source_job_id is null then
  if cardinality(p_task_ids)>0 or p_close_previous or p_source_revision is not null then raise exception using errcode='22023',message='Source required'; end if;
 else
  select * into source from public.maintenance_jobs where id=p_source_job_id and bike_id=target and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Job not found'; end if;
  select id into previous_id from public.maintenance_jobs where bike_id=target and owner_id=(select auth.uid()) order by created_at desc,id desc limit 1;
  if previous_id<>source.id or p_source_revision is null or source.revision<>p_source_revision then raise exception using errcode='PT409',message='Previous activity changed',detail=row_to_json(source)::text; end if;
  if p_close_previous and source.status<>'in_progress' then raise exception using errcode='22023',message='Previous activity already closed'; end if;
  if exists(select 1 from unnest(p_task_ids) id where not exists(select 1 from jsonb_array_elements(source.tasks) st where (st->>'id')::uuid=id and st->>'state' in ('todo','skipped'))) then raise exception using errcode='22023',message='Invalid selected task'; end if;
  for t in select value from jsonb_array_elements(source.tasks) where (value->>'id')::uuid=any(p_task_ids) loop
   origin:=jsonb_build_object('jobId',source.id,'taskId',t->>'id','previousNotes',t->>'notes');
   matched:=false; merged:='[]';
   for item in select value from jsonb_array_elements(collected) loop
    if not matched and t->'key'<>'null'::jsonb and item->'key'=t->'key' then item:=item||jsonb_build_object('origin',origin); matched:=true; end if;
    merged:=merged||jsonb_build_array(item);
   end loop;
   if not matched then merged:=merged||jsonb_build_array(t||jsonb_build_object('id',gen_random_uuid(),'state','todo','reason','','notes','','doneAt',null,'origin',origin)); end if;
   collected:=merged;
  end loop;
 end if;
 if not coalesce(public.maintenance_tasks_valid(collected),false) then raise exception using errcode='22023',message='Invalid task count'; end if;
 all_done:=not jsonb_path_exists(collected,'$[*] ? (@.state != "done")');
 insert into public.maintenance_jobs(id,owner_id,bike_id,title,job_date,mileage_km,tasks,template_id,template_version,template_snapshot,notes,parts,performer,cost_minor,currency,status,close_reason,closed_at)
 values(job_id,(select auth.uid()),target,p_draft->>'title',(p_draft->>'date')::date,(p_draft->>'mileageKm')::numeric,collected,
 p_draft->'template'->>'id',(p_draft->'template'->>'version')::integer,nullif(p_draft->'template','null'::jsonb),p_draft->>'notes',p_draft->>'parts',p_draft->>'performer',(p_draft->>'costMinor')::bigint,p_draft->>'currency',
 case when all_done then 'completed' else 'in_progress' end,case when all_done then 'all_done' else null end,case when all_done then now() else null end) returning * into result;
 if p_close_previous then
  update public.maintenance_jobs set status=case when not jsonb_path_exists(tasks,'$[*] ? (@.state != "done" && @.state != "not_applicable")') then 'completed' else 'partial' end,
   close_reason='manual',closed_at=now(),revision=revision+1 where id=source.id and owner_id=(select auth.uid());
 end if;
 update public.garage_bikes set mileage_km=greatest(coalesce(mileage_km,0),result.mileage_km) where id=target and owner_id=(select auth.uid());
 return result;
end;
$$;
revoke all on function public.start_maintenance_job(jsonb,uuid,integer,uuid[],boolean) from public,anon;
grant execute on function public.start_maintenance_job(jsonb,uuid,integer,uuid[],boolean) to authenticated;

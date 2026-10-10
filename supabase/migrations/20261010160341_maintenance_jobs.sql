-- Pure validation also runs for direct authenticated table writes.
create function public.maintenance_tasks_valid(p_tasks jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare t jsonb; origin jsonb; ids uuid[] := '{}'; task_id uuid; k text; stamp timestamptz;
begin
  if jsonb_typeof(p_tasks) is distinct from 'array' or jsonb_array_length(p_tasks) not between 1 and 100 then return false; end if;
  for t in select value from jsonb_array_elements(p_tasks) loop
    if jsonb_typeof(t) is distinct from 'object' then return false; end if;
    if not (t ?& array['id','key','label','action','state','reason','notes','doneAt','origin','reference','warning','specification','safety']) then return false; end if;
    if jsonb_typeof(t->'id') <> 'string' or (t->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
    task_id := (t->>'id')::uuid;
    if task_id = any(ids) then return false; end if;
    ids := array_append(ids,task_id);
    if jsonb_typeof(t->'label') <> 'string' or length(t->>'label') not between 1 and 160 or (t->>'label') !~ '\S' then return false; end if;
    if jsonb_typeof(t->'action') <> 'string' or (t->>'action') not in ('inspect','clean','adjust','replace','other') then return false; end if;
    if jsonb_typeof(t->'state') <> 'string' or (t->>'state') not in ('todo','done','skipped','not_applicable') then return false; end if;
    if jsonb_typeof(t->'notes') <> 'string' or length(t->>'notes') > 4000 or jsonb_typeof(t->'reason') <> 'string' or length(t->>'reason') > 500 then return false; end if;
    if (t->>'state') in ('skipped','not_applicable') and (t->>'reason') !~ '\S' then return false; end if;
    if (t->>'state') = 'done' then
      if jsonb_typeof(t->'doneAt') <> 'string' or (t->>'doneAt') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$' then return false; end if;
      stamp := (t->>'doneAt')::timestamptz;
      if not isfinite(stamp) then return false; end if;
    elsif t->'doneAt' <> 'null'::jsonb then return false;
    end if;
    foreach k in array array['key','reference','warning','specification'] loop
      if t->k <> 'null'::jsonb and (jsonb_typeof(t->k) <> 'string' or length(t->>k) > case when k='key' then 160 else 4000 end) then return false; end if;
    end loop;
    if t->'safety' <> 'null'::jsonb and (jsonb_typeof(t->'safety') <> 'string' or (t->>'safety') not in ('green','yellow','red')) then return false; end if;
    origin := t->'origin';
    if origin <> 'null'::jsonb then
      if jsonb_typeof(origin) <> 'object' or not (origin ?& array['jobId','taskId','previousNotes']) then return false; end if;
      foreach k in array array['jobId','taskId'] loop
        if jsonb_typeof(origin->k) <> 'string' or (origin->>k) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
      end loop;
      if jsonb_typeof(origin->'previousNotes') <> 'string' or length(origin->>'previousNotes') > 4000 then return false; end if;
    end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create function public.maintenance_template_valid(p_template jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare t jsonb; k text; defs jsonb := '[]';
begin
  if p_template is null then return true; end if;
  if jsonb_typeof(p_template) <> 'object' or not (p_template ?& array['id','version','title','kind','motorcycleId','years','markets','variants','intervalKm','intervalMonths','frequency','source','tasks']) then return false; end if;
  foreach k in array array['id','title'] loop
    if jsonb_typeof(p_template->k) <> 'string' or length(p_template->>k) not between 1 and 160 or (p_template->>k) !~ '\S' then return false; end if;
  end loop;
  if jsonb_typeof(p_template->'version') <> 'number' or (p_template->>'version')::numeric not between 1 and 2147483647 or trunc((p_template->>'version')::numeric) <> (p_template->>'version')::numeric then return false; end if;
  if jsonb_typeof(p_template->'kind') <> 'string' or p_template->>'kind' not in ('scheduled','time_based','individual','custom') or jsonb_typeof(p_template->'frequency') <> 'string' or p_template->>'frequency' not in ('once','recurring','on_demand') then return false; end if;
  if p_template->'motorcycleId' <> 'null'::jsonb and (jsonb_typeof(p_template->'motorcycleId') <> 'string' or (p_template->>'motorcycleId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then return false; end if;
  foreach k in array array['years','markets','variants'] loop
    if jsonb_typeof(p_template->k) <> 'array' then return false; end if;
    for t in select value from jsonb_array_elements(p_template->k) loop
      if k='years' then
        if jsonb_typeof(t) <> 'number' or (t#>>'{}')::numeric not between 1885 and 9999 or trunc((t#>>'{}')::numeric) <> (t#>>'{}')::numeric then return false; end if;
      elsif jsonb_typeof(t) <> 'string' or length(t#>>'{}') not between 1 and 120 or (t#>>'{}') !~ '\S' then return false;
      end if;
    end loop;
  end loop;
  if p_template->'intervalKm' <> 'null'::jsonb and (jsonb_typeof(p_template->'intervalKm') <> 'number' or (p_template->>'intervalKm')::numeric < 0 or (p_template->>'intervalKm')::numeric >= 1000000000 or round((p_template->>'intervalKm')::numeric,3) <> (p_template->>'intervalKm')::numeric) then return false; end if;
  if p_template->'intervalMonths' <> 'null'::jsonb and (jsonb_typeof(p_template->'intervalMonths') <> 'number' or (p_template->>'intervalMonths')::numeric not between 1 and 2147483647 or trunc((p_template->>'intervalMonths')::numeric) <> (p_template->>'intervalMonths')::numeric) then return false; end if;
  if p_template->'source' <> 'null'::jsonb and (jsonb_typeof(p_template->'source') <> 'string' or length(p_template->>'source') > 4000) then return false; end if;
  if jsonb_typeof(p_template->'tasks') <> 'array' or jsonb_array_length(p_template->'tasks') not between 1 and 100 then return false; end if;
  for t in select value from jsonb_array_elements(p_template->'tasks') loop
    if jsonb_typeof(t) <> 'object' then return false; end if;
    defs := defs || jsonb_build_array(t || jsonb_build_object('id',lpad((jsonb_array_length(defs)+1)::text,8,'0') || '-0000-4000-8000-000000000000','state','todo','reason','','notes','','doneAt',null,'origin',null));
  end loop;
  return public.maintenance_tasks_valid(defs);
exception when others then return false;
end;
$$;

create table public.maintenance_jobs (
  id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  bike_id uuid not null, title text not null, job_date date not null check(job_date between date '0001-01-01' and date '9999-12-31'),
  mileage_km numeric(12,3) not null check(mileage_km >= 0 and mileage_km < 1000000000),
  tasks jsonb not null check(public.maintenance_tasks_valid(tasks)),
  template_id text, template_version integer, template_snapshot jsonb,
  notes text not null default '', parts text not null default '', performer text not null default '',
  cost_minor bigint check(cost_minor between 0 and 9007199254740991), currency text,
  status text not null check(status in ('in_progress','completed','partial')),
  close_reason text check(close_reason in ('all_done','manual')),
  closed_at timestamptz check(isfinite(closed_at)), revision integer not null default 1 check(revision >= 1),
  created_at timestamptz not null default now() check(isfinite(created_at)), unique(owner_id,id),
  foreign key(owner_id,bike_id) references public.garage_bikes(owner_id,id) on delete cascade,
  check(length(title) between 1 and 160 and title ~ '\S'), check(length(notes)<=4000 and length(parts)<=4000),
  check(length(performer)<=120),
  check((cost_minor is null and currency is null) or (cost_minor is not null and currency is not null and currency in ('EUR','GBP','USD'))),
  check(public.maintenance_template_valid(template_snapshot)),
  check((template_snapshot is null and template_id is null and template_version is null) or
    (template_snapshot is not null and template_id is not null and template_version is not null and template_id=template_snapshot->>'id' and template_version=(template_snapshot->>'version')::integer)),
  check((status='in_progress' and closed_at is null and close_reason is null) or
    (status in ('completed','partial') and closed_at is not null and close_reason is not null)),
  -- Automatic closure needs every task Done. Manual completion permits explained exclusions.
  check(case when close_reason='all_done' then status='completed' and not jsonb_path_exists(tasks,'$[*] ? (@.state != "done")')
    when close_reason='manual' then (status='partial')=jsonb_path_exists(tasks,'$[*] ? (@.state == "todo" || @.state == "skipped")')
    else status='in_progress' and jsonb_path_exists(tasks,'$[*] ? (@.state != "done")') end)
);
alter table public.maintenance_jobs enable row level security;
grant select,insert,update,delete on public.maintenance_jobs to authenticated;
create policy maintenance_jobs_owner on public.maintenance_jobs for all to authenticated
  using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create index maintenance_jobs_bike_date on public.maintenance_jobs(owner_id,bike_id,job_date desc,created_at desc);

-- Validate the JSON types before SQL casts can quietly accept strings or round values.
create function public.maintenance_details_valid(p_details jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare d date; k text;
begin
  if jsonb_typeof(p_details) is distinct from 'object' or not (p_details ?& array['title','date','mileageKm','notes','parts','performer','costMinor','currency']) then return false; end if;
  foreach k in array array['title','notes','parts','performer'] loop
    if jsonb_typeof(p_details->k) <> 'string' or length(p_details->>k) > (case when k='title' then 160 when k='performer' then 120 else 4000 end) then return false; end if;
  end loop;
  if p_details->>'title' !~ '\S' or jsonb_typeof(p_details->'date') <> 'string' or p_details->>'date' !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
  d := (p_details->>'date')::date;
  if d not between date '0001-01-01' and date '9999-12-31' then return false; end if;
  if jsonb_typeof(p_details->'mileageKm') <> 'number' or (p_details->>'mileageKm')::numeric < 0 or (p_details->>'mileageKm')::numeric >= 1000000000 or round((p_details->>'mileageKm')::numeric,3) <> (p_details->>'mileageKm')::numeric then return false; end if;
  if p_details->'costMinor' = 'null'::jsonb then return p_details->'currency' = 'null'::jsonb; end if;
  return jsonb_typeof(p_details->'costMinor')='number' and (p_details->>'costMinor')::numeric between 0 and 9007199254740991 and trunc((p_details->>'costMinor')::numeric)=(p_details->>'costMinor')::numeric and jsonb_typeof(p_details->'currency')='string' and p_details->>'currency' in ('EUR','GBP','USD');
exception when others then return false;
end;
$$;

create function public.create_quick_job(p_draft jsonb) returns public.maintenance_jobs
language plpgsql security invoker set search_path = '' as $$
declare result public.maintenance_jobs; bike public.garage_bikes; t jsonb; job_id uuid; target uuid;
begin
  if not coalesce(public.maintenance_details_valid(p_draft),false) or not coalesce(public.maintenance_tasks_valid(p_draft->'tasks'),false) or p_draft->'template' is distinct from 'null'::jsonb or jsonb_typeof(p_draft->'id') is distinct from 'string' or jsonb_typeof(p_draft->'bikeId') is distinct from 'string' or p_draft->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or p_draft->>'bikeId' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception using errcode='22023', message='Invalid maintenance record'; end if;
  for t in select value from jsonb_array_elements(p_draft->'tasks') loop
    if t->>'state' <> 'done' or t->'origin' <> 'null'::jsonb then raise exception using errcode='22023',message='Quick entries require performed tasks without origins'; end if;
  end loop;
  job_id := (p_draft->>'id')::uuid; target := (p_draft->>'bikeId')::uuid;
  select * into bike from public.garage_bikes where id=target and owner_id=(select auth.uid()) for update;
  if not found then raise exception using errcode='PT404',message='Bike not found'; end if;
  select * into result from public.maintenance_jobs where id=job_id and owner_id=(select auth.uid());
  if found then
    if result.bike_id <> target then raise exception using errcode='22023',message='Draft identifier already used'; end if;
    return result;
  end if;
  if bike.archived_at is not null then raise exception using errcode='22023',message='Bike is archived'; end if;
  insert into public.maintenance_jobs(id,owner_id,bike_id,title,job_date,mileage_km,tasks,notes,parts,performer,cost_minor,currency,status,close_reason,closed_at)
  values(job_id,(select auth.uid()),target,p_draft->>'title',(p_draft->>'date')::date,(p_draft->>'mileageKm')::numeric,p_draft->'tasks',p_draft->>'notes',p_draft->>'parts',p_draft->>'performer',(p_draft->>'costMinor')::bigint,p_draft->>'currency','completed','all_done',now()) returning * into result;
  update public.garage_bikes set mileage_km=greatest(coalesce(mileage_km,0),result.mileage_km) where id=target and owner_id=(select auth.uid());
  return result;
end;
$$;

create function public.edit_job_details(p_job_id uuid,p_expected_revision integer,p_details jsonb) returns public.maintenance_jobs
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
    notes=p_details->>'notes',parts=p_details->>'parts',performer=p_details->>'performer',cost_minor=(p_details->>'costMinor')::bigint,currency=p_details->>'currency',revision=revision+1
    where id=p_job_id and owner_id=(select auth.uid()) returning * into result;
  update public.garage_bikes set mileage_km=greatest(coalesce(mileage_km,0),result.mileage_km) where id=target and owner_id=(select auth.uid());
  return result;
end;
$$;

revoke all on function public.maintenance_tasks_valid(jsonb),public.maintenance_template_valid(jsonb),public.maintenance_details_valid(jsonb),public.create_quick_job(jsonb),public.edit_job_details(uuid,integer,jsonb) from public,anon;
grant execute on function public.maintenance_tasks_valid(jsonb),public.maintenance_template_valid(jsonb),public.maintenance_details_valid(jsonb),public.create_quick_job(jsonb),public.edit_job_details(uuid,integer,jsonb) to authenticated;

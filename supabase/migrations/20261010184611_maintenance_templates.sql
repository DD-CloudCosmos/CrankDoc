-- Personal definitions are separate from reviewed static templates and job snapshots.
create function public.custom_template_valid(d jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare t jsonb; keys text[] := '{}';
begin
 if d is null or not public.maintenance_template_valid(d) then return false; end if;
 if exists(select 1 from jsonb_object_keys(d) k where k not in ('id','version','title','kind','motorcycleId','years','markets','variants','intervalKm','intervalMonths','frequency','source','tasks')) then return false; end if;
 if d->>'kind'<>'custom' or d->>'frequency'<>'on_demand' or d->'motorcycleId'<>'null'::jsonb or d->'source'<>'null'::jsonb or d->'intervalKm'<>'null'::jsonb or d->'intervalMonths'<>'null'::jsonb or d->'years'<>'[]'::jsonb or d->'markets'<>'[]'::jsonb or d->'variants'<>'[]'::jsonb then return false; end if;
 if (d->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false; end if;
 for t in select value from jsonb_array_elements(d->'tasks') loop
  if exists(select 1 from jsonb_object_keys(t) k where k not in ('key','label','action','reference','warning','specification','safety')) then return false; end if;
  if jsonb_typeof(t->'key') is distinct from 'string' or (t->>'key') !~ '\S' or t->>'key'=any(keys) or t->'safety'<>'null'::jsonb then return false; end if;
  keys:=array_append(keys,t->>'key');
 end loop;
 return true;
exception when others then return false;
end;
$$;
create table public.maintenance_templates (
 id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
 version integer not null check(version>=1),title text not null check(length(title) between 1 and 160 and title ~ '\S'),
 definition jsonb not null check(public.custom_template_valid(definition)),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(id::text=definition->>'id' and version=(definition->>'version')::integer and title=definition->>'title')
);
alter table public.maintenance_templates enable row level security;
revoke all on public.maintenance_templates from anon;
grant select,insert,update,delete on public.maintenance_templates to authenticated;
create policy maintenance_templates_owner on public.maintenance_templates for all to authenticated
 using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create index maintenance_templates_owner_id on public.maintenance_templates(owner_id,id);
create function public.maintenance_template_version() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if new.version<>1 then raise exception using errcode='22023',message='New template starts at version 1'; end if;
  new.created_at:=now();
 else
  if new.id<>old.id or new.owner_id<>old.owner_id or new.version<>old.version+1 then raise exception using errcode='22023',message='Invalid template version'; end if;
  new.created_at:=old.created_at;
 end if;
 new.updated_at:=now();return new;
end;
$$;
create trigger maintenance_template_version before insert or update on public.maintenance_templates
for each row execute function public.maintenance_template_version();
create function public.save_custom_template(p_definition jsonb) returns public.maintenance_templates
language plpgsql security invoker set search_path='' as $$
declare result public.maintenance_templates; target uuid;
begin
 if not public.custom_template_valid(p_definition) then raise exception using errcode='22023',message='Invalid template'; end if;
 target:=(p_definition->>'id')::uuid;
 select * into result from public.maintenance_templates where id=target and owner_id=(select auth.uid()) for update;
 if found then
  if result.version<>(p_definition->>'version')::integer then raise exception using errcode='PT409',message='Template changed'; end if;
  update public.maintenance_templates set version=version+1,title=p_definition->>'title',definition=jsonb_set(p_definition,'{version}',to_jsonb(result.version+1)) where id=target and owner_id=(select auth.uid()) returning * into result;
 else
  insert into public.maintenance_templates(id,owner_id,version,title,definition) values(target,(select auth.uid()),(p_definition->>'version')::integer,p_definition->>'title',p_definition) returning * into result;
 end if;
 return result;
end;
$$;
revoke all on function public.custom_template_valid(jsonb),public.maintenance_template_version(),public.save_custom_template(jsonb) from public,anon;
grant execute on function public.custom_template_valid(jsonb),public.save_custom_template(jsonb) to authenticated;

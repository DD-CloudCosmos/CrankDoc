-- Validated transitions and cleanup are server-only. Owner clients read and upload pending sources.
revoke insert,update,delete on public.garage_files from authenticated;
grant all on public.garage_files to service_role;
revoke execute on function public.attach_garage_file(jsonb),public.begin_garage_cleanup(uuid,uuid),public.begin_file_removal(uuid),public.restore_garage_image(uuid) from authenticated,anon,public;
create table public.garage_file_states (
 id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,
 bike_id uuid not null,job_id uuid,kind text not null check(kind in ('bike_photo','receipt')),
 path text not null unique,state text not null check(state in ('pending','finalizing','active','removing','removed')),
 check((kind='bike_photo' and job_id is null and path=owner_id::text||'/bikes/'||bike_id::text||'/'||id::text||'.webp') or
 (kind='receipt' and job_id is not null and path ~ ('^'||owner_id::text||'/jobs/'||job_id::text||'/'||id::text||'\.(jpg|png|webp|pdf)$')))
);
alter table public.garage_file_states enable row level security;
grant select on public.garage_file_states to authenticated;
grant all on public.garage_file_states to service_role;
create policy garage_file_states_owner on public.garage_file_states for select to authenticated using(owner_id=(select auth.uid()));
insert into public.garage_file_states(id,owner_id,bike_id,job_id,kind,path,state)
 select id,owner_id,bike_id,job_id,kind,path,case when cleanup_pending then 'removing' else 'active' end from public.garage_files;

create function public.lock_garage_file_target(p_owner_id uuid,p_bike_id uuid,p_job_id uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 if current_user<>'service_role' then raise insufficient_privilege;end if;
 perform 1 from public.garage_bikes where owner_id=p_owner_id and id=p_bike_id for update;
 if not found then raise sqlstate 'PT404' using message='File target not found';end if;
 if p_job_id is not null then
  perform 1 from public.maintenance_jobs where owner_id=p_owner_id and bike_id=p_bike_id and id=p_job_id for update;
  if not found then raise sqlstate 'PT404' using message='File target not found';end if;
 end if;
end $$;
create function public.begin_garage_finalisation(p_owner_id uuid,p_input jsonb) returns text language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_file_states;v_id uuid=(p_input->>'id')::uuid;v_bike uuid=(p_input->>'bikeId')::uuid;v_job uuid=(p_input->>'jobId')::uuid;
begin
 perform public.lock_garage_file_target(p_owner_id,v_bike,v_job);
 if exists(select 1 from public.garage_bikes where id=v_bike and file_cleanup_pending) or exists(select 1 from public.maintenance_jobs where id=v_job and file_cleanup_pending) then
  raise sqlstate 'PT409' using message='Removal needs cleanup';end if;
 select * into v_file from public.garage_file_states where id=v_id for update;
 if found then
  if v_file.owner_id<>p_owner_id or v_file.bike_id<>v_bike or v_file.job_id is distinct from v_job or v_file.kind<>p_input->>'kind' or v_file.path<>p_input->>'path' or v_file.state in ('removing','removed') then
   raise sqlstate 'PT404' using message='File target not found';end if;
  if v_file.state='active' then return 'active';end if;
  update public.garage_file_states set state='finalizing' where id=v_id;
 else
  insert into public.garage_file_states(id,owner_id,bike_id,job_id,kind,path,state) values(v_id,p_owner_id,v_bike,v_job,p_input->>'kind',p_input->>'path','finalizing');
 end if;
 return 'finalizing';
end $$;
create function public.release_garage_finalisation(p_owner_id uuid,p_file_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_file_states;
begin
 select * into v_file from public.garage_file_states where id=p_file_id and owner_id=p_owner_id;
 if not found then return;end if;
 perform public.lock_garage_file_target(p_owner_id,v_file.bike_id,v_file.job_id);
 update public.garage_file_states set state='pending' where id=p_file_id and owner_id=p_owner_id and state='finalizing'
 and not exists(select 1 from storage.objects where name=v_file.path and bucket_id=case when v_file.kind='bike_photo' then 'garage-photos' else 'garage-receipts' end)
 and not exists(select 1 from public.garage_files where id=p_file_id);
end $$;

create or replace function public.guard_garage_file() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform public.lock_garage_file_target(new.owner_id,new.bike_id,new.job_id);
 if not exists(select 1 from public.garage_file_states where id=new.id and owner_id=new.owner_id and bike_id=new.bike_id and job_id is not distinct from new.job_id and kind=new.kind and path=new.path and state='finalizing') then
  raise sqlstate 'PT404' using message='File transition not found';end if;
 if new.kind='receipt' and (select count(*) from public.garage_files where owner_id=new.owner_id and job_id=new.job_id)>=10 then
  raise sqlstate 'PT409' using message='At most ten receipts per job';end if;
 return new;
end $$;
create function public.attach_garage_file(p_owner_id uuid,p_input jsonb) returns public.garage_files language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_files;v_bike public.garage_bikes;v_job public.maintenance_jobs;
 v_id uuid=(p_input->>'id')::uuid;v_bike_id uuid=(p_input->>'bikeId')::uuid;v_job_id uuid=(p_input->>'jobId')::uuid;
begin
 perform public.lock_garage_file_target(p_owner_id,v_bike_id,v_job_id);
 if not exists(select 1 from public.garage_file_states where id=v_id and owner_id=p_owner_id and state in ('finalizing','active')) then raise sqlstate 'PT404' using message='File target not found';end if;
 select * into v_bike from public.garage_bikes where id=v_bike_id and owner_id=p_owner_id for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 if v_bike.file_cleanup_pending then raise sqlstate 'PT409' using message='Bike removal needs cleanup';end if;
 if v_job_id is not null then
  select * into v_job from public.maintenance_jobs where id=v_job_id and bike_id=v_bike_id and owner_id=p_owner_id for update;
  if not found then raise sqlstate 'PT404' using message='Job not found';end if;
  if v_job.file_cleanup_pending then raise sqlstate 'PT409' using message='Job removal needs cleanup';end if;
 end if;
 select * into v_file from public.garage_files where id=v_id and owner_id=p_owner_id;
 if found then
  if v_file.bike_id<>v_bike_id or v_file.job_id is distinct from v_job_id or v_file.kind<>p_input->>'kind' or v_file.path<>p_input->>'path' or v_file.cleanup_pending then
   raise sqlstate 'PT409' using message='File identifier already used';end if;
  return v_file;
 end if;
 if p_input->>'kind'='bike_photo' then
  update public.garage_file_states set state='removing' where bike_id=v_bike_id and owner_id=p_owner_id and kind='bike_photo' and state='active';
  update public.garage_files set cleanup_pending=true where bike_id=v_bike_id and owner_id=p_owner_id and kind='bike_photo';
 end if;
 insert into public.garage_files(id,owner_id,bike_id,job_id,kind,path,filename,source_pending)
 values(v_id,p_owner_id,v_bike_id,v_job_id,p_input->>'kind',p_input->>'path',p_input->>'filename',true) returning * into v_file;
 if v_file.kind='bike_photo' then update public.garage_bikes set photo_path=v_file.path where id=v_bike_id and owner_id=p_owner_id;end if;
 update public.garage_file_states set state='active' where id=v_id and owner_id=p_owner_id;
 return v_file;
end $$;

create function public.begin_garage_cleanup(p_owner_id uuid,p_bike_id uuid,p_job_id uuid default null) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if current_user<>'service_role' then raise insufficient_privilege;end if;
 perform 1 from public.garage_bikes where id=p_bike_id and owner_id=p_owner_id for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 if p_job_id is null then
  update public.garage_bikes set file_cleanup_pending=true where id=p_bike_id and owner_id=p_owner_id;
 else
  perform 1 from public.maintenance_jobs where id=p_job_id and bike_id=p_bike_id and owner_id=p_owner_id for update;
  if not found then raise sqlstate 'PT404' using message='Job not found';end if;
  update public.maintenance_jobs set file_cleanup_pending=true where id=p_job_id and owner_id=p_owner_id;
 end if;
 update public.garage_file_states set state='removing' where bike_id=p_bike_id and owner_id=p_owner_id and (p_job_id is null or job_id=p_job_id) and state<>'removed';
 update public.garage_files set cleanup_pending=true where bike_id=p_bike_id and owner_id=p_owner_id and (p_job_id is null or job_id=p_job_id);
 return true;
end $$;
create function public.begin_file_removal(p_owner_id uuid,p_file_id uuid) returns public.garage_files language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_files;
begin
 if current_user<>'service_role' then raise insufficient_privilege;end if;
 select * into v_file from public.garage_files where id=p_file_id and owner_id=p_owner_id;
 if not found then raise sqlstate 'PT404' using message='File not found';end if;
 perform 1 from public.garage_bikes where id=v_file.bike_id and owner_id=p_owner_id for update;
 if v_file.job_id is not null then perform 1 from public.maintenance_jobs where id=v_file.job_id and owner_id=p_owner_id for update;end if;
 update public.garage_file_states set state='removing' where id=p_file_id and owner_id=p_owner_id;
 update public.garage_files set cleanup_pending=true where id=p_file_id and owner_id=p_owner_id returning * into v_file;
 if not found then raise sqlstate 'PT404' using message='File not found';end if;
 update public.garage_bikes set photo_path=null where id=v_file.bike_id and owner_id=p_owner_id and photo_path=v_file.path;
 return v_file;
end $$;
create function public.restore_garage_image(p_owner_id uuid,p_bike_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if current_user<>'service_role' then raise insufficient_privilege;end if;
 perform 1 from public.garage_bikes where id=p_bike_id and owner_id=p_owner_id for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 update public.garage_bikes set photo_path=null where id=p_bike_id and owner_id=p_owner_id;
 update public.garage_file_states set state='removing' where bike_id=p_bike_id and owner_id=p_owner_id and kind='bike_photo' and state<>'removed';
 update public.garage_files set cleanup_pending=true where bike_id=p_bike_id and owner_id=p_owner_id and kind='bike_photo';
 return true;
end $$;

create function public.finish_garage_file_removal(p_owner_id uuid,p_file_id uuid) returns void language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_file_states;
begin
 if current_user<>'service_role' then raise insufficient_privilege;end if;
 select * into v_file from public.garage_file_states where id=p_file_id and owner_id=p_owner_id;
 if not found then raise sqlstate 'PT404' using message='File not found';end if;
 perform public.lock_garage_file_target(p_owner_id,v_file.bike_id,v_file.job_id);
 update public.garage_file_states set state='removed' where id=p_file_id and owner_id=p_owner_id and state='removing';
 delete from public.garage_files where id=p_file_id and owner_id=p_owner_id and cleanup_pending and exists(select 1 from public.garage_file_states where id=p_file_id and state='removed');
end $$;

create or replace function public.garage_upload_allowed(p_name text,p_bucket text) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_parts text[]=string_to_array(p_name,'/');v_bike public.garage_bikes;v_job public.maintenance_jobs;v_id uuid;v_state text;
begin
 if v_parts[1] is distinct from (select auth.uid())::text or array_length(v_parts,1)<>4 then return false;end if;
 if p_bucket='garage-photos' then
  if v_parts[2]<>'bikes' or v_parts[4]!~'^[0-9a-f-]{36}\.source$' then return false;end if;
  select * into v_bike from public.garage_bikes where id=v_parts[3]::uuid and owner_id=(select auth.uid()) for update;
  if not found or v_bike.file_cleanup_pending then return false;end if;
 elsif p_bucket='garage-receipts' then
  if v_parts[2]<>'jobs' or v_parts[4]!~'^[0-9a-f-]{36}\.(jpg|png|webp|pdf)\.source$' then return false;end if;
  select * into v_job from public.maintenance_jobs where id=v_parts[3]::uuid and owner_id=(select auth.uid());
  if not found then return false;end if;
  select * into v_bike from public.garage_bikes where id=v_job.bike_id and owner_id=(select auth.uid()) for update;
  if not found or v_bike.file_cleanup_pending then return false;end if;
  select * into v_job from public.maintenance_jobs where id=v_parts[3]::uuid and owner_id=(select auth.uid()) for update;
  if not found or v_job.file_cleanup_pending then return false;end if;
 else return false;end if;
 v_id=split_part(v_parts[4],'.',1)::uuid;
 select state into v_state from public.garage_file_states where id=v_id and owner_id=(select auth.uid());
 return not found or v_state='pending';
exception when invalid_text_representation then return false;
end $$;
alter policy garage_storage_delete on storage.objects using
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text and public.garage_upload_allowed(name,bucket_id));

create function public.guard_garage_storage_write() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_file_states;v_id uuid;
begin
 if new.bucket_id not in ('garage-photos','garage-receipts') then return new;end if;
 if new.name ~ '\.source$' then return new;end if;
 if current_user<>'service_role' or tg_op='UPDATE' then raise insufficient_privilege using message='Final files are immutable server writes';end if;
 v_id=split_part(split_part(new.name,'/',4),'.',1)::uuid;
 select * into v_file from public.garage_file_states where id=v_id and path=new.name;
 if not found then raise insufficient_privilege using message='File transition not found';end if;
 perform public.lock_garage_file_target(v_file.owner_id,v_file.bike_id,v_file.job_id);
 select * into v_file from public.garage_file_states where id=v_id for update;
 if v_file.state<>'finalizing' or exists(select 1 from public.garage_bikes where id=v_file.bike_id and file_cleanup_pending) or exists(select 1 from public.maintenance_jobs where id=v_file.job_id and file_cleanup_pending) then
  raise insufficient_privilege using message='File transition no longer active';end if;
 return new;
end $$;
create trigger guard_garage_storage_write before insert or update of name,bucket_id,metadata on storage.objects for each row execute function public.guard_garage_storage_write();

create function public.guard_garage_private_fields() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user<>'service_role' then
  if tg_op='INSERT' then
   if new.file_cleanup_pending or (tg_table_name='garage_bikes' and to_jsonb(new)->>'photo_path' is not null) then raise insufficient_privilege;end if;
  elsif new.file_cleanup_pending is distinct from old.file_cleanup_pending or (tg_table_name='garage_bikes' and to_jsonb(new)->>'photo_path' is distinct from to_jsonb(old)->>'photo_path') then
   raise insufficient_privilege using message='Private file transitions are server-only';
  end if;
 end if;
 return new;
end $$;
create trigger guard_garage_bike_private_fields before insert or update on public.garage_bikes for each row execute function public.guard_garage_private_fields();
create trigger guard_garage_job_private_fields before insert or update on public.maintenance_jobs for each row execute function public.guard_garage_private_fields();
revoke execute on function public.lock_garage_file_target(uuid,uuid,uuid),public.begin_garage_finalisation(uuid,jsonb),public.release_garage_finalisation(uuid,uuid),public.attach_garage_file(uuid,jsonb),public.begin_garage_cleanup(uuid,uuid,uuid),public.begin_file_removal(uuid,uuid),public.restore_garage_image(uuid,uuid),public.finish_garage_file_removal(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lock_garage_file_target(uuid,uuid,uuid),public.begin_garage_finalisation(uuid,jsonb),public.release_garage_finalisation(uuid,uuid),public.attach_garage_file(uuid,jsonb),public.begin_garage_cleanup(uuid,uuid,uuid),public.begin_file_removal(uuid,uuid),public.restore_garage_image(uuid,uuid),public.finish_garage_file_removal(uuid,uuid) to service_role;
revoke execute on function public.guard_garage_storage_write(),public.guard_garage_private_fields() from public,anon,authenticated;

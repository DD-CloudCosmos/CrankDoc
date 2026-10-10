-- Private files use owner paths. Pending cleanup keeps references until Storage succeeds.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('garage-photos','garage-photos',false,10485760,array['image/jpeg','image/png','image/webp']),
 ('garage-receipts','garage-receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy garage_storage_select on storage.objects for select to authenticated using
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy garage_storage_insert on storage.objects for insert to authenticated with check
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy garage_storage_update on storage.objects for update to authenticated using
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text) with check
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy garage_storage_delete on storage.objects for delete to authenticated using
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text);

alter table public.garage_bikes add column file_cleanup_pending boolean not null default false;
alter table public.maintenance_jobs add column file_cleanup_pending boolean not null default false;
alter table public.maintenance_jobs add constraint maintenance_jobs_owner_bike_id_unique unique(owner_id,bike_id,id);
create table public.garage_files (
 id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,
 bike_id uuid not null,job_id uuid,kind text not null check(kind in ('bike_photo','receipt')),
 path text not null unique,filename text not null check(length(filename) between 1 and 255),
 created_at timestamptz not null default now(),cleanup_pending boolean not null default false,
 source_pending boolean not null default false,
 foreign key(owner_id,bike_id) references public.garage_bikes(owner_id,id),
 foreign key(owner_id,bike_id,job_id) references public.maintenance_jobs(owner_id,bike_id,id),
 check((kind='bike_photo' and job_id is null and path=owner_id::text||'/bikes/'||bike_id::text||'/'||id::text||'.webp') or
  (kind='receipt' and job_id is not null and path ~ ('^'||owner_id::text||'/jobs/'||job_id::text||'/'||id::text||'\.(jpg|png|webp|pdf)$')))
);
alter table public.garage_files enable row level security;
grant select,insert,update,delete on public.garage_files to authenticated;
create policy garage_files_owner on public.garage_files for all to authenticated
 using ((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create index garage_files_bike on public.garage_files(owner_id,bike_id);
create index garage_files_job on public.garage_files(owner_id,job_id);
create unique index garage_files_active_photo on public.garage_files(owner_id,bike_id) where kind='bike_photo' and not cleanup_pending;

-- The trigger also protects callers inserting via the Data API. Every attach takes bike then job.
create function public.guard_garage_file() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_bike public.garage_bikes;v_job public.maintenance_jobs;
begin
 select * into v_bike from public.garage_bikes where id=new.bike_id and owner_id=(select auth.uid()) for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 if v_bike.file_cleanup_pending then raise sqlstate 'PT409' using message='Bike removal needs cleanup';end if;
 if new.kind='receipt' then
  select * into v_job from public.maintenance_jobs where id=new.job_id and bike_id=new.bike_id and owner_id=(select auth.uid()) for update;
  if not found then raise sqlstate 'PT404' using message='Job not found';end if;
  if v_job.file_cleanup_pending then raise sqlstate 'PT409' using message='Job removal needs cleanup';end if;
  if (select count(*) from public.garage_files where job_id=new.job_id and owner_id=(select auth.uid()))>=10 then
   raise sqlstate 'PT409' using message='At most ten receipts per job';end if;
 end if;
 return new;
end $$;
create trigger guard_garage_file before insert on public.garage_files for each row execute function public.guard_garage_file();

create function public.attach_garage_file(p_input jsonb) returns public.garage_files language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_files;v_bike public.garage_bikes;v_job public.maintenance_jobs;
 v_id uuid=(p_input->>'id')::uuid;v_bike_id uuid=(p_input->>'bikeId')::uuid;v_job_id uuid=(p_input->>'jobId')::uuid;
begin
 select * into v_bike from public.garage_bikes where id=v_bike_id and owner_id=(select auth.uid()) for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 if v_bike.file_cleanup_pending then raise sqlstate 'PT409' using message='Bike removal needs cleanup';end if;
 if v_job_id is not null then
  select * into v_job from public.maintenance_jobs where id=v_job_id and bike_id=v_bike_id and owner_id=(select auth.uid()) for update;
  if not found then raise sqlstate 'PT404' using message='Job not found';end if;
  if v_job.file_cleanup_pending then raise sqlstate 'PT409' using message='Job removal needs cleanup';end if;
 end if;
 select * into v_file from public.garage_files where id=v_id and owner_id=(select auth.uid());
 if found then
  if v_file.bike_id<>v_bike_id or v_file.job_id is distinct from v_job_id or v_file.kind<>p_input->>'kind' or v_file.path<>p_input->>'path' or v_file.cleanup_pending then
   raise sqlstate 'PT409' using message='File identifier already used';end if;
  return v_file;
 end if;
 if p_input->>'kind'='bike_photo' then
  update public.garage_files set cleanup_pending=true where bike_id=v_bike_id and owner_id=(select auth.uid()) and kind='bike_photo';
 end if;
 insert into public.garage_files(id,owner_id,bike_id,job_id,kind,path,filename,source_pending)
 values(v_id,(select auth.uid()),v_bike_id,v_job_id,p_input->>'kind',p_input->>'path',p_input->>'filename',p_input->>'kind'='bike_photo') returning * into v_file;
 if v_file.kind='bike_photo' then update public.garage_bikes set photo_path=v_file.path where id=v_bike_id and owner_id=(select auth.uid());end if;
 return v_file;
end $$;

create function public.begin_garage_cleanup(p_bike_id uuid,p_job_id uuid default null) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.garage_bikes where id=p_bike_id and owner_id=(select auth.uid()) for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 if p_job_id is null then
  update public.garage_bikes set file_cleanup_pending=true where id=p_bike_id and owner_id=(select auth.uid());
 else
  perform 1 from public.maintenance_jobs where id=p_job_id and bike_id=p_bike_id and owner_id=(select auth.uid()) for update;
  if not found then raise sqlstate 'PT404' using message='Job not found';end if;
  update public.maintenance_jobs set file_cleanup_pending=true where id=p_job_id and owner_id=(select auth.uid());
 end if;
 update public.garage_files set cleanup_pending=true where bike_id=p_bike_id and owner_id=(select auth.uid()) and (p_job_id is null or job_id=p_job_id);
 return true;
end $$;
create function public.begin_file_removal(p_file_id uuid) returns public.garage_files language plpgsql security invoker set search_path='' as $$
declare v_file public.garage_files;
begin
 select * into v_file from public.garage_files where id=p_file_id and owner_id=(select auth.uid());
 if not found then raise sqlstate 'PT404' using message='File not found';end if;
 perform 1 from public.garage_bikes where id=v_file.bike_id and owner_id=(select auth.uid()) for update;
 if v_file.job_id is not null then perform 1 from public.maintenance_jobs where id=v_file.job_id and owner_id=(select auth.uid()) for update;end if;
 update public.garage_files set cleanup_pending=true where id=p_file_id and owner_id=(select auth.uid()) returning * into v_file;
 if not found then raise sqlstate 'PT404' using message='File not found';end if;
 update public.garage_bikes set photo_path=null where id=v_file.bike_id and owner_id=(select auth.uid()) and photo_path=v_file.path;
 return v_file;
end $$;
create function public.restore_garage_image(p_bike_id uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.garage_bikes where id=p_bike_id and owner_id=(select auth.uid()) for update;
 if not found then raise sqlstate 'PT404' using message='Bike not found';end if;
 update public.garage_bikes set photo_path=null where id=p_bike_id and owner_id=(select auth.uid());
 update public.garage_files set cleanup_pending=true where bike_id=p_bike_id and owner_id=(select auth.uid()) and kind='bike_photo';
 return true;
end $$;
revoke execute on function public.guard_garage_file(),public.attach_garage_file(jsonb),public.begin_garage_cleanup(uuid,uuid),public.begin_file_removal(uuid),public.restore_garage_image(uuid) from public,anon;
grant execute on function public.guard_garage_file(),public.attach_garage_file(jsonb),public.begin_garage_cleanup(uuid,uuid),public.begin_file_removal(uuid),public.restore_garage_image(uuid) to authenticated;

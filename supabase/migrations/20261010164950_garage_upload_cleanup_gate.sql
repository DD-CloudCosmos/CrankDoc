-- Uploads share the same bike-before-job locks as attachment and deletion.
-- After a removal gate commits, no new pending objects can enter its prefixes.
create function public.garage_upload_allowed(p_name text,p_bucket text) returns boolean language plpgsql security invoker set search_path='' as $$
declare v_parts text[]=string_to_array(p_name,'/');v_bike public.garage_bikes;v_job public.maintenance_jobs;
begin
 if v_parts[1] is distinct from (select auth.uid())::text or array_length(v_parts,1)<>4 then return false;end if;
 if p_bucket='garage-photos' then
  if v_parts[2]<>'bikes' or v_parts[4]!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(source|webp)$' then return false;end if;
  select * into v_bike from public.garage_bikes where id=v_parts[3]::uuid and owner_id=(select auth.uid()) for update;
  return found and not v_bike.file_cleanup_pending;
 elsif p_bucket='garage-receipts' then
  if v_parts[2]<>'jobs' or v_parts[4]!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$' then return false;end if;
  select * into v_job from public.maintenance_jobs where id=v_parts[3]::uuid and owner_id=(select auth.uid());
  if not found then return false;end if;
  select * into v_bike from public.garage_bikes where id=v_job.bike_id and owner_id=(select auth.uid()) for update;
  if not found or v_bike.file_cleanup_pending then return false;end if;
  select * into v_job from public.maintenance_jobs where id=v_parts[3]::uuid and owner_id=(select auth.uid()) for update;
  return found and not v_job.file_cleanup_pending;
 end if;
 return false;
exception when invalid_text_representation then return false;
end $$;
revoke execute on function public.garage_upload_allowed(text,text) from public,anon;
grant execute on function public.garage_upload_allowed(text,text) to authenticated;
alter policy garage_storage_insert on storage.objects with check
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text and public.garage_upload_allowed(name,bucket_id));
alter policy garage_storage_update on storage.objects with check
 (bucket_id in ('garage-photos','garage-receipts') and (storage.foldername(name))[1]=(select auth.uid())::text and public.garage_upload_allowed(name,bucket_id));

-- File identities cannot be moved to bypass the ten-file lock/count invariant.
create function public.guard_garage_file_identity() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if row(new.id,new.owner_id,new.bike_id,new.job_id,new.kind,new.path) is distinct from row(old.id,old.owner_id,old.bike_id,old.job_id,old.kind,old.path) then
  raise check_violation using message='File identity cannot change';
 end if;
 return new;
end $$;
revoke execute on function public.guard_garage_file_identity() from public,anon;
grant execute on function public.guard_garage_file_identity() to authenticated;
create trigger guard_garage_file_identity before update on public.garage_files for each row execute function public.guard_garage_file_identity();

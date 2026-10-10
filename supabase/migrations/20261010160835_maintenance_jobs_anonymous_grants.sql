-- Local Supabase default table grants include anon; private jobs expose no anonymous API.
revoke all on public.maintenance_jobs from anon;

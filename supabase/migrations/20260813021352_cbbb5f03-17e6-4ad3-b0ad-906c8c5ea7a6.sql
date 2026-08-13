alter table public.profiles
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists semester_id uuid references public.semesters(id) on delete set null,
  add column if not exists profile_completed boolean not null default false;

update public.profiles set profile_completed = true
where profile_completed = false and coalesce(name,'') <> '' and coalesce(roll_number,'') <> '';

create or replace function public.directory_students()
returns table (
  id uuid,
  name text,
  avatar_url text,
  roll_number text,
  subject text,
  subject_id uuid,
  semester_id uuid,
  role public.app_role
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.avatar_url, p.roll_number, p.subject, p.subject_id, p.semester_id, p.role
  from public.profiles p
  where auth.uid() is not null
    and p.is_active
    and p.profile_completed
$$;

revoke all on function public.directory_students() from public;
grant execute on function public.directory_students() to authenticated;

drop policy if exists "branding read" on storage.objects;
create policy "branding read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding owner insert" on storage.objects;
create policy "branding owner insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'branding' and public.has_role(auth.uid(), 'owner'));

drop policy if exists "branding owner update" on storage.objects;
create policy "branding owner update" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding' and public.has_role(auth.uid(), 'owner'))
  with check (bucket_id = 'branding' and public.has_role(auth.uid(), 'owner'));

drop policy if exists "branding owner delete" on storage.objects;
create policy "branding owner delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'branding' and public.has_role(auth.uid(), 'owner'));

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
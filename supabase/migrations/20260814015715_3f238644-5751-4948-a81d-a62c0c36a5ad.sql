create type public.notif_type as enum ('announcement','important','update','material','event');
create type public.notif_audience as enum ('all_users','all_students','semester','subject');
create type public.notif_status as enum ('draft','published');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  image_path text,
  type public.notif_type not null default 'announcement',
  button_text text,
  action_url text,
  audience public.notif_audience not null default 'all_users',
  semester_id uuid references public.semesters(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  status public.notif_status not null default 'draft',
  priority integer not null default 0,
  auto_popup boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

create policy "read targeted notifications" on public.notifications
for select to authenticated
using (
  public.is_staff(auth.uid())
  or (
    status = 'published'
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
    and (
      audience = 'all_users'
      or (audience = 'all_students' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active))
      or (audience = 'semester' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.semester_id = notifications.semester_id))
      or (audience = 'subject' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.subject_id = notifications.subject_id))
    )
  )
);

create policy "staff create notifications" on public.notifications
for insert to authenticated
with check (public.is_staff(auth.uid()) and created_by = auth.uid());

create policy "staff update notifications" on public.notifications
for update to authenticated
using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "staff delete notifications" on public.notifications
for delete to authenticated
using (public.is_staff(auth.uid()));

create trigger notifications_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  seen_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (notification_id, user_id)
);

grant select, insert, update on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;
alter table public.notification_reads enable row level security;

create policy "read own notification reads" on public.notification_reads
for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create policy "insert own notification reads" on public.notification_reads
for insert to authenticated with check (user_id = auth.uid());

create policy "update own notification reads" on public.notification_reads
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.directory_students()
returns table(id uuid, name text, avatar_url text, roll_number text, subject text, subject_id uuid, semester_id uuid, role public.app_role)
language sql stable security definer set search_path to 'public'
as $function$
  select p.id, p.name, p.avatar_url, p.roll_number, p.subject, p.subject_id, p.semester_id, p.role
  from public.profiles p
  where auth.uid() is not null
    and p.is_active
    and p.profile_completed
    and p.role <> 'owner'
$function$;
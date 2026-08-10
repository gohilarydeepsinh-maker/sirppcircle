-- ENUMS
create type public.app_role as enum ('student','captain','admin','owner');
create type public.doc_status as enum ('pending','approved','rejected');

-- UPDATED_AT helper
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text,
  avatar_url text,
  subject text,
  roll_number text,
  role public.app_role not null default 'student',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ROLE HELPERS
create or replace function public.role_of(_uid uuid)
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = _uid and is_active
$$;

create or replace function public.has_role(_uid uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and role = _role and is_active)
$$;

create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and is_active and role in ('admin','owner'))
$$;

create or replace function public.can_upload(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _uid and is_active and role in ('captain','admin','owner'))
$$;

-- PROFILE PROTECTION
create or replace function public.protect_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare actor public.app_role;
begin
  if auth.uid() is null then return new; end if; -- trusted server context
  if tg_op = 'INSERT' then
    if lower(coalesce(new.email,'')) = 'gohilarydeepsinh@gmail.com' then
      new.role := 'owner';
    else
      new.role := 'student';
    end if;
    new.is_active := true;
    return new;
  end if;
  select role into actor from public.profiles where id = auth.uid() and is_active;
  if new.role <> old.role or new.is_active <> old.is_active then
    if actor is null or actor not in ('admin','owner') then
      raise exception 'You do not have permission to change roles or account status';
    end if;
    if actor = 'admin' and (old.role = 'owner' or new.role in ('admin','owner')) then
      raise exception 'Admins cannot manage admins or the owner';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_protect before insert or update on public.profiles
  for each row execute function public.protect_profile();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "insert own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "staff update profiles" on public.profiles for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ACADEMIC STRUCTURE
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.units (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subjects_semester_idx on public.subjects(semester_id);
create index units_subject_idx on public.units(subject_id);
create index topics_unit_idx on public.topics(unit_id);

create trigger semesters_updated_at before update on public.semesters for each row execute function public.set_updated_at();
create trigger subjects_updated_at before update on public.subjects for each row execute function public.set_updated_at();
create trigger units_updated_at before update on public.units for each row execute function public.set_updated_at();
create trigger topics_updated_at before update on public.topics for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.semesters to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.units to authenticated;
grant select, insert, update, delete on public.topics to authenticated;
grant all on public.semesters to service_role;
grant all on public.subjects to service_role;
grant all on public.units to service_role;
grant all on public.topics to service_role;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.topics enable row level security;

create policy "read semesters" on public.semesters for select to authenticated using (true);
create policy "staff manage semesters" on public.semesters for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "read subjects" on public.subjects for select to authenticated using (true);
create policy "staff manage subjects" on public.subjects for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "read units" on public.units for select to authenticated using (true);
create policy "staff manage units" on public.units for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "read topics" on public.topics for select to authenticated using (true);
create policy "staff manage topics" on public.topics for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- DOCUMENTS
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  mime_type text not null,
  file_size bigint not null default 0,
  status public.doc_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index documents_topic_idx on public.documents(topic_id);
create index documents_status_idx on public.documents(status);
create index documents_filters_idx on public.documents(semester_id, subject_id, unit_id, topic_id);
create index documents_created_idx on public.documents(created_at desc);
create trigger documents_updated_at before update on public.documents for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.documents to authenticated;
grant all on public.documents to service_role;
alter table public.documents enable row level security;

create policy "read approved documents" on public.documents for select to authenticated
  using (status = 'approved' or uploaded_by = auth.uid() or public.is_staff(auth.uid()));
create policy "uploaders create documents" on public.documents for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.can_upload(auth.uid())
    and (
      public.is_staff(auth.uid()) and status in ('approved','pending')
      or (not public.is_staff(auth.uid())) and status = 'pending'
    )
  );
create policy "staff update documents" on public.documents for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "staff delete documents" on public.documents for delete to authenticated
  using (public.is_staff(auth.uid()));
create policy "owners delete own pending documents" on public.documents for delete to authenticated
  using (uploaded_by = auth.uid() and status = 'pending');

-- ACTIVITY LOGS
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_created_idx on public.activity_logs(created_at desc);
grant select, insert on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "staff read logs" on public.activity_logs for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "any user writes own log" on public.activity_logs for insert to authenticated
  with check (actor_id = auth.uid());
-- scheduled_messages table
create table if not exists public.scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  message text not null,
  scheduled_time timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_messages_pending_time
  on public.scheduled_messages(status, scheduled_time)
  where status = 'pending';

create index if not exists idx_scheduled_messages_patient_id
  on public.scheduled_messages(patient_id);

-- patient_completions table
create table if not exists public.patient_completions (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  chat_id text,
  patient_name text,
  phone text,
  completion_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_completions_patient_id_date
  on public.patient_completions(patient_id, completion_date desc);

-- updated_at trigger helper (reuse if exists)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_scheduled_messages_updated_at on public.scheduled_messages;
create trigger trg_scheduled_messages_updated_at
before update on public.scheduled_messages
for each row
execute function public.set_updated_at();

-- Optional RLS setup
alter table public.scheduled_messages enable row level security;
alter table public.patient_completions enable row level security;

-- Service role full access policies
drop policy if exists "service_role_all_scheduled_messages" on public.scheduled_messages;
create policy "service_role_all_scheduled_messages"
on public.scheduled_messages
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_all_patient_completions" on public.patient_completions;
create policy "service_role_all_patient_completions"
on public.patient_completions
for all
to service_role
using (true)
with check (true);

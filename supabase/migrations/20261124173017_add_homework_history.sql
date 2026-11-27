create table public.homework_history (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  subject text not null,
  image_url text,
  steps jsonb not null default '[]'::jsonb,
  hint text,
  created_at timestamptz not null default now(),
  constraint homework_history_subject_check check (subject in ('math', 'sci', 'eng'))
);

create index homework_history_device_created_idx
  on public.homework_history (device_id, created_at desc);

alter table public.homework_history enable row level security;

create policy "homework_history_select_anon"
  on public.homework_history for select
  to anon, authenticated
  using (true);

create policy "homework_history_insert_anon"
  on public.homework_history for insert
  to anon, authenticated
  with check (true);

create policy "homework_history_update_anon"
  on public.homework_history for update
  to anon, authenticated
  using (true) with check (true);

create policy "homework_history_delete_anon"
  on public.homework_history for delete
  to anon, authenticated
  using (true);

create policy "homework_images_insert_anon"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'homework_images');

create policy "homework_images_select_anon"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'homework_images');

create policy "homework_images_delete_anon"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'homework_images');

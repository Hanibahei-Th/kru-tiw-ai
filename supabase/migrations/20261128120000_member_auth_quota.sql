alter table public.homework_history add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists homework_history_owner_created_idx on public.homework_history(owner_id, created_at desc);

drop policy if exists homework_history_select_anon on public.homework_history;
drop policy if exists homework_history_insert_anon on public.homework_history;
drop policy if exists homework_history_update_anon on public.homework_history;
drop policy if exists homework_history_delete_anon on public.homework_history;
create policy homework_history_select_owner on public.homework_history for select to authenticated using (owner_id = (select auth.uid()));
create policy homework_history_delete_owner on public.homework_history for delete to authenticated using (owner_id = (select auth.uid()));

-- Old device-id rows remain in place but are deliberately inaccessible until safely associated with an account.
update storage.buckets set public = false where id = 'homework_images';
drop policy if exists homework_images_insert_anon on storage.objects;
drop policy if exists homework_images_select_anon on storage.objects;
drop policy if exists homework_images_delete_anon on storage.objects;
create policy homework_images_insert_owner on storage.objects for insert to authenticated with check (bucket_id = 'homework_images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy homework_images_select_owner on storage.objects for select to authenticated using (bucket_id = 'homework_images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy homework_images_delete_owner on storage.objects for delete to authenticated using (bucket_id = 'homework_images' and (storage.foldername(name))[1] = (select auth.uid())::text);

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null default (now() at time zone 'utc')::date,
  request_count integer not null default 0,
  primary key (user_id, usage_day)
);
alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from anon, authenticated;

create or replace function public.consume_ai_quota(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_guest boolean;
  v_count integer;
  v_limit integer;
begin
  select is_anonymous into v_guest from auth.users where id = p_user_id;
  if not found then raise exception 'Invalid user'; end if;
  v_limit := case when v_guest then 10 else 50 end;
  insert into public.ai_usage_daily(user_id, usage_day, request_count)
    values (p_user_id, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, usage_day) do update set request_count = public.ai_usage_daily.request_count + 1
    where public.ai_usage_daily.request_count < v_limit
    returning request_count into v_count;
  if v_count is null then
    select request_count into v_count from public.ai_usage_daily where user_id=p_user_id and usage_day=(now() at time zone 'utc')::date;
    return jsonb_build_object('allowed', false, 'count', v_count, 'limit', v_limit, 'login_required', v_guest);
  end if;
  return jsonb_build_object('allowed', true, 'count', v_count, 'limit', v_limit, 'login_required', false);
end $$;
revoke all on function public.consume_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;

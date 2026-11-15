# PLATO LAND – Series 3 Registration Capacity & Waitlist
**Technical preparation:** v0.2  
**Date:** 2026-11-15  
**Branch:** `feature/series3-registration-waitlist-20261115`  
**Base:** `main` at `c8abd61df33fc09611aed6d85629a9d405efb600`  
**Status:** Draft implementation on isolated branch; not merged, not deployed, no database changes applied.

## Approved business rules
- Main roster capacity is exactly 32 players.
- The public registration form remains open after the main roster reaches 32.
- Requests after capacity are accepted into the waitlist.
- Waitlist order is earliest `created_at` first; stable tie-breaker is registration UUID.
- When a main-roster player withdraws, the earliest eligible waitlisted player is considered for replacement.
- Registration opening and closing are controlled manually by the owner from the management panel; no date/time-based automatic opening or closing is authorized.
- When a main-roster player withdraws, the next waitlisted player is considered in chronological order, but promotion to the main roster requires the owner's manual confirmation.
- Scope is Series 3 only, within Temporary Projects. Series 2 and Main Website are excluded.

## Live baseline checked before implementation
- Repository: `Omidso82/Plato-land-preview`, default branch `main`.
- Base commit: `c8abd61df33fc09611aed6d85629a9d405efb600`.
- Live primary Supabase project: `dfrppbapaaydbjeflozw`.
- Table `public.plato_land_series3_registration_requests` currently has five columns: `id`, `plato_id`, generated `plato_id_normalized = lower(btrim(plato_id))`, `rules_accepted`, `created_at`.
- At inspection time: 23 requests and 23 unique normalized Plato IDs.
- Existing RLS permits public INSERT with `rules_accepted=true`; owner-only SELECT/UPDATE/DELETE policies exist.
- No table triggers or Series 3-specific functions were found.
- Existing implementation inserts directly from the browser and has no 32-player capacity or waitlist state.

## Proposed technical shape (NOT APPLIED)
1. Add `registration_status` with allowed values `main`, `waitlist`, `withdrawn`; existing 23 rows default to `main`.
2. Add an index on `(registration_status, created_at, id)`.
3. Replace public direct table INSERT with a narrowly scoped RPC `series3_register_request(p_plato_id text, p_rules_accepted boolean)`.
4. The RPC validates the current Plato ID format and explicit rules acceptance, serializes concurrent registrations with a transaction-scoped advisory lock, checks the generated normalized unique key, assigns `main` while fewer than 32 active main-roster rows exist, otherwise assigns `waitlist`, and returns status and queue position.
5. The public form calls only that RPC. It never writes directly to the table.
6. When the main roster reaches 32, the form remains available and accepts further eligible requests into the waitlist until the owner manually closes registration.
6. The owner report reads the new status field and shows main, waitlist and withdrawn counts. Waitlist rows are displayed in stable registration order.

## SQL proposal – review only
The following is a design draft, not a runnable migration file. A real migration version must be generated/reconciled using the approved Supabase CLI workflow and primary migration ledger before any application.

```sql
alter table public.plato_land_series3_registration_requests
  add column registration_status text not null default 'main'
  check (registration_status in ('main','waitlist','withdrawn'));

create index if not exists idx_series3_registration_status_order
  on public.plato_land_series3_registration_requests
  (registration_status, created_at, id);

drop policy if exists "Series 3 public registration insert"
  on public.plato_land_series3_registration_requests;

revoke insert on public.plato_land_series3_registration_requests
  from anon, authenticated;

create or replace function public.series3_register_request(p_plato_id text, p_rules_accepted boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_status text;
  v_created_at timestamptz;
  v_main_count integer;
  v_queue_position integer;
begin
  if p_plato_id is null
     or char_length(btrim(p_plato_id)) not between 2 and 30
     or btrim(p_plato_id) ~ '[^A-Za-z0-9_]' then
    raise exception 'Invalid Plato ID';
  end if;
  if p_rules_accepted is distinct from true then
    raise exception 'Rules must be accepted before registration';
  end if;

  perform pg_advisory_xact_lock(hashtext('plato_land_series3_registration_capacity'));

  select id, registration_status
    into v_id, v_status
    from public.plato_land_series3_registration_requests
   where plato_id_normalized = lower(btrim(p_plato_id));

  if found then
    return jsonb_build_object('status','duplicate','existing_status',v_status);
  end if;

  select count(*) into v_main_count
    from public.plato_land_series3_registration_requests
   where registration_status = 'main';

  v_status := case when v_main_count < 32 then 'main' else 'waitlist' end;

  insert into public.plato_land_series3_registration_requests
    (plato_id, rules_accepted, registration_status)
  values (btrim(p_plato_id), p_rules_accepted, v_status)
  returning id, created_at into v_id, v_created_at;

  if v_status = 'waitlist' then
    select count(*) into v_queue_position
      from public.plato_land_series3_registration_requests
     where registration_status = 'waitlist'
       and (created_at, id) <= (v_created_at, v_id);
  end if;

  return jsonb_build_object(
    'status', v_status,
    'registration_id', v_id,
    'queue_position', v_queue_position,
    'main_count', case when v_status = 'main' then v_main_count + 1 else v_main_count end
  );
end;
$$;

revoke all on function public.series3_register_request(text, boolean) from public;
grant execute on function public.series3_register_request(text, boolean) to anon, authenticated;
```

## Owner-controlled registration and waitlist handling (approved 2026-11-15)
- The owner manually opens and closes Series 3 registration from the management panel. No automatic schedule or date/time cutoff may change this state.
- After 32 main-roster places are filled, new valid requests are accepted into the waitlist while registration remains open.
- The applicant receives this approved message:

  > بازیکن گرامی،
  >
  > ظرفیت اصلی ثبت‌نام مسابقات سری سوم لیگ تخته‌نرد PLATO LAND (۳۲ نفر) تکمیل شده است.
  >
  > درخواست ثبت‌نام شما با موفقیت دریافت شد و نام شما در **فهرست انتظار (رزرو)** قرار گرفت.
  >
  > در صورت انصراف هر یک از بازیکنان ثبت‌نام‌شده، افراد فهرست انتظار به ترتیب نوبت ثبت‌نام بررسی شده و نفر بعدی برای ورود به فهرست اصلی جایگزین خواهد شد.
  >
  > از علاقه و همراهی شما با PLATO LAND سپاسگزاریم. 👑

- Waitlist order is oldest registration first, with a stable tie-breaker.
- A withdrawal does not automatically promote anyone. The owner reviews the next eligible waitlisted applicant and manually confirms the replacement.
- The exact tournament start time is therefore not required for registration opening/closing or promotion logic under this approved workflow.

## Safety boundaries
- No SQL was executed against Supabase.
- No schema, RLS, row, storage, auth, or function change was applied to the primary database.
- No main-branch commit, pull request, merge, Pages deployment, or public-page change was made.
- No Series 2 or Main Website files were intentionally changed.
- This branch must not be merged or deployed until the SQL proposal is reviewed, a migration version is generated correctly, and tests pass.

## Verification still required
- TypeScript typecheck and production build on this branch.
- Unit/integration tests for 31st/32nd/33rd registration, concurrent submissions, duplicate normalized IDs, queue ordering and report rendering.
- Owner-only withdrawal/promotion flow after exact tournament start time is supplied.
- Migration/RLS review against the primary database migration ledger before any apply.
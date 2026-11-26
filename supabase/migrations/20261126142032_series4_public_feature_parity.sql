begin;

create function public.series4_public_features_status()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.plato_land_series4_registration_settings
    where singleton and public_enabled
  );
$$;

create function public.series4_public_prediction_campaigns()
returns table(id uuid,title text,description text,campaign_type text,status text,is_open boolean,
  opens_at timestamptz,closes_at timestamptz,questions jsonb,prize_rules jsonb,public_config jsonb)
language sql stable security definer set search_path=''
as $$
  select c.id,c.title,c.description,c.campaign_type,c.status,c.is_open,
    c.opens_at,c.closes_at,c.questions,c.prize_rules,
    case when c.public_config #>> '{result,status}'='published'
      then jsonb_build_object('result',c.public_config->'result') else '{}'::jsonb end
  from public.plato_land_prediction_campaigns c
  where public.series4_public_features_status() and c.event_key='series4'
    and (c.status='published' or (c.status='closed' and c.public_config #>> '{result,status}'='published'))
  order by c.created_at desc;
$$;

alter policy "Public can read published prediction campaigns" on public.plato_land_prediction_campaigns
using (event_key is distinct from 'series4' and (status='published' or (status='closed' and event_key='series3')));

alter table public.plato_land_prediction_campaigns drop constraint series4_prediction_owner_only;

create function private.series4_gate_prediction_campaign()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if new.is_open and (new.status is distinct from 'published'
      or new.public_config #>> '{result,status}'='published') then
    raise exception 'Series 4 prediction cannot accept responses' using errcode='55000';
  end if;
  if new.public_config #>> '{result,status}'='published' and new.status not in ('closed','archived') then
    raise exception 'Close the prediction before publishing its result' using errcode='55000';
  end if;
  if (new.status='published' or new.is_open)
    and not public.series4_public_features_status() then
    raise exception 'Series 4 public features are disabled' using errcode='55000';
  end if;
  return new;
end;
$$;
create trigger series4_gate_prediction_campaign
before insert or update on public.plato_land_prediction_campaigns
for each row when (new.event_key='series4') execute function private.series4_gate_prediction_campaign();

create function private.series4_gate_prediction_entry()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  campaign public.plato_land_prediction_campaigns%rowtype;
begin
  select * into campaign from public.plato_land_prediction_campaigns where id=new.campaign_id;
  if campaign.event_key is distinct from 'series4' then return new; end if;
  select * into strict campaign from public.plato_land_prediction_campaigns where id=new.campaign_id for share;
  perform 1 from public.plato_land_series4_registration_settings where singleton and public_enabled for share;
  if not found or campaign.status is distinct from 'published' or campaign.is_open is distinct from true
    or (campaign.opens_at is not null and campaign.opens_at>clock_timestamp())
    or (campaign.closes_at is not null and campaign.closes_at<=clock_timestamp()) then
    raise exception 'Series 4 prediction is closed' using errcode='55000';
  end if;
  return new;
end;
$$;
create trigger series4_gate_prediction_entry before insert on public.plato_land_prediction_entries
for each row execute function private.series4_gate_prediction_entry();

create function public.series4_public_rules_video_key()
returns text language sql stable security definer set search_path=''
as $$
  select m.object_key
  from public.plato_land_series4_media m
  join public.plato_land_series4_media_preferences p on p.singleton and p.rules_enabled
  where public.series4_public_features_status() and m.slot='rules' and m.is_active;
$$;

revoke all on function public.series4_public_features_status(),public.series4_public_prediction_campaigns(),
  public.series4_public_rules_video_key(),private.series4_gate_prediction_campaign(),
  private.series4_gate_prediction_entry() from public,anon,authenticated;
grant execute on function public.series4_public_features_status(),public.series4_public_prediction_campaigns(),
  public.series4_public_rules_video_key() to anon,authenticated;
commit;

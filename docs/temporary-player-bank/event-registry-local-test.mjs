import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const db=new PGlite();
await db.exec(`
create role anon;
create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
grant usage on schema auth to authenticated;
create table user_roles(user_id uuid,role text);
grant select on user_roles to authenticated;
insert into user_roles values ('00000000-0000-0000-0000-000000000001','owner');
create table plato_land_temp_game_types(game_key text primary key);
insert into plato_land_temp_game_types values ('backgammon');
create table plato_land_series2_registration_requests(id uuid primary key,plato_id text not null,created_at timestamptz not null default now());
create table plato_land_series3_registration_requests(like plato_land_series2_registration_requests including all, registration_status text);
create table plato_land_series4_registration_requests(like plato_land_series3_registration_requests including all,plato_id_normalized text generated always as(lower(btrim(plato_id))) stored unique);
create table plato_land_black_friday_registration_requests(like plato_land_series2_registration_requests including all,selection_status text,plato_id_normalized text generated always as(lower(btrim(plato_id))) stored unique);
create table plato_land_black_friday_games(match_slot integer,game_no integer,player_a uuid,player_b uuid,score_a integer,score_b integer);
create table plato_land_black_friday_matches(slot integer,team_a uuid,team_b uuid,winner uuid);
create table plato_land_black_friday_teams(id uuid,name text,player_a uuid,player_b uuid);
create table plato_land_series3_knockout_match_results(match_id text,event_key text,stage_key text,player_a_plato_id text,player_b_plato_id text,score_a smallint,score_b smallint,result_status text,updated_at timestamptz);
create table plato_land_series3_third_place_playoff(event_key text,player_a_plato_id text,player_b_plato_id text,score_a integer,score_b integer,result_status text,updated_at timestamptz);
grant select on plato_land_series3_knockout_match_results,plato_land_series3_third_place_playoff to authenticated;
create table plato_land_series4_group_match_results(match_id text,event_key text,group_name text,match_date date,player_a_plato_id text,player_b_plato_id text,score_a smallint,score_b smallint,result_status text,updated_at timestamptz);
create table plato_land_series4_knockout_draw(bracket jsonb);
create table plato_land_series4_knockout_scores(match_id text,score_a integer,score_b integer,version integer);
create table plato_land_series4_knockout_score_history(match_id text,version integer,saved_at timestamptz);
create table plato_land_series4_cutoff_playoff(player_a text,player_b text,score_a integer,score_b integer,saved_at timestamptz);
grant select on plato_land_series4_group_match_results,plato_land_series4_knockout_draw,plato_land_series4_knockout_scores,plato_land_series4_knockout_score_history,plato_land_series4_cutoff_playoff to authenticated;
`);
const foundation=readFileSync('supabase/migrations/20261120104404_plato_land_temporary_player_registry_and_history.sql','utf8');
await db.exec(foundation.split('insert into public.plato_land_temp_players(plato_id)\nselect distinct')[0].replaceAll("in ('series2','series3')","in ('series1','series2','series3')"));
await db.exec(`
alter table plato_land_temp_player_entries add game_type_key text not null default 'backgammon';
alter table plato_land_temp_player_matches add game_type_key text not null default 'backgammon';
insert into plato_land_series2_registration_requests(id,plato_id) values ('00000000-0000-0000-0000-000000000010','Alpha');
insert into plato_land_black_friday_registration_requests(id,plato_id,selection_status) values
('00000000-0000-0000-0000-000000000011','alpha','accepted'),
('00000000-0000-0000-0000-000000000012','Bravo','excluded');
insert into plato_land_series4_registration_requests(id,plato_id,registration_status) values
('00000000-0000-0000-0000-000000000013','BRAVO','main');
`);
await db.exec(readFileSync('docs/temporary-player-bank/event-registry-proposed.sql','utf8'));
await db.exec(`
insert into plato_land_series3_registration_requests(id,plato_id,registration_status) values ('00000000-0000-0000-0000-000000000014','alpha','waitlist');
update plato_land_black_friday_registration_requests set selection_status='accepted' where plato_id='Bravo';
insert into plato_land_black_friday_games values (1,1,'00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000012',5,2);
insert into plato_land_black_friday_teams values
('00000000-0000-0000-0000-000000000021','Team A','00000000-0000-0000-0000-000000000011',null),
('00000000-0000-0000-0000-000000000022','Team B','00000000-0000-0000-0000-000000000012',null);
insert into plato_land_black_friday_matches values (1,'00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000022');
insert into plato_land_series3_knockout_match_results values ('q1','series3','quarterfinals','Alpha','Bravo',5,2,'completed',now());
insert into plato_land_series4_group_match_results values ('g1','series4','A',current_date,'Alpha','Bravo',null,null,'double_no_show',now());
insert into plato_land_series4_knockout_draw values ('{"firstRound":[{"id":"R4-1","a":{"plato_id":"Alpha"},"b":{"plato_id":"Bravo"}},{"id":"R4-2","a":{"plato_id":"Delta"},"b":{"plato_id":"Echo"}}],"laterRounds":[[{"id":"R2-1","fromA":"R4-1","fromB":"R4-2"}]],"thirdPlace":{"id":"THIRD-1","fromA":"R4-1","fromB":"R4-2"}}');
insert into plato_land_series4_registration_requests(id,plato_id,registration_status) values (gen_random_uuid(),'Delta','main'),(gen_random_uuid(),'Echo','main');
insert into plato_land_series4_knockout_scores values ('R4-1',5,2,1),('R4-2',2,5,1),('R2-1',1,5,1);
set role authenticated;
set test.uid='00000000-0000-0000-0000-000000000001';
`);
const rows=async(sql)=>(await db.query(sql)).rows;
assert.equal((await rows('select count(*)::integer n from plato_land_temp_players'))[0].n,4);
assert.equal((await rows("select count(*)::integer n from plato_land_temp_player_entries where event_key in ('series2','series3','series4','black_friday')"))[0].n,7);
assert.deepEqual((await rows("select registration_status from plato_land_temp_player_entries where event_key='black_friday'")) .map(x=>x.registration_status),['accepted','accepted']);
assert.deepEqual(await rows("select player_a_plato_id a,player_b_plato_id b,result_status from plato_land_temp_player_match_feed where stage in ('final','third_place') order by stage"),[{a:'Alpha',b:'Echo',result_status:'completed'},{a:'Bravo',b:'Delta',result_status:'pending'}]);
assert.equal((await rows("select count(*)::integer n from plato_land_temp_player_match_feed where event_key='black_friday'"))[0].n,1);
assert.equal((await rows("select count(*)::integer n from plato_land_temp_player_match_feed where event_key='series3' and stage='quarter'"))[0].n,1);
assert.deepEqual(await rows("select result from plato_land_temp_player_team_results((select id from plato_land_temp_players where plato_id_normalized='alpha'))"),[{result:'lost'}]);
await db.exec("reset role; update plato_land_black_friday_games set score_a=2,score_b=5; set role authenticated;");
assert.deepEqual(await rows("select score_a,score_b from plato_land_temp_player_match_feed where event_key='black_friday'"),[{score_a:2,score_b:5}]);
await db.exec("set test.uid='00000000-0000-0000-0000-000000000002'");
assert.equal((await rows('select count(*)::integer n from plato_land_temp_player_match_feed'))[0].n,0);
assert.equal((await rows('select count(*)::integer n from plato_land_temp_friday_individual_results()'))[0].n,0);
assert.equal((await rows("select count(*)::integer n from plato_land_temp_player_team_results('00000000-0000-0000-0000-000000000001')"))[0].n,0);
await db.exec('reset role; set role anon');
await assert.rejects(db.query('select * from plato_land_temp_player_match_feed'),/permission denied/);
await db.close();
console.log('PASS: registration backfill and triggers, normalized IDs, bracket advancement, team isolation, corrections and owner authorization');

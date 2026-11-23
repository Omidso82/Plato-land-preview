import { resolveSeries3OwnerThirdTie, SERIES3_OFFICIAL_OWNER_REASON, type Series3OwnerThirdDecision } from './series3OwnerThirdPlaceDecision';

const c = {registration_id:'registration-c3',plato_id:'Amin_2717',points:0,diff:-5,setsFor:0};
const d = {registration_id:'registration-c4',plato_id:'_Arman1379',points:0,diff:-5,setsFor:0};
const decision: Series3OwnerThirdDecision = {
  event_key:'series3',group_name:'C',selected_registration_id:c.registration_id,
  rejected_registration_id:d.registration_id,selected_plato_id:c.plato_id,
  rejected_plato_id:d.plato_id,reason:SERIES3_OFFICIAL_OWNER_REASON,
  decision_version:1,
};
function assert(ok:boolean,why:string){if(!ok)throw Error(why);}
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[decision])?.registration_id===c.registration_id,'valid decision');
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[])===null,'no decision');
assert(resolveSeries3OwnerThirdTie('C',c,d,'completed',[decision])===null,'completed fixture');
assert(resolveSeries3OwnerThirdTie('C',{...c,points:3},d,'double_no_show',[decision])===null,'different criteria');
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[decision,decision])===null,'duplicate decision');
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[{...decision,selected_registration_id:'wrong'}])===null,'identity mismatch');
assert(resolveSeries3OwnerThirdTie('A',c,d,'double_no_show',[decision])===null,'wrong group');
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[{...decision,reason:'unapproved'}])===null,'unapproved reason');
assert(resolveSeries3OwnerThirdTie('C',c,d,'double_no_show',[{...decision,decision_version:2}])===null,'unexpected version');
console.log('PASS: 9 Series 3 owner-decision resolver tests');

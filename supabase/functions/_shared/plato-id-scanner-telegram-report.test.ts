import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
function exactUnique(scans: Array<{created_at:string; ids:string[]|null}>) {
  const seen=new Set<string>(),ids:string[]=[];
  for(const scan of [...scans].sort((a,b)=>a.created_at.localeCompare(b.created_at)))
    for(const id of scan.ids??[]) if(typeof id==="string"&&id.length>0&&!seen.has(id)){seen.add(id);ids.push(id);}
  return ids;
}
Deno.test("global exact dedup preserves case and punctuation",()=>{
  assertEquals(exactUnique([{created_at:"2026-11-12",ids:["@A_1","@same"]},{created_at:"2026-11-13",ids:["@same","@a_1","@A_1"]}]),["@A_1","@same","@a_1"]);
});
Deno.test("unreviewed images are excluded by approved-review selection",()=>{
  const approved=new Set(["scan-approved"]);
  const scans=[{id:"scan-approved",ids:["@one"]},{id:"scan-pending",ids:["@two"]}];
  assertEquals(scans.filter(x=>approved.has(x.id)).flatMap(x=>x.ids),["@one"]);
});

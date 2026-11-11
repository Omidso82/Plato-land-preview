import {
  buildDailyScannerReport, buildWeeklyScannerReport,
  formatDailyTelegramMessages, formatWeeklyTelegramMessages,
  tehranJalaliDateKey,
} from "../../../src/plato-id-scanner-reports.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("Tehran date key follows Asia/Tehran rather than UTC",()=>{
  assertEquals(tehranJalaliDateKey("2026-11-10T21:00:00.000Z"),tehranJalaliDateKey("2026-11-11T00:30:00+03:30"));
});

Deno.test("daily report uses only completed canonical IDs and deduplicates exact IDs",()=>{
  const report=buildDailyScannerReport([
    {id:"1",created_at:"2026-11-11T08:00:00+03:30",status:"completed",ocr_result:{ids:["PLATO_A","PLATO_B"]}},
    {id:"2",created_at:"2026-11-11T13:00:00+03:30",status:"completed",ocr_result:{ids:["PLATO_A","PLATO_C"]}},
    {id:"3",created_at:"2026-11-11T14:00:00+03:30",status:"needs_review",ocr_result:{ids:["PLATO_D"]}},
  ],tehranJalaliDateKey("2026-11-11T12:00:00+03:30"));
  assertEquals(report.ids,["PLATO_A","PLATO_B","PLATO_C"]);
  assertEquals(report.imageCount,3);
});

Deno.test("weekly report has Saturday-to-Friday columns and one star per active day",()=>{
  const report=buildWeeklyScannerReport([
    {id:"sat",created_at:"2026-11-07T10:00:00+03:30",status:"completed",ocr_result:{ids:["ID-1","ID-1"]}},
    {id:"sun",created_at:"2026-11-08T10:00:00+03:30",status:"completed",ocr_result:{ids:["ID-1","ID-2"]}},
    {id:"fri",created_at:"2026-11-13T10:00:00+03:30",status:"completed",ocr_result:{ids:["ID-2"]}},
    {id:"next",created_at:"2026-11-14T10:00:00+03:30",status:"completed",ocr_result:{ids:["ID-3"]}},
  ],"2026-11-11T12:00:00+03:30");
  assertEquals(report.rows.length,2);
  const one=report.rows.find(row=>row.id==="ID-1")!;
  const two=report.rows.find(row=>row.id==="ID-2")!;
  assertEquals(one.activeDays,[true,true,false,false,false,false,false]);
  assertEquals(two.activeDays,[false,true,false,false,false,false,true]);
  assertEquals(report.imageCount,3);
});

Deno.test("Telegram formatters split long reports without losing rows",()=>{
  const daily=formatDailyTelegramMessages({jalaliDate:"1405/08/20",imageCount:2,ids:Array.from({length:500},(_,i)=>"PLATO_"+i)},500);
  assert(daily.length>1);
  assert(daily.every(message=>message.length<=500));
  const weekly=formatWeeklyTelegramMessages({weekStartJalali:"1405/08/17",weekEndJalali:"1405/08/23",imageCount:4,rows:[{id:"ID-1",activeDays:[true,false,true,false,false,false,true]}]});
  assert(weekly[0].includes("★"));
});

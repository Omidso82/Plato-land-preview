const PAGE_ROWS=30;

export const series4PredictionPageCount=(rows:number)=>Math.ceil(rows/PAGE_ROWS);

export async function series4PredictionPng(
  title:string,
  rows:Array<{player:string;value:string}>,
  page:number,
):Promise<Blob> {
  const start=page*PAGE_ROWS;
  const items=rows.slice(start,start+PAGE_ROWS);
  if(!items.length)throw new Error('ردیفی برای ساخت تصویر وجود ندارد.');
  await document.fonts.ready;
  const canvas=document.createElement('canvas');
  canvas.width=1080;
  canvas.height=220+items.length*66;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('ساخت تصویر در این مرورگر ممکن نیست.');
  ctx.fillStyle='#101113';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#a98345';ctx.lineWidth=3;ctx.strokeRect(22,22,1036,canvas.height-44);
  ctx.textAlign='center';ctx.fillStyle='#e4c77e';ctx.font='bold 42px Vazirmatn, Arial';
  ctx.fillText('PLATO LAND',540,80);
  ctx.direction='rtl';ctx.font='bold 32px Vazirmatn, Arial';
  ctx.fillText(title,540,140,960);
  items.forEach((item,index)=>{
    const y=166+index*66;
    ctx.fillStyle=index%2?'#242019':'#191919';ctx.fillRect(54,y,972,58);
    ctx.fillStyle='#f1dfb4';ctx.direction='ltr';ctx.textAlign='right';ctx.font='bold 29px Vazirmatn, Arial';
    ctx.fillText(item.player,943,y+39,390);
    ctx.textAlign='left';ctx.direction=/[\u0600-\u06ff]/.test(item.value)?'rtl':'ltr';
    ctx.fillText(item.value,85,y+39,400);
  });
  ctx.direction='rtl';ctx.textAlign='center';ctx.font='20px Vazirmatn, Arial';ctx.fillStyle='#e4c77e';
  ctx.fillText('سری چهارم تخته‌نرد · '+(page+1).toLocaleString('fa-IR')+' از '+series4PredictionPageCount(rows.length).toLocaleString('fa-IR'),540,canvas.height-34);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('ساخت PNG ناموفق بود.')),'image/png'));
}

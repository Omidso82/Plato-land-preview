export type Series4Qualifier = {
  plato_id: string;
  group: string;
  rank: number;
  points: number;
  diff: number;
  setsFor: number;
};

export function selectSeries4Qualifiers(groups: Series4Qualifier[][]): Series4Qualifier[] {
  if (![8,12].includes(groups.length) || groups.some(group=>group.length!==4)) {
    throw new Error('تعداد گروه‌ها یا بازیکنان کامل نیست.');
  }
  const places = groups.length===12 ? 3 : 2;
  const direct = groups.flatMap(group=>{
    if (group.slice(0,places).some((player,index)=>player.rank!==index+1 || player.rank===group[index+1]?.rank)) {
      throw new Error('رتبه‌های صعود در گروه '+group[0].group+' هنوز قطعی نیستند.');
    }
    return group.slice(0,2);
  });
  if (places===2) return direct;
  const compare = (a:Series4Qualifier,b:Series4Qualifier) => b.points-a.points || b.diff-a.diff || b.setsFor-a.setsFor;
  const thirds=groups.map(group=>group[2]).sort(compare);
  if(compare(thirds[7],thirds[8])===0) throw new Error('رتبه هشتم و نهم نفرات سوم برابر است. ابتدا وضعیت صعود باید تعیین شود.');
  return [...direct,...thirds.slice(0,8)];
}

export function buildSeries4Knockout(qualifiers: Series4Qualifier[]) {
  if (![16,32].includes(qualifiers.length) || new Set(qualifiers.map(player=>player.plato_id.toLowerCase())).size!==qualifiers.length) {
    throw new Error('فهرست صعودکنندگان معتبر نیست.');
  }
  const shuffled=[...qualifiers];
  const random=new Uint32Array(1);
  for(let index=shuffled.length-1;index>0;index--) {
    crypto.getRandomValues(random);
    const other=Math.floor(random[0]/0x100000000*(index+1));
    [shuffled[index],shuffled[other]]=[shuffled[other],shuffled[index]];
  }
  const pool=new Map<string,Series4Qualifier[]>();
  const thirds=shuffled.filter(player=>player.rank===3);
  for(const player of shuffled.filter(player=>player.rank!==3)) {
    if(!pool.has(player.group)) pool.set(player.group,[]);
    pool.get(player.group)!.push(player);
  }
  if([...pool.values()].some(group=>group.length>qualifiers.length/2)) throw new Error('قرعه بدون برخورد هم‌گروهی‌ها ممکن نیست.');
  const remainingGroups=()=>[...pool.values()].sort((left,right)=>right.length-left.length);
  const pairs=thirds.map(a=>{
    const opponents=remainingGroups().find(group=>group.length && group[0].group!==a.group);
    if(!opponents) throw new Error('برای نفر سوم حریف معتبر پیدا نشد.');
    return {a,b:opponents.shift()!};
  });
  while(pairs.length<qualifiers.length/2) {
    const [a,b]=remainingGroups();
    if(!a?.length || !b?.length) throw new Error('قرعه بدون برخورد هم‌گروهی‌ها ممکن نیست.');
    pairs.push({a:a.shift()!,b:b.shift()!});
  }
  for(let index=pairs.length-1;index>0;index--) {
    crypto.getRandomValues(random);
    const other=Math.floor(random[0]/0x100000000*(index+1));
    [pairs[index],pairs[other]]=[pairs[other],pairs[index]];
  }
  const firstRound=pairs.map((pair,index)=>({...pair,id:'R'+qualifiers.length+'-'+(index+1)}));
  const laterRounds=[];
  let previous=firstRound.map(match=>match.id);
  while(previous.length>1) {
    const matches=Array.from({length:previous.length/2},(_,index)=>({
      id:'R'+previous.length+'-'+(index+1),
      fromA:previous[2*index],fromB:previous[2*index+1],
    }));
    laterRounds.push(matches);
    previous=matches.map(match=>match.id);
  }
  const semifinals=laterRounds.at(-2)!;
  return {firstRound,laterRounds,thirdPlace:{id:'THIRD-1',fromA:semifinals[0].id,fromB:semifinals[1].id}};
}

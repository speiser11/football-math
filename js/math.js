/* Football Math — math.js: The math: problem generators, the K-4th ladder (STEPS/GRADES), adaptive steps, save migration, tap-mode choices, hints.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   PROBLEMS
   ========================================================= */
const add=(a,b,k='add')=>({text:`${a} + ${b}`, answer:a+b, key:`${a}+${b}`, vis:{k,a,b}});
const sub=(a,b,k='sub')=>({text:`${a} − ${b}`, answer:a-b, key:`${a}-${b}`, vis:{k,a,b}});
function pAdd(max){const a=r(1,max-1), b=r(1,max-a); return add(a,b)}
function pAddTeen(){const s=r(11,20), a=r(Math.max(1,s-10),Math.min(10,s-1)); return add(a,s-a)}                 // 8+5, 9+7 … (sum 11–20)
function pSub(max){const a=r(max>=20?10:3,max), b=r(1,a-1); return sub(a,b)}
function pTens(){ // whole tens, or a 2-digit number ± 10/20
  if(Math.random()<.5){ const a=r(1,8)*10, b=r(1,(100-a)/10)*10; return Math.random()<.6||a===b?add(a,b,'tens'):sub(Math.max(a,b),Math.min(a,b),'tens'); }
  const a=r(12,79), b=pick([10,10,20]); return Math.random()<.6?add(a,b,'tens'):sub(a+b,b,'tens'); }
function pAdd2(){const a=r(11,89), b=r(1,Math.min(9,99-a)); return add(a,b,'up')}            // 2-digit + 1-digit
function pAddRe(){let a,b; do{ a=r(15,89); b=r(2,9); }while(a%10+b<10 || a+b>99); return add(a,b,'up')}   // 38 + 7 (regroup)
function pSubRe(){let a,b; do{ a=r(21,98); b=r(2,9); }while(a%10>=b); return sub(a,b,'sub2')}          // 52 − 6 (regroup)
function pAddDD(){const a=r(12,78), b=r(11,99-a); return add(a,b,'col')}
function pSubDD(){const a=r(30,99), b=r(11,a-5); return sub(a,b,'col')}
function p3(){ if(Math.random()<.5){ const a=r(100,849), b=r(100,999-a); return add(a,b,'col'); } const a=r(250,999), b=r(100,a-50); return sub(a,b,'col'); }
function pMul(tables,maxB=10,minB=2){const t=pick(tables), b=r(minB,maxB); const [x,y]=Math.random()<.5?[t,b]:[b,t]; return {text:`${x} × ${y}`, answer:x*y, key:`${x}x${y}`, vis:{k:'mul',a:x,b:y}}}
function pDiv(tables,maxQ=10){const t=pick(tables), q=r(2,maxQ), a=t*q; return {text:`${a} ÷ ${t}`, answer:q, key:`${a}/${t}`, vis:{k:'div',a,b:t}}}
function pMulTens(){const a=r(2,9), b=r(2,9)*10; const [x,y]=Math.random()<.5?[a,b]:[b,a]; return {text:`${x} × ${y}`, answer:a*b, key:`${x}x${y}`, vis:{k:'mtens',a,b}}}
function pMulBig(lo,hi){const a=r(lo,hi), b=r(2,9); return {text:`${a} × ${b}`, answer:a*b, key:`${a}x${b}`, vis:{k:'split',a,b}}}
function pDivR(){const d=r(3,9), q=r(2,9), m=r(1,d-1), n=d*q+m, askQ=Math.random()<.5;
  return {text:askQ?`${n} ÷ ${d} = <b>?</b> R ${m}`:`${n} ÷ ${d} = ${q} R <b>?</b>`, answer:askQ?q:m, story:true, key:`${n}/${d}${askQ?'q':'r'}`, vis:{k:'divr',a:n,b:d,q,m,askQ}}}
function pDivBig(){const d=r(2,9), q=r(11,Math.floor(99/d)>11?Math.floor(99/d):12), n=d*q; return {text:`${n} ÷ ${d}`, answer:q, key:`${n}/${d}`, vis:{k:'ldiv',a:n,b:d}}}
const any=(...fs)=>()=>pick(fs)();
const ALL=[2,3,4,5,6,7,8,9,10];
/* ONE LADDER, K → 4th. A grade is only where you start (see GRADES).
   PASS (on grade) = the current step (sometimes a step or two below), RUN (review) = 4–5 steps
   below, DEEP BOMB (stretch) = always one step above. g = grade the skill belongs to. */
const STEPS=[
  {id:'add5', g:0, tag:'+ to 5',            f:()=>pAdd(5)},
  {id:'add10', g:0, tag:'+ to 10',           f:()=>pAdd(10)},
  {id:'addsub10', g:0, tag:'+ − to 10',         f:any(()=>pAdd(10),()=>pSub(10))},
  {id:'add20', g:0, tag:'+ to 20',           f:pAddTeen},
  {id:'addsub20', g:1, tag:'+ − to 20',         f:any(()=>pAdd(20),()=>pSub(20))},
  {id:'tens', g:1, tag:'+ − tens',          f:pTens},
  {id:'add2d1d', g:1, tag:'2-digit + 1',       f:pAdd2},
  {id:'mul2510', g:1, tag:'× 2, 5, 10',        f:()=>pMul([2,5,10],6,2)},
  {id:'regroup', g:2, tag:'+ − regroup',       f:any(pAddRe,pSubRe)},
  {id:'add2d', g:2, tag:'2-digit +',         f:pAddDD},
  {id:'sub2d', g:2, tag:'2-digit −',         f:pSubDD},
  {id:'mul25div', g:2, tag:'× 2–5 · ÷ 2,5,10',  f:any(()=>pMul([2,3,4,5]),()=>pDiv([2,5,10]))},
  {id:'muldiv25', g:3, tag:'× ÷ 2–5, 10',       f:any(()=>pMul([2,3,4,5,10]),()=>pDiv([2,3,4,5,10]))},
  {id:'mul69', g:3, tag:'× 6–9',             f:()=>pMul([6,7,8,9])},
  {id:'muldivall', g:3, tag:'× ÷ all tables',    f:any(()=>pDiv(ALL),()=>pMul(ALL))},
  {id:'addsub3d', g:3, tag:'3-digit + −',       f:p3},
  {id:'multens', g:4, tag:'× tens',            f:pMulTens},
  {id:'mul2d1d', g:4, tag:'2-digit × 1',       f:()=>pMulBig(12,49)},
  {id:'mul3d1d', g:4, tag:'3-digit × 1',       f:()=>pMulBig(101,399)},
  {id:'divrem', g:4, tag:'÷ remainders',      f:pDivR},
  {id:'div2d1d', g:4, tag:'2-digit ÷ 1',       f:pDivBig},
];
const MAXSTEP=STEPS.length-1;
const SI=Object.fromEntries(STEPS.map((st,i)=>[st.id,i]));   // step id → position on the ladder
/* saved data stores the step's id (not its position), so skills can be added anywhere in STEPS safely */
const GRADES=[{l:'K',s:'+ to 10',start:'addsub10'},{l:'1st',s:'+ − to 20',start:'add2d1d'},{l:'2nd',s:'+ − to 100',start:'sub2d'},{l:'3rd',s:'× ÷',start:'muldivall'},{l:'4th',s:'big × ÷',start:'mul3d1d'}];
const gradeName=g=>g===0?'K':GRADES[g].l+' grade';   // 'K', '1st grade', …
const clampS=s=>Math.max(0,Math.min(MAXSTEP,s));
const curStep=()=>SI[me().stepId] ?? SI[GRADES[me().grade].start];
function setStep(i,why='reset'){ const id=STEPS[clampS(i)].id, p=me();   // why: 'up' | 'down' | 'reset' (grade change / parent restart)
  if(id!==p.stepId||why==='reset'){ p.ladderLog.push({d:Date.now(), to:id, why}); while(p.ladderLog.length>30) p.ladderLog.shift(); }
  p.stepId=id; p.win=[]; store.set(saved); }
const resetLadder=()=>setStep(SI[GRADES[me().grade].start]);
/* difficulty band for the non-ladder questions (extra point, field goal, Stat Attack):
   0 = adding and subtracting, 1 = early × and ÷ (×2,5,10 up to ×2–5), 2 = all tables and beyond */
const mathBand=()=>{ const s=curStep(); return s<SI.mul2510?0:s<SI.muldiv25?1:2; };
/* which ladder step each play type draws from */
function stepFor(diff,s=curStep()){
  if(diff==='easy') return clampS(s-pick([4,5]));
  if(diff==='medium') return clampS(s-pick([0,0,1,2]));
  return clampS(s+1);
}
const playTag=diff=>STEPS[diff==='easy'?clampS(curStep()-4):diff==='medium'?curStep():clampS(curStep()+1)].tag;   // the typical step for each card's label
/* adaptive: rolling window of the last 10 answers. ≥90% → step up; ≤60% (4+ misses) → step down. */
function adaptRecord(ok){
  const w=me().win; w.push(ok?1:0); while(w.length>10) w.shift();
  const miss=w.filter(x=>!x).length; let ch=0;
  const s=curStep();
  if(w.length>=10 && miss<=1 && s<MAXSTEP) ch=1;
  else if(miss>=4 && s>0) ch=-1;   // 4 misses already means ≤60% once the window fills
  if(ch) setStep(s+ch, ch>0?'up':'down'); else store.set(saved);
  return ch;
}
/* treat 3×4 and 4×3 (or 2+5 and 5+2) as the same fact */
const norm=k=>{ if(!k) return ''; const m=k.match(/^(\d+)([+x])(\d+)$/); return m?[+m[1],+m[3]].sort((a,b)=>a-b).join(m[2]):k; };
function gen(diff){
  G.n=(G.n||0)+1; const recent=G.recent||(G.recent=[]);
  // missed facts come back, but only after at least 4 other problems
  const pool=(G.redo[diff]||[]).filter(x=>G.n-(x.missN||0)>=4 && !recent.includes(norm(x.key)));
  let p;
  if(pool.length && Math.random()<.4) p={...pick(pool)};
  else { const st=stepFor(diff); let tries=0; do{ p=STEPS[st].f(); tries++; }while(recent.includes(norm(p.key)) && tries<30); p.diff=diff; p.step=st; }
  p.adapt=true;
  recent.push(norm(p.key)); if(recent.length>12) recent.shift();
  return p;
}
/* tap mode: 3 plausible wrong answers — ±1, ±2, ±10, swapped digits, neighbor facts. No negatives, no repeats. */
function choicesFor(p){
  const A=p.answer, v=p.vis||{}, shuf=a=>a.map(x=>[Math.random(),x]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
  let close=[A+1,A-1,A+2,A-2], pat=[];
  if(A>=10) pat.push(A+10,A-10);
  const s=String(A); if(s.length>=2){ const sw=s.slice(0,-2)+s.slice(-1)+s.slice(-2,-1); if(sw[0]!=='0') pat.push(+sw); }
  if(v.k==='mul'||v.k==='split'){ pat.push(v.a*(v.b+1),v.a*(v.b-1),(v.a+1)*v.b,(v.a-1)*v.b); }
  if(v.k==='mtens'){ pat.push(v.a*(v.b+10),v.a*(v.b-10),(v.a+1)*v.b,(v.a-1)*v.b,v.a*v.b/10); }
  if(v.k==='add'||v.k==='up'||v.k==='col') pat.push(Math.abs(v.a-v.b));
  if(v.k==='sub'||v.k==='sub2'||v.k==='col'&&p.text.includes('−')) pat.push(v.a+v.b);
  if(v.k==='divr'&&!v.askQ){ close=Array.from({length:v.b},(_,i)=>i); pat=[]; }   // remainders are always < the divisor
  const ok=x=>Number.isInteger(x)&&x>=0&&x!==A&&(x>0||A<=4);
  const out=[]; const take=x=>{ if(ok(x)&&!out.includes(x)&&out.length<3) out.push(x); };
  const P=shuf(pat), C=shuf(close);
  take(P[0]); take(C[0]); shuf([...P.slice(1),...C.slice(1)]).forEach(take);
  for(let k=3;out.length<3;k++){ take(A+k); take(A-k); }
  return shuf([A,...out]);
}
function dots(n,cls=''){return Array.from({length:n},()=>`<div class="dot ${cls}"></div>`).join('')}
function hintHTML(p){
  const v=p.vis; if(!v) return '';
  if(v.k==='add') return `<div class="hint"><div class="grp">${dots(v.a)}</div><div class="htext" style="align-self:center">+</div><div class="grp">${dots(v.b,'s')}</div></div><div class="htext">Count them all: ${v.a+v.b}</div>`;
  if(v.k==='up'){const steps=Array.from({length:v.b},(_,i)=>v.a+i+1).join(', '); return `<div class="htext">Start at <b>${v.a}</b> and count up ${v.b}:<br>${steps}</div>`}
  if(v.k==='sub') return `<div class="hint"><div class="grp" style="max-width:260px">${dots(v.a-v.b)}${dots(v.b,'x')}</div></div><div class="htext">Take away ${v.b}, count what's left: ${v.a-v.b}</div>`;
  if(v.k==='sub2') return `<div class="htext">Start at <b>${v.a}</b> and count back ${v.b}:<br>${Array.from({length:v.b},(_,i)=>v.a-i-1).join(', ')}</div>`;
  if(v.k==='mul'){ if(v.a*v.b>100) return `<div class="htext">${v.a} groups of ${v.b}</div>`; return `<div class="hint">${Array.from({length:v.a},()=>`<div class="grp">${dots(v.b)}</div>`).join('')}</div><div class="htext">${v.a} groups of ${v.b} = ${v.a*v.b}</div>`}
  if(v.k==='tens'){ const plus=p.text.includes('+'), stepN=v.b/10, seq=Array.from({length:stepN},(_,i)=>plus?v.a+10*(i+1):v.a-10*(i+1)).join(', ');
    return `<div class="htext">Start at <b>${v.a}</b> and count ${plus?'up':'back'} by tens:<br>${seq}</div>`; }
  if(v.k==='col'){ const plus=p.text.includes('+'), w=String(Math.max(v.a,v.b)).length+1, pad=x=>String(x).padStart(w,' ');
    return `<pre class="colm">${pad(v.a)}\n${plus?'+':'−'}${pad(v.b).slice(1)}\n${'─'.repeat(w)}\n${pad(p.answer)}</pre><div class="htext">Line them up. Ones first, then tens${w>3?', then hundreds':''}.</div>`; }
  if(v.k==='mtens'){ const t=v.b/10; return `<div class="htext">${v.a} × ${t} = ${v.a*t}<br>so ${v.a} × ${v.b} = ${v.a*t}<b>0</b></div>`; }
  if(v.k==='split'){ const parts=String(v.a).split('').map((d,i,arr)=>+d*10**(arr.length-1-i)).filter(x=>x);
    return `<div class="htext">Break ${v.a} apart: ${parts.join(' + ')}<br>${parts.map(x=>`${x} × ${v.b} = ${x*v.b}`).join('<br>')}<br>Add them: <b>${v.a*v.b}</b></div>`; }
  if(v.k==='divr'){ const body=v.a<=60?`<div class="hint">${Array.from({length:v.b},()=>`<div class="grp">${dots(v.q)}</div>`).join('')}<div class="grp">${dots(v.m,'x')}</div></div>`:'';
    return `${body}<div class="htext">${v.b} groups of ${v.q} = ${v.b*v.q}, with <b>${v.m}</b> left over<br>${v.a} ÷ ${v.b} = ${v.q} R ${v.m}</div>`; }
  if(v.k==='ldiv'){ const q=v.a/v.b, qt=Math.floor(q/10)*10, rest=v.a-qt*v.b;
    return `<div class="htext">Split ${v.a} into ${qt*v.b} + ${rest}<br>${qt*v.b} ÷ ${v.b} = ${qt}, ${rest} ÷ ${v.b} = ${q-qt}<br>${qt} + ${q-qt} = <b>${q}</b></div>`; }
  if(v.k==='div'){const q=v.a/v.b; return `<div class="hint">${Array.from({length:v.b},()=>`<div class="grp">${dots(q)}</div>`).join('')}</div><div class="htext">${v.a} shared into ${v.b} groups = ${q} each</div>`}
  return '';
}

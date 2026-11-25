/* Football Math — coach.js: the Coach's Corner (parent view of one player's progress).
   Reads only: me().facts, .skills, .games, .ladderLog, .record, .stepId. Nothing here changes progress.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* status of a fact or skill — always shown with an icon + word, never color alone */
const ST={
  good:{icon:'✓', word:'Mastered',       cls:'good'},
  mid: {icon:'•', word:'Learning',       cls:'mid'},
  bad: {icon:'!', word:'Needs practice', cls:'bad'},
  none:{icon:'',  word:'Not seen yet',   cls:'none'},
};
function factStatus(f){ if(!f) return 'none'; const [ok,no]=f, acc=ok/(ok+no);
  if(ok>=3&&acc>=.8) return 'good'; if(no>=2&&acc<.6) return 'bad'; return 'mid'; }

/* fold − and ÷ into their fact family: 13−5 counts for 5+8, 42÷6 counts for 6×7 */
function familyFacts(facts){
  const add={}, mul={}, put=(o,a,b,f)=>{ const k=Math.min(a,b)+'_'+Math.max(a,b), c=o[k]||[0,0]; c[0]+=f[0]; c[1]+=f[1]; o[k]=c; };
  for(const [k,f] of Object.entries(facts)){ const m=k.match(/^(\d+)([+x\-\/])(\d+)$/); if(!m) continue; const a=+m[1], b=+m[3];
    if(m[2]==='+') put(add,a,b,f); else if(m[2]==='-') put(add,b,a-b,f); else if(m[2]==='x') put(mul,a,b,f); else if(b&&a%b===0) put(mul,b,a/b,f); }
  return {add,mul};
}
const pct=(ok,n)=>n?Math.round(ok/n*100):0;
const shortDate=d=>new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const factText=(k,f)=>{ const m=k.match(/^(\d+)([+x\-\/])(\d+)$/); const op={'+':'+','-':'−','x':'×','/':'÷'}[m[2]]; return `${m[1]} ${op} ${m[3]}`; };

function coachCorner(tab='mul'){
  const p=me(), s=curStep(), st=STEPS[s], T=TEAMS[p.homeT];
  const games=p.games, last5=games.slice(-5), l5r=last5.reduce((a,g)=>a+g.right,0), l5t=last5.reduce((a,g)=>a+g.total,0);
  const allR=Object.values(p.skills).reduce((a,x)=>a+x[0],0), allN=Object.values(p.skills).reduce((a,x)=>a+x[0]+x[1],0);
  const rec=p.record, played=rec.w+rec.l+rec.t;

  /* 1. KPI tiles */
  const tile=(v,label,sub='')=>`<div class="ktile glass"><div class="kv">${v}</div><div class="kl">${label}</div>${sub?`<div class="ks">${sub}</div>`:''}</div>`;
  const kpis=`<div class="krow">
    ${tile(`${s+1}<small> of ${STEPS.length}</small>`,'Math step',`${st.tag} · ${gradeName(st.g)} level`)}
    ${tile(l5t?pct(l5r,l5t)+'%':'—','Right, last 5 games',allN?`all games: ${pct(allR,allN)}%`:'')}
    ${tile(`${rec.w}–${rec.l}${rec.t?'–'+rec.t:''}`,'Record',`${played} game${played===1?'':'s'}`)}
  </div>`;

  /* 2. ladder meter: 21 segments, grade starts labelled underneath */
  const startIdx=GRADES.map(g=>SI[g.start]);
  const ladder=`<section class="cc glass"><h3>Math ladder</h3>
    <div class="lad" role="img" aria-label="Step ${s+1} of ${STEPS.length}: ${st.tag}">${STEPS.map((x,i)=>`<i class="${i<s?'done':i===s?'now':''}" title="${i+1}. ${x.tag}"></i>`).join('')}</div>
    <div class="ladg">${GRADES.map((g,gi)=>`<span style="left:${(startIdx[gi]+.5)/STEPS.length*100}%">${g.l}</span>`).join('')}</div>
    <div class="note" style="max-width:none">Now: <b>${st.tag}</b>. Next up: <b>${STEPS[clampS(s+1)].tag}</b>${s===MAXSTEP?' (top of the ladder!)':''}. Moves up after 9 of 10 right, down after 4 misses.</div>
    ${p.ladderLog.length?`<ul class="moves">${p.ladderLog.slice(-5).reverse().map(m=>`<li><span class="mv ${m.why}">${m.why==='up'?'⬆ Up':m.why==='down'?'⬇ Down':'↺ Set'}</span> to ${STEPS[SI[m.to]??0].tag} <span class="md">${shortDate(m.d)}</span></li>`).join('')}</ul>`:''}
  </section>`;

  /* 3. skills: meter list in ladder order, with going-well / working-on verdicts */
  const seen=STEPS.map((x,i)=>({x,i,f:p.skills[x.id]})).filter(o=>o.f&&o.f[0]+o.f[1]>0);
  const verdict=f=>{ const n=f[0]+f[1], a=f[0]/n; return n>=8&&a>=.85?'good':n>=6&&a<.7?'bad':'mid'; };
  const well=seen.filter(o=>verdict(o.f)==='good'), work=seen.filter(o=>verdict(o.f)==='bad');
  const skills=`<section class="cc glass"><h3>How it's going</h3>
    ${seen.length?`<div class="sum">${well.length?`<div><span class="sb good">✓ Going well</span> ${well.map(o=>o.x.tag).join(', ')}</div>`:''}
      ${work.length?`<div><span class="sb bad">! Working on</span> ${work.map(o=>o.x.tag).join(', ')}</div>`:''}
      ${!well.length&&!work.length?`<div class="note">Not enough answers yet to call anything strong or weak. Keep playing!</div>`:''}</div>
    <div class="mlist">${seen.map(o=>{ const n=o.f[0]+o.f[1], a=pct(o.f[0],n), v=verdict(o.f);
      return `<div class="mrow"><span class="mn">${o.x.tag}<small>${gradeName(o.x.g)}</small></span><span class="mbar"><i style="width:${a}%"></i></span><span class="mfig">${a}%<small>${o.f[0]}/${n}</small></span><span class="sb ${v}" title="${v==='good'?'Going well':v==='bad'?'Working on':'Learning'}">${v==='good'?'✓':v==='bad'?'!':'•'}</span></div>`; }).join('')}</div>`
    :`<div class="note">Play a game and each kind of problem will show up here.</div>`}
  </section>`;

  /* 4. practice list + the two ways to use it: focus facts in games, and the drill */
  const prac=troubleFacts(p,10);
  const practice=`<section class="cc glass"><h3>Practice these</h3>
    ${prac.length?`<div class="pchips">${prac.map(k=>{ const f=p.facts[k]; return `<span class="pchip">${factText(k)} <small>${f[0]} of ${f[0]+f[1]}</small></span>`; }).join('')}</div>
      <div class="note" style="max-width:none">Facts missed most often (right / tries, at least 2 tries).</div>
      <div class="prow2"><button class="cta small" id="drill">⭐ Practice drill</button><span class="note" style="margin:0">10 quick questions from this list, no football.</span></div>`
    :`<div class="note">No trouble facts right now.</div>`}
    <div class="prow2"><span class="label" style="margin:0">Practice facts in games</span>${segHTML('focus',[{v:true,l:'On'},{v:false,l:'Off'}],p.focus)}</div>
    <div class="note" style="max-width:none">When on, about 1 in 4 Run, Pass and defense plays uses a fact from this list (marked ⭐ Practice fact). They count in the fact map but never move the math ladder.</div>
  </section>`;

  /* 5. fact maps */
  const fam=familyFacts(p.facts), isMul=tab==='mul', src=isMul?fam.mul:fam.add, lo=isMul?2:1, N=isMul?9:10, sym=isMul?'×':'+';   // the game never asks ×1
  const counts={good:0,mid:0,bad:0,none:0};
  let grid=`<div class="fh"></div>`+Array.from({length:N},(_,j)=>`<div class="fh">${j+lo}</div>`).join('');
  for(let a=lo;a<lo+N;a++){ grid+=`<div class="fh">${a}</div>`;
    for(let b=lo;b<lo+N;b++){ const f=src[Math.min(a,b)+'_'+Math.max(a,b)], k=factStatus(f); if(a<=b) counts[k]++;   // each fact once (6×7 = 7×6)
      grid+=`<button class="fc ${ST[k].cls}" data-a="${a}" data-b="${b}" aria-label="${a} ${sym} ${b}: ${ST[k].word}">${ST[k].icon}</button>`; } }
  const maps=`<section class="cc glass"><h3>Fact map</h3>
    <div class="seg ftabs">${[['mul','× Times tables'],['add','+ Addition']].map(([v,l])=>`<button data-tab="${v}" class="${tab===v?'on':''}">${l}</button>`).join('')}</div>
    <div class="fgrid" style="grid-template-columns:22px repeat(${N},minmax(0,1fr))">${grid}</div>
    <div class="fcap" id="fcap">Tap a square to see that fact.</div>
    <div class="flegend">${['good','mid','bad','none'].map(k=>`<span><i class="fc ${ST[k].cls}">${ST[k].icon}</i>${ST[k].word} <b>${counts[k]}</b></span>`).join('')}<span class="note" style="margin:0">(facts)</span></div>
    <div class="note" style="max-width:none">${isMul?'7 × 6 and 6 × 7 are one square. Division counts too (42 ÷ 6 is the 6 × 7 fact).':'5 + 8 and 8 + 5 are one square. Subtraction counts too (13 − 5 is the 5 + 8 fact).'} Mastered = 3+ right and 80%+. Needs practice = missed 2+ times and under 60%.</div>
  </section>`;

  /* 6. recent games */
  const recent=`<section class="cc glass"><h3>Recent games</h3>
    ${games.length?`<div class="glist">${games.slice(-10).reverse().map(g=>{ const res=g.us>g.them?'W':g.us<g.them?'L':'T', a=pct(g.right,g.total), up=(SI[g.to]??0)-(SI[g.from]??0);
      return `<div class="grow"><span class="gd">${shortDate(g.d)}</span><span class="gr ${res}">${res} ${g.us}–${g.them}</span><span class="go">vs ${TEAMS[g.opp]?TEAMS[g.opp].name:''}</span><span class="mbar"><i style="width:${a}%"></i></span><span class="mfig">${a}%<small>${g.right}/${g.total}</small></span><span class="gu">${up>0?'⬆'.repeat(Math.min(up,3)):up<0?'⬇':''}</span></div>`; }).join('')}</div>`
    :`<div class="note">Finished games will show up here.</div>`}</section>`;

  $('#app').innerHTML=`<div class="coach">
    <div class="lhead2"><div class="who2">${helmetSVG(T,46)}<div><div class="label" style="color:#7fd3ff">Coach's Corner</div><h1>${esc(p.name)}</h1></div></div><button class="ghost" id="cback">◀ Back</button></div>
    ${kpis}${ladder}${skills}${practice}${maps}${recent}
    <div class="note" style="max-width:none;text-align:center">Stats are saved on this device only. The backup code (Settings) keeps grade, step and record, not these stats.</div>
  </div>`;
  window.scrollTo(0,0);
  $('#cback').onclick=startScreen;
  bindSeg('focus','focus',0,p); if($('#drill')) $('#drill').onclick=()=>practiceDrill();
  $('.ftabs').onclick=e=>{ const b=e.target.closest('button'); if(b) coachCorner(b.dataset.tab); };
  $('.fgrid').onclick=e=>{ const c=e.target.closest('.fc'); if(!c) return; const a=+c.dataset.a, b=+c.dataset.b, f=src[Math.min(a,b)+'_'+Math.max(a,b)], k=factStatus(f);
    document.querySelectorAll('.fgrid .fc.sel').forEach(x=>x.classList.remove('sel')); c.classList.add('sel');
    $('#fcap').innerHTML=`<b>${a} ${sym} ${b} = ${isMul?a*b:a+b}</b> · ${ST[k].icon} ${ST[k].word}${f?` · right ${f[0]}, missed ${f[1]}`:''}`; };
}

/* ---------- the practice drill: 10 questions from the trouble list, missed ones come back ---------- */
async function practiceDrill(){
  const p=me(); let list=troubleFacts(p,10);
  if(!list.length) return coachCorner();
  const LEN=10, queue=[]; while(queue.length<LEN) queue.push(...list.slice().sort(()=>Math.random()-.5)); queue.length=LEN;
  G={quit:true, homeT:p.homeT, awayT:p.awayT}; GAME++; const gid=GAME; let right=0, done=0;   // no game running; confetti() reads G.homeT
  const marks=[];   // ✓ / ✗ per question
  $('#app').innerHTML=`<div class="coach drill">
    <div class="lhead2"><div><div class="label" style="color:#7fd3ff">Practice drill · ${esc(p.name)}</div><h1 class="dh">PRACTICE FIELD</h1></div><button class="ghost" id="dback">◀ Back</button></div>
    <div class="dprog" id="dprog"></div>
    <div class="panel" id="panel"></div></div>`;
  $('#dback').onclick=()=>{ GAME++; coachCorner(); };
  const prog=()=>{ const el=$('#dprog'); if(el) el.innerHTML=Array.from({length:LEN},(_,i)=>`<i class="${marks[i]||''}">${marks[i]==='ok'?'🏈':''}</i>`).join(''); };
  for(let i=0;i<LEN;i++){
    prog();
    const k=queue[i], q=factProblem(k); q.key=q.key||k;
    const res=await ask(q,{title:'PRACTICE', color:'#2a6ea3', sit:`${i+1} of ${LEN}`, contText:'Next ▶', noStat:true});
    if(gid!==GAME) return;   // left the drill
    factLog(q,res.ok); store.set(saved); done++;
    if(res.ok) right++; else if(i+2<LEN) queue.splice(i+2+Math.floor(Math.random()*(LEN-i-2)),1,k);   // a miss comes back later in this drill
    marks[i]=res.ok?'ok':'no';
  }
  prog();
  const left=troubleFacts(p,10).length;
  $('#panel').innerHTML=`<div class="fb glass"><div class="yay">${right>=8?'GREAT PRACTICE!':right>=5?'NICE WORK!':'GOOD EFFORT!'}</div>
    <div class="eqline">${right} of ${LEN} right</div>
    <div class="note" style="margin:4px auto">${left?`${left} fact${left===1?'':'s'} still on the practice list.`:'Practice list is empty. All caught up!'}</div>
    <div class="extras" style="margin-top:8px"><button class="ghost" id="dagain">Practice again</button><button class="cta small" id="dcoach">Coach's Corner</button></div></div>`;
  if(right>=8){ fanfare(); confetti(); } else ding();
  $('#dagain').onclick=()=>practiceDrill(); $('#dcoach').onclick=()=>coachCorner();
}

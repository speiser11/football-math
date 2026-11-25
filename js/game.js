/* Football Math — game.js: Gameplay: asking a problem, offense (play calls), defense, halftime Stat Attack, end of game.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   THE SNAP: question card + play clock
   ========================================================= */
function ask(p,opts={}){
  return new Promise(resolve=>{
    let val='', t0=performance.now(), timer=null, beat=!!opts.clock, hint=false, done=false; const gid=GAME;
    const tap=useTap(), ch=tap?choicesFor(p):null;
    dim(true);
    const show=()=>{
      $('#panel').innerHTML=`<div class="snap glass">
        <div class="snaphead"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="badge" style="background:${opts.color||'#13385a'}">${opts.title||''}</span><span class="sit">${opts.sit||''}</span>${p.focus?'<span class="focusb">⭐ Practice fact</span>':''}</div>${opts.extra||''}</div>
        ${opts.clock?`<div class="shot"><span class="label">Play clock</span><div class="tr"><div class="fl" id="pcf"></div></div><span class="n" id="pcn"></span></div>`:''}
        <div class="eqrow">${p.story?`<div class="eq story">${p.text}</div>`:`<div class="eq">${p.text}</div><div class="eqs">=</div>`}<div class="ans" id="ans">${val||'&nbsp;'}</div></div>
        ${p.vis&&!p.story?`<div class="film"><button id="film">${hint?'Hide film room':'Film room: show me'}</button></div>`:''}
        ${hint?hintHTML(p):''}
        ${tap?`<div class="choices">${ch.map(n=>`<button data-v="${n}">${n}</button>`).join('')}</div>`
          :`<div class="pad">${[1,2,3,4,5,6,7,8,9,0].map(n=>`<button data-n="${n}">${n}</button>`).join('')}<button class="del" data-n="del">⌫</button><button class="go" data-n="go">HIKE!</button></div>`}
      </div>`;
      if(tap) $('.choices').onclick=e=>{const b=e.target.closest('button'); if(!b||done)return; val=b.dataset.v; b.classList.add('picked'); const el=$('#ans'); if(el) el.textContent=val; tone(760,.05,'square',.035); submit();};
      else $('.pad').onclick=e=>{const b=e.target.closest('button'); if(b)press(b.dataset.n)};
      const f=$('#film'); if(f) f.onclick=()=>{ hint=!hint; show(); };
    };
    const press=n=>{
      if(n==='del') val=val.slice(0,-1);
      else if(n==='go'){ if(val!=='') submit(); return; }
      else if(val.length<4){ val+=n; tone(700+ +n*40,.045,'square',.035); }
      const el=$('#ans'); if(el) el.innerHTML=val||'&nbsp;';
    };
    const onKey=e=>{ if(gid!==GAME){document.removeEventListener('keydown',onKey);return;} if(tap){ const i='1234'.indexOf(e.key); if(i>=0){ const b=document.querySelectorAll('.choices button')[i]; if(b) b.click(); } return; } if(/^[0-9]$/.test(e.key))press(e.key); else if(e.key==='Backspace')press('del'); else if(e.key==='Enter')press('go'); };
    document.addEventListener('keydown',onKey);
    if(opts.clock){ timer=setInterval(()=>{ const left=Math.max(0,opts.clock-(performance.now()-t0)/1000); const f=$('#pcf'), n=$('#pcn'); if(f){f.style.width=(left/opts.clock*100)+'%'; f.classList.toggle('low',left<opts.clock*.3);} if(n)n.textContent=left>0?`:${String(Math.ceil(left)).padStart(2,'0')}`:'no burst'; if(left<=0){beat=false; clearInterval(timer);} },100); }
    const submit=()=>{
      if(done) return; done=true;
      clearInterval(timer); document.removeEventListener('keydown',onKey);
      const ok=+val===p.answer, fast=ok&&beat; let up=0;
      if(!opts.noStat) up=recordAnswer(p,ok);   // noStat: the practice drill scores its own answers
      if(up>0) setTimeout(()=>{ if(gid===GAME){ lower(`⬆ LEVEL UP! Now: ${STEPS[curStep()].tag}`,'good'); chip([[76,.25],[81,.25],[88,.6]],220,'square',.05); } },250);
      if(ok){ ding(); $('#panel').innerHTML=`<div class="fb glass"><div class="yay">${pick(['YES!','CORRECT!','NAILED IT!','BOOM!','MONEY!'])}</div><div class="eqline">${p.story?'':p.text+' = '}${p.answer}</div>${fast&&opts.burstText?`<div class="burst">⚡ ${opts.burstText}</div>`:''}${up>0?`<div class="burst">⬆ LEVEL UP!</div>`:''}</div>`;
        setTimeout(()=>{ if(gid===GAME){ dim(false); resolve({ok,fast}); } },fast?1100:750); }
      else { bonk(); $('#panel').innerHTML=`<div class="fb glass"><div class="oops">Almost! Let's look</div><div class="eqline">${p.story?'Answer: ':p.text+' = '}<span style="color:#5fe08a">${p.answer}</span></div>${hintHTML(p)}<button class="cont" id="ct">${opts.contText||'Run the play ▶'}</button></div>`;
        $('#ct').onclick=()=>{ dim(false); resolve({ok:false,fast:false}); }; }
    };
    G._ans=p.answer; G._panel=show; show();
  });
}
/* the ONE place an answer is scored: game stats, missed-fact replay, fact log, adaptive ladder.
   Returns +1/-1 if the ladder moved. Any new kind of question should go through here. */
function recordAnswer(p,ok){
  G.total++;
  if(ok){ G.right++; removeRedo(p); } else addMiss(p);
  factLog(p,ok);
  if(p.step!=null){ const id=STEPS[p.step].id, sk=me().skills[id]||[0,0]; sk[ok?0:1]++; me().skills[id]=sk; }   // per-skill accuracy
  return p.adapt? adaptRecord(ok) : 0;
}
function addMiss(p){ if(p.key&&!G.missed.includes(p.text)) G.missed.push(p.text); if(p.diff&&p.key){ const ex=G.redo[p.diff].find(x=>x.key===p.key); if(ex) ex.missN=G.n; else G.redo[p.diff].push({...p,missN:G.n}); } }
function removeRedo(p){ if(p.diff&&p.key) G.redo[p.diff]=G.redo[p.diff].filter(x=>x.key!==p.key); }

/* =========================================================
   FLOW: clock + possessions
   ========================================================= */
function goTo(next,arg){
  if(G.quit) return;
  if(!G.ot && G.clock<=0) return quarterBreak(next,arg);
  if(next==='play') callPlay(); else if(next==='defense') defense(arg); else startDrive(arg);
}
async function quarterBreak(next,arg){
  G.clock=0; updateBoard(); whistle();
  if(G.q===2){ lower('HALFTIME — STAT ATTACK!','good'); fanfare(); await wait(1500); const ok=await statAttack(); if(G.quit) return; G.q=3; G.clock=G.qLen; updateBoard(); return startDrive(ok?40:25); }
  if(G.q===4){
    if(G.home===G.away){ G.ot=true; lower('TIE GAME — OVERTIME!','good'); waiting('OVERTIME'); await wait(2200); updateBoard(); return startDrive(25); }
    return endGame();
  }
  lower(`End of the ${ord(G.q)} quarter`,'info'); waiting('QUARTER BREAK'); await wait(1700);
  G.q++; G.clock=G.qLen; updateBoard(); goTo(next,arg);
}
async function startDrive(start){
  if(G.quit) return;
  G.offSide='home'; G.pos=Math.round(start); G.down=1; G.toGo=Math.min(10,100-G.pos); G.lines=true;
  updateBoard(); waiting();
  await setFormation('home',G.pos);
  lower(G.ot?'OVERTIME — score to win!':`${T().name} ball at the ${spotText(G.pos)}`,'info');
  callPlay();
}
/* ---------- defensive looks: read the defense, call the right play ---------- */
const LOOKS={
  blitz:{name:'BLITZ', tip:'They’re rushing the QB! A quick PASS beats the blitz. A deep bomb could get sacked.', best:'medium', bad:'hard', col:'#e0533a'},
  box:{name:'STACKED BOX', tip:'They crowded the line to stop the run. Go over the top — DEEP BOMB! A run gets stuffed.', best:'hard', bad:'easy', col:'#e7b416'},
  deep:{name:'DEEP COVERAGE', tip:'Their safeties are way back. RUN it right at them! A deep bomb gets covered.', best:'easy', bad:'hard', col:'#3fa9f5'},
};
function chooseLook(){
  const w={blitz:1,box:1,deep:1};
  if(G.toGo>=7&&G.down>=2) w.deep+=1.2;
  if(G.toGo<=2) w.box+=1.4;
  if(100-G.pos<=12){ w.box+=.8; w.blitz+=.5; }
  if(G.down===1) w.blitz+=.3;
  const tot=w.blitz+w.box+w.deep; let x=Math.random()*tot;
  for(const k of ['blitz','box','deep']){ x-=w[k]; if(x<=0) return k; } return 'deep';
}
const LOOK_POS={
  blitz:{...DEF_POS,LB1:[1.5,-3],MLB:[1.5,.5],LB2:[1.5,3.2],S1:[9,-6],S2:[9,6]},
  box:{...DEF_POS,LB1:[3,-3.4],MLB:[3,0],LB2:[3,3.4],S1:[5,-7],S2:[5,7]},
  deep:{...DEF_POS,LB1:[6.5,-5],MLB:[6.5,0],LB2:[6.5,5],CB1:[9,-17],CB2:[9,16],S1:[18,-8],S2:[18,8]},
};
function lookIcon(k){
  if(k==='blitz') return `<svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true"><g stroke="#ff9a80" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M4 4 L14 12 M30 4 L20 12 M17 2 L17 12"/><path d="M14 12 l-4 0 l2 -3 M20 12 l4 0 l-2 -3"/></g><circle cx="17" cy="21" r="3.5" fill="none" stroke="#fff" stroke-width="2"/></svg>`;
  if(k==='box') return `<svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true"><g font-family="Saira Condensed" font-weight="900" font-size="9" fill="#ffd27a"><text x="3" y="10">X</text><text x="10" y="10">X</text><text x="17" y="10">X</text><text x="24" y="10">X</text><text x="7" y="17">X</text><text x="20" y="17">X</text></g><line x1="2" y1="21" x2="32" y2="21" stroke="#fff" stroke-width="2"/></svg>`;
  return `<svg width="34" height="26" viewBox="0 0 34 26" aria-hidden="true"><g font-family="Saira Condensed" font-weight="900" font-size="9" fill="#8fd0ff"><text x="4" y="8">X</text><text x="24" y="8">X</text><text x="14" y="15">X</text></g><line x1="2" y1="23" x2="32" y2="23" stroke="#fff" stroke-width="2"/></svg>`;
}

function callPlay(){
  if(G.quit) return;
  if(!G.look) G.look=chooseLook();
  updateBoard(); setFormation('home',G.pos);
  const L=LOOKS[G.look], on=O().name;
  const canFG=G.pos>=60, fgDist=100-G.pos+17, fourth=G.down===4, late=!G.ot&&G.clock<=40&&(G.q===2||G.q===4);
  const card=(t,kind,nm,yd,pips)=>`<button class="play" data-t="${t}">${playSVG(kind)}<div class="nm">${nm}</div><div class="yd">${yd}</div><div class="mt">${playTag(t)}</div><div class="pips">${[1,2,3].map(i=>`<i class="${i<=pips?'on':''}"></i>`).join('')}</div></button>`;
  setPanel(`
    <div class="look glass" style="border-color:${L.col}">${lookIcon(G.look)}<div><div class="lk">${on.toUpperCase()} SHOW: <span style="color:${L.col}">${L.name}</span></div><div class="tip">${L.tip}</div></div></div>
    <div class="ptitle">${fourth?"4th down — what's the call, Coach?":late?'Clock is running out!':'Call your play'}</div>
    <div class="plays">${card('easy','run','RUN','short gain',1)}${card('medium','pass','PASS','medium gain',2)}${card('hard','bomb','DEEP BOMB','big gain · risky',3)}</div>
    ${(fourth||(late&&canFG))?`<div class="extras">${canFG?`<button class="cta" style="font-size:20px;padding:8px 18px" id="fg">Field goal (${fgDist} yds)</button>`:''}${fourth?'<button class="ghost" id="punt">Punt it away</button>':''}</div>`:''}`,
  ()=>{ $('.plays').onclick=e=>{const b=e.target.closest('.play'); if(b) runPlay(b.dataset.t)}; if($('#fg'))$('#fg').onclick=fieldGoal; if($('#punt'))$('#punt').onclick=punt; });
}
async function runPlay(type){
  const R=RS(G.homeT), look=G.look||'deep', L=LOOKS[look];
  const wrIdx= type==='hard'? pick([0,1]) : pick([0,1,2]);
  const p=gen(type), meta={easy:['RUN','#1f7a3a'],medium:['PASS','#0b5aa6'],hard:['DEEP BOMB','#6b2bb3']}[type];
  const who= type==='easy'? `${last(R.RB[1])} #${R.RB[0]}` : `${last(R.QB[1])} → ${last(R.WR[wrIdx][1])}`;
  
  const goal=100-G.pos<=G.toGo;
  const res=await ask(p,{title:meta[0], color:meta[1], sit:`${ord(G.down).toUpperCase()} & ${goal?'GOAL':G.toGo} · vs ${L.name.toLowerCase()} · ${who}`, clock:G.pclock, burstText:'BEAT THE CLOCK — +5 yard burst!'});
  if(G.quit) return;
  const ok=res.ok, match= type===L.best?'best': type===L.bad?'bad':'ok';
  const old=G.pos;
  // outcome table: right answer + right call = big play; wrong call still moves the ball a little
  let kind, gain=0, note='';
  if(type==='easy'){
    kind='run';
    if(!ok) gain=r(0,2);
    else if(match==='best') gain=r(7,11);
    else if(match==='ok') gain=r(3,6);
    else { gain=r(-1,2); note='stuffed'; }
  } else if(type==='medium'){
    if(!ok){ kind='inc'; }
    else { kind='pass'; gain= match==='best'? r(12,18) : r(7,11); }
  } else {
    if(!ok){ const pick6= look==='deep'? .5 : .3; kind= Math.random()<pick6 ? 'int' : 'inc'; }
    else if(match==='best'){ kind='bomb'; gain=r(26,40); }
    else if(look==='blitz'){ if(Math.random()<.6){ kind='sack'; gain=-r(5,8); } else { kind='bomb'; gain=r(14,22); note='just got it off'; } }
    else { if(Math.random()<.55){ kind='inc'; note='covered'; } else { kind='bomb'; gain=r(14,22); note='contested catch'; } }
  }
  if(res.fast&&(kind==='run'||kind==='pass'||kind==='bomb')){ gain+=5; G.bursts++; }
  if(old+gain>100) gain=100-old;
  if(old+gain<1) gain=1-old;
  const td=(kind==='run'||kind==='pass'||kind==='bomb')&&old+gain>=100;
  waiting(); lower('&nbsp;','info');
  const out=await animPlay('home',old,{kind,gain,td,target:'WR'+(wrIdx+1)});
  if(G.quit) return;
  G.look=null;
  if(kind==='int'){
    runClock(r(6,10));
    lower(`INTERCEPTED! ${O().name} take over`,'bad'); await wait(1500);
    return goTo('defense',Math.max(8,Math.min(92,Math.round(out.intPos||old+15))));
  }
  runClock(kind==='inc'?r(5,8):td?r(8,14):r(24,36));
  G.pos=old+gain; updateBoard();
  const carrierName= kind==='run'? last(R.RB[1]) : last(R.WR[wrIdx][1]);
  if(td) return touchdown(out.carrier, carrierName);
  const QB=last(R.QB[1]), WR=last(R.WR[wrIdx][1]), RB=last(R.RB[1]);
  if(kind==='sack') lower(`${QB} SACKED by the blitz! Loss of ${-gain}`,'bad');
  else if(kind==='inc') lower(note==='covered'?`Deep ball… covered! Incomplete`:`${QB}'s pass falls incomplete`,'bad');
  else if(kind==='run') lower(note==='stuffed'?`${RB} stuffed by the stacked box`:ok&&match==='best'?`Great call! ${RB} breaks loose for ${gain}`:`${RB} for ${gain} yards`, ok&&gain>2?'good':'bad');
  else lower(match==='best'?`Great call! ${QB} to ${WR} — ${gain} yards!`:`${QB} to ${WR}${note?` (${note})`:''} — ${gain} yards`,'good');
  await wait(1200);
  G.toGo-=gain;
  if(G.toGo<=0){ G.down=1; G.toGo=Math.min(10,100-G.pos); lower('FIRST DOWN!','good'); roar(.6,1.3); updateBoard(); await wait(1000); }
  else { G.down++; updateBoard(); if(G.down>4){ lower('Turnover on downs','bad'); await wait(1300); return goTo('defense',G.pos); } }
  goTo('play');
}
async function touchdown(carrier,name){
  G.home+=6; updateBoard(); roar(1.5,3.8); horn(); setTimeout(fanfare,700); confetti();
  lower(`TOUCHDOWN ${name?name.toUpperCase():T().name.toUpperCase()}!`,'good');
  waiting('TOUCHDOWN');
  await celebrate(carrier);
  const before=G.home, R=RS(G.homeT);
  const p=curStep()<SI.addsub20
    ? {text:'6 + 1', answer:7, vis:{k:'add',a:6,b:1}}
    : {text:`You have <b>${before}</b> points.<br>The kick adds <b>1</b> more.<br>What's your new score?`, answer:before+1, story:true, vis:{k:'up',a:before,b:1}};
  const res=await ask(p,{title:'EXTRA POINT', color:'#8a6512', sit:`${last(R.K[1])} #${R.K[0]} to kick`, contText:'Kick it ▶'});
  if(G.quit) return;
  waiting();
  await animPlay('home',85,{kind:'fg',good:res.ok});
  if(res.ok){ G.home+=1; lower(`${last(R.K[1])}'s extra point is good`,'good'); } else lower('Extra point missed','bad');
  updateBoard(); await wait(1200);
  goTo('defense',75);
}
async function fieldGoal(){
  const lv=mathBand(), n=lv===0?r(2,3):lv===1?r(2,5):r(3,10), R=RS(G.homeT);
  const seq=Array.from({length:n-1},(_,i)=>3*(i+1)).join(', ');
  const p=lv===0
    ? {text:`Field goals are worth 3.<br>Count by 3s: <b>${seq}, __</b>`, answer:3*n, story:true, vis:{k:'mul',a:n,b:3}}
    : {text:`3 × ${n}`, answer:3*n, vis:{k:'mul',a:3,b:n}, key:`3x${n}`, diff:'hard'};
  waiting();
  await setFormation('home',G.pos,'kick');
  const res=await ask(p,{title:'FIELD GOAL · 3 PTS', color:'#8a6512', sit:`${100-G.pos+17} yards · ${last(R.K[1])} #${R.K[0]}`, contText:'Kick it ▶'});
  if(G.quit) return;
  waiting();
  await animPlay('home',G.pos,{kind:'fg',good:res.ok});
  runClock(r(5,8));
  if(res.ok){ G.home+=3; updateBoard(); fanfare(); lower(`${last(R.K[1])} — IT'S GOOD! +3`,'good'); } else lower('No good — wide','bad');
  await wait(1500); goTo('defense',75);
}
async function punt(){
  waiting();
  const land=Math.min(92,G.pos+r(38,45));
  await animPlay('home',G.pos,{kind:'punt',land});
  runClock(r(8,12)); lower('Booming punt','info'); await wait(1000);
  goTo('defense',land);
}

/* ---------- defense: the opponent drives one play at a time ----------
   Every opponent snap is one problem. A right answer usually stops the play
   (sack, broken-up pass, short gain); a wrong answer gives up a big gain.
   Normal downs decide when they punt, kick or score, so it feels like football.
   The Opponent setting controls how often they make a play anyway. */
const OPP={easy:{luck:.03,good:[[.27,'sack'],[.36,'inc'],[.25,'run',0,2],[.12,'pass',3,5]],fg:.65},
           normal:{luck:.25,good:[[.15,'sack'],[.25,'inc'],[.25,'run',1,4],[.35,'pass',4,8]],fg:.85},
           tough:{luck:.3,good:[[.12,'sack'],[.22,'inc'],[.26,'run',2,5],[.4,'pass',5,9]],fg:.92}};
async function defense(bStart){
  if(G.quit) return;
  if(G.ot && G.home>G.away) return endGame();
  const R=RS(G.awayT), on=O().name, S=OPP[me().opp]||OPP.normal;
  G.offSide='away'; G.lines=false; G.look=null;
  let bpos=Math.round(bStart); G.bDown=1; G.bToGo=Math.min(10,bpos); updateBoard(); waiting();
  await setFormation('away',bpos);
  lower(`${on} ball — defense, let's go!`,'info'); claps();
  await wait(900);
  let start=25, plays=0;
  while(true){
    if(G.quit) return;
    // 4th down: kick or punt
    if(G.bDown===4){
      if(bpos<=35){
        const good=Math.random()<S.fg;
        await setFormation('away',bpos,'kick');
        await animPlay('away',bpos,{kind:'fg',good});
        runClock(r(5,8));
        if(good){ G.away+=3; lower(`${last(R.K[1])} field goal is good. ${on} +3`,'bad'); }
        else lower(`${last(R.K[1])} misses the field goal!`,'good');
        start= good?25:Math.max(20,Math.min(80,bpos+7));
      } else {
        const land=Math.max(8,bpos-r(38,44));
        await animPlay('away',bpos,{kind:'punt',land});
        runClock(r(8,12)); lower(`Defense holds — ${on} punt`,'good');
        start=Math.max(20,land);
      }
      break;
    }
    const p=gen(pick(['easy','medium','medium']));
    const goal=bpos<=G.bToGo;
    const a=await ask(p,{title:`DEFENSE · ${ord(G.bDown).toUpperCase()} & ${goal?'GOAL':G.bToGo}`, color:'#8a2a1e', sit:`${last(R.QB[1])} and the ${on} at ${spotText(bpos)}`, clock:G.pclock, burstText:'LIGHTNING DEFENSE — sack!', contText:'Next play ▶'});
    if(G.quit) return;
    plays++;
    const wi=r(0,2), WRn=last(R.WR[wi][1]), RBn=last(R.RB[1]), QBn=last(R.QB[1]);
    let spec, msg, good=true;
    if(a.ok && Math.random()<.06){ spec={kind:'int'}; }
    else if(a.ok && (a.fast || Math.random()>=S.luck)){
      let x=Math.random(), o=S.good[S.good.length-1];
      for(const row of S.good){ if(x<row[0]){ o=row; break; } x-=row[0]; }
      if(a.fast) o=[0,'sack'];
      if(o[1]==='sack'){ spec={kind:'sack',gain:-r(5,8)}; msg=`${QBn} SACKED!`; }
      else if(o[1]==='inc'){ spec={kind:'inc'}; msg='Pass broken up!'; }
      else if(o[1]==='run'){ const g=r(o[2],o[3]); spec={kind:'run',gain:g}; msg=`${RBn} stopped after ${g}`; }
      else { const g=r(o[2],o[3]); spec={kind:'pass',gain:g}; msg=`Short catch by ${WRn}, ${g} yards — tackled`; }
    } else {
      const g=a.ok? r(12,22) : r(8,18);
      spec=pick([{kind:'run',gain:g},{kind:'pass',gain:g}]); good=false;
      msg= a.ok? `Right answer, but ${spec.kind==='run'?RBn:WRn} made a great play — ${g} yards` : (spec.kind==='run'?`${RBn} breaks free for ${g}`:`${QBn} hits ${WRn} for ${g}`);
    }
    spec.target='WR'+(wi+1);
    if(spec.gain && bpos-spec.gain<=0){ spec.gain=bpos; spec.td=true; }
    if(spec.kind==='sack') spec.gain=-Math.min(-spec.gain,97-bpos);
    waiting();
    const out=await animPlay('away',bpos,spec);
    if(G.quit) return;
    if(spec.kind==='int'){
      start=Math.max(20,Math.min(80,Math.round(out.intPos)));
      lower('INTERCEPTION! What a defense!','good'); confetti(); runClock(r(6,10));
      break;
    }
    runClock(spec.kind==='inc'?r(5,8):r(24,36));
    if(spec.td){ G.away+=7; aww(); lower(`Touchdown ${spec.kind==='run'?RBn:WRn}. ${on} +7`,'bad'); break; }
    const gn=spec.gain||0; bpos=Math.max(1,Math.min(97,bpos-gn));
    lower(msg, good?'good':'bad');
    G.bToGo-=gn;
    if(G.bToGo<=0){ G.bDown=1; G.bToGo=Math.min(10,bpos); updateBoard(); await wait(900); lower(`${on} first down`,'bad'); }
    else { G.bDown++; updateBoard(); }
    await wait(900);
    if(!G.ot && G.clock<=0){ if(G.q===1||G.q===3){ lower(`End of the ${ord(G.q)} quarter`,'info'); await wait(1200); G.q++; G.clock=G.qLen; updateBoard(); } else break; }   // half / game ends mid-drive
    await setFormation('away',bpos);
  }
  updateBoard(); await wait(1700);
  if(G.ot) return endGame();
  goTo('drive',start);
}

/* =========================================================
   HALFTIME STAT ATTACK (retro LED board)
   ========================================================= */
function statAttack(){
  return new Promise(resolve=>{
    const gid=GAME;
    const others=Object.keys(TEAMS).filter(k=>k!==G.homeT&&k!==G.awayT);
    const ids=[G.homeT,G.awayT,pick(others)].sort(()=>Math.random()-.5);
    const [A,B,C]=ids, st=curStep(), lv=st<SI.tens?0:st<SI.muldiv25?1:2;   // yardage size: small / medium / big
    const d= lv===0?r(2,5):lv===1?r(5,12):r(10,25);
    const bY= lv===0?r(9,14):r(18,35), aY=bY+d, cY=bY-(lv===0?r(2,5):r(4,10));
    const verb=pick([['ran for','1st half rushing'],['threw for','1st half passing']]);
    const rows=[{y:aY,t:A},{y:bY,t:B},{y:cY,t:C}].sort(()=>Math.random()-.5);
    const fill=[null,null,null]; let sel=null, done=false;
    dim(true);
    const show=(result)=>{
      $('#panel').innerHTML=`<div class="led">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="ledt" style="font-size:24px">HALFTIME STAT ATTACK</span><span class="ledg" style="font-size:15px">${verb[1].toUpperCase()}</span></div>
        <div class="clue">The ${TEAMS[A].name} ${verb[0]} <b>${d} more yards</b> than the ${TEAMS[B].name}. The ${TEAMS[C].name} had the <b>fewest</b>. Who's who?</div>
        <div class="match">
          <div class="chips"><span class="label" style="text-align:center">1. Tap a team</span>${ids.map(id=>`<button class="chip ${sel===id?'sel':''} ${fill.includes(id)?'used':''}" data-c="${id}">${TEAMS[id].name}</button>`).join('')}</div>
          <div class="rows"><span class="h">2. Tap its box</span><span class="h">YARDS</span>${rows.map((rw,i)=>{ const st=result?(fill[i]===rw.t?'right':'wrong'):''; return `<button class="slot ${fill[i]?'':'empty'} ${st}" data-s="${i}">${fill[i]?TEAMS[fill[i]].name:'FILL ME IN'}${result&&fill[i]!==rw.t?`<br><small style="color:#5fe08a">${TEAMS[rw.t].name}</small>`:''}</button><div class="num">${rw.y}</div>`; }).join('')}</div>
        </div>
        ${result?`<div class="ledt" style="font-size:18px;text-align:center">${result==='win'?'ALL RIGHT! +15 YARD KICKOFF RETURN':'NICE TRY! CHECK THE GREEN NAMES'}</div><button class="cont" id="go2">Start the 2nd half ▶</button>`
        :`<button class="hike" id="chk" aria-label="Check answers"><svg width="170" height="95" viewBox="0 0 200 112"><ellipse cx="100" cy="56" rx="96" ry="52" fill="#7b3f13" stroke="#2e1505" stroke-width="5"/><path d="M22 30 Q100 2 178 30 M22 82 Q100 110 178 82" stroke="#f3e2c0" stroke-width="5" fill="none"/><text x="100" y="72" text-anchor="middle" font-family="Saira Condensed" font-weight="900" font-size="46" fill="#ffd23f" stroke="#2e1505" stroke-width="4" paint-order="stroke">CHECK</text></svg></button>`}
      </div>`;
      if(result){ $('#go2').onclick=()=>{ if(gid!==GAME) return; dim(false); resolve(result==='win'); }; return; }
      $('.chips').onclick=e=>{ const b=e.target.closest('.chip'); if(!b)return; sel=b.dataset.c; tone(700,.05,'triangle',.06); show(); };
      $('.rows').onclick=e=>{ const b=e.target.closest('.slot'); if(!b)return; const i=+b.dataset.s; if(sel){ const prev=fill.indexOf(sel); if(prev>=0) fill[prev]=null; fill[i]=sel; sel=null; } else fill[i]=null; tone(500,.05,'triangle',.06); show(); };
      $('#chk').onclick=()=>{ if(fill.some(f=>!f)){ lower('Fill in all three boxes first','info'); return; }
        const win=rows.every((rw,i)=>fill[i]===rw.t); recordAnswer({text:'Stat Attack'},win); if(win){ ding(); roar(1,1.8); } else bonk(); updateBoard(); show(win?'win':'lose'); };
    };
    G._panel=()=>show(); show();
  });
}

/* ---------- end ---------- */
function endGame(){
  if(G.quit) return;
  G.offSide='home'; G.clock=Math.max(0,G.clock); updateBoard(); const dd=$('#dd'); if(dd) dd.textContent='FINAL';
  const win=G.home>G.away, tie=G.home===G.away;
  if(win) me().record.w++; else if(tie) me().record.t++; else me().record.l++;
  const gl=me().games; gl.push({d:Date.now(), opp:G.awayT, us:G.home, them:G.away, right:G.right, total:G.total, from:G.startStep, to:me().stepId}); while(gl.length>30) gl.shift();
  store.set(saved);
  if(!win&&!tie) setTimeout(loseJingle,300);
  if(win){ roar(1.5,4.5); horn(); setTimeout(winJingle,600); confetti(); setTimeout(confetti,900); G.cheerUntil=performance.now()+5000; }
  const pct=G.total?Math.round(G.right/G.total*100):0;
  lower(win?`${T().name.toUpperCase()} WIN!`:tie?'TIE GAME':'FINAL',win?'good':'info');
  const chips=G.missed.filter(m=>!m.includes('<')).slice(0,12);
  setPanel(`<div class="end">
      <h2>${win?'VICTORY':tie?'TIE GAME':'GOOD GAME'}</h2>
      <div class="final">${T().name} ${G.home} – ${G.away} ${O().name}</div>
      <div class="statrow"><div class="stat glass"><b>${G.right}/${G.total}</b>problems right</div><div class="stat glass"><b>${pct}%</b>accuracy</div>${G.pclock?`<div class="stat glass"><b>${G.bursts}</b>bursts</div>`:''}<div class="stat glass"><b>${me().record.w}–${me().record.l}${me().record.t?`–${me().record.t}`:''}</b>record</div></div>
      ${chips.length?`<div class="practice glass">Coach's practice list<div class="pchips">${chips.map(m=>`<span class="pchip">${m}</span>`).join('')}</div></div>`:`<div class="practice glass">No missed facts this game!</div>`}
      <div class="extras"><button class="cta" id="again">PLAY AGAIN</button></div>
    </div>`, ()=>{ $('#again').onclick=startScreen; });
}

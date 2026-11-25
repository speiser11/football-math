/* Football Math — screens.js: Start screen, team picker, game screen layout, scoreboard, ticker.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   SCREENS
   ========================================================= */
function helmetSVG(t,w=70,flip=false){
  const stripe=t.h===t.c2?t.c1:t.c2;
  return `<svg width="${w}" height="${Math.round(w*.8)}" viewBox="0 0 70 56" aria-hidden="true"${flip?' style="transform:scaleX(-1)"':''}><path d="M5 33 C5 13 21 3 37 3 C52 3 61 14 61 28 L61 36 L46 36 L42 47 L15 47 C9 47 5 41 5 33Z" fill="${t.h}" stroke="#0a0f1a" stroke-width="2.5"/><path d="M14 9 C26 4 42 4 56 14" stroke="${stripe}" stroke-width="5" fill="none"/><circle cx="30" cy="30" r="4" fill="#0a0f1a" opacity=".5"/><path d="M45 30 L67 30 M47 39 L67 39 M66 25 L66 45 M55 30 L55 39" stroke="#d9d9d9" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}
function playSVG(kind){
  let s=`<svg viewBox="0 0 150 70" aria-hidden="true"><rect width="150" height="70" fill="#0e2f16"/><line x1="58" y1="0" x2="58" y2="70" stroke="#9fd08f" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  for(const y of [23,29,35,41,47]) s+=`<circle cx="52" cy="${y}" r="3.3" fill="none" stroke="#fff" stroke-width="2"/>`;
  s+=`<circle cx="40" cy="35" r="3.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="28" cy="35" r="3.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="52" cy="7" r="3.3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="52" cy="63" r="3.3" fill="none" stroke="#fff" stroke-width="2"/>`;
  if(kind==='run') s+=`<path d="M31 35 L50 27 L90 23" stroke="#ffd23f" stroke-width="3" fill="none"/><path d="M90 23 l-7 -4 l1 8z" fill="#ffd23f"/>`;
  if(kind==='pass') s+=`<path d="M55 7 L80 7 L96 20" stroke="#ffd23f" stroke-width="3" fill="none"/><path d="M96 20 l-8 -1 l5 -6z" fill="#ffd23f"/><path d="M40 35 Q70 18 94 19" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/>`;
  if(kind==='bomb') s+=`<path d="M55 63 L142 63" stroke="#ffd23f" stroke-width="3" fill="none"/><path d="M142 63 l-8 -4 l0 8z" fill="#ffd23f"/><path d="M40 35 Q95 -10 138 59" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 3" fill="none"/>`;
  for(const [x,y] of [[70,25],[70,45],[84,35],[110,11],[110,59]]) s+=`<text x="${x}" y="${y+4}" text-anchor="middle" font-family="Saira Condensed" font-weight="900" font-size="11" fill="#ff8a65">X</text>`;
  return s+'</svg>';
}
const segHTML=(id,opts,cur)=>`<div class="seg" id="${id}">${opts.map(o=>`<button data-v="${o.v}" class="${String(o.v)===String(cur)?'on':''}">${o.l}${o.s?`<small>${o.s}</small>`:''}</button>`).join('')}</div>`;
function bindSeg(id,key,num,obj=saved){ $('#'+id).onclick=e=>{const b=e.target.closest('button'); if(!b)return; obj[key]=num?+b.dataset.v:(b.dataset.v==='true'?true:b.dataset.v==='false'?false:b.dataset.v); store.set(saved); $('#'+id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));}; }

function ladderText(){ const s=curStep(), st=STEPS[s];
  return `Math step <b>${s+1}</b> of ${STEPS.length}: <b>${st.tag}</b> · ${gradeName(st.g)} level`; }
const useTap=()=>me().ansMode==='tap'||(me().ansMode!=='type'&&me().grade<=1);
function startScreen(){
  G.quit=true; GAME++; ANIM=null; crowdBed(false); if(AC) musicStart(); else musicStop();
  const rec=me().record, h=TEAMS[me().homeT], a=TEAMS[me().awayT];
  $('#app').innerHTML=`
  <div class="start">
    <button class="tsnd" id="tsnd" aria-label="Title music on or off"></button>
    <h1 class="title">FOOTBALL<span>MATH</span></h1>
    <p class="tagline">Solve it to run the play. Bigger plays, harder math.</p>
    <button class="who" id="who">${helmetSVG(h,30)}<span class="wn">${esc(me().name)}</span><span class="ws">${saved.players.length>1?'Switch player':'Add a player'}</span></button>
    <div class="matchup">
      <button class="tcard" id="pickH"><span class="label">Your team</span>${helmetSVG(h,84)}<span class="nm">${h.name}</span><span class="chg">Change team</span></button>
      <div class="vs">VS</div>
      <button class="tcard" id="pickA"><span class="label">Opponent</span>${helmetSVG(a,84,true)}<span class="nm">${a.name}</span><span class="chg">Change team</span></button>
    </div>
    <div class="opt"><span class="label">Grade</span>${segHTML('grade',GRADES.map((g,i)=>({v:i,l:g.l,s:g.s})),me().grade)}
      <div class="note ladder" id="ladder">${ladderText()}</div></div>
    <div class="opt"><span class="label">Opponent</span>${segHTML('opp',[{v:'easy',l:'Easy',s:'scores rarely'},{v:'normal',l:'Normal',s:'close games'},{v:'tough',l:'Tough',s:'you need stops'}],me().opp)}</div>
    <button class="cta" id="kick">KICKOFF</button>
    <button class="ghost coachbtn" id="coach">📋 Coach's Corner</button>
    <details class="settings glass"><summary>Settings</summary>
      <div class="setrow"><span class="label">Quarter length</span>${segHTML('qlen',[{v:120,l:'2 min',s:'quick'},{v:180,l:'3 min',s:'regular'},{v:300,l:'5 min',s:'long'}],saved.qLen)}</div>
      <div class="setrow"><span class="label">Play clock</span>${segHTML('pc',[{v:0,l:'Off'},{v:20,l:'20 sec'},{v:10,l:'10 sec'}],saved.pclock)}
        <div class="note">Answer before the clock runs out for a +5 yard burst. Running out never hurts.</div></div>
      <div class="setrow"><span class="label">Sound</span>${segHTML('sndset',[{v:true,l:'On'},{v:false,l:'Off'}],saved.sound)}</div>
      <div class="setrow"><span class="label">Answers</span>${segHTML('am',[{v:'auto',l:'Auto',s:'tap for K–1st'},{v:'tap',l:'Tap',s:'4 big buttons'},{v:'type',l:'Type',s:'number pad'}],me().ansMode)}</div>
      <div class="setrow"><span class="label">Math ladder</span><button class="ghost" id="ladreset">Restart at ${gradeName(me().grade)} start</button>
        <div class="note">The math moves up a step after 9 of 10 right, and down a step after 4 misses. Progress is saved on this device.</div></div>
      ${backupHTML()}
    </details>
    <div class="record">${esc(me().name)}'s record: ${rec.w}–${rec.l}${rec.t?`–${rec.t}`:''}</div>
  </div>`;
  $('#grade').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const g=+b.dataset.v; if(g===me().grade) return;
    me().grade=g; resetLadder(); startScreen(); };
  $('#ladreset').onclick=()=>{ resetLadder(); $('#ladder').innerHTML=ladderText(); };
  bindSeg('am','ansMode',0,me()); bindSeg('opp','opp',0,me()); bindSeg('qlen','qLen',1); bindSeg('pc','pclock',1);
  // Phones play nothing until the first tap, so "on but not playing yet" says "Tap for music" and a tap starts it
  const tsnd=()=>{ const b=$('#tsnd'); b.innerHTML=`🎵<small>${!musicOn()?'Music off':MUS.on?'Music on':'Tap for music'}</small>`; b.classList.toggle('off',!musicOn()); };
  const syncMusic=()=>{ if(musicOn()){ ac(); musicStart(); } else musicStop(); tsnd(); };
  $('#tsnd').onclick=()=>{ if(!sfxOn()){ saved.sound=true; saved.music=true; store.set(saved); return startScreen(); }   // all sound was off: tapping Music on turns sound back on too
    if(musicOn()&&!MUS.on){ syncMusic(); return; }   // it was waiting for a tap: start it, don't switch it off
    saved.music=saved.music===false; store.set(saved); syncMusic(); };
  document.addEventListener('pointerdown',()=>setTimeout(()=>{ if($('#tsnd')) tsnd(); },120),{once:true});   // first tap anywhere starts the theme (unlockAudio): update the label
  bindSeg('sndset','sound',0); const sndSeg=$('#sndset').onclick; $('#sndset').onclick=e=>{ sndSeg(e); syncMusic(); };   // update the setting first, then start/stop the theme
  tsnd();
  bindBackup(); $('#who').onclick=()=>playersModal(); $('#coach').onclick=()=>coachCorner();
  $('#pickH').onclick=()=>teamPicker('homeT'); $('#pickA').onclick=()=>teamPicker('awayT');
  $('#kick').onclick=()=>{ musicStop(); ac(); unlockAudio(); newGame(); gameScreen(); horn(); roar(1.1,2.6); setTimeout(whistle,1200); setTimeout(()=>crowdBed(true),1500); setTimeout(()=>startDrive(25),900); };
}
function teamPicker(key){
  const other=key==='homeT'?'awayT':'homeT';
  const m=document.createElement('div'); m.className='modal';
  m.innerHTML=`<h2>${key==='homeT'?'Pick your team':'Pick the opponent'}</h2>
    <div class="tgrid">${Object.values(TEAMS).map(t=>`<button class="tbtn ${me()[key]===t.abbr?'on':''}" data-t="${t.abbr}">${helmetSVG(t,48)}${t.name}</button>`).join('')}</div>
    <button class="ghost" style="margin-top:14px" id="mclose">Close</button>`;
  document.body.appendChild(m);
  m.onclick=e=>{ const b=e.target.closest('.tbtn'); if(b){ const v=b.dataset.t; const p=me(); if(p[other]===v) p[other]=p[key]; p[key]=v; store.set(saved); m.remove(); startScreen(); } else if(e.target.id==='mclose') m.remove(); };
}

/* ---------- game screen ---------- */
function gameScreen(){
  const h=T(), a=O();
  $('#app').innerHTML=`
  <div class="fieldwrap" id="fw"><canvas id="cv"></canvas>
    <div class="stadium">${h.stadium}</div>
    <div class="bug">
      <div class="tm" style="background:${h.c1}"><span class="poss" id="ph"></span><span class="ab" style="color:${h.c2==='#000000'||h.c2===h.c1?'#fff':h.c2}">${h.abbr}</span><span class="sc" id="sh">0</span></div>
      <div class="tm" style="background:${a.c1}"><span class="sc" id="sa">0</span><span class="ab" style="color:${a.c2==='#000000'||a.c2===a.c1?'#fff':a.c2}">${a.abbr}</span><span class="poss" id="pa"></span></div>
      <div class="mid"><span class="q" id="qtr">1ST</span><span class="clk" id="clk">3:00</span><span class="dd" id="dd">1ST &amp; 10</span></div>
    </div>
  </div>
  <div class="lower"><div class="bar" style="background:${h.c1}"></div><div class="txt info" id="tk">&nbsp;</div><div class="hud"><button id="snd" aria-label="Sound on or off">${saved.sound?'🔊':'🔇'}</button><button id="quit" aria-label="Leave game">✕</button></div></div>
  <div class="panel" id="panel"></div>`;
  $('#snd').onclick=()=>{ saved.sound=!saved.sound; store.set(saved); $('#snd').textContent=saved.sound?'🔊':'🔇'; crowdBed(saved.sound); };
  $('#quit').onclick=()=>{ const prev=G._panel; $('#panel').innerHTML=`<div class="ptitle">Leave this game?</div><div class="extras"><button class="ghost" id="qy">Yes, go home</button><button class="cta" style="font-size:20px;padding:8px 20px" id="qn">Keep playing</button></div>`; $('#qy').onclick=startScreen; $('#qn').onclick=()=>{ if(prev)prev(); }; };
  setFormation('home',25,'normal',0);
  updateBoard();
}
function updateBoard(){
  if(!$('#sh')) return;
  $('#sh').textContent=G.home; $('#sa').textContent=G.away;
  $('#clk').textContent=G.ot?'OT':fmt(G.clock);
  $('#qtr').textContent=G.ot?'OT':['','1ST','2ND','3RD','4TH'][G.q];
  $('#ph').classList.toggle('on',G.offSide==='home'); $('#pa').classList.toggle('on',G.offSide==='away');
  if(G.offSide==='home'){ const goal=100-G.pos<=G.toGo; $('#dd').textContent=`${ord(G.down).toUpperCase()} & ${goal?'GOAL':G.toGo}`; }
  else $('#dd').textContent=G.bDown?`${ord(G.bDown).toUpperCase()} & ${G.bToGo}`:'DEFENSE';
}
function lower(t,cls='info'){ const k=$('#tk'); if(!k)return; k.className='txt '+cls; k.innerHTML=t; }
function setPanel(html,fn){ if(!$('#panel'))return; const show=()=>{ $('#panel').innerHTML=html; if(fn)fn(); }; G._panel=show; show(); }
const waiting=(t='')=>setPanel(`<div class="waiting">${t||'&nbsp;'}</div>`);
const runClock=s=>{ if(!G.ot){ G.clock=Math.max(0,G.clock-s); updateBoard(); } };
const dim=on=>{ const f=$('#fw'); if(f) f.classList.toggle('dim',on); };

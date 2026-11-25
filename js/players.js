/* Football Math — players.js: player profiles ("Who's playing?"), the backup code ("game password"),
   and migrateSave() — the ONLY place old saved data is upgraded.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   SAVE MIGRATION — bump SAVE_VERSION (core.js) and add one `if(v<N)` block here
   whenever the shape of saved data changes.
   ========================================================= */
const OPPS=['easy','normal','tough'], AMODES=['auto','tap','type'];
function migrateSave(){
  const v=saved.v||1;
  if(v<2){   // v1 (Rookie/Pro/All-Pro, player cards) and the first ladder build (numeric step)
    if(typeof saved.step==='number'&&STEPS[saved.step]) saved.stepId=STEPS[saved.step].id;
    delete saved.step; delete saved.level; delete saved.cards;
  }
  if(v<3){   // v3: one kid's data moves out of the top level into saved.players[0]
    if(!saved.players||!saved.players.length){
      const p=newPlayer('Player 1');
      for(const k of PLAYER_KEYS) if(saved[k]!==undefined) p[k]=saved[k];
      saved.players=[p]; saved.cur=0;
    }
    for(const k of PLAYER_KEYS) delete saved[k];
  }
  if(!Array.isArray(saved.players)||!saved.players.length) saved.players=[newPlayer('Player 1')];
  saved.players.forEach(fixPlayer);
  if(!(saved.cur>=0&&saved.cur<saved.players.length)) saved.cur=0;
  saved.v=SAVE_VERSION; store.set(saved);
}
/* repairs anything missing or invalid in one player (also used after restoring a code) */
function fixPlayer(p){
  const d=newPlayer(p.name||'Player');
  for(const k of Object.keys(d)) if(p[k]===undefined||p[k]===null) p[k]=d[k];
  p.name=cleanName(p.name)||'Player';
  if(!(p.grade>=0&&p.grade<GRADES.length)) p.grade=1;
  if(!(p.stepId in SI)) p.stepId=GRADES[p.grade].start;
  if(!Array.isArray(p.win)) p.win=[];
  if(!OPPS.includes(p.opp)) p.opp='normal';
  if(!AMODES.includes(p.ansMode)) p.ansMode='auto';
  if(!TEAMS[p.homeT]) p.homeT='DET';
  if(!TEAMS[p.awayT]||p.awayT===p.homeT) p.awayT=p.homeT==='CHI'?'DET':'CHI';
  const rc=p.record; p.record={w:Math.max(0,rc.w|0),l:Math.max(0,rc.l|0),t:Math.max(0,rc.t|0)};
  if(typeof p.facts!=='object') p.facts={};
  return p;
}

/* =========================================================
   PLAYER PROFILES — each kid has their own grade, ladder step, teams, record and fact stats.
   Sound, music, quarter length and play clock are per device (top level of `saved`).
   ========================================================= */
const MAX_PLAYERS=6;
const cleanName=s=>String(s||'').replace(/[<>&"']/g,'').replace(/\s+/g,' ').trim().slice(0,12);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function switchPlayer(i){ saved.cur=i; store.set(saved); startScreen(); }
function addPlayer(name){ saved.players.push(fixPlayer(newPlayer(cleanName(name)||`Player ${saved.players.length+1}`))); switchPlayer(saved.players.length-1); }
function removePlayer(i){ saved.players.splice(i,1); if(!saved.players.length) saved.players.push(fixPlayer(newPlayer('Player 1'))); saved.cur=Math.min(saved.cur>i?saved.cur-1:saved.cur,saved.players.length-1); store.set(saved); }
const playerLine=p=>`${gradeName(p.grade)} · step ${(SI[p.stepId]??0)+1}`;

/* "Who's playing?" — big buttons for kids; rename/remove/add tucked under "Parents" */
function playersModal(mode='pick'){
  const old=document.querySelector('.modal.players'); if(old) old.remove();
  const m=document.createElement('div'); m.className='modal players';
  const P=saved.players, canAdd=P.length<MAX_PLAYERS;
  const body= mode==='add'||mode.startsWith('rename:') ? (()=>{ const i=mode==='add'?-1:+mode.split(':')[1];
      return `<h2>${i<0?'New player':'Rename player'}</h2>
        <input class="pname" id="pname" maxlength="12" autocomplete="off" placeholder="First name or nickname" value="${i<0?'':esc(P[i].name)}">
        <div class="note" style="margin:8px auto 0">Only saved on this device.</div>
        <div class="extras"><button class="ghost" id="pcancel">Cancel</button><button class="cta small" id="psave" data-i="${i}">${i<0?'Add':'Save'}</button></div>`; })()
    : mode.startsWith('remove:') ? (()=>{ const i=+mode.split(':')[1];
      return `<h2>Remove ${esc(P[i].name)}?</h2><div class="note" style="margin:0 auto">This deletes ${esc(P[i].name)}'s progress on this device. Write down the backup code first (Settings) if you might want it back.</div>
        <div class="extras"><button class="ghost" id="pcancel">Keep</button><button class="cta small danger" id="prm" data-i="${i}">Remove</button></div>`; })()
    : `<h2>Who's playing?</h2>
      <div class="pgrid">${P.map((p,i)=>`<button class="pbtn ${i===saved.cur?'on':''}" data-i="${i}">${helmetSVG(TEAMS[p.homeT],54)}<span class="pn">${esc(p.name)}</span><span class="ps">${playerLine(p)}</span></button>`).join('')}
        ${canAdd?`<button class="pbtn add" id="padd"><span class="plus">+</span><span class="pn">Add player</span></button>`:''}</div>
      <details class="parents"><summary>Parents: rename or remove</summary>
        ${P.map((p,i)=>`<div class="prow"><span>${esc(p.name)}</span><button class="ghost" data-ren="${i}">Rename</button>${P.length>1?`<button class="ghost" data-rm="${i}">Remove</button>`:''}</div>`).join('')}
      </details>
      <button class="ghost" style="margin-top:14px" id="mclose">Close</button>`;
  m.innerHTML=body; document.body.appendChild(m);
  const inp=m.querySelector('#pname'); if(inp){ inp.focus(); inp.onkeydown=e=>{ if(e.key==='Enter') m.querySelector('#psave').click(); }; }
  m.onclick=e=>{
    const t=e.target.closest('button'); if(!t) return;
    if(t.classList.contains('pbtn')&&t.dataset.i!==undefined){ m.remove(); switchPlayer(+t.dataset.i); }
    else if(t.id==='padd') playersModal('add');
    else if(t.dataset.ren!==undefined) playersModal('rename:'+t.dataset.ren);
    else if(t.dataset.rm!==undefined) playersModal('remove:'+t.dataset.rm);
    else if(t.id==='pcancel') playersModal();
    else if(t.id==='psave'){ const i=+t.dataset.i, nm=cleanName(inp.value); m.remove();
      if(i<0) addPlayer(nm); else { if(nm) P[i].name=nm; store.set(saved); startScreen(); playersModal(); } }
    else if(t.id==='prm'){ removePlayer(+t.dataset.i); m.remove(); startScreen(); playersModal(); }
    else if(t.id==='mclose') m.remove();
  };
}

/* =========================================================
   BACKUP CODE ("game password") — 16 characters, e.g. 7K2Q-M9XD-4TPB-H8RA.
   Holds one player's grade, ladder step, teams, opponent, answer mode and W-L-T record.
   Not included: name (typed when adding a player) and per-fact stats (too big).
   Bits: 64 data bits (scrambled so codes look random and can't be hand-edited) + 16-bit checksum,
   written in Crockford base-32 (no I, L, O, U; typing O/I/L is read as 0/1/1).
   ========================================================= */
/* APPEND ONLY — a code stores positions in these lists. Never reorder or remove entries,
   or every code already written down will decode to the wrong step/team. */
const CODE_STEP_IDS=['add5','add10','addsub10','add20','addsub20','tens','add2d1d','mul2510','regroup','add2d','sub2d','mul25div','muldiv25','mul69','muldivall','addsub3d','multens','mul2d1d','mul3d1d','divrem','div2d1d'];
const CODE_TEAMS=['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LV','LAC','LAR','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SF','SEA','TB','TEN','WAS'];
const CODE_FORMAT=1;
/* field: [name, bits]. Total must stay 64; take new fields out of `spare`. */
const CODE_FIELDS=[['fmt',3],['grade',3],['step',6],['home',6],['away',6],['opp',2],['ans',2],['w',10],['l',10],['t',7],['spare',9]];
const B32='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function crc16(bits){ let c=0xFFFF; for(const b of bits){ const top=((c>>15)&1)^b; c=(c<<1)&0xFFFF; if(top) c^=0x1021; } return c; }
function keystream(seed,n){ let x=(seed*2654435761+0x9E3779B9)>>>0, out=[]; for(let i=0;i<n;i++){ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; out.push(x&1); } return out; }
const toBits=(v,n)=>Array.from({length:n},(_,i)=>(v>>(n-1-i))&1);
const fromBits=b=>b.reduce((a,x)=>a*2+x,0);
function backupCode(p=me()){
  const val={fmt:CODE_FORMAT, grade:p.grade, step:Math.max(0,CODE_STEP_IDS.indexOf(p.stepId)), home:Math.max(0,CODE_TEAMS.indexOf(p.homeT)), away:Math.max(0,CODE_TEAMS.indexOf(p.awayT)),
    opp:Math.max(0,OPPS.indexOf(p.opp)), ans:Math.max(0,AMODES.indexOf(p.ansMode)), w:Math.min(1023,p.record.w), l:Math.min(1023,p.record.l), t:Math.min(127,p.record.t), spare:0};
  const data=CODE_FIELDS.flatMap(([k,n])=>toBits(val[k],n));
  const sum=crc16(data), ks=keystream(sum,64), bits=[...data.map((b,i)=>b^ks[i]),...toBits(sum,16)];
  let s=''; for(let i=0;i<80;i+=5) s+=B32[fromBits(bits.slice(i,i+5))];
  return s.match(/.{4}/g).join('-');
}
/* returns the decoded progress, or null if the code is mistyped */
function readCode(str){
  const s=String(str).toUpperCase().replace(/[\s-]/g,'').replace(/O/g,'0').replace(/[IL]/g,'1');
  if(s.length!==16||[...s].some(c=>!B32.includes(c))) return null;
  const bits=[...s].flatMap(c=>toBits(B32.indexOf(c),5));
  const sum=fromBits(bits.slice(64)), ks=keystream(sum,64), data=bits.slice(0,64).map((b,i)=>b^ks[i]);
  if(crc16(data)!==sum) return null;
  const val={}; let at=0; for(const [k,n] of CODE_FIELDS){ val[k]=fromBits(data.slice(at,at+n)); at+=n; }
  if(val.fmt!==CODE_FORMAT||val.grade>=GRADES.length||!CODE_STEP_IDS[val.step]||!(CODE_STEP_IDS[val.step] in SI)||!CODE_TEAMS[val.home]||!CODE_TEAMS[val.away]||val.opp>2||val.ans>2) return null;
  return {grade:val.grade, stepId:CODE_STEP_IDS[val.step], homeT:CODE_TEAMS[val.home], awayT:CODE_TEAMS[val.away], opp:OPPS[val.opp], ansMode:AMODES[val.ans], record:{w:val.w,l:val.l,t:val.t}};
}
function restoreCode(p,data){ Object.assign(p,data,{win:[]}); fixPlayer(p); store.set(saved); }

/* Settings rows for the current player's backup code */
function backupHTML(){
  const p=me();
  return `<div class="setrow"><span class="label">${esc(p.name)}'s backup code</span>
      <div class="bcode" id="bcode">${backupCode(p)}</div>
      <div class="extras" style="margin-top:6px"><button class="ghost" id="bcopy">Copy</button><button class="ghost" id="bopen">Enter a code</button></div>
      <div class="note">Write it down. It brings back ${esc(p.name)}'s grade, math step, teams and record on any device. Copy a fresh one now and then — it changes as the record changes.</div>
      <div id="brestore"></div></div>`;
}
function bindBackup(){
  $('#bcopy').onclick=()=>{ const c=$('#bcode').textContent; const done=()=>{ $('#bcopy').textContent='Copied!'; setTimeout(()=>{ const b=$('#bcopy'); if(b) b.textContent='Copy'; },1500); };
    try{ navigator.clipboard.writeText(c).then(done,()=>{}); }catch(e){} };
  $('#bopen').onclick=()=>{ $('#brestore').innerHTML=`<input class="pname code" id="bin" maxlength="19" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX">
      <div class="extras" style="margin-top:6px"><button class="cta small" id="bcheck">Check code</button></div><div id="bmsg"></div>`;
    $('#bin').focus();
    $('#bcheck').onclick=()=>{ const d=readCode($('#bin').value), p=me();
      if(!d){ $('#bmsg').innerHTML=`<div class="note bad">That code doesn't work. Check each letter and try again.</div>`; return; }
      $('#bmsg').innerHTML=`<div class="note">This code has: <b>${gradeName(d.grade)}</b>, math step <b>${SI[d.stepId]+1}</b> (${STEPS[SI[d.stepId]].tag}), ${TEAMS[d.homeT].name}, record <b>${d.record.w}–${d.record.l}${d.record.t?'–'+d.record.t:''}</b>.<br>Put it on <b>${esc(p.name)}</b>? This replaces ${esc(p.name)}'s current progress.</div>
        <div class="extras" style="margin-top:6px"><button class="ghost" id="bno">Cancel</button><button class="cta small" id="byes">Use this code</button></div>`;
      $('#bno').onclick=()=>{ $('#brestore').innerHTML=''; };
      $('#byes').onclick=()=>{ restoreCode(p,d); startScreen(); };
    };
  };
}

/* Runs at load, so it must stay at the very bottom: it uses consts defined above (cleanName, …). */
migrateSave();

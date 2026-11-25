/* =========================================================
   ARCHIVED: player cards + locker room (from v5.5, commit ae9d1df)
   NOT loaded by index.html. Kept so the feature can come back.

   What it was: each player on your team (QB, RB, 3 WRs, K) had a card with a
   rating (from a hash of the name, ~75-85) that went up 1 point for every
   10 right answers on plays that player made. The locker room screen showed
   the cards plus a 10x10 "times table map" coloured from saved.facts.
   In every released version cardXP() was a no-op, so no one ever earned points.

   To bring it back:
   1. Paste the JS into index.html (GAME STATE / SCREENS) and the CSS into <style>.
   2. Replace the no-op: rename _cardXPold -> cardXP and call cardXP('QB'|'RB'|'WR0'..|'K')
      from recordAnswer() / runPlay() / touchdown() / fieldGoal() for the player who made the play.
   3. Put 'cards:{}' back in the saved defaults. Bump SAVE_VERSION and add a migrateSave()
      step (the v2 step deletes saved.cards from old saves - it was always empty).
   4. Add a way in (e.g. a "Locker room" button on the start screen, startScreen()).
   Needs from index.html: TEAMS, RS(), helmetSVG(), norm(), saved, store, G, lower(), ding(), $.
   ========================================================= */

/* ---------- player cards: ratings grow with correct answers ---------- */
const CARD_SLOTS=[
  {k:'QB',pos:'QB',attr:'ARM',pw:'Pass & deep plays'},
  {k:'RB',pos:'RB',attr:'SPEED',pw:'Run plays'},
  {k:'WR0',pos:'WR',attr:'HANDS',pw:'Catches'},
  {k:'WR1',pos:'WR',attr:'ROUTES',pw:'Catches'},
  {k:'WR2',pos:'WR',attr:'HANDS',pw:'Catches'},
  {k:'K',pos:'K',attr:'LEG',pw:'Field goals & extra points'}];
function slotPlayer(team,k){ const R=RS(team); return k==='QB'?R.QB:k==='RB'?R.RB:k==='K'?R.K:R.WR[+k[2]]; }
const SLOT_BASE={QB:82,RB:80,WR0:81,WR1:78,WR2:76,K:75};
function baseRating(name,k){ let h=0; for(const ch of name) h=(h*31+ch.charCodeAt(0))>>>0; return (SLOT_BASE[k]||76)+(h%4); }
function cardOf(team,k){ const [num,name]=slotPlayer(team,k); const s=saved.cards[team+':'+k]||{lv:0,p:0}; return {num,name,rating:Math.min(99,baseRating(name,k)+s.lv),p:s.p}; }
function cardXP(){}
function _cardXPold(k){
  const key=G.homeT+':'+k; const s=saved.cards[key]||{lv:0,p:0}; s.p++;
  let up=null;
  if(s.p>=10){ s.p=0; s.lv++; const c=cardOf(G.homeT,k); up=`${c.name} → ${Math.min(99,c.rating+1)}`; G.ups.push(up); }
  saved.cards[key]=s; store.set(saved);
  if(up){ setTimeout(()=>{ lower(`⬆ UPGRADE: ${up}`,'good'); ding(); },200); }
}

/* ---------- locker room ---------- */
function factState(a,b){ const f=saved.facts[norm(`${a}x${b}`)]; if(!f) return 'rgba(255,255,255,.08)'; const [ok,no]=f, n=ok+no, acc=ok/n;
  if(ok>=3&&acc>=.8) return '#2e9e4f'; if(no>=2&&acc<.6) return '#e0533a'; return '#e7b416'; }
function lockerRoom(team){
  const t=TEAMS[team];
  const cards=CARD_SLOTS.map(s=>{ const c=cardOf(team,s.k); const tier=c.rating>=88?['ELITE','#7fd3ff']:c.rating>=82?['GOLD','#d9a92b']:c.rating>=77?['SILVER','#aeb6c0']:['BRONZE','#b5793f'];
    return `<div class="pcard" style="background:${tier[1]}"><div class="in">
      <div class="rt"><div class="rating cf">${c.rating}</div><div class="tier" style="color:${tier[1]};border-color:${tier[1]}">${tier[0]}</div></div>
      <div class="who">${helmetSVG(t,46)}<div><div class="no">#${c.num}</div><div class="pos">${s.pos} · ${s.attr}</div></div></div>
      <div class="name">${c.name}</div>
      <div class="pw">Powered by: ${s.pw}</div>
      <div class="prog">${Array.from({length:10},(_,i)=>`<i class="${i<c.p?'on':''}"></i>`).join('')}</div>
      <div class="pn">${c.p}/10 to reach ${Math.min(99,c.rating+1)}</div></div></div>`; }).join('');
  let grid='<div></div>'+Array.from({length:10},(_,i)=>`<div>${i+1}</div>`).join('');
  for(let a=1;a<=10;a++){ grid+=`<div>${a}</div>`; for(let b=1;b<=10;b++) grid+=`<div style="background:${factState(a,b)}"></div>`; }
  $('#app').innerHTML=`<div class="locker">
    <div class="lhead"><div><div class="label" style="color:#7fd3ff">${t.city} ${t.name}</div><h1>LOCKER ROOM</h1></div>
      <button class="ghost" id="back">◀ Back</button></div>
    <div class="note" style="max-width:none">Your players get better as you get problems right. Every 10 right answers upgrades the player who made the play.</div>
    <div class="cards">${cards}</div>
    <div class="map glass"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap"><div class="cf" style="font-weight:900;font-size:22px">TIMES TABLE MAP</div><div class="label">Coach view · all games on this device</div></div>
      <div class="mgrid">${grid}</div>
      <div class="legend"><span><i style="background:#2e9e4f"></i>Mastered</span><span><i style="background:#e7b416"></i>Learning</span><span><i style="background:#e0533a"></i>Needs practice</span><span><i style="background:rgba(255,255,255,.12)"></i>Not seen yet</span></div></div>
  </div>`;
  $('#back').onclick=startScreen;
}

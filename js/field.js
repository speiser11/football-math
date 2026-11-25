/* Football Math — field.js: Per-game state (G) and everything drawn on the field: formations, broadcast camera, players, play animations.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   GAME STATE
   ========================================================= */
let G={};
const T=()=>TEAMS[G.homeT], O=()=>TEAMS[G.awayT];
function newGame(){
  G={homeT:me().homeT, awayT:me().awayT, qLen:saved.qLen, pclock:saved.pclock,
     q:1, clock:saved.qLen, ot:false, home:0, away:0, pos:25, down:1, toGo:10,
     right:0, total:0, bursts:0, missed:[], redo:{easy:[],medium:[],hard:[]},
     offSide:'home', dir:1, lines:true, startStep:me().stepId};
  GAME++; ANIM=null; ACT=[]; FX=[]; BALL={segs:[{t0:0,t1:1,type:'ground',x:35,y:MIDY}]}; cam={x:40,y:MIDY,init:false};
  buildCrowd();
}
function spotText(pos){ if(pos===50)return '50'; return pos<50?`${T().abbr} ${pos}`:`${O().abbr} ${100-pos}`; }
const ord=n=>['','1st','2nd','3rd','4th'][Math.max(1,Math.min(4,n))];

/* right/wrong per basic fact for the Coach's Corner: keys like "6x7", "5+8", "13-5", "42/6".
   Only facts with small numbers (a+b, a×b with a,b ≤ 12) — big problems aren't "facts". */
function factLog(p,ok){ const k=norm(p.key), m=k.match(/^(\d+)([+x\-\/])(\d+)$/); if(!m) return;
  const a=+m[1], b=+m[3], small= m[2]==='-'?a<=24&&b<=12 : m[2]==='/'?b<=12&&a/b<=12 : a<=12&&b<=12; if(!small) return;
  const f=me().facts[k]||[0,0]; f[ok?0:1]++; me().facts[k]=f; }

/* =========================================================
   FIELD + PLAYERS (canvas)
   ========================================================= */
const OFF_ROLES=['C','LG','RG','LT','RT','TE','QB','RB','WR1','WR2','WR3'];
const DEF_ROLES=['DE1','DT1','DT2','DE2','LB1','MLB','LB2','CB1','CB2','S1','S2'];
const OFF_POS={C:[-.7,0],LG:[-.9,-1.4],RG:[-.9,1.4],LT:[-1.1,-2.8],RT:[-1.1,2.8],TE:[-1.3,4.3],QB:[-4.5,0],RB:[-6.3,0],WR1:[-1,-17],WR2:[-1,16],WR3:[-1.5,-10]};
const KICK_POS={...OFF_POS,QB:[-7,0],RB:[-9.8,-1.8],WR1:[-1.3,-5.6],WR2:[-1.3,5.6],WR3:[-1.5,-7]};
const PUNT_POS={...OFF_POS,QB:[-14,0],RB:[-5.5,-1.2],WR1:[-1,-18],WR2:[-1,17],WR3:[-1.5,-6]};
const DEF_POS={DE1:[1,-4.2],DT1:[1,-1.4],DT2:[1,1.4],DE2:[1,4.2],LB1:[5,-4.5],MLB:[5,.5],LB2:[5,5],CB1:[6,-17],CB2:[6,16],S1:[13,-7],S2:[13,7]};
const DEF_KICK={...DEF_POS,CB1:[1.5,-6.5],CB2:[1.5,6.5],LB1:[2,-5.5],LB2:[2,5.5],S1:[8,-3],S2:[8,3]};
const DEF_PUNT={...DEF_POS,S1:[42,0],S2:[16,3]};

let ACT=[], FX=[], BALL={segs:[]}, ANIM=null, cam={x:40,y:MIDY,init:false}, CROWD=[];
const actor=(side,role)=>ACT.find(a=>a.side===side&&a.role===role);

function buildCrowd(){
  CROWD=[]; const h=T(), a=O(); const cols=[h.c1,h.c1,h.c2,h.c1,'#ffffff',a.c1,a.c2,'#d9d9d9'];
  for(let i=0;i<1400;i++){ const top=i%2===0; CROWD.push({x:-10+Math.random()*140, y: top? -2-Math.random()*12 : FW+2+Math.random()*12, c:pick(cols), p:Math.random()*6.28}); }
}

async function setFormation(offSide,losPos,kind='normal',dur=650){
  const d=offSide==='home'?1:-1, X0=10+losPos;
  const op=kind==='kick'?KICK_POS:kind==='punt'?PUNT_POS:OFF_POS;
  const dp=kind==='kick'?DEF_KICK:kind==='punt'?DEF_PUNT:(offSide==='home'&&G.look&&typeof LOOK_POS!=='undefined'&&LOOK_POS[G.look])?LOOK_POS[G.look]:DEF_POS;
  const first=!ACT.length;
  if(first){ for(const s of ['home','away']) for(let i=0;i<11;i++) ACT.push({side:s,i,x:0,y:MIDY,face:0,kf:null}); }
  let maxD=0;
  ACT.forEach(a=>{ const isOff=a.side===offSide; a.role=isOff?OFF_ROLES[a.i]:DEF_ROLES[a.i];
    const [dx,dy]=(isOff?op:dp)[a.role]; a.tx=clampX(X0+d*dx); a.ty=clampY(MIDY+dy);
    a.baseFace=isOff?(d>0?0:Math.PI):(d>0?Math.PI:0); a.jump=false;
    if(first){a.x=a.tx;a.y=a.ty;a.face=a.baseFace;}
    maxD=Math.max(maxD,Math.hypot(a.x-a.tx,a.y-a.ty)); });
  G.offSide=offSide; G.dir=d;
  const b=ballAt(1);
  if(first||maxD<.3||dur===0){ ACT.forEach(a=>{a.x=a.tx;a.y=a.ty;a.face=a.baseFace;a.kf=null}); BALL.segs=[{t0:0,t1:1,type:'ground',x:X0,y:MIDY}]; return; }
  BALL.segs=[{t0:0,t1:1,type:'fly',x0:b.x,y0:b.y,x1:X0,y1:MIDY,h:1.2}];
  ACT.forEach(a=>{a.kf=[[0,a.x,a.y],[1,a.tx,a.ty]]});
  await runAnim(dur);
  ACT.forEach(a=>a.face=a.baseFace);
}

function runAnim(dur,events=[]){ return new Promise(res=>{ ANIM={start:performance.now(),dur,t:0,events:events.map(e=>({...e,done:false})),res}; }); }
function kfAt(kf,t){ if(t<=kf[0][0]) return {x:kf[0][1],y:kf[0][2]}; for(let i=0;i<kf.length-1;i++){ if(t<=kf[i+1][0]){ const span=(kf[i+1][0]-kf[i][0])||1, u=(t-kf[i][0])/span; return {x:lerp(kf[i][1],kf[i+1][1],u), y:lerp(kf[i][2],kf[i+1][2],u)}; } } const l=kf[kf.length-1]; return {x:l[1],y:l[2]}; }
function ballAt(t){
  const segs=BALL.segs; if(!segs||!segs.length) return {x:60,y:MIDY,h:0};
  let s=segs.find(s=>t>=s.t0&&t<=s.t1)||segs[segs.length-1];
  if(s.type==='hold'){ const a=s.a; return {x:a.x+Math.cos(a.face)*.45, y:a.y+Math.sin(a.face)*.45, h:.4, holder:a}; }
  if(s.type==='fly'){ const u=Math.max(0,Math.min(1,(t-s.t0)/((s.t1-s.t0)||1))); return {x:lerp(s.x0,s.x1,u), y:lerp(s.y0,s.y1,u), h:4*s.h*u*(1-u), fly:true}; }
  return {x:s.x,y:s.y,h:0};
}
const lerpAngle=(a,b,t)=>{let d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI; return a+d*t;};
function addFX(x,y,text,kind='boom'){FX.push({x,y,text,kind,t0:performance.now(),dur:kind==='boom'?700:1300});}

function frame(now){
  requestAnimationFrame(frame);
  const cv=document.getElementById('cv'); if(!cv) return;
  if(ANIM){
    const t=Math.min(1,(now-ANIM.start)/ANIM.dur); ANIM.t=t;
    ACT.forEach(a=>{ if(!a.kf) return; const p=kfAt(a.kf,t); const dx=p.x-a.x, dy=p.y-a.y; if(Math.hypot(dx,dy)>.015) a.face=lerpAngle(a.face,Math.atan2(dy,dx),.25); a.x=p.x; a.y=p.y; });
    ANIM.events.forEach(e=>{ if(!e.done&&t>=e.t){e.done=true; try{e.fn()}catch(err){}} });
    if(t>=1){ const res=ANIM.res; const b=ballAt(1); const last=BALL.segs[BALL.segs.length-1];
      BALL.segs = (last&&last.type==='hold')?[{t0:0,t1:1,type:'hold',a:last.a}]:[{t0:0,t1:1,type:'ground',x:b.x,y:b.y}];
      ACT.forEach(a=>a.kf=null); ANIM=null; setTimeout(res,220); }
  }
  draw(cv,now);
}
requestAnimationFrame(frame);


/* =========================================================
   BROADCAST CAMERA: perspective field, upright players
   ========================================================= */
function buildCrowd(){
  CROWD=[]; const h=T(), a=O(); const cols=[h.c1,h.c1,h.c2,h.c1,'#e9e4da',a.c1,a.c2,'#b9c0c8'];
  for(let i=0;i<900;i++) CROWD.push({u:Math.random(), v:Math.random(), c:pick(cols), p:Math.random()*6.28});
}
const OFF_NUMS={C:62,LG:66,RG:64,LT:71,RT:77,TE:87}, DEF_NUMS={DE1:97,DT1:91,DT2:95,DE2:99,LB1:54,MLB:50,LB2:52,CB1:24,CB2:21,S1:30,S2:33};
function jerseyNum(a){
  const team=a.side==='home'?G.homeT:G.awayT, R=RS(team);
  if(a.side===G.offSide){
    if(a.role==='QB') return R.QB[0]; if(a.role==='RB') return R.RB[0];
    if(a.role==='WR1') return R.WR[0][0]; if(a.role==='WR2') return R.WR[1][0]; if(a.role==='WR3') return R.WR[2][0];
    return OFF_NUMS[a.role]??'';
  }
  return DEF_NUMS[a.role]??'';
}
function draw(cv,now){
  const dpr=Math.min(2,window.devicePixelRatio||1), W=cv.clientWidth, H=cv.clientHeight;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);}
  const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0);
  const home=T(), away=O();
  const standH=H*.2, fTop=standH, fBot=H+H*.04;
  const Y0w=-2.5, Y1w=FW+2.5;
  const viewNear=W<600?34:52, Sn=W/viewNear, Sf=Sn*.58;
  const dep=y=>(y-Y0w)/(Y1w-Y0w), S=y=>Sf+(Sn-Sf)*dep(y), Y=y=>fTop+dep(y)*(fBot-fTop);
  const Vy=(fBot-fTop)/(Y1w-Y0w);
  const b=ballAt(ANIM?ANIM.t:1);
  let tx=b.x+G.dir*(ANIM?3:9);
  tx=Math.max(viewNear/2-8,Math.min(128-viewNear/2,tx));
  if(!cam.init){cam.x=tx;cam.init=true;}
  cam.x+=(tx-cam.x)*(ANIM?.08:.05);
  const X=(x,y)=>W/2+(x-cam.x)*S(y);
  const quad=(x0,x1,y0,y1,fill)=>{ ctx.beginPath(); ctx.moveTo(X(x0,y0),Y(y0)); ctx.lineTo(X(x1,y0),Y(y0)); ctx.lineTo(X(x1,y1),Y(y1)); ctx.lineTo(X(x0,y1),Y(y1)); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); };
  const line=(x0,y0,x1,y1)=>{ ctx.beginPath(); ctx.moveTo(X(x0,y0),Y(y0)); ctx.lineTo(X(x1,y1),Y(y1)); ctx.stroke(); };
  // night sky + stands
  ctx.fillStyle='#070b14'; ctx.fillRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,standH); g.addColorStop(0,'#0b1220'); g.addColorStop(1,'#141b28'); ctx.fillStyle=g; ctx.fillRect(0,0,W,standH+2);
  const cheering=G.cheerUntil>now, span=W*1.8, off=(cam.x*Sf*.6)%span;
  for(const c of CROWD){
    let px=c.u*span-off; if(px<-span*.2) px+=span; if(px>W+4) continue;
    const py=standH*.18+c.v*standH*.8, bob=cheering?Math.abs(Math.sin(now/90+c.p))*3:0, s=1.6+c.v*1.6;
    ctx.fillStyle=c.c; ctx.globalAlpha=.55+c.v*.4; ctx.fillRect(px,py-bob,s,s*1.3);
  }
  ctx.globalAlpha=1;
  for(const lx of [.12,.38,.62,.88]){ const gx=W*lx, gl=ctx.createRadialGradient(gx,4,0,gx,4,W*.22); gl.addColorStop(0,'rgba(210,228,255,.35)'); gl.addColorStop(1,'rgba(210,228,255,0)'); ctx.fillStyle=gl; ctx.fillRect(0,0,W,H*.55); ctx.fillStyle='#f4f8ff'; ctx.fillRect(gx-14,2,28,5); }
  // wall
  ctx.fillStyle='#10213a'; ctx.fillRect(0,standH-4,W,6);
  // turf
  quad(-12,132,Y0w,Y1w,'#1e5226');
  for(let x=10;x<110;x+=10) quad(x,x+5,-1,FW+1,'#1b4a22');
  quad(0,10,0,FW,home.c1); quad(110,120,0,FW,away.c1);
  // end zone names
  for(const [cx,t,rot] of [[5,home,-1],[115,away,1]]){
    const sx=X(cx,MIDY), sy=Y(MIDY), sc=S(MIDY);
    if(sx<-200||sx>W+200) continue;
    ctx.save(); ctx.translate(sx,sy); ctx.scale(1,Vy/sc*1.6); ctx.rotate(rot*Math.PI/2);
    ctx.font=`900 ${3.6*sc}px 'Saira Condensed', sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=(t.c2==='#000000'||t.c2===t.c1)?'#ffffff':t.c2; ctx.fillText(t.name.toUpperCase(),0,0); ctx.restore();
  }
  // lines
  ctx.strokeStyle='rgba(255,255,255,.85)';
  for(let x=10;x<=110;x+=5){ ctx.lineWidth=(x===10||x===110)?2.4:1.3; line(x,0,x,FW); }
  ctx.lineWidth=2.4; line(0,0,120,0); line(0,FW,120,FW); line(0,0,0,FW); line(120,0,120,FW);
  ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,.6)';
  for(let x=11;x<110;x++){ if((x-10)%5===0)continue; for(const hy of [.7,23.58,29.73,FW-.7]) line(x,hy-.35,x,hy+.35); }
  // numbers
  ctx.fillStyle='rgba(255,255,255,.78)'; ctx.textAlign='center'; ctx.textBaseline='middle';
  for(let yd=10;yd<=90;yd+=10){ const n=yd<=50?yd:100-yd;
    for(const ny of [FW-8.5,8.5]){ const sc=S(ny), px=X(10+yd,ny); if(px<-60||px>W+60) continue;
      ctx.save(); ctx.translate(px,Y(ny)); ctx.scale(1,Vy/sc*1.5); ctx.font=`800 ${2.4*sc}px 'Saira Condensed', sans-serif`; ctx.fillText(n,0,0); ctx.restore(); } }
  // midfield logo
  { const sc=S(MIDY); ctx.beginPath(); ctx.ellipse(X(60,MIDY),Y(MIDY),3.8*sc,3.8*Vy,0,0,6.29); ctx.fillStyle=home.c1; ctx.globalAlpha=.85; ctx.fill(); ctx.globalAlpha=1; ctx.lineWidth=2; ctx.strokeStyle=home.c2; ctx.stroke();
    ctx.save(); ctx.translate(X(60,MIDY),Y(MIDY)); ctx.scale(1,Vy/sc*1.4); ctx.font=`900 ${2.2*sc}px 'Saira Condensed', sans-serif`; ctx.fillStyle=(home.c2==='#000000')?'#fff':home.c2; ctx.fillText(home.abbr,0,0); ctx.restore(); }
  // scrimmage + first down (glow)
  if(!ANIM && G.lines && G.offSide==='home'){
    ctx.save(); ctx.shadowBlur=12; ctx.lineWidth=4;
    ctx.shadowColor=ctx.strokeStyle='#3fa9f5'; line(10+G.pos,0,10+G.pos,FW);
    if(100-G.pos>G.toGo){ ctx.shadowColor=ctx.strokeStyle='#ffd23f'; line(10+G.pos+G.toGo,0,10+G.pos+G.toGo,FW); }
    ctx.restore();
  }
  // goal posts (far end of each end zone, standing up)
  for(const gx of [0,120]){ const px=X(gx,MIDY); if(px<-80||px>W+80) continue; const sc=S(MIDY), base=Y(MIDY), cb=base-3*sc;
    ctx.strokeStyle='#ffd23f'; ctx.lineWidth=Math.max(2,.35*sc); ctx.beginPath(); ctx.moveTo(px,base); ctx.lineTo(px,cb);
    ctx.moveTo(X(gx,MIDY-3.08),cb); ctx.lineTo(X(gx,MIDY+3.08),cb); ctx.moveTo(X(gx,MIDY-3.08),cb); ctx.lineTo(X(gx,MIDY-3.08),cb-6*sc); ctx.moveTo(X(gx,MIDY+3.08),cb); ctx.lineTo(X(gx,MIDY+3.08),cb-6*sc); ctx.stroke(); }
  // players (far first)
  const holder=b.holder;
  [...ACT].sort((p,q)=>p.y-q.y).forEach(a=>{ const px=X(a.x,a.y); if(px<-60||px>W+60) return; drawPlayer(ctx,a,px,Y(a.y),S(a.y),now,a===holder); });
  // ball
  { const sc=S(b.y), bx=X(b.x,b.y), by=Y(b.y);
    if(!holder||b.fly){ ctx.fillStyle='rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(bx,by,.35*sc,.12*sc,0,0,6.29); ctx.fill(); }
    if(!holder||b.fly){ const lift=(b.h*.9+(b.fly?0:.15))*sc, s2=1+b.h*.04;
      ctx.save(); ctx.translate(bx,by-lift); ctx.rotate(b.fly?(G.dir>0?-.25:.25)+Math.sin(now/50)*.15:0);
      ctx.fillStyle='#8b4a1c'; ctx.strokeStyle='#3d1c06'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,0,.42*sc*s2,.25*sc*s2,0,0,6.29); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#fff'; ctx.beginPath(); ctx.moveTo(-.14*sc,0); ctx.lineTo(.14*sc,0); ctx.stroke(); ctx.restore(); } }
  // fx
  FX=FX.filter(f=>now-f.t0<f.dur);
  for(const f of FX){ const age=(now-f.t0)/f.dur, sc=S(f.y), px=X(f.x,f.y), py=Y(f.y);
    if(f.kind==='boom'){ ctx.strokeStyle=`rgba(255,255,255,${1-age})`; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(px,py-sc*.8,(.6+age*2.4)*sc,(.6+age*2.4)*sc*.5,0,0,6.29); ctx.stroke(); }
    if(f.text){ ctx.save(); ctx.globalAlpha=1-Math.max(0,age-.6)/.4; ctx.font=`900 ${Math.max(18,2.2*sc)}px 'Saira Condensed', sans-serif`; ctx.textAlign='center'; ctx.lineWidth=5; ctx.strokeStyle='#000'; const yy=py-sc*3.2-age*sc*1.5; ctx.strokeText(f.text,px,yy); ctx.fillStyle='#ffd23f'; ctx.fillText(f.text,px,yy); ctx.restore(); }
  }
}
function drawPlayer(ctx,a,px,py,u,now,isHolder){
  const t=TEAMS[a.side==='home'?G.homeT:G.awayT], home=a.side==='home';
  const jersey=home?t.c1:'#f4f4f4', numc=home?((t.c2==='#000000'||t.c2===t.c1)?'#ffffff':t.c2):t.c1, pants=home?(t.h===t.c1?'#e9e9e9':t.h):'#e3e3e3';
  const moving=Math.hypot(a.x-(a.lx??a.x),a.y-(a.ly??a.y))>.01; a.lx=a.x; a.ly=a.y;
  const dir=Math.cos(a.face)>=0?1:-1;
  let lift=0; if(a.jump) lift=Math.abs(Math.sin(now/120+a.i))*u*.9;
  const stride=moving?Math.sin(now/70+a.i)*u*.18:0;
  // shadow + carrier ring
  if(isHolder){ ctx.save(); ctx.shadowBlur=10; ctx.shadowColor='#ffd23f'; ctx.strokeStyle='rgba(255,210,63,.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(px,py,.9*u,.32*u,0,0,6.29); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle='rgba(0,0,0,.38)'; ctx.beginPath(); ctx.ellipse(px+.2*u,py,.62*u,.2*u,0,0,6.29); ctx.fill();
  const by=py-lift;
  // legs
  ctx.fillStyle=pants; ctx.fillRect(px-.3*u+stride,by-.95*u,.24*u,.95*u); ctx.fillRect(px+.06*u-stride,by-.95*u,.24*u,.95*u);
  ctx.fillStyle='#111'; ctx.fillRect(px-.32*u+stride,by-.12*u,.28*u,.12*u); ctx.fillRect(px+.04*u-stride,by-.12*u,.28*u,.12*u);
  // torso
  const tw=1.0*u, th=.95*u, tx=px-tw/2, ty=by-.95*u-th;
  ctx.fillStyle=jersey; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(tx,ty,tw,th,.22*u); else ctx.rect(tx,ty,tw,th); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.stroke();
  if(u>7){ ctx.fillStyle=numc; ctx.font=`900 ${.62*u}px 'Saira Condensed', sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(jerseyNum(a),px,ty+th*.52); }
  // helmet
  const hx=px+dir*.06*u, hy=ty-.3*u;
  ctx.fillStyle=t.h; ctx.beginPath(); ctx.arc(hx,hy,.38*u,0,6.29); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.4)'; ctx.stroke();
  ctx.strokeStyle=(t.h===t.c2?t.c1:t.c2); ctx.lineWidth=Math.max(1,.1*u); ctx.beginPath(); ctx.arc(hx,hy,.27*u,Math.PI*1.15,Math.PI*1.85); ctx.stroke();
  ctx.strokeStyle='#cfcfcf'; ctx.lineWidth=Math.max(1,.08*u); ctx.beginPath(); ctx.moveTo(hx+dir*.22*u,hy-.05*u); ctx.lineTo(hx+dir*.44*u,hy+.02*u); ctx.lineTo(hx+dir*.36*u,hy+.26*u); ctx.stroke();
}

/* =========================================================
   PLAY ANIMATIONS
   spec.kind: run | pass | bomb | inc | int | sack | fg | punt
   ========================================================= */
async function animPlay(side,losPos,spec){
  const form=spec.kind==='fg'?'kick':spec.kind==='punt'?'punt':'normal';
  await setFormation(side,losPos,form);
  await wait(250);
  const d=side==='home'?1:-1, X0=10+losPos, Y0=MIDY, offS=side, defS=side==='home'?'away':'home';
  const Of=ro=>actor(offS,ro), Df=ro=>actor(defS,ro);
  ACT.forEach(a=>a.kf=[[0,a.x,a.y]]);
  const K=(a,t,x,y)=>{ const l=a.kf[a.kf.length-1]; a.kf.push([Math.max(t,l[0]+.001),clampX(x),clampY(y)]); };
  const kind=spec.kind, g=spec.gain||0, td=!!spec.td;
  const ezX=side==='home'?113:7, endX=td?ezX:X0+d*g;
  const QB=Of('QB'), RB=Of('RB');
  let E, segs, ev=[{t:.06,fn:hut}], dur=2700, out={};
  const happy=side==='home'; // home crowd cheers when the home team does well
  const nearestDef=y=>['CB1','CB2','S1','S2'].map(Df).sort((p,q)=>Math.abs(p.y-y)-Math.abs(q.y-y))[0];

  if(kind==='run'){
    const cut=pick([-2.4,2.4,-1.2,1.2]), short=!td&&g<=2, tE=td?.95:short?.58:.88;
    const hx=QB.x-d*.4;
    K(QB,.1,QB.x,QB.y); K(QB,.2,hx,Y0+(cut>0?-.6:.6)); K(QB,.55,hx-d*1.5,Y0+(cut>0?-2:2));
    K(RB,.1,RB.x,RB.y); K(RB,.21,hx,Y0+(cut>0?.7:-.7)); K(RB,.4,X0+d*.8,Y0+cut);
    const ey=clampY(Y0+cut+r(-3,3)); K(RB,tE,endX,ey); if(!td) K(RB,Math.min(1,tE+.08),endX+d*.6,ey);
    segs=[{t0:0,t1:.2,type:'hold',a:QB},{t0:.2,t1:1,type:'hold',a:RB}];
    const Tk=Df(short?pick(['DT1','DT2']):'MLB'); K(Tk,.12,Tk.x,Tk.y); K(Tk,tE,td?endX-d*4:endX+d*.9,ey+(td?2:.4));
    E={x:endX,y:ey,t:tE}; out.carrier=RB;
    ev.push({t:.21,fn:()=>nz({dur:.05,type:'bandpass',f:900,q:2,v:.2,a:.002})});
    if(!short) ev.push({t:.45,fn:()=> happy? roar(g>=10||td?1.15:.65,1.9) : (g>=10?ooh():null)});
    if(!td) ev.push({t:tE,fn:()=>{hit(short?1.35:.9+g/25); addFX(endX,ey,short?'STUFFED':''); if(short){ happy?aww():roar(1,1.6); }}});
    dur=short?2200:2700;
  }
  else if(kind==='pass'||kind==='bomb'||kind==='inc'||kind==='int'){
    const bomb=kind==='bomb'||spec.deep, drop=bomb?5:3, thT=.36, cT=bomb?.72:.6;
    K(QB,.1,QB.x,QB.y); K(QB,.32,QB.x-d*drop,Y0); const qx=QB.x-d*drop;
    const W=Of(spec.target||pick(bomb?['WR1','WR2']:['WR1','WR2','WR3','TE']));
    let cd; if(kind==='inc'||kind==='int') cd=bomb?r(18,28):r(8,13); else { const yac=td?r(0,3):bomb?r(2,5):r(1,3); cd=Math.max(3,g-yac); }
    cd=Math.min(cd,Math.abs((side==='home'?118:2)-X0));
    const cx=X0+d*cd, cy=clampY(W.y+(Y0-W.y)*.4+r(-2,2));
    K(W,.1,W.x,W.y); K(W,cT,cx,cy);
    const Cv=nearestDef(W.y); K(Cv,.1,Cv.x,Cv.y);
    const fh=bomb?9:3.5;
    if(kind==='inc'){
      const lx=cx+d*2.5, ly=clampY(cy+pick([-2,2]));
      K(W,cT+.12,cx+d*2.5,cy); K(Cv,cT,cx+d*.8,cy+.8); K(Cv,cT+.12,cx+d*1.6,cy+1.2);
      segs=[{t0:0,t1:thT,type:'hold',a:QB},{t0:thT,t1:cT+.04,type:'fly',x0:qx,y0:Y0,x1:lx,y1:ly,h:fh},{t0:cT+.04,t1:1,type:'ground',x:lx,y:ly}];
      E={x:cx,y:cy,t:cT}; ev.push({t:thT,fn:()=>whoosh(bomb?.6:.3)}); ev.push({t:cT,fn:()=>{addFX(cx,cy,'NO GOOD','text'); thwack(); happy?aww():roar(1,1.6);}}); dur=bomb?2900:2500;
    } else if(kind==='int'){
      const ix=cx-d*1, iy=cy; K(Cv,cT,ix,iy); const rx=ix-d*12, ry=clampY(iy+r(-4,4)); K(Cv,.95,rx,ry);
      K(W,cT+.1,cx,cy); K(W,.95,rx+d*1.3,ry+.5);
      segs=[{t0:0,t1:thT,type:'hold',a:QB},{t0:thT,t1:cT,type:'fly',x0:qx,y0:Y0,x1:ix,y1:iy,h:fh},{t0:cT,t1:1,type:'hold',a:Cv}];
      E={x:rx,y:ry,t:.95}; out.carrier=Cv; out.intPos=rx-10;
      ev.push({t:thT,fn:()=>whoosh(.4)}); ev.push({t:cT,fn:()=>{thwack(); if(happy) aww(); else {roar(1.4,2.6); horn();} addFX(ix,iy,'PICKED!','text');}}); ev.push({t:.95,fn:()=>hit(1.1)}); dur=3300;
    } else {
      const ey=clampY(cy+r(-3,3)); K(W,.93,endX,ey); if(!td) K(W,1,endX+d*.5,ey);
      K(Cv,cT,cx+d*1.6,cy+1.2); K(Cv,.93,td?endX-d*4:endX+d*.9,ey+.5);
      segs=[{t0:0,t1:thT,type:'hold',a:QB},{t0:thT,t1:cT,type:'fly',x0:qx,y0:Y0,x1:cx,y1:cy,h:fh},{t0:cT,t1:1,type:'hold',a:W}];
      E={x:endX,y:ey,t:.93}; out.carrier=W;
      ev.push({t:thT,fn:()=>whoosh(bomb?.65:.3)}); if(bomb&&happy) ev.push({t:thT+.04,fn:()=>crowdVowel('ah',.7,1.3,false)});
      ev.push({t:cT,fn:()=>{thwack(); happy? roar(bomb||td?1.35:.9,2.2) : (bomb?aww():ooh());}}); if(!td) ev.push({t:.93,fn:()=>hit(bomb?1.2:1)});
      dur=bomb?3400:2900;
    }
  }
  else if(kind==='sack'){
    const loss=-g, qd=X0-d*(loss-1), sx=X0-d*loss;
    K(QB,.1,QB.x,QB.y); K(QB,.32,qd,Y0); K(QB,.5,qd,Y0); K(QB,.62,sx,Y0+.5);
    const R=Df(pick(['DE1','DE2'])); K(R,.12,R.x,R.y); K(R,.5,qd+d*.9,Y0+(R.y<Y0?-.6:.6)); K(R,.62,sx+d*.7,Y0);
    segs=[{t0:0,t1:1,type:'hold',a:QB}]; E={x:sx,y:Y0,t:.55}; out.carrier=QB;
    ev.push({t:.52,fn:()=>{hit(1.5); addFX(qd,Y0,'SACK!','text'); happy?aww():roar(1.3,2.2);}}); dur=2300;
  }
  else if(kind==='fg'){
    const H=QB, Kk=RB, hx=H.x;
    K(Kk,.08,Kk.x,Kk.y); K(Kk,.26,hx-d*.6,Y0-.4); K(Kk,.38,hx+d*.8,Y0-.1);
    const postX=side==='home'?120:0, ly=spec.good?Y0+r(-10,10)/10:Y0+pick([-1,1])*r(5,7), landX=postX+d*2.5;
    segs=[{t0:0,t1:.06,type:'ground',x:X0,y:Y0},{t0:.06,t1:.16,type:'fly',x0:X0,y0:Y0,x1:hx,y1:Y0,h:.4},{t0:.16,t1:.27,type:'ground',x:hx+d*.3,y:Y0},{t0:.27,t1:.85,type:'fly',x0:hx+d*.3,y0:Y0,x1:landX,y1:ly,h:13},{t0:.85,t1:1,type:'ground',x:landX,y:ly}];
    E={x:X0,y:Y0,t:.5}; ev=[{t:.06,fn:()=>nz({dur:.05,type:'bandpass',f:900,q:2,v:.2,a:.002})},{t:.27,fn:boot},{t:.8,fn:()=>{ if(spec.good){ if(happy){roar(1.1,2); horn();} else aww(); addFX(postX,MIDY,'GOOD!','text');} else { happy?aww():roar(1,1.6); addFX(postX,MIDY,'NO GOOD','text');} }}];
    dur=Math.max(2600,1800+Math.abs(postX-X0)*30);
  }
  else if(kind==='punt'){
    const P=QB, land=10+spec.land, Rt=Df('S1');
    K(Rt,.1,Rt.x,Rt.y); K(Rt,.85,land,Y0+1); K(Rt,1,land-d*3,Y0+1.5);
    for(const ro of ['WR1','WR2']){ const w=Of(ro); K(w,.1,w.x,w.y); K(w,.88,land-d*3,Y0+(w.y<Y0?-3:3)); }
    segs=[{t0:0,t1:.05,type:'ground',x:X0,y:Y0},{t0:.05,t1:.18,type:'fly',x0:X0,y0:Y0,x1:P.x,y1:Y0,h:.6},{t0:.18,t1:.3,type:'hold',a:P},{t0:.3,t1:.85,type:'fly',x0:P.x+d*.5,y0:Y0,x1:land,y1:Y0+1,h:15},{t0:.85,t1:1,type:'hold',a:Rt}];
    E={x:land,y:Y0,t:.85}; ev=[{t:.3,fn:boot},{t:.98,fn:()=>hit(.7)}]; dur=3300;
  }
  // everyone else
  ACT.forEach(a=>{ if(a.kf.length>1) return; const sx=a.x, sy=a.y, isOff=a.side===offS;
    if(isOff){
      if(form!=='normal'){ K(a,.12,sx,sy); K(a,1,sx+d*.6,sy); return; }
      if(['C','LG','RG','LT','RT','TE'].includes(a.role)){K(a,.1,sx,sy); K(a,.35,sx+d,sy); K(a,1,sx+d*1.6,sy);}
      else if(a.role.startsWith('WR')){K(a,.1,sx,sy); K(a,.7,sx+d*12,sy+(Y0-sy)*.15); K(a,1,sx+d*14,sy+(Y0-sy)*.2);}
      else if(a.role==='RB'){K(a,.1,sx,sy); K(a,.3,sx+d*1.5,sy-1.6);}
    } else {
      if(/^D[ET]/.test(a.role)){K(a,.1,sx,sy); K(a,.35,sx-d*.5,sy); K(a,1,sx+(E.x-sx)*.25,sy+(E.y-sy)*.25);}
      else {K(a,.12,sx,sy); K(a,E.t,sx+(E.x-sx)*.55,sy+(E.y-sy)*.55); K(a,1,sx+(E.x-sx)*.7,sy+(E.y-sy)*.7);}
    }
  });
  BALL.segs=segs;
  await runAnim(dur,ev);
  return out;
}
async function celebrate(c){
  if(!c) return;
  ACT.forEach(a=>{ a.kf=[[0,a.x,a.y]]; if(a.side===c.side&&a!==c){ const ang=Math.random()*6.28, rr=1.6+Math.random()*1.6; a.kf.push([.15+Math.random()*.3,a.x,a.y]); a.kf.push([1,clampX(c.x+Math.cos(ang)*rr),clampY(c.y+Math.sin(ang)*rr)]); } else a.kf.push([1,a.x,a.y]); });
  c.jump=true; G.cheerUntil=performance.now()+2600;
  await runAnim(1900); c.jump=false;
}
function confetti(){const cols=[T().c1,T().c2,'#ffd23f','#fff']; for(let i=0;i<70;i++){const c=document.createElement('div'); c.className='confetti'; c.style.left=Math.random()*100+'vw'; c.style.background=pick(cols); c.style.animationDuration=(1.5+Math.random()*1.8)+'s'; c.style.animationDelay=Math.random()*.4+'s'; document.body.appendChild(c); setTimeout(()=>c.remove(),4000);}}

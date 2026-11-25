/* Football Math — audio.js: All sound: synth engine, recorded stadium clips (snd/), 8-bit jingles, title theme, iPhone audio unlock.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* ---------- sound ---------- */
let AC=null;
function ac(){ if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}} if(AC&&AC.state==='suspended')AC.resume(); return AC; }
const sfxOn=()=>saved.sound!==false;
const musicOn=()=>sfxOn()&&saved.music!==false;   // title theme: needs Sound on AND Music on
/* ---------- stadium sound engine (all synthesized) ---------- */
let MASTER=null, NOISE=null;
function out(){ const c=ac(); if(!c) return null; if(!MASTER){ const comp=c.createDynamicsCompressor(); comp.threshold.value=-16; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=.004; comp.release.value=.25; const g=c.createGain(); g.gain.value=.95; comp.connect(g); g.connect(c.destination); MASTER=comp; } return MASTER; }
function noiseBuf(){ const c=ac(); if(!NOISE){ const n=c.sampleRate*2; NOISE=c.createBuffer(1,n,c.sampleRate); const d=NOISE.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; } return NOISE; }
function nz({dur=.3,type='bandpass',f=1000,f2=null,q=.7,v=.3,a=.01,when=0,dest=null}={}){ const c=ac(); if(!c||!sfxOn())return; const t=c.currentTime+when; const s=c.createBufferSource(); s.buffer=noiseBuf(); s.loop=true; const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+dur); fl.Q.value=q; const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(.0002,v),t+a); g.gain.exponentialRampToValueAtTime(.0001,t+dur); s.connect(fl); fl.connect(g); g.connect(dest||out()); s.start(t,Math.random()*1.5); s.stop(t+dur+.05); }
function osc({f=440,f2=null,dur=.3,type='sine',v=.2,a=.005,when=0,lp=null,dest=null}={}){ const c=ac(); if(!c||!sfxOn())return; const t=c.currentTime+when; const o=c.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+dur); const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+dur); let n=o; if(lp){ const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=lp; o.connect(fl); n=fl; } n.connect(g); g.connect(dest||out()); o.start(t); o.stop(t+dur+.05); }
function tone(f,d,type='sine',v=.15,when=0){ osc({f,dur:d,type,v,when}); }
function whistle_syn(){ const c=ac(); if(!c||!sfxOn())return; [[0,.18],[.26,.42]].forEach(([w,len])=>{ const t=c.currentTime+w; const o=c.createOscillator(); o.frequency.value=2850; const l=c.createOscillator(); l.frequency.value=27; const lg=c.createGain(); lg.gain.value=150; l.connect(lg); lg.connect(o.frequency); const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.08,t+.02); g.gain.setValueAtTime(.08,t+len-.04); g.gain.exponentialRampToValueAtTime(.0001,t+len); o.connect(g); g.connect(out()); o.start(t); l.start(t); o.stop(t+len+.05); l.stop(t+len+.05); }); }
function hutVoice(when=0){ const c=ac(); if(!c||!sfxOn())return; const t=c.currentTime+when; const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(155,t); o.frequency.exponentialRampToValueAtTime(100,t+.15);
  const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.55,t+.015); g.gain.exponentialRampToValueAtTime(.0001,t+.17);
  for(const [f,q] of [[640,4],[1150,6]]){ const b=c.createBiquadFilter(); b.type='bandpass'; b.frequency.value=f; b.Q.value=q; o.connect(b); b.connect(g); }
  g.connect(out()); o.start(t); o.stop(t+.22); nz({dur:.05,type:'highpass',f:3000,v:.1,when}); }
const hut=()=>{ hutVoice(0); hutVoice(.3); };
function hit_syn(p=1){ p=Math.min(1.6,p); nz({dur:.08,type:'highpass',f:1800,v:.4*p,a:.002}); nz({dur:.3,type:'lowpass',f:450,v:.6*p,a:.004}); osc({f:120,f2:40,dur:.24,v:.55*p}); nz({dur:.14,type:'bandpass',f:900,q:1.5,v:.22*p,when:.03}); }
const whoosh=(dur=.35)=>nz({dur,type:'bandpass',f:300,f2:2600,q:2,v:.16,a:dur*.6});
const thwack=()=>{ nz({dur:.06,type:'bandpass',f:1400,q:2,v:.4,a:.002}); osc({f:300,f2:170,dur:.09,type:'triangle',v:.25}); };
const boot_syn=()=>{ osc({f:170,f2:55,dur:.14,v:.65}); nz({dur:.05,type:'highpass',f:2000,v:.35,a:.001}); };
function crowdVowel_syn(kind,level=1,dur=1.4,fall=true){ const c=ac(); if(!c||!sfxOn())return; const t=c.currentTime; const F=kind==='oh'?[430,780]:kind==='aw'?[650,1000]:[820,1300];
  const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.1*level,t+.22); g.gain.setValueAtTime(.1*level,t+dur*.55); g.gain.exponentialRampToValueAtTime(.0001,t+dur); g.connect(out());
  const mix=c.createGain(); for(const [f,q] of [[F[0],3],[F[1],4]]){ const b=c.createBiquadFilter(); b.type='bandpass'; b.frequency.value=f; b.Q.value=q; mix.connect(b); b.connect(g); }
  for(let i=0;i<14;i++){ const o=c.createOscillator(); o.type='sawtooth'; const base=110+Math.random()*200; o.frequency.setValueAtTime(base*(fall?1.12:.95),t); o.frequency.exponentialRampToValueAtTime(base*(fall?.7:1.1),t+dur); const vib=c.createOscillator(); vib.frequency.value=4+Math.random()*3; const vg=c.createGain(); vg.gain.value=base*.025; vib.connect(vg); vg.connect(o.frequency); const og=c.createGain(); og.gain.value=.07; o.connect(og); og.connect(mix); const st=t+Math.random()*.1; o.start(st); vib.start(st); o.stop(t+dur+.1); vib.stop(t+dur+.1); } }
function roar_syn(level=1,dur=2){ dur=Math.min(dur,1.8); level*=.75; nz({dur,type:'bandpass',f:520,q:.8,v:.2*level,a:.22}); nz({dur:dur*.95,type:'bandpass',f:1250,q:1,v:.17*level,a:.28}); nz({dur:dur*.85,type:'bandpass',f:2700,q:1.2,v:.07*level,a:.32}); crowdVowel_syn('ah',level*.8,dur*.9,false); G.cheerUntil=performance.now()+dur*1000; }
const ooh_syn=()=>{ crowdVowel('oh',1,1.4,true); };
const aww_syn=()=>{ crowdVowel('aw',1,1.7,true); nz({dur:1.5,type:'bandpass',f:450,q:.8,v:.09,a:.2}); };
function horn_syn(){ [146.8,185,220,293.7].forEach(f=>osc({f,dur:1.4,type:'sawtooth',v:.065,a:.04,lp:1500})); }
function claps_syn(){ [0,.28,.75,.95,1.15].forEach(w=>{ for(let k=0;k<7;k++) nz({dur:.07,type:'bandpass',f:1200+Math.random()*1000,q:1.2,v:.11,a:.002,when:w+Math.random()*.035}); osc({f:90,f2:50,dur:.12,v:.28,when:w}); }); }

/* =========================================================
   REAL STADIUM AUDIO (recorded clips in snd/, from Mixkit, free license)
   + 8-bit jingles for the game UI. Falls back to synth if a clip is missing.
   ========================================================= */
const SND={roar:'snd/roar.mp3',bigplay:'snd/bigplay.mp3',cheer:'snd/cheer.mp3',groan:'snd/groan.mp3',defense:'snd/defense.mp3',ambient:'snd/ambient.mp3',hit:'snd/hit.mp3',hit2:'snd/hit2.mp3',kick:'snd/kick.mp3',whistle:'snd/whistle.mp3',horn:'snd/horn.mp3'};
const SB={}; let sndLoading=false;
function loadSamples(){ const c=ac(); if(!c||sndLoading) return; sndLoading=true;
  for(const [k,u] of Object.entries(SND)){ fetch(u).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(b=>new Promise((res,rej)=>c.decodeAudioData(b,res,rej))).then(buf=>{ SB[k]=buf; }).catch(()=>{}); } }
function playS(k,vol=1,rate=1,loop=false){ const c=ac(); if(!c||!sfxOn()||!SB[k]) return null;
  try{ const s=c.createBufferSource(); s.buffer=SB[k]; s.playbackRate.value=rate; s.loop=loop; const g=c.createGain(); g.gain.value=vol; s.connect(g); g.connect(out()); s.start(); return {s,g}; }catch(e){ return null; } }
let lastCrowd=0;
function crowdOnce(k,vol){ const now=performance.now(); if(now-lastCrowd<350) return true; lastCrowd=now; return !!playS(k,vol); }
function whistle(){ if(!playS('whistle',.55)) whistle_syn(); }
function hit(p=1){ if(!playS(Math.random()<.6?'hit':'hit2',Math.min(1,.5+p*.3),.92+Math.random()*.16)) hit_syn(p); }
const boot=()=>{ if(!playS('kick',.9)) boot_syn(); };
function roar(level=1,dur=2){ G.cheerUntil=performance.now()+Math.max(1500,dur*1000);
  const k= (level>=1.3||dur>=3)?'roar' : level>=.85?'bigplay':'cheer';
  if(!crowdOnce(k,Math.min(1,.45+level*.35))) roar_syn(level,dur); }
function crowdVowel(kind,level=1,dur=1.4,fall=true){ if(SB.cheer){ if(kind==='ah') crowdOnce('cheer',.3*level); else crowdOnce('groan',.6*level); return; } crowdVowel_syn(kind,level,dur,fall); }
const ooh=()=>{ if(!crowdOnce('groan',.55)) ooh_syn(); };
const aww=()=>{ if(!crowdOnce('groan',.9)) aww_syn(); };
function horn(){ if(!playS('horn',.6)) horn_syn(); }
function claps(){ if(!playS('defense',.75)) claps_syn(); }
let BEDS=null, bedTry=0;
function crowdBed(on){ if(!on){ if(BEDS){ try{BEDS.s.stop()}catch(e){} BEDS=null; } return; }
  if(BEDS||!sfxOn()) return;
  if(!SB.ambient){ if(bedTry++<10) setTimeout(()=>crowdBed(true),800); return; }
  BEDS=playS('ambient',.4,1,true); }
/* ---- 8-bit (NES-style) jingles ---- */
const NOTE=n=>440*Math.pow(2,(n-69)/12);
function chip(seq,bpm=150,type='square',v=.07){ const beat=60/bpm; let t=0; for(const [n,len] of seq){ if(n) osc({f:NOTE(n),dur:len*beat*.9,type,v,a:.004,when:t}); t+=len*beat; } return t; }
function fanfare(){ // touchdown: original 8-bit stinger
  chip([[67,.25],[72,.25],[76,.25],[79,.5],[76,.25],[79,1.25]],170,'square',.06);
  chip([[64,.25],[67,.25],[72,.25],[76,.5],[72,.25],[76,1.25]],170,'square',.035);
  chip([[48,.75],[43,.25],[48,1.5]],170,'triangle',.16); }
function winJingle(){ chip([[72,.25],[72,.25],[72,.25],[72,.75],[68,.75],[70,.75],[72,.5],[70,.25],[72,1.5]],180,'square',.06); chip([[48,1],[44,1],[46,1],[48,1.5]],180,'triangle',.16); }
function loseJingle(){ chip([[67,.5],[66,.5],[65,.5],[64,1.5]],120,'square',.05); chip([[43,1.5],[40,1.5]],120,'triangle',.14); }
const ding=()=>{ chip([[84,.12],[88,.12],[91,.3]],240,'square',.05); };
const bonk=()=>{ chip([[55,.2],[50,.45]],200,'square',.045); };

/* ---- menu theme: original 8-bit "Sunday broadcast" march, loops quietly ---- */
const MUS={on:false,timer:null,next:0,ev:[],len:0};
(function buildTheme(){
  const B=60/138, ev=[]; let t=0;
  const lead=[
    [[74,.75],[69,.25],[74,.5],[78,1],[76,.5],[74,1]],
    [[77,.75],[74,.25],[70,.5],[77,1],[79,.5],[77,1]],
    [[79,.75],[76,.25],[72,.5],[79,.5],[81,.5],[79,.5],[76,1]],
    [[78,1.5],[81,.5],[86,2]],
    [[74,.75],[69,.25],[74,.5],[78,1],[76,.5],[74,1]],
    [[77,.75],[74,.25],[70,.5],[77,1],[79,.5],[77,1]],
    [[79,.5],[81,.5],[84,1],[83,.5],[81,.5],[79,1]],
    [[81,2],[0,.5],[69,.5],[73,.5],[76,.5]]];
  const roots=[38,34,36,38,38,34,36,33];
  const chords={38:[62,66,69],34:[58,62,65],36:[60,64,67],33:[57,61,64]};
  for(let bar=0;bar<8;bar++){
    const b0=bar*4*B; let lt=b0;
    for(const [n,d] of lead[bar]){ if(n) ev.push({t:lt,f:NOTE(n),d:d*B*.92,type:'square',v:.035}); lt+=d*B; }
    const r=roots[bar];
    [r,r,r+12,r,r,r+7,r+12,r].forEach((n,i)=>ev.push({t:b0+i*.5*B,f:NOTE(n),d:.45*B,type:'triangle',v:.11}));
    for(const st of [0,2]) for(const n of chords[r]) ev.push({t:b0+st*B,f:NOTE(n),d:.9*B,type:'square',v:.012});
    for(let i=0;i<8;i++) ev.push({t:b0+i*.5*B,dr:'hat'});
    ev.push({t:b0,dr:'kick'},{t:b0+2*B,dr:'kick'},{t:b0+B,dr:'snare'},{t:b0+3*B,dr:'snare'});
    if(bar===7) for(let i=0;i<4;i++) ev.push({t:b0+3*B+i*.25*B,dr:'snare'});
  }
  MUS.ev=ev.sort((a,b)=>a.t-b.t); MUS.len=32*B;
})();
function musicTick(){ const c=ac(); if(!c||!MUS.on) return; if(!musicOn()){ musicStop(); return; } const dest=musBus();
  const now=c.currentTime, ahead=now+.6;
  while(MUS.next<ahead){ const loopStart=MUS.next;
    // schedule the events that fall in [MUS.next, MUS.next+chunk)
    const chunkEnd=Math.min(ahead, MUS.base+MUS.len*(MUS.loop+1));
    for(const e of MUS.ev){ const at=MUS.base+MUS.len*MUS.loop+e.t; if(at<loopStart||at>=chunkEnd) continue; const w=Math.max(0,at-now);
      if(e.dr==='kick') osc({f:110,f2:45,dur:.14,v:.14,when:w,dest}); else if(e.dr==='snare') nz({dur:.1,type:'highpass',f:1800,v:.05,a:.002,when:w,dest}); else if(e.dr==='hat') nz({dur:.025,type:'highpass',f:7000,v:.018,a:.001,when:w,dest});
      else osc({f:e.f,dur:e.d,type:e.type,v:e.v,a:.006,when:w,dest}); }
    MUS.next=chunkEnd; if(MUS.next>=MUS.base+MUS.len*(MUS.loop+1)) MUS.loop++;
  } }
let MUSBUS=null;
function musBus(){ if(!MUSBUS){ MUSBUS=AC.createGain(); MUSBUS.connect(out()); } return MUSBUS; }
function musicStart(){ if(!musicOn()) return; const c=ac(); if(!c||MUS.on) return; MUS.on=true; MUS.base=c.currentTime+.15; MUS.next=MUS.base; MUS.loop=0; MUS.timer=setInterval(musicTick,150); musicTick(); }
function musicStop(){ MUS.on=false; clearInterval(MUS.timer);
  if(MUSBUS){ const b=MUSBUS; MUSBUS=null; try{ b.gain.setTargetAtTime(0,AC.currentTime,.02); setTimeout(()=>{ try{b.disconnect()}catch(e){} },200); }catch(e){} } }   // silences notes already queued
let unlocked=false, silentEl=null;
/* iPhone: 'playback' mode lets sounds play even with the silent switch on. */
function setAudioMode(){ try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){} }
function silentWavURL(){ const n=4410, buf=new ArrayBuffer(44+n*2), v=new DataView(buf); const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,44100,true); v.setUint32(28,88200,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  return URL.createObjectURL(new Blob([buf],{type:'audio/wav'})); }
function unlockAudio(){ setTimeout(loadSamples,0); setTimeout(()=>{ if(document.getElementById('kick')) musicStart(); },50);
  setAudioMode();
  const c=ac(); if(c){ try{ const b=c.createBuffer(1,1,22050), s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(0);}catch(e){} }
  try{ if(!silentEl){ silentEl=new Audio(silentWavURL()); silentEl.loop=true; silentEl.setAttribute('playsinline',''); silentEl.setAttribute('x-webkit-airplay','deny'); } if(silentEl.paused) silentEl.play().catch(()=>{}); }catch(e){}
  unlocked=true;
}
['pointerdown','touchend','click'].forEach(ev=>document.addEventListener(ev,unlockAudio,{capture:true}));

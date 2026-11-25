/* Football Math — core.js: Saved data (localStorage) + small shared helpers. Loaded before everything that reads `saved`.
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* ---------- saved settings (safe) ---------- */
const store={get(){try{return JSON.parse(localStorage.getItem('footballMath1')||'{}')}catch(e){return {}}},set(v){try{localStorage.setItem('footballMath1',JSON.stringify(v))}catch(e){}}};
/* Bump SAVE_VERSION and add a step to migrateSave() (js/players.js) whenever the shape of
   saved data changes. Never patch old data anywhere else.
   saved = { v, sound, music, qLen, pclock  (this device)   cur, players:[ newPlayer() … ] } */
const SAVE_VERSION=3;
let saved=Object.assign({sound:true,music:true,qLen:180,pclock:0,cur:0,players:[]},store.get());
/* everything that belongs to one kid */
const newPlayer=name=>({name, grade:1, stepId:null, win:[], ansMode:'auto', opp:'normal', homeT:'DET', awayT:'CHI', record:{w:0,l:0,t:0}, facts:{}});
const PLAYER_KEYS=Object.keys(newPlayer(''));
const me=()=>saved.players[saved.cur];   // the player who's playing now

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
let GAME=0;
const wait=ms=>{const id=GAME; return new Promise(res=>setTimeout(()=>{ if(id===GAME) res(); },ms));};
const lerp=(a,b,t)=>a+(b-a)*t;
const MIDY=26.65, FW=53.3;
const clampX=x=>Math.max(-1,Math.min(121,x)), clampY=y=>Math.max(1,Math.min(FW-1,y));
const fmt=s=>{s=Math.max(0,Math.round(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};

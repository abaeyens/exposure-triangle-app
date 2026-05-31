// Pure exposure math and ternary-plot geometry for the Exposure Triangle
// Explorer. No DOM dependencies, so it loads in the browser (as globals via
// <script>) and under Node (via require) for the unit tests in
// exposure-math.test.js.

// ---- ladders (real full-stop values), index = stop position --------------
const APER = [1.4,2,2.8,4,5.6,8,11,16,22];
const SHUT = [
  {s:30,l:'30"'},{s:15,l:'15"'},{s:8,l:'8"'},{s:4,l:'4"'},{s:2,l:'2"'},
  {s:1,l:'1"'},{s:1/2,l:'1/2'},{s:1/4,l:'1/4'},{s:1/8,l:'1/8'},{s:1/15,l:'1/15'},
  {s:1/30,l:'1/30'},{s:1/60,l:'1/60'},{s:1/125,l:'1/125'},{s:1/250,l:'1/250'},
  {s:1/500,l:'1/500'},{s:1/1000,l:'1/1k'},{s:1/2000,l:'1/2k'},
  {s:1/4000,l:'1/4k'},{s:1/8000,l:'1/8k'}
];
const ISO = [100,200,400,800,1600,3200,6400,12800,25600];
const K = 5;   // every axis spans 5 stops

// scene = axis index endpoints:
//   ap:[closedIdx@λA=0, openIdx@λA=1]  sh:[fastIdx@λS=0, slowIdx@λS=1]
//   is:[lowIdx@λI=0, highIdx@λI=1]
const SCENES = [
  {name:'🌆 Twilight', ev:0, lux:2.5, ap:[5,0], sh:[7,2], is:[3,8]},
  {name:'🛋️ Living room', ev:5,  lux:80,    ap:[5,0], sh:[12,7], is:[3,8]},
  {name:'💡 Indoor',  ev:8,  lux:640,   ap:[6,1], sh:[12,7], is:[1,6]},
  {name:'☁️ Overcast',ev:12, lux:10000, ap:[7,2], sh:[14,9], is:[0,5]},
  {name:'☀️ Sunny',   ev:15, lux:82000, ap:[7,2], sh:[17,12],is:[0,5]},
];

// EV (at ISO 100) of a full-stop combo given its ladder indices
function evOfCombo(ai, si, gi){
  return Math.log2(APER[ai]*APER[ai] / SHUT[si].s) - Math.log2(ISO[gi]/100);
}

// incident-meter relation: lux ≈ 2.5·2^EV  (C ≈ 250, ISO 100)
function evFromLux(lux){ return Math.log2(lux/2.5); }
function luxValid(lux){ return lux > 0 && lux <= 200000; }

// precompute the valid, correctly-exposed full-stop combos for a scene
function buildCombos(sc){
  const [ac,ao]=sc.ap, [sf,ss]=sc.sh, [il,ih]=sc.is;
  const Csum = ac + sf - il - K;          // aIdx + sIdx - gIdx is invariant
  const out=[];
  for(let ai=Math.min(ao,ac); ai<=Math.max(ao,ac); ai++)
    for(let gi=il; gi<=ih; gi++){
      const si = Csum - ai + gi;
      if(si<Math.min(sf,ss) || si>Math.max(sf,ss)) continue;
      out.push({ai,si,gi,
        la:(ac-ai)/K, ls:(sf-si)/K, li:(gi-il)/K});
    }
  return out;
}

// build correctly-exposed axis ranges for an arbitrary EV (manual mode).
// Aperture opens wider (toward f/1.4) and the ISO floor rises as it darkens;
// the shutter takes up the rest.
function axesForEV(ev){
  ev = Math.max(0, Math.min(17, ev));
  let lowI = Math.max(0, Math.min(3, Math.round((12-ev)/2)));
  let closedA = Math.max(5, Math.min(7, 5 + Math.floor((ev-2)/4)));
  let fastS = Math.round(ev + 9 - closedA + lowI);
  if(fastS > 18){ closedA = Math.min(8, closedA+1); fastS = Math.round(ev + 9 - closedA + lowI); }
  fastS = Math.max(5, Math.min(18, fastS));
  closedA = Math.max(5, Math.min(8, closedA));
  return { ap:[closedA, closedA-5], sh:[fastS, fastS-5], is:[lowI, lowI+5] };
}

// ---- ternary-plot geometry (pure, pixel space) ---------------------------
const PA={x:190,y:28}, PS={x:44,y:278}, PI={x:336,y:278};   // A top, S left, I right
const baryPix=b=>({x:b.la*PA.x+b.ls*PS.x+b.li*PI.x,
                   y:b.la*PA.y+b.ls*PS.y+b.li*PI.y});
function pixBary(p){
  const det=(PS.y-PI.y)*(PA.x-PI.x)+(PI.x-PS.x)*(PA.y-PI.y);
  let la=((PS.y-PI.y)*(p.x-PI.x)+(PI.x-PS.x)*(p.y-PI.y))/det;
  let ls=((PI.y-PA.y)*(p.x-PI.x)+(PA.x-PI.x)*(p.y-PI.y))/det;
  let li=1-la-ls;
  la=Math.max(0,la); ls=Math.max(0,ls); li=Math.max(0,li);
  const s=la+ls+li; return {la:la/s, ls:ls/s, li:li/s};
}

// combo in `combos` nearest the target bary point b, by squared (la,ls,li) distance
function nearestCombo(combos, b){
  let best=combos[0], bd=1e9;
  for(const c of combos){
    const d=(c.la-b.la)**2+(c.ls-b.ls)**2+(c.li-b.li)**2;
    if(d<bd){bd=d;best=c;}
  }
  return best;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APER, SHUT, ISO, K, SCENES, evOfCombo, evFromLux, luxValid, buildCombos, axesForEV,
                     PA, PS, PI, baryPix, pixBary, nearestCombo };
}

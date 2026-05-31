// Unit tests for the exposure math. Run with:  node --test
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./exposure-math.js');

const centroidCombo = combos =>            // combo nearest the barycentre (what the app starts on)
  combos.reduce((best,c)=>{
    const d=(c.la-1/3)**2+(c.ls-1/3)**2+(c.li-1/3)**2;
    return d<best.d ? {c,d} : best;
  }, {c:null,d:Infinity}).c;

test('every preset yields 21 combos, self-consistent and near its labelled EV', () => {
  for (const sc of M.SCENES) {
    const combos = M.buildCombos(sc);
    assert.equal(combos.length, 21, `${sc.name}: expected 21 combos`);
    const evs = combos.map(c => M.evOfCombo(c.ai, c.si, c.gi));
    const spread = Math.max(...evs) - Math.min(...evs);
    assert.ok(spread <= 0.3, `${sc.name}: combo EV spread ${spread.toFixed(2)} too large`);
    const mid = evs.reduce((a,b)=>a+b,0)/evs.length;
    assert.ok(Math.abs(mid - sc.ev) <= 0.5, `${sc.name}: combos centre EV ${mid.toFixed(2)} vs label ${sc.ev}`);
  }
});

test('axesForEV produces 21 valid combos exposed within ~0.7 EV of target', () => {
  for (let ev = 0; ev <= 16; ev += 0.5) {
    const combos = M.buildCombos(M.axesForEV(ev));
    assert.equal(combos.length, 21, `EV ${ev}: expected 21 combos`);
    for (const c of combos) {
      const e = M.evOfCombo(c.ai, c.si, c.gi);
      assert.ok(Math.abs(e - ev) <= 0.7, `EV ${ev}: combo exposed at ${e.toFixed(2)}`);
    }
  }
});

test('axesForEV: aperture opens to f/1.4 when dim, stops down when bright', () => {
  assert.equal(M.axesForEV(0).ap[1], 0, 'EV 0 should open to f/1.4 (index 0)');
  assert.equal(M.axesForEV(3).ap[1], 0, 'EV 3 should open to f/1.4');
  assert.equal(M.APER[M.axesForEV(0).ap[1]], 1.4);
  assert.ok(M.axesForEV(15).ap[1] > 0, 'bright scenes need not open to f/1.4');
});

test('axesForEV reproduces the open-aperture/ISO-floor presets', () => {
  // Twilight, Living room, Overcast, Sunny are reproduced exactly by the generator
  assert.deepEqual(M.axesForEV(0.4),  { ap:[5,0], sh:[7,2],   is:[3,8] });
  assert.deepEqual(M.axesForEV(5),    { ap:[5,0], sh:[12,7],  is:[3,8] });
  assert.deepEqual(M.axesForEV(12),   { ap:[7,2], sh:[14,9],  is:[0,5] });
  assert.deepEqual(M.axesForEV(15),   { ap:[7,2], sh:[17,12], is:[0,5] });
});

test('axesForEV stays within the ladders and each axis spans exactly K', () => {
  for (const ev of [-5, 0, 8, 17, 25]) {              // includes out-of-range to test clamping
    const { ap, sh, is } = M.axesForEV(ev);
    assert.ok(ap[0] <= 8 && ap[1] >= 0, `aperture out of ladder at EV ${ev}`);
    assert.ok(sh[0] <= 18 && sh[1] >= 0, `shutter out of ladder at EV ${ev}`);
    assert.ok(is[0] >= 0 && is[1] <= 8, `ISO out of ladder at EV ${ev}`);
    assert.equal(Math.abs(ap[0]-ap[1]), M.K);
    assert.equal(Math.abs(sh[0]-sh[1]), M.K);
    assert.equal(Math.abs(is[0]-is[1]), M.K);
  }
});

test('evFromLux matches the incident relation lux = 2.5·2^EV', () => {
  assert.ok(Math.abs(M.evFromLux(2.5) - 0) < 1e-9);
  assert.ok(Math.abs(M.evFromLux(10000) - 12) < 0.1);
  assert.ok(Math.abs(M.evFromLux(82000) - 15) < 0.1);
});

test('luxValid rejects non-positive and > 200k', () => {
  for (const bad of [0, -5, 200001, NaN, Infinity]) assert.equal(M.luxValid(bad), false, `${bad} should be invalid`);
  for (const ok of [1, 5000, 200000]) assert.equal(M.luxValid(ok), true, `${ok} should be valid`);
});

test('off-range greying fires below the representable floor, not within it', () => {
  const off = lux => {
    const combos = M.buildCombos(M.axesForEV(M.evFromLux(lux)));
    const e = M.evOfCombo(...['ai','si','gi'].map(k => centroidCombo(combos)[k]));
    return Math.abs(M.evFromLux(lux) - e) > 0.8;
  };
  assert.equal(off(1), true,  '1 lx is below the triangle floor → should grey out');
  assert.equal(off(3.4), false, '3.4 lx (twilight) is representable');
  assert.equal(off(10000), false, '10000 lx is representable');
});

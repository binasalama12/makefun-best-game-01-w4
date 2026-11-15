// Deterministic randomness: mulberry32, so a seed always builds the same stage
// in live play, in shot mode and on any machine.

export function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

export function randomInt(rng, min, maxInclusive) {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

export function randomPick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

// Stage seeds derive from the run seed so stage N is stable for a given run.
export function seedForStage(runSeed, stage) {
  let h = (runSeed >>> 0) ^ Math.imul(stage, 0x9e3779b9);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

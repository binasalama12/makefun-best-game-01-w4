// Shot mode: ?shot=title|play|feature|end&seed=N renders one deterministic
// frame for screenshots. The stage is built from the seed, an autopilot runs
// fixed steps (jumping at edges and spikes), and the resulting state is drawn
// once, synchronously, before window.__shotReady is set.

import { CONFIG, FIXED_DT } from './config.js';
import { createGameState, groundAhead, stepWorld } from './world.js';

export function parseShotRequest(search) {
  const params = new URLSearchParams(search);
  const scene = params.get('shot');
  if (!scene) return null;
  const seed = Number.parseInt(params.get('seed') ?? '7', 10);
  return { scene, seed: Number.isFinite(seed) ? seed : 7 };
}

// The autopilot's eyes: jump when the ground ends or spikes loom ahead;
// double-jump when still falling over a gap after the first jump.
function autopilotWantsJump(state) {
  const k = state.knight;
  const feetY = k.y + CONFIG.knightHeight;
  const frontX = k.x + CONFIG.knightWidth;
  if (k.grounded) {
    if (!groundAhead(state.world, frontX + 46, feetY)) return true;
    for (const s of state.world.spikes) {
      if (s.x > frontX && s.x - frontX < 86 && Math.abs(s.y - feetY) < 8) return true;
    }
    return false;
  }
  if (k.jumpsUsed === 1 && k.vy > 240 && !groundAhead(state.world, frontX + 30, feetY + 60)) return true;
  return false;
}

function simulateSteps(state, steps) {
  let result = 'running';
  for (let i = 0; i < steps; i++) {
    result = stepWorld(state, FIXED_DT, autopilotWantsJump(state));
    if (result !== 'running') break;
  }
  return result;
}

// Simulates until the knight is caught mid double-jump over a gap with the
// lava close behind — the feature moment. Falls back to staging it by hand.
function simulateToFeatureMoment(state) {
  for (let i = 0; i < 2400; i++) {
    const result = stepWorld(state, FIXED_DT, autopilotWantsJump(state));
    if (result !== 'running') break;
    const k = state.knight;
    const feetY = k.y + CONFIG.knightHeight;
    const overGap = !groundAhead(state.world, k.x + 17, feetY + 4);
    if (!k.grounded && k.jumpsUsed === 2 && overGap && k.vy < 160) {
      // Frame the moment: knight mid-gap at screen x≈430, the lava wall a
      // visible band on the left, pickup floaters cleared off the knight.
      state.cameraX = Math.max(0, k.x - 430);
      state.lavaX = Math.max(state.lavaX, k.x - 300);
      state.floaters = [];
      return true;
    }
  }
  // Staged fallback: hover the knight over the first wide gap, lava near.
  const world = state.world;
  for (let i = 0; i + 1 < world.platforms.length; i++) {
    const gapStart = world.platforms[i].x + world.platforms[i].w;
    const gapEnd = world.platforms[i + 1].x;
    if (gapEnd - gapStart > 90) {
      const k = state.knight;
      k.x = gapStart + (gapEnd - gapStart) * 0.45;
      k.y = CONFIG.groundY - 235;
      k.vy = -260;
      k.grounded = false;
      k.jumpsUsed = 2;
      state.lavaX = k.x - 300;
      state.cameraX = Math.max(0, k.x - 430);
      state.floaters = [];
      state.embersCollected = Math.max(state.embersCollected, 4);
      state.distanceScore = k.x * CONFIG.distanceScorePerPixel;
      return true;
    }
  }
  return false;
}

// Returns { state, mode } ready to draw exactly one frame.
export function prepareShotState(scene, seed) {
  const state = createGameState(seed);
  if (scene === 'title') {
    simulateSteps(state, 40);
    return { state, mode: 'title' };
  }
  if (scene === 'play') {
    let result = simulateSteps(state, 330);
    if (result !== 'running' || state.shields < 2) {
      const retry = createGameState(seed);
      simulateSteps(retry, 210);
      return { state: retry, mode: 'playing' };
    }
    return { state, mode: 'playing' };
  }
  if (scene === 'feature') {
    simulateToFeatureMoment(state);
    return { state, mode: 'playing' };
  }
  // 'end': play a while for a real score, then present the results screen.
  simulateSteps(state, 520);
  state.shields = 0;
  state.knight.dead = true;
  return { state, mode: 'gameover' };
}

// World simulation: procedural stage building, fixed-step physics, hazards,
// pickups, the chasing lava wall, particles and scoring. No drawing here.

import { CONFIG, levelLengthForStage, lavaSpeedForStage, runSpeedForStage } from './config.js';
import { createRng, randomInt, randomRange, seedForStage } from './rng.js';

export function buildStage(runSeed, stage) {
  const rng = createRng(seedForStage(runSeed, stage));
  const length = levelLengthForStage(stage);
  const platforms = [];
  const spikes = [];
  const embers = [];
  const bats = [];

  // A safe starting courtyard, then ruin segments split by jumpable gaps.
  let cursor = -200;
  const firstEnd = 620;
  platforms.push({ x: cursor, w: firstEnd - cursor, y: CONFIG.groundY });
  cursor = firstEnd;

  while (cursor < length) {
    const gap = randomInt(rng, 95, 150 + stage * 6);
    const segStart = cursor + gap;
    const segWidth = randomInt(rng, 340, 640);
    const segY = CONFIG.groundY + randomInt(rng, -46, 26);
    platforms.push({ x: segStart, w: segWidth, y: segY });

    // Ember arc over the gap rewards a committed jump.
    const arcCount = 3;
    for (let i = 0; i < arcCount; i++) {
      const t = (i + 1) / (arcCount + 1);
      embers.push({
        x: cursor + gap * t,
        y: CONFIG.groundY - 70 - Math.sin(t * Math.PI) * 90,
        taken: false,
        bobPhase: rng() * Math.PI * 2,
      });
    }
    // Embers resting along the segment.
    const lineCount = randomInt(rng, 1, 3);
    for (let i = 0; i < lineCount; i++) {
      embers.push({
        x: segStart + 60 + i * 54 + randomRange(rng, -8, 8),
        y: segY - 34,
        taken: false,
        bobPhase: rng() * Math.PI * 2,
      });
    }
    // Spikes on longer segments, never right at the landing edge.
    if (segWidth > 430 && rng() < 0.85) {
      const spikeCount = randomInt(rng, 1, 2 + (stage > 2 ? 1 : 0));
      spikes.push({ x: segStart + randomInt(rng, 170, segWidth - 190), w: 30 * spikeCount, y: segY, count: spikeCount });
    }
    // Bats patrol the later half of the stage.
    if (segStart > length * 0.35 && rng() < 0.55) {
      bats.push({
        baseX: segStart + segWidth * randomRange(rng, 0.3, 0.75),
        baseY: segY - randomInt(rng, 120, 185),
        rangeX: randomInt(rng, 40, 90),
        speed: randomRange(rng, 0.9, 1.5),
        phase: rng() * Math.PI * 2,
        x: 0,
        y: 0,
      });
    }
    cursor = segStart + segWidth;
  }

  // The glowing gate stands on a final safe platform.
  const gateX = cursor + 130;
  platforms.push({ x: cursor, w: 460, y: CONFIG.groundY });
  return { stage, length: gateX + 200, platforms, spikes, embers, bats, gateX, rng };
}

export function createKnight(startX) {
  return {
    x: startX,
    y: CONFIG.groundY - CONFIG.knightHeight,
    vy: 0,
    grounded: false,
    jumpsUsed: 0,
    coyote: 0,
    jumpBuffer: 0,
    invulnerable: 0,
    runTime: 0,
    lastSafeX: startX,
    lastSafeY: CONFIG.groundY - CONFIG.knightHeight,
    dead: false,
  };
}

export function createGameState(runSeed) {
  return {
    runSeed,
    stage: 1,
    world: buildStage(runSeed, 1),
    knight: createKnight(90),
    cameraX: 0,
    lavaX: -560,
    shields: CONFIG.startShields,
    embersCollected: 0,
    distanceScore: 0,
    time: 0,
    stageTime: 0,
    particles: [],
    floaters: [],
    shake: 0,
    events: [], // sound cues drained by main each step: 'jump' | 'double' | 'ember' | 'clang' | 'gate'
  };
}

export function totalScore(state) {
  return Math.floor(state.distanceScore) + state.embersCollected * CONFIG.emberScore;
}

function platformAt(world, x, feetY) {
  // The highest platform whose top is at or below the knight's feet near x.
  let best = null;
  for (const p of world.platforms) {
    if (x >= p.x - 4 && x <= p.x + p.w + 4 && p.y >= feetY - 14) {
      if (!best || p.y < best.y) best = p;
    }
  }
  return best;
}

export function groundAhead(world, x, feetY) {
  return platformAt(world, x, feetY) !== null;
}

export function spawnParticles(state, x, y, count, palette, spread = 130) {
  for (let i = 0; i < count; i++) {
    const a = state.world.rng() * Math.PI * 2;
    const s = 30 + state.world.rng() * spread;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 60,
      life: 0.45 + state.world.rng() * 0.5,
      maxLife: 0.95,
      size: 2 + state.world.rng() * 3.5,
      color: palette[state.world.rng() < 0.5 ? 'ember' : 'lavaMid'],
    });
  }
}

function loseShield(state, reason) {
  const k = state.knight;
  state.shields -= 1;
  state.events.push('clang');
  state.shake = 10;
  spawnParticles(state, k.x + 17, k.y + 26, 16, { ember: '#ffc44d', lavaMid: '#ff7a26' });
  state.floaters.push({ x: k.x, y: k.y - 18, text: reason === 'fall' ? 'SPLASH!' : 'CLANG!', life: 1 });
  if (state.shields <= 0) {
    k.dead = true;
    return;
  }
  // Respawn on the last safe ground, lava pushed back to keep it fair.
  k.x = Math.max(k.lastSafeX, state.lavaX + 190);
  k.y = k.lastSafeY;
  k.vy = 0;
  k.jumpsUsed = 0;
  k.invulnerable = CONFIG.invulnerableSeconds;
  state.lavaX = Math.min(state.lavaX, k.x - 330);
}

function tryJump(state) {
  const k = state.knight;
  if (k.grounded || k.coyote > 0) {
    k.vy = CONFIG.jumpVelocity;
    k.grounded = false;
    k.coyote = 0;
    k.jumpsUsed = 1;
    state.events.push('jump');
    spawnParticles(state, k.x + 17, k.y + CONFIG.knightHeight, 5, { ember: '#ffc44d', lavaMid: '#ff9a3c' }, 70);
    return true;
  }
  if (k.jumpsUsed < 2) {
    k.vy = CONFIG.doubleJumpVelocity;
    k.jumpsUsed = 2;
    state.events.push('double');
    spawnParticles(state, k.x + 17, k.y + CONFIG.knightHeight, 9, { ember: '#ffe9a0', lavaMid: '#ff7a26' }, 90);
    return true;
  }
  return false;
}

// One fixed simulation step. `wantJump` is an edge-triggered press this step.
export function stepWorld(state, dt, wantJump) {
  const k = state.knight;
  const world = state.world;
  const speed = runSpeedForStage(state.stage);
  state.time += dt;
  state.stageTime += dt;
  k.runTime += dt;

  if (wantJump) k.jumpBuffer = CONFIG.jumpBufferSeconds;
  else k.jumpBuffer = Math.max(0, k.jumpBuffer - dt);
  if (k.jumpBuffer > 0 && tryJump(state)) k.jumpBuffer = 0;

  // Auto-run and gravity.
  const wasGrounded = k.grounded;
  const prevFeet = k.y + CONFIG.knightHeight;
  k.x += speed * dt;
  k.vy = Math.min(1500, k.vy + CONFIG.gravity * dt);
  k.y += k.vy * dt;
  const feet = k.y + CONFIG.knightHeight;

  // Landing: snap to a platform top crossed this step.
  k.grounded = false;
  if (k.vy >= 0) {
    for (const p of world.platforms) {
      if (k.x + CONFIG.knightWidth > p.x && k.x < p.x + p.w && prevFeet <= p.y + 1 && feet >= p.y) {
        k.y = p.y - CONFIG.knightHeight;
        if (!wasGrounded) spawnParticles(state, k.x + 17, p.y, 7, { ember: '#ffc44d', lavaMid: '#c9a68a' }, 80);
        k.vy = 0;
        k.grounded = true;
        k.jumpsUsed = 0;
        k.lastSafeX = k.x;
        k.lastSafeY = k.y;
        break;
      }
    }
  }
  if (wasGrounded && !k.grounded && k.vy >= 0) k.coyote = CONFIG.coyoteSeconds;
  else k.coyote = Math.max(0, k.coyote - dt);
  k.invulnerable = Math.max(0, k.invulnerable - dt);

  // The lava wall advances; it surges while the knight is hurt or stalling.
  const lavaSpeed = lavaSpeedForStage(state.stage) + (k.invulnerable > 0 ? CONFIG.lavaCatchupBoost : 0);
  state.lavaX += lavaSpeed * dt;
  if (state.lavaX > k.x - 26 && k.invulnerable <= 0) loseShield(state, 'lava');
  else if (state.lavaX > k.x - 26 && k.invulnerable > 0) state.lavaX = k.x - 120;

  // Fell into a pit (or the lava below the ruins).
  if (k.y > 760 && k.invulnerable <= 0) loseShield(state, 'fall');
  else if (k.y > 900) { k.y = 900; k.vy = 0; }

  // Spikes.
  if (k.invulnerable <= 0 && k.grounded) {
    for (const s of world.spikes) {
      if (k.x + 26 > s.x && k.x + 8 < s.x + s.w && Math.abs((k.y + CONFIG.knightHeight) - s.y) < 6) {
        loseShield(state, 'spike');
        break;
      }
    }
  }

  // Bats drift on sine patrols; touching one costs a shield.
  for (const b of world.bats) {
    b.x = b.baseX + Math.sin(state.stageTime * b.speed + b.phase) * b.rangeX;
    b.y = b.baseY + Math.sin(state.stageTime * b.speed * 1.7 + b.phase * 2) * 16;
    if (k.invulnerable <= 0 && Math.abs(b.x - (k.x + 17)) < 30 && Math.abs(b.y - (k.y + 22)) < 30) {
      loseShield(state, 'bat');
    }
  }

  // Embers.
  for (const e of world.embers) {
    if (e.taken) continue;
    const bobY = e.y + Math.sin(state.time * 3 + e.bobPhase) * 5;
    if (Math.abs(e.x - (k.x + 17)) < 30 && Math.abs(bobY - (k.y + 24)) < 36) {
      e.taken = true;
      state.embersCollected += 1;
      state.events.push('ember');
      spawnParticles(state, e.x, bobY, 6, { ember: '#ffd97a', lavaMid: '#ff9a3c' }, 70);
      state.floaters.push({ x: e.x - 10, y: bobY - 22, text: '+25', life: 0.7 });
    }
  }

  state.distanceScore = Math.max(state.distanceScore, k.x * CONFIG.distanceScorePerPixel);

  // Particles and floaters.
  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 300 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const f of state.floaters) { f.life -= dt; f.y -= 34 * dt; }
  state.floaters = state.floaters.filter((f) => f.life > 0);
  state.shake = Math.max(0, state.shake - dt * 26);

  // Camera follows with lookahead, clamped to the stage.
  const targetCam = k.x - 330 + CONFIG.cameraLookahead;
  state.cameraX += (targetCam - state.cameraX) * Math.min(1, dt * 7);
  if (state.cameraX < 0) state.cameraX = 0;

  // Reaching the gate clears the stage.
  if (k.x >= world.gateX) return 'stage-clear';
  if (k.dead) return 'game-over';
  return 'running';
}

export function advanceStage(state) {
  state.stage += 1;
  state.world = buildStage(state.runSeed, state.stage);
  state.knight = createKnight(90);
  state.cameraX = 0;
  state.lavaX = -560;
  state.stageTime = 0;
  state.particles = [];
  state.floaters = [];
}

// All canvas drawing: parallax castle silhouettes, stone ruins, hazards,
// the knight, the lava wall and particles. Pure presentation — no game rules.

import { CONFIG, VIEW_HEIGHT, VIEW_WIDTH, paletteForStage } from './config.js';
import { createRng } from './rng.js';

function drawSky(ctx, palette, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  grad.addColorStop(0, palette.skyTop);
  grad.addColorStop(0.55, palette.skyMid);
  grad.addColorStop(1, palette.skyLow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // A low, huge dusk sun sinking behind the ruins.
  const sunX = VIEW_WIDTH * 0.72;
  const sunY = 400 + Math.sin(time * 0.1) * 4;
  const glow = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, 260);
  glow.addColorStop(0, palette.sunGlow);
  glow.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 280, sunY - 280, 560, 560);
  ctx.fillStyle = palette.sunCore;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
  ctx.fill();
}

// One parallax layer of castle silhouettes: towers, battlements, broken walls.
// The skyline is generated from a fixed seed so it never flickers between frames.
function drawCastleLayer(ctx, cameraX, factor, baseY, color, seed, minH, maxH) {
  const rng = createRng(seed);
  const span = 2600;
  const offset = -((cameraX * factor) % span);
  ctx.fillStyle = color;
  for (let copy = 0; copy < 2; copy++) {
    const layerRng = createRng(seed);
    let x = offset + copy * span;
    while (x < VIEW_WIDTH + 40) {
      const w = 90 + layerRng() * 150;
      const h = minH + layerRng() * (maxH - minH);
      ctx.fillRect(x, baseY - h, w, h + 300);
      // Tower with battlements.
      if (layerRng() < 0.6) {
        const tw = 34 + layerRng() * 26;
        const tx = x + (w - tw) / 2;
        const th = h + 30 + layerRng() * 60;
        ctx.fillRect(tx, baseY - th, tw, th + 300);
        for (let m = 0; m < 3; m++) ctx.fillRect(tx + m * (tw / 3), baseY - th - 10, tw / 5, 12);
        // A lit window.
        ctx.fillStyle = 'rgba(255,190,90,0.75)';
        ctx.fillRect(tx + tw / 2 - 3, baseY - th + 34, 6, 10);
        ctx.fillStyle = color;
      }
      x += w + 24 + layerRng() * 90;
    }
    void rng;
  }
}

function drawPlatforms(ctx, state, palette) {
  const cam = state.cameraX;
  for (const p of state.world.platforms) {
    const sx = p.x - cam;
    if (sx + p.w < -20 || sx > VIEW_WIDTH + 20) continue;
    ctx.fillStyle = palette.stoneFace;
    ctx.fillRect(sx, p.y, p.w, VIEW_HEIGHT - p.y + 40);
    ctx.fillStyle = palette.stoneTop;
    ctx.fillRect(sx, p.y, p.w, 14);
    ctx.fillStyle = palette.stoneEdge;
    ctx.fillRect(sx, p.y, p.w, 4);
    // Cracks and brick seams for texture.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    const seedStep = Math.floor(p.x / 90);
    for (let i = 0; i < p.w / 90; i++) {
      const bx = sx + ((seedStep * 37 + i * 90) % Math.max(90, p.w));
      ctx.fillRect(bx, p.y + 34 + ((i * 53) % 60), 42, 3);
    }
  }
}

function drawSpikes(ctx, state) {
  const cam = state.cameraX;
  ctx.fillStyle = '#d8dbe2';
  for (const s of state.world.spikes) {
    const sx = s.x - cam;
    if (sx + s.w < -10 || sx > VIEW_WIDTH + 10) continue;
    for (let i = 0; i < s.count; i++) {
      const bx = sx + i * 30;
      ctx.beginPath();
      ctx.moveTo(bx, s.y);
      ctx.lineTo(bx + 15, s.y - 30);
      ctx.lineTo(bx + 30, s.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawEmbers(ctx, state, palette) {
  const cam = state.cameraX;
  for (const e of state.world.embers) {
    if (e.taken) continue;
    const sx = e.x - cam;
    if (sx < -20 || sx > VIEW_WIDTH + 20) continue;
    const y = e.y + Math.sin(state.time * 3 + e.bobPhase) * 5;
    const pulse = 1 + Math.sin(state.time * 5 + e.bobPhase) * 0.15;
    const glow = ctx.createRadialGradient(sx, y, 1, sx, y, 20 * pulse);
    glow.addColorStop(0, 'rgba(255,210,110,0.9)');
    glow.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 22, y - 22, 44, 44);
    ctx.fillStyle = palette.ember;
    ctx.beginPath();
    ctx.moveTo(sx, y - 10 * pulse);
    ctx.quadraticCurveTo(sx + 8 * pulse, y + 2, sx, y + 10 * pulse);
    ctx.quadraticCurveTo(sx - 8 * pulse, y + 2, sx, y - 10 * pulse);
    ctx.fill();
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(sx, y + 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBats(ctx, state, time) {
  const cam = state.cameraX;
  ctx.fillStyle = '#241a2e';
  for (const b of state.world.bats) {
    const sx = b.x - cam;
    if (sx < -40 || sx > VIEW_WIDTH + 40) continue;
    const flap = Math.sin(time * 14 + b.phase) * 7;
    ctx.beginPath();
    ctx.moveTo(sx - 20, b.y - flap);
    ctx.quadraticCurveTo(sx - 8, b.y - 10, sx, b.y);
    ctx.quadraticCurveTo(sx + 8, b.y - 10, sx + 20, b.y - flap);
    ctx.quadraticCurveTo(sx + 8, b.y + 8, sx, b.y + 6);
    ctx.quadraticCurveTo(sx - 8, b.y + 8, sx - 20, b.y - flap);
    ctx.fill();
    ctx.fillStyle = '#ff5a4d';
    ctx.fillRect(sx - 4, b.y - 1, 2.4, 2.4);
    ctx.fillRect(sx + 2, b.y - 1, 2.4, 2.4);
    ctx.fillStyle = '#241a2e';
  }
}

function drawGate(ctx, state, time) {
  const sx = state.world.gateX - state.cameraX;
  if (sx < -140 || sx > VIEW_WIDTH + 140) return;
  const gy = CONFIG.groundY;
  const glowPulse = 0.75 + Math.sin(time * 3) * 0.25;
  const glow = ctx.createRadialGradient(sx + 40, gy - 90, 8, sx + 40, gy - 90, 130);
  glow.addColorStop(0, `rgba(140,255,190,${0.5 * glowPulse})`);
  glow.addColorStop(1, 'rgba(140,255,190,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 100, gy - 230, 280, 280);
  ctx.fillStyle = '#3a2c40';
  ctx.fillRect(sx - 8, gy - 190, 16, 190);
  ctx.fillRect(sx + 72, gy - 190, 16, 190);
  ctx.fillRect(sx - 14, gy - 204, 108, 16);
  ctx.fillStyle = '#8affbe';
  ctx.fillRect(sx + 6, gy - 188, 68, 6);
  ctx.fillStyle = `rgba(160,255,200,${0.35 + 0.3 * glowPulse})`;
  ctx.fillRect(sx + 10, gy - 182, 60, 182);
}

function drawLavaWall(ctx, state, palette, time) {
  const sx = state.lavaX - state.cameraX;
  if (sx < -420) return;
  const grad = ctx.createLinearGradient(Math.min(sx, 0), 0, Math.max(sx, 1), 0);
  grad.addColorStop(0, palette.lavaDeep);
  grad.addColorStop(0.75, palette.lavaMid);
  grad.addColorStop(1, palette.lavaCore);
  ctx.fillStyle = grad;
  ctx.fillRect(-40, 0, sx + 40, VIEW_HEIGHT);
  // Churning flame tongues on the leading edge.
  for (let i = 0; i < 9; i++) {
    const fy = 60 + i * 74 + Math.sin(time * 6 + i * 1.7) * 14;
    const len = 26 + Math.sin(time * 8 + i * 2.3) * 12;
    ctx.fillStyle = i % 2 ? palette.lavaMid : palette.lavaCore;
    ctx.beginPath();
    ctx.moveTo(sx - 4, fy - 20);
    ctx.quadraticCurveTo(sx + len, fy, sx - 4, fy + 20);
    ctx.closePath();
    ctx.fill();
  }
  // Lava fills the pits below the ruins, too.
  ctx.fillStyle = palette.lavaMid;
  ctx.fillRect(0, VIEW_HEIGHT - 46, VIEW_WIDTH, 46);
  ctx.fillStyle = palette.lavaCore;
  for (let i = 0; i < 14; i++) {
    const bx = ((i * 173 + Math.sin(time * 2 + i) * 9) % VIEW_WIDTH);
    ctx.fillRect(bx, VIEW_HEIGHT - 46, 60, 5);
  }
}

export function drawKnight(ctx, state, palette) {
  const k = state.knight;
  const sx = k.x - state.cameraX;
  const sy = k.y;
  // Mercy blink while invulnerable.
  if (k.invulnerable > 0 && Math.floor(state.time * 14) % 2 === 0 && !k.dead) ctx.globalAlpha = 0.45;

  const runBob = k.grounded ? Math.abs(Math.sin(k.runTime * 13)) * 4 : 0;
  const y = sy - runBob;
  // Flowing red cloak behind the body.
  ctx.fillStyle = palette.cloakDark;
  ctx.beginPath();
  ctx.moveTo(sx + 6, y + 12);
  const wave = Math.sin(k.runTime * 10) * 4;
  ctx.quadraticCurveTo(sx - 16, y + 26 + wave, sx - 13, y + 44 + wave);
  ctx.lineTo(sx + 8, y + 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.cloak;
  ctx.fillRect(sx + 2, y + 10, 9, 30);
  // Legs (running stride) and boots.
  ctx.fillStyle = palette.knightShade;
  const stride = k.grounded ? Math.sin(k.runTime * 13) * 8 : 6;
  ctx.fillRect(sx + 8, y + 38, 7, 12 + Math.max(0, stride) * 0.4);
  ctx.fillRect(sx + 20, y + 38, 7, 12 + Math.max(0, -stride) * 0.4);
  // Steel body and arm.
  ctx.fillStyle = palette.knightSteel;
  ctx.fillRect(sx + 8, y + 10, 20, 30);
  ctx.fillStyle = palette.knightShade;
  ctx.fillRect(sx + 8, y + 24, 20, 4);
  ctx.fillRect(sx + 26, y + 16, 8, 6);
  // Sword pointing forward.
  ctx.fillStyle = '#e8edf7';
  ctx.fillRect(sx + 32, y + 14, 20, 4);
  ctx.fillStyle = '#8a6b32';
  ctx.fillRect(sx + 29, y + 12, 4, 9);
  // Helmet with a golden plume.
  ctx.fillStyle = palette.knightSteel;
  ctx.beginPath();
  ctx.arc(sx + 18, y + 6, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(sx + 7, y + 4, 22, 7);
  ctx.fillStyle = '#2c3242';
  ctx.fillRect(sx + 20, y + 6, 8, 3);
  ctx.fillStyle = palette.plume;
  ctx.beginPath();
  ctx.moveTo(sx + 8, y - 4);
  ctx.quadraticCurveTo(sx - 4, y - 12 + wave * 0.4, sx - 8, y - 2);
  ctx.quadraticCurveTo(sx + 0, y - 2, sx + 10, y + 1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const sx = p.x - state.cameraX;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(sx, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

// Drifting ambient embers that make the dusk feel alive.
function drawAmbientEmbers(ctx, state, palette) {
  ctx.fillStyle = palette.ember;
  for (let i = 0; i < 26; i++) {
    const drift = (state.time * (14 + (i % 5) * 5) + i * 211) % (VIEW_WIDTH + 60);
    const y = 120 + ((i * 149) % 430) + Math.sin(state.time * 1.4 + i * 2.1) * 16;
    ctx.globalAlpha = 0.25 + ((i * 37) % 10) / 18;
    ctx.fillRect(VIEW_WIDTH - drift, y, 3, 3);
  }
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, state) {
  const palette = paletteForStage(state.stage);
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.sin(state.time * 70) * state.shake) / 2, (Math.cos(state.time * 63) * state.shake) / 2);
  }
  drawSky(ctx, palette, state.time);
  drawCastleLayer(ctx, state.cameraX, 0.16, 470, palette.ruinFar, 1234, 120, 260);
  drawCastleLayer(ctx, state.cameraX, 0.38, 520, palette.ruinMid, 987, 80, 190);
  drawCastleLayer(ctx, state.cameraX, 0.62, 560, palette.ruinNear, 555, 40, 110);
  drawPlatforms(ctx, state, palette);
  drawGate(ctx, state, state.time);
  drawSpikes(ctx, state);
  drawEmbers(ctx, state, palette);
  drawBats(ctx, state, state.time);
  drawKnight(ctx, state, palette);
  drawParticles(ctx, state);
  drawLavaWall(ctx, state, palette, state.time);
  drawAmbientEmbers(ctx, state, palette);
  ctx.restore();

  // Floating score text (+25, CLANG!, …).
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.min(1, f.life * 1.6);
    ctx.fillStyle = '#ffe9c9';
    ctx.fillText(f.text, f.x - state.cameraX, f.y);
  }
  ctx.globalAlpha = 1;
}

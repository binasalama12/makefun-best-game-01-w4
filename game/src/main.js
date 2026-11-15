// Cinder Knight — entry point: fixed-timestep loop, screen state machine
// (title → playing ⇄ paused → stage banner → game over), sound wiring and
// the deterministic shot mode used for screenshots.

import { FIXED_DT, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { drawGameOverScreen, drawHud, drawPauseScreen, drawStageBanner, drawTitleScreen } from './hud.js';
import { drawWorld } from './render.js';
import { parseShotRequest, prepareShotState } from './shots.js';
import { advanceStage, createGameState, stepWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_WIDTH * dpr;
  canvas.height = VIEW_HEIGHT * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

const audio = createAudio();
const input = createInput(window);

let mode = 'title'; // title | playing | paused | banner | gameover
let state = createGameState((Math.random() * 1e9) >>> 0);
let bannerTimer = 0;
let announcedMode = '';

function announce(text) {
  if (statusEl && announcedMode !== text) {
    announcedMode = text;
    statusEl.textContent = text;
  }
}

function drainSoundEvents() {
  for (const event of state.events) {
    if (event === 'jump') audio.playJump();
    else if (event === 'double') audio.playDoubleJump();
    else if (event === 'ember') audio.playEmber();
    else if (event === 'clang') audio.playClang();
  }
  state.events.length = 0;
}

function startRun() {
  state = createGameState((Math.random() * 1e9) >>> 0);
  mode = 'playing';
  input.clearAll();
}

function handleGlobalKeys() {
  if (input.consume('mute')) audio.toggleMute();
  if (mode === 'title' && input.consume('start')) {
    audio.unlock();
    startRun();
    return;
  }
  if (mode === 'gameover' && input.consume('restart')) {
    audio.unlock();
    startRun();
    return;
  }
  if ((mode === 'playing' || mode === 'paused') && input.consume('pause')) {
    mode = mode === 'playing' ? 'paused' : 'playing';
  }
}

function stepOnce() {
  handleGlobalKeys();
  if (mode === 'playing') {
    const wantJump = input.consume('jump');
    const result = stepWorld(state, FIXED_DT, wantJump);
    drainSoundEvents();
    if (result === 'stage-clear') {
      audio.playGate();
      advanceStage(state);
      mode = 'banner';
      bannerTimer = 1.6;
    } else if (result === 'game-over') {
      audio.playGameOver();
      mode = 'gameover';
    }
  } else if (mode === 'banner') {
    state.time += FIXED_DT;
    bannerTimer -= FIXED_DT;
    if (bannerTimer <= 0) mode = 'playing';
  } else if (mode === 'title') {
    state.time += FIXED_DT;
  }
}

function drawFrame() {
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  drawWorld(ctx, state);
  if (mode === 'title') {
    drawTitleScreen(ctx, state);
    announce('Cinder Knight. Press Enter to play.');
  } else {
    drawHud(ctx, state, audio.isMuted());
    if (mode === 'paused') drawPauseScreen(ctx);
    if (mode === 'banner') drawStageBanner(ctx, state);
    if (mode === 'gameover') {
      drawGameOverScreen(ctx, state);
      announce('Game over. Press R to restart.');
    }
  }
}

// --- Shot mode: build the scene, simulate deterministically, draw one frame.
const shot = parseShotRequest(window.location.search);
if (shot) {
  const prepared = prepareShotState(shot.scene, shot.seed);
  state = prepared.state;
  mode = prepared.mode;
  drawFrame();
  window.__shotReady = true;
} else {
  // --- Live loop: fixed timestep with an accumulator, render every rAF.
  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    accumulator += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (accumulator >= FIXED_DT) {
      stepOnce();
      accumulator -= FIXED_DT;
    }
    drawFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

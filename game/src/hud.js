// Heads-up display and full-screen states: title, pause, stage banner and
// the game-over results panel. Drawn over the world every frame.

import { VIEW_HEIGHT, VIEW_WIDTH, paletteForStage } from './config.js';
import { totalScore } from './world.js';

function drawShieldIcon(ctx, x, y, filled, palette) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 22, y);
  ctx.lineTo(x + 22, y + 16);
  ctx.quadraticCurveTo(x + 22, y + 30, x + 11, y + 36);
  ctx.quadraticCurveTo(x, y + 30, x, y + 16);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#ffb84d';
    ctx.fill();
    ctx.fillStyle = '#ff7a26';
    ctx.fillRect(x + 9, y + 5, 4, 20);
  } else {
    ctx.strokeStyle = 'rgba(255,233,201,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  void palette;
}

export function drawHud(ctx, state, muted) {
  const palette = paletteForStage(state.stage);
  ctx.fillStyle = 'rgba(16,8,18,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, 58);

  ctx.textAlign = 'left';
  ctx.fillStyle = palette.textMain;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText(`SCORE ${totalScore(state)}`, 22, 38);

  // Ember count with a little flame glyph.
  ctx.fillStyle = palette.ember;
  ctx.beginPath();
  ctx.moveTo(268, 16);
  ctx.quadraticCurveTo(278, 30, 268, 42);
  ctx.quadraticCurveTo(258, 30, 268, 16);
  ctx.fill();
  ctx.fillStyle = palette.textMain;
  ctx.fillText(`× ${state.embersCollected}`, 284, 38);

  ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${state.stage}`, VIEW_WIDTH / 2, 38);

  // Shields, top right.
  for (let i = 0; i < 3; i++) drawShieldIcon(ctx, VIEW_WIDTH - 118 + i * 34, 12, i < state.shields, palette);

  ctx.textAlign = 'right';
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.fillStyle = palette.textDim;
  ctx.fillText(muted ? 'M — sound off' : 'M — mute · P — pause', VIEW_WIDTH - 22, VIEW_HEIGHT - 14);
  ctx.textAlign = 'left';
}

function dimScreen(ctx, alpha) {
  ctx.fillStyle = `rgba(10,4,14,${alpha})`;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

export function drawTitleScreen(ctx, state) {
  const palette = paletteForStage(state.stage);
  dimScreen(ctx, 0.34);
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.ember;
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText('· A TINY EMBER TALE ·', VIEW_WIDTH / 2, 168);
  ctx.fillStyle = palette.textMain;
  ctx.font = '900 96px Georgia, serif';
  ctx.fillText('CINDER KNIGHT', VIEW_WIDTH / 2, 268);
  ctx.fillStyle = palette.cloak;
  ctx.fillRect(VIEW_WIDTH / 2 - 260, 292, 520, 5);

  ctx.fillStyle = palette.textMain;
  ctx.font = '500 23px system-ui, sans-serif';
  ctx.fillText('The lava is rising. Run the ruined castle, gather embers,', VIEW_WIDTH / 2, 356);
  ctx.fillText('and reach the glowing gate before the wall of fire takes you.', VIEW_WIDTH / 2, 388);
  ctx.font = '500 21px system-ui, sans-serif';
  ctx.fillStyle = palette.textDim;
  ctx.fillText('SPACE / CLICK — jump · press again mid-air — double-jump', VIEW_WIDTH / 2, 446);
  ctx.fillText('Dodge spikes and bats · falling or lava costs a shield · 3 shields', VIEW_WIDTH / 2, 478);

  ctx.fillStyle = palette.ember;
  ctx.font = '700 30px system-ui, sans-serif';
  // Visible two thirds of each blink cycle, so the prompt reads at a glance.
  const blink = Math.floor(state.time * 1.6) % 3 !== 2;
  if (blink) ctx.fillText('Press Enter to play', VIEW_WIDTH / 2, 560);
  ctx.textAlign = 'left';
}

export function drawPauseScreen(ctx) {
  dimScreen(ctx, 0.55);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9c9';
  ctx.font = '900 64px Georgia, serif';
  ctx.fillText('PAUSED', VIEW_WIDTH / 2, 330);
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillStyle = '#c9a68a';
  ctx.fillText('Press P to resume', VIEW_WIDTH / 2, 380);
  ctx.textAlign = 'left';
}

export function drawStageBanner(ctx, state) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9c9';
  ctx.font = '900 58px Georgia, serif';
  ctx.fillText(`STAGE ${state.stage}`, VIEW_WIDTH / 2, 300);
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillStyle = '#ffc44d';
  ctx.fillText('The ruins darken… the lava quickens…', VIEW_WIDTH / 2, 344);
  ctx.textAlign = 'left';
}

export function drawGameOverScreen(ctx, state) {
  const palette = paletteForStage(state.stage);
  dimScreen(ctx, 0.62);
  ctx.fillStyle = 'rgba(30,14,24,0.92)';
  ctx.fillRect(VIEW_WIDTH / 2 - 300, 168, 600, 360);
  ctx.strokeStyle = palette.lavaMid;
  ctx.lineWidth = 3;
  ctx.strokeRect(VIEW_WIDTH / 2 - 300, 168, 600, 360);

  ctx.textAlign = 'center';
  ctx.fillStyle = palette.lavaMid;
  ctx.font = '900 56px Georgia, serif';
  ctx.fillText('THE EMBER FALLS', VIEW_WIDTH / 2, 252);
  ctx.fillStyle = palette.textMain;
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillText(`Stage reached — ${state.stage}`, VIEW_WIDTH / 2, 322);
  ctx.fillText(`Embers gathered — ${state.embersCollected}`, VIEW_WIDTH / 2, 362);
  ctx.font = '700 34px system-ui, sans-serif';
  ctx.fillStyle = palette.ember;
  ctx.fillText(`FINAL SCORE ${totalScore(state)}`, VIEW_WIDTH / 2, 424);
  ctx.fillStyle = palette.textMain;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.fillText('Press R to restart', VIEW_WIDTH / 2, 486);
  ctx.textAlign = 'left';
}

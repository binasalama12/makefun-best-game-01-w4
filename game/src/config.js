// Cinder Knight — tuning constants and the dusk palette.
// Every gameplay number lives here so the other modules stay declarative.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const FIXED_DT = 1 / 60;

export const CONFIG = {
  gravity: 2100,               // px / s^2 pulling the knight down
  jumpVelocity: -820,          // first jump impulse
  doubleJumpVelocity: -740,    // second (air) jump impulse
  coyoteSeconds: 0.09,         // grace window after leaving a ledge
  jumpBufferSeconds: 0.12,     // a press slightly early still jumps
  groundY: 560,                // y of the main ruin floor's top surface
  knightWidth: 34,
  knightHeight: 52,
  startShields: 3,
  invulnerableSeconds: 1.6,    // mercy window after losing a shield
  emberScore: 25,
  distanceScorePerPixel: 0.1,
  baseRunSpeed: 265,           // stage 1 auto-run speed, px / s
  runSpeedPerStage: 32,        // each stage runs faster
  baseLavaSpeed: 238,          // the lava wall is a little slower than the knight
  lavaSpeedPerStage: 30,
  lavaCatchupBoost: 55,        // extra lava speed while the knight is hurt / airborne long
  baseLevelLength: 4300,
  levelLengthPerStage: 550,
  cameraLookahead: 150,        // camera leads the knight so jumps can be read early
  stageClearPauseSeconds: 1.6,
};

export function runSpeedForStage(stage) {
  return CONFIG.baseRunSpeed + (stage - 1) * CONFIG.runSpeedPerStage;
}

export function lavaSpeedForStage(stage) {
  return CONFIG.baseLavaSpeed + (stage - 1) * CONFIG.lavaSpeedPerStage;
}

export function levelLengthForStage(stage) {
  return CONFIG.baseLevelLength + (stage - 1) * CONFIG.levelLengthPerStage;
}

// The dusk deepens with every stage: the sky and ruins darken toward night
// while the lava stays fiercely orange.
export function paletteForStage(stage) {
  const depth = Math.min(1, (stage - 1) * 0.16);
  const mix = (a, b) => Math.round(a + (b - a) * depth);
  return {
    skyTop: `rgb(${mix(46, 16)},${mix(24, 8)},${mix(74, 34)})`,
    skyMid: `rgb(${mix(112, 52)},${mix(52, 22)},${mix(84, 44)})`,
    skyLow: `rgb(${mix(196, 120)},${mix(96, 44)},${mix(66, 30)})`,
    sunCore: '#ffd9a0',
    sunGlow: 'rgba(255,150,60,0.35)',
    ruinFar: `rgb(${mix(74, 30)},${mix(50, 20)},${mix(88, 44)})`,
    ruinMid: `rgb(${mix(56, 22)},${mix(36, 14)},${mix(70, 34)})`,
    ruinNear: `rgb(${mix(38, 14)},${mix(24, 10)},${mix(48, 22)})`,
    stoneTop: '#6b4a52',
    stoneFace: '#46303c',
    stoneEdge: '#8a5f5e',
    lavaCore: '#ffcf5e',
    lavaMid: '#ff7a26',
    lavaDeep: '#d63c14',
    ember: '#ffc44d',
    knightSteel: '#cfd6e4',
    knightShade: '#7e8aa5',
    cloak: '#c62f3b',
    cloakDark: '#8e1f2b',
    plume: '#ffdf6b',
    textMain: '#ffe9c9',
    textDim: '#c9a68a',
  };
}

// Keyboard and pointer input. Actions are edge-triggered flags the game
// consumes once per fixed step, so a press is never lost between frames.

export function createInput(target) {
  const pressed = { jump: false, start: false, pause: false, restart: false, mute: false };
  let jumpHeld = false;

  function press(action) {
    pressed[action] = true;
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    switch (event.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        jumpHeld = true;
        press('jump');
        event.preventDefault();
        break;
      case 'Enter':
        press('start');
        press('jump');
        break;
      case 'KeyP':
      case 'Escape':
        press('pause');
        break;
      case 'KeyR':
        press('restart');
        break;
      case 'KeyM':
        press('mute');
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') jumpHeld = false;
  }

  function onPointerDown(event) {
    jumpHeld = true;
    press('jump');
    press('start');
    event.preventDefault();
  }

  function onPointerUp() {
    jumpHeld = false;
  }

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointerup', onPointerUp);
  target.addEventListener('pointercancel', onPointerUp);

  return {
    // Reads and clears one action flag; call once per fixed step.
    consume(action) {
      const value = pressed[action];
      pressed[action] = false;
      return value;
    },
    peek(action) {
      return pressed[action];
    },
    isJumpHeld() {
      return jumpHeld;
    },
    clearAll() {
      for (const key of Object.keys(pressed)) pressed[key] = false;
      jumpHeld = false;
    },
  };
}

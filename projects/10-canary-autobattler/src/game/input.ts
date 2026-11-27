export type Dir = 'up' | 'down' | 'left' | 'right';

// Mientras hay una libreta abierta el mundo se congela, pero el canvas sigue animando.
export const ui = { paused: false, worldActive: false };

export const input = {
  held: new Set<Dir>(),
  aQueued: false,
  bQueued: false,
  press(d: Dir) { this.held.add(d); },
  release(d: Dir) { this.held.delete(d); },
  tapA() { this.aQueued = true; },
  tapB() { this.bQueued = true; },
  consumeA() { const v = this.aQueued; this.aQueued = false; return v; },
  consumeB() { const v = this.bQueued; this.bQueued = false; return v; },
  lastDir(): Dir | null {
    let last: Dir | null = null;
    this.held.forEach((d) => (last = d));
    return last;
  },
};

const KEYMAP: Record<string, Dir> = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
};

let bound = false;
export function bindKeyboard() {
  ui.worldActive = true;
  if (bound) return;
  bound = true;
  window.addEventListener('keydown', (e) => {
    if (!ui.worldActive || ui.paused || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const d = KEYMAP[e.code];
    if (d) { input.press(d); e.preventDefault(); return; }
    if (e.code === 'KeyZ' || e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyJ') { if (!e.repeat) input.tapA(); e.preventDefault(); }
    if (e.code === 'KeyX' || e.code === 'Escape' || e.code === 'Backspace' || e.code === 'KeyK') { if (!e.repeat) input.tapB(); e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const d = KEYMAP[e.code];
    if (d) input.release(d);
  });
  window.addEventListener('blur', () => input.held.clear());
}

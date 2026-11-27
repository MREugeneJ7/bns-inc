import { PAL } from './sprites';
import { beep } from './sfx';
import { save, touchSave } from './save';

export const SLOT_SYMBOLS = ['ROTO', 'BOLA', 'CHOL', '-70%', 'MIAU', '777!'] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

const BUST_LINES = [
  'Se deshilacho al respirar! Mañana vuelves a comprar otra.',
  'Encogio a talla Michino antes de salir del probador!',
  'Los bolsillos eran falsos y la manga se quedo en la percha.',
  'Gastas hoy, se rompe mañana y pasado otra vez a pasar caja!',
  'Costura reventada en tiempo record (11 segundos). Otra tirada?',
];

export interface SlotMachineState {
  brand: string;
  bet: number;
  phase: 'idle' | 'spin';
  t: number;
  stopped: number; // 0..3 rodillos parados
  reels: [number, number, number];
  targets: [number, number, number];
  msg1: string;
  msg2: string;
  wonFlash: number;
}

export function createSlotState(brand: string, bet: number): SlotMachineState {
  return {
    brand,
    bet,
    phase: 'idle',
    t: 0,
    stopped: 3,
    reels: [3, 4, 5],
    targets: [3, 4, 5],
    msg1: `Compra-ruleta en ${brand}: ${bet} duros por bolsa sorpresa.`,
    msg2: 'Gastas hoy, se rompe mañana y pasado vuelves a gastar!',
    wonFlash: 0,
  };
}

function rollTargets(rnd: () => number = Math.random): [number, number, number] {
  const r = rnd();
  if (r < 0.05) return [5, 5, 5]; // 777!
  if (r < 0.12) return [4, 4, 4]; // MIAU -> Gato Callejero!
  if (r < 0.22) return [3, 3, 3]; // -70% x3
  if (r < 0.44) {
    // Pareja premiada (ticket regalo x2)
    const pair = 2 + Math.floor(rnd() * 4);
    const other = Math.floor(rnd() * 2);
    const pos = Math.floor(rnd() * 3);
    return pos === 0 ? [other, pair, pair] : pos === 1 ? [pair, other, pair] : [pair, pair, other];
  }
  // Prenda desintegrada (3 distintos o ROTO/BOLA)
  const a = Math.floor(rnd() * 3);
  const b = (a + 1) % 3;
  const c = rnd() < 0.5 ? 0 : 1;
  return [a, b, c];
}

function settleSpin(s: SlotMachineState) {
  const [a, b, c] = s.reels;
  s.phase = 'idle';
  if (a === 5 && b === 5 && c === 5) {
    const win = s.bet * 6;
    save.duros += win;
    save.pc.push('gato_azotea');
    save.flags.seen_gato_azotea = true;
    touchSave();
    beep('fanfare');
    s.wonFlash = 90;
    s.msg1 = `777 MILAGRO TEXTIL!! Aguanta 48h! +${win} DUROS!`;
    s.msg2 = 'Ademas salio un GATO DE AZOTEA del probador (al PC)!';
    return;
  }
  if (a === 4 && b === 4 && c === 4) {
    const win = s.bet * 4;
    save.duros += win;
    save.pc.push('gato_callejero');
    save.flags.seen_gato_callejero = true;
    touchSave();
    beep('fanfare');
    s.wonFlash = 75;
    s.msg1 = `TRIPLE MIAU!! +${win} DUROS y GATO CALLEJERO!`;
    s.msg2 = 'Estaba durmiendo entre los jerseis (guardado en tu PC)!';
    return;
  }
  if (a === 3 && b === 3 && c === 3) {
    const win = s.bet * 4;
    save.duros += win;
    touchSave();
    beep('fanfare');
    s.wonFlash = 60;
    s.msg1 = `TRIPLE ETIQUETA -70%!! Ganas +${win} DUROS!`;
    s.msg2 = 'Lo revendiste antes de que se descosiera la manga!';
    return;
  }
  const good = [a, b, c].filter((v) => v >= 2);
  if (good.length >= 2 && (a === b || b === c || a === c)) {
    const win = s.bet * 2;
    save.duros += win;
    touchSave();
    beep('open');
    s.wonFlash = 35;
    s.msg1 = `TICKET REGALO A TIEMPO! Recuperas +${win} DUROS!`;
    s.msg2 = 'Devolucion aceptada 3 segundos antes de hacer bolillas.';
    return;
  }
  beep('bump');
  s.msg1 = `CRAC! Prenda rota (-${s.bet}D).`;
  s.msg2 = BUST_LINES[(s.t + a + b + c) % BUST_LINES.length];
}

/** Devuelve true si el jugador sale de la maquina. */
export function updateSlotMachine(s: SlotMachineState, pressA: boolean, pressB: boolean): boolean {
  s.t++;
  if (s.wonFlash > 0) s.wonFlash--;

  if (s.phase === 'idle') {
    if (pressB) {
      beep('back');
      return true;
    }
    if (pressA) {
      if (save.duros < s.bet) {
        beep('bump');
        s.msg1 = `Necesitas ${s.bet} duros (llevas ${save.duros}D).`;
        s.msg2 = 'Ni pa unos calcetines te da! Gana duros en un cole y vuelve.';
        return false;
      }
      save.duros -= s.bet;
      touchSave();
      beep('open');
      s.phase = 'spin';
      s.stopped = 0;
      s.t = 0;
      s.targets = rollTargets();
      s.msg1 = 'Pasando tarjeta por caja... PULSA A PARA PARAR!';
      s.msg2 = 'Aguantara la costura hasta llegar al parking?!';
    }
    return false;
  }

  // Rodillos girando
  for (let i = s.stopped; i < 3; i++) {
    if (s.t % 3 === 0) s.reels[i] = (s.reels[i] + 1) % SLOT_SYMBOLS.length;
  }
  const autoStop = (s.stopped === 0 && s.t >= 38) || (s.stopped === 1 && s.t >= 68) || (s.stopped === 2 && s.t >= 98);
  if (pressA || autoStop) {
    s.reels[s.stopped] = s.targets[s.stopped];
    s.stopped++;
    beep('talk');
    if (s.stopped >= 3) settleSpin(s);
  }
  return false;
}

function drawSymbolIcon(ctx: CanvasRenderingContext2D, sym: SlotSymbol, x: number, y: number) {
  ctx.fillStyle = PAL[3];
  if (sym === 'ROTO') {
    // Camiseta rasgada por la mitad
    ctx.fillRect(x + 8, y + 4, 28, 8);
    ctx.fillRect(x + 12, y + 12, 20, 14);
    ctx.fillStyle = PAL[0];
    ctx.fillRect(x + 19, y + 8, 4, 6);
    ctx.fillRect(x + 21, y + 14, 4, 6);
    ctx.fillRect(x + 18, y + 20, 4, 6);
  } else if (sym === 'BOLA') {
    // Jersey encogido lleno de bolillas
    ctx.fillRect(x + 14, y + 8, 16, 14);
    ctx.fillStyle = PAL[1];
    ctx.fillRect(x + 16, y + 10, 12, 10);
    ctx.fillStyle = PAL[3];
    for (const [bx, by] of [[10, 6], [31, 9], [11, 21], [32, 20], [20, 13], [24, 17]]) ctx.fillRect(x + bx, y + by, 3, 3);
  } else if (sym === 'CHOL') {
    // Chola canaria de rebajas
    ctx.fillRect(x + 14, y + 4, 16, 22);
    ctx.fillStyle = PAL[1];
    ctx.fillRect(x + 16, y + 6, 12, 18);
    ctx.fillStyle = PAL[3];
    ctx.fillRect(x + 21, y + 8, 2, 6);
    ctx.fillRect(x + 16, y + 14, 5, 2);
    ctx.fillRect(x + 23, y + 14, 5, 2);
  } else if (sym === '-70%') {
    // Etiqueta de rebajas
    ctx.fillRect(x + 6, y + 7, 32, 16);
    ctx.fillStyle = PAL[0];
    ctx.fillRect(x + 8, y + 9, 28, 12);
    ctx.fillStyle = PAL[3];
    ctx.fillRect(x + 10, y + 13, 4, 4);
    ctx.fillRect(x + 17, y + 11, 16, 3);
    ctx.fillRect(x + 17, y + 16, 12, 3);
  } else if (sym === 'MIAU') {
    // Carita de gato callejero
    ctx.fillRect(x + 11, y + 4, 5, 5);
    ctx.fillRect(x + 28, y + 4, 5, 5);
    ctx.fillRect(x + 10, y + 9, 24, 15);
    ctx.fillStyle = PAL[0];
    ctx.fillRect(x + 14, y + 13, 4, 4);
    ctx.fillRect(x + 26, y + 13, 4, 4);
    ctx.fillRect(x + 20, y + 18, 4, 3);
  } else {
    // 777! brillante
    ctx.fillRect(x + 6, y + 6, 32, 18);
    ctx.fillStyle = PAL[0];
    ctx.fillText('777', x + 10, y + 11);
  }
}

function wrapLine(s: string, cols: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    if ((cur + ' ' + w).trim().length > cols) {
      out.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function drawSlotMachine(ctx: CanvasRenderingContext2D, W: number, H: number, s: SlotMachineState) {
  ctx.fillStyle = s.wonFlash > 0 && Math.floor(s.wonFlash / 4) % 2 === 0 ? PAL[0] : PAL[2];
  ctx.fillRect(0, 0, W, H);

  // Marco principal de la caja fast-fashion
  ctx.fillStyle = PAL[3]; ctx.fillRect(12, 10, W - 24, H - 20);
  ctx.fillStyle = PAL[0]; ctx.fillRect(16, 14, W - 32, H - 28);

  // Cabecera de la tienda
  ctx.fillStyle = PAL[3]; ctx.fillRect(22, 20, W - 44, 22);
  ctx.fillStyle = PAL[0];
  ctx.fillText(`${s.brand} · FAST FASHION`, 28, 27);

  // Saldo y coste
  ctx.fillStyle = PAL[1]; ctx.fillRect(22, 46, W - 44, 16);
  ctx.fillStyle = PAL[3];
  ctx.fillText(`SALDO: ${save.duros}D`, 28, 50);
  ctx.fillText(`TIRADA: ${s.bet}D`, 192, 50);

  // 3 Rodillos
  for (let i = 0; i < 3; i++) {
    const rx = 32 + i * 90;
    const ry = 70;
    const sym = SLOT_SYMBOLS[s.reels[i]];
    ctx.fillStyle = PAL[3]; ctx.fillRect(rx, ry, 76, 68);
    ctx.fillStyle = i < s.stopped ? PAL[0] : PAL[1];
    ctx.fillRect(rx + 3, ry + 3, 70, 62);
    drawSymbolIcon(ctx, sym, rx + 16, ry + 8);
    ctx.fillStyle = PAL[3]; ctx.fillRect(rx + 8, ry + 44, 60, 14);
    ctx.fillStyle = PAL[0]; ctx.fillText(sym, rx + 22, ry + 47);
  }

  // Tabla de premios compacta
  ctx.fillStyle = PAL[1]; ctx.fillRect(22, 146, W - 44, 34);
  ctx.fillStyle = PAL[3];
  ctx.fillText(`777=x6+GATO · MIAU=x4+GATO`, 30, 151);
  ctx.fillText(`-70%=x4 · PAREJA=VALE x2`, 38, 165);

  // Caja de resultado
  ctx.fillStyle = PAL[3]; ctx.fillRect(22, 186, W - 44, 60);
  ctx.fillStyle = PAL[0]; ctx.fillRect(24, 188, W - 48, 56);
  ctx.fillStyle = PAL[3];
  let ty = 193;
  for (const line of [...wrapLine(s.msg1, 31), ...wrapLine(s.msg2, 31)].slice(0, 4)) {
    ctx.fillText(line, 28, ty);
    ty += 12;
  }

  // Controles
  ctx.fillStyle = PAL[3]; ctx.fillRect(22, 252, W - 44, 16);
  ctx.fillStyle = PAL[0];
  ctx.fillText(
    s.phase === 'spin' ? 'A: PARAR RODILLO' : `A: COMPRAR (${s.bet}D)   B: SALIR`,
    s.phase === 'spin' ? 88 : 42,
    256,
  );
}

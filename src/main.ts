import { step, type LoopHooks } from './game/loop';
import { createGame, BOARD_W, BOARD_H } from './game/state';
import { Input } from './game/input';
import { drawBoard, drawGameOver, drawHud, drawTitle } from './render/draw';
import { Sound } from './audio/sound';
import { Profile } from './snap/profile';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function fitCanvas(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = BOARD_W * dpr;
  canvas.height = BOARD_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(window.innerWidth / BOARD_W, window.innerHeight / BOARD_H);
  canvas.style.width = `${BOARD_W * scale}px`;
  canvas.style.height = `${BOARD_H * scale}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function toBoard(clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scale = rect.width / BOARD_W;
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

const state = createGame();
const input = new Input();
const sound = new Sound();
const profile = new Profile();
void profile.load();

const LEADERBOARD_HIT = { x: BOARD_W / 2 - 90, y: BOARD_H / 2 - 4, w: 180, h: 32 };
let soundUnlocked = false;

const hooks: LoopHooks = {
  onRotate: () => sound.rotate(),
  onLock: () => sound.lock(),
  onLinesCleared: (count) => sound.linesCleared(count),
  onHardDrop: () => sound.hardDrop(),
  onLevelUp: () => sound.levelUp(),
  onGameOver: (score) => {
    sound.gameOver();
    profile.reportScore(score);
  },
};

canvas.addEventListener('pointerdown', (e) => {
  if (!soundUnlocked) {
    soundUnlocked = true;
    sound.unlock();
    sound.startPad();
  }
  const b = toBoard(e.clientX, e.clientY);
  if (
    state.phase === 'GAME_OVER' &&
    b.x >= LEADERBOARD_HIT.x && b.x <= LEADERBOARD_HIT.x + LEADERBOARD_HIT.w &&
    b.y >= LEADERBOARD_HIT.y && b.y <= LEADERBOARD_HIT.y + LEADERBOARD_HIT.h
  ) {
    profile.showLeaderboard();
    return;
  }
  input.down(b.x, b.y, state.active.col);
});
canvas.addEventListener('pointermove', (e) => {
  const b = toBoard(e.clientX, e.clientY);
  input.move(b.x);
});
canvas.addEventListener('pointerup', (e) => {
  const b = toBoard(e.clientX, e.clientY);
  input.up(b.x, b.y);
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  step(state, input, dt, hooks);

  ctx.clearRect(0, 0, BOARD_W, BOARD_H);
  if (state.phase === 'TITLE') {
    drawTitle(ctx);
  } else {
    ctx.fillStyle = '#140a28';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
    drawHud(ctx, state);
    drawBoard(ctx, state);
    if (state.phase === 'GAME_OVER') drawGameOver(ctx, state, profile.best);
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

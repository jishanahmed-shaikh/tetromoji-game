import { activePieceCells, ghostRow } from '../game/loop';
import { pieceCells, type PieceType } from '../game/pieces';
import { BOARD_W, BOARD_H, CELL, COLS, GRID_X, GRID_Y, ROWS, type GameState } from '../game/state';

type Expression = 'happy' | 'wink' | 'cool' | 'wow' | 'heart' | 'angry';

const PIECE_STYLE: Record<PieceType, { color: string; face: Expression }> = {
  I: { color: '#47e0c2', face: 'happy' },
  O: { color: '#ffd166', face: 'cool' },
  T: { color: '#b388ff', face: 'wink' },
  S: { color: '#7ee787', face: 'happy' },
  Z: { color: '#ff5a7a', face: 'angry' },
  J: { color: '#6aa6ff', face: 'wow' },
  L: { color: '#ffa552', face: 'heart' },
};

const bgImg = new Image();
let bgReady = false;
bgImg.onload = () => { bgReady = true; };
bgImg.src = 'assets/bg.jpg';

export function drawBackdrop(ctx: CanvasRenderingContext2D): void {
  if (bgReady) {
    ctx.drawImage(bgImg, 0, 0, BOARD_W, BOARD_H);
  } else {
    ctx.fillStyle = '#140a28';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function face(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, expr: Expression): void {
  const r = size * 0.09;
  ctx.fillStyle = 'rgba(20,10,30,0.82)';
  ctx.strokeStyle = 'rgba(20,10,30,0.82)';
  ctx.lineWidth = size * 0.045;
  ctx.lineCap = 'round';
  const ex = size * 0.17;
  const ey = -size * 0.08;
  if (expr === 'wink') {
    ctx.beginPath();
    ctx.arc(cx - ex, cy + ey, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + ex - r, cy + ey);
    ctx.lineTo(cx + ex + r, cy + ey);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(cx - ex, cy + ey, r, 0, Math.PI * 2);
    ctx.arc(cx + ex, cy + ey, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  const my = cy + size * 0.16;
  if (expr === 'happy' || expr === 'wink' || expr === 'cool') {
    ctx.arc(cx, my - size * 0.05, size * 0.14, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (expr === 'wow') {
    ctx.arc(cx, my, size * 0.07, 0, Math.PI * 2);
  } else if (expr === 'angry') {
    ctx.moveTo(cx - size * 0.1, my + size * 0.05);
    ctx.lineTo(cx + size * 0.1, my - size * 0.05);
  } else if (expr === 'heart') {
    ctx.arc(cx, my - size * 0.06, size * 0.1, Math.PI, 0.1 * Math.PI, true);
  }
  ctx.stroke();
}

function drawCell(ctx: CanvasRenderingContext2D, px: number, py: number, type: PieceType, alpha = 1): void {
  const style = PIECE_STYLE[type];
  const pad = 2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = style.color;
  roundRect(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, px + pad, py + pad, CELL - pad * 2, (CELL - pad * 2) * 0.4, 8);
  ctx.fill();
  face(ctx, px + CELL / 2, py + CELL / 2 + 2, CELL * 0.62, style.face);
  ctx.globalAlpha = 1;
}

function drawGhostCell(ctx: CanvasRenderingContext2D, px: number, py: number, color: string): void {
  const pad = 3;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  roundRect(ctx, px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, 7);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#1b1038';
  roundRect(ctx, GRID_X - 8, GRID_Y - 8, COLS * CELL + 16, ROWS * CELL + 16, 14);
  ctx.fill();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const type = state.board[y]![x];
      const px = GRID_X + x * CELL;
      const py = GRID_Y + y * CELL;
      if (type) {
        drawCell(ctx, px, py, type);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        roundRect(ctx, px + 2, py + 2, CELL - 4, CELL - 4, 6);
        ctx.fill();
      }
    }
  }

  const gy = ghostRow(state);
  for (const c of activePieceCells(state)) {
    const gx = state.active.col + c.x;
    const ry = gy + c.y;
    if (ry < 0) continue;
    drawGhostCell(ctx, GRID_X + gx * CELL, GRID_Y + ry * CELL, PIECE_STYLE[state.active.type].color);
  }

  for (const c of activePieceCells(state)) {
    const x = state.active.col + c.x;
    const y = state.active.row + c.y;
    if (y < 0) continue;
    drawCell(ctx, GRID_X + x * CELL, GRID_Y + y * CELL, state.active.type);
  }
}

export function drawHud(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f4f1fb';
  ctx.font = '700 30px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(`${state.score}`, GRID_X, 56);
  ctx.font = '600 16px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(244,241,251,0.7)';
  ctx.fillText(`LEVEL ${state.level}  ·  LINES ${state.lines}`, GRID_X, 84);

  const nx = GRID_X + COLS * CELL - 100;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRect(ctx, nx, 10, 100, 100, 12);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = '600 13px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(244,241,251,0.6)';
  ctx.fillText('NEXT', nx + 50, 28);
  const cells = pieceCells(state.next, 0);
  const minX = Math.min(...cells.map((c) => c.x));
  const maxX = Math.max(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  const s = 20;
  for (const c of cells) {
    drawCell(ctx, nx + 50 - ((maxX - minX + 1) * s) / 2 + (c.x - minX) * s, 38 + (c.y - minY) * s, state.next, 1);
  }
}

function pillButton(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string): void {
  ctx.font = '700 26px system-ui, -apple-system, Segoe UI, sans-serif';
  const w = ctx.measureText(text).width + 64;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ff5ab0';
  roundRect(ctx, cx - w / 2, cy - 32, w, 64, 32);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#1b0a2e';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 2);
  ctx.textBaseline = 'alphabetic';
}

export function drawTitle(ctx: CanvasRenderingContext2D): void {
  drawBackdrop(ctx);

  const cx = BOARD_W / 2;
  const logoCy = 420;
  const size = 56;
  const order: PieceType[] = ['I', 'O', 'T', 'Z'];
  order.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawCell(ctx, cx - size + col * size, logoCy - size + row * size, t);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f1fb';
  ctx.shadowColor = 'rgba(255,90,176,0.45)';
  ctx.shadowBlur = 24;
  ctx.font = '800 64px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('TETROMOJI', cx, logoCy + 130);
  ctx.shadowBlur = 0;
  ctx.font = '500 20px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(244,241,251,0.75)';
  ctx.fillText('drag to slide · tap to spin · swipe down to slam', cx, logoCy + 168);

  pillButton(ctx, cx, logoCy + 260, 'TAP TO START');
}

export function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState, best: number): void {
  ctx.fillStyle = 'rgba(10,4,20,0.78)';
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  const cx = BOARD_W / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f1fb';
  ctx.font = '800 48px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('GAME OVER', cx, BOARD_H / 2 - 120);
  ctx.font = '700 36px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(`${state.score}`, cx, BOARD_H / 2 - 60);
  ctx.font = '500 18px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillStyle = 'rgba(244,241,251,0.75)';
  ctx.fillText(state.score > best ? 'new best!' : `best: ${best}`, cx, BOARD_H / 2 - 28);
  pillButton(ctx, cx, BOARD_H / 2 + 60, 'TAP TO RETRY');
}

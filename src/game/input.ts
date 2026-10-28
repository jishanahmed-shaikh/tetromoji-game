import { CELL } from './state';

const TAP_MAX_MOVE = 10;
const TAP_MAX_MS = 300;
const HARD_DROP_MIN_DY = 90;

export class Input {
  dragCol: number | null = null;

  private active = false;
  private startX = 0;
  private startY = 0;
  private startT = 0;
  private startCol = 0;
  private tapFlag = false;
  private hardDropFlag = false;

  down(x: number, y: number, currentCol: number): void {
    this.active = true;
    this.startX = x;
    this.startY = y;
    this.startT = Date.now();
    this.startCol = currentCol;
    this.dragCol = currentCol;
  }

  move(x: number): void {
    if (!this.active) return;
    this.dragCol = this.startCol + Math.round((x - this.startX) / CELL);
  }

  up(x: number, y: number): void {
    if (!this.active) return;
    const dx = x - this.startX;
    const dy = y - this.startY;
    const dt = Date.now() - this.startT;
    if (Math.abs(dx) < TAP_MAX_MOVE && Math.abs(dy) < TAP_MAX_MOVE && dt < TAP_MAX_MS) {
      this.tapFlag = true;
    } else if (dy > HARD_DROP_MIN_DY && dy > Math.abs(dx)) {
      this.hardDropFlag = true;
    }
    this.active = false;
    this.dragCol = null;
  }

  consumeTap(): boolean {
    const t = this.tapFlag;
    this.tapFlag = false;
    return t;
  }

  consumeHardDrop(): boolean {
    const h = this.hardDropFlag;
    this.hardDropFlag = false;
    return h;
  }
}

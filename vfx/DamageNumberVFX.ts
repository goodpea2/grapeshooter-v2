import { ObjectPool } from '../class/pool';

declare const p5: any;
declare const createVector: any;
declare const random: any;
declare const pow: any;
declare const lerp: any;
declare const map: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const textAlign: any;
declare const textSize: any;
declare const noStroke: any;
declare const fill: any;
declare const text: any;
declare const CENTER: any;

export class DamageNumberVFX {
  pos: any;
  damage: number = 0;
  life: number = 45;
  maxLife: number = 45;
  r: number = 255;
  g: number = 255;
  b: number = 255;
  startY: number = 0;
  xOffset: number = 0;

  constructor(x: number = 0, y: number = 0, damage: number = 0, col: any = [255, 255, 255]) {
    this.pos = createVector(x, y);
    this.reset(x, y, damage, col);
  }

  reset(x: number, y: number, damage: number, col: any = [255, 255, 255]) {
    this.xOffset = (Math.random() - 0.5) * 20;
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.startY = y;
    this.damage = damage;
    this.life = 45;
    this.maxLife = 45;

    if (Array.isArray(col)) {
      this.r = col[0] ?? 255;
      this.g = col[1] ?? 255;
      this.b = col[2] ?? 255;
    } else if (col && Array.isArray(col.levels)) {
      this.r = col.levels[0];
      this.g = col.levels[1];
      this.b = col.levels[2];
    } else {
      this.r = 255;
      this.g = 255;
      this.b = 255;
    }
  }

  update() {
    this.life--;
    const t = 1 - (this.life / this.maxLife);
    const eased = 1 - Math.pow(1 - t, 4);
    this.pos.y = this.startY - 30 * eased;
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const alphaNorm = Math.max(0, Math.min(1, this.life / this.maxLife));
    const currentSize = Math.round(10 + (this.life / this.maxLife) * 4);
    const textVal = `${Math.round(Math.abs(this.damage))}`;
    const drawX = this.pos.x + this.xOffset;
    const drawY = this.pos.y;

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      ctx.font = `bold ${currentSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${alphaNorm})`;
      ctx.fillText(textVal, drawX, drawY);
      return;
    }

    push();
    translate(drawX, drawY);
    textAlign(CENTER, CENTER);
    textSize(currentSize);
    noStroke();
    fill(this.r, this.g, this.b, alphaNorm * 255);
    text(textVal, 0, 0);
    pop();
  }
}

export const damageNumberPool = new ObjectPool<DamageNumberVFX>(
  'DamageNumber',
  () => new DamageNumberVFX(),
  undefined,
  500
);

export function spawnDamageNumber(x: number, y: number, damage: number, col: any = [255, 255, 255]): DamageNumberVFX {
  const vfx = damageNumberPool.get();
  vfx.reset(x, y, damage, col);
  return vfx;
}

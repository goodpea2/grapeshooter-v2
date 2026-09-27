import { ObjectPool } from '../class/pool';
import { state } from '../state';

declare const p5: any;
declare const createVector: any;
declare const color: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;

export class NeighborBuffParticleVFX {
  fromX: number = 0;
  fromY: number = 0;
  toX: number = 0;
  toY: number = 0;
  life: number = 14;
  maxLife: number = 14;
  r: number = 255;
  g: number = 220;
  b: number = 100;
  curveOffset: number = 0;

  constructor(fromX: number = 0, fromY: number = 0, toX: number = 0, toY: number = 0, col: any = [255, 220, 100]) {
    this.reset(fromX, fromY, toX, toY, col);
  }

  reset(fromX: number, fromY: number, toX: number, toY: number, col: any = [255, 220, 100]) {
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.life = 14;
    this.maxLife = 14;
    this.curveOffset = (Math.random() - 0.5) * 12;

    if (Array.isArray(col)) {
      this.r = col[0] ?? 255;
      this.g = col[1] ?? 220;
      this.b = col[2] ?? 100;
    } else {
      this.r = 255;
      this.g = 220;
      this.b = 100;
    }
  }

  update() {
    this.life--;
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const t = 1 - (this.life / this.maxLife);
    const alphaNorm = Math.sin(t * Math.PI); // Smooth fade-in and fade-out
    
    // Ease t
    const curX = this.fromX + (this.toX - this.fromX) * t;
    const curY = this.fromY + (this.toY - this.fromY) * t + Math.sin(t * Math.PI) * this.curveOffset;

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${alphaNorm * 0.9})`;
      ctx.fill();

      // Outer glow
      ctx.beginPath();
      ctx.arc(curX, curY, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${alphaNorm * 0.3})`;
      ctx.fill();
      ctx.restore();
      return;
    }

    push();
    noStroke();
    fill(this.r, this.g, this.b, alphaNorm * 255);
    ellipse(curX, curY, 6, 6);
    pop();
  }
}

export const neighborBuffParticlePool = new ObjectPool<NeighborBuffParticleVFX>(
  'NeighborBuffParticle',
  () => new NeighborBuffParticleVFX(),
  undefined,
  200
);

export function spawnNeighborBuffParticle(fromX: number, fromY: number, toX: number, toY: number, col: any = [255, 230, 110]): NeighborBuffParticleVFX {
  const vfx = neighborBuffParticlePool.get();
  vfx.reset(fromX, fromY, toX, toY, col);
  return vfx;
}

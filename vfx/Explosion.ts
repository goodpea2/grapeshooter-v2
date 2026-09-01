import { ObjectPool } from '../class/pool';

declare const p5: any;
declare const createVector: any;
declare const pow: any;
declare const map: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noFill: any;
declare const strokeWeight: any;
declare const stroke: any;
declare const ellipse: any;
declare const noStroke: any;
declare const fill: any;
declare const max: any;

export class Explosion {
  pos: any;
  size: number = 20;
  duration: number = 18;
  life: number = 18;
  r1: number = 255;
  g1: number = 200;
  b1: number = 50;

  constructor(x: number = 0, y: number = 0, baseSize: number = 20, colorA?: any, colorB?: any) {
    this.pos = createVector(x, y);
    this.reset(x, y, baseSize, colorA, colorB);
  }

  reset(x: number, y: number, baseSize: number = 20, colorA?: any, _colorB?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.size = baseSize;
    this.duration = 18;
    this.life = this.duration;

    if (Array.isArray(colorA)) {
      this.r1 = colorA[0] ?? 255;
      this.g1 = colorA[1] ?? 200;
      this.b1 = colorA[2] ?? 50;
    } else if (colorA && Array.isArray(colorA.levels)) {
      this.r1 = colorA.levels[0];
      this.g1 = colorA.levels[1];
      this.b1 = colorA.levels[2];
    } else {
      this.r1 = 255;
      this.g1 = 200;
      this.b1 = 50;
    }
  }

  update() {
    this.life--;
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    if (!this.pos || isNaN(this.pos.x)) return;
    const progress = 1 - (this.life / this.duration);
    const currentSize = this.size * Math.pow(progress, 0.1);
    const alphaNorm = Math.max(0, Math.min(1, this.life / this.duration));
    const strokeW = Math.max(1, 6 * (1 - progress));

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      const radius = currentSize * 0.5;

      // Inner faint fill
      ctx.fillStyle = `rgba(${this.r1}, ${this.g1}, ${this.b1}, ${alphaNorm * 0.2})`;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Outer shockwave ring
      ctx.strokeStyle = `rgba(${this.r1}, ${this.g1}, ${this.b1}, ${alphaNorm * 0.7})`;
      ctx.lineWidth = strokeW;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }

    push();
    translate(this.pos.x, this.pos.y);
    noFill();
    strokeWeight(max(1, 6 * (1 - progress)));
    stroke(this.r1, this.g1, this.b1, alphaNorm * 180);
    ellipse(0, 0, currentSize);

    noStroke();
    fill(this.r1, this.g1, this.b1, alphaNorm * 36);
    ellipse(0, 0, currentSize);
    pop();
  }
}

export const explosionPool = new ObjectPool<Explosion>(
  'Explosion',
  () => new Explosion(),
  undefined,
  500
);

export function spawnExplosion(x: number, y: number, baseSize: number = 20, colorA?: any, colorB?: any): Explosion {
  const exp = explosionPool.get();
  exp.reset(x, y, baseSize, colorA, colorB);
  return exp;
}

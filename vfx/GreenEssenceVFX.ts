import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const createVector: any;
declare const lerp: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const sin: any;

export class GreenEssenceVFX {
  pos: any;
  startPos: any;
  targetPos: any;
  targetTurret?: any;
  progress: number = 0;
  speed: number = 0.04;
  isDead: boolean = false;
  arcHeight: number = -60;
  onArrival?: () => void;
  trail: Array<{ x: number; y: number; alpha: number }> = [];

  constructor(startX: number = 0, startY: number = 0, targetX: number = 0, targetY: number = 0, onArrival?: () => void) {
    this.pos = createVector(startX, startY);
    this.startPos = createVector(startX, startY);
    this.targetPos = createVector(targetX, targetY);
    this.reset(startX, startY, targetX, targetY, onArrival);
  }

  reset(startX: number = 0, startY: number = 0, targetX: number = 0, targetY: number = 0, onArrival?: () => void, targetTurret?: any) {
    if (this.pos) this.pos.set(startX, startY); else this.pos = createVector(startX, startY);
    if (this.startPos) this.startPos.set(startX, startY); else this.startPos = createVector(startX, startY);
    if (this.targetPos) this.targetPos.set(targetX, targetY); else this.targetPos = createVector(targetX, targetY);
    this.targetTurret = targetTurret;
    this.progress = 0;
    this.speed = 0.02;
    this.isDead = false;
    this.arcHeight = (Math.random() - 0.5) * 20 - 35;
    this.onArrival = onArrival;
    this.trail = [];
  }

  update() {
    this.progress += this.speed;
    this.speed += 0.002;

    if (this.targetTurret) {
      const curTarget = this.targetTurret.getWorldPos ? this.targetTurret.getWorldPos() : this.targetTurret.pos;
      if (curTarget) {
        this.targetPos.set(curTarget.x, curTarget.y);
      }
    }

    const t = Math.min(1, this.progress);
    const linearX = lerp(this.startPos.x, this.targetPos.x, t);
    const linearY = lerp(this.startPos.y, this.targetPos.y, t);
    const arcOffset = sin(t * Math.PI) * this.arcHeight;

    this.pos.set(linearX, linearY + arcOffset);

    // Record trail
    this.trail.unshift({ x: this.pos.x, y: this.pos.y, alpha: 255 });
    if (this.trail.length > 8) this.trail.pop();

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha *= 0.75;
    }

    if (this.progress >= 1 && !this.isDead) {
      this.isDead = true;
      const cb = this.onArrival;
      this.onArrival = undefined;
      if (cb) {
        cb();
      }
    }
  }

  isDone() {
    return this.isDead;
  }

  display() {
    push();
    noStroke();

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const sz = Math.max(2, 8 * (1 - i / this.trail.length));
      fill(80, 255, 120, p.alpha * 0.6);
      ellipse(p.x, p.y, sz);
    }

    // Glow Outer
    fill(60, 240, 100, 100);
    ellipse(this.pos.x, this.pos.y, 14, 14);

    // Bright Core
    fill(180, 255, 200, 230);
    ellipse(this.pos.x, this.pos.y, 8, 8);

    fill(255, 255, 255, 255);
    ellipse(this.pos.x, this.pos.y, 4, 4);

    pop();
  }
}

export const greenEssencePool = new ObjectPool<GreenEssenceVFX>(
  'GreenEssence',
  () => new GreenEssenceVFX(),
  undefined,
  200
);

export function spawnGreenEssenceVFX(startX: number, startY: number, targetX: number, targetY: number, onArrival?: () => void, targetTurret?: any): GreenEssenceVFX {
  const vfx = greenEssencePool.get();
  vfx.reset(startX, startY, targetX, targetY, onArrival, targetTurret);
  state.vfx.push(vfx);
  return vfx;
}

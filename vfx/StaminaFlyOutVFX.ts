import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const createVector: any;
declare const random: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const map: any;

export class StaminaFlyOutVFX {
  pos: any;
  vx: number = 0;
  vy: number = 0;
  life: number = 18;
  maxLife: number = 18;
  size: number = 4;

  constructor(x: number = 0, y: number = 0) {
    this.pos = createVector(x, y);
    this.reset(x, y);
  }

  reset(x: number = 0, y: number = 0) {
    if (this.pos) this.pos.set(x, y); else this.pos = createVector(x, y);
    this.vx = random(-1.2, 1.2);
    this.vy = random(-3.2, -1.8);
    this.life = random(14, 20);
    this.maxLife = this.life;
    this.size = random(3.5, 5.5);
  }

  update() {
    this.life--;
    this.pos.x += this.vx;
    this.pos.y += this.vy;
    this.vx *= 0.94;
    this.vy *= 0.96;
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const t = 1 - (this.life / this.maxLife);
    const alpha = map(this.life, 0, 6, 0, 230);
    const curSize = this.size * (1 - t * 0.4);

    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    
    fill(0, 210, 255, alpha * 0.4);
    ellipse(0, 0, curSize * 2.2, curSize * 2.2);

    fill(170, 245, 255, alpha);
    ellipse(0, 0, curSize, curSize);
    pop();
  }
}

export const staminaFlyOutPool = new ObjectPool<StaminaFlyOutVFX>(
  'StaminaFlyOut',
  () => new StaminaFlyOutVFX(),
  undefined,
  120
);

let lastFlyOutFrame = -1;
let flyOutCountThisFrame = 0;

export function spawnStaminaFlyOutVFX(x: number, y: number): StaminaFlyOutVFX | null {
  if (state.frames !== lastFlyOutFrame) {
    lastFlyOutFrame = state.frames;
    flyOutCountThisFrame = 0;
  }
  if (flyOutCountThisFrame >= 3) return null;
  flyOutCountThisFrame++;

  const vfx = staminaFlyOutPool.get();
  vfx.reset(x, y);
  state.vfx.push(vfx);
  return vfx;
}

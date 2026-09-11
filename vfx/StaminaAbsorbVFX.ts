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
declare const lerp: any;
declare const pow: any;

export class StaminaAbsorbVFX {
  pos: any;
  startPos: any;
  targetPos: any;
  life: number = 22;
  maxLife: number = 22;
  size: number = 4;

  constructor(targetX: number = 0, targetY: number = 0) {
    this.pos = createVector(targetX, targetY);
    this.startPos = createVector(targetX, targetY);
    this.targetPos = createVector(targetX, targetY);
    this.reset(targetX, targetY);
  }

  reset(targetX: number = 0, targetY: number = 0) {
    const angle = random(-Math.PI * 0.8, -Math.PI * 0.2);
    const distance = random(35, 50);
    const startX = targetX + Math.cos(angle) * distance;
    const startY = targetY + Math.sin(angle) * distance;

    if (this.pos) this.pos.set(startX, startY); else this.pos = createVector(startX, startY);
    if (this.startPos) this.startPos.set(startX, startY); else this.startPos = createVector(startX, startY);
    if (this.targetPos) this.targetPos.set(targetX, targetY); else this.targetPos = createVector(targetX, targetY);

    this.life = random(18, 24);
    this.maxLife = this.life;
    this.size = random(3.5, 5);
  }

  update() {
    this.life--;
    const t = 1 - (this.life / this.maxLife);
    const easedT = pow(t, 2.2);

    this.pos.x = lerp(this.startPos.x, this.targetPos.x, easedT);
    this.pos.y = lerp(this.startPos.y, this.targetPos.y, easedT);
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const t = 1 - (this.life / this.maxLife);
    const alpha = map(this.life, 0, 6, 0, 240);
    const curSize = this.size * (0.8 + t * 0.4);

    push();
    translate(this.pos.x, this.pos.y);
    noStroke();

    fill(0, 230, 255, alpha * 0.45);
    ellipse(0, 0, curSize * 2.2, curSize * 2.2);

    fill(200, 250, 255, alpha);
    ellipse(0, 0, curSize, curSize);
    pop();
  }
}

export const staminaAbsorbPool = new ObjectPool<StaminaAbsorbVFX>(
  'StaminaAbsorb',
  () => new StaminaAbsorbVFX(),
  undefined,
  120
);

let lastAbsorbFrame = -1;
let absorbCountThisFrame = 0;

export function spawnStaminaAbsorbVFX(targetX: number, targetY: number): StaminaAbsorbVFX | null {
  if (state.frames !== lastAbsorbFrame) {
    lastAbsorbFrame = state.frames;
    absorbCountThisFrame = 0;
  }
  if (absorbCountThisFrame >= 3) return null;
  absorbCountThisFrame++;

  const vfx = staminaAbsorbPool.get();
  vfx.reset(targetX, targetY);
  state.vfx.push(vfx);
  return vfx;
}

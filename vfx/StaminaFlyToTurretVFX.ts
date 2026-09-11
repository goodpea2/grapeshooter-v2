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
declare const lerp: any;
declare const map: any;
declare const pow: any;

export class StaminaFlyToTurretVFX {
  pos: any;
  startPos: any;
  targetTurret: any;
  targetPosBackup: any;
  life: number = 20;
  maxLife: number = 20;
  arcOffset: number = 0;

  constructor(sx: number = 0, sy: number = 0, targetTurret: any = null) {
    this.pos = createVector(sx, sy);
    this.startPos = createVector(sx, sy);
    this.targetPosBackup = createVector(sx, sy);
    this.targetTurret = targetTurret;
    this.reset(sx, sy, targetTurret);
  }

  reset(sx: number = 0, sy: number = 0, targetTurret: any = null) {
    if (this.pos) this.pos.set(sx, sy); else this.pos = createVector(sx, sy);
    if (this.startPos) this.startPos.set(sx, sy); else this.startPos = createVector(sx, sy);
    this.targetTurret = targetTurret;
    const tx = targetTurret?.getWorldPos ? targetTurret.getWorldPos().x : (targetTurret?.pos?.x || sx);
    const ty = targetTurret?.getWorldPos ? targetTurret.getWorldPos().y : (targetTurret?.pos?.y || sy);
    if (this.targetPosBackup) this.targetPosBackup.set(tx, ty); else this.targetPosBackup = createVector(tx, ty);
    this.life = 20;
    this.maxLife = 20;
    this.arcOffset = (random() > 0.5 ? 1 : -1) * random(10, 25);
  }

  update() {
    this.life--;
    const t = 1 - (this.life / this.maxLife);
    const easedT = pow(t, 1.5);
    
    let tx = this.targetPosBackup.x;
    let ty = this.targetPosBackup.y;
    if (this.targetTurret && this.targetTurret.health > 0) {
      const wPos = this.targetTurret.getWorldPos ? this.targetTurret.getWorldPos() : this.targetTurret.pos;
      if (wPos) {
        tx = wPos.x;
        ty = wPos.y;
        this.targetPosBackup.set(tx, ty);
      }
    }

    const linearX = lerp(this.startPos.x, tx, easedT);
    const linearY = lerp(this.startPos.y, ty, easedT);
    const arcT = Math.sin(t * Math.PI);
    
    const dx = tx - this.startPos.x;
    const dy = ty - this.startPos.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    this.pos.x = linearX + nx * this.arcOffset * arcT;
    this.pos.y = linearY + ny * this.arcOffset * arcT;
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const t = 1 - (this.life / this.maxLife);
    const alpha = map(this.life, 0, 8, 0, 220);
    const coreSize = map(Math.sin(t * Math.PI), 0, 1, 3, 5.5);

    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    
    fill(0, 220, 255, alpha * 0.45);
    ellipse(0, 0, coreSize * 2.4, coreSize * 2.4);

    fill(180, 245, 255, alpha);
    ellipse(0, 0, coreSize, coreSize);
    pop();
  }
}

export const staminaFlyToTurretPool = new ObjectPool<StaminaFlyToTurretVFX>(
  'StaminaFlyToTurret',
  () => new StaminaFlyToTurretVFX(),
  undefined,
  150
);

let lastStaminaFlyFrame = -1;
let staminaFlyCountThisFrame = 0;

export function spawnStaminaFlyToTurretVFX(sx: number, sy: number, targetTurret: any): StaminaFlyToTurretVFX | null {
  if (state.frames !== lastStaminaFlyFrame) {
    lastStaminaFlyFrame = state.frames;
    staminaFlyCountThisFrame = 0;
  }
  if (staminaFlyCountThisFrame >= 4) return null;
  staminaFlyCountThisFrame++;

  const vfx = staminaFlyToTurretPool.get();
  vfx.reset(sx, sy, targetTurret);
  state.vfx.push(vfx);
  return vfx;
}

import { ObjectPool } from '../class/pool';

declare const p5: any;
declare const createVector: any;
declare const random: any;
declare const pow: any;
declare const lerp: any;
declare const map: any;
declare const push: any;
declare const pop: any;
declare const scale: any;
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
  customText: string | null = null;
  delay: number = 0;
  life: number = 45;
  maxLife: number = 45;
  r: number = 255;
  g: number = 255;
  b: number = 255;
  startY: number = 0;
  xOffset: number = 0;

  // Stacking & pulse tracking
  target: any = null;
  framesSinceLastCall: number = 0;
  pulseScale: number = 0; // 0.10 means +10% scale
  targetOffset: any = null;

  constructor(x: number = 0, y: number = 0, damage: number = 0, col: any = [255, 255, 255], customText: string | null = null, delay: number = 0, target: any = null) {
    this.pos = createVector(x, y);
    this.reset(x, y, damage, col, customText, delay, target);
  }

  reset(x: number, y: number, damage: number, col: any = [255, 255, 255], customText: string | null = null, delay: number = 0, target: any = null) {
    this.target = target;
    this.framesSinceLastCall = 0;
    this.pulseScale = 0.10; // Initial 10% scale pulse
    this.xOffset = customText ? 0 : (Math.random() - 0.5) * 8;
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.startY = y;

    if (this.target) {
      const tPos = this.target.getWorldPos ? this.target.getWorldPos() : (this.target.pos ? this.target.pos.copy() : null);
      if (tPos) {
        this.targetOffset = createVector(x - tPos.x, y - tPos.y);
      } else {
        this.targetOffset = null;
      }
    } else {
      this.targetOffset = null;
    }

    this.damage = damage;
    this.customText = customText;
    this.delay = delay;
    this.life = customText ? 60 : 45;
    this.maxLife = this.life;

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

  triggerPulse() {
    this.pulseScale = 0.10; // 10% scale pulse on update
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.framesSinceLastCall++;
    if (this.pulseScale > 0) {
      this.pulseScale = Math.max(0, this.pulseScale - 0.018);
    }
    this.life--;

    if (this.target) {
      const isTargetDead = (this.target.health !== undefined && this.target.health <= 0) || this.target.isDying;
      if (!isTargetDead) {
        const currentTargetPos = this.target.getWorldPos ? this.target.getWorldPos() : (this.target.pos ? this.target.pos.copy() : null);
        if (currentTargetPos) {
          if (this.targetOffset) {
            this.pos.x = currentTargetPos.x + this.targetOffset.x;
            this.pos.y = currentTargetPos.y + this.targetOffset.y;
          } else {
            this.pos.x = currentTargetPos.x;
            this.pos.y = currentTargetPos.y;
          }
          this.startY = this.pos.y;
        }
      }
    }

    if (this.customText) {
      // Custom text (e.g. Stat Popups) floats upward
      const t = 1 - (this.life / this.maxLife);
      const eased = 1 - Math.pow(1 - t, 4);
      this.pos.y = this.startY - 38 * eased;
    } else {
      // Damage numbers follow target position
      this.pos.y = this.startY;
    }
  }

  isDone() {
    return this.life <= 0 && this.delay <= 0;
  }

  display() {
    if (this.delay > 0) return;
    const alphaNorm = Math.max(0, Math.min(1, this.life / this.maxLife));
    const isText = !!this.customText;
    const currentSize = isText ? 12 : Math.round(10 + (this.life / this.maxLife) * 4);
    const textVal = isText ? this.customText! : `${Math.round(Math.abs(this.damage))}`;
    const drawX = this.pos.x + this.xOffset;
    const drawY = this.pos.y;
    const scaleMult = 1.0 + this.pulseScale;

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      ctx.save();
      ctx.translate(drawX, drawY);
      if (scaleMult !== 1.0) {
        ctx.scale(scaleMult, scaleMult);
      }
      ctx.font = `bold ${currentSize}px`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${alphaNorm})`;
      ctx.fillText(textVal, 0, 0);
      ctx.restore();
      return;
    }

    push();
    translate(drawX, drawY);
    if (scaleMult !== 1.0) {
      scale(scaleMult, scaleMult);
    }
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

// Active damage numbers tracked for target stacking
const activeDamageNumbers: DamageNumberVFX[] = [];

/**
 * Spawns or stacks a DamageNumberVFX.
 * If called on the same target within 15 frames, stacks the damage value,
 * refreshes duration, triggers a 10% scale pulse, and returns null (indicating it merged into an existing VFX).
 */
export function spawnDamageNumber(
  x: number,
  y: number,
  damage: number,
  col: any = [255, 255, 255],
  target: any = null
): DamageNumberVFX | null {
  // Prune finished VFX
  for (let i = activeDamageNumbers.length - 1; i >= 0; i--) {
    if (activeDamageNumbers[i].isDone()) {
      activeDamageNumbers.splice(i, 1);
    }
  }

  // Look for existing active damage number on the same target within 15 frames
  const existing = activeDamageNumbers.find((v) => {
    if (v.isDone() || v.customText) return false;
    if (v.framesSinceLastCall > 15) return false;
    if (target != null && v.target != null) {
      return v.target === target;
    }
    // Spatial proximity fallback if no target reference was provided
    const dx = v.pos.x - x;
    const dy = v.pos.y - y;
    return dx * dx + dy * dy < 625; // 25px radius
  });

  if (existing) {
    existing.damage += damage;
    existing.framesSinceLastCall = 0;
    existing.life = existing.maxLife;
    existing.triggerPulse();
    return null; // Stacked into existing active VFX
  }

  const spawnY = y - 22;
  const vfx = damageNumberPool.get();
  vfx.reset(x, spawnY, damage, col, null, 0, target);
  activeDamageNumbers.push(vfx);
  return vfx;
}

export function spawnStatChangePopup(x: number, y: number, label: string, isUp: boolean, delay: number = 0): DamageNumberVFX {
  const vfx = damageNumberPool.get();
  const col = isUp ? [100, 255, 120] : [255, 110, 90];
  const suffix = isUp ? 'Up!' : 'Down!';
  const fullText = `${label} ${suffix}`;
  vfx.reset(x, y, 0, col, fullText, delay, null);
  return vfx;
}

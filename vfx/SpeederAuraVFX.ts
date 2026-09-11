import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const random: any;
declare const TWO_PI: any;
declare const sin: any;
declare const cos: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const fill: any;
declare const noFill: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const width: any;
declare const height: any;

export class SpeederAuraVFX {
  target: any;
  radius: number = 64;
  sparks: {
    angle: number;
    distRatio: number;
    speed: number;
    size: number;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(target: any = null, radius: number = 64) {
    for (let i = 0; i < 8; i++) {
      this.sparks.push({
        angle: 0,
        distRatio: 0.5,
        speed: 0.05,
        size: 3,
        life: 60,
        maxLife: 60
      });
    }
    this.reset(target, radius);
  }

  reset(target: any = null, radius: number = 64) {
    this.target = target;
    this.radius = radius;
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      if (s) {
        s.angle = random(TWO_PI);
        s.distRatio = random(0.25, 0.95);
        s.speed = random(0.04, 0.09) * (random() > 0.1 ? 1 : -1);
        s.size = random(2.5, 4.5);
        s.life = random(30, 80);
        s.maxLife = s.life;
      }
    }
  }

  update() {
    for (let s of this.sparks) {
      s.angle += s.speed;
      s.life--;
      if (s.life <= 0) {
        s.angle = random(TWO_PI);
        s.distRatio = random(0.25, 0.95);
        s.speed = random(0.04, 0.09);
        s.size = random(2.5, 4.5);
        s.life = random(40, 80);
        s.maxLife = s.life;
      }
    }
  }

  isDone() {
    return !this.target || this.target.health <= 0 || (this.target.isMined === true);
  }

  display() {
    if (!this.target) return;
    const p = this.target.getWorldPos ? this.target.getWorldPos() : this.target.pos;
    if (!p || p.x === undefined || p.y === undefined) return;
    const activity = this.target.specialActivityLevel || 0;
    if (activity <= 0.01) return;

    // Viewport Culling
    const camX = state.cameraPos ? state.cameraPos.x : (state.player ? state.player.pos.x : 0);
    const camY = state.cameraPos ? state.cameraPos.y : (state.player ? state.player.pos.y : 0);
    const zoom = state.levelEditor?.cameraZoom || 1.0;
    const w = typeof width !== 'undefined' ? width : 1000;
    const h = typeof height !== 'undefined' ? height : 800;
    const margin = this.radius + 60;

    if (
      p.x + margin < camX - w / (2 * zoom) ||
      p.x - margin > camX + w / (2 * zoom) ||
      p.y + margin < camY - h / (2 * zoom) ||
      p.y - margin > camY + h / (2 * zoom)
    ) {
      return;
    }

    push();
    translate(p.x, p.y);
    const pulse = 1.0 + 0.03 * sin(state.frames * 0.1);
    const currentRadius = this.radius * activity;

    // Outer faint haste glow
    noStroke();
    fill(255, 210, 50, 16);
    ellipse(0, 0, currentRadius * 2 * pulse);

    // Orbiting speed spark motes
    noStroke();
    for (let s of this.sparks) {
      const r = currentRadius * s.distRatio;
      const sx = cos(s.angle) * r;
      const sy = sin(s.angle) * r;
      const prog = s.life / s.maxLife;

      if (prog > 0.4) {
        fill(255, 250, 160, 220 * activity * prog);
      } else {
        fill(255, 200, 40, 180 * activity * prog);
      }
      ellipse(sx, sy, s.size * prog);
    }
    pop();
  }
}

export const speederAuraPool = new ObjectPool<SpeederAuraVFX>(
  'SpeederAura',
  () => new SpeederAuraVFX(),
  undefined,
  100
);

export function spawnSpeederAuraVFX(target: any, radius: number): SpeederAuraVFX {
  const vfx = speederAuraPool.get();
  vfx.reset(target, radius);
  return vfx;
}

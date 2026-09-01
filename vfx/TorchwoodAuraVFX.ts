import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const random: any;
declare const TWO_PI: any;
declare const sin: any;
declare const cos: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const width: any;
declare const height: any;

export class TorchwoodAuraVFX {
  target: any; 
  radius: number = 60;
  embers: { x: number; y: number; s: number; vy: number; vx: number; phase: number; life: number; maxLife: number }[] = [];

  constructor(target: any = null, radius: number = 60) {
    for (let i = 0; i < 18; i++) {
      this.embers.push({
        x: 0,
        y: 0,
        s: 3,
        vy: -0.4,
        vx: 0,
        phase: 0,
        life: 60,
        maxLife: 90
      });
    }
    this.reset(target, radius);
  }

  reset(target: any = null, radius: number = 60) {
    this.target = target;
    this.radius = radius;
    for (let i = 0; i < 18; i++) {
      const e = this.embers[i];
      if (e) {
        e.x = random(-radius * 0.8, radius * 0.8);
        e.y = random(-radius * 0.8, radius * 0.8);
        e.s = random(2.5, 4.5);
        e.vy = random(-0.6, -0.2);
        e.vx = random(-0.2, 0.2);
        e.phase = random(TWO_PI);
        e.life = random(30, 90);
        e.maxLife = 90;
      }
    }
  }

  update() {
    for (let e of this.embers) {
      e.y += e.vy;
      e.x += e.vx + sin(state.frames * 0.08 + e.phase) * 0.3;
      e.life--;
      if (e.life <= 0 || (e.x * e.x + e.y * e.y > this.radius * this.radius)) {
        const ang = random(TWO_PI);
        const r = random(0, this.radius * 0.7);
        e.x = Math.cos(ang) * r;
        e.y = Math.sin(ang) * r;
        e.life = random(40, 90);
        e.maxLife = e.life;
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

    // Viewport Culling Optimization for large number of auras
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
    const pulse = 1.0 + 0.04 * sin(state.frames * 0.04);
    const currentRadius = this.radius * activity;

    // Glowing warm aura floor
    noStroke();
    fill(255, 120, 20, 35 * activity);
    ellipse(0, 0, currentRadius * 2 * pulse);

    fill(255, 180, 50, 20 * activity);
    ellipse(0, 0, currentRadius * 1.5 * pulse);

    // Fiery ember particles
    for (let e of this.embers) {
      const dSq = e.x * e.x + e.y * e.y;
      if (dSq < currentRadius * currentRadius) {
        const prog = e.life / e.maxLife;
        if (prog > 0.5) {
          fill(255, 220, 100, 220 * activity * prog);
        } else {
          fill(255, 80, 20, 200 * activity * prog);
        }
        ellipse(e.x, e.y, e.s * prog);
      }
    }
    pop();
  }
}

export const torchwoodAuraPool = new ObjectPool<TorchwoodAuraVFX>(
  'TorchwoodAura',
  () => new TorchwoodAuraVFX(),
  undefined,
  100
);

export function spawnTorchwoodAuraVFX(target: any, radius: number): TorchwoodAuraVFX {
  const vfx = torchwoodAuraPool.get();
  vfx.reset(target, radius);
  return vfx;
}

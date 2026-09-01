import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const p5: any;
declare const createVector: any;
declare const color: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const map: any;
declare const lerp: any;
declare const lerpColor: any;
declare const random: any;
declare const TWO_PI: any;
declare const cos: any;
declare const sin: any;
declare const pow: any;
declare const noStroke: any;
declare const noFill: any;
declare const fill: any;
declare const beginShape: any;
declare const endShape: any;
declare const vertex: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const scale: any;
declare const CLOSE: any;
declare const width: any;
declare const height: any;
declare const rect: any;
declare const distSq: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const triangle: any;
declare const frameCount: any;
declare const max: any;
declare const floor: any;
declare const HALF_PI: any;
declare const line: any;
declare const arc: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;

export class FrostFieldAuraVFX {
  target: any; radius: number = 60;
  flakes: {x: number, y: number, s: number, v: number, phase: number}[] = [];

  constructor(target: any = null, radius: number = 60) {
    for(let i=0; i<16; i++) {
      this.flakes.push({
        x: 0,
        y: 0,
        s: 2,
        v: 0.2,
        phase: 0
      });
    }
    this.reset(target, radius);
  }

  reset(target: any = null, radius: number = 60) {
    this.target = target;
    this.radius = radius;
    for(let i=0; i<16; i++) {
      const f = this.flakes[i];
      if (f) {
        f.x = random(-radius, radius);
        f.y = random(-radius, radius);
        f.s = random(2, 4);
        f.v = random(0.15, 0.5);
        f.phase = random(TWO_PI);
      }
    }
  }

  update() {
    for(let f of this.flakes) {
      f.y += f.v;
      f.x += sin(state.frames * 0.05 + f.phase) * 0.5;
      if (f.y > this.radius) f.y = -this.radius;
      if (f.x > this.radius) f.x = -this.radius;
      if (f.x < -this.radius) f.x = this.radius;
    }
  }

  isDone() { return !this.target || this.target.health <= 0 || (this.target.isMined === true); }

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

    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.05 * sin(state.frames * 0.02);
    const currentRadius = this.radius * activity;
    
    // Subtle glow floor
    noStroke();
    fill(150, 220, 255, 30 * activity);
    ellipse(0, 0, currentRadius * 2 * pulse);
    
    // Snowflake particles
    fill(255, 200 * activity);
    for(let f of this.flakes) {
      // Circle masking for the flakes
      const dSq = f.x*f.x + f.y*f.y;
      if (dSq < currentRadius * currentRadius) {
        ellipse(f.x, f.y, f.s);
      }
    }
    pop();
  }
}

export const frostFieldAuraPool = new ObjectPool<FrostFieldAuraVFX>(
  'FrostFieldAura',
  () => new FrostFieldAuraVFX(),
  undefined,
  100
);

export function spawnFrostFieldAuraVFX(target: any, radius: number): FrostFieldAuraVFX {
  const vfx = frostFieldAuraPool.get();
  vfx.reset(target, radius);
  return vfx;
}

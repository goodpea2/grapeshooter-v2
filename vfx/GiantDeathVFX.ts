import { state } from '../state';
import { spawnBugSplatVFX } from './BugSplatVFX';
import { spawnExplosion } from './Explosion';
import { drawPersistentDeathVisual } from './Utils';
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

export class GiantDeathVFX {
  pos: any; life: number = 90; duration: number = 90; color: any; size: number = 40;
  constructor(x: number = 0, y: number = 0, size: number = 40, col: any = color(255, 100, 100)) {
    this.pos = createVector(x, y);
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 40, col?: any) {
    if (this.pos) this.pos.set(x, y); else this.pos = createVector(x, y);
    this.color = col || color(255, 100, 100);
    this.size = size;
    this.life = 90;
    this.duration = 90;
  }

  update() {
    this.life--;
    if (this.life > 20 && state.frames % 3 === 0) {
      this.pos.add(random(-4, 4), random(-4, 4));
      state.vfx.push(spawnBugSplatVFX(this.pos.x + random(-30, 30), this.pos.y + random(-30, 30), 20, this.color));
    }
    if (this.life === 20) {
      state.vfx.push(spawnExplosion(this.pos.x, this.pos.y, this.size * 2.5, color(this.color)));
      drawPersistentDeathVisual(this.pos.x, this.pos.y, this.size * 1.5, [red(this.color), green(this.color), blue(this.color)]);
    }
  }

  isDone() { return this.life <= 0; }

  display() {
    let alpha = map(this.life, 20, this.duration, 255, 0);
    if (this.life <= 20) return;
    push(); translate(this.pos.x, this.pos.y);
    rotate(random(-0.1, 0.1));
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    ellipse(0, 0, this.size * (1 + sin(this.life * 0.5) * 0.1));
    pop();
  }
}

export const giantDeathPool = new ObjectPool<GiantDeathVFX>(
  'GiantDeath',
  () => new GiantDeathVFX(),
  undefined,
  100
);

export function spawnGiantDeathVFX(x: number, y: number, size: number, col: any): GiantDeathVFX {
  const vfx = giantDeathPool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

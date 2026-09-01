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

export class WeldingHitVFX {
  pos: any; life: number = 6; maxLife: number = 30;
  col: any = [255, 255, 100];
  wisps: any[] = [];
  sparks: any[] = [];

  constructor(x: number = 0, y: number = 0, col: any = [255, 255, 100]) {
    this.pos = createVector(x, y);
    this.reset(x, y, col);
  }

  reset(x: number = 0, y: number = 0, col: any = [255, 255, 100]) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.col = col;
    this.life = 6;
    this.maxLife = 30;
    this.wisps.length = 0;
    this.sparks.length = 0;
    this.addSpark();
  }

  addWisp() {
    this.wisps.push({
      p: createVector(this.pos.x + random(-2, 2), this.pos.y + random(-2, 2)),
      v: createVector(random(-0.3, 0.3), random(-0.5, -1.2)),
      s: random(6, 12),
      l: 12,
      ml: 12
    });
  }

  addSpark() {
    const rndV = p5.Vector.random2D().mult(random(2, 5));
    this.sparks.push({
      p: createVector(this.pos.x, this.pos.y),
      v: createVector(rndV.x, rndV.y),
      l: 8,
      ml: 8
    });
  }

  update() {
    this.life--;
    if (this.life > 5) {
      if (state.frames % 6 === 0) this.addWisp();
      if (state.frames % 4 === 0) this.addSpark();
    }

    for (let i = this.wisps.length - 1; i >= 0; i--) {
      let w = this.wisps[i];
      w.p.add(w.v);
      w.l--;
      w.s *= 1.05;
      if (w.l <= 0) {
        const last = this.wisps.pop()!;
        if (i < this.wisps.length) {
          this.wisps[i] = last;
        }
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      let s = this.sparks[i];
      s.p.add(s.v);
      s.l--;
      if (s.l <= 0) {
        const last = this.sparks.pop()!;
        if (i < this.sparks.length) {
          this.sparks[i] = last;
        }
      }
    }
  }

  isDone() { return this.life <= 0 && this.wisps.length === 0 && this.sparks.length === 0; }

  display() {
    // Bright focal point
    if (this.life > 0) {
      push();
      translate(this.pos.x, this.pos.y);
      let s = 6 + sin(state.frames * 0.8) * 2;
      
      noStroke();
      // Colored Halo
      fill(this.col[0], this.col[1], this.col[2], 80);
      ellipse(0, 0, s * 2.5);
      // Hot Core
      fill(255, 255, 255, 220);
      ellipse(0, 0, s);
      pop();
    }

    // Micro Smoke Wisps
    noStroke();
    for (let w of this.wisps) {
      let a = map(w.l, 0, w.ml, 0, 120);
      fill(this.col[0], this.col[1], this.col[2], a);
      ellipse(w.p.x, w.p.y, w.s);
    }

    // Micro Sparks
    strokeWeight(3);
    for (let s of this.sparks) {
      let a = map(s.l, 0, s.ml, 0, 200);
      stroke(255, 255, 200, a);
      line(s.p.x, s.p.y, s.p.x - s.v.x * 0.3, s.p.y - s.v.y * 0.3);
    }
  }
}

export const weldingHitPool = new ObjectPool<WeldingHitVFX>(
  'WeldingHit',
  () => new WeldingHitVFX(),
  undefined,
  300
);

export function spawnWeldingHitVFX(x: number, y: number, col: any = [255, 255, 100]): WeldingHitVFX {
  const vfx = weldingHitPool.get();
  vfx.reset(x, y, col);
  return vfx;
}

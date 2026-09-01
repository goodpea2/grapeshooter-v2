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

export class BlockDebris {
  pos: any; particles: any[] = []; life: number = 40;
  constructor(x: number = 0, y: number = 0, col: any = [150, 150, 150]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        p: createVector(x, y),
        v: createVector(0, 0),
        rot: 0,
        rotV: 0,
        size: 8,
        col: col
      });
    }
    this.reset(x, y, col);
  }

  reset(x: number = 0, y: number = 0, col: any = [150, 150, 150]) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.life = 40;
    for (let i = 0; i < 10; i++) {
      const p = this.particles[i];
      if (p) {
        p.p.set(x, y);
        const rndV = p5.Vector.random2D().mult(random(3, 8));
        p.v.set(rndV.x, rndV.y);
        p.rot = random(TWO_PI);
        p.rotV = random(-0.3, 0.3);
        p.size = random(5, 12);
        p.col = col;
      }
    }
  }

  update() {
    this.life--;
    for (let p of this.particles) {
      p.p.add(p.v);
      p.v.mult(0.94);
      p.v.y += 0.15;
      p.rot += p.rotV;
    }
  }
  isDone() { return this.life <= 0; }
  display() {
    noStroke();
    let alpha = map(this.life, 0, 40, 0, 255);
    for (let p of this.particles) {
      push(); translate(p.p.x, p.p.y); rotate(p.rot);
      fill(p.col[0], p.col[1], p.col[2], alpha);
      rect(-p.size/2, -p.size/2, p.size, p.size, 2);
      fill(255, alpha * 0.4);
      rect(-p.size/2, -p.size/2, p.size/2, p.size/2, 2);
      pop();
    }
  }
}

export const blockDebrisPool = new ObjectPool<BlockDebris>(
  'BlockDebris',
  () => new BlockDebris(),
  undefined,
  500
);

export function spawnBlockDebris(x: number, y: number, col: any): BlockDebris {
  const bd = blockDebrisPool.get();
  bd.reset(x, y, col);
  return bd;
}

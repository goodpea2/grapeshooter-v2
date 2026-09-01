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

export class SparkVFX {
  pos: any;
  particles: any[] = [];
  activeCount: number = 0;
  life: number = 30;

  constructor(x: number = 0, y: number = 0, count: number = 8, col: any = color(255, 255, 100)) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        p: createVector(0, 0),
        v: createVector(0, 0),
        c: col,
        s: 2
      });
    }
    this.reset(x, y, count, col);
  }

  reset(x: number = 0, y: number = 0, count: number = 8, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.life = 30;
    this.activeCount = Math.min(count, 30);
    const useCol = col || color(255, 255, 100);

    for (let i = 0; i < this.activeCount; i++) {
      const p = this.particles[i];
      p.p.set(x, y);
      const rndV = p5.Vector.random2D().mult(random(3, 10));
      p.v.set(rndV.x, rndV.y);
      p.c = useCol;
      p.s = random(2, 4);
    }
  }

  update() {
    this.life--;
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.particles[i];
      p.p.add(p.v);
      p.v.mult(0.92);
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    let alpha = map(this.life, 0, 30, 0, 255);
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.particles[i];
      stroke(red(p.c), green(p.c), blue(p.c), alpha);
      strokeWeight(p.s);
      line(p.p.x, p.p.y, p.p.x - p.v.x, p.p.y - p.v.y);
    }
  }
}

export const sparkPool = new ObjectPool<SparkVFX>(
  'SparkVFX',
  () => new SparkVFX(),
  undefined,
  500
);

export function spawnSparkVFX(x: number, y: number, count: number = 8, col?: any): SparkVFX {
  const vfx = sparkPool.get();
  vfx.reset(x, y, count, col);
  return vfx;
}

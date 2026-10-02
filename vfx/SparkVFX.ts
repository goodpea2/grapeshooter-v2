import { state } from '../state';
import { ObjectPool } from '../class/pool';


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

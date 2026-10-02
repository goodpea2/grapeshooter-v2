import { state } from '../state';
import { ObjectPool } from '../class/pool';


export class MergeVFX {
  pos: any; life: number = 30; duration: number = 30; color: any;
  constructor(x: number = 0, y: number = 0, col: any = color(255, 255, 255)) {
    this.pos = createVector(x, y);
    this.reset(x, y, col);
  }

  reset(x: number = 0, y: number = 0, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || color(255, 255, 255);
    this.life = 30;
    this.duration = 30;
  }

  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let progress = 1 - (this.life / this.duration);
    let currentSize = 30 * progress;
    let alpha = map(this.life, 0, this.duration, 0, 200);
    
    push(); translate(this.pos.x, this.pos.y);
    rotate(state.frames * 0.1);
    noFill();
    stroke(red(this.color), green(this.color), blue(this.color), alpha);
    strokeWeight(3);
    triangle(-currentSize, currentSize, 0, -currentSize, currentSize, currentSize);
    pop();
  }
}

export const mergePool = new ObjectPool<MergeVFX>(
  'MergeVFX',
  () => new MergeVFX(),
  undefined,
  200
);

export function spawnMergeVFX(x: number, y: number, col: any): MergeVFX {
  const vfx = mergePool.get();
  vfx.reset(x, y, col);
  return vfx;
}

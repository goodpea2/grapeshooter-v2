
import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { ObjectPool } from '../class/pool';

declare const createVector: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const map: any;
declare const CENTER: any;
declare const rectMode: any;

export class BlockHitVFX {
  pos: any; life: number = 10; maxLife: number = 10;
  constructor(x: number = 0, y: number = 0) {
    this.pos = createVector(x, y);
    this.reset(x, y);
  }

  reset(x: number = 0, y: number = 0) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.life = 10;
    this.maxLife = 10;
  }

  update() {
    this.life--;
  }
  isDone() { return this.life <= 0; }
  display() {
    const alpha = map(this.life, 0, this.maxLife, 0, 64);
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    noStroke();
    fill(255, 255, 255, alpha);
    rect(0, 0, GRID_SIZE, GRID_SIZE, 12);
    pop();
  }
}

export const blockHitPool = new ObjectPool<BlockHitVFX>(
  'BlockHit',
  () => new BlockHitVFX(),
  undefined,
  500
);

export function spawnBlockHitVFX(x: number, y: number): BlockHitVFX {
  const vfx = blockHitPool.get();
  vfx.reset(x, y);
  return vfx;
}

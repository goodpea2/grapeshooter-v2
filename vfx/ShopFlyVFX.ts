import { state } from '../state';
import { ObjectPool } from '../class/pool';


export class ShopFlyVFX {
  pos: any; 
  target: any; 
  life: number = 40; 
  maxLife: number = 40; 
  assetKey: string = '';
  startPos: any;

  constructor(sx: number = 0, sy: number = 0, tx: number = 0, ty: number = 0, assetKey: string = '') {
    this.pos = createVector(sx, sy);
    this.startPos = createVector(sx, sy);
    this.target = createVector(tx, ty);
    this.reset(sx, sy, tx, ty, assetKey);
  }

  reset(sx: number = 0, sy: number = 0, tx: number = 0, ty: number = 0, assetKey: string = '') {
    if (this.pos) this.pos.set(sx, sy); else this.pos = createVector(sx, sy);
    if (this.startPos) this.startPos.set(sx, sy); else this.startPos = createVector(sx, sy);
    if (this.target) this.target.set(tx, ty); else this.target = createVector(tx, ty);
    this.life = 40;
    this.maxLife = 40;
    this.assetKey = assetKey;
  }

  update() {
    this.life--;
    let t = 1 - (this.life / this.maxLife);
    let easedT = pow(t, 2);
    this.pos.x = lerp(this.startPos.x, this.target.x, easedT);
    this.pos.y = lerp(this.startPos.y, this.target.y, easedT);
  }

  isDone() { return this.life <= 0; }

  display() {
    let t = 1 - (this.life / this.maxLife);
    let size = map(sin(t * Math.PI), 0, 1, 60, 90);
    let alpha = map(this.life, 0, 10, 0, 255);
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(t * TWO_PI);
    
    const sprite = state.assets[this.assetKey];
    if (sprite) {
      imageMode(CENTER);
      tint(255, alpha);
      image(sprite, 0, 0, size, size);
      noTint();
    } else {
      fill(255, 255, 100, alpha);
      noStroke();
      ellipse(0, 0, 20);
    }
    pop();
  }
}

export const shopFlyPool = new ObjectPool<ShopFlyVFX>(
  'ShopFly',
  () => new ShopFlyVFX(),
  undefined,
  200
);

export function spawnShopFlyVFX(sx: number, sy: number, tx: number, ty: number, assetKey: string): ShopFlyVFX {
  const vfx = shopFlyPool.get();
  vfx.reset(sx, sy, tx, ty, assetKey);
  return vfx;
}

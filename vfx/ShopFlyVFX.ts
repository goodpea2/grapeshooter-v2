import { state } from '../state';

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
declare const createGraphics: any;
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

export class ShopFlyVFX {
  pos: any; 
  target: any; 
  life: number; 
  maxLife: number; 
  assetKey: string;
  startPos: any;

  constructor(sx: number, sy: number, tx: number, ty: number, assetKey: string) {
    this.pos = createVector(sx, sy);
    this.startPos = createVector(sx, sy);
    this.target = createVector(tx, ty);
    this.life = 40;
    this.maxLife = 40;
    this.assetKey = assetKey;
  }

  update() {
    this.life--;
    let t = 1 - (this.life / this.maxLife);
    // Exponential ease in for a "snappy" landing
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

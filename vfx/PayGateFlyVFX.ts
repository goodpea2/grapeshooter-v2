import { state } from '../state';

declare const createVector: any;
declare const lerp: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const sin: any;
declare const cos: any;
declare const TWO_PI: any;

export class PayGateFlyVFX {
  pos: any;
  startPos: any;
  targetPos: any;
  progress: number = 0;
  speed: number = 0.08;
  assetKey: string;
  size: number = 14;
  isDead: boolean = false;
  arcHeight: number;

  constructor(startX: number, startY: number, targetX: number, targetY: number, assetKey: string) {
    this.pos = createVector(startX, startY);
    this.startPos = createVector(startX, startY);
    this.targetPos = createVector(targetX, targetY);
    this.assetKey = assetKey;
    this.arcHeight = (Math.random() - 0.5) * 20 - 15;
  }

  update() {
    this.progress += this.speed;
    this.speed += 0.008;

    const t = Math.min(1, this.progress);
    // Smooth bezier-like arc trajectory
    const linearX = lerp(this.startPos.x, this.targetPos.x, t);
    const linearY = lerp(this.startPos.y, this.targetPos.y, t);
    const arcOffset = sin(t * Math.PI) * this.arcHeight;

    this.pos.x = linearX;
    this.pos.y = linearY + arcOffset;

    if (this.progress >= 1) {
      this.isDead = true;
    }
  }

  isDone(): boolean {
    return this.isDead;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // Glowing particle halo
    noStroke();
    fill(255, 220, 100, 100);
    ellipse(0, 0, this.size * 1.5, this.size * 1.5);

    const iconKey = this.assetKey.startsWith('img_') ? this.assetKey : `img_icon_${this.assetKey}`;
    const sprite = state.assets[iconKey] || state.assets[this.assetKey] || state.assets['img_icon_soil'];
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, this.size, this.size);
    } else {
      fill(220, 160, 60);
      ellipse(0, 0, this.size, this.size);
    }
    pop();
  }
}

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

export class MuzzleFlash {
  pos: any; angle: number; size: number; duration: number; life: number; color: any;
  constructor(x: number, y: number, angle: number, size = random(18, 28), duration = 6, col = color(255, 255, 200)) {
    this.pos = createVector(x, y); this.angle = angle; this.size = size; this.duration = duration; this.life = this.duration; this.color = col;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    if (!this.pos || isNaN(this.pos.x)) return;
    push(); translate(this.pos.x, this.pos.y); rotate(this.angle);
    let currentSize = this.size * (this.life / this.duration);
    let alpha = map(this.life, 0, this.duration, 0, 255);
    
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), alpha * 0.5);
    beginShape();
    for (let i = 0; i < 8; i++) {
      let radius = (i % 2 === 0) ? currentSize * 0.4 : currentSize;
      let a = TWO_PI / 8 * i; vertex(cos(a) * radius, sin(a) * radius);
    }
    endShape(CLOSE);
    
    fill(255, alpha);
    ellipse(0, 0, currentSize * 0.6, currentSize * 0.3);
    pop();
  }
}

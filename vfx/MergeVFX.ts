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

export class MergeVFX {
  pos: any; life: number = 30; duration: number = 30; color: any;
  constructor(x: number, y: number, col: any) {
    this.pos = createVector(x, y);
    this.color = col;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let progress = 1 - (this.life / this.duration);
    let currentSize = 30 * progress;
    let alpha = map(this.life, 0, this.duration, 0, 200);
    
    push(); translate(this.pos.x, this.pos.y);
    rotate(frameCount * 0.1);
    noFill();
    stroke(red(this.color), green(this.color), blue(this.color), alpha);
    strokeWeight(3);
    triangle(-currentSize, currentSize, 0, -currentSize, currentSize, currentSize);
    pop();
  }
}

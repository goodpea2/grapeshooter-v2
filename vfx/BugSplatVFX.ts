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

export class BugSplatVFX {
  pos: any; blobs: any[] = []; life: number = 30; duration: number = 30; color: any;
  constructor(x: number, y: number, size: number, col: any) {
    this.pos = createVector(x, y);
    this.color = col;
    for(let i=0; i<15; i++){
      this.blobs.push({
        off: p5.Vector.random2D().mult(random(size * 0.1, size * 0.5)),
        v: p5.Vector.random2D().mult(random(2, 6)),
        s: random(size * 0.2, size * 0.5)
      });
    }
  }
  update() { this.life--; for(let b of this.blobs) { b.off.add(b.v); b.v.mult(0.9); b.s *= 0.96; } }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 255);
    push(); translate(this.pos.x, this.pos.y);
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    for(let b of this.blobs) { ellipse(b.off.x, b.off.y, b.s); }
    fill(red(this.color), green(this.color), blue(this.color), alpha * 0.5);
    ellipse(0, 0, (1 - this.life/this.duration) * 80);
    pop();
  }
}

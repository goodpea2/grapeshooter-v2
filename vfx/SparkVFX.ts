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

export class SparkVFX {
  pos: any; particles: any[] = []; life: number = 30;
  constructor(x: number, y: number, count: number, col: any) {
    this.pos = createVector(x, y);
    for(let i=0; i<count; i++){
      this.particles.push({
        p: createVector(x, y),
        v: p5.Vector.random2D().mult(random(3, 10)),
        c: col,
        s: random(2, 4)
      });
    }
  }
  update() { this.life--; for(let p of this.particles) { p.p.add(p.v); p.v.mult(0.92); } }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, 30, 0, 255);
    for(let p of this.particles) {
      stroke(red(p.c), green(p.c), blue(p.c), alpha);
      strokeWeight(p.s);
      line(p.p.x, p.p.y, p.p.x - p.v.x, p.p.y - p.v.y);
    }
  }
}

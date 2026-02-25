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

export class BlockDebris {
  pos: any; particles: any[] = []; life: number = 40;
  constructor(x: number, y: number, col: any) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        p: createVector(x, y),
        v: p5.Vector.random2D().mult(random(3, 8)),
        rot: random(TWO_PI),
        rotV: random(-0.3, 0.3),
        size: random(5, 12),
        col: col
      });
    }
  }
  update() {
    this.life--;
    for (let p of this.particles) {
      p.p.add(p.v);
      p.v.mult(0.94);
      p.v.y += 0.15;
      p.rot += p.rotV;
    }
  }
  isDone() { return this.life <= 0; }
  display() {
    noStroke();
    let alpha = map(this.life, 0, 40, 0, 255);
    for (let p of this.particles) {
      push(); translate(p.p.x, p.p.y); rotate(p.rot);
      fill(p.col[0], p.col[1], p.col[2], alpha);
      rect(-p.size/2, -p.size/2, p.size, p.size, 2);
      fill(255, alpha * 0.4);
      rect(-p.size/2, -p.size/2, p.size/2, p.size/2, 2);
      pop();
    }
  }
}

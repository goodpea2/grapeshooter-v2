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

export class HitSpark {
  pos: any; particles: any[] = []; life: number;
  constructor(x: number, y: number, baseColor: any) {
    this.pos = createVector(x, y);
    let numParticles = floor(random(4, 8));
    for (let i = 0; i < numParticles; i++) {
      this.particles.push({ 
        p: this.pos.copy(), 
        v: p5.Vector.random2D().mult(random(2, 6)), 
        life: random(10, 20), 
        maxLife: 20, 
        size: random(3, 5), 
        c: lerpColor(color(...baseColor), color(255), random(0.6, 1.0)) 
      });
    }
    this.life = 20;
  }
  update() { this.life--; for (let p of this.particles) { p.p.add(p.v); p.v.mult(0.88); p.life--; } }
  isDone() { return this.life <= 0; }
  display() {
    noStroke();
    for (let p of this.particles) {
      if (p.life > 0) {
        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        fill(red(p.c), green(p.c), blue(p.c), alpha);
        ellipse(p.p.x, p.p.y, p.size);
      }
    }
  }
}

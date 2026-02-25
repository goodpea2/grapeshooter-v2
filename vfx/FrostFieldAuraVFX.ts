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

export class FrostFieldAuraVFX {
  target: any; radius: number;
  flakes: {x: number, y: number, s: number, v: number, phase: number}[] = [];
  constructor(target: any, radius: number) {
    this.target = target;
    this.radius = radius;
    for(let i=0; i<20; i++) {
      this.flakes.push({
        x: random(-radius, radius),
        y: random(-radius, radius),
        s: random(2, 4),
        v: random(0.15, 0.5),
        phase: random(TWO_PI)
      });
    }
  }
  update() {
    for(let f of this.flakes) {
      f.y += f.v;
      f.x += sin(frameCount * 0.05 + f.phase) * 0.5;
      if (f.y > this.radius) f.y = -this.radius;
      if (f.x > this.radius) f.x = -this.radius;
      if (f.x < -this.radius) f.x = this.radius;
    }
  }
  isDone() { return !this.target || this.target.health <= 0; }
  display() {
    const p = this.target.getWorldPos();
    const activity = this.target.specialActivityLevel || 0;
    if (activity <= 0.01) return;

    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.05 * sin(frameCount * 0.02);
    const currentRadius = this.radius * activity;
    const currentAlpha = 255 * activity;
    
    // Subtle glow floor
    noStroke();
    fill(150, 220, 255, 30 * activity);
    ellipse(0, 0, currentRadius * 2 * pulse);
    
    // Snowflake particles
    fill(255, 200 * activity);
    for(let f of this.flakes) {
      // Circle masking for the flakes
      const dSq = f.x*f.x + f.y*f.y;
      if (dSq < currentRadius * currentRadius) {
        ellipse(f.x, f.y, f.s);
      }
    }
    pop();
  }
}

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

export class FirstStrikeVFX {
  target: any; life: number = 90;
  constructor(target: any) { this.target = target; }
  update() { this.life--; }
  isDone() { return this.life <= 0 || !this.target || this.target.health <= 0; }
  display() {
    const p = this.target.getWorldPos();
    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.2 * sin(frameCount * 0.4);
    const alpha = map(this.life, 0, 90, 0, 180);
    noFill();
    stroke(255, 255, 100, alpha);
    strokeWeight(2);
    ellipse(0, 0, 60 * pulse);
    stroke(255, 200, 50, alpha * 0.5);
    ellipse(0, 0, 80 * pulse);
    
    // Rising sparks
    for(let i=0; i<3; i++) {
      const off = (frameCount * 2 + i * 30) % 60;
      const x = sin(frameCount * 0.1 + i) * 20;
      fill(255, 255, 150, alpha * (1 - off/60));
      noStroke();
      ellipse(x, -20 - off, 4);
    }
    pop();
  }
}

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

export class ConditionVFX {
  target: any; type: string; 
  constructor(target: any, type: string) { this.target = target; this.type = type; }
  update() {}
  isDone() { return !this.target || this.target.health <= 0 || !this.target.conditions.has(this.type); }
  display() {
    const p = this.target.pos || (this.target.getWorldPos ? this.target.getWorldPos() : null);
    if (!p) return;
    push(); translate(p.x, p.y);
    
    if (this.type === 'c_burning') {
      let r = this.target.size / 2 || 15;
      for(let i=0; i<3; i++) {
        let h = (frameCount * 0.5 + i * 10) % 20;
        let xOff = sin(frameCount * 0.1 + i) * 5;
        let s = map(h, 0, 20, 8, 2);
        fill(255, 120 - h * 5, 0, 180 - h * 8); noStroke();
        ellipse(random(-r * 0.5, r * 0.5) + xOff, -h - 5, s);
      }
    } else if (this.type === 'c_chilled') {
      let r = (this.target.size / 2 || 15) + 4;
      noFill(); 
      let pulse = sin(frameCount * 0.04) * 2;
      stroke(150, 220, 255, 120); strokeWeight(1.5);
      ellipse(0, 0, r * 2 + pulse);
      stroke(255, 255, 255, 60);
      ellipse(0, 0, (r * 2 + pulse) * 1.1);
    } else if (this.type === 'c_stun') {
      let r = (this.target.size / 2 || 15) + 6;
      // Stars swirling above head
      noFill();
      stroke(255, 255, 100, 220); strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        let ang = (frameCount * 0.15) + (i * TWO_PI / 3);
        let sx = cos(ang) * (r * 0.8);
        let sy = sin(ang) * (r * 0.4) - r - 10;
        push(); translate(sx, sy); rotate(frameCount * 0.2);
        line(-3, 0, 3, 0); line(0, -3, 0, 3);
        pop();
      }
    } else if (this.type === 'c_raged') {
        let r = (this.target.size / 2 || 15) + 8;
        noFill();
        stroke(255, 100, 200, 180); strokeWeight(3);
        ellipse(0, 0, r * 2 + sin(frameCount * 0.1) * 4);
    }
    pop();
  }
}

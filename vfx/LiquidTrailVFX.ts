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
declare const createGraphics: any;
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

export class LiquidTrailVFX {
  pos: any; type: string; life: number; maxLife: number; angle: number;
  constructor(x: number, y: number, type: string, angle: number = 0) {
    this.pos = createVector(x, y); 
    this.type = type; 
    this.angle = angle;
    this.maxLife = type === 'water_trail' ? 30 : type === 'tar_trail' ? 120 : 60;
    this.life = this.maxLife;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let progress = 1 - (this.life / this.maxLife);
    let alpha = map(this.life, 0, this.maxLife, 0, 180);
    push(); translate(this.pos.x, this.pos.y);
    noStroke();
    
    if (this.type === 'water_trail') {
      noFill();
      stroke(50, 120, 255, alpha);
      strokeWeight(4);
      ellipse(0, 0, progress * 20 + 20, progress * 20 + 20);
    } else if (this.type === 'ice_trail') {
      rotate(random(TWO_PI));
      fill(220, 245, 255, alpha);
      let s = (1 - progress) * 20;
      beginShape();
      for(let i=0; i<3; i++) {
        let r = i % 2 === 0 ? s : s * 0.4;
        vertex(cos(i * TWO_PI/3) * r, sin(i * TWO_PI/3) * r);
      }
      endShape(CLOSE);
    } else if (this.type === 'tar_trail') {
        fill(40, 20, 60, alpha * 0.8);
        ellipse(random(-2, 2), random(-2, 2), progress * 50);
    } else if (this.type === 'lava_trail') {
      fill(255, 60, 0, alpha * 0.3);
      ellipse(0, 0, progress * 30);
      fill(255, 200, 0, alpha);
      ellipse(random(-2, 2), -progress * 20, 3);
    }
    pop();
  }
}

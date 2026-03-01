import { state } from '../state';

declare const p5: any;
declare const createVector: any;
declare const map: any;
declare const random: any;
declare const TWO_PI: any;
declare const cos: any;
declare const sin: any;
declare const fill: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const frameCount: any;

export class PoisonGasVFX {
  pos: any; radius: number; life: number; duration: number;
  clouds: any[] = [];
  constructor(x: number, y: number, radius: number, duration: number) {
    this.pos = createVector(x, y); this.radius = radius; this.life = duration; this.duration = duration;
    for(let i=0; i<12; i++) {
        this.clouds.push({ 
            off: p5.Vector.random2D().mult(random(radius * 0.6)), 
            s: random(radius * 0.4, radius * 0.8), 
            phase: random(TWO_PI),
            rotV: random(-0.03, 0.03),
            distMult: random(0.7, 1.3)
        });
    }
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 180);
    if (this.life < 40) alpha = map(this.life, 0, 40, 0, 180);
    let expand = map(this.life, this.duration, 0, 0.6, 1.1);
    
    push(); translate(this.pos.x, this.pos.y);
    (window as any).noStroke();
    for(let c of this.clouds) {
      let drift = sin(frameCount * 0.04 + c.phase) * 6;
      let swirlX = cos(frameCount * c.rotV) * c.off.x * expand;
      let swirlY = sin(frameCount * c.rotV) * c.off.y * expand;
      
      // Poisonous green/purple mix
      fill(80, 200, 80, alpha * 0.6);
      ellipse(swirlX + drift, swirlY + drift, c.s * expand);
      fill(120, 50, 150, alpha * 0.3);
      ellipse(swirlX + drift * 0.5, swirlY + drift * 0.5, c.s * 0.7 * expand);
    }
    pop();
  }
}

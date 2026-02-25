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

export class FirePuddleVFX {
  pos: any; radius: number; life: number; duration: number;
  embers: any[] = [];
  sparks: any[] = [];

  constructor(x: number, y: number, radius: number, duration: number = 60) {
    this.pos = createVector(x, y); 
    this.radius = radius;
    this.life = duration; 
    this.duration = duration;
    for(let i=0; i<6; i++) {
        this.embers.push({ 
            p: createVector(random(-radius, radius), random(-radius, radius)), 
            v: random(0.8, 1.5), 
            s: random(3, 5),
            off: random(TWO_PI)
        });
    }
  }

  update() { 
    this.life--; 
    for(let e of this.embers) {
        e.p.y -= e.v; 
        if (e.p.y < -this.radius) e.p.y = this.radius;
    }

    // Persistant spark spawning loop
    if (this.life > 15 && random() < 0.25) {
        this.sparks.push({
            p: createVector(this.pos.x + random(-this.radius*0.7, this.radius*0.7), this.pos.y + random(-this.radius*0.3, this.radius*0.3)),
            v: createVector(random(-0.5, 0.5), random(-1.5, -3.5)),
            l: floor(random(20, 40)),
            s: random(2, 4)
        });
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
        this.sparks[i].p.add(this.sparks[i].v);
        this.sparks[i].l--;
        if (this.sparks[i].l <= 0) this.sparks.splice(i, 1);
    }
  }

  isDone() { return this.life <= 0; }

  display() {
    // Fading logic: Quick fade in, then persistent, then shrink fade out (outro)
    let alpha = 130; 
    let scaleFactor = 1.0;
    
    if (this.life > this.duration - 20) {
        alpha = map(this.life, this.duration, this.duration - 20, 0, 130);
    } else if (this.life < 20) {
        alpha = map(this.life, 0, 20, 0, 130);
        scaleFactor = map(this.life, 0, 20, 0, 1.0);
    }
    
    let pulse = 1.0 + 0.1 * sin(frameCount * 0.3);
    push(); 
    translate(this.pos.x, this.pos.y);
    scale(scaleFactor);
    noStroke();
    
    // Core fire bodies (lower alpha for layered effect)
    fill(255, 40, 0, alpha * 0.4); ellipse(0, 0, this.radius * 2.8 * pulse);
    fill(255, 120, 20, alpha * 0.6); ellipse(0, 0, this.radius * 2.1 * pulse);
    fill(255, 230, 100, alpha * 0.5); ellipse(0, 0, this.radius * 1.3 * pulse);
    
    for(let e of this.embers) {
      fill(255, 255, 150, alpha * 0.8); 
      let drift = sin(frameCount * 0.1 + e.off) * 3;
      ellipse(e.p.x + drift, e.p.y, e.s);
    }
    pop();

    // Draw sparks in world space
    for(let s of this.sparks) {
        let sAlpha = map(s.l, 0, 40, 0, 255);
        fill(255, 200, 100, sAlpha);
        noStroke();
        ellipse(s.p.x, s.p.y, s.s);
    }
  }
}

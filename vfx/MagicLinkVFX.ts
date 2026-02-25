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

export class MagicLinkVFX {
    p1: any; p2: any; life: number = 20; maxLife: number = 20;
    segments: any[] = [];
    seed: number;

    constructor(p1: any, p2: any) {
        this.p1 = p1.copy();
        this.p2 = p2.copy();
        this.seed = random(1000);
        this.generateLightning();
    }

    generateLightning() {
        this.segments = [];
        let count = 5; // Fewer segments for cleaner look
        let prev = this.p1.copy();
        let dir = p5.Vector.sub(this.p2, this.p1);
        let dist = dir.mag();
        dir.normalize();
        let perp = createVector(-dir.y, dir.x);

        for (let i = 1; i <= count; i++) {
            let t = i / count;
            let target = p5.Vector.lerp(this.p1, this.p2, t);
            if (i < count) {
                // Subtle jitter
                let jitter = (random() - 0.5) * (dist * 0.2);
                target.add(p5.Vector.mult(perp, jitter));
            }
            this.segments.push({ a: prev.copy(), b: target.copy() });
            prev = target;
        }
    }

    update() { 
        this.life--; 
        // Much slower flicker/regeneration for stability
        if (this.life % 10 === 0) this.generateLightning();
    }
    
    isDone() { return this.life <= 0; }
    
    display() {
        let alpha = map(this.life, 0, this.maxLife, 0, 200);
        let pulse = 0.8 + 0.2 * sin(frameCount * 0.3 + this.seed);
        
        // Outer Subtle Glow
        stroke(120, 220, 255, alpha * 0.2 * pulse);
        strokeWeight(4);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);
        
        // Inner Glow
        stroke(180, 240, 255, alpha * 0.4);
        strokeWeight(3);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);

        // Brilliant White Core
        stroke(255, 255, 255, alpha);
        strokeWeight(2);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);

        // Directional Energy Flow (Tiny beads)
        noStroke();
        fill(255, alpha);
        let flowT = (frameCount * 0.05 + this.seed) % 1;
        let flowPos = p5.Vector.lerp(this.p1, this.p2, flowT);
        ellipse(flowPos.x, flowPos.y, 4);
    }
}

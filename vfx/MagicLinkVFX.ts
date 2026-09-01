import { state } from '../state';
import { ObjectPool } from '../class/pool';

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
    segments: { a: any; b: any }[] = [];
    seed: number = 0;

    constructor(p1?: any, p2?: any) {
        this.p1 = createVector(0, 0);
        this.p2 = createVector(0, 0);
        for (let i = 0; i < 6; i++) {
            this.segments.push({ a: createVector(0, 0), b: createVector(0, 0) });
        }
        if (p1 && p2) {
            this.reset(p1, p2);
        }
    }

    reset(p1: any, p2: any) {
        if (this.p1) this.p1.set(p1.x, p1.y); else this.p1 = createVector(p1.x, p1.y);
        if (this.p2) this.p2.set(p2.x, p2.y); else this.p2 = createVector(p2.x, p2.y);
        this.life = 20;
        this.maxLife = 20;
        this.seed = random(1000);
        this.generateLightning();
    }

    generateLightning() {
        let count = 5;
        let prevX = this.p1.x;
        let prevY = this.p1.y;
        let dx = this.p2.x - this.p1.x;
        let dy = this.p2.y - this.p1.y;
        let dist = Math.hypot(dx, dy) || 1;
        let nx = -dy / dist;
        let ny = dx / dist;

        for (let i = 1; i <= count; i++) {
            let t = i / count;
            let targetX = lerp(this.p1.x, this.p2.x, t);
            let targetY = lerp(this.p1.y, this.p2.y, t);
            if (i < count) {
                let jitter = (random() - 0.5) * 10;
                targetX += nx * jitter;
                targetY += ny * jitter;
            }
            const seg = this.segments[i - 1];
            if (seg) {
                seg.a.set(prevX, prevY);
                seg.b.set(targetX, targetY);
            }
            prevX = targetX;
            prevY = targetY;
        }
    }

    update() { 
        this.life--; 
        if (this.life % 10 === 0) this.generateLightning();
    }
    
    isDone() { return this.life <= 0; }
    
    display() {
        let alpha = map(this.life, 0, this.maxLife, 0, 200);
        let pulse = 0.8 + 0.2 * sin(state.frames * 0.3 + this.seed);
        
        // Outer Glow
        stroke(120, 220, 255, alpha * 0.2 * pulse);
        strokeWeight(4);
        for (let i = 0; i < 5; i++) {
            const s = this.segments[i];
            line(s.a.x, s.a.y, s.b.x, s.b.y);
        }
        
        // Inner Glow
        stroke(180, 240, 255, alpha * 0.4);
        strokeWeight(3);
        for (let i = 0; i < 5; i++) {
            const s = this.segments[i];
            line(s.a.x, s.a.y, s.b.x, s.b.y);
        }

        // White Core
        stroke(255, 255, 255, alpha);
        strokeWeight(2);
        for (let i = 0; i < 5; i++) {
            const s = this.segments[i];
            line(s.a.x, s.a.y, s.b.x, s.b.y);
        }

        // Directional Energy Flow
        noStroke();
        fill(255, alpha);
        let flowT = (state.frames * 0.05 + this.seed) % 1;
        let flowX = lerp(this.p1.x, this.p2.x, flowT);
        let flowY = lerp(this.p1.y, this.p2.y, flowT);
        ellipse(flowX, flowY, 4);
    }
}

export const magicLinkPool = new ObjectPool<MagicLinkVFX>(
  'MagicLink',
  () => new MagicLinkVFX(),
  undefined,
  200
);

export function spawnMagicLinkVFX(p1: any, p2: any): MagicLinkVFX {
  const vfx = magicLinkPool.get();
  vfx.reset(p1, p2);
  return vfx;
}

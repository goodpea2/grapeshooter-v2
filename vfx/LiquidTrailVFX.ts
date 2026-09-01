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
  pos: any; type: string = 'water_trail'; life: number = 30; maxLife: number = 30; angle: number = 0;
  constructor(x: number = 0, y: number = 0, type: string = 'water_trail', angle: number = 0) {
    this.pos = createVector(x, y); 
    this.reset(x, y, type, angle);
  }

  reset(x: number = 0, y: number = 0, type: string = 'water_trail', angle: number = 0) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.type = type; 
    this.angle = angle;
    this.maxLife = type === 'water_trail' ? 30 : type === 'tar_trail' ? 120 : 60;
    this.life = this.maxLife;
  }

  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    if (isNaN(this.pos.x) || isNaN(this.pos.y)) return;
    const progress = 1 - (this.life / this.maxLife);
    const alphaNorm = Math.max(0, Math.min(1, this.life / this.maxLife)) * 0.7;

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      if (this.type === 'water_trail') {
        const radius = (progress * 20 + 20) * 0.5;
        ctx.strokeStyle = `rgba(50, 120, 255, ${alphaNorm})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.type === 'ice_trail') {
        const s = (1 - progress) * 10;
        ctx.fillStyle = `rgba(220, 245, 255, ${alphaNorm})`;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, Math.max(1, s), 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'tar_trail') {
        const r = (progress * 50) * 0.5;
        ctx.fillStyle = `rgba(40, 20, 60, ${alphaNorm * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'lava_trail') {
        const r = (progress * 30) * 0.5;
        ctx.fillStyle = `rgba(255, 60, 0, ${alphaNorm * 0.4})`;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, Math.max(1, r), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 200, 0, ${alphaNorm})`;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y - progress * 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

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

export const liquidTrailPool = new ObjectPool<LiquidTrailVFX>(
  'LiquidTrail',
  () => new LiquidTrailVFX(),
  undefined,
  500
);

export function spawnLiquidTrailVFX(x: number, y: number, type: string, angle: number = 0): LiquidTrailVFX {
  const vfx = liquidTrailPool.get();
  vfx.reset(x, y, type, angle);
  return vfx;
}

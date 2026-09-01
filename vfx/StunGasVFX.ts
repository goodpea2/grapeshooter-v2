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

export class StunGasVFX {
  pos: any; radius: number = 50; life: number = 60; duration: number = 60;
  clouds: { off: any; s: number; phase: number; rotV: number; distMult: number }[] = [];

  constructor(x: number = 0, y: number = 0, radius: number = 50, duration: number = 60) {
    this.pos = createVector(x, y);
    for(let i=0; i<16; i++) {
      this.clouds.push({ 
        off: createVector(0, 0), 
        s: 20, 
        phase: 0,
        rotV: 0,
        distMult: 1
      });
    }
    this.reset(x, y, radius, duration);
  }

  reset(x: number = 0, y: number = 0, radius: number = 50, duration: number = 60) {
    if (this.pos) this.pos.set(x, y); else this.pos = createVector(x, y);
    this.radius = radius;
    this.life = duration;
    this.duration = duration;
    for(let i=0; i<16; i++) {
      const c = this.clouds[i];
      if (c) {
        const rndV = p5.Vector.random2D().mult(random(radius * 0.7));
        c.off.set(rndV.x, rndV.y);
        c.s = random(radius * 0.5, radius * 1.0);
        c.phase = random(TWO_PI);
        c.rotV = random(-0.02, 0.02);
        c.distMult = random(0.8, 1.2);
      }
    }
  }

  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 150);
    if (this.life < 40) alpha = map(this.life, 0, 40, 0, 150);
    let expand = map(this.life, this.duration, 0, 0.5, 1.2);
    
    push(); translate(this.pos.x, this.pos.y);
    noStroke();
    for(let c of this.clouds) {
      let drift = sin(state.frames * 0.03 + c.phase) * 8;
      let swirlX = cos(state.frames * c.rotV) * c.off.x * expand;
      let swirlY = sin(state.frames * c.rotV) * c.off.y * expand;
      
      fill(100, 255, 100, alpha * 0.7);
      ellipse(swirlX + drift, swirlY + drift, c.s * expand);
      fill(200, 255, 200, alpha * 0.3);
      ellipse(swirlX + drift * 0.5, swirlY + drift * 0.5, c.s * 0.6 * expand);
    }
    pop();
  }
}

export const stunGasPool = new ObjectPool<StunGasVFX>(
  'StunGas',
  () => new StunGasVFX(),
  undefined,
  200
);

export function spawnStunGasVFX(x: number, y: number, radius: number, duration: number): StunGasVFX {
  const vfx = stunGasPool.get();
  vfx.reset(x, y, radius, duration);
  return vfx;
}

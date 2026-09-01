import { state } from '../state';
import { ObjectPool } from '../class/pool';

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
  pos: any; radius: number = 50; life: number = 60; duration: number = 60;
  clouds: { off: any; s: number; phase: number; rotV: number; distMult: number }[] = [];

  constructor(x: number = 0, y: number = 0, radius: number = 50, duration: number = 60) {
    this.pos = createVector(x, y);
    for(let i=0; i<12; i++) {
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
    for(let i=0; i<12; i++) {
      const c = this.clouds[i];
      if (c) {
        const rndV = p5.Vector.random2D().mult(random(radius * 0.6));
        c.off.set(rndV.x, rndV.y);
        c.s = random(radius * 0.4, radius * 0.8);
        c.phase = random(TWO_PI);
        c.rotV = random(-0.03, 0.03);
        c.distMult = random(0.7, 1.3);
      }
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
      let drift = sin(state.frames * 0.04 + c.phase) * 6;
      let swirlX = cos(state.frames * c.rotV) * c.off.x * expand;
      let swirlY = sin(state.frames * c.rotV) * c.off.y * expand;
      
      // Poisonous green/purple mix
      fill(80, 200, 80, alpha * 0.6);
      ellipse(swirlX + drift, swirlY + drift, c.s * expand);
      fill(120, 50, 150, alpha * 0.3);
      ellipse(swirlX + drift * 0.5, swirlY + drift * 0.5, c.s * 0.7 * expand);
    }
    pop();
  }
}

export const poisonGasPool = new ObjectPool<PoisonGasVFX>(
  'PoisonGas',
  () => new PoisonGasVFX(),
  undefined,
  200
);

export function spawnPoisonGasVFX(x: number, y: number, radius: number, duration: number): PoisonGasVFX {
  const vfx = poisonGasPool.get();
  vfx.reset(x, y, radius, duration);
  return vfx;
}

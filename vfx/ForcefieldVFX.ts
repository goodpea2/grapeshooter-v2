import { state } from '../state';
import { ObjectPool } from '../class/pool';


export class ForcefieldVFX {
  pos: any; radius: number = 40; life: number = 60; duration: number = 60;
  constructor(x: number = 0, y: number = 0, radius: number = 40, duration: number = 60) {
    this.pos = createVector(x, y); 
    this.reset(x, y, radius, duration);
  }

  reset(x: number = 0, y: number = 0, radius: number = 40, duration: number = 60) {
    if (this.pos) this.pos.set(x, y); else this.pos = createVector(x, y);
    this.radius = radius;
    this.life = duration;
    this.duration = duration;
  }

  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 100);
    if (this.life < 30) alpha = map(this.life, 0, 30, 0, 100);
    let pulse = 1.0 + 0.02 * sin(state.frames * 0.01);
    
    push(); translate(this.pos.x, this.pos.y);
    noFill();
    stroke(100, 200, 255, alpha * 2);
    strokeWeight(2);
    ellipse(0, 0, this.radius * 2 * pulse);
    
    fill(50, 150, 255, alpha);
    noStroke();
    ellipse(0, 0, this.radius * 2 * pulse);
    
    pop();
  }
}

export const forcefieldPool = new ObjectPool<ForcefieldVFX>(
  'Forcefield',
  () => new ForcefieldVFX(),
  undefined,
  100
);

export function spawnForcefieldVFX(x: number, y: number, radius: number, duration: number): ForcefieldVFX {
  const vfx = forcefieldPool.get();
  vfx.reset(x, y, radius, duration);
  return vfx;
}

import { state } from '../state';
import { ObjectPool } from '../class/pool';


export class FirstStrikeVFX {
  target: any; life: number = 90;
  constructor(target: any = null) { 
    this.reset(target); 
  }

  reset(target: any = null) {
    this.target = target;
    this.life = 90;
  }

  update() { this.life--; }
  isDone() { return this.life <= 0 || !this.target || this.target.health <= 0; }
  display() {
    if (!this.target) return;
    const p = this.target.getWorldPos ? this.target.getWorldPos() : this.target.pos;
    if (!p) return;
    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.2 * sin(state.frames * 0.4);
    const alpha = map(this.life, 0, 90, 0, 180);
    noFill();
    stroke(255, 255, 100, alpha);
    strokeWeight(2);
    ellipse(0, 0, 60 * pulse);
    stroke(255, 200, 50, alpha * 0.5);
    ellipse(0, 0, 80 * pulse);
    
    // Rising sparks
    for(let i=0; i<3; i++) {
      const off = (state.frames * 2 + i * 30) % 60;
      const x = sin(state.frames * 0.1 + i) * 20;
      fill(255, 255, 150, alpha * (1 - off/60));
      noStroke();
      ellipse(x, -20 - off, 4);
    }
    pop();
  }
}

export const firstStrikePool = new ObjectPool<FirstStrikeVFX>(
  'FirstStrike',
  () => new FirstStrikeVFX(),
  undefined,
  200
);

export function spawnFirstStrikeVFX(target: any): FirstStrikeVFX {
  const vfx = firstStrikePool.get();
  vfx.reset(target);
  return vfx;
}

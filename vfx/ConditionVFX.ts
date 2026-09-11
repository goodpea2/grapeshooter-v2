import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const map: any;
declare const sin: any;
declare const cos: any;
declare const TWO_PI: any;
declare const random: any;
declare const noStroke: any;
declare const noFill: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const ellipse: any;
declare const line: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;

export class ConditionVFX {
  target: any;
  type: string = '';

  constructor(target: any = null, type: string = '') {
    this.reset(target, type);
  }

  reset(target: any = null, type: string = '') {
    this.target = target;
    this.type = type;
  }

  update() {}

  isDone() {
    return !this.target || this.target.health <= 0 || !this.target.conditions || !this.target.conditions.has(this.type);
  }

  display() {
    const p = this.target.pos || (this.target.getWorldPos ? this.target.getWorldPos() : null);
    if (!p) return;
    push();
    translate(p.x, p.y);

    if (this.type === 'c_burning') {
      const r = this.target.size / 2 || 15;
      for (let i = 0; i < 3; i++) {
        const h = (state.frames * 0.5 + i * 10) % 20;
        const xOff = sin(state.frames * 0.1 + i) * 5;
        const s = map(h, 0, 20, 8, 2);
        fill(255, 120 - h * 5, 0, 180 - h * 8);
        noStroke();
        ellipse(random(-r * 0.5, r * 0.5) + xOff, -h - 5, s);
      }
    } else if (this.type === 'c_chilled') {
      const r = (this.target.size / 2 || 15) + 4;
      noFill();
      const pulse = sin(state.frames * 0.04) * 2;
      stroke(150, 220, 255, 120);
      strokeWeight(1.5);
      ellipse(0, 0, r * 2 + pulse);
      stroke(255, 255, 255, 60);
      ellipse(0, 0, (r * 2 + pulse) * 1.1);
    } else if (this.type === 'c_stun') {
      const r = (this.target.size / 2 || 15) + 6;
      noFill();
      stroke(255, 255, 100, 220);
      strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        const ang = (state.frames * 0.15) + (i * TWO_PI / 3);
        const sx = cos(ang) * (r * 0.8);
        const sy = sin(ang) * (r * 0.4) - r - 10;
        push();
        translate(sx, sy);
        rotate(state.frames * 0.2);
        line(-3, 0, 3, 0);
        line(0, -3, 0, 3);
        pop();
      }
    } else if (this.type === 'c_raged') {
      const r = (this.target.size / 2 || 15) + 8;
      noFill();
      stroke(255, 100, 200, 180);
      strokeWeight(3);
      ellipse(0, 0, r * 2 + sin(state.frames * 0.1) * 4);
    } else if (this.type === 'c_hypnotized') {
      const r = (this.target.size / 2 || 15) + 6;
      noFill();
      const t = state.frames * 0.08;

      // Swirling hypnotic orb/sparkles orbiting above the head
      const headY = -r - 8;
      strokeWeight(1.5);
      for (let i = 0; i < 3; i++) {
        const ang = t + (i * TWO_PI / 3);
        const ox = cos(ang) * (r * 0.7);
        const oy = sin(ang) * (r * 0.35) + headY;
        
        fill(255, 150, 255, 230);
        stroke(200, 80, 255, 200);
        ellipse(ox, oy, 4, 4);
      }
    } else if (this.type === 'fireRateUp') {
      const r = (this.target.size / 2 || 15) + 6;
      // Small orbiting speed sparks
      for (let i = 0; i < 2; i++) {
        const ang = (state.frames * 0.12) + (i * Math.PI);
        const sx = cos(ang) * (r + 2);
        const sy = sin(ang) * (r + 2);
        fill(255, 240, 100, 220);
        noStroke();
        ellipse(sx, sy, 4, 4);
      }
    }
    pop();
  }
}

export const conditionPool = new ObjectPool<ConditionVFX>(
  'ConditionVFX',
  () => new ConditionVFX(),
  undefined,
  500
);

export function spawnConditionVFX(target: any, type: string): ConditionVFX {
  const vfx = conditionPool.get();
  vfx.reset(target, type);
  return vfx;
}

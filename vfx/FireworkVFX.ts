import { state } from '../state';
import { ObjectPool } from '../class/pool';

declare const createVector: any;
declare const color: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const map: any;
declare const random: any;
declare const TWO_PI: any;
declare const cos: any;
declare const sin: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const frameCount: any;
declare const floor: any;
declare const drawingContext: any;

export class FireworkVFX {
  pos: any;
  particles: any[] = [];
  duration: number = 120;
  life: number = 120;
  flashLife: number = 6;
  flashDuration: number = 6;
  glowSize: number = 320;

  constructor(x: number = 0, y: number = 0) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        pos: createVector(0, 0),
        vel: createVector(0, 0),
        size: 6,
        color: null,
        trail: [] as { x: number; y: number }[],
        sparkle: true,
        active: false
      });
    }
    this.reset(x, y);
  }

  reset(x: number = 0, y: number = 0) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.glowSize = random(300, 350);
    this.life = 120;
    this.duration = 120;
    this.flashLife = 6;
    this.flashDuration = 6;

    const count = 25 + floor(random(15));
    const colors = [
      color(255, 255, 120),
      color(255, 255, 120),
      color(255, 255, 120),
      color(255, 255, 120),
      color(255, 100, 100),
      color(255, 200, 150),
      color(120, 255, 120),
      color(120, 255, 255),
      color(120, 120, 255),
      color(255, 120, 255)
    ];
    const baseColor = colors[floor(random(colors.length))];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (i < count) {
        const ang = random(TWO_PI);
        const speed = random(3, 9);
        p.pos.set(0, 0);
        p.vel.set(cos(ang) * speed, sin(ang) * speed);
        p.size = random(4, 10);
        p.color = baseColor;
        p.trail.length = 0;
        p.sparkle = random() < 0.7;
        p.active = true;
      } else {
        p.active = false;
      }
    }
  }

  update() {
    this.life--;
    this.flashLife--;

    for (let p of this.particles) {
      if (!p.active) continue;
      p.trail.push({ x: p.pos.x, y: p.pos.y });
      if (p.trail.length > 8) p.trail.shift();

      p.pos.add(p.vel);
      p.vel.mult(0.95);
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const alpha = map(this.life, 0, this.duration, 0, 255);
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();

    const ctx = drawingContext;
    const r = this.glowSize * (this.life / this.duration);
    const glowAlpha = map(this.life, 0, this.duration, 0, 0.15);

    if (r > 0 && glowAlpha > 0) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      gradient.addColorStop(0, `rgba(255,255,120,${glowAlpha})`);
      gradient.addColorStop(0.2, `rgba(255,255,120,${glowAlpha * 0.6})`);
      gradient.addColorStop(0.5, `rgba(255,255,120,${glowAlpha * 0.25})`);
      gradient.addColorStop(1, `rgba(255,255,120,0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TWO_PI);
      ctx.fill();
    }

    if (this.flashLife > 0) {
      const f = this.flashLife / this.flashDuration;
      fill(255, 255, 120, 220 * f);
      ellipse(0, 0, 120 * f);
      fill(255, 255, 120, 120 * f);
      ellipse(0, 0, 200 * f);
    }

    for (let p of this.particles) {
      if (!p.active || !p.color) continue;
      let pAlpha = alpha;
      if (p.sparkle && state.frames % 10 < 2) {
        pAlpha *= 0.3;
      }

      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailAlpha = pAlpha * (i / p.trail.length) * 0.4;
        fill(red(p.color), green(p.color), blue(p.color), trailAlpha);
        ellipse(t.x, t.y, p.size * 0.7);
      }

      fill(red(p.color), green(p.color), blue(p.color), pAlpha * 0.25);
      ellipse(p.pos.x, p.pos.y, p.size * 3 * (this.life / this.duration));

      fill(red(p.color), green(p.color), blue(p.color), pAlpha);
      ellipse(p.pos.x, p.pos.y, p.size * (this.life / this.duration));

      if (random() < 0.4) {
        fill(255, 255, 255, pAlpha);
        ellipse(p.pos.x + random(-3, 3), p.pos.y + random(-3, 3), 2);
      }
    }
    pop();
  }
}

export const fireworkPool = new ObjectPool<FireworkVFX>(
  'Firework',
  () => new FireworkVFX(),
  undefined,
  200
);

export function spawnFireworkVFX(x: number, y: number): FireworkVFX {
  const vfx = fireworkPool.get();
  vfx.reset(x, y);
  return vfx;
}

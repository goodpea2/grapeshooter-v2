import { ObjectPool } from '../class/pool';

declare const p5: any;
declare const createVector: any;
declare const random: any;
declare const map: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export class HitSpark {
  pos: any;
  particles: SparkParticle[] = [];
  life: number = 20;

  constructor(x: number = 0, y: number = 0, baseColor: any = [255, 255, 255]) {
    this.pos = createVector(x, y);
    this.reset(x, y, baseColor);
  }

  reset(x: number, y: number, baseColor: any = [255, 255, 255]) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }

    let br = 255, bg = 255, bb = 255;
    if (Array.isArray(baseColor)) {
      br = baseColor[0] ?? 255;
      bg = baseColor[1] ?? 255;
      bb = baseColor[2] ?? 255;
    } else if (baseColor && Array.isArray(baseColor.levels)) {
      br = baseColor.levels[0];
      bg = baseColor.levels[1];
      bb = baseColor.levels[2];
    }

    const numParticles = 4 + Math.floor(Math.random() * 4);
    while (this.particles.length < numParticles) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 20,
        size: 0,
        r: 255,
        g: 255,
        b: 255
      });
    }
    this.particles.length = numParticles;

    for (let i = 0; i < numParticles; i++) {
      const part = this.particles[i];
      part.x = x;
      part.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      part.vx = Math.cos(angle) * speed;
      part.vy = Math.sin(angle) * speed;
      part.life = 10 + Math.random() * 10;
      part.maxLife = 20;
      part.size = 3 + Math.random() * 2;
      const lerpRatio = 0.6 + Math.random() * 0.4;
      part.r = Math.round(br + (255 - br) * lerpRatio);
      part.g = Math.round(bg + (255 - bg) * lerpRatio);
      part.b = Math.round(bb + (255 - bb) * lerpRatio);
    }
    this.life = 20;
  }

  update() {
    this.life--;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.life--;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
    if (ctx) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.life > 0) {
          const alphaNorm = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alphaNorm})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }

    noStroke();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        fill(p.r, p.g, p.b, alpha);
        ellipse(p.x, p.y, p.size);
      }
    }
  }
}

export const hitSparkPool = new ObjectPool<HitSpark>(
  'HitSpark',
  () => new HitSpark(),
  undefined,
  500
);

export function spawnHitSpark(x: number, y: number, baseColor: any = [255, 255, 255]): HitSpark {
  const spark = hitSparkPool.get();
  spark.reset(x, y, baseColor);
  return spark;
}

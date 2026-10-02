import { ObjectPool } from '../class/pool';


export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxLife: number;
  life: number;
  r: number;
  g: number;
  b: number;
}

export class NodeUnlockVFX {
  x: number = 0;
  y: number = 0;
  life: number = 40;
  maxLife: number = 40;
  theme: 'gold' | 'purple' | 'cyan' = 'gold';
  particles: SparkParticle[] = [];

  constructor(x: number = 0, y: number = 0, theme: 'gold' | 'purple' | 'cyan' = 'gold') {
    this.reset(x, y, theme);
  }

  reset(x: number = 0, y: number = 0, theme: 'gold' | 'purple' | 'cyan' = 'gold') {
    this.x = x;
    this.y = y;
    this.maxLife = 40;
    this.life = 40;
    this.theme = theme;

    this.particles = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = 2.5 + Math.random() * 4.5;
      let r = 255;
      let g = 215;
      let b = 50;

      if (theme === 'purple') {
        r = 210 + Math.floor(Math.random() * 45);
        g = 90 + Math.floor(Math.random() * 70);
        b = 255;
      } else if (theme === 'cyan') {
        r = 70 + Math.floor(Math.random() * 50);
        g = 210 + Math.floor(Math.random() * 45);
        b = 255;
      }

      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3.5,
        maxLife: 25 + Math.floor(Math.random() * 15),
        life: 25 + Math.floor(Math.random() * 15),
        r,
        g,
        b
      });
    }
  }

  update() {
    this.life--;
    for (let p of this.particles) {
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.life--;
      }
    }
  }

  isDone(): boolean {
    return this.life <= 0;
  }

  display() {
    const prog = 1 - this.life / this.maxLife; // 0 to 1
    const alphaFade = Math.max(0, 1 - prog);

    push();
    translate(this.x, this.y);

    // 1. Primary Shockwave Ring
    const ringRadius = 20 + prog * 95;
    noFill();
    let ringR = 255;
    let ringG = 220;
    let ringB = 60;
    if (this.theme === 'purple') {
      ringR = 215;
      ringG = 110;
      ringB = 255;
    } else if (this.theme === 'cyan') {
      ringR = 90;
      ringG = 220;
      ringB = 255;
    }

    stroke(ringR, ringG, ringB, alphaFade * 240);
    strokeWeight(Math.max(1, 4 * (1 - prog)));
    circle(0, 0, ringRadius * 2);

    // 2. Secondary Fast Echo Ring
    if (prog > 0.08) {
      const echoProg = (prog - 0.08) / 0.92;
      const echoRadius = 15 + echoProg * 65;
      stroke(255, 255, 255, (1 - echoProg) * 200);
      strokeWeight(Math.max(0.8, 2.5 * (1 - echoProg)));
      circle(0, 0, echoRadius * 2);
    }

    // 3. Central Star Glint (flashes in first 40% of duration)
    if (prog < 0.45) {
      const glintProg = prog / 0.45;
      const glintAlpha = (1 - glintProg) * 255;
      const glintLen = 28 * Math.sin(glintProg * Math.PI);
      stroke(255, 255, 255, glintAlpha);
      strokeWeight(2.5);
      line(-glintLen, 0, glintLen, 0);
      line(0, -glintLen, 0, glintLen);
      strokeWeight(1.5);
      line(-glintLen * 0.6, -glintLen * 0.6, glintLen * 0.6, glintLen * 0.6);
      line(-glintLen * 0.6, glintLen * 0.6, glintLen * 0.6, -glintLen * 0.6);
    }

    // 4. Radiating Spark Particles
    noStroke();
    for (let p of this.particles) {
      if (p.life > 0) {
        const pAlpha = (p.life / p.maxLife) * 255;
        fill(p.r, p.g, p.b, pAlpha);
        circle(p.x, p.y, p.size * (p.life / p.maxLife));
      }
    }

    pop();
  }
}

export const nodeUnlockPool = new ObjectPool<NodeUnlockVFX>(
  'NodeUnlockVFX',
  () => new NodeUnlockVFX(),
  undefined,
  100
);

export function spawnNodeUnlockVFX(
  x: number,
  y: number,
  theme: 'gold' | 'purple' | 'cyan' = 'gold'
): NodeUnlockVFX {
  const vfx = nodeUnlockPool.get();
  vfx.reset(x, y, theme);
  return vfx;
}

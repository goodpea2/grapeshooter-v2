import { state } from '../state';
import { ObjectPool } from '../class/pool';


export class FirePuddleVFX {
  pos: any; radius: number = 30; life: number = 60; duration: number = 60;
  embers: any[] = [];
  sparks: any[] = [];

  constructor(x: number = 0, y: number = 0, radius: number = 30, duration: number = 60) {
    this.pos = createVector(x, y); 
    for(let i=0; i<6; i++) {
        this.embers.push({ 
            p: createVector(0, 0), 
            v: 1, 
            s: 4,
            off: 0
        });
    }
    this.reset(x, y, radius, duration);
  }

  reset(x: number = 0, y: number = 0, radius: number = 30, duration: number = 60) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.radius = radius;
    this.life = duration;
    this.duration = duration;
    this.sparks.length = 0;
    for (let i = 0; i < 6; i++) {
      const e = this.embers[i];
      if (e) {
        e.p.set(random(-radius, radius), random(-radius, radius));
        e.v = random(0.8, 1.5);
        e.s = random(3, 5);
        e.off = random(TWO_PI);
      }
    }
  }

  update() { 
    this.life--; 
    for(let e of this.embers) {
        e.p.y -= e.v; 
        if (e.p.y < -this.radius) e.p.y = this.radius;
    }

    // Persistant spark spawning loop (capped per tile)
    if (this.life > 15 && random() < 0.25 && this.sparks.length < 16) {
        this.sparks.push({
            p: createVector(this.pos.x + random(-this.radius*0.7, this.radius*0.7), this.pos.y + random(-this.radius*0.3, this.radius*0.3)),
            v: createVector(random(-0.5, 0.5), random(-1.5, -3.5)),
            l: floor(random(20, 40)),
            s: random(2, 4)
        });
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
        this.sparks[i].p.add(this.sparks[i].v);
        this.sparks[i].l--;
        if (this.sparks[i].l <= 0) {
          const last = this.sparks.pop()!;
          if (i < this.sparks.length) {
            this.sparks[i] = last;
          }
        }
    }
  }

  isDone() { return this.life <= 0; }

  display() {
    // Fading logic: Quick fade in, then persistent, then shrink fade out (outro)
    let alpha = 130; 
    let scaleFactor = 1.0;
    
    if (this.life > this.duration - 20) {
        alpha = map(this.life, this.duration, this.duration - 20, 0, 130);
    } else if (this.life < 20) {
        alpha = map(this.life, 0, 20, 0, 130);
        scaleFactor = map(this.life, 0, 20, 0, 1.0);
    }
    
    let pulse = 1.0 + 0.1 * sin(state.frames * 0.3);
    push(); 
    translate(this.pos.x, this.pos.y);
    scale(scaleFactor);
    noStroke();
    
    // Core fire bodies (lower alpha for layered effect)
    fill(255, 40, 0, alpha * 0.4); ellipse(0, 0, this.radius * 2.8 * pulse);
    fill(255, 120, 20, alpha * 0.6); ellipse(0, 0, this.radius * 2.1 * pulse);
    fill(255, 230, 100, alpha * 0.5); ellipse(0, 0, this.radius * 1.3 * pulse);
    
    for(let e of this.embers) {
      fill(255, 255, 150, alpha * 0.8); 
      let drift = sin(state.frames * 0.1 + e.off) * 3;
      ellipse(e.p.x + drift, e.p.y, e.s);
    }
    pop();

    // Draw sparks in world space
    for(let s of this.sparks) {
        let sAlpha = map(s.l, 0, 40, 0, 255);
        fill(255, 200, 100, sAlpha);
        noStroke();
        ellipse(s.p.x, s.p.y, s.s);
    }
  }
}

export const firePuddlePool = new ObjectPool<FirePuddleVFX>(
  'FirePuddle',
  () => new FirePuddleVFX(),
  undefined,
  500
);

export function spawnFirePuddleVFX(x: number, y: number, radius: number = 30, duration: number = 60): FirePuddleVFX {
  const vfx = firePuddlePool.get();
  vfx.reset(x, y, radius, duration);
  return vfx;
}

// --- Tile-based Fire Puddle VFX Registry ---
// Ensures only 1 fire puddle VFX exists per grid tile, limiting spark and visual stacking
const tileFirePuddleMap = new Map<string, FirePuddleVFX>();

export function getOrCreateTileFirePuddleVFX(
  tileKey: string,
  centerX: number,
  centerY: number,
  radius: number = 30,
  duration: number = 60
): FirePuddleVFX {
  const existing = tileFirePuddleMap.get(tileKey);
  if (existing) {
    if (duration > existing.life) {
      existing.life = duration;
      existing.duration = Math.max(existing.duration, duration);
    }
    if (radius > existing.radius) {
      existing.radius = radius;
    }
    return existing;
  }
  const vfx = firePuddlePool.get();
  vfx.reset(centerX, centerY, radius, duration);
  tileFirePuddleMap.set(tileKey, vfx);
  return vfx;
}

export function updateTileFirePuddles(): void {
  for (const [key, vfx] of tileFirePuddleMap.entries()) {
    vfx.update();
    if (vfx.isDone()) {
      tileFirePuddleMap.delete(key);
      firePuddlePool.release(vfx);
    }
  }
}

export function displayTileFirePuddles(vp?: any): void {
  for (const vfx of tileFirePuddleMap.values()) {
    if (vp && vp.maxX !== undefined) {
      const pad = vfx.radius * 3;
      if (
        vfx.pos.x < vp.minX - pad ||
        vfx.pos.x > vp.maxX + pad ||
        vfx.pos.y < vp.minY - pad ||
        vfx.pos.y > vp.maxY + pad
      ) {
        continue;
      }
    }
    vfx.display();
  }
}

export function clearTileFirePuddles(): void {
  for (const vfx of tileFirePuddleMap.values()) {
    firePuddlePool.release(vfx);
  }
  tileFirePuddleMap.clear();
}

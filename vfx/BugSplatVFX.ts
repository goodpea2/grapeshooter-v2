import { state } from '../state';
import { ObjectPool } from '../class/pool';
import { soundEngine } from '../src/audio/soundEngine';
import { drawPersistentDeathVisual } from './Utils';

declare const p5: any;
declare const createVector: any;
declare const color: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const map: any;
declare const lerp: any;
declare const random: any;
declare const TWO_PI: any;
declare const cos: any;
declare const sin: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const fill: any;
declare const noFill: any;
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

function getRgb(c: any): [number, number, number] {
  if (Array.isArray(c)) {
    return [c[0] ?? 140, c[1] ?? 70, c[2] ?? 220];
  }
  if (c && typeof c === 'object' && 'levels' in c && Array.isArray(c.levels)) {
    return [c.levels[0], c.levels[1], c.levels[2]];
  }
  try {
    return [red(c), green(c), blue(c)];
  } catch {
    return [140, 70, 220];
  }
}

// ==========================================
// 1. BugSplatVFX (Original baseline splat)
// ==========================================
export class BugSplatVFX {
  pos: any;
  blobs: any[] = [];
  life: number = 30;
  duration: number = 30;
  color: any;

  constructor(x: number = 0, y: number = 0, size: number = 30, col: any = [140, 70, 220]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 15; i++) {
      this.blobs.push({
        off: createVector(0, 0),
        v: createVector(0, 0),
        s: 5
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 30, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [140, 70, 220];
    this.life = 30;
    this.duration = 30;
    for (let i = 0; i < 15; i++) {
      const ang1 = random(TWO_PI);
      const dist1 = random(size * 0.1, size * 0.5);
      const ang2 = random(TWO_PI);
      const speed2 = random(2, 6);
      const b = this.blobs[i];
      if (b) {
        b.off.set(cos(ang1) * dist1, sin(ang1) * dist1);
        b.v.set(cos(ang2) * speed2, sin(ang2) * speed2);
        b.s = random(size * 0.2, size * 0.5);
      }
    }
  }

  update() {
    this.life--;
    for (let b of this.blobs) {
      b.off.add(b.v);
      b.v.mult(0.9);
      b.s *= 0.96;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    const alpha = map(this.life, 0, this.duration, 0, 255);
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(r, g, b, alpha);
    for (let bl of this.blobs) {
      ellipse(bl.off.x, bl.off.y, bl.s);
    }
    fill(r, g, b, alpha * 0.5);
    ellipse(0, 0, (1 - this.life / this.duration) * 80);
    pop();
  }
}

// ==========================================
// 2. BugSplatVFX2 (More dramatic splatter)
// ==========================================
export class BugSplatVFX2 {
  pos: any;
  blobs: any[] = [];
  life: number = 36;
  duration: number = 36;
  color: any;
  baseSize: number = 35;

  constructor(x: number = 0, y: number = 0, size: number = 35, col: any = [140, 70, 220]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 24; i++) {
      this.blobs.push({
        off: createVector(0, 0),
        v: createVector(0, 0),
        s: 6,
        isStreak: i % 2 === 0
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 35, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [140, 70, 220];
    this.baseSize = size;
    this.life = 36;
    this.duration = 36;

    for (let i = 0; i < 24; i++) {
      const b = this.blobs[i];
      const ang = random(TWO_PI);
      const startDist = random(size * 0.05, size * 0.35);
      const speed = random(3, 9);
      b.off.set(cos(ang) * startDist, sin(ang) * startDist);
      b.v.set(cos(ang) * speed, sin(ang) * speed);
      b.s = random(size * 0.18, size * 0.45);
    }
  }

  update() {
    this.life--;
    for (let b of this.blobs) {
      b.off.add(b.v);
      b.v.mult(0.89);
      b.s *= 0.965;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    const progress = 1 - this.life / this.duration;
    const alpha = map(this.life, 0, this.duration, 0, 255);

    push();
    translate(this.pos.x, this.pos.y);

    // Expanding gooey shockwave puddle
    noStroke();
    fill(r, g, b, alpha * 0.35);
    ellipse(0, 0, progress * (this.baseSize * 2.6));

    fill(r, g, b, alpha * 0.6);
    ellipse(0, 0, (1 - progress * 0.7) * (this.baseSize * 1.1));

    // Elongated droplets along trajectory
    fill(r, g, b, alpha);
    for (let bl of this.blobs) {
      const spd = bl.v.mag();
      if (bl.isStreak && spd > 0.8) {
        push();
        translate(bl.off.x, bl.off.y);
        rotate(bl.v.heading());
        ellipse(0, 0, bl.s * (1 + spd * 0.35), bl.s * 0.7);
        pop();
      } else {
        ellipse(bl.off.x, bl.off.y, bl.s);
      }
    }
    pop();
  }
}

// ==========================================
// 3. BugSplatVFX3 (Catastrophic obliteration)
// ==========================================
export class BugSplatVFX3 {
  pos: any;
  blobs: any[] = [];
  life: number = 44;
  duration: number = 44;
  color: any;
  baseSize: number = 45;

  constructor(x: number = 0, y: number = 0, size: number = 45, col: any = [140, 70, 220]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 36; i++) {
      this.blobs.push({
        off: createVector(0, 0),
        v: createVector(0, 0),
        s: 6,
        drag: 0.9,
        rot: 0,
        spin: 0
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 45, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [140, 70, 220];
    this.baseSize = size;
    this.life = 44;
    this.duration = 44;

    for (let i = 0; i < 36; i++) {
      const b = this.blobs[i];
      const ang = random(TWO_PI);
      const isOuter = i < 18;
      const speed = isOuter ? random(6, 14) : random(2, 6);
      b.off.set(cos(ang) * random(2, size * 0.25), sin(ang) * random(2, size * 0.25));
      b.v.set(cos(ang) * speed, sin(ang) * speed);
      b.s = isOuter ? random(size * 0.12, size * 0.28) : random(size * 0.25, size * 0.55);
      b.drag = isOuter ? 0.86 : 0.93;
      b.rot = random(TWO_PI);
      b.spin = random(-0.2, 0.2);
    }
  }

  update() {
    this.life--;
    for (let b of this.blobs) {
      b.off.add(b.v);
      b.v.mult(b.drag);
      b.rot += b.spin;
      b.s *= 0.97;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    const progress = 1 - this.life / this.duration;
    const alpha = map(this.life, 0, this.duration, 0, 255);

    push();
    translate(this.pos.x, this.pos.y);

    // Shockwave ripple ring
    noFill();
    stroke(r, g, b, alpha * 0.5);
    strokeWeight(Math.max(1, (1 - progress) * 4));
    ellipse(0, 0, progress * (this.baseSize * 3.2));

    // Thick center splat
    noStroke();
    fill(r, g, b, alpha * 0.4);
    ellipse(0, 0, (1 - progress * 0.5) * (this.baseSize * 1.5));

    fill(r, g, b, alpha);
    for (let bl of this.blobs) {
      const spd = bl.v.mag();
      if (spd > 1.2) {
        push();
        translate(bl.off.x, bl.off.y);
        rotate(bl.v.heading());
        ellipse(0, 0, bl.s * (1 + spd * 0.4), bl.s * 0.6);
        pop();
      } else {
        ellipse(bl.off.x, bl.off.y, bl.s);
      }
    }
    pop();
  }
}

// ==========================================
// 4. BugSplatTinyVfx (Hit impact splat on damage taken)
// ==========================================
export class BugSplatTinyVfx {
  pos: any;
  blobs: any[] = [];
  life: number = 12;
  duration: number = 12;
  color: any;

  constructor(x: number = 0, y: number = 0, size: number = 12, col: any = [140, 70, 220]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 5; i++) {
      this.blobs.push({
        off: createVector(0, 0),
        v: createVector(0, 0),
        s: 3
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 12, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [140, 70, 220];
    this.life = 12;
    this.duration = 12;

    for (let i = 0; i < 5; i++) {
      const b = this.blobs[i];
      const ang = random(TWO_PI);
      const spd = random(2.0, 5.0);
      b.off.set(0, 0);
      b.v.set(cos(ang) * spd, sin(ang) * spd);
      b.s = random(2, Math.max(3, size * 0.35));
    }
  }

  update() {
    this.life--;
    for (let b of this.blobs) {
      b.off.add(b.v);
      b.v.mult(0.85);
      b.s *= 0.92;
    }
  }

  isDone() {
    return this.life <= 0;
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    const alpha = map(this.life, 0, this.duration, 0, 230);
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(r, g, b, alpha);
    for (let bl of this.blobs) {
      ellipse(bl.off.x, bl.off.y, bl.s);
    }
    pop();
  }
}

// ==========================================
// 5. BugSplatMeatChunkVfx (Physical meat chunks flinging up & landing)
// ==========================================
export interface MeatChunkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  rot: number;
  rotSpeed: number;
  size: number;
  landed: boolean;
  landTimer: number;
  shapeOffsets: number[];
}

export class BugSplatMeatChunkVfx {
  pos: any;
  chunks: MeatChunkParticle[] = [];
  color: any;
  duration: number = 120;
  life: number = 120;
  hasPlayedImpact: boolean = false;

  constructor(x: number = 0, y: number = 0, size: number = 30, col: any = [130, 45, 175]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 5; i++) {
      this.chunks.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        z: 0,
        vz: 0,
        rot: 0,
        rotSpeed: 0,
        size: 12,
        landed: false,
        landTimer: 40,
        shapeOffsets: [1, 0.8, 1.2, 0.9, 1.1]
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 30, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [130, 45, 175];
    this.life = 120;
    this.duration = 120;
    this.hasPlayedImpact = false;

    // Trigger burst sound on spawn
    soundEngine.playSFX('meatchunk_burst', 0.85, 0.08);

    const chunkCount = Math.floor(random(3, 6));
    for (let i = 0; i < 5; i++) {
      const c = this.chunks[i];
      if (i < chunkCount) {
        const ang = random(TWO_PI);
        const speed = random(1.8, 4.5);
        c.x = 0;
        c.y = 0;
        c.vx = cos(ang) * speed;
        c.vy = sin(ang) * speed;
        c.z = random(6, 14);
        c.vz = random(4.2, 7.5);
        c.rot = random(TWO_PI);
        c.rotSpeed = random(-0.16, 0.16);
        c.size = random(size * 0.22, size * 0.42);
        c.landed = false;
        c.landTimer = 40;
        c.shapeOffsets = [
          random(0.7, 1.3),
          random(0.8, 1.2),
          random(0.7, 1.3),
          random(0.8, 1.2),
          random(0.7, 1.3)
        ];
      } else {
        c.landed = true;
        c.landTimer = 0;
      }
    }
  }

  update() {
    this.life--;
    const gravity = 0.36;

    for (let c of this.chunks) {
      if (c.landTimer <= 0) continue;

      if (!c.landed) {
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.97;
        c.vy *= 0.97;

        c.z += c.vz;
        c.vz -= gravity;
        c.rot += c.rotSpeed;

        if (c.z <= 0) {
          c.z = 0;
          c.vz = 0;
          c.vx *= 0.1;
          c.vy *= 0.1;
          c.rotSpeed = 0;
          c.landed = true;

          // Draw small persistent splat where chunk landed
          const [cr, cg, cb] = getRgb(this.color);
          drawPersistentDeathVisual(this.pos.x + c.x, this.pos.y + c.y, Math.max(8, c.size * 0.8), [cr, cg, cb]);

          // Play impact SFX once per burst
          if (!this.hasPlayedImpact) {
            this.hasPlayedImpact = true;
            soundEngine.playSFX('meatchunk_impact', 0.85, 0.08);
          }
        }
      } else {
        c.landTimer--;
      }
    }
  }

  isDone() {
    return this.life <= 0 || this.chunks.every((c) => c.landed && c.landTimer <= 0);
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    push();
    translate(this.pos.x, this.pos.y);

    for (let c of this.chunks) {
      if (c.landTimer <= 0) continue;

      const alpha = c.landed ? map(c.landTimer, 0, 25, 0, 220) : 230;

      // 1. Ground shadow below chunk
      push();
      translate(c.x, c.y);
      noStroke();
      const shadowAlpha = map(c.z, 0, 70, alpha * 0.4, 0);
      const shadowScale = map(c.z, 0, 70, 1.0, 0.4);
      fill(20, 10, 30, Math.max(0, shadowAlpha));
      ellipse(0, 0, c.size * 1.3 * shadowScale, c.size * 0.7 * shadowScale);
      pop();

      // 2. Meat Chunk in the air or on ground
      push();
      translate(c.x, c.y - c.z);
      rotate(c.rot);
      if (c.landed) {
        // Squish slightly on landing
        scale(1.2, 0.7);
      }

      noStroke();
      // Meat chunk main body
      fill(Math.max(0, r - 30), Math.max(0, g - 20), Math.max(0, b - 15), alpha);
      beginShape();
      const numPts = 5;
      for (let p = 0; p < numPts; p++) {
        const ang = (TWO_PI / numPts) * p;
        const rad = (c.size * 0.5) * (c.shapeOffsets[p] || 1);
        vertex(cos(ang) * rad, sin(ang) * rad);
      }
      endShape(CLOSE);

      // Fleshy highlight / gore dot
      fill(Math.min(255, r + 40), Math.min(255, g + 25), Math.min(255, b + 50), alpha * 0.75);
      ellipse(-c.size * 0.15, -c.size * 0.15, c.size * 0.35, c.size * 0.25);
      pop();
    }
    pop();
  }
}

// ==========================================
// 6. BugSplatMeatChunkGiantVfx (Giant heavier meat chunk addon)
// ==========================================
export class BugSplatMeatChunkGiantVfx {
  pos: any;
  chunks: MeatChunkParticle[] = [];
  color: any;
  duration: number = 120;
  life: number = 120;
  impactCount: number = 0;

  constructor(x: number = 0, y: number = 0, size: number = 60, col: any = [110, 30, 160]) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 10; i++) {
      this.chunks.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        z: 0,
        vz: 0,
        rot: 0,
        rotSpeed: 0,
        size: 16,
        landed: false,
        landTimer: 60,
        shapeOffsets: [1, 0.8, 1.2, 0.9, 1.1]
      });
    }
    this.reset(x, y, size, col);
  }

  reset(x: number = 0, y: number = 0, size: number = 60, col?: any) {
    if (this.pos) {
      this.pos.set(x, y);
    } else {
      this.pos = createVector(x, y);
    }
    this.color = col || [110, 30, 160];
    this.life = 120;
    this.duration = 120;
    this.impactCount = 0;

    // Trigger burst sound on spawn
    soundEngine.playSFX('meatchunk_burst', 1.0, 0.05);

    const chunkCount = Math.floor(random(7, 11));
    for (let i = 0; i < 10; i++) {
      const c = this.chunks[i];
      if (i < chunkCount) {
        const ang = random(TWO_PI);
        const speed = random(2.5, 7.5);
        c.x = 0;
        c.y = 0;
        c.vx = cos(ang) * speed;
        c.vy = sin(ang) * speed;
        c.z = random(8, 22);
        c.vz = random(6.0, 11.5);
        c.rot = random(TWO_PI);
        c.rotSpeed = random(-0.2, 0.2);
        c.size = random(size * 0.25, size * 0.48);
        c.landed = false;
        c.landTimer = 60;
        c.shapeOffsets = [
          random(0.65, 1.35),
          random(0.75, 1.25),
          random(0.65, 1.35),
          random(0.75, 1.25),
          random(0.65, 1.35)
        ];
      } else {
        c.landed = true;
        c.landTimer = 0;
      }
    }
  }

  update() {
    this.life--;
    const gravity = 0.36;

    for (let c of this.chunks) {
      if (c.landTimer <= 0) continue;

      if (!c.landed) {
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.97;
        c.vy *= 0.97;

        c.z += c.vz;
        c.vz -= gravity;
        c.rot += c.rotSpeed;

        if (c.z <= 0) {
          c.z = 0;
          c.vz = 0;
          c.vx *= 0.08;
          c.vy *= 0.08;
          c.rotSpeed = 0;
          c.landed = true;

          // Draw substantial persistent splat where giant chunk slammed
          const [cr, cg, cb] = getRgb(this.color);
          drawPersistentDeathVisual(this.pos.x + c.x, this.pos.y + c.y, Math.max(12, c.size * 1.0), [cr, cg, cb]);

          // Staggered meat chunk impacts
          if (this.impactCount < 3) {
            this.impactCount++;
            soundEngine.playSFX('meatchunk_impact', 0.95, 0.08);
          }
        }
      } else {
        c.landTimer--;
      }
    }
  }

  isDone() {
    return this.life <= 0 || this.chunks.every((c) => c.landed && c.landTimer <= 0);
  }

  display() {
    const [r, g, b] = getRgb(this.color);
    push();
    translate(this.pos.x, this.pos.y);

    for (let c of this.chunks) {
      if (c.landTimer <= 0) continue;

      const alpha = c.landed ? map(c.landTimer, 0, 35, 0, 240) : 240;

      // 1. Heavy ground shadow
      push();
      translate(c.x, c.y);
      noStroke();
      const shadowAlpha = map(c.z, 0, 90, alpha * 0.45, 0);
      const shadowScale = map(c.z, 0, 90, 1.1, 0.35);
      fill(15, 5, 25, Math.max(0, shadowAlpha));
      ellipse(0, 0, c.size * 1.4 * shadowScale, c.size * 0.75 * shadowScale);
      pop();

      // 2. Large Meat Chunk
      push();
      translate(c.x, c.y - c.z);
      rotate(c.rot);
      if (c.landed) {
        scale(1.25, 0.65);
      }

      noStroke();
      // Deep meaty silhouette
      fill(Math.max(0, r - 45), Math.max(0, g - 30), Math.max(0, b - 20), alpha);
      beginShape();
      const numPts = 5;
      for (let p = 0; p < numPts; p++) {
        const ang = (TWO_PI / numPts) * p;
        const rad = (c.size * 0.5) * (c.shapeOffsets[p] || 1);
        vertex(cos(ang) * rad, sin(ang) * rad);
      }
      endShape(CLOSE);

      // Sinew / bone accent
      fill(Math.min(255, r + 60), Math.min(255, g + 40), Math.min(255, b + 70), alpha * 0.85);
      ellipse(-c.size * 0.12, -c.size * 0.12, c.size * 0.4, c.size * 0.28);
      pop();
    }
    pop();
  }
}

// ==========================================
// Object Pools & Spawn Helper Functions
// ==========================================
export const bugSplatPool = new ObjectPool<BugSplatVFX>(
  'BugSplat',
  () => new BugSplatVFX(),
  undefined,
  500
);

export const bugSplat2Pool = new ObjectPool<BugSplatVFX2>(
  'BugSplat2',
  () => new BugSplatVFX2(),
  undefined,
  400
);

export const bugSplat3Pool = new ObjectPool<BugSplatVFX3>(
  'BugSplat3',
  () => new BugSplatVFX3(),
  undefined,
  300
);

export const bugSplatTinyPool = new ObjectPool<BugSplatTinyVfx>(
  'BugSplatTiny',
  () => new BugSplatTinyVfx(),
  undefined,
  600
);

export const bugSplatMeatChunkPool = new ObjectPool<BugSplatMeatChunkVfx>(
  'BugSplatMeatChunk',
  () => new BugSplatMeatChunkVfx(),
  undefined,
  200
);

export const bugSplatMeatChunkGiantPool = new ObjectPool<BugSplatMeatChunkGiantVfx>(
  'BugSplatMeatChunkGiant',
  () => new BugSplatMeatChunkGiantVfx(),
  undefined,
  100
);

export function spawnBugSplatVFX(x: number, y: number, size: number = 30, col?: any): BugSplatVFX {
  const vfx = bugSplatPool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

export function spawnBugSplatVFX2(x: number, y: number, size: number = 35, col?: any): BugSplatVFX2 {
  const vfx = bugSplat2Pool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

export function spawnBugSplatVFX3(x: number, y: number, size: number = 45, col?: any): BugSplatVFX3 {
  const vfx = bugSplat3Pool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

export function spawnBugSplatTinyVFX(x: number, y: number, size: number = 12, col?: any): BugSplatTinyVfx {
  const vfx = bugSplatTinyPool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

export function spawnBugSplatMeatChunkVFX(
  x: number,
  y: number,
  size: number = 30,
  col?: any,
  isGiant: boolean = false
): BugSplatMeatChunkVfx | BugSplatMeatChunkGiantVfx {
  if (isGiant) {
    const vfx = bugSplatMeatChunkGiantPool.get();
    vfx.reset(x, y, size, col);
    return vfx;
  }
  const vfx = bugSplatMeatChunkPool.get();
  vfx.reset(x, y, size, col);
  return vfx;
}

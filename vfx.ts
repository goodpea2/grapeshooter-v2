
import { state } from './state';

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

export class MagicLinkVFX {
    p1: any; p2: any; life: number = 20; maxLife: number = 20;
    segments: any[] = [];
    seed: number;

    constructor(p1: any, p2: any) {
        this.p1 = p1.copy();
        this.p2 = p2.copy();
        this.seed = random(1000);
        this.generateLightning();
    }

    generateLightning() {
        this.segments = [];
        let count = 5; // Fewer segments for cleaner look
        let prev = this.p1.copy();
        let dir = p5.Vector.sub(this.p2, this.p1);
        let dist = dir.mag();
        dir.normalize();
        let perp = createVector(-dir.y, dir.x);

        for (let i = 1; i <= count; i++) {
            let t = i / count;
            let target = p5.Vector.lerp(this.p1, this.p2, t);
            if (i < count) {
                // Subtle jitter
                let jitter = (random() - 0.5) * (dist * 0.2);
                target.add(p5.Vector.mult(perp, jitter));
            }
            this.segments.push({ a: prev.copy(), b: target.copy() });
            prev = target;
        }
    }

    update() { 
        this.life--; 
        // Much slower flicker/regeneration for stability
        if (this.life % 10 === 0) this.generateLightning();
    }
    
    isDone() { return this.life <= 0; }
    
    display() {
        let alpha = map(this.life, 0, this.maxLife, 0, 200);
        let pulse = 0.8 + 0.2 * sin(frameCount * 0.3 + this.seed);
        
        // Outer Subtle Glow
        stroke(120, 220, 255, alpha * 0.2 * pulse);
        strokeWeight(4);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);
        
        // Inner Glow
        stroke(180, 240, 255, alpha * 0.4);
        strokeWeight(3);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);

        // Brilliant White Core
        stroke(255, 255, 255, alpha);
        strokeWeight(2);
        for (let s of this.segments) line(s.a.x, s.a.y, s.b.x, s.b.y);

        // Directional Energy Flow (Tiny beads)
        noStroke();
        fill(255, alpha);
        let flowT = (frameCount * 0.05 + this.seed) % 1;
        let flowPos = p5.Vector.lerp(this.p1, this.p2, flowT);
        ellipse(flowPos.x, flowPos.y, 4);
    }
}

export class FirstStrikeVFX {
  target: any; life: number = 90;
  constructor(target: any) { this.target = target; }
  update() { this.life--; }
  isDone() { return this.life <= 0 || !this.target || this.target.health <= 0; }
  display() {
    const p = this.target.getWorldPos();
    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.2 * sin(frameCount * 0.4);
    const alpha = map(this.life, 0, 90, 0, 180);
    noFill();
    stroke(255, 255, 100, alpha);
    strokeWeight(2);
    ellipse(0, 0, 60 * pulse);
    stroke(255, 200, 50, alpha * 0.5);
    ellipse(0, 0, 80 * pulse);
    
    // Rising sparks
    for(let i=0; i<3; i++) {
      const off = (frameCount * 2 + i * 30) % 60;
      const x = sin(frameCount * 0.1 + i) * 20;
      fill(255, 255, 150, alpha * (1 - off/60));
      noStroke();
      ellipse(x, -20 - off, 4);
    }
    pop();
  }
}

export class FrostFieldAuraVFX {
  target: any; radius: number;
  flakes: {x: number, y: number, s: number, v: number, phase: number}[] = [];
  constructor(target: any, radius: number) {
    this.target = target;
    this.radius = radius;
    for(let i=0; i<20; i++) {
      this.flakes.push({
        x: random(-radius, radius),
        y: random(-radius, radius),
        s: random(2, 4),
        v: random(0.15, 0.5),
        phase: random(TWO_PI)
      });
    }
  }
  update() {
    for(let f of this.flakes) {
      f.y += f.v;
      f.x += sin(frameCount * 0.05 + f.phase) * 0.5;
      if (f.y > this.radius) f.y = -this.radius;
      if (f.x > this.radius) f.x = -this.radius;
      if (f.x < -this.radius) f.x = this.radius;
    }
  }
  isDone() { return !this.target || this.target.health <= 0; }
  display() {
    const p = this.target.getWorldPos();
    const activity = this.target.specialActivityLevel || 0;
    if (activity <= 0.01) return;

    push(); translate(p.x, p.y);
    const pulse = 1.0 + 0.05 * sin(frameCount * 0.02);
    const currentRadius = this.radius * activity;
    const currentAlpha = 255 * activity;
    
    // Subtle glow floor
    noStroke();
    fill(150, 220, 255, 30 * activity);
    ellipse(0, 0, currentRadius * 2 * pulse);
    
    // Snowflake particles
    fill(255, 200 * activity);
    for(let f of this.flakes) {
      // Circle masking for the flakes
      const dSq = f.x*f.x + f.y*f.y;
      if (dSq < currentRadius * currentRadius) {
        ellipse(f.x, f.y, f.s);
      }
    }
    pop();
  }
}

export class WeldingHitVFX {
    pos: any; life: number = 6; maxLife: number = 30;
    col: any;
    wisps: any[] = [];
    sparks: any[] = [];

    constructor(x: number, y: number, col: any = [255, 255, 100]) {
        this.pos = createVector(x, y);
        this.col = col;
        // Start with a small burst
        this.addSpark();
    }

    addWisp() {
        this.wisps.push({
            p: createVector(this.pos.x + random(-2, 2), this.pos.y + random(-2, 2)),
            v: createVector(random(-0.3, 0.3), random(-0.5, -1.2)),
            s: random(6, 12),
            l: 12,
            ml: 12
        });
    }

    addSpark() {
        this.sparks.push({
            p: createVector(this.pos.x, this.pos.y),
            v: p5.Vector.random2D().mult(random(2, 5)),
            l: 8,
            ml: 8
        });
    }

    update() {
        this.life--;
        if (this.life > 5) {
            if (frameCount % 6 === 0) this.addWisp();
            if (frameCount % 4 === 0) this.addSpark();
        }

        for (let i = this.wisps.length - 1; i >= 0; i--) {
            let w = this.wisps[i];
            w.p.add(w.v);
            w.l--;
            w.s *= 1.05;
            if (w.l <= 0) this.wisps.splice(i, 1);
        }

        for (let i = this.sparks.length - 1; i >= 0; i--) {
            let s = this.sparks[i];
            s.p.add(s.v);
            s.l--;
            if (s.l <= 0) this.sparks.splice(i, 1);
        }
    }

    isDone() { return this.life <= 0 && this.wisps.length === 0 && this.sparks.length === 0; }

    display() {
        // Bright focal point
        if (this.life > 0) {
            push();
            translate(this.pos.x, this.pos.y);
            let s = 6 + sin(frameCount * 0.8) * 2;
            
            noStroke();
            // Colored Halo
            fill(this.col[0], this.col[1], this.col[2], 80);
            ellipse(0, 0, s * 2.5);
            // Hot Core
            fill(255, 255, 255, 220);
            ellipse(0, 0, s);
            pop();
        }

        // Micro Smoke Wisps
        noStroke();
        for (let w of this.wisps) {
            let a = map(w.l, 0, w.ml, 0, 120);
            // Tint smoke slightly with laser color
            fill(this.col[0], this.col[1], this.col[2], a);
            ellipse(w.p.x, w.p.y, w.s);
        }

        // Micro Sparks
        strokeWeight(3);
        for (let s of this.sparks) {
            let a = map(s.l, 0, s.ml, 0, 200);
            stroke(255, 255, 200, a);
            line(s.p.x, s.p.y, s.p.x - s.v.x * 0.3, s.p.y - s.v.y * 0.3);
        }
    }
}

export class ShopFlyVFX {
  pos: any; 
  target: any; 
  life: number; 
  maxLife: number; 
  assetKey: string;
  startPos: any;

  constructor(sx: number, sy: number, tx: number, ty: number, assetKey: string) {
    this.pos = createVector(sx, sy);
    this.startPos = createVector(sx, sy);
    this.target = createVector(tx, ty);
    this.life = 40;
    this.maxLife = 40;
    this.assetKey = assetKey;
  }

  update() {
    this.life--;
    let t = 1 - (this.life / this.maxLife);
    // Exponential ease in for a "snappy" landing
    let easedT = pow(t, 2);
    this.pos.x = lerp(this.startPos.x, this.target.x, easedT);
    this.pos.y = lerp(this.startPos.y, this.target.y, easedT);
  }

  isDone() { return this.life <= 0; }

  display() {
    let t = 1 - (this.life / this.maxLife);
    let size = map(sin(t * Math.PI), 0, 1, 60, 90);
    let alpha = map(this.life, 0, 10, 0, 255);
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(t * TWO_PI);
    
    const sprite = state.assets[this.assetKey];
    if (sprite) {
      imageMode(CENTER);
      tint(255, alpha);
      image(sprite, 0, 0, size, size);
      noTint();
    } else {
      fill(255, 255, 100, alpha);
      noStroke();
      ellipse(0, 0, 20);
    }
    pop();
  }
}

export class LiquidTrailVFX {
  pos: any; type: string; life: number; maxLife: number; angle: number;
  constructor(x: number, y: number, type: string, angle: number = 0) {
    this.pos = createVector(x, y); 
    this.type = type; 
    this.angle = angle;
    this.maxLife = type === 'water_trail' ? 30 : type === 'tar_trail' ? 120 : 60;
    this.life = this.maxLife;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let progress = 1 - (this.life / this.maxLife);
    let alpha = map(this.life, 0, this.maxLife, 0, 180);
    push(); translate(this.pos.x, this.pos.y);
    noStroke();
    
    if (this.type === 'water_trail') {
      noFill();
      stroke(50, 120, 255, alpha);
      strokeWeight(4);
      ellipse(0, 0, progress * 20 + 20, progress * 20 + 20);
    } else if (this.type === 'ice_trail') {
      rotate(random(TWO_PI));
      fill(220, 245, 255, alpha);
      let s = (1 - progress) * 20;
      beginShape();
      for(let i=0; i<3; i++) {
        let r = i % 2 === 0 ? s : s * 0.4;
        vertex(cos(i * TWO_PI/3) * r, sin(i * TWO_PI/3) * r);
      }
      endShape(CLOSE);
    } else if (this.type === 'tar_trail') {
        fill(40, 20, 60, alpha * 0.8);
        ellipse(random(-2, 2), random(-2, 2), progress * 50);
    } else if (this.type === 'lava_trail') {
      fill(255, 60, 0, alpha * 0.3);
      ellipse(0, 0, progress * 30);
      fill(255, 200, 0, alpha);
      ellipse(random(-2, 2), -progress * 20, 3);
    }
    pop();
  }
}

export class ConditionVFX {
  target: any; type: string; 
  constructor(target: any, type: string) { this.target = target; this.type = type; }
  update() {}
  isDone() { return !this.target || this.target.health <= 0 || !this.target.conditions.has(this.type); }
  display() {
    const p = this.target.pos || (this.target.getWorldPos ? this.target.getWorldPos() : null);
    if (!p) return;
    push(); translate(p.x, p.y);
    
    if (this.type === 'c_burning') {
      let r = this.target.size / 2 || 15;
      for(let i=0; i<3; i++) {
        let h = (frameCount * 0.5 + i * 10) % 20;
        let xOff = sin(frameCount * 0.1 + i) * 5;
        let s = map(h, 0, 20, 8, 2);
        fill(255, 120 - h * 5, 0, 180 - h * 8); noStroke();
        ellipse(random(-r * 0.5, r * 0.5) + xOff, -h - 5, s);
      }
    } else if (this.type === 'c_chilled') {
      let r = (this.target.size / 2 || 15) + 4;
      noFill(); 
      let pulse = sin(frameCount * 0.04) * 2;
      stroke(150, 220, 255, 120); strokeWeight(1.5);
      ellipse(0, 0, r * 2 + pulse);
      stroke(255, 255, 255, 60);
      ellipse(0, 0, (r * 2 + pulse) * 1.1);
    } else if (this.type === 'c_stun') {
      let r = (this.target.size / 2 || 15) + 6;
      // Stars swirling above head
      noFill();
      stroke(255, 255, 100, 220); strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        let ang = (frameCount * 0.15) + (i * TWO_PI / 3);
        let sx = cos(ang) * (r * 0.8);
        let sy = sin(ang) * (r * 0.4) - r - 10;
        push(); translate(sx, sy); rotate(frameCount * 0.2);
        line(-3, 0, 3, 0); line(0, -3, 0, 3);
        pop();
      }
    } else if (this.type === 'c_raged') {
        let r = (this.target.size / 2 || 15) + 8;
        noFill();
        stroke(255, 100, 200, 180); strokeWeight(3);
        ellipse(0, 0, r * 2 + sin(frameCount * 0.1) * 4);
    }
    pop();
  }
}

export class MuzzleFlash {
  pos: any; angle: number; size: number; duration: number; life: number; color: any;
  constructor(x: number, y: number, angle: number, size = random(18, 28), duration = 6, col = color(255, 255, 200)) {
    this.pos = createVector(x, y); this.angle = angle; this.size = size; this.duration = duration; this.life = this.duration; this.color = col;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    if (!this.pos || isNaN(this.pos.x)) return;
    push(); translate(this.pos.x, this.pos.y); rotate(this.angle);
    let currentSize = this.size * (this.life / this.duration);
    let alpha = map(this.life, 0, this.duration, 0, 255);
    
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), alpha * 0.5);
    beginShape();
    for (let i = 0; i < 8; i++) {
      let radius = (i % 2 === 0) ? currentSize * 0.4 : currentSize;
      let a = TWO_PI / 8 * i; vertex(cos(a) * radius, sin(a) * radius);
    }
    endShape(CLOSE);
    
    fill(255, alpha);
    ellipse(0, 0, currentSize * 0.6, currentSize * 0.3);
    pop();
  }
}

export class BugSplatVFX {
  pos: any; blobs: any[] = []; life: number = 30; duration: number = 30; color: any;
  constructor(x: number, y: number, size: number, col: any) {
    this.pos = createVector(x, y);
    this.color = col;
    for(let i=0; i<15; i++){
      this.blobs.push({
        off: p5.Vector.random2D().mult(random(size * 0.1, size * 0.5)),
        v: p5.Vector.random2D().mult(random(2, 6)),
        s: random(size * 0.2, size * 0.5)
      });
    }
  }
  update() { this.life--; for(let b of this.blobs) { b.off.add(b.v); b.v.mult(0.9); b.s *= 0.96; } }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 255);
    push(); translate(this.pos.x, this.pos.y);
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    for(let b of this.blobs) { ellipse(b.off.x, b.off.y, b.s); }
    fill(red(this.color), green(this.color), blue(this.color), alpha * 0.5);
    ellipse(0, 0, (1 - this.life/this.duration) * 80);
    pop();
  }
}

export class GiantDeathVFX {
  pos: any; life: number = 90; duration: number = 90; color: any; size: number;
  constructor(x: number, y: number, size: number, col: any) {
    this.pos = createVector(x, y);
    this.color = col;
    this.size = size;
  }
  update() {
    this.life--;
    if (this.life > 20 && frameCount % 3 === 0) {
      this.pos.add(random(-4, 4), random(-4, 4));
      state.vfx.push(new BugSplatVFX(this.pos.x + random(-30, 30), this.pos.y + random(-30, 30), 20, this.color));
    }
    if (this.life === 20) {
      state.vfx.push(new Explosion(this.pos.x, this.pos.y, this.size * 2.5, color(this.color)));
      drawPersistentDeathVisual(this.pos.x, this.pos.y, this.size * 1.5, [red(this.color), green(this.color), blue(this.color)]);
    }
  }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 20, this.duration, 255, 0);
    if (this.life <= 20) return;
    push(); translate(this.pos.x, this.pos.y);
    rotate(random(-0.1, 0.1));
    fill(red(this.color), green(this.color), blue(this.color), alpha);
    ellipse(0, 0, this.size * (1 + sin(this.life * 0.5) * 0.1));
    pop();
  }
}

export class HitSpark {
  pos: any; particles: any[] = []; life: number;
  constructor(x: number, y: number, baseColor: any) {
    this.pos = createVector(x, y);
    let numParticles = floor(random(4, 8));
    for (let i = 0; i < numParticles; i++) {
      this.particles.push({ 
        p: this.pos.copy(), 
        v: p5.Vector.random2D().mult(random(2, 6)), 
        life: random(10, 20), 
        maxLife: 20, 
        size: random(3, 5), 
        c: lerpColor(color(baseColor), color(255), random(0.6, 1.0)) 
      });
    }
    this.life = 20;
  }
  update() { this.life--; for (let p of this.particles) { p.p.add(p.v); p.v.mult(0.88); p.life--; } }
  isDone() { return this.life <= 0; }
  display() {
    noStroke();
    for (let p of this.particles) {
      if (p.life > 0) {
        let alpha = map(p.life, 0, p.maxLife, 0, 255);
        fill(red(p.c), green(p.c), blue(p.c), alpha);
        ellipse(p.p.x, p.p.y, p.size);
      }
    }
  }
}

export class SparkVFX {
  pos: any; particles: any[] = []; life: number = 30;
  constructor(x: number, y: number, count: number, col: any) {
    this.pos = createVector(x, y);
    for(let i=0; i<count; i++){
      this.particles.push({
        p: createVector(x, y),
        v: p5.Vector.random2D().mult(random(3, 10)),
        c: col,
        s: random(2, 4)
      });
    }
  }
  update() { this.life--; for(let p of this.particles) { p.p.add(p.v); p.v.mult(0.92); } }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, 30, 0, 255);
    for(let p of this.particles) {
      stroke(red(p.c), green(p.c), blue(p.c), alpha);
      strokeWeight(p.s);
      line(p.p.x, p.p.y, p.p.x - p.v.x, p.p.y - p.v.y);
    }
  }
}

export class BlockDebris {
  pos: any; particles: any[] = []; life: number = 40;
  constructor(x: number, y: number, col: any) {
    this.pos = createVector(x, y);
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        p: createVector(x, y),
        v: p5.Vector.random2D().mult(random(3, 8)),
        rot: random(TWO_PI),
        rotV: random(-0.3, 0.3),
        size: random(5, 12),
        col: col
      });
    }
  }
  update() {
    this.life--;
    for (let p of this.particles) {
      p.p.add(p.v);
      p.v.mult(0.94);
      p.v.y += 0.15;
      p.rot += p.rotV;
    }
  }
  isDone() { return this.life <= 0; }
  display() {
    noStroke();
    let alpha = map(this.life, 0, 40, 0, 255);
    for (let p of this.particles) {
      push(); translate(p.p.x, p.p.y); rotate(p.rot);
      fill(p.col[0], p.col[1], p.col[2], alpha);
      rect(-p.size/2, -p.size/2, p.size, p.size, 2);
      fill(255, alpha * 0.4);
      rect(-p.size/2, -p.size/2, p.size/2, p.size/2, 2);
      pop();
    }
  }
}

export class Explosion {
  pos: any; size: number; duration: number; life: number; color1: any; color2: any;
  constructor(x: number, y: number, baseSize: number, colorA = color(255, 200, 50), colorB = color(255, 50, 0)) {
    this.pos = createVector(x, y); this.size = baseSize; this.duration = 18; this.life = this.duration; this.color1 = colorA; this.color2 = colorB;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    if (!this.pos || isNaN(this.pos.x)) return;
    let progress = 1 - (this.life / this.duration);
    let currentSize = this.size * pow(progress, 0.1);
    let alpha = map(this.life, 0, this.duration, 0, 180);
    
    push();
    translate(this.pos.x, this.pos.y);
    noFill();
    strokeWeight(max(1, 6 * (1 - progress)));
    stroke(red(this.color1), green(this.color1), blue(this.color1), alpha);
    ellipse(0, 0, currentSize);
    
    noStroke();
    fill(red(this.color1), green(this.color1), blue(this.color1), alpha * 0.2);
    ellipse(0, 0, currentSize);
    pop();
  }
}

export class FirePuddleVFX {
  pos: any; radius: number; life: number; duration: number;
  embers: any[] = [];
  sparks: any[] = [];

  constructor(x: number, y: number, radius: number, duration: number = 60) {
    this.pos = createVector(x, y); 
    this.radius = radius;
    this.life = duration; 
    this.duration = duration;
    for(let i=0; i<6; i++) {
        this.embers.push({ 
            p: createVector(random(-radius, radius), random(-radius, radius)), 
            v: random(0.8, 1.5), 
            s: random(3, 5),
            off: random(TWO_PI)
        });
    }
  }

  update() { 
    this.life--; 
    for(let e of this.embers) {
        e.p.y -= e.v; 
        if (e.p.y < -this.radius) e.p.y = this.radius;
    }

    // Persistant spark spawning loop
    if (this.life > 15 && random() < 0.25) {
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
        if (this.sparks[i].l <= 0) this.sparks.splice(i, 1);
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
    
    let pulse = 1.0 + 0.1 * sin(frameCount * 0.3);
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
      let drift = sin(frameCount * 0.1 + e.off) * 3;
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

export class StunGasVFX {
  pos: any; radius: number; life: number; duration: number;
  clouds: any[] = [];
  constructor(x: number, y: number, radius: number, duration: number) {
    this.pos = createVector(x, y); this.radius = radius; this.life = duration; this.duration = duration;
    for(let i=0; i<16; i++) {
        this.clouds.push({ 
            off: p5.Vector.random2D().mult(random(radius * 0.7)), 
            s: random(radius * 0.5, radius * 1.0), 
            phase: random(TWO_PI),
            rotV: random(-0.02, 0.02),
            distMult: random(0.8, 1.2)
        });
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
      let drift = sin(frameCount * 0.03 + c.phase) * 8;
      let swirlX = cos(frameCount * c.rotV) * c.off.x * expand;
      let swirlY = sin(frameCount * c.rotV) * c.off.y * expand;
      
      fill(160, 160, 255, alpha * 0.7);
      ellipse(swirlX + drift, swirlY + drift, c.s * expand);
      fill(200, 220, 255, alpha * 0.3);
      ellipse(swirlX + drift * 0.5, swirlY + drift * 0.5, c.s * 0.6 * expand);
    }
    pop();
  }
}

export class ForcefieldVFX {
  pos: any; radius: number; life: number; duration: number;
  constructor(x: number, y: number, radius: number, duration: number) {
    this.pos = createVector(x, y); this.radius = radius; this.life = duration; this.duration = duration;
  }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let alpha = map(this.life, 0, this.duration, 0, 100);
    if (this.life < 30) alpha = map(this.life, 0, 30, 0, 100);
    let pulse = 1.0 + 0.02 * sin(frameCount * 0.01);
    
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

export class MergeVFX {
  pos: any; life: number = 30; duration: number = 30;
  constructor(x: number, y: number) { this.pos = createVector(x, y); }
  update() { this.life--; }
  isDone() { return this.life <= 0; }
  display() {
    let progress = 1 - (this.life / this.duration);
    push(); translate(this.pos.x, this.pos.y);
    noFill(); 
    stroke(100, 255, 255, (1-progress) * 255);
    strokeWeight(6 * (1-progress));
    ellipse(0,0, progress * 120);
    stroke(255, 255, 255, (1-progress) * 200);
    strokeWeight(2);
    ellipse(0,0, progress * 160);
    pop();
  }
}

export function drawPersistentDeathVisual(x: number, y: number, size: number, col: any) {
  if (!state.deathVisualsBuffer || isNaN(x) || isNaN(y)) return;
  const db = state.deathVisualsBuffer;
  db.push();
  db.translate(x + 4000, y + 4000); 
  db.noStroke();
  let splatColor = color(
    lerp(40, col[0], 0.3),
    lerp(10, col[1], 0.3),
    lerp(20, col[2], 0.3),
    180
  );
  db.fill(splatColor);
  for (let i = 0; i < 8; i++) {
    let offX = random(-size * 0.7, size * 0.7);
    let offY = random(-size * 0.7, size * 0.7);
    let s = random(size * 0.2, size * 0.5);
    db.ellipse(offX, offY, s, s * random(0.8, 1.4));
  }
  db.pop();
}

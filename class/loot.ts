
import { state } from '../state';
import { ECONOMY_CONFIG } from '../economy';
import { turretTypes } from '../balanceTurrets';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const sin: any;
declare const frameCount: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const map: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rectMode: any;
declare const CENTER: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const random: any;
// Fixed: Added missing p5.js rect declaration
declare const rect: any;

export class SunLoot {
  pos: any; vel: any; value: number; life: number; spawnFrame: number;
  constructor(x: number, y: number, value: number) {
    this.pos = createVector(x, y); this.vel = p5.Vector.random2D().mult(random(0.5, 1.2)); this.value = value; this.life = ECONOMY_CONFIG.sunLootLifetime;
    this.spawnFrame = state.frames;
  }
  update(playerPos: any): 'none' | 'collected' | 'missed' {
    let d = dist(this.pos.x, this.pos.y, playerPos.x, playerPos.y);
    const canBeAttracted = (state.frames - this.spawnFrame > 60);
    if (canBeAttracted && d < ECONOMY_CONFIG.sunLootAttractionRange) {
      this.vel.add(p5.Vector.sub(playerPos, this.pos).normalize().mult(0.8));
      this.vel.limit(8);
    }
    this.pos.add(this.vel); this.vel.mult(0.94); this.life--;
    if (d < ECONOMY_CONFIG.sunLootCollectionRange) return 'collected';
    if (this.life <= 0) return 'missed';
    return 'none';
  }
  display() {
    push(); translate(this.pos.x, this.pos.y);
    const pulse = 1.0 + 0.2 * sin(frameCount * 0.15);
    noStroke();
    fill(255, 255, 150, map(this.life, 0, 100, 0, 150)); ellipse(0, 0, 16 * pulse);
    fill(255, 230, 50, map(this.life, 0, 100, 0, 255)); ellipse(0, 0, 10);
    fill(255, 255, 255, map(this.life, 0, 100, 0, 200)); ellipse(0, 0, 4);
    pop();
  }
}

export class TurretLoot extends SunLoot {
  turretType: string;
  constructor(x: number, y: number, turretType: string) {
    super(x, y, 0);
    this.turretType = turretType;
  }
  display() {
    push(); translate(this.pos.x, this.pos.y);
    const pulse = 1.0 + 0.2 * sin(frameCount * 0.1);
    const cfg = turretTypes[this.turretType];
    stroke(255, 200); strokeWeight(1);
    fill(cfg.color[0], cfg.color[1], cfg.color[2], 180);
    rectMode(CENTER);
    rect(0, 0, 22 * pulse, 22 * pulse, 4);
    fill(255); noStroke(); textAlign(CENTER, CENTER); textSize(8);
    text(cfg.name[0], 0, 0);
    pop();
  }
}

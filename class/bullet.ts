
import { state } from '../state';
// Fixed: Removed TWO_PI from constants import as it is a p5 constant, not a world constant
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { bulletTypes } from '../balanceBullets';
import { Explosion, MuzzleFlash } from '../vfx';
import { GroundFeature } from './groundFeature';
import { drawBullet } from '../visualBullets';

declare const createVector: any;
declare const dist: any;
declare const floor: any;
declare const color: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
// Fixed: Declared TWO_PI as a p5.js global constant
declare const TWO_PI: any;

export class Bullet {
  pos: any; prevPos: any; vel: any; col: any; dmg: number; targetType: string; life: number; config: any; typeKey: string;
  damageTargets: string[] = [];
  targetPos: any | null = null;

  constructor(x: number, y: number, tx: number, ty: number, typeKey: string, targetType: string) {
    this.typeKey = typeKey; this.config = bulletTypes[typeKey] || bulletTypes.b_player;
    this.damageTargets = this.config.damageTargets || [];
    this.pos = createVector(x, y); this.prevPos = this.pos.copy();
    let dx = tx - x; let dy = ty - y; let mag = Math.sqrt(dx * dx + dy * dy);
    this.vel = mag < 0.1 ? createVector(0,0) : createVector(dx / mag * this.config.bulletSpeed, dy / mag * this.config.bulletSpeed);
    this.col = this.config.bulletColor; this.dmg = this.config.bulletDamage; this.targetType = targetType; this.life = this.config.bulletLifeTime;
  }
  update() {
    this.prevPos.set(this.pos); this.pos.add(this.vel); this.life--;
    
    if (this.targetPos) {
       let d = dist(this.pos.x, this.pos.y, this.targetPos.x, this.targetPos.y);
       if (d < this.vel.mag() + 2) {
          this.pos.set(this.targetPos);
          this.vel.mult(0);
          this.targetPos = null;
          if (this.config.aoeConfig?.isAoe && this.config.aoeConfig.dealAoeAtTarget) this.explode();
          if (this.config.stopAtTarget) { this.life = this.config.bulletLifeTime; }
       }
    }

    if (this.config.spawnGroundFeaturePerFrame > 0 && state.frames % this.config.spawnGroundFeaturePerFrame === 0) this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    
    if (this.damageTargets.includes('icecube')) {
      for (let a of state.player.attachments) {
        if (a.isFrosted && dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y) < a.size / 2 + 6) {
           a.takeDamage(this.dmg);
           if (this.config.aoeConfig?.isAoe) this.explode();
           this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
           this.life = 0; return;
        }
      }
    }

    if (this.damageTargets.includes('obstacle')) {
      let gx = floor(this.pos.x / GRID_SIZE); let gy = floor(this.pos.y / GRID_SIZE);
      let chunk = state.world.getChunk(floor(gx/CHUNK_SIZE), floor(gy/CHUNK_SIZE));
      let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
      if (block) {
        block.takeDamage(this.dmg * (this.config.obstacleDamageMultiplier || 1));
        if (this.config.aoeConfig?.isAoe && this.config.aoeConfig.dealAoeOnObstacle) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    } else {
        if (state.world.isBlockAt(this.pos.x, this.pos.y)) {
           this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
           this.life = 0; return;
        }
    }

    if (this.damageTargets.includes('enemy')) {
      for (let e of state.enemies) if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < e.size/2) {
        this.applyBulletConditions(e);
        e.takeDamage(this.dmg); if (this.config.aoeConfig?.isAoe) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    }

    if (this.damageTargets.includes('turret')) {
      for (let a of state.player.attachments) if (dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y) < a.size/2 + 4) {
        a.takeDamage(this.dmg); if (this.config.aoeConfig?.isAoe) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    }

    if (this.damageTargets.includes('player')) {
      if (dist(this.pos.x, this.pos.y, state.player.pos.x, state.player.pos.y) < state.player.size/2) {
        state.player.takeDamage(this.dmg); if (this.config.aoeConfig?.isAoe) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    }

    if (this.life <= 0 && this.config.aoeConfig?.isAoe && this.config.aoeConfig.dealAoeAfterLifetime) { this.explode(); this.spawnFeatures(this.config.spawnGroundFeatureOnContact); }
  }
  applyBulletConditions(target: any) {
    if (!target.applyCondition) return;
    if (this.config.appliedConditions) {
      for (const cond of this.config.appliedConditions) {
        target.applyCondition(cond.type, cond.duration);
      }
    }
    if (this.config.stunDuration > 0) target.applyCondition('c_stun', this.config.stunDuration);
    if (this.config.slowDuration > 0) target.applyCondition('c_chilled', this.config.slowDuration);
  }
  spawnFeatures(keys: string[]) {
    if (!keys || keys.length === 0) return;
    for (const gfKey of keys) {
      let sx = this.pos.x; let sy = this.pos.y;
      if (this.config.spawnGroundFeatureInRadius > 0) { let ang = random(TWO_PI); let r = random(this.config.spawnGroundFeatureInRadius); sx += cos(ang)*r; sy += sin(ang)*r; }
      state.groundFeatures.push(new GroundFeature(sx, sy, gfKey));
    }
  }
  explode() {
    const aoe = this.config.aoeConfig; if (!aoe) return;
    const maxR = aoe.aoeRadiusGradient[aoe.aoeRadiusGradient.length - 1] || 10;
    state.vfx.push(new Explosion(this.pos.x, this.pos.y, maxR*2, color(this.col)));
    
    if (this.damageTargets.includes('enemy')) {
      for (let e of state.enemies) {
        let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
        for (let i = 0; i < aoe.aoeRadiusGradient.length; i++) if (d <= aoe.aoeRadiusGradient[i]) {
          this.applyBulletConditions(e);
          e.takeDamage(aoe.aoeDamageGradient[i]); break;
        }
      }
    }

    if (this.damageTargets.includes('player')) {
      let pDist = dist(this.pos.x, this.pos.y, state.player.pos.x, state.player.pos.y);
      if (pDist <= maxR) state.player.takeDamage(aoe.aoeDamageGradient[0]);
    }

    if (this.damageTargets.includes('turret')) {
      for (let a of state.player.attachments) {
        if (dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y) <= maxR) a.takeDamage(aoe.aoeDamageGradient[0]);
      }
    }

    if (this.damageTargets.includes('icecube')) {
       for (let a of state.player.attachments) {
        if (a.isFrosted && dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y) <= maxR) a.takeDamage(aoe.aoeDamageGradient[0]);
      }
    }
    
    if (this.damageTargets.includes('obstacle')) {
      let gxStart = floor((this.pos.x - maxR)/GRID_SIZE); let gxEnd = floor((this.pos.x + maxR)/GRID_SIZE);
      let gyStart = floor((this.pos.y - maxR)/GRID_SIZE); let gyEnd = floor((this.pos.y + maxR)/GRID_SIZE);
      for(let gx=gxStart; gx<=gxEnd; gx++) for(let gy=gyStart; gy<=gyEnd; gy++) {
        let cx=floor(gx/CHUNK_SIZE); let cy=floor(gy/CHUNK_SIZE);
        let chunk = state.world.getChunk(cx, cy);
        let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
        if (block) { let d = dist(this.pos.x, this.pos.y, block.pos.x + GRID_SIZE/2, block.pos.y + GRID_SIZE/2); if (d <= maxR) block.takeDamage(aoe.aoeDamageGradient[0] * (aoe.aoeObstacleDamageMultiplier || 1)); }
      }
    }
  }
  display() {
    drawBullet(this);
  }
}

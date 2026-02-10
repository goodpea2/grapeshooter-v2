
import { state } from './state';
import { GRID_SIZE, HEX_DIST, VISIBILITY_RADIUS, CHUNK_SIZE, HOUR_FRAMES } from './constants';
import { bulletTypes } from './balanceBullets';
import { turretTypes } from './balanceTurrets';
import { enemyTypes } from './balanceEnemies';
import { groundFeatureTypes } from './balanceGroundFeatures';
import { liquidTypes } from './balanceLiquids';
import { conditionTypes } from './balanceConditions';
import { overlayTypes } from './balanceObstacles';
import { TURRET_RECIPES } from './dictionaryTurretMerging';
// Fixed: Added StunGasVFX to imports and used directly instead of 'require'
import { MuzzleFlash, HitSpark, Explosion, FirePuddleVFX, drawPersistentDeathVisual, BlockDebris, LiquidTrailVFX, ConditionVFX, BugSplatVFX, SparkVFX, GiantDeathVFX, StunGasVFX } from './vfx';
import { getTime } from './ui';
import { ECONOMY_CONFIG, spawnLootAt } from './economy';
import { drawTurret } from './visualTurrets';
import { drawEnemy } from './visualEnemies';
import { drawBullet } from './visualBullets';
import { isLegibleSpot } from './lvDemo';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const atan2: any;
declare const random: any;
declare const frameCount: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
declare const ellipse: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const color: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const map: any;
declare const HALF_PI: any;
declare const TWO_PI: any;
declare const sin: any;
declare const cos: any;
declare const rectMode: any;
declare const CENTER: any;
declare const vertex: any;
declare const beginShape: any;
declare const endShape: any;
declare const CLOSE: any;
declare const lerp: any;
declare const floor: any;
declare const triangle: any;
declare const radians: any;
declare const arc: any;
declare const line: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;

export function lerpAngle(start: number, end: number, amt: number) {
  let diff = end - start;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return start + diff * amt;
}

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

export class GroundFeature {
  pos: any; config: any; life: number; typeKey: string; vfx: any;
  constructor(x: number, y: number, typeKey: string) {
    this.typeKey = typeKey;
    this.config = groundFeatureTypes[typeKey];
    this.pos = createVector(x, y);
    this.life = this.config.life;
    if (this.config.vfxType === 'fire_puddle') this.vfx = new FirePuddleVFX(x, y, this.config.radius);
    // Fixed: Removed 'require' call and used imported StunGasVFX
    if (this.config.vfxType === 'stun_gas') this.vfx = new StunGasVFX(x, y, this.config.radius, this.config.life);
  }
  update() {
    this.life--;
    if (this.vfx) this.vfx.update();
    if (this.life % this.config.tickRate === 0) {
      for (let e of state.enemies) {
        if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < this.config.radius + e.size/2) {
          const cond = this.config.appliedCondition;
          if (cond && e.applyCondition) {
             if (typeof cond === 'string') {
               e.applyCondition(cond, this.config.conditionDuration || 60);
             } else {
               for (const c of cond) e.applyCondition(c.type, c.duration);
             }
          }
          e.takeDamage(this.config.damage);
        }
      }
      let gxStart = floor((this.pos.x - this.config.radius) / GRID_SIZE);
      let gxEnd = floor((this.pos.x + this.config.radius) / GRID_SIZE);
      let gyStart = floor((this.pos.y - this.config.radius) / GRID_SIZE);
      let gyEnd = floor((this.pos.y + this.config.radius) / GRID_SIZE);
      for (let gx = gxStart; gx <= gxEnd; gx++) {
        for (let gy = gyStart; gy <= gyEnd; gy++) {
          let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
          let chunk = state.world.getChunk(cx, cy);
          let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
          if (block) {
            let bx = block.pos.x + GRID_SIZE/2; let by = block.pos.y + GRID_SIZE/2;
            if (dist(this.pos.x, this.pos.y, bx, by) < this.config.radius + GRID_SIZE/2) block.takeDamage(this.config.damage);
          }
        }
      }
    }
  }
  display() { if (this.vfx) this.vfx.display(); }
}

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

    if (this.config.spawnGroundFeaturePerFrame > 0 && frameCount % this.config.spawnGroundFeaturePerFrame === 0) this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    
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

export class AttachedTurret {
  uid: string; type: string; config: any; parent: any; hq: number; hr: number; angle: number = 0; alpha: number = 255; health: number; maxHealth: number; offset: any; size: number;
  recoil: number = 0; actionTimers: Map<string, number> = new Map(); 
  actionSteps: Map<string, number> = new Map(); // Step index for fire sequences
  target: any = null;
  isWaterlogged: boolean = false; isFrosted: boolean = false; frostLevel: number = 0; iceCubeHealth: number = 0; fireRateMultiplier: number = 1.0;
  conditions: Map<string, number> = new Map();
  baseIngredients: string[] = []; // T1 components tracking

  constructor(type: string, parent: any, hq: number, hr: number) {
    this.uid = Math.random().toString(36).substr(2, 9); this.type = type; this.config = turretTypes[type]; this.parent = parent; this.hq = hq; this.hr = hr;
    this.size = this.config.size; this.health = this.config.health; this.maxHealth = this.health;
    this.offset = createVector(HEX_DIST * (1.5 * hq), HEX_DIST * (Math.sqrt(3)/2 * hq + Math.sqrt(3) * hr));
    
    if (this.config.tier === 1) {
      this.baseIngredients = [type === 't_peashooter' ? 't_pea' : type];
    }
  }
  
  getWorldPos() { return p5.Vector.add(this.parent.pos, this.offset); }
  getTargetCenter() { if (!this.target) return null; if (this.target.getWorldPos) return this.target.getWorldPos(); if (this.target.gx !== undefined) return createVector(this.target.gx * GRID_SIZE + GRID_SIZE/2, this.target.gy * GRID_SIZE + GRID_SIZE/2); return this.target.pos ? this.target.pos.copy() : null; }
  
  applyCondition(cKey: string, duration: number) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
    if (cfg.conditionClashesConfig?.override) for (let ov of cfg.conditionClashesConfig.override) this.conditions.delete(ov);
    this.conditions.set(cKey, (this.conditions.get(cKey) || 0) + duration);
    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) state.vfx.push(new ConditionVFX(this, cKey));
  }

  update() {
    if (this.health <= 0) return;
    const wPos = this.getWorldPos(); const gx = floor(wPos.x / GRID_SIZE); const gy = floor(wPos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    this.fireRateMultiplier = lData?.liquidConfig?.turretFireRateMultiplier ?? 1.0;
    this.isWaterlogged = (liquidType === 'l_water');
    
    if (lData?.liquidConfig?.liquidDamageConfig?.turret) {
      const cfg = lData.liquidConfig.liquidDamageConfig.turret;
      if (frameCount % cfg.damageInterval === 0) {
          const dmg = state.isStationary 
            ? (cfg.damageWhileStationary ?? 0) + this.maxHealth * (cfg.damageAsMaxHpWhileStationary ?? 0)
            : (cfg.damageWhileMoving ?? 0);
          if (dmg > 0) this.takeDamage(dmg);
          if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || cfg.damageInterval * 2);
      }
    }

    if (liquidType === 'l_ice') { if (state.isStationary && !this.isFrosted) { this.frostLevel = Math.min(1, this.frostLevel + (1 / 900)); if (this.frostLevel >= 1) { this.isFrosted = true; this.iceCubeHealth = 100; } } } else if (!this.isFrosted) { this.frostLevel = Math.max(0, this.frostLevel - (1 / 300)); }
    
    this.applyObstacleRepulsion(wPos);

    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (cfg.damage && frameCount % cfg.damageInterval === 0) this.takeDamage(cfg.damage);
      this.conditions.set(cKey, life - 1);
      if (life <= 0) this.conditions.delete(cKey);
    }

    if (this.config.actionType.includes('passiveSun')) {
      const lastTrigger = this.actionTimers.get('passiveSun') || 0;
      if (frameCount - lastTrigger > this.config.actionConfig.sunCooldown) {
        state.loot.push(new SunLoot(wPos.x, wPos.y, 1));
        state.sunSpawnedTotal += 1;
        this.actionTimers.set('passiveSun', frameCount);
      }
    }

    const isActive = state.isStationary && !this.isWaterlogged && !this.isFrosted;
    this.alpha = lerp(this.alpha, isActive ? 255 : 127, 0.1); this.recoil = (this.recoil || 0) * 0.85;
    if (!isActive) return;
    this.findTarget();
    for (const act of this.config.actionType || []) {
      const lastTrigger = this.actionTimers.get(act) || -9999; 
      const config = this.config.actionConfig;
      
      const step = this.actionSteps.get(act) || 0;
      const frValue = (act === 'shoot') ? config.shootFireRate : ((act === 'laserBeam') ? config.beamFireRate : ((act === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : config.pulseCooldown));
      const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
      const effectiveFireRate = fr / this.fireRateMultiplier;

      if (act === 'shoot' && this.target && frameCount - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
        this.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x); let sa = this.angle + (config.inaccuracy ? random(-radians(config.inaccuracy), radians(config.inaccuracy)) : 0);
        state.bullets.push(new Bullet(wPos.x, wPos.y, wPos.x + cos(sa)*500, wPos.y + sin(sa)*500, config.bulletTypeKey, 'enemy'));
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa)); this.recoil = 6; 
        this.actionTimers.set(act, frameCount);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'laserBeam' && this.target && frameCount - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
        // Fixed: Corrected typo 'vPos.y' to 'wPos.x' in angle calculation
        this.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x); 
        const killed = this.target.takeDamage(config.beamDamage);
        if (killed && config.spawnBulletOnTargetDeath) {
            const loc = this.getTargetCenter();
            if (loc) {
              const b = new Bullet(loc.x, loc.y, loc.x, loc.y, config.spawnBulletOnTargetDeath, 'none');
              b.life = 0; state.bullets.push(b);
            }
        }
        if (config.appliedConditions && this.target.applyCondition) for (const cond of config.appliedConditions) this.target.applyCondition(cond.type, cond.duration);
        this.recoil = 2; 
        this.actionTimers.set(act, frameCount);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'spawnBulletAtRandom' && frameCount - lastTrigger > effectiveFireRate) {
        // Special logic for trap turrets (like Mine Launcher)
        const isTrap = ['t_mine', 't_ice', 't2_minespawner', 't2_icebomb', 't2_stun'].includes(this.type);
        if (isTrap) {
          const pulseTimer = this.actionTimers.get('pulse') || -999999;
          const pulseCooldown = (this.config.actionConfig.pulseCooldown || 0) / this.fireRateMultiplier;
          const onPulseCooldown = (frameCount - pulseTimer) < pulseCooldown;
          // If we are currently unarmed/reloading, we can't spawn our projectile
          if (onPulseCooldown) continue;
        }

        const sbc = config.spawnBulletAtRandom;
        const ang = random(TWO_PI);
        const r = random(sbc.distRange[0], sbc.distRange[1]);
        const tx = wPos.x + cos(ang) * r;
        const ty = wPos.y + sin(ang) * r;
        
        let b = new Bullet(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none');
        b.targetPos = createVector(tx, ty);
        state.bullets.push(b);
        this.recoil = 8;
        this.actionTimers.set(act, frameCount);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'pulse' && frameCount - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter();
        let triggered = false;
        if (tCenter && dist(wPos.x, wPos.y, tCenter.x, tCenter.y) < config.pulseTriggerRadius) triggered = true;

        if (triggered) {
          if (config.pulseBulletTypeKey) {
            const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
            const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
            let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b);
          }
          this.actionTimers.set(act, frameCount);
          this.actionSteps.set(act, step + 1);
        }
      }
    }
  }

  applyObstacleRepulsion(wPos: any) {
    const gx = floor(wPos.x / GRID_SIZE);
    const gy = floor(wPos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.8;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bCenter = createVector(i * GRID_SIZE + GRID_SIZE/2, j * GRID_SIZE + GRID_SIZE/2);
          const d = dist(wPos.x, wPos.y, bCenter.x, bCenter.y);
          if (d < forceRange) {
            const pushDir = p5.Vector.sub(wPos, bCenter).normalize().mult(3.5 * (1 - d/forceRange));
            this.parent.pos.add(pushDir);
          }
        }
      }
    }
  }

  findTarget() {
    const tTypes = this.config.targetType || []; const wPos = this.getWorldPos();
    const tCfg = this.config.targetConfig || {}; 
    const range = this.config.actionConfig.shootRange || this.config.actionConfig.beamMaxLength || this.config.actionConfig.pulseTriggerRadius || 300;
    if (this.target) {
      const tCenter = this.getTargetCenter(); if (!tCenter) { this.target = null; } else {
        const d = dist(wPos.x, wPos.y, tCenter.x, tCenter.y);
        let valid = this.target.isFrosted !== undefined ? (this.target.isFrosted && this.target.iceCubeHealth > 0) : (this.target.health !== undefined ? this.target.health > 0 : !this.target.isMined);
        if (valid && d <= range + 10 && state.world.checkLOS(wPos.x, wPos.y, tCenter.x, tCenter.y)) return;
      }
      this.target = null;
    }
    let bestT = null; let bestVal = Infinity;
    for (let a of state.player.attachments) if (a !== this && a.isFrosted && a.iceCubeHealth > 0) { let d = dist(wPos.x, wPos.y, a.getWorldPos().x, a.getWorldPos().y); if (d < range && d < bestVal && state.world.checkLOS(wPos.x, wPos.y, a.getWorldPos().x, a.getWorldPos().y)) { bestVal = d; bestT = a; } }
    if (bestT) { this.target = bestT; return; }
    if (tTypes.includes('enemy')) {
      for (let e of state.enemies) if (e.health > 0 && !e.isInvisible && !e.isDying) {
        let d = dist(wPos.x, wPos.y, e.pos.x, e.pos.y); if (d <= range && state.world.checkLOS(wPos.x, wPos.y, e.pos.x, e.pos.y)) {
          let v = tCfg.enemyPriority === 'lowestHealth' ? e.health : (tCfg.enemyPriority === 'highestHealth' ? -e.health : (tCfg.enemyPriority === 'random' ? random() : d));
          if (v < bestVal) { bestVal = v; bestT = e; }
        }
      }
      state.world.chunks.forEach((chunk: any) => chunk.blocks.forEach((b: any) => {
        if (b.isMined || !b.overlay) return;
        const oCfg = overlayTypes[b.overlay];
        if (oCfg?.isEnemy) {
          let bc = {x: b.pos.x + GRID_SIZE/2, y: b.pos.y + GRID_SIZE/2}; let d = dist(wPos.x, wPos.y, bc.x, bc.y);
          if (d <= range && state.world.checkLOS(wPos.x, wPos.y, bc.x, bc.y) && d < bestVal) { bestVal = d; bestT = b; }
        }
      }));
    }
    if ((!bestT || tCfg.enemyPriority === 'random') && tTypes.includes('obstacle')) {
      state.world.chunks.forEach((chunk: any) => chunk.blocks.forEach((b: any) => {
        if (b.isMined) return; 
        const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
        let bc = {x: b.pos.x + GRID_SIZE/2, y: b.pos.y + GRID_SIZE/2}; let d = dist(wPos.x, wPos.y, bc.x, bc.y);
        if (d <= range && state.world.checkLOS(wPos.x, wPos.y, bc.x, bc.y)) {
          let score = d - (oCfg?.isValuable ? 2000 : 0) - (oCfg?.isEnemy ? 3000 : 0);
          if (score < bestVal) { bestVal = score; bestT = b; }
        }
      }));
    }
    this.target = bestT; if (this.target) { const tc = this.getTargetCenter(); this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); }
  }
  takeDamage(d: number) { 
    if (this.isFrosted) { this.iceCubeHealth -= d; if (this.iceCubeHealth <= 0) { this.isFrosted = false; this.frostLevel = 0; state.vfx.push(new BlockDebris(this.getWorldPos().x, this.getWorldPos().y, [180, 240, 255])); for (let a of state.player.attachments) if (a.target === this) a.target = null; if (state.player.target === this) state.player.target = null; } return; }
    this.health = Math.max(0, this.health - d); if (this.health <= 0 && this.config.actionType?.includes('onDeathPulse')) { let wPos = this.getWorldPos(); let b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, this.config.actionConfig.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b); }
  }
  display() {
    drawTurret(this);
  }
}

export class Enemy {
  pos: any; type: string; config: any; health: number; maxHealth: number; speed: number; size: number; col: any; target: any = null; flash: number = 0; rot: number; actionType: string[]; actionConfig: any;
  meleeCooldown: number = 0; shootCooldown: number = 0; swarmParticles: any[] = []; markedForDespawn: boolean = false;
  conditions: Map<string, number> = new Map();
  prevPos: any; isDying: boolean = false;
  triggeredSpawnThresholds: Set<number> = new Set(); // Tracks already fired health ratios

  constructor(x: number, y: number, typeKey: string) {
    this.pos = createVector(x, y); this.prevPos = this.pos.copy(); this.type = typeKey; this.config = enemyTypes[typeKey]; this.health = this.config.health; this.maxHealth = this.health; this.speed = this.config.speed; this.size = this.config.size; this.col = this.config.col; this.rot = random(TWO_PI); this.actionType = this.config.actionType; this.actionConfig = this.config.actionConfig;
    if (this.type === 'e_swarm') for(let i=0; i<10; i++) this.swarmParticles.push({ offset: p5.Vector.random2D().mult(random(12, 24)), size: random(5, 9), phase: random(TWO_PI) });
  }

  applyCondition(cKey: string, duration: number) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
    if (cfg.conditionClashesConfig?.override) for (let ov of cfg.conditionClashesConfig.override) this.conditions.delete(ov);
    this.conditions.set(cKey, (this.conditions.get(cKey) || 0) + duration);
    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) state.vfx.push(new ConditionVFX(this, cKey));
  }

  update(playerPos: any, turrets: AttachedTurret[]) {
    if (this.isDying) return;
    if (this.flash > 0) this.flash--;
    this.prevPos.set(this.pos);
    if (dist(this.pos.x, this.pos.y, playerPos.x, playerPos.y) > GRID_SIZE * CHUNK_SIZE * 4) { 
      this.markedForDespawn = true; 
      const refund = (enemyTypes[this.type].cost || 0);
      state.hourlyBudgetPool += refund; 
      state.refundedBudget += refund;
      return; 
    }
    
    this.applyObstacleRepulsion();

    let speedMult = 1.0;
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (cfg.damage && frameCount % cfg.damageInterval === 0) this.takeDamage(cfg.damage);
      speedMult *= cfg.enemyMovementSpeedMultiplier;
      this.conditions.set(cKey, life - 1);
      if (life <= 0) this.conditions.delete(cKey);
    }

    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let actualVel = dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);

    if (lData) {
       speedMult *= lData.liquidConfig.enemyMovementSpeedMultiplier;
       if (lData.trailVfxInterval && frameCount % floor(lData.trailVfxInterval / 2) === 0 && actualVel > 0.1) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.enemyTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
       
       if (lData.liquidConfig.liquidDamageConfig?.enemy) {
         const cfg = lData.liquidConfig.liquidDamageConfig.enemy;
         const interval = cfg.damageInterval || 10;
         if (frameCount % interval === 0) {
           if (cfg.damage) this.takeDamage(cfg.damage);
           if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || interval * 2);
         }
       }
    }

    if (this.conditions.has('c_stun')) return;
    for (let other of state.enemies) if (other !== this && other.health > 0 && !other.isDying) { let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y); let md = (this.size + other.size)*0.55; if (d < md && d > 0) this.moveWithCollisions(p5.Vector.sub(this.pos, other.pos).normalize().mult(0.2)); }
    
    let nearestT = null; let minDistT = 450;
    for (let t of turrets) if (t.config.collideWithEnemy !== false) { let d = dist(this.pos.x, this.pos.y, t.getWorldPos().x, t.getWorldPos().y); if (d < minDistT && state.world.checkLOS(this.pos.x, this.pos.y, t.getWorldPos().x, t.getWorldPos().y)) { nearestT = t; minDistT = d; } }
    let tp = nearestT ? nearestT.getWorldPos() : playerPos; this.target = nearestT || state.player;
    let d = dist(this.pos.x, this.pos.y, tp.x, tp.y); let dir = p5.Vector.sub(tp, this.pos).normalize(); this.rot = lerpAngle(this.rot, dir.heading(), 0.12);

    if (this.actionType.includes('moveDefault') && this.meleeCooldown <= 0) {
      let rThresh = this.actionType.includes('shoot') ? this.actionConfig.shootRange * 0.75 : this.size * 0.6;
      if (d > rThresh) this.moveWithCollisions(dir.copy().mult(this.speed * speedMult));
    }
    if (this.actionType.includes('meleeAttack') && d < (this.size + (this.target.size || 32))*0.5 + 10 && this.meleeCooldown <= 0) { this.target.takeDamage(this.actionConfig.damage); this.meleeCooldown = this.actionConfig.attackFireRate; if (frameCount % 5 === 0) state.vfx.push(new HitSpark(this.pos.x, this.pos.y, [255, 50, 50])); }
    if (this.meleeCooldown > 0) this.meleeCooldown--;
    if (this.actionType.includes('shoot') && d < this.actionConfig.shootRange && this.shootCooldown <= 0 && state.world.checkLOS(this.pos.x, this.pos.y, tp.x, tp.y)) { state.enemyBullets.push(new Bullet(this.pos.x, this.pos.y, tp.x, tp.y, 'b_enemy_basic', 'core')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, dir.heading(), 22, 6, color(200, 100, 255))); this.shootCooldown = this.actionConfig.shootFireRate; }
    if (this.shootCooldown > 0) this.shootCooldown--;
    
    if (this.actionType.includes('spawnEnemy') && this.actionConfig.spawnTriggerOnHealthRatio) {
      let ratio = this.health / this.maxHealth;
      for (let t of this.actionConfig.spawnTriggerOnHealthRatio) {
        if (t > 0 && ratio <= t && !this.triggeredSpawnThresholds.has(t)) {
          this.triggeredSpawnThresholds.add(t);
          this.performSummon();
        }
      }
    }
  }

  applyObstacleRepulsion() {
    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.9;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bCenter = createVector(i * GRID_SIZE + GRID_SIZE/2, j * GRID_SIZE + GRID_SIZE/2);
          const d = dist(this.pos.x, this.pos.y, bCenter.x, bCenter.y);
          if (d < forceRange) {
            const pushDir = p5.Vector.sub(this.pos, bCenter).normalize().mult(4.0 * (1 - d/forceRange));
            this.pos.add(pushDir);
          }
        }
      }
    }
  }

  moveWithCollisions(move: any) {
    let nx = this.pos.x + move.x; if (!state.world.checkCollision(nx, this.pos.y, this.size/2.2) && !this.checkEntityCollisions(nx, this.pos.y)) this.pos.x = nx;
    let ny = this.pos.y + move.y; if (!state.world.checkCollision(this.pos.x, ny, this.size/2.2) && !this.checkEntityCollisions(this.pos.x, ny)) this.pos.y = ny;
  }
  checkEntityCollisions(x: number, y: number) { if (dist(x, y, state.player.pos.x, state.player.pos.y) < (this.size + state.player.size)*0.5) return true; for (let t of state.player.attachments) if (t.config.collideWithEnemy !== false && dist(x, y, t.getWorldPos().x, t.getWorldPos().y) < (this.size + t.size)*0.5) return true; return false; }
  
  performSummon() {
    if (!this.actionConfig.enemyTypeToSpawn) return;
    let type = random(this.actionConfig.enemyTypeToSpawn);
    let count = floor(this.actionConfig.spawnBudget / enemyTypes[type].cost);
    for(let i=0; i<count; i++) {
      let limit = 15;
      while (limit > 0) {
        limit--;
        let ang = random(TWO_PI);
        let r = random(25, this.actionConfig.spawnRadius);
        let sx = this.pos.x + cos(ang)*r;
        let sy = this.pos.y + sin(ang)*r;
        
        if (isLegibleSpot(sx, sy) && !state.world.checkCollision(sx, sy, enemyTypes[type].size/2.2)) {
          state.enemies.push(new Enemy(sx, sy, type));
          break;
        }
      }
    }
  }

  display() { 
    drawEnemy(this);
  }
  takeDamage(dmg: number) { 
    if (this.isDying) return false;
    this.health -= dmg; 
    this.flash = 6; 
    if (this.health <= 0) { 
      this.health = 0;
      this.isDying = true;
      state.totalEnemiesDead++;
      
      if (this.actionType.includes('spawnEnemy') && this.actionConfig.spawnTriggerOnHealthRatio) {
        if (this.actionConfig.spawnTriggerOnHealthRatio.includes(0)) {
           this.performSummon();
        }
      }

      if (this.type === 'e_giant') {
        state.vfx.push(new GiantDeathVFX(this.pos.x, this.pos.y, this.size, this.col));
        this.markedForDespawn = true; 
      } else {
        state.vfx.push(new BugSplatVFX(this.pos.x, this.pos.y, this.size, this.col)); 
        drawPersistentDeathVisual(this.pos.x, this.pos.y, this.size, [red(color(this.col)), green(color(this.col)), blue(color(this.col))]); 
        this.markedForDespawn = true;
      }
      return true; 
    } 
    return false; 
  }
}

export class Player {
  pos: any; prevPos: any; size = 30; attachments: AttachedTurret[] = []; health = 100; maxHealth = 100; speed = 3.6; flash = 0; autoTurretAngle = 0; autoTurretLastShot = 0; autoTurretRange = GRID_SIZE * 6; autoTurretFireRate = 22; recoil = 0; target: any = null;
  constructor(x: number, y: number) { this.pos = createVector(x, y); this.prevPos = createVector(x, y); }
  update() {
    this.prevPos.set(this.pos); this.recoil = (this.recoil || 0) * 0.85;
    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let lMult = lData?.liquidConfig?.playerMovementSpeedMultiplier ?? 1.0;
    
    this.applyObstacleRepulsion();

    let move = createVector(0, 0); const keyIsDown: any = (window as any).keyIsDown;
    if (keyIsDown(65)) move.x -= 1; if (keyIsDown(68)) move.x += 1; if (keyIsDown(87)) move.y -= 1; if (keyIsDown(83)) move.y += 1;
    if (move.mag() > 0) { move.normalize().mult(this.speed * lMult); this.moveWithSliding(move); }
    let vel = dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    state.isStationary = vel < 0.4 ? (state.stationaryTimer++ > 15) : (state.stationaryTimer = 0, false);
    
    if (lData && lData.trailVfxInterval && frameCount % floor(lData.trailVfxInterval / 3) === 0 && vel > 0.5) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.playerTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));

    for (let i = this.attachments.length - 1; i >= 0; i--) { const a = this.attachments[i]; a.update(); if (a.health <= 0) { state.vfx.push(new SparkVFX(a.getWorldPos().x, a.getWorldPos().y, 12, color(a.config.color))); state.vfx.push(new Explosion(a.getWorldPos().x, a.getWorldPos().y, a.size * 2, color(a.config.color), color(40, 40, 60))); this.attachments.splice(i, 1); } }
    for (let i = state.loot.length - 1; i >= 0; i--) {
      const res = state.loot[i].update(this.pos);
      if (res === 'collected') {
        if (state.loot[i] instanceof TurretLoot) {
           this.addStrayTurret((state.loot[i] as TurretLoot).turretType);
        } else {
           state.sunCurrency += state.loot[i].value;
           state.totalSunLootCollected += state.loot[i].value;
        }
        state.loot.splice(i, 1);
      } else if (res === 'missed') { 
        state.sunMissedTotal += state.loot[i].value; 
        state.loot.splice(i, 1); 
      }
    }
    this.updateAutoTurret();
  }

  applyObstacleRepulsion() {
    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.9;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bCenter = createVector(i * GRID_SIZE + GRID_SIZE/2, j * GRID_SIZE + GRID_SIZE/2);
          const d = dist(this.pos.x, this.pos.y, bCenter.x, bCenter.y);
          if (d < forceRange) {
            const pushDir = p5.Vector.sub(this.pos, bCenter).normalize().mult(4.0 * (1 - d/forceRange));
            this.pos.add(pushDir);
          }
        }
      }
    }
  }

  addStrayTurret(type: string) {
    let bestSlot = null; let minDist = Infinity;
    const rangeLimit = 8;
    for (let q = -rangeLimit; q <= rangeLimit; q++) {
      for (let r = -rangeLimit; r <= rangeLimit; r++) {
        if (Math.abs(q) + Math.abs(r) + Math.abs(-q-r) <= rangeLimit * 2) {
          let occupied = (q === 0 && r === 0);
          for(let a of this.attachments) if(a.hq === q && a.hr === r) occupied = true;
          if (!occupied) {
             const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
             let adj = false;
             for (let [dq, dr] of neighbors) {
               let nq = q + dq; let nr = r + dr;
               if (nq === 0 && nr === 0) { adj = true; break; }
               if (this.attachments.some((a:any) => a.hq === nq && a.hr === nr)) { adj = true; break; }
             }
             if (adj) {
               let d = dist(0, 0, q, r);
               if (d < minDist) { minDist = d; bestSlot = { q, r }; }
             }
          }
        }
      }
    }
    if (bestSlot) {
      this.attachments.push(new AttachedTurret(type, this, bestSlot.q, bestSlot.r));
      state.vfx.push(new Explosion(this.pos.x, this.pos.y, 60, color(255, 255, 100)));
    }
  }

  updateAutoTurret() {
    if (!state.isStationary) return;
    let bestR = null; let minRD = this.autoTurretRange;
    for (let a of this.attachments) if (a.isFrosted && a.iceCubeHealth > 0) { let d = dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y); if (d < minRD && state.world.checkLOS(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y)) { minRD = d; bestR = a; } }
    if (bestR) { this.target = bestR; const bp = bestR.getWorldPos(); this.autoTurretAngle = atan2(bp.y - this.pos.y, bp.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bp.x, bp.y, 'b_player', 'icecube')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; } return; }
    let nearestE = null; let minDistE = this.autoTurretRange;
    for (let e of state.enemies) if (!e.isInvisible && e.health > 0 && !e.isDying) { let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y); if (d < minDistE && state.world.checkLOS(this.pos.x, this.pos.y, e.pos.x, e.pos.y)) { minDistE = d; nearestE = e; } }
    if (nearestE) { this.autoTurretAngle = atan2(nearestE.pos.y - this.pos.y, nearestE.pos.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, nearestE.pos.x, nearestE.pos.y, 'b_player', 'enemy')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; } } else {
      let t = this.findBlockTarget(this.pos, this.autoTurretRange); if (t) { let bc = { x: t.pos.x + GRID_SIZE/2, y: t.pos.y + GRID_SIZE/2 }; this.autoTurretAngle = atan2(bc.y - this.pos.y, bc.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bc.x, bc.y, 'b_player_mining', 'none')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 14, 4, color(255, 255, 100))); this.autoTurretLastShot = frameCount; this.recoil = 3; } }
    }
  }

  findBlockTarget(origin: any, range: number) {
      let nPri: any = null; let mdPri = range; let nGen: any = null; let mdGen = range;
      const chunks = state.world.chunks as Map<string, any>;
      for (const chunk of chunks.values()) {
          const cX = chunk.cx * CHUNK_SIZE * GRID_SIZE;
          const cY = chunk.cy * CHUNK_SIZE * GRID_SIZE;
          if (dist(cX, cY, origin.x, origin.y) > range + 500) continue;
          
          const blocks = chunk.blocks as any[];
          for (const b of blocks) {
              if (b.isMined || !b.pos) continue;
              const bc = { x: b.pos.x + GRID_SIZE/2, y: b.pos.y + GRID_SIZE/2 };
              const d = dist(origin.x, origin.y, bc.x, bc.y);
              if (d > range) continue;
              
              if (!state.world.checkLOS(origin.x, origin.y, bc.x + (origin.x < bc.x ? -2 : 2), bc.y + (origin.y < bc.y ? -2 : 2))) continue;
              
              const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
              if (oCfg?.isValuable || oCfg?.isEnemy) {
                  if (d < mdPri) { mdPri = d; nPri = b; }
              } else {
                  if (d < mdGen) { mdGen = d; nGen = b; }
              }
          }
      }
      return nPri || nGen;
  }

  moveWithSliding(move: any) {
    let tx = this.pos.x + move.x; 
    let cx = state.world.checkCollision(tx, this.pos.y, this.size/2); 
    const ltx = state.world.getLiquidAt(floor(tx / GRID_SIZE), floor(this.pos.y / GRID_SIZE)); 
    if (ltx && liquidTypes[ltx]?.liquidConfig?.blocksMovement) cx = true;
    
    const atts = this.attachments as AttachedTurret[];
    for(let a of atts) {
      if(a.config.collideWithEnemy !== false && state.world.checkCollision(tx + a.offset.x, this.pos.y + a.offset.y, a.config.size/2)) {
        cx = true;
        break;
      }
    }
    if (!cx) this.pos.x = tx;

    let ty = this.pos.y + move.y; 
    let cy = state.world.checkCollision(this.pos.x, ty, this.size/2); 
    const lty = state.world.getLiquidAt(floor(this.pos.x / GRID_SIZE), floor(ty / GRID_SIZE)); 
    if (lty && liquidTypes[lty]?.liquidConfig?.blocksMovement) cy = true;
    
    for(let a of atts) {
      if(a.config.collideWithEnemy !== false && state.world.checkCollision(this.pos.x + a.offset.x, ty + a.offset.y, a.config.size/2)) {
        cy = true;
        break;
      }
    }
    if (!cy) this.pos.y = ty;
  }
  takeDamage(dmg: number) { this.health -= dmg; this.flash = 6; if (this.health <= 0) this.health = 0; }
  displayAttachments(behind: boolean) { for (let a of this.attachments) if (behind === !!a.config.renderBehindEnemy) a.display(); }
  display() {
    push(); let grad = (window as any).drawingContext.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, VISIBILITY_RADIUS * GRID_SIZE); grad.addColorStop(0, 'rgba(100, 150, 255, 0.15)'); grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); (window as any).drawingContext.fillStyle = grad; noStroke(); ellipse(this.pos.x, this.pos.y, VISIBILITY_RADIUS * GRID_SIZE * 2.8);
    this.displayAttachments(false);
    push(); translate(this.pos.x, this.pos.y); let c = [30, 40, 70]; if (this.flash > 0) { c = [255, 100, 100]; this.flash--; }
    stroke(20, 20, 40); strokeWeight(4); fill(c[0], c[1], c[2]); ellipse(0, 0, this.size, this.size);
    const coreP = 0.5 + 0.5 * sin(frameCount * 0.1); fill(50, 150, 255, 150 + coreP * 100); noStroke(); ellipse(0, 0, 18, 18); fill(255, 255, 255, 200); ellipse(0, 0, 8, 8);
    if (state.isStationary) { rotate(this.autoTurretAngle); stroke(20, 20, 40); strokeWeight(2); fill(50, 150, 255); rect(14 - (this.recoil || 0), -5, 14, 10, 3); noStroke(); fill(255, 150); rect(22 - (this.recoil || 0), -3, 4, 6, 1); } pop();
    pop();
  }
}

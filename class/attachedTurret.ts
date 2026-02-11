
import { state } from '../state';
import { HEX_DIST, GRID_SIZE, HOUR_FRAMES } from '../constants';
import { turretTypes } from '../balanceTurrets';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { MuzzleFlash, Explosion, SparkVFX, BlockDebris, ConditionVFX } from '../vfx';
import { Bullet } from './bullet';
import { SunLoot } from './loot';
import { drawTurret } from '../visualTurrets';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const atan2: any;
declare const floor: any;
declare const frameCount: any;
declare const lerp: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const radians: any;
declare const TWO_PI: any;

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

    // Initialize arming state if turret has an unarmed asset
    if (this.config.actionConfig?.hasUnarmedAsset) {
      for (const act of this.config.actionType || []) {
        if (act === 'pulse' || act === 'shoot' || act === 'spawnBulletAtRandom') {
          this.actionTimers.set(act, state.frames);
        }
      }
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
      if (state.frames % cfg.damageInterval === 0) {
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
      if (cfg.damage && state.frames % cfg.damageInterval === 0) this.takeDamage(cfg.damage);
      this.conditions.set(cKey, life - 1);
      if (life <= 0) this.conditions.delete(cKey);
    }

    if (this.config.actionType.includes('passiveSun')) {
      const lastTrigger = this.actionTimers.get('passiveSun') || 0;
      if (state.frames - lastTrigger > this.config.actionConfig.sunCooldown) {
        state.loot.push(new SunLoot(wPos.x, wPos.y, 1));
        state.sunSpawnedTotal += 1;
        this.actionTimers.set('passiveSun', state.frames);
      }
    }

    const isActive = state.isStationary && !this.isWaterlogged && !this.isFrosted;
    this.alpha = lerp(this.alpha, isActive ? 255 : 127, 0.1); this.recoil = (this.recoil || 0) * 0.85;
    if (!isActive) return;
    this.findTarget();
    for (const act of this.config.actionType || []) {
      const lastTrigger = this.actionTimers.get(act) || -99999; 
      const config = this.config.actionConfig;
      
      const step = this.actionSteps.get(act) || 0;
      const frValue = (act === 'shoot') ? config.shootFireRate : ((act === 'laserBeam') ? config.beamFireRate : ((act === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : config.pulseCooldown));
      const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
      const effectiveFireRate = fr / this.fireRateMultiplier;

      if (act === 'shoot' && this.target && state.frames - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
        this.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x); let sa = this.angle + (config.inaccuracy ? random(-radians(config.inaccuracy), radians(config.inaccuracy)) : 0);
        state.bullets.push(new Bullet(wPos.x, wPos.y, wPos.x + cos(sa)*500, wPos.y + sin(sa)*500, config.bulletTypeKey, 'enemy'));
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa)); this.recoil = 6; 
        this.actionTimers.set(act, state.frames);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'laserBeam' && this.target && state.frames - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
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
        this.actionTimers.set(act, state.frames);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'spawnBulletAtRandom' && state.frames - lastTrigger > effectiveFireRate) {
        const isTrap = ['t_mine', 't_ice', 't2_minespawner', 't2_icebomb', 't2_stun'].includes(this.type);
        if (isTrap) {
          const pulseTimer = this.actionTimers.get('pulse') || -999999;
          const pulseCooldown = (this.config.actionConfig.pulseCooldown || 0) / this.fireRateMultiplier;
          const onPulseCooldown = (state.frames - pulseTimer) < pulseCooldown;
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
        this.actionTimers.set(act, state.frames);
        this.actionSteps.set(act, step + 1);
      } else if (act === 'pulse' && state.frames - lastTrigger > effectiveFireRate) {
        const tCenter = this.getTargetCenter();
        let triggered = false;
        if (tCenter && dist(wPos.x, wPos.y, tCenter.x, tCenter.y) < config.pulseTriggerRadius) triggered = true;

        if (triggered) {
          if (config.pulseBulletTypeKey) {
            const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
            const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
            let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b);
          }
          this.actionTimers.set(act, state.frames);
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

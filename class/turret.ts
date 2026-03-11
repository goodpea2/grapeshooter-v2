
import { state } from '../state';
import { GRID_SIZE, TurretMinScanRate, WORLD_TURRET_ACTIVE_RANGE, CHUNK_SIZE } from '../constants';
import { turretTypes } from '../balanceTurrets';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { MuzzleFlash, BlockDebris, ConditionVFX, FirstStrikeVFX, DamageNumberVFX, MagicLinkVFX, WeldingHitVFX, SparkVFX, MergeVFX } from '../vfx/index';
import { Bullet } from './bullet';
import { SunLoot } from './loot';
import { spawnLootAt } from '../economy';
import { Enemy } from './enemy';
import { drawTurret, drawTurretUI } from '../visualTurrets';

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
declare const width: any;
declare const height: any;
declare const color: any;

export abstract class Turret {
  uid: string;
  type: string;
  config: any;
  angle: number = 0;
  alpha: number = 255;
  health: number;
  maxHealth: number;
  size: number;
  recoil: number = 0;
  actionTimers: Map<string, number> = new Map();
  actionSteps: Map<string, number> = new Map();
  target: any = null;
  isWaterlogged: boolean = false;
  isFrosted: boolean = false;
  frostLevel: number = 0;
  iceCubeHealth: number = 0;
  fireRateMultiplier: number = 1.0;
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  framesAlive: number = 0;
  flashTimer: number = 0;
  flashType: 'damage' | 'heal' = 'damage';
  hurtAnimTimer: number = 0;
  pulseAnimTimer: number = 0;
  specialActivityLevel: number = 0;
  lastTargetUid: string | null = null;
  uninterruptedFrames: number = 0;
  rampFactor: number = 0;
  spinFrames: number = 0;
  firstStrikeCount: number = 0;
  targetScanTimer: number;

  // Farm tracking
  farmStage: number = 0;
  farmGrowthTimer: number = 0;
  farmElixirCount: number = 0;
  farmHarvestHp: number = 0;

  // Seed tracking
  growthProgress: number = 0;
  baseIngredients: string[] = []; // T1 components tracking

  // Shield tracking
  shieldImpactAngles: number[] = [];

  parent: any; // Added parent to base class to support both attached and world turrets

  constructor(type: string, parent?: any) {
    this.uid = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.parent = parent;
    this.config = turretTypes[type];
    this.size = this.config.size;
    this.health = this.config.health;
    this.maxHealth = this.health;
    this.targetScanTimer = floor(random(TurretMinScanRate));
    
    // Initialize base ingredients for T1 turrets
    if (this.config.tier === 1) {
      this.baseIngredients = [type];
    }

    if (this.config.actionType.includes('firstStrike')) {
      this.firstStrikeCount = this.config.actionConfig.firstStrikeConfig.triggerCount;
      if (this.config.actionConfig.firstStrikeConfig.FirstStrikeVfx === 'turret_first_strike') {
        state.vfx.push(new FirstStrikeVFX(this));
      }
    }

    if (this.config.actionConfig?.hasUnarmedAsset) {
      for (const act of this.config.actionType || []) {
        if (['pulse', 'shoot', 'spawnBulletAtRandom', 'launch', 'shootMultiTarget'].includes(act)) {
          this.actionTimers.set(act, state.frames);
        }
      }
    }

    if (this.config.actionType.includes('farm')) {
      this.farmStage = 0;
      this.farmGrowthTimer = this.config.farmConfig.growthTimer[0];
      this.farmHarvestHp = this.config.farmConfig.harvestStageHp || 100;
    }
  }

  abstract getWorldPos(): any;
  
  getTargetCenter() {
    if (!this.target) return null;
    if (this.target === this) return this.getWorldPos();
    if (this.target.getWorldPos) return this.target.getWorldPos();
    if (this.target.gx !== undefined) return createVector(this.target.gx * GRID_SIZE + GRID_SIZE / 2, this.target.gy * GRID_SIZE + GRID_SIZE / 2);
    return this.target.pos ? this.target.pos.copy() : null;
  }

  abstract isPowered(): boolean;
  abstract isAttachedToPlayer(): boolean;

  update() {
    if (this.health <= 0) return;
    this.framesAlive++;
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.hurtAnimTimer > 0) this.hurtAnimTimer--;
    if (this.pulseAnimTimer > 0) this.pulseAnimTimer--;
    this.shieldImpactAngles = [];

    const wPos = this.getWorldPos();
    const gx = floor(wPos.x / GRID_SIZE);
    const gy = floor(wPos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy);
    const lData = liquidType ? liquidTypes[liquidType] : null;
    this.fireRateMultiplier = lData?.liquidConfig?.turretFireRateMultiplier ?? 1.0;

    // Waterlogged logic might differ between attached and world turrets
    // For now, let's keep it simple or override in subclasses
    this.updateEnvironment(gx, gy, liquidType, lData);

    this.updateConditions();
    this.updateActions(wPos);
  }

  protected abstract updateEnvironment(gx: number, gy: number, liquidType: string | null, lData: any): void;
  protected abstract handleGrowth(wPos: any): void;
  protected abstract handleFarm(wPos: any): void;

  protected updateConditions() {
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (cKey === 'c_burning') {
        const dmg = this.conditionData.get('c_burning_dmg') || cfg.damage || 0;
        if (dmg > 0 && state.frames % (cfg.damageInterval || 6) === 0) this.takeDamage(dmg);
      } else if (cfg.damage && state.frames % cfg.damageInterval === 0) {
        this.takeDamage(cfg.damage);
      }
      this.conditions.set(cKey, life - 1);
      if (life <= 0) {
        this.conditions.delete(cKey);
        if (cKey === 'c_burning') this.conditionData.delete('c_burning_dmg');
      }
    }
  }

  protected updateActions(wPos: any) {
    const powered = this.isPowered();
    const isRetracted = !state.isStationary && !this.config.isActiveWhileMoving && this.isAttachedToPlayer();
    const targetAlpha = isRetracted ? 127 : (this.isWaterlogged ? 100 : 255);
    this.alpha = lerp(this.alpha, targetAlpha, 0.1);
    this.recoil = (this.recoil || 0) * 0.85;

    const shouldBeSpecialActive = powered && state.isStationary && !this.isWaterlogged && !this.isFrosted;
    this.specialActivityLevel = lerp(this.specialActivityLevel, shouldBeSpecialActive ? 1 : 0, 0.1);

    if (this.config.actionType.includes('passiveSun')) {
      const lastTrigger = this.actionTimers.get('passiveSun') || 0;
      if (state.frames - lastTrigger > this.config.actionConfig.sunCooldown) {
        spawnLootAt(wPos.x, wPos.y, 'sun');
        this.actionTimers.set('passiveSun', state.frames);
        this.pulseAnimTimer = 15;
      }
    }

    this.handleGrowth(wPos);
    this.handleFarm(wPos);

    if (!powered || isRetracted || this.isWaterlogged || this.isFrosted) return;

    let anyActionReady = false;
    for (const act of this.config.actionType || []) {
      if (['shoot', 'shootMultiTarget', 'laserBeam', 'pulse', 'spawnBulletAtRandom', 'launch', 'generateElectricChain', 'shield', 'firstStrike'].includes(act)) {
        const lastT = this.actionTimers.get(act) || -99999;
        const cfg = this.config.actionConfig;
        const step = this.actionSteps.get(act) || 0;
        const subStep = this.actionSteps.get(act + '_subStep') || 0;
        
        if (act === 'shootMultiTarget' && subStep > 0) {
          anyActionReady = true;
          break;
        }

        const frValue = (act === 'shoot' || act === 'shootMultiTarget' || act === 'launch' || act === 'launchMultiTarget') ? cfg.shootFireRate : ((act === 'laserBeam') ? cfg.beamFireRate : ((act === 'spawnBulletAtRandom') ? cfg.spawnBulletAtRandom.cooldown : (act === 'generateElectricChain' ? cfg.electricChainDamageRate : (act === 'shield' ? 1 : (act === 'firstStrike' ? cfg.firstStrikeConfig.triggerRate : cfg.pulseCooldown)))));
        const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
        if (state.frames - lastT > (fr / this.fireRateMultiplier)) {
          anyActionReady = true;
          break;
        }
      }
    }

    const range = this.config.actionConfig.shootRange || this.config.actionConfig.beamMaxLength || this.config.actionConfig.pulseTriggerRadius || 300;
    const rangeSq = (range + 10)**2;
    let targetJustDied = false;

    if (this.target) {
      if (this.target === this) {
        if (this.health <= 0) { this.target = null; targetJustDied = true; }
      } else {
        const tc = this.getTargetCenter();
        if (!tc) { 
          this.target = null; targetJustDied = true; 
          this.spinFrames = 0; 
        } else {
          const dSq = (wPos.x - tc.x)**2 + (wPos.y - tc.y)**2;
          const isDead = this.target.isFrosted !== undefined ? (this.target.isFrosted && this.target.iceCubeHealth <= 0) : (this.target.health !== undefined ? this.target.health <= 0 : this.target.isMined);
          const isOutOfRange = dSq > rangeSq;
          const isDying = this.target.isDying === true;
          if (isDead || isOutOfRange || isDying) { 
            this.target = null; targetJustDied = true; 
            this.spinFrames = 0;
          }
        }
      }
    } else {
      this.spinFrames = 0;
    }

    const justDeployed = state.stationaryTimer === (TurretMinScanRate + 1); 
    if (anyActionReady) {
      const staggeredSlot = state.frames % TurretMinScanRate === this.targetScanTimer;
      const urgentNeed = (!this.target && (targetJustDied || justDeployed));
      if (staggeredSlot || urgentNeed) { this.findTarget(); }
    }

    this.executeActions(wPos);
  }

  protected abstract getNearbyTurrets(): Turret[];

  protected executeActions(wPos: any) {
    for (const act of this.config.actionType || []) {
      const lastTrigger = this.actionTimers.get(act) || -99999; 
      const config = this.config.actionConfig;
      const step = this.actionSteps.get(act) || 0;
      const subStepKey = act + '_subStep';
      const curSubStep = this.actionSteps.get(subStepKey) || 0;
      
      if (act === 'die') {
        const dieDur = config.dieAfterDuration;
        const dieAct = config.dieAfterAction;
        const dieCnt = dieAct ? (this.actionSteps.get(dieAct) || 0) : 0;
        let shouldDie = false;
        if (dieDur && this.framesAlive >= dieDur) shouldDie = true;
        if (dieAct && dieCnt && dieCnt >= config.dieAfterActionCount) shouldDie = true;
        if (shouldDie) {
           if (config.pulseBulletTypeKey) {
              let b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, config.pulseBulletTypeKey, 'none'); 
              b.life = 0; state.bullets.push(b);
           }
           this.health = 0;
           this.onDeath();
           return;
        }
      }

      if (act === 'boostPlayer') {
        state.player.applyCondition('c_raged', 15);
        if (state.frames % 10 === 0) {
           state.vfx.push(new MagicLinkVFX(wPos, state.player.pos));
        }
      }

      const frValue = (act === 'shoot' || act === 'shootMultiTarget' || act === 'launch' || act === 'launchMultiTarget') ? config.shootFireRate : ((act === 'laserBeam') ? config.beamFireRate : ((act === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : (act === 'generateElectricChain' ? config.electricChainDamageRate : (act === 'shield' ? 1 : (act === 'firstStrike' ? config.firstStrikeConfig.triggerRate : config.pulseCooldown)))));
      const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
      const effectiveFireRate = fr / this.fireRateMultiplier;
      
      const ready = (state.frames - lastTrigger > effectiveFireRate) || (curSubStep > 0);

      if (act === 'shield' && this.specialActivityLevel > 0.1) {
          const sRadius = config.shieldRadius || GRID_SIZE * 1.5;
          const sRadiusSq = sRadius * sRadius;
          for (let e of state.enemies) {
              if (e.health <= 0 || e.isDying) continue;
              const dx = e.pos.x - wPos.x;
              const dy = e.pos.y - wPos.y;
              const dSq = dx*dx + dy*dy;
              const rSum = (e.size / 2) + sRadius * this.specialActivityLevel;
              if (dSq < rSum * rSum) {
                  const d = Math.sqrt(dSq);
                  const force = (rSum - d) * 0.15;
                  e.moveWithCollisions(createVector(dx/d * force, dy/d * force));
                  this.shieldImpactAngles.push(atan2(dy, dx));
              }
          }
      }

      if (act === 'aura') {
          const cfg = config.auraConfig;
          const auraRadiusSq = cfg.radius * cfg.radius;
          if (this.specialActivityLevel > 0.5) {
            for (let e of state.enemies) {
              if (e.health <= 0 || e.isDying) continue;
              const dx = e.pos.x - wPos.x;
              const dy = e.pos.y - wPos.y;
              if (dx*dx + dy*dy < auraRadiusSq) {
                e.applyCondition(cfg.appliedCondition, cfg.duration);
              }
            }
          }
          // Aura VFX handled in subclasses or visualTurrets
      }

      if (act === 'firstStrike' && ready && this.firstStrikeCount > 0) {
        const fsc = config.firstStrikeConfig;
        if (fsc.actionToTrigger === 'spawnBulletAtRandom') {
            const sbc = config.spawnBulletAtRandom;
            const ang = random(TWO_PI); const r = random(sbc.distRange[0], sbc.distRange[1]);
            const tx = wPos.x + cos(ang) * r; const ty = wPos.y + sin(ang) * r;
            let b = new Bullet(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none'); b.targetPos = createVector(tx, ty);
            state.bullets.push(b); this.recoil = 8;
        }
        this.firstStrikeCount--;
        this.actionTimers.set(act, state.frames);
        this.pulseAnimTimer = 10;
      }

      if (act === 'shoot' && this.target && ready) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
        const targetAngle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x);
        if (config.selfSpinDuration) {
            this.spinFrames++;
            const cycleTime = this.spinFrames;
            const duration = config.selfSpinDuration;
            const speed = config.selfSpinSpeed * TWO_PI / 60; 
            if (config.selfSpinBehavior === 'pingpong') {
                const period = duration * 2;
                const phase = cycleTime % period;
                let offset;
                if (phase < duration) offset = phase * speed;
                else offset = (period - phase) * speed;
                this.angle = targetAngle + offset;
            } else {
                const phase = cycleTime % duration;
                this.angle = targetAngle + (phase * speed);
            }
        } else if (!this.config.randomRotation) {
            this.angle = targetAngle;
        }
        let sa = this.angle + (config.inaccuracy ? random(-radians(config.inaccuracy), radians(config.inaccuracy)) : 0);
        state.bullets.push(new Bullet(wPos.x, wPos.y, wPos.x + cos(sa)*500, wPos.y + sin(sa)*500, config.bulletTypeKey, 'enemy'));
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa)); this.recoil = 6; 
        this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
        this.pulseAnimTimer = 8;
        if (this.config.targetConfig?.enemyPriority === 'random') { this.target = null; this.findTarget(); }
      } 
      else if (act === 'launch' && this.target && ready) {
        const tCenter = this.getTargetCenter(); if (!tCenter) return;
        this.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x);
        let b = new Bullet(wPos.x, wPos.y, tCenter.x, tCenter.y, config.bulletTypeKey, 'enemy');
        b.targetPos = tCenter.copy();
        state.bullets.push(b);
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, this.angle, 32, 10, color(...(config.color || [255,255,255]))));
        this.recoil = 10;
        this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
        this.pulseAnimTimer = 12;
      }
      else if (act === 'shootMultiTarget' && ready) {
        const lastSubKey = act + '_lastSub';
        const subStep = this.actionSteps.get(subStepKey) || 0;
        const lastSub = this.actionTimers.get(lastSubKey) || 0;
        
        if (subStep === 0) {
          const initialTargets = this.findAllTargetsWithin(config.shootRange);
          if (initialTargets.length > 0) { 
            this.actionSteps.set(subStepKey, 1); 
            this.actionTimers.set(lastSubKey, state.frames); 
            this.actionTimers.set(act, state.frames); 
          }
        }
        
        if (subStep > 0) {
          const delay = config.multiTargetShootDelay || 6;
          if (state.frames - lastSub >= delay) {
            const potentialTargets = this.findAllTargetsWithin(config.shootRange);
            if (potentialTargets.length > 0) {
              const targetIdx = (subStep - 1) % potentialTargets.length;
              const target = potentialTargets[targetIdx];
              const tc = target.getWorldPos ? target.getWorldPos() : (target.pos ? createVector(target.pos.x + GRID_SIZE/2, target.pos.y + GRID_SIZE/2) : null);
              if (tc) {
                const sa = atan2(tc.y - wPos.y, tc.x - wPos.x);
                state.bullets.push(new Bullet(wPos.x, wPos.y, tc.x, tc.y, config.bulletTypeKey, 'enemy'));
                state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa));
                this.recoil = 8; this.angle = sa;
                this.pulseAnimTimer = 8;
              }
            }
            this.actionTimers.set(lastSubKey, state.frames);
            const nextStep = subStep + 1;
            const maxCnt = config.multiTargetMaxCount || 3;
            if (nextStep > maxCnt) {
               this.actionSteps.set(subStepKey, 0);
               this.actionSteps.set(act, step + 1);
            }
            else this.actionSteps.set(subStepKey, nextStep);
          }
        }
      } else if (act === 'launchMultiTarget' && ready) {
        const lastSubKey = act + '_lastSub';
        const subStep = this.actionSteps.get(subStepKey) || 0;
        const lastSub = this.actionTimers.get(lastSubKey) || 0;
        
        if (subStep === 0) {
          const initialTargets = this.findAllTargetsWithin(config.shootRange);
          if (initialTargets.length > 0) { 
            this.actionSteps.set(subStepKey, 1); 
            this.actionTimers.set(lastSubKey, state.frames); 
            this.actionTimers.set(act, state.frames); 
          }
        }
        
        if (subStep > 0) {
          const delay = config.multiTargetShootDelay || 6;
          if (state.frames - lastSub >= delay) {
            const potentialTargets = this.findAllTargetsWithin(config.shootRange);
            if (potentialTargets.length > 0) {
              const targetIdx = (subStep - 1) % potentialTargets.length;
              const target = potentialTargets[targetIdx];
              const tc = target.getWorldPos ? target.getWorldPos() : (target.pos ? createVector(target.pos.x + GRID_SIZE/2, target.pos.y + GRID_SIZE/2) : null);
              if (tc) {
                this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x);
                let b = new Bullet(wPos.x, wPos.y, tc.x, tc.y, config.bulletTypeKey, 'enemy');
                b.targetPos = tc.copy();
                state.bullets.push(b);
                state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, this.angle, 32, 10, color(...(config.color || [255,255,255]))));
                this.recoil = 10;
                this.pulseAnimTimer = 12;
              }
            }
            this.actionTimers.set(lastSubKey, state.frames);
            const nextStep = subStep + 1;
            const maxCnt = config.multiTargetMaxCount || 3;
            if (nextStep > maxCnt) {
               this.actionSteps.set(subStepKey, 0);
               this.actionSteps.set(act, step + 1);
            }
            else this.actionSteps.set(subStepKey, nextStep);
          }
        }
      } else if (act === 'laserBeam' && this.target) {
        const targetId = this.target.uid || `${this.target.gx},${this.target.gy}`;
        if (targetId === this.lastTargetUid) this.uninterruptedFrames++;
        else { this.lastTargetUid = targetId; this.uninterruptedFrames = 0; }
        let currentDamage = config.beamDamage;
        if (config.uninteruptedDamageIncrease && config.uninteruptedTimeForDamageIncrease) {
            let cumulativeTime = 0; let foundBracket = -1;
            for (let i = 0; i < config.uninteruptedTimeForDamageIncrease.length; i++) {
                cumulativeTime += config.uninteruptedTimeForDamageIncrease[i];
                if (this.uninterruptedFrames >= cumulativeTime) { currentDamage = config.uninteruptedDamageIncrease[i]; foundBracket = i; }
                else break;
            }
            this.rampFactor = (foundBracket + 1) / config.uninteruptedDamageIncrease.length;
        } else this.rampFactor = 0;

        const tCenter = this.getTargetCenter(); 
        if (tCenter) {
           if (state.frames % 3 === 0) {
               state.vfx.push(new WeldingHitVFX(tCenter.x, tCenter.y, config.color || [255, 255, 100]));
           }
        }

        if (ready) {
            if (!tCenter) return;
            if (!this.config.randomRotation) this.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x); 
            const killed = this.target.takeDamage(currentDamage);

            if (config.beamDamageWidth > 0) {
              const widthSq = config.beamDamageWidth * config.beamDamageWidth;
              for (let e of state.enemies) {
                  if (e === this.target || e.health <= 0 || e.isDying) continue;
                  const dSegSq = this.distToSegmentSq(e.pos, wPos, tCenter);
                  if (dSegSq < (widthSq + e.size**2 * 0.25)) {
                      e.takeDamage(currentDamage);
                      if (config.appliedConditions && e.applyCondition) {
                          for (const cond of config.appliedConditions) e.applyCondition(cond.type, cond.duration, cond);
                      }
                  }
              }
            }
            
            if (config.beamBulletTypeKey && tCenter) {
                let b = new Bullet(tCenter.x, tCenter.y, tCenter.x, tCenter.y, config.beamBulletTypeKey, 'none'); 
                b.life = 0; b.col = config.color || [255,255,255]; state.bullets.push(b);
            }

            if (killed && config.spawnBulletOnTargetDeath) {
                const loc = this.getTargetCenter();
                if (loc) { let b = new Bullet(loc.x, loc.y, loc.x, loc.y, config.spawnBulletOnTargetDeath, 'none'); b.life = 0; b.col = config.color || [255,255,255]; state.bullets.push(b); }
            }
            if (this.target && config.appliedConditions && this.target.applyCondition) {
              for (const cond of config.appliedConditions) this.target.applyCondition(cond.type, cond.duration, cond);
            }
            this.recoil = 2; this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
        }
      } else if (act === 'spawnBulletAtRandom' && ready) {
        const sbc = config.spawnBulletAtRandom;
        let dependencyReady = true;
        if (sbc.enabledWhenActionIsReady) {
            const depAct = sbc.enabledWhenActionIsReady;
            const depLastT = this.actionTimers.get(depAct) || -99999;
            const depStep = this.actionSteps.get(depAct) || 0;
            const depFrValue = (depAct === 'shoot' || depAct === 'shootMultiTarget' || depAct === 'launch') ? config.shootFireRate : 
                               ((depAct === 'laserBeam') ? config.beamFireRate : 
                               ((depAct === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : 
                               (depAct === 'generateElectricChain' ? config.electricChainDamageRate : 
                               (depAct === 'shield' ? 1 : 
                               (depAct === 'firstStrike' ? config.firstStrikeConfig.triggerRate : 
                               config.pulseCooldown)))));
            const depFr = Array.isArray(depFrValue) ? depFrValue[depStep % depFrValue.length] : depFrValue;
            dependencyReady = (state.frames - depLastT > (depFr / this.fireRateMultiplier));
        }

        if (dependencyReady) {
          const ang = random(TWO_PI); const r = random(sbc.distRange[0], sbc.distRange[1]);
          const tx = wPos.x + cos(ang) * r; const ty = wPos.y + sin(ang) * r;
          let b = new Bullet(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none'); b.targetPos = createVector(tx, ty);
          state.bullets.push(b); this.recoil = 8; this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
          this.pulseAnimTimer = 10;
        }
      } else if (act === 'pulse' && ready) {
        let triggered = false;
        const tCenter = this.getTargetCenter();
        if (tCenter) {
          const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
          if (dSq < Math.max(1, config.pulseTriggerRadius * config.pulseTriggerRadius)) triggered = true;
        }
        if (this.type === 't0_starfruit') triggered = true;
        if (triggered) {
          // Jump logic handled in subclasses or base if possible
          if (config.pulseBulletTypeKey) {
            const tCenter = this.getTargetCenter();
            const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
            const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
            let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b);
            this.pulseAnimTimer = 15;
          }
          this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
        }
      } else if (act === 'generateElectricChain') {
          const peers = this.getNearbyTurrets();
          for (let peer of peers) {
              if (peer === this || peer.type !== 't3_tesla' || peer.isFrosted || peer.uid < this.uid) continue;
              const p1 = wPos;
              const p2 = peer.getWorldPos();
              const dSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
              const maxChainRangeSq = (config.electricChainMaxLength || GRID_SIZE * 3)**2;
              if (dSq > maxChainRangeSq) continue;

              if (state.frames % 3 === 0) state.vfx.push(new MagicLinkVFX(p1, p2));

              if (ready) {
                  const dmg = config.electricChainDamage || 10;
                  const widthSq = (config.electricChainDamageWidth || GRID_SIZE)**2;
                  const maxTotalDmg = config.electricChainMaxDamage || 15;

                  for (let e of state.enemies) {
                      if (e.health <= 0 || e.isDying) continue;
                      const dSegSq = this.distToSegmentSq(e.pos, p1, p2);
                      if (dSegSq < (widthSq + e.size**2 * 0.25)) {
                          if ((e as any).elecFrame !== state.frames) { (e as any).elecFrame = state.frames; (e as any).elecDmg = 0; }
                          if ((e as any).elecDmg < maxTotalDmg) {
                              const apply = Math.min(dmg, maxTotalDmg - (e as any).elecDmg);
                              e.takeDamage(apply);
                              (e as any).elecDmg += apply;
                              if (random() < 0.2) state.vfx.push(new SparkVFX(e.pos.x, e.pos.y, 5, [100, 200, 255]));
                          }
                      }
                  }
                  state.world.chunks.forEach((chunk: any) => {
                      chunk.blocks.forEach((b: any) => {
                          if (b.isMined) return;
                          const bc = createVector(b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2);
                          const dSegSq = this.distToSegmentSq(bc, p1, p2);
                          if (dSegSq < (widthSq + GRID_SIZE**2 * 0.25)) {
                              if ((b as any).elecFrame !== state.frames) { (b as any).elecFrame = state.frames; (b as any).elecDmg = 0; }
                              const blockMax = maxTotalDmg * 4;
                              if ((b as any).elecDmg < blockMax) {
                                  const apply = Math.min(dmg * 4, blockMax - (b as any).elecDmg);
                                  b.takeDamage(apply);
                                  (b as any).elecDmg += apply;
                              }
                          }
                      });
                  });
                  this.actionTimers.set(act, state.frames);
              }
          }
      }
    }
  }

  takeDamage(dmg: number) {
    if (this.health <= 0) return false;

    if (this.isFrosted) {
      this.iceCubeHealth -= dmg;
      if (this.iceCubeHealth <= 0) {
        this.isFrosted = false;
        this.frostLevel = 0;
        const wPos = this.getWorldPos();
        state.vfx.push(new BlockDebris(wPos.x, wPos.y, [180, 240, 255]));
        // Clear targets that were targeting this ice cube
        const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()];
        for (let t of allTurrets) if (t.target === this) t.target = null;
        for (let e of state.enemies) if (e.target === this) e.target = null;
        if (state.player.target === this) state.player.target = null;
      }
      return false;
    }

    if (this.config.actionType.includes('farm')) {
      const fCfg = this.config.farmConfig;
      const isHarvestStage = this.farmStage === fCfg.assetImg.length - 1;
      if (isHarvestStage && !fCfg.isMobFarm) {
        if (dmg > 0) {
          this.farmHarvestHp -= dmg;
          this.flashTimer = 8;
          this.flashType = 'damage';
          this.hurtAnimTimer = 10;
          if (this.farmHarvestHp <= 0) {
            this.performHarvest();
          }
        } else if (dmg < 0) {
          this.farmHarvestHp = Math.min(fCfg.harvestStageHp || 100, this.farmHarvestHp - dmg);
          this.flashTimer = 8;
          this.flashType = 'heal';
        }
        return false;
      }
    }

    if (dmg < 0) {
      this.health = Math.min(this.maxHealth, this.health - dmg);
      this.flashTimer = 8;
      this.flashType = 'heal';
      return false;
    }

    this.health -= dmg;
    this.flashTimer = 10;
    this.flashType = 'damage';
    this.hurtAnimTimer = 10;
    const wPos = this.getWorldPos();
    state.vfx.push(new DamageNumberVFX(wPos.x, wPos.y, dmg, [255, 100, 100]));

    if (this.health <= 0) {
      if (this.config.actionType?.includes('onDeathPulse')) {
        const b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, this.config.actionConfig.pulseBulletTypeKey, 'none');
        b.life = 0;
        state.bullets.push(b);
      }
      this.onDeath();
      return true;
    }
    return false;
  }

  get isHarvestReady(): boolean {
    if (!this.config.actionType.includes('farm')) return false;
    const fCfg = this.config.farmConfig;
    return this.farmStage === fCfg.assetImg.length - 1;
  }

  protected abstract performHarvest(): void;

  protected onDeath() {
    const wPos = this.getWorldPos();
    state.vfx.push(new BlockDebris(wPos.x, wPos.y, [100, 100, 100]));
    
    // Drop loot based on config
    if (this.config.lootConfigOnDeath) {
      spawnLootAt(wPos.x, wPos.y, this.type, this.config.lootConfigOnDeath);
    } else if (this.config.drops) {
      // Legacy drops support if any
      for (const [key, count] of Object.entries(this.config.drops)) {
        for (let i = 0; i < (count as number); i++) {
          spawnLootAt(wPos.x, wPos.y, key);
        }
      }
    }
  }

  applyCondition(cKey: string, duration: number, data?: any) {
    const cfg = conditionTypes[cKey];
    if (!cfg) return;
    if (cfg.conditionClashesConfig?.override) {
      for (let ov of cfg.conditionClashesConfig.override) {
        this.conditions.delete(ov);
        this.conditionData.delete(ov + '_dmg');
      }
    }
    this.conditions.set(cKey, Math.max(this.conditions.get(cKey) || 0, duration));
    if (cKey === 'c_burning' && data?.damage !== undefined) {
      const currentMax = this.conditionData.get('c_burning_dmg') || 0;
      this.conditionData.set('c_burning_dmg', Math.max(currentMax, data.damage));
    }
    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) {
      state.vfx.push(new ConditionVFX(this, cKey));
    }
  }

  protected findTarget() {
    const tTypes = this.config.targetType || []; 
    const wPos = this.getWorldPos();
    const tCfg = this.config.targetConfig || {}; 
    const range = this.config.actionConfig.shootRange || this.config.actionConfig.beamMaxLength || this.config.actionConfig.pulseTriggerRadius || 300;
    const rangeSq = Math.max(1, (range + 10)**2);

    if (this.target) {
      if (this.target === this) {
          if (this.health <= 0) this.target = null;
          else return;
      }
      const tCenter = this.getTargetCenter(); 
      if (tCenter) {
        const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
        let valid = this.target.isFrosted !== undefined ? (this.target.isFrosted && this.target.iceCubeHealth > 0) : (this.target.health !== undefined ? this.target.health > 0 : !this.target.isMined);
        if (valid && dSq <= rangeSq && (this.config.actionType.includes('launch') || state.world.checkLOS(wPos.x, wPos.y, tCenter.x, tCenter.y))) return;
      }
      this.target = null;
    }

    // Support for base targeting (healing/self-pulses)
    if (tTypes.includes('turret')) {
        if (range <= GRID_SIZE) {
            this.target = this;
            return;
        }
        const nearby = this.getNearbyTurrets();
        for (let a of nearby) {
            if (a.health <= 0) continue;
            const twPos = a.getWorldPos();
            const dSq = (wPos.x - twPos.x)**2 + (wPos.y - twPos.y)**2;
            if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, twPos.x, twPos.y)) {
                this.target = a;
                this.angle = atan2(twPos.y - wPos.y, twPos.x - wPos.x);
                return;
            }
        }
    }

    // Target frosted allies
    const nearby = this.getNearbyTurrets();
    for (let a of nearby) {
      if (a !== this && a.isFrosted && a.iceCubeHealth > 0) {
        const twPos = a.getWorldPos(); const dSq = (wPos.x - twPos.x)**2 + (wPos.y - twPos.y)**2;
        if (dSq < rangeSq && state.world.checkLOS(wPos.x, wPos.y, twPos.x, twPos.y)) { 
          this.target = a; this.angle = atan2(twPos.y - wPos.y, twPos.x - wPos.x); return; 
        }
      }
    }

    if (tTypes.includes('enemy')) {
      const cs = state.spatialHashCellSize; const gx = floor(wPos.x / cs); const gy = floor(wPos.y / cs);
      const searchRadius = Math.ceil(range / cs);
      const candidates: { e: any, dSq: number }[] = [];
      for (let i = -searchRadius; i <= searchRadius; i++) {
        for (let j = -searchRadius; j <= searchRadius; j++) {
          const cell = state.spatialHash.get(`${gx + i},${gy + j}`);
          if (!cell) continue;
          for (const e of cell) {
            if (!(e instanceof Enemy) || e.health <= 0 || e.isInvisible || e.isDying || e.conditions.has('c_hypnotized')) continue;
            const dSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
            if (dSq <= rangeSq) candidates.push({ e, dSq });
          }
        }
      }
      state.world.chunks.forEach((chunk: any) => {
        const cw = CHUNK_SIZE * GRID_SIZE; const dx = (chunk.cx * cw + cw/2) - wPos.x; const dy = (chunk.cy * cw + cw/2) - wPos.y;
        if (dx*dx + dy*dy > (range + cw)**2) return;
        chunk.overlayBlocks.forEach((b: any) => {
           if (b.isMined || !b.overlay) return;
           const oCfg = overlayTypes[b.overlay];
           if (oCfg?.isEnemy) {
              const bx = b.pos.x + GRID_SIZE/2; const by = b.pos.y + GRID_SIZE/2;
              const dSq = (wPos.x - bx)**2 + (wPos.y - by)**2;
              if (dSq <= rangeSq) candidates.push({ e: b, dSq });
           }
        });
      });

      if (candidates.length > 0) {
        if (tCfg.enemyPriority === 'highestHealth') candidates.sort((a,b) => b.e.health - a.e.health);
        else if (tCfg.enemyPriority === 'random') {
            const chosen = candidates[floor(random(candidates.length))];
            const tc = chosen.e.getWorldPos ? chosen.e.getWorldPos() : (chosen.e.gx !== undefined ? createVector(chosen.e.gx * GRID_SIZE + GRID_SIZE/2, chosen.e.gy * GRID_SIZE + GRID_SIZE/2) : chosen.e.pos);
            if (tc && (this.config.actionType.includes('launch') || state.world.checkLOS(wPos.x, wPos.y, tc.x, tc.y))) { this.target = chosen.e; this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); return; }
        } else candidates.sort((a, b) => a.dSq - b.dSq);
        
        for (const cand of candidates) {
          const tc = cand.e.getWorldPos ? cand.e.getWorldPos() : (cand.e.gx !== undefined ? createVector(cand.e.gx * GRID_SIZE + GRID_SIZE/2, cand.e.gy * GRID_SIZE + GRID_SIZE/2) : cand.e.pos);
          if (!tc) continue;
          if (this.config.actionType.includes('launch') || state.world.checkLOS(wPos.x, wPos.y, tc.x, tc.y)) { this.target = cand.e; this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); return; }
        }
      }
    }

    if (tTypes.includes('obstacle')) {
      let bestObs = null; let bestObsVal = Infinity;
      state.world.chunks.forEach((chunk: any) => {
        const cw = CHUNK_SIZE * GRID_SIZE; const dx = (chunk.cx * cw + cw/2) - wPos.x; const dy = (chunk.cy * cw + cw/2) - wPos.y;
        if (dx*dx + dy*dy > (range + cw)**2) return;
        chunk.blocks.forEach((b: any) => {
          if (b.isMined) return;
          const bcx = b.pos.x + GRID_SIZE/2; const bcy = b.pos.y + GRID_SIZE/2;
          const dSq = (wPos.x - bcx)**2 + (wPos.y - bcy)**2; 
          if (dSq <= rangeSq) {
            const d = Math.sqrt(dSq); 
            const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
            let score = d - (oCfg?.isValuable ? 2000 : 0) - (oCfg?.isEnemy ? 3000 : 0);
            if (score < bestObsVal) {
              if (state.world.checkLOS(wPos.x, wPos.y, bcx, bcy)) { bestObsVal = score; bestObs = b; }
            }
          }
        });
      });
      if (bestObs) { this.target = bestObs; const tc = this.getTargetCenter(); if (tc) this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); }
    }
  }

  protected findAllTargetsWithin(range: number) {
    const wPos = this.getWorldPos();
    return state.enemies.filter((e: any) => {
      if (e.health <= 0 || e.isDying) return false;
      const dSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
      return dSq < (range + 10)**2 && state.world.checkLOS(wPos.x, wPos.y, e.pos.x, e.pos.y);
    });
  }

  protected distToSegmentSq(p: any, v: any, w: any) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
  }

  display() {
    const wPos = this.getWorldPos(); const margin = 100;
    const left = state.cameraPos.x - width/2 - margin; const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin; const bottom = state.cameraPos.y + height/2 + margin;
    if (wPos.x < left || wPos.x > right || wPos.y < top || wPos.y > bottom) return;
    drawTurret(this);
  }

  displayUI() {
    const wPos = this.getWorldPos(); const margin = 100;
    const left = state.cameraPos.x - width/2 - margin; const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin; const bottom = state.cameraPos.y + height/2 + margin;
    if (wPos.x < left || wPos.x > right || wPos.y < top || wPos.y > bottom) return;
    if (drawTurretUI) drawTurretUI(this);
  }
}

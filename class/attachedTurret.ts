
import { state } from '../state';
import { HEX_DIST, GRID_SIZE, HOUR_FRAMES, TurretMinScanRate, CHUNK_SIZE } from '../constants';
import { turretTypes } from '../balanceTurrets';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { MuzzleFlash, Explosion, SparkVFX, BlockDebris, ConditionVFX, MergeVFX, MagicLinkVFX, WeldingHitVFX, FirstStrikeVFX, FrostFieldAuraVFX } from '../vfx';
import { Bullet } from './bullet';
import { SunLoot } from './loot';
import { drawTurret } from '../visualTurrets';
import { TURRET_RECIPES } from '../dictionaryTurretMerging';

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
// Added missing color declaration
declare const color: any;
declare const line: any;
declare const stroke: any;
declare const strokeWeight: any;

export class AttachedTurret {
  uid: string; type: string; config: any; parent: any; hq: number; hr: number; angle: number = 0; alpha: number = 255; health: number; maxHealth: number; offset: any; size: number;
  recoil: number = 0; actionTimers: Map<string, number> = new Map(); 
  actionSteps: Map<string, number> = new Map(); // Step index for fire sequences
  target: any = null;
  isWaterlogged: boolean = false; isFrosted: boolean = false; frostLevel: number = 0; iceCubeHealth: number = 0; fireRateMultiplier: number = 1.0;
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  baseIngredients: string[] = []; // T1 components tracking
  growthProgress: number = 0;
  framesAlive: number = 0;
  flashTimer: number = 0;
  flashType: 'damage' | 'heal' = 'damage';

  // Animation Timers
  hurtAnimTimer: number = 0;
  pulseAnimTimer: number = 0;
  
  // T3 Transition logic
  specialActivityLevel: number = 0; // 0 to 1 for visual transitions (aura/shield)

  // T3 Uninterrupted tracking
  lastTargetUid: string | null = null;
  uninterruptedFrames: number = 0;
  rampFactor: number = 0; // 0 to 1 for visual ramp up

  // T3 Spin tracking
  spinFrames: number = 0; // Continuous elapsed time for phase calculation

  // T3 First Strike tracking
  firstStrikeCount: number = 0;

  // Staggered target scan
  targetScanTimer: number;

  // Animation states
  jumpOffset: any = null;
  jumpFrames: number = 0;
  jumpTargetPos: any = null;

  // T3 Holonut Impact Tracking
  shieldImpactAngles: number[] = [];

  constructor(type: string, parent: any, hq: number, hr: number) {
    this.uid = Math.random().toString(36).substr(2, 9); this.type = type; this.config = turretTypes[type]; this.parent = parent; this.hq = hq; this.hr = hr;
    this.size = this.config.size; this.health = this.config.health; this.maxHealth = this.health;
    this.offset = createVector(HEX_DIST * (1.5 * hq), HEX_DIST * (Math.sqrt(3)/2 * hq + Math.sqrt(3) * hr));
    this.targetScanTimer = floor(random(TurretMinScanRate));

    // Resolve ingredients for merging logic
    if (this.config.tier === 1) {
      this.baseIngredients = [this.type];
    } else if (this.config.tier === 2) {
      const recipe = TURRET_RECIPES.find(r => r.id === this.type);
      if (recipe) {
        this.baseIngredients = [...recipe.ingredients];
        while (this.baseIngredients.length < recipe.totalCount) {
          this.baseIngredients.push(recipe.ingredients[0]);
        }
      }
    }

    if (this.config.actionType.includes('firstStrike')) {
      this.firstStrikeCount = this.config.actionConfig.firstStrikeConfig.triggerCount;
      if (this.config.actionConfig.firstStrikeConfig.FirstStrikeVfx === 'turret_first_strike') {
        state.vfx.push(new FirstStrikeVFX(this));
      }
    }

    if (this.config.actionConfig?.hasUnarmedAsset) {
      for (const act of this.config.actionType || []) {
        if (act === 'pulse' || act === 'shoot' || act === 'spawnBulletAtRandom' || act === 'launch' || act === 'shootMultiTarget') {
          this.actionTimers.set(act, state.frames);
        }
      }
    }
  }
  
  getWorldPos() { return p5.Vector.add(this.parent.pos, this.offset); }
  getTargetCenter() { 
    if (!this.target) return null; 
    if (this.target === this) return this.getWorldPos(); // Self targeting support
    if (this.target.getWorldPos) return this.target.getWorldPos(); 
    if (this.target.gx !== undefined) return createVector(this.target.gx * GRID_SIZE + GRID_SIZE/2, this.target.gy * GRID_SIZE + GRID_SIZE/2); 
    return this.target.pos ? this.target.pos.copy() : null; 
  }
  
  applyCondition(cKey: string, duration: number, data?: any) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
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

    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) state.vfx.push(new ConditionVFX(this, cKey));
  }

  update() {
    if (this.health <= 0) return;
    this.framesAlive++;
    if (this.flashTimer > 0) this.flashTimer--;
    if (this.hurtAnimTimer > 0) this.hurtAnimTimer--;
    if (this.pulseAnimTimer > 0) this.pulseAnimTimer--;
    this.shieldImpactAngles = []; // Clear every frame

    const wPos = this.getWorldPos(); const gx = floor(wPos.x / GRID_SIZE); const gy = floor(wPos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    this.fireRateMultiplier = lData?.liquidConfig?.turretFireRateMultiplier ?? 1.0;
    
    const groundTurret = this.parent.attachments.find((a: any) => 
      a.hq === this.hq && 
      a.hr === this.hr && 
      a.config.turretLayer === 'ground'
    );
    const isProtectedByLilypad = groundTurret && groundTurret.type === 't_lilypad';
    this.isWaterlogged = (liquidType === 'l_water') && !isProtectedByLilypad;
    
    if (lData?.liquidConfig?.liquidDamageConfig?.turret) {
      const cfg = lData.liquidConfig.liquidDamageConfig.turret;
      if (state.frames % cfg.damageInterval === 0) {
          const dmg = state.isStationary 
            ? (cfg.damageWhileStationary ?? 0) + this.maxHealth * (cfg.damageAsMaxHpWhileStationary ?? 0)
            : (cfg.damageWhileMoving ?? 0);
          if (dmg > 0) this.takeDamage(dmg);
          if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || cfg.damageInterval * 2, { damage: dmg });
      }
    }

    if (liquidType === 'l_ice') { if (state.isStationary && !this.isFrosted) { this.frostLevel = Math.min(1, this.frostLevel + (1 / 900)); if (this.frostLevel >= 1) { this.isFrosted = true; this.iceCubeHealth = 100; } } } else if (!this.isFrosted) { this.frostLevel = Math.max(0, this.frostLevel - (1 / 300)); }
    
    this.applyObstacleRepulsion(wPos);

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

    if (this.config.actionType.includes('passiveSun')) {
      const lastTrigger = this.actionTimers.get('passiveSun') || 0;
      if (state.frames - lastTrigger > this.config.actionConfig.sunCooldown) {
        state.loot.push(new SunLoot(wPos.x, wPos.y, 1));
        state.sunSpawnedTotal += 1;
        this.actionTimers.set('passiveSun', state.frames);
        this.pulseAnimTimer = 15;
      }
    }

    if (this.type === 't_seed' || this.type === 't_seed2') {
      const gCfg = this.config.actionConfig;
      const interval = gCfg.growthInterval || 150;
      if (state.frames % interval === 0) {
        let gain = 1;
        if (this.isWaterlogged) gain = 4;
        this.growthProgress += gain;
        if (this.growthProgress >= (gCfg.maxGrowth || 32)) {
          let pool = ['t_pea', 't_laser', 't_wall', 't_mine', 't_ice'];
          if (this.type === 't_seed2') {
             pool = ['t2_repeater', 't2_firepea', 't2_laser2', 't2_peanut', 't2_puncher', 't2_tall', 't2_mortar', 't2_pulse', 't2_laserexplode', 't2_minespawner', 't2_snowpea', 't2_iceray', 't2_spike', 't2_icebomb', 't2_stun'];
          }
          const chosen = pool[floor(random(pool.length))];
          const index = this.parent.attachments.indexOf(this);
          if (index !== -1) {
            const nt = new AttachedTurret(chosen, this.parent, this.hq, this.hr);
            this.parent.attachments[index] = nt;
            state.vfx.push(new MergeVFX(wPos.x, wPos.y));
          }
        }
      }
    }

    const isRetracted = !state.isStationary && !this.config.isActiveWhileMoving;
    const targetAlpha = isRetracted ? 127 : (this.isWaterlogged ? 100 : 255);
    this.alpha = lerp(this.alpha, targetAlpha, 0.1); 
    this.recoil = (this.recoil || 0) * 0.85;
    
    if (this.jumpFrames > 0) {
      this.jumpFrames--;
      if (this.jumpTargetPos) {
        const progress = 1 - (this.jumpFrames / 20);
        this.jumpOffset = p5.Vector.sub(this.jumpTargetPos, wPos).mult(sin(progress * Math.PI));
      }
      if (this.jumpFrames === 0) {
        const config = this.config.actionConfig;
        const tCenter = this.jumpTargetPos;
        if (config.pulseBulletTypeKey) {
            const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
            const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
            let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b);
            this.pulseAnimTimer = 15;
        }
        this.jumpOffset = null; this.jumpTargetPos = null;
      }
    }

    // UPDATE TRANSITION LEVELS
    const shouldBeSpecialActive = state.isStationary && !this.isWaterlogged && !this.isFrosted;
    this.specialActivityLevel = lerp(this.specialActivityLevel, shouldBeSpecialActive ? 1 : 0, 0.1);

    if (isRetracted || this.isWaterlogged || this.isFrosted) return;
    
    let anyActionReady = false;
    for (const act of this.config.actionType || []) {
      if (['shoot', 'shootMultiTarget', 'laserBeam', 'pulse', 'spawnBulletAtRandom', 'launch', 'generateElectricChain', 'shield', 'firstStrike'].includes(act)) {
        const lastT = this.actionTimers.get(act) || -99999;
        const cfg = this.config.actionConfig;
        const step = this.actionSteps.get(act) || 0;
        const subStep = this.actionSteps.get(act + '_subStep') || 0;
        
        // Multi-actions remain "ready" if they are already in the middle of a sequence
        if (act === 'shootMultiTarget' && subStep > 0) {
          anyActionReady = true;
          break;
        }

        const frValue = (act === 'shoot' || act === 'shootMultiTarget' || act === 'launch') ? cfg.shootFireRate : ((act === 'laserBeam') ? cfg.beamFireRate : ((act === 'spawnBulletAtRandom') ? cfg.spawnBulletAtRandom.cooldown : (act === 'generateElectricChain' ? cfg.electricChainDamageRate : (act === 'shield' ? 1 : (act === 'firstStrike' ? cfg.firstStrikeConfig.triggerRate : cfg.pulseCooldown)))));
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
          // Self target is never out of range or dead unless health <= 0
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
           return;
        }
      }

      if (act === 'boostPlayer') {
        state.player.applyCondition('c_raged', 15);
        if (state.frames % 10 === 0) {
           state.vfx.push(new MagicLinkVFX(wPos, state.player.pos));
        }
      }

      const frValue = (act === 'shoot' || act === 'shootMultiTarget' || act === 'launch') ? config.shootFireRate : ((act === 'laserBeam') ? config.beamFireRate : ((act === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : (act === 'generateElectricChain' ? config.electricChainDamageRate : (act === 'shield' ? 1 : (act === 'firstStrike' ? config.firstStrikeConfig.triggerRate : config.pulseCooldown)))));
      const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
      const effectiveFireRate = fr / this.fireRateMultiplier;
      
      // Ready if cooldown elapsed OR if we are in the middle of a sub-sequence
      const ready = (state.frames - lastTrigger > effectiveFireRate) || (curSubStep > 0);

      if (act === 'shield' && this.specialActivityLevel > 0.1) {
          // Continuous repulsion logic while stationary
          const sRadius = config.shieldRadius || GRID_SIZE * 1.5;
          const sRadiusSq = sRadius * sRadius;
          for (let e of state.enemies) {
              if (e.health <= 0 || e.isDying) continue;
              const dx = e.pos.x - wPos.x;
              const dy = e.pos.y - wPos.y;
              const dSq = dx*dx + dy*dy;
              const rSum = (e.size / 2) + sRadius * this.specialActivityLevel; // Shield radius scales during transition
              if (dSq < rSum * rSum) {
                  const d = Math.sqrt(dSq);
                  const force = (rSum - d) * 0.15;
                  e.moveWithCollisions(createVector(dx/d * force, dy/d * force));
                  
                  // NEW: Track impact angle for visual feedback
                  this.shieldImpactAngles.push(atan2(dy, dx));
              }
          }
      }

      if (act === 'aura') {
          const cfg = config.auraConfig;
          const auraRadiusSq = cfg.radius * cfg.radius;
          
          // Gameplay effect only if visually present
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
          
          if (cfg.auraVfx === 'aura_frostfield') {
            if (!state.vfx.some((v: any) => v instanceof FrostFieldAuraVFX && v.target === this)) {
              state.vfx.push(new FrostFieldAuraVFX(this, cfg.radius));
            }
          }
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
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, this.angle, 32, 10, color(config.color || [255,255,255])));
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
            // Crucial: only reset the MAIN timer when we START the sequence
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
              const tc = target.pos || (target.getWorldPos ? target.getWorldPos() : null);
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
               this.actionSteps.set(act, step + 1); // Sequence complete
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

            // AREA DAMAGE ALONG BEAM
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
            
            // BEAM BULLET Logic (T3 AOE Laser)
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
      } else if (act === 'pulse' && ready && this.jumpFrames === 0) {
        let triggered = false;
        const tCenter = this.getTargetCenter();
        if (tCenter) {
          const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
          if (dSq < Math.max(1, config.pulseTriggerRadius * config.pulseTriggerRadius)) triggered = true;
        }
        
        if (this.type === 't0_starfruit') triggered = true;
        if (triggered) {
          if (config.pulseTurretJumpAtTriggerSource && this.getTargetCenter()) { this.jumpFrames = 20; this.jumpTargetPos = this.getTargetCenter()?.copy(); }
          else if (config.pulseBulletTypeKey) {
            const tCenter = this.getTargetCenter();
            const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
            const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
            let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b);
            this.pulseAnimTimer = 15;
          }
          this.actionTimers.set(act, state.frames); this.actionSteps.set(act, step + 1);
        }
      } else if (act === 'generateElectricChain') {
          // Iterate over other Teslas to create links
          for (let peer of this.parent.attachments) {
              if (peer === this || peer.type !== 't3_tesla' || peer.isFrosted || peer.uid < this.uid) continue;
              const p1 = wPos;
              const p2 = peer.getWorldPos();
              const dSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
              
              // NEW: Use electricChainMaxLength from config (defaulting to 3 tiles if missing)
              const maxChainRangeSq = (config.electricChainMaxLength || GRID_SIZE * 3)**2;
              if (dSq > maxChainRangeSq) continue;

              // Visually draw the chain
              if (state.frames % 3 === 0) {
                  state.vfx.push(new MagicLinkVFX(p1, p2));
              }

              // Damage check
              if (ready) {
                  const dmg = config.electricChainDamage || 10;
                  const widthSq = (config.electricChainDamageWidth || GRID_SIZE)**2;
                  
                  // NEW: Global damage cutoff tracker
                  const maxTotalDmg = config.electricChainMaxDamage || 15;

                  // Check enemies for intersection with line segment p1-p2
                  for (let e of state.enemies) {
                      if (e.health <= 0 || e.isDying) continue;
                      const dSegSq = this.distToSegmentSq(e.pos, p1, p2);
                      if (dSegSq < (widthSq + e.size**2 * 0.25)) {
                          // APPLY GLOBAL CUTOFF
                          if (e.elecFrame !== state.frames) { e.elecFrame = state.frames; e.elecDmg = 0; }
                          if (e.elecDmg < maxTotalDmg) {
                              const apply = Math.min(dmg, maxTotalDmg - e.elecDmg);
                              e.takeDamage(apply);
                              e.elecDmg += apply;
                              if (random() < 0.2) state.vfx.push(new SparkVFX(e.pos.x, e.pos.y, 5, [100, 200, 255]));
                          }
                      }
                  }
                  // Check blocks
                  state.world.chunks.forEach((chunk: any) => {
                      chunk.blocks.forEach((b: any) => {
                          if (b.isMined) return;
                          const bc = createVector(b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2);
                          const dSegSq = this.distToSegmentSq(bc, p1, p2);
                          if (dSegSq < (widthSq + GRID_SIZE**2 * 0.25)) {
                              // APPLY GLOBAL CUTOFF (x4 for blocks as per original logic, but relative to cutoff)
                              if (b.elecFrame !== state.frames) { b.elecFrame = state.frames; b.elecDmg = 0; }
                              const blockMax = maxTotalDmg * 4;
                              if (b.elecDmg < blockMax) {
                                  const apply = Math.min(dmg * 4, blockMax - b.elecDmg);
                                  b.takeDamage(apply);
                                  b.elecDmg += apply;
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

  // Helper for line-segment distance checking (used by Tesla and wide Lasers)
  private distToSegmentSq(p: any, v: any, w: any) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return (p.x - v.x)**2 + (p.y - v.y)**2;
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
  }

  applyObstacleRepulsion(wPos: any) {
    const gx = floor(wPos.x / GRID_SIZE); const gy = floor(wPos.y / GRID_SIZE);
    const myRadius = this.size * 0.45; const blockRadius = GRID_SIZE * 0.5;
    const minSafeDist = myRadius + blockRadius;
    for (let i = gx - 1; i <= gx + 1; i++) for (let j = gy - 1; j <= gy + 1; j++) {
      const bx = i * GRID_SIZE + GRID_SIZE/2; const by = j * GRID_SIZE + GRID_SIZE/2;
      if (state.world.isBlockAt(bx, by)) {
        const dx = wPos.x - bx; const dy = wPos.y - by; const dSq = dx*dx + dy*dy;
        if (dSq < minSafeDist * minSafeDist && dSq > 0.01) { 
          const d = Math.sqrt(dSq); const overlap = minSafeDist - d;
          const pushX = (dx / d) * (overlap + 0.05); const pushY = (dy / d) * (overlap + 0.05);
          this.parent.pos.x += pushX; this.parent.pos.y += pushY; 
        }
      }
    }
  }

  findAllTargetsWithin(range: number) {
    const wPos = this.getWorldPos(); const rangeSq = range * range;
    const tTypes = this.config.targetType || []; const results: any[] = [];
    if (tTypes.includes('enemy')) {
      const cs = state.spatialHashCellSize; const gx = floor(wPos.x / cs); const gy = floor(wPos.y / cs);
      const searchRadius = Math.ceil(range / cs);
      for (let i = -searchRadius; i <= searchRadius; i++) {
        for (let j = -searchRadius; j <= searchRadius; j++) {
          const neighbors = state.spatialHash.get(`${gx + i},${gy + j}`);
          if (!neighbors) continue;
          for (const e of neighbors) {
            if (e.health <= 0 || e.isInvisible || e.isDying) continue;
            const dSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
            if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, e.pos.x, e.pos.y)) results.push(e);
          }
        }
      }
    }
    results.sort((a, b) => { const posA = a.pos; const posB = b.pos; const dSqA = (wPos.x - posA.x)**2 + (wPos.y - posA.y)**2; const dSqB = (wPos.x - posB.x)**2 + (wPos.y - posB.y)**2; return dSqA - dSqB; });
    return results;
  }

  findTarget() {
    const tTypes = this.config.targetType || []; const wPos = this.getWorldPos();
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
        // High priority: target self for healing if pulseTriggerRadius is small
        if (range <= GRID_SIZE) {
            this.target = this;
            return;
        }
        // Otherwise look for neighbor attachments
        for (let a of this.parent.attachments) {
            if (a.health <= 0) continue;
            const twPos = a.getWorldPos();
            // FIX: Changed 'this.pos' (undefined) to 'wPos'
            const dSq = (wPos.x - twPos.x)**2 + (wPos.y - twPos.y)**2;
            if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, twPos.x, twPos.y)) {
                this.target = a;
                this.angle = atan2(twPos.y - wPos.y, twPos.x - wPos.x);
                return;
            }
        }
    }

    for (let a of this.parent.attachments) {
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
            if (e.health <= 0 || e.isInvisible || e.isDying) continue;
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
              // FIX: Changed 'bcy' to 'by' to resolve undefined name error
              const dSq = (wPos.x - bx)**2 + (wPos.y - by)**2;
              if (dSq <= rangeSq) candidates.push({ e: b, dSq });
           }
        });
      });

      if (candidates.length > 0) {
        if (tCfg.enemyPriority === 'highestHealth') candidates.sort((a,b) => b.e.health - a.e.health);
        else if (tCfg.enemyPriority === 'random') {
            const chosen = candidates[floor(random(candidates.length))];
            const tc = chosen.e.pos || chosen.e.getWorldPos?.();
            if (tc && (this.config.actionType.includes('launch') || state.world.checkLOS(wPos.x, wPos.y, tc.x, tc.y))) { this.target = chosen.e; this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); return; }
        } else candidates.sort((a, b) => a.dSq - b.dSq);
        
        for (const cand of candidates) {
          const tc = cand.e.pos || cand.e.getWorldPos?.();
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
          // Fixed typo: used 'wPos.y' instead of 'this.pos.y' as AttachedTurret does not have 'pos'
          const dSq = (wPos.x - bcx)**2 + (wPos.y - bcy)**2; 
          if (dSq <= rangeSq) {
            const d = Math.sqrt(dSq); const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
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

  takeDamage(d: number) { 
    if (this.isFrosted) { this.iceCubeHealth -= d; if (this.iceCubeHealth <= 0) { this.isFrosted = false; this.frostLevel = 0; state.vfx.push(new BlockDebris(this.getWorldPos().x, this.getWorldPos().y, [180, 240, 255])); for (let a of this.parent.attachments) if (a.target === this) a.target = null; if (state.player.target === this) state.player.target = null; } return; }
    if (d < 0) { this.health = Math.min(this.maxHealth, this.health - d); this.flashTimer = 8; this.flashType = 'heal'; return; } 
    else if (d > 0) { this.flashTimer = 8; this.flashType = 'damage'; this.hurtAnimTimer = 10; }
    this.health = Math.max(0, this.health - d); 
    if (this.health <= 0 && this.config.actionType?.includes('onDeathPulse')) { 
      let wPos = this.getWorldPos(); let b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, this.config.actionConfig.pulseBulletTypeKey, 'none'); b.life = 0; state.bullets.push(b); 
    }
  }
  display() {
    const wPos = this.getWorldPos(); const margin = 100;
    const left = state.cameraPos.x - width/2 - margin; const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin; const bottom = state.cameraPos.y + height/2 + margin;
    if (wPos.x < left || wPos.x > right || wPos.y < top || wPos.y > bottom) return;
    drawTurret(this);
  }
}

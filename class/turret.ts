
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
import { triggerUpgradeHook, recalculateTurretStats, getNeighbors } from '../src/upgrades';
import { Enemy } from './enemy';
import { drawTurret, drawTurretUI } from '../visualTurrets';
import { TurretAction } from './turretAction';
import { TurretHub } from './turret/hub';

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
  actions: TurretAction[] = [];
  actionLocks: Set<string> = new Set();
  target: any = null;
  isWaterlogged: boolean = false;
  isFrosted: boolean = false;
  frostLevel: number = 0;
  iceCubeHealth: number = 0;
  fireRateMultiplier: number = 1.0;
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  framesAlive: number = 0;
  boostedActiveFrame: number = -1;
  flashTimer: number = 0;
  flashType: 'damage' | 'heal' = 'damage';
  hurtAnimTimer: number = 0;
  pulseAnimTimer: number = 0;
  specialActivityLevel: number = 0;
  isDying: boolean = false;
  killCount: number = 0;
  shotCount: number = 0;
  actionCount: Map<string, number> = new Map();
  recoilOffset: number = 0;
  lastTargetUid: string | null = null;
  uninterruptedFrames: number = 0;
  rampFactor: number = 0;
  spinFrames: number = 0;
  firstStrikeCount: number = 0;
  targetScanTimer: number;
  customData: any = {};

  // Jump tracking
  jumpOffset: any = null;
  jumpFrames: number = 0;
  jumpTargetPos: any = null;

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
  activeStats: any = {
    damageMult: 1.0,
    firerateMult: 1.0,
    healthMult: 1.0,
    rangeMult: 1.0,
    healthAdd: 0,
    damageAdd: 0,
    shieldRadius: 0,
  };

  get stats() {
    return this.activeStats;
  }

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

    this.initActions();
  }

  initActions() {
    this.actions = TurretHub.getActions(this);
  }

  refreshActions() {
    this.initActions();
  }

  // Custom logic hooks
  customInit() {}
  customUpdate() {}
  customOnActionComplete(actionType: string) {}
  customOnActionStep(actionType: string, step: number) {}
  customOnActionExecute(actionType: string) {}
  customOnDamage(dmg: number, source?: any): boolean { return false; }
  customOnDeath() {}

  // Hooks for specific turret logic
  onActionComplete(actionType: string) {
    this.customOnActionComplete(actionType);
  }
  onActionStep(actionType: string, step: number) {
    this.customOnActionStep(actionType, step);
  }
  onActionExecute(actionType: string) {
    this.customOnActionExecute(actionType);
  }

  onTargetKilled(target: any) {
    for (const action of this.actions) {
      action.onTargetKilled(target);
    }
  }

  isActionLocked(tags: string[]): boolean {
    for (const tag of tags) {
      if (this.actionLocks.has(tag)) return true;
    }
    return false;
  }

  lockActions(tags: string[]) {
    for (const tag of tags) {
      this.actionLocks.add(tag);
    }
  }

  unlockActions(tags: string[]) {
    for (const tag of tags) {
      this.actionLocks.delete(tag);
    }
  }

  abstract getWorldPos(): any;
  abstract replaceWith(type: string): void;
  
  getTargetCenter() {
    if (!this.target) return null;
    if (this.target === this) return this.getWorldPos();
    if (this.target.getWorldPos) return this.target.getWorldPos();
    if (this.target.gx !== undefined) return createVector(this.target.gx * GRID_SIZE + GRID_SIZE / 2, this.target.gy * GRID_SIZE + GRID_SIZE / 2);
    return this.target.pos ? this.target.pos.copy() : null;
  }

  abstract isPowered(): boolean;
  abstract isAttachedToPlayer(): boolean;

  isActive() {
    if (this.isDying) return false;
    if (this.health <= 0) return false;
    
    // Check for custom override
    const customActive = this.customIsActive();
    if (customActive !== null) return customActive;

    // Check for temporary boost
    if (this.boostedActiveFrame === state.frames) return true;

    if (!state.isStationary && !this.config.isActiveWhileMoving && this.isAttachedToPlayer()) {
      return false;
    }
    return true;
  }

  customIsActive(): boolean | null { return null; }

  update() {
    if (this.health <= 0) {
      if (!this.isDying) {
        const dieActions = this.actions.filter(a => a.tags.includes('die'));
        if (dieActions.length > 0) {
          for (const da of dieActions) {
            da.performExecute();
          }
        } else {
          triggerUpgradeHook('onDeath', this, { target: this, targetType: 'turret', typeName: this.type });
          this.onDeath();
        }
      }
      return;
    }
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
    
    // Custom logic update
    this.customUpdate();

    // Update new action system
    for (const action of this.actions) {
      action.update();
    }

    this.updateActions(wPos);
  }

  protected abstract updateEnvironment(gx: number, gy: number, liquidType: string | null, lData: any): void;

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

    if (!powered || isRetracted || this.isFrosted) return;
    
    // Growth turrets can still grow while waterlogged (water speeds them up)
    const isGrowthTurret = this.config.actionType.includes('growth');
    if (this.isWaterlogged && !isGrowthTurret) return;

    let anyActionReady = false;
    let anyActionNeedsTarget = false;
    let maxRange = 0;

    for (const action of this.actions) {
      if (action.needsTarget()) {
        maxRange = Math.max(maxRange, action.getRange());
        anyActionNeedsTarget = true;
      }
      if (action.isReady()) {
        anyActionReady = true;
      }
    }

    const range = maxRange * (this.activeStats?.rangeMult || 1.0);
    const rangeSq = (range + 10)**2;

    if (this.target) {
      if (this.target === this) {
        if (this.health <= 0) { this.target = null; }
      } else {
        const tc = this.getTargetCenter();
        if (!tc) { 
          this.target = null; 
          this.spinFrames = 0; 
        } else {
          const dSq = (wPos.x - tc.x)**2 + (wPos.y - tc.y)**2;
          const isDead = this.target.isFrosted !== undefined ? (this.target.isFrosted && this.target.iceCubeHealth <= 0) : (this.target.health !== undefined ? this.target.health <= 0 : this.target.isMined);
          const isOutOfRange = dSq > rangeSq;
          const isDying = this.target.isDying === true;
          if (isDead || isOutOfRange || isDying) { 
            this.target = null; 
            this.spinFrames = 0;
          }
        }
      }
    } else {
      this.spinFrames = 0;
    }

    if (anyActionNeedsTarget) {
      const staggeredSlot = state.frames % TurretMinScanRate === this.targetScanTimer;
      if (staggeredSlot) { this.findTarget(); }
    }

    this.executeActions(wPos);
  }

  protected abstract getNearbyTurrets(): Turret[];

  protected executeActions(wPos: any) {
    // Execute new action system
    for (const action of this.actions) {
      if (action.canExecute()) {
        action.execute();
      }
    }
  }

  takeDamage(dmg: number, source?: any) {
    if (this.health <= 0) return false;

    // Damage absorption logic
    const myUpgrades = state.turretUpgrades[this.type] || [];
    if (!myUpgrades.includes('u_absorb_neighbor_dmg')) {
      const neighbors = getNeighbors(this);
      const absorbers = neighbors.filter(n => (state.turretUpgrades[n.type] || []).includes('u_absorb_neighbor_dmg'));
      if (absorbers.length > 0) {
        const sharedDmg = dmg / absorbers.length;
        for (const absorber of absorbers) {
          absorber.takeDamage(sharedDmg, source);
        }
        return false; 
      }
    }

    if (this.customOnDamage(dmg, source)) return false;

    for (const action of this.actions) {
      if (action.onDamage(dmg, source)) return false;
    }

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

        // Trigger onMine hook if it was an ice cube
        if (source) {
          triggerUpgradeHook('onMine', source, { target: this, targetType: 'icecube', typeName: 'icecube' });
        }
      }
      return false;
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
      // Trigger Hooks
      if (source) {
        triggerUpgradeHook('onKill', source, { target: this, targetType: 'turret', typeName: this.type });
      }
      
      const dieActions = this.actions.filter(a => a.tags.includes('die'));
      if (dieActions.length > 0) {
        for (const da of dieActions) {
          da.performExecute();
        }
      } else {
        triggerUpgradeHook('onDeath', this, { target: this, targetType: 'turret', typeName: this.type });
        this.onDeath();
      }
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

  public onDeath() {
    if (this.isDying) return;
    this.isDying = true;
    this.health = 0;
    
    this.customOnDeath();

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

  public findTarget() {
    const tTypes = this.config.targetType || []; 
    const wPos = this.getWorldPos();
    const tCfg = this.config.targetConfig || {}; 
    
    let maxRange = 0;
    for (const action of this.actions) {
      if (action.needsTarget()) {
        maxRange = Math.max(maxRange, action.getRange());
      }
    }
    
    const range = maxRange * (this.activeStats?.rangeMult || 1.0);
    const rangeSq = Math.max(1, (range + 10)**2);

    let anyActionNoLOS = false;
    let anyActionRotationLock = false;
    for (const action of this.actions) {
      if (action.needsTarget()) {
        if (!action.needsLOS()) anyActionNoLOS = true;
        if (action.needsRotationLock()) anyActionRotationLock = true;
      }
    }

    if (this.target) {
      if (this.target === this) {
          if (this.health <= 0) this.target = null;
          else return;
      }
      const tCenter = this.getTargetCenter(); 
      if (tCenter) {
        const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
        let valid = this.target.isFrosted !== undefined 
          ? (this.target.isFrosted && this.target.iceCubeHealth > 0) 
          : (this.target.health !== undefined 
              ? this.target.health > 0 
              : (!this.target.isMined && this.target.config?.isValidTarget !== false && (!this.target.overlay || overlayTypes[this.target.overlay]?.isValidTarget !== false)));
        if (valid && dSq <= rangeSq && (anyActionNoLOS || state.world.checkLOS(wPos.x, wPos.y, tCenter.x, tCenter.y))) return;
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
                if (!anyActionRotationLock) this.angle = atan2(twPos.y - wPos.y, twPos.x - wPos.x);
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
          this.target = a; if (!anyActionRotationLock) this.angle = atan2(twPos.y - wPos.y, twPos.x - wPos.x); return; 
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
            if (!(e instanceof Enemy) || e.health <= 0 || e.isDying || e.conditions.has('c_hypnotized')) continue;
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
            const tc = chosen.e.getWorldPos ? chosen.e.getWorldPos() : (chosen.e.gx !== undefined ? createVector(chosen.e.gx * GRID_SIZE + GRID_SIZE / 2, chosen.e.gy * GRID_SIZE + GRID_SIZE / 2) : chosen.e.pos);
            if (tc && (anyActionNoLOS || state.world.checkLOS(wPos.x, wPos.y, tc.x, tc.y))) { 
              this.target = chosen.e; 
              if (!anyActionRotationLock) this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); 
              return; 
            }
        } else candidates.sort((a, b) => a.dSq - b.dSq);
        
        for (const cand of candidates) {
          const tc = cand.e.getWorldPos ? cand.e.getWorldPos() : (cand.e.gx !== undefined ? createVector(cand.e.gx * GRID_SIZE + GRID_SIZE/2, cand.e.gy * GRID_SIZE + GRID_SIZE/2) : cand.e.pos);
          if (!tc) continue;
          if (anyActionNoLOS || state.world.checkLOS(wPos.x, wPos.y, tc.x, tc.y)) { 
            this.target = cand.e; 
            if (!anyActionRotationLock) this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); 
            return; 
          }
        }
      }
    }

    if (tTypes.includes('obstacle')) {
      let bestObs = null; let bestObsVal = Infinity;
      state.world.chunks.forEach((chunk: any) => {
        const cw = CHUNK_SIZE * GRID_SIZE; const dx = (chunk.cx * cw + cw/2) - wPos.x; const dy = (chunk.cy * cw + cw/2) - wPos.y;
        if (dx*dx + dy*dy > (range + cw)**2) return;
        chunk.blocks.forEach((b: any) => {
          if (b.isMined || b.type === 'o_barrier' || b.config?.isValidTarget === false || b.isValidTarget === false) return;
          const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
          if (oCfg?.isValidTarget === false) return;
          const bcx = b.pos.x + GRID_SIZE/2; const bcy = b.pos.y + GRID_SIZE/2;
          const dSq = (wPos.x - bcx)**2 + (wPos.y - bcy)**2; 
          if (dSq <= rangeSq) {
            const d = Math.sqrt(dSq); 
            let score = d - (oCfg?.isValuable ? 2000 : 0) - (oCfg?.isEnemy ? 3000 : 0);
            if (b.overlay === 'sunGenerator') {
              score += 10000; // Prioritized at the bottom of target priority list
            }
            if (score < bestObsVal) {
              if (anyActionNoLOS || state.world.checkLOS(wPos.x, wPos.y, bcx, bcy)) { bestObsVal = score; bestObs = b; }
            }
          }
        });
      });
      if (bestObs) { 
        this.target = bestObs; 
        const tc = this.getTargetCenter(); 
        if (tc && !anyActionRotationLock) this.angle = atan2(tc.y - wPos.y, tc.x - wPos.x); 
      }
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

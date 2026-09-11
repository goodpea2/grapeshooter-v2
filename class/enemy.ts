
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, EnemyCollideRadiusCheck } from '../constants';
import { enemyTypes } from '../balanceEnemies';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { eventBus } from '../src/events/eventBus';
import {
  BugSplatVFX,
  BugSplatVFX2,
  BugSplatVFX3,
  BugSplatTinyVfx,
  BugSplatMeatChunkVfx,
  BugSplatMeatChunkGiantVfx,
  spawnBugSplatVFX,
  spawnBugSplatVFX2,
  spawnBugSplatVFX3,
  spawnBugSplatTinyVFX,
  spawnBugSplatMeatChunkVFX,
  GiantDeathVFX,
  HitSpark,
  spawnHitSpark,
  LiquidTrailVFX,
  MuzzleFlash,
  ConditionVFX,
  spawnConditionVFX,
  drawPersistentDeathVisual,
  Explosion,
  spawnExplosion,
  DamageNumberVFX,
  spawnDamageNumber
} from '../vfx/index';
import { AttachedTurret } from './attachedTurret';
import { WorldTurret } from './worldTurret';
import { Bullet, spawnBullet } from './bullet';
import { GroundFeature } from './groundFeature';
import { lerpAngle } from './utils';
import { checkCircleRectCollision } from '../utils/collisions';
import { Obstacle, overlayTypes } from '../balanceObstacles';
import { drawEnemy } from '../visualEnemies';
import { isLegibleSpot, requestFlungSpawn } from '../lvDemo';
import { spawnLootAt } from '../economy';
import { triggerUpgradeHook } from '../src/upgrades';
import { flowField, flowFieldRegistry } from '../pathfinding';
import { soundEngine } from '../src/audio/soundEngine';
import { EnemyAction } from './enemy/EnemyAction';
import { EnemyHub } from './enemy/EnemyHub';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const atan2: any;
declare const floor: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const color: any;
declare const radians: any;
declare const red: any;
declare const green: any;
declare const blue: any;
declare const TWO_PI: any;
declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const ellipse: any;
declare const textSize: any;
declare const textAlign: any;
declare const CENTER: any;
declare const text: any;
declare const HALF_PI: any;

export class Enemy {
  readonly isEnemy: boolean = true;
  uid: string;
  pos: any; type: string; config: any; health: number; maxHealth: number; speed: number; size: number; col: any; target: any = null; flash: number = 0; rot: number; actionType: string[]; actionConfig: any;
  flashType: 'damage' | 'heal' = 'damage';
  meleeCooldown: number = 0; shootCooldown: number = 0; swarmParticles: any[] = []; markedForDespawn: boolean = false;
  isWinCondition: boolean = false;
  neverDespawn: boolean = false;
  actionSteps: Map<string, number> = new Map();
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  prevPos: any; isDying: boolean = false;
  triggeredSpawnThresholds: Set<number> = new Set(); // Tracks already fired health ratios
  kbVel: any; // Knockback velocity
  kbTimer: number = 0; // Knockback duration (interrupts movement)
  isFlying: boolean = false;
  stealSunTarget: any = null;
  stealCooldown: number = 0;
  lastTargetScanFrame: number = -100;

  // Attack Animation State
  attackAnimTimer: number = 0;
  attackAnimDuration: number = 0;
  attackOffset: any;

  // Modular Actions & Collaboration
  actions: EnemyAction[] = [];
  actionLocks: Set<string> = new Set();
  isAirborne: boolean = false;
  airborneProgress: number = 0;
  airborneDuration: number = 0;
  airborneStartPos: any = null;
  airborneTargetPos: any = null;
  airborneMaxHeight: number = 90;
  airborneHeight: number = 0;
  leader: any = null;
  collaboratingWith: any = null;
  frontShieldAction?: any;

  numericId: number;

  constructor(x: number, y: number, typeKey: string) {
    this.numericId = Math.floor(Math.random() * 1000000);
    this.uid = Math.random().toString(36).substr(2, 9);
    this.pos = createVector(x, y); this.prevPos = this.pos.copy(); this.type = typeKey; this.config = enemyTypes[typeKey]; this.health = this.config.health; this.maxHealth = this.health; this.speed = this.config.speed; this.size = this.config.size; this.col = this.config.col; this.rot = random(TWO_PI); this.actionType = this.config.actionType; this.actionConfig = this.config.actionConfig;
    this.isFlying = !!this.config.isFlying;
    if (this.type === 'e_swarm') for(let i=0; i<10; i++) this.swarmParticles.push({ offset: p5.Vector.random2D().mult(random(12, 24)), size: random(5, 9), phase: random(TWO_PI) });
    this.kbVel = createVector(0, 0);
    this.attackOffset = createVector(0, 0);

    this.actions = this.initActions();

    if (this.config.spawnWithCondition) {
      this.applyCondition(this.config.spawnWithCondition.condition, this.config.spawnWithCondition.duration);
    }
  }

  initActions(): EnemyAction[] {
    return EnemyHub.getActions(this);
  }

  isActionLocked(tags: string[]): boolean {
    return tags.some(t => this.actionLocks.has(t));
  }

  lockActions(tags: string[]) {
    for (const t of tags) this.actionLocks.add(t);
  }

  unlockActions(tags: string[]) {
    for (const t of tags) this.actionLocks.delete(t);
  }

  onActionExecute(name: string) {}
  onActionComplete(name: string) {}
  customUpdate() {}
  customDisplay() {}
  customOnDeath() {}
  customOnLand() {}
  customGetTarget(): any { return null; }
  customOnDamage(dmg: number, source?: any): boolean { return false; }

  launchIntoAir(targetX: number, targetY: number, duration: number, maxHeight: number = 90) {
    this.isAirborne = true;
    this.lockActions(['movement', 'attack']);
    this.airborneProgress = 0;
    this.airborneDuration = Math.max(1, duration);
    this.airborneStartPos = { x: this.pos.x, y: this.pos.y };
    this.airborneTargetPos = { x: targetX, y: targetY };
    this.airborneMaxHeight = maxHeight;
    this.airborneHeight = 0;
  }

  applyCondition(cKey: string, duration: number, data?: any) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
    if (cfg.conditionClashesConfig?.override) {
        for (let ov of cfg.conditionClashesConfig.override) {
            for (let k of Array.from(this.conditions.keys())) {
              if (k === ov || (ov.startsWith('c_burning') && k.startsWith('c_burning'))) {
                this.conditions.delete(k);
              }
            }
            this.conditionData.delete(ov + '_dmg');
            if (ov.startsWith('c_burning')) this.conditionData.delete('c_burning_dmg');
        }
    }
        
    // Non-stacking burning conditions: burn hierarchy (only apply the stronger burn, no damage fallback)
    if (cKey.startsWith('c_burning')) {
      const incomingDmg = (data?.damageConfig?.enemy !== undefined)
        ? data.damageConfig.enemy
        : ((data?.damage !== undefined) ? data.damage : (cfg.damage || 0));
      if (incomingDmg <= 0) return;
      const currentBurnDmg = this.conditionData.get('c_burning_dmg') ?? 0;
      const hasBurn = Array.from(this.conditions.keys()).some(k => k.startsWith('c_burning'));

      if (!hasBurn || incomingDmg > currentBurnDmg) {
        for (let k of Array.from(this.conditions.keys())) {
          if (k.startsWith('c_burning')) this.conditions.delete(k);
        }
        this.conditions.set(cKey, duration);
        this.conditionData.set('c_burning_dmg', incomingDmg);
      } else if (incomingDmg === currentBurnDmg) {
        this.conditions.set(cKey, Math.max(this.conditions.get(cKey) || 0, duration));
      }
      // If incomingDmg < currentBurnDmg, ignore weaker burn
    } else {
      this.conditions.set(cKey, Math.max(this.conditions.get(cKey) || 0, duration));
    }

    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) {
      state.vfx.push(spawnConditionVFX(this, cKey));
    }
  }

  update(playerPos: any, turrets: (AttachedTurret | WorldTurret)[] = []) {
    if (this.isDying) return;
    if (this.flash > 0) this.flash--;
    this.prevPos.set(this.pos);

    // Handle Airborne ballistic arc trajectory
    if (this.isAirborne) {
      if (!this.airborneStartPos || !this.airborneTargetPos || this.airborneDuration <= 0) {
        this.isAirborne = false;
        this.airborneHeight = 0;
        this.unlockActions(['movement', 'attack']);
        return;
      }
      this.airborneProgress += 1 / this.airborneDuration;
      const p = Math.min(1, this.airborneProgress);
      this.pos.x = this.airborneStartPos.x + (this.airborneTargetPos.x - this.airborneStartPos.x) * p;
      this.pos.y = this.airborneStartPos.y + (this.airborneTargetPos.y - this.airborneStartPos.y) * p;
      this.airborneHeight = 4 * (this.airborneMaxHeight || 90) * p * (1 - p);

      if (p >= 1) {
        this.isAirborne = false;
        this.airborneHeight = 0;
        this.unlockActions(['movement', 'attack']);
        this.unstuckFromObstacles();
        if (state.vfx) {
          state.vfx.push(spawnHitSpark(this.pos.x, this.pos.y, [220, 180, 100]));
          state.vfx.push(spawnHitSpark(this.pos.x + 8, this.pos.y, [220, 180, 100]));
          state.vfx.push(spawnHitSpark(this.pos.x - 8, this.pos.y, [220, 180, 100]));
        }
        soundEngine.playSFXGroup('projectile_hit_dirt');
        this.customOnLand();
        if (this.actions) {
          for (const a of this.actions) a.onLand?.();
        }
      }
      return;
    }


    // Apply knockback
    if (this.kbVel.mag() > 0.05) {
      this.moveWithCollisions(this.kbVel);
      this.kbVel.mult(0.9);
    }
    if (this.kbTimer > 0) this.kbTimer--;

    const dSqToPlayer = (this.pos.x - playerPos.x)**2 + (this.pos.y - playerPos.y)**2;
    const despawnRange = (GRID_SIZE * CHUNK_SIZE * 4)**2;
    if (dSqToPlayer > despawnRange && !this.isWinCondition && !this.neverDespawn) { 
      this.markedForDespawn = true; 
      const refund = (enemyTypes[this.type].cost || 0);
      state.hourlyBudgetPool += refund; 
      state.refundedBudget += refund;
      return; 
    }
    
    this.applyObstacleRepulsion();



    let speedMult = 1.0;
    let attackSpeedMult = 1.0;
    let targetMoveVec = createVector(0, 0);
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (!cfg) continue;
      
      if (cKey.startsWith('c_burning')) {
          const dmg = this.conditionData.get('c_burning_dmg') ?? cfg.damage ?? 0;
          if (dmg > 0 && state.frames % (cfg.damageInterval || 15) === 0) {
            this.takeDamage(dmg, { type: 'condition', key: cKey });
          }
      } else if (cfg.damage && state.frames % cfg.damageInterval === 0) {
          this.takeDamage(cfg.damage, { type: 'condition', key: cKey });
      }

      if (cfg.enemyMovementSpeedMultiplier !== undefined) {
        speedMult *= cfg.enemyMovementSpeedMultiplier;
      }
      if (cfg.enemyAttackSpeedMultiplier !== undefined) {
        attackSpeedMult *= cfg.enemyAttackSpeedMultiplier;
      }
      this.conditions.set(cKey, life - 1);
      if (life <= 0) {
          this.conditions.delete(cKey);
          if (cKey === 'c_burning') this.conditionData.delete('c_burning_dmg');
      }
    }

    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let actualVelSq = (this.pos.x - this.prevPos.x)**2 + (this.pos.y - this.prevPos.y)**2;

    if (lData) {
       speedMult *= lData.liquidConfig.enemyMovementSpeedMultiplier;
       if (lData.trailVfxInterval && state.frames % floor(lData.trailVfxInterval / 2) === 0 && actualVelSq > 0.01) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.enemyTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
       
       if (lData.liquidConfig.liquidDamageConfig?.enemy) {
         const cfg = lData.liquidConfig.liquidDamageConfig.enemy;
         const interval = cfg.damageInterval || 10;
         if (state.frames % interval === 0) {
           if (cfg.damage) this.takeDamage(cfg.damage);
           if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || interval * 2, { damage: cfg.damage });
         }
       }
    }

    if (this.conditions.has('c_stun') || this.kbTimer > 0) return;



    // Handle Attack Animation Sequence
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer--;
      const progress = 1 - (this.attackAnimTimer / this.attackAnimDuration);
      
      const lungeDist = this.actionConfig.meleeAttackRange || (this.size * 0.25);

      if (progress < 0.4) {
        const backProgress = progress / 0.4;
        this.attackOffset = p5.Vector.fromAngle(this.rot).mult(-lungeDist * 0.2 * backProgress);
      } else {
        const strikeProgress = (progress - 0.4) / 0.6;
        const strikeAmt = sin(strikeProgress * Math.PI) * lungeDist;
        this.attackOffset = p5.Vector.fromAngle(this.rot).mult(strikeAmt - (lungeDist * 0.2 * (1 - strikeProgress)));

        if (this.attackAnimTimer === Math.floor(this.attackAnimDuration * 0.35)) {
           this.performMeleeStrike();
        }
      }
      return; 
    } else {
      this.attackOffset.set(0, 0);
    }

    const checkLimitSq = EnemyCollideRadiusCheck * EnemyCollideRadiusCheck;
    let shouldMove = true;
    
    // TARGETING THROTTLE (8-Bucket Interleaved Frame Staggering)
    const enemyBucket = ((this as any).uid || 0) & 7;
    const isInterleavedScanFrame = (state.frames & 7) === enemyBucket;
    const scanIntervalElapsed = state.frames - this.lastTargetScanFrame >= 24;
    const isHypnotized = this.conditions.has('c_hypnotized');
    const customCollabTarget = this.customGetTarget ? this.customGetTarget() : null;
    const isCollabTarget = this.target instanceof Enemy && (this.target === customCollabTarget || this.collaboratingWith === this.target);
    const isTargetInvalid = !this.target || 
      this.target.isDying || 
      (this.target.life !== undefined && this.target.life <= 0) ||
      (this.target.health !== undefined && this.target.health <= 0) ||
      (isHypnotized && this.target instanceof Enemy && this.target.conditions.has('c_hypnotized')) ||
      (!isHypnotized && this.target instanceof Enemy && !this.target.conditions.has('c_hypnotized') && !isCollabTarget);

    if ((isInterleavedScanFrame && scanIntervalElapsed) || state.needsTargetReScan || isTargetInvalid) {
      this.lastTargetScanFrame = state.frames;

      if (isHypnotized) {
        // Hypnotized enemies actively seek out other hostile enemies anywhere on the active field
        let bestEnemy: any = null;
        let bestScore = Infinity;

        for (const ent of state.enemies) {
          if (ent === this || ent.health <= 0 || ent.isDying) continue;
          if (ent.conditions.has('c_hypnotized')) continue;
          if (ent.isValidTarget === false || ent.config?.isValidTarget === false) continue;

          const twPos = ent.pos;
          const dSq = (this.pos.x - twPos.x)**2 + (this.pos.y - twPos.y)**2;
          const hasLOS = this.isFlying || (state.world && state.world.checkLOS && state.world.checkLOS(this.pos.x, this.pos.y, twPos.x, twPos.y));

          // Strongly prioritize enemies with direct Line-of-Sight, but still seek and pursue non-LOS enemies around corners
          const score = hasLOS ? dSq : dSq * 2.25;
          if (score < bestScore) {
            bestScore = score;
            bestEnemy = ent;
          }
        }

        // Also check hostile spawner blocks if no hostile mobile enemies found
        if (!bestEnemy && state.world?.chunks) {
          let bestBlock: any = null;
          let bestBlockDistSq = Infinity;
          state.activeChunkKeys.forEach((key: string) => {
            const chunk = state.world.chunks.get(key);
            if (!chunk) return;
            chunk.overlayBlocks?.forEach((b: any) => {
              if (b.isMined || !b.overlay) return;
              if (overlayTypes[b.overlay]?.isEnemy) {
                const bx = b.pos.x + GRID_SIZE / 2;
                const by = b.pos.y + GRID_SIZE / 2;
                const dSq = (this.pos.x - bx)**2 + (this.pos.y - by)**2;
                if (dSq < bestBlockDistSq) {
                  bestBlockDistSq = dSq;
                  bestBlock = b;
                }
              }
            });
          });
          bestEnemy = bestBlock;
        }

        this.target = bestEnemy; // Null if no hostile enemies or enemy spawners remain
      } else {
        const collabTarget = this.customGetTarget ? this.customGetTarget() : null;
        if (collabTarget && !collabTarget.isDying && collabTarget.health > 0) {
          this.target = collabTarget;
        } else {
          let nearestT = null; 
          let minDistTSq = 450*450;
          const grid = state.spatialGrid;
          if (grid) {
            grid.forEachNeighborCell(this.pos.x, this.pos.y, 1, (cellEntities: any[]) => {
              for (const ent of cellEntities) {
                if (ent === this || ent.isDying || ent.isValidTarget === false || ent.config?.isValidTarget === false || ent.type === 'o_barrier') continue;

                // Normal enemies target hypnotized enemies, player, or turrets
                if (ent instanceof Enemy) {
                  if (!ent.conditions.has('c_hypnotized')) continue;
                } else {
                   // If it's a turret, check if it's active
                   if (ent.config && ent.config.collideWithEnemy === false) continue;
                   if (ent.isWaterlogged || ent.isFrosted) continue;
                   if (ent.isActive && !ent.isActive()) continue;
                }

                const twPos = ent.getWorldPos ? ent.getWorldPos() : ent.pos;
                const dSq = (this.pos.x - twPos.x)**2 + (this.pos.y - twPos.y)**2;
                if (dSq < minDistTSq && (this.isFlying || state.world.checkLOS(this.pos.x, this.pos.y, twPos.x, twPos.y))) { 
                    nearestT = ent; minDistTSq = dSq; 
                }
              }
            });
          }
          this.target = nearestT || state.player;
        }
      }
    }

    if (!this.target) {
      if (isHypnotized) {
        // If there are no enemies, move away from the player by default (reverse pathfind)
        let rVx = 0;
        let rVy = 0;
        if (this.isFlying) {
          if (state.player) {
            const pdx = this.pos.x - state.player.pos.x;
            const pdy = this.pos.y - state.player.pos.y;
            const pd = Math.sqrt(pdx * pdx + pdy * pdy);
            if (pd > 0.001) {
              rVx = pdx / pd;
              rVy = pdy / pd;
            }
          }
        } else {
          const revFlow = flowFieldRegistry.getEnemyReverseMoveVector(this.pos, this.size);
          rVx = revFlow.vx;
          rVy = revFlow.vy;
        }

        if (Math.abs(rVx) > 0.01 || Math.abs(rVy) > 0.01) {
          targetMoveVec = createVector(rVx, rVy).mult(this.speed * speedMult);
          this.moveWithCollisions(targetMoveVec);

          const moveHeading = atan2(rVy, rVx);
          this.rot = lerpAngle(this.rot, moveHeading, 0.12);
        } else {
          this.rot += random(-0.05, 0.05);
        }
      } else {
        this.rot += random(-0.05, 0.05);
      }
      return;
    }

    let tp = this.target.getWorldPos ? this.target.getWorldPos() : this.target.pos;

    if (this.actionType.includes('stealSun')) {
      if (!this.stealSunTarget || this.stealSunTarget.life <= 0) {
        let bestSun = null;
        let minDistSq = (this.actionConfig.stealRange || GRID_SIZE * 6)**2;
        
        // OPTIMIZATION: Only check loot in active chunks
        state.activeChunkKeys.forEach((key: string) => {
          const chunk = state.world.chunks.get(key);
          if (chunk) {
            for (let l of chunk.loot) {
              if (l.typeKey === 'sun') {
                const dSq = (this.pos.x - l.pos.x)**2 + (this.pos.y - l.pos.y)**2;
                if (dSq < minDistSq) {
                  minDistSq = dSq;
                  bestSun = l;
                }
              }
            }
          }
        });
        this.stealSunTarget = bestSun;
      }

    if (this.stealSunTarget) {
      tp = this.stealSunTarget.pos;
      const dSqToSun = (this.pos.x - tp.x)**2 + (this.pos.y - tp.y)**2;
      if (this.actionConfig.stealSunSpeedMultiplier) {
        speedMult *= this.actionConfig.stealSunSpeedMultiplier;
      }
      if (dSqToSun < (this.size * 0.5 + 20)**2) {
          if (this.stealSunTarget.life > 0) {
            // Steal it
            this.stealSunTarget.life = 0;
            this.takeDamage(-(this.actionConfig.healPerSun || 80));
          }
          this.stealSunTarget = null;
        }
      }
    }

    const dx = tp.x - this.pos.x;
    const dy = tp.y - this.pos.y;
    const dSq = dx*dx + dy*dy;
    const d = Math.sqrt(dSq);
    const dirHeading = atan2(dy, dx);

    let flowVx = 0;
    let flowVy = 0;
    let flowMode: string = 'direct';

    if (this.isFlying) {
      flowVx = d > 0 ? dx / d : 0;
      flowVy = d > 0 ? dy / d : 0;
      flowMode = 'fly';
      (this as any).pathfindingMode = 'fly';
      (this as any).moveVector = { x: flowVx, y: flowVy };
      this.rot = lerpAngle(this.rot, dirHeading, 0.15);
    } else {
      const goalId = (this.target as any)?.flowGoalId || (this.target === state.player ? 'player' : undefined);
      const flow = flowFieldRegistry.getEnemyMoveVector(this.pos, this.size, tp, goalId);
      flowVx = flow.vx;
      flowVy = flow.vy;
      flowMode = flow.mode;
      (this as any).pathfindingMode = flow.mode;
      (this as any).moveVector = { x: flow.vx, y: flow.vy };

      const moveHeading = (Math.abs(flow.vx) > 0.01 || Math.abs(flow.vy) > 0.01) ? atan2(flow.vy, flow.vx) : dirHeading;
      this.rot = lerpAngle(this.rot, flow.mode === 'los' ? dirHeading : moveHeading, 0.12);
    }

    // Enemy-Enemy collision avoidance (Interleaved 30Hz evaluation)
    const isRepulsionFrame = (((this as any).uid || 0) & 1) === (state.frames & 1);
    if (isRepulsionFrame) {
      const grid = state.spatialGrid;
      if (grid) {
        grid.forEachNeighborCell(this.pos.x, this.pos.y, 1, (neighbors: any[]) => {
          for (const other of neighbors) {
            if (other === this || other.isDying || !(other instanceof Enemy)) continue;
            const odx = this.pos.x - other.pos.x;
            const ody = this.pos.y - other.pos.y;
            const distSq = odx*odx + ody*ody;
            
            if (distSq > checkLimitSq) continue;
            
            const md = (this.size + other.size)*0.55;
            if (distSq < md*md && distSq > 0) {
              const od = Math.sqrt(distSq);
              this.moveWithCollisions(createVector(odx/od * 0.4, ody/od * 0.4));
            }
          }
        });
      }
    }

    let targetRadius = (this.target.size || 32) * 0.5;
    
    const inMeleeRange = d < (this.size * 0.5 + targetRadius + 15);
    const isShooter = this.type === 'e_shooting' || this.type === 'e_shooting_giant';
    const canShootInRange = this.actionType.includes('shoot') && d < this.actionConfig.shootRange && (isShooter || this.isFlying || state.world.checkLOS(this.pos.x, this.pos.y, tp.x, tp.y));

    if (canShootInRange) shouldMove = false;

    // Modular Action Execution Pipeline
    if (this.actions && this.actions.length > 0) {
      const activeTurrets = Array.isArray(turrets) && turrets.length > 0 ? turrets : (state.player?.attachments || []);
      for (const action of this.actions) {
        action.update(playerPos, activeTurrets);
      }
    } else {
      if (shouldMove && this.actionType.includes('moveDefault')) {
        let rThresh = this.actionType.includes('shoot') ? this.actionConfig.shootRange * 0.75 : this.size * 0.6;
        if (d > rThresh) {
          targetMoveVec = createVector(flowVx, flowVy).mult(this.speed * speedMult);
          this.moveWithCollisions(targetMoveVec);
        }
      }

      if (this.actionType.includes('meleeAttack') && inMeleeRange && this.meleeCooldown <= 0) { 
          this.attackAnimDuration = Math.max(20, Math.round((this.actionConfig.attackFireRate || 30) * attackSpeedMult));
          this.attackAnimTimer = this.attackAnimDuration;
          this.meleeCooldown = Math.round((this.actionConfig.attackFireRate || 30) * attackSpeedMult);
      }
      if (this.meleeCooldown > 0) this.meleeCooldown--;

      if (this.actionType.includes('shoot') && canShootInRange && this.shootCooldown <= 0) { 
          const bType = this.actionConfig.bulletTypeKey || 'b_enemy_basic';
          let sa = dirHeading + (this.actionConfig.inaccuracy ? random(-radians(this.actionConfig.inaccuracy), radians(this.actionConfig.inaccuracy)) : 0);
          const bullet = spawnBullet(this.pos.x, this.pos.y, this.pos.x + cos(sa)*500, this.pos.y + sin(sa)*500, bType, 'core', this);
          if (this.conditions.has('c_hypnotized')) {
            bullet.damageTargets = ['enemy'];
            state.bullets.push(bullet);
          } else {
            state.enemyBullets.push(bullet);
          }
          state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 22, 6, color(200, 100, 255))); 
          
          // Play Enemy Shoot SFX
          const shootSfx = this.config?.shootSfx || 'enemy_shooting_shoot';
          soundEngine.playSFXGroup(shootSfx);
          
          if (Array.isArray(this.actionConfig.shootFireRate)) {
            const step = this.actionSteps.get('shoot') || 0;
            this.shootCooldown = Math.round((this.actionConfig.shootFireRate[step % this.actionConfig.shootFireRate.length]) * attackSpeedMult);
            this.actionSteps.set('shoot', step + 1);
          } else {
            this.shootCooldown = Math.round((this.actionConfig.shootFireRate || 60) * attackSpeedMult); 
          }
      }
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
    this.customUpdate();
  }

  performMeleeStrike() {
    if (!this.target || this.isDying) return;

    // ENEMY DAMAGE REFINEMENT: Ignore damage to inactive turrets
    if (this.target instanceof AttachedTurret || this.target instanceof WorldTurret) {
        const isRetracted = !state.isStationary && !this.target.config.isActiveWhileMoving && this.target.isAttachedToPlayer();
        const isInactive = isRetracted || this.target.isWaterlogged || this.target.isFrosted;
        if (isInactive) return;
    }

    // Friendly fire check: only damage hostile targets
    const isHypnotized = this.conditions.has('c_hypnotized');
    const targetIsEnemy = !!this.target.isEnemy || this.target instanceof Enemy;

    if (targetIsEnemy) {
      const targetHypnotized = !!this.target.conditions?.has('c_hypnotized');
      if (isHypnotized === targetHypnotized) return;
    } else {
      if (isHypnotized) return;
    }

    const strikePos = p5.Vector.add(this.pos, this.attackOffset);
    const tc = this.target.getWorldPos ? this.target.getWorldPos() : (this.target.pos || null);
    if (!tc) return;

    let targetRadius = (this.target.size || 32) * 0.5;
    
    const distToStrike = dist(strikePos.x, strikePos.y, tc.x, tc.y);
    const strikeRange = this.size * 0.5 + targetRadius + 20;

    if (distToStrike < strikeRange) {
        this.target.takeDamage(this.actionConfig.damage);
        if (state.frames % 5 === 0) state.vfx.push(spawnHitSpark(strikePos.x, strikePos.y, [255, 50, 50]));
        
        if (this.type === 'e_giant' || this.type === 'e_shooting_giant' || this.type === 'e_snowthrower_giant') {
            state.cameraShake = Math.max(state.cameraShake, 10);
            state.cameraShakeFalloff = 0.9;
            state.vfx.push(spawnExplosion(strikePos.x, strikePos.y, this.size * 2, color(255, 100, 0)));
        }
    }
  }

  applyObstacleRepulsion() {
    if (this.isFlying) return;

    // 1Hz Obstacle Unstuck Repulsion (Optimized 60-frame interleaved check)
    if ((state.frames + (this.numericId || 0)) % 60 === 0) {
      this.unstuckFromObstacles();
    }

    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.9;
    const forceRangeSq = forceRange * forceRange;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bx = i * GRID_SIZE + GRID_SIZE/2;
          const by = j * GRID_SIZE + GRID_SIZE/2;
          const dx = this.pos.x - bx;
          const dy = this.pos.y - by;
          const dSq = dx*dx + dy*dy;
          if (dSq < forceRangeSq) {
            const d = Math.sqrt(dSq);
            const force = 4.0 * (1 - d/forceRange);
            this.pos.x += dx/d * force;
            this.pos.y += dy/d * force;
          }
        }
      }
    }
  }

  unstuckFromObstacles() {
    if (this.isFlying || !state.world || !state.world.checkCollision) return;
    const colRad = this.size / 2.2;
    if (!state.world.checkCollision(this.pos.x, this.pos.y, colRad)) return;

    // Test 8 radial angles across increasing distances to nudge into open space
    const testAngles = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, -Math.PI * 0.75, -Math.PI * 0.5, -Math.PI * 0.25];
    const testDists = [6, 12, 20, 28, 36];
    for (const d of testDists) {
      for (const ang of testAngles) {
        const tx = this.pos.x + Math.cos(ang) * d;
        const ty = this.pos.y + Math.sin(ang) * d;
        if (!state.world.checkCollision(tx, ty, colRad) && !this.checkEntityCollisions(tx, ty)) {
          this.pos.x = tx;
          this.pos.y = ty;
          return;
        }
      }
    }
  }

  moveWithCollisions(move: any) {
    if (this.isFlying) {
      this.pos.x += move.x;
      this.pos.y += move.y;
      return;
    }
    let nx = this.pos.x + move.x; if (!state.world.checkCollision(nx, this.pos.y, this.size/2.2) && !this.checkEntityCollisions(nx, this.pos.y)) this.pos.x = nx;
    let ny = this.pos.y + move.y; if (!state.world.checkCollision(this.pos.x, ny, this.size/2.2) && !this.checkEntityCollisions(this.pos.x, ny)) this.pos.y = ny;
  }
  checkEntityCollisions(x: number, y: number) { 
    if (state.player) {
      const dSqToPlayer = (x - state.player.pos.x)**2 + (y - state.player.pos.y)**2;
      const minDSqToPlayer = ((this.size + state.player.size)*0.5)**2;
      if (dSqToPlayer < minDSqToPlayer) {
        // If hypnotized and moving away from or not getting closer to player, allow movement
        const curDSqToPlayer = (this.pos.x - state.player.pos.x)**2 + (this.pos.y - state.player.pos.y)**2;
        if (this.conditions.has('c_hypnotized') && dSqToPlayer >= curDSqToPlayer) {
          // moving away from player
        } else {
          return true; 
        }
      }
    }

    // ENEMY COLLISION REFINEMENT: Only collide with ACTIVE turrets
    const worldTurrets = state.world.getAllTurrets();
    const allTurrets = [...state.player.attachments, ...worldTurrets];
    
    for (let t of allTurrets) {
      if (t.config.collideWithEnemy !== false) {
        const isRetracted = !state.isStationary && !t.config.isActiveWhileMoving && t.isAttachedToPlayer();
        const isInactive = isRetracted || t.isWaterlogged || t.isFrosted;
        if (isInactive) continue;

        const twPos = t.getWorldPos();
        let targetRadius = t.size * 0.5;
        if (t.config.actionType.includes('shield') || (t.activeStats?.shieldRadius > 0)) {
            targetRadius = t.activeStats?.shieldRadius || t.config.actionConfig.shieldRadius || (GRID_SIZE * 1.5);
        }
        const dSq = (x - twPos.x)**2 + (y - twPos.y)**2;
        if (dSq < ((this.size * 0.5 + targetRadius) * 0.95)**2) return true;
      }
    }
    return false; 
  }
  
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
          requestFlungSpawn(this.pos.x, this.pos.y, sx, sy, type, 15);
          break;
        }
      }
    }
  }

  performSpawnGroundFeature() {
    const gfKey = this.actionConfig.groundFeatureToSpawn;
    const count = this.actionConfig.spawnCount || 1;
    const radius = this.actionConfig.spawnRadius || 0;
    for (let i = 0; i < count; i++) {
      let sx = this.pos.x;
      let sy = this.pos.y;
      if (radius > 0) {
        const ang = random(TWO_PI);
        const r = random(radius);
        sx += cos(ang) * r;
        sy += sin(ang) * r;
      }
      state.groundFeatures.push(new GroundFeature(sx, sy, gfKey));
    }
  }

  performSpawnBullet() {
    const bType = this.actionConfig.bulletTypeToSpawn;
    const b = spawnBullet(this.pos.x, this.pos.y, this.pos.x, this.pos.y, bType, 'core', this);
    b.life = 0;
    if (this.conditions.has('c_hypnotized')) {
      b.damageTargets = ['enemy'];
      state.bullets.push(b);
    } else {
      state.enemyBullets.push(b);
    }
  }

  performSpawnObstacle() {
    const obsType = this.actionConfig.obstacleTypeToSpawn;
    const count = this.actionConfig.spawnCount || 1;
    const radius = this.actionConfig.spawnRadius || 0;
    for (let i = 0; i < count; i++) {
      let sx = this.pos.x;
      let sy = this.pos.y;
      if (radius > 0) {
        const ang = random(TWO_PI);
        const r = random(radius);
        sx += cos(ang) * r;
        sy += sin(ang) * r;
      }
      let gx = floor(sx / GRID_SIZE);
      let gy = floor(sy / GRID_SIZE);

      // Check for turrets
      const isTurretAt = (gx: number, gy: number) => {
        const attached = state.player.attachments.some((a: any) => {
          const wPos = a.getWorldPos();
          return floor(wPos.x / GRID_SIZE) === gx && floor(wPos.y / GRID_SIZE) === gy;
        });
        if (attached) return true;
        return !!state.world.getTurretAt(gx, gy);
      };

      if (isTurretAt(gx, gy)) {
        // Find nearest available spot
        let found = false;
        for (let r = 1; r < 10; r++) { // search up to 10 tiles away
          for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
              let ngx = gx + dx;
              let ngy = gy + dy;
              if (!isTurretAt(ngx, ngy)) {
                gx = ngx;
                gy = ngy;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }
      state.world.setBlock(gx, gy, obsType);
    }
  }

  display() { 
    const margin = 100;
    const left = state.cameraPos.x - width/2 - margin;
    const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin;
    const bottom = state.cameraPos.y + height/2 + margin;
    if (this.pos.x < left || this.pos.x > right || this.pos.y < top || this.pos.y > bottom) return;
    drawEnemy(this);

    if (this.isWinCondition) {
      push();
      translate(this.pos.x, this.pos.y);
      noFill();
      stroke(255, 215, 0, 180 + 30 * sin(frameCount * 0.05));
      strokeWeight(2.5);
      ellipse(0, 0, this.size * 1 + 2 * sin(frameCount * 0.05));
      
      pop();
    }
  }
  takeDamage(dmg: number, source?: any) { 
    if (this.isDying) return false;
    if (this.isAirborne) return false;

    if (this.customOnDamage(dmg, source)) return false;
    if (this.actions) {
      for (const a of this.actions) {
        if (a.onDamage(dmg, source)) return false;
      }
    }

    this.health -= dmg; 
    this.flash = 6; 
    this.flashType = dmg < 0 ? 'heal' : 'damage';

    if (dmg < 0 && !this.actionConfig.bypassMaxHealth) {
      this.health = Math.min(this.maxHealth, this.health);
    }

    const lastTick = state.lastDamageTick.get(this.uid) || 0;
    const pending = state.pendingDamage.get(this.uid) || 0;

    const numColor = dmg < 0 ? [80, 255, 120] : [255, 255, 255];
    state.vfx.push(spawnDamageNumber(this.pos.x, this.pos.y - this.size * 0.5, Math.abs(dmg), numColor));

    // BugSplatTinyVfx: Tiny splat on damage taken
    if (dmg > 0) {
      state.vfx.push(
        spawnBugSplatTinyVFX(
          this.pos.x + random(-this.size * 0.2, this.size * 0.2),
          this.pos.y + random(-this.size * 0.2, this.size * 0.2),
          Math.max(8, Math.min(18, this.size * 0.35)),
          this.col
        )
      );
    }

    if (this.health <= 0) { 
      this.health = 0;
      this.isDying = true;
      state.totalEnemiesDead++;
      state.killsByType[this.type] = (state.killsByType[this.type] || 0) + 1;

      // Play Enemy Death SFX (uses custom defined sfx or falls back to enemy_death)
      const deathSfx = this.config?.deathSfx || 'enemy_death';
      soundEngine.playSFXGroup(deathSfx);

      // Trigger Hooks
      if (source) {
        triggerUpgradeHook('onKill', source, { target: this, targetType: 'enemy', typeName: this.type });
      }
      triggerUpgradeHook('onDeath', this, { target: this, targetType: 'enemy', typeName: this.type });

      if (this.actions) {
        for (const a of this.actions) a.onDeath();
      }
      this.customOnDeath();

      spawnLootAt(this.pos.x, this.pos.y, this.type, this.config.lootConfigOnDeath);
      if (this.actionType.includes('spawnEnemy') && this.actionConfig.spawnTriggerOnHealthRatio) {
        if (this.actionConfig.spawnTriggerOnHealthRatio.includes(0)) {
           this.performSummon();
        }
      }
      if (this.actionType.includes('spawnGroundFeature') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnGroundFeature();
      }
      if (this.actionType.includes('spawnBullet') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnBullet();
      }
      if (this.actionType.includes('spawnObstacle') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnObstacle();
      }
      if (this.type === 'e_giant' || this.type === 'e_shooting_giant' || this.type === 'e_snowthrower_giant') {
        state.vfx.push(new GiantDeathVFX(this.pos.x, this.pos.y, this.size, this.col));
        this.markedForDespawn = true; 
      } else {
        // Dynamic splat variant selection
        const r = Math.random();
        if (this.size >= 34 || this.type === 'e_bomb') {
          // Heavy/Armored/Bomb enemies: powerful dramatic splat
          if (r < 0.65) {
            state.vfx.push(spawnBugSplatVFX3(this.pos.x, this.pos.y, this.size * 1.2, this.col));
          } else {
            state.vfx.push(spawnBugSplatVFX2(this.pos.x, this.pos.y, this.size * 1.1, this.col));
          }
        } else if (this.size <= 16) {
          // Small critters: light splat
          if (r < 0.8) {
            state.vfx.push(spawnBugSplatVFX(this.pos.x, this.pos.y, this.size, this.col));
          } else {
            state.vfx.push(spawnBugSplatVFX2(this.pos.x, this.pos.y, this.size, this.col));
          }
        } else {
          // Standard enemies: juicy variety between baseline, dramatic V2, and obliteration V3
          if (r < 0.45) {
            state.vfx.push(spawnBugSplatVFX(this.pos.x, this.pos.y, this.size, this.col));
          } else if (r < 0.82) {
            state.vfx.push(spawnBugSplatVFX2(this.pos.x, this.pos.y, this.size * 1.05, this.col));
          } else {
            state.vfx.push(spawnBugSplatVFX3(this.pos.x, this.pos.y, this.size * 1.15, this.col));
          }
        }
        eventBus.emit('ENEMY_DAMAGED', { enemy: this, source, amount: dmg });

        // BugSplatMeatChunkVfx: Addon on top of existing bugSplat at random chance
        if (this.size > 18) {
          const chunkChance = (this.size >= 32 || this.type === 'e_bomb') ? 0.65 : 0.35;
          if (Math.random() < chunkChance) {
            state.vfx.push(spawnBugSplatMeatChunkVFX(this.pos.x, this.pos.y, this.size, this.col, false));
          }
        }

        drawPersistentDeathVisual(this.pos.x, this.pos.y, this.size, [red(color(this.col)), green(color(this.col)), blue(color(this.col))]); 
        this.markedForDespawn = true;
      }
      return true; 
    } 
    return false; 
  }
}

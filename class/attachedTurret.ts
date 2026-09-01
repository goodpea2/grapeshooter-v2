
import { state } from '../state';
import { HEX_DIST, GRID_SIZE, HOUR_FRAMES, TurretMinScanRate, CHUNK_SIZE, FROST_LEVEL_CAP, FROST_BUILDUP_RATE, FROST_DECAY_RATE, ICECUBE_MAX_HEALTH } from '../constants';
import { turretTypes } from '../balanceTurrets';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { MuzzleFlash, Explosion, SparkVFX, BlockDebris, ConditionVFX, MergeVFX, MagicLinkVFX, WeldingHitVFX, FirstStrikeVFX, FrostFieldAuraVFX, DamageNumberVFX, spawnMergeVFX } from '../vfx/index';
import { Bullet } from './bullet';
import { LootEntity, SunLoot, spawnLootEntity } from './loot';
import { Enemy } from './enemy';
import { drawTurret, drawTurretUI } from '../visualTurrets';
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

import { Turret } from './turret';

export class AttachedTurret extends Turret {
  hq: number; hr: number; offset: any;
  pos: any;
  vel: any;
  
  // Staggered target scan
  targetScanTimer: number;

  // Trail following state
  pathTargetIndex: number = -1;
  reactionTimer: number = 0;
  isFollowingTrail: boolean = false;
  perpendicularOffset: number = 0; // Natural "wiggle" in the line

  // Animation states inherited from Turret (jumpOffset, jumpFrames, jumpPhase, jumpTargetPos, jumpCurrentPos)

  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent);
    this.hq = hq; this.hr = hr;
    this.offset = createVector(HEX_DIST * (1.5 * hq), HEX_DIST * (Math.sqrt(3)/2 * hq + Math.sqrt(3) * hr));
    this.pos = parent.pos.copy();
    this.vel = createVector(0, 0);
    this.targetScanTimer = floor(random(TurretMinScanRate));
    this.perpendicularOffset = random(-10, 10);

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

    if (this.config.actionType.includes('farm')) {
      this.farmStage = 0;
      this.farmGrowthTimer = this.config.farmConfig.growthTimer[0];
      this.farmHarvestHp = this.config.farmConfig.harvestStageHp || 100;
    }
  }
  
  getWorldPos() { return this.pos; }
  
  update() {
    this.updateMovement();
    super.update();
  }

  customIsActive(): boolean | null {
    // Turrets don't fire while moving (either because player is moving or the turret itself is in motion)
    if (!state.isStationary && !this.config.isActiveWhileMoving) return false;
    
    // Inactive while moving itself (following trail or moving towards formation)
    if (this.isFollowingTrail) return false;
    if (this.vel.magSq() > 0.04) return false;

    return null; // Fall back to default logic
  }

  private updateMovement() {
    // 1. Determine Target
    const formationTarget = p5.Vector.add(this.parent.pos, this.offset);
    let currentMoveTarget = formationTarget;

    if (!state.isStationary) {
      // Start/Increment reaction delay
      if (!this.isFollowingTrail) {
        this.reactionTimer++;
        const indexInSquad = this.parent.attachments.indexOf(this);
        const requiredDelay = 5 + indexInSquad * 2; // Staggered start

        if (this.reactionTimer > requiredDelay && state.playerTrail.length > 0) {
          this.isFollowingTrail = true;
          // Pick the newly-created breadcrumb first (from when the player started moving again)
          const startIdx = state.trailStartIndexOnMove !== undefined ? state.trailStartIndexOnMove : 0;
          this.pathTargetIndex = Math.max(0, Math.min(state.playerTrail.length - 1, startIdx));
        }
      }
    } else {
      // Player is stationary
      this.reactionTimer = 0;
    }

    // Process trail following (active both when moving and while catching up when player is stationary)
    if (this.isFollowingTrail && state.playerTrail.length > 0) {
      const minValidIdx = state.trailStartIndexOnMove !== undefined ? state.trailStartIndexOnMove : 0;
      if (this.pathTargetIndex < minValidIdx) {
        this.pathTargetIndex = Math.min(state.playerTrail.length - 1, minValidIdx);
      }
      if (this.pathTargetIndex >= state.playerTrail.length) {
        this.pathTargetIndex = state.playerTrail.length - 1;
      }

      const breadcrumb = state.playerTrail[this.pathTargetIndex];
      currentMoveTarget = breadcrumb.copy();

      // Add perpendicular "loosness"
      const toPlayer = p5.Vector.sub(this.parent.pos, breadcrumb);
      if (toPlayer.mag() > 0.1) {
        const perp = createVector(-toPlayer.y, toPlayer.x).normalize().mult(this.perpendicularOffset);
        currentMoveTarget.add(perp);
      }

      // Advance index if reached breadcrumb
      if (dist(this.pos.x, this.pos.y, currentMoveTarget.x, currentMoveTarget.y) < 25) {
        if (this.pathTargetIndex < state.playerTrail.length - 1) {
          this.pathTargetIndex = Math.min(this.pathTargetIndex + 3, state.playerTrail.length - 1);
        } else if (state.isStationary) {
          // Reached the end of available breadcrumbs while stationary -> transition toward formation
          const isFormationBlocked = state.world.isBlockAt(formationTarget.x, formationTarget.y);
          if (!isFormationBlocked) {
            this.isFollowingTrail = false;
            currentMoveTarget = formationTarget;
          }
        }
      }

      // LOOK-AHEAD SHORTCUT:
      // Every few frames, check if we are near a breadcrumb that's much further in the path
      if (state.frames % 5 === 0) {
        const checkWindow = 30; // How many points to look ahead
        const searchEnd = Math.min(this.pathTargetIndex + checkWindow, state.playerTrail.length - 1);
        
        for (let i = searchEnd; i > this.pathTargetIndex; i--) {
          const futurePoint = state.playerTrail[i];
          const dToFuture = dist(this.pos.x, this.pos.y, futurePoint.x, futurePoint.y);
          
          // If we are close to a future point and have LOS, skip to it!
          if (dToFuture < 45 && state.world.checkLOS(this.pos.x, this.pos.y, futurePoint.x, futurePoint.y)) {
            this.pathTargetIndex = i;
            break;
          }
        }
      }

      // CATCH-UP SNAP: 
      // If we've fallen more than 100 points behind, snap the index closer to maintain the swarm's tail.
      const lag = (state.playerTrail.length - 1) - this.pathTargetIndex;
      if (lag > 100) {
        this.pathTargetIndex = state.playerTrail.length - 50;
      }
    } else if (state.isStationary || !this.isFollowingTrail) {
      // Return to formation
      const isFormationBlocked = state.world.isBlockAt(formationTarget.x, formationTarget.y);
      if (!isFormationBlocked) {
        currentMoveTarget = formationTarget;
        this.isFollowingTrail = false;
      } else {
        // If blocked, stay put or follow last trail point
        if (state.playerTrail.length > 0) {
          currentMoveTarget = state.playerTrail[state.playerTrail.length - 1];
        } else {
          currentMoveTarget = this.pos; // Stay put
        }
      }
    }

    // 2. Steering toward currentMoveTarget
    const desired = p5.Vector.sub(currentMoveTarget, this.pos);
    const d = desired.mag();
    
    // Arrival logic: slow down as we get close
    let maxSpeed = this.isFollowingTrail ? 5 : 4;
    
    // Dynamic Speed: If the player is far ahead on the trail, "run" faster to keep the line compact
    if (this.isFollowingTrail) {
      const lag = (state.playerTrail.length - 1) - this.pathTargetIndex;
      if (lag > 30) maxSpeed = 6.5;
      if (lag > 60) maxSpeed = 8;
    }

    const maxForce = 0.3;
    
    if (d < 50) {
      const m = lerp(0, maxSpeed, d / 50);
      desired.setMag(m);
    } else {
      desired.setMag(maxSpeed);
    }

    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(maxForce);
    this.vel.add(steer);
    
    // 3. Separation Force (Personal Bubble)
    for (const other of this.parent.attachments) {
      if (other === this) continue;
      const otherPos = other.getWorldPos();
      const distSq = (this.pos.x - otherPos.x)**2 + (this.pos.y - otherPos.y)**2;
      const minDist = (this.size + other.size) * 0.45;
      if (distSq < minDist * minDist && distSq > 0.01) {
        const diff = p5.Vector.sub(this.pos, otherPos);
        diff.normalize();
        diff.div(Math.sqrt(distSq)); // Weight by distance
        this.vel.add(diff.mult(0.5));
      }
    }

    // Friction and velocity integration
    this.vel.mult(0.92);
    
    const nextX = this.pos.x + this.vel.x;
    const nextY = this.pos.y + this.vel.y;
    
    // Collision-aware position update
    if (!state.world.isBlockAt(nextX, this.pos.y)) {
      this.pos.x = nextX;
    } else {
      this.vel.x *= -0.2;
    }
    
    if (!state.world.isBlockAt(this.pos.x, nextY)) {
      this.pos.y = nextY;
    } else {
      this.vel.y *= -0.2;
    }
  }

  replaceWith(type: string) {
    const newTurret = new AttachedTurret(type, this.parent, this.hq, this.hr);
    newTurret.pos = this.pos.copy();
    newTurret.vel = this.vel.copy();
    const index = this.parent.attachments.indexOf(this);
    if (index !== -1) {
      this.parent.attachments[index] = newTurret;
    }
  }

  isPowered(): boolean {
    return true; // Attached turrets are always powered for now
  }

  isAttachedToPlayer(): boolean {
    return true;
  }

  protected getNearbyTurrets(): Turret[] {
    return this.parent.attachments;
  }

  private applyTurretRepulsion(wPos: any) {
    // We already handle separation with other attached turrets in updateMovement
    // This handles repulsion from WORLD turrets or external objects
    const worldTurrets = state.world.getAllTurrets();
    const myRadius = this.size * 0.45;
    for (const wt of worldTurrets) {
      const wtPos = wt.getWorldPos();
      const dx = wPos.x - wtPos.x;
      const dy = wPos.y - wtPos.y;
      const dSq = dx*dx + dy*dy;
      const minDist = myRadius + wt.size * 0.45;
      if (dSq < minDist * minDist && dSq > 0.01) {
        const d = Math.sqrt(dSq);
        const overlap = minDist - d;
        const push = createVector(dx / d, dy / d).mult(overlap * 0.2);
        this.vel.add(push);
      }
    }
  }

  protected updateEnvironment(gx: number, gy: number, liquidType: string | null, lData: any) {
    const wPos = this.getWorldPos();
    
    // Use physical proximity to ground turret for lilypad check
    const groundTurret = this.parent.attachments.find((a: any) => 
      a.config.turretLayer === 'ground' &&
      dist(a.pos.x, a.pos.y, this.pos.x, this.pos.y) < GRID_SIZE
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

    if (liquidType === 'l_ice') { 
      if (state.isStationary && !this.isFrosted) { 
        this.frostLevel = Math.min(FROST_LEVEL_CAP, this.frostLevel + FROST_BUILDUP_RATE); 
        if (this.frostLevel >= FROST_LEVEL_CAP) { 
          this.isFrosted = true; 
          this.iceCubeHealth = ICECUBE_MAX_HEALTH; 
        } 
      } 
    } else if (!this.isFrosted) { 
      this.frostLevel = Math.max(0, this.frostLevel - FROST_DECAY_RATE); 
    }
    
    this.applyObstacleRepulsion(wPos);
    this.applyTurretRepulsion(wPos);
  }

  protected executeActions(wPos: any) {
    super.executeActions(wPos);
  }

  private spawnMobFarmEnemy() {
    const fCfg = this.config.farmConfig;
    const mCfg = fCfg.mobSpawnConfig;
    if (!mCfg) return;
    const enemyType = mCfg.enemies[floor(random(mCfg.enemies.length))];
    const wPos = this.getWorldPos();
    const pPos = state.player.pos;
    const dirToPlayer = atan2(pPos.y - wPos.y, pPos.x - wPos.x);
    const spawnAngle = dirToPlayer + Math.PI; 
    const spawnDist = mCfg.spawnDist || GRID_SIZE * 2;
    const sx = wPos.x + cos(spawnAngle) * spawnDist;
    const sy = wPos.y + sin(spawnAngle) * spawnDist;
    state.enemies.push(new Enemy(sx, sy, enemyType));
    state.vfx.push(new MergeVFX(sx, sy, [255, 255, 255]));
  }

  protected performHarvest() {
    const fCfg = this.config.farmConfig;
    const wPos = this.getWorldPos();
    if (fCfg.lootOnHarvest) {
      for (const [res, range] of Object.entries(fCfg.lootOnHarvest)) {
        if (res === 'extra') continue;
        const r = range as [number, number];
        const amount = floor(random(r[0], r[1] + 1));
        for (let i = 0; i < amount; i++) {
          const px = wPos.x + random(-10, 10);
          const py = wPos.y + random(-10, 10);
          const cx = floor(px / (GRID_SIZE * CHUNK_SIZE));
          const cy = floor(py / (GRID_SIZE * CHUNK_SIZE));
          const chunk = state.world.getChunk(cx, cy);
          if (chunk) chunk.loot.push(spawnLootEntity(px, py, res));
        }
      }
      if (fCfg.lootOnHarvest.extra && random() < fCfg.lootOnHarvest.extra.chance) {
        const extraRes = fCfg.lootOnHarvest.extra.items[floor(random(fCfg.lootOnHarvest.extra.items.length))];
        const px = wPos.x + random(-10, 10);
        const py = wPos.y + random(-10, 10);
        const cx = floor(px / (GRID_SIZE * CHUNK_SIZE));
        const cy = floor(py / (GRID_SIZE * CHUNK_SIZE));
        const chunk = state.world.getChunk(cx, cy);
        if (chunk) chunk.loot.push(spawnLootEntity(px, py, extraRes));
      }
    }
    
    if (fCfg.resetAfterHarvest) {
      this.farmStage = 0;
      this.farmGrowthTimer = fCfg.growthTimer[0];
      this.farmElixirCount = 0;
      this.farmHarvestHp = fCfg.harvestStageHp || 100;
    } else {
      this.health = 0;
      this.onDeath();
    }
    
    state.vfx.push(spawnMergeVFX(wPos.x, wPos.y, [255, 255, 255]));
  }

  private applyObstacleRepulsion(wPos: any) {
    const gx = floor(wPos.x / GRID_SIZE); const gy = floor(wPos.y / GRID_SIZE);
    const myRadius = this.size * 0.45; const blockRadius = GRID_SIZE * 0.5;
    const minSafeDist = myRadius + blockRadius;
    
    for (let i = gx - 1; i <= gx + 1; i++) for (let j = gy - 1; j <= gy + 1; j++) {
      const bx = i * GRID_SIZE + GRID_SIZE/2; const by = j * GRID_SIZE + GRID_SIZE/2;
      if (state.world.isBlockAt(bx, by)) {
        const dx = wPos.x - bx; const dy = wPos.y - by; const dSq = dx*dx + dy*dy;
        if (dSq < minSafeDist * minSafeDist && dSq > 0.01) { 
          const d = Math.sqrt(dSq); const overlap = minSafeDist - d;
          const push = createVector(dx / d, dy / d).mult(overlap * 0.5);
          this.vel.add(push); 
        }
      }
    }
  }

  protected findAllTargetsWithin(range: number) {
    const wPos = this.getWorldPos(); const rangeSq = range * range;
    const tTypes = this.config.targetType || []; const results: any[] = [];
    if (tTypes.includes('enemy')) {
      const grid = state.spatialGrid;
      if (grid) {
        grid.queryCircleEnemies(wPos.x, wPos.y, range, (e: any) => {
          if (e.conditions.has('c_hypnotized')) return;
          const dSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
          if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, e.pos.x, e.pos.y)) results.push(e);
        });
      }
      // Also check spawner overlays which are treated as enemies
      state.world.chunks.forEach((chunk: any) => {
        const cw = CHUNK_SIZE * GRID_SIZE; const dx = (chunk.cx * cw + cw/2) - wPos.x; const dy = (chunk.cy * cw + cw/2) - wPos.y;
        if (dx*dx + dy*dy > (range + cw)**2) return;
        chunk.overlayBlocks.forEach((b: any) => {
           if (b.isMined || !b.overlay) return;
           const oCfg = overlayTypes[b.overlay];
           if (oCfg?.isEnemy) {
              const bx = b.pos.x + GRID_SIZE/2; const by = b.pos.y + GRID_SIZE/2;
              const dSq = (wPos.x - bx)**2 + (wPos.y - by)**2;
              if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, bx, by)) results.push(b);
           }
        });
      });
    }
    if (tTypes.includes('obstacle')) {
      state.world.chunks.forEach((chunk: any) => {
        const cw = CHUNK_SIZE * GRID_SIZE; const dx = (chunk.cx * cw + cw/2) - wPos.x; const dy = (chunk.cy * cw + cw/2) - wPos.y;
        if (dx*dx + dy*dy > (range + cw)**2) return;
        chunk.blocks.forEach((b: any) => {
          if (b.isMined || b.type === 'o_barrier' || b.config?.isValidTarget === false || b.isValidTarget === false) return;
          const bcx = b.pos.x + GRID_SIZE/2; const bcy = b.pos.y + GRID_SIZE/2;
          const dSq = (wPos.x - bcx)**2 + (wPos.y - bcy)**2;
          if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, bcx, bcy)) results.push(b);
        });
      });
    }
    results.sort((a, b) => { 
      const posA = a.getWorldPos ? a.getWorldPos() : (a.gx !== undefined ? createVector(a.gx * GRID_SIZE + GRID_SIZE/2, a.gy * GRID_SIZE + GRID_SIZE/2) : a.pos); 
      const posB = b.getWorldPos ? b.getWorldPos() : (b.gx !== undefined ? createVector(b.gx * GRID_SIZE + GRID_SIZE/2, b.gy * GRID_SIZE + GRID_SIZE/2) : b.pos); 
      const dSqA = (wPos.x - posA.x)**2 + (wPos.y - posA.y)**2; 
      const dSqB = (wPos.x - posB.x)**2 + (wPos.y - posB.y)**2; 
      return dSqA - dSqB; 
    });
    return results;
  }

  public onDeath() {
    super.onDeath();
    const index = this.parent.attachments.indexOf(this);
    if (index !== -1) {
      this.parent.attachments.splice(index, 1);
    }
  }
}


import { state } from '../state';
import { HEX_DIST, GRID_SIZE, HOUR_FRAMES, TurretMinScanRate, CHUNK_SIZE, FROST_LEVEL_CAP, FROST_BUILDUP_RATE, FROST_DECAY_RATE, ICECUBE_MAX_HEALTH } from '../constants';
import { turretTypes } from '../balanceTurrets';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { MuzzleFlash, Explosion, SparkVFX, BlockDebris, ConditionVFX, MergeVFX, MagicLinkVFX, WeldingHitVFX, FirstStrikeVFX, FrostFieldAuraVFX, DamageNumberVFX } from '../vfx/index';
import { Bullet } from './bullet';
import { LootEntity, SunLoot } from './loot';
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
  
  // Staggered target scan
  targetScanTimer: number;

  // Animation states
  jumpOffset: any = null;
  jumpFrames: number = 0;
  jumpTargetPos: any = null;

  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent);
    this.hq = hq; this.hr = hr;
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

    if (this.config.actionType.includes('farm')) {
      this.farmStage = 0;
      this.farmGrowthTimer = this.config.farmConfig.growthTimer[0];
      this.farmHarvestHp = this.config.farmConfig.harvestStageHp || 100;
    }
  }
  
  getWorldPos() { return p5.Vector.add(this.parent.pos, this.offset); }
  
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
        const pushX = (dx / d) * (overlap + 0.05);
        const pushY = (dy / d) * (overlap + 0.05);
        this.parent.pos.x += pushX;
        this.parent.pos.y += pushY;
      }
    }
  }

  protected updateEnvironment(gx: number, gy: number, liquidType: string | null, lData: any) {
    const wPos = this.getWorldPos();
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

  protected handleGrowth(wPos: any) {
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
            state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
          }
        }
      }
    }
  }

  protected handleFarm(wPos: any) {
    if (this.config.actionType.includes('farm')) {
      const fCfg = this.config.farmConfig;
      const isHarvestStage = this.farmStage === fCfg.assetImg.length - 1;
      
      if (!isHarvestStage) {
        const elixirNeeded = fCfg.elixirRequired[this.farmStage] || 0;
        const hasRequirement = this.farmElixirCount >= elixirNeeded;

        if (hasRequirement) {
          if (this.farmGrowthTimer > 0) {
            this.farmGrowthTimer--;
          } else {
            // Grow to next stage
            this.farmStage++;
            this.farmElixirCount = 0;
            if (this.farmStage < fCfg.assetImg.length) {
              this.farmGrowthTimer = fCfg.growthTimer[this.farmStage];
            }
          }
        } else {
          // Attract elixir
          const range = fCfg.attractRange || GRID_SIZE * 4;
          const rangeSq = range * range;
          
          let currentlyAttractedCount = 0;
          
          // OPTIMIZATION: Only check loot in active chunks
          state.activeChunkKeys.forEach((key: string) => {
            const chunk = state.world.chunks.get(key);
            if (chunk) {
              for (let l of chunk.loot) {
                if (l.isBeingAttractedByFarm && l.farmAttractor === this) {
                  currentlyAttractedCount++;
                }
              }
            }
          });

          if (this.farmElixirCount + currentlyAttractedCount < elixirNeeded) {
            state.activeChunkKeys.forEach((key: string) => {
              const chunk = state.world.chunks.get(key);
              if (chunk) {
                for (let l of chunk.loot) {
                  if (l.typeKey === 'elixir' && l.life > 0 && !l.isBeingAttractedByFarm) {
                    const dSq = (wPos.x - l.pos.x)**2 + (wPos.y - l.pos.y)**2;
                    if (dSq < rangeSq) {
                      l.isBeingAttractedByFarm = true;
                      l.farmAttractor = this;
                      currentlyAttractedCount++;
                      if (this.farmElixirCount + currentlyAttractedCount >= elixirNeeded) break;
                    }
                  }
                }
              }
            });
          }
        }
      } else {
        // Harvest stage
        if (fCfg.isMobFarm) {
          this.spawnMobFarmEnemy();
          
          if (fCfg.resetAfterHarvest) {
            this.farmStage = 0;
            this.farmGrowthTimer = fCfg.growthTimer[0];
            this.farmElixirCount = 0;
          }
        }
      }
    }
  }

  protected executeActions(wPos: any) {
    super.executeActions(wPos);
    
    // Handle jump logic for AttachedTurret
    const config = this.config.actionConfig;
    if (this.config.actionType.includes('pulse') && this.jumpFrames === 0) {
      let triggered = false;
      const tCenter = this.getTargetCenter();
      if (tCenter) {
        const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
        if (dSq < Math.max(1, config.pulseTriggerRadius * config.pulseTriggerRadius)) triggered = true;
      }
      
      if (triggered && config.pulseTurretJumpAtTriggerSource && this.getTargetCenter()) { 
        this.jumpFrames = 20; 
        this.jumpTargetPos = this.getTargetCenter()?.copy(); 
      }
    }

    if (this.jumpFrames > 0) {
      this.jumpFrames--;
      if (this.jumpTargetPos) {
        const progress = 1 - (this.jumpFrames / 20);
        this.jumpOffset = p5.Vector.sub(this.jumpTargetPos, wPos).mult(sin(progress * Math.PI));
      }
      if (this.jumpFrames === 0) {
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
          if (chunk) chunk.loot.push(new LootEntity(px, py, res));
        }
      }
      if (fCfg.lootOnHarvest.extra && random() < fCfg.lootOnHarvest.extra.chance) {
        const extraRes = fCfg.lootOnHarvest.extra.items[floor(random(fCfg.lootOnHarvest.extra.items.length))];
        const px = wPos.x + random(-10, 10);
        const py = wPos.y + random(-10, 10);
        const cx = floor(px / (GRID_SIZE * CHUNK_SIZE));
        const cy = floor(py / (GRID_SIZE * CHUNK_SIZE));
        const chunk = state.world.getChunk(cx, cy);
        if (chunk) chunk.loot.push(new LootEntity(px, py, extraRes));
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
    
    state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
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
          const pushX = (dx / d) * (overlap + 0.05); const pushY = (dy / d) * (overlap + 0.05);
          this.parent.pos.x += pushX; this.parent.pos.y += pushY; 
        }
      }
    }
  }

  protected findAllTargetsWithin(range: number) {
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
            if (!(e instanceof Enemy) || e.health <= 0 || e.isInvisible || e.isDying || e.conditions.has('c_hypnotized')) continue;
            const dSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
            if (dSq <= rangeSq && state.world.checkLOS(wPos.x, wPos.y, e.pos.x, e.pos.y)) results.push(e);
          }
        }
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
          if (b.isMined) return;
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

  protected onDeath() {
    super.onDeath();
    const index = this.parent.attachments.indexOf(this);
    if (index !== -1) {
      this.parent.attachments.splice(index, 1);
    }
  }
}

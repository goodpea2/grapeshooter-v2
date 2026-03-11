
import { Turret } from './turret';
import { state } from '../state';
import { GRID_SIZE, WORLD_TURRET_ACTIVE_RANGE } from '../constants';
import { Bullet } from './bullet';
import { MuzzleFlash, MagicLinkVFX, SparkVFX, WeldingHitVFX, MergeVFX } from '../vfx/index';
import { spawnLootAt } from '../economy';

declare const createVector: any;
declare const floor: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const atan2: any;
declare const radians: any;
declare const TWO_PI: any;
declare const color: any;

export class WorldTurret extends Turret {
  gx: number;
  gy: number;
  pos: any;

  constructor(type: string, gx: number, gy: number) {
    super(type);
    this.gx = gx;
    this.gy = gy;
    this.pos = createVector(gx * GRID_SIZE + GRID_SIZE / 2, gy * GRID_SIZE + GRID_SIZE / 2);
  }

  getWorldPos() {
    return this.pos;
  }

  isPowered(): boolean {
    const dSq = (this.pos.x - state.player.pos.x)**2 + (this.pos.y - state.player.pos.y)**2;
    return dSq < (WORLD_TURRET_ACTIVE_RANGE * GRID_SIZE)**2;
  }

  isAttachedToPlayer(): boolean {
    return false;
  }

  protected updateEnvironment(gx: number, gy: number, liquidType: string | null, lData: any) {
    this.isWaterlogged = (liquidType === 'l_water');
    
    if (lData?.liquidConfig?.liquidDamageConfig?.turret) {
      const cfg = lData.liquidConfig.liquidDamageConfig.turret;
      if (state.frames % cfg.damageInterval === 0) {
          const dmg = (cfg.damageWhileStationary ?? 0) + this.maxHealth * (cfg.damageAsMaxHpWhileStationary ?? 0);
          if (dmg > 0) this.takeDamage(dmg);
          if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || cfg.damageInterval * 2, { damage: dmg });
      }
    }

    if (liquidType === 'l_ice') {
      if (!this.isFrosted) {
        this.frostLevel = Math.min(1.0, this.frostLevel + 1/600);
        if (this.frostLevel >= 1.0) {
          this.isFrosted = true;
          this.iceCubeHealth = 320;
        }
      }
    } else if (!this.isFrosted) {
      this.frostLevel = Math.max(0, this.frostLevel - 1/800);
    }
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
          const nt = new WorldTurret(chosen, this.gx, this.gy);
          state.world.removeTurret(this.gx, this.gy);
          state.world.addTurret(nt);
        }
      }
    }
  }

  protected handleFarm(wPos: any) {
    // Similar to AttachedTurret but without player-specific logic if any
    const fCfg = this.config.farmConfig;
    if (!fCfg) return;
    const isHarvestStage = this.farmStage === fCfg.assetImg.length - 1;
    
    if (!isHarvestStage) {
      const elixirNeeded = fCfg.elixirRequired[this.farmStage] || 0;
      const hasRequirement = this.farmElixirCount >= elixirNeeded;

      if (hasRequirement) {
        if (this.farmGrowthTimer > 0) {
          this.farmGrowthTimer--;
        } else {
          this.farmStage++;
          this.farmElixirCount = 0;
          if (this.farmStage < fCfg.assetImg.length) {
            this.farmGrowthTimer = fCfg.growthTimer[this.farmStage];
          }
        }
      } else {
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
    } else if (fCfg.isMobFarm) {
       // Mob farm logic
       // ...
    }
  }

  getNearbyTurrets() {
    return state.world.getAllTurrets();
  }

  protected executeActions(wPos: any) {
    super.executeActions(wPos);
  }

  protected performHarvest() {
    const fCfg = this.config.farmConfig;
    if (!fCfg) return;
    
    const wPos = this.getWorldPos();
    if (fCfg.lootConfigOnHarvest) {
      const count = fCfg.lootCount || 1;
      for (let i = 0; i < count; i++) {
        const px = wPos.x + random(-10, 10);
        const py = wPos.y + random(-10, 10);
        spawnLootAt(px, py, fCfg.lootConfigOnHarvest);
      }
    }

    if (fCfg.resetAfterHarvest) {
      this.farmStage = 0;
      this.farmGrowthTimer = fCfg.growthTimer[0];
      this.farmElixirCount = 0;
      this.farmHarvestHp = fCfg.harvestStageHp || 100;
    } else {
      this.health = 0; // Destroy after harvest if no reset
      this.onDeath();
    }
    
    state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
  }

  protected onDeath() {
    super.onDeath();
    state.world.removeTurret(this.gx, this.gy);
  }
}

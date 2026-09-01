
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { GRID_SIZE, CHUNK_SIZE } from '../../../constants';
import { Enemy } from '../../enemy';
import { spawnMergeVFX } from '../../../vfx/index';
import { spawnLootEntity } from '../../loot';
import { triggerUpgradeHook } from '../../../src/upgrades';

declare const floor: any;
declare const random: any;
declare const atan2: any;
declare const cos: any;
declare const sin: any;

export class ActionFarm extends TurretAction {
  tags = ['farm', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Farm is passive/continuous
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = (this.turret.config as any).farmConfig;
    const baseRange = config?.attractRange || 128;
    return baseRange * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = (this.turret.config as any).farmConfig;
    const type = 'farm';
    
    if (!config) return;
    
    const isHarvestStage = (this.turret as any).farmStage === config.assetImg.length - 1;
    
    if (!isHarvestStage) {
      const elixirNeeded = config.elixirRequired[(this.turret as any).farmStage] || 0;
      const hasRequirement = (this.turret as any).farmElixirCount >= elixirNeeded;

      if (hasRequirement) {
        if ((this.turret as any).farmGrowthTimer > 0) {
          (this.turret as any).farmGrowthTimer--;
        } else {
          (this.turret as any).farmStage++;
          (this.turret as any).farmElixirCount = 0;
          if ((this.turret as any).farmStage < config.assetImg.length) {
            (this.turret as any).farmGrowthTimer = config.growthTimer[(this.turret as any).farmStage];
          }
        }
      } else {
        const range = this.getRange();
        const rangeSq = range * range;
        let currentlyAttractedCount = 0;
        
        state.activeChunkKeys.forEach((key: string) => {
          const chunk = state.world.chunks.get(key);
          if (chunk) {
            for (let l of chunk.loot) {
              if ((l as any).isBeingAttractedByFarm && (l as any).farmAttractor === this.turret) {
                currentlyAttractedCount++;
              }
            }
          }
        });

        if ((this.turret as any).farmElixirCount + currentlyAttractedCount < elixirNeeded) {
          state.activeChunkKeys.forEach((key: string) => {
            const chunk = state.world.chunks.get(key);
            if (chunk) {
              for (let l of chunk.loot) {
                if ((l as any).typeKey === 'elixir' && (l as any).life > 0 && !(l as any).isBeingAttractedByFarm) {
                  const dSq = (wPos.x - l.pos.x)**2 + (wPos.y - l.pos.y)**2;
                  if (dSq < rangeSq) {
                    (l as any).isBeingAttractedByFarm = true;
                    (l as any).farmAttractor = this.turret;
                    currentlyAttractedCount++;
                    if ((this.turret as any).farmElixirCount + currentlyAttractedCount >= elixirNeeded) break;
                  }
                }
              }
            }
          });
        }
      }
    } else {
      // Harvest stage
      if (config.isMobFarm) {
        if (state.frames % (config.mobSpawnRate || 60) === 0) {
            this.spawnMobFarmEnemy();
            if (config.resetAfterHarvest) {
              (this.turret as any).farmStage = 0;
              (this.turret as any).farmGrowthTimer = config.growthTimer[0];
              (this.turret as any).farmElixirCount = 0;
              (this.turret as any).farmHarvestHp = config.harvestStageHp || 100;
            }
        }
        
        if (config.resetAfterHarvest && (this.turret as any).farmHarvestHp <= 0) {
          (this.turret as any).farmStage = 0;
          (this.turret as any).farmGrowthTimer = config.growthTimer[0];
          (this.turret as any).farmElixirCount = 0;
          (this.turret as any).farmHarvestHp = config.harvestStageHp || 100;
        }
      }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  onDamage(dmg: number, source?: any): boolean {
    const fCfg = (this.turret.config as any).farmConfig;
    if (!fCfg) return false;
    
    const isHarvestStage = (this.turret as any).farmStage === fCfg.assetImg.length - 1;
    if (isHarvestStage && !fCfg.isMobFarm) {
      if (dmg > 0) {
        (this.turret as any).farmHarvestHp -= dmg;
        this.turret.flashTimer = 8;
        this.turret.flashType = 'damage';
        this.turret.hurtAnimTimer = 10;
        if ((this.turret as any).farmHarvestHp <= 0) {
          if (source) {
            triggerUpgradeHook('onMine', source, { target: this.turret, targetType: 'block', typeName: this.turret.type });
          }
          this.performHarvest();
        }
      } else if (dmg < 0) {
        (this.turret as any).farmHarvestHp = Math.min(fCfg.harvestStageHp || 100, (this.turret as any).farmHarvestHp - dmg);
        this.turret.flashTimer = 8;
        this.turret.flashType = 'heal';
      }
      return true; // Damage handled by farm logic
    }
    return false;
  }

  public performHarvest() {
    const fCfg = (this.turret.config as any).farmConfig;
    const wPos = this.turret.getWorldPos();
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
      (this.turret as any).farmStage = 0;
      (this.turret as any).farmGrowthTimer = fCfg.growthTimer[0];
      (this.turret as any).farmElixirCount = 0;
      (this.turret as any).farmHarvestHp = fCfg.harvestStageHp || 100;
    } else {
      this.turret.health = 0;
      (this.turret as any).onDeath();
    }
    
    state.vfx.push(spawnMergeVFX(wPos.x, wPos.y, [255, 255, 255]));
  }

  private spawnMobFarmEnemy() {
    const config = (this.turret.config as any).farmConfig;
    const mCfg = config.mobSpawnConfig;
    if (!mCfg) return;
    const spawnCount = mCfg.spawnCount || 1;
    for (let i = 0; i < spawnCount; i++) {
        const enemyType = mCfg.enemies[floor(random(mCfg.enemies.length))];
        const wPos = this.turret.getWorldPos();
        const pPos = state.player.pos;
        const dirToPlayer = atan2(pPos.y - wPos.y, pPos.x - wPos.x);
        const spawnAngle = dirToPlayer + Math.PI + random(-0.5, 0.5); 
        const spawnDist = mCfg.spawnDist || GRID_SIZE * 2;
        const sx = wPos.x + cos(spawnAngle) * spawnDist;
        const sy = wPos.y + sin(spawnAngle) * spawnDist;
        state.enemies.push(new Enemy(sx, sy, enemyType));
        state.vfx.push(spawnMergeVFX(sx, sy, [255, 255, 255]));
    }
  }

  update() {
  }
}

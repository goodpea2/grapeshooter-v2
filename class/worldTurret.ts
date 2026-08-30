
import { Turret } from './turret';
import { state } from '../state';
import { GRID_SIZE, WORLD_TURRET_ACTIVE_RANGE } from '../constants';
import { turretTypes } from '../balanceTurrets';
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
declare const lerp: any;
declare const p5: any;

export class WorldTurret extends Turret {
  gx: number;
  gy: number;
  pos: any;
  vel: any = createVector(0, 0);

  constructor(type: string, gx: number, gy: number) {
    super(type);
    this.gx = gx;
    this.gy = gy;
    this.pos = createVector(gx * GRID_SIZE + GRID_SIZE / 2, gy * GRID_SIZE + GRID_SIZE / 2);
  }

  update() {
    this.updateMovement();
    super.update();
  }

  private updateMovement() {
    const targetX = this.gx * GRID_SIZE + GRID_SIZE / 2;
    const targetY = this.gy * GRID_SIZE + GRID_SIZE / 2;
    if (!this.pos) {
      this.pos = createVector(targetX, targetY);
      return;
    }
    if (!this.vel) {
      this.vel = createVector(0, 0);
    }

    const dX = targetX - this.pos.x;
    const dY = targetY - this.pos.y;
    const d = Math.sqrt(dX * dX + dY * dY);

    if (d > 0.5) {
      this.isRelocating = true;
      const targetVec = createVector(targetX, targetY);
      const desired = p5.Vector.sub(targetVec, this.pos);
      const maxSpeed = 4.5;
      const maxForce = 0.4;

      if (d < 30) {
        const m = lerp(1.5, maxSpeed, d / 30);
        desired.setMag(m);
      } else {
        desired.setMag(maxSpeed);
      }

      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(maxForce);
      this.vel.add(steer);
      this.vel.mult(0.92);

      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;

      if (d < 1.0) {
        this.pos.x = targetX;
        this.pos.y = targetY;
        this.vel.set(0, 0);
        this.isRelocating = false;
      }
    } else {
      this.pos.x = targetX;
      this.pos.y = targetY;
      this.vel.set(0, 0);
      this.isRelocating = false;
    }
  }

  getWorldPos() {
    return this.pos;
  }

  replaceWith(type: string) {
    const newTurret = new WorldTurret(type, this.gx, this.gy);
    state.world.removeTurret(this.gx, this.gy);
    state.world.addTurret(newTurret);
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

  public onDeath() {
    super.onDeath();
    state.world.removeTurret(this.gx, this.gy);
  }
}

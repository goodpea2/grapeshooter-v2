import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';
import { spawnStaminaAbsorbVFX } from '../../../vfx/index';

export class MinechargeAttachedTurret extends AttachedTurret {
  staminaSpent: number = 0;
  lastPlayerTotalStaminaSpent: number = 0;

  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent, hq, hr);
    this.customAssetImg = 't_minecharge_charge1';
  }

  customUpdate() {
    const isArmed = this.isArmed();

    if (!isArmed) {
      if (this.staminaSpent > 0) {
        this.staminaSpent = 0;
        this.growthProgress = 0;
        this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
      }
      this.customAssetImg = 't_minecharge_unarmed';
      this.conditions.delete('c_raged_visualonly');
      this.lastPlayerTotalStaminaSpent = state.player ? (state.player.totalStaminaSpent || 0) : 0;
      return;
    }

    if (state.player) {
      const currentTotal = state.player.totalStaminaSpent || 0;
      if (this.lastPlayerTotalStaminaSpent === undefined) {
        this.lastPlayerTotalStaminaSpent = currentTotal;
      }
      const diff = Math.max(0, currentTotal - this.lastPlayerTotalStaminaSpent);
      this.lastPlayerTotalStaminaSpent = currentTotal;

      if (diff > 0 && this.staminaSpent < 500) {
        this.staminaSpent = Math.min(500, this.staminaSpent + diff);
        if (state.frames % 6 === 0) {
          const wPos = this.getWorldPos();
          spawnStaminaAbsorbVFX(wPos.x, wPos.y);
        }
      }
    }

    this.growthProgress = this.staminaSpent;
    this.config.actionConfig.maxGrowth = 500;

    if (this.staminaSpent >= 500) {
      this.customAssetImg = 't_minecharge_charge3';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion3';
    } else if (this.staminaSpent >= 200) {
      this.customAssetImg = 't_minecharge_charge2';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion2';
    } else {
      this.customAssetImg = 't_minecharge_charge1';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
    }
  }
}

export class MinechargeWorldTurret extends WorldTurret {
  staminaSpent: number = 0;

  constructor(type: string, gx: number, gy: number) {
    super(type, gx, gy);
    this.customAssetImg = 't_minecharge_charge1';
  }

  customUpdate() {
    const isArmed = this.isArmed();

    if (!isArmed) {
      if (this.staminaSpent > 0) {
        this.staminaSpent = 0;
        this.growthProgress = 0;
        this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
      }
      this.customAssetImg = 't_minecharge_unarmed';
      this.conditions.delete('c_raged_visualonly');
      return;
    }

    this.growthProgress = this.staminaSpent;
    this.config.actionConfig.maxGrowth = 500;

    if (this.staminaSpent >= 500) {
      this.customAssetImg = 't_minecharge_charge3';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion3';
    } else if (this.staminaSpent >= 200) {
      this.customAssetImg = 't_minecharge_charge2';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion2';
    } else {
      this.customAssetImg = 't_minecharge_charge1';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
    }
  }
}

export const t3_minecharge: TurretConfig = {
  name: 'Cherry Bomb',
  costs: { sun: 55 },
  costAlmanac: { fuel: 16, shard: 6 },
  drops: { fuel: 3, shard: 1 },
  health: 100,
  color: [255, 80, 0],
  size: 22,
  tier: 3,
  tooltip: "Charges for bigger mine explosion",
  animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: {
    pulseBulletTypeKey: 'b_mine_explosion',
    pulseTriggerRadius: GRID_SIZE * 3.5,
    pulseTriggerBy: ['enemy'],
    pulseCooldown: HOUR_FRAMES * 2,
    pulseCenteredAtTriggerSource: true,
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true,
    maxGrowth: 500
  },
  actionTypeWhileCharged: ['pulse'],
  actionConfigWhileCharged: {
    pulseBulletTypeKey: 'b_mine_explosion',
    pulseTriggerRadius: GRID_SIZE * 3.5,
    pulseTriggerBy: ['enemy'],
    pulseCooldown: HOUR_FRAMES * 2,
    pulseCenteredAtTriggerSource: true,
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true,
    maxGrowth: 500,
    staminaSpentThresholds: [
      { staminaSpent: 200, pulseBulletTypeKey: 'b_mine_explosion2', assetImg: 't_minecharge_charge2' },
      { staminaSpent: 500, pulseBulletTypeKey: 'b_mine_explosion3', assetImg: 't_minecharge_charge3' }
    ]
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};

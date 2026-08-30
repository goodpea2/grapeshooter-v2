import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';

export class MinechargeAttachedTurret extends AttachedTurret {
  staminaSpent: number = 0;
  lastPlayerStamina: number = 100;

  customUpdate() {
    const pulseCooldown = this.config.actionConfig.pulseCooldown || (HOUR_FRAMES * 2);
    const lastPulse = this.actionTimers.get('pulse') || -999999;
    const isArmed = (state.frames - lastPulse) >= (pulseCooldown / (this.fireRateMultiplier || 1.0)) && this.jumpPhase === null;

    if (!isArmed) {
      if (this.staminaSpent > 0) {
        this.staminaSpent = 0;
        this.growthProgress = 0;
        this.customAssetImg = 't_mine';
        this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
      }
      this.lastPlayerStamina = state.player ? state.player.stamina : 100;
      return;
    }

    if (state.player) {
      if (this.isCharged()) {
        const diff = Math.max(0, this.lastPlayerStamina - state.player.stamina);
        if (diff > 0) {
          this.staminaSpent = Math.min(500, this.staminaSpent + diff);
        } else if (state.player.stamina > 0 && this.staminaSpent < 500) {
          // Direct charge consumption when player is holding boost
          const drain = Math.min(state.player.stamina, 0.5);
          state.player.stamina = Math.max(0, state.player.stamina - drain);
          this.staminaSpent = Math.min(500, this.staminaSpent + drain);
        }
      }
      this.lastPlayerStamina = state.player.stamina;
    }

    this.growthProgress = this.staminaSpent;
    this.config.actionConfig.maxGrowth = 500;

    if (this.staminaSpent >= 500) {
      this.customAssetImg = 't3_minefield';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion3';
    } else if (this.staminaSpent >= 200) {
      this.customAssetImg = 't2_minespawner';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion2';
    } else {
      this.customAssetImg = 't_mine';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
    }
  }
}

export class MinechargeWorldTurret extends WorldTurret {
  staminaSpent: number = 0;
  lastPlayerStamina: number = 100;

  customUpdate() {
    const pulseCooldown = this.config.actionConfig.pulseCooldown || (HOUR_FRAMES * 2);
    const lastPulse = this.actionTimers.get('pulse') || -999999;
    const isArmed = (state.frames - lastPulse) >= (pulseCooldown / (this.fireRateMultiplier || 1.0)) && this.jumpPhase === null;

    if (!isArmed) {
      if (this.staminaSpent > 0) {
        this.staminaSpent = 0;
        this.growthProgress = 0;
        this.customAssetImg = 't_mine';
        this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
      }
      return;
    }

    this.growthProgress = this.staminaSpent;
    this.config.actionConfig.maxGrowth = 500;

    if (this.staminaSpent >= 500) {
      this.customAssetImg = 't3_minefield';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion3';
    } else if (this.staminaSpent >= 200) {
      this.customAssetImg = 't2_minespawner';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion2';
    } else {
      this.customAssetImg = 't_mine';
      this.config.actionConfig.pulseBulletTypeKey = 'b_mine_explosion';
    }
  }
}

export const t3_minecharge: TurretConfig = {
  name: 'Mine Charger',
  costs: { sun: 65 },
  costAlmanac: { fuel: 16, shard: 6 },
  drops: { fuel: 3, shard: 1 },
  health: 120,
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
  whileCharged: {
    staminaSpentThresholds: [
      { staminaSpent: 200, pulseBulletTypeKey: 'b_mine_explosion2', assetImg: 't2_minespawner' },
      { staminaSpent: 500, pulseBulletTypeKey: 'b_mine_explosion3', assetImg: 't3_minefield' }
    ]
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};

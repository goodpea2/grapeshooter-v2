import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';
import { spawnStaminaFlyToTurretVFX, spawnStaminaFlyOutVFX, spawnStaminaAbsorbVFX } from '../../../vfx/index';

export class PowerbankAttachedTurret extends AttachedTurret {
  stamina: number = 100;
  maxStamina: number = 100;

  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent, hq, hr);
    this.updateVisualStage();
  }

  updateVisualStage() {
    if (this.stamina >= 100) {
      this.customAssetImg = 't_powerbank_stage3';
    } else if (this.stamina >= 25) {
      this.customAssetImg = 't_powerbank_stage2';
    } else {
      this.customAssetImg = 't_powerbank_stage1';
    }
  }

  customUpdate() {
    // Auto-recharge independently: 1 stamina per 30 frames
    if (state.frames % 30 === 0 && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 1);
      const wPos = this.getWorldPos();
      spawnStaminaAbsorbVFX(wPos.x, wPos.y);
    }
    this.growthProgress = this.stamina;
    if (this.config.actionConfig) {
      this.config.actionConfig.maxGrowth = this.maxStamina;
    }
    this.updateVisualStage();
  }

  spendStamina(amount: number): number {
    if (amount <= 0 || this.stamina <= 0) return 0;
    const spent = Math.min(this.stamina, amount);
    this.stamina -= spent;
    this.growthProgress = this.stamina;
    this.updateVisualStage();
    if (state.frames % 4 === 0) {
      const wPos = this.getWorldPos();
      spawnStaminaFlyOutVFX(wPos.x, wPos.y);
    }
    return spent;
  }

  addStamina(amount: number): number {
    if (amount <= 0 || this.stamina >= this.maxStamina) return 0;
    const added = Math.min(this.maxStamina - this.stamina, amount);
    this.stamina += added;
    this.growthProgress = this.stamina;
    this.updateVisualStage();
    const wPos = this.getWorldPos();
    spawnStaminaAbsorbVFX(wPos.x, wPos.y);
    return added;
  }
}

export class PowerbankWorldTurret extends WorldTurret {
  stamina: number = 100;
  maxStamina: number = 100;

  constructor(type: string, gx: number, gy: number) {
    super(type, gx, gy);
    this.updateVisualStage();
  }

  updateVisualStage() {
    if (this.stamina >= 100) {
      this.customAssetImg = 't_powerbank_stage3';
    } else if (this.stamina >= 25) {
      this.customAssetImg = 't_powerbank_stage2';
    } else {
      this.customAssetImg = 't_powerbank_stage1';
    }
  }

  customUpdate() {
    // Auto-recharge independently: 1 stamina per 30 frames
    if (state.frames % 30 === 0 && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 1);
      const wPos = this.getWorldPos();
      spawnStaminaAbsorbVFX(wPos.x, wPos.y);
    }
    this.growthProgress = this.stamina;
    if (this.config.actionConfig) {
      this.config.actionConfig.maxGrowth = this.maxStamina;
    }
    this.updateVisualStage();

    // World powerbanks transfer stamina to attached powerbanks within 2 tiles radius at 10 stamina per 15 frames
    if (state.frames % 15 === 0 && this.stamina > 0 && state.player && state.player.attachments) {
      const myPos = this.getWorldPos();
      const transferRadius = GRID_SIZE * 2.0;
      const transferRadiusSq = (transferRadius + 4) * (transferRadius + 4);

      for (const att of state.player.attachments) {
        if (att.type === 't3_powerbank') {
          const pbAtt = att as PowerbankAttachedTurret;
          if (pbAtt.stamina < pbAtt.maxStamina) {
            const aPos = pbAtt.getWorldPos();
            const dx = aPos.x - myPos.x;
            const dy = aPos.y - myPos.y;
            if (dx * dx + dy * dy <= transferRadiusSq) {
              const needed = pbAtt.maxStamina - pbAtt.stamina;
              const amountToTransfer = Math.min(10, this.stamina, needed);
              if (amountToTransfer > 0) {
                this.stamina -= amountToTransfer;
                this.growthProgress = this.stamina;
                spawnStaminaFlyOutVFX(myPos.x, myPos.y);
                spawnStaminaFlyToTurretVFX(myPos.x, myPos.y, pbAtt);
                if (pbAtt.addStamina) {
                  pbAtt.addStamina(amountToTransfer);
                } else {
                  pbAtt.stamina += amountToTransfer;
                  pbAtt.growthProgress = pbAtt.stamina;
                  spawnStaminaAbsorbVFX(aPos.x, aPos.y);
                }
                break;
              }
            }
          }
        }
      }
    }
  }

  spendStamina(amount: number): number {
    if (amount <= 0 || this.stamina <= 0) return 0;
    const spent = Math.min(this.stamina, amount);
    this.stamina -= spent;
    this.growthProgress = this.stamina;
    this.updateVisualStage();
    const wPos = this.getWorldPos();
    spawnStaminaFlyOutVFX(wPos.x, wPos.y);
    return spent;
  }

  addStamina(amount: number): number {
    if (amount <= 0 || this.stamina >= this.maxStamina) return 0;
    const added = Math.min(this.maxStamina - this.stamina, amount);
    this.stamina += added;
    this.growthProgress = this.stamina;
    this.updateVisualStage();
    const wPos = this.getWorldPos();
    spawnStaminaAbsorbVFX(wPos.x, wPos.y);
    return added;
  }
}

export const t3_powerbank: TurretConfig = {
  name: 'Power Plant',
  costs: { sun: 75 },
  costAlmanac: { fuel: 10, shard: 8, shell: 7 },
  drops: { fuel: 1, shard: 1, shell: 1 },
  health: 300,
  color: [80, 200, 255],
  size: 22,
  tier: 3,
  tooltip: "Holds up to 100 extra stamina, slowly charges on its own.",
  animationBodyType: 'tough',
  actionType: [],
  actionConfig: {
    maxGrowth: 100
  },
  targetType: [],
  targetConfig: {}
};

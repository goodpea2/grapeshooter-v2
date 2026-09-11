import { TurretConfig } from '../turretConfig';
import { t_wall } from './t_wall';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { spawnGreenEssenceVFX } from '../../../vfx/index';
import { spawnLootAt } from '../../../economy';

export class DensnutAttachedTurret extends AttachedTurret {
  damageAccumulated: number = 0;

  customOnDamage(dmg: number, source?: any): boolean {
    if (dmg <= 0) return false;
    this.damageAccumulated += dmg;
    while (this.damageAccumulated >= 300) {
      this.damageAccumulated -= 300;
      this.dropWallLootWithEssence();
    }
    return false; // Proceed with normal damage deduction
  }

  private dropWallLootWithEssence() {
    const wPos = this.getWorldPos();
    const dropTargetX = wPos.x + (Math.random() - 0.5) * 40;
    const dropTargetY = wPos.y + (Math.random() - 0.5) * 40;

    spawnGreenEssenceVFX(wPos.x, wPos.y, dropTargetX, dropTargetY, () => {
      spawnLootAt(dropTargetX, dropTargetY, 't_wall');
    });
  }
}

export class DensnutWorldTurret extends WorldTurret {
  damageAccumulated: number = 0;

  customOnDamage(dmg: number, source?: any): boolean {
    if (dmg <= 0) return false;
    this.damageAccumulated += dmg;
    while (this.damageAccumulated >= 300) {
      this.damageAccumulated -= 300;
      this.dropWallLootWithEssence();
    }
    return false;
  }

  private dropWallLootWithEssence() {
    const wPos = this.getWorldPos();
    const dropTargetX = wPos.x + (Math.random() - 0.5) * 40;
    const dropTargetY = wPos.y + (Math.random() - 0.5) * 40;

    spawnGreenEssenceVFX(wPos.x, wPos.y, dropTargetX, dropTargetY, () => {
      spawnLootAt(dropTargetX, dropTargetY, 't_wall');
    });
  }
}

export const t3_densnut: TurretConfig = { 
  ...t_wall,
  name: 'Densnut', 
  costs: { sun: 45 }, 
  costAlmanac: { shell: 15 }, 
  drops: {}, 
  health: 1200, 
  tier: 3, 
  color: [200, 200, 220], 
  size: 22, 
  tooltip: "Tough defensive wall. Every 150 HP lost, spawns a Wallnut", 
  animationBodyType: 'tough',
};

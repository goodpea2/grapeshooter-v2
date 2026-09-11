import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';
import { Bullet } from '../../bullet';
import { spawnMuzzleFlash } from '../../../vfx/index';

export class DurianAttachedTurret extends AttachedTurret {
  customOnDamage(dmg: number, source?: any): boolean {
    if (dmg <= 0) return false;
    this.shootSpikeAtNearestEnemy();
    return false;
  }

  private shootSpikeAtNearestEnemy() {
    const myPos = this.getWorldPos();
    let closestEnemy: any = null;
    let minDistSq = (GRID_SIZE * 10) ** 2;

    for (const e of state.enemies) {
      if (e.health <= 0) continue;
      const dx = e.pos.x - myPos.x;
      const dy = e.pos.y - myPos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestEnemy = e;
      }
    }

    if (closestEnemy) {
      const b = Bullet.create(myPos.x, myPos.y, closestEnemy.pos.x, closestEnemy.pos.y, 'b_durian_spike', 'enemy', this);
      state.bullets.push(b);
      spawnMuzzleFlash(myPos.x, myPos.y, 0, 20, 6, [220, 200, 50]);
    }
  }
}

export class DurianWorldTurret extends WorldTurret {
  customOnDamage(dmg: number, source?: any): boolean {
    if (dmg <= 0) return false;
    this.shootSpikeAtNearestEnemy();
    return false;
  }

  private shootSpikeAtNearestEnemy() {
    const myPos = this.getWorldPos();
    let closestEnemy: any = null;
    let minDistSq = (GRID_SIZE * 10) ** 2;

    for (const e of state.enemies) {
      if (e.health <= 0) continue;
      const dx = e.pos.x - myPos.x;
      const dy = e.pos.y - myPos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        closestEnemy = e;
      }
    }

    if (closestEnemy) {
      const b = Bullet.create(myPos.x, myPos.y, closestEnemy.pos.x, closestEnemy.pos.y, 'b_durian_spike', 'enemy', this);
      state.bullets.push(b);
      spawnMuzzleFlash(myPos.x, myPos.y, 0, 20, 6, [220, 200, 50]);
    }
  }
}

export const t3_durian: TurretConfig = { 
  name: 'Defecting Durian', 
  costs: { sun: 65 }, 
  costAlmanac: { shell: 12, fuel: 9 }, 
  drops: { shell: 2, fuel: 1 }, 
  health: 1200, 
  tier: 3, 
  color: [200, 180, 50], 
  size: 22, 
  tooltip: "Defensive wall that shoots back when damaged", 
  animationBodyType: 'tough',
  actionType: [],
  actionConfig: {},
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

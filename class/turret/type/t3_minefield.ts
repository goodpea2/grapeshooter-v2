import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { t2_minespawner } from './t2_minespawner';

export const t3_minefield: TurretConfig = { 
  ...t2_minespawner,
  name: 'Mine Field', costs: { sun: 45 }, costAlmanac: { fuel: 15 }, drops: { fuel: 3 }, health: 150, color: [255, 60, 0], size: 22, tier: 3, 
  tooltip: "Launches 8 mini mines upon planting, then keeps launching mines and exploding", animationBodyType: 'soft',
  actionType: ['pulse', 'spawnBulletAtRandom', 'firstStrike'],
  actionConfig: { 
    ...t2_minespawner.actionConfig,
    pulseBulletTypeKey: 'b_minefield_explosion',
    pulseTriggerRadius: GRID_SIZE * 1.5, 
    pulseCooldown: HOUR_FRAMES * 2, 
    spawnBulletAtRandom: { 
        cooldown: HOUR_FRAMES * 2, 
        distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
        bulletKey: 'b_floating_mine_t3',
        enabledWhenActionIsReady: 'pulse'
    },
    firstStrikeConfig: { actionToTrigger: 'spawnBulletAtRandom', triggerCount: 8, triggerRate: 10, FirstStrikeVfx: 'turret_first_strike' }
  },
};

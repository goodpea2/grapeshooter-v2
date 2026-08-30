import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t2_minespawner: TurretConfig = {
  name: 'Mine Launcher', costs: { sun: 25 }, costAlmanac: { fuel: 8 }, drops: { fuel: 2 }, health: 50, color: [255, 20, 20], size: 22, tier: 2,
  tooltip: "Launches a mine every 2h to a random direction", animationBodyType: 'soft',
  unarmedAssetApplyToAction: ['pulse'],
  actionType: ['pulse', 'spawnBulletAtRandom'],
  actionConfig: { 
      pulseBulletTypeKey: 'b_mine_explosion',
      pulseTriggerRadius: GRID_SIZE * 3.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: true,
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true,
      spawnBulletAtRandom: { 
          cooldown: HOUR_FRAMES * 2, 
          distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
          bulletKey: 'b_floating_mine',
          enabledWhenActionIsReady: 'pulse'
      }
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

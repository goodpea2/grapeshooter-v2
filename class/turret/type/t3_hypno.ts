import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t3_hypno: TurretConfig = {
  name: 'Hypnotizer',
  costs: { sun: 70 },
  costAlmanac: { shard: 10, shell: 6, fuel: 7 },
  drops: { shard: 1, shell: 1, fuel: 1 },
  health: 100,
  color: [220, 100, 255],
  size: 22,
  tier: 3,
  tooltip: "Hypnotizes enemies, armed every 2h",
  animationBodyType: 'soft',
  assetImg: 't_hypno',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_hypno_explosion', 
    pulseTriggerRadius: GRID_SIZE * 3.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 3, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};

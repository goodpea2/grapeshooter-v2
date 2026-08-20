import { TurretConfig } from '../turretConfig';
import { HOUR_FRAMES } from '../../../constants';

export const t_sunflower: TurretConfig = {
  name: 'Sunflower', cost: 0, health: 50, color: [255, 230, 50], size: 22, tier: 1.5,
  isActiveWhileMoving: false, animationBodyType: 'soft',
  tooltip: "Spawns 1 Sun every hour.",
  actionType: ['passiveSun'],
  actionConfig: { sunCooldown: HOUR_FRAMES },
  targetType: [], targetConfig: {}
};

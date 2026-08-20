import { TurretConfig } from '../turretConfig';
import { HOUR_FRAMES } from '../../../constants';

export const t_seed: TurretConfig = {
  name: 'Seed', cost: 0, health: 50, color: [200, 200, 200], size: 16, tier: 1.5,
  isActiveWhileMoving: false, animationBodyType: 'soft',
  tooltip: "Grows into a random Tier 1 turret over time. Water speeds up growth.",
  actionType: ['growth'],
  actionConfig: { maxGrowth: 32, growthInterval: HOUR_FRAMES * 0.25, growthPool: ['t_pea', 't_laser', 't_wall', 't_mine', 't_ice'] },
  targetType: [], targetConfig: {}
};

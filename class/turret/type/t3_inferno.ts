import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_inferno: TurretConfig = { 
  name: 'Inferno Ray', costs: { sun: 40 }, costAlmanac: { leaf: 4, shard: 6, shell: 2 }, drops: { leaf: 1, shard: 1, shell: 1 }, health: 300, color: [255, 50, 50], size: 24, tier: 3,
  tooltip: "Laser increases damage over time if not interrupted, prioritize highest health", animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { 
      beamDamage: 5, 
      beamDamageRate: 15, 
      beamWidth: 3, 
      beamDuration: 1, 
      beamFireRate: 15, 
      beamDamageWidth: 0, 
      beamAutoLength: true, 
      beamMaxLength: GRID_SIZE * 5,
      uninteruptedDamageIncrease: [15, 30, 60],
      uninteruptedTimeForDamageIncrease: [120, 120, 120]
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'highestHealth', obstaclePriority: 'highestHealth' }
};

import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_bowling: TurretConfig = { 
  name: 'Bowling Bulb', costs: { sun: 60 }, costAlmanac: { leaf: 10, shard: 4, ice: 6 }, drops: { leaf: 1, shard: 1, ice: 1 }, health: 300, color: [180, 255, 50], size: 24, tier: 3,
  tooltip: "Shoots heavy rolling projectiles that pushes enemies out of the way", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { 
    bulletTypeKey: 'b_bowling_bulb', 
    shootRange: GRID_SIZE * 4, 
    shootFireRate: 90 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

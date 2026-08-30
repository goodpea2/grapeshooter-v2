import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_flamethrower: TurretConfig = { 
  name: 'Flamethrower', costs: { sun: 80 }, costAlmanac: { leaf: 6, shard: 8, fuel: 6 }, drops: { leaf: 1, shard: 1, fuel: 1 }, health: 100, color: [255, 100, 0], size: 22, tier: 3,
  tooltip: "Shoots and spread flaming puddles along the way", animationBodyType: 'soft',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_flame_shot', shootRange: GRID_SIZE * 5, shootFireRate: [75,15] },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'random', obstaclePriority: 'valuable' }
};

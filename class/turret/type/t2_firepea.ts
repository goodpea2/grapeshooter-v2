import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';

export const t2_firepea: TurretConfig = {
  ...t_pea,
  name: 'Firepea', costs: { sun: 30 }, costAlmanac: { leaf: 4, shard: 6 }, drops: { leaf: 1, shard: 1 }, health: 50, color: [255, 60, 40], size: 22, tier: 2,
  tooltip: "Shoots at both enemy and obstacles, leaves a flaming puddle", animationBodyType: 'soft',
  actionConfig: { 
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_firepea' 
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { 
    ...t_pea.targetConfig,
    obstaclePriority: 'valuable' 
  }
};

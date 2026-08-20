import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t3_triberg: TurretConfig = { 
  name: 'Iceberg Chain', costs: { sun: 35 }, costAlmanac: { ice: 12 }, drops: { ice: 3 }, health: 150, color: [150, 240, 255], size: 22, tier: 3, 
  tooltip: "Leaves up to 3 gas puddles on enemies within range", animationBodyType: 'soft',
  actionType: ['shootMultiTarget'],
  actionConfig: { 
    hasUnarmedAsset: true,
    bulletTypeKey: 'b_triberg_gas_projectile', 
    shootRange: GRID_SIZE * 3.5, 
    shootFireRate: HOUR_FRAMES * 2,
    multiTargetMinCount: 1,
    multiTargetMaxCount: 3,
    multiTargetShootDelay: 60,
    inaccuracy: 15
  },
  targetType: ['enemy'], targetConfig: { enemyPriority: 'random' }
};

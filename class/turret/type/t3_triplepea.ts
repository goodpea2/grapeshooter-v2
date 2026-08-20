import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_triplepea: TurretConfig = { 
  name: 'Tripeater', costs: { sun: 50 }, costAlmanac: { leaf: 18 }, drops: { leaf: 3 }, health: 150, color: [0, 200, 50], size: 24, tier: 3,
  tooltip: "Shoots at 4 targets at once.", animationBodyType: 'soft',
  actionType: ['shootMultiTarget'],
  actionConfig: {
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 10,
    shootFireRate: 60,
    multiTargetMinCount: 4, 
    multiTargetMaxCount: 4,
    multiTargetShootDelay: 4
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

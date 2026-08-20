import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_peanut: TurretConfig = {
  name: 'Peanut', costs: { sun: 25 }, costAlmanac: { leaf: 3, shell: 5 }, drops: { leaf: 1, shell: 1 }, health: 300, color: [220, 200, 150], size: 22, tier: 2,
  tooltip: "Wall that shoots with high inaccuracy", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 10, shootFireRate: 15, inaccuracy: 45 },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

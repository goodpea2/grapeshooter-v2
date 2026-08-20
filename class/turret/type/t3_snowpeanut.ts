import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_peanut } from './t2_peanut';

export const t3_snowpeanut: TurretConfig = { 
  ...t2_peanut,
  name: 'Snow Peanut', costs: { sun: 50 }, costAlmanac: { leaf: 4, shell: 8, ice: 6 }, drops: { leaf: 1, shell: 1, ice: 1 }, health: 400, color: [180, 220, 255], size: 22, tier: 3,
  tooltip: "Wall that shoots with high inaccuracy, slowing enemies down", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_peanut.actionConfig,
    bulletTypeKey: 'b_snowpea', 
    shootRange: GRID_SIZE * 10, 
    shootFireRate: 15, 
    inaccuracy: 45 
  },
};

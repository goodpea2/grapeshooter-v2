import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_pea } from './t_pea';

export const t3_gatling: TurretConfig = {
  ...t_pea,
  name: 'Gatling Pea',
  costs: { sun: 80 },
  costAlmanac: { leaf: 24 },
  drops: { leaf: 4 },
  health: 120,
  color: [0, 220, 80],
  size: 24,
  tier: 3,
  tooltip: "Rapidly shoot at enemies. Charge speeds up attacking speed",
  animationBodyType: 'soft',
  assetImg: 't3_triplepea',
  actionType: ['shoot'],
  actionConfig: {
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 9,
    shootFireRate: [54, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    inaccuracy: 1
  },
  whileCharged: {
    shootFireRate: [3],
    followPlayerTarget: true
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

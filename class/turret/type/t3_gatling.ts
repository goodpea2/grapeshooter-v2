import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_pea } from './t_pea';

export const t3_gatling: TurretConfig = {
  ...t_pea,
  name: 'Gatling Pea',
  costs: { sun: 80 },
  costAlmanac: { leaf: 24 },
  drops: { leaf: 4 },
  tier: 3,
  tooltip: "Rapidly shoot at enemies. Charge speeds up attacking speed",
  assetImg: 't_gatling',
  actionType: ['shoot'],
  actionConfig: {
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 9,
    shootFireRate: [54, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    inaccuracy: 1
  },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 9,
    inaccuracy: 1,
    shootFireRate: [3],
    staminaCostPerBulletSpawned: 0.3,
    followPlayerTarget: true
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};

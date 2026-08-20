import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t_dummyupgradable: TurretConfig = {
  name: 'Upgradable Dummy', costs: { sun: 5 }, costAlmanac: { leaf: 1 }, health: 100, color: [200, 200, 200], size: 22, tier: 1,
  tooltip: "A special dummy designed for testing the upgrade system.", animationBodyType: 'soft',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgradeCosts: [10, 20, 40, 80, 150],
  classes: ['shooter']
};

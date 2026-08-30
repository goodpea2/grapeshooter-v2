import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_mortar } from './t2_mortar';

export const t3_mortar2: TurretConfig = { 
  ...t2_mortar,
  name: 'Mortar MK2', costs: { sun: 70 }, costAlmanac: { leaf: 10, fuel: 10 }, drops: { leaf: 2, fuel: 1 }, health: 100, color: [200, 50, 0], size: 22, tier: 3,
  tooltip: "Shoots at enemy, bullet explodes with greater splash damage", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_mortar.actionConfig,
    bulletTypeKey: 'b_mortar_shell_t3', shootRange: GRID_SIZE * 14, shootFireRate: 90 
  },
};

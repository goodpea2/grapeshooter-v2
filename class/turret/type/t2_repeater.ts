import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';

export const t2_repeater: TurretConfig = {
  ...t_pea,
  name: 'Repeater', costs: { sun: 25 }, costAlmanac: { leaf: 8 }, drops: { leaf: 2 }, health: 50, color: [0, 180, 80], size: 22, tier: 2,
  tooltip: "Shoots 2 bullets at once", animationBodyType: 'soft',
  actionConfig: { 
    ...t_pea.actionConfig,
    shootFireRate: [50, 10] }
};

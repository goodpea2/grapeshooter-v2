import { TurretConfig } from '../turretConfig';
import { t_wall } from './t_wall';

export const t2_tall: TurretConfig = {
  ...t_wall,
  name: 'Tallnut', costs: { sun: 15 }, costAlmanac: { shell: 5 }, drops: { shell: 2 }, health: 600, color: [140, 140, 150], size: 26, tier: 2,
  tooltip: "Tough defensive wall", animationBodyType: 'tough'
};

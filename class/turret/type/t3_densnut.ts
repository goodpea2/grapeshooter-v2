import { TurretConfig } from '../turretConfig';
import { t_wall } from './t_wall';

export const t3_densnut: TurretConfig = { 
  ...t_wall,
  name: 'Densenut', costs: { sun: 35 }, costAlmanac: { shell: 12 }, drops: { shell: 3 }, health: 1200, tier: 3, color: [200, 200, 220], size: 24, 
  tooltip: "Super tough defensive wall", animationBodyType: 'tough',
};

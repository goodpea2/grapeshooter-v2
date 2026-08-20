import { TurretConfig } from '../turretConfig';

export const t_wall: TurretConfig = { 
  name: 'Wallnut', costs: { sun: 5 }, costAlmanac: { shell: 2 }, drops: { shell: 1 }, health: 300, color: [200, 200, 220], size: 22, tier: 1, cooldownHours: 2,
  tooltip: "Simple defensive wall", animationBodyType: 'tough',
  actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
};

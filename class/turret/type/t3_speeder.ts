import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_speeder: TurretConfig = {
  name: 'Ramboostan',
  costs: { sun: 80 },
  costAlmanac: { fuel: 6, ice: 20 },
  drops: { fuel: 1, ice: 2 },
  health: 100,
  color: [255, 220, 60],
  size: 22,
  tier: 3,
  tooltip: "Boost nearby plant's attack speed",
  animationBodyType: 'soft',
  actionType: ['aura'],
  actionConfig: {
    auraConfig: {
      radius: GRID_SIZE * 1.5,
      auraVfx: 'aura_speeder',
      boostsTurretConfig: {
        firerateBoost: 0.25
      }
    }
  },
  targetType: [],
  targetConfig: {}
};

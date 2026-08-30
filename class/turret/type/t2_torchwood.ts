import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_torchwood: TurretConfig = { 
  name: 'Torchwood', 
  costs: { sun: 30 }, 
  costAlmanac: { fuel: 5, ice: 5 }, 
  drops: { fuel: 1, ice: 1 }, 
  health: 200, 
  color: [255, 140, 50], 
  size: 22, 
  tier: 2, 
  cooldownHours: 2,
  tooltip: "Emits a field that boost bullet's damage", 
  animationBodyType: 'tough',
  actionType: ['aura'],
  actionConfig: { 
    auraConfig: { 
      radius: GRID_SIZE * 1.5, 
      auraVfx: 'aura_torchwood',
      boostsBulletConfig: {
        damageAdd: 3,
        boostsBulletFromEmitter: ['turret', 'player'],
        flameVisual: true
      }
    } 
  },
  targetType: [], 
  targetConfig: {}
};

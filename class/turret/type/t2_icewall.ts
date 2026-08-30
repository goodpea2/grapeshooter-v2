import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_wall } from './t_wall';

export const t2_icewall: TurretConfig = { 
  ...t_wall,
  name: 'Ice Wallnut', 
  costs: { sun: 15 }, 
  costAlmanac: { shell: 3, ice: 2 }, 
  drops: { shell: 1, ice: 1 }, 
  health: 300, 
  color: [160, 210, 240], 
  size: 22, 
  tier: 2, 
  cooldownHours: 2,
  tooltip: "Emits a small chilling field", 
  animationBodyType: 'tough',
  actionType: ['aura'],
  actionConfig: { 
    auraConfig: { 
      radius: GRID_SIZE * 1.5, 
      appliedCondition: 'c_chilled', 
      duration: 60, 
      auraVfx: 'aura_frostfield' 
    } 
  },
  targetType: [], 
  targetConfig: {}
};

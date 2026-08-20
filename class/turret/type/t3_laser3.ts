import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_laser2 } from './t2_laser2';

export const t3_laser3: TurretConfig = { 
  ...t2_laser2,
  name: 'Mining Laser MK3', costs: { sun: 50 }, costAlmanac: { shard: 18 }, drops: { shard: 3 }, health: 50, tier: 3, color: [50, 200, 255], size: 22, 
  tooltip: "Laser breaks obstacles super fast", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_laser2.actionConfig,
    beamDamage: 20, beamWidth: 8, beamFireRate: 6, beamMaxLength: GRID_SIZE * 10 
  },
};

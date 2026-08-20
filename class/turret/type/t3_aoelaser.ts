import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_laser2 } from './t2_laser2';

export const t3_aoelaser: TurretConfig = { 
  ...t2_laser2,
  name: 'Melting Laser', costs: { sun: 60 }, costAlmanac: { shard: 8, fuel: 12 }, drops: { shard: 2, fuel: 1 }, health: 50, color: [255, 200, 100], size: 22, tier: 3, 
  tooltip: "Fires laser that also damages nearby obstacles", animationBodyType: 'tough',
  actionConfig: { 
    ...t2_laser2.actionConfig,
    beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamFireRate: 6, beamMaxLength: GRID_SIZE * 8, beamBulletTypeKey: 'b_aoelaser_hit' 
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' }
};

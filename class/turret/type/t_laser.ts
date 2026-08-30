import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t_laser: TurretConfig = { 
  name: 'Mining Laser', costs: { sun: 10 }, costAlmanac: { shard: 3 }, drops: { shard: 1 }, health: 50, color: [50, 200, 255], size: 22, tier: 1, cooldownHours: 1,
  tooltip: "Fires laser to break obstacles", animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 4 },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' }
};

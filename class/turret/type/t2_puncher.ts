import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_puncher: TurretConfig = {
  name: 'Puncher', costs: { sun: 20 }, costAlmanac: { shard: 2, shell: 5 }, drops: { shard: 1, shell: 1 }, health: 300, color: [120, 120, 255], size: 22, tier: 2,
  tooltip: "Fires close laser at both obstacles and enemies", animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { beamDamage: 8, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
};

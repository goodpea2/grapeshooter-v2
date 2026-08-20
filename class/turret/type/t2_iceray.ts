import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_iceray: TurretConfig = {
  name: 'Ice Laser', costs: { sun: 20 }, costAlmanac: { shard: 2, ice: 5 }, drops: { shard: 1, ice: 1 }, health: 50, color: [150, 255, 255], size: 22, tier: 2,
  tooltip: "Slows down enemies contacting the laser beam", animationBodyType: 'tough',
  actionType: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfig: { 
      beamDamage: 5, 
      beamDamageRate: 6, 
      beamWidth: 4, 
      beamDuration: 1, 
      beamFireRate: 6, 
      beamDamageWidth: GRID_SIZE * 0.5, 
      beamAutoLength: true, 
      beamMaxLength: GRID_SIZE * 8,
      appliedConditions: [{ type: 'c_chilled', duration: 60 }],
      spawnOnTargetDeathConfig: { count: 8, bulletTypeKey: 'b_snowpea', pattern: 'volley', spawnAt: 'turret', onlyTriggerFromIntendedTargetDeath: true }
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable', enemyPriority: 'closest' }
};

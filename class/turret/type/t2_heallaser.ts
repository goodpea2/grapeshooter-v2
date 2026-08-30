import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_heallaser: TurretConfig = { 
  name: 'Heallaser', 
  costs: { sun: 25 }, 
  costAlmanac: { shard: 3, ice: 5 }, 
  drops: { shard: 1, ice: 1 }, 
  health: 50, 
  color: [120, 255, 180], 
  size: 22, 
  tier: 2, 
  cooldownHours: 1,
  tooltip: "Heals nearby plants everytime a block is mined", 
  animationBodyType: 'tough',
  actionType: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfig: { 
    beamDamage: 5, 
    beamDamageRate: 3, 
    beamWidth: 4, 
    beamDuration: 1, 
    beamFireRate: 6, 
    beamDamageWidth: 0, 
    beamAutoLength: true, 
    beamMaxLength: GRID_SIZE * 8,
    spawnOnTargetDeathConfig: { 
      count: 1, 
      bulletTypeKey: 'b_healing_pulse_dense', 
      pattern: 'single', 
      spawnAt: 'turret', 
      triggerOnMine: true 
    }
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' }
};

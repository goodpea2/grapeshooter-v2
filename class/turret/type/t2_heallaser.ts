import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_laser } from './t_laser';

export const t2_heallaser: TurretConfig = { 
  ...t_laser,
  name: 'Healing Laser', 
  costs: { sun: 25 }, 
  costAlmanac: { shard: 3, ice: 5 }, 
  drops: { shard: 1, ice: 1 }, 
  health: 100, 
  tier: 2, 
  tooltip: "Heals nearby plants everytime a block is mined", 
  actionType: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfig: { 
    ...t_laser.actionConfig,
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

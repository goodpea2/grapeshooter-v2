import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_heallaser } from './t2_heallaser';

export const t3_heallaser2: TurretConfig = { 
  ...t2_heallaser,
  name: 'Big Healing Laser', 
  costs: { sun: 65 }, 
  costAlmanac: { shard: 10, ice: 12 }, 
  drops: { shard: 1, ice: 2 }, 
  tier: 3, 
  assetImg: 't_heallaserbig',
  tooltip: "Heals nearby plants in a larger radius everytime a block is mined", 
  actionType: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfig: { 
    ...t2_heallaser.actionConfig,
    spawnOnTargetDeathConfig: { 
      count: 1, 
      bulletTypeKey: 'b_healing_pulse_dense_big', 
      pattern: 'single', 
      spawnAt: 'turret', 
      triggerOnMine: true 
    }
  },
  actionTypeWhileCharged: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfigWhileCharged: {
    ...t2_heallaser.actionConfigWhileCharged,
    spawnOnTargetDeathConfig: { 
      count: 1, 
      bulletTypeKey: 'b_healing_pulse_dense_big', 
      pattern: 'single', 
      spawnAt: 'turret', 
      triggerOnMine: true 
    }
  }
};

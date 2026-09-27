import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_bowling: TurretConfig = { 
  name: 'Bowling Bulb', costs: { sun: 60 }, costAlmanac: { leaf: 10, shard: 4, ice: 6 }, drops: { leaf: 1, shard: 1, ice: 1 }, health: 600, color: [180, 255, 50], size: 24, tier: 3,
  tooltip: "Shoots heavy rolling projectiles that pushes enemies out of the way", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { 
    bulletTypeKey: 'b_bowling_bulb', 
    shootRange: GRID_SIZE * 4, 
    shootFireRate: 90 
  },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    bulletTypeKey: 'b_bowling_bulb', 
    shootFireRate: 90,
    shootRange: GRID_SIZE * 6, 
    staminaCostPerBulletSpawned: 2
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    {
      id: 'u_t3_bowling_1',
      description: "Player's attack fire rate +35%, for each Bowling Bulb attached",
      modifiers: { playerFirerateAdd: 0.35 }
    },
    {
      id: 'u_t3_bowling_2',
      stackable: false,
      description: "Fire rate -50%, damage +100%",
      modifiers: { firerateMult: -0.5, damageMult: 1.0 }
    },
    {
      id: 'u_t3_bowling_3',
      description: "Damage +15% for every neighboring [c_shard]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_shard', bonus: { damageMult: 0.15 } }
      ]
    },
    {
      id: 'u_t3_bowling_4',
      description: "Range +15% for every neighboring [c_fuel]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_fuel', bonus: { rangeMult: 0.15 } }
      ]
    },
    {
      id: 'u_t3_bowling_5',
      stackable: false,
      description: "Damage +100% and fire rate +50% while Charged, stamina cost +3 per shot",
      conditionals: [
        { type: 'charged', bonus: { damageMult: 1.0, firerateMult: 0.5, staminaCostAdd: 3 } }
      ]
    }
  ]
};

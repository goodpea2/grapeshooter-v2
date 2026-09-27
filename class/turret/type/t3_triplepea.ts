import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_triplepea: TurretConfig = { 
  name: 'Tripeater', costs: { sun: 60 }, costAlmanac: { leaf: 20 }, drops: { leaf: 3 }, health: 200, color: [0, 200, 50], size: 24, tier: 3,
  tooltip: "Shoots at 4 targets at once.", animationBodyType: 'soft',
  actionType: ['shootMultiTarget'],
  actionConfig: {
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 10,
    shootFireRate: [39,6],
    multiTargetMinCount: 4, 
    multiTargetMaxCount: 4,
    multiTargetShootDelay: 4
  },
  actionTypeWhileCharged: ['shootMultiTarget'],
  actionConfigWhileCharged: {
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 10,
    shootFireRate: [26,4],
    multiTargetMinCount: 4, 
    multiTargetMaxCount: 4,
    multiTargetShootDelay: 4,
    staminaCostPerBulletSpawned: 1
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    {
      id: 'u_t3_triplepea_1',
      description: "Player's attack damage +4, for each Tripeater attached",
      modifiers: { playerAttackAdd: 4 }
    },
    {
      id: 'u_t3_triplepea_2',
      stackable: false,
      description: "Fire rate -60%, damage +150%",
      modifiers: { firerateMult: -0.6, damageMult: 1.5 }
    },
    {
      id: 'u_t3_triplepea_3',
      description: "Damage +100% for every 3 neighboring [c_leaf]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_leaf', step: 3, bonus: { damageMult: 1.0 } }
      ]
    },
    {
      id: 'u_t3_triplepea_4',
      description: "Range +15% for every 2 neighboring [c_shell]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_shell', step: 2, bonus: { rangeMult: 0.15 } }
      ]
    },
    {
      id: 'u_t3_triplepea_5',
      description: "Fire rate +30%, but neighboring [c_shell]'s max health -20%",
      modifiers: { firerateMult: 0.3 }
    }
  ]
};

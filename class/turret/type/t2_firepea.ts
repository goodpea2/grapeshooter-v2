import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';

export const t2_firepea: TurretConfig = {
  ...t_pea,
  name: 'Firepea', costs: { sun: 30 }, costAlmanac: { leaf: 4, shard: 6 }, drops: { leaf: 1, shard: 1 }, health: 100, color: [255, 60, 40], size: 22, tier: 2,
  tooltip: "Shoots at both enemy and obstacles, leaves a flaming puddle", animationBodyType: 'soft',
  actionConfig: { 
    ...t_pea.actionConfig,
    bulletTypeKey: 'b_firepea' 
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { 
    ...t_pea.targetConfig,
    obstaclePriority: 'valuable' 
  },
  upgrades: [
    { id: 'u_t2_firepea_1', description: "Player's range +10% for each Firepea attached", modifiers: { playerRangeAdd: 0.1 } },
    { id: 'u_t2_firepea_2', stackable: false, description: "Fire rate +50%, but attacks with slight inaccuracy", modifiers: { firerateMult: 0.5, inaccuracyAdd: 10 } },
    { id: 'u_t2_firepea_3', description: "Flame puddle radius +35%", modifiers: { puddleRadiusMult: 0.35 } },
    { id: 'u_t2_firepea_4', description: "Range +10% for every neighboring [c_shard]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shard', bonus: { rangeMult: 0.1 } }] },
    { id: 'u_t2_firepea_5', description: "Direct damage +200% while charged", conditionals: [{ type: 'charged', bonus: { damageMult: 2.0 } }] }
  ]
};

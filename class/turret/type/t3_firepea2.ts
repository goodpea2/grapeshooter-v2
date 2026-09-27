import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_firepea } from './t2_firepea';

export const t3_firepea2: TurretConfig = { 
  ...t2_firepea,
  name: 'Firepea MK2', costs: { sun: 75 }, costAlmanac: { leaf: 8, shard: 12 }, drops: { leaf: 2, shard: 1 }, health: 100, color: [255, 100, 0], size: 22, tier: 3,
  tooltip: "Shoots and leaves a bigger-longer lasting flame puddle", animationBodyType: 'soft',
  actionConfig: { 
    ...t2_firepea.actionConfig,
    bulletTypeKey: 'b_firepea_t3' 
  },
  upgrades: [
    {
      id: 'u_t3_firepea2_1',
      description: "Player's range +15%, for each Firepea MK2 attached",
      modifiers: { playerRangeAdd: 0.15 }
    },
    {
      id: 'u_t3_firepea2_2',
      stackable: false,
      description: "Fire rate +150%, but deactivates neighboring [c_ice]",
      modifiers: { firerateMult: 1.5 }
    },
    {
      id: 'u_t3_firepea2_3',
      description: "Flame puddle radius +100% for every 2 neighboring [c_shard]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_shard', step: 2, bonus: { puddleRadiusMult: 1.0 } }
      ]
    },
    {
      id: 'u_t3_firepea2_4',
      description: "Flame puddle damage +100% for every 2 neighboring [c_fuel]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_fuel', step: 2, bonus: { puddleDamageMult: 1.0 } }
      ]
    },
    {
      id: 'u_t3_firepea2_5',
      description: "Range +10% for every neighboring [c_ice]",
      conditionals: [
        { type: 'neighbor_count', targetClass: 'c_ice', bonus: { rangeMult: 0.1 } }
      ]
    }
  ]
};

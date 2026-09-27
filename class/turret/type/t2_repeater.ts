import { TurretConfig } from '../turretConfig';
import { t_pea } from './t_pea';

export const t2_repeater: TurretConfig = {
  ...t_pea,
  name: 'Repeater', costs: { sun: 25 }, costAlmanac: { leaf: 8 }, drops: { leaf: 2 }, color: [0, 180, 80], size: 22, tier: 2,
  tooltip: "Shoots 2 bullets at once", animationBodyType: 'soft',
  actionConfig: { 
    ...t_pea.actionConfig,
    shootFireRate: [33,6,6] },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    ...t_pea.actionConfig,
    shootFireRate: [22,4,4]
  },
  upgrades: [
    { id: 'u_t2_repeater_1', description: "Player's attack damage +2 for each Repeater attached", modifiers: { playerAttackAdd: 2 } },
    { id: 'u_t2_repeater_2', stackable: false, description: "Fire rate -40%, Damage +100%", modifiers: { firerateMult: -0.4, damageMult: 1.0 } },
    { id: 'u_t2_repeater_3', description: "Damage +20% for every neighboring [c_shell]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shell', bonus: { damageMult: 0.2 } }] },
    { id: 'u_t2_repeater_4', description: "Range +10% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { rangeMult: 0.1 } }] },
    { id: 'u_t2_repeater_5', description: "Fire rate +20% for every neighboring [Repeater]", conditionals: [{ type: 'neighbor_type', targetType: 't2_repeater', bonus: { firerateMult: 0.2 } }] }
  ]
};

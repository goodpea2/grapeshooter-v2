import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_torchwood: TurretConfig = { 
  name: 'Torchwood', 
  costs: { sun: 30 }, 
  costAlmanac: { fuel: 5, ice: 5 }, 
  drops: { fuel: 1, ice: 1 }, 
  health: 400, 
  color: [255, 140, 50], 
  size: 22, 
  tier: 2, 
  cooldownHours: 2,
  tooltip: "Boosts crossing bullets' damage", 
  animationBodyType: 'tough',
  actionType: ['aura'],
  actionConfig: { 
    auraConfig: { 
      radius: GRID_SIZE * 1.5, 
      auraVfx: 'aura_torchwood',
      boostsBulletConfig: {
        damageAdd: 3,
        boostsBulletFromEmitter: ['turret', 'player'],
        flameVisual: true
      }
    } 
  },
  targetType: [], 
  targetConfig: {},
  upgrades: [
    { id: 'u_t2_torchwood_1', description: "Player's attack damage -2, fire rate +35% for each Torchwood attached", modifiers: { playerAttackAdd: -2, playerFirerateAdd: 0.35 } },
    { id: 'u_t2_torchwood_2', description: "Player's max stamina -20, aura buffs crossing bullets' damage by +2", modifiers: { playerStaminaAdd: -20, playerMaxStaminaAdd: -20 } },
    { id: 'u_t2_torchwood_3', stackable: false, description: "Aura radius -50%, aura buffs crossing bullet's damage by +7", modifiers: { rangeMult: -0.5 } },
    { id: 'u_t2_torchwood_4', stackable: false, description: "Aura now deals damage to enemies, +5 damage per 0.5s" },
    { id: 'u_t2_torchwood_5', description: "Neighboring [c_leaf]'s range +10%" }
  ]
};

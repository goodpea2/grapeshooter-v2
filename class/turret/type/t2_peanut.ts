import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';

export const t2_peanut: TurretConfig = {
  name: 'Peanut', costs: { sun: 25 }, costAlmanac: { leaf: 3, shell: 5 }, drops: { leaf: 1, shell: 1 }, health: 600, color: [220, 200, 150], size: 22, tier: 2,
  tooltip: "Wall that shoots with high inaccuracy", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 10, shootFireRate: 12, inaccuracy: 45 },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    bulletTypeKey: 'b_pea',
    shootRange: GRID_SIZE * 10,
    shootFireRate: 9,
    inaccuracy: 45,
    staminaCostPerBulletSpawned: 0.8,
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    { id: 'u_t2_peanut_1', description: "Player's fire rate +10% for each Peanut attached", modifiers: { playerFirerateAdd: 0.1 } },
    { id: 'u_t2_peanut_2', stackable: false, description: "Range -30%, fire rate +50%", modifiers: { rangeMult: -0.3, firerateMult: 0.5 } },
    { id: 'u_t2_peanut_3', description: "Projectile knockback strength +100%", modifiers: { knockbackMult: 1.0 } },
    { id: 'u_t2_peanut_4', description: "Damage +30% for every neighboring [c_fuel]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_fuel', bonus: { damageMult: 0.3 } }] },
    { id: 'u_t2_peanut_5', description: "Heal +50 HP every time a new plant is placed", hooks: { onPlant: (ctx: any) => { 
        if (state.player) {
          for (const a of state.player.attachments) {
            if (a && a.type === 't2_peanut' && a.health > 0) {
              a.takeDamage(-50);
            }
          }
        }
        if (state.world) {
          for (const wt of state.world.getAllTurrets()) {
            if (wt && wt.type === 't2_peanut' && wt.health > 0) {
              wt.takeDamage(-50);
            }
          }
        }
    } } }
  ]
};

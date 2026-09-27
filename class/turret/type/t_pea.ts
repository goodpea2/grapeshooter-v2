import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { ActionShoot } from '../action/action_shoot';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { spawnLootAt } from '../../../economy';
import { state } from '../../../state';

export class PeaAttachedTurret extends AttachedTurret {}
export class PeaWorldTurret extends WorldTurret {}

export const t_pea: TurretConfig = { 
  name: 'Peashooter', costs: { sun: 10 }, costAlmanac: { leaf: 3 }, drops: { leaf: 1 }, health: 100, color: [100, 255, 100], size: 22, tier: 1, cooldownHours: 1,
  tooltip: "Shoots bullets at enemies", animationBodyType: 'soft',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 45 },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    shootFireRate: 30,
    staminaCostPerBulletSpawned: 1,
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  getActions: (turret) => [new ActionShoot({ turret })],
  upgrades: [
    { id: 'u_t_pea_1', description: "Player's attack damage +2 for each Peashooter attached", modifiers: { playerAttackAdd: 2 } },
    { id: 'u_t_pea_2', description: "When merged, spawns +1 sun", hooks: { onMerge: (ctx: any) => { 
        const ingredientTypes = ctx.ingredientTypes || (ctx.target?.type ? [ctx.target.type, ctx.incomingType] : (ctx.source?.type ? [ctx.source.type] : ['t_pea']));
        const peaCount = ingredientTypes.filter((t: string) => t === 't_pea').length;
        const p = ctx.pos || ctx.target?.getWorldPos?.() || ctx.source?.getWorldPos?.() || state.player?.pos;
        if (p) {
          const spawnCount = Math.max(1, peaCount);
          for (let i = 0; i < spawnCount; i++) {
            const ox = (i - (spawnCount - 1) / 2) * 12;
            spawnLootAt(p.x + ox, p.y, 'sun');
          }
        }
      } } },
    { id: 'u_t_pea_3', description: "Damage +20% for every neighboring [c_shell]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shell', bonus: { damageMult: 0.2 } }] },
    { id: 'u_t_pea_4', description: "Range +10% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { rangeMult: 0.1 } }] }
  ]
};

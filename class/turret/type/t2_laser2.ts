import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { spawnLootAt } from '../../../economy';
import { t_laser } from './t_laser';

export const t2_laser2: TurretConfig = {
  ...t_laser,
  name: 'Laser MK2', costs: { sun: 25 }, costAlmanac: { shard: 8 }, drops: { shard: 2 }, health: 100, color: [100, 100, 255], size: 22, tier: 2,
  tooltip: "Laser breaks obstacles faster", animationBodyType: 'tough',
  actionConfig: { 
    ...t_laser.actionConfig,
    beamDamage: 15, beamWidth: 6, beamMaxLength: GRID_SIZE * 4 
  },
  upgrades: [
    { id: 'u_t2_laser2_1', description: "Player's mining damage +3 for each Laser MK2 attached", modifiers: { playerMiningDamageAdd: 3 } },
    { 
      id: 'u_t2_laser2_2', 
      description: "Spawns +1 sun for every 10 blocks mined", 
      hooks: { 
        onMine: (ctx: any) => { 
          if (ctx.source?.type === 't2_laser2' && ctx.blockKilled) { 
            ctx.source.minedCount = (ctx.source.minedCount || 0) + 1; 
            if (ctx.source.minedCount % 10 === 0) { 
              const p = ctx.pos || (ctx.target?.pos ? { x: ctx.target.pos.x + GRID_SIZE/2, y: ctx.target.pos.y + GRID_SIZE/2 } : ctx.source.getWorldPos()); 
              spawnLootAt(p.x, p.y, 'sun'); 
            } 
          } 
        } 
      } 
    },
    { id: 'u_t2_laser2_3', stackable: false, description: "Damage +50% while alone", conditionals: [{ type: 'alone', bonus: { damageMult: 0.5 } }] },
    { id: 'u_t2_laser2_4', description: "Range +20% for every neighboring [c_shard]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shard', bonus: { rangeMult: 0.2 } }] },
    { id: 'u_t2_laser2_5', description: "Damage +20% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { damageMult: 0.2 } }] }
  ]
};


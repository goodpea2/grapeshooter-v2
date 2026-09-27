import { TurretConfig } from '../turretConfig';
import { Bullet } from '../../bullet';
import { state } from '../../../state';

export const t_wall: TurretConfig = { 
  name: 'Wallnut', costs: { sun: 5 }, costAlmanac: { shell: 2 }, drops: { shell: 1 }, health: 600, color: [200, 200, 220], size: 22, tier: 1, cooldownHours: 2,
  tooltip: "Simple defensive wall", animationBodyType: 'tough',
  actionType: [], actionConfig: {}, targetType: [], targetConfig: {},
  upgrades: [
    { id: 'u_t_wall_1', description: "Player's movement speed +5% for each Wallnut attached", modifiers: { playerSpeedAdd: 0.05 } },
    { id: 'u_t_wall_2', description: "Max health +150", modifiers: { healthAdd: 150 } },
    { id: 'u_t_wall_3', stackable: false, description: "When a neighboring plant gets damaged, this receives the damage instead", modifiers: { absorbNeighborDamage: true } },
    { id: 'u_t_wall_4', description: "Explodes for +100 damage, 2 tile radius", hooks: { onDeath: (ctx: any) => { 
        if (ctx.source?.type === 't_wall') { 
          const count = (state.turretUpgrades['t_wall'] || []).filter((id: string) => id === 'u_t_wall_4').length;
          const p = ctx.source.getWorldPos ? ctx.source.getWorldPos() : ctx.source.pos; 
          for (let i = 0; i < Math.max(1, count); i++) {
            const b = Bullet.create(p.x, p.y, p.x, p.y, 'b_wallnut_explosion', 'none', ctx.source);
            (b as any).life = 0;
            state.bullets.push(b);
          }
        } 
      } } },
    { id: 'u_t_wall_5', description: "Heal +50 HP every time a new plant is placed", hooks: { onPlant: (ctx: any) => { 
        const allTurrets = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets?.() || [])];
        for (const t of allTurrets) {
          if (t && t.type === 't_wall' && t.health > 0) {
            t.heal(50);
          }
        }
      } } }
  ]
};

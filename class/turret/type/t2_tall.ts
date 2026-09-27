import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { spawnExplosion } from '../../../vfx/index';
import { soundEngine } from '../../../src/audio/soundEngine';
import { t_wall } from './t_wall';

declare const dist: any;

export const t2_tall: TurretConfig = {
  ...t_wall,
  name: 'Tallnut', costs: { sun: 15 }, costAlmanac: { shell: 5 }, drops: { shell: 2 }, health: 1800, color: [140, 140, 150], size: 26, tier: 2,
  tooltip: "Tough defensive wall", animationBodyType: 'tough',
  upgrades: [
    { id: 'u_t2_tall_1', description: "Player's fire rate +15% for each Tallnut attached", modifiers: { playerFirerateAdd: 0.15 } },
    { id: 'u_t2_tall_2', description: "Max health +300", modifiers: { healthAdd: 300 } },
    { id: 'u_t2_tall_3', stackable: false, description: "When a neighboring plant get damaged, this receives the damage instead", modifiers: { absorbNeighborDamage: true } },
    { 
      id: 'u_t2_tall_4', 
      description: "Explodes for +150 damage upon death, 2 tile radius", 
      hooks: { 
        onDeath: (ctx: any) => { 
          if (ctx.targetType === 'turret' && (ctx.source?.type === 't2_tall' || ctx.target?.type === 't2_tall')) { 
            const target = ctx.target || ctx.source; 
            const pos = target?.getWorldPos ? target.getWorldPos() : (target?.pos || ctx.pos); 
            if (pos) { 
              const radius = GRID_SIZE * 2; 
              state.vfx.push(spawnExplosion(pos.x, pos.y, radius * 2, [180, 150, 100])); 
              soundEngine.playSFX('explosion_small'); 
              if (state.spatialGrid) { 
                state.spatialGrid.queryCircleEnemies(pos.x, pos.y, radius, (e: any) => { 
                  if (e && e.health > 0 && !e.isDying) { 
                    e.takeDamage(150, target); 
                  } 
                }); 
              } else { 
                for (const e of state.enemies) { 
                  if (e && e.health > 0 && !e.isDying && dist(pos.x, pos.y, e.pos.x, e.pos.y) <= radius) { 
                    e.takeDamage(150, target); 
                  } 
                } 
              } 
            } 
          } 
        } 
      } 
    },
    { 
      id: 'u_t2_tall_5', 
      description: "Heal +50 HP every time new plant is placed", 
      hooks: { 
        onPlant: (ctx: any) => { 
          if (state.player) { 
            for (const a of state.player.attachments) { 
              if (a && a.type === 't2_tall' && a.health > 0) { 
                a.takeDamage(-50); 
              } 
            } 
          } 
          if (state.world) { 
            for (const wt of state.world.getAllTurrets()) { 
              if (wt && wt.type === 't2_tall' && wt.health > 0) { 
                wt.takeDamage(-50); 
              } 
            } 
          } 
        } 
      } 
    }
  ]
};


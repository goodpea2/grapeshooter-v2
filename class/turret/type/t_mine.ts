import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { Bullet } from '../../bullet';
import { state } from '../../../state';


export const t_mine: TurretConfig = {
  name: 'Landmine', costs: { sun: 5 }, costAlmanac: { fuel: 2 }, drops: { fuel: 1 }, health: 100, color: [255, 100, 20], size: 22, tier: 1, cooldownHours: 3,
  tooltip: "Mine explodes on contact, armed every 2h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_mine_explosion', 
    pulseTriggerRadius: GRID_SIZE * 3.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 2, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' },
  upgrades: [
    { id: 'u_t_mine_1', description: "Player's max stamina +20 for each Landmine attached", modifiers: { playerStaminaAdd: 20 } },
    { id: 'u_t_mine_2', description: "Arming time -25%, AOE Damage -50%", modifiers: { armingTimeMult: -0.25, aoeDamageMult: -0.5 } },
    { id: 'u_t_mine_3', description: "Launched +1 mine when merged", hooks: { onMerge: (ctx: any) => { 
        const ingredientTypes = ctx.ingredientTypes || (ctx.target?.type ? [ctx.target.type, ctx.incomingType] : (ctx.source?.type ? [ctx.source.type] : ['t_mine']));
        const mineCount = ingredientTypes.filter((t: string) => t === 't_mine').length;
        const stackCount = (state.turretUpgrades['t_mine'] || []).filter((id: string) => id === 'u_t_mine_3').length;
        const totalLaunches = Math.max(1, mineCount) * Math.max(1, stackCount);
        const p = ctx.pos || ctx.target?.getWorldPos?.() || ctx.source?.getWorldPos?.() || state.player?.pos;
        if (p) {
          for (let i = 0; i < totalLaunches; i++) {
            const ang = Math.random() * Math.PI * 2;
            const r = GRID_SIZE * 3;
            const tx = p.x + Math.cos(ang) * r;
            const ty = p.y + Math.sin(ang) * r;
            const b = Bullet.create(p.x, p.y, tx, ty, 'b_floating_mine', 'none', ctx.source);
            (b as any).targetPos = createVector(tx, ty);
            state.bullets.push(b);
          }
        }
      } } },
    { id: 'u_t_mine_4', description: "Explosion radius +20% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { aoeRadiusMult: 0.2 } }] }
  ]
};

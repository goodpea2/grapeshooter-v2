import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { Bullet } from '../../bullet';
import { spawnGreenEssenceVFX, FlungSpawnPodVFX } from '../../../vfx/index';
import { t_laser } from './t_laser';

export const t2_heallaser: TurretConfig = { 
  ...t_laser,
  name: 'Healing Laser', 
  costs: { sun: 25 }, 
  costAlmanac: { shard: 3, ice: 5 }, 
  drops: { shard: 1, ice: 1 }, 
  health: 100, 
  tier: 2, 
  tooltip: "Heals nearby plants everytime a block is mined", 
  actionType: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfig: { 
    ...t_laser.actionConfig,
    spawnOnTargetDeathConfig: { 
      count: 1, 
      bulletTypeKey: 'b_healing_pulse_dense', 
      pattern: 'single', 
      spawnAt: 'turret', 
      triggerOnMine: true 
    }
  },
  actionTypeWhileCharged: ['laserBeam', 'spawnOnTargetDeath'],
  actionConfigWhileCharged: {
    ...t_laser.actionConfigWhileCharged,
    spawnOnTargetDeathConfig: { 
      count: 1, 
      bulletTypeKey: 'b_healing_pulse_dense', 
      pattern: 'single', 
      spawnAt: 'turret', 
      triggerOnMine: true 
    }
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' },
  upgrades: [
    { id: 'u_t2_heallaser_1', description: "Player's stamina recharge speed +25% for each Healing Laser attached", modifiers: { staminaRechargeMult: 0.25 } },
    { 
      id: 'u_t2_heallaser_2', 
      stackable: false, 
      description: "Healing +50%, but has a chance to spawn an enemy from mined blocks", 
      modifiers: { aoeDamageMult: 0.5 },
      hooks: { 
        onMine: (ctx: any) => { 
          if (ctx.blockKilled && Math.random() < 0.10) { 
            const p = ctx.pos || (ctx.target?.pos ? { x: ctx.target.pos.x + GRID_SIZE/2, y: ctx.target.pos.y + GRID_SIZE/2 } : null); 
            if (p) { 
              const spawnPod = new FlungSpawnPodVFX(p.x, p.y, p.x, p.y, 'e_armor2', 20); 
              state.vfx.push(spawnPod); 
            } 
          } 
        } 
      } 
    },
    { 
      id: 'u_t2_heallaser_3', 
      description: "When a plant dies, trigger the healing pulse +2 times", 
      hooks: { 
        onDeath: (ctx: any) => { 
          if (ctx.targetType === 'turret') { 
            const target = ctx.target || ctx.source; 
            const deathPos = target?.getWorldPos ? target.getWorldPos() : (target?.pos || ctx.pos); 
            const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()]; 
            for (const t of allTurrets) { 
              if (t && t.type === 't2_heallaser' && t.health > 0) { 
                const myPos = t.getWorldPos(); 
                if (deathPos) { 
                  spawnGreenEssenceVFX(deathPos.x, deathPos.y, myPos.x, myPos.y, () => { 
                    if (t.health <= 0 || t.isDying) return; 
                    const curPos = t.getWorldPos(); 
                    for (let i = 0; i < 2; i++) { 
                      state.bullets.push(Bullet.create(curPos.x, curPos.y, curPos.x, curPos.y, 'b_healing_pulse_dense', 'none', t)); 
                    } 
                  }, t); 
                } else { 
                  for (let i = 0; i < 2; i++) { 
                    state.bullets.push(Bullet.create(myPos.x, myPos.y, myPos.x, myPos.y, 'b_healing_pulse_dense', 'none', t)); 
                  } 
                } 
              } 
            } 
          } 
        } 
      } 
    },
    { id: 'u_t2_heallaser_4', description: "Range +20% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { rangeMult: 0.2 } }] },
    { id: 'u_t2_heallaser_5', description: "Damage +25% while charged", conditionals: [{ type: 'charged', bonus: { damageMult: 0.25 } }] }
  ]
};


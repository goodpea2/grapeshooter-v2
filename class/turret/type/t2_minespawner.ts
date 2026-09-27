import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { state } from '../../../state';
import { getNeighbors } from '../../../src/upgrades';
import { Bullet } from '../../bullet';
import { spawnGreenEssenseVfx } from '../../../vfx/GreenEssenceVFX';
import { spawnLootAt } from '../../../economy';

declare const random: any;
declare const createVector: any;

export const t2_minespawner: TurretConfig = {
  name: 'Mine Launcher', costs: { sun: 25 }, costAlmanac: { fuel: 8 }, drops: { fuel: 2 }, health: 100, color: [255, 20, 20], size: 22, tier: 2,
  tooltip: "Launches a mine every 2h to a random direction", animationBodyType: 'soft',
  unarmedAssetApplyToAction: ['pulse'],
  actionType: ['pulse', 'spawnBulletAtRandom'],
  actionConfig: { 
      pulseBulletTypeKey: 'b_mine_explosion',
      pulseTriggerRadius: GRID_SIZE * 3.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: true,
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true,
      spawnBulletAtRandom: { 
          cooldown: HOUR_FRAMES * 2, 
          distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
          bulletKey: 'b_floating_mine',
          enabledWhenActionIsReady: 'pulse'
      }
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    { id: 'u_t2_minespawner_1', description: "Player's attack damage +4, fire rate -15% for each Mine Launcher attached", modifiers: { playerAttackAdd: 4, playerFirerateAdd: -0.15 } },
    { id: 'u_t2_minespawner_2', description: "Spawn +1 sun every time a hovering mine is launched" },
    { id: 'u_t2_minespawner_3', description: "Explosion radius +20% for every neighboring [c_leaf]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_leaf', bonus: { aoeRadiusMult: 0.2 } }] },
    { id: 'u_t2_minespawner_4', stackable: false, description: "Arming time -25%, Explosion Damage -50%", modifiers: { armingTimeMult: -0.25, aoeDamageMult: -0.5 } },
    { id: 'u_t2_minespawner_5', description: "Launched +1 mine every time a neighboring plant dies", hooks: {
      onDeath: (ctx: any) => {
        if (ctx.targetType === 'turret') {
          const deadTurret = ctx.target;
          if (!deadTurret) return;
          const deathPos = deadTurret.getWorldPos ? deadTurret.getWorldPos() : (deadTurret.pos || ctx.pos);
          const allTurrets = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])];
          for (const t of allTurrets) {
            if (t && t.type === 't2_minespawner' && t.health > 0) {
              const neighbors = getNeighbors(t);
              if (neighbors.includes(deadTurret)) {
                if (deathPos) {
                  spawnGreenEssenseVfx(deathPos.x, deathPos.y, t, () => {
                    const wPos = t.getWorldPos ? t.getWorldPos() : t.pos;
                    if (wPos) {
                      const ang = random(Math.PI * 2);
                      const r = GRID_SIZE * 3 * (t.activeStats?.rangeMult || t.stats?.rangeMult || 1);
                      const tx = wPos.x + Math.cos(ang) * r;
                      const ty = wPos.y + Math.sin(ang) * r;
                      const b = Bullet.create(wPos.x, wPos.y, tx, ty, 'b_floating_mine', 'none', t);
                      (b as any).targetPos = createVector(tx, ty);
                      state.bullets.push(b);
                      if ((state.turretUpgrades?.['t2_minespawner'] || []).includes('u_t2_minespawner_2')) {
                        const count = (state.turretUpgrades?.['t2_minespawner'] || []).filter((id: string) => id === 'u_t2_minespawner_2').length;
                        for (let i = 0; i < Math.max(1, count); i++) {
                          spawnLootAt(wPos.x, wPos.y, 'sun');
                        }
                      }
                    }
                  });
                }
              }
            }
          }
        }
      }
    } }
  ]
};

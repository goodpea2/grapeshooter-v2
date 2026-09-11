import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';
import { spawnGreenEssenceVFX, spawnMergeVFX, spawnHitSpark } from '../../../vfx/index';
import { Enemy } from '../../enemy';
import { eventBus } from '../../../src/events/eventBus';

export class WitchAttachedTurret extends AttachedTurret {
  onAllyTurretDestroyed(deathPos: { x: number; y: number }) {
    if (this.health <= 0 || this.isDying) return;
    const myPos = this.getWorldPos();

    spawnGreenEssenceVFX(deathPos.x, deathPos.y, myPos.x, myPos.y, () => {
      // Verify witch is still alive and attached to the player
      if (this.health <= 0 || this.isDying) return;
      if (!state.player?.attachments?.includes(this)) return;

      this.spawnFriendlyEnemy();
    }, this);
  }

  private spawnFriendlyEnemy() {
    const myPos = this.getWorldPos();
    // For attached turret, spawn 1 tile away in the outward direction from player center
    let spawnAngle = Math.random() * Math.PI * 2;
    if (state.player) {
      const pPos = state.player.pos;
      const dx = myPos.x - pPos.x;
      const dy = myPos.y - pPos.y;
      if (dx * dx + dy * dy > 1) {
        spawnAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
      }
    }
    const spawnDist = GRID_SIZE * 1.0;
    let spawnX = myPos.x + Math.cos(spawnAngle) * spawnDist;
    let spawnY = myPos.y + Math.sin(spawnAngle) * spawnDist;

    // Check if spawn position is obstructed by solid wall; if so, try adjacent angles
    if (state.world?.isBlockAt && state.world.isBlockAt(spawnX, spawnY)) {
      for (let step = 1; step < 8; step++) {
        const testAngle = spawnAngle + (step * Math.PI / 4);
        const tx = myPos.x + Math.cos(testAngle) * spawnDist;
        const ty = myPos.y + Math.sin(testAngle) * spawnDist;
        if (!state.world.isBlockAt(tx, ty)) {
          spawnX = tx;
          spawnY = ty;
          break;
        }
      }
    }

    const friendly = new Enemy(spawnX, spawnY, 'e_friendly_armor2');
    state.enemies.push(friendly);

    // Visual feedback
    state.vfx.push(spawnHitSpark(myPos.x, myPos.y, [80, 255, 120]));
    state.vfx.push(spawnMergeVFX(spawnX, spawnY, [80, 255, 120]));
  }
}

export class WitchWorldTurret extends WorldTurret {
  onAllyTurretDestroyed(deathPos: { x: number; y: number }) {
    if (this.health <= 0 || this.isDying) return;
    const myPos = this.getWorldPos();

    spawnGreenEssenceVFX(deathPos.x, deathPos.y, myPos.x, myPos.y, () => {
      // Verify witch is still alive and placed in the world
      if (this.health <= 0 || this.isDying) return;
      if (!state.world?.getAllTurrets()?.some((t: any) => t === this)) return;

      this.spawnFriendlyEnemy();
    }, this);
  }

  private spawnFriendlyEnemy() {
    const myPos = this.getWorldPos();
    let spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = GRID_SIZE * 1.0;
    let spawnX = myPos.x + Math.cos(spawnAngle) * spawnDist;
    let spawnY = myPos.y + Math.sin(spawnAngle) * spawnDist;

    // Check if spawn position is obstructed by solid wall; if so, try adjacent angles
    if (state.world?.isBlockAt && state.world.isBlockAt(spawnX, spawnY)) {
      for (let step = 1; step < 8; step++) {
        const testAngle = spawnAngle + (step * Math.PI / 4);
        const tx = myPos.x + Math.cos(testAngle) * spawnDist;
        const ty = myPos.y + Math.sin(testAngle) * spawnDist;
        if (!state.world.isBlockAt(tx, ty)) {
          spawnX = tx;
          spawnY = ty;
          break;
        }
      }
    }

    const friendly = new Enemy(spawnX, spawnY, 'e_friendly_armor2');
    state.enemies.push(friendly);

    // Visual feedback
    state.vfx.push(spawnHitSpark(myPos.x, myPos.y, [80, 255, 120]));
    state.vfx.push(spawnMergeVFX(spawnX, spawnY, [80, 255, 120]));
  }
}

let isWitchListenerInitialized = false;

export function initWitchTurretListener() {
  if (isWitchListenerInitialized) return;
  isWitchListenerInitialized = true;

  eventBus.on('TURRET_DESTROYED', (payload) => {
    const dyingTurret = payload?.turret;
    const deathPos = payload?.pos
      ? { x: payload.pos.x, y: payload.pos.y }
      : (dyingTurret?.getWorldPos ? dyingTurret.getWorldPos() : dyingTurret?.pos);

    if (!deathPos) return;

    // 1. Attached turrets on player
    if (state.player?.attachments) {
      for (const att of state.player.attachments) {
        if (att && att.type === 't3_witch' && att.health > 0 && !att.isDying && att !== dyingTurret) {
          if (typeof (att as any).onAllyTurretDestroyed === 'function') {
            (att as any).onAllyTurretDestroyed(deathPos);
          }
        }
      }
    }

    // 2. World turrets in the world
    if (state.world?.getAllTurrets) {
      const worldTurrets = state.world.getAllTurrets();
      for (const wt of worldTurrets) {
        if (wt && wt.type === 't3_witch' && wt.health > 0 && !wt.isDying && wt !== dyingTurret) {
          if (typeof (wt as any).onAllyTurretDestroyed === 'function') {
            (wt as any).onAllyTurretDestroyed(deathPos);
          }
        }
      }
    }
  });
}

// Auto-initialize listener
initWitchTurretListener();

export const t3_witch: TurretConfig = {
  name: 'Witch Hazel',
  costs: { sun: 70 },
  costAlmanac: { leaf: 8, shard: 8, shell: 7 },
  drops: { leaf: 1, shard: 1, shell: 1 },
  health: 100,
  color: [180, 80, 220],
  size: 22,
  tier: 3,
  tooltip: "Spawns a hypmotized grape when a plant dies. Shoot fire at lower rate",
  animationBodyType: 'soft',
  assetImg: 't_witch',
  actionType: ['shoot'],
  actionConfig: {
    bulletTypeKey: 'b_firepea',
    shootRange: GRID_SIZE * 5,
    shootFireRate: 90
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: {
    enemyPriority: 'closest',
    obstaclePriority: 'valuable'
  }
};

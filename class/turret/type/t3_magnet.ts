import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, CHUNK_SIZE } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';
import { spawnLootInFlightVFX } from '../../../vfx/index';
import { releaseLoot } from '../../loot';

declare const width: any;
declare const height: any;
declare const p5: any;

export class MagnetAttachedTurret extends AttachedTurret {
  collectedLootCount: number = 0;

  customUpdate() {
    this.updateMagnetLootCollection();
  }

  private updateMagnetLootCollection() {
    if (this.health <= 0) return;
    const myPos = this.getWorldPos();
    const attractRadius = GRID_SIZE * 4.0;
    const attractRadiusSq = attractRadius * attractRadius;
    const collectRadius = GRID_SIZE * 0.8;
    const collectRadiusSq = collectRadius * collectRadius;

    // Check surrounding chunks
    const minCx = Math.floor((myPos.x - attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const maxCx = Math.floor((myPos.x + attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const minCy = Math.floor((myPos.y - attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const maxCy = Math.floor((myPos.y + attractRadius) / (GRID_SIZE * CHUNK_SIZE));

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = state.world.getChunk(cx, cy);
        if (!chunk || !chunk.loot) continue;

        const lootArr = chunk.loot;
        for (let i = lootArr.length - 1; i >= 0; i--) {
          const l = lootArr[i];
          const dx = l.pos.x - myPos.x;
          const dy = l.pos.y - myPos.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < attractRadiusSq) {
            // Pull loot towards magnet
            if (l.vel) {
              const pullVec = p5.Vector.sub(myPos, l.pos).normalize().mult(1.2);
              l.vel.add(pullVec);
              l.vel.limit(8);
            }

            if (dSq < collectRadiusSq) {
              // Collect loot into player inventory / economy
              const last = lootArr.pop()!;
              if (i < lootArr.length) {
                lootArr[i] = last;
              }

              const screenPos = {
                x: l.pos.x - (state.cameraPos.x - width / 2),
                y: l.pos.y - (state.cameraPos.y - height / 2)
              };

              let tx = 50, ty = 50;
              if (l.config.item === 'sun') { tx = 40; ty = 40; }
              else if (l.config.item === 'elixir') { tx = 40; ty = 80; }
              else if (l.config.item === 'soil') { tx = 40; ty = 120; }
              else if (l.config.item === 'raisin') {
                tx = width - 50; ty = height - 50;
              } else if (l.config.type === 'turret' || l.config.type === 'item' || l.config.type === 'turretAsItem') {
                tx = width - 50; ty = height - 50;
              }

              state.uiVfx.push(spawnLootInFlightVFX(
                screenPos.x, screenPos.y,
                tx, ty,
                l.config.idleAssetImg,
                l.renderSize,
                l.config.itemValue || 1,
                l.config.item,
                l.config.type,
                (l as any).turretHP,
                (l as any).turretData
              ));

              releaseLoot(l);

              this.collectedLootCount++;
              if (this.collectedLootCount >= 15) {
                this.collectedLootCount = 0;
                this.heal(50, true); // Bypasses max HP
              }
            }
          }
        }
      }
    }
  }
}

export class MagnetWorldTurret extends WorldTurret {
  collectedLootCount: number = 0;

  customUpdate() {
    this.updateMagnetLootCollection();
  }

  private updateMagnetLootCollection() {
    if (this.health <= 0) return;
    const myPos = this.getWorldPos();
    const attractRadius = GRID_SIZE * 4.0;
    const attractRadiusSq = attractRadius * attractRadius;
    const collectRadius = GRID_SIZE * 0.8;
    const collectRadiusSq = collectRadius * collectRadius;

    const minCx = Math.floor((myPos.x - attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const maxCx = Math.floor((myPos.x + attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const minCy = Math.floor((myPos.y - attractRadius) / (GRID_SIZE * CHUNK_SIZE));
    const maxCy = Math.floor((myPos.y + attractRadius) / (GRID_SIZE * CHUNK_SIZE));

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = state.world.getChunk(cx, cy);
        if (!chunk || !chunk.loot) continue;

        const lootArr = chunk.loot;
        for (let i = lootArr.length - 1; i >= 0; i--) {
          const l = lootArr[i];
          const dx = l.pos.x - myPos.x;
          const dy = l.pos.y - myPos.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < attractRadiusSq) {
            if (l.vel) {
              const pullVec = p5.Vector.sub(myPos, l.pos).normalize().mult(1.2);
              l.vel.add(pullVec);
              l.vel.limit(8);
            }

            if (dSq < collectRadiusSq) {
              const last = lootArr.pop()!;
              if (i < lootArr.length) {
                lootArr[i] = last;
              }

              const screenPos = {
                x: l.pos.x - (state.cameraPos.x - width / 2),
                y: l.pos.y - (state.cameraPos.y - height / 2)
              };

              let tx = 50, ty = 50;
              if (l.config.item === 'sun') { tx = 40; ty = 40; }
              else if (l.config.item === 'elixir') { tx = 40; ty = 80; }
              else if (l.config.item === 'soil') { tx = 40; ty = 120; }
              else if (l.config.item === 'raisin') {
                tx = width - 50; ty = height - 50;
              } else if (l.config.type === 'turret' || l.config.type === 'item' || l.config.type === 'turretAsItem') {
                tx = width - 50; ty = height - 50;
              }

              state.uiVfx.push(spawnLootInFlightVFX(
                screenPos.x, screenPos.y,
                tx, ty,
                l.config.idleAssetImg,
                l.renderSize,
                l.config.itemValue || 1,
                l.config.item,
                l.config.type,
                (l as any).turretHP,
                (l as any).turretData
              ));

              releaseLoot(l);

              this.collectedLootCount++;
              if (this.collectedLootCount >= 15) {
                this.collectedLootCount = 0;
                this.heal(50, true); // Bypasses max HP
              }
            }
          }
        }
      }
    }
  }
}

export const t3_magnet: TurretConfig = {
  name: 'Magnet Sprout',
  costs: { sun: 60 },
  costAlmanac: { shard: 5, shell: 5, ice: 10 },
  drops: { shard: 1, shell: 1, ice: 1 },
  health: 100,
  color: [180, 180, 220],
  size: 22,
  tier: 3,
  tooltip: "Collects loot in 4 tiles radius. Increases health for every 15 loot collected",
  animationBodyType: 'tough',
  assetImg: 't_magnet',
  actionType: [],
  actionConfig: {},
  targetType: [],
  targetConfig: {}
};

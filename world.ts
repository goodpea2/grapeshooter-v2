
import { state } from './state';
import { 
  GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, LEVEL_THRESHOLDS, LEVEL_BUDGET, WORLD_GEN_STATS, CHUNK_GEN_RADIUS
} from './constants';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from './balanceObstacles';
import { bulletTypes } from './balanceBullets';
import { liquidTypes, LIQUID_WEIGHTS, LIQUID_KEYS } from './balanceLiquids';
import { MuzzleFlash, BlockDebris, BlockHitVFX, LootInFlightVFX } from './vfx/index';
import { Enemy, Bullet, NPCEntity } from './entities';
import { spawnLootAt, ECONOMY_CONFIG } from './economy';
import { triggerUpgradeHook } from './src/upgrades';
import { worldGenConfig, requestSpawn, spawnFromBudget } from './lvDemo';
import { drawOverlay } from './visualObstacles';
import { enemyTypes } from './balanceEnemies';
import { drawDecoration } from './visualDecoration';
// Added RoomPrefab interface to imports
import { ROOM_PREFABS, RoomPrefab } from './dictionaryRoomPrefab';
import { generateRoomDirectorData } from './debug/roomDirectorGenerator';
import { drawAutotile } from './visualAutotiling';
import { flowField } from './pathfinding';

declare const createVector: any;
declare const dist: any;
declare const floor: any;
// Added missing abs declaration
declare const abs: any;
declare const lerp: any;
declare const color: any;
declare const noise: any;
declare const random: any;
declare const constrain: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const rect: any;
declare const noStroke: any;
declare const ellipse: any;
declare const map: any;
declare const sin: any;
declare const cos: any;
declare const frameCount: any;
declare const line: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const CENTER: any;
declare const LEFT: any;
declare const TOP: any;
declare const text: any;
declare const arc: any;
declare const HALF_PI: any;
declare const PI: any;
declare const TWO_PI: any;
declare const atan2: any;
declare const radians: any;
declare const createGraphics: any;
declare const image: any;
declare const imageMode: any;
declare const scale: any;
declare const tint: any;
declare const noTint: any;
declare const CORNER: any;
declare const width: any;
declare const height: any;

export class Block {
  gx: number; gy: number; pos: any; type: string; config: any; overlay: string | null = null;
  isMined: boolean = false; damageGlow: number = 0; health: number; maxHealth: number;
  biome: number = 0; feature: string | null = null;
  sunBits: { x: number, y: number, s: number }[] = [];
  liquidType: string | null = null;
  lastSniperShot: number = 0;
  lastSpawnTime: number = 0;
  spawnerBudget: number = 0;
  customSpawnerConfig?: any = null;
  turretCooldown: number = 0;
  turretStep: number = 0;
  lockedAngle: number = 0;
  lockedTargetPos: { x: number, y: number } | null = null;
  isBarrelLocked: boolean = false;

  constructor(gx: number, gy: number, typeKey = 'o_dirt', overlay: string | null = null, biome: number = 0, liquidType: string | null = null) {
    this.gx = gx; this.gy = gy;
    this.pos = createVector(gx * GRID_SIZE, gy * GRID_SIZE);
    this.type = typeKey;
    this.config = obstacleTypes[typeKey] || obstacleTypes['o_dirt'];
    this.health = this.config.health;
    this.maxHealth = this.health;
    this.biome = biome;
    this.liquidType = liquidType;

    if (overlay) {
      this.setOverlay(overlay);
    }

    let fn = noise((gx + worldGenConfig.noiseOffsetBlocks) * 0.8, (gy + worldGenConfig.noiseOffsetBlocks) * 0.8, 123);
    if (fn > 0.8) this.feature = 'moss';
    else if (fn > 0.72 && biome < 3) this.feature = 'flower';
    else if (fn > 0.75) this.feature = 'crystal';
    else if (fn > 0.72) this.feature = 'rubble';
  }

  setOverlay(overlayKey: string | null) {
    this.overlay = overlayKey;
    if (this.overlay && overlayTypes[this.overlay]) {
      const oCfg = overlayTypes[this.overlay];
      if (oCfg.minHealth !== undefined && oCfg.minHealth > 0) {
        if (this.health < oCfg.minHealth) {
          this.health = oCfg.minHealth;
          this.maxHealth = Math.max(this.maxHealth, oCfg.minHealth);
        }
      }
      if (oCfg.enemySpawnConfig) {
        this.spawnerBudget = oCfg.enemySpawnConfig.budget;
        this.lastSpawnTime = state.frames + floor(random(oCfg.enemySpawnConfig.spawnInterval));
      }
      if (oCfg.enemyTurretConfig) {
        const eCfg = oCfg.enemyTurretConfig;
        const initialDelay = Array.isArray(eCfg.shootFireRate) ? eCfg.shootFireRate[0] : eCfg.shootFireRate;
        this.turretCooldown = floor(random(10, Math.max(30, initialDelay)));
        this.turretStep = 0;
        this.isBarrelLocked = false;
      }
      if (this.overlay.startsWith('sun')) {
        this.initSunBits(this.overlay);
      }
    }
    if (state.world && state.world.chunks) {
      const cx = floor(this.gx / CHUNK_SIZE);
      const cy = floor(this.gy / CHUNK_SIZE);
      const chunk = state.world.chunks.get(`${cx},${cy}`);
      if (chunk) {
        if (this.overlay) {
          if (!chunk.overlayBlocks.includes(this)) {
            chunk.overlayBlocks.push(this);
          }
        }
        chunk.needsRedraw = true;
      }
    }
  }

  initSunBits(type: string) {
    let count = type === 'sunTiny' ? 1 : (type === 'sunOre' ? 3 : 10);
    let seed = (this.gx * 31 + this.gy * 7) % 1000;
    const center = GRID_SIZE / 2;
    this.sunBits = [];
    for (let i = 0; i < count; i++) {
      let spread = GRID_SIZE * 0.75;
      let xOff = (((seed + i * 13.5) % spread) - (spread / 2)) + center;
      let yOff = (((seed + i * 29.7) % spread) - (spread / 2)) + center;
      this.sunBits.push({ x: xOff, y: yOff, s: 10 + ((seed + i * 17) % 3) });
    }
  }

  update() {
    if (this.isMined || !this.overlay) return;
    const oCfg = overlayTypes[this.overlay];
    if (!oCfg) return;

    if (oCfg.enemySpawnConfig || this.customSpawnerConfig) {
      const sCfg = this.customSpawnerConfig ? { ...oCfg.enemySpawnConfig, ...this.customSpawnerConfig } : oCfg.enemySpawnConfig;
      if (sCfg && sCfg.spawnInterval > 0) {
        const dx = this.pos.x + GRID_SIZE/2 - state.player.pos.x;
        const dy = this.pos.y + GRID_SIZE/2 - state.player.pos.y;
        const dSq = dx*dx + dy*dy;
        const trigRad = sCfg.spawnTriggerRadius > 0 ? sCfg.spawnTriggerRadius : 200;
        if (sCfg.spawnTriggerRadius < 0 || dSq < trigRad * trigRad) {
          if (state.frames - this.lastSpawnTime >= sCfg.spawnInterval) {
            const eTypes = (sCfg.enemyTypeKey && sCfg.enemyTypeKey.length > 0) ? sCfg.enemyTypeKey : ['e_basic'];
            const eKey = eTypes[floor(random(eTypes.length))];
            const eCfg = enemyTypes[eKey];
            if (eCfg && (!sCfg.spawnIntervalConsumeBudget || this.spawnerBudget >= eCfg.cost)) {
              let spawned = false;
              let attempts = 10;
              while (attempts > 0 && !spawned) {
                attempts--;
                const ang = random(TWO_PI);
                const r = random(GRID_SIZE, sCfg.spawnRadius || 120);
                const sx = this.pos.x + GRID_SIZE/2 + cos(ang) * r;
                const sy = this.pos.y + GRID_SIZE/2 + sin(ang) * r;
                
                if (state.world.hasSpawnArea() && !state.world.isSpawnAreaAt(sx, sy)) {
                  continue;
                }
                if (!state.world.checkCollision(sx, sy, eCfg.size/2.2)) {
                  requestSpawn(sx, sy, eKey);
                  if (sCfg.spawnIntervalConsumeBudget) this.spawnerBudget -= eCfg.cost;
                  this.lastSpawnTime = state.frames;
                  spawned = true;
                }
              }
            }
          }
        }
      }
    }

    if (oCfg.enemyTurretConfig) {
      const eCfg = oCfg.enemyTurretConfig;
      const bcx = this.pos.x + GRID_SIZE / 2;
      const bcy = this.pos.y + GRID_SIZE / 2;

      const bulletCfg = bulletTypes[eCfg.bulletTypeKey] || {};
      const isSelfTarget = eCfg.targetMode === 'self' || eCfg.bulletTypeKey === 'b_enemy_healing_pulse' || (bulletCfg.bulletSpeed === 0 && bulletCfg.bulletLifeTime <= 1 && eCfg.shootRange < 200 && !eCfg.drawAimingLine);

      let target: any = null;
      let targetX = state.player ? state.player.pos.x : bcx;
      let targetY = state.player ? state.player.pos.y : bcy;

      if (!isSelfTarget) {
        const candidates: { pos: any, entity: any }[] = [];
        if (eCfg.targetMode === 'enemies') {
          for (const enemy of state.enemies) {
            if (enemy && enemy.health > 0 && !enemy.isDying) {
              candidates.push({ pos: enemy.pos, entity: enemy });
            }
          }
        } else {
          if (state.player && !state.player.isDying) {
            candidates.push({ pos: state.player.pos, entity: state.player });
          }
          if (state.player?.attachments) {
            for (const att of state.player.attachments) {
              candidates.push({ pos: att.getWorldPos(), entity: att });
            }
          }
          if (state.world) {
            const worldTurrets = state.world.getAllTurrets();
            for (const wt of worldTurrets) {
              candidates.push({ pos: wt.getWorldPos(), entity: wt });
            }
          }
        }

        const maxDist = eCfg.shootRange || eCfg.sightRadius || 300;
        let bestDistSq = maxDist * maxDist;

        for (const cand of candidates) {
          const dx = cand.pos.x - bcx;
          const dy = cand.pos.y - bcy;
          const dSq = dx * dx + dy * dy;
          if (dSq <= bestDistSq) {
            const canSee = eCfg.seeThroughObstacles || state.world.checkLOS(bcx, bcy, cand.pos.x, cand.pos.y);
            if (canSee) {
              bestDistSq = dSq;
              target = cand.entity;
              targetX = cand.pos.x;
              targetY = cand.pos.y;
            }
          }
        }
      } else {
        target = this;
        targetX = bcx;
        targetY = bcy;
      }

      if (this.turretCooldown > 0) {
        this.turretCooldown--;
      }

      const lockDuration = eCfg.barrelLockDurationBeforeFiring || 0;
      const isBurstStep = Array.isArray(eCfg.shootFireRate) && this.turretStep > 0;
      const effectiveLockDuration = isBurstStep ? 0 : lockDuration;

      if (target || isSelfTarget) {
        if (this.turretCooldown > effectiveLockDuration || !this.isBarrelLocked) {
          const aimAng = atan2(targetY - bcy, targetX - bcx);
          this.lockedAngle = aimAng;
          this.lockedTargetPos = { x: targetX, y: targetY };
        }

        if (effectiveLockDuration > 0 && this.turretCooldown <= effectiveLockDuration && !this.isBarrelLocked) {
          this.isBarrelLocked = true;
        }

        if (this.turretCooldown <= 0) {
          let fireAngle = this.lockedAngle || 0;
          if (eCfg.inaccuracy) {
            fireAngle += random(-radians(eCfg.inaccuracy), radians(eCfg.inaccuracy));
          }

          let shotTx = targetX;
          let shotTy = targetY;

          if (bulletCfg.highArcConfig) {
            shotTx = this.lockedTargetPos ? this.lockedTargetPos.x : bcx + cos(fireAngle) * eCfg.shootRange;
            shotTy = this.lockedTargetPos ? this.lockedTargetPos.y : bcy + sin(fireAngle) * eCfg.shootRange;
          } else if (isSelfTarget) {
            shotTx = bcx;
            shotTy = bcy;
          } else {
            shotTx = bcx + cos(fireAngle) * (eCfg.shootRange || 500);
            shotTy = bcy + sin(fireAngle) * (eCfg.shootRange || 500);
          }

          const spawnOffset = isSelfTarget ? 0 : Math.min(GRID_SIZE * 0.5, 14);
          const sx = bcx + cos(fireAngle) * spawnOffset;
          const sy = bcy + sin(fireAngle) * spawnOffset;

          const bullet = new Bullet(sx, sy, shotTx, shotTy, eCfg.bulletTypeKey, 'core', this);
          state.enemyBullets.push(bullet);

          let flashCol = color(255, 50, 50);
          if (eCfg.muzzleFlashColor) {
            flashCol = color(...eCfg.muzzleFlashColor);
          } else if (bulletCfg.bulletColor) {
            flashCol = color(...bulletCfg.bulletColor);
          }
          state.vfx.push(new MuzzleFlash(bcx, bcy, isSelfTarget ? 0 : fireAngle, 30, 8, flashCol));

          if (Array.isArray(eCfg.shootFireRate)) {
            this.turretStep = (this.turretStep + 1) % eCfg.shootFireRate.length;
            this.turretCooldown = eCfg.shootFireRate[this.turretStep];
          } else {
            this.turretCooldown = eCfg.shootFireRate;
          }

          this.isBarrelLocked = false;
        }
      } else {
        if (this.turretCooldown <= effectiveLockDuration) {
          this.turretCooldown = effectiveLockDuration + 1;
        }
        this.isBarrelLocked = false;
      }
    }
  }

  /**
   * Phase 1 of Layered Rendering: Static geometry, liquids, decorations.
   */
  renderBase(opacity: number) {
    if (opacity <= 0) return;

    push(); translate(this.pos.x, this.pos.y);

    if (this.liquidType) {
      const lCfg = liquidTypes[this.liquidType];
      if (lCfg) {
        const pulse = 0.5 + 0.5 * sin(state.frames * lCfg.pulseSpeed + (this.gx + this.gy) * 0.5);
        const ln = state.world.getLiquidAt(this.gx, this.gy - 1);
        const ls = state.world.getLiquidAt(this.gx, this.gy + 1);
        const lw = state.world.getLiquidAt(this.gx - 1, this.gy);
        const le = state.world.getLiquidAt(this.gx + 1, this.gy);
        const isLiquidExposed = !ln || !ls || !lw || !le;
        const rad = 8;
        noStroke();
        fill(lCfg.color[0], lCfg.color[1], lCfg.color[2], opacity * (lCfg.color[3] / 255));
        const tl = (ln || lw) ? 0 : rad;
        const tr = (ln || le) ? 0 : rad;
        const br = (ls || le) ? 0 : rad;
        const bl = (ls || lw) ? 0 : rad;
        rect(0, 0, GRID_SIZE, GRID_SIZE, tl, tr, br, bl);
        fill(lCfg.glowColor[0], lCfg.glowColor[1], lCfg.glowColor[2], opacity * (lCfg.glowColor[3] / 255) * pulse);
        ellipse(GRID_SIZE * 0.3, GRID_SIZE * 0.3, GRID_SIZE * 0.6 * pulse);
        if (this.liquidType === 'l_lava' && random() < 0.005) {
          fill(255, 200, 50, opacity * 0.5); ellipse((GRID_SIZE)*0.2, (GRID_SIZE)*0.2, random(4, 10));
        }
        if (isLiquidExposed) {
          stroke(lCfg.glowColor[0], lCfg.glowColor[1], lCfg.glowColor[2], opacity * 0.6); strokeWeight(2); noFill();
          if (!ln) line(tl, 0, GRID_SIZE - tr, 0); if (!ls) line(bl, GRID_SIZE, GRID_SIZE - br, GRID_SIZE); if (!lw) line(0, tl, 0, GRID_SIZE - bl); if (!le) line(GRID_SIZE, tr, GRID_SIZE, GRID_SIZE - br);
          if (!ln && !lw) arc(rad, rad, rad * 2, rad * 2, PI, PI + HALF_PI); if (!ln && !le) arc(GRID_SIZE - rad, rad, rad * 2, rad * 2, PI + HALF_PI, TWO_PI); if (!ls && !le) arc(GRID_SIZE - rad, GRID_SIZE - rad, rad * 2, rad * 2, 0, HALF_PI); if (!ls && !lw) arc(rad, GRID_SIZE - rad, rad * 2, rad * 2, HALF_PI, PI);
        }
      }
    }

    if (!this.isMined) {
      const n = state.world.canConnectTo(this.pos.x, this.pos.y - GRID_SIZE, this.config);
      const s = state.world.canConnectTo(this.pos.x, this.pos.y + GRID_SIZE, this.config);
      const w = state.world.canConnectTo(this.pos.x - GRID_SIZE, this.pos.y, this.config);
      const e = state.world.canConnectTo(this.pos.x + GRID_SIZE, this.pos.y, this.config);
      const isExposed = !n || !s || !w || !e;
      const rad = 8;
      
      const oCfg = this.overlay ? overlayTypes[this.overlay] : null;

      let base = [...this.config.color];
      let bord = [...this.config.borderColor];
      
      const sizeMult = this.config.sizeMultiplier || 1.0;
      const renderSize = GRID_SIZE * sizeMult;
      const offset = (GRID_SIZE - renderSize) / 2;

      push();
      translate(offset, offset);
      
      const tl = (n || w) ? 0 : rad; const tr = (n || e) ? 0 : rad; const br = (s || e) ? 0 : rad; const bl = (s || w) ? 0 : rad;

      if (this.config.assetImgConfig) {
        const cfg = this.config.assetImgConfig;
        const pool = cfg.idleAssetImg;
        const nVariant = noise(this.gx * 31, this.gy * 7, 1000);
        const variantIdx = Math.floor(nVariant * pool.length);
        const sprite = state.assets[pool[variantIdx]];
        if (sprite) {
          push();
          translate(renderSize / 2, renderSize / 2);
          if (cfg.randomRotation) { 
            const nRot = noise(this.gx * 31, this.gy * 7, 1000);
            rotate(Math.floor(nRot * 4) * HALF_PI); 
          }
          if (cfg.randomFlip) { 
            const nFlip = noise(this.gx * 31, this.gy * 7, 1000);
            scale(nFlip > 0.5 ? -1 : 1, 1); 
          }
          imageMode(CENTER);
          if (opacity < 254) tint(255, opacity);
          image(sprite, 0, 0, renderSize, renderSize);
          if (opacity < 254) noTint();
          pop();
        }
      } else {
        if (!isExposed) fill(base[0] * 0.3, base[1] * 0.3, base[2] * 0.3, opacity); else fill(base[0], base[1], base[2], opacity);
        noStroke();
        rect(0, 0, renderSize+1, renderSize+1, tl, tr, br, bl); //+1 size to not show jittered outlines when moving

        if (isExposed) {
          stroke(bord[0], bord[1], bord[2], opacity); strokeWeight(3); noFill();
          if (!n) line(tl, 0, renderSize - tr, 0); 
          if (!s) line(bl, renderSize, renderSize - br, renderSize); 
          if (!w) line(0, tl, 0, renderSize - bl); 
          if (!e) line(renderSize, tr, renderSize, renderSize - br);
          
          if (!n && !w) arc(rad, rad, rad * 2, rad * 2, PI, PI + HALF_PI); 
          if (!n && !e) arc(renderSize - rad, rad, rad * 2, rad * 2, PI + HALF_PI, TWO_PI); 
          if (!s && !e) arc(renderSize - rad, renderSize - rad, rad * 2, rad * 2, 0, HALF_PI); 
          if (!s && !w) arc(rad, renderSize - rad, rad * 2, rad * 2, HALF_PI, PI);
        }
      }

      if (this.feature && isExposed) {
        drawDecoration(this.feature, this.gx, this.gy, opacity);
      }

      if (this.damageGlow > 0) {
        fill(255, 255, 255, this.damageGlow * opacity / 255); noStroke(); rect(0, 0, renderSize, renderSize, tl, tr, br, bl);
        this.damageGlow = lerp(this.damageGlow, 0, 0.1);
      }
      pop();
    }
    pop();
  }

  renderSparkles(opacity: number) {
    if (opacity <= 0 || this.isMined || !this.overlay) return;
    const oCfg = overlayTypes[this.overlay];
    if (!oCfg?.concealedSparkleVfx) return;
    // update: always render even if not concealed

    if (true) {
      let nVal = noise(this.gx * 0.5, this.gy * 0.5, state.frames * 0.02);
      if (nVal > 0.5) {
        const sparkleP = 0.5 + 0.2 * sin(state.frames * 0.05 + (this.gx + this.gy));
        push();
        translate(this.pos.x, this.pos.y);
        noStroke();
        let sCol = [255, 255, 255];
        if (oCfg.concealedSparkleVfx === 'v_sparkle_yellow') sCol = [255, 255, 100];
        if (oCfg.concealedSparkleVfx === 'v_sparkle_purple') sCol = [200, 100, 255];
        fill(sCol[0], sCol[1], sCol[2], opacity * sparkleP * 0.8);
        ellipse(GRID_SIZE / 2 + sin(state.frames * 0.05) * 4, GRID_SIZE / 2 + cos(state.frames * 0.05) * 4, 8 * sparkleP);
        pop();
      }
    }
  }

  /**
   * Phase 2 of Layered Rendering: High-cost overlays and status bars.
   */
  renderOverlay(opacity: number) {
    if (opacity <= 0) return;
    if (this.isMined || !this.overlay) {
        if (!this.isMined && this.health < this.maxHealth) {
           this.renderHealthBar(opacity);
        }
        return;
    };

    const n = state.world.canConnectTo(this.pos.x, this.pos.y - GRID_SIZE, this.config);
    const s = state.world.canConnectTo(this.pos.x, this.pos.y + GRID_SIZE, this.config);
    const w = state.world.canConnectTo(this.pos.x - GRID_SIZE, this.pos.y, this.config);
    const e = state.world.canConnectTo(this.pos.x + GRID_SIZE, this.pos.y, this.config);
    const isExposed = !n || !s || !w || !e;
    
    const oCfg = overlayTypes[this.overlay];
    if (oCfg && (isExposed || oCfg?.isConcealedAlongWithObstacle === false || state.currentScreen === 'level_editor')) {
      push(); translate(this.pos.x, this.pos.y);
      drawOverlay(oCfg.obstacleOverlayVfx, this, opacity);
      
      if (oCfg.enemyTurretConfig) {
        const eCfg = oCfg.enemyTurretConfig;
        const bcx = this.pos.x + GRID_SIZE/2;
        const bcy = this.pos.y + GRID_SIZE/2;

        if (eCfg.drawAimingLine && this.lockedTargetPos) {
          const lockDuration = eCfg.barrelLockDurationBeforeFiring || 0;
          const inLock = this.isBarrelLocked || (lockDuration > 0 && this.turretCooldown <= lockDuration);
          const targetPos = this.lockedTargetPos;
          const dx = targetPos.x - bcx;
          const dy = targetPos.y - bcy;
          const dSq = dx * dx + dy * dy;

          if (dSq < eCfg.shootRange * eCfg.shootRange * 1.5) {
            push();
            const laserAlpha = inLock ? 180 + 75 * sin(state.frames * 0.5) : 60;
            const laserWeight = inLock ? 2.5 : 1;
            stroke(255, inLock ? 40 : 100, 40, laserAlpha * (opacity / 255));
            strokeWeight(laserWeight);

            if (eCfg.bulletTypeKey === 'b_enemy_mortar_shell') {
              line(GRID_SIZE/2, GRID_SIZE/2, targetPos.x - this.pos.x, targetPos.y - this.pos.y);
              noFill();
              stroke(255, 60, 60, laserAlpha * (opacity / 255));
              ellipse(targetPos.x - this.pos.x, targetPos.y - this.pos.y, 30 + (inLock ? 6 * sin(state.frames * 0.4) : 0));
            } else {
              line(GRID_SIZE/2, GRID_SIZE/2, targetPos.x - this.pos.x, targetPos.y - this.pos.y);
            }
            pop();
          }
        }
      }
      pop();
    }

    this.renderHealthBar(opacity);
  }

  private renderHealthBar(opacity: number) {
    push(); translate(this.pos.x, this.pos.y);
    const n = state.world.canConnectTo(this.pos.x, this.pos.y - GRID_SIZE, this.config);
    const s = state.world.canConnectTo(this.pos.x, this.pos.y + GRID_SIZE, this.config);
    const w = state.world.canConnectTo(this.pos.x - GRID_SIZE, this.pos.y, this.config);
    const e = state.world.canConnectTo(this.pos.x + GRID_SIZE, this.pos.y, this.config);
    const isExposed = !n || !s || !w || !e;

    if (state.debugHP && isExposed) {
      fill(255, opacity); textAlign(CENTER, CENTER); textSize(9); noStroke(); text(`${floor(this.health)}`, GRID_SIZE/2, GRID_SIZE/2);
    } else if (this.health < this.maxHealth && isExposed) {
      fill(20, opacity * 0.8); noStroke(); rect(4, GRID_SIZE - 8, GRID_SIZE - 8, 4, 2);
      fill(255, 255, 100, opacity); rect(4, GRID_SIZE - 8, (this.health/this.maxHealth) * (GRID_SIZE - 8), 4, 2);
    }
    pop();
  }

  takeDamage(dmg: number, source?: any) {
    if (this.isMined || this.config?.isIndestructible || this.health === Infinity || this.type === 'o_barrier') return false;
    this.health -= dmg; this.damageGlow = 180;
    state.vfx.push(new BlockHitVFX(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2));
    if (this.health <= 0) {
      this.health = 0;
      this.isMined = true;
      
      // Trigger Hooks
      if (source) {
        triggerUpgradeHook('onMine', source, { target: this, targetType: 'block', typeName: this.overlay || this.type });
      }

      state.world.dirtyBlock(this.gx, this.gy);
      
      state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.config.color));
      
      const oCfg = this.overlay ? overlayTypes[this.overlay] : null;
      spawnLootAt(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.type, this.config.lootConfigOnDeath);

      if (oCfg) {
        // --- TNT Override ---
        if (this.overlay === 'ov_tnt') {
            state.tickingExplosives.push({
                x: this.pos.x + GRID_SIZE/2,
                y: this.pos.y + GRID_SIZE/2,
                type: 'ov_tnt',
                timer: 180,
                maxTimer: 180
            });
        }

        // --- Death Rattle for Spawners ---
        if ((oCfg.enemySpawnConfig || this.customSpawnerConfig) && this.spawnerBudget > 0) {
          const sCfg = this.customSpawnerConfig ? { ...oCfg.enemySpawnConfig, ...this.customSpawnerConfig } : oCfg.enemySpawnConfig;
          let safety = 50; 
          while (this.spawnerBudget > 0 && safety > 0) {
            safety--;
            const eTypes = (sCfg.enemyTypeKey && sCfg.enemyTypeKey.length > 0) ? sCfg.enemyTypeKey : ['e_basic'];
            const affordable = eTypes.filter((k: string) => enemyTypes[k] && enemyTypes[k].cost <= this.spawnerBudget);
            if (affordable.length === 0) break;
            
            const eKey = affordable[floor(random(affordable.length))];
            const eCfg = enemyTypes[eKey];
            const ang = random(TWO_PI);
            const r = random(GRID_SIZE * 0.5, (sCfg.spawnRadius || 120) * 1.2);
            const sx = this.pos.x + GRID_SIZE/2 + cos(ang) * r;
            const sy = this.pos.y + GRID_SIZE/2 + sin(ang) * r;
            
            if (state.world.hasSpawnArea() && !state.world.isSpawnAreaAt(sx, sy)) {
              continue;
            }
            if (!state.world.checkCollision(sx, sy, eCfg.size/2.2)) {
              requestSpawn(sx, sy, eKey);
              this.spawnerBudget -= eCfg.cost;
              state.vfx.push(new MuzzleFlash(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, ang, 30, 10, color(180, 50, 255)));
            }
          }
        }

        if (oCfg.bulletToSpawnOnDeath) {
          const wPos = createVector(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2);
          for (const bKey of oCfg.bulletToSpawnOnDeath) {
            let b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, bKey, 'none');
            b.life = 0; state.bullets.push(b);
          }
        }
        if (oCfg.lootConfigOnDeath) {
          spawnLootAt(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.overlay!, oCfg.lootConfigOnDeath);
        }
        if (oCfg.enemyToSpawnOnDeath) {
          const spawnCount = oCfg.rollCount || 1;
          for (let i = 0; i < spawnCount; i++) {
             const eType = oCfg.enemyToSpawnOnDeath[floor(random(oCfg.enemyToSpawnOnDeath.length))];
             requestSpawn(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, eType);
          }
        }
      }
      return true;
    }
    return false;
  }
}

const BLOCK_KEYS = ['o_dirt', 'o_clay', 'o_stone', 'o_slate', 'o_black'];

export class Chunk {
  cx: number; cy: number; blocks: Block[] = []; blockMap: Map<string, Block> = new Map();
  overlayBlocks: Block[] = []; // OPTIMIZATION: Keep track of blocks with overlays
  turrets: any[] = []; // NEW: Store world turrets in chunks
  loot: any[] = []; // NEW: Store loot in chunks
  localChunkLevel: number = 0;
  prefabId: string | null = null;
  roomEnemyBudget: number = 0;
  isRoomBudgetTriggered: boolean = false;
  deathBuffer: any = null;
  
  // NEW: Dual-grid buffering
  buffer: any = null;
  needsRedraw: boolean = true;

  constructor(cx: number, cy: number, directorIdx: number, bonusData: any = {}) { 
    this.cx = cx; this.cy = cy; 
    
    const isWorldGenEnabled = state.currentLevelId !== 'sandbox' && state.currentLevelLayoutData?.enableWorldGen !== false;

    if (isWorldGenEnabled) {
      // INTEGRATION: Discovery Order Index mapping
      const chain = state.roomDirectorChain || [];
      
      // NO LOOPING: Only use prefab if director index is within chain bounds.
      const targetPrefabId = (directorIdx >= 0 && directorIdx < chain.length) ? chain[directorIdx] : null;
      const prefab = targetPrefabId ? ROOM_PREFABS.find(p => p.id === targetPrefabId) : null;

      if (prefab) {
        this.generateFromPrefab(prefab, bonusData);
      } else {
        this.generate(bonusData); 
      }
    } else {
      this.blocks = [];
      this.blockMap.clear();
    }
    this.rebuildOverlayList();
  }

  // OPTIMIZATION: Cache blocks that need overlay rendering
  rebuildOverlayList() {
    this.overlayBlocks = this.blocks.filter(b => !!b.overlay || b.health < b.maxHealth);
    this.needsRedraw = true;
  }

  generate(bonusData: any = {}, levelOverride?: number) {
    this.blocks = [];
    this.blockMap.clear();

    if (state.currentLevelId === 'sandbox' || state.currentLevelLayoutData?.enableWorldGen === false) {
      return;
    }

    const lv = levelOverride !== undefined ? levelOverride : floor(constrain(state.currentChunkLevel, 0, 10));
    this.localChunkLevel = lv;
    const weights = BLOCK_WEIGHTS[lv];
    const liquidW = LIQUID_WEIGHTS[lv];

    this.blocks = [];
    this.blockMap.clear();

    const candidates: {gx: number, gy: number, liquid: string | null, isBlock: boolean}[] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let gx = this.cx * CHUNK_SIZE + x; let gy = this.cy * CHUNK_SIZE + y;
        let ln = noise((gx + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale, (gy + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale);
        let rn = noise((gx + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale, (gy + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale);
        let isRiver = Math.abs(rn - 0.5) < worldGenConfig.riverThreshold;
        let isLake = ln > worldGenConfig.lakeThreshold;
        
        if (this.cx === 0 && this.cy === 0 && dist(gx, gy, 8, 8) < worldGenConfig.spawnClearRadius) continue;

        let liquid = null;
        if (isLake || isRiver) {
          let cln = noise((gx + worldGenConfig.noiseOffsetClumping) * worldGenConfig.liquidClumpScale, (gy + worldGenConfig.noiseOffsetClumping) * worldGenConfig.liquidClumpScale);
          let totalLW = liquidW.reduce((a, b) => a + b, 0);
          if (totalLW > 0) {
            let r = cln * totalLW; let sum = 0;
            for (let i = 0; i < LIQUID_KEYS.length; i++) { sum += liquidW[i]; if (r <= sum) { liquid = LIQUID_KEYS[i]; break; } }
          }
        }
        let isBlock = false;
        if (!liquid) {
          let n = noise((gx + worldGenConfig.noiseOffsetBlocks) * worldGenConfig.blockNoiseScale, (gy + worldGenConfig.noiseOffsetBlocks) * worldGenConfig.blockNoiseScale);
          if (n > worldGenConfig.blockThreshold) isBlock = true;
        }
        if (liquid || isBlock) candidates.push({gx, gy, liquid, isBlock});
      }
    }
    if (candidates.length === 0) return;
    for (const c of candidates) {
      const b = new Block(c.gx, c.gy, 'o_dirt', null, lv, c.liquid);
      if (c.liquid) b.isMined = true; else b.isMined = false;
      this.blocks.push(b); this.blockMap.set(`${c.gx},${c.gy}`, b);
    }

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    for (let i = 1; i < BLOCK_KEYS.length; i++) {
      const typeKey = BLOCK_KEYS[i];
      const solidBlocks = this.blocks.filter(b => !b.isMined);
      const targetCount = floor(solidBlocks.length * (weights[i] / totalWeight));
      if (targetCount <= 0) continue;
      const matSeed = 200 + i * 85;
      const candidatesToReplace = solidBlocks.filter(b => b.type === 'o_dirt');
      candidatesToReplace.sort((a, b) => {
        let nA = noise((a.gx + worldGenConfig.noiseOffsetBlocks) * 0.25, (a.gy + worldGenConfig.noiseOffsetBlocks) * 0.25, matSeed);
        let nB = noise((b.gx + worldGenConfig.noiseOffsetBlocks) * 0.25, (b.gy + worldGenConfig.noiseOffsetBlocks) * 0.25, matSeed);
        return nB - nA;
      });
      for (let j = 0; j < Math.min(targetCount, candidatesToReplace.length); j++) {
        let b = candidatesToReplace[j]; b.type = typeKey; b.config = obstacleTypes[typeKey]; b.health = b.config.health; b.maxHealth = b.health;
      }
    }

    const bonusOverlays = [
      { key: 'ov_tnt', amount: bonusData.tnt || 0, stat: 'totalTntSpawned' },
      { key: 'ov_stray', amount: bonusData.stray || 0, stat: 'totalStraySpawned' },
      { key: 'ov_sunflower', amount: bonusData.sunflower || 0, stat: 'totalSunflowerSpawned' },
      { key: 'ov_sniper_tower', amount: bonusData.sniper || 0, stat: 'totalSniperSpawned' }
    ];

    for (const bonus of bonusOverlays) {
      let count = bonus.amount;
      while (count > 0) {
        const openBlocks = this.blocks.filter(b => !b.isMined && !b.overlay);
        if (openBlocks.length === 0) break;
        const target = openBlocks[floor(random(openBlocks.length))];
        target.setOverlay(bonus.key);
        (state as any)[bonus.stat]++;
        count--;
      }
    }

    if (bonusData.spawner && bonusData.spawner > 0) {
        let count = bonusData.spawner;
        const genCfg = WORLD_GEN_STATS.spawner[lv];
        const dangerRange = genCfg.dangerRange || [1, 1];
        const budgetOverride = genCfg.budget || 30;

        while (count > 0) {
            const openBlocks = this.blocks.filter(b => !b.isMined && !b.overlay);
            if (openBlocks.length === 0) break;
            const target = openBlocks[floor(random(openBlocks.length))];

            const spawnerPool = Object.keys(overlayTypes).filter(k => {
                const o = overlayTypes[k];
                return o.isEnemySpawner && o.danger >= dangerRange[0] && o.danger <= dangerRange[1];
            });

            if (spawnerPool.length > 0) {
                const chosenSpawnerKey = spawnerPool[floor(random(spawnerPool.length))];
                target.setOverlay(chosenSpawnerKey);
                target.spawnerBudget = budgetOverride;
                state.totalSpawnerSpawned++;
            }
            count--;
        }
    }

    let remainingSun = bonusData.sun || 0;
    const sunTypes = [
      { key: 'sunClump', val: ECONOMY_CONFIG.lootValues.sunClump, w: 1 },
      { key: 'sunOre', val: ECONOMY_CONFIG.lootValues.sunOre, w: 4 },
      { key: 'sunTiny', val: ECONOMY_CONFIG.lootValues.sunTiny, w: 20 }
    ];
    while (remainingSun > 0) {
      let affordable = sunTypes.filter(t => t.val <= remainingSun);
      if (affordable.length === 0) break;
      let totalW = affordable.reduce((s, t) => s + t.w, 0);
      let r = random(totalW);
      let chosenType = affordable[affordable.length - 1].key;
      let sum = 0;
      for (let t of affordable) { sum += t.w; if (r <= sum) { chosenType = t.key; break; } }
      const openBlocks = this.blocks.filter(b => !b.isMined && !b.overlay);
      if (openBlocks.length === 0) break;
      const target = openBlocks[floor(random(openBlocks.length))];
      target.setOverlay(chosenType);
      state.totalSunSpawned += (ECONOMY_CONFIG.lootValues as any)[chosenType];
      remainingSun -= (ECONOMY_CONFIG.lootValues as any)[chosenType];
    }
  }

  generateFromPrefab(prefab: RoomPrefab, bonusData: any = {}) {
    if (state.currentLevelId === 'sandbox' || state.currentLevelLayoutData?.enableWorldGen === false) {
      this.blocks = [];
      this.blockMap.clear();
      return;
    }

    const lv = floor(constrain(state.currentChunkLevel, 0, 10));
    this.generate(bonusData, lv);
    
    this.prefabId = prefab.id;
    const cfg = prefab.worldGenConfig;

    const pickValidBlockForAddition = () => {
      const candidates = this.blocks.filter(b => !b.isMined && !b.overlay && !b.liquidType);
      if (candidates.length === 0) return null;
      return candidates[floor(random(candidates.length))];
    };

    // TRACKING FOR NPC AVOIDANCE
    let npcSpawnGX: number | null = null;
    let npcSpawnGY: number | null = null;

    if (cfg.guaranteedNpc) {
      let npcKey = cfg.guaranteedNpc;
      
      const resolveNpcKey = (pool: string[]) => {
        if (cfg.prioritizeUniqueNpc) {
          const unspawned = pool.filter(k => !state.spawnedNpcKeys.has(k));
          if (unspawned.length > 0) return random(unspawned);
        }
        return random(pool);
      };

      if (npcKey === 'lv1 npc') npcKey = resolveNpcKey(['NPC_lv1_lily', 'NPC_lv1_jelly']);
      else if (npcKey === 'lv2 npc') npcKey = resolveNpcKey(['NPC_lv2_farmer', 'NPC_lv2_sourgrape', 'NPC_lv2_shroom']);
      else if (npcKey === 'lv3 npc') npcKey = resolveNpcKey(['NPC_lv3_knight', 'NPC_lv3_hunter', 'NPC_lv3_shadie']);

      state.spawnedNpcKeys.add(npcKey);

      const spawnGX = floor(this.cx * CHUNK_SIZE + random(4, 12));
      const spawnGY = floor(this.cy * CHUNK_SIZE + random(4, 12));
      npcSpawnGX = spawnGX;
      npcSpawnGY = spawnGY;
      
      for (let i = spawnGX - 2; i <= spawnGX + 2; i++) {
        for (let j = spawnGY - 2; j <= spawnGY + 2; j++) {
           const b = this.blockMap.get(`${i},${j}`);
           if (b) {
             b.isMined = true;
             b.overlay = null;
             b.liquidType = null;
           } else {
             // Create an air block if it doesn't exist to ensure we track the NPC area
             const air = new Block(i, j, 'o_dirt');
             air.isMined = true;
             this.blocks.push(air);
             this.blockMap.set(`${i},${j}`, air);
           }
        }
      }
      state.npcs.push(new NPCEntity(spawnGX * GRID_SIZE + GRID_SIZE/2, spawnGY * GRID_SIZE + GRID_SIZE/2, npcKey));
    }

    if (cfg.guaranteedOverlay) {
        const target = pickValidBlockForAddition();
        if (target) {
            target.setOverlay(cfg.guaranteedOverlay);
        }
    }

    const totalPossibleBlocks = CHUNK_SIZE * CHUNK_SIZE;
    const calculateCurrentAir = () => {
        let air = totalPossibleBlocks - this.blocks.filter(b => !b.isMined).length;
        if (cfg.airIncludeLiquid) air += this.blocks.filter(b => b.liquidType).length;
        return air;
    };

    const targetAir = floor(totalPossibleBlocks * cfg.minAirRatio);
    let currentAir = calculateCurrentAir();
    
    if (currentAir < targetAir) {
        const digAmount = targetAir - currentAir;
        let candidates = this.blocks.filter(b => !b.isMined && !b.overlay);
        if (candidates.length < digAmount) candidates = this.blocks.filter(b => !b.isMined);
        for (let i = 0; i < Math.min(digAmount, candidates.length); i++) {
            const idx = floor(random(candidates.length));
            const target = candidates.splice(idx, 1)[0];
            target.isMined = true;
        }
    }

    const spawnerCount = floor(random(cfg.enemySpawnerCount[0], cfg.enemySpawnerCount[1] + 1));
    const danger = cfg.enemySpawnerConfig.danger;
    const spawnerPool = Object.keys(overlayTypes).filter(k => overlayTypes[k].isEnemySpawner && overlayTypes[k].danger === danger);
    
    for (let i = 0; i < spawnerCount; i++) {
      const target = pickValidBlockForAddition();
      if (target && spawnerPool.length > 0) {
        target.setOverlay(spawnerPool[floor(random(spawnerPool.length))]);
        const bRange = cfg.enemySpawnerConfig.enemySpawnConfig.budget;
        target.spawnerBudget = floor(random(bRange[0], bRange[1] + 1));
        state.totalSpawnerSpawned++;
      }
    }

    const sunToSpawn = floor(random(cfg.sun[0], cfg.sun[1] + 1));
    if (sunToSpawn > 0) {
      let remainingSun = sunToSpawn;
      const sunTypes = [
        { key: 'sunClump', val: ECONOMY_CONFIG.lootValues.sunClump, w: 1 },
        { key: 'sunOre', val: ECONOMY_CONFIG.lootValues.sunOre, w: 4 },
        { key: 'sunTiny', val: ECONOMY_CONFIG.lootValues.sunTiny, w: 15 }
      ];
      while (remainingSun > 0) {
        let affordable = sunTypes.filter(t => t.val <= remainingSun);
        if (affordable.length === 0) break;
        let totalW = affordable.reduce((s, t) => s + t.w, 0);
        let r = random(totalW);
        let chosenType = affordable[affordable.length - 1].key;
        let sum = 0;
        for (let t of affordable) { sum += t.w; if (r <= sum) { chosenType = t.key; break; } }
        const target = pickValidBlockForAddition();
        if (!target) break; 
        target.setOverlay(chosenType);
        state.totalSunSpawned += (ECONOMY_CONFIG.lootValues as any)[chosenType];
        remainingSun -= (ECONOMY_CONFIG.lootValues as any)[chosenType];
      }
    }

    // Split Pots Logic: TNT remains an overlay on solid blocks
    const tntCount = floor(random(cfg.tnt[0], cfg.tnt[1] + 1));
    for (let i = 0; i < tntCount; i++) {
      const target = pickValidBlockForAddition();
      if (target) target.setOverlay('ov_tnt');
    }

    for (const g of cfg.guaranteedObstacleConfig) {
      const count = floor(random(g.count[0], g.count[1] + 1));
      for (let i = 0; i < count; i++) {
        const target = pickValidBlockForAddition();
        if (target) {
            target.type = g.type; target.config = obstacleTypes[g.type] || obstacleTypes['o_dirt']; target.health = target.config.health; target.maxHealth = target.health;
        }
      }
    }

    // CRATE SPAWNING AS FINAL STEP: Place on TRUE air coordinates (not in blockMap)
    const crateCount = floor(random(cfg.crate[0], cfg.crate[1] + 1));
    const airCandidates: {gx: number, gy: number}[] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let lgx = this.cx * CHUNK_SIZE + x;
        let lgy = this.cy * CHUNK_SIZE + y;
        const existing = this.blockMap.get(`${lgx},${lgy}`);
        if (!existing || existing.isMined) {
            if (existing && existing.liquidType) continue; // Don't float on liquid
            // Exclude blocks within NPC clear radius
            if (npcSpawnGX !== null && npcSpawnGY !== null) {
                if (abs(lgx - npcSpawnGX) <= 3 && abs(lgy - npcSpawnGY) <= 3) continue;
            }
            airCandidates.push({gx: lgx, gy: lgy});
        }
      }
    }

    for (let i = 0; i < crateCount; i++) {
        if (airCandidates.length === 0) break;
        const idx = floor(random(airCandidates.length));
        const c = airCandidates.splice(idx, 1)[0];
        
        let target = this.blockMap.get(`${c.gx},${c.gy}`);
        if (!target) {
           target = new Block(c.gx, c.gy, 'o_crate');
           this.blocks.push(target);
           this.blockMap.set(`${c.gx},${c.gy}`, target);
        } else {
           target.isMined = false;
           target.type = 'o_crate';
           target.config = obstacleTypes['o_crate'];
           target.health = target.config.health;
           target.maxHealth = target.health;
        }
    }

    this.roomEnemyBudget = prefab.enemyBudget;
    this.rebuildOverlayList();
    this.needsRedraw = true;
  }

  renderToBuffer() {
    const chunkW = CHUNK_SIZE * GRID_SIZE;
    if (!this.buffer) {
      this.buffer = createGraphics(chunkW, chunkW);
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      this.buffer.pixelDensity(dpr);
    }
    const pg = this.buffer;
    (pg as any)._chunkSeed = (this.cx * 131 + this.cy * 71);
    pg.clear();
    pg.noStroke();

    const getBlockType = (gx: number, gy: number) => {
      const b = state.world.getBlock(gx, gy);
      if (!b || b.isMined) return null;
      return b.type;
    };

    // We render a 17x17 visual grid to cover all junctions
    // The visual grid is offset by -0.5 tiles from the world grid
    for (let vy = 0; vy <= CHUNK_SIZE; vy++) {
      for (let vx = 0; vx <= CHUNK_SIZE; vx++) {
        const gx = this.cx * CHUNK_SIZE + vx - 1;
        const gy = this.cy * CHUNK_SIZE + vy - 1;

        // Junction neighbors
        const tl = getBlockType(gx, gy);
        const tr = getBlockType(gx + 1, gy);
        const bl = getBlockType(gx, gy + 1);
        const br = getBlockType(gx + 1, gy + 1);

        drawAutotile(pg, vx, vy, gx, gy, tl, tr, bl, br);
      }
    }
    this.needsRedraw = false;
  }

  ensureDeathBuffer() {
    if (!this.deathBuffer) {
      this.deathBuffer = createGraphics(CHUNK_SIZE * GRID_SIZE, CHUNK_SIZE * GRID_SIZE);
      this.deathBuffer.pixelDensity(1);
    }
    return this.deathBuffer;
  }

  display(playerPos: any) {
    const margin = 200; 
    const left = state.cameraPos.x - width/2 - margin;
    const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin;
    const bottom = state.cameraPos.y + height/2 + margin;
    const chunkW = CHUNK_SIZE * GRID_SIZE;
    const chunkX = this.cx * chunkW;
    const chunkY = this.cy * chunkW;
    if (chunkX + chunkW < left || chunkX > right || chunkY + chunkW < top || chunkY > bottom) return;
    
    // SQUARED DISTANCE OPTIMIZATION
    const px = playerPos.x;
    const py = playerPos.y;
    const visRadSq = (VISIBILITY_RADIUS * GRID_SIZE)**2;
    const fadeStartSq = ((VISIBILITY_RADIUS - 1) * GRID_SIZE)**2;

    if (this.deathBuffer) {
        push();
        imageMode(CORNER);
        image(this.deathBuffer, chunkX, chunkY);
        pop();
    }

    // Pass 0: Liquids (UNDER blocks)
    for (let b of this.blocks) {
        const dx = b.pos.x + GRID_SIZE/2 - px;
        const dy = b.pos.y + GRID_SIZE/2 - py;
        const dSq = dx*dx + dy*dy;
        
        if (dSq > visRadSq) continue;
        if (b.liquidType) {
          let opacity = 255;
          if (dSq > fadeStartSq) {
            const d = Math.sqrt(dSq);
            opacity = constrain(map(d, (VISIBILITY_RADIUS - 1) * GRID_SIZE, VISIBILITY_RADIUS * GRID_SIZE, 255, 0), 0, 255);
          }
          b.renderBase(opacity);
        }
    }

    if (this.needsRedraw) {
      this.renderToBuffer();
    }
    if (this.buffer) {
      push();
      imageMode(CORNER);
      image(this.buffer, chunkX, chunkY, chunkW + 0.5, chunkW + 0.5);
      pop();
    }

    // Pass 1: Renders bases (Ground/Liquids/Borders) - Now only logic and non-liquid bases if any
    for (let b of this.blocks) { 
        const dx = b.pos.x + GRID_SIZE/2 - px;
        const dy = b.pos.y + GRID_SIZE/2 - py;
        const dSq = dx*dx + dy*dy;
        
        if (dSq > visRadSq) continue;
        b.update(); // Block logic only runs when near visible

        let opacity = 255;
        if (dSq > fadeStartSq) {
          const d = Math.sqrt(dSq);
          opacity = constrain(map(d, (VISIBILITY_RADIUS - 1) * GRID_SIZE, VISIBILITY_RADIUS * GRID_SIZE, 255, 0), 0, 255);
        }
        // b.renderBase(opacity); // Now handled by buffer for generic blocks
        if (b.config.assetImgConfig) b.renderBase(opacity);
        // if (b.liquidType) b.renderBase(opacity); // MOVED TO PASS 0
        b.renderSparkles(opacity);

        if (state.showDebug && state.showObstacleOutline && !b.isMined) {
          push();
          noFill();
          stroke(255, 0, 0, opacity * 0.5);
          strokeWeight(1);
          rect(b.pos.x, b.pos.y, GRID_SIZE, GRID_SIZE);
          
          // Debug: Show block coordinates
          if (opacity > 200) {
            fill(255, 0, 0, opacity);
            noStroke();
            textSize(8);
            textAlign(CENTER, CENTER);
            text(`${b.gx},${b.gy}`, b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2);
          }
          pop();
        }
    }
    
    // Pass 2: Renders overlays (Assets/Pulsing effects) - OPTIMIZED LIST
    for (let b of this.overlayBlocks) {
        const dx = b.pos.x + GRID_SIZE/2 - px;
        const dy = b.pos.y + GRID_SIZE/2 - py;
        const dSq = dx*dx + dy*dy;
        
        if (dSq > visRadSq) continue;

        let opacity = 255;
        if (dSq > fadeStartSq) {
          const d = Math.sqrt(dSq);
          opacity = constrain(map(d, (VISIBILITY_RADIUS - 1) * GRID_SIZE, VISIBILITY_RADIUS * GRID_SIZE, 255, 0), 0, 255);
        }
        b.renderOverlay(opacity);
        b.renderSparkles(opacity);
    }

    // Pass 3: Render Loot
    for (let l of this.loot) {
      l.display();
    }
  }
}

export class WorldManager {
  chunks: Map<string, Chunk> = new Map();

  constructor() {
    if (state.roomDirectorChain.length === 0) {
      state.roomDirectorData = generateRoomDirectorData();
      state.roomDirectorChain = state.roomDirectorData.split('-');
    }
  }

  getChunk(cx: number, cy: number) {
    let key = `${cx},${cy}`;
    
    // LRU Management
    const orderIdx = state.chunkAccessOrder.indexOf(key);
    if (orderIdx !== -1) {
      state.chunkAccessOrder.splice(orderIdx, 1);
    }
    state.chunkAccessOrder.push(key);

    if (!this.chunks.has(key)) {
      // Enforce 127 chunk limit
      if (this.chunks.size >= 127) {
        const oldestKey = state.chunkAccessOrder.shift();
        if (oldestKey) {
          this.chunks.delete(oldestKey);
        }
      }

      if (!state.chunkToDirectorIndex.has(key)) {
        state.chunkToDirectorIndex.set(key, state.nextDirectorIndex++);
      }
      const directorIdx = state.chunkToDirectorIndex.get(key);
      const lv = floor(constrain(state.currentChunkLevel, 0, 10));
      const bonusData: any = {};
      const isStart = (cx === 0 && cy === 0);
      const featureKeys = ['sun', 'tnt', 'stray', 'sunflower', 'sniper', 'spawner'];
      for (const fk of featureKeys) {
        const stats = WORLD_GEN_STATS[fk][lv];
        if (isStart || random() < stats.chance) {
          const potKey = `accumulated${fk.charAt(0).toUpperCase() + fk.slice(1)}Pot`;
          const amount = floor(state[potKey]);
          bonusData[fk] = amount;
          state[potKey] -= amount;
        } else { bonusData[fk] = 0; }
      }
      this.chunks.set(key, new Chunk(cx, cy, directorIdx, bonusData));
      this.dirtyChunkAndNeighbors(cx, cy);
    }
    return this.chunks.get(key);
  }
  regenerateChunkAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE);
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    this.chunks.delete(`${cx},${cy}`);
    this.getChunk(cx, cy);
  }

  dirtyBlock(gx: number, gy: number) {
    flowField.markDirty();
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    
    // Always mark the chunk containing this block
    const homeChunk = this.chunks.get(`${cx},${cy}`);
    if (homeChunk) {
      homeChunk.needsRedraw = true;
      homeChunk.rebuildOverlayList();
    }

    // Only neighbor chunks sharing the perimeter boundary junction need redraw
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const touchLeft = lx === 0;
    const touchRight = lx === CHUNK_SIZE - 1;
    const touchTop = ly === 0;
    const touchBottom = ly === CHUNK_SIZE - 1;

    if (touchLeft) {
      const c = this.chunks.get(`${cx - 1},${cy}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight) {
      const c = this.chunks.get(`${cx + 1},${cy}`);
      if (c) c.needsRedraw = true;
    }
    if (touchTop) {
      const c = this.chunks.get(`${cx},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchBottom) {
      const c = this.chunks.get(`${cx},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchLeft && touchTop) {
      const c = this.chunks.get(`${cx - 1},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchLeft && touchBottom) {
      const c = this.chunks.get(`${cx - 1},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight && touchTop) {
      const c = this.chunks.get(`${cx + 1},${cy - 1}`);
      if (c) c.needsRedraw = true;
    }
    if (touchRight && touchBottom) {
      const c = this.chunks.get(`${cx + 1},${cy + 1}`);
      if (c) c.needsRedraw = true;
    }
  }

  dirtyChunkAndNeighbors(cx: number, cy: number) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const chunk = this.chunks.get(`${cx + dx},${cy + dy}`);
        if (chunk) {
          chunk.needsRedraw = true;
          if (dx === 0 && dy === 0) {
            chunk.rebuildOverlayList();
          }
        }
      }
    }
  }

  display(playerPos: any) {
    const rangeSq = (width + height + 600)**2;
    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW + chunkW/2; const cY = chunk.cy * chunkW + chunkW/2;
      const dx = cX - playerPos.x; const dy = cY - playerPos.y;
      if (dx*dx + dy*dy < rangeSq) {
        state.activeChunkKeys.add(`${chunk.cx},${chunk.cy}`);
        chunk.display(playerPos); 
      }
    });
  }

  setBlock(gx: number, gy: number, typeKey: string | null) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    if (!chunk) return;
    if (typeKey === null) {
      const b = chunk.blockMap.get(`${gx},${gy}`);
      if (b) b.isMined = true;
    } else {
      let b = chunk.blockMap.get(`${gx},${gy}`);
      if (!b) {
        b = new Block(gx, gy, typeKey);
        chunk.blocks.push(b);
        chunk.blockMap.set(`${gx},${gy}`, b);
      } else {
        b.isMined = false;
        b.type = typeKey;
        b.config = obstacleTypes[typeKey];
        b.health = b.config.health;
        b.maxHealth = b.health;
      }
    }
    this.dirtyBlock(gx, gy);
  }

  takeDamage(gx: number, gy: number, dmg: number, source?: any) {
    const b = this.getBlock(gx, gy);
    if (b) {
      return b.takeDamage(dmg, source);
    }
    return false;
  }

  update(playerPos: any) {
    let pcx = floor(playerPos.x / (GRID_SIZE * CHUNK_SIZE)); let pcy = floor(playerPos.y / (GRID_SIZE * CHUNK_SIZE));
    const exploredKey = `${pcx},${pcy}`;
    const currentChunk = this.getChunk(pcx, pcy);
    if (currentChunk && currentChunk.roomEnemyBudget > 0 && !currentChunk.isRoomBudgetTriggered) {
      spawnFromBudget(currentChunk.roomEnemyBudget);
      currentChunk.isRoomBudgetTriggered = true;
    }
    if (!state.exploredChunks.has(exploredKey)) { 
      state.exploredChunks.add(exploredKey); 
      const lv = floor(constrain(state.currentChunkLevel, 0, 10)); 
      state.accumulatedSunPot += WORLD_GEN_STATS.sun[lv].value;
      state.accumulatedTntPot += WORLD_GEN_STATS.tnt[lv].value;
      state.accumulatedStrayPot += WORLD_GEN_STATS.stray[lv].value;
      state.accumulatedSunflowerPot += WORLD_GEN_STATS.sunflower[lv].value;
      state.accumulatedSniperPot += WORLD_GEN_STATS.sniper[lv].value;
      state.accumulatedSpawnerPot += WORLD_GEN_STATS.spawner[lv].value;
      this.updateLevel(); 
    }
    for (let x = -CHUNK_GEN_RADIUS; x <= CHUNK_GEN_RADIUS; x++) for (let y = -CHUNK_GEN_RADIUS; y <= CHUNK_GEN_RADIUS; y++) this.getChunk(pcx + x, pcy + y);

    // Update world turrets in loaded chunks
    state.activeChunkKeys.clear();
    const activeRadiusSq = (GRID_SIZE * CHUNK_SIZE * 2.5) ** 2;

    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW + chunkW/2;
      const cY = chunk.cy * chunkW + chunkW/2;
      const dx = cX - playerPos.x;
      const dy = cY - playerPos.y;
      const dSq = dx*dx + dy*dy;

      if (dSq < activeRadiusSq) {
        state.activeChunkKeys.add(`${chunk.cx},${chunk.cy}`);
        
        // Update turrets
        for (let i = chunk.turrets.length - 1; i >= 0; i--) {
          chunk.turrets[i].update();
        }
        // Update loot
        for (let i = chunk.loot.length - 1; i >= 0; i--) {
          const res = chunk.loot[i].update(playerPos);
          if (res === 'collected') {
            const l = chunk.loot.splice(i, 1)[0];
            const screenPos = {
              x: l.pos.x - (state.cameraPos.x - width/2),
              y: l.pos.y - (state.cameraPos.y - height/2)
            };
            
            // Determine UI target position
            let tx = 50, ty = 50;
            if (l.config.item === 'sun') { tx = 40; ty = 40; }
            else if (l.config.item === 'elixir') { tx = 40; ty = 80; }
            else if (l.config.item === 'soil') { tx = 40; ty = 120; }
            else if (l.config.item === 'raisin') {
              const btnMargin = 10;
              const almanacBtnSize = 80;
              tx = width - btnMargin - almanacBtnSize / 2;
              ty = height - btnMargin - almanacBtnSize / 2;
            }
            else if (l.config.type === 'turret' || l.config.type === 'item' || l.config.type === 'turretAsItem') {
              tx = width - 50; ty = height - 50;
            }

            state.uiVfx.push(new LootInFlightVFX(
              screenPos.x, screenPos.y, 
              tx, ty, 
              l.config.idleAssetImg, 
              l.renderSize, 
              l.config.itemValue || 1, 
              l.config.item, 
              l.config.type,
              (l as any).turretHP // Pass HP if it's a TurretLoot
            ));
          } else if (res === 'missed' || res === 'consumed') {
            const l = chunk.loot.splice(i, 1)[0];
            if (res === 'missed' && l.config.item === 'sun') {
              state.sunMissedTotal += l.config.itemValue || 1;
            }
          }
        }
      }
    });
  }

  addTurret(turret: any) {
    const cx = floor(turret.gx / CHUNK_SIZE);
    const cy = floor(turret.gy / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy);
    if (chunk) {
      // Avoid duplicates at the same position
      chunk.turrets = chunk.turrets.filter(t => t.gx !== turret.gx || t.gy !== turret.gy);
      chunk.turrets.push(turret);
    }
  }

  removeTurret(gx: number, gy: number) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.chunks.get(`${cx},${cy}`);
    if (chunk) {
      chunk.turrets = chunk.turrets.filter(t => t.gx !== gx || t.gy !== gy);
    }
  }

  getAllTurrets() {
    const all: any[] = [];
    this.chunks.forEach(chunk => {
      all.push(...chunk.turrets);
    });
    return all;
  }
  getTurretAt(gx: number, gy: number) {
    const cx = floor(gx / CHUNK_SIZE);
    const cy = floor(gy / CHUNK_SIZE);
    const chunk = this.chunks.get(`${cx},${cy}`);
    if (chunk) {
      return chunk.turrets.find(t => t.gx === gx && t.gy === gy);
    }
    return null;
  }
  updateLevel() {
    let count = state.exploredChunks.size; state.currentChunkLevel = 0;
    for (let i=0; i<LEVEL_THRESHOLDS.length; i++) { if (count >= LEVEL_THRESHOLDS[i]) state.currentChunkLevel = i + 1; else break; }
    const lv = floor(constrain(state.currentChunkLevel, 0, 10)); state.currentNightWaveBudget = Math.max(state.currentNightWaveBudget, LEVEL_BUDGET[lv]);
  }
  checkLOS(x1: number, y1: number, x2: number, y2: number) {
    let dx = x2 - x1; let dy = y2 - y1; let dSq = dx*dx + dy*dy;
    if (dSq < 1) return true;
    let d = Math.sqrt(dSq);
    // Use smaller steps for better coverage, but not so small it's slow
    let steps = floor(d / (GRID_SIZE * 0.4));
    if (steps < 2) steps = 2; // Ensure at least one midpoint check for very close targets
    
    const startGx = floor(x1 / GRID_SIZE);
    const startGy = floor(y1 / GRID_SIZE);
    const targetGx = floor(x2 / GRID_SIZE);
    const targetGy = floor(y2 / GRID_SIZE);

    for (let i = 1; i < steps; i++) {
      let t = i / steps;
      let px = x1 + dx * t;
      let py = y1 + dy * t;
      
      let gx = floor(px / GRID_SIZE);
      let gy = floor(py / GRID_SIZE);
      
      // Ignore the block the ray starts in and the block it ends in
      if (gx === startGx && gy === startGy) continue;
      if (gx === targetGx && gy === targetGy) continue;
      
      if (this.isBlockAt(px, py)) return false;
    }
    return true;
  }
  getNearestBlock(pos: any, range: number) {
    let nearest = null; let minDistSq = range*range;
    const viewportMargin = range + 200;
    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW; const cY = chunk.cy * chunkW;
      const dx = (cX + chunkW/2) - pos.x; const dy = (cY + chunkW/2) - pos.y;
      if (dx*dx + dy*dy > (viewportMargin + chunkW)**2) return;
      for (let b of chunk.blocks) { 
        if (b.isMined) continue; 
        let bX = b.pos.x + GRID_SIZE/2; let bY = b.pos.y + GRID_SIZE/2; 
        let dSq = (pos.x - bX)**2 + (pos.y - bY)**2;
        if (dSq < minDistSq && this.checkLOS(pos.x, pos.y, bX, bY)) { minDistSq = dSq; nearest = b; } 
      }
    });
    return nearest;
  }
  getBlock(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    return chunk.blockMap.get(`${gx},${gy}`);
  }

  isTileDangerous(x: number, y: number): boolean {
    const gx = floor(x / GRID_SIZE);
    const gy = floor(y / GRID_SIZE);
    const block = this.getBlock(gx, gy);

    if (block) {
      if (block.overlay && overlayTypes[block.overlay]?.isDanger) return true;
      if (block.liquidType && liquidTypes[block.liquidType]?.isDanger) return true;
    }
    return false;
  }

  isBlockAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE); let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`);
    return b && !b.isMined && (b.config.blocksLOS !== false);
  }
  canConnectTo(x: number, y: number, myConfig: any) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE); let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`);
    if (!b || b.isMined) return false;
    if (myConfig.connectToOtherBlock === false || b.config.connectToOtherBlock === false) return false;
    return true;
  }
  getLiquidAt(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE); let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    const b = chunk.blockMap.get(`${gx},${gy}`); return b ? b.liquidType : null;
  }
  checkCollision(x: number, y: number, radius: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE);
    const searchRange = radius > GRID_SIZE ? 2 : 1;
    for (let i = gx - searchRange; i <= gx + searchRange; i++) {
      for (let j = gy - searchRange; j <= gy + searchRange; j++) {
        let cx = floor(i / CHUNK_SIZE); let cy = floor(j / CHUNK_SIZE);
        let chunk = this.chunks.get(`${cx},${cy}`);
        if (chunk) { 
          const b = chunk.blockMap.get(`${i},${j}`); 
          if (b && !b.isMined) {
            const sizeMult = b.config.sizeMultiplier || 1.0;
            const renderSize = GRID_SIZE * sizeMult;
            const offset = (GRID_SIZE - renderSize) / 2;
            
            // Constrain point to actual visual bounds of the block
            let cX = constrain(x, b.pos.x + offset, b.pos.x + offset + renderSize); 
            let cY = constrain(y, b.pos.y + offset, b.pos.y + offset + renderSize); 
            if ((x - cX)**2 + (y - cY)**2 < radius*radius) return true; 
          } 
        }
      }
    }
    for (const gf of state.groundFeatures) {
       if (gf.typeKey === 'gf_forcefield') {
          const dSq = (x - gf.pos.x)**2 + (y - gf.pos.y)**2;
          const rSum = radius + gf.config.radius;
          if (dSq < rSum * rSum) return true;
       }
    }
    return false;
  }

  spawnAreaSet: Set<string> = new Set();

  hasSpawnArea(): boolean {
    return !!(this.spawnAreaSet && this.spawnAreaSet.size > 0);
  }

  isSpawnAreaAt(x: number, y: number): boolean {
    if (!this.spawnAreaSet || this.spawnAreaSet.size === 0) return true;
    const gx = floor(x / GRID_SIZE);
    const gy = floor(y / GRID_SIZE);
    return this.spawnAreaSet.has(`${gx},${gy}`);
  }

  isSpawnAreaTile(gx: number, gy: number): boolean {
    return this.spawnAreaSet ? this.spawnAreaSet.has(`${gx},${gy}`) : false;
  }

  setSpawnAreaTile(gx: number, gy: number, isArea: boolean) {
    if (!this.spawnAreaSet) this.spawnAreaSet = new Set();
    const key = `${gx},${gy}`;
    if (isArea) {
      this.spawnAreaSet.add(key);
    } else {
      this.spawnAreaSet.delete(key);
    }
  }

  getRandomSpawnAreaPos(): { x: number, y: number } | null {
    if (!this.spawnAreaSet || this.spawnAreaSet.size === 0) return null;
    const arr = Array.from(this.spawnAreaSet);
    const picked = arr[floor(random(arr.length))];
    const [gx, gy] = picked.split(',').map(Number);
    return {
      x: gx * GRID_SIZE + random(4, GRID_SIZE - 4),
      y: gy * GRID_SIZE + random(4, GRID_SIZE - 4)
    };
  }
}

import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, HOUR_FRAMES } from '../constants';
import { obstacleTypes, overlayTypes } from '../balanceObstacles';
import { bulletTypes } from '../balanceBullets';
import { liquidTypes } from '../balanceLiquids';
import { MuzzleFlash, BlockDebris, BlockHitVFX, Explosion } from '../vfx/index';
import { Bullet } from '../entities';
import { spawnLootAt } from '../economy';
import { triggerUpgradeHook } from '../src/upgrades';
import { worldGenConfig, requestSpawn, getCurrentLevelHourlyBudget } from '../lvDemo';
import { drawOverlay } from '../visualObstacles';
import { enemyTypes } from '../balanceEnemies';
import { drawDecoration } from '../visualDecoration';
import { flowField } from '../pathfinding';
import { soundEngine } from '../src/audio/soundEngine';

declare const createVector: any;
declare const floor: any;
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
declare const triangle: any;
declare const line: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const CENTER: any;
declare const LEFT: any;
declare const PI: any;
declare const HALF_PI: any;
declare const TWO_PI: any;
declare const atan2: any;
declare const radians: any;
declare const image: any;
declare const imageMode: any;
declare const scale: any;
declare const tint: any;
declare const noTint: any;
declare const sin: any;
declare const cos: any;
declare const color: any;
declare const noise: any;
declare const lerp: any;
declare const text: any;
declare const arc: any;

export class Block {
  gx: number; gy: number; pos: any; type: string; config: any; overlay: string | null = null;
  isMined: boolean = false; damageGlow: number = 0; health: number; maxHealth: number;
  biome: number = 0; feature: string | null = null;
  sunBits: { x: number, y: number, s: number }[] = [];
  liquidType: string | null = null;
  lastSniperShot: number = 0;
  lastSpawnTime: number = 0;
  spawnerBudget: number = 0;
  hourlySpawnBudgetAccrued?: number = 0;
  totalBudgetSpawned?: number = 0;
  lastHourlyBudgetFrame?: number;
  customSpawnerConfig?: any = null;
  paygateConfig?: { resource: string, amount: number, spent: number };
  customText?: string;
  turretCooldown: number = 0;
  turretStep: number = 0;
  lockedAngle: number = 0;
  lockedTargetPos: { x: number, y: number } | null = null;
  isBarrelLocked: boolean = false;
  isWinCondition: boolean = false;
  sunGeneratorConfig?: { damagePerSun: number; maxSun: number; accumulatedDamage: number; sunsDropped: number };
  catalystTimer?: number;
  cachedSpawnList: string[] = [];
  initialCachedSpawnCount: number = 0;
  enemiesSpawnedFromDamage: number = 0;

  constructor(gx: number, gy: number, typeKey = 'o_dirt', overlay: string | null = null, biome: number = 0, liquidType: string | null = null) {
    this.gx = gx; this.gy = gy;
    this.pos = createVector(gx * GRID_SIZE, gy * GRID_SIZE);
    this.type = typeKey;
    this.config = obstacleTypes[typeKey] || obstacleTypes['o_dirt'];
    this.health = this.config.health;
    this.maxHealth = this.health;
    this.biome = biome;
    this.liquidType = liquidType;

    if (typeKey === 'o_paygate') {
      this.paygateConfig = {
        resource: this.config.defaultCost?.resource || 'soil',
        amount: this.config.defaultCost?.amount || 10,
        spent: 0
      };
    }

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
        this.initCachedSpawnList(oCfg.enemySpawnConfig);
      }
      if (oCfg.enemyTurretConfig) {
        const eCfg = oCfg.enemyTurretConfig;
        const initialDelay = Array.isArray(eCfg.shootFireRate) ? eCfg.shootFireRate[0] : eCfg.shootFireRate;
        this.turretCooldown = floor(random(10, Math.max(30, initialDelay)));
        this.turretStep = 0;
        this.isBarrelLocked = false;
      }
      if (this.overlay.startsWith('sun') && this.overlay !== 'sunGenerator') {
        this.initSunBits(this.overlay);
      }
      if (this.overlay === 'sunGenerator' && !this.sunGeneratorConfig) {
        const sgCfg = overlayTypes['sunGenerator'];
        this.sunGeneratorConfig = {
          damagePerSun: sgCfg?.damagePerSun || 600,
          maxSun: sgCfg?.maxSunDropped || 100,
          accumulatedDamage: 0,
          sunsDropped: 0
        };
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

  /**
   * Caches the list of enemies that will be spawned by ov_spawner upon taking damage.
   */
  initCachedSpawnList(sCfg: any) {
    this.cachedSpawnList = [];
    this.enemiesSpawnedFromDamage = 0;
    let budget = sCfg.budget !== undefined ? sCfg.budget : (this.spawnerBudget || 60);
    const eTypes = (sCfg.enemyTypeKey && sCfg.enemyTypeKey.length > 0) ? sCfg.enemyTypeKey : ['e_basic'];

    let safety = 100;
    while (budget > 0 && safety > 0) {
      safety--;
      const affordable = eTypes.filter((k: string) => enemyTypes[k] && enemyTypes[k].cost <= budget);
      if (affordable.length === 0) break;
      const eKey = affordable[floor(random(affordable.length))];
      this.cachedSpawnList.push(eKey);
      budget -= enemyTypes[eKey].cost;
    }
    this.initialCachedSpawnCount = this.cachedSpawnList.length;
  }

  /**
   * Spawns an enemy for this spawner block.
   * Rules:
   * - If a spawnArea is declared within spawnRadius, spawns on that spawnArea tile.
   * - If NO spawnArea is declared within spawnRadius, spawns normally within spawnRadius.
   * - No proximity check (distance to player/turret).
   * - Safe liquids or ground, flying enemies can spawn on top of obstacles.
   */
  spawnEnemyFromSpawner(eKey: string, sCfg: any): boolean {
    const eCfg = enemyTypes[eKey];
    if (!eCfg) return false;
    const isFlying = !!eCfg.isFlying;
    const spawnRadius = sCfg?.spawnRadius !== undefined ? sCfg.spawnRadius : 120;
    const bcx = this.pos.x + GRID_SIZE / 2;
    const bcy = this.pos.y + GRID_SIZE / 2;

    // Check if any spawnArea tiles exist within spawnRadius
    let hasLocalSpawnArea = false;
    const localSpawnAreaTiles: { x: number; y: number }[] = [];
    if (state.world.hasSpawnArea && state.world.hasSpawnArea()) {
      const minGx = floor((bcx - spawnRadius) / GRID_SIZE);
      const maxGx = floor((bcx + spawnRadius) / GRID_SIZE);
      const minGy = floor((bcy - spawnRadius) / GRID_SIZE);
      const maxGy = floor((bcy + spawnRadius) / GRID_SIZE);
      for (let gx = minGx; gx <= maxGx; gx++) {
        for (let gy = minGy; gy <= maxGy; gy++) {
          const tx = gx * GRID_SIZE + GRID_SIZE / 2;
          const ty = gy * GRID_SIZE + GRID_SIZE / 2;
          const dSq = (tx - bcx) ** 2 + (ty - bcy) ** 2;
          if (dSq <= spawnRadius * spawnRadius && state.world.isSpawnAreaAt(tx, ty)) {
            localSpawnAreaTiles.push({ x: tx, y: ty });
          }
        }
      }
      if (localSpawnAreaTiles.length > 0) {
        hasLocalSpawnArea = true;
      }
    }

    let attempts = 15;
    while (attempts > 0) {
      attempts--;
      let sx: number, sy: number;
      if (hasLocalSpawnArea) {
        const tile = localSpawnAreaTiles[floor(random(localSpawnAreaTiles.length))];
        sx = tile.x + random(-GRID_SIZE * 0.3, GRID_SIZE * 0.3);
        sy = tile.y + random(-GRID_SIZE * 0.3, GRID_SIZE * 0.3);
      } else {
        // Spawn normally in radius without proximity checks
        const ang = random(TWO_PI);
        const r = random(GRID_SIZE * 0.5, spawnRadius);
        sx = bcx + cos(ang) * r;
        sy = bcy + sin(ang) * r;
      }

      const isBlock = state.world.isBlockAt(sx, sy);
      if (isBlock && !isFlying) continue;

      const gx = floor(sx / GRID_SIZE);
      const gy = floor(sy / GRID_SIZE);
      const liqKey = state.world.getLiquidAt(gx, gy);
      if (liqKey && liquidTypes[liqKey]?.isDanger) continue;

      requestSpawn(sx, sy, eKey);
      state.vfx.push(new MuzzleFlash(bcx, bcy, atan2(sy - bcy, sx - bcx), 24, 8, color(180, 50, 255)));
      return true;
    }
    return false;
  }

  update() {
    // 1. Overlay-based Logic (Only if not mined and has overlay)
    if (!this.isMined && this.overlay) {
      const oCfg = overlayTypes[this.overlay];
      if (oCfg) {
        if (this.overlay === 'catalyst_clay' || oCfg?.catalystConfig) {
          const cCfg = oCfg.catalystConfig || (overlayTypes['catalyst_clay'] as any)?.catalystConfig;
          const matrix = cCfg?.neighborMatrix || [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
          ];
          const emptyNeighbors: [number, number][] = [];
          for (const [dx, dy] of matrix) {
            const nx = this.gx + dx;
            const ny = this.gy + dy;
            const targetBlk = state.world.getBlock(nx, ny);
            if (!targetBlk || targetBlk.isMined) {
              emptyNeighbors.push([nx, ny]);
            }
          }

          if (emptyNeighbors.length > 0) {
            if (this.catalystTimer === undefined) {
              this.catalystTimer = 0;
            }
            this.catalystTimer++;
            const interval = cCfg?.spawnInterval || 300;
            if (this.catalystTimer >= interval) {
              this.catalystTimer = 0;
              const chosen = emptyNeighbors[floor(random(emptyNeighbors.length))];
              const spawnObstacle = cCfg?.obstacleToSpawn || 'o_clay';
              state.world.setBlock(chosen[0], chosen[1], spawnObstacle);
              const cx = floor(chosen[0] / CHUNK_SIZE);
              const cy = floor(chosen[1] / CHUNK_SIZE);
              state.world.dirtyChunkAndNeighbors(cx, cy);
              state.vfx.push(new BlockDebris(chosen[0] * GRID_SIZE + GRID_SIZE/2, chosen[1] * GRID_SIZE + GRID_SIZE/2, [180, 100, 70]));
            }
          }
        }

        // Periodic hourly spawning (if configured with hourlySpawnConfig)
        if (oCfg.enemySpawnConfig || (this.customSpawnerConfig && !this.liquidType)) {
          const sCfg = this.customSpawnerConfig ? { ...oCfg.enemySpawnConfig, ...this.customSpawnerConfig } : oCfg.enemySpawnConfig;
          if (sCfg?.hourlySpawnConfig?.enabled) {
            this.updateEnemySpawnerLogic(sCfg, false);
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

              const bullet = Bullet.create(sx, sy, shotTx, shotTy, eCfg.bulletTypeKey, 'core', this);
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
    }

    // 2. Liquid / Ground Spawner Logic (Runs for blocks with liquid spawner, whether mined or unmined)
    if (this.liquidType && (liquidTypes[this.liquidType]?.enemySpawnConfig || this.customSpawnerConfig)) {
      const lCfg = liquidTypes[this.liquidType];
      const sCfg = this.customSpawnerConfig ? { ...lCfg?.enemySpawnConfig, ...this.customSpawnerConfig } : lCfg?.enemySpawnConfig;
      this.updateEnemySpawnerLogic(sCfg, true);
    }
  }

  updateEnemySpawnerLogic(sCfg: any, isLiquid: boolean) {
    if (!sCfg || sCfg.spawnInterval <= 0) return;

    if (this.lastSpawnTime === undefined) {
      this.lastSpawnTime = state.frames + floor(random(sCfg.spawnInterval || 60));
    }

    const isHourly = !!sCfg.hourlySpawnConfig?.enabled;

    if (isHourly) {
      const hCfg = sCfg.hourlySpawnConfig;
      const currentHourly = getCurrentLevelHourlyBudget();
      const mult = hCfg.hourlyBudgetMultiplier !== undefined ? hCfg.hourlyBudgetMultiplier : 1.0;
      const add = hCfg.hourlyBudgetAdd || 0;
      const hourlyRate = Math.max(0, currentHourly * mult + add);
      const budgetPerFrame = hourlyRate / HOUR_FRAMES;

      if (this.lastHourlyBudgetFrame === undefined) {
        this.lastHourlyBudgetFrame = state.frames;
      }
      const lastFrame = this.lastHourlyBudgetFrame ?? state.frames;
      const elapsed = Math.max(0, state.frames - lastFrame);
      this.lastHourlyBudgetFrame = state.frames;
      this.hourlySpawnBudgetAccrued = (this.hourlySpawnBudgetAccrued || 0) + budgetPerFrame * elapsed;

      if (this.totalBudgetSpawned === undefined) {
        this.totalBudgetSpawned = 0;
      }

      const dx = this.pos.x + GRID_SIZE/2 - state.player.pos.x;
      const dy = this.pos.y + GRID_SIZE/2 - state.player.pos.y;
      const dSq = dx*dx + dy*dy;
      const trigRad = sCfg.spawnTriggerRadius > 0 ? sCfg.spawnTriggerRadius : 200;

      if (sCfg.spawnTriggerRadius < 0 || dSq < trigRad * trigRad) {
        const minInterval = sCfg.spawnInterval > 0 ? sCfg.spawnInterval : 60;
        if (state.frames - this.lastSpawnTime >= minInterval) {
          const eTypes = (sCfg.enemyTypeKey && sCfg.enemyTypeKey.length > 0) ? sCfg.enemyTypeKey : ['e_basic'];
          const affordable = eTypes.filter((k: string) => enemyTypes[k] && enemyTypes[k].cost <= (this.hourlySpawnBudgetAccrued || 0));
          if (affordable.length > 0) {
            const eKey = affordable[floor(random(affordable.length))];
            const eCfg = enemyTypes[eKey];
            if (eCfg) {
              const success = this.spawnEnemyFromSpawner(eKey, sCfg);
              if (success) {
                this.hourlySpawnBudgetAccrued = Math.max(0, (this.hourlySpawnBudgetAccrued || 0) - eCfg.cost);
                this.totalBudgetSpawned = (this.totalBudgetSpawned || 0) + eCfg.cost;
                this.lastSpawnTime = state.frames;

                // Check self-destruct threshold
                if (hCfg && hCfg.selfDestructAfterBudgetSpawned !== undefined && hCfg.selfDestructAfterBudgetSpawned > 0 && (this.totalBudgetSpawned || 0) >= hCfg.selfDestructAfterBudgetSpawned) {
                  const cx = floor(this.gx / CHUNK_SIZE);
                  const cy = floor(this.gy / CHUNK_SIZE);
                  if (isLiquid) {
                    this.liquidType = null;
                  } else {
                    this.overlay = null;
                  }
                  this.customSpawnerConfig = null;
                  state.world.dirtyChunkAndNeighbors(cx, cy);
                  state.vfx.push(new Explosion(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, 35));
                  state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, isLiquid ? [140, 30, 180] : [180, 50, 180]));
                  return;
                }
              }
            }
          }
        }
      }
    } else {
      // Standard fixed budget mode
      if (this.spawnerBudget === undefined) {
        this.spawnerBudget = sCfg.budget !== undefined ? sCfg.budget : 60;
      }
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
            const success = this.spawnEnemyFromSpawner(eKey, sCfg);
            if (success) {
              if (sCfg.spawnIntervalConsumeBudget) this.spawnerBudget -= eCfg.cost;
              this.lastSpawnTime = state.frames;
            }
          }
        }
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
        const isSpawnerLiquid = this.liquidType === 'l_spawner' || this.liquidType.startsWith('l_spawner') || !!lCfg.isEnemySpawner || !!lCfg.enemySpawnConfig;
        if (isSpawnerLiquid) {
          const assetKey = lCfg.assetImgConfig?.idleAssetImg?.[0] || 'img_ground_spawner_a';
          if (assetKey && state.assets[assetKey]) {
            push();
            tint(255, opacity * 0.5);
            imageMode(CENTER);
            image(state.assets[assetKey], GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
            noTint();
            pop();
          }
        } else {
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
          if (lCfg.assetImgConfig?.idleAssetImg?.[0] && state.assets[lCfg.assetImgConfig.idleAssetImg[0]]) {
            imageMode(CENTER);
            image(state.assets[lCfg.assetImgConfig.idleAssetImg[0]], GRID_SIZE / 2, GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
          }
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
    }

    if (!this.isMined) {
      const n = state.world.canConnectTo(this.pos.x, this.pos.y - GRID_SIZE, this.config);
      const s = state.world.canConnectTo(this.pos.x, this.pos.y + GRID_SIZE, this.config);
      const w = state.world.canConnectTo(this.pos.x - GRID_SIZE, this.pos.y, this.config);
      const e = state.world.canConnectTo(this.pos.x + GRID_SIZE, this.pos.y, this.config);
      const isExposed = !n || !s || !w || !e;
      const rad = 8;
      
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
        rect(0, 0, renderSize+1, renderSize+1, tl, tr, br, bl);

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

    if (this.overlay === 'sunGenerator' && !this.isMined) {
      const cfg = this.sunGeneratorConfig || { damagePerSun: 600, maxSun: 100, accumulatedDamage: 0, sunsDropped: 0 };
      const dmgInCycle = cfg.accumulatedDamage % cfg.damagePerSun;
      const dmgLeft = cfg.damagePerSun - dmgInCycle;
      const ratio = constrain(dmgLeft / cfg.damagePerSun, 0, 1);

      fill(20, opacity * 0.85); noStroke(); rect(4, GRID_SIZE - 8, GRID_SIZE - 8, 4, 2);
      fill(255, 215, 0, opacity); rect(4, GRID_SIZE - 8, ratio * (GRID_SIZE - 8), 4, 2);

      if (state.debugHP && isExposed) {
        fill(255, 230, 100, opacity); textAlign(CENTER, CENTER); textSize(8.5); noStroke();
        text(`${floor(dmgLeft)}`, GRID_SIZE/2, GRID_SIZE/2);
      }
      pop();
      return;
    }

    const oCfg = this.overlay ? overlayTypes[this.overlay] : null;
    if ((this.overlay === 'catalyst_clay' || oCfg?.catalystConfig) && !this.isMined && (state.debugHP || state.currentScreen === 'level_editor')) {
      const cCfg = oCfg?.catalystConfig || (overlayTypes['catalyst_clay'] as any)?.catalystConfig;
      const matrix = cCfg?.neighborMatrix || [
        [-1, -1], [0, -1], [1, -1],
        [-1,  0],          [1,  0],
        [-1,  1], [0,  1], [1,  1]
      ];
      for (const [dx, dy] of matrix) {
        const nx = dx * GRID_SIZE;
        const ny = dy * GRID_SIZE;
        const targetBlk = state.world.getBlock(this.gx + dx, this.gy + dy);
        const isEmpty = !targetBlk || targetBlk.isMined;
        if (isEmpty) {
          stroke(80, 255, 120, opacity * 0.7);
          strokeWeight(1);
          noFill();
          rect(nx + 2, ny + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        } else {
          stroke(255, 100, 100, opacity * 0.4);
          strokeWeight(1);
          noFill();
          rect(nx + 2, ny + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        }
      }
    }

    if (this.isWinCondition && !this.isMined) {
      push();
      translate(GRID_SIZE / 2, GRID_SIZE / 2);
      noFill();
      stroke(255, 215, 0, 180 + 30 * sin(state.frames * 0.05));
      strokeWeight(2.5);
      ellipse(0, 0, GRID_SIZE * 0.85 + 2 * sin(state.frames * 0.05));
      fill(255, 215, 0, 220);
      noStroke();
      triangle(-3, -6, 6, -2, -3, 2);
      stroke(255, 215, 0, 240);
      strokeWeight(1.5);
      line(-3, -6, -3, 7);
      pop();
    }

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
    const oCfg = this.overlay ? overlayTypes[this.overlay] : null;
    if (oCfg?.isIndestructible) return false;

    if (this.overlay === 'sunGenerator') {
      if (!this.sunGeneratorConfig) {
        const sgCfg = overlayTypes['sunGenerator'];
        this.sunGeneratorConfig = {
          damagePerSun: sgCfg?.damagePerSun || 600,
          maxSun: sgCfg?.maxSunDropped || 100,
          accumulatedDamage: 0,
          sunsDropped: 0
        };
      }
      const cfg = this.sunGeneratorConfig;
      if (cfg.sunsDropped >= cfg.maxSun) {
        this.isMined = true;
        state.world.dirtyBlock(this.gx, this.gy);
        return true;
      }

      this.damageGlow = 180;
      state.vfx.push(new BlockHitVFX(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2));

      const prevDrops = Math.floor(cfg.accumulatedDamage / cfg.damagePerSun);
      cfg.accumulatedDamage += dmg;
      const newDrops = Math.floor(cfg.accumulatedDamage / cfg.damagePerSun);
      const toDrop = Math.min(newDrops - prevDrops, cfg.maxSun - cfg.sunsDropped);

      if (toDrop > 0) {
        cfg.sunsDropped += toDrop;
        for (let i = 0; i < toDrop; i++) {
          spawnLootAt(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, 'sun');
          if (source && source.onTargetMined) {
            source.onTargetMined(this, { typeName: 'sunGenerator', sunsDropped: 1 });
          }
        }
        state.needsTargetReScan = true;
        if (state.player?.target === this) {
          state.player.target = null;
        }
        if (state.player?.attachments) {
          for (const att of state.player.attachments) {
            if (att.target === this) att.target = null;
          }
        }
        if (state.world) {
          for (const wt of state.world.getAllTurrets()) {
            if (wt.target === this) wt.target = null;
          }
        }
      }

      if (cfg.sunsDropped >= cfg.maxSun) {
        this.isMined = true;
        state.world.dirtyBlock(this.gx, this.gy);
        flowField.markDirty();
        state.needsTargetReScan = true;
        state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, [255, 215, 0]));
      }

      if (source) {
        triggerUpgradeHook('onMine', source, { target: this, targetType: 'block', typeName: 'sunGenerator' });
      }
      return true;
    }

    this.health -= dmg; this.damageGlow = 180;
    state.vfx.push(new BlockHitVFX(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2));

    // --- Damage-based Spawning for Overlay Spawners (ov_spawner) ---
    if (this.overlay && (this.overlay.startsWith('ov_spawner') || oCfg?.enemySpawnConfig || this.customSpawnerConfig)) {
      const sCfg = this.customSpawnerConfig ? { ...oCfg?.enemySpawnConfig, ...this.customSpawnerConfig } : oCfg?.enemySpawnConfig;
      if (sCfg) {
        if (this.initialCachedSpawnCount === 0 && (!this.cachedSpawnList || this.cachedSpawnList.length === 0)) {
          this.initCachedSpawnList(sCfg);
        }
        if (this.initialCachedSpawnCount > 0 && this.cachedSpawnList && this.cachedSpawnList.length > 0) {
          const dmgRatio = Math.min(1.0, Math.max(0.0, (this.maxHealth - this.health) / this.maxHealth));
          const targetSpawnCount = Math.floor(dmgRatio * this.initialCachedSpawnCount);
          while (this.enemiesSpawnedFromDamage < targetSpawnCount && this.cachedSpawnList.length > 0) {
            const nextEnemy = this.cachedSpawnList.shift()!;
            this.enemiesSpawnedFromDamage++;
            this.spawnEnemyFromSpawner(nextEnemy, sCfg);
          }
        }
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isMined = true;
      soundEngine.playSFXGroup('block_death');
      
      // Trigger Hooks
      if (source) {
        triggerUpgradeHook('onMine', source, { target: this, targetType: 'block', typeName: this.overlay || this.type });
        if (source.onTargetMined) {
          source.onTargetMined(this, { target: this, targetType: 'block', typeName: this.overlay || this.type, blockKilled: true });
        }
      }

      state.world.dirtyBlock(this.gx, this.gy);
      state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.config.color));
      
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

        // --- Spawn all remaining cached enemies on death for Spawners ---
        if ((oCfg.enemySpawnConfig || this.customSpawnerConfig) && this.cachedSpawnList) {
          const sCfg = this.customSpawnerConfig ? { ...oCfg.enemySpawnConfig, ...this.customSpawnerConfig } : oCfg.enemySpawnConfig;
          if (sCfg) {
            while (this.cachedSpawnList.length > 0) {
              const nextEnemy = this.cachedSpawnList.shift()!;
              this.enemiesSpawnedFromDamage++;
              this.spawnEnemyFromSpawner(nextEnemy, sCfg);
            }
          }
        }

        if (oCfg.bulletToSpawnOnDeath) {
          const wPos = createVector(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2);
          for (const bKey of oCfg.bulletToSpawnOnDeath) {
            let b = Bullet.create(wPos.x, wPos.y, wPos.x, wPos.y, bKey, 'none');
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

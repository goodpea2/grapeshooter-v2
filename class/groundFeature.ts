
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { enemyTypes } from '../balanceEnemies';
import { FirePuddleVFX, StunGasVFX, PoisonGasVFX, ForcefieldVFX, BugSplatVFX, spawnBugSplatVFX3, spawnBugSplatMeatChunkVFX, MuzzleFlash } from '../vfx';
import { requestSpawn, requestFlungSpawn } from '../lvDemo';

declare const createVector: any;
declare const dist: any;
declare const floor: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const TWO_PI: any;
declare const color: any;
declare const push: any;
declare const pop: any;
declare const imageMode: any;
declare const image: any;
declare const CENTER: any;

export class GroundFeature {
  pos: any;
  config: any;
  life: number;
  typeKey: string;
  vfx: any;
  spawnerBudget: number = 0;
  lastSpawnTime: number = 0;
  customSpawnerConfig?: any;

  constructor(x: number, y: number, typeKey: string) {
    this.typeKey = typeKey;
    this.config = groundFeatureTypes[typeKey] || {};
    this.pos = createVector(x, y);
    this.life = this.config.life !== undefined ? this.config.life : 60;
    
    if (this.config.enemySpawnConfig) {
      this.spawnerBudget = this.config.enemySpawnConfig.budget || 60;
    }

    if (this.config.vfxType === 'fire_puddle') this.vfx = new FirePuddleVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'stun_gas') this.vfx = new StunGasVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'poison_gas') this.vfx = new PoisonGasVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'forcefield') this.vfx = new ForcefieldVFX(x, y, this.config.radius, this.config.life);
  }

  update() {
    if (this.life !== Infinity) {
      this.life--;
    }
    if (this.vfx) this.vfx.update();

    // Spawner logic
    if (this.config.enemySpawnConfig || this.customSpawnerConfig) {
      const sCfg = this.customSpawnerConfig ? { ...this.config.enemySpawnConfig, ...this.customSpawnerConfig } : this.config.enemySpawnConfig;
      if (sCfg && sCfg.spawnInterval > 0) {
        const dx = this.pos.x - state.player.pos.x;
        const dy = this.pos.y - state.player.pos.y;
        const dSq = dx * dx + dy * dy;
        const trigRad = sCfg.spawnTriggerRadius > 0 ? sCfg.spawnTriggerRadius : 200;
        
        if (sCfg.spawnTriggerRadius < 0 || dSq < trigRad * trigRad) {
          if (state.frames - this.lastSpawnTime >= sCfg.spawnInterval) {
            const eTypes = (sCfg.enemyTypeKey && sCfg.enemyTypeKey.length > 0) ? sCfg.enemyTypeKey : ['e_basic'];
            const affordable = eTypes.filter((k: string) => enemyTypes[k] && (!sCfg.spawnIntervalConsumeBudget || enemyTypes[k].cost <= this.spawnerBudget));
            
            if (affordable.length === 0 && sCfg.spawnIntervalConsumeBudget && this.spawnerBudget <= 0) {
              // Spawner ran out of budget
              this.life = 0;
              state.vfx.push(spawnBugSplatVFX3(this.pos.x, this.pos.y, 45, [180, 50, 220]));
              state.vfx.push(spawnBugSplatMeatChunkVFX(this.pos.x, this.pos.y, 40, [180, 50, 220], false));
              return;
            }

            if (affordable.length > 0) {
              const eKey = affordable[floor(random(affordable.length))];
              const eCfg = enemyTypes[eKey];
              if (eCfg) {
                let spawned = false;
                let attempts = 10;
                while (attempts > 0 && !spawned) {
                  attempts--;
                  const ang = random(TWO_PI);
                  const r = random(GRID_SIZE, sCfg.spawnRadius || 120);
                  const sx = this.pos.x + cos(ang) * r;
                  const sy = this.pos.y + sin(ang) * r;
                  
                  if (state.world && state.world.hasSpawnArea() && !state.world.isSpawnAreaAt(sx, sy)) {
                    continue;
                  }
                  if (!state.world || !state.world.checkCollision(sx, sy, eCfg.size / 2.2)) {
                    requestFlungSpawn(this.pos.x, this.pos.y, sx, sy, eKey);
                    if (sCfg.spawnIntervalConsumeBudget) {
                      this.spawnerBudget -= eCfg.cost;
                    }
                    this.lastSpawnTime = state.frames;
                    spawned = true;
                    state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, ang, 30, 10, color(180, 50, 255)));
                  }
                }

                if (sCfg.spawnIntervalConsumeBudget && this.spawnerBudget <= 0) {
                  this.life = 0;
                  state.vfx.push(spawnBugSplatVFX3(this.pos.x, this.pos.y, 45, [180, 50, 220]));
                  state.vfx.push(spawnBugSplatMeatChunkVFX(this.pos.x, this.pos.y, 40, [180, 50, 220], false));
                  return;
                }
              }
            }
          }
        }
      }
    }

    // Specific Forcefield Repulsion Logic
    if (this.typeKey === 'gf_forcefield') {
       const dx = state.player.pos.x - this.pos.x;
       const dy = state.player.pos.y - this.pos.y;
       const dSq = dx*dx + dy*dy;
       const rSum = state.player.size / 2 + this.config.radius;
       if (dSq < rSum * rSum) {
         const d = Math.sqrt(dSq);
         const pushForce = (rSum - d) * 0.5;
         state.player.pos.x += (dx / d) * pushForce;
         state.player.pos.y += (dy / d) * pushForce;
       }
    }

    
    // Non-fire ground features handle their own individual tick rates
    if (!this.typeKey.startsWith('gf_fire') && this.config.tickRate && this.life % this.config.tickRate === 0) {
      const cfg = this.config;
      const dmgCfg = cfg.damageConfig;
      const targets = cfg.damageTargets || ['enemy', 'obstacle'];

      const enemyDmg = dmgCfg ? (dmgCfg.enemy ?? dmgCfg.Enemy ?? 0) : (targets.includes('enemy') ? (cfg.damage || 0) : 0);
      const playerDmg = dmgCfg ? (dmgCfg.player ?? dmgCfg.Player ?? 0) : (targets.includes('player') ? (cfg.damage || 0) : 0);
      const turretDmg = dmgCfg ? (dmgCfg.turret ?? dmgCfg.Turret ?? 0) : (targets.includes('turret') ? (cfg.damage || 0) : 0);
      const obstacleDmg = dmgCfg ? (dmgCfg.obstacle ?? dmgCfg.Obstacle ?? 0) : (targets.includes('obstacle') ? (cfg.damage || 0) : 0);
      
      if (enemyDmg > 0 || cfg.appliedCondition) {
        for (let e of state.enemies) {
          if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < cfg.radius + e.size/2) {
            const cond = cfg.appliedCondition;
            if (cond && e.applyCondition) {
               if (typeof cond === 'string') {
                 e.applyCondition(cond, 60);
               } else {
                 for (const c of cond) e.applyCondition(c.type, c.duration || 60, c);
               }
            }
            if (enemyDmg > 0) e.takeDamage(enemyDmg, { type: 'groundFeature', key: this.typeKey });
          }
        }
      }

      if (playerDmg > 0 && state.player && state.player.health > 0) {
        if (dist(this.pos.x, this.pos.y, state.player.pos.x, state.player.pos.y) < cfg.radius + state.player.size/2) {
          state.player.takeDamage(playerDmg, { type: 'groundFeature', key: this.typeKey });
        }
      }

      if (turretDmg > 0) {
        for (let a of state.player.attachments) {
          if (a.health > 0) {
            const awPos = a.getWorldPos();
            if (dist(this.pos.x, this.pos.y, awPos.x, awPos.y) < cfg.radius + a.size/2) {
              a.takeDamage(turretDmg);
            }
          }
        }
        if (state.world) {
          for (let wt of state.world.getAllTurrets()) {
            if (wt.health > 0) {
              const wPos = wt.getWorldPos();
              if (dist(this.pos.x, this.pos.y, wPos.x, wPos.y) < cfg.radius + wt.size/2) {
                wt.takeDamage(turretDmg);
              }
            }
          }
        }
      }

      if (obstacleDmg > 0 && state.world) {
        let gxStart = floor((this.pos.x - cfg.radius) / GRID_SIZE);
        let gxEnd = floor((this.pos.x + cfg.radius) / GRID_SIZE);
        let gyStart = floor((this.pos.y - cfg.radius) / GRID_SIZE);
        let gyEnd = floor((this.pos.y + cfg.radius) / GRID_SIZE);
        for (let gx = gxStart; gx <= gxEnd; gx++) {
          for (let gy = gyStart; gy <= gyEnd; gy++) {
            let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
            let chunk = state.world.getChunk(cx, cy);
            let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
            if (block) {
              let bx = block.pos.x + GRID_SIZE/2; let by = block.pos.y + GRID_SIZE/2;
              if (dist(this.pos.x, this.pos.y, bx, by) < cfg.radius + GRID_SIZE/2) {
                block.takeDamage(obstacleDmg);
              }
            }
          }
        }
      }
    }
  }

  display() {
    if (this.config.assetImgConfig) {
      const pool = this.config.assetImgConfig.idleAssetImg;
      const sprite = state.assets[pool[0]];
      if (sprite) {
        push();
        imageMode(CENTER);
        const rSize = (this.config.radius || 34) * 2;
        image(sprite, this.pos.x, this.pos.y, rSize, rSize);
        pop();
      }
    }
    if (this.vfx) this.vfx.display();
  }

  /**
   * Static resolver for fire-based ground features (prefix 'gf_fire').
   * Guarantees entities within overlapping fire puddles receive non-stacking damage
   * and the strongest applied burning condition, strictly on a 15-frame tickRate.
   */
  static resolveFireGroundFeatures() {
    if (state.frames % 15 !== 0) return;
    const fireFeatures: GroundFeature[] = [];
    for (let i = 0; i < state.groundFeatures.length; i++) {
      const gf = state.groundFeatures[i];
      if (gf.life > 0 && gf.typeKey.startsWith('gf_fire')) {
        fireFeatures.push(gf);
      }
    }
    if (fireFeatures.length === 0) return;

    // 1. Resolve Enemies
    for (let e of state.enemies) {
      if (e.health <= 0 || e.isDying) continue;
      let maxDmg = 0;
      let bestCond: any = null;
      let highestCondDmg = -1;
      let hitSourceKey = 'gf_fire';

      for (let gf of fireFeatures) {
        const rad = gf.config.radius + e.size / 2;
        const dSq = (gf.pos.x - e.pos.x) ** 2 + (gf.pos.y - e.pos.y) ** 2;
        if (dSq < rad * rad) {
          const dmg = gf.config.damageConfig?.enemy ?? gf.config.damageConfig?.Enemy ?? 0;
          if (dmg > maxDmg) {
            maxDmg = dmg;
            hitSourceKey = gf.typeKey;
          }
          const conds = gf.config.appliedCondition;
          if (conds) {
            if (typeof conds === 'string') {
              if (highestCondDmg < 0) {
                highestCondDmg = 0;
                bestCond = { type: conds, duration: 60, damage: 0 };
              }
            } else {
              for (const c of conds) {
                const cDmg = c.damageConfig ? (c.damageConfig.enemy ?? c.damageConfig.Enemy ?? 0) : (c.damage ?? 0);
                if (cDmg > highestCondDmg || (cDmg === highestCondDmg && (c.duration || 0) > (bestCond?.duration || 0))) {
                  highestCondDmg = cDmg;
                  bestCond = c;
                }
              }
            }
          }
        }
      }

      if (maxDmg > 0) {
        e.takeDamage(maxDmg, { type: 'groundFeature', key: hitSourceKey });
      }
      if (bestCond && e.applyCondition) {
        e.applyCondition(bestCond.type, bestCond.duration || 60, bestCond);
      }
    }

    // 2. Resolve Player (Friendly fire supported if damageConfig.player > 0)
    if (state.player && state.player.health > 0) {
      let maxDmg = 0;
      let bestCond: any = null;
      let highestCondDmg = -1;
      let hitSourceKey = 'gf_fire';

      for (let gf of fireFeatures) {
        const rad = gf.config.radius + state.player.size / 2;
        const dSq = (gf.pos.x - state.player.pos.x) ** 2 + (gf.pos.y - state.player.pos.y) ** 2;
        if (dSq < rad * rad) {
          const dmg = gf.config.damageConfig?.player ?? gf.config.damageConfig?.Player ?? 0;
          if (dmg > maxDmg) {
            maxDmg = dmg;
            hitSourceKey = gf.typeKey;
          }
          const conds = gf.config.appliedCondition;
          if (conds) {
            if (typeof conds === 'string') {
              if (highestCondDmg < 0) {
                highestCondDmg = 0;
                bestCond = { type: conds, duration: 60, damage: 0 };
              }
            } else {
              for (const c of conds) {
                const cDmg = c.damageConfig ? (c.damageConfig.player ?? c.damageConfig.Player ?? 0) : (c.damage ?? 0);
                if (cDmg > highestCondDmg || (cDmg === highestCondDmg && (c.duration || 0) > (bestCond?.duration || 0))) {
                  highestCondDmg = cDmg;
                  bestCond = c;
                }
              }
            }
          }
        }
      }

      if (maxDmg > 0) {
        state.player.takeDamage(maxDmg, { type: 'groundFeature', key: hitSourceKey });
      }
      if (bestCond && state.player.applyCondition) {
        state.player.applyCondition(bestCond.type, bestCond.duration || 60, bestCond);
      }
    }

    // 3. Resolve Turrets (Attached & World)
    const allTurrets: any[] = [...state.player.attachments];
    if (state.world) {
      allTurrets.push(...state.world.getAllTurrets());
    }

    for (let t of allTurrets) {
      if (t.health <= 0) continue;
      const tPos = t.getWorldPos ? t.getWorldPos() : t.pos;
      if (!tPos) continue;
      let maxDmg = 0;
      let bestCond: any = null;
      let highestCondDmg = -1;

      for (let gf of fireFeatures) {
        const rad = gf.config.radius + (t.size || 24) / 2;
        const dSq = (gf.pos.x - tPos.x) ** 2 + (gf.pos.y - tPos.y) ** 2;
        if (dSq < rad * rad) {
          const dmg = gf.config.damageConfig?.turret ?? gf.config.damageConfig?.Turret ?? 0;
          if (dmg > maxDmg) maxDmg = dmg;
          const conds = gf.config.appliedCondition;
          if (conds) {
            if (typeof conds === 'string') {
              if (highestCondDmg < 0) {
                highestCondDmg = 0;
                bestCond = { type: conds, duration: 60, damage: 0 };
              }
            } else {
              for (const c of conds) {
                const cDmg = c.damageConfig ? (c.damageConfig.turret ?? c.damageConfig.Turret ?? 0) : (c.damage ?? 0);
                if (cDmg > highestCondDmg || (cDmg === highestCondDmg && (c.duration || 0) > (bestCond?.duration || 0))) {
                  highestCondDmg = cDmg;
                  bestCond = c;
                }
              }
            }
          }
        }
      }

      if (maxDmg > 0) {
        t.takeDamage(maxDmg);
      }
      if (bestCond && t.applyCondition) {
        t.applyCondition(bestCond.type, bestCond.duration || 60, bestCond);
      }
    }

    // 4. Resolve Obstacle Blocks
    if (state.world) {
      const blockDamageMap = new Map<any, number>();
      for (let gf of fireFeatures) {
        const obsDmg = gf.config.damageConfig?.obstacle ?? gf.config.damageConfig?.Obstacle ?? 0;
        if (obsDmg <= 0) continue;

        let gxStart = floor((gf.pos.x - gf.config.radius) / GRID_SIZE);
        let gxEnd = floor((gf.pos.x + gf.config.radius) / GRID_SIZE);
        let gyStart = floor((gf.pos.y - gf.config.radius) / GRID_SIZE);
        let gyEnd = floor((gf.pos.y + gf.config.radius) / GRID_SIZE);

        for (let gx = gxStart; gx <= gxEnd; gx++) {
          for (let gy = gyStart; gy <= gyEnd; gy++) {
            let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
            let chunk = state.world.getChunk(cx, cy);
            let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
            if (block) {
              let bx = block.pos.x + GRID_SIZE / 2;
              let by = block.pos.y + GRID_SIZE / 2;
              const rad = gf.config.radius + GRID_SIZE / 2;
              const dSq = (gf.pos.x - bx) ** 2 + (gf.pos.y - by) ** 2;
              if (dSq < rad * rad) {
                const current = blockDamageMap.get(block) || 0;
                if (obsDmg > current) {
                  blockDamageMap.set(block, obsDmg);
                }
              }
            }
          }
        }
      }

      for (const [block, dmg] of blockDamageMap.entries()) {
        if (dmg > 0 && !block.isMined) {
          block.takeDamage(dmg);
        }
      }
    }
  }
}

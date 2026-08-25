
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { enemyTypes } from '../balanceEnemies';
import { FirePuddleVFX, StunGasVFX, PoisonGasVFX, ForcefieldVFX, BugSplatVFX, MuzzleFlash } from '../vfx';
import { requestSpawn } from '../lvDemo';

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
              state.vfx.push(new BugSplatVFX(this.pos.x, this.pos.y, 40, [180, 50, 220]));
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
                    requestSpawn(sx, sy, eKey);
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
                  state.vfx.push(new BugSplatVFX(this.pos.x, this.pos.y, 40, [180, 50, 220]));
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

    if (this.config.tickRate && this.life % this.config.tickRate === 0) {
      const targets = this.config.damageTargets || ['enemy', 'obstacle']; // Default targets
      
      if (targets.includes('enemy')) {
        for (let e of state.enemies) {
          if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < this.config.radius + e.size/2) {
            const cond = this.config.appliedCondition;
            if (cond && e.applyCondition) {
               if (typeof cond === 'string') {
                 e.applyCondition(cond, this.config.conditionDuration || 60);
               } else {
                 for (const c of cond) e.applyCondition(c.type, c.duration, c);
               }
            }
            if (this.config.damage > 0) e.takeDamage(this.config.damage);
          }
        }
      }

      if (targets.includes('player')) {
        if (state.player && state.player.health > 0) {
          if (dist(this.pos.x, this.pos.y, state.player.pos.x, state.player.pos.y) < this.config.radius + state.player.size/2) {
            if (this.config.damage > 0) state.player.takeDamage(this.config.damage);
          }
        }
      }

      if (targets.includes('turret')) {
        for (let a of state.player.attachments) {
          if (a.health > 0) {
            const awPos = a.getWorldPos();
            if (dist(this.pos.x, this.pos.y, awPos.x, awPos.y) < this.config.radius + a.size/2) {
              if (this.config.damage > 0) a.takeDamage(this.config.damage);
            }
          }
        }
      }

      if (targets.includes('obstacle') && state.world) {
        let gxStart = floor((this.pos.x - this.config.radius) / GRID_SIZE);
        let gxEnd = floor((this.pos.x + this.config.radius) / GRID_SIZE);
        let gyStart = floor((this.pos.y - this.config.radius) / GRID_SIZE);
        let gyEnd = floor((this.pos.y + this.config.radius) / GRID_SIZE);
        for (let gx = gxStart; gx <= gxEnd; gx++) {
          for (let gy = gyStart; gy <= gyEnd; gy++) {
            let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
            let chunk = state.world.getChunk(cx, cy);
            let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
            if (block) {
              let bx = block.pos.x + GRID_SIZE/2; let by = block.pos.y + GRID_SIZE/2;
              if (dist(this.pos.x, this.pos.y, bx, by) < this.config.radius + GRID_SIZE/2) {
                if (this.config.damage > 0) block.takeDamage(this.config.damage);
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
}

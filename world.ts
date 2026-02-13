
import { state } from './state';
import { 
  GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, LEVEL_THRESHOLDS, LEVEL_BUDGET, WORLD_GEN_STATS, CHUNK_GEN_RADIUS
} from './constants';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from './balanceObstacles';
import { liquidTypes, LIQUID_WEIGHTS, LIQUID_KEYS } from './balanceLiquids';
// Fixed: Added BlockDebris to imports to avoid using 'require'
import { MuzzleFlash, BlockDebris } from './vfx';
import { Enemy, Bullet } from './entities';
import { spawnLootAt, ECONOMY_CONFIG } from './economy';
import { worldGenConfig } from './lvDemo';
import { drawOverlay } from './visualObstacles';
import { enemyTypes } from './balanceEnemies';
import { drawDecoration } from './visualDecoration';

declare const createVector: any;
declare const dist: any;
declare const floor: any;
// Fixed: Added missing declarations
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
declare const text: any;
declare const arc: any;
declare const HALF_PI: any;
declare const PI: any;
declare const TWO_PI: any;
declare const atan2: any;
declare const width: any;
declare const height: any;

export class Block {
  gx: number; gy: number; pos: any; type: string; config: any; overlay: string | null;
  isMined: boolean = false; damageGlow: number = 0; health: number; maxHealth: number;
  biome: number = 0; feature: string | null = null;
  sunBits: { x: number, y: number, s: number }[] = [];
  liquidType: string | null = null;
  lastSniperShot: number = 0;
  lastSpawnTime: number = 0;
  spawnerBudget: number = 0;

  constructor(gx: number, gy: number, typeKey = 'o_dirt', overlay: string | null = null, biome: number = 0, liquidType: string | null = null) {
    this.gx = gx; this.gy = gy;
    this.pos = createVector(gx * GRID_SIZE, gy * GRID_SIZE);
    this.type = typeKey;
    this.config = obstacleTypes[typeKey] || obstacleTypes['o_dirt'];
    this.overlay = overlay;
    this.health = this.config.health;
    this.maxHealth = this.health;
    this.biome = biome;
    this.liquidType = liquidType;

    if (this.overlay && overlayTypes[this.overlay]) {
      const oCfg = overlayTypes[this.overlay];
      if (oCfg.minHealth > 0 && oCfg.minHealth > this.health) {
        this.health = oCfg.minHealth;
        this.maxHealth = this.health;
      }
      if (oCfg.enemySpawnConfig) {
        this.spawnerBudget = oCfg.enemySpawnConfig.budget;
        this.lastSpawnTime = frameCount + floor(random(oCfg.enemySpawnConfig.spawnInterval));
      }
    }

    let fn = noise((gx + worldGenConfig.noiseOffsetBlocks) * 0.8, (gy + worldGenConfig.noiseOffsetBlocks) * 0.8, 123);
    if (fn > 0.8) this.feature = 'moss';
    else if (fn > 0.72 && biome < 3) this.feature = 'flower';
    else if (fn > 0.75) this.feature = 'crystal';
    else if (fn > 0.72) this.feature = 'rubble';

    if (this.overlay && this.overlay.startsWith('sun')) {
      this.initSunBits(this.overlay);
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
    if (!oCfg || !oCfg.enemySpawnConfig) return;

    const sCfg = oCfg.enemySpawnConfig;
    if (sCfg.spawnInterval <= 0) return;

    const dx = this.pos.x + GRID_SIZE/2 - state.player.pos.x;
    const dy = this.pos.y + GRID_SIZE/2 - state.player.pos.y;
    const dSq = dx*dx + dy*dy;
    if (dSq < sCfg.spawnTriggerRadius * sCfg.spawnTriggerRadius) {
      if (frameCount - this.lastSpawnTime >= sCfg.spawnInterval) {
        const eKey = sCfg.enemyTypeKey[floor(random(sCfg.enemyTypeKey.length))];
        const eCfg = enemyTypes[eKey];
        if (!sCfg.spawnIntervalConsumeBudget || this.spawnerBudget >= eCfg.cost) {
          const ang = random(TWO_PI);
          const r = random(GRID_SIZE, sCfg.spawnRadius);
          const sx = this.pos.x + GRID_SIZE/2 + cos(ang) * r;
          const sy = this.pos.y + GRID_SIZE/2 + sin(ang) * r;
          
          if (!state.world.checkCollision(sx, sy, eCfg.size/2.2)) {
            state.enemies.push(new Enemy(sx, sy, eKey));
            if (sCfg.spawnIntervalConsumeBudget) this.spawnerBudget -= eCfg.cost;
            this.lastSpawnTime = frameCount;
          }
        }
      }
    }
  }

  display(distToPlayer: number) {
    let opacity = map(distToPlayer, VISIBILITY_RADIUS - 1, VISIBILITY_RADIUS, 255, 0);
    opacity = constrain(opacity, 0, 255);
    if (opacity <= 0) return;

    push(); translate(this.pos.x, this.pos.y);

    if (this.liquidType) {
      const lCfg = liquidTypes[this.liquidType];
      const pulse = 0.5 + 0.5 * sin(frameCount * lCfg.pulseSpeed + (this.gx + this.gy) * 0.5);
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

    if (!this.isMined) {
      const n = state.world.isBlockAt(this.pos.x, this.pos.y - GRID_SIZE);
      const s = state.world.isBlockAt(this.pos.x, this.pos.y + GRID_SIZE);
      const w = state.world.isBlockAt(this.pos.x - GRID_SIZE, this.pos.y);
      const e = state.world.isBlockAt(this.pos.x + GRID_SIZE, this.pos.y);
      const isExposed = !n || !s || !w || !e;
      const rad = 8;
      
      const oCfg = this.overlay ? overlayTypes[this.overlay] : null;

      if (this.overlay && !isExposed && oCfg?.concealedSparkleVfx) {
        let nVal = noise(this.gx * 0.5, this.gy * 0.5, frameCount * 0.02);
        if (nVal > 0.82) {
          const sparkleP = 0.5 + 0.5 * sin(frameCount * 0.2 + (this.gx + this.gy));
          noStroke();
          let sCol = [255, 255, 255];
          if (oCfg.concealedSparkleVfx === 'v_sparkle_yellow') sCol = [255, 255, 100];
          if (oCfg.concealedSparkleVfx === 'v_sparkle_purple') sCol = [200, 100, 255];
          fill(sCol[0], sCol[1], sCol[2], opacity * sparkleP * 0.8);
          ellipse(GRID_SIZE / 2 + sin(frameCount * 0.1) * 4, GRID_SIZE / 2 + cos(frameCount * 0.1) * 4, 6 * sparkleP);
        }
      }

      let base = [...this.config.color];
      let bord = [...this.config.borderColor];
      if (!isExposed) fill(base[0] * 0.3, base[1] * 0.3, base[2] * 0.3, opacity); else fill(base[0], base[1], base[2], opacity);
      noStroke();
      const tl = (n || w) ? 0 : rad; const tr = (n || e) ? 0 : rad; const br = (s || e) ? 0 : rad; const bl = (s || w) ? 0 : rad;
      rect(0, 0, GRID_SIZE, GRID_SIZE, tl, tr, br, bl);

      if (isExposed) {
        stroke(bord[0], bord[1], bord[2], opacity); strokeWeight(3); noFill();
        if (!n) line(tl, 0, GRID_SIZE - tr, 0); if (!s) line(bl, GRID_SIZE, GRID_SIZE - br, GRID_SIZE); if (!w) line(0, tl, 0, GRID_SIZE - bl); if (!e) line(GRID_SIZE, tr, GRID_SIZE, GRID_SIZE - br);
        if (!n && !w) arc(rad, rad, rad * 2, rad * 2, PI, PI + HALF_PI); if (!n && !e) arc(GRID_SIZE - rad, rad, rad * 2, rad * 2, PI + HALF_PI, TWO_PI); if (!s && !e) arc(GRID_SIZE - rad, GRID_SIZE - rad, rad * 2, rad * 2, 0, HALF_PI); if (!s && !w) arc(rad, GRID_SIZE - rad, rad * 2, rad * 2, HALF_PI, PI);
      }

      if (this.feature && isExposed) {
        drawDecoration(this.feature, this.gx, this.gy, opacity);
      }

      if (this.damageGlow > 0) {
        fill(255, 255, 255, this.damageGlow * opacity / 255); noStroke(); rect(0, 0, GRID_SIZE, GRID_SIZE, tl, tr, br, bl);
        this.damageGlow = lerp(this.damageGlow, 0, 0.12);
      }

      if (this.overlay && (isExposed || oCfg?.isConcealedAlongWithObstacle === false)) {
        drawOverlay(oCfg.obstacleOverlayVfx, this, opacity);
        
        if (oCfg.obstacleOverlayVfx === 'v_sniper_tower') {
          const eCfg = oCfg.enemyTurretConfig;
          const bcx = this.pos.x + GRID_SIZE/2;
          const bcy = this.pos.y + GRID_SIZE/2;
          const dx = bcx - state.player.pos.x;
          const dy = bcy - state.player.pos.y;
          const dSq = dx*dx + dy*dy;
          const canSee = eCfg.seeThroughObstacles || state.world.checkLOS(bcx, bcy, state.player.pos.x, state.player.pos.y);
          
          if (dSq < eCfg.shootRange*eCfg.shootRange && canSee) {
             const timeSinceLast = frameCount - this.lastSniperShot;
             const inCharge = timeSinceLast > (eCfg.shootFireRate - 45);
             if (timeSinceLast >= eCfg.shootFireRate) {
               state.enemyBullets.push(new Bullet(bcx, bcy, state.player.pos.x, state.player.pos.y, eCfg.bulletTypeKey, 'core'));
               state.vfx.push(new MuzzleFlash(bcx, bcy, atan2(state.player.pos.y - bcy, state.player.pos.x - bcx), 30, 8, color(255, 50, 50)));
               this.lastSniperShot = frameCount;
             }
             const laserAlpha = inCharge ? 180 + 75 * sin(frameCount * 0.5) : 50;
             const laserWeight = inCharge ? 2 : 1;
             stroke(255, 0, 0, laserAlpha * (opacity / 255)); strokeWeight(laserWeight); 
             line(GRID_SIZE/2, GRID_SIZE/2, state.player.pos.x - this.pos.x, state.player.pos.y - this.pos.y);
          }
        }
      }

      if (state.debugHP && isExposed) {
        fill(255, opacity); textAlign(CENTER, CENTER); textSize(9); noStroke(); text(`${floor(this.health)}`, GRID_SIZE/2, GRID_SIZE/2);
      } else if (this.health < this.maxHealth && isExposed) {
        fill(20, opacity * 0.8); noStroke(); rect(4, GRID_SIZE - 8, GRID_SIZE - 8, 4, 2);
        fill(255, 255, 100, opacity); rect(4, GRID_SIZE - 8, (this.health/this.maxHealth) * (GRID_SIZE - 8), 4, 2);
      }
    }
    pop();
  }

  takeDamage(dmg: number) {
    if (this.isMined) return false;
    this.health -= dmg; this.damageGlow = 180;
    if (this.health <= 0) {
      this.isMined = true;
      state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.config.color));
      
      const oCfg = this.overlay ? overlayTypes[this.overlay] : null;
      spawnLootAt(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.type, this.config.lootConfigOnDeath);

      if (oCfg) {
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
             state.enemies.push(new Enemy(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, eType));
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
  constructor(cx: number, cy: number, bonusData: any = {}) { 
    this.cx = cx; this.cy = cy; 
    this.generate(bonusData); 
  }

  generate(bonusData: any) {
    const lv = floor(constrain(state.currentChunkLevel, 0, 10));
    const weights = BLOCK_WEIGHTS[lv];
    const liquidW = LIQUID_WEIGHTS[lv];

    const candidates: {gx: number, gy: number, liquid: string | null, isBlock: boolean}[] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        let gx = this.cx * CHUNK_SIZE + x; let gy = this.cy * CHUNK_SIZE + y;
        let ln = noise((gx + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale, (gy + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale);
        let rn = noise((gx + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale, (gy + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale);
        let isRiver = Math.abs(rn - 0.5) < worldGenConfig.riverThreshold;
        let isLake = ln > worldGenConfig.lakeThreshold;
        if (dist(gx, gy, 0, 0) < worldGenConfig.spawnClearRadius) continue;

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
      { key: 'o_tnt', amount: bonusData.tnt || 0, stat: 'totalTntSpawned' },
      { key: 'o_stray', amount: bonusData.stray || 0, stat: 'totalStraySpawned' },
      { key: 'o_sunflower', amount: bonusData.sunflower || 0, stat: 'totalSunflowerSpawned' },
      { key: 'sniperTower', amount: bonusData.sniper || 0, stat: 'totalSniperSpawned' }
    ];

    for (const bonus of bonusOverlays) {
      let count = bonus.amount;
      while (count > 0) {
        const openBlocks = this.blocks.filter(b => !b.isMined && !b.overlay);
        if (openBlocks.length === 0) break;
        const target = openBlocks[floor(random(openBlocks.length))];
        target.overlay = bonus.key;
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
                target.overlay = chosenSpawnerKey;
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
      target.overlay = chosenType;
      target.initSunBits(chosenType);
      state.totalSunSpawned += (ECONOMY_CONFIG.lootValues as any)[chosenType];
      remainingSun -= (ECONOMY_CONFIG.lootValues as any)[chosenType];
    }
  }

  display(playerPos: any) {
    const margin = 200; // Increased margin to prevent edge-popping
    const left = state.cameraPos.x - width/2 - margin;
    const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin;
    const bottom = state.cameraPos.y + height/2 + margin;

    const chunkW = CHUNK_SIZE * GRID_SIZE;
    const chunkX = this.cx * chunkW;
    const chunkY = this.cy * chunkW;

    // Robust AABB check for chunk visibility
    if (chunkX + chunkW < left || chunkX > right || chunkY + chunkW < top || chunkY > bottom) return;

    for (let b of this.blocks) {
      b.update();
      b.display(dist(b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2, playerPos.x, playerPos.y) / GRID_SIZE);
    }
  }
}

export class WorldManager {
  chunks: Map<string, Chunk> = new Map();
  getChunk(cx: number, cy: number) {
    let key = `${cx},${cy}`;
    if (!this.chunks.has(key)) {
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
        } else {
          bonusData[fk] = 0;
        }
      }
      
      this.chunks.set(key, new Chunk(cx, cy, bonusData));
    }
    return this.chunks.get(key);
  }
  update(playerPos: any) {
    let pcx = floor(playerPos.x / (GRID_SIZE * CHUNK_SIZE)); let pcy = floor(playerPos.y / (GRID_SIZE * CHUNK_SIZE));
    const exploredKey = `${pcx},${pcy}`;
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
    for (let x = -CHUNK_GEN_RADIUS; x <= CHUNK_GEN_RADIUS; x++) {
      for (let y = -CHUNK_GEN_RADIUS; y <= CHUNK_GEN_RADIUS; y++) {
        this.getChunk(pcx + x, pcy + y);
      }
    }
  }
  updateLevel() {
    let count = state.exploredChunks.size; state.currentChunkLevel = 0;
    for (let i=0; i<LEVEL_THRESHOLDS.length; i++) { if (count >= LEVEL_THRESHOLDS[i]) state.currentChunkLevel = i + 1; else break; }
    const lv = floor(constrain(state.currentChunkLevel, 0, 10)); state.currentNightWaveBudget = Math.max(state.currentNightWaveBudget, LEVEL_BUDGET[lv]);
  }
  checkLOS(x1: number, y1: number, x2: number, y2: number) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let dSq = dx*dx + dy*dy;
    let steps = floor(Math.sqrt(dSq) / (GRID_SIZE * 0.5));
    for (let i = 1; i < steps; i++) {
      let px = lerp(x1, x2, i / steps); let py = lerp(y1, y2, i / steps); if (this.isBlockAt(px, py)) return false;
    }
    return true;
  }
  getNearestBlock(pos: any, range: number) {
    let nearest = null; let minDistSq = range*range;
    const viewportMargin = range + 200;
    this.chunks.forEach(chunk => {
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW;
      const cY = chunk.cy * chunkW;
      
      // Early exit if the chunk itself is way too far
      const dx = (cX + chunkW/2) - pos.x;
      const dy = (cY + chunkW/2) - pos.y;
      if (dx*dx + dy*dy > (viewportMargin + chunkW)**2) return;
      
      for (let b of chunk.blocks) { 
        if (b.isMined) continue; 
        let bX = b.pos.x + GRID_SIZE/2; 
        let bY = b.pos.y + GRID_SIZE/2; 
        let dSq = (pos.x - bX)**2 + (pos.y - bY)**2;
        if (dSq < minDistSq && this.checkLOS(pos.x, pos.y, bX, bY)) { 
          minDistSq = dSq; nearest = b; 
        } 
      }
    });
    return nearest;
  }
  isBlockAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE); let gy = floor(y / GRID_SIZE); let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return false;
    const b = chunk.blockMap.get(`${gx},${gy}`); return b && !b.isMined;
  }
  getLiquidAt(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    const b = chunk.blockMap.get(`${gx},${gy}`); return b ? b.liquidType : null;
  }
  display(playerPos: any) {
    // Generous range for initial selection, but actual chunk culling is handled in chunk.display()
    const rangeSq = (width + height + 600)**2;
    this.chunks.forEach(chunk => { 
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW + chunkW/2;
      const cY = chunk.cy * chunkW + chunkW/2;
      const dx = cX - playerPos.x;
      const dy = cY - playerPos.y;
      if (dx*dx + dy*dy < rangeSq) chunk.display(playerPos); 
    });
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
            let cX = constrain(x, b.pos.x, b.pos.x + GRID_SIZE); 
            let cY = constrain(y, b.pos.y, b.pos.y + GRID_SIZE); 
            if ((x - cX)**2 + (y - cY)**2 < radius*radius) return true; 
          } 
        }
      }
    }
    return false;
  }
}

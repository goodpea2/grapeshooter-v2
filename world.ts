
import { state } from './state';
import { 
  GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, LEVEL_THRESHOLDS, LEVEL_BUDGET, WORLD_GEN_STATS, CHUNK_GEN_RADIUS
} from './constants';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from './balanceObstacles';
import { liquidTypes, LIQUID_WEIGHTS, LIQUID_KEYS } from './balanceLiquids';
import { MuzzleFlash, BlockDebris } from './vfx';
import { Enemy, Bullet, NPCEntity } from './entities';
import { spawnLootAt, ECONOMY_CONFIG } from './economy';
import { worldGenConfig, requestSpawn, spawnFromBudget } from './lvDemo';
import { drawOverlay } from './visualObstacles';
import { enemyTypes } from './balanceEnemies';
import { drawDecoration } from './visualDecoration';
// Added RoomPrefab interface to imports
import { ROOM_PREFABS, RoomPrefab } from './dictionaryRoomPrefab';
import { generateRoomDirectorData } from './debug/roomDirectorGenerator';

declare const createVector: any;
declare const dist: any;
declare const floor: any;
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
declare const width: any;
declare const height: any;

/**
 * Maps a grid coordinate to a 1D spiral index starting from (0,0).
 */
function getSpiralIndex(x: number, y: number): number {
  let r = Math.max(Math.abs(x), Math.abs(y));
  if (r === 0) return 0;
  let maxSide = 2 * r + 1;
  let maxIdx = maxSide * maxSide - 1;
  if (y === -r) return maxIdx - (r - x);
  if (x === -r) return maxIdx - 2 * r - (y + r);
  if (y === r) return maxIdx - 4 * r - (x + r);
  return maxIdx - 6 * r - (r - y);
}

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
            requestSpawn(sx, sy, eKey);
            if (sCfg.spawnIntervalConsumeBudget) this.spawnerBudget -= eCfg.cost;
            this.lastSpawnTime = frameCount;
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
      const n = state.world.canConnectTo(this.pos.x, this.pos.y - GRID_SIZE, this.config);
      const s = state.world.canConnectTo(this.pos.x, this.pos.y + GRID_SIZE, this.config);
      const w = state.world.canConnectTo(this.pos.x - GRID_SIZE, this.pos.y, this.config);
      const e = state.world.canConnectTo(this.pos.x + GRID_SIZE, this.pos.y, this.config);
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
      
      const sizeMult = this.config.sizeMultiplier || 1.0;
      const renderSize = GRID_SIZE * sizeMult;
      const offset = (GRID_SIZE - renderSize) / 2;

      push();
      translate(offset, offset);
      if (!isExposed) fill(base[0] * 0.3, base[1] * 0.3, base[2] * 0.3, opacity); else fill(base[0], base[1], base[2], opacity);
      noStroke();
      const tl = (n || w) ? 0 : rad; const tr = (n || e) ? 0 : rad; const br = (s || e) ? 0 : rad; const bl = (s || w) ? 0 : rad;
      rect(0, 0, renderSize, renderSize, tl, tr, br, bl);

      if (isExposed) {
        stroke(bord[0], bord[1], bord[2], opacity); strokeWeight(3); noFill();
        if (!n) line(tl, 0, renderSize - tr, 0); if (!s) line(bl, renderSize, renderSize - br, renderSize); if (!w) line(0, tl, 0, renderSize - bl); if (!e) line(renderSize, tr, renderSize, renderSize - br);
        if (!n && !w) arc(rad, rad, rad * 2, rad * 2, PI, PI + HALF_PI); if (!n && !e) arc(renderSize - rad, rad, rad * 2, rad * 2, PI + HALF_PI, TWO_PI); if (!s && !e) arc(renderSize - rad, renderSize - rad, rad * 2, rad * 2, 0, HALF_PI); if (!s && !w) arc(rad, renderSize - rad, rad * 2, rad * 2, HALF_PI, PI);
      }

      if (this.feature && isExposed) {
        drawDecoration(this.feature, this.gx, this.gy, opacity);
      }

      if (this.damageGlow > 0) {
        fill(255, 255, 255, this.damageGlow * opacity / 255); noStroke(); rect(0, 0, renderSize, renderSize, tl, tr, br, bl);
        this.damageGlow = lerp(this.damageGlow, 0, 0.12);
      }
      pop();
    }
    pop();
  }

  /**
   * Phase 2 of Layered Rendering: High-cost overlays and status bars.
   */
  renderOverlay(opacity: number) {
    if (this.isMined || !this.overlay || opacity <= 0) {
        // Even if mined, handle logic for certain types or just show HP bar if health < max
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
    if (oCfg && (isExposed || oCfg?.isConcealedAlongWithObstacle === false)) {
      push(); translate(this.pos.x, this.pos.y);
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

  takeDamage(dmg: number) {
    if (this.isMined) return false;
    this.health -= dmg; this.damageGlow = 180;
    if (this.health <= 0) {
      this.isMined = true;
      state.vfx.push(new BlockDebris(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.config.color));
      
      const oCfg = this.overlay ? overlayTypes[this.overlay] : null;
      spawnLootAt(this.pos.x + GRID_SIZE/2, this.pos.y + GRID_SIZE/2, this.type, this.config.lootConfigOnDeath);

      if (oCfg) {
        // --- TNT Override ---
        if (this.overlay === 'o_tnt') {
            state.tickingExplosives.push({
                x: this.pos.x + GRID_SIZE/2,
                y: this.pos.y + GRID_SIZE/2,
                type: 'o_tnt',
                timer: 180,
                maxTimer: 180
            });
            return true;
        }

        // --- Death Rattle for Spawners ---
        if (oCfg.enemySpawnConfig && this.spawnerBudget > 0) {
          const sCfg = oCfg.enemySpawnConfig;
          let safety = 50; 
          while (this.spawnerBudget > 0 && safety > 0) {
            safety--;
            const affordable = sCfg.enemyTypeKey.filter((k: string) => enemyTypes[k].cost <= this.spawnerBudget);
            if (affordable.length === 0) break;
            
            const eKey = affordable[floor(random(affordable.length))];
            const eCfg = enemyTypes[eKey];
            const ang = random(TWO_PI);
            const r = random(GRID_SIZE * 0.5, sCfg.spawnRadius * 1.2);
            const sx = this.pos.x + GRID_SIZE/2 + cos(ang) * r;
            const sy = this.pos.y + GRID_SIZE/2 + sin(ang) * r;
            
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
  localChunkLevel: number = 0;
  prefabId: string | null = null;
  roomEnemyBudget: number = 0;
  isRoomBudgetTriggered: boolean = false;

  constructor(cx: number, cy: number, bonusData: any = {}) { 
    this.cx = cx; this.cy = cy; 
    
    // INTEGRATION: Check Room Director for prefab assignment based on Spiral Index
    const spiralIdx = getSpiralIndex(cx, cy);
    const chain = state.roomDirectorChain || [];
    const targetPrefabId = (spiralIdx < chain.length) ? chain[spiralIdx] : null;
    const prefab = targetPrefabId ? ROOM_PREFABS.find(p => p.id === targetPrefabId) : null;

    if (prefab) {
      this.generateFromPrefab(prefab, bonusData);
    } else {
      this.generate(bonusData); 
    }
  }

  generate(bonusData: any, levelOverride?: number) {
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
        
        // Spawn clear zone around block (8, 8) in origin chunk
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

  generateFromPrefab(prefab: RoomPrefab, bonusData: any) {
    // 1. Foundational Layer: Generate standard noise-based chunk at CURRENT world level.
    // INTEGRATION FIX: We must pass the bonusData from the WorldManager (accumulated pots) 
    // to the standard generator so standard features like snipers and seeds spawn alongside the prefab content.
    const lv = floor(constrain(state.currentChunkLevel, 0, 10));
    
    // Call the base generator first - this handles standard noise and standard loot distributions from pots
    this.generate(bonusData, lv);
    
    // Set metadata for debug tracking
    this.prefabId = prefab.id;
    const cfg = prefab.worldGenConfig;

    // Helper for adding prefab-specific PoIs
    const pickValidBlockForAddition = () => {
      // Must be solid ground, no liquid, and no existing overlay (additive PoI placement)
      const candidates = this.blocks.filter(b => !b.isMined && !b.overlay && !b.liquidType);
      if (candidates.length === 0) return null;
      return candidates[floor(random(candidates.length))];
    };

    // 2. Guaranteed NPC Logic (Spawn + Clear Surroundings)
    if (cfg.guaranteedNpc) {
      let npcKey = cfg.guaranteedNpc;
      if (npcKey === 'lv1 npc') npcKey = random(['NPC_lv1_lily', 'NPC_lv1_jelly']);
      if (npcKey === 'lv2 npc') npcKey = random(['NPC_lv2_farmer', 'NPC_lv2_sourgrape', 'NPC_lv2_shroom']);
      if (npcKey === 'lv3 npc') npcKey = random(['NPC_lv3_knight', 'NPC_lv3_hunter']);

      const spawnGX = floor(this.cx * CHUNK_SIZE + random(4, 12));
      const spawnGY = floor(this.cy * CHUNK_SIZE + random(4, 12));
      
      // Clear 2-radius surroundings
      for (let i = spawnGX - 2; i <= spawnGX + 2; i++) {
        for (let j = spawnGY - 2; j <= spawnGY + 2; j++) {
           const b = this.blockMap.get(`${i},${j}`);
           if (b) {
             b.isMined = true;
             b.overlay = null;
             b.liquidType = null;
           }
        }
      }

      state.npcs.push(new NPCEntity(spawnGX * GRID_SIZE + GRID_SIZE/2, spawnGY * GRID_SIZE + GRID_SIZE/2, npcKey));
    }

    // 3. Guaranteed Overlay Logic (e.g. Treasure Chest)
    if (cfg.guaranteedOverlay) {
        const target = pickValidBlockForAddition();
        if (target) {
            target.overlay = cfg.guaranteedOverlay;
            const oCfg = overlayTypes[cfg.guaranteedOverlay];
            if (oCfg.minHealth > 0) {
              target.health = oCfg.minHealth;
              target.maxHealth = target.health;
            }
        }
    }

    // 4. Additive Carving (Air Ratio)
    const totalPossibleBlocks = CHUNK_SIZE * CHUNK_SIZE;
    const getSolidBlocks = () => this.blocks.filter(b => !b.isMined);
    const getLiquidBlocks = () => this.blocks.filter(b => b.liquidType);
    
    const calculateCurrentAir = () => {
        let air = totalPossibleBlocks - getSolidBlocks().length;
        if (cfg.airIncludeLiquid) air += getLiquidBlocks().length;
        return air;
    };

    const targetAir = floor(totalPossibleBlocks * cfg.minAirRatio);
    let currentAir = calculateCurrentAir();
    
    if (currentAir < targetAir) {
        const digAmount = targetAir - currentAir;
        // Priority: Carve blocks WITHOUT existing overlays (don't mine the natural loot foundation)
        let candidates = this.blocks.filter(b => !b.isMined && !b.overlay);
        // Fallback: If we still need space, start carving anything
        if (candidates.length < digAmount) candidates = this.blocks.filter(b => !b.isMined);
        
        for (let i = 0; i < Math.min(digAmount, candidates.length); i++) {
            const idx = floor(random(candidates.length));
            const target = candidates.splice(idx, 1)[0];
            target.isMined = true;
        }
    }

    // 5. Additive Prefab Spawners
    const spawnerCount = floor(random(cfg.enemySpawnerCount[0], cfg.enemySpawnerCount[1] + 1));
    const danger = cfg.enemySpawnerConfig.danger;
    const spawnerPool = Object.keys(overlayTypes).filter(k => overlayTypes[k].isEnemySpawner && overlayTypes[k].danger === danger);
    
    for (let i = 0; i < spawnerCount; i++) {
      const target = pickValidBlockForAddition();
      if (target && spawnerPool.length > 0) {
        target.overlay = spawnerPool[floor(random(spawnerPool.length))];
        const bRange = cfg.enemySpawnerConfig.enemySpawnConfig.budget;
        target.spawnerBudget = floor(random(bRange[0], bRange[1] + 1));
        state.totalSpawnerSpawned++;
      }
    }

    // 6. Additive Multi-tier Sun (Using same logic as sunPot distribution)
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
        if (!target) break; // Out of space
        
        target.overlay = chosenType;
        target.initSunBits(chosenType);
        state.totalSunSpawned += (ECONOMY_CONFIG.lootValues as any)[chosenType];
        remainingSun -= (ECONOMY_CONFIG.lootValues as any)[chosenType];
      }
    }

    // 7. Additive Prefab TNT and Crates
    const otherPots = [
      { key: 'o_tnt', countRange: cfg.tnt },
      { key: 'o_crate', isBlock: true, countRange: cfg.crate }
    ];

    for (const p of otherPots) {
      const count = floor(random(p.countRange[0], p.countRange[1] + 1));
      for (let i = 0; i < count; i++) {
        if (p.isBlock) {
            // For blocks (Crates), find traversable empty air ground
            const candidates = this.blocks.filter(b => b.isMined && !b.liquidType);
            if (candidates.length > 0) {
                const target = candidates[floor(random(candidates.length))];
                target.isMined = false;
                target.type = p.key;
                target.config = obstacleTypes[p.key] || obstacleTypes['o_crate'];
                target.health = target.config.health;
                target.maxHealth = target.health;
            }
        } else {
            const target = pickValidBlockForAddition();
            if (target) {
                target.overlay = p.key;
            }
        }
      }
    }

    // 8. Additive Guaranteed Obstacles
    for (const g of cfg.guaranteedObstacleConfig) {
      const count = floor(random(g.count[0], g.count[1] + 1));
      for (let i = 0; i < count; i++) {
        const target = pickValidBlockForAddition();
        if (target) {
            target.type = g.type;
            target.config = obstacleTypes[g.type] || obstacleTypes['o_dirt'];
            target.health = target.config.health;
            target.maxHealth = target.health;
        }
      }
    }

    // 9. Immediate Room Population Encounter -> Defer to trigger via roomEnemyBudget
    this.roomEnemyBudget = prefab.enemyBudget;
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
    
    // Multi-pass layered rendering to optimize drawing overhead
    // Pass 1: Renders bases (Ground/Liquids/Borders)
    for (let b of this.blocks) { 
        b.update(); 
        const d = dist(b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2, playerPos.x, playerPos.y) / GRID_SIZE;
        const opacity = constrain(map(d, VISIBILITY_RADIUS - 1, VISIBILITY_RADIUS, 255, 0), 0, 255);
        b.renderBase(opacity); 
    }
    
    // Pass 2: Renders overlays (Assets/Pulsing effects)
    for (let b of this.blocks) {
        const d = dist(b.pos.x + GRID_SIZE/2, b.pos.y + GRID_SIZE/2, playerPos.x, playerPos.y) / GRID_SIZE;
        const opacity = constrain(map(d, VISIBILITY_RADIUS - 1, VISIBILITY_RADIUS, 255, 0), 0, 255);
        b.renderOverlay(opacity);
    }
  }
}

export class WorldManager {
  chunks: Map<string, Chunk> = new Map();

  constructor() {
    // INITIALIZATION: Generate the room director chain on first load
    if (state.roomDirectorChain.length === 0) {
      state.roomDirectorData = generateRoomDirectorData();
      state.roomDirectorChain = state.roomDirectorData.split('-');
    }
  }

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
        } else { bonusData[fk] = 0; }
      }
      this.chunks.set(key, new Chunk(cx, cy, bonusData));
    }
    return this.chunks.get(key);
  }
  regenerateChunkAt(x: number, y: number) {
    let gx = floor(x / GRID_SIZE);
    let gy = floor(y / GRID_SIZE);
    let cx = floor(gx / CHUNK_SIZE);
    let cy = floor(gy / CHUNK_SIZE);
    let key = `${cx},${cy}`;
    this.chunks.delete(key);
    this.getChunk(cx, cy);
  }
  update(playerPos: any) {
    let pcx = floor(playerPos.x / (GRID_SIZE * CHUNK_SIZE)); let pcy = floor(playerPos.y / (GRID_SIZE * CHUNK_SIZE));
    const exploredKey = `${pcx},${pcy}`;

    // INTEGRATION: Trigger Room Director enemy budget if player enters a room chunk
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
  }
  updateLevel() {
    let count = state.exploredChunks.size; state.currentChunkLevel = 0;
    for (let i=0; i<LEVEL_THRESHOLDS.length; i++) { if (count >= LEVEL_THRESHOLDS[i]) state.currentChunkLevel = i + 1; else break; }
    const lv = floor(constrain(state.currentChunkLevel, 0, 10)); state.currentNightWaveBudget = Math.max(state.currentNightWaveBudget, LEVEL_BUDGET[lv]);
  }
  checkLOS(x1: number, y1: number, x2: number, y2: number) {
    let dx = x2 - x1; let dy = y2 - y1; let dSq = dx*dx + dy*dy;
    let steps = floor(Math.sqrt(dSq) / (GRID_SIZE * 0.5));
    for (let i = 1; i < steps; i++) { let px = lerp(x1, x2, i / steps); let py = lerp(y1, y2, i / steps); if (this.isBlockAt(px, py)) return false; }
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
    // Crates don't connect to anything
    if (myConfig.connectToOtherBlock === false || b.config.connectToOtherBlock === false) return false;
    return true;
  }
  getLiquidAt(gx: number, gy: number) {
    let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
    let chunk = this.chunks.get(`${cx},${cy}`); if(!chunk) return null;
    const b = chunk.blockMap.get(`${gx},${gy}`); return b ? b.liquidType : null;
  }
  display(playerPos: any) {
    const rangeSq = (width + height + 600)**2;
    this.chunks.forEach(chunk => { 
      const chunkW = CHUNK_SIZE * GRID_SIZE;
      const cX = chunk.cx * chunkW + chunkW/2; const cY = chunk.cy * chunkW + chunkW/2;
      const dx = cX - playerPos.x; const dy = cY - playerPos.y;
      if (dx*dx + dy*dy < rangeSq) chunk.display(playerPos); 
    });
  }
  checkCollision(x: number, y: number, radius: number) {
    // Check Blocks
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
    // Check Forcefields
    for (const gf of state.groundFeatures) {
       if (gf.typeKey === 'gf_forcefield') {
          const dSq = (x - gf.pos.x)**2 + (y - gf.pos.y)**2;
          const rSum = radius + gf.config.radius;
          if (dSq < rSum * rSum) return true;
       }
    }
    return false;
  }
}

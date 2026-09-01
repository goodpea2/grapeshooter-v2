import { state } from '../state';
import { 
  GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, WORLD_GEN_STATS
} from '../constants';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from '../balanceObstacles';
import { LIQUID_WEIGHTS, LIQUID_KEYS } from '../balanceLiquids';
import { NPCEntity } from '../entities';
import { ECONOMY_CONFIG } from '../economy';
import { worldGenConfig } from '../lvDemo';
import { ROOM_PREFABS, RoomPrefab } from '../dictionaryRoomPrefab';
import { drawAutotile } from '../visualAutotiling';
import { Block } from './block';

declare const dist: any;
declare const floor: any;
declare const abs: any;
declare const noise: any;
declare const random: any;
declare const constrain: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const rect: any;
declare const noStroke: any;
declare const ellipse: any;
declare const triangle: any;
declare const map: any;
declare const sin: any;
declare const cos: any;
declare const line: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const CENTER: any;
declare const text: any;
declare const TWO_PI: any;
declare const createGraphics: any;
declare const image: any;
declare const imageMode: any;
declare const CORNER: any;
declare const width: any;
declare const height: any;

export const BLOCK_KEYS = ['o_dirt', 'o_clay', 'o_stone', 'o_slate', 'o_black'];

export class Chunk {
  cx: number; cy: number; blocks: Block[] = []; blockMap: Map<string, Block> = new Map();
  overlayBlocks: Block[] = []; // OPTIMIZATION: Keep track of blocks with overlays
  liquidBlocks: Block[] = [];  // OPTIMIZATION: Cache blocks with liquids
  assetBlocks: Block[] = [];   // OPTIMIZATION: Cache blocks with asset images
  winConditionBlocks: Block[] = []; // OPTIMIZATION: Cache win condition blocks
  turrets: any[] = []; // Store world turrets in chunks
  loot: any[] = []; // Store loot in chunks
  localChunkLevel: number = 0;
  prefabId: string | null = null;
  roomEnemyBudget: number = 0;
  isRoomBudgetTriggered: boolean = false;
  deathBuffer: any = null;
  
  // Dual-grid buffering
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

  // OPTIMIZATION: Cache blocks by render requirement
  rebuildOverlayList() {
    this.overlayBlocks = this.blocks.filter(b => !!b.overlay || b.health < b.maxHealth);
    this.liquidBlocks = this.blocks.filter(b => !!b.liquidType);
    this.assetBlocks = this.blocks.filter(b => !!b.config?.assetImgConfig);
    this.winConditionBlocks = this.blocks.filter(b => b.isWinCondition);
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
    const isHighQuality = state.graphicQuality === 'high';
    const dpr = isHighQuality && typeof window !== 'undefined' && window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1;
    if (!this.buffer) {
      this.buffer = createGraphics(chunkW, chunkW);
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

    // Render a 17x17 visual grid to cover all junctions
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
    const isHighQuality = state.graphicQuality === 'high';
    const dpr = isHighQuality && typeof window !== 'undefined' && window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1;
    if (!this.deathBuffer) {
      this.deathBuffer = createGraphics(CHUNK_SIZE * GRID_SIZE, CHUNK_SIZE * GRID_SIZE);
      this.deathBuffer.pixelDensity(dpr);
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
    const visRad = VISIBILITY_RADIUS * GRID_SIZE;
    const visRadSq = visRad * visRad;
    const fadeStart = (VISIBILITY_RADIUS - 1) * GRID_SIZE;
    const fadeStartSq = fadeStart * fadeStart;

    const ctx = (window as any).drawingContext as CanvasRenderingContext2D;

    if (this.deathBuffer) {
      const source = this.deathBuffer.canvas || this.deathBuffer.elt || this.deathBuffer;
      if (ctx && source) {
        ctx.drawImage(source, chunkX, chunkY, chunkW, chunkW);
      } else {
        push();
        imageMode(CORNER);
        image(this.deathBuffer, chunkX, chunkY, chunkW, chunkW);
        pop();
      }
    }

    // Pass 0: Liquids (UNDER blocks) - renders directly along with chunk
    for (let i = 0; i < this.liquidBlocks.length; i++) {
      this.liquidBlocks[i].renderBase(255);
    }

    if (this.needsRedraw) {
      this.renderToBuffer();
    }
    if (this.buffer) {
      const source = this.buffer.canvas || this.buffer.elt || this.buffer;
      if (ctx && source) {
        ctx.drawImage(source, chunkX, chunkY, chunkW + 0.5, chunkW + 0.5);
      } else {
        push();
        imageMode(CORNER);
        image(this.buffer, chunkX, chunkY, chunkW + 0.5, chunkW + 0.5);
        pop();
      }
    }

    // Pass 1: Renders custom asset blocks (only blocks with assetImgConfig)
    for (let i = 0; i < this.assetBlocks.length; i++) { 
      const b = this.assetBlocks[i];
      const dx = b.pos.x + GRID_SIZE/2 - px;
      const dy = b.pos.y + GRID_SIZE/2 - py;
      const dSq = dx*dx + dy*dy;
      if (dSq > visRadSq) continue;
      let opacity = 255;
      if (dSq > fadeStartSq) {
        const d = Math.sqrt(dSq);
        opacity = constrain(map(d, fadeStart, visRad, 255, 0), 0, 255);
      }
      b.renderBase(opacity);
    }

    // Render win condition markers
    for (let i = 0; i < this.winConditionBlocks.length; i++) {
      const b = this.winConditionBlocks[i];
      if (b.isMined) continue;
      const dx = b.pos.x + GRID_SIZE / 2 - px;
      const dy = b.pos.y + GRID_SIZE / 2 - py;
      const dSq = dx*dx + dy*dy;
      if (dSq > visRadSq) continue;
      let opacity = 255;
      if (dSq > fadeStartSq) {
        const d = Math.sqrt(dSq);
        opacity = constrain(map(d, fadeStart, visRad, 255, 0), 0, 255);
      }
      push();
      translate(b.pos.x + GRID_SIZE / 2, b.pos.y + GRID_SIZE / 2);
      noFill();
      stroke(255, 215, 0, (180 + 40 * sin(state.frames * 0.08)) * (opacity / 255));
      strokeWeight(2.5);
      ellipse(0, 0, GRID_SIZE * 0.85 + 2 * sin(state.frames * 0.08));
      fill(255, 215, 0, 230 * (opacity / 255));
      noStroke();
      triangle(-3, -6, 6, -2, -3, 2);
      stroke(255, 215, 0, 250 * (opacity / 255));
      strokeWeight(1.5);
      line(-3, -6, -3, 7);
      pop();
    }
    
    // Pass 2: Renders overlays (Assets/Pulsing effects/Spawners)
    for (let i = 0; i < this.overlayBlocks.length; i++) {
      const b = this.overlayBlocks[i];
      const dx = b.pos.x + GRID_SIZE/2 - px;
      const dy = b.pos.y + GRID_SIZE/2 - py;
      const dSq = dx*dx + dy*dy;
      if (dSq > visRadSq) continue;
      let opacity = 255;
      if (dSq > fadeStartSq) {
        const d = Math.sqrt(dSq);
        opacity = constrain(map(d, fadeStart, visRad, 255, 0), 0, 255);
      }
      b.renderOverlay(opacity);
      b.renderSparkles(opacity);
    }

    // Pass 3: Render Loot
    for (let i = 0; i < this.loot.length; i++) {
      this.loot[i].display();
    }
  }
}

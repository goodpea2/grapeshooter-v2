
// Added p5.js global variable declarations to avoid TS errors
import { state } from './state';
import { GRID_SIZE, LEVEL_THRESHOLDS, HOUR_FRAMES, CHUNK_SIZE } from './constants';
import { worldGenConfig, requestSpawn, AlmanacProgression } from './lvDemo';
import { liquidTypes, LIQUID_KEYS, LIQUID_WEIGHTS } from './balanceLiquids';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from './balanceObstacles';
import { groundFeatureTypes } from './balanceGroundFeatures';
import { enemyTypes } from './balanceEnemies';
import { npcTypes } from './balanceNPC';
import { turretTypes } from './balanceTurrets';
import { Explosion } from './vfx/index';
import { Bullet, GroundFeature, NPCEntity, LootEntity } from './entities';
import { Block } from './world';
import { ROOM_PREFABS } from './dictionaryRoomPrefab';
import { generateRoomDirectorData } from './debug/roomDirectorGenerator';

// p5.js global variable declarations
declare const floor: any;
declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const ellipse: any;
declare const strokeWeight: any;
declare const dist: any;
declare const rectMode: any;
declare const noise: any;
declare const constrain: any;
declare const map: any;
declare const color: any;
declare const createGraphics: any;
declare const image: any;
declare const textWidth: any;

export function drawSlider(x: number, y: number, w: number, label: string, val: number, min: number, max: number, key: string) {
  push();
  const h = 18;
  fill(40); stroke(255, 50); rect(x, y, w, h, 4);
  const handleX = x + map(val, min, max, 0, w);
  fill(100, 255, 255); noStroke(); rect(handleX - 4, y, 8, h, 2);
  
  fill(255); textAlign(LEFT, CENTER); textSize(9);
  text(label, x + 5, y + h / 2);
  textAlign(RIGHT, CENTER);
  text(val.toFixed(3), x + w - 5, y + h / 2);

  if (mouseIsPressed && mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
    (worldGenConfig as any)[key] = constrain(map(mouseX, x, x + w, min, max), min, max);
    state.worldPreviewNeedsUpdate = true;
  }
  pop();
}

function updateWorldPreviewBuffer() {
  const tiles = 144; // Standardized to CHUNK_SIZE * 9 (144) to keep map multiplier rounded
  const pixelSize = 3;
  const bufferSize = tiles * pixelSize; // 432x432

  if (!state.worldPreviewBuffer) {
    state.worldPreviewBuffer = createGraphics(bufferSize, bufferSize);
  }

  const pg = state.worldPreviewBuffer;
  pg.noStroke();
  pg.background(10, 10, 20);

  const lv = floor(constrain(state.currentChunkLevel, 0, 10));
  const liquidW = LIQUID_WEIGHTS[lv];
  const blockW = BLOCK_WEIGHTS[lv];
  const totalBW = blockW.reduce((a: number, b: number) => a + b, 0);

  const cx = floor(state.player.pos.x / GRID_SIZE);
  const cy = floor(state.player.pos.y / GRID_SIZE);

  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      let gx = cx - floor(tiles / 2) + x;
      let gy = cy - floor(tiles / 2) + y;
      let ln = noise((gx + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale, (gy + worldGenConfig.noiseOffsetLakes) * worldGenConfig.liquidNoiseScale);
      let rn = noise((gx + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale, (gy + worldGenConfig.noiseOffsetRivers) * worldGenConfig.riverNoiseScale);
      let isRiver = Math.abs(rn - 0.5) < worldGenConfig.riverThreshold;
      let isLake = ln > worldGenConfig.lakeThreshold;
      let liquid = null;
      if (isLake || isRiver) {
        let cln = noise((gx + worldGenConfig.noiseOffsetClumping) * worldGenConfig.liquidClumpScale, (gy + worldGenConfig.noiseOffsetClumping) * worldGenConfig.liquidClumpScale);
        let totalLW = liquidW.reduce((a: number, b: number) => a + b, 0);
        if (totalLW > 0) {
          let r = cln * totalLW; let sum = 0;
          for (let i = 0; i < LIQUID_KEYS.length; i++) { sum += liquidW[i]; if (r <= sum) { liquid = LIQUID_KEYS[i]; break; } }
        }
      }
      let blockKey = null;
      if (!liquid) {
        let n = noise((gx + worldGenConfig.noiseOffsetBlocks) * worldGenConfig.blockNoiseScale, (gy + worldGenConfig.noiseOffsetBlocks) * worldGenConfig.blockNoiseScale);
        if (n > worldGenConfig.blockThreshold) {
          let bn = noise((gx + worldGenConfig.noiseOffsetBlocks) * 0.25, (gy + worldGenConfig.noiseOffsetBlocks) * 0.25, 200);
          let r = bn * totalBW; let sum = 0;
          const BLOCK_KEYS = ['o_dirt', 'o_clay', 'o_stone', 'o_slate', 'o_black'];
          for (let i = 0; i < BLOCK_KEYS.length; i++) { sum += blockW[i]; if (r <= sum) { blockKey = BLOCK_KEYS[i]; break; } }
          if (!blockKey) blockKey = 'o_dirt';
        }
      }
      if (blockKey) { 
        const c = obstacleTypes[blockKey].color; 
        pg.fill(c[0], c[1], c[2]); 
        pg.rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize); 
      } 
      else if (liquid) { 
        const c = liquidTypes[liquid].color; 
        pg.fill(c[0], c[1], c[2]); 
        pg.rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize); 
      }
    }
  }
  // Player center marker
  pg.fill(255);
  pg.ellipse(bufferSize / 2, bufferSize / 2, 6);
  
  state.worldPreviewNeedsUpdate = false;
}

export function drawWorldGenPreview() {
  if (!state.showWorldGenPreview) return;

  if (state.worldPreviewNeedsUpdate) {
    updateWorldPreviewBuffer();
  }

  push();
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  // Responsive modal sizing
  const modalW = Math.min(850, width - 40);
  const modalH = Math.min(600, height - 40);
  const mx = (width - modalW) / 2;
  const my = (height - modalH) / 2;
  
  fill(20, 20, 35);
  stroke(100, 100, 255);
  strokeWeight(2);
  rect(mx, my, modalW, modalH, 12);

  const closeX = mx + modalW - 40;
  const closeY = my + 10;
  fill(255, 50, 50); noStroke();
  ellipse(closeX + 15, closeY + 15, 25);
  fill(255); textAlign(CENTER, CENTER); textSize(12); text("X", closeX + 15, closeY + 15);
  if (mouseIsPressed && dist(mouseX, mouseY, closeX + 15, closeY + 15) < 15) {
    state.showWorldGenPreview = false;
    (window as any).mouseIsPressed = false;
  }

  const sideW = Math.min(260, modalW * 0.35);
  const sideX = mx + modalW - sideW - 20;
  const sideY = my + 50;
  
  textAlign(LEFT, TOP); fill(255, 255, 100); textSize(14);
  text("WORLD GEN TWEAK", sideX, sideY - 30);

  let sy = sideY;
  const sliders = [
    {l: "Liq Scale", k: "liquidNoiseScale", min: 0.001, max: 0.1},
    {l: "River Scale", k: "riverNoiseScale", min: 0.001, max: 0.1},
    {l: "Lake Thresh", k: "lakeThreshold", min: 0.1, max: 0.95},
    {l: "River Thresh", k: "riverThreshold", min: 0.01, max: 0.2},
    {l: "Block Scale", k: "blockNoiseScale", min: 0.01, max: 0.5},
    {l: "Block Thresh", k: "blockThreshold", min: 0.1, max: 0.9},
    {l: "Liq Clump", k: "liquidClumpScale", min: 0.001, max: 0.1}
  ];
  
  for(let s of sliders) {
    drawSlider(sideX, sy, sideW, s.l, (worldGenConfig as any)[s.k], s.min, s.max, s.k);
    sy += 25;
  }

  sy += 5;
  fill(255); textSize(11); text(`Preview Level: ${state.currentChunkLevel}`, sideX, sy);
  sy += 15;
  const btnSize = 24;
  for(let i=0; i<=10; i++) {
    const bx = sideX + (i % 6) * (btnSize + 5);
    const by = sy + floor(i / 6) * (btnSize + 5);
    const hov = mouseX > bx && mouseX < bx + btnSize && mouseY > by && mouseY < by + btnSize;
    fill(state.currentChunkLevel === i ? [100, 255, 100] : (hov ? 80 : 40));
    rect(bx, by, btnSize, btnSize, 4);
    fill(255); textAlign(CENTER, CENTER); textSize(10); text(i, bx + btnSize/2, by + btnSize/2);
    if (mouseIsPressed && hov) {
       state.currentChunkLevel = i;
       state.worldPreviewNeedsUpdate = true;
       (window as any).mouseIsPressed = false;
    }
  }

  // --- ROOM DIRECTOR PREVIEW SECTION ---
  sy += 65;
  fill(255, 255, 100); textAlign(LEFT, TOP); textSize(12);
  text("ROOM DIRECTOR", sideX, sy);
  sy += 20;
  
  const genBtnX = sideX;
  const genBtnY = sy;
  const genBtnW = sideW;
  const genBtnH = 26;
  const hovGen = mouseX > genBtnX && mouseX < genBtnX + genBtnW && mouseY > genBtnY && mouseY < genBtnY + genBtnH;
  fill(hovGen ? 100 : 60); stroke(255, 100); rect(genBtnX, genBtnY, genBtnW, genBtnH, 4);
  fill(255); textAlign(CENTER, CENTER); textSize(10); text("GENERATE CHAIN", genBtnX + genBtnW/2, genBtnH + genBtnH/2);
  if (mouseIsPressed && hovGen) {
    state.roomDirectorData = generateRoomDirectorData();
    state.roomDirectorChain = state.roomDirectorData.split('-');
    state.roomDirectorScrollY = 0;
    (window as any).mouseIsPressed = false;
  }
  sy += 32;

  // Text Holder (Wrapped and Scrollable)
  const holderH = modalH - (sy - my) - 20;
  fill(15, 15, 25); noStroke(); rect(sideX, sy, sideW, holderH, 8);
  
  if (state.roomDirectorData) {
    const dc = (window as any).drawingContext;
    dc.save();
    dc.beginPath();
    dc.rect(sideX, sy, sideW, holderH);
    dc.clip();

    // Copy Button
    const copyW = 40;
    const copyH = 18;
    const copyX = sideX + sideW - copyW - 10;
    const copyY = sy + 10;
    const hovCopy = mouseX > copyX && mouseX < copyX + copyW && mouseY > copyY && mouseY < copyY + copyH;
    
    // Calculate height once or when data changes to prevent lag
    push();
    textSize(9);
    textAlign(LEFT, TOP);
    const wrapW = sideW - 20;
    
    // Simple line count estimation to avoid heavy regex match every frame
    const charPerLine = floor(wrapW / 5.5);
    const estimatedLines = Math.ceil(state.roomDirectorData.length / charPerLine) + 4;
    const textHeight = estimatedLines * 11 + 20;
    const maxScroll = Math.min(0, holderH - textHeight);

    // Scroll Logic
    if (mouseIsPressed && mouseX > sideX && mouseX < sideX + sideW && mouseY > sy && mouseY < sy + holderH && !hovCopy) {
      state.roomDirectorScrollVelocity = (mouseY - (window as any).pmouseY);
    } else {
      state.roomDirectorScrollVelocity *= 0.9;
    }
    state.roomDirectorScrollY = constrain(state.roomDirectorScrollY + state.roomDirectorScrollVelocity, maxScroll, 0);

    fill(180, 255, 180);
    text(state.roomDirectorData, sideX + 10, sy + 10 + state.roomDirectorScrollY, wrapW);
    pop();

    dc.restore();

    // Draw copy button on top
    push();
    fill(hovCopy ? 120 : 80); stroke(255, 50); rect(copyX, copyY, copyW, copyH, 4);
    fill(255); textAlign(CENTER, CENTER); textSize(8); text("COPY", copyX + copyW/2, copyY + copyH/2);
    if (mouseIsPressed && hovCopy) {
       navigator.clipboard.writeText(state.roomDirectorData);
       (window as any).mouseIsPressed = false;
    }
    pop();
    
    // Scrollbar for text
    if (textHeight > holderH) {
      const barH = holderH - 10;
      const handleH = (holderH / textHeight) * barH;
      const barY = sy + 5 + map(state.roomDirectorScrollY, 0, maxScroll, 0, barH - handleH);
      fill(255, 30); rect(sideX + sideW - 6, sy + 5, 4, barH, 2);
      fill(100, 255, 100, 150); rect(sideX + sideW - 6, barY, 4, handleH, 2);
    }
  } else {
    fill(100); textAlign(CENTER, CENTER); textSize(10);
    text("No chain generated.", sideX + sideW/2, sy + holderH/2);
  }

  // --- MAIN MAP PREVIEW (Using Buffer) ---
  const mapAreaSize = Math.min(450, modalW - sideW - 60);
  const px = mx + 20;
  const py = my + 50;

  noStroke();
  fill(0);
  rect(px - 2, py - 2, mapAreaSize + 4, mapAreaSize + 4, 4);
  
  if (state.worldPreviewBuffer) {
    image(state.worldPreviewBuffer, px, py, mapAreaSize, mapAreaSize);
  }
  
  pop();
}

export function drawDebugPanel(spawnFromBudget: Function) {
  if (!state.showDebug) return;

  const debugX = width - 280;
  
  // Interaction block if World Preview is open or Almanac is open
  const isInteractionBlocked = state.showWorldGenPreview || state.isAlmanacOpen || state.showUnlockPopup;

  // --- SECTION 1: Fixed Stats Panel ---
  push();
  fill(0, 220); noStroke(); rect(debugX, 60, 270, 180, 8);
  fill(0, 255, 150); textAlign(LEFT, TOP); textSize(11);
  let infoY = 75;
  
  let genCount = 0;
  state.world.chunks.forEach(() => genCount++);
  text(`Chunk (${genCount} / ${state.exploredChunks.size} / ${state.currentChunkLevel})`, debugX + 10, infoY); infoY += 15;
  text(`SunLoot (${state.totalSunLootCollected} / ${state.sunSpawnedTotal} / ${state.sunMissedTotal})`, debugX + 10, infoY); infoY += 15;
  text(`Enemy (${state.enemies.length} / ${state.totalEnemiesDead})`, debugX + 10, infoY); infoY += 15;
  text(`Budget (${floor(state.hourlyBudgetPool)} / ${floor(state.currentNightWaveBudget)} / ${floor(state.accumulatedSpentBudget)} / ${floor(state.refundedBudget)})`, debugX + 10, infoY); infoY += 20;

  let curSun = 0, curTnt = 0, curStray = 0, curFlower = 0, curSniper = 0, curSpawner = 0;
  state.world.chunks.forEach((chunk: any) => { chunk.blocks.forEach((b: any) => { if (!b.isMined && b.overlay) { if (b.overlay.startsWith('sun')) curSun += (b.overlay === 'sunTiny' ? 1 : (b.overlay === 'sunOre' ? 3 : 10)); else if (b.overlay === 'ov_tnt') curTnt++; else if (b.overlay === 'ov_stray') curStray++; else if (b.overlay === 'ov_sunflower') curFlower++; else if (b.overlay === 'ov_sniper_tower') curSniper++; else if (overlayTypes[b.overlay]?.isEnemySpawner) curSpawner++; } }); });
  const potInfo = [
      { l: "SunPot", p: state.accumulatedSunPot, t: state.totalSunSpawned, c: curSun },
      { l: "TNTPot", p: state.accumulatedTntPot, t: state.totalTntSpawned, c: curTnt },
      { l: "StrayPot", p: state.accumulatedStrayPot, t: state.totalStraySpawned, c: curStray },
      { l: "FlowerPot", p: state.accumulatedSunflowerPot, t: state.totalSunflowerSpawned, c: curFlower },
      { l: "SniperPot", p: state.accumulatedSniperPot, t: state.totalSniperSpawned, c: curSniper },
      { l: "SpawnerPot", p: state.accumulatedSpawnerPot, t: state.totalSpawnerSpawned, c: curSpawner }
  ];
  for (let pi of potInfo) { text(`${pi.l}: (${pi.p.toFixed(2)} acc - ${pi.t} spawned - ${pi.c} world)`, debugX + 10, infoY); infoY += 15; }
  pop();

  // --- SECTION 2: Scrollable Actions Panel ---
  const actionsPanelY = 250;
  const actionsPanelH = height - actionsPanelY - 20;
  const btnH = 25;
  const btnSpacing = 30;

  push();
  fill(0, 180); noStroke(); rect(debugX, actionsPanelY, 270, actionsPanelH, 8);
  
  // Set up clipping
  const dc = (window as any).drawingContext;
  dc.save();
  dc.beginPath();
  dc.rect(debugX, actionsPanelY, 270, actionsPanelH);
  dc.clip();

  let allItems: any[] = [];

  // Core Actions Header
  allItems.push({ l: "CORE ACTIONS", type: 'header', section: 'core' });
  if (!state.debugSectionsCollapsed.core) {
    allItems.push(
      { l: "HP Info", v: state.debugHP, a: () => state.debugHP = !state.debugHP, type: 'toggle', grid: true },
      { l: "Enemy Gizmo", v: state.debugGizmosEnemies, a: () => state.debugGizmosEnemies = !state.debugGizmosEnemies, type: 'toggle', grid: true },
      { l: "INSTANT CD", v: state.instantRechargeTurrets, a: () => state.instantRechargeTurrets = !state.instantRechargeTurrets, type: 'toggle', grid: true },
      { l: "Touch Gizmo", v: state.showTouchGizmo, a: () => state.showTouchGizmo = !state.showTouchGizmo, type: 'toggle', grid: true },
      { l: "WORLD PREV", v: state.showWorldGenPreview, a: () => { state.showWorldGenPreview = !state.showWorldGenPreview; state.worldPreviewNeedsUpdate = true; }, type: 'toggle', grid: true },
      { l: "+1k ALL", a: () => { state.sunCurrency += 1000; state.soilCurrency += 1000; state.elixirCurrency += 1000; state.raisinCurrency += 1000; }, grid: true },
      { l: "WARP 12H", a: () => state.timeWarpRemaining = 60, grid: true },
      { l: "CLEAR BLOCK", a: () => {
        const b = new Bullet(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_blocks', 'none');
        b.life = 0; 
        state.bullets.push(b);
      }, grid: true},
      { l: "CLEAR ENEMY", a: () => {
        const b = new Bullet(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_enemies', 'none');
        b.life = 0; 
        state.bullets.push(b);
      }, grid: true},
      { l: "SPAWN WAVE", a: () => spawnFromBudget(state.currentNightWaveBudget), grid: true }
    );
  }

  // Turret Actions Header
  allItems.push({ l: "TURRETS", type: 'header', section: 'turrets' });
  if (!state.debugSectionsCollapsed.turrets) {
    allItems.push(
      { l: "Enable Test Turrets", v: state.makeAllTurretsAvailable, a: () => state.makeAllTurretsAvailable = !state.makeAllTurretsAvailable, type: 'toggle', grid: true },
      { l: "Unlock All", a: () => {
        state.lockedTurrets.forEach((t: any) => {
          if (!state.unlockedTurrets.includes(t.type)) state.unlockedTurrets.push(t.type);
        });
        state.lockedTurrets = [];
      }, grid: true },
      { l: "Turret Gizmo", v: state.debugGizmosTurrets, a: () => state.debugGizmosTurrets = !state.debugGizmosTurrets, type: 'toggle', grid: true },
      { l: "CLEAR TURRET", a: () => {
        const b = new Bullet(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_destroyTurret', 'none');
        b.life = 0; 
        state.bullets.push(b);
      }, grid: true},
      { l: "SPAWN LOOT", type: 'subheader' }
    );
    // Sort turrets by tier then name
    const sortedTurretKeys = Object.keys(turretTypes).sort((a, b) => {
        const ta = turretTypes[a].tier;
        const tb = turretTypes[b].tier;
        if (ta !== tb) return ta - tb;
        return a.localeCompare(b);
    });
    for (const key of sortedTurretKeys) {
        allItems.push({ l: key.toUpperCase(), grid: true, a: () => {
            state.loot.push(new LootEntity(state.player.pos.x, state.player.pos.y, key));
        }});
    }
  }

  // CHUNK ACTIONS Header
  allItems.push({ l: "CHUNKS", type: 'header', section: 'chunks' });
  if (!state.debugSectionsCollapsed.chunks) {
    allItems.push(
      { l: "Show Borders", v: state.showChunkBorders, a: () => state.showChunkBorders = !state.showChunkBorders, type: 'toggle', grid: true },
      { l: "Regen Chunk", a: () => state.world.regenerateChunkAt(state.player.pos.x, state.player.pos.y), grid: true },
      { l: "Add Level", a: () => {
        const count = state.exploredChunks.size;
        const nextThreshold = LEVEL_THRESHOLDS.find(t => t > count) ?? (count + 50);
        for(let i=0; i<(nextThreshold - count); i++) state.exploredChunks.add(`cheat_${count+i}`);
        state.world.updateLevel();
      }, grid: true},
      { l: "Reset Level", a: () => { state.exploredChunks.clear(); state.world.updateLevel(); }, grid: true}
    );

    // PREFABS Collapsible Section
    allItems.push({ l: "PREFABS", type: 'header', section: 'prefabs' });
    if (!state.debugSectionsCollapsed.prefabs) {
        for (const prefab of ROOM_PREFABS) {
          allItems.push({ l: prefab.id.toUpperCase(), grid: true, a: () => {
              const gx = floor(state.player.pos.x / GRID_SIZE);
              const gy = floor(state.player.pos.y / GRID_SIZE);
              const cx = floor(gx / CHUNK_SIZE);
              const cy = floor(gy / CHUNK_SIZE);
              const chunk = state.world.getChunk(cx, cy);
              chunk.generateFromPrefab(prefab);
            }
          });
        }
    }
  }

  const getSpawnGridCoords = () => {
    const gx = floor(state.player.pos.x / GRID_SIZE) - 2;
    const gy = floor(state.player.pos.y / GRID_SIZE);
    return { gx, gy };
  };

  allItems.push({ l: "ENTITIES", type: 'header', section: 'entities' });
  if (!state.debugSectionsCollapsed.entities) {
    allItems.push({ l: "ENEMIES", type: 'subheader' });
    for (let key in enemyTypes) {
      allItems.push({ l: key.slice(2), grid: true, a: () => {
          const x = state.player.pos.x - GRID_SIZE * 2;
          const y = state.player.pos.y;
          requestSpawn(x, y, key);
        }
      });
    }
    allItems.push({ l: "NPCS", type: 'subheader' });
    for (let key in npcTypes) {
      allItems.push({ l: key, grid: true, a: () => {
          const x = state.player.pos.x - GRID_SIZE * 2;
          const y = state.player.pos.y;
          state.npcs.push(new NPCEntity(x, y, key));
        }
      });
    }
  }

  allItems.push({ l: "GROUND FEATURES", type: 'header', section: 'groundFeatures' });
  if (!state.debugSectionsCollapsed.groundFeatures) {
    for (let key in groundFeatureTypes) {
      allItems.push({ l: key.slice(3), grid: true, a: () => {
          const x = state.player.pos.x - GRID_SIZE * 2;
          const y = state.player.pos.y;
          state.groundFeatures.push(new GroundFeature(x, y, key));
        }
      });
    }
  }

  allItems.push({ l: "OBSTACLES", type: 'header', section: 'obstacles' });
  if (!state.debugSectionsCollapsed.obstacles) {
    for (let key in obstacleTypes) {
      allItems.push({ l: key.slice(2), grid: true, a: () => {
          const { gx, gy } = getSpawnGridCoords();
          const cx = floor(gx / CHUNK_SIZE);
          const cy = floor(gy / CHUNK_SIZE);
          const chunk = state.world.getChunk(cx, cy);
          const existing = chunk.blocks.find((blk: Block) => blk.gx === gx && blk.gy === gy);
          if (existing) { chunk.blocks.splice(chunk.blocks.indexOf(existing), 1); }
          const newBlock = new Block(gx, gy, key);
          chunk.blocks.push(newBlock);
          chunk.blockMap.set(`${gx},${gy}`, newBlock);
        }
      });
    }
  }

  allItems.push({ l: "OVERLAYS", type: 'header', section: 'overlays' });
  if (!state.debugSectionsCollapsed.overlays) {
    for (let key in overlayTypes) {
      allItems.push({ l: key, grid: true, a: () => {
          const { gx, gy } = getSpawnGridCoords();
          const cx = floor(gx / CHUNK_SIZE);
          const cy = floor(gy / CHUNK_SIZE);
          const chunk = state.world.getChunk(cx, cy);
          const existing = chunk.blocks.find((blk: Block) => blk.gx === gx && blk.gy === gy);
          if (existing) { chunk.blocks.splice(chunk.blocks.indexOf(existing), 1); }
          const b = new Block(gx, gy, 'o_dirt');
          chunk.blocks.push(b);
          chunk.blockMap.set(`${gx},${gy}`, b);
          b.overlay = key;
          b.isMined = false;
          if (b.overlay.startsWith('sun')) b.initSunBits(b.overlay);
          const oCfg = overlayTypes[key];
          if (oCfg.minHealth > 0 && oCfg.minHealth > b.health) { b.health = oCfg.minHealth; b.maxHealth = b.health; }
          if (oCfg.enemySpawnConfig) { b.spawnerBudget = oCfg.enemySpawnConfig.budget; }
        }
      });
    }
  }

  // Calculate content height properly for scrolling
  let calculatedH = 0;
  let i_cnt = 0;
  while(i_cnt < allItems.length) {
    const it = allItems[i_cnt];
    if (it.grid) {
      let group = 1;
      while(i_cnt + group < allItems.length && allItems[i_cnt + group].grid) { group++; if(group >= 2) break; }
      i_cnt += group;
    } else {
      i_cnt++;
    }
    calculatedH += btnSpacing;
  }
  calculatedH += 40; // bottom padding

  const maxScroll = Math.min(0, actionsPanelH - calculatedH);
  
  // Smooth Scroll Logic
  if (mouseIsPressed && !isInteractionBlocked && mouseX > debugX && mouseX < debugX + 270 && mouseY > actionsPanelY && mouseY < actionsPanelY + actionsPanelH) {
      state.debugScrollVelocity = (mouseY - (window as any).pmouseY);
  } else {
      state.debugScrollVelocity *= 0.9;
  }
  state.debugScrollY += state.debugScrollVelocity;
  state.debugScrollY = constrain(state.debugScrollY, maxScroll, 0);

  // RENDERING LOOP
  let curY = actionsPanelY + 20 + state.debugScrollY;
  const panelCenterX = debugX + 135;
  const colW = 125;

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const inBounds = curY > actionsPanelY - 50 && curY < actionsPanelY + actionsPanelH + 50;

    if (item.type === 'header') {
      const bx = panelCenterX;
      const isCollapsed = state.debugSectionsCollapsed[item.section];
      let hov = !isInteractionBlocked && mouseX > bx - 130 && mouseX < bx + 130 && mouseY > curY - 12 && mouseY < curY + 12;
      
      if (inBounds) {
        push();
        rectMode(CENTER);
        fill(isCollapsed ? 40 : 80, 150); if (hov) fill(100);
        stroke(255, 50); strokeWeight(1);
        rect(bx, curY, 250, btnH, 4);
        fill(255); textAlign(CENTER, CENTER); textSize(11); 
        text(`${isCollapsed ? '[+]' : '[-]'} ${item.l}`, bx, curY);
        pop();
      }

      if (hov && mouseIsPressed && Math.abs(state.debugScrollVelocity) < 2) { 
          state.debugSectionsCollapsed[item.section] = !isCollapsed;
          (window as any).mouseIsPressed = false; 
      }
      curY += btnSpacing;
    } 
    else if (item.type === 'subheader') {
      if (inBounds) {
          push();
          fill(200, 200, 100); textAlign(LEFT, CENTER); textSize(10);
          text(item.l.toUpperCase(), debugX + 15, curY);
          pop();
      }
      curY += btnSpacing;
    }
    else if (item.grid) {
      let gridGroup = [item];
      while (i + 1 < allItems.length && allItems[i+1].grid) {
        gridGroup.push(allItems[i+1]);
        i++;
        if (gridGroup.length >= 2) break;
      }

      if (inBounds) {
        gridGroup.forEach((gItem, idx) => {
          const bx = panelCenterX + (idx === 0 ? -colW/2 : colW/2);
          const bw = colW - 10;
          let hov = !isInteractionBlocked && mouseX > bx - bw/2 && mouseX < bx + bw/2 && mouseY > curY - 12 && mouseY < curY + 12;
          const isToggle = gItem.type === 'toggle';
          
          push();
          rectMode(CENTER);
          if (isToggle) { fill(gItem.v ? [0, 150, 50] : 40); if(hov) fill(gItem.v ? [0, 200, 70] : 70); }
          else { fill(hov ? 70 : 40); }
          stroke(255, 30); strokeWeight(1);
          rect(bx, curY, bw, btnH, 4);
          fill(220); textAlign(CENTER, CENTER); textSize(9); 
          text(gItem.l, bx, curY);
          pop();

          if (hov && mouseIsPressed && Math.abs(state.debugScrollVelocity) < 2) { 
              gItem.a(); 
              (window as any).mouseIsPressed = false; 
          }
        });
      }
      curY += btnSpacing;
    }
    else {
      const bx = panelCenterX;
      const bw = 250;
      let hov = !isInteractionBlocked && mouseX > bx - bw/2 && mouseX < bx + bw/2 && mouseY > curY - 12 && mouseY < curY + 12;
      const isToggle = item.type === 'toggle';

      if (inBounds) {
        push();
        rectMode(CENTER);
        if (isToggle) { fill(item.v ? [0, 150, 50] : 40); if(hov) fill(item.v ? [0, 200, 70] : 70); }
        else { fill(item.v ? 70 : 40); }
        stroke(255, 50); strokeWeight(1);
        rect(bx, curY, bw, btnH, 4);
        fill(220); textAlign(CENTER, CENTER); textSize(10); 
        text(item.l, bx, curY);
        pop();
      }

      if (hov && mouseIsPressed && Math.abs(state.debugScrollVelocity) < 2) { 
          item.a(); 
          (window as any).mouseIsPressed = false; 
      }
      curY += btnSpacing;
    }
  }

  dc.restore();

  if (calculatedH > actionsPanelH) {
      const sbW = 6;
      const sbX = debugX + 270 - sbW - 5;
      const sbH = actionsPanelH;
      fill(255, 20); noStroke();
      rect(sbX, actionsPanelY, sbW, sbH, 3);
      const handleH = (actionsPanelH / calculatedH) * actionsPanelH;
      const handleY = actionsPanelY + map(state.debugScrollY, 0, maxScroll, 0, actionsPanelH - handleH);
      fill(0, 255, 150, 150);
      rect(sbX, handleY, sbW, handleH, 3);
  }
  pop();
}

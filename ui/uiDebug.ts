
// Added p5.js global variable declarations to avoid TS errors
import { state } from '../state';
import { GRID_SIZE, LEVEL_THRESHOLDS, HOUR_FRAMES, CHUNK_SIZE } from '../constants';
import { worldGenConfig, requestSpawn, AlmanacProgression } from '../lvDemo';
import { liquidTypes, LIQUID_KEYS, LIQUID_WEIGHTS } from '../balanceLiquids';
import { obstacleTypes, overlayTypes, BLOCK_WEIGHTS } from '../balanceObstacles';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { enemyTypes } from '../balanceEnemies';
import { npcTypes } from '../balanceNPC';
import { turretTypes } from '../balanceTurrets';
import { recalculateAllStats } from '../src/upgrades';
import { Explosion } from '../vfx/index';
import { Bullet, GroundFeature, NPCEntity, LootEntity } from '../entities';
import { spawnLootAt } from '../economy';
import { Block } from '../world';
import { ROOM_PREFABS } from '../dictionaryRoomPrefab';
import { generateRoomDirectorData } from '../debug/roomDirectorGenerator';
import { saveLevelLayout } from '../levelManager';
import { uiComponentsShowcase } from './uiComponentsShowcase';
import { drawButton, drawDarkButton, drawGreenButton, drawCyanButton, drawRedButton, registerUIHitbox, setUILayer } from '../uiComponents';
import { poolRegistry } from '../class/pool';
import { soundEngine } from '../src/audio/soundEngine';
import { generateUpgradeOptions } from './almanac/turretUnlockTree';
import { 
  WORLD_GEN_CELLULAR_CONFIG, 
  CELL_LAYERS, 
  CELL_LAYER_MAP,
  AIR_CUTOFF_PER_LEVEL,
  CellLayerKey
} from '../worldgen/cellTypes';
import { getMultiLayerCellAt, getCellAt, hash2DFloat } from '../worldgen/cellularNoise';

// p5.js global variable declarations

function updateWorldPreviewBuffer() {
  const tiles = 144;
  const pixelSize = 3;
  const bufferSize = tiles * pixelSize; // 432x432

  if (!state.worldPreviewBuffer) {
    state.worldPreviewBuffer = createGraphics(bufferSize, bufferSize);
    state.worldPreviewBuffer.pixelDensity(1);
  }

  const pg = state.worldPreviewBuffer;
  pg.rectMode(CORNER);
  pg.imageMode(CORNER);
  pg.noStroke();
  pg.background(12, 14, 24);

  const lv = floor(constrain(state.currentChunkLevel, 0, 10));
  const previewAtOrigin = (state as any).worldPreviewAtOrigin !== false;
  const cx = previewAtOrigin ? 8 : floor((state.player?.pos?.x || 0) / GRID_SIZE);
  const cy = previewAtOrigin ? 8 : floor((state.player?.pos?.y || 0) / GRID_SIZE);
  const seed = WORLD_GEN_CELLULAR_CONFIG.worldSeed || 4242;

  const halfTiles = floor(tiles / 2);

  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      const gx = cx - halfTiles + x;
      const gy = cy - halfTiles + y;

      // Check spawn clear radius at origin (chunk 0,0 center at 8,8)
      if (gx >= 0 && gx < 16 && gy >= 0 && gy < 16 && dist(gx, gy, 8, 8) < worldGenConfig.spawnClearRadius) {
        continue;
      }

      const cellInfo = getMultiLayerCellAt(gx, gy, lv, seed);

      if (cellInfo.isLiquid && cellInfo.material) {
        // Lake / Ice Liquid Cell
        if (cellInfo.material === 'l_ice') {
          pg.fill(160, 205, 255); // Ice mantle/core
        } else {
          pg.fill(35, 95, 225); // Water body
        }
        pg.rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

        // Shoreline / Shell / Lake Core overlay indicator
        if (cellInfo.overlay) {
          if (overlayTypes[cellInfo.overlay]?.isEnemySpawner) {
            pg.fill(225, 45, 240); // Spawner purple
          } else {
            pg.fill(240, 210, 160); // Shell / ice mineral
          }
          pg.rect(x * pixelSize + 0.5, y * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);
        }
      } else if (cellInfo.hasSolidTile && cellInfo.material) {
        // Solid Cell (Tree / Dirt / Clay / Stone)
        const colorCfg = obstacleTypes[cellInfo.material]?.color || [60, 180, 80];
        pg.fill(colorCfg[0], colorCfg[1], colorCfg[2]);
        pg.rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

        // Core Nucleus Feature Overlays
        if (cellInfo.overlay) {
          if (overlayTypes[cellInfo.overlay]?.isEnemySpawner) {
            pg.fill(225, 45, 240); // Core Spawner purple
            pg.rect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          } else {
            pg.fill(255, 225, 70); // Core Sparkling Gold Ore
            pg.rect(x * pixelSize + 0.5, y * pixelSize + 0.5, pixelSize - 1, pixelSize - 1);
          }
        }
      }
    }
  }

  // Draw Chunk Boundary Grid overlay on the preview with proper modulo
  pg.stroke(255, 255, 255, 30);
  pg.strokeWeight(1);
  const startGX = cx - halfTiles;
  const startGY = cy - halfTiles;
  for (let x = 0; x <= tiles; x++) {
    const gx = startGX + x;
    const mod = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (mod === 0) {
      const px = x * pixelSize;
      pg.line(px, 0, px, bufferSize);
    }
  }
  for (let y = 0; y <= tiles; y++) {
    const gy = startGY + y;
    const mod = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (mod === 0) {
      const py = y * pixelSize;
      pg.line(0, py, bufferSize, py);
    }
  }

  // Center player/origin marker
  const markerX = previewAtOrigin ? (bufferSize / 2) : (bufferSize / 2);
  const markerY = previewAtOrigin ? (bufferSize / 2) : (bufferSize / 2);
  pg.noStroke();
  pg.fill(255, 255, 255, 230);
  pg.ellipse(markerX, markerY, 7, 7);
  pg.stroke(255, 60, 60);
  pg.strokeWeight(1.5);
  pg.line(markerX - 5, markerY, markerX + 5, markerY);
  pg.line(markerX, markerY - 5, markerX, markerY + 5);

  state.worldPreviewNeedsUpdate = false;
}

export function drawWorldGenPreview() {
  if (!state.showWorldGenPreview) return;

  if (state.worldPreviewNeedsUpdate) {
    updateWorldPreviewBuffer();
  }

  setUILayer(150);

  push();
  rectMode(CORNER);
  imageMode(CORNER);

  // Backdrop
  fill(5, 7, 15, 220);
  noStroke();
  rect(0, 0, width, height);

  // Responsive modal sizing
  const modalW = Math.min(1000, width - 30);
  const modalH = Math.min(680, height - 30);
  const mx = Math.floor((width - modalW) / 2);
  const my = Math.floor((height - modalH) / 2);

  // Modal Container
  fill(16, 20, 34);
  stroke(54, 62, 114);
  strokeWeight(2);
  rect(mx, my, modalW, modalH, 14);

  // Header Title
  fill(0, 231, 226);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(16);
  text("CELLULAR WORLD GENERATION & REGION PREVIEW", mx + 24, my + 26);

  // Close button using UIComponents (clean onClick, no hover auto-trigger)
  drawRedButton(mx + modalW - 48, my + 14, 32, 28, "✕", {
    id: 'btn_worldgen_preview_close',
    fontSize: 14,
    radius: 6,
    onClick: () => {
      state.showWorldGenPreview = false;
    }
  });

  // --- TOP BAR: LEVEL BUCKET SELECTOR ---
  const lvRowX = mx + 24;
  const lvRowY = my + 48;
  fill(175, 180, 195);
  textSize(11);
  textAlign(LEFT, CENTER);
  text("Level Bucket:", lvRowX, lvRowY + 12);

  const btnW = 32;
  const btnH = 24;
  for (let i = 0; i <= 10; i++) {
    const bx = lvRowX + 80 + i * (btnW + 4);
    const isCur = state.currentChunkLevel === i;
    drawButton(bx, lvRowY, btnW, btnH, `${i}`, {
      id: `btn_wgen_lv_${i}`,
      variant: isCur ? 'cyan' : 'dark',
      fontSize: 11,
      radius: 6,
      onClick: () => {
        state.currentChunkLevel = i;
        state.worldPreviewNeedsUpdate = true;
      }
    });
  }

  // --- LEFT PANEL: CANVAS PREVIEW & LEGEND ---
  const mapAreaSize = 432;
  const px = mx + 24;
  const py = my + 86;

  // Explicitly ensure modes before rendering frame and buffer
  rectMode(CORNER);
  imageMode(CORNER);

  // Canvas Frame
  fill(10, 12, 20);
  stroke(40, 47, 96);
  strokeWeight(2);
  rect(px - 2, py - 2, mapAreaSize + 4, mapAreaSize + 4, 8);

  if (state.worldPreviewBuffer) {
    image(state.worldPreviewBuffer, px, py, mapAreaSize, mapAreaSize);
  }

  // Legend Box under Preview
  const legendY = py + mapAreaSize + 10;
  const legendW = mapAreaSize;
  const legendH = modalH - (legendY - my) - 16;
  fill(12, 15, 26);
  stroke(30, 36, 68);
  rect(px, legendY, legendW, legendH, 8);

  const legendItems = [
    { name: 'Tree Cell', color: [34, 139, 34], sub: 'Bush (4-8) Lv0-2' },
    { name: 'Dirt Batch', color: [40, 180, 80], sub: 'Dirt (6-20) Lv0-4' },
    { name: 'Clay Batch', color: [220, 120, 60], sub: 'Clay (6-20) Lv1-5' },
    { name: 'Stone Batch', color: [80, 60, 200], sub: 'Stone (6-20) Lv3-6' },
    { name: 'Lake Cell', color: [30, 80, 220], sub: 'Water (12-30) Lv3-8' }
  ];

  const colW = Math.floor(legendW / 5);
  for (let i = 0; i < legendItems.length; i++) {
    const item = legendItems[i];
    const lx = px + i * colW + 6;
    const ly = legendY + 8;
    fill(item.color[0], item.color[1], item.color[2]);
    noStroke();
    rect(lx, ly, 10, 10, 2);
    fill(255);
    textSize(9);
    textAlign(LEFT, TOP);
    text(item.name, lx + 14, ly - 1);
    fill(140, 150, 175);
    textSize(8);
    text(item.sub, lx, ly + 13);
  }

  // --- RIGHT PANEL: TUNING CONTROLS & ROOM DIRECTOR ---
  const sideX = px + mapAreaSize + 24;
  const sideW = modalW - (sideX - mx) - 24;
  let sy = my + 86;

  // Tuning Heading
  fill(255, 194, 0);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text("WORLD GEN PARAMETERS", sideX, sy);
  sy += 22;

  // Sparsity / Supergrid Scale
  fill(200, 210, 230);
  textSize(10);
  text(`Cell Scale (Sparsity): ${WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier.toFixed(2)}x`, sideX, sy);
  drawDarkButton(sideX + sideW - 85, sy - 4, 38, 22, "-0.1x", {
    id: 'btn_scale_minus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier = Math.max(0.5, WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier - 0.1);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  drawDarkButton(sideX + sideW - 42, sy - 4, 38, 22, "+0.1x", {
    id: 'btn_scale_plus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier = Math.min(3.0, WORLD_GEN_CELLULAR_CONFIG.superGridMultiplier + 0.1);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  sy += 28;

  // Air Corridor Cutoff (Corridor Width / Cavity density)
  const lv = floor(constrain(state.currentChunkLevel, 0, 10));
  const curAirBase = AIR_CUTOFF_PER_LEVEL[lv] ?? 0.35;
  const curAirEff = Math.max(0.05, Math.min(0.85, curAirBase + WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset));
  fill(200, 210, 230);
  text(`Air Cutoff (Corridors): ${curAirEff.toFixed(2)} (Lv${lv})`, sideX, sy);
  drawDarkButton(sideX + sideW - 85, sy - 4, 38, 22, "-0.03", {
    id: 'btn_air_minus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset = Math.max(-0.25, WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset - 0.03);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  drawDarkButton(sideX + sideW - 42, sy - 4, 38, 22, "+0.03", {
    id: 'btn_air_plus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset = Math.min(0.25, WORLD_GEN_CELLULAR_CONFIG.globalAirCutoffOffset + 0.03);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  sy += 28;

  // Core Ore & Feature Frequency Multiplier
  fill(200, 210, 230);
  text(`Core Feature Multiplier: ${WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier.toFixed(2)}x`, sideX, sy);
  drawDarkButton(sideX + sideW - 85, sy - 4, 38, 22, "-0.1x", {
    id: 'btn_ore_minus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier = Math.max(0.2, WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier - 0.1);
      WORLD_GEN_CELLULAR_CONFIG.spawnerChanceMultiplier = WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier;
      state.worldPreviewNeedsUpdate = true;
    }
  });
  drawDarkButton(sideX + sideW - 42, sy - 4, 38, 22, "+0.1x", {
    id: 'btn_ore_plus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier = Math.min(3.0, WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier + 0.1);
      WORLD_GEN_CELLULAR_CONFIG.spawnerChanceMultiplier = WORLD_GEN_CELLULAR_CONFIG.oreChanceMultiplier;
      state.worldPreviewNeedsUpdate = true;
    }
  });
  sy += 28;

  // Organic Jitter Amplitude
  fill(200, 210, 230);
  text(`Boundary Organic Jitter: ${WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp.toFixed(2)}`, sideX, sy);
  drawDarkButton(sideX + sideW - 85, sy - 4, 38, 22, "-0.02", {
    id: 'btn_jitter_minus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp = Math.max(0.0, WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp - 0.02);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  drawDarkButton(sideX + sideW - 42, sy - 4, 38, 22, "+0.02", {
    id: 'btn_jitter_plus', fontSize: 9, radius: 4,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp = Math.min(0.25, WORLD_GEN_CELLULAR_CONFIG.boundaryJitterAmp + 0.02);
      state.worldPreviewNeedsUpdate = true;
    }
  });
  sy += 34;

  // Seed & Center View / Re-render Buttons
  const seedBtnW = Math.floor((sideW - 8) / 2);
  drawGreenButton(sideX, sy, seedBtnW, 26, `🎲 Seed: ${WORLD_GEN_CELLULAR_CONFIG.worldSeed}`, {
    id: 'btn_wgen_seed', fontSize: 10, radius: 6,
    onClick: () => {
      WORLD_GEN_CELLULAR_CONFIG.worldSeed = Math.floor(Math.random() * 90000) + 1000;
      state.worldPreviewNeedsUpdate = true;
    }
  });

  const previewAtOrigin = (state as any).worldPreviewAtOrigin !== false;
  drawCyanButton(sideX + seedBtnW + 8, sy, seedBtnW, 26, previewAtOrigin ? "📍 Center: (0,0)" : "🧑 Center: Player", {
    id: 'btn_wgen_center_toggle', fontSize: 10, radius: 6,
    onClick: () => {
      (state as any).worldPreviewAtOrigin = !previewAtOrigin;
      state.worldPreviewNeedsUpdate = true;
    }
  });
  sy += 38;

  // --- ROOM DIRECTOR SECTION ---
  fill(255, 194, 0);
  textSize(12);
  text("ROOM DIRECTOR CHAIN", sideX, sy);
  sy += 20;

  const genChainW = sideW - 55;
  drawDarkButton(sideX, sy, genChainW, 26, "⚡ Generate Room Chain", {
    id: 'btn_wgen_gen_chain', fontSize: 10, radius: 6,
    onClick: () => {
      state.roomDirectorData = generateRoomDirectorData();
      state.roomDirectorChain = state.roomDirectorData.split('-');
      state.roomDirectorScrollY = 0;
    }
  });

  // Copy Button
  drawCyanButton(sideX + genChainW + 6, sy, 48, 26, "Copy", {
    id: 'btn_wgen_copy_chain', fontSize: 10, radius: 6,
    onClick: () => {
      if (state.roomDirectorData) {
        navigator.clipboard.writeText(state.roomDirectorData);
      }
    }
  });
  sy += 32;

  // Room Director Output Text Box
  const holderH = modalH - (sy - my) - 20;
  fill(12, 15, 26);
  stroke(30, 36, 68);
  rect(sideX, sy, sideW, holderH, 8);

  if (state.roomDirectorData) {
    const dc = (window as any).drawingContext;
    dc.save();
    dc.beginPath();
    dc.rect(sideX + 2, sy + 2, sideW - 4, holderH - 4);
    dc.clip();

    push();
    textSize(9);
    textAlign(LEFT, TOP);
    const wrapW = sideW - 20;
    const charPerLine = Math.floor(wrapW / 5.5);
    const estimatedLines = Math.ceil(state.roomDirectorData.length / charPerLine) + 4;
    const textHeight = estimatedLines * 11 + 20;
    const maxScroll = Math.min(0, holderH - textHeight);

    if (mouseIsPressed && mouseX > sideX && mouseX < sideX + sideW && mouseY > sy && mouseY < sy + holderH) {
      state.roomDirectorScrollVelocity = (mouseY - (window as any).pmouseY);
    } else {
      state.roomDirectorScrollVelocity *= 0.9;
    }
    state.roomDirectorScrollY = constrain(state.roomDirectorScrollY + state.roomDirectorScrollVelocity, maxScroll, 0);

    fill(180, 255, 180);
    text(state.roomDirectorData, sideX + 10, sy + 10 + state.roomDirectorScrollY, wrapW);
    pop();

    dc.restore();
  } else {
    fill(120, 130, 150);
    textAlign(CENTER, CENTER);
    textSize(10);
    text("Click Generate Room Chain to preview sequence", sideX + sideW / 2, sy + holderH / 2);
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
      { l: "Player Gizmo", v: state.showPlayerGizmos, a: () => state.showPlayerGizmos = !state.showPlayerGizmos, type: 'toggle', grid: true },
      { l: "WORLD PREV", v: state.showWorldGenPreview, a: () => { state.showWorldGenPreview = !state.showWorldGenPreview; state.worldPreviewNeedsUpdate = true; }, type: 'toggle', grid: true },
      { l: "+1k ALL", a: () => { 
        state.sunCurrency += 1000; 
        state.soilCurrency += 1000; 
        state.elixirCurrency += 1000; 
        state.raisinCurrency += 1000; 
        state.leafCurrency += 1000;
        state.shardCurrency += 1000;
        state.shellCurrency += 1000;
        state.fuelCurrency += 1000;
        state.iceCurrency += 1000;
      }, grid: true },
      { l: "WARP 12H", a: () => state.timeWarpRemaining = 60, grid: true },
      { l: "SPEED 0.1", a: () => { state.requestedGameSpeed = 0.1; state.gameSpeed = 0.1; }, grid: true },
      { l: "CLEAR BLOCK", a: () => {
        const b = Bullet.create(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_blocks', 'none');
        b.life = 0; 
        state.bullets.push(b);
      }, grid: true},
      { l: "CLEAR ENEMY", a: () => {
        const b = Bullet.create(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_enemies', 'none');
        b.life = 0; 
        state.bullets.push(b);
      }, grid: true},
      { l: "SPAWN WAVE", a: () => spawnFromBudget(state.currentNightWaveBudget), grid: true },
      { l: "SaveLevelLayout", a: () => saveLevelLayout(), grid: true },
      { l: "Perf HUD", v: state.showPerfOverlay, a: () => state.showPerfOverlay = !state.showPerfOverlay, type: 'toggle', grid: true },
      { l: "Audio Info", v: state.showAudioDebugOverlay, a: () => state.showAudioDebugOverlay = !state.showAudioDebugOverlay, type: 'toggle', grid: true },
      { l: "SHOW UI COMPONENTS", a: () => uiComponentsShowcase.open(), grid: false }
    );
  }

  // Audio System Header
  allItems.push({ l: "AUDIO SYSTEM", type: 'header', section: 'audio' });
  if (!state.debugSectionsCollapsed.audio) {
    const audioInfo = soundEngine.getDebugInfo();
    allItems.push(
      { l: "Audio Info HUD", v: state.showAudioDebugOverlay, a: () => state.showAudioDebugOverlay = !state.showAudioDebugOverlay, type: 'toggle', grid: true },
      { l: `State: ${audioInfo.ctxState} (${audioInfo.buffersLoaded})`, type: 'infoText' },
      { l: `Playing: ${audioInfo.musicPlaying}`, type: 'infoText' },
      { l: `Vol: Music=${audioInfo.musicVolume}% | SFX=${audioInfo.sfxVolume}%`, type: 'infoText' },
      { l: `Tense Layer: ${(audioInfo.tenseVolume * 100).toFixed(0)}% | Birds: ${(audioInfo.birdsVolume * 100).toFixed(0)}%`, type: 'infoText' },
      { l: "TEST SFX TRIGGERS", type: 'subheader' },
      { l: "Hit Enemy", a: () => soundEngine.playSFXGroup('projectile_hit_enemy'), grid: true },
      { l: "Hit Block", a: () => soundEngine.playSFXGroup('projectile_hit_block'), grid: true },
      { l: "Enemy Death", a: () => soundEngine.playSFXGroup('enemy_death'), grid: true },
      { l: "Shoot Light", a: () => soundEngine.playSFXGroup('shoot_light'), grid: true },
      { l: "Collect Sun", a: () => soundEngine.playSFX('collect_sun'), grid: true },
      { l: "Turret Bite", a: () => soundEngine.playSFXGroup('turret_bitten_softbody'), grid: true }
    );
  }

  // Performance & Pools Header
  allItems.push({ l: "PERFORMANCE & POOLS", type: 'header', section: 'perf' });
  if (!state.debugSectionsCollapsed.perf) {
    allItems.push(
      { l: "Perf HUD", v: state.showPerfOverlay, a: () => state.showPerfOverlay = !state.showPerfOverlay, type: 'toggle', grid: true },
      { l: "Reset Peaks", a: () => poolRegistry.resetAllPeaks(), grid: true },
      { l: "Trim Pools", a: () => poolRegistry.trimAll(), grid: false }
    );

    allItems.push({ l: "OBJECT POOLS METRICS", type: 'subheader' });
    const allPools = poolRegistry.getAll().slice().sort((a, b) => (b.activeCount + b.peakActive) - (a.activeCount + a.peakActive));
    for (const p of allPools) {
      const stats = p.getStats();
      allItems.push({
        l: `${p.name}: Act ${stats.active} / Peak ${stats.peakActive} (Pool: ${stats.inPool})`,
        type: 'infoText',
        highlight: stats.active > 0,
        active: stats.active,
        peak: stats.peakActive,
        inPool: stats.inPool,
        total: stats.totalCreated
      });
    }
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
        AlmanacProgression.UnlockedByDiscoverTurret.forEach((key: string) => {
          if (!state.unlockedTurrets.includes(key)) state.unlockedTurrets.push(key);
        });
      }, grid: true },
      { l: "RollTurretUpgrade", a: () => {
        let options = generateUpgradeOptions(true);
        if (options.length === 0) {
          options = generateUpgradeOptions(false);
        }
        if (options.length > 0) {
          state.turretUnlockChoiceModal = {
            type: 'upgrade',
            nodeId: 'debug_node',
            options,
            openedAtFrame: typeof frameCount !== 'undefined' ? frameCount : (state.frames || 0)
          };
        }
      }, grid: true },
      { l: "Turret Gizmo", v: state.debugGizmosTurrets, a: () => state.debugGizmosTurrets = !state.debugGizmosTurrets, type: 'toggle', grid: true },
      { l: "DrawTurretPath", v: state.debugDrawTurretPath, a: () => state.debugDrawTurretPath = !state.debugDrawTurretPath, type: 'toggle', grid: true },
      { l: "CLEAR TURRET", a: () => {
        const b = Bullet.create(state.player.pos.x, state.player.pos.y, state.player.pos.x, state.player.pos.y, 'b_cheat_destroyTurret', 'none');
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
            spawnLootAt(state.player.pos.x, state.player.pos.y, key);
        }});
    }
  }

  // CHUNK ACTIONS Header
  allItems.push({ l: "CHUNKS", type: 'header', section: 'chunks' });
  if (!state.debugSectionsCollapsed.chunks) {
    allItems.push(
      { l: "Show Borders", v: state.showChunkBorders, a: () => state.showChunkBorders = !state.showChunkBorders, type: 'toggle', grid: true },
      { l: "Show Outlines", v: state.showObstacleOutline, a: () => {
        state.showObstacleOutline = !state.showObstacleOutline;
        state.world.chunks.forEach((c: any) => c.needsRedraw = true);
      }, type: 'toggle', grid: true },
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
          state.world.dirtyChunkAndNeighbors(cx, cy);
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
          b.setOverlay(key);
          b.isMined = false;
          state.world.dirtyChunkAndNeighbors(cx, cy);
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
      calculatedH += btnSpacing;
    } else if (it.type === 'infoText') {
      i_cnt++;
      calculatedH += 18;
    } else {
      i_cnt++;
      calculatedH += btnSpacing;
    }
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
      const isCollapsed = state.debugSectionsCollapsed[item.section];
      
      if (inBounds) {
        drawButton(panelCenterX - 125, curY - 11, 250, 22, `${isCollapsed ? '[+]' : '[-]'} ${item.l}`, {
          id: `dbg_hdr_${item.section}`,
          variant: isCollapsed ? 'dark' : 'cyan',
          isSelected: !isCollapsed,
          fontSize: 10.5,
          radius: 4,
          depth3D: 1,
          onClick: () => {
            if (Math.abs(state.debugScrollVelocity) < 2) {
              state.debugSectionsCollapsed[item.section] = !isCollapsed;
            }
          }
        });
      }
      curY += btnSpacing;
    } 
    else if (item.type === 'subheader') {
      if (inBounds) {
        push();
        noStroke();
        fill(220, 220, 120);
        textAlign(LEFT, CENTER);
        textSize(10);
        textStyle(NORMAL);
        text(item.l.toUpperCase(), debugX + 15, curY);
        pop();
      }
      curY += btnSpacing;
    }
    else if (item.type === 'infoText') {
      if (inBounds) {
        push();
        noStroke();
        fill(item.highlight ? color(100, 255, 200) : color(160, 175, 190));
        textAlign(LEFT, CENTER);
        textSize(8.5);
        textStyle(NORMAL);
        text(item.l, debugX + 15, curY);
        pop();
      }
      curY += 18;
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
          const isToggle = gItem.type === 'toggle';
          
          drawButton(bx - bw / 2, curY - 11, bw, 22, gItem.l, {
            id: `dbg_btn_${i}_${idx}`,
            variant: isToggle ? (gItem.v ? 'green' : 'dark') : 'dark',
            isSelected: isToggle && !!gItem.v,
            fontSize: 8.5,
            radius: 4,
            depth3D: 1,
            onClick: () => {
              if (Math.abs(state.debugScrollVelocity) < 2) {
                gItem.a();
              }
            }
          });
        });
      }
      curY += btnSpacing;
    }
    else {
      const isToggle = item.type === 'toggle';

      if (inBounds) {
        drawButton(panelCenterX - 125, curY - 11, 250, 22, item.l, {
          id: `dbg_btn_${i}`,
          variant: isToggle ? (item.v ? 'green' : 'dark') : 'dark',
          isSelected: isToggle && !!item.v,
          fontSize: 9.5,
          radius: 4,
          depth3D: 1,
          onClick: () => {
            if (Math.abs(state.debugScrollVelocity) < 2) {
              item.a();
            }
          }
        });
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

  if (state.showPerfOverlay) {
    drawPerfOverlay();
  }

  if (state.showAudioDebugOverlay) {
    drawAudioDebugOverlay();
  }
}

export function drawAudioDebugOverlay() {
  if (!state.showAudioDebugOverlay) return;

  push();
  const info = soundEngine.getDebugInfo();
  const ox = 10;
  const perfH = state.showPerfOverlay ? (150 + Math.min(7, poolRegistry.getAll().length) * 20 + 15) : 0;
  const oy = state.showPerfOverlay ? (110 + perfH + 10) : 110;
  const ow = 285;
  const sfxCount = info.recentSFX ? info.recentSFX.length : 0;
  const cardH = 175 + (sfxCount > 0 ? sfxCount * 17 : 20);

  // Background Card
  fill(14, 18, 32, 235);
  stroke(70, 140, 255, 180);
  strokeWeight(1.5);
  rect(ox, oy, ow, cardH, 8);

  // Header Title
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(NORMAL);
  noStroke();
  fill(80, 220, 255);
  text("🎵 AUDIO ENGINE HUD", ox + 10, oy + 10);

  let py = oy + 30;
  textSize(10.5);
  fill(210, 225, 255);

  // Audio Context & Buffers
  text(`Context: ${info.ctxState.toUpperCase()} | Loaded: ${info.buffersLoaded}`, ox + 10, py); py += 16;
  
  // BGM
  fill(120, 255, 160);
  text(`BGM: ${info.musicPlaying}`, ox + 10, py); py += 16;

  // Master & Multipliers
  fill(240, 245, 255);
  text(`Music: ${info.musicVolume}%  |  SFX: ${info.sfxVolume}%`, ox + 10, py); py += 16;
  text(`Tense Multiplier: ${(info.tenseVolume * 100).toFixed(0)}%  |  Birds: ${(info.birdsVolume * 100).toFixed(0)}%`, ox + 10, py); py += 18;

  // Divider
  stroke(255, 255, 255, 30);
  line(ox + 8, py, ox + ow - 8, py);
  noStroke();
  py += 6;

  // Recent SFX
  fill(255, 215, 90);
  text("RECENT SFX TRIGGERED:", ox + 10, py); py += 16;

  if (sfxCount === 0) {
    fill(140, 155, 180);
    text("No SFX triggered yet", ox + 10, py);
  } else {
    const now = Date.now();
    for (const sfx of info.recentSFX) {
      const ageSec = Math.max(0, (now - sfx.time) / 1000).toFixed(1);
      fill(255, 255, 255, 220);
      text(`• ${sfx.name} (${ageSec}s ago, vol: ${(sfx.volume * 100).toFixed(0)}%)`, ox + 10, py);
      py += 17;
    }
  }

  pop();
}

export function drawPerfOverlay() {
  if (!state.showPerfOverlay) return;

  push();
  const ox = 10;
  const oy = 110;
  const ow = 265;

  // Gather system metrics
  const fps = typeof frameRate === 'function' ? frameRate() : 60;
  const frameTimeMs = fps > 0 ? (1000 / fps).toFixed(1) : '16.6';

  const enemyCount = state.enemies ? state.enemies.length : 0;
  const bulletCount = state.bullets ? state.bullets.length : 0;
  const vfxCount = state.vfx ? state.vfx.length : 0;
  const uiVfxCount = state.uiVfx ? state.uiVfx.length : 0;
  const attachedTurretsCount = state.player?.attachments ? state.player.attachments.length : 0;
  let worldTurretsCount = 0;
  let worldLootCount = 0;
  let activeChunksCount = 0;

  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      activeChunksCount++;
      if (chunk.turrets) worldTurretsCount += chunk.turrets.length;
      if (chunk.loot) worldLootCount += chunk.loot.length;
    });
  }

  const spatialBucketsCount = state.spatialGrid ? state.spatialGrid.activeCellCount || 0 : 0;

  // Pools sorted by highest activity/peak load
  const pools = poolRegistry.getAll().slice().sort((a, b) => (b.activeCount + b.peakActive) - (a.activeCount + a.peakActive));
  const topPools = pools.slice(0, 7);

  const totalPoolsActive = pools.reduce((sum, p) => sum + p.activeCount, 0);
  const totalPoolsIdle = pools.reduce((sum, p) => sum + p.size, 0);
  const totalPoolsCreated = pools.reduce((sum, p) => sum + p.totalCreated, 0);

  const cardH = 150 + topPools.length * 20;

  // Background card
  fill(12, 16, 26, 230);
  stroke(40, 70, 110, 180);
  strokeWeight(1.5);
  rect(ox, oy, ow, cardH, 8);

  // Header Title
  noStroke();
  fill(0, 255, 200);
  textAlign(LEFT, TOP);
  textSize(12);
  textStyle(NORMAL);
  text("ENGINE DIAGNOSTICS & PROFILER", ox + 10, oy + 8);

  // FPS & Frame Time
  let fpsColor = color(100, 255, 120);
  if (fps < 45) fpsColor = color(255, 200, 50);
  if (fps < 30) fpsColor = color(255, 80, 80);

  fill(fpsColor);
  textSize(13);
  text(`${Math.round(fps)} FPS`, ox + 10, oy + 26);
  fill(160, 180, 200);
  textSize(10);
  text(`(${frameTimeMs} ms/f)`, ox + 70, oy + 28);

  // Active Entities Grid
  let ey = oy + 46;
  fill(255, 255, 255, 220);
  textSize(9.5);
  text(`Bullets: ${bulletCount} | VFX: ${vfxCount + uiVfxCount} | Enemies: ${enemyCount}`, ox + 10, ey); ey += 14;
  text(`Loot: ${worldLootCount} | Turrets: ${attachedTurretsCount + worldTurretsCount} | Chunks: ${activeChunksCount}`, ox + 10, ey); ey += 14;
  text(`Spatial Grid Buckets: ${spatialBucketsCount}`, ox + 10, ey); ey += 18;

  // Divider
  stroke(255, 255, 255, 30);
  line(ox + 8, ey, ox + ow - 8, ey);
  noStroke();
  ey += 6;

  // Pools Header
  fill(255, 220, 100);
  textSize(10);
  text(`POOLS (Active: ${totalPoolsActive} | Idle: ${totalPoolsIdle} | Inst: ${totalPoolsCreated})`, ox + 10, ey);
  ey += 16;

  // Top Pools Render
  for (const p of topPools) {
    const stats = p.getStats();
    const isUnderLoad = stats.active > 0;
    
    // Label
    fill(isUnderLoad ? color(255, 255, 255) : color(150, 160, 170));
    textSize(9);
    textAlign(LEFT, CENTER);
    text(p.name, ox + 10, ey);

    // Active / Peak / InPool text
    textAlign(RIGHT, CENTER);
    fill(isUnderLoad ? color(100, 255, 200) : color(120, 130, 140));
    text(`Act:${stats.active} Pk:${stats.peakActive} [${stats.inPool}]`, ox + ow - 10, ey);

    // Mini Gauge bar
    const barX = ox + 105;
    const barY = ey - 3;
    const barW = 50;
    const barH = 6;
    fill(255, 255, 255, 20);
    rect(barX, barY, barW, barH, 2);
    
    const peakMax = Math.max(1, stats.peakActive, stats.totalCreated);
    const activeFillW = constrain((stats.active / peakMax) * barW, 0, barW);
    fill(isUnderLoad ? color(0, 230, 180) : color(60, 100, 120));
    rect(barX, barY, activeFillW, barH, 2);

    ey += 18;
  }

  pop();
}

export function drawTurretPathDebug() {
  if (!state.player || !state.debugDrawTurretPath) return;

  push();

  // 1. Draw Player Breadcrumb Trail
  const trail = state.playerTrail || [];
  if (trail.length > 0) {
    // Draw connecting polyline through trail
    noFill();
    stroke(0, 220, 255, 140);
    strokeWeight(2);
    for (let i = 0; i < trail.length - 1; i++) {
      const p1 = trail[i];
      const p2 = trail[i + 1];
      line(p1.x, p1.y, p2.x, p2.y);
    }

    // Connect newest trail point to player pos
    const lastTrail = trail[trail.length - 1];
    stroke(255, 220, 0, 180);
    strokeWeight(2);
    line(lastTrail.x, lastTrail.y, state.player.pos.x, state.player.pos.y);

    // Draw individual breadcrumb points
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const ratio = i / Math.max(1, trail.length - 1);
      
      // Color from violet (oldest) to cyan/lime (newest)
      const r = floor(lerp(180, 50, ratio));
      const g = floor(lerp(80, 240, ratio));
      const b = floor(lerp(255, 180, ratio));

      fill(r, g, b, 220);
      stroke(255, 255, 255, 100);
      strokeWeight(1);
      ellipse(p.x, p.y, 8, 8);

      // Index label on every point or step
      fill(255, 230);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(8);
      text(`${i}`, p.x, p.y - 8);
    }

    // Tail marker
    fill(255, 100, 100);
    noStroke();
    textAlign(CENTER, BOTTOM);
    textSize(8);
    text(`[TAIL 0]`, trail[0].x, trail[0].y - 12);
  }

  // 2. Draw Player Marker
  push();
  noFill();
  stroke(255, 235, 90, 180);
  strokeWeight(1.5);
  ellipse(state.player.pos.x, state.player.pos.y, state.player.size + 10);
  fill(255, 235, 90);
  noStroke();
  textAlign(CENTER, BOTTOM);
  textSize(9);
  const countdownStr = state.trailFadeTimer > 0 ? ` (fade in ${(state.trailFadeTimer / 60).toFixed(1)}s)` : '';
  const statusStr = state.isStationary ? `[STATIONARY${countdownStr}]` : "[MOVING]";
  text(`Player ${statusStr}\nTrail: ${trail.length}pts`, state.player.pos.x, state.player.pos.y - state.player.size / 2 - 8);
  pop();

  // 3. Draw Attached Turret Breadcrumb Following
  const attachments = state.player.attachments || [];
  for (let idx = 0; idx < attachments.length; idx++) {
    const t = attachments[idx];
    const wPos = t.getWorldPos();
    const formationTarget = {
      x: state.player.pos.x + t.offset.x,
      y: state.player.pos.y + t.offset.y
    };

    // Draw formation target ghost marker
    noFill();
    stroke(100, 200, 255, 70);
    strokeWeight(1);
    ellipse(formationTarget.x, formationTarget.y, t.size, t.size);
    stroke(100, 200, 255, 50);
    line(formationTarget.x - 4, formationTarget.y, formationTarget.x + 4, formationTarget.y);
    line(formationTarget.x, formationTarget.y - 4, formationTarget.x, formationTarget.y + 4);

    if (t.isFollowingTrail && trail.length > 0) {
      const targetIdx = constrain(t.pathTargetIndex, 0, trail.length - 1);
      const breadcrumb = trail[targetIdx];

      // Draw line from turret to targeted breadcrumb
      stroke(255, 80, 180, 220);
      strokeWeight(2);
      line(wPos.x, wPos.y, breadcrumb.x, breadcrumb.y);

      // Target breadcrumb highlight
      fill(255, 80, 180, 120);
      noStroke();
      ellipse(breadcrumb.x, breadcrumb.y, 14, 14);
      stroke(255, 255, 255, 200);
      strokeWeight(1.5);
      noFill();
      ellipse(breadcrumb.x, breadcrumb.y, 18, 18);

      // Perpendicular offset target point
      if (t.perpendicularOffset && Math.abs(t.perpendicularOffset) > 0.5) {
        const dx = state.player.pos.x - breadcrumb.x;
        const dy = state.player.pos.y - breadcrumb.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 0.1) {
          const perpX = (-dy / mag) * t.perpendicularOffset;
          const perpY = (dx / mag) * t.perpendicularOffset;
          const actualTargetX = breadcrumb.x + perpX;
          const actualTargetY = breadcrumb.y + perpY;

          stroke(255, 200, 80, 160);
          strokeWeight(1);
          line(breadcrumb.x, breadcrumb.y, actualTargetX, actualTargetY);
          fill(255, 200, 80);
          noStroke();
          rectMode(CENTER);
          rect(actualTargetX, actualTargetY, 5, 5);
        }
      }

      // Status text above turret
      fill(255, 120, 200);
      noStroke();
      textAlign(CENTER, TOP);
      textSize(8);
      const lag = (trail.length - 1) - targetIdx;
      text(`Trail[${targetIdx}]\nlag:${lag}`, wPos.x, wPos.y + t.size / 2 + 3);
    } else {
      // In formation
      stroke(100, 255, 150, 120);
      strokeWeight(1);
      line(wPos.x, wPos.y, formationTarget.x, formationTarget.y);

      fill(100, 255, 150);
      noStroke();
      textAlign(CENTER, TOP);
      textSize(8);
      const delayInfo = t.reactionTimer > 0 ? `react:${t.reactionTimer}` : `formed`;
      text(`Formation\n${delayInfo}`, wPos.x, wPos.y + t.size / 2 + 3);
    }

    // Velocity arrow
    if (t.vel && (t.vel.x !== 0 || t.vel.y !== 0)) {
      stroke(255, 255, 100, 180);
      strokeWeight(1.5);
      line(wPos.x, wPos.y, wPos.x + t.vel.x * 6, wPos.y + t.vel.y * 6);
    }
  }

  pop();
}


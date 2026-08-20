import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { WorldManager } from '../world';
import { Player, GroundFeature, NPCEntity, Enemy } from '../entities';
import { PaletteItem } from './types';
import { getAllPaletteItems } from './palette';
import {
  openToolbarSpawnerTooltip,
  handleToolbarSpawnerTooltipClick
} from './spawnerTooltip';
import {
  saveLevelLayout,
  startLevel,
  triggerImportLevelJson,
  serializeChunkBlocks,
  serializeChunkTurrets,
  deserializeChunkBlocks,
  deserializeChunkTurrets,
  serializeSpawnAreaTiles,
  deserializeSpawnAreaTiles,
  restoreCustomSpawnerPrefabs,
  serializeLevelEnemies,
  deserializeLevelEnemies
} from '../levelManager';
import { handleAlmanacClick } from '../ui/almanac/mainLayout';
import { createDefaultEditorAlmanacProgression, AlmanacProgression } from '../lvDemo';
import { initLevelEditorPlayerUpgradesFromData, serializeLevelEditorPlayerUpgrades } from '../ui/almanac/playerUpgradesPanel';
import { initLevelEditorLevelConfig, serializeLevelEditorLevelConfig } from '../ui/almanac/levelConfigPanel';

declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const textSize: any;
declare const textWidth: any;

export function startLevelEditor() {
  state.currentScreen = 'level_editor';
  state.currentLevelId = 'editor_custom';
  state.currentLevelLayoutData = { enableWorldGen: false };

  // Clear entities and visual effects
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.npcs = [];
  state.groundFeatures = [];
  state.vfx = [];
  state.uiVfx = [];
  state.trails = [];
  state.pendingSpawns = [];
  state.tickingExplosives = [];

  // Initialize empty world and player
  state.world = new WorldManager();
  const spawnX = 8 * GRID_SIZE + GRID_SIZE / 2;
  const spawnY = 8 * GRID_SIZE + GRID_SIZE / 2;
  state.player = new Player(spawnX, spawnY);
  state.cameraPos = { x: spawnX, y: spawnY };

  state.isAlmanacOpen = false;
  state.isAlmanacEditorMode = false;
  state.levelEditorAlmanacProgression = createDefaultEditorAlmanacProgression();
  state.levelEditorPlayerUpgrades = {};
  initLevelEditorPlayerUpgradesFromData({});
  state.activePlayerUpgradeInput = null;
  initLevelEditorLevelConfig(null);
  state.activeLevelConfigInput = null;

  if (!state.levelEditor) {
    state.levelEditor = {
      activeCategory: 'obstacles',
      activeSubCategory: 'ALL',
      selectedItemKey: 'o_dirt',
      paletteScrollX: 0,
      paletteScrollVel: 0
    };
  } else {
    state.levelEditor.activeCategory = 'obstacles';
    state.levelEditor.activeSubCategory = 'ALL';
    state.levelEditor.selectedItemKey = 'o_dirt';
    state.levelEditor.paletteScrollX = 0;
    state.levelEditor.paletteScrollVel = 0;
  }
}

export function handleLevelEditorClick(): boolean {
  if (state.currentScreen !== 'level_editor') return false;

  // If Almanac modal is open, process its clicks / outside click to close
  if (state.isAlmanacOpen) {
    return handleAlmanacClick();
  }

  const topBarH = 44;
  const panelH = 92;
  const panelY = height - panelH;

  // 0. Check Toolbar Spawner Tooltip clicks first if open
  if (handleToolbarSpawnerTooltipClick(topBarH, panelH)) {
    return true;
  }

  // 1. Check Left Tool Bar Clicks
  const barX = 10;
  const barY = topBarH + 10;
  const barW = 48;
  const barH = 154;
  if (mouseX >= barX && mouseX <= barX + barW && mouseY >= barY && mouseY <= barY + barH) {
    const btnW = 38;
    const btnH = 40;
    const btnX = barX + 5;
    let btnY = barY + 7;

    // Brush Tool Click
    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      state.levelEditor.toolMode = 'brush';
      return true;
    }

    btnY += btnH + 8;

    // Fill Bucket Tool Click
    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      state.levelEditor.toolMode = 'bucket';
      if (state.levelEditor.activeCategory !== 'obstacles' && state.levelEditor.activeCategory !== 'liquids') {
        state.levelEditor.activeCategory = 'obstacles';
        state.levelEditor.selectedItemKey = 'o_dirt';
      }
      return true;
    }

    btnY += btnH + 8;

    // Mark Spawn Area Tool Click
    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      state.levelEditor.toolMode = 'spawn_area';
      return true;
    }

    return true;
  }

  // 2. Check Top Bar Button Clicks
  if (mouseY <= topBarH) {
    const btnH = 22;
    const btnW = 55;
    const gap = 6;
    let curX = width - 16 - btnW;

    // EXIT MENU Button
    if (mouseX >= curX && mouseX <= curX + btnW && mouseY >= (topBarH - btnH) / 2 && mouseY <= (topBarH + btnH) / 2) {
      state.currentScreen = 'main_menu';
      return true;
    }

    curX -= (btnW + gap);

    // EXPORT JSON Button
    if (mouseX >= curX && mouseX <= curX + btnW && mouseY >= (topBarH - btnH) / 2 && mouseY <= (topBarH + btnH) / 2) {
      saveLevelLayout();
      return true;
    }

    curX -= (btnW + gap);

    // IMPORT JSON Button
    if (mouseX >= curX && mouseX <= curX + btnW && mouseY >= (topBarH - btnH) / 2 && mouseY <= (topBarH + btnH) / 2) {
      state.levelEditor.toolbarSpawnerTooltip = null;
      state.levelEditor.activeSpawnerInput = null;
      triggerImportLevelJson((data) => {
        restoreLevelFromCache(data);
      });
      return true;
    }

    const almanacW = 85;
    curX -= (almanacW + gap);

    // ALMANAC CONFIG Button
    if (mouseX >= curX && mouseX <= curX + almanacW && mouseY >= (topBarH - btnH) / 2 && mouseY <= (topBarH + btnH) / 2) {
      if (!state.levelEditorAlmanacProgression) {
        state.levelEditorAlmanacProgression = createDefaultEditorAlmanacProgression();
      }
      initLevelEditorPlayerUpgradesFromData(state.currentLevelLayoutData?.playerUpgrades);
      initLevelEditorLevelConfig(state.currentLevelLayoutData);
      state.isAlmanacOpen = true;
      state.isAlmanacEditorMode = true;
      state.almanacTab = 'Turrets';
      state.almanacScrollY = 0;
      state.almanacScrollVelocity = 0;
      return true;
    }

    curX -= (btnW + gap);

    // TEST LEVEL Button
    if (mouseX >= curX && mouseX <= curX + btnW && mouseY >= (topBarH - btnH) / 2 && mouseY <= (topBarH + btnH) / 2) {
      testPlayLevel();
      return true;
    }

    return true;
  }

  // 3. Check Bottom Palette Panel Clicks
  if (mouseY >= panelY) {
    const tabH = 18;
    const tabMargin = 4;
    let tabX = 12;

    const categories: { key: PaletteItem['category']; label: string; disabled?: boolean }[] = [
      { key: 'obstacles', label: 'OBSTACLES' },
      { key: 'overlays', label: 'OVERLAYS' },
      { key: 'liquids', label: 'LIQUIDS' },
      { key: 'groundFeatures', label: 'GROUND FEATURES', disabled: true },
      { key: 'entities', label: 'ENTITIES' },
      { key: 'turrets', label: 'TURRETS' },
      { key: 'flags', label: 'FLAGS' }
    ];

    // Check Category Tabs Click
    for (const tab of categories) {
      textSize(9);
      const tw = textWidth(tab.label) + 14;
      if (!tab.disabled && mouseX >= tabX && mouseX <= tabX + tw && mouseY >= panelY + tabMargin && mouseY <= panelY + tabMargin + tabH) {
        state.levelEditor.activeCategory = tab.key;
        state.levelEditor.paletteScrollX = 0;
        state.levelEditor.activeSpawnerInput = null;
        // Auto-select first item of new category
        const allItems = getAllPaletteItems();
        const first = allItems.find(i => i.category === tab.key);
        if (first) {
          state.levelEditor.selectedItemKey = first.key;
          if (tab.key === 'overlays') {
            const oCfg = overlayTypes[first.key];
            if (first.key === 'ov_spawner_custom' || oCfg?.isEnemySpawner || oCfg?.enemySpawnConfig || oCfg?.isCustomPrefab) {
              openToolbarSpawnerTooltip(first.key);
            } else {
              state.levelEditor.toolbarSpawnerTooltip = null;
            }
          } else {
            state.levelEditor.toolbarSpawnerTooltip = null;
          }
        }
        return true;
      }
      tabX += tw + 5;
    }

    let contentY = panelY + tabMargin + tabH + 4;

    // Check Sub-category Pills Click (if entities category)
    if (state.levelEditor.activeCategory === 'entities') {
      const subCats = ['ALL', 'Player', 'Enemies', 'NPCs', 'Loot'];
      let subX = 12;
      const subH = 15;

      for (const sub of subCats) {
        textSize(8);
        const sw = textWidth(sub) + 12;
        if (mouseX >= subX && mouseX <= subX + sw && mouseY >= contentY && mouseY <= contentY + subH) {
          state.levelEditor.activeSubCategory = sub;
          state.levelEditor.paletteScrollX = 0;
          return true;
        }
        subX += sw + 4;
      }

      contentY += subH + 4;
    }

    // Check Item Card Clicks
    const allItems = getAllPaletteItems();
    let categoryItems = allItems.filter(i => i.category === state.levelEditor.activeCategory);
    if (state.levelEditor.activeCategory === 'entities' && state.levelEditor.activeSubCategory && state.levelEditor.activeSubCategory !== 'ALL') {
      categoryItems = categoryItems.filter(i => i.subCategory === state.levelEditor.activeSubCategory);
    }

    const cardW = 42;
    const cardH = 46;
    const cardGap = 5;
    const startX = 12 + (state.levelEditor.paletteScrollX || 0);

    for (let i = 0; i < categoryItems.length; i++) {
      const item = categoryItems[i];
      const cx = startX + i * (cardW + cardGap);

      if (mouseX >= cx && mouseX <= cx + cardW && mouseY >= contentY && mouseY <= contentY + cardH) {
        state.levelEditor.selectedItemKey = item.key;
        if (state.levelEditor.activeCategory === 'overlays') {
          const oCfg = overlayTypes[item.key];
          if (item.key === 'ov_spawner_custom' || oCfg?.isEnemySpawner || oCfg?.enemySpawnConfig || oCfg?.isCustomPrefab) {
            openToolbarSpawnerTooltip(item.key);
          } else {
            state.levelEditor.toolbarSpawnerTooltip = null;
            state.levelEditor.activeSpawnerInput = null;
          }
        } else {
          state.levelEditor.toolbarSpawnerTooltip = null;
          state.levelEditor.activeSpawnerInput = null;
        }
        return true;
      }
    }

    return true;
  }

  return false;
}

export function handleLevelEditorScroll(delta: number) {
  if (state.currentScreen !== 'level_editor') return false;
  const panelH = 92;
  if (mouseY >= height - panelH) {
    state.levelEditor.paletteScrollVel = (state.levelEditor.paletteScrollVel || 0) - delta * 0.35;
    return true;
  }
  
  // World camera zoom in/out with scroll wheel
  const topBarH = 44;
  if (mouseY > topBarH && mouseY < height - panelH) {
    const curZoom = state.levelEditor.cameraZoom || 1.0;
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(3.0, Math.max(0.3, curZoom * zoomFactor));
    state.levelEditor.cameraZoom = newZoom;
    return true;
  }

  return false;
}

export function serializeLevelLayout() {
  const prog = state.levelEditorAlmanacProgression || createDefaultEditorAlmanacProgression();
  const playerUpgrades = serializeLevelEditorPlayerUpgrades();
  const levelCfg = serializeLevelEditorLevelConfig() || {};

  const levelData: any = {
    version: 2,
    levelId: levelCfg.levelId || state.currentLevelId || 'editor_custom',
    levelName: levelCfg.levelName || 'Custom Editor Level',
    levelDescription: levelCfg.levelDescription || 'Custom exported level layout.',
    tag: levelCfg.tag || 'CUSTOM MAP',
    enableWorldGen: false,
    almanacProgression: {
      StartingTurret: [...(prog.StartingTurret || [])],
      UnlockedByDiscoverTurret: [...(prog.UnlockedByDiscoverTurret || [])],
      LockedTurret: [...(prog.LockedTurret || [])],
      BannedTurrets: [...(prog.BannedTurrets || [])],
      UnlockCost: [...(prog.UnlockCost || [])],
      AllTurretCrafting: prog.AllTurretCrafting !== false,
      AllTurretUpgrade: prog.AllTurretUpgrade !== false,
      CraftingCostOverride: [...(prog.CraftingCostOverride || [])]
    },
    ...(playerUpgrades ? { playerUpgrades } : {}),
    ...(levelCfg.customBudgetPerNight !== undefined ? { customBudgetPerNight: levelCfg.customBudgetPerNight } : {}),
    ...(levelCfg.hourlyBudgetPerDay !== undefined ? { hourlyBudgetPerDay: levelCfg.hourlyBudgetPerDay } : {}),
    ...(levelCfg.hourlyBudgetPerNight !== undefined ? { hourlyBudgetPerNight: levelCfg.hourlyBudgetPerNight } : {}),
    ...(levelCfg.enabledCurrency !== undefined ? { enabledCurrency: levelCfg.enabledCurrency } : {}),
    ...(levelCfg.startingResource !== undefined ? { startingResource: levelCfg.startingResource } : {}),
    ...(levelCfg.globalEnemySpawnConfig !== undefined ? { globalEnemySpawnConfig: levelCfg.globalEnemySpawnConfig } : {}),
    timestamp: new Date().toISOString(),
    playerSpawn: {
      x: state.player ? Math.round(state.player.pos.x) : (8 * GRID_SIZE + GRID_SIZE / 2),
      y: state.player ? Math.round(state.player.pos.y) : (8 * GRID_SIZE + GRID_SIZE / 2)
    },
    cameraPos: {
      x: state.cameraPos ? Math.round(state.cameraPos.x) : (8 * GRID_SIZE + GRID_SIZE / 2),
      y: state.cameraPos ? Math.round(state.cameraPos.y) : (8 * GRID_SIZE + GRID_SIZE / 2)
    },
    chunks: []
  };

  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      const chunkData: any = {
        cx: chunk.cx,
        cy: chunk.cy,
        localChunkLevel: chunk.localChunkLevel,
        prefabId: chunk.prefabId,
        blocks: serializeChunkBlocks(chunk.blocks),
        turrets: serializeChunkTurrets(chunk.turrets)
      };

      if (chunkData.blocks.length > 0 || chunkData.turrets.length > 0) {
        levelData.chunks.push(chunkData);
      }
    });
  }

  levelData.groundFeatures = (state.groundFeatures || []).map((gf: any) => ({
    x: Math.round(gf.pos.x),
    y: Math.round(gf.pos.y),
    type: gf.type
  }));

  levelData.npcs = (state.npcs || []).map((npc: any) => ({
    x: Math.round(npc.pos.x),
    y: Math.round(npc.pos.y),
    type: npc.type
  }));

  levelData.enemies = serializeLevelEnemies(state.enemies);

  if (state.world && state.world.spawnAreaSet && state.world.spawnAreaSet.size > 0) {
    levelData.spawnAreaTiles = serializeSpawnAreaTiles(state.world.spawnAreaSet);
  }

  if (state.levelEditor?.customSpawnerPrefabs && state.levelEditor.customSpawnerPrefabs.length > 0) {
    levelData.customSpawnerPrefabs = state.levelEditor.customSpawnerPrefabs;
  }

  return levelData;
}

export function restoreLevelFromCache(layout: any) {
  state.currentScreen = 'level_editor';
  state.currentLevelId = layout?.levelId || layout?.id || 'editor_custom';
  state.currentLevelLayoutData = layout;
  state.isEditorPlaytest = false;
  state.isAlmanacOpen = false;
  state.isAlmanacEditorMode = false;

  if (layout && (layout.almanacProgression || layout.AlmanacProgression)) {
    const raw = layout.almanacProgression || layout.AlmanacProgression;
    state.levelEditorAlmanacProgression = {
      StartingTurret: [...(raw.StartingTurret || [])],
      UnlockedByDiscoverTurret: [...(raw.UnlockedByDiscoverTurret || [])],
      LockedTurret: (raw.LockedTurret || []).map((t: any) => typeof t === 'string' ? { type: t, weight: 10 } : t),
      BannedTurrets: [...(raw.BannedTurrets || [])],
      UnlockCost: raw.UnlockCost !== undefined ? JSON.parse(JSON.stringify(raw.UnlockCost)) : [],
      AllTurretCrafting: raw.AllTurretCrafting !== false,
      AllTurretUpgrade: raw.AllTurretUpgrade !== false,
      CraftingCostOverride: raw.CraftingCostOverride ? JSON.parse(JSON.stringify(raw.CraftingCostOverride)) : []
    };
  } else {
    state.levelEditorAlmanacProgression = createDefaultEditorAlmanacProgression();
  }

  initLevelEditorPlayerUpgradesFromData(layout?.playerUpgrades || layout?.PlayerUpgrades);
  initLevelEditorLevelConfig(layout);

  // Clear dynamic game objects
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.npcs = [];
  state.groundFeatures = [];
  state.vfx = [];
  state.uiVfx = [];
  state.trails = [];
  state.pendingSpawns = [];
  state.tickingExplosives = [];

  // Create clean world and player
  state.world = new WorldManager();

  // Load Spawn Area Tiles if provided
  deserializeSpawnAreaTiles(state.world, layout?.spawnAreaTiles);

  // Restore Custom Spawner Prefabs if provided
  if (layout?.customSpawnerPrefabs) {
    restoreCustomSpawnerPrefabs(layout.customSpawnerPrefabs);
  }

  const spawnX = layout?.playerSpawn?.x ?? (8 * GRID_SIZE + GRID_SIZE / 2);
  const spawnY = layout?.playerSpawn?.y ?? (8 * GRID_SIZE + GRID_SIZE / 2);
  state.player = new Player(spawnX, spawnY);

  if (layout?.cameraPos) {
    state.cameraPos = { x: layout.cameraPos.x, y: layout.cameraPos.y };
  } else {
    state.cameraPos = { x: spawnX, y: spawnY };
  }

  if (layout && layout.chunks) {
    for (const chunkData of layout.chunks) {
      const cx = chunkData.cx;
      const cy = chunkData.cy;
      const chunk = state.world.getChunk(cx, cy);

      if (chunkData.blocks) {
        deserializeChunkBlocks(chunk, chunkData.blocks);
      }

      if (chunkData.turrets) {
        deserializeChunkTurrets(chunk, chunkData.turrets);
      }
    }
  }

  if (layout?.groundFeatures) {
    for (const gf of layout.groundFeatures) {
      state.groundFeatures.push(new GroundFeature(gf.x, gf.y, gf.type));
    }
  }

  if (layout?.npcs) {
    for (const npc of layout.npcs) {
      state.npcs.push(new NPCEntity(npc.x, npc.y, npc.type));
    }
  }

  if (layout?.enemies) {
    deserializeLevelEnemies(layout.enemies);
  }
}

export function testPlayLevel() {
  const cache = serializeLevelLayout();
  state.levelEditorCache = cache;
  state.isEditorPlaytest = true;
  startLevel('editor_playtest', cache);
}

import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { WorldManager } from '../world';
import { Player, GroundFeature, NPCEntity, Enemy } from '../entities';
import { PaletteItem } from './types';
import { getAllPaletteItems } from './palette';
import {
  fillBucketObstacle,
  fillBucketLiquid,
  placeSelectedItem,
  deleteAtPosition,
  isPointInPolygon
} from './tools';
import {
  openToolbarSpawnerTooltip,
  handleToolbarSpawnerTooltipClick,
  isMouseOverSpawnerTooltip,
  isMouseOverSunGeneratorTooltip,
  handleToolbarSunGeneratorTooltipClick,
  openToolbarSunGeneratorTooltip
} from './spawnerTooltip';
import {
  paygateModal,
  openPayGateCostModal,
  handlePayGateCostModalPress,
  handlePayGateCostModalClick,
  handlePayGateCostModalRelease
} from './paygateModal';
import {
  sunGeneratorModal,
  openSunGeneratorModal,
  openSunGeneratorModalAt,
  closeSunGeneratorModal,
  isSunGeneratorModalOpen,
  handleSunGeneratorModalClick,
  handleSunGeneratorModalRelease
} from './sunGeneratorModal';
import {
  textSignEditor,
  openTextSignEditor,
  getTextSignAtWorldPos,
  handleInlineTextSignPress,
  handleInlineTextSignClick,
  handleInlineTextSignRelease
} from './textsignEditor';
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
import { handleRegisteredUIClick } from '../uiComponents';

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

export function handleLevelEditorPress(mx: number, my: number): boolean {
  if (state.currentScreen !== 'level_editor') return false;

  // 1. If Almanac modal is open, let Almanac handle
  if (state.isAlmanacOpen) {
    state.levelEditor.isWorldDragActive = false;
    return false;
  }

  // 2. If Paygate modal is open
  if (paygateModal.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handlePayGateCostModalPress();
  }

  // 2.1 If Sun Generator modal is open
  if (sunGeneratorModal.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return true;
  }

  const zoom = state.levelEditor?.cameraZoom || 1.0;
  const mWorldX = (mx - width / 2) / zoom + state.cameraPos.x;
  const mWorldY = (my - height / 2) / zoom + state.cameraPos.y;

  // 3. If inline TextSign editor is open
  if (textSignEditor.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handleInlineTextSignPress(mWorldX, mWorldY);
  }

  const topBarH = 44;
  const panelH = 92;
  const panelY = height - panelH;

  // 4. If over SpawnerTooltip
  if (isMouseOverSpawnerTooltip(topBarH, panelH) || isMouseOverSunGeneratorTooltip(topBarH, panelH)) {
    state.levelEditor.isWorldDragActive = false;
    return true;
  }

  const barX = 10;
  const barY = topBarH + 10;
  const barW = 48;
  const barH = 154;
  const isOverLeftBar = mx >= barX && mx <= barX + barW && my >= barY && my <= barY + barH;
  const isOverTopBar = my <= topBarH;
  const isOverPalette = my >= panelY;

  if (isOverLeftBar || isOverTopBar || isOverPalette) {
    state.levelEditor.isWorldDragActive = false;
    return false;
  }

  // 5. Genuine World Canvas Press
  const isRight = (window as any).mouseButton === (window as any).RIGHT || (window as any).event?.button === 2;
  state.levelEditor.isWorldDragActive = true;
  state.levelEditor.isRightDragActive = isRight;
  state.levelEditor.isRightDragOverlayOnly = isRight && (state.levelEditor.activeCategory === 'overlays');

  // When Flag WinCondition tool is selected, do not open modals/tooltips so flags can be applied freely
  const isFlagsToolActive = state.levelEditor.activeCategory === 'flags';

  if (!isRight && !isFlagsToolActive) {
    // Check clicking on a PayGate cost bubble
    const clickedPayGateGroup = state.world ? state.world.getPayGateGroupByWorldPos(mWorldX, mWorldY) : null;
    if (clickedPayGateGroup) {
      state.levelEditor.isWorldDragActive = false;
      openPayGateCostModal(clickedPayGateGroup);
      return true;
    }

    // Check clicking on a TextSign speech bubble
    const clickedTextSignBlock = getTextSignAtWorldPos(mWorldX, mWorldY);
    if (clickedTextSignBlock) {
      state.levelEditor.isWorldDragActive = false;
      openTextSignEditor(clickedTextSignBlock);
      return true;
    }

    // Check clicking on an existing SunGenerator or Spawner block on the world canvas
    const gx = Math.floor(mWorldX / GRID_SIZE);
    const gy = Math.floor(mWorldY / GRID_SIZE);
    const clickedBlock = state.world?.getBlock(gx, gy);
    if (clickedBlock) {
      if (!clickedBlock.isMined && (clickedBlock.overlay === 'sunGenerator' || clickedBlock.overlay === 'ov_sun_generator')) {
        state.levelEditor.isWorldDragActive = false;
        openSunGeneratorModal(clickedBlock);
        return true;
      } else if ((clickedBlock.overlay && (clickedBlock.overlay.startsWith('ov_spawner') || clickedBlock.overlay.startsWith('spawner_'))) || clickedBlock.liquidType === 'l_spawner' || clickedBlock.customSpawnerConfig) {
        state.levelEditor.isWorldDragActive = false;
        openToolbarSpawnerTooltip(clickedBlock.overlay || clickedBlock.liquidType || 'l_spawner');
        return true;
      }
    }
  }

  return true;
}

export function handleLevelEditorClick(): boolean {
  if (state.currentScreen !== 'level_editor') return false;

  // If Almanac modal is open, process its clicks / outside click to close
  if (state.isAlmanacOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handleAlmanacClick();
  }

  // If PayGate Cost Modal is open, handle clicks on it
  if (paygateModal.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handlePayGateCostModalClick();
  }

  // If Sun Generator Modal is open, handle clicks on it
  if (sunGeneratorModal.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handleSunGeneratorModalClick();
  }

  const zoom = state.levelEditor?.cameraZoom || 1.0;
  const mWorldX = (mouseX - width / 2) / zoom + state.cameraPos.x;
  const mWorldY = (mouseY - height / 2) / zoom + state.cameraPos.y;

  // If inline TextSign editor is open, handle clicks on it
  if (textSignEditor.isOpen) {
    state.levelEditor.isWorldDragActive = false;
    return handleInlineTextSignClick(mWorldX, mWorldY);
  }

  const topBarH = 44;
  const panelH = 92;
  const panelY = height - panelH;

  // 0. Check Toolbar Spawner Tooltip click first if open
  if (handleToolbarSpawnerTooltipClick(topBarH, panelH)) {
    state.levelEditor.isWorldDragActive = false;
    return true;
  }
  if (handleToolbarSunGeneratorTooltipClick(topBarH, panelH)) {
    state.levelEditor.isWorldDragActive = false;
    return true;
  }

  return false;
}

export function handleLevelEditorMouseRelease() {
  if (state.currentScreen !== 'level_editor') return;

  // Complete Lasso polygon filling for Mark Spawn Area
  if (state.levelEditor.toolMode === 'spawn_area' && state.levelEditor.spawnAreaLassoPoints && state.levelEditor.spawnAreaLassoPoints.length > 2) {
    const pts = state.levelEditor.spawnAreaLassoPoints;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const minGx = Math.floor(minX / GRID_SIZE);
    const maxGx = Math.floor(maxX / GRID_SIZE);
    const minGy = Math.floor(minY / GRID_SIZE);
    const maxGy = Math.floor(maxY / GRID_SIZE);
    const isAdding = !state.levelEditor.isRightDragActive;

    for (let gx = minGx; gx <= maxGx; gx++) {
      for (let gy = minGy; gy <= maxGy; gy++) {
        const cx = gx * GRID_SIZE + GRID_SIZE / 2;
        const cy = gy * GRID_SIZE + GRID_SIZE / 2;
        if (isPointInPolygon(cx, cy, pts)) {
          state.world?.setSpawnAreaTile(gx, gy, isAdding);
        }
      }
    }
  }

  state.levelEditor.spawnAreaLassoPoints = null;
  state.levelEditor.isWorldDragActive = false;
  state.levelEditor.isRightDragActive = false;
  state.levelEditor.isRightDragOverlayOnly = false;
  state.levelEditor.isFlagDragActive = false;
  handlePayGateCostModalRelease();
  handleSunGeneratorModalRelease();
  handleInlineTextSignRelease();
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
  if (state.world) {
    state.world.rebuildPayGateGroups();
  }
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

  if (state.world) {
    state.world.rebuildPayGateGroups();
  }
}

export function testPlayLevel() {
  const cache = serializeLevelLayout();
  state.levelEditorCache = cache;
  state.isEditorPlaytest = true;
  startLevel('editor_playtest', cache);
}

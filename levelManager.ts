import { state } from './state';
import { WorldManager, Block } from './world';
import { Player, GroundFeature, NPCEntity, Enemy, LootEntity, TurretLoot, spawnLootEntity } from './entities';
import { GRID_SIZE, CHUNK_SIZE, HOUR_FRAMES } from './constants';
import { customStartingHour, AlmanacProgression, getActiveAlmanacProgression, buildExportAlmanacProgression, worldGenConfig } from './lvDemo';
import { createWorldTurret } from './class/turret/TurretRegistry';
import { createEnemy } from './class/enemy/EnemyRegistry';
import { obstacleTypes, overlayTypes } from './balanceObstacles';
import { liquidTypes } from './balanceLiquids';
import { resetPlayerUpgrades } from './src/playerUpgrades';
import { serializeLevelEditorPlayerUpgrades } from './ui/almanac/playerUpgradesPanel';
import { resetTurretUnlockTreeState, initTurretUnlockTree } from './ui/almanac/turretUnlockTree';
import { resetUIComponentAnimations } from './uiComponents';


import { serializeLevelEditorLevelConfig, formatGlobalEnemySpawnConfig } from './ui/almanac/levelConfigPanel';
import { DEFAULT_DAYTIME_WEIGHTS } from './ui/almanac/levelConfig/types';
import { soundEngine } from './src/audio/soundEngine';
import { WORLD_GEN_CELLULAR_CONFIG } from './worldgen/cellTypes';

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  tag: string;
  customLayoutData?: any;
}

export const DEFAULT_LEVELS: LevelConfig[] = [
  {
    id: 'sbw',
    name: 'Sandbox World',
    tag: 'Sandbox',
    description: 'Full world for testing with updated global enemy spawn config.',
    customLayoutData: {
      enableWorldGen: true,
      globalEnemySpawnConfig: DEFAULT_DAYTIME_WEIGHTS,
      noWinCondition: true,
      destroyAllEnemySpawners: false
    }
  },
  {
    id: 'mpty',
    name: 'Empty',
    tag: 'Dev',
    description: 'Empty ground for testing.',
    customLayoutData: {
      enableWorldGen: false,
      noWinCondition: true,
      destroyAllEnemySpawners: false
    }
  }
];

export function loadCustomLevels(): LevelConfig[] {
  const loadedLevels: LevelConfig[] = [];
  try {
    const modules: Record<string, any> = (import.meta as any).glob(['./level/*.json', './level/**/*.json'], { eager: true });
    for (const path in modules) {
      const mod = modules[path];
      const data = mod?.default || mod;
      if (data && typeof data === 'object') {
        const id = data.levelId || data.id || path.replace(/^.*[\\/]/, '').replace(/\.json$/, '');
        const name = data.levelName || data.name || id.toUpperCase();
        const description = data['level Description'] || data.levelDescription || data.description || 'Custom level layout loaded from level/ folder.';
        const tag = data.tag || 'CUSTOM MAP';

        loadedLevels.push({
          id,
          name,
          description,
          tag,
          customLayoutData: data
        });
      }
    }
  } catch (e) {
    console.warn('Failed to load level files from level/ directory:', e);
  }
  return loadedLevels;
}

export const CUSTOM_IMPORTED_LEVELS: LevelConfig[] = [];

export const LEVELS: LevelConfig[] = [
  ...DEFAULT_LEVELS,
  ...loadCustomLevels(),
  ...CUSTOM_IMPORTED_LEVELS
];

export function refreshLevels(): LevelConfig[] {
  LEVELS.length = 0;
  LEVELS.push(...DEFAULT_LEVELS, ...loadCustomLevels(), ...CUSTOM_IMPORTED_LEVELS);
  return LEVELS;
}

export function addImportedLevel(data: any): LevelConfig {
  const id = data.levelId || data.id || ('imported_' + Date.now());
  const name = data.levelName || data.name || id.toUpperCase();
  const description = data['level Description'] || data.levelDescription || data.description || 'Custom imported level layout.';
  const tag = data.tag || 'IMPORTED MAP';

  const levelCfg: LevelConfig = {
    id,
    name,
    description,
    tag,
    customLayoutData: data
  };

  const idx = CUSTOM_IMPORTED_LEVELS.findIndex(l => l.id === id);
  if (idx >= 0) {
    CUSTOM_IMPORTED_LEVELS[idx] = levelCfg;
  } else {
    CUSTOM_IMPORTED_LEVELS.push(levelCfg);
  }

  refreshLevels();
  return levelCfg;
}

export function triggerImportLevelJson(onLoaded?: (data: any, cfg: LevelConfig) => void) {
  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.isRightDragActive = false;
    state.levelEditor.isRightDragOverlayOnly = false;
    state.levelEditor.isFlagDragActive = false;
  }
  state.suppressGameplayMouseUntilRelease = true;
  (window as any).mouseIsPressed = false;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e: any) => {
    if (state.levelEditor) {
      state.levelEditor.isWorldDragActive = false;
      state.levelEditor.isRightDragActive = false;
      state.levelEditor.isRightDragOverlayOnly = false;
      state.levelEditor.isFlagDragActive = false;
    }
    state.suppressGameplayMouseUntilRelease = true;
    (window as any).mouseIsPressed = false;

    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event: any) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json && typeof json === 'object') {
          const cfg = addImportedLevel(json);
          if (onLoaded) {
            onLoaded(json, cfg);
          }
        }
      } catch (err) {
        console.error('Failed to parse level JSON:', err);
      } finally {
        if (state.levelEditor) {
          state.levelEditor.isWorldDragActive = false;
        }
        state.suppressGameplayMouseUntilRelease = true;
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export function syncWorldSeed(seed?: number): number {
  const s = seed !== undefined ? seed : (state.worldSeed || 2026);
  state.worldSeed = s;
  WORLD_GEN_CELLULAR_CONFIG.worldSeed = s;
  state.worldPreviewNeedsUpdate = true;
  if (typeof (window as any).noiseSeed === 'function') {
    try { (window as any).noiseSeed(s); } catch (e) {}
  }
  if (typeof (window as any).randomSeed === 'function') {
    try { (window as any).randomSeed(s); } catch (e) {}
  }
  worldGenConfig.noiseOffsetBlocks = 10000 + (s % 50000);
  worldGenConfig.noiseOffsetLakes = 20000 + ((s * 7) % 50000);
  worldGenConfig.noiseOffsetRivers = 30000 + ((s * 13) % 50000);
  worldGenConfig.noiseOffsetClumping = 40000 + ((s * 19) % 50000);
  return s;
}

export function startLevel(levelId: string, customLayoutData?: any) {
  state.currentLevelId = levelId;
  state.currentScreen = 'game';

  // Find level configuration from LEVELS registry if layout data is not passed
  const levelConfig = LEVELS.find(l => l.id === levelId);
  const layout = customLayoutData || levelConfig?.customLayoutData;
  state.currentLevelLayoutData = layout || null;

  // Determine if worldGen is enabled
  const isWorldGen = layout?.useWorldGen === true || layout?.enableWorldGen === true || (layout?.useWorldGen !== false && layout?.enableWorldGen !== false && (levelId === 'sbw' || levelConfig?.customLayoutData?.enableWorldGen === true || levelConfig?.customLayoutData?.useWorldGen === true));

  // Synchronize world seed across the whole system: generate a fresh random seed for worldGen levels, or use explicit layout seed
  let activeSeed: number;
  if (typeof layout?.worldSeed === 'number') {
    activeSeed = layout.worldSeed;
  } else if (typeof layout?.seed === 'number') {
    activeSeed = layout.seed;
  } else if (isWorldGen) {
    activeSeed = Math.floor(Math.random() * 10000000) + 1;
  } else {
    activeSeed = 2026;
  }
  syncWorldSeed(activeSeed);

  // Clear dynamic game objects
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.npcs = [];
  state.groundFeatures = [];
  GroundFeature.clearTileFireVfx();
  state.vfx = [];
  state.uiVfx = [];
  state.trails = [];
  state.pendingSpawns = [];
  state.tickingExplosives = [];
  state.playerTrail = [];
  
  // Game Over & UI states
  state.isEditorPlaytest = (levelId === 'editor_playtest');
  if (!state.isEditorPlaytest) {
    state.levelEditorCache = null;
  }
  state.isGameOver = false;
  state.isLevelCompleted = false;
  state.winConditionActive = false;
  state.levelWonSequence = null;
  state.showGameOverPopup = false;
  state.gameOverProgress = 0;
  state.isPaused = false;
  state.isPauseMenuOpen = false;
  state.activeNPC = null;
  state.npcUiPanelPos = 0;
  state.activeNpcDialogueIdx = 0;
  state.npcDialogueJump = 0;
  state.npcStock = {};
  state.pressedTradeId = null;
  state.npcShopScrollY = 0;
  state.npcShopScrollVelocity = 0;
  state.npcShopPressPos = null;
  state.selectedTurretType = null;
  state.draggedTurretType = null;
  state.draggedTurretInstance = null;
  state.isCurrentlyDragging = false;
  state.hoveredTurretInstance = null;
  state.hoveredTurretSlot = null;
  state.tooltipTurret = null;
  state.isAlmanacOpen = false;
  state.isAlmanacEditorMode = false;
  state.almanacTab = 'Turrets';
  state.almanacScrollY = 0;
  state.almanacScrollVelocity = 0;
  state.almanacIsDragging = false;
  state.almanacInfoScrollY = 0;
  state.almanacInfoScrollVelocity = 0;
  state.activeUpgradeSelection = null;
  state.upgradeSelection = null;
  state.showUnlockPopup = false;
  state.lastUnlockedTurret = null;
  state.unlockPopupTimer = 0;
  state.showWorldGenPreview = false;
  state.previewSnapPos = null;
  state.previewWorldSnap = null;
  state.turretOverlayAnimation = null;
  state.turretMergeOverlay = null;

  // Reset Turret Unlock Tree state and all active tree VFX
  resetTurretUnlockTreeState();
  resetUIComponentAnimations();

  // Reset level cache and editor inputs
  state.almanacEditorToggledKeys = new Set();
  state.levelEditorAlmanacProgression = null;
  state.levelEditorPlayerUpgrades = null;
  state.levelEditorLevelConfig = null;
  state.activePlayerUpgradeInput = null;
  state.activeLevelConfigInput = null;

  state.touchInputVec = { x: 0, y: 0 };
  state.touchStartPos = null;
  state.isTouchingUI = false;
  state.isMouseDown = false;
  state.uiSunScale = 1.0;
  state.uiElixirScale = 1.0;
  state.uiSoilScale = 1.0;
  state.cameraShake = 0;
  state.timeWarpRemaining = 0;
  state.nightWarningTimer = 0;
  state.uiVfx = [];
  state.speedupFlashTimer = 0;
  state.gameSpeed = 1;
  state.requestedGameSpeed = 1;
  state.debugScrollY = 0;
  state.debugScrollVelocity = 0;

  // Reset currencies from startingResource config or defaults
  if (layout?.startingResource) {
    const res = layout.startingResource;
    state.sunCurrency = typeof res.sun === 'number' ? res.sun : 3;
    state.elixirCurrency = typeof res.elixir === 'number' ? res.elixir : 0;
    state.soilCurrency = typeof res.soil === 'number' ? res.soil : 0;
    state.raisinCurrency = typeof res.raisin === 'number' ? res.raisin : 0;
    state.leafCurrency = typeof res.leaf === 'number' ? res.leaf : 0;
    state.shardCurrency = typeof res.shard === 'number' ? res.shard : 0;
    state.shellCurrency = typeof res.shell === 'number' ? res.shell : 0;
    state.fuelCurrency = typeof res.fuel === 'number' ? res.fuel : 0;
    state.iceCurrency = typeof res.ice === 'number' ? res.ice : 0;
  } else {
    state.sunCurrency = 3;
    state.elixirCurrency = 0;
    state.soilCurrency = 0;
    state.raisinCurrency = 0;
    state.leafCurrency = 0;
    state.shardCurrency = 0;
    state.shellCurrency = 0;
    state.fuelCurrency = 0;
    state.iceCurrency = 0;
  }

  // Reset inventory & turrets
  state.inventory = { items: {}, specList: [] };
  resetPlayerUpgrades();
  const activeProg = getActiveAlmanacProgression();
  state.unlockedTurrets = [...(activeProg.StartingTurret || [])];
  state.lockedTurrets = (activeProg.LockedTurret || []).map((t: any) => typeof t === 'string' ? { type: t, weight: 10 } : t);
  state.unlockCount = 0;
  state.turretUpgrades = {};
  state.upgradeData = {};
  state.turretLastUsed = {};

  // Re-initialize turret unlock tree cleanly with active level progression & seed
  initTurretUnlockTree(activeSeed);

  // Reset time and budget
  state.frames = customStartingHour * HOUR_FRAMES;
  state.lastNightTriggered = 0;
  state.currentNightWaveBudget = 60;
  state.hourlyBudgetPool = 0;
  state.lastHourProcessed = -1;

  // Reset stats
  state.totalEnemiesDead = 0;
  state.totalSunLootCollected = 0;
  state.totalElixirLootCollected = 0;
  state.totalSoilLootCollected = 0;
  state.totalTurretsAcquired = 0;
  state.accumulatedEnemyBudgetKilled = 0;
  state.accumulatedCollectedResources = {};
  state.accumulatedHuntEnemy = {};
  state.accumulatedBreakObstacle = {};

  // Reset world exploration tracking
  state.exploredChunks = new Set();
  state.activeChunkKeys = new Set();
  state.chunkAccessOrder = [];
  state.spawnedNpcKeys = new Set();
  state.chunkToDirectorIndex = new Map();

  // Re-create World and Player
  state.world = new WorldManager();

  const spawnX = layout?.playerSpawn?.x ?? (8 * GRID_SIZE + GRID_SIZE / 2);
  const spawnY = layout?.playerSpawn?.y ?? (8 * GRID_SIZE + GRID_SIZE / 2);
  state.player = new Player(spawnX, spawnY);
  state.cameraPos = { x: spawnX, y: spawnY };

  // Restore Custom Spawner Prefabs if provided (MUST run before deserializing blocks)
  if (layout?.customSpawnerPrefabs && Array.isArray(layout.customSpawnerPrefabs)) {
    restoreCustomSpawnerPrefabs(layout.customSpawnerPrefabs);
  }

  // If loading custom layout data
  if (layout && layout.chunks) {
    for (const chunkData of layout.chunks) {
      const cx = chunkData.cx;
      const cy = chunkData.cy;
      const chunk = state.world.getChunk(cx, cy);
      
      deserializeChunk(chunk, chunkData);

      if (chunkData.turrets) {
        deserializeChunkTurrets(chunk, chunkData.turrets);
      }
    }
  }

  // Load ground features if provided
  if (layout?.groundFeatures) {
    for (const gf of layout.groundFeatures) {
      state.groundFeatures.push(new GroundFeature(gf.x, gf.y, gf.type));
    }
  }

  // Load NPCs if provided
  if (layout?.npcs) {
    for (const npc of layout.npcs) {
      state.npcs.push(new NPCEntity(npc.x, npc.y, npc.type));
    }
  }

  // Load Enemies if provided (supports new grouped pos format and legacy format)
  if (layout?.enemies) {
    deserializeLevelEnemies(layout.enemies);
  }

  // Load Loots if provided (supports new grouped pos format and legacy format)
  deserializeLevelLoots(state.world, layout?.loots || layout?.loot || layout?.Loots);

  // Load Spawn Area Tiles if provided
  deserializeSpawnAreaTiles(state.world, layout?.spawnAreaTiles);

  if (state.world) {
    state.world.rebuildPayGateGroups();
  }

  // Initialize synchronized background music & dynamic layers
  soundEngine.startLevelMusic();
}

export function serializeSpawnAreaTiles(spawnAreaSet: Set<string> | undefined | null): [number, number, number][] {
  if (!spawnAreaSet || spawnAreaSet.size === 0) return [];
  const coords: { gx: number, gy: number }[] = [];
  for (const k of spawnAreaSet) {
    const parts = String(k).split(',');
    if (parts.length >= 2) {
      const gx = parseInt(parts[0], 10);
      const gy = parseInt(parts[1], 10);
      if (!isNaN(gx) && !isNaN(gy)) {
        coords.push({ gx, gy });
      }
    }
  }
  if (coords.length === 0) return [];

  coords.sort((a, b) => (a.gy !== b.gy ? a.gy - b.gy : a.gx - b.gx));

  const spans: [number, number, number][] = [];
  let startGx = coords[0].gx;
  let len = 1;
  let currentGy = coords[0].gy;

  for (let i = 1; i < coords.length; i++) {
    const pt = coords[i];
    if (pt.gy === currentGy && pt.gx === startGx + len) {
      len++;
    } else {
      spans.push([startGx, len, currentGy]);
      startGx = pt.gx;
      len = 1;
      currentGy = pt.gy;
    }
  }
  spans.push([startGx, len, currentGy]);
  return spans;
}

export function deserializeSpawnAreaTiles(world: WorldManager | null | undefined, spawnAreaTilesData: any): void {
  if (!world) return;
  if (!world.spawnAreaSet) world.spawnAreaSet = new Set();
  world.spawnAreaSet.clear();

  if (!spawnAreaTilesData || !Array.isArray(spawnAreaTilesData)) return;

  for (const item of spawnAreaTilesData) {
    if (!item) continue;
    if (Array.isArray(item) && item.length >= 3) {
      // Standard v2 span format: [startGx, spanLen, gy]
      const startGx = item[0];
      const spanLen = Math.max(1, item[1]);
      const gy = item[2];
      for (let i = 0; i < spanLen; i++) {
        world.spawnAreaSet.add(`${startGx + i},${gy}`);
      }
    }
  }
}

export function serializeLevelEnemies(enemies: any[] | undefined | null): any[] {
  if (!enemies || !Array.isArray(enemies) || enemies.length === 0) return [];
  
  // Group by composite key: type + "|" + (isWinCondition ? '1' : '0')
  const groups = new Map<string, { type: string; pos: [number, number][]; isWinCondition?: boolean }>();

  for (const e of enemies) {
    if (!e) continue;
    const type = e.type || 'e_basic';
    const isWin = !!e.isWinCondition || !!e.winConditionTagIfDeclared;
    const key = `${type}|${isWin ? '1' : '0'}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        type,
        pos: [],
        ...(isWin ? { isWinCondition: true } : {})
      };
      groups.set(key, g);
    }
    const ex = Math.round(e.pos?.x ?? e.x ?? 0);
    const ey = Math.round(e.pos?.y ?? e.y ?? 0);
    g.pos.push([ex, ey]);
  }

  return Array.from(groups.values());
}

export function deserializeLevelEnemies(enemiesData: any[] | undefined | null): void {
  if (!enemiesData || !Array.isArray(enemiesData)) return;

  for (const item of enemiesData) {
    if (!item || !Array.isArray(item.pos)) continue;

    // Grouped format matching export: { type: 'e_basic', pos: [[x1, y1], [x2, y2]], isWinCondition?: boolean }
    const type = item.type || 'e_basic';
    const isWin = !!item.isWinCondition;
    
    for (const pt of item.pos) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const enemy = createEnemy(pt[0], pt[1], type);
        enemy.neverDespawn = true;
        if (isWin) enemy.isWinCondition = true;
        state.enemies.push(enemy);
      }
    }
  }
}

export function restoreCustomSpawnerPrefabs(prefabs: any[]): void {
  if (!prefabs || !Array.isArray(prefabs)) return;
  if (!state.levelEditor) state.levelEditor = {};
  state.levelEditor.customSpawnerPrefabs = [...prefabs];
  for (const p of prefabs) {
    if (p && p.id && p.config) {
      const isLiquid = p.category === 'liquids' || p.isLiquid || p.id.startsWith('l_spawner') || !!liquidTypes[p.id];
      if (isLiquid) {
        liquidTypes[p.id] = {
          name: p.name || 'Ground Spawner',
          color: [140, 30, 180, 220],
          glowColor: [200, 60, 240, 90],
          pulseSpeed: 0.04,
          isDanger: true,
          isEnemySpawner: true,
          assetImgConfig: { idleAssetImg: ['img_ground_spawner_a'], randomRotation: false, randomFlip: false },
          liquidConfig: {
            playerMovementSpeedMultiplier: 1.0,
            enemyMovementSpeedMultiplier: 1.0,
            turretFireRateMultiplier: 1.0,
            blocksMovement: false
          },
          enemySpawnConfig: {
            enemyTypeKey: Array.isArray(p.config.enemyTypeKey) ? [...p.config.enemyTypeKey] : ['e_basic'],
            spawnRadius: p.config.spawnRadius !== undefined ? p.config.spawnRadius : 120,
            spawnTriggerRadius: p.config.spawnTriggerRadius !== undefined ? p.config.spawnTriggerRadius : 200,
            spawnInterval: p.config.spawnInterval !== undefined ? p.config.spawnInterval : 60,
            hourlySpawnConfig: p.config.hourlySpawnConfig ? {
              enabled: p.config.hourlySpawnConfig.enabled !== false,
              hourlyDaytimeBudget: Array.isArray(p.config.hourlySpawnConfig.hourlyDaytimeBudget) ? [...p.config.hourlySpawnConfig.hourlyDaytimeBudget] : [10, 20, 30],
              hourlyNighttimeBudget: Array.isArray(p.config.hourlySpawnConfig.hourlyNighttimeBudget) ? [...p.config.hourlySpawnConfig.hourlyNighttimeBudget] : [30, 50, 80],
              hourlyBudgetMultiplierForFollowingDay: p.config.hourlySpawnConfig.hourlyBudgetMultiplierForFollowingDay ?? 1.25,
              selfDestructAfterBudgetSpawned: p.config.hourlySpawnConfig.selfDestructAfterBudgetSpawned ?? 0
            } : {
              enabled: true,
              hourlyDaytimeBudget: [10, 20, 30],
              hourlyNighttimeBudget: [30, 50, 80],
              hourlyBudgetMultiplierForFollowingDay: 1.25,
              selfDestructAfterBudgetSpawned: 0
            }
          },
          isCustomPrefab: true
        };
      } else {
        overlayTypes[p.id] = {
          name: p.name || 'Custom Spawner',
          minHealth: p.config.minHealth !== undefined ? p.config.minHealth : (p.config.health || 300),
          isEnemy: true,
          isEnemySpawner: true,
          danger: 3,
          isDanger: true,
          obstacleOverlayVfx: 'v_spawner',
          isConcealedAlongWithObstacle: false,
          enemySpawnConfig: {
            budget: p.config.budget !== undefined ? p.config.budget : 60,
            enemyTypeKey: Array.isArray(p.config.enemyTypeKey) ? [...p.config.enemyTypeKey] : ['e_basic'],
            spawnRadius: p.config.spawnRadius !== undefined ? p.config.spawnRadius : 120,
            spawnTriggerRadius: p.config.spawnTriggerRadius !== undefined ? p.config.spawnTriggerRadius : 200,
            spawnInterval: p.config.spawnInterval !== undefined ? p.config.spawnInterval : 60,
            health: p.config.health || p.config.minHealth || 300,
            ...(p.config.hourlySpawnConfig ? {
              hourlySpawnConfig: JSON.parse(JSON.stringify(p.config.hourlySpawnConfig))
            } : {})
          },
          assetImgConfig: { idleAssetImg: ['img_spawner_a'], randomRotation: true, randomFlip: true },
          lootConfigOnDeath: 'lc_spawner',
          isCustomPrefab: true
        };
      }
    }
  }
}

export function resolveSpawnerId(b: Block, isLiquid: boolean, prefabsMap?: Map<string, any>): string {
  if (!isLiquid && b.overlay && b.overlay.startsWith('ov_spawner_p_')) {
    return b.overlay;
  }
  if (isLiquid && b.liquidType && b.liquidType.startsWith('l_spawner_p_')) {
    return b.liquidType;
  }

  const name = b.customSpawnerConfig?.name || (isLiquid ? 'Ground Spawner' : 'Custom Spawner');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const defaultPid = isLiquid ? ('l_spawner_p_' + cleanName) : ('ov_spawner_p_' + cleanName);

  if (prefabsMap?.has(defaultPid)) {
    return defaultPid;
  }

  if (prefabsMap) {
    for (const p of prefabsMap.values()) {
      if (p.isLiquid === isLiquid && p.name === name) {
        return p.id;
      }
    }
  }

  return defaultPid;
}

export function findSpawnerPrefabConfig(id: string): any {
  if (state.levelEditor?.customSpawnerPrefabs) {
    const p = state.levelEditor.customSpawnerPrefabs.find((pr: any) => pr.id === id);
    if (p) return p.config;
  }
  if (state.currentLevelLayoutData?.customSpawnerPrefabs) {
    const p = state.currentLevelLayoutData.customSpawnerPrefabs.find((pr: any) => pr.id === id);
    if (p) return p.config;
  }
  return null;
}

export function cleanCustomSpawnerExportConfig(rawConfig: any, isLiquid: boolean): any {
  const cfg = rawConfig || {};
  if (isLiquid) {
    const rawHourly = cfg.hourlySpawnConfig || {};
    const hourlySpawnConfig: any = {
      hourlyDaytimeBudget: Array.isArray(rawHourly.hourlyDaytimeBudget)
        ? [...rawHourly.hourlyDaytimeBudget]
        : (typeof rawHourly.hourlyDaytimeBudget === 'number' ? [rawHourly.hourlyDaytimeBudget] : [10, 20, 30]),
      hourlyNighttimeBudget: Array.isArray(rawHourly.hourlyNighttimeBudget)
        ? [...rawHourly.hourlyNighttimeBudget]
        : (typeof rawHourly.hourlyNighttimeBudget === 'number' ? [rawHourly.hourlyNighttimeBudget] : [30, 50, 80]),
      hourlyBudgetMultiplierForFollowingDay: rawHourly.hourlyBudgetMultiplierForFollowingDay !== undefined
        ? rawHourly.hourlyBudgetMultiplierForFollowingDay
        : 1.25,
      selfDestructAfterBudgetSpawned: rawHourly.selfDestructAfterBudgetSpawned !== undefined
        ? rawHourly.selfDestructAfterBudgetSpawned
        : 0
    };

    return {
      hourlySpawnConfig,
      minHealth: cfg.minHealth ?? cfg.health ?? 300,
      spawnRadius: cfg.spawnRadius !== undefined ? cfg.spawnRadius : 120,
      spawnTriggerRadius: cfg.spawnTriggerRadius !== undefined ? cfg.spawnTriggerRadius : 200,
      spawnInterval: cfg.spawnInterval !== undefined ? cfg.spawnInterval : 60,
      enemyTypeKey: Array.isArray(cfg.enemyTypeKey) && cfg.enemyTypeKey.length > 0
        ? [...cfg.enemyTypeKey]
        : ['e_basic']
    };
  } else {
    return {
      budget: cfg.budget !== undefined ? cfg.budget : 60,
      minHealth: cfg.minHealth ?? cfg.health ?? 300,
      spawnRadius: cfg.spawnRadius !== undefined ? cfg.spawnRadius : 120,
      enemyTypeKey: Array.isArray(cfg.enemyTypeKey) && cfg.enemyTypeKey.length > 0
        ? [...cfg.enemyTypeKey]
        : ['e_basic']
    };
  }
}

export function buildPrefabsMap(): Map<string, any> {
  const prefabsMap = new Map<string, any>();
  if (state.levelEditor?.customSpawnerPrefabs && state.levelEditor.customSpawnerPrefabs.length > 0) {
    for (const p of state.levelEditor.customSpawnerPrefabs) {
      const isLiquid = !!(p.isLiquid || p.category === 'liquids' || (p.id && p.id.startsWith('l_spawner')));
      prefabsMap.set(p.id, {
        id: p.id,
        name: p.name || (isLiquid ? 'Ground Spawner' : 'Custom Spawner'),
        category: isLiquid ? 'liquids' : 'overlays',
        isLiquid: isLiquid,
        config: cleanCustomSpawnerExportConfig(p.config, isLiquid)
      });
    }
  }
  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      for (const blk of (chunk.blocks || [])) {
        if (blk.customSpawnerConfig) {
          const name = blk.customSpawnerConfig.name || (blk.liquidType ? 'Ground Spawner' : 'Custom Spawner');
          const isLiquid = !!blk.liquidType;
          const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const pid = (blk.overlay && blk.overlay.startsWith('ov_spawner_p_')) ? blk.overlay :
            (blk.liquidType && blk.liquidType.startsWith('l_spawner_p_')) ? blk.liquidType :
            (isLiquid ? ('l_spawner_p_' + cleanName) : ('ov_spawner_p_' + cleanName));
          if (!prefabsMap.has(pid)) {
            prefabsMap.set(pid, {
              id: pid,
              name: name,
              category: isLiquid ? 'liquids' : 'overlays',
              isLiquid: isLiquid,
              config: cleanCustomSpawnerExportConfig(blk.customSpawnerConfig, isLiquid)
            });
          }
        }
      }
    });
  }
  return prefabsMap;
}

export function serializeChunkLayers(blocks: Block[], prefabsMap?: Map<string, any>): { obstacles: any[], overlays: any[] } {
  if (!blocks || blocks.length === 0) {
    return { obstacles: [], overlays: [] };
  }

  // 1. Serialize Obstacles (unmined blocks with type)
  const obstacleGroups = new Map<string, { props: any, coords: { gx: number, gy: number }[] }>();

  for (const b of blocks) {
    if (b.isMined || !b.type) continue;

    const defConfig = obstacleTypes[b.type] || obstacleTypes['o_dirt'];
    const defHealth = defConfig ? defConfig.health : 60;
    const hasCustomHealth = b.health !== defHealth || b.maxHealth !== defHealth;

    const props: any = { obstacleType: b.type };
    if (hasCustomHealth) props.health = b.health;
    if (hasCustomHealth && b.maxHealth !== b.health) props.maxHealth = b.maxHealth;
    if (b.isWinCondition) props.isWinCondition = true;
    if (b.customBreakCost !== undefined) props.customBreakCost = b.customBreakCost;
    if (b.paygateConfig) {
      props.paygateConfig = {
        resource: b.paygateConfig.resource || 'soil',
        amount: b.paygateConfig.amount !== undefined ? b.paygateConfig.amount : 10,
        spent: b.paygateConfig.spent || 0
      };
    } else if (b.type === 'o_paygate') {
      props.paygateConfig = { resource: 'soil', amount: 10, spent: 0 };
    }
    if (b.sunGeneratorConfig) {
      props.sunGeneratorConfig = {
        damagePerSun: b.sunGeneratorConfig.damagePerSun,
        maxSun: b.sunGeneratorConfig.maxSun,
        accumulatedDamage: b.sunGeneratorConfig.accumulatedDamage || 0,
        sunsDropped: b.sunGeneratorConfig.sunsDropped || 0
      };
    }
    if (b.biome !== undefined && b.biome !== 0) props.biome = b.biome;

    const key = JSON.stringify(props);
    if (!obstacleGroups.has(key)) {
      obstacleGroups.set(key, { props, coords: [] });
    }
    obstacleGroups.get(key)!.coords.push({ gx: b.gx, gy: b.gy });
  }

  const obstacles: any[] = [];
  for (const { props, coords } of obstacleGroups.values()) {
    coords.sort((a, b) => (a.gy !== b.gy ? a.gy - b.gy : a.gx - b.gx));
    const spans: [number, number, number][] = [];
    let startGx = coords[0].gx;
    let len = 1;
    let currentGy = coords[0].gy;

    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      if (pt.gy === currentGy && pt.gx === startGx + len) {
        len++;
      } else {
        spans.push([startGx, len, currentGy]);
        startGx = pt.gx;
        len = 1;
        currentGy = pt.gy;
      }
    }
    spans.push([startGx, len, currentGy]);
    obstacles.push({
      ...props,
      pos: spans
    });
  }

  // 2. Serialize Overlays and Spawners
  const overlayGroups = new Map<string, { props: any, coords: { gx: number, gy: number }[] }>();

  for (const b of blocks) {
    if (!b.overlay && !b.liquidType) continue;

    const isLiquidSpawner = !!(b.liquidType && (b.liquidType.startsWith('l_spawner') || liquidTypes[b.liquidType]?.isEnemySpawner || (b.customSpawnerConfig && b.liquidType)));
    const isOverlaySpawner = !!(b.overlay && (b.overlay.startsWith('ov_spawner') || overlayTypes[b.overlay]?.isEnemySpawner || (b.customSpawnerConfig && !b.liquidType)));

    if (isOverlaySpawner) {
      const spawnerId = resolveSpawnerId(b, false, prefabsMap);
      const props: any = { customSpawnerId: spawnerId };
      if (b.isWinCondition) props.isWinCondition = true;

      const key = JSON.stringify(props);
      if (!overlayGroups.has(key)) {
        overlayGroups.set(key, { props, coords: [] });
      }
      overlayGroups.get(key)!.coords.push({ gx: b.gx, gy: b.gy });
    } else if (isLiquidSpawner) {
      const groundId = resolveSpawnerId(b, true, prefabsMap);
      const props: any = { customGroundSpawnerId: groundId };
      if (b.isWinCondition) props.isWinCondition = true;

      const key = JSON.stringify(props);
      if (!overlayGroups.has(key)) {
        overlayGroups.set(key, { props, coords: [] });
      }
      overlayGroups.get(key)!.coords.push({ gx: b.gx, gy: b.gy });
    } else {
      // Non-spawner overlay or liquid
      if (b.overlay) {
        const props: any = { overlayType: b.overlay };
        if (b.overlay === 'ov_textsign' || b.customText) {
          props.customText = b.customText || 'Hint';
        }
        if (b.isWinCondition) props.isWinCondition = true;

        const key = JSON.stringify(props);
        if (!overlayGroups.has(key)) {
          overlayGroups.set(key, { props, coords: [] });
        }
        overlayGroups.get(key)!.coords.push({ gx: b.gx, gy: b.gy });
      }
      if (b.liquidType) {
        const props: any = { liquidType: b.liquidType };
        const key = JSON.stringify(props);
        if (!overlayGroups.has(key)) {
          overlayGroups.set(key, { props, coords: [] });
        }
        overlayGroups.get(key)!.coords.push({ gx: b.gx, gy: b.gy });
      }
    }
  }

  const overlays: any[] = [];
  for (const { props, coords } of overlayGroups.values()) {
    coords.sort((a, b) => (a.gy !== b.gy ? a.gy - b.gy : a.gx - b.gx));
    const spans: [number, number, number][] = [];
    let startGx = coords[0].gx;
    let len = 1;
    let currentGy = coords[0].gy;

    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      if (pt.gy === currentGy && pt.gx === startGx + len) {
        len++;
      } else {
        spans.push([startGx, len, currentGy]);
        startGx = pt.gx;
        len = 1;
        currentGy = pt.gy;
      }
    }
    spans.push([startGx, len, currentGy]);
    overlays.push({
      ...props,
      pos: spans
    });
  }

  return { obstacles, overlays };
}

export function serializeChunkBlocks(blocks: Block[]): any[] {
  const { obstacles, overlays } = serializeChunkLayers(blocks);
  return [...obstacles, ...overlays];
}

export function deserializeChunk(chunk: any, chunkData: any): void {
  chunk.blocks = [];
  chunk.blockMap.clear();

  if (!chunkData) return;

  const obstacles = chunkData.obstacles;
  const overlays = chunkData.overlays;

  // 1. Process Obstacles layer
  if (obstacles && Array.isArray(obstacles)) {
    for (const item of obstacles) {
      if (!item || !item.pos || !Array.isArray(item.pos)) continue;
      const obsType = item.obstacleType || item.type || 'o_dirt';

      for (const span of item.pos) {
        if (!Array.isArray(span) || span.length < 2) continue;
        const startGx = span[0];
        const spanLen = span.length >= 3 ? span[1] : 1;
        const gy = span.length >= 3 ? span[2] : span[1];

        for (let i = 0; i < spanLen; i++) {
          const gx = startGx + i;
          const blk = new Block(gx, gy, obsType, null, item.biome || 0, null);
          blk.isMined = !!item.isMined;
          if (item.isWinCondition) blk.isWinCondition = true;
          if (item.customBreakCost !== undefined) blk.customBreakCost = item.customBreakCost;
          if (item.paygateConfig) {
            blk.paygateConfig = {
              resource: item.paygateConfig.resource || 'soil',
              amount: item.paygateConfig.amount !== undefined ? item.paygateConfig.amount : 10,
              spent: item.paygateConfig.spent || 0
            };
          } else if (obsType === 'o_paygate') {
            blk.paygateConfig = { resource: 'soil', amount: 10, spent: 0 };
          }
          if (item.sunGeneratorConfig) {
            blk.sunGeneratorConfig = { ...item.sunGeneratorConfig };
          }
          if (item.health !== undefined) {
            blk.health = item.health;
            blk.maxHealth = item.maxHealth !== undefined ? item.maxHealth : item.health;
          }
          if (item.maxHealth !== undefined) {
            blk.maxHealth = item.maxHealth;
          }
          chunk.blocks.push(blk);
          chunk.blockMap.set(`${gx},${gy}`, blk);
        }
      }
    }
  }

  // 2. Process Overlays / Spawners layer
  if (overlays && Array.isArray(overlays)) {
    for (const item of overlays) {
      if (!item || !item.pos || !Array.isArray(item.pos)) continue;

      for (const span of item.pos) {
        if (!Array.isArray(span) || span.length < 2) continue;
        const startGx = span[0];
        const spanLen = span.length >= 3 ? span[1] : 1;
        const gy = span.length >= 3 ? span[2] : span[1];

        for (let i = 0; i < spanLen; i++) {
          const gx = startGx + i;
          let blk = chunk.blockMap.get(`${gx},${gy}`);
          if (!blk) {
            blk = new Block(gx, gy, 'o_dirt', null, 0, null);
            blk.isMined = true;
            chunk.blocks.push(blk);
            chunk.blockMap.set(`${gx},${gy}`, blk);
          }

          if (item.customSpawnerId) {
            const spawnerId = item.customSpawnerId;
            blk.setOverlay(spawnerId);
            const oCfg = overlayTypes[spawnerId];
            const pCfg = oCfg?.enemySpawnConfig || findSpawnerPrefabConfig(spawnerId);
            const cfg = item.customSpawnerConfig || pCfg || {};
            const budget = item.spawnerBudget !== undefined ? item.spawnerBudget : (cfg.budget ?? 60);
            const minHealth = item.health !== undefined ? item.health : (cfg.minHealth ?? cfg.health ?? 300);
            blk.setCustomSpawnerConfig({
              ...cfg,
              budget: budget,
              minHealth: minHealth,
              health: minHealth
            });
            if (item.isWinCondition) blk.isWinCondition = true;
          } else if (item.customGroundSpawnerId) {
            const groundId = item.customGroundSpawnerId;
            blk.isMined = true;
            blk.overlay = null;
            blk.liquidType = groundId;
            const lCfg = liquidTypes[groundId];
            const pCfg = lCfg?.enemySpawnConfig || findSpawnerPrefabConfig(groundId);
            const cfg = item.customSpawnerConfig || pCfg || {};
            const rawHourly = cfg.hourlySpawnConfig || {};
            blk.setCustomSpawnerConfig({
              ...cfg,
              hourlySpawnConfig: {
                enabled: rawHourly.enabled !== false,
                hourlyDaytimeBudget: Array.isArray(rawHourly.hourlyDaytimeBudget) ? [...rawHourly.hourlyDaytimeBudget] : [10, 20, 30],
                hourlyNighttimeBudget: Array.isArray(rawHourly.hourlyNighttimeBudget) ? [...rawHourly.hourlyNighttimeBudget] : [30, 50, 80],
                hourlyBudgetMultiplierForFollowingDay: rawHourly.hourlyBudgetMultiplierForFollowingDay ?? 1.25,
                selfDestructAfterBudgetSpawned: rawHourly.selfDestructAfterBudgetSpawned ?? 0
              }
            });
            blk.lastSpawnTime = state.frames + Math.floor(Math.random() * (blk.customSpawnerConfig?.spawnInterval || 60));
            if (item.isWinCondition) blk.isWinCondition = true;
          } else if (item.overlayType || item.overlay) {
            const ov = item.overlayType || item.overlay;
            blk.setOverlay(ov);
            if (item.customText !== undefined) {
              blk.customText = item.customText;
            } else if (ov === 'ov_textsign') {
              blk.customText = 'Hint';
            }
            if (item.isWinCondition) blk.isWinCondition = true;
          } else if (item.liquidType) {
            blk.liquidType = item.liquidType;
            blk.isMined = true;
            blk.overlay = null;
          }
        }
      }
    }
  }

  chunk.rebuildOverlayList();
}

/**
 * @deprecated Legacy monolithic block deserialization. The engine now strictly parses decoupled obstacles and overlays.
 */
export function deserializeChunkBlocks(chunk: any, blocksData: any[]): void {
  console.warn('deserializeChunkBlocks is deprecated; chunks now strictly use decoupled { obstacles, overlays } format.');
  deserializeChunk(chunk, { obstacles: blocksData });
}

export function serializeChunkTurrets(turrets: any[]): any[] {
  if (!turrets || turrets.length === 0) return [];
  const groups = new Map<string, { type: string, health?: number, pos: [number, number][] }>();

  for (const t of turrets) {
    const hasCustomHealth = t.health !== undefined && t.health !== 100;
    const health = hasCustomHealth ? t.health : undefined;
    const key = `${t.type}_${health ?? 'def'}`;

    if (!groups.has(key)) {
      groups.set(key, {
        type: t.type,
        ...(health !== undefined ? { health } : {}),
        pos: []
      });
    }
    groups.get(key)!.pos.push([t.gx, t.gy]);
  }

  return Array.from(groups.values());
}

export function serializeLevelLoots(world: any): any[] {
  if (!world || !world.chunks) return [];
  const groups = new Map<string, { lootType: string; pos: [number, number][] }>();

  world.chunks.forEach((chunk: any) => {
    if (!chunk || !chunk.loot || !Array.isArray(chunk.loot)) return;
    for (const l of chunk.loot) {
      if (!l) continue;
      const typeKey = l.typeKey || l.config?.item || 'sun';
      let g = groups.get(typeKey);
      if (!g) {
        g = {
          lootType: typeKey,
          pos: []
        };
        groups.set(typeKey, g);
      }
      const lx = Math.round(l.pos?.x ?? l.x ?? 0);
      const ly = Math.round(l.pos?.y ?? l.y ?? 0);
      g.pos.push([lx, ly]);
    }
  });

  return Array.from(groups.values());
}

export function deserializeLevelLoots(world: any, lootsData: any[] | undefined | null): void {
  if (!world || !lootsData || !Array.isArray(lootsData)) return;

  for (const item of lootsData) {
    if (!item || !Array.isArray(item.pos)) continue;
    const type = item.lootType || item.type || 'sun';

    for (const pt of item.pos) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const px = pt[0];
        const py = pt[1];
        const cx = floor(px / (GRID_SIZE * CHUNK_SIZE));
        const cy = floor(py / (GRID_SIZE * CHUNK_SIZE));
        const chunk = world.getChunk(cx, cy);
        if (chunk) {
          const loot = spawnLootEntity(px, py, type);
          loot.neverDespawn = true;
          chunk.loot.push(loot);
        }
      }
    }
  }
}

export function deserializeChunkTurrets(chunk: any, turretsData: any[]): void {
  chunk.turrets = [];
  if (!turretsData || !Array.isArray(turretsData)) return;

  for (const td of turretsData) {
    if (td.pos && Array.isArray(td.pos)) {
      for (const p of td.pos) {
        if (Array.isArray(p) && p.length >= 2) {
          const wt = createWorldTurret(td.type, p[0], p[1]);
          if (td.health !== undefined) wt.health = td.health;
          chunk.turrets.push(wt);
        }
      }
    }
  }
}

export function saveLevelLayout(customName?: string, customDescription?: string) {
  if (state.world) {
    state.world.rebuildPayGateGroups();
  }
  const currentConfig = LEVELS.find(l => l.id === state.currentLevelId);
  const levelCfg = serializeLevelEditorLevelConfig() || {};

  const levelId = levelCfg.levelId || state.currentLevelId || 'editor_custom';
  const levelName = customName || levelCfg.levelName || currentConfig?.name || `Level ${state.currentLevelId}`;
  const levelDescription = customDescription || levelCfg.levelDescription || currentConfig?.description || 'Custom exported level layout.';
  const tag = levelCfg.tag || currentConfig?.tag || 'CUSTOM MAP';

  const prog = state.levelEditorAlmanacProgression || state.currentLevelLayoutData?.almanacProgression || state.currentLevelLayoutData?.AlmanacProgression || AlmanacProgression;
  const playerUpgrades = serializeLevelEditorPlayerUpgrades() || state.currentLevelLayoutData?.playerUpgrades || state.currentLevelLayoutData?.PlayerUpgrades;
  const exportedProgression = buildExportAlmanacProgression(prog);

  const levelData: any = {
    version: 2,
    levelId: levelId,
    levelName: levelName,
    levelDescription: levelDescription,
    tag: tag,
    enableWorldGen: state.currentLevelLayoutData?.enableWorldGen ?? (state.currentLevelId === 'sandbox' ? false : true),
    almanacProgression: exportedProgression,
    ...(playerUpgrades ? { playerUpgrades } : {}),
    ...(levelCfg.sunSpawnHourInterval !== undefined ? { sunSpawnHourInterval: levelCfg.sunSpawnHourInterval } : (state.currentLevelLayoutData?.sunSpawnHourInterval !== undefined ? { sunSpawnHourInterval: state.currentLevelLayoutData.sunSpawnHourInterval } : { sunSpawnHourInterval: 0.5 })),
    ...(levelCfg.customBudgetPerNight !== undefined ? { customBudgetPerNight: levelCfg.customBudgetPerNight } : (state.currentLevelLayoutData?.customBudgetPerNight ? { customBudgetPerNight: state.currentLevelLayoutData.customBudgetPerNight } : {})),
    ...(levelCfg.hourlyBudgetPerDay !== undefined ? { hourlyBudgetPerDay: levelCfg.hourlyBudgetPerDay } : (state.currentLevelLayoutData?.hourlyBudgetPerDay ? { hourlyBudgetPerDay: state.currentLevelLayoutData.hourlyBudgetPerDay } : {})),
    ...(levelCfg.hourlyBudgetPerNight !== undefined ? { hourlyBudgetPerNight: levelCfg.hourlyBudgetPerNight } : (state.currentLevelLayoutData?.hourlyBudgetPerNight ? { hourlyBudgetPerNight: state.currentLevelLayoutData.hourlyBudgetPerNight } : {})),
    ...(levelCfg.enabledCurrency !== undefined ? { enabledCurrency: levelCfg.enabledCurrency } : (state.currentLevelLayoutData?.enabledCurrency ? { enabledCurrency: state.currentLevelLayoutData.enabledCurrency } : {})),
    ...(levelCfg.startingResource !== undefined ? { startingResource: levelCfg.startingResource } : (state.currentLevelLayoutData?.startingResource ? { startingResource: state.currentLevelLayoutData.startingResource } : {})),
    globalEnemySpawnConfig: formatGlobalEnemySpawnConfig(levelCfg.globalEnemySpawnConfig || state.currentLevelLayoutData?.globalEnemySpawnConfig || {}),
    ...(levelCfg.starRatingTargets !== undefined ? { starRatingTargets: levelCfg.starRatingTargets } : (state.currentLevelLayoutData?.starRatingTargets ? { starRatingTargets: state.currentLevelLayoutData.starRatingTargets } : {})),
    ...(levelCfg.nightsToPass !== undefined ? { nightsToPass: levelCfg.nightsToPass } : (state.currentLevelLayoutData?.nightsToPass !== undefined ? { nightsToPass: state.currentLevelLayoutData.nightsToPass } : {})),
    ...(levelCfg.enemyBudgetValueToKill !== undefined ? { enemyBudgetValueToKill: levelCfg.enemyBudgetValueToKill } : (state.currentLevelLayoutData?.enemyBudgetValueToKill !== undefined ? { enemyBudgetValueToKill: state.currentLevelLayoutData.enemyBudgetValueToKill } : {})),
    ...(levelCfg.collectResource && Object.keys(levelCfg.collectResource).length > 0 ? { collectResource: levelCfg.collectResource } : (state.currentLevelLayoutData?.collectResource ? { collectResource: state.currentLevelLayoutData.collectResource } : {})),
    ...(levelCfg.huntEnemy && Object.keys(levelCfg.huntEnemy).length > 0 ? { huntEnemy: levelCfg.huntEnemy } : (state.currentLevelLayoutData?.huntEnemy ? { huntEnemy: state.currentLevelLayoutData.huntEnemy } : {})),
    ...(levelCfg.breakObstacle && Object.keys(levelCfg.breakObstacle).length > 0 ? { breakObstacle: levelCfg.breakObstacle } : (state.currentLevelLayoutData?.breakObstacle ? { breakObstacle: state.currentLevelLayoutData.breakObstacle } : {})),
    destroyAllEnemySpawners: levelCfg.destroyAllEnemySpawners ?? state.currentLevelLayoutData?.destroyAllEnemySpawners ?? true,
    timestamp: new Date().toISOString(),
    playerSpawn: {
      x: state.player ? Math.round(state.player.pos.x) : 0,
      y: state.player ? Math.round(state.player.pos.y) : 0
    },
    chunks: []
  };

  const prefabsMap = buildPrefabsMap();
  if (prefabsMap.size > 0) {
    levelData.customSpawnerPrefabs = Array.from(prefabsMap.values());
  }

  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      const { obstacles, overlays } = serializeChunkLayers(chunk.blocks, prefabsMap);
      const turrets = serializeChunkTurrets(chunk.turrets);

      if (obstacles.length > 0 || overlays.length > 0 || turrets.length > 0) {
        const chunkData: any = {
          cx: chunk.cx,
          cy: chunk.cy,
          localChunkLevel: chunk.localChunkLevel,
          prefabId: chunk.prefabId
        };
        if (obstacles.length > 0) chunkData.obstacles = obstacles;
        if (overlays.length > 0) chunkData.overlays = overlays;
        if (turrets.length > 0) chunkData.turrets = turrets;
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
  levelData.loots = serializeLevelLoots(state.world);

  if (state.world && state.world.spawnAreaSet && state.world.spawnAreaSet.size > 0) {
    levelData.spawnAreaTiles = serializeSpawnAreaTiles(state.world.spawnAreaSet);
  }

  const jsonString = JSON.stringify(levelData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `level_layout_${state.currentLevelId}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getRemainingWinConditionEntitiesAndSpawners() {
  const layout = state.currentLevelLayoutData || {};
  const isSandbox = state.currentLevelId === 'sandbox' || 
                    state.currentLevelId === 'sbw' || 
                    state.currentLevelId === 'mpty' || 
                    state.currentLevelLayoutData?.tag?.toLowerCase() === 'sandbox' || 
                    state.currentLevelLayoutData?.tag?.toLowerCase() === 'dev' || 
                    layout.noWinCondition === true || 
                    layout.disableWinCondition === true;
  if (isSandbox) return [];

  const items: Array<{ x: number, y: number, label: string }> = [];
  if (state.enemies) {
    for (const e of state.enemies) {
      if ((e.isWinCondition || (state.currentLevelLayoutData?.destroyAllEnemySpawners !== false && e.isEnemySpawner)) && e.health > 0 && !e.isDying) {
        items.push({ x: e.pos.x, y: e.pos.y, label: 'Enemy' });
      }
    }
  }
  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      for (const b of chunk.blocks) {
        if (!b.isMined) {
          const isSpawner = b.overlay?.startsWith('ov_spawner') || b.liquidType === 'l_spawner' || b.customSpawnerConfig || overlayTypes[b.overlay || '']?.isEnemySpawner;
          if (b.isWinCondition || isSpawner) {
            items.push({ x: b.pos.x + GRID_SIZE / 2, y: b.pos.y + GRID_SIZE / 2, label: isSpawner ? 'Spawner' : 'Target' });
          }
        }
      }
    });
  }
  return items;
}

export function evaluateWinConditions(): boolean {
  if (state.isGameOver || (state.levelWonSequence && state.levelWonSequence.active)) return false;
  const layout = state.currentLevelLayoutData || {};
  
  const isSandbox = state.currentLevelId === 'sandbox' || 
                    state.currentLevelId === 'sbw' || 
                    state.currentLevelId === 'mpty' || 
                    state.currentLevelLayoutData?.tag?.toLowerCase() === 'sandbox' || 
                    state.currentLevelLayoutData?.tag?.toLowerCase() === 'dev' || 
                    layout.noWinCondition === true || 
                    layout.disableWinCondition === true;
  if (isSandbox) {
    return false;
  }
  
  let allMet = true;

  const winEnemies = (state.enemies || []).filter((e: any) => e.isWinCondition && e.health > 0 && !e.isDying);
  let winBlocksCount = 0;
  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((chunk: any) => {
      for (const b of chunk.blocks) {
        if (b.isWinCondition && !b.isMined) winBlocksCount++;
      }
    });
  }
  if (winEnemies.length > 0 || winBlocksCount > 0) {
    allMet = false;
  }

  if (layout.nightsToPass !== undefined && layout.nightsToPass > 0) {
    const totalHours = (state.frames / HOUR_FRAMES);
    const day = Math.floor(totalHours / 24) + 1;
    if (day <= layout.nightsToPass) {
      allMet = false;
    }
  }

  if (layout.enemyBudgetValueToKill !== undefined && layout.enemyBudgetValueToKill > 0) {
    if ((state.accumulatedEnemyBudgetKilled || 0) < layout.enemyBudgetValueToKill) {
      allMet = false;
    }
  }

  if (layout.collectResource && typeof layout.collectResource === 'object') {
    for (const [resType, reqAmt] of Object.entries(layout.collectResource as Record<string, number>)) {
      const coll = state.accumulatedCollectedResources?.[resType] || (state as any)[resType + 'Currency'] || 0;
      if (coll < reqAmt) {
        allMet = false;
        break;
      }
    }
  }

  if (layout.huntEnemy && typeof layout.huntEnemy === 'object') {
    for (const [eType, reqAmt] of Object.entries(layout.huntEnemy as Record<string, number>)) {
      const killed = state.accumulatedHuntEnemy?.[eType] || 0;
      if (killed < reqAmt) {
        allMet = false;
        break;
      }
    }
  }

  if (layout.breakObstacle && typeof layout.breakObstacle === 'object') {
    for (const [obsType, reqAmt] of Object.entries(layout.breakObstacle as Record<string, number>)) {
      const mined = state.accumulatedBreakObstacle?.[obsType] || 0;
      if (mined < reqAmt) {
        allMet = false;
        break;
      }
    }
  }

  const checkSpawners = layout.destroyAllEnemySpawners !== false;
  if (checkSpawners) {
    let spawnerCount = 0;
    if (state.world && state.world.chunks) {
      state.world.chunks.forEach((chunk: any) => {
        for (const b of chunk.blocks) {
          if (!b.isMined) {
            const isSpawner = b.overlay?.startsWith('ov_spawner') || b.liquidType === 'l_spawner' || b.customSpawnerConfig || overlayTypes[b.overlay || '']?.isEnemySpawner;
            if (isSpawner) spawnerCount++;
          }
        }
      });
    }
    if (spawnerCount > 0) {
      allMet = false;
    }
  }

  if (winEnemies.length === 0 && winBlocksCount === 0 && !layout.nightsToPass && !layout.enemyBudgetValueToKill && !layout.collectResource && !layout.huntEnemy && !layout.breakObstacle) {
    let spawnerCount = 0;
    if (state.world && state.world.chunks) {
      state.world.chunks.forEach((chunk: any) => {
        for (const b of chunk.blocks) {
          if (!b.isMined && (b.overlay?.startsWith('ov_spawner' ) || b.liquidType === 'l_spawner' || b.customSpawnerConfig || overlayTypes[b.overlay || '']?.isEnemySpawner)) {
            spawnerCount++;
          }
        }
      });
    }
    allMet = (spawnerCount === 0);
  }

  return allMet && state.player && state.player.health > 0;
}

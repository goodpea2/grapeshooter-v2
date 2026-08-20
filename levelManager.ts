import { state } from './state';
import { WorldManager, Block } from './world';
import { Player, GroundFeature, NPCEntity, Enemy } from './entities';
import { GRID_SIZE, HOUR_FRAMES } from './constants';
import { customStartingHour, AlmanacProgression, getActiveAlmanacProgression } from './lvDemo';
import { createWorldTurret } from './class/turret/TurretRegistry';
import { obstacleTypes, overlayTypes } from './balanceObstacles';
import { resetPlayerUpgrades } from './src/playerUpgrades';
import { serializeLevelEditorPlayerUpgrades } from './ui/almanac/playerUpgradesPanel';

import { serializeLevelEditorLevelConfig } from './ui/almanac/levelConfigPanel';

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  tag: string;
  customLayoutData?: any;
}

export const DEFAULT_LEVELS: LevelConfig[] = [
  {
    id: 'dev_test',
    name: 'Sandbox',
    tag: 'Dev',
    description: 'For testing'
  },
  {
    id: 'sandbox',
    name: 'Empty',
    tag: 'Dev',
    description: 'For testing',
    customLayoutData: {
      enableWorldGen: false
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
    state.levelEditor.worldDragButton = null;
    state.levelEditor.isRightDragActive = false;
    state.levelEditor.isRightDragOverlayOnly = false;
    state.levelEditor.toolbarSpawnerTooltip = null;
    state.levelEditor.activeSpawnerInput = null;
    state.levelEditor.spawnAreaLassoPoints = [];
  }
  (window as any).mouseIsPressed = false;
  state.ignoreGameplayClickUntilRelease = true;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e: any) => {
    if (state.levelEditor) {
      state.levelEditor.isWorldDragActive = false;
      state.levelEditor.worldDragButton = null;
    }
    (window as any).mouseIsPressed = false;
    state.ignoreGameplayClickUntilRelease = true;

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
        } else {
          alert('Invalid level JSON file structure.');
        }
      } catch (err) {
        console.error('Failed to parse level JSON:', err);
        alert('Failed to parse level JSON file.');
      }
    };
    reader.readAsText(file);
  };
  input.oncancel = () => {
    if (state.levelEditor) {
      state.levelEditor.isWorldDragActive = false;
      state.levelEditor.worldDragButton = null;
    }
    (window as any).mouseIsPressed = false;
    state.ignoreGameplayClickUntilRelease = true;
  };
  input.click();
}

export function startLevel(levelId: string, customLayoutData?: any) {
  state.currentLevelId = levelId;
  state.currentScreen = 'game';

  // Find level configuration from LEVELS registry if layout data is not passed
  const levelConfig = LEVELS.find(l => l.id === levelId);
  const layout = customLayoutData || levelConfig?.customLayoutData;
  state.currentLevelLayoutData = layout || null;

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
  state.playerTrail = [];
  
  // Game Over & UI states
  state.isEditorPlaytest = (levelId === 'editor_playtest');
  if (!state.isEditorPlaytest) {
    state.levelEditorCache = null;
  }
  state.isGameOver = false;
  state.isLevelCompleted = false;
  state.gameOverDelayTimer = 0;
  state.winConditionActive = false;
  state.showGameOverPopup = false;
  state.gameOverProgress = 0;
  state.ignoreGameplayClickUntilRelease = false;
  state.isPaused = false;
  state.activeNPC = null;
  state.selectedTurretType = null;
  state.draggedTurretType = null;
  state.draggedTurretInstance = null;
  state.isCurrentlyDragging = false;
  state.isAlmanacOpen = false;
  state.showUnlockPopup = false;
  state.showWorldGenPreview = false;

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

  // If loading custom layout data
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

  // Load Spawn Area Tiles if provided
  deserializeSpawnAreaTiles(state.world, layout?.spawnAreaTiles);

  // Restore Custom Spawner Prefabs if provided
  if (layout?.customSpawnerPrefabs && Array.isArray(layout.customSpawnerPrefabs)) {
    restoreCustomSpawnerPrefabs(layout.customSpawnerPrefabs);
  }
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
    if (Array.isArray(item)) {
      if (item.length >= 3) {
        // v2 span format: [startGx, spanLen, gy]
        const startGx = item[0];
        const spanLen = Math.max(1, item[1]);
        const gy = item[2];
        for (let i = 0; i < spanLen; i++) {
          world.spawnAreaSet.add(`${startGx + i},${gy}`);
        }
      } else if (item.length === 2) {
        world.spawnAreaSet.add(`${item[0]},${item[1]}`);
      }
    } else if (typeof item === 'string') {
      world.spawnAreaSet.add(item);
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
    if (!item) continue;

    // Grouped format: { type: 'e_basic', pos: [[x1, y1], [x2, y2]], isWinCondition?: boolean }
    if (Array.isArray(item.pos)) {
      const type = item.type || 'e_basic';
      const isWin = !!item.isWinCondition || !!item.winConditionTagIfDeclared;
      
      if (item.pos.length > 0 && Array.isArray(item.pos[0])) {
        for (const pt of item.pos) {
          if (Array.isArray(pt) && pt.length >= 2) {
            const enemy = new Enemy(pt[0], pt[1], type);
            enemy.neverDespawn = true;
            if (isWin) enemy.isWinCondition = true;
            state.enemies.push(enemy);
          }
        }
      } else if (item.pos.length >= 2 && typeof item.pos[0] === 'number') {
        const enemy = new Enemy(item.pos[0], item.pos[1], type);
        enemy.neverDespawn = true;
        if (isWin) enemy.isWinCondition = true;
        state.enemies.push(enemy);
      }
    } 
    // Legacy individual format: { x: 100, y: 200, type: 'e_basic', isWinCondition?: boolean }
    else if (typeof item.x === 'number' && typeof item.y === 'number') {
      const enemy = new Enemy(item.x, item.y, item.type || 'e_basic');
      enemy.neverDespawn = true;
      if (item.isWinCondition || item.winConditionTagIfDeclared) {
        enemy.isWinCondition = true;
      }
      state.enemies.push(enemy);
    }
  }
}

export function restoreCustomSpawnerPrefabs(prefabs: any[]): void {
  if (!prefabs || !Array.isArray(prefabs)) return;
  if (!state.levelEditor) state.levelEditor = {};
  state.levelEditor.customSpawnerPrefabs = [...prefabs];
  for (const p of prefabs) {
    if (p.id && p.config) {
      overlayTypes[p.id] = {
        name: p.name || 'Custom Spawner',
        minHealth: p.config.health || 300,
        isEnemy: true,
        isEnemySpawner: true,
        danger: 3,
        isDanger: true,
        obstacleOverlayVfx: 'v_spawner',
        isConcealedAlongWithObstacle: false,
        enemySpawnConfig: { ...p.config },
        assetImgConfig: { idleAssetImg: ['img_spawner_a'], randomRotation: true, randomFlip: true },
        lootConfigOnDeath: 'lc_spawner',
        isCustomPrefab: true
      };
    }
  }
}

export function serializeChunkBlocks(blocks: Block[]): any[] {
  const activeBlocks = (blocks || []).filter(b => !b.isMined || b.overlay || b.liquidType);
  if (activeBlocks.length === 0) return [];

  // Group blocks by identical properties
  const groups = new Map<string, { props: any, coords: { gx: number, gy: number }[] }>();

  for (const b of activeBlocks) {
    const defConfig = obstacleTypes[b.type] || obstacleTypes['o_dirt'];
    const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
    let defHealth = defConfig ? defConfig.health : 60;
    if (oCfg?.minHealth !== undefined && oCfg.minHealth > 0) {
      defHealth = Math.max(defHealth, oCfg.minHealth);
    }
    const defSpawnerBudget = oCfg?.enemySpawnConfig ? oCfg.enemySpawnConfig.budget : 0;

    const overlay = b.overlay || null;
    const liquidType = b.liquidType || null;
    const isMined = !!b.isMined;
    const hasCustomHealth = b.health !== defHealth || b.maxHealth !== defHealth;
    const customHealth = hasCustomHealth ? b.health : undefined;
    const customMaxHealth = (hasCustomHealth && b.maxHealth !== b.health) ? b.maxHealth : undefined;
    const customSpawnerBudget = (b.spawnerBudget !== defSpawnerBudget && b.spawnerBudget > 0) ? b.spawnerBudget : undefined;
    const biome = b.biome ? b.biome : undefined;
    const customSpawnerConfig = b.customSpawnerConfig ? b.customSpawnerConfig : undefined;

    const props: any = { type: b.type };
    if (overlay) props.overlay = overlay;
    if (liquidType) props.liquidType = liquidType;
    if (isMined) props.isMined = true;
    if (customHealth !== undefined) props.health = customHealth;
    if (customMaxHealth !== undefined) props.maxHealth = customMaxHealth;
    if (customSpawnerBudget !== undefined) props.spawnerBudget = customSpawnerBudget;
    if (customSpawnerConfig !== undefined) props.customSpawnerConfig = customSpawnerConfig;
    if (biome !== undefined) props.biome = biome;

    const groupKey = JSON.stringify(props);
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { props, coords: [] });
    }
    groups.get(groupKey)!.coords.push({ gx: b.gx, gy: b.gy });
  }

  const result: any[] = [];

  for (const { props, coords } of groups.values()) {
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

    result.push({
      ...props,
      pos: spans
    });
  }

  return result;
}

export function deserializeChunkBlocks(chunk: any, blocksData: any[]): void {
  chunk.blocks = [];
  chunk.blockMap.clear();

  if (!blocksData || !Array.isArray(blocksData)) return;

  for (const item of blocksData) {
    if (!item) continue;

    if (item.pos && Array.isArray(item.pos)) {
      // Compressed v2 span format
      for (const span of item.pos) {
        if (!Array.isArray(span)) continue;
        let startGx: number;
        let spanLen: number;
        let gy: number;

        if (span.length >= 3) {
          startGx = span[0];
          spanLen = span[1];
          gy = span[2];
        } else if (span.length === 2) {
          startGx = span[0];
          spanLen = 1;
          gy = span[1];
        } else {
          continue;
        }

        for (let i = 0; i < spanLen; i++) {
          const gx = startGx + i;
          const blk = new Block(gx, gy, item.type || 'o_dirt', item.overlay || null, item.biome || 0, item.liquidType || null);
          blk.isMined = !!item.isMined;
          if (item.health !== undefined) blk.health = item.health;
          if (item.maxHealth !== undefined) blk.maxHealth = item.maxHealth;
          if (item.spawnerBudget !== undefined) blk.spawnerBudget = item.spawnerBudget;
          if (item.customSpawnerConfig) {
            blk.customSpawnerConfig = item.customSpawnerConfig;
            if (item.customSpawnerConfig.budget !== undefined) blk.spawnerBudget = item.customSpawnerConfig.budget;
            if (item.customSpawnerConfig.health !== undefined) {
              blk.health = item.customSpawnerConfig.health;
              blk.maxHealth = item.customSpawnerConfig.health;
            }
          }
          chunk.blocks.push(blk);
          chunk.blockMap.set(`${gx},${gy}`, blk);
        }
      }
    }
  }

  chunk.rebuildOverlayList();
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
  const currentConfig = LEVELS.find(l => l.id === state.currentLevelId);
  const levelCfg = serializeLevelEditorLevelConfig() || {};

  const levelId = levelCfg.levelId || state.currentLevelId || 'editor_custom';
  const levelName = customName || levelCfg.levelName || currentConfig?.name || `Level ${state.currentLevelId}`;
  const levelDescription = customDescription || levelCfg.levelDescription || currentConfig?.description || 'Custom exported level layout.';
  const tag = levelCfg.tag || currentConfig?.tag || 'CUSTOM MAP';

  const prog = state.levelEditorAlmanacProgression || state.currentLevelLayoutData?.almanacProgression || state.currentLevelLayoutData?.AlmanacProgression || AlmanacProgression;
  const playerUpgrades = serializeLevelEditorPlayerUpgrades() || state.currentLevelLayoutData?.playerUpgrades || state.currentLevelLayoutData?.PlayerUpgrades;

  const levelData: any = {
    version: 2,
    levelId: levelId,
    levelName: levelName,
    levelDescription: levelDescription,
    tag: tag,
    enableWorldGen: state.currentLevelLayoutData?.enableWorldGen ?? (state.currentLevelId === 'sandbox' ? false : true),
    almanacProgression: {
      StartingTurret: [...(prog.StartingTurret || [])],
      UnlockedByDiscoverTurret: [...(prog.UnlockedByDiscoverTurret || [])],
      LockedTurret: [...(prog.LockedTurret || [])],
      BannedTurrets: [...(prog.BannedTurrets || [])],
      UnlockCost: [...(prog.UnlockCost || AlmanacProgression.UnlockCost || [])],
      AllTurretCrafting: prog.AllTurretCrafting !== false,
      AllTurretUpgrade: prog.AllTurretUpgrade !== false,
      CraftingCostOverride: [...(prog.CraftingCostOverride || AlmanacProgression.CraftingCostOverride || [])]
    },
    ...(playerUpgrades ? { playerUpgrades } : {}),
    ...(levelCfg.customBudgetPerNight !== undefined ? { customBudgetPerNight: levelCfg.customBudgetPerNight } : (state.currentLevelLayoutData?.customBudgetPerNight ? { customBudgetPerNight: state.currentLevelLayoutData.customBudgetPerNight } : {})),
    ...(levelCfg.hourlyBudgetPerDay !== undefined ? { hourlyBudgetPerDay: levelCfg.hourlyBudgetPerDay } : (state.currentLevelLayoutData?.hourlyBudgetPerDay ? { hourlyBudgetPerDay: state.currentLevelLayoutData.hourlyBudgetPerDay } : {})),
    ...(levelCfg.hourlyBudgetPerNight !== undefined ? { hourlyBudgetPerNight: levelCfg.hourlyBudgetPerNight } : (state.currentLevelLayoutData?.hourlyBudgetPerNight ? { hourlyBudgetPerNight: state.currentLevelLayoutData.hourlyBudgetPerNight } : {})),
    ...(levelCfg.enabledCurrency !== undefined ? { enabledCurrency: levelCfg.enabledCurrency } : (state.currentLevelLayoutData?.enabledCurrency ? { enabledCurrency: state.currentLevelLayoutData.enabledCurrency } : {})),
    ...(levelCfg.startingResource !== undefined ? { startingResource: levelCfg.startingResource } : (state.currentLevelLayoutData?.startingResource ? { startingResource: state.currentLevelLayoutData.startingResource } : {})),
    ...(levelCfg.globalEnemySpawnConfig !== undefined ? { globalEnemySpawnConfig: levelCfg.globalEnemySpawnConfig } : (state.currentLevelLayoutData?.globalEnemySpawnConfig ? { globalEnemySpawnConfig: state.currentLevelLayoutData.globalEnemySpawnConfig } : {})),
    timestamp: new Date().toISOString(),
    playerSpawn: {
      x: state.player ? Math.round(state.player.pos.x) : 0,
      y: state.player ? Math.round(state.player.pos.y) : 0
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

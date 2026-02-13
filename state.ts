
import { HOUR_FRAMES, SPATIAL_HASH_CELL_SIZE } from './constants';
import { customStartingHour } from './lvDemo';

export const state: any = {
  player: null,
  world: null,
  bullets: [],
  groundFeatures: [],
  loot: [],
  vfx: [],
  trails: [], // Dedicated array for liquid trails (rendered under entities)
  enemies: [],
  enemyBullets: [],
  sunCurrency: 10,
  elixirCurrency: 0,
  soilCurrency: 0,
  cameraPos: { x: 0, y: 0 },
  exploredChunks: new Set(),
  currentChunkLevel: 0,
  frames: customStartingHour * HOUR_FRAMES,
  deathVisualsBuffer: null,
  
  // Spatial Partitioning
  spatialHash: new Map(),
  spatialHashCellSize: SPATIAL_HASH_CELL_SIZE,

  // Loaded Assets
  assets: {},

  // Systems
  pendingSpawns: [], // { x, y, type, timer }
  tickingExplosives: [], // { x, y, type, timer, maxTimer }

  // Budget system
  lastNightTriggered: 0,
  currentNightWaveBudget: 60,
  hourlyBudgetPool: 0,
  lastHourProcessed: -1,
  accumulatedSpentBudget: 0,
  refundedBudget: 0,

  // Economy & World Generation Pots
  sunSpawnedTotal: 0, 
  sunMissedTotal: 0,    
  totalSunLootCollected: 0,
  accumulatedSunPot: 0,
  accumulatedTntPot: 0,
  accumulatedStrayPot: 0,
  accumulatedSunflowerPot: 1.0, 
  accumulatedSniperPot: 0,
  accumulatedSpawnerPot: 0,

  // Total spawned trackers for debug
  totalSunSpawned: 0,
  totalTntSpawned: 0,
  totalStraySpawned: 0,
  totalSunflowerSpawned: 0,
  totalSniperSpawned: 0,
  totalSpawnerSpawned: 0,

  // Enemy stats
  totalEnemiesDead: 0,

  // UI & Interaction
  uiWidth: 100,
  draggedTurretType: null, 
  draggedTurretInstance: null, 
  dragOrigin: { x: 0, y: 0 },
  isCurrentlyDragging: false,
  selectedTurretType: null, 
  isStationary: true,
  stationaryTimer: 0,
  showDebug: false,
  debugScrollY: 0,
  debugScrollVelocity: 0,
  debugSectionsCollapsed: {
    core: false,
    groundFeatures: true,
    obstacles: true,
    overlays: true
  },
  showWorldGenPreview: false,
  debugGizmosTurrets: false,
  debugGizmosEnemies: false,
  debugHP: false,
  hoveredTurretInstance: null, 
  previewSnapPos: null,

  // UI Animation State
  uiSunScale: 1.0,
  uiElixirScale: 1.0,
  uiSoilScale: 1.0,

  // Cheats
  instantRechargeTurrets: false,
  enableT3Turrets: false,

  // Cooldowns
  turretLastUsed: {}, 
  uiAlpha: 255,

  // Time Warp
  timeWarpRemaining: 0
};

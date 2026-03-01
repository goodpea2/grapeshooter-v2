
import { HOUR_FRAMES, SPATIAL_HASH_CELL_SIZE } from './constants';
import { customStartingHour, AlmanacProgression } from './lvDemo';

export const state: any = {
  player: null,
  world: null,
  bullets: [],
  groundFeatures: [],
  loot: [],
  vfx: [],
  uiVfx: [], // New array for UI-space visual effects
  trails: [], // Dedicated array for liquid trails (rendered under entities)
  enemies: [],
  npcs: [],
  enemyBullets: [],
  sunCurrency: 3,
  elixirCurrency: 0,
  soilCurrency: 0,
  raisinCurrency: 0,
  flyingRaisins: [], // { startX, startY, targetX, targetY, progress, value }
  inventory: {}, // Map of itemKey -> count
  unlockedTurrets: [...AlmanacProgression.StartingTurret],
  lockedTurrets: [...AlmanacProgression.LockedTurret],
  unlockCount: 0,
  showUnlockPopup: false,
  lastUnlockedTurret: null,
  unlockPopupTimer: 0,
  isAlmanacOpen: false,
  almanacSelectedTurret: 't_pea', // should be dynamic with previous user selection
  almanacScrollY: 0,
  almanacScrollVelocity: 0,
  almanacIsDragging: false,
  almanacInfoScrollY: 0,
  almanacInfoScrollVelocity: 0,
  almanacUnlockCycleTimer: 0,
  almanacUnlockCycleIndex: 0,
  cameraPos: { x: 0, y: 0 },
  cameraShake: 0, // Current camera shake intensity
  cameraShakeFalloff: 0.95, // Default decay rate
  exploredChunks: new Set(),
  currentChunkLevel: 0,
  spawnedNpcKeys: new Set(),
  frames: customStartingHour * HOUR_FRAMES,
  
  // Game Over state
  isGameOver: false,
  showGameOverPopup: false,
  gameOverProgress: 0, // Used for lighting and modal animation
  totalElixirLootCollected: 0,
  totalSoilLootCollected: 0,
  totalTurretsAcquired: 0,
  killsByType: {}, // Tracks kills per enemy key

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
    chunks: true,
    prefabs: true,
    turrets: true,
    groundFeatures: true,
    obstacles: true,
    overlays: true,
    entities: true
  },
  showWorldGenPreview: false,
  worldPreviewBuffer: null, // Buffer to store the noise map to prevent lag
  worldPreviewNeedsUpdate: true,
  showChunkBorders: false,
  debugGizmosTurrets: false,
  debugGizmosEnemies: false,
  debugHP: false,
  hoveredTurretInstance: null, 
  previewSnapPos: null,
  activeNPC: null,
  npcUiPanelPos: 0, // Animation progress for NPC UI
  activeNpcDialogueIdx: 0,
  npcDialogueJump: 0,
  npcStock: {}, // Map of npcUid -> { tradeId: countPurchased }
  pressedTradeId: null, // Tracks currently clicked shop item
  npcShopScrollY: 0,
  npcShopScrollVelocity: 0,
  
  // Touch Input
  touchInputVec: { x: 0, y: 0 },
  touchStartPos: null,
  isTouchingUI: false,

  // UI Animation State
  uiSunScale: 1.0,
  uiElixirScale: 1.0,
  uiSoilScale: 1.0,

  // Cooldowns
  turretLastUsed: {}, 
  uiAlpha: 255,

  // Development / Debug Toggles
  makeAllTurretsAvailable: false,
  instantRechargeTurrets: false,
  simulateTouchScreen: true,
  showTouchGizmo: false,

  // Time Warp
  timeWarpRemaining: 0,

  // Room Director Discovery Tracking
  roomDirectorData: "",
  roomDirectorChain: [],
  nextDirectorIndex: 0,
  chunkToDirectorIndex: new Map(), // coordinate string -> index in roomDirectorChain
  roomDirectorScrollY: 0,
  roomDirectorScrollVelocity: 0,

  // Fixed Timestep
  lastFrameTime: 0,
  accumulator: 0,

  // Game Speed Control
  gameSpeed: 1, // 0 = paused, 1 = normal, 2 = speedup
  requestedGameSpeed: 1, // What the user wants (1x or 2x)
  isPaused: false,
  speedupFlashTimer: 0,
  isPlayerMoving: false,
  playerSpeedMultiplier: 0, // 0-1.0 multiplier based on drag distance
  isWASDInput: false, // True if WASD keys are currently pressed

  // Damage Number VFX aggregation
  lastDamageTick: new Map(), // entity.uid -> frameCount
  pendingDamage: new Map(), // entity.uid -> accumulatedDamage
};

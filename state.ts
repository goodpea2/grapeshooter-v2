
import { HOUR_FRAMES, SPATIAL_HASH_CELL_SIZE } from './constants';
import { customStartingHour, AlmanacProgression } from './lvDemo';

export const state: any = {
  currentScreen: 'main_menu', // 'main_menu' | 'game' | 'level_editor'
  currentLevelId: 'dev_test', // 'dev_test' | 'sandbox' | 'editor_custom'
  selectedLevelInMenu: 'dev_test',
  levelEditor: {
    activeCategory: 'obstacles',
    activeSubCategory: 'ALL',
    selectedItemKey: 'o_dirt',
    paletteScrollX: 0,
    paletteScrollVel: 0,
    toolMode: 'brush', // 'brush' | 'bucket' | 'spawn_area'
    selectedCustomSpawner: null, // { gx, gy, block }
    toolbarSpawnerTooltip: null, // { key: string, name: string, config: any }
    toolbarSunGeneratorTooltip: null, // { key: string, name: string, config: { damagePerSun: number, maxSun: number } }
    toolbarPaygateTooltip: null, // { gx?: number, gy?: number, resource: string, amount: number }
    toolbarTextSignTooltip: null, // { gx?: number, gy?: number, text: string }
    customSpawnerPrefabs: [], // array of { id, name, config }
    activeSpawnerInput: null, // { field: string, textBuffer: string }
    activeSunGeneratorInput: null, // { field: string, textBuffer: string }
    activePaygateInput: null, // { field: string, textBuffer: string }
    activeTextSignInput: null, // { textBuffer: string }
    spawnAreaLassoPoints: [], // { x, y }[]
    spawnAreaLassoIsRightClick: false,
    flagDragMode: null, // 'add' | 'remove' | null
    isFlagDragActive: false,
    isRightDragOverlayOnly: false,
    lastFlagToggleFrame: 0,
    lastBucketFrame: 0,
    cameraZoom: 1.0,
    isWorldDragActive: false
  },
  suppressGameplayMouseUntilRelease: false,
  currentLevelLayoutData: null,
  player: null,
  world: null,
  bullets: [],
  groundFeatures: [],
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
  leafCurrency: 0,
  shardCurrency: 0,
  shellCurrency: 0,
  fuelCurrency: 0,
  iceCurrency: 0,
  inventory: {
    items: {}, // Map of itemKey -> count
    specList: [] // List of special items (turrets)
  },
  unlockedTurrets: [...AlmanacProgression.StartingTurret],
  lockedTurrets: [...AlmanacProgression.LockedTurret],
  unlockCount: 0,
  showUnlockPopup: false,
  lastUnlockedTurret: null,
  unlockPopupTimer: 0,
  isAlmanacOpen: false,
  isAlmanacEditorMode: false,
  almanacTab: 'Turrets', // 'Turrets' | 'Enemies' | 'Upgrades' | 'LevelConfig'
  almanacEditorToggledKeys: new Set(),
  levelEditorAlmanacProgression: null,
  levelEditorPlayerUpgrades: null as any,
  activePlayerUpgradeInput: null as { key: string; field: 'stat' | 'cost' } | null,
  levelEditorLevelConfig: null as any,
  activeLevelConfigInput: null as { field: string; subKey?: string; textBuffer: string; isDragging?: boolean } | null,
  levelConfigScrollY: 0,
  levelConfigScrollVelocity: 0,
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
  activeChunkKeys: new Set(),
  chunkAccessOrder: [],
  currentChunkLevel: 0,
  spawnedNpcKeys: new Set(),
  frames: customStartingHour * HOUR_FRAMES,
  
  // Game Over state
  isGameOver: false,
  isLevelCompleted: false,
  clearedLevels: (() => {
    try {
      const saved = localStorage.getItem('grapeshooter_cleared_levels');
      return new Set<string>(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set<string>();
    }
  })(),
  levelStars: (() => {
    try {
      const saved = localStorage.getItem('grapeshooter_level_stars');
      return saved ? (JSON.parse(saved) as Record<string, number>) : {};
    } catch {
      return {} as Record<string, number>;
    }
  })(),
  lastLevelStarsEarned: 0,
  winConditionActive: false,
  showGameOverPopup: false,
  gameOverProgress: 0, // Used for lighting and modal animation
  totalElixirLootCollected: 0,
  totalSoilLootCollected: 0,
  totalTurretsAcquired: 0,
  killsByType: {}, // Tracks kills per enemy key

  // Spatial Partitioning
  spatialHash: new Map(),
  spatialHashCellSize: SPATIAL_HASH_CELL_SIZE,
  needsTargetReScan: false,

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
  accumulatedSpawnerPot: 1.0,

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
  showObstacleOutline: false,
  debugGizmosTurrets: false,
  debugDrawTurretPath: false,
  debugGizmosEnemies: false,
  debugHP: false,
  hoveredTurretInstance: null, 
  previewSnapPos: null,
  previewWorldSnap: null, // { gx, gy } if snapping to world grid
  activeNPC: null,
  npcUiPanelPos: 0, // Animation progress for NPC UI
  activeNpcDialogueIdx: 0,
  npcDialogueJump: 0,
  npcStock: {}, // Map of npcUid -> { tradeId: countPurchased }
  pressedTradeId: null, // Tracks currently clicked shop item
  npcShopScrollY: 0,
  npcShopScrollVelocity: 0,
  npcShopPressPos: null,
  
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
  showPlayerGizmos: false,

  // Time Warp
  timeWarpRemaining: 0,
  nightWarningTimer: 0,

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

  // Turret Upgrades
  turretUpgrades: {}, // turretType -> upgradeId[]
  upgradeSelection: null, // { turretType, options: [upgradeId, upgradeId] }
  playerUpgrades: {
    turretAttachCapacity: 0,
    sunBankCapacity: 0,
    magnetRadius: 0,
    damageMultAdd: 0,
    maxStamina: 0,
    clickHoldBoost: 0,
    movementSpeed: 0
  },
  playerBonuses: {
    attackAdd: 0,
    miningAdd: 0,
    speedMult: 1.0,
    attackFirerateMult: 1.0,
    miningFirerateMult: 1.0,
  },

  // Breadcrumb Trail for Turrets
  playerTrail: [], // Array of p5.Vector points
  maxTrailLength: 50,
  trailFadeTimer: 0, // Countdown timer (in frames) when stationary before remaining breadcrumbs expire
  trailStartIndexOnMove: 0, // Index in playerTrail where new movement started after being stationary

  // Persistent data for upgrades (e.g. rolled classes, items)
  // Format: { [turretType]: { [upgradeId]: any[] } }
  upgradeData: {},

  // Damage Number VFX aggregation
  lastDamageTick: new Map(), // entity.uid -> frameCount
  pendingDamage: new Map(), // entity.uid -> accumulatedDamage
};

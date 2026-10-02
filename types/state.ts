// GameState interface typing ONLY the top-level shape of state.ts (keys -> types)
// Uses `any` liberally for deeply nested gameplay configs, objects, and subsystem data.

export interface GameState {
  currentScreen: 'main_menu' | 'game' | 'level_editor' | string;
  currentLevelId: string;
  selectedLevelInMenu: string;
  levelEditor: any;
  suppressGameplayMouseUntilRelease: boolean;
  currentLevelLayoutData: any;
  player: any;
  world: any;
  bullets: any[];
  groundFeatures: any[];
  vfx: any[];
  uiVfx: any[];
  trails: any[];
  enemies: any[];
  npcs: any[];
  enemyBullets: any[];
  sunCurrency: number;
  elixirCurrency: number;
  soilCurrency: number;
  raisinCurrency: number;
  leafCurrency: number;
  shardCurrency: number;
  shellCurrency: number;
  fuelCurrency: number;
  iceCurrency: number;
  inventory: {
    items: Record<string, number>;
    specList: any[];
  };
  unlockedTurrets: string[];
  lockedTurrets: any[];
  unlockCount: number;
  showUnlockPopup: boolean;
  lastUnlockedTurret: any;
  unlockPopupTimer: number;
  isAlmanacOpen: boolean;
  isAlmanacEditorMode: boolean;
  almanacTab: 'Turrets' | 'Enemies' | 'Upgrades' | 'LevelConfig' | 'TurretUnlock' | string;
  worldSeed: number;
  turretUnlockTree: any;
  turretUnlockTreeScroll: { x: number; y: number; zoom: number; targetZoom: number };
  turretUnlockChoiceModal: any;
  almanacEditorToggledKeys: Set<string>;
  levelEditorAlmanacProgression: any;
  levelEditorPlayerUpgrades: any;
  activePlayerUpgradeInput: any;
  editorPlayerUpgradesScrollY: number;
  editorPlayerUpgradesScrollVelocity: number;
  levelEditorLevelConfig: any;
  activeLevelConfigInput: any;
  activeSkillTreeConfigInput: any;
  levelConfigScrollY: number;
  levelConfigScrollVelocity: number;
  levelConfigToggledCells?: Set<string>;
  almanacSelectedTurret: string;
  almanacScrollY: number;
  almanacScrollVelocity: number;
  almanacIsDragging: boolean;
  almanacInfoScrollY: number;
  almanacInfoScrollVelocity: number;
  almanacUnlockCycleTimer: number;
  almanacUnlockCycleIndex: number;
  cameraPos: { x: number; y: number };
  cameraZoom: number;
  targetCameraZoom: number;
  turretZoomOffset: number;
  fovZoomOffset: number;
  damageFlash: number;
  cameraShake: number;
  cameraShakeFalloff: number;
  viewportBounds: { minX: number; maxX: number; minY: number; maxY: number };
  exploredChunks: Set<string>;
  activeChunkKeys: Set<string>;
  chunkAccessOrder: string[];
  currentChunkLevel: number;
  spawnedNpcKeys: Set<string>;
  frames: number;
  accumulatedEnemyBudgetKilled: number;
  accumulatedCollectedResources: Record<string, number>;
  accumulatedHuntEnemy: Record<string, number>;
  accumulatedBreakObstacle: Record<string, number>;

  // Game Over state & Level completion
  isGameOver: boolean;
  isLevelCompleted: boolean;
  clearedLevels: Set<string>;
  levelStars: Record<string, number>;
  lastLevelStarsEarned: number;
  winConditionActive: boolean;
  levelWonSequence: {
    active: boolean;
    pendingDestructions: Array<{ type: 'enemy' | 'block'; target: any }>;
    destructionTimer: number;
    postSequenceTimer: number;
  } | null;
  showGameOverPopup: boolean;
  gameOverProgress: number;
  totalElixirLootCollected: number;
  totalSoilLootCollected: number;
  totalTurretsAcquired: number;
  killsByType: Record<string, number>;

  // Spatial Partitioning
  spatialGrid: any;
  needsTargetReScan: boolean;

  // Loaded Assets
  assets: Record<string, any>;

  // Systems
  pendingSpawns: any[];
  tickingExplosives: any[];

  // Budget system
  lastNightTriggered: number;
  currentNightWaveBudget: number;
  hourlyBudgetPool: number;
  lastHourProcessed: number;
  accumulatedSpentBudget: number;
  refundedBudget: number;

  // Economy & World Generation Pots
  sunSpawnedTotal: number;
  sunMissedTotal: number;
  totalSunLootCollected: number;
  accumulatedSunPot: number;
  accumulatedTntPot: number;
  accumulatedStrayPot: number;
  accumulatedSunflowerPot: number;
  accumulatedSniperPot: number;
  accumulatedSpawnerPot: number;

  // Total spawned trackers for debug
  totalSunSpawned: number;
  totalTntSpawned: number;
  totalStraySpawned: number;
  totalSunflowerSpawned: number;
  totalSniperSpawned: number;
  totalSpawnerSpawned: number;

  // Enemy stats
  totalEnemiesDead: number;

  // UI & Interaction
  uiWidth: number;
  draggedTurretType: any;
  draggedTurretInstance: any;
  dragOrigin: { x: number; y: number };
  isCurrentlyDragging: boolean;
  selectedTurretType: any;
  isStationary: boolean;
  stationaryTimer: number;
  showDebug: boolean;
  debugScrollY: number;
  debugScrollVelocity: number;
  debugSectionsCollapsed: any;
  showPerfOverlay: boolean;
  showWorldGenPreview: boolean;
  worldPreviewBuffer: any;
  worldPreviewNeedsUpdate: boolean;
  showChunkBorders: boolean;
  showObstacleOutline: boolean;
  debugGizmosTurrets: boolean;
  debugDrawTurretPath: boolean;
  debugGizmosEnemies: boolean;
  debugHP: boolean;
  hoveredTurretInstance: any;
  isPlayerHovered: boolean;
  previewSnapPos: any;
  previewWorldSnap: { gx: number; gy: number } | null;
  swapTargetPreview: any;
  activeNPC: any;
  npcUiPanelPos: number;
  activeNpcDialogueIdx: number;
  npcDialogueJump: number;
  npcStock: Record<string, any>;
  pressedTradeId: string | null;
  npcShopScrollY: number;
  npcShopScrollVelocity: number;
  npcShopPressPos: any;

  // Touch Input
  touchInputVec: { x: number; y: number };
  touchStartPos: any;
  isTouchingUI: boolean;

  // UI Animation State
  uiSunScale: number;
  uiElixirScale: number;
  uiSoilScale: number;

  // Cooldowns & Overlays
  turretLastUsed: Record<string, number>;
  uiAlpha: number;

  // Loading & Preloader
  isLoadingResources: boolean;
  loadingProgress: number;

  // Development / Debug Toggles
  makeAllTurretsAvailable: boolean;
  instantRechargeTurrets: boolean;
  simulateTouchScreen: boolean;
  showTouchGizmo: boolean;
  showPlayerGizmos: boolean;
  showAudioDebugOverlay: boolean;

  // Time Warp
  timeWarpRemaining: number;
  nightWarningTimer: number;

  // Room Director Discovery Tracking
  roomDirectorData: string;
  roomDirectorChain: any[];
  nextDirectorIndex: number;
  chunkToDirectorIndex: Map<string, number>;
  roomDirectorScrollY: number;
  roomDirectorScrollVelocity: number;

  // Fixed Timestep
  lastFrameTime: number;
  accumulator: number;

  // Game Speed Control & Menus
  gameSpeed: number;
  requestedGameSpeed: number;
  isPaused: boolean;
  isPauseMenuOpen: boolean;
  graphicQuality: string;
  musicVolume: number;
  sfxVolume: number;
  speedupFlashTimer: number;
  isPlayerMoving: boolean;
  playerSpeedMultiplier: number;
  isWASDInput: boolean;

  // Turret Upgrades & Player Upgrades
  turretUpgrades: Record<string, string[]>;
  upgradeSelection: any;
  playerUpgrades: any;
  playerBonuses: any;

  // Breadcrumb Trail for Turrets
  playerTrail: any[];
  maxTrailLength: number;
  trailFadeTimer: number;
  trailStartIndexOnMove: number;

  // Persistent data for upgrades
  upgradeData: Record<string, any>;

  // Damage Number VFX aggregation
  lastDamageTick: Map<string, number>;
  pendingDamage: Map<string, number>;

  // Dynamic / editor-specific state
  isEditorPlaytest?: boolean;
  levelEditorCache?: any;
  activeAlmanacProgression?: any;
  activeUpgradeSelection?: any;
  mainMenuScrollY?: number;
  mainMenuScrollVelocity?: number;
  playerUpgradesScrollY?: number;
  playerUpgradesScrollVelocity?: number;
  playerUpgradesMaxScroll?: number;
  playerUpgradesIsDragging?: boolean;
  turretMergeOverlay?: any;
  turretOverlayAnimation?: any;
  mergeTargetPreview?: any;
  hoveredTurretSlot?: any;
  tooltipTurret?: any;
  showPauseMenu?: boolean;
  isMouseDown?: boolean;
  cursor?: any;
  text?: any;
  selStart?: any;
  selEnd?: any;

  // Fallback index signature for dynamic currency/pot lookups (e.g. state[potKey])
  [key: string]: any;
}

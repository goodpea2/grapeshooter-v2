
import { HOUR_FRAMES } from './constants';

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
  cameraPos: { x: 0, y: 0 },
  exploredChunks: new Set(),
  currentChunkLevel: 0,
  frames: 6 * HOUR_FRAMES,
  deathVisualsBuffer: null,
  
  // Budget system
  lastNightTriggered: 0,
  currentNightWaveBudget: 60,
  hourlyBudgetPool: 0,
  lastHourProcessed: -1,
  accumulatedSpentBudget: 0,
  refundedBudget: 0,

  // Economy & World Generation Pots
  sunSpawnedTotal: 0, // This tracks total SunLoot value spawned from environment/enemies
  sunMissedTotal: 0,    // This tracks total SunLoot value despawned
  totalSunLootCollected: 0,
  accumulatedSunPot: 0,
  accumulatedTntPot: 0,
  accumulatedStrayPot: 0,
  accumulatedSunflowerPot: 1.0, // Starts at 1
  accumulatedSniperPot: 0,
  accumulatedSpawnerPot: 0,

  // Total spawned trackers for debug (Block features)
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
  draggedTurretType: null, // For shop dragging
  draggedTurretInstance: null, // For merging existing turrets
  selectedTurretType: null, // For click-to-place mode
  isStationary: true,
  stationaryTimer: 0,
  showDebug: false,
  debugScrollY: 0,
  showWorldGenPreview: false,
  debugGizmosTurrets: false,
  debugGizmosEnemies: false,
  debugHP: false,
  hoveredTurretInstance: null, // Track world-space turret hover

  // Cooldowns
  turretLastUsed: {}, // Maps turret type to frame count when last purchased
  uiAlpha: 255,

  // Time Warp
  timeWarpRemaining: 0
};


import { state } from './state';
import { HOUR_FRAMES, GRID_SIZE } from './constants';
import { enemyTypes } from './balanceEnemies';
import { liquidTypes } from './balanceLiquids';
import { turretTypes } from './balanceTurrets';
import { getTime } from './ui/ui';
import { SunLoot, Enemy } from './entities';
import { createEnemy } from './class/enemy/EnemyRegistry';
import { ECONOMY_CONFIG, spawnLootAt } from './economy';
import { Bullet } from './entities';
import { soundEngine } from './src/audio/soundEngine';

declare const random: any;
declare const cos: any;
declare const sin: any;
declare const frameCount: any;
declare const floor: any;

export const customBudgetPerNight = [200, 600, 1500, 3000, 6000, 12000, 18000, 24000, 30000, 33000]; // default customBudgetPerNight
export const defaultHourlyBudgetPerDay = [0];
export const defaultHourlyBudgetPerNight = [20, 60, 120, 200, 300, 360, 400, 420, 450, 500];
export const customDayLightConfig = '000011222222222222110000'; // 0: Night, 1: Transition, 2: Day
export const customStartingHour = 6;

export interface SkillTreeConfig {
  TurretUnlockNodes: number[];
  TurretUpgradeNodes: number[];
  LootNodes: number[];
}

export const DEFAULT_SKILL_TREE_CONFIG: SkillTreeConfig = {
  TurretUnlockNodes: [0, 3, 5, 7, 10, 8, 7],
  TurretUpgradeNodes: [0, 3, 4, 5, 6, 8, 10],
  LootNodes: [1, 0, 1, 2, 3, 6, 10]
};

export interface AlmanacProgressionConfig {
  StartingTurret: string[];
  UnlockedByDiscoverTurret: string[];
  LockedTurret: Array<{ type: string; weight?: number }>;
  UnlockCost?: Array<Record<string, number>>;
  AllTurretCrafting?: boolean; // false hides the turret-buy button for ALL turrets (default: false)
  CraftingCostOverride?: Array<{ type: string; cost?: Record<string, number>; canBePurchased?: boolean }>;
  SkillTreeConfig?: SkillTreeConfig;
}

export const AlmanacProgression: AlmanacProgressionConfig = {
  StartingTurret: [
    't_pea', 't_laser', 't_wall', 't_mine', 't_ice', // Tier 1
    't_seed', 't_seed2', // Special
    't2_repeater', 't2_laser2', 't2_tall', 't2_minespawner', 't2_stun', // Specific Tier 2
    'tx_goldengrape','t0_starfruit'
  ],
  UnlockedByDiscoverTurret: [
    't_sunflower', 't_lilypad','t0_cherrybomb','t0_firecherry', 't0_jalapeno', 't0_iceshroom', 't0_grapeshot', 't0_puffshroom',
    't_farm_bush', 't_farm_crystal', 't_farm_mob'
  ],
  LockedTurret: [
    { type: 't2_firepea', weight: 10 }, { type: 't2_peanut', weight: 10 }, { type: 't2_mortar', weight: 10 }, { type: 't2_snowpea', weight: 10 }, { type: 't2_wallaser', weight: 10 }, { type: 't2_laserexplode', weight: 10 }, { type: 't2_heallaser', weight: 10 }, { type: 't2_pulse', weight: 10 }, { type: 't2_icewall', weight: 10 }, { type: 't2_torchwood', weight: 10 },
    { type: 't3_triplepea', weight: 3 }, { type: 't3_firepea2', weight: 3 }, { type: 't3_bowling', weight: 3 }, { type: 't3_mortar2', weight: 3 }, { type: 't3_snowpea2', weight: 3 }, { type: 't3_witch', weight: 3 }, { type: 't3_flamethrower', weight: 3 }, { type: 't3_firecharge', weight: 3 }, { type: 't3_repulser', weight: 3 }, { type: 't3_gatling', weight: 3 }, { type: 't3_skymortar', weight: 3 },
    { type: 't3_laser3', weight: 3 }, { type: 't3_puncher', weight: 3 }, { type: 't3_aoelaser', weight: 3 }, { type: 't3_heallaser2', weight: 3 }, { type: 't3_hypno', weight: 3 }, { type: 't3_magnet', weight: 3 }, { type: 't3_powerbank', weight: 3 },
    { type: 't3_densnut', weight: 3 }, { type: 't3_durian', weight: 3 }, { type: 't3_frostfield', weight: 3 }, { type: 't3_holonut', weight: 3 },
    { type: 't3_minecharge', weight: 3 }, { type: 't3_speeder', weight: 3 },
    { type: 't3_icecharge', weight: 3 }
  ],
  AllTurretCrafting: true,
  CraftingCostOverride: [
    { type: 't_sunflower', cost: { soil: 20 } },
    { type: 't_seed', canBePurchased: false },
    { type: 't_seed2', canBePurchased: false },
    { type: 'tx_goldengrape', cost: { sun: 400 } }
  ],
  SkillTreeConfig: {
    TurretUnlockNodes: [0, 3, 5, 7, 10, 8, 7],
    TurretUpgradeNodes: [0, 3, 4, 6, 7, 10, 15],
    LootNodes: [1, 0, 1, 2, 3, 6, 8]
  }
};

export function createDefaultEditorAlmanacProgression(): AlmanacProgressionConfig {
  const defaultStarting = ['t_pea', 't_laser', 't_wall'];

  return {
    StartingTurret: defaultStarting,
    UnlockedByDiscoverTurret: [],
    LockedTurret: [],
    AllTurretCrafting: false,
    CraftingCostOverride: [],
    SkillTreeConfig: {
      TurretUnlockNodes: [0, 3, 5, 7, 10, 8, 7],
      TurretUpgradeNodes: [0, 3, 4, 6, 7, 10, 15],
      LootNodes: [1, 0, 1, 2, 3, 6, 8]
    }
  };
}

export function buildExportAlmanacProgression(prog?: Partial<AlmanacProgressionConfig> | null): AlmanacProgressionConfig {
  const baseProg = prog || {};

  // Master registry of all valid turrets
  const allTurretKeys = Object.keys(turretTypes).filter(k => 
    turretTypes[k] && (turretTypes[k].tier > 0 || turretTypes[k].isSpecial)
  );

  // Normalize phonetic aliases (e.g. t2_walllaser -> t2_wallaser)
  const normalize = (k: string) => (k === 't2_walllaser' ? 't2_wallaser' : k);

  const rawStarting = (baseProg.StartingTurret || []).map(normalize);
  const rawDiscover = (baseProg.UnlockedByDiscoverTurret || []).map(normalize);
  const rawLocked: Array<{ type: string; weight?: number }> = (baseProg.LockedTurret || []).map((t: any) => {
    if (typeof t === 'string') return { type: normalize(t), weight: 10 };
    return { ...t, type: normalize(t.type) };
  });

  const finalStarting = Array.from(new Set(rawStarting));
  const finalDiscover = Array.from(new Set(rawDiscover));

  const rawSkillTree = baseProg.SkillTreeConfig || (baseProg as any).skillTreeConfig;
  const skillTreeConfig: SkillTreeConfig = {
    TurretUnlockNodes: Array.isArray(rawSkillTree?.TurretUnlockNodes) ? [...rawSkillTree.TurretUnlockNodes] : [...DEFAULT_SKILL_TREE_CONFIG.TurretUnlockNodes],
    TurretUpgradeNodes: Array.isArray(rawSkillTree?.TurretUpgradeNodes) ? [...rawSkillTree.TurretUpgradeNodes] : [...DEFAULT_SKILL_TREE_CONFIG.TurretUpgradeNodes],
    LootNodes: Array.isArray(rawSkillTree?.LootNodes) ? [...rawSkillTree.LootNodes] : [...DEFAULT_SKILL_TREE_CONFIG.LootNodes]
  };

  return {
    StartingTurret: finalStarting,
    UnlockedByDiscoverTurret: finalDiscover,
    LockedTurret: rawLocked,
    AllTurretCrafting: baseProg.AllTurretCrafting === true,
    CraftingCostOverride: baseProg.CraftingCostOverride ? JSON.parse(JSON.stringify(baseProg.CraftingCostOverride)) : (AlmanacProgression.CraftingCostOverride || []),
    SkillTreeConfig: skillTreeConfig
  };
}

export function getActiveAlmanacProgression(): AlmanacProgressionConfig {
  if (state.currentScreen === 'level_editor' && state.isAlmanacEditorMode) {
    if (!state.levelEditorAlmanacProgression) {
      state.levelEditorAlmanacProgression = createDefaultEditorAlmanacProgression();
    }
    return state.levelEditorAlmanacProgression;
  }

  const layout = state.currentLevelLayoutData;
  const customProg = layout?.AlmanacProgression || layout?.almanacProgression || state.activeAlmanacProgression;
  if (customProg) {
    return buildExportAlmanacProgression(customProg);
  }

  return AlmanacProgression;
}

export function getTurretProgressionState(key: string, prog: AlmanacProgressionConfig): 'available' | 'locked' | 'needDiscovery' | 'banned' {
  if (prog.StartingTurret?.includes(key)) return 'available';
  if (prog.LockedTurret?.some(t => (typeof t === 'string' ? t : t.type) === key)) return 'locked';
  if (prog.UnlockedByDiscoverTurret?.includes(key)) return 'needDiscovery';
  return 'banned';
}

export function cycleTurretProgressionState(key: string, prog: AlmanacProgressionConfig): 'available' | 'locked' | 'needDiscovery' | 'banned' {
  if (!prog.StartingTurret) prog.StartingTurret = [];
  if (!prog.LockedTurret) prog.LockedTurret = [];
  if (!prog.UnlockedByDiscoverTurret) prog.UnlockedByDiscoverTurret = [];

  const currentState = getTurretProgressionState(key, prog);

  // Remove key from all lists
  prog.StartingTurret = prog.StartingTurret.filter(k => k !== key);
  prog.LockedTurret = prog.LockedTurret.filter(t => (typeof t === 'string' ? t : t.type) !== key);
  prog.UnlockedByDiscoverTurret = prog.UnlockedByDiscoverTurret.filter(k => k !== key);

  let nextState: 'available' | 'locked' | 'needDiscovery' | 'banned';

  if (currentState === 'available') {
    // available -> locked
    prog.LockedTurret.push({ type: key, weight: 10 });
    nextState = 'locked';
  } else if (currentState === 'locked') {
    // locked -> needDiscovery
    prog.UnlockedByDiscoverTurret.push(key);
    nextState = 'needDiscovery';
  } else if (currentState === 'needDiscovery') {
    // needDiscovery -> banned (not defined in any list = banned)
    nextState = 'banned';
  } else {
    // banned -> available
    prog.StartingTurret.push(key);
    nextState = 'available';
  }

  return nextState;
}

export function getLightLevel(hour: number): number {
  const h = floor(hour) % 24;
  return parseInt(customDayLightConfig[h]);
}

export const worldGenConfig = {
  liquidNoiseScale: 0.015,
  riverNoiseScale: 0.04,
  lakeThreshold: 0.7,
  riverThreshold: 0.06,
  blockNoiseScale: 0.1,
  blockThreshold: 0.4,
  liquidClumpScale: 0.07,
  spawnClearRadius: 5,
  noiseOffsetLakes: 20000,
  noiseOffsetRivers: 30000,
  noiseOffsetClumping: 40000,
  noiseOffsetBlocks: 10000
};

// Enemy weight matrix based on the provided table
const DAYTIME_WEIGHTS: Record<string, Record<string, number>> = {
  "1_day":   { e_fast: 1, e_basic: 1, e_fly: 0.25 },
  "1_night": { e_fast: 1, e_basic: 1, e_fly: 0.25 },
  "2_day":   { e_fast: 1, e_basic: 1, e_armor1: 0.5, e_fly: 0.25 },
  "2_night": { e_fast: 1, e_basic: 1, e_armor1: 0.5, e_armor2: 0.25, e_fly: 0.25 },
  "3_day":   { e_fast: 1, e_basic: 1, e_armor1: 1, e_armor2: 0.5, e_swarm: 0.5, e_fly: 0.25 },
  "3_night": { e_fast: 1, e_basic: 1, e_armor1: 1, e_armor2: 0.5, e_swarm: 0.5, e_fly: 0.25 },
  "4_day":   { e_fast: 0.5, e_basic: 0.5, e_armor1: 1, e_armor3: 0.25, e_armor2: 1, e_giant: 0.25, e_swarm: 1, e_snowthrower: 0.5, e_fly: 0.25 },
  "4_night": { e_fast: 0.5, e_basic: 0.5, e_armor1: 1, e_armor3: 0.25, e_armor2: 1, e_giant: 0.25, e_swarm: 1, e_snowthrower: 0.5, e_fly: 0.25, e_shooting: 0.25, e_fly_armor1: 0.25, e_bomb: 0.25 },
  "5_day":   { e_fast: 0.5, e_basic: 0.5, e_armor1: 1, e_armor3: 0.5, e_shooting_giant: 0.25, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 0.25, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_frontshield: 0.5, e_swarm_chicken: 0.25, e_fly: 0.25 },
  "5_night": { e_fast: 0.5, e_basic: 0.5, e_armor1: 1, e_armor3: 0.5, e_shooting_giant: 0.25, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 0.25, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_frontshield: 0.5, e_swarm_chicken: 0.25, e_fly: 0.25 },
  "6_day":   { e_fast: 0.5, e_basic: 0.25, e_armor1: 1, e_armor3: 1, e_shooting_giant: 0.25, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_rockpuncher: 0.25, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 0.5, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_leader: 0.25 },
  "6_night": { e_fast: 0.5, e_basic: 0.25, e_armor1: 1, e_armor3: 1, e_shooting_giant: 0.25, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_rockpuncher: 0.25, e_launcher: 0.25, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 0.5, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_leader: 0.25 },
  "7_day":   { e_shooting_giant: 0.5, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_rockpuncher: 0.5, e_launcher: 0.25, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_armor1: 0.5, e_armor3: 1, e_snowthrower_giant: 0.25, e_leader: 0.25 },
  "7_night": { e_shooting_giant: 0.5, e_icebomb: 0.25, e_armor2: 1, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 1, e_rockpuncher: 0.5, e_launcher: 0.5, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_armor1: 0.5, e_armor3: 1, e_snowthrower_giant: 0.25, e_leader: 0.25 },
  "8_day":   { e_shooting_giant: 0.5, e_icebomb: 0.25, e_armor2: 0.5, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 0.5, e_rockpuncher: 0.5, e_launcher: 0.5, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_armor1: 0.25, e_armor3: 1, e_snowthrower_giant: 0.25, e_leader: 0.25 },
  "8_night": { e_shooting_giant: 0.5, e_icebomb: 0.25, e_armor2: 0.5, e_shooting: 0.25, e_giant: 1, e_fly_armor1: 0.25, e_bomb: 0.25, e_snowthrower: 0.5, e_swarm: 0.5, e_rockpuncher: 0.5, e_launcher: 1, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_armor1: 0.25, e_armor3: 1, e_snowthrower_giant: 0.25, e_leader: 0.25 },
  "9_day":   { e_shooting_giant: 1, e_icebomb: 0.25, e_armor3: 0.25, e_snowthrower_giant: 0.5, e_giant: 1, e_snowthrower: 0, e_swarm: 0.25, e_rockpuncher: 0.25, e_launcher: 1, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_leader: 0.25 },
  "9_night": { e_shooting_giant: 1, e_icebomb: 0.25, e_armor3: 0.25, e_snowthrower_giant: 0.5, e_giant: 1, e_snowthrower: 0, e_swarm: 0.25, e_rockpuncher: 0.25, e_launcher: 1, e_frontshield: 0.5, e_cloner: 0.5, e_swarm_chicken: 1, e_hopper: 0.25, e_leader_ring: 0.25, e_fly: 0.25, e_leader: 0.25 }
};

function getWeightsForPeriod(key: string): number[] {
  const defRow = DAYTIME_WEIGHTS[key] || DAYTIME_WEIGHTS["5_night"] || {};
  return ENEMY_KEYS.map(k => {
    if (Array.isArray(defRow)) {
      const idx = ENEMY_KEYS.indexOf(k);
      return defRow[idx] || 0;
    } else if (defRow && typeof defRow === 'object') {
      return (defRow as Record<string, number>)[k] || 0;
    }
    return 0;
  });
}

const CHUNK_LEVEL_WEIGHTS: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 1
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lvl 2
  [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 1, 0.75, 0, 1, 0.25, 0.25, 0.25, 0, 0.25, 0.25, 0.25, 0.25], // Lvl 3
  [0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 1, 0.25, 0.5, 1, 0.75, 0.75, 0.75, 0.5, 0.75, 0.75, 0.75, 0.75], // Lvl 4
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 5
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 6
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 7
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 8
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 9
  [0, 0, 0, 0.5, 0.25, 0.25, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Lvl 10
];

export const ENEMY_KEYS = Object.keys(enemyTypes);

export function getWeightsForCurrentTime() {
  const t = getTime();
  const isNight = getLightLevel(t.hour) === 0;
  const dayKey = Math.min(t.day, 9);
  const key = `${dayKey}_${isNight ? 'night' : 'day'}`;
  
  const customSpawnConfig = state.currentLevelLayoutData?.globalEnemySpawnConfig;
  let dtWeights: number[];
  const periodCfg = customSpawnConfig ? customSpawnConfig[key] : null;
  if (periodCfg) {
    if (Array.isArray(periodCfg)) {
      dtWeights = periodCfg;
    } else if (typeof periodCfg === 'object') {
      dtWeights = ENEMY_KEYS.map(k => (typeof periodCfg[k] === 'number' && periodCfg[k] > 0 ? periodCfg[k] : 0));
    } else {
      dtWeights = getWeightsForPeriod(key);
    }
  } else {
    dtWeights = getWeightsForPeriod(key);
  }
  
  const enableWorldGen = state.currentLevelLayoutData?.enableWorldGen ?? (state.currentLevelId === 'sandbox' ? false : true);
  
  if (!enableWorldGen) {
    // When enableWorldGen=false, set CHUNK_LEVEL_WEIGHTS of all enemies to 1
    return dtWeights.map((w: number) => (w !== undefined ? w : 0) * 1);
  }

  const clIdx = Math.min(Math.max(0, state.currentChunkLevel - 1), CHUNK_LEVEL_WEIGHTS.length - 1);
  const clWeights = CHUNK_LEVEL_WEIGHTS[clIdx] || Array(ENEMY_KEYS.length).fill(1);

  // Multiply weights
  return dtWeights.map((w: number, i: number) => (w !== undefined ? w : 0) * (clWeights[i] !== undefined ? clWeights[i] : 1));
}

export function isLegibleSpot(x: number, y: number): boolean {
  if (state.world.isBlockAt(x, y)) return false;
  const gx = floor(x / GRID_SIZE);
  const gy = floor(y / GRID_SIZE); 
  const liqKey = state.world.getLiquidAt(gx, gy);
  if (liqKey) {
    const lCfg = liquidTypes[liqKey];
    if (lCfg && lCfg.isDanger) return false; // Don't spawn in Lava
  }
  return true;
}

/**
 * Validates whether an enemy of type enemyTypeKey can globally spawn at (x, y).
 * Rules:
 * - At least 12-tile distance from the player
 * - At least 6-tile distance from all turrets (attachments and world turrets)
 * - Safe liquid or empty ground (liquid without isDanger=true)
 * - Enemies with isFlying=true can spawn on top of obstacles; non-flying cannot
 * - No longer influenced by spawnArea
 */
export function canGlobalSpawnAt(x: number, y: number, enemyTypeKey: string): boolean {
  const eCfg = enemyTypes[enemyTypeKey];
  if (!eCfg) return false;
  const isFlying = !!eCfg.isFlying;

  // 1. Distance from player: at least 12 tiles
  if (state.player) {
    const minPlayerDist = 12 * GRID_SIZE;
    const pDistSq = (x - state.player.pos.x) ** 2 + (y - state.player.pos.y) ** 2;
    if (pDistSq < minPlayerDist * minPlayerDist) return false;

    // 2. Distance from player attachments (turrets): at least 6 tiles
    if (state.player.attachments) {
      const minTurretDist = 6 * GRID_SIZE;
      const minTurretDistSq = minTurretDist * minTurretDist;
      for (const att of state.player.attachments) {
        const apos = att.getWorldPos ? att.getWorldPos() : att.pos;
        if (apos) {
          const dSq = (x - apos.x) ** 2 + (y - apos.y) ** 2;
          if (dSq < minTurretDistSq) return false;
        }
      }
    }
  }

  // 3. Distance from world turrets: at least 6 tiles
  if (state.world) {
    const minTurretDist = 6 * GRID_SIZE;
    const minTurretDistSq = minTurretDist * minTurretDist;
    const worldTurrets = state.world.getAllTurrets();
    for (const wt of worldTurrets) {
      const wpos = wt.getWorldPos ? wt.getWorldPos() : wt.pos;
      if (wpos) {
        const dSq = (x - wpos.x) ** 2 + (y - wpos.y) ** 2;
        if (dSq < minTurretDistSq) return false;
      }
    }
  }

  // 4. Obstacle check: flying enemies can spawn on top of obstacles; non-flying cannot
  const enemyRad = ((eCfg.size || 20) * 0.5) + 2;
  if (!isFlying) {
    if (state.world.isBlockAt(x, y)) return false;
    if (state.world.checkCollision && state.world.checkCollision(x, y, enemyRad)) return false;
  }

  // 5. Liquid check: all enemies can spawn on empty ground or liquid without isDanger=true
  const gx = floor(x / GRID_SIZE);
  const gy = floor(y / GRID_SIZE);
  const liqKey = state.world.getLiquidAt(gx, gy);
  if (liqKey) {
    const lCfg = liquidTypes[liqKey];
    if (lCfg && lCfg.isDanger) return false;
  }

  // 6. Ground features (like forcefields)
  if (state.groundFeatures) {
    for (const gf of state.groundFeatures) {
      if (gf.typeKey === 'gf_forcefield') {
        const dSq = (x - gf.pos.x) ** 2 + (y - gf.pos.y) ** 2;
        const rSum = (eCfg.size || 20) * 0.5 + (gf.config?.radius || 40);
        if (dSq < rSum * rSum) return false;
      }
    }
  }

  return true;
}

/**
 * Global helper to request a spawn with a portal VFX
 */
export function requestSpawn(x: number, y: number, typeKey: string, timer: number = 60) {
  state.pendingSpawns.push({
    x, y, 
    type: typeKey,
    timer: timer,
    initialTimer: timer
  });
}

/**
 * Helper to launch a flung spawn pod from a spawner to target destination
 */
export function requestFlungSpawn(fromX: number, fromY: number, targetX: number, targetY: number, typeKey: string, portalFrames: number = 20) {
  import('./vfx/FlungSpawnPodVFX').then(({ FlungSpawnPodVFX }) => {
    state.vfx.push(new FlungSpawnPodVFX(fromX, fromY, targetX, targetY, typeKey, portalFrames));
  }).catch(() => {
    requestSpawn(targetX, targetY, typeKey, portalFrames);
  });
}

/**
 * Spawns enemies until amount is reached or attempt limit hit.
 * Global spawning ONLY happens at nighttime.
 * Returns the total cost spent.
 */
export function spawnFromBudget(amount: number): number {
  const t = getTime();
  const isNight = getLightLevel(t.hour) === 0;
  if (!isNight) return 0; // Global spawning now ONLY happens at nighttime

  let spent = 0;
  let limit = 40; 
  const weights = getWeightsForCurrentTime();

  while (spent < amount && limit > 0) {
    limit--;
    const pool = ENEMY_KEYS.filter((k, idx) => {
      const weight = weights[idx];
      return weight > 0 && enemyTypes[k].cost <= (amount - spent);
    });

    if (pool.length === 0) break;

    const totalWeight = pool.reduce((acc, k) => acc + weights[ENEMY_KEYS.indexOf(k)], 0);
    const r = random(totalWeight);
    let sum = 0;
    let ek = pool[0];
    for (const k of pool) {
      sum += weights[ENEMY_KEYS.indexOf(k)];
      if (r <= sum) {
        ek = k;
        break;
      }
    }

    // Pick candidate position around player between 12 and 22 tiles away
    const ang = random(Math.PI * 2);
    const distR = random(12, 22) * GRID_SIZE;
    const px = state.player ? state.player.pos.x : 0;
    const py = state.player ? state.player.pos.y : 0;
    const x = px + cos(ang) * distR;
    const y = py + sin(ang) * distR;

    // Check candidate spawn spot using global rules (nighttime, distance, flying/obstacle, liquid)
    if (canGlobalSpawnAt(x, y, ek)) {
      requestSpawn(x, y, ek);
      const cost = enemyTypes[ek].cost;
      spent += cost;
      state.accumulatedSpentBudget += cost;
    }
  }
  return spent;
}

export function getCurrentLevelHourlyBudget(): number {
  const t = getTime();
  const lightLevel = getLightLevel(t.hour);
  const isNight = lightLevel === 0;
  const rawHourlyDay = state.currentLevelLayoutData?.hourlyBudgetPerDay;
  const hourlyPerDay: number[] = Array.isArray(rawHourlyDay) && rawHourlyDay.length > 0
    ? rawHourlyDay
    : (typeof rawHourlyDay === 'number' ? [rawHourlyDay] : defaultHourlyBudgetPerDay);

  const rawHourlyNight = state.currentLevelLayoutData?.hourlyBudgetPerNight;
  const hourlyPerNight: number[] = Array.isArray(rawHourlyNight) && rawHourlyNight.length > 0
    ? rawHourlyNight
    : (typeof rawHourlyNight === 'number' ? [rawHourlyNight] : defaultHourlyBudgetPerNight);

  const dayIdx = Math.min(Math.max(0, t.day - 1), hourlyPerDay.length - 1);
  const nightIdx = Math.min(Math.max(0, t.day - 1), hourlyPerNight.length - 1);

  return isNight ? (hourlyPerNight[nightIdx] ?? 20) : (hourlyPerDay[dayIdx] ?? 3);
}

export function updateGameSystems() {
  if (state.timeWarpRemaining > 0) {
    state.frames += 120;
    state.timeWarpRemaining--;
  }

  const t = getTime();
  const lightLevel = getLightLevel(t.hour);
  const isNight = lightLevel === 0;

  // BUDGET SCALING: Read customBudgetPerNight from levelData if present, fallback to default [100, 200, 400, 800, 1500]
  const rawBudget = state.currentLevelLayoutData?.customBudgetPerNight;
  const activeBudgetPerNight: number[] = Array.isArray(rawBudget) && rawBudget.length > 0
    ? rawBudget
    : (typeof rawBudget === 'number' ? [rawBudget] : customBudgetPerNight);

  const nightIdx = Math.min(Math.max(0, t.day - 1), activeBudgetPerNight.length - 1);
  let baseBudget = activeBudgetPerNight[nightIdx] ?? 100;
  if (t.day > activeBudgetPerNight.length) {
     // Scaled growth beyond array limits
     baseBudget = activeBudgetPerNight[activeBudgetPerNight.length - 1] * Math.pow(1.25, t.day - activeBudgetPerNight.length);
  }
  state.currentNightWaveBudget = baseBudget;

  // Process Pending Spawns
  for (let i = state.pendingSpawns.length - 1; i >= 0; i--) {
    const s = state.pendingSpawns[i];
    s.timer--;
    if (s.timer <= 0) {
      state.enemies.push(createEnemy(s.x, s.y, s.type));
      const last = state.pendingSpawns.pop()!;
      if (i < state.pendingSpawns.length) state.pendingSpawns[i] = last;
    }
  }

  // Process Ticking Explosives (TNT)
  for (let i = state.tickingExplosives.length - 1; i >= 0; i--) {
    const tex = state.tickingExplosives[i];
    tex.timer--;
    if (tex.timer <= 0) {
      // Explode
      let b = Bullet.create(tex.x, tex.y, tex.x, tex.y, 'b_tnt_explosion', 'none');
      state.bullets.push(b);
      b.explode();
      b.life = 0;
      const last = state.tickingExplosives.pop()!;
      if (i < state.tickingExplosives.length) state.tickingExplosives[i] = last;
    }
  }

  const sunIntervalHours = state.currentLevelLayoutData?.sunSpawnHourInterval ?? state.currentLevelLayoutData?.SunSpawnHourInterval ?? 0.5;
  const effectiveSunIntervalFrames = Math.max(1, Math.round(HOUR_FRAMES * sunIntervalHours));

  if (!isNight && state.frames % effectiveSunIntervalFrames === 0) {
    const ang = random(Math.PI * 2);
    const distR = random(ECONOMY_CONFIG.sunSpawnMinDist, ECONOMY_CONFIG.sunSpawnMaxDist) * GRID_SIZE;
    const x = state.player.pos.x + cos(ang) * distR;
    const y = state.player.pos.y + sin(ang) * distR;
    
    if (isLegibleSpot(x, y)) {
      spawnLootAt(x, y, 'sun');
    }
  }

  // Detect transition into night state (light level changes from non-zero to zero)
  const prevHour = (t.totalHours * HOUR_FRAMES - 1) / HOUR_FRAMES;
  const prevLightLevel = getLightLevel(floor(prevHour));
  
  if (isNight && prevLightLevel !== 0 && state.lastNightTriggered !== t.day) {
    state.lastNightTriggered = t.day;
    // Trigger the big wave event
    soundEngine.playSFX('hugewave_siren');
    spawnFromBudget(state.currentNightWaveBudget);
  }

  const floorHour = floor(t.totalHours);
  if (floorHour !== state.lastHourProcessed) {
    state.lastHourProcessed = floorHour;

    const rawHourlyDay = state.currentLevelLayoutData?.hourlyBudgetPerDay;
    const hourlyPerDay: number[] = Array.isArray(rawHourlyDay) && rawHourlyDay.length > 0
      ? rawHourlyDay
      : (typeof rawHourlyDay === 'number' ? [rawHourlyDay] : defaultHourlyBudgetPerDay);

    const rawHourlyNight = state.currentLevelLayoutData?.hourlyBudgetPerNight;
    const hourlyPerNight: number[] = Array.isArray(rawHourlyNight) && rawHourlyNight.length > 0
      ? rawHourlyNight
      : (typeof rawHourlyNight === 'number' ? [rawHourlyNight] : defaultHourlyBudgetPerNight);

    const dayIdx = Math.min(Math.max(0, t.day - 1), hourlyPerDay.length - 1);
    const nightIdx = Math.min(Math.max(0, t.day - 1), hourlyPerNight.length - 1);

    if (isNight) {
      state.hourlyBudgetPool += hourlyPerNight[nightIdx] ?? 20;
    } else {
      state.hourlyBudgetPool += hourlyPerDay[dayIdx] ?? 3;
    }
  }

  // AGGRESSIVE POOL CONSUMPTION: 
  // Always attempt to spend the budget pool every frame to counter "running away".
  // Refunds from despawned enemies go back into this pool instantly.
  if (state.hourlyBudgetPool >= 2) {
    const spent = spawnFromBudget(state.hourlyBudgetPool);
    state.hourlyBudgetPool -= spent;
  }

  // Turret Discovery Check (by inventory, attachment, or clear LOS towards world turret)
  const activeProg = getActiveAlmanacProgression();
  const discoverList = activeProg.UnlockedByDiscoverTurret || [];
  if (discoverList.length > 0 && state.player) {
    const worldTurrets = (state.world && typeof state.world.getAllTurrets === 'function')
      ? state.world.getAllTurrets()
      : [];

    for (const key of discoverList) {
      if (!state.unlockedTurrets.includes(key)) {
        // 1. Check inventory
        if ((state.inventory?.items?.[key] || 0) > 0) {
          state.unlockedTurrets.push(key);
          continue;
        }
        // 2. Check attachments
        if (state.player.attachments && state.player.attachments.some((a: any) => a.type === key)) {
          state.unlockedTurrets.push(key);
          continue;
        }
        // 3. Check clear LOS towards any world turret of that type
        if (state.world && typeof state.world.checkLOS === 'function') {
          const matchingTurrets = worldTurrets.filter((wt: any) => wt && wt.type === key);
          for (const wt of matchingTurrets) {
            const twPos = typeof wt.getWorldPos === 'function'
              ? wt.getWorldPos()
              : (wt.pos || { x: (wt.gx + 0.5) * GRID_SIZE, y: (wt.gy + 0.5) * GRID_SIZE });
            if (state.world.checkLOS(state.player.pos.x, state.player.pos.y, twPos.x, twPos.y)) {
              state.unlockedTurrets.push(key);
              break;
            }
          }
        }
      }
    }
  }
}

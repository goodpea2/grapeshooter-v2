import { state } from '../../../state';
import { enemyTypes } from '../../../balanceEnemies';
import { ALL_ENEMY_TYPES_LIST } from '../../../levelEditor/types';

export const ALL_CURRENCIES = [
  { key: 'sun', label: 'Sun', icon: 'img_icon_sun', color: [255, 220, 60] },
  { key: 'elixir', label: 'Elixir', icon: 'img_icon_elixir', color: [200, 100, 255] },
  { key: 'soil', label: 'Soil', icon: 'img_icon_soil', color: [220, 160, 100] },
  { key: 'raisin', label: 'Raisin', icon: 'img_icon_raisin', color: [160, 80, 220] },
  { key: 'leaf', label: 'Leaf', icon: 'img_icon_leaf', color: [100, 220, 120] },
  { key: 'shard', label: 'Shard', icon: 'img_icon_shard', color: [100, 200, 255] },
  { key: 'shell', label: 'Shell', icon: 'img_icon_shell', color: [240, 200, 150] },
  { key: 'fuel', label: 'Fuel', icon: 'img_icon_fuel', color: [255, 120, 60] },
  { key: 'ice', label: 'Ice', icon: 'img_icon_ice', color: [140, 230, 255] }
];

export const DEFAULT_CUSTOM_BUDGET_PER_NIGHT = [100, 200, 400, 800, 1500];
export const DEFAULT_HOURLY_BUDGET_PER_DAY = [3, 10, 20, 30, 40];
export const DEFAULT_HOURLY_BUDGET_PER_NIGHT = [20, 40, 80, 100, 120];

export const SPAWN_CONFIG_PERIODS = [
  '1_day', '1_night',
  '2_day', '2_night',
  '3_day', '3_night',
  '4_day', '4_night',
  '5_day', '5_night',
  '6_day', '6_night',
  '7_day', '7_night',
  '8_day', '8_night',
  '9_day', '9_night'
];

export const DEFAULT_DAYTIME_WEIGHTS: Record<string, Record<string, number>> = {
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

export interface EditorLevelConfigData {
  id: string;
  name: string;
  description: string;
  tag: string;
  sunSpawnHourInterval: string;
  customBudgetPerNight: string;
  hourlyBudgetPerDay: string;
  hourlyBudgetPerNight: string;
  unlockCost: string;
  enabledCurrency: string[];
  startingResource: Record<string, number>;
  globalEnemySpawnConfig: Record<string, number[]>;
  starRatingTargets?: { star1?: number; star2?: number; star3?: number };
  nightsToPass?: string;
  enemyBudgetValueToKill?: string;
  collectResource: Record<string, number>;
  huntEnemy: Record<string, number>;
  breakObstacle: Record<string, number>;
  destroyAllEnemySpawners?: boolean;
}

export function getDynamicEnemyKeys(): string[] {
  return Object.keys(enemyTypes);
}

export function getSelectedEnemyKeys(): string[] {
  if (state.levelEditor.levelConfigSelectedEnemies && state.levelEditor.levelConfigSelectedEnemies.length > 0) {
    return state.levelEditor.levelConfigSelectedEnemies;
  }
  const allEnemies = getDynamicEnemyKeys();
  const cfg = state.levelEditorLevelConfig;
  const nonZero = new Set<string>();
  if (cfg && cfg.globalEnemySpawnConfig) {
    for (const pKey of SPAWN_CONFIG_PERIODS) {
      const row = cfg.globalEnemySpawnConfig[pKey];
      if (Array.isArray(row)) {
        row.forEach((w: number, idx: number) => {
          if (w > 0 && allEnemies[idx]) nonZero.add(allEnemies[idx]);
        });
      }
    }
  }
  const initial = nonZero.size > 0 ? Array.from(nonZero) : ['e_basic', 'e_fast', 'e_tank', 'e_splitter'];
  state.levelEditor.levelConfigSelectedEnemies = initial;
  return initial;
}

export function getEnemyIcon(eKey: string): any {
  if (eKey === 'e_swarm') return state.assets['img_swarm_center'];
  if (eKey === 'e_fastNoDrop') return state.assets['img_fast'];
  const stripped = eKey.replace('e_', 'img_');
  return state.assets[stripped] || state.assets['img_' + eKey] || null;
}

export function formatUnlockCostToString(costs: Array<Record<string, number>> | undefined): string {
  if (!costs || !Array.isArray(costs) || costs.length === 0) return '';
  return costs.map(item => {
    if (!item) return '';
    const k = Object.keys(item)[0];
    return k ? `${k}: ${item[k]}` : '';
  }).filter(Boolean).join(', ');
}

export function parseUnlockCostString(str: string): Array<Record<string, number>> {
  const clean = (str || '').trim();
  if (!clean) return [];
  const parts = clean.split(',');
  const result: Array<Record<string, number>> = [];
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      const cType = trimmed.substring(0, colonIdx).trim().toLowerCase();
      const valStr = trimmed.substring(colonIdx + 1).trim();
      const val = parseInt(valStr, 10);
      if (cType) {
        result.push({ [cType]: !isNaN(val) ? Math.max(0, val) : 1 });
      }
    }
  }
  return result;
}

export function getNextWeightCycle(current: number): number {
  if (current < 0.1) return 0.25;
  if (current < 0.35) return 0.5;
  if (current < 0.75) return 1.0;
  return 1.0; // When at 1, don't switch during drag/click cycling
}

export function isRightClick(): boolean {
  const RIGHT: any = (window as any).RIGHT;
  const mb = (window as any).mouseButton;
  return mb === RIGHT || mb === 2 || (window as any).event?.button === 2;
}

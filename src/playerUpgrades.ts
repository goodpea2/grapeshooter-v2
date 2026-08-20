import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { recalculateAllStats } from './upgrades';

export interface PlayerUpgradeTrackConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  statFormat: (val: number) => string;
  values: number[];
  costs: number[];
  costType: string;
}

export const DEFAULT_PLAYER_UPGRADE_CONFIGS: Record<string, PlayerUpgradeTrackConfig> = {
  turretAttachCapacity: {
    id: 'turretAttachCapacity',
    name: 'Attach Capacity',
    description: 'Increases max attached plants following player',
    icon: 'img_t_pea_front',
    statFormat: (val: number) => `${val} slots`,
    values: [6, 8, 10, 13, 16, 20, 24],
    costs: [5, 10, 20, 35, 60, 100],
    costType: 'elixir'
  },
  sunBankCapacity: {
    id: 'sunBankCapacity',
    name: 'Sun Bank Capacity',
    description: 'Increases maximum stored Sun capacity',
    icon: 'img_icon_sun',
    statFormat: (val: number) => `${val} max`,
    values: [20, 30, 50, 70, 100, 200, 400],
    costs: [5, 15, 30, 50, 80, 100],
    costType: 'elixir'
  },
  magnetRadius: {
    id: 'magnetRadius',
    name: 'Magnet Radius',
    description: 'Expands attraction radius for collecting loot',
    icon: 'img_t_pulse_front',
    statFormat: (val: number) => `${(val / GRID_SIZE).toFixed(1)} tiles`,
    values: [
      GRID_SIZE * 2.5,
      GRID_SIZE * 3.0,
      GRID_SIZE * 3.6,
      GRID_SIZE * 4.2,
      GRID_SIZE * 4.8,
      GRID_SIZE * 5.4,
      GRID_SIZE * 6.0
    ],
    costs: [10, 20, 40, 70, 100, 120],
    costType: 'elixir'
  },
  damageMultAdd: {
    id: 'damageMultAdd',
    name: 'Damage Multiplier',
    description: "Increases player's mining and attack damage",
    icon: 'img_icon_shard',
    statFormat: (val: number) => `+${Math.round(val * 100)}%`,
    values: [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5],
    costs: [5, 15, 30, 50, 80, 100],
    costType: 'elixir'
  }
};

/**
 * Resolves player upgrade track configuration, merging default values with any LevelData overrides.
 */
export function getPlayerUpgradeConfig(upgradeKey: string): PlayerUpgradeTrackConfig {
  const base = DEFAULT_PLAYER_UPGRADE_CONFIGS[upgradeKey] || {
    id: upgradeKey,
    name: upgradeKey,
    description: '',
    icon: 'img_basic',
    statFormat: (v: number) => `${v}`,
    values: [0],
    costs: [],
    costType: 'elixir'
  };

  let levelOverrides: any = null;

  // In Level Editor or during an active Editor Playtest, use the editor's live overrides
  if (state.currentScreen === 'level_editor' || state.isEditorPlaytest) {
    const editorOverride = state.levelEditorPlayerUpgrades?.[upgradeKey];
    if (editorOverride && (editorOverride.values?.length || editorOverride.costs?.length)) {
      levelOverrides = editorOverride;
    }
  }

  // When loading/playing a level from LevelList or standard play, use the level's own playerUpgrades
  if (!levelOverrides) {
    levelOverrides = state.currentLevelLayoutData?.playerUpgrades?.[upgradeKey] 
       || state.currentLevelLayoutData?.PlayerUpgrades?.[upgradeKey];
  }

  if (!levelOverrides) return base;

  return {
    ...base,
    values: (levelOverrides.values && levelOverrides.values.length > 0) ? levelOverrides.values : base.values,
    costs: (levelOverrides.costs && levelOverrides.costs.length > 0) ? levelOverrides.costs : base.costs,
    costType: levelOverrides.costType || base.costType
  };
}

/**
 * Returns current player upgrade level index (0 = initial base tier).
 */
export function getPlayerUpgradeLevel(upgradeKey: string): number {
  if (!state.playerUpgrades) {
    state.playerUpgrades = {
      turretAttachCapacity: 0,
      sunBankCapacity: 0,
      magnetRadius: 0,
      damageMultAdd: 0
    };
  }
  return state.playerUpgrades[upgradeKey] || 0;
}

/**
 * Returns current active stat value for an upgrade key.
 */
export function getPlayerUpgradeStat(upgradeKey: string): number {
  const config = getPlayerUpgradeConfig(upgradeKey);
  const lvl = getPlayerUpgradeLevel(upgradeKey);
  const safeIdx = Math.max(0, Math.min(lvl, config.values.length - 1));
  return config.values[safeIdx];
}

/**
 * Returns upgrade purchase information (cost, currency, affordability, next values).
 */
export function getPlayerUpgradeInfo(upgradeKey: string) {
  const config = getPlayerUpgradeConfig(upgradeKey);
  const currentLevel = getPlayerUpgradeLevel(upgradeKey);
  const maxLevel = config.values.length <= 1 ? 0 : Math.min(config.costs.length, config.values.length - 1);
  const isMax = config.values.length <= 1 || currentLevel >= maxLevel;

  const currVal = config.values[Math.min(currentLevel, config.values.length - 1)];
  const nextVal = isMax ? currVal : config.values[Math.min(currentLevel + 1, config.values.length - 1)];
  const cost = isMax ? 0 : (config.costs[currentLevel] ?? 0);
  const costType = config.costType || 'elixir';

  const currencyKey = `${costType}Currency`;
  const currentCurrency = (state as any)[currencyKey] || 0;
  const canAfford = !isMax && currentCurrency >= cost;

  return {
    config,
    currentLevel,
    maxLevel,
    isMax,
    currVal,
    nextVal,
    cost,
    costType,
    canAfford
  };
}

/**
 * Purchases the next level for the specified player upgrade.
 */
export function purchasePlayerUpgrade(upgradeKey: string): boolean {
  const info = getPlayerUpgradeInfo(upgradeKey);
  if (info.isMax || !info.canAfford) return false;

  const currencyKey = `${info.costType}Currency`;
  (state as any)[currencyKey] -= info.cost;
  state.playerUpgrades[upgradeKey] = info.currentLevel + 1;

  // Trigger UI animation scale for the spent currency
  if (info.costType === 'elixir') state.uiElixirScale = 1.4;
  else if (info.costType === 'sun') state.uiSunScale = 1.4;
  else if (info.costType === 'soil') state.uiSoilScale = 1.4;

  recalculateAllStats();

  return true;
}

/**
 * Resets all player upgrades to 0 (base level).
 */
export function resetPlayerUpgrades() {
  state.playerUpgrades = {
    turretAttachCapacity: 0,
    sunBankCapacity: 0,
    magnetRadius: 0,
    damageMultAdd: 0
  };
  recalculateAllStats();
}

import { state } from '../../state';
import { enemyTypes } from '../../balanceEnemies';
import { AlmanacProgression } from '../../lvDemo';
import { color } from '../../uiColors';
import { drawButton, drawCard } from '../../uiComponents';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const textWidth: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const TOP: any;
declare const BOTTOM: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseIsPressed: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const floor: any;
declare const abs: any;
declare const constrain: any;
declare const ellipse: any;

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

export const DEFAULT_DAYTIME_WEIGHTS: Record<string, number[]> = {
  "1_day":   [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  "1_night": [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  "2_day":   [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  "2_night": [1, 1, 0.5, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0.5, 0, 0, 0, 0, 0],
  "3_day":   [1, 1, 0.5, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0.5, 0, 0, 0, 0, 0],
  "3_night": [1, 1, 1, 0, 0.5, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0],
  "4_day":   [1, 1, 0.5, 0, 0, 0, 0, 0, 0, 1, 0.5, 0, 1, 0, 0.5, 0, 0, 1],
  "4_night": [0.5, 1, 1, 0.5, 0.5, 0.25, 0, 0, 0.5, 1, 1, 0.5, 0.5, 0, 0.5, 0.25, 0, 1],
  "5_day":   [0.5, 1, 0.5, 0.5, 0.5, 0.25, 0, 0, 0.5, 1, 0.5, 0.5, 0.5, 0, 0.5, 0.25, 0, 1],
  "5_night": [0.5, 1, 1, 0.5, 1, 0.5, 0, 0, 1, 1, 1, 0.5, 0, 0, 1, 0.5, 0, 1],
  "6_day":   [0, 1, 0.5, 0, 0, 0, 0, 0, 1, 0.5, 0, 1, 1, 0.5, 0, 1, 1, 0.5],
  "6_night": [0, 0.5, 0.5, 0.25, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 1, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5],
  "7_day":   [0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 0.5],
  "7_night": [0, 0, 0, 0, 1, 1, 1, 0, 0, 0.5, 1, 1, 0.5, 1, 1, 0.5, 1, 0],
  "8_day":   [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0.5, 1, 1, 1, 0, 1, 0.5, 0.5],
  "8_night": [0.5, 0.5, 0.5, 0.25, 0.5, 0.5, 0.5, 0, 1, 0, 0.25, 1, 0.5, 1, 0.5, 0.5, 1, 0.5],
  "9_day":   [0.5, 0.5, 0.5, 0.25, 0.5, 0.5, 0.5, 0, 1, 0, 0.25, 1, 0.5, 1, 0.5, 0.5, 1, 0.5],
  "9_night": [0, 0, 0.5, 0.5, 0.5, 1, 1, 0, 1, 0, 0, 1, 0.5, 1, 0.5, 0.5, 1, 0.5],
};

export function getDynamicEnemyKeys(): string[] {
  return Object.keys(enemyTypes);
}

function getEnemyIcon(eKey: string): any {
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
}

export function initLevelEditorLevelConfig(layoutData?: any) {
  const current = layoutData || state.currentLevelLayoutData || {};
  const allEnemies = getDynamicEnemyKeys();
  
  let budgetStr = DEFAULT_CUSTOM_BUDGET_PER_NIGHT.join(', ');
  if (current.customBudgetPerNight !== undefined) {
    if (Array.isArray(current.customBudgetPerNight)) {
      budgetStr = current.customBudgetPerNight.join(', ');
    } else {
      budgetStr = String(current.customBudgetPerNight);
    }
  }

  let hourlyDayStr = DEFAULT_HOURLY_BUDGET_PER_DAY.join(', ');
  if (current.hourlyBudgetPerDay !== undefined) {
    if (Array.isArray(current.hourlyBudgetPerDay)) {
      hourlyDayStr = current.hourlyBudgetPerDay.join(', ');
    } else {
      hourlyDayStr = String(current.hourlyBudgetPerDay);
    }
  }

  let hourlyNightStr = DEFAULT_HOURLY_BUDGET_PER_NIGHT.join(', ');
  if (current.hourlyBudgetPerNight !== undefined) {
    if (Array.isArray(current.hourlyBudgetPerNight)) {
      hourlyNightStr = current.hourlyBudgetPerNight.join(', ');
    } else {
      hourlyNightStr = String(current.hourlyBudgetPerNight);
    }
  }

  const rawProg = current.almanacProgression || current.AlmanacProgression || state.levelEditorAlmanacProgression;
  const rawCosts = rawProg?.UnlockCost !== undefined ? rawProg.UnlockCost : (state.levelEditorAlmanacProgression?.UnlockCost || []);
  const unlockCostStr = formatUnlockCostToString(rawCosts);

  const enabledCurrencies = Array.isArray(current.enabledCurrency)
    ? [...current.enabledCurrency]
    : ['sun', 'elixir', 'soil'];

  const startRes: Record<string, number> = {};
  for (const c of ALL_CURRENCIES) {
    startRes[c.key] = current.startingResource?.[c.key] !== undefined
      ? Number(current.startingResource[c.key])
      : (c.key === 'sun' ? 3 : 0);
  }

  // Initialize globalEnemySpawnConfig matrix dynamically with all enemies
  const spawnCfg: Record<string, number[]> = {};
  const rawSpawnCfg = current.globalEnemySpawnConfig || current.GlobalEnemySpawnConfig || {};

  for (const period of SPAWN_CONFIG_PERIODS) {
    if (Array.isArray(rawSpawnCfg[period])) {
      spawnCfg[period] = [...rawSpawnCfg[period]];
      while (spawnCfg[period].length < allEnemies.length) {
        spawnCfg[period].push(0);
      }
    } else {
      const defRow = DEFAULT_DAYTIME_WEIGHTS[period] || DEFAULT_DAYTIME_WEIGHTS["5_night"] || Array(allEnemies.length).fill(0);
      spawnCfg[period] = defRow.slice(0, allEnemies.length);
      while (spawnCfg[period].length < allEnemies.length) {
        spawnCfg[period].push(0);
      }
    }
  }

  const rawStarTargets = current.starRatingTargets || {};

  const rawSunInterval = current.sunSpawnHourInterval !== undefined ? current.sunSpawnHourInterval : (current.SunSpawnHourInterval !== undefined ? current.SunSpawnHourInterval : 0.5);
  const sunIntervalStr = String(rawSunInterval);

  state.levelEditorLevelConfig = {
    id: current.levelId || current.id || state.currentLevelId || 'editor_custom',
    name: current.levelName || current.name || 'Custom Level',
    description: current['level Description'] || current.levelDescription || current.description || 'Custom level layout created in Level Editor.',
    tag: current.tag || 'CUSTOM MAP',
    sunSpawnHourInterval: sunIntervalStr,
    customBudgetPerNight: budgetStr,
    hourlyBudgetPerDay: hourlyDayStr,
    hourlyBudgetPerNight: hourlyNightStr,
    unlockCost: unlockCostStr,
    enabledCurrency: enabledCurrencies,
    startingResource: startRes,
    globalEnemySpawnConfig: spawnCfg,
    starRatingTargets: {
      star1: rawStarTargets.star1 !== undefined ? rawStarTargets.star1 : 600,
      star2: rawStarTargets.star2 !== undefined ? rawStarTargets.star2 : 300,
      star3: rawStarTargets.star3 !== undefined ? rawStarTargets.star3 : 180
    }
  };
}

function parseNumberOrArray(strVal: string, fallback: number[]): number | number[] {
  const clean = (strVal || '').trim();
  if (!clean) return [...fallback];
  if (clean.includes(',')) {
    const arr = clean.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    return arr.length > 0 ? arr : [...fallback];
  }
  const single = parseInt(clean, 10);
  return !isNaN(single) ? single : [...fallback];
}

export function serializeLevelEditorLevelConfig(): any {
  if (!state.levelEditorLevelConfig) {
    initLevelEditorLevelConfig();
  }
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;

  const parsedBudget = parseNumberOrArray(cfg.customBudgetPerNight, DEFAULT_CUSTOM_BUDGET_PER_NIGHT);
  const parsedHourlyDay = parseNumberOrArray(cfg.hourlyBudgetPerDay, DEFAULT_HOURLY_BUDGET_PER_DAY);
  const parsedHourlyNight = parseNumberOrArray(cfg.hourlyBudgetPerNight, DEFAULT_HOURLY_BUDGET_PER_NIGHT);
  const parsedUnlockCosts = parseUnlockCostString(cfg.unlockCost || '');
  const parsedSunInterval = parseFloat(cfg.sunSpawnHourInterval);
  const finalSunInterval = (!isNaN(parsedSunInterval) && parsedSunInterval > 0) ? parsedSunInterval : 0.5;

  if (state.levelEditorAlmanacProgression) {
    state.levelEditorAlmanacProgression.UnlockCost = parsedUnlockCosts;
  }

  return {
    levelId: cfg.id || 'editor_custom',
    levelName: cfg.name || 'Custom Level',
    levelDescription: cfg.description || 'Custom level layout.',
    tag: cfg.tag || 'CUSTOM MAP',
    sunSpawnHourInterval: finalSunInterval,
    customBudgetPerNight: parsedBudget,
    hourlyBudgetPerDay: parsedHourlyDay,
    hourlyBudgetPerNight: parsedHourlyNight,
    enabledCurrency: [...(cfg.enabledCurrency || ['sun', 'elixir', 'soil'])],
    startingResource: { ...(cfg.startingResource || { sun: 3 }) },
    globalEnemySpawnConfig: JSON.parse(JSON.stringify(cfg.globalEnemySpawnConfig || DEFAULT_DAYTIME_WEIGHTS)),
    starRatingTargets: {
      star1: cfg.starRatingTargets?.star1 ?? 600,
      star2: cfg.starRatingTargets?.star2 ?? 300,
      star3: cfg.starRatingTargets?.star3 ?? 180
    }
  };
}

export function drawLevelConfigPanel(
  panelX: number, panelY: number, panelW: number, panelH: number,
  modalX: number, modalY: number
) {
  if (!state.levelEditorLevelConfig) {
    initLevelEditorLevelConfig();
  }
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;
  const enemyKeys = getDynamicEnemyKeys();

  push();
  translate(panelX, panelY);

  // Main Background Card (sleek, borderless)
  fill(16, 20, 38, 240);
  noStroke();
  rect(0, 0, panelW, panelH, 20);

  // Viewport setup (no extra redundant title headers)
  const viewY = 16;
  const viewH = panelH - viewY - 12;
  const totalContentH = 145 + 14 + 92 + 14 + 80 + 14 + 80 + 14 + 100 + 14 + 265 + 14 + (24 + enemyKeys.length * 21 + 56) + 40;
  const minScroll = Math.min(0, viewH - totalContentH);

  // Smooth scroll damping
  if (state.levelConfigScrollVelocity) {
    state.levelConfigScrollY = constrain(
      (state.levelConfigScrollY || 0) + state.levelConfigScrollVelocity,
      minScroll,
      0
    );
    state.levelConfigScrollVelocity *= 0.85;
    if (abs(state.levelConfigScrollVelocity) < 0.01) state.levelConfigScrollVelocity = 0;
  } else {
    state.levelConfigScrollY = constrain(state.levelConfigScrollY || 0, minScroll, 0);
  }

  const scrollY = state.levelConfigScrollY || 0;

  // Clip content area
  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(0, viewY, panelW, viewH);
    dc.clip();
  }

  push();
  translate(0, viewY + scrollY);

  let curY = 0;
  const globalOffsetX = modalX + panelX;
  const globalOffsetY = modalY + panelY + viewY + scrollY;

  // ==========================================
  // SECTION 1: Level Metadata (ID, Name, Description, Tag)
  // ==========================================
  const card1W = panelW - 40;
  const card1H = 145;
  const card1X = 20;

  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card1H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("1. METADATA & IDENTITY", card1X + 14, curY + 12);

  // Row 1: ID, Tag, Sun Spawn Interval
  const fieldH = 24;
  const row1Y = curY + 34;
  const col1W = Math.max(120, (card1W - 28 - 20) / 3);

  renderTextInput(
    card1X + 14, row1Y, col1W, fieldH,
    "Level ID",
    'id',
    cfg.id,
    globalOffsetX, globalOffsetY
  );

  renderTextInput(
    card1X + 14 + col1W + 10, row1Y, col1W, fieldH,
    "Tag / Category",
    'tag',
    cfg.tag,
    globalOffsetX, globalOffsetY
  );

  renderTextInput(
    card1X + 14 + (col1W + 10) * 2, row1Y, col1W, fieldH,
    "Sun Spawn Interval (Hours, e.g. 0.5)",
    'sunSpawnHourInterval',
    cfg.sunSpawnHourInterval,
    globalOffsetX, globalOffsetY
  );

  // Row 2: Level Display Name
  const row2Y = curY + 68;
  renderTextInput(
    card1X + 14, row2Y, card1W - 28, fieldH,
    "Level Display Name",
    'name',
    cfg.name,
    globalOffsetX, globalOffsetY
  );

  // Row 3: Description
  const row3Y = curY + 102;
  renderTextInput(
    card1X + 14, row3Y, card1W - 28, fieldH,
    "Description",
    'description',
    cfg.description,
    globalOffsetX, globalOffsetY
  );

  curY += card1H + 14;

  // ==========================================
  // SECTION 2: Wave & Hourly Budgets
  // ==========================================
  const card2H = 92;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card2H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("2. WAVE & HOURLY BUDGETS (Comma-separated values per day or single value)", card1X + 14, curY + 12);

  const budgetRowY = curY + 34;
  const colW = (card1W - 48) / 3;

  renderTextInput(
    card1X + 14, budgetRowY, colW, fieldH,
    "Night Budget per Day [100, 200, 400...]",
    'customBudgetPerNight',
    cfg.customBudgetPerNight,
    globalOffsetX, globalOffsetY
  );

  renderTextInput(
    card1X + 14 + colW + 10, budgetRowY, colW, fieldH,
    "Hourly Day Budget [3, 10, 20...]",
    'hourlyBudgetPerDay',
    cfg.hourlyBudgetPerDay,
    globalOffsetX, globalOffsetY
  );

  renderTextInput(
    card1X + 14 + (colW + 10) * 2, budgetRowY, colW, fieldH,
    "Hourly Night Budget [20, 40, 80...]",
    'hourlyBudgetPerNight',
    cfg.hourlyBudgetPerNight,
    globalOffsetX, globalOffsetY
  );

  curY += card2H + 14;

  // ==========================================
  // SECTION 3: Turret Unlock Costs
  // ==========================================
  const cardUnlockH = 80;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, cardUnlockH, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("3. TURRET UNLOCK COSTS (Leave empty to disable the Turret Unlock Button)", card1X + 14, curY + 12);

  const unlockRowY = curY + 34;
  const actionBtnW = 100;
  const inputUnlockW = card1W - 28 - (actionBtnW * 2 + 12);

  renderTextInput(
    card1X + 14, unlockRowY, inputUnlockW, fieldH,
    "Costs sequence (e.g. raisin: 1, raisin: 2, soil: 50)",
    'unlockCost',
    cfg.unlockCost,
    globalOffsetX, globalOffsetY
  );

  // CLEAR button
  const clearBtnX = card1X + 14 + inputUnlockW + 6;
  const clearGX = globalOffsetX + clearBtnX;
  const clearGY = globalOffsetY + unlockRowY;
  const isClearHov = mouseX >= clearGX && mouseX <= clearGX + actionBtnW && mouseY >= clearGY && mouseY <= clearGY + fieldH;

  push();
  fill(isClearHov ? [80, 25, 35] : [45, 18, 25]);
  if (isClearHov) {
    stroke(255, 100, 100);
    strokeWeight(1.5);
  } else {
    noStroke();
  }
  rect(clearBtnX, unlockRowY, actionBtnW, fieldH, 6);
  fill(255, 200, 200);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(9.5);
  text("CLEAR", clearBtnX + actionBtnW / 2, unlockRowY + fieldH / 2);
  pop();

  // DEFAULT CAMPAIGN button
  const defBtnX = clearBtnX + actionBtnW + 6;
  const defGX = globalOffsetX + defBtnX;
  const defGY = globalOffsetY + unlockRowY;
  const isDefHov = mouseX >= defGX && mouseX <= defGX + actionBtnW && mouseY >= defGY && mouseY <= defGY + fieldH;

  push();
  fill(isDefHov ? [30, 60, 90] : [20, 35, 60]);
  if (isDefHov) {
    stroke(0, 220, 255);
    strokeWeight(1.5);
  } else {
    noStroke();
  }
  rect(defBtnX, unlockRowY, actionBtnW, fieldH, 6);
  fill(180, 230, 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(9.5);
  text("CAMPAIGN DEFAULTS", defBtnX + actionBtnW / 2, unlockRowY + fieldH / 2);
  pop();

  curY += cardUnlockH + 14;

  // ==========================================
  // SECTION 4: Star Rating Time Targets
  // ==========================================
  const cardStarH = 80;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, cardStarH, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("4. STAR RATING TIME TARGETS (Seconds to beat)", card1X + 14, curY + 12);

  const starRowY = curY + 34;
  const starColW = (card1W - 48) / 3;

  // Star 1 Target
  renderTextInput(
    card1X + 14, starRowY, starColW, fieldH,
    "★ Target Time (e.g. 600s)",
    'star1',
    String(cfg.starRatingTargets?.star1 ?? 600),
    globalOffsetX, globalOffsetY
  );

  // Star 2 Target
  renderTextInput(
    card1X + 14 + starColW + 10, starRowY, starColW, fieldH,
    "★★ Target Time (e.g. 300s)",
    'star2',
    String(cfg.starRatingTargets?.star2 ?? 300),
    globalOffsetX, globalOffsetY
  );

  // Star 3 Target
  renderTextInput(
    card1X + 14 + (starColW + 10) * 2, starRowY, starColW, fieldH,
    "★★★ Target Time (e.g. 180s)",
    'star3',
    String(cfg.starRatingTargets?.star3 ?? 180),
    globalOffsetX, globalOffsetY
  );

  curY += cardStarH + 14;

  // ==========================================
  // SECTION 5: Enabled Currencies
  // ==========================================
  const card3H = 100;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card3H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("5. ENABLED CURRENCIES (Click to toggle)", card1X + 14, curY + 12);

  let curBadgeX = card1X + 14;
  let curBadgeY = curY + 34;
  const badgeH = 26;

  for (const c of ALL_CURRENCIES) {
    const isEnabled = cfg.enabledCurrency.includes(c.key);
    textSize(9.5);
    const badgeW = textWidth(c.label) + 42;

    if (curBadgeX + badgeW > card1X + card1W - 14) {
      curBadgeX = card1X + 14;
      curBadgeY += badgeH + 6;
    }

    const gX = globalOffsetX + curBadgeX;
    const gY = globalOffsetY + curBadgeY;
    const isHov = mouseX >= gX && mouseX <= gX + badgeW && mouseY >= gY && mouseY <= gY + badgeH;

    push();
    fill(isEnabled ? [25, 45, 80] : [14, 18, 30]);
    if (isHov) {
      stroke(c.color[0], c.color[1], c.color[2]);
      strokeWeight(1.5);
    } else {
      noStroke();
    }

    rect(curBadgeX, curBadgeY, badgeW, badgeH, 6);

    // Currency Icon
    const iconAsset = state.assets[c.icon];
    if (iconAsset) {
      imageMode(CENTER);
      if (!isEnabled) tint(120, 120, 140, 160);
      image(iconAsset, curBadgeX + 14, curBadgeY + badgeH / 2, 20, 20);
      noTint();
    }

    // Currency Name
    textAlign(LEFT, CENTER);
    fill(isEnabled ? [255, 255, 255] : [120, 130, 150]);
    textSize(9.5);
    text(c.label, curBadgeX + 28, curBadgeY + badgeH / 2);

    // Toggle Indicator Dot
    const dotX = curBadgeX + badgeW - 8;
    fill(isEnabled ? [100, 255, 120] : [100, 100, 120]);
    noStroke();
    ellipse(dotX, curBadgeY + badgeH / 2, 6, 6);

    pop();

    curBadgeX += badgeW + 6;
  }

  curY += card3H + 14;

  // ==========================================
  // SECTION 4: Starting Resources
  // ==========================================
  const card4H = 265;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card4H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("4. STARTING RESOURCES (Amount of each currency to start with)", card1X + 14, curY + 12);

  const resGridStartX = card1X + 14;
  let resGridY = curY + 36;
  const resColW = (card1W - 48) / 3;
  const resItemH = 34;

  for (let i = 0; i < ALL_CURRENCIES.length; i++) {
    const c = ALL_CURRENCIES[i];
    const colIdx = i % 3;
    const rowIdx = Math.floor(i / 3);
    const itemX = resGridStartX + colIdx * (resColW + 10);
    const itemY = resGridY + rowIdx * (resItemH + 8);
    const currentVal = cfg.startingResource[c.key] ?? 0;
    const isCurrencyActive = cfg.enabledCurrency.includes(c.key);

    renderStartingResourceControl(
      itemX, itemY, resColW, resItemH,
      c,
      currentVal,
      isCurrencyActive,
      globalOffsetX, globalOffsetY
    );
  }

  curY += card4H + 14;

  // ==========================================
  // SECTION 5: Global Enemy Spawn Config Matrix
  // ==========================================
  const tableRowH = 21;
  const tableHeaderH = 24;
  const enemyHeaderW = 110;
  const numPeriods = SPAWN_CONFIG_PERIODS.length;
  const periodColW = Math.max(16, (card1W - 28 - enemyHeaderW) / numPeriods);
  const card5H = tableHeaderH + (enemyKeys.length * tableRowH) + 56;

  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card5H, 12);

  // Section Title
  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("5. GLOBAL ENEMY SPAWN CONFIG (Click/Drag cell to cycle: 0 ➔ 0.25 ➔ 0.5 ➔ 1)", card1X + 14, curY + 12);

  // Action Buttons at top right of Card 5: [SET ALL TO 0] and [RESET DEFAULTS]
  const btnRowY = curY + 10;
  const setZeroBtnW = 95;
  const resetBtnW = 105;
  const btnH = 20;
  const resetBtnX = card1X + card1W - 14 - resetBtnW;
  const setZeroBtnX = resetBtnX - 8 - setZeroBtnW;

  renderMiniActionButton(
    setZeroBtnX, btnRowY, setZeroBtnW, btnH,
    "SET ALL TO 0",
    globalOffsetX, globalOffsetY
  );

  renderMiniActionButton(
    resetBtnX, btnRowY, resetBtnW, btnH,
    "RESET DEFAULTS",
    globalOffsetX, globalOffsetY
  );

  const tableStartX = card1X + 14;
  const tableStartY = curY + 36;

  // Click-Drag continuous switching across cells
  const gViewX = modalX + panelX;
  const gViewY = modalY + panelY + viewY;
  const isInsideView = mouseX >= gViewX && mouseX <= gViewX + panelW && mouseY >= gViewY && mouseY <= gViewY + viewH;

  if (mouseIsPressed && isInsideView && !state.activeLevelConfigInput) {
    const relX = mouseX - globalOffsetX;
    const relY = mouseY - globalOffsetY;

    if (relX >= tableStartX + enemyHeaderW && relX <= tableStartX + enemyHeaderW + numPeriods * periodColW &&
        relY >= tableStartY + tableHeaderH && relY <= tableStartY + tableHeaderH + enemyKeys.length * tableRowH) {
      const c = Math.floor((relX - (tableStartX + enemyHeaderW)) / periodColW);
      const r = Math.floor((relY - (tableStartY + tableHeaderH)) / tableRowH);

      if (c >= 0 && c < numPeriods && r >= 0 && r < enemyKeys.length) {
        const pKey = SPAWN_CONFIG_PERIODS[c];
        const cellKey = `${pKey}_${r}`;

        if (!state.levelConfigToggledCells) state.levelConfigToggledCells = new Set();
        if (!state.levelConfigToggledCells.has(cellKey)) {
          state.levelConfigToggledCells.add(cellKey);
          if (!cfg.globalEnemySpawnConfig[pKey]) {
            cfg.globalEnemySpawnConfig[pKey] = Array(enemyKeys.length).fill(0);
          }
          const curVal = cfg.globalEnemySpawnConfig[pKey][r] ?? 0;
          cfg.globalEnemySpawnConfig[pKey][r] = getNextWeightCycle(curVal);
        }
      }
    }
  } else {
    if (state.levelConfigToggledCells) {
      state.levelConfigToggledCells.clear();
    }
  }

  // Draw Table Column Headers
  push();
  textAlign(CENTER, CENTER);
  textSize(8.5);

  // Top-left corner cell (Enemy label)
  fill(30, 40, 75);
  noStroke();
  rect(tableStartX, tableStartY, enemyHeaderW, tableHeaderH, 4, 0, 0, 0);
  fill(200, 220, 255);
  noStroke();
  text("ENEMY / PERIOD", tableStartX + enemyHeaderW / 2, tableStartY + tableHeaderH / 2);

  for (let c = 0; c < numPeriods; c++) {
    const pKey = SPAWN_CONFIG_PERIODS[c];
    const colX = tableStartX + enemyHeaderW + c * periodColW;
    const isNightCol = pKey.includes('night');
    const dayNum = pKey.split('_')[0];
    const shortLabel = `${dayNum}${isNightCol ? 'N' : 'D'}`;

    fill(isNightCol ? [18, 22, 50] : [35, 45, 75]);
    noStroke();
    rect(colX, tableStartY, periodColW, tableHeaderH);

    fill(isNightCol ? [180, 160, 240] : [255, 230, 140]);
    noStroke();
    text(shortLabel, colX + periodColW / 2, tableStartY + tableHeaderH / 2);
  }
  pop();

  // Draw Rows for dynamically detected enemies
  for (let r = 0; r < enemyKeys.length; r++) {
    const eKey = enemyKeys[r];
    const rowY = tableStartY + tableHeaderH + r * tableRowH;

    // Row Header (Enemy icon + internal name)
    push();
    fill(r % 2 === 0 ? [20, 26, 52] : [16, 22, 45]);
    noStroke();
    rect(tableStartX, rowY, enemyHeaderW, tableRowH);

    const iconImg = getEnemyIcon(eKey);
    if (iconImg) {
      imageMode(CENTER);
      image(iconImg, tableStartX + 10, rowY + tableRowH / 2, 14, 14);
    }

    fill(225, 235, 250);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(8.5);
    text(eKey, tableStartX + 20, rowY + tableRowH / 2);
    pop();

    // Data Cells for Each Period
    for (let c = 0; c < numPeriods; c++) {
      const pKey = SPAWN_CONFIG_PERIODS[c];
      const colX = tableStartX + enemyHeaderW + c * periodColW;
      const weightVal = cfg.globalEnemySpawnConfig[pKey]?.[r] ?? 0;

      const gCellX = globalOffsetX + colX;
      const gCellY = globalOffsetY + rowY;
      const isCellHov = mouseX >= gCellX && mouseX <= gCellX + periodColW && mouseY >= gCellY && mouseY <= gCellY + tableRowH;

      push();
      // Cell background based on weight value
      if (weightVal >= 0.9) {
        fill(isCellHov ? [40, 95, 65] : [24, 68, 48]);
      } else if (weightVal >= 0.45) {
        fill(isCellHov ? [25, 80, 100] : [16, 54, 72]);
      } else if (weightVal >= 0.2) {
        fill(isCellHov ? [35, 50, 95] : [20, 32, 65]);
      } else {
        fill(isCellHov ? [22, 28, 50] : (r % 2 === 0 ? [14, 18, 36] : [11, 14, 28]));
      }

      // Stroke strictly on hover only
      if (isCellHov) {
        stroke(weightVal >= 0.9 ? [100, 240, 160] : (weightVal >= 0.45 ? [80, 200, 255] : (weightVal >= 0.2 ? [120, 150, 230] : [100, 140, 220])));
        strokeWeight(1.5);
      } else {
        noStroke();
      }

      rect(colX, rowY, periodColW, tableRowH);

      // Value text
      textAlign(CENTER, CENTER);
      textSize(8);
      if (weightVal >= 0.9) {
        fill(160, 255, 180);
        noStroke();
        text("1", colX + periodColW / 2, rowY + tableRowH / 2);
      } else if (weightVal >= 0.45) {
        fill(140, 230, 255);
        noStroke();
        text("0.5", colX + periodColW / 2, rowY + tableRowH / 2);
      } else if (weightVal >= 0.2) {
        fill(180, 200, 255);
        noStroke();
        text("0.25", colX + periodColW / 2, rowY + tableRowH / 2);
      } else {
        fill(80, 95, 125);
        noStroke();
        text("-", colX + periodColW / 2, rowY + tableRowH / 2);
      }
      pop();
    }
  }

  curY += card5H + 20;

  pop();

  if (dc) {
    dc.restore();
  }

  pop();
}

function renderMiniActionButton(
  x: number, y: number, w: number, h: number,
  label: string,
  globalOffsetX: number, globalOffsetY: number
) {
  const gX = globalOffsetX + x;
  const gY = globalOffsetY + y;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  push();
  fill(isHov ? [45, 65, 120] : [24, 35, 68]);
  if (isHov) {
    stroke(0, 220, 255);
    strokeWeight(1);
  } else {
    noStroke();
  }
  rect(x, y, w, h, 4);

  fill(isHov ? [255, 255, 255] : [180, 210, 255]);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(8.5);
  text(label, x + w / 2, y + h / 2);
  pop();
}

function renderTextInput(
  x: number, y: number, w: number, h: number,
  label: string,
  field: string,
  value: string,
  globalOffsetX: number, globalOffsetY: number
) {
  const gX = globalOffsetX + x;
  const gY = globalOffsetY + y;
  const isFocused = state.activeLevelConfigInput?.field === field;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  push();
  fill(...color.lightBlue(220));
  textAlign(LEFT, BOTTOM);
  textSize(8.5);
  text(label, x, y - 2);

  fill(...(isFocused ? color.veryDarkBlue(250) : (isHov ? [20, 28, 50, 240] : [12, 16, 32, 230])));
  if (isFocused) {
    stroke(...color.cyan());
    strokeWeight(1.5);
  } else if (isHov) {
    stroke(...color.lightBlue());
    strokeWeight(1);
  } else {
    stroke(45, 55, 95);
    strokeWeight(1);
  }
  rect(x, y, w, h, 6);

  const displayVal = isFocused ? state.activeLevelConfigInput!.textBuffer : (value || '');
  fill(...(isFocused ? color.white() : [240, 235, 180]));
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9.5);
  const blink = (isFocused && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
  text(displayVal + blink, x + 8, y + h / 2);
  pop();
}

function renderStartingResourceControl(
  x: number, y: number, w: number, h: number,
  currencyDef: typeof ALL_CURRENCIES[0],
  value: number,
  isActive: boolean,
  globalOffsetX: number, globalOffsetY: number
) {
  const isFocused = state.activeLevelConfigInput?.field === 'startingResource' && state.activeLevelConfigInput?.subKey === currencyDef.key;
  const btnSize = 22;
  const valBoxW = 44;

  push();
  // Container Box (borderless)
  fill(isActive ? [18, 24, 46] : [14, 16, 26]);
  noStroke();
  rect(x, y, w, h, 6);

  // Currency Icon
  const iconAsset = state.assets[currencyDef.icon];
  if (iconAsset) {
    imageMode(CENTER);
    if (!isActive) tint(100, 100, 120, 160);
    image(iconAsset, x + 16, y + h / 2, 22, 22);
    noTint();
  }

  // Currency Label
  textAlign(LEFT, CENTER);
  fill(isActive ? [230, 235, 245] : [120, 130, 145]);
  textSize(9);
  text(currencyDef.label, x + 32, y + h / 2);

  // Controls on Right: [-] [Val] [+]
  const controlsW = btnSize * 2 + valBoxW + 6;
  const controlsStartX = x + w - controlsW - 8;

  // [-] Button
  const minusX = controlsStartX;
  const gMinusX = globalOffsetX + minusX;
  const gMinusY = globalOffsetY + y + (h - btnSize) / 2;
  const isMinusHov = mouseX >= gMinusX && mouseX <= gMinusX + btnSize && mouseY >= gMinusY && mouseY <= gMinusY + btnSize;
  fill(isMinusHov ? [45, 75, 130] : [22, 30, 55]);
  if (isMinusHov) {
    stroke(45, 65, 110);
    strokeWeight(1);
  } else {
    noStroke();
  }
  rect(minusX, y + (h - btnSize) / 2, btnSize, btnSize, 4);
  fill(240);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(11);
  text("-", minusX + btnSize / 2, y + h / 2);

  // Value Box
  const valX = minusX + btnSize + 3;
  const gValX = globalOffsetX + valX;
  const isValHov = mouseX >= gValX && mouseX <= gValX + valBoxW && mouseY >= gMinusY && mouseY <= gMinusY + btnSize;
  fill(isFocused ? [14, 25, 52] : (isValHov ? [20, 28, 50] : [12, 16, 32]));
  if (isFocused) {
    stroke(0, 220, 255);
    strokeWeight(1.5);
  } else if (isValHov) {
    stroke(80, 120, 190);
    strokeWeight(1);
  } else {
    noStroke();
  }
  rect(valX, y + (h - btnSize) / 2, valBoxW, btnSize, 4);

  const displayVal = isFocused ? state.activeLevelConfigInput!.textBuffer : String(value);
  fill(isFocused ? [255, 255, 255] : [255, 220, 100]);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(9);
  const blink = (isFocused && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
  text(displayVal + blink, valX + valBoxW / 2, y + h / 2);

  // [+] Button
  const plusX = valX + valBoxW + 3;
  const gPlusX = globalOffsetX + plusX;
  const isPlusHov = mouseX >= gPlusX && mouseX <= gPlusX + btnSize && mouseY >= gMinusY && mouseY <= gMinusY + btnSize;
  fill(isPlusHov ? [45, 75, 130] : [22, 30, 55]);
  if (isPlusHov) {
    stroke(45, 65, 110);
    strokeWeight(1);
  } else {
    noStroke();
  }
  rect(plusX, y + (h - btnSize) / 2, btnSize, btnSize, 4);
  fill(240);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(11);
  text("+", plusX + btnSize / 2, y + h / 2);

  pop();
}

function getNextWeightCycle(current: number): number {
  if (current < 0.1) return 0.25;
  if (current < 0.35) return 0.5;
  if (current < 0.75) return 1.0;
  return 0.0;
}

export function handleLevelConfigClick(
  mx: number, my: number,
  modalX: number, modalY: number,
  modalW: number, modalH: number
): boolean {
  if (!state.levelEditorLevelConfig) {
    initLevelEditorLevelConfig();
  }
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;
  const enemyKeys = getDynamicEnemyKeys();

  const panelX = 20;
  const panelY = 50;
  const panelW = modalW - 40;
  const panelH = modalH - 70;

  const viewY = 16;
  const viewH = panelH - viewY - 12;

  // Check if click is inside viewport
  const gViewX = modalX + panelX;
  const gViewY = modalY + panelY + viewY;
  if (mx < gViewX || mx > gViewX + panelW || my < gViewY || my > gViewY + viewH) {
    state.activeLevelConfigInput = null;
    return false;
  }

  const scrollY = state.levelConfigScrollY || 0;
  const localX = mx - gViewX;
  const localY = my - gViewY - scrollY;

  // --- 1. METADATA INPUTS ---
  const card1X = 20;
  const card1W = panelW - 40;
  const fieldH = 24;

  // ID
  if (localX >= card1X + 14 && localX <= card1X + 14 + 180 && localY >= 34 && localY <= 34 + fieldH) {
    state.activeLevelConfigInput = { field: 'id', textBuffer: cfg.id };
    return true;
  }

  // Tag
  if (localX >= card1X + 210 && localX <= card1X + 210 + 180 && localY >= 34 && localY <= 34 + fieldH) {
    state.activeLevelConfigInput = { field: 'tag', textBuffer: cfg.tag };
    return true;
  }

  // Name
  if (localX >= card1X + 14 && localX <= card1X + 14 + card1W - 28 && localY >= 68 && localY <= 68 + fieldH) {
    state.activeLevelConfigInput = { field: 'name', textBuffer: cfg.name };
    return true;
  }

  // Description
  if (localX >= card1X + 14 && localX <= card1X + 14 + card1W - 28 && localY >= 102 && localY <= 102 + fieldH) {
    state.activeLevelConfigInput = { field: 'description', textBuffer: cfg.description };
    return true;
  }

  // --- 2. WAVE & HOURLY BUDGETS ---
  let curY = 145 + 14;
  const budgetRowY = curY + 34;
  const colW = (card1W - 48) / 3;

  // customBudgetPerNight Input
  if (localX >= card1X + 14 && localX <= card1X + 14 + colW && localY >= budgetRowY && localY <= budgetRowY + fieldH) {
    state.activeLevelConfigInput = { field: 'customBudgetPerNight', textBuffer: cfg.customBudgetPerNight };
    return true;
  }

  // hourlyBudgetPerDay Input
  const dayColX = card1X + 14 + colW + 10;
  if (localX >= dayColX && localX <= dayColX + colW && localY >= budgetRowY && localY <= budgetRowY + fieldH) {
    state.activeLevelConfigInput = { field: 'hourlyBudgetPerDay', textBuffer: cfg.hourlyBudgetPerDay };
    return true;
  }

  // hourlyBudgetPerNight Input
  const nightColX = card1X + 14 + (colW + 10) * 2;
  if (localX >= nightColX && localX <= nightColX + colW && localY >= budgetRowY && localY <= budgetRowY + fieldH) {
    state.activeLevelConfigInput = { field: 'hourlyBudgetPerNight', textBuffer: cfg.hourlyBudgetPerNight };
    return true;
  }

  // --- 3. TURRET UNLOCK COSTS ---
  curY += 92 + 14;
  const unlockRowY = curY + 34;
  const actionBtnW = 100;
  const inputUnlockW = card1W - 28 - (actionBtnW * 2 + 12);

  // unlockCost Input
  if (localX >= card1X + 14 && localX <= card1X + 14 + inputUnlockW && localY >= unlockRowY && localY <= unlockRowY + fieldH) {
    state.activeLevelConfigInput = { field: 'unlockCost', textBuffer: cfg.unlockCost };
    return true;
  }

  // CLEAR button
  const clearBtnX = card1X + 14 + inputUnlockW + 6;
  if (localX >= clearBtnX && localX <= clearBtnX + actionBtnW && localY >= unlockRowY && localY <= unlockRowY + fieldH) {
    cfg.unlockCost = '';
    if (state.levelEditorAlmanacProgression) {
      state.levelEditorAlmanacProgression.UnlockCost = [];
    }
    state.activeLevelConfigInput = null;
    return true;
  }

  // CAMPAIGN DEFAULTS button
  const defBtnX = clearBtnX + actionBtnW + 6;
  if (localX >= defBtnX && localX <= defBtnX + actionBtnW && localY >= unlockRowY && localY <= unlockRowY + fieldH) {
    const defCosts = AlmanacProgression.UnlockCost || [];
    cfg.unlockCost = formatUnlockCostToString(defCosts);
    if (state.levelEditorAlmanacProgression) {
      state.levelEditorAlmanacProgression.UnlockCost = JSON.parse(JSON.stringify(defCosts));
    }
    state.activeLevelConfigInput = null;
    return true;
  }

  // --- 4. STAR RATING TARGETS ---
  curY += 80 + 14;
  const starRowY = curY + 34;
  const starColW = (card1W - 48) / 3;

  // Star 1 input click
  const star1X = card1X + 14;
  if (localX >= star1X && localX <= star1X + starColW && localY >= starRowY && localY <= starRowY + fieldH) {
    state.activeLevelConfigInput = {
      field: 'star1',
      textBuffer: String(cfg.starRatingTargets?.star1 ?? 600)
    };
    return true;
  }

  // Star 2 input click
  const star2X = card1X + 14 + starColW + 10;
  if (localX >= star2X && localX <= star2X + starColW && localY >= starRowY && localY <= starRowY + fieldH) {
    state.activeLevelConfigInput = {
      field: 'star2',
      textBuffer: String(cfg.starRatingTargets?.star2 ?? 300)
    };
    return true;
  }

  // Star 3 input click
  const star3X = card1X + 14 + (starColW + 10) * 2;
  if (localX >= star3X && localX <= star3X + starColW && localY >= starRowY && localY <= starRowY + fieldH) {
    state.activeLevelConfigInput = {
      field: 'star3',
      textBuffer: String(cfg.starRatingTargets?.star3 ?? 180)
    };
    return true;
  }

  // --- 5. ENABLED CURRENCIES ---
  curY += 80 + 14;
  let curBadgeX = card1X + 14;
  let curBadgeY = curY + 34;
  const badgeH = 26;

  for (const c of ALL_CURRENCIES) {
    textSize(9.5);
    const badgeW = textWidth(c.label) + 42;

    if (curBadgeX + badgeW > card1X + card1W - 14) {
      curBadgeX = card1X + 14;
      curBadgeY += badgeH + 6;
    }

    if (localX >= curBadgeX && localX <= curBadgeX + badgeW && localY >= curBadgeY && localY <= curBadgeY + badgeH) {
      const idx = cfg.enabledCurrency.indexOf(c.key);
      if (idx >= 0) {
        if (cfg.enabledCurrency.length > 1) {
          cfg.enabledCurrency.splice(idx, 1);
        }
      } else {
        cfg.enabledCurrency.push(c.key);
      }
      state.activeLevelConfigInput = null;
      return true;
    }

    curBadgeX += badgeW + 6;
  }

  // --- 5. STARTING RESOURCES ---
  curY += 100 + 14;
  const resGridStartX = card1X + 14;
  const resGridY = curY + 36;
  const resColW = (card1W - 48) / 3;
  const resItemH = 34;
  const btnSize = 22;
  const valBoxW = 44;

  for (let i = 0; i < ALL_CURRENCIES.length; i++) {
    const c = ALL_CURRENCIES[i];
    const colIdx = i % 3;
    const rowIdx = Math.floor(i / 3);
    const itemX = resGridStartX + colIdx * (resColW + 10);
    const itemY = resGridY + rowIdx * (resItemH + 8);

    if (localX >= itemX && localX <= itemX + resColW && localY >= itemY && localY <= itemY + resItemH) {
      const controlsW = btnSize * 2 + valBoxW + 6;
      const controlsStartX = itemX + resColW - controlsW - 8;

      // [-] Click
      const minusX = controlsStartX;
      if (localX >= minusX && localX <= minusX + btnSize) {
        const cur = cfg.startingResource[c.key] || 0;
        cfg.startingResource[c.key] = Math.max(0, cur - (c.key === 'sun' ? 1 : 5));
        state.activeLevelConfigInput = null;
        return true;
      }

      // [Val] Click
      const valX = minusX + btnSize + 3;
      if (localX >= valX && localX <= valX + valBoxW) {
        state.activeLevelConfigInput = {
          field: 'startingResource',
          subKey: c.key,
          textBuffer: String(cfg.startingResource[c.key] || 0)
        };
        return true;
      }

      // [+] Click
      const plusX = valX + valBoxW + 3;
      if (localX >= plusX && localX <= plusX + btnSize) {
        const cur = cfg.startingResource[c.key] || 0;
        cfg.startingResource[c.key] = Math.min(9999, cur + (c.key === 'sun' ? 1 : 5));
        state.activeLevelConfigInput = null;
        return true;
      }
    }
  }

  // --- 6. GLOBAL ENEMY SPAWN CONFIG MATRIX ACTIONS ---
  curY += 265 + 14;
  const setZeroBtnW = 95;
  const resetBtnW = 105;
  const btnH = 20;
  const resetBtnX = card1X + card1W - 14 - resetBtnW;
  const setZeroBtnX = resetBtnX - 8 - setZeroBtnW;
  const btnRowY = curY + 10;

  // Check SET ALL TO 0 button click
  if (localX >= setZeroBtnX && localX <= setZeroBtnX + setZeroBtnW && localY >= btnRowY && localY <= btnRowY + btnH) {
    for (const pKey of SPAWN_CONFIG_PERIODS) {
      cfg.globalEnemySpawnConfig[pKey] = Array(enemyKeys.length).fill(0);
    }
    state.activeLevelConfigInput = null;
    return true;
  }

  // Check RESET DEFAULTS button click
  if (localX >= resetBtnX && localX <= resetBtnX + resetBtnW && localY >= btnRowY && localY <= btnRowY + btnH) {
    for (const pKey of SPAWN_CONFIG_PERIODS) {
      const defRow = DEFAULT_DAYTIME_WEIGHTS[pKey] || DEFAULT_DAYTIME_WEIGHTS["5_night"] || Array(enemyKeys.length).fill(0);
      cfg.globalEnemySpawnConfig[pKey] = defRow.slice(0, enemyKeys.length);
      while (cfg.globalEnemySpawnConfig[pKey].length < enemyKeys.length) {
        cfg.globalEnemySpawnConfig[pKey].push(0);
      }
    }
    state.activeLevelConfigInput = null;
    return true;
  }

  state.activeLevelConfigInput = null;
  return true;
}

export function handleLevelConfigKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (!state.isAlmanacOpen || state.almanacTab !== 'LevelConfig' || !state.activeLevelConfigInput) {
    return false;
  }
  const input = state.activeLevelConfigInput;
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;
  if (!cfg) return false;

  // Enter or Escape commits and defocuses
  if (keyCodeNum === 13 || keyCodeNum === 27) {
    applyLevelConfigInputBuffer(cfg, input);
    state.activeLevelConfigInput = null;
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    input.textBuffer = input.textBuffer.slice(0, -1);
    applyLevelConfigInputBuffer(cfg, input);
    return true;
  }

  // Normal character typing
  if (keyStr && keyStr.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (input.field === 'id' || input.field === 'name' || input.field === 'tag' || input.field === 'description' || input.field === 'customBudgetPerNight' || input.field === 'hourlyBudgetPerDay' || input.field === 'hourlyBudgetPerNight' || input.field === 'unlockCost') {
      const maxLen = input.field === 'unlockCost' ? 500 : (input.field === 'description' ? 120 : 60);
      if (input.textBuffer.length < maxLen) {
        input.textBuffer += keyStr;
        applyLevelConfigInputBuffer(cfg, input);
      }
      return true;
    } else {
      // Numeric fields (startingResource)
      if (keyStr >= '0' && keyStr <= '9') {
        if (input.textBuffer.length < 6) {
          input.textBuffer += keyStr;
          applyLevelConfigInputBuffer(cfg, input);
        }
        return true;
      }
    }
  }

  return false;
}

function applyLevelConfigInputBuffer(cfg: EditorLevelConfigData, input: { field: string; subKey?: string; textBuffer: string }) {
  if (input.field === 'id') {
    cfg.id = input.textBuffer;
    state.currentLevelId = input.textBuffer;
  } else if (input.field === 'name') {
    cfg.name = input.textBuffer;
  } else if (input.field === 'tag') {
    cfg.tag = input.textBuffer;
  } else if (input.field === 'description') {
    cfg.description = input.textBuffer;
  } else if (input.field === 'customBudgetPerNight') {
    cfg.customBudgetPerNight = input.textBuffer;
  } else if (input.field === 'hourlyBudgetPerDay') {
    cfg.hourlyBudgetPerDay = input.textBuffer;
  } else if (input.field === 'hourlyBudgetPerNight') {
    cfg.hourlyBudgetPerNight = input.textBuffer;
  } else if (input.field === 'unlockCost') {
    cfg.unlockCost = input.textBuffer;
    if (state.levelEditorAlmanacProgression) {
      state.levelEditorAlmanacProgression.UnlockCost = parseUnlockCostString(input.textBuffer);
    }
  } else if (input.field === 'startingResource' && input.subKey) {
    const n = parseInt(input.textBuffer, 10);
    cfg.startingResource[input.subKey] = !isNaN(n) ? Math.max(0, n) : 0;
  } else if (input.field === 'star1') {
    if (!cfg.starRatingTargets) cfg.starRatingTargets = {};
    const n = parseInt(input.textBuffer, 10);
    cfg.starRatingTargets.star1 = !isNaN(n) ? Math.max(1, n) : 600;
  } else if (input.field === 'star2') {
    if (!cfg.starRatingTargets) cfg.starRatingTargets = {};
    const n = parseInt(input.textBuffer, 10);
    cfg.starRatingTargets.star2 = !isNaN(n) ? Math.max(1, n) : 300;
  } else if (input.field === 'star3') {
    if (!cfg.starRatingTargets) cfg.starRatingTargets = {};
    const n = parseInt(input.textBuffer, 10);
    cfg.starRatingTargets.star3 = !isNaN(n) ? Math.max(1, n) : 180;
  }
}

export function handleLevelConfigScroll(delta: number): boolean {
  if (!state.isAlmanacOpen || state.almanacTab !== 'LevelConfig') return false;
  state.levelConfigScrollVelocity = (state.levelConfigScrollVelocity || 0) - delta * 0.35;
  return true;
}

import { state } from '../../../state';
import { EditorLevelConfigData, getDynamicEnemyKeys, DEFAULT_CUSTOM_BUDGET_PER_NIGHT, DEFAULT_HOURLY_BUDGET_PER_DAY, DEFAULT_HOURLY_BUDGET_PER_NIGHT, SPAWN_CONFIG_PERIODS, DEFAULT_DAYTIME_WEIGHTS, formatUnlockCostToString, parseUnlockCostString, ALL_CURRENCIES } from './types';
import { handleEnemiesPanelClick } from './enemiesPanel';
import { handleWinConditionsPanelClick, getWinConditionsPanelHeight } from './winConditionsPanel';

declare const textWidth: any;
const totalHeight = 1000;
(window as any).totalHeight = totalHeight;

export function formatGlobalEnemySpawnConfig(raw: any, customEnemyKeys?: string[]): Record<string, Record<string, number>> {
  if (!raw || typeof raw !== 'object') return {};
  const enemyKeys = customEnemyKeys || getDynamicEnemyKeys();
  const result: Record<string, Record<string, number>> = {};

  for (const [period, weights] of Object.entries(raw)) {
    const periodObj: Record<string, number> = {};
    if (Array.isArray(weights)) {
      weights.forEach((w: any, idx: number) => {
        const num = Number(w);
        const eKey = enemyKeys[idx];
        if (eKey && num > 0) {
          periodObj[eKey] = num;
        }
      });
    } else if (weights && typeof weights === 'object') {
      for (const [eKey, w] of Object.entries(weights as Record<string, any>)) {
        const num = Number(w);
        if (num > 0) {
          periodObj[eKey] = num;
        }
      }
    }
    if (Object.keys(periodObj).length > 0) {
      result[period] = periodObj;
    }
  }
  return result;
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

  const enabledCurrencies = Array.isArray(current.enabledCurrency)
    ? [...current.enabledCurrency]
    : ['sun', 'elixir', 'soil'];

  const startRes: Record<string, number> = {};
  for (const c of [
    { key: 'sun' }, { key: 'elixir' }, { key: 'soil' },
    { key: 'raisin' }, { key: 'leaf' }, { key: 'shard' },
    { key: 'shell' }, { key: 'fuel' }, { key: 'ice' }
  ]) {
    startRes[c.key] = current.startingResource?.[c.key] !== undefined
      ? Number(current.startingResource[c.key])
      : (c.key === 'sun' ? 3 : 0);
  }

  const spawnCfg: Record<string, number[]> = {};
  const rawSpawnCfg = current.globalEnemySpawnConfig || current.GlobalEnemySpawnConfig || {};

  for (const period of SPAWN_CONFIG_PERIODS) {
    if (rawSpawnCfg[period] && !Array.isArray(rawSpawnCfg[period]) && typeof rawSpawnCfg[period] === 'object') {
      spawnCfg[period] = allEnemies.map(e => {
        const val = rawSpawnCfg[period][e];
        return typeof val === 'number' ? val : 0;
      });
    } else if (Array.isArray(rawSpawnCfg[period])) {
      spawnCfg[period] = [...rawSpawnCfg[period]];
      while (spawnCfg[period].length < allEnemies.length) {
        spawnCfg[period].push(0);
      }
    } else {
      const defRow = DEFAULT_DAYTIME_WEIGHTS[period] || DEFAULT_DAYTIME_WEIGHTS["5_night"] || {};
      spawnCfg[period] = allEnemies.map(e => {
        if (Array.isArray(defRow)) {
          const idx = allEnemies.indexOf(e);
          return defRow[idx] || 0;
        } else if (defRow && typeof defRow === 'object') {
          return (defRow as Record<string, number>)[e] || 0;
        }
        return 0;
      });
    }
  }

  const rawStarTargets = current.starRatingTargets || {};
  const rawSunInterval = current.sunSpawnHourInterval !== undefined ? current.sunSpawnHourInterval : (current.SunSpawnHourInterval !== undefined ? current.SunSpawnHourInterval : 0.5);

  state.levelEditorLevelConfig = {
    id: current.levelId || current.id || state.currentLevelId || 'editor_custom',
    name: current.levelName || current.name || 'Custom Level',
    description: current['level Description'] || current.levelDescription || current.description || 'Custom level layout created in Level Editor.',
    tag: current.tag || 'CUSTOM MAP',
    sunSpawnHourInterval: String(rawSunInterval),
    customBudgetPerNight: budgetStr,
    hourlyBudgetPerDay: hourlyDayStr,
    hourlyBudgetPerNight: hourlyNightStr,
    unlockCost: '',
    enabledCurrency: enabledCurrencies,
    startingResource: startRes,
    globalEnemySpawnConfig: spawnCfg,
    starRatingTargets: {
      star1: rawStarTargets.star1 !== undefined ? rawStarTargets.star1 : 600,
      star2: rawStarTargets.star2 !== undefined ? rawStarTargets.star2 : 300,
      star3: rawStarTargets.star3 !== undefined ? rawStarTargets.star3 : 180
    },
    nightsToPass: current.nightsToPass !== undefined ? String(current.nightsToPass) : (current.NightsToPass !== undefined ? String(current.NightsToPass) : ''),
    enemyBudgetValueToKill: current.enemyBudgetValueToKill !== undefined ? String(current.enemyBudgetValueToKill) : (current.EnemyBudgetValueToKill !== undefined ? String(current.EnemyBudgetValueToKill) : ''),
    collectResource: parseRecordObj(current.collectResource || current.CollectResource),
    huntEnemy: parseRecordObj(current.huntEnemy || current.HuntEnemy),
    breakObstacle: parseRecordObj(current.breakObstacle || current.BreakObstacle),
    destroyAllEnemySpawners: current.destroyAllEnemySpawners ?? current.DestroyAllEnemySpawners ?? true
  };
}

function parseRecordObj(raw: any): Record<string, number> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const res: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      const num = Number(v);
      if (!isNaN(num) && num > 0) {
        res[k] = num;
      }
    }
    return res;
  }
  if (typeof raw === 'string') {
    return parseRecordString(raw);
  }
  return {};
}

function parseRecordString(str: any): Record<string, number> {
  if (!str) return {};
  if (typeof str === 'object') return { ...str };
  const clean = String(str).trim();
  if (!clean) return {};
  const res: Record<string, number> = {};
  const parts = clean.split(',');
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon !== -1) {
      const k = trimmed.substring(0, colon).trim().toLowerCase();
      const v = parseInt(trimmed.substring(colon + 1).trim(), 10);
      if (k && !isNaN(v) && v > 0) res[k] = v;
    }
  }
  return res;
}

function parseNumberOrArray(strVal: string, fallback: number[]): number | number[] {
  const clean = (strVal || '').replace(/[\[\]]/g, '').trim();
  if (!clean) return [...fallback];
  const parts = clean.split(/[,\s]+/).map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length > 1) return parts;
  if (parts.length === 1) return parts[0];
  return [...fallback];
}

export function serializeLevelEditorLevelConfig(): any {
  if (!state.levelEditorLevelConfig) {
    initLevelEditorLevelConfig();
  }
  if (state.activeLevelConfigInput && state.levelEditorLevelConfig) {
    applyLevelConfigInputBuffer(state.levelEditorLevelConfig, state.activeLevelConfigInput);
  }
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;

  const parsedBudget = parseNumberOrArray(cfg.customBudgetPerNight, DEFAULT_CUSTOM_BUDGET_PER_NIGHT);
  const parsedHourlyDay = parseNumberOrArray(cfg.hourlyBudgetPerDay, DEFAULT_HOURLY_BUDGET_PER_DAY);
  const parsedHourlyNight = parseNumberOrArray(cfg.hourlyBudgetPerNight, DEFAULT_HOURLY_BUDGET_PER_NIGHT);
  const parsedSunInterval = parseFloat(cfg.sunSpawnHourInterval);
  const finalSunInterval = (!isNaN(parsedSunInterval) && parsedSunInterval > 0) ? parsedSunInterval : 0.5;

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
    globalEnemySpawnConfig: formatGlobalEnemySpawnConfig(cfg.globalEnemySpawnConfig || DEFAULT_DAYTIME_WEIGHTS),
    starRatingTargets: {
      star1: cfg.starRatingTargets?.star1 ?? 600,
      star2: cfg.starRatingTargets?.star2 ?? 300,
      star3: cfg.starRatingTargets?.star3 ?? 180
    },
    nightsToPass: cfg.nightsToPass !== undefined && cfg.nightsToPass !== '' ? parseInt(cfg.nightsToPass, 10) : undefined,
    enemyBudgetValueToKill: cfg.enemyBudgetValueToKill !== undefined && cfg.enemyBudgetValueToKill !== '' ? parseInt(cfg.enemyBudgetValueToKill, 10) : undefined,
    collectResource: { ...(cfg.collectResource || {}) },
    huntEnemy: { ...(cfg.huntEnemy || {}) },
    breakObstacle: { ...(cfg.breakObstacle || {}) },
    destroyAllEnemySpawners: cfg.destroyAllEnemySpawners ?? true
  };
}

export function applyLevelConfigInputBuffer(cfg: EditorLevelConfigData, input: any) {
  if (!input || !input.field) return;
  const f = input.field;
  const val = input.textBuffer !== undefined ? input.textBuffer : '';

  if (f.startsWith('res_')) {
    const resKey = f.substring(4);
    const num = parseInt(val, 10);
    cfg.startingResource[resKey] = !isNaN(num) ? Math.max(0, num) : 0;
  } else if (f === 'destroyAllEnemySpawnersStr') {
    cfg.destroyAllEnemySpawners = val.toLowerCase() === 'true' || val === '1';
  } else if (f === 'nightsToPass') {
    cfg.nightsToPass = val;
  } else if (f === 'enemyBudgetValueToKill') {
    cfg.enemyBudgetValueToKill = val;
  } else if (f.startsWith('win_res_')) {
    const key = f.substring(8);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      if (!cfg.collectResource) cfg.collectResource = {};
      cfg.collectResource[key] = num;
    } else if (cfg.collectResource) {
      delete cfg.collectResource[key];
    }
  } else if (f.startsWith('win_hunt_')) {
    const key = f.substring(9);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      if (!cfg.huntEnemy) cfg.huntEnemy = {};
      cfg.huntEnemy[key] = num;
    } else if (cfg.huntEnemy) {
      delete cfg.huntEnemy[key];
    }
  } else if (f.startsWith('win_obs_')) {
    const key = f.substring(8);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      if (!cfg.breakObstacle) cfg.breakObstacle = {};
      cfg.breakObstacle[key] = num;
    } else if (cfg.breakObstacle) {
      delete cfg.breakObstacle[key];
    }
  } else if ((cfg as any)[f] !== undefined) {
    (cfg as any)[f] = val;
  }
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

  const panelW = modalW - 40;
  const panelH = modalH - 70;
  const panelX = 20;
  const panelY = 50;

  const gPanelX = modalX + panelX;
  const gPanelY = modalY + panelY;

  if (mx < gPanelX || mx > gPanelX + panelW || my < gPanelY || my > gPanelY + panelH) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    return false;
  }

  const localX = mx - gPanelX;
  const localY = my - gPanelY;
  const viewY = 16;
  const viewH = panelH - viewY - 12;

  if (localY < viewY || localY > viewY + viewH) {
    return false;
  }

  const scrollY = state.levelConfigScrollY || 0;
  const contentX = localX;
  const contentY = localY - viewY - scrollY;

  const card1W = panelW - 40;
  const card1X = 20;

  // Track layout Y offsets for each section
  let curY = 0;

  // Section 1: Metadata (height 145)
  const card1H = 145;
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + card1H) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    const fieldH = 24;
    const row1Y = curY + 34;
    const col1W = Math.max(120, (card1W - 28 - 20) / 3);

    if (contentY >= row1Y && contentY <= row1Y + fieldH) {
      if (contentX >= card1X + 14 && contentX <= card1X + 14 + col1W) {
        state.activeLevelConfigInput = { field: 'id', textBuffer: cfg.id, cursor: cfg.id.length, selectionStart: 0, selectionEnd: cfg.id.length, isDragging: true };
        return true;
      }
      if (contentX >= card1X + 14 + col1W + 10 && contentX <= card1X + 14 + col1W * 2 + 10) {
        state.activeLevelConfigInput = { field: 'tag', textBuffer: cfg.tag, cursor: cfg.tag.length, selectionStart: 0, selectionEnd: cfg.tag.length, isDragging: true };
        return true;
      }
      if (contentX >= card1X + 14 + (col1W + 10) * 2 && contentX <= card1X + 14 + card1W - 28) {
        state.activeLevelConfigInput = { field: 'sunSpawnHourInterval', textBuffer: cfg.sunSpawnHourInterval, cursor: cfg.sunSpawnHourInterval.length, selectionStart: 0, selectionEnd: cfg.sunSpawnHourInterval.length, isDragging: true };
        return true;
      }
    }

    const row2Y = curY + 68;
    if (contentY >= row2Y && contentY <= row2Y + fieldH && contentX >= card1X + 14 && contentX <= card1X + card1W - 14) {
      state.activeLevelConfigInput = { field: 'name', textBuffer: cfg.name, cursor: cfg.name.length, selectionStart: 0, selectionEnd: cfg.name.length, isDragging: true };
      return true;
    }

    const row3Y = curY + 102;
    if (contentY >= row3Y && contentY <= row3Y + fieldH && contentX >= card1X + 14 && contentX <= card1X + card1W - 14) {
      state.activeLevelConfigInput = { field: 'description', textBuffer: cfg.description, cursor: cfg.description.length, selectionStart: 0, selectionEnd: cfg.description.length, isDragging: true };
      return true;
    }

    return true;
  }
  curY += card1H + 14;

  // Section 2: Wave Configuration & Budgets (height 92)
  const card2H = 92;
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + card2H) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    const fieldH = 24;
    const rowY = curY + 36;
    const colW = (card1W - 28 - 10) / 2;

    if (contentY >= rowY && contentY <= rowY + fieldH) {
      if (contentX >= card1X + 14 && contentX <= card1X + 14 + colW) {
        state.activeLevelConfigInput = { field: 'customBudgetPerNight', textBuffer: cfg.customBudgetPerNight, cursor: cfg.customBudgetPerNight.length, selectionStart: 0, selectionEnd: cfg.customBudgetPerNight.length, isDragging: true };
        return true;
      }
      if (contentX >= card1X + 14 + colW + 10 && contentX <= card1X + card1W - 14) {
        state.activeLevelConfigInput = { field: 'unlockCost', textBuffer: cfg.unlockCost || '', cursor: (cfg.unlockCost || '').length, selectionStart: 0, selectionEnd: (cfg.unlockCost || '').length, isDragging: true };
        return true;
      }
    }
    return true;
  }
  curY += card2H + 14;

  // Win Conditions
  const cardWinH = getWinConditionsPanelHeight(cfg, card1W);
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + cardWinH) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    return handleWinConditionsPanelClick(contentX, contentY, card1X, curY, card1W, cfg);
  }
  curY += cardWinH + 14;

  // Section 3: Enabled Currencies (height 80)
  const card3H = 80;
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + card3H) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    // Handled via UI hitboxes in currencyPanel
    return true;
  }
  curY += card3H + 14;

  // Section 4: Starting Resources (height 265)
  const card4H = 265;
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + card4H) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }

    const resGridStartX = card1X + 14;
    let resGridY = curY + 36;
    const resColW = (card1W - 48) / 3;
    const resItemH = 34;

    ALL_CURRENCIES.forEach((c, i) => {
      const colIdx = i % 3;
      const rowIdx = Math.floor(i / 3);
      const itemX = resGridStartX + colIdx * (resColW + 10);
      const itemY = resGridY + rowIdx * (resItemH + 8);
      const valFieldWidth = 55;
      const valFieldX = itemX + resColW - valFieldWidth - 8;
      const valFieldY = itemY + 5;
      const valFieldH = resItemH - 10;

      if (contentX >= valFieldX && contentX <= valFieldX + valFieldWidth && contentY >= valFieldY && contentY <= valFieldY + valFieldH) {
        const fieldKey = `res_${c.key}`;
        const curValStr = String(cfg.startingResource[c.key] ?? 0);
        state.activeLevelConfigInput = { field: fieldKey, textBuffer: curValStr, cursor: curValStr.length, selectionStart: 0, selectionEnd: curValStr.length, isDragging: true };
      }
    });

    return true;
  }
  curY += card4H + 14;

  // Hourly Budgets (height 80)
  const spawnCardH = 80;
  if (contentX >= card1X && contentX <= card1X + card1W && contentY >= curY && contentY <= curY + spawnCardH) {
    if (state.activeLevelConfigInput) {
      applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
      state.activeLevelConfigInput = null;
    }
    const fieldH = 24;
    const rowY = curY + 36;
    const colW = (card1W - 28 - 10) / 2;

    if (contentY >= rowY && contentY <= rowY + fieldH) {
      if (contentX >= card1X + 14 && contentX <= card1X + 14 + colW) {
        state.activeLevelConfigInput = { field: 'hourlyBudgetPerDay', textBuffer: cfg.hourlyBudgetPerDay, cursor: cfg.hourlyBudgetPerDay.length, selectionStart: 0, selectionEnd: cfg.hourlyBudgetPerDay.length, isDragging: true };
        return true;
      }
      if (contentX >= card1X + 14 + colW + 10 && contentX <= card1X + card1W - 14) {
        state.activeLevelConfigInput = { field: 'hourlyBudgetPerNight', textBuffer: cfg.hourlyBudgetPerNight, cursor: cfg.hourlyBudgetPerNight.length, selectionStart: 0, selectionEnd: cfg.hourlyBudgetPerNight.length, isDragging: true };
        return true;
      }
    }
    return true;
  }
  curY += spawnCardH + 14;

  // Section 5: Global Enemy Spawn Config Matrix
  if (state.activeLevelConfigInput) {
    applyLevelConfigInputBuffer(cfg, state.activeLevelConfigInput);
    state.activeLevelConfigInput = null;
  }

  return handleEnemiesPanelClick(contentX, contentY, card1X, curY, card1W, cfg);
}

export function handleLevelConfigScroll(delta: number): boolean {
  if (!state.isAlmanacOpen || state.almanacTab !== 'LevelConfig') return false;
  state.levelConfigScrollVelocity = (state.levelConfigScrollVelocity || 0) - delta * 0.35;
  return true;
}

export function handleLevelConfigKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (!state.isAlmanacOpen || state.almanacTab !== 'LevelConfig' || !state.activeLevelConfigInput) {
    return false;
  }
  const input = state.activeLevelConfigInput;
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;
  if (!cfg) return false;

  let buf = input.textBuffer || '';
  let cursor = input.cursor !== undefined ? input.cursor : buf.length;
  let sStart = input.selectionStart !== undefined ? input.selectionStart : cursor;
  let sEnd = input.selectionEnd !== undefined ? input.selectionEnd : cursor;

  const minSel = Math.min(sStart, sEnd);
  const maxSel = Math.max(sStart, sEnd);
  const hasSelection = minSel < maxSel;

  if (keyCodeNum === 13 || keyCodeNum === 27) {
    applyLevelConfigInputBuffer(cfg, input);
    state.activeLevelConfigInput = null;
    return true;
  }

  if ((event?.ctrlKey || event?.metaKey) && (keyStr === 'a' || keyStr === 'A' || keyCodeNum === 65)) {
    input.selectionStart = 0;
    input.selectionEnd = buf.length;
    input.cursor = buf.length;
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    if (hasSelection) {
      input.textBuffer = buf.substring(0, minSel) + buf.substring(maxSel);
      input.cursor = minSel;
      input.selectionStart = minSel;
      input.selectionEnd = minSel;
    } else if (cursor > 0) {
      input.textBuffer = buf.substring(0, cursor - 1) + buf.substring(cursor);
      input.cursor = cursor - 1;
      input.selectionStart = cursor - 1;
      input.selectionEnd = cursor - 1;
    }
    return true;
  }

  // Delete
  if (keyCodeNum === 46) {
    if (hasSelection) {
      input.textBuffer = buf.substring(0, minSel) + buf.substring(maxSel);
      input.cursor = minSel;
      input.selectionStart = minSel;
      input.selectionEnd = minSel;
    } else if (cursor < buf.length) {
      input.textBuffer = buf.substring(0, cursor) + buf.substring(cursor + 1);
    }
    return true;
  }

  if (keyStr && keyStr.length === 1 && keyCodeNum >= 32 && !(event?.ctrlKey || event?.metaKey)) {
    if (hasSelection) {
      input.textBuffer = buf.substring(0, minSel) + keyStr + buf.substring(maxSel);
      input.cursor = minSel + 1;
      input.selectionStart = minSel + 1;
      input.selectionEnd = minSel + 1;
    } else {
      input.textBuffer = buf.substring(0, cursor) + keyStr + buf.substring(cursor);
      input.cursor = cursor + 1;
      input.selectionStart = cursor + 1;
      input.selectionEnd = cursor + 1;
    }
    return true;
  }

  return false;
}

export function syncLevelConfigToLayoutData() {
  if (!state.levelEditorLevelConfig) return;
  const serialized = serializeLevelEditorLevelConfig();
  if (!state.currentLevelLayoutData) {
    state.currentLevelLayoutData = {};
  }
  Object.assign(state.currentLevelLayoutData, serialized);
}


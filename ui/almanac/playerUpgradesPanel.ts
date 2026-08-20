import { state } from '../../state';
import { 
  DEFAULT_PLAYER_UPGRADE_CONFIGS, 
  getPlayerUpgradeInfo, 
  purchasePlayerUpgrade 
} from '../../src/playerUpgrades';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const rectMode: any;
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
declare const frameCount: any;
declare const ellipse: any;
declare const sin: any;
declare const scale: any;

export const UPGRADE_KEYS = ['turretAttachCapacity', 'sunBankCapacity', 'magnetRadius', 'damageMultAdd'];

export interface EditorPlayerUpgradeEntry {
  statStr: string;
  costStr: string;
  values?: number[];
  costs?: number[];
}

/**
 * Initializes or refreshes the LevelEditor player upgrades state from level layout data or clean defaults.
 */
export function initLevelEditorPlayerUpgradesFromData(layoutData?: any) {
  if (!state.levelEditorPlayerUpgrades) {
    state.levelEditorPlayerUpgrades = {};
  }

  // If layoutData is explicitly provided (e.g. from level import or startLevelEditor)
  if (layoutData !== undefined) {
    for (const key of UPGRADE_KEYS) {
      const raw = layoutData?.[key];
      if (raw) {
        const statStr = Array.isArray(raw.values) ? raw.values.join(', ') : (raw.values != null ? String(raw.values) : '');
        const costStr = Array.isArray(raw.costs) ? raw.costs.join(', ') : (raw.costs != null ? String(raw.costs) : '');
        state.levelEditorPlayerUpgrades[key] = {
          statStr,
          costStr,
          values: Array.isArray(raw.values) && raw.values.length > 0 ? [...raw.values] : undefined,
          costs: Array.isArray(raw.costs) && raw.costs.length > 0 ? [...raw.costs] : undefined
        };
      } else {
        state.levelEditorPlayerUpgrades[key] = {
          statStr: '',
          costStr: '',
          values: undefined,
          costs: undefined
        };
      }
    }
  } else {
    // If layoutData is undefined, just make sure each key has an entry without wiping session edits
    for (const key of UPGRADE_KEYS) {
      if (!state.levelEditorPlayerUpgrades[key]) {
        state.levelEditorPlayerUpgrades[key] = {
          statStr: '',
          costStr: '',
          values: undefined,
          costs: undefined
        };
      }
    }
  }
}

/**
 * Parses user-typed strings for an upgrade track into numeric values/costs arrays.
 */
export function parseAndSyncPlayerUpgrade(key: string) {
  if (!state.levelEditorPlayerUpgrades) return;
  const entry = state.levelEditorPlayerUpgrades[key];
  if (!entry) return;

  // 1. Parse Stat string
  const statClean = entry.statStr.replace(/[\[\]"']/g, '').trim();
  if (statClean.length > 0) {
    const tokens = statClean.split(',').map((s: string) => s.trim().replace(/%/g, '')).filter((s: string) => s.length > 0);
    const nums = tokens.map((s: string) => parseFloat(s)).filter((n: number) => !isNaN(n));
    entry.values = nums.length > 0 ? nums : undefined;
  } else {
    entry.values = undefined;
  }

  // 2. Parse Cost string
  const costClean = entry.costStr.replace(/[\[\]"']/g, '').trim();
  if (costClean.length > 0) {
    const tokens = costClean.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const nums = tokens.map((s: string) => parseFloat(s)).filter((n: number) => !isNaN(n));
    entry.costs = nums.length > 0 ? nums : undefined;
  } else {
    entry.costs = undefined;
  }
}

/**
 * Serializes custom player upgrade overrides for LevelData output.
 */
export function serializeLevelEditorPlayerUpgrades(): Record<string, any> | undefined {
  if (!state.levelEditorPlayerUpgrades) return undefined;
  const result: Record<string, any> = {};
  let hasAny = false;

  for (const key of UPGRADE_KEYS) {
    const entry = state.levelEditorPlayerUpgrades[key];
    if (entry) {
      parseAndSyncPlayerUpgrade(key);
      const out: any = {};
      if (entry.values && entry.values.length > 0) {
        out.values = [...entry.values];
        hasAny = true;
      }
      if (entry.costs && entry.costs.length > 0) {
        out.costs = [...entry.costs];
        hasAny = true;
      }
      if (Object.keys(out).length > 0) {
        result[key] = out;
      }
    }
  }

  return hasAny ? result : undefined;
}

export function drawPlayerUpgradesPanel(x: number, y: number, w: number, h: number, modalX: number, modalY: number) {
  push();
  translate(x, y);

  // Background Container
  fill(15, 18, 35, 180);
  noStroke();
  rect(0, 0, w, h, 24);

  if (state.isAlmanacEditorMode) {
    drawEditorUpgradesPanel(w, h, modalX + x, modalY + y);
  } else {
    drawGameplayUpgradesPanel(w, h, modalX + x, modalY + y);
  }

  pop();
}

/**
 * Normal Gameplay Mode: Upgrades purchasing and stats progression.
 */
function drawGameplayUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  // Title (Top Center)
  fill(255, 215, 60);
  textAlign(CENTER, TOP);
  textSize(22);
  text("Player Upgrades", w / 2, 14);

  // Center: Player Character
  const playerCenterX = w / 2;
  const playerCenterY = h / 2 + 10;

  push();
  // Player Shadow
  noStroke();
  fill(0, 0, 0, 90);
  ellipse(playerCenterX, playerCenterY + 58, 65, 22);

  // Player Sprite with subtle breathing
  translate(playerCenterX, playerCenterY);
  const breatheRate = 0.08;
  const breatheAmp = 0.03;
  const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
  const animScaleX = 1.0 / animScaleY;
  scale(animScaleX * 1.7, animScaleY * 1.7);

  imageMode(CENTER);
  const playerSprite = state.assets['img_player_front_right'];
  if (playerSprite) {
    image(playerSprite, 0, 0, 120, 120);
  }
  pop();

  // 4 Upgrade Panels on the sides (matching TurretInfoPanel style)
  const marginSide = 20;
  const marginTop = 48;
  const marginBottom = 16;
  const centerGap = 160;
  const cardW = (w - marginSide * 2 - centerGap) / 2;
  const cardH = (h - marginTop - marginBottom - 14) / 2;

  const leftColX = marginSide;
  const rightColX = w - marginSide - cardW;
  const topRowY = marginTop;
  const bottomRowY = topRowY + cardH + 14;

  const cardPositions = [
    { x: leftColX, y: topRowY },
    { x: leftColX, y: bottomRowY },
    { x: rightColX, y: topRowY },
    { x: rightColX, y: bottomRowY }
  ];

  for (let i = 0; i < UPGRADE_KEYS.length; i++) {
    const key = UPGRADE_KEYS[i];
    const pos = cardPositions[i];
    drawGameplayUpgradeCard(pos.x, pos.y, cardW, cardH, key, globalPanelX, globalPanelY);
  }
}

/**
 * Level Editor Mode: Editable strings for Stats and Costs.
 */
function drawEditorUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  initLevelEditorPlayerUpgradesFromData();

  // Header Banner
  const bannerX = 24;
  const bannerY = 16;
  const bannerW = w - 48;
  const bannerH = 36;

  push();
  fill(12, 15, 30, 230);
  stroke(100, 70, 180);
  strokeWeight(1.5);
  rect(bannerX, bannerY, bannerW, bannerH, 8);
  noStroke();

  fill(255, 230, 120);
  textAlign(LEFT, CENTER);
  textSize(12);
  text("PLAYER UPGRADE CONFIG: Edit Stats and Costs (leave blank for default)", bannerX + 14, bannerY + bannerH / 2);

  // "RESET ALL DEFAULTS" button in header
  const resetAllW = 145;
  const resetAllH = 26;
  const resetAllX = bannerW - resetAllW - 6;
  const resetAllY = (bannerH - resetAllH) / 2;
  const isResetAllHov = mouseX >= globalPanelX + bannerX + resetAllX && mouseX <= globalPanelX + bannerX + resetAllX + resetAllW &&
                         mouseY >= globalPanelY + bannerY + resetAllY && mouseY <= globalPanelY + bannerY + resetAllY + resetAllH;

  fill(isResetAllHov ? [75, 45, 110] : [45, 32, 75]);
  stroke(isResetAllHov ? [180, 130, 240] : [100, 75, 150]);
  strokeWeight(1);
  rect(bannerX + resetAllX, bannerY + resetAllY, resetAllW, resetAllH, 6);
  noStroke();
  fill(isResetAllHov ? [255, 245, 255] : [210, 190, 240]);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("RESET ALL TO DEFAULT", bannerX + resetAllX + resetAllW / 2, bannerY + resetAllY + resetAllH / 2);
  pop();

  // Grid layout for 4 editable upgrade cards
  const gridStartX = 24;
  const gridStartY = 64;
  const gridW = w - 48;
  const cardGap = 14;
  const cardW = (gridW - cardGap) / 2;
  const cardH = (h - gridStartY - 18 - cardGap) / 2;

  for (let i = 0; i < UPGRADE_KEYS.length; i++) {
    const key = UPGRADE_KEYS[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = gridStartX + col * (cardW + cardGap);
    const cardY = gridStartY + row * (cardH + cardGap);

    drawEditorUpgradeCard(cardX, cardY, cardW, cardH, key, globalPanelX, globalPanelY);
  }
}

/**
 * Calculates character index in text based on horizontal pixel click offset.
 */
function getCharIndexFromClick(relX: number, str: string): number {
  if (!str || str.length === 0 || relX <= 8) return 0;
  let totalW = 8;
  for (let i = 0; i < str.length; i++) {
    const charW = textWidth(str[i]);
    if (relX < totalW + charW / 2) {
      return i;
    }
    totalW += charW;
  }
  return str.length;
}

function drawEditorUpgradeCard(
  cx: number, cy: number, cw: number, ch: number,
  key: string, globalPanelX: number, globalPanelY: number
) {
  const defaultCfg = DEFAULT_PLAYER_UPGRADE_CONFIGS[key];
  const editorEntry = (state.levelEditorPlayerUpgrades && state.levelEditorPlayerUpgrades[key]) || {
    statStr: '',
    costStr: '',
    values: undefined,
    costs: undefined
  };

  const hasCustom = (editorEntry.statStr && editorEntry.statStr.trim().length > 0) ||
                    (editorEntry.costStr && editorEntry.costStr.trim().length > 0);

  const cardGlobalX = globalPanelX + cx;
  const cardGlobalY = globalPanelY + cy;

  push();
  translate(cx, cy);

  // Card background
  fill(20, 24, 48);
  stroke(hasCustom ? [90, 80, 140] : [45, 52, 95]);
  strokeWeight(hasCustom ? 2 : 1.5);
  rect(0, 0, cw, ch, 12);

  // 1. Header: Icon + Title (Clear button removed)
  const iconSize = 28;
  const iconX = 14;
  const iconY = 10;

  fill(12, 14, 28);
  noStroke();
  rect(iconX, iconY, iconSize, iconSize, 6);

  const asset = state.assets[defaultCfg?.icon] || state.assets['img_basic'];
  if (asset) {
    imageMode(CENTER);
    image(asset, iconX + iconSize / 2, iconY + iconSize / 2, 22, 22);
  }

  // Name
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(13.5);
  text(defaultCfg?.name || key, iconX + iconSize + 10, iconY + iconSize / 2);

  // 2. Line 1: StatLevel
  const labelX = 14;
  const statRowY = 46;
  const fieldH = 24;
  const labelW = 82;
  const fieldX = labelX + labelW;
  const fieldW = cw - fieldX - 14;

  fill(180, 195, 230);
  textAlign(LEFT, CENTER);
  textSize(11.5);
  text("StatLevel:", labelX, statRowY + fieldH / 2);

  const isStatActive = state.activePlayerUpgradeInput?.key === key && state.activePlayerUpgradeInput?.field === 'stat';
  const isStatHov = mouseX >= cardGlobalX + fieldX && mouseX <= cardGlobalX + fieldX + fieldW &&
                    mouseY >= cardGlobalY + statRowY && mouseY <= cardGlobalY + statRowY + fieldH;

  fill(isStatActive ? [10, 13, 26] : (isStatHov ? [16, 20, 42] : [13, 16, 34]));
  stroke(isStatActive ? [80, 200, 255] : (isStatHov ? [80, 100, 160] : [45, 55, 95]));
  strokeWeight(isStatActive ? 2 : 0);
  rect(fieldX, statRowY, fieldW, fieldH, 5);
  noStroke();

  // Draw Stat Field Content
  const statStr = editorEntry.statStr || '';
  textSize(11);
  textAlign(LEFT, CENTER);

  if (isStatActive) {
    // Handle live mouse drag within this focused field
    if (mouseIsPressed && state.activePlayerUpgradeInput?.isDragging) {
      const relX = mouseX - (cardGlobalX + fieldX);
      const dragIdx = getCharIndexFromClick(relX, statStr);
      state.activePlayerUpgradeInput.selectionEnd = dragIdx;
      state.activePlayerUpgradeInput.cursor = dragIdx;
    }

    const cur = Math.max(0, Math.min(statStr.length, state.activePlayerUpgradeInput.cursor ?? statStr.length));
    const sStart = Math.max(0, Math.min(statStr.length, state.activePlayerUpgradeInput.selectionStart ?? cur));
    const sEnd = Math.max(0, Math.min(statStr.length, state.activePlayerUpgradeInput.selectionEnd ?? cur));
    const selMin = Math.min(sStart, sEnd);
    const selMax = Math.max(sStart, sEnd);

    // Draw selection highlight
    if (selMin < selMax) {
      const x1 = fieldX + 8 + textWidth(statStr.slice(0, selMin));
      const x2 = fieldX + 8 + textWidth(statStr.slice(0, selMax));
      fill(50, 120, 220, 160);
      rect(x1, statRowY + 3, x2 - x1, fieldH - 6, 2);
    }

    if (statStr.length > 0) {
      fill(255);
      text(statStr, fieldX + 8, statRowY + fieldH / 2);
    }

    // Draw blinking cursor if no multi-character selection
    if (selMin === selMax) {
      const showCursor = floor(frameCount / 20) % 2 === 0;
      if (showCursor) {
        const curX = fieldX + 8 + textWidth(statStr.slice(0, cur));
        fill(80, 200, 255);
        rect(curX, statRowY + 4, 2, fieldH - 8, 1);
      }
    }
  } else {
    if (statStr.length > 0) {
      fill(255);
      text(statStr, fieldX + 8, statRowY + fieldH / 2);
    } else {
      const defaultStatStr = defaultCfg.values.join(', ');
      fill(90, 105, 135);
      text(`${defaultStatStr}`, fieldX + 8, statRowY + fieldH / 2);
    }
  }

  // 3. Line 2: UpgradeCost
  const costRowY = 78;

  fill(180, 195, 230);
  textAlign(LEFT, CENTER);
  textSize(11.5);
  text("UpgradeCost:", labelX, costRowY + fieldH / 2);

  const isCostActive = state.activePlayerUpgradeInput?.key === key && state.activePlayerUpgradeInput?.field === 'cost';
  const isCostHov = mouseX >= cardGlobalX + fieldX && mouseX <= cardGlobalX + fieldX + fieldW &&
                    mouseY >= cardGlobalY + costRowY && mouseY <= cardGlobalY + costRowY + fieldH;

  fill(isCostActive ? [10, 13, 26] : (isCostHov ? [16, 20, 42] : [13, 16, 34]));
  stroke(isCostActive ? [80, 200, 255] : (isCostHov ? [80, 100, 160] : [45, 55, 95]));
  strokeWeight(isCostActive ? 2 : 0);
  rect(fieldX, costRowY, fieldW, fieldH, 5);
  noStroke();

  // Draw Cost Field Content
  const costStr = editorEntry.costStr || '';
  textSize(11);
  textAlign(LEFT, CENTER);

  if (isCostActive) {
    // Handle live mouse drag within this focused field
    if (mouseIsPressed && state.activePlayerUpgradeInput?.isDragging) {
      const relX = mouseX - (cardGlobalX + fieldX);
      const dragIdx = getCharIndexFromClick(relX, costStr);
      state.activePlayerUpgradeInput.selectionEnd = dragIdx;
      state.activePlayerUpgradeInput.cursor = dragIdx;
    }

    const cur = Math.max(0, Math.min(costStr.length, state.activePlayerUpgradeInput.cursor ?? costStr.length));
    const sStart = Math.max(0, Math.min(costStr.length, state.activePlayerUpgradeInput.selectionStart ?? cur));
    const sEnd = Math.max(0, Math.min(costStr.length, state.activePlayerUpgradeInput.selectionEnd ?? cur));
    const selMin = Math.min(sStart, sEnd);
    const selMax = Math.max(sStart, sEnd);

    // Draw selection highlight
    if (selMin < selMax) {
      const x1 = fieldX + 8 + textWidth(costStr.slice(0, selMin));
      const x2 = fieldX + 8 + textWidth(costStr.slice(0, selMax));
      fill(50, 120, 220, 160);
      rect(x1, costRowY + 3, x2 - x1, fieldH - 6, 2);
    }

    if (costStr.length > 0) {
      fill(255);
      text(costStr, fieldX + 8, costRowY + fieldH / 2);
    }

    // Draw blinking cursor if no multi-character selection
    if (selMin === selMax) {
      const showCursor = floor(frameCount / 20) % 2 === 0;
      if (showCursor) {
        const curX = fieldX + 8 + textWidth(costStr.slice(0, cur));
        fill(80, 200, 255);
        rect(curX, costRowY + 4, 2, fieldH - 8, 1);
      }
    }
  } else {
    if (costStr.length > 0) {
      fill(255);
      text(costStr, fieldX + 8, costRowY + fieldH / 2);
    } else {
      const defaultCostStr = defaultCfg.costs.join(', ');
      fill(90, 105, 135);
      text(`${defaultCostStr}`, fieldX + 8, costRowY + fieldH / 2);
    }
  }

  pop();
}

function drawGameplayUpgradeCard(
  cx: number, cy: number, cw: number, ch: number, 
  upgradeKey: string, globalPanelX: number, globalPanelY: number
) {
  const info = getPlayerUpgradeInfo(upgradeKey);
  const cardGlobalX = globalPanelX + cx;
  const cardGlobalY = globalPanelY + cy;

  const isCardHovered = mouseX >= cardGlobalX && mouseX <= cardGlobalX + cw &&
                       mouseY >= cardGlobalY && mouseY <= cardGlobalY + ch;

  push();
  translate(cx, cy);

  // 1. Card Container: Outline ONLY shows up on hover
  fill(12, 45, 30);
  if (isCardHovered) {
    stroke(45, 110, 75);
    strokeWeight(4);
  } else {
    noStroke();
  }
  rect(0, 0, cw, ch, 18);

  // 2. Icon frame (Top Left)
  const iconSize = 46;
  const iconX = 14;
  const iconY = 14;
  fill(8, 28, 18);
  noStroke();
  rect(iconX, iconY, iconSize, iconSize, 12);

  const asset = state.assets[info.config.icon] || state.assets['img_basic'];
  if (asset) {
    imageMode(CENTER);
    image(asset, iconX + iconSize / 2, iconY + iconSize / 2, 34, 34);
  }

  // 3. Title & Description
  const textX = iconX + iconSize + 12;
  const textW = cw - textX - 14;

  fill(255, 215, 60);
  textAlign(LEFT, TOP);
  textSize(14.5);
  text(info.config.name, textX, iconY + 2);

  fill(235, 240, 245);
  textSize(10.5);
  text(info.config.description, textX, iconY + 22, textW, 36);

  // 4. Segmented Level Progression Pips
  const pipsStartX = 14;
  const pipsY = iconY + iconSize + 14;
  const totalPips = info.maxLevel;
  const pipGap = 5;
  const availablePipsWidth = cw - 28;
  const pipW = totalPips > 0 ? (availablePipsWidth - (totalPips - 1) * pipGap) / totalPips : 0;
  const pipH = 7;

  if (totalPips > 0) {
    for (let p = 0; p < totalPips; p++) {
      const px = pipsStartX + p * (pipW + pipGap);
      const isFilled = p < info.currentLevel;
      if (isFilled) {
        fill(255, 195, 25);
      } else {
        fill(16, 65, 48);
      }
      noStroke();
      rect(px, pipsY, pipW, pipH, 3.5);
    }
  }

  // 5. Bottom Row: Stat on Left, Upgrade Button on Right
  const bottomY = ch - 42;
  const statCenterY = bottomY + 14;

  textAlign(LEFT, CENTER);
  if (info.isMax) {
    fill(255);
    textSize(13);
    const valText = info.config.statFormat(info.currVal);
    text(valText, 14, statCenterY);
    fill(80, 245, 165);
    text(" (MAX)", 14 + textWidth(valText), statCenterY);
  } else {
    fill(255);
    textSize(12.5);
    const curValText = info.config.statFormat(info.currVal);
    text(curValText, 14, statCenterY);
    const curW = textWidth(curValText);

    fill(80, 245, 165);
    text(" → ", 14 + curW, statCenterY);
    const arrowW = textWidth(" → ");

    const nextValText = info.config.statFormat(info.nextVal);
    text(nextValText, 14 + curW + arrowW, statCenterY);
  }

  // Upgrade Button (Right) - Only render if not maxed
  if (!info.isMax) {
    const btnW = 126;
    const btnH = 32;
    const btnCenterX = cw - btnW / 2 - 14;
    const btnCenterY = bottomY + btnH / 2;
    const btnGlobalCenterX = cardGlobalX + btnCenterX;
    const btnGlobalCenterY = cardGlobalY + btnCenterY;

    const isBtnHovered = mouseX >= btnGlobalCenterX - btnW / 2 && mouseX <= btnGlobalCenterX + btnW / 2 &&
                         mouseY >= btnGlobalCenterY - btnH / 2 && mouseY <= btnGlobalCenterY + btnH / 2;

    push();
    translate(btnCenterX, btnCenterY);
    rectMode(CENTER);

    // 3D Shadow
    noStroke();
    fill(0, 0, 0, 225);
    rect(0, 4, btnW, btnH, 12);

    // 3D Bevel base
    if (!info.canAfford) {
      fill(80, 80, 80);
    } else {
      fill(isBtnHovered ? [230, 225, 100] : [255, 132, 0]);
    }
    rect(0, 0, btnW, btnH, 12);

    // 3D Top face
    if (!info.canAfford) {
      fill(100, 100, 100);
    } else {
      fill(isBtnHovered ? [255, 132, 0] : [255, 195, 0]);
    }
    rect(0, -4, btnW, btnH - 4, 12);

    // "UPGRADE" Text
    fill(info.canAfford ? 0 : 220);
    textAlign(LEFT, CENTER);
    textSize(12);
    text("UPGRADE", -btnW / 2 + 10, -2);

    // Elixir Icon + Cost
    const curIcon = state.assets['img_icon_elixir'];
    if (curIcon) {
      imageMode(CENTER);
      image(curIcon, btnW / 2 - 38, -2, 24, 24);
    }

    fill(info.canAfford ? 0 : [255, 100, 100]);
    textAlign(LEFT, CENTER);
    textSize(12.5);
    text(`${info.cost}`, btnW / 2 - 25, -2);

    pop();
  }

  pop();
}

/**
 * Handles mouse clicks inside the Player Upgrades panel.
 */
export function handlePlayerUpgradesClick(mx: number, my: number, modalX: number, modalY: number, modalW: number, modalH: number): boolean {
  const panelX = 20;
  const panelY = 50;
  const panelW = modalW - 40;
  const panelH = modalH - 70;

  const globalPanelX = modalX + panelX;
  const globalPanelY = modalY + panelY;

  // Editor mode clicks
  if (state.isAlmanacEditorMode) {
    initLevelEditorPlayerUpgradesFromData();

    // 1. Check "RESET ALL TO DEFAULT" in header banner
    const bannerX = 24;
    const bannerY = 16;
    const bannerW = panelW - 48;
    const bannerH = 36;
    const resetAllW = 145;
    const resetAllH = 26;
    const resetAllX = bannerW - resetAllW - 6;
    const resetAllY = (bannerH - resetAllH) / 2;

    const resetAllGX = globalPanelX + bannerX + resetAllX;
    const resetAllGY = globalPanelY + bannerY + resetAllY;
    if (mx >= resetAllGX && mx <= resetAllGX + resetAllW && my >= resetAllGY && my <= resetAllGY + resetAllH) {
      for (const key of UPGRADE_KEYS) {
        if (state.levelEditorPlayerUpgrades[key]) {
          state.levelEditorPlayerUpgrades[key].statStr = '';
          state.levelEditorPlayerUpgrades[key].costStr = '';
          state.levelEditorPlayerUpgrades[key].values = undefined;
          state.levelEditorPlayerUpgrades[key].costs = undefined;
        }
      }
      state.activePlayerUpgradeInput = null;
      return true;
    }

    // 2. Check individual cards
    const gridStartX = 24;
    const gridStartY = 64;
    const gridW = panelW - 48;
    const cardGap = 14;
    const cardW = (gridW - cardGap) / 2;
    const cardH = (panelH - gridStartY - 18 - cardGap) / 2;

    let clickedInputField = false;

    for (let i = 0; i < UPGRADE_KEYS.length; i++) {
      const key = UPGRADE_KEYS[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = gridStartX + col * (cardW + cardGap);
      const cardY = gridStartY + row * (cardH + cardGap);

      const cardGX = globalPanelX + cardX;
      const cardGY = globalPanelY + cardY;

      const editorEntry = state.levelEditorPlayerUpgrades[key] || { statStr: '', costStr: '' };

      const labelX = 14;
      const labelW = 82;
      const fieldX = labelX + labelW;
      const fieldW = cardW - fieldX - 14;
      const fieldH = 24;

      // Check Stat Input Box
      const statRowY = 46;
      const statGX = cardGX + fieldX;
      const statGY = cardGY + statRowY;
      if (mx >= statGX && mx <= statGX + fieldW && my >= statGY && my <= statGY + fieldH) {
        const relX = mx - statGX;
        const charIdx = getCharIndexFromClick(relX, editorEntry.statStr || '');
        state.activePlayerUpgradeInput = {
          key,
          field: 'stat',
          cursor: charIdx,
          selectionStart: charIdx,
          selectionEnd: charIdx,
          isDragging: true
        };
        clickedInputField = true;
        return true;
      }

      // Check Cost Input Box
      const costRowY = 78;
      const costGX = cardGX + fieldX;
      const costGY = cardGY + costRowY;
      if (mx >= costGX && mx <= costGX + fieldW && my >= costGY && my <= costGY + fieldH) {
        const relX = mx - costGX;
        const charIdx = getCharIndexFromClick(relX, editorEntry.costStr || '');
        state.activePlayerUpgradeInput = {
          key,
          field: 'cost',
          cursor: charIdx,
          selectionStart: charIdx,
          selectionEnd: charIdx,
          isDragging: true
        };
        clickedInputField = true;
        return true;
      }
    }

    if (!clickedInputField) {
      state.activePlayerUpgradeInput = null;
    }
    return true;
  }

  // Normal gameplay mode clicks
  const marginSide = 20;
  const marginTop = 48;
  const marginBottom = 16;
  const centerGap = 160;
  const cardW = (panelW - marginSide * 2 - centerGap) / 2;
  const cardH = (panelH - marginTop - marginBottom - 14) / 2;

  const leftColX = marginSide;
  const rightColX = panelW - marginSide - cardW;
  const topRowY = marginTop;
  const bottomRowY = topRowY + cardH + 14;

  const cardPositions = [
    { x: leftColX, y: topRowY },
    { x: leftColX, y: bottomRowY },
    { x: rightColX, y: topRowY },
    { x: rightColX, y: bottomRowY }
  ];

  for (let i = 0; i < UPGRADE_KEYS.length; i++) {
    const key = UPGRADE_KEYS[i];
    const pos = cardPositions[i];
    const cardGlobalX = globalPanelX + pos.x;
    const cardGlobalY = globalPanelY + pos.y;

    if (mx >= cardGlobalX && mx <= cardGlobalX + cardW && my >= cardGlobalY && my <= cardGlobalY + cardH) {
      purchasePlayerUpgrade(key);
      return true;
    }
  }

  return true;
}

/**
 * Handles mouse drag for text highlighting when an upgrade input field is focused.
 */
export function handlePlayerUpgradeMouseDrag(mx: number, my: number) {
  if (!state.activePlayerUpgradeInput || !state.activePlayerUpgradeInput.isDragging) return;
  const { key: uKey, field } = state.activePlayerUpgradeInput;
  const entry = state.levelEditorPlayerUpgrades?.[uKey];
  const str = (field === 'stat' ? entry?.statStr : entry?.costStr) || '';
  
  // Note: drawEditorUpgradeCard handles per-frame drag while mouseIsPressed
}

export function handlePlayerUpgradeMouseRelease() {
  if (state.activePlayerUpgradeInput) {
    state.activePlayerUpgradeInput.isDragging = false;
  }
}

/**
 * Handles keyboard typing, cursor navigation, range selection, deletion, and insertion.
 */
export function handlePlayerUpgradeKeyInput(inputKey: string, keyCode: number, event?: any): boolean {
  if (!state.isAlmanacOpen || state.almanacTab !== 'Upgrades' || !state.isAlmanacEditorMode) {
    return false;
  }

  if (!state.activePlayerUpgradeInput) {
    return false;
  }

  const { key: uKey, field } = state.activePlayerUpgradeInput;
  if (!state.levelEditorPlayerUpgrades[uKey]) {
    state.levelEditorPlayerUpgrades[uKey] = { statStr: '', costStr: '', values: undefined, costs: undefined };
  }

  const entry = state.levelEditorPlayerUpgrades[uKey];
  const str = (field === 'stat' ? entry.statStr : entry.costStr) || '';

  // Clamp selection and cursor
  let cur = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.cursor ?? str.length));
  let sStart = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.selectionStart ?? cur));
  let sEnd = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.selectionEnd ?? cur));
  const selMin = Math.min(sStart, sEnd);
  const selMax = Math.max(sStart, sEnd);
  const hasSelection = selMin < selMax;

  // 1. Escape or Enter to finish editing
  if (keyCode === 27 || keyCode === 13) {
    parseAndSyncPlayerUpgrade(uKey);
    state.activePlayerUpgradeInput = null;
    return true;
  }

  // 2. Tab to cycle to next input field (and select all)
  if (keyCode === 9) {
    parseAndSyncPlayerUpgrade(uKey);
    const keyIdx = UPGRADE_KEYS.indexOf(uKey);
    if (field === 'stat') {
      const nextStr = entry.costStr || '';
      state.activePlayerUpgradeInput = {
        key: uKey,
        field: 'cost',
        cursor: nextStr.length,
        selectionStart: 0,
        selectionEnd: nextStr.length
      };
    } else {
      const nextKey = UPGRADE_KEYS[(keyIdx + 1) % UPGRADE_KEYS.length];
      const nextStr = state.levelEditorPlayerUpgrades[nextKey]?.statStr || '';
      state.activePlayerUpgradeInput = {
        key: nextKey,
        field: 'stat',
        cursor: nextStr.length,
        selectionStart: 0,
        selectionEnd: nextStr.length
      };
    }
    return true;
  }

  // 3. Select All (Ctrl+A or Cmd+A)
  if ((event?.ctrlKey || event?.metaKey) && (inputKey === 'a' || inputKey === 'A' || keyCode === 65)) {
    state.activePlayerUpgradeInput.selectionStart = 0;
    state.activePlayerUpgradeInput.selectionEnd = str.length;
    state.activePlayerUpgradeInput.cursor = str.length;
    return true;
  }

  // 4. Left Arrow
  if (keyCode === 37) {
    if (event?.shiftKey) {
      const next = Math.max(0, sEnd - 1);
      state.activePlayerUpgradeInput.selectionEnd = next;
      state.activePlayerUpgradeInput.cursor = next;
    } else {
      const target = hasSelection ? selMin : Math.max(0, cur - 1);
      state.activePlayerUpgradeInput.cursor = target;
      state.activePlayerUpgradeInput.selectionStart = target;
      state.activePlayerUpgradeInput.selectionEnd = target;
    }
    return true;
  }

  // 5. Right Arrow
  if (keyCode === 39) {
    if (event?.shiftKey) {
      const next = Math.min(str.length, sEnd + 1);
      state.activePlayerUpgradeInput.selectionEnd = next;
      state.activePlayerUpgradeInput.cursor = next;
    } else {
      const target = hasSelection ? selMax : Math.min(str.length, cur + 1);
      state.activePlayerUpgradeInput.cursor = target;
      state.activePlayerUpgradeInput.selectionStart = target;
      state.activePlayerUpgradeInput.selectionEnd = target;
    }
    return true;
  }

  // 6. Home
  if (keyCode === 36) {
    if (event?.shiftKey) {
      state.activePlayerUpgradeInput.selectionEnd = 0;
      state.activePlayerUpgradeInput.cursor = 0;
    } else {
      state.activePlayerUpgradeInput.cursor = 0;
      state.activePlayerUpgradeInput.selectionStart = 0;
      state.activePlayerUpgradeInput.selectionEnd = 0;
    }
    return true;
  }

  // 7. End
  if (keyCode === 35) {
    if (event?.shiftKey) {
      state.activePlayerUpgradeInput.selectionEnd = str.length;
      state.activePlayerUpgradeInput.cursor = str.length;
    } else {
      state.activePlayerUpgradeInput.cursor = str.length;
      state.activePlayerUpgradeInput.selectionStart = str.length;
      state.activePlayerUpgradeInput.selectionEnd = str.length;
    }
    return true;
  }

  // 8. Backspace
  if (keyCode === 8) {
    let newStr = str;
    let newCur = cur;
    if (hasSelection) {
      newStr = str.slice(0, selMin) + str.slice(selMax);
      newCur = selMin;
    } else if (cur > 0) {
      newStr = str.slice(0, cur - 1) + str.slice(cur);
      newCur = cur - 1;
    }
    if (field === 'stat') entry.statStr = newStr;
    else entry.costStr = newStr;

    state.activePlayerUpgradeInput.cursor = newCur;
    state.activePlayerUpgradeInput.selectionStart = newCur;
    state.activePlayerUpgradeInput.selectionEnd = newCur;
    parseAndSyncPlayerUpgrade(uKey);
    return true;
  }

  // 9. Delete
  if (keyCode === 46) {
    let newStr = str;
    let newCur = cur;
    if (hasSelection) {
      newStr = str.slice(0, selMin) + str.slice(selMax);
      newCur = selMin;
    } else if (cur < str.length) {
      newStr = str.slice(0, cur) + str.slice(cur + 1);
      newCur = cur;
    }
    if (field === 'stat') entry.statStr = newStr;
    else entry.costStr = newStr;

    state.activePlayerUpgradeInput.cursor = newCur;
    state.activePlayerUpgradeInput.selectionStart = newCur;
    state.activePlayerUpgradeInput.selectionEnd = newCur;
    parseAndSyncPlayerUpgrade(uKey);
    return true;
  }

  // 10. Typing valid characters (numbers, commas, dots, spaces, minuses, percentages, quotes, brackets)
  if (inputKey && inputKey.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (/^[0-9.,\s\-+%\/\[\]"']$/.test(inputKey)) {
      let newStr = str;
      let newCur = cur;
      if (hasSelection) {
        newStr = str.slice(0, selMin) + inputKey + str.slice(selMax);
        newCur = selMin + 1;
      } else {
        newStr = str.slice(0, cur) + inputKey + str.slice(cur);
        newCur = cur + 1;
      }
      if (field === 'stat') entry.statStr = newStr;
      else entry.costStr = newStr;

      state.activePlayerUpgradeInput.cursor = newCur;
      state.activePlayerUpgradeInput.selectionStart = newCur;
      state.activePlayerUpgradeInput.selectionEnd = newCur;
      parseAndSyncPlayerUpgrade(uKey);
      return true;
    }
  }

  return true; // Consume keys when focused in input field
}

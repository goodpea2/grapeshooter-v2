import { state } from '../../state';
import { 
  DEFAULT_PLAYER_UPGRADE_CONFIGS, 
  getPlayerUpgradeInfo, 
  purchasePlayerUpgrade 
} from '../../src/playerUpgrades';
import { drawCard, drawButton, registerUIHitbox } from '../../uiComponents';
import { color } from '../../uiColors';

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
declare const constrain: any;
declare const drawingContext: any;

export const UPGRADE_KEYS = [
  'turretAttachCapacity',
  'sunBankCapacity',
  'damageMultAdd',
  'magnetRadius',
  'movementSpeed',
  'maxStamina',
  'clickHoldBoost'
];

export interface EditorPlayerUpgradeEntry {
  statStr: string;
  costStr: string;
  values?: number[];
  costs?: number[];
}

export function handlePlayerUpgradesScroll(delta: number): boolean {
  if (state.playerUpgradesMaxScroll !== undefined && state.playerUpgradesMaxScroll < 0) {
    state.playerUpgradesScrollVelocity = (state.playerUpgradesScrollVelocity || 0) - delta * 0.35;
    return true;
  }
  return false;
}

/**
 * Initializes or refreshes the LevelEditor player upgrades state from level layout data or clean defaults.
 */
export function initLevelEditorPlayerUpgradesFromData(layoutData?: any) {
  if (!state.levelEditorPlayerUpgrades) {
    state.levelEditorPlayerUpgrades = {};
  }

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

  const statClean = entry.statStr.replace(/[\[\]"']/g, '').trim();
  if (statClean.length > 0) {
    const tokens = statClean.split(',').map((s: string) => s.trim().replace(/%/g, '')).filter((s: string) => s.length > 0);
    const nums = tokens.map((s: string) => parseFloat(s)).filter((n: number) => !isNaN(n));
    entry.values = nums.length > 0 ? nums : undefined;
  } else {
    entry.values = undefined;
  }

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

  if (state.isAlmanacEditorMode) {
    drawEditorUpgradesPanel(w, h, modalX + x, modalY + y);
  } else {
    drawGameplayUpgradesPanel(w, h, modalX + x, modalY + y);
  }

  pop();
}

/**
 * Normal Gameplay Mode: Clean layout with Title, Floating Player in Center, and Scrollable 2-Column Upgrade Cards.
 */
function drawGameplayUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  // Title (Top Center) - exactly "Player Upgrades"
  fill(...color.yellow());
  textAlign(CENTER, CENTER);
  textSize(22);
  noStroke();
  text("Player Upgrades", w / 2, 18);

  const padX = 24;
  const topY = 0;
  const centerW = 180;
  const cardW = Math.floor((w - padX * 2 - centerW) / 2);
  const cardH = 126;
  const cardGapY = 12;

  const leftX = padX;
  const rightX = w - padX - cardW;
  const centerX = w / 2;

  const visibleH = h - topY - 14;

  const leftKeys: string[] = [];
  const rightKeys: string[] = [];
  for (let i = 0; i < UPGRADE_KEYS.length; i++) {
    if (i % 2 === 0) leftKeys.push(UPGRADE_KEYS[i]);
    else rightKeys.push(UPGRADE_KEYS[i]);
  }

  const rowCount = Math.max(leftKeys.length, rightKeys.length);
  const totalContentH = rowCount * cardH + (rowCount - 1) * cardGapY;
  const maxScroll = Math.min(0, visibleH - totalContentH);
  state.playerUpgradesMaxScroll = maxScroll;

  // Scroll Drag & Velocity Physics
  const isInside = mouseX >= globalPanelX && mouseX <= globalPanelX + w && mouseY >= globalPanelY + topY && mouseY <= globalPanelY + topY + visibleH;
  if (mouseIsPressed && isInside) {
    const dy = mouseY - ((window as any).pmouseY || mouseY);
    if (Math.abs(dy) > 0.5) {
      state.playerUpgradesScrollVelocity = dy;
      if (Math.abs(dy) > 2) state.playerUpgradesIsDragging = true;
    }
  } else {
    state.playerUpgradesScrollVelocity = (state.playerUpgradesScrollVelocity || 0) * 0.75;
    if (!mouseIsPressed) state.playerUpgradesIsDragging = false;
  }

  state.playerUpgradesScrollY = (state.playerUpgradesScrollY || 0) + (state.playerUpgradesScrollVelocity || 0);
  state.playerUpgradesScrollY = constrain(state.playerUpgradesScrollY, maxScroll, 0);

  // 1. Draw Center Player (fixed in center, no stats box)
  drawCenterPlayer(centerX, topY, centerW, visibleH);

  // 2. Draw Clipped Scrollable Cards
  push();
  if (drawingContext) {
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(0, topY, w, visibleH);
    drawingContext.clip();
  }

  translate(0, state.playerUpgradesScrollY);

  for (let i = 0; i < leftKeys.length; i++) {
    const key = leftKeys[i];
    const cy = topY + i * (cardH + cardGapY);
    drawGameplayUpgradeCard(leftX, cy, cardW, cardH, key, globalPanelX, globalPanelY, topY, visibleH);
  }

  for (let i = 0; i < rightKeys.length; i++) {
    const key = rightKeys[i];
    const cy = topY + i * (cardH + cardGapY);
    drawGameplayUpgradeCard(rightX, cy, cardW, cardH, key, globalPanelX, globalPanelY, topY, visibleH);
  }

  if (drawingContext) {
    drawingContext.restore();
  }
  pop();

  // 3. Slim Scrollbar if scrollable
  if (maxScroll < 0) {
    const scrollbarTrackH = visibleH - 20;
    const thumbH = Math.max(28, (visibleH / totalContentH) * scrollbarTrackH);
    const scrollProgress = maxScroll === 0 ? 0 : state.playerUpgradesScrollY / maxScroll;
    const thumbY = topY + 10 + scrollProgress * (scrollbarTrackH - thumbH);
    const thumbX = w - 10;

    noStroke();
    fill(25, 60, 48, 120);
    rect(thumbX, topY + 10, 4, scrollbarTrackH, 2);
    fill(...color.yellow(), 180);
    rect(thumbX, thumbY, 4, thumbH, 2);
  }
}

/**
 * Renders the central player sprite with glowing shadow/aura.
 */
function drawCenterPlayer(cx: number, cy: number, cw: number, ch: number) {
  push();
  translate(cx, cy + ch / 2 - 20);

  // 1. Aura / Pedestal shadow
  const floatOff = sin(frameCount * 0.06) * 5;

  noStroke();
  fill(0, 0, 0, 80);
  ellipse(0, 46, 84, 18);

  // 2. Player Sprite
  const playerAsset = state.assets['img_player_front_right'] || state.assets['img_player_idle_0'] || state.assets['img_basic'];
  if (playerAsset) {
    imageMode(CENTER);
    image(playerAsset, 0, floatOff, 200, 200);
  }

  pop();
}

/**
 * Draws an upgrade card using modular components and design tokens matching image.png.
 */
function drawGameplayUpgradeCard(
  cx: number, cy: number, cw: number, ch: number, 
  upgradeKey: string, globalPanelX: number, globalPanelY: number,
  clipTopY: number, clipH: number
) {
  const info = getPlayerUpgradeInfo(upgradeKey);
  const cardGlobalX = globalPanelX + cx;
  const cardGlobalY = globalPanelY + cy + (state.playerUpgradesScrollY || 0);

  // Check if card is visible inside the clip rect
  const isVisible = cardGlobalY + ch >= globalPanelY + clipTopY && cardGlobalY <= globalPanelY + clipTopY + clipH;

  const isCardHovered = mouseX >= cardGlobalX && mouseX <= cardGlobalX + cw &&
                       mouseY >= cardGlobalY && mouseY <= cardGlobalY + ch &&
                       mouseY >= globalPanelY + clipTopY && mouseY <= globalPanelY + clipTopY + clipH;

  push();
  translate(cx, cy);

  // 1. Card Container
  drawCard(0, 0, cw, ch, {
    radius: 16,
    bgColor: [16, 44, 34, 245],
    borderColor: isCardHovered ? color.lightGreen() : [28, 70, 56, 255],
    borderWidth: isCardHovered ? 4 : 0,
  });

  // 2. Icon frame (Top Left)
  const iconSize = 40;
  const iconX = 12;
  const iconY = 12;

  fill(10, 28, 22);
  noStroke();
  rect(iconX, iconY, iconSize, iconSize, 10);

  const asset = state.assets[info.config.icon] || state.assets['img_basic'];
  if (asset) {
    imageMode(CENTER);
    image(asset, iconX + iconSize / 2, iconY + iconSize / 2, 28, 28);
  }

  // 3. Title & Description beside Icon
  const textX = iconX + iconSize + 10;
  const textW = cw - textX - 12;

  fill(...color.yellow());
  textAlign(LEFT, TOP);
  textSize(15);
  noStroke();
  text(info.config.name, textX, iconY + 1);

  // Description
  fill(185, 215, 195, 230);
  textSize(10.5);
  text(info.config.description, textX, iconY + 20, textW, 36);

  // 4. Progression Pips (Bottom Left)
  const pipsStartX = 14;
  const pipsY = 74;
  const totalPips = info.maxLevel;
  const pipGap = 3;
  const maxPipsW = 160;
  const pipW = totalPips > 0 ? Math.min(22, (maxPipsW - (totalPips - 1) * pipGap) / totalPips) : 0;
  const pipH = 5.5;

  if (totalPips > 0) {
    for (let p = 0; p < totalPips; p++) {
      const px = pipsStartX + p * (pipW + pipGap);
      const isFilled = p < info.currentLevel;
      fill(isFilled ? color.yellow() : [26, 65, 52]);
      noStroke();
      rect(px, pipsY, pipW, pipH, 2.5);
    }
  }

  // 5. Stat Value Progression Text
  const statY = 100;
  textAlign(LEFT, CENTER);
  textSize(13);

  if (info.isMax) {
    fill(255);
    const valText = info.config.statFormat(info.currVal);
    text(valText, 14, statY);
    fill(...color.lightGreen());
    text(" (MAX)", 14 + textWidth(valText), statY);
  } else {
    fill(255);
    const curValText = info.config.statFormat(info.currVal);
    text(curValText, 14, statY);
    const curW = textWidth(curValText);

    fill(...color.lightGreen());
    text(" → ", 14 + curW, statY);
    const arrowW = textWidth(" → ");

    const nextValText = info.config.statFormat(info.nextVal);
    text(nextValText, 14 + curW + arrowW, statY);
  }

  // 6. Upgrade Button (Bottom Right)
  const btnW = 80;
  const btnH = 32;
  const btnX = cw - btnW - 14;
  const btnY = ch - btnH - 12;

  if (isVisible) {
    const btnLabel = info.isMax ? 'MAX' : `${info.cost}`;
    const btnIcon = info.isMax ? undefined : state.assets['img_icon_elixir'];
    drawButton(btnX, btnY, btnW, btnH, btnLabel, {
      id: `btn_upgrade_${upgradeKey}`,
      variant: (info.canAfford && !info.isMax) ? 'yellow' : 'dark',
      icon: btnIcon,
      iconSize: 32,
      fontSize: 16,
      radius: 8,
      depth3D: 2,
      hitboxX: cardGlobalX + btnX,
      hitboxY: cardGlobalY + btnY,
      disabled: !info.canAfford || info.isMax,
      layer: 110,
      onClick: () => {
        if (!state.playerUpgradesIsDragging) {
          purchasePlayerUpgrade(upgradeKey);
        }
      }
    });
  }

  pop();
}

/**
 * Level Editor Mode: Editable strings for Stats and Costs.
 */
function drawEditorUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  initLevelEditorPlayerUpgradesFromData();

  // Header Banner
  const bannerX = 20;
  const bannerY = 12;
  const bannerW = w - 40;
  const bannerH = 34;

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
  const resetAllH = 24;
  const resetAllX = bannerW - resetAllW - 6;
  const resetAllY = (bannerH - resetAllH) / 2;

  drawButton(bannerX + resetAllX, bannerY + resetAllY, resetAllW, resetAllH, "RESET ALL TO DEFAULT", {
    id: 'btn_reset_all_upgrades',
    variant: 'purple',
    fontSize: 10,
    radius: 6,
    depth3D: 2,
    hitboxX: globalPanelX + bannerX + resetAllX,
    hitboxY: globalPanelY + bannerY + resetAllY,
    onClick: () => {
      for (const key of UPGRADE_KEYS) {
        if (state.levelEditorPlayerUpgrades[key]) {
          state.levelEditorPlayerUpgrades[key].statStr = '';
          state.levelEditorPlayerUpgrades[key].costStr = '';
          state.levelEditorPlayerUpgrades[key].values = undefined;
          state.levelEditorPlayerUpgrades[key].costs = undefined;
        }
      }
      state.activePlayerUpgradeInput = null;
    }
  });

  pop();

  // 2-Column Grid layout for editable upgrade cards
  const gridStartX = 20;
  const gridStartY = 54;
  const cardGap = 10;
  const gridW = w - 40;
  const cardW = (gridW - cardGap) / 2;
  const cardH = 100;

  for (let i = 0; i < 7; i++) {
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
  rect(0, 0, cw, ch, 10);

  // Header: Icon + Title
  const iconSize = 24;
  const iconX = 10;
  const iconY = 8;

  fill(12, 14, 28);
  noStroke();
  rect(iconX, iconY, iconSize, iconSize, 5);

  const asset = state.assets[defaultCfg?.icon] || state.assets['img_basic'];
  if (asset) {
    imageMode(CENTER);
    image(asset, iconX + iconSize / 2, iconY + iconSize / 2, 18, 18);
  }

  fill(255);
  textAlign(LEFT, CENTER);
  textSize(12);
  text(defaultCfg?.name || key, iconX + iconSize + 8, iconY + iconSize / 2);

  // Line 1: StatLevel
  const labelX = 10;
  const statRowY = 38;
  const fieldH = 22;
  const labelW = 75;
  const fieldX = labelX + labelW;
  const fieldW = cw - fieldX - 10;

  fill(180, 195, 230);
  textAlign(LEFT, CENTER);
  textSize(11);
  text("StatLevel:", labelX, statRowY + fieldH / 2);

  const isStatActive = state.activePlayerUpgradeInput?.key === key && state.activePlayerUpgradeInput?.field === 'stat';
  const isStatHov = mouseX >= cardGlobalX + fieldX && mouseX <= cardGlobalX + fieldX + fieldW &&
                    mouseY >= cardGlobalY + statRowY && mouseY <= cardGlobalY + statRowY + fieldH;

  fill(isStatActive ? [10, 13, 26] : (isStatHov ? [16, 20, 42] : [13, 16, 34]));
  stroke(isStatActive ? [80, 200, 255] : (isStatHov ? [80, 100, 160] : [45, 55, 95]));
  strokeWeight(isStatActive ? 2 : 0);
  rect(fieldX, statRowY, fieldW, fieldH, 4);
  noStroke();

  const statStr = editorEntry.statStr || '';
  textSize(10.5);
  textAlign(LEFT, CENTER);

  if (isStatActive) {
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

    if (selMin < selMax) {
      const x1 = fieldX + 8 + textWidth(statStr.slice(0, selMin));
      const x2 = fieldX + 8 + textWidth(statStr.slice(0, selMax));
      fill(50, 120, 220, 160);
      rect(x1, statRowY + 2, x2 - x1, fieldH - 4, 2);
    }

    if (statStr.length > 0) {
      fill(255);
      text(statStr, fieldX + 8, statRowY + fieldH / 2);
    }

    if (selMin === selMax) {
      const showCursor = floor(frameCount / 20) % 2 === 0;
      if (showCursor) {
        const curX = fieldX + 8 + textWidth(statStr.slice(0, cur));
        fill(80, 200, 255);
        rect(curX, statRowY + 3, 2, fieldH - 6, 1);
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

  // Line 2: UpgradeCost
  const costRowY = 66;

  fill(180, 195, 230);
  textAlign(LEFT, CENTER);
  textSize(11);
  text("UpgradeCost:", labelX, costRowY + fieldH / 2);

  const isCostActive = state.activePlayerUpgradeInput?.key === key && state.activePlayerUpgradeInput?.field === 'cost';
  const isCostHov = mouseX >= cardGlobalX + fieldX && mouseX <= cardGlobalX + fieldX + fieldW &&
                    mouseY >= cardGlobalY + costRowY && mouseY <= cardGlobalY + costRowY + fieldH;

  fill(isCostActive ? [10, 13, 26] : (isCostHov ? [16, 20, 42] : [13, 16, 34]));
  stroke(isCostActive ? [80, 200, 255] : (isCostHov ? [80, 100, 160] : [45, 55, 95]));
  strokeWeight(isCostActive ? 2 : 0);
  rect(fieldX, costRowY, fieldW, fieldH, 4);
  noStroke();

  const costStr = editorEntry.costStr || '';
  textSize(10.5);
  textAlign(LEFT, CENTER);

  if (isCostActive) {
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

    if (selMin < selMax) {
      const x1 = fieldX + 8 + textWidth(costStr.slice(0, selMin));
      const x2 = fieldX + 8 + textWidth(costStr.slice(0, selMax));
      fill(50, 120, 220, 160);
      rect(x1, costRowY + 2, x2 - x1, fieldH - 4, 2);
    }

    if (costStr.length > 0) {
      fill(255);
      text(costStr, fieldX + 8, costRowY + fieldH / 2);
    }

    if (selMin === selMax) {
      const showCursor = floor(frameCount / 20) % 2 === 0;
      if (showCursor) {
        const curX = fieldX + 8 + textWidth(costStr.slice(0, cur));
        fill(80, 200, 255);
        rect(curX, costRowY + 3, 2, fieldH - 6, 1);
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

    const gridStartX = 20;
    const gridStartY = 54;
    const cardGap = 10;
    const gridW = panelW - 40;
    const cardW = (gridW - cardGap) / 2;
    const cardH = 100;

    let clickedInputField = false;

    for (let i = 0; i < 7; i++) {
      const key = UPGRADE_KEYS[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = gridStartX + col * (cardW + cardGap);
      const cardY = gridStartY + row * (cardH + cardGap);

      const cardGX = globalPanelX + cardX;
      const cardGY = globalPanelY + cardY;

      const editorEntry = state.levelEditorPlayerUpgrades[key] || { statStr: '', costStr: '' };

      const labelX = 10;
      const labelW = 75;
      const fieldX = labelX + labelW;
      const fieldW = cardW - fieldX - 10;
      const fieldH = 22;

      // Check Stat Input Box
      const statRowY = 38;
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
      const costRowY = 66;
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

  // Normal gameplay mode clicks are handled by immediate-mode hitboxes registered by drawButton.
  return true;
}

/**
 * Handles mouse drag for text highlighting when an upgrade input field is focused.
 */
export function handlePlayerUpgradeMouseDrag(mx: number, my: number) {
  if (!state.activePlayerUpgradeInput || !state.activePlayerUpgradeInput.isDragging) return;
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

  let cur = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.cursor ?? str.length));
  let sStart = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.selectionStart ?? cur));
  let sEnd = Math.max(0, Math.min(str.length, state.activePlayerUpgradeInput.selectionEnd ?? cur));
  const selMin = Math.min(sStart, sEnd);
  const selMax = Math.max(sStart, sEnd);
  const hasSelection = selMin < selMax;

  if (keyCode === 27 || keyCode === 13) {
    parseAndSyncPlayerUpgrade(uKey);
    state.activePlayerUpgradeInput = null;
    return true;
  }

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

  if ((event?.ctrlKey || event?.metaKey) && (inputKey === 'a' || inputKey === 'A' || keyCode === 65)) {
    state.activePlayerUpgradeInput.selectionStart = 0;
    state.activePlayerUpgradeInput.selectionEnd = str.length;
    state.activePlayerUpgradeInput.cursor = str.length;
    return true;
  }

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

  return true;
}

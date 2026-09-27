import { state } from '../../state';
import { 
  DEFAULT_PLAYER_UPGRADE_CONFIGS, 
  DEFAULT_DISABLED_UPGRADES,
  getPlayerUpgradeInfo, 
  getPlayerUpgradeStat,
  isPlayerUpgradeEnabled,
  purchasePlayerUpgrade,
  getCanonicalUpgradeKey
} from '../../src/playerUpgrades';
import { drawCard, drawButton, drawYellowButton, drawPurpleButton, registerUIHitbox } from '../../uiComponents';
import { color } from '../../uiColors';
import { soundEngine } from '../../src/audio/soundEngine';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const line: any;
declare const textAlign: any;
declare const textSize: any;
declare const textFont: any;
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
declare const ellipse: any;
declare const sin: any;
declare const frameCount: any;
declare const constrain: any;
declare const drawingContext: any;

export const UPGRADE_KEYS = [
  'turretAttachCapacity',
  'sunBankCapacity',
  'magnetRadius',
  'movementSpeed',
  'maxStamina',
  'staminaRecoveryRate',
  'damageMultAdd',
  'clickHoldBoost'
];

export interface EditorPlayerUpgradeEntry {
  statStr: string;
  costStr: string;
  values?: number[];
  costs?: number[];
  enabled?: boolean;
}

export function handlePlayerUpgradesScroll(delta: number): boolean {
  if (state.isAlmanacEditorMode) {
    state.editorPlayerUpgradesScrollVelocity = (state.editorPlayerUpgradesScrollVelocity || 0) - delta * 0.45;
    return true;
  }
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

  const source = layoutData !== undefined ? layoutData : (state.currentLevelLayoutData || {});

  for (const key of UPGRADE_KEYS) {
    const canonical = getCanonicalUpgradeKey(key);
    const raw = source?.[key] || source?.[canonical]
      || source?.playerUpgrades?.[key] || source?.playerUpgrades?.[canonical]
      || source?.PlayerUpgrades?.[key] || source?.PlayerUpgrades?.[canonical];

    const isDefaultDisabled = DEFAULT_DISABLED_UPGRADES.has(key) || DEFAULT_DISABLED_UPGRADES.has(canonical);
    let enabled = !isDefaultDisabled;

    if (raw) {
      const statStr = Array.isArray(raw.values) ? raw.values.join(', ') : (raw.values != null ? String(raw.values) : '');
      const costStr = Array.isArray(raw.costs) ? raw.costs.join(', ') : (raw.costs != null ? String(raw.costs) : '');
      if (raw.enabled !== undefined) {
        enabled = !!raw.enabled;
      }
      state.levelEditorPlayerUpgrades[key] = {
        statStr,
        costStr,
        enabled,
        values: Array.isArray(raw.values) && raw.values.length > 0 ? [...raw.values] : undefined,
        costs: Array.isArray(raw.costs) && raw.costs.length > 0 ? [...raw.costs] : undefined
      };
    } else {
      if (!state.levelEditorPlayerUpgrades[key]) {
        state.levelEditorPlayerUpgrades[key] = {
          statStr: '',
          costStr: '',
          enabled,
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

  const statClean = (entry.statStr || '').replace(/[\[\]"']/g, '').trim();
  if (statClean.length > 0) {
    const tokens = statClean.split(',').map((s: string) => s.trim().replace(/%/g, '')).filter((s: string) => s.length > 0);
    const nums = tokens.map((s: string) => parseFloat(s)).filter((n: number) => !isNaN(n));
    entry.values = nums.length > 0 ? nums : undefined;
  } else {
    entry.values = undefined;
  }

  const costClean = (entry.costStr || '').replace(/[\[\]"']/g, '').trim();
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
      const isDefaultDisabled = DEFAULT_DISABLED_UPGRADES.has(key);
      const isExplicitlyToggled = entry.enabled !== undefined && entry.enabled !== !isDefaultDisabled;

      if (entry.values && entry.values.length > 0) {
        out.values = [...entry.values];
        hasAny = true;
      }
      if (entry.costs && entry.costs.length > 0) {
        out.costs = [...entry.costs];
        hasAny = true;
      }
      if (entry.enabled !== undefined) {
        out.enabled = entry.enabled;
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
 * Filters cards to only those enabled in the level. Unshown upgrades still have their first level stat applied.
 */
function drawGameplayUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  // Title (Top Center)
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

  // Filter to only enabled upgrades
  const visibleKeys = UPGRADE_KEYS.filter(k => isPlayerUpgradeEnabled(k));

  const leftKeys: string[] = [];
  const rightKeys: string[] = [];
  for (let i = 0; i < visibleKeys.length; i++) {
    if (i % 2 === 0) leftKeys.push(visibleKeys[i]);
    else rightKeys.push(visibleKeys[i]);
  }

  const rowCount = Math.max(leftKeys.length, rightKeys.length);
  const totalContentH = rowCount * cardH + Math.max(0, rowCount - 1) * cardGapY;
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

  // 1. Draw Center Player (fixed in center)
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
 * Draws a gameplay upgrade card using modular components and design tokens.
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
 * Level Editor Mode: Revamped to strictly match LevelConfig UI styling.
 * Re-uses dark navy background, cyan section headers, consistent 24px input fields,
 * Consolas monospace font, blinking cyan cursor, and an On/Off toggle button per upgrade card.
 */
function drawEditorUpgradesPanel(w: number, h: number, globalPanelX: number, globalPanelY: number) {
  initLevelEditorPlayerUpgradesFromData();

  // Main Background Card matching LevelConfig
  fill(16, 20, 38, 240);
  noStroke();
  rect(0, 0, w, h, 20);

  // Header Banner Card matching LevelConfig Section Card style
  const bannerX = 14;
  const bannerY = 8;
  const bannerW = w - 28;
  const bannerH = 40;

  push();
  fill(22, 28, 54);
  stroke(40, 52, 95);
  strokeWeight(1);
  rect(bannerX, bannerY, bannerW, bannerH, 10);
  noStroke();

  // Title in Cyan (matching LevelConfig)
  fill(0, 220, 255);
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("PLAYER UPGRADE CONFIG", bannerX + 12, bannerY + 7);

  // Subtitle / Help note
  fill(160, 185, 220);
  textSize(8.5);
  // Header Action Buttons using uiComponents
  const btnSetW = 125;
  const btnResetW = 125;
  const btnActionH = 24;
  const btnActionY = bannerY + 8;
  const btnResetX = bannerX + bannerW - btnResetW - 10;
  const btnSetX = btnResetX - btnSetW - 8;

  drawYellowButton(btnSetX, btnActionY, btnSetW, btnActionH, "SET ALL TO 1 LEVEL", {
    id: 'btn_set_all_1level_upgrades',
    fontSize: 9,
    radius: 6,
    depth3D: 2,
    layer: 110,
    hitboxX: globalPanelX + btnSetX,
    hitboxY: globalPanelY + btnActionY,
    onClick: () => {
      for (const key of UPGRADE_KEYS) {
        const defaultCfg = DEFAULT_PLAYER_UPGRADE_CONFIGS[key];
        if (defaultCfg && state.levelEditorPlayerUpgrades[key]) {
          const firstVal = defaultCfg.values?.[0] !== undefined ? defaultCfg.values[0] : 0;
          const firstCost = defaultCfg.costs?.[0] !== undefined ? defaultCfg.costs[0] : 0;
          state.levelEditorPlayerUpgrades[key].statStr = String(firstVal);
          state.levelEditorPlayerUpgrades[key].costStr = String(firstCost);
          state.levelEditorPlayerUpgrades[key].values = [firstVal];
          state.levelEditorPlayerUpgrades[key].costs = [firstCost];
        }
      }
      state.activePlayerUpgradeInput = null;
    }
  });

  drawPurpleButton(btnResetX, btnActionY, btnResetW, btnActionH, "RESET ALL DEFAULTS", {
    id: 'btn_reset_all_upgrades',
    fontSize: 9,
    radius: 6,
    depth3D: 2,
    layer: 110,
    hitboxX: globalPanelX + btnResetX,
    hitboxY: globalPanelY + btnActionY,
    onClick: () => {
      for (const key of UPGRADE_KEYS) {
        if (state.levelEditorPlayerUpgrades[key]) {
          const isDefaultDisabled = DEFAULT_DISABLED_UPGRADES.has(key);
          state.levelEditorPlayerUpgrades[key].statStr = '';
          state.levelEditorPlayerUpgrades[key].costStr = '';
          state.levelEditorPlayerUpgrades[key].enabled = !isDefaultDisabled;
          state.levelEditorPlayerUpgrades[key].values = undefined;
          state.levelEditorPlayerUpgrades[key].costs = undefined;
        }
      }
      state.activePlayerUpgradeInput = null;
    }
  });

  pop();

  // Scrollable 2-Column Grid
  const gridStartX = 14;
  const gridStartY = 54;
  const cardGap = 8;
  const gridW = w - 28;
  const cardW = (gridW - cardGap) / 2;
  const cardH = 98;

  const totalRows = Math.ceil(UPGRADE_KEYS.length / 2);
  const contentH = totalRows * cardH + Math.max(0, totalRows - 1) * cardGap;
  const viewportH = h - gridStartY - 10;
  const maxScroll = Math.min(0, viewportH - contentH);

  // Smooth scroll velocity integration
  if (state.editorPlayerUpgradesScrollVelocity) {
    state.editorPlayerUpgradesScrollY = constrain(
      (state.editorPlayerUpgradesScrollY || 0) + state.editorPlayerUpgradesScrollVelocity,
      maxScroll,
      0
    );
    state.editorPlayerUpgradesScrollVelocity *= 0.85;
    if (Math.abs(state.editorPlayerUpgradesScrollVelocity) < 0.01) {
      state.editorPlayerUpgradesScrollVelocity = 0;
    }
  } else {
    state.editorPlayerUpgradesScrollY = constrain(state.editorPlayerUpgradesScrollY || 0, maxScroll, 0);
  }

  const scrollY = state.editorPlayerUpgradesScrollY || 0;

  // Clip content area
  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(gridStartX - 2, gridStartY, gridW + 4, viewportH);
    dc.clip();
  }

  push();
  translate(0, scrollY);

  for (let i = 0; i < UPGRADE_KEYS.length; i++) {
    const key = UPGRADE_KEYS[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = gridStartX + col * (cardW + cardGap);
    const cardY = gridStartY + row * (cardH + cardGap);

    if (cardY + scrollY + cardH >= gridStartY - 30 && cardY + scrollY <= gridStartY + viewportH + 30) {
      drawEditorUpgradeCard(cardX, cardY, cardW, cardH, key, globalPanelX, globalPanelY, scrollY);
    }
  }

  pop();

  if (dc) {
    dc.restore();
  }

  // Draw scrollbar if content overflows viewport
  if (contentH > viewportH) {
    const sbW = 5;
    const sbX = gridStartX + gridW + 4;
    const sbTrackH = viewportH;
    const thumbH = Math.max(26, (viewportH / contentH) * sbTrackH);
    const scrollRatio = maxScroll < 0 ? scrollY / maxScroll : 0;
    const thumbY = gridStartY + scrollRatio * (sbTrackH - thumbH);

    push();
    fill(25, 30, 60, 180);
    noStroke();
    rect(sbX, gridStartY, sbW, sbTrackH, 3);
    fill(0, 220, 255, 200);
    rect(sbX, thumbY, sbW, thumbH, 3);
    pop();
  }
}

/**
 * Draws a single upgrade config card in the LevelEditor Almanac.
 * Styled matching LevelConfig's UI cards, titles, input boxes, hitboxes, and buttons.
 */
function drawEditorUpgradeCard(
  cx: number, cy: number, cw: number, ch: number,
  key: string, globalPanelX: number, globalPanelY: number,
  scrollY: number = 0
) {
  const defaultCfg = DEFAULT_PLAYER_UPGRADE_CONFIGS[key];
  const editorEntry = (state.levelEditorPlayerUpgrades && state.levelEditorPlayerUpgrades[key]) || {
    statStr: '',
    costStr: '',
    enabled: !DEFAULT_DISABLED_UPGRADES.has(key),
    values: undefined,
    costs: undefined
  };

  const isEnabled = editorEntry.enabled !== undefined ? editorEntry.enabled : !DEFAULT_DISABLED_UPGRADES.has(key);
  const cardGlobalX = globalPanelX + cx;
  const cardGlobalY = globalPanelY + cy + scrollY;

  const isCardHov = mouseX >= cardGlobalX && mouseX <= cardGlobalX + cw &&
                    mouseY >= cardGlobalY && mouseY <= cardGlobalY + ch;

  push();
  translate(cx, cy);

  // Card background matching LevelConfig section cards
  fill(22, 28, 54);
  stroke(isCardHov ? [70, 95, 145] : (isEnabled ? [40, 52, 95] : [32, 38, 65]));
  strokeWeight(1);
  rect(0, 0, cw, ch, 10);

  // Header: Icon + Title
  const iconSize = 20;
  const iconX = 10;
  const iconY = 7;

  fill(12, 14, 28);
  noStroke();
  rect(iconX, iconY, iconSize, iconSize, 4);

  const asset = state.assets[defaultCfg?.icon] || state.assets['img_basic'];
  if (asset) {
    imageMode(CENTER);
    image(asset, iconX + iconSize / 2, iconY + iconSize / 2, 16, 16);
  }

  // Upgrade Title (in Cyan, matching LevelConfig titles)
  fill(isEnabled ? [0, 220, 255] : [140, 160, 185]);
  textAlign(LEFT, CENTER);
  textSize(11);
  noStroke();
  text(defaultCfg?.name || key, iconX + iconSize + 8, iconY + iconSize / 2);

  // ON / OFF Toggle Button (Top Right of Card)
  const btnW = 68;
  const btnH = 20;
  const btnX = cw - btnW - 10;
  const btnY = 7;

  drawButton(btnX, btnY, btnW, btnH, isEnabled ? "SHOWN" : "HIDDEN", {
    id: `btn_toggle_upgrade_${key}`,
    variant: isEnabled ? 'green' : 'red',
    fontSize: 8.5,
    radius: 5,
    depth3D: 2,
    layer: 110,
    hitboxX: cardGlobalX + btnX,
    hitboxY: cardGlobalY + btnY,
    onClick: () => {
      editorEntry.enabled = !isEnabled;
      soundEngine.playSFX('btn_click');
    }
  });

  // Row 1: StatLevel Input (matches LevelConfig renderTextInput)
  const labelX = 10;
  const row1Y = 32;
  const fieldH = 24;
  const fieldW = cw - 20;

  renderConfigTextInput(
    labelX, row1Y, fieldW, fieldH,
    "Stats",
    key, 'stat',
    editorEntry.statStr || '',
    defaultCfg?.values?.join(', ') || '',
    cardGlobalX, cardGlobalY
  );

  // Row 2: UpgradeCost Input (matches LevelConfig renderTextInput)
  const row2Y = 64;
  renderConfigTextInput(
    labelX, row2Y, fieldW, fieldH,
    "Costs",
    key, 'cost',
    editorEntry.costStr || '',
    defaultCfg?.costs?.join(', ') || '',
    cardGlobalX, cardGlobalY
  );

  pop();
}

/**
 * Standardized LevelConfig text input renderer with Consolas font, selection highlight,
 * blinking cyan cursor, and matching borders.
 */
function renderConfigTextInput(
  x: number, y: number, w: number, h: number,
  label: string,
  key: string,
  field: 'stat' | 'cost',
  value: string,
  placeholder: string,
  cardGlobalX: number,
  cardGlobalY: number
) {
  const gX = cardGlobalX + x;
  const gY = cardGlobalY + y;

  const isFocused = state.activePlayerUpgradeInput?.key === key && state.activePlayerUpgradeInput?.field === field;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  const isMousePressed = !!(window as any).mouseIsPressed;
  if (isFocused && isMousePressed && state.activePlayerUpgradeInput?.isDragging) {
    const activeBuf = state.activePlayerUpgradeInput.textBuffer || '';
    const approxCharW = 5.8;
    const relX = mouseX - (gX + 8);
    const dragIdx = Math.max(0, Math.min(activeBuf.length, Math.round(relX / approxCharW)));
    state.activePlayerUpgradeInput.selectionEnd = dragIdx;
    state.activePlayerUpgradeInput.cursor = dragIdx;
  }

  // Label
  push();
  fill(160, 185, 220);
  textAlign(LEFT, BOTTOM);
  textSize(8.5);
  noStroke();
  text(label, x, y - 2);

  // Box background & border
  fill(...(isFocused ? [12, 16, 32, 250] : (isHov ? [20, 28, 50, 240] : [12, 16, 32, 230])));
  if (isFocused) {
    stroke(0, 220, 255);
    strokeWeight(1.5);
  } else if (isHov) {
    stroke(70, 95, 145);
    strokeWeight(1);
  } else {
    stroke(32, 42, 75);
    strokeWeight(1);
  }
  rect(x, y, w, h, 6);

  // Text rendering in Consolas monospace font
  const displayBuf = isFocused ? (state.activePlayerUpgradeInput?.textBuffer ?? value) : value;
  fill(255, 255, 255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9.5);
  if (typeof textFont === 'function') textFont('Consolas, monospace');

  const maxVisChars = Math.floor((w - 16) / 5.8);
  let renderStr = displayBuf.length > 0 ? displayBuf : placeholder;

  if (displayBuf.length === 0) {
    fill(90, 105, 135); // Placeholder muted color
  } else {
    fill(255);
  }

  if (renderStr.length > maxVisChars) {
    renderStr = '...' + renderStr.substring(renderStr.length - maxVisChars + 3);
  }

  // Selection highlight
  if (isFocused) {
    const cursorIdx = state.activePlayerUpgradeInput?.cursor !== undefined ? state.activePlayerUpgradeInput.cursor : displayBuf.length;
    const sStart = state.activePlayerUpgradeInput?.selectionStart !== undefined ? state.activePlayerUpgradeInput.selectionStart : cursorIdx;
    const sEnd = state.activePlayerUpgradeInput?.selectionEnd !== undefined ? state.activePlayerUpgradeInput.selectionEnd : cursorIdx;
    const minS = Math.min(sStart, sEnd);
    const maxS = Math.max(sStart, sEnd);

    if (minS !== maxS) {
      const beforeSel = displayBuf.substring(0, minS);
      const selPart = displayBuf.substring(minS, maxS);
      const beforeW = (window as any).textWidth ? (window as any).textWidth(beforeSel) : beforeSel.length * 5.8;
      const selW = (window as any).textWidth ? (window as any).textWidth(selPart) : selPart.length * 5.8;

      push();
      fill(0, 120, 200, 150);
      noStroke();
      rect(x + 8 + beforeW, y + 4, selW, h - 8, 2);
      pop();
    }
  }

  text(renderStr, x + 8, y + h / 2);

  // Blinking cursor
  if (isFocused) {
    const cursorIdx = state.activePlayerUpgradeInput?.cursor !== undefined ? state.activePlayerUpgradeInput.cursor : displayBuf.length;
    const beforeCursor = displayBuf.substring(0, cursorIdx);
    const cursorW = (window as any).textWidth ? (window as any).textWidth(beforeCursor) : beforeCursor.length * 5.8;
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      stroke(0, 220, 255);
      strokeWeight(1.5);
      line(x + 8 + cursorW, y + 5, x + 8 + cursorW, y + h - 5);
    }
  }

  if (typeof textFont === 'function') textFont('Viga');
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

    // 1. Header action buttons click check
    const bannerX = 14;
    const bannerY = 8;
    const bannerW = panelW - 28;
    const btnSetW = 125;
    const btnResetW = 125;
    const btnActionH = 24;
    const btnActionY = bannerY + 8;
    const btnResetX = bannerX + bannerW - btnResetW - 10;
    const btnSetX = btnResetX - btnSetW - 8;

    const setGX = globalPanelX + btnSetX;
    const setGY = globalPanelY + btnActionY;
    if (mx >= setGX && mx <= setGX + btnSetW && my >= setGY && my <= setGY + btnActionH) {
      for (const key of UPGRADE_KEYS) {
        const defaultCfg = DEFAULT_PLAYER_UPGRADE_CONFIGS[key];
        if (defaultCfg && state.levelEditorPlayerUpgrades[key]) {
          const firstVal = defaultCfg.values?.[0] !== undefined ? defaultCfg.values[0] : 0;
          const firstCost = defaultCfg.costs?.[0] !== undefined ? defaultCfg.costs[0] : 0;
          state.levelEditorPlayerUpgrades[key].statStr = String(firstVal);
          state.levelEditorPlayerUpgrades[key].costStr = String(firstCost);
          state.levelEditorPlayerUpgrades[key].values = [firstVal];
          state.levelEditorPlayerUpgrades[key].costs = [firstCost];
        }
      }
      state.activePlayerUpgradeInput = null;
      soundEngine.playSFX('btn_click');
      return true;
    }

    const resetGX = globalPanelX + btnResetX;
    const resetGY = globalPanelY + btnActionY;
    if (mx >= resetGX && mx <= resetGX + btnResetW && my >= resetGY && my <= resetGY + btnActionH) {
      for (const key of UPGRADE_KEYS) {
        if (state.levelEditorPlayerUpgrades[key]) {
          const isDefaultDisabled = DEFAULT_DISABLED_UPGRADES.has(key);
          state.levelEditorPlayerUpgrades[key].statStr = '';
          state.levelEditorPlayerUpgrades[key].costStr = '';
          state.levelEditorPlayerUpgrades[key].enabled = !isDefaultDisabled;
          state.levelEditorPlayerUpgrades[key].values = undefined;
          state.levelEditorPlayerUpgrades[key].costs = undefined;
        }
      }
      state.activePlayerUpgradeInput = null;
      soundEngine.playSFX('btn_click');
      return true;
    }

    // 2. Grid items click check
    const gridStartX = 14;
    const gridStartY = 54;
    const cardGap = 8;
    const gridW = panelW - 28;
    const cardW = (gridW - cardGap) / 2;
    const cardH = 98;
    const scrollY = state.editorPlayerUpgradesScrollY || 0;
    const viewportH = panelH - gridStartY - 10;

    // Check if click is inside grid viewport
    if (my < globalPanelY + gridStartY || my > globalPanelY + gridStartY + viewportH) {
      if (state.activePlayerUpgradeInput) {
        commitActivePlayerUpgradeInput();
        state.activePlayerUpgradeInput = null;
      }
      return true;
    }

    let clickedAny = false;

    for (let i = 0; i < UPGRADE_KEYS.length; i++) {
      const key = UPGRADE_KEYS[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cardX = gridStartX + col * (cardW + cardGap);
      const cardY = gridStartY + row * (cardH + cardGap);

      const cardGX = globalPanelX + cardX;
      const cardGY = globalPanelY + cardY + scrollY;

      const editorEntry = state.levelEditorPlayerUpgrades[key] || { statStr: '', costStr: '', enabled: !DEFAULT_DISABLED_UPGRADES.has(key) };
      const isEnabled = editorEntry.enabled !== undefined ? editorEntry.enabled : !DEFAULT_DISABLED_UPGRADES.has(key);

      // Check ON / OFF Toggle Button
      const btnW = 68;
      const btnH = 20;
      const btnX = cardW - btnW - 10;
      const btnY = 7;
      const btnGX = cardGX + btnX;
      const btnGY = cardGY + btnY;

      if (mx >= btnGX && mx <= btnGX + btnW && my >= btnGY && my <= btnGY + btnH) {
        editorEntry.enabled = !isEnabled;
        soundEngine.playSFX('btn_click');
        clickedAny = true;
        return true;
      }

      // Check Stat Input Box
      const fieldX = 10;
      const fieldW = cardW - 20;
      const fieldH = 24;

      const statRowY = 32;
      const statGX = cardGX + fieldX;
      const statGY = cardGY + statRowY;
      if (mx >= statGX && mx <= statGX + fieldW && my >= statGY && my <= statGY + fieldH) {
        commitActivePlayerUpgradeInput();
        const initialStr = editorEntry.statStr || '';
        const approxCharW = 5.8;
        const relX = mx - (statGX + 8);
        const clickedIdx = Math.max(0, Math.min(initialStr.length, Math.round(relX / approxCharW)));

        state.activePlayerUpgradeInput = {
          key,
          field: 'stat',
          textBuffer: initialStr,
          cursor: clickedIdx,
          selectionStart: clickedIdx,
          selectionEnd: clickedIdx,
          isDragging: true
        };
        clickedAny = true;
        return true;
      }

      // Check Cost Input Box
      const costRowY = 64;
      const costGX = cardGX + fieldX;
      const costGY = cardGY + costRowY;
      if (mx >= costGX && mx <= costGX + fieldW && my >= costGY && my <= costGY + fieldH) {
        commitActivePlayerUpgradeInput();
        const initialStr = editorEntry.costStr || '';
        const approxCharW = 5.8;
        const relX = mx - (costGX + 8);
        const clickedIdx = Math.max(0, Math.min(initialStr.length, Math.round(relX / approxCharW)));

        state.activePlayerUpgradeInput = {
          key,
          field: 'cost',
          textBuffer: initialStr,
          cursor: clickedIdx,
          selectionStart: clickedIdx,
          selectionEnd: clickedIdx,
          isDragging: true
        };
        clickedAny = true;
        return true;
      }
    }

    if (!clickedAny && state.activePlayerUpgradeInput) {
      commitActivePlayerUpgradeInput();
      state.activePlayerUpgradeInput = null;
    }
    return true;
  }

  return true;
}

function commitActivePlayerUpgradeInput() {
  if (!state.activePlayerUpgradeInput) return;
  const { key, field, textBuffer } = state.activePlayerUpgradeInput;
  if (!state.levelEditorPlayerUpgrades?.[key]) return;

  const entry = state.levelEditorPlayerUpgrades[key];
  if (field === 'stat') {
    entry.statStr = textBuffer;
  } else {
    entry.costStr = textBuffer;
  }
  parseAndSyncPlayerUpgrade(key);
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
    state.levelEditorPlayerUpgrades[uKey] = {
      statStr: '',
      costStr: '',
      enabled: !DEFAULT_DISABLED_UPGRADES.has(uKey),
      values: undefined,
      costs: undefined
    };
  }

  let buf = state.activePlayerUpgradeInput.textBuffer ?? (field === 'stat' ? state.levelEditorPlayerUpgrades[uKey].statStr : state.levelEditorPlayerUpgrades[uKey].costStr) ?? '';
  let cur = Math.max(0, Math.min(buf.length, state.activePlayerUpgradeInput.cursor ?? buf.length));
  let sStart = Math.max(0, Math.min(buf.length, state.activePlayerUpgradeInput.selectionStart ?? cur));
  let sEnd = Math.max(0, Math.min(buf.length, state.activePlayerUpgradeInput.selectionEnd ?? cur));
  const selMin = Math.min(sStart, sEnd);
  const selMax = Math.max(sStart, sEnd);
  const hasSelection = selMin < selMax;

  if (keyCode === 27 || keyCode === 13) {
    commitActivePlayerUpgradeInput();
    state.activePlayerUpgradeInput = null;
    return true;
  }

  // Tab key cycles through fields
  if (keyCode === 9) {
    commitActivePlayerUpgradeInput();
    const keyIdx = UPGRADE_KEYS.indexOf(uKey);
    if (field === 'stat') {
      const nextBuf = state.levelEditorPlayerUpgrades[uKey]?.costStr || '';
      state.activePlayerUpgradeInput = {
        key: uKey,
        field: 'cost',
        textBuffer: nextBuf,
        cursor: nextBuf.length,
        selectionStart: 0,
        selectionEnd: nextBuf.length
      };
    } else {
      const nextKey = UPGRADE_KEYS[(keyIdx + 1) % UPGRADE_KEYS.length];
      const nextBuf = state.levelEditorPlayerUpgrades[nextKey]?.statStr || '';
      state.activePlayerUpgradeInput = {
        key: nextKey,
        field: 'stat',
        textBuffer: nextBuf,
        cursor: nextBuf.length,
        selectionStart: 0,
        selectionEnd: nextBuf.length
      };
    }
    return true;
  }

  // Ctrl+A / Cmd+A
  if ((event?.ctrlKey || event?.metaKey) && (inputKey === 'a' || inputKey === 'A' || keyCode === 65)) {
    state.activePlayerUpgradeInput.selectionStart = 0;
    state.activePlayerUpgradeInput.selectionEnd = buf.length;
    state.activePlayerUpgradeInput.cursor = buf.length;
    return true;
  }

  // Left Arrow
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

  // Right Arrow
  if (keyCode === 39) {
    if (event?.shiftKey) {
      const next = Math.min(buf.length, sEnd + 1);
      state.activePlayerUpgradeInput.selectionEnd = next;
      state.activePlayerUpgradeInput.cursor = next;
    } else {
      const target = hasSelection ? selMax : Math.min(buf.length, cur + 1);
      state.activePlayerUpgradeInput.cursor = target;
      state.activePlayerUpgradeInput.selectionStart = target;
      state.activePlayerUpgradeInput.selectionEnd = target;
    }
    return true;
  }

  // Backspace
  if (keyCode === 8) {
    if (hasSelection) {
      buf = buf.substring(0, selMin) + buf.substring(selMax);
      cur = selMin;
    } else if (cur > 0) {
      buf = buf.substring(0, cur - 1) + buf.substring(cur);
      cur--;
    }
    state.activePlayerUpgradeInput.textBuffer = buf;
    state.activePlayerUpgradeInput.cursor = cur;
    state.activePlayerUpgradeInput.selectionStart = cur;
    state.activePlayerUpgradeInput.selectionEnd = cur;
    commitActivePlayerUpgradeInput();
    return true;
  }

  // Delete
  if (keyCode === 46) {
    if (hasSelection) {
      buf = buf.substring(0, selMin) + buf.substring(selMax);
      cur = selMin;
    } else if (cur < buf.length) {
      buf = buf.substring(0, cur) + buf.substring(cur + 1);
    }
    state.activePlayerUpgradeInput.textBuffer = buf;
    state.activePlayerUpgradeInput.cursor = cur;
    state.activePlayerUpgradeInput.selectionStart = cur;
    state.activePlayerUpgradeInput.selectionEnd = cur;
    commitActivePlayerUpgradeInput();
    return true;
  }

  // Printable characters (digits, comma, space, period, percent, minus)
  if (inputKey && inputKey.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (hasSelection) {
      buf = buf.substring(0, selMin) + inputKey + buf.substring(selMax);
      cur = selMin + 1;
    } else {
      buf = buf.substring(0, cur) + inputKey + buf.substring(cur);
      cur++;
    }
    state.activePlayerUpgradeInput.textBuffer = buf;
    state.activePlayerUpgradeInput.cursor = cur;
    state.activePlayerUpgradeInput.selectionStart = cur;
    state.activePlayerUpgradeInput.selectionEnd = cur;
    commitActivePlayerUpgradeInput();
    return true;
  }

  return false;
}

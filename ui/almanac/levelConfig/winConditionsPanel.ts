import { state } from '../../../state';
import { EditorLevelConfigData, ALL_CURRENCIES, getDynamicEnemyKeys } from './types';
import { renderTextInput } from './generalPanel';
import { ALL_ENEMY_TYPES_LIST } from '../../../levelEditor/types';
import { obstacleTypes, overlayTypes } from '../../../balanceObstacles';

declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const image: any;
declare const imageMode: any;
declare const LEFT: any;
declare const TOP: any;
declare const CENTER: any;
declare const mouseX: any;
declare const mouseY: any;

export const COMMON_OBSTACLE_TYPES = [
  { key: 'any', label: 'ANY OBSTACLE' },
  { key: 'o_dirt', label: 'Dirt' },
  { key: 'o_rock', label: 'Rock' },
  { key: 'o_hard_rock', label: 'Hard Rock' },
  { key: 'o_gold', label: 'Gold Ore' },
  { key: 'o_iron', label: 'Iron Ore' },
  { key: 'o_gem', label: 'Gem' },
  { key: 'o_tnt', label: 'TNT' },
  { key: 'o_growth_catalyst', label: 'Growth Catalyst' },
  { key: 'o_sun_generator', label: 'Sun Flower' },
  { key: 'o_ice_crystal', label: 'Ice Crystal' },
  { key: 'ov_flower_spawner', label: 'Flower Spawner' },
  { key: 'ov_spawner_elixir', label: 'Elixir Spawner' },
  { key: 'ov_mushroom_spawner', label: 'Mushroom Spawner' },
  { key: 'ov_bush_spawner', label: 'Bush Spawner' }
];

export function getWinConditionsPanelHeight(cfg: EditorLevelConfigData, cardW: number): number {
  let h = 34 + 28 + 14; // Top row

  // 1. Collect Resources: chips + active items
  h += 24; // Header
  h += 32; // Quick chip selector row
  const activeRes = Object.keys(cfg.collectResource || {});
  if (activeRes.length > 0) {
    h += Math.ceil(activeRes.length / 2) * 32 + 6;
  }
  h += 12;

  // 2. Hunt Enemies: chips + active items
  h += 24; // Header
  const allEnemies = [{ key: 'any', label: '★ ANY ENEMY' }, ...ALL_ENEMY_TYPES_LIST];
  let chipRows = 1;
  let cx = 0;
  const maxW = cardW - 28;
  for (const e of allEnemies) {
    const chipW = Math.max(48, e.label.length * 6 + 14);
    if (cx + chipW > maxW && cx > 0) {
      chipRows++;
      cx = 0;
    }
    cx += chipW + 4;
  }
  h += chipRows * 22 + 6;
  const activeHunts = Object.keys(cfg.huntEnemy || {});
  if (activeHunts.length > 0) {
    h += Math.ceil(activeHunts.length / 2) * 32 + 6;
  }
  h += 12;

  // 3. Break Obstacles: chips + active items
  h += 24; // Header
  let obsRows = 1;
  let ox = 0;
  for (const o of COMMON_OBSTACLE_TYPES) {
    const chipW = Math.max(48, o.label.length * 6 + 14);
    if (ox + chipW > maxW && ox > 0) {
      obsRows++;
      ox = 0;
    }
    ox += chipW + 4;
  }
  h += obsRows * 22 + 6;
  const activeObs = Object.keys(cfg.breakObstacle || {});
  if (activeObs.length > 0) {
    h += Math.ceil(activeObs.length / 2) * 32 + 6;
  }
  h += 20;

  return Math.max(220, h);
}

export function drawWinConditionsPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
): number {
  const cardH = getWinConditionsPanelHeight(cfg, cardW);

  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, cardH, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("LEVEL WIN CONDITIONS & OBJECTIVES", cardX + 14, curY + 12);

  // TOP ROW: Nights To Pass, Kill Budget, Destroy All Spawners
  const fieldH = 24;
  const row1Y = curY + 34;
  const colW = (cardW - 28 - 20) / 3;

  renderTextInput(cardX + 14, row1Y, colW, fieldH, "Nights To Pass (0 = none)", 'nightsToPass', cfg.nightsToPass || '', globalOffsetX, globalOffsetY);
  renderTextInput(cardX + 14 + colW + 10, row1Y, colW, fieldH, "Enemy Kill Budget (0 = none)", 'enemyBudgetValueToKill', cfg.enemyBudgetValueToKill || '', globalOffsetX, globalOffsetY);

  // Destroy Spawners Toggle Button
  const spawnerBtnX = cardX + 14 + (colW + 10) * 2;
  const spawnerBtnW = cardW - 28 - (colW + 10) * 2;
  const isDestroyOn = cfg.destroyAllEnemySpawners !== false;

  push();
  const gBtnX = globalOffsetX + spawnerBtnX;
  const gBtnY = globalOffsetY + row1Y;
  const isHovSpawner = mouseX >= gBtnX && mouseX <= gBtnX + spawnerBtnW && mouseY >= gBtnY && mouseY <= gBtnY + fieldH;

  fill(160, 185, 220);
  textAlign(LEFT, TOP);
  textSize(8.5);
  text("Destroy All Spawners", spawnerBtnX, row1Y - 12);

  if (isDestroyOn) {
    fill(isHovSpawner ? [30, 90, 60] : [20, 68, 45]);
    stroke(0, 255, 150);
    strokeWeight(1.2);
  } else {
    fill(isHovSpawner ? [50, 25, 35] : [35, 18, 25]);
    stroke(255, 80, 80);
    strokeWeight(1.2);
  }
  rect(spawnerBtnX, row1Y, spawnerBtnW, fieldH, 6);

  fill(255, 255, 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(9.5);
  text(isDestroyOn ? "✓ SPAWNERS REQUIRED (ON)" : "✕ SPAWNERS OPTIONAL (OFF)", spawnerBtnX + spawnerBtnW / 2, row1Y + fieldH / 2);
  pop();

  let sectionY = row1Y + fieldH + 18;

  // 1. COLLECT RESOURCE OBJECTIVES
  push();
  fill(100, 220, 255);
  textAlign(LEFT, TOP);
  textSize(10);
  text("1. RESOURCE COLLECTION TARGETS", cardX + 14, sectionY);
  sectionY += 16;

  // Render resource selection chips
  const resChipW = (cardW - 28 - (ALL_CURRENCIES.length - 1) * 4) / ALL_CURRENCIES.length;
  ALL_CURRENCIES.forEach((c, idx) => {
    const rx = cardX + 14 + idx * (resChipW + 4);
    const ry = sectionY;
    const isAct = (cfg.collectResource?.[c.key] || 0) > 0;
    const gRx = globalOffsetX + rx;
    const gRy = globalOffsetY + ry;
    const isHov = mouseX >= gRx && mouseX <= gRx + resChipW && mouseY >= gRy && mouseY <= gRy + 20;

    if (isAct) {
      fill(isHov ? [0, 160, 210] : [0, 120, 180]);
      stroke(0, 240, 255);
      strokeWeight(1.2);
    } else {
      fill(isHov ? [30, 40, 70] : [16, 22, 42]);
      stroke(40, 52, 85);
      strokeWeight(1);
    }
    rect(rx, ry, resChipW, 20, 4);

    fill(isAct ? 255 : (isHov ? 220 : 160));
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8.5);
    text(c.label.toUpperCase(), rx + resChipW / 2, ry + 10);
  });
  sectionY += 26;

  // Active resource targets cards
  const activeResKeys = Object.keys(cfg.collectResource || {});
  if (activeResKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    activeResKeys.forEach((k, idx) => {
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;
      const curAmt = cfg.collectResource[k] || 0;
      const resDef = ALL_CURRENCIES.find(c => c.key === k);

      fill(14, 18, 34);
      stroke(0, 180, 220, 180);
      strokeWeight(1);
      rect(ax, ay, cardColW, 26, 5);

      fill(255, 255, 255);
      noStroke();
      textAlign(LEFT, CENTER);
      textSize(9);
      text(`Collect ${resDef?.label || k.toUpperCase()}:`, ax + 10, ay + 13);

      // Value field input
      renderTextInput(ax + cardColW - 120, ay + 3, 50, 20, "", `win_res_${k}`, String(curAmt), globalOffsetX, globalOffsetY);

      // [-] and [+] and [x] buttons
      drawMiniAdjBtn(ax + cardColW - 65, ay + 3, 16, 20, "-", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 45, ay + 3, 16, 20, "+", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 24, ay + 3, 16, 20, "✕", globalOffsetX, globalOffsetY, true);
    });
    sectionY += Math.ceil(activeResKeys.length / 2) * 32 + 6;
  }
  sectionY += 8;
  pop();

  // 2. HUNT ENEMY OBJECTIVES
  push();
  fill(100, 220, 255);
  textAlign(LEFT, TOP);
  textSize(10);
  text("2. HUNT ENEMY TARGETS", cardX + 14, sectionY);
  sectionY += 16;

  const allEnemyOptions = [{ key: 'any', label: '★ ANY ENEMY' }, ...ALL_ENEMY_TYPES_LIST];
  let curHuntChipX = cardX + 14;
  let curHuntChipY = sectionY;
  const maxW = cardX + cardW - 14;

  allEnemyOptions.forEach((e) => {
    const chipW = Math.max(50, e.label.length * 6 + 14);
    if (curHuntChipX + chipW > maxW && curHuntChipX > cardX + 14) {
      curHuntChipX = cardX + 14;
      curHuntChipY += 22;
    }
    const isAct = (cfg.huntEnemy?.[e.key] || 0) > 0;
    const gHx = globalOffsetX + curHuntChipX;
    const gHy = globalOffsetY + curHuntChipY;
    const isHov = mouseX >= gHx && mouseX <= gHx + chipW && mouseY >= gHy && mouseY <= gHy + 18;

    if (isAct) {
      fill(isHov ? [200, 80, 80] : [150, 45, 55]);
      stroke(255, 120, 120);
      strokeWeight(1.2);
    } else {
      fill(isHov ? [30, 40, 70] : [16, 22, 42]);
      stroke(40, 52, 85);
      strokeWeight(1);
    }
    rect(curHuntChipX, curHuntChipY, chipW, 18, 4);

    fill(isAct ? 255 : (isHov ? 220 : 160));
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8.5);
    text(e.label, curHuntChipX + chipW / 2, curHuntChipY + 9);

    curHuntChipX += chipW + 4;
  });
  sectionY = curHuntChipY + 24;

  // Active enemy hunt cards
  const activeHuntKeys = Object.keys(cfg.huntEnemy || {});
  if (activeHuntKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    activeHuntKeys.forEach((k, idx) => {
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;
      const curAmt = cfg.huntEnemy[k] || 0;
      const eDef = allEnemyOptions.find(e => e.key === k);

      fill(14, 18, 34);
      stroke(255, 100, 100, 180);
      strokeWeight(1);
      rect(ax, ay, cardColW, 26, 5);

      fill(255, 255, 255);
      noStroke();
      textAlign(LEFT, CENTER);
      textSize(9);
      text(`Hunt ${eDef?.label || k}:`, ax + 10, ay + 13);

      renderTextInput(ax + cardColW - 120, ay + 3, 50, 20, "", `win_hunt_${k}`, String(curAmt), globalOffsetX, globalOffsetY);

      drawMiniAdjBtn(ax + cardColW - 65, ay + 3, 16, 20, "-", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 45, ay + 3, 16, 20, "+", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 24, ay + 3, 16, 20, "✕", globalOffsetX, globalOffsetY, true);
    });
    sectionY += Math.ceil(activeHuntKeys.length / 2) * 32 + 6;
  }
  sectionY += 8;
  pop();

  // 3. BREAK OBSTACLES OBJECTIVES
  push();
  fill(100, 220, 255);
  textAlign(LEFT, TOP);
  textSize(10);
  text("3. BREAK OBSTACLE TARGETS", cardX + 14, sectionY);
  sectionY += 16;

  let curObsChipX = cardX + 14;
  let curObsChipY = sectionY;

  COMMON_OBSTACLE_TYPES.forEach((o) => {
    const chipW = Math.max(50, o.label.length * 6 + 14);
    if (curObsChipX + chipW > maxW && curObsChipX > cardX + 14) {
      curObsChipX = cardX + 14;
      curObsChipY += 22;
    }
    const isAct = (cfg.breakObstacle?.[o.key] || 0) > 0;
    const gOx = globalOffsetX + curObsChipX;
    const gOy = globalOffsetY + curObsChipY;
    const isHov = mouseX >= gOx && mouseX <= gOx + chipW && mouseY >= gOy && mouseY <= gOy + 18;

    if (isAct) {
      fill(isHov ? [220, 160, 40] : [160, 110, 20]);
      stroke(255, 210, 80);
      strokeWeight(1.2);
    } else {
      fill(isHov ? [30, 40, 70] : [16, 22, 42]);
      stroke(40, 52, 85);
      strokeWeight(1);
    }
    rect(curObsChipX, curObsChipY, chipW, 18, 4);

    fill(isAct ? 255 : (isHov ? 220 : 160));
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8.5);
    text(o.label, curObsChipX + chipW / 2, curObsChipY + 9);

    curObsChipX += chipW + 4;
  });
  sectionY = curObsChipY + 24;

  // Active obstacle break cards
  const activeObsKeys = Object.keys(cfg.breakObstacle || {});
  if (activeObsKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    activeObsKeys.forEach((k, idx) => {
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;
      const curAmt = cfg.breakObstacle[k] || 0;
      const oDef = COMMON_OBSTACLE_TYPES.find(o => o.key === k);

      fill(14, 18, 34);
      stroke(255, 200, 80, 180);
      strokeWeight(1);
      rect(ax, ay, cardColW, 26, 5);

      fill(255, 255, 255);
      noStroke();
      textAlign(LEFT, CENTER);
      textSize(9);
      text(`Break ${oDef?.label || k}:`, ax + 10, ay + 13);

      renderTextInput(ax + cardColW - 120, ay + 3, 50, 20, "", `win_obs_${k}`, String(curAmt), globalOffsetX, globalOffsetY);

      drawMiniAdjBtn(ax + cardColW - 65, ay + 3, 16, 20, "-", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 45, ay + 3, 16, 20, "+", globalOffsetX, globalOffsetY);
      drawMiniAdjBtn(ax + cardColW - 24, ay + 3, 16, 20, "✕", globalOffsetX, globalOffsetY, true);
    });
  }
  pop();

  return cardH;
}

function drawMiniAdjBtn(
  bx: number, by: number, bw: number, bh: number,
  label: string,
  globalOffsetX: number, globalOffsetY: number,
  isDanger = false
) {
  push();
  const gBx = globalOffsetX + bx;
  const gBy = globalOffsetY + by;
  const isHov = mouseX >= gBx && mouseX <= gBx + bw && mouseY >= gBy && mouseY <= gBy + bh;

  if (isDanger) {
    fill(isHov ? [180, 40, 50] : [80, 20, 30]);
    stroke(isHov ? [255, 100, 100] : [140, 40, 50]);
  } else {
    fill(isHov ? [35, 60, 95] : [20, 32, 55]);
    stroke(isHov ? [0, 220, 255] : [50, 80, 120]);
  }
  strokeWeight(1);
  rect(bx, by, bw, bh, 3);

  fill(255, 255, 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(label === '✕' ? 8 : 11);
  text(label, bx + bw / 2, by + bh / 2);
  pop();
}

export function handleWinConditionsPanelClick(
  contentX: number, contentY: number,
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData
): boolean {
  const cardH = getWinConditionsPanelHeight(cfg, cardW);
  if (contentX < cardX || contentX > cardX + cardW || contentY < curY || contentY > curY + cardH) {
    return false;
  }

  const fieldH = 24;
  const row1Y = curY + 34;
  const colW = (cardW - 28 - 20) / 3;

  // Nights To Pass input click
  if (contentY >= row1Y && contentY <= row1Y + fieldH) {
    if (contentX >= cardX + 14 && contentX <= cardX + 14 + colW) {
      const val = String(cfg.nightsToPass ?? '');
      state.activeLevelConfigInput = { field: 'nightsToPass', textBuffer: val, cursor: val.length, selectionStart: 0, selectionEnd: val.length, isDragging: true };
      return true;
    }
    if (contentX >= cardX + 14 + colW + 10 && contentX <= cardX + 14 + colW * 2 + 10) {
      const val = String(cfg.enemyBudgetValueToKill ?? '');
      state.activeLevelConfigInput = { field: 'enemyBudgetValueToKill', textBuffer: val, cursor: val.length, selectionStart: 0, selectionEnd: val.length, isDragging: true };
      return true;
    }
    // Destroy All Spawners button click
    const spawnerBtnX = cardX + 14 + (colW + 10) * 2;
    const spawnerBtnW = cardW - 28 - (colW + 10) * 2;
    if (contentX >= spawnerBtnX && contentX <= spawnerBtnX + spawnerBtnW) {
      cfg.destroyAllEnemySpawners = !(cfg.destroyAllEnemySpawners !== false);
      return true;
    }
  }

  let sectionY = row1Y + fieldH + 18 + 16;

  // 1. Resource chips click
  const resChipW = (cardW - 28 - (ALL_CURRENCIES.length - 1) * 4) / ALL_CURRENCIES.length;
  if (contentY >= sectionY && contentY <= sectionY + 20) {
    for (let idx = 0; idx < ALL_CURRENCIES.length; idx++) {
      const c = ALL_CURRENCIES[idx];
      const rx = cardX + 14 + idx * (resChipW + 4);
      if (contentX >= rx && contentX <= rx + resChipW) {
        if (!cfg.collectResource) cfg.collectResource = {};
        if ((cfg.collectResource[c.key] || 0) > 0) {
          delete cfg.collectResource[c.key];
        } else {
          cfg.collectResource[c.key] = 20;
        }
        return true;
      }
    }
  }
  sectionY += 26;

  // Active Resource item cards click ([-] [+] [✕] or input)
  const activeResKeys = Object.keys(cfg.collectResource || {});
  if (activeResKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    for (let idx = 0; idx < activeResKeys.length; idx++) {
      const k = activeResKeys[idx];
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;

      if (contentX >= ax && contentX <= ax + cardColW && contentY >= ay && contentY <= ay + 26) {
        // Check input field
        const inpX = ax + cardColW - 120;
        if (contentX >= inpX && contentX <= inpX + 50) {
          const val = String(cfg.collectResource[k] || 0);
          state.activeLevelConfigInput = { field: `win_res_${k}`, textBuffer: val, cursor: val.length, selectionStart: 0, selectionEnd: val.length, isDragging: true };
          return true;
        }
        // [-]
        const minusX = ax + cardColW - 65;
        if (contentX >= minusX && contentX <= minusX + 16) {
          const nextVal = Math.max(1, (cfg.collectResource[k] || 0) - 5);
          cfg.collectResource[k] = nextVal;
          return true;
        }
        // [+]
        const plusX = ax + cardColW - 45;
        if (contentX >= plusX && contentX <= plusX + 16) {
          cfg.collectResource[k] = (cfg.collectResource[k] || 0) + 5;
          return true;
        }
        // [✕]
        const delX = ax + cardColW - 24;
        if (contentX >= delX && contentX <= delX + 16) {
          delete cfg.collectResource[k];
          return true;
        }
      }
    }
    sectionY += Math.ceil(activeResKeys.length / 2) * 32 + 6;
  }
  sectionY += 8 + 16;

  // 2. Hunt Enemy chips click
  const allEnemyOptions = [{ key: 'any', label: '★ ANY ENEMY' }, ...ALL_ENEMY_TYPES_LIST];
  let curHuntChipX = cardX + 14;
  let curHuntChipY = sectionY;
  const maxW = cardX + cardW - 14;

  for (const e of allEnemyOptions) {
    const chipW = Math.max(50, e.label.length * 6 + 14);
    if (curHuntChipX + chipW > maxW && curHuntChipX > cardX + 14) {
      curHuntChipX = cardX + 14;
      curHuntChipY += 22;
    }
    if (contentX >= curHuntChipX && contentX <= curHuntChipX + chipW && contentY >= curHuntChipY && contentY <= curHuntChipY + 18) {
      if (!cfg.huntEnemy) cfg.huntEnemy = {};
      if ((cfg.huntEnemy[e.key] || 0) > 0) {
        delete cfg.huntEnemy[e.key];
      } else {
        cfg.huntEnemy[e.key] = e.key === 'any' ? 30 : 10;
      }
      return true;
    }
    curHuntChipX += chipW + 4;
  }
  sectionY = curHuntChipY + 24;

  // Active Enemy Hunt item cards click
  const activeHuntKeys = Object.keys(cfg.huntEnemy || {});
  if (activeHuntKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    for (let idx = 0; idx < activeHuntKeys.length; idx++) {
      const k = activeHuntKeys[idx];
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;

      if (contentX >= ax && contentX <= ax + cardColW && contentY >= ay && contentY <= ay + 26) {
        const inpX = ax + cardColW - 120;
        if (contentX >= inpX && contentX <= inpX + 50) {
          const val = String(cfg.huntEnemy[k] || 0);
          state.activeLevelConfigInput = { field: `win_hunt_${k}`, textBuffer: val, cursor: val.length, selectionStart: 0, selectionEnd: val.length, isDragging: true };
          return true;
        }
        const minusX = ax + cardColW - 65;
        if (contentX >= minusX && contentX <= minusX + 16) {
          const step = k === 'any' ? 5 : 1;
          const nextVal = Math.max(1, (cfg.huntEnemy[k] || 0) - step);
          cfg.huntEnemy[k] = nextVal;
          return true;
        }
        const plusX = ax + cardColW - 45;
        if (contentX >= plusX && contentX <= plusX + 16) {
          const step = k === 'any' ? 5 : 1;
          cfg.huntEnemy[k] = (cfg.huntEnemy[k] || 0) + step;
          return true;
        }
        const delX = ax + cardColW - 24;
        if (contentX >= delX && contentX <= delX + 16) {
          delete cfg.huntEnemy[k];
          return true;
        }
      }
    }
    sectionY += Math.ceil(activeHuntKeys.length / 2) * 32 + 6;
  }
  sectionY += 8 + 16;

  // 3. Break Obstacle chips click
  let curObsChipX = cardX + 14;
  let curObsChipY = sectionY;

  for (const o of COMMON_OBSTACLE_TYPES) {
    const chipW = Math.max(50, o.label.length * 6 + 14);
    if (curObsChipX + chipW > maxW && curObsChipX > cardX + 14) {
      curObsChipX = cardX + 14;
      curObsChipY += 22;
    }
    if (contentX >= curObsChipX && contentX <= curObsChipX + chipW && contentY >= curObsChipY && contentY <= curObsChipY + 18) {
      if (!cfg.breakObstacle) cfg.breakObstacle = {};
      if ((cfg.breakObstacle[o.key] || 0) > 0) {
        delete cfg.breakObstacle[o.key];
      } else {
        cfg.breakObstacle[o.key] = o.key === 'any' ? 50 : 15;
      }
      return true;
    }
    curObsChipX += chipW + 4;
  }
  sectionY = curObsChipY + 24;

  // Active Obstacle Break item cards click
  const activeObsKeys = Object.keys(cfg.breakObstacle || {});
  if (activeObsKeys.length > 0) {
    const cardColW = (cardW - 28 - 10) / 2;
    for (let idx = 0; idx < activeObsKeys.length; idx++) {
      const k = activeObsKeys[idx];
      const colIdx = idx % 2;
      const rowIdx = Math.floor(idx / 2);
      const ax = cardX + 14 + colIdx * (cardColW + 10);
      const ay = sectionY + rowIdx * 32;

      if (contentX >= ax && contentX <= ax + cardColW && contentY >= ay && contentY <= ay + 26) {
        const inpX = ax + cardColW - 120;
        if (contentX >= inpX && contentX <= inpX + 50) {
          const val = String(cfg.breakObstacle[k] || 0);
          state.activeLevelConfigInput = { field: `win_obs_${k}`, textBuffer: val, cursor: val.length, selectionStart: 0, selectionEnd: val.length, isDragging: true };
          return true;
        }
        const minusX = ax + cardColW - 65;
        if (contentX >= minusX && contentX <= minusX + 16) {
          const step = k === 'any' ? 5 : 1;
          const nextVal = Math.max(1, (cfg.breakObstacle[k] || 0) - step);
          cfg.breakObstacle[k] = nextVal;
          return true;
        }
        const plusX = ax + cardColW - 45;
        if (contentX >= plusX && contentX <= plusX + 16) {
          const step = k === 'any' ? 5 : 1;
          cfg.breakObstacle[k] = (cfg.breakObstacle[k] || 0) + step;
          return true;
        }
        const delX = ax + cardColW - 24;
        if (contentX >= delX && contentX <= delX + 16) {
          delete cfg.breakObstacle[k];
          return true;
        }
      }
    }
  }

  return true;
}

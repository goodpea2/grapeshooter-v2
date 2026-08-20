import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { ALL_ENEMY_TYPES_LIST } from './types';

declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const line: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const textWidth: any;
declare const LEFT: any;
declare const CENTER: any;
declare const RIGHT: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const floor: any;
declare const constrain: any;

export function isMouseOverSpawnerTooltip(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return false;

  const tipW = 290;
  const tipH = 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);

  return mouseX >= tipX && mouseX <= tipX + tipW && mouseY >= tipY && mouseY <= tipY + tipH;
}

export function openToolbarSpawnerTooltip(key: string) {
  const oCfg = overlayTypes[key] || {};
  const spCfg = oCfg.enemySpawnConfig || {};
  state.levelEditor.toolbarSpawnerTooltip = {
    key: key,
    name: oCfg.name || (key === 'ov_spawner_custom' ? 'Custom Spawner' : key),
    config: {
      budget: spCfg.budget !== undefined ? spCfg.budget : 60,
      enemyTypeKey: spCfg.enemyTypeKey ? [...spCfg.enemyTypeKey] : ['e_basic'],
      spawnRadius: spCfg.spawnRadius !== undefined ? spCfg.spawnRadius : 120,
      spawnTriggerRadius: spCfg.spawnTriggerRadius !== undefined ? spCfg.spawnTriggerRadius : 200,
      spawnInterval: spCfg.spawnInterval !== undefined ? spCfg.spawnInterval : 60,
      spawnIntervalConsumeBudget: spCfg.spawnIntervalConsumeBudget !== false,
      health: oCfg.minHealth || 300
    }
  };
}

export function syncToolbarSpawnerTooltipToPrefab() {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip || !tip.key) return;

  if (!overlayTypes[tip.key]) {
    overlayTypes[tip.key] = {
      name: tip.name,
      minHealth: tip.config.health,
      isEnemy: true,
      isEnemySpawner: true,
      danger: 3,
      isDanger: true,
      obstacleOverlayVfx: 'v_spawner',
      isConcealedAlongWithObstacle: false,
      enemySpawnConfig: { ...tip.config },
      assetImgConfig: { idleAssetImg: ['img_spawner_a'], randomRotation: true, randomFlip: true },
      lootConfigOnDeath: 'lc_spawner',
      isCustomPrefab: true
    };
  } else {
    overlayTypes[tip.key].name = tip.name;
    overlayTypes[tip.key].minHealth = tip.config.health;
    overlayTypes[tip.key].enemySpawnConfig = { ...tip.config };
  }

  if (state.levelEditor.customSpawnerPrefabs) {
    const p = state.levelEditor.customSpawnerPrefabs.find((pr: any) => pr.id === tip.key);
    if (p) {
      p.name = tip.name;
      p.config = { ...tip.config };
    }
  }
}

export function drawWorldHoverSpawnerTooltip(blk: any, oCfg: any, topBarH: number, paletteH: number) {
  const spCfg = blk.customSpawnerConfig || oCfg.enemySpawnConfig || {};
  const spName = blk.customSpawnerConfig?.name || oCfg.name || 'Spawner';
  const budget = spCfg.budget !== undefined ? spCfg.budget : (blk.spawnerBudget || 60);
  const intVal = spCfg.spawnInterval !== undefined ? spCfg.spawnInterval : 60;
  const intStr = intVal < 0 ? 'Death Only' : `${intVal}f (${(intVal / 60).toFixed(1)}s)`;
  const trigVal = spCfg.spawnTriggerRadius !== undefined ? spCfg.spawnTriggerRadius : 200;
  const trigStr = trigVal < 0 ? 'Global' : `${trigVal}px`;
  const spawnRad = spCfg.spawnRadius !== undefined ? spCfg.spawnRadius : 120;
  const health = blk.health || oCfg.minHealth || 300;
  const enemyTypesList: string[] = spCfg.enemyTypeKey || ['e_basic'];

  const screenPos = {
    x: (blk.pos.x + GRID_SIZE / 2) - state.cameraPos.x + width / 2,
    y: (blk.pos.y + GRID_SIZE / 2) - state.cameraPos.y + height / 2
  };

  const tipW = 230;
  const tipH = 220;
  let tipX = screenPos.x + GRID_SIZE + 10;
  if (tipX + tipW > width - 15) {
    tipX = screenPos.x - tipW - GRID_SIZE - 10;
  }
  tipX = constrain(tipX, 15, width - tipW - 15);
  let tipY = constrain(screenPos.y - 30, topBarH + 10, height - paletteH - tipH - 10);

  push();
  // Container
  fill(12, 16, 30, 245);
  stroke(70, 110, 200);
  strokeWeight(1.5);
  rect(tipX, tipY, tipW, tipH, 8);

  // Header Title
  fill(255, 205, 60);
  textAlign(LEFT, CENTER);
  textSize(10);
  text("SPAWNER", tipX + 10, tipY + 14);

  let curY = tipY + 28;

  // Name display
  fill(20, 28, 52);
  stroke(50, 70, 120);
  strokeWeight(1);
  rect(tipX + 10, curY, tipW - 20, 18, 4);

  fill(255, 230, 140);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(8.5);
  text("Name: " + spName, tipX + 14, curY + 9);

  curY += 23;

  // Stats Rows
  const renderStatRow = (label: string, val: string) => {
    fill(170, 190, 220);
    textAlign(LEFT, CENTER);
    textSize(8);
    text(label, tipX + 12, curY + 7);

    fill(255, 220, 100);
    textAlign(RIGHT, CENTER);
    text(val, tipX + tipW - 12, curY + 7);

    stroke(30, 42, 75);
    strokeWeight(1);
    line(tipX + 10, curY + 16, tipX + tipW - 10, curY + 16);
    noStroke();

    curY += 17;
  };

  renderStatRow("Budget", `${budget}`);
  renderStatRow("Interval", intStr);
  renderStatRow("Trigger Range", trigStr);
  renderStatRow("Spawn Radius", `${spawnRad}px`);
  renderStatRow("Health", `${health}`);

  // Enemy Types display
  fill(170, 190, 220);
  textAlign(LEFT, CENTER);
  textSize(7.5);
  text("Enemies:", tipX + 12, curY + 7);
  curY += 14;

  let chipX = tipX + 12;
  const chipH = 13;
  for (const ek of enemyTypesList) {
    const found = ALL_ENEMY_TYPES_LIST.find(e => e.key === ek);
    const label = found ? found.label : ek.replace('e_', '');
    textSize(6.5);
    const cw = textWidth(label) + 8;
    if (chipX + cw > tipX + tipW - 12) {
      chipX = tipX + 12;
      curY += chipH + 2;
    }
    fill(255, 170, 0, 220);
    stroke(255, 210, 60);
    strokeWeight(1);
    rect(chipX, curY, cw, chipH, 3);

    noStroke();
    fill(20, 15, 10);
    textAlign(CENTER, CENTER);
    text(label, chipX + cw / 2, curY + chipH / 2);

    chipX += cw + 3;
  }

  pop();
}

export function drawToolbarSpawnerTooltip(topBarH: number, paletteH: number) {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return;

  const tipW = 290;
  const tipH = 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);
  const cfg = tip.config;

  push();
  // Container Box
  fill(12, 15, 28, 248);
  stroke(60, 100, 190);
  strokeWeight(1.5);
  rect(tipX, tipY, tipW, tipH, 8);

  // Header Title
  fill(255, 205, 60);
  textAlign(LEFT, CENTER);
  textSize(11);
  text("SPAWNER PREFAB CONFIG", tipX + 10, tipY + 16);

  // Close Button
  const closeBtnX = tipX + tipW - 22;
  const closeBtnY = tipY + 7;
  const isCloseHov = mouseX >= closeBtnX && mouseX <= closeBtnX + 16 && mouseY >= closeBtnY && mouseY <= closeBtnY + 16;
  fill(isCloseHov ? [220, 50, 50] : [40, 50, 80]);
  noStroke();
  rect(closeBtnX, closeBtnY, 16, 16, 3);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(10);
  text("✕", closeBtnX + 8, closeBtnY + 8);

  let curY = tipY + 34;

  // 1. Spawner Name Editable Input Row
  fill(180, 200, 230);
  textAlign(LEFT, CENTER);
  textSize(9);
  text("Name:", tipX + 10, curY + 10);

  const nameBoxX = tipX + 48;
  const nameBoxW = tipW - 58;
  const nameBoxH = 20;
  const isNameFocus = state.levelEditor.activeSpawnerInput?.field === 'name';
  const isNameHov = mouseX >= nameBoxX && mouseX <= nameBoxX + nameBoxW && mouseY >= curY && mouseY <= curY + nameBoxH;

  fill(isNameFocus ? [18, 30, 58] : (isNameHov ? [22, 28, 50] : [14, 18, 34]));
  stroke(isNameFocus ? [0, 220, 255] : (isNameHov ? [70, 110, 180] : [40, 55, 95]));
  strokeWeight(isNameFocus ? 1.5 : 1);
  rect(nameBoxX, curY, nameBoxW, nameBoxH, 4);

  const nameVal = isNameFocus ? state.levelEditor.activeSpawnerInput!.textBuffer : (tip.name || 'Custom Spawner');
  fill(isNameFocus ? [255, 255, 255] : [240, 230, 150]);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9);
  const blink = (isNameFocus && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
  text(nameVal + blink, nameBoxX + 6, curY + nameBoxH / 2);

  curY += 26;

  // 2. Prefab Action Buttons (Add Prefab / Remove Prefab)
  const halfBtnW = (tipW - 26) / 2;
  const btnH = 20;

  // [+ Add Prefab]
  const addBtnX = tipX + 10;
  const isAddHov = mouseX >= addBtnX && mouseX <= addBtnX + halfBtnW && mouseY >= curY && mouseY <= curY + btnH;
  fill(isAddHov ? [35, 95, 60] : [20, 65, 40]);
  stroke(isAddHov ? [60, 220, 130] : [35, 140, 80]);
  strokeWeight(1);
  rect(addBtnX, curY, halfBtnW, btnH, 4);
  fill(240, 255, 240);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(8.5);
  text("+ Add Prefab", addBtnX + halfBtnW / 2, curY + btnH / 2);

  // [- Remove Prefab]
  const remBtnX = tipX + 10 + halfBtnW + 6;
  const isCustomPrefab = (tip.key && overlayTypes[tip.key]?.isCustomPrefab) || (state.levelEditor.customSpawnerPrefabs && state.levelEditor.customSpawnerPrefabs.some((p: any) => p.id === tip.key));
  const isRemHov = isCustomPrefab && mouseX >= remBtnX && mouseX <= remBtnX + halfBtnW && mouseY >= curY && mouseY <= curY + btnH;
  fill(isCustomPrefab ? (isRemHov ? [130, 40, 40] : [85, 25, 25]) : [30, 30, 40]);
  stroke(isCustomPrefab ? (isRemHov ? [255, 80, 80] : [150, 45, 45]) : [50, 50, 65]);
  strokeWeight(1);
  rect(remBtnX, curY, halfBtnW, btnH, 4);
  fill(isCustomPrefab ? [255, 230, 230] : [120, 120, 140]);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(8.5);
  text("- Remove Prefab", remBtnX + halfBtnW / 2, curY + btnH / 2);

  curY += 26;

  // Divider
  stroke(35, 50, 90);
  strokeWeight(1);
  line(tipX + 8, curY, tipX + tipW - 8, curY);

  curY += 8;

  // 3. Numeric Stepper & Input Rows
  const rowH = 22;
  const labelX = tipX + 10;
  const valBoxX = tipX + 130;
  const valBoxW = 68;
  const btnSize = 18;

  const renderEditableStepper = (field: string, label: string, displayVal: string) => {
    noStroke();
    fill(180, 200, 230);
    textAlign(LEFT, CENTER);
    textSize(9);
    text(label, labelX, curY + 10);

    // [-] Button
    const minusX = valBoxX;
    const isMinusHov = mouseX >= minusX && mouseX <= minusX + btnSize && mouseY >= curY && mouseY <= curY + btnSize;
    fill(isMinusHov ? [50, 80, 140] : [25, 35, 65]);
    stroke(45, 65, 110);
    strokeWeight(1);
    rect(minusX, curY, btnSize, btnSize, 3);
    fill(230);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(11);
    text("-", minusX + btnSize / 2, curY + btnSize / 2);

    // Editable Value Box
    const inputX = minusX + btnSize + 3;
    const isFieldFocus = state.levelEditor.activeSpawnerInput?.field === field;
    const isBoxHov = mouseX >= inputX && mouseX <= inputX + valBoxW && mouseY >= curY && mouseY <= curY + btnSize;
    fill(isFieldFocus ? [18, 30, 58] : (isBoxHov ? [22, 28, 50] : [15, 20, 38]));
    stroke(isFieldFocus ? [0, 220, 255] : (isBoxHov ? [60, 90, 160] : [35, 50, 85]));
    strokeWeight(isFieldFocus ? 1.5 : 1);
    rect(inputX, curY, valBoxW, btnSize, 3);

    const shownText = isFieldFocus ? state.levelEditor.activeSpawnerInput!.textBuffer : displayVal;
    fill(isFieldFocus ? [255, 255, 255] : [255, 220, 100]);
    noStroke();
    textSize(8.5);
    textAlign(CENTER, CENTER);
    const cursor = (isFieldFocus && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
    text(shownText + cursor, inputX + valBoxW / 2, curY + btnSize / 2);

    // [+] Button
    const plusX = inputX + valBoxW + 3;
    const isPlusHov = mouseX >= plusX && mouseX <= plusX + btnSize && mouseY >= curY && mouseY <= curY + btnSize;
    fill(isPlusHov ? [50, 80, 140] : [25, 35, 65]);
    stroke(45, 65, 110);
    strokeWeight(1);
    rect(plusX, curY, btnSize, btnSize, 3);
    fill(230);
    noStroke();
    textSize(11);
    text("+", plusX + btnSize / 2, curY + btnSize / 2);

    curY += rowH;
  };

  // Budget
  renderEditableStepper('budget', 'Budget', `${cfg.budget ?? 60}`);

  // Interval
  const intVal = cfg.spawnInterval ?? 60;
  const intStr = intVal < 0 ? 'Death Only' : `${intVal}f (${(intVal / 60).toFixed(1)}s)`;
  renderEditableStepper('spawnInterval', 'Interval', intStr);

  // Trigger Range
  const trigVal = cfg.spawnTriggerRadius ?? 200;
  const trigStr = trigVal < 0 ? 'Global' : `${trigVal}px`;
  renderEditableStepper('spawnTriggerRadius', 'Trig Range', trigStr);

  // Spawn Radius
  renderEditableStepper('spawnRadius', 'Spawn Rad', `${cfg.spawnRadius ?? 120}px`);

  // Health
  renderEditableStepper('health', 'Health', `${cfg.health ?? 300}`);

  // 4. Enemy Type Chips Selection
  curY += 2;
  noStroke();
  fill(180, 200, 230);
  textAlign(LEFT, CENTER);
  textSize(8.5);
  text("Enemy Types (Click to toggle):", labelX, curY + 6);
  curY += 14;

  let chipX = tipX + 10;
  const chipH = 15;
  const activeTypes: string[] = cfg.enemyTypeKey || ['e_basic'];

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(7.5);
    const chipW = textWidth(choice.label) + 8;

    if (chipX + chipW > tipX + tipW - 10) {
      chipX = tipX + 10;
      curY += chipH + 3;
    }

    const isActive = activeTypes.includes(choice.key);
    const isChipHov = mouseX >= chipX && mouseX <= chipX + chipW && mouseY >= curY && mouseY <= curY + chipH;

    if (isActive) {
      fill(255, 170, 0, 230);
      stroke(255, 210, 60);
    } else if (isChipHov) {
      fill(45, 65, 110);
      stroke(70, 100, 160);
    } else {
      fill(20, 26, 48);
      stroke(35, 45, 75);
    }
    strokeWeight(1);
    rect(chipX, curY, chipW, chipH, 3);

    noStroke();
    fill(isActive ? [20, 15, 10] : [200, 215, 240]);
    textAlign(CENTER, CENTER);
    text(choice.label, chipX + chipW / 2, curY + chipH / 2);

    chipX += chipW + 3;
  }

  pop();
}

export function handleSpawnerKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (state.currentScreen !== 'level_editor' || !state.levelEditor.activeSpawnerInput || !state.levelEditor.toolbarSpawnerTooltip) {
    return false;
  }
  const activeInput = state.levelEditor.activeSpawnerInput;
  const tip = state.levelEditor.toolbarSpawnerTooltip;

  // Enter or Escape commits and defocuses
  if (keyCodeNum === 13 || keyCodeNum === 27) {
    applySpawnerInputBuffer(tip, activeInput);
    state.levelEditor.activeSpawnerInput = null;
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    activeInput.textBuffer = activeInput.textBuffer.slice(0, -1);
    applySpawnerInputBuffer(tip, activeInput);
    return true;
  }

  // Normal text typing
  if (keyStr && keyStr.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (activeInput.field === 'name') {
      if (activeInput.textBuffer.length < 24) {
        activeInput.textBuffer += keyStr;
        applySpawnerInputBuffer(tip, activeInput);
      }
      return true;
    } else {
      if ((keyStr >= '0' && keyStr <= '9') || (keyStr === '-' && activeInput.textBuffer.length === 0)) {
        if (activeInput.textBuffer.length < 6) {
          activeInput.textBuffer += keyStr;
          applySpawnerInputBuffer(tip, activeInput);
        }
        return true;
      }
    }
  }

  return false;
}

function applySpawnerInputBuffer(tip: any, activeInput: { field: string; textBuffer: string }) {
  if (activeInput.field === 'name') {
    tip.name = activeInput.textBuffer;
  } else {
    const num = parseInt(activeInput.textBuffer, 10);
    if (!isNaN(num)) {
      if (activeInput.field === 'budget') {
        tip.config.budget = num;
      } else if (activeInput.field === 'spawnInterval') {
        tip.config.spawnInterval = num;
      } else if (activeInput.field === 'spawnTriggerRadius') {
        tip.config.spawnTriggerRadius = num;
      } else if (activeInput.field === 'spawnRadius') {
        tip.config.spawnRadius = num;
      } else if (activeInput.field === 'health') {
        tip.config.health = num;
      }
    }
  }
  syncToolbarSpawnerTooltipToPrefab();
}

export function handleToolbarSpawnerTooltipClick(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return false;

  const tipW = 290;
  const tipH = 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);
  const cfg = tip.config;

  // Check if click is inside tooltip bounds
  if (mouseX < tipX || mouseX > tipX + tipW || mouseY < tipY || mouseY > tipY + tipH) {
    return false;
  }

  // Close Button Click
  const closeBtnX = tipX + tipW - 22;
  const closeBtnY = tipY + 7;
  if (mouseX >= closeBtnX && mouseX <= closeBtnX + 16 && mouseY >= closeBtnY && mouseY <= closeBtnY + 16) {
    state.levelEditor.toolbarSpawnerTooltip = null;
    state.levelEditor.activeSpawnerInput = null;
    return true;
  }

  let curY = tipY + 34;

  // Name Box Click
  const nameBoxX = tipX + 48;
  const nameBoxW = tipW - 58;
  const nameBoxH = 20;
  if (mouseX >= nameBoxX && mouseX <= nameBoxX + nameBoxW && mouseY >= curY && mouseY <= curY + nameBoxH) {
    state.levelEditor.activeSpawnerInput = { field: 'name', textBuffer: tip.name || 'Custom Spawner' };
    return true;
  }

  curY += 26;

  // Prefab Action Buttons
  const halfBtnW = (tipW - 26) / 2;
  const btnH = 20;

  // [+ Add Prefab]
  const addBtnX = tipX + 10;
  if (mouseX >= addBtnX && mouseX <= addBtnX + halfBtnW && mouseY >= curY && mouseY <= curY + btnH) {
    const prefabId = `ov_spawner_p_${Date.now()}`;
    const prefabName = tip.name || `Spawner (${(cfg.enemyTypeKey || ['e_basic']).map((k: string) => k.replace('e_', '')).join(', ')})`;
    const newPrefab = {
      id: prefabId,
      name: prefabName,
      config: {
        budget: cfg.budget ?? 60,
        enemyTypeKey: [...(cfg.enemyTypeKey || ['e_basic'])],
        spawnRadius: cfg.spawnRadius ?? 120,
        spawnTriggerRadius: cfg.spawnTriggerRadius ?? 200,
        spawnInterval: cfg.spawnInterval ?? 60,
        spawnIntervalConsumeBudget: cfg.spawnIntervalConsumeBudget !== false,
        health: cfg.health ?? 300
      }
    };
    if (!state.levelEditor.customSpawnerPrefabs) state.levelEditor.customSpawnerPrefabs = [];
    state.levelEditor.customSpawnerPrefabs.push(newPrefab);

    overlayTypes[prefabId] = {
      name: prefabName,
      minHealth: newPrefab.config.health,
      isEnemy: true,
      isEnemySpawner: true,
      danger: 3,
      isDanger: true,
      obstacleOverlayVfx: 'v_spawner',
      isConcealedAlongWithObstacle: false,
      enemySpawnConfig: { ...newPrefab.config },
      assetImgConfig: { idleAssetImg: ['img_spawner_a'], randomRotation: true, randomFlip: true },
      lootConfigOnDeath: 'lc_spawner',
      isCustomPrefab: true
    };

    state.levelEditor.selectedItemKey = prefabId;
    state.levelEditor.activeCategory = 'overlays';
    state.levelEditor.activeSpawnerInput = null;
    openToolbarSpawnerTooltip(prefabId);
    return true;
  }

  // [- Remove Prefab]
  const remBtnX = tipX + 10 + halfBtnW + 6;
  const isCustomPrefab = (tip.key && overlayTypes[tip.key]?.isCustomPrefab) || (state.levelEditor.customSpawnerPrefabs && state.levelEditor.customSpawnerPrefabs.some((p: any) => p.id === tip.key));
  if (isCustomPrefab && mouseX >= remBtnX && mouseX <= remBtnX + halfBtnW && mouseY >= curY && mouseY <= curY + btnH) {
    const curOverlayKey = tip.key;
    if (state.levelEditor.customSpawnerPrefabs) {
      state.levelEditor.customSpawnerPrefabs = state.levelEditor.customSpawnerPrefabs.filter((p: any) => p.id !== curOverlayKey);
    }
    delete overlayTypes[curOverlayKey];
    state.levelEditor.selectedItemKey = 'ov_spawner_custom';
    openToolbarSpawnerTooltip('ov_spawner_custom');
    state.levelEditor.activeSpawnerInput = null;
    return true;
  }

  curY += 26 + 8;

  // Numeric Stepper and Input clicks
  const rowH = 22;
  const valBoxX = tipX + 130;
  const valBoxW = 68;
  const btnSize = 18;

  const checkStepperClick = (field: string, curVal: number, onMinus: () => void, onPlus: () => void) => {
    const minusX = valBoxX;
    if (mouseX >= minusX && mouseX <= minusX + btnSize && mouseY >= curY && mouseY <= curY + btnSize) {
      onMinus();
      syncToolbarSpawnerTooltipToPrefab();
      state.levelEditor.activeSpawnerInput = null;
      return true;
    }
    const inputX = minusX + btnSize + 3;
    if (mouseX >= inputX && mouseX <= inputX + valBoxW && mouseY >= curY && mouseY <= curY + btnSize) {
      state.levelEditor.activeSpawnerInput = { field, textBuffer: curVal.toString() };
      return true;
    }
    const plusX = inputX + valBoxW + 3;
    if (mouseX >= plusX && mouseX <= plusX + btnSize && mouseY >= curY && mouseY <= curY + btnSize) {
      onPlus();
      syncToolbarSpawnerTooltipToPrefab();
      state.levelEditor.activeSpawnerInput = null;
      return true;
    }
    return false;
  };

  // 1. Budget
  if (checkStepperClick(
    'budget',
    cfg.budget ?? 60,
    () => { cfg.budget = Math.max(10, (cfg.budget ?? 60) - 20); },
    () => { cfg.budget = Math.min(2000, (cfg.budget ?? 60) + 20); }
  )) return true;
  curY += rowH;

  // 2. Interval
  if (checkStepperClick(
    'spawnInterval',
    cfg.spawnInterval ?? 60,
    () => {
      const cur = cfg.spawnInterval ?? 60;
      if (cur <= 15) cfg.spawnInterval = -1;
      else cfg.spawnInterval = cur - 15;
    },
    () => {
      const cur = cfg.spawnInterval ?? 60;
      if (cur < 0) cfg.spawnInterval = 15;
      else cfg.spawnInterval = Math.min(360, cur + 15);
    }
  )) return true;
  curY += rowH;

  // 3. Trigger Radius
  if (checkStepperClick(
    'spawnTriggerRadius',
    cfg.spawnTriggerRadius ?? 200,
    () => {
      const cur = cfg.spawnTriggerRadius ?? 200;
      if (cur <= 60) cfg.spawnTriggerRadius = -1;
      else cfg.spawnTriggerRadius = cur - 20;
    },
    () => {
      const cur = cfg.spawnTriggerRadius ?? 200;
      if (cur < 0) cfg.spawnTriggerRadius = 60;
      else cfg.spawnTriggerRadius = Math.min(600, cur + 20);
    }
  )) return true;
  curY += rowH;

  // 4. Spawn Radius
  if (checkStepperClick(
    'spawnRadius',
    cfg.spawnRadius ?? 120,
    () => { cfg.spawnRadius = Math.max(30, (cfg.spawnRadius ?? 120) - 20); },
    () => { cfg.spawnRadius = Math.min(600, (cfg.spawnRadius ?? 120) + 20); }
  )) return true;
  curY += rowH;

  // 5. Health
  if (checkStepperClick(
    'health',
    cfg.health ?? 300,
    () => {
      cfg.health = Math.max(50, (cfg.health ?? 300) - 50);
    },
    () => {
      cfg.health = Math.min(5000, (cfg.health ?? 300) + 50);
    }
  )) return true;
  curY += rowH;

  // 6. Enemy Chips
  curY += 16;
  let chipX = tipX + 10;
  const chipH = 15;
  if (!cfg.enemyTypeKey) cfg.enemyTypeKey = ['e_basic'];

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(7.5);
    const chipW = textWidth(choice.label) + 8;

    if (chipX + chipW > tipX + tipW - 10) {
      chipX = tipX + 10;
      curY += chipH + 3;
    }

    if (mouseX >= chipX && mouseX <= chipX + chipW && mouseY >= curY && mouseY <= curY + chipH) {
      const idx = cfg.enemyTypeKey.indexOf(choice.key);
      if (idx >= 0) {
        if (cfg.enemyTypeKey.length > 1) {
          cfg.enemyTypeKey.splice(idx, 1);
        }
      } else {
        cfg.enemyTypeKey.push(choice.key);
      }
      syncToolbarSpawnerTooltipToPrefab();
      state.levelEditor.activeSpawnerInput = null;
      return true;
    }

    chipX += chipW + 3;
  }

  state.levelEditor.activeSpawnerInput = null;
  return true;
}

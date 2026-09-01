import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { liquidTypes } from '../balanceLiquids';
import { ALL_ENEMY_TYPES_LIST } from './types';
import {
  drawCard,
  drawCloseButton,
  CloseButton,
  drawGreenButton,
  drawRedButton,
  drawButton,
  registerUIHitbox
} from '../uiComponents';
import { color } from '../uiColors';

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
declare const textStyle: any;
declare const LEFT: any;
declare const CENTER: any;
declare const RIGHT: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const floor: any;
declare const constrain: any;

export function isMouseOverSpawnerTooltip(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return false;

  const isLiquid = tip.isLiquid || tip.key === 'l_spawner' || tip.key.startsWith('l_spawner') || !!liquidTypes[tip.key];
  const tipW = 290;
  const tipH = isLiquid ? 490 : 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);

  return mouseX >= tipX && mouseX <= tipX + tipW && mouseY >= tipY && mouseY <= tipY + tipH;
}

export function openToolbarSpawnerTooltip(key: string) {
  const isLiquid = key === 'l_spawner' || key.startsWith('l_spawner') || !!liquidTypes[key] || state.levelEditor.activeCategory === 'liquids';
  const oCfg = isLiquid ? (liquidTypes[key] || {}) : (overlayTypes[key] || {});
  const spCfg = oCfg.enemySpawnConfig || {};
  state.levelEditor.toolbarSpawnerTooltip = {
    key: key,
    isLiquid: isLiquid,
    name: oCfg.name || (isLiquid ? (key === 'l_spawner' ? 'Ground Spawner' : key) : (key === 'ov_spawner_custom' ? 'Custom Spawner' : key)),
    config: {
      budget: spCfg.budget !== undefined ? spCfg.budget : 60,
      enemyTypeKey: spCfg.enemyTypeKey ? [...spCfg.enemyTypeKey] : ['e_basic'],
      spawnRadius: spCfg.spawnRadius !== undefined ? spCfg.spawnRadius : 120,
      spawnTriggerRadius: spCfg.spawnTriggerRadius !== undefined ? spCfg.spawnTriggerRadius : 200,
      spawnInterval: spCfg.spawnInterval !== undefined ? spCfg.spawnInterval : 60,
      spawnIntervalConsumeBudget: spCfg.spawnIntervalConsumeBudget !== false,
      health: oCfg.minHealth || 300,
      hourlySpawnConfig: spCfg.hourlySpawnConfig ? { ...spCfg.hourlySpawnConfig } : {
        enabled: isLiquid,
        hourlyBudgetMultiplier: 1.0,
        hourlyBudgetAdd: 0,
        selfDestructAfterBudgetSpawned: 0
      }
    }
  };
}

export function syncToolbarSpawnerTooltipToPrefab() {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip || !tip.key) return;

  const isLiquid = tip.isLiquid || tip.key === 'l_spawner' || tip.key.startsWith('l_spawner') || !!liquidTypes[tip.key];
  if (isLiquid) {
    if (!liquidTypes[tip.key]) {
      liquidTypes[tip.key] = {
        name: tip.name,
        color: [140, 30, 180, 220],
        glowColor: [200, 60, 240, 90],
        pulseSpeed: 0.04,
        isDanger: true,
        isEnemySpawner: true,
        assetImgConfig: { idleAssetImg: ['img_ground_spawner_a'], randomRotation: false, randomFlip: false },
        liquidConfig: {
          playerMovementSpeedMultiplier: 1.0,
          enemyMovementSpeedMultiplier: 1.0,
          turretFireRateMultiplier: 1.0,
          blocksMovement: false
        },
        enemySpawnConfig: { ...tip.config },
        isCustomPrefab: true
      };
    } else {
      liquidTypes[tip.key].name = tip.name;
      liquidTypes[tip.key].enemySpawnConfig = { ...tip.config };
    }
  } else {
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
  // Container Card
  drawCard(tipX, tipY, tipW, tipH, {
    radius: 12,
    layer: 100,
    bgColor: [15, 18, 35, 245],
    borderColor: [54, 62, 114, 255]
  });

  // Header Title
  fill(...color.yellow());
  textAlign(LEFT, CENTER);
  textSize(11);
  textStyle(BOLD);
  text("SPAWNER", tipX + 12, tipY + 16);

  let curY = tipY + 30;

  // Name display pill
  fill(...color.veryDarkBlue());
  stroke(...color.lightBlue(100));
  strokeWeight(1);
  rect(tipX + 10, curY, tipW - 20, 20, 6);

  fill(...color.yellow());
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9);
  text("Name: " + spName, tipX + 16, curY + 10);

  curY += 26;

  // Stats Rows
  const renderStatRow = (label: string, val: string) => {
    fill(...color.lightBlue(220));
    textAlign(LEFT, CENTER);
    textSize(9);
    text(label, tipX + 12, curY + 8);

    fill(...color.yellow());
    textAlign(RIGHT, CENTER);
    text(val, tipX + tipW - 12, curY + 8);

    stroke(...color.darkBlue(180));
    strokeWeight(1);
    line(tipX + 10, curY + 17, tipX + tipW - 10, curY + 17);
    noStroke();

    curY += 18;
  };

  renderStatRow("Budget", `${budget}`);
  renderStatRow("Interval", intStr);
  renderStatRow("Trigger Range", trigStr);
  renderStatRow("Spawn Radius", `${spawnRad}px`);
  renderStatRow("Health", `${health}`);

  // Enemy Types display
  fill(...color.lightBlue(220));
  textAlign(LEFT, CENTER);
  textSize(8.5);
  text("Enemies:", tipX + 12, curY + 8);
  curY += 16;

  let chipX = tipX + 12;
  const chipH = 16;
  for (const ek of enemyTypesList) {
    const found = ALL_ENEMY_TYPES_LIST.find(e => e.key === ek);
    const label = found ? found.label : ek.replace('e_', '');
    textSize(7.5);
    const cw = textWidth(label) + 10;
    if (chipX + cw > tipX + tipW - 12) {
      chipX = tipX + 12;
      curY += chipH + 3;
    }
    fill(...color.yellow(220));
    stroke(...color.yellow());
    strokeWeight(1);
    rect(chipX, curY, cw, chipH, 4);

    noStroke();
    fill(...color.veryDarkBlue());
    textAlign(CENTER, CENTER);
    text(label, chipX + cw / 2, curY + chipH / 2);

    chipX += cw + 4;
  }

  textStyle(NORMAL);
  pop();
}

export function drawToolbarSpawnerTooltip(topBarH: number, paletteH: number) {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return;

  const isLiquid = tip.isLiquid || tip.key === 'l_spawner' || tip.key.startsWith('l_spawner') || !!liquidTypes[tip.key];
  const tipW = 290;
  const tipH = isLiquid ? 490 : 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);
  const cfg = tip.config;
  const layer = 120;

  push();
  // Container Box using drawCard
  drawCard(tipX, tipY, tipW, tipH, {
    radius: 16,
    layer,
    bgColor: [15, 18, 35, 250],
    borderColor: [54, 62, 114, 255]
  });

  // Header Title
  fill(...color.yellow());
  textAlign(LEFT, CENTER);
  textSize(11.5);
  textStyle(BOLD);
  text("SPAWNER PREFAB CONFIG", tipX + 12, tipY + 18);

  // CloseButton [X]
  CloseButton(tipX + tipW - 32, tipY + 8, 24, () => {
    state.levelEditor.toolbarSpawnerTooltip = null;
    state.levelEditor.activeSpawnerInput = null;
    state.levelEditor.isWorldDragActive = false;
  }, { layer: layer + 10, id: 'sp_close_btn' });

  let curY = tipY + 36;

  // 1. Spawner Name Editable Input Row
  fill(...color.lightBlue(220));
  textAlign(LEFT, CENTER);
  textSize(9.5);
  text("Name:", tipX + 12, curY + 11);

  const nameBoxX = tipX + 50;
  const nameBoxW = tipW - 62;
  const nameBoxH = 22;
  const isNameFocus = state.levelEditor.activeSpawnerInput?.field === 'name';

  drawCard(nameBoxX, curY, nameBoxW, nameBoxH, {
    id: 'sp_input_name',
    radius: 6,
    layer: layer + 5,
    isSelected: isNameFocus,
    isHoverable: true,
    bgColor: isNameFocus ? [25, 34, 65, 255] : [12, 15, 30, 220],
    borderColor: isNameFocus ? [56, 189, 248, 255] : [40, 50, 90, 255],
    onClick: () => {
      state.levelEditor.activeSpawnerInput = { field: 'name', textBuffer: tip.name || 'Custom Spawner' };
    }
  });

  const nameVal = isNameFocus ? state.levelEditor.activeSpawnerInput!.textBuffer : (tip.name || 'Custom Spawner');
  fill(isNameFocus ? [255, 255, 255] : [...color.yellow()]);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9.5);
  const blink = (isNameFocus && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
  text(nameVal + blink, nameBoxX + 8, curY + nameBoxH / 2);

  curY += 28;

  // 2. Prefab Action Buttons (Add Prefab / Remove Prefab) using drawGreenButton and drawRedButton
  const halfBtnW = (tipW - 28) / 2;
  const btnH = 22;

  // [+ Add Prefab]
  const addBtnX = tipX + 10;
  drawGreenButton(addBtnX, curY, halfBtnW, btnH, '+ Add Prefab', {
    id: 'sp_btn_add_prefab',
    layer: layer + 5,
    fontSize: 9,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      const isLiquid = tip.isLiquid || tip.key === 'l_spawner' || tip.key.startsWith('l_spawner') || !!liquidTypes[tip.key] || state.levelEditor.activeCategory === 'liquids';
      const prefabId = isLiquid ? `l_spawner_p_${Date.now()}` : `ov_spawner_p_${Date.now()}`;
      const defaultName = isLiquid ? 'Ground Spawner' : 'Spawner';
      const prefabName = tip.name || `${defaultName} (${(cfg.enemyTypeKey || ['e_basic']).map((k: string) => k.replace('e_', '')).join(', ')})`;
      const newPrefab = {
        id: prefabId,
        category: isLiquid ? 'liquids' : 'overlays',
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

      if (isLiquid) {
        liquidTypes[prefabId] = {
          name: prefabName,
          color: [140, 30, 180, 220],
          glowColor: [200, 60, 240, 90],
          pulseSpeed: 0.04,
          isDanger: true,
          isEnemySpawner: true,
          assetImgConfig: { idleAssetImg: ['img_ground_spawner_a'], randomRotation: false, randomFlip: false },
          liquidConfig: {
            playerMovementSpeedMultiplier: 1.0,
            enemyMovementSpeedMultiplier: 1.0,
            turretFireRateMultiplier: 1.0,
            blocksMovement: false
          },
          enemySpawnConfig: { ...newPrefab.config },
          isCustomPrefab: true
        };
        state.levelEditor.selectedItemKey = prefabId;
        state.levelEditor.activeCategory = 'liquids';
      } else {
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
      }

      state.levelEditor.activeSpawnerInput = null;
      openToolbarSpawnerTooltip(prefabId);
    }
  });

  // [- Remove Prefab]
  const remBtnX = tipX + 10 + halfBtnW + 8;
  const isCustomPrefab = (tip.key && (overlayTypes[tip.key]?.isCustomPrefab || liquidTypes[tip.key]?.isCustomPrefab)) || (state.levelEditor.customSpawnerPrefabs && state.levelEditor.customSpawnerPrefabs.some((p: any) => p.id === tip.key));
  drawRedButton(remBtnX, curY, halfBtnW, btnH, '- Remove Prefab', {
    id: 'sp_btn_rem_prefab',
    layer: layer + 5,
    fontSize: 9,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      if (!isCustomPrefab) return;
      const curKey = tip.key;
      const isLiquid = tip.isLiquid || curKey.startsWith('l_spawner') || !!liquidTypes[curKey];
      if (state.levelEditor.customSpawnerPrefabs) {
        state.levelEditor.customSpawnerPrefabs = state.levelEditor.customSpawnerPrefabs.filter((p: any) => p.id !== curKey);
      }
      if (isLiquid) {
        delete liquidTypes[curKey];
        state.levelEditor.selectedItemKey = 'l_spawner';
        state.levelEditor.activeCategory = 'liquids';
        openToolbarSpawnerTooltip('l_spawner');
      } else {
        delete overlayTypes[curKey];
        state.levelEditor.selectedItemKey = 'ov_spawner_custom';
        state.levelEditor.activeCategory = 'overlays';
        openToolbarSpawnerTooltip('ov_spawner_custom');
      }
      state.levelEditor.activeSpawnerInput = null;
    }
  });

  curY += 28;

  // Divider
  stroke(...color.darkBlue(180));
  strokeWeight(1);
  line(tipX + 10, curY, tipX + tipW - 10, curY);

  curY += 8;

  // 3. Numeric Stepper & Input Rows
  const rowH = 23;
  const labelX = tipX + 12;
  const valBoxX = tipX + 126;
  const valBoxW = 72;
  const btnSize = 20;

  const renderEditableStepper = (
    field: string,
    label: string,
    displayVal: string,
    rawVal: number,
    onMinus: () => void,
    onPlus: () => void
  ) => {
    noStroke();
    fill(...color.lightBlue(220));
    textAlign(LEFT, CENTER);
    textSize(9.5);
    text(label, labelX, curY + 11);

    // [-] Button
    const minusX = valBoxX;
    drawRedButton(minusX, curY, btnSize, btnSize, '-', {
      id: `sp_dec_${field}`,
      layer: layer + 5,
      fontSize: 12,
      radius: 4,
      depth3D: 1,
      onClick: () => {
        onMinus();
        syncToolbarSpawnerTooltipToPrefab();
        state.levelEditor.activeSpawnerInput = null;
      }
    });

    // Editable Value Box
    const inputX = minusX + btnSize + 4;
    const isFieldFocus = state.levelEditor.activeSpawnerInput?.field === field;

    drawCard(inputX, curY, valBoxW, btnSize, {
      id: `sp_val_${field}`,
      radius: 4,
      layer: layer + 5,
      isSelected: isFieldFocus,
      isHoverable: true,
      bgColor: isFieldFocus ? [25, 34, 65, 255] : [12, 15, 30, 220],
      borderColor: isFieldFocus ? [56, 189, 248, 255] : [35, 45, 80, 255],
      onClick: () => {
        state.levelEditor.activeSpawnerInput = { field, textBuffer: rawVal.toString() };
      }
    });

    const shownText = isFieldFocus ? state.levelEditor.activeSpawnerInput!.textBuffer : displayVal;
    fill(isFieldFocus ? [255, 255, 255] : [...color.yellow()]);
    noStroke();
    textSize(9);
    textAlign(CENTER, CENTER);
    const cursor = (isFieldFocus && floor(((window as any).frameCount || 0) / 30) % 2 === 0) ? '|' : '';
    text(shownText + cursor, inputX + valBoxW / 2, curY + btnSize / 2);

    // [+] Button
    const plusX = inputX + valBoxW + 4;
    drawGreenButton(plusX, curY, btnSize, btnSize, '+', {
      id: `sp_inc_${field}`,
      layer: layer + 5,
      fontSize: 12,
      radius: 4,
      depth3D: 1,
      onClick: () => {
        onPlus();
        syncToolbarSpawnerTooltipToPrefab();
        state.levelEditor.activeSpawnerInput = null;
      }
    });

    curY += rowH;
  };

  // Budget
  renderEditableStepper(
    'budget',
    'Budget',
    `${cfg.budget ?? 60}`,
    cfg.budget ?? 60,
    () => { cfg.budget = Math.max(10, (cfg.budget ?? 60) - 20); },
    () => { cfg.budget = Math.min(2000, (cfg.budget ?? 60) + 20); }
  );

  // Interval
  const intVal = cfg.spawnInterval ?? 60;
  const intStr = intVal < 0 ? 'Death Only' : `${intVal}f (${(intVal / 60).toFixed(1)}s)`;
  renderEditableStepper(
    'spawnInterval',
    'Interval',
    intStr,
    intVal,
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
  );

  // Trigger Range
  const trigVal = cfg.spawnTriggerRadius ?? 200;
  const trigStr = trigVal < 0 ? 'Global' : `${trigVal}px`;
  renderEditableStepper(
    'spawnTriggerRadius',
    'Trig Range',
    trigStr,
    trigVal,
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
  );

  // Spawn Radius
  renderEditableStepper(
    'spawnRadius',
    'Spawn Rad',
    `${cfg.spawnRadius ?? 120}px`,
    cfg.spawnRadius ?? 120,
    () => { cfg.spawnRadius = Math.max(30, (cfg.spawnRadius ?? 120) - 20); },
    () => { cfg.spawnRadius = Math.min(600, (cfg.spawnRadius ?? 120) + 20); }
  );

  // Health (for overlays) or Hourly Controls (for liquid ground spawner)
  if (!isLiquid) {
    renderEditableStepper(
      'health',
      'Health',
      `${cfg.health ?? 300}`,
      cfg.health ?? 300,
      () => {
        cfg.health = Math.max(50, (cfg.health ?? 300) - 50);
      },
      () => {
        cfg.health = Math.min(5000, (cfg.health ?? 300) + 50);
      }
    );
  } else {
    if (!cfg.hourlySpawnConfig) {
      cfg.hourlySpawnConfig = {
        enabled: true,
        hourlyBudgetMultiplier: 1.0,
        hourlyBudgetAdd: 0,
        selfDestructAfterBudgetSpawned: 0
      };
    }
    const hCfg = cfg.hourlySpawnConfig;

    renderEditableStepper(
      'hourlyBudgetMultiplier',
      'Hourly Mult',
      `x${(hCfg.hourlyBudgetMultiplier ?? 1.0).toFixed(1)}`,
      hCfg.hourlyBudgetMultiplier ?? 1.0,
      () => {
        hCfg.hourlyBudgetMultiplier = Math.max(0.1, Number(((hCfg.hourlyBudgetMultiplier ?? 1.0) - 0.2).toFixed(1)));
      },
      () => {
        hCfg.hourlyBudgetMultiplier = Math.min(10.0, Number(((hCfg.hourlyBudgetMultiplier ?? 1.0) + 0.2).toFixed(1)));
      }
    );

    renderEditableStepper(
      'hourlyBudgetAdd',
      'Hourly Add',
      `+${hCfg.hourlyBudgetAdd ?? 0}`,
      hCfg.hourlyBudgetAdd ?? 0,
      () => {
        hCfg.hourlyBudgetAdd = Math.max(0, (hCfg.hourlyBudgetAdd ?? 0) - 20);
      },
      () => {
        hCfg.hourlyBudgetAdd = Math.min(2000, (hCfg.hourlyBudgetAdd ?? 0) + 20);
      }
    );

    renderEditableStepper(
      'selfDestructAfterBudgetSpawned',
      'Self Destruct',
      hCfg.selfDestructAfterBudgetSpawned > 0 ? `${hCfg.selfDestructAfterBudgetSpawned} bg` : 'Never',
      hCfg.selfDestructAfterBudgetSpawned ?? 0,
      () => {
        hCfg.selfDestructAfterBudgetSpawned = Math.max(0, (hCfg.selfDestructAfterBudgetSpawned ?? 0) - 50);
      },
      () => {
        hCfg.selfDestructAfterBudgetSpawned = Math.min(5000, (hCfg.selfDestructAfterBudgetSpawned ?? 0) + 50);
      }
    );
  }

  // 4. Enemy Type Chips Selection
  curY += 2;
  noStroke();
  fill(...color.lightBlue(220));
  textAlign(LEFT, CENTER);
  textSize(9);
  text("Enemy Types (Click to toggle):", labelX, curY + 6);
  curY += 15;

  let chipX = tipX + 10;
  const chipH = 16;
  const activeTypes: string[] = cfg.enemyTypeKey || ['e_basic'];

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(8);
    const chipW = textWidth(choice.label) + 10;

    if (chipX + chipW > tipX + tipW - 10) {
      chipX = tipX + 10;
      curY += chipH + 4;
    }

    const isActive = activeTypes.includes(choice.key);

    drawButton(chipX, curY, chipW, chipH, choice.label, {
      id: `sp_enemy_chip_${choice.key}`,
      layer: layer + 5,
      fontSize: 8,
      radius: 4,
      depth3D: 1,
      variant: isActive ? 'yellow' : 'dark',
      onClick: () => {
        if (!cfg.enemyTypeKey) cfg.enemyTypeKey = ['e_basic'];
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
      }
    });

    chipX += chipW + 4;
  }

  textStyle(NORMAL);
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
    const num = parseFloat(activeInput.textBuffer);
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
      } else if (activeInput.field === 'hourlyBudgetMultiplier') {
        if (!tip.config.hourlySpawnConfig) tip.config.hourlySpawnConfig = { enabled: true };
        tip.config.hourlySpawnConfig.hourlyBudgetMultiplier = num;
      } else if (activeInput.field === 'hourlyBudgetAdd') {
        if (!tip.config.hourlySpawnConfig) tip.config.hourlySpawnConfig = { enabled: true };
        tip.config.hourlySpawnConfig.hourlyBudgetAdd = num;
      } else if (activeInput.field === 'selfDestructAfterBudgetSpawned') {
        if (!tip.config.hourlySpawnConfig) tip.config.hourlySpawnConfig = { enabled: true };
        tip.config.hourlySpawnConfig.selfDestructAfterBudgetSpawned = num;
      }
    }
  }
  syncToolbarSpawnerTooltipToPrefab();
}

export function handleToolbarSpawnerTooltipClick(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSpawnerTooltip;
  if (!tip) return false;

  const isLiquid = tip.isLiquid || tip.key === 'l_spawner' || tip.key.startsWith('l_spawner') || !!liquidTypes[tip.key];
  const tipW = 290;
  const tipH = isLiquid ? 490 : 410;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);

  // Check if click is inside tooltip bounds
  if (mouseX < tipX || mouseX > tipX + tipW || mouseY < tipY || mouseY > tipY + tipH) {
    return false;
  }

  // Click is inside tooltip; strictly prevent canvas world drag
  state.levelEditor.isWorldDragActive = false;
  return true;
}

// ---------------------------------------------------------------------------
// SUN GENERATOR TOOLBAR TOOLTIP
// ---------------------------------------------------------------------------

export function isMouseOverSunGeneratorTooltip(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSunGeneratorTooltip;
  if (!tip) return false;

  const tipW = 280;
  const tipH = 175;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);

  return mouseX >= tipX && mouseX <= tipX + tipW && mouseY >= tipY && mouseY <= tipY + tipH;
}

export function openToolbarSunGeneratorTooltip(gx?: number, gy?: number) {
  let damagePerSun = 600;
  let maxSun = 100;
  if (gx !== undefined && gy !== undefined && state.world) {
    const block = state.world.getBlock(gx, gy);
    if (block?.sunGeneratorConfig) {
      damagePerSun = block.sunGeneratorConfig.damagePerSun ?? 600;
      maxSun = block.sunGeneratorConfig.maxSun ?? 100;
    }
  } else {
    const oCfg = overlayTypes['sunGenerator'] || {};
    damagePerSun = oCfg.damagePerSun !== undefined ? oCfg.damagePerSun : 600;
    maxSun = oCfg.maxSunDropped !== undefined ? oCfg.maxSunDropped : 100;
  }
  state.levelEditor.toolbarSunGeneratorTooltip = {
    key: 'sunGenerator',
    name: 'Sun Generator',
    gx,
    gy,
    config: {
      damagePerSun,
      maxSun
    }
  };
}

export function syncToolbarSunGeneratorTooltip() {
  const tip = state.levelEditor.toolbarSunGeneratorTooltip;
  if (!tip) return;
  if (tip.gx !== undefined && tip.gy !== undefined && state.world) {
    const block = state.world.getBlock(tip.gx, tip.gy);
    if (block) {
      block.sunGeneratorConfig = {
        damagePerSun: tip.config.damagePerSun,
        maxSun: tip.config.maxSun,
        accumulatedDamage: 0,
        sunsDropped: 0
      };
      const cx = floor(tip.gx / CHUNK_SIZE);
      const cy = floor(tip.gy / CHUNK_SIZE);
      state.world.dirtyChunkAndNeighbors(cx, cy);
    }
  }
  if (!overlayTypes['sunGenerator']) {
    overlayTypes['sunGenerator'] = {
      name: 'Sun Generator',
      minHealth: -1,
      isValuable: true,
      isEnemy: false,
      isValidTarget: true,
      damagePerSun: tip.config.damagePerSun,
      maxSunDropped: tip.config.maxSun,
      obstacleOverlayVfx: 'v_sun_generator',
      isConcealedAlongWithObstacle: false,
      assetImgConfig: { idleAssetImg: ['img_sun_generator'], randomRotation: false, randomFlip: false }
    };
  } else {
    overlayTypes['sunGenerator'].damagePerSun = tip.config.damagePerSun;
    overlayTypes['sunGenerator'].maxSunDropped = tip.config.maxSun;
  }
}

export function drawToolbarSunGeneratorTooltip(topBarH: number, paletteH: number) {
  const tip = state.levelEditor.toolbarSunGeneratorTooltip;
  if (!tip) return;

  const tipW = 280;
  const tipH = 175;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);
  const layer = 80;

  push();
  drawCard(tipX, tipY, tipW, tipH, {
    radius: 10,
    layer,
    id: 'le_toolbar_sungenerator_tooltip_bg',
    bgColor: [15, 18, 35, 250],
    borderColor: [54, 62, 114, 255]
  });

  // Header Title
  textAlign(LEFT, CENTER);
  textSize(12);
  textStyle(BOLD);
  noStroke();
  fill(...color.yellow());
  text("Sun Generator Config", tipX + 12, tipY + 18);

  // CloseButton [X]
  CloseButton(tipX + tipW - 32, tipY + 8, 24, () => {
    state.levelEditor.toolbarSunGeneratorTooltip = null;
    state.levelEditor.activeSunGeneratorInput = null;
    state.levelEditor.isWorldDragActive = false;
  }, { layer: layer + 10, id: 'sg_close_btn' });

  textStyle(NORMAL);
  textSize(9);
  fill(180, 200, 230);
  text("Customize Sun production mechanics", tipX + 12, tipY + 33);

  let curY = tipY + 48;
  const labelX = tipX + 12;
  const rowH = 24;
  const stepperW = 18;
  const valBoxW = 75;

  const activeInput = state.levelEditor.activeSunGeneratorInput;

  // Helper for Stepper Rows
  const renderSunStepper = (
    fieldKey: 'damagePerSun' | 'maxSun',
    label: string,
    valDisplay: string,
    valNum: number,
    onDec: () => void,
    onInc: () => void
  ) => {
    const isEditing = activeInput?.field === fieldKey;
    const rightEdge = tipX + tipW - 12;
    const incX = rightEdge - stepperW;
    const boxX = incX - valBoxW - 4;
    const decX = boxX - stepperW - 4;

    noStroke();
    fill(210, 225, 250);
    textAlign(LEFT, CENTER);
    textSize(10);
    text(label, labelX, curY + rowH / 2);

    // Minus button
    drawButton(decX, curY + 2, stepperW, rowH - 4, "-", {
      id: `sg_dec_${fieldKey}`,
      layer: layer + 5,
      fontSize: 12,
      radius: 4,
      depth3D: 1,
      variant: 'dark',
      onClick: () => {
        onDec();
        syncToolbarSunGeneratorTooltip();
        state.levelEditor.activeSunGeneratorInput = null;
      }
    });

    // Editable text value box
    const boxH = rowH - 4;
    const isHovered = mouseX >= boxX && mouseX <= boxX + valBoxW && mouseY >= curY + 2 && mouseY <= curY + 2 + boxH;

    fill(isEditing ? [10, 25, 45] : (isHovered ? [30, 45, 75] : [18, 26, 46]));
    stroke(isEditing ? [0, 220, 255] : (isHovered ? [100, 160, 230] : [50, 70, 110]));
    strokeWeight(isEditing ? 1.5 : 1);
    rect(boxX, curY + 2, valBoxW, boxH, 4);

    noStroke();
    fill(isEditing ? [0, 255, 200] : [255, 255, 255]);
    textAlign(CENTER, CENTER);
    textSize(10);
    const shownStr = isEditing ? activeInput.textBuffer : valDisplay;
    text(shownStr, boxX + valBoxW / 2, curY + 2 + boxH / 2);

    registerUIHitbox({
      id: `sg_valbox_${fieldKey}`,
      x: boxX,
      y: curY + 2,
      w: valBoxW,
      h: boxH,
      layer: layer + 5,
      onClick: () => {
        state.levelEditor.activeSunGeneratorInput = {
          field: fieldKey,
          textBuffer: `${valNum}`
        };
      }
    });

    // Plus button
    drawButton(incX, curY + 2, stepperW, rowH - 4, "+", {
      id: `sg_inc_${fieldKey}`,
      layer: layer + 5,
      fontSize: 12,
      radius: 4,
      depth3D: 1,
      variant: 'dark',
      onClick: () => {
        onInc();
        syncToolbarSunGeneratorTooltip();
        state.levelEditor.activeSunGeneratorInput = null;
      }
    });

    curY += rowH + 6;
  };

  const cfg = tip.config;

  // 1. Damage Per Sun
  renderSunStepper(
    'damagePerSun',
    'Damage / Sun',
    `${cfg.damagePerSun ?? 600} dmg`,
    cfg.damagePerSun ?? 600,
    () => { cfg.damagePerSun = Math.max(50, (cfg.damagePerSun ?? 600) - 50); },
    () => { cfg.damagePerSun = Math.min(10000, (cfg.damagePerSun ?? 600) + 50); }
  );

  // 2. Max Sun Dropped
  renderSunStepper(
    'maxSun',
    'Max Sun Dropped',
    `${cfg.maxSun ?? 100} sun`,
    cfg.maxSun ?? 100,
    () => { cfg.maxSun = Math.max(1, (cfg.maxSun ?? 100) - 10); },
    () => { cfg.maxSun = Math.min(1000, (cfg.maxSun ?? 100) + 10); }
  );

  // Explanation
  curY += 2;
  noStroke();
  fill(140, 160, 190);
  textAlign(LEFT, CENTER);
  textSize(8.5);
  text("Damaging releases Sun crystals until exhausted.", labelX, curY + 6);

  pop();
}

export function handleSunGeneratorKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (state.currentScreen !== 'level_editor' || !state.levelEditor.activeSunGeneratorInput || !state.levelEditor.toolbarSunGeneratorTooltip) {
    return false;
  }
  const activeInput = state.levelEditor.activeSunGeneratorInput;
  const tip = state.levelEditor.toolbarSunGeneratorTooltip;

  // Enter or Escape commits
  if (keyCodeNum === 13 || keyCodeNum === 27) {
    applySunGeneratorInputBuffer(tip, activeInput);
    state.levelEditor.activeSunGeneratorInput = null;
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    activeInput.textBuffer = activeInput.textBuffer.slice(0, -1);
    applySunGeneratorInputBuffer(tip, activeInput);
    return true;
  }

  // Digits
  if (keyStr && keyStr.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (keyStr >= '0' && keyStr <= '9') {
      if (activeInput.textBuffer.length < 6) {
        activeInput.textBuffer += keyStr;
        applySunGeneratorInputBuffer(tip, activeInput);
      }
      return true;
    }
  }

  return false;
}

function applySunGeneratorInputBuffer(tip: any, activeInput: { field: string; textBuffer: string }) {
  const num = parseInt(activeInput.textBuffer, 10);
  if (!isNaN(num) && num > 0) {
    if (activeInput.field === 'damagePerSun') {
      tip.config.damagePerSun = num;
    } else if (activeInput.field === 'maxSun') {
      tip.config.maxSun = num;
    }
    syncToolbarSunGeneratorTooltip();
  }
}

export function handleToolbarSunGeneratorTooltipClick(topBarH: number, paletteH: number): boolean {
  const tip = state.levelEditor.toolbarSunGeneratorTooltip;
  if (!tip) return false;

  const tipW = 280;
  const tipH = 175;
  const tipX = width - tipW - 15;
  const tipY = constrain(height - paletteH - tipH - 10, topBarH + 10, height - tipH - 10);

  if (mouseX < tipX || mouseX > tipX + tipW || mouseY < tipY || mouseY > tipY + tipH) {
    return false;
  }

  state.levelEditor.isWorldDragActive = false;
  return true;
}


import { state } from '../../../state';
import { EditorLevelConfigData, SPAWN_CONFIG_PERIODS, getDynamicEnemyKeys, getSelectedEnemyKeys, getEnemyIcon, getNextWeightCycle, isRightClick, DEFAULT_DAYTIME_WEIGHTS } from './types';
import { ALL_ENEMY_TYPES_LIST } from '../../../levelEditor/types';
import { drawButton } from '../../../uiComponents';


export function drawEnemiesPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number,
  modalX: number, modalY: number, panelX: number, panelY: number, panelW: number, panelH: number, viewY: number, viewH: number
) {
  const allEnemies = getDynamicEnemyKeys();
  const selectedEnemies = getSelectedEnemyKeys();

  const tableRowH = 21;
  const tableHeaderH = 24;
  const enemyHeaderW = 110;
  const numPeriods = SPAWN_CONFIG_PERIODS.length;
  const periodColW = Math.max(16, (cardW - 28 - enemyHeaderW) / numPeriods);

  // Chips layout calculation using SpawnerModal's ALL_ENEMY_TYPES_LIST
  const chipStartX = cardX + 14;
  let curChipX = chipStartX;
  let curChipY = curY + 48;
  const chipH = 20;
  const chipGap = 4;
  const maxChipsW = cardW - 28;

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(8.5);
    const chipW = Math.max(52, textWidth(choice.label) + 16);
    if (curChipX + chipW > chipStartX + maxChipsW) {
      curChipX = chipStartX;
      curChipY += chipH + chipGap;
    }
    curChipX += chipW + chipGap;
  }

  const tableStartX = cardX + 14;
  const tableStartY = curChipY + chipH + 12;
  const card5H = (tableStartY + tableHeaderH + (selectedEnemies.length * tableRowH) + 14) - curY;

  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, card5H, 12);

  // Section Title
  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("5. GLOBAL ENEMY SPAWN CONFIG (Click/Drag cell to cycle: 0 ➔ 0.25 ➔ 0.5 ➔ 1)", cardX + 14, curY + 12);

  // Top Action Buttons: [SET ALL TO 0] and [RESET DEFAULTS]
  const btnRowY = curY + 10;
  const setZeroBtnW = 95;
  const resetBtnW = 105;
  const btnH = 20;
  const resetBtnX = cardX + cardW - 14 - resetBtnW;
  const setZeroBtnX = resetBtnX - 8 - setZeroBtnW;

  renderMiniActionButton(setZeroBtnX, btnRowY, setZeroBtnW, btnH, "SET ALL TO 0", globalOffsetX, globalOffsetY, () => {
    for (const pKey of SPAWN_CONFIG_PERIODS) {
      if (cfg.globalEnemySpawnConfig[pKey]) {
        cfg.globalEnemySpawnConfig[pKey] = cfg.globalEnemySpawnConfig[pKey].map(() => 0);
      }
    }
  });

  renderMiniActionButton(resetBtnX, btnRowY, resetBtnW, btnH, "RESET DEFAULTS", globalOffsetX, globalOffsetY, () => {
    for (const pKey of SPAWN_CONFIG_PERIODS) {
      const defRow = DEFAULT_DAYTIME_WEIGHTS[pKey] || {};
      cfg.globalEnemySpawnConfig[pKey] = allEnemies.map(e => {
        if (Array.isArray(defRow)) {
          const idx = allEnemies.indexOf(e);
          return defRow[idx] || 0;
        } else if (defRow && typeof defRow === 'object') {
          return (defRow as Record<string, number>)[e] || 0;
        }
        return 0;
      });
    }
  });

  // Subheader: Enemy Selector Chips (same enemyList as SpawnerModal with togglable buttons)
  fill(160, 185, 220);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9);
  text("Included Enemies on Matrix Rows (Click to toggle):", cardX + 14, curY + 36);

  curChipX = chipStartX;
  curChipY = curY + 48;

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(8.5);
    const chipW = Math.max(52, textWidth(choice.label) + 16);

    if (curChipX + chipW > chipStartX + maxChipsW) {
      curChipX = chipStartX;
      curChipY += chipH + chipGap;
    }

    const isSelected = selectedEnemies.includes(choice.key);

    drawButton(curChipX, curChipY, chipW, chipH, choice.label, {
      id: `lc_enemy_chip_${choice.key}`,
      fontSize: 8.5,
      radius: 4,
      depth3D: 1,
      variant: isSelected ? 'yellow' : 'dark',
      onClick: () => {
        const idx = selectedEnemies.indexOf(choice.key);
        if (idx >= 0) {
          if (selectedEnemies.length > 1) {
            selectedEnemies.splice(idx, 1);
          }
        } else {
          selectedEnemies.push(choice.key);
        }
        state.levelEditor.levelConfigSelectedEnemies = [...selectedEnemies];
        state.activeLevelConfigInput = null;
      }
    });

    curChipX += chipW + chipGap;
  }

  // Handle Drag & Drop / Click Interactions on Matrix Table Cells and Headers
  const gViewX = modalX + panelX;
  const gViewY = modalY + panelY + viewY;
  const isInsideView = mouseX >= gViewX && mouseX <= gViewX + panelW && mouseY >= gViewY && mouseY <= gViewY + viewH;

  if (mouseIsPressed && isInsideView && !state.activeLevelConfigInput) {
    const relX = mouseX - globalOffsetX;
    const relY = mouseY - globalOffsetY;

    // Check cells drag
    if (relX >= tableStartX + enemyHeaderW && relX <= tableStartX + enemyHeaderW + numPeriods * periodColW &&
        relY >= tableStartY + tableHeaderH && relY <= tableStartY + tableHeaderH + selectedEnemies.length * tableRowH) {
      const c = Math.floor((relX - (tableStartX + enemyHeaderW)) / periodColW);
      const r = Math.floor((relY - (tableStartY + tableHeaderH)) / tableRowH);

      if (c >= 0 && c < numPeriods && r >= 0 && r < selectedEnemies.length) {
        const pKey = SPAWN_CONFIG_PERIODS[c];
        const cellKey = `${pKey}_${r}`;

        if (!state.levelConfigToggledCells) state.levelConfigToggledCells = new Set();
        if (!state.levelConfigToggledCells.has(cellKey)) {
          state.levelConfigToggledCells.add(cellKey);
          const eKey = selectedEnemies[r];
          const allIdx = allEnemies.indexOf(eKey);
          if (allIdx >= 0) {
            if (!cfg.globalEnemySpawnConfig[pKey]) {
              cfg.globalEnemySpawnConfig[pKey] = Array(allEnemies.length).fill(0);
            }
            const curVal = cfg.globalEnemySpawnConfig[pKey][allIdx] ?? 0;
            if (isRightClick()) {
              cfg.globalEnemySpawnConfig[pKey][allIdx] = 0;
            } else {
              cfg.globalEnemySpawnConfig[pKey][allIdx] = getNextWeightCycle(curVal);
            }
          }
        }
      }
    }
  } else {
    if (state.levelConfigToggledCells) {
      state.levelConfigToggledCells.clear();
    }
  }

  // Draw Table Column Headers (Period Headers)
  push();
  textAlign(CENTER, CENTER);
  textSize(8.5);

  // Enemy header box
  fill(26, 34, 62);
  noStroke();
  rect(tableStartX, tableStartY, enemyHeaderW, tableHeaderH, 4, 0, 0, 0);
  fill(180, 205, 240);
  text("ENEMY / PERIOD", tableStartX + enemyHeaderW / 2, tableStartY + tableHeaderH / 2);

  for (let c = 0; c < numPeriods; c++) {
    const pKey = SPAWN_CONFIG_PERIODS[c];
    const colX = tableStartX + enemyHeaderW + c * periodColW;
    const gColX = globalOffsetX + colX;
    const gColY = globalOffsetY + tableStartY;
    const isColHov = mouseX >= gColX && mouseX <= gColX + periodColW && mouseY >= gColY && mouseY <= gColY + tableHeaderH;

    push();
    fill(isColHov ? [35, 50, 95] : (c % 2 === 0 ? [22, 30, 56] : [18, 24, 46]));
    if (isColHov) {
      stroke(0, 220, 255);
      strokeWeight(1);
    } else {
      noStroke();
    }
    rect(colX, tableStartY, periodColW, tableHeaderH);

    fill(isColHov ? [255, 255, 255] : [160, 185, 220]);
    noStroke();
    const shortLabel = pKey.replace('_day', 'D').replace('_night', 'N');
    text(shortLabel, colX + periodColW / 2, tableStartY + tableHeaderH / 2);
    pop();
  }

  // Draw Table Rows (Enemy Rows & Cells)
  for (let r = 0; r < selectedEnemies.length; r++) {
    const eKey = selectedEnemies[r];
    const rowY = tableStartY + tableHeaderH + r * tableRowH;
    const allIdx = allEnemies.indexOf(eKey);

    const gRowX = globalOffsetX + tableStartX;
    const gRowY = globalOffsetY + rowY;
    const isRowHov = mouseX >= gRowX && mouseX <= gRowX + enemyHeaderW && mouseY >= gRowY && mouseY <= gRowY + tableRowH;

    // Row Header (Enemy Info)
    push();
    fill(isRowHov ? [32, 45, 80] : [20, 26, 48]);
    if (isRowHov) {
      stroke(240, 200, 60);
      strokeWeight(1);
    } else {
      noStroke();
    }
    rect(tableStartX, rowY, enemyHeaderW, tableRowH);

    const iconImg = getEnemyIcon(eKey);
    if (iconImg) {
      imageMode(CENTER);
      image(iconImg, tableStartX + 12, rowY + tableRowH / 2, 14, 14);
    }

    const enemyInfo = ALL_ENEMY_TYPES_LIST.find(e => e.key === eKey);
    const labelText = enemyInfo ? enemyInfo.label : eKey;

    textAlign(LEFT, CENTER);
    fill(230, 240, 255);
    textSize(8.5);
    text(labelText, tableStartX + 24, rowY + tableRowH / 2, enemyHeaderW - 28, tableRowH);
    pop();

    // Cells for this row across periods
    for (let c = 0; c < numPeriods; c++) {
      const pKey = SPAWN_CONFIG_PERIODS[c];
      const colX = tableStartX + enemyHeaderW + c * periodColW;
      const weightVal = (allIdx >= 0 ? cfg.globalEnemySpawnConfig[pKey]?.[allIdx] : 0) ?? 0;

      const gCellX = globalOffsetX + colX;
      const gCellY = globalOffsetY + rowY;
      const isCellHov = mouseX >= gCellX && mouseX <= gCellX + periodColW && mouseY >= gCellY && mouseY <= gCellY + tableRowH;

      push();
      if (weightVal >= 0.9) {
        fill(isCellHov ? [40, 95, 65] : [24, 68, 48]);
      } else if (weightVal >= 0.45) {
        fill(isCellHov ? [25, 80, 100] : [16, 54, 72]);
      } else if (weightVal >= 0.2) {
        fill(isCellHov ? [35, 50, 95] : [20, 32, 65]);
      } else {
        fill(isCellHov ? [22, 28, 50] : (r % 2 === 0 ? [14, 18, 36] : [11, 14, 28]));
      }

      if (isCellHov) {
        stroke(weightVal >= 0.9 ? [100, 240, 160] : (weightVal >= 0.45 ? [80, 200, 255] : (weightVal >= 0.2 ? [120, 150, 230] : [100, 140, 220])));
        strokeWeight(1.5);
      } else {
        noStroke();
      }

      rect(colX, rowY, periodColW, tableRowH);

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

  pop();
  return card5H;
}

export function handleEnemiesPanelClick(
  localX: number, localY: number,
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData
): boolean {
  const allEnemies = getDynamicEnemyKeys();
  const selectedEnemies = getSelectedEnemyKeys();

  const chipStartX = cardX + 14;
  let curChipX = chipStartX;
  let curChipY = curY + 48;
  const chipH = 20;
  const chipGap = 4;
  const maxChipsW = cardW - 28;

  for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
    const choice = ALL_ENEMY_TYPES_LIST[i];
    textSize(8.5);
    const chipW = Math.max(52, textWidth(choice.label) + 16);

    if (curChipX + chipW > chipStartX + maxChipsW) {
      curChipX = chipStartX;
      curChipY += chipH + chipGap;
    }

    if (localX >= curChipX && localX <= curChipX + chipW && localY >= curChipY && localY <= curChipY + chipH) {
      const idx = selectedEnemies.indexOf(choice.key);
      if (idx >= 0) {
        if (selectedEnemies.length > 1) {
          selectedEnemies.splice(idx, 1);
        }
      } else {
        selectedEnemies.push(choice.key);
      }
      state.levelEditor.levelConfigSelectedEnemies = [...selectedEnemies];
      state.activeLevelConfigInput = null;
      return true;
    }

    curChipX += chipW + chipGap;
  }

  // Check Table Header or Cell Click
  const tableStartX = cardX + 14;
  const tableStartY = curChipY + chipH + 12;
  const tableRowH = 21;
  const tableHeaderH = 24;
  const enemyHeaderW = 110;
  const numPeriods = SPAWN_CONFIG_PERIODS.length;
  const periodColW = Math.max(16, (cardW - 28 - enemyHeaderW) / numPeriods);

  const isRight = isRightClick();

  // Check Column Headers (Period Headers click)
  if (localX >= tableStartX + enemyHeaderW && localX <= tableStartX + enemyHeaderW + numPeriods * periodColW &&
      localY >= tableStartY && localY <= tableStartY + tableHeaderH) {
    const c = Math.floor((localX - (tableStartX + enemyHeaderW)) / periodColW);
    if (c >= 0 && c < numPeriods) {
      const pKey = SPAWN_CONFIG_PERIODS[c];
      if (!cfg.globalEnemySpawnConfig[pKey]) {
        cfg.globalEnemySpawnConfig[pKey] = Array(allEnemies.length).fill(0);
      }
      for (let r = 0; r < selectedEnemies.length; r++) {
        const eKey = selectedEnemies[r];
        const allIdx = allEnemies.indexOf(eKey);
        if (allIdx >= 0) {
          if (isRight) {
            cfg.globalEnemySpawnConfig[pKey][allIdx] = 0;
          } else {
            const curVal = cfg.globalEnemySpawnConfig[pKey][allIdx] ?? 0;
            cfg.globalEnemySpawnConfig[pKey][allIdx] = getNextWeightCycle(curVal);
          }
        }
      }
      state.activeLevelConfigInput = null;
      return true;
    }
  }

  // Check Row Headers (Enemy Headers click)
  if (localX >= tableStartX && localX <= tableStartX + enemyHeaderW &&
      localY >= tableStartY + tableHeaderH && localY <= tableStartY + tableHeaderH + selectedEnemies.length * tableRowH) {
    const r = Math.floor((localY - (tableStartY + tableHeaderH)) / tableRowH);
    if (r >= 0 && r < selectedEnemies.length) {
      const eKey = selectedEnemies[r];
      const allIdx = allEnemies.indexOf(eKey);
      if (allIdx >= 0) {
        for (const pKey of SPAWN_CONFIG_PERIODS) {
          if (!cfg.globalEnemySpawnConfig[pKey]) {
            cfg.globalEnemySpawnConfig[pKey] = Array(allEnemies.length).fill(0);
          }
          if (isRight) {
            cfg.globalEnemySpawnConfig[pKey][allIdx] = 0;
          } else {
            const curVal = cfg.globalEnemySpawnConfig[pKey][allIdx] ?? 0;
            cfg.globalEnemySpawnConfig[pKey][allIdx] = getNextWeightCycle(curVal);
          }
        }
      }
      state.activeLevelConfigInput = null;
      return true;
    }
  }

  return false;
}

function renderMiniActionButton(
  x: number, y: number, w: number, h: number,
  label: string,
  globalOffsetX: number, globalOffsetY: number,
  onClick: () => void
) {
  const gX = globalOffsetX + x;
  const gY = globalOffsetY + y;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  drawButton(x, y, w, h, label, {
    id: `lc_minibtn_${label.replace(/\s+/g, '_')}`,
    fontSize: 8.5,
    radius: 4,
    depth3D: 1,
    variant: isHov ? 'yellow' : 'dark',
    onClick
  });
}

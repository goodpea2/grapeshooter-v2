import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
import { liquidTypes } from '../balanceLiquids';
import { PaletteItem } from './types';
import { getAllPaletteItems, renderPaletteItemIcon } from './palette';
import { updateLevelEditorCamera } from './camera';
import {
  fillBucketObstacle,
  fillBucketLiquid,
  placeSelectedItem,
  deleteAtPosition,
  isPointInPolygon
} from './tools';
import {
  isMouseOverSpawnerTooltip,
  drawWorldHoverSpawnerTooltip,
  drawToolbarSpawnerTooltip,
  openToolbarSpawnerTooltip,
  isMouseOverSunGeneratorTooltip,
  drawToolbarSunGeneratorTooltip,
  openToolbarSunGeneratorTooltip
} from './spawnerTooltip';
import {
  paygateModal,
  drawPayGateCostModal,
  handlePayGateCostModalRelease
} from './paygateModal';
import {
  sunGeneratorModal,
  drawSunGeneratorModal,
  handleSunGeneratorModalRelease
} from './sunGeneratorModal';
import {
  textSignEditor,
  getTextSignAtWorldPos,
  drawInlineTextSignEditor,
  handleInlineTextSignRelease
} from './textsignEditor';
import { drawAlmanac } from '../ui/almanac/mainLayout';
import {
  drawButton,
  drawRedButton,
  drawDarkButton,
  drawPurpleButton,
  drawGreenButton,
  drawCyanButton,
  drawCard,
  registerUIHitbox
} from '../uiComponents';
import { color } from '../uiColors';
import {
  saveLevelLayout,
  triggerImportLevelJson
} from '../levelManager';
import { testPlayLevel, restoreLevelFromCache } from './actions';
import { createDefaultEditorAlmanacProgression } from '../lvDemo';
import { initLevelEditorPlayerUpgradesFromData } from '../ui/almanac/playerUpgradesPanel';
import { initLevelEditorLevelConfig } from '../ui/almanac/levelConfigPanel';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const ellipse: any;
declare const textStyle: any;
declare const NORMAL: any;
declare const line: any;
declare const background: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const textWidth: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const TOP: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const mouseButton: any;
declare const floor: any;
declare const constrain: any;
declare const abs: any;
declare const beginShape: any;
declare const vertex: any;
declare const endShape: any;
declare const CLOSE: any;
declare const scale: any;

export function drawLevelEditor() {
  updateLevelEditorCamera();

  // Clear canvas background every frame (fixes ghosting bug)
  background(10, 10, 25);

  const zoom = state.levelEditor.cameraZoom || 1.0;

  // Flexible dynamic render distance: ensure everything is rendered regardless of camera position and zoom level
  const halfViewW = (width / (2 * zoom)) + 300;
  const halfViewH = (height / (2 * zoom)) + 300;
  state.viewportBounds = {
    minX: state.cameraPos.x - halfViewW,
    maxX: state.cameraPos.x + halfViewW,
    minY: state.cameraPos.y - halfViewH,
    maxY: state.cameraPos.y + halfViewH
  };

  // Keep world chunks around camera loaded and updated
  if (state.world) {
    const chunkW = CHUNK_SIZE * GRID_SIZE;
    const minCx = floor((state.cameraPos.x - halfViewW) / chunkW);
    const maxCx = floor((state.cameraPos.x + halfViewW) / chunkW);
    const minCy = floor((state.cameraPos.y - halfViewH) / chunkW);
    const maxCy = floor((state.cameraPos.y + halfViewH) / chunkW);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        state.world.getChunk(cx, cy);
      }
    }
    state.world.update(state.cameraPos);
  }

  // Layout dimensions
  const topBarH = 44;
  const paletteH = 92;
  const leftBarX = 10;
  const leftBarY = topBarH + 10;
  const leftBarW = 48;
  const leftBarH = 154;
  const isOverLeftBar = mouseX >= leftBarX && mouseX <= leftBarX + leftBarW && mouseY >= leftBarY && mouseY <= leftBarY + leftBarH;
  const isOverSpawnerTip = isMouseOverSpawnerTooltip(topBarH, paletteH) || isMouseOverSunGeneratorTooltip(topBarH, paletteH);
  const isModalOpen = paygateModal.isOpen || textSignEditor.isOpen || !!state.levelEditor.editingPaygateModal || !!state.levelEditor.editingTextSign;
  const isOverWorld = !state.isAlmanacOpen && !isModalOpen && mouseY >= topBarH && mouseY < height - paletteH && !isOverLeftBar && !isOverSpawnerTip;

  // Calculate mouse world coordinates accounting for cameraZoom
  const mWorldX = (mouseX - width / 2) / zoom + state.cameraPos.x;
  const mWorldY = (mouseY - height / 2) / zoom + state.cameraPos.y;
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);

  const hoveredPayGateGroup = (state.world && !isModalOpen && isOverWorld) ? state.world.getPayGateGroupByWorldPos(mWorldX, mWorldY) : null;
  const hoveredTextSignBlock = (state.world && !isModalOpen && isOverWorld && !hoveredPayGateGroup) ? getTextSignAtWorldPos(mWorldX, mWorldY) : null;

  push();
  // 1. World Camera Translation and Zoom for ALL world elements
  translate(width / 2, height / 2);
  scale(zoom);
  translate(-state.cameraPos.x, -state.cameraPos.y);

  // Render World & Terrain centered on cameraPos
  if (state.world) {
    state.world.display(state.cameraPos);
  }

  // Render Ground Features, Entities, Player Spawn Core & Turrets
  for (const gf of state.groundFeatures) gf.display();
  for (const npc of state.npcs) npc.display();
  for (const enemy of state.enemies) enemy.display();
  if (state.player) state.player.display();

  const worldTurrets = state.world ? state.world.getAllTurrets() : [];
  for (const wt of worldTurrets) wt.display();

  // Render Live BreakCost for all PayGateGroups on the edit canvas
  if (state.world) {
    state.world.drawPayGateCostBubbles(undefined, true, hoveredPayGateGroup);
  }

  // Render Inline TextSign speech bubble editor if active
  drawInlineTextSignEditor(mWorldX, mWorldY);

  // Render Spawner Trigger Radius Preview and Spawner Names in LevelEditor Mode for placed spawners
  if (state.world) {
    state.world.chunks.forEach((chunk: any) => {
      chunk.blocks.forEach((b: any) => {
        if (!b.isMined && (b.overlay || b.liquidType)) {
          const oCfg = (b.overlay ? overlayTypes[b.overlay] : null) || (b.liquidType ? liquidTypes[b.liquidType] : null);
          if (oCfg && (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || b.customSpawnerConfig)) {
            const eCfg = b.customSpawnerConfig || oCfg.enemySpawnConfig;
            let trigRad = eCfg?.spawnTriggerRadius > 0 ? eCfg.spawnTriggerRadius : 0;
            const bcx = b.pos.x + GRID_SIZE / 2;
            const bcy = b.pos.y + GRID_SIZE / 2;
            
            push();
            // Trigger radius circle preview
            if (trigRad > 0) {
              fill(255, 60, 60, 5);
              stroke(255, 80, 80, 64);
              strokeWeight(1.5);
              ellipse(bcx, bcy, trigRad * 2, trigRad * 2);
            }

            // Spawner Name Label on World Canvas
            const spName = b.customSpawnerConfig?.name || oCfg.name || 'Spawner';
            textSize(7.5);
            const nw = textWidth(spName) + 8;
            const nh = 12;
            const nbgX = bcx - nw / 2;
            const nbgY = b.pos.y - nh - 2;
            fill(10, 14, 26, 220);
            stroke(255, 180, 50, 200);
            strokeWeight(1);
            rect(nbgX, nbgY, nw, nh, 3);
            noStroke();
            fill(255, 230, 140);
            textAlign(CENTER, CENTER);
            text(spName, bcx, nbgY + nh / 2);
            pop();
          }
        }
      });
    });
  }

  // Draw grid lines over camera view accounting for zoom
  const gridHalfW = (width / 2) / zoom;
  const gridHalfH = (height / 2) / zoom;
  const startX = floor((state.cameraPos.x - gridHalfW) / GRID_SIZE) * GRID_SIZE;
  const endX = startX + gridHalfW * 2 + GRID_SIZE * 2;
  const startY = floor((state.cameraPos.y - gridHalfH) / GRID_SIZE) * GRID_SIZE;
  const endY = startY + gridHalfH * 2 + GRID_SIZE * 2;

  stroke(255, 255, 255, 8);
  strokeWeight(1 / zoom);
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    line(x, startY, x, endY);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    line(startX, y, endX, y);
  }

  // Visual feedback: Fade Purple Tint on all designated spawnArea tiles (ONLY when MarkSpawnArea tool is active)
  if (state.levelEditor.toolMode === 'spawn_area' && state.world?.spawnAreaSet) {
    push();
    fill(168, 85, 247, 65); // Fade purple tint
    stroke(192, 132, 252, 180);
    strokeWeight(1);
    for (const key of state.world.spawnAreaSet) {
      const parts = key.split(',');
      const sgx = parseInt(parts[0], 10);
      const sgy = parseInt(parts[1], 10);
      if (!isNaN(sgx) && !isNaN(sgy)) {
        const tileScreenX = sgx * GRID_SIZE;
        const tileScreenY = sgy * GRID_SIZE;
        if (tileScreenX >= startX - GRID_SIZE && tileScreenX <= endX + GRID_SIZE &&
            tileScreenY >= startY - GRID_SIZE && tileScreenY <= endY + GRID_SIZE) {
          rect(tileScreenX, tileScreenY, GRID_SIZE, GRID_SIZE, 3);
        }
      }
    }
    pop();
  }

  // Cursor Preview & Interaction Handling
  if (isOverWorld && !hoveredPayGateGroup && !hoveredTextSignBlock && !isModalOpen) {
    const tileX = gx * GRID_SIZE;
    const tileY = gy * GRID_SIZE;

    // Detect mouse buttons (Left-click = Place/Fill/Mark, Right-click = Delete/Unmark)
    // ONLY allowed when world drag is actively initiated by clicking on the canvas
    const rawEvt = (window as any).event;
    const isMouseCurrentlyHeld = mouseIsPressed || state.isMouseDown || (rawEvt && rawEvt.buttons > 0);
    if (!isMouseCurrentlyHeld) {
      state.levelEditor.isWorldDragActive = false;
      state.levelEditor.isRightDragActive = false;
      state.levelEditor.isRightDragOverlayOnly = false;
      state.levelEditor.isFlagDragActive = false;
    }
    const isWorldDrag = !!state.levelEditor.isWorldDragActive;
    const isRightBtn = mouseButton === RIGHT || (window as any).mouseButton === RIGHT || (rawEvt && (rawEvt.button === 2 || rawEvt.buttons === 2)) || !!state.levelEditor.isRightDragActive;
    const isLeftPress = isWorldDrag && isMouseCurrentlyHeld && !isRightBtn;
    const isRightPress = isWorldDrag && isMouseCurrentlyHeld && isRightBtn;
    
    // Check Right Drag initiation for overlay only filter
    if (isRightPress) {
      if (!state.levelEditor.isRightDragActive) {
        state.levelEditor.isRightDragActive = true;
        const blockUnder = state.world?.getBlock(gx, gy);
        state.levelEditor.isRightDragOverlayOnly = (state.levelEditor.activeCategory === 'overlays') || (!!blockUnder?.overlay);
      }
    }

    if (state.levelEditor.toolMode === 'spawn_area') {
      // MARK SPAWN AREA TOOL (Lasso Circle & Direct Paint)
      if (isLeftPress || isRightPress) {
        if (!state.levelEditor.spawnAreaLassoPoints) state.levelEditor.spawnAreaLassoPoints = [];
        state.levelEditor.spawnAreaLassoPoints.push({ x: mWorldX, y: mWorldY });

        // Paint/erase directly under cursor while dragging
        state.world?.setSpawnAreaTile(gx, gy, isLeftPress);

        // Draw active lasso shape
        if (state.levelEditor.spawnAreaLassoPoints.length > 1) {
          push();
          fill(168, 85, 247, isLeftPress ? 40 : 20);
          stroke(isLeftPress ? [216, 180, 254, 240] : [248, 113, 113, 240]);
          strokeWeight(2);
          beginShape();
          for (const pt of state.levelEditor.spawnAreaLassoPoints) {
            vertex(pt.x, pt.y);
          }
          endShape(CLOSE);
          pop();
        }

        // Active reticle
        fill(isLeftPress ? [168, 85, 247, 80] : [239, 68, 68, 80]);
        stroke(isLeftPress ? [216, 180, 254, 255] : [248, 113, 113, 255]);
        strokeWeight(2);
        ellipse(mWorldX, mWorldY, 26, 26);
      } else {
        // Free hover reticle for spawn area
        fill(168, 85, 247, 30);
        stroke(192, 132, 252, 200);
        strokeWeight(1.5);
        ellipse(mWorldX, mWorldY, 26, 26);

        stroke(192, 132, 252, 150);
        line(mWorldX - 16, mWorldY, mWorldX + 16, mWorldY);
        line(mWorldX, mWorldY - 16, mWorldX, mWorldY + 16);

        push();
        textAlign(CENTER, CENTER);
        textSize(12);
        text('🟣', mWorldX + 8, mWorldY - 8);
        pop();
      }
    } else if (state.levelEditor.activeCategory === 'entities' || state.levelEditor.activeCategory === 'flags') {
      // Free non-snapped cursor for Entities and Flags
      const allItems = getAllPaletteItems();
      const selectedItem = allItems.find(i => i.category === state.levelEditor.activeCategory && i.key === state.levelEditor.selectedItemKey);

      if (isLeftPress) {
        fill(0, 220, 255, 60);
        stroke(0, 220, 255, 230);
        strokeWeight(2);
        ellipse(mWorldX, mWorldY, 28, 28);
        placeSelectedItem(mWorldX, mWorldY);
      } else if (isRightPress) {
        fill(255, 50, 50, 70);
        stroke(255, 80, 80, 230);
        strokeWeight(2);
        ellipse(mWorldX, mWorldY, 28, 28);
        deleteAtPosition(mWorldX, mWorldY);
      } else {
        // Free hover reticle
        fill(0, 220, 255, 25);
        stroke(0, 220, 255, 180);
        strokeWeight(1.5);
        ellipse(mWorldX, mWorldY, 24, 24);

        // Crosshairs
        stroke(0, 220, 255, 120);
        line(mWorldX - 16, mWorldY, mWorldX + 16, mWorldY);
        line(mWorldX, mWorldY - 16, mWorldX, mWorldY + 16);

        if (selectedItem) {
          renderPaletteItemIcon(selectedItem, mWorldX, mWorldY, 22);
        }
      }
    } else if (state.levelEditor.toolMode === 'bucket' && (state.levelEditor.activeCategory === 'obstacles' || state.levelEditor.activeCategory === 'liquids')) {
      // Bucket Fill Mode for Obstacles & Liquids
      if (isLeftPress || isRightPress) {
        const fc = (window as any).frameCount || 0;
        if (!state.levelEditor.lastBucketFrame || fc - state.levelEditor.lastBucketFrame > 12) {
          if (state.levelEditor.activeCategory === 'liquids') {
            fillBucketLiquid(mWorldX, mWorldY, isRightPress);
          } else {
            fillBucketObstacle(mWorldX, mWorldY, isRightPress);
          }
          state.levelEditor.lastBucketFrame = fc;
        }
        fill(isLeftPress ? [0, 220, 255, 70] : [255, 50, 50, 70]);
        stroke(isLeftPress ? [0, 220, 255, 255] : [255, 80, 80, 255]);
        strokeWeight(2.5);
        rect(tileX, tileY, GRID_SIZE, GRID_SIZE, 4);
      } else {
        fill(0, 220, 255, 40);
        stroke(0, 220, 255, 200);
        strokeWeight(2);
        rect(tileX, tileY, GRID_SIZE, GRID_SIZE, 4);

        // Ghost preview icon + Bucket symbol
        const allItems = getAllPaletteItems();
        const selectedItem = allItems.find(i => i.category === state.levelEditor.activeCategory && i.key === state.levelEditor.selectedItemKey);
        if (selectedItem) {
          renderPaletteItemIcon(selectedItem, tileX + GRID_SIZE / 2, tileY + GRID_SIZE / 2, 20);
        }
        push();
        textAlign(CENTER, CENTER);
        textSize(12);
        text('🪣', tileX + GRID_SIZE / 2 + 6, tileY + GRID_SIZE / 2 - 6);
        pop();
      }
    } else {
      // Snapped Grid Tile Cursor (Brush Mode)
      const selKey = state.levelEditor.selectedItemKey;
      const selCat = state.levelEditor.activeCategory;
      if ((selCat === 'overlays' || selCat === 'liquids') && selKey) {
        const oCfg = overlayTypes[selKey] || liquidTypes[selKey];
        if (oCfg && (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || selKey === 'ov_spawner_custom' || selKey === 'l_spawner')) {
          const eCfg = oCfg.enemySpawnConfig || { spawnTriggerRadius: 200 };
          let trigRad = eCfg?.spawnTriggerRadius > 0 ? eCfg.spawnTriggerRadius : 200;
          const previewX = tileX + GRID_SIZE / 2;
          const previewY = tileY + GRID_SIZE / 2;

          push();
          fill(255, 140, 0, 30);
          stroke(255, 160, 0, 220);
          strokeWeight(2);
          ellipse(previewX, previewY, trigRad * 2, trigRad * 2);
          pop();
        }
      }

      if (isLeftPress) {
        fill(0, 220, 255, 50);
        stroke(0, 220, 255, 220);
        strokeWeight(2);
        rect(tileX, tileY, GRID_SIZE, GRID_SIZE, 4);

        placeSelectedItem(mWorldX, mWorldY);
      } else if (isRightPress) {
        fill(255, 50, 50, 60);
        stroke(255, 80, 80, 220);
        strokeWeight(2);
        rect(tileX, tileY, GRID_SIZE, GRID_SIZE, 4);

        deleteAtPosition(mWorldX, mWorldY, state.levelEditor.isRightDragOverlayOnly);
      } else {
        fill(0, 220, 255, 30);
        stroke(0, 220, 255, 180);
        strokeWeight(1.5);
        rect(tileX, tileY, GRID_SIZE, GRID_SIZE, 4);

        const allItems = getAllPaletteItems();
        const selectedItem = allItems.find(i => i.category === state.levelEditor.activeCategory && i.key === state.levelEditor.selectedItemKey);
        if (selectedItem) {
          renderPaletteItemIcon(selectedItem, tileX + GRID_SIZE / 2, tileY + GRID_SIZE / 2, 20);
        }
      }
    }
  }

  pop();

  // 4. Top Action Header
  drawTopBar(topBarH);

  // 4.1 Left Tool Bar (Brush, Fill Bucket, Mark Spawn Area)
  drawLeftToolbar(topBarH);

  // 5. Bottom Palette Panel
  drawPalettePanel(paletteH);

  // 5.1 Read-Only Spawner Hover Tooltip on world canvas
  if (isOverWorld && !isOverSpawnerTip) {
    const hovBlk = state.world?.getBlock(gx, gy);
    if (hovBlk && !hovBlk.isMined) {
      const oCfg = (hovBlk.overlay ? overlayTypes[hovBlk.overlay] : null) || (hovBlk.liquidType ? liquidTypes[hovBlk.liquidType] : null);
      if (oCfg && (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || hovBlk.customSpawnerConfig || hovBlk.overlay === 'ov_spawner_custom' || hovBlk.liquidType === 'l_spawner')) {
        drawWorldHoverSpawnerTooltip(hovBlk, oCfg, topBarH, paletteH);
      }
    }
  }

  // 5.2 Editable Toolbar Spawner Tooltip
  if (state.levelEditor.toolbarSpawnerTooltip) {
    drawToolbarSpawnerTooltip(topBarH, paletteH);
  }

  // 5.3 Editable Toolbar Sun Generator Tooltip
  if (state.levelEditor.toolbarSunGeneratorTooltip) {
    drawToolbarSunGeneratorTooltip(topBarH, paletteH);
  }

  // 6. Draw Almanac if open in Editor Mode
  if (state.isAlmanacOpen) {
    drawAlmanac();
  }

  // 7. Draw PayGate Cost Modal if open
  if (paygateModal.isOpen) {
    drawPayGateCostModal();
  }

  // 8. Draw SunGenerator Config Modal if open
  if (sunGeneratorModal.isOpen) {
    drawSunGeneratorModal();
  }
}

export function drawLeftToolbar(topBarH: number) {
  const barX = 10;
  const barY = topBarH + 10;
  const barW = 48;
  const barH = 154;

  push();
  fill(10, 12, 24, 230);
  stroke(35, 45, 80);
  strokeWeight(1);
  rect(barX, barY, barW, barH, 8);
  noStroke();

  const btnW = 38;
  const btnH = 40;
  const btnX = barX + 5;
  let btnY = barY + 7;

  // 1. Brush Button
  const isBrush = state.levelEditor.toolMode === 'brush';
  drawButton(btnX, btnY, btnW, btnH, 'BRUSH', {
    id: 'le_tool_brush',
    variant: isBrush ? 'cyan' : 'dark',
    isSelected: isBrush,
    radius: 6,
    fontSize: 7.5,
    depth3D: 2,
    onClick: () => {
      state.levelEditor.toolMode = 'brush';
    }
  });
  // Overlay icon on top of button
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(13);
  textStyle(NORMAL);
  text('🖌️', btnX + btnW / 2, btnY + 13);

  btnY += btnH + 8;

  // 2. Bucket Fill Button
  const isBucket = state.levelEditor.toolMode === 'bucket';
  drawButton(btnX, btnY, btnW, btnH, 'FILL', {
    id: 'le_tool_bucket',
    variant: isBucket ? 'cyan' : 'dark',
    isSelected: isBucket,
    radius: 6,
    fontSize: 7.5,
    depth3D: 2,
    onClick: () => {
      state.levelEditor.toolMode = 'bucket';
      if (state.levelEditor.activeCategory !== 'obstacles' && state.levelEditor.activeCategory !== 'liquids') {
        state.levelEditor.activeCategory = 'obstacles';
        state.levelEditor.selectedItemKey = 'o_dirt';
      }
    }
  });
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(13);
  textStyle(NORMAL);
  text('🪣', btnX + btnW / 2, btnY + 13);

  btnY += btnH + 8;

  // 3. Mark Spawn Area Button
  const isSpawnArea = state.levelEditor.toolMode === 'spawn_area';
  drawButton(btnX, btnY, btnW, btnH, 'SPAWN', {
    id: 'le_tool_spawn',
    variant: isSpawnArea ? 'purple' : 'dark',
    isSelected: isSpawnArea,
    radius: 6,
    fontSize: 7,
    depth3D: 2,
    onClick: () => {
      state.levelEditor.toolMode = 'spawn_area';
    }
  });
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(13);
  textStyle(NORMAL);
  text('🟣', btnX + btnW / 2, btnY + 13);

  pop();
}

export function drawTopBar(headerH: number) {
  push();
  fill(10, 12, 24, 230);
  stroke(35, 45, 80);
  strokeWeight(1);
  rect(0, 0, width, headerH);
  noStroke();

  textAlign(LEFT, CENTER);
  textSize(14);
  textStyle(NORMAL);
  noStroke();
  fill(0, 220, 255);
  text("LEVEL EDITOR", 16, headerH / 2);

  textAlign(LEFT, CENTER);
  textSize(10);
  textStyle(NORMAL);
  noStroke();
  fill(140, 160, 190);
  text("WASD: Move  |  Left-Click: Paint/Fill  |  Right-Click: Delete/Clear", 140, headerH / 2);

  const btnH = 24;
  const btnW = 60;
  const gap = 6;
  let curX = width - 16 - btnW;

  // EXIT MENU Button (Red)
  drawRedButton(curX, (headerH - btnH) / 2, btnW, btnH, "EXIT MENU", {
    id: 'le_btn_exit',
    fontSize: 8.5,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      state.currentScreen = 'main_menu';
    }
  });

  curX -= (btnW + gap);

  // EXPORT JSON Button
  drawDarkButton(curX, (headerH - btnH) / 2, btnW, btnH, "EXPORT", {
    id: 'le_btn_export',
    fontSize: 8.5,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      saveLevelLayout();
    }
  });

  curX -= (btnW + gap);

  // IMPORT JSON Button
  drawDarkButton(curX, (headerH - btnH) / 2, btnW, btnH, "IMPORT", {
    id: 'le_btn_import',
    fontSize: 8.5,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      state.levelEditor.toolbarSpawnerTooltip = null;
      state.levelEditor.activeSpawnerInput = null;
      state.levelEditor.isWorldDragActive = false;
      (window as any).mouseIsPressed = false;
      triggerImportLevelJson((data) => {
        restoreLevelFromCache(data);
      });
    }
  });

  const almanacW = 95;
  curX -= (almanacW + gap);

  // ALMANAC CONFIG Button
  drawPurpleButton(curX, (headerH - btnH) / 2, almanacW, btnH, "ALMANAC CONFIG", {
    id: 'le_btn_almanac',
    fontSize: 8,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      if (!state.levelEditorAlmanacProgression) {
        state.levelEditorAlmanacProgression = createDefaultEditorAlmanacProgression();
      }
      initLevelEditorPlayerUpgradesFromData(state.currentLevelLayoutData?.playerUpgrades);
      initLevelEditorLevelConfig(state.currentLevelLayoutData);
      state.isAlmanacOpen = true;
      state.isAlmanacEditorMode = true;
      state.almanacTab = 'Turrets';
      state.almanacScrollY = 0;
      state.almanacScrollVelocity = 0;
    }
  });

  curX -= (btnW + gap);

  // TEST LEVEL Button
  drawGreenButton(curX, (headerH - btnH) / 2, btnW, btnH, "TEST LEVEL", {
    id: 'le_btn_test',
    fontSize: 8.5,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      testPlayLevel();
    }
  });

  pop();
}

export function drawPalettePanel(panelH: number) {
  push();
  const panelY = height - panelH;

  // Background Panel
  fill(10, 13, 26, 245);
  stroke(40, 55, 95);
  strokeWeight(1.5);
  rect(0, panelY, width, panelH);
  noStroke();

  // Category Tabs
  const categories: { key: PaletteItem['category']; label: string; disabled?: boolean }[] = [
    { key: 'obstacles', label: 'OBSTACLES' },
    { key: 'overlays', label: 'OVERLAYS' },
    { key: 'liquids', label: 'LIQUIDS' },
    { key: 'entities', label: 'ENTITIES' },
    { key: 'turrets', label: 'TURRETS' },
    { key: 'flags', label: 'FLAGS' }
  ];

  const tabH = 18;
  const tabMargin = 4;
  let tabX = 12;

  for (const tab of categories) {
    textSize(9);
    textStyle(NORMAL);
    const tw = textWidth(tab.label) + 14;
    const isSelected = state.levelEditor.activeCategory === tab.key;

    drawButton(tabX, panelY + tabMargin, tw, tabH, tab.label, {
      id: `le_tab_${tab.key}`,
      variant: isSelected ? 'cyan' : 'dark',
      isSelected,
      disabled: tab.disabled,
      fontSize: 8.5,
      radius: 4,
      depth3D: 1,
      onClick: () => {
        if (!tab.disabled) {
          state.levelEditor.activeCategory = tab.key;
          if (tab.key === 'entities') {
            state.levelEditor.activeSubCategory = 'ALL';
          }
          const allItems = getAllPaletteItems();
          const first = allItems.find(i => i.category === tab.key);
          if (first) {
            state.levelEditor.selectedItemKey = first.key;
          }
          state.levelEditor.paletteScrollX = 0;
          state.levelEditor.paletteScrollVel = 0;
        }
      }
    });

    tabX += tw + 5;
  }

  // Sub-category Filter (if category === 'entities')
  let contentY = panelY + tabMargin + tabH + 4;
  if (state.levelEditor.activeCategory === 'entities') {
    const subCats = ['ALL', 'Player', 'Enemies', 'NPCs', 'Loot'];
    let subX = 12;
    const subH = 15;

    for (const sub of subCats) {
      textSize(8);
      textStyle(NORMAL);
      const sw = textWidth(sub) + 12;
      const isSubSel = (state.levelEditor.activeSubCategory || 'ALL') === sub;

      drawButton(subX, contentY, sw, subH, sub, {
        id: `le_sub_${sub}`,
        variant: isSubSel ? 'yellow' : 'dark',
        isSelected: isSubSel,
        fontSize: 7.5,
        radius: 3,
        depth3D: 1,
        onClick: () => {
          state.levelEditor.activeSubCategory = sub;
          state.levelEditor.paletteScrollX = 0;
          state.levelEditor.paletteScrollVel = 0;
        }
      });

      subX += sw + 4;
    }

    contentY += subH + 4;
  }

  // Items List Clipper & Scroll Container
  const allItems = getAllPaletteItems();
  let categoryItems = allItems.filter(i => i.category === state.levelEditor.activeCategory);
  if (state.levelEditor.activeCategory === 'entities' && state.levelEditor.activeSubCategory && state.levelEditor.activeSubCategory !== 'ALL') {
    categoryItems = categoryItems.filter(i => i.subCategory === state.levelEditor.activeSubCategory);
  }

  const cardW = 44;
  const cardH = 46;
  const cardGap = 5;
  const totalW = categoryItems.length * (cardW + cardGap) - cardGap;
  const viewportW = width - 24;
  const maxScroll = Math.min(0, viewportW - totalW);

  // Update Smooth Velocity Scrolling
  if (state.levelEditor.paletteScrollVel) {
    state.levelEditor.paletteScrollX = constrain(
      (state.levelEditor.paletteScrollX || 0) + state.levelEditor.paletteScrollVel,
      maxScroll,
      0
    );
    state.levelEditor.paletteScrollVel *= 0.85;
    if (abs(state.levelEditor.paletteScrollVel) < 0.01) state.levelEditor.paletteScrollVel = 0;
  } else {
    state.levelEditor.paletteScrollX = constrain(state.levelEditor.paletteScrollX || 0, maxScroll, 0);
  }

  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(12, contentY, viewportW, cardH + 4);
    dc.clip();
  }

  const startX = 12 + (state.levelEditor.paletteScrollX || 0);

  for (let i = 0; i < categoryItems.length; i++) {
    const item = categoryItems[i];
    const cx = startX + i * (cardW + cardGap);

    if (cx + cardW < 0 || cx > width) continue;

    const isSelected = state.levelEditor.selectedItemKey === item.key;

    drawCard(cx, contentY, cardW, cardH, {
      radius: 6,
      isSelected,
      isHoverable: true,
      id: `le_card_${item.key}`,
      onClick: () => {
        state.levelEditor.selectedItemKey = item.key;
        if ((item.category === 'overlays' && item.key.startsWith('ov_spawner')) || (item.category === 'liquids' && (item.key === 'l_spawner' || item.key.startsWith('l_spawner'))) || item.key === 'l_spawner' || item.key.startsWith('l_spawner')) {
          openToolbarSpawnerTooltip(item.key);
        } else if (item.category === 'overlays' && item.key === 'sunGenerator') {
          openToolbarSunGeneratorTooltip();
        }
      }
    });

    // Card Icon
    renderPaletteItemIcon(item, cx + cardW / 2, contentY + 16, 20);

    // Card Label
    textAlign(CENTER, TOP);
    textSize(8);
    textStyle(NORMAL);
    noStroke();
    fill(isSelected ? [255, 255, 255] : [160, 175, 200]);
    text(item.name, cx + 2, contentY + 28, cardW - 4, 16);
  }

  if (dc) {
    dc.restore();
  }

  pop();
}

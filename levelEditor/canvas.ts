import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { overlayTypes } from '../balanceObstacles';
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
  drawToolbarSpawnerTooltip
} from './spawnerTooltip';
import { drawAlmanac } from '../ui/almanac/mainLayout';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const ellipse: any;
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

  // Keep world chunks around camera loaded and updated
  if (state.world) {
    state.world.update(state.cameraPos);
  }

  const zoom = state.levelEditor.cameraZoom || 1.0;

  // Layout dimensions
  const topBarH = 44;
  const paletteH = 92;
  const leftBarX = 10;
  const leftBarY = topBarH + 10;
  const leftBarW = 48;
  const leftBarH = 154;
  const isOverLeftBar = mouseX >= leftBarX && mouseX <= leftBarX + leftBarW && mouseY >= leftBarY && mouseY <= leftBarY + leftBarH;
  const isOverSpawnerTip = isMouseOverSpawnerTooltip(topBarH, paletteH);
  const isOverWorld = !state.isAlmanacOpen && mouseY >= topBarH && mouseY < height - paletteH && !isOverLeftBar && !isOverSpawnerTip;

  // Calculate mouse world coordinates accounting for cameraZoom
  const mWorldX = (mouseX - width / 2) / zoom + state.cameraPos.x;
  const mWorldY = (mouseY - height / 2) / zoom + state.cameraPos.y;
  const gx = floor(mWorldX / GRID_SIZE);
  const gy = floor(mWorldY / GRID_SIZE);

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

  // Render Spawner Trigger Radius Preview and Spawner Names in LevelEditor Mode for placed spawners
  if (state.world) {
    state.world.chunks.forEach((chunk: any) => {
      chunk.blocks.forEach((b: any) => {
        if (!b.isMined && b.overlay && overlayTypes[b.overlay]) {
          const oCfg = overlayTypes[b.overlay];
          if (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || b.customSpawnerConfig) {
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
  const halfViewW = (width / 2) / zoom;
  const halfViewH = (height / 2) / zoom;
  const startX = floor((state.cameraPos.x - halfViewW) / GRID_SIZE) * GRID_SIZE;
  const endX = startX + halfViewW * 2 + GRID_SIZE * 2;
  const startY = floor((state.cameraPos.y - halfViewH) / GRID_SIZE) * GRID_SIZE;
  const endY = startY + halfViewH * 2 + GRID_SIZE * 2;

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
  if (isOverWorld) {
    const tileX = gx * GRID_SIZE;
    const tileY = gy * GRID_SIZE;

    // Detect mouse buttons (Left-click = Place/Fill/Mark, Right-click = Delete/Unmark)
    const rawEvt = (window as any).event;
    const isLeftPress = mouseIsPressed && (mouseButton === LEFT || (window as any).mouseButton === LEFT || (rawEvt && rawEvt.buttons === 1));
    const isRightPress = mouseIsPressed && (mouseButton === RIGHT || (window as any).mouseButton === RIGHT || (rawEvt && rawEvt.buttons === 2));
    
    // Check Right Drag initiation for overlay only filter
    if (isRightPress) {
      if (!state.levelEditor.isRightDragActive) {
        state.levelEditor.isRightDragActive = true;
        const blockUnder = state.world?.getBlock(gx, gy);
        state.levelEditor.isRightDragOverlayOnly = (state.levelEditor.activeCategory === 'overlays') || (!!blockUnder?.overlay);
      }
    } else {
      state.levelEditor.isRightDragActive = false;
      state.levelEditor.isRightDragOverlayOnly = false;
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
      if (selCat === 'overlays' && selKey && overlayTypes[selKey]) {
        const oCfg = overlayTypes[selKey];
        if (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || selKey === 'ov_spawner_custom') {
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
    if (hovBlk && !hovBlk.isMined && hovBlk.overlay) {
      const oCfg = overlayTypes[hovBlk.overlay];
      if (oCfg && (oCfg.isEnemySpawner || oCfg.enemySpawnConfig || hovBlk.customSpawnerConfig || hovBlk.overlay === 'ov_spawner_custom')) {
        drawWorldHoverSpawnerTooltip(hovBlk, oCfg, topBarH, paletteH);
      }
    }
  }

  // 5.2 Editable Toolbar Spawner Tooltip
  if (state.levelEditor.toolbarSpawnerTooltip) {
    drawToolbarSpawnerTooltip(topBarH, paletteH);
  }

  // 6. Draw Almanac if open in Editor Mode
  if (state.isAlmanacOpen) {
    drawAlmanac();
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

  const btnW = 38;
  const btnH = 40;
  const btnX = barX + 5;
  let btnY = barY + 7;

  // 1. Brush Button
  const isBrush = state.levelEditor.toolMode === 'brush';
  const isBrushHov = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  fill(isBrush ? [20, 50, 95] : (isBrushHov ? [25, 38, 70] : [14, 18, 36]));
  stroke(isBrush ? [0, 220, 255] : (isBrushHov ? [70, 120, 200] : [35, 45, 80]));
  strokeWeight(isBrush ? 1.5 : 1);
  rect(btnX, btnY, btnW, btnH, 6);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('🖌️', btnX + btnW / 2, btnY + 14);
  textSize(7.5);
  fill(isBrush ? [0, 220, 255] : [160, 175, 200]);
  text('BRUSH', btnX + btnW / 2, btnY + 29);

  btnY += btnH + 8;

  // 2. Bucket Fill Button
  const isBucket = state.levelEditor.toolMode === 'bucket';
  const isBucketHov = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  fill(isBucket ? [20, 50, 95] : (isBucketHov ? [25, 38, 70] : [14, 18, 36]));
  stroke(isBucket ? [0, 220, 255] : (isBucketHov ? [70, 120, 200] : [35, 45, 80]));
  strokeWeight(isBucket ? 1.5 : 1);
  rect(btnX, btnY, btnW, btnH, 6);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('🪣', btnX + btnW / 2, btnY + 14);
  textSize(7.5);
  fill(isBucket ? [0, 220, 255] : [160, 175, 200]);
  text('FILL', btnX + btnW / 2, btnY + 29);

  btnY += btnH + 8;

  // 3. Mark Spawn Area Button
  const isSpawnArea = state.levelEditor.toolMode === 'spawn_area';
  const isSpawnHov = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  fill(isSpawnArea ? [60, 25, 95] : (isSpawnHov ? [45, 25, 75] : [18, 14, 36]));
  stroke(isSpawnArea ? [192, 132, 252] : (isSpawnHov ? [168, 85, 247] : [55, 35, 85]));
  strokeWeight(isSpawnArea ? 1.5 : 1);
  rect(btnX, btnY, btnW, btnH, 6);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('🟣', btnX + btnW / 2, btnY + 14);
  textSize(7);
  fill(isSpawnArea ? [216, 180, 254] : [190, 165, 220]);
  text('SPAWN', btnX + btnW / 2, btnY + 29);

  pop();
}

export function handleLevelEditorMouseRelease() {
  if (state.currentScreen !== 'level_editor') return;

  // Complete MarkSpawnArea circle/lasso selection
  if (state.levelEditor.toolMode === 'spawn_area' && state.levelEditor.spawnAreaLassoPoints && state.levelEditor.spawnAreaLassoPoints.length >= 3) {
    const pts = state.levelEditor.spawnAreaLassoPoints;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const minGx = Math.floor(minX / GRID_SIZE) - 1;
    const maxGx = Math.ceil(maxX / GRID_SIZE) + 1;
    const minGy = Math.floor(minY / GRID_SIZE) - 1;
    const maxGy = Math.ceil(maxY / GRID_SIZE) + 1;

    const wasRight = state.levelEditor.isRightDragActive || (window as any).mouseButton === RIGHT || mouseButton === RIGHT;
    const markVal = !wasRight;

    for (let tx = minGx; tx <= maxGx; tx++) {
      for (let ty = minGy; ty <= maxGy; ty++) {
        const centerPt = { x: tx * GRID_SIZE + GRID_SIZE / 2, y: ty * GRID_SIZE + GRID_SIZE / 2 };
        if (isPointInPolygon(centerPt.x, centerPt.y, pts)) {
          state.world?.setSpawnAreaTile(tx, ty, markVal);
        }
      }
    }
  }

  state.levelEditor.spawnAreaLassoPoints = [];
  state.levelEditor.isFlagDragActive = false;
  state.levelEditor.flagDragMode = null;
  state.levelEditor.isRightDragActive = false;
  state.levelEditor.isRightDragOverlayOnly = false;
}

export function drawTopBar(headerH: number) {
  push();
  fill(10, 12, 24, 230);
  stroke(35, 45, 80);
  strokeWeight(1);
  rect(0, 0, width, headerH);

  textAlign(LEFT, CENTER);
  textSize(14);
  fill(0, 220, 255);
  text("LEVEL EDITOR", 16, headerH / 2);

  textAlign(LEFT, CENTER);
  textSize(10);
  fill(140, 160, 190);
  text("WASD: Move  |  Left-Click: Paint/Fill  |  Right-Click: Delete/Clear", 140, headerH / 2);

  const btnH = 22;
  const btnW = 55;
  const gap = 6;
  let curX = width - 16 - btnW;

  const btnBgNormal = [45, 60, 90];
  const btnBgHover = [75, 100, 145];

  // EXIT MENU Button (Red)
  const isExitHov = mouseX >= curX && mouseX <= curX + btnW && mouseY >= (headerH - btnH) / 2 && mouseY <= (headerH + btnH) / 2;
  fill(isExitHov ? [220, 60, 60] : [180, 40, 40]);
  noStroke();
  rect(curX, (headerH - btnH) / 2, btnW, btnH, 4);
  textAlign(CENTER, CENTER);
  textSize(8.5);
  fill(255, 255, 255);
  text("EXIT MENU", curX + btnW / 2, headerH / 2);

  curX -= (btnW + gap);

  // EXPORT JSON Button
  const isExpHov = mouseX >= curX && mouseX <= curX + btnW && mouseY >= (headerH - btnH) / 2 && mouseY <= (headerH + btnH) / 2;
  fill(isExpHov ? btnBgHover : btnBgNormal);
  noStroke();
  rect(curX, (headerH - btnH) / 2, btnW, btnH, 4);
  textAlign(CENTER, CENTER);
  textSize(8.5);
  fill(240, 245, 255);
  text("EXPORT", curX + btnW / 2, headerH / 2);

  curX -= (btnW + gap);

  // IMPORT JSON Button
  const isImpHov = mouseX >= curX && mouseX <= curX + btnW && mouseY >= (headerH - btnH) / 2 && mouseY <= (headerH + btnH) / 2;
  fill(isImpHov ? btnBgHover : btnBgNormal);
  noStroke();
  rect(curX, (headerH - btnH) / 2, btnW, btnH, 4);
  textAlign(CENTER, CENTER);
  textSize(8.5);
  fill(240, 245, 255);
  text("IMPORT", curX + btnW / 2, headerH / 2);

  curX -= (gap + 85);

  // ALMANAC CONFIG Button
  const almanacW = 85;
  const isAlmHov = mouseX >= curX && mouseX <= curX + almanacW && mouseY >= (headerH - btnH) / 2 && mouseY <= (headerH + btnH) / 2;
  fill(isAlmHov ? [100, 70, 180] : [65, 45, 130]);
  noStroke();
  rect(curX, (headerH - btnH) / 2, almanacW, btnH, 4);
  textAlign(CENTER, CENTER);
  textSize(8);
  fill(240, 230, 255);
  text("ALMANAC CONFIG", curX + almanacW / 2, headerH / 2);

  curX -= (btnW + gap);

  // TEST LEVEL Button
  const isTestHov = mouseX >= curX && mouseX <= curX + btnW && mouseY >= (headerH - btnH) / 2 && mouseY <= (headerH + btnH) / 2;
  fill(isTestHov ? btnBgHover : btnBgNormal);
  noStroke();
  rect(curX, (headerH - btnH) / 2, btnW, btnH, 4);
  textAlign(CENTER, CENTER);
  textSize(8.5);
  fill(240, 245, 255);
  text("TEST LEVEL", curX + btnW / 2, headerH / 2);

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

  // Category Tabs
  const categories: { key: PaletteItem['category']; label: string; disabled?: boolean }[] = [
    { key: 'obstacles', label: 'OBSTACLES' },
    { key: 'overlays', label: 'OVERLAYS' },
    { key: 'liquids', label: 'LIQUIDS' },
    { key: 'groundFeatures', label: 'GROUND FEATURES', disabled: true },
    { key: 'entities', label: 'ENTITIES' },
    { key: 'turrets', label: 'TURRETS' },
    { key: 'flags', label: 'FLAGS' }
  ];

  const tabH = 18;
  const tabMargin = 4;
  let tabX = 12;

  for (const tab of categories) {
    textSize(9);
    const tw = textWidth(tab.label) + 14;
    const isSelected = state.levelEditor.activeCategory === tab.key;
    const isHovered = !tab.disabled && mouseX >= tabX && mouseX <= tabX + tw && mouseY >= panelY + tabMargin && mouseY <= panelY + tabMargin + tabH;

    noStroke();
    if (tab.disabled) {
      fill(16, 18, 30, 140);
    } else if (isSelected) {
      fill(0, 200, 255, 230);
    } else if (isHovered) {
      fill(40, 60, 110, 200);
    } else {
      fill(20, 25, 45, 180);
    }

    rect(tabX, panelY + tabMargin, tw, tabH, 4);

    textAlign(CENTER, CENTER);
    if (tab.disabled) {
      fill(80, 90, 115, 120);
    } else {
      fill(isSelected ? [10, 20, 35] : (isHovered ? [230, 240, 255] : [150, 170, 200]));
    }
    text(tab.label, tabX + tw / 2, panelY + tabMargin + tabH / 2);

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
      const sw = textWidth(sub) + 12;
      const isSubSel = (state.levelEditor.activeSubCategory || 'ALL') === sub;
      const isSubHov = mouseX >= subX && mouseX <= subX + sw && mouseY >= contentY && mouseY <= contentY + subH;

      noStroke();
      if (isSubSel) {
        fill(255, 220, 100, 230);
      } else if (isSubHov) {
        fill(60, 80, 130, 200);
      } else {
        fill(25, 30, 52, 160);
      }

      rect(subX, contentY, sw, subH, 3);
      textAlign(CENTER, CENTER);
      fill(isSubSel ? [20, 20, 10] : [190, 200, 220]);
      text(sub, subX + sw / 2, contentY + subH / 2);

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

  const cardW = 42;
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
    const isHovered = mouseX >= cx && mouseX <= cx + cardW && mouseY >= contentY && mouseY <= contentY + cardH;

    // Card Background
    if (isSelected) {
      fill(25, 50, 90, 240);
      stroke(0, 220, 255);
      strokeWeight(1.5);
    } else if (isHovered) {
      fill(22, 35, 65, 220);
      stroke(100, 150, 230, 180);
      strokeWeight(1);
    } else {
      fill(14, 18, 34, 200);
      stroke(40, 52, 90, 120);
      strokeWeight(1);
    }

    rect(cx, contentY, cardW, cardH, 5);

    // Card Icon
    renderPaletteItemIcon(item, cx + cardW / 2, contentY + 16, 20);

    // Card Label
    textAlign(CENTER, TOP);
    textSize(8);
    fill(isSelected ? [255, 255, 255] : (isHovered ? [230, 240, 255] : [150, 165, 190]));
    text(item.name, cx + 2, contentY + 28, cardW - 4, 16);
  }

  if (dc) {
    dc.restore();
  }

  pop();
}

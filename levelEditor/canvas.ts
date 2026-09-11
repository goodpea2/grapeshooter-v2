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
import { testPlayLevel, restoreLevelFromCache, undoLevelEditorAction, redoLevelEditorAction } from './actions';
import { createDefaultEditorAlmanacProgression } from '../lvDemo';
import { initLevelEditorPlayerUpgradesFromData } from '../ui/almanac/playerUpgradesPanel';
import { initLevelEditorLevelConfig } from '../ui/almanac/levelConfigPanel';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
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
declare const BOTTOM: any;
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
  const leftPanelW = state.levelEditor.leftPanelWidth || 172;

  // Handle panel width resizing drag
  if (state.levelEditor.isResizingLeftPanel && mouseIsPressed) {
    state.levelEditor.leftPanelWidth = constrain(mouseX, 80, Math.min(width * 0.65, 520));
  }

  const isOverLeftPanel = mouseX <= (state.levelEditor.leftPanelWidth || 186);
  const isOverLevelInfo = isMouseOverLevelInfoPanel(leftPanelW, topBarH);
  const isOverSpawnerTip = isMouseOverSpawnerTooltip(topBarH, 0) || isMouseOverSunGeneratorTooltip(topBarH, 0) || isOverLevelInfo;
  const isModalOpen = paygateModal.isOpen || textSignEditor.isOpen || !!state.levelEditor.editingPaygateModal || !!state.levelEditor.editingTextSign;
  const isOverWorld = !state.isAlmanacOpen && !isModalOpen && mouseY >= topBarH && !isOverLeftPanel && !isOverSpawnerTip;

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

  // Render Spawner Names in LevelEditor Mode for placed spawners (both ov_spawner and l_spawner)
  if (state.world) {
    state.world.chunks.forEach((chunk: any) => {
      chunk.blocks.forEach((b: any) => {
        const isLiquid = b.liquidType === 'l_spawner' || (b.liquidType && !!liquidTypes[b.liquidType]?.isEnemySpawner) || (!!b.customSpawnerConfig && !!b.liquidType);
        const isOverlay = !b.isMined && (b.overlay?.startsWith('ov_spawner') || !!overlayTypes[b.overlay || '']?.isEnemySpawner || !!overlayTypes[b.overlay || '']?.enemySpawnConfig || !!b.customSpawnerConfig);
        
        if (isLiquid || isOverlay) {
          const oCfg = (isOverlay && b.overlay ? overlayTypes[b.overlay] : null) || (isLiquid && b.liquidType ? liquidTypes[b.liquidType] : null);
          if (oCfg || b.customSpawnerConfig) {
            const bcx = b.pos.x + GRID_SIZE / 2;
            const bcy = b.pos.y + GRID_SIZE / 2;
            push();
            // Spawner Name Label on World Canvas
            const spName = b.customSpawnerConfig?.name || oCfg?.name || (isLiquid ? 'Ground Spawner' : 'Spawner');
            textSize(7.5);
            const nw = textWidth(spName) + 8;
            const nh = 12;
            const nbgX = bcx - nw / 2;
            const nbgY = b.pos.y - nh - 2;
            fill(10, 14, 26, 220);
            stroke(isLiquid ? [180, 80, 255, 200] : [255, 180, 50, 200]);
            strokeWeight(1);
            rect(nbgX, nbgY, nw, nh, 3);
            noStroke();
            fill(isLiquid ? [220, 160, 255] : [255, 230, 140]);
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

    if (state.levelEditor.toolMode === 'lasso') {
      // OBSTACLE LASSO TOOL (Draw custom polygon & fill tiles on release)
      if (isLeftPress || isRightPress) {
        if (!state.levelEditor.obstacleLassoPoints) state.levelEditor.obstacleLassoPoints = [];
        const pts = state.levelEditor.obstacleLassoPoints;
        if (pts.length === 0) {
          pts.push({ x: mWorldX, y: mWorldY });
        } else {
          const last = pts[pts.length - 1];
          const dx = mWorldX - last.x;
          const dy = mWorldY - last.y;
          if (dx * dx + dy * dy >= 16) {
            pts.push({ x: mWorldX, y: mWorldY });
          }
        }

        // Draw active lasso shape polygon preview
        if (state.levelEditor.obstacleLassoPoints.length > 1) {
          push();
          fill(56, 189, 248, isLeftPress ? 45 : 25);
          stroke(isLeftPress ? [56, 189, 248, 240] : [248, 113, 113, 240]);
          strokeWeight(2);
          beginShape();
          for (const pt of state.levelEditor.obstacleLassoPoints) {
            vertex(pt.x, pt.y);
          }
          endShape(CLOSE);
          pop();
        }

        // Active reticle
        fill(isLeftPress ? [56, 189, 248, 80] : [239, 68, 68, 80]);
        stroke(isLeftPress ? [56, 189, 248, 255] : [248, 113, 113, 255]);
        strokeWeight(2);
        ellipse(mWorldX, mWorldY, 26, 26);
      } else {
        // Free hover reticle for lasso
        fill(56, 189, 248, 30);
        stroke(56, 189, 248, 200);
        strokeWeight(1.5);
        ellipse(mWorldX, mWorldY, 26, 26);

        stroke(56, 189, 248, 150);
        line(mWorldX - 16, mWorldY, mWorldX + 16, mWorldY);
        line(mWorldX, mWorldY - 16, mWorldX, mWorldY + 16);

        push();
        textAlign(CENTER, CENTER);
        textSize(11);
        text('➰', mWorldX + 8, mWorldY - 8);
        pop();
      }
    } else if (state.levelEditor.toolMode === 'spawn_area') {
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

    // Multi-Spawner Radius Gizmo Pass: Visualize radii across active spawners when selected/snapping/hovered/inspected
    const isPlacingSpawner = (state.levelEditor.activeCategory === 'overlays' && (state.levelEditor.selectedItemKey === 'ov_spawner_custom' || overlayTypes[state.levelEditor.selectedItemKey]?.isEnemySpawner)) ||
                             (state.levelEditor.activeCategory === 'liquids' && (state.levelEditor.selectedItemKey === 'l_spawner' || state.levelEditor.selectedItemKey.startsWith('l_spawner') || liquidTypes[state.levelEditor.selectedItemKey]?.isEnemySpawner));
    const hovBlk = state.world?.getBlock(gx, gy);
    const isHovSpawner = hovBlk && (!hovBlk.isMined || hovBlk.liquidType === 'l_spawner' || (hovBlk.liquidType && liquidTypes[hovBlk.liquidType]?.isEnemySpawner) || (hovBlk.customSpawnerConfig && hovBlk.liquidType)) &&
      ((hovBlk.overlay && (overlayTypes[hovBlk.overlay]?.isEnemySpawner || overlayTypes[hovBlk.overlay]?.enemySpawnConfig || hovBlk.customSpawnerConfig || hovBlk.overlay === 'ov_spawner_custom')) ||
       (hovBlk.liquidType && (liquidTypes[hovBlk.liquidType]?.isEnemySpawner || liquidTypes[hovBlk.liquidType]?.enemySpawnConfig || hovBlk.customSpawnerConfig || hovBlk.liquidType === 'l_spawner')));
    const isInspectingSpawner = !!state.levelEditor.toolbarSpawnerTooltip || !!state.levelEditor.selectedCustomSpawner;

    if (isPlacingSpawner || isHovSpawner || isInspectingSpawner) {
      push();
      // 1. Scan active chunks in the viewport to draw all spawner radii
      if (state.world?.chunks) {
        state.world.chunks.forEach((chunk: any) => {
          const chunkW = CHUNK_SIZE * GRID_SIZE;
          const cX = chunk.cx * chunkW;
          const cY = chunk.cy * chunkW;
          if (state.viewportBounds) {
            if (cX + chunkW < state.viewportBounds.minX || cX > state.viewportBounds.maxX ||
                cY + chunkW < state.viewportBounds.minY || cY > state.viewportBounds.maxY) {
              return;
            }
          }

          const spawnerCandidates = [...(chunk.overlayBlocks || []), ...(chunk.liquidBlocks || [])];
          for (let i = 0; i < spawnerCandidates.length; i++) {
            const b = spawnerCandidates[i];
            const isLiquid = b.liquidType === 'l_spawner' || (b.liquidType && !!liquidTypes[b.liquidType]?.isEnemySpawner) || (!!b.customSpawnerConfig && !!b.liquidType);
            const oCfg = (b.overlay ? overlayTypes[b.overlay] : null) || (b.liquidType ? liquidTypes[b.liquidType] : null);
            if (!oCfg && !b.customSpawnerConfig) continue;
            if (!oCfg?.isEnemySpawner && !oCfg?.enemySpawnConfig && !b.customSpawnerConfig && b.overlay !== 'ov_spawner_custom' && b.liquidType !== 'l_spawner') continue;

            const sCfg = b.customSpawnerConfig ? { ...oCfg?.enemySpawnConfig, ...b.customSpawnerConfig } : oCfg?.enemySpawnConfig;
            const rawTrig = sCfg?.spawnTriggerRadius !== undefined ? sCfg.spawnTriggerRadius : 200;
            const trigRad = rawTrig < 0 ? 0 : Math.max(100, rawTrig);
            const spawnRad = sCfg?.spawnRadius > 0 ? sCfg.spawnRadius : 120;
            const bcx = (b.pos?.x ?? b.gx * GRID_SIZE) + GRID_SIZE / 2;
            const bcy = (b.pos?.y ?? b.gy * GRID_SIZE) + GRID_SIZE / 2;

            const isFocus = (hovBlk && hovBlk.gx === b.gx && hovBlk.gy === b.gy) ||
                            (state.levelEditor.toolbarSpawnerTooltip?.targetBlock && state.levelEditor.toolbarSpawnerTooltip.targetBlock.gx === b.gx && state.levelEditor.toolbarSpawnerTooltip.targetBlock.gy === b.gy) ||
                            (state.levelEditor.selectedCustomSpawner && state.levelEditor.selectedCustomSpawner.gx === b.gx && state.levelEditor.selectedCustomSpawner.gy === b.gy);

            if (isFocus) {
              // Focused/Hovered spawner: Vibrant highlights with labels
              if (isLiquid && trigRad > 0) {
                fill(255, 140, 0, 24);
                stroke(255, 160, 0, 220);
                strokeWeight(1.8);
                ellipse(bcx, bcy, trigRad * 2, trigRad * 2);

                noStroke();
                fill(255, 180, 50, 240);
                textAlign(CENTER, BOTTOM);
                textSize(10);
                text(`Trigger: ${trigRad}px`, bcx, bcy - trigRad - 4);
              }

              fill(180, 50, 255, 30);
              stroke(200, 70, 255, 230);
              strokeWeight(1.8);
              ellipse(bcx, bcy, spawnRad * 2, spawnRad * 2);

              noStroke();
              fill(220, 140, 255, 240);
              textAlign(CENTER, TOP);
              textSize(10);
              text(`Spawn: ${spawnRad}px`, bcx, bcy + spawnRad + 4);
            } else {
              // Contextual multi-spawner background rings (thin, non-distracting)
              noFill();
              if (isLiquid && trigRad > 0) {
                stroke(255, 160, 0, 95);
                strokeWeight(1.2);
                ellipse(bcx, bcy, trigRad * 2, trigRad * 2);
              }
              stroke(192, 132, 252, 95);
              strokeWeight(1.2);
              ellipse(bcx, bcy, spawnRad * 2, spawnRad * 2);
            }
          }
        });
      }

      // 2. Cursor Snapping / Placement Preview Ring
      if (isPlacingSpawner && !isHovSpawner) {
        const curCfg = state.levelEditor.copiedSpawnerConfig || state.levelEditor.toolbarSpawnerTooltip?.config ||
          (state.levelEditor.activeCategory === 'liquids' ? liquidTypes[state.levelEditor.selectedItemKey]?.enemySpawnConfig : overlayTypes[state.levelEditor.selectedItemKey]?.enemySpawnConfig);
        const curSpawnRad = curCfg?.spawnRadius > 0 ? curCfg.spawnRadius : 120;
        const curTrigRad = curCfg?.spawnTriggerRadius > 0 ? curCfg.spawnTriggerRadius : 200;
        const isLiquidPlacement = state.levelEditor.activeCategory === 'liquids';

        const curCenterWorldX = tileX + GRID_SIZE / 2;
        const curCenterWorldY = tileY + GRID_SIZE / 2;

        if (isLiquidPlacement && curTrigRad > 0) {
          fill(255, 140, 0, 18);
          stroke(255, 160, 0, 180);
          strokeWeight(1.5);
          ellipse(curCenterWorldX, curCenterWorldY, curTrigRad * 2, curTrigRad * 2);
        }
        fill(180, 50, 255, 22);
        stroke(200, 70, 255, 190);
        strokeWeight(1.5);
        ellipse(curCenterWorldX, curCenterWorldY, curSpawnRad * 2, curSpawnRad * 2);
      }
      pop();
    }
  }

  pop();

  // 4. Left Palette Panel
  drawLeftPalettePanel(leftPanelW, topBarH);

  // 4.5 Floating Separated Level Info Panel (debugMode green text style)
  drawLevelInfoPanel(leftPanelW, topBarH);

  // 5. Top Action Header
  drawTopBar(topBarH, leftPanelW);

  // 5.1 Toast Notification Banner
  drawEditorToast(leftPanelW, topBarH);

  // 5.2 Read-Only Spawner Hover Tooltip on world canvas
  if (isOverWorld && !isOverSpawnerTip) {
    const hovBlk = state.world?.getBlock(gx, gy);
    if (hovBlk) {
      const isLiquid = hovBlk.liquidType === 'l_spawner' || (hovBlk.liquidType && !!liquidTypes[hovBlk.liquidType]?.isEnemySpawner) || (!!hovBlk.customSpawnerConfig && !!hovBlk.liquidType);
      const isOverlay = !hovBlk.isMined && (hovBlk.overlay?.startsWith('ov_spawner') || !!overlayTypes[hovBlk.overlay || '']?.isEnemySpawner || !!overlayTypes[hovBlk.overlay || '']?.enemySpawnConfig || !!hovBlk.customSpawnerConfig);
      if (isLiquid || isOverlay) {
        const oCfg = (isOverlay && hovBlk.overlay ? overlayTypes[hovBlk.overlay] : null) || (isLiquid && hovBlk.liquidType ? liquidTypes[hovBlk.liquidType] : null);
        if (oCfg || hovBlk.customSpawnerConfig) {
          drawWorldHoverSpawnerTooltip(hovBlk, oCfg, topBarH, 0);
        }
      }
    }
  }

  // 5.3 Editable Toolbar Spawner Tooltip
  if (state.levelEditor.toolbarSpawnerTooltip) {
    drawToolbarSpawnerTooltip(topBarH, 0);
  }

  // 5.4 Editable Toolbar Sun Generator Tooltip
  if (state.levelEditor.toolbarSunGeneratorTooltip) {
    drawToolbarSunGeneratorTooltip(topBarH, 0);
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

export interface LevelInfoStats {
  winConditionEnemies: number;
  winConditionObstacles: number;
  totalSunOres: number;
  sunLootCount: number;
  sunGenMaxDropped: number;
  totalOverlaySpawnerBudget: number;
  totalLiquidSpawnerBudget: number;
}

export function computeLevelInfoStats(): LevelInfoStats {
  const stats: LevelInfoStats = {
    winConditionEnemies: 0,
    winConditionObstacles: 0,
    totalSunOres: 0,
    sunLootCount: 0,
    sunGenMaxDropped: 0,
    totalOverlaySpawnerBudget: 0,
    totalLiquidSpawnerBudget: 0
  };

  if (!state.world) return stats;

  if (state.world.chunks) {
    for (const chunk of state.world.chunks.values()) {
      if (chunk.loot) {
        for (const l of chunk.loot) {
          if (l.type === 'sun' || l.type === 'loot_sun') {
            stats.sunLootCount += (l.value || 1);
          }
        }
      }

      for (const block of chunk.blocks) {
        if (!block) continue;

        if (block.isWinCondition && !block.isMined) {
          stats.winConditionObstacles++;
        }

        if (!block.isMined && block.overlay) {
          const ov = block.overlay;
          if (ov !== 'sunGenerator' && ov !== 'ov_sun_generator') {
            if (ov === 'sunTiny') stats.totalSunOres += 1;
            else if (ov === 'sunOre') stats.totalSunOres += 3;
            else if (ov === 'sunClump') stats.totalSunOres += 10;
            else if (ov === 'ov_sunflower') stats.totalSunOres += 5;
            else {
              const cfg = overlayTypes[ov];
              if (cfg?.sunValue) stats.totalSunOres += cfg.sunValue;
              else if (cfg?.oreValue) stats.totalSunOres += cfg.oreValue;
            }
          }
        }

        if (!block.isMined && (block.overlay === 'sunGenerator' || block.overlay === 'ov_sun_generator')) {
          const cfg = block.sunGeneratorConfig || block.customSunGeneratorConfig;
          const maxS = cfg?.maxSun !== undefined ? cfg.maxSun : (overlayTypes['sunGenerator']?.maxSunDropped ?? 100);
          stats.sunGenMaxDropped += maxS;
        }

        if (!block.isMined && block.overlay) {
          const ov = block.overlay;
          const oCfg = overlayTypes[ov];
          if (ov === 'ov_spawner_custom' || ov.startsWith('ov_spawner') || ov.startsWith('spawner_') || oCfg?.isEnemySpawner) {
            const spCfg = block.customSpawnerConfig || oCfg?.enemySpawnConfig;
            const b = spCfg?.budget !== undefined ? spCfg.budget : (block.spawnerBudget || 60);
            stats.totalOverlaySpawnerBudget += b;
          }
        }

        if (block.liquidType) {
          const lKey = block.liquidType;
          const lCfg = liquidTypes[lKey];
          if (lKey === 'l_spawner' || lKey.startsWith('l_spawner') || lCfg?.isEnemySpawner || block.customSpawnerConfig) {
            const spCfg = block.customSpawnerConfig || lCfg?.enemySpawnConfig;
            let b = 0;
            if (spCfg?.budget !== undefined) {
              b = spCfg.budget;
            } else if (spCfg?.hourlySpawnConfig) {
              const day = (spCfg.hourlySpawnConfig.hourlyDaytimeBudget || [10, 20, 30]).reduce((acc: number, v: number) => acc + v, 0);
              const night = (spCfg.hourlySpawnConfig.hourlyNighttimeBudget || [30, 50, 80]).reduce((acc: number, v: number) => acc + v, 0);
              b = day + night;
            } else {
              b = 60;
            }
            stats.totalLiquidSpawnerBudget += b;
          }
        }
      }
    }
  }

  if (state.enemies) {
    for (const e of state.enemies) {
      if (e.isWinCondition) {
        stats.winConditionEnemies++;
      }
    }
  }

  return stats;
}

export function isMouseOverLevelInfoPanel(leftPanelW: number, topBarH: number): boolean {
  const infoX = leftPanelW + 4;
  const infoY = topBarH + 4;
  const infoW = 140;
  const infoH = 85;
  return mouseX >= infoX && mouseX <= infoX + infoW && mouseY >= infoY && mouseY <= infoY + infoH;
}

export function drawLevelInfoPanel(leftPanelW: number, topBarH: number) {
  const stats = computeLevelInfoStats();
  const infoX = leftPanelW + 4;
  const infoY = topBarH + 4;
  const infoW = 140;
  const infoH = 85;

  push();
  // Reuse debugMode info panel design: fill(0, 220), r=8
  fill(0, 220);
  stroke(35, 48, 85, 200);
  strokeWeight(1);
  rect(infoX, infoY, infoW, infoH, 8);
  noStroke();

  // Debug neon green text
  fill(0, 255, 150);
  textAlign(LEFT, TOP);
  textSize(8);
  textStyle(NORMAL);

  let ty = infoY + 8;
  const lineGap = 10;
  const textX = infoX + 12;

  text(`WinCondition enemies: ${stats.winConditionEnemies}`, textX, ty); ty += lineGap;
  text(`WinCondition obstacles: ${stats.winConditionObstacles}`, textX, ty); ty += lineGap;
  text(`Sun ores: ${stats.totalSunOres}`, textX, ty); ty += lineGap;
  text(`Sun loots: ${stats.sunLootCount}`, textX, ty); ty += lineGap;
  text(`Sun generators: ${stats.sunGenMaxDropped}`, textX, ty); ty += lineGap;
  text(`Overlay spawner budget: ${stats.totalOverlaySpawnerBudget}`, textX, ty); ty += lineGap;
  text(`Ground spawner budget: ${stats.totalLiquidSpawnerBudget}`, textX, ty);

  pop();
}

export function wrapInternalKey(key: string, maxW: number): string[] {
  if (textWidth(key) <= maxW) return [key];

  const parts = key.split('_');
  if (parts.length > 1) {
    const lines: string[] = [];
    let cur = '';
    for (let i = 0; i < parts.length; i++) {
      const seg = (i < parts.length - 1) ? parts[i] + '_' : parts[i];
      if (!cur) {
        cur = seg;
      } else if (textWidth(cur + seg) <= maxW) {
        cur += seg;
      } else {
        lines.push(cur);
        cur = seg;
      }
    }
    if (cur) lines.push(cur);

    const finalLines: string[] = [];
    for (const line of lines) {
      if (textWidth(line) <= maxW) {
        finalLines.push(line);
      } else {
        let charBuf = '';
        for (const ch of line) {
          if (textWidth(charBuf + ch) <= maxW) {
            charBuf += ch;
          } else {
            if (charBuf) finalLines.push(charBuf);
            charBuf = ch;
          }
        }
        if (charBuf) finalLines.push(charBuf);
      }
    }
    return finalLines;
  }

  const lines: string[] = [];
  let cur = '';
  for (const ch of key) {
    if (textWidth(cur + ch) <= maxW) {
      cur += ch;
    } else {
      if (cur) lines.push(cur);
      cur = ch;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function getGroupsForCategory(
  category: string,
  allItems: PaletteItem[]
): { id: string; title: string; accentColor: string; items: PaletteItem[] }[] {
  switch (category) {
    case 'obstacles':
      return [
        { id: 'obstacles', title: 'OBSTACLES', accentColor: '#4ade80', items: allItems.filter(i => i.category === 'obstacles') }
      ];
    case 'overlays':
      return [
        { id: 'overlays', title: 'OVERLAYS', accentColor: '#facc15', items: allItems.filter(i => i.category === 'overlays') }
      ];
    case 'liquids':
      return [
        { id: 'liquids', title: 'LIQUIDS', accentColor: '#38bdf8', items: allItems.filter(i => i.category === 'liquids') }
      ];
    case 'turrets':
      return [
        { id: 't0', title: 'TIER 0 / INSTANT', accentColor: '#fb7185', items: allItems.filter(i => i.category === 'turrets' && i.subCategory === 'Consumables') },
        { id: 't1', title: 'TIER 1', accentColor: '#4ade80', items: allItems.filter(i => i.category === 'turrets' && i.subCategory === 'Tier 1') },
        { id: 't2', title: 'TIER 2', accentColor: '#38bdf8', items: allItems.filter(i => i.category === 'turrets' && i.subCategory === 'Tier 2') },
        { id: 't3', title: 'TIER 3', accentColor: '#a855f7', items: allItems.filter(i => i.category === 'turrets' && i.subCategory === 'Tier 3') },
        { id: 'tspecial', title: 'SPECIAL & FARMS', accentColor: '#facc15', items: allItems.filter(i => i.category === 'turrets' && i.subCategory === 'Special') }
      ];
    case 'entities':
      return [
        { id: 'player', title: 'PLAYER', accentColor: '#22c55e', items: allItems.filter(i => i.category === 'entities' && i.subCategory === 'Player') },
        { id: 'enemies', title: 'ENEMIES', accentColor: '#ef4444', items: allItems.filter(i => i.category === 'entities' && i.subCategory === 'Enemies') },
        { id: 'npcs', title: 'NPCS', accentColor: '#a855f7', items: allItems.filter(i => i.category === 'entities' && i.subCategory === 'NPCs') },
        { id: 'loot', title: 'LOOT', accentColor: '#eab308', items: allItems.filter(i => i.category === 'entities' && i.subCategory === 'Loot') }
      ];
    case 'flags':
      return [
        { id: 'flags', title: 'FLAGS', accentColor: '#ec4899', items: allItems.filter(i => i.category === 'flags') }
      ];
    default:
      return [
        { id: 'obstacles', title: 'OBSTACLES', accentColor: '#4ade80', items: allItems.filter(i => i.category === 'obstacles') }
      ];
  }
}

export function drawTopBar(headerH: number, leftPanelW: number) {
  push();
  const barX = leftPanelW;
  const barW = width - leftPanelW;

  fill(10, 12, 24, 235);
  stroke(35, 45, 80);
  strokeWeight(1);
  rect(barX, 0, barW, headerH);
  noStroke();

  // 1. Tool Buttons (Left of Top Bar)
  let curX = barX + 8;
  const btnH = 26;
  const btnY = (headerH - btnH) / 2;

  // Brush Tool
  const isBrush = state.levelEditor.toolMode === 'brush';
  drawButton(curX, btnY, 46, btnH, 'BRUSH', {
    id: 'le_top_brush',
    variant: isBrush ? 'cyan' : 'dark',
    isSelected: isBrush,
    fontSize: 8,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      state.levelEditor.toolMode = 'brush';
    }
  });
  curX += 46 + 4;

  // Fill Tool
  const isBucket = state.levelEditor.toolMode === 'bucket';
  drawButton(curX, btnY, 40, btnH, 'FILL', {
    id: 'le_top_bucket',
    variant: isBucket ? 'cyan' : 'dark',
    isSelected: isBucket,
    fontSize: 8,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      state.levelEditor.toolMode = 'bucket';
      if (state.levelEditor.activeCategory !== 'obstacles' && state.levelEditor.activeCategory !== 'liquids') {
        state.levelEditor.activeCategory = 'obstacles';
        state.levelEditor.selectedItemKey = 'o_dirt';
      }
    }
  });
  curX += 40 + 4;

  // Obstacle Lasso Tool
  const isLasso = state.levelEditor.toolMode === 'lasso';
  drawButton(curX, btnY, 46, btnH, 'LASSO', {
    id: 'le_top_lasso',
    variant: isLasso ? 'cyan' : 'dark',
    isSelected: isLasso,
    fontSize: 8,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      state.levelEditor.toolMode = 'lasso';
      const validCats = ['obstacles', 'overlays', 'liquids', 'flags'];
      if (!validCats.includes(state.levelEditor.activeCategory)) {
        state.levelEditor.activeCategory = 'obstacles';
        if (!state.levelEditor.selectedItemKey || state.levelEditor.selectedItemKey === 'empty') {
          state.levelEditor.selectedItemKey = 'o_dirt';
        }
      }
    }
  });
  curX += 46 + 4;

  // Spawn Area Tool
  const isSpawnArea = state.levelEditor.toolMode === 'spawn_area';
  drawButton(curX, btnY, 48, btnH, 'SPAWN', {
    id: 'le_top_spawn',
    variant: isSpawnArea ? 'purple' : 'dark',
    isSelected: isSpawnArea,
    fontSize: 8,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      state.levelEditor.toolMode = 'spawn_area';
    }
  });
  curX += 48 + 4;

  // Undo Button (Ctrl+Z)
  const canUndo = (state.levelEditor.undoStack?.length || 0) > 0;
  drawButton(curX, btnY, 46, btnH, '↩ UNDO', {
    id: 'le_top_undo',
    variant: canUndo ? 'yellow' : 'dark',
    disabled: !canUndo,
    fontSize: 7.5,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      undoLevelEditorAction();
    }
  });
  curX += 46 + 4;

  // Redo Button (Ctrl+Y / Ctrl+Shift+Z)
  const canRedo = (state.levelEditor.redoStack?.length || 0) > 0;
  drawButton(curX, btnY, 46, btnH, '↷ REDO', {
    id: 'le_top_redo',
    variant: canRedo ? 'yellow' : 'dark',
    disabled: !canRedo,
    fontSize: 7.5,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      redoLevelEditorAction();
    }
  });
  curX += 46 + 8;

  // 2. Right Action Buttons
  const rightGap = 5;
  const exitW = 58;
  const exportW = 54;
  const importW = 54;
  const almanacW = 96;
  const testW = 62;
  const totalRightW = exitW + exportW + importW + almanacW + testW + rightGap * 4 + 10;
  const rightStartX = width - totalRightW;

  // Draw Right Action Buttons
  let rX = width - 10 - exitW;

  // EXIT MENU Button (Red)
  drawRedButton(rX, btnY, exitW, btnH, "EXIT", {
    id: 'le_btn_exit',
    fontSize: 8.5,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      state.currentScreen = 'main_menu';
    }
  });

  rX -= (exportW + rightGap);

  // EXPORT JSON Button
  drawDarkButton(rX, btnY, exportW, btnH, "EXPORT", {
    id: 'le_btn_export',
    fontSize: 8.5,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      saveLevelLayout();
    }
  });

  rX -= (importW + rightGap);

  // IMPORT JSON Button
  drawDarkButton(rX, btnY, importW, btnH, "IMPORT", {
    id: 'le_btn_import',
    fontSize: 8.5,
    radius: 5,
    depth3D: 1,
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

  rX -= (almanacW + rightGap);

  // ALMANAC CONFIG Button
  drawPurpleButton(rX, btnY, almanacW, btnH, "ALMANAC CONFIG", {
    id: 'le_btn_almanac',
    fontSize: 8,
    radius: 5,
    depth3D: 1,
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

  rX -= (testW + rightGap);

  // TEST LEVEL Button
  drawGreenButton(rX, btnY, testW, btnH, "TEST PLAY", {
    id: 'le_btn_test',
    fontSize: 8.5,
    radius: 5,
    depth3D: 1,
    onClick: () => {
      testPlayLevel();
    }
  });

  pop();
}

export function drawLeftPalettePanel(leftPanelW: number, topBarH: number) {
  push();
  const allItems = getAllPaletteItems();

  // Background
  fill(10, 13, 26, 252);
  stroke(35, 48, 85);
  strokeWeight(1);
  rect(0, 0, leftPanelW, height);
  noStroke();

  // 1. Tab buttons on top of list to filter categories
  const tabs = [
    { id: 'obstacles', label: 'Obstacles' },
    { id: 'overlays', label: 'Overlays' },
    { id: 'liquids', label: 'Liquids' },
    { id: 'turrets', label: 'Turrets' },
    { id: 'entities', label: 'Entities' },
    { id: 'flags', label: 'Flags' }
  ];

  const tabPadX = 6;
  const tabGapX = 3;
  const tabGapY = 4;
  const tabAvailW = leftPanelW - tabPadX * 2;
  const tabBtnW = Math.floor((tabAvailW - 2 * tabGapX) / 3);
  const tabBtnH = 22;
  const tabAreaH = 6 + (tabBtnH * 2) + tabGapY + 6; // 60px

  // Draw Tab Buttons (3 per row, 2 rows)
  for (let idx = 0; idx < tabs.length; idx++) {
    const t = tabs[idx];
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const bx = tabPadX + col * (tabBtnW + tabGapX);
    const by = 6 + row * (tabBtnH + tabGapY);
    const isSelected = (state.levelEditor.activeCategory || 'obstacles') === t.id;

    drawButton(bx, by, tabBtnW, tabBtnH, t.label, {
      id: `le_tab_${t.id}`,
      variant: isSelected ? 'yellow' : 'dark',
      isSelected,
      fontSize: 7.5,
      radius: 4,
      depth3D: 1,
      onClick: () => {
        state.levelEditor.activeCategory = t.id;
        state.levelEditor.paletteScrollY = 0;
        state.levelEditor.paletteScrollVel = 0;
        // If current selection not in this category, select first item
        const grps = getGroupsForCategory(t.id, allItems);
        const inTab = grps.flatMap(g => g.items);
        if (inTab.length > 0 && !inTab.some(it => it.key === state.levelEditor.selectedItemKey)) {
          const first = inTab[0];
          state.levelEditor.selectedItemKey = first.key;
          if ((first.category === 'overlays' && first.key.startsWith('ov_spawner')) || (first.category === 'liquids' && (first.key === 'l_spawner' || first.key.startsWith('l_spawner'))) || first.key === 'l_spawner' || first.key.startsWith('l_spawner')) {
            openToolbarSpawnerTooltip(first.key);
            state.levelEditor.toolbarSunGeneratorTooltip = null;
          } else if (first.category === 'overlays' && first.key === 'sunGenerator') {
            openToolbarSunGeneratorTooltip();
            state.levelEditor.toolbarSpawnerTooltip = null;
          } else {
            state.levelEditor.toolbarSpawnerTooltip = null;
            state.levelEditor.toolbarSunGeneratorTooltip = null;
          }
        }
      }
    });
  }

  // Header separator line below tabs
  stroke(35, 48, 85);
  line(0, tabAreaH, leftPanelW, tabAreaH);
  noStroke();

  // Compute dynamic columns based on width
  const padX = 6;
  const gap = 4;
  const availW = leftPanelW - padX * 2;
  const cols = Math.max(1, Math.floor((availW + gap) / (50 + gap)));
  const cardW = Math.floor((availW - (cols - 1) * gap) / cols);
  const cardH = 40;

  // Active Category & its Groups (keeps groups as separators)
  const activeTab = state.levelEditor.activeCategory || 'obstacles';
  const groups = getGroupsForCategory(activeTab, allItems);

  // Calculate total height
  const sepHeight = 22;
  const sepMargin = 4;
  let totalH = 8;
  for (const g of groups) {
    if (g.items.length === 0) continue;
    totalH += sepHeight + sepMargin;
    const rows = Math.ceil(g.items.length / cols);
    totalH += rows * (cardH + gap) + 6;
  }

  const viewportY = tabAreaH + 1;
  const viewportH = height - viewportY;
  const maxScroll = Math.min(0, viewportH - totalH);

  // Smooth scroll velocity
  if (state.levelEditor.paletteScrollVel) {
    state.levelEditor.paletteScrollY = constrain(
      (state.levelEditor.paletteScrollY || 0) + state.levelEditor.paletteScrollVel,
      maxScroll,
      0
    );
    state.levelEditor.paletteScrollVel *= 0.85;
    if (Math.abs(state.levelEditor.paletteScrollVel) < 0.01) state.levelEditor.paletteScrollVel = 0;
  } else {
    state.levelEditor.paletteScrollY = constrain(state.levelEditor.paletteScrollY || 0, maxScroll, 0);
  }

  const scrollY = state.levelEditor.paletteScrollY || 0;

  // Clip content area
  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(0, viewportY, leftPanelW, viewportH);
    dc.clip();
  }

  let curY = viewportY + 6 + scrollY;

  for (const g of groups) {
    if (g.items.length === 0) continue;

    // Draw Group Separator
    const sepY = curY;
    if (sepY + sepHeight > viewportY && sepY < viewportY + viewportH) {
      fill(16, 21, 38, 240);
      stroke(35, 48, 80);
      strokeWeight(1);
      rect(padX, sepY, availW, sepHeight, 4);
      noStroke();

      // Accent pip
      fill(g.accentColor);
      rect(padX + 5, sepY + 5, 3, sepHeight - 10, 1.5);

      // Title
      textAlign(LEFT, CENTER);
      textSize(8);
      textStyle(NORMAL);
      fill(210, 225, 245);
      text(g.title, padX + 13, sepY + sepHeight / 2);

      // Count
      textAlign(RIGHT, CENTER);
      textSize(7.5);
      fill(110, 130, 165);
      text(`${g.items.length}`, padX + availW - 6, sepY + sepHeight / 2);
    }

    curY += sepHeight + sepMargin;

    // Draw Items
    for (let i = 0; i < g.items.length; i++) {
      const item = g.items[i];
      const c = i % cols;
      const r = Math.floor(i / cols);

      const cx = padX + c * (cardW + gap);
      const cy = curY + r * (cardH + gap);

      if (cy + cardH > viewportY && cy < viewportY + viewportH) {
        const isSelected = state.levelEditor.selectedItemKey === item.key;

        drawCard(cx, cy, cardW, cardH, {
          radius: 5,
          isSelected,
          isHoverable: true,
          id: `le_card_${item.key}`,
          onClick: () => {
            state.levelEditor.activeCategory = item.category;
            state.levelEditor.selectedItemKey = item.key;
            if ((item.category === 'overlays' && item.key.startsWith('ov_spawner')) || (item.category === 'liquids' && (item.key === 'l_spawner' || item.key.startsWith('l_spawner'))) || item.key === 'l_spawner' || item.key.startsWith('l_spawner')) {
              openToolbarSpawnerTooltip(item.key);
              state.levelEditor.toolbarSunGeneratorTooltip = null;
            } else if (item.category === 'overlays' && item.key === 'sunGenerator') {
              openToolbarSunGeneratorTooltip();
              state.levelEditor.toolbarSpawnerTooltip = null;
            } else {
              state.levelEditor.toolbarSpawnerTooltip = null;
              state.levelEditor.toolbarSunGeneratorTooltip = null;
            }
          }
        });

        // Icon
        renderPaletteItemIcon(item, cx + cardW / 2, cy + 17, 25);

        // Internal Key Label (wrappable inside frame)
        textAlign(CENTER, TOP);
        textSize(6.5);
        textStyle(NORMAL);
        noStroke();
        fill(isSelected ? [255, 255, 255] : [140, 160, 190]);
        const lines = wrapInternalKey(item.key, cardW - 4);
        const lineH = 7.5;
        const maxLines = Math.min(3, lines.length);
        const totalTextH = maxLines * lineH;
        const startTextY = cy + 24 + Math.max(0, (23 - totalTextH) / 2);
        for (let li = 0; li < maxLines; li++) {
          text(lines[li], cx + cardW / 2, startTextY + li * lineH);
        }
      }
    }

    const rows = Math.ceil(g.items.length / cols);
    curY += rows * (cardH + gap) + 6;
  }

  if (dc) {
    dc.restore();
  }

  // Draw Slim Scrollbar Track & Thumb
  if (totalH > viewportH) {
    const trackH = viewportH - 8;
    const thumbH = Math.max(20, (viewportH / totalH) * trackH);
    const scrollRatio = (-scrollY) / (totalH - viewportH);
    const thumbY = viewportY + 4 + scrollRatio * (trackH - thumbH);
    const scrollX = leftPanelW - 4;

    fill(255, 255, 255, 15);
    rect(scrollX, viewportY + 4, 3, trackH, 1.5);
    fill(0, 220, 255, 140);
    rect(scrollX, thumbY, 3, thumbH, 1.5);
  }

  // Draw Resize Handle Line
  const isHoverResize = Math.abs(mouseX - leftPanelW) <= 5;
  const isResizing = state.levelEditor.isResizingLeftPanel;
  stroke(isResizing ? [0, 220, 255] : isHoverResize ? [0, 200, 255, 180] : [35, 48, 85]);
  strokeWeight(isResizing ? 2.5 : isHoverResize ? 2 : 1);
  line(leftPanelW, 0, leftPanelW, height);

  // Set mouse cursor
  if (isHoverResize || isResizing) {
    if (typeof document !== 'undefined' && document.body) {
      document.body.style.cursor = 'col-resize';
    }
  } else if (typeof document !== 'undefined' && document.body && document.body.style.cursor === 'col-resize') {
    document.body.style.cursor = 'default';
  }

  pop();
}

export function drawEditorToast(leftPanelW: number, topBarH: number) {
  if (!state.levelEditor.editorToastMessage || (state.levelEditor.editorToastTimer || 0) <= 0) {
    return;
  }

  state.levelEditor.editorToastTimer = (state.levelEditor.editorToastTimer || 0) - 1;
  const timer = state.levelEditor.editorToastTimer;
  const alpha = Math.min(255, timer * 6);

  push();
  textSize(9);
  textStyle(NORMAL);
  const msg = state.levelEditor.editorToastMessage;
  const tw = textWidth(msg) + 24;
  const th = 26;
  const tx = leftPanelW + (width - leftPanelW - tw) / 2;
  const ty = topBarH + 12;

  fill(12, 16, 32, Math.min(240, alpha));
  stroke(0, 220, 255, alpha);
  strokeWeight(1);
  rect(tx, ty, tw, th, 6);
  noStroke();

  textAlign(CENTER, CENTER);
  fill(255, 255, 255, alpha);
  text(msg, tx + tw / 2, ty + th / 2);
  pop();
}


// Configure willReadFrequently on 2D canvas contexts for accelerated pixel readbacks
if (typeof HTMLCanvasElement !== 'undefined') {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, attributes?: any): any {
    if (type === '2d') {
      attributes = attributes ? { willReadFrequently: true, ...attributes } : { willReadFrequently: true };
    }
    return origGetContext.call(this, type, attributes);
  };
}

import { state } from './state';
import { 
  GRID_SIZE, HEX_DIST, MAX_VFX, HOUR_FRAMES, CHUNK_SIZE, PLAYER_DRAG_MIN_DISTANCE_TILES, PLAYER_DRAG_MAX_DISTANCE_TILES,
  VISIBILITY_RADIUS
} from './constants';
import { turretTypes } from './balanceTurrets';
import { findMergeResult } from './dictionaryTurretMerging';
import { enemyTypes } from './balanceEnemies';
import { bulletTypes } from './balanceBullets';
import { WorldManager } from './world';
import { Player, Enemy, AttachedTurret, WorldTurret, SunLoot, NPCEntity } from './entities';
import { createAttachedTurret, createWorldTurret } from './class/turret/TurretRegistry';
import { getTime, drawUI, drawTurretTooltip } from './ui/ui';
import { drawAlmanac, handleAlmanacClick } from './ui/almanac/mainLayout';
import { drawUnlockPopup, handleUnlockPopupClick, updateUnlockPopup } from './ui/almanac/turretUnlockPopup';
import { drawGameOver, handleGameOverClick } from './ui/uiGameOver';
import { drawWorldGenPreview, drawTurretPathDebug } from './ui/uiDebug';
import { uiComponentsShowcase } from './ui/uiComponentsShowcase';
import { handleNpcUiClick, handleNpcUiPress } from './ui/uiNpcShop';
import { updateGameSystems, spawnFromBudget, getLightLevel, customDayLightConfig } from './lvDemo';
import { MergeVFX, ShopFlyVFX, Explosion } from './vfx/index';
import { overlayTypes } from './balanceObstacles';
import { triggerUpgradeHook } from './src/upgrades';
import { ASSETS } from './assets';
import { getHexAxial, axialToWorld, isAdjacent } from './utils/hex';
import { handleTouchStarted, handleTouchMoved, handleTouchEnded, drawTouchVisuals } from './touchScreen';
import { drawGameSpeedButtons, handleGameSpeedButtonClick } from './ui/uiGameSpeed';
// Added TYPE_MAP to imports to resolve the error on line 413
import { drawTurretSprite, TYPE_MAP } from './assetTurret';
import { drawSelectionHighlight, drawMergeBubble } from './ui/overlay/TurretMergeOverlay';
import { drawPendingSpawn } from './visualEnemies';
import { drawTickingExplosive } from './visualObstacles';
import { DisabledTurrets } from './debug/turretAvailability';
import { drawMainMenu, handleMainMenuClick, handleMainMenuPress, handleMainMenuDrag, handleMainMenuRelease } from './ui/uiMainMenu';
import { beginUIFrame, handleUIMousePress, handleUIMouseRelease } from './uiComponents';
import {
  drawLevelEditor,
  handleLevelEditorPress,
  handleLevelEditorClick,
  handleLevelEditorScroll,
  handleLevelEditorMouseRelease,
  handleSpawnerKeyInput,
  handleSunGeneratorKeyInput,
  paygateModal,
  handlePayGateModalKeyInput,
  handlePayGateCostModalDrag,
  sunGeneratorModal,
  handleSunGeneratorModalKeyInput,
  textSignEditor,
  handleInlineTextSignKeyInput,
  handleInlineTextSignDrag
} from './levelEditor';
import { getPlayerUpgradeStat } from './src/playerUpgrades';
import { 
  handlePlayerUpgradeKeyInput, 
  handlePlayerUpgradeMouseDrag, 
  handlePlayerUpgradeMouseRelease,
  handlePlayerUpgradesScroll
} from './ui/almanac/playerUpgradesPanel';
import { handleLevelConfigKeyInput, handleLevelConfigScroll } from './ui/almanac/levelConfigPanel';
import { flowField } from './pathfinding';
import { spatialGrid } from './class/spatialGrid';

declare const p5: any;
declare const createCanvas: any;
declare const windowWidth: any;
declare const windowHeight: any;
declare const background: any;
declare const lerp: any;
declare const width: any;
declare const height: any;
declare const mouseX: any;
declare const mouseY: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const createVector: any;
declare const image: any;
declare const noFill: any;
declare const stroke: any;
declare const ellipse: any;
declare const fill: any;
declare const dist: any;
declare const textFont: any;
declare const round: any;
declare const abs: any;
declare const constrain: any;
declare const sqrt: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const createGraphics: any;
declare const line: any;
declare const strokeWeight: any;
declare const mouseIsPressed: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const key: any;
declare const CENTER: any;
declare const LEFT: any;
declare const TOP: any;
declare const rectMode: any;
declare const textWidth: any;
declare const color: any;
declare const lerpColor: any;
declare const rotate: any;
declare const scale: any;
declare const loadImage: any;
declare const imageMode: any;
declare const floor: any;
declare const noise: any;
declare const keyCode: any;
declare const drawingContext: any;

function rebuildSpatialHash() {
  spatialGrid.clear();
  state.spatialGrid = spatialGrid;
  
  // 1. Add Enemies
  for (const e of state.enemies) {
    if (e.isDying) continue;
    spatialGrid.insert(e, e.pos.x, e.pos.y);
  }

  // 2. Add Player
  spatialGrid.insert(state.player, state.player.pos.x, state.player.pos.y);

  // 3. Add Turrets from Active Chunks
  state.activeChunkKeys.forEach((key: string) => {
    const chunk = state.world.chunks.get(key);
    if (chunk) {
      for (const t of chunk.turrets) {
        const twPos = t.getWorldPos();
        spatialGrid.insert(t, twPos.x, twPos.y);
      }
    }
  });

  // 4. Add Player Attachments
  for (const t of state.player.attachments) {
    const twPos = t.getWorldPos();
    spatialGrid.insert(t, twPos.x, twPos.y);
  }
}

function drawGlobalLighting() {
  let t = getTime();
  let mins = t.hour * 60 + t.minutes;
  const keys: any[] = [];
  for (let h = 0; h < 24; h++) {
    const l = getLightLevel(h);
    let c = [0, 0, 0, 0];
    if (l === 0) c = [15, 10, 50, 140];
    else if (l === 1) c = [180, 50, 20, 48];
    else c = [0, 0, 0, 0];
    keys.push({ m: h * 60, c });
  }
  keys.push({ m: 24 * 60, c: keys[0].c });
  let k1 = keys[0], k2 = keys[keys.length-1];
  for(let i=0; i<keys.length-1; i++) {
    if (mins >= keys[i].m && mins < keys[i+1].m) { k1 = keys[i]; k2 = keys[i+1]; break; }
  }
  let f = (mins - k1.m) / (k2.m - k1.m);
  let r = lerp(k1.c[0], k2.c[0], f);
  let g = lerp(k1.c[1], k2.c[1], f);
  let b = lerp(k1.c[2], k2.c[2], f);
  let a = lerp(k1.c[3], k2.c[3], f);

  // GAME OVER TINT Transition (linked to showGameOverPopup)
  if (state.isGameOver) {
    const p = state.gameOverProgress;
    r = lerp(r, 60, p);
    g = lerp(g, 10, p);
    b = lerp(b, 120, p);
    a = lerp(a, 220, p);
  }

  if (a > 1) { push(); noStroke(); fill(r, g, b, a); rect(0, 0, width, height); pop(); }
}

function drawVisibilityOverlay() {
  const px = width / 2;
  const py = height / 2;
  const innerRadius = (VISIBILITY_RADIUS - 2) * GRID_SIZE;
  const outerRadius = (VISIBILITY_RADIUS) * GRID_SIZE;

  push();
  drawingContext.save();
  // Use a radial gradient to create the cutout effect
  const grad = drawingContext.createRadialGradient(px, py, 0, px, py, outerRadius);
  grad.addColorStop(0, 'rgba(12,12,27,0)');
  grad.addColorStop(innerRadius / outerRadius, 'rgba(12,12,27,0)');
  grad.addColorStop(1, 'rgba(12,12,27,1)');
  
  drawingContext.fillStyle = grad;
  // Draw a large enough rectangle to cover the screen even when zoomed/shaken
  drawingContext.fillRect(0, 0, width, height);
  
  // Also fill the rest of the screen outside the gradient radius if necessary
  // But since we are drawing in screen space (not world space), width/height is enough
  // unless the gradient is smaller than the screen.
  // If the gradient is smaller than the screen, we need to fill the rest with black.
  if (outerRadius < Math.max(width, height)) {
    drawingContext.strokeStyle = 'rgba(12,12,27,1)';
    drawingContext.lineWidth = Math.max(width, height) * 2;
    drawingContext.beginPath();
    drawingContext.arc(px, py, outerRadius + drawingContext.lineWidth / 2, 0, Math.PI * 2);
    drawingContext.stroke();
  }
  
  drawingContext.restore();
  pop();
}

function drawAllTurretConnections() {
  push();
  stroke(255, 255, 255, 60);
  strokeWeight(1.5);
  for (const t of state.player.attachments) {
    if (t.hq === undefined) continue;
    const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
    const wPos = t.getWorldPos();
    for (let [dq, dr] of neighbors) {
      const nq = t.hq + dq;
      const nr = t.hr + dr;
      if (nq === 0 && nr === 0) {
        line(wPos.x, wPos.y, state.player.pos.x, state.player.pos.y);
      } else {
        const neighbor = state.player.attachments.find((a: any) => a.hq === nq && a.hr === nr);
        if (neighbor) {
          const nwPos = neighbor.getWorldPos();
          line(wPos.x, wPos.y, nwPos.x, nwPos.y);
        }
      }
    }
  }
  pop();
}

function drawTurretConnections(t: any) {
  if (t.hq === undefined) return; 
  const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
  const wPos = t.getWorldPos();
  push();
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  for (let [dq, dr] of neighbors) {
    const nq = t.hq + dq;
    const nr = t.hr + dr;
    if (nq === 0 && nr === 0) {
      line(wPos.x, wPos.y, state.player.pos.x, state.player.pos.y);
    } else {
      const neighbor = state.player.attachments.find((a: any) => a.hq === nq && a.hr === nr);
      if (neighbor) {
        const nwPos = neighbor.getWorldPos();
        line(wPos.x, wPos.y, nwPos.x, nwPos.y);
      }
    }
  }
  pop();
}

function executePlacement() {
  if (!state.previewSnapPos) return;
  const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
  if (!activePlacementType && !state.draggedTurretInstance) return;
  
  const type = state.draggedTurretInstance ? state.draggedTurretInstance.type : activePlacementType;
  if (!type) return;
  const config = turretTypes[type];
  const isOwned = activePlacementType ? (state.inventory.items[activePlacementType] || 0) > 0 : false;
  const sunCost = config.costs?.sun || config.cost || 0;
  const elixirCost = config.costs?.elixir || 0;
  const soilCost = config.costs?.soil || 0;

  if (state.mergeTargetPreview) {
    // Merging logic (Unified for both Attached and World Turrets)
    const mergeCost = state.mergeTargetPreview.cost;
    const isNewPlacement = !!activePlacementType;
    const purchaseCost = (isNewPlacement && !isOwned) ? sunCost : 0;
    const totalSunReq = purchaseCost + mergeCost;
    
    let canAfford = state.sunCurrency >= totalSunReq &&
                    state.elixirCurrency >= (isOwned ? 0 : elixirCost) &&
                    state.soilCurrency >= (isOwned ? 0 : soilCost);
    
    if (canAfford) {
      // Deduct costs
      if (isOwned) {
        state.inventory.items[activePlacementType]--;
        const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
        if (specIdx !== -1) state.inventory.specList.splice(specIdx, 1);
        state.sunCurrency -= mergeCost;
      } else {
        state.sunCurrency -= totalSunReq;
        state.elixirCurrency -= elixirCost;
        state.soilCurrency -= soilCost;
      }

      // Find the target instance
      let targetInstance = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (!targetInstance) {
        targetInstance = state.world.getAllTurrets().find((t: any) => t.uid === state.mergeTargetPreview.uid);
      }

      if (targetInstance) {
        const wPos = targetInstance.getWorldPos();
        if (targetInstance instanceof AttachedTurret) {
          const indexToReplace = state.player.attachments.indexOf(targetInstance);
          const newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, targetInstance.hq, targetInstance.hr);
          newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
          state.player.attachments[indexToReplace] = newTurret;
        } else if (targetInstance instanceof WorldTurret) {
          const newTurret = createWorldTurret(state.mergeTargetPreview.type, targetInstance.gx, targetInstance.gy);
          newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
          state.world.removeTurret(targetInstance.gx, targetInstance.gy);
          state.world.addTurret(newTurret);
        }
        
        state.totalTurretsAcquired++;
        state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
        if (activePlacementType) state.turretLastUsed[activePlacementType] = state.frames;
        
        // Clear selected state after merge
        state.selectedTurretType = null;
        
        // If we were dragging an instance, it's now consumed
        if (state.draggedTurretInstance) {
          triggerUpgradeHook('onMerge', state.draggedTurretInstance, {});
          if (state.draggedTurretInstance instanceof AttachedTurret) {
            const idx = state.player.attachments.indexOf(state.draggedTurretInstance);
            if (idx !== -1) state.player.attachments.splice(idx, 1);
          } else if (state.draggedTurretInstance instanceof WorldTurret) {
            state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
          }
          state.draggedTurretInstance = null;
        }
      }
    }
    return;
  }

  if (state.previewWorldSnap) {
    // Placement on WorldGrid (No Merge)
    const { gx, gy } = state.previewWorldSnap;
    
    if (activePlacementType) {
      if (isOwned || (state.sunCurrency >= sunCost && state.elixirCurrency >= elixirCost && state.soilCurrency >= soilCost)) {
        let preservedHp = undefined;
        if (isOwned) {
          state.inventory.items[activePlacementType]--;
          const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
          if (specIdx !== -1) {
            preservedHp = state.inventory.specList[specIdx].hp;
            state.inventory.specList.splice(specIdx, 1);
          }
        } else {
          state.sunCurrency -= sunCost;
          state.elixirCurrency -= elixirCost;
          state.soilCurrency -= soilCost;
        }
        const wt = createWorldTurret(type, gx, gy);
        if (preservedHp !== undefined) wt.health = preservedHp;
        state.world.addTurret(wt);
        state.totalTurretsAcquired++;
        state.turretLastUsed[activePlacementType] = state.frames;
        state.selectedTurretType = null; // Deselect after placement
      }
    } else if (state.draggedTurretInstance) {
      // Moving from hex grid or world grid to world grid
      const preservedHp = state.draggedTurretInstance.health;
      if (state.draggedTurretInstance instanceof AttachedTurret) {
        const startPos = state.draggedTurretInstance.getWorldPos().copy();
        const idx = state.player.attachments.indexOf(state.draggedTurretInstance);
        if (idx !== -1) state.player.attachments.splice(idx, 1);
        const wt = createWorldTurret(type, gx, gy);
        wt.pos = startPos;
        if (preservedHp !== undefined) wt.health = preservedHp;
        wt.maxHealth = state.draggedTurretInstance.maxHealth;
        wt.baseIngredients = state.draggedTurretInstance.baseIngredients;
        wt.stats = state.draggedTurretInstance.stats;
        wt.angle = state.draggedTurretInstance.angle;
        wt.conditions = state.draggedTurretInstance.conditions;
        state.world.addTurret(wt);
        // Transfer all active VFX targeting the old attached turret to the new world turret
        for (let v of state.vfx) {
          if (v && v.target === state.draggedTurretInstance) {
            v.target = wt;
          }
        }
      } else if (state.draggedTurretInstance instanceof WorldTurret) {
        state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
        state.draggedTurretInstance.gx = gx;
        state.draggedTurretInstance.gy = gy;
        state.world.addTurret(state.draggedTurretInstance);
      }
      state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
      state.draggedTurretInstance = null;
    }
    return;
  }

  const snapAxial = getHexAxial(state.previewSnapPos.x - state.player.pos.x, state.previewSnapPos.y - state.player.pos.y);
  
  if (activePlacementType) {
    const config = turretTypes[activePlacementType];
    const isOwned = (state.inventory.items[activePlacementType] || 0) > 0;
    const sunCost = config.costs?.sun || config.cost || 0;
    const elixirCost = config.costs?.elixir || 0;
    const soilCost = config.costs?.soil || 0;

    if (state.mergeTargetPreview) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        const mergeCost = state.mergeTargetPreview.cost;
        const purchaseCost = isOwned ? 0 : sunCost;
        let canAfford = state.sunCurrency >= (purchaseCost + mergeCost) &&
                        state.elixirCurrency >= (isOwned ? 0 : elixirCost) &&
                        state.soilCurrency >= (isOwned ? 0 : soilCost);
        
        if (canAfford) {
          triggerUpgradeHook('onMerge', target, {});
          if (isOwned) {
             state.inventory.items[activePlacementType]--;
             // Also remove one instance from specList
             const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
             if (specIdx !== -1) state.inventory.specList.splice(specIdx, 1);
             state.sunCurrency -= mergeCost;
          } else {
             state.sunCurrency -= (purchaseCost + mergeCost);
             state.elixirCurrency -= elixirCost;
             state.soilCurrency -= soilCost;
          }
          const indexToReplace = state.player.attachments.indexOf(target);
          const newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
          newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
          state.player.attachments[indexToReplace] = newTurret;
          state.totalTurretsAcquired++;
          state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y, [255, 255, 255]));
          state.turretLastUsed[activePlacementType] = state.frames;
        }
      }
    } else {
      const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity');
      const doesCount = config?.countTowardAttachedCapacity !== false && config?.CountTowardAttachedCapacity !== false;
      if (doesCount && state.player.getAttachedCount() >= maxCapacity) {
        state.selectedTurretType = null;
        state.draggedTurretType = null;
        state.draggedTurretInstance = null;
        state.isCurrentlyDragging = false;
        return;
      }
      const canAfford = isOwned || (
        state.sunCurrency >= sunCost &&
        state.elixirCurrency >= elixirCost &&
        state.soilCurrency >= soilCost
      );
      if (canAfford) {
        let preservedHp = undefined;
        if (isOwned) {
          state.inventory.items[activePlacementType]--;
          const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
          if (specIdx !== -1) {
            preservedHp = state.inventory.specList[specIdx].hp;
            state.inventory.specList.splice(specIdx, 1);
          }
        } else {
          state.sunCurrency -= sunCost;
          state.elixirCurrency -= elixirCost;
          state.soilCurrency -= soilCost;
        }
        const nt = createAttachedTurret(activePlacementType, state.player, snapAxial.q, snapAxial.r);
        if (preservedHp !== undefined) nt.health = preservedHp;
        state.player.attachments.push(nt);
        state.totalTurretsAcquired++;
        state.turretLastUsed[activePlacementType] = state.frames;
      }
    }
  }
  if (state.draggedTurretInstance) {
    const canAffordMerge = state.mergeTargetPreview && state.sunCurrency >= state.mergeTargetPreview.cost;
    if (state.mergeTargetPreview && canAffordMerge) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        state.sunCurrency -= state.mergeTargetPreview.cost;
        const indexToReplace = state.player.attachments.indexOf(target);
        const indexToDelete = state.player.attachments.indexOf(state.draggedTurretInstance);
        
        // If it was a world turret, remove it from world
        if (state.draggedTurretInstance instanceof WorldTurret) {
          state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
        } else {
          state.player.attachments.splice(indexToDelete, 1);
        }

        const newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
        newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
        state.player.attachments[indexToReplace] = newTurret;
        state.totalTurretsAcquired++;
        state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y, [255, 255, 255]));
      }
    } else if (!state.mergeTargetPreview && state.previewSnapPos) {
      // Only move if NOT attempting a merge (or if merge was impossible/unaffordable, we don't snap to the target)
      if (state.draggedTurretInstance instanceof WorldTurret) {
         const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
         const doesCount = state.draggedTurretInstance.config?.countTowardAttachedCapacity !== false && state.draggedTurretInstance.config?.CountTowardAttachedCapacity !== false;
         if (!doesCount || state.player.getAttachedCount() < maxCapacity) {
           const startPos = state.draggedTurretInstance.getWorldPos().copy();
           const preservedHp = state.draggedTurretInstance.health;
           state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
           const nt = createAttachedTurret(state.draggedTurretInstance.type, state.player, snapAxial.q, snapAxial.r);
           nt.pos = startPos;
           if (preservedHp !== undefined) nt.health = preservedHp;
           nt.maxHealth = state.draggedTurretInstance.maxHealth;
           nt.baseIngredients = state.draggedTurretInstance.baseIngredients;
           nt.stats = state.draggedTurretInstance.stats;
           nt.angle = state.draggedTurretInstance.angle;
           nt.conditions = state.draggedTurretInstance.conditions;
           state.player.attachments.push(nt);
           // Transfer all active VFX targeting the old world turret to the new attached turret
           for (let v of state.vfx) {
             if (v && v.target === state.draggedTurretInstance) {
               v.target = nt;
             }
           }
           state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
         }
      } else {
         state.draggedTurretInstance.hq = snapAxial.q;
         state.draggedTurretInstance.hr = snapAxial.r;
         state.draggedTurretInstance.offset = axialToWorld(snapAxial.q, snapAxial.r);
         state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
      }
    }
  }
  state.draggedTurretInstance = null; state.draggedTurretType = null; state.selectedTurretType = null; state.isCurrentlyDragging = false; state.mergeTargetPreview = null; state.previewSnapPos = null;
}

export function autoPlaceTurret(type: string) {
  const tr = turretTypes[type];
  if (!tr) return;

  const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity');
  const doesCount = tr.countTowardAttachedCapacity !== false && tr.CountTowardAttachedCapacity !== false;
  if (doesCount && state.player.getAttachedCount() >= maxCapacity) return;

  const isOwned = (state.inventory.items[type] || 0) > 0;
  const sunCost = tr.costs?.sun || tr.cost || 0;
  const elixirCost = tr.costs?.elixir || 0;
  const soilCost = tr.costs?.soil || 0;

  const canAfford = isOwned || (
    state.sunCurrency >= sunCost &&
    state.elixirCurrency >= elixirCost &&
    state.soilCurrency >= soilCost
  );

  if (!canAfford) return;

  let bestQ = 0;
  let bestR = 0;
  let found = false;

    if (type === 't_lilypad') {
      // Find closest turret without a lilypad
      let minDist = Infinity;
      for (const att of state.player.attachments) {
        if (att.config.turretLayer === 'ground') continue;
        // Check if there's already a lilypad at this spot
        const hasLily = state.player.attachments.some((a: any) => a.hq === att.hq && a.hr === att.hr && a.config.turretLayer === 'ground');
        if (!hasLily) {
          const wPos = att.getWorldPos();
          const d = dist(state.player.pos.x, state.player.pos.y, wPos.x, wPos.y);
          if (d < minDist) {
            minDist = d;
            bestQ = att.hq;
            bestR = att.hr;
            found = true;
          }
        }
      }
    } else if (type === 't0_puffshroom') {
      const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
      if (state.player.attachments.length < maxCapacity) {
        // Find nearest available spot
        let minDist = Infinity;
        const rangeLimit = 5;
        for (let q = -rangeLimit; q <= rangeLimit; q++) {
          for (let r = -rangeLimit; r <= rangeLimit; r++) {
            if (abs(q) + abs(r) + abs(-q-r) <= rangeLimit * 2) {
              if (q === 0 && r === 0) continue;
              const wPos = axialToWorld(q, r).add(state.player.pos);
              const d = dist(state.player.pos.x, state.player.pos.y, wPos.x, wPos.y);
              
              const occupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && (a.config.turretLayer || 'normal') === 'normal');
              if (!occupant && isAdjacent(q, r)) {
                const isClear = !state.world.checkCollision(wPos.x, wPos.y, tr.size * 0.55);
                if (isClear && d < minDist) {
                  minDist = d;
                  bestQ = q;
                  bestR = r;
                  found = true;
                }
              }
            }
          }
        }
      }
    }

  if (found) {
    // Deduct cost
    let preservedHp = undefined;
    if (isOwned) {
      state.inventory.items[type]--;
      const specIdx = state.inventory.specList.findIndex((item: any) => item.key === type);
      if (specIdx !== -1) {
        preservedHp = state.inventory.specList[specIdx].hp;
        state.inventory.specList.splice(specIdx, 1);
      }
    } else {
      state.sunCurrency -= sunCost;
      state.elixirCurrency -= elixirCost;
      state.soilCurrency -= soilCost;
    }

    const nt = createAttachedTurret(type, state.player, bestQ, bestR);
    if (preservedHp !== undefined) nt.health = preservedHp;
    state.player.attachments.push(nt);
    state.totalTurretsAcquired++;
    state.turretLastUsed[type] = state.frames;

    // VFX
    const wPos = nt.getWorldPos();
    const startX = 60; // Approximate sidebar X
    const startY = height / 2;
    const assetKey = `img_${TYPE_MAP[type]}_front`;
    state.uiVfx.push(new ShopFlyVFX(startX, startY, wPos.x, wPos.y, assetKey));
  }
}

(window as any).autoPlaceTurret = autoPlaceTurret;

(window as any).preload = () => {
  state.assets = {};
  for (const [key, url] of Object.entries(ASSETS)) {
    try {
      state.assets[key] = loadImage(
        url,
        () => {},
        (err: any) => {
          console.warn(`Failed to load asset [${key}] from ${url}:`, err);
          state.assets[key] = (window as any).createImage ? (window as any).createImage(32, 32) : null;
        }
      );
    } catch (e) {
      console.warn(`Error initializing asset [${key}]:`, e);
      state.assets[key] = null;
    }
  }
};

(window as any).setup = () => {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.elt.oncontextmenu = () => false; // Prevent right-click menu
  textFont('Viga');
  state.world = new WorldManager(); 
  const spawnX = 8 * GRID_SIZE + GRID_SIZE / 2;
  const spawnY = 8 * GRID_SIZE + GRID_SIZE / 2;
  state.player = new Player(spawnX, spawnY); 
  state.cameraPos = createVector(spawnX, spawnY);
};

function uiTick() {
  // Update UI VFX even when paused
  for (let i = state.uiVfx.length - 1; i >= 0; i--) { 
    state.uiVfx[i].update(); 
    if (state.uiVfx[i].isDone()) state.uiVfx.splice(i, 1); 
  }
  updateUnlockPopup();
}

import { recalculateAllStats } from './src/upgrades';

function tick() {
  if (state.isPaused) return;
  recalculateAllStats();
  state.frames++;

  if (state.isGameOver) {
    state.gameOverProgress = lerp(state.gameOverProgress, state.showGameOverPopup ? 1 : 0, 0.05);
  }

  updateGameSystems();
  rebuildSpatialHash();
  state.cameraPos.x = lerp(state.cameraPos.x, state.player.pos.x, 0.08); 
  state.cameraPos.y = lerp(state.cameraPos.y, state.player.pos.y, 0.08);
  
  if (isNaN(state.cameraPos.x) || isNaN(state.cameraPos.y)) {
    console.error("Camera position is NaN! Resetting to player position.", state.player.pos);
    state.cameraPos = createVector(state.player.pos.x, state.player.pos.y);
  }
  
  state.cameraShake = (state.cameraShake || 0) * (state.cameraShakeFalloff || 0.95);
  if (state.cameraShake < 0.1) state.cameraShake = 0;

  state.world.update(state.player.pos); 
  for (let i = state.trails.length - 1; i >= 0; i--) { state.trails[i].update(); if (state.trails[i].isDone()) state.trails.splice(i, 1); }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { state.groundFeatures[i].update(); if (state.groundFeatures[i].life <= 0) state.groundFeatures.splice(i, 1); }
  for (let npc of state.npcs) npc.update(state.player.pos);
  
  if (state.player) {
    flowField.update(state.player.pos);
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) { 
    state.enemies[i].update(state.player.pos); 
    if (state.enemies[i].health <= 0 || state.enemies[i].markedForDespawn) state.enemies.splice(i, 1); 
  }

  // WinCondition check & Level Won Sequence
  if (!state.isGameOver && state.currentScreen === 'game') {
    // If win sequence is currently running
    if (state.levelWonSequence && state.levelWonSequence.active) {
      if (state.levelWonSequence.pendingDestructions.length > 0) {
        state.levelWonSequence.destructionTimer++;
        if (state.levelWonSequence.destructionTimer >= 6) {
          state.levelWonSequence.destructionTimer = 0;
          const next = state.levelWonSequence.pendingDestructions.shift();
          if (next) {
            if (next.type === 'enemy' && next.target && next.target.health > 0) {
              state.vfx.push(new Explosion(next.target.pos.x, next.target.pos.y, 40));
              next.target.takeDamage(999999);
            } else if (next.type === 'block' && next.target && !next.target.isMined) {
              const bx = next.target.pos.x + GRID_SIZE / 2;
              const by = next.target.pos.y + GRID_SIZE / 2;
              state.vfx.push(new Explosion(bx, by, 40));
              next.target.takeDamage(999999);
            }
          }
        }
      } else {
        // All enemy entities and enemy obstacles self-destructed; wait 15 frames
        state.levelWonSequence.postSequenceTimer--;
        if (state.levelWonSequence.postSequenceTimer <= 0) {
          state.levelWonSequence.active = false;
          state.isGameOver = true;
          state.showGameOverPopup = true;
          state.isLevelCompleted = true;
          if (state.currentLevelId) {
            state.clearedLevels.add(state.currentLevelId);
            try {
              localStorage.setItem('grapeshooter_cleared_levels', JSON.stringify([...state.clearedLevels]));
            } catch (e) {}

            // Star Rating Calculation based on elapsed seconds
            const isSandboxOrEmpty = state.currentLevelId === 'sandbox' || state.currentLevelId === 'empty' || state.currentLevelLayoutData?.tag === 'sandbox' || state.currentLevelLayoutData?.tag === 'empty';
            if (isSandboxOrEmpty) {
              state.lastLevelStarsEarned = 0;
            } else {
              const elapsedSec = floor(state.frames / 60);
              const starTargets = state.currentLevelLayoutData?.starRatingTargets || {};
              const star1Target = starTargets.star1 !== undefined ? starTargets.star1 : 600;
              const star2Target = starTargets.star2 !== undefined ? starTargets.star2 : 300;
              const star3Target = starTargets.star3 !== undefined ? starTargets.star3 : 180;
              let earnedStars = 0;
              if (elapsedSec <= star3Target) {
                earnedStars = 3;
              } else if (elapsedSec <= star2Target) {
                earnedStars = 2;
              } else if (elapsedSec <= star1Target) {
                earnedStars = 1;
              }
              state.lastLevelStarsEarned = earnedStars;
              const previousBestStars = state.levelStars[state.currentLevelId] || 0;
              if (earnedStars > previousBestStars) {
                state.levelStars[state.currentLevelId] = earnedStars;
                try {
                  localStorage.setItem('grapeshooter_level_stars', JSON.stringify(state.levelStars));
                } catch (e) {}
              }
            }
          }
        }
      }
    } else {
      const winEnemies = (state.enemies || []).filter((e: any) => e.isWinCondition);
      let winBlocksCount = 0;
      if (state.world && state.world.chunks) {
        state.world.chunks.forEach((chunk: any) => {
          for (const b of chunk.blocks) {
            if (b.isWinCondition && !b.isMined) {
              winBlocksCount++;
            }
          }
        });
      }
      const hasAnyWinCondition = winEnemies.length > 0 || winBlocksCount > 0 || state.winConditionActive;
      if (hasAnyWinCondition) {
        state.winConditionActive = true;
        const aliveWinEnemies = winEnemies.filter((e: any) => e.health > 0 && !e.isDying).length;
        if (aliveWinEnemies === 0 && winBlocksCount === 0 && state.player && state.player.health > 0) {
          // Initialize level-won destruction sequence
          const pending: Array<{ type: 'enemy' | 'block'; target: any }> = [];
          
          // Gather all remaining active enemies
          for (const e of state.enemies) {
            if (e.health > 0 && !e.isDying) {
              pending.push({ type: 'enemy', target: e });
            }
          }

          // Gather all remaining obstacles/overlays with isEnemy = true
          if (state.world && state.world.chunks) {
            state.world.chunks.forEach((chunk: any) => {
              for (const b of chunk.blocks) {
                if (!b.isMined) {
                  const oCfg = b.overlay ? (overlayTypes as any)[b.overlay] : null;
                  const bCfg = b.config;
                  if (oCfg?.isEnemy || bCfg?.isEnemy) {
                    pending.push({ type: 'block', target: b });
                  }
                }
              }
            });
          }

          state.levelWonSequence = {
            active: true,
            pendingDestructions: pending,
            destructionTimer: 0,
            postSequenceTimer: 15,
          };
          state.isLevelCompleted = true;
        }
      }
    }
  }

  state.player.update();
  for (let i = state.bullets.length - 1; i >= 0; i--) { state.bullets[i].update(); if (state.bullets[i].life <= 0) state.bullets.splice(i, 1); }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) { state.enemyBullets[i].update(); if (state.enemyBullets[i].life <= 0) state.enemyBullets.splice(i, 1); }
  for (let i = state.vfx.length - 1; i >= 0; i--) { state.vfx[i].update(); if (state.vfx[i].isDone()) state.vfx.splice(i, 1); }
  
  // Update UI VFX in tick to be based on game tick rate
  // Moved to uiTick
  
  // updateUnlockPopup(); // Moved to uiTick
}

export function getDynamicPlacementZoom(): number {
  if (!state.player) return 1.0;
  let maxExtentX = (state.player.size || 36) * 0.5;
  let maxExtentY = (state.player.size || 36) * 0.5;

  for (const att of state.player.attachments) {
    const attRadius = (att.size || 22) * 0.5;
    const offX = Math.abs(att.offset.x) + attRadius;
    const offY = Math.abs(att.offset.y) + attRadius;
    if (offX > maxExtentX) maxExtentX = offX;
    if (offY > maxExtentY) maxExtentY = offY;
  }

  const rangeLimit = 8;
  for (let q = -rangeLimit; q <= rangeLimit; q++) {
    for (let r = -rangeLimit; r <= rangeLimit; r++) {
      if (Math.abs(q) + Math.abs(r) + Math.abs(-q - r) <= rangeLimit * 2) {
        if (q === 0 && r === 0) continue;
        if (isAdjacent(q, r, state.draggedTurretInstance)) {
          const off = axialToWorld(q, r);
          const spotRadius = 22;
          const offX = Math.abs(off.x) + spotRadius;
          const offY = Math.abs(off.y) + spotRadius;
          if (offX > maxExtentX) maxExtentX = offX;
          if (offY > maxExtentY) maxExtentY = offY;
        }
      }
    }
  }

  const availHalfW = Math.max(100, (width / 2 - (state.uiWidth || 0)) - 40);
  const availHalfH = Math.max(100, (height / 2) - 70);
  const zoomX = availHalfW / (maxExtentX + 24);
  const zoomY = availHalfH / (maxExtentY + 24);
  return constrain(Math.min(zoomX, zoomY), 1.0, 2.0);
}

(window as any).draw = () => {
  beginUIFrame();

  if (state.currentScreen === 'main_menu') {
    drawMainMenu();
    return;
  }
  if (state.currentScreen === 'level_editor') {
    drawLevelEditor();
    return;
  }

  const now = (window as any).performance.now();
  if (state.lastFrameTime === 0) state.lastFrameTime = now;
  const deltaTime = now - state.lastFrameTime;
  state.lastFrameTime = now;
  
  state.accumulator += deltaTime;
  const fixedStep = 1000 / 60;
  
  // Determine current game speed, adjusting for player movement if in speedup mode
  if (state.requestedGameSpeed === 2 && state.player.isMovingIntent) {
    state.gameSpeed = 1; // Temporarily slow down if player is moving
  } else {
    state.gameSpeed = state.isPaused ? 0 : state.requestedGameSpeed;
  }

  const currentFixedStep = fixedStep / state.gameSpeed; // Adjust fixed step based on game speed

  if (state.accumulator > 200) state.accumulator = 200; 

  while (state.accumulator >= currentFixedStep) {
    tick();
    state.accumulator -= currentFixedStep;
  }
  
  // Always run UI tick
  uiTick();

  background(10, 10, 25); 

  const shakeFreq = 0.1;
  const shakeX = (noise(state.frames * shakeFreq, 0) * 2 - 1) * state.cameraShake;
  const shakeY = (noise(state.frames * shakeFreq, 1000) * 2 - 1) * state.cameraShake;

  const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
  const isScaling = !!(activePlacementType || state.draggedTurretInstance);
  
  // Dynamic target zoom: fits all available attached spots when placing/selecting turrets (restricted to zoom-in only)
  const baseZoom = state.targetCameraZoom || 1.0;
  const dynamicZoom = isScaling ? getDynamicPlacementZoom() : baseZoom;
  const effectiveTargetZoom = isScaling ? Math.max(baseZoom, dynamicZoom) : baseZoom;

  // Steep easeOut zoom interpolation
  const zoomDiff = effectiveTargetZoom - (state.cameraZoom || 1.0);
  if (Math.abs(zoomDiff) > 0.0005) {
    state.cameraZoom = (state.cameraZoom || 1.0) + zoomDiff * 0.28;
  } else {
    state.cameraZoom = effectiveTargetZoom;
  }

  let currentZoom = state.cameraZoom;

  // Calculate dynamic rendering viewport bounds (with a safety margin of 200px)
  const halfViewW = (width / (2 * currentZoom)) + 200;
  const halfViewH = (height / (2 * currentZoom)) + 200;
  state.viewportBounds = {
    minX: state.cameraPos.x - halfViewW,
    maxX: state.cameraPos.x + halfViewW,
    minY: state.cameraPos.y - halfViewH,
    maxY: state.cameraPos.y + halfViewH
  };

  push(); 
  translate(width/2 + shakeX, height/2 + shakeY);
  scale(currentZoom);
  translate(-state.cameraPos.x, -state.cameraPos.y);
  
  let bgCol = [20, 20, 40]; if (state.currentChunkLevel >= 3) bgCol = [40, 20, 60]; if (state.currentChunkLevel >= 6) bgCol = [60, 10, 30];
  push(); noStroke(); fill(bgCol[0], bgCol[1], bgCol[2], 50); rect(state.cameraPos.x - halfViewW * 2, state.cameraPos.y - halfViewH * 2, halfViewW * 4, halfViewH * 4); pop();
  state.world.display(state.player.pos);

  if (state.showChunkBorders) {
    push();
    const cw = CHUNK_SIZE * GRID_SIZE;
    const xMin = floor((state.cameraPos.x - width / 2) / cw) * cw;
    const xMax = floor((state.cameraPos.x + width / 2) / cw) * cw + cw;
    const yMin = floor((state.cameraPos.y - height / 2) / cw) * cw;
    const yMax = floor((state.cameraPos.y + height / 2) / cw) * cw + cw;
    for (let lx = xMin; lx < xMax; lx += cw) {
      for (let ly = yMin; ly < yMax; ly += cw) {
        const cx = floor(lx / cw);
        const cy = floor(ly / cw);
        const explored = state.exploredChunks.has(`${cx},${cy}`);
        const chunk = state.world.getChunk(cx, cy);
        noFill(); strokeWeight(2); stroke(explored ? [0, 255, 100, 150] : [255, 0, 0, 100]); rect(lx, ly, cw, cw);
        fill(255); noStroke(); textAlign(LEFT, TOP); textSize(12);
        const prefabInfo = chunk.prefabId ? `Prefab: ${chunk.prefabId}` : "No Prefab";
        text(`Chunk Lvl: ${chunk.localChunkLevel}\n${prefabInfo}`, lx + 5, ly + 5);
      }
    }
    pop();
  }
  
  for (let tex of state.tickingExplosives) drawTickingExplosive(tex);
  for (let s of state.pendingSpawns) drawPendingSpawn(s);
  for (let i = state.trails.length - 1; i >= 0; i--) { state.trails[i].display(); }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { state.groundFeatures[i].display(); }

  const mWorld = createVector(
    (mouseX - width/2) / currentZoom + state.cameraPos.x,
    (mouseY - height/2) / currentZoom + state.cameraPos.y
  );

  // 0. Highlight effects behind hovered turrets
  state.hoveredTurretInstance = null;
  if (mouseX > state.uiWidth || !state.isStationary) {
    const worldTurrets = state.world.getAllTurrets();
    const accessibleWorldTurrets = worldTurrets.filter((wt: any) => !wt.isRelocating && wt.jumpPhase === null && flowField.isTileAccessible(wt.getWorldPos().x, wt.getWorldPos().y));
    const sortedForSelection = [...state.player.attachments, ...accessibleWorldTurrets].sort((a, b) => {
        const la = a.config.turretLayer || 'normal'; const lb = b.config.turretLayer || 'normal';
        if (la !== lb) return la === 'normal' ? -1 : 1;
        const posA = a.getWorldPos(); const posB = b.getWorldPos();
        if (posA.y !== posB.y) return posA.y - posB.y; return posB.x - posA.x;
    });
    for (let t of sortedForSelection) { if (dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) { state.hoveredTurretInstance = t; break; } }
  }

  const showConnections = state.hoveredTurretInstance || state.isCurrentlyDragging || state.selectedTurretType;
  if (showConnections) {
    drawAllTurretConnections();
  }

  if (state.hoveredTurretInstance && !state.isCurrentlyDragging) {
    const t = state.hoveredTurretInstance; const wPos = t.getWorldPos();
    drawSelectionHighlight(wPos.x, wPos.y, t.size, 200 + sin(state.frames * 0.15) * 50);
    // drawTurretConnections(t); // Replaced by drawAllTurretConnections above
    const range = t.config.actionConfig?.shootRange || t.config.actionConfig?.beamMaxLength || t.config.actionConfig?.pulseTriggerRadius || 0;
    if (range > 0) { push(); noFill(); stroke(255, 200, 50, 120); strokeWeight(isScaling ? 2 / currentZoom : 2); ellipse(wPos.x, wPos.y, range * 2); pop(); }
  }
  
  // 1. Ground layer turrets (Lilypads etc)
  state.player.displayAttachments(true);
  const worldTurrets = state.world.getAllTurrets();
  for (const wt of worldTurrets) {
    if (wt.config.turretLayer === 'ground') wt.display();
  }
  
  // 2. Y-sorted entities pass (Turrets, Player, Enemies, NPCs)
  const ySorted: any[] = [
    ...state.player.attachments.filter((a: any) => a.config.turretLayer !== 'ground'),
    ...worldTurrets.filter((wt: any) => wt.config.turretLayer !== 'ground'),
    state.player,
    ...state.enemies,
    ...state.npcs
  ];
  
  ySorted.sort((a, b) => {
    const ay = a.pos ? a.pos.y : a.getWorldPos().y;
    const by = b.pos ? b.pos.y : b.getWorldPos().y;
    return ay - by;
  });

  const vp = state.viewportBounds;

  for (let e of ySorted) {
    if (e === state.player) {
      state.player.display();
    } else {
      const ePos = e.pos || (e.getWorldPos ? e.getWorldPos() : null);
      if (ePos && vp && vp.maxX !== undefined) {
        const rad = (e.size || 32) + 16;
        if (ePos.x + rad < vp.minX || ePos.x - rad > vp.maxX || ePos.y + rad < vp.minY || ePos.y - rad > vp.maxY) {
          continue;
        }
      }
      e.display();
    }
  }

  if (state.showPlayerGizmos && state.player) {
    push();
    const magRadius = getPlayerUpgradeStat('magnetRadius') || 50;
    noFill();
    stroke(100, 200, 255, 180);
    strokeWeight(1.5);
    ellipse(state.player.pos.x, state.player.pos.y, magRadius * 2, magRadius * 2);
    fill(100, 200, 255, 30);
    ellipse(state.player.pos.x, state.player.pos.y, magRadius * 2, magRadius * 2);
    pop();
  }

  for (let i = state.bullets.length - 1; i >= 0; i--) { 
    const b = state.bullets[i];
    if (vp && vp.maxX !== undefined && (b.pos.x < vp.minX - 30 || b.pos.x > vp.maxX + 30 || b.pos.y < vp.minY - 30 || b.pos.y > vp.maxY + 30)) continue;
    b.display(); 
  }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) { 
    const eb = state.enemyBullets[i];
    if (vp && vp.maxX !== undefined && (eb.pos.x < vp.minX - 30 || eb.pos.x > vp.maxX + 30 || eb.pos.y < vp.minY - 30 || eb.pos.y > vp.maxY + 30)) continue;
    eb.display(); 
  }
  for (let i = state.vfx.length - 1; i >= 0; i--) { 
    const v = state.vfx[i];
    if (v.pos && vp && vp.maxX !== undefined && (v.pos.x < vp.minX - 100 || v.pos.x > vp.maxX + 100 || v.pos.y < vp.minY - 100 || v.pos.y > vp.maxY + 100)) continue;
    v.display(); 
  }
  
  // 3. Top UI pass (Farm requirements, etc)
  for (let t of state.player.attachments) {
    if (t.displayUI) t.displayUI();
  }
  for (let wt of worldTurrets) {
    if (wt.displayUI) wt.displayUI();
  }

  if ((state.draggedTurretType || state.draggedTurretInstance) && !state.isCurrentlyDragging) { if (dist(mouseX, mouseY, state.dragOrigin.x, state.dragOrigin.y) > 8) { state.isCurrentlyDragging = true; } }
  state.mergeTargetPreview = null; state.previewSnapPos = null;

  if ((activePlacementType || state.draggedTurretInstance) && !state.isGameOver) {
    const ghostType = state.draggedTurretInstance ? state.draggedTurretInstance.type : activePlacementType;
    const ghostConfig = turretTypes[ghostType!]; const ghostLayer = ghostConfig.turretLayer || 'normal';
    const draggingIngredients = state.draggedTurretInstance ? (state.draggedTurretInstance.baseIngredients || []) : (activePlacementType ? [activePlacementType] : []);
    
    // Purchase cost only applies if we are placing a NEW turret (not repositioning an instance)
    const isNewPlacement = !!activePlacementType;
    const isOwned = activePlacementType ? (state.inventory.items[activePlacementType] || 0) > 0 : false;
    const purchaseCost = (isNewPlacement && !isOwned) ? (ghostConfig?.costs?.sun || ghostConfig?.cost || 0) : 0;

    let closestDist = Infinity; let bestSnap = null; let bestMergeTarget = null; let bestMergeInfo = null;
    const rangeLimit = 8;

    const rawCap = getPlayerUpgradeStat('turretAttachCapacity');
    const maxCapacity = (rawCap !== undefined && rawCap !== null) ? rawCap : 6;
    const currentAttachedCount = state.player.getAttachedCount ? state.player.getAttachedCount() : state.player.attachments.length;
    const doesCount = ghostConfig ? (ghostConfig.countTowardAttachedCapacity !== false && ghostConfig.CountTowardAttachedCapacity !== false) : true;
    const canAttachNew = (!doesCount || currentAttachedCount < maxCapacity) && maxCapacity > 0;
    const isRepositioningAttached = state.draggedTurretInstance instanceof AttachedTurret;
    const allowAttachedSlots = isRepositioningAttached || canAttachNew;

    // 1. Draw all available empty spots and find bestSnap (if capacity allows or repositioning)
    state.previewWorldSnap = null;
    if (allowAttachedSlots) {
      for (let q = -rangeLimit; q <= rangeLimit; q++) {
        for (let r = -rangeLimit; r <= rangeLimit; r++) {
          if (abs(q) + abs(r) + abs(-q-r) <= rangeLimit * 2) {
            const wPos = axialToWorld(q, r).add(state.player.pos);
            const d = dist(mWorld.x, mWorld.y, wPos.x, wPos.y);
            let coreOccupant = (q === 0 && r === 0);
            if (coreOccupant) continue;
            
            let normalOccupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && (a.config.turretLayer || 'normal') === 'normal');
            let groundOccupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && a.config.turretLayer === 'ground');
            let occupantOnSameLayer = ghostLayer === 'ground' ? groundOccupant : normalOccupant;

            if (!occupantOnSameLayer || occupantOnSameLayer === state.draggedTurretInstance) {
              if (isAdjacent(q, r, state.draggedTurretInstance)) {
                const isClear = !state.world.checkCollision(wPos.x, wPos.y, ghostConfig.size * 0.55);
                if (isClear) {
                  const canAfford = state.sunCurrency >= purchaseCost;
                  push(); translate(wPos.x, wPos.y);
                  noStroke();
                  fill(canAfford ? [100, 255, 150, 80] : [255, 100, 100, 80]);
                  ellipse(0, 0, 15, 15);
                  stroke(canAfford ? [100, 255, 150, 150] : [255, 100, 100, 150]);
                  strokeWeight(2);
                  noFill();
                  ellipse(0, 0, 20, 20);
                  pop();

                  if (d < closestDist && d < GRID_SIZE * 3) {
                    closestDist = d; bestSnap = wPos; bestMergeTarget = null; bestMergeInfo = null;
                  }
                } else if (d < 30) {
                  push(); translate(wPos.x, wPos.y); stroke(255, 50, 50, 180); strokeWeight(2); line(-5, -5, 5, 5); line(5, -5, -5, 5); pop();
                }
              }
            }
          }
        }
      }
    }

    // 1.1 WorldGrid available spots
    const viewDist = 8;
    const gxMin = floor((mWorld.x - viewDist * GRID_SIZE) / GRID_SIZE);
    const gxMax = floor((mWorld.x + viewDist * GRID_SIZE) / GRID_SIZE);
    const gyMin = floor((mWorld.y - viewDist * GRID_SIZE) / GRID_SIZE);
    const gyMax = floor((mWorld.y + viewDist * GRID_SIZE) / GRID_SIZE);

    for (let gx = gxMin; gx <= gxMax; gx++) {
      for (let gy = gyMin; gy <= gyMax; gy++) {
        const wx = gx * GRID_SIZE + GRID_SIZE / 2;
        const wy = gy * GRID_SIZE + GRID_SIZE / 2;
        const d = dist(mWorld.x, mWorld.y, wx, wy);
        if (d < GRID_SIZE * 5) {
          // Check if spot is too close to any attached turret or the player core
          const safeDist = allowAttachedSlots ? GRID_SIZE * 2 : 0; 
          const isTooClose = state.player.attachments.some((att: any) => {
            const attPos = att.getWorldPos();
            return dist(wx, wy, attPos.x, attPos.y) < (allowAttachedSlots ? safeDist : GRID_SIZE * 0.8);
          }) || (allowAttachedSlots && dist(wx, wy, state.player.pos.x, state.player.pos.y) < safeDist) || dist(wx, wy, state.player.pos.x, state.player.pos.y) < (state.player.size * 0.35);
          
          if (!isTooClose && !state.world.isBlockAt(wx, wy) && !state.world.getTurretAt(gx, gy) && flowField.isTileAccessible(wx, wy)) {
            const canAfford = state.sunCurrency >= purchaseCost;
            push(); translate(wx, wy);
            if (canAfford) {
              fill(100, 200, 255, 40);
              stroke(100, 200, 255, 120);
            } else {
              fill(255, 100, 100, 40);
              stroke(255, 100, 100, 120);
            }
            strokeWeight(1.5);
            rect(-GRID_SIZE/2 + 2, -GRID_SIZE/2 + 2, GRID_SIZE - 4, GRID_SIZE - 4, 6);
            
            // Draw a small plus icon in the center
            strokeWeight(2);
            line(-4, 0, 4, 0);
            line(0, -4, 0, 4);
            pop();
            
            if (d < closestDist && d < GRID_SIZE * 1.5) {
               closestDist = d; bestSnap = createVector(wx, wy); bestMergeTarget = null; bestMergeInfo = null;
               state.previewWorldSnap = { gx, gy };
            }
          }
        }
      }
    }

    // 2. Find bestMergeTarget and bestSnap
    const mergeCandidates: any[] = [];
    const accessibleWorldForMerge = state.world.getAllTurrets().filter((wt: any) => flowField.isTileAccessible(wt.getWorldPos().x, wt.getWorldPos().y));
    const allMergeableTurrets = [...state.player.attachments, ...accessibleWorldForMerge];
    for (const att of allMergeableTurrets) {
      if (att === state.draggedTurretInstance) continue;
      const wPos = att.getWorldPos();
      const d = dist(mWorld.x, mWorld.y, wPos.x, wPos.y);
      const isMergeableLayer = (att.config.turretLayer || 'normal') === 'normal' && ghostLayer === 'normal';
      let mergeInfo = null;
      if (isMergeableLayer && !att.isFrosted && (draggingIngredients?.length || 0) > 0 && (att.baseIngredients?.length || 0) > 0) {
        const combinedPool = [...draggingIngredients, ...att.baseIngredients];
        const resType = findMergeResult(combinedPool);
        const resConfig = resType ? turretTypes[resType] : null;
        const isAvailable = resType ? (state.unlockedTurrets.includes(resType) || state.makeAllTurretsAvailable) : false;
        if (resType && resConfig && isAvailable) {
          const ingredientsCostSum = combinedPool.reduce((sum, k) => sum + (turretTypes[k]?.costs?.sun || turretTypes[k]?.cost || 0), 0);
          const resSunCost = resConfig.costs?.sun || resConfig.cost || 0;
          const combinedMergeCost = Math.max(0, resSunCost - ingredientsCostSum);
          mergeInfo = { resType, resConfig, combinedMergeCost, combinedPool };
        }
      }

      const totalReq = mergeInfo ? (mergeInfo.combinedMergeCost + purchaseCost) : purchaseCost;
      const canAfford = state.sunCurrency >= totalReq;
      const isPossible = !!mergeInfo;

      if (isPossible && mergeInfo) {
        mergeCandidates.push({ att, wPos, d, mergeInfo, totalReq, canAfford });
        const isBestSnap = (d < closestDist && d < GRID_SIZE * 3);
        if (isBestSnap) {
          closestDist = d; bestSnap = wPos; bestMergeTarget = att;
          bestMergeInfo = { resType: mergeInfo.resType, resConfig: mergeInfo.resConfig, combinedPool: mergeInfo.combinedPool, dynamicMergeCost: mergeInfo.combinedMergeCost };
          state.previewWorldSnap = null; // Clear world snap if we are merging
        }
      }
    }

    // 3. Draw all merge bubbles
    for (const cand of mergeCandidates) {
      const { att, wPos, d, mergeInfo, totalReq, canAfford } = cand;
      const isBest = att === bestMergeTarget;
      const isHovered = isBest && dist(mWorld.x, mWorld.y, wPos.x, wPos.y) < 25;
      
      push(); translate(wPos.x, wPos.y);
      //noFill();
      //stroke(canAfford ? [100, 255, 150] : [255, 100, 100]);
      //strokeWeight(2);
      //ellipse(0, 0, att.size + 10);
      pop();

      if (isBest) {
        // Draw selection highlight behind the merge target
        drawSelectionHighlight(wPos.x, wPos.y, att.size, isHovered ? 255 : 150);
        
        if (isHovered) { 
          const resRange = mergeInfo.resConfig.actionConfig?.shootRange || mergeInfo.resConfig.actionConfig?.beamMaxLength || mergeInfo.resConfig.actionConfig?.pulseTriggerRadius || 0; 
          if (resRange > 0) { push(); noFill(); stroke(255, 255, 0, 180); strokeWeight(3); ellipse(wPos.x, wPos.y, resRange * 2); pop(); } 
        }
        state.mergeTargetPreview = { uid: att.uid, type: mergeInfo.resType, pos: wPos, cost: mergeInfo.combinedMergeCost, ingredients: mergeInfo.combinedPool };
      }
      // Draw bubble for all candidates
      // If it's the best snap, it shows as confirming (yellow) when hovered
      drawMergeBubble(wPos.x, wPos.y, mergeInfo.resType, totalReq, canAfford, isHovered, 255);
    }

    if (bestSnap) {
      state.previewSnapPos = bestSnap;
      if (ghostType) {
        const ghostAngle = state.draggedTurretInstance ? state.draggedTurretInstance.angle : 0;
        const ghost = { 
          uid: 'ghost', type: ghostType, config: ghostConfig, alpha: 127, angle: ghostAngle, 
          recoil: 0, fireRateMultiplier: 1.0, actionTimers: new Map(), 
          getWorldPos: () => state.previewSnapPos, jumpOffset: null,
          framesAlive: 0, flashTimer: 0 
        };
        // Wraith call in authoritative translation block
        push();
        translate(state.previewSnapPos.x, state.previewSnapPos.y);
        drawTurretSprite(ghost);
        pop();
        
        const actionConfig = ghostConfig.actionConfig;
        let range = actionConfig?.shootRange || actionConfig?.beamMaxLength || actionConfig?.pulseTriggerRadius || 0;
        if (range === 0 && actionConfig?.pulseBulletTypeKey) {
            const bCfg = bulletTypes[actionConfig.pulseBulletTypeKey];
            if (bCfg?.aoeConfig?.isAoe) range = bCfg.aoeConfig.aoeRadiusGradient[bCfg.aoeConfig.aoeRadiusGradient.length - 1];
        }
        if (range > 0) {
            push(); noFill(); stroke(255, 255, 255, 100); strokeWeight(2); ellipse(state.previewSnapPos.x, state.previewSnapPos.y, range * 2); pop();
        }
      }
    }
  }
  if (state.draggedTurretInstance) {
    const dragging = state.draggedTurretInstance; const wPos = dragging.getWorldPos();
    stroke(255, 127); strokeWeight(2); line(wPos.x, wPos.y, mWorld.x, mWorld.y);
  }

  if (state.debugDrawTurretPath) {
    drawTurretPathDebug();
  }

  if (state.debugGizmosEnemies) {
    flowField.drawDebug();
    if (state.world) {
      state.world.drawSpawnerEnemyGizmos(mWorld.x, mWorld.y);
    }
  }

  if (state.world) {
    state.world.drawPayGateCostBubbles();
    state.world.drawSunGeneratorHoverBubbles(mWorld.x, mWorld.y);
  }
  pop(); 

  // Apply speedup flash effect to global lighting
  if (state.speedupFlashTimer > 0) {
    const flashAlpha = map(state.speedupFlashTimer, 0, 30, 0, 100);
    push(); noStroke(); fill(100, 100, 225, flashAlpha*0.2); rect(0, 0, width, height); pop();
    state.speedupFlashTimer--;
  }

  drawGlobalLighting();
  drawVisibilityOverlay();
  drawTouchVisuals();
  drawGameSpeedButtons();
  drawUI(spawnFromBudget);
  drawWorldGenPreview();

  if (state.isGameOver) {
    drawGameOver();
  }

  drawAlmanac();
  drawUnlockPopup();
  uiComponentsShowcase.draw();

  if (state.hoveredTurretInstance && !state.draggedTurretInstance && !activePlacementType) { 
    drawTurretTooltip(state.hoveredTurretInstance, mouseX, mouseY); 
  } else if (state.mergeTargetPreview) { 
    drawTurretTooltip(state.mergeTargetPreview, mouseX, mouseY, true); 
  }

  // Draw UI VFX at the very end to ensure they are on top of everything (including Almanac)
  for (let i = state.uiVfx.length - 1; i >= 0; i--) { 
    state.uiVfx[i].display(); 
  }
};

(window as any).mousePressed = () => {
  state.isMouseDown = true;
  if (state.suppressGameplayMouseUntilRelease) {
    return;
  }

  // Register mouse down on modular UI hitboxes
  handleUIMousePress(mouseX, mouseY);

  if (state.currentScreen === 'level_editor') {
    handleLevelEditorPress(mouseX, mouseY);
    return;
  }

  const RIGHT: any = (window as any).RIGHT;
  const mouseButton: any = (window as any).mouseButton;

  if (mouseButton === RIGHT) {
    state.selectedTurretType = null;
    state.draggedTurretInstance = null;
    state.draggedTurretType = null;
    state.isCurrentlyDragging = false;
    return false; // Prevent default context menu
  }

  if (state.currentScreen === 'main_menu') {
    handleMainMenuPress(mouseX, mouseY);
    return;
  }
  if (state.isAlmanacOpen) {
    return;
  }

  state.needsTargetReScan = true;

  if (state.simulateTouchScreen) {
    handleTouchStarted([{ x: mouseX, y: mouseY }]);
  } else {
    // Store initial mouse position for drag-to-move
    state.touchStartPos = { x: mouseX, y: mouseY };
    state.playerSpeedMultiplier = 0; // Reset speed multiplier on new click
  }

  if (state.activeNPC && handleNpcUiPress()) {
    return;
  }

  if (mouseX > state.uiWidth) {
    const currentZoom = state.cameraZoom || 1.0;

    const mWorld = createVector(
      (mouseX - width / 2) / currentZoom + state.cameraPos.x,
      (mouseY - height / 2) / currentZoom + state.cameraPos.y
    );

    if (dist(mWorld.x, mWorld.y, state.player.pos.x, state.player.pos.y) < state.player.size / 2) {
      state.player.isClickHolding = true;
      return;
    }
    if (state.draggedTurretInstance || state.selectedTurretType) { if (state.previewSnapPos) { executePlacement(); return; } }
    
    const worldTurrets = state.world.getAllTurrets();
    for (let wt of worldTurrets) {
      if (wt.isRelocating || wt.jumpPhase !== null) continue;
      if (dist(mWorld.x, mWorld.y, wt.getWorldPos().x, wt.getWorldPos().y) < wt.size/2 + 5) {
        if (!flowField.isTileAccessible(wt.getWorldPos().x, wt.getWorldPos().y)) {
          continue;
        }
        state.draggedTurretInstance = wt; state.dragOrigin = { x: mouseX, y: mouseY }; state.isCurrentlyDragging = false; return;
      }
    }

    const sortedForPicking = [...state.player.attachments].sort((a, b) => {
        const la = a.config.turretLayer || 'normal'; const lb = b.config.turretLayer || 'normal';
        if (la !== lb) return la === 'normal' ? -1 : 1;
        const posA = a.getWorldPos(); const posB = b.getWorldPos();
        if (posA.y !== posB.y) return posA.y - posB.y; return posB.x - posA.x;
    });
    for (let t of sortedForPicking) {
      if (!t.isFrosted && dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) {
        if (t.config.turretLayer === 'ground') { const top = state.player.attachments.find((a: any) => a.hq === t.hq && a.hr === t.hr && (a.config.turretLayer || 'normal') === 'normal'); if (top) continue; }
        state.draggedTurretInstance = t; state.dragOrigin = { x: mouseX, y: mouseY }; state.isCurrentlyDragging = false; break;
      }
    }
  }
}

(window as any).mouseDragged = () => {
  if (state.suppressGameplayMouseUntilRelease) return;
  if (state.isAlmanacOpen) {
    if (state.isAlmanacEditorMode && state.almanacTab === 'Upgrades' && state.activePlayerUpgradeInput?.isDragging) {
      handlePlayerUpgradeMouseDrag(mouseX, mouseY);
    }
    return;
  }

  if (state.currentScreen === 'level_editor') {
    if (paygateModal.isOpen && paygateModal.amountState.isDragging) {
      handlePayGateCostModalDrag();
      return;
    }
    if (textSignEditor.isOpen && textSignEditor.textState.isDragging) {
      const zoom = state.levelEditor?.cameraZoom || 1.0;
      const mWorldX = (mouseX - width / 2) / zoom + state.cameraPos.x;
      const mWorldY = (mouseY - height / 2) / zoom + state.cameraPos.y;
      handleInlineTextSignDrag(mWorldX, mWorldY);
      return;
    }
    if (state.levelEditor?.editingPaygateModal || state.levelEditor?.editingTextSign) {
      return;
    }
  }

  if (state.currentScreen === 'main_menu') {
    handleMainMenuDrag(mouseX, mouseY);
    return;
  }

  if (state.simulateTouchScreen) {
    handleTouchMoved([{ x: mouseX, y: mouseY }]);
  } else if (state.touchStartPos) {
    // Mouse drag for player movement
    const dragDistance = dist(state.touchStartPos.x, state.touchStartPos.y, mouseX, mouseY);
    const dragDistanceTiles = dragDistance / GRID_SIZE;

    if (dragDistanceTiles < PLAYER_DRAG_MIN_DISTANCE_TILES) {
      state.touchInputVec = { x: 0, y: 0 };
      state.playerSpeedMultiplier = 0;
      return;
    }

    // Convert screen mouse position to world coordinates taking current camera zoom into account
    const zoom = state.cameraZoom || 1.0;
    const mouseWorldX = (mouseX - width / 2) / zoom + state.cameraPos.x;
    const mouseWorldY = (mouseY - height / 2) / zoom + state.cameraPos.y;

    // Calculate direction vector from player to mouse world position
    const dx = mouseWorldX - state.player.pos.x;
    const dy = mouseWorldY - state.player.pos.y;
    const currentDist = dist(0, 0, dx, dy);

    if (currentDist > 0) {
      state.touchInputVec = { x: dx / currentDist, y: dy / currentDist };
    } else {
      state.touchInputVec = { x: 0, y: 0 };
    }

    // Calculate speed multiplier based on drag distance
    state.playerSpeedMultiplier = map(
      dragDistanceTiles,
      PLAYER_DRAG_MIN_DISTANCE_TILES,
      PLAYER_DRAG_MAX_DISTANCE_TILES,
      0.0,
      1.0
    );
    state.playerSpeedMultiplier = Math.min(1.0, Math.max(0.0, state.playerSpeedMultiplier));
  }
};

(window as any).mouseReleased = () => {
  state.isMouseDown = false;
  state.suppressGameplayMouseUntilRelease = false;

  // 1. Dispatch modular UI hitboxes (triggered only if mouse down and up on the same button)
  if (handleUIMouseRelease(mouseX, mouseY)) {
    return;
  }

  // 2. Component showcase and popups
  if (uiComponentsShowcase.handleClick(mouseX, mouseY)) return;
  if (handleUnlockPopupClick()) return;

  if (state.currentScreen === 'main_menu') {
    handleMainMenuRelease(mouseX, mouseY);
    return;
  }
  if (state.currentScreen === 'level_editor') {
    handleLevelEditorClick();
    handleLevelEditorMouseRelease();
    return;
  }

  // If Almanac is open during gameplay, route input strictly to Almanac and block canvas interaction
  if (state.isAlmanacOpen) {
    handlePlayerUpgradeMouseRelease();
    handleAlmanacClick();
    return;
  }

  state.needsTargetReScan = true;
  if (state.simulateTouchScreen) {
    handleTouchEnded();
  } else {
    state.touchStartPos = null;
    state.touchInputVec = { x: 0, y: 0 };
    state.playerSpeedMultiplier = 0;
  }

  if (state.isGameOver) {
    if (handleGameOverClick()) return;
    return;
  }

  if (handleGameSpeedButtonClick()) return;

  if (state.activeNPC && handleNpcUiClick()) {
    state.pressedTradeId = null;
    state.npcShopPressPos = null;
    state.player.isClickHolding = false;
    return;
  }

  state.pressedTradeId = null;
  state.npcShopPressPos = null;
  state.player.isClickHolding = false;
  if (state.draggedTurretType) {
    if (state.isCurrentlyDragging) { 
      executePlacement(); 
    } else { 
      // It was a click
      if (state.draggedTurretType === 't0_puffshroom' || state.draggedTurretType === 't_lilypad') {
        autoPlaceTurret(state.draggedTurretType);
      } else {
        if (state.selectedTurretType === state.draggedTurretType) { 
          state.selectedTurretType = null; 
        } else { 
          state.selectedTurretType = state.draggedTurretType; 
        } 
      }
    }
    state.draggedTurretType = null; state.isCurrentlyDragging = false; return;
  }
  if (state.draggedTurretInstance) { if (state.isCurrentlyDragging) { executePlacement(); } }
};

(window as any).mouseWheel = (event: any) => {
  if (state.isGameOver) return;
  if (state.isAlmanacOpen) {
    if (state.almanacTab === 'LevelConfig') {
      if (handleLevelConfigScroll(event.delta)) return false;
    }
    if (state.almanacTab === 'Upgrades') {
      if (handlePlayerUpgradesScroll(event.delta)) return false;
    }
    const modalW = Math.min(1050, width * 0.9);
    const leftPanelW = modalW * 0.6;
    const x = (width - modalW) / 2;
    const rightX = x + leftPanelW + 60;
    
    if (mouseX > rightX) {
      state.almanacInfoScrollVelocity -= event.delta * 0.25;
    } else {
      state.almanacScrollVelocity -= event.delta * 0.25;
    }
    return false;
  }
  if (state.currentScreen === 'main_menu') {
    state.mainMenuScrollVelocity = (state.mainMenuScrollVelocity || 0) - event.delta * 0.25;
    return false;
  }
  if (state.currentScreen === 'level_editor') {
    if (handleLevelEditorScroll(event.delta)) return false;
  }
  if (state.showDebug && mouseX > width - 280) { state.debugScrollVelocity -= event.delta * 0.1; return false; }
  if (state.activeNPC && mouseX > width - 320) { state.npcShopScrollVelocity -= event.delta * 0.1; return false; }

  // In-Game Camera Zoom (no UI, pure mouse-wheel control clamped between 0.65x and 1.5x)
  if (state.currentScreen === 'game' && !state.isGameOver) {
    const zoomDelta = event.delta > 0 ? -0.08 : 0.08;
    state.targetCameraZoom = constrain((state.targetCameraZoom || 1.0) + zoomDelta, 0.65, 1.5);
    return false;
  }
};

(window as any).windowResized = () => { 
  console.log("Window resized:", windowWidth, windowHeight);
  if (windowWidth > 0 && windowHeight > 0) {
    (window as any).resizeCanvas(windowWidth, windowHeight); 
  }
};

(window as any).touchStarted = (e: any) => {
  handleTouchStarted((window as any).touches);
  (window as any).mousePressed();
  return false;
};

(window as any).touchMoved = (e: any) => {
  handleTouchMoved((window as any).touches);
  return false;
};

(window as any).touchEnded = (e: any) => {
  handleTouchEnded();
  (window as any).mouseReleased();
  return false;
};

(window as any).keyPressed = (event: any) => {
  if (state.isAlmanacOpen && state.almanacTab === 'LevelConfig' && state.activeLevelConfigInput) {
    const k = event?.key || key;
    const code = event?.keyCode || keyCode;
    if (handleLevelConfigKeyInput(k, code, event)) {
      return false;
    }
  }
  if (state.isAlmanacOpen && state.almanacTab === 'Upgrades' && state.isAlmanacEditorMode && state.activePlayerUpgradeInput) {
    const k = event?.key || key;
    const code = event?.keyCode || keyCode;
    if (handlePlayerUpgradeKeyInput(k, code, event)) {
      return false;
    }
  }
  if (state.currentScreen === 'level_editor') {
    if (paygateModal.isOpen) {
      const k = event?.key || key;
      const code = event?.keyCode || keyCode;
      if (handlePayGateModalKeyInput(k, code, event)) {
        return false;
      }
    }
    if (sunGeneratorModal.isOpen) {
      const k = event?.key || key;
      const code = event?.keyCode || keyCode;
      if (handleSunGeneratorModalKeyInput(k, code, event)) {
        return false;
      }
    }
    if (textSignEditor.isOpen) {
      const k = event?.key || key;
      const code = event?.keyCode || keyCode;
      if (handleInlineTextSignKeyInput(k, code, event)) {
        return false;
      }
    }
    if (state.levelEditor?.activeSpawnerInput) {
      const k = event?.key || key;
      const code = event?.keyCode || keyCode;
      if (handleSpawnerKeyInput(k, code, event)) {
        return false;
      }
    }
    if (state.levelEditor?.activeSunGeneratorInput) {
      const k = event?.key || key;
      const code = event?.keyCode || keyCode;
      if (handleSunGeneratorKeyInput(k, code, event)) {
        return false;
      }
    }
  }
  state.needsTargetReScan = true;
  if (keyCode === 87 || keyCode === 65 || keyCode === 83 || keyCode === 68) { // W, A, S, D
    state.isWASDInput = true;
  }
  if (keyCode === 32) { // Spacebar
    state.player.isClickHolding = true;
  }
};

(window as any).keyTyped = (event: any) => {
  if (state.isAlmanacOpen && state.almanacTab === 'LevelConfig' && state.activeLevelConfigInput) {
    return false;
  }
  if (state.isAlmanacOpen && state.almanacTab === 'Upgrades' && state.isAlmanacEditorMode && state.activePlayerUpgradeInput) {
    return false;
  }
  if (state.currentScreen === 'level_editor') {
    if (paygateModal.isOpen || sunGeneratorModal.isOpen || textSignEditor.isOpen || state.levelEditor?.activeSpawnerInput || state.levelEditor?.activeSunGeneratorInput) {
      return false;
    }
  }
};

(window as any).keyReleased = () => {
  state.needsTargetReScan = true;
  if (keyCode === 87 || keyCode === 65 || keyCode === 83 || keyCode === 68) { // W, A, S, D
    // Check if any WASD key is still pressed
    const keyIsDown: any = (window as any).keyIsDown;
    if (!keyIsDown(87) && !keyIsDown(65) && !keyIsDown(83) && !keyIsDown(68)) { // W, A, S, D
      state.isWASDInput = false;
    }
  }
  if (keyCode === 32) { // Spacebar
    state.player.isClickHolding = false;
  }
};

window.addEventListener('blur', () => {
  state.suppressGameplayMouseUntilRelease = false;
  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.isRightDragActive = false;
    state.levelEditor.isRightDragOverlayOnly = false;
    state.levelEditor.isFlagDragActive = false;
    state.levelEditor.spawnAreaLassoPoints = [];
  }
  state.touchStartPos = null;
  state.touchInputVec = { x: 0, y: 0 };
  state.playerSpeedMultiplier = 0;
  (window as any).mouseIsPressed = false;
});

window.addEventListener('focus', () => {
  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.isRightDragActive = false;
    state.levelEditor.isRightDragOverlayOnly = false;
    state.levelEditor.isFlagDragActive = false;
  }
  (window as any).mouseIsPressed = false;
});


function map(n: number, start1: number, stop1: number, start2: number, stop2: number) { return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; }


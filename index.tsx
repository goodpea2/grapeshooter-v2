
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
  GRID_SIZE, HEX_DIST, HOUR_FRAMES, CHUNK_SIZE, PLAYER_DRAG_MIN_DISTANCE_TILES, PLAYER_DRAG_MAX_DISTANCE_TILES,
  VISIBILITY_RADIUS
} from './constants';
import { turretTypes } from './balanceTurrets';
import { findMergeResult, getBaseIngredientsForType, TURRET_RECIPES } from './dictionaryTurretMerging';
import { enemyTypes } from './balanceEnemies';
import { bulletTypes } from './balanceBullets';
import { WorldManager } from './world';
import { Player, Enemy, AttachedTurret, WorldTurret, SunLoot, NPCEntity, GroundFeature } from './entities';
import { createAttachedTurret, createWorldTurret } from './class/turret/TurretRegistry';
import { getTime, drawUI, drawTurretTooltip } from './ui/ui';
import { evaluateWinConditions } from './levelManager';
import { drawAlmanac } from './ui/almanac/mainLayout';
import { drawUnlockPopup, updateUnlockPopup } from './ui/almanac/turretUnlockPopup';
import { drawGameOver } from './ui/uiGameOver';
import { drawPauseMenu } from './ui/uiPauseMenu';
import { drawLoadingScreen } from './ui/uiLoadingScreen';
import { drawWorldGenPreview, drawTurretPathDebug } from './ui/uiDebug';
import { uiComponentsShowcase } from './ui/uiComponentsShowcase';
import { updateGameSystems, spawnFromBudget, getLightLevel, customDayLightConfig } from './lvDemo';
import { 
  MergeVFX, ShopFlyVFX, Explosion, explosionPool, DamageNumberVFX, damageNumberPool, spawnDamageNumber, HitSpark, hitSparkPool,
  StaminaFlyToTurretVFX, staminaFlyToTurretPool, StaminaFlyOutVFX, staminaFlyOutPool, StaminaAbsorbVFX, staminaAbsorbPool,
  ConditionVFX, conditionPool, GreenEssenceVFX, greenEssencePool,
  SpeederAuraVFX, speederAuraPool, TorchwoodAuraVFX, torchwoodAuraPool,
  BugSplatVFX, bugSplatPool, BugSplatVFX2, bugSplat2Pool, BugSplatVFX3, bugSplat3Pool,
  BugSplatTinyVfx, bugSplatTinyPool, BugSplatMeatChunkVfx, bugSplatMeatChunkPool,
  BugSplatMeatChunkGiantVfx, bugSplatMeatChunkGiantPool
} from './vfx/index';
import { bulletPool } from './class/bullet';
import { overlayTypes } from './balanceObstacles';
import { triggerUpgradeHook, recalculateAllStats } from './src/upgrades';
import { drawSynergySystem, drawSynergyOverlayPass } from './src/synergies';
import { ASSETS } from './assets';
import { getHexAxial, axialToWorld, isAdjacent } from './utils/hex';
import { drawTouchVisuals } from './touchScreen';
import { drawGameSpeedButtons } from './ui/uiGameSpeed';
import { drawTurretSprite, TYPE_MAP } from './assetTurret';
import { drawSelectionHighlight, drawMergeBubble, drawSwapBubble } from './ui/overlay/TurretMergeOverlay';
import { drawPendingSpawn } from './visualEnemies';
import { drawBatchedBullets } from './visualBullets';
import { drawTickingExplosive } from './visualObstacles';
import { drawMainMenu } from './ui/uiMainMenu';
import { beginUIFrame, updateUIHoverState } from './uiComponents';
import { soundEngine } from './src/audio/soundEngine';
import { drawLevelEditor } from './levelEditor';
import { getPlayerUpgradeStat } from './src/playerUpgrades';
import { drawTurretUnlockChoiceModal } from './ui/almanac/turretUnlockModal';
import { flowField, flowFieldRegistry } from './pathfinding';
import { spatialGrid } from './class/spatialGrid';
import { 
  drawGlobalLighting, 
  drawVisibilityOverlay, 
  drawDamageVignette, 
  drawAllTurretConnections 
} from './src/renderEffects';
import { 
  canSwapTurrets, 
  swapTurrets, 
  executePlacement, 
  autoPlaceTurret 
} from './src/placementSystem';
import { 
  handleMousePressed,
  handleMouseDragged,
  handleMouseReleased,
  handleMouseWheel,
  handleWindowResized,
  handleTouchStartedEvent,
  handleTouchMovedEvent,
  handleTouchEndedEvent,
  handleKeyPressed,
  handleKeyTyped,
  handleKeyReleased,
  registerWindowListeners 
} from './src/inputHandlers';

(window as any).autoPlaceTurret = autoPlaceTurret;
(window as any).mousePressed = handleMousePressed;
(window as any).mouseDragged = handleMouseDragged;
(window as any).mouseReleased = handleMouseReleased;
(window as any).mouseWheel = handleMouseWheel;
(window as any).windowResized = handleWindowResized;
(window as any).touchStarted = handleTouchStartedEvent;
(window as any).touchMoved = handleTouchMovedEvent;
(window as any).touchEnded = handleTouchEndedEvent;
(window as any).keyPressed = handleKeyPressed;
(window as any).keyTyped = handleKeyTyped;
(window as any).keyReleased = handleKeyReleased;
registerWindowListeners();

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

(window as any).preload = () => {
  // Preload audio files with loading progress
  soundEngine.preloadAllResources();

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
  const isHighQuality = state.graphicQuality === 'high';
  const dpr = isHighQuality && typeof window !== 'undefined' && window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1;
  (window as any).pixelDensity(dpr);
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
  for (let i = state.trails.length - 1; i >= 0; i--) { 
    state.trails[i].update(); 
    if (state.trails[i].isDone()) {
      const last = state.trails.pop()!;
      if (i < state.trails.length) state.trails[i] = last;
    }
  }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { 
    state.groundFeatures[i].update(); 
    if (state.groundFeatures[i].life <= 0) {
      const last = state.groundFeatures.pop()!;
      if (i < state.groundFeatures.length) state.groundFeatures[i] = last;
    }
  }
  GroundFeature.updateTileFireVfx();
  GroundFeature.resolveFireGroundFeatures();
  for (let npc of state.npcs) npc.update(state.player.pos);
  
  if (state.player) {
    flowFieldRegistry.updateAll();
  }

  for (let i = state.enemies.length - 1; i >= 0; i--) { 
    state.enemies[i].update(state.player.pos, state.player?.attachments || []); 
    if (state.enemies[i].health <= 0 || state.enemies[i].markedForDespawn) {
      const last = state.enemies.pop()!;
      if (i < state.enemies.length) state.enemies[i] = last;
    }
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
      if (evaluateWinConditions()) {
        const pending: Array<{ type: 'enemy' | 'block'; target: any }> = [];
        for (const e of state.enemies) {
          if (e.health > 0 && !e.isDying) {
            pending.push({ type: 'enemy', target: e });
          }
        }
        if (state.world && state.world.chunks) {
          state.world.chunks.forEach((chunk: any) => {
            for (const b of chunk.blocks) {
              if (!b.isMined) {
                const oCfg = b.overlay ? (overlayTypes as any)[b.overlay] : null;
                const bCfg = b.config;
                if (oCfg?.isEnemy || bCfg?.isEnemy || b.isWinCondition || b.overlay?.startsWith('ov_spawner') || b.liquidType === 'l_spawner' || b.customSpawnerConfig || overlayTypes[b.overlay || '']?.isEnemySpawner) {
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

  state.player.update();
  for (let i = state.bullets.length - 1; i >= 0; i--) { 
    const b = state.bullets[i];
    b.update(); 
    if (b.life <= 0) {
      bulletPool.release(b);
      const last = state.bullets.pop()!;
      if (i < state.bullets.length) state.bullets[i] = last;
    }
  }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) { 
    const eb = state.enemyBullets[i];
    eb.update(); 
    if (eb.life <= 0) {
      bulletPool.release(eb);
      const last = state.enemyBullets.pop()!;
      if (i < state.enemyBullets.length) state.enemyBullets[i] = last;
    }
  }
  for (let i = state.vfx.length - 1; i >= 0; i--) { 
    const v = state.vfx[i];
    if (!v) {
      state.vfx.splice(i, 1);
      continue;
    }
    v.update(); 
    if (v.isDone()) {
      if (v instanceof Explosion) {
        explosionPool.release(v);
      } else if (v instanceof DamageNumberVFX) {
        damageNumberPool.release(v);
      } else if (v instanceof HitSpark) {
        hitSparkPool.release(v);
      } else if (v instanceof StaminaFlyToTurretVFX) {
        staminaFlyToTurretPool.release(v);
      } else if (v instanceof StaminaFlyOutVFX) {
        staminaFlyOutPool.release(v);
      } else if (v instanceof StaminaAbsorbVFX) {
        staminaAbsorbPool.release(v);
      } else if (v instanceof ConditionVFX) {
        conditionPool.release(v);
      } else if (v instanceof GreenEssenceVFX) {
        greenEssencePool.release(v);
      } else if (v instanceof SpeederAuraVFX) {
        speederAuraPool.release(v);
      } else if (v instanceof TorchwoodAuraVFX) {
        torchwoodAuraPool.release(v);
      }
      const last = state.vfx.pop()!;
      if (i < state.vfx.length) state.vfx[i] = last;
    }
  }
  
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
  if (typeof textFont === 'function') textFont('Viga');

  const now = (window as any).performance.now();
  if (state.lastFrameTime === 0) state.lastFrameTime = now;
  const deltaTime = now - state.lastFrameTime;
  state.lastFrameTime = now;

  // Global Audio Engine Update
  soundEngine.update(deltaTime);

  if (state.currentScreen === 'main_menu') {
    drawMainMenu();
    drawPauseMenu();
    if (state.isLoadingResources) {
      drawLoadingScreen();
    }
    return;
  }
  if (state.currentScreen === 'level_editor') {
    drawLevelEditor();
    drawPauseMenu();
    if (state.isLoadingResources) {
      drawLoadingScreen();
    }
    return;
  }
  
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
  
  if (!isScaling) {
    state.turretZoomOffset = 0;
  }

  // FOV movement zoom effect based on player speed
  const playerVel = state.player ? dist(state.player.pos.x, state.player.pos.y, state.player.prevPos.x, state.player.prevPos.y) : 0;
  const isMoving = state.player?.isMovingIntent;
  const targetFovZoomOffset = isMoving ? -Math.min(0.04, 0.01 + playerVel * 0.01) : 0;
  state.fovZoomOffset = (state.fovZoomOffset || 0) + (targetFovZoomOffset - (state.fovZoomOffset || 0)) * 0.15;
  
  // Dynamic target zoom: fits all available attached spots when placing/selecting turrets
  const baseZoom = state.targetCameraZoom || 1.0;
  const dynamicZoom = isScaling ? getDynamicPlacementZoom() : baseZoom;
  const turretZoom = isScaling ? (dynamicZoom + (state.turretZoomOffset || 0)) : baseZoom;
  const fovOffset = isScaling ? 0 : (state.fovZoomOffset || 0);
  const effectiveTargetZoom = constrain(turretZoom + fovOffset, 0.5, 2.0);

  // Steep easeOut zoom interpolation
  const zoomDiff = effectiveTargetZoom - (state.cameraZoom || 1.0);
  if (Math.abs(zoomDiff) > 0.0005) {
    state.cameraZoom = (state.cameraZoom || 1.0) + zoomDiff * 0.28;
  } else {
    state.cameraZoom = effectiveTargetZoom;
  }

  let currentZoom = state.cameraZoom;

  if (state.damageFlash > 0) {
    state.damageFlash = Math.max(0, state.damageFlash - 0.04);
  }

  // Calculate dynamic rendering viewport bounds (with a safety margin of 200px)
  const halfViewW = (width / (2 * currentZoom)) + 200;
  const halfViewH = (height / (2 * currentZoom)) + 200;
  state.viewportBounds = {
    minX: state.cameraPos.x - halfViewW,
    maxX: state.cameraPos.x + halfViewW,
    minY: state.cameraPos.y - halfViewH,
    maxY: state.cameraPos.y + halfViewH
  };
  const vp = state.viewportBounds;

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
  for (let i = state.trails.length - 1; i >= 0; i--) { 
    const tr = state.trails[i];
    if (tr.pos && vp && vp.maxX !== undefined && (tr.pos.x < vp.minX - 40 || tr.pos.x > vp.maxX + 40 || tr.pos.y < vp.minY - 40 || tr.pos.y > vp.maxY + 40)) continue;
    tr.display(); 
  }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { 
    const gf = state.groundFeatures[i];
    if (gf.pos && vp && vp.maxX !== undefined && (gf.pos.x < vp.minX - 50 || gf.pos.x > vp.maxX + 50 || gf.pos.y < vp.minY - 50 || gf.pos.y > vp.maxY + 50)) continue;
    gf.display(); 
  }
  GroundFeature.displayTileFireVfx(vp);

  const mWorld = createVector(
    (mouseX - width/2) / currentZoom + state.cameraPos.x,
    (mouseY - height/2) / currentZoom + state.cameraPos.y
  );

  // 0. Highlight effects behind hovered turrets
  state.hoveredTurretInstance = null;
  const isAlmanacActive = !!(state.isAlmanacOpen || state.turretUnlockChoiceModal || state.showUnlockPopup);
  if (!isAlmanacActive && (mouseX > state.uiWidth || !state.isStationary)) {
    const worldTurrets = state.world.getAllTurrets();
    const accessibleWorldTurrets = worldTurrets.filter((wt: any) => !wt.isRelocating && wt.jumpPhase === null);
    const sortedForSelection = [...state.player.attachments, ...accessibleWorldTurrets].sort((a, b) => {
        const la = a.config.turretLayer || 'normal'; const lb = b.config.turretLayer || 'normal';
        if (la !== lb) return la === 'normal' ? -1 : 1;
        const posA = a.getWorldPos(); const posB = b.getWorldPos();
        if (posA.y !== posB.y) return posA.y - posB.y; return posB.x - posA.x;
    });
    for (let t of sortedForSelection) { if (dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) { state.hoveredTurretInstance = t; break; } }
    if (!state.hoveredTurretInstance && state.player) {
      if (dist(mWorld.x, mWorld.y, state.player.pos.x, state.player.pos.y) < state.player.size / 2 + 5) {
        state.isPlayerHovered = true;
      } else {
        state.isPlayerHovered = false;
      }
    } else {
      state.isPlayerHovered = false;
    }
  } else {
    state.isPlayerHovered = false;
  }

  drawSynergySystem();

  if (state.hoveredTurretInstance && !state.isCurrentlyDragging) {
    const t = state.hoveredTurretInstance; const wPos = t.getWorldPos();
    drawSelectionHighlight(wPos.x, wPos.y, t.size, 200 + sin(state.frames * 0.15) * 50);
    const range = (typeof t.getEffectiveRange === 'function') ? t.getEffectiveRange() : (
      t.activeStats?.shootRange || t.activeStats?.range ||
      t.config?.actionConfig?.shootRange || t.config?.actionConfig?.beamMaxLength ||
      t.config?.actionConfig?.pulseTriggerRadius || t.config?.actionConfig?.triggerRadius ||
      t.config?.actionConfig?.attractRange || t.config?.actionConfig?.aoeRadius ||
      t.config?.actionConfig?.shieldRadius || t.config?.actionConfig?.buffRadius || 0
    );
    if (range > 0) { push(); noFill(); stroke(255, 200, 50, 140); strokeWeight(isScaling ? 2 / currentZoom : 2); ellipse(wPos.x, wPos.y, range * 2); pop(); }
  } else if (state.isPlayerHovered && !state.isCurrentlyDragging && state.player) {
    const p = state.player;
    drawSelectionHighlight(p.pos.x, p.pos.y, p.size, 200 + sin(state.frames * 0.15) * 50);
    const pRange = (typeof p.getEffectiveRange === 'function') ? p.getEffectiveRange() : (p.autoTurretRange || 180);
    if (pRange > 0) { push(); noFill(); stroke(255, 200, 50, 140); strokeWeight(isScaling ? 2 / currentZoom : 2); ellipse(p.pos.x, p.pos.y, pRange * 2); pop(); }
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

  drawBatchedBullets(state.bullets, vp);
  drawBatchedBullets(state.enemyBullets, vp);
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
  state.mergeTargetPreview = null; state.previewSnapPos = null; state.swapTargetPreview = null;

  if ((activePlacementType || state.draggedTurretInstance) && !state.isGameOver) {
    const ghostType = state.draggedTurretInstance ? state.draggedTurretInstance.type : activePlacementType;
    const ghostConfig = ghostType ? turretTypes[ghostType] : null; const ghostLayer = ghostConfig?.turretLayer || 'normal';
    const draggingIngredients = state.draggedTurretInstance 
      ? (state.draggedTurretInstance.baseIngredients?.length ? state.draggedTurretInstance.baseIngredients : getBaseIngredientsForType(state.draggedTurretInstance.type)) 
      : (activePlacementType ? getBaseIngredientsForType(activePlacementType) : []);
    
    // Purchase cost only applies if we are placing a NEW turret (not repositioning an instance)
    const isNewPlacement = !!activePlacementType;
    const isOwned = activePlacementType ? (state.inventory.items[activePlacementType] || 0) > 0 : false;
    const purchaseCost = (isNewPlacement && !isOwned) ? (ghostConfig?.costs?.sun || ghostConfig?.cost || 0) : 0;

    let closestDist = Infinity; let bestSnap = null; let bestMergeTarget = null; let bestMergeInfo = null; let bestSwapTarget: any = null;
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
    const availablePlacementSpots: Array<{ pos: any; q?: number; r?: number; gx?: number; gy?: number; isAttached: boolean }> = [];
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

            const isOwnSlot = (occupantOnSameLayer === state.draggedTurretInstance && state.draggedTurretInstance != null);

            if (!occupantOnSameLayer || isOwnSlot) {
              if (isAdjacent(q, r, state.draggedTurretInstance)) {
                const isClear = !state.world.checkCollision(wPos.x, wPos.y, ghostConfig.size * 0.55);
                if (isClear) {
                  // If it is the turret's own slot, do NOT draw indicator or add to availablePlacementSpots
                  if (!isOwnSlot) {
                    availablePlacementSpots.push({ pos: wPos, q, r, isAttached: true });
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
                  }

                  if (d < closestDist && d < GRID_SIZE * 3) {
                    closestDist = d; bestSnap = wPos; bestMergeTarget = null; bestMergeInfo = null;
                    state.previewWorldSnap = null;
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
          
          const isOwnWorldSlot = state.draggedTurretInstance && 
            (state.draggedTurretInstance as any).gx === gx && 
            (state.draggedTurretInstance as any).gy === gy;

          const worldOccupant = state.world.getTurretAt(gx, gy);
          const isOccupiedByOther = worldOccupant && worldOccupant !== state.draggedTurretInstance;

          if (!isTooClose && !state.world.isBlockAt(wx, wy) && !isOccupiedByOther && flowField.isTileAccessible(wx, wy)) {
            if (!isOwnWorldSlot) {
              availablePlacementSpots.push({ pos: createVector(wx, wy), gx, gy, isAttached: false });
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
            }
            
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
      const draggingTier = state.draggedTurretInstance ? (state.draggedTurretInstance.config?.tier || 1) : (ghostConfig?.tier || 1);
      const targetTier = att.config?.tier || 1;
      const targetIngredients = att.baseIngredients?.length ? att.baseIngredients : getBaseIngredientsForType(att.type);

      if (isMergeableLayer && !att.isFrosted && draggingTier >= 1 && draggingTier < 3 && targetTier >= 1 && targetTier < 3 && (draggingIngredients?.length || 0) > 0 && (targetIngredients?.length || 0) > 0) {
        const maxIngredientTier = Math.floor(Math.max(draggingTier, targetTier));
        const expectedOutputTier = maxIngredientTier + 1;
        const combinedPool = [...draggingIngredients, ...targetIngredients];
        const mergeResult = findMergeResult(combinedPool, expectedOutputTier);
        const resType = mergeResult ? mergeResult.id : null;
        const missingDuplicates = mergeResult ? mergeResult.missingDuplicates : 0;
        const resConfig = resType ? turretTypes[resType] : null;
        const isAvailable = resType ? (state.unlockedTurrets.includes(resType) || state.makeAllTurretsAvailable) : false;
        if (resType && resConfig && isAvailable) {
          const draggingCost = ghostConfig?.costs?.sun || ghostConfig?.cost || 0;
          const targetCost = att.config?.costs?.sun || att.config?.cost || 0;
          const inputTurretsCostSum = draggingCost + targetCost;
          const resSunCost = resConfig.costs?.sun || resConfig.cost || 0;
          const combinedMergeCost = Math.max(0, resSunCost - inputTurretsCostSum) + (missingDuplicates * 10);
          mergeInfo = { resType, resConfig, combinedMergeCost, combinedPool, missingDuplicates };
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
          bestSwapTarget = null;
          state.previewWorldSnap = null; // Clear world snap if we are merging
        }
      } else if (state.draggedTurretInstance && canSwapTurrets(state.draggedTurretInstance, att)) {
        // Non-mergable turret swap candidate!
        const isBestSnap = (d < closestDist && d < GRID_SIZE * 2.5);
        if (isBestSnap) {
          closestDist = d; bestSnap = wPos; bestMergeTarget = null; bestMergeInfo = null;
          bestSwapTarget = att;
          state.previewWorldSnap = null;
        }
      }
    }

    // Check if dragging a full-HP t2_wallaser with u_t2_wallaser_3 onto the player
    if (state.draggedTurretInstance && state.draggedTurretInstance.type === 't2_wallaser' && state.player) {
      const hasUpg3 = (state.turretUpgrades?.['t2_wallaser'] || []).includes('u_t2_wallaser_3');
      const isFullHp = state.draggedTurretInstance.health >= (state.draggedTurretInstance.maxHealth || state.draggedTurretInstance.config?.maxHealth || state.draggedTurretInstance.config?.health || 150);
      if (hasUpg3 && isFullHp) {
        const pPos = state.player.pos;
        const d = dist(mWorld.x, mWorld.y, pPos.x, pPos.y);
        const playerMergeInfo = { resType: 'player_heal', resConfig: null, combinedMergeCost: 0, combinedPool: [], isPlayerHeal: true };
        mergeCandidates.push({ att: state.player, wPos: pPos, d, mergeInfo: playerMergeInfo, totalReq: 0, canAfford: true, isPlayerHeal: true });
        if (d < closestDist && d < GRID_SIZE * 3) {
          closestDist = d;
          bestSnap = pPos;
          bestMergeTarget = state.player;
          bestMergeInfo = playerMergeInfo;
          state.previewWorldSnap = null;
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
        
        if (isHovered && mergeInfo.resConfig) { 
          const resRange = mergeInfo.resConfig.actionConfig?.shootRange || mergeInfo.resConfig.actionConfig?.beamMaxLength || mergeInfo.resConfig.actionConfig?.pulseTriggerRadius || 0; 
          if (resRange > 0) { push(); noFill(); stroke(255, 255, 0, 180); strokeWeight(3); ellipse(wPos.x, wPos.y, resRange * 2); pop(); } 
        }
        state.mergeTargetPreview = { uid: att.uid || 'player', type: mergeInfo.resType, pos: wPos, cost: mergeInfo.combinedMergeCost, ingredients: mergeInfo.combinedPool, isPlayerHeal: !!mergeInfo.isPlayerHeal };
      }
      // Draw bubble for all candidates
      // If it's the best snap, it shows as confirming (yellow) when hovered
      drawMergeBubble(wPos.x, wPos.y, mergeInfo.resType, totalReq, canAfford, isHovered, 255);
    }

    if (bestSwapTarget) {
      state.swapTargetPreview = bestSwapTarget;
      const isHovered = dist(mWorld.x, mWorld.y, bestSwapTarget.getWorldPos().x, bestSwapTarget.getWorldPos().y) < 35;
      drawSelectionHighlight(bestSwapTarget.getWorldPos().x, bestSwapTarget.getWorldPos().y, bestSwapTarget.size, isHovered ? 255 : 180);
      drawSwapBubble(bestSwapTarget.getWorldPos().x, bestSwapTarget.getWorldPos().y, 255);
    }

    // Draw synergy speech bubbles on the same layer as turretMergeCost (prioritizing merge cost)
    drawSynergyOverlayPass(mergeCandidates, availablePlacementSpots, bestSnap, ghostType, state.draggedTurretInstance);

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
  } else if (!state.isGameOver && state.hoveredTurretInstance && !state.isCurrentlyDragging) {
    drawSynergyOverlayPass();
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
  drawDamageVignette();
  drawTouchVisuals();
  drawGameSpeedButtons();
  drawUI(spawnFromBudget);
  drawWorldGenPreview();

  if (state.isGameOver) {
    drawGameOver();
  }

  drawPauseMenu();

  drawAlmanac();
  drawUnlockPopup();
  if (state.turretUnlockChoiceModal && !state.isAlmanacOpen) {
    drawTurretUnlockChoiceModal();
  }
  uiComponentsShowcase.draw();

  if (!isAlmanacActive && state.hoveredTurretInstance && !state.draggedTurretInstance && !activePlacementType) { 
    drawTurretTooltip(state.hoveredTurretInstance, mouseX, mouseY); 
  } else if (!isAlmanacActive && state.mergeTargetPreview) { 
    drawTurretTooltip(state.mergeTargetPreview, mouseX, mouseY, true); 
  }

  // Draw UI VFX at the very end to ensure they are on top of everything (including Almanac)
  for (let i = state.uiVfx.length - 1; i >= 0; i--) { 
    state.uiVfx[i].display(); 
  }

  if (state.isLoadingResources) {
    drawLoadingScreen();
  }

  // Update UI hover states & SFX strictly once per frame for the top-most hitbox
  updateUIHoverState();
};


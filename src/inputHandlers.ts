import { state } from '../state';
import { 
  GRID_SIZE, 
  PLAYER_DRAG_MIN_DISTANCE_TILES, 
  PLAYER_DRAG_MAX_DISTANCE_TILES 
} from '../constants';
import { soundEngine } from './audio/soundEngine';
import { handleUIMousePress, handleUIMouseRelease } from '../uiComponents';
import { handleTurretUnlockChoiceModalClick } from '../ui/almanac/turretUnlockModal';
import {
  handleLevelEditorPress,
  handleLevelEditorClick,
  handleLevelEditorScroll,
  handleLevelEditorMouseRelease,
  handleSpawnerKeyInput,
  handleSunGeneratorKeyInput,
  undoLevelEditorAction,
  redoLevelEditorAction,
  showEditorToast,
  paygateModal,
  handlePayGateModalKeyInput,
  handlePayGateCostModalDrag,
  sunGeneratorModal,
  handleSunGeneratorModalKeyInput,
  textSignEditor,
  handleInlineTextSignKeyInput,
  handleInlineTextSignDrag
} from '../levelEditor';
import { handleMainMenuPress, handleMainMenuDrag, handleMainMenuRelease } from '../ui/uiMainMenu';
import { handleTouchStarted, handleTouchMoved, handleTouchEnded } from '../touchScreen';
import { handleNpcUiClick, handleNpcUiPress } from '../ui/uiNpcShop';
import { uiComponentsShowcase } from '../ui/uiComponentsShowcase';
import { handleUnlockPopupClick } from '../ui/almanac/turretUnlockPopup';
import { 
  handlePlayerUpgradeKeyInput, 
  handlePlayerUpgradeMouseDrag, 
  handlePlayerUpgradeMouseRelease,
  handlePlayerUpgradesScroll
} from '../ui/almanac/playerUpgradesPanel';
import { handleAlmanacClick } from '../ui/almanac/mainLayout';
import { handleGameOverClick } from '../ui/uiGameOver';
import { handleGameSpeedButtonClick } from '../ui/uiGameSpeed';
import { executePlacement, autoPlaceTurret } from './placementSystem';
import { handleTurretUnlockTreeScroll } from '../ui/almanac/turretUnlockTree';
import { handleLevelConfigKeyInput, handleLevelConfigScroll } from '../ui/almanac/levelConfigPanel';
import { handleSkillTreeConfigKeyInput } from '../ui/almanac/skillTreeConfigPanel';
import { flowField } from '../pathfinding';

export function handleMousePressed() {
  soundEngine.unlock();
  state.isMouseDown = true;
  if (state.suppressGameplayMouseUntilRelease) {
    return;
  }

  // Register mouse down on modular UI hitboxes
  handleUIMousePress(mouseX, mouseY);

  if (state.turretUnlockChoiceModal) {
    if (handleTurretUnlockChoiceModalClick(mouseX, mouseY)) {
      return;
    }
  }

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
    state.swapTargetPreview = null;
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
        state.draggedTurretInstance = wt; state.dragOrigin = { x: mouseX, y: mouseY }; state.isCurrentlyDragging = false;
        soundEngine.playSFX('turret_pickup');
        return;
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
        state.draggedTurretInstance = t; state.dragOrigin = { x: mouseX, y: mouseY }; state.isCurrentlyDragging = false;
        soundEngine.playSFX('turret_pickup');
        break;
      }
    }
  }
}

export function handleMouseDragged() {
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
}

export function handleMouseReleased() {
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
}

export function handleMouseWheel(event: any) {
  if (state.isGameOver) return;
  if (state.isAlmanacOpen) {
    if (state.almanacTab === 'TurretUnlock') {
      if (handleTurretUnlockTreeScroll(event.delta)) return false;
    }
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
    const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
    const isScaling = !!(activePlacementType || state.draggedTurretInstance);
    if (isScaling) {
      state.turretZoomOffset = constrain((state.turretZoomOffset || 0) + zoomDelta, -0.4, 0.5);
    } else {
      state.targetCameraZoom = constrain((state.targetCameraZoom || 1.0) + zoomDelta, 0.65, 1.5);
    }
    return false;
  }
}

export function handleWindowResized() {
  if (windowWidth > 0 && windowHeight > 0) {
    const isHighQuality = state.graphicQuality === 'high';
    const dpr = isHighQuality && typeof window !== 'undefined' && window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1;
    (window as any).pixelDensity(dpr);
    (window as any).resizeCanvas(windowWidth, windowHeight); 
  }
}

export function handleTouchStartedEvent(e: any) {
  handleTouchStarted((window as any).touches);
  handleMousePressed();
  return false;
}

export function handleTouchMovedEvent(e: any) {
  handleTouchMoved((window as any).touches);
  return false;
}

export function handleTouchEndedEvent(e: any) {
  handleTouchEnded();
  handleMouseReleased();
  return false;
}

export function handleKeyPressed(event: any) {
  const k = event?.key || key;
  const code = event?.keyCode || keyCode;

  if (k === 'Escape' || code === 27) {
    if (state.currentScreen === 'game') {
      if (state.isPauseMenuOpen) {
        state.isPauseMenuOpen = false;
        state.isPaused = false;
      } else if (!state.isAlmanacOpen && !state.showGameOverPopup) {
        state.isPauseMenuOpen = true;
        state.isPaused = true;
      }
      return false;
    }
  }
  if (state.isAlmanacOpen && state.almanacTab === 'LevelConfig' && state.activeLevelConfigInput) {
    const k = event?.key || key;
    const code = event?.keyCode || keyCode;
    if (handleLevelConfigKeyInput(k, code, event)) {
      return false;
    }
  }
  if (state.isAlmanacOpen && state.almanacTab === 'TurretUnlock' && state.isAlmanacEditorMode && state.activeSkillTreeConfigInput) {
    const k = event?.key || key;
    const code = event?.keyCode || keyCode;
    if (handleSkillTreeConfigKeyInput(k, code, event)) {
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
    // Ctrl+Z Undo / Ctrl+Y / Ctrl+Shift+Z Redo for Level Editor
    if ((event?.ctrlKey || event?.metaKey)) {
      if (event?.shiftKey && (k === 'z' || k === 'Z' || code === 90)) {
        if (redoLevelEditorAction()) {
          return false;
        }
      } else if (k === 'y' || k === 'Y' || code === 89) {
        if (redoLevelEditorAction()) {
          return false;
        }
      } else if (k === 'z' || k === 'Z' || code === 90) {
        if (undoLevelEditorAction()) {
          return false;
        }
      }
    }

    // Tool switching hotkeys (when not typing in modal/input)
    if (!event?.ctrlKey && !event?.metaKey && !event?.altKey && state.levelEditor) {
      if (k === '1' || k === 'b' || k === 'B') {
        state.levelEditor.toolMode = 'brush';
        showEditorToast("Brush Tool (B)");
        return false;
      }
      if (k === '2' || k === 'f' || k === 'F') {
        state.levelEditor.toolMode = 'bucket';
        if (state.levelEditor.activeCategory !== 'obstacles' && state.levelEditor.activeCategory !== 'liquids') {
          state.levelEditor.activeCategory = 'obstacles';
          state.levelEditor.selectedItemKey = 'o_dirt';
        }
        showEditorToast("Fill Tool (F)");
        return false;
      }
      if (k === '3' || k === 'l' || k === 'L') {
        state.levelEditor.toolMode = 'lasso';
        const validCats = ['obstacles', 'overlays', 'liquids', 'flags'];
        if (!validCats.includes(state.levelEditor.activeCategory)) {
          state.levelEditor.activeCategory = 'obstacles';
          if (!state.levelEditor.selectedItemKey || state.levelEditor.selectedItemKey === 'empty') {
            state.levelEditor.selectedItemKey = 'o_dirt';
          }
        }
        showEditorToast("Lasso Tool (L)");
        return false;
      }
      if (k === '4') {
        state.levelEditor.toolMode = 'spawn_area';
        showEditorToast("Spawn Area Tool");
        return false;
      }
    }
    return;
  }
  state.needsTargetReScan = true;
  if (keyCode === 87 || keyCode === 65 || keyCode === 83 || keyCode === 68) { // W, A, S, D
    state.isWASDInput = true;
  }
  if (keyCode === 32) { // Spacebar
    state.player.isClickHolding = true;
  }
}

export function handleKeyTyped(event: any) {
  if (state.isAlmanacOpen && state.almanacTab === 'LevelConfig' && state.activeLevelConfigInput) {
    return false;
  }
  if (state.isAlmanacOpen && state.almanacTab === 'TurretUnlock' && state.isAlmanacEditorMode && state.activeSkillTreeConfigInput) {
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
}

export function handleKeyReleased() {
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
}

export function registerWindowListeners() {
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
}

export function setupInputHandlers() {
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
}

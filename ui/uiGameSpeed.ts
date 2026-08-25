import { state } from '../state';
import { AlmanacProgression } from '../lvDemo';
import { closeAlmanac } from './almanac/mainLayout';
import { drawButton, drawDarkButton, drawCyanButton, registerUIHitbox } from '../uiComponents';
import { startLevelEditor, restoreLevelFromCache } from '../levelEditor';
import { createWorldTurret } from '../class/turret/TurretRegistry';
import { MergeVFX } from '../vfx/index';
import { flowField } from '../pathfinding';
import { GRID_SIZE } from '../constants';
import { triggerUpgradeHook } from '../src/upgrades';

export function detachAllTurrets() {
  if (!state.player || !state.player.attachments || state.player.attachments.length === 0 || !state.world) return;

  const attachments = [...state.player.attachments];
  state.player.attachments = [];

  const occupiedTiles = new Set<string>();
  state.world.getAllTurrets().forEach((t: any) => {
    occupiedTiles.add(`${t.gx},${t.gy}`);
  });

  const playerGx = Math.floor(state.player.pos.x / GRID_SIZE);
  const playerGy = Math.floor(state.player.pos.y / GRID_SIZE);
  occupiedTiles.add(`${playerGx},${playerGy}`);

  for (const att of attachments) {
    const wPos = att.getWorldPos();
    const baseGx = Math.floor(wPos.x / GRID_SIZE);
    const baseGy = Math.floor(wPos.y / GRID_SIZE);

    let placedGx = baseGx;
    let placedGy = baseGy;
    let found = false;

    for (let r = 0; r <= 8 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tgx = baseGx + dx;
          const tgy = baseGy + dy;
          const key = `${tgx},${tgy}`;
          if (occupiedTiles.has(key)) continue;

          const wx = tgx * GRID_SIZE + GRID_SIZE / 2;
          const wy = tgy * GRID_SIZE + GRID_SIZE / 2;

          if (!state.world.isBlockAt(wx, wy) && !state.world.getTurretAt(tgx, tgy) && flowField.isTileAccessible(wx, wy)) {
            placedGx = tgx;
            placedGy = tgy;
            occupiedTiles.add(key);
            found = true;
          }
        }
      }
    }

    const wt = createWorldTurret(att.type, placedGx, placedGy);
    wt.health = att.health;
    wt.baseIngredients = att.baseIngredients ? [...att.baseIngredients] : [att.type];
    state.world.addTurret(wt);

    triggerUpgradeHook('onDetach', att, {});

    const placeWx = placedGx * GRID_SIZE + GRID_SIZE / 2;
    const placeWy = placedGy * GRID_SIZE + GRID_SIZE / 2;
    state.vfx.push(new MergeVFX(placeWx, placeWy, [200, 255, 200]));
  }

  state.needsTargetReScan = true;
}

declare const translate: any;
declare const stroke: any;
declare const strokeWeight: any;

declare const p5: any;
declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const triangle: any;
declare const text: any;
declare const textSize: any;
declare const textAlign: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const mouseX: any;
declare const mouseY: any;
declare const dist: any;
declare const frameCount: any;
declare const sin: any;
declare const lerp: any;
declare const imageMode: any;
declare const image: any;
declare const map: any;
declare const tint: any;
declare const noTint: any;

export function drawGameSpeedButtons() {
  const costIdx = Math.min(state.unlockCount, AlmanacProgression.UnlockCost.length - 1);
  const costObj = AlmanacProgression.UnlockCost[costIdx];
  const costType = Object.keys(costObj)[0];
  const costVal = (costObj as any)[costType];
  
  let currentCurrency = 0;
  if (costType === 'raisin') currentCurrency = state.raisinCurrency;
  else if (costType === 'soil') currentCurrency = state.soilCurrency;
  else if (costType === 'elixir') currentCurrency = state.elixirCurrency;
  
  const canAfford = currentCurrency >= costVal && state.lockedTurrets.length > 0;

  push();
  const btnMargin = 10;
  const btnSize = 40;
  const almanacBtnSize = 80;
  const speedupBtnX = width - btnMargin - btnSize; // Right-align Speedup button
  const speedupBtnY = btnMargin;
  const pauseBtnX = width - btnMargin - btnSize * 2 - btnMargin; // Right-align Pause button
  const pauseBtnY = btnMargin;
  const almanacBtnX = width - (btnMargin + 10) - almanacBtnSize; // Bottom-right Almanac button
  const almanacBtnY = height - (btnMargin + 10) - almanacBtnSize;
  const playerUpgradeBtnX = almanacBtnX - almanacBtnSize - 10; // Left of Almanac button
  const playerUpgradeBtnY = almanacBtnY;

  // Almanac Button Hitbox
  const isDebugBlocking = state.showDebug && mouseX > width - 280;
  if (!state.upgradeSelection && !isDebugBlocking) {
    registerUIHitbox({
      id: 'btn_almanac',
      x: almanacBtnX,
      y: almanacBtnY,
      w: almanacBtnSize,
      h: almanacBtnSize,
      onClick: () => {
        if (state.isAlmanacOpen && state.almanacTab !== 'Upgrades') {
          closeAlmanac();
        } else if (state.isAlmanacOpen && state.almanacTab === 'Upgrades') {
          state.almanacTab = 'Turrets';
        } else {
          state.isAlmanacOpen = true;
          state.isPaused = true;
          state.almanacTab = 'Turrets';
        }
      }
    });

    registerUIHitbox({
      id: 'btn_player_upgrade_hud',
      x: playerUpgradeBtnX,
      y: playerUpgradeBtnY,
      w: almanacBtnSize,
      h: almanacBtnSize,
      onClick: () => {
        if (state.isAlmanacOpen && state.almanacTab === 'Upgrades') {
          closeAlmanac();
        } else {
          state.isAlmanacOpen = true;
          state.isPaused = true;
          state.almanacTab = 'Upgrades';
        }
      }
    });
  }

  // PlayerUpgrade Button Visual
  const isHoveringPU = dist(mouseX, mouseY, playerUpgradeBtnX + almanacBtnSize / 2, playerUpgradeBtnY + almanacBtnSize / 2) < almanacBtnSize / 2;
  push();
  imageMode(CENTER);
  const puIcon = state.assets['img_icon_playerupgrade'];
  const puGlowIcon = state.assets['img_icon_playerupgrade_glow'];

  if (puIcon) image(puIcon, playerUpgradeBtnX + almanacBtnSize / 2, playerUpgradeBtnY + almanacBtnSize / 2, almanacBtnSize, almanacBtnSize);

  let puGlowAlpha = 0;
  if (isHoveringPU || (state.isAlmanacOpen && state.almanacTab === 'Upgrades')) {
    puGlowAlpha = 255;
  }
  if (puGlowAlpha > 0 && puGlowIcon) {
    tint(255, puGlowAlpha);
    image(puGlowIcon, playerUpgradeBtnX + almanacBtnSize / 2, playerUpgradeBtnY + almanacBtnSize / 2, almanacBtnSize, almanacBtnSize);
    noTint();
  }
  pop();

  // Almanac Button Visual
  const isHoveringAlmanac = dist(mouseX, mouseY, almanacBtnX + almanacBtnSize / 2, almanacBtnY + almanacBtnSize / 2) < almanacBtnSize / 2;
  
  push();
  imageMode(CENTER);
  const icon = state.assets['img_icon_almanac'];
  const glowIcon = state.assets['img_icon_almanac_glow'];
  
  if (icon) image(icon, almanacBtnX + almanacBtnSize / 2, almanacBtnY + almanacBtnSize / 2, almanacBtnSize, almanacBtnSize);
  
  let glowAlpha = 0;
  if (isHoveringAlmanac || (state.isAlmanacOpen && state.almanacTab !== 'Upgrades')) {
    glowAlpha = 255;
  } else if (canAfford) {
    glowAlpha = map(sin(state.frames * 0.15), -1, 1, 50, 255);
  }
  
  if (glowAlpha > 0 && glowIcon) {
    tint(255, glowAlpha);
    image(glowIcon, almanacBtnX + almanacBtnSize / 2, almanacBtnY + almanacBtnSize / 2, almanacBtnSize, almanacBtnSize);
    noTint();
  }
  pop();

  // DetachAllTurrets Button (Bottom Center, when stationary and has attached turrets)
  const canDetach = state.isStationary && state.player?.attachments && state.player.attachments.length > 0 && !state.isGameOver && !state.isAlmanacOpen && state.currentScreen !== 'main_menu';
  if (canDetach && !isDebugBlocking && !state.upgradeSelection) {
    const detachBtnSize = almanacBtnSize;
    const detachBtnX = width / 2 - detachBtnSize / 2;
    const detachBtnY = height - (btnMargin + 10) - detachBtnSize;

    registerUIHitbox({
      id: 'btn_detach_all_turrets',
      x: detachBtnX,
      y: detachBtnY,
      w: detachBtnSize,
      h: detachBtnSize,
      onClick: () => {
        detachAllTurrets();
      }
    });

    const isHoveringDetach = dist(mouseX, mouseY, detachBtnX + detachBtnSize / 2, detachBtnY + detachBtnSize / 2) < detachBtnSize / 2;
    push();
    imageMode(CENTER);
    const detachIcon = state.assets['img_icon_detach'];
    const detachGlowIcon = state.assets['img_icon_detach_glow'];

    if (detachIcon) {
      image(detachIcon, detachBtnX + detachBtnSize / 2, detachBtnY + detachBtnSize / 2, detachBtnSize, detachBtnSize);
    }
    if (isHoveringDetach && detachGlowIcon) {
      tint(255, 255);
      image(detachGlowIcon, detachBtnX + detachBtnSize / 2, detachBtnY + detachBtnSize / 2, detachBtnSize, detachBtnSize);
      noTint();
    }
    pop();
  }

  // Speedup Button
  if (state.isAlmanacOpen) {
    pop();
    return; // Block other buttons if Almanac is open
  }

  // 1. Speedup Button
  drawButton(speedupBtnX, speedupBtnY, btnSize, btnSize, state.gameSpeed + 'x', {
    id: 'btn_speedup',
    variant: state.requestedGameSpeed === 2 ? 'green' : 'dark',
    fontSize: 16,
    radius: 12,
    depth3D: 3,
    onClick: () => {
      state.requestedGameSpeed = state.requestedGameSpeed === 2 ? 1 : 2;
      state.isPaused = false;
      state.speedupFlashTimer = 30;
    }
  });

  // 2. Pause Button
  drawButton(pauseBtnX, pauseBtnY, btnSize, btnSize, state.isPaused ? '▶' : '❚❚', {
    id: 'btn_pause',
    variant: state.isPaused ? 'red' : 'dark',
    fontSize: 14,
    radius: 12,
    depth3D: 3,
    onClick: () => {
      state.isPaused = !state.isPaused;
      state.speedupFlashTimer = 30;
    }
  });

  // 3. Menu / BackToEdit Button
  if (state.isEditorPlaytest) {
    const editBtnW = 92;
    const editBtnX = width - btnMargin - btnSize * 2 - btnMargin * 2 - editBtnW;
    drawCyanButton(editBtnX, btnMargin, editBtnW, btnSize, 'BACK TO EDIT', {
      id: 'btn_back_to_edit',
      fontSize: 10,
      radius: 12,
      depth3D: 3,
      onClick: () => {
        if (state.levelEditorCache) {
          startLevelEditor();
          restoreLevelFromCache(state.levelEditorCache);
        } else {
          startLevelEditor();
        }
        state.isEditorPlaytest = false;
      }
    });
  } else {
    const menuBtnW = 56;
    const menuBtnX = width - btnMargin - btnSize * 3 - btnMargin * 2 - 12;
    drawDarkButton(menuBtnX, btnMargin, menuBtnW, btnSize, 'MENU', {
      id: 'btn_menu',
      fontSize: 12,
      radius: 12,
      depth3D: 3,
      onClick: () => {
        state.currentScreen = 'main_menu';
      }
    });
  }

  pop();
}

export function handleGameSpeedButtonClick(): boolean {
  return false;
}


import { state } from '../../state';
import { drawCloseButton } from '../../uiComponents';
import { drawTurretList } from './turretList';
import { drawTurretInfoPanel } from './turretInfoPanel';
import { drawTurretUnlockButton, isTurretUnlockAvailable } from './turretUnlockButton';
import { drawUpgradeSelectionPopup } from './upgradeSelectionPopup';
import { drawPlayerUpgradesPanel, handlePlayerUpgradesClick } from './playerUpgradesPanel';
import { drawLevelConfigPanel, handleLevelConfigClick } from './levelConfigPanel';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const width: any;
declare const height: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseIsPressed: any;
declare const dist: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const LEFT: any;
declare const imageMode: any;
declare const image: any;
declare const tint: any;
declare const noTint: any;
declare const floor: any;
declare const ellipse: any;
declare const textWidth: any;

export function drawAlmanac() {
  if (!state.isAlmanacOpen) return;

  // Responsive sizing
  const modalW = Math.min(1050, width * 0.9);
  const modalH = Math.min(650, height * 0.9);
  const x = (width - modalW) / 2+30;
  const y = (height - modalH) / 2;


  // Background Overlay
  push();
  noStroke();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  pop();

  // Main Modal Container
  push();
  translate(x, y);

  // Tabs (Left Side)
  drawTabs(-70, 60, x, y);

  
  // Outer Border & Main Background
  stroke(54, 62, 114);
  strokeWeight(6);
  fill(27, 31, 57);
  rect(0, 0, modalW, modalH, 40);

  // Layout proportions
  const leftPanelW = modalW * 0.6;
  const rightPanelW = modalW - leftPanelW - 40;

  // --- Resource Bar / Editor Mode Title (Top of Left Panel) ---
  const resBarY = 15;
  const resXStart = 40;

  if (state.isAlmanacEditorMode) {
    if (state.almanacTab !== 'Upgrades' && state.almanacTab !== 'LevelConfig') {
      push();
      fill(12, 15, 30, 220);
      stroke(100, 70, 180);
      strokeWeight(1.5);
      rect(resXStart - 15, resBarY - 2, leftPanelW - 40, 32, 8);
      noStroke();
      fill(255, 230, 120);
      textAlign(LEFT, CENTER);
      textSize(11.5);
      text("ALMANAC CONFIG: Available ➔ Locked ➔ NeedDiscovery [?] ➔ Banned [x]", resXStart, resBarY + 14);
      pop();
    }
  } else {
    const iconSize = 32;
    const padding = -2;     // space between icon and text, the resource img has a lot of spaces itself
    const itemGap = 4;     // space between resources

    const allResources = [
      { key: 'sun', icon: 'img_icon_sun', val: state.sunCurrency },
      { key: 'elixir', icon: 'img_icon_elixir', val: state.elixirCurrency },
      { key: 'soil', icon: 'img_icon_soil', val: state.soilCurrency },
      { key: 'raisin', icon: 'img_icon_raisin', val: state.raisinCurrency },
      { key: 'leaf', icon: 'img_icon_leaf', val: state.leafCurrency },
      { key: 'shard', icon: 'img_icon_shard', val: state.shardCurrency },
      { key: 'shell', icon: 'img_icon_shell', val: state.shellCurrency },
      { key: 'fuel', icon: 'img_icon_fuel', val: state.fuelCurrency },
      { key: 'ice', icon: 'img_icon_ice', val: state.iceCurrency },
    ];

    // Only show resources the player has at least one of
    const resources = allResources.filter(r => r.val > 0);

    push();
    imageMode(CENTER);
    textAlign(LEFT, CENTER);
    textSize(16);

    // Calculate total width first (for background pill)
    let totalW = 10;
    for (let res of resources) {
      const valText = floor(res.val).toString();
      const textW = textWidth(valText);
      totalW += iconSize + padding + textW + itemGap;
    }

    // Draw pill
    if (resources.length > 0) {
      fill(0);
      noStroke();
      rect(resXStart - 15, resBarY, totalW, 28, 12);

      let cursorX = resXStart;

      for (let res of resources) {
        const ry = resBarY + 14;
        const valText = floor(res.val).toString();
        const textW = textWidth(valText);

        image(state.assets[res.icon], cursorX, ry, iconSize, iconSize);

        fill(255);
        text(valText, cursorX + iconSize/2 + padding, ry + 2);

        cursorX += iconSize + padding + textW + itemGap;
      }
    }

    pop();
  }
  
  // Draw Content Based on Selected Tab
  if (state.almanacTab === 'LevelConfig') {
    drawLevelConfigPanel(20, 50, modalW - 40, modalH - 70, x, y);
  } else if (state.almanacTab === 'Upgrades') {
    drawPlayerUpgradesPanel(20, 50, modalW - 40, modalH - 70, x, y);
  } else {
    // Left Panel: Turret Grid Area
    push();
    translate(20, 50);
    fill(15, 18, 35, 150);
    noStroke();
    rect(0, 0, leftPanelW - 20, modalH - 70, 25);
    drawTurretList(10, 10, leftPanelW - 20, modalH - 80, x + 20, y + 60);
    pop();

    // Right Panel: Turret Details
    const rightX = leftPanelW + 20;
    const showUnlock = isTurretUnlockAvailable();
    const unlockH = showUnlock ? 180 : 0;
    const infoH = showUnlock ? ((modalH) - unlockH - 20) : (modalH - 70);
    
    drawTurretInfoPanel(rightX, 20, rightPanelW, infoH, x, y);

    // Bottom Right Unlock Area
    if (showUnlock) {
      drawTurretUnlockButton(rightX, 5 + infoH, rightPanelW, unlockH, x, y);
    }
  }

  // Upgrade Selection Popup (Overlays everything in Almanac)
  if (state.upgradeSelection) {
    drawUpgradeSelectionPopup(modalW, modalH);
  }

  pop();

  // Close Button (Rendered on top in absolute screen coordinates)
  if (!state.upgradeSelection) {
    drawCloseButton(x + modalW - 46, y + 16, 34, () => closeAlmanac(), { layer: 150 });
  }
}

function drawTabs(x: number, y: number, modalX: number, modalY: number) {
  const tabW = 100;
  const tabH = 60;
  const tabs = [
    { id: 'Turrets', icon: 'img_icon_almanac' },
    // { id: 'Enemies', icon: 'img_npc_shadie_front' },
    { id: 'Upgrades', icon: 'img_icon_playerupgrade' }
  ];

  if (state.isAlmanacEditorMode || state.currentScreen === 'level_editor') {
    tabs.push({ id: 'LevelConfig', icon: 'img_icon_sun' });
  }

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const tx = x;
    const ty = y + i * (tabH + 20);
    const isSel = state.almanacTab === tab.id;
    const hov = mouseX > modalX + tx && mouseX < modalX + tx + tabW && mouseY > modalY + ty && mouseY < modalY + ty + tabH;

    push();
    translate(tx, ty);
    
    // Shadow/Glow for active tab
    noStroke();
    fill(0, 0, 0, 255);
    rect(0, 8, tabW, tabH, 20);
    
    if (isSel) {
      noStroke();
      fill(54,62,114);
    } else if (hov) {
      stroke(255, 230, 160);
      strokeWeight(4);
      fill(40, 45, 80);
    } else {
      stroke(54,62,114);
      strokeWeight(4);
      fill(19,21,44);
    }
    
    rect(0, 0, tabW, tabH, 20);
    
    if (tab.id === 'LevelConfig') {
      fill(255, 215, 60);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(11);
      text("LEVEL\nCONFIG", tabW / 2 - 10, tabH / 2);
    } else {
      const icon = state.assets[tab.icon] || state.assets['img_basic'];
      if (icon) {
        imageMode(CENTER);
        if (!isSel) tint(255, 150);
        image(icon, tabW/2-10, tabH/2-10, 64, 64);
        noTint();
      }
    }
    
    pop();

    if (hov && mouseIsPressed && !state.upgradeSelection) {
      state.almanacTab = tab.id;
      (window as any).mouseIsPressed = false;
    }
  }
}

export function closeAlmanac() {
  state.isAlmanacOpen = false;
  state.isPaused = false;
  state.isAlmanacEditorMode = false;
  state.suppressGameplayMouseUntilRelease = true;
  state.touchStartPos = null;
  state.touchInputVec = { x: 0, y: 0 };
  state.playerSpeedMultiplier = 0;
  state.draggedTurretType = null;
  state.draggedTurretInstance = null;
  state.isCurrentlyDragging = false;
  if (state.player) state.player.isClickHolding = false;
  if (state.levelEditor) state.levelEditor.isWorldDragActive = false;
  (window as any).mouseIsPressed = false;
}

export function handleAlmanacClick(): boolean {
  if (!state.isAlmanacOpen) return false;
  if (state.upgradeSelection) return true; // Block interaction if upgrade selection is open
  
  const modalW = Math.min(1050, width * 0.9);
  const modalH = Math.min(650, height * 0.9);
  const x = (width - modalW) / 2 + 30;
  const y = (height - modalH) / 2;

  // Handle Level Config click
  if (state.almanacTab === 'LevelConfig') {
    if (handleLevelConfigClick(mouseX, mouseY, x, y, modalW, modalH)) {
      return true;
    }
  }

  // Handle Player Upgrades click
  if (state.almanacTab === 'Upgrades') {
    if (handlePlayerUpgradesClick(mouseX, mouseY, x, y, modalW, modalH)) {
      return true;
    }
  }

  // Check if click is outside modal to close
  const tabsX = x - 70;
  if (mouseX < tabsX || mouseX > x + modalW || mouseY < y || mouseY > y + modalH) {
    closeAlmanac();
    return true;
  }

  return true; // Consume click if almanac is open
}

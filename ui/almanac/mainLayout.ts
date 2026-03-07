
import { state } from '../../state';
import { drawTurretList } from './turretList';
import { drawTurretInfoPanel } from './turretInfoPanel';
import { drawTurretUnlockButton } from './turretUnlockButton';

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

  // --- Resource Bar (Top of Left Panel) ---
  const resBarY = 15;
  const resSpacing = 65; // Tighter spacing
  const resXStart = 40;
  const allResources = [
    { key: 'sun', icon: 'img_icon_sun', val: state.sunCurrency, color: [255, 230, 50] },
    { key: 'elixir', icon: 'img_icon_elixir', val: state.elixirCurrency, color: [200, 100, 255] },
    { key: 'soil', icon: 'img_icon_soil', val: state.soilCurrency, color: [220, 160, 100] },
    { key: 'raisin', icon: 'img_icon_raisin', val: state.raisinCurrency, color: [255, 150, 50] },
    { key: 'leaf', icon: 'img_icon_leaf', val: state.leafCurrency, color: [100, 255, 100] },
    { key: 'shard', icon: 'img_icon_shard', val: state.shardCurrency, color: [50, 200, 255] },
    { key: 'shell', icon: 'img_icon_shell', val: state.shellCurrency, color: [200, 200, 220] },
    { key: 'fuel', icon: 'img_icon_fuel', val: state.fuelCurrency, color: [255, 100, 20] },
    { key: 'ice', icon: 'img_icon_ice', val: state.iceCurrency, color: [150, 240, 255] },
  ];

  // Only show resources the player has at least one of
  const resources = allResources.filter(r => r.val > 0);

  push();
  imageMode(CENTER);
  textAlign(LEFT, CENTER);
  textSize(16);
  
  // Draw a single dark pill for all resources
  if (resources.length > 0) {
    const totalW = resources.length * resSpacing + 10;
    fill(0);
    noStroke();
    rect(resXStart - 15, resBarY, totalW, 28, 12);

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      const rx = resXStart + i * resSpacing;
      const ry = resBarY + 14;
      
      image(state.assets[res.icon], rx, ry, 32, 32);
      fill(255); // Use white for numbers as in the image
      text(floor(res.val), rx + 15, ry + 2);
    }
  }
  pop();
  
  // Layout proportions
  const leftPanelW = modalW * 0.6;
  const rightPanelW = modalW - leftPanelW - 40;
  
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
  const unlockH = 180; // Fixed height for unlock area
  const infoH = (modalH) - unlockH - 20; // Remaining space minus padding
  
  drawTurretInfoPanel(rightX, 20, rightPanelW, infoH, x, y);

  // Bottom Right Unlock Area
  drawTurretUnlockButton(rightX, 5 + infoH, rightPanelW, unlockH, x, y);

  // Close Button
  drawCloseButton(modalW - 40, 20, x, y);


  pop();
}

function drawTabs(x: number, y: number, modalX: number, modalY: number) {
  const tabW = 100;
  const tabH = 60;
  const tabs = [
    { id: 'Turrets', icon: 'img_npc_farmer_front' },
    { id: 'Enemies', icon: 'img_npc_shadie_front' },
    { id: 'Upgrades', icon: 'img_player_front_right' }
  ];

  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const tx = x;
    const ty = y + i * (tabH + 30);
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
    
    const icon = state.assets[tab.icon] || state.assets['img_basic'];
    if (icon) {
      imageMode(CENTER);
      if (!isSel) tint(255, 150);
      image(icon, tabW/2-10, tabH/2-10, 104, 104);
      noTint();
    }
    
    pop();

    if (hov && mouseIsPressed) {
      state.almanacTab = tab.id;
      (window as any).mouseIsPressed = false;
    }
  }
}

function drawCloseButton(x: number, y: number, modalX: number, modalY: number) {
  const size = 45;
  const hov = dist(mouseX, mouseY, modalX + x, modalY + y) < size / 2;

  push();
  translate(x, y);
  fill(hov ? [255, 100, 100] : [200, 50, 50]);
  noStroke();
  ellipse(0, 0, size);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("X", 0, 0);
  pop();

  if (hov && mouseIsPressed) {
    state.isAlmanacOpen = false;
    state.isPaused = false;
    (window as any).mouseIsPressed = false;
  }
}

export function handleAlmanacClick(): boolean {
  if (!state.isAlmanacOpen) return false;
  
  const modalW = Math.min(1050, width * 0.9);
  const modalH = Math.min(650, height * 0.9);
  const x = (width - modalW) / 2-60;
  const y = (height - modalH) / 2;

  // Check if click is outside modal to close
  if (mouseX < x || mouseX > x + modalW + 60 || mouseY < y || mouseY > y + modalH) {
    state.isAlmanacOpen = false;
    state.isPaused = false;
    return true;
  }

  return true; // Consume click if almanac is open
}


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
  const x = (width - modalW) / 2;
  const y = (height - modalH) / 2 + 15;

  // Background Overlay
  push();
  noStroke();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  pop();

  // Main Modal Container
  push();
  translate(x, y);
  
  // Outer Border & Main Background
  stroke(54, 62, 114);
  strokeWeight(6);
  fill(27, 31, 57);
  rect(0, 0, modalW, modalH, 40);
  
  // Layout proportions
  const leftPanelW = modalW * 0.6;
  const rightPanelW = modalW - leftPanelW - 40;
  
  // Left Panel: Turret Grid Area
  push();
  translate(20, 60);
  fill(15, 18, 35, 150);
  noStroke();
  rect(0, 0, leftPanelW - 20, modalH - 80, 25);
  drawTurretList(10, 10, leftPanelW - 20, modalH - 90, x + 20, y + 100);
  pop();

  // Right Panel: Turret Details
  const rightX = leftPanelW + 20;
  const unlockH = 180; // Fixed height for unlock area
  const infoH = (modalH) - unlockH - 20; // Remaining space minus padding
  
  drawTurretInfoPanel(rightX, 20, rightPanelW, infoH, x, y);

  // Bottom Right Unlock Area
  drawTurretUnlockButton(rightX, 5 + infoH, rightPanelW, unlockH, x, y);

  // Tabs
  drawTabs(40, -40);

  // Close Button
  drawCloseButton(modalW - 40, 20, x, y);

  pop();
}

function drawTabs(x: number, y: number) {
  const tabW = 120;
  const tabH = 70;
  
  // Plant Tab (Active)
  push();
  translate(x, y);
  
  // Shadow/Glow for active tab
  noStroke();
  fill(0, 0, 0, 50);
  rect(5, 15, tabW, tabH, 30);
  
  stroke(50, 200, 100);
  strokeWeight(4);
  fill(20, 60, 40);
  rect(0, 10, tabW, tabH, 30);
  
  const plantIcon = state.assets['img_npc_farmer_front'];
  if (plantIcon) {
    imageMode(CENTER);
    image(plantIcon, tabW/2, tabH/2, 140, 140);
  }
  pop();

  // Enemy Tab (Inactive)
  push();
  translate(x + tabW + 20, y);
  
  noStroke();
  fill(0, 0, 0, 50);
  rect(0, 15, tabW, tabH, 30);
  
  const enemyIcon = state.assets['img_e_basic_front'] || state.assets['img_e_basic'];
  if (enemyIcon) {
    imageMode(CENTER);
    tint(255, 100);
    image(enemyIcon, tabW/2, tabH/2, 140, 140);
    noTint();
  }
  pop();
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
  const x = (width - modalW) / 2;
  const y = (height - modalH) / 2;

  // Check if click is outside modal to close
  if (mouseX < x || mouseX > x + modalW || mouseY < y || mouseY > y + modalH) {
    state.isAlmanacOpen = false;
    state.isPaused = false;
    return true;
  }

  return true; // Consume click if almanac is open
}

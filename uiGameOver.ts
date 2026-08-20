
import { state } from './state';
import { ENEMY_KEYS } from './lvDemo';
import { restoreLevelFromCache } from './levelEditor';

declare const floor: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
// Added missing stroke declaration to resolve TS errors
declare const stroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const LEFT: any;
declare const TOP: any;
declare const width: any;
declare const height: any;
declare const dist: any;
declare const lerp: any;
declare const sin: any;
declare const rectMode: any;
declare const line: any;
declare const image: any;
declare const imageMode: any;
declare const strokeWeight: any;
declare const scale: any;
declare const ellipse: any;
declare const mouseX: any;
declare const mouseY: any;

const MODAL_W = 600;
const MODAL_H = 430;

export function handleGameOverClick(): boolean {
  if (!state.isGameOver || !state.showGameOverPopup) return false;
  
  const mx = width / 2;
  const my = height / 2;
  const closeX = mx + MODAL_W/2 - 40;
  const closeY = my - MODAL_H/2 + 20;

  if (dist(mouseX, mouseY, closeX + 15, closeY + 15) < 20) {
    state.showGameOverPopup = false;
    return true;
  }

  // Check Main Menu / Return Button Click
  const btnW = 190;
  const btnH = 38;
  const btnY = my + MODAL_H/2 - 40;
  if (Math.abs(mouseX - mx) < btnW/2 && Math.abs(mouseY - btnY) < btnH/2) {
    if (state.isEditorPlaytest && state.levelEditorCache) {
      restoreLevelFromCache(state.levelEditorCache);
    } else {
      state.currentScreen = 'main_menu';
    }
    state.isGameOver = false;
    state.showGameOverPopup = false;
    state.isLevelCompleted = false;
    return true;
  }

  return false;
}

export function drawGameOver() {
  const p = state.gameOverProgress || 0;
  if (p < 0.01) return;

  push();
  
  // Dark overlay
  fill(0, p * 150);
  noStroke();
  rect(0, 0, width, height);
  
  const mx = width / 2;
  const my = height / 2;
  
  translate(mx, my);
  scale(lerp(0.8, 1, p));
  
  // Main Panel
  rectMode(CENTER);
  fill(27, 31, 57, p * 255);
  stroke(54, 62, 114, p * 255);
  strokeWeight(6);
  rect(0, 0, MODAL_W, MODAL_H, 30);
  
  // Close Button (X)
  push();
  translate(MODAL_W/2 - 40, -MODAL_H/2 + 20);
  const hovClose = dist(mouseX, mouseY, mx + MODAL_W/2 - 25, my - MODAL_H/2 + 35) < 15;
  fill(hovClose ? [255, 100, 100] : [200, 50, 50], p * 255);
  noStroke();
  ellipse(15, 15, 30);
  fill(255, p * 255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text("X", 15, 15);
  pop();

  // Character Portrait at top
  const character = state.assets['img_player_front_right'];
  if (character) {
    imageMode(CENTER);
    image(character, 0, -MODAL_H/2, 256, 256);
  }
  
  // Title
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(255, 235, 90, p * 255);
  noStroke();
  const titleText = state.isLevelCompleted ? "LEVEL COMPLETED!" : "GAME OVER";
  text(titleText, 0, -MODAL_H/2+10 + 80);
  
  stroke(255, 235, 90, p * 100);
  strokeWeight(1);
  line(-MODAL_W/4, -MODAL_H/2 + 105, MODAL_W/4, -MODAL_H/2 + 105);
  
  // Grid of Stats
  const items = [
    { asset: 'img_icon_sun', val: state.totalSunLootCollected },
    { asset: 'img_icon_elixir', val: state.totalElixirLootCollected },
    { asset: 'img_icon_soil', val: state.totalSoilLootCollected },
    { asset: 'img_t_pea_front', val: state.totalTurretsAcquired }
  ];
  
  // Enemy stats keys
  for (const k of ENEMY_KEYS) {
    if (state.killsByType[k] > 0) {
      items.push({ asset: 'img_' + (k === 'e_swarm' ? 'swarm_center' : k.slice(2)), val: state.killsByType[k] });
    }
  }

  const cols = 7;
  const cellW = 64;
  const cellH = 90;
  const startX = -((cols - 1) * cellW) / 2;
  const startY = -60;

  for (let i = 0; i < items.length; i++) {
    const r = floor(i / cols);
    const c = i % cols;
    const x = startX + c * cellW;
    const y = startY + r * cellH;
    
    const item = items[i];
    const sprite = state.assets[item.asset];
    
    // Icon Slot
    push();
    translate(x, y);
    fill(10, 15, 30, p * 255);
    noStroke();
    rect(0, 10, 56, 76, 15);

    fill(40, 47, 96, p * 255);
    noStroke();
    rect(0, 0, 56, 56, 15);
    
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, 64, 64);
    }

    fill(255, p * 255);
    textSize(14);
    textAlign(CENTER);
    text(item.val, 0, 40);
    pop();
  }
  
  // Return Button
  const isPlaytest = !!state.isEditorPlaytest;
  const btnText = isPlaytest ? "RETURN TO EDITOR" : "MAIN MENU";
  const btnW = 190;
  const btnH = 38;
  const btnY = MODAL_H/2 - 40;
  const hovBtn = Math.abs(mouseX - mx) < btnW/2 && Math.abs(mouseY - (my + btnY)) < btnH/2;

  push();
  translate(0, btnY);
  fill(hovBtn ? [40, 180, 100] : [25, 120, 65], p * 255);
  stroke(hovBtn ? [100, 255, 180] : [50, 200, 120], p * 255);
  strokeWeight(2);
  rect(0, 0, btnW, btnH, 19);

  fill(255, p * 255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text(btnText, 0, 0);
  pop();

  pop();
}

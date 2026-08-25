import { state } from '../state';
import { ENEMY_KEYS } from '../lvDemo';
import { restoreLevelFromCache } from '../levelEditor';
import { drawCloseButton, drawGreenButton, drawCard } from '../uiComponents';
import { color } from '../uiColors';

declare const floor: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
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
declare const tint: any;
declare const noTint: any;
declare const strokeWeight: any;
declare const scale: any;
declare const ellipse: any;
declare const mouseX: any;
declare const mouseY: any;
declare const beginShape: any;
declare const vertex: any;
declare const endShape: any;
declare const CLOSE: any;

const MODAL_W = 600;
const MODAL_H = 430;

export function handleGameOverClick(): boolean {
  if (!state.isGameOver || !state.showGameOverPopup) return false;
  
  const mx = width / 2;
  const my = height / 2;
  const closeX = mx + MODAL_W / 2 - 40;
  const closeY = my - MODAL_H / 2 + 20;

  if (dist(mouseX, mouseY, closeX + 15, closeY + 15) < 20) {
    state.showGameOverPopup = false;
    return true;
  }

  // Check Main Menu / Return Button Click
  const btnW = 200;
  const btnH = 42;
  const btnY = my + MODAL_H / 2 - 44;
  if (Math.abs(mouseX - mx) < btnW / 2 && Math.abs(mouseY - btnY) < btnH / 2) {
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
  fill(0, p * 160);
  noStroke();
  rect(0, 0, width, height);
  
  const mx = width / 2;
  const my = height / 2;
  
  translate(mx, my);
  scale(lerp(0.8, 1, p));
  
  // Main Panel (Almanac Modal Frame Style)
  rectMode(CENTER);
  fill(...color.panelBlue(p * 255));
  stroke(...color.lightBlue(p * 255));
  strokeWeight(6);
  rect(0, 0, MODAL_W, MODAL_H, 30);
  noStroke();
  
  // Close Button (X)
  drawCloseButton(MODAL_W / 2 - 44, -MODAL_H / 2 + 16, 32, () => {
    state.showGameOverPopup = false;
  }, { id: 'gameover_close' });

  // Character Portrait at top
  const character = state.assets['img_player_front_right'];
  if (character) {
    imageMode(CENTER);
    image(character, 0, -MODAL_H / 2, 256, 256);
  }
  
  // Title
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(...color.lightYellow(p * 255));
  noStroke();
  const titleText = state.isLevelCompleted ? "LEVEL COMPLETED!" : "GAME OVER";
  text(titleText, 0, -MODAL_H / 2 + 82);

  // If level completed, show star rating (1-3 stars) unless sandbox/empty
  const isSandboxOrEmpty = state.currentLevelId === 'sandbox' || state.currentLevelId === 'empty' || state.currentLevelLayoutData?.tag === 'sandbox' || state.currentLevelLayoutData?.tag === 'empty';
  if (state.isLevelCompleted && !isSandboxOrEmpty) {
    const earnedStars = state.lastLevelStarsEarned || 0;
    const starSpacing = 32;
    const starY = -MODAL_H / 2 + 104;
    const grapeSprite = state.assets['img_tx_goldengrape_front'];

    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const isStarActive = sIdx < earnedStars;
      const sx = (sIdx - 1) * starSpacing;
      push();
      translate(sx, starY);
      imageMode(CENTER);
      if (isStarActive) {
        if (grapeSprite) {
          image(grapeSprite, 0, 0, 24, 24);
        } else {
          fill(255, 220, 60, p * 255);
          ellipse(0, 0, 18, 18);
        }
      } else {
        if (grapeSprite) {
          tint(70, 80, 120, p * 130);
          image(grapeSprite, 0, 0, 20, 20);
        } else {
          fill(60, 70, 110, p * 180);
          ellipse(0, 0, 14, 14);
        }
      }
      pop();
    }
  }
  
  stroke(...color.lightYellow(p * 100));
  strokeWeight(1);
  const lineY = (state.isLevelCompleted && !isSandboxOrEmpty) ? -MODAL_H / 2 + 120 : -MODAL_H / 2 + 108;
  line(-MODAL_W / 4, lineY, MODAL_W / 4, lineY);
  noStroke();
  
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
    
    // Inset Card Slot
    push();
    translate(x, y);
    fill(...color.veryDarkBlue(p * 255));
    noStroke();
    rect(0, 10, 56, 76, 15);

    fill(...color.blue(p * 255));
    noStroke();
    rect(0, 0, 56, 56, 15);
    
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, 64, 64);
    }

    fill(...color.white(p * 255));
    textSize(14);
    textAlign(CENTER);
    text(item.val, 0, 40);
    pop();
  }
  
  // Return Button
  const isPlaytest = !!state.isEditorPlaytest;
  const btnText = isPlaytest ? "RETURN TO EDITOR" : "MAIN MENU";
  const btnW = 200;
  const btnH = 42;
  const btnY = MODAL_H / 2 - 50;

  drawGreenButton(-btnW / 2, btnY, btnW, btnH, btnText, {
    id: 'gameover_return',
    fontSize: 14,
    radius: 12,
    depth3D: 4,
    onClick: () => {
      if (state.isEditorPlaytest && state.levelEditorCache) {
        restoreLevelFromCache(state.levelEditorCache);
      } else {
        state.currentScreen = 'main_menu';
      }
      state.isGameOver = false;
      state.showGameOverPopup = false;
      state.isLevelCompleted = false;
    }
  });

  pop();
}

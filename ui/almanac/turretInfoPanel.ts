
import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { TYPE_MAP, drawTurretSprite } from '../../assetTurret';
import { GRID_SIZE } from '../../constants';
import { TURRET_RECIPES } from '../../dictionaryTurretMerging';
import { CLASS_ICON_MAP, TURRET_DISPLAY_STATS, DEFAULT_STATS } from '../../UITurretTooltip';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const TOP: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const imageMode: any;
declare const image: any;
declare const rectMode: any;
declare const mouseX: any;
declare const mouseY: any;
declare const floor: any;
declare const frameCount: any;
declare const sin: any;
declare const scale: any;
declare const tint: any;
declare const noTint: any;
declare const constrain: any;
declare const map: any;
declare const ellipse: any;

export function drawTurretInfoPanel(x: number, y: number, w: number, h: number, modalX: number, modalY: number) {
  const key = state.almanacSelectedTurret;
  const tr = turretTypes[key];
  if (!tr) return;

  const isUnlocked = state.unlockedTurrets.includes(key);

  push();
  translate(x, y);

  // Main Detail Panel
  fill(12, 45, 30);
  noStroke();
  rect(0, 0, w, h, 30);
  
  // Header: Name (Centered at top)
  noStroke();
  fill(255);
  textAlign(CENTER, TOP);
  textSize(24); // Smaller
  text(tr.name, w / 2, 15);

  if (!isUnlocked) {
    // Locked State View
    push();
    translate(w / 2, h / 2 - 20);
    
    // Shadow Tint Sprite
    push();
    const isSoft = tr.animationBodyType === 'soft';
    const breatheRate = isSoft ? 0.1 : 0.06;
    const breatheAmp = isSoft ? 0.04 : 0.02;
    const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
    const animScaleX = 1.0 / animScaleY;
    scale(animScaleX * 2.5, animScaleY * 2.5);
    
    const dummyTurret = {
      type: key,
      config: tr,
      angle: 0,
      alpha: 255,
      actionTimers: new Map(),
      flashTimer: 0,
      recoil: 0,
      fireRateMultiplier: 1.0,
      uid: 'almanac_info_locked_' + key
    };
    tint(0, 0, 0, 220);
    drawTurretSprite(dummyTurret);
    noTint();
    pop();
    
    // Unlock Text
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("UNLOCK TO USE", 0, 100);
    pop();
    
    pop();
    return;
  }

  // Top Section: 2 Columns
  const topSectionY = 30; // Tighter
  const leftColW = w * 0.35;
  const rightColX = leftColW;
  const rightColW = w - leftColW;

  // Left Column: Large Sprite Area
  push();
  translate(leftColW / 2, topSectionY + 45);
  
  // Shadow/Glow for the large turret
  noStroke();
  fill(0, 0, 0, 100);
  ellipse(0, 25, 60, 30);
  
  const isSoft = tr.animationBodyType === 'soft';
  const breatheRate = isSoft ? 0.1 : 0.06;
  const breatheAmp = isSoft ? 0.04 : 0.02;
  const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
  const animScaleX = 1.0 / animScaleY;

  scale(animScaleX * 1.6, animScaleY * 1.6); // Slightly smaller than 2x

  const dummyTurret = {
    type: key,
    config: tr,
    angle: 0,
    alpha: 255,
    actionTimers: new Map(),
    flashTimer: 0,
    recoil: 0,
    fireRateMultiplier: 1.0,
    uid: 'almanac_info_' + key
  };
  drawTurretSprite(dummyTurret);
  pop();

  // Right Column: Cost, Recipe, Upgrade
  push();
  translate(rightColX, topSectionY + 20);
  
  // Sun Cost
  noStroke();
  fill(0, 0, 0, 50);
  rect(6, 2, 75, 25, 12);
  imageMode(CENTER);
  image(state.assets['img_icon_sun'], 20, 15, 48, 48);
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(20);
  text(tr.cost, 45, 15);
  
  // Recipe icons
  const recipe = TURRET_RECIPES.find(r => r.id === key);
  const ingredientIcons: string[] = [];
  if (recipe) {
    recipe.ingredients.forEach(ing => ingredientIcons.push(CLASS_ICON_MAP[ing]));
    for (let i = 0; i < recipe.duplicates; i++) ingredientIcons.push(CLASS_ICON_MAP['duplicate']);
  } else if (tr.tier && floor(tr.tier) === 1) {
    ingredientIcons.push(CLASS_ICON_MAP[key]);
  }

  const iconSize = 20;
  const iconSpacing = 25;
  ingredientIcons.forEach((iconKey, idx) => {
    const ix = 110 + idx * iconSpacing;
    const iy = 15;
    
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(ix, iy, iconSize + 4);

    if (iconKey) {
      const iconSprite = state.assets[iconKey];
      if (iconSprite) {
        image(iconSprite, ix, iy, iconSize, iconSize);
      }
    }
  });

  // Upgrade Button (Gold)
  drawUpgradeButton(rightColW / 2 - 15, 60, rightColW, 38, modalX + x + rightColX, modalY + y + topSectionY);
  pop();

  // Bottom Section: Stats Grid and Description
  const statsY = 140; // Tighter
  drawStatsGrid(15, statsY, w - 30, key);

  const descY = 215; // Tighter
  const descH = h - descY - 15;
  drawDescriptionArea(15, descY, w - 30, descH, tr.tooltip || "");

  pop();
}

function drawUpgradeButton(x: number, y: number, w: number, h: number, parentX: number, parentY: number) {
  const screenX = parentX + x;
  const screenY = parentY + y;
  
  const hov = mouseX > screenX - w/2 && mouseX < screenX + w/2 && 
              mouseY > screenY - h/2 && mouseY < screenY + h/2;

  push();
  translate(x, y);
  rectMode(CENTER);
  
  // Shadow
  noStroke();
  fill(0, 0, 0, 225);
  rect(0, 4, w, h, 12);
  
  fill(hov ? [230, 225, 100] : [255, 132, 0]);
  rect(0, 0, w, h, 12);

  fill(hov ? [255, 132, 0] : [255, 195, 0]);
  rect(0, -4, w, h-4, 12);
  
  fill(0);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("Upgrade (WIP)", -w/2 + 15, 0);
  
  // Elixir Cost
  imageMode(CENTER);
  image(state.assets['img_icon_elixir'], w/2 - 65, 0, 22, 22);
  textAlign(LEFT, CENTER);
  textSize(14);
  text("26/600", w/2 - 50, 0);
  
  pop();
}

function drawStatsGrid(x: number, y: number, w: number, type: string) {
  const stats = TURRET_DISPLAY_STATS[type] || DEFAULT_STATS;

  push();
  translate(x, y);
  
  // Background for stats grid
  fill(0, 0, 0, 50);
  noStroke();
  rect(0, 0, w, 65, 12);

  textSize(11);
  const colW = w / 2;
  
  stats.forEach((s, i) => {
    const r = floor(i / 2);
    const c = i % 2;
    const sx = c * colW + 12;
    const sy = r * 18 + 8;
    
    fill(150, 200, 180);
    textAlign(LEFT, TOP);
    text(s.label, sx, sy);
    
    fill(255);
    textAlign(RIGHT, TOP);
    text(s.value, sx + colW - 24, sy);
  });
  pop();
}

function drawDescriptionArea(x: number, y: number, w: number, h: number, desc: string) {
  push();
  translate(x, y);
  
  fill(0, 0, 0, 50);
  rect(0, 0, w, h, 12);
  
  // Handle Scrolling
  const padding = 12;
  const textW = w - padding * 2;
  const textH = h - padding * 2;
  
  // Estimate text height (simple wrap)
  const lineH = 16;
  const charsPerLine = floor(textW / 7);
  const lines = desc.split('\n').reduce((acc, line) => acc + Math.ceil(line.length / charsPerLine), 0);
  const totalTextH = lines * lineH;
  
  const maxScroll = Math.min(0, textH - totalTextH);
  state.almanacInfoScrollVelocity *= 0.92;
  state.almanacInfoScrollY += state.almanacInfoScrollVelocity;
  state.almanacInfoScrollY = constrain(state.almanacInfoScrollY, maxScroll, 0);

  // Clipping for text
  const dc = (window as any).drawingContext;
  dc.save();
  dc.beginPath();
  dc.rect(0, 0, w, h); // Use local coordinates since we already translated
  dc.clip();

  translate(padding, padding + state.almanacInfoScrollY);
  
  fill(200, 230, 210);
  textSize(13);
  textAlign(LEFT, TOP);
  text(desc, 0, 0, textW);
  
  dc.restore();
  
  // Scrollbar
  if (totalTextH > textH) {
    const sbW = 3;
    const sbX = w - 8;
    fill(255, 20);
    rect(sbX, 8, sbW, h - 16, 2);
    const handleH = Math.max(15, (textH / totalTextH) * (h - 16));
    const handleY = maxScroll === 0 ? 8 : map(state.almanacInfoScrollY, 0, maxScroll, 8, h - 8 - handleH);
    fill(50, 200, 100, 120);
    rect(sbX, handleY, sbW, handleH, 2);
  }
  
  pop();
}

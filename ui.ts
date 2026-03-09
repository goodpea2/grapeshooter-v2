
import { state } from './state';
import { HOUR_FRAMES, GRID_SIZE, VERSION, HUD_SAFEZONE } from './constants';
import { turretTypes } from './balanceTurrets';
import { drawDebugPanel, drawWorldGenPreview } from './uiDebug';
import { TYPE_MAP } from './assetTurret';
import { getLightLevel, customDayLightConfig } from './lvDemo';
import { drawNPCPanel } from './uiNpcShop';
import { drawTurretIcon } from './ui/inventory/turretIcon';
import { drawNewTurretTooltip } from './UITurretTooltip';

declare const floor: any;
declare const nf: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const TOP: any;
declare const CENTER: any;
declare const CORNER: any;
declare const BOTTOM: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const ellipse: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const dist: any;
declare const map: any;
declare const lerp: any;
declare const PI: any;
declare const HALF_PI: any;
declare const TWO_PI: any;
declare const arc: any;
declare const sin: any;
declare const cos: any;
declare const rectMode: any;
declare const line: any;
declare const rotate: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const beginShape: any;
declare const vertex: any;
declare const endShape: any;
declare const scale: any;
declare const atan2: any;
declare const constrain: any;
declare const triangle: any;
declare const textWidth: any;

export function getTime() {
  let totalHours = (state.frames / HOUR_FRAMES);
  let day = floor(totalHours / 24) + 1;
  let hour = floor(totalHours % 24);
  let minutes = floor((state.frames % HOUR_FRAMES) / (HOUR_FRAMES / 60));
  let progress = (state.frames % (24 * HOUR_FRAMES)) / (24 * HOUR_FRAMES);
  let lightLevel = getLightLevel(hour);
  return { day, hour, minutes, totalHours, progress, lightLevel };
}

// Helper to get sky tint for UI synchronization
function getSkyTint(mins: number) {
  const keys = [
    { m: 0,    c: [60, 40, 100] },  // Midnight
    { m: 300,  c: [60, 40, 100] },  // 5 AM
    { m: 420,  c: [255, 100, 100] }, // 7 AM Dawn
    { m: 540,  c: [255, 255, 200] }, // 9 AM Day
    { m: 1020, c: [255, 255, 200] }, // 5 PM
    { m: 1140, c: [255, 120, 50] },  // 7 PM Sunset
    { m: 1200, c: [200, 80, 150] },  // 8 PM
    { m: 1260, c: [100, 50, 150] },  // 9 PM
    { m: 1380, c: [60, 40, 100] },   // 11 PM
    { m: 1440, c: [60, 40, 100] }
  ];
  let k1 = keys[0], k2 = keys[keys.length-1];
  for(let i=0; i<keys.length-1; i++) {
    if (mins >= keys[i].m && mins < keys[i+1].m) {
      k1 = keys[i]; k2 = keys[i+1]; break;
    }
  }
  let f = (mins - k1.m) / (k2.m - k1.m);
  return [
    lerp(k1.c[0], k2.c[0], f),
    lerp(k1.c[1], k2.c[1], f),
    lerp(k1.c[2], k2.c[2], f)
  ];
}

export function drawTurretTooltip(t: any, x: number, y: number, isPreview: boolean = false) {
  drawNewTurretTooltip(t, x, y, isPreview);
}

function drawClock(x: number, y: number, alpha: number) {
  const t = getTime();
  const size = 88; 
  const mins = t.hour * 60 + t.minutes;
  const tint = getSkyTint(mins);
  
  push();
  translate(x, y);
  
  noStroke();
  fill(30, 25, 60, alpha);
  ellipse(0, 0, size);
  
  // Highlighting transition zones in the clock
  noFill();
  stroke(120, 60, 200, alpha * 0.4);
  strokeWeight(6);
  for (let h = 0; h < 24; h++) {
    const l = getLightLevel(h);
    if (l === 0) { // Night
        const startAng = (h/24) * TWO_PI - HALF_PI;
        const endAng = ((h+1)/24) * TWO_PI - HALF_PI;
        arc(0, 0, size - 6, size - 6, startAng, endAng);
    }
  }
  
  noFill();
  stroke(20, 15, 45, alpha * 0.5);
  strokeWeight(2);
  ellipse(0, 0, size - 4);

  noStroke();
  fill(255, alpha * 0.15);
  for(let i=0; i<12; i++) {
    let ang = (i / 12) * TWO_PI;
    ellipse(cos(ang)*(size/2-8), sin(ang)*(size/2-8), 3);
  }
  
  push();
  rotate(TWO_PI * t.progress - HALF_PI);
  fill(255, alpha);
  noStroke();
  beginShape();
  vertex(size/2 - 2, 0);
  vertex(size/2 - 12, -4);
  vertex(size/2 - 22, 0);
  vertex(size/2 - 12, 4);
  endShape((window as any).CLOSE);
  pop();
  
  const isNight = t.lightLevel === 0;
  if (isNight) {
    fill(200, 200, 255, alpha);
    ellipse(0, 0, 26);
    fill(30, 25, 60, alpha);
    ellipse(6, -3, 22);
  } else if (t.lightLevel === 1) { // Transition
    fill(255, 150, 50, alpha);
    ellipse(0, 0, 28);
    fill(255, 255, 100, alpha * 0.5);
    ellipse(0, 0, 34);
  } else { // Day
    fill(tint[0], tint[1], tint[2], alpha);
    ellipse(0, 0, 28);
    push();
    rotate(state.frames * 0.005); 
    for(let i=0; i<8; i++) {
      let a = i * PI/4;
      ellipse(cos(a)*20, sin(a)*20, 6, 6);
    }
    pop();
  }
  
  const pillW = 50;
  const pillH = 24;
  rectMode(CENTER);
  fill(20, 15, 40, alpha);
  noStroke();
  rect(-size/2 + 12, -size/2 + 4, pillW, pillH, 8);
  fill(255, alpha);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(`Day ${t.day}`, -size/2 + 12, -size/2 + 4);
  
  textSize(11);
  textAlign(CENTER, TOP);
  fill(255, alpha * 0.8);
  text(`${nf(t.hour, 2)}:${nf(t.minutes, 2)}`, 0, size/2 + 4);
  
  pop();
}

function drawStats(alpha: number) {
  const x = 110; 
  const y = 30;
  
  // Lerp UI scales
  state.uiSunScale = lerp(state.uiSunScale, 1.0, 0.1);
  state.uiElixirScale = lerp(state.uiElixirScale, 1.0, 0.1);
  state.uiSoilScale = lerp(state.uiSoilScale, 1.0, 0.1);

  push();
  noStroke();
  
  // Health Bar
  const hpW = 160;
  const hpH = 26;
  fill(30, 25, 60, alpha);
  rect(x, y, hpW, hpH, 13);
  
  imageMode(CENTER);
  image(state.assets['img_icon_health'], x + 13, y + 13, 50, 50);

  fill(20, 15, 45, alpha * 0.4);
  rect(x + 30, y + 10, 115, 6, 3);
  // Fixed refilling bug by using ?? operator to ensure 0 health evaluates correctly
  const hpRatio = (state.player?.health ?? 100) / (state.player?.maxHealth || 100);
  fill(155, 255, 0, alpha);
  rect(x + 30, y + 10, 115 * hpRatio, 6, 3);
  
  // Currency Row
  const curY = y + 36;
  const pillH = 26;
  const iconSize = 26;
  const gap = 14;
  const padding = 0;

  const currencies = [
    {
      val: state.sunCurrency,
      icon: 'img_icon_sun',
      color: [255, 230, 50],
      scale: state.uiSunScale
    },
    {
      val: state.elixirCurrency,
      icon: 'img_icon_elixir',
      color: [200, 100, 255],
      scale: state.uiElixirScale
    },
    {
      val: state.soilCurrency,
      icon: 'img_icon_soil',
      color: [220, 160, 100],
      scale: state.uiSoilScale
    }
  ];

  push();
  textSize(16);
  textAlign(LEFT, CENTER);

  // Filter active currencies
  const active = currencies.filter(c => c.val > 0);

  // --- Calculate total width ---
  let totalW = padding;

  for (let cur of active) {
    const valText = floor(cur.val).toString();
    const textW = textWidth(valText);

    totalW += iconSize + 6 + textW + gap;
  }

  totalW += padding;

  // --- Draw single pill background ---
  if (active.length > 0) {
    fill(30, 25, 60, alpha);
    rect(x, curY, totalW, pillH, 13);

    let cursorX = x + padding;

    // --- Draw currencies ---
    for (let cur of active) {
      const valText = floor(cur.val).toString();
      const textW = textWidth(valText);

      // icon
      push();
      translate(cursorX + iconSize/2, curY + pillH/2);
      scale(cur.scale);
      image(state.assets[cur.icon], 0, 0, 50, 50);
      pop();

      // text
      fill(cur.color[0], cur.color[1], cur.color[2], alpha);
      text(valText, cursorX + iconSize + 6, curY + pillH/2 + 2);

      cursorX += iconSize + 6 + textW + gap;
    }
  }

  pop();
}

function drawFlyingRaisins() {
  if (!state.flyingRaisins || state.flyingRaisins.length === 0) return;

  push();
  imageMode(CENTER);
  const icon = state.assets['img_icon_raisin'];

  for (let i = state.flyingRaisins.length - 1; i >= 0; i--) {
    const fr = state.flyingRaisins[i];
    fr.progress += 0.01; // Speed of flight

    const curX = lerp(fr.startX, fr.targetX, fr.progress);
    const curY = lerp(fr.startY, fr.targetY, fr.progress);
    
    // Arc effect
    const arcHeight = 100 * sin(fr.progress * PI);
    const drawY = curY - arcHeight;

    if (icon) {
      image(icon, curX, drawY, 60, 60);
    }
    
    fill(100, 225, 100);
    noStroke();

    if (fr.progress >= 1) {
      state.raisinCurrency += fr.value;
      state.flyingRaisins.splice(i, 1);
    }
  }
  pop();
}

function drawFooter() {
  push();
  textAlign(CENTER, BOTTOM);
  textSize(10);
  fill(255, 40);
  noStroke();
  text(VERSION, width / 2, height - 10);
  pop();
}

export function drawUI(spawnFromBudget: Function) {
  drawClock(60, 60, 255);
  drawStats(255);
  drawFlyingRaisins();
  

  state.uiAlpha = lerp(state.uiAlpha, state.isStationary ? 255 : 40, 0.3);
  const shopAlpha = state.uiAlpha;

  const stdList: any[] = [];
  const invList: any[] = [];
  
  // 1. Identify Standard (Infinite/Starting) Turrets
  for (let key in turretTypes) {
    let tr = turretTypes[key];
    const isUnlocked = state.unlockedTurrets.includes(key);
    if (!isUnlocked) continue;

    // Standard Tier 1
    const isTier1 = tr.tier > 0 && tr.tier <= 1.2 && !tr.isSpecial;
    // Starting Specials (Sunflower, Lilypad, etc.) - exclude consumables and special tx_ turrets
    const isStartingSpecial = tr.isSpecial && !key.startsWith('t0_') && !key.startsWith('tx_');

    const isHiddenFromStd = key === 't_lilypad' || key.startsWith('t_farm_');
    if ((isTier1 || isStartingSpecial) && !isHiddenFromStd) {
      stdList.push({key, tr, isInstance: false});
    }
  }

  // 2. Identify Owned Inventory Items (Stacked)
  // We iterate through turretTypes to maintain a consistent order (e.g. by tier/alphabetical)
  for (let key in turretTypes) {
    let tr = turretTypes[key];
    const count = state.inventory.items[key] || 0;
    if (count <= 0) continue;

    // Check if it's already in stdList
    const isUnlocked = state.unlockedTurrets.includes(key);
    const isTier1 = tr.tier > 0 && tr.tier <= 1.2 && !tr.isSpecial;
    const isStartingSpecial = tr.isSpecial && isUnlocked && !key.startsWith('t0_');
    const isHiddenFromStd = key === 't_lilypad' || key.startsWith('t_farm_');

    const isStandard = (isTier1 || isStartingSpecial) && !isHiddenFromStd;

    if (!isStandard) {
      invList.push({key, tr, isInstance: false});
    }
  }

  push();
  const hudXStart = 60;
  const spacing = 75;
  const startY = 160;
  const bottomMargin = -25;
  const maxItemsPerCol = Math.max(1, floor((height - startY - bottomMargin) / spacing));

  let currentX = hudXStart;
  let currentY = startY;
  let itemsInCol = 0;

  // Draw Combined Column(s)
  const combinedList = [...stdList, ...invList];
  let hoveredTooltipData = null;
  for (let item of combinedList) {
    const hovData = drawTurretIcon(item.tr, item.key, currentX, currentY, shopAlpha, item.isInstance);
    if (hovData) hoveredTooltipData = hovData;
    currentY += spacing;
    itemsInCol++;
    if (itemsInCol >= maxItemsPerCol) {
      currentX += spacing;
      currentY = startY;
      itemsInCol = 0;
    }
  }

  // Update uiWidth so world interaction doesn't happen over UI
  // If itemsInCol is 0, it means we just moved currentX forward but haven't used it.
  state.uiWidth = (itemsInCol > 0) ? (currentX + 40) : (currentX - 35);
  pop();

  push();
  let dbgX = width - 110;
  let dbgY = 65; // Moved down by 50px
  let dbgW = 100;
  let dbgH = 30;
  let dbgHov = mouseX > dbgX && mouseX < dbgX + dbgW && mouseY > dbgY && mouseY < dbgY + dbgH;
  fill(state.showDebug ? 80 : 30); if (dbgHov) fill(state.showDebug ? 100 : 50);
  stroke(255, 100); rect(dbgX, dbgY, dbgW, dbgH, 5);
  fill(255); textAlign(CENTER, CENTER); textSize(12); text("Debug", dbgX + dbgW/2, dbgY + dbgH/2);
  if (dbgHov && mouseIsPressed && !state.isAlmanacOpen && !state.showUnlockPopup) { state.showDebug = !state.showDebug; (window as any).mouseIsPressed = false; }
  pop();

  drawDebugPanel(spawnFromBudget);
  drawNPCPanel();
  drawWorldGenPreview();
  drawFooter();

  // Night Warning
  const t = getTime();
  const nightWarningStartFrame = 19.5 * HOUR_FRAMES;
  const currentDayFrames = state.frames % (24 * HOUR_FRAMES);
  
  if (currentDayFrames >= nightWarningStartFrame && currentDayFrames < nightWarningStartFrame + 300) {
    const elapsed = currentDayFrames - nightWarningStartFrame;
    let alpha = 0;
    let yOffset = 0;
    
    if (elapsed < 30) { // Intro (1s)
      alpha = map(elapsed, 0, 30, 0, 255);
      yOffset = map(elapsed, 0, 30, 20, 0);
    } else if (elapsed < 240) { // Wait (3s)
      alpha = 255;
      yOffset = 0;
    } else { // Fade out (1s)
      alpha = map(elapsed, 240, 300, 255, 0);
      yOffset = map(elapsed, 240, 300, 0, -20);
    }

    // Dramatic VFX: Red Vignette
    push();
    noFill();
    stroke(255, 0, 0, (alpha / 255) * (30 + 10 * sin(state.frames * 0.1)));
    strokeWeight(120);
    rectMode(CORNER);
    rect(0, 0, width, height);
    pop();

    push();
    textAlign(CENTER, CENTER);
    textSize(44);
    fill(255, 50, 50, alpha);
    stroke(0, alpha);
    strokeWeight(4);
    text("THE NIGHT IS APPROACHING", width / 2, height / 3 + yOffset);
    
    pop();
  }

  // NPC Indicator
  if (state.npcs && state.npcs.length > 0) {
    for (let npc of state.npcs) {
      if (!state.player) continue;
      const wPos = npc.pos;
      const pPos = state.player.pos;
      const d = dist(pPos.x, pPos.y, wPos.x, wPos.y);
      const d_tiles = d / GRID_SIZE;
      
      // Dynamic Safezone: intersection of HUD_SAFEZONE circle and screen rectangle
      const screenMargin = 40;
      const maxDistCircle = HUD_SAFEZONE * GRID_SIZE;
      const maxDistX = width / 2 - screenMargin;
      const maxDistY = height / 2 - screenMargin;
      
      // For alpha/fading, we use the minimum screen dimension to ensure it appears when off-screen in any direction
      const screenSafeTiles = (Math.min(width, height) / 2 - screenMargin) / GRID_SIZE;

      // Distance-based scaling and fading
      // tileDistance=[0, d_safe-2, d_safe, 32, 48, 52], size=[0,0,1,1,0.5,0.5], alpha=[0,0,255,255,255,0]
      let indSize = 0;
      let indAlpha = 0;

      if (d_tiles < screenSafeTiles - 2) {
        indSize = 0;
        indAlpha = 0;
      } else if (d_tiles < screenSafeTiles) {
        indSize = map(d_tiles, screenSafeTiles - 2, screenSafeTiles, 0, 1);
        indAlpha = map(d_tiles, screenSafeTiles - 2, screenSafeTiles, 0, 255);
      } else if (d_tiles < 32) {
        indSize = 1;
        indAlpha = 255;
      } else if (d_tiles < 48) {
        indSize = map(d_tiles, 32, 48, 1, 0.5);
        indAlpha = 255;
      } else if (d_tiles < 52) {
        indSize = 0.5;
        indAlpha = map(d_tiles, 48, 52, 255, 0);
      } else {
        indSize = 0.5;
        indAlpha = 0;
      }

      if (indAlpha <= 0) continue;

      // Calculate screen position relative to camera
      const screenX = wPos.x - state.cameraPos.x + width / 2;
      const screenY = wPos.y - state.cameraPos.y + height / 2;

      // Constrain to dynamic safezone
      const dx = screenX - width / 2;
      const dy = screenY - height / 2;
      const distToNpc = dist(0, 0, dx, dy);
      
      let indX, indY;
      let isPointing = false;
      
      const constraintScale = Math.min(1, maxDistCircle / distToNpc, maxDistX / Math.abs(dx), maxDistY / Math.abs(dy));
      
      if (constraintScale < 1) {
        indX = width / 2 + dx * constraintScale;
        indY = height / 2 + dy * constraintScale;
        isPointing = true;
      } else {
        indX = screenX;
        indY = screenY;
        isPointing = false;
      }
      
      push();
      translate(indX, indY);
      
      // Pulse effect + distance scaling
      const pulse = 1.0 + 0.05 * sin(state.frames * 0.1);
      scale(pulse * indSize);

      // Box
      rectMode(CENTER);
      fill(30, 25, 60, (indAlpha / 255) * 200);
      stroke(255, 200, 0, indAlpha);
      strokeWeight(2);
      rect(0, 0, 36, 36, 8);

      if (npc.discovered) {
        // Draw NPC asset image
        const sprite = state.assets[`img_${npc.config.assetKey}_front`];
        if (sprite) {
          imageMode(CENTER);
          tint(255, indAlpha);
          image(sprite, 0, -10, 60, 60);
          noTint();
        }
      } else {
        // draw "?""
        fill(255, indAlpha);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(18);
        text("?", 0, 0);
      }

      // Arrow pointing to NPC (if constrained to safezone edge)
      if (isPointing) {
        const angle = atan2(wPos.y - pPos.y, wPos.x - pPos.x);
        rotate(angle);
        fill(255, 200, 0, indAlpha);
        triangle(25, 0, 18, -6, 18, 6);
      }
      pop();
    }
  }

  if (hoveredTooltipData) {
    drawTurretTooltip(hoveredTooltipData, mouseX, mouseY);
  }
}

export function isMouseOverUI() {
  // Almanac UI blocks everything
  if (state.isAlmanacOpen || state.showUnlockPopup) return true;

  // Turret selection/inventory (left panel)
  if (mouseX < state.uiWidth) return true;

  // NPC Panel (right side)
  if (state.activeNPC && mouseX > width - 320) return true; // Assuming NPC panel width is 320px from right

  // Debug Panel (right side)
  if (state.showDebug && mouseX > width - 280) return true; // Assuming Debug panel width is 280px from right

  return false;
}

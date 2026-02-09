
import { state } from './state';
import { HOUR_FRAMES, GRID_SIZE } from './constants';
import { turretTypes } from './balanceTurrets';
import { drawDebugPanel, drawWorldGenPreview } from './uiDebug';

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
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const ellipse: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const dist: any;
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
// Fixed: Added missing p5.js shape function declarations
declare const beginShape: any;
declare const vertex: any;
declare const endShape: any;

export function getTime() {
  let totalHours = (state.frames / HOUR_FRAMES);
  let day = floor(totalHours / 24) + 1;
  let hour = floor(totalHours % 24);
  let minutes = floor((state.frames % HOUR_FRAMES) / (HOUR_FRAMES / 60));
  let progress = (state.frames % (24 * HOUR_FRAMES)) / (24 * HOUR_FRAMES);
  return { day, hour, minutes, totalHours, progress };
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
  const config = t.config || turretTypes[t.type] || t;
  const name = config.name;
  const hp = t.health !== undefined ? `${floor(t.health)}/${floor(t.maxHealth)}` : `${config.health} HP`;
  const dmg = config.actionConfig?.bulletTypeKey ? 10 : (config.actionConfig?.beamDamage || config.actionConfig?.pulseBulletTypeKey ? 45 : 0);
  const rate = config.actionConfig?.shootFireRate || config.actionConfig?.beamFireRate || config.actionConfig?.pulseCooldown || "N/A";
  const desc = config.tooltip || "";
  const isLocked = t.isFrosted === true;

  push();
  const boxW = 180;
  const boxH = 110;
  let tx = x + 20;
  let ty = y + 20;
  if (tx + boxW > width) tx = x - boxW - 20;
  if (ty + boxH > height) ty = y - boxH - 20;

  fill(15, 15, 30, 240);
  noStroke();
  rect(tx, ty, boxW, boxH, 12);

  fill(isPreview ? [255, 255, 150] : 255);
  textAlign(LEFT, TOP);
  textSize(14);
  text(name + (isPreview ? " (PREVIEW)" : ""), tx + 10, ty + 10);
  
  if (isLocked) {
    fill(255, 100, 100);
    textSize(11);
    text("[ FROZEN / LOCKED ]", tx + 10, ty + 26);
  }

  textSize(11);
  fill(180, 200, 255);
  const infoYStart = isLocked ? 42 : 30;
  text(`HP: ${hp}`, tx + 10, ty + infoYStart);
  text(`DMG: ${dmg}`, tx + 10, ty + infoYStart + 15);
  text(`RATE: ${rate}f`, tx + 90, ty + infoYStart + 15);
  
  fill(255, 230, 100);
  textSize(10);
  text(desc, tx + 10, ty + infoYStart + 35, boxW - 20);

  if (isPreview) {
    const cost = config.mergeCost || 0;
    textAlign(RIGHT, TOP);
    fill(255, 80, 80);
    text(`Cost: $${cost}`, tx + boxW - 10, ty + 10);
  }
  pop();
}

function drawTurretIcon(tr: any, key: string, x: number, y: number, alpha: number) {
  const size = 58;
  const canAfford = state.sunCurrency >= tr.cost;
  const lastUsed = state.turretLastUsed[key] || -99999;
  const cooldownFrames = (tr.cooldownHours || 0) * HOUR_FRAMES;
  const onCooldown = state.frames - lastUsed < cooldownFrames;
  const cooldownProgress = onCooldown ? (state.frames - lastUsed) / cooldownFrames : 1;
  
  const hov = dist(mouseX, mouseY, x, y) < size / 2;
  const isSelected = state.selectedTurretType === key || state.draggedTurretType === key;
  
  push();
  translate(x, y);
  
  if (isSelected) {
    noStroke();
    fill(255, 230, 100, alpha);
    ellipse(0, 0, size + 10);
  }
  
  noStroke();
  let bgColor = [40, 80, 200]; 
  if (!canAfford) bgColor = [40, 40, 40]; 
  if (onCooldown) bgColor = [40, 40, 40]; 
  
  fill(bgColor[0], bgColor[1], bgColor[2], alpha * (hov ? 1.0 : 1.0));
  ellipse(0, 0, size);
  
  fill(255, 255, 255, alpha * 0.1);
  ellipse(0, 0, size * 0.8);

  push();
  const visualScale = size / (tr.size * 2.8);
  (window as any).scale(visualScale);
  fill(tr.color[0], tr.color[1], tr.color[2], alpha);
  noStroke();
  ellipse(0, 0, tr.size, tr.size);
  pop();

  if (onCooldown) {
    fill(0, 0, 0, alpha * 0.5);
    ellipse(0, 0, size);
    stroke(255, 255, 255, alpha * 0.8);
    strokeWeight(4);
    noFill();
    const endAngle = -HALF_PI + TWO_PI * cooldownProgress;
    arc(0, 0, size - 4, size - 4, -HALF_PI, endAngle);
  }

  const priceW = 42;
  const priceH = 20;
  const pY = size / 2;
  rectMode(CENTER);
  fill(canAfford ? [40, 80, 200] : [40, 40, 40], alpha);
  noStroke();
  rect(0, pY, priceW, priceH, 10);
  fill(255, alpha);
  textAlign(CENTER, CENTER);
  textSize(12);
  text(`${tr.cost}`, 0, pY - 1);
  pop();

  if (hov && mouseIsPressed && state.isStationary) {
    if (!onCooldown && canAfford) {
      if (state.selectedTurretType === key) {
        state.selectedTurretType = null;
      } else {
        state.selectedTurretType = key;
        state.draggedTurretType = key;
      }
    }
    (window as any).mouseIsPressed = false;
  }
  if (hov) drawTurretTooltip(tr, mouseX, mouseY);
}

function drawClock(x: number, y: number, alpha: number) {
  const t = getTime();
  const size = 88; // Reduced 20% from 110
  const mins = t.hour * 60 + t.minutes;
  const tint = getSkyTint(mins);
  
  push();
  translate(x, y);
  
  // Main Dial
  noStroke();
  fill(30, 25, 60, alpha);
  ellipse(0, 0, size);
  
  // Night Slice (Purple Danger Zone)
  // Night is 21:00 to 04:00
  fill(120, 60, 200, alpha * 0.4);
  const startAng = (21/24) * TWO_PI - HALF_PI;
  const endAng = (4/24) * TWO_PI - HALF_PI;
  arc(0, 0, size - 6, size - 6, startAng, endAng);
  
  // Outer Ring
  noFill();
  stroke(20, 15, 45, alpha * 0.5);
  strokeWeight(2);
  ellipse(0, 0, size - 4);

  // Hour markers
  noStroke();
  fill(255, alpha * 0.15);
  for(let i=0; i<12; i++) {
    let ang = (i / 12) * TWO_PI;
    ellipse(cos(ang)*(size/2-8), sin(ang)*(size/2-8), 3);
  }
  
  // Pointer Arrow
  push();
  rotate(TWO_PI * t.progress - HALF_PI);
  fill(255, alpha);
  noStroke();
  // Diamond pointer
  beginShape();
  vertex(size/2 - 2, 0);
  vertex(size/2 - 12, -4);
  vertex(size/2 - 22, 0);
  vertex(size/2 - 12, 4);
  endShape((window as any).CLOSE);
  pop();
  
  // Center Sun/Moon Icon
  const isNight = (t.hour >= 21 || t.hour < 4);
  if (isNight) {
    fill(200, 200, 255, alpha);
    ellipse(0, 0, 26);
    fill(30, 25, 60, alpha);
    ellipse(6, -3, 22);
  } else {
    // Slower rotating sun with sky tint
    fill(tint[0], tint[1], tint[2], alpha);
    ellipse(0, 0, 28);
    push();
    rotate(state.frames * 0.005); // Slower rotation
    for(let i=0; i<8; i++) {
      let a = i * PI/4;
      ellipse(cos(a)*20, sin(a)*20, 6, 6);
    }
    pop();
  }
  
  // Day Counter with Background
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
  
  // Digital Time
  textSize(11);
  textAlign(CENTER, TOP);
  fill(255, alpha * 0.8);
  text(`${nf(t.hour, 2)}:${nf(t.minutes, 2)}`, 0, size/2 + 4);
  
  pop();
}

function drawStats(alpha: number) {
  const x = 110; // Nudged left to fit smaller clock
  const y = 30;
  
  push();
  noStroke();
  
  // Health Bar (Always Visible)
  const hpW = 160;
  const hpH = 26;
  fill(30, 25, 60, alpha);
  rect(x, y, hpW, hpH, 13);
  fill(255, 60, 100, alpha);
  ellipse(x + 13, y + 13, 18);
  fill(20, 15, 45, alpha * 0.4);
  rect(x + 30, y + 10, 115, 6, 3);
  const hpRatio = (state.player?.health || 100) / (state.player?.maxHealth || 100);
  fill(255, 60, 100, alpha);
  rect(x + 30, y + 10, 115 * hpRatio, 6, 3);
  
  // Sun Bank (Always Visible)
  const sunY = y + 36;
  fill(30, 25, 60, alpha);
  rect(x, sunY, 110, hpH, 13);
  fill(255, 220, 50, alpha);
  ellipse(x + 13, sunY + 13, 18);
  textAlign(LEFT, CENTER);
  textSize(16);
  fill(255, 230, 50, alpha);
  text(floor(state.sunCurrency), x + 30, sunY + 13);
  pop();
}

export function drawUI(spawnFromBudget: Function) {
  // Main HUD is always visible
  drawClock(60, 60, 255);
  drawStats(255);

  // Turret HUD still fades when moving
  state.uiAlpha = lerp(state.uiAlpha, state.isStationary ? 255 : 40, 0.3);
  const shopAlpha = state.uiAlpha;

  push();
  const hudXStart = 60;
  let hudY = 160;
  const spacing = 75;
  for (let key in turretTypes) {
    let tr = turretTypes[key]; 
    if (tr.tier > 1) continue; 
    drawTurretIcon(tr, key, hudXStart, hudY, shopAlpha);
    hudY += spacing;
  }
  pop();

  push();
  let dbgX = width - 110;
  let dbgY = 15;
  let dbgW = 100;
  let dbgH = 30;
  let dbgHov = mouseX > dbgX && mouseX < dbgX + dbgW && mouseY > dbgY && mouseY < dbgY + dbgH;
  fill(state.showDebug ? 80 : 30); if (dbgHov) fill(state.showDebug ? 100 : 50);
  stroke(255, 100); rect(dbgX, dbgY, dbgW, dbgH, 5);
  fill(255); textAlign(CENTER, CENTER); textSize(12); text("Debug", dbgX + dbgW/2, dbgY + dbgH/2);
  if (dbgHov && mouseIsPressed) { state.showDebug = !state.showDebug; (window as any).mouseIsPressed = false; }
  pop();

  drawDebugPanel(spawnFromBudget);
  drawWorldGenPreview();
}

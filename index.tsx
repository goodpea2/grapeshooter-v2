
import { state } from './state';
import { 
  GRID_SIZE, HEX_DIST, MAX_VFX, HOUR_FRAMES, CHUNK_SIZE
} from './constants';
import { turretTypes } from './balanceTurrets';
import { findMergeResult } from './dictionaryTurretMerging';
import { enemyTypes } from './balanceEnemies';
import { WorldManager } from './world';
import { Player, Enemy, AttachedTurret, SunLoot } from './entities';
import { getTime, drawUI, drawTurretTooltip } from './ui';
import { drawWorldGenPreview } from './uiDebug';
import { updateGameSystems, spawnFromBudget } from './lvDemo';
import { MergeVFX } from './vfx';
import { ASSETS } from './assets';

declare const p5: any;
declare const createCanvas: any;
declare const windowWidth: any;
declare const windowHeight: any;
declare const background: any;
declare const lerp: any;
declare const width: any;
declare const height: any;
declare const mouseX: any;
declare const mouseY: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const createVector: any;
declare const image: any;
declare const noFill: any;
declare const stroke: any;
declare const ellipse: any;
declare const fill: any;
declare const dist: any;
declare const round: any;
declare const abs: any;
declare const sqrt: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const createGraphics: any;
declare const line: any;
declare const strokeWeight: any;
declare const mouseIsPressed: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const rectMode: any;
declare const textWidth: any;
declare const color: any;
declare const lerpColor: any;
declare const rotate: any;
declare const loadImage: any;

function getHexAxial(x: number, y: number) {
  let q = (2/3 * x) / HEX_DIST; let r = (-1/3 * x + sqrt(3)/3 * y) / HEX_DIST;
  let x_ = q; let y_ = -q - r; let z_ = r;
  let rx = round(x_); let ry = round(y_); let rz = round(z_);
  let dx = abs(rx - x_); let dy = abs(ry - y_); let dz = abs(rz - z_);
  if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
  return { q: rx, r: rz };
}

function axialToWorld(q: number, r: number) { 
  return createVector(HEX_DIST * (3/2 * q), HEX_DIST * (sqrt(3)/2 * q + sqrt(3) * r)); 
}

function isAdjacent(q: number, r: number) {
  const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
  for (let [dq, dr] of neighbors) {
    let nq = q + dq;
    let nr = r + dr;
    if (nq === 0 && nr === 0) return true;
    if (state.player.attachments.some((a: any) => a.hq === nq && a.hr === nr)) return true;
  }
  return false;
}

function drawGlobalLighting() {
  let t = getTime();
  let mins = t.hour * 60 + t.minutes;
  
  const keys = [
    { m: 0,    c: [15, 10, 50, 128] },
    { m: 300,  c: [15, 10, 50, 128] },
    { m: 420,  c: [120, 40, 60, 64] },
    { m: 540,  c: [0, 0, 0, 0] },
    { m: 1020, c: [0, 0, 0, 0] },
    { m: 1140, c: [180, 50, 20, 32] },
    { m: 1200, c: [130, 35, 60, 64] },
    { m: 1260, c: [80, 20, 100, 128] },
    { m: 1380, c: [15, 10, 50, 128] },
    { m: 1440, c: [15, 10, 50, 128] }
  ];

  let k1 = keys[0], k2 = keys[keys.length-1];
  for(let i=0; i<keys.length-1; i++) {
    if (mins >= keys[i].m && mins < keys[i+1].m) {
      k1 = keys[i]; k2 = keys[i+1]; break;
    }
  }

  let f = (mins - k1.m) / (k2.m - k1.m);
  let r = lerp(k1.c[0], k2.c[0], f);
  let g = lerp(k1.c[1], k2.c[1], f);
  let b = lerp(k1.c[2], k2.c[2], f);
  let a = lerp(k1.c[3], k2.c[3], f);

  if (a > 1) { 
    push(); 
    noStroke(); 
    fill(r, g, b, a); 
    rect(0, 0, width, height); 
    pop(); 
  }
}

(window as any).preload = () => {
  state.assets = {};
  for (const [key, url] of Object.entries(ASSETS)) {
    state.assets[key] = loadImage(url);
  }
};

(window as any).setup = () => {
  createCanvas(windowWidth, windowHeight);
  state.world = new WorldManager(); 
  state.player = new Player(0, 0); 
  state.cameraPos = createVector(0, 0);
  state.deathVisualsBuffer = createGraphics(8000, 8000);
  state.deathVisualsBuffer.pixelDensity(1);
};

(window as any).draw = () => {
  background(10, 10, 25); 
  state.frames++;
  updateGameSystems();

  state.cameraPos.x = lerp(state.cameraPos.x, state.player.pos.x, 0.08); 
  state.cameraPos.y = lerp(state.cameraPos.y, state.player.pos.y, 0.08);
  
  push(); 
  translate(width/2 - state.cameraPos.x, height/2 - state.cameraPos.y);
  
  let bgCol = [20, 20, 40];
  if (state.currentChunkLevel >= 3) bgCol = [40, 20, 60];
  if (state.currentChunkLevel >= 6) bgCol = [60, 10, 30];
  
  push();
  noStroke();
  fill(bgCol[0], bgCol[1], bgCol[2], 50);
  rect(state.cameraPos.x - width, state.cameraPos.y - height, width*2, height*2);
  pop();

  image(state.deathVisualsBuffer, -4000, -4000);
  state.world.update(state.player.pos); 
  state.world.display(state.player.pos);
  
  for (let i = state.trails.length - 1; i >= 0; i--) { 
    state.trails[i].update(); 
    state.trails[i].display(); 
    if (state.trails[i].isDone()) state.trails.splice(i, 1); 
  }

  for (let l of state.loot) l.display();
  for (let i = state.bullets.length - 1; i >= 0; i--) { state.bullets[i].update(); state.bullets[i].display(); if (state.bullets[i].life <= 0) state.bullets.splice(i, 1); }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) { state.enemyBullets[i].update(); state.enemyBullets[i].display(); if (state.enemyBullets[i].life <= 0) state.enemyBullets.splice(i, 1); }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { state.groundFeatures[i].update(); state.groundFeatures[i].display(); if (state.groundFeatures[i].life <= 0) state.groundFeatures.splice(i, 1); }
  
  state.player.displayAttachments(true);

  for (let i = state.enemies.length - 1; i >= 0; i--) { state.enemies[i].update(state.player.pos, state.player.attachments); state.enemies[i].display(); if (state.enemies[i].health <= 0 || state.enemies[i].markedForDespawn) state.enemies.splice(i, 1); }
  for (let i = state.vfx.length - 1; i >= 0; i--) { state.vfx[i].update(); state.vfx[i].display(); if (state.vfx[i].isDone()) state.vfx.splice(i, 1); }
  
  state.player.update(); state.player.display();

  const mWorld = createVector(mouseX - width/2 + state.cameraPos.x, mouseY - height/2 + state.cameraPos.y);
  
  state.hoveredTurretInstance = null;
  if (mouseX > state.uiWidth || !state.isStationary) {
    for (let t of state.player.attachments) {
      if (dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) {
        state.hoveredTurretInstance = t;
        break;
      }
    }
  }

  if (state.hoveredTurretInstance) {
    const t = state.hoveredTurretInstance;
    const wPos = t.getWorldPos();
    
    push();
    noFill();
    stroke(255, 255, 100, 150 + sin(frameCount * 0.15) * 100);
    strokeWeight(4);
    ellipse(wPos.x, wPos.y, t.size + 8);
    
    if (t.target && state.isStationary) {
      const tc = t.getTargetCenter();
      if (tc) {
        stroke(255, 0, 0, 180);
        strokeWeight(1);
        line(wPos.x, wPos.y, tc.x, tc.y);
        
        push();
        translate(tc.x, tc.y);
        rotate(frameCount * 0.05);
        noFill();
        stroke(255, 0, 0, 255);
        strokeWeight(2);
        const cs = 10;
        line(-cs, 0, cs, 0);
        line(0, -cs, 0, cs);
        ellipse(0, 0, cs * 1.5);
        pop();
      }
    }
    
    const range = t.config.actionConfig?.shootRange || t.config.actionConfig?.beamMaxLength || t.config.actionConfig?.pulseTriggerRadius || 0;
    if (range > 0) {
      noFill();
      stroke(255, 200, 50, 120);
      strokeWeight(2);
      ellipse(wPos.x, wPos.y, range * 2);
    }
    pop();
  }

  const activePlacementType = state.draggedTurretType || state.selectedTurretType;
  state.mergeTargetPreview = null;

  if (state.isStationary && (activePlacementType || state.draggedTurretInstance)) {
    const draggingIngredients = state.draggedTurretInstance 
      ? state.draggedTurretInstance.baseIngredients 
      : (activePlacementType ? [activePlacementType] : []);
    
    if (activePlacementType && !state.draggedTurretInstance) {
      let h = getHexAxial(mWorld.x - state.player.pos.x, mWorld.y - state.player.pos.y);
      let snapped = axialToWorld(h.q, h.r).add(state.player.pos);
      
      let occ = (h.q === 0 && h.r === 0);
      for(let a of state.player.attachments) if(a.hq === h.q && a.hr === h.r) occ = true;
      let adj = isAdjacent(h.q, h.r);
      if (state.world.isBlockAt(snapped.x, snapped.y)) adj = false;

      let valid = !occ && adj && dist(0, 0, h.q, h.r) < 8;

      const rangeLimit = 8;
      for (let q = -rangeLimit; q <= rangeLimit; q++) {
        for (let r = -rangeLimit; r <= rangeLimit; r++) {
          if (abs(q) + abs(r) + abs(-q-r) <= rangeLimit * 2 && isAdjacent(q, r)) {
            let p = axialToWorld(q, r).add(state.player.pos);
            if (state.world.isBlockAt(p.x, p.y)) continue;

            let occupied = (q === 0 && r === 0);
            for(let a of state.player.attachments) if(a.hq === q && a.hr === r) occupied = true;
            if (!occupied) {
              fill(100, 255, 150, 40); noStroke(); ellipse(p.x, p.y, 10, 10);
            }
          }
        }
      }
      
      let tConfig = turretTypes[activePlacementType];
      noFill(); stroke(255, 150); 
      const range = tConfig.actionConfig?.shootRange || tConfig.actionConfig?.beamMaxLength || tConfig.actionConfig?.pulseTriggerRadius || 0;
      if (range > 0) { strokeWeight(2); ellipse(snapped.x, snapped.y, range * 2); }

      fill(valid ? [tConfig.color[0], tConfig.color[1], tConfig.color[2], 180] : [255, 50, 50, 150]); 
      stroke(255, 100);
      if (!state.world.isBlockAt(snapped.x, snapped.y)) {
        ellipse(snapped.x, snapped.y, tConfig.size, tConfig.size);
      }
    }

    for (let t of state.player.attachments) {
      if (state.draggedTurretInstance && t === state.draggedTurretInstance) continue;
      
      const combinedPool = [...draggingIngredients, ...t.baseIngredients];
      const resType = findMergeResult(combinedPool);
      
      if (resType) {
        const isHovered = dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 12;
        const resConfig = turretTypes[resType];
        
        push();
        const pulse = 0.8 + 0.2 * sin(frameCount * 0.2);
        if (t.isFrosted) {
          noStroke(); fill(100, 100, 150, 60);
          ellipse(t.getWorldPos().x, t.getWorldPos().y, t.size + 15);
          fill(255, 100, 100, 150); textAlign(CENTER, CENTER); textSize(10);
          text("LOCKED", t.getWorldPos().x, t.getWorldPos().y + t.size/2 + 10);
        } else {
          noStroke(); fill(255, 255, 100, isHovered ? 150 : (60 * pulse));
          ellipse(t.getWorldPos().x, t.getWorldPos().y, t.size + 15);
          
          rectMode(CENTER);
          fill(20, 20, 40, 220); noStroke();
          let tw = textWidth(`$${resConfig.mergeCost}`) + 16;
          rect(t.getWorldPos().x, t.getWorldPos().y, tw, 22, 6);
          fill(255, 255, 150); textAlign(CENTER, CENTER); textSize(12);
          text(`$${resConfig.mergeCost}`, t.getWorldPos().x, t.getWorldPos().y);

          if (isHovered) {
            const resRange = resConfig.actionConfig?.shootRange || resConfig.actionConfig?.beamMaxLength || resConfig.actionConfig?.pulseTriggerRadius || 0;
            if (resRange > 0) { push(); noFill(); stroke(255, 255, 0, 180); strokeWeight(3); ellipse(t.getWorldPos().x, t.getWorldPos().y, resRange * 2); pop(); }
            state.mergeTargetPreview = { uid: t.uid, type: resType, pos: t.getWorldPos(), cost: resConfig.mergeCost, ingredients: combinedPool };
          }
        }
        pop();
      }
    }
  }

  if (state.draggedTurretInstance && state.isStationary) {
    const dragging = state.draggedTurretInstance;
    const wPos = dragging.getWorldPos();
    stroke(255, 180); strokeWeight(2); line(wPos.x, wPos.y, mWorld.x, mWorld.y);
    fill(dragging.config.color[0], dragging.config.color[1], dragging.config.color[2], 150);
    noStroke(); ellipse(mWorld.x, mWorld.y, dragging.size);
  }
  pop(); 

  drawGlobalLighting();
  drawUI(spawnFromBudget);
  drawWorldGenPreview();

  if (state.hoveredTurretInstance && !state.draggedTurretInstance && !activePlacementType) {
    drawTurretTooltip(state.hoveredTurretInstance, mouseX, mouseY);
  } else if (state.mergeTargetPreview) {
    drawTurretTooltip(state.mergeTargetPreview, mouseX, mouseY, true);
  }
};

(window as any).mousePressed = () => {
  if (mouseX > state.uiWidth && state.isStationary) {
    if (state.selectedTurretType) return;
    const mWorld = createVector(mouseX - width/2 + state.cameraPos.x, mouseY - height/2 + state.cameraPos.y);
    for (let t of state.player.attachments) {
      if (!t.isFrosted && dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) {
        state.draggedTurretInstance = t;
        break;
      }
    }
  }
};

(window as any).mouseReleased = () => {
  const mWorld = createVector(mouseX - width/2 + state.cameraPos.x, mouseY - height/2 + state.cameraPos.y);

  if (state.draggedTurretType || state.selectedTurretType) {
    const activeType = state.draggedTurretType || state.selectedTurretType;
    
    if (state.mergeTargetPreview && state.sunCurrency >= state.mergeTargetPreview.cost) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        state.sunCurrency -= state.mergeTargetPreview.cost;
        const indexToReplace = state.player.attachments.indexOf(target);
        const newTurret = new AttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
        newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
        state.player.attachments[indexToReplace] = newTurret;
        state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y));
        state.turretLastUsed[activeType] = state.frames;
        state.selectedTurretType = null;
        state.draggedTurretType = null;
      }
    } else if (mouseX > state.uiWidth) {
      let h = getHexAxial(mWorld.x - state.player.pos.x, mWorld.y - state.player.pos.y);
      let snapped = axialToWorld(h.q, h.r).add(state.player.pos);
      let occupied = (h.q === 0 && h.r === 0);
      for(let a of state.player.attachments) if(a.hq === h.q && a.hr === h.r) occupied = true;
      let adj = isAdjacent(h.q, h.r);
      if (state.world.isBlockAt(snapped.x, snapped.y)) adj = false;

      if (!occupied && adj && dist(0, 0, h.q, h.r) < 8) { 
        const nt = new AttachedTurret(activeType, state.player, h.q, h.r);
        state.player.attachments.push(nt);
        state.sunCurrency -= turretTypes[activeType].cost;
        state.turretLastUsed[activeType] = state.frames;
        state.selectedTurretType = null;
        state.draggedTurretType = null;
      } else if (state.draggedTurretType && !state.selectedTurretType) {
        state.draggedTurretType = null;
      }
    } else {
        if (!state.selectedTurretType) state.draggedTurretType = null;
    }
    state.mergeTargetPreview = null;
  }

  if (state.draggedTurretInstance) {
    if (state.mergeTargetPreview && state.sunCurrency >= state.mergeTargetPreview.cost) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        state.sunCurrency -= state.mergeTargetPreview.cost;
        const indexToReplace = state.player.attachments.indexOf(target);
        const indexToDelete = state.player.attachments.indexOf(state.draggedTurretInstance);
        const newTurret = new AttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
        newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
        state.player.attachments[indexToReplace] = newTurret;
        state.player.attachments.splice(indexToDelete, 1);
        state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y));
      }
    }
    state.draggedTurretInstance = null;
    state.mergeTargetPreview = null;
  }
};

(window as any).mouseWheel = (event: any) => {
  if (state.showDebug && mouseX > width - 280) {
    state.debugScrollY -= event.delta;
    return false;
  }
};

(window as any).windowResized = () => { (window as any).resizeCanvas(windowWidth, windowHeight); };
function map(n: number, start1: number, stop1: number, start2: number, stop2: number) { return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; }

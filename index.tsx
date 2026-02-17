
import { state } from './state';
import { 
  GRID_SIZE, HEX_DIST, MAX_VFX, HOUR_FRAMES, CHUNK_SIZE
} from './constants';
import { turretTypes } from './balanceTurrets';
import { findMergeResult } from './dictionaryTurretMerging';
import { enemyTypes } from './balanceEnemies';
import { bulletTypes } from './balanceBullets';
import { WorldManager } from './world';
import { Player, Enemy, AttachedTurret, SunLoot, NPCEntity } from './entities';
import { getTime, drawUI, drawTurretTooltip } from './ui';
import { drawWorldGenPreview } from './uiDebug';
import { handleNpcUiClick } from './uiNpcShop';
import { updateGameSystems, spawnFromBudget, getLightLevel, customDayLightConfig } from './lvDemo';
import { MergeVFX } from './vfx';
import { ASSETS } from './assets';
import { drawTurretSprite } from './assetTurret';
import { drawPendingSpawn } from './visualEnemies';
import { drawTickingExplosive } from './visualObstacles';
import { EnabledTurrets, DisabledTurrets } from './debug/turretAvailability';

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
declare const LEFT: any;
declare const TOP: any;
declare const rectMode: any;
declare const textWidth: any;
declare const color: any;
declare const lerpColor: any;
declare const rotate: any;
declare const loadImage: any;
declare const imageMode: any;
declare const floor: any;
declare const noise: any;

function getHexAxial(x: number, y: number) {
  let q = (2/3 * x) / HEX_DIST; let r = (-1/3 * x + sqrt(3)/3 * y) / HEX_DIST;
  let x_ = q; let y_ = -q - r; let z_ = r;
  let rx = round(x_); let ry = round(y_); let rz = round(z_);
  let dx = abs(rx - x_); let dy = abs(ry - y_); let rz_ = abs(rz - z_);
  if (dx > dy && dx > rz_) rx = -ry - rz; else if (dy > rz_) ry = -rx - rz; else rz = -rx - ry;
  return { q: rx, r: rz };
}

function axialToWorld(q: number, r: number) { 
  return createVector(HEX_DIST * (3/2 * q), HEX_DIST * (sqrt(3)/2 * q + sqrt(3) * r)); 
}

function isAdjacent(q: number, r: number, exclude: any = null) {
  const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
  for (let [dq, dr] of neighbors) {
    let nq = q + dq;
    let nr = r + dr;
    if (nq === 0 && nr === 0) return true;
    if (state.player.attachments.some((a: any) => a !== exclude && a.hq === nq && a.hr === nr)) return true;
  }
  return false;
}

function rebuildSpatialHash() {
  state.spatialHash.clear();
  const cs = state.spatialHashCellSize;
  for (const e of state.enemies) {
    if (e.isDying) continue;
    const gx = floor(e.pos.x / cs);
    const gy = floor(e.pos.y / cs);
    const key = `${gx},${gy}`;
    if (!state.spatialHash.has(key)) state.spatialHash.set(key, []);
    state.spatialHash.get(key).push(e);
  }
}

function drawGlobalLighting() {
  let t = getTime();
  let mins = t.hour * 60 + t.minutes;
  const keys: any[] = [];
  for (let h = 0; h < 24; h++) {
    const l = getLightLevel(h);
    let c = [0, 0, 0, 0];
    if (l === 0) c = [15, 10, 50, 140];
    else if (l === 1) c = [180, 50, 20, 48];
    else c = [0, 0, 0, 0];
    keys.push({ m: h * 60, c });
  }
  keys.push({ m: 24 * 60, c: keys[0].c });
  let k1 = keys[0], k2 = keys[keys.length-1];
  for(let i=0; i<keys.length-1; i++) {
    if (mins >= keys[i].m && mins < keys[i+1].m) { k1 = keys[i]; k2 = keys[i+1]; break; }
  }
  let f = (mins - k1.m) / (k2.m - k1.m);
  let r = lerp(k1.c[0], k2.c[0], f);
  let g = lerp(k1.c[1], k2.c[1], f);
  let b = lerp(k1.c[2], k2.c[2], f);
  let a = lerp(k1.c[3], k2.c[3], f);
  if (a > 1) { push(); noStroke(); fill(r, g, b, a); rect(0, 0, width, height); pop(); }
}

function executePlacement() {
  if (!state.previewSnapPos) return;
  const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
  if (!activePlacementType && !state.draggedTurretInstance) return;
  const snapAxial = getHexAxial(state.previewSnapPos.x - state.player.pos.x, state.previewSnapPos.y - state.player.pos.y);
  
  if (activePlacementType) {
    const config = turretTypes[activePlacementType];
    const isOwned = (state.inventory[activePlacementType] || 0) > 0;
    const costType = config.costType || 'sun';
    const currency = costType === 'soil' ? state.soilCurrency : state.sunCurrency;

    if (state.mergeTargetPreview) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        const mergeCost = state.mergeTargetPreview.cost;
        const purchaseCost = isOwned ? 0 : config.cost;
        let canAfford = false;
        
        if (isOwned) {
           canAfford = state.sunCurrency >= mergeCost;
        } else {
           // Purchase cost is always paid first if not owned
           if (costType === 'sun') { canAfford = state.sunCurrency >= (purchaseCost + mergeCost); } 
           else { canAfford = state.soilCurrency >= purchaseCost && state.sunCurrency >= mergeCost; }
        }

        if (canAfford) {
          if (isOwned) {
             state.inventory[activePlacementType]--;
             state.sunCurrency -= mergeCost;
          } else {
             if (costType === 'sun') { state.sunCurrency -= (purchaseCost + mergeCost); } 
             else { state.soilCurrency -= purchaseCost; state.sunCurrency -= mergeCost; }
          }
          const indexToReplace = state.player.attachments.indexOf(target);
          const newTurret = new AttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
          newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
          state.player.attachments[indexToReplace] = newTurret;
          state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y));
          state.turretLastUsed[activePlacementType] = state.frames;
        }
      }
    } else if (isOwned || currency >= config.cost) {
      if (isOwned) {
        state.inventory[activePlacementType]--;
      } else {
        if (costType === 'soil') state.soilCurrency -= config.cost; else state.sunCurrency -= config.cost;
      }
      const nt = new AttachedTurret(activePlacementType, state.player, snapAxial.q, snapAxial.r);
      state.player.attachments.push(nt);
      state.turretLastUsed[activePlacementType] = state.frames;
    }
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
    } else {
      state.draggedTurretInstance.hq = snapAxial.q; state.draggedTurretInstance.hr = snapAxial.r;
      state.draggedTurretInstance.offset = axialToWorld(snapAxial.q, snapAxial.r);
      state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y));
    }
  }
  state.draggedTurretInstance = null; state.draggedTurretType = null; state.selectedTurretType = null; state.isCurrentlyDragging = false; state.mergeTargetPreview = null; state.previewSnapPos = null;
}

(window as any).preload = () => {
  state.assets = {};
  for (const [key, url] of Object.entries(ASSETS)) { state.assets[key] = loadImage(url); }
};

(window as any).setup = () => {
  createCanvas(windowWidth, windowHeight);
  state.world = new WorldManager(); 
  const spawnX = 8 * GRID_SIZE + GRID_SIZE / 2;
  const spawnY = 8 * GRID_SIZE + GRID_SIZE / 2;
  state.player = new Player(spawnX, spawnY); 
  state.cameraPos = createVector(spawnX, spawnY);
  state.deathVisualsBuffer = createGraphics(8000, 8000);
  state.deathVisualsBuffer.pixelDensity(1);
};

(window as any).draw = () => {
  background(10, 10, 25); 
  state.frames++;
  updateGameSystems();
  rebuildSpatialHash();
  state.cameraPos.x = lerp(state.cameraPos.x, state.player.pos.x, 0.08); 
  state.cameraPos.y = lerp(state.cameraPos.y, state.player.pos.y, 0.08);
  
  // Camera Shake Decay using dynamic falloff
  state.cameraShake = (state.cameraShake || 0) * (state.cameraShakeFalloff || 0.95);
  if (state.cameraShake < 0.1) state.cameraShake = 0;
  
  // EXTENDED FREQUENCY SHAKE: Use coordinated noise for slower oscillation (reduced from 0.2 to 0.1)
  const shakeFreq = 0.1;
  const shakeX = (noise(state.frames * shakeFreq, 0) * 2 - 1) * state.cameraShake;
  const shakeY = (noise(state.frames * shakeFreq, 1000) * 2 - 1) * state.cameraShake;

  push(); 
  translate(width/2 - state.cameraPos.x + shakeX, height/2 - state.cameraPos.y + shakeY);
  let bgCol = [20, 20, 40]; if (state.currentChunkLevel >= 3) bgCol = [40, 20, 60]; if (state.currentChunkLevel >= 6) bgCol = [60, 10, 30];
  push(); noStroke(); fill(bgCol[0], bgCol[1], bgCol[2], 50); rect(state.cameraPos.x - width, state.cameraPos.y - height, width*2, height*2); pop();
  image(state.deathVisualsBuffer, -4000, -4000);
  state.world.update(state.player.pos); 
  state.world.display(state.player.pos);

  if (state.showChunkBorders) {
    push();
    const cw = CHUNK_SIZE * GRID_SIZE;
    const xMin = floor((state.cameraPos.x - width / 2) / cw) * cw;
    const xMax = floor((state.cameraPos.x + width / 2) / cw) * cw + cw;
    const yMin = floor((state.cameraPos.y - height / 2) / cw) * cw;
    const yMax = floor((state.cameraPos.y + height / 2) / cw) * cw + cw;
    for (let lx = xMin; lx < xMax; lx += cw) {
      for (let ly = yMin; ly < yMax; ly += cw) {
        const cx = floor(lx / cw);
        const cy = floor(ly / cw);
        const explored = state.exploredChunks.has(`${cx},${cy}`);
        const chunk = state.world.getChunk(cx, cy);
        noFill(); strokeWeight(2); stroke(explored ? [0, 255, 100, 150] : [255, 0, 0, 100]); rect(lx, ly, cw, cw);
        fill(255); noStroke(); textAlign(LEFT, TOP); textSize(12);
        const prefabInfo = chunk.prefabId ? `Prefab: ${chunk.prefabId}` : "No Prefab";
        text(`Chunk Lvl: ${chunk.localChunkLevel}\n${prefabInfo}`, lx + 5, ly + 5);
      }
    }
    pop();
  }
  
  for (let tex of state.tickingExplosives) drawTickingExplosive(tex);
  for (let s of state.pendingSpawns) drawPendingSpawn(s);
  for (let i = state.trails.length - 1; i >= 0; i--) { state.trails[i].update(); state.trails[i].display(); if (state.trails[i].isDone()) state.trails.splice(i, 1); }
  for (let l of state.loot) l.display();
  for (let i = state.bullets.length - 1; i >= 0; i--) { state.bullets[i].update(); state.bullets[i].display(); if (state.bullets[i].life <= 0) state.bullets.splice(i, 1); }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) { state.enemyBullets[i].update(); state.enemyBullets[i].display(); if (state.enemyBullets[i].life <= 0) state.enemyBullets.splice(i, 1); }
  for (let i = state.groundFeatures.length - 1; i >= 0; i--) { state.groundFeatures[i].update(); state.groundFeatures[i].display(); if (state.groundFeatures[i].life <= 0) state.groundFeatures.splice(i, 1); }
  
  for (let npc of state.npcs) npc.update(state.player.pos);
  
  state.player.displayAttachments(true);
  for (let i = state.enemies.length - 1; i >= 0; i--) { state.enemies[i].update(state.player.pos, state.player.attachments); state.enemies[i].display(); if (state.enemies[i].health <= 0 || state.enemies[i].markedForDespawn) state.enemies.splice(i, 1); }
  for (let i = state.vfx.length - 1; i >= 0; i--) { state.vfx[i].update(); state.vfx[i].display(); if (state.vfx[i].isDone()) state.vfx.splice(i, 1); }
  state.player.update(); state.player.display();

  for (let npc of state.npcs) npc.display();

  const mWorld = createVector(mouseX - width/2 + state.cameraPos.x, mouseY - height/2 + state.cameraPos.y);
  state.hoveredTurretInstance = null;
  if (mouseX > state.uiWidth || !state.isStationary) {
    const sortedForSelection = [...state.player.attachments].sort((a, b) => {
        const la = a.config.turretLayer || 'normal'; const lb = b.config.turretLayer || 'normal';
        if (la !== lb) return la === 'normal' ? -1 : 1;
        const posA = a.getWorldPos(); const posB = b.getWorldPos();
        if (posA.y !== posB.y) return posA.y - posB.y; return posB.x - posA.x;
    });
    for (let t of sortedForSelection) { if (dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) { state.hoveredTurretInstance = t; break; } }
  }

  if (state.hoveredTurretInstance) {
    const t = state.hoveredTurretInstance; const wPos = t.getWorldPos();
    push(); noFill(); stroke(255, 255, 100, 150 + sin(frameCount * 0.15) * 100); strokeWeight(4); ellipse(wPos.x, wPos.y, t.size + 8);
    const range = t.config.actionConfig?.shootRange || t.config.actionConfig?.beamMaxLength || t.config.actionConfig?.pulseTriggerRadius || 0;
    if (range > 0) { noFill(); stroke(255, 200, 50, 120); strokeWeight(2); ellipse(wPos.x, wPos.y, range * 2); } pop();
  }

  if ((state.draggedTurretType || state.draggedTurretInstance) && !state.isCurrentlyDragging) { if (dist(mouseX, mouseY, state.dragOrigin.x, state.dragOrigin.y) > 8) { state.isCurrentlyDragging = true; } }
  const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
  state.mergeTargetPreview = null; state.previewSnapPos = null;

  if (state.isStationary && (activePlacementType || state.draggedTurretInstance)) {
    const ghostType = state.draggedTurretInstance ? state.draggedTurretInstance.type : activePlacementType;
    const ghostConfig = turretTypes[ghostType!]; const ghostLayer = ghostConfig.turretLayer || 'normal';
    const draggingIngredients = state.draggedTurretInstance ? state.draggedTurretInstance.baseIngredients : (activePlacementType ? [activePlacementType] : []);
    
    if (ghostLayer === 'normal' && draggingIngredients.length > 0) {
      for (const att of state.player.attachments) {
        if (att === state.draggedTurretInstance || att.isFrosted || (att.config.turretLayer || 'normal') !== 'normal' || att.baseIngredients.length === 0) continue;
        const combinedPool = [...draggingIngredients, ...att.baseIngredients];
        const resType = findMergeResult(combinedPool); const resConfig = resType ? turretTypes[resType] : null;
        const isAvailable = resType ? (EnabledTurrets.includes(resType) || state.makeAllTurretsAvailable) : false;

        if (resType && resConfig && isAvailable) {
          const wPos = att.getWorldPos();
          
          // DYNAMIC COST CALCULATION
          const ingredientsCostSum = combinedPool.reduce((sum, k) => sum + (turretTypes[k]?.cost || 0), 0);
          const combinedMergeCost = Math.max(0, resConfig.cost - ingredientsCostSum);
          
          let canAffordMerge = state.sunCurrency >= combinedMergeCost;
          // If we are buying the dragging unit, check if we afford its base cost too
          const purchaseCost = state.isCurrentlyDragging && state.draggedTurretType ? ghostConfig.cost : 0;
          const totalReq = combinedMergeCost + purchaseCost;
          const canAffordTotal = state.sunCurrency >= totalReq;

          push(); translate(wPos.x, wPos.y); const pulse = 1.0 + 0.1 * sin(frameCount * 0.2);
          rectMode(CENTER); fill(20, 20, 40, 240); noStroke();
          let tw = textWidth(`${combinedMergeCost}`) + 30; rect(0, att.size/2 + 10, tw, 22, 6);
          imageMode(CENTER); if (!canAffordTotal) (window as any).tint(150, 100, 100); image(state.assets['img_icon_sun'], -tw/2 + 10, att.size/2 + 10, 22 * pulse, 22 * pulse); (window as any).noTint();
          fill(canAffordTotal ? [255, 255, 150] : [255, 100, 100]); textAlign(LEFT, CENTER); textSize(12); text(`${combinedMergeCost}`, -tw/2 + 20, att.size/2 + 10); pop();
        }
      }
    }
    let closestDist = Infinity; let bestSnap = null; let bestMergeTarget = null; let bestMergeInfo = null;
    const rangeLimit = 8;
    for (let q = -rangeLimit; q <= rangeLimit; q++) {
      for (let r = -rangeLimit; r <= rangeLimit; r++) {
        if (abs(q) + abs(r) + abs(-q-r) <= rangeLimit * 2) {
          const wPos = axialToWorld(q, r).add(state.player.pos); const d = dist(mWorld.x, mWorld.y, wPos.x, wPos.y);
          let normalOccupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && (a.config.turretLayer || 'normal') === 'normal');
          let groundOccupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && a.config.turretLayer === 'ground');
          let occupantOnSameLayer = ghostLayer === 'ground' ? groundOccupant : normalOccupant;
          let coreOccupant = (q === 0 && r === 0);
          if (occupantOnSameLayer && occupantOnSameLayer !== state.draggedTurretInstance) {
            if (ghostLayer === 'normal' && !coreOccupant && draggingIngredients.length > 0 && occupantOnSameLayer.baseIngredients.length > 0) {
              const combinedPool = [...draggingIngredients, ...occupantOnSameLayer.baseIngredients];
              const resType = findMergeResult(combinedPool); const resConfig = resType ? turretTypes[resType] : null;
              const isAvailable = resType ? (EnabledTurrets.includes(resType) || state.makeAllTurretsAvailable) : false;

              if (resType && resConfig && isAvailable && !occupantOnSameLayer.isFrosted) {
                // DYNAMIC COST CALCULATION
                const ingredientsCostSum = combinedPool.reduce((sum, k) => sum + (turretTypes[k]?.cost || 0), 0);
                const combinedMergeCost = Math.max(0, resConfig.cost - ingredientsCostSum);
                const purchaseCost = state.isCurrentlyDragging && state.draggedTurretType ? ghostConfig.cost : 0;
                
                if (state.sunCurrency >= (combinedMergeCost + purchaseCost)) { 
                  if (d < closestDist) { closestDist = d; bestSnap = wPos; bestMergeTarget = occupantOnSameLayer; bestMergeInfo = { resType, resConfig, combinedPool, dynamicMergeCost: combinedMergeCost }; } 
                }
              }
            }
          } 
          else if (!occupantOnSameLayer || occupantOnSameLayer === state.draggedTurretInstance) {
            if (!coreOccupant && isAdjacent(q, r, state.draggedTurretInstance)) {
              if (!state.world.isBlockAt(wPos.x, wPos.y)) { if (d < closestDist) { closestDist = d; bestSnap = wPos; bestMergeTarget = null; bestMergeInfo = null; } fill(100, 255, 150, 40); noStroke(); ellipse(wPos.x, wPos.y, 10, 10); }
            }
          }
        }
      }
    }
    if (bestSnap) {
      state.previewSnapPos = bestSnap;
      if (bestMergeTarget && bestMergeInfo) {
        const { resType, resConfig, combinedPool, dynamicMergeCost } = bestMergeInfo; const isHovered = dist(mWorld.x, mWorld.y, bestSnap.x, bestSnap.y) < 25;
        push(); const pulse = 0.8 + 0.2 * sin(frameCount * 0.2); noStroke(); fill(255, 255, 100, isHovered ? 150 : (60 * pulse)); ellipse(bestSnap.x, bestSnap.y, bestMergeTarget.size + 15);
        if (isHovered) { const resRange = resConfig.actionConfig?.shootRange || resConfig.actionConfig?.beamMaxLength || resConfig.actionConfig?.pulseTriggerRadius || 0; if (resRange > 0) { push(); noFill(); stroke(255, 255, 0, 180); strokeWeight(3); ellipse(bestSnap.x, bestSnap.y, resRange * 2); pop(); } }
        state.mergeTargetPreview = { uid: bestMergeTarget.uid, type: resType, pos: bestSnap, cost: dynamicMergeCost, ingredients: combinedPool }; pop();
      }
      if (ghostType) {
        const ghostAngle = state.draggedTurretInstance ? state.draggedTurretInstance.angle : 0;
        const ghost = { 
          uid: 'ghost', type: ghostType, config: ghostConfig, alpha: 127, angle: ghostAngle, 
          recoil: 0, fireRateMultiplier: 1.0, actionTimers: new Map(), 
          getWorldPos: () => state.previewSnapPos, jumpOffset: null,
          framesAlive: 0, flashTimer: 0 
        };
        drawTurretSprite(ghost);
        
        const actionConfig = ghostConfig.actionConfig;
        let range = actionConfig?.shootRange || actionConfig?.beamMaxLength || actionConfig?.pulseTriggerRadius || 0;
        if (range === 0 && actionConfig?.pulseBulletTypeKey) {
            const bCfg = bulletTypes[actionConfig.pulseBulletTypeKey];
            if (bCfg?.aoeConfig?.isAoe) range = bCfg.aoeConfig.aoeRadiusGradient[bCfg.aoeConfig.aoeRadiusGradient.length - 1];
        }
        if (range > 0) {
            push(); noFill(); stroke(255, 255, 255, 100); strokeWeight(2); ellipse(state.previewSnapPos.x, state.previewSnapPos.y, range * 2); pop();
        }
      }
    }
  }
  if (state.draggedTurretInstance && state.isStationary) {
    const dragging = state.draggedTurretInstance; const wPos = dragging.getWorldPos();
    stroke(255, 127); strokeWeight(2); line(wPos.x, wPos.y, mWorld.x, mWorld.y);
  }
  pop(); 

  drawGlobalLighting();
  drawUI(spawnFromBudget);
  
  for (let i = state.uiVfx.length - 1; i >= 0; i--) {
    state.uiVfx[i].update();
    state.uiVfx[i].display();
    if (state.uiVfx[i].isDone()) state.uiVfx.splice(i, 1);
  }

  drawWorldGenPreview();
  if (state.hoveredTurretInstance && !state.draggedTurretInstance && !activePlacementType) { drawTurretTooltip(state.hoveredTurretInstance, mouseX, mouseY); } 
  else if (state.mergeTargetPreview) { drawTurretTooltip(state.mergeTargetPreview, mouseX, mouseY, true); }
};

(window as any).mousePressed = () => {
  if (state.activeNPC && handleNpcUiClick()) {
    (window as any).mouseIsPressed = false;
    return;
  }

  if (mouseX > state.uiWidth && state.isStationary) {
    if (state.draggedTurretInstance || state.selectedTurretType) { if (state.previewSnapPos) { executePlacement(); return; } }
    const mWorld = createVector(mouseX - width/2 + state.cameraPos.x, mouseY - height/2 + state.cameraPos.y);
    const sortedForPicking = [...state.player.attachments].sort((a, b) => {
        const la = a.config.turretLayer || 'normal'; const lb = b.config.turretLayer || 'normal';
        if (la !== lb) return la === 'normal' ? -1 : 1;
        const posA = a.getWorldPos(); const posB = b.getWorldPos();
        if (posA.y !== posB.y) return posA.y - posB.y; return posB.x - posA.x;
    });
    for (let t of sortedForPicking) {
      if (!t.isFrosted && dist(mWorld.x, mWorld.y, t.getWorldPos().x, t.getWorldPos().y) < t.size/2 + 5) {
        if (t.config.turretLayer === 'ground') { const top = state.player.attachments.find((a: any) => a.hq === t.hq && a.hr === t.hr && (a.config.turretLayer || 'normal') === 'normal'); if (top) continue; }
        state.draggedTurretInstance = t; state.dragOrigin = { x: mouseX, y: mouseY }; state.isCurrentlyDragging = false; break;
      }
    }
  }
};

(window as any).mouseReleased = () => {
  state.pressedTradeId = null;

  if (state.draggedTurretType) {
    if (state.isCurrentlyDragging) { executePlacement(); } 
    else { if (state.selectedTurretType === state.draggedTurretType) { state.selectedTurretType = null; } else { state.selectedTurretType = state.draggedTurretType; } }
    state.draggedTurretType = null; state.isCurrentlyDragging = false; return;
  }
  if (state.draggedTurretInstance) { if (state.isCurrentlyDragging) { executePlacement(); } }
};

(window as any).mouseWheel = (event: any) => {
  if (state.showDebug && mouseX > width - 280) {
    state.debugScrollVelocity -= event.delta * 0.1;
    return false;
  }
  if (state.activeNPC && mouseX > width - 320) {
    state.npcShopScrollVelocity -= event.delta * 0.1;
    return false;
  }
};

(window as any).windowResized = () => { (window as any).resizeCanvas(windowWidth, windowHeight); };
function map(n: number, start1: number, stop1: number, start2: number, stop2: number) { return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; }

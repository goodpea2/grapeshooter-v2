
import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { TYPE_MAP, drawTurretSprite } from '../../assetTurret';
import { getActiveAlmanacProgression } from '../../lvDemo';

export function isTurretUnlockAvailable(): boolean {
  const prog = getActiveAlmanacProgression();
  const costs = prog.UnlockCost;
  if (!costs || !Array.isArray(costs) || costs.length === 0) return false;
  if (!state.lockedTurrets || state.lockedTurrets.length === 0) return false;
  if (state.unlockCount >= costs.length) return false;
  return true;
}

declare const dist: any;
declare const mouseX: any;
declare const mouseY: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const rectMode: any;
declare const CENTER: any;
declare const rect: any;
declare const imageMode: any;
declare const image: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const frameCount: any;
declare const floor: any;
declare const random: any;
declare const sin: any;
declare const scale: any;
declare const tint: any;
declare const noTint: any;
declare const noFill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const mouseIsPressed: any;

export function drawTurretUnlockButton(x: number, y: number, w: number, h: number, modalX: number, modalY: number) {
  if (!isTurretUnlockAvailable()) return;

  const prog = getActiveAlmanacProgression();
  const costs = prog.UnlockCost || [];
  const costIdx = Math.min(state.unlockCount, costs.length - 1);
  const costObj = costs[costIdx];
  if (!costObj) return;

  const costType = Object.keys(costObj)[0];
  const costVal = (costObj as any)[costType];
  
  let currentCurrency = 0;
  let iconKey = `img_icon_${costType}`;
  if (costType === 'raisin') { currentCurrency = state.raisinCurrency; iconKey = 'img_icon_raisin'; }
  else if (costType === 'soil') { currentCurrency = state.soilCurrency; iconKey = 'img_icon_soil'; }
  else if (costType === 'elixir') { currentCurrency = state.elixirCurrency; iconKey = 'img_icon_elixir'; }
  else if (costType === 'sun') { currentCurrency = state.sunCurrency; iconKey = 'img_icon_sun'; }
  else if (costType === 'leaf') { currentCurrency = state.leafCurrency; iconKey = 'img_icon_leaf'; }
  else if (costType === 'shard') { currentCurrency = state.shardCurrency; iconKey = 'img_icon_shard'; }
  else if (costType === 'shell') { currentCurrency = state.shellCurrency; iconKey = 'img_icon_shell'; }
  else if (costType === 'fuel') { currentCurrency = state.fuelCurrency; iconKey = 'img_icon_fuel'; }
  else if (costType === 'ice') { currentCurrency = state.iceCurrency; iconKey = 'img_icon_ice'; }
  else if ((state as any)[`${costType}Currency`] !== undefined) {
    currentCurrency = (state as any)[`${costType}Currency`];
  }
  
  const canAfford = currentCurrency >= costVal;

  push();
  translate(x, y);
  
  const bx = w / 2;
  const by = h / 2;
  const screenX = modalX + x + bx;
  const screenY = modalY + y + by + 20; // Center of the podium
  const hov = mouseX > screenX - 80 && mouseX < screenX + 80 && 
              mouseY > screenY - 40 && mouseY < screenY + 40;

  // Ground Halo VFX (Blurred-glow style)
  push();
  translate(bx, by + 60);
  const pulse = 1 + 0.05 * sin(frameCount * 0.1);
  const dc = (window as any).drawingContext;
  
  const outerW = 300 * pulse;
  const outerH = 80 * pulse;
  
  const grad = dc.createRadialGradient(0, 0, 0, 0, 0, outerW / 2);
  if (canAfford) {
    grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 150, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 100, 0)');
  } else {
    grad.addColorStop(0, 'rgba(200, 200, 200, 1)');
    grad.addColorStop(0.4, 'rgba(150, 150, 150, 0.5)');
    grad.addColorStop(1, 'rgba(100, 100, 100, 0)');
  }
  
  dc.save();
  dc.scale(1, outerH / outerW); // Squish into ellipse
  dc.fillStyle = grad;
  dc.beginPath();
  dc.arc(0, 0, outerW / 2, 0, Math.PI * 2);
  dc.fill();
  dc.restore();
  pop();

  // Fancy Particles
  const particleCount = canAfford ? 24 : 12;
  for (let i = 0; i < particleCount; i++) {
    const pId = i;
    const pLifetime = canAfford ? 100 : 150;
    const pFrame = (frameCount + pId * (pLifetime / particleCount)) % pLifetime;
    
    const seed = pId * 123.456;
    const px = bx + (sin(seed) * (canAfford ? 120 : 80));
    const py = by + 25 - (pFrame / pLifetime) * (canAfford ? 180 : 120);
    
    const pAlpha = map(sin((pFrame / pLifetime) * Math.PI), -1, 1, 0, canAfford ? 255 : 180);
    const pSize = map(pFrame, 0, pLifetime, canAfford ? 6 : 4, 1);
    
    fill(255, 255, canAfford ? 100 : 200, pAlpha);
    noStroke();
    rectMode(CENTER);
    rect(px, py, pSize, pSize * (canAfford ? 4 : 3), 2);
    
    if (sin(frameCount * (canAfford ? 0.4 : 0.2) + pId) > 0.8) {
      fill(255, 255, 255, pAlpha);
      ellipse(px, py, pSize * 2);
    }
  }

  // Thick Purple Podium
  push();
  translate(bx, by + 20);
  rectMode(CENTER);
  
  // Shadow
  fill(0, 0, 0, 200);
  rect(0, 15, 160, 80, 25);
  
  // Depth (Side)
  fill(80, 30, 150);
  rect(0, 7, 160, 80, 25);
  
  // Top Surface
  fill(hov && canAfford ? [150, 60, 230] : [120, 40, 200]);
  rect(0, 0, 160, 80, 25);
  
  // Bevel/Highlight on top
  noFill();
  stroke(255, 255, 255, 40);
  strokeWeight(2);
  rect(0, -2, 150, 70, 22);
  
  // Cost on front
  noStroke();
  imageMode(CENTER);
  const iconSprite = state.assets[iconKey];
  if (iconSprite) {
    image(iconSprite, -45, 20, 48, 48);
  }
  fill(canAfford ? [255, 255, 255] : [255, 100, 100]);
  textAlign(LEFT, CENTER);
  textSize(20);
  text(`${currentCurrency}/${costVal}`, -15, 20);
  pop();

  // Cycling Turret Image (Locked turrets only)
  if (state.lockedTurrets.length > 0) {
    const cycleRate = 15;
    const cycleIndex = floor(frameCount / cycleRate) % state.lockedTurrets.length;
    const cycleKey = state.lockedTurrets[cycleIndex].type;
    
    push();
    translate(bx, by - 10);
    
    const isSoft = turretTypes[cycleKey].animationBodyType === 'soft';
    const breatheRate = isSoft ? 0.1 : 0.06;
    const breatheAmp = isSoft ? 0.04 : 0.02;
    const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
    const animScaleX = 1.0 / animScaleY;
    scale(animScaleX * 1.5, animScaleY * 1.5);

    const dummyTurret = {
      type: cycleKey,
      config: turretTypes[cycleKey],
      angle: 0,
      alpha: 255,
      actionTimers: new Map(),
      flashTimer: 0,
      recoil: 0,
      fireRateMultiplier: 1.0,
      uid: 'almanac_unlock_cycle'
    };
    
    tint(0, 0, 0, 200);
    drawTurretSprite(dummyTurret);
    noTint();
    pop();
  }

  // Handle Unlock Click
  if (hov && mouseIsPressed && canAfford && state.lockedTurrets.length > 0 && !state.almanacIsDragging && !state.upgradeSelection) {
    // Deduct cost
    if (costType === 'raisin') state.raisinCurrency -= costVal;
    else if (costType === 'soil') state.soilCurrency -= costVal;
    else if (costType === 'elixir') state.elixirCurrency -= costVal;
    else if (costType === 'sun') state.sunCurrency -= costVal;
    else if (costType === 'leaf') state.leafCurrency -= costVal;
    else if (costType === 'shard') state.shardCurrency -= costVal;
    else if (costType === 'shell') state.shellCurrency -= costVal;
    else if (costType === 'fuel') state.fuelCurrency -= costVal;
    else if (costType === 'ice') state.iceCurrency -= costVal;
    else if ((state as any)[`${costType}Currency`] !== undefined) {
      (state as any)[`${costType}Currency`] -= costVal;
    }

    // Unlock a random turret from locked list with weights
    let totalWeight = 0;
    state.lockedTurrets.forEach((t: any) => totalWeight += t.weight);
    let r = random(totalWeight);
    let sum = 0;
    let unlockedIdx = -1;
    for (let i = 0; i < state.lockedTurrets.length; i++) {
      sum += state.lockedTurrets[i].weight;
      if (r <= sum) {
        unlockedIdx = i;
        break;
      }
    }
    if (unlockedIdx === -1) unlockedIdx = 0; // Fallback

    const unlockedObj = state.lockedTurrets.splice(unlockedIdx, 1)[0];
    const unlockedKey = unlockedObj.type;
    state.unlockedTurrets.push(unlockedKey);
    state.unlockCount++;

    // Trigger Popup
    state.showUnlockPopup = true;
    state.lastUnlockedTurret = unlockedKey;
    state.unlockPopupTimer = 180; // 3 seconds

    // Reset interaction to prevent double-click
    (window as any).mouseIsPressed = false;
  }

  pop();
}

function map(n: number, start1: number, stop1: number, start2: number, stop2: number): number {
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
}

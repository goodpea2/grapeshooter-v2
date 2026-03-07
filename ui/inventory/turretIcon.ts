
import { state } from '../../state';
import { HOUR_FRAMES } from '../../constants';
import { TYPE_MAP } from '../../assetTurret';

declare const dist: any;
declare const mouseX: any;
declare const mouseY: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const ellipse: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const arc: any;
declare const HALF_PI: any;
declare const TWO_PI: any;
declare const rectMode: any;
declare const rect: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const CENTER: any;
declare const textAlign: any;
declare const LEFT: any;
declare const textSize: any;
declare const text: any;

declare const noFill: any;
declare const mouseIsPressed: any;
declare const map: any;

export function drawTurretIcon(tr: any, key: string, x: number, y: number, alpha: number, isInstance: boolean = false) {
  const size = 58;
  const ownedCount = isInstance ? 1 : (state.inventory.items[key] || 0);
  const isOwned = ownedCount > 0;
  
  const sunCost = tr.costs?.sun || tr.cost || 0;
  const elixirCost = tr.costs?.elixir || 0;
  const soilCost = tr.costs?.soil || 0;
  const canAfford = isOwned || (
    state.sunCurrency >= sunCost &&
    state.elixirCurrency >= elixirCost &&
    state.soilCurrency >= soilCost
  );
  
  const lastUsed = state.turretLastUsed[key] || -99999;
  const cooldownFrames = (tr.cooldownHours || 0) * HOUR_FRAMES;
  const onCooldown = !state.instantRechargeTurrets && (state.frames - lastUsed < cooldownFrames);
  const cooldownProgress = onCooldown ? (state.frames - lastUsed) / cooldownFrames : 1;
  
  const hov = dist(mouseX, mouseY, x, y) < size / 2;
  const isDraggingThis = state.draggedTurretType === key;
  const isSelected = state.selectedTurretType === key || isDraggingThis;
  
  push();
  translate(x, y);
  
  if (isSelected) {
    noStroke();
    fill(255, 230, 100, alpha);
    ellipse(0, 0, size + 10);
  }
  
  noStroke();
  let bgColor = tr.isSpecial ? [140, 55, 100] : [40, 80, 200]; 
  if (!canAfford || onCooldown) bgColor = [40, 40, 40]; 
  
  fill(bgColor[0], bgColor[1], bgColor[2], alpha);
  ellipse(0, 0, size);
  
  fill(255, 255, 255, alpha * 0.1);
  ellipse(0, 0, size * 0.8);

  const baseAssetKey = TYPE_MAP[key];
  const sprite = state.assets[`img_${baseAssetKey}_front`];
  if (sprite) {
    imageMode(CENTER);
    if (!canAfford || onCooldown) tint(100, 100, 100, alpha);
    else if (alpha < 255) tint(255, alpha);
    image(sprite, 0, 0, 60, 60);
    noTint();
  }

  if (onCooldown) {
    fill(0, 0, 0, alpha * 0.5);
    ellipse(0, 0, size);
    stroke(255, 255, 255, alpha * 0.8);
    strokeWeight(4);
    noFill();
    const endAngle = -HALF_PI + TWO_PI * cooldownProgress;
    arc(0, 0, size - 4, size - 4, -HALF_PI, endAngle);
  }

  // Cost Pill or Owned Count
  if (!isOwned) {
    const priceW = 46;
    const priceH = 20;
    const pY = size / 2;
    rectMode(CENTER);
    fill(canAfford ? [30, 60, 150] : [40, 40, 40], alpha);
    noStroke();
    rect(0, pY, priceW, priceH, 10);
    
    imageMode(CENTER);
    if (!canAfford) tint(100, 100, 100, alpha);
    const iconKey = tr.costs?.elixir ? 'img_icon_elixir' : (tr.costs?.soil ? 'img_icon_soil' : 'img_icon_sun');
    const displayCost = tr.costs?.elixir || tr.costs?.soil || sunCost;
    image(state.assets[iconKey], -12, pY, 22, 22);
    noTint();
    
    fill(255, alpha);
    textAlign(LEFT, CENTER);
    textSize(12);
    text(`${displayCost}`, 0, pY + 1);
  } else if (ownedCount > 1 || !isInstance) {
    // Show count on top-right panel if more than 1 or if it's a stackable type
    push();
    translate(size/2 - 5, -size/2 + 5);
    fill(20, 20, 40, alpha);
    noStroke();
    ellipse(0, 0, 22, 22);
    fill(255, alpha);
    textAlign(CENTER, CENTER);
    textSize(11);
    text(ownedCount, 0, 0);
    pop();
  }
  pop();

  if (hov && mouseIsPressed && state.isStationary) {
    if (!onCooldown && canAfford && !state.draggedTurretType) {
      state.draggedTurretType = key;
      state.dragOrigin = { x: mouseX, y: mouseY };
      state.isCurrentlyDragging = false;
      // If it's an instance, we might want to track which one is being dragged
      // But for now, let's keep it simple.
    }
  }
  // BUGFIX: Inject 'type' so tooltip can find assets
  if (hov) return { ...tr, type: key };
  return null;
}


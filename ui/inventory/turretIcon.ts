
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
declare const scale: any;
declare const noFill: any;
declare const mouseIsPressed: any;
declare const map: any;
declare const textWidth: any;

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

  // --- Hover lift ---
  let liftY = 0;
  let hoverScale = 1;
  if (hov) {
    liftY = -3;
    hoverScale = 1.05;
  }

  translate(x, y + liftY);
  scale(hoverScale);

  // --- Selection ring ---
  if (isSelected) {
    noStroke();
    fill(255, 230, 100, alpha);
    ellipse(0, 0, size + 12);
  }

  // --- Background color logic ---
  let bgColor = tr.isSpecial ? [140, 55, 100] : [20, 64, 47]; // NEW default shop green

  if (!canAfford || onCooldown) bgColor = [40, 40, 40];

  // Hover brighten
  if (hov && canAfford && !onCooldown) {
    bgColor = [
      bgColor[0] + 25,
      bgColor[1] + 50,
      bgColor[2] + 25
    ];
  }

  noStroke();
  fill(0, alpha*0.75);
  ellipse(0, 5, size);

  noStroke();
  fill(bgColor[0], bgColor[1], bgColor[2], alpha);
  ellipse(0, 0, size);

  // subtle highlight
  fill(255, 255, 255, alpha * 0.08);
  ellipse(0, 0, size * 0.8);

  // --- Sprite ---
  const baseAssetKey = TYPE_MAP[key];
  const sprite = state.assets[`img_${baseAssetKey}_front`];

  if (sprite) {
    imageMode(CENTER);

    if (!canAfford || onCooldown) tint(120, 120, 120, alpha);
    else if (alpha < 255) tint(255, alpha);

    image(sprite, 0, 0, 60, 60);
    noTint();
  }

  // --- Cooldown overlay ---
  if (onCooldown) {
    fill(0, 0, 0, alpha * 0.5);
    ellipse(0, 0, size);

    stroke(255, 255, 255, alpha * 0.8);
    strokeWeight(4);
    noFill();

    const endAngle = -HALF_PI + TWO_PI * cooldownProgress;
    arc(0, 0, size - 4, size - 4, -HALF_PI, endAngle);
  }

  // --- COST PILL ---
  if (!isOwned) {

    const iconKey =
      tr.costs?.elixir ? 'img_icon_elixir' :
      tr.costs?.soil ? 'img_icon_soil' :
      'img_icon_sun';

    const displayCost =
      tr.costs?.elixir ||
      tr.costs?.soil ||
      sunCost;

    textSize(12);
    const costText = `${displayCost}`;
    const textW = textWidth(costText);

    const iconSize = 22;
    const padding = 6;
    const pillH = 18;

    const pillW = iconSize + padding + textW + 10;
    const pY = size / 2 + 2;

    rectMode(CENTER);

    // darker variant of bgColor
    const pillColor = [
      bgColor[0] * 0.7,
      bgColor[1] * 0.7,
      bgColor[2] * 0.7
    ];

    fill(pillColor[0], pillColor[1], pillColor[2], alpha);
    noStroke();
    rect(0, pY, pillW, pillH, 10);

    imageMode(CENTER);

    if (!canAfford) tint(120, 120, 120, alpha);
    image(state.assets[iconKey], -pillW/2 + iconSize/2 + 3, pY, iconSize, iconSize);
    noTint();

    fill(canAfford ? [255,alpha]:[255,100,100,alpha] );
    textAlign(LEFT, CENTER);
    text(costText, -pillW/2 + iconSize + padding, pY + 1);

  } else if (ownedCount > 1 || !isInstance) {

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

  // --- Drag logic ---
  if (hov && mouseIsPressed && state.isStationary) {
    if (!onCooldown && canAfford && !state.draggedTurretType) {
      state.draggedTurretType = key;
      state.dragOrigin = { x: mouseX, y: mouseY };
      state.isCurrentlyDragging = false;
    }
  }

  if (hov) return { ...tr, type: key };
  return null;
}


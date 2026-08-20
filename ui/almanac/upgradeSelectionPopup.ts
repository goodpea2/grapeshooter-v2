
import { state } from '../../state';
import { UPGRADES, recalculateAllStats } from '../../src/upgrades';
import { drawRichText } from '../richText';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const TOP: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseIsPressed: any;
declare const rectMode: any;
declare const width: any;
declare const height: any;
declare const dist: any;

export function drawUpgradeSelectionPopup(modalW: number, modalH: number) {
  const sel = state.upgradeSelection;
  if (!sel) return;

  // Dim background
  fill(0, 0, 0, 200);
  noStroke();
  rect(0, 0, modalW, modalH, 40);

  push();
  translate(modalW / 2, modalH / 2);
  
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text("CHOOSE AN UPGRADE", 0, -180);

  const cardW = 280;
  const cardH = 320;
  const gap = 50;

  // Calculate screen positions for hover
  const modalX = (width - modalW) / 2 + 30;
  const modalY = (height - modalH) / 2;
  const centerX = modalX + modalW / 2;
  const centerY = modalY + modalH / 2;

  drawUpgradeCard(-cardW / 2 - gap / 2, 0, cardW, cardH, sel.options[0], 0, centerX, centerY);
  drawUpgradeCard(cardW / 2 + gap / 2, 0, cardW, cardH, sel.options[1], 1, centerX, centerY);

  pop();
}

function drawUpgradeCard(x: number, y: number, w: number, h: number, upgradeId: string, optionIdx: number, centerX: number, centerY: number) {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) return;

  const preRolled = state.upgradeSelection?.preRolledData?.[optionIdx];

  const screenX = centerX + x;
  const screenY = centerY + y;
  const hov = mouseX > screenX - w/2 && mouseX < screenX + w/2 && 
              mouseY > screenY - h/2 && mouseY < screenY + h/2;

  push();
  translate(x, y);
  rectMode(CENTER);

  // Card Shadow
  fill(0, 0, 0, 150);
  rect(0, 10, w, h, 20);

  // Card Body
  if (hov) {
    fill(60, 80, 120);
    stroke(255, 200, 0);
    strokeWeight(4);
  } else {
    fill(40, 50, 80);
    noStroke();
  }
  rect(0, 0, w, h, 20);

  // Upgrade Name
  fill(255);
  noStroke();
  textAlign(CENTER, TOP);
  textSize(20);
  text(upgrade.name, 0, -h/2 + 30);

  // Description (Rich Text)
  let desc = upgrade.description;
  if (preRolled) {
    if (typeof preRolled === 'string') {
      desc = desc.replace('<class>', `<${preRolled}>`);
      desc = desc.replace('<item>', `<${preRolled}>`);
    }
  }
  
  drawRichText(desc, -w/2 + 20, -h/2 + 100, w - 40, 16, [200, 220, 255]);

  // Click to select
  if (hov && mouseIsPressed) {
    const turretType = state.upgradeSelection!.turretType;
    if (!state.turretUpgrades[turretType]) state.turretUpgrades[turretType] = [];
    
    const nextIdx = state.turretUpgrades[turretType].length;
    if (upgrade.onSelect) {
      upgrade.onSelect(turretType, nextIdx, preRolled);
    }

    state.turretUpgrades[turretType].push(upgradeId);
    
    // Recalculate all stats
    recalculateAllStats();

    // Close popup
    state.upgradeSelection = null;
    (window as any).mouseIsPressed = false;
  }

  pop();
}

declare const stroke: any;
declare const strokeWeight: any;

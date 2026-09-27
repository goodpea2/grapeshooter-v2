import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { drawTurretSprite } from '../../assetTurret';
import { drawModalFrame, drawYellowButton, setUILayer } from '../../uiComponents';
import { color } from '../../uiColors';
import { soundEngine } from '../../src/audio/soundEngine';
import { triggerNodeUnlockVFX } from './turretUnlockTree';
import { recalculateAllStats } from '../../src/upgrades';
import { drawRichText } from '../richText';

declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const scale: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const ellipse: any;
declare const textAlign: any;
declare const textSize: any;
declare const textStyle: any;
declare const text: any;
declare const imageMode: any;
declare const image: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseIsPressed: any;
declare const frameCount: any;
declare const constrain: any;
declare const sin: any;
declare const abs: any;
declare const resetMatrix: any;
declare const CENTER: any;
declare const BOLD: any;
declare const NORMAL: any;

export function drawTurretUnlockChoiceModal() {
  const modal = state.turretUnlockChoiceModal;
  if (!modal) return;

  const modalW = modal.type === 'upgrade' ? 700 : 500;
  const modalH = modal.type === 'upgrade' ? 290 : 270;
  const modalX = (width - modalW) / 2;
  const modalY = (height - modalH) / 2;

  push();
  resetMatrix();
  setUILayer(250);

  // Full Screen Darkened Backdrop covering entire screen
  noStroke();
  fill(0, 0, 0, 220);
  rect(0, 0, width, height);

  // Modal Frame & Backdrop (No title/subtitle as requested)
  drawModalFrame(modalX, modalY, modalW, modalH, {
    radius: 28,
    borderWidth: 4,
    dimAlpha: 0,
    layer: 250
  });

  // Render Choice Cards
  if (modal.type === 'upgrade') {
    drawUpgradeOptions(modalX, modalY, modalW, modalH, modal);
  } else {
    drawLootOptions(modalX, modalY, modalW, modalH, modal);
  }

  pop();
}

function drawUpgradeOptions(modalX: number, modalY: number, modalW: number, modalH: number, modal: any) {
  const options = modal.options || [];
  const cardW = 195;
  const cardH = 220;
  const gap = 20;
  const totalW = options.length * cardW + (options.length - 1) * gap;
  const startX = modalX + (modalW - totalW) / 2;
  const cardY = modalY + (modalH - cardH) / 2;
  const openFrame = modal.openedAtFrame || 0;
  const elapsed = frameCount - openFrame;

  for (let i = 0; i < options.length; i++) {
    // Quick sequential CardReveal animation
    const delay = i * 4;
    const animDuration = 12;
    const progress = constrain((elapsed - delay) / animDuration, 0, 1);
    if (progress <= 0) continue;

    const ease = 1 - Math.pow(1 - progress, 3);
    const slideY = (1 - ease) * 26;
    const cardScale = 0.85 + 0.15 * ease;

    const opt = options[i];
    const cx = startX + i * (cardW + gap);
    const tr = turretTypes[opt.turretKey];
    const trName = tr ? tr.name : (opt.turretKey || 'Turret');
    const isRevealed = progress >= 0.85;
    const isHovered = isRevealed && mouseX >= cx && mouseX <= cx + cardW && mouseY >= cardY && mouseY <= cardY + cardH;

    push();
    translate(cx + cardW / 2, cardY + cardH / 2 + slideY);
    scale(cardScale);
    translate(-cardW / 2, -cardH / 2);

    // Card Base
    fill(...color.black(160));
    noStroke();
    rect(0, 6, cardW, cardH, 18);

    if (isHovered) {
      fill(25, 45, 85);
      stroke(...color.yellow());
      strokeWeight(3);
    } else {
      fill(18, 25, 50);
      stroke(...color.lightBlue());
      strokeWeight(2);
    }
    rect(0, 0, cardW, cardH, 18);
    noStroke();

    // Plant Preview Pedestal
    fill(...color.black(100));
    ellipse(cardW / 2, 62, 58, 16);

    // Plant Sprite
    push();
    translate(cardW / 2, 52);
    const dummyTurret = {
      type: opt.turretKey,
      config: tr || {},
      angle: 0,
      alpha: 255,
      actionTimers: new Map(),
      flashTimer: 0,
      recoil: 0,
      fireRateMultiplier: 1.0,
      uid: 'modal_opt_' + i
    };
    drawTurretSprite(dummyTurret);
    pop();

    // Title
    fill(...color.yellow());
    textAlign(CENTER, CENTER);
    textSize(15);
    textStyle(BOLD);
    text(trName, cardW / 2, 105);

    // Upgrade Description (Rich text wrapping & class icons)
    let desc = opt.description || 'Upgrade Description A';
    desc = desc.replace(/\[([^\]]+)\]/g, '<$1>');
    push();
    translate(15, 120);
    drawRichText(desc, 0, 0, cardW - 30, 11, [220, 220, 220]);
    pop();

    // Select Button: ONLY appears on card hover, perfectly centered inside card with no offset
    const btnW = 135;
    const btnH = 32;
    const btnX = (cardW - btnW) / 2;
    const btnY = cardH - btnH - 14;

    if (isHovered) {
      drawYellowButton(btnX, btnY, btnW, btnH, 'SELECT', {
        id: `btn_upgrade_opt_${i}`,
        fontSize: 13,
        radius: 8,
        depth3D: 2,
        hitboxX: cx + btnX,
        hitboxY: cardY + btnY + slideY,
        layer: 255,
        onClick: () => {
          applyUpgradeChoice(modal.nodeId, opt);
        }
      });
    }

    pop();
  }
}

function drawLootOptions(modalX: number, modalY: number, modalW: number, modalH: number, modal: any) {
  const options = modal.options || [];
  const cardW = 195;
  const cardH = 210;
  const gap = 25;
  const totalW = options.length * cardW + (options.length - 1) * gap;
  const startX = modalX + (modalW - totalW) / 2;
  const cardY = modalY + (modalH - cardH) / 2;
  const openFrame = modal.openedAtFrame || 0;
  const elapsed = frameCount - openFrame;

  for (let i = 0; i < options.length; i++) {
    // Quick sequential CardReveal animation
    const delay = i * 4;
    const animDuration = 12;
    const progress = constrain((elapsed - delay) / animDuration, 0, 1);
    if (progress <= 0) continue;

    const ease = 1 - Math.pow(1 - progress, 3);
    const slideY = (1 - ease) * 26;
    const cardScale = 0.85 + 0.15 * ease;

    const opt = options[i];
    const cx = startX + i * (cardW + gap);
    const isRevealed = progress >= 0.85;
    const isHovered = isRevealed && mouseX >= cx && mouseX <= cx + cardW && mouseY >= cardY && mouseY <= cardY + cardH;

    push();
    translate(cx + cardW / 2, cardY + cardH / 2 + slideY);
    scale(cardScale);
    translate(-cardW / 2, -cardH / 2);

    // Card Base
    fill(...color.black(160));
    noStroke();
    rect(0, 6, cardW, cardH, 18);

    if (isHovered) {
      fill(25, 45, 85);
      stroke(...color.yellow());
      strokeWeight(3);
    } else {
      fill(18, 25, 50);
      stroke(...color.lightBlue());
      strokeWeight(2);
    }
    rect(0, 0, cardW, cardH, 18);
    noStroke();

    // Loot Icon
    const iconKey = opt.lootType === 'elixir' ? 'img_icon_elixir' : 'img_icon_sun';
    const icon = state.assets[iconKey];
    if (icon) {
      imageMode(CENTER);
      image(icon, cardW / 2, 55, 48, 48);
    }

    // Amount & Name
    fill(...color.yellow());
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text(`+${opt.amount} ${opt.lootType}`, cardW / 2, 105);

    // Description
    fill(...color.white(210));
    textSize(11.5);
    textStyle(NORMAL);
    text(opt.lootType === 'elixir' ? 'Extra Elixir' : 'Extra Sun', cardW / 2, 130);

    // Claim Button: ONLY appears on card hover, perfectly centered inside card with no offset
    const btnW = 140;
    const btnH = 32;
    const btnX = (cardW - btnW) / 2;
    const btnY = cardH - btnH - 14;

    if (isHovered) {
      drawYellowButton(btnX, btnY, btnW, btnH, 'CLAIM', {
        id: `btn_loot_opt_${i}`,
        fontSize: 13,
        radius: 8,
        depth3D: 2,
        hitboxX: cx + btnX,
        hitboxY: cardY + btnY + slideY,
        layer: 255,
        onClick: () => {
          applyLootChoice(modal.nodeId, opt);
        }
      });
    }

    pop();
  }
}

function applyUpgradeChoice(nodeId: string, opt: any) {
  if (state.turretUnlockTree?.nodes) {
    const node = state.turretUnlockTree.nodes.get ? state.turretUnlockTree.nodes.get(nodeId) : state.turretUnlockTree.nodes[nodeId];
    if (node) {
      node.upgradeTurretKey = opt.turretKey;
      node.upgradeDescription = opt.description;
      node.isUnlocked = true;
    }
  }

  const tKey = opt.turretKey;
  if (opt.upgradeId && opt.upgradeId !== 'fallback') {
    if (!state.turretUpgrades[tKey]) state.turretUpgrades[tKey] = [];
    
    if (opt.upgradeId === 'u_dmg_20_n_random' || opt.upgradeId === 'u_firerate_20_n_random') {
      if (!state.upgradeData[tKey]) state.upgradeData[tKey] = {};
      if (!state.upgradeData[tKey][opt.upgradeId]) state.upgradeData[tKey][opt.upgradeId] = [];
      const classes = ['c_leaf', 'c_shard', 'c_shell', 'c_fuel', 'c_ice'];
      const rolled = classes[Math.floor(Math.random() * classes.length)];
      state.upgradeData[tKey][opt.upgradeId].push(rolled);
    }

    state.turretUpgrades[tKey].push(opt.upgradeId);
    recalculateAllStats();
  }

  state.turretUnlockChoiceModal = null;
  if (nodeId && nodeId !== 'debug_node') {
    triggerNodeUnlockVFX(nodeId, 'purple');
  }
  soundEngine.playSFX('unlock');
}

function applyLootChoice(nodeId: string, opt: any) {
  if (state.turretUnlockTree?.nodes) {
    const node = state.turretUnlockTree.nodes.get ? state.turretUnlockTree.nodes.get(nodeId) : state.turretUnlockTree.nodes[nodeId];
    if (node) {
      node.lootType = opt.lootType;
      node.lootAmount = opt.amount;
      node.isUnlocked = true;
    }
  }
  if (opt.lootType === 'elixir') {
    state.elixirCurrency = (state.elixirCurrency || 0) + opt.amount;
  } else {
    state.sunCurrency = (state.sunCurrency || 0) + opt.amount;
  }
  state.turretUnlockChoiceModal = null;
  triggerNodeUnlockVFX(nodeId, opt.lootType === 'elixir' ? 'purple' : 'cyan');
  soundEngine.playSFX('unlock');
}

export function handleTurretUnlockChoiceModalClick(mx: number = mouseX, my: number = mouseY): boolean {
  const modal = state.turretUnlockChoiceModal;
  if (!modal) return false;

  const modalW = modal.type === 'upgrade' ? 700 : 500;
  const modalH = modal.type === 'upgrade' ? 290 : 270;
  const modalX = (width - modalW) / 2;
  const modalY = (height - modalH) / 2;
  const openFrame = modal.openedAtFrame || 0;
  const elapsed = frameCount - openFrame;

  // Upgrade cards
  if (modal.type === 'upgrade') {
    const options = modal.options || [];
    const cardW = 195;
    const cardH = 220;
    const gap = 20;
    const totalW = options.length * cardW + (options.length - 1) * gap;
    const startX = modalX + (modalW - totalW) / 2;
    const cardY = modalY + (modalH - cardH) / 2;

    for (let i = 0; i < options.length; i++) {
      const isRevealed = (elapsed - i * 4) >= 10;
      if (!isRevealed) continue;

      const cx = startX + i * (cardW + gap);
      const isCardHovered = mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH;
      // Button only appears and is clickable when card is hovered
      if (isCardHovered) {
        const btnW = 135;
        const btnH = 32;
        const btnX = cx + (cardW - btnW) / 2;
        const btnY = cardY + cardH - btnH - 14;

        // Direct click on the "SELECT" button is required!
        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
          applyUpgradeChoice(modal.nodeId, options[i]);
          return true;
        }
      }
    }
  } else {
    // Loot cards
    const options = modal.options || [];
    const cardW = 195;
    const cardH = 210;
    const gap = 25;
    const totalW = options.length * cardW + (options.length - 1) * gap;
    const startX = modalX + (modalW - totalW) / 2;
    const cardY = modalY + (modalH - cardH) / 2;

    for (let i = 0; i < options.length; i++) {
      const isRevealed = (elapsed - i * 4) >= 10;
      if (!isRevealed) continue;

      const cx = startX + i * (cardW + gap);
      const isCardHovered = mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH;
      // Button only appears and is clickable when card is hovered
      if (isCardHovered) {
        const btnW = 140;
        const btnH = 32;
        const btnX = cx + (cardW - btnW) / 2;
        const btnY = cardY + cardH - btnH - 14;

        // Direct click on the "CLAIM" button is required!
        if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
          applyLootChoice(modal.nodeId, options[i]);
          return true;
        }
      }
    }
  }

  return true; // Consume click while modal is open
}


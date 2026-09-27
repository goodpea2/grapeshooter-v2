import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { drawTurretSprite } from '../../assetTurret';
import { getTurretY } from './turretList';
import {
  drawModalFrame,
  drawYellowButton,
  drawCloseButton,
  setUILayer
} from '../../uiComponents';
import { color } from '../../uiColors';
import { soundEngine } from '../../src/audio/soundEngine';

declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const scale: any;
declare const frameCount: any;
declare const sin: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const rect: any;
declare const ellipse: any;
declare const textAlign: any;
declare const textSize: any;
declare const textStyle: any;
declare const text: any;
declare const abs: any;
declare const mouseX: any;
declare const mouseY: any;
declare const NORMAL: any;
declare const BOLD: any;
declare const CENTER: any;

function map(n: number, start1: number, stop1: number, start2: number, stop2: number) { 
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; 
}

const MODAL_W = 440;
const MODAL_H = 340;

let popupOpenedFrame: number = 0;
let lastPopupTurret: string | null = null;

export function updateUnlockPopup() {
  if (!state.showUnlockPopup || !state.lastUnlockedTurret) {
    lastPopupTurret = null;
    return;
  }

  // Record opened frame when popup first becomes active
  if (state.lastUnlockedTurret !== lastPopupTurret) {
    lastPopupTurret = state.lastUnlockedTurret;
    popupOpenedFrame = state.frames;
  }

  // Auto-scroll Almanac when popup appears
  if (state.unlockPopupTimer === 179 || state.unlockPopupTimer === 299) {
    const targetY = getTurretY(state.lastUnlockedTurret);
    state.almanacScrollY = -Math.max(0, targetY - 100);
    state.almanacSelectedTurret = state.lastUnlockedTurret;
  }
}

export function drawUnlockPopup() {
  if (!state.showUnlockPopup || !state.lastUnlockedTurret) return;

  const tr = turretTypes[state.lastUnlockedTurret];
  if (!tr) return;

  const modalX = (width - MODAL_W) / 2;
  const modalY = (height - MODAL_H) / 2;

  push();
  setUILayer(200);

  // Modal Frame & Backdrop using design tokens
  drawModalFrame(modalX, modalY, MODAL_W, MODAL_H, {
    title: 'NEW TURRET UNLOCKED!',
    onClose: () => {
      state.showUnlockPopup = false;
      soundEngine.playSFX('btn_click');
    },
    radius: 28,
    borderWidth: 4,
    dimAlpha: 190,
    layer: 200
  });

  // Center Content Anchor
  const centerX = modalX + MODAL_W / 2;
  const centerY = modalY + 150;

  // Pedestal shadow under turret
  noStroke();
  fill(...color.black(140));
  ellipse(centerX, centerY + 36, 96, 20);

  // Turret Sprite with bounce animation
  push();
  const hopVal = abs(sin(frameCount * 0.12)) * 8;
  translate(centerX, centerY - hopVal);

  const isSoft = tr.animationBodyType === 'soft';
  const breatheRate = isSoft ? 0.1 : 0.06;
  const breatheAmp = isSoft ? 0.05 : 0.03;
  const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
  const animScaleX = 1.0 / animScaleY;
  const hopStretch = 1.0 + (hopVal / 80);
  scale(animScaleX * 2.2 / hopStretch, animScaleY * 2.2 * hopStretch);

  const dummyTurret = {
    type: state.lastUnlockedTurret,
    config: tr,
    angle: 0,
    alpha: 255,
    actionTimers: new Map(),
    flashTimer: 0,
    recoil: 0,
    fireRateMultiplier: 1.0,
    uid: 'unlock_popup_sprite'
  };
  drawTurretSprite(dummyTurret);
  pop();

  // Turret Name
  noStroke();
  fill(...color.yellow());
  textAlign(CENTER, CENTER);
  textSize(22);
  textStyle(BOLD);
  text(tr.name, centerX, modalY + 230);

  const btnW = 180;
  const btnH = 40;
  const btnX = centerX - btnW / 2;
  const btnY = modalY + MODAL_H - btnH - 18;

  drawYellowButton(btnX, btnY, btnW, btnH, 'CONTINUE', {
    id: 'btn_unlock_popup_confirm',
    fontSize: 15,
    radius: 10,
    layer: 205,
    onClick: () => {
      state.showUnlockPopup = false;
    }
  });

  pop();
}

export function handleUnlockPopupClick(mx: number = mouseX, my: number = mouseY): boolean {
  if (!state.showUnlockPopup) return false;

  // Prevent instant dismissal on the mouse-up of the click that triggered the unlock
  if (state.frames <= popupOpenedFrame + 8) {
    return true; // Consume event to protect popup from premature dismissal
  }

  const modalX = (width - MODAL_W) / 2;
  const modalY = (height - MODAL_H) / 2;

  // Check Close Button Hit
  const closeBtnSize = 30;
  const closeX = modalX + MODAL_W - closeBtnSize - 18;
  const closeY = modalY + 14;
  if (mx >= closeX && mx <= closeX + closeBtnSize && my >= closeY && my <= closeY + closeBtnSize) {
    state.showUnlockPopup = false;
    soundEngine.playSFX('btn_click');
    return true;
  }

  // Check Action Button Hit
  const centerX = modalX + MODAL_W / 2;
  const btnW = 180;
  const btnH = 40;
  const btnX = centerX - btnW / 2;
  const btnY = modalY + MODAL_H - btnH - 18;
  if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
    state.showUnlockPopup = false;
    soundEngine.playSFX('btn_click');
    return true;
  }

  // Clicking backdrop outside modal closes the popup
  if (mx < modalX || mx > modalX + MODAL_W || my < modalY || my > modalY + MODAL_H) {
    state.showUnlockPopup = false;
    soundEngine.playSFX('btn_click');
    return true;
  }

  return true;
}

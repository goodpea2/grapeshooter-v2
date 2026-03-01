import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { drawTurretSprite } from '../../assetTurret';
import { getTurretY } from './turretList';

declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const scale: any;
declare const rotate: any;
declare const frameCount: any;
declare const sin: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const rectMode: any;
declare const CENTER: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const dist: any;
declare const abs: any;

function map(n: number, start1: number, stop1: number, start2: number, stop2: number) { 
  return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2; 
}

export function drawUnlockPopup() {
  if (!state.showUnlockPopup || !state.lastUnlockedTurret) return;

  state.unlockPopupTimer--;
  if (state.unlockPopupTimer <= 0) {
    state.showUnlockPopup = false;
    return;
  }

  // Auto-scroll Almanac when popup appears
  if (state.unlockPopupTimer === 179) {
    const targetY = getTurretY(state.lastUnlockedTurret);
    state.almanacScrollY = -Math.max(0, targetY - 100);
    state.almanacSelectedTurret = state.lastUnlockedTurret;
  }

  const tr = turretTypes[state.lastUnlockedTurret];
  if (!tr) return;

  push();
  const alpha = state.unlockPopupTimer > 30 ? 255 : map(state.unlockPopupTimer, 0, 30, 0, 255);
  
  // Overlay
  noStroke();
  fill(0, 0, 0, map(alpha, 0, 255, 0, 180));
  rect(0, 0, width, height);

  translate(width / 2, height / 2);
  
  // Entrance Animation
  const scaleVal = state.unlockPopupTimer > 150 ? map(state.unlockPopupTimer, 180, 150, 0.75, 1) : 1;
  scale(scaleVal);

  // Modal
  stroke(255, 200, 50, alpha);
  strokeWeight(6);
  fill(27, 31, 57, alpha);
  rectMode(CENTER);
  rect(0, 0, 400, 300, 40);

  // Title
  noStroke();
  fill(255, 255, 255, alpha);
  textAlign(CENTER, CENTER);
  textSize(24);
  text("NEW PLANT UNLOCKED!", 0, -100);

  // Turret Sprite
  push();
  const hopVal = abs(sin(frameCount * 0.15)) * 10;
  translate(0, -10 - hopVal);
  const isSoft = tr.animationBodyType === 'soft';
  const breatheRate = isSoft ? 0.1 : 0.06;
  const breatheAmp = isSoft ? 0.05 : 0.03;
  const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
  const animScaleX = 1.0 / animScaleY;
  
  // Stretch when hopping
  const hopStretch = 1.0 + (hopVal / 100);
  scale(animScaleX * 2 / hopStretch, animScaleY * 2 * hopStretch);
  
  const dummyTurret = {
    type: state.lastUnlockedTurret,
    config: tr,
    angle: 0,
    alpha: alpha,
    actionTimers: new Map(),
    flashTimer: 0,
    recoil: 0,
    fireRateMultiplier: 1.0,
    uid: 'unlock_popup_sprite'
  };
  drawTurretSprite(dummyTurret);
  pop();

  // Name
  fill(255, 230, 100, alpha);
  textSize(24);
  text(tr.name, 0, 80);

  // Hint
  fill(200, 200, 200, alpha);
  textSize(14);
  text(" ", 0, 115);

  pop();
}

export function handleUnlockPopupClick(): boolean {
  if (!state.showUnlockPopup) return false;
  state.showUnlockPopup = false;
  return true;
}

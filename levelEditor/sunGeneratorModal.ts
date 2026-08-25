import { state } from '../state';
import { Block } from '../world';
import { CHUNK_SIZE } from '../constants';
import {
  drawModalFrame,
  drawCard,
  drawRedButton,
  drawGreenButton,
  drawYellowButton,
  drawCloseButton,
  registerUIHitbox
} from '../uiComponents';
import { color } from '../uiColors';
import {
  TextSelectionState,
  createTextSelectionState,
  getSelectionRange,
  getCharIndexAtX,
  insertTextAtCursor,
  handleBackspace,
  handleDelete,
  handleArrowKey,
  selectAllText
} from './textEditUtils';

declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const textWidth: any;
declare const textStyle: any;
declare const text: any;
declare const rect: any;
declare const line: any;
declare const image: any;
declare const imageMode: any;
declare const rectMode: any;
declare const CENTER: any;
declare const LEFT: any;
declare const TOP: any;
declare const CORNER: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const frameCount: any;

export interface SunGeneratorModalState {
  block: Block | null;
  gx?: number;
  gy?: number;
  damageState: TextSelectionState;
  maxSunState: TextSelectionState;
  activeField: 'damage' | 'maxSun';
  isOpen: boolean;
}

export let sunGeneratorModal: SunGeneratorModalState = {
  block: null,
  damageState: createTextSelectionState('600'),
  maxSunState: createTextSelectionState('100'),
  activeField: 'damage',
  isOpen: false
};

export function isSunGeneratorModalOpen(): boolean {
  return sunGeneratorModal.isOpen;
}

export function openSunGeneratorModal(block: Block) {
  const currentDamage = block.sunGeneratorConfig?.damagePerSun ?? 600;
  const currentMaxSun = block.sunGeneratorConfig?.maxSun ?? 100;

  sunGeneratorModal = {
    block,
    gx: block.gx,
    gy: block.gy,
    damageState: createTextSelectionState(`${currentDamage}`),
    maxSunState: createTextSelectionState(`${currentMaxSun}`),
    activeField: 'damage',
    isOpen: true
  };

  selectAllText(sunGeneratorModal.damageState);

  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.editingSunGeneratorModal = true;
  }
}

export function openSunGeneratorModalAt(gx: number, gy: number) {
  if (!state.world) return;
  const block = state.world.getBlock(gx, gy);
  if (block) {
    openSunGeneratorModal(block);
  }
}

export function closeSunGeneratorModal() {
  sunGeneratorModal.isOpen = false;
  sunGeneratorModal.block = null;
  if (state.levelEditor) {
    state.levelEditor.editingSunGeneratorModal = false;
    state.levelEditor.isWorldDragActive = false;
  }
  state.suppressGameplayMouseUntilRelease = true;
}

export function saveSunGeneratorModal() {
  if (!sunGeneratorModal.block || !sunGeneratorModal.isOpen) return;

  const b = sunGeneratorModal.block;
  const parsedDmg = Math.max(10, parseInt(sunGeneratorModal.damageState.text, 10) || 600);
  const parsedMaxSun = Math.max(1, parseInt(sunGeneratorModal.maxSunState.text, 10) || 100);

  b.sunGeneratorConfig = {
    damagePerSun: parsedDmg,
    maxSun: parsedMaxSun,
    accumulatedDamage: 0,
    sunsDropped: 0
  };

  if (state.world) {
    const cx = Math.floor(b.gx / CHUNK_SIZE);
    const cy = Math.floor(b.gy / CHUNK_SIZE);
    state.world.dirtyChunkAndNeighbors(cx, cy);
  }

  closeSunGeneratorModal();
}

/**
 * Renders the Sun Generator Config modal popup using uiComponents.
 */
export function drawSunGeneratorModal() {
  if (!sunGeneratorModal.isOpen || !sunGeneratorModal.block) return;

  const modalW = 360;
  const modalH = 320;
  const modalX = (width - modalW) / 2;
  const modalY = (height - modalH) / 2;
  const layer = 120;

  push();

  // 1. Modal Frame with dimAlpha
  drawModalFrame(modalX, modalY, modalW, modalH, {
    title: 'Sun Generator Config',
    onClose: () => {
      closeSunGeneratorModal();
    },
    radius: 20,
    layer,
    dimAlpha: 180
  });

  // Top Sun Generator Visual Banner
  const iconY = modalY + 54;
  const iconSprite = state.assets['img_sun_generator'];
  if (iconSprite) {
    imageMode(CENTER);
    image(iconSprite, modalX + modalW / 2, iconY, 40, 40);
  }

  // Subtitle
  textAlign(CENTER, TOP);
  textSize(10.5);
  fill(180, 200, 235);
  noStroke();
  text(`Configure instance at (${sunGeneratorModal.block.gx}, ${sunGeneratorModal.block.gy})`, modalX + modalW / 2, iconY + 24);

  // Row 1: Damage Per Sun
  const row1Y = modalY + 112;
  renderSunInputRow(
    modalX + 20, row1Y, modalW - 40, 44,
    'Damage / Sun',
    sunGeneratorModal.damageState,
    sunGeneratorModal.activeField === 'damage',
    'dmg',
    50,
    () => {
      const cur = parseInt(sunGeneratorModal.damageState.text, 10) || 600;
      sunGeneratorModal.damageState.text = `${Math.max(10, cur - 50)}`;
      sunGeneratorModal.activeField = 'damage';
      selectAllText(sunGeneratorModal.damageState);
    },
    () => {
      const cur = parseInt(sunGeneratorModal.damageState.text, 10) || 600;
      sunGeneratorModal.damageState.text = `${Math.min(99999, cur + 50)}`;
      sunGeneratorModal.activeField = 'damage';
      selectAllText(sunGeneratorModal.damageState);
    },
    () => {
      sunGeneratorModal.activeField = 'damage';
    },
    layer + 5,
    'sg_row_dmg'
  );

  // Row 2: Max Sun Dropped
  const row2Y = row1Y + 56;
  renderSunInputRow(
    modalX + 20, row2Y, modalW - 40, 44,
    'Max Sun Dropped',
    sunGeneratorModal.maxSunState,
    sunGeneratorModal.activeField === 'maxSun',
    'sun',
    10,
    () => {
      const cur = parseInt(sunGeneratorModal.maxSunState.text, 10) || 100;
      sunGeneratorModal.maxSunState.text = `${Math.max(1, cur - 10)}`;
      sunGeneratorModal.activeField = 'maxSun';
      selectAllText(sunGeneratorModal.maxSunState);
    },
    () => {
      const cur = parseInt(sunGeneratorModal.maxSunState.text, 10) || 100;
      sunGeneratorModal.maxSunState.text = `${Math.min(9999, cur + 10)}`;
      sunGeneratorModal.activeField = 'maxSun';
      selectAllText(sunGeneratorModal.maxSunState);
    },
    () => {
      sunGeneratorModal.activeField = 'maxSun';
    },
    layer + 5,
    'sg_row_maxsun'
  );

  // Action Buttons (Discard & Save)
  const btnW = 140;
  const btnH = 38;
  const btnDiscX = modalX + 24;
  const btnDiscY = modalY + modalH - 52;

  drawRedButton(btnDiscX, btnDiscY, btnW, btnH, 'Discard', {
    id: 'sg_btn_discard',
    layer: layer + 5,
    fontSize: 14,
    radius: 10,
    depth3D: 3,
    onClick: () => {
      closeSunGeneratorModal();
    }
  });

  const btnSaveX = modalX + modalW - 24 - btnW;
  const btnSaveY = btnDiscY;

  drawGreenButton(btnSaveX, btnSaveY, btnW, btnH, 'SAVE', {
    id: 'sg_btn_save',
    layer: layer + 5,
    fontSize: 14,
    radius: 10,
    depth3D: 3,
    onClick: () => {
      saveSunGeneratorModal();
    }
  });

  pop();
}

function renderSunInputRow(
  x: number, y: number, w: number, h: number,
  label: string,
  stateObj: TextSelectionState,
  isActive: boolean,
  unitLabel: string,
  stepAmt: number,
  onDec: () => void,
  onInc: () => void,
  onSelect: () => void,
  layer: number,
  rowId: string
) {
  const btnSize = 34;
  const labelW = 110;
  const boxX = x + labelW;
  const boxW = w - labelW;

  // Label
  textAlign(LEFT, CENTER);
  textSize(11);
  textStyle(BOLD);
  fill(isActive ? [0, 220, 255] : [200, 220, 245]);
  noStroke();
  text(label, x, y + h / 2);

  // Container Box for stepper
  rectMode(CORNER);
  fill(...color.veryDarkBlue());
  stroke(isActive ? [0, 200, 255] : [50, 65, 100]);
  strokeWeight(isActive ? 1.5 : 1);
  rect(boxX, y + (h - 38) / 2, boxW, 38, 6);
  noStroke();

  // Minus Button
  const btnMinusX = boxX + 3;
  const btnMinusY = y + (h - 30) / 2;
  drawRedButton(btnMinusX, btnMinusY, 30, 30, '-', {
    id: `${rowId}_dec`,
    layer: layer + 2,
    fontSize: 16,
    radius: 4,
    depth3D: 2,
    onClick: onDec
  });

  // Plus Button
  const btnPlusX = boxX + boxW - 30 - 3;
  const btnPlusY = btnMinusY;
  drawGreenButton(btnPlusX, btnPlusY, 30, 30, '+', {
    id: `${rowId}_inc`,
    layer: layer + 2,
    fontSize: 16,
    radius: 4,
    depth3D: 2,
    onClick: onInc
  });

  // Center Value Box
  const inputAreaX = btnMinusX + 34;
  const inputAreaW = btnPlusX - inputAreaX - 4;
  const numCenterX = inputAreaX + inputAreaW / 2;
  const numCenterY = y + h / 2;

  const rawText = stateObj.text;
  textSize(14);
  textStyle(BOLD);
  const fullTextW = textWidth(rawText);
  const textStartX = numCenterX - fullTextW / 2;

  const { start, end, hasSelection } = getSelectionRange(stateObj);

  if (isActive && hasSelection) {
    const selSubStart = rawText.substring(0, start);
    const selSubLen = rawText.substring(start, end);
    const selStartX = textStartX + textWidth(selSubStart);
    const selW = textWidth(selSubLen);

    fill(...color.cyan(140));
    noStroke();
    rect(selStartX - 1, numCenterY - 10, selW + 2, 20, 2);
  }

  fill(isActive ? [255, 240, 100] : [220, 230, 245]);
  noStroke();
  textAlign(LEFT, CENTER);
  text(rawText, textStartX, numCenterY);

  if (isActive && !hasSelection && Math.floor(frameCount / 30) % 2 === 0) {
    const cursorSub = rawText.substring(0, stateObj.cursor);
    const cursorX = textStartX + textWidth(cursorSub);
    stroke(...color.white(220));
    strokeWeight(2);
    line(cursorX, numCenterY - 8, cursorX, numCenterY + 8);
    noStroke();
  }

  // Clickable hitbox for the editable number area
  registerUIHitbox({
    id: `${rowId}_input_hitbox`,
    x: inputAreaX,
    y: y + (h - 38) / 2,
    w: inputAreaW,
    h: 38,
    layer: layer + 2,
    onClick: () => {
      onSelect();
      selectAllText(stateObj);
    }
  });
}

export function handleSunGeneratorModalClick(): boolean {
  if (!sunGeneratorModal.isOpen) return false;
  return true;
}

export function handleSunGeneratorModalRelease() {
  if (!sunGeneratorModal.isOpen) return;
  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
  }
}

export function handleSunGeneratorModalKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (!sunGeneratorModal.isOpen) return false;

  const activeState = sunGeneratorModal.activeField === 'damage' ? sunGeneratorModal.damageState : sunGeneratorModal.maxSunState;

  // Enter saves & closes
  if (keyCodeNum === 13) {
    saveSunGeneratorModal();
    return true;
  }

  // Escape discards & closes
  if (keyCodeNum === 27) {
    closeSunGeneratorModal();
    return true;
  }

  // Tab toggles between damage and maxSun
  if (keyCodeNum === 9) {
    sunGeneratorModal.activeField = sunGeneratorModal.activeField === 'damage' ? 'maxSun' : 'damage';
    const nextState = sunGeneratorModal.activeField === 'damage' ? sunGeneratorModal.damageState : sunGeneratorModal.maxSunState;
    selectAllText(nextState);
    if (event?.preventDefault) event.preventDefault();
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    handleBackspace(activeState);
    return true;
  }

  // Delete
  if (keyCodeNum === 46) {
    handleDelete(activeState);
    return true;
  }

  // Arrow Keys
  if (keyCodeNum === 37) { // Left
    handleArrowKey(activeState, 'left', !!event?.shiftKey);
    return true;
  }
  if (keyCodeNum === 39) { // Right
    handleArrowKey(activeState, 'right', !!event?.shiftKey);
    return true;
  }

  // Select all (Ctrl+A / Cmd+A)
  if ((event?.ctrlKey || event?.metaKey) && (keyStr === 'a' || keyStr === 'A')) {
    selectAllText(activeState);
    return true;
  }

  // Number input
  if (keyStr && keyStr.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (keyStr >= '0' && keyStr <= '9') {
      if (activeState.text.length < 6) {
        insertTextAtCursor(activeState, keyStr);
      }
      return true;
    }
  }

  return true;
}

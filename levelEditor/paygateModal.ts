import { state } from '../state';
import { PayGateGroup } from '../world';
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
declare const CORNER: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const frameCount: any;

export const AVAILABLE_PAYGATE_RESOURCES = [
  'soil', 'sun', 'raisin', 'elixir', 'ice',
  'fuel', 'shell', 'shard', 'leaf', 'health'
];

export interface PayGateModalState {
  group: PayGateGroup | null;
  selectedResource: string;
  amountState: TextSelectionState;
  isOpen: boolean;
}

export let paygateModal: PayGateModalState = {
  group: null,
  selectedResource: 'soil',
  amountState: createTextSelectionState('10'),
  isOpen: false
};

export function openPayGateCostModal(group: PayGateGroup) {
  const curRes = group.config?.resource || 'soil';
  const curAmt = `${group.config?.amount || 10}`;

  paygateModal = {
    group,
    selectedResource: curRes,
    amountState: createTextSelectionState(curAmt),
    isOpen: true
  };

  selectAllText(paygateModal.amountState);

  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.editingPaygateModal = true;
  }
}

export function closePayGateCostModal() {
  paygateModal.isOpen = false;
  paygateModal.group = null;
  if (state.levelEditor) {
    state.levelEditor.editingPaygateModal = false;
    state.levelEditor.isWorldDragActive = false;
  }
  state.suppressGameplayMouseUntilRelease = true;
}

export function savePayGateCostModal() {
  if (!paygateModal.group || !paygateModal.isOpen) return;

  const grp = paygateModal.group;
  const parsedAmt = Math.max(1, parseInt(paygateModal.amountState.text, 10) || 1);
  const chosenRes = paygateModal.selectedResource || 'soil';

  grp.config.resource = chosenRes;
  grp.config.amount = parsedAmt;
  grp.config.spent = 0; // reset spent on redesign

  // Sync all blocks in the cluster
  for (const b of grp.blocks) {
    b.paygateConfig = {
      resource: chosenRes,
      amount: parsedAmt,
      spent: 0
    };
    if (state.world) {
      const cx = Math.floor(b.gx / 16);
      const cy = Math.floor(b.gy / 16);
      state.world.dirtyChunkAndNeighbors(cx, cy);
    }
  }

  if (state.world) {
    state.world.markPayGateGroupsDirty();
  }

  closePayGateCostModal();
}

/**
 * Renders the PayGate Cost modal popup using uiComponents.
 */
export function drawPayGateCostModal() {
  if (!paygateModal.isOpen || !paygateModal.group) return;

  const modalW = 340;
  const modalH = 310;
  const modalX = Math.round((width - modalW) / 2);
  const modalY = Math.round((height - modalH) / 2);
  const layer = 140;

  push();
  // 1. Standard Modal Frame with CloseButton [X]
  drawModalFrame(modalX, modalY, modalW, modalH, {
    title: 'Edit gate cost',
    onClose: () => closePayGateCostModal(),
    radius: 24,
    layer,
    dimAlpha: 180
  });

  // 2. 2x5 Resource Icons Grid
  const slotW = 44;
  const slotH = 44;
  const gapX = 10;
  const gapY = 8;
  const totalGridW = 5 * slotW + 4 * gapX; // 260px
  const gridStartX = modalX + (modalW - totalGridW) / 2;
  const row1Y = modalY + 60;
  const row2Y = row1Y + slotH + gapY;

  for (let i = 0; i < 10; i++) {
    const resKey = AVAILABLE_PAYGATE_RESOURCES[i];
    const col = i % 5;
    const row = Math.floor(i / 5);
    const slotX = gridStartX + col * (slotW + gapX);
    const slotY = row === 0 ? row1Y : row2Y;
    const isSelected = paygateModal.selectedResource === resKey;

    // Use drawCard with registered click
    drawCard(slotX, slotY, slotW, slotH, {
      id: `pg_res_${resKey}`,
      radius: 8,
      isSelected,
      isHoverable: true,
      bgColor: isSelected ? [30, 42, 80, 255] : [15, 18, 35, 200],
      layer: layer + 5,
      onClick: () => {
        paygateModal.selectedResource = resKey;
      }
    });

    // Resource Icon
    const iconKey = `img_icon_${resKey}`;
    const iconSprite = state.assets[iconKey] || state.assets['img_icon_soil'];
    if (iconSprite) {
      imageMode(CENTER);
      image(iconSprite, slotX + slotW / 2, slotY + slotH / 2, slotW - 6, slotH - 6);
    }
  }

  // 3. Amount Stepper / Input Row
  const amtBoxX = modalX + 24;
  const amtBoxY = modalY + 172;
  const amtBoxW = modalW - 48;
  const amtBoxH = 44;
  const btnSize = 36;

  // Dark amount container
  rectMode(CORNER);
  fill(...color.veryDarkBlue());
  stroke(...color.lightBlue(100));
  strokeWeight(1);
  rect(amtBoxX, amtBoxY, amtBoxW, amtBoxH, 8);
  noStroke();

  // Decrement [-] Button using drawRedButton
  const btnMinusX = amtBoxX + 4;
  const btnMinusY = amtBoxY + (amtBoxH - btnSize) / 2;
  drawRedButton(btnMinusX, btnMinusY, btnSize, btnSize, '-', {
    id: 'pg_amt_dec',
    layer: layer + 5,
    fontSize: 18,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      const curVal = parseInt(paygateModal.amountState.text, 10) || 1;
      const newVal = Math.max(1, curVal - 1);
      paygateModal.amountState.text = `${newVal}`;
      selectAllText(paygateModal.amountState);
    }
  });

  // Increment [+] Button using drawGreenButton
  const btnPlusX = amtBoxX + amtBoxW - btnSize - 4;
  const btnPlusY = amtBoxY + (amtBoxH - btnSize) / 2;
  drawGreenButton(btnPlusX, btnPlusY, btnSize, btnSize, '+', {
    id: 'pg_amt_inc',
    layer: layer + 5,
    fontSize: 18,
    radius: 6,
    depth3D: 2,
    onClick: () => {
      const curVal = parseInt(paygateModal.amountState.text, 10) || 1;
      const newVal = Math.min(9999, curVal + 1);
      paygateModal.amountState.text = `${newVal}`;
      selectAllText(paygateModal.amountState);
    }
  });

  // Center Amount Text Area & Selection
  const numCenterX = amtBoxX + amtBoxW / 2;
  const numCenterY = amtBoxY + amtBoxH / 2;
  const amtText = paygateModal.amountState.text;
  textSize(20);
  textStyle(BOLD);
  const fullTextW = textWidth(amtText);
  const textStartX = numCenterX - fullTextW / 2;

  const { start, end, hasSelection } = getSelectionRange(paygateModal.amountState);

  // Draw Selection Background Highlight if active
  if (hasSelection) {
    const selSubStart = amtText.substring(0, start);
    const selSubLen = amtText.substring(start, end);
    const selStartX = textStartX + textWidth(selSubStart);
    const selW = textWidth(selSubLen);

    fill(...color.cyan(140));
    noStroke();
    rect(selStartX - 1, numCenterY - 12, selW + 2, 24, 2);
  }

  // Draw the Amount Text
  fill(...color.yellow());
  noStroke();
  textAlign(LEFT, CENTER);
  text(amtText, textStartX, numCenterY);

  // Draw Blinking Cursor if no selection active
  if (!hasSelection && Math.floor(frameCount / 30) % 2 === 0) {
    const cursorSub = amtText.substring(0, paygateModal.amountState.cursor);
    const cursorX = textStartX + textWidth(cursorSub);
    stroke(...color.white(220));
    strokeWeight(2);
    line(cursorX, numCenterY - 10, cursorX, numCenterY + 10);
    noStroke();
  }

  // 4. Action Buttons (Discard & SAVE) using uiComponents
  const btnW = 130;
  const btnH = 38;
  const btnDiscX = modalX + 24;
  const btnDiscY = modalY + 242;

  drawRedButton(btnDiscX, btnDiscY, btnW, btnH, 'Discard', {
    id: 'pg_btn_discard',
    layer: layer + 5,
    fontSize: 14,
    radius: 10,
    depth3D: 3,
    onClick: () => {
      closePayGateCostModal();
    }
  });

  const btnSaveX = modalX + modalW - 24 - btnW;
  const btnSaveY = modalY + 242;

  drawYellowButton(btnSaveX, btnSaveY, btnW, btnH, 'SAVE', {
    id: 'pg_btn_save',
    layer: layer + 5,
    fontSize: 14,
    radius: 10,
    depth3D: 3,
    onClick: () => {
      savePayGateCostModal();
    }
  });

  textStyle(NORMAL);
  pop();
}

/**
 * Handles mouse presses inside PayGate Cost Modal (text drag initiation).
 */
export function handlePayGateCostModalPress(): boolean {
  if (!paygateModal.isOpen || !paygateModal.group) return false;

  const modalW = 340;
  const modalH = 310;
  const modalX = Math.round((width - modalW) / 2);
  const modalY = Math.round((height - modalH) / 2);

  const amtBoxX = modalX + 24;
  const amtBoxY = modalY + 172;
  const amtBoxW = modalW - 48;
  const amtBoxH = 44;

  const btnSize = 36;
  const numAreaX = amtBoxX + btnSize + 4;
  const numAreaW = amtBoxW - (btnSize * 2) - 8;

  // Check Amount Text Area Click (start text selection)
  if (mouseX >= numAreaX && mouseX <= numAreaX + numAreaW && mouseY >= amtBoxY && mouseY <= amtBoxY + amtBoxH) {
    textSize(20);
    textStyle(BOLD);
    const amtText = paygateModal.amountState.text;
    const fullTextW = textWidth(amtText);
    const textStartX = (amtBoxX + amtBoxW / 2) - fullTextW / 2;
    const relX = mouseX - textStartX;
    const idx = getCharIndexAtX(amtText, relX, (s) => textWidth(s));

    paygateModal.amountState.cursor = idx;
    paygateModal.amountState.selStart = idx;
    paygateModal.amountState.selEnd = idx;
    paygateModal.amountState.isDragging = true;
    return true;
  }

  // Block any drag inside modal
  if (mouseX >= modalX && mouseX <= modalX + modalW && mouseY >= modalY && mouseY <= modalY + modalH) {
    return true;
  }

  return true;
}

export function handlePayGateCostModalClick(): boolean {
  if (!paygateModal.isOpen || !paygateModal.group) return false;

  const modalW = 340;
  const modalH = 310;
  const modalX = Math.round((width - modalW) / 2);
  const modalY = Math.round((height - modalH) / 2);

  // Consume any click inside modal
  if (mouseX >= modalX && mouseX <= modalX + modalW && mouseY >= modalY && mouseY <= modalY + modalH) {
    return true;
  }

  // Outside click cancels / closes modal
  closePayGateCostModal();
  return true;
}

/**
 * Handles mouse dragging inside the modal for text selection.
 */
export function handlePayGateCostModalDrag(): boolean {
  if (!paygateModal.isOpen || !paygateModal.amountState.isDragging) return false;

  const modalW = 340;
  const modalX = Math.round((width - modalW) / 2);
  const amtBoxX = modalX + 24;
  const amtBoxW = modalW - 48;

  textSize(20);
  textStyle(BOLD);
  const amtText = paygateModal.amountState.text;
  const fullTextW = textWidth(amtText);
  const textStartX = (amtBoxX + amtBoxW / 2) - fullTextW / 2;
  const relX = mouseX - textStartX;
  const idx = getCharIndexAtX(amtText, relX, (s) => textWidth(s));

  paygateModal.amountState.cursor = idx;
  paygateModal.amountState.selEnd = idx;
  return true;
}

export function handlePayGateCostModalRelease() {
  if (paygateModal.isOpen) {
    paygateModal.amountState.isDragging = false;
  }
}

/**
 * Handles keyboard input for the PayGate Cost Modal.
 */
export function handlePayGateModalKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (!paygateModal.isOpen) return false;

  const isCtrl = event?.ctrlKey || event?.metaKey;
  const isShift = event?.shiftKey;

  // Enter to Save
  if (keyCodeNum === 13) {
    savePayGateCostModal();
    return true;
  }

  // Escape to Discard
  if (keyCodeNum === 27) {
    closePayGateCostModal();
    return true;
  }

  // Ctrl+A / Cmd+A: Select all
  if (isCtrl && (keyStr === 'a' || keyStr === 'A')) {
    selectAllText(paygateModal.amountState);
    return true;
  }

  // Left Arrow
  if (keyCodeNum === 37) {
    handleArrowKey(paygateModal.amountState, 'left', isShift);
    return true;
  }

  // Right Arrow
  if (keyCodeNum === 39) {
    handleArrowKey(paygateModal.amountState, 'right', isShift);
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    handleBackspace(paygateModal.amountState);
    return true;
  }

  // Delete
  if (keyCodeNum === 46) {
    handleDelete(paygateModal.amountState);
    return true;
  }

  // Only allow typing digits 0-9
  if (/^[0-9]$/.test(keyStr)) {
    insertTextAtCursor(paygateModal.amountState, keyStr, 4);
    return true;
  }

  return true;
}


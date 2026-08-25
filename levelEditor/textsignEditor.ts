import { state } from '../state';
import { GRID_SIZE } from '../constants';
import {
  drawGreenButton,
  drawRedButton,
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
declare const triangle: any;
declare const rectMode: any;
declare const line: any;
declare const CENTER: any;
declare const LEFT: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const frameCount: any;

export interface TextSignEditState {
  block: any | null;
  textState: TextSelectionState;
  originalText: string;
  isOpen: boolean;
}

export let textSignEditor: TextSignEditState = {
  block: null,
  textState: createTextSelectionState(''),
  originalText: '',
  isOpen: false
};

export function openTextSignEditor(block: any) {
  const currentText = block.customText || 'Hint';
  textSignEditor = {
    block,
    textState: createTextSelectionState(currentText),
    originalText: currentText,
    isOpen: true
  };

  selectAllText(textSignEditor.textState);

  if (state.levelEditor) {
    state.levelEditor.isWorldDragActive = false;
    state.levelEditor.editingTextSign = true;
  }
}

export function closeTextSignEditor(saveChanges: boolean = false) {
  if (!textSignEditor.isOpen) return;

  if (saveChanges && textSignEditor.block) {
    textSignEditor.block.customText = textSignEditor.textState.text.trim() || 'Hint';
    if (state.world) {
      const cx = Math.floor(textSignEditor.block.gx / 16);
      const cy = Math.floor(textSignEditor.block.gy / 16);
      state.world.dirtyChunkAndNeighbors(cx, cy);
    }
  }

  textSignEditor.isOpen = false;
  textSignEditor.block = null;
  if (state.levelEditor) {
    state.levelEditor.editingTextSign = false;
    state.levelEditor.isWorldDragActive = false;
  }
  state.suppressGameplayMouseUntilRelease = true;
}

/**
 * Checks if a given world coordinate hits a text sign speech bubble in world space.
 */
export function getTextSignAtWorldPos(wx: number, wy: number): any | null {
  if (!state.world) return null;

  let foundBlock = null;
  state.world.chunks.forEach((chunk: any) => {
    for (const b of chunk.blocks) {
      if (!b.isMined && b.overlay === 'ov_textsign') {
        const rawText = b.customText || 'Hint';
        textSize(10);
        const tw = Math.max(40, textWidth(rawText) + 16);
        const th = 22;
        const bcx = b.pos.x + GRID_SIZE / 2;
        const bcy = b.pos.y - 14;

        if (
          wx >= bcx - tw / 2 &&
          wx <= bcx + tw / 2 &&
          wy >= bcy - th / 2 &&
          wy <= bcy + th / 2 + 6
        ) {
          foundBlock = b;
          return;
        }
      }
    }
  });

  return foundBlock;
}

/**
 * Draws the active inline TextSign speech bubble editor with selection highlight and save/discard buttons.
 * This is rendered inside the world-camera transform.
 */
export function drawInlineTextSignEditor(mWorldX: number, mWorldY: number) {
  if (!textSignEditor.isOpen || !textSignEditor.block) return;

  const b = textSignEditor.block;
  const currentText = textSignEditor.textState.text;
  const bcx = b.pos.x + GRID_SIZE / 2;
  const bcy = b.pos.y - 14;

  const zoom = state.levelEditor?.cameraZoom || 1.0;
  const camX = state.cameraPos?.x ?? (width / 2);
  const camY = state.cameraPos?.y ?? (height / 2);

  push();
  textSize(11);
  textStyle(BOLD);
  const fullTextW = textWidth(currentText);
  const bubbleW = Math.max(56, fullTextW + 18);
  const bubbleH = 24;

  // 1. Draw speech bubble tail
  fill(...color.veryDarkBlue());
  stroke(...color.yellow()); // Golden active edit outline
  strokeWeight(1.5);
  triangle(bcx - 4, bcy + bubbleH / 2, bcx + 4, bcy + bubbleH / 2, bcx, bcy + bubbleH / 2 + 5);

  // 2. Draw speech bubble box
  rectMode(CENTER);
  fill(...color.veryDarkBlue());
  stroke(...color.yellow());
  strokeWeight(1.5);
  rect(bcx, bcy, bubbleW, bubbleH, 6);

  // 3. Draw text and drag selection
  const textStartX = bcx - fullTextW / 2;
  const { start, end, hasSelection } = getSelectionRange(textSignEditor.textState);

  if (hasSelection) {
    const selSubStart = currentText.substring(0, start);
    const selSubLen = currentText.substring(start, end);
    const selStartX = textStartX + textWidth(selSubStart);
    const selW = textWidth(selSubLen);

    fill(...color.cyan(150));
    noStroke();
    rect(selStartX + selW / 2, bcy, selW + 2, 18, 2);
  }

  // Draw the Text
  fill(...color.yellow());
  noStroke();
  textAlign(LEFT, CENTER);
  text(currentText, textStartX, bcy);

  // Blinking cursor if no selection
  if (!hasSelection && Math.floor(frameCount / 30) % 2 === 0) {
    const cursorSub = currentText.substring(0, textSignEditor.textState.cursor);
    const cursorX = textStartX + textWidth(cursorSub);
    stroke(...color.white(220));
    strokeWeight(1.5);
    line(cursorX, bcy - 7, cursorX, bcy + 7);
  }

  // 4. Draw nearby Action Buttons (SAVE & DISCARD) above the bubble
  const btnW = 54;
  const btnH = 20;
  const gap = 8;
  const totalBtnW = btnW * 2 + gap;
  const btnsStartX = bcx - totalBtnW / 2;
  const btnsY = bcy - bubbleH / 2 - btnH - 6;

  // SAVE Button (Green)
  const saveX = btnsStartX;
  drawGreenButton(saveX, btnsY, btnW, btnH, '✓ SAVE', {
    id: 'ts_btn_save',
    layer: 110,
    fontSize: 9.5,
    radius: 4,
    depth3D: 2,
    onClick: () => {
      closeTextSignEditor(true);
    }
  });

  // DISCARD Button (Red)
  const discX = btnsStartX + btnW + gap;
  drawRedButton(discX, btnsY, btnW, btnH, '✕ DISCARD', {
    id: 'ts_btn_disc',
    layer: 110,
    fontSize: 9.5,
    radius: 4,
    depth3D: 2,
    onClick: () => {
      closeTextSignEditor(false);
    }
  });

  // Register Screen-space hitboxes for modular click interactions
  const saveScreenX = (saveX - camX) * zoom + width / 2;
  const saveScreenY = (btnsY - camY) * zoom + height / 2;
  registerUIHitbox({
    id: 'ts_btn_save_screen',
    x: saveScreenX,
    y: saveScreenY,
    w: btnW * zoom,
    h: btnH * zoom,
    layer: 110,
    onClick: () => {
      closeTextSignEditor(true);
    }
  });

  const discScreenX = (discX - camX) * zoom + width / 2;
  const discScreenY = (btnsY - camY) * zoom + height / 2;
  registerUIHitbox({
    id: 'ts_btn_disc_screen',
    x: discScreenX,
    y: discScreenY,
    w: btnW * zoom,
    h: btnH * zoom,
    layer: 110,
    onClick: () => {
      closeTextSignEditor(false);
    }
  });

  textStyle(NORMAL);
  pop();
}

/**
 * Handles mouse press for inline TextSign editor in world coordinates (e.g. initiating cursor position or text drag selection).
 */
export function handleInlineTextSignPress(mWorldX: number, mWorldY: number): boolean {
  if (!textSignEditor.isOpen || !textSignEditor.block) return false;

  const b = textSignEditor.block;
  const bcx = b.pos.x + GRID_SIZE / 2;
  const bcy = b.pos.y - 14;

  textSize(11);
  textStyle(BOLD);
  const currentText = textSignEditor.textState.text;
  const fullTextW = textWidth(currentText);
  const bubbleW = Math.max(56, fullTextW + 18);
  const bubbleH = 24;

  // Check clicking inside speech bubble for cursor / text selection
  if (
    mWorldX >= bcx - bubbleW / 2 &&
    mWorldX <= bcx + bubbleW / 2 &&
    mWorldY >= bcy - bubbleH / 2 &&
    mWorldY <= bcy + bubbleH / 2
  ) {
    const textStartX = bcx - fullTextW / 2;
    const relX = mWorldX - textStartX;
    const idx = getCharIndexAtX(currentText, relX, (s) => textWidth(s));

    textSignEditor.textState.cursor = idx;
    textSignEditor.textState.selStart = idx;
    textSignEditor.textState.selEnd = idx;
    textSignEditor.textState.isDragging = true;
    return true;
  }

  // Absorb press inside or near editor
  return true;
}

/**
 * Handles mouse clicks for inline TextSign editor in world coordinates.
 */
export function handleInlineTextSignClick(mWorldX: number, mWorldY: number): boolean {
  if (!textSignEditor.isOpen || !textSignEditor.block) return false;

  const b = textSignEditor.block;
  const bcx = b.pos.x + GRID_SIZE / 2;
  const bcy = b.pos.y - 14;

  textSize(11);
  textStyle(BOLD);
  const currentText = textSignEditor.textState.text;
  const fullTextW = textWidth(currentText);
  const bubbleW = Math.max(56, fullTextW + 18);
  const bubbleH = 24;

  const btnW = 54;
  const btnH = 20;
  const gap = 8;
  const totalBtnW = btnW * 2 + gap;
  const btnsStartX = bcx - totalBtnW / 2;
  const btnsY = bcy - bubbleH / 2 - btnH - 6;

  // Check SAVE button click
  const saveX = btnsStartX;
  if (mWorldX >= saveX && mWorldX <= saveX + btnW && mWorldY >= btnsY && mWorldY <= btnsY + btnH) {
    closeTextSignEditor(true);
    return true;
  }

  // Check DISCARD button click
  const discX = btnsStartX + btnW + gap;
  if (mWorldX >= discX && mWorldX <= discX + btnW && mWorldY >= btnsY && mWorldY <= btnsY + btnH) {
    closeTextSignEditor(false);
    return true;
  }

  // Check clicking inside speech bubble for cursor / text selection
  if (
    mWorldX >= bcx - bubbleW / 2 &&
    mWorldX <= bcx + bubbleW / 2 &&
    mWorldY >= bcy - bubbleH / 2 &&
    mWorldY <= bcy + bubbleH / 2
  ) {
    return true;
  }

  // Clicking outside saves & closes
  closeTextSignEditor(true);
  return true;
}

/**
 * Handles mouse dragging for inline TextSign text selection in world coordinates.
 */
export function handleInlineTextSignDrag(mWorldX: number, mWorldY: number): boolean {
  if (!textSignEditor.isOpen || !textSignEditor.textState.isDragging || !textSignEditor.block) return false;

  const b = textSignEditor.block;
  const bcx = b.pos.x + GRID_SIZE / 2;

  textSize(11);
  textStyle(BOLD);
  const currentText = textSignEditor.textState.text;
  const fullTextW = textWidth(currentText);
  const textStartX = bcx - fullTextW / 2;
  const relX = mWorldX - textStartX;
  const idx = getCharIndexAtX(currentText, relX, (s) => textWidth(s));

  textSignEditor.textState.cursor = idx;
  textSignEditor.textState.selEnd = idx;
  return true;
}

export function handleInlineTextSignRelease() {
  if (textSignEditor.isOpen) {
    textSignEditor.textState.isDragging = false;
  }
}

/**
 * Handles keyboard input for the inline TextSign editor.
 */
export function handleInlineTextSignKeyInput(keyStr: string, keyCodeNum: number, event?: any): boolean {
  if (!textSignEditor.isOpen) return false;

  const isCtrl = event?.ctrlKey || event?.metaKey;
  const isShift = event?.shiftKey;

  // Enter to Save
  if (keyCodeNum === 13) {
    closeTextSignEditor(true);
    return true;
  }

  // Escape to Discard
  if (keyCodeNum === 27) {
    closeTextSignEditor(false);
    return true;
  }

  // Ctrl+A / Cmd+A: Select all
  if (isCtrl && (keyStr === 'a' || keyStr === 'A')) {
    selectAllText(textSignEditor.textState);
    return true;
  }

  // Left Arrow
  if (keyCodeNum === 37) {
    handleArrowKey(textSignEditor.textState, 'left', isShift);
    return true;
  }

  // Right Arrow
  if (keyCodeNum === 39) {
    handleArrowKey(textSignEditor.textState, 'right', isShift);
    return true;
  }

  // Backspace
  if (keyCodeNum === 8) {
    handleBackspace(textSignEditor.textState);
    return true;
  }

  // Delete
  if (keyCodeNum === 46) {
    handleDelete(textSignEditor.textState);
    return true;
  }

  // Typing character
  if (keyStr && keyStr.length === 1 && !isCtrl) {
    insertTextAtCursor(textSignEditor.textState, keyStr, 100);
    return true;
  }

  return true;
}

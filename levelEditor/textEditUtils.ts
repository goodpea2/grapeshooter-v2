/**
 * Shared text editing and drag-selection utility for canvas input fields.
 */

export interface TextSelectionState {
  text: string;
  cursor: number;
  selStart: number;
  selEnd: number;
  isDragging: boolean;
}

export function createTextSelectionState(initialText: string = ''): TextSelectionState {
  return {
    text: initialText,
    cursor: initialText.length,
    selStart: initialText.length,
    selEnd: initialText.length,
    isDragging: false
  };
}

export function getSelectionRange(state: TextSelectionState): { start: number; end: number; hasSelection: boolean } {
  const start = Math.min(state.selStart, state.selEnd);
  const end = Math.max(state.selStart, state.selEnd);
  return { start, end, hasSelection: start !== end };
}

/**
 * Calculates character index closest to a horizontal offset in a text string.
 */
export function getCharIndexAtX(
  text: string,
  relX: number,
  measureFn: (str: string) => number
): number {
  if (relX <= 0) return 0;
  const fullWidth = measureFn(text);
  if (relX >= fullWidth) return text.length;

  let bestIdx = 0;
  let bestDist = Math.abs(relX);

  for (let i = 1; i <= text.length; i++) {
    const subW = measureFn(text.substring(0, i));
    const dist = Math.abs(relX - subW);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Handles typing a character into the text state, replacing selection if active.
 */
export function insertTextAtCursor(state: TextSelectionState, charToInsert: string, maxLength: number = 100): boolean {
  const { start, end, hasSelection } = getSelectionRange(state);
  let newText = '';

  if (hasSelection) {
    newText = state.text.substring(0, start) + charToInsert + state.text.substring(end);
    if (newText.length > maxLength) return false;
    state.text = newText;
    state.cursor = start + charToInsert.length;
    state.selStart = state.cursor;
    state.selEnd = state.cursor;
    return true;
  } else {
    if (state.text.length + charToInsert.length > maxLength) return false;
    newText = state.text.substring(0, state.cursor) + charToInsert + state.text.substring(state.cursor);
    state.text = newText;
    state.cursor += charToInsert.length;
    state.selStart = state.cursor;
    state.selEnd = state.cursor;
    return true;
  }
}

/**
 * Handles backspace key.
 */
export function handleBackspace(state: TextSelectionState): boolean {
  const { start, end, hasSelection } = getSelectionRange(state);
  if (hasSelection) {
    state.text = state.text.substring(0, start) + state.text.substring(end);
    state.cursor = start;
    state.selStart = start;
    state.selEnd = start;
    return true;
  } else if (state.cursor > 0) {
    state.text = state.text.substring(0, state.cursor - 1) + state.text.substring(state.cursor);
    state.cursor--;
    state.selStart = state.cursor;
    state.selEnd = state.cursor;
    return true;
  }
  return false;
}

/**
 * Handles delete key.
 */
export function handleDelete(state: TextSelectionState): boolean {
  const { start, end, hasSelection } = getSelectionRange(state);
  if (hasSelection) {
    state.text = state.text.substring(0, start) + state.text.substring(end);
    state.cursor = start;
    state.selStart = start;
    state.selEnd = start;
    return true;
  } else if (state.cursor < state.text.length) {
    state.text = state.text.substring(0, state.cursor) + state.text.substring(state.cursor + 1);
    return true;
  }
  return false;
}

/**
 * Handles left/right arrow navigation, with shift-selection support.
 */
export function handleArrowKey(state: TextSelectionState, direction: 'left' | 'right', isShift: boolean) {
  if (direction === 'left') {
    if (isShift) {
      if (state.cursor > 0) {
        state.cursor--;
        state.selEnd = state.cursor;
      }
    } else {
      const { start, hasSelection } = getSelectionRange(state);
      if (hasSelection) {
        state.cursor = start;
      } else if (state.cursor > 0) {
        state.cursor--;
      }
      state.selStart = state.cursor;
      state.selEnd = state.cursor;
    }
  } else if (direction === 'right') {
    if (isShift) {
      if (state.cursor < state.text.length) {
        state.cursor++;
        state.selEnd = state.cursor;
      }
    } else {
      const { end, hasSelection } = getSelectionRange(state);
      if (hasSelection) {
        state.cursor = end;
      } else if (state.cursor < state.text.length) {
        state.cursor++;
      }
      state.selStart = state.cursor;
      state.selEnd = state.cursor;
    }
  }
}

/**
 * Selects all text in the state.
 */
export function selectAllText(state: TextSelectionState) {
  state.selStart = 0;
  state.selEnd = state.text.length;
  state.cursor = state.text.length;
}

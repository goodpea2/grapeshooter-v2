import { state } from './state';
import { color, ColorRGBA } from './uiColors';
import { soundEngine } from './src/audio/soundEngine';

declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const noFill: any;
declare const text: any;
declare const textSize: any;
declare const textStyle: any;
declare const textAlign: any;
declare const textWidth: any;
declare const rect: any;
declare const line: any;
declare const triangle: any;
declare const circle: any;
declare const image: any;
declare const imageMode: any;
declare const rectMode: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const CENTER: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const TOP: any;
declare const CORNER: any;
declare const mouseIsPressed: any;

// ==========================================
// HITBOX REGISTRY SYSTEM
// ==========================================

export interface UIHitbox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: number;
  onClick?: () => void;
  disabled?: boolean;
}

let activeHitboxes: UIHitbox[] = [];
let currentLayer: number = 0;
let pressedHitboxId: string | null = null;
let lastHoveredHitboxId: string | null = null;

export function beginUIFrame() {
  activeHitboxes = [];
  currentLayer = 0;
}

export function setUILayer(layer: number) {
  currentLayer = layer;
}

export function registerUIHitbox(hitbox: Omit<UIHitbox, 'layer'> & { layer?: number }) {
  activeHitboxes.push({
    ...hitbox,
    layer: hitbox.layer !== undefined ? hitbox.layer : currentLayer
  });
}

export function getHitUIElement(mx: number = mouseX, my: number = mouseY): UIHitbox | null {
  const sorted = [...activeHitboxes].sort((a, b) => b.layer - a.layer);
  for (const box of sorted) {
    if (mx >= box.x && mx <= box.x + box.w && my >= box.y && my <= box.y + box.h) {
      return box;
    }
  }
  return null;
}

export function getPressedUIElementId(): string | null {
  return pressedHitboxId;
}

export function setPressedUIElementId(id: string | null) {
  pressedHitboxId = id;
}

/**
 * Call on mousePressed / touchStart to record which UI element was pressed.
 */
export function handleUIMousePress(mx: number = mouseX, my: number = mouseY): boolean {
  const hit = getHitUIElement(mx, my);
  if (hit && !hit.disabled) {
    pressedHitboxId = hit.id;
    return true;
  }
  pressedHitboxId = null;
  return false;
}

/**
 * Call on mouseReleased / touchEnd to execute onClick ONLY if released over the same pressed UI element.
 */
export function handleUIMouseRelease(mx: number = mouseX, my: number = mouseY): boolean {
  const hit = getHitUIElement(mx, my);
  const wasPressedId = pressedHitboxId;
  pressedHitboxId = null;
  if (hit && !hit.disabled && hit.id === wasPressedId && hit.onClick) {
    if (hit.id !== 'btn_pause' && hit.id !== 'btn_menu' && hit.id !== 'btn_speedup') {
      soundEngine.playSFX('btn_click');
    }
    hit.onClick();
    return true;
  }
  return false;
}

export function handleRegisteredUIClick(mx: number = mouseX, my: number = mouseY): boolean {
  return handleUIMouseRelease(mx, my);
}

// ==========================================
// TEXT SELECTION & INPUT STATE INTERFACE
// ==========================================

export interface TextInputState {
  text: string;
  cursor: number;
  selectionStart: number;
  selectionEnd: number;
  isDragging: boolean;
  isFocused: boolean;
}

export function createTextInputState(initialText: string = ''): TextInputState {
  return {
    text: initialText,
    cursor: initialText.length,
    selectionStart: -1,
    selectionEnd: -1,
    isDragging: false,
    isFocused: false
  };
}

// ==========================================
// BUTTON COMPONENT (Almanac UI Art Style)
// ==========================================

export type ButtonVariant = 'yellow' | 'red' | 'green' | 'cyan' | 'purple' | 'blue' | 'dark' | 'gray' | 'ghost';

export interface ButtonOptions {
  id?: string;
  variant?: ButtonVariant;
  fontSize?: number;
  radius?: number;
  depth3D?: number;
  disabled?: boolean;
  isSelected?: boolean;
  isHoveredForce?: boolean;
  isPressedForce?: boolean;
  icon?: any;
  iconSize?: number;
  iconOnly?: boolean;
  layer?: number;
  hitboxX?: number;
  hitboxY?: number;
  onClick?: () => void;
}

interface VariantColorConfig {
  top: ColorRGBA;
  bottom: ColorRGBA;
  textColor: ColorRGBA;
}

function getVariantColors(variant: ButtonVariant): VariantColorConfig {
  switch (variant) {
    case 'yellow':
      return {
        top: color.yellow(), // [255, 194, 0]
        bottom: color.darkYellow(), // [255, 132, 0]
        textColor: color.black()
      };
    case 'red':
      return {
        top: color.red(), // [255, 56, 60]
        bottom: [160, 25, 30, 255],
        textColor: color.white()
      };
    case 'green':
      return {
        top: [0, 105, 65, 255],
        bottom: [20, 64, 47, 255],
        textColor: color.white()
      };
    case 'cyan':
      return {
        top: color.cyan(), // [0, 231, 226]
        bottom: [0, 150, 150, 255],
        textColor: color.black()
      };
    case 'purple':
      return {
        top: [120, 40, 200, 255],
        bottom: [80, 30, 150, 255],
        textColor: color.white()
      };
    case 'blue':
      return {
        top: color.lightBlue(), // [54, 62, 114]
        bottom: color.darkBlue(), // [19, 21, 44]
        textColor: color.white()
      };
    case 'gray':
      return {
        top: color.gray(), // [175, 180, 195]
        bottom: color.darkGray(), // [110, 115, 130]
        textColor: color.black()
      };
    case 'ghost':
      return {
        top: [255, 255, 255, 20],
        bottom: [0, 0, 0, 80],
        textColor: color.white()
      };
    case 'dark':
    default:
      return {
        top: [40, 47, 96, 255],
        bottom: [19, 21, 44, 255],
        textColor: color.white()
      };
  }
}

function mouseIsDown(): boolean {
  if (typeof mouseIsPressed !== 'undefined' && mouseIsPressed) return true;
  return (state as any).isMouseDown || false;
}

/**
 * Renders a tactile 3D Button in the Almanac art style and registers its hitbox.
 * - No strokes by default.
 * - Hovered state: simply reverses the top and bottom colors (no stroke).
 * - Clicked / Pressed state: presses down and renders a thick white perimeter border.
 * - Icons in icon buttons are 50% larger (34px default).
 */
export function drawButton(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string = '',
  options: ButtonOptions = {}
): { isHovered: boolean; isHit: boolean; isPressed: boolean } {
  const {
    id = `btn_${Math.round(x)}_${Math.round(y)}`,
    variant = 'yellow',
    fontSize = 14,
    radius = 12,
    depth3D = 4,
    disabled = false,
    isSelected = false,
    isHoveredForce = false,
    isPressedForce = false,
    icon = null,
    iconSize = 34,
    iconOnly = false,
    layer,
    onClick
  } = options;

  const hitX = options.hitboxX !== undefined ? options.hitboxX : x;
  const hitY = options.hitboxY !== undefined ? options.hitboxY : y;
  const isUnderMouse = !disabled && mouseX >= hitX && mouseX <= hitX + w && mouseY >= hitY && mouseY <= hitY + h;
  const isHovered = isHoveredForce || isUnderMouse;
  const isPressed = !disabled && (isPressedForce || (pressedHitboxId === id && isUnderMouse && mouseIsDown()));

  if (isUnderMouse && lastHoveredHitboxId !== id) {
    lastHoveredHitboxId = id;
    soundEngine.playSFX('levellist_hover');
  }

  registerUIHitbox({
    id,
    x: hitX,
    y: hitY,
    w,
    h,
    layer,
    disabled,
    onClick
  });

  const colors = getVariantColors(variant);

  // Normal: face = top, base = bottom
  // Hover or Pressed: face = bottom, base = top (reversed!)
  const isReversed = isHovered || isPressed;
  const faceColor = isReversed ? colors.bottom : colors.top;
  const baseColor = isReversed ? colors.top : colors.bottom;

  const pressOffset = isPressed ? depth3D : 0;
  const currentDepth = depth3D - pressOffset;

  rectMode(CORNER);

  // 1. Black Drop Shadow
  noStroke();
  fill(...color.black(disabled ? 80 : 220));
  rect(x, y + 4, w, h, radius);

  // 2. 3D Base Layer (depth)
  if (!disabled) {
    fill(...baseColor);
    rect(x, y, w, h, radius);
  } else {
    fill(60, 60, 60);
    rect(x, y, w, h, radius);
  }

  // 3. 3D Top Surface
  const topY = y - currentDepth;
  const topH = h - currentDepth;

  if (disabled) {
    noStroke();
    fill(90, 90, 90);
    rect(x, topY, w, topH, radius);
  } else {
    noStroke();
    fill(...faceColor);
    rect(x, topY, w, topH, radius);
  }

  // 4. White Outer Frame on Pressed / Clicked state (as shown in reference image)
  if (isPressed) {
    noFill();
    stroke(...color.white());
    strokeWeight(4);
    rect(x - 2, y - 2, w + 4, h + 4, radius + 4);
    noStroke();
  } else if (isSelected) {
    noFill();
    stroke(...color.veryLightYellow());
    strokeWeight(4);
    rect(x - 2, y - 2, w + 4, h + 4, radius + 4);
    noStroke();
  }

  // 5. Content (Icon and / or Text) - Text NEVER has a stroke
  noStroke();
  const centerY = topY + topH / 2;

  if (icon) {
    imageMode(CENTER);
    const imgX = iconOnly || !label ? x + w / 2 : x + 24;
    image(icon, imgX, centerY, iconSize, iconSize);
  }

  if (!iconOnly && label) {
    textAlign(icon ? LEFT : CENTER, CENTER);
    textSize(fontSize);
    textStyle(NORMAL);
    noStroke();
    if (disabled) {
      fill(160, 160, 160);
    } else {
      fill(...colors.textColor);
    }
    const textX = icon ? x + 46 : x + w / 2;
    text(label, textX, centerY + 1);
  }

  return { isHovered, isHit: isHovered, isPressed };
}

// Convenience button shortcuts
export const drawYellowButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'yellow' });

export const drawRedButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'red' });

export const drawGreenButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'green' });

export const drawCyanButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'cyan' });

export const drawPurpleButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'purple' });

export const drawDarkButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'dark' });

export const drawGrayButton = (x: number, y: number, w: number, h: number, label: string, opts?: ButtonOptions) =>
  drawButton(x, y, w, h, label, { ...opts, variant: 'gray' });

/**
 * Standard Close Button [X] matching Almanac style
 */
export function drawCloseButton(
  x: number,
  y: number,
  size: number = 34,
  onClose?: () => void,
  options?: { id?: string; layer?: number; isPressedForce?: boolean; isHoveredForce?: boolean }
) {
  const id = options?.id || `close_${Math.round(x)}_${Math.round(y)}`;
  const isUnderMouse = mouseX >= x && mouseX <= x + size && mouseY >= y && mouseY <= y + size;
  const isHovered = options?.isHoveredForce || isUnderMouse;
  const isPressed = options?.isPressedForce || (pressedHitboxId === id && isUnderMouse && mouseIsDown());
  
  registerUIHitbox({
    id,
    x,
    y,
    w: size,
    h: size,
    layer: options?.layer,
    onClick: onClose
  });

  const pressOffset = isPressed ? 2 : 0;

  // Shadow
  noStroke();
  fill(...color.black(220));
  circle(x + size / 2, y + size / 2 + 3, size);

  // Base
  const baseColor = isHovered ? color.red() : [160, 25, 30, 255];
  fill(...baseColor);
  circle(x + size / 2, y + size / 2 + 1, size);

  // Face
  const faceColor = isHovered ? [160, 25, 30, 255] : color.red();
  fill(...faceColor);
  circle(x + size / 2, y + size / 2 - 2 + pressOffset, size);

  // Click white ring if pressed
  if (isPressed) {
    noFill();
    stroke(...color.white());
    strokeWeight(2.5);
    circle(x + size / 2, y + size / 2 - 1, size + 4);
    noStroke();
  }

  // 'X' Icon
  stroke(255);
  strokeWeight(2.5);
  const r = size * 0.22;
  const cx = x + size / 2;
  const cy = y + size / 2 - 2 + pressOffset;
  line(cx - r, cy - r, cx + r, cy + r);
  line(cx + r, cy - r, cx - r, cy + r);
  noStroke();
}

export const CloseButton = drawCloseButton;

// ==========================================
// PANELS & MODAL FRAMES (Almanac Art Style)
// ==========================================

export interface ModalFrameOptions {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  radius?: number;
  borderWidth?: number;
  dimAlpha?: number;
  layer?: number;
}

export function drawModalFrame(
  x: number,
  y: number,
  w: number,
  h: number,
  options: ModalFrameOptions = {}
): { contentX: number; contentY: number; contentW: number; contentH: number } {
  const {
    title = '',
    subtitle = '',
    onClose,
    radius = 40,
    borderWidth = 6,
    dimAlpha = 180,
    layer = 100
  } = options;

  setUILayer(layer);

  // 1. Dark Backdrop Dimmer
  if (dimAlpha > 0) {
    noStroke();
    fill(...color.black(dimAlpha));
    rect(0, 0, width, height);
  }

  // 2. Main Modal Container (PanelBlue fill, LightBlue stroke)
  rectMode(CORNER);
  fill(...color.panelBlue());
  stroke(...color.lightBlue());
  strokeWeight(borderWidth);
  rect(x, y, w, h, radius);
  noStroke();

  // 3. Header Bar / Title (if provided)
  let headerH = 0;
  if (title) {
    headerH = subtitle ? 56 : 48;
    textAlign(LEFT, CENTER);
    textSize(20);
    textStyle(NORMAL);
    noStroke();
    fill(...color.white());
    text(title, x + 30, y + (subtitle ? 22 : headerH / 2 + 2));

    if (subtitle) {
      textSize(12);
      textStyle(NORMAL);
      noStroke();
      fill(...color.cyan());
      text(subtitle, x + 30, y + 42);
    }
  }

  // 4. Close Button [X]
  if (onClose) {
    drawCloseButton(x + w - 46, y + 16, 32, onClose, { layer: layer + 1 });
  }

  const pad = 20;
  return {
    contentX: x + pad,
    contentY: y + (headerH > 0 ? headerH + 8 : pad),
    contentW: w - pad * 2,
    contentH: h - (headerH > 0 ? headerH + 8 : pad) - pad
  };
}

export function drawCard(
  x: number,
  y: number,
  w: number,
  h: number,
  options: {
    radius?: number;
    isSelected?: boolean;
    isHoverable?: boolean;
    bgColor?: ColorRGBA;
    borderColor?: ColorRGBA;
    strokeColor?: ColorRGBA;
    borderWidth?: number;
    onClick?: () => void;
    id?: string;
    layer?: number;
  } = {}
): { isHovered: boolean } {
  const {
    radius = 20,
    isSelected = false,
    isHoverable = false,
    bgColor = [15, 18, 35, 160],
    borderColor,
    strokeColor,
    borderWidth = 2,
    onClick,
    id = `card_${Math.round(x)}_${Math.round(y)}`,
    layer
  } = options;

  const isHovered = isHoverable && mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;

  if (onClick) {
    registerUIHitbox({
      id,
      x,
      y,
      w,
      h,
      layer,
      onClick
    });
  }

  rectMode(CORNER);
  if (isSelected) {
    stroke(...color.veryLightYellow());
    strokeWeight(3);
  } else if (isHovered) {
    stroke(...color.cyan());
    strokeWeight(2);
  } else if (borderColor || strokeColor) {
    stroke(...(borderColor || strokeColor)!);
    strokeWeight(borderWidth);
  } else {
    noStroke();
  }

  fill(...bgColor);
  rect(x, y, w, h, radius);
  noStroke();

  return { isHovered };
}

// ==========================================
// SPEECH BUBBLES & WORLD COST TAGS
// ==========================================

export interface SpeechBubbleOptions {
  tailDirection?: 'bottom' | 'top' | 'left' | 'right' | 'none';
  tailSize?: number;
  bgColor?: ColorRGBA;
  textColor?: ColorRGBA;
  fontSize?: number;
  radius?: number;
  icon?: any;
  iconSize?: number;
}

export function drawSpeechBubble(
  cx: number,
  cy: number,
  w: number,
  h: number,
  textStr: string = '',
  options: SpeechBubbleOptions = {}
) {
  const {
    tailDirection = 'bottom',
    tailSize = 8,
    bgColor = color.darkBlue(240),
    textColor = color.white(),
    fontSize = 14,
    radius = 14,
    icon = null,
    iconSize = 28
  } = options;

  const x = cx - w / 2;
  const y = cy - h / 2;

  rectMode(CORNER);
  noStroke();
  fill(...bgColor);
  rect(x, y, w, h, radius);

  // Arrow Tail
  if (tailDirection === 'bottom') {
    triangle(cx - tailSize, cy + h / 2, cx + tailSize, cy + h / 2, cx, cy + h / 2 + tailSize);
  } else if (tailDirection === 'top') {
    triangle(cx - tailSize, cy - h / 2, cx + tailSize, cy - h / 2, cx, cy - h / 2 - tailSize);
  }

  // Content (Icon + Text)
  if (icon) {
    imageMode(CENTER);
    const imgX = !textStr ? cx : cx - (textWidth(textStr) / 2) - iconSize / 2;
    image(icon, imgX, cy, iconSize, iconSize);
  }

  if (textStr) {
    textAlign(CENTER, CENTER);
    textSize(fontSize);
    textStyle(NORMAL);
    noStroke();
    fill(...textColor);
    const txtX = icon ? cx + iconSize / 2 + 2 : cx;
    text(textStr, txtX, cy + 1);
  }
}

// ==========================================
// NUMERIC STEPPERS & INPUT FIELDS
// ==========================================

export function drawNumberStepper(
  x: number,
  y: number,
  w: number,
  h: number,
  value: number,
  onValueChange: (newVal: number) => void,
  options: {
    min?: number;
    max?: number;
    step?: number;
    fontSize?: number;
    id?: string;
    layer?: number;
  } = {}
) {
  const { min = 1, max = 9999, step = 1, fontSize = 16, id = `stepper_${Math.round(x)}`, layer } = options;

  const btnW = Math.min(36, h);

  // Decrement button [-]
  drawButton(x, y, btnW, h, '-', {
    id: `${id}_dec`,
    variant: 'red',
    fontSize: 18,
    radius: 8,
    depth3D: 2,
    layer,
    disabled: value <= min,
    onClick: () => onValueChange(Math.max(min, value - step))
  });

  // Center display
  const midX = x + btnW + 4;
  const midW = w - (btnW * 2) - 8;
  rectMode(CORNER);
  noStroke();
  fill(...color.veryDarkBlue());
  rect(midX, y, midW, h, 8);

  textAlign(CENTER, CENTER);
  textSize(fontSize);
  textStyle(NORMAL);
  noStroke();
  fill(...color.yellow());
  text(value.toString(), midX + midW / 2, y + h / 2 + 1);

  // Increment button [+]
  drawButton(x + w - btnW, y, btnW, h, '+', {
    id: `${id}_inc`,
    variant: 'green',
    fontSize: 18,
    radius: 8,
    depth3D: 2,
    layer,
    disabled: value >= max,
    onClick: () => onValueChange(Math.min(max, value + step))
  });
}

export function drawInputField(
  x: number,
  y: number,
  w: number,
  h: number,
  inputState: TextInputState,
  options: {
    placeholder?: string;
    fontSize?: number;
    radius?: number;
    id?: string;
    layer?: number;
    onFocus?: () => void;
  } = {}
) {
  const { placeholder = '', fontSize = 14, radius = 8, id = `input_${Math.round(x)}`, layer, onFocus } = options;

  const isHovered = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;

  registerUIHitbox({
    id,
    x,
    y,
    w,
    h,
    layer,
    onClick: () => {
      inputState.isFocused = true;
      if (onFocus) onFocus();
    }
  });

  rectMode(CORNER);
  if (inputState.isFocused) {
    stroke(...color.cyan());
    strokeWeight(2);
  } else if (isHovered) {
    stroke(...color.lightBlue());
    strokeWeight(1.5);
  } else {
    noStroke();
  }
  fill(...color.veryDarkBlue());
  rect(x, y, w, h, radius);
  noStroke();

  // Text / Placeholder
  textAlign(LEFT, CENTER);
  textSize(fontSize);
  noStroke();

  const pad = 10;
  if (!inputState.text && placeholder && !inputState.isFocused) {
    fill(120, 130, 160);
    textStyle(NORMAL);
    text(placeholder, x + pad, y + h / 2 + 1);
  } else {
    fill(...color.white());
    textStyle(NORMAL);
    text(inputState.text, x + pad, y + h / 2 + 1);

    // Blinking cursor
    if (inputState.isFocused && Math.floor(Date.now() / 500) % 2 === 0) {
      const cursorX = x + pad + textWidth(inputState.text.slice(0, inputState.cursor));
      stroke(...color.cyan());
      strokeWeight(2);
      line(cursorX, y + 6, cursorX, y + h - 6);
      noStroke();
    }
  }
}

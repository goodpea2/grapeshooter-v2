/**
 * Native DOM Input Overlay for Canvas Text Fields.
 * 
 * Provides standard browser-native input interaction:
 * - Drag-and-highlight text selection
 * - Key repeat (holding down a key continuously repeats it)
 * - Exact cursor placement anywhere in text on click
 * - Native shortcuts: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+Z
 * - Virtual keyboards & IME support
 */

export interface DOMInputOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  type?: 'text' | 'number' | 'textarea';
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  onChange?: (val: string) => void;
  onCommit?: (val: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
}

let activeInputElement: HTMLInputElement | HTMLTextAreaElement | null = null;
let activeInputOptions: DOMInputOptions | null = null;

export function isDOMInputActive(): boolean {
  return activeInputElement !== null && document.body.contains(activeInputElement);
}

export function getActiveDOMInputValue(): string | null {
  return activeInputElement ? activeInputElement.value : null;
}

export function attachDOMInput(options: DOMInputOptions): HTMLInputElement | HTMLTextAreaElement {
  // If already active with same options, just update position and return
  if (activeInputElement && activeInputOptions === options) {
    updateDOMInputPosition(options.x, options.y, options.w, options.h);
    return activeInputElement;
  }

  // Remove existing input if any
  removeDOMInput();

  const canvas = document.querySelector('canvas');
  const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

  const el = options.multiline || options.type === 'textarea'
    ? document.createElement('textarea')
    : document.createElement('input');

  if (el instanceof HTMLInputElement && options.type && options.type !== 'textarea') {
    el.type = options.type;
  }

  el.id = 'canvas_dom_input_overlay';
  el.value = options.value ?? '';
  if (options.placeholder) el.placeholder = options.placeholder;
  if (options.maxLength) el.maxLength = options.maxLength;

  // Pixel-perfect positioning over canvas element
  const screenX = canvasRect.left + options.x;
  const screenY = canvasRect.top + options.y;

  Object.assign(el.style, {
    position: 'fixed',
    left: `${Math.round(screenX)}px`,
    top: `${Math.round(screenY)}px`,
    width: `${Math.round(options.w)}px`,
    height: `${Math.round(options.h)}px`,
    backgroundColor: options.backgroundColor || '#0a0e1e',
    color: options.color || '#ffffff',
    border: `1.5px solid ${options.borderColor || '#38bdf8'}`,
    borderRadius: `${options.borderRadius ?? 6}px`,
    padding: '2px 8px',
    boxSizing: 'border-box',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: `${options.fontSize ?? 12}px`,
    lineHeight: options.multiline ? '1.4' : `${Math.round(options.h - 6)}px`,
    outline: 'none',
    boxShadow: '0 0 8px rgba(56, 189, 248, 0.45)',
    zIndex: '99999',
    resize: 'none',
    overflow: options.multiline ? 'auto' : 'hidden'
  });

  // Stop propagation to prevent game engine / p5 from capturing typing
  el.addEventListener('keydown', (evt: Event) => {
    const e = evt as KeyboardEvent;
    e.stopPropagation();
    if (options.onKeyDown) {
      options.onKeyDown(e);
    }
    if (e.key === 'Enter' && !options.multiline) {
      e.preventDefault();
      if (options.onCommit) options.onCommit(el.value);
      removeDOMInput();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      removeDOMInput();
    }
  });

  el.addEventListener('keyup', (evt: Event) => {
    evt.stopPropagation();
  });

  el.addEventListener('keypress', (evt: Event) => {
    evt.stopPropagation();
  });

  el.addEventListener('input', () => {
    if (options.onChange) {
      options.onChange(el.value);
    }
  });

  el.addEventListener('blur', () => {
    if (options.onCommit) {
      options.onCommit(el.value);
    }
    if (options.onBlur) {
      options.onBlur();
    }
    // Remove after short microtask so click events can read value
    setTimeout(() => {
      if (activeInputElement === el) {
        removeDOMInput();
      }
    }, 50);
  });

  document.body.appendChild(el);
  activeInputElement = el;
  activeInputOptions = options;

  // Focus and place cursor at end
  requestAnimationFrame(() => {
    el.focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  });

  return el;
}

export function updateDOMInputPosition(x: number, y: number, w: number, h: number) {
  if (!activeInputElement) return;
  const canvas = document.querySelector('canvas');
  const canvasRect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
  activeInputElement.style.left = `${Math.round(canvasRect.left + x)}px`;
  activeInputElement.style.top = `${Math.round(canvasRect.top + y)}px`;
  activeInputElement.style.width = `${Math.round(w)}px`;
  activeInputElement.style.height = `${Math.round(h)}px`;
}

export function removeDOMInput() {
  if (activeInputElement) {
    if (activeInputElement.parentNode) {
      activeInputElement.parentNode.removeChild(activeInputElement);
    }
    activeInputElement = null;
    activeInputOptions = null;
  }
}

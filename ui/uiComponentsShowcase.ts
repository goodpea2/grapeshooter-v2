import { state } from '../state';
import { color } from '../uiColors';
import {
  beginUIFrame,
  drawModalFrame,
  drawCard,
  drawYellowButton,
  drawRedButton,
  drawGreenButton,
  drawCyanButton,
  drawPurpleButton,
  drawDarkButton,
  drawGrayButton,
  drawButton,
  drawNumberStepper,
  drawInputField,
  drawSpeechBubble,
  createTextInputState,
  TextInputState,
  handleRegisteredUIClick
} from '../uiComponents';

declare const width: any;
declare const height: any;
declare const textAlign: any;
declare const textSize: any;
declare const textStyle: any;
declare const text: any;
declare const fill: any;
declare const noStroke: any;
declare const BOLD: any;
declare const NORMAL: any;
declare const CENTER: any;

export class UIComponentsShowcase {
  isOpen: boolean = false;
  testStepperVal: number = 10;
  testInputState: TextInputState = createTextInputState('Text Input');

  open() {
    this.isOpen = true;
    beginUIFrame();
  }

  close() {
    this.isOpen = false;
  }

  draw() {
    if (!this.isOpen) return;

    beginUIFrame();

    // Modal Frame in Almanac Art Style
    const modalW = Math.min(880, width - 40);
    const modalH = Math.min(600, height - 40);
    const modalX = (width - modalW) / 2;
    const modalY = (height - modalH) / 2;

    const frame = drawModalFrame(modalX, modalY, modalW, modalH, {
      title: 'UI Components',
      onClose: () => this.close(),
      layer: 200
    });

    const startX = frame.contentX + 10;
    const startY = frame.contentY + 10;
    const contentW = frame.contentW - 20;

    // --- ROW 1: Button States (Normal, Hover, Pressed - exactly as reference image) ---
    const stateBtnW = 120;
    const stateBtnH = 42;
    const stateGap = 24;

    drawYellowButton(startX, startY, stateBtnW, stateBtnH, 'Normal', {
      layer: 210
    });

    drawYellowButton(startX + stateBtnW + stateGap, startY, stateBtnW, stateBtnH, 'Hover', {
      isHoveredForce: true,
      layer: 210
    });

    drawYellowButton(startX + (stateBtnW + stateGap) * 2, startY, stateBtnW, stateBtnH, 'Pressed', {
      isPressedForce: true,
      layer: 210
    });

    // --- ROW 2: All Button Color Variants (Interactive) ---
    const row2Y = startY + stateBtnH + 20;
    const btnW = 82;
    const btnH = 36;
    const gap = 8;

    drawYellowButton(startX, row2Y, btnW, btnH, 'Yellow', { layer: 210 });
    drawRedButton(startX + (btnW + gap), row2Y, btnW, btnH, 'Red', { layer: 210 });
    drawGreenButton(startX + (btnW + gap) * 2, row2Y, btnW, btnH, 'Green', { layer: 210 });
    drawCyanButton(startX + (btnW + gap) * 3, row2Y, btnW, btnH, 'Cyan', { layer: 210 });
    drawPurpleButton(startX + (btnW + gap) * 4, row2Y, btnW, btnH, 'Purple', { layer: 210 });
    drawDarkButton(startX + (btnW + gap) * 5, row2Y, btnW, btnH, 'Dark', { layer: 210 });
    drawButton(startX + (btnW + gap) * 6, row2Y, btnW, btnH, 'Blue', { variant: 'blue', layer: 210 });
    drawGrayButton(startX + (btnW + gap) * 7, row2Y, btnW, btnH, 'Gray', { layer: 210 });
    drawYellowButton(startX + (btnW + gap) * 8, row2Y, btnW, btnH, 'Disabled', { disabled: true, layer: 210 });

    // --- ROW 3: Button with Icons (50% larger icons) & Steppers / Inputs ---
    const row3Y = row2Y + btnH + 20;
    const soilIcon = state.assets?.['img_icon_soil'];
    const sunIcon = state.assets?.['img_icon_sun'];

    drawYellowButton(startX, row3Y, 150, 42, 'Soil Icon', {
      icon: soilIcon,
      iconSize: 34,
      layer: 210
    });

    drawGreenButton(startX + 162, row3Y, 150, 42, 'Sun Icon', {
      icon: sunIcon,
      iconSize: 34,
      layer: 210
    });

    // Number Stepper
    drawNumberStepper(startX + 328, row3Y, 180, 42, this.testStepperVal, (newVal) => {
      this.testStepperVal = newVal;
    }, { layer: 210 });

    // Input Field
    drawInputField(startX + 520, row3Y, 200, 42, this.testInputState, {
      placeholder: 'Input Field',
      layer: 210
    });

    // --- ROW 4: Speech Bubbles ---
    const row4Y = row3Y + 42 + 20;
    drawSpeechBubble(startX + 90, row4Y + 20, 140, 40, 'Cost Tag', {
      tailDirection: 'bottom',
      icon: soilIcon,
      iconSize: 32,
      bgColor: color.darkBlue(240)
    });

    drawSpeechBubble(startX + 270, row4Y + 20, 160, 40, 'Speech Bubble', {
      tailDirection: 'bottom',
      icon: sunIcon,
      iconSize: 32,
      bgColor: color.panelBlue(240)
    });

    // --- ROW 5: Panel / Card Variants ---
    const row5Y = row4Y + 50;
    const cardH = frame.contentH - (row5Y - frame.contentY) - 10;
    const cardW = (contentW - 20) / 3;

    // Card 1: Default Card
    drawCard(startX, row5Y, cardW, cardH, {
      layer: 210
    });
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(NORMAL);
    noStroke();
    fill(...color.white());
    text('Card', startX + cardW / 2, row5Y + cardH / 2);

    // Card 2: Selected Card
    drawCard(startX + cardW + 10, row5Y, cardW, cardH, {
      isSelected: true,
      layer: 210
    });
    noStroke();
    fill(...color.white());
    text('Selected Card', startX + cardW + 10 + cardW / 2, row5Y + cardH / 2);

    // Card 3: Inset Panel
    drawCard(startX + (cardW + 10) * 2, row5Y, cardW, cardH, {
      bgColor: color.veryDarkBlue(240),
      layer: 210
    });
    noStroke();
    fill(...color.white());
    text('Inset Panel', startX + (cardW + 10) * 2 + cardW / 2, row5Y + cardH / 2);
  }

  handleClick(mx: number, my: number): boolean {
    if (!this.isOpen) return false;
    return handleRegisteredUIClick(mx, my);
  }
}

export const uiComponentsShowcase = new UIComponentsShowcase();

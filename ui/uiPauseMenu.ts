import { state } from '../state';
import { color } from '../uiColors';
import { 
  drawModalFrame, 
  drawButton, 
  drawYellowButton, 
  drawRedButton, 
  drawCard, 
  drawNumberStepper,
  setUILayer 
} from '../uiComponents';
import { soundEngine } from '../src/audio/soundEngine';

declare const width: any;
declare const height: any;
declare const textAlign: any;
declare const textSize: any;
declare const textStyle: any;
declare const fill: any;
declare const noStroke: any;
declare const text: any;
declare const LEFT: any;
declare const CENTER: any;
declare const NORMAL: any;
declare const windowWidth: any;
declare const windowHeight: any;

export function setGraphicQuality(quality: 'low' | 'high') {
  state.graphicQuality = quality;
  try {
    localStorage.setItem('grapeshooter_graphic_quality', quality);
  } catch {}

  const dpr = quality === 'high' 
    ? (typeof window !== 'undefined' && window.devicePixelRatio && window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1) 
    : 1;

  if (typeof (window as any).pixelDensity === 'function') {
    (window as any).pixelDensity(dpr);
  }
  if (typeof (window as any).resizeCanvas === 'function' && windowWidth > 0 && windowHeight > 0) {
    (window as any).resizeCanvas(windowWidth, windowHeight);
  }

  // Re-render chunk buffers with new pixel density
  if (state.world && state.world.chunks) {
    state.world.chunks.forEach((c: any) => {
      c.needsRedraw = true;
      if (c.buffer) {
        if (typeof c.buffer.remove === 'function') c.buffer.remove();
        c.buffer = null;
      }
      if (c.deathBuffer) {
        if (typeof c.deathBuffer.remove === 'function') c.deathBuffer.remove();
        c.deathBuffer = null;
      }
    });
  }
}

export function drawPauseMenu() {
  if (!state.isPauseMenuOpen) return;

  const isMenu = state.currentScreen === 'main_menu';
  const modalW = Math.min(380, width - 40);
  const modalH = isMenu ? 350 : 410;
  const modalX = (width - modalW) / 2;
  const modalY = (height - modalH) / 2;

  const frame = drawModalFrame(modalX, modalY, modalW, modalH, {
    title: isMenu ? 'Settings' : 'Pause',
    onClose: () => {
      soundEngine.playSFX('btn_click');
      state.isPauseMenuOpen = false;
      if (!isMenu) state.isPaused = false;
    },
    layer: 300
  });

  const contentX = frame.contentX + 8;
  const contentY = frame.contentY + 8;
  const contentW = frame.contentW - 16;

  // 1. Graphic Settings Card
  const cardH = 74;
  drawCard(contentX, contentY, contentW, cardH, {
    bgColor: [15, 18, 35, 200],
    borderColor: color.lightBlue(100),
    borderWidth: 1.5,
    radius: 12,
    layer: 305
  });

  // Label: Graphic Settings
  textAlign(LEFT, CENTER);
  textSize(13);
  textStyle(NORMAL);
  noStroke();
  fill(...color.white());
  text('Graphic Settings', contentX + 14, contentY + 18);

  // Toggle Buttons: low [] high []
  const optGap = 10;
  const optW = (contentW - 28 - optGap) / 2;
  const optH = 28;
  const optY = contentY + 34;

  // Low Button
  drawButton(contentX + 14, optY, optW, optH, 'Low', {
    id: 'btn_pause_quality_low',
    variant: state.graphicQuality === 'low' ? 'cyan' : 'dark',
    isSelected: state.graphicQuality === 'low',
    fontSize: 12,
    radius: 8,
    depth3D: 2,
    layer: 310,
    onClick: () => {
      soundEngine.playSFX('btn_click');
      setGraphicQuality('low');
    }
  });

  // High Button
  drawButton(contentX + 14 + optW + optGap, optY, optW, optH, 'High', {
    id: 'btn_pause_quality_high',
    variant: state.graphicQuality === 'high' ? 'cyan' : 'dark',
    isSelected: state.graphicQuality === 'high',
    fontSize: 12,
    radius: 8,
    depth3D: 2,
    layer: 310,
    onClick: () => {
      soundEngine.playSFX('btn_click');
      setGraphicQuality('high');
    }
  });

  // 2. Audio Volume Settings Card
  const audioCardY = contentY + cardH + 10;
  const audioCardH = 96;
  drawCard(contentX, audioCardY, contentW, audioCardH, {
    bgColor: [15, 18, 35, 200],
    borderColor: color.lightBlue(100),
    borderWidth: 1.5,
    radius: 12,
    layer: 305
  });

  // Music Row
  textAlign(LEFT, CENTER);
  textSize(13);
  textStyle(NORMAL);
  noStroke();
  fill(...color.white());
  text('Music', contentX + 14, audioCardY + 24);

  const stepperW = 120;
  const stepperH = 28;
  const stepperX = contentX + contentW - stepperW - 14;

  drawNumberStepper(
    stepperX,
    audioCardY + 10,
    stepperW,
    stepperH,
    state.musicVolume,
    (val) => {
      soundEngine.setMusicVolume(val);
    },
    {
      id: 'stepper_music_vol',
      min: 0,
      max: 100,
      step: 10,
      fontSize: 13,
      layer: 310
    }
  );

  // SFX Row
  textAlign(LEFT, CENTER);
  textSize(13);
  textStyle(NORMAL);
  noStroke();
  fill(...color.white());
  text('SFX', contentX + 14, audioCardY + 68);

  drawNumberStepper(
    stepperX,
    audioCardY + 54,
    stepperW,
    stepperH,
    state.sfxVolume,
    (val) => {
      soundEngine.setSfxVolume(val);
    },
    {
      id: 'stepper_sfx_vol',
      min: 0,
      max: 100,
      step: 10,
      fontSize: 13,
      layer: 310
    }
  );

  // 3. Action Buttons
  const actionBtnH = 40;
  const actionY = audioCardY + audioCardH + 14;

  if (isMenu) {
    // Single Close / Done button in Main Menu
    drawYellowButton(contentX, actionY, contentW, actionBtnH, 'Close Settings', {
      id: 'btn_pause_close',
      fontSize: 14,
      radius: 10,
      depth3D: 3,
      layer: 310,
      onClick: () => {
        soundEngine.playSFX('btn_click');
        state.isPauseMenuOpen = false;
      }
    });
  } else {
    const resumeY = actionY;
    const exitY = resumeY + actionBtnH + 10;

    // Resume Game Button
    drawYellowButton(contentX, resumeY, contentW, actionBtnH, 'Resume Game', {
      id: 'btn_pause_resume',
      fontSize: 14,
      radius: 10,
      depth3D: 3,
      layer: 310,
      onClick: () => {
        soundEngine.playSFX('btn_click');
        state.isPauseMenuOpen = false;
        state.isPaused = false;
      }
    });

    // Exit to Menu Button
    drawRedButton(contentX, exitY, contentW, actionBtnH, 'Exit to Menu', {
      id: 'btn_pause_exit',
      fontSize: 14,
      radius: 10,
      depth3D: 3,
      layer: 310,
      onClick: () => {
        soundEngine.playSFX('btn_click');
        state.isPauseMenuOpen = false;
        state.isPaused = false;
        state.currentScreen = 'main_menu';
      }
    });
  }
}

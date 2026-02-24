import { state } from './state';

declare const translate: any;
declare const stroke: any;
declare const strokeWeight: any;

declare const p5: any;
declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const triangle: any;
declare const text: any;
declare const textSize: any;
declare const textAlign: any;
declare const RIGHT: any;
declare const CENTER: any;
declare const mouseX: any;
declare const mouseY: any;
declare const dist: any;

export function drawGameSpeedButtons() {
  push();
  const btnMargin = 10;
  const btnSize = 40;
  const speedupBtnX = width - btnMargin - btnSize; // Right-align Speedup button
  const speedupBtnY = btnMargin;
  const pauseBtnX = width - btnMargin - btnSize * 2 - btnMargin; // Right-align Pause button
  const pauseBtnY = btnMargin;

  // Speedup Button
  const isHoveringSpeedup = dist(mouseX, mouseY, speedupBtnX + btnSize / 2, speedupBtnY + btnSize / 2) < btnSize / 2;

  if (state.requestedGameSpeed === 2) {
    stroke(255); // White outline
    strokeWeight(3);
  } else {
    noStroke();
  }
  noStroke();
  fill(0,0,0,100);
  rect(speedupBtnX, speedupBtnY + 4, btnSize, btnSize, 12);
  fill(state.requestedGameSpeed === 2 ? (isHoveringSpeedup ? [50, 210, 150] : [0, 160, 95]) : (isHoveringSpeedup ? [60, 75, 160] : [40, 47, 96]));
  rect(speedupBtnX, speedupBtnY, btnSize, btnSize, 12);
  fill(255);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text(state.gameSpeed + 'x', speedupBtnX + btnSize / 2, speedupBtnY + btnSize / 2);

  // Pause Button
  const isHoveringPause = dist(mouseX, mouseY, pauseBtnX + btnSize / 2, pauseBtnY + btnSize / 2) < btnSize / 2;
  noStroke();
  fill(0,0,0,100);
  rect(pauseBtnX, pauseBtnY + 4, btnSize, btnSize, 12);
  fill(state.isPaused ? (isHoveringPause ? [200, 100, 100] : [180, 65, 65]) : (isHoveringPause ? [60, 75, 160] : [40, 47, 96]));
  rect(pauseBtnX, pauseBtnY, btnSize, btnSize, 12);
  fill(255);
  // Draw pause icon (two vertical bars)
  rect(pauseBtnX + btnSize / 2 - 8, pauseBtnY + btnSize / 2 - 10, 6, 20, 2);
  rect(pauseBtnX + btnSize / 2 + 2, pauseBtnY + btnSize / 2 - 10, 6, 20, 2);

  pop();
}

export function handleGameSpeedButtonClick(): boolean {
  const btnMargin = 10;
  const btnSize = 40;
  const speedupBtnX = width - btnMargin - btnSize;
  const speedupBtnY = btnMargin;
  const pauseBtnX = width - btnMargin - btnSize * 2 - btnMargin;
  const pauseBtnY = btnMargin;

  // Check Speedup button
  if (mouseX > speedupBtnX && mouseX < speedupBtnX + btnSize &&
      mouseY > speedupBtnY && mouseY < speedupBtnY + btnSize) {
    state.requestedGameSpeed = state.requestedGameSpeed === 2 ? 1 : 2;
    state.isPaused = false; // Unpause if speeding up
    state.speedupFlashTimer = 30; // Flash effect
    return true;
  }

  // Check Pause button
  if (mouseX > pauseBtnX && mouseX < pauseBtnX + btnSize &&
      mouseY > pauseBtnY && mouseY < pauseBtnY + btnSize) {
    state.isPaused = !state.isPaused;
    state.speedupFlashTimer = 30; // Flash effect
    return true;
  }

  return false;
}

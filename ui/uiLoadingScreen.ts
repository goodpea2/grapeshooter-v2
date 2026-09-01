import { state } from '../state';

declare const width: any;
declare const height: any;
declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const color: any;
declare const lerp: any;

let animatedProgress = 0;

export function drawLoadingScreen() {
  if (!state.isLoadingResources) {
    animatedProgress = 0;
    return;
  }

  // Smoothly interpolate progress bar animation
  const targetProgress = state.loadingProgress || 0;
  animatedProgress = lerp(animatedProgress, targetProgress, 0.15);
  if (Math.abs(animatedProgress - targetProgress) < 0.005) {
    animatedProgress = targetProgress;
  }

  const percent = Math.min(100, Math.max(0, Math.floor(animatedProgress * 100)));

  push();
  // Deep dark background
  fill(12, 14, 28);
  noStroke();
  rect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  // 1. Text: "Loading 50%"
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(240, 245, 255);
  noStroke();
  text(`Loading ${percent}%`, cx, cy - 24);

  // 2. Bar: [ ================== ]
  const barW = Math.min(320, width * 0.7);
  const barH = 14;
  const barX = cx - barW / 2;
  const barY = cy + 12;
  const radius = 7;

  // Bar Outer Container / Background
  fill(22, 26, 48);
  stroke(55, 70, 120);
  strokeWeight(2);
  rect(barX, barY, barW, barH, radius);

  // Bar Filled Portion
  const filledW = Math.max(0, barW * animatedProgress);
  if (filledW > 2) {
    noStroke();
    fill(90, 160, 255);
    rect(barX + 2, barY + 2, Math.max(0, filledW - 4), barH - 4, radius - 2);

    // Subtle highlight on top of bar
    fill(200, 230, 255, 120);
    rect(barX + 2, barY + 2, Math.max(0, filledW - 4), (barH - 4) / 2, radius - 2);
  }

  pop();
}

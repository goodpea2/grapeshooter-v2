import { state } from '../state';
import { paygateModal } from './paygateModal';
import { sunGeneratorModal } from './sunGeneratorModal';
import { textSignEditor } from './textsignEditor';

declare const keyIsDown: any;

export function updateLevelEditorCamera() {
  if (state.currentScreen !== 'level_editor') return;
  if (state.isAlmanacOpen) return;

  // Disable camera movement while editing any input fields or modals
  if (
    paygateModal.isOpen ||
    sunGeneratorModal.isOpen ||
    textSignEditor.isOpen ||
    state.levelEditor?.editingPaygateModal ||
    state.levelEditor?.editingTextSign ||
    state.levelEditor?.activeSpawnerInput ||
    state.levelEditor?.activeSunGeneratorInput ||
    state.levelEditor?.activePaygateInput ||
    state.levelEditor?.activeTextSignInput
  ) {
    return;
  }

  const speed = keyIsDown(16) ? 24 : 12; // Shift key boosts camera speed
  if (keyIsDown(87) || keyIsDown(38)) state.cameraPos.y -= speed; // W / Up
  if (keyIsDown(83) || keyIsDown(40)) state.cameraPos.y += speed; // S / Down
  if (keyIsDown(65) || keyIsDown(37)) state.cameraPos.x -= speed; // A / Left
  if (keyIsDown(68) || keyIsDown(39)) state.cameraPos.x += speed; // D / Right
}

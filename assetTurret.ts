
import { state } from './state';
import { HEX_DIST } from './constants';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const scale: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const abs: any;
declare const HALF_PI: any;
declare const cos: any;
declare const sin: any;
declare const map: any;
declare const pow: any;
declare const random: any;

// Map turret logic IDs to asset keys
export const TYPE_MAP: Record<string, string> = {
  't_pea': 't_pea',
  't_laser': 't_laser',
  't_wall': 't_wall',
  't_mine': 't_mine',
  't_ice': 't_ice',
  't_sunflower': 't_sunflower',
  't_seed': 'seed_stray_t1', 
  't_seed2': 'seed_stray_t2', // Map to the T2 stray seed asset
  't_lilypad': 't_lilypad',
  't2_repeater': 't_repeater',
  't2_firepea': 't_firepea',
  't2_laser2': 't_laser2',
  't2_peanut': 't_peanut',
  't2_mortar': 't_mortar',
  't2_laserexplode': 't_laserexplode',
  't2_snowpea': 't_snowpea',
  't2_iceray': 't_iceray',
  't2_puncher': 't_puncher',
  't2_tall': 't_tall',
  't2_pulse': 't_pulse',
  't2_minespawner': 't_minespawner',
  't2_icebomb': 't_icebomb',
  't2_stun': 't_stun',
  't2_spike': 't_spike',
  't3_triplepea': 't_triplepea',
  // Special Turrets
  't0_puffshroom': 't0_puffshroom',
  't0_grapeshot': 't0_grapeshot',
  't0_jalapeno': 't0_jalapeno',
  't0_firecherry': 't0_firecherry',
  't0_starfruit': 't0_starfruit',
  't0_iceshroom': 't0_iceshroom',
  't0_cherrybomb': 't0_cherrybomb'
};

// Units that do not have a back-facing asset
const NO_BACK_UNITS = new Set([
  't_wall', 't2_tall', 't2_pulse', 't2_spike', 't_sunflower', 't_seed', 't_seed2', 't_lilypad',
  't0_jalapeno', 't0_firecherry', 't0_starfruit', 't0_iceshroom', 't0_cherrybomb'
]);

export function hasTurretSprite(type: string): boolean {
  return !!TYPE_MAP[type];
}

export function drawTurretSprite(t: any) {
  const wPos = t.getWorldPos();
  const baseKey = TYPE_MAP[t.type];
  if (!baseKey) return;

  push();
  // Apply jump offset if it exists
  const jx = t.jumpOffset ? t.jumpOffset.x : 0;
  const jy = t.jumpOffset ? t.jumpOffset.y : 0;
  
  // Render offset for ground layer
  const ly = (t.config.turretLayer === 'ground') ? HEX_DIST * 0.25 : 0;
  
  // SHAKE LOGIC for explosive turrets
  let shakeX = 0;
  let shakeY = 0;
  if (t.config.explosiveGrowth) {
    const duration = t.config.actionConfig.dieAfterDuration || 180;
    const tVal = Math.min(1.0, t.framesAlive / duration);
    // Cubic scaling for intensity: starts very slow, gets violent at end
    const intensity = pow(tVal, 3.5) * 6;
    shakeX = random(-intensity, intensity);
    shakeY = random(-intensity, intensity);
  }

  translate(wPos.x + jx + shakeX, wPos.y + jy + ly + shakeY);

  let isLeft = false;
  let isBack = false;

  const ang = t.angle; 
  if (abs(ang) > HALF_PI) isLeft = true;
  if (ang < 0) isBack = true;

  // Logic for unarmed state override
  let onCooldown = false;
  const config = t.config;
  const actionConfig = config.actionConfig;

  if (actionConfig.hasUnarmedAsset) {
    // Check pulse cooldown (primary for landmines/traps)
    if (config.actionType.includes('pulse')) {
        const pulseTimer = t.actionTimers.get('pulse') || -999999;
        const cooldown = (actionConfig.pulseCooldown || 0) / (t.fireRateMultiplier || 1.0);
        if ((state.frames - pulseTimer) < cooldown) onCooldown = true;
    }
    // Check shoot fire rate if not already on cooldown (only for turrets that don't have a pulse action)
    if (!onCooldown && config.actionType.includes('shoot') && !config.actionType.includes('pulse')) {
        const shootTimer = t.actionTimers.get('shoot') || -999999;
        const fr = Array.isArray(actionConfig.shootFireRate) ? actionConfig.shootFireRate[0] : actionConfig.shootFireRate;
        const cooldown = (fr || 0) / (t.fireRateMultiplier || 1.0);
        if ((state.frames - shootTimer) < cooldown) onCooldown = true;
    }
  }

  let spriteKey = `img_${baseKey}_front`;
  if (onCooldown) {
    spriteKey = `img_${baseKey}_unarmed`;
  } else if (!NO_BACK_UNITS.has(t.type) && isBack) {
    spriteKey = `img_${baseKey}_back`;
  }

  // Fallback chain: specific state -> front -> base key without suffix
  let sprite = state.assets[spriteKey] || state.assets[`img_${baseKey}_front`] || state.assets[`img_${baseKey}`];

  if (sprite) {
    push();
    
    // Explosive growth visual (scaling)
    if (config.explosiveGrowth) {
        const duration = actionConfig.dieAfterDuration || 180;
        const tVal = Math.min(1.0, t.framesAlive / duration);
        const sVal = map(tVal, 0, 1, 1.0, 1.5);
        const whiteVal = map(tVal, 0.5, 1, 255, 500); // Tint white effect
        scale(sVal, sVal);
        if (tVal > 0.5) tint(whiteVal, whiteVal, whiteVal, t.alpha);
    }

    // HEAL / DAMAGE FLASH
    if (t.flashTimer > 0) {
      if (t.flashType === 'heal') tint(100, 255, 100, t.alpha);
      else tint(255, 100, 100, t.alpha);
    }

    // Stable "random" rotation and flip based on UID
    if (config.randomRotation) {
        let hash = 0;
        for(let i=0; i<t.uid.length; i++) hash += t.uid.charCodeAt(i);
        rotate((hash % 360) * (Math.PI / 180));
    } else {
        if (isLeft) scale(-1, 1);
    }
    
    if (config.randomFlip) {
        let hash = 0;
        for(let i=0; i<t.uid.length; i++) hash += t.uid.charCodeAt(i) * 1.5;
        if (hash % 2 === 0) scale(-1, 1);
    }

    const recoilDist = t.recoil || 0;
    const rx = -recoilDist * cos(isLeft ? ang - Math.PI : ang);
    const ry = -recoilDist * sin(isLeft ? ang - Math.PI : ang);
    translate(rx, ry);

    imageMode(CENTER);
    if (!config.explosiveGrowth && t.flashTimer <= 0 && t.alpha < 255) tint(255, t.alpha);
    image(sprite, 0, 0, 50, 50);
    noTint();
    pop();
  }

  pop();
}


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
  't_seed': 't_seed', 
  't_seed2': 't_seed2', // Map to the T2 stray seed asset
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
  // Tier 3
  't3_triplepea': 't_triplepea',
  't3_firepea2': 't_firepea2',
  't3_spinnut': 't_spinnut',
  't3_mortar2': 't_mortar2',
  't3_snowpea2': 't_snowpea2',
  't3_inferno': 't_inferno',
  't3_flamethrower': 't_flamethrower',
  't3_bowling': 't_bowling',
  't3_repulser': 't_repulser',
  't3_snowpeanut': 't_snowpeanut',
  't3_skymortar': 't_skymortar',
  't3_laser3': 't_laser3',
  't3_puncher2': 't_puncher2',
  't3_aoelaser': 't_aoelaser',
  't3_iceray2': 't_iceray2',
  't3_miningbomb': 't_miningbomb',
  't3_tesla': 't_tesla',
  't3_icepuncher': 't_icepuncher',
  't3_densnut': 't_densenut',
  't3_durian': 't_durian',
  't3_spike2': 't_spike2',
  't3_holonut': 't_holonut',
  't3_minefield': 't_minefield',
  't3_frostfield': 't_frostfield',
  't3_triberg': 't_triberg',
  // Special Turrets
  't0_puffshroom': 't0_puffshroom',
  't0_grapeshot': 't0_grapeshot',
  't0_jalapeno': 't0_jalapeno',
  't0_firecherry': 't0_firecherry',
  't0_starfruit': 't0_starfruit',
  't0_iceshroom': 't0_iceshroom',
  't0_cherrybomb': 't0_cherrybomb',
  // Test
  't_dummy': 't_wall'
};

// Units that do not have a back-facing asset
const NO_BACK_UNITS = new Set([
  't_wall', 't2_tall', 't2_pulse', 't2_spike', 't_sunflower', 't_seed', 't_seed2', 't_lilypad',
  't0_jalapeno', 't0_firecherry', 't0_starfruit', 't0_iceshroom', 't0_cherrybomb',
  't_dummy',
  // T3 additions that have no back asset provided
  't3_repulser', 't3_skymortar', 't3_miningbomb', 't3_tesla', 't3_densnut', 't3_durian',
  't3_spike2', 't3_holonut', 't3_minefield', 't3_frostfield', 't3_triberg'
]);

export function hasTurretSprite(type: string): boolean {
  return !!TYPE_MAP[type];
}

export function drawTurretSprite(t: any) {
  const baseKey = TYPE_MAP[t.type];
  if (!baseKey) return;

  push();
  // Apply jump offset if it exists (internal to unit coordinate)
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
    const intensity = pow(tVal, 3.5) * 6;
    shakeX = random(-intensity, intensity);
    shakeY = random(-intensity, intensity);
  }

  // Authoritative translation to local relative origin
  translate(jx + shakeX, jy + ly + shakeY);

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
    const primaryActions = ['pulse', 'shoot', 'shootMultiTarget', 'launch', 'spawnBulletAtRandom'];
    const applyTo = config.unarmedAssetApplyToAction || primaryActions;
    
    for(const act of primaryActions) {
      if (config.actionType.includes(act) && applyTo.includes(act)) {
        const timer = t.actionTimers.get(act) || -999999;
        let cooldown = 0;
        if (act === 'spawnBulletAtRandom') cooldown = actionConfig.spawnBulletAtRandom.cooldown;
        else if (act === 'pulse') cooldown = actionConfig.pulseCooldown;
        else {
          const fr = Array.isArray(actionConfig.shootFireRate) ? actionConfig.shootFireRate[0] : actionConfig.shootFireRate;
          cooldown = fr || 0;
        }
        
        if ((state.frames - timer) < (cooldown / (t.fireRateMultiplier || 1.0))) {
          onCooldown = true;
          break;
        }
      }
    }
  }

  let spriteKey = `img_${baseKey}_front`;
  if (onCooldown) {
    spriteKey = `img_${baseKey}_unarmed`;
  } else if (!NO_BACK_UNITS.has(t.type) && isBack) {
    spriteKey = `img_${baseKey}_back`;
  }

  let sprite = state.assets[spriteKey] || state.assets[`img_${baseKey}_front`] || state.assets[`img_${baseKey}`];

  if (sprite) {
    const ctx = (window as any).drawingContext;
    push();
    
    let useTint = false;

    // Explosive growth visual (scaling)
    if (config.explosiveGrowth) {
        const duration = actionConfig.dieAfterDuration || 180;
        const tVal = Math.min(1.0, t.framesAlive / duration);
        const sVal = map(tVal, 0, 1, 1.0, 1.5);
        scale(sVal, sVal);
        if (tVal > 0.5) {
            const whiteVal = map(tVal, 0.5, 1, 255, 500); 
            tint(whiteVal, whiteVal, whiteVal, t.alpha);
            useTint = true;
        }
    }

    // HEAL / DAMAGE FLASH (Requires Tint)
    if (t.flashTimer > 0) {
      if (t.flashType === 'heal') tint(100, 255, 100, t.alpha);
      else tint(255, 100, 100, t.alpha);
      useTint = true;
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
    if (!useTint && t.alpha < 254) { ctx.globalAlpha = t.alpha / 255; }
    image(sprite, 0, 0, 50, 50);
    if (useTint) noTint(); else ctx.globalAlpha = 1.0;
    pop();
  }

  pop();
}

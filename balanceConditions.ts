
export const conditionTypes: any = {
  c_chilled: {
    name: 'Chilled',
    conditionVfx: 'condition_chill',
    enemyMovementSpeedMultiplier: 0.5,
    conditionClashesConfig: {
      override: ['c_burning']
    }
  },
  c_burning: {
    name: 'Burning',
    conditionVfx: 'condition_burn',
    enemyMovementSpeedMultiplier: 1.0,
    damage: 0, // Set to 0 to avoid unintended stacking with puddle damage
    damageInterval: 6,
    conditionClashesConfig: {
      override: ['c_chilled']
    }
  },
  c_stun: {
    name: 'Stunned',
    conditionVfx: 'condition_stun',
    enemyMovementSpeedMultiplier: 0,
    conditionClashesConfig: {}
  },
  c_cleansed: {
    name: 'Cleansed',
    conditionVfx: 'condition_debuff_cleanse',
    enemyMovementSpeedMultiplier: 1.0,
    conditionClashesConfig: {
      override: ['c_chilled', 'c_burning', 'c_stun']
    }
  },
  c_raged: {
    name: 'Raged',
    conditionVfx: 'condition_raged',
    playerCombatBoost: 4.0,
    visualFlashColor: [255, 100, 200] // Pink flash
  },
  c_raged_visualonly: {
    name: 'Raged (visual)',
    conditionVfx: 'condition_raged',
    playerCombatBoost: 0.0,
    visualFlashColor: [255, 100, 200] // Pink flash
  },
  c_raged_haste: {
    name: 'Haste',
    conditionVfx: 'condition_raged',
    firerateBoost: 0.5,
    visualFlashColor: [255, 200, 100]
  },
  c_kill_rage_dmg: {
    name: 'Kill Rage',
    conditionVfx: 'condition_raged',
    damageBoost: 1.0,
    visualFlashColor: [255, 50, 50]
  },
  c_hypnotized: {
    name: 'Hypnotized',
    conditionVfx: 'condition_hypnotized',
    enemyMovementSpeedMultiplier: 1.0,
    visualFlashColor: [255, 0, 255] // Magenta/Purple flash
  }
};

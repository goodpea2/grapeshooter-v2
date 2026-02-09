
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
    damage: 2,
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
  }
};

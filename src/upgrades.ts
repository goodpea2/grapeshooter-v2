
import { state } from '../state';
import { turretTypes } from '../balanceTurrets';
import { GRID_SIZE, HOUR_FRAMES } from '../constants';
import { spawnLootAt } from '../economy';
import { Bullet } from '../class/bullet';
import { getPlayerUpgradeStat } from './playerUpgrades';

export enum TurretClass {
  SHOOTER = 'shooter',
  MINER = 'miner',
  ARMOR = 'armor',
  EXPLOSIVE = 'explosive',
  ICE = 'ice',
  STALL = 'stall',
  PLAYER = 'player'
}

export interface StatModifiers {
  damageMult?: number;
  firerateMult?: number; // This is the addition to the Divider
  healthMult?: number;
  rangeMult?: number;
  speedMult?: number; // for player
  healthAdd?: number;
  damageAdd?: number;
  playerAttackAdd?: number;
  playerMiningAdd?: number;
  shieldRadius?: number;
}

export interface TurretUpgrade {
  id: string;
  name: string;
  description: string;
  modifiers?: StatModifiers;
  conditionals?: Array<{
    type: 'neighbor_count' | 'alone' | 'class_proximity';
    targetClass?: TurretClass;
    bonus: StatModifiers;
  }>;
  hooks?: {
    onKill?: (context: any) => void;
    onMine?: (context: any) => void;
    onDeath?: (context: any) => void;
    onMerge?: (context: any) => void;
    onShot?: (context: any) => void;
  };
  onSelect?: (turretType: string, upgradeIndex: number, preRolledData?: any) => void;
  preRoll?: () => any;
}

export const UPGRADES: Record<string, TurretUpgrade> = {
  u_player_attack_dmg_1: {
    id: 'u_player_attack_dmg_1', name: 'Offensive Bond', description: 'Player attack dmg +1 for every attached instance',
    modifiers: { playerAttackAdd: 1 }
  },
  u_player_mining_dmg_2: {
    id: 'u_player_mining_dmg_2', name: 'Mining Bond', description: 'Player mining dmg +2 for every attached instance',
    modifiers: { playerMiningAdd: 2 }
  },
  u_dmg_20_n_shooter: {
    id: 'u_dmg_20_n_shooter', name: 'Shooter Focus', description: '+20% Damage for each neighboring <shooter>',
    conditionals: [{ type: 'neighbor_count', targetClass: TurretClass.SHOOTER, bonus: { damageMult: 0.2 } }]
  },
  u_firerate_20_n_shooter: {
    id: 'u_firerate_20_n_shooter', name: 'Shooter Haste', description: '+20% Fire Rate for each neighboring <shooter>',
    conditionals: [{ type: 'neighbor_count', targetClass: TurretClass.SHOOTER, bonus: { firerateMult: 0.2 } }]
  },
  u_kill_heal_10: {
    id: 'u_kill_heal_10', name: 'Vampiric Kill', description: 'Heal +10 HP after killing an enemy',
    hooks: {
      onKill: (ctx) => {
        if (ctx.source?.type !== ctx.ownerType) return;
        if (ctx.source && ctx.source.takeDamage) ctx.source.takeDamage(-10);
      }
    }
  },
  u_maxhp_100: {
    id: 'u_maxhp_100', name: 'Fortified', description: 'Max HP +100',
    modifiers: { healthAdd: 100 }
  },
  u_maxhp_200: {
    id: 'u_maxhp_200', name: 'Fortified', description: 'Max HP +200',
    modifiers: { healthAdd: 200 }
  },
  u_maxhp_300: {
    id: 'u_maxhp_300', name: 'Fortified', description: 'Max HP +300',
    modifiers: { healthAdd: 300 }
  },
  u_alone_firerate_50: {
    id: 'u_alone_firerate_50', name: 'Lone Wolf', description: 'While alone, fire rate +50%',
    conditionals: [{ type: 'alone', bonus: { firerateMult: 0.5 } }]
  },
  u_kill_firerate_50_1h: {
    id: 'u_kill_firerate_50_1h', name: 'Adrenaline', description: 'Fire rate +50% after killing an enemy for 1h',
    hooks: {
      onKill: (ctx) => {
        if (ctx.source?.type !== ctx.ownerType) return;
        if (ctx.source && ctx.source.applyCondition) ctx.source.applyCondition('c_raged_haste', HOUR_FRAMES);
      }
    }
  },
  u_dmg_20_n_random: {
    id: 'u_dmg_20_n_random', name: 'Neighbor Roll: DMG', description: '+20% Damage for each neighboring <class>',
    preRoll: () => {
      const classes = Object.values(TurretClass).filter(c => c !== TurretClass.PLAYER);
      return classes[Math.floor(Math.random() * classes.length)];
    },
    onSelect: (turretType, idx, rolled) => {
      if (!state.upgradeData[turretType]) state.upgradeData[turretType] = {};
      if (!state.upgradeData[turretType]['u_dmg_20_n_random']) state.upgradeData[turretType]['u_dmg_20_n_random'] = [];
      state.upgradeData[turretType]['u_dmg_20_n_random'][idx] = rolled;
    }
  },
  u_firerate_20_n_random: {
    id: 'u_firerate_20_n_random', name: 'Neighbor Roll: FR', description: '+20% Fire Rate for each neighboring <class>',
    preRoll: () => {
      const classes = Object.values(TurretClass).filter(c => c !== TurretClass.PLAYER);
      return classes[Math.floor(Math.random() * classes.length)];
    },
    onSelect: (turretType, idx, rolled) => {
      if (!state.upgradeData[turretType]) state.upgradeData[turretType] = {};
      if (!state.upgradeData[turretType]['u_firerate_20_n_random']) state.upgradeData[turretType]['u_firerate_20_n_random'] = [];
      state.upgradeData[turretType]['u_firerate_20_n_random'][idx] = rolled;
    }
  },
  u_shield_neighbor: {
    id: 'u_shield_neighbor', name: 'Neighbor Shield', description: 'Reuses Holonut shield. Protects neighbors.',
    modifiers: { shieldRadius: GRID_SIZE*1.8 }
  },
  u_attackloot_sun_1: {
    id: 'u_attackloot_sun_1', name: 'Sun Harvest', description: 'Attacks (shoot, launch, pulse) have a chance to spawn Sun.',
    hooks: {
      onShot: (ctx) => {
        if (true) {
          const pos = ctx.source.getWorldPos();
          spawnLootAt(pos.x, pos.y, 'sun');
        }
      }
    }
  },
  u_enemy_death_explode_50_small: {
    id: 'u_enemy_death_explode_50_small', name: 'Grape Splat', description: 'Enemies killed by this turret explodes upon death.',
    hooks: {
      onKill: (ctx) => {
        if (ctx.targetType !== 'enemy') return;
        if (ctx.source?.type !== ctx.ownerType) return;
        const target = ctx.target;
        if (!target) return;
        const pos = target.getWorldPos ? target.getWorldPos() : (target.pos ? target.pos : null);
        if (!pos) return;
        const b = new Bullet(pos.x, pos.y, pos.x, pos.y, 'b_enemy_death_explode_50_small', 'none', ctx.source);
        b.life = 0;
        state.bullets.push(b);
      }
    }
  },
  u_death_explode_100_mid: {
    id: 'u_death_explode_100_mid', name: 'Final Blast (Turret)', description: 'Spawns an explosive bullet (100 AOE dmg, 2.5 tile radius) upon this turret death. Stacks +1 bullet.',
    hooks: {
      onDeath: (ctx) => {
        if (ctx.targetType !== 'turret') return;
        if (ctx.source?.type !== ctx.ownerType) return;
        const target = ctx.target;
        if (!target) return;
        
        const pos = target.getWorldPos ? target.getWorldPos() : (target.pos ? target.pos : null);
        if (!pos) return;
        const b = new Bullet(pos.x, pos.y, pos.x, pos.y, 'b_death_explode_100_mid', 'none', ctx.source);
        b.life = 0;
        state.bullets.push(b);
      }
    }
  },
  u_player_movespeed_05: {
    id: 'u_player_movespeed_05', name: 'Swift Bond', description: 'Player movement speed +5% for every attached instance',
    modifiers: { speedMult: 0.05 }
  },
  u_range_100: {
    id: 'u_range_100', name: 'Eagle Eye', description: "Turret's shoot range +100%",
    modifiers: { rangeMult: 1.0 }
  },
  u_killloot_elixir_100: {
    id: 'u_killloot_elixir_100', name: 'Elixir Greed', description: "Doubles enemy's elixir drops when killed by this turret (non-stackable)",
    hooks: {
      onKill: (ctx) => {
        if (ctx.source?.type !== ctx.ownerType) return;
        if (ctx.elixirDoubled) return;
        // Double drops by spawning again. 
        // Note: this doubles EVERYTHING the enemy drops, but usually it's mostly elixir.
        if (ctx.targetType === 'enemy' && ctx.typeName) {
          spawnLootAt(ctx.target.pos.x, ctx.target.pos.y, ctx.typeName);
          ctx.elixirDoubled = true;
        }
      }
    }
  },
  u_player_attack_firerate_20: {
    id: 'u_player_attack_firerate_20', name: 'Haste Bond', description: 'Player attack firerate +20% for every attached instance',
    modifiers: { firerateMult: 0.2 }
  },
  u_player_mining_firerate_20: {
    id: 'u_player_mining_firerate_20', name: 'Drill Bond', description: 'Player mining firerate +20% for every attached instance',
    modifiers: { firerateMult: 0.2 }
  },
  u_kill_dmg_05: {
    id: 'u_kill_dmg_05', name: 'Slayer (5%)', description: 'Damage +5% for every enemy killed (stackable)',
  },
  u_kill_dmg_10: {
    id: 'u_kill_dmg_10', name: 'Slayer (10%)', description: 'Damage +10% for every enemy killed (stackable)',
  },
  u_kill_dmg_100_1h: {
    id: 'u_kill_dmg_100_1h', name: 'Bloodlust', description: 'Damage +100% after killing an enemy for 1h, not stackable',
    hooks: {
      onKill: (ctx) => {
        if (ctx.source?.type !== ctx.ownerType) return;
        if (ctx.source && ctx.source.applyCondition) ctx.source.applyCondition('c_kill_rage_dmg', HOUR_FRAMES);
      }
    }
  },
  u_absorb_neighbor_dmg: {
    id: 'u_absorb_neighbor_dmg', name: 'Guardian', description: 'When a neighboring turret gets hit, this turret take damage instead. Shared if multiple absorbers.',
  },
  u_death_explode_firepea: {
    id: 'u_death_explode_firepea', name: 'Fire Pea Death', description: 'Explodes with fire puddles upon death (10 firecherry puddles in 2.5 tile range)',
    hooks: {
      onDeath: (ctx) => {
        if (ctx.targetType !== 'turret') return;
        if (ctx.source?.type !== ctx.ownerType) return;
        const target = ctx.target;
        if (!target) return;
        const pos = target.getWorldPos ? target.getWorldPos() : (target.pos ? target.pos : null);
        if (!pos) return;
        const b = new Bullet(pos.x, pos.y, pos.x, pos.y, 'b_death_explode_firepea', 'none', ctx.source);
        b.life = 0;
        state.bullets.push(b);
      }
    }
  },
  u_neighbordeath_firerate_100_1h: {
    id: 'u_neighbordeath_firerate_100_1h', name: 'Vengeance', description: 'When a neighboring turret dies, fire rate +100% for 1h, not stackable',
    hooks: {
      onDeath: (ctx) => {
        if (ctx.targetType !== 'turret') return;
        const deadTurret = ctx.target;
        const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()];
        for (const turret of allTurrets) {
          if (turret.type === ctx.ownerType) {
             const neighbors = getNeighbors(turret);
             if (neighbors.includes(deadTurret)) {
               turret.applyCondition('c_raged_haste', HOUR_FRAMES);
             }
          }
        }
      }
    }
  },
  u_extrabullet_giantpea: {
    id: 'u_extrabullet_giantpea', name: 'Giant Pea', description: 'Fires a giant bullet every 20 shots, dealing 100 damage on impact. Multiple upgrades spawn more bullets.',
    hooks: {
      onShot: (ctx) => {
        if (ctx.source?.type !== ctx.ownerType) return;
        const turret = ctx.source;
        if (turret.shotCount % 20 === 0) {
           const pos = turret.getWorldPos();
           const targetPos = turret.target ? (turret.target.pos || turret.target.getWorldPos()) : { x: pos.x + 100, y: pos.y };
           const angle = atan2(targetPos.y - pos.y, targetPos.x - pos.x);
           const spread = (5 * PI / 180);
           const finalAngle = angle + random(-spread, spread);
           const tx = pos.x + cos(finalAngle) * 100;
           const ty = pos.y + sin(finalAngle) * 100;
           const b = new Bullet(pos.x, pos.y, tx, ty, 'b_giantpea', 'none', turret);
           state.bullets.push(b);
        }
      }
    }
  },
  u_test_fallback: {
    id: 'u_test_fallback',
    name: 'Test Upgrade',
    description: 'max HP +0',
    modifiers: { healthAdd: 0 }
  }
};

export const TURRET_UPGRADE_POOLS: Record<string, string[]> = {
  t_pea: [
   'u_death_explode_firepea',
   'u_neighbordeath_firerate_50_1h',
  ],
  t_mine: [
    'u_absorb_neighbor_dmg',
    'u_death_explode_100_mid'
  ],
  t_wall: [
    'u_absorb_neighbor_dmg',
    'u_maxhp_100',
    'u_maxhp_200',
    'u_maxhp_300'
  ]
};

export const UPGRADE_COSTS: Record<string, number[]> = {
  t_pea: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  t_wall: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  t_mine: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

export const TURRET_CLASSES: Record<string, TurretClass[]> = {
  t_pea: [TurretClass.SHOOTER],
  t_laser: [TurretClass.MINER],
  t_wall: [TurretClass.ARMOR],
  t_mine: [TurretClass.EXPLOSIVE],
  t_ice: [TurretClass.ICE],
  t2_repeater: [TurretClass.SHOOTER],
  t2_laser2: [TurretClass.MINER],
  t2_tall: [TurretClass.ARMOR],
  t2_minespawner: [TurretClass.EXPLOSIVE],
  t2_stun: [TurretClass.ICE],
};

// Helper to get classes for a turret type
export function getTurretClasses(type: string): TurretClass[] {
  return TURRET_CLASSES[type] || [];
}

export function getNeighbors(turret: any): any[] {
  const wPos = turret.getWorldPos();
  const neighbors: any[] = [];
  const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()];
  
  for (const other of allTurrets) {
    if (other === turret) continue;
    const oPos = other.getWorldPos();
    const d = (window as any).dist(wPos.x, wPos.y, oPos.x, oPos.y);
    if (d <= GRID_SIZE * 1.5) { // Slightly more than GRID_SIZE to account for hex/diagonal
      neighbors.push(other);
    }
  }
  return neighbors;
}

export function recalculateAllStats() {
  if (!state.player) return;
  
  // Recalculate global player bonuses
  state.playerBonuses = {
    attackAdd: 0,
    miningAdd: 0,
    speedMult: 1.0,
    attackFirerateMult: 1.0,
    miningFirerateMult: 1.0,
  };

  const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()];
  
  // First pass: sum up global bonuses from all turrets
  for (const turret of allTurrets) {
    const upgradeIds = state.turretUpgrades[turret.type] || [];
    for (const id of upgradeIds) {
      const upgrade = UPGRADES[id];
      if (!upgrade) continue;
      if (upgrade.modifiers?.playerAttackAdd) {
        state.playerBonuses.attackAdd += upgrade.modifiers.playerAttackAdd;
      }
      if (upgrade.modifiers?.playerMiningAdd) {
        state.playerBonuses.miningAdd += upgrade.modifiers.playerMiningAdd;
      }
      if (upgrade.modifiers?.speedMult) {
        state.playerBonuses.speedMult += upgrade.modifiers.speedMult;
      }
      if (upgrade.modifiers?.firerateMult) {
        if (id === 'u_player_attack_firerate_20') {
          state.playerBonuses.attackFirerateMult += upgrade.modifiers.firerateMult;
        } else if (id === 'u_player_mining_firerate_20') {
          state.playerBonuses.miningFirerateMult += upgrade.modifiers.firerateMult;
        }
      }
    }
  }

  // Second pass: recalculate each turret
  for (const turret of allTurrets) {
    recalculateTurretStats(turret);
  }
}

export function recalculateTurretStats(turret: any) {
  const type = turret.type;
  
  const stats: any = {
    damageMult: 1.0,
    firerateDivider: 1.0,
    healthMult: 1.0,
    rangeMult: 1.0,
    healthAdd: 0,
    damageAdd: 0,
    shieldRadius: 0,
  };

  const upgradeIds = state.turretUpgrades[type] || [];
  for (const id of upgradeIds) {
    const upgrade = UPGRADES[id];
    if (!upgrade) continue;

    // 1. Static Modifiers
    if (upgrade.modifiers) {
      if (upgrade.modifiers.damageMult) stats.damageMult += upgrade.modifiers.damageMult;
      if (upgrade.modifiers.firerateMult) stats.firerateDivider += upgrade.modifiers.firerateMult;
      if (upgrade.modifiers.healthMult) stats.healthMult += upgrade.modifiers.healthMult;
      if (upgrade.modifiers.rangeMult) stats.rangeMult += upgrade.modifiers.rangeMult;
      if (upgrade.modifiers.healthAdd) stats.healthAdd += upgrade.modifiers.healthAdd;
      if (upgrade.modifiers.damageAdd) stats.damageAdd += upgrade.modifiers.damageAdd;
      if (upgrade.modifiers.shieldRadius) stats.shieldRadius = Math.max(stats.shieldRadius || 0, upgrade.modifiers.shieldRadius);
    }

    // New Kill-based damage logic
    if (id === 'u_kill_dmg_05') stats.damageMult += turret.killCount * 0.05;
    if (id === 'u_kill_dmg_10') stats.damageMult += turret.killCount * 0.10;

    // 2. Conditionals
    if (upgrade.conditionals) {
      for (const cond of upgrade.conditionals) {
        if (cond.type === 'neighbor_count') {
          const neighbors = getNeighbors(turret);
          const count = neighbors.filter(n => !cond.targetClass || getTurretClasses(n.type).includes(cond.targetClass)).length;
          if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult * count;
          if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult * count;
        } else if (cond.type === 'alone') {
          const neighbors = getNeighbors(turret);
          if (neighbors.length === 0) {
            if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult;
            if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult;
          }
        }
      }
    }

    // 3. Random Neighbor Rolls
    if (id === 'u_dmg_20_n_random' || id === 'u_firerate_20_n_random') {
      const upgradeIds = state.turretUpgrades[type] || [];
      const dataList = state.upgradeData[type]?.[id] || [];
      // Find the specific instance index
      let currentInstanceIdx = -1;
      let count = 0;
      for (let i = 0; i < upgradeIds.length; i++) {
        if (upgradeIds[i] === id) {
          if (count === upgradeIds.filter((uid: string, idx: number) => uid === id && idx < upgradeIds.indexOf(id, count)).length) {
             // This logic is a bit flawed if we just want to apply ALL instances
          }
        }
      }
      
      // Simpler: just iterate all instances of this upgrade for this turret type
      for (let i = 0; i < upgradeIds.length; i++) {
        if (upgradeIds[i] === id) {
          const rolledClass = dataList[i];
          if (rolledClass) {
            const neighbors = getNeighbors(turret);
            const neighborCount = neighbors.filter(n => getTurretClasses(n.type).includes(rolledClass)).length;
            if (id === 'u_dmg_20_n_random') stats.damageMult += 0.2 * neighborCount;
            if (id === 'u_firerate_20_n_random') stats.firerateDivider += 0.2 * neighborCount;
          }
        }
      }
    }
  }

  turret.activeStats = stats;
  turret.refreshActions();

  // Update max health if changed
  const newMax = (turret.config.health * stats.healthMult) + stats.healthAdd;
  if (newMax !== turret.maxHealth) {
    const ratio = turret.health / turret.maxHealth;
    turret.maxHealth = newMax;
    turret.health = turret.maxHealth * ratio;
  }
}

export function triggerUpgradeHook(hookType: 'onKill' | 'onMine' | 'onDeath' | 'onMerge' | 'onShot', source: any, context: any) {
  const baseContext = { ...context, hookType, source };

  // Increment counters
  if (source && source.type) {
    if (hookType === 'onShot') source.shotCount++;
    if (hookType === 'onKill') source.killCount++;
  }

  // 1. Check source's own upgrades (if it's a turret)
  if (source && source.type) {
     const upgradeIds = state.turretUpgrades[source.type] || [];
     for (const id of upgradeIds) {
       const upgrade = UPGRADES[id];
       if (upgrade?.hooks && (upgrade.hooks as any)[hookType]) {
         (upgrade.hooks as any)[hookType]({ ...baseContext, ownerType: source.type });
       }
     }
  }

  // 2. Check global upgrades (excluding the source's type to avoid double trigger)
  for (const turretType in state.turretUpgrades) {
    if (source && source.type === turretType) continue;
    const upgradeIds = state.turretUpgrades[turretType];
    for (const id of upgradeIds) {
      const upgrade = UPGRADES[id];
      if (upgrade?.hooks && (upgrade.hooks as any)[hookType]) {
        (upgrade.hooks as any)[hookType]({ ...baseContext, ownerType: turretType });
      }
    }
  }
}

declare const dist: any;
declare const atan2: any;
declare const random: any;
declare const PI: any;
declare const cos: any;
declare const sin: any;

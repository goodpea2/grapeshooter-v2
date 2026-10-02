
import { state } from '../state';
import { turretTypes } from '../balanceTurrets';
import { GRID_SIZE, HOUR_FRAMES } from '../constants';
import { spawnLootAt } from '../economy';
import { Bullet } from '../class/bullet';
import { getPlayerUpgradeStat } from './playerUpgrades';
import { eventBus } from './events/eventBus';
import { spawnStatChangePopup } from '../vfx/index';

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
  initialHealthAdd?: number;
  damageAdd?: number;
  playerAttackAdd?: number;
  playerMiningAdd?: number;
  playerMiningDamageAdd?: number;
  playerSpeedAdd?: number;
  playerSpeedMult?: number;
  playerFirerateAdd?: number;
  playerStaminaAdd?: number;
  staminaRechargeMult?: number;
  playerRangeAdd?: number;
  shieldRadius?: number;
  aoeDamageMult?: number;
  aoeRadiusMult?: number;
  stunDurationMult?: number;
  chillDurationMult?: number;
  knockbackMult?: number;
  inaccuracyAdd?: number;
  puddleRadiusMult?: number;
  absorbNeighborDamage?: boolean;
  targetTypeOverride?: string[];
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
        const b = Bullet.create(pos.x, pos.y, pos.x, pos.y, 'b_enemy_death_explode_50_small', 'none', ctx.source);
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
        const b = Bullet.create(pos.x, pos.y, pos.x, pos.y, 'b_death_explode_100_mid', 'none', ctx.source);
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
        const b = Bullet.create(pos.x, pos.y, pos.x, pos.y, 'b_death_explode_firepea', 'none', ctx.source);
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
           const b = Bullet.create(pos.x, pos.y, tx, ty, 'b_giantpea', 'none', turret);
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
  t2_firepea: [TurretClass.SHOOTER],
  t2_peanut: [TurretClass.SHOOTER, TurretClass.ARMOR],
  t2_mortar: [TurretClass.SHOOTER, TurretClass.EXPLOSIVE],
  t2_snowpea: [TurretClass.SHOOTER, TurretClass.ICE],
  t2_pulse: [TurretClass.EXPLOSIVE],
  t2_icewall: [TurretClass.ARMOR, TurretClass.ICE],
  t2_torchwood: [TurretClass.SHOOTER],
};

export function getUpgradeDefinition(upgradeId: string, turretType?: string): any {
  if (UPGRADES[upgradeId]) return UPGRADES[upgradeId];
  if (turretType && turretTypes[turretType]?.upgrades) {
    const found = turretTypes[turretType].upgrades.find((u: any) => u.id === upgradeId);
    if (found) return found;
  }
  for (const k in turretTypes) {
    const upgs = turretTypes[k]?.upgrades;
    if (upgs) {
      const found = upgs.find((u: any) => u.id === upgradeId);
      if (found) return found;
    }
  }
  return undefined;
}

// Helper to get classes and elements for a turret type
export function getTurretClasses(type: string): string[] {
  const classes: string[] = [];
  if (TURRET_CLASSES[type]) {
    classes.push(...TURRET_CLASSES[type]);
  }
  const tr = turretTypes[type];
  if (tr) {
    if (tr.drops?.leaf || tr.costAlmanac?.leaf) { classes.push('c_leaf', 'leaf'); }
    if (tr.drops?.shard || tr.costAlmanac?.shard) { classes.push('c_shard', 'shard'); }
    if (tr.drops?.shell || tr.costAlmanac?.shell) { classes.push('c_shell', 'shell'); }
    if (tr.drops?.fuel || tr.costAlmanac?.fuel) { classes.push('c_fuel', 'fuel'); }
    if (tr.drops?.ice || tr.costAlmanac?.ice) { classes.push('c_ice', 'ice'); }
    if (tr.drops?.sun || tr.costAlmanac?.sun) { classes.push('sun'); }
    if (tr.drops?.elixir || tr.costAlmanac?.elixir) { classes.push('elixir'); }

    if (tr.actionType?.includes('shoot')) { classes.push(TurretClass.SHOOTER, 'shooter', 'c_shooter'); }
    if (tr.actionType?.includes('laserBeam')) { classes.push(TurretClass.MINER, 'miner', 'c_miner'); }
    if (tr.actionType?.includes('pulse')) { classes.push(TurretClass.EXPLOSIVE, 'explosive', 'c_explosive', 'c_explode'); }
    if (tr.name === 'Wallnut' || tr.name === 'Peanut' || tr.health >= 500 || tr.name?.toLowerCase().includes('wall') || tr.name?.toLowerCase().includes('wallnut')) {
      classes.push(TurretClass.ARMOR, 'armor', 'c_armor', 'c_wall', 'wall');
    }
  }
  return Array.from(new Set(classes));
}

export function getEmptyNeighborSlots(turret: any): number {
  if (!turret) return 0;

  // 1. Attached Turret on Player: Check 6 hex directions. (0,0) is occupied by player.
  if ((turret.isAttachedToPlayer && turret.isAttachedToPlayer()) || (turret.hq !== undefined && turret.hr !== undefined && turret.parent)) {
    const hexDirs = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    let occupied = 0;
    const attachments = state.player?.attachments || [];
    for (const [dq, dr] of hexDirs) {
      const nq = turret.hq + dq;
      const nr = turret.hr + dr;
      if (nq === 0 && nr === 0) {
        // Player core occupies this slot
        occupied++;
      } else if (attachments.some((a: any) => a !== turret && a.hq === nq && a.hr === nr)) {
        occupied++;
      }
    }
    return Math.max(0, 6 - occupied);
  }

  // 2. World Turret: Check 8 surrounding tiles in world grid
  if (turret.gx !== undefined && turret.gy !== undefined && state.world) {
    let occupied = 0;
    const allWorld = state.world.getAllTurrets ? state.world.getAllTurrets() : [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const tgx = turret.gx + dx;
        const tgy = turret.gy + dy;
        if (allWorld.some((other: any) => other !== turret && other.gx === tgx && other.gy === tgy)) {
          occupied++;
        }
      }
    }
    return Math.max(0, 8 - occupied);
  }

  // Fallback
  return Math.max(0, 8 - getNeighbors(turret).length);
}

export function getNeighbors(turret: any): any[] {
  if (!turret) return [];
  
  // 1. Attached Turret on Player: Check hex axial distance == 1
  if ((turret.isAttachedToPlayer && turret.isAttachedToPlayer()) || (turret.hq !== undefined && turret.hr !== undefined && turret.parent)) {
    const neighbors: any[] = [];
    if (state.player?.attachments) {
      for (const other of state.player.attachments) {
        if (other === turret || other.hq === undefined || other.hr === undefined) continue;
        const dq = turret.hq - other.hq;
        const dr = turret.hr - other.hr;
        // Hex axial distance formula: (abs(dq) + abs(dq + dr) + abs(dr)) / 2
        const hexDist = (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
        if (hexDist === 1) {
          neighbors.push(other);
        }
      }
    }
    return neighbors;
  }

  // 2. World Turret: Check tile grid Chebyshev/Manhattan distance <= 1
  if (turret.gx !== undefined && turret.gy !== undefined && state.world) {
    const neighbors: any[] = [];
    const allWorld = state.world.getAllTurrets ? state.world.getAllTurrets() : [];
    for (const other of allWorld) {
      if (other === turret || other.gx === undefined || other.gy === undefined) continue;
      const dx = Math.abs(turret.gx - other.gx);
      const dy = Math.abs(turret.gy - other.gy);
      if (dx <= 1 && dy <= 1 && (dx + dy > 0)) {
        neighbors.push(other);
      }
    }
    return neighbors;
  }

  // 3. Fallback: world distance
  const wPos = turret.getWorldPos ? turret.getWorldPos() : turret.pos;
  if (!wPos) return [];
  const neighbors: any[] = [];
  const allTurrets = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])];
  
  for (const other of allTurrets) {
    if (other === turret) continue;
    const oPos = other.getWorldPos ? other.getWorldPos() : other.pos;
    if (!oPos) continue;
    const d = (window as any).dist(wPos.x, wPos.y, oPos.x, oPos.y);
    if (d <= GRID_SIZE * 1.5) {
      neighbors.push(other);
    }
  }
  return neighbors;
}

export function recalculateAllStats() {
  if (!state.player) return;
  
  const oldPlayerBonuses = (state as any).prevPlayerBonuses || null;

  // Recalculate global player bonuses
  state.playerBonuses = {
    attackAdd: 0,
    miningAdd: 0,
    speedMult: 1.0,
    attackFirerateMult: 1.0,
    miningFirerateMult: 1.0,
    maxStaminaAdd: 0,
    staminaRechargeMult: 0,
    rangeMult: 1.0,
  };

  const allTurrets = [...state.player.attachments, ...state.world.getAllTurrets()];
  
  // First pass: sum up global bonuses from all attached turrets (and global upgrades)
  for (const turret of state.player.attachments) {
    const upgradeIds = state.turretUpgrades[turret.type] || [];
    for (const id of upgradeIds) {
      const upgrade = getUpgradeDefinition(id, turret.type);
      if (!upgrade) continue;
      if (upgrade.modifiers?.playerAttackAdd) {
        state.playerBonuses.attackAdd += upgrade.modifiers.playerAttackAdd;
      }
      if (upgrade.modifiers?.playerMiningAdd) {
        state.playerBonuses.miningAdd += upgrade.modifiers.playerMiningAdd;
      }
      if (upgrade.modifiers?.playerMiningDamageAdd) {
        state.playerBonuses.miningAdd += upgrade.modifiers.playerMiningDamageAdd;
      }
      if (upgrade.modifiers?.playerSpeedAdd) {
        state.playerBonuses.speedMult += upgrade.modifiers.playerSpeedAdd;
      }
      if (upgrade.modifiers?.playerSpeedMult) {
        state.playerBonuses.speedMult += upgrade.modifiers.playerSpeedMult;
      }
      if (upgrade.modifiers?.speedMult) {
        state.playerBonuses.speedMult += upgrade.modifiers.speedMult;
      }
      if (upgrade.modifiers?.playerFirerateAdd) {
        state.playerBonuses.attackFirerateMult += upgrade.modifiers.playerFirerateAdd;
        state.playerBonuses.miningFirerateMult += upgrade.modifiers.playerFirerateAdd;
      }
      if (upgrade.modifiers?.playerStaminaAdd !== undefined) {
        state.playerBonuses.maxStaminaAdd += upgrade.modifiers.playerStaminaAdd;
      } else if (upgrade.modifiers?.playerMaxStaminaAdd !== undefined) {
        state.playerBonuses.maxStaminaAdd += upgrade.modifiers.playerMaxStaminaAdd;
      }
      if (upgrade.modifiers?.staminaRechargeMult) {
        state.playerBonuses.staminaRechargeMult += upgrade.modifiers.staminaRechargeMult;
      }
      if (upgrade.modifiers?.playerRangeAdd) {
        state.playerBonuses.rangeMult += upgrade.modifiers.playerRangeAdd;
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

  // VFX popup for player stat changes
  if (oldPlayerBonuses && state.frames > 15 && state.player?.pos) {
    let popupDelay = 0;
    const diffs: { label: string; isUp: boolean }[] = [];
    if (Math.abs(state.playerBonuses.attackAdd - oldPlayerBonuses.attackAdd) > 0.001) {
      diffs.push({ label: 'Atk', isUp: state.playerBonuses.attackAdd > oldPlayerBonuses.attackAdd });
    }
    if (Math.abs(state.playerBonuses.miningAdd - oldPlayerBonuses.miningAdd) > 0.001) {
      diffs.push({ label: 'Mining', isUp: state.playerBonuses.miningAdd > oldPlayerBonuses.miningAdd });
    }
    if (Math.abs(state.playerBonuses.attackFirerateMult - oldPlayerBonuses.attackFirerateMult) > 0.001 || Math.abs(state.playerBonuses.miningFirerateMult - oldPlayerBonuses.miningFirerateMult) > 0.001) {
      const isUp = (state.playerBonuses.attackFirerateMult > oldPlayerBonuses.attackFirerateMult) || (state.playerBonuses.miningFirerateMult > oldPlayerBonuses.miningFirerateMult);
      diffs.push({ label: 'Fire Rate', isUp });
    }
    if (Math.abs(state.playerBonuses.maxStaminaAdd - oldPlayerBonuses.maxStaminaAdd) > 0.001) {
      diffs.push({ label: 'Max Stamina', isUp: state.playerBonuses.maxStaminaAdd > oldPlayerBonuses.maxStaminaAdd });
    }
    const oldStamRecharge = (oldPlayerBonuses.staminaRechargeMult || 0) + ((oldPlayerBonuses as any).staminaUpgradeBonus || 0);
    const curStamBonus = getPlayerUpgradeStat('staminaRecoveryRate') || 0;
    const curStamRecharge = (state.playerBonuses.staminaRechargeMult || 0) + curStamBonus;
    if (Math.abs(curStamRecharge - oldStamRecharge) > 0.001) {
      diffs.push({ label: 'Stam Rec', isUp: curStamRecharge > oldStamRecharge });
    }
    (state.playerBonuses as any).staminaUpgradeBonus = curStamBonus;
    if (Math.abs(state.playerBonuses.speedMult - oldPlayerBonuses.speedMult) > 0.001) {
      diffs.push({ label: 'Move Speed', isUp: state.playerBonuses.speedMult > oldPlayerBonuses.speedMult });
    }
    if (Math.abs(state.playerBonuses.rangeMult - oldPlayerBonuses.rangeMult) > 0.001) {
      diffs.push({ label: 'Range', isUp: state.playerBonuses.rangeMult > oldPlayerBonuses.rangeMult });
    }

    for (const d of diffs) {
      state.vfx.push(spawnStatChangePopup(state.player.pos.x, state.player.pos.y, d.label, d.isUp, popupDelay));
      popupDelay += 14;
    }
  }
  (state as any).prevPlayerBonuses = { ...state.playerBonuses };

  // Second pass: recalculate each turret
  for (const turret of allTurrets) {
    recalculateTurretStats(turret);
  }
}

export function recalculateTurretStats(turret: any) {
  const type = turret.type;
  const oldStats = turret.activeStats ? { ...turret.activeStats } : null;
  const buffingNeighbors: any[] = [];
  
  const stats: any = {
    damageMult: 1.0,
    firerateDivider: 1.0,
    healthMult: 1.0,
    rangeMult: 1.0,
    healthAdd: 0,
    damageAdd: 0,
    shieldRadius: 0,
    armingTimeMult: 0,
    aoeDamageMult: 0,
    aoeRadiusMult: 0,
    stunDurationMult: 0,
    chillDurationMult: 0,
    knockbackMult: 0,
    inaccuracyAdd: 0,
    puddleRadiusMult: 0,
    absorbNeighborDamage: false,
  };

  const upgradeIds = state.turretUpgrades[type] || [];
  for (const id of upgradeIds) {
    const upgrade = getUpgradeDefinition(id, type);
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
      if (upgrade.modifiers.armingTimeMult) stats.armingTimeMult += upgrade.modifiers.armingTimeMult;
      if (upgrade.modifiers.aoeDamageMult) stats.aoeDamageMult += upgrade.modifiers.aoeDamageMult;
      if (upgrade.modifiers.aoeRadiusMult) stats.aoeRadiusMult += upgrade.modifiers.aoeRadiusMult;
      if (upgrade.modifiers.stunDurationMult) stats.stunDurationMult += upgrade.modifiers.stunDurationMult;
      if (upgrade.modifiers.chillDurationMult) stats.chillDurationMult += upgrade.modifiers.chillDurationMult;
      if (upgrade.modifiers.knockbackMult) stats.knockbackMult += upgrade.modifiers.knockbackMult;
      if (upgrade.modifiers.inaccuracyAdd) stats.inaccuracyAdd += upgrade.modifiers.inaccuracyAdd;
      if (upgrade.modifiers.puddleRadiusMult) stats.puddleRadiusMult += upgrade.modifiers.puddleRadiusMult;
      if (upgrade.modifiers.hypnotizeDuration) stats.hypnotizeDuration = upgrade.modifiers.hypnotizeDuration;
    }

    if (id === 'u_t_wall_3' || id === 'u_absorb_neighbor_dmg' || id === 'u_t2_tall_3' || upgrade.modifiers?.absorbNeighborDamage) {
      stats.absorbNeighborDamage = true;
    }

    if (upgrade.modifiers?.targetTypeOverride) {
      stats.targetTypeOverride = upgrade.modifiers.targetTypeOverride;
    }

    // Kill-based damage logic
    if (id === 'u_kill_dmg_05') stats.damageMult += (turret.killCount || 0) * 0.05;
    if (id === 'u_kill_dmg_10') stats.damageMult += (turret.killCount || 0) * 0.10;

    // 2. Conditionals
    if (upgrade.conditionals) {
      for (const cond of upgrade.conditionals) {
        if (cond.type === 'neighbor_count') {
          const neighbors = getNeighbors(turret);
          const matchingNeighbors = neighbors.filter(n => !cond.targetClass || getTurretClasses(n.type).includes(cond.targetClass) || getTurretClasses(n.type).includes(cond.targetClass.replace('c_', '')));
          if (matchingNeighbors.length > 0) {
            buffingNeighbors.push(...matchingNeighbors);
          }
          const step = (cond as any).step || 1;
          const count = Math.floor(matchingNeighbors.length / step);
          if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult * count;
          if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult * count;
          if (cond.bonus.rangeMult) stats.rangeMult += cond.bonus.rangeMult * count;
          if ((cond.bonus as any).aoeDamageMult) stats.aoeDamageMult += (cond.bonus as any).aoeDamageMult * count;
          if ((cond.bonus as any).aoeRadiusMult) stats.aoeRadiusMult += (cond.bonus as any).aoeRadiusMult * count;
          if ((cond.bonus as any).puddleRadiusMult) stats.puddleRadiusMult = (stats.puddleRadiusMult || 0) + (cond.bonus as any).puddleRadiusMult * count;
          if ((cond.bonus as any).puddleDamageMult) stats.puddleDamageMult = (stats.puddleDamageMult || 0) + (cond.bonus as any).puddleDamageMult * count;
        } else if (cond.type === 'neighbor_type') {
          const neighbors = getNeighbors(turret);
          const matchingNeighbors = neighbors.filter(n => n.type === (cond as any).targetType);
          if (matchingNeighbors.length > 0) {
            buffingNeighbors.push(...matchingNeighbors);
          }
          const count = matchingNeighbors.length;
          if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult * count;
          if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult * count;
          if (cond.bonus.rangeMult) stats.rangeMult += cond.bonus.rangeMult * count;
        } else if (cond.type === 'alone') {
          const neighbors = getNeighbors(turret);
          if (neighbors.length === 0) {
            if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult;
            if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult;
            if (cond.bonus.rangeMult) stats.rangeMult += cond.bonus.rangeMult;
          }
        } else if ((cond.type as any) === 'charged') {
          const isAttached = turret.isAttachedToPlayer ? turret.isAttachedToPlayer() : ((turret as any).hq !== undefined || state.player?.attachments?.includes(turret));
          if (isAttached) {
            const isCharged = (turret.isCharged && turret.isCharged()) || state.player?.isBoosting || state.player?.isClickHolding;
            if (isCharged) {
              if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult;
              if (cond.bonus.firerateMult) stats.firerateDivider += cond.bonus.firerateMult;
              if (cond.bonus.rangeMult) stats.rangeMult += cond.bonus.rangeMult;
              if ((cond.bonus as any).staminaCostAdd) stats.staminaCostAdd = (stats.staminaCostAdd || 0) + (cond.bonus as any).staminaCostAdd;
            }
          }
        } else if ((cond.type as any) === 'empty_neighbor_count') {
          const emptyCount = getEmptyNeighborSlots(turret);
          if ((cond.bonus as any).healthAdd) stats.healthAdd += (cond.bonus as any).healthAdd * emptyCount;
          if (cond.bonus.rangeMult) stats.rangeMult += cond.bonus.rangeMult * emptyCount;
          if (cond.bonus.damageMult) stats.damageMult += cond.bonus.damageMult * emptyCount;
        }
      }
    }

    // 3. Random Neighbor Rolls
    if (id === 'u_dmg_20_n_random' || id === 'u_firerate_20_n_random') {
      const dataList = state.upgradeData?.[type]?.[id] || [];
      for (let i = 0; i < upgradeIds.length; i++) {
        if (upgradeIds[i] === id) {
          const rolledClass = dataList[i];
          if (rolledClass) {
            const neighbors = getNeighbors(turret);
            const matchingNeighbors = neighbors.filter(n => getTurretClasses(n.type).includes(rolledClass));
            if (matchingNeighbors.length > 0) {
              buffingNeighbors.push(...matchingNeighbors);
            }
            const neighborCount = matchingNeighbors.length;
            if (id === 'u_dmg_20_n_random') stats.damageMult += 0.2 * neighborCount;
            if (id === 'u_firerate_20_n_random') stats.firerateDivider += 0.2 * neighborCount;
          }
        }
      }
    }
  }

  // Plant death damage bonus (e.g. u_t2_snowpea_5)
  if (turret.deathDmgBonus) {
    stats.damageMult += turret.deathDmgBonus;
  }

  // Pulser fuel plant damage bonus (u_t2_pulse_3)
  if (turret.type === 't2_pulse' && (state as any).t2PulseFuelPlantDmgBonus) {
    stats.damageMult += (state as any).t2PulseFuelPlantDmgBonus;
    stats.aoeDamageMult = (stats.aoeDamageMult || 0) + (state as any).t2PulseFuelPlantDmgBonus;
  }

  // u_t2_wallaser_5: While on max health, neighboring plants' Max Health +100
  const allNeighbors = getNeighbors(turret);
  for (const n of allNeighbors) {
    if (n && n.type === 't2_wallaser' && (state.turretUpgrades?.['t2_wallaser'] || []).includes('u_t2_wallaser_5')) {
      const isFullHp = n.health >= (n.maxHealth || n.config?.maxHealth || n.config?.health || 150);
      if (isFullHp) {
        stats.healthAdd += 100;
        buffingNeighbors.push(n);
      }
    }
  }

  // u_t2_torchwood_5: Neighboring [c_leaf]'s range +10%
  if (getTurretClasses(turret.type).includes('c_leaf')) {
    for (const n of allNeighbors) {
      if (n && n.type === 't2_torchwood' && (state.turretUpgrades?.['t2_torchwood'] || []).includes('u_t2_torchwood_5')) {
        const count = (state.turretUpgrades?.['t2_torchwood'] || []).filter((id: string) => id === 'u_t2_torchwood_5').length;
        stats.rangeMult += 0.1 * Math.max(1, count);
        buffingNeighbors.push(n);
      }
    }
  }

  // u_t3_triplepea_5: Neighboring [c_shell]'s max health -20%
  const classesOfTurret = getTurretClasses(turret.type);
  if (classesOfTurret.includes('c_shell') || classesOfTurret.includes('shell')) {
    for (const n of allNeighbors) {
      if (n && n.type === 't3_triplepea' && (state.turretUpgrades?.['t3_triplepea'] || []).includes('u_t3_triplepea_5')) {
        const count = (state.turretUpgrades?.['t3_triplepea'] || []).filter((id: string) => id === 'u_t3_triplepea_5').length;
        stats.healthMult *= Math.max(0.1, 1 - 0.2 * count);
        buffingNeighbors.push(n);
      }
    }
  }

  turret.buffingNeighbors = Array.from(new Set(buffingNeighbors));
  turret.activeStats = stats;
  turret.refreshActions();

  // Update max health if changed
  const baseMax = turret.config?.maxHealth !== undefined ? turret.config.maxHealth : (turret.config?.health ?? 50);
  const newMax = (baseMax * stats.healthMult) + stats.healthAdd;
  if (newMax !== turret.maxHealth) {
    const ratio = turret.maxHealth > 0 ? (turret.health / turret.maxHealth) : 1;
    turret.maxHealth = newMax;
    turret.health = Math.min(turret.maxHealth, turret.maxHealth * ratio);
  }

  // VFX popups for turret stat updates
  if (oldStats && state.frames > 15 && turret.getWorldPos) {
    const wPos = turret.getWorldPos();
    let popupDelay = 0;
    const diffs: { label: string; isUp: boolean }[] = [];
    if (Math.abs(stats.damageMult - oldStats.damageMult) > 0.001 || Math.abs(stats.damageAdd - oldStats.damageAdd) > 0.001) {
      const isUp = (stats.damageMult > oldStats.damageMult) || (stats.damageAdd > oldStats.damageAdd);
      diffs.push({ label: 'Atk', isUp });
    }
    if (Math.abs(stats.firerateDivider - oldStats.firerateDivider) > 0.001) {
      const isUp = stats.firerateDivider > oldStats.firerateDivider;
      diffs.push({ label: 'Fire Rate', isUp });
    }
    if (Math.abs(stats.rangeMult - oldStats.rangeMult) > 0.001) {
      const isUp = stats.rangeMult > oldStats.rangeMult;
      diffs.push({ label: 'Range', isUp });
    }
    for (const d of diffs) {
      state.vfx.push(spawnStatChangePopup(wPos.x, wPos.y, d.label, d.isUp, popupDelay));
      popupDelay += 14;
    }
  }
}

export function triggerUpgradeHook(hookType: 'onKill' | 'onMine' | 'onDeath' | 'onMerge' | 'onShot' | 'onDetach' | 'onStaminaSpent' | 'onHold' | 'onPlant', source: any, context: any) {
  const baseContext = { ...context, hookType, source };

  // Increment counters
  if (source && source.type) {
    if (hookType === 'onShot') source.shotCount = (source.shotCount || 0) + 1;
    if (hookType === 'onKill') source.killCount = (source.killCount || 0) + 1;
  }

  // Dispatch to EventBus for decoupled listeners
  if (hookType === 'onKill') {
    eventBus.emit('ENEMY_KILLED', {
      enemy: context.enemy || context.target,
      source: source,
      pos: context.pos || context.enemy?.pos || (source?.pos ? { x: source.pos.x, y: source.pos.y } : { x: 0, y: 0 }),
      isBoss: context.isBoss || context.enemy?.type?.includes('giant'),
      typeKey: context.enemy?.type || 'unknown'
    });
  } else if (hookType === 'onMine') {
    eventBus.emit('BLOCK_MINED', {
      block: context.block,
      pos: context.pos || { x: 0, y: 0 },
      source: source
    });
  } else if (hookType === 'onShot') {
    eventBus.emit('TURRET_FIRED', {
      turret: source,
      bullet: context.bullet,
      targetPos: context.targetPos
    });
  } else if (hookType === 'onMerge') {
    eventBus.emit('TURRET_MERGED', {
      resultTurret: source,
      ingredientTypes: context.ingredientTypes || [],
      pos: source?.pos
    });
  } else if (hookType === 'onPlant') {
    eventBus.emit('TURRET_PLACED', {
      turret: source,
      isAttached: context.isAttached ?? (source?.isAttachedToPlayer ? source.isAttachedToPlayer() : true),
      pos: context.pos || (source?.getWorldPos ? source.getWorldPos() : source?.pos) || { x: 0, y: 0 }
    });
  }

  // 1. Check source's own upgrades (if it's a turret)
  if (source && source.type) {
     const upgradeIds = state.turretUpgrades[source.type] || [];
     for (const id of upgradeIds) {
       const upgrade = getUpgradeDefinition(id, source.type);
       if (upgrade?.hooks && (upgrade.hooks as any)[hookType]) {
         (upgrade.hooks as any)[hookType]({ ...baseContext, ownerType: source.type });
       }
     }
  }

  // 2. Check all other turret types' upgrades
  for (const turretType in state.turretUpgrades) {
    if (source && source.type === turretType) continue;
    const upgradeIds = state.turretUpgrades[turretType] || [];
    for (const id of upgradeIds) {
      const upgrade = getUpgradeDefinition(id, turretType);
      if (upgrade?.hooks && (upgrade.hooks as any)[hookType]) {
        (upgrade.hooks as any)[hookType]({ ...baseContext, ownerType: turretType });
      }
    }
  }
}


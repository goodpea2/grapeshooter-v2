
import { state } from '../state';
import { turretTypes } from '../balanceTurrets';
import { TYPE_MAP } from '../assetTurret';
import { TURRET_RECIPES } from '../dictionaryTurretMerging';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const ellipse: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const TOP: any;
declare const CENTER: any;
declare const width: any;
declare const height: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const floor: any;
declare const dist: any;

interface TurretDisplayStat {
    label: string;
    value: string;
}

export const DEFAULT_STATS = [
    { label: 'WIP', value: '--' },
    { label: 'WIP', value: '--' },
    { label: 'WIP', value: '--' },
    { label: 'WIP', value: '--' },
    { label: 'WIP', value: '--' },
    { label: 'WIP', value: '--' },
];

export const TURRET_DISPLAY_STATS: Record<string, TurretDisplayStat[]> = {
    // TIER 0 / BASIC
    't_sunflower': [
        { label: 'Health', value: '50' }, { label: 'Sun production', value: '1h' }, { label: ' ', value: ' ' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_lilypad': [
        { label: 'Health', value: '50' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_seed': [
        { label: 'Health', value: '50' }, { label: 'Growth timer', value: '8h' }, { label: 'Water boost', value: '4x' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_seed2': [
        { label: 'Health', value: '50' }, { label: 'Growth timer', value: '12h' }, { label: 'Water boost', value: '4x' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_seed3': [
        { label: 'Health', value: '50' }, { label: 'Growth timer', value: '16h' }, { label: 'Water boost', value: '4x' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't0_cherrybomb': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '90-60' }, { label: 'AOE radius', value: '2.5-5 tiles' },
        { label: ' ', value: 'x10 Damage to blocks' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't0_firecherry': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '50' }, { label: 'AOE radius', value: '5 tiles' },
        { label: 'Flame dmg', value: '20 dps' }, { label: 'Flame duration', value: '2h' }, { label: ' ', value: ' ' }
    ],
    't0_iceshroom': [
        { label: 'Health', value: '50' }, { label: 'Freeze duration', value: '4h' }, { label: 'AOE radius', value: '12 tiles' },
        { label: 'Explode timer', value: '6 sec' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't0_starfruit': [
        { label: 'Health', value: '100' }, { label: 'Heal per sec', value: '10' }, { label: 'Lifetime', value: '2h' },
        { label: 'Radius', value: '2.5 tiles' }, { label: 'Target', value: 'Plants' }, { label: ' ', value: ' ' }
    ],
    't0_jalapeno': [
        { label: 'Health', value: '50' }, { label: 'Fire rate buff', value: '4' }, { label: 'Lifetime', value: '2h' },
        { label: 'Target', value: 'Player' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't0_puffshroom': [
        { label: 'Health', value: '30' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '1 sec' },
        { label: 'Target', value: 'Mobs' }, { label: 'Lifetime', value: '12h' }, { label: ' ', value: ' ' }
    ],
    't0_grapeshot': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '150' }, { label: 'AOE dmg', value: '10-100' },
        { label: 'AOE radius', value: '1.5 tiles' }, { label: ' ', value: 'Targets highest health' }, { label: 'Ammo', value: '16' }
    ],

    // TIER 1
    't_pea': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '0.75 sec' },
        { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_laser': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_wall': [
        { label: 'Health', value: '300' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_mine': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '600-100' }, { label: 'AOE radius', value: '0.5-1.5 tiles' },
        { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '2h' }, { label: ' ', value: ' ' }
    ],
    't_ice': [
        { label: 'Health', value: '50' }, { label: 'Stun duration', value: '2h' }, { label: 'Target', value: '1 Mob' },
        { label: 'Arming rate', value: '1h' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],

    // TIER 2
    't2_repeater': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10 x3' }, { label: 'Fire rate', value: '0.75 sec' },
        { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't2_firepea': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.75 sec' },
        { label: 'Target', value: 'All' }, { label: 'Flame dmg', value: '20 dps' }, { label: 'Flame duration', value: '1 sec' }
    ],
    't2_peanut': [
        { label: 'Health', value: '300' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '0.2 sec' },
        { label: 'Target', value: 'Mobs' }, { label: 'Inaccuracy', value: '45 degree' }, { label: ' ', value: ' ' }
    ],
    't2_mortar': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '30' }, { label: 'AOE dmg', value: '10' },
        { label: 'AOE radius', value: '1.5 tiles' }, { label: 'Fire rate', value: '1.5 sec' }, { label: 'Target', value: 'Mobs' }
    ],
    't2_snowpea': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Chill duration', value: '4 sec' },
        { label: 'Fire rate', value: '0.75 sec' }, { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }
    ],
    't2_laser2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '15' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't2_wallaser': [
        { label: 'Health', value: '150' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Heal per block', value: '50' }, { label: 'Max Health', value: '1200' }
    ],
    't2_laserexplode': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Explode Dmg', value: '80-20' }, { label: ' ', value: 'Explodes 1.5-2.5 tiles' }
    ],
    't2_heallaser': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Heal per block', value: '10' }, { label: 'Heal radius', value: '1.5 tiles' }
    ],
    't2_tall': [
        { label: 'Health', value: '900' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't2_pulse': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '45' }, { label: 'AOE radius', value: '2.0 tiles' },
        { label: 'Dmg rate', value: '1.5 sec' }, { label: 'Target', value: 'All' }, { label: ' ', value: ' ' }
    ],
    't2_icewall': [
        { label: 'Health', value: '300' }, { label: 'Chill radius', value: '2 tiles' }, { label: 'AOE radius', value: '0.5-1.5 tiles' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't2_minespawner': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '600-100' }, { label: 'AOE radius', value: '0.5-1.5 tiles' },
        { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '2h' }, { label: ' ', value: 'Fling mines when armed' }
    ],
    't2_torchwood': [
        { label: 'Health', value: '50' }, { label: 'Dmg Buff', value: '+3' }, { label: 'Buff radius', value: '1.5 tiles' },
        { label: 'Target', value: 'Mobs' }, { label: ' ', value: 'Targets highest health' }, { label: ' ', value: ' ' }
    ],
    't2_stun': [
        { label: 'Health', value: '50' }, { label: 'Stun radius', value: '1 tile' }, { label: 'Stun duration', value: '2h' },
        { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '1h' }, { label: ' ', value: ' ' }
    ],

    // TIER 3
    't3_triplepea': [
        { label: 'Health', value: '150' }, { label: 'Damage', value: '10 x8' }, { label: 'Fire rate', value: '0.75 sec' },
        { label: 'Target', value: '4x Mobs' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_firepea2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '0.75 sec' },
        { label: 'Target', value: 'All' }, { label: 'Flame dmg', value: '20 dps' }, { label: 'Flame duration', value: '6 sec' }
    ],
    't3_bowling': [
        { label: 'Health', value: '300' }, { label: 'Damage', value: '30' }, { label: 'Hit count', value: '5' },
        { label: 'Fire rate', value: '1.5 sec' }, { label: 'Target', value: 'All' }, { label: ' ', value: 'Pushes enemy back' }
    ],
    't3_mortar2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '50' }, { label: 'AOE dmg', value: '40' },
        { label: 'AOE radius', value: '2.5 tiles' }, { label: 'Fire rate', value: '1.5 sec' }, { label: 'Target', value: 'Mobs' }
    ],
    't3_snowpea2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Stun duration', value: '1.5 sec' },
        { label: 'Chill duration', value: '10 sec' }, { label: 'Fire rate', value: '0.75 sec' }, { label: 'Target', value: 'Mobs' }
    ],
    't3_witch': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '1.5 sec' },
        { label: 'Flame dmg', value: '20 dps' }, { label: 'Flame duration', value: '6 sec' }, { label: ' ', value: 'Spawns friendly mob' }
    ],
    't3_flamethrower': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Flame spawn', value: '0.17 sec' },
        { label: 'Flame dmg', value: '30 dps' }, { label: 'Flame duration', value: '1 sec' }, { label: 'Target', value: 'All' }
    ],
    't3_firecharge': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '10 x3' }, { label: 'AOE radius', value: '1.5 tiles' },
        { label: 'Fire rate', value: '1.5 sec' }, { label: ' ', value: 'Charged fire rate: 0.17 sec' }, { label: 'Target', value: 'Random' }
    ],
    't3_repulser': [
        { label: 'Health', value: '150' }, { label: 'AOE dmg', value: '30' }, { label: 'AOE radius', value: '2.0 tiles' },
        { label: 'Dmg rate', value: '0.75 sec' }, { label: 'Target', value: 'All' }, { label: ' ', value: 'Pushes enemy back' }
    ],
    't3_gatling': [
        { label: 'Health', value: '150' }, { label: 'Damage', value: '10 x8' }, { label: 'Fire rate', value: '1.5 sec' },
        { label: ' ', value: 'Charged fire rate: 0.05 sec' }, { label: ' ', value: 'Targets highest health' }, { label: ' ', value: ' ' }
    ],
    't3_skymortar': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '300' }, { label: 'AOE radius', value: '1.5 tiles' },
        { label: 'Fire rate', value: '8 sec' }, { label: 'Target', value: 'Blocks' }, { label: ' ', value: ' ' }
    ],
    't3_laser3': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '40' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_puncher': [
        { label: 'Health', value: '300' }, { label: 'Damage', value: '15' }, { label: 'Fire rate', value: '0.5 sec' },
        { label: ' ', value: '+3 Damage per kill' }, { label: ' ', value: 'Boost decay after 2h' }, { label: 'Target', value: 'All' }
    ],
    't3_aoelaser': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: ' ', value: 'Damages nearby blocks' }, { label: ' ', value: ' ' }
    ],
    't3_heallaser2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '0.1 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Heal per block', value: '10' }, { label: 'Heal radius', value: '2.5 tiles' }
    ],
    't3_hypno': [
        { label: 'Health', value: '50' }, { label: 'Hypno AOE', value: '1.5 tiles' }, { label: 'Hypno Duration', value: '2h' },
        { label: 'Arming rate', value: '3h' }, { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }
    ],
    't3_magnet': [
        { label: 'Health', value: '50' }, { label: 'Magnet Radius', value: '4 tiles' }, { label: 'Loot required', value: '15 loots' },
        { label: 'Buff', value: '+50 HP' }, { label: ' ', value: 'Bypasses max health' }, { label: ' ', value: ' ' }
    ],
    't3_powerbank': [
        { label: 'Health', value: '150' }, { label: 'Stamina', value: '100' }, { label: 'Recharge', value: '2 per sec' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_densenut': [
        { label: 'Health', value: '600' }, { label: ' ', value: 'Spawn every 150 HP lost' }, { label: ' ', value: ' ' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_durian': [
        { label: 'Health', value: '600' }, { label: 'Deflect dmg', value: '20' }, { label: 'Target', value: 'Mobs' },
        { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_frostfield': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '100-30' }, { label: 'AOE radius', value: '1.5-2.5 tiles' },
        { label: 'Stun duration', value: '1h' }, { label: 'Arming rate', value: '2h' }, { label: 'Chill radius', value: '2.5 tiles' }
    ],
    't3_holonut': [
        { label: 'Health', value: '600' }, { label: 'Shield radius', value: '2.5 tiles' }, { label: 'Self heal', value: '4' },
        { label: 'Self heal rate', value: '1 sec' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_minecharge': [
        { label: 'Health', value: '50' }, { label: 'Damage: 600/1200/2400', value: ' ' }, { label: 'Radius: 1.5/2.5/3.5 tiles', value: ' ' },
        { label: 'Stamina Spent: 0/200/500', value: ' ' }, { label: 'Arming rate', value: '2h' }, { label: 'Target', value: 'Mobs' }
    ],
    't3_speeder': [
        { label: 'Health', value: '50' }, { label: 'Fire Rate', value: '+25%' }, { label: 'Boost AOE', value: '1.5 tiles' },
        { label: 'Target', value: 'Plants' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_icecharge': [
        { label: 'Health', value: '50' }, { label: 'Stun duration', value: '2h' }, { label: 'Radius: 2.5/4.0/6.5 tiles', value: ' ' },
        { label: 'Stamina Spent: 0/200/500', value: ' ' }, { label: 'Arming rate', value: '2h' }, { label: 'Target', value: 'Mobs' }
    ],
    'tx_goldengrape': [
        { label: 'EZ', value: 'GG' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't_farm_bush': [
        { label: 'Health', value: '100' }, { label: 'Harvest', value: 'Leaf*3' }, { label: 'Growth', value: '6h' },
        { label: 'Requirement', value: 'Elixir' }, { label: 'Attract range', value: '4 tiles' }, { label: ' ', value: ' ' }
    ],
    't_farm_crystal': [
        { label: 'Health', value: '100' }, { label: 'Harvest', value: 'Shard*3' }, { label: 'Growth', value: '6h' },
        { label: 'Requirement', value: 'Elixir' }, { label: 'Attract range', value: '4 tiles' }, { label: ' ', value: ' ' }
    ],
    't_farm_mob': [
        { label: 'Health', value: '100' }, { label: 'Enemy Spawn', value: 'Basic/Armor1' }, { label: 'Growth', value: '1.5h' },
        { label: 'Requirement', value: 'None' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    // legacy turrets
    't2_puncher': [
        { label: 'Health', value: '300' }, { label: 'Damage', value: '8' }, { label: 'Fire rate', value: '1/4 sec' },
        { label: 'Target', value: 'All' }, { label: 'Range', value: '2.5 tiles' }, { label: ' ', value: ' ' }
    ],
    't2_iceray': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '1/20 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Chill enemies', value: 'on contact' }, { label: ' ', value: ' ' }
    ],
    't2_spike': [
        { label: 'Layer', value: 'Ground' }, { label: 'AOE dmg', value: '10' }, { label: 'AOE radius', value: '1 tile' },
        { label: 'Dmg rate', value: '1 sec' }, { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }
    ],
    't2_icebomb': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '100-30' }, { label: 'AOE radius', value: '0.5-2.5 tiles' },
        { label: 'Stun duration', value: '1h' }, { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '2h' }
    ],
    't3_spinnut': [
        { label: 'Health', value: '400' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '1/15 sec' },
        { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }, { label: ' ', value: ' ' }
    ],
    't3_inferno': [
        { label: 'Health', value: '150' }, { label: 'Dmg incr', value: '5-15-30-60' }, { label: 'Time for incr', value: '2 sec' },
        { label: 'Fire rate', value: '1/4 sec' }, { label: 'Target', value: 'All' }, { label: 'x4 dmg to blocks', value: '' }
    ],
    't3_snowpeanut': [
        { label: 'Health', value: '400' }, { label: 'Damage', value: '5' }, { label: 'Fire rate', value: '1/6 sec' },
        { label: 'Target', value: 'Mobs' }, { label: 'Inaccuracy', value: '45 degree' }, { label: 'Chill duration', value: '0.5h' }
    ],
    't3_puncher2': [
        { label: 'Health', value: '400' }, { label: 'Damage', value: '15' }, { label: 'Fire rate', value: '1/4 sec' },
        { label: 'Target', value: 'All' }, { label: 'Range', value: '2.5 tiles' }, { label: ' ', value: ' ' }
    ],
    't3_iceray2': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '1/20 sec' },
        { label: 'Target', value: 'Blocks' }, { label: 'Stun enemies', value: 'on contact' }, { label: ' ', value: ' ' }
    ],
    't3_miningbomb': [
        { label: 'Health', value: '150' }, { label: 'AOE dmg', value: '300-100' }, { label: 'AOE radius', value: '0.5-3.5 tiles' },
        { label: 'Dmg rate', value: '2 sec' }, { label: 'Target', value: 'Blocks' }, { label: ' ', value: ' ' }
    ],
    't3_tesla': [
        { label: 'Health', value: '300' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '1/4 sec' },
        { label: 'Target', value: 'All' }, { label: 'Laser chains', value: '' }, { label: 'x4 block dmg', value: '' }
    ],
    't3_icepuncher': [
        { label: 'Health', value: '50' }, { label: 'Damage', value: '10' }, { label: 'Fire rate', value: '1/4 sec' },
        { label: 'Target', value: 'All' }, { label: 'Range', value: '2.5 tiles' }, { label: 'Chill duration', value: '0.5h' }
    ],
    't3_spike2': [
        { label: 'Layer', value: 'Ground' }, { label: 'AOE dmg', value: '10' }, { label: 'AOE radius', value: '1 tile' },
        { label: 'Dmg rate', value: '1/2 sec' }, { label: 'Target', value: 'Mobs' }, { label: ' ', value: ' ' }
    ],
    't3_minefield': [
        { label: 'Health', value: '50' }, { label: 'AOE dmg', value: '900-300' }, { label: 'AOE radius', value: '0.5-1.5 tiles' },
        { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '2h' }, { label: 'Instantly spawn 8 mines', value: '' }
    ],
    't3_triberg': [
        { label: 'Health', value: '50' }, { label: 'Stun gas radius', value: '1 tile x3' }, { label: 'Stun gas duration', value: '3h' },
        { label: 'Target', value: 'Mobs' }, { label: 'Arming rate', value: '2h' }, { label: ' ', value: ' ' }
    ]
};

export const CLASS_ICON_MAP: Record<string, string> = {
    't_pea': 'img_icon_class_shooter',
    't_laser': 'img_icon_class_miner',
    't_wall': 'img_icon_class_armor',
    't_mine': 'img_icon_class_explode',
    't_ice': 'img_icon_class_stall',
    'duplicate': 'img_icon_duplicate'
};

export function drawNewTurretTooltip(t: any, x: number, y: number, isPreview: boolean = false) {
    const type = t.type;
    const config = t.config || turretTypes[type] || t;
    const name = config.name || "Unknown Turret";
    const desc = config.tooltip || "";
    
    // Resolve custom stats or use defaults
    const stats = TURRET_DISPLAY_STATS[type] || DEFAULT_STATS;

    // Resolve ingredients for display
    const recipe = TURRET_RECIPES.find(r => r.id === type);
    const ingredientIcons: string[] = [];
    if (recipe) {
        for (let i = 0; i < recipe.duplicates; i++) ingredientIcons.push(CLASS_ICON_MAP['duplicate']);
        recipe.ingredients.forEach(ing => ingredientIcons.push(CLASS_ICON_MAP[ing]));
    } else if (config.tier && floor(config.tier) === 1) {
        // T1 items map directly
        ingredientIcons.push(CLASS_ICON_MAP[type]);
    }

    push();
    const boxW = 250;
    const boxH = 150;
    let tx = x + 5;
    let ty = y + 5;
    if (tx + boxW > width) tx = x - boxW - 5;
    if (ty + boxH > height) ty = y - boxH - 5;

    // Main Shadow
    noStroke();
    fill(0, 80);
    rect(tx + 3, ty + 3, boxW, boxH, 20);

    // Main Background
    fill(27, 31, 57);
    stroke(54, 62, 114);
    strokeWeight(3);
    rect(tx, ty, boxW, boxH, 20);

    // Portrait area (Scaled down)
    const imgSize = 64;
    const imgX = tx + 32;
    const imgY = ty + 38;
    const spriteKey = `img_${TYPE_MAP[type]}_front`;
    const sprite = state.assets[spriteKey] || state.assets[`img_${TYPE_MAP[type]}`];
    if (sprite) {
        imageMode(CENTER);
        image(sprite, imgX, imgY, imgSize, imgSize);
    }

    // Title and Description (Scaled down)
    textAlign(LEFT, TOP);
    noStroke();
    fill(255);
    textSize(14);
    text(name, tx + 60, ty + 12);

    fill(200, 200, 210);
    textSize(10);
    text(desc, tx + 60, ty + 32, boxW - 60);

    // Stats Grid Box (Tighter)
    const gridX = tx + 10;
    const gridY = ty + 70;
    const gridW = boxW - 20;
    const gridH = 48;
    fill(20, 23, 42);
    noStroke();
    rect(gridX, gridY, gridW, gridH, 10);

    // Draw 2x3 Grid (Tiny labels)
    textSize(10);
    const colOff = gridW / 2;
    const rowOff = 14;
    for (let i = 0; i < 6; i++) {
        const row = i % 3;
        const col = floor(i / 3);
        const sx = gridX + 10 + col * colOff;
        const sy = gridY + 6 + row * rowOff;
        const stat = stats[i] || { label: ' ', value: ' ' };

        textAlign(LEFT, TOP);
        fill(140, 150, 180);
        text(stat.label, sx, sy);
        
        textAlign(RIGHT, TOP);
        fill(255);
        text(stat.value, sx + colOff - 20, sy);
    }

    // Ingredient Icons (Lower and Smaller)
    const iconBaseX = tx + 74;
    const iconBaseY = ty + 132;
    const iconSpacing = 26;

    for (let i = 0; i < 5; i++) {
        const ix = iconBaseX + i * iconSpacing;
        const iy = iconBaseY;
        
        // Slot bg
        fill(20, 23, 42);
        noStroke();
        ellipse(ix, iy, 16);

        if (ingredientIcons[i]) {
            const iconSprite = state.assets[ingredientIcons[i]];
            if (iconSprite) {
                imageMode(CENTER);
                image(iconSprite, ix, iy, 20, 20);
            }
        }
    }

    pop();
}

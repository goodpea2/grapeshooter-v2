export interface NPCTrade {
  id: string;
  itemType: 'turret' | 'upgrade' | 'resource';
  itemKey: string;
  itemAmount?: number;
  itemName?: string;
  itemDescription?: string;
  itemAssetImg?: string;
  stockCount: number; // -1 for infinite
  cost: {
    sun?: number | [number, number];
    soil?: number | [number, number];
    elixir?: number | [number, number];
    raisin?: number | [number, number];
    leaf?: number | [number, number];
    shard?: number | [number, number];
    shell?: number | [number, number];
    fuel?: number | [number, number];
    ice?: number | [number, number];
  };
  outputBehavior?: 'dropAsLoot' | 'giveItem'; // New: Determines how the player receives the item
  tradeType?: 'standard' | 'randomT2' | 'randomT3'; // New: For dynamic randomization
}

export interface NPCType {
  name: string;
  description: string;
  dialogue: string[];
  shop: NPCTrade[];
  assetKey: string;
}

export const T2_TURRET_POOL = [
  't2_repeater', 't2_firepea', 't2_laser2', 't2_peanut', 't2_mortar', 
  't2_laserexplode', 't2_snowpea', 't2_iceray', 't2_puncher', 't2_tall', 
  't2_pulse', 't2_minespawner', 't2_icebomb', 't2_stun', 't2_spike'
];

export const T3_TURRET_POOL = [
  't3_triplepea', 't3_firepea2', 't3_spinnut', 't3_mortar2', 't3_snowpea2', 
  't3_inferno', 't3_flamethrower', 't3_bowling', 't3_repulser', 't3_snowpeanut', 
  't3_skymortar', 't3_laser3', 't3_puncher2', 't3_aoelaser', 't3_iceray2', 
  't3_miningbomb', 't3_tesla', 't3_icepuncher', 't3_densnut', 't3_durian', 
  't3_spike2', 't3_holonut', 't3_minefield', 't3_frostfield', 't3_triberg'
];

export const npcTypes: Record<string, NPCType> = {
  NPC_tutorial: {
    name: "Tutor Thyme",
    description: "Always starts with the player, explains basics.",
    dialogue: ["Welcome! Use WASD to move around.", 
    "Collect the sun for useful stuff", 
    "Stop moving to activate your plants", 
    "Come back to me to trade for stuff", 
    "You can reorder and merge your plants"],
    assetKey: 'npc_tutorial',
    shop: [
      { id: 'tut_1', itemType: 'turret', itemKey: 't_laser', stockCount: 2, cost: { sun: 5 }, outputBehavior: 'dropAsLoot' },
      { id: 'tut_2', itemType: 'turret', itemKey: 't_pea', stockCount: 3, cost: { sun: 5 }, outputBehavior: 'dropAsLoot' },
      { id: 'tut_3', itemType: 'resource', itemKey: 'sun', itemAmount: 5, stockCount: 4, cost: { soil: 2 }, outputBehavior: 'dropAsLoot' },
      { id: 'tut_4', itemType: 'resource', itemKey: 'sun', itemAmount: 5, stockCount: 4, cost: { elixir: 1 }, outputBehavior: 'dropAsLoot' },
      { id: 'tut_5', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: -1, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
    ]
  },
  NPC_lv1_lily: {
    name: "Lily",
    description: "Swamp dweller, provider of aquatic support.",
    dialogue: ["Got some Soil? I've got Lilypads.", "Growing seeds is faster in the drink.", "Your plants won't work on water."],
    assetKey: 'npc_lily',
    shop: [
      { id: 'lily_1', itemType: 'turret', itemKey: 't_lilypad', stockCount: -1, cost: { soil: 5 }, outputBehavior: 'giveItem' },
      { id: 'lily_2', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { sun: 20 }, outputBehavior: 'dropAsLoot' },
      { id: 'lily_3', itemType: 'turret', itemKey: 't_seed', itemName: 'Seed', itemAssetImg: 'img_seed_stray_t1', stockCount: 10, cost: { soil: 10 }, outputBehavior: 'dropAsLoot' },
      { id: 'lily_4', itemType: 'resource', itemKey: 'sun', itemAmount: 5, stockCount: 10, cost: { soil: 5 }, outputBehavior: 'dropAsLoot' },
      { id: 'lily_5', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [20,35] }, outputBehavior: 'dropAsLoot' },
      { id: 'lily_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [20,35] }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv1_jelly: {
    name: "Jelly",
    description: "Early game source for explosives.",
    dialogue: ["Things that go boom make me happy!", "Be careful with these, they're spicy.", "I love blowing stuff up!", "I'm supposed to sell upgrades here but the game is still under construction"],
    assetKey: 'npc_jelly',
    shop: [
      { id: 'jelly_7', itemType: 'turret', itemKey: 't_lilypad', stockCount: 6, cost: { elixir: 3 }, outputBehavior: 'giveItem' },
      { id: 'jelly_1', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: 3, cost: { elixir: 5 }, outputBehavior: 'giveItem' },
      { id: 'jelly_2', itemType: 'turret', itemKey: 't0_firecherry', stockCount: 3, cost: { elixir: 10 }, outputBehavior: 'giveItem' },
      { id: 'jelly_3', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: -1, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
      { id: 'jelly_4', itemType: 'turret', itemKey: 't0_firecherry', stockCount: -1, cost: { elixir: 25 }, outputBehavior: 'giveItem' },
      { id: 'jelly_5', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [20,35] }, outputBehavior: 'dropAsLoot' },
      { id: 'jelly_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [20,35] }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv2_farmer: {
    name: "Farmer",
    description: "Agricultural expert, source for seeds.",
    dialogue: ["I found these sunflower seeds near the core.", "First come first serve!", "The seeds might grow into something useful...", "Or just a weed.", "Be careful with your pots!"],
    assetKey: 'npc_farmer',
    shop: [
      { id: 'farm_1', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { sun: 25 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_2', itemType: 'resource', itemKey: 'raisin', itemAmount: 1, stockCount: 5, cost: { soil: 10 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_3', itemType: 'turret', itemKey: 't_lilypad', stockCount: -1, cost: { soil: 5 }, outputBehavior: 'giveItem' },
      { id: 'farm_4', itemType: 'turret', itemKey: 't_farm_bush', itemName: 'Fern Pot', itemAssetImg: 'img_t_farm_bush_front', stockCount: 2, cost: { soil: 10 }, outputBehavior: 'giveItem' },
      { id: 'farm_5', itemType: 'turret', itemKey: 't_farm_crystal', itemName: 'Crystal Pot', itemAssetImg: 'img_t_farm_crystal_front', stockCount: 2, cost: { soil: 10 }, outputBehavior: 'giveItem' },
      { id: 'farm_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: [15, 30] }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_7', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: [15, 30] }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_8', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: [15, 30] }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_9', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: [15, 30] }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv2_sourgrape: {
    name: "Sour Grape",
    description: "Drunk NPC, obsessed with Elixir.",
    dialogue: ["*hic* You got any of that purple stuff?", "I'll trade ya some juice for some seeds.", "Elixir is the solution to everything!", "I'm not drunk I'm just stupid!"],
    assetKey: 'npc_sourgrape',
    shop: [
      { id: 'sour_1', itemType: 'turret', itemKey: 't0_starfruit', stockCount: -1, cost: { elixir: 25 }, outputBehavior: 'giveItem' },
      { id: 'sour_2', itemType: 'turret', itemKey: 't0_jalapeno', stockCount: -1, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
      { id: 'sour_3', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: 5, cost: { elixir: 30 }, outputBehavior: 'giveItem' },
      { id: 'sour_4', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: 5, cost: { elixir: 10 }, outputBehavior: 'giveItem' },
      { id: 'sour_5', itemType: 'turret', itemKey: 't0_firecherry', stockCount: 5, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
      { id: 'sour_6', itemType: 'resource', itemKey: 'sun', itemAmount: 100, stockCount: 1, cost: { elixir: 50 }, outputBehavior: 'dropAsLoot' },
      { id: 'sour_7', itemType: 'turret', itemKey: 't_farm_mob', itemName: 'Raisin Mold', itemAssetImg: 'img_t_farm_mob_front', stockCount: 2, cost: { soil: 10 }, outputBehavior: 'giveItem' },
    ]
  },
  NPC_lv2_shroom: {
    name: "Shroom",
    description: "Night-themed entity, source for Puffshrooms.",
    dialogue: ["The dark isn't so bad once you get used to it.", "It will get way worst! haha.", "Puffshrooms are cheap, reliable... and disposable.", "Welcome to your future >:) Just kidding.", "Time will turn everyone into shrooms", "Or exilir, for that matter."],
    assetKey: 'npc_shroom',
    shop: [
      { id: 'shroom_1', itemType: 'turret', itemKey: 't_farm_bush', itemName: 'Fern Pot', itemAssetImg: 'img_t_farm_bush_front', stockCount: 2, cost: { sun: 20 }, outputBehavior: 'giveItem' },
      { id: 'shroom_2', itemType: 'turret', itemKey: 't_farm_crystal', itemName: 'Crystal Pot', itemAssetImg: 'img_t_farm_crystal_front', stockCount: 2, cost: { sun: 20 }, outputBehavior: 'giveItem' },
      { id: 'shroom_3', itemType: 'turret', itemKey: 't0_iceshroom', stockCount: 1, cost: { raisin: 1 }, outputBehavior: 'giveItem' },
      { id: 'shroom_4', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { elixir: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'shroom_5', itemType: 'turret', itemKey: 't0_puffshroom', stockCount: -1, cost: { soil: 3 }, outputBehavior: 'giveItem' },
      { id: 'shroom_6', itemType: 'resource', itemKey: 'ice', itemAmount: 4, stockCount: 5, cost: { elixir: 8 }, outputBehavior: 'dropAsLoot' },
      { id: 'shroom_7', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { elixir: [10, 25] }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv3_knight: {
    name: "Sir Knight",
    description: "Defensive expert.",
    dialogue: ["These are nuts", "Tallnuts are nuts but tall", "You are not a nut!", "I am nut.", "The coconut is not a nut"],
    assetKey: 'npc_knight',
    shop: [
      { id: 'knight_1', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: -1, cost: { elixir: 50 }, outputBehavior: 'giveItem' },
      { id: 'knight_2', tradeType: 'randomT3', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [40, 65] }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_3', tradeType: 'randomT3', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: [40, 65] }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_4', itemType: 'turret', itemKey: 't2_tall', itemName: 'Tallnut', stockCount: 3, cost: { soil: 15 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_5', itemType: 'turret', itemKey: 't3_densnut', itemName: 'Densenut', stockCount: 3, cost: { soil: 35 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_6', itemType: 'turret', itemKey: 't3_holonut', itemName: 'Holonut', stockCount: 3, cost: { soil: 35 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_7', itemType: 'turret', itemKey: 't3_durian', itemName: 'Endurian', stockCount: 3, cost: { soil: 40 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_8', itemType: 'turret', itemKey: 't3_spinnut', itemName: 'Spin Nut', stockCount: 3, cost: { soil: 50 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv3_hunter: {
    name: "Hunter",
    description: "Bulk consumables trader.",
    dialogue: ["Bnnuy."],
    assetKey: 'npc_hunter',
    shop: [
      { id: 'hunt_1', itemType: 'turret', itemKey: 't0_iceshroom', stockCount: 5, cost: { elixir: 30 }, outputBehavior: 'giveItem' },
      { id: 'hunt_2', itemType: 'turret', itemKey: 't0_cherrybomb', itemName: 'Cherry Bomb', itemAmount: 5, stockCount: 2, cost: { elixir: 50 }, outputBehavior: 'giveItem' },
      { id: 'hunt_3', itemType: 'turret', itemKey: 't0_firecherry', itemName: 'Fire Cherry', itemAmount: 5, stockCount: 2, cost: { elixir: 100 }, outputBehavior: 'giveItem' },
      { id: 'hunt_4', itemType: 'turret', itemKey: 't0_starfruit', itemName: 'Starfruit', itemAmount: 5, stockCount: -1, cost: { elixir: 100 }, outputBehavior: 'giveItem' },
      { id: 'hunt_5', itemType: 'turret', itemKey: 't0_jalapeno', itemName: 'Jalapeno', itemAmount: 5, stockCount: -1, cost: { elixir: 50 }, outputBehavior: 'giveItem' },
      { id: 'hunt_6', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: 8, cost: { raisin: 1 }, outputBehavior: 'giveItem' },
      { id: 'hunt_7', tradeType: 'randomT3', itemType: 'turret', itemKey: '', stockCount: 3, cost: { elixir: [25, 40] }, outputBehavior: 'dropAsLoot' },
      { id: 'hunt_8', tradeType: 'randomT3', itemType: 'turret', itemKey: '', stockCount: 3, cost: { elixir: [25, 40] }, outputBehavior: 'dropAsLoot' },
      { id: 'hunt_9', itemType: 'resource', itemKey: 'fuel', itemAmount: 2, stockCount: -1, cost: { ice: 3 }, outputBehavior: 'dropAsLoot' },
      { id: 'hunt_10', itemType: 'resource', itemKey: 'ice', itemAmount: 2, stockCount: -1, cost: { fuel: 3 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv3_shadie: {
    name: "Dryad",
    description: "Mastress of shady business",
    dialogue: ["I've got tons of seeds to sell", "Don't ask me how I got them", "Yes, with a price of course", "Legal practices? what's that?", "The elixir? It's not your business."],
    assetKey: 'npc_shadie',
    shop: [
      { id: 'shadie_1', itemType: 'resource', itemKey: 'shard', itemAmount: 10, stockCount: 1, cost: { elixir: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'shadie_2', itemType: 'resource', itemKey: 'shell', itemAmount: 10, stockCount: 1, cost: { elixir: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'shadie_3', itemType: 'turret', itemKey: 't_sunflower', stockCount: 3, cost: { raisin: 4 }, outputBehavior: 'dropAsLoot' },
      { id: 'shadie_4', itemType: 'turret', itemKey: 't_farm_mob', itemName: 'Raisin Mold', itemAssetImg: 'img_t_farm_mob_front', stockCount: -1, cost: { soil: 40 }, outputBehavior: 'giveItem' },
      { id: 'shadie_5', itemType: 'turret', itemKey: 't_farm_bush', itemName: 'Fern Pot', itemAssetImg: 'img_t_farm_bush_front', stockCount: -1, cost: { raisin: 1 }, outputBehavior: 'giveItem' },
      { id: 'shadie_6', itemType: 'turret', itemKey: 't_farm_crystal', itemName: 'Crystal Pot', itemAssetImg: 'img_t_farm_crystal_front', stockCount: -1, cost: { raisin: 1 }, outputBehavior: 'giveItem' },
      { id: 'shadie_7', itemType: 'resource', itemKey: 'sun', itemAmount: 100, stockCount: 1, cost: { elixir: 150 }, outputBehavior: 'dropAsLoot' },
    ]
  }
};
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
    sun?: number;
    soil?: number;
    elixir?: number;
  };
  outputBehavior?: 'dropAsLoot' | 'giveItem'; // New: Determines how the player receives the item
  tradeType?: 'standard' | 'randomT2'; // New: For dynamic randomization
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
      { id: 'lily_5', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'lily_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: 30 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv1_jelly: {
    name: "Jelly",
    description: "Early game source for explosives.",
    dialogue: ["Things that go boom make me happy!", "Be careful with these, they're spicy.", "I love blowing stuff up!", "I'm supposed to sell upgrades here but the game is still under construction"],
    assetKey: 'npc_jelly',
    shop: [
      { id: 'jelly_1', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: 3, cost: { elixir: 5 }, outputBehavior: 'giveItem' },
      { id: 'jelly_2', itemType: 'turret', itemKey: 't0_firecherry', stockCount: 3, cost: { elixir: 10 }, outputBehavior: 'giveItem' },
      { id: 'jelly_3', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: -1, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
      { id: 'jelly_4', itemType: 'turret', itemKey: 't0_firecherry', stockCount: -1, cost: { elixir: 25 }, outputBehavior: 'giveItem' },
      { id: 'jelly_5', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'jelly_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { sun: 30 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv2_farmer: {
    name: "Farmer",
    description: "Agricultural expert, source for seeds.",
    dialogue: ["I found these sunflower seeds near the core.", "First come first serve!", "The seeds might grow into something useful...", "Or just a weed.", "Farming doesn't exist in the game just yet."],
    assetKey: 'npc_farmer',
    shop: [
      { id: 'farm_1', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { sun: 25 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_2', itemType: 'resource', itemKey: 'sun', itemAmount: 5, stockCount: -1, cost: { elixir: 5 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_3', itemType: 'turret', itemKey: 't_lilypad', stockCount: -1, cost: { soil: 5 }, outputBehavior: 'giveItem' },
      { id: 'farm_4', itemType: 'turret', itemKey: 't_seed', itemName: 'Seed', itemAssetImg: 'img_seed_stray_t1', stockCount: -1, cost: { soil: 5 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_5', itemType: 'turret', itemKey: 't_seed2', itemName: 'Seed (T2)', itemAssetImg: 'img_seed_stray_t2', stockCount: 6, cost: { soil: 15 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_6', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: 25 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_7', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: 25 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_8', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: 25 }, outputBehavior: 'dropAsLoot' },
      { id: 'farm_9', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { soil: 25 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv2_sourgrape: {
    name: "Sour Grape",
    description: "Drunk NPC, obsessed with Elixir.",
    dialogue: ["*hic* You got any of that purple stuff?", "I'll trade ya some juice for some seeds.", "Elixir is the solution to everything!", "I'm not drunk I'm just stupid!"],
    assetKey: 'npc_sourgrape',
    shop: [
      { id: 'sour_1', itemType: 'turret', itemKey: 't0_starfruit', stockCount: -1, cost: { elixir: 25 }, outputBehavior: 'giveItem' },
      { id: 'sour_2', itemType: 'turret', itemKey: 't0_jalapeno', stockCount: -1, cost: { elixir: 30 }, outputBehavior: 'giveItem' },
      { id: 'sour_3', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: 5, cost: { elixir: 30 }, outputBehavior: 'giveItem' },
      { id: 'sour_4', itemType: 'turret', itemKey: 't0_cherrybomb', stockCount: 5, cost: { elixir: 10 }, outputBehavior: 'giveItem' },
      { id: 'sour_5', itemType: 'turret', itemKey: 't0_firecherry', stockCount: 5, cost: { elixir: 15 }, outputBehavior: 'giveItem' },
      { id: 'sour_6', itemType: 'resource', itemKey: 'sun', itemAmount: 100, stockCount: 1, cost: { elixir: 50 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv2_shroom: {
    name: "Shroom",
    description: "Night-themed entity, source for Puffshrooms.",
    dialogue: ["The dark isn't so bad once you get used to it.", "It will get way worst! haha.", "Puffshrooms are cheap, reliable... and disposable.", "Welcome to your future >:) Just kidding.", "Time will turn everyone into shrooms", "Or exilir, for that matter."],
    assetKey: 'npc_shroom',
    shop: [
      { id: 'shroom_1', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { soil: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'shroom_2', itemType: 'turret', itemKey: 't_sunflower', stockCount: 1, cost: { elixir: 30 }, outputBehavior: 'dropAsLoot' },
      { id: 'shroom_3', itemType: 'turret', itemKey: 't0_puffshroom', stockCount: -1, cost: { soil: 5 }, outputBehavior: 'giveItem' },
      { id: 'shroom_4', itemType: 'turret', itemKey: 't0_puffshroom', stockCount: -1, cost: { elixir: 3 }, outputBehavior: 'giveItem' },
      { id: 'shroom_5', tradeType: 'randomT2', itemType: 'turret', itemKey: '', stockCount: 3, cost: { elixir: 18 }, outputBehavior: 'dropAsLoot' },
    ]
  },
  NPC_lv3_knight: {
    name: "Sir Knight",
    description: "Defensive expert.",
    dialogue: ["These are nuts", "Tallnuts are nuts but tall", "You are not a nut!", "I am nut.", "The coconut is not a nut"],
    assetKey: 'npc_knight',
    shop: [
      { id: 'knight_1', itemType: 'turret', itemKey: 't2_tall', itemName: 'Tallnut', stockCount: -1, cost: { sun: 20 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_2', itemType: 'turret', itemKey: 't2_tall', itemName: 'Tallnut', stockCount: -1, cost: { elixir: 10 }, outputBehavior: 'dropAsLoot' },
      { id: 'knight_3', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: -1, cost: { elixir: 50 }, outputBehavior: 'giveItem' },
    ]
  },
  NPC_lv3_hunter: {
    name: "Hunter",
    description: "Bulk consumables trader.",
    dialogue: ["Bnnuy."],
    assetKey: 'npc_hunter',
    shop: [
      { id: 'hunt_1', itemType: 'turret', itemKey: 't0_iceshroom', stockCount: -1, cost: { elixir: 20 }, outputBehavior: 'giveItem' },
      { id: 'hunt_2', itemType: 'turret', itemKey: 't0_iceshroom', stockCount: -1, cost: { soil: 25 }, outputBehavior: 'giveItem' },
      { id: 'hunt_3', itemType: 'turret', itemKey: 't0_cherrybomb', itemName: 'Cherry Bomb', itemAmount: 5, stockCount: -1, cost: { elixir: 50 }, outputBehavior: 'giveItem' },
      { id: 'hunt_4', itemType: 'turret', itemKey: 't0_firecherry', itemName: 'Fire Cherry', itemAmount: 5, stockCount: -1, cost: { elixir: 100 }, outputBehavior: 'giveItem' },
      { id: 'hunt_5', itemType: 'turret', itemKey: 't0_starfruit', itemName: 'Starfruit', itemAmount: 5, stockCount: -1, cost: { elixir: 85 }, outputBehavior: 'giveItem' },
      { id: 'hunt_6', itemType: 'turret', itemKey: 't0_jalapeno', itemName: 'Jalapeno', itemAmount: 5, stockCount: -1, cost: { elixir: 120 }, outputBehavior: 'giveItem' },
      { id: 'hunt_7', itemType: 'turret', itemKey: 't0_grapeshot', stockCount: 3, cost: { elixir: 5 }, outputBehavior: 'giveItem' },
      { id: 'hunt_8', itemType: 'turret', itemKey: 't_seed2', itemName: 'Seed (T2)', itemAssetImg: 'img_seed_stray_t2', stockCount: -1, cost: { elixir: 25 }, outputBehavior: 'dropAsLoot' },
    ]
  }
};
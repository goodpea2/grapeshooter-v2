## FOR AI Agents:
Strictly follow the established art style of the game
Scan through all of the file system for extra context and follow the existing modularization architecture, avoid hard-coding as much as possible
Do not add extra texts when not requested to, keep the UI as simple as possible
The game's UI system is organized around reusable design tokens and an Immediate-Mode Hitbox Registry, use modular UI from uiComponents.ts whenever generating new UI, do not redraw UI from scratch.

# Core Explorer: Technical & Design Library

Core Explorer (v3.2) is a procedural 2D survival game built with **TypeScript** and **p5.js**. It features a unique mobile-base expansion system, a deep merging matrix, and a dynamic ecosystem.

---

## 🏃 Input & Orientation System
The game utilizes a **Decoupled Intent Pipeline** for character visuals:
- **Movement Intent**: Visual orientation (flipping/direction) is tied to raw keyboard input rather than character velocity. This prevents "sprite flickering" when the player is blocked by physical collisions (e.g., slamming into a wall).
- **State Locking**: The transition to the "Stationary" state (which enables turrets and aiming) is inhibited as long as any movement keys are held. This ensures tactical control over base deployment.

---

## 🏗️ Room Prefab System
Scripted chunk generation that bypasses the standard noise-based pipeline for tactical level design.
- **Air Ratio**: Ensures a minimum percentage of traversable space by strategically carving blocks.
- **Enemy Spawners**: Randomly picks spawner overlays with danger levels matched to the room's difficulty.
- **Loot Pots**: Randomly distributes Sun, TNT, and Crate nodes across the chunk.
- **Guaranteed Obstacles**: Allows placing specific block types (like Treasure Chests or specific resource crates) in precise quantities.
- **Immediate Budget**: Triggers a localized enemy wave upon generation to populate the "room".
- **Discovery Order Room Director**: The Room Director sequence is applied based on the order in which the player discovers new chunks. The world follows the generated string length exactly; once the scripted sequence is exhausted, chunks fall back to procedural noise generation rather than looping the director sequence.

---

## 👹 Enemy Budget & Aggression
The game employs a resilient budgeting system to maintain constant pressure.
- **Shared Pool**: Despawned enemies (those outrun by the player) refund their cost to a central pool.
- **Aggressive Re-deployment**: The world director attempts to spend the budget pool every frame, instantly spawning new portals near the player's current location if valid ground is found.
- **Scaling Difficulty**: Base budgets increase daily, ensuring the survival challenge keeps pace with base expansion.

---

## 🏗️ The Hex-Axial Grid System
Base expansion is built on a **Hex-Axial Coordinate System** (q, r).
- **Core (0,0)**: The player's main unit. It houses the auto-mining turret.
- **Attachments**: Turrets are snapped to the hex grid using axial-to-world conversion logic.
- **Adjacency Requirement**: New turrets must be placed adjacent to an existing unit.
- **Movement**: The entire base is physics-linked. When the player moves, the world-space offsets of all attachments are recalculated in real-time.

---

## 🚀 Advanced Tier 3 Systems
- **Knockback Physics**: High-tier projectiles and pulses exert force on enemies. The system uses a `kbTimer` to interrupt enemy pathfinding, making the displacement feel weighty and impactful. Smaller enemies are affected more significantly by the impulse.
- **Ballistic Launch**: The `highArcConfig` allows projectiles like Sky Mortar shells to reach their destination in a fixed number of frames. These projectiles fly "above" the map, granting them immunity to mid-air collisions with obstacles or enemies. 
- **Dynamic Ballistic Visuals**: Ballistic shells feature height-sensitive scaling and a shrinking ground shadow to accurately represent their trajectory in a 2D isometric-adjacent perspective.
- **Refined Piercing & Multi-Hit**: Piercing heavy projectiles (like the Bowling Bulb) apply knockback and hit effects to every unique target in their path. The `aoeConfig.dealAoeOnEveryHit` property allows bullets to trigger explosions on every target they pierce, rather than just the final impact, enabling devastating linear suppression. 
- **Standardized Feedback**: All combat impacts now trigger visual hit sparks (`v_hit_spark`) on both enemies and obstacles, ensuring consistent satisfying feedback during high-intensity gameplay.
- **Tesla Chaining**: The `t3_tesla` turret features a `generateElectricChain` action that dynamically links all active Teslas within a 10-tile radius. This link deals linear area damage to all entities intersecting the segment.
- **Beam Bullets**: High-tier lasers can now trigger additional effects at their point of impact via the `beamBulletTypeKey` property. This allows for mechanics like the Melting Laser's secondary explosions or the Ice Puncher's focalized chilling bursts.
- **Special Actions (T3 Exclusive)**: 
    - **First Strike**: The `t3_minefield` performs a rapid-fire sequence of 8 mine launches immediately upon placement, accompanied by a power-up visual effect.
    - **Aura**: The `t3_frostfield` emits a continuous chilling field that slows all enemies within a 2.8 tile radius, providing constant crowd control regardless of arming state.
    - **Gas Barrage**: The `t3_triberg` has been upgraded from a trap to a multi-target ranged lobber, capable of dropping 3 high-duration stun gas puddles on different enemies simultaneously.
    - **Gatling Pea (`t3_gatling`)**: Rapid burst shooter with `whileCharged` mechanics. When the player is boosted via click-hold, it overrides fire rate down to 3 frames and locks onto the player's current target if no enemies are within its standard radius.
    - **Fire Launcher (`t3_firecharge`)**: High-arc lobber targeting random enemies with lingering fire puddles (`gf_fire_puddle_firecharge`). While charged, increases range to 8 tiles, increases fire rate, and barrages random ground positions when no target is present.
    - **Mine Charger (`t3_minecharge`)**: Channeling explosive trap that consumes player stamina while holding click to grow in size and explosive radius (up to 500 growth points). At high charges, triggers screen-clearing explosions (`b_mine_explosion2` / `b_mine_explosion3`).
    - **Dynamic Charge Integration (`whileCharged` / `c_raged_visualonly`)**: Centralized `isCharged()` state hook across attached and world turrets, synchronizing burst fire rate, rage visual aura, and stacked bullet mechanics when fire rate drops below 4 frames.

---

## 📖 The Almanac & Progression
The Almanac (v4.0) serves as the central hub for discovery, purchasing, and recipe management.
- **Dynamic Progression Config (`AlmanacProgression`)**: Level layouts and campaign missions can configure their own turret availability matrices:
    - `StartingTurret`: Turrets pre-unlocked and available at the start of the level.
    - `UnlockedByDiscoverTurret`: Turrets that start hidden/locked and are only unlocked upon in-world discovery (marked with a `?` indicator in editor).
    - `LockedTurret`: Turrets unlockable via the Unlock Shop button or research progression.
    - `BannedTurrets`: Turrets completely excluded and hidden from the Almanac (marked with an `x` indicator in editor).
    - `UnlockCost`: Custom cost overrides for unlocking locked turrets.
    - `AllTurretCrafting`: Global toggle (`false` hides the buy button across all turrets).
    - `AllTurretUpgrade`: Global toggle (`false` hides the upgrade button across all turrets).
    - `CraftingCostOverride`: Granular purchase cost overrides and `canBePurchased: false` overrides per turret type.
- **Level Editor AlmanacConfig UI**: In Level Editor mode, clicking the `ALMANAC CONFIG` button opens the interactive Almanac editor. Clicking any turret slot cycles its progression state seamlessly (`Available` -> `Locked` -> `NeedDiscovery` (`?`) -> `Banned` (`x`)). Level layout serialization automatically exports the customized `almanacProgression` configuration within the exported level JSON.
- **Discovery-Based Unlocks**: Certain turrets (e.g., Sunflower, Lilypad, and various consumables) start locked and are only revealed once "discovered" by the player—either by finding them in the world, receiving them from NPCs, or attaching them to the base.
- **Integrated Shop**: Players can purchase unlocked turrets directly from the Almanac using a combination of Sun, Elixir, Soil, and rare resources. Purchased items are delivered to the player's inventory via a visual fly-VFX.
- **Multi-Resource Economy**: The game features a tiered resource system:
    - **Primary**: Sun (Mining), Elixir (Combat), Soil (Exploration), Raisins (Special).
    - **Rare Components**: Leaf, Shard, Shell, Fuel, and Ice. These are required for crafting and purchasing higher-tier turrets.
- **Dynamic UI**: The Almanac features a left-aligned navigation system, real-time resource monitors, and a specialized **Player Upgrades** display centering the animated player sprite with a 2-column scrollable grid of upgrade cards styled using the `uiComponents.ts` design tokens (deep forest green cards `[16, 44, 34]`, gold titles and pips, light-green stat progression arrows, and tactile 3D yellow upgrade buttons).
- **Level-Specific Player Upgrades**: When loading a level from the Level List, the game strictly loads the level's own `playerUpgrades` configuration (with fallback to default if not defined), cleanly isolating gameplay from any modifications made during recent Level Editor sessions.
- **Interactive Upgrade Editing & Text Navigation**: In the Level Editor's Upgrade Config, text inputs for `StatLevel:` and `UpgradeCost:` support seamless cursor navigation (arrow keys, Home/End), text selection (drag-to-highlight, Shift+Arrows, Ctrl+A), and instant reactive parsing across imported and newly created custom maps without getting stuck at stale cache states.
- **Ground Spawner (Liquid) Prefab Pipeline**:
  - `l_spawner` (Ground Spawner) operates as a liquid-layer entity that triggers enemy spawns independently of block mining status.
  - Rendered with its custom ground asset at 50% opacity and no liquid-base texture.
  - Adding or duplicating prefabs while editing a Ground Spawner now correctly stores the new prefab under the `Liquids` tab (`liquidTypes`), preserving full customization of budget, intervals, spawn trigger radius, and enemy lists.

---

## 🗺️ Custom Level Folder & Level Loader
Exported level layouts stored as JSON files in the `/level` directory are automatically discovered and populated into the Main Menu:
- **`level/` Directory**: Drop any exported `.json` level files into the `/level` folder.
- **Level Metadata Parsing**: Reads `"levelName"` and `"level Description"` (or `"levelDescription"`), along with `"levelId"`, `"tag"`, and `"enableWorldGen"` from the JSON data.
- **World Generation Control**: When `"enableWorldGen": false` is specified on a level layout, procedural noise terrain, liquids, random mineral overlays, and room director prefabs are completely bypassed during chunk creation. Chunks load exact pre-built block/turret definitions, and unpopulated chunks remain clean, empty ground.
- **Main Menu Integration**: Automatically renders custom map cards with scrolling support in the level selection list.
- **Exporting Levels**: The debug menu's `SaveLevelLayout` action serializes the active map state (chunks, blocks, turrets, ground features, NPCs) into a standardized level layout JSON formatted for the `/level` folder, preserving the level's `"enableWorldGen"` setting.

---

## 🎨 Level Editor Mode
A dedicated sandbox environment accessible directly from the Main Menu:
- **Empty Canvas & Smooth Rendering**: Clean frame clearing per tick eliminates ghosting, maintaining fluid camera movement and chunk loading.
- **50% Compact Toolbar**: Features a streamlined bottom toolbar with scaled tabs, sub-category pills, and item cards for maximum viewport visibility.
- **Painting & Deleting**:
  - **Right-Click / Drag**: Paint placeable items across the grid using painting-style dragging with live ghost previews.
  - **Left-Click / Drag**: Erase placed obstacles, overlays, liquids, ground features, turrets, or entities.
  - Browser context menu is completely disabled across the canvas.
- **Complete Catalog**: Browse and place every obstacle, overlay, liquid, ground feature, entity (enemies, NPCs, loot, player spawn core), and turret in the game through categorized tabs and sub-category filters.
- **WASD Camera**: Smooth WASD camera panning with hold-Shift speed boost for fast map navigation.
- **Custom Assets & Barrier Block**: Features the indestructible `o_barrier` block utilizing the custom `tileset-barrier-v2.png` autotiling texture set. Indestructible blocks suppress damage flash VFX and ignore incoming damage.
- **JSON Import & Almanac Config**: 
  - Easily import any level JSON file directly from the Main Menu or Level Editor using the `IMPORT JSON` button. Imported levels are automatically added to the playable level list and loaded instantly into the editor canvas for testing or editing.
  - Access the interactive **ALMANAC CONFIG** modal directly inside the Level Editor to customize turret availability matrices (Available, Locked, Discover Required [?], or Banned [x]).
  - **Player Upgrade Config Tab**: In Level Editor mode, the Upgrades tab in Almanac Config displays `"PLAYER UPGRADE CONFIG: Edit Stats and Costs (leave blank for default)"`. Each upgrade card is streamlined to a clean title, 1 line for `StatLevel:` (e.g. `[6,7,8,9,10]`), and 1 line for `UpgradeCost:` (e.g. `[5,10,15,20]`). Custom overrides are automatically bundled into the exported level JSON under `playerUpgrades` and `PlayerUpgrades`.
- **Interactive PayGate & TextSign Editors**:
  - **Dynamic PayGateGroup Clustering & Live BreakCost Bubbles**: PayGate groups display their live BreakCost with enlarged text (100% larger) and the resource icon positioned beside the amount. When creating new PayGate blocks or modifying existing clusters (painting, bucket filling, erasing, or splitting), BreakCost bubbles are generated and updated dynamically with real-time center recalculations. Clicking directly on any PayGate cost bubble opens the configuration popup modal to adjust the resource type and amount.
  - **Stationary Collision PayGate Resource Spending**: In-game PayGates strictly require the player to physically collide with the PayGate obstacle AND remain stationary (not moving) before resources are deducted, preventing accidental resource consumption when walking by. During successful resource spending in-game, the obstacle-hit VFX plays across the entire PayGate group.
  - **Inline TextSign Speech Bubble Editor**: Clicking directly on any placed TextSign speech bubble opens an inline text editor directly on the bubble with save and discard buttons, full cursor positioning, and conventional drag-to-select text editing support.
  - **Input Focus & Canvas Locking**: While editing any input fields or modal text boxes, camera panning and world canvas interactions are cleanly locked to support standard drag-selection and keyboard navigation.
- **Instant Play-Testing & Exporting**: Test custom map layouts immediately in game mode or export to JSON directly for the `/level` folder with custom `almanacProgression` and `playerUpgrades` configuration included.
- **Instant Unlock Popup Dismiss**: Players can click or tap anywhere on the screen at any point during a plant unlock reveal sequence to skip the animation and close the popup instantly.

---

## 🏰 Enemy Tower Overlays & Lock-On Aiming
The game features specialized enemy tower overlays (`isEnemy: true`) that actively target the player and placed turrets:
- **`ov_sniper_tower`**: Long-range sniper tower (`b_sniper_shot`, 360 fire rate) with a 60-frame barrel lock duration and pulsing red aiming laser.
- **`ov_mortar_tower`**: High-arc siege tower (`b_enemy_mortar_shell`, 720 fire rate) that locks onto target coordinates with a 30-frame lock window and targeted crosshair reticle.
- **`ov_minigun_tower`**: Rapid-burst gatling tower (`b_enemy_minigun`) with burst fire rates `[180, 6, 6, 6, 6, 6]`, 15° inaccuracy, and a 30-frame barrel lock before unleashing a salvo.
- **`ov_healing_tower`**: Support tower that automatically emits a healing pulse (`b_enemy_healing_pulse`) every 120 frames to repair nearby damaged enemies.
- **`ov_firewall_tower`**: Defensive tower that emits radial firewall shockwaves (`b_enemy_pulse`) in burst intervals `[30, 30, 30, 60]`, damaging player units in range.

---

## 💾 Compressed LevelData Architecture (v2)
The level format features an optimized, span-compressed layout structure designed to dramatically reduce file sizes when maps contain high densities of blocks and objects:
- **1D Run-Length Span Encoding (RLE)**: Contiguous blocks of the same type and properties along the X-axis are serialized as `pos: [[startGx, length, gy], ...]`. For example, `[15, 5, 8]` represents 5 contiguous blocks starting at `(15, 8)`.
- **Default Stat Fallback**: Block health, max health, and enemy spawner budgets automatically fall back to their canonical stats defined in `obstacleTypes` and `overlayTypes`. Only custom-modified stats or non-null overlays/liquids are serialized, minimizing redundant metadata.
- **Turret Grouping**: World turrets are grouped by type and serialized with coordinate lists `pos: [[gx, gy], ...]`.
- **Dual-Version Compatibility**: The level loader and editor seamlessly import both legacy v1 maps (with discrete `gx`/`gy` block arrays) and compressed v2 maps.
- **Level Enemy Persistence**: Pre-placed enemies defined in custom level layouts have their `neverDespawn` flag enabled, ensuring mission targets, bosses, and win-condition enemies remain active and never despawn regardless of distance from the player.

---

## 🎯 Turret Death & Action Execution Pipeline
The turret lifecycle ensures robust synchronization between health decrements, death actions, and grid/attachment cleanup:
- **Instant Death Trigger**: When health drops to or below zero (either from combat damage or environmental hazards), `onDeath()` or active `ActionDie` handlers trigger immediately rather than waiting for an update cycle that might be bypassed by early-returns.
- **World & Base Removal**: `WorldTurret.onDeath()` removes the unit from the corresponding chunk's turret list and triggers debris/loot hooks. `AttachedTurret.onDeath()` detaches the unit from the player's attachment array and spatial partition.
- **Safe Guarding**: The `isDying` state flag prevents cascading duplicate death triggers during multi-hit strikes or simultaneous AOE impacts.

---

## 🧭 Turret Pathing & Breadcrumb System
The mobile base utilizes a trail-following breadcrumb mechanic for trailing turrets:
- **`state.playerTrail` Buffer**: Tracks a continuous series of world-space coordinates recording recent player movement.
- **Fresh Breadcrumb Targeting On Move**: When the player transitions from stationary to moving, turrets immediately target the newly-created breadcrumbs from the current movement run rather than backtracking through stale, pre-stop trail history.
- **Dynamic Trail Targeting & Anti-Stall**: Attached turrets actively follow breadcrumbs both while moving and when stationary until they reach the end of the trail or transition into formation slots, preventing units from becoming stranded mid-route.
- **Stationary Pruning & 4s Decay Timer**: When the player halts, the breadcrumb trail is immediately pruned down to the latest 20 points. A 4-second (240 frames) countdown initiates, after which remaining points are cleared and any lingering trailing turrets settle cleanly into base formation.
- **Motion Inactivity Guard**: Attached turrets remain inactive (cannot fire or perform stationary combat actions) while actively moving (navigating along breadcrumbs or moving into formation), even if the player vehicle has stopped.
- **`DrawTurretPath` Debug Visualizer**: Toggleable in Debug Mode under the **TURRETS** panel. It renders:
  - The connected breadcrumb spline with chronological color gradients (violet to yellow) and indexed point markers.
  - Directional lines from each attached turret to its currently targeted breadcrumb node.
  - Perpendicular offset target markers showing natural swarm separation.
  - Live HUD indicators displaying trail target indices, reaction timer delays, stationary fade countdowns, and velocity vectors.

---

## ⚡ Player Upgrades System
Players can now upgrade their core stats during gameplay via the Almanac's **Upgrades** tab:
- **`turretAttachCapacity`**: Limits the number of turrets attachable to the player's core base 
  - Displayed in the HUD currency bar as `(currentAttachedCount) / (TurretAttachCapacity)` with the sunflower icon.
  - **`CountTowardAttachedCapacity` Flag**: Individual turrets like `t_lilypad` set `CountTowardAttachedCapacity: false` so ground-layer or utility platforms do not count towards the attachment capacity limit.
  - When capacity is reached, attached slot previews around the player are hidden during purchase AND when dragging/picking up a `WorldTurret`, and the attaching action is completely disabled.
  - If a player collects stray/dropped turret loot while at capacity, the turret automatically spawns as a `WorldTurret` on the nearest clear grid cell instead of attaching, and collisions with world turrets are ignored.
- **`sunBankCapacity`**: Maximum Sun loot currency storage 
  - Displayed in the HUD currency bar as `(currentSunCount) / (SunBankCapacity)`.
  - When maximum capacity is reached, dropped Sun loot is ignored (cannot be attracted by magnet or collected by player).
- **`magnetRadius`**: Magnet attraction pickup radius for loot and dropped resources 
  - Directly drives the attraction radius of all valid dropped items towards the player.
- **`damageMultAdd`**: Additive damage multiplier applied ONLY to the player's own direct mining and attacking combat projectiles (`b_player` and `b_player_mining`), preserving independent turret balance
- **LevelData Overrides**: Upgrade tiers, stats, costs, and cost currencies can be overridden on a per-level basis via `LevelData.playerUpgrades` or `levelConfig.playerUpgrades`.

---

## 🛡️ Turret HP Persistence on Pickup & Relocation
Turrets retain their exact remaining health throughout pickup, flight, inventory storage, and re-placement:
- **Collision & Click Pickups**: When a `WorldTurret` is collected via collision with the player/attachments or manual interaction, its current `health` is passed directly into `TurretLoot` and `LootInFlightVFX`.
- **Inventory & SpecList Tracking**: When stored in the player inventory or attached directly, the unit's exact health is preserved in `state.inventory.specList`.
- **Relocation & Re-placement**: Placing a turret from the inventory or dragging it between the world grid and player attachments preserves its remaining HP, preventing accidental free repairs during repositioning.

---

## 📈 Level Budget & Hourly Spawning Customization
Level designers can control ambient and night wave difficulty scaling directly in level JSON files:
- **`customBudgetPerNight`**: Overrides the baseline nightly wave budget per day 
- **`hourlyBudgetPerDay`**: Configures the hourly budget allocation during daytime per day 
- **`hourlyBudgetPerNight`**: Configures the hourly ambient budget replenishment during nighttime per day
- **`enabledCurrency`**: Defines the visible and active currencies for the level (e.g. `["sun", "elixir"]`), allowing smooth, progressive introduction of resources to players.

---

## 🎮 Main Menu UI & Interactive Mini-Game
The Main Menu features a sleek layout pairing level navigation with a responsive right-side mini-game:
- **Left-Aligned Level Selection**:
  - **Level Cards**: Reuses the clean, rounded card design from `uiNpcShop.ts` with custom tags (`TAG`, `Adventure`, `DEV TEST`, `CUSTOM MAP`) and descriptions.
  - **Hover Feedback**: Level cards light up on hover, dynamically presenting the tactile 3D golden **PLAY** button.
  - **Level Clearance State**: Completed levels cleanly display a vibrant `"Cleared"` badge with drop shadow when unhovered, backed by local storage persistence (`state.clearedLevels`).
  - **Tactile 3D Action Buttons**: Reuses the tactile button styles from `turretInfoPanelUI` for **PLAY**, **LEVEL EDITOR**, and **IMPORT LEVEL** with active press feedback.
- **Interactive Enemy Mini-Game**:
  - **Weighted Enemy Spawning**: Enemies spawn according to balanced spawn weights (`e_basic: 200`, `e_armor1: 50`, `e_armor2: 20`, `e_armor3: 10`, `e_giant: 3`, `e_bomb_mainmenu: 100`) and wander smoothly at their configured speed, drifting across and off-screen naturally.
  - **Shared In-Game VFX Pipeline**: Directly reuses the core game's VFX system classes (`Explosion`, `FireworkVFX`, `BugSplatVFX`, `GiantDeathVFX`, `DamageNumberVFX`) and `drawPersistentDeathVisual`, eliminating duplicated code and matching the in-game audio/visual styling.
  - **Config-Driven Bullet Explosions & Chain Reactions**: Clicking triggers the configured `b_mainmenu` explosion, while defeating bomb enemies (`e_bomb_mainmenu`) triggers their on-death bullet (`b_bomb_mainmenu`) with full AoE gradients, damage numbers, and fireworks.
  - **Directional Flee Update**: When a click occurs, all enemies update their heading to move away from the click position with 30-degree variation, strictly maintaining their normal movement speed without speeding up.
  - **Shadowless Sprites**: Clean shadow-free enemy rendering with sprite asset mapping for all spawned enemy types.

---

## 🎨 Level Editor Enhancements
- **Separated Left Toolbar**: Tool selection (Brush and Fill Bucket) is housed in a dedicated left-aligned floating toolbar, freeing up the top header for map management actions and instructions.
- **Clean Input Isolation**: The Almanac and Almanac Config modals strictly intercept all pointer interactions, preventing accidental background world canvas painting while menus are open.
- **Fill Bucket Tool**: Quickly place, replace, or flood-erase contiguous regions of obstacles and liquids (including lava, water, acid, and spawn areas) on the map with the Fill Bucket tool.
- **Independent Tile Layers**: Mining obstacles or placing new block types cleanly preserves underlying liquid layers, allowing seamless stacking of terrain, overlays, and liquid properties.
- **Custom Spawner & Prefab System**:
  - Placeable and configurable enemy spawner overlay with a dedicated interactive settings tooltip in the Level Editor.
  - **Toolbar Spawner Tooltip**: Selecting any spawner or spawner prefab from the bottom toolbar opens the editable Spawner tooltip. Modifying values (name, health, budget, interval, trigger radius, spawn radius, enemy archetype chips) automatically persists to the selected spawner prefab.
  - **In-World Hover Inspection Tooltip**: Hovering over placed spawners on the world canvas displays a sleek, non-intrusive read-only configuration summary without interfering with active tools.
  - **World Canvas Name Labels**: All placed enemy spawners display high-contrast name badges directly on the world canvas while in EditorMode for quick level layout scanning.
  - **Prefab Management (`+ Add Prefab` / `- Remove Prefab`)**: Save customized spawner configurations as new palette prefabs directly in the Overlays tab to quickly place multiple instances across the map, with full persistence in exported JSON levels under `customSpawnerPrefabs`.
  - **Safe UI Interactions**: Closing tooltips and clicking top bar actions (e.g., `IMPORT JSON`) are strictly isolated to prevent accidental editing or painting actions.
  - In-editor visual gizmos rendering live trigger range circles on world canvas.
- **Mark Spawn Area Tool (`MarkSpawnArea`)**:
  - Dedicated tool on the left toolbar (`🟣 SPAWN`) to define enemy spawning zones on the map without altering block liquids or terrain.
  - Circle/lasso selection: Left-click and drag around any area to circle and mark all enclosed grid tiles as `spawnArea`; right-click and drag to unmark.
  - Direct brush paint/erase on drag also supported.
  - Visual feedback: Designated spawn areas are highlighted with a fade-purple tint **strictly** while the `MarkSpawnArea` tool is selected.
  - **v2 Span Format Serialization (`[startGx, spanLen, gy]`)**: Compact run-length grouping of contiguous spawn area tiles per row for efficient and clean JSON file size.
  - **Full Persistence Across Playtesting & Cache Restoration**: Seamlessly preserves all designated spawn area tiles when switching between `EditLevel` and `TestLevel` or returning after a game over.
  - **Universal Import Support**: The `IMPORT JSON` function automatically detects and deserializes both v2 span format groups (`[startGx, spanLen, gy]`) and legacy formats (individual coordinate pairs `[gx, gy]`, strings `"gx,gy"`, and coordinate objects) directly onto the editor canvas.
- **Free Entity Placement**: Entities and flags support free, non-snapped sub-grid placement with precise target reticles.
- **Selective Right-Click Deletion**: Right-click drag initiated on an overlay selectively removes overlays without erasing underlying ground blocks.
- **Click-Drag Almanac Config**: Click-drag across turret icons in the Almanac Config modal to quickly toggle progression states across multiple turrets simultaneously.
- **Debug Player Gizmo**: Toggle `Player Gizmo` under `CORE ACTIONS` in the debug menu to visualize the player's active magnet collection radius in real-time.
- **LevelConfig Tab in Almanac Config**:
  - A dedicated `LEVEL CONFIG` tab in the Almanac editor allows editing map metadata and game parameters directly in the UI:
    - `Level ID`, `Level Name`, `Description`, `Map Tag` (e.g. `CUSTOM MAP`).
    - `Custom Budget Per Night` (default: `[100, 200, 400, 800, 1500]`), `Hourly Budget Per Day` (default: `[3, 10, 20, 30, 40]`), `Hourly Budget Per Night` (default: `[20, 40, 80, 100, 120]`).
    - `Turret Unlock Costs (`UnlockCost`)`: Configurable sequence of costs for unlocking locked turrets (e.g., `raisin: 1, raisin: 2, soil: 50`). When empty (`[]`), the Unlock Shop button is automatically hidden during gameplay. Includes `CLEAR` and `CAMPAIGN DEFAULTS` buttons.
    - `Enabled Currency`: Interactive chips to toggle available currencies (`sun`, `elixir`, `soil`, `raisin`, `leaf`, `shard`, `shell`, `fuel`, `ice`).
    - `Starting Resources`: Configurable starting quantities for each currency when starting the level.
    - `Global Enemy Spawn Config Table`: A dynamic matrix displaying enemy spawn weights across all day and night periods (`1_day`, `1_night` through `9_night`) for all dynamically detected enemy archetypes using internal identifiers (`e_basic`, `e_armor1`, etc.).
    - `Drag-to-Cycle & Fast Reset Actions`: Single clicks or click-dragging seamlessly cycles weight values (`0` ➔ `0.25` ➔ `0.5` ➔ `1` ➔ `0`) across cells. Includes one-click `SET ALL TO 0` and `RESET DEFAULTS` buttons.
    - `Streamlined Hover-Only Border Styling`: Removed distracting static borders across all inputs, badges, resource controllers, and matrix cells; sleek highlight strokes appear exclusively on mouse hover or active focus.
    - `Non-WorldGen Chunk Weight Scaling`: Automatically sets `CHUNK_LEVEL_WEIGHTS` for all enemies to 1 when `enableWorldGen=false`, ensuring custom level designer spawn weights strictly govern spawn probabilities.
  - Custom overrides are automatically saved and exported into the level JSON format and restored on import and playtest.
- **Compact Enemy Serialization Format**:
  - Enemies in `levelData` are serialized using a compact grouped structure `{ type: 'enemyTypeName', pos: [[x1, y1], [x2, y2], ...], isWinCondition?: true }`, drastically shortening exported JSON file size.
  - Import functions seamlessly parse both the new compact grouped format and legacy individual enemy object definitions for complete backward compatibility.
- **Default Progression & Dynamic Unlock Button**:
  - In Level Editor mode, the Almanac default state starts with all turrets set to `Banned` except for `t_pea`, `t_laser`, and `t_wall` (`StartingTurret`).
  - The in-game `UnlockTurretButton` dynamically hides whenever `UnlockCost` is empty or when the player has unlocked all available locked turrets, smoothly expanding the turret info panel into the vacated space.
- **Modular Level Editor Architecture**:
  - The Level Editor codebase is partitioned into cohesive modules under `/levelEditor/` (`types.ts`, `palette.ts`, `camera.ts`, `tools.ts`, `spawnerTooltip.ts`, `canvas.ts`, `actions.ts`, and `index.ts`), ensuring clean separation of concerns and high maintainability.
- **Pure v2 JSON Format & Deprecated v1**:
  - Level serialization and deserialization strictly operate on the modern span-compressed v2 format, deprecating legacy v1 parsing for optimal performance and cleaner codebase architecture.
- **Level Editor Camera Zoom & Strict Interaction Isolation**:
  - Added smooth mouse wheel camera zooming (`0.3x` to `3.0x`) in the Level Editor centered on world view.
  - **Strict Interaction Isolation**: Drag and paint operations on the world canvas strictly require pointer activation directly over open canvas space (`state.levelEditor.isWorldDragActive`).
  - Closing tooltips (e.g. `SpawnerTooltip`), clicking UI buttons (`IMPORT JSON`, `EXPORT`, tabs, pills), or dismissing modal overlays cleanly resets drag flags and prevents click bleeding or stuck drag-edit states.
  - Closing the Almanac modal in gameplay or editor mode suppresses mouse drag interactions until the pointer is released, preventing unintentional character movement or world interactions.
  - Window blur events automatically reset mouse press and drag vectors.
- **Player Upgrades Max Level & Single StatLevel Logic**:
  - In gameplay mode, player upgrades defined with a single `StatLevel` (or having reached max rank) are cleanly labeled as `(MAX)` and the `Upgrade` purchase button is removed.

---

## ⚡ Performance & Visual Engine Optimizations
- **Surgical Chunk Dirtying**:
  - Replaced indiscriminate 3×3 neighbor chunk invalidation on block mining with perimeter-aware surgical dirtying (`state.world.dirtyBlock(gx, gy)`).
  - Blocks located in chunk interiors (accounting for over 76% of map tiles) now only dirty their single parent chunk and only rebuild overlays locally, avoiding unnecessary autotile re-rendering across neighboring chunks.
- **Dynamic Offscreen Buffer Pixel Density**:
  - Normalized chunk offscreen canvas buffers from static `pixelDensity(4)` to dynamically scale with screen capabilities (`Math.min(window.devicePixelRatio, 2)`).
  - Eliminates excessive VRAM consumption, memory bandwidth spikes, and garbage collection hitches during active mining and combat.
- **Transform-Isolated Laser Beam Rendering**:
  - Laser beams are rendered in clean, unrotated and unscaled world coordinates rather than inheriting the turret's squash/stretch and idle rotation animation matrix.
  - Fixes laser angle warping, jitter, and camera translation drift during movement and firing animations, while allowing fixed world turrets to fire laser beams smoothly even while the camera and player move.
- **Subpixel Autotile Seam Elimination**:
  - Added fractional subpixel padding (+0.6px) to autotile rendering and chunk buffer canvas drawing to prevent floating-point texture sampling gaps and hairline tile seams.
- **Clearance-Aware Dijkstra Flow Field Pathfinding**:
  - Implemented high-performance local Dijkstra flow field pathfinding (`FlowFieldManager` in `pathfinding.ts`) centered on the player / primary focus target ($73 \times 73$ tiles window).
  - Computes clearance maps (distinguishing 1×1 standard enemy paths from 2×2 giant enemy passages) and derives smooth gradient vectors for hundreds of concurrent swarm units with negligible CPU overhead ($<0.2\text{ ms}$).
  - Features **Perimeter Siege Fallback**: When the player is completely walled off or an enemy is in a disconnected cavern, enemies calculate gradient descent towards the closest exterior wall facing the player rather than freezing or vibrating.
  - **Dynamic Debug Gizmos**: When `EnemyGizmos` (`state.debugGizmosEnemies`) is toggled on in Debug Mode, renders visible flow field vector arrows and color-coded trajectory lines (`LOS` in neon green, `FLOW` in cyan, `SIEGE` in orange, and `DIRECT` in red).

---

## 🚧 PayGate Obstacles & Interactive Text Signs
- **`o_paygate` (Pay Gate Obstacle)**:
  - Custom obstacle utilizing the `tileset-paygate.png` autotiling texture set.
  - Unlike standard destructible obstacles, Pay Gates cannot be mined by normal weapons and require resources to unlock.
  - **`PayGateGroup` Clustering**: Contiguous or interconnected Pay Gate blocks automatically form a cohesive `PayGateGroup` sharing a single unlock cost and state.
  - **Proximity Cost Display**: Approaching a Pay Gate group renders the cost bubble (styled consistently with the turret-merging bubble overlay) indicating the required resource type, remaining cost, and affordability.
  - **Physical Spending on Collision**: When the player walks into a Pay Gate block, the required resource is spent one-by-one with visual `PayGateFlyVFX` particles flying into the center of the gate. Once all required resources are spent, the entire `PayGateGroup` breaks automatically.
  - **Level Editor PayGate Config Tooltip**: Level designers can customize the required currency and amount per Pay Gate cluster with quick `-10`, `-1`, `+1`, `+10` adjustment buttons and numeric entry (fallback: 10 Soil).
- **`ov_textsign` (Text Sign Overlay)**:
  - Speech bubble hint/tutorial sign overlay placed on top of obstacle blocks.
  - Displays a clean speech bubble with tailored text hints for players during exploration and tutorials.
  - **Level Editor TextSign Tooltip**: Allows designers to type and edit custom messages up to 100 characters directly from the Level Editor canvas.
- **Strict Line-of-Sight (DDA Raycasting)**:
  - Refactored `checkLOS` in `world.ts` using a fast Digital Differential Analyzer (DDA) raycaster.
  - Prevents player shots, laser beams, and enemy projectile line-of-sight from penetrating through diagonal block gaps (`(0,1)` / `(1,0)` corner junctions).
- **PayGateGroup Cost Serialization & Deserialization**:
  - `serializeChunkBlocks` and `deserializeChunkBlocks` in `levelManager.ts` fully persist cluster-level `paygateConfig` (resource type, required amount, and spent state) for each PayGate block.
  - `rebuildPayGateGroups()` is automatically triggered upon level start, level import, and cache restoration, ensuring that connected PayGate obstacles are unified into clusters with accurate break costs and interactive world cost bubbles.

---

## 🎨 Modular UI Component System & Tokens
- **Centralized Color Palette (`uiColors.ts`)**:
  - Stores all standard game colors as token functions with RGBA alpha support (`color.purple(alpha)`, `color.yellow()`, `color.panelBlue()`, `color.gray()`, `color.lightGray()`, `color.darkGray()`, `color.veryLightYellow()`, `color.black()`, etc.).
  - Adheres strictly to the established **Almanac UI** art style: clean, un-stroked cards, high-contrast typography, and tactile 3D buttons.
- **Reusable UI Primitives (`uiComponents.ts`)**:
  - **Buttons (`drawButton`, `drawYellowButton`, `drawRedButton`, `drawGreenButton`, `drawCyanButton`, `drawPurpleButton`, `drawDarkButton`, `drawGrayButton`)**:
    - **Normal State**: Clean 3D tactile button with bevel edge and deep shadow offset.
    - **Hovered State**: Smoothly reverses the top and bottom gradient face colors (no outline border).
    - **Pressed State**: Renders a crisp white perimeter border outline with a 1px physical press displacement.
    - **Buttons with Icons**: Supports embedded item/resource icons scaled 50% larger (34px standard size) with crisp alignment alongside label text.
    - **Gray Button Variant**: Neutral slate/gray button variant for utility and secondary actions.
  - **Close Button Component (`CloseButton` / `drawCloseButton`)**: Standardized circular tactile close button with red gradient face, dark red beveled base, deep drop shadow, centered white 'X' icon, and a crisp white outline ring on press. Replaces custom modal close buttons across all popups and tooltips.
  - **Cards & Modals (`drawModalFrame`, `drawCard`)**: Standardized Almanac-style modal frames, header bars, close buttons, and selectable inset cards with custom border and background options.
  - **Inputs & Steppers (`drawNumberStepper`, `drawInputField`)**: Standardized numeric steppers (`-` [value] `+`) and interactive text input controls with cursor and selection rendering.
  - **Speech Bubbles (`drawSpeechBubble`)**: Dynamic directional speech bubbles with customizable tail direction and resource/action icon badges.
- **Refactored Editor Popups & Tooltips**:
  - `PayGateModalUI`, `TextSignEditorUI`, and `SpawnerTooltip` (both Spawner Info and Spawner Prefab Config) have been migrated completely to use `uiComponents` primitives (`drawModalFrame`, `drawCard`, `drawButton`, `CloseButton`) and the unified hitbox registry.
- **UI Components Showcase (`uiComponentsShowcase.ts`)**:
  - Interactive test gallery accessible via the Debug Menu (`Show All UI Components`) to visually test and verify all component variants, hover states, pressed states, icons, steppers, and speech bubbles.
- **Immediate-Mode Hitbox Registry & Two-Phase Click System**:
  - Uses `beginUIFrame()`, `registerUIHitbox()`, `handleUIMousePress()`, and `handleUIMouseRelease()` for robust click dispatching.
  - **Two-Phase Click Requirement (Double-Trigger Prevention)**: Buttons and interactive controls require both mouse-down (press) and mouse-up (release) within the same element hitbox to trigger a click event. This eliminates double-trigger bugs (where an action executed on both MouseDown and MouseUp) and prevents accidental triggers when moving, dragging the camera, or releasing outside a button.
  - **Level Editor World Input Pipeline**:
    - Dispatches `handleLevelEditorPress()` directly on mouse-down prior to generic gameplay checks, enabling immediate activation of block placement, bucket fill, spawn area lassoing, and entity manipulation.
    - Seamlessly differentiates left-click (place/mark/fill) from right-click (erase/delete/unmark) across all tools and categories (Obstacles, Liquids, Overlays, Entities, Turrets, Flags).
    - Mouse-drag operations in the Level Editor are strictly isolated from player touch/gameplay vector calculations, ensuring smooth and uninterrupted painting and canvas editing.
  - **Typography Normalization**: All UI text rendering explicitly enforces `textStyle(NORMAL)` and `noStroke()` to eliminate unintended font outlines and blurriness across all canvas resolutions.
- **Directory Structure (`/ui/`)**:
  - All dedicated UI modules (`uiMainMenu.ts`, `uiGameOver.ts`, `uiGameSpeed.ts`, `uiNpcShop.ts`, `uiDebug.ts`, `uiComponentsShowcase.ts`, `almanac/`, `overlay/`) reside cleanly within the `/ui/` directory, while root `uiColors.ts` and `uiComponents.ts` serve as the universal foundation across the entire game and editor.

---

## 🌿 Interactive Overlays & World Mechanics
- **`catalyst_clay` (Clay Catalyst Overlay)**:
  - An indestructible, non-targetable overlay (`isValidTarget: false`) placed on terrain blocks that generates adjacent `o_clay` blocks over time.
  - **CatalystConfig Structure**: Configured via `catalystConfig: { neighborMatrix: [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]], spawnInterval: HOUR_FRAMES * 0.5, obstacleToSpawn: 'o_clay' }` in `overlayTypes`.
  - **Instant Placement Spawning**: Placing a Clay Catalyst in the Level Editor immediately populates all empty adjacent neighbor tiles in its matrix with the target obstacle.
  - **Dynamic Spawn & Halt**: In active gameplay, every interval it randomly chooses one empty neighboring tile (`!block || block.isMined`) to turn into Clay with dust debris VFX. If all 8 adjacent tiles are occupied, its spawn cycle halts until an adjacent block is mined.
  - **Debug & Editor Gizmos**: When `debugHP` or Level Editor mode is active, renders visual bounding box gizmos around all 8 matrix neighbor positions (green outline for empty/valid spawn spots, red outline for occupied spots).
- **`gf_spawner` (Ground Spawner Budget & Death Visual)**:
  - Ground-layer enemy spawner feature that spends its localized spawner budget when producing enemies.
  - When its budget is fully depleted (`spawnerBudget <= 0`), the spawner automatically expires (`life = 0`) and triggers the purple `BugSplatVFX` death explosion at its location.
- **`sunGenerator` (Sun Generator Overlay)**:
  - Specialized resource node overlay requiring damage to harvest Sun currency.
  - Spawns physical `sun` loot entities upon reaching cumulative damage milestones, pairing with the in-game hover speech bubble (`[Icon] X left`) and lowest target priority for auto-aiming turrets.
  - **Level Editor Customization**: Interactive customization tooltip (`Sun Generator Config`) accessible directly by clicking the Sun Generator card in the Overlays palette or selecting a placed Sun Generator on the world canvas, allowing on-the-fly adjustment of `damagePerSun` and `maxSun`.

---

## ⚡ Player Stamina, ClickHolding Boost & Upgrades
- **Stamina System**:
  - **Base Stamina & HUD Display**: Base 100 stamina displayed as a dedicated `StaminaBar` directly adjacent to the `HealthBar`, with an icon badge and dynamic length scaling based on `maxStamina`.
  - **ClickHolding Boost Consumption**: While holding left click / spacebar for mining boost, stamina depletes by 2 per bullet fired.
  - **Stamina Color States**: The stamina bar smoothly transitions to white while depleting, and cyan while recovering and by default.
  - **Target Prioritization**: Auto-mining under ClickHolding boost preserves normal target prioritization rather than overriding firing logic.
  - **Auto-Recovery**: Recovers at 2 stamina per 6 frames strictly when the player is stationary and at least 1 second (60 frames) has passed since stamina was last spent.
- **Expanded Player Upgrades in Almanac**:
  - `maxStamina`: Increases maximum player stamina and extends stamina bar width.
  - `clickHoldBoost`: Enhances mining shot boost effectiveness.
  - `movementSpeed`: Enhances baseline player travel velocity.
  - **Almanac Upgrades UI**: Features a 2-column responsive layout with smooth mouse-wheel velocity scrolling and canvas boundary clipping.
- **PayGate Collision & Trigger Margin**:
  - Player contact range for spending resources at PayGate groups increased by +1px to ensure reliable resource transfer even during subtle physical repulsion.
- **Level Editor & Playtest UI**:
  - Unified playtest controls by removing the duplicated top-middle red button, keeping the clean Cyan "BACK TO EDIT" header button in the top right.

---

## 🌟 Star Rating, Win Conditions & Liquid Spawner Systems
- **Player Movement Speed Tuning**:
  - Rebalanced core player base velocity by -15% (from 3.6 to 3.06) for enhanced tactical positioning and maneuverability control.
- **`l_spawner` Liquid Spawner**:
  - Consolidated ground spawners into the **Liquids** layer (`l_spawner`) in `balanceLiquids.ts`.
  - Renders the custom animated idle spawner asset with smooth liquid blending, spawning enemy waves from its budget and expiring into splash VFX when depleted.
- **Block & Enemy Win Condition Objectives**:
  - **Level Editor Win Condition Flag Tool**: Designers can flag specific destructible obstacles and blocks as mandatory mission objectives using the Flag tool (`🚩 WIN`).
  - **In-World Visual Indicator**: Flagged win-condition blocks display an animated golden target beacon with pulsing rings and marker flags on the world canvas.
  - **Dynamic In-Game Tracker & Victory Check**: Displays a unified in-game HUD tracker (`Defeat Grapes (X) & Break blocks (Y left)`) and triggers victory automatically when all designated enemies and blocks are cleared.
  - **Full Level Serialization**: Preserves `isWinCondition` flags across block span encoding (`[startGx, length, gy, ..., isWinCondition]`) and imports.
- **Sun Generator Toolbar Tooltip Synchronization**:
  - Selecting a placed Sun Generator or toolbar preset opens the configuration tooltip and immediately syncs `damagePerSun` and `maxSun` to the target coordinate and chunk buffers.
- **Level Star Rating System (1–3 Stars)**:
  - **Configurable Time Targets**: Level designers can define completion time thresholds (`star2` and `star3` targets in seconds) in the `LEVEL CONFIG` panel in Almanac.
  - **Dynamic Victory Calculation**: Winning a level awards 1 star (completion), 2 stars (under `star2` target time), or 3 stars (under `star3` target time).
  - **Persistent High Scores**: Star ratings are saved in local storage (`grapeshooter_level_stars`) and displayed as golden star shapes across level cards in the Main Menu and the Victory popup.
- **Dual HUD Quick-Access Buttons**:
  - Added a dedicated **Player Upgrade** HUD button (`img_icon_playerupgrade`) alongside the Almanac button in the bottom-right corner.
  - Clicking the Player Upgrade button navigates directly to the player's core stat upgrades panel with glowing hover and active tab feedback.

---

## 🍇 Commander Upgrade Hub, Detach All & Pathfinding Engine
- **Almanac Player Upgrade Redesign**:
  - **Centered Commander Showcase**: Centers the animated player sprite on a floating radiant pedestal with an idle breathing effect and live Core Stats breakdown card (attached capacity, movement speed, sun currency, elixir).
  - **Surrounding Compact Upgrade Matrix**: Surrounds the central commander with compact upgrade cards utilizing design tokens and `uiComponents.ts` primitives (`drawCard`, `drawButton`, segmented progression pips, and level tags).
- **Detach All Turrets Action**:
  - Displays a dedicated `DetachAllTurrets` button in the center-bottom HUD bar whenever the player is stationary and has attached turrets.
  - Clicking the button smoothly detaches all attached units, finds adjacent accessible world tiles using BFS spiral placement, converts them into `WorldTurret` instances, and triggers `onDetach` upgrade hooks with VFX.
- **Smart Pathfinding & Obstacle Avoidance**:
  - **Cardinal-Only Vectors Near Obstacles**: Dijkstra vector field generation restricts gradient descent to purely orthogonal (cardinal) directions whenever adjacent to obstacles, eliminating awkward corner clipping.
  - **Tile Center Steering Bias**: Enemy movement incorporates a perpendicular centering pull towards tile midpoints prior to steering into turns.
  - **Reachable Tile Placement & Turret Interaction**: World turret selection, placement preview snapping, and drag-and-drop merging enforce `flowField.isTileAccessible` checks relative to the player's location.
- **Sun Generator Harvest Rescan**:
  - Harvesting Sun currency from a Sun Generator automatically dispatches an obstacle update event, clearing targeting locks and refreshing target scans for both the player core and surrounding turrets.

---

## ⏳ Hourly Spawning Mechanics, Spawner Gizmos & Pre-Spawned Loot
- **`hourlySpawnConfig` Spawning Pipeline**:
  - `l_spawner` and custom spawners can configure `hourlySpawnConfig: { enabled: true, hourlyBudgetMultiplier, hourlyBudgetAdd, selfDestructAfterBudgetSpawned }`.
  - When enabled, the spawner derives its dynamic wave budget from the level's current hourly budget (`levelCurrentHourlyBudget * hourlyBudgetMultiplier + hourlyBudgetAdd`), bypassing fixed `budget` and `spawnIntervalConsumeBudget` limits while respecting minimum `spawnInterval`.
  - Spawners automatically self-destruct into explosion debris and splash VFX once their cumulative spawned budget exceeds `selfDestructAfterBudgetSpawned`.
- **DebugMode Spawner Gizmos**:
  - Hovering over `ov_spawner` and `l_spawner` in Debug Mode (`state.showDebug`) renders their exact trigger radius and spawn radius world circles.
  - Displays a detailed debug tooltip overlay showing current budget, hourly config, remaining lifetime, and configured enemy types.
- **LevelEditor Pre-Spawned Loot Support**:
  - Designers can pre-place any resource loot drop (Sun, Elixir, Soil, Raisin, Shard, Leaf, Shell, Fuel, Ice) directly onto the world canvas via the Level Editor `Entities > Loot` palette.
  - Pre-spawned loots are saved with `neverDespawn: true` and serialized under `levelData.loots`, restoring seamlessly during test plays, level loads, and JSON imports.
- **Player Upgrades UI Alignment**:
  - Refined the layout and vertical spacing of the Player Upgrades panel in the Almanac, aligning cards, headers, and scroll bounds to eliminate visual offsets.

---

## 🚀 Canvas Performance Readbacks & Jump-At-Trigger Animation Overhauls
- **Hardware-Accelerated 2D Canvas Readbacks (`willReadFrequently: true`)**:
  - Automatically configures all 2D HTML Canvas contexts (`getContext('2d')`) with `{ willReadFrequently: true }` across `index.html` and `index.tsx`.
  - Optimizes `getImageData` pixel readbacks from GPU/CPU buffers, eliminates Chrome/Edge readback console warnings, and speeds up p5.js text metric calculations and offscreen buffer compositing.
- **Physical Run & Return Sequence for `pulseTurretJumpAtTriggerSource`**:
  - Turrets with jump-trigger actions (e.g., Potato Mine `t_mine`, Ice Mine `t2_icebomb`, Stun Mine `t2_stun`) execute a dynamic 2-phase run: they physically run toward their target at squad follow speed (with duration proportional to target distance), detonate their pulse at the target point, and then physically run back to their home spot.
  - While running in both directions, units trigger their full run-hopping wobble/bob animation (`isMoving = true`) and orient facing their travel vector.
  - Units with `hasUnarmedAsset: true` display their **armed** sprite while charging toward the target, switch to their unarmed/cooldown state upon detonation, and maintain the unarmed sprite while running home.

---

## 🛡️ Detach All Proximity-Exit Trigger & Off-Screen World Simulation
- **Proximity-Exit ("Step-Away") Detach Trigger**:
  - Detaching all turrets via the HUD `DetachAllTurrets` action flags placed units with `mustExitProximityFirst: true`.
  - The player and base attachments are barred from immediately re-colliding and picking up newly placed world turrets until they have physically stepped away beyond the detachment footprint (`safeExitDist`).
  - Once the player moves away, the proximity flag clears seamlessly, restoring standard collision pickup when the player returns.
- **Persistent Loot Pipeline (`neverDespawn: true`)**:
  - All dropped resource entities (Sun, Elixir, Soil, Raisin, Rare Components, Turret drops) default to persistent lifetime (`neverDespawn = true`).
  - Resources dropped by world turrets, mining operations, and sun generators remain safely cached in chunk memory without despawning or fading out, regardless of how far the player roams.
- **Active Chunks Registry & Off-Screen Simulation**:
  - `WorldManager.update()` decouples visual viewport culling from world simulation. Chunks containing active world buildings (player turrets, sun generators, active spawners, catalyst nodes) are registered into the simulation tick.
  - Placed world turrets continue auto-firing and mining sun generators offscreen, accumulating loot in chunk arrays with zero render CPU/GPU overhead until the player returns.

---

## 🧪 Modular Test Turrets & Action Expansions
- **`t2_wallaser` (Wallaser)**:
  - *Tooltip*: "For every blocks mined on its own, this turret heals 50 HP, bypassing's own MaxHP".
  - *Base & Stats*: 300 HP, `beamMaxLength: GRID_SIZE * 4`, reuses `t2_puncher`'s asset sprites.
  - *Mechanic*: Modular `onMineHealSelf: 50` and `onMineHealBypassMaxHP: true` configured on `ActionLaserBeam`. Automatically triggers when mining blocks or extracting Sun from Sun Generators.
- **`t2_heallaser` (Heallaser)**:
  - *Tooltip*: "For every blocks mined on its own, release a 10-hp heal pulse to nearby turrets".
  - *Base & Stats*: 50 HP, base laser range (`GRID_SIZE * 8`), reuses `t2_iceray`'s asset sprites.
  - *Mechanic*: Extends `ActionSpawnOnTargetDeath` with `triggerOnMine: true`, spawning `b_healing_pulse_10` at the turret to emit an AoE heal pulse to nearby friendly turrets.
  - *Costs*: 25 Sun (Almanac: 3 Shards, 5 Ice).
- **`t2_icewall` (Ice Wallnut)**:
  - *Tooltip*: "Emits a small chilling field".
  - *Base & Stats*: 300 HP wall defensive unit with `ActionAura` chilling aura (`radius: GRID_SIZE * 1.5`, `c_chilled` condition, `aura_frostfield` VFX).
  - *Costs*: 15 Sun (Almanac: 3 Shells, 2 Ice).
- **`t2_torchwood` (Torchwood)**:
  - *Tooltip*: "Emits a field that boost bullet's damage".
  - *Base & Stats*: 200 HP support unit, reuses `t3_flamethrower`'s asset sprites with custom animated ember particle `TorchwoodAuraVFX`.
  - *Mechanic*: Emits a 1.5-tile damage-boost field (`radius: GRID_SIZE * 1.5`). Projectiles passing through unique Torchwood fields receive `+3` stacked damage (`boostsBulletFromEmitter: ['turret', 'player']`) with visual fiery color tinting.
  - *Costs*: 30 Sun (Almanac: 5 Fuel, 5 Ice).

---

## ✨ Aura VFX Lifecycle, Grid Aura Persistence & Healing Visuals
- **Aura VFX Optimization & Stacking Prevention**:
  - `ActionAura` now registers a single, persistent aura instance per emitting turret (`FrostFieldAuraVFX` or `TorchwoodAuraVFX`), completely eliminating frame-based re-instantiation and infinite memory/stacking overhead.
  - Added robust spatial viewport culling (resolving `state.cameraPos` coordinates) and particle cap optimizations to `FrostFieldAuraVFX` and `TorchwoodAuraVFX` to ensure smooth 60fps rendering even with dozens of active aura fields across the map.
- **Continuous Grid Aura State**:
  - Turrets placed on the world grid (`WorldTurret`) now maintain continuous `specialActivityLevel = 1.0` while powered, keeping their chilling fields and projectile damage-boost auras permanently active regardless of whether the mobile squad is walking or stationary.
- **Standardized HP Bar Rendering**:
  - Reverted `visualTurrets.ts` to use uniform, standard HP bar display behavior across all turrets (rendered in clean red on dark backdrop when `health < maxHealth`).
- **Smooth Positional Movement Across World Grid & Attached Squad**:
  - `WorldTurret` now features smooth positional interpolation (`updateMovement`), smoothly gliding to target grid coordinates when placed or repositioned across the world grid.
  - Moving turrets between world grid tiles and the mobile attached squad now carries over the starting world position, allowing turrets to smoothly leap and glide to their new positions across all placement modes.
- **Green Healing Feedback Numbers**:
  - Reused `DamageNumberVFX` to render dynamic green text indicators (`[80, 255, 120]`) upon any turret, enemy, or player healing event without adding redundant UI elements.

---

## ⚡ Turret Movement, Chill Attack Slowdown & Balance Updates
- **Single-Trigger `t2_heallaser` Mining Fix**:
  - Block destruction now invokes `onTargetMined` exclusively without redundant firing from generic `onTargetKilled` hooks, ensuring `t2_heallaser` only heals once per block mined.
- **Physical Grid Movement & Aura VFX Retargeting**:
  - Picking up and moving turrets between world grid coordinates now physically repositions the turret instance, immediately updating its coordinate vectors (`gx`, `gy`, `pos`) and automatically carrying over active aura VFX (`FrostFieldAuraVFX`, `TorchwoodAuraVFX`), conditions, and stats.
  - Moving turrets between attached squad slots and the world grid seamlessly transfers health, max health, stat modifiers, and reparents existing VFX bindings.
- **Chill Condition Attack Slowdown (`c_chilled`)**:
  - Added `enemyAttackSpeedMultiplier: 2` to `c_chilled` in `conditionTypes`.
  - Enemies afflicted with `c_chilled` now experience a 2x slowdown on melee attack animation windups, melee cooldowns, and projectile firing rates.
- **`t2_wallaser` Balancing & Health Scaling**:
  - Updated `t2_wallaser` to feature a `maxHealth` of 1200 while starting at 150 HP upon placement.
  - Self-healing from mining blocks now strictly caps at `maxHealth` (1200 HP) without bypassing the maximum health ceiling.

---

## ⚡ Performance Optimizations: Spatial Grid, LOS Caching & Enemy Sprite Pipeline
- **Spatial Hash Bucket Grid (`SpatialHashGrid`)**:
  - Implemented high-performance spatial bucket grid in `class/spatialGrid.ts` with packed 32-bit integer coordinate hashing and recycled bucket array pools to eliminate Garbage Collection allocations.
  - Automatically indexes all alive enemies, player attachments, world turrets, and player entities into spatial buckets for $O(1)$ spatial queries.
  - Accelerated bullet collision detection and turret enemy target scanning via zero-allocation `queryCircleEnemies`.
- **LOS (Line-of-Sight) Cache & World Mutation Versioning**:
  - Added `obstacleVersion` tracking to `WorldManager`. Raycasts in `checkLOS` are now memoized across identical grid coordinates and invalidated only when world blocks are mined, modified, or placed.
- **Streamlined Enemy Sprite & Gizmo Fallback**:
  - `visualEnemies.ts` now directly renders hardware-accelerated sprite assets with minimal draw overhead, falling back to lightweight circular gizmos with directional ticks only if no sprite asset is loaded.
- **Dynamic Viewport Frustum Culling & Seamless Camera Zoom**:
  - Active rendering passes for world chunks, Y-sorted entities (turrets, enemies, NPCs), projectiles, and particle VFX dynamically cull objects outside the current visible viewport bounds plus safety buffer margins.
  - Integrated smooth mouse-wheel camera zooming (clamped between 0.65x wide view and 1.5x close view) with automatic mouse-to-world coordinate conversion and turret drag placement scaling.
  - Fixed click and drag picking areas in zoomed states across world interaction and drag-to-move handlers.
- **Unified Turret Relocation Animation Sequence**:
  - `WorldTurret` positions and movements between positions now use constant-speed steering physics matching following-player sequences with natural jump-hopping squash and stretch animations.
  - While turrets are relocating between tiles, they remain in an inactive state and ignore player collision to prevent accidental pick-up interruptions.

---

## 🏛️ Modular World Engine Architecture & Refined Systems
- **Modular `/world/` Engine Architecture**:
  - Refactored `world.ts` into isolated, maintainable modules under `/world/`:
    - **`paygate.ts`**: Encapsulates `PayGateGroup` clustering, multi-block link synchronization, proximity cost calculations, resource deductions, and break events.
    - **`block.ts`**: `Block` lifecycle management including layered rendering passes (`renderBase`, `renderSparkles`, `renderOverlay`), overlay weapon aiming/lasers, health bars, and enemy spawner logic.
    - **`chunk.ts`**: Dual-grid procedural world generation, room prefab processing, and 17×17 autotiling junction offscreen buffering.
    - **`worldManager.ts`**: `WorldManager` streaming, LRU chunk cache (127-chunk ceiling), DDA raycasting with versioned Line-of-Sight (LOS) memoization, and spatial indexing.
    - **`world.ts`**: Clean barrel file re-exporting all world classes, types, and constants.
- **Subpixel Autotile Junction Gap Elimination**:
  - Corrected tile centering in `visualAutotiling.ts` with `tileDrawOffset = (GRID_SIZE - tileDrawSize) / 2` and a slight subpixel bleed `GRID_SIZE + 0.8`, completely eliminating visual seams between 2×2 obstacle clusters.
- **Touch-Friendly Swipable Main Menu UI**:
  - Integrated touch and drag input handlers (`handleMainMenuPress`, `handleMainMenuDrag`, `handleMainMenuRelease`) into `ui/uiMainMenu.ts` and `index.tsx`, enabling seamless momentum dragging and swipe scrolling through the custom level list on touch screens and mobile devices.
- **Steep Ease-Out Dynamic Camera Zooming**:
  - Updated camera zoom interpolation curve to a steep `easeOut` curve for instant, snappy zooming responsiveness.
  - Selecting a turret from the hotbar or dragging a turret now dynamically calculates the exact viewport zoom scale needed to frame the player, all existing attachments, and all valid adjacent hex placement candidate spots with generous padding.
- **Level Export Default Progression**:
  - Standardized `AllTurretCrafting` to default to `false` when exporting level data from the Level Editor and when initializing new level configurations.
- **Relentless Pulse Turret Jump Chasing & Target Death Handling**:
  - `ActionPulse` with `pulseTurretJumpAtTriggerSource` now dynamically tracks and chases moving enemy targets in real-time until reaching the target for a successful detonation.
  - If a target dies or despawns during the chase, the jumping turret continues to the target's last known coordinates, emits the pulse detonation at that position, enters cooldown, and leaps back to its home attachment/world position.
- **Unrestricted Player Movement During Turret Selection & Placement**:
  - Players can now move normally with WASD, keyboard controls, or touch/mouse dragging while selecting or picking turrets from the hotbar or squad.
  - Placement candidate spots, ghost previews, and drag tethers dynamically follow the moving player and squad in real-time.

---

## 🎯 Level-Won Sequence, Stamina Boost Overhaul & Turret Refinements
- **Stamina Boost & Activation Threshold**:
  - `isClickHolding` boost mechanic requires a minimum of **25 stamina** to activate boosting and broadcast `isCharged()` state to attached turrets.
  - Once active, boosting continues smoothly until stamina is fully depleted (`stamina <= 0`), at which point boosting stops and `isCharged()` state ceases until stamina recovers to at least 25.
- **`t2_laserexplode` Block Destruction Bullet Spawning**:
  - Fixed bullet spawn coordinates for `t2_laserexplode` to spawn the `b_laser_explosion` bullet directly at the center coordinates of the mined/destroyed obstacle or target without duplicate spawning.
- **`t3_minecharge` Growth Bar & Stamina Gizmos**:
  - Added dedicated growth/charge bar rendering above `t3_minecharge` to visualize charging progression up to 500 stamina.
  - Updated `TurretGizmos` in Debug Mode (`state.debugGizmosTurrets`) to display the live stamina charge amount (`Charge: X/500`) and added detailed stamina charge tracking to mouse hover debug tooltips.
- **`ov_tnt` Explosion Fix & Chain Reactions**:
  - Improved `ov_tnt` explosive detonation with immediate AoE damage execution upon fuse completion.
  - Explosions within range of nearby ticking TNT explosives trigger chain-reaction detonations with rapid 4–6 frame detonation delays.
  - Upgraded `drawTickingExplosive` visuals with dynamic danger pulse overlays, smooth sprite rendering, and animated countdown fuse arcs.
- **Turret Debug HP Display**:
  - Debug Mode `HP Info` (`state.debugHP`) now renders HP bars and exact numerical health overlays (`${floor(health)}/${maxHealth}`) on all placed and attached turrets.
- **Dramatic Level-Won Sequence**:
  - Upon clearing all WinCondition objectives, the game initiates a sequential self-destruction sequence for all remaining active enemies and enemy obstacles (`isEnemy: true`), destroying one target every 6 frames with localized explosion VFX.
  - After all enemy entities and structures have self-destructed, a 15-frame pause precedes the victory screen and star rating calculations.
- **`ActionPulse` & Radial Wave Fixes (`t2_pulse`, `t3_repulser`)**:
  - Set `needsLOS(): false` on `ActionPulse` so line-of-sight raycasts no longer block radial pulses from targeting nearby enemies or adjacent obstacles.
  - Implemented a proximity fallback scan that detonates the pulse whenever valid targets enter the trigger radius even if target lock-on is momentary or obstructed.
- **`t2_laserexplode` Target Mined & Killed Bullet Spawning**:
  - Implemented `onTargetMined` and `onTargetKilled` hooks on `ActionLaserBeam` to ensure `b_laser_explosion` always spawns at the exact center of mined blocks and defeated entities.
- **Level Editor Flexible Render Distance & Zoom Clamping**:
  - Dynamically calculates `state.viewportBounds` in Level Editor mode with generous margins and loads all chunks encompassing the visible viewport, guaranteeing full rendering without clipping regardless of camera position or zoom scale.
  - Restricted dynamic turret selection camera zoom to zoom-in only (clamped to at least the player's base camera zoom level).
- **Turret Loot State Preservation & Direct Player Collision Attachment**:
  - Turrets as loot objects preserve their exact state (HP, conditions, arming progress) and automatically attempt to place themselves on the nearest clear grid cell within 5 tiles if `dieAfterDuration` is not set.
  - Player collision with world turrets immediately attaches them to the next available formation slot instead of dropping them as loot objects.
- **`t3_minecharger` Dynamic Step-Based Growth Bar**:
  - Reuses the cyan-flashing growth bar visuals to display charge progress towards the `nextStaminaStep` (`currentCharge / nextStaminaStep`) and automatically hides the bar once the final stamina step is reached.
- **`dealAoeAfterLifetime` Bullet Expiration Explosion Fix**:
  - Fixed an issue where projectiles with `dealAoeAfterLifetime: true` (and lifetime 1 explosion bullets) did not spawn their visual explosion or trigger their AoE radius effects upon reaching 0 lifetime.
  - Implemented `checkLifetimeExplode()` lifecycle checks in `Bullet.update()` across all early return paths and at the end of the update loop.
  - Added safe fallbacks in `Bullet.explode()` and `Bullet.getLerpedAoeDamage()` for missing/empty radius gradients and color palettes, ensuring explosions reliably detonate and apply area effects upon bullet expiration without duplicate triggers.

---

## ⚡ High-Performance Architecture & Memory Management
To eliminate GC spikes and maintain 60 FPS under dense projectile and enemy loads, the engine incorporates modern high-performance memory and spatial management systems:
- **Bit-Packed Spatial Hash Grid (`SpatialHashGrid`)**:
  - Encodes spatial buckets using bit-shifted 32-bit integer keys `((gx + 32768) << 16) | (gy + 32768)`, preventing negative coordinate hashing errors and completely removing GC garbage allocations from string-key allocations.
  - Accelerated radius queries (`queryCircleEnemies`, `queryCircle`) with early bounding-box culling are integrated across all turret actions (Aura, Pulse, Shield, Laser Beam, Tesla Chaining), auto-turret targeting, and bullet explosion calculations.
- **Generic Object Pooling (`ObjectPool<T>` & `PoolRegistry`)**:
  - Lightweight pooling engine (`class/pool.ts`) supporting lifecycle resets, clean factory instantiation, and dynamic metric tracking (`totalCreated`, `totalAcquired`, `totalReleased`, `peakActive`, `recycleRate`).
  - **Comprehensive VFX Pooling**:
    - Projectiles & Combat: `Bullet`, `Explosion`, `DamageNumberVFX`, `HitSpark`, `MuzzleFlash`, `BlockHitVFX`, `BlockDebris`, `SparkVFX`.
    - Area & Elemental: `FirePuddleVFX`, `FrostFieldAuraVFX`, `TorchwoodAuraVFX`, `StunGasVFX`, `PoisonGasVFX`, `ForcefieldVFX`, `MergeVFX`, `FireworkVFX`, `LiquidTrailVFX`.
    - Status & Boss Effects: `ConditionVFX`, `BugSplatVFX`, `GiantDeathVFX`, `WeldingHitVFX`, `MagicLinkVFX`, `FirstStrikeVFX`.
    - Flying Resource VFX: `LootInFlightVFX`, `PayGateFlyVFX`, `ShopFlyVFX`.
  - **Comprehensive Loot Pooling**:
    - `LootEntity` and `TurretLoot` pooled via `lootEntityPool` and `turretLootPool` with `spawnLootEntity()`, `spawnTurretLoot()`, and `releaseLoot()`.
- **$O(1)$ Swap-and-Pop Array Lifecycle**:
  - Replaced $O(N)$ `splice()` calls in core update loops with Swap-and-Pop (`const last = arr.pop()!; if (i < arr.length) arr[i] = last;`).
  - Active across `bullets`, `enemyBullets`, `vfx`, `uiVfx`, `chunk.loot`, `enemies`, `groundFeatures`, `trails`, `pendingSpawns`, and `tickingExplosives`.
- **Real-Time Engine Diagnostics & Performance Profiler HUD**:
  - **Debug Overlay (`state.showPerfOverlay` / `Perf HUD` toggle)**:
    - Real-time FPS and frame time monitoring (`ms/f`).
    - Entity allocation breakdown: active Bullets, world & UI VFX, Enemies, world Loot, attached/world Turrets, active Chunks, and Spatial Grid bucket count.
    - **Object Pools Leaderboard**: Displays active instances, peak usage, in-pool capacity, and total created instances with real-time color-coded load bars.
  - **Diagnostic Actions**: `Reset Peaks` to baseline peak profiling, and `Trim Pools` to manually purge idle pool instances from memory.
- **High-Performance Batched Bullet Renderer (`drawBatchedBullets`)**:
  - Replaces per-bullet `push()/pop()` canvas matrix state saves with high-throughput multi-pass bucketed rendering.
  - Groups tracer bullets into single continuous `ctx.beginPath() -> stroke()` vector paths, batches ground shadows into unified path fills, and buckets sprite bullets by texture key, reducing draw-call overhead and matrix state churn by over 90%.
- **Hierarchical Multi-Goal Flow Field Registry (`FlowFieldRegistry`)**:
  - Manages multiple prioritized navigation goals (Player, Core Base, PayGates, and custom objectives) in parallel.
  - Enemies route dynamically to their highest-priority accessible goal or fallback to direct line-of-sight vectors.
- **8-Bucket Interleaved AI Cognitive Scheduling & 30Hz Flocking**:
  - Distributes heavy enemy line-of-sight and spatial target queries across 8 staggered frame slices (`(uid & 7) === (frames & 7)`), eliminating concurrent frame spikes when large horde waves spawn.
  - Evaluates neighbor repulsion and soft-collision physics on alternating frames (30 Hz) with compensated impulse scaling, halving spatial hash queries while preserving movement smoothness.
- **Zero-GC Bit-Packed Raycast Memoization (`checkLOS`)**:
  - Replaced string template cache keys with bit-packed 48-bit numeric integer keys in `WorldManager.checkLOS()`, preventing heap string allocations during dense line-of-sight traversals.
- **Direct Obstacle-Bypassing Flight Vector for Flying Enemies (`isFlying`)**:
  - Enemies with `isFlying = true` completely bypass the flow-field grid pathfinder and wall line-of-sight checks, navigating directly toward their targets via straight Euclidean trajectories with no collision slowdowns or obstacle steering overhead.
- **Accurate Bullet Coloration & Custom Sprite Assets**:
  - Resolved bullet stroke color parsing by converting array RGB/RGBA tuples, hex strings, and numeric values into valid Canvas2D CSS color strings, eliminating unintended black borders.
  - Fully supports custom projectile sprite assets via `b.config.assetImg`, `b.config.idleAssetImg`, `b.config.bulletAssetImg`, or direct bullet asset keys, rendered with proper center origin and projectile trajectory rotation.
- **Fast Canvas2D Direct-Path Particle & VFX Acceleration**:
  - Replaced per-particle p5 matrix state saves and color query functions (`red()`, `green()`, `blue()`) in `DamageNumberVFX`, `HitSpark`, and `Explosion` with high-speed Canvas2D native arc, stroke, and fill paths, eliminating text and transformation bottlenecking during massive wave clears.
- **High-DPI 2x Crisp Visual Resolution & Fill-Rate Optimization**:
  - Restored razor-sharp visual fidelity by dynamically scaling `pixelDensity(Math.min(window.devicePixelRatio, 2))` across the main canvas and offscreen chunk buffers (`renderToBuffer`, `deathBuffer`).
  - Coupled with deep rendering pipeline optimizations, the engine comfortably maintains **60 FPS in fullscreen mode with 2x Retina clarity**.
- **Double Frustum & Fog-Radius Culling in `worldManager.display`**:
  - Implemented visibility-radius bounds filtering in addition to standard viewport bounds. In fullscreen mode (1440p/4K), chunks outside the player's immediate visibility bubble (`(VISIBILITY_RADIUS + 1) * GRID_SIZE`) are completely culled, reducing active chunk rendering by over 75%.
- **Pre-Categorized Chunk Block Indexing**:
  - Categorized block rendering in `Chunk` (`rebuildOverlayList`): segregated `liquidBlocks`, `assetBlocks`, `winConditionBlocks`, and `overlayBlocks`.
  - Replaced the brute-force scanning of all 256–512 tiles per chunk with targeted iterations over only active specialized blocks (reducing block iteration overhead by ~95% per frame).
- **Direct Canvas2D Blitting for Terrain Buffers & Trails**:
  - Accelerated offscreen autotile chunk and death buffer draws using direct native `ctx.drawImage` calls, bypassing p5 transformation matrix allocation.
  - Accelerated `LiquidTrailVFX` with direct Canvas2D arc and path rendering, keeping particle cascades smooth and fluid.
- **Fast-Path Radial Vignette & Lighting Acceleration**:
  - Replaced massive multi-thousand-pixel line width software arc strokes in `drawVisibilityOverlay` with direct single-pass radial gradient fills that cover the entire viewport in microseconds.
  - Accelerated ambient day/night and game-over tinting in `drawGlobalLighting` via native direct `ctx.fillRect()`, eliminating state-stack push/pop stalls.
- **Render-Loop Decoupling & Pure Viewport Drawing**:
  - Removed state-modifying logic (`b.update()`) from the tile rendering loop in `chunk.display()`, relocating all active spawner, turret, and catalyst logic exclusively to the fixed-timestep simulation loop (`tick()`).
- **Interactive Pause Menu Modal & Graphics Quality Settings**:
  - Replaced the direct in-game "MENU" button navigation with an Almanac-style `PauseMenu` modal utilizing standardized primitives (`drawModalFrame`, `drawCard`, `drawButton`, `drawYellowButton`, `drawRedButton`) from `uiComponents.ts`.
  - Added user-adjustable **Graphic Settings (`Low` [1x standard DPI] / `High` [2x Retina DPI])** with persistent state in `localStorage` (`grapeshooter_graphic_quality`), dynamically updating canvas `pixelDensity` and re-generating terrain buffers on demand.
  - Included clean **Resume Game** and **Exit to Menu** action buttons with full keyboard `Escape` toggling support.
- **Consistent Liquid Chunk Rendering**:
  - Updated liquid tile rendering to display cleanly at 100% opacity alongside the chunk's terrain pass, completely removing per-tile distance calculation and fading overhead while relying on chunk-level culling and the atmospheric vignette.
- **High-DPI Death VFX Buffer Alignment**:
  - Fixed persistent enemy death bug-splat alignment in `GraphicSettings=high` (2x Retina DPI) by providing explicit logical destination dimensions (`chunkW, chunkW`) to native `ctx.drawImage` calls, eliminating 2x scaling offsets across offscreen death buffers.
- **Standardized Debug Toggle & Collapsed Performance Section**:
  - Upgraded the in-game `Debug` button to use `drawDarkButton` from `uiComponents.ts`, matching the Almanac tactile 3D style and hitbox layer registry.
  - Set the `PERFORMANCE & POOLS` debug accordion to collapsed by default (`state.debugSectionsCollapsed.perf = true`) for a cleaner default debug view.
- **Comprehensive Level Entry UI Cache Reset**:
  - Hardened `startLevel()` in `levelManager.ts` to comprehensively purge all transient UI states (pause modal, shop dialogs, drag previews, upgrade popups, almanac state, scroll velocities, and input buffers) whenever starting or restarting a level.
- **Dynamic Multi-Track Sound & Music Engine (`src/audio/soundEngine.ts`)**:
  - **Dynamic In-Game Music & Synced Percussion**: Plays a shuffled, cycling playlist of synchronized level track pairs (`ingame1`/`ingame1b`, `ingame2`/`ingame2b`) in sample-accurate lockstep via the Web Audio API.
  - **Day/Night Dynamic Ramping**: When the `THE NIGHT IS APPROACHING` warning begins (19:30), the tense percussion layer (`ingameNb`) smoothly ramps to full volume over 4 seconds while daytime bird ambience fades out; in the morning (`time >= 6:00am` and `enemyCount < 10`), the percussion layer smoothly fades out over 8 seconds while daytime birds fade back in.
  - **Main Menu Music Cycling**: Main menu plays shuffled cycling tracks from `menu1` and `menu2` with smooth cross-fading.
  - **Global Sound Settings & Main Menu Access**: Integrated dedicated `[Music]` and `[SFX]` steppers (`drawNumberStepper`) accessible from both in-game PauseMenu and MainMenu (via the settings gear button next to Import Level), persisting globally in `localStorage`.
  - **AudioInfo HUD in Debug Mode**: Added an interactive Audio Engine HUD in Debug Mode (`state.showAudioDebugOverlay`) displaying active context state, loaded buffers count, current BGM, music/sfx master volumes, tense/birds multipliers, recent SFX triggers, and test SFX action buttons.
  - **Comprehensive Fallback SFX Integration**:
    - `enemy_death`: Randomly picks `enemy_death1`/`enemy_death2` when an enemy is slain.
    - `projectile_hit_enemy`: Plays `projectile_hit_enemy1`/`projectile_hit_enemy2` upon hitting an enemy entity.
    - `projectile_hit_block`: Plays `projectile_hit_block1`/`projectile_hit_block2` upon impacting destructible blocks and obstacles.
    - `shoot_light`: Plays `shoot_light1`/`shoot_light2` on bullet discharge.
    - `turret_bitten_softbody` & `turret_eaten`: Plays biting/eating sounds when turrets take enemy damage or are destroyed.
    - `collect_sun`: Plays sound effect upon loot arrival at the HUD counter.
    - `player_step`: Plays footsteps (`step1`-`step4`) during movement.
    - `hugewave_siren` & `hugewave_intro`: Triggers during the night approaching warning.
  - **Universal Deployment Support**: Built with dynamic base URL prefixing (`(import.meta as any).env?.BASE_URL`) for local and GitHub Pages deployments.
- **Resource Loading Screen (`ui/uiLoadingScreen.ts`)**:
  - Displays a clean, high-contrast loading screen (`Loading 50%` / progress bar) during initial audio/asset preloading and upon entering a level.
- **Lazy AudioContext & Decoupled State Initialization**:
  - Refactored `SoundEngine` to use lazy AudioContext initialization and safe fallback volume resolution (`localStorage` / guarded `state` access), eliminating circular dependency temporal dead zone (TDZ) warnings on initial bundle evaluation.
- **Normalized UI & Battle SFX Triggers**:
  - **Left-Aligned Audio Engine HUD**: Repositioned `AudioDebugHUD` to the left screen flank beneath the Performance HUD with toggleable test buttons and real-time buffer monitors.
  - **`btn_click`**: Unified across all standard UI button clicks, modal buttons, and top-right in-game actions.
  - **`levellist_hover`**: Triggered on modular button and level list hover states.
  - **`hugewave_intro` & `hugewave_siren`**: Plays `hugewave_intro` when the "THE NIGHT IS APPROACHING" banner appears and `hugewave_siren` when the night's spawn budget starts deploying.
  - **`inventory_click` & `not_enough_resource`**: Differentiates successful turret purchases/drags from insufficient currency attempts.
  - **`pause_btn`**: Plays on toggling game pause or entering the pause/settings menu.
  - **`speedup` / `speeddown`**: Plays upon toggling between 1x and 2x game speed.
  - **`turret_pickup`**: Triggers on dragging a turret or colliding with a detached turret in the world.
  - **`turret_place` & `turret_place_2`**: Alternates placement sound effects when deploying or moving turrets.
  - **`merge`**: Plays upon successful turret fusion on player attachment or world grid slots.
  - **`laser_loop`**: Continuous beam sound with seamless debounced looping in `ActionLaserBeam`.
  - **`block_death` (`1`-`3`)**: Randomly triggers on obstacle / block destruction.
  - **Dynamic In-Game Music & Throttled LOS Threat Detection**:
    - Expanded the in-game music playlist with tracks `ingame3` and `ingame4`.
    - Throttled tense percussion (`ingameXb`) threat evaluations to execute every 0.5 in-game hours (300 frames) to minimize CPU overhead.
    - Updated threat detection logic: `tensePercussion` now strictly counts enemies that have an unobstructed Line of Sight (`state.world.checkLOS`) to the player, dynamically activating intense battle percussion only when active direct threats are present.
  - **Pause Menu BGM Fade-Out & Resume**:
    - Opening the pause menu (`state.isPaused = true`) smoothly fades out the active background music to zero volume.
    - Resuming the game restores music tracks to their master volume levels seamlessly.
  - **Custom Turret & Obstacle AOE Explosion SFX**:
    - Added `explosionSfx` configuration to `aoeConfig` across explosive projectiles in `balanceBullets.ts` (e.g. `b_bomb_explosion`, `b_tnt_explosion`, `b_cherry_explosion`, `b_mine_explosion`, `b_mortar_shell`, `b_skymortar_shell`, `b_miningbomb_explosion`).
    - `Bullet.explode()` dynamically triggers randomized explosion sound effects from `aoeConfig.explosionSfx` mapped to the corresponding VFX visual types (`sfx/turret/` and `sfx/obstacle/`).
  - **Dynamic Level Editor Tooltips & Spawner UX**:
    - Modal tooltips automatically appear and switch based on active category/selection (e.g., selecting `ov_spawner` or `l_spawner` activates the Spawner Tooltip, selecting `sunGenerator` activates the Sun Generator Tooltip, and non-spawner selections automatically dismiss active tooltips).
    - Ground Spawner (`l_spawner`) provides full configuration for `hourlySpawnConfig` (hourly budget multiplier, hourly budget add, and self-destruction budget threshold).
  - **Almanac & Level Editor Player Upgrade / Config UX**:
    - Added `SET ALL TO 1 LEVEL` batch action in the Player Upgrades editor to rapidly configure all upgrade tracks to their first-tier values.
    - Remade Player Upgrade and Level Config input fields using standardized design tokens from `uiComponents.ts` and `uiColors.ts` (consistent borders, focus highlights, selection colors, and responsive inputs).
  - **Reworked Enemy Spawning Rules & Damage-Correlated Spawners**:
    - Global enemy budget spawning strictly executes during nighttime, enforcing minimum 12-tile player distance and 6-tile turret distance.
    - Enemies can spawn across open ground and non-dangerous liquids, while flying enemies (`isFlying: true`) can spawn on top of obstacles.
    - Local spawners (`ov_spawner`) pre-cache their spawn queues upon initialization and spawn enemies proportionally as they take damage (% health lost correlates to % enemies spawned from the cached queue), spawning remaining units upon destruction.
  - **Interactive Main Menu Minigame Audio**:
    - Integrated sound effects for eliminating enemies and interacting within the main menu background mini-game.












## FOR AI Agents:
Strictly follow the established art style of the game
Scan through all of the file system for extra context and follow the exiting modularization, avoid hard-coding as much as possible
Do not add extra texts when not requested to, keep the UI as simple as possible

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
- **Dynamic UI**: The Almanac features a left-aligned navigation system, real-time resource monitors, and a specialized **Player Upgrades** display centering the animated player sprite with four side cards styled after the `TurretInfoPanel` dark green theme with segmented tier progression bars, hover-only card borders, and the tactile yellow 3D Upgrade button style.
- **Level-Specific Player Upgrades**: When loading a level from the Level List, the game strictly loads the level's own `playerUpgrades` configuration (with fallback to default if not defined), cleanly isolating gameplay from any modifications made during recent Level Editor sessions.
- **Interactive Upgrade Editing & Text Navigation**: In the Level Editor's Upgrade Config, text inputs for `StatLevel:` and `UpgradeCost:` support seamless cursor navigation (arrow keys, Home/End), text selection (drag-to-highlight, Shift+Arrows, Ctrl+A), and instant reactive parsing across imported and newly created custom maps without getting stuck at stale cache states.

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
- **`turretAttachCapacity`**: Limits the number of turrets attachable to the player's core base (Default levels: `[6, 8, 10, 13, 16, 20, 24]`, Elixir cost: `[5, 10, 20, 35, 60, 100]`).
  - Displayed in the HUD currency bar as `(currentAttachedCount) / (TurretAttachCapacity)` with the sunflower icon.
  - **`CountTowardAttachedCapacity` Flag**: Individual turrets like `t_lilypad` set `CountTowardAttachedCapacity: false` so ground-layer or utility platforms do not count towards the attachment capacity limit.
  - When capacity is reached, attached slot previews around the player are hidden during purchase AND when dragging/picking up a `WorldTurret`, and the attaching action is completely disabled.
  - If a player collects stray/dropped turret loot while at capacity, the turret automatically spawns as a `WorldTurret` on the nearest clear grid cell instead of attaching, and collisions with world turrets are ignored.
- **`sunBankCapacity`**: Maximum Sun loot currency storage (Default levels: `[20, 30, 50, 70, 100, 200, 400]`, Elixir cost: `[5, 15, 30, 50, 80, 100]`).
  - Displayed in the HUD currency bar as `(currentSunCount) / (SunBankCapacity)`.
  - When maximum capacity is reached, dropped Sun loot is ignored (cannot be attracted by magnet or collected by player).
- **`magnetRadius`**: Magnet attraction pickup radius for loot and dropped resources (Default levels: `[gridSize*2.5, *3, *3.6, *4.2, *4.8, *5.4, *6]`, Elixir cost: `[10, 20, 40, 70, 100, 120]`).
  - Directly drives the attraction radius of all valid dropped items towards the player.
- **`damageMultAdd`**: Additive damage multiplier applied ONLY to the player's own direct mining and attacking combat projectiles (`b_player` and `b_player_mining`), preserving independent turret balance (Default levels: `[0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5]`, Elixir cost: `[5, 15, 30, 50, 80, 100]`).
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
- **`customBudgetPerNight`**: Overrides the baseline nightly wave budget per day (e.g. `[100, 200, 400, 800, 1500, ...]`).
- **`hourlyBudgetPerDay`**: Configures the hourly budget allocation during daytime per day (e.g. `[3, 10, 15, 18, 20]`).
- **`hourlyBudgetPerNight`**: Configures the hourly ambient budget replenishment during nighttime per day (e.g. `[20, 40, 50, 60, 70]`).
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
- **Level Editor Camera Zoom & Interaction Isolation**:
  - Added smooth mouse wheel camera zooming (`0.3x` to `3.0x`) in the Level Editor centered on world view.
  - Strict UI interaction isolation prevents brush or tile modifications while interacting with tooltips, top menus, or category tabs.
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
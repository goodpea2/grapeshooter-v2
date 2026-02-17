
# Core Explorer: Technical & Design Library

Core Explorer (v3.1) is a procedural 2D survival game built with **TypeScript** and **p5.js**. It features a unique mobile-base expansion system, a deep merging matrix, and a dynamic ecosystem.

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

## 👥 NPC Characters
The world is populated by unique survivors who offer specialized trades. Each character features custom front and back-facing sprites:
- **Tutor Thyme**: The initial guide.
- **Lily**: Swamp dweller specializing in Lilypads and aquatic growth.
- **Jelly**: Provides early-game explosives.
- **Farmer**: Agricultural expert for T1 and T2 Seeds.
- **Sour Grape**: Obsessed with purple Elixir; trades for high-value consumables.
- **Shroom**: Night-themed vendor of cheap Puffshrooms.
- **Sir Knight**: Defensive veteran providing Tallnuts.
- **Hunter**: Bulk trader for high-tier combat gear.

---

## 🛠️ Debug Mode & World Preview
The Debug menu includes a sophisticated **World Generation Preview** for balancing.
- **Buffered Map Preview**: The noise map is rendered to a separate graphics buffer to maintain 60 FPS even when tweaking parameters.
- **Room Director Generation**: A sophisticated logic chain that plans out prefab sequences. The generated chain is displayed in a wrapped, scrollable text field with a one-click copy function.
- **Responsive Layout**: UI modal scales to fit smaller screen resolutions without spilling over boundaries.

---

## 📦 Data-Driven Loot & Economy
The economy utilizes a three-tier hierarchy managed in `balanceLootTable.ts`.

### 1. Loot Types (Entities)
Defines the visual and mechanical properties of a single drop.
- **Type**: `currency` (adds to bank) or `turret` (attaches to base).
- **Item**: Key reference for the specific item.
- **Scaling**: `idleAssetImgSize` provides a random size range on spawn for organic visual variety.

### 2. Loot Table Types (Roll Logic)
Weighted probability lists that result in a set of `lootTypeKeys` and an `itemCount`. Supports "nothing" outcomes for classic RNG progression.

### 3. Loot Configs (Triggers)
The high-level bridge between gameplay events (e.g., Block Death) and the loot tables. Each config is a weighted list that can call multiple tables with specific `rollCounts`, enabling complex, layered rewards.

---

## 🏗️ The Hex-Axial Grid System
Base expansion is built on a **Hex-Axial Coordinate System** (q, r).
- **Core (0,0)**: The player's main unit. It houses the auto-mining turret.
- **Attachments**: Turrets are snapped to the hex grid using axial-to-world conversion logic.
- **Adjacency Requirement**: New turrets must be placed adjacent to an existing unit.
- **Movement**: The entire base is physics-linked. When the player moves, the world-space offsets of all attachments are recalculated in real-time.

## 🚜 Special Units: The Growth System
Some units like the **Seed (`t_seed`)** utilize a time-based evolution system.
- **Growth Tick**: Occurs every 0.25 hours (150 frames).
- **Water Synergy**: Contact with `l_water` (Water) quadruples growth speed (+4 points per tick instead of +1).
- **Evolution**: At 32 points, the seed transforms into a random Tier 1 turret.

## 🌍 Procedural World Generation
The world is generated in **16x16 block chunks** using multi-layered Simplex noise.
- **Obstacle Noise**: Determines block density and material (Dirt -> Obsidian).
- **Liquid System**:
    - **Water**: Standard flow. Accelerates plant growth.
    - **Ice**: Frictionless movement; causes "Frosted" status to turrets.
    - **Tar**: 50% fire rate and movement penalty.
    - **Lava**: High tick damage; applies "Burning" status.

## 🧪 The Merge Matrix (Evolution Path)
Turrets evolve by combining T1 base ingredients. The system tracks the "Ingredient History" of every unit.

### T1 Base Ingredients
- **Peashooter (`t_pea`)**: Pure DPS.
- **Mining Laser (`t_laser`)**: Rapid block destruction.
- **Wallnut (`t_wall`)**: High HP defense.
- **Landmine (`t_mine`)**: Contact AOE.
- **Iceberg (`t_ice`)**: Freeze/Stun trap.

## ⚙️ Core Mechanics & State Machine
The game operates on a **Stationary vs Moving** binary state:
- **Moving**: Turrets are retracted/inactive, UI shop fades, exploration focus.
- **Stationary**: (After 15 frames of no movement) Turrets deploy, mining laser arms, and the Merge UI becomes active.
- **Time/Light**: 24-hour cycle (600 frames/hour). Night (21:00-04:00) triples enemy spawn budgets and reduces visibility.

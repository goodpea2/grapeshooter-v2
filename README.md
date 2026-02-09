
# Core Explorer - Game Documentation

## 🚀 Deployment Instructions

To get this game running on the web, follow these steps:

### Option A: Vercel (Recommended - Easiest)
1. Push your code to a GitHub repository.
2. Go to [Vercel.com](https://vercel.com) and click **"Add New" -> "Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect **Vite**. 
5. Click **Deploy**. Vercel handles the TypeScript compilation for you.

### Option B: Netlify
1. Push your code to GitHub.
2. Go to [Netlify.com](https://netlify.com) and click **"Add a new site" -> "Import an existing project"**.
3. Connect your GitHub and select the repo.
4. Ensure the build command is `npm run build` and the publish directory is `dist`.
5. Click **Deploy**.

### Option C: Manual Local Build
If you want to test the build locally:
1. Install [Node.js](https://nodejs.org/).
2. Run `npm install` in your project folder.
3. Run `npm run build`.
4. Your ready-to-host files will be in the `dist/` folder.

---

## Core Mechanics (v3.0)
- **Mining**: Player core has an auto-mining turret that targets the nearest block or enemy. Mining projectiles travel to blocks to deal damage.
- **Base Expansion**: Turrets attach to the core using a hex-axial grid system. Base expansion is only available while stationary.
- **Stationary vs Moving**: Turrets fade to low opacity and systems (like auto-mining/combat) become less active when in motion.

## Ingredient-Based Merging System
- **T1 Base Turrets**: Peashooter, Mining Laser, Wallnut, Landmine, Iceberg.
- **Dynamic Merging**: Merging now calculates the combined ingredient pool of two turrets. 
- **Recipe Matching**: The system scans `TURRET_RECIPES` to find a match.

## Visual Polish & Rendering
- **Outermost Silhouette**: Enemies use a **Two-Pass Rendering Strategy** for a unified "sticker-like" appearance.
- **Eye Rendering**: Eyes are rendered without outlines for expression.

## Structured Overlays (v2.9)
- **Hostile Structures**: Objects like `Sniper Tower` are flagged as `isEnemy`. 
- **Loot Tables**: Destruction results (Sun, Turret Crates) are driven by `lootConfigOnDeath`.

## Dynamic World Gen
- **Multi-Pot Accumulator**: Exploring new chunks accumulates "pot" values.
- **Legible Spawning**: System ensures entities only spawn on navigable ground.

## Liquid Environments
- **Water**: Standard movement.
- **Ice**: High friction, leaves ice trails. Turrets become "Frosted".
- **Tar**: High viscosity. Reduces movement speed and fire rates.
- **Lava**: Dangerous tick-damage and applied `c_burning`.

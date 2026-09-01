import { state } from '../../state';
import { HOUR_FRAMES } from '../../constants';

// Clean Base URL resolution for local and GitHub Pages deployments
const BASE_URL = (import.meta as any).env?.BASE_URL || './';

function getAudioUrl(relativePath: string): string {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
  const cleanRel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `${cleanBase}audio/${cleanRel}`;
}

export const ALL_AUDIO_FILES: { key: string; path: string; category: 'music' | 'ambient' | 'sfx' }[] = [
  // Music
  { key: 'music/menu1', path: 'music/menu1.ogg', category: 'music' },
  { key: 'music/menu2', path: 'music/menu2.ogg', category: 'music' },
  { key: 'music/ingame1', path: 'music/ingame1.ogg', category: 'music' },
  { key: 'music/ingame1b', path: 'music/ingame1b.ogg', category: 'music' },
  { key: 'music/ingame2', path: 'music/ingame2.ogg', category: 'music' },
  { key: 'music/ingame2b', path: 'music/ingame2b.ogg', category: 'music' },
  { key: 'music/ingame3', path: 'music/ingame3.ogg', category: 'music' },
  { key: 'music/ingame3b', path: 'music/ingame3b.ogg', category: 'music' },
  { key: 'music/ingame4', path: 'music/ingame4.ogg', category: 'music' },
  { key: 'music/ingame4b', path: 'music/ingame4b.ogg', category: 'music' },

  // Ambient
  { key: 'sfx/ambient/loop_birds', path: 'sfx/ambient/loop_birds.ogg', category: 'ambient' },
  { key: 'sfx/ambient/loop_fire', path: 'sfx/ambient/loop_fire.ogg', category: 'ambient' },

  // Battle SFX
  { key: 'block_death1', path: 'sfx/battle/block_death1.ogg', category: 'sfx' },
  { key: 'block_death2', path: 'sfx/battle/block_death2.ogg', category: 'sfx' },
  { key: 'block_death3', path: 'sfx/battle/block_death3.ogg', category: 'sfx' },
  { key: 'enemy_death1', path: 'sfx/battle/enemy_death1.ogg', category: 'sfx' },
  { key: 'enemy_death2', path: 'sfx/battle/enemy_death2.ogg', category: 'sfx' },
  { key: 'enemy_death3', path: 'sfx/battle/enemy_death3.ogg', category: 'sfx' },
  { key: 'enemy_death_onwater1', path: 'sfx/battle/enemy_death_onwater1.ogg', category: 'sfx' },
  { key: 'enemy_death_onwater2', path: 'sfx/battle/enemy_death_onwater2.ogg', category: 'sfx' },
  { key: 'enemy_death_strong', path: 'sfx/battle/enemy_death_strong.ogg', category: 'sfx' },
  { key: 'laser_loop', path: 'sfx/battle/laser_loop.ogg', category: 'sfx' },
  { key: 'projectile_hit_block1', path: 'sfx/battle/projectile_hit_block1.ogg', category: 'sfx' },
  { key: 'projectile_hit_block2', path: 'sfx/battle/projectile_hit_block2.ogg', category: 'sfx' },
  { key: 'projectile_hit_block3', path: 'sfx/battle/projectile_hit_block3.ogg', category: 'sfx' },
  { key: 'projectile_hit_enemy1', path: 'sfx/battle/projectile_hit_enemy1.ogg', category: 'sfx' },
  { key: 'projectile_hit_enemy2', path: 'sfx/battle/projectile_hit_enemy2.ogg', category: 'sfx' },
  { key: 'projectile_hit_enemy3', path: 'sfx/battle/projectile_hit_enemy3.ogg', category: 'sfx' },
  { key: 'projectile_hit_enemy4', path: 'sfx/battle/projectile_hit_enemy4.ogg', category: 'sfx' },
  { key: 'projectile_hit_enemy5', path: 'sfx/battle/projectile_hit_enemy5.ogg', category: 'sfx' },
  { key: 'punch_hit_1', path: 'sfx/battle/punch_hit_1.ogg', category: 'sfx' },
  { key: 'punch_hit_2', path: 'sfx/battle/punch_hit_2.ogg', category: 'sfx' },
  { key: 'snipertower_death', path: 'sfx/battle/snipertower_death.ogg', category: 'sfx' },
  { key: 'turret_bitten_hardbody', path: 'sfx/battle/turret_bitten_hardbody.ogg', category: 'sfx' },
  { key: 'turret_bitten_softbody1', path: 'sfx/battle/turret_bitten_softbody1.ogg', category: 'sfx' },
  { key: 'turret_bitten_softbody2', path: 'sfx/battle/turret_bitten_softbody2.ogg', category: 'sfx' },
  { key: 'turret_eaten', path: 'sfx/battle/turret_eaten.ogg', category: 'sfx' },

  // Turret SFX
  { key: 'turret/b_cherry_explosion', path: 'sfx/turret/b_cherry_explosion.ogg', category: 'sfx' },
  { key: 'turret/b_mine_explosion', path: 'sfx/turret/b_mine_explosion.ogg', category: 'sfx' },
  { key: 'turret/b_mortar_explosion1', path: 'sfx/turret/b_mortar_explosion1.ogg', category: 'sfx' },
  { key: 'turret/b_mortar_explosion2', path: 'sfx/turret/b_mortar_explosion2.ogg', category: 'sfx' },

  // Obstacle SFX
  { key: 'obstacle/b_tnt_explosion', path: 'sfx/obstacle/b_tnt_explosion.ogg', category: 'sfx' },

  // Player SFX
  { key: 'collect_sun', path: 'sfx/player/collect_sun.ogg', category: 'sfx' },
  { key: 'playerprojectile_hit1', path: 'sfx/player/playerprojectile_hit1.ogg', category: 'sfx' },
  { key: 'playerprojectile_hit2', path: 'sfx/player/playerprojectile_hit2.ogg', category: 'sfx' },
  { key: 'step1', path: 'sfx/player/step1.ogg', category: 'sfx' },
  { key: 'step2', path: 'sfx/player/step2.ogg', category: 'sfx' },
  { key: 'step3', path: 'sfx/player/step3.ogg', category: 'sfx' },
  { key: 'step4', path: 'sfx/player/step4.ogg', category: 'sfx' },

  // Shooting SFX
  { key: 'shoot_light_1', path: 'sfx/shooting/shoot_light_1.ogg', category: 'sfx' },
  { key: 'shoot_light_2', path: 'sfx/shooting/shoot_light_2.ogg', category: 'sfx' },

  // UI SFX
  { key: 'btn_click', path: 'sfx/ui/btn_click.ogg', category: 'sfx' },
  { key: 'hugewave_intro', path: 'sfx/ui/hugewave_intro.ogg', category: 'sfx' },
  { key: 'hugewave_siren', path: 'sfx/ui/hugewave_siren.ogg', category: 'sfx' },
  { key: 'inventory_click', path: 'sfx/ui/inventory_click.ogg', category: 'sfx' },
  { key: 'levellist_hover', path: 'sfx/ui/levellist_hover.ogg', category: 'sfx' },
  { key: 'merge', path: 'sfx/ui/merge.ogg', category: 'sfx' },
  { key: 'not_enough_resource', path: 'sfx/ui/not_enough_resource.ogg', category: 'sfx' },
  { key: 'pause_btn', path: 'sfx/ui/pause_btn.ogg', category: 'sfx' },
  { key: 'speeddown', path: 'sfx/ui/speeddown.ogg', category: 'sfx' },
  { key: 'speedup', path: 'sfx/ui/speedup.ogg', category: 'sfx' },
  { key: 'turret_pickup', path: 'sfx/ui/turret_pickup.ogg', category: 'sfx' },
  { key: 'turret_place_2', path: 'sfx/ui/turret_place_2.ogg', category: 'sfx' },
  { key: 'turret_place', path: 'sfx/ui/turret_place.ogg', category: 'sfx' }
];

export interface RecentSFXEntry {
  name: string;
  time: number;
  volume: number;
}

export class SoundEngine {
  private static instance: SoundEngine | null = null;

  // Web Audio Core
  private audioCtx: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  private isPreloading: boolean = false;
  private preloadedCount: number = 0;
  private totalToPreload: number = ALL_AUDIO_FILES.length;

  // Gain Hierarchy
  private masterMusicGain: GainNode | null = null;
  private masterSFXGain: GainNode | null = null;
  private baseGain: GainNode | null = null;
  private tenseGain: GainNode | null = null;
  private birdsGain: GainNode | null = null;
  private menuGain: GainNode | null = null;

  // Active Sound Sources
  private baseSource: AudioBufferSourceNode | null = null;
  private tenseSource: AudioBufferSourceNode | null = null;
  private birdsSource: AudioBufferSourceNode | null = null;
  private menuSource: AudioBufferSourceNode | null = null;

  // Playlist & State Management
  private currentIngameTrackIndex: number = 1;
  private currentMenuTrackIndex: number = 1;
  private ingamePlaylistOrder: number[] = [1, 2, 3, 4];
  private ingamePlaylistPos: number = 0;
  private menuPlaylistOrder: number[] = [1, 2];
  private menuPlaylistPos: number = 0;

  // Ramping & Volume State
  private tenseVolume: number = 0; // 0.0 to 1.0 (multiplier for percussion track)
  private birdsVolume: number = 1.0; // 0.0 to 1.0 (multiplier for daytime birds)
  private pauseFadeVolume: number = 1.0; // 1.0 active, fades to 0.0 on pause menu open
  private isNightTenseActive: boolean = false;
  private lastMusicCheckFrame: number = -1;
  private isMusicPlaying: boolean = false;
  private isMenuMusicPlaying: boolean = false;
  private trackStartTime: number = 0;
  private currentTrackDuration: number = 0;

  // Laser Beam Continuous Audio Node
  private laserSource: AudioBufferSourceNode | null = null;
  private laserGain: GainNode | null = null;
  private laserActiveTimer: number = 0;

  // SFX Throttling & Diagnostics
  private sfxCooldowns: Map<string, number> = new Map();
  private stepSequenceIndex: number = 1;
  private lastStepTime: number = 0;
  private recentSFXLog: RecentSFXEntry[] = [];
  private isUnlocked: boolean = false;

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  constructor() {
    this.setupUnlockListeners();
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.buildAudioGraph();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or initialized:', e);
    }
  }

  private buildAudioGraph(): void {
    if (!this.audioCtx) return;

    // Master Music & SFX Gain Nodes
    this.masterMusicGain = this.audioCtx.createGain();
    this.masterSFXGain = this.audioCtx.createGain();

    const getInitialVol = (storageKey: string, fallback: number) => {
      try {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
        if (saved !== null) {
          const val = parseInt(saved, 10);
          if (!isNaN(val) && val >= 0 && val <= 100) return val;
        }
      } catch {}
      try {
        if (typeof state !== 'undefined' && state) {
          if (storageKey === 'grapeshooter_music_volume' && state.musicVolume != null) return state.musicVolume;
          if (storageKey === 'grapeshooter_sfx_volume' && state.sfxVolume != null) return state.sfxVolume;
        }
      } catch {}
      return fallback;
    };

    const initialMusicVol = getInitialVol('grapeshooter_music_volume', 50);
    const initialSfxVol = getInitialVol('grapeshooter_sfx_volume', 50);

    this.masterMusicGain.gain.setValueAtTime(initialMusicVol / 100, this.audioCtx.currentTime);
    this.masterSFXGain.gain.setValueAtTime(initialSfxVol / 100, this.audioCtx.currentTime);

    this.masterMusicGain.connect(this.audioCtx.destination);
    this.masterSFXGain.connect(this.audioCtx.destination);

    // Sub-Gain Nodes for Synced Music Layers
    this.baseGain = this.audioCtx.createGain();
    this.tenseGain = this.audioCtx.createGain();
    this.birdsGain = this.audioCtx.createGain();
    this.menuGain = this.audioCtx.createGain();

    this.baseGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
    this.tenseGain.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    this.birdsGain.gain.setValueAtTime(this.birdsVolume * 0.7, this.audioCtx.currentTime);
    this.menuGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

    this.baseGain.connect(this.masterMusicGain);
    this.tenseGain.connect(this.masterMusicGain);
    this.birdsGain.connect(this.masterMusicGain);
    this.menuGain.connect(this.masterMusicGain);
  }

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.isUnlocked) return;
      this.isUnlocked = true;

      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.onContextUnlocked();
        }).catch(() => {});
      } else {
        this.onContextUnlocked();
      }

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
  }

  private onContextUnlocked(): void {
    try {
      if (typeof state !== 'undefined' && state) {
        if (state.currentScreen === 'game') {
          if (!this.isMusicPlaying) {
            this.startLevelMusic();
          }
        } else if (state.currentScreen === 'main_menu') {
          if (!this.isMenuMusicPlaying) {
            this.playMenuTrack();
          }
        }
      }
    } catch {}
  }

  public ensureContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  // =========================================================================
  // Resource Preloading & Loading Screen Integration
  // =========================================================================

  public async preloadAllResources(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isPreloading) return;
    this.isPreloading = true;
    state.isLoadingResources = true;
    state.loadingProgress = 0;

    const ctx = this.ensureContext();
    this.preloadedCount = 0;
    this.totalToPreload = ALL_AUDIO_FILES.length;

    const loadAudioFile = async (item: typeof ALL_AUDIO_FILES[0]) => {
      try {
        const url = getAudioUrl(item.path);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();

        if (ctx) {
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
          this.soundBuffers.set(item.key, audioBuffer);
          this.soundBuffers.set(item.path, audioBuffer);
          const basename = item.path.split('/').pop()?.replace(/\.ogg$/i, '');
          if (basename) {
            this.soundBuffers.set(basename, audioBuffer);
          }
        }
      } catch (err) {
        console.warn(`Failed to preload audio [${item.key}] from ${item.path}:`, err);
      } finally {
        this.preloadedCount++;
        const p = Math.min(1.0, this.preloadedCount / this.totalToPreload);
        state.loadingProgress = p;
        if (onProgress) onProgress(p);
      }
    };

    // Load with concurrent batches to prevent overwhelming the browser
    const concurrency = 6;
    for (let i = 0; i < ALL_AUDIO_FILES.length; i += concurrency) {
      const batch = ALL_AUDIO_FILES.slice(i, i + concurrency);
      await Promise.all(batch.map(loadAudioFile));
    }

    state.loadingProgress = 1.0;
    this.isPreloading = false;

    // Small smooth delay before dismissing loading screen
    await new Promise((r) => setTimeout(r, 120));
    state.isLoadingResources = false;
  }

  // =========================================================================
  // In-Game Synced Music Engine (Zero-Offset Clock Sync & Playlist Cycling)
  // =========================================================================

  public startLevelMusic(): void {
    this.stopMenuMusic();
    this.stopIngameTracks();

    // Shuffle playlist on start
    this.ingamePlaylistOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    this.ingamePlaylistPos = 0;
    this.currentIngameTrackIndex = this.ingamePlaylistOrder[this.ingamePlaylistPos];

    this.tenseVolume = 0;
    this.birdsVolume = 1.0;
    this.isNightTenseActive = false;
    this.lastMusicCheckFrame = -1;

    this.playSyncedIngamePair(this.currentIngameTrackIndex);
  }

  private playSyncedIngamePair(trackIdx: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stopIngameTracks();

    const baseKey = `music/ingame${trackIdx}`;
    const tenseKey = `music/ingame${trackIdx}b`;
    const birdsKey = `sfx/ambient/loop_birds`;

    const baseBuf = this.soundBuffers.get(baseKey);
    const tenseBuf = this.soundBuffers.get(tenseKey);
    const birdsBuf = this.soundBuffers.get(birdsKey);

    if (!baseBuf || !tenseBuf) {
      // If buffers not ready, try fallback or wait
      return;
    }

    this.currentIngameTrackIndex = trackIdx;
    this.currentTrackDuration = baseBuf.duration;

    // Create synchronized sources
    this.baseSource = ctx.createBufferSource();
    this.tenseSource = ctx.createBufferSource();
    this.birdsSource = ctx.createBufferSource();

    this.baseSource.buffer = baseBuf;
    this.tenseSource.buffer = tenseBuf;
    if (birdsBuf) {
      this.birdsSource.buffer = birdsBuf;
      this.birdsSource.loop = true;
    }

    if (this.baseGain) this.baseSource.connect(this.baseGain);
    if (this.tenseGain) this.tenseSource.connect(this.tenseGain);
    if (this.birdsGain && birdsBuf) this.birdsSource.connect(this.birdsGain);

    // CRITICAL: Set absolute sample-accurate start time on Web Audio clock
    const syncStartTime = ctx.currentTime + 0.05;
    this.trackStartTime = syncStartTime;

    this.baseSource.start(syncStartTime);
    this.tenseSource.start(syncStartTime);
    if (birdsBuf) this.birdsSource.start(syncStartTime);

    this.isMusicPlaying = true;

    // Listen for track ending to shuffle / cycle to next in playlist
    this.baseSource.onended = () => {
      if (this.isMusicPlaying && state.currentScreen === 'game') {
        this.cycleNextIngameTrack();
      }
    };
  }

  private cycleNextIngameTrack(): void {
    this.ingamePlaylistPos = (this.ingamePlaylistPos + 1) % this.ingamePlaylistOrder.length;
    if (this.ingamePlaylistPos === 0) {
      // Re-shuffle order when cycling back to start
      this.ingamePlaylistOrder = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    }
    const nextIdx = this.ingamePlaylistOrder[this.ingamePlaylistPos];
    this.playSyncedIngamePair(nextIdx);
  }

  public stopIngameTracks(): void {
    if (this.baseSource) {
      try { this.baseSource.stop(); this.baseSource.disconnect(); } catch {}
      this.baseSource = null;
    }
    if (this.tenseSource) {
      try { this.tenseSource.stop(); this.tenseSource.disconnect(); } catch {}
      this.tenseSource = null;
    }
    if (this.birdsSource) {
      try { this.birdsSource.stop(); this.birdsSource.disconnect(); } catch {}
      this.birdsSource = null;
    }
    this.isMusicPlaying = false;
  }

  // =========================================================================
  // Main Menu Music Engine (Cycling / Shuffling)
  // =========================================================================

  public playMenuTrack(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (this.isMenuMusicPlaying && this.menuSource) return;

    this.stopIngameTracks();
    this.stopMenuMusic();

    if (this.menuPlaylistPos >= this.menuPlaylistOrder.length) {
      this.menuPlaylistOrder = [1, 2].sort(() => Math.random() - 0.5);
      this.menuPlaylistPos = 0;
    }

    this.currentMenuTrackIndex = this.menuPlaylistOrder[this.menuPlaylistPos];
    const trackKey = `music/menu${this.currentMenuTrackIndex}`;
    const buf = this.soundBuffers.get(trackKey);

    if (!buf) return;

    this.menuSource = ctx.createBufferSource();
    this.menuSource.buffer = buf;
    if (this.menuGain) this.menuSource.connect(this.menuGain);

    const startTime = ctx.currentTime + 0.05;
    this.menuSource.start(startTime);
    this.isMenuMusicPlaying = true;

    // Cycle to next menu track upon completion
    this.menuSource.onended = () => {
      if (this.isMenuMusicPlaying && state.currentScreen === 'main_menu') {
        this.menuPlaylistPos = (this.menuPlaylistPos + 1) % this.menuPlaylistOrder.length;
        this.isMenuMusicPlaying = false;
        this.playMenuTrack();
      }
    };
  }

  public stopMenuMusic(): void {
    if (this.menuSource) {
      try { this.menuSource.stop(); this.menuSource.disconnect(); } catch {}
      this.menuSource = null;
    }
    this.isMenuMusicPlaying = false;
  }

  // =========================================================================
  // Sound Effects (SFX) Dispatcher & Group Routing
  // =========================================================================

  public playSFX(name: string, volumeScale: number = 1.0, pitchVariation: number = 0.04): void {
    const sfxVol = (typeof state !== 'undefined' && state?.sfxVolume != null) ? state.sfxVolume : 50;
    if (sfxVol <= 0) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterSFXGain) return;

    const buf = this.soundBuffers.get(name);
    if (!buf) return;

    // Throttling to prevent audio clipping on simultaneous events
    const now = performance.now();
    const lastPlayed = this.sfxCooldowns.get(name) || 0;
    if (now - lastPlayed < 30) {
      return;
    }
    this.sfxCooldowns.set(name, now);

    try {
      const src = ctx.createBufferSource();
      src.buffer = buf;

      // Subtle pitch variation for organic tactile feel
      if (pitchVariation > 0) {
        src.playbackRate.value = 1.0 + (Math.random() * 2 - 1) * pitchVariation;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0, Math.min(2.0, volumeScale)), ctx.currentTime);

      src.connect(gain);
      gain.connect(this.masterSFXGain);

      src.start();

      // Log for Debug Audio HUD
      this.logSFX(name, volumeScale);
    } catch (e) {
      console.warn(`Error playing SFX [${name}]:`, e);
    }
  }

  public triggerLaser(): void {
    this.laserActiveTimer = 160; // Keep alive for ~160ms (smooth across frames)
  }

  public playSFXGroup(
    group:
      | 'block_death'
      | 'enemy_death'
      | 'enemy_death_onwater'
      | 'projectile_hit_enemy'
      | 'projectile_hit_block'
      | 'shoot_light'
      | 'turret_bitten_softbody'
      | 'player_step'
      | 'turret_place'
      | 'punch_hit'
      | 'playerprojectile_hit',
    volumeScale: number = 1.0
  ): void {
    // All SFX are normalized, multiplied by x1.0
    const normalizedVol = volumeScale * 1.0;

    switch (group) {
      case 'block_death': {
        const r = Math.random();
        const choice = r < 0.33 ? 'block_death1' : r < 0.66 ? 'block_death2' : 'block_death3';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'enemy_death': {
        const r = Math.random();
        const choice = r < 0.33 ? 'enemy_death1' : r < 0.66 ? 'enemy_death2' : 'enemy_death3';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'enemy_death_onwater': {
        const choice = Math.random() < 0.5 ? 'enemy_death_onwater1' : 'enemy_death_onwater2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'projectile_hit_enemy': {
        const r = Math.random();
        const choice =
          r < 0.2
            ? 'projectile_hit_enemy1'
            : r < 0.4
            ? 'projectile_hit_enemy2'
            : r < 0.6
            ? 'projectile_hit_enemy3'
            : r < 0.8
            ? 'projectile_hit_enemy4'
            : 'projectile_hit_enemy5';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'projectile_hit_block': {
        const r = Math.random();
        const choice = r < 0.33 ? 'projectile_hit_block1' : r < 0.66 ? 'projectile_hit_block2' : 'projectile_hit_block3';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'shoot_light': {
        const choice = Math.random() < 0.5 ? 'shoot_light_1' : 'shoot_light_2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'turret_bitten_softbody': {
        const choice = Math.random() < 0.5 ? 'turret_bitten_softbody1' : 'turret_bitten_softbody2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'player_step': {
        const now = performance.now();
        if (now - this.lastStepTime < 240) return; // ~4 steps per second max
        this.lastStepTime = now;
        const key = `step${this.stepSequenceIndex}`;
        this.stepSequenceIndex = (this.stepSequenceIndex % 4) + 1;
        this.playSFX(key, normalizedVol, 0.05);
        break;
      }
      case 'turret_place': {
        const choice = Math.random() < 0.5 ? 'turret_place' : 'turret_place_2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'punch_hit': {
        const choice = Math.random() < 0.5 ? 'punch_hit_1' : 'punch_hit_2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
      case 'playerprojectile_hit': {
        const choice = Math.random() < 0.5 ? 'playerprojectile_hit1' : 'playerprojectile_hit2';
        this.playSFX(choice, normalizedVol, 0.05);
        break;
      }
    }
  }

  private logSFX(name: string, volume: number): void {
    this.recentSFXLog.unshift({ name, time: Date.now(), volume });
    if (this.recentSFXLog.length > 8) {
      this.recentSFXLog.pop();
    }
  }

  // =========================================================================
  // Per-Frame Update (Dynamic Night Ramping & Audio Graph Modulation)
  // =========================================================================

  public update(deltaTimeMs: number): void {
    const dt = Math.min(deltaTimeMs / 1000, 0.1);
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Laser Loop Continuous Management
    if (this.laserActiveTimer > 0) {
      this.laserActiveTimer -= deltaTimeMs;
      if (!this.laserSource && ctx.state === 'running') {
        const laserBuf = this.soundBuffers.get('laser_loop');
        if (laserBuf && this.masterSFXGain) {
          try {
            this.laserGain = ctx.createGain();
            this.laserGain.gain.setValueAtTime(0.01, ctx.currentTime);
            this.laserGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.05);

            this.laserSource = ctx.createBufferSource();
            this.laserSource.buffer = laserBuf;
            this.laserSource.loop = true;
            this.laserSource.connect(this.laserGain);
            this.laserGain.connect(this.masterSFXGain);
            this.laserSource.start();
          } catch (e) {
            console.warn('Error starting laser loop:', e);
          }
        }
      } else if (this.laserGain) {
        this.laserGain.gain.setValueAtTime(1.0, ctx.currentTime);
      }
    } else {
      if (this.laserGain && this.laserSource) {
        try {
          this.laserGain.gain.setValueAtTime(this.laserGain.gain.value, ctx.currentTime);
          this.laserGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          const oldSrc = this.laserSource;
          const oldGain = this.laserGain;
          setTimeout(() => {
            try {
              oldSrc.stop();
              oldSrc.disconnect();
              oldGain.disconnect();
            } catch {}
          }, 90);
        } catch {}
        this.laserSource = null;
        this.laserGain = null;
      }
    }

    // Pause Menu Music Fade Out / In
    const isPauseFadeOut = Boolean(state.isPauseMenuOpen && (state.currentScreen === 'game' || state.currentScreen === 'main_menu'));
    if (isPauseFadeOut) {
      this.pauseFadeVolume = Math.max(0.0, this.pauseFadeVolume - dt / 0.5);
    } else {
      this.pauseFadeVolume = Math.min(1.0, this.pauseFadeVolume + dt / 0.5);
    }

    const baseMusicVol = (typeof state !== 'undefined' && state?.musicVolume != null) ? state.musicVolume : 50;
    const effectiveMusicVol = (baseMusicVol / 100) * this.pauseFadeVolume;
    if (this.masterMusicGain) {
      this.masterMusicGain.gain.setValueAtTime(effectiveMusicVol, ctx.currentTime);
    }

    // Screen-based Music Routing
    if (state.currentScreen === 'main_menu') {
      if (this.isMusicPlaying) {
        this.stopIngameTracks();
      }
      if (!this.isMenuMusicPlaying) {
        this.playMenuTrack();
      }
      return;
    }

    if (state.currentScreen === 'level_editor') {
      if (this.isMusicPlaying) this.stopIngameTracks();
      if (this.isMenuMusicPlaying) this.stopMenuMusic();
      return;
    }

    // In-Game Screen
    if (state.currentScreen === 'game') {
      if (this.isMenuMusicPlaying) {
        this.stopMenuMusic();
      }
      if (!this.isMusicPlaying || !this.baseSource) {
        this.playSyncedIngamePair(this.currentIngameTrackIndex);
      }

      // Check In-Game Time & Night State:
      // - 19.5h (19:30): "THE NIGHT IS APPROACHING" warning starts
      // - Night continues until morning (6:00am)
      // - Daytime LOS Check throttled every 0.5 in-game hours (300 frames) to minimize CPU overhead:
      //   Counts only enemies with a clear Line of Sight (LOS) to their target
      const musicCheckInterval = 0.5 * HOUR_FRAMES;
      if (this.lastMusicCheckFrame < 0 || state.frames - this.lastMusicCheckFrame >= musicCheckInterval || state.frames < this.lastMusicCheckFrame) {
        this.lastMusicCheckFrame = state.frames;
        const currentDayFrames = state.frames % (24 * HOUR_FRAMES);
        const currentHour = currentDayFrames / HOUR_FRAMES;
        const isNightApproachingOrNight = currentDayFrames >= (19.5 * HOUR_FRAMES) || currentHour < 6;

        if (isNightApproachingOrNight) {
          this.isNightTenseActive = true;
        } else {
          // Daytime (6:00am to 19:30)
          let losEnemyCount = 0;
          if (state.enemies && state.world) {
            for (let i = 0; i < state.enemies.length; i++) {
              const enemy = state.enemies[i];
              if (!enemy || enemy.isDying) continue;
              const target = enemy.target || state.player;
              if (!target) continue;
              const targetPos = target.getWorldPos ? target.getWorldPos() : target.pos;
              if (!targetPos) continue;
              if (enemy.isFlying || state.world.checkLOS(enemy.pos.x, enemy.pos.y, targetPos.x, targetPos.y)) {
                losEnemyCount++;
              }
            }
          }

          if (losEnemyCount < 10) {
            this.isNightTenseActive = false;
          } else {
            // If 10+ enemies with clear LOS remain during daytime/dawn, retain tense percussion until swarm is cleared
            this.isNightTenseActive = true;
          }
        }
      }

      // Dynamic Volume Ramping:
      // - If tense is active: ramp up percussion in 4s (+0.25/s), ramp down birds in 4s
      // - If tense is inactive: fade out percussion in 8s (-0.125/s), ramp up birds in 8s
      if (this.isNightTenseActive) {
        this.tenseVolume = Math.min(1.0, this.tenseVolume + dt / 4.0);
        this.birdsVolume = Math.max(0.0, this.birdsVolume - dt / 4.0);
      } else {
        this.tenseVolume = Math.max(0.0, this.tenseVolume - dt / 8.0);
        this.birdsVolume = Math.min(1.0, this.birdsVolume + dt / 8.0);
      }

      // Update Web Audio Gain Nodes smoothly
      if (this.tenseGain) {
        this.tenseGain.gain.setValueAtTime(this.tenseVolume, ctx.currentTime);
      }
      if (this.birdsGain) {
        this.birdsGain.gain.setValueAtTime(this.birdsVolume * 0.7, ctx.currentTime);
      }
    }
  }

  // =========================================================================
  // Volume Controls & State Sync
  // =========================================================================

  public setMusicVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, volume));
    if (typeof state !== 'undefined' && state) {
      state.musicVolume = clamped;
    }
    try {
      localStorage.setItem('grapeshooter_music_volume', clamped.toString());
    } catch {}

    if (this.masterMusicGain && this.audioCtx) {
      this.masterMusicGain.gain.setValueAtTime((clamped / 100) * this.pauseFadeVolume, this.audioCtx.currentTime);
    }
  }

  public setSfxVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, volume));
    if (typeof state !== 'undefined' && state) {
      state.sfxVolume = clamped;
    }
    try {
      localStorage.setItem('grapeshooter_sfx_volume', clamped.toString());
    } catch {}

    if (this.masterSFXGain && this.audioCtx) {
      this.masterSFXGain.gain.setValueAtTime(clamped / 100, this.audioCtx.currentTime);
    }
  }

  // =========================================================================
  // Diagnostics & Debug Info Getters
  // =========================================================================

  public getDebugInfo() {
    const ctx = this.audioCtx;
    const hasState = typeof state !== 'undefined' && state;
    return {
      ctxState: ctx ? ctx.state : 'uninitialized',
      buffersLoaded: `${this.soundBuffers.size} / ${this.totalToPreload}`,
      activeScreen: hasState ? state.currentScreen : 'unknown',
      musicPlaying: this.isMusicPlaying ? `ingame${this.currentIngameTrackIndex} + ingame${this.currentIngameTrackIndex}b (Synced 0ms)` : (this.isMenuMusicPlaying ? `menu${this.currentMenuTrackIndex}` : 'None'),
      tenseVolume: this.tenseVolume,
      birdsVolume: this.birdsVolume,
      musicVolume: hasState ? state.musicVolume : 50,
      sfxVolume: hasState ? state.sfxVolume : 50,
      recentSFX: this.recentSFXLog
    };
  }

  public getTenseMultiplier(): number {
    return this.tenseVolume;
  }

  public getBirdsMultiplier(): number {
    return this.birdsVolume;
  }
}

export const soundEngine = SoundEngine.getInstance();

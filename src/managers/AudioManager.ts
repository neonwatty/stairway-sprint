import Phaser from 'phaser';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicMuted: boolean;
  sfxMuted: boolean;
}

export class AudioManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private backgroundMusic?: Phaser.Sound.BaseSound;
  private sounds: Map<string, Phaser.Sound.BaseSound[]> = new Map();
  private settings: AudioSettings;
  private musicFadeTween?: Phaser.Tweens.Tween;
  private currentMusicKey?: string;
  
  // Audio pool settings
  private maxSoundsPerType = 3;
  private soundCooldowns: Map<string, number> = new Map();
  private cooldownDuration = 50; // ms between same sound plays
  
  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    
    // Load settings from localStorage or use defaults
    this.settings = this.loadSettings();
    
    // Initialize sound pools
    this.initializeSoundPools();
  }
  
  private loadSettings(): AudioSettings {
    const savedSettings = localStorage.getItem('audioSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    
    return {
      masterVolume: 1.0,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      musicMuted: false,
      sfxMuted: false
    };
  }
  
  public saveSettings(): void {
    localStorage.setItem('audioSettings', JSON.stringify(this.settings));
  }
  
  private initializeSoundPools(): void {
    // Create sound pools for frequently used effects
    const pooledSounds = [
      'sfx-collect',
      'sfx-hit',
      'sfx-shoot',
      'sfx-powerup'
    ];
    
    pooledSounds.forEach(key => {
      if (this.scene.cache.audio.exists(key)) {
        const pool: Phaser.Sound.BaseSound[] = [];
        for (let i = 0; i < this.maxSoundsPerType; i++) {
          const sound = this.scene.sound.add(key);
          pool.push(sound);
        }
        this.sounds.set(key, pool);
      }
    });
  }
  
  /**
   * Play background music with optional fade-in
   */
  public playBackgroundMusic(key: string, fadeIn: boolean = true): void {
    if (this.currentMusicKey === key && this.backgroundMusic?.isPlaying) {
      return; // Already playing this music
    }
    
    // Check if audio exists in cache
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Audio key "${key}" not found in cache - skipping background music`);
      return;
    }
    
    // Stop current music if playing
    if (this.backgroundMusic?.isPlaying) {
      this.stopBackgroundMusic(fadeIn);
    }
    
    // Create new background music
    this.backgroundMusic = this.scene.sound.add(key, {
      loop: true,
      volume: 0
    });
    
    this.currentMusicKey = key;
    const targetVolume = this.getMusicVolume();
    
    if (fadeIn && targetVolume > 0) {
      this.backgroundMusic.play();
      this.musicFadeTween = this.scene.tweens.add({
        targets: this.backgroundMusic,
        volume: targetVolume,
        duration: 1000,
        ease: 'Power2'
      });
    } else {
      this.backgroundMusic.play({ volume: targetVolume });
    }
  }
  
  /**
   * Stop background music with optional fade-out
   */
  public stopBackgroundMusic(fadeOut: boolean = true): void {
    if (!this.backgroundMusic || !this.backgroundMusic.isPlaying) return;
    
    // Cancel any existing fade tween
    if (this.musicFadeTween) {
      this.musicFadeTween.stop();
    }
    
    if (fadeOut) {
      this.musicFadeTween = this.scene.tweens.add({
        targets: this.backgroundMusic,
        volume: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => {
          this.backgroundMusic?.stop();
          this.currentMusicKey = undefined;
        }
      });
    } else {
      this.backgroundMusic.stop();
      this.currentMusicKey = undefined;
    }
  }
  
  /**
   * Pause background music
   */
  public pauseMusic(): void {
    this.backgroundMusic?.pause();
  }
  
  /**
   * Resume background music
   */
  public resumeMusic(): void {
    this.backgroundMusic?.resume();
  }
  
  /**
   * Play a sound effect
   */
  public playSound(key: string, volumeMultiplier: number = 1.0): void {
    if (this.settings.sfxMuted) return;
    
    // Check cooldown
    const lastPlayed = this.soundCooldowns.get(key) || 0;
    const now = Date.now();
    if (now - lastPlayed < this.cooldownDuration) {
      return; // Too soon to play this sound again
    }
    
    const volume = this.getSFXVolume() * volumeMultiplier;
    if (volume <= 0) return;
    
    // Try to get from pool first
    const pool = this.sounds.get(key);
    if (pool) {
      // Find an available sound in the pool
      const availableSound = pool.find(sound => !sound.isPlaying);
      if (availableSound) {
        availableSound.play({ volume });
        this.soundCooldowns.set(key, now);
      }
    } else {
      // Fallback to creating a new sound
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, { volume });
        this.soundCooldowns.set(key, now);
      }
    }
  }
  
  /**
   * Play a sound with spatial positioning
   */
  public playSpatialSound(key: string, x: number, y: number, maxDistance: number = 400): void {
    const camera = this.scene.cameras.main;
    const centerX = camera.centerX;
    const centerY = camera.centerY;
    
    // Calculate distance from camera center
    const distance = Phaser.Math.Distance.Between(centerX, centerY, x, y);
    
    // Calculate volume based on distance
    const volumeMultiplier = Math.max(0, 1 - (distance / maxDistance));
    
    if (volumeMultiplier > 0) {
      this.playSound(key, volumeMultiplier);
    }
  }
  
  /**
   * Change music based on game state/difficulty
   */
  public playAdaptiveMusic(difficulty: number): void {
    // Map difficulty levels to music intensity
    let musicKey = 'bgm-main';
    
    if (difficulty >= 5) {
      musicKey = 'bgm-intense'; // Would need to add this asset
    } else if (difficulty >= 3) {
      musicKey = 'bgm-main';
    } else {
      musicKey = 'bgm-calm'; // Would need to add this asset
    }
    
    // For now, just adjust volume based on difficulty
    const intensityMultiplier = 0.7 + (difficulty * 0.06);
    this.setMusicVolume(this.settings.musicVolume * Math.min(1.0, intensityMultiplier));
  }
  
  /**
   * Set master volume (affects all audio)
   */
  public setMasterVolume(volume: number): void {
    this.settings.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.updateVolumes();
    this.saveSettings();
    this.emit('volumeChanged', 'master', this.settings.masterVolume);
  }
  
  /**
   * Set music volume
   */
  public setMusicVolume(volume: number): void {
    this.settings.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.backgroundMusic) {
      (this.backgroundMusic as any).setVolume(this.getMusicVolume());
    }
    this.saveSettings();
    this.emit('volumeChanged', 'music', this.settings.musicVolume);
  }
  
  /**
   * Set sound effects volume
   */
  public setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveSettings();
    this.emit('volumeChanged', 'sfx', this.settings.sfxVolume);
  }
  
  /**
   * Toggle music mute
   */
  public toggleMusicMute(): void {
    this.settings.musicMuted = !this.settings.musicMuted;
    if (this.backgroundMusic) {
      (this.backgroundMusic as any).setVolume(this.getMusicVolume());
    }
    this.saveSettings();
    this.emit('muteChanged', 'music', this.settings.musicMuted);
  }
  
  /**
   * Toggle sound effects mute
   */
  public toggleSFXMute(): void {
    this.settings.sfxMuted = !this.settings.sfxMuted;
    this.saveSettings();
    this.emit('muteChanged', 'sfx', this.settings.sfxMuted);
  }
  
  /**
   * Get current music volume (considering master and mute)
   */
  private getMusicVolume(): number {
    if (this.settings.musicMuted) return 0;
    return this.settings.masterVolume * this.settings.musicVolume;
  }
  
  /**
   * Get current SFX volume (considering master and mute)
   */
  private getSFXVolume(): number {
    if (this.settings.sfxMuted) return 0;
    return this.settings.masterVolume * this.settings.sfxVolume;
  }
  
  /**
   * Update all active sound volumes
   */
  private updateVolumes(): void {
    // Update background music
    if (this.backgroundMusic) {
      (this.backgroundMusic as any).setVolume(this.getMusicVolume());
    }
    
    // Update pooled sounds (they'll use new volume on next play)
  }
  
  /**
   * Get current audio settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopBackgroundMusic(false);
    
    // Destroy pooled sounds
    this.sounds.forEach(pool => {
      pool.forEach(sound => sound.destroy());
    });
    this.sounds.clear();
    
    this.removeAllListeners();
  }
}
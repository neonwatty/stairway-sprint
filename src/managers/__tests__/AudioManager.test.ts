import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AudioManager } from '../AudioManager';
import { mockPhaser } from '../../test/mocks/phaser.mock';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Math: {
      Clamp: vi.fn((value, min, max) => Math.max(min, Math.min(max, value))),
      Distance: {
        Between: vi.fn((x1, y1, x2, y2) => {
          const dx = x2 - x1;
          const dy = y2 - y1;
          return Math.sqrt(dx * dx + dy * dy);
        })
      }
    },
    Events: {
      EventEmitter: class MockEventEmitter {
        private listeners: Map<string, Function[]> = new Map();
        
        on(event: string, callback: Function) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
          }
          this.listeners.get(event)!.push(callback);
          return this;
        }
        
        off(event: string, callback?: Function) {
          if (callback && this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
              callbacks.splice(index, 1);
            }
          } else {
            this.listeners.delete(event);
          }
          return this;
        }
        
        emit(event: string, ...args: any[]) {
          if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(callback => callback(...args));
          }
          return this;
        }
        
        removeAllListeners(event?: string) {
          if (event) {
            this.listeners.delete(event);
          } else {
            this.listeners.clear();
          }
          return this;
        }
      }
    }
  }
}));

describe('AudioManager', () => {
  let audioManager: AudioManager;
  let mockScene: any;
  let mockSound: any;
  let currentMusicInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock sound instance
    mockSound = {
      play: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      setVolume: vi.fn(),
      destroy: vi.fn(),
      isPlaying: false
    };
    
    // Create base mock scene
    mockScene = new mockPhaser.Scene();
    mockScene.sound = {
      add: vi.fn(() => ({ ...mockSound })),
      get: vi.fn(),
      play: vi.fn()
    };
    mockScene.cache = {
      audio: {
        exists: vi.fn((key) => ['sfx-collect', 'sfx-hit', 'sfx-shoot', 'sfx-powerup'].includes(key)),
        get: vi.fn(),
        add: vi.fn()
      }
    };
    mockScene.tweens = {
      add: vi.fn().mockReturnValue({ stop: vi.fn() }),
      addCounter: vi.fn()
    };
    mockScene.time = {
      delayedCall: vi.fn()
    };
    mockScene.cameras = {
      main: {
        centerX: 320,
        centerY: 480
      }
    };
    
    // Default localStorage return value
    localStorageMock.getItem.mockReturnValue(null);
    
    audioManager = new AudioManager(mockScene);
  });

  afterEach(() => {
    audioManager.destroy();
  });

  describe('initialization', () => {
    it('should create audio manager with default settings', () => {
      expect(audioManager).toBeDefined();
      const settings = audioManager.getSettings();
      expect(settings.masterVolume).toBe(1.0);
      expect(settings.musicVolume).toBe(0.5);
      expect(settings.sfxVolume).toBe(0.7);
      expect(settings.musicMuted).toBe(false);
      expect(settings.sfxMuted).toBe(false);
    });

    it('should load settings from localStorage if available', () => {
      const savedSettings = {
        masterVolume: 0.8,
        musicVolume: 0.6,
        sfxVolume: 0.5,
        musicMuted: true,
        sfxMuted: false
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      const newAudioManager = new AudioManager(mockScene);
      const settings = newAudioManager.getSettings();
      
      expect(settings).toEqual(savedSettings);
      newAudioManager.destroy();
    });

    it('should initialize sound pools for frequently used sounds', () => {
      // Should create 3 instances of each pooled sound
      expect(mockScene.sound.add).toHaveBeenCalledTimes(12); // 4 sounds * 3 instances
    });
  });

  describe('background music', () => {
    it('should play background music with fade in', () => {
      const music = audioManager.playBackgroundMusic('bgm-main', true);
      
      expect(mockScene.sound.add).toHaveBeenCalledWith('bgm-main', {
        loop: true,
        volume: 0
      });
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.any(Object),
          volume: 0.5, // Default music volume
          duration: 1000,
          ease: 'Power2'
        })
      );
    });

    it('should play background music without fade in', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      
      const addCall = mockScene.sound.add.mock.calls.find(
        call => call[0] === 'bgm-main'
      );
      expect(addCall).toBeDefined();
    });

    it('should not replay same music if already playing', () => {
      // First play
      audioManager.playBackgroundMusic('bgm-main', false);
      
      // Find the music instance
      const musicCallIndex = mockScene.sound.add.mock.calls.findIndex(
        call => call[0] === 'bgm-main'
      );
      currentMusicInstance = mockScene.sound.add.mock.results[musicCallIndex].value;
      currentMusicInstance.isPlaying = true;
      
      const initialCalls = mockScene.sound.add.mock.calls.length;
      
      // Try to play same music again
      audioManager.playBackgroundMusic('bgm-main', false);
      
      // Should not create new sound instance
      expect(mockScene.sound.add).toHaveBeenCalledTimes(initialCalls);
    });

    it('should stop background music with fade out', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      
      // Find the music instance
      const musicCallIndex = mockScene.sound.add.mock.calls.findIndex(
        call => call[0] === 'bgm-main'
      );
      currentMusicInstance = mockScene.sound.add.mock.results[musicCallIndex].value;
      currentMusicInstance.isPlaying = true;
      
      audioManager.stopBackgroundMusic(true);
      
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          volume: 0,
          duration: 500,
          ease: 'Power2'
        })
      );
    });

    it('should pause and resume music', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      const music = mockScene.sound.add.mock.results.find(
        result => result.value && mockScene.sound.add.mock.calls.find(
          call => call[0] === 'bgm-main'
        )
      )?.value;
      
      audioManager.pauseMusic();
      expect(music.pause).toHaveBeenCalled();
      
      audioManager.resumeMusic();
      expect(music.resume).toHaveBeenCalled();
    });
  });

  describe('sound effects', () => {
    it('should play sound effect', () => {
      audioManager.playSound('sfx-collect');
      
      // Should use pooled sound
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).toHaveBeenCalledWith({ volume: 0.7 });
    });

    it('should play sound effect with volume multiplier', () => {
      audioManager.playSound('sfx-hit', 0.5);
      
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).toHaveBeenCalledWith({ volume: 0.35 }); // 0.7 * 0.5
    });

    it('should not play sound if muted', () => {
      audioManager.toggleSFXMute();
      audioManager.playSound('sfx-collect');
      
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).not.toHaveBeenCalled();
    });

    it('should respect cooldown between same sound plays', () => {
      audioManager.playSound('sfx-shoot');
      audioManager.playSound('sfx-shoot'); // Too soon
      
      // Only first call should play
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).toHaveBeenCalledTimes(1);
    });

    it('should play spatial sound based on distance', () => {
      // Sound at same position as camera center
      audioManager.playSpatialSound('sfx-collect', 320, 480, 400);
      
      // Distance is 0, so volume multiplier is 1.0
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).toHaveBeenCalledWith({ volume: 0.7 }); // 0.7 * 1.0
    });

    it('should not play spatial sound if too far', () => {
      // Sound very far from camera center (320, 480)
      audioManager.playSpatialSound('sfx-collect', 1000, 1500, 400);
      
      // Distance > maxDistance, should not play
      const pooledSound = mockScene.sound.add.mock.results[0].value;
      expect(pooledSound.play).not.toHaveBeenCalled();
    });
  });

  describe('volume controls', () => {
    it('should set master volume', () => {
      audioManager.setMasterVolume(0.8);
      
      expect(audioManager.getSettings().masterVolume).toBe(0.8);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'audioSettings',
        expect.stringContaining('"masterVolume":0.8')
      );
    });

    it('should set music volume', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      audioManager.setMusicVolume(0.3);
      
      expect(audioManager.getSettings().musicVolume).toBe(0.3);
      const music = mockScene.sound.add.mock.results.find(
        result => result.value && mockScene.sound.add.mock.calls.find(
          call => call[0] === 'bgm-main'
        )
      )?.value;
      expect(music.setVolume).toHaveBeenCalledWith(0.3); // 1.0 * 0.3
    });

    it('should set SFX volume', () => {
      audioManager.setSFXVolume(0.5);
      
      expect(audioManager.getSettings().sfxVolume).toBe(0.5);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should clamp volume values', () => {
      audioManager.setMasterVolume(-0.5);
      expect(audioManager.getSettings().masterVolume).toBe(0);
      
      audioManager.setMasterVolume(1.5);
      expect(audioManager.getSettings().masterVolume).toBe(1);
    });
  });

  describe('mute functionality', () => {
    it('should toggle music mute', () => {
      audioManager.toggleMusicMute();
      expect(audioManager.getSettings().musicMuted).toBe(true);
      
      audioManager.toggleMusicMute();
      expect(audioManager.getSettings().musicMuted).toBe(false);
    });

    it('should toggle SFX mute', () => {
      audioManager.toggleSFXMute();
      expect(audioManager.getSettings().sfxMuted).toBe(true);
      
      audioManager.toggleSFXMute();
      expect(audioManager.getSettings().sfxMuted).toBe(false);
    });

    it('should update music volume when muted', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      const music = mockScene.sound.add.mock.results.find(
        result => result.value && mockScene.sound.add.mock.calls.find(
          call => call[0] === 'bgm-main'
        )
      )?.value;
      
      audioManager.toggleMusicMute();
      expect(music.setVolume).toHaveBeenCalledWith(0);
    });
  });

  describe('adaptive music', () => {
    it('should adjust volume based on difficulty', () => {
      // Reset music volume to default
      audioManager.setMusicVolume(0.5);
      
      // Difficulty 1: intensity = 0.7 + (1 * 0.06) = 0.76
      // Volume = 0.5 * 0.76 = 0.38
      audioManager.playAdaptiveMusic(1);
      const volumeAfterDifficulty1 = audioManager.getSettings().musicVolume;
      expect(volumeAfterDifficulty1).toBeCloseTo(0.38);
      
      // Reset volume before testing higher difficulty
      audioManager.setMusicVolume(0.5);
      
      // Difficulty 5: intensity = 0.7 + (5 * 0.06) = 1.0 (clamped)
      // Volume = 0.5 * 1.0 = 0.5
      audioManager.playAdaptiveMusic(5);
      const volumeAfterDifficulty5 = audioManager.getSettings().musicVolume;
      expect(volumeAfterDifficulty5).toBeCloseTo(0.5);
      
      // Higher difficulty should result in higher volume (up to max of 1.0)
      expect(volumeAfterDifficulty5).toBeGreaterThan(volumeAfterDifficulty1);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('should emit volume changed events', () => {
      const volumeChangeSpy = vi.fn();
      audioManager.on('volumeChanged', volumeChangeSpy);
      
      audioManager.setMasterVolume(0.8);
      expect(volumeChangeSpy).toHaveBeenCalledWith('master', 0.8);
      
      audioManager.setMusicVolume(0.6);
      expect(volumeChangeSpy).toHaveBeenCalledWith('music', 0.6);
      
      audioManager.setSFXVolume(0.4);
      expect(volumeChangeSpy).toHaveBeenCalledWith('sfx', 0.4);
    });

    it('should emit mute changed events', () => {
      const muteChangeSpy = vi.fn();
      audioManager.on('muteChanged', muteChangeSpy);
      
      audioManager.toggleMusicMute();
      expect(muteChangeSpy).toHaveBeenCalledWith('music', true);
      
      audioManager.toggleSFXMute();
      expect(muteChangeSpy).toHaveBeenCalledWith('sfx', true);
    });
  });

  describe('cleanup', () => {
    it('should destroy all resources', () => {
      audioManager.playBackgroundMusic('bgm-main', false);
      
      const music = mockScene.sound.add.mock.results.find(
        result => result.value && mockScene.sound.add.mock.calls.find(
          call => call[0] === 'bgm-main'
        )
      )?.value;
      
      audioManager.destroy();
      
      expect(music.destroy).toHaveBeenCalled();
      
      // Check pooled sounds are destroyed
      const pooledSounds = mockScene.sound.add.mock.results.slice(0, 12);
      pooledSounds.forEach(result => {
        expect(result.value.destroy).toHaveBeenCalled();
      });
    });
  });
});
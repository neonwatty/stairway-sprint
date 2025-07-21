import { vi } from 'vitest';

const mockPhaser = {
  Scene: class MockScene {
    add = {
      text: vi.fn().mockReturnValue({
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        setOrigin: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      image: vi.fn().mockReturnValue({
        setScale: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setTexture: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      graphics: vi.fn().mockReturnValue({
        clear: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      particles: vi.fn().mockReturnValue({
        destroy: vi.fn(),
      }),
    };
    
    tweens = {
      add: vi.fn().mockReturnValue({}),
      killAll: vi.fn(),
      killTweensOf: vi.fn(),
    };
    
    time = {
      delayedCall: vi.fn((delay, callback) => {
        setTimeout(callback, delay);
        return { destroy: vi.fn() };
      }),
      removeAllEvents: vi.fn(),
      now: Date.now(),
    };
    
    cameras = {
      main: {
        width: 640,
        height: 960,
        shake: vi.fn(),
        flash: vi.fn(),
        fadeIn: vi.fn(),
        resetFX: vi.fn(),
      },
    };
    
    events = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    
    scene = {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      launch: vi.fn(),
      get: vi.fn(),
    };
    
    data = {
      set: vi.fn(),
      get: vi.fn(),
    };
    
    physics = {
      pause: vi.fn(),
      resume: vi.fn(),
      add: {
        existing: vi.fn(),
        group: vi.fn().mockReturnValue({
          add: vi.fn(),
          get: vi.fn(),
          remove: vi.fn(),
          destroy: vi.fn(),
        }),
        overlap: vi.fn(),
        collider: vi.fn(),
      },
    };
  },
  
  Events: {
    EventEmitter: class MockEventEmitter {
      on = vi.fn();
      off = vi.fn();
      emit = vi.fn();
      removeAllListeners = vi.fn();
    },
  },
  
  GameObjects: {
    Sprite: class MockSprite {
      x = 0;
      y = 0;
      setDepth = vi.fn().mockReturnThis();
      setScale = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
    
    Group: class MockGroup {
      add = vi.fn();
      remove = vi.fn();
      get = vi.fn();
      destroy = vi.fn();
      children = { entries: [] };
    },
    
    Text: class MockText {
      setText = vi.fn().mockReturnThis();
      setScrollFactor = vi.fn().mockReturnThis();
      setDepth = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
    
    Image: class MockImage {
      setTexture = vi.fn().mockReturnThis();
      setScale = vi.fn().mockReturnThis();
      setAlpha = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
  },
  
  Math: {
    Between: vi.fn((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
    RND: {
      pick: vi.fn((array) => array[0]),
    },
    Distance: {
      Between: vi.fn(() => 100),
    },
  },
  
  Time: {
    TimerEvent: class MockTimerEvent {
      paused = false;
      destroy = vi.fn();
    },
  },
  
  Tweens: {
    TweenManager: class MockTweenManager {
      add = vi.fn();
      killAll = vi.fn();
    },
  },
  
  Input: {
    Keyboard: {
      KeyCodes: {
        SPACE: 32,
        ESC: 27,
        LEFT: 37,
        RIGHT: 39,
        UP: 38,
        DOWN: 40,
        P: 80,
        D: 68,
      },
    },
  },
};

export { mockPhaser };
export default mockPhaser;
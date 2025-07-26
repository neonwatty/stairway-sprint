import { vi } from 'vitest';

const mockPhaser = {
  Scene: class MockScene {
    add = {
      existing: vi.fn((gameObject) => gameObject),
      text: vi.fn((x, y, text, style) => {
        const mockText = {
          x,
          y,
          text,
          style,
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setText: vi.fn().mockImplementation(function(newText) {
            this.text = newText;
            return this;
          }),
          setOrigin: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setStyle: vi.fn().mockReturnThis(),
          setFontSize: vi.fn().mockReturnThis(),
          setStroke: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          clearTint: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setX: vi.fn().mockReturnThis(),
          setY: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          setColor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
          removeAllListeners: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return mockText;
      }),
      image: vi.fn((x, y, texture) => {
        const mockImage = {
          x,
          y,
          texture,
          setScale: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setTexture: vi.fn().mockImplementation(function(newTexture) {
            this.texture = newTexture;
            return this;
          }),
          setAlpha: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          setX: vi.fn().mockReturnThis(),
          setY: vi.fn().mockReturnThis(),
          setPosition: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
          removeAllListeners: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return mockImage;
      }),
      graphics: vi.fn().mockReturnValue({
        clear: vi.fn().mockReturnThis(),
        lineStyle: vi.fn().mockReturnThis(),
        strokeCircle: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setStrokeStyle: vi.fn().mockReturnThis(),
        setAlpha: vi.fn().mockReturnThis(),
        fillStyle: vi.fn().mockReturnThis(),
        fillRect: vi.fn().mockReturnThis(),
        fillRoundedRect: vi.fn().mockReturnThis(),
        strokeRect: vi.fn().mockReturnThis(),
        strokeRoundedRect: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      }),
      rectangle: vi.fn((x, y, width, height, color) => {
        const mockRectangle = {
          x,
          y,
          width,
          height,
          color,
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setBlendMode: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockImplementation(function() {
            this.interactive = true;
            return this;
          }),
          setStrokeStyle: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          on: vi.fn().mockReturnThis(),
          off: vi.fn().mockReturnThis(),
          emit: vi.fn().mockReturnThis(),
          removeAllListeners: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          interactive: false,
        };
        return mockRectangle;
      }),
      star: vi.fn((x, y, points, innerRadius, outerRadius, fillColor) => {
        const mockStar = {
          x,
          y,
          points,
          innerRadius,
          outerRadius,
          fillColor,
          type: 'Star',
          setDepth: vi.fn().mockReturnThis(),
          setScale: vi.fn().mockReturnThis(),
          setTint: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return mockStar;
      }),
      line: vi.fn((x, y, x1, y1, x2, y2, color) => {
        const mockLine = {
          x,
          y,
          x1,
          y1,
          x2,
          y2,
          color,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        return mockLine;
      }),
      particles: vi.fn((x, y, texture, config) => {
        const emitter = {
          destroy: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          setPosition: vi.fn(),
        };
        // Simulate particle emission completion
        if (config && config.lifespan) {
          setTimeout(() => {
            emitter.destroy();
          }, config.lifespan);
        }
        return emitter;
      }),
      postFX: {
        addColorMatrix: vi.fn().mockReturnValue({
          colorMatrix: [],
          destroy: vi.fn(),
        }),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      group: vi.fn((config) => {
        return {
          add: vi.fn(),
          get: vi.fn(),
          remove: vi.fn(),
          destroy: vi.fn(),
          children: { entries: [] },
          runChildUpdate: config?.runChildUpdate || false
        };
      }),
    };
    
    tweens = {
      add: vi.fn().mockReturnValue({}),
      addCounter: vi.fn().mockReturnValue({}),
      killAll: vi.fn(),
      killTweensOf: vi.fn(),
    };
    
    time = {
      delayedCall: vi.fn((delay, callback) => {
        setTimeout(callback, delay);
        return { destroy: vi.fn() };
      }),
      addEvent: vi.fn((config) => {
        const timer = {
          destroy: vi.fn(),
          remove: vi.fn(),
          paused: false,
          repeatCount: config.repeat || 0
        };
        if (config.callback) {
          if (config.loop) {
            setInterval(config.callback, config.delay);
          } else {
            setTimeout(config.callback, config.delay);
          }
        }
        return timer;
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
        fadeOut: vi.fn(),
        resetFX: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
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
    
    input = {
      keyboard: {
        on: vi.fn(),
        off: vi.fn(),
        removeAllListeners: vi.fn(),
        addKey: vi.fn((key) => ({
          on: vi.fn(),
          off: vi.fn(),
          removeAllListeners: vi.fn(),
        })),
        createCursorKeys: vi.fn(() => ({
          left: { isDown: false, on: vi.fn(), off: vi.fn() },
          right: { isDown: false, on: vi.fn(), off: vi.fn() },
          up: { isDown: false, on: vi.fn(), off: vi.fn() },
          down: { isDown: false, on: vi.fn(), off: vi.fn() },
        })),
      },
      on: vi.fn(),
      off: vi.fn(),
      enabled: true,
    };
    
    game = {
      renderer: {
        pipelines: {
          addPostPipeline: vi.fn(),
          removePostPipeline: vi.fn(),
          get: vi.fn(),
        },
      },
    };
    
    cache = {
      audio: {
        exists: vi.fn(() => false),
        get: vi.fn(),
        add: vi.fn()
      }
    };
    
    sound = {
      add: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        setVolume: vi.fn(),
        destroy: vi.fn(),
        isPlaying: false
      })),
      get: vi.fn(),
      play: vi.fn(),
      stopAll: vi.fn(),
      pauseAll: vi.fn(),
      resumeAll: vi.fn()
    };
  },
  
  Events: {
    EventEmitter: class MockEventEmitter {
      private listeners: Map<string, Function[]> = new Map();
      
      on = vi.fn((event: string, callback: Function) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
        return this;
      });
      
      off = vi.fn((event: string, callback?: Function) => {
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
      });
      
      emit = vi.fn((event: string, ...args: any[]) => {
        if (this.listeners.has(event)) {
          this.listeners.get(event)!.forEach(callback => callback(...args));
        }
        return this;
      });
      
      removeAllListeners = vi.fn((event?: string) => {
        if (event) {
          this.listeners.delete(event);
        } else {
          this.listeners.clear();
        }
        return this;
      });
    },
  },
  
  GameObjects: {
    Sprite: class MockSprite {
      x = 0;
      y = 0;
      texture = '';
      setDepth = vi.fn().mockReturnThis();
      setScale = vi.fn().mockReturnThis();
      setTexture = vi.fn().mockReturnThis();
      setInteractive = vi.fn().mockReturnThis();
      setTint = vi.fn().mockReturnThis();
      setAlpha = vi.fn().mockReturnThis();
      setVisible = vi.fn().mockReturnThis();
      setPosition = vi.fn().mockReturnThis();
      on = vi.fn().mockReturnThis();
      off = vi.fn().mockReturnThis();
      emit = vi.fn().mockReturnThis();
      removeAllListeners = vi.fn().mockReturnThis();
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
      setStyle = vi.fn().mockReturnThis();
      setInteractive = vi.fn().mockReturnThis();
      on = vi.fn().mockReturnThis();
      off = vi.fn().mockReturnThis();
      emit = vi.fn().mockReturnThis();
      removeAllListeners = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
    
    Image: class MockImage {
      x = 0;
      y = 0;
      texture = '';
      setTexture = vi.fn().mockReturnThis();
      setScale = vi.fn().mockReturnThis();
      setAlpha = vi.fn().mockReturnThis();
      setTint = vi.fn().mockReturnThis();
      setVisible = vi.fn().mockReturnThis();
      setPosition = vi.fn().mockReturnThis();
      setDepth = vi.fn().mockReturnThis();
      setInteractive = vi.fn().mockReturnThis();
      on = vi.fn().mockReturnThis();
      off = vi.fn().mockReturnThis();
      emit = vi.fn().mockReturnThis();
      removeAllListeners = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
    
    Container: class MockContainer {
      list = [];
      x = 0;
      y = 0;
      add = vi.fn().mockImplementation((items) => {
        if (Array.isArray(items)) {
          this.list.push(...items);
        } else {
          this.list.push(items);
        }
        return this;
      });
      remove = vi.fn().mockReturnThis();
      removeAll = vi.fn().mockReturnThis();
      setDepth = vi.fn().mockReturnThis();
      setScrollFactor = vi.fn().mockReturnThis();
      setPosition = vi.fn().mockReturnThis();
      setVisible = vi.fn().mockReturnThis();
      setAlpha = vi.fn().mockReturnThis();
      setInteractive = vi.fn().mockReturnThis();
      on = vi.fn().mockReturnThis();
      off = vi.fn().mockReturnThis();
      emit = vi.fn().mockReturnThis();
      removeAllListeners = vi.fn().mockReturnThis();
      destroy = vi.fn();
    },
  },
  
  Physics: {
    Arcade: {
      Sprite: class MockArcadeSprite {
        x = 0;
        y = 0;
        alpha = 1;
        scene = null;
        body = {
          setVelocity: vi.fn(),
          setSize: vi.fn(),
          setOffset: vi.fn(),
          setImmovable: vi.fn(),
          setCollideWorldBounds: vi.fn()
        };
        anims = {
          create: vi.fn(),
          play: vi.fn()
        };
        constructor(scene, x, y, texture) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.texture = texture;
        }
        setDepth = vi.fn().mockReturnThis();
        setScale = vi.fn().mockReturnThis();
        setTexture = vi.fn().mockReturnThis();
        setPosition = vi.fn().mockReturnThis();
        setInteractive = vi.fn().mockReturnThis();
        setAlpha = vi.fn().mockReturnThis();
        play = vi.fn();
        on = vi.fn().mockReturnThis();
        off = vi.fn().mockReturnThis();
        emit = vi.fn().mockReturnThis();
        removeAllListeners = vi.fn().mockReturnThis();
        destroy = vi.fn();
      },
      Group: class MockArcadeGroup {
        add = vi.fn();
        remove = vi.fn();
        get = vi.fn();
        destroy = vi.fn();
        children = { entries: [] };
      }
    }
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
      JustDown: vi.fn((key) => false),
    },
  },
  
  Display: {
    Color: {
      HexStringToColor: vi.fn((hex) => ({ color: parseInt(hex.replace('#', ''), 16) })),
      IntegerToColor: vi.fn((int) => ({
        red: (int >> 16) & 0xff,
        green: (int >> 8) & 0xff,
        blue: int & 0xff
      })),
      GetColor: vi.fn((r, g, b) => (r << 16) | (g << 8) | b)
    }
  },
  
  BlendModes: {
    COLOR: 16
  },
  
  Geom: {
    Rectangle: Object.assign(
      class MockRectangle {
        constructor(public x: number, public y: number, public width: number, public height: number) {}
      },
      {
        Contains: vi.fn(() => true)
      }
    ),
    Circle: class MockCircle {
      constructor(public x: number, public y: number, public radius: number) {}
    }
  },
  
  Renderer: {
    WebGL: {
      Pipelines: {
        PostFXPipeline: class MockPostFXPipeline {
          constructor() {}
          colorMatrix: number[] = [];
          setColorMatrix(matrix: number[]): this {
            this.colorMatrix = matrix;
            return this;
          }
        }
      }
    }
  },
};

export { mockPhaser };
export default mockPhaser;
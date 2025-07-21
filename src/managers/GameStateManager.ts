import Phaser from 'phaser';

export enum GameState {
  INIT = 'init',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver'
}

export class GameStateManager {
  private scene: Phaser.Scene;
  private currentState: GameState;
  private previousState?: GameState;
  private events: Phaser.Events.EventEmitter;
  private stateHandlers: Map<GameState, () => void>;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.currentState = GameState.INIT;
    this.events = new Phaser.Events.EventEmitter();
    
    this.stateHandlers = new Map([
      [GameState.INIT, this.handleInitState.bind(this)],
      [GameState.PLAYING, this.handlePlayingState.bind(this)],
      [GameState.PAUSED, this.handlePausedState.bind(this)],
      [GameState.GAME_OVER, this.handleGameOverState.bind(this)]
    ]);
    
    this.scene.data.set('gameState', this.currentState);
  }
  
  public changeState(newState: GameState): void {
    if (newState === this.currentState) return;
    
    this.previousState = this.currentState;
    this.currentState = newState;
    this.scene.data.set('gameState', this.currentState);
    
    const handler = this.stateHandlers.get(newState);
    if (handler) {
      handler();
    }
    
    this.events.emit('stateChanged', newState, this.previousState);
  }
  
  public getCurrentState(): GameState {
    return this.currentState;
  }
  
  public getPreviousState(): GameState | undefined {
    return this.previousState;
  }
  
  public isPlaying(): boolean {
    return this.currentState === GameState.PLAYING;
  }
  
  public isPaused(): boolean {
    return this.currentState === GameState.PAUSED;
  }
  
  public isGameOver(): boolean {
    return this.currentState === GameState.GAME_OVER;
  }
  
  public canPause(): boolean {
    return this.currentState === GameState.PLAYING;
  }
  
  public canResume(): boolean {
    return this.currentState === GameState.PAUSED;
  }
  
  public getEvents(): Phaser.Events.EventEmitter {
    return this.events;
  }
  
  private handleInitState(): void {
    this.events.emit('initState');
  }
  
  private handlePlayingState(): void {
    if (this.previousState === GameState.PAUSED) {
      this.scene.physics.resume();
      this.events.emit('gameResumed');
    } else {
      this.events.emit('gameStarted');
    }
  }
  
  private handlePausedState(): void {
    this.scene.physics.pause();
    this.events.emit('gamePaused');
  }
  
  private handleGameOverState(): void {
    this.scene.physics.pause();
    this.events.emit('gameEnded');
  }
  
  public destroy(): void {
    this.events.removeAllListeners();
  }
}
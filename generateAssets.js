import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

function createPlaceholderImage(width, height, color, label) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Add border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Add label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.min(width / label.length * 1.5, height / 3)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add shadow effect
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(label, width / 2, height / 2);

  return canvas.toBuffer('image/png');
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function generateAllAssets() {
  const baseDir = './public/assets';
  
  // Ensure directories exist
  ensureDirectoryExists(path.join(baseDir, 'images/sprites'));
  ensureDirectoryExists(path.join(baseDir, 'images/ui'));
  ensureDirectoryExists(path.join(baseDir, 'images/tiles'));
  ensureDirectoryExists(path.join(baseDir, 'audio'));

  // Generate sprite assets
  const sprites = [
    // Player sprites
    { name: 'player-up.png', width: 60, height: 80, color: '#00FF00', label: 'BABY↑' },
    { name: 'player-down.png', width: 60, height: 80, color: '#00FF00', label: 'BABY↓' },
    { name: 'player-left.png', width: 60, height: 80, color: '#00FF00', label: 'BABY←' },
    { name: 'player-right.png', width: 60, height: 80, color: '#00FF00', label: 'BABY→' },
    
    // Stroller sprites
    { name: 'stroller-1.png', width: 70, height: 90, color: '#8B4513', label: 'STROL-1' },
    { name: 'stroller-2.png', width: 70, height: 90, color: '#A0522D', label: 'STROL-2' },
    { name: 'stroller-3.png', width: 70, height: 90, color: '#8B4513', label: 'STROL-3' },
    
    // Hazards
    { name: 'hazard-lawnmower.png', width: 80, height: 60, color: '#FF0000', label: 'MOWER' },
    { name: 'hazard-crate.png', width: 60, height: 60, color: '#8B4513', label: 'CRATE' },
    { name: 'hazard-trashcan.png', width: 50, height: 70, color: '#555555', label: 'TRASH' },
    
    // Characters
    { name: 'vip.png', width: 60, height: 80, color: '#FFD700', label: 'VIP' },
    { name: 'assassin.png', width: 60, height: 80, color: '#800080', label: 'KILLER' },
    
    // Projectile
    { name: 'projectile.png', width: 20, height: 20, color: '#FFFF00', label: '●' },
    
    // Power-ups
    { name: 'powerup-shield.png', width: 40, height: 40, color: '#00FFFF', label: 'SHIELD' },
    { name: 'powerup-speed.png', width: 40, height: 40, color: '#FF00FF', label: 'SPEED' },
    { name: 'powerup-multi.png', width: 40, height: 40, color: '#FFFF00', label: 'MULTI' },
  ];

  // Generate tiles
  const tiles = [
    { name: 'stair-tile.png', width: 64, height: 64, color: '#666666', label: 'STAIR' },
    { name: 'wall-tile.png', width: 64, height: 64, color: '#333333', label: 'WALL' },
  ];

  // Generate UI elements
  const uiElements = [
    { name: 'heart-full.png', width: 32, height: 32, color: '#FF0000', label: '♥' },
    { name: 'heart-empty.png', width: 32, height: 32, color: '#333333', label: '♡' },
    { name: 'button.png', width: 200, height: 60, color: '#4444FF', label: 'BUTTON' },
    { name: 'pause-icon.png', width: 40, height: 40, color: '#FFFFFF', label: '||' },
    { name: 'play-icon.png', width: 40, height: 40, color: '#FFFFFF', label: '▶' },
  ];

  // Save sprites
  for (const sprite of sprites) {
    const buffer = createPlaceholderImage(sprite.width, sprite.height, sprite.color, sprite.label);
    fs.writeFileSync(path.join(baseDir, 'images/sprites', sprite.name), buffer);
    console.log(`Created: images/sprites/${sprite.name}`);
  }

  // Save tiles
  for (const tile of tiles) {
    const buffer = createPlaceholderImage(tile.width, tile.height, tile.color, tile.label);
    fs.writeFileSync(path.join(baseDir, 'images/tiles', tile.name), buffer);
    console.log(`Created: images/tiles/${tile.name}`);
  }

  // Save UI elements
  for (const ui of uiElements) {
    const buffer = createPlaceholderImage(ui.width, ui.height, ui.color, ui.label);
    fs.writeFileSync(path.join(baseDir, 'images/ui', ui.name), buffer);
    console.log(`Created: images/ui/${ui.name}`);
  }

  // Create placeholder audio files (empty files for now)
  const audioFiles = [
    'bgm-main.mp3',
    'sfx-collect.mp3',
    'sfx-hit.mp3',
    'sfx-shoot.mp3',
    'sfx-powerup.mp3',
    'sfx-gameover.mp3',
  ];

  for (const audio of audioFiles) {
    fs.writeFileSync(path.join(baseDir, 'audio', audio), '');
    console.log(`Created placeholder: audio/${audio}`);
  }

  console.log('\nAll placeholder assets generated successfully!');
}

generateAllAssets().catch(console.error);
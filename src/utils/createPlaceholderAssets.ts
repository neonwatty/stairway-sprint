export function createPlaceholderImage(
  width: number,
  height: number,
  color: string,
  label: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Add border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Add label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.min(width / label.length, height / 3)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, width / 2, height / 2);

  // Add shadow to text for better visibility
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 3;
  ctx.fillText(label, width / 2, height / 2);

  return canvas.toDataURL('image/png');
}

export async function createAllPlaceholderAssets(): Promise<Map<string, string>> {
  const assets = new Map<string, string>();

  // Player sprites (4 directions)
  assets.set('player-up', createPlaceholderImage(60, 80, '#00FF00', 'BABY↑'));
  assets.set('player-down', createPlaceholderImage(60, 80, '#00FF00', 'BABY↓'));
  assets.set('player-left', createPlaceholderImage(60, 80, '#00FF00', 'BABY←'));
  assets.set('player-right', createPlaceholderImage(60, 80, '#00FF00', 'BABY→'));

  // Stroller sprites (animation frames)
  assets.set('stroller-1', createPlaceholderImage(70, 90, '#8B4513', 'STROLLER-1'));
  assets.set('stroller-2', createPlaceholderImage(70, 90, '#A0522D', 'STROLLER-2'));
  assets.set('stroller-3', createPlaceholderImage(70, 90, '#8B4513', 'STROLLER-3'));

  // Hazard sprites (3 types)
  assets.set('hazard-lawnmower', createPlaceholderImage(80, 60, '#FF0000', 'MOWER'));
  assets.set('hazard-crate', createPlaceholderImage(60, 60, '#8B4513', 'CRATE'));
  assets.set('hazard-trashcan', createPlaceholderImage(50, 70, '#555555', 'TRASH'));

  // VIP sprite
  assets.set('vip', createPlaceholderImage(60, 80, '#FFD700', 'VIP'));

  // Assassin sprite
  assets.set('assassin', createPlaceholderImage(60, 80, '#800080', 'ASSASSIN'));

  // Projectile sprite
  assets.set('projectile', createPlaceholderImage(20, 20, '#FFFF00', '●'));

  // Background tiles
  assets.set('stair-tile', createPlaceholderImage(64, 64, '#666666', 'STAIR'));
  assets.set('wall-tile', createPlaceholderImage(64, 64, '#333333', 'WALL'));

  // UI elements
  assets.set('ui-heart-full', createPlaceholderImage(32, 32, '#FF0000', '♥'));
  assets.set('ui-heart-empty', createPlaceholderImage(32, 32, '#333333', '♡'));
  assets.set('ui-button', createPlaceholderImage(200, 60, '#4444FF', 'BUTTON'));
  assets.set('ui-pause-icon', createPlaceholderImage(40, 40, '#FFFFFF', '||'));
  assets.set('ui-play-icon', createPlaceholderImage(40, 40, '#FFFFFF', '▶'));

  // Power-up sprites
  assets.set('powerup-shield', createPlaceholderImage(40, 40, '#00FFFF', 'SHIELD'));
  assets.set('powerup-speed', createPlaceholderImage(40, 40, '#FF00FF', 'SPEED'));
  assets.set('powerup-multi', createPlaceholderImage(40, 40, '#FFFF00', 'MULTI'));

  return assets;
}

export async function saveAssetsToFiles(assets: Map<string, string>): Promise<void> {
  // In a real implementation, this would save to files
  // For now, we'll store them in memory and load them as data URLs
  (window as any).__placeholderAssets = assets;
}
# Responsive UI Guide for Stairway Sprint

## Overview

The responsive UI system ensures that Stairway Sprint provides an optimal user experience across all devices, from mobile phones (320px width) to desktop monitors (1920px width). The system automatically adjusts UI element sizes, font sizes, spacing, and touch targets based on the device category and screen dimensions.

## Key Components

### ResponsiveUtils Class

Located at `/src/utils/ResponsiveUtils.ts`, this is the core utility class that handles all responsive calculations.

#### Device Categories
- **Phone**: < 768px width
- **Tablet**: 768px - 1024px width  
- **Desktop**: > 1024px width

#### Key Methods

```typescript
// Get responsive utils instance
const responsive = getResponsive(scene);

// Get font size for different text types
const fontSize = responsive.getFontSize(FontSize.TITLE);

// Get complete font style object
const style = responsive.getFontStyle(FontSize.NORMAL, '#ffffff');

// Scale any value
const scaledValue = responsive.scale(100);

// Get spacing with multiplier
const spacing = responsive.getSpacing(2); // 2x base spacing

// Get minimum touch target size (always >= 44px)
const touchSize = responsive.getTouchTargetSize();

// Get UI scale for images/sprites
const scale = responsive.getUIScale();

// Get button configuration
const config = responsive.getButtonConfig('Play', FontSize.LARGE);
```

## Implementation Examples

### 1. Creating Responsive Text

```typescript
// Title text
const titleStyle = this.responsive.getFontStyle(FontSize.TITLE, '#ffffff');
const title = this.add.text(x, y, 'Game Title', {
    ...titleStyle,
    shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true }
});
```

### 2. Creating Responsive Buttons

```typescript
const buttonConfig = this.responsive.getButtonConfig('PLAY', FontSize.LARGE);
const button = this.add.text(x, y, 'PLAY', {
    ...this.responsive.getFontStyle(FontSize.LARGE, '#ffffff'),
    backgroundColor: '#333333',
    padding: buttonConfig.padding,
})
.setInteractive({ 
    useHandCursor: true,
    hitArea: new Phaser.Geom.Rectangle(
        -buttonConfig.minWidth / 2,
        -buttonConfig.minHeight / 2,
        buttonConfig.minWidth,
        buttonConfig.minHeight
    ),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains
});
```

### 3. Responsive Positioning

```typescript
const padding = this.responsive.getPadding();
const safeArea = this.responsive.getSafeAreaInsets();

// Top-left element
const scoreX = padding.x + safeArea.left;
const scoreY = padding.y + safeArea.top;

// Top-right element
const pauseX = width - this.responsive.scale(60) - safeArea.right;
```

### 4. Handling Window Resize

```typescript
create(): void {
    // Set up resize handler
    this.scale.on('resize', this.handleResize, this);
}

private handleResize(): void {
    // Update responsive utilities
    this.responsive.update();
    
    // Update layout
    this.updateLayout();
    
    // Update font sizes
    this.updateFontSizes();
}

shutdown(): void {
    // Clean up resize listener
    this.scale.off('resize', this.handleResize, this);
}
```

## Font Size Types

- `FontSize.SMALL`: 75% of base size
- `FontSize.NORMAL`: 100% of base size
- `FontSize.LARGE`: 125% of base size
- `FontSize.TITLE`: 250% of base size
- `FontSize.HEADING`: 175% of base size

## Configuration by Device

### Phone
- Base font size: 14px
- Min font size: 12px
- Max font size: 24px
- UI scale: 0.8
- Base spacing: 15px

### Tablet
- Base font size: 16px
- Min font size: 14px
- Max font size: 32px
- UI scale: 1.0
- Base spacing: 20px

### Desktop
- Base font size: 18px
- Min font size: 16px
- Max font size: 48px
- UI scale: 1.2
- Base spacing: 25px

## Best Practices

1. **Always Use ResponsiveUtils**: Never hardcode pixel values for UI elements
2. **Test Across Devices**: Use the ResponsiveTest.html file to verify UI looks good on all screen sizes
3. **Maintain Touch Targets**: Ensure all interactive elements are at least 44x44 pixels
4. **Consider Safe Areas**: Always account for device notches and home indicators
5. **Update on Resize**: Implement resize handlers to update UI when window size changes
6. **Use Font Size Presets**: Stick to the predefined font size types for consistency

## Testing

1. Open `/src/test/ResponsiveTest.html` in a browser
2. Click through different device presets
3. Use browser dev tools device emulator for more accurate testing
4. Test orientation changes on mobile devices
5. Verify text readability and touch target sizes

## Common Issues and Solutions

### Issue: Text too small on mobile
**Solution**: Use appropriate FontSize preset and check min font size limits

### Issue: Buttons too small to tap
**Solution**: Use `getButtonConfig()` to ensure proper touch target sizing

### Issue: UI elements overlap on small screens
**Solution**: Use responsive spacing and consider different layouts for mobile

### Issue: Elements don't update on window resize
**Solution**: Implement resize handler and call `responsive.update()`

## Future Enhancements

- Dynamic layout switching (e.g., vertical layout on portrait, horizontal on landscape)
- Custom breakpoints per scene
- Responsive particle effects and animations
- Adaptive performance settings based on device
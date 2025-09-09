# GitHub Pages Deployment Guide

This guide explains how to deploy Stairway Sprint to GitHub Pages.

## Prerequisites

- GitHub repository with this project code
- Node.js 18+ installed locally for development

## Automatic Deployment (Recommended)

The project includes a GitHub Actions workflow that automatically builds and deploys the game to GitHub Pages when you push to the `main` branch.

### Setup Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

2. **Enable GitHub Pages in your repository**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Source", select "GitHub Actions"

3. **Wait for deployment**
   - The GitHub Action will trigger automatically on push
   - Check the Actions tab to monitor progress
   - Once complete, your game will be available at:
     `https://[your-username].github.io/stairway-sprint/`

## Manual Deployment

If you prefer to deploy manually:

1. **Build the project locally**
   ```bash
   npm install
   npm run build
   ```

2. **Deploy the dist folder**
   ```bash
   npm install -g gh-pages
   gh-pages -d dist
   ```

3. **Configure GitHub Pages**
   - Go to Settings → Pages
   - Set source to "Deploy from a branch"
   - Select `gh-pages` branch

## Configuration Details

### Vite Base Path

The `vite.config.js` is configured to automatically set the correct base path:
- Development: `/` (for local development)
- Production: `/stairway-sprint/` (for GitHub Pages subdirectory)

### Asset Loading

All game assets use relative paths and will work correctly on GitHub Pages without modification.

### Custom Domain (Optional)

To use a custom domain:
1. Add a `CNAME` file to the `public` folder with your domain
2. Configure DNS settings with your domain provider
3. Update the base path in `vite.config.js` if needed

## Troubleshooting

### Assets not loading
- Ensure all asset paths in the code are relative (no leading `/`)
- Check browser console for 404 errors
- Verify the base path matches your repository name

### Build failures
- Check Node version (should be 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Page not updating
- GitHub Pages can cache aggressively
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Wait a few minutes for cache to clear

## Development Workflow

1. Make changes locally
2. Test with `npm run dev`
3. Build and preview: `npm run build && npm run preview`
4. Commit and push to trigger automatic deployment
5. Monitor deployment in GitHub Actions tab

## Performance Notes

- GitHub Pages serves static files with CDN caching
- First load may be slower; subsequent loads will be faster
- Assets are optimized during build process
- Vite handles code splitting automatically
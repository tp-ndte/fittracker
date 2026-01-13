# FitTracker - Quick Setup Guide

## Prerequisites Check

Before starting, verify you have Node.js installed:

```bash
node --version
npm --version
```

If these commands fail, you need to install Node.js first.

## macOS Installation

### Install Node.js

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

**Option 2: Direct Download**
1. Visit https://nodejs.org/
2. Download the LTS version for macOS
3. Run the installer
4. Verify installation in Terminal

## Project Setup

Once Node.js is installed:

```bash
# 1. Navigate to the project directory
cd /Users/tompink/FitTracker

# 2. Install dependencies
npm install

# 3. Generate PWA icons (optional)
brew install imagemagick
chmod +x scripts/generate-icons.sh
./scripts/generate-icons.sh

# 4. Start development server
npm run dev
```

## Quick Start Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Deployment
vercel              # Deploy to Vercel (install: npm i -g vercel)
netlify deploy      # Deploy to Netlify (install: npm i -g netlify-cli)
```

## Initial Test

After running `npm run dev`, you should see:

```
VITE v5.0.8  ready in XXX ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h to show help
```

Open http://localhost:3000 in your browser to see the app!

## Common Issues

### "npm: command not found"
**Solution**: Node.js is not installed. Follow the installation steps above.

### "Cannot find module" errors
**Solution**: Run `npm install` to install all dependencies.

### Port 3000 already in use
**Solution**: Either:
- Kill the process using port 3000: `lsof -ti:3000 | xargs kill`
- Or edit `vite.config.ts` to use a different port

### Build fails with TypeScript errors
**Solution**: Ensure TypeScript is installed: `npm install -D typescript`

## File Structure Check

Your directory should look like this after setup:

```
FitTracker/
├── node_modules/      # Created after npm install
├── public/
├── src/
├── package.json
├── package-lock.json  # Created after npm install
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Next Steps

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000 in your browser
3. Create your first workout!
4. Test on mobile by accessing your local IP
5. Deploy when ready to share

## Mobile Testing

To test on your iPhone while developing:

1. Find your computer's local IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Start dev server with host flag:
   ```bash
   npm run dev -- --host
   ```

3. On your iPhone (connected to same WiFi):
   - Open Safari
   - Navigate to `http://YOUR_IP:3000`
   - Test the app

## Need Help?

- Check the main README.md for detailed documentation
- Review the Troubleshooting section
- Check that all files were created correctly
- Ensure Node.js version is 18 or higher: `node --version`

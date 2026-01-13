# FitTracker - Personal Fitness Tracking PWA

A modern, mobile-first Progressive Web App for tracking workouts, exercises, and fitness progress. Built with React, TypeScript, and TailwindCSS.

## Features

- **Workout Logging**: Log exercises with sets, reps, and weight
- **Exercise Library**: Browse 16+ common exercises with detailed instructions
- **Progress Tracking**: Visual charts showing weight and volume progress over time
- **Calendar View**: See your workout history in an intuitive calendar format
- **Local Storage**: All data stored locally - no backend required
- **PWA Support**: Installable on iPhone home screen with offline functionality
- **Mobile-First Design**: Optimized for iPhone and mobile devices

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **date-fns** for date handling
- **vite-plugin-pwa** for PWA functionality

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager

## Installation

1. **Install Node.js** (if not already installed):
   ```bash
   # macOS (using Homebrew)
   brew install node

   # Or download from https://nodejs.org/
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate PWA icons** (optional - requires ImageMagick):
   ```bash
   # Install ImageMagick first
   brew install imagemagick

   # Generate icons
   chmod +x scripts/generate-icons.sh
   ./scripts/generate-icons.sh
   ```

   If you don't have ImageMagick, you can manually create:
   - `public/favicon.ico` (32x32)
   - `public/icon-192.png` (192x192)
   - `public/icon-512.png` (512x512)
   - `public/apple-touch-icon.png` (180x180)

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Follow the prompts to deploy your app

**Or use the Vercel Dashboard:**
1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will automatically detect Vite and deploy

### Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

**Or use Netlify's drag-and-drop:**
1. Run `npm run build`
2. Visit [netlify.com/drop](https://netlify.com/drop)
3. Drag the `dist` folder to deploy

### GitHub Pages

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.ts` to set the base:
   ```typescript
   export default defineConfig({
     base: '/FitTracker/', // Replace with your repo name
     // ... rest of config
   })
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

## Installing on iPhone

Once deployed, install FitTracker on your iPhone:

1. **Open Safari** on your iPhone and navigate to your deployed URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "FitTracker" and tap **Add**
5. The app icon will appear on your home screen
6. Tap to launch as a native-like app!

## Using the App

### Creating a Workout

1. Tap the **Workouts** tab
2. Tap **+ New** button
3. Enter workout name and date
4. Tap **+ Add Exercise** to add exercises
5. For each exercise, add sets with reps and weight
6. Tap checkmark to complete each set
7. Tap **Save** when done

### Viewing Progress

1. Tap the **Progress** tab
2. Select an exercise from the dropdown
3. View your max weight and volume progress
4. Toggle between weight and volume charts
5. See detailed workout history below

### Exercise Library

1. Tap the **Exercises** tab
2. Browse by category or search for exercises
3. Tap any exercise to view detailed instructions
4. See muscle groups worked and equipment needed

### Calendar View

1. Tap the **Calendar** tab
2. View your workout history by month
3. Days with workouts are highlighted
4. Tap any day to see workout details
5. Navigate between months with arrow buttons

## Project Structure

```
FitTracker/
├── public/              # Static assets
│   ├── icon.svg         # Source icon (SVG)
│   ├── icon-192.png     # PWA icon (192x192)
│   ├── icon-512.png     # PWA icon (512x512)
│   └── sw.js            # Service worker
├── src/
│   ├── components/      # React components
│   │   ├── WorkoutLogger.tsx
│   │   ├── WorkoutsList.tsx
│   │   ├── ExerciseLibrary.tsx
│   │   ├── ProgressTracker.tsx
│   │   └── CalendarView.tsx
│   ├── data/
│   │   └── exercises.ts # Exercise library data
│   ├── types/
│   │   └── index.ts     # TypeScript types
│   ├── utils/
│   │   └── storage.ts   # Local storage utilities
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # App entry point
│   └── index.css        # Global styles
├── scripts/
│   └── generate-icons.sh # Icon generation script
├── package.json
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # TailwindCSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Features in Detail

### Data Persistence

All workout data is stored in browser's localStorage:
- No backend required
- Data persists across sessions
- Works completely offline
- Export/import functionality can be added

### PWA Capabilities

- **Installable**: Add to home screen
- **Offline Support**: Works without internet
- **App-like Experience**: Full-screen, no browser chrome
- **Fast Loading**: Service worker caching

### Mobile Optimizations

- Touch-optimized UI elements
- Safe area insets for notched devices
- Responsive design for all screen sizes
- Optimized tap targets (44px minimum)
- Smooth scrolling and transitions

## Browser Support

- Safari on iOS 11.3+
- Chrome on Android 5.0+
- All modern desktop browsers

## Contributing

Feel free to submit issues and enhancement requests!

## Future Enhancements

Potential features to add:
- [ ] Exercise filtering and favorites
- [ ] Workout templates and routines
- [ ] Rest timer between sets
- [ ] Export/import data as JSON
- [ ] Dark mode
- [ ] Exercise photos/videos
- [ ] Body weight tracking
- [ ] Personal records (PRs) tracking
- [ ] Workout duration timer
- [ ] Social sharing

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Troubleshooting

### Icons not showing
- Make sure to run the icon generation script
- Or manually add PNG files to the `public/` folder

### PWA not installing
- Ensure you're using HTTPS (required for PWA)
- Check that manifest.json is being served correctly
- Verify service worker is registered in browser DevTools

### Data not persisting
- Check that localStorage is enabled in browser
- Ensure you're not in private/incognito mode
- Check browser storage quota isn't exceeded

### Build errors
- Delete `node_modules` and run `npm install` again
- Clear npm cache: `npm cache clean --force`
- Ensure Node.js version is 18 or higher

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with details about your problem

---

Built with ❤️ for fitness enthusiasts

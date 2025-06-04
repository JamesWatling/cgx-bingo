# CGX Ice Breaker Bingo

A real-time, social bingo web app designed to kick off group events with playful interactions and friendly competition. Participants mark off bingo squares by interacting with others and logging names. A real-time scoreboard tracks progress, and delightful microinteractions enhance the experience.

## Features

### 🎯 Bingo Game
- **5x5 grid** with randomized questions from a shared pool
- **Dynamic and unique** cards per player - no duplicates
- **Free space** in the center (optional)
- **Real-time synchronization** via WebSockets

### 🎪 Interactive Experience
- **Name entry flow** with participant validation
- **Modal interface** for marking squares with participant names and optional answers
- **Sound effects** and animations for marking squares and winning
- **Confetti celebration** when someone gets BINGO!

### 📊 Real-time Scoreboard
- **Live player tracking** with marked squares count
- **Progress visualization** with progress bars and mini bingo cards
- **Winner announcements** with visual highlights
- **Host controls** for starting/resetting games

### 🎨 Modern Design
- **Vibrant, gradient-based** color scheme
- **Responsive design** optimized for mobile and desktop
- **Smooth animations** and microinteractions
- **Glass-morphism effects** with backdrop blur

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **WebSockets** for real-time communication
- **Canvas Confetti** for celebration effects
- **CSS Grid & Flexbox** for responsive layouts
- **CSS Custom Properties** for theming

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cgx-bingo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the WebSocket server**
   ```bash
   node server.js
   ```
   This starts the WebSocket server on port 8080.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   This starts the Vite development server on port 5173.

5. **Open the application**
   - Main game: http://localhost:5173
   - Scoreboard: http://localhost:5173/scoreboard

## Usage

### For Players

1. **Enter your name** from the predefined participant list
2. **View your bingo card** with randomized ice breaker questions
3. **Click on squares** to mark them when you complete the activity
4. **Select a participant** and optionally add a short answer
5. **Get BINGO!** by completing a row, column, or diagonal

### For Hosts

1. **Open the scoreboard** at `/scoreboard`
2. **Monitor player progress** in real-time
3. **Use host controls** to start new games or reset
4. **Celebrate winners** with automatic confetti and announcements

## Configuration

### Adding Questions
Edit `src/data/questions.json` to add or modify bingo prompts:

```json
[
  {
    "prompt": "Find someone who has traveled to more than 5 countries",
    "type": "find-someone"
  }
]
```

### Adding Participants
Edit `src/data/participants.json` to add participant names:

```json
[
  "Alice",
  "Bob",
  "Charlie"
]
```

### Customizing Appearance
- **Colors**: Modify CSS custom properties in `src/styles/theme.css`
- **Animations**: Adjust animations in `src/styles/animations.css`
- **Grid size**: Update the grid configuration in `src/components/BingoGame.tsx`

## WebSocket Events

The application uses the following WebSocket message types:

- `PLAYER_JOINED`: When a player joins the game
- `SQUARE_MARKED`: When a player marks a square
- `BINGO_WINNER`: When a player gets BINGO
- `GAME_RESET`: When the host resets the game
- `PLAYERS_UPDATE`: Real-time player list updates

## Building for Production

```bash
npm run build
```

This creates a `dist` folder with the production build.

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Deploy the frontend automatically
3. Deploy the WebSocket server separately (e.g., on Railway, Heroku, or DigitalOcean)
4. Update the WebSocket URL in `src/context/GameContext.tsx`

### Manual Deployment
1. Build the application: `npm run build`
2. Serve the `dist` folder with any static file server
3. Deploy the WebSocket server to a cloud provider
4. Update the WebSocket URL for production

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

**WebSocket connection fails**
- Ensure the WebSocket server is running on port 8080
- Check firewall settings
- Verify the WebSocket URL in the code

**Styles not loading**
- Clear browser cache
- Restart the development server
- Check for CSS import errors in the console

**TypeScript errors**
- Run `npx tsc --noEmit` to check for type errors
- Ensure all dependencies are installed
- Check import paths

### Performance Tips

- Use the production build for better performance
- Enable gzip compression on your server
- Consider using a CDN for static assets
- Monitor WebSocket connection stability

## Support

For issues and questions, please open an issue on the repository or contact the development team.

---

**Have fun breaking the ice! 🎉**
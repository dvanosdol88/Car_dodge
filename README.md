# Car Dodge Game

A fun, interactive car dodging game built with HTML5 Canvas and JavaScript, featuring PostgreSQL backend for high score tracking.

## 🎮 Game Features

- **Highway Theme**: Professional traffic signage design throughout the game
- **Multiple Obstacles**: Cars, motorcycles, oil slicks, and tanks with missiles
- **Enhanced Graphics**: Detailed sprites with realistic car features, tank treads, and textured trees
- **Audio Effects**: Background music and sound effects using Tone.js
- **Speed Progression**: Dynamic speed increase from 25 MPH to 100 MPH based on score
- **Shooting Mechanics**: Fire projectiles to destroy tanks for bonus points
- **High Score System**: PostgreSQL backend with leaderboard functionality
- **Responsive Design**: Mobile-friendly controls and responsive canvas
- **Curved Roads**: Dynamic road curvature for added challenge

## 🚀 Live Demo

Play the game at: [https://dvo88.com](https://dvo88.com)

## 🛠 Technology Stack

### Frontend
- HTML5 Canvas for game rendering
- Vanilla JavaScript for game logic
- Tone.js for audio synthesis and sound effects
- Responsive CSS for mobile compatibility
- SVG graphics for traffic signs

### Backend
- Node.js with Express.js
- PostgreSQL database for score persistence
- RESTful API for score submission and retrieval
- CORS enabled for cross-origin requests

### Deployment
- Frontend: Render Static Site
- Backend: Render Web Service
- Database: Render PostgreSQL

## 🎯 Game Controls

### Desktop
- **Arrow Keys**: Move left/right
- **Spacebar**: Shoot projectiles
- **Mouse**: Click navigation buttons

### Mobile
- **Touch Buttons**: On-screen controls for movement and shooting
- **Navigation Signs**: Touch traffic signs for menu options

## 🏆 Scoring System

- **Passing Obstacles**: 10 points per obstacle avoided
- **Destroying Tanks**: 100 bonus points per tank destroyed
- **Speed Bonus**: Score affects game speed (25-100 MPH)
- **High Score Tracking**: Top scores saved to PostgreSQL database

## 🎨 Game Elements

### Obstacles
- **Cars**: Various colored vehicles with headlights and windows
- **Motorcycles**: Smaller, faster obstacles
- **Oil Slicks**: Cause spinning effect when hit
- **Tanks**: Fire missiles, can be destroyed for bonus points

### Environment
- **Trees**: Detailed sprites with branches and layered foliage
- **Curved Roads**: Dynamic road curvature with lane markings
- **Traffic Signs**: Professional highway signage theme

## 🔧 Local Development

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

### Setup
1. Clone the repository
```bash
git clone git@github.com:dvanosdol88/Car_dodge.git
cd Car_dodge
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the backend server
```bash
npm start
```

5. Open `index.html` in your browser or serve with a local HTTP server

### API Endpoints

- `POST /score` - Submit a new high score
- `GET /scores?limit=10` - Retrieve top scores
- `GET /health` - Health check endpoint

## 📁 Project Structure

```
Car_dodge/
├── index.html              # Main game file
├── backend/
│   ├── server.js           # Express server
│   ├── package.json        # Backend dependencies
│   └── .env               # Environment variables
├── render.yaml            # Render deployment config
├── DIFFICULTY_LOG.md      # Game balance tracking
├── CLAUDE.md             # Project instructions
└── README.md             # This file
```

## 🎵 Audio Features

- **Background Music**: FM synthesis spy-theme music
- **Sound Effects**: 
  - Oil slick spinning
  - Car crashes
  - Player shooting
  - Tank firing
  - Tank explosions
  - Tank rumbling (when tanks are present)

## 🏗 Development History

The game evolved through several phases:
1. **Basic Game**: Simple car dodging mechanics
2. **Enhanced Graphics**: Improved sprites and visual details
3. **Audio Integration**: Added Tone.js sound effects and music
4. **Shooting Mechanics**: Player projectiles and tank destruction
5. **Highway Theme**: Professional traffic signage design
6. **Performance Optimization**: Collision detection improvements
7. **Mobile Support**: Touch controls and responsive design

## 🔄 Recent Updates

- Updated CLAUDE.md with README maintenance requirements
- Enhanced traffic sign navigation with SVG icons
- Improved score display with Rest Area styling
- Fixed collision detection for enhanced tank sprites
- Added vertical exit ramp arrows with ground posts
- Mobile-optimized controls and responsive canvas
- PostgreSQL integration for persistent high scores

## 🤝 Contributing

This is a personal project created as a learning exercise with AI tools. The game showcases modern web development techniques and creative problem-solving.

## 📧 Contact

For questions or feedback, contact: david@davidcfacfp.com

## 🔗 Related Projects

- [Interactive Resume](https://github.com/dvanosdol88/interactive_resume) - David's professional portfolio

---

*Created with AI assistance using Claude Code for rapid prototyping and iterative development.*
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Initialize scores file if it doesn't exist
async function initializeScoresFile() {
    try {
        await fs.access(SCORES_FILE);
    } catch (error) {
        // File doesn't exist, create it with an empty array
        await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
        console.log('Created scores.json file');
    }
}

// Read scores from file
async function readScores() {
    try {
        const data = await fs.readFile(SCORES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading scores:', error);
        return [];
    }
}

// Write scores to file
async function writeScores(scores) {
    try {
        await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
    } catch (error) {
        console.error('Error writing scores:', error);
        throw error;
    }
}

// POST /score endpoint
app.post('/score', async (req, res) => {
    try {
        const { playerName, score, timestamp } = req.body;

        // Validation
        if (!playerName || typeof score !== 'number' || !timestamp) {
            return res.status(400).json({
                error: 'Missing required fields: playerName, score, timestamp'
            });
        }

        if (score < 0) {
            return res.status(400).json({
                error: 'Score must be a non-negative number'
            });
        }

        // Read existing scores
        const scores = await readScores();

        // Add new score
        const newScore = {
            id: Date.now().toString(),
            playerName: playerName.trim(),
            score: parseInt(score),
            timestamp: timestamp,
            submittedAt: new Date().toISOString()
        };

        scores.push(newScore);

        // Sort by score (highest first) and keep top 100
        scores.sort((a, b) => b.score - a.score);
        const topScores = scores.slice(0, 100);

        // Write back to file
        await writeScores(topScores);

        console.log(`New score submitted: ${playerName} - ${score}`);

        res.status(201).json({
            success: true,
            message: 'Score saved successfully',
            scoreData: newScore,
            rank: topScores.findIndex(s => s.id === newScore.id) + 1
        });

    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({
            error: 'Failed to save score',
            message: error.message
        });
    }
});

// GET /scores endpoint (bonus - to view high scores)
app.get('/scores', async (req, res) => {
    try {
        const scores = await readScores();
        const limit = parseInt(req.query.limit) || 10;
        
        res.json({
            success: true,
            scores: scores.slice(0, limit),
            total: scores.length
        });
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({
            error: 'Failed to fetch scores',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    try {
        await initializeScoresFile();
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`POST scores to: http://localhost:${PORT}/score`);
            console.log(`View scores at: http://localhost:${PORT}/scores`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
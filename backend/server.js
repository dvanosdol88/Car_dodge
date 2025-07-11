const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://scores_db_z2az_user:0lGBD5U4FWxgGNBR7eAuUCfBFUs07hLv@dpg-d17h82umcj7s73d7ifsg-a.oregon-postgres.render.com/scores_db_z2az',
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());

// Enhanced CORS middleware with logging
app.use((req, res, next) => {
    // Log incoming requests for debugging
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.get('Origin') || 'unknown'}`);
    
    // Set CORS headers - specifically allow the game domain
    const allowedOrigins = [
        'https://www.dvo88.com',
        'https://dvo88.com',
        'https://car-dodge.dvo88.com',
        'https://www.car-dodge.dvo88.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ];
    
    const origin = req.get('Origin');
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.header('Access-Control-Allow-Origin', '*'); // Fallback to allow all
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'false');
    
    if (req.method === 'OPTIONS') {
        console.log('Responding to OPTIONS preflight request');
        res.sendStatus(200);
    } else {
        next();
    }
});

// Initialize database table
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR(100) NOT NULL,
                score INTEGER NOT NULL,
                timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create index on score for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)
        `);
        
        console.log('Database table initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Read scores from database
async function readScores(limit = 100) {
    try {
        const result = await pool.query(
            'SELECT * FROM scores ORDER BY score DESC LIMIT $1',
            [limit]
        );
        return result.rows.map(row => ({
            id: row.id.toString(),
            playerName: row.player_name,
            score: row.score,
            timestamp: row.timestamp,
            submittedAt: row.submitted_at
        }));
    } catch (error) {
        console.error('Error reading scores:', error);
        return [];
    }
}

// Write score to database
async function writeScore(scoreData) {
    try {
        const result = await pool.query(
            'INSERT INTO scores (player_name, score, timestamp) VALUES ($1, $2, $3) RETURNING *',
            [scoreData.playerName, scoreData.score, scoreData.timestamp]
        );
        return {
            id: result.rows[0].id.toString(),
            playerName: result.rows[0].player_name,
            score: result.rows[0].score,
            timestamp: result.rows[0].timestamp,
            submittedAt: result.rows[0].submitted_at
        };
    } catch (error) {
        console.error('Error writing score:', error);
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

        // Save score to database
        const newScore = await writeScore({
            playerName: playerName.trim(),
            score: parseInt(score),
            timestamp: timestamp
        });

        // Get rank by counting scores higher than this one
        const rankResult = await pool.query(
            'SELECT COUNT(*) + 1 as rank FROM scores WHERE score > $1',
            [newScore.score]
        );
        const rank = parseInt(rankResult.rows[0].rank);

        console.log(`New score submitted: ${playerName} - ${score}`);

        res.status(201).json({
            success: true,
            message: 'Score saved successfully',
            scoreData: newScore,
            rank: rank
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

// CORS test endpoint
app.get('/cors-test', (req, res) => {
    res.json({ 
        message: 'CORS is working!', 
        origin: req.get('Origin') || 'no-origin',
        timestamp: new Date().toISOString() 
    });
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        
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
// Game variables
let canvas, ctx;
let playerCar; // *** CHANGED: This will become an instance of the Player class
let playerName = '';
let obstacles = [];
let trees = [];
let playerProjectiles = [];
let tankMissiles = [];
let explosions = [];
let bonusTexts = [];

let score = 0;
let gameSpeed = 240;
let currentMPH = 25;
let gameOver = false;
let roadCurveOffset = 0;
let curveDirection = 1;
let playerSpeed = 480;
let animationFrameId;
let lastTime = 0;

// Tone.js variables
let backgroundMusic, oilSlickSound, crashSound, playerShootSound, tankExplosionSound, tankFireSound, tankRumbleSound;

// Game state variables
let spinningActive = false;
let spinDuration = 2000;
let spinStartTime = 0;
const SPIN_COUNT = 4;
let canShoot = true;
let shotCooldown = 300;
let lastShotTime = 0;

// Constants
const LANE_WIDTH = 100;
const ROAD_WIDTH = LANE_WIDTH * 3;
const MAX_OBSTACLES = 5;
const TREE_COUNT = 15;
const CURVE_STRENGTH = 0.05;
const MAX_CURVE_OFFSET = 150;
const TANK_FIRE_CHANCE = 0.005;
const TANK_FIRE_COOLDOWN = 1500;

// *** NEW: Player Class Definition
class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.rotation = 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.1, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height * 0.7);
        ctx.lineTo(this.x, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.1, this.y);
        ctx.lineTo(this.x + this.width * 0.9, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
        ctx.lineTo(this.x + this.width * 0.9, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'lightblue';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width * 0.2, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.15);
        ctx.lineTo(this.x + this.width * 0.75, this.y + this.height * 0.3);
        ctx.lineTo(this.x + this.width * 0.25, this.y + this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'black';
        const wheelWidth = this.width * 0.2;
        const wheelHeight = this.height * 0.15;
        ctx.fillRect(this.x - wheelWidth / 2, this.y + this.height * 0.1, wheelWidth, wheelHeight);
        ctx.fillRect(this.x + this.width - wheelWidth / 2, this.y + this.height * 0.1, wheelWidth, wheelHeight);
        ctx.fillRect(this.x - wheelWidth / 2, this.y + this.height * 0.75, wheelWidth, wheelHeight);
        ctx.fillRect(this.x + this.width - wheelWidth / 2, this.y + this.height * 0.75, wheelWidth, wheelHeight);

        ctx.restore();
    }
}

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// *** DELETED: The old drawPlayerCar() function is now gone.

function drawRoad() {
    const roadCenterX = canvas.width / 2 + roadCurveOffset;
    const roadX = roadCenterX - ROAD_WIDTH / 2;
    drawRect(roadX, 0, ROAD_WIDTH, canvas.height, '#555');
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 5;
    ctx.setLineDash([30, 30]);
    ctx.beginPath();
    ctx.moveTo(roadX + LANE_WIDTH, 0);
    ctx.lineTo(roadX + LANE_WIDTH, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(roadX + 2 * LANE_WIDTH, 0);
    ctx.lineTo(roadX + 2 * LANE_WIDTH, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        const adjustedObstacleX = obstacle.x + roadCurveOffset;
        if (obstacle.type === 'car') {
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(adjustedObstacleX, obstacle.y, obstacle.width, obstacle.height, 5);
            } else {
                ctx.rect(adjustedObstacleX, obstacle.y, obstacle.width, obstacle.height);
            }
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1, obstacle.width * 0.8, obstacle.height * 0.2);
            ctx.strokeRect(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1, obstacle.width * 0.8, obstacle.height * 0.2);
            ctx.fillStyle = 'lightgray';
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.15, obstacle.height * 0.3);
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.15, obstacle.height * 0.3);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.05, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.05, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.85, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.85, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'motorcycle') {
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.2);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1);
            ctx.moveTo(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.2);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.9, obstacle.y + obstacle.height * 0.1);
            ctx.stroke();
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.85, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.85, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'oilSlick') {
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.ellipse(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, obstacle.height / 2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(adjustedObstacleX + obstacle.width * 0.4, obstacle.y + obstacle.height * 0.4, obstacle.width * 0.2, obstacle.height * 0.2, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'tank') {
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#2F2F2F';
            ctx.fillRect(adjustedObstacleX, obstacle.y + obstacle.height * 0.89, obstacle.width, obstacle.height * 0.11);
            ctx.strokeRect(adjustedObstacleX, obstacle.y + obstacle.height * 0.89, obstacle.width, obstacle.height * 0.11);
            ctx.fillStyle = 'black';
            for (let i = 0; i < 4; i++) {
                const x = adjustedObstacleX + obstacle.width * 0.15 + (i * obstacle.width * 0.25);
                ctx.beginPath();
                ctx.arc(x, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = obstacle.color;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.9, obstacle.height * 0.54, 8);
            } else {
                ctx.rect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.9, obstacle.height * 0.54);
            }
            ctx.fill();
            ctx.stroke();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                const y = obstacle.y + obstacle.height * 0.4 + (i * obstacle.height * 0.15);
                ctx.beginPath();
                ctx.moveTo(adjustedObstacleX + obstacle.width * 0.1, y);
                ctx.lineTo(adjustedObstacleX + obstacle.width * 0.9, y);
                ctx.stroke();
            }
            for (let i = 1; i < 3; i++) {
                const x = adjustedObstacleX + obstacle.width * 0.05 + (i * obstacle.width * 0.3);
                ctx.beginPath();
                ctx.moveTo(x, obstacle.y + obstacle.height * 0.4);
                ctx.lineTo(x, obstacle.y + obstacle.height * 0.85);
                ctx.stroke();
            }
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.3, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#444';
            ctx.fillRect(adjustedObstacleX + obstacle.width / 2 - 6, obstacle.y, 12, obstacle.height * 0.3);
            ctx.strokeRect(adjustedObstacleX + obstacle.width / 2 - 6, obstacle.y, 12, obstacle.height * 0.3);
            ctx.fillStyle = '#333';
            ctx.fillRect(adjustedObstacleX + obstacle.width / 2 - 4, obstacle.y, 8, 8);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.25);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.15);
            ctx.stroke();
        }
    });
}

function drawTrees() {
    trees.forEach(tree => {
        const adjustedTreeX = tree.x + roadCurveOffset;
        drawRect(adjustedTreeX, tree.y, tree.width, tree.height * 0.3, 'brown');
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineX = adjustedTreeX + (tree.width / 4) + (i * tree.width / 6);
            ctx.beginPath();
            ctx.moveTo(lineX, tree.y);
            ctx.lineTo(lineX, tree.y + tree.height * 0.3);
            ctx.stroke();
        }
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        const branchY = tree.y + tree.height * 0.15;
        ctx.beginPath();
        ctx.moveTo(adjustedTreeX + tree.width * 0.1, branchY);
        ctx.lineTo(adjustedTreeX - tree.width * 0.2, branchY - tree.height * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(adjustedTreeX + tree.width * 0.9, branchY);
        ctx.lineTo(adjustedTreeX + tree.width * 1.2, branchY - tree.height * 0.1);
        ctx.stroke();
        ctx.fillStyle = 'green';
        const centerX = adjustedTreeX + tree.width / 2;
        const centerY = tree.y + tree.height * 0.3;
        const baseRadius = tree.width * 0.7;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(centerX - baseRadius * 0.4, centerY - baseRadius * 0.3, baseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + baseRadius * 0.3, centerY - baseRadius * 0.5, baseRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlayerProjectiles() {
    playerProjectiles.forEach(proj => {
        drawRect(proj.x, proj.y, proj.width, proj.height, proj.color);
    });
}

function drawTankMissiles() {
    tankMissiles.forEach(missile => {
        drawRect(missile.x, missile.y, missile.width, missile.height, missile.color);
    });
}

function drawExplosions() {
    explosions.forEach(exp => {
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = `rgb(255, ${200 - exp.radius}, 0)`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function drawBonusTexts() {
    bonusTexts.forEach(bonus => {
        ctx.globalAlpha = bonus.alpha;
        ctx.fillStyle = bonus.color;
        ctx.font = `${bonus.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(bonus.text, bonus.x, bonus.y);
        ctx.globalAlpha = 1;
    });
}

function drawScore() {
    document.getElementById('scoreDisplay').textContent = score.toLocaleString();
}

function generateObstacle(isInitial) {
    const types = ['car', 'motorcycle', 'oilSlick', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)];
    let obstacle;
    const lane = Math.floor(Math.random() * 3);
    const initialRoadX = canvas.width / 2 - ROAD_WIDTH / 2;
    const xPosInLane = initialRoadX + (lane * LANE_WIDTH) + (LANE_WIDTH / 2);
    let startY;
    if (isInitial) {
        const tempHeight = (type === 'car' ? 90 : (type === 'motorcycle' ? 70 : (type === 'oilSlick' ? 40 : 120)));
        startY = -tempHeight - (Math.random() * canvas.height * 0.5);
    } else {
        startY = -150 - Math.random() * 300;
    }
    if (type === 'car') {
        const colors = ['red', 'green', 'yellow', 'purple', 'darkblue', 'orange'];
        obstacle = { x: xPosInLane - 30, y: startY, width: 60, height: 90, color: colors[Math.floor(Math.random() * colors.length)], type: 'car' };
    } else if (type === 'motorcycle') {
        const colors = ['orange', 'cyan', 'magenta', 'grey'];
        obstacle = { x: xPosInLane - 20, y: startY, width: 40, height: 70, color: colors[Math.floor(Math.random() * colors.length)], type: 'motorcycle' };
    } else if (type === 'oilSlick') {
        obstacle = { x: xPosInLane - 35, y: startY, width: 70, height: 40, type: 'oilSlick' };
    } else if (type === 'tank') {
        obstacle = { x: xPosInLane - 50, y: startY - 15, width: 100, height: 135, color: 'darkgreen', type: 'tank', lastFireTime: 0 };
    }
    obstacles.push(obstacle);
}

function generateTree(isInitial) {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    let xPos;
    const treeWidth = 40 + Math.random() * 20;
    const treeHeight = 100 + Math.random() * 50;
    const initialRoadX = canvas.width / 2 - ROAD_WIDTH / 2;
    if (side === 'left') {
        xPos = initialRoadX - (80 + Math.random() * 100) - treeWidth / 2;
    } else {
        xPos = initialRoadX + ROAD_WIDTH + (60 + Math.random() * 100) - treeWidth / 2;
    }
    let startY;
    if (isInitial) {
        startY = -treeHeight - (Math.random() * canvas.height * 0.5);
    } else {
        startY = -Math.random() * canvas.height;
    }
    trees.push({ x: xPos, y: startY, width: treeWidth, height: treeHeight, type: 'tree' });
}

function createPlayerProjectile() {
    if (spinningActive || !canShoot) return;
    const now = Date.now();
    if (now - lastShotTime < shotCooldown) return;
    const projectile = {
        x: playerCar.x + playerCar.width / 2 - 5,
        y: playerCar.y - 20,
        width: 10,
        height: 20,
        color: 'white',
        speed: 900
    };
    playerProjectiles.push(projectile);
    playerShootSound.triggerAttackRelease("C5", "16n");
    lastShotTime = now;
}

function createTankMissile(x, y) {
    const missile = {
        x: x - 5,
        y: y,
        width: 10,
        height: 25,
        color: 'red',
        speed: gameSpeed + 300
    };
    tankMissiles.push(missile);
}

function createExplosion(x, y) {
    explosions.push({ x: x, y: y, radius: 5, alpha: 1, duration: 1000, startTime: Date.now() });
    tankExplosionSound.triggerAttackRelease("4n");
}

function createBonusText(x, y, text, color = 'gold') {
    bonusTexts.push({ x: x, y: y, text: text, alpha: 1, size: 20, color: color });
}

async function sendHighScore(playerName, score) {
    try {
        const response = await fetch('https://car-dodge-backend.onrender.com/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: playerName || 'Anonymous', score: score, timestamp: new Date().toISOString() }),
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to submit high score:', error);
        return null;
    }
}

async function fetchHighScores(limit = 10) {
    try {
        const response = await fetch(`https://car-dodge-backend.onrender.com/scores?limit=${limit}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
        const result = await response.json();
        return result.scores || [];
    } catch (error) {
        console.error('Failed to fetch high scores:', error);
        return [];
    }
}

async function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<p>🔄 Loading leaderboard...</p>';
    leaderboardScreen.style.display = 'block';
    const scores = await fetchHighScores(10);
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<p>🎯 No scores yet. Be the first to play!</p>';
        return;
    }
    let leaderboardHTML = '';
    scores.forEach((scoreEntry, index) => {
        const rank = index + 1;
        const isTopScore = rank === 1;
        const isCurrentPlayer = scoreEntry.playerName === playerName && scoreEntry.score === score;
        const entryClass = isTopScore ? 'top-score' : (isCurrentPlayer ? 'current-player' : '');
        leaderboardHTML += `<div class="score-entry ${entryClass}"><span class="rank">#${rank}</span><span class="player-name">${scoreEntry.playerName || 'Anonymous'}</span><span class="score-value">${scoreEntry.score.toLocaleString()}</span></div>`;
    });
    leaderboardList.innerHTML = leaderboardHTML;
}

function hideLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'none';
}

function showNewHighScoreAnnouncement(rank) {
    const announcement = document.getElementById('newHighScoreAnnouncement');
    const highScoreText = document.getElementById('highScoreText');
    if (rank === 1) {
        highScoreText.textContent = `You're #1! Score: ${score.toLocaleString()}`;
    } else if (rank <= 10) {
        highScoreText.textContent = `Top 10! Rank #${rank} - Score: ${score.toLocaleString()}`;
    } else {
        return;
    }
    announcement.style.display = 'block';
    setTimeout(() => {
        announcement.style.display = 'none';
    }, 4000);
}

async function handleGameOver() {
    const result = await sendHighScore(playerName, score);
    if (result && result.rank) {
        const rankDisplay = document.getElementById('rankDisplay');
        const playerRank = document.getElementById('playerRank');
        playerRank.textContent = result.rank;
        rankDisplay.style.display = 'block';
        if (result.rank <= 10) {
            setTimeout(() => showNewHighScoreAnnouncement(result.rank), 1000);
        }
    }
}

function updateSpeed() {
    const maxScore = 5000;
    const speedRange = 100 - 25;
    const speedProgress = Math.min(score / maxScore, 1);
    currentMPH = Math.floor(25 + (speedRange * speedProgress));
    currentMPH = Math.min(currentMPH, 100);
    const minGameSpeed = 240;
    const maxGameSpeed = 720;
    gameSpeed = minGameSpeed + ((maxGameSpeed - minGameSpeed) * speedProgress);
    document.getElementById('speedLimitNumber').textContent = currentMPH;
}

function update(deltaTime) {
    if (isNaN(deltaTime)) deltaTime = 0;

    roadCurveOffset += curveDirection * CURVE_STRENGTH * score * deltaTime;
    if (Math.abs(roadCurveOffset) > MAX_CURVE_OFFSET) {
        curveDirection *= -1;
    }

    handlePlayerMovement(deltaTime);

    if (spinningActive) {
        const elapsed = Date.now() - spinStartTime;
        if (elapsed < spinDuration) {
            playerCar.rotation = (elapsed / spinDuration) * (Math.PI * 2 * SPIN_COUNT);
        } else {
            spinningActive = false;
            playerCar.rotation = 0;
        }
    }

    let tanksPresent = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += gameSpeed * deltaTime;
        if (obstacles[i].type === 'tank') {
            tanksPresent = true;
            const now = Date.now();
            if (Math.random() < TANK_FIRE_CHANCE && now - obstacles[i].lastFireTime > TANK_FIRE_COOLDOWN) {
                const adjustedX = obstacles[i].x + roadCurveOffset + obstacles[i].width / 2;
                createTankMissile(adjustedX, obstacles[i].y + obstacles[i].height);
                tankFireSound.triggerAttackRelease("C2", "8n");
                obstacles[i].lastFireTime = now;
            }
        }
        if (obstacles[i].y > canvas.height + 50) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    if (tankRumbleSound) {
        if (tanksPresent && tankRumbleSound.state !== 'started') {
            tankRumbleSound.start();
        } else if (!tanksPresent && tankRumbleSound.state === 'started') {
            tankRumbleSound.stop();
        }
    }

    for (let i = trees.length - 1; i >= 0; i--) {
        trees[i].y += gameSpeed * deltaTime;
        if (trees[i].y > canvas.height + 100) {
            trees.splice(i, 1);
        }
    }

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        playerProjectiles[i].y -= playerProjectiles[i].speed * deltaTime;
        if (playerProjectiles[i].y < -20) {
            playerProjectiles.splice(i, 1);
        }
    }

    for (let i = tankMissiles.length - 1; i >= 0; i--) {
        tankMissiles[i].y += tankMissiles[i].speed * deltaTime;
        if (tankMissiles[i].y > canvas.height + 25) {
            tankMissiles.splice(i, 1);
        }
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        const elapsed = Date.now() - exp.startTime;
        exp.radius = Math.min(30, 5 + elapsed * 0.05);
        exp.alpha = Math.max(0, 1 - elapsed / exp.duration);
        if (exp.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }

    for (let i = bonusTexts.length - 1; i >= 0; i--) {
        bonusTexts[i].y -= 120 * deltaTime;
        bonusTexts[i].alpha -= 0.6 * deltaTime;
        if (bonusTexts[i].alpha <= 0) {
            bonusTexts.splice(i, 1);
        }
    }

    if (obstacles.length < MAX_OBSTACLES && Math.random() < 0.02) {
        generateObstacle(false);
    }
    if (trees.length < TREE_COUNT && Math.random() < 0.05) {
        generateTree(false);
    }

    updateSpeed();
    checkCollisions();
}

function checkCollisions() {
    obstacles.forEach((obstacle, obstacleIndex) => {
        const adjustedObstacleX = obstacle.x + roadCurveOffset;
        if (playerCar.x < adjustedObstacleX + obstacle.width && playerCar.x + playerCar.width > adjustedObstacleX && playerCar.y < obstacle.y + obstacle.height && playerCar.y + playerCar.height > obstacle.y) {
            if (obstacle.type === 'oilSlick') {
                if (!spinningActive) {
                    spinningActive = true;
                    spinStartTime = Date.now();
                    oilSlickSound.triggerAttackRelease("8n");
                    obstacles.splice(obstacleIndex, 1);
                }
            } else if (obstacle.type === 'car' || obstacle.type === 'motorcycle' || obstacle.type === 'tank') {
                endGame();
            }
        }
    });

    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const proj = playerProjectiles[i];
        let hitTank = false;
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            if (obstacle.type === 'tank') {
                const adjustedObstacleX = obstacle.x + roadCurveOffset;
                if (proj.x < adjustedObstacleX + obstacle.width && proj.x + proj.width > adjustedObstacleX && proj.y < obstacle.y + obstacle.height && proj.y + proj.height > obstacle.y) {
                    obstacles.splice(j, 1);
                    createExplosion(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    score += 100;
                    createBonusText(adjustedObstacleX + obstacle.width / 2, obstacle.y, "100 Bonus Points!");
                    hitTank = true;
                    break;
                }
            }
        }
        if (hitTank) {
            playerProjectiles.splice(i, 1);
        }
    }

    for (let i = tankMissiles.length - 1; i >= 0; i--) {
        const missile = tankMissiles[i];
        if (playerCar.x < missile.x + missile.width && playerCar.x + playerCar.width > missile.x && playerCar.y < missile.y + missile.height && playerCar.y + playerCar.height > missile.y) {
            endGame();
            return;
        }
    }
}

function animate(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        drawTrees();
        update(deltaTime);
        drawObstacles();
        drawTankMissiles();
        playerCar.draw(ctx); // *** CHANGED: Use the draw method from the Player class
        drawPlayerProjectiles();
        drawExplosions();
        drawBonusTexts();
        drawScore();
    }
    animationFrameId = requestAnimationFrame(animate);
}

function endGame() {
    if (gameOver) return;
    gameOver = true;
    crashSound.triggerAttackRelease("4n");
    document.getElementById('finalScore').innerText = score.toLocaleString();
    document.getElementById('gameOverScreen').style.display = 'block';
    Tone.Transport.stop();
    if (tankRumbleSound && tankRumbleSound.state === 'started') {
        tankRumbleSound.stop();
    }
    handleGameOver();
    cancelAnimationFrame(animationFrameId);
}

function handlePlayerMovement(deltaTime) {
    if (spinningActive) return;
    const minX = (canvas.width / 2 - ROAD_WIDTH / 2) + roadCurveOffset;
    const maxX = (canvas.width / 2 + ROAD_WIDTH / 2) + roadCurveOffset - playerCar.width;

    if (keys['ArrowLeft']) {
        playerCar.x = Math.max(playerCar.x - (playerSpeed * deltaTime), minX);
    }
    if (keys['ArrowRight']) {
        playerCar.x = Math.min(playerCar.x + (playerSpeed * deltaTime), maxX);
    }
}

function resetGame() {
    gameOver = false;
    obstacles = [];
    trees = [];
    playerProjectiles = [];
    tankMissiles = [];
    explosions = [];
    bonusTexts = [];
    score = 0;
    currentMPH = 25;
    roadCurveOffset = 0;
    curveDirection = 1;
    playerCar.rotation = 0;
    spinningActive = false;
    canShoot = true;
    lastShotTime = 0;
    updateSpeed();

    for (let i = 0; i < TREE_COUNT; i++) generateTree(true);
    for (let i = 0; i < MAX_OBSTACLES; i++) generateObstacle(true);

    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('initialScreen').style.display = 'none';
    document.getElementById('newHighScoreAnnouncement').style.display = 'none';
    document.getElementById('rankDisplay').style.display = 'none';
    
    Tone.Transport.start();
    
    cancelAnimationFrame(animationFrameId);
    lastTime = 0;
    animationFrameId = requestAnimationFrame(animate);
}

function showInitialScreen() {
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('initialScreen').style.display = 'block';
}

function restartToIntro() {
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'block';
}

function setupAudio() {
    const backgroundMusicSynth = new Tone.FMSynth().toDestination();
    backgroundMusic = new Tone.Sequence((time, note) => {
        backgroundMusicSynth.triggerAttackRelease(note, "8n", time);
    }, ["C4", "E4", "F4", "C4", "C4", "E4", "G4", "F4"]).start(0);
    backgroundMusicSynth.envelope.attack = 0.01;
    backgroundMusicSynth.envelope.decay = 0.2;
    backgroundMusicSynth.envelope.sustain = 0.1;
    backgroundMusicSynth.envelope.release = 0.5;
    Tone.Transport.bpm.value = 120;
    Tone.Transport.loop = true;
    Tone.Transport.loopEnd = "2m";
    oilSlickSound = new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination();
    crashSound = new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 } }).toDestination();
    playerShootSound = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.05 } }).toDestination();
    tankFireSound = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4, attackCurve: "exponential" } }).toDestination();
    tankExplosionSound = new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 } }).toDestination();
    tankRumbleSound = new Tone.Oscillator({ frequency: 40, type: "triangle" }).toDestination();
    tankRumbleSound.volume.value = -20;
}

async function startGame() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim();
    document.getElementById('initialScreen').style.display = 'none';
    try {
        await Tone.start();
        resetGame();
    } catch (e) {
        console.error("Failed to start Tone.js or game:", e);
    }
}

function resizeCanvas() {
    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;
    canvas.width = Math.min(parentWidth * 0.8, 600);
    canvas.height = Math.min(parentHeight * 0.9, 800);
    if (playerCar) {
        playerCar.x = canvas.width / 2 - playerCar.width / 2;
        playerCar.y = canvas.height - 100;
    }
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // *** CHANGED: Create a new Player instance instead of a plain object
    playerCar = new Player(0, 0, 50, 80, 'blue');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    document.getElementById('introScreen').style.display = 'block';

    document.getElementById('restartButton').onclick = resetGame;
    document.getElementById('startButton').onclick = startGame;
    document.getElementById('continueToGame').onclick = showInitialScreen;
    document.getElementById('backToIntroButton').onclick = restartToIntro;
    document.getElementById('backToResumeButton').onclick = () => window.open('https://davidcfacfp.com', '_blank');
    document.getElementById('viewLeaderboardButton').onclick = showLeaderboard;
    document.getElementById('viewLeaderboardFromGameOver').onclick = showLeaderboard;
    document.getElementById('closeLeaderboard').onclick = () => {
        hideLeaderboard();
        document.getElementById('introScreen').style.display = 'block';
    };
    document.getElementById('playAgain').onclick = () => {
        hideLeaderboard();
        resetGame();
    };
    document.getElementById('resumeSign').onclick = () => window.open('https://davidcfacfp.com', '_blank');
    document.getElementById('contactSign').onclick = async () => {
        const userChoice = confirm("How would you like to contact David?\n\n✉️ Click OK to open your email app\n📋 Click Cancel to copy email to clipboard");
        if (userChoice) {
            window.location.href = 'mailto:david@davidcfacfp.com';
        } else {
            try {
                await navigator.clipboard.writeText('david@davidcfacfp.com');
                alert('✅ Email address copied to clipboard!');
            } catch (error) {
                alert('📧 Contact David at: david@davidcfacfp.com');
            }
        }
    };

    const leftButton = document.getElementById('leftButton');
    const rightButton = document.getElementById('rightButton');
    const shootButton = document.getElementById('shootButton');
    leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowLeft'] = true; }, { passive: false });
    leftButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowLeft'] = false; });
    leftButton.addEventListener('mousedown', (e) => { keys['ArrowLeft'] = true; });
    leftButton.addEventListener('mouseup', (e) => { keys['ArrowLeft'] = false; });
    rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys['ArrowRight'] = true; }, { passive: false });
    rightButton.addEventListener('touchend', (e) => { e.preventDefault(); keys['ArrowRight'] = false; });
    rightButton.addEventListener('mousedown', (e) => { keys['ArrowRight'] = true; });
    rightButton.addEventListener('mouseup', (e) => { keys['ArrowRight'] = false; });
    shootButton.addEventListener('touchstart', (e) => { e.preventDefault(); createPlayerProjectile(); }, { passive: false });
    shootButton.addEventListener('mousedown', (e) => { createPlayerProjectile(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
        }
        keys[e.key] = true;
        if (e.key === ' ') {
            createPlayerProjectile();
        }
    });
    document.addEventListener('keyup', e => {
        keys[e.key] = false;
    });

    setupAudio();
}

window.onload = function() {
    initGame();
}

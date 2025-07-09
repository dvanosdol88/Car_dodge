// Game variables
let canvas, ctx;
let playerCar;
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

// --- CLASSES FOR GAME OBJECTS ---

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

class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    update(deltaTime, speed) {
        this.y += speed * deltaTime;
    }

    draw(ctx, roadOffset) {
        const adjustedX = this.x + roadOffset;
        ctx.fillStyle = 'purple';
        ctx.fillRect(adjustedX, this.y, this.width, this.height);
    }
}

class Car extends Obstacle {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, 'car');
        this.color = color;
    }

    draw(ctx, roadOffset) {
        const adjustedX = this.x + roadOffset;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(adjustedX, this.y, this.width, this.height, 5);
        } else {
            ctx.rect(adjustedX, this.y, this.width, this.height);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(adjustedX + this.width * 0.1, this.y + this.height * 0.1, this.width * 0.8, this.height * 0.2);
        ctx.strokeRect(adjustedX + this.width * 0.1, this.y + this.height * 0.1, this.width * 0.8, this.height * 0.2);
    }
}

class Motorcycle extends Obstacle {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, 'motorcycle');
        this.color = color;
    }
    
    draw(ctx, roadOffset) {
        const adjustedX = this.x + roadOffset;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(adjustedX + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

class OilSlick extends Obstacle {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'oilSlick');
    }

    draw(ctx, roadOffset) {
        const adjustedX = this.x + roadOffset;
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(adjustedX + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Tank extends Obstacle {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'tank');
        this.color = 'darkgreen';
        this.lastFireTime = 0;
    }

    draw(ctx, roadOffset) {
        const adjustedX = this.x + roadOffset;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(adjustedX, this.y + this.height * 0.89, this.width, this.height * 0.11);
        ctx.strokeRect(adjustedX, this.y + this.height * 0.89, this.width, this.height * 0.11);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(adjustedX + this.width * 0.05, this.y + this.height * 0.35, this.width * 0.9, this.height * 0.54, 8);
        } else {
            ctx.rect(adjustedX + this.width * 0.05, this.y + this.height * 0.35, this.width * 0.9, this.height * 0.54);
        }
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(adjustedX + this.width / 2, this.y + this.height * 0.3, this.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#444';
        ctx.fillRect(adjustedX + this.width / 2 - 6, this.y, 12, this.height * 0.3);
        ctx.strokeRect(adjustedX + this.width / 2 - 6, this.y, 12, this.height * 0.3);
    }
}

// --- Drawing Functions ---

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
        obstacle.draw(ctx, roadCurveOffset);
    });
}

function drawTrees() {
    trees.forEach(tree => {
        const adjustedTreeX = tree.x + roadCurveOffset;
        drawRect(adjustedTreeX, tree.y, tree.width, tree.height * 0.3, 'brown');
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

// --- Game Logic Functions ---

function generateObstacle(isInitial) {
    const types = [Car, Motorcycle, OilSlick, Tank];
    const ObstacleClass = types[Math.floor(Math.random() * types.length)];

    const lane = Math.floor(Math.random() * 3);
    const initialRoadX = canvas.width / 2 - ROAD_WIDTH / 2;
    const xPosInLane = initialRoadX + (lane * LANE_WIDTH) + (LANE_WIDTH / 2);

    let obstacle;
    if (ObstacleClass === Car) {
        const colors = ['red', 'green', 'yellow', 'purple', 'darkblue', 'orange'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        obstacle = new Car(xPosInLane - 30, 0, 60, 90, color);
    } else if (ObstacleClass === Motorcycle) {
        const colors = ['orange', 'cyan', 'magenta', 'grey'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        obstacle = new Motorcycle(xPosInLane - 20, 0, 40, 70, color);
    } else if (ObstacleClass === OilSlick) {
        obstacle = new OilSlick(xPosInLane - 35, 0, 70, 40);
    } else if (ObstacleClass === Tank) {
        obstacle = new Tank(xPosInLane - 50, 0, 100, 135);
    }

    if (isInitial) {
        obstacle.y = -obstacle.height - (Math.random() * canvas.height * 0.5);
    } else {
        obstacle.y = -150 - Math.random() * 300;
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
    // ... same as before
}

async function fetchHighScores(limit = 10) {
    // ... same as before
}

async function showLeaderboard() {
    // ... same as before
}

function hideLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'none';
}

function showNewHighScoreAnnouncement(rank) {
    // ... same as before
}

async function handleGameOver() {
    // ... same as before
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
        const obstacle = obstacles[i];
        obstacle.update(deltaTime, gameSpeed);

        if (obstacle instanceof Tank) {
            tanksPresent = true;
            const now = Date.now();
            if (Math.random() < TANK_FIRE_CHANCE && now - obstacle.lastFireTime > TANK_FIRE_COOLDOWN) {
                const adjustedX = obstacle.x + roadCurveOffset + obstacle.width / 2;
                createTankMissile(adjustedX, obstacle.y + obstacle.height);
                tankFireSound.triggerAttackRelease("C2", "8n");
                obstacle.lastFireTime = now;
            }
        }
        if (obstacle.y > canvas.height + 50) {
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
            } else {
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
        playerCar.draw(ctx);
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
    // ... same as before
}

function showInitialScreen() {
    // ... same as before
}

function restartToIntro() {
    // ... same as before
}

function setupAudio() {
    // ... same as before
}

async function startGame() {
    // ... same as before
}

function resizeCanvas() {
    // ... same as before
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    playerCar = new Player(0, 0, 50, 80, 'blue');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // *** THIS IS THE FIX: Added the initial object generation back in ***
    for (let i = 0; i < TREE_COUNT; i++) {
        generateTree(true);
    }
    for (let i = 0; i < MAX_OBSTACLES; i++) {
        generateObstacle(true);
    }

    document.getElementById('introScreen').style.display = 'block';

    // ... Event listeners ...
    document.getElementById('restartButton').onclick = resetGame;
    document.getElementById('startButton').onclick = startGame;
    // ... etc.

    setupAudio();
}

window.onload = function() {
    initGame();
}

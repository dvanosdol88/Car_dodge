// Game variables
let canvas, ctx;
let playerCar;
let playerName = '';
let obstacles = []; // Includes cars, motorcycles, oil slicks, tanks
let trees = [];
let playerProjectiles = [];
let tankMissiles = [];
let explosions = [];
let bonusTexts = [];

let score = 0;
let gameSpeed = 240; // Speed is in pixels PER SECOND
let currentMPH = 25;
let gameOver = false;
let roadCurveOffset = 0;
let curveDirection = 1;
let playerSpeed = 480; // Player speed is in pixels PER SECOND
let animationFrameId;

// Variables to track delta time
let lastTime = 0;

// Tone.js variables
let backgroundMusic, oilSlickSound, crashSound, playerShootSound, tankExplosionSound, tankFireSound, tankRumbleSound;

// Spinning effect variables
let spinningActive = false;
let spinDuration = 2000;
let spinStartTime = 0;
const SPIN_COUNT = 4;

// Shooting variables
let canShoot = true;
let shotCooldown = 300;
let lastShotTime = 0;

// Constants
const LANE_WIDTH = 100;
const ROAD_WIDTH = LANE_WIDTH * 3;
const MAX_OBSTACLES = 5;
const TREE_COUNT = 15;
const CURVE_STRENGTH = 0.05; // Adjusted for time-based calculation
const MAX_CURVE_OFFSET = 150;
const TANK_FIRE_CHANCE = 0.005;
const TANK_FIRE_COOLDOWN = 1500;

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawPlayerCar() {
    ctx.save();
    ctx.translate(playerCar.x + playerCar.width / 2, playerCar.y + playerCar.height / 2);
    ctx.rotate(playerCar.rotation);
    ctx.translate(-(playerCar.x + playerCar.width / 2), -(playerCar.y + playerCar.height / 2));
    ctx.fillStyle = playerCar.color;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerCar.x + playerCar.width * 0.1, playerCar.y + playerCar.height);
    ctx.lineTo(playerCar.x, playerCar.y + playerCar.height * 0.7);
    ctx.lineTo(playerCar.x, playerCar.y + playerCar.height * 0.3);
    ctx.lineTo(playerCar.x + playerCar.width * 0.1, playerCar.y);
    ctx.lineTo(playerCar.x + playerCar.width * 0.9, playerCar.y);
    ctx.lineTo(playerCar.x + playerCar.width, playerCar.y + playerCar.height * 0.3);
    ctx.lineTo(playerCar.x + playerCar.width, playerCar.y + playerCar.height * 0.7);
    ctx.lineTo(playerCar.x + playerCar.width * 0.9, playerCar.y + playerCar.height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'lightblue';
    ctx.beginPath();
    ctx.moveTo(playerCar.x + playerCar.width * 0.2, playerCar.y + playerCar.height * 0.15);
    ctx.lineTo(playerCar.x + playerCar.width * 0.8, playerCar.y + playerCar.height * 0.15);
    ctx.lineTo(playerCar.x + playerCar.width * 0.75, playerCar.y + playerCar.height * 0.3);
    ctx.lineTo(playerCar.x + playerCar.width * 0.25, playerCar.y + playerCar.height * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'black';
    const wheelWidth = playerCar.width * 0.2;
    const wheelHeight = playerCar.height * 0.15;
    ctx.fillRect(playerCar.x - wheelWidth / 2, playerCar.y + playerCar.height * 0.1, wheelWidth, wheelHeight);
    ctx.fillRect(playerCar.x + playerCar.width - wheelWidth / 2, playerCar.y + playerCar.height * 0.1, wheelWidth, wheelHeight);
    ctx.fillRect(playerCar.x - wheelWidth / 2, playerCar.y + playerCar.height * 0.75, wheelWidth, wheelHeight);
    ctx.fillRect(playerCar.x + playerCar.width - wheelWidth / 2, playerCar.y + playerCar.height * 0.75, wheelWidth, wheelHeight);
    ctx.restore();
}

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
    const xPosIn

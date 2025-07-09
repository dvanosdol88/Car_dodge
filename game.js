// Game variables
let canvas, ctx;
let playerCar;
let playerName = '';
let obstacles = []; // Includes cars, motorcycles, oil slicks, tanks
let trees = [];
let playerProjectiles = []; // New: Player's fired projectiles
let tankMissiles = []; // New: Missiles fired by tanks
let explosions = []; // New: For tank explosions
let bonusTexts = []; // New: For "100 Bonus Points!" messages

let score = 0;
let gameSpeed = 240; // *** CHANGED: Speed in pixels PER SECOND
let currentMPH = 25; // Current speed in MPH
let gameOver = false;
let roadCurveOffset = 0; // Current horizontal offset for road curves
let curveDirection = 1; // 1 for right, -1 for left
let playerSpeed = 480; // *** CHANGED: Player speed in pixels PER SECOND
let animationFrameId; // To store requestAnimationFrame ID for cancellation

// *** NEW: Delta time variables
let lastTime = 0;
let deltaTime = 0;

// Tone.js variables for music and sound effects
let backgroundMusic;
let oilSlickSound;
let crashSound;
let playerShootSound; // New: Player shooting sound
let tankExplosionSound; // New: Tank explosion sound
let tankFireSound; // New: Tank firing sound
let tankRumbleSound; // New: Tank rumbling sound

// Spinning effect variables (for oil slick)
let spinningActive = false;
let spinDuration = 2000; // milliseconds
let spinStartTime = 0;
const SPIN_COUNT = 4; // Number of full 360 degree spins

// Shooting variables
let canShoot = true;
let shotCooldown = 300; // milliseconds
let lastShotTime = 0;

// Constants
const LANE_WIDTH = 100;
const ROAD_WIDTH = LANE_WIDTH * 3; // 3 lanes
const MAX_OBSTACLES = 5;
const TREE_COUNT = 15; // More trees for better visual density
const CURVE_STRENGTH = 0.05; // *** CHANGED: Adjusted for delta time
const MAX_CURVE_OFFSET = 150; // Max horizontal shift for the road
const TANK_FIRE_CHANCE = 0.005; // Chance per frame for a tank to fire
const TANK_FIRE_COOLDOWN = 1500; // Min time between tank shots

// Function declarations moved to the top for hoisting safety
/**
 * Draws a filled rectangle on the canvas.
 * @param {number} x - The x-coordinate of the top-left corner.
 * @param {number} y - The y-coordinate of the top-left corner.
 * @param {number} width - The width of the rectangle.
 * @param {number} height - The height of the rectangle.
 * @param {string} color - The fill color of the rectangle.
 */
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

/**
 * Draws the player's stylized blue car, applying rotation if spinning.
 */
function drawPlayerCar() {
    ctx.save();
    ctx.translate(playerCar.x + playerCar.width / 2, playerCar.y + playerCar.height / 2);
    ctx.rotate(playerCar.rotation);
    ctx.translate(-(playerCar.x + playerCar.width / 2), -(playerCar.y + playerCar.height / 2));

    ctx.fillStyle = playerCar.color; // Main body color
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;

    // Car body (more defined shape)
    ctx.beginPath();
    ctx.moveTo(playerCar.x + playerCar.width * 0.1, playerCar.y + playerCar.height); // Bottom left
    ctx.lineTo(playerCar.x, playerCar.y + playerCar.height * 0.7); // Mid-bottom left
    ctx.lineTo(playerCar.x, playerCar.y + playerCar.height * 0.3); // Mid-top left
    ctx.lineTo(playerCar.x + playerCar.width * 0.1, playerCar.y); // Top left
    ctx.lineTo(playerCar.x + playerCar.width * 0.9, playerCar.y); // Top right
    ctx.lineTo(playerCar.x + playerCar.width, playerCar.y + playerCar.height * 0.3); // Mid-top right
    ctx.lineTo(playerCar.x + playerCar.width, playerCar.y + playerCar.height * 0.7); // Mid-bottom right
    ctx.lineTo(playerCar.x + playerCar.width * 0.9, playerCar.y + playerCar.height); // Bottom right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Windshield
    ctx.fillStyle = 'lightblue';
    ctx.beginPath();
    ctx.moveTo(playerCar.x + playerCar.width * 0.2, playerCar.y + playerCar.height * 0.15);
    ctx.lineTo(playerCar.x + playerCar.width * 0.8, playerCar.y + playerCar.height * 0.15);
    ctx.lineTo(playerCar.x + playerCar.width * 0.75, playerCar.y + playerCar.height * 0.3);
    ctx.lineTo(playerCar.x + playerCar.width * 0.25, playerCar.y + playerCar.height * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wheels
    ctx.fillStyle = 'black';
    const wheelWidth = playerCar.width * 0.2;
    const wheelHeight = playerCar.height * 0.15;
    // Front left
    ctx.fillRect(playerCar.x - wheelWidth / 2, playerCar.y + playerCar.height * 0.1, wheelWidth, wheelHeight);
    // Front right
    ctx.fillRect(playerCar.x + playerCar.width - wheelWidth / 2, playerCar.y + playerCar.height * 0.1, wheelWidth, wheelHeight);
    // Rear left
    ctx.fillRect(playerCar.x - wheelWidth / 2, playerCar.y + playerCar.height * 0.75, wheelWidth, wheelHeight);
    // Rear right
    ctx.fillRect(playerCar.x + playerCar.width - wheelWidth / 2, playerCar.y + playerCar.height * 0.75, wheelWidth, wheelHeight);

    ctx.restore();
}

/**
 * Draws the road with its lanes and accounts for the road curvature.
 */
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

/**
 * Draws all obstacles (cars, motorcycles, oil slicks, tanks) on the canvas.
 */
function drawObstacles() {
    obstacles.forEach(obstacle => {
        const adjustedObstacleX = obstacle.x + roadCurveOffset;

        if (obstacle.type === 'car') {
            // Enhanced car body
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Using roundRect for a more consistent look with player car
            if (ctx.roundRect) { // Check for roundRect support
                 ctx.roundRect(adjustedObstacleX, obstacle.y, obstacle.width, obstacle.height, 5);
            } else { // Fallback for older browsers
                ctx.rect(adjustedObstacleX, obstacle.y, obstacle.width, obstacle.height);
            }
            ctx.fill();
            ctx.stroke();
            
            // Windshield
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1, 
                         obstacle.width * 0.8, obstacle.height * 0.2);
            ctx.strokeRect(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1, 
                           obstacle.width * 0.8, obstacle.height * 0.2);
            
            // Side windows
            ctx.fillStyle = 'lightgray';
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, 
                         obstacle.width * 0.15, obstacle.height * 0.3);
            ctx.fillRect(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.35, 
                         obstacle.width * 0.15, obstacle.height * 0.3);
            
            // Headlights
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.05, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.05, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Taillights
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Round wheels
            ctx.fillStyle = 'black';
            // Front wheels
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.15, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.15, 8, 0, Math.PI * 2);
            ctx.fill();
            // Rear wheels
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.85, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.85, 8, 0, Math.PI * 2);
            ctx.fill();

        } else if (obstacle.type === 'motorcycle') {
            // Stylized motorcycle
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height / 2, obstacle.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Handlebars
            ctx.beginPath();
            ctx.moveTo(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.2);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.1, obstacle.y + obstacle.height * 0.1);
            ctx.moveTo(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.2);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.9, obstacle.y + obstacle.height * 0.1);
            ctx.stroke();
            // Wheels
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.85, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width * 0.75, obstacle.y + obstacle.height * 0.85, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();

        } else if (obstacle.type === 'oilSlick') {
            ctx.fillStyle = '#1a1a1a'; // Very dark grey/black
            ctx.beginPath();
            ctx.ellipse(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height / 2,
                        obstacle.width / 2, obstacle.height / 2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(adjustedObstacleX + obstacle.width * 0.4, obstacle.y + obstacle.height * 0.4,
                        obstacle.width * 0.2, obstacle.height * 0.2, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type === 'tank') {
            // Enhanced Tank - now drawing within collision boundaries
            ctx.fillStyle = obstacle.color; // Tank body color
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            // Draw treads/tracks (now within collision box)
            ctx.fillStyle = '#2F2F2F'; // Dark gray for treads
            ctx.fillRect(adjustedObstacleX, obstacle.y + obstacle.height * 0.89, obstacle.width, obstacle.height * 0.11);
            ctx.strokeRect(adjustedObstacleX, obstacle.y + obstacle.height * 0.89, obstacle.width, obstacle.height * 0.11);
            
            // Tread details (small circles for track wheels)
            ctx.fillStyle = 'black';
            for (let i = 0; i < 4; i++) {
                const x = adjustedObstacleX + obstacle.width * 0.15 + (i * obstacle.width * 0.25);
                ctx.beginPath();
                ctx.arc(x, obstacle.y + obstacle.height * 0.95, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // Tank body (adjusted proportions)
            ctx.fillStyle = obstacle.color;
            ctx.beginPath();
            if (ctx.roundRect) { // Check for roundRect support
                ctx.roundRect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.9, obstacle.height * 0.54, 8);
            } else { // Fallback for older browsers
                ctx.rect(adjustedObstacleX + obstacle.width * 0.05, obstacle.y + obstacle.height * 0.35, obstacle.width * 0.9, obstacle.height * 0.54);
            }
            ctx.fill();
            ctx.stroke();
            
            // Armor plating details
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 1;
            // Horizontal armor lines
            for (let i = 1; i < 3; i++) {
                const y = obstacle.y + obstacle.height * 0.4 + (i * obstacle.height * 0.15);
                ctx.beginPath();
                ctx.moveTo(adjustedObstacleX + obstacle.width * 0.1, y);
                ctx.lineTo(adjustedObstacleX + obstacle.width * 0.9, y);
                ctx.stroke();
            }
            // Vertical armor sections
            for (let i = 1; i < 3; i++) {
                const x = adjustedObstacleX + obstacle.width * 0.05 + (i * obstacle.width * 0.3);
                ctx.beginPath();
                ctx.moveTo(x, obstacle.y + obstacle.height * 0.4);
                ctx.lineTo(x, obstacle.y + obstacle.height * 0.85);
                ctx.stroke();
            }

            // Turret
            ctx.fillStyle = obstacle.color;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(adjustedObstacleX + obstacle.width / 2, obstacle.y + obstacle.height * 0.3, obstacle.width * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Enhanced barrel (now within collision box top portion)
            ctx.fillStyle = '#444';
            ctx.fillRect(adjustedObstacleX + obstacle.width / 2 - 6, obstacle.y, 12, obstacle.height * 0.3);
            ctx.strokeRect(adjustedObstacleX + obstacle.width / 2 - 6, obstacle.y, 12, obstacle.height * 0.3);
            
            // Barrel tip
            ctx.fillStyle = '#333';
            ctx.fillRect(adjustedObstacleX + obstacle.width / 2 - 4, obstacle.y, 8, 8);
            
            // Tank antenna
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.25);
            ctx.lineTo(adjustedObstacleX + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.15);
            ctx.stroke();
        }
    });
}

/**
 * Draws all trees on the sides of the road.
 */
function drawTrees() {
    trees.forEach(tree => {
        const adjustedTreeX = tree.x + roadCurveOffset;
        
        // Draw trunk with texture
        drawRect(adjustedTreeX, tree.y, tree.width, tree.height * 0.3, 'brown');
        
        // Add trunk texture lines
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const lineX = adjustedTreeX + (tree.width / 4) + (i * tree.width / 6);
            ctx.beginPath();
            ctx.moveTo(lineX, tree.y);
            ctx.lineTo(lineX, tree.y + tree.height * 0.3);
            ctx.stroke();
        }
        
        // Draw simple branches
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        const branchY = tree.y + tree.height * 0.15;
        // Left branch
        ctx.beginPath();
        ctx.moveTo(adjustedTreeX + tree.width * 0.1, branchY);
        ctx.lineTo(adjustedTreeX - tree.width * 0.2, branchY - tree.height * 0.1);
        ctx.stroke();
        // Right branch  
        ctx.beginPath();
        ctx.moveTo(adjustedTreeX + tree.width * 0.9, branchY);
        ctx.lineTo(adjustedTreeX + tree.width * 1.2, branchY - tree.height * 0.1);
        ctx.stroke();
        
        // Draw foliage with multiple circles for more natural look
        ctx.fillStyle = 'green';
        const centerX = adjustedTreeX + tree.width / 2;
        const centerY = tree.y + tree.height * 0.3;
        const baseRadius = tree.width * 0.7;
        
        // Main foliage circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Additional smaller circles for texture
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(centerX - baseRadius * 0.4, centerY - baseRadius * 0.3, baseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(centerX + baseRadius * 0.3, centerY - baseRadius * 0.5, baseRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Draws player's projectiles.
 */
function drawPlayerProjectiles() {
    playerProjectiles.forEach(proj => {
        drawRect(proj.x, proj.y, proj.width, proj.height, proj.color);
    });
}

/**
 * Draws tank missiles.
 */
function drawTankMissiles() {
    tankMissiles.forEach(missile => {
        drawRect(missile.x, missile.y, missile.width, missile.height, missile.color);
    });
}

/**
 * Draws explosions.
 */
function drawExplosions() {
    explosions.forEach(exp => {
        ctx.globalAlpha = exp.alpha;
        ctx.fillStyle = `rgb(255, ${200 - exp.radius}, 0)`; // Yellow to orange fade
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // Reset alpha
    });
}

/**
 * Draws bonus point texts.
 */
function drawBonusTexts() {
    bonusTexts.forEach(bonus => {
        ctx.globalAlpha = bonus.alpha;
        ctx.fillStyle = bonus.color;
        ctx.font = `${bonus.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(bonus.text, bonus.x, bonus.y);
        ctx.globalAlpha = 1; // Reset alpha
    });
}

/**
 * Updates the current score display in the blue rest area sign.
 */
function drawScore() {
    document.getElementById('scoreDisplay').textContent = score.toLocaleString();
}

/**
 * Generates a new obstacle (car, motorcycle, oil slick, or tank) at a random lane.
 * @param {boolean} isInitial - True if called during initial game setup.
 */
function generateObstacle(isInitial) {
    const types = ['car', 'motorcycle', 'oilSlick', 'tank'];
    const type = types[Math.floor(Math.random() * types.length)]; // Randomly select type
    let obstacle;

    const lane = Math.floor(Math.random() * 3);
    const initialRoadX = canvas.width / 2 - ROAD_WIDTH / 2;
    const xPosInLane = initialRoadX + (lane * LANE_WIDTH) + (LANE_WIDTH / 2);

    let startY;
    if (isInitial) {
        // Ensure initial obstacles start fully off-screen above
        const tempHeight = (type === 'car' ? 90 : (type === 'motorcycle' ? 70 : (type === 'oilSlick' ? 40 : 120)));
        startY = -tempHeight - (Math.random() * canvas.height * 0.5); // Start above canvas with some randomness
    } else {
        startY = -150 - Math.random() * 300; // Normal spawning for new obstacles
    }

    if (type === 'car') {
        const colors = ['red', 'green', 'yellow', 'purple', 'darkblue', 'orange'];
        obstacle = {
            x: xPosInLane - 30,
            y: startY,
            width: 60,
            height: 90,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: 'car'
        };
    } else if (type === 'motorcycle') {
        const colors = ['orange', 'cyan', 'magenta', 'grey'];
        obstacle = {
            x: xPosInLane - 20,
            y: startY,
            width: 40,
            height: 70,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: 'motorcycle'
        };
    } else if (type === 'oilSlick') {
        obstacle = {
            x: xPosInLane - 35,
            y: startY,
            width: 70,
            height: 40,
            type: 'oilSlick'
        };
    } else if (type === 'tank') {
        obstacle = {
            x: xPosInLane - 50, // Adjusted for treads extending 5px each side (was -45, now -50)
            y: startY - 15, // Adjusted for barrel extending 15px above (was startY, now startY - 15)
            width: 100, // Adjusted for treads (was 90, now 100 to match visual width)
            height: 135, // Adjusted for barrel (was 120, now 135 to match visual height)
            color: 'darkgreen',
            type: 'tank',
            lastFireTime: 0 // To control tank's firing rate
        };
    }
    obstacles.push(obstacle);
}

/**
 * Generates a new tree on either the left or right side of the road.
 * @param {boolean} isInitial - True if called during initial game setup.
 */
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
        // Ensure initial trees start fully off-screen above
        startY = -treeHeight - (Math.random() * canvas.height * 0.5); // Start above canvas with some randomness
    } else {
        startY = -Math.random() * canvas.height; // Normal spawning for new trees
    }

    trees.push({
        x: xPos,
        y: startY,
        width: treeWidth,
        height: treeHeight,
        type: 'tree'
    });
}

/**
 * Creates a projectile fired by the player.
 */
function createPlayerProjectile() {
    if (spinningActive || !canShoot) return; // Cannot shoot while spinning or on cooldown

    const now = Date.now();
    if (now - lastShotTime < shotCooldown) {
        return; // Still on cooldown
    }

    const projectile = {
        x: playerCar.x + playerCar.width / 2 - 5, // Center projectile
        y: playerCar.y - 20, // Slightly above car
        width: 10,
        height: 20,
        color: 'white',
        speed: 900 // *** CHANGED: pixels per second
    };
    playerProjectiles.push(projectile);
    playerShootSound.triggerAttackRelease("C5", "16n"); // Play player shoot sound
    lastShotTime = now;
}

/**
 * Creates a missile fired by a tank.
 * @param {number} x - The x-coordinate of the missile's origin.
 * @param {number} y - The y-coordinate of the missile's origin.
 */
function createTankMissile(x, y) {
    const missile = {
        x: x - 5, // Center missile
        y: y,
        width: 10,
        height: 25,
        color: 'red',
        speed: gameSpeed + 300 // *** CHANGED: Missile speed relative to game speed
    };
    tankMissiles.push(missile);
}

/**
 * Creates an explosion effect.
 * @param {number} x - The x-coordinate of the explosion.
 * @param {number} y - The y-coordinate of the explosion.
 */
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        radius: 5,
        alpha: 1,
        duration: 1000, // 1 second explosion
        startTime: Date.now()
    });
    tankExplosionSound.triggerAttackRelease("4n"); // Play explosion sound
}

/**
 * Creates a bonus point text display.
 * @param {number} x - The x-coordinate of the text.
 * @param {number} y - The y-coordinate of the text.
 * @param {string} text - The text to display.
 * @param {string} color - The color of the text.
 */
function createBonusText(x, y, text, color = 'gold') {
    bonusTexts.push({
        x: x,
        y: y,
        text: text,
        alpha: 1,
        size: 20,
        color: color
    });
}

/**
 * Sends high score to backend API
 * @param {string} playerName - The player's name
 * @param {number} score - The player's score
 */
async function sendHighScore(playerName, score) {
    try {
        console.log('Submitting score:', { playerName, score });
        
        const response = await fetch('https://car-dodge-backend.onrender.com/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName || 'Anonymous',
                score: score,
                timestamp: new Date().toISOString()
            }),
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('High score submitted successfully:', result);
        return result;
    } catch (error) {
        console.error('Failed to submit high score:', error);
        
        let errorMessage = 'Could not connect to leaderboard server.';
        if (error.name === 'TimeoutError') {
            errorMessage = 'Connection to leaderboard timed out.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network connection error. Check your internet connection.';
        }
        
        console.warn('Leaderboard error:', errorMessage);
        return null;
    }
}

/**
 * Fetches high scores from backend API
 * @param {number} limit - Number of scores to fetch
 */
async function fetchHighScores(limit = 10) {
    try {
        console.log('Fetching leaderboard scores...');
        
        const response = await fetch(`https://car-dodge-backend.onrender.com/scores?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(15000)
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Leaderboard data received:', result);
        return result.scores || [];
    } catch (error) {
        console.error('Failed to fetch high scores:', error);
        
        let errorMessage = 'Could not load leaderboard.';
        if (error.name === 'TimeoutError') {
            errorMessage = 'Leaderboard is taking too long to load.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network connection error.';
        }
        
        console.warn('Leaderboard error:', errorMessage);
        return [];
    }
}

/**
 * Tests if backend connection is working
 */
async function testBackendConnection() {
    try {
        const response = await fetch('https://car-dodge-backend.onrender.com/cors-test', {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        return response.ok;
    } catch (error) {
        console.log('Backend connection test failed:', error);
        return false;
    }
}

/**
 * Displays the leaderboard screen
 */
async function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const leaderboardList = document.getElementById('leaderboardList');
    
    leaderboardList.innerHTML = '<p>🔄 Loading leaderboard...</p>';
    leaderboardScreen.style.display = 'block';
    
    const scores = await fetchHighScores(10);
    
    if (scores.length === 0) {
        const testConnection = await testBackendConnection();
        if (!testConnection) {
            leaderboardList.innerHTML = `
                <p style="color: #e74c3c;">❌ Could not connect to leaderboard server.</p>
                <p style="font-size: 0.9em; color: #666;">Please check your internet connection and try again.</p>
                <button onclick="showLeaderboard()" style="margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Retry
                </button>
            `;
        } else {
            leaderboardList.innerHTML = '<p>🎯 No scores yet. Be the first to play!</p>';
        }
        return;
    }
    
    let leaderboardHTML = '';
    scores.forEach((scoreEntry, index) => {
        const rank = index + 1;
        const isTopScore = rank === 1;
        const isCurrentPlayer = scoreEntry.playerName === playerName && scoreEntry.score === score;
        
        const entryClass = isTopScore ? 'top-score' : (isCurrentPlayer ? 'current-player' : '');
        
        leaderboardHTML += `
            <div class="score-entry ${entryClass}">
                <span class="rank">#${rank}</span>
                <span class="player-name">${scoreEntry.playerName || 'Anonymous'}</span>
                <span class="score-value">${scoreEntry.score.toLocaleString()}</span>
            </div>
        `;
    });
    
    leaderboardList.innerHTML = leaderboardHTML;
}

/**
 * Hides the leaderboard screen
 */
function hideLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'none';
}

/**
 * Shows new high score announcement
 * @param {number} rank - The player's rank
 */
function showNewHighScoreAnnouncement(rank) {
    const announcement = document.getElementById('newHighScoreAnnouncement');
    const highScoreText = document.getElementById('highScoreText');
    
    if (rank === 1) {
        highScoreText.textContent = `You're #1! Score: ${score.toLocaleString()}`;
    } else if (rank <= 5) {
        highScoreText.textContent = `Top 5! Rank #${rank} - Score: ${score.toLocaleString()}`;
    } else if (rank <= 10) {
        highScoreText.textContent = `Top 10! Rank #${rank} - Score: ${score.toLocaleString()}`;
    } else {
        return; // Don't show announcement for ranks below 10
    }
    
    announcement.style.display = 'block';
    
    setTimeout(() => {
        announcement.style.display = 'none';
    }, 4000);
}

/**
 * Handles game over logic including high score submission and announcements
 */
async function handleGameOver() {
    try {
        const result = await sendHighScore(playerName, score);
        
        if (result && result.rank) {
            const rankDisplay = document.getElementById('rankDisplay');
            const playerRank = document.getElementById('playerRank');
            playerRank.textContent = result.rank;
            rankDisplay.style.display = 'block';
            
            if (result.rank <= 10) {
                setTimeout(() => {
                    showNewHighScoreAnnouncement(result.rank);
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Error handling game over:', error);
    }
}

/**
 * Updates the game speed and speed limit sign
 */
function updateSpeed() {
    const maxScore = 5000;
    const speedRange = 100 - 25;
    const speedProgress = Math.min(score / maxScore, 1);
    
    currentMPH = Math.floor(25 + (speedRange * speedProgress));
    currentMPH = Math.min(currentMPH, 100);
    
    // *** CHANGED: Game speed logic now scales based on pixels per second
    const minGameSpeed = 240; // 25 MPH
    const maxGameSpeed = 720; // 100 MPH
    gameSpeed = minGameSpeed + ((maxGameSpeed - minGameSpeed) * speedProgress);
    
    document.getElementById('speedLimitNumber').textContent = currentMPH;
}

/**
 * Updates game state: obstacles, trees, projectiles, etc.
 */
function update() {
    // *** CHANGED: All movement is now multiplied by deltaTime for consistency
    
    // Update road curve
    roadCurveOffset += curveDirection * CURVE_STRENGTH * score * deltaTime;
    if (Math.abs(roadCurveOffset) > MAX_CURVE_OFFSET) {
        curveDirection *= -1; // Reverse curve direction
    }

    // Handle player movement
    handlePlayerMovement();

    // Handle spinning effect
    if (spinningActive) {
        const elapsed = Date.now() - spinStartTime;
        if (elapsed < spinDuration) {
            playerCar.rotation = (elapsed / spinDuration) * (Math.PI * 2 * SPIN_COUNT);
        } else {
            spinningActive = false;
            playerCar.rotation = 0;
        }
    }

    // Update obstacles
    let tanksPresent = false;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].y += gameSpeed * deltaTime;
        
        if (obstacles[i].type === 'tank') {
            tanksPresent = true;
            const now = Date.now();
            if (Math.random() < TANK_FIRE_CHANCE && 
                now - obstacles[i].lastFireTime > TANK_FIRE_COOLDOWN) {
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
    
    // Tank rumbling sound management
    if (tankRumbleSound) {
        if (tanksPresent && tankRumbleSound.state !== 'started') {
            tankRumbleSound.start();
        } else if (!tanksPresent && tankRumbleSound.state === 'started') {
            tankRumbleSound.stop();
        }
    }

    // Update trees
    for (let i = trees.length - 1; i >= 0; i--) {
        trees[i].y += gameSpeed * deltaTime;
        if (trees[i].y > canvas.height + 100) {
            trees.splice(i, 1);
        }
    }

    // Update player projectiles
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        playerProjectiles[i].y -= playerProjectiles[i].speed * deltaTime;
        if (playerProjectiles[i].y < -20) {
            playerProjectiles.splice(i, 1);
        }
    }

    // Update tank missiles
    for (let i = tankMissiles.length - 1; i >= 0; i--) {
        tankMissiles[i].y += tankMissiles[i].speed * deltaTime;
        if (tankMissiles[i].y > canvas.height + 25) {
            tankMissiles.splice(i, 1);
        }
    }

    // Update explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        const elapsed = Date.now() - exp.startTime;
        exp.radius = Math.min(30, 5 + elapsed * 0.05);
        exp.alpha = Math.max(0, 1 - elapsed / exp.duration);
        if (exp.alpha <= 0) {
            explosions.splice(i, 1);
        }
    }

    // Update bonus texts
    for (let i = bonusTexts.length - 1; i >= 0; i--) {
        bonusTexts[i].y -= 120 * deltaTime; // Move up at 120 pixels per second
        bonusTexts[i].alpha -= 0.6 * deltaTime; // Fade out over ~1.6 seconds
        if (bonusTexts[i].alpha <= 0) {
            bonusTexts.splice(i, 1);
        }
    }

    // Generate new obstacles
    if (obstacles.length < MAX_OBSTACLES && Math.random() < 0.02) {
        generateObstacle(false);
    }

    // Generate new trees
    if (trees.length < TREE_COUNT && Math.random() < 0.05) {
        generateTree(false);
    }

    updateSpeed();
    checkCollisions();
}

/**
 * Checks for collisions between various game elements.
 */
function checkCollisions() {
    // Player Car vs Obstacles
    obstacles.forEach((obstacle, obstacleIndex) => {
        const adjustedObstacleX = obstacle.x + roadCurveOffset;

        if (
            playerCar.x < adjustedObstacleX + obstacle.width &&
            playerCar.x + playerCar.width > adjustedObstacleX &&
            playerCar.y < obstacle.y + obstacle.height &&
            playerCar.y + playerCar.height > obstacle.y
        ) {
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

    // Player Projectile vs Tanks
    for (let i = playerProjectiles.length - 1; i >= 0; i--) {
        const proj = playerProjectiles[i];
        let hitTank = false;

        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];

            if (obstacle.type === 'tank') {
                const adjustedObstacleX = obstacle.x + roadCurveOffset;
                if (
                    proj.x < adjustedObstacleX + obstacle.width &&
                    proj.x + proj.width > adjustedObstacleX &&
                    proj.y < obstacle.y + obstacle.height &&
                    proj.y + proj.height > obstacle.y
                ) {
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

    // Player Car vs Tank Missiles
    for (let i = tankMissiles.length - 1; i >= 0; i--) {
        const missile = tankMissiles[i];
        if (
            playerCar.x < missile.x + missile.width &&
            playerCar.x + playerCar.width > missile.x &&
            playerCar.y < missile.y + missile.height &&
            playerCar.y + playerCar.height > missile.y
        ) {
            endGame();
            return;
        }
    }
}

/**
 * The main game loop that clears, draws, and updates the game state.
 * @param {number} timestamp - The current time provided by requestAnimationFrame.
 */
function animate(timestamp) {
    // *** CHANGED: Calculate deltaTime
    if (!lastTime) {
        lastTime = timestamp;
    }
    deltaTime = (timestamp - lastTime) / 1000; // Time in seconds
    lastTime = timestamp;

    if (!gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawRoad();
        drawTrees();
        update();
        drawObstacles();
        drawTankMissiles();
        drawPlayerCar();
        drawPlayerProjectiles();
        drawExplosions();
        drawBonusTexts();
        drawScore();
    }

    animationFrameId = requestAnimationFrame(animate);
}

// *** NEW: Centralized function to end the game
function endGame() {
    gameOver = true;
    crashSound.triggerAttackRelease("4n");
    document.getElementById('finalScore').innerText = score.toLocaleString();
    document.getElementById('gameOverScreen').style.display = 'block';
    Tone.Transport.stop();
    if (tankRumbleSound && tankRumbleSound.state === 'started') {
        tankRumbleSound.stop();
    }
    handleGameOver();
    cancelAnimationFrame(animationFrameId); // Stop the loop
}

// Keyboard input handling
let keys = {};
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

/**
 * Handles player car movement based on pressed arrow keys or touch buttons.
 */
function handlePlayerMovement() {
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

/**
 * Resets the game state and starts a new game.
 */
function resetGame() {
    gameOver = false;
    obstacles = [];
    trees = [];
    playerProjectiles = [];
    tankMissiles = [];
    explosions = [];
    bonusTexts = [];
    score = 0;
    gameSpeed = 240; // Pixels per second
    currentMPH = 25;
    roadCurveOffset = 0;
    curveDirection = 1;
    playerCar.rotation = 0;
    spinningActive = false;
    canShoot = true;
    lastShotTime = 0;
    lastTime = 0; // Reset lastTime for deltaTime calculation

    for (let i = 0; i < TREE_COUNT; i++) {
        generateTree(true);
    }
    for (let i = 0; i < MAX_OBSTACLES; i++) {
        generateObstacle(true);
    }

    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('initialScreen').style.display = 'none';
    document.getElementById('newHighScoreAnnouncement').style.display = 'none';
    document.getElementById('rankDisplay').style.display = 'none';
    
    Tone.Transport.start();
    
    // Cancel any old frame before starting a new one
    cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(animate);
}

function showInitialScreen() {
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('initialScreen').style.display = 'block';
}

function restartToIntro() {
    // This function can be simplified to just call resetGame and then show the intro screen
    resetGame(); // Reset all game state
    
    // Stop the animation loop that resetGame started
    cancelAnimationFrame(animationFrameId);
    
    // Hide game-related screens and show the intro
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('initialScreen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'block';
}

// Sets up Tone.js synths and sequences
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

    oilSlickSound = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination();

    crashSound = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 }
    }).toDestination();

    playerShootSound = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.01, release: 0.05 }
    }).toDestination();

    tankFireSound = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.4, attackCurve: "exponential" }
    }).toDestination();

    tankExplosionSound = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 }
    }).toDestination();
    
    tankRumbleSound = new Tone.Oscillator({
        frequency: 40,
        type: "triangle"
    }).toDestination();
    
    tankRumbleSound.volume.value = -20;
}

// Function to start the game after initial screen click
async function startGame() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim();
    
    document.getElementById('initialScreen').style.display = 'none';
    try {
        await Tone.start();
        Tone.Transport.start();
        
        // Reset game state and start the animation loop
        resetGame();

    } catch (e) {
        console.error("Failed to start Tone.js or game:", e);
    }
}

// Canvas resizing
function resizeCanvas() {
    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;

    canvas.width = Math.min(parentWidth * 0.8, 600);
    canvas.height = Math.min(parentHeight * 0.9, 800);

    playerCar.x = canvas.width / 2 - playerCar.width / 2;
    playerCar.y = canvas.height - 100;
}

// Game setup - this is the main entry point after functions are defined
function initGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    playerCar = {
        x: 0,
        y: 0,
        width: 50,
        height: 80,
        color: 'blue',
        rotation: 0
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial population of static elements
    for (let i = 0; i < TREE_COUNT; i++) {
        generateTree(true);
    }
    for (let i = 0; i < MAX_OBSTACLES; i++) {
        generateObstacle(true);
    }

    document.getElementById('introScreen').style.display = 'block';
    
    // Event listeners
    document.getElementById('restartButton').onclick = resetGame;
    document.getElementById('startButton').onclick = startGame;

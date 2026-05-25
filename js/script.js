import { savePlayerScore, getTopScores } from "./database.js";

// --- 1. IMAGES LOADING ---
const playerImg = new Image(); 
playerImg.src = 'img/human.jpg'; 
const zombieImg = new Image(); 
zombieImg.src = 'img/zombie.jpg';

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- 2. UI ELEMENTS (Gisiguro nga motugma sa imong index.html) ---
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const usernameInput = document.getElementById("usernameInput");
const scoreDisplay = document.getElementById("score");
const waveDisplay = document.getElementById("wave");
const healthDisplay = document.getElementById("health");
const zombieCountDisplay = document.getElementById("zombieCount");
const waveNotification = document.getElementById("waveNotification");
const playerNameDisplay = document.getElementById("playerNameDisplay");
const finalPlayerName = document.getElementById("finalPlayerName");
const finalScore = document.getElementById("finalScore");
const leaderboardList = document.getElementById("leaderboardList");

// --- 3. GAME VARIABLES ---
let isPlaying = false;
let isWaveBreak = false;
let score = 0;
let wave = 1;
let health = 100;
let zombies = [];
let zombiesToSpawn = 5;
let maxZombieLimit = 5;
let spawnIntervalId = null;
let gameLoopId = null;
let isSlashing = false;

// Player Settings & Key States (Para sa WASD)
const player = { x: 500, y: 300, radius: 16, speed: 4, angle: 0, name: "Survivor" };
const keys = { w: false, a: false, s: false, d: false };
const mouse = { x: 0, y: 0 };

// --- 4. CONTROLS & LISTENERS ---
window.addEventListener("keydown", (e) => { 
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true; 
});

window.addEventListener("keyup", (e) => { 
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false; 
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left; 
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("mousedown", () => { 
    if (isPlaying) slashSword(); 
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

// --- 5. GAME FUNCTIONS ---
function slashSword() {
    isSlashing = true;
    setTimeout(() => { isSlashing = false; }, 150);
    
    zombies.forEach((z, i) => {
        const dist = Math.hypot(z.x - player.x, z.y - player.y);
        // Igo ang zombie kung sulod sa 70 pixels
        if (dist < 70) {
            z.hp -= 2;
            if (z.hp <= 0) {
                zombies.splice(i, 1);
                score += 50;
                scoreDisplay.textContent = score;
                updateZombieCount();
            }
        }
    });
}

function updateZombieCount() {
    if (zombieCountDisplay) {
        zombieCountDisplay.textContent = zombies.length + zombiesToSpawn;
    }
}

function spawnZombie() {
    if (!isPlaying || isWaveBreak || zombies.length >= maxZombieLimit || zombiesToSpawn <= 0) return;
    
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 : canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 : canvas.height;
    }
    
    zombies.push({ 
        x: x, 
        y: y, 
        radius: 14, 
        speed: 0.8 + (wave * 0.1), // Mas paspas kada wave
        hp: 1 + Math.floor(wave * 0.5) 
    });
    zombiesToSpawn--;
    updateZombieCount();
}

function startWaveBreak() {
    isWaveBreak = true;
    wave++;
    waveDisplay.textContent = wave;
    
    if (waveNotification) {
        waveNotification.innerHTML = `WAVE ${wave}<br><span style="color:yellow; font-size: 25px;">+5 ZOMBIES INCOMING!</span>`;
        waveNotification.classList.remove("hidden");
    }
    
    setTimeout(() => {
        if (waveNotification) waveNotification.classList.add("hidden");
        isWaveBreak = false;
        maxZombieLimit += 5;
        zombiesToSpawn = maxZombieLimit;
        updateZombieCount();
    }, 2000); 
}

function updateEngine() {
    if (!isPlaying) return;

    if (!isWaveBreak) {
        // Player Movement (WASD)
        if (keys.w && player.y > player.radius) player.y -= player.speed; 
        if (keys.s && player.y < canvas.height - player.radius) player.y += player.speed;
        if (keys.a && player.x > player.radius) player.x -= player.speed; 
        if (keys.d && player.x < canvas.width - player.radius) player.x += player.speed;
        
        // Atubang sa mouse
        player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        
        // Zombies Movement ug Attack
        zombies.forEach((z, i) => {
            let angle = Math.atan2(player.y - z.y, player.x - z.x);
            z.x += Math.cos(angle) * z.speed; 
            z.y += Math.sin(angle) * z.speed;
            
            if (Math.hypot(player.x - z.x, player.y - z.y) < 30) {
                health -= 0.15; // Damage sa player
            }
        });
        
        healthDisplay.textContent = Math.max(0, Math.floor(health));
        
        if (health <= 0) {
            endGame();
            return;
        }
        
        if (zombies.length === 0 && zombiesToSpawn === 0) {
            startWaveBreak();
        }
    }
    
    drawGame();
    gameLoopId = requestAnimationFrame(updateEngine);
}

function drawGame() {
    ctx.fillStyle = "#0c101b"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Zombies gamit ang image
    zombies.forEach(z => { 
        if (zombieImg.complete && zombieImg.naturalWidth !== 0) {
            ctx.drawImage(zombieImg, z.x - 20, z.y - 20, 40, 40); 
        } else {
            ctx.fillStyle = "#2e7d32";
            ctx.beginPath(); ctx.arc(z.x, z.y, 14, 0, Math.PI * 2); ctx.fill();
        }
    });
    
    // 2. Draw Player gamit ang image ug rotation
    ctx.save(); 
    ctx.translate(player.x, player.y); 
    ctx.rotate(player.angle);
    
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, -25, -25, 50, 50);
    } else {
        ctx.fillStyle = "#1565c0";
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
    }
    
    // Sword slash attack visual
    if (isSlashing) { 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; 
        ctx.lineWidth = 5; 
        ctx.beginPath(); 
        ctx.arc(0, 0, 40, -0.5, 0.5); 
        ctx.stroke(); 
    }
    ctx.restore();

    // 3. Lighting Flashlight Effect
    let mask = document.createElement('canvas'); 
    mask.width = canvas.width; 
    mask.height = canvas.height;
    let mCtx = mask.getContext('2d');
    mCtx.fillStyle = "rgba(4, 5, 12, 0.65)"; 
    mCtx.fillRect(0, 0, canvas.width, canvas.height);
    mCtx.globalCompositeOperation = 'destination-out';
    
    let grad = mCtx.createRadialGradient(player.x, player.y, 10, player.x, player.y, 300);
    grad.addColorStop(0, 'black'); 
    grad.addColorStop(1, 'transparent');
    mCtx.fillStyle = grad; 
    mCtx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mask, 0, 0);
}

async function endGame() {
    isPlaying = false;
    clearInterval(spawnIntervalId);
    cancelAnimationFrame(gameLoopId);
    
    finalPlayerName.textContent = player.name;
    finalScore.textContent = score;
    gameOverScreen.classList.remove("hidden");
    
    // Pag-save sa Firebase Database
    try {
        await savePlayerScore(player.name, score);
        const top = await getTopScores();
        if (top && leaderboardList) {
            leaderboardList.innerHTML = top.map(t => `<li>${t.name} - ${t.score}</li>`).join('');
        }
    } catch (error) {
        console.error("Database Leaderboard Error:", error);
    }
}

function startGame() {
    score = 0; 
    wave = 1; 
    health = 100; 
    zombies = []; 
    zombiesToSpawn = 5; 
    maxZombieLimit = 5;
    
    player.x = 500;
    player.y = 300;
    player.name = usernameInput.value || "Survivor";
    
    playerNameDisplay.textContent = player.name;
    scoreDisplay.textContent = score;
    waveDisplay.textContent = wave;
    healthDisplay.textContent = health;
    updateZombieCount();
    
    isPlaying = true; 
    startScreen.classList.add("hidden"); 
    gameOverScreen.classList.add("hidden");
    
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnZombie, 1000);
    
    updateEngine();
}

let gameStarted = false;
let highScore = localStorage.getItem("skyFlyHighScore") || 0;
// ===== CONFIG =====
const HITBOX_MARGIN = 80;

// ===== ELEMENTS =====
const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const bgMusic = document.getElementById("bgMusic");
startBtn.addEventListener("click", startGame);
startBtn.addEventListener("touchstart", startGame);

function startGame() {
    startScreen.style.display = "none";
    gameStarted = true;
    requestAnimationFrame(gameLoop);
}
// ===== CANVAS =====
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight  // header + footer space
 esizeCanvas();
window.addEventListener("resize", resizeCanvas);
const dpr = window.devicePixelRatio || 1;
canvas.width = window.innerWidth * dpr;
canvas.height = window.innerHeight * dpr;
ctx.scale(dpr, dpr);
// ===== IMAGES =====
const bg = new Image();
bg.src = "assets/bg.png";

const playerImg = new Image();
playerImg.src = "assets/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

const enemy2Img = new Image();
enemy2Img.src = "assets/enemy2.png";

const speedImg = new Image();
speedImg.src = "assets/speed.png";

// ===== SOUNDS =====
const gameOverSound = new Audio("assets/gameover.mp3");
const boostSound = new Audio("assets/boost.mp3");
boostSound.volume = 0.7;

// ===== PLAYER =====
let player = {
  x: canvas.width * 0.1,
  y: canvas.height / 2,
  w: 120,
  h: 120
};

// ===== GAME DATA =====
let enemies = [];
let score = 0;
let gameOver = false;

// SPEED POWER
let speedPower = null;
let speedActive = false;
let speedTimer = 0;
let playerSpeed = 25;

// difficulty
let enemySpeed = 4;
let spawnGap = 1500;
let lastSpawn = 0;

// ===== CONTROLS =====
window.addEventListener("keydown", e => {
  if (!gameStarted) return;
  if (e.key === "ArrowUp") player.y -= playerSpeed;
  if (e.key === "ArrowDown") player.y += playerSpeed;
});

canvas.addEventListener("touchmove", e => {
  if (!gameStarted) return;
  player.y = e.touches[0].clientY - player.h / 2;
});

// ===== DIFFICULTY =====
function increaseDifficulty() {
  if (score % 5 === 0) {
    enemySpeed += 0.5;
    spawnGap -= 100;
    enemySpeed = Math.min(enemySpeed, 12);
    spawnGap = Math.max(spawnGap, 600);
  }
}

// ===== SPAWN =====
function spawnEnemy() {
  let type2 = score >= 100 && Math.random() < 0.3;
  enemies.push({
    x: canvas.width + 60,
    y: Math.random() * (canvas.height - 120),
    w: type2 ? 120 : 140,
    h: type2 ? 120 : 140,
    type: type2 ? 2 : 1
  });
}

function spawnSpeedPower() {
  speedPower = {
    x: canvas.width + 80,
    y: Math.random() * (canvas.height - 80),
    w: 60,
    h: 60
  };
}

// ===== GAME LOOP =====
function gameLoop() {
  if (!gameStarted || gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  player.y = Math.max(0, Math.min(player.y, canvas.height - player.h));

  if (speedActive) {
    ctx.save();
    ctx.shadowColor = "cyan";
    ctx.shadowBlur = 20;
  }

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  if (speedActive) ctx.restore();

  let now = Date.now();
  if (now - lastSpawn > spawnGap) {
    spawnEnemy();
    lastSpawn = now;
  }

  enemies.forEach((e, i) => {
    e.x -= enemySpeed;
    ctx.drawImage(e.type === 2 ? enemy2Img : enemyImg, e.x, e.y, e.w, e.h);

    if (
      !speedActive &&
      player.x + HITBOX_MARGIN < e.x + e.w &&
      player.x + player.w - HITBOX_MARGIN > e.x &&
      player.y + HITBOX_MARGIN < e.y + e.h &&
      player.y + player.h - HITBOX_MARGIN > e.y
    ) endGame();

    if (e.x + e.w < 0) {
      enemies.splice(i, 1);
      score++;
      increaseDifficulty();
      if ([50, 185, 300].includes(score)) spawnSpeedPower();
    }
  });

  if (speedPower && !speedActive) {
    speedPower.x -= 4;
    ctx.drawImage(speedImg, speedPower.x, speedPower.y, speedPower.w, speedPower.h);

    if (
      player.x < speedPower.x + speedPower.w &&
      player.x + player.w > speedPower.x &&
      player.y < speedPower.y + speedPower.h &&
      player.y + player.h > speedPower.y
    ) {
      speedActive = true;
      speedTimer = Date.now();
      playerSpeed = 45;
      speedPower = null;
      boostSound.play();
    }
  }

  if (speedActive && Date.now() - speedTimer > 10000) {
    speedActive = false;
    playerSpeed = 25;
  }

  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);

  requestAnimationFrame(gameLoop);
}

// ===== GAME OVER =====
function endGame() {
  gameOver = true;
  gameOverSound.play();

  // High score update
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("skyFlyHighScore", highScore);
  }

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "36px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 110, canvas.height / 2);

  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, canvas.width / 2 - 50, canvas.height / 2 + 40);

  ctx.fillText("High Score: " + highScore, canvas.width / 2 - 75, canvas.height / 2 + 80);

  ctx.font = "18px Arial";
  ctx.fillText("Click / Tap to Restart", canvas.width / 2 - 90, canvas.height / 2 + 120);

  canvas.addEventListener("click", () => location.reload(), { once: true });
  canvas.addEventListener("touchstart", () => location.reload(), { once: true });
}

// ===== START BUTTON =====
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  canvas.style.display = "block";

  resizeCanvas();   // canvas size correct kare

  // BG MUSIC START
  bgMusic.volume = 0.3;
  bgMusic.play().then(() => {
    console.log("BG Music playing");
  }).catch(err => {
    console.log("BG Music blocked: ", err);
  });

  // GAME START
  gameStarted = true;
  requestAnimationFrame(gameLoop);
  
});

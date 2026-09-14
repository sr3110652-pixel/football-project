// Player detail: more hairstyles, boots color and customization UI
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const ratio = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  canvas.width = Math.floor(cssW * ratio);
  canvas.height = Math.floor(cssH * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

const G = {
  width: canvas.clientWidth,
  height: canvas.clientHeight,
  fieldPadding: 20,
  goalWidth: 10,
  matchDurationSec: 60 // 1 minute matches
};

let leftScore = 0;
let rightScore = 0;

const playerH = 90;
const playerW = 14;
const speedBase = 6;

const left = { x: 60, y: (canvas.clientHeight - playerH)/2, w: playerW, h: playerH, vy: 0 };
const right = { x: canvas.clientWidth - 60 - playerW, y: (canvas.clientHeight - playerH)/2, w: playerW, h: playerH, vy: 0 };

const ball = { x: canvas.clientWidth/2, y: canvas.clientHeight/2, r: 10, vx: 6 * (Math.random() > 0.5 ? 1 : -1), vy: 2*(Math.random()-0.5) };

let keys = {};
let running = false;
let paused = false;
let lastTick = performance.now();
let matchEndTime = null; // timestamp when match ends
let inMatch = false;
let gameMode = 'arcade'; // 'arcade' or 'career'

// Career data and persistence
const CAREER_KEY = 'footballCareer_v1';
let career = null; // will be object when in career mode

function defaultCareer() {
  return {
    name: 'Risers',
    season: 1,
    matchPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    xp: 0,
    coins: 0,
    upgrades: {
      paddleSize: 0, // each level adds to paddle height
      speed: 0,      // multiplies movement speed
      kickPower: 0   // increases ball vx multiplier
    }
  };
}

function saveCareer() {
  if (!career) return;
  localStorage.setItem(CAREER_KEY, JSON.stringify(career));
}
function loadCareer() {
  const raw = localStorage.getItem(CAREER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch(e){ return null; }
}

// Player avatars with more detail
const playerAvatar = {
  name: 'You',
  color: '#ffd700',
  shirt: '#1e90ff',
  shorts: '#ffffff',
  socks: '#1e90ff',
  boots: '#222222',
  hairstyle: 'short', // options: short, long, mohawk, afro, bald
  skin: '#f1c27d',
  kickCooldownMS: 900,
  lastKick: 0
};
const opponentAvatar = {
  name: 'Rivals',
  color: '#ff6b6b',
  shirt: '#ff6b6b',
  shorts: '#ffffff',
  socks: '#ff6b6b',
  boots: '#ff0000',
  hairstyle: 'mohawk',
  skin: '#e0ac69'
};

// UI hooks
const startBtn = document.getElementById('startBtn');
const careerBtn = document.getElementById('careerBtn');
const setNameBtn = document.getElementById('setNameBtn');
const customizeBtn = document.getElementById('customizeBtn');
const randomizeOppBtn = document.getElementById('randomizeOppBtn');
const careerOverlay = document.getElementById('careerOverlay');
const newCareerBtn = document.getElementById('newCareerBtn');
const continueBtn = document.getElementById('continueBtn');
const backFromCareer = document.getElementById('backFromCareer');
const careerMain = document.getElementById('careerMain');
const careerScreen = document.getElementById('careerScreen');
const careerInfo = document.getElementById('careerInfo');
const careerHeader = document.getElementById('careerHeader');
const seasonStats = document.getElementById('seasonStats');
const upgradePanel = document.getElementById('upgradePanel');
const playMatchBtn = document.getElementById('playMatchBtn');
const saveCareerBtn = document.getElementById('saveCareerBtn');
const resetCareerBtn = document.getElementById('resetCareerBtn');
const exitCareerBtn = document.getElementById('exitCareerBtn');
const matchResult = document.getElementById('matchResult');
const matchSummary = document.getElementById('matchSummary');
const continueAfterMatch = document.getElementById('continueAfterMatch');

// touch controls
const touchControls = document.getElementById('touchControls');
const leftUpBtn = document.getElementById('leftUp');
const leftDownBtn = document.getElementById('leftDown');
const leftKickBtn = document.getElementById('leftKick');
const rightUpBtn = document.getElementById('rightUp');
const rightDownBtn = document.getElementById('rightDown');
const rightKickBtn = document.getElementById('rightKick');

startBtn.addEventListener('click', () => { gameMode='arcade'; start(); });
careerBtn.addEventListener('click', openCareerOverlay);
setNameBtn.addEventListener('click', ()=>{ const n = prompt('Enter player name:', playerAvatar.name); if(n) { playerAvatar.name = n; } });
customizeBtn.addEventListener('click', openCustomizePrompt);
randomizeOppBtn.addEventListener('click', ()=>{ randomizeOpponent(); });
newCareerBtn.addEventListener('click', () => { career = defaultCareer(); openCareerScreen(); });
continueBtn.addEventListener('click', ()=>{ career = loadCareer() || defaultCareer(); openCareerScreen(); });
backFromCareer.addEventListener('click', closeCareerOverlay);
playMatchBtn.addEventListener('click', () => { if (career) { gameMode='career'; startCareerMatch(); } });
saveCareerBtn.addEventListener('click', () => { saveCareer(); alert('Career saved'); });
resetCareerBtn.addEventListener('click', ()=>{ if(confirm('Reset career?')){ localStorage.removeItem(CAREER_KEY); career = defaultCareer(); renderCareer(); } });
exitCareerBtn.addEventListener('click', closeCareerOverlay);
continueAfterMatch.addEventListener('click', ()=>{ matchResult.classList.add('hidden'); openCareerScreen(); });

// touch button handlers
function setupTouchControls(){
  if (window.innerWidth <= 720) touchControls.classList.remove('hidden');
  else touchControls.classList.add('hidden');

  leftUpBtn.addEventListener('pointerdown', ()=>{ left.vy = -speedBase; });
  leftUpBtn.addEventListener('pointerup', ()=>{ left.vy = 0; });
  leftDownBtn.addEventListener('pointerdown', ()=>{ left.vy = speedBase; });
  leftDownBtn.addEventListener('pointerup', ()=>{ left.vy = 0; });
  leftKickBtn.addEventListener('pointerdown', ()=>{ attemptSpecialKick(); });

  rightUpBtn.addEventListener('pointerdown', ()=>{ right.vy = -speedBase; });
  rightUpBtn.addEventListener('pointerup', ()=>{ right.vy = 0; });
  rightDownBtn.addEventListener('pointerdown', ()=>{ right.vy = speedBase; });
  rightDownBtn.addEventListener('pointerup', ()=>{ right.vy = 0; });
  rightKickBtn.addEventListener('pointerdown', ()=>{ attemptSpecialKick(true); });

  [leftUpBtn,leftDownBtn,rightUpBtn,rightDownBtn].forEach(b => {
    b.addEventListener('pointerleave', ()=>{ left.vy = 0; right.vy=0; });
  });
}
setupTouchControls();
window.addEventListener('resize', setupTouchControls);

// Keyboard
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') { paused = !paused; }
  if (e.key.toLowerCase() === 'r') { resetScores(); }
  if (e.key.toLowerCase() === 'd') { attemptSpecialKick(); }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

function openCareerOverlay(){
  careerOverlay.classList.remove('hidden');
  careerMain.classList.remove('hidden');
  careerScreen.classList.add('hidden');
  matchResult.classList.add('hidden');
  const saved = loadCareer();
  careerInfo.innerHTML = saved ? `<div>Saved career: ${saved.name} — Season ${saved.season}, XP ${saved.xp}, Coins ${saved.coins}</div>` : '<div>No saved career found.</div>';
}
function closeCareerOverlay(){ careerOverlay.classList.add('hidden'); }

function openCareerScreen(){
  careerMain.classList.add('hidden');
  careerScreen.classList.remove('hidden');
  renderCareer();
}

function renderCareer(){
  if (!career) career = defaultCareer();
  careerHeader.innerHTML = `<strong>Team:</strong> ${career.name} — <strong>Season</strong> ${career.season}`;
  seasonStats.innerHTML = `
    <div>Matches played: ${career.matchPlayed}</div>
    <div>W/D/L: ${career.wins}/${career.draws}/${career.losses}</div>
    <div>XP: ${career.xp} — Coins: ${career.coins}</div>
  `;

  // upgrades
  upgradePanel.innerHTML = '<h4>Upgrades</h4>';
  const ulist = document.createElement('div');

  const upgrades = [
    { key: 'paddleSize', name: 'Paddle Size', cost: 5, desc: '+10% height per level' },
    { key: 'speed', name: 'Movement Speed', cost: 6, desc: '+10% speed per level' },
    { key: 'kickPower', name: 'Kick Power', cost: 8, desc: '+10% kick per level' }
  ];

  upgrades.forEach(u => {
    const el = document.createElement('div');
    el.className = 'upgrade';
    el.innerHTML = `<div><strong>${u.name}</strong><div style="font-size:12px;color:#dfe;">${u.desc}</div></div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div>Lv ${career.upgrades[u.key]}</div>`;
    const btn = document.createElement('button');
    btn.textContent = `Buy (${u.cost} XP)`;
    btn.disabled = career.xp < u.cost;
    btn.addEventListener('click', ()=>{ if(career.xp>=u.cost){ career.xp -= u.cost; career.upgrades[u.key]++; saveCareer(); renderCareer(); } });
    right.appendChild(btn);
    el.appendChild(right);
    ulist.appendChild(el);
  });

  upgradePanel.appendChild(ulist);
}

// Simple customize prompt (keeps UI small)
function openCustomizePrompt(){
  const hairstyle = prompt('Choose hairstyle: short, long, mohawk, afro, bald', playerAvatar.hairstyle) || playerAvatar.hairstyle;
  const boots = prompt('Enter boots color (name or hex), e.g. red or #ffcc00', playerAvatar.boots) || playerAvatar.boots;
  const skin = prompt('Enter skin tone (hex), e.g. #f1c27d', playerAvatar.skin) || playerAvatar.skin;
  playerAvatar.hairstyle = hairstyle;
  playerAvatar.boots = boots;
  playerAvatar.skin = skin;
}

function randomizeOpponent(){
  const hair = randomChoice(['short','long','mohawk','afro','bald']);
  const boots = randomChoice(['#ff0000','#222222','#00b894','#6c5ce7','#ffbe76']);
  const skin = randomChoice(['#e0ac69','#f1c27d','#d08b5b','#c68642']);
  opponentAvatar.hairstyle = hair;
  opponentAvatar.boots = boots;
  opponentAvatar.skin = skin;
}

function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Game control
function start() {
  running = true;
  paused = false;
  leftScore = 0; rightScore = 0;
  updateScoreUI();
  resetBall();
  inMatch = true;
  matchEndTime = null; // unset for arcade
  lastTick = performance.now();
  loop();
}

function startCareerMatch(){
  running = true;
  paused = false;
  leftScore = 0; rightScore = 0;
  updateScoreUI();
  resetBall();
  inMatch = true;
  matchEndTime = Date.now() + G.matchDurationSec * 1000;
  lastTick = performance.now();
  loop();
}

function endCareerMatch(){
  inMatch = false;
  running = false;
  // decide result
  let result = 'draw';
  if (leftScore > rightScore) result = 'win';
  else if (leftScore < rightScore) result = 'loss';

  career.matchPlayed++;
  if (result==='win') career.wins++; else if (result==='loss') career.losses++; else career.draws++;

  // reward xp and coins
  const baseXP = 2 + Math.max(0, leftScore - rightScore);
  const baseCoins = 3 + Math.max(0, leftScore - rightScore);
  if (result==='win'){ career.xp += baseXP + 3; career.coins += baseCoins + 5; }
  else if (result==='draw'){ career.xp += baseXP; career.coins += baseCoins; }
  else { career.xp += Math.max(1, Math.floor(baseXP/2)); career.coins += Math.max(1, Math.floor(baseCoins/2)); }

  saveCareer();
  showMatchResult(result);
}

function showMatchResult(result){
  matchSummary.innerHTML = `
    <div>Result: <strong>${result.toUpperCase()}</strong></div>
    <div>Score: ${leftScore} — ${rightScore}</div>
    <div>XP: ${career.xp} — Coins: ${career.coins}</div>
  `;
  careerScreen.classList.add('hidden');
  matchResult.classList.remove('hidden');
}

function resetBall(servingToRight = Math.random() > 0.5) {
  ball.x = canvas.clientWidth/2;
  ball.y = canvas.clientHeight/2;
  const s = 6;
  ball.vx = s * (servingToRight ? 1 : -1);
  ball.vy = (Math.random() - 0.5) * 4;
}

function resetScores() {
  leftScore = 0; rightScore = 0;
  updateScoreUI();
  resetBall();
}

function updateScoreUI() {
  document.getElementById('leftScore').textContent = leftScore;
  document.getElementById('rightScore').textContent = rightScore;
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function attemptSpecialKick(forOpponent=false){
  const now = Date.now();
  if (!forOpponent && now - playerAvatar.lastKick < playerAvatar.kickCooldownMS) return; // cooling down
  const targetP = forOpponent ? right : left;
  const inXRange = forOpponent ? (ball.x + ball.r > right.x - 24) : (ball.x - ball.r < left.x + left.w + 24);
  const inYRange = ball.y > targetP.y - 6 && ball.y < targetP.y + targetP.h + 6;
  if (inXRange && inYRange) {
    if (!forOpponent) playerAvatar.lastKick = now;
    const power = 8 + (career ? (career.upgrades.kickPower * 0.5) : 0);
    ball.vx = (forOpponent ? -1 : 1) * Math.max(Math.abs(ball.vx), power);
    ball.vy += (Math.random()-0.5) * 4;
  }
}

function physicsStep(dt) {
  const plySpeed = speedBase * (1 + (career ? (career.upgrades.speed * 0.1) : 0));
  if (keys['w'] || keys['W']) left.vy = -plySpeed;
  else if (keys['s'] || keys['S']) left.vy = plySpeed;
  else if (left.vy === undefined) left.vy = 0;

  if (keys['ArrowUp']) right.vy = -speedBase;
  else if (keys['ArrowDown']) right.vy = speedBase;
  else if (right.vy === undefined) right.vy = 0;

  left.y = clamp(left.y + left.vy, G.fieldPadding, canvas.clientHeight - left.h - G.fieldPadding);
  right.y = clamp(right.y + right.vy, G.fieldPadding, canvas.clientHeight - right.h - G.fieldPadding);

  const sizeBonus = career ? 1 + (career.upgrades.paddleSize * 0.1) : 1;
  left.h = playerH * sizeBonus;
  right.h = playerH;

  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.r < G.fieldPadding) {
    ball.y = G.fieldPadding + ball.r;
    ball.vy *= -1;
  } else if (ball.y + ball.r > canvas.clientHeight - G.fieldPadding) {
    ball.y = canvas.clientHeight - G.fieldPadding - ball.r;
    ball.vy *= -1;
  }

  function hitPlayer(p) {
    const nearestX = clamp(ball.x, p.x, p.x + p.w);
    const nearestY = clamp(ball.y, p.y, p.y + p.h);
    const dx = ball.x - nearestX;
    const dy = ball.y - nearestY;
    return (dx*dx + dy*dy) <= (ball.r * ball.r);
  }

  if (hitPlayer(left) && ball.vx < 0) {
    ball.x = left.x + left.w + ball.r;
    ball.vx = -ball.vx * 1.08 * (1 + (career ? career.upgrades.kickPower*0.1 : 0));
    const hitPos = (ball.y - (left.y + left.h/2)) / (left.h/2);
    ball.vy += hitPos * 3;
  } else if (hitPlayer(right) && ball.vx > 0) {
    ball.x = right.x - ball.r;
    ball.vx = -ball.vx * 1.02;
    const hitPos = (ball.y - (right.y + right.h/2)) / (right.h/2);
    ball.vy += hitPos * 3;
  }

  if (ball.x - ball.r < 0) {
    rightScore++;
    updateScoreUI();
    resetBall(true);
  } else if (ball.x + ball.r > canvas.clientWidth) {
    leftScore++;
    updateScoreUI();
    resetBall(false);
  }

  const maxV = 18;
  ball.vx = clamp(ball.vx, -maxV, maxV);
  ball.vy = clamp(ball.vy, -maxV, maxV);

  const aiSpeed = 4.5;
  const centerY = right.y + right.h/2;
  if (ball.x > canvas.clientWidth*0.4) {
    if (ball.y < centerY - 6) right.y -= aiSpeed;
    else if (ball.y > centerY + 6) right.y += aiSpeed;
  }
  right.y = clamp(right.y, G.fieldPadding, canvas.clientHeight - right.h - G.fieldPadding);
}

function drawField() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.fillStyle = '#0d6b2a';
  ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = '#ffffff88';
  ctx.lineWidth = 3;
  ctx.strokeRect(G.fieldPadding/2, G.fieldPadding/2, w - G.fieldPadding, h - G.fieldPadding);
  ctx.beginPath();
  ctx.moveTo(w/2, G.fieldPadding);
  ctx.lineTo(w/2, h - G.fieldPadding);
  ctx.stroke();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.arc(w/2, h/2, 70, 0, Math.PI*2);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffffaa';
  ctx.beginPath();
  ctx.moveTo(0, h*0.35);
  ctx.lineTo(0, h*0.65);
  ctx.moveTo(w, h*0.35);
  ctx.lineTo(w, h*0.65);
  ctx.stroke();
}

function draw() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  drawField();
  ctx.fillStyle = '#f2f2f2';
  roundRect(ctx, left.x, left.y, left.w, left.h, 6, true, false);
  roundRect(ctx, right.x, right.y, right.w, right.h, 6, true, false);
  drawAvatar(left, playerAvatar);
  drawAvatar(right, opponentAvatar);
  ctx.beginPath();
  ctx.fillStyle = '#ffffff';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();
  if (gameMode === 'career' && matchEndTime) {
    const remaining = Math.max(0, Math.round((matchEndTime - Date.now())/1000));
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${remaining}s`, canvas.clientWidth/2 - 40, 30);
  }
}

function drawAvatar(paddle, avatar){
  const centerX = paddle.x + paddle.w/2;
  const headY = paddle.y + 18;
  // head (skin)
  ctx.beginPath();
  ctx.fillStyle = avatar.skin || '#f1c27d';
  ctx.arc(centerX + (paddle===left?6:-6), headY, 10, 0, Math.PI*2);
  ctx.fill();

  // hair variants
  const hairX = centerX + (paddle===left?6:-6);
  const hairY = headY - 8;
  ctx.fillStyle = avatar.color;
  if (avatar.hairstyle === 'short'){
    ctx.beginPath(); ctx.ellipse(hairX, hairY, 11, 6, 0, 0, Math.PI*2); ctx.fill();
  } else if (avatar.hairstyle === 'long'){
    ctx.beginPath(); ctx.ellipse(hairX, hairY+4, 12, 14, 0, 0, Math.PI*2); ctx.fill();
  } else if (avatar.hairstyle === 'mohawk'){
    ctx.beginPath(); ctx.moveTo(hairX-8, hairY+4); ctx.lineTo(hairX, hairY-10); ctx.lineTo(hairX+8, hairY+4); ctx.closePath(); ctx.fill();
  } else if (avatar.hairstyle === 'afro'){
    ctx.beginPath(); ctx.arc(hairX, hairY, 14, 0, Math.PI*2); ctx.fill();
  } // bald -> no hair

  // torso
  ctx.fillStyle = avatar.shirt;
  ctx.fillRect(centerX - 10 + (paddle===left?6:-6), headY + 10, 20, 26);
  // shorts
  ctx.fillStyle = avatar.shorts;
  ctx.fillRect(centerX - 10 + (paddle===left?6:-6), headY + 34, 20, 12);
  // socks
  ctx.fillStyle = avatar.socks;
  ctx.fillRect(centerX - 10 + (paddle===left?6:-6), headY + 46, 20, 8);
  // boots (two small rectangles with boots color)
  ctx.fillStyle = avatar.boots || '#222';
  ctx.fillRect(centerX - 10 + (paddle===left?6:-6), headY + 54, 8, 6);
  ctx.fillRect(centerX + 2 + (paddle===left?6:-6), headY + 54, 8, 6);

  // name
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  const nameX = paddle===left ? paddle.x : paddle.x - 6;
  ctx.fillText(avatar.name, nameX, paddle.y - 6);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === 'undefined') r = 5;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function loop(now){
  if (!running) return;
  const dt = Math.min(40, now - lastTick);
  lastTick = now;
  if (!paused) {
    physicsStep(dt);
    draw();
  }
  if (gameMode === 'career' && matchEndTime && Date.now() >= matchEndTime && inMatch) {
    endCareerMatch();
  }
  requestAnimationFrame(loop);
}

// Initialize
resize();
resetBall();
draw();

// Expose for debugging in console
window.game = { left, right, ball, start, resetScores, pause: () => { paused = true }, resume: () => { paused = false }, career, playerAvatar, opponentAvatar };

// Save career when page unloads
window.addEventListener('beforeunload', ()=>{ if (career) saveCareer(); });

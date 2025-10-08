const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], enemyBullets = [];
let player, score = 0, lives = 3, level = 1, running = false;

// Player
class Player {
constructor() { this.x = W/2; this.y = H-50; this.r = 20; this.cool = 0; }
draw() {
ctx.fillStyle = "cyan";
ctx.beginPath();
ctx.moveTo(this.x, this.y-20);
ctx.lineTo(this.x-20, this.y+20);
ctx.lineTo(this.x+20, this.y+20);
ctx.closePath(); ctx.fill();
}
update(dt) {
if(keys["ArrowLeft"] && this.x>20) this.x -= 300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x += 300*dt;
if(keys["Space"] && this.cool<=0) {
bullets.push(new Bullet(this.x,this.y-20,-500,"lime")); // player bullet upward
this.cool = 0.25;
}
if(this.cool>0) this.cool -= dt;
}
}

// Bullet
class Bullet {
constructor(x,y,speed,color){
this.x=x; this.y=y; this.r=5; this.dead=false; this.speed=speed; this.color=color;
}
update(dt){
this.y += this.speed*dt;
if(this.y<0 || this.y>H) this.dead=true;
}
draw(){
ctx.fillStyle=this.color;
ctx.fillRect(this.x-2,this.y-10,4,10);
}
}

// Enemy
class Enemy {
constructor(x,y){ this.x=x; this.y=y; this.r=18; this.dead=false; this.cool=Math.random()*2; }
update(dt){
this.y += 40*dt;
this.cool -= dt;
if(this.cool<=0){
enemyBullets.push(new Bullet(this.x,this.y+10,300,"red")); // enemy bullet downward
this.cool = 2 + Math.random()*2;
}
if(this.y>H+20) this.dead=true;
}
draw(){
ctx.fillStyle="red";
ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
}
}

// Setup
function resetGame(){
player = new Player();
bullets=[]; enemies=[]; enemyBullets=[];
score=0; lives=3; level=1;
}

function startGame(){
resetGame();
running = true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now();
requestAnimationFrame(loop);
}

function gameOver(win=false){
running = false;
let title = win ? "You Win! 🏆" : "Game Over";
let msg = win ? "Congrats! Final Score: "+score : "Final Score: "+score;
document.getElementById("ovTitle").textContent=title;
document.getElementById("ovMsg").textContent=msg;
document.getElementById("overlay").classList.remove("hidden");
}

// Loop
let lastTime=0, spawnTimer=0;
const WIN_SCORE = 500;

function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

// Update
player.update(dt);
bullets.forEach(b=>b.update(dt));
enemyBullets.forEach(b=>b.update(dt));
enemies.forEach(e=>e.update(dt));

// Collisions: player bullets hit enemies
for(let e of enemies){
for(let b of bullets){
if(!b.dead && !e.dead){
let dx=b.x-e.x, dy=b.y-e.y;
if(dx*dx+dy*dy < (b.r+e.r)**2){
b.dead=true; e.dead=true; score+=10;
if(score>=WIN_SCORE) return gameOver(true);
}
}
}
// Enemy hits player
let dx=player.x-e.x, dy=player.y-e.y;
if(dx*dx+dy*dy < (player.r+e.r)**2){
e.dead=true; lives--;
if(lives<=0) return gameOver();
}
}

// Enemy bullets hit player
for(let b of enemyBullets){
let dx=player.x-b.x, dy=player.y-b.y;
if(dx*dx+dy*dy < (player.r+b.r)**2){
b.dead=true; lives--;
if(lives<=0) return gameOver();
}
}

// Spawn enemies
spawnTimer-=dt;
if(spawnTimer<=0){
enemies.push(new Enemy(Math.random()*(W-40)+20, -20));
spawnTimer = Math.max(0.8, 2 - level*0.1);
}

// Clean up
bullets=bullets.filter(b=>!b.dead);
enemyBullets=enemyBullets.filter(b=>!b.dead);
enemies=enemies.filter(e=>!e.dead);

// Draw
ctx.clearRect(0,0,W,H);
player.draw();
bullets.forEach(b=>b.draw());
enemyBullets.forEach(b=>b.draw());
enemies.forEach(e=>e.draw());

// HUD
document.getElementById("score").textContent=score;
document.getElementById("lives").textContent=lives;
document.getElementById("level").textContent=level;

requestAnimationFrame(loop);
}

// Input
document.addEventListener("keydown",e=>keys[e.code]=true);
document.addEventListener("keyup",e=>keys[e.code]=false);

// Buttons
document.getElementById("btnStart").onclick=startGame;
document.getElementById("btnRestart").onclick=startGame;
document.getElementById("ovBtn").onclick=startGame;
document.getElementById("btnPause").onclick=()=>running=!running;
// Keyboard controls
let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

function updatePlayer() {
if (keys["ArrowLeft"]) player.x -= 5;
if (keys["ArrowRight"]) player.x += 5;
if (keys["ArrowUp"]) player.y -= 5; // move forward
if (keys["ArrowDown"]) player.y += 5; // move backward

// keep inside canvas
player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
}
// Load sprites
const playerImg = document.getElementById("playerSprite");
const enemyImg = document.getElementById("enemySprite");
const bulletImg = document.getElementById("bulletSprite");

// Player draw
player.draw = function() {
ctx.drawImage(playerImg, this.x, this.y, this.w, this.h);
};

// Enemy draw
enemy.draw = function() {
ctx.drawImage(enemyImg, this.x, this.y, this.w, this.h);
};

// Bullet draw
bullet.draw = function() {
ctx.drawImage(bulletImg, this.x, this.y, this.w, this.h);
};

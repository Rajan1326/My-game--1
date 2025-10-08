const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], enemyBullets = [];
let player, score = 0, lives = 3, level = 1, running = false;

const WIN_SCORE = 200; // score needed to win

// --- Player ---
class Player {
constructor() { this.x = W/2; this.y = H-80; this.r = 18; this.cool = 0; }
draw() {
ctx.fillStyle = "#00e5ff";
ctx.beginPath();
ctx.moveTo(this.x, this.y-20);
ctx.lineTo(this.x-20, this.y+20);
ctx.lineTo(this.x+20, this.y+20);
ctx.closePath();
ctx.fill();
ctx.fillStyle = "#fff";
ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI*2); ctx.fill();
}
update(dt) {
if(keys["ArrowLeft"] && this.x > 20) this.x -= 300*dt;
if(keys["ArrowRight"] && this.x < W-20) this.x += 300*dt;
if(keys["ArrowUp"] && this.y > 20) this.y -= 300*dt;
if(keys["ArrowDown"] && this.y < H-20) this.y += 300*dt;
if(keys["Space"] && this.cool <= 0) {
bullets.push(new Bullet(this.x, this.y-20, -500, "lime"));
this.cool = 0.25;
}
if(this.cool > 0) this.cool -= dt;
}
}

// --- Bullet ---
class Bullet {
constructor(x,y,speed,color){ this.x=x; this.y=y; this.r=5; this.dead=false; this.speed=speed; this.color=color; }
update(dt){ this.y += this.speed*dt; if(this.y<0||this.y>H) this.dead=true; }
draw(){ ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

// --- Enemy ---
class Enemy {
constructor(x,y){ this.x=x; this.y=y; this.r=18; this.dead=false; this.cool=Math.random()*2; }
update(dt){
this.y += 40*dt;
this.cool -= dt;
if(this.cool<=0){
enemyBullets.push(new Bullet(this.x,this.y+10,300,"red"));
this.cool = 2 + Math.random()*2;
}
if(this.y>H+20) this.dead=true;
}
draw(){ ctx.fillStyle="red"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); }
}

// --- Game setup ---
function resetGame(){ player=new Player(); bullets=[]; enemies=[]; enemyBullets=[]; score=0; lives=3; level=1; }
function startGame(){ resetGame(); running=true; document.getElementById("overlay").classList.add("hidden"); lastTime=performance.now(); requestAnimationFrame(loop); }
function gameOver(win=false){
running=false;
document.getElementById("ovTitle").textContent = win ? "You Win! 🏆" : "Game Over";
document.getElementById("ovMsg").textContent = "Final Score: "+score;
document.getElementById("overlay").classList.remove("hidden");
}

// --- Loop ---
let lastTime=0, spawnTimer=0;
function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

player.update(dt);
bullets.forEach(b=>b.update(dt));
enemyBullets.forEach(b=>b.update(dt));
enemies.forEach(e=>e.update(dt));

// Collisions
for(let e of enemies){
for(let b of bullets){
if(!b.dead && !e.dead){
let dx=b.x-e.x, dy=b.y-e.y;
if(dx*dx+dy*dy < (b.r+e.r)**2){ b.dead=true; e.dead=true; score+=10; if(score>=WIN_SCORE) return gameOver(true); }
}
}
let dx=player.x-e.x, dy=player.y-e.y;
if(dx*dx+dy*dy < (player.r+e.r)**2){ e.dead=true; lives--; if(lives<=0) return gameOver(); }
}
for(let b of enemyBullets){
let dx=player.x-b.x, dy=player.y-b.y;
if(dx*dx+dy*dy < (player.r+b.r)**2){ b.dead=true; lives--; if(lives<=0) return gameOver(); }
}

// Spawn enemies
spawnTimer-=dt;
if(spawnTimer<=0){ enemies.push(new Enemy(Math.random()*(W-40)+20,-20)); spawnTimer=1.5; }

// Cleanup
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

// --- Input ---
document.addEventListener("keydown", e=>keys[e.code]=true);
document.addEventListener("keyup", e=>keys[e.code]=false);

// --- Buttons ---
document.getElementById("btnStart").onclick=startGame;
document.getElementById("btnRestart").onclick=startGame;
document.getElementById("ovBtn").onclick=startGame;
document.getElementById("btnPause").onclick=()=>running=!running;

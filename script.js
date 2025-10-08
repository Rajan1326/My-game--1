const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemies = [], enemyBullets = [], stars = [], powerUps = [], trophy = null;
let player, score = 0, lives = 3, level = 1, running = false;
let powerUpsSpawned = 0;
let roundWon = false; // track stage 1 win
let finalWin = false;

const FIRST_TROPHY_SCORE = 200;
const FINAL_TROPHY_SCORE = 500;
const MAX_POWERUPS = 7;

// --- Starfield background ---
class Star {
constructor(){ this.reset(); }
reset(){ this.x=Math.random()*W; this.y=Math.random()*H; this.size=Math.random()*2; this.speed=20+Math.random()*60; }
update(dt){ this.y+=this.speed*dt; if(this.y>H){ this.y=0; this.x=Math.random()*W; } }
draw(){ ctx.fillStyle="white"; ctx.fillRect(this.x,this.y,this.size,this.size); }
}

// --- Player ---
class Player {
constructor(){ this.x=W/2; this.y=H-80; this.r=18; this.cool=0; }
draw(){
ctx.fillStyle="#00e5ff";
ctx.beginPath();
ctx.moveTo(this.x,this.y-20);
ctx.lineTo(this.x-20,this.y+20);
ctx.lineTo(this.x+20,this.y+20);
ctx.closePath(); ctx.fill();
ctx.fillStyle="#fff";
ctx.beginPath(); ctx.arc(this.x,this.y,6,0,Math.PI*2); ctx.fill();
}
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
if(keys["Space"] && this.cool<=0){
bullets.push(new Bullet(this.x,this.y-20,-500,"lime"));
this.cool=0.25;
}
if(this.cool>0) this.cool-=dt;
}
}

// --- Bullet ---
class Bullet {
constructor(x,y,speed,color){ this.x=x; this.y=y; this.r=4; this.dead=false; this.speed=speed; this.color=color; }
update(dt){ this.y+=this.speed*dt; if(this.y<0||this.y>H) this.dead=true; }
draw(){ ctx.fillStyle=this.color; ctx.fillRect(this.x-2,this.y-8,4,12); }
}

// --- Enemy ---
class Enemy {
constructor(x,y){ this.x=x; this.y=y; this.r=18; this.dead=false; this.cool=Math.random()*2; }
update(dt){
this.y+= (40+level*15)*dt;
this.cool-=dt;
if(this.cool<=0){
enemyBullets.push(new Bullet(this.x,this.y+10,200+level*30,"red"));
this.cool=2+Math.random()*2;
}
if(this.y>H+20) this.dead=true;
}
draw(){
ctx.fillStyle = level===1 ? "red" : "purple";
ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
}
}

// --- PowerUp (Extra Life) ---
class PowerUp {
constructor(x,y){ this.x=x; this.y=y; this.r=12; this.dead=false; }
update(dt){ this.y+=80*dt; if(this.y>H+20) this.dead=true; }
draw(){
ctx.fillStyle="pink";
ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
ctx.fillStyle="white"; ctx.font="12px sans-serif"; ctx.fillText("❤", this.x-6, this.y+4);
}
}

// --- Trophy (Final Win) ---
class Trophy {
constructor(){ this.x=W/2; this.y=-40; this.r=20; this.dead=false; }
update(dt){ this.y+=60*dt; if(this.y>H+40) this.dead=true; }
draw(){
ctx.fillStyle="gold";
ctx.beginPath();
ctx.moveTo(this.x-20,this.y+20);
ctx.lineTo(this.x+20,this.y+20);
ctx.lineTo(this.x+10,this.y-20);
ctx.lineTo(this.x-10,this.y-20);
ctx.closePath(); ctx.fill();
ctx.fillStyle="black";
ctx.font="16px sans-serif";
ctx.fillText("🏆", this.x-10, this.y+6);
}
}

// --- Setup ---
function resetGame(){
player=new Player();
bullets=[]; enemies=[]; enemyBullets=[]; powerUps=[]; trophy=null;
score=0; lives=3; level=1; powerUpsSpawned=0; roundWon=false; finalWin=false;
stars=[...Array(80)].map(()=>new Star());
}

function startGame(){
if(roundWon){ // start Level 2
level=2;
score=FIRST_TROPHY_SCORE; // continue score
roundWon=false;
} else {
resetGame();
}
running=true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now();
requestAnimationFrame(loop);
}

function gameOver(win=false, final=false){
running=false;
if(final){
document.getElementById("ovTitle").textContent="Final Victory!";
document.getElementById("ovMsg").textContent="You collected the big trophy! Score: "+score;
} else if(win){
document.getElementById("ovTitle").textContent="You Win Round 1 🏆";
document.getElementById("ovMsg").textContent="Level up unlocked!";
roundWon=true;
} else {
document.getElementById("ovTitle").textContent="Game Over";
document.getElementById("ovMsg").textContent="Final Score: "+score;
}
document.getElementById("overlay").classList.remove("hidden");
}

// --- Loop ---
let lastTime=0, spawnTimer=0, powerTimer=10;
function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

// Update
player.update(dt);
bullets.forEach(b=>b.update(dt));
enemyBullets.forEach(b=>b.update(dt));
enemies.forEach(e=>e.update(dt));
stars.forEach(s=>s.update(dt));
powerUps.forEach(p=>p.update(dt));
if(trophy) trophy.update(dt);

// Collisions
for(let e of enemies){
for(let b of bullets){
if(!b.dead && !e.dead){
let dx=b.x-e.x, dy=b.y-e.y;
if(dx*dx+dy*dy < (b.r+e.r)**2){
b.dead=true; e.dead=true; score+=10;
if(score>=FIRST_TROPHY_SCORE && !roundWon && level===1) return gameOver(true);
if(score>=FINAL_TROPHY_SCORE && !trophy && level===2) trophy=new Trophy();
}
}
}
let dx=player.x-e.x, dy=player.y-e.y;
if(dx*dx+dy*dy < (player.r+e.r)**2){ e.dead=true; lives--; if(lives<=0) return gameOver(); }
}
for(let b of enemyBullets){
let dx=player.x-b.x, dy=player.y-b.y;
if(dx*dx+dy*dy < (player.r+b.r)**2){ b.dead=true; lives--; if(lives<=0) return gameOver(); }
}
for(let p of powerUps){
let dx=player.x-p.x, dy=player.y-p.y;
if(dx*dx+dy*dy < (player.r+p.r)**2){ p.dead=true; lives++; }
}
if(trophy){
let dx=player.x-trophy.x, dy=player.y-trophy.y;
if(dx*dx+dy*dy < (player.r+trophy.r)**2){ return gameOver(true,true); }
}

// Spawn enemies
spawnTimer-=dt;
if(spawnTimer<=0){ enemies.push(new Enemy(Math.random()*(W-40)+20,-20)); spawnTimer=1.2; }

// Spawn powerups (max 7 per match)
powerTimer-=dt;
if(powerTimer<=0 && powerUpsSpawned<MAX_POWERUPS){
powerUps.push(new PowerUp(Math.random()*(W-40)+20,-20));
powerUpsSpawned++; powerTimer=20;
}

// Cleanup
bullets=bullets.filter(b=>!b.dead);
enemyBullets=enemyBullets.filter(b=>!b.dead);
enemies=enemies.filter(e=>!e.dead);
powerUps=powerUps.filter(p=>!p.dead);
if(trophy && trophy.dead) trophy=null;

// Draw
ctx.clearRect(0,0,W,H);
stars.forEach(s=>s.draw());
player.draw();
bullets.forEach(b=>b.draw());
enemyBullets.forEach(b=>b.draw());
enemies.forEach(e=>e.draw());
powerUps.forEach(p=>p.draw());
if(trophy) trophy.draw();

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

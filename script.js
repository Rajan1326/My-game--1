const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

let keys = {};
let bullets = [], enemyBullets = [], stars = [], guards = [], bosses = [];
let player, score = 0, lives = 3, warriorLives = 10, running = false;
let inBossFight = false, inMothership = false, godJetMode = false;

const FIRST_TROPHY_SCORE = 200;
const BOSS_TRIGGER_SCORE = 400;
const MAX_GUARDS = 5;
const GOD_JET_HP = 10;
const BOSS_COUNT = 10;

// --- Background stars ---
class Star {
constructor(){ this.reset(); }
reset(){ this.x=Math.random()*W; this.y=Math.random()*H; this.size=Math.random()*2; this.speed=20+Math.random()*60; }
update(dt){ this.y+=this.speed*dt; if(this.y>H){ this.y=0; this.x=Math.random()*W; } }
draw(){ ctx.fillStyle="white"; ctx.fillRect(this.x,this.y,this.size,this.size); }
}

// --- Bullets ---
class Bullet {
constructor(x,y,speed,color){ this.x=x; this.y=y; this.r=4; this.dead=false; this.speed=speed; this.color=color; }
update(dt){ this.y+=this.speed*dt; if(this.y<0||this.y>H) this.dead=true; }
draw(){ ctx.fillStyle=this.color; ctx.fillRect(this.x-2,this.y-8,4,12); }
}

// --- Jet ---
class Jet {
constructor(){ this.x=W/2; this.y=H-80; this.r=18; this.cool=0; this.hp=3; }
draw(){
ctx.fillStyle="cyan";
ctx.beginPath();
ctx.moveTo(this.x,this.y-20);
ctx.lineTo(this.x-20,this.y+20);
ctx.lineTo(this.x+20,this.y+20);
ctx.closePath(); ctx.fill();

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

// --- Warrior ---
class Warrior {
constructor(){ this.x=W/2; this.y=H-60; this.r=15; this.cool=0; this.hp=10; }
draw(){
ctx.fillStyle="cyan"; ctx.fillRect(this.x-10,this.y-20,20,40);
ctx.fillStyle="white"; ctx.fillRect(this.x-6,this.y-26,12,12);
}
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=200*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=200*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=200*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=200*dt;

if(keys["Space"] && this.cool<=0){
bullets.push(new Bullet(this.x,this.y-25,-400,"yellow"));
this.cool=0.35;
}
if(this.cool>0) this.cool-=dt;
}
}

// --- Guards inside mothership ---

class Guard {
constructor(x,y){ this.x=x; this.y=y; this.r=16; this.dead=false; this.speed=80; }
update(dt){
let dx=player.x-this.x, dy=player.y-this.y, dist=Math.hypot(dx,dy);
if(dist>0){ this.x+=dx/dist*this.speed*dt; this.y+=dy/dist*this.speed*dt; }
}

draw(){
ctx.fillStyle="green"; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
}
}

// --- God Jet ---
class GodJet {
constructor(){ this.x=W/2; this.y=H-80; this.r=20; this.cool=0; this.altFire=false; this.hp=10; }

draw(){
ctx.fillStyle="gold";
ctx.beginPath();
ctx.moveTo(this.x,this.y-25);
ctx.lineTo(this.x-25,this.y+25);
ctx.lineTo(this.x+25,this.y+25);
ctx.closePath(); ctx.fill();
ctx.fillStyle="black"; ctx.fillText("God Jet", this.x-25,this.y-35);

}
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
if(keys["ShiftLeft"]) this.altFire=true; else this.altFire=false;

if(keys["Space"] && this.cool<=0){
if(this.altFire){
for(let i=-5;i<=5;i++){ bullets.push(new Bullet(this.x+ i*5,this.y-20,-500,"orange")); }
} else {
bullets.push(new Bullet(this.x,this.y-20,-600,"orange"));
}
this.cool=0.3;
}
if(this.cool>0) this.cool-=dt;
}
}

// --- Boss (for final fight) ---
class Boss {
constructor(x,y){ this.x=x; this.y=y; this.r=40; this.hp=10; this.dead=false; }
update(dt){}
draw(){
ctx.fillStyle="red"; ctx.fillRect(this.x-40,this.y-20,80,40);
ctx.fillStyle="white"; ctx.fillText(this.hp,this.x-5,this.y+5);
}
hit(){ this.hp--; if(this.hp<=0) this.dead=true; }
}

// --- Setup ---
function resetGame(){
player=new Jet();
score=0; lives=3; warriorLives=10;
bullets=[]; enemyBullets=[]; stars=[...Array(60)].map(()=>new Star());
guards=[]; bosses=[]; inMothership=false; godJetMode=false;
running=false;
}

function startGame(){
resetGame();

running=true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now();
requestAnimationFrame(loop);
}

function enterMothership(){
inMothership=true; player=new Warrior();
guards=[
new Guard(100,100), new Guard(800,100), new Guard(200,400),
new Guard(700,300), new Guard(400,200)
];
document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now();
requestAnimationFrame(loop);
}

function claimGodJet(){
inMothership=false; godJetMode=true; player=new GodJet();
bosses=[...Array(BOSS_COUNT)].map((_,i)=>new Boss(100+ i*80 % W, 100+ Math.floor(i/8)*100));

document.getElementById("overlay").classList.add("hidden");
running=true; lastTime=performance.now();
requestAnimationFrame(loop);
}

// --- Main Loop ---
let lastTime=0;

function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

player.update(dt);
bullets.forEach(b=>b.update(dt));
stars.forEach(s=>s.update(dt));
if(inMothership) guards.forEach(g=>g.update(dt));
if(godJetMode) bosses.forEach(b=>b.update(dt));

// Bullet collisions
if(inMothership){

for(let g of guards){
for(let b of bullets){
if(!b.dead && !g.dead){
if(Math.hypot(b.x-g.x,b.y-g.y)<g.r){ g.dead=true; b.dead=true; }
}
}
if(Math.hypot(player.x-g.x,player.y-g.y)<g.r){ warriorLives--; if(warriorLives<=0){ return endGame("Defeated in mothership!"); } }

}
guards=guards.filter(g=>!g.dead);

// Spawn God Jet
if(guards.length===0){

running=false;
document.getElementById("ovTitle").textContent="You found the God Jet!";
document.getElementById("ovMsg").textContent="Claim it to fight 10 bosses!";

document.getElementById("ovBtn").textContent="Claim Jet";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=claimGodJet;
return;
}
}

if(godJetMode){
for(let b of bullets){
for(let boss of bosses){
if(!b.dead && !boss.dead && Math.hypot(b.x-boss.x,b.y-boss.y)<boss.r){
b.dead=true; boss.hit();
}
}
}
bosses=bosses.filter(b=>!b.dead);
if(bosses.length===0){
return endGame("Final Victory! 🏆");
}
}

// Clean up
bullets=bullets.filter(b=>!b.dead);


// Draw
ctx.clearRect(0,0,W,H);
if(inMothership){
ctx.fillStyle="#111"; ctx.fillRect(0,0,W,H);
guards.forEach(g=>g.draw());
} else {
stars.forEach(s=>s.draw());
}
if(godJetMode) bosses.forEach(b=>b.draw());
player.draw();
bullets.forEach(b=>b.draw());


// HUD
document.getElementById("score").textContent=score;
document.getElementById("lives").textContent=inMothership ? warriorLives : (player instanceof GodJet ? player.hp : lives);
document.getElementById("level").textContent=inMothership ? 3 : (godJetMode ? "3 - God Jet" : 1);

requestAnimationFrame(loop);
}

function endGame(msg){
running=false;
document.getElementById("ovTitle").textContent=msg;
document.getElementById("ovMsg").textContent="Thanks for playing!";

document.getElementById("overlay").classList.remove("hidden");
}

// --- Input ---
document.addEventListener("keydown", e=>keys[e.code]=true);
document.addEventListener("keyup", e=>keys[e.code]=false);

// --- Buttons ---
document.getElementById("btnStart").onclick=startGame;
document.getElementById("btnRestart").onclick=startGame;
document.getElementById("ovBtn").onclick=startGame;
document.getElementById("btnPause").onclick=()=>running=!running;

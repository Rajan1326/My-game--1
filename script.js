// (Keep everything above the same as before, we’re just extending Level 3)

class Guard {
constructor(x,y){
this.x=x; this.y=y; this.r=16; this.dead=false; this.speed=80; this.cool=2;
}
update(dt){
// Move towards warrior
if(inMothership && player instanceof Warrior){
let dx=player.x-this.x, dy=player.y-this.y;
let dist=Math.hypot(dx,dy);
if(dist>0){
this.x+=dx/dist*this.speed*dt;
this.y+=dy/dist*this.speed*dt;
}
}
this.cool-=dt;
if(this.cool<=0){
enemyBullets.push(new Bullet(this.x,this.y+10,200,"red"));
this.cool=2;
}
}
draw(){
ctx.fillStyle="green";
ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
}
}

// --- God Jet ---
class GodJet {
constructor(){ this.x=W/2; this.y=H-80; this.r=20; this.cool=0; this.altFire=false; this.lives=10; }
draw(){
ctx.fillStyle="gold";
ctx.beginPath();
ctx.moveTo(this.x,this.y-25);
ctx.lineTo(this.x-25,this.y+25);
ctx.lineTo(this.x+25,this.y+25);
ctx.closePath(); ctx.fill();
ctx.fillStyle="white";
ctx.fillText("GOD JET", this.x-30,this.y-40);
}
update(dt){
if(keys["ArrowLeft"] && this.x>20) this.x-=300*dt;
if(keys["ArrowRight"] && this.x<W-20) this.x+=300*dt;
if(keys["ArrowUp"] && this.y>20) this.y-=300*dt;
if(keys["ArrowDown"] && this.y<H-20) this.y+=300*dt;
if(keys["Space"] && this.cool<=0){
if(this.altFire){
// spread shot
for(let i=-5;i<=5;i++){
bullets.push(new Bullet(this.x+ i*5,this.y-20,-500,"orange"));
}
} else {
bullets.push(new Bullet(this.x,this.y-20,-600,"orange"));
}
this.cool=0.3;
}
if(this.cool>0) this.cool-=dt;
}
}

// --- New global state ---
let guards = [];
let godJet = null;
let godJetClaimed = false;

// --- Enter mothership (modified) ---
function enterMothership(){
inMothership=true;
player=new Warrior();
warriorLives=10;
guards=[
new Guard(100,100),
new Guard(800,100),
new Guard(200,400),
new Guard(700,300),
new Guard(400,200)
];
running=true;
document.getElementById("overlay").classList.add("hidden");
lastTime=performance.now();
requestAnimationFrame(loop);
}

// --- Claim God Jet ---
function claimGodJet(){
godJetClaimed=true;
inMothership=false;
player=new GodJet();
document.getElementById("overlay").classList.add("hidden");
running=true;
lastTime=performance.now();
requestAnimationFrame(loop);
}

// --- Loop changes ---
function loop(t){
if(!running) return;
let dt=(t-lastTime)/1000; lastTime=t;

// Update
player.update(dt);
bullets.forEach(b=>b.update(dt));
enemyBullets.forEach(b=>b.update(dt));
enemies.forEach(e=>e.update(dt));
stars.forEach(s=>s.update(dt));
if(boss) boss.update(dt);
if(inMothership){
guards.forEach(g=>g.update(dt));
}

// Bullet vs guards
if(inMothership && player instanceof Warrior){
for(let g of guards){
for(let b of bullets){
if(!b.dead && !g.dead){
let dx=b.x-g.x, dy=b.y-g.y;
if(dx*dx+dy*dy < (b.r+g.r)**2){ g.dead=true; b.dead=true; }
}
}
let dx=player.x-g.x, dy=player.y-g.y;
if(dx*dx+dy*dy < (player.r+g.r)**2){ warriorLives--; if(warriorLives<=0) return gameOver("You were defeated in the mothership!"); }
}
guards=guards.filter(g=>!g.dead);

// Spawn God Jet after guards are gone
if(guards.length===0 && !godJet){
godJet={x:W/2,y:H/2,r:30};
}
// Claim God Jet
if(godJet && Math.hypot(player.x-godJet.x,player.y-godJet.y)<40){
running=false;
document.getElementById("ovTitle").textContent="You found the God Jet!";
document.getElementById("ovMsg").textContent="Get ready for the final battle!";
document.getElementById("ovBtn").textContent="Claim Jet";
document.getElementById("overlay").classList.remove("hidden");
document.getElementById("ovBtn").onclick=claimGodJet;
return;
}
}

// Cleanup
bullets=bullets.filter(b=>!b.dead);
enemyBullets=enemyBullets.filter(b=>!b.dead);
enemies=enemies.filter(e=>!e.dead);

// Draw
ctx.clearRect(0,0,W,H);

if(inMothership){
ctx.fillStyle="#111"; ctx.fillRect(0,0,W,H);
ctx.strokeStyle="#333";
for(let i=0;i<W;i+=40){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
for(let j=0;j<H;j+=40){ ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(W,j); ctx.stroke(); }
guards.forEach(g=>g.draw());
if(godJet){
ctx.fillStyle="gold"; ctx.beginPath(); ctx.arc(godJet.x,godJet.y,30,0,Math.PI*2); ctx.fill();
ctx.fillStyle="black"; ctx.fillText("🚀", godJet.x-10,godJet.y+5);
}
} else {
stars.forEach(s=>s.draw());
}

player.draw();
bullets.forEach(b=>b.draw());
enemyBullets.forEach(b=>b.draw());
enemies.forEach(e=>e.draw());
if(boss) boss.draw();

// HUD
document.getElementById("score").textContent=score;
document.getElementById("lives").textContent=inMothership ? warriorLives : (player instanceof GodJet ? player.lives : lives);
document.getElementById("level").textContent=inMothership ? 3 : (player instanceof GodJet ? "3 - God Jet" : level);

requestAnimationFrame(loop);
}

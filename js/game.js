/* HELENA PRIMERA PERSONA 3D - Raycasting con texturas reales */
const TS=40, W=800, H=480;
let TEX={};
function loadTex(n,s){let i=new Image(); i.src=s; TEX[n]=i;}
loadTex('castle','assets/castle.jpg'); loadTex('classroom','assets/classroom.jpg');
class FirstPersonGame{
 constructor(idx,container){
  this.idx=idx; this.lv=LEVELS[idx];
  this.lives=3; this.paused=true; this.over=false; this.hidden=false; this.light=true;
  this.stamina=100; this.ms=0; this.elapsed=0; this.invuln=0; this.chasing=false; this.running=false; this.exitOpen=false;
  this.dir=-Math.PI/2; this.container=container;
  this.canvas=document.createElement('canvas'); this.canvas.width=W; this.canvas.height=H; this.canvas.style.width='100%'; this.canvas.style.height='100%'; this.canvas.style.touchAction='none'; this.canvas.style.display='block';
  container.innerHTML=''; container.appendChild(this.canvas); this.ctx=this.canvas.getContext('2d');
  this.buildMap(); this.last=performance.now(); window.G=this; this.raf=requestAnimationFrame(this.loop.bind(this));
  let lookId=null,lastX=0; this.canvas.addEventListener('pointerdown',e=>{if(e.clientX>window.innerWidth*0.4){lookId=e.pointerId; lastX=e.clientX; this.canvas.setPointerCapture(e.pointerId);}});
  this.canvas.addEventListener('pointermove',e=>{if(e.pointerId===lookId){let dx=e.clientX-lastX; lastX=e.clientX; this.dir+=dx*0.006;}});
  this.canvas.addEventListener('pointerup',e=>{if(e.pointerId===lookId) lookId=null;});
 }
 buildMap(){
  let rows=this.lv.map; this.clues=[]; this.keysArr=[]; this.hides=[]; this.floorTiles=[]; this.start={x:60,y:60}; this.exit={x:0,y:0};
  rows.forEach((row,r)=>{for(let c=0;c<20;c++){let ch=row[c],x=c*TS+20,y=r*TS+20; if(ch==='#') continue; this.floorTiles.push({x,y}); if(ch==='P') this.start={x,y}; else if(ch==='C') this.clues.push({x,y,taken:false}); else if(ch==='K') this.keysArr.push({x,y,taken:false}); else if(ch==='E') this.exit={x,y}; else if(ch==='H') this.hides.push({x,y}); }});
  this.p={x:this.start.x,y:this.start.y};
  let far=[...this.floorTiles].sort((a,b)=>Math.hypot(b.x-this.p.x,b.y-this.p.y)-Math.hypot(a.x-this.p.x,a.y-this.p.y))[0];
  this.m={x:far.x,y:far.y,target:null,stuck:0};
 }
 isWallPx(x,y){let c=Math.floor(x/TS),r=Math.floor(y/TS); if(r<0||r>=this.lv.map.length||c<0||c>=20) return true; return this.lv.map[r][c]==='#';}
 free(x,y,r){return !this.isWallPx(x-r,y-r)&&!this.isWallPx(x+r,y-r)&&!this.isWallPx(x-r,y+r)&&!this.isWallPx(x+r,y+r);}
 move(o,dx,dy,r){let ok=false; if(dx&&this.free(o.x+dx,o.y,r)){o.x+=dx; ok=true;} if(dy&&this.free(o.x,o.y+dy,r)){o.y+=dy; ok=true;} return ok;}
 toggleHide(){let near=this.hides.some(h=>Math.hypot(h.x-this.p.x,h.y-this.p.y)<50); if(near||this.hidden){this.hidden=!this.hidden; beep(this.hidden?500:700);} else {let a=document.getElementById('alert'); a.textContent='Acercate a un arbusto verde para esconderte'; a.style.display='block'; setTimeout(()=>{if(!this.chasing) a.style.display='none'; a.textContent='TE VIO! CORRE O ESCONDETE!';},1500);} }
 toggleLight(){this.light=!this.light; beep(900);}
 hit(){this.lives--; this.invuln=90; beep(200); if(this.lives<=0){this.over=true; this.paused=true; endGame(false); return;} this.p.x=this.start.x; this.p.y=this.start.y;}
 win(){this.over=true; this.paused=true; endGame(true);}
 destroy(){if(this.raf) cancelAnimationFrame(this.raf); this.container.innerHTML='';}
 loop(t){let dt=Math.min(50,t-this.last); this.last=t; if(!this.paused&&!this.over) this.step(dt); this.draw(); this.raf=requestAnimationFrame(this.loop.bind(this));}
 step(dt){
  let f=dt/16.667,p=this.p,m=this.m; this.ms+=dt; this.elapsed=Math.floor(this.ms/1000);
  let fwd=0,strafe=0; if(keys['w']||keys['arrowup']) fwd+=1; if(keys['s']||keys['arrowdown']) fwd-=1; if(keys['a']) strafe-=1; if(keys['d']) strafe+=1; if(keys['arrowleft']) this.dir-=0.03*f; if(keys['arrowright']) this.dir+=0.03*f; if(joy.active){fwd+=-joy.y; strafe+=joy.x;}
  let len=Math.hypot(fwd,strafe); if(len>1){fwd/=len; strafe/=len;} this.moving=len>0.08;
  let wantRun=(keys['shift']||this.running)&&this.moving; this.sprint=wantRun&&this.stamina>0; this.stamina=wantRun?Math.max(0,this.stamina-0.4*f):Math.min(100,this.stamina+0.3*f);
  let sp=(this.sprint?3.6:2.2)*f; if(this.hidden) sp*=0.5;
  let dx=Math.cos(this.dir)*fwd - Math.sin(this.dir)*strafe; let dy=Math.sin(this.dir)*fwd + Math.cos(this.dir)*strafe; this.move(p,dx*sp,dy*sp,12);
  if(this.invuln>0) this.invuln-=f;
  this.clues.forEach(c=>{if(!c.taken&&Math.hypot(c.x-p.x,c.y-p.y)<26){c.taken=true; beep(880);}});
  this.keysArr.forEach(k=>{if(!k.taken&&Math.hypot(k.x-p.x,k.y-p.y)<26){k.taken=true; beep(660);}});
  let dist=Math.hypot(m.x-p.x,m.y-p.y); let sees=dist<(this.light?210:130)&&!this.hidden; if(sees&&!this.chasing) beep(300); this.chasing=sees; document.getElementById('alert').style.display=sees?'block':'none';
  let ms=(1.5+this.idx*0.25+(sees?0.9:0))*f;
  if(sees){this.move(m,(p.x-m.x)/dist*ms,(p.y-m.y)/dist*ms,13);} else {if(!m.target||Math.hypot(m.target.x-m.x,m.target.y-m.y)<20||m.stuck>45){m.target=this.floorTiles[Math.floor(Math.random()*this.floorTiles.length)]; m.stuck=0;} let d=Math.hypot(m.target.x-m.x,m.target.y-m.y)||1; let moved=this.move(m,(m.target.x-m.x)/d*ms*0.7,(m.target.y-m.y)/d*ms*0.7,13); m.stuck=moved?0:m.stuck+1;}
  if(dist<30&&this.invuln<=0&&!this.hidden){this.hit(); if(this.over) return;}
  let allDone=this.clues.every(c=>c.taken)&&this.keysArr.every(k=>k.taken); if(allDone&&!this.exitOpen){this.exitOpen=true; beep(1000);} if(allDone&&Math.hypot(this.exit.x-p.x,this.exit.y-p.y)<32){this.win(); return;}
  let nc=this.clues.filter(c=>c.taken).length, nk=this.keysArr.filter(k=>k.taken).length;
  document.getElementById('hudClues').textContent=nc+'/'+this.clues.length; document.getElementById('hudKeys').textContent=nk+'/'+this.keysArr.length; document.getElementById('hudLives').textContent=this.lives; document.getElementById('hudStam').textContent=Math.floor(this.stamina); document.getElementById('hudTime').textContent=String(Math.floor(this.elapsed/60)).padStart(2,'0')+':'+String(this.elapsed%60).padStart(2,'0'); document.getElementById('progBar').style.width=((nc+nk)/(this.clues.length+this.keysArr.length)*100)+'%';
 }
 draw(){
  let ctx=this.ctx, lv=this.lv; ctx.fillStyle=this.light?'#2a1a4a':'#0a0618'; ctx.fillRect(0,0,W,H/2); ctx.fillStyle=this.light?'#3a2a55':'#0a0618'; ctx.fillRect(0,H/2,W,H/2);
  let tex=(this.idx===1||this.idx===2)?TEX['classroom']:TEX['castle']; let FOV=Math.PI/3;
  for(let x=0;x<W;x+=2){let cameraX=2*x/W-1; let rayAngle=this.dir+cameraX*FOV/2; let dx=Math.cos(rayAngle), dy=Math.sin(rayAngle); let dist=0,hit=false,rx=this.p.x,ry=this.p.y; while(!hit&&dist<600){dist+=4; rx=this.p.x+dx*dist; ry=this.p.y+dy*dist; if(this.isWallPx(rx,ry)) hit=true;} if(!hit) continue; let corrected=dist*Math.cos(cameraX*FOV/2); let lineH=H/(corrected/40||0.1); let brightness=this.light?Math.max(0.18,1-corrected/500):0.12; if(tex&&tex.complete&&tex.naturalWidth>0){let wallX=(((rx%TS)/TS+(ry%TS)/TS)%1); if(wallX<0) wallX+=1; let sx=Math.floor(wallX*tex.naturalWidth); ctx.save(); ctx.globalAlpha=Math.min(1,brightness+0.25); ctx.drawImage(tex,sx,0,1,tex.naturalHeight,x,(H-lineH)/2,2,lineH); ctx.fillStyle='rgba(0,0,20,'+(0.6*(1-brightness))+')'; ctx.fillRect(x,(H-lineH)/2,2,lineH); ctx.restore();} else {ctx.fillStyle=lv.wall; ctx.globalAlpha=brightness; ctx.fillRect(x,(H-lineH)/2,2,lineH); ctx.globalAlpha=1;}}
  let sprites=[]; this.clues.forEach(c=>{if(!c.taken) sprites.push({x:c.x,y:c.y,type:'clue'});}); this.keysArr.forEach(k=>{if(!k.taken) sprites.push({x:k.x,y:k.y,type:'key'});}); this.hides.forEach(h=>sprites.push({x:h.x,y:h.y,type:'hide'})); sprites.push({x:this.exit.x,y:this.exit.y,type:'door'}); sprites.push({x:this.m.x,y:this.m.y,type:'monster'}); sprites.sort((a,b)=>Math.hypot(b.x-this.p.x,b.y-this.p.y)-Math.hypot(a.x-this.p.x,a.y-this.p.y));
  sprites.forEach(sp=>{let dx=sp.x-this.p.x,dy=sp.y-this.p.y; let dist=Math.hypot(dx,dy); if(dist<5) return; let ang=Math.atan2(dy,dx)-this.dir; while(ang>Math.PI) ang-=Math.PI*2; while(ang<-Math.PI) ang+=Math.PI*2; if(Math.abs(ang)>FOV/2+0.2) return; let blocked=false; for(let d=10;d<dist;d+=10){if(this.isWallPx(this.p.x+Math.cos(this.dir+ang)*d,this.p.y+Math.sin(this.dir+ang)*d)){blocked=true; break;}} if(blocked) return; let sx=(0.5+ang/FOV)*W; let size=H/(dist/40||0.1)*0.55; let sy=H/2-size/2; ctx.save(); ctx.globalAlpha=this.light?1:0.7; if(sp.type==='clue'){ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(sx,sy+size/2,size*0.22,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; ctx.font='bold '+(size*0.35)+'px Arial'; ctx.textAlign='center'; ctx.fillText('?',sx,sy+size/2+size*0.12);} else if(sp.type==='key'){ctx.fillStyle='#66ccff'; ctx.beginPath(); ctx.arc(sx,sy+size/2,size*0.22,0,Math.PI*2); ctx.fill();} else if(sp.type==='hide'){ctx.fillStyle='rgba(31,122,70,0.9)'; ctx.fillRect(sx-size*0.25,sy+size*0.2,size*0.5,size*0.5);} else if(sp.type==='door'){ctx.fillStyle='#8b5a2b'; ctx.fillRect(sx-size*0.3,sy,size*0.6,size); ctx.fillStyle='#ffd700'; ctx.fillRect(sx-4,sy+size*0.45,8,8);} else if(sp.type==='monster'){let ms=size*1.2; ctx.fillStyle='#1a0a2e'; ctx.beginPath(); ctx.arc(sx,sy+size/2,ms*0.45,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.arc(sx-ms*0.15,sy+size/2-ms*0.1,ms*0.09,0,Math.PI*2); ctx.arc(sx+ms*0.15,sy+size/2-ms*0.1,ms*0.09,0,Math.PI*2); ctx.fill();} ctx.restore();});
  ctx.fillStyle='#fff'; ctx.fillRect(W/2-1,H/2-8,2,16); ctx.fillRect(W/2-8,H/2-1,16,2);
  if(!this.light){ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);}
  if(this.hidden){ctx.fillStyle='rgba(124,58,237,0.85)'; ctx.fillRect(0,H-36,W,36); ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.fillText('ESCONDIDA',W/2,H-12);}
  let mw=110,mh=70,mx=W-mw-10,my=10; ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(mx,my,mw,mh); let sx=mw/20,sy=mh/12; for(let r=0;r<12;r++) for(let c=0;c<20;c++){if(lv.map[r][c]==='#'){ctx.fillStyle='#4c1d95'; ctx.fillRect(mx+c*sx,my+r*sy,sx,sy);}} ctx.fillStyle='#ffd700'; this.clues.forEach(cl=>{if(!cl.taken) ctx.fillRect(mx+(cl.x/TS)*sx-2,my+(cl.y/TS)*sy-2,4,4);}); ctx.fillStyle='#66ccff'; this.keysArr.forEach(k=>{if(!k.taken) ctx.fillRect(mx+(k.x/TS)*sx-2,my+(k.y/TS)*sy-2,4,4);}); ctx.fillStyle='#22c55e'; ctx.fillRect(mx+(this.exit.x/TS)*sx-3,my+(this.exit.y/TS)*sy-3,6,6); ctx.fillStyle='#ff0000'; ctx.beginPath(); ctx.arc(mx+(this.m.x/TS)*sx,my+(this.m.y/TS)*sy,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ec4899'; ctx.beginPath(); ctx.arc(mx+(this.p.x/TS)*sx,my+(this.p.y/TS)*sy,4,0,Math.PI*2); ctx.fill();
 }
}

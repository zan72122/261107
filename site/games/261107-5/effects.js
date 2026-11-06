'use strict';
// A paper ripple acknowledges every touch without advancing the copier.
function updateTouchFeedback(dt){
  var f=S.touchFeedback;if(!f)return;
  f.t+=dt;
  if(!act)f.fade+=dt;
  if(f.fade>=1.8)S.touchFeedback=null;
}
function drawTouchFeedback(){
  var f=S.touchFeedback;if(!f)return;
  var size=Math.max(28,Math.min(46,L.U*.8));
  var r=size*(.8+.2*ease(f.t/.2)+.04*Math.sin(f.t*7));
  ctx.save();ctx.globalAlpha=.85*(1-f.fade/1.8);
  ctx.strokeStyle=COL.yel;ctx.lineWidth=size*.22;ctx.lineJoin='miter';
  path(ngon(f.x,f.y,r,r,10,-Math.PI/2,0,null));ctx.stroke();
  for(var i=0;i<4;i++){
    var a=i*Math.PI/2+Math.PI/4,x=f.x+Math.cos(a)*r*1.4,y=f.y+Math.sin(a)*r*1.4;
    paper(ngon(x,y,size*.13,size*.2,4,0,0,null),i%2?COL.white:COL.yel,0);
  }
  ctx.restore();
}

/* ---------------- particles ---------------- */
var PMAX=90;
function burst(x,y,n,cols,spd,kind){
  for(var i=0;i<n;i++){
    if(S.particles.length>=PMAX)S.particles.shift();
    var a=rnd()*Math.PI*2,v=(0.3+rnd()*0.7)*(spd||1)*L.U*3;
    S.particles.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-L.U*2*(spd||1),r:rnd()*6,vr:(rnd()-0.5)*10,
      life:0,max:0.8+rnd()*0.7,c:cols[i%cols.length],s:L.U*(0.07+rnd()*0.07),k:kind||0});
  }
}
function updParticles(dt){
  for(var i=S.particles.length-1;i>=0;i--){var p=S.particles[i];p.life+=dt;if(p.life>p.max){S.particles.splice(i,1);continue;}
    p.vy+=L.U*6*dt;p.vx*=Math.exp(-2*dt);p.vy*=Math.exp(-1.2*dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.r+=p.vr*dt;}
}
function drawParticles(){
  for(var i=0;i<S.particles.length;i++){var p=S.particles[i];var a=1-p.life/p.max;
    ctx.save();ctx.globalAlpha=clamp(a*1.5,0,1);ctx.translate(p.x,p.y);ctx.rotate(p.r);
    ctx.fillStyle=p.c;
    if(p.k===1){path([[0,-p.s*1.4],[p.s*.7,0],[0,p.s*1.4],[-p.s*.7,0]]);ctx.fill();}
    else ctx.fillRect(-p.s,-p.s*0.6,p.s*2,p.s*1.2);
    ctx.restore();}
}


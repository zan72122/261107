'use strict';
/* ---------------- draw: frame ---------------- */
function draw(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.drawImage(bgCv,0,0,W,Hh);
  var g=guideTarget(),gp=guidePos(g);
  HOUSES.forEach(drawWindow);
  // shades (translucent tissue paper)
  var dragId=act&&act.mode==='pot'&&act.moved?act.stand:null;
  for(var id in S.pots){if(id===dragId)continue;var pt=S.pots[id];drawShade(id,ease(pt.open)*(pt.back?0.6:1),false);}
  if(dragId){var snap=nearestEmptyStand(act.x,act.y,Math.max(80,L.U*1.7));if(snap)drawShade(snap,0.75,true);}
  drawPartition();
  // depth sorted
  var list=[];
  STANDS.forEach(function(s){list.push({y:s.v,f:function(){
    var gs=g&&((g.type==='stand'&&g.id===s.id)||(g.type==='pot'&&g.id===s.id));
    var ripple=(!gs&&!S.pots[s.id])?Math.sin(S.t*1.3+s.idx)*0.15:0;
    var by=drawStand(s,gs?1:Math.max(s.bob,0));
    if(ripple){}
    var pot=S.pots[s.id];
    if(pot&&s.id!==dragId){var tp=standTop(s),bx=tp[0],byy=tp[1]+by;
      if(pot.back){var bt=ease(pot.back.t);bx=lerp(pot.back.x,bx,bt);byy=lerp(pot.back.y,byy,bt);}
      var wig=Math.sin(pot.wig*12)*pot.wig*0.15;
      ctx.save();ctx.translate(bx,byy);ctx.rotate(wig);ctx.translate(-bx,-byy);
      drawPlant(bx,byy,L.U,ease(pot.open),1+S.breeze*2,pot.seed%97,1);ctx.restore();}
    else if(!pot)drawEmptyMark(s,by,S.selected===s.id);
  }});});
  HOUSES.forEach(function(Hs){
    var plank=drawBenchPlank(Hs);
    if(plank){var a=Hs.items.chairA;list.push({y:Math.max(a.v,Hs.items.chairB.v)+0.0005,f:plank});}
    for(var k in Hs.items){(function(k){var it=Hs.items[k];if(it.fixed||!it.visible)return;
      var yy=it.carried?Hs.res.v+0.002:it.v+(it.kind==='tea'&&Hs.mode==='joint'?0.03:0)+(it.kind==='cushion'?-0.002:0);
      list.push({y:yy,f:function(){drawItem(Hs,k,it);}});})(k);}
    list.push({y:Hs.res.v+0.001,f:function(){drawResident(Hs.res,'body');}});
  });
  if(S.joint.unfolded){list.push({y:(S.joint.cur.long>0.5?.53:S.joint.cur.v)+0.02,f:drawJointTable});}
  list.sort(function(a,b){return a.y-b.y;});
  list.forEach(function(o){o.f();});
  // faces always on top
  HOUSES.forEach(function(Hs){var r=Hs.res,look=gp;
    var other=HOUSES[1-Hs.h].res;if(r.wave>0||r.job){var op=P(other.h,other.u,other.v);look=r.job?null:[op[0],op[1]-L.U];}
    if(r.job&&r.job.k){var o=Hs.items[r.job.k];if(o){var q=P(Hs.h,o.d.u,o.d.v);look=q;}}
    drawResident(r,'head',look);});
  var fy0=Math.floor(L.floorY+L.floorH-2),fh=Math.ceil(L.railH+L.sh*2+4);
  ctx.drawImage(fgCv,0,fy0*DPR,cv.width,fh*DPR,0,fy0,W,fh);
  drawGarland();
  drawCopier(g);
  // flights (seedling copies on a visible arc)
  S.flights.forEach(function(f){var tp=standTop(ST[f.to]);var x0=L.cx,y0=L.cy+L.R*0.05,x1=tp[0],y1=tp[1];
    var t=ease(f.t),mx=(x0+x1)/2,my=Math.min(y0,y1)-L.U*2.2;
    var x=(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,y=(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1;
    // dotted paper trail
    for(var i=1;i<5;i++){var tt=Math.max(0,t-i*0.06),xx=(1-tt)*(1-tt)*x0+2*(1-tt)*tt*mx+tt*tt*x1,yy=(1-tt)*(1-tt)*y0+2*(1-tt)*tt*my+tt*tt*y1;
      ctx.fillStyle='rgba(255,255,255,'+(0.7-i*0.12)+')';path(ngon(xx,yy-L.U*.3,L.U*.07,L.U*.07,4,i,0,null));ctx.fill();}
    drawPlant(x,y,L.U*lerp(1.1,1,t),0.35,1,f.seed%97,1);});
  // dragged pot
  if(dragId){var dp=S.pots[dragId];ctx.save();ctx.globalAlpha=1;ctx.fillStyle='rgba(48,34,18,0.25)';path(ngon(act.x+L.U*.15,act.y+L.U*.5,L.U*.4,L.U*.12,8,0,0,null));ctx.fill();ctx.restore();
    drawPlant(act.x,act.y+L.U*.3,L.U*1.1,1,2,dp.seed%97,1);}
  // guide glow ring for stand/pot target
  if(g&&g.type!=='handle'&&gp){ctx.save();ctx.globalAlpha=0.28+0.2*Math.sin(S.pulse*5);ctx.fillStyle=COL.yel;
    path(ngon(gp[0],gp[1]+L.U*.25,L.U*.7,L.U*.4,10,S.t*0.5,0,null));ctx.fill();ctx.restore();}
  drawParticles();
  drawTouchFeedback();
  // demo hand
  if(S.demo){var d=S.demo,t=d.t;
    if(d.type==='crank'){var aa=-Math.PI/2+S.crank.theta+ease(clamp((t-0.3)/2,0,1))*Math.PI*2;
      var hx=L.cx+Math.cos(aa)*L.R*.74,hy=L.cy+Math.sin(aa)*L.R*.74;ctx.save();ctx.globalAlpha=clamp(Math.min(t*3,(2.6-t)*3),0,1);drawHand(hx,hy,t>0.3&&t<2.3?1:0);ctx.restore();}
    else{var fa=standTop(ST[d.from]),tb=standTop(ST[d.to]),k2=ease(clamp((t-0.4)/1.5,0,1));
      ctx.save();ctx.globalAlpha=clamp(Math.min(t*3,(2.6-t)*3),0,1);drawHand(lerp(fa[0],tb[0],k2),lerp(fa[1],tb[1],k2)-L.U*.4,t>0.4&&t<2?1:0);ctx.restore();}}
  // celebration: warm paper light over both balconies
  if(S.celebrate>0){ctx.save();ctx.globalAlpha=S.celebrate*0.18;ctx.fillStyle=COL.yel;ctx.fillRect(L.vx,L.vy,L.vw,L.vh);ctx.restore();}
}

/* ---------------- loop & lifecycle ---------------- */
var raf=0,lastNow=0;
function frame(now){
  raf=0;if(document.hidden)return;
  var dt=(now-lastNow)/1000;lastNow=now;if(!(dt>0))dt=0;dt=Math.min(dt,1/30);
  update(dt);draw();
  if(S.firstDownAt&&!S.firstDrawMs)S.firstDrawMs=performance.now()-S.firstDownAt;
  raf=requestAnimationFrame(frame);
}
function start(){if(!raf){lastNow=performance.now();raf=requestAnimationFrame(frame);}}
document.addEventListener('visibilitychange',function(){
  if(document.hidden){if(act)endAct(true);if(raf){cancelAnimationFrame(raf);raf=0;}if(AC&&AC.state==='running'){try{AC.suspend();}catch(e){}}}
  else{if(AC&&AC.state==='suspended'){try{AC.resume();}catch(e){}}start();}
});
window.addEventListener('blur',function(){if(act)endAct(true);});
var rzT=0;function onResize(){clearTimeout(rzT);rzT=setTimeout(function(){layout();if(!raf&&!document.hidden)start();},60);}
window.addEventListener('resize',onResize);window.addEventListener('orientationchange',onResize);
layout();plan();bindInput();start();

/* test hooks (no UI) */
window.__gf={S:S,HOUSES:HOUSES,ST:ST,STANDS:STANDS,L:function(){return L;},standTop:function(id){return standTop(ST[id]);},
  handlePos:handlePos,P:P,plan:plan,guide:guideTarget,
  step:function(sec){var n=Math.ceil(sec*60);for(var i=0;i<n;i++)update(1/60);draw();},
  place:function(id){if(!isEmpty(id))return false;S.pots[id]={order:++S.order,open:1,seed:1+Math.floor(rnd()*90),wig:0};plan();return true;},
  move:function(a,b){if(!S.pots[a]||!isEmpty(b))return false;S.pots[b]=S.pots[a];delete S.pots[a];S.lastMove=S.t;if(S.joint.unfolded)S.movedAfterDone=true;plan();return true;},
  idle:function(){return HOUSES.every(function(Hs){return !Hs.res.job;});}};

'use strict';
/* ---------------- copier / input ---------------- */
var SEG=Math.PI*1.25;
function potCount(){return Object.keys(S.pots).length+S.flights.length;}
function isEmpty(id){return !S.pots[id]&&!S.reserved[id];}
function suggested(){
  if(potCount()>=CAP)return null;
  for(var i=0;i<SUGGEST.length;i++)if(isEmpty(SUGGEST[i]))return SUGGEST[i];
  return null;
}
function ensureDest(){
  if(S.selected&&isEmpty(S.selected))return S.selected;
  S.selected=null;var s=suggested();if(s){S.selected=s;ST[s].bob=1;}return S.selected;
}
function completeCopy(){
  var c=S.crank,dest=ensureDest();
  if(!dest||potCount()>=CAP){c.p=0.92;c.full=1;SFX.full();return false;}
  S.reserved[dest]=1;
  S.flights.push({to:dest,t:0,seed:Math.floor(rnd()*1e6)});
  S.selected=null;c.p=0;c.tipShown=false;
  SFX.whoosh();burst(L.cx,L.cy,6,[COL.white,COL.green,COL.yel],0.8,1);
  logEv('copy',dest);
  return true;
}
function land(f){
  delete S.reserved[f.to];
  S.pots[f.to]={order:++S.order,open:0,seed:f.seed,wig:0};
  var tp=standTop(ST[f.to]);
  SFX.pasa();burst(tp[0],tp[1]-L.U*.2,8,[COL.green,COL.white,COL.kinD],0.9,1);
  logEv('land',f.to);
  if(found('copy')){setTimeout(function(){SFX.chimeS();},120);burst(tp[0],tp[1]-L.U*.6,8,[COL.yel,COL.red,COL.white],0.9,1);}
  if(f.to!=='A'&&!S.found.copyOther){found('copyOther');setTimeout(function(){SFX.chimeS();},120);}
  plan();
}
var act=null; // active pointer interaction
function local(e){var r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];}
function handlePos(){var a=S.crank.theta-Math.PI/2;return [L.cx+Math.cos(a)*L.R*0.74,L.cy+Math.sin(a)*L.R*0.74];}
function hitPot(x,y){
  var best=null,bd=1e9;
  for(var id in S.pots){var s=ST[id],tp=standTop(s),U=L.U;
    if(x>tp[0]-U*.62&&x<tp[0]+U*.62&&y>tp[1]-U*1.25&&y<tp[1]+U*.25){var d=hyp(x-tp[0],y-(tp[1]-U*.5));if(d<bd){bd=d;best=id;}}}
  return best;
}
function hitStand(x,y){
  var best=null,bd=1e9,rad=Math.max(30,L.U*0.62);
  STANDS.forEach(function(s){if(S.pots[s.id])return;var tp=standTop(s);var d=hyp(x-tp[0],y-(tp[1]-L.U*.15));if(d<rad&&d<bd){bd=d;best=s.id;}});
  return best;
}
function nearestEmptyStand(x,y,maxd){
  var best=null,bd=maxd;
  STANDS.forEach(function(s){if(!isEmpty(s.id))return;var tp=standTop(s);var d=hyp(x-tp[0],y-(tp[1]-L.U*.3));if(d<bd){bd=d;best=s.id;}});
  return best;
}
function onDown(e){
  e.preventDefault();
  initAudio();
  if(act)return; // ignore extra fingers
  var q=local(e),x=q[0],y=q[1];
  S.touchFeedback={x:x,y:y,t:0,fade:0};
  S.lastInput=S.t;S.everTouched=true;if(!S.firstDownAt)S.firstDownAt=performance.now();
  if(S.demo){S.demo=null;}
  var c=S.crank,hp=handlePos();
  var dc=hyp(x-L.cx,y-L.cy);
  if(dc<L.R*1.12||hyp(x-hp[0],y-hp[1])<Math.max(34,L.R*0.3)){
    act={id:e.pointerId,mode:'crank'};
    c.pressed=true;c.sq=Math.max(c.sq,0.85);c.sqv=0;c.auto=false;
    c.lastA=Math.atan2(y-L.cy,x-L.cx);
    ensureDest();
    if(c.p<0.14){c.p=0.14;}
    c.tipShown=true;
    SFX.press();
    burst(hp[0],hp[1],3,[COL.white,COL.kinD],0.4,0);
    logEv('crank-down');
  }else{
    var pid=hitPot(x,y);
    if(pid){act={id:e.pointerId,mode:'pot',stand:pid,sx:x,sy:y,x:x,y:y,moved:false};S.pots[pid].wig=1;SFX.leaf();}
    else{var sid=hitStand(x,y);
      if(sid){S.selected=sid;ST[sid].bob=1;SFX.pick();logEv('select',sid);
        var tp=standTop(ST[sid]);burst(tp[0],tp[1],4,[COL.yel,COL.white],0.5,1);}
      else if(!potCount()){S.demo={type:'crank',t:0};}
      act={id:e.pointerId,mode:'guide'};}
  }
  try{cv.setPointerCapture(e.pointerId);}catch(err){}
}
function onMove(e){
  if(!act||e.pointerId!==act.id)return;
  e.preventDefault();
  var q=local(e),x=q[0],y=q[1];S.lastInput=S.t;
  if(act.mode==='crank'){
    var c=S.crank,a=Math.atan2(y-L.cy,x-L.cx),d=a-c.lastA;
    while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
    c.lastA=a;
    if(hyp(x-L.cx,y-L.cy)<L.R*0.16)return;
    d=clamp(d,-0.6,0.6);
    c.theta+=d;c.omega=lerp(c.omega,d/(1/60),0.35);
    if(c.full>0&&potCount()>=CAP){c.full=1;return;}
    c.p+=Math.abs(d)/SEG;c.tickAcc+=Math.abs(d);
    if(c.tickAcc>0.32){c.tickAcc=0;SFX.tick(clamp(c.p,0,1));}
    if(c.p>=1){completeCopy();}
  }else if(act.mode==='pot'){
    act.x=x;act.y=y;
    if(!act.moved&&hyp(x-act.sx,y-act.sy)>10){act.moved=true;SFX.lift();if(S.selected===act.stand)S.selected=null;}
  }
}
function endAct(cancel){
  if(!act)return;var a=act;act=null;
  if(a.mode==='crank'){
    var c=S.crank;c.pressed=false;
    if(!cancel&&c.p>=0.4&&potCount()<CAP){c.auto=true;c.autoDir=c.omega>=0?1:-1;}
    else if(c.p<0.14)c.p=0.14;
  }else if(a.mode==='pot'){
    var pot=S.pots[a.stand];
    if(pot&&a.moved&&!cancel){
      var to=nearestEmptyStand(a.x,a.y,Math.max(80,L.U*1.7));
      if(to&&to!==a.stand){
        delete S.pots[a.stand];S.pots[to]=pot;pot.open=0.55;pot.wig=1;
        if(S.selected===to)S.selected=null;
        S.lastMove=S.t;logEv('move',a.stand+'>'+to);
        if(S.joint.unfolded)S.movedAfterDone=true;
        var tp=standTop(ST[to]);SFX.pasa();burst(tp[0],tp[1]-L.U*.2,6,[COL.green,COL.white],0.7,1);
        found('drag');plan();
      }else{pot.back={x:a.x,y:a.y,t:0};SFX.tok();}
    }
  }
}
function onUp(e){if(!act||e.pointerId!==act.id)return;e.preventDefault();endAct(false);try{cv.releasePointerCapture(e.pointerId);}catch(err){}}
function onCancel(e){if(!act||e.pointerId!==act.id)return;endAct(true);}
function bindInput(){
cv.addEventListener('pointerdown',onDown,{passive:false});
cv.addEventListener('pointermove',onMove,{passive:false});
cv.addEventListener('pointerup',onUp,{passive:false});
cv.addEventListener('pointercancel',onCancel,{passive:false});
cv.addEventListener('lostpointercapture',function(e){if(act&&e.pointerId===act.id)endAct(true);});
['touchstart','touchmove','touchend','gesturestart','gesturechange','dblclick','contextmenu','selectstart'].forEach(function(t){
  document.addEventListener(t,function(e){if(e.cancelable)e.preventDefault();},{passive:false});});
}

/* ---------------- guide (one clear target) ---------------- */
function guideTarget(){
  if(act&&act.mode!=='guide')return null;
  if(S.flights.length)return null;
  var cnt=potCount();
  if((S.joint.unfolded&&!S.movedAfterDone)||cnt>=CAP){
    var pid=null;['B','P1f','P0b','P1b','A2','A'].some(function(i){if(S.pots[i]){pid=i;return true;}return false;});
    if(!pid)for(var k in S.pots){pid=k;break;}
    if(pid)return {type:'pot',id:pid};
  }
  if(S.selected&&isEmpty(S.selected))return {type:'handle'};
  var s=suggested();if(s)return {type:'stand',id:s};
  return {type:'handle'};
}
function guidePos(g){
  if(!g)return null;
  if(g.type==='handle')return handlePos();
  var tp=standTop(ST[g.id]);return [tp[0],tp[1]-L.U*.4];
}


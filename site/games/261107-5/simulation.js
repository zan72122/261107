'use strict';
/* ---------------- logic: shade, clusters, plan ---------------- */
function dist(a,b){return hyp(a.u-b.u,a.v-b.v);}
function circleRect(c,R){var cu=clamp(c.u,R.u0,R.u1),cv2=clamp(c.v,R.v0,R.v1);return hyp(c.u-cu,c.v-cv2)<c.r;}
function clusterize(pl){
  var n=pl.length,par=[];for(var i=0;i<n;i++)par[i]=i;
  function f(i){while(par[i]!==i)i=par[i]=par[par[i]];return i;}
  for(i=0;i<n;i++)for(var j=i+1;j<n;j++)if(dist(pl[i],pl[j])<pl[i].r+pl[j].r)par[f(i)]=f(j);
  var m={};for(i=0;i<n;i++){var k=f(i);(m[k]=m[k]||[]).push(pl[i]);}
  var out=[];for(k in m){var g=m[k],mu=0,mv=0,mo=1e9,u0=9,u1=-9,v0=9,v1=-9;
    g.forEach(function(p){mu+=p.u;mv+=p.v;mo=Math.min(mo,p.order);u0=Math.min(u0,p.u);u1=Math.max(u1,p.u);v0=Math.min(v0,p.v);v1=Math.max(v1,p.v);});
    out.push({ps:g,n:g.length,mu:mu/g.length,mv:mv/g.length,order:mo,du:u1-u0,dv:v1-v0,ids:g.map(function(p){return p.id;})});}
  out.sort(function(a,b){return a.order-b.order;});
  return out;
}
function cl(p){return {u:clamp(p.u,.06,.93),v:clamp(p.v,.05,.96)};}
function setD(it,p,face){var q=cl(p);it.d.u=q.u;it.d.v=q.v;it.fd=face||0;}
function singleSeat(c){var side=c.mu<.72?1:-1;return {chair:{u:c.mu+.11*side,v:c.mv+.09},tea:{u:c.mu-.11*side,v:c.mv+.09}};}
function jointSeats(){var J=S.joint;
  if(J.cfg.long)return {a:{u:.80,v:.38},b:{u:.80,v:.68},t:{u:.94,v:.50},half:{u:.92,v:.53}};
  var row=J.cfg.v-.03;
  return {a:{u:.79,v:row<.5?row+.14:row-.13},b:null,t:{u:.94,v:J.cfg.v-.005},half:{u:.93,v:J.cfg.v+.01}};
}
function plan(){
  var pl=[[],[]];
  for(var id in S.pots){var sh=shadeOf(id);sh.order=S.pots[id].order;pl[sh.h].push(sh);}
  var J=S.joint;
  var t0=pl[0].filter(function(p){return p.u+p.r>=1;}),t1=pl[1].filter(function(p){return p.u+p.r>=1;});
  var pairs=[];t0.forEach(function(a){t1.forEach(function(b){if(hyp((2-b.u)-a.u,a.v-b.v)<a.r+b.r)pairs.push([a,b]);});});
  J.connected=pairs.length>0;J.ids={};
  if(J.connected){
    var rows=pairs.map(function(p){J.ids[p[0].id]=1;J.ids[p[1].id]=1;return (ST[p[0].id].v+ST[p[1].id].v)/2;});
    var mn=Math.min.apply(null,rows),mx=Math.max.apply(null,rows);
    var long=mx-mn>.3?1:0, vv=long?.53:mn+.03;
    if(J.unfolded&&(J.cfg.long!==long||Math.abs(J.cfg.v-vv)>.01))J.reshaped=true;
    J.cfg={long:long,v:vv};
    if(!J.open){J.open=true;logEv('joint-connect');}
  }
  for(var h=0;h<2;h++)planHouse(HOUSES[h],pl[h]);
}
function planHouse(Hs,pl){
  var it=Hs.items,J=S.joint,jc=J.connected&&J.unfolded;
  ['chairA','chairB','tea'].forEach(function(k){setD(it[k],it[k].home,0);});
  Hs.mode='none';Hs.seat=false;
  var cls=clusterize(pl),s;
  if(jc){
    var js=jointSeats();setD(it.chairA,js.a,1);setD(it.tea,js.t,0);Hs.mode='joint';Hs.seat=true;
    if(js.b)setD(it.chairB,js.b,1);
    else{var free=cls.filter(function(c){return !c.ids.some(function(i){return J.ids[i];});});
      if(free.length){s=singleSeat(free[0]);setD(it.chairB,s.chair,0);}}
  }else if(cls.length){
    var P0=cls[0];Hs.seat=true;
    if(P0.n>=2){
      if(P0.du>=P0.dv){setD(it.chairA,{u:P0.mu-.075,v:P0.mv+.10},0);setD(it.chairB,{u:P0.mu+.075,v:P0.mv+.10},0);setD(it.tea,{u:P0.mu,v:P0.mv+.01},0);Hs.mode='bench';}
      else{setD(it.chairA,{u:P0.mu-.12,v:P0.mv+.02},1);setD(it.chairB,{u:P0.mu+.12,v:P0.mv+.02},-1);setD(it.tea,{u:P0.mu,v:P0.mv+.03},0);Hs.mode='facing';}
    }else{
      s=singleSeat(P0);setD(it.chairA,s.chair,0);setD(it.tea,s.tea,0);Hs.mode='single';
      if(cls[1]){var s2=singleSeat(cls[1]);setD(it.chairB,s2.chair,0);Hs.mode='separate';}
    }
  }
  // window: shade reaching the wall window
  if(!Hs.windowWant&&pl.some(function(p){return circleRect(p,WIN);})){Hs.windowWant=true;logEv('window-want',Hs.h);}
  // laundry
  if(it.laundry){
    if(!Hs.laundryMoved&&pl.some(function(p){return dist(p,LAUNDRY_CHK)<p.r+.03;})){Hs.laundryMoved=true;logEv('laundry-shaded');}
    setD(it.laundry,Hs.laundryMoved?SUN:it.laundry.home,0);
  }
  if(it.table&&it.table.visible){
    setD(it.table,TABLE_SPOT,0);
    Hs.rest=Hs.tableDone&&pl.some(function(p){return dist(p,TABLE_SPOT)<p.r+.03;});
    if(Hs.tableDone&&!it.cushion.visible){it.cushion.visible=true;it.cushion.pop=0;}
    setD(it.cushion,Hs.rest?CUSH_SPOT:it.cushion.home,0);
  }
  if(it.half.visible){if(J.open)setD(it.half,jointSeats().half,0);else setD(it.half,it.half.home,0);}
}
function settled(it){return !it.carried&&Math.abs(it.u-it.d.u)<.015&&Math.abs(it.v-it.d.v)<.015;}
function logEv(k,x){S.log.push({t:+S.t.toFixed(2),k:k,x:x});if(S.log.length>300)S.log.shift();}

/* ---------------- residents ---------------- */
var JOB_ORDER=['window','laundry','table','half','tea','chairA','chairB','cushion'];
function nextJob(Hs){
  for(var i=0;i<JOB_ORDER.length;i++){var k=JOB_ORDER[i];
    if(k==='window'){if(Hs.windowWant&&!Hs.windowOpen)return {k:k};continue;}
    var it=Hs.items[k];if(!it||!it.visible)continue;
    if(Math.abs(it.u-it.d.u)>.015||Math.abs(it.v-it.d.v)>.015)return {k:k};
  }
  return null;
}
function walkTo(r,u,v,dt){
  var du=u-r.u,dv=(v-r.v),d=hyp(du,dv*0.85),sp=0.62*dt;
  if(d<=sp||d<0.004){r.u=u;r.v=v;r.moving=false;return true;}
  r.u+=du/d*sp;r.v+=dv/d*sp;r.moving=true;r.walk+=dt*11;
  var sdx=r.h?-du:du;if(Math.abs(sdx)>0.004)r.face=sdx>0?1:-1;
  return false;
}
function updRes(Hs,dt){
  var r=Hs.res,it=Hs.items;
  r.bow=Math.max(0,r.bow-dt*1.4);r.wave=Math.max(0,r.wave-dt);r.hop=Math.max(0,r.hop-dt*2.5);r.point=Math.max(0,r.point-dt);
  if(!r.job){var j=nextJob(Hs);if(j){r.job=j;r.phase='go';r.pt=0;}}
  if(r.job){
    r.sit=Math.max(0,r.sit-dt*5);
    if(r.sit>0)return;
    var k=r.job.k;
    if(k==='window'){
      if(r.phase==='go'){if(walkTo(r,.40,.05,dt)){r.phase='open';r.pt=0;}}
      else{Hs.win=Math.min(1,Hs.win+dt*1.4);if(Hs.win>=1){Hs.windowOpen=true;r.job=null;r.bow=1;S.breeze=1;
        var wp=P(Hs.h,.40,-.14);SFX.fuwa();celebrate('window'+Hs.h,wp[0],wp[1],true);}}
      return;
    }
    var o=it[k];
    if(!o||!o.visible){r.job=null;return;}
    if(r.phase==='go'){if(walkTo(r,o.u,o.v+.02,dt)){r.phase='pick';r.pt=0;}}
    else if(r.phase==='pick'){r.pt+=dt;if(r.pt>.22){r.phase='carry';o.carried=true;SFX.lift();}}
    else if(r.phase==='carry'){var ar=walkTo(r,o.d.u,o.d.v+.02,dt);o.u=r.u;o.v=r.v-.004;
      if(ar){o.u=o.d.u;o.v=o.d.v;o.carried=false;o.face=o.fd;o.pull=1;r.phase='drop';r.pt=0;}}
    else if(r.phase==='drop'){r.pt+=dt;if(r.pt>.18){r.job=null;r.bow=0.8;onDrop(Hs,k);}}
    return;
  }
  // free: sit if there is a seat in the shade
  var seatIt=null;
  if(Hs.seat){seatIt=it.chairA;if(r.seatKey==='cushion'&&Hs.rest&&it.cushion&&settled(it.cushion))seatIt=it.cushion;}
  if(seatIt&&settled(seatIt)){
    if(r.sit<=0){if(walkTo(r,seatIt.u,seatIt.v+.012,dt)){if(seatIt.kind==='chair')seatIt.pull=1;r.sit=0.01;}}
    else{r.u=seatIt.u;r.v=seatIt.v+.012;r.sit=Math.min(1,r.sit+dt*4);
      r.sipT-=dt;if(r.sipT<0){r.sip=1.6;r.sipT=4+rnd()*4;}}
  }else{r.sit=Math.max(0,r.sit-dt*5);if(r.sit<=0)walkTo(r,r.home.u,r.home.v,dt);}
  r.sip=Math.max(0,r.sip-dt);
}
function onDrop(Hs,k){
  var it=Hs.items,o=it[k],key=null;
  if(k==='laundry'&&Hs.laundryMoved){key='laundry';it.table.visible=true;it.table.pop=0;plan();}
  else if(k==='table'){Hs.tableDone=true;key='smalltable';plan();}
  else if(k==='cushion'&&Hs.rest){key='rest';Hs.res.seatKey='cushion';}
  else if(k==='half'){checkUnfold();}
  else if(k==='tea'&&Hs.seat&&Hs.mode!=='joint'){key='tea'+Hs.h;}
  else if(k==='chairA'||k==='chairB'||k==='tea'){
    var both=settled(it.chairA)&&settled(it.chairB);
    if(Hs.mode==='bench'&&both)key='bench';
    else if(Hs.mode==='facing'&&both)key='facing';
    else if(Hs.mode==='separate'&&k==='chairB')key='separate';
    else if(Hs.mode==='joint'&&jointSettled())key=S.joint.reshaped?'reshape':'jointseat';
  }
  if(k==='chairA'||k==='chairB'||k==='tea'){
    if(Hs.res.seatKey==='cushion'&&k==='chairA')Hs.res.seatKey='chairA';
    if(S.t-S.lastMove<14&&o.d.u!==o.home.u){key=S.joint.unfolded?'moveAfter':(key||'move');}
  }
  var p=P(Hs.h,o.u,o.v);
  if(key){celebrate(key,p[0],p[1]-L.U*.4,false);}
  else SFX.tok();
}
function jointSettled(){for(var h=0;h<2;h++){var it=HOUSES[h].items;if(!settled(it.chairA)||!settled(it.tea))return false;}return true;}
function checkUnfold(){
  var J=S.joint;if(J.unfolded||!J.open||!J.connected)return;
  if(!settled(HOUSES[0].items.half)||!settled(HOUSES[1].items.half))return;
  J.unfolded=true;J.unf=0;J.cur.long=J.cfg.long;J.cur.v=J.cfg.v;J.reshaped=false;
  HOUSES[0].items.half.visible=false;HOUSES[1].items.half.visible=false;
  SFX.fanfare();S.celebrate=1;
  var p=P(0,1,J.cfg.v);
  for(var i=0;i<3;i++)burst(p[0]+(i-1)*L.HW*0.4,p[1]-L.U,10,[COL.red,COL.yel,COL.blue,COL.white,COL.green],1.4,i%2);
  HOUSES.forEach(function(Hs){Hs.res.wave=2.2;Hs.res.hop=1;});
  found('joint');plan();
}
function found(key){if(!S.found[key]){S.found[key]=+S.t.toFixed(2);logEv('found',key);return true;}return false;}
function celebrate(key,x,y,quiet){
  var first=found(key);
  if(first){if(!quiet)SFX.chime();burst(x,y,14,[COL.red,COL.yel,COL.blue,COL.white],1,1);
    var other=HOUSES[0].res.job?null:HOUSES[0].res;HOUSES.forEach(function(Hs){if(!Hs.res.job){Hs.res.wave=Math.max(Hs.res.wave,1.2);}});}
  else{if(!quiet)SFX.chimeS();burst(x,y,5,[COL.yel,COL.white],0.7,1);}
}

/* ---------------- update ---------------- */
function update(dt){
  S.t+=dt;S.pulse+=dt;
  updateTouchFeedback(dt);
  var c=S.crank;
  // handle spring (press squashes, release bounces back)
  var tgt=c.pressed?1:0;c.sqv+=((tgt-c.sq)*260-c.sqv*16)*dt;c.sq+=c.sqv*dt;
  if(!act||act.mode!=='crank')c.omega*=Math.exp(-5*dt);
  c.full=Math.max(0,c.full-dt*1.5);
  if(c.auto){var adv=dt*3.2;c.p+=adv;c.theta+=c.autoDir*adv*SEG;c.omega=c.autoDir*SEG*3.2;if(c.p>=1){c.auto=false;completeCopy();if(c.p<0.14&&S.flights.length)c.p=0;}}
  setRustle(Math.min(1,Math.abs(c.omega)/9));
  // flights
  for(var i=S.flights.length-1;i>=0;i--){var f=S.flights[i];f.t+=dt/0.75;if(f.t>=1){S.flights.splice(i,1);land(f);}}
  for(var id in S.pots){var p=S.pots[id];p.open=Math.min(1,p.open+dt*1.8);p.wig=Math.max(0,p.wig-dt*2);if(p.back){p.back.t+=dt*4;if(p.back.t>=1)p.back=null;}}
  STANDS.forEach(function(s){s.bob=Math.max(0,s.bob-dt*2);});
  HOUSES.forEach(function(Hs){updRes(Hs,dt);
    for(var k in Hs.items){var it=Hs.items[k];it.pull=Math.max(0,it.pull-dt*3);if(it.visible)it.pop=Math.min(1,it.pop+dt*2.5);}
    if(Hs.windowOpen)Hs.win=1;});
  // joint table anim
  var J=S.joint;
  if(J.unfolded){J.unf=Math.min(1,J.unf+dt*0.7);J.cur.long=lerp(J.cur.long,J.cfg.long,1-Math.exp(-4*dt));J.cur.v=lerp(J.cur.v,J.cfg.v,1-Math.exp(-4*dt));}
  checkUnfold();
  S.celebrate=Math.max(0,S.celebrate-dt*0.4);S.breeze=Math.max(0,S.breeze-dt*0.3);
  // neighbours wave at each other now and then
  S.waveT-=dt;
  if(S.waveT<0){S.waveT=7+rnd()*5;var r0=HOUSES[0].res,r1=HOUSES[1].res;
    if(!r0.job&&!r1.job&&(r0.sit>0.9||r1.sit>0.9||S.joint.unfolded)){r0.wave=1.3;r1.wave=1.3;if(S.joint.unfolded&&rnd()<0.5){r0.bow=1;r1.bow=1;}}}
  // idle demo (only once, first ~4s without input)
  if(!S.everTouched&&!S.demoDone&&S.t>4){S.demo={type:'crank',t:0};S.demoDone=true;}
  if(S.joint.unfolded&&!S.movedAfterDone&&!S.dragDemoDone&&!act&&S.t-S.lastInput>5&&J.unf>=1){
    var g=guideTarget();if(g&&g.type==='pot'){var to=null,from=ST[g.id];
      var bd=9;STANDS.forEach(function(s){if(s.h===from.h&&isEmpty(s.id)){var d=hyp(s.u-from.u,s.v-from.v);if(d<bd){bd=d;to=s.id;}}});
      if(to){S.demo={type:'drag',t:0,from:g.id,to:to};S.dragDemoDone=true;}}}
  if(S.demo){S.demo.t+=dt;if(S.demo.t>2.6)S.demo=null;}
  // idle nudge: residents point toward the target
  if(S.t-S.lastInput>7&&(S.t-S.lastInput)%6<dt){HOUSES.forEach(function(Hs){if(!Hs.res.job)Hs.res.point=1.2;});var gg=guideTarget();if(gg&&gg.type!=='handle'&&gg.type!=='pot')ST[gg.id].bob=1;}
  updParticles(dt);
}


'use strict';
/* ---------------- draw: objects ---------------- */
function drawPlant(x,y,s,open,sway,seed,alpha){
  var r=seeded(seed||1);
  var pw=.62*s,ph=.46*s;
  // pot
  paper([[x-pw/2,y-ph],[x+pw/2,y-ph],[x+pw*.36,y],[x-pw*.36,y]],COL.red,1);
  paper([[x-pw*.58,y-ph-.11*s],[x+pw*.58,y-ph-.11*s],[x+pw*.54,y-ph+.03*s],[x-pw*.54,y-ph+.03*s]],COL.redD,0);
  crease(x-pw*.25,y-ph*.6,x+pw*.25,y-ph*.55,1,'rgba(255,255,255,0.25)');
  var top=y-ph-.08*s,o=clamp(open,0,1);
  var sh=.14*s+.3*s*o;
  ctx.fillStyle=COL.greenD;ctx.fillRect(x-s*.03,top-sh,s*.06,sh);
  var n=5;
  for(var i=0;i<n;i++){
    var base=(i-(n-1)/2)*0.52*(0.35+0.65*o);
    var ang=base+Math.sin(S.t*1.8+i+seed)*sway*0.12-Math.PI/2;
    var len=s*(.2+.38*o)*(i===2?1.05:0.9+r()*0.15);
    var bx=x,by=top-sh*(i===2?1:0.75);
    var tx=bx+Math.cos(ang)*len,ty=by+Math.sin(ang)*len;
    var nx=-Math.sin(ang)*len*.28,ny=Math.cos(ang)*len*.28;
    var mx=bx+Math.cos(ang)*len*.45,my=by+Math.sin(ang)*len*.45;
    var pts=[[bx,by],[mx+nx,my+ny],[tx,ty],[mx-nx*0.8,my-ny*0.8]];
    paper(pts,i%2?COL.green:COL.greenL,0.8);
    crease(bx,by,tx,ty,Math.max(1,s*.025),'rgba(31,74,49,0.45)');
  }
}
function drawStand(s,bounce){
  var p=P(s.h,s.u,s.v),x=p[0],y=p[1],U=L.U,h=standH(s);
  var by=-Math.abs(Math.sin(S.pulse*7))*bounce*U*.12;
  // floor shadow
  ctx.fillStyle='rgba(48,34,18,0.16)';path(ngon(x+U*.05,y+U*.02,U*.42,U*.1,8,0,0,null));ctx.fill();
  if(s.high){
    ctx.fillStyle=COL.kinDD;
    ctx.fillRect(x-U*.32,y-h+by,U*.08,h-by);ctx.fillRect(x+U*.24,y-h+by,U*.08,h-by);
    paper(rect(x-U*.32,y-h*.45+by,U*.64,U*.07),COL.kinD,0.5);
    paper(rect(x-U*.4,y-h-U*.08+by,U*.8,U*.12),COL.yel,1);
  }else{
    paper(rect(x-U*.36,y-h+by,U*.72,h),COL.kinDD,1);
    paper(rect(x-U*.4,y-h-U*.06+by,U*.8,U*.1),COL.kinD,0.4);
    crease(x-U*.3,y-h*.45+by,x+U*.3,y-h*.45+by,1,'rgba(120,95,60,0.35)');
  }
  return by;
}
function drawEmptyMark(s,by,sel){
  var tp=standTop(s),x=tp[0],y=tp[1]+by,U=L.U;
  // shallow paper dish = an empty place
  paper(ngon(x,y-U*.02,U*.26,U*.07,7,0.2,0,null),'rgba(170,140,100,0.45)',0);
  if(sel){
    // selection flag: yamabuki paper flag stuck on the stand
    var fy=y-U*.15-Math.abs(Math.sin(S.pulse*3))*U*.05;
    ctx.fillStyle=COL.yelD;ctx.fillRect(x+U*.18,fy-U*.7,U*.05,U*.7);
    paper([[x+U*.23,fy-U*.7],[x+U*.58,fy-U*.56],[x+U*.23,fy-U*.42]],COL.yel,0.8);
  }
}
function drawShade(id,alpha,ghost){
  var sh=shadeOf(id),p=P(sh.h,sh.u,sh.v),rx=sh.r*L.HW,ry=sh.r*L.floorH;
  var pts=ngon(p[0],p[1],rx,ry,11,ST[id].idx*0.7,0.14,100+ST[id].idx);
  ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(31,74,49,0.15)';path(pts,L.sh*.8,L.sh);ctx.fill();
  ctx.fillStyle=ghost?'rgba(79,140,98,0.18)':'rgba(47,107,69,0.17)';path(pts);ctx.fill();
  // paper fibres hint: a light fold through the tissue
  crease(p[0]-rx*.6,p[1]-ry*.2,p[0]+rx*.5,p[1]+ry*.3,1,'rgba(255,255,255,0.22)');
  ctx.restore();
}
function drawChair(x,y,U,face,col){
  var w=U*.5,sy=y-U*.3;
  ctx.fillStyle=COL.yelD;
  ctx.fillRect(x-w*.42,sy,U*.06,U*.3);ctx.fillRect(x+w*.42-U*.06,sy,U*.06,U*.3);
  // backrest
  var bx=face===0?x:x-face*w*.38,bw=face===0?w:w*.28;
  paper(rect(bx-bw/2,sy-U*.42,bw,U*.42),col||COL.yel,0.9);
  if(face===0)crease(bx-bw*.35,sy-U*.24,bx+bw*.35,sy-U*.24,1,'rgba(193,131,15,0.6)');
  paper(rect(x-w/2,sy-U*.04,w,U*.1),col||COL.yel,0.8);
}
function drawTea(x,y,U,steam){
  paper(ngon(x,y-U*.05,U*.3,U*.08,8,0,0,null),COL.kinD,0.6);
  // teapot
  paper(ngon(x-U*.05,y-U*.2,U*.15,U*.12,8,0.3,0,null),COL.red,0.8);
  paper([[x+U*.08,y-U*.22],[x+U*.2,y-U*.3],[x+U*.21,y-U*.26],[x+U*.1,y-U*.15]],COL.red,0);
  paper(rect(x-U*.08,y-U*.35,U*.06,U*.05),COL.redD,0);
  // cups
  paper(rect(x+U*.12,y-U*.13,U*.1,U*.08),COL.white,0.5);
  paper(rect(x-U*.27,y-U*.13,U*.1,U*.08),COL.white,0.5);
  if(steam){ctx.fillStyle='rgba(255,255,255,0.7)';
    for(var i=0;i<2;i++){var t=(S.t*0.6+i*0.5)%1;var sx=x-U*.05+Math.sin(t*6+i)*U*.05,sy=y-U*.38-t*U*.35;
      ctx.globalAlpha=1-t;path([[sx,sy],[sx+U*.04,sy-U*.06],[sx,sy-U*.12],[sx-U*.03,sy-U*.06]]);ctx.fill();}
    ctx.globalAlpha=1;}
}
function drawLaundry(x,y,U){
  var t=S.t,fl=Math.sin(t*2.2)*U*.04;
  ctx.fillStyle=COL.kinDD;ctx.fillRect(x-U*.55,y-U*1.25,U*.06,U*1.25);ctx.fillRect(x+U*.49,y-U*1.25,U*.06,U*1.25);
  paper(rect(x-U*.6,y-U*1.3,U*1.2,U*.06),COL.white,0.6);
  // shirt
  var sx=x-U*.25,sy=y-U*1.24;
  paper([[sx-U*.22,sy],[sx+U*.22,sy],[sx+U*.3,sy+U*.15],[sx+U*.17+fl,sy+U*.2],[sx+U*.17+fl,sy+U*.6],[sx-U*.17+fl,sy+U*.6],[sx-U*.17+fl,sy+U*.2],[sx-U*.3,sy+U*.15]],COL.blue,1);
  crease(sx,sy+U*.02,sx+fl,sy+U*.58,1,'rgba(75,151,173,0.7)');
  // towel
  var tx=x+U*.25;
  paper([[tx-U*.17,sy],[tx+U*.17,sy],[tx+U*.17+fl*1.4,sy+U*.5],[tx-U*.17+fl*1.4,sy+U*.5]],COL.yel,1);
  crease(tx-U*.17+fl,sy+U*.4,tx+U*.17+fl*1.3,sy+U*.4,2,COL.red);
}
function drawSmallTable(x,y,U){
  ctx.fillStyle=COL.redD;ctx.fillRect(x-U*.26,y-U*.22,U*.06,U*.22);ctx.fillRect(x+U*.2,y-U*.22,U*.06,U*.22);
  paper(ngon(x,y-U*.25,U*.36,U*.11,8,0.2,0,null),COL.red,1);
  crease(x-U*.25,y-U*.27,x+U*.22,y-U*.24,1,'rgba(255,255,255,0.3)');
}
function drawCushion(x,y,U){
  paper([[x-U*.28,y-U*.1],[x+U*.24,y-U*.14],[x+U*.3,y+U*.02],[x-U*.24,y+U*.05]],COL.blue,0.8);
  crease(x-U*.22,y-U*.03,x+U*.24,y-U*.07,1,'rgba(255,255,255,0.4)');
  paper(rect(x+U*.25,y-U*.17,U*.06,U*.06),COL.white,0);
}
function drawHalf(x,y,U){
  paper([[x-U*.22,y],[x+U*.18,y],[x+U*.3,y-U*.95],[x-U*.1,y-U*.95]],COL.green,1);
  crease(x-U*.02,y-U*.05,x+U*.1,y-U*.9,1.5,'rgba(255,255,255,0.25)');
}
function drawJointTable(){
  var J=S.joint;if(!J.unfolded)return;
  var e=easeOutBack(J.unf),U=L.U;
  var lw=lerp(.30,.15,J.cur.long),lv=lerp(.11,.46,J.cur.long);  // X width, v length
  var vc=J.cur.long>0.5?lerp(J.cur.v,.53,J.cur.long):J.cur.v;
  var cx=L.vx+L.HW,cy=L.floorY+vc*L.floorH;
  var hw=lw*L.HW/2*Math.max(0.1,e),hv=lv*L.floorH/2,th=U*.38;
  // legs
  ctx.fillStyle=COL.yelD;
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){ctx.fillRect(cx+q[0]*hw*.85-U*.03,cy+q[1]*hv*.8-th,U*.06,th);});
  paper([[cx-hw,cy-hv-th],[cx+hw,cy-hv-th],[cx+hw,cy+hv-th],[cx-hw,cy+hv-th]],COL.yel,1.3);
  paper(rect(cx-hw,cy+hv-th,hw*2,U*.08),COL.yelD,0);
  // runner cloth
  if(J.cur.long>0.5)paper(rect(cx-hw*.35,cy-hv-th+U*.04,hw*.7,hv*2-U*.08),COL.red,0);
  else paper(rect(cx-hw+U*.04,cy-hv*.4-th,hw*2-U*.08,hv*.8),COL.red,0);
  crease(cx,cy-hv-th,cx,cy+hv-th,1.5,'rgba(193,131,15,0.7)');
  // dango plate in the middle
  var my=cy-th-U*.06;
  paper(ngon(cx,my,U*.2,U*.06,8,0,0,null),COL.white,0.5);
  [COL.red,COL.white,COL.green].forEach(function(c,i){paper(ngon(cx-U*.1+i*U*.1,my-U*.07,U*.05,U*.05,6,0,0,null),c,0);});
}
function drawPartition(){
  var J=S.joint,x=L.vx+L.HW,U=L.U,w=Math.max(6,U*.14);
  var top=L.vy+L.wallH*0.2,bot=L.floorY+L.floorH;
  var gap0=1e9,gap1=-1e9;
  if(J.unfolded){var e=ease(J.unf);var vc=J.cur.long>0.5?.53:J.cur.v;var hl=lerp(.09,.28,J.cur.long);
    gap0=L.floorY+(vc-hl*e)*L.floorH;gap1=L.floorY+(vc+hl*e)*L.floorH;}
  var segs=[[top,Math.min(bot,gap0)],[Math.max(top,gap1),bot]];
  segs.forEach(function(sg){if(sg[1]-sg[0]<2)return;paper(rect(x-w/2,sg[0],w,sg[1]-sg[0]),COL.white,1.2);
    for(var y=sg[0]+U*.3;y<sg[1]-U*.2;y+=U*.55){ctx.fillStyle=COL.kinD;path([[x,y-U*.1],[x+w*.3,y],[x,y+U*.1],[x-w*.3,y]]);ctx.fill();}});
  if(J.unfolded){ // folded-down board lying at the gap edge
    paper(rect(x-w*1.4,gap1-U*.04,w*2.8,U*.08),COL.kinD,0.6);}
}
function drawWindow(Hs){
  var p0=P(Hs.h,WIN.u0,WIN.v0),p1=P(Hs.h,WIN.u1,WIN.v1);
  var x0=Math.min(p0[0],p1[0]),x1=Math.max(p0[0],p1[0]),y0=p0[1],y1=p1[1],w=x1-x0,h=y1-y0;
  var o=ease(Hs.win);
  paper(rect(x0-4,y0-4,w+8,h+8),COL.white,1.2);
  ctx.fillStyle=COL.greenD;ctx.fillRect(x0,y0,w,h);
  // curtain flutters out when open
  if(o>0){var fl=Math.sin(S.t*2.5)*w*.05*o;
    paper([[x0+w*.1,y0],[x0+w*.45,y0],[x0+w*.4+fl,y0+h*.9],[x0+w*.12+fl*1.5,y0+h]],COL.white,0.6);
    paper([[x1-w*.1,y0],[x1-w*.45,y0],[x1-w*.4+fl,y0+h*.9],[x1-w*.12+fl*1.5,y0+h]],COL.white,0.6);}
  // glass panes slide apart
  var pw=w/2;
  paper(rect(x0-o*pw*.42,y0,pw,h),COL.blue,0.5);
  paper(rect(x0+pw+o*pw*.42,y0,pw,h),COL.blue,0.5);
  ctx.fillStyle='rgba(255,255,255,0.35)';
  path([[x0+pw*.15-o*pw*.42,y0+h*.75],[x0+pw*.5-o*pw*.42,y0+h*.15],[x0+pw*.62-o*pw*.42,y0+h*.15],[x0+pw*.27-o*pw*.42,y0+h*.75]]);ctx.fill();
  ctx.fillStyle=COL.white;ctx.fillRect(x0-4,y1-2,w+8,5);
}
function drawGarland(){
  var J=S.joint;if(!J.unfolded)return;
  var e=ease(J.unf*1.3),U=L.U;
  var x0=L.vx+L.HW*0.12,x1=L.vx+L.vw-L.HW*0.12,y=L.vy+L.wallH*0.36;
  var xe=lerp(L.vx+L.HW,x1,e),xs=lerp(L.vx+L.HW,x0,e);
  ctx.fillStyle=COL.kinDD;
  var n=Math.max(8,Math.round((x1-x0)/(U*0.7))),cols=[COL.red,COL.yel,COL.blue,COL.white,COL.green];
  for(var i=0;i<=n;i++){var x=lerp(x0,x1,i/n);if(x<xs-1||x>xe+1)continue;
    var sag=Math.sin(i/n*Math.PI)*U*.25,yy=y+sag+Math.sin(S.t*2+i)*U*.02;
    paper([[x-U*.2,yy],[x+U*.2,yy],[x,yy+U*.38]],cols[i%cols.length],0.6);}
  // string
  ctx.fillStyle='rgba(120,95,60,0.6)';
  for(i=0;i<n;i++){var a=lerp(x0,x1,i/n),b=lerp(x0,x1,(i+1)/n);if(b<xs||a>xe)continue;
    var ya=y+Math.sin(i/n*Math.PI)*U*.25,yb=y+Math.sin((i+1)/n*Math.PI)*U*.25;crease(Math.max(a,xs),ya,Math.min(b,xe),yb,1.4,'rgba(120,95,60,0.6)');}
}
function drawResident(r,pass,look){
  var p=P(r.h,r.u,r.v),x=p[0],y=p[1],U=L.U;
  var sit=ease(r.sit),walk=r.moving?Math.sin(r.walk):0,bob=r.moving?Math.abs(Math.sin(r.walk))*U*.05:0;
  var hop=Math.sin(r.hop*Math.PI)*U*.15;
  var bow=Math.sin(clamp(r.bow,0,1)*Math.PI);
  var legH=lerp(U*.48,U*.16,sit),bodyH=U*.56;
  var hipY=y-legH-bob-hop-lerp(0,U*.12,sit);
  var shY=hipY-bodyH+bow*U*.1;
  var headR=U*.24,hx=x+bow*U*.04*r.face,hy=shY-headR*0.85+bow*U*.14;
  var c1=r.h?COL.blue:COL.red,c2=r.h?COL.yel:COL.white;
  var job=r.job,carrying=job&&r.phase==='carry';
  if(pass==='body'){
    // legs
    ctx.fillStyle=COL.greenD;
    if(sit>0.5){ctx.fillRect(x-U*.15,hipY,U*.12,legH+U*.05);ctx.fillRect(x+U*.03,hipY,U*.12,legH+U*.05);}
    else{ctx.save();ctx.translate(x-U*.08,hipY);ctx.rotate(walk*0.35);ctx.fillRect(-U*.06,0,U*.12,legH);ctx.restore();
      ctx.save();ctx.translate(x+U*.08,hipY);ctx.rotate(-walk*0.35);ctx.fillRect(-U*.06,0,U*.12,legH);ctx.restore();}
    // body (trapezoid dress / shirt)
    paper([[x-U*.17,shY],[x+U*.17,shY],[x+U*.27,hipY+U*.05],[x-U*.27,hipY+U*.05]],c1,1);
    paper([[x-U*.1,shY+U*.12],[x+U*.1,shY+U*.12],[x+U*.15,hipY+U*.02],[x-U*.15,hipY+U*.02]],c2,0);
    crease(x,shY+U*.14,x,hipY,1,'rgba(0,0,0,0.12)');
    // arms
    var lookDir=r.face;
    function arm(side,ang){ctx.save();ctx.translate(x+side*U*.17,shY+U*.05);ctx.rotate(ang);
      ctx.fillStyle=c1;ctx.fillRect(-U*.05,0,U*.1,U*.38);ctx.fillStyle=COL.kin;path(ngon(0,U*.4,U*.06,U*.06,6,0,0,null));ctx.fill();ctx.restore();}
    // angle 0 = hanging down; positive rotates the hand toward -x
    var wv=r.wave>0?Math.sin(S.t*12)*0.4:0;
    var la=-walk*0.5,ra=walk*0.5;
    var sipping=r.sip>0&&sit>0.9&&r.wave<=0&&!job;
    if(carrying){la=-1.2*lookDir;ra=-1.2*lookDir;}
    else if(r.phase==='open'&&job){la=2.7;ra=-2.7;}
    if(r.point>0&&!job){if(lookDir>0)ra=-1.6;else la=1.6;}
    if(r.wave>0&&!carrying){if(r.h===0)ra=-2.6+wv;else la=2.6+wv;}
    if(sipping)la=1.1;
    arm(-1,la);arm(1,ra);
    if(sipping){ // cup in hand (beside the face, never over it)
      var cx2=x-U*.5,cy2=shY+U*.14-Math.sin(clamp(r.sip/1.6,0,1)*Math.PI)*U*.1;paper(rect(cx2-U*.06,cy2,U*.12,U*.1),COL.white,0.5);}
  }else{
    // head pass: always drawn on top so the face stays visible
    paper(ngon(hx,hy,headR,headR*1.02,10,0,0,null),COL.kin,1);
    // hair
    if(r.h===0){paper([[hx-headR*1.02,hy-headR*0.05],[hx-headR*.8,hy-headR*.8],[hx,hy-headR*1.08],[hx+headR*.8,hy-headR*.8],[hx+headR*1.02,hy-headR*0.05],[hx+headR*.5,hy-headR*.5],[hx-headR*.4,hy-headR*.45]],COL.greenD,0.6);
      paper(ngon(hx,hy-headR*1.15,headR*.38,headR*.32,7,0,0,null),COL.greenD,0.5);}
    else{paper([[hx-headR*1.02,hy-headR*0.1],[hx-headR*.7,hy-headR*.9],[hx+headR*.75,hy-headR*.95],[hx+headR*1.02,hy-headR*0.15],[hx+headR*.6,hy-headR*.55],[hx-headR*.6,hy-headR*.5]],COL.greenD,0.6);
      paper([[hx-headR*.9,hy+headR*.95],[hx+headR*.9,hy+headR*.95],[hx+headR*.7,hy+headR*1.25],[hx-headR*.7,hy+headR*1.25]],COL.yel,0);}
    // eyes look toward the target
    var lx=0,ly=0;if(look){var dx=look[0]-hx,dy=look[1]-hy,dd=hyp(dx,dy)||1;lx=dx/dd*headR*.12;ly=dy/dd*headR*.1;}
    ctx.fillStyle=COL.ink;
    if(bow>0.5){ctx.fillRect(hx-headR*.45+lx,hy+headR*.05,headR*.26,headR*.07);ctx.fillRect(hx+headR*.19+lx,hy+headR*.05,headR*.26,headR*.07);}
    else{path(ngon(hx-headR*.32+lx,hy+headR*.02+ly,headR*.1,headR*.13,6,0,0,null));ctx.fill();path(ngon(hx+headR*.32+lx,hy+headR*.02+ly,headR*.1,headR*.13,6,0,0,null));ctx.fill();}
    ctx.fillStyle='rgba(216,70,45,0.45)';path(ngon(hx-headR*.55,hy+headR*.35,headR*.13,headR*.08,6,0,0,null));ctx.fill();path(ngon(hx+headR*.55,hy+headR*.35,headR*.13,headR*.08,6,0,0,null));ctx.fill();
    ctx.fillStyle=COL.redD;path([[hx-headR*.15+lx*.5,hy+headR*.42],[hx+headR*.15+lx*.5,hy+headR*.42],[hx+lx*.5,hy+headR*.55]]);ctx.fill();
  }
}
function drawItem(Hs,k,it){
  var p=P(Hs.h,it.u,it.v),x=p[0],y=p[1],U=L.U;
  if(it.carried){var r=Hs.res,rp=P(Hs.h,r.u,r.v);x=rp[0]+r.face*U*.42;y=rp[1]-U*.45+Math.abs(Math.sin(r.walk))*U*.03;}
  var pop=easeOutBack(it.pop);if(pop<0.02)return;
  ctx.save();ctx.translate(x,y);ctx.scale(pop,pop);ctx.translate(-x,-y);
  var pull=Math.sin(it.pull*Math.PI)*U*.08;
  switch(it.kind){
    case 'chair':{
      var fc=it.carried?0:it.face;
      drawChair(x,y+pull,U*(it.carried?0.8:1),fc);
      break;}
    case 'tea':drawTea(x,y,U*(it.carried?0.85:1),Hs.seat&&!it.carried);break;
    case 'laundry':drawLaundry(x,y,U*(it.carried?0.75:1));break;
    case 'table':drawSmallTable(x,y,U*(it.carried?0.8:1));break;
    case 'cushion':drawCushion(x,y,U);break;
    case 'half':drawHalf(x,y,U*(it.carried?0.8:1));break;
  }
  ctx.restore();
}
function drawBenchPlank(Hs){
  var a=Hs.items.chairA,b=Hs.items.chairB;
  if(Hs.mode!=='bench'||!settled(a)||!settled(b))return null;
  var pa=P(Hs.h,a.u,a.v),pb=P(Hs.h,b.u,b.v),U=L.U;
  var x0=Math.min(pa[0],pb[0])-U*.28,x1=Math.max(pa[0],pb[0])+U*.28,y=(pa[1]+pb[1])/2;
  return function(){paper(rect(x0,y-U*.72,x1-x0,U*.16),COL.yel,1);paper(rect(x0,y-U*.36,x1-x0,U*.12),COL.yel,0.8);
    crease(x0+U*.1,y-U*.64,x1-U*.1,y-U*.64,1,'rgba(193,131,15,0.7)');};
}
function drawHand(x,y,press){
  var U=L.U*1.1,s=1-press*0.12;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  paper([[-U*.08,-U*.05],[U*.08,-U*.05],[U*.09,U*.5],[-U*.09,U*.5]],COL.kin,1.4);
  paper([[-U*.22,U*.3],[U*.25,U*.3],[U*.28,U*.75],[-U*.24,U*.75]],COL.kin,1.2);
  paper(rect(-U*.26,U*.72,U*.56,U*.32),COL.red,1);
  ctx.restore();
}

/* ---------------- draw: copier ---------------- */
function drawCopier(g){
  var c=S.crank,R=L.R,cx=L.cx,cy=L.cy,sq=clamp(c.sq,-0.3,1.3),U=L.U;
  var shiftX=sq*R*0.03,shiftY=sq*R*0.04;
  var gb=(g&&g.type==='handle')?Math.abs(Math.sin(S.pulse*5))*0.06:0;
  // base disc
  paper(ngon(cx,cy,R*1.02,R*1.02,16,c.theta*0.9,0.04,5),COL.greenD,2.2);
  paper(ngon(cx-shiftX*0.5,cy-shiftY*0.5,R*0.97,R*0.97,16,c.theta*0.9,0.04,5),COL.green,0);
  // segment notches on the green ring
  for(var i=0;i<8;i++){var a=c.theta*0.9+i/8*Math.PI*2,nx=cx+Math.cos(a)*R*.9,ny=cy+Math.sin(a)*R*.9;
    ctx.fillStyle=COL.greenD;path(ngon(nx,ny,R*.05,R*.05,3,a,0,null));ctx.fill();}
  // middle yamabuki ring
  paper(ngon(cx+shiftX*0.3,cy+shiftY*0.3,R*.82,R*.82,12,c.theta,0.05,9),COL.yel,1.2);
  // progress band: paper strip that grows around the ring as you crank
  var prog=clamp(c.p,0,1);
  if(prog>0.01){var a0=-Math.PI/2+c.theta,a1=a0-prog*Math.PI*2*(c.omega<0?-1:1);var steps=Math.max(3,Math.round(prog*28)),pts=[];
    for(i=0;i<=steps;i++){var aa=lerp(a0,a1,i/steps);pts.push([cx+Math.cos(aa)*R*.79,cy+Math.sin(aa)*R*.79]);}
    for(i=steps;i>=0;i--){aa=lerp(a0,a1,i/steps);pts.push([cx+Math.cos(aa)*R*.66,cy+Math.sin(aa)*R*.66]);}
    paper(pts,COL.red,0.6);}
  // top white disc (shifts against the others when pressed)
  var tx=cx+shiftX+Math.sin(S.t*40)*c.full*R*.03,ty=cy+shiftY;
  paper(ngon(tx,ty,R*.62,R*.62,10,c.theta*1.12,0.05,13),COL.white,1.4);
  for(i=0;i<3;i++){var ca=c.theta*1.12+i*Math.PI/3;crease(tx+Math.cos(ca)*R*.58,ty+Math.sin(ca)*R*.58,tx-Math.cos(ca)*R*.58,ty-Math.sin(ca)*R*.58,1,'rgba(200,180,140,0.45)');}
  // slit in the paper layers
  var sly=ty+R*.12;
  ctx.fillStyle=COL.greenD;path([[tx-R*.3,sly-R*.03],[tx+R*.3,sly-R*.03],[tx+R*.27,sly+R*.04],[tx-R*.27,sly+R*.04]]);ctx.fill();
  // the copy rising out of the slit
  var grow=clamp(prog,0,1);
  if(grow>0.01){
    ctx.save();ctx.beginPath();ctx.rect(tx-R,ty-R*2,R*2,sly-ty+R*2);ctx.clip();
    var cs=Math.min(U*1.3,R*0.55),py=sly+cs*0.42-grow*cs*1.05;
    drawPlant(tx,py,cs,0.35+grow*0.55,0.5,77,1);
    ctx.restore();
    // lower half of slit lip over the copy
    ctx.fillStyle=COL.white;path([[tx-R*.3,sly+R*.01],[tx+R*.3,sly+R*.01],[tx+R*.28,sly+R*.06],[tx-R*.28,sly+R*.06]]);ctx.fill();
  }
  // handle (thick knob) with stretchy paper band
  var hp=handlePos(),ha=c.theta-Math.PI/2;
  var om=clamp(c.omega/8,-1,1),bandL=Math.abs(om)*0.9+sq*0.15;
  if(bandL>0.03){var pts2=[],st=8;for(i=0;i<=st;i++){var b=ha-Math.sign(om||1)*bandL*i/st;pts2.push([cx+Math.cos(b)*R*.8,cy+Math.sin(b)*R*.8]);}
    for(i=st;i>=0;i--){b=ha-Math.sign(om||1)*bandL*i/st;pts2.push([cx+Math.cos(b)*R*.67,cy+Math.sin(b)*R*.67]);}
    paper(pts2,COL.white,0.5);}
  var hr=Math.max(26,R*.24)*(1+gb);
  var sx=1+sq*0.16,sy=1-sq*0.24;
  if(g&&g.type==='handle'){ctx.save();ctx.globalAlpha=0.35+0.25*Math.sin(S.pulse*5);ctx.fillStyle=COL.yel;path(ngon(hp[0],hp[1],hr*1.7,hr*1.7,12,S.t,0,null));ctx.fill();ctx.restore();}
  ctx.save();ctx.translate(hp[0],hp[1]+sq*hr*0.15);ctx.scale(sx,sy);
  ctx.fillStyle=COL.shadowD;path(ngon(hr*0.12+hr*.1*(1-sq),hr*0.25*(1-sq*0.6),hr,hr,10,ha,0,null));ctx.fill();
  paper(ngon(0,0,hr,hr,10,ha,0,null),COL.red,0);
  paper(ngon(-hr*.12,-hr*.15,hr*.56,hr*.56,8,ha,0,null),COL.white,0.6);
  crease(-hr*.5,hr*.45,hr*.5,hr*.45,1.2,'rgba(162,50,31,0.8)');
  ctx.restore();
}


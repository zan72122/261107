'use strict';
/* =========================================================
   くるくる、ぱさっ！苗コピー機とベランダのひなた茶屋
   papercut / 一本指 / 文字なし
   ========================================================= */
var cv=document.getElementById('c'), ctx=cv.getContext('2d'), saEl=document.getElementById('sa');
var COL={
  green:'#2f6b45', greenD:'#1f4a31', greenL:'#4f8c62',
  red:'#d8462d', redD:'#a2321f',
  yel:'#efaa22', yelD:'#c1830f',
  blue:'#79c3d8', blueD:'#4b97ad',
  white:'#fbf9f2', kin:'#efe4cc', kinD:'#ddcca9', kinDD:'#c8b48c',
  ink:'#20301f', shadow:'rgba(48,34,18,0.30)', shadowD:'rgba(48,34,18,0.42)'
};
function seeded(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var rnd=seeded(((Date.now()&0xffffff)^Math.floor(Math.random()*1e9))>>>0);
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function lerp(a,b,t){return a+(b-a)*t;}
function hyp(x,y){return Math.sqrt(x*x+y*y);}
function ease(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function easeOutBack(t){t=clamp(t,0,1);var c=1.7;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);}

/* ---------------- world definition (normalized house coords) ----------------
   house h: u in [0,1] (1 = partition side), v in [0,1] (0 = wall, 1 = railing)  */
var R_LOW=0.17, R_HIGH=0.22, HIGH_DV=-0.20;
var STAND_DEF=[
 ['D',0,.38,.22,1],['S0',0,.63,.22,0],['P0b',0,.87,.22,0],
 ['A',0,.38,.52,0],['A2',0,.63,.52,0],
 ['C',0,.38,.87,0],['E',0,.63,.87,0],['B',0,.87,.87,0],
 ['H1',1,.38,.22,1],['P1b',1,.87,.22,0],
 ['G1',1,.38,.52,0],['J1',1,.63,.52,0],
 ['K1',1,.38,.87,0],['P1f',1,.87,.87,0]
];
var STANDS=[], ST={};
STAND_DEF.forEach(function(d,i){var s={id:d[0],h:d[1],u:d[2],v:d[3],high:!!d[4],idx:i,bob:0};STANDS.push(s);ST[s.id]=s;});
var CAP=STANDS.length-2;                  // 2 stands always stay free
var SUGGEST=['A','B','A2','C','E','D','G1','P1f','P0b','P1b','S0','J1','H1','K1'];
var WIN={u0:.24,u1:.56,v0:-.26,v1:-.03};  // window rect (same for both houses)
var LAUNDRY_CHK={u:.38,v:.87};            // clothes hang over stand C
var SUN={u:.13,v:.90};                    // laundry destination: no stand can shade it
var TABLE_SPOT={u:.60,v:.72};
var CUSH_SPOT={u:.50,v:.75};

function shadeOf(id){var s=ST[id];return {id:id,h:s.h,u:s.u,v:s.v+(s.high?HIGH_DV:-0.03),r:s.high?R_HIGH:R_LOW};}

/* ---------------- state ---------------- */
var S={t:0,pots:{},reserved:{},selected:'A',flights:[],order:0,
  crank:{theta:0,p:0,pressed:false,sq:0,sqv:0,omega:0,auto:false,autoDir:1,lastA:0,tickAcc:0,full:0,tipShown:false},
  joint:{open:false,unfolded:false,connected:false,cfg:{long:0,v:.72},cur:{long:0,v:.72},unf:0,reshaped:false,ids:{}},
  found:{},log:[],everTouched:false,lastInput:0,demo:null,demoDone:false,dragDemoDone:false,
  particles:[],lastMove:-99,movedAfterDone:false,waveT:8,pulse:0,celebrate:0,breeze:0};

function mkItem(kind,u,v,vis){return {kind:kind,u:u,v:v,home:{u:u,v:v},d:{u:u,v:v},visible:vis!==false,carried:false,face:0,fd:0,pull:0,pop:vis===false?0:1};}
function mkHouse(h){
  var pre=rnd()<0.5?0:1;
  var it={};
  it.crate=mkItem('crate',.13,.52); it.crate.fixed=true;
  it.storage=mkItem('storage',.12,.13); it.storage.fixed=true;
  if(h===0){
    var cs=pre?[[.80,.46],[.88,.60]]:[[.86,.52],[.79,.64]];
    it.chairA=mkItem('chair',cs[0][0],cs[0][1]); it.chairB=mkItem('chair',cs[1][0],cs[1][1]);
    var lx=rnd()<0.5?.46:.31;
    it.laundry=mkItem('laundry',lx,.80);
    it.table=mkItem('table',.20,.20,false);
    it.cushion=mkItem('cushion',.24,.24,false);
  }else{
    var cs1=pre?[[.63,.82],[.86,.56]]:[[.86,.52],[.66,.76]];
    it.chairA=mkItem('chair',cs1[0][0],cs1[0][1]); it.chairB=mkItem('chair',cs1[1][0],cs1[1][1]);
  }
  it.tea=mkItem('tea',.13,.50);
  it.half=mkItem('half',.22,.09);
  var H={h:h,items:it,mode:'none',seat:false,rest:false,windowWant:false,windowOpen:false,win:0,
    laundryMoved:false,tableDone:false,
    res:{h:h,u:.22,v:.68,home:{u:.22,v:.68},job:null,phase:'',pt:0,sit:0,face:1,walk:0,moving:false,bow:0,wave:0,sip:0,sipT:3+rnd()*3,seatKey:'chairA',hop:0,point:0}};
  return H;
}
var HOUSES=[mkHouse(0),mkHouse(1)];

/* ---------------- layout ---------------- */
var W=0,Hh=0,DPR=1,L=null,bgCv=null,fgCv=null;
function readSafe(){var cs=getComputedStyle(saEl);return {t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};}
function layout(){
  W=Math.max(200,window.innerWidth); Hh=Math.max(200,window.innerHeight);
  DPR=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(W*DPR); cv.height=Math.round(Hh*DPR);
  cv.style.width=W+'px'; cv.style.height=Hh+'px';
  var sa=readSafe();
  var portrait=Hh>W*1.1;
  var vx=sa.l+8, vw=W-sa.l-sa.r-16, vy=sa.t+8;
  var vb=portrait?Hh*0.655:Hh*0.665;
  var vh=vb-vy;
  var wallH=vh*0.22, railH=vh*0.05;
  var floorY=vy+wallH, floorH=vh-wallH-railH;
  var HW=vw/2;
  var U=Math.min(HW*0.21,floorH*0.2,90);
  var ct=vb+4, cb=Hh-sa.b-6;
  var R=Math.max(58,Math.min((cb-ct)*0.37,W*0.26,125));
  L={portrait:portrait,vx:vx,vw:vw,vy:vy,vh:vh,vb:vb,wallH:wallH,railH:railH,floorY:floorY,floorH:floorH,HW:HW,U:U,
     cx:W/2,cy:(ct+cb)/2,R:R,ct:ct,cb:cb,sa:sa,sh:Math.max(2,U*0.06)};
  buildBg();
}
function P(h,u,v){var X=h?2-u:u;return [L.vx+X*L.HW, L.floorY+v*L.floorH];}
function standH(s){return s.high?L.U*1.15:L.U*0.34;}
function standTop(s){var p=P(s.h,s.u,s.v);return [p[0],p[1]-standH(s)];}

/* ---------------- drawing helpers (papercut) ---------------- */
function path(pts,dx,dy){dx=dx||0;dy=dy||0;ctx.beginPath();ctx.moveTo(pts[0][0]+dx,pts[0][1]+dy);for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i][0]+dx,pts[i][1]+dy);ctx.closePath();}
function paper(pts,col,sh){
  if(sh!==0){var o=(sh||1)*L.sh;ctx.fillStyle=COL.shadow;path(pts,o*0.7,o);ctx.fill();}
  ctx.fillStyle=col;path(pts);ctx.fill();
}
function rect(x,y,w,h){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
function ngon(cx,cy,rx,ry,n,rot,jit,seed){
  var r=seed!=null?seeded(seed):null,pts=[];
  for(var i=0;i<n;i++){var a=rot+i/n*Math.PI*2;var k=1;if(r)k=1+(r()-0.5)*jit;pts.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]);}
  return pts;
}
function crease(x1,y1,x2,y2,w,col){ // fold line as a thin paper sliver (not an outline)
  var dx=x2-x1,dy=y2-y1,l=hyp(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;
  ctx.fillStyle=col;path([[x1+nx,y1+ny],[x2+nx,y2+ny],[x2-nx,y2-ny],[x1-nx,y1-ny]]);ctx.fill();
}
function fiberPattern(c2,w,h,seed,alpha){
  var r=seeded(seed);c2.save();
  for(var i=0;i<w*h/900;i++){var x=r()*w,y=r()*h,a=r()*Math.PI,l=3+r()*7;
    c2.strokeStyle=r()<0.5?'rgba(120,95,60,'+alpha+')':'rgba(255,255,255,'+(alpha*1.6)+')';
    c2.lineWidth=0.6;c2.beginPath();c2.moveTo(x,y);c2.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c2.stroke();}
  c2.restore();
}

/* ---------------- background ---------------- */
function buildBg(){
  bgCv=document.createElement('canvas');bgCv.width=cv.width;bgCv.height=cv.height;
  fgCv=document.createElement('canvas');fgCv.width=cv.width;fgCv.height=cv.height;
  var save=ctx;
  ctx=bgCv.getContext('2d');ctx.setTransform(DPR,0,0,DPR,0,0);
  // base (kinari board)
  ctx.fillStyle=COL.kin;ctx.fillRect(0,0,W,Hh);
  // sky strip behind wall top
  ctx.fillStyle=COL.blue;ctx.fillRect(0,0,W,L.vy+L.wallH*0.18);
  // paper clouds
  var cr=seeded(7);for(var i=0;i<4;i++){var x=cr()*W,y=L.vy*0.3+cr()*L.wallH*0.1;paper(ngon(x,y+4,L.U*0.9,L.U*0.22,7,0,0.4,30+i),COL.white,0.5);}
  for(var h=0;h<2;h++){
    var x0=L.vx+h*L.HW, x1=x0+L.HW;
    // wall
    paper([[x0,L.vy+L.wallH*0.16],[x1,L.vy+L.wallH*0.16],[x1,L.floorY],[x0,L.floorY]],h?'#f3e8d1':COL.kin,0.6);
    for(var k=1;k<5;k++){var yy=L.vy+L.wallH*0.16+(L.floorY-L.vy-L.wallH*0.16)*k/5;crease(x0,yy,x1,yy,1,'rgba(160,130,90,0.16)');}
    // eave (cut zigzag)
    var ez=[],n=12,ey=L.vy+L.wallH*0.16;
    ez.push([x0,ey-L.wallH*0.08]);ez.push([x1,ey-L.wallH*0.08]);
    for(var j=n;j>=0;j--){ez.push([x0+(x1-x0)*j/n,ey+(j%2?L.wallH*0.07:L.wallH*0.03)]);}
    paper(ez,h?COL.blueD:COL.greenD,1);
    // floor
    paper([[x0,L.floorY],[x1,L.floorY],[x1,L.floorY+L.floorH+L.railH*0.4],[x0,L.floorY+L.floorH+L.railH*0.4]],COL.white,0);
    var planks=7;for(k=0;k<planks;k++){var y1=L.floorY+L.floorH*k/planks;
      if(k%2){ctx.fillStyle='rgba(221,204,169,0.30)';ctx.fillRect(x0,y1,L.HW,L.floorH/planks);}
      crease(x0,y1,x1,y1,1.2,'rgba(170,140,100,0.20)');}
    // floor drop-shadow from wall
    ctx.fillStyle='rgba(48,34,18,0.12)';path([[x0,L.floorY],[x1,L.floorY],[x1,L.floorY+L.sh*2],[x0,L.floorY+L.sh*2.6]]);ctx.fill();
    // storage cabinet
    var sp=P(h,.12,.13),U=L.U,sx=sp[0],sy=sp[1];
    paper(rect(sx-U*.36,sy-U*1.05,U*.72,U*1.05),COL.kinD,1.2);
    crease(sx,sy-U*1.0,sx,sy-U*.05,1.2,'rgba(150,120,80,0.35)');
    ctx.fillStyle=COL.yelD;ctx.fillRect(sx-U*.12,sy-U*.6,U*.06,U*.12);ctx.fillRect(sx+U*.06,sy-U*.6,U*.06,U*.12);
    // tea crate
    var cp=P(h,.13,.52);
    paper(rect(cp[0]-U*.36,cp[1]-U*.42,U*.72,U*.42),COL.kinDD,1);
    paper(rect(cp[0]-U*.36,cp[1]-U*.48,U*.72,U*.1),COL.kinD,0);
    crease(cp[0]-U*.3,cp[1]-U*.2,cp[0]+U*.3,cp[1]-U*.2,1.2,'rgba(120,95,60,0.3)');
  }
  // copier ledge
  paper([[0,L.vb],[W,L.vb],[W,Hh],[0,Hh]],COL.kinD,0);
  ctx.fillStyle='rgba(48,34,18,0.16)';ctx.fillRect(0,L.vb,W,L.sh*2.4);
  for(var q=1;q<5;q++){crease(0,L.vb+(Hh-L.vb)*q/5,W,L.vb+(Hh-L.vb)*q/5+6,1,'rgba(150,120,80,0.18)');}
  // decorative paper stack & watering can (static)
  var lr=seeded(11);
  var dx=L.portrait?W*0.12:W*0.16, dy=L.cy+L.R*0.45;
  for(q=0;q<4;q++)paper(rect(dx-L.U*.6+q*2,dy-q*L.U*.1,L.U*1.2,L.U*.09),q%2?COL.white:COL.blue,0.6);
  var wx=L.portrait?W*0.87:W*0.84, wy=L.cy+L.R*0.5;
  paper([[wx-L.U*.42,wy],[wx+L.U*.3,wy],[wx+L.U*.36,wy-L.U*.55],[wx-L.U*.46,wy-L.U*.55]],COL.blueD,1);
  paper([[wx+L.U*.3,wy-L.U*.35],[wx+L.U*.85,wy-L.U*.7],[wx+L.U*.9,wy-L.U*.62],[wx+L.U*.34,wy-L.U*.2]],COL.blueD,0.8);
  fiberPattern(ctx,W,Hh,3,0.07);
  // foreground (railing)
  ctx=fgCv.getContext('2d');ctx.setTransform(DPR,0,0,DPR,0,0);
  var ry=L.floorY+L.floorH, rh=L.railH;
  for(h=0;h<2;h++){
    x0=L.vx+h*L.HW;x1=x0+L.HW;
    paper(rect(x0,ry+rh*0.15,L.HW,rh*0.85),h?COL.blueD:COL.green,1);
    var bars=Math.max(6,Math.round(L.HW/26));
    for(k=0;k<bars;k++){var bx=x0+(k+0.5)*L.HW/bars;ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(bx-1.5,ry+rh*0.32,3,rh*0.58);}
    paper(rect(x0,ry,L.HW,rh*0.24),COL.yel,0.7);
  }
  ctx=save;
}


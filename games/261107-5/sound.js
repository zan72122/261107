'use strict';
/* ---------------- audio (Web Audio synth) ---------------- */
var AC=null,master=null,noiseBuf=null,rustleG=null,rustleF=null;
function initAudio(){
  if(AC){if(AC.state==='suspended'){try{AC.resume();}catch(e){}}return;}
  var A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  try{AC=new A();}catch(e){AC=null;return;}
  master=AC.createGain();master.gain.value=0.55;master.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);var d=noiseBuf.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  var src=AC.createBufferSource();src.buffer=noiseBuf;src.loop=true;
  rustleF=AC.createBiquadFilter();rustleF.type='bandpass';rustleF.frequency.value=2200;rustleF.Q.value=0.7;
  rustleG=AC.createGain();rustleG.gain.value=0;
  src.connect(rustleF);rustleF.connect(rustleG);rustleG.connect(master);src.start();
}
function tone(f,dl,dur,type,vol,f2){
  if(!AC)return;var t0=AC.currentTime+(dl||0);
  var o=AC.createOscillator(),g=AC.createGain();o.type=type||'triangle';o.frequency.setValueAtTime(f,t0);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol||0.15,t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g);g.connect(master);o.start(t0);o.stop(t0+dur+0.05);
}
function noise(dl,dur,f,q,vol,f2,type){
  if(!AC)return;var t0=AC.currentTime+(dl||0);
  var s=AC.createBufferSource();s.buffer=noiseBuf;var fl=AC.createBiquadFilter();fl.type=type||'bandpass';fl.frequency.setValueAtTime(f,t0);fl.Q.value=q||1;
  if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t0+dur);
  var g=AC.createGain();g.gain.setValueAtTime(0.0001,t0);g.gain.exponentialRampToValueAtTime(vol||0.2,t0+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(fl);fl.connect(g);g.connect(master);s.start(t0,Math.random()*0.5);s.stop(t0+dur+0.05);
}
var SFX={
  press:function(){noise(0,0.07,1500,0.9,0.22);tone(200,0,0.09,'sine',0.12,120);},
  tick:function(p){tone(420+520*p,0,0.05,'triangle',0.06);noise(0,0.03,3200,2,0.05);},
  pasa:function(){noise(0,0.17,2600,0.8,0.42,650);tone(160,0.01,0.14,'sine',0.22,70);},
  pick:function(){tone(700,0,0.07,'sine',0.11);tone(1050,0.05,0.08,'sine',0.08);},
  lift:function(){noise(0,0.1,1800,1.2,0.15,3000);},
  whoosh:function(){noise(0,0.36,700,1.1,0.12,3200);},
  tok:function(){tone(340,0,0.07,'sine',0.08);noise(0,0.04,1200,1,0.06);},
  leaf:function(){noise(0,0.14,4200,1.5,0.12,2500);},
  chimeS:function(){tone(784,0,0.25,'triangle',0.11);tone(1047,0.08,0.3,'triangle',0.09);},
  chime:function(){var n=[523,659,784,1047];n.forEach(function(f,i){tone(f,i*0.08,0.4,'triangle',0.13);});tone(2093,0.32,0.5,'sine',0.05);},
  fuwa:function(){tone(392,0,0.5,'sine',0.1,784);noise(0,0.5,900,0.6,0.08,2200);tone(1175,0.3,0.5,'triangle',0.07);},
  fanfare:function(){var n=[523,659,784,880,1047,1319,1568];n.forEach(function(f,i){tone(f,i*0.09,0.5,'triangle',0.12);});
    [523,659,784].forEach(function(f){tone(f,0.7,1.2,'sine',0.08);});noise(0.6,0.5,3000,0.7,0.12,6000);},
  full:function(){tone(300,0,0.09,'sine',0.08);tone(260,0.08,0.1,'sine',0.07);}
};
function setRustle(level){if(!AC||!rustleG)return;var t=AC.currentTime;rustleG.gain.setTargetAtTime(clamp(level,0,1)*0.22,t,0.05);rustleF.frequency.setTargetAtTime(1600+level*2400,t,0.08);}


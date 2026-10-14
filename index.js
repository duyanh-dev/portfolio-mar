(function(){
gsap.registerPlugin(ScrollTrigger);
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var coarse=matchMedia('(pointer: coarse)').matches;
var $=function(s){return document.querySelector(s)};
var PRESS_CARD=true; /* false: không thả thẻ ở phần "Báo chí nói gì" (chỉ desktop/tablet) */
if(!PRESS_CARD)document.documentElement.classList.add('nopress');

/* barcode */
var bars=$('#bars');
for(var i=0;i<34;i++){var bi=document.createElement('i');bi.style.width=(1+Math.floor(Math.abs(Math.sin(i*12.9))*4))+'px';bars.appendChild(bi)}

/* tách từ cho tiêu đề h2 (làm trước khi tạo ScrollTrigger) */
if(!reduce){
  document.querySelectorAll('h2:not(.f-big)').forEach(function(h){
    var t=h.textContent;h.setAttribute('aria-label',t);
    h.innerHTML=t.split(' ').map(function(w){return '<span class="w" aria-hidden="true"><span>'+w+'</span></span>'}).join(' ');
  });
}

/* marquee */
var words=['Chiến lược thương hiệu','Quan hệ báo chí','Quản trị khủng hoảng','Nội dung','Sự kiện','Influencer'];
var mq=$('#marq'),mh='';
for(var k=0;k<2;k++){mh+='<div>'+words.map(function(w){return '<span>'+w+'</span>'}).join('')+'</div>'}
mq.innerHTML=mh;
if(!reduce){
  var mt=gsap.to(mq,{xPercent:-50,duration:30,ease:'none',repeat:-1}),ts=1;
  ScrollTrigger.create({onUpdate:function(s){ts=Math.min(6,1+Math.abs(s.getVelocity())/500)}});
  gsap.ticker.add(function(){ts+=(1-ts)*.06;mt.timeScale(ts)});
}

/* ===================== HERO 3D (three.js) ===================== */
(function(){
  var box=$('#stage3d'),cv=$('#gl'),hero=$('#hero'),hint=$('#hint');
  if(!window.THREE){box.classList.add('nogl');return}
  var renderer;
  try{renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true,powerPreference:'high-performance'})}
  catch(err){box.classList.add('nogl');return}
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault()});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<900?1.5:2));
  renderer.setClearColor(0x000000,0);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(35,1,.1,100);
  scene.add(new THREE.HemisphereLight(0xcdbdff,0x2432f5,.75));
  var key=new THREE.DirectionalLight(0xffffff,1.05);key.position.set(4,5,6);scene.add(key);
  var rimL=new THREE.PointLight(0xff5a2c,1.2,30);rimL.position.set(-6,-2,-3);scene.add(rimL);

  var cTang=0xff5a2c,cInk=0x15131a,cPaper=0xf4f5f7,cLilac=0xcdbdff,cGold=0xffd23f;
  function mat(c,r){return new THREE.MeshStandardMaterial({color:c,roughness:r==null?.4:r,metalness:.05})}
  function flat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:.05,flatShading:true})}

  var root=new THREE.Group(),fl=new THREE.Group(),mega=new THREE.Group();
  scene.add(root);root.add(fl);fl.add(mega);
  mega.rotation.z=-Math.PI/2;
  var BASE=-.55;

  /* --- chiếc loa --- */
  var geoH=new THREE.CylinderGeometry(1.5,.5,2.4,64,1,true);
  var horn=new THREE.Mesh(geoH,mat(cTang,.35));
  var hornIn=new THREE.Mesh(geoH,new THREE.MeshStandardMaterial({color:0x9a2e10,roughness:.8,side:THREE.BackSide}));
  horn.position.y=hornIn.position.y=.4;
  mega.add(horn);mega.add(hornIn);
  var rim=new THREE.Mesh(new THREE.TorusGeometry(1.5,.1,16,72),mat(cPaper,.3));
  rim.rotation.x=Math.PI/2;rim.position.y=1.6;mega.add(rim);
  var band=new THREE.Mesh(new THREE.TorusGeometry(.91,.07,12,48),mat(cInk,.5));
  band.rotation.x=Math.PI/2;band.position.y=.15;mega.add(band);
  var cap=new THREE.Mesh(new THREE.SphereGeometry(.5,32,16),mat(cTang,.35));
  cap.scale.y=.8;cap.position.y=-.8;mega.add(cap);
  var knob=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,.28,24),mat(cInk,.5));
  knob.position.y=-1.2;mega.add(knob);
  var blk=new THREE.Mesh(new THREE.BoxGeometry(.5,.34,.34),mat(cInk,.5));
  blk.position.set(.72,-.1,0);mega.add(blk);
  var grip=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.9,24),mat(cInk,.5));
  grip.rotation.z=Math.PI/2;grip.position.set(1.3,-.1,0);mega.add(grip);

  /* --- sóng âm --- */
  var waves=[];
  for(var wi=0;wi<4;wi++){
    var wm=new THREE.MeshBasicMaterial({color:wi%2?cLilac:cPaper,transparent:true,opacity:0,depthWrite:false});
    var w=new THREE.Mesh(new THREE.TorusGeometry(1,.035,8,72),wm);
    w.rotation.y=Math.PI/2;w.userData.p=wi/4;
    fl.add(w);waves.push(w);
  }

  /* --- confetti (vòng nhỏ hơn để không bị cắt cạnh) --- */
  var gs=[new THREE.IcosahedronGeometry(.3,0),new THREE.OctahedronGeometry(.32,0),new THREE.TorusGeometry(.26,.09,10,24),new THREE.SphereGeometry(.22,16,12),new THREE.BoxGeometry(.4,.4,.4)];
  var cs=[cTang,cInk,cPaper,cLilac,cGold];
  var conf=[],cn=innerWidth<900?11:16;
  for(var ci=0;ci<cn;ci++){
    var m=new THREE.Mesh(gs[ci%gs.length],flat(cs[(ci*2+1)%cs.length]));
    var a=ci/cn*Math.PI*2+Math.random()*.5,r=2.9+Math.random()*1.7;
    m.userData={p:new THREE.Vector3(Math.cos(a)*r*1.05,Math.sin(a)*r*.8,(Math.random()-.5)*4),s:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(1.6),ph:Math.random()*6.28,amp:.15+Math.random()*.25};
    m.position.copy(m.userData.p);
    root.add(m);conf.push(m);
  }

  /* --- chip chữ nổi --- */
  var chips=[];
  function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
  function chip(text,bg,pos,ph){
    var c=document.createElement('canvas'),x=c.getContext('2d'),f='800 52px "Bricolage Grotesque",system-ui,sans-serif';
    x.font=f;var tw=Math.ceil(x.measureText(text).width),w=tw+72,h=104,pad=14;
    c.width=w+pad*2+8;c.height=h+pad*2+8;
    x.font=f;x.textBaseline='middle';
    x.fillStyle='#15131a';rr(x,pad+8,pad+8,w,h,h/2);x.fill();
    x.fillStyle=bg;rr(x,pad,pad,w,h,h/2);x.fill();
    x.lineWidth=6;x.strokeStyle='#15131a';x.stroke();
    x.fillStyle='#15131a';x.fillText(text,pad+36,pad+h/2+3);
    var tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;tex.generateMipmaps=false;
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
    sp.scale.set(c.width/95,c.height/95,1);
    sp.position.copy(pos);sp.userData={p:pos.clone(),ph:ph};
    root.add(sp);chips.push(sp);
  }
  function buildChips(){
    chip('460+ bài báo','#f4f5f7',new THREE.Vector3(-2.7,2.4,1.4),0);
    chip('48h khủng hoảng','#cdbdff',new THREE.Vector3(3.1,-2.4,1.6),1.7);
    chip('#NhắcTên','#ff5a2c',new THREE.Vector3(3.3,2.2,.2),3.1);
  }
  var fr=(document.fonts&&document.fonts.load)?document.fonts.load('800 52px "Bricolage Grotesque"','bài báo khủng hoảng #NhắcTên'):Promise.resolve();
  fr.catch(function(){}).then(buildChips);

  /* --- tương tác --- */
  var st={ry:0,rx:0,vy:0,vx:0,tx:0,ty:0,drag:false,lx:0,ly:0,sx:0,sy:0,t0:0,burst:0,punch:0};
  function hintOff(){hint.classList.add('off')}
  function wrapPi(a){return((a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI}
  function blast(){st.burst=1;st.punch=1;st.vy+=.2;hintOff()}
  cv.addEventListener('pointerdown',function(e){
    st.drag=true;st.lx=st.sx=e.clientX;st.ly=st.sy=e.clientY;st.t0=performance.now();
    cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);hintOff();
  });
  cv.addEventListener('pointermove',function(e){
    if(!st.drag)return;
    var dx=e.clientX-st.lx,dy=e.clientY-st.ly;st.lx=e.clientX;st.ly=e.clientY;
    st.vy=dx*.009;st.vx=dy*.006;st.ry+=st.vy;st.rx=Math.max(-.6,Math.min(.6,st.rx+st.vx));
  });
  cv.addEventListener('pointerup',function(e){
    if(!st.drag)return;st.drag=false;
    var tap=performance.now()-st.t0<300&&Math.hypot(e.clientX-st.sx,e.clientY-st.sy)<8;
    st.ry=wrapPi(st.ry);if(tap)blast();
  });
  cv.addEventListener('pointercancel',function(){st.drag=false;st.ry=wrapPi(st.ry)});
  if(!coarse&&!reduce)hero.addEventListener('pointermove',function(e){
    var r=box.getBoundingClientRect();
    st.tx=((e.clientX-r.left)/r.width-.5)*.5;st.ty=((e.clientY-r.top)/r.height-.5)*.35;
  });

  /* --- kích thước: camera lùi xa hơn để mô hình nhỏ lại, nằm gọn trong khung --- */
  function size(){
    var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    var fov=camera.fov*Math.PI/180;
    var dist=Math.max(13,(13.6/2)/Math.tan(fov/2)/camera.aspect);
    camera.position.set(0,0,dist);camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    root.position.x=-1;
  }
  new ResizeObserver(size).observe(box);size();

  /* --- vòng lặp --- */
  var clock=0,last=0,run=false,vis=true,raf=0;
  function frame(now){
    if(!run)return;
    raf=requestAnimationFrame(frame);
    var dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
    if(!st.drag){
      st.ry+=st.vy;st.vy*=.94;st.rx+=st.vx;st.vx*=.94;
      st.rx+=(0-st.rx)*.02;
      if(clock>2.6&&Math.abs(st.vy)<.002)st.ry+=(0-st.ry)*.012;
    }
    var idle=reduce?0:Math.sin(clock*.5)*.28;
    root.rotation.y=BASE+st.ry+idle+st.tx*.8;
    root.rotation.x=st.rx+st.ty*.6;
    fl.position.y=reduce?0:Math.sin(clock*1.1)*.18;
    fl.rotation.z=.1+(reduce?0:Math.sin(clock*.8)*.04);
    st.punch*=Math.exp(-dt*7);st.burst=Math.max(0,st.burst-dt*.9);
    fl.scale.setScalar(1+st.punch*.12);

    var sp=.42+st.burst*1.3;
    for(var i=0;i<waves.length;i++){
      var w=waves[i];
      w.userData.p=(w.userData.p+dt*sp)%1;
      var p=w.userData.p,s=1.25+p*2.1+st.burst*p*.6;
      w.position.x=1.75+p*4.4;w.scale.set(s,s,s);
      w.material.opacity=Math.min(1,p*10)*(1-p)*(.55+st.burst*.4);
    }
    var k=1+st.burst*.4;
    for(var j=0;j<conf.length;j++){
      var m=conf[j],u=m.userData;
      m.position.set(u.p.x*k,u.p.y*k+(reduce?0:Math.sin(clock*.9+u.ph)*u.amp),u.p.z);
      if(!reduce){m.rotation.x+=u.s.x*dt;m.rotation.y+=u.s.y*dt;m.rotation.z+=u.s.z*dt}
    }
    for(var q=0;q<chips.length;q++){
      var c=chips[q],cu=c.userData;
      c.position.set(cu.p.x*k,cu.p.y*k+(reduce?0:Math.sin(clock*1.1+cu.ph)*.14),cu.p.z);
    }
    renderer.render(scene,camera);
  }
  function setRun(v){
    if(v===run)return;run=v;
    if(v){last=performance.now();raf=requestAnimationFrame(frame)}else cancelAnimationFrame(raf);
  }
  new IntersectionObserver(function(en){vis=en[0].isIntersecting;setRun(vis&&!document.hidden)}).observe(box);
  document.addEventListener('visibilitychange',function(){setRun(vis&&!document.hidden)});

  if(reduce){root.scale.setScalar(1)}
  else{
    root.scale.setScalar(.001);st.ry=-Math.PI*1.4;
    gsap.to(root.scale,{x:1,y:1,z:1,duration:1.5,ease:'elastic.out(1,.55)',delay:.35});
    gsap.to(st,{ry:0,duration:2,ease:'power3.out',delay:.3});
  }
})();

/* ===================== LANYARD (verlet) ===================== */
var card=$('#card'),strap=$('#strap'),stitch=$('#stitch'),flipEl=$('#flip');
var anc={x:0,y:-700,s:1},S=1,RES=310,MOB=false,shown=false,flipped=false;
var N=9,L=190,RL=300,MAXS=2.2,sScale=1,seg,pts=[],C,W=0,H=0,ax=0,dragging=false,ptr={x:0,y:0},off={x:0,y:0},lastW=0,all=[],asleep=false,lx=0,ly=0;

function vw(){return document.documentElement.clientWidth}
function metrics(){
  var cs=getComputedStyle(document.documentElement);
  S=parseFloat(cs.getPropertyValue('--s'));if(isNaN(S))S=1;
  RES=parseFloat(cs.getPropertyValue('--res'));if(isNaN(RES))RES=310;
  W=vw();H=innerHeight;lastW=W;MOB=W<760;
}
function mk(x,y,w){return{x:x,y:y,px:x,py:y,w:w}}
function init(){
  metrics();
  /* SP: thẻ treo giữa màn hình. Desktop/tablet: tâm cột chừa chỗ (cùng biến --res với CSS) */
  ax=anc.x=MOB?W/2:W-RES/2;
  anc.s=S;L=190*S;
  RL=S>=1?Math.min(300,H*.32):(S>=.8?Math.min(220,H*.26):Math.min(120,H*.16));
  seg=RL/(N-1);
  MAXS=Math.max(2.2,(H*.82-L)/RL);   /* dây giãn tối đa: kéo được rất sâu */
  sScale=1;
  pts=[];
  for(var i=0;i<N;i++)pts.push(mk(ax+i*.4,anc.y+i*.3,i===0?0:1));
  C=mk(ax+3,anc.y+4,.35);
  all=pts.concat([C]);asleep=false;
}
function solve(a,b,d){
  var dx=b.x-a.x,dy=b.y-a.y,len=Math.sqrt(dx*dx+dy*dy)||1e-4,diff=(len-d)/len,s=a.w+b.w;
  if(!s)return;
  a.x+=dx*diff*a.w/s;a.y+=dy*diff*a.w/s;
  b.x-=dx*diff*b.w/s;b.y-=dy*diff*b.w/s;
}
function step(){
  if(W&&Math.abs(vw()-lastW)>2)init();
  ax=anc.x;
  if(asleep&&!dragging&&anc.x===lx&&anc.y===ly)return;
  lx=anc.x;ly=anc.y;asleep=false;
  for(var i=0;i<all.length;i++){
    var p=all[i];if(!p.w)continue;
    if(p===C&&dragging)continue;
    var vx=(p.x-p.px)*.987,vy=(p.y-p.py)*.987;
    p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+(p===C?.75:.5);
  }
  var kt=1;
  if(dragging){
    var tx=ptr.x-off.x,ty=ptr.y-off.y;
    tx=Math.max(24,Math.min(W-24,tx));ty=Math.max(L,Math.min(H-L*.55,ty));
    var dx=tx-ax,dy=ty-anc.y,d=Math.sqrt(dx*dx+dy*dy),rmax=RL*MAXS+L;
    if(d>rmax){tx=ax+dx/d*rmax;ty=anc.y+dy/d*rmax;d=rmax}
    kt=Math.max(1,Math.min(MAXS,(d-L)/RL));   /* dây giãn ra theo tay kéo */
    C.px=C.x;C.py=C.y;C.x=tx;C.y=ty;
  }
  sScale+=(kt-sScale)*(dragging?.28:.07);       /* thả tay: dây co lại đàn hồi */
  var sg=seg*sScale;
  for(var it=0;it<16;it++){
    pts[0].x=ax;pts[0].y=anc.y;
    for(var j=1;j<N;j++)solve(pts[j-1],pts[j],sg);
    C.w=dragging?0:.35;
    solve(pts[N-1],C,L);
  }
  if(!dragging){C.x=Math.max(20,Math.min(W-20,C.x));C.y=Math.min(H-10,C.y)}
  draw();
  if(!dragging){
    var mv=0;
    for(var k=0;k<all.length;k++)mv=Math.max(mv,Math.abs(all[k].x-all[k].px),Math.abs(all[k].y-all[k].py));
    if(mv<.04&&Math.abs(sScale-1)<.002)asleep=true;
  }
}
function draw(){
  var A=pts[N-1],th=-Math.atan2(C.x-A.x,C.y-A.y)*180/Math.PI;
  card.style.transform='translate('+(A.x-125)+'px,'+A.y+'px) rotate('+th+'deg) scale('+anc.s+')';
  var d='M'+pts[0].x+' '+pts[0].y;
  for(var i=1;i<N-1;i++){var m={x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2};d+=' Q'+pts[i].x+' '+pts[i].y+' '+m.x+' '+m.y}
  d+=' L'+A.x+' '+A.y;
  strap.setAttribute('d',d);stitch.setAttribute('d',d);
}
var t0=0,p0={x:0,y:0};
card.addEventListener('pointerdown',function(e){
  asleep=false;e.preventDefault();dragging=true;
  ptr={x:e.clientX,y:e.clientY};off={x:ptr.x-C.x,y:ptr.y-C.y};
  t0=Date.now();p0={x:e.clientX,y:e.clientY};
  card.setPointerCapture&&card.setPointerCapture(e.pointerId);
});
card.addEventListener('pointermove',function(e){if(dragging)ptr={x:e.clientX,y:e.clientY}});
card.addEventListener('pointerup',function(e){
  var tap=dragging&&Date.now()-t0<300&&Math.hypot(e.clientX-p0.x,e.clientY-p0.y)<8;
  dragging=false;if(tap)flip();
});
card.addEventListener('pointercancel',function(){dragging=false});
function flip(){
  if(!shown)return;
  flipped=!flipped;
  gsap.to(flipEl,{rotationY:flipped?180:0,duration:.9,ease:'back.out(1.5)',overwrite:true});
  C.px-=14;asleep=false;
}
card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});

function lift(){return Math.max(540,RL*1.4+380*S+60)}
function ropeTo(show,done,dur){
  asleep=false;dragging=false;
  gsap.to(anc,{y:show?-24:-lift(),duration:dur,ease:show?'power3.in':'power2.in',overwrite:true,onComplete:done});
}
function dockIn(){
  if(shown)return;shown=true;
  if(card.style.visibility!=='visible'){
    anc.y=-lift();init();
    card.style.visibility='visible';
  }
  ropeTo(true,null,.38);
}
function dockOut(){
  if(!shown)return;shown=false;
  ropeTo(false,function(){
    if(shown)return;
    card.style.visibility='hidden';
    if(flipped){flipped=false;gsap.set(flipEl,{rotationY:0})}
  },.28);
}

/* Hero KHÔNG có thẻ.
   Desktop/tablet: thẻ rơi khi vào "Về mình", ở lại đến hết "Báo chí nghe tôi...", (tuỳ chọn) rơi thêm ở "Báo chí nói gì".
   SP: thẻ chỉ treo giữa màn hình trong cảnh "Về mình", các section khác không bị chừa chỗ. */
function wantDock(){
  var vh=innerHeight,mob=vw()<760;
  var m=$('#ve-toi').getBoundingClientRect();
  if(mob)return m.top<vh*.1&&m.bottom>vh*.9;
  var a=$('#gioi-thieu').getBoundingClientRect();
  if(m.top<vh*.25&&a.bottom>vh*.5)return true;
  if(PRESS_CARD){var p=$('.press').getBoundingClientRect();if(p.top<vh*.75&&p.bottom>vh*.25)return true}
  return false;
}
var tick=0;
function sync(){if(tick)return;tick=1;requestAnimationFrame(function(){tick=0;wantDock()?dockIn():dockOut()})}

/* cuộn trang làm thẻ lắc lư */
var lastY=scrollY;
addEventListener('scroll',function(){
  var y=scrollY,dy=y-lastY;lastY=y;
  if(shown&&!dragging&&Math.abs(dy)>1&&pts.length){
    var imp=Math.max(-18,Math.min(18,dy*.16))*(S<1?.85:1);
    for(var i=N-4;i<N;i++)pts[i].px-=imp*(.35+(i-(N-4))*.2);
    C.px-=imp*1.2;
    asleep=false;
  }
  sync();
},{passive:true});
addEventListener('resize',sync);

init();draw();
gsap.ticker.add(step);

/* ===================== VỀ MÌNH (cảnh ghim 4 chương) ===================== */
var meEl=$('#ve-toi'),meYear=$('#meYear'),meFill=$('#meFill'),meBg=$('#meBg');
var chs=gsap.utils.toArray('.ch');
var COL=[['#cdbdff','#15131a'],['#ffd23f','#15131a'],['#2432f5','#f4f5f7'],['#15131a','#f4f5f7']];
var YRS=[2017,2020,2023,2026,2026];
var cur=-1;
function setCh(i){
  if(i===cur)return;
  var first=cur<0;cur=i;
  chs.forEach(function(c,j){
    var on=j===i;
    gsap.to(c,{autoAlpha:on?1:0,y:on?0:(j<i?-26:26),duration:on?.6:.35,delay:on&&!first?.12:0,ease:'power3.out',overwrite:true});
  });
  gsap.to(meEl,{backgroundColor:COL[i][0],color:COL[i][1],duration:.7,ease:'power2.out',overwrite:'auto'});
}
if(!reduce){
  gsap.set(chs,{autoAlpha:0,y:26});
  var setBg=gsap.quickSetter(meBg,'xPercent');
  var upd=function(p){
    var q=Math.min(3.999,Math.max(0,p*4)),i=Math.floor(q),f=q-i;
    meYear.textContent=Math.round(YRS[i]+(YRS[i+1]-YRS[i])*f);
    meFill.style.transform='scaleX('+Math.max(0,Math.min(1,p))+')';
    setBg(-p*50);
    setCh(i);
  };
  upd(0);
  ScrollTrigger.create({trigger:meEl,start:'top top',end:'bottom bottom',onUpdate:function(s){upd(s.progress)},onRefresh:function(s){upd(s.progress)}});
}

/* ===================== SCROLL EFFECTS ===================== */
gsap.to('#prog',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.3}});

document.querySelectorAll('[data-n]').forEach(function(el){
  var n=+el.dataset.n,s=el.dataset.s||'',o={v:0};
  ScrollTrigger.create({trigger:el,start:'top 88%',once:true,onEnter:function(){
    if(reduce){el.textContent=n+s;return}
    gsap.to(o,{v:n,duration:1.8,ease:'power3.out',onUpdate:function(){el.textContent=Math.round(o.v)+s}});
  }});
});

if(!reduce){
  document.querySelectorAll('h2:not(.f-big)').forEach(function(h){
    gsap.from(h.querySelectorAll('.w>span'),{yPercent:115,duration:1,stagger:.06,ease:'power4.out',scrollTrigger:{trigger:h,start:'top 88%',once:true}});
  });
  gsap.utils.toArray('.about p,.row,.stat').forEach(function(el){
    gsap.from(el,{y:30,autoAlpha:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
  });
}

var mm=gsap.matchMedia();
mm.add('(min-width: 761px)',function(){
  var track=$('#track');
  var dist=function(){return track.scrollWidth-innerWidth};
  gsap.to(track,{x:function(){return -dist()},ease:'none',scrollTrigger:{trigger:'.track',start:'center center',end:function(){return '+='+dist()},pin:'#work',scrub:.6,anticipatePin:1,invalidateOnRefresh:true,refreshPriority:1}});
  if(!reduce)gsap.utils.toArray('.panel .shape').forEach(function(s){gsap.to(s,{rotation:'+=40',ease:'none',scrollTrigger:{trigger:'#work',start:'top bottom',end:'bottom top',scrub:1}})});
});
mm.add('(max-width: 760px)',function(){
  if(reduce)return;
  var ps=gsap.utils.toArray('.panel');
  ps.forEach(function(p,i){
    if(i<ps.length-1)gsap.to(p,{scale:.94,ease:'none',scrollTrigger:{trigger:ps[i+1],start:'top 85%',end:'top '+(70+i*16)+'px',scrub:true}});
    var sh=p.querySelector('.shape');
    gsap.fromTo(sh,{rotation:-30},{rotation:30,ease:'none',scrollTrigger:{trigger:p,start:'top bottom',end:'bottom top',scrub:1}});
  });
});

/* hero intro */
if(!reduce){
  gsap.timeline({defaults:{ease:'power4.out'}})
    .from('.hero h1 .ln span',{yPercent:110,duration:1.2,stagger:.14,delay:.15})
    .from('#intro,#btns',{y:24,autoAlpha:0,duration:.8,stagger:.12},'-=.7')
    .from('nav',{y:-20,autoAlpha:0,duration:.7},'-=.8');
}

/* accordion */
var svc=[
 ['Chiến lược thương hiệu','Định vị, thông điệp cốt lõi và giọng nói thương hiệu, viết thành bộ nguyên tắc ngắn gọn mà cả đội dùng được ngay.',['Định vị','Thông điệp','Brand voice']],
 ['PR và quan hệ báo chí','Xây câu chuyện, soạn thông cáo, giữ quan hệ với biên tập viên và tổ chức họp báo, tọa đàm.',['Thông cáo','Media list','Họp báo']],
 ['Quản trị khủng hoảng','Quy trình phản ứng trong 48 giờ đầu, người phát ngôn, kịch bản hỏi đáp và theo dõi dư luận liên tục.',['Kịch bản Q&A','Phát ngôn','Social listening']],
 ['Nội dung và social','Lịch nội dung, video ngắn, hợp tác với người sáng tạo và đo hiệu quả bằng chỉ số gắn với mục tiêu kinh doanh.',['Video ngắn','KOL/KOC','Báo cáo']]
];
var acc=$('#acc');
svc.forEach(function(s,i){
  var it=document.createElement('div');it.className='acc-i';
  it.innerHTML='<button class="acc-b" aria-expanded="false" aria-controls="ap'+i+'"><span>'+s[0]+'</span><svg viewBox="0 0 34 34" aria-hidden="true"><path d="M17 3v28M3 17h28" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg></button><div class="acc-p" id="ap'+i+'"><div><p>'+s[1]+'</p><ul>'+s[2].map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></div></div>';
  acc.appendChild(it);
  var btn=it.querySelector('button'),pan=it.querySelector('.acc-p');
  btn.addEventListener('click',function(){
    var open=it.classList.toggle('open');
    btn.setAttribute('aria-expanded',open);
    gsap.to(pan,{height:open?'auto':0,duration:reduce?0:.5,ease:'power3.inOut',onComplete:function(){ScrollTrigger.refresh()}});
  });
});
acc.querySelector('button').click();

/* magnetic button + con trỏ */
var mag=$('#mag');
if(!reduce&&matchMedia('(pointer:fine)').matches){
  var qx=gsap.quickTo(mag,'x',{duration:.6,ease:'elastic.out(1,.5)'}),qy=gsap.quickTo(mag,'y',{duration:.6,ease:'elastic.out(1,.5)'});
  mag.parentNode.parentNode.addEventListener('mousemove',function(e){
    var r=mag.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    if(Math.hypot(dx,dy)<r.width*.9){qx(dx*.35);qy(dy*.35)}else{qx(0);qy(0)}
  });
  var cur2=$('#cur'),cx=gsap.quickTo(cur2,'x',{duration:.25,ease:'power3'}),cy=gsap.quickTo(cur2,'y',{duration:.25,ease:'power3'});
  addEventListener('pointermove',function(e){cx(e.clientX);cy(e.clientY)});
  document.addEventListener('pointerover',function(e){
    var on=e.target.closest&&e.target.closest('a,button,.card,canvas');
    gsap.to(cur2,{scale:on?3:1,duration:.3,overwrite:'auto'});
  });
}

/* footer */
function clock(){$('#clock').textContent=new Date().toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
clock();setInterval(clock,1000);
$('#up').addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

addEventListener('load',function(){ScrollTrigger.refresh();sync()});
sync();
})();
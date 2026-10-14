(function(){
gsap.registerPlugin(ScrollTrigger);
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var coarse=matchMedia('(pointer: coarse)').matches;
var $=function(s){return document.querySelector(s)};

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
  var mt=gsap.to(mq,{xPercent:-50,duration:30,ease:'none',repeat:-1});
  ScrollTrigger.create({onUpdate:function(s){
    mt.timeScale(Math.min(6,1+Math.abs(s.getVelocity())/500));
    gsap.to(mt,{timeScale:1,duration:.7,overwrite:true});
  }});
}

/* ===== HERO STAGE ===== */
var hero=$('#hero'),stageOn=true;
var stk=gsap.utils.toArray('.stage .stk>div');
gsap.set(stk,{xPercent:-50,yPercent:-50,rotation:function(i,el){return +el.dataset.r}});
if(!reduce){
  gsap.to('#ring',{rotation:360,duration:26,ease:'none',repeat:-1,transformOrigin:'50% 50%'});
  gsap.to(stk,{y:function(){return gsap.utils.random(-14,14)},duration:function(){return gsap.utils.random(2.2,3.4)},repeat:-1,yoyo:true,ease:'sine.inOut'});
  var deps=gsap.utils.toArray('.stage [data-depth]').map(function(el){
    return{d:+el.dataset.depth,qx:gsap.quickTo(el,'x',{duration:.9,ease:'power3'}),qy:gsap.quickTo(el,'y',{duration:.9,ease:'power3'})};
  });
  var par=function(nx,ny){deps.forEach(function(o){o.qx(nx*o.d);o.qy(ny*o.d)})};
  hero.addEventListener('pointermove',function(e){par(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5)});
  if(coarse)addEventListener('deviceorientation',function(e){
    if(e.gamma==null)return;
    par(Math.max(-1,Math.min(1,e.gamma/30))*.5,Math.max(-1,Math.min(1,(e.beta-45)/30))*.5);
  });
  gsap.to('.stage',{yPercent:-14,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true}});
}
function stageOut(){
  if(!stageOn)return;stageOn=false;
  gsap.to('.orb-body',{scale:.15,autoAlpha:0,rotation:-90,duration:reduce?0:.55,ease:'power3.in',overwrite:'auto'});
  stk.forEach(function(el,i){gsap.to(el,{scale:0,autoAlpha:0,rotation:+el.dataset.r+(i%2?60:-60),duration:reduce?0:.45,delay:reduce?0:i*.05,ease:'back.in(2)',overwrite:'auto'})});
}
function stageIn(){
  if(stageOn)return;stageOn=true;
  gsap.to('.orb-body',{scale:1,autoAlpha:1,rotation:0,duration:reduce?0:.8,ease:'back.out(1.6)',overwrite:'auto'});
  stk.forEach(function(el,i){gsap.to(el,{scale:1,autoAlpha:1,rotation:+el.dataset.r,duration:reduce?0:.7,delay:reduce?0:.1+i*.08,ease:'back.out(2)',overwrite:'auto'})});
}

/* ===== LANYARD (verlet) ===== */
var card=$('#card'),strap=$('#strap'),stitch=$('#stitch'),hit=$('#hit'),hook=$('#hook'),ropeEl=$('#rope'),flipEl=$('#flip');
var flipBtn=$('#flipBtn'),stowBtn=$('#stowBtn'),hintTx=$('#hintTx');
var anc={x:0,y:-24,s:1};
/* zone: hero | dock (chỉ desktop) | none */
var zone='hero',cardOn=false,heroCard=false,busy=false,flipped=false,seq=0;
var N=9,L=190,seg,pts=[],C,W=0,H=0,ax=0,reach=0,dragging=false,ptr={x:0,y:0},off={x:0,y:0},lastW=0,all=[],asleep=false,lx=0,ly=0;

function big(){return W>=1000}
function sc(){return big()?1:(W>=760?.8:.62)}
function homeX(){
  if(zone==='dock')return W-150;
  return big()?W*.74:(cardOn?W/2:W-46);
}
function mk(x,y,w){return{x:x,y:y,px:x,py:y,w:w}}
function init(){
  W=innerWidth;H=innerHeight;lastW=W;
  ax=anc.x=homeX();
  anc.s=cardOn?sc():1;
  L=190*anc.s;
  var rl=big()?Math.min(300,H*.32):Math.min(110,H*.14);
  seg=rl/(N-1);reach=rl+L+60;
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
  if(W&&Math.abs(innerWidth-lastW)>2)init();
  ax=anc.x;
  if(asleep&&!dragging&&anc.x===lx&&anc.y===ly)return;
  lx=anc.x;ly=anc.y;asleep=false;
  for(var i=0;i<all.length;i++){
    var p=all[i];if(!p.w)continue;
    if(p===C&&dragging)continue;
    var vx=(p.x-p.px)*.987,vy=(p.y-p.py)*.987;
    p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+(p===C?.75:.5);
  }
  if(dragging){
    var tx=ptr.x-off.x,ty=ptr.y-off.y,dx=tx-ax,dy=ty,d=Math.sqrt(dx*dx+dy*dy);
    if(d>reach){tx=ax+dx/d*reach;ty=dy/d*reach}
    tx=Math.max(24,Math.min(W-24,tx));ty=Math.max(L,Math.min(H-24,ty));
    C.px=C.x;C.py=C.y;C.x=tx;C.y=ty;
  }
  for(var it=0;it<16;it++){
    pts[0].x=ax;pts[0].y=anc.y;
    for(var j=1;j<N;j++)solve(pts[j-1],pts[j],seg);
    C.w=dragging?0:.35;
    solve(pts[N-1],C,L);
  }
  if(!dragging){C.x=Math.max(20,Math.min(W-20,C.x));C.y=Math.min(H-10,C.y)}
  draw();
  if(!dragging){
    var mv=0;
    for(var k=0;k<all.length;k++)mv=Math.max(mv,Math.abs(all[k].x-all[k].px),Math.abs(all[k].y-all[k].py));
    if(mv<.04)asleep=true;
  }
}
function draw(){
  var A=pts[N-1],th=-Math.atan2(C.x-A.x,C.y-A.y)*180/Math.PI;
  card.style.transform='translate('+(A.x-125)+'px,'+A.y+'px) rotate('+th+'deg) scale('+anc.s+')';
  hook.setAttribute('transform','translate('+A.x+' '+A.y+') rotate('+th+')');
  var d='M'+pts[0].x+' '+pts[0].y;
  for(var i=1;i<N-1;i++){var m={x:(pts[i].x+pts[i+1].x)/2,y:(pts[i].y+pts[i+1].y)/2};d+=' Q'+pts[i].x+' '+pts[i].y+' '+m.x+' '+m.y}
  d+=' L'+A.x+' '+A.y;
  strap.setAttribute('d',d);stitch.setAttribute('d',d);hit.setAttribute('d',d);
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

function lift(){return Math.max(540,reach+60)}
function ropeTo(show,done,dur){
  asleep=false;dragging=false;
  gsap.to(anc,{y:show?-24:-lift(),duration:dur||(show?.65:.5),ease:show?'power3.in':'power2.in',overwrite:true,onComplete:done});
}
function showCard(on){
  cardOn=on;
  card.style.visibility=on?'visible':'hidden';
  hook.style.display=on?'none':'';
  if(flipped){flipped=false;gsap.set(flipEl,{rotationY:0})}
}
function ui(){
  var out=zone==='hero'&&cardOn;
  flipBtn.textContent=out?(flipped?'Lật lại':'Lật thẻ'):'Thả thẻ';
  stowBtn.hidden=!out;
  hintTx.textContent=out?(coarse?'Kéo thẻ để đu đưa, chạm thẻ để lật':'Kéo thẻ để đu đưa, bấm Lật thẻ để xem mặt sau'):(coarse?'Chạm vào dây để thả thẻ':'Bấm vào dây để thả thẻ');
  ropeEl.classList.toggle('live',zone==='hero'&&!cardOn&&!busy);
}
function stageSync(){if(zone==='hero'&&cardOn)stageOut();else stageIn()}

/* chuyển vùng: hero <-> dock <-> none */
function setZone(z){
  if(z===zone)return;
  var prev=zone,my=++seq;
  zone=z;busy=false;
  if(z==='none'){
    ui();
    ropeTo(false,function(){if(my!==seq)return;showCard(false);stageSync();ui()});
    return;
  }
  var want=(z==='dock')||heroCard;
  if(prev!=='none'&&cardOn&&want){
    /* thẻ đang treo: trượt sang vị trí mới, KHÔNG thu dây */
    gsap.to(anc,{x:homeX(),duration:.9,ease:'power3.inOut',overwrite:'auto'});
    asleep=false;stageSync();ui();return;
  }
  stageSync();ui();
  ropeTo(false,function(){
    if(my!==seq)return;
    showCard(want);init();stageSync();ui();ropeTo(true);
  });
}
function calcZone(){
  var h=hero.getBoundingClientRect(),vh=innerHeight;
  if(h.bottom>vh*.5)return 'hero';
  if(innerWidth>=1000){
    var a=$('#gioi-thieu').getBoundingClientRect(),s=$('.stats').getBoundingClientRect(),p=$('.press').getBoundingClientRect();
    if(a.top<vh*.7&&s.top>vh*.85)return 'dock';
    if(p.top<vh*.75&&p.bottom>vh*.25)return 'dock';
  }
  return 'none';
}
var tick=0;
function sync(){if(tick)return;tick=1;requestAnimationFrame(function(){tick=0;setZone(calcZone())})}
addEventListener('scroll',sync,{passive:true});
addEventListener('resize',sync);

function dropHero(){
  if(zone!=='hero'||cardOn||busy)return;
  busy=true;heroCard=true;ui();stageOut();
  var my=++seq;
  ropeTo(false,function(){
    if(my!==seq)return;
    busy=false;showCard(true);init();ui();ropeTo(true);
  },.3);
}
function stow(){
  if(zone!=='hero'||!cardOn||busy)return;
  busy=true;heroCard=false;ui();stageIn();
  var my=++seq;
  ropeTo(false,function(){
    if(my!==seq)return;
    busy=false;showCard(false);init();ui();ropeTo(true);
  });
}
[hit,hook].forEach(function(el){
  el.addEventListener('click',dropHero);
  el.addEventListener('pointerenter',function(){ropeEl.classList.add('hot')});
  el.addEventListener('pointerleave',function(){ropeEl.classList.remove('hot')});
});
stowBtn.addEventListener('click',stow);

function flip(){
  if(!cardOn)return;
  flipped=!flipped;
  gsap.to(flipEl,{rotationY:flipped?180:0,duration:.9,ease:'back.out(1.5)',overwrite:true});
  C.px-=14;asleep=false;ui();
}
flipBtn.addEventListener('click',function(){if(zone==='hero'&&!cardOn)dropHero();else flip()});
card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});

/* khởi tạo: dây từ trên thả xuống */
if(reduce){anc.y=-24;init();draw()}
else{anc.y=-700;init();draw();gsap.delayedCall(.5,function(){ropeTo(true,null,.9)})}
ui();
gsap.ticker.add(step);

/* ===== SCROLL EFFECTS ===== */
gsap.to('#prog',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:.3}});

document.querySelectorAll('[data-n]').forEach(function(el){
  var n=+el.dataset.n,s=el.dataset.s||'',o={v:0};
  ScrollTrigger.create({trigger:el,start:'top 88%',once:true,onEnter:function(){
    if(reduce){el.textContent=n+s;return}
    gsap.to(o,{v:n,duration:1.8,ease:'power3.out',onUpdate:function(){el.textContent=Math.round(o.v)+s}});
  }});
});

if(!reduce){
  gsap.utils.toArray('h2 .w>span').forEach(function(s){});
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
    .from('.orb-body',{scale:.5,autoAlpha:0,duration:1.2,ease:'back.out(1.4)'},'-=1')
    .from('.stk>div',{scale:0,autoAlpha:0,duration:.8,stagger:.12,ease:'back.out(2)'},'-=.7')
    .from('#intro,#btns',{y:24,autoAlpha:0,duration:.8,stagger:.12},'-=.9')
    .from('nav',{y:-20,autoAlpha:0,duration:.7},'-=.8')
    .from('#hint',{autoAlpha:0,duration:.6},'-=.2');
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

/* magnetic button + cursor */
var mag=$('#mag');
if(!reduce&&matchMedia('(pointer:fine)').matches){
  var qx=gsap.quickTo(mag,'x',{duration:.6,ease:'elastic.out(1,.5)'}),qy=gsap.quickTo(mag,'y',{duration:.6,ease:'elastic.out(1,.5)'});
  mag.parentNode.parentNode.addEventListener('mousemove',function(e){
    var r=mag.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);
    if(Math.hypot(dx,dy)<r.width*.9){qx(dx*.35);qy(dy*.35)}else{qx(0);qy(0)}
  });
  var cur=$('#cur'),cx=gsap.quickTo(cur,'x',{duration:.25,ease:'power3'}),cy=gsap.quickTo(cur,'y',{duration:.25,ease:'power3'});
  addEventListener('pointermove',function(e){cx(e.clientX);cy(e.clientY)});
  document.addEventListener('pointerover',function(e){
    var big=e.target.closest&&e.target.closest('a,button,.card,#hit');
    gsap.to(cur,{scale:big?3:1,duration:.3,overwrite:'auto'});
  });
}

/* footer */
function clock(){$('#clock').textContent=new Date().toLocaleTimeString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
clock();setInterval(clock,1000);
$('#up').addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

addEventListener('load',function(){ScrollTrigger.refresh();sync()});
})();

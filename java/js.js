
// Menu mobile + header
var header=document.getElementById('top'),menu=document.getElementById('menu');
document.getElementById('burger').onclick=function(){menu.classList.toggle('open')};
menu.addEventListener('click',function(e){
  if(e.target.tagName==='A'){
    menu.classList.remove('open');
  }
});

var onScroll=function(){header.classList.toggle('solid',window.scrollY>40)};
onScroll();
window.addEventListener('scroll',onScroll,{passive:true});

// Revelar ao rolar
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
}else{
  document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')});
}

// Lightbox da carta de drinks
var lb=document.getElementById('lb'),lbImg=lb.querySelector('img');
document.querySelectorAll('.menu-grid button').forEach(function(b){
  b.onclick=function(){lbImg.src=b.dataset.src;lb.classList.add('on')};
});
lb.onclick=function(){lb.classList.remove('on')};
window.addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('on')});

// --- SLIDESHOW DO HERO (Com suporte a Touch/Swipe) ---
var slides=document.querySelectorAll('.hero-slide');
var dotsContainer=document.getElementById('slideDots');
var currentSlide=0,slideInterval;

slides.forEach(function(_,i){
  var dot=document.createElement('button');
  dot.setAttribute('aria-label','Ir para slide '+(i+1));
  if(i===0)dot.classList.add('active');
  dot.onclick=function(){goToSlide(i)};
  dotsContainer.appendChild(dot);
});
var dots=dotsContainer.querySelectorAll('button');

function goToSlide(index){
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide=(index+slides.length)%slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
  resetInterval();
}
function nextSlide(){goToSlide(currentSlide+1)}
function prevSlide(){goToSlide(currentSlide-1)}

document.getElementById('nextSlide').onclick=nextSlide;
document.getElementById('prevSlide').onclick=prevSlide;

function resetInterval(){
  clearInterval(slideInterval);
  slideInterval=setInterval(nextSlide,5000);
}
resetInterval();

var heroSection=document.querySelector('.hero');
heroSection.addEventListener('mouseenter',function(){clearInterval(slideInterval)});
heroSection.addEventListener('mouseleave',resetInterval);

// Suporte a deslizar (swipe) no mobile
var touchStartX=0,touchEndX=0;
heroSection.addEventListener('touchstart',function(e){touchStartX=e.changedTouches[0].screenX},{passive:true});
heroSection.addEventListener('touchend',function(e){
  touchEndX=e.changedTouches[0].screenX;
  if(touchStartX - touchEndX > 40) nextSlide();
  if(touchEndX - touchStartX > 40) prevSlide();
},{passive:true});

// "Aberto agora" no horário de Brasília
var SCHED={0:[[720,1020]],1:[[720,900],[1080,1440]],2:[[720,900],[1080,1440]],3:[[720,900],[1080,1440]],4:[[720,900],[1080,1440]],5:[[720,1530]],6:[[720,1530]]};
function agora(){
  var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
  function g(t){return p.filter(function(x){return x.type===t})[0].value}
  var d=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(g('weekday'));
  return {d:d,m:(+g('hour')%24)*60+ +g('minute')};
}
function atualiza(){
  var r=agora(),d=r.d,m=r.m;
  var hoje=(SCHED[d]||[]).some(function(x){return m>=x[0]&&m<x[1]});
  var ontem=(SCHED[(d+6)%7]||[]).some(function(x){return m+1440>=x[0]&&m+1440<x[1]});
  var aberto=hoje||ontem;
  var s=document.getElementById('status');
  s.classList.toggle('open',aberto);
  s.querySelector('span').textContent=aberto?'Aberto agora · 303 Sul':'Fechado agora · aberto todos os dias';
  document.querySelectorAll('#hours li').forEach(function(li){
    li.classList.toggle('today',li.dataset.days.split(',').indexOf(String(d))>-1);
  });
}
atualiza();setInterval(atualiza,60000);
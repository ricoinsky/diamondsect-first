function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }

let slides = [];
let prev = null;
let next = null;
let dotsWrap = null;
let idx = 0;
let timer = null;
let inited = false;

function readDom(){
  slides = qsa(".hero__slide");
  prev = qs("#heroPrev");
  next = qs("#heroNext");
  dotsWrap = qs("#heroDots");
}

function buildDots(){
  if(!dotsWrap) return;
  dotsWrap.innerHTML = "";
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "hero__dot" + (i === 0 ? " is-active" : "");
    b.type = "button";
    b.setAttribute("aria-label", `Ir para slide ${i+1}`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
  });
}

function syncVideos(){
  slides.forEach((slide, i) => {
    const video = slide.querySelector("video");
    if(!video) return;
    if(i === idx){
      video.currentTime = 0;
      const p = video.play();
      if(p && typeof p.catch === "function") p.catch(()=>{});
    } else {
      video.pause();
    }
  });
}

function setActive(){
  slides.forEach((s, i)=> s.classList.toggle("is-active", i===idx));
  const dots = dotsWrap ? qsa("#heroDots .hero__dot") : [];
  dots.forEach((d, i)=> d.classList.toggle("is-active", i===idx));
  syncVideos();
}

function go(i){
  if(!slides.length) return;
  idx = (i + slides.length) % slides.length;
  setActive();
  restart();
}

function restart(){
  if(timer) clearInterval(timer);
  if(slides.length <= 1) return;
  timer = setInterval(()=> go(idx+1), 6500);
}

function bind(){
  if(prev) prev.addEventListener("click", ()=> go(idx-1));
  if(next) next.addEventListener("click", ()=> go(idx+1));
}

function initHero(){
  readDom();
  if(!slides.length) return;
  idx = 0;
  buildDots();
  setActive();
  if(!inited){
    bind();
    inited = true;
  }
  restart();
}

window.addEventListener("siteconfig:hero:ready", initHero);
document.addEventListener("DOMContentLoaded", initHero);

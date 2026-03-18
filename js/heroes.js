import { readPath } from "./firebase.js";

async function loadHeroes(){
  const map = await readPath("products/siteContent/heroes");
  if(!map) return;
  document.querySelectorAll("[data-hero-image]").forEach(img => {
    const key = img.dataset.heroImage;
    if(map[key]) img.src = map[key];
  });
}
loadHeroes();
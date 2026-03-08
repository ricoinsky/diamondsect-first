const LS_OVERRIDE_KEY = "DS_SITE_CONFIG_OVERRIDE";
const LS_VERSION_KEY = "DS_CONFIG_VERSION";
const DEFAULT_VERSION = "1";

function deepMerge(base, extra){
  if(Array.isArray(extra)) return extra.slice();
  if(!extra || typeof extra !== "object") return extra === undefined ? base : extra;
  const out = (base && typeof base === "object" && !Array.isArray(base)) ? { ...base } : {};
  for(const key of Object.keys(extra)){
    const bv = out[key];
    const ev = extra[key];
    out[key] = (bv && typeof bv === "object" && !Array.isArray(bv) && ev && typeof ev === "object" && !Array.isArray(ev))
      ? deepMerge(bv, ev)
      : Array.isArray(ev) ? ev.slice() : ev;
  }
  return out;
}

function getByPath(obj, path){
  return String(path || "").split(".").reduce((acc, key) => acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined, obj);
}

function fetchJson(url){
  return fetch(url, { cache: "no-store" }).then(r => {
    if(!r.ok) throw new Error(`Falha ao ler ${url}`);
    return r.json();
  });
}

function getPageKey(){
  const explicit = document.body?.dataset?.page;
  if(explicit) return explicit;
  const file = location.pathname.split("/").pop() || "index.html";
  return file.replace(/\.html$/i, "") || "index";
}

function setNodeValue(node, value, attr){
  if(value === undefined || value === null) return;
  if(attr){
    node.setAttribute(attr, String(value));
  }else{
    node.textContent = String(value);
  }
}

function applyTexts(cfg){
  const textMap = cfg?.texts || {};

  document.querySelectorAll("[data-cms]").forEach(node => {
    const key = node.getAttribute("data-cms");
    const attr = node.getAttribute("data-cms-attr");
    const value = getByPath(textMap, key);
    if(value === undefined) return;

    if(Array.isArray(value) && node.classList.contains("topbar__track")){
      const items = value.length ? value : [""];
      const doubled = items.concat(items);
      node.innerHTML = doubled.map(item => `<span>${String(item)}</span>`).join("");
      return;
    }

    if(Array.isArray(value)){
      node.innerHTML = value.map(v => `<span>${String(v)}</span>`).join("");
      return;
    }

    setNodeValue(node, value, attr);
  });

  const brand = textMap["brand.name"];
  if(brand){
    document.querySelectorAll(".brand,[data-brand-name]").forEach(node => node.textContent = brand);
  }

  const searchPlaceholder = textMap["search.placeholder"];
  if(searchPlaceholder){
    document.querySelectorAll('#searchInput').forEach(input => input.setAttribute('placeholder', String(searchPlaceholder)));
  }
  const searchButton = textMap["search.button"];
  if(searchButton){
    document.querySelectorAll('.search__btn').forEach(btn => btn.textContent = String(searchButton));
  }
  const cartLabel = textMap["cart.label"];
  if(cartLabel){
    document.querySelectorAll('.cartbtn__label').forEach(node => node.textContent = String(cartLabel));
  }
}

function buildHeroSlides(pageKey, slides){
  const wrap = document.getElementById("heroSlides");
  if(!wrap) return false;
  if(!Array.isArray(slides) || !slides.length) return false;

  const html = slides.map((slide, index) => `
    <article class="hero__slide${index === 0 ? ' is-active' : ''}" style="background-image:url('${String(slide.image || '').replace(/'/g, "&#39;")}');">
      <div class="hero__overlay"></div>
      <div class="hero__content">
        <h1>${String(slide.title || '').replace(/\n/g, '<br>')}</h1>
        <p>${String(slide.subtitle || '')}</p>
        <a class="btn btn--light" href="${String(slide.ctaHref || '#')}">${String(slide.ctaText || 'Ver mais')}</a>
      </div>
    </article>
  `).join("");

  const nav = `
    <div class="hero__nav" aria-hidden="false">
      <button class="hero__btn" id="heroPrev" type="button" aria-label="Slide anterior">‹</button>
      <button class="hero__btn" id="heroNext" type="button" aria-label="Próximo slide">›</button>
    </div>
    <div class="hero__dots" id="heroDots" aria-label="Navegação do slider"></div>
  `;

  wrap.innerHTML = html + nav;
  return true;
}

function applyCards(cfg){
  const pageKey = getPageKey();
  const cards = cfg?.cards?.[pageKey];
  if(!Array.isArray(cards) || !cards.length) return;
  const nodes = document.querySelectorAll('[data-card-index]');
  nodes.forEach((node, idx) => {
    const card = cards[idx];
    if(!card) return;
    const link = node.tagName === 'A' ? node : node.querySelector('a');
    if(link && card.href) link.setAttribute('href', String(card.href));
    const img = node.querySelector('[data-card-image]');
    if(img && card.image) img.style.backgroundImage = `url('${String(card.image).replace(/'/g, "&#39;")}')`;
    const title = node.querySelector('[data-card-title]');
    if(title && card.title !== undefined) title.textContent = String(card.title);
    const subtitle = node.querySelector('[data-card-subtitle]');
    if(subtitle && card.subtitle !== undefined) subtitle.textContent = String(card.subtitle);
  });
}

function applyHero(cfg){
  const pageKey = getPageKey();
  const heroCfg = cfg?.heroes?.[pageKey] || null;
  const ok = buildHeroSlides(pageKey, heroCfg?.slides || []);
  if(ok){
    window.dispatchEvent(new CustomEvent("siteconfig:hero:ready", { detail: { pageKey } }));
  }
}

async function loadAndApply(){
  const v = localStorage.getItem(LS_VERSION_KEY) || DEFAULT_VERSION;
  let cfg;
  try{
    cfg = await fetchJson(`data/site-config.json?v=${encodeURIComponent(v)}`);
  }catch(_){
    cfg = { version: 1, texts: {}, heroes: {}, cards: {} };
  }

  try{
    const raw = localStorage.getItem(LS_OVERRIDE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      if(parsed && typeof parsed === 'object') cfg = deepMerge(cfg, parsed);
    }
  }catch(_){ }

  window.SITE_CONFIG = cfg;
  applyTexts(cfg);
  applyHero(cfg);
  applyCards(cfg);
  window.dispatchEvent(new CustomEvent("siteconfig:loaded", { detail: { version: cfg?.version || 1 } }));
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadAndApply);
else loadAndApply();

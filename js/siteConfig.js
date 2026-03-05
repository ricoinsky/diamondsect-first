/**
 * Diamondsect - Site Config (CMS-like) for GitHub Pages (no backend)
 * - Loads /data/site-config.json
 * - Applies hero slides & editable texts
 * - Allows per-browser override from localStorage (set by admin)
 */
(function(){
  const LS_OVERRIDE_KEY = "DS_SITE_CONFIG_OVERRIDE";
  const LS_VERSION_KEY  = "DS_CONFIG_VERSION";
  const DEFAULT_VERSION = "1";

  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
  }

  function textToHtml(str){
    // Allow \n to become <br> for headings
    return escapeHtml(str).replace(/\n/g, "<br>");
  }

  async function fetchJson(url){
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  function deepMerge(base, extra){
    if(!extra || typeof extra !== "object") return base;
    const out = Array.isArray(base) ? base.slice() : { ...(base||{}) };
    for(const k of Object.keys(extra)){
      const bv = out[k];
      const ev = extra[k];
      if(bv && typeof bv === "object" && !Array.isArray(bv) && ev && typeof ev === "object" && !Array.isArray(ev)){
        out[k] = deepMerge(bv, ev);
      }else{
        out[k] = ev;
      }
    }
    return out;
  }

  function getPageKey(){
    const b = document.body;
    return (b && b.dataset && b.dataset.page) ? b.dataset.page : "";
  }

  function applyTexts(cfg){
    const map = (cfg && cfg.texts) ? cfg.texts : {};
    document.querySelectorAll("[data-cms]").forEach(el=>{
      const key = el.getAttribute("data-cms");
      const val = map[key];
      if(val == null) return;

      const attr = el.getAttribute("data-cms-attr");
      if(attr){
        el.setAttribute(attr, String(val));
      }else{
        // Default: set HTML with safe escaping + <br>
        el.innerHTML = textToHtml(val);
      }
    });
  }

  function buildHeroSlides(slides){
    const wrap = document.getElementById("heroSlides");
    if(!wrap || !Array.isArray(slides) || slides.length === 0) return false;

    wrap.innerHTML = slides.map((s, i)=>{
      const img = escapeHtml(s.image || "");
      const title = textToHtml(s.title || "");
      const subtitle = textToHtml(s.subtitle || "");
      const ctaText = escapeHtml(s.ctaText || "");
      const ctaHref = escapeHtml(s.ctaHref || "#");
      return `
        <article class="hero__slide ${i===0 ? "is-active" : ""}" style="background-image:url('${img}');">
          <div class="hero__overlay"></div>
          <div class="hero__content">
            <h1>${title}</h1>
            <p>${subtitle}</p>
            ${ctaText ? `<a class="btn btn--light" href="${ctaHref}">${ctaText}</a>` : ""}
          </div>
        </article>
      `;
    }).join("");

    return true;
  }

  function applyHero(cfg){
    const pageKey = getPageKey();
    const heroCfg = cfg && cfg.heroes && cfg.heroes[pageKey];
    if(!heroCfg) return;

    const ok = buildHeroSlides(heroCfg.slides);
    if(ok){
      // Notify page scripts (home.js) to (re)initialize after DOM changes
      window.dispatchEvent(new CustomEvent("siteconfig:hero:ready", { detail: { pageKey } }));
    }
  }

  async function loadAndApply(){
    const v = localStorage.getItem(LS_VERSION_KEY) || DEFAULT_VERSION;
    let cfg = null;
    try{
      cfg = await fetchJson(`data/site-config.json?v=${encodeURIComponent(v)}`);
    }catch(e){
      cfg = { version: 1 };
    }

    // Per-browser override from admin (preview/publish in this device)
    try{
      const raw = localStorage.getItem(LS_OVERRIDE_KEY);
      if(raw){
        const override = JSON.parse(raw);
        cfg = deepMerge(cfg, override);
      }
    }catch(_){}

    window.SITE_CONFIG = cfg;

    applyTexts(cfg);
    applyHero(cfg);

    window.dispatchEvent(new CustomEvent("siteconfig:loaded", { detail: { version: cfg && cfg.version } }));
  }

  // Run ASAP
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", loadAndApply);
  }else{
    loadAndApply();
  }
})();

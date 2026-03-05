const LS_OVERRIDE_KEY = "DS_SITE_CONFIG_OVERRIDE";
const LS_VERSION_KEY  = "DS_CONFIG_VERSION";

function $(id){ return document.getElementById(id); }

async function fetchConfig(){
  const v = localStorage.getItem(LS_VERSION_KEY) || "1";
  const res = await fetch(`data/site-config.json?v=${encodeURIComponent(v)}`, { cache: "no-store" });
  if(!res.ok) throw new Error("Não consegui ler data/site-config.json");
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

function bumpVersion(){
  const v = Number(localStorage.getItem(LS_VERSION_KEY) || "1") + 1;
  localStorage.setItem(LS_VERSION_KEY, String(v));
  return v;
}

function downloadJson(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function listHeroAssets(){
  return [
    "assets/hero/hero-ternos.jpg",
    "assets/hero/hero-linho.jpg",
    "assets/hero/hero-joias.jpg"
  ];
}

function ensure(cfg){
  cfg.texts = cfg.texts || {};
  cfg.heroes = cfg.heroes || {};
  return cfg;
}

function renderTextsEditor(cfg){
  const wrap = $("cms_texts");
  const keys = Object.keys(cfg.texts||{}).sort((a,b)=>a.localeCompare(b));

  const group = (k)=>k.split(".")[0];
  const groups = new Map();
  keys.forEach(k=>{
    const g = group(k);
    if(!groups.has(g)) groups.set(g, []);
    groups.get(g).push(k);
  });

  const mkRow = (key, val)=>{
    const isArray = Array.isArray(val);
    const isLong = typeof val === "string" && val.length > 80;
    const label = `<div class="small" style="margin:10px 0 6px 0">${key}</div>`;

    if(isArray){
      // For marquee arrays etc
      const ta = `<textarea data-cmskey="${key}" rows="3" style="width:100%">${val.join("\n")}</textarea>`;
      const hint = `<div class="help" style="margin-top:6px">(lista — 1 item por linha)</div>`;
      return `<div>${label}${ta}${hint}</div>`;
    }

    if(isLong){
      return `<div>${label}<textarea data-cmskey="${key}" rows="3" style="width:100%">${String(val ?? "")}</textarea></div>`;
    }

    return `<div>${label}<input data-cmskey="${key}" value="${String(val ?? "").replace(/"/g,'&quot;')}" style="width:100%" /></div>`;
  };

  let html = "";
  for(const [g, gkeys] of groups.entries()){
    html += `
      <div class="panel" style="margin:12px 0;background:rgba(0,0,0,.16);border:1px solid rgba(255,255,255,.08)">
        <h4 style="margin:0 0 8px 0;text-transform:uppercase;letter-spacing:.08em;font-size:12px;opacity:.85">${g}</h4>
        ${gkeys.map(k=>mkRow(k, cfg.texts[k])).join("")}
      </div>
    `;
  }
  wrap.innerHTML = html;
}

function renderPageSelect(cfg){
  const sel = $("cms_page_select");
  const pages = Object.keys(cfg.heroes||{}).sort((a,b)=>a.localeCompare(b));
  sel.innerHTML = pages.map(p=>`<option value="${p}">${p}</option>`).join("");
}

function buildSlideEditor(pageKey, i, slide, heroAssets){
  const img = slide.image || "";
  const options = heroAssets.map(p=>`<option value="${p}" ${p===img?"selected":""}>${p}</option>`).join("");

  return `
    <div class="panel" style="margin:12px 0;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08)">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <h4 style="margin:0">${pageKey} — Slide ${i+1}</h4>
        <button class="btn" type="button" data-hero-remove="1" data-page="${pageKey}" data-slide="${i}" style="padding:10px 14px">Remover</button>
      </div>

      <div style="height:10px"></div>
      <div class="small">Imagem</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <select data-hero-page="${pageKey}" data-slide="${i}" data-field="image" style="min-width:280px;flex:1;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#fff">
          ${options}
        </select>
        <input data-hero-page="${pageKey}" data-slide="${i}" data-field="image" placeholder="ou cole uma URL / caminho" value="${String(img).replace(/"/g,'&quot;')}" style="flex:1;min-width:280px" />
      </div>

      <div style="height:10px"></div>
      <div class="small">Título (use quebra de linha)</div>
      <textarea data-hero-page="${pageKey}" data-slide="${i}" data-field="title" rows="2" style="width:100%">${String(slide.title||"")}</textarea>

      <div style="height:10px"></div>
      <div class="small">Subtítulo</div>
      <input data-hero-page="${pageKey}" data-slide="${i}" data-field="subtitle" value="${String(slide.subtitle||"").replace(/"/g,'&quot;')}" style="width:100%" />

      <div style="height:10px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div>
          <div class="small">Texto do botão</div>
          <input data-hero-page="${pageKey}" data-slide="${i}" data-field="ctaText" value="${String(slide.ctaText||"").replace(/"/g,'&quot;')}" style="width:100%" />
        </div>
        <div>
          <div class="small">Link do botão</div>
          <input data-hero-page="${pageKey}" data-slide="${i}" data-field="ctaHref" value="${String(slide.ctaHref||"").replace(/"/g,'&quot;')}" style="width:100%" />
        </div>
      </div>
    </div>
  `;
}

function renderHeroEditor(cfg, pageKey){
  const wrap = $("cms_page_slides");
  const assets = listHeroAssets();
  const slides = (cfg.heroes[pageKey] && Array.isArray(cfg.heroes[pageKey].slides)) ? cfg.heroes[pageKey].slides : [];
  const safeSlides = slides.length ? slides : [{ image: assets[0], title:"", subtitle:"", ctaText:"", ctaHref:"#" }];

  wrap.innerHTML = safeSlides.map((s,i)=>buildSlideEditor(pageKey,i,s,assets)).join("");

  wrap.querySelectorAll('[data-hero-remove="1"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const i = Number(btn.getAttribute('data-slide'));
      const cur = (cfg.heroes[pageKey] && Array.isArray(cfg.heroes[pageKey].slides)) ? cfg.heroes[pageKey].slides : [];
      cur.splice(i,1);
      cfg.heroes[pageKey] = cfg.heroes[pageKey] || { slides: [] };
      cfg.heroes[pageKey].slides = cur.length ? cur : [{ image: assets[0], title:"", subtitle:"", ctaText:"", ctaHref:"#" }];
      renderHeroEditor(cfg, pageKey);
    });
  });
}

function collectFromUI(baseCfg){
  const cfg = JSON.parse(JSON.stringify(baseCfg));
  ensure(cfg);

  // texts
  document.querySelectorAll('[data-cmskey]').forEach(el=>{
    const key = el.getAttribute('data-cmskey');
    let val = el.value;
    // arrays stored as textarea with 1 item per line
    if(Array.isArray(baseCfg.texts[key])){
      val = String(val||"").split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
      cfg.texts[key] = val;
      return;
    }
    cfg.texts[key] = String(val ?? "");
  });

  // heroes
  const byPage = new Map();
  document.querySelectorAll('[data-hero-page][data-slide][data-field]').forEach(el=>{
    const page = el.getAttribute('data-hero-page');
    const i = Number(el.getAttribute('data-slide'));
    const field = el.getAttribute('data-field');
    if(!byPage.has(page)) byPage.set(page, new Map());
    const mp = byPage.get(page);
    if(!mp.has(i)) mp.set(i, {});
    mp.get(i)[field] = el.value;
  });

  for(const [page, mp] of byPage.entries()){
    const slides = Array.from(mp.keys()).sort((a,b)=>a-b).map(i=>{
      const s = mp.get(i);
      return {
        image: String(s.image||"").trim(),
        title: String(s.title||"").trim(),
        subtitle: String(s.subtitle||"").trim(),
        ctaText: String(s.ctaText||"").trim(),
        ctaHref: String(s.ctaHref||"").trim()
      };
    }).filter(s=>s.image || s.title || s.subtitle || s.ctaText);

    cfg.heroes[page] = cfg.heroes[page] || { slides: [] };
    cfg.heroes[page].slides = slides.length ? slides : cfg.heroes[page].slides;
  }

  return cfg;
}

async function main(){
  let base = ensure(await fetchConfig());
  let override = null;
  try{ override = JSON.parse(localStorage.getItem(LS_OVERRIDE_KEY) || "null"); }catch(_){ override = null; }

  const current = override ? deepMerge(base, override) : base;
  ensure(current);

  renderTextsEditor(current);
  renderPageSelect(current);

  const sel = $("cms_page_select");
  const firstPage = sel.value || "index";
  renderHeroEditor(current, firstPage);

  sel.addEventListener('change', ()=>{
    renderHeroEditor(current, sel.value);
  });

  $("cms_add_slide").addEventListener('click', ()=>{
    const pageKey = sel.value;
    const assets = listHeroAssets();
    current.heroes[pageKey] = current.heroes[pageKey] || { slides: [] };
    current.heroes[pageKey].slides = current.heroes[pageKey].slides || [];
    current.heroes[pageKey].slides.push({ image: assets[0], title:"", subtitle:"", ctaText:"", ctaHref:"#" });
    renderHeroEditor(current, pageKey);
  });

  $("cms_publish").addEventListener('click', ()=>{
    const next = collectFromUI(current);
    localStorage.setItem(LS_OVERRIDE_KEY, JSON.stringify(next));
    bumpVersion();
    alert("Publicado neste navegador ✅ (muda só pra você). Abra o site em outra aba e atualize.");
  });

  $("cms_export").addEventListener('click', ()=>{
    const next = collectFromUI(current);
    // Export a full config (official)
    downloadJson(next, "site-config.json");
  });

  $("cms_reset").addEventListener('click', ()=>{
    localStorage.removeItem(LS_OVERRIDE_KEY);
    bumpVersion();
    alert("Resetado ✅. Atualize o site para voltar ao padrão.");
    location.reload();
  });

  $("cms_import").addEventListener('change', async (ev)=>{
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    const txt = await file.text();
    try{
      const imported = ensure(JSON.parse(txt));
      localStorage.setItem(LS_OVERRIDE_KEY, JSON.stringify(imported));
      bumpVersion();
      alert("Importado ✅. Atualize o site para ver.");
      location.reload();
    }catch(_){
      alert("JSON inválido.");
    }
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  if(document.getElementById("cmsPanel")){
    main().catch(err=>alert(err.message || String(err)));
  }
});

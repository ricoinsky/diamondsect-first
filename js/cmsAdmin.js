const LS_OVERRIDE_KEY = "DS_SITE_CONFIG_OVERRIDE";
const LS_VERSION_KEY = "DS_CONFIG_VERSION";

const HERO_ASSETS = [
  "assets/hero/hero-ternos.jpg",
  "assets/hero/hero-linho.jpg",
  "assets/hero/hero-joias.jpg",
  "assets/hero/hero-blazer.jpg",
  "assets/hero/hero-perfumaria.jpg"
];

function $(id){ return document.getElementById(id); }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

function bumpVersion(){
  const next = Number(localStorage.getItem(LS_VERSION_KEY) || "1") + 1;
  localStorage.setItem(LS_VERSION_KEY, String(next));
  return next;
}

async function fetchConfig(){
  const v = localStorage.getItem(LS_VERSION_KEY) || "1";
  const res = await fetch(`data/site-config.json?v=${encodeURIComponent(v)}`, { cache: "no-store" });
  if(!res.ok) throw new Error("Não consegui ler data/site-config.json");
  return res.json();
}

function deepMerge(base, extra){
  if(Array.isArray(extra)) return extra.slice();
  if(!extra || typeof extra !== "object") return extra === undefined ? base : extra;
  const out = (base && typeof base === "object" && !Array.isArray(base)) ? { ...base } : {};
  for(const key of Object.keys(extra)){
    const bv = out[key];
    const ev = extra[key];
    out[key] = (bv && typeof bv === "object" && !Array.isArray(bv) && ev && typeof ev === "object" && !Array.isArray(ev)) ? deepMerge(bv, ev) : Array.isArray(ev) ? ev.slice() : ev;
  }
  return out;
}

function ensure(cfg){
  cfg = cfg || {};
  cfg.texts = cfg.texts || {};
  cfg.heroes = cfg.heroes || {};
  cfg.cards = cfg.cards || {};
  cfg.cards.index = Array.isArray(cfg.cards.index) ? cfg.cards.index : [
    { image:HERO_ASSETS[0], title:'TERNOS', subtitle:'EXPLORAR COLEÇÃO', href:'ternos.html' },
    { image:HERO_ASSETS[1], title:'LINHO', subtitle:'QUALIDADE DO TECIDO', href:'linho.html' },
    { image:HERO_ASSETS[2], title:'JOIAS', subtitle:'STATUS COM ELEGÂNCIA', href:'joias.html' }
  ];
  return cfg;
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

function toast(msg){
  const box = $("cms_status");
  if(!box) return alert(msg);
  box.textContent = msg;
  box.style.display = "block";
  clearTimeout(window.__cmsToast);
  window.__cmsToast = setTimeout(()=>{ box.style.display = "none"; }, 3200);
}

function renderTextsEditor(cfg){
  const wrap = $("cms_texts");
  if(!wrap) return;
  const keys = Object.keys(cfg.texts || {}).sort((a,b)=>a.localeCompare(b));
  const groups = new Map();
  for(const key of keys){
    const prefix = key.split(".")[0];
    if(!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(key);
  }

  let html = "";
  for(const [group, gkeys] of groups.entries()){
    html += `<section class="cms-box"><h3>${esc(group)}</h3>`;
    for(const key of gkeys){
      const value = cfg.texts[key];
      const longField = Array.isArray(value) || String(value ?? "").length > 90;
      html += `<label class="cms-field"><span>${esc(key)}</span>`;
      if(longField){
        const text = Array.isArray(value) ? value.join("\n") : String(value ?? "");
        html += `<textarea data-cmskey="${esc(key)}" rows="${Array.isArray(value) ? 4 : 3}">${esc(text)}</textarea>`;
      } else {
        html += `<input data-cmskey="${esc(key)}" value="${esc(String(value ?? ""))}" />`;
      }
      html += `</label>`;
    }
    html += `</section>`;
  }
  wrap.innerHTML = html || '<div class="help">Nenhum texto configurado.</div>';
}

function renderPageSelect(cfg){
  const select = $("cms_page_select");
  if(!select) return;
  const pages = Object.keys(cfg.heroes || {}).sort((a,b)=>a.localeCompare(b));
  select.innerHTML = pages.map(page => `<option value="${esc(page)}">${esc(page)}</option>`).join("");
}

function slideEditor(pageKey, index, slide){
  const img = String(slide?.image || HERO_ASSETS[0]);
  return `
    <div class="cms-slide">
      <div class="cms-slide__head">
        <strong>${esc(pageKey)} — slide ${index + 1}</strong>
        <button class="btn btn--mini" type="button" data-remove-slide="${index}">Remover</button>
      </div>
      <label class="cms-field"><span>Imagem (caminho ou URL)</span><input data-slide-field="image" data-slide-index="${index}" value="${esc(img)}" list="cms_hero_assets" /></label>
      <label class="cms-field"><span>Título</span><textarea data-slide-field="title" data-slide-index="${index}" rows="2">${esc(slide?.title || "")}</textarea></label>
      <label class="cms-field"><span>Subtítulo</span><textarea data-slide-field="subtitle" data-slide-index="${index}" rows="2">${esc(slide?.subtitle || "")}</textarea></label>
      <div class="cms-grid-2">
        <label class="cms-field"><span>Texto do botão</span><input data-slide-field="ctaText" data-slide-index="${index}" value="${esc(slide?.ctaText || "")}" /></label>
        <label class="cms-field"><span>Link do botão</span><input data-slide-field="ctaHref" data-slide-index="${index}" value="${esc(slide?.ctaHref || "")}" /></label>
      </div>
      <div class="cms-preview" style="background-image:url('${esc(img)}')"></div>
    </div>
  `;
}

function renderHeroEditor(cfg, pageKey){
  const wrap = $("cms_page_slides");
  if(!wrap || !pageKey) return;
  cfg.heroes[pageKey] = cfg.heroes[pageKey] || { slides: [{ image: HERO_ASSETS[0], title: "", subtitle: "", ctaText: "", ctaHref: "#" }] };
  const slides = Array.isArray(cfg.heroes?.[pageKey]?.slides) && cfg.heroes[pageKey].slides.length ? cfg.heroes[pageKey].slides : [{ image: HERO_ASSETS[0], title: "", subtitle: "", ctaText: "", ctaHref: "#" }];
  cfg.heroes[pageKey].slides = slides;
  wrap.innerHTML = slides.map((slide, index)=>slideEditor(pageKey, index, slide)).join("");

  wrap.querySelectorAll("[data-remove-slide]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const i = Number(btn.getAttribute("data-remove-slide"));
      const list = cfg.heroes[pageKey].slides;
      list.splice(i, 1);
      if(!list.length) list.push({ image: HERO_ASSETS[0], title: "", subtitle: "", ctaText: "", ctaHref: "#" });
      renderHeroEditor(cfg, pageKey);
    });
  });

  wrap.querySelectorAll('[data-slide-field="image"]').forEach(input=>{
    input.addEventListener('input', ()=>{
      const i = Number(input.dataset.slideIndex);
      const preview = wrap.querySelectorAll('.cms-preview')[i];
      if(preview) preview.style.backgroundImage = `url('${input.value.trim() || HERO_ASSETS[0]}')`;
    });
  });
}

function renderCardsEditor(cfg){
  const wrap = $("cms_cards");
  if(!wrap) return;
  const cards = cfg.cards.index;
  wrap.innerHTML = cards.map((card, index)=>`
    <div class="cms-slide">
      <div class="cms-slide__head"><strong>Card ${index + 1}</strong></div>
      <label class="cms-field"><span>Imagem</span><input data-card-field="image" data-card-index="${index}" value="${esc(card.image || HERO_ASSETS[index] || HERO_ASSETS[0])}" list="cms_hero_assets"></label>
      <label class="cms-field"><span>Título</span><input data-card-field="title" data-card-index="${index}" value="${esc(card.title || '')}"></label>
      <label class="cms-field"><span>Subtítulo</span><input data-card-field="subtitle" data-card-index="${index}" value="${esc(card.subtitle || '')}"></label>
      <label class="cms-field"><span>Link</span><input data-card-field="href" data-card-index="${index}" value="${esc(card.href || '#')}"></label>
      <div class="cms-preview" style="background-image:url('${esc(card.image || HERO_ASSETS[index] || HERO_ASSETS[0])}')"></div>
    </div>
  `).join('');
  wrap.querySelectorAll('[data-card-field="image"]').forEach(input=>{
    input.addEventListener('input', ()=>{
      const i = Number(input.dataset.cardIndex);
      const preview = wrap.querySelectorAll('.cms-preview')[i];
      if(preview) preview.style.backgroundImage = `url('${input.value.trim() || HERO_ASSETS[i] || HERO_ASSETS[0]}')`;
    });
  });
}

function collectConfig(baseCfg){
  const next = JSON.parse(JSON.stringify(baseCfg));
  ensure(next);

  document.querySelectorAll('[data-cmskey]').forEach(el=>{
    const key = el.getAttribute('data-cmskey');
    if(Array.isArray(baseCfg.texts[key])) next.texts[key] = String(el.value || "").split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
    else next.texts[key] = String(el.value || "");
  });

  const pageKey = $("cms_page_select")?.value;
  if(pageKey){
    const grouped = {};
    document.querySelectorAll('[data-slide-index][data-slide-field]').forEach(el=>{
      const i = Number(el.dataset.slideIndex);
      grouped[i] = grouped[i] || { image: "", title: "", subtitle: "", ctaText: "", ctaHref: "#" };
      grouped[i][el.dataset.slideField] = String(el.value || "").trim();
    });
    next.heroes[pageKey] = { slides: Object.keys(grouped).sort((a,b)=>Number(a)-Number(b)).map(k => grouped[k]) };
  }

  const cards = [];
  document.querySelectorAll('[data-card-index][data-card-field]').forEach(el=>{
    const i = Number(el.dataset.cardIndex);
    cards[i] = cards[i] || { image: HERO_ASSETS[i] || HERO_ASSETS[0], title:'', subtitle:'', href:'#' };
    cards[i][el.dataset.cardField] = String(el.value || '').trim();
  });
  if(cards.length) next.cards.index = cards;

  return next;
}

async function main(){
  const root = $("cmsPanel");
  if(!root) return;

  let base = ensure(await fetchConfig());
  let current = JSON.parse(JSON.stringify(base));
  try{
    const override = JSON.parse(localStorage.getItem(LS_OVERRIDE_KEY) || "null");
    if(override && typeof override === 'object') current = ensure(deepMerge(current, override));
  }catch(_){
    localStorage.removeItem(LS_OVERRIDE_KEY);
  }

  renderTextsEditor(current);
  renderPageSelect(current);
  renderCardsEditor(current);
  const pageSelect = $("cms_page_select");
  renderHeroEditor(current, pageSelect?.value || "index");

  pageSelect?.addEventListener('change', ()=> renderHeroEditor(current, pageSelect.value));

  $("cms_add_slide")?.addEventListener('click', ()=>{
    const pageKey = pageSelect?.value || 'index';
    current.heroes[pageKey] = current.heroes[pageKey] || { slides: [] };
    current.heroes[pageKey].slides.push({ image: HERO_ASSETS[0], title: "", subtitle: "", ctaText: "", ctaHref: "#" });
    renderHeroEditor(current, pageKey);
  });

  $("cms_publish")?.addEventListener('click', ()=>{
    current = collectConfig(current);
    localStorage.setItem(LS_OVERRIDE_KEY, JSON.stringify(current));
    bumpVersion();
    toast('Mudanças publicadas neste navegador ✅ Atualize o site para ver.');
  });

  $("cms_export")?.addEventListener('click', ()=>{
    current = collectConfig(current);
    downloadJson(current, 'site-config.json');
    toast('Arquivo site-config.json exportado ✅');
  });

  $("cms_reset")?.addEventListener('click', ()=>{
    localStorage.removeItem(LS_OVERRIDE_KEY);
    bumpVersion();
    location.reload();
  });

  $("cms_import")?.addEventListener('change', async (event)=>{
    const file = event.target.files?.[0];
    if(!file) return;
    try{
      const raw = await file.text();
      current = ensure(JSON.parse(raw));
      localStorage.setItem(LS_OVERRIDE_KEY, JSON.stringify(current));
      bumpVersion();
      location.reload();
    } catch(err){
      alert('JSON inválido.');
    }
  });

  toast('Editor do site carregado ✅');
}

main().catch(err=>{
  console.error(err);
  const msg = err?.message || 'Erro ao carregar editor do site.';
  const box = $("cms_status");
  if(box){ box.textContent = msg; box.style.display = 'block'; }
  else alert(msg);
});

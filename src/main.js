import "./style.css";
import * as Astronomy from "astronomy-engine";

/** =========================
 *  I18N
 *  ========================= */
const I18N = {
  sv: {
    title: (weekdayLatin) => weekdayLatin,
    sun: "Sol",
    moon: "Måne",
    moonAge: "Månålder",
    days: "dygn",
    reshTitle: (placeLabel) => `Resh (${placeLabel})`,
    sunrise: "Soluppgång",
    noon: "Mitt på dagen",
    sunset: "Solnedgång",
    midnight: "Midnatt",
    nextResh: "Nästa Resh",
    inWord: "om",
    equinoxNext: "Nästa Gudarnas Dagjämning ~±2h (lokal tid)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Lokal plats",
    cantGeo: "Kunde inte hämta plats (använder Stockholm).",
    era: "E.V.",
    annoLegis: "Anno Legis",
    moonPhase: {
      new: "Nymåne",
      waxingCrescent: "Tilltagande skära",
      firstQuarter: "Första kvarteret",
      waxingGibbous: "Tilltagande gibbous",
      full: "Fullmåne",
      waningGibbous: "Avtagande gibbous",
      lastQuarter: "Sista kvarteret",
      waningCrescent: "Avtagande skära",
    },
    fatalTitle: "Fel i appen",
    fatalHint: "Kopiera texten och skicka hit.",
  },
  en: {
    title: (weekdayLatin) => weekdayLatin,
    sun: "Sun",
    moon: "Moon",
    moonAge: "Moon age",
    days: "days",
    reshTitle: (placeLabel) => `Resh (${placeLabel})`,
    sunrise: "Sunrise",
    noon: "Noon",
    sunset: "Sunset",
    midnight: "Midnight",
    nextResh: "Next Resh",
    inWord: "in",
    equinoxNext: "Next Equinox of the Gods ~±2h (local time)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Local",
    cantGeo: "Could not get location (using Stockholm).",
    era: "E.V.",
    annoLegis: "Anno Legis",
    moonPhase: {
      new: "New Moon",
      waxingCrescent: "Waxing Crescent",
      firstQuarter: "First Quarter",
      waxingGibbous: "Waxing Gibbous",
      full: "Full Moon",
      waningGibbous: "Waning Gibbous",
      lastQuarter: "Last Quarter",
      waningCrescent: "Waning Crescent",
    },
    fatalTitle: "App error",
    fatalHint: "Copy the text and paste it here.",
  }
};

const weekdayLatin = [
  "Dies Solis",
  "Dies Lunae",
  "Dies Martis",
  "Dies Mercurii",
  "Dies Jovis",
  "Dies Veneris",
  "Dies Saturnii",
];

const signLatinGen = [
  "Arietis", "Tauri", "Geminorum", "Cancri", "Leonis", "Virginis",
  "Librae", "Scorpii", "Sagittarii", "Capricorni", "Aquarii", "Piscium",
];

/** =========================
 *  Utilities
 *  ========================= */
function mod360(x){ const m = x % 360; return m < 0 ? m + 360 : m; }
function wrap180(x){ let y = (x + 180) % 360; if (y < 0) y += 360; return y - 180; }
function pad2(n){ return String(n).padStart(2, "0"); }
function isValidDate(d){ return d instanceof Date && !isNaN(d.getTime()); }

function formatLonAsSign(lonDeg){
  const lon = mod360(lonDeg);
  const sign = Math.floor(lon / 30);
  const deg = lon - sign * 30;
  return { deg, sign: signLatinGen[sign] };
}
function formatTimeLocal(date){
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
function formatDateLongLocal(date, lang){
  return date.toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}
function formatCountdown(ms){
  ms = Math.max(0, ms);
  const total = Math.floor(ms / 1000);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}
function midpointDate(a, b){
  if (!isValidDate(a) || !isValidDate(b)) return null;
  return new Date((a.getTime() + b.getTime()) / 2);
}
function toDate(x){
  if (!x) return null;
  if (x instanceof Date) return x;
  if (x.date instanceof Date) return x.date;
  if (typeof x.ToDate === "function") {
    const d = x.ToDate();
    return d instanceof Date ? d : null;
  }
  return null;
}

/** =========================
 *  Equinox + Thelemic year
 *  ========================= */
function vernalEquinoxUTC(year){
  let a = new Date(Date.UTC(year, 2, 19, 0, 0, 0));
  let b = new Date(Date.UTC(year, 2, 22, 0, 0, 0));
  const f = (d) => wrap180(Astronomy.SunPosition(d).elon);

  let fa = f(a), fb = f(b);
  for (let i = 0; i < 4 && fa * fb > 0; i++){
    a = new Date(a.getTime() - 24 * 3600 * 1000);
    b = new Date(b.getTime() + 24 * 3600 * 1000);
    fa = f(a); fb = f(b);
  }
  for (let i = 0; i < 60; i++){
    const mid = new Date((a.getTime() + b.getTime()) / 2);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-7) return mid;
    if (fa * fm <= 0) b = mid; else a = mid;
  }
  return new Date((a.getTime() + b.getTime()) / 2);
}

function thelemicYearFor(now){
  const y = now.getUTCFullYear();
  const eqThis = vernalEquinoxUTC(y);
  const startYear = now.getTime() >= eqThis.getTime() ? y : y - 1;

  const offset = startYear - 1904;
  const docosade = Math.floor(offset / 22);
  const within = ((offset % 22) + 22) % 22;
  return { docosade, within };
}

function roman(n, upper = true){
  if (n === 0) return "0";
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let x = n, out = "";
  for (const [v, s] of map) while (x >= v) { out += s; x -= v; }
  return upper ? out : out.toLowerCase();
}

function tarotFor(_docosade, _within, lang){
  return lang === "sv" ? "Lustan i Hierofanten" : "Lust in the Hierophant";
}

/** =========================
 *  Moon phase
 *  ========================= */
function moonPhaseInfo(date){
  const elong = Astronomy.MoonPhase(date);
  const phaseAngle = mod360(elong);
  const frac = (1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2;
  const age = (phaseAngle / 360) * 29.53059;

  let key = "new";
  if (phaseAngle < 22.5 || phaseAngle >= 337.5) key = "new";
  else if (phaseAngle < 67.5) key = "waxingCrescent";
  else if (phaseAngle < 112.5) key = "firstQuarter";
  else if (phaseAngle < 157.5) key = "waxingGibbous";
  else if (phaseAngle < 202.5) key = "full";
  else if (phaseAngle < 247.5) key = "waningGibbous";
  else if (phaseAngle < 292.5) key = "lastQuarter";
  else key = "waningCrescent";

  return { frac, age, key };
}

/** =========================
 *  Resh times
 *  ========================= */
function searchRiseSetForLocalDate(observer, direction, dateLocal){
  const y = dateLocal.getFullYear();
  const m = dateLocal.getMonth();
  const d = dateLocal.getDate();
  const start = new Date(y, m, d, 0, 0, 0);

  try {
    const rs = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, direction, start, 1);
    const dt = toDate(rs);
    if (isValidDate(dt)) return dt;
  } catch {}

  try {
    const alt = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, direction, start, 1, -0.833);
    const dt = toDate(alt);
    if (isValidDate(dt)) return dt;
  } catch {}

  return null;
}

function nextLocalMidnight(now){
  const m0 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return new Date(m0.getTime() + 24 * 3600 * 1000);
}

function reshTimesForLocalDate(lat, lon, dateLocal, now){
  const observer = new Astronomy.Observer(lat, lon, 0);
  const sunrise = searchRiseSetForLocalDate(observer, +1, dateLocal);
  const sunset  = searchRiseSetForLocalDate(observer, -1, dateLocal);

  let noon = midpointDate(sunrise, sunset);
  if (!isValidDate(noon)) {
    try {
      const anchor = new Date(dateLocal.getFullYear(), dateLocal.getMonth(), dateLocal.getDate(), 12, 0, 0);
      noon = toDate(Astronomy.SearchTransit(Astronomy.Body.Sun, observer, anchor, 1));
    } catch {
      noon = null;
    }
  }

  const midnight = nextLocalMidnight(now);
  return { sunrise, noon, sunset, midnight };
}

/** =========================
 *  State
 *  ========================= */
const state = {
  lang: localStorage.getItem("lang") || "sv",
  useGeo: localStorage.getItem("useGeo") === "1",
  coords: null,
  stockholm: { lat: 59.3293, lon: 18.0686 },
};

/** =========================
 *  UI mount + helpers
 *  ========================= */
function ensureUIMount(){
  const card = document.getElementById("card");
  if (!card) return;

  if (document.getElementById("title")) return;

  card.innerHTML = `
    <div class="topbar">
      <button id="geoBtn" class="iconBtn" aria-label="Geo">📍</button>
      <button id="langBtn" class="iconBtn" aria-label="Language">🌐</button>
      <button id="resetBtn" class="iconBtn" aria-label="Reset">↺</button>
    </div>

    <div id="title" class="title"></div>
    <div id="mainPanel" class="mainPanel"></div>

    <div id="reshTitle" class="reshTitle"></div>
    <div id="reshGrid" class="reshGrid"></div>

    <div id="countdown" class="countdown"></div>
    <div id="footerPanel" class="footer"></div>

    <div id="fatal" style="display:none; margin-top:16px; border:1px solid rgba(212,175,55,0.25); border-radius:16px; padding:14px; color:rgba(212,175,55,0.95); background:rgba(0,0,0,0.55);"></div>
  `;
}

function setText(id, text){
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setHTML(id, html){
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function renderReshGrid(rows){
  const grid = document.getElementById("reshGrid");
  if (!grid) return;
  grid.innerHTML = "";
  for (const r of rows){
    const div = document.createElement("div");
    div.className = "reshItem" + (r.next ? " next" : "");
    div.innerHTML = `
      <div class="reshLeft"><span>${r.icon}</span><span>${r.label}</span></div>
      <div>${r.value}</div>
    `;
    grid.appendChild(div);
  }
}

function triggerShimmer(){
  const card = document.getElementById("card");
  if (!card) return;
  card.classList.add("shimmer");
  setTimeout(() => card.classList.remove("shimmer"), 1400);
}

function hideSplash(){
  const splash = document.getElementById("splash");
  if (!splash) return;
  splash.classList.add("hidden");
  setTimeout(() => splash.remove(), 350);
}

function showFatal(err){
  const t = I18N[state.lang] || I18N.sv;
  const fatal = document.getElementById("fatal");
  if (!fatal) return;
  const msg = (err && err.stack) ? String(err.stack) : String(err || "Unknown error");
  fatal.style.display = "block";
  fatal.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">${t.fatalTitle}</div>
    <div style="opacity:0.85; margin-bottom:10px;">${t.fatalHint}</div>
    <pre style="white-space:pre-wrap; margin:0; font-size:12px; line-height:1.35; opacity:0.95;">${escapeHtml(msg)}</pre>
  `;
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

/** =========================
 *  Main compute/render (wrapped)
 *  ========================= */
function computeAndRender(now = new Date()){
  const t = I18N[state.lang] || I18N.sv;

  setText("title", t.title(weekdayLatin[now.getDay()]));

  const sun = Astronomy.SunPosition(now);
  const moon = Astronomy.EclipticGeoMoon(now);
  const sunFmt = formatLonAsSign(sun.elon);
  const moonFmt = formatLonAsSign(moon.lon);

  const ty = thelemicYearFor(now);
  const anno = `${t.annoLegis} ${roman(ty.docosade)}:${roman(ty.within, false)}`;
  const tarot = `${t.tarot}: ${tarotFor(ty.docosade, ty.within, state.lang)}`;
  const normalDate = `${formatDateLongLocal(now, state.lang)} ${t.era}`;

  const mp = moonPhaseInfo(now);
  const pct = Math.round(mp.frac * 100);
  const phaseName = t.moonPhase[mp.key] || mp.key;
  const moonAge = Math.round(mp.age * 10) / 10;

  const use = state.useGeo && state.coords ? state.coords : state.stockholm;
  const placeLabel = state.useGeo && state.coords ? t.placeLocal : t.placeStockholm;

  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const resh = reshTimesForLocalDate(use.lat, use.lon, todayLocal, now);

  const sunrise = isValidDate(resh.sunrise) ? resh.sunrise : null;
  const noonD   = isValidDate(resh.noon) ? resh.noon : null;
  const sunset  = isValidDate(resh.sunset) ? resh.sunset : null;
  const midD    = isValidDate(resh.midnight) ? resh.midnight : null;

  const candidates = [
    { key:"sunrise",  icon:"🌅", label:t.sunrise,  when:sunrise },
    { key:"noon",     icon:"☀️", label:t.noon,     when:noonD },
    { key:"sunset",   icon:"🌇", label:t.sunset,   when:sunset },
    { key:"midnight", icon:"🌌", label:t.midnight, when:midD },
  ].filter(x => x.when && isValidDate(x.when));

  let next = null;
  for (const c of candidates){
    if (c.when.getTime() > now.getTime()){
      if (!next || c.when < next.when) next = c;
    }
  }
  if (!next) next = candidates[0] || null;

  setHTML("mainPanel", `
    <div>☉ ${t.sun} in ${sunFmt.deg.toFixed(1)}° ${sunFmt.sign}</div>
    <div>☾ ${t.moon} in ${moonFmt.deg.toFixed(1)}° ${moonFmt.sign}</div>

    <div class="anno">${anno}</div>
    <div class="tarot">${tarot}</div>
    <div class="ve">${normalDate}</div>

    <div class="moon">🌕 ${t.moon}: ${phaseName} (${pct}%)</div>
    <div class="moonSub">${t.moonAge}: ${moonAge} ${t.days}</div>
  `);

  setText("reshTitle", t.reshTitle(placeLabel));

  const rows = [
    { icon:"🌅", label:t.sunrise,  value: sunrise ? formatTimeLocal(sunrise) : "—" },
    { icon:"☀️", label:t.noon,     value: noonD ? formatTimeLocal(noonD) : "—" },
    { icon:"🌇", label:t.sunset,   value: sunset ? formatTimeLocal(sunset) : "—" },
    { icon:"🌌", label:t.midnight, value: midD ? formatTimeLocal(midD) : "—" },
  ];

  if (next){
    for (const r of rows){
      if (r.label === next.label) r.next = true;
    }
  }
  renderReshGrid(rows);

  if (next){
    const ms = next.when.getTime() - now.getTime();
    setText("countdown", `${t.nextResh}: ${next.icon} ${next.label} ${t.inWord} ${formatCountdown(ms)}`);
  } else {
    setText("countdown", "");
  }

  const y = now.getUTCFullYear();
  const eqThis = vernalEquinoxUTC(y);
  const eqNext = now.getTime() < eqThis.getTime() ? eqThis : vernalEquinoxUTC(y + 1);

  const twoH = 2 * 60 * 60 * 1000;
  const eqRounded = new Date(Math.round(eqNext.getTime() / twoH) * twoH);

  setText(
    "footerPanel",
    `${t.equinoxNext}: ${eqRounded.getFullYear()}-${pad2(eqRounded.getMonth()+1)}-${pad2(eqRounded.getDate())} ${pad2(eqRounded.getHours())}:${pad2(eqRounded.getMinutes())}`
  );
}

/** =========================
 *  Geo + buttons
 *  ========================= */
function tryEnableGeo(){
  const t = I18N[state.lang] || I18N.sv;

  if (!navigator.geolocation){
    alert(t.cantGeo);
    state.useGeo = false;
    state.coords = null;
    localStorage.setItem("useGeo", "0");
    safeRender();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      state.useGeo = true;
      localStorage.setItem("useGeo", "1");
      safeRender();
    },
    () => {
      alert(t.cantGeo);
      state.useGeo = false;
      state.coords = null;
      localStorage.setItem("useGeo", "0");
      safeRender();
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
  );
}

function setStockholm(){
  state.useGeo = false;
  state.coords = null;
  localStorage.setItem("useGeo", "0");
  safeRender();
}

function toggleLang(){
  state.lang = state.lang === "sv" ? "en" : "sv";
  localStorage.setItem("lang", state.lang);
  safeRender();
}

/** =========================
 *  Safe render wrapper
 *  ========================= */
let splashHidden = false;

function safeRender(){
  try {
    ensureUIMount();
    computeAndRender(new Date());

    // Only hide splash after first successful render
    if (!splashHidden) {
      splashHidden = true;
      setTimeout(hideSplash, 200);
    }
  } catch (err) {
    console.error(err);
    ensureUIMount();
    showFatal(err);
    // Keep splash visible so you see "something" if fatal happens
  }
}

/** =========================
 *  Boot
 *  ========================= */
function boot(){
  ensureUIMount();
  triggerShimmer();

  const geoBtn = document.getElementById("geoBtn");
  const langBtn = document.getElementById("langBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (geoBtn) geoBtn.addEventListener("click", tryEnableGeo);
  if (langBtn) langBtn.addEventListener("click", toggleLang);
  if (resetBtn) resetBtn.addEventListener("click", setStockholm);

  // Try geo if user enabled
  if (state.useGeo) tryEnableGeo();

  // initial
  safeRender();

  // update each second
  setInterval(safeRender, 1000);

  // PWA update shimmer (optional)
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          triggerShimmer();
          setTimeout(() => updateSW(true), 450);
        },
      });
    })
    .catch(() => {});
}

// Global crash -> show on screen
window.addEventListener("error", (e) => {
  try { showFatal(e.error || e.message); } catch {}
});
window.addEventListener("unhandledrejection", (e) => {
  try { showFatal(e.reason); } catch {}
});

boot();
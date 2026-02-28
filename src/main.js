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
    inLabel: "om",
    equinoxNext: "Nästa vårdagjämning ~±2h (lokal tid)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Lokal plats",
    cantGeo: "Kunde inte hämta plats (använder Stockholm).",
    langSwedish: "Svenska",
    langEnglish: "English",
    era: "E.V.",
    moonPhase: {
      new: "Nymåne",
      waxingCrescent: "Tilltagande skära",
      firstQuarter: "Första kvarteret",
      waxingGibbous: "Tilltagande gibbous",
      full: "Fullmåne",
      waningGibbous: "Avtagande gibbous",
      lastQuarter: "Sista kvarteret",
      waningCrescent: "Avtagande skära",
    }
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
    inLabel: "in",
    equinoxNext: "Next Vernal Equinox ~±2h (local time)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Local",
    cantGeo: "Could not get location (using Stockholm).",
    langSwedish: "Svenska",
    langEnglish: "English",
    era: "E.V.",
    moonPhase: {
      new: "New Moon",
      waxingCrescent: "Waxing Crescent",
      firstQuarter: "First Quarter",
      waxingGibbous: "Waxing Gibbous",
      full: "Full Moon",
      waningGibbous: "Waning Gibbous",
      lastQuarter: "Last Quarter",
      waningCrescent: "Waning Crescent",
    }
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
function mod360(x) {
  const m = x % 360;
  return m < 0 ? m + 360 : m;
}
function wrap180(x) {
  let y = (x + 180) % 360;
  if (y < 0) y += 360;
  return y - 180;
}
function formatLonAsSign(lonDeg) {
  const lon = mod360(lonDeg);
  const sign = Math.floor(lon / 30);
  const deg = lon - sign * 30;
  return { deg, sign: signLatinGen[sign] };
}
function pad2(n){ return String(n).padStart(2, "0"); }
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
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function isValidDate(d){ return d instanceof Date && !isNaN(d.getTime()); }

/**
 * Normaliserar Astronomy Engine returtyper:
 * - Ibland får man AstroTime (med .date)
 * - Ibland Date direkt
 */
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
 *  Thelemic Year (Docosade:within)
 *  New Year at Vernal Equinox (UTC calc)
 *  ========================= */
function vernalEquinoxUTC(year) {
  let a = new Date(Date.UTC(year, 2, 19, 0, 0, 0));
  let b = new Date(Date.UTC(year, 2, 22, 0, 0, 0));
  const f = (d) => wrap180(Astronomy.SunPosition(d).elon);

  let fa = f(a), fb = f(b);
  for (let i = 0; i < 4 && fa * fb > 0; i++) {
    a = new Date(a.getTime() - 24 * 3600 * 1000);
    b = new Date(b.getTime() + 24 * 3600 * 1000);
    fa = f(a); fb = f(b);
  }

  for (let i = 0; i < 60; i++) {
    const mid = new Date((a.getTime() + b.getTime()) / 2);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-7) return mid;
    if (fa * fm <= 0) b = mid;
    else a = mid;
  }
  return new Date((a.getTime() + b.getTime()) / 2);
}

function thelemicYearFor(now) {
  const y = now.getUTCFullYear();
  const eqThis = vernalEquinoxUTC(y);
  const startYear = now.getTime() >= eqThis.getTime() ? y : y - 1;

  const offset = startYear - 1904;
  const docosade = Math.floor(offset / 22);
  const within = ((offset % 22) + 22) % 22;

  return { docosade, within };
}

function roman(n, upper = true) {
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

/** =========================
 *  Tarot mapping (Thoth titles)
 *  ========================= */
const TRUMPS = {
  sv: [
    "Narren","Magikern","Översteprästinnan","Kejsarinnan","Kejsaren","Hierofanten",
    "De Älskande","Vagnen","Justering","Eremiten","Lyckohjulet","Lustan",
    "Den Hängde","Döden","Konsten","Djävulen","Tornet","Stjärnan",
    "Månen","Solen","Eonen","Universum"
  ],
  en: [
    "The Fool","The Magus","The Priestess","The Empress","The Emperor","The Hierophant",
    "The Lovers","The Chariot","Adjustment","The Hermit","Fortune","Lust",
    "The Hanged Man","Death","Art","The Devil","The Tower","The Star",
    "The Moon","The Sun","The Aeon","The Universe"
  ]
};

function tarotFor(docosade, within, lang){
  const L = (lang === "sv") ? "sv" : "en";
  const inner = TRUMPS[L][clamp(within, 0, 21)] ?? String(within);
  const outer = TRUMPS[L][clamp(docosade, 0, 21)] ?? String(docosade);
  return (L === "sv") ? `${inner} i ${outer}` : `${inner} in ${outer}`;
}

/** =========================
 *  Moon phase/age (approx)
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

  return { phaseAngle, frac, age, key };
}

/** =========================
 *  Resh times (Search from NOW)
 *  ========================= */
function reshTimesFor(lat, lon) {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const now = new Date();

  // Sök nästa händelser från NU
  const riseT = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, now, 2);
  const setT  = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, now, 2);
  const noonT = Astronomy.SearchTransit(Astronomy.Body.Sun, observer, now, 2);

  const sunrise = toDate(riseT);
  const sunset  = toDate(setT);
  const noon    = toDate(noonT);

  // Nästa lokala midnatt
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const midnightLocal = new Date(y, m, d, 0, 0, 0);
  const midnight = now > midnightLocal
    ? new Date(midnightLocal.getTime() + 24 * 3600 * 1000)
    : midnightLocal;

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
 *  UI helpers
 *  ========================= */
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
function formatCountdown(ms){
  ms = Math.max(0, ms);
  const total = Math.floor(ms / 1000);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

/** =========================
 *  Main compute/render
 *  ========================= */
function computeAndRender(now = new Date()){
  const t = I18N[state.lang] || I18N.sv;

  // Title
  setText("title", t.title(weekdayLatin[now.getDay()]));

  // Sun / Moon positions
  const sun = Astronomy.SunPosition(now);
  const moon = Astronomy.EclipticGeoMoon(now);
  const sunFmt = formatLonAsSign(sun.elon);
  const moonFmt = formatLonAsSign(moon.lon);

  // Thelemic year
  const ty = thelemicYearFor(now);
  const anno = `Anno ${roman(ty.docosade)}:${roman(ty.within, false)}`;
  const tarot = `${t.tarot}: ${tarotFor(ty.docosade, ty.within, state.lang)}`;

  // Date + era
  const normalDate = `${formatDateLongLocal(now, state.lang)} ${t.era}`;

  // Moon phase/age
  const mp = moonPhaseInfo(now);
  const pct = Math.round(mp.frac * 100);
  const phaseName = t.moonPhase[mp.key] || mp.key;
  const moonAge = Math.round(mp.age * 10) / 10;

  // Location
  const use = state.useGeo && state.coords ? state.coords : state.stockholm;
  const placeLabel = state.useGeo && state.coords ? t.placeLocal : t.placeStockholm;

  // Resh times (from NOW)
  let resh = { sunrise: null, noon: null, sunset: null, midnight: null };
  try{
    resh = reshTimesFor(use.lat, use.lon);
  }catch{
    // ignore
  }

  const sunrise = isValidDate(resh.sunrise) ? resh.sunrise : null;
  const noonD   = isValidDate(resh.noon) ? resh.noon : null;
  const sunset  = isValidDate(resh.sunset) ? resh.sunset : null;
  const midD    = isValidDate(resh.midnight) ? resh.midnight : null;

  // Next Resh among these four
  const candidates = [
    { icon:"🌅", label:t.sunrise,  when:sunrise },
    { icon:"☀️", label:t.noon,     when:noonD },
    { icon:"🌇", label:t.sunset,   when:sunset },
    { icon:"🌌", label:t.midnight, when:midD },
  ].filter(x => x.when && isValidDate(x.when));

  let next = null;
  for (const c of candidates){
    if (c.when.getTime() > now.getTime()){
      if (!next || c.when < next.when) next = c;
    }
  }

  // Render main panel
  setHTML("mainPanel", `
    <div>☉ ${t.sun} in ${sunFmt.deg.toFixed(1)}° ${sunFmt.sign}</div>
    <div>☾ ${t.moon} in ${moonFmt.deg.toFixed(1)}° ${moonFmt.sign}</div>

    <div class="anno">${anno}</div>
    <div class="tarot">${tarot}</div>
    <div class="ve">${normalDate}</div>

    <div class="moon">🌕 ${t.moon}: ${phaseName} (${pct}%)</div>
    <div class="moonSub">${t.moonAge}: ${moonAge} ${t.days}</div>
  `);

  // Resh title + list
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

  // Countdown
  if (next){
    setText("countdown", `${t.nextResh}: ${next.icon} ${next.label} ${t.inLabel} ${formatCountdown(next.when.getTime() - now.getTime())}`);
  }else{
    setText("countdown", "");
  }

  // Next equinox
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
 *  Geolocation + buttons
 *  ========================= */
function tryEnableGeo(){
  const t = I18N[state.lang] || I18N.sv;

  if (!navigator.geolocation){
    alert(t.cantGeo);
    state.useGeo = false;
    state.coords = null;
    localStorage.setItem("useGeo", "0");
    computeAndRender(new Date());
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      state.useGeo = true;
      localStorage.setItem("useGeo", "1");
      computeAndRender(new Date());
    },
    () => {
      alert(t.cantGeo);
      state.useGeo = false;
      state.coords = null;
      localStorage.setItem("useGeo", "0");
      computeAndRender(new Date());
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
  );
}

function setStockholm(){
  state.useGeo = false;
  state.coords = null;
  localStorage.setItem("useGeo", "0");
  computeAndRender(new Date());
}

function toggleLang(){
  state.lang = state.lang === "sv" ? "en" : "sv";
  localStorage.setItem("lang", state.lang);
  computeAndRender(new Date());
}

/** =========================
 *  Boot
 *  ========================= */
function boot(){
  const card = document.getElementById("card");
  if (card) setTimeout(() => card.classList.remove("shimmer"), 1400);

  const geoBtn = document.getElementById("geoBtn");
  const langBtn = document.getElementById("langBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (geoBtn) geoBtn.addEventListener("click", tryEnableGeo);
  if (langBtn) langBtn.addEventListener("click", toggleLang);
  if (resetBtn) resetBtn.addEventListener("click", setStockholm);

  if (state.useGeo) tryEnableGeo();

  computeAndRender(new Date());
  setInterval(() => computeAndRender(new Date()), 1000);
}

boot();
import * as Astronomy from "astronomy-engine";

/* ==============================
   SETTINGS (lang + location)
================================ */
const SETTINGS_KEY = "thelema_settings_v4";

const DEFAULT_LOCATION = {
  name: "Stockholm",
  latitude: 59.3293,
  longitude: 18.0686,
  elevation: 0,
};

let settings = loadSettings();
let location = settings.location ?? DEFAULT_LOCATION;

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { lang: "sv", location: null };
    const s = JSON.parse(raw);
    return {
      lang: s.lang === "en" ? "en" : "sv",
      location: s.location && typeof s.location.latitude === "number" ? s.location : null,
    };
  } catch {
    return { lang: "sv", location: null };
  }
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, location }));
}

/* ==============================
   I18N
================================ */
const i18n = {
  sv: {
    sun: "Sol",
    moon: "Måne",
    moonAge: "Månålder",
    tarot: "Tarot",
    anno: "Anno",
    ev: "E.V.",
    dayUnit: "dygn",
    equinoxNext: (dt) => `Nästa vårdagjämning ~±2h (lokal tid): ${dt}`,
    reshTitle: (name) => `Resh (${name})`,
    dawn: "Soluppgång",
    noon: "Mitt på dagen",
    sunset: "Solnedgång",
    midnight: "Midnatt",
    nextResh: (icon, label, hms) => `Nästa Resh: ${icon} ${label} om ${hms}`,
    phaseNames: [
      "Nymåne",
      "Tilltagande skära",
      "Första kvarteret",
      "Tilltagande gibbous",
      "Fullmåne",
      "Avtagande gibbous",
      "Sista kvarteret",
      "Avtagande skära",
    ],
    geoDenied: "Geolokalisering nekad. Kör Stockholm som standard.",
    geoFailed: "Kunde inte läsa position. Kör Stockholm som standard.",
    geoOk: (name) => `Plats satt: ${name}`,
  },
  en: {
    sun: "Sun",
    moon: "Moon",
    moonAge: "Moon age",
    tarot: "Tarot",
    anno: "Anno",
    ev: "E.V.",
    dayUnit: "days",
    equinoxNext: (dt) => `Next vernal equinox ~±2h (local time): ${dt}`,
    reshTitle: (name) => `Resh (${name})`,
    dawn: "Sunrise",
    noon: "Noon",
    sunset: "Sunset",
    midnight: "Midnight",
    nextResh: (icon, label, hms) => `Next Resh: ${icon} ${label} in ${hms}`,
    phaseNames: [
      "New Moon",
      "Waxing Crescent",
      "First Quarter",
      "Waxing Gibbous",
      "Full Moon",
      "Waning Gibbous",
      "Last Quarter",
      "Waning Crescent",
    ],
    geoDenied: "Geolocation denied. Using Stockholm as default.",
    geoFailed: "Could not read location. Using Stockholm as default.",
    geoOk: (name) => `Location set: ${name}`,
  },
};

function T() {
  return i18n[settings.lang];
}

/* ==============================
   TAROT (Thelemic ATU)
================================ */
const atuSv = [
  "Narren","Magikern","Översteprästinnan","Kejsarinnan","Kejsaren",
  "Hierofanten","De älskande","Vagnen","Justering","Eremiten",
  "Förändring","Lustan","Den hängde","Döden","Konsten",
  "Djävulen","Tornet","Stjärnan","Månen","Solen",
  "Aeonen","Universum"
];
const atuEn = [
  "The Fool","The Magus","The High Priestess","The Empress","The Emperor",
  "The Hierophant","The Lovers","The Chariot","Adjustment","The Hermit",
  "Fortune","Lust","The Hanged Man","Death","Art",
  "The Devil","The Tower","The Star","The Moon","The Sun",
  "Aeon","The Universe"
];
function ATU() {
  return settings.lang === "sv" ? atuSv : atuEn;
}

/* ==============================
   CONSTANTS
================================ */
const weekdayLatin = [
  "Dies Solis","Dies Lunae","Dies Martis","Dies Mercurii",
  "Dies Jovis","Dies Veneris","Dies Saturnii"
];

const signLatinGen = [
  "Arietis","Tauri","Geminorum","Cancri","Leonis","Virginis",
  "Librae","Scorpii","Sagittarii","Capricorni","Aquarii","Piscium"
];

const SYNODIC_MONTH_DAYS = 29.530588853;

/* ==============================
   DOM
================================ */
const elTitle = document.getElementById("title");
const elMain = document.getElementById("mainPanel");
const elReshTitle = document.getElementById("reshTitle");
const elResh = document.getElementById("reshGrid");
const elCountdown = document.getElementById("countdown");
const elFooter = document.getElementById("footerPanel");

const btnLang = document.getElementById("langBtn");
const btnGeo = document.getElementById("geoBtn");
const btnReset = document.getElementById("resetBtn");

/* ==============================
   HELPERS
================================ */
function mod360(x){const m=x%360;return m<0?m+360:m;}
function wrap180(x){let y=(x+180)%360;if(y<0)y+=360;return y-180;}

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

function formatLonAsSign(lon){
  const l=mod360(lon);
  const sign=Math.floor(l/30);
  const deg=l-sign*30;
  return { deg:Number(deg.toFixed(1)), sign: signLatinGen[sign] };
}

function moonPhaseInfo(sunLon, moonLon){
  const phaseAngle = mod360(moonLon - sunLon);
  const illum = (1 - Math.cos((phaseAngle * Math.PI) / 180)) / 2;
  const icons = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
  const idx = Math.round(phaseAngle / 45) % 8;
  const moonAge = (phaseAngle / 360) * SYNODIC_MONTH_DAYS;
  return {
    icon: icons[idx],
    name: T().phaseNames[idx],
    illumPct: Math.round(illum * 100),
    moonAgeDays: Number(moonAge.toFixed(1)),
  };
}

function fmtDate(now){
  return new Intl.DateTimeFormat(
    settings.lang === "sv" ? "sv-SE" : "en-GB",
    { day:"numeric", month:"long", year:"numeric" }
  ).format(now);
}

function fmtTime(date){
  if(!date) return "—";
  return date.toLocaleTimeString(
    settings.lang === "sv" ? "sv-SE" : "en-GB",
    { hour:"2-digit", minute:"2-digit", hour12:false }
  );
}

function fmtDateTime(date){
  return date.toLocaleString(
    settings.lang === "sv" ? "sv-SE" : "en-GB",
    { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hour12:false }
  );
}

function msToHMS(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const hh = Math.floor(s/3600);
  const mm = Math.floor((s%3600)/60);
  const ss = s%60;
  const pad=n=>String(n).padStart(2,"0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function roundToNearest2Hours(date){
  const twoHours = 2*60*60*1000;
  return new Date(Math.round(date.getTime()/twoHours)*twoHours);
}

/* ==============================
   EQUINOX & THELEMIC YEAR
================================ */
function vernalEquinoxUTC(year){
  let a = new Date(Date.UTC(year,2,19));
  let b = new Date(Date.UTC(year,2,22));
  const f = (d) => wrap180(Astronomy.SunPosition(d).elon);
  let fa=f(a), fb=f(b);

  for(let i=0;i<4 && fa*fb>0;i++){
    a = new Date(a.getTime()-86400000);
    b = new Date(b.getTime()+86400000);
    fa=f(a); fb=f(b);
  }
  for(let i=0;i<60;i++){
    const mid = new Date((a.getTime()+b.getTime())/2);
    const fm = f(mid);
    if (Math.abs(fm) < 1e-7) return mid;
    if (fa*fm <= 0) b=mid; else a=mid;
  }
  return new Date((a.getTime()+b.getTime())/2);
}

function thelemicYearFor(now){
  const y = now.getUTCFullYear();
  const eq = vernalEquinoxUTC(y);
  const startYear = now >= eq ? y : y-1;

  const offset = startYear - 1904;
  return {
    docosade: Math.floor(offset/22),
    within: ((offset%22)+22)%22,
  };
}

function nextVernalEquinoxUTC(now){
  const y = now.getUTCFullYear();
  const eq = vernalEquinoxUTC(y);
  return now < eq ? eq : vernalEquinoxUTC(y+1);
}

/* ==============================
   RESH
================================ */
function reshTimes(now){
  const obs = new Astronomy.Observer(location.latitude, location.longitude, location.elevation);
  const startOfDay = new Date(now);
  startOfDay.setHours(0,0,0,0);
  const start = Astronomy.MakeTime(startOfDay);

  const sunrise = Astronomy.SearchRiseSet("Sun", obs, +1, start, 2)?.date || null;
  const sunset  = Astronomy.SearchRiseSet("Sun", obs, -1, start, 2)?.date || null;

  // Noon = mitten mellan sunrise & sunset (om vi kan)
  const noon = (sunrise && sunset)
    ? new Date((sunrise.getTime() + sunset.getTime()) / 2)
    : new Date(startOfDay.getTime() + 12*3600000);

  // Midnight = 12h efter noon (kan bli 23:59 vid avrundning i vissa länder)
  const midnight = new Date(noon.getTime() + 12*3600000);

  return { sunrise, noon, sunset, midnight };
}

function nextReshEvent(now, r){
  const t=T();
  const list = [
    { k:"dawn",     i:"🌅", l:t.dawn,     time:r.sunrise },
    { k:"noon",     i:"☀️", l:t.noon,     time:r.noon    },
    { k:"sunset",   i:"🌇", l:t.sunset,   time:r.sunset  },
    { k:"midnight", i:"🌌", l:t.midnight, time:r.midnight},
  ].filter(e => e.time);

  list.sort((a,b)=>a.time-b.time);
  for (const e of list) if (e.time > now) return e;
  return list[0]; // annars nästa dygns första
}

/* ==============================
   RENDER (data + tick)
================================ */
let cached = {
  nextResh: null,
  resh: null,
  computedAt: 0,
};

function computeHeavy(now){
  const t=T();

  elTitle.textContent = weekdayLatin[now.getDay()];
  elReshTitle.textContent = t.reshTitle(location.name);

  const sun = Astronomy.SunPosition(now);
  const moon = Astronomy.EclipticGeoMoon(now);
  const sunFmt = formatLonAsSign(sun.elon);
  const moonFmt = formatLonAsSign(moon.lon);
  const phase = moonPhaseInfo(sun.elon, moon.lon);

  const ty = thelemicYearFor(now);
  const doc = ((ty.docosade%22)+22)%22;
  const yr  = ((ty.within%22)+22)%22;

  const tarotLine =
    settings.lang === "sv"
      ? `${t.tarot}: ${ATU()[yr]} i ${ATU()[doc]}`
      : `${t.tarot}: ${ATU()[yr]} in ${ATU()[doc]}`;

  elMain.innerHTML = `
    <div>☉ ${t.sun} in ${sunFmt.deg}° ${sunFmt.sign}</div>
    <div>☾ ${t.moon} in ${moonFmt.deg}° ${moonFmt.sign}</div>

    <div class="anno">${t.anno} ${roman(ty.docosade)}:${roman(ty.within,false)}</div>
    <div class="tarot">${tarotLine}</div>
    <div class="ve">${fmtDate(now)} ${t.ev}</div>

    <div class="moon">${phase.icon} ${t.moon}: ${phase.name} (${phase.illumPct}%)</div>
    <div class="moonSub">${t.moonAge}: ${phase.moonAgeDays} ${t.dayUnit}</div>
  `;

  const resh = reshTimes(now);
  const next = nextReshEvent(now, resh);

  elResh.innerHTML = `
    <div class="reshItem ${next.k==="dawn"?"next":""}">
      <div class="reshLeft"><div>🌅</div><div>${t.dawn}</div></div>
      <div>${fmtTime(resh.sunrise)}</div>
    </div>
    <div class="reshItem ${next.k==="noon"?"next":""}">
      <div class="reshLeft"><div>☀️</div><div>${t.noon}</div></div>
      <div>${fmtTime(resh.noon)}</div>
    </div>
    <div class="reshItem ${next.k==="sunset"?"next":""}">
      <div class="reshLeft"><div>🌇</div><div>${t.sunset}</div></div>
      <div>${fmtTime(resh.sunset)}</div>
    </div>
    <div class="reshItem ${next.k==="midnight"?"next":""}">
      <div class="reshLeft"><div>🌌</div><div>${t.midnight}</div></div>
      <div>${fmtTime(resh.midnight)}</div>
    </div>
  `;

  const nextEq = roundToNearest2Hours(nextVernalEquinoxUTC(now));
  elFooter.textContent = t.equinoxNext(fmtDateTime(nextEq));

  cached = { nextResh: next, resh, computedAt: Date.now() };
}

function tick(){
  const now = new Date();
  const t=T();

  // kör “tunga” beräkningar var 30:e sekund (eller om inget finns)
  if (!cached.nextResh || Date.now() - cached.computedAt > 30000) {
    computeHeavy(now);
  }

  // om vi passerade nästa resh, bygg om direkt så “nästa” hoppar rätt
  if (cached.nextResh && cached.nextResh.time <= now) {
    computeHeavy(now);
  }

  if (cached.nextResh) {
    const until = cached.nextResh.time - now;
    elCountdown.textContent = t.nextResh(cached.nextResh.i, cached.nextResh.l, msToHMS(until));
  }
}

/* ==============================
   BUTTONS
================================ */
btnLang?.addEventListener("click", () => {
  settings.lang = settings.lang === "sv" ? "en" : "sv";
  document.documentElement.lang = settings.lang;
  saveSettings();
  computeHeavy(new Date());
});

btnReset?.addEventListener("click", () => {
  location = { ...DEFAULT_LOCATION };
  saveSettings();
  computeHeavy(new Date());
});

btnGeo?.addEventListener("click", () => {
  const t=T();
  if (!navigator.geolocation) {
    alert(t.geoFailed);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      location = {
        name: "Lokal plats",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        elevation: pos.coords.altitude ?? 0,
      };
      saveSettings();
      computeHeavy(new Date());
      // diskret kvittens (valfritt)
      // alert(t.geoOk(location.name));
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) alert(t.geoDenied);
      else alert(t.geoFailed);
      location = { ...DEFAULT_LOCATION };
      saveSettings();
      computeHeavy(new Date());
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

/* ==============================
   START
================================ */
document.documentElement.lang = settings.lang;
computeHeavy(new Date());
tick();
setInterval(tick, 1000);
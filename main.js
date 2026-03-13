const Astronomy = window.Astronomy;

if (!Astronomy) {
  const el = document.getElementById("mainPanel");
  if (el) {
    el.innerHTML = `
      <div style="color:#d4af37; font-weight:700; margin-bottom:8px;">
        Astronomy-engine laddades inte
      </div>
      <div style="opacity:0.85">
        Kontrollera att index.html laddar astronomy.min.js före main.js och att du kör via Live Server (inte file://).
      </div>
    `;
  }
  throw new Error("Astronomy is not loaded (window.Astronomy is undefined).");
}

/** =========================
 *  Språk/texter
 *  ========================= */
const I18N = {
  sv: {
    title: (weekdayLatin) => weekdayLatin,
    moonAge: "Månålder",
    days: "dygn",
    reshTitle: (placeLabel) => `Resh (${placeLabel})`,
    sunrise: "Soluppgång",
    noon: "Mitt på dagen",
    sunset: "Solnedgång",
    midnight: "Midnatt",
    nextResh: "Nästa Resh",
    inWord: "om",
    equinoxNext: "Nästa vårdagjämning ~±2h (lokal tid)",
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
    }
  },
  en: {
    title: (weekdayLatin) => weekdayLatin,
    moonAge: "Moon age",
    days: "days",
    reshTitle: (placeLabel) => `Resh (${placeLabel})`,
    sunrise: "Sunrise",
    noon: "Noon",
    sunset: "Sunset",
    midnight: "Midnight",
    nextResh: "Next Resh",
    inWord: "in",
    equinoxNext: "Next Vernal Equinox ~±2h (local time)",
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
    }
  }
};

// Veckodag på latin
const weekdayLatin = [
  "Dies Solis",
  "Dies Lunae",
  "Dies Martis",
  "Dies Mercurii",
  "Dies Jovis",
  "Dies Veneris",
  "Dies Saturnii",
];

// Planetglyph för veckodag
const weekdayPlanetGlyphs = [
  "☉", // Dies Solis
  "☾", // Dies Lunae
  "♂", // Dies Martis
  "☿", // Dies Mercurii
  "♃", // Dies Jovis
  "♀", // Dies Veneris
  "♄", // Dies Saturnii
];

// Zodiak-tecken (latin genitiv)
const signLatinGen = [
  "Arietis", "Tauri", "Geminorum", "Cancri", "Leonis", "Virginis",
  "Librae", "Scorpii", "Sagittarii", "Capricorni", "Aquarii", "Piscium",
];

// Zodiac symbols (glyphs)
const signSymbols = [
  "♈","♉","♊","♋","♌","♍",
  "♎","♏","♐","♑","♒","♓"
];

/** =========================
 *  Utilities
 *  ========================= */
function mod360(x) { const m = x % 360; return m < 0 ? m + 360 : m; }
function wrap180(x) { let y = (x + 180) % 360; if (y < 0) y += 360; return y - 180; }
function pad2(n){ return String(n).padStart(2, "0"); }
function isValidDate(d){ return d instanceof Date && !isNaN(d.getTime()); }

function formatLonAsSign(lonDeg){
  const lon = mod360(lonDeg);
  const signIndex = Math.floor(lon / 30);
  const deg = lon - signIndex * 30;
  return { deg, sign: signLatinGen[signIndex], symbol: signSymbols[signIndex] };
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
 *  Thelemic Year
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

/** =========================
 *  Tarot (Thoth) trumps 0..21
 *  ========================= */
const TRUMPS = [
  { sv: "Narren",        en: "The Fool" },
  { sv: "Magusen",       en: "The Magus" },
  { sv: "Prästinnan",    en: "The Priestess" },
  { sv: "Kejsarinnan",   en: "The Empress" },
  { sv: "Kejsaren",      en: "The Emperor" },
  { sv: "Hierofanten",   en: "The Hierophant" },
  { sv: "Älskarna",      en: "The Lovers" },
  { sv: "Vagnen",        en: "The Chariot" },
  { sv: "Justering",     en: "Adjustment" },
  { sv: "Eremiten",      en: "The Hermit" },
  { sv: "Lyckohjulet",   en: "Fortune" },
  { sv: "Lustan",        en: "Lust" },
  { sv: "Den Hängde",    en: "The Hanged Man" },
  { sv: "Döden",         en: "Death" },
  { sv: "Konsten",       en: "Art" },
  { sv: "Djävulen",      en: "The Devil" },
  { sv: "Tornet",        en: "The Tower" },
  { sv: "Stjärnan",      en: "The Star" },
  { sv: "Månen",         en: "The Moon" },
  { sv: "Solen",         en: "The Sun" },
  { sv: "Aeonen",        en: "The Aeon" },
  { sv: "Universum",     en: "The Universe" },
];

function tarotFor(docosade, within, lang){
  const d = ((docosade % 22) + 22) % 22;
  const y = ((within   % 22) + 22) % 22;

  const docTrump = TRUMPS[d][lang] || TRUMPS[d].sv;
  const yrTrump  = TRUMPS[y][lang] || TRUMPS[y].sv;

  return (lang === "sv")
    ? `${yrTrump} i ${docTrump}`
    : `${yrTrump} in the ${docTrump}`;
}

/** =========================
 *  Moon phase/age
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
function moonEmojiFromKey(key){
  switch(key){
    case "new": return "🌑";
    case "waxingCrescent": return "🌒";
    case "firstQuarter": return "🌓";
    case "waxingGibbous": return "🌔";
    case "full": return "🌕";
    case "waningGibbous": return "🌖";
    case "lastQuarter": return "🌗";
    case "waningCrescent": return "🌘";
    default: return "🌙";
  }
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
 *  Modal content
 *  ========================= */
const RESH_APPEND_SV = `Yttersta förening blottad!<br>
Jag tillber Din andedräkts makt,<br>
Högste och fruktansvärde Gud,<br>
Som får gudarna och döden<br>
Att skälva inför Dig:<br>
Jag, jag tillber dig!<br>
Träd fram på Ras tron!<br>
Öppna vägarna för Khu!<br>
Lys upp vägarna för Ka!<br>
Khabs vägar strömmar igenom<br>
För att egga eller lugna mig!<br>
Aum! låt det döda mig!<br>
Så att ditt ljus är i mig; & dess röda låga är som ett svärd i min hand för att driva igenom din ordning.<br>
Det finns en hemlig dörr som jag skall skapa för att instifta din väg i alla väderstreck, (dessa är bönerna, såsom du skrivit), som det är sagt:<br>
Ljuset är mitt; dess strålar förtär<br>
Mig: jag har skapat en hemlig dörr<br>
Till Ra och Tums Hus,<br>
till Khephra och Ahathoor.<br>
Jag är din Thebier, O Mentu,<br>
Profeten Ankh-af-na-khonsu!<br>
Vid Bes-na-Maut mitt bröst jag slår;<br>
Vid vise Ta-Nech väver jag min besvärjelse.<br>
Visa din stjärnprakt, O Nuit!<br>
Bjud in mig i ditt Hus att vistas,<br>
O bevingade orm av ljus, Hadit!<br>
Bliv kvar hos mig, Ra-Hoor-Khuit!`;

const RESH_APPEND_EN = `Unity uttermost showed!<br>
I adore the might of Thy breath,<br>
Supreme and terrible God,<br>
Who makest the gods and death<br>
To tremble before Thee:<br>
I, I adore thee!<br>
Appear on the throne of Ra!<br>
Open the ways of the Khu!<br>
Lighten the ways of the Ka!<br>
The ways of the Khabs run through<br>
To stir me or still me!<br>
Aum! let it fill me!<br>
So that thy light is in me; & its red flame is as a sword in my hand to push thy order.<br>
There is a secret door that I shall make to establish thy way in all the quarters, (these are the adorations, as thou hast written), as it is said:<br>
The light is mine; its rays consume<br>
Me: I have made a secret door<br>
Into the House of Ra and Tum,<br>
Of Khephra and of Ahathoor.<br>
I am thy Theban, O Mentu,<br>
The prophet Ankh-af-na-khonsu!<br>
By Bes-na-Maut my breast I beat;<br>
By wise Ta-Nech I weave my spell.<br>
Show thy star-splendour, O Nuit!<br>
Bid me within thine House to dwell,<br>
O wingèd snake of light, Hadit!<br>
Abide with me, Ra-Hoor-Khuit!`;

const RESH_CONTENT = {
  sunrise: {
    title_sv: "Resh – Soluppgång (Ra)",
    title_en: "Resh – Sunrise (Ra)",
    img: "public/resh/Ra.png",
    text_sv: `Hell dig, du som är Ra i ditt uppgående,<br>
ja även dig som är Ra i din styrka.<br>
Du som färdas över himlen i din bark vid solens uppgång.<br>
Tahuti står i fören i sin prakt, och Ra Hoor står vid rodret.<br>
Hell dig från nattens boningar.<br><br>
${RESH_APPEND_SV}`,
    text_en: `Hail unto Thee who art Ra in Thy rising,<br>
yea, unto Thee who art Ra in Thy strength.<br>
Thou who travellest across the heavens in Thy bark at the uprising of the Sun.<br>
Tahuti standeth in the prow in His splendour, and Ra-Hoor abideth at the helm.<br>
Hail unto Thee from the abodes of the Night.<br><br>
${RESH_APPEND_EN}`,
  },
  noon: {
    title_sv: "Resh – Mitt på dagen (Ahathoor)",
    title_en: "Resh – Noon (Ahathoor)",
    img: "public/resh/Ahathoor.png",
    text_sv: `Hell dig, du som är Ahathoor i din triumf,<br>
ja även dig som är Ahathoor i din skönhet.<br>
Du som färdas över himlen i din bark vid solens middagstimme.<br>
Tahuti står i fören i sin prakt, och Ra Hoor står vid rodret.<br>
Hell dig från morgonens boningar.<br><br>
${RESH_APPEND_SV}`,
    text_en: `Hail unto Thee who art Ahathoor in Thy triumph,<br>
yea, unto Thee who art Ahathoor in Thy beauty.<br>
Thou who travellest across the heavens in Thy bark at the hour of the Sun’s meridian.<br>
Tahuti standeth in the prow in His splendour, and Ra-Hoor abideth at the helm.<br>
Hail unto Thee from the abodes of the Morning.<br><br>
${RESH_APPEND_EN}`,
  },
  sunset: {
    title_sv: "Resh – Solnedgång (Tum)",
    title_en: "Resh – Sunset (Tum)",
    img: "public/resh/Tum.png",
    text_sv: `Hell dig, du som är Tum i ditt nedgående,<br>
ja även dig som är Tum i din lycka.<br>
Du som färdas över himlen i din bark vid solens nedgång.<br>
Tahuti står i fören i sin prakt, och Ra Hoor står vid rodret.<br>
Hell dig från dagens boningar.<br><br>
${RESH_APPEND_SV}`,
    text_en: `Hail unto Thee who art Tum in Thy setting,<br>
yea, unto Thee who art Tum in Thy joy.<br>
Thou who travellest across the heavens in Thy bark at the going down of the Sun.<br>
Tahuti standeth in the prow in His splendour, and Ra-Hoor abideth at the helm.<br>
Hail unto Thee from the abodes of the Day.<br><br>
${RESH_APPEND_EN}`,
  },
  midnight: {
    title_sv: "Resh – Midnatt (Khephra)",
    title_en: "Resh – Midnight (Khephra)",
    img: "public/resh/Khepra.png",
    text_sv: `Hell dig, du som är Khepra i ditt döljande,<br>
ja även dig som är Khepra i din tystnad.<br>
Du som färdas över himlen i din bark vid solens midnattstimme.<br>
Tahuti står i fören i sin prakt, och Ra Hoor står vid rodret.<br>
Hell dig från aftonens boningar.<br><br>
${RESH_APPEND_SV}`,
    text_en: `Hail unto Thee who art Khepra in Thy hiding,<br>
yea, unto Thee who art Khepra in Thy silence.<br>
Thou who travellest across the heavens in Thy bark at the hour of the Sun’s midnight.<br>
Tahuti standeth in the prow in His splendour, and Ra-Hoor abideth at the helm.<br>
Hail unto Thee from the abodes of the Evening.<br><br>
${RESH_APPEND_EN}`,
  },
};

function openReshModal(key){
  const modal = document.getElementById("reshModal");
  const media = document.getElementById("reshModalMedia");
  const title = document.getElementById("reshModalTitle");
  const text  = document.getElementById("reshModalText");
  if (!modal || !media || !title || !text) return;

  const data = RESH_CONTENT[key];
  if (!data) return;

  const isSv = state.lang === "sv";
  title.textContent = isSv ? data.title_sv : data.title_en;
  text.innerHTML = isSv ? data.text_sv : data.text_en;
  media.style.backgroundImage = `url("${data.img}")`;

  modal.classList.add("isOpen");
  modal.setAttribute("aria-hidden", "false");
}
function closeReshModal(){
  const modal = document.getElementById("reshModal");
  if (!modal) return;
  modal.classList.remove("isOpen");
  modal.setAttribute("aria-hidden", "true");
}

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
    div.dataset.resh = r.key;
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");
    div.innerHTML = `
      <div class="reshLeft"><span>${r.icon}</span><span>${r.label}</span></div>
      <div>${r.value}</div>
    `;
    grid.appendChild(div);
  }
}

/** =========================
 *  Main compute/render
 *  ========================= */
function computeAndRender(now = new Date()){
  const t = I18N[state.lang] || I18N.sv;
  const dayIndex = now.getDay();

  setHTML(
    "title",
    `<span class="weekdayGlyph">${weekdayPlanetGlyphs[dayIndex]}</span> ${t.title(weekdayLatin[dayIndex])}`
  );

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

  setHTML("mainPanel", `
    <div><span class="pGlyph">☉</span> in ${sunFmt.deg.toFixed(1)}° <span class="zGlyph">${sunFmt.symbol}</span> ${sunFmt.sign}</div>
    <div><span class="pGlyph">☾</span> in ${moonFmt.deg.toFixed(1)}° <span class="zGlyph">${moonFmt.symbol}</span> ${moonFmt.sign}</div>

    <div class="anno">${anno}</div>
    <div class="tarot">${tarot}</div>
    <div class="ve">${normalDate}</div>

    <div class="moon">${moonEmojiFromKey(mp.key)} ${phaseName} (${pct}%)</div>
    <div class="moonSub">${t.moonAge}: ${moonAge} ${t.days}</div>
  `);

  setText("reshTitle", t.reshTitle(placeLabel));

  const rows = [
    { key:"sunrise",  icon:"🌅", label:t.sunrise,  value: sunrise ? formatTimeLocal(sunrise) : "—" },
    { key:"noon",     icon:"☀️", label:t.noon,     value: noonD ? formatTimeLocal(noonD) : "—" },
    { key:"sunset",   icon:"🌇", label:t.sunset,   value: sunset ? formatTimeLocal(sunset) : "—" },
    { key:"midnight", icon:"🌌", label:t.midnight, value: midD ? formatTimeLocal(midD) : "—" },
  ];

  if (next){
    for (const r of rows) if (r.key === next.key) r.next = true;
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
 *  Events (modal + click)
 *  ========================= */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return closeReshModal();
  const cell = e.target.closest(".reshItem[data-resh]");
  if (cell) openReshModal(cell.dataset.resh);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeReshModal();
  if (e.key === "Enter" || e.key === " ") {
    const el = document.activeElement;
    if (el && el.classList && el.classList.contains("reshItem") && el.dataset.resh){
      e.preventDefault();
      openReshModal(el.dataset.resh);
    }
  }
});

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
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}
boot();
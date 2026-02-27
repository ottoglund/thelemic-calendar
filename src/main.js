import * as Astronomy from "astronomy-engine";
import { registerSW } from "virtual:pwa-register";

/* ==============================
   SETTINGS
================================ */
const SETTINGS_KEY = "thelema_settings_v3";
let settings = loadSettings();

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { lang: "sv" };
    const s = JSON.parse(raw);
    return { lang: s.lang === "en" ? "en" : "sv" };
  } catch {
    return { lang: "sv" };
  }
}
function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ==============================
   I18N
================================ */
const i18n = {
  sv: {
    langTitle: "Byt språk",
    geoTitle: "Använd min position",
    notifTitle: "Notiser",
    resetTitle: "Återställ till Stockholm",
    locationLabel: (name, extra) => `Resh (${name}${extra})`,
    nextResh: (icon, label, note, hms) =>
      `Nästa Resh: ${icon} ${label} ${note ? note + " " : ""}om ${hms}`,
    reminder10: (label) => `Påminnelse: 10 min till ${label}.`,
    equinoxNext: (dt) => `Nästa vårdagjämning ~±2h (lokal tid): ${dt}`,
    sun: "Sol",
    moon: "Måne",
    moonAge: "Månålder",
    tarot: "Tarot",
    anno: "Anno",
    ev: "E.V.",
    dawn: "Soluppgång",
    noon: "Mitt på dagen",
    sunset: "Solnedgång",
    midnight: "Midnatt",
    tomorrowNote: "(imorgon)",
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
    dayUnit: "dygn",
  },
  en: {
    langTitle: "Switch language",
    geoTitle: "Use my location",
    notifTitle: "Notifications",
    resetTitle: "Reset to Stockholm",
    locationLabel: (name, extra) => `Resh (${name}${extra})`,
    nextResh: (icon, label, note, hms) =>
      `Next Resh: ${icon} ${label} ${note ? note + " " : ""}in ${hms}`,
    reminder10: (label) => `Reminder: 10 min to ${label}.`,
    equinoxNext: (dt) => `Next vernal equinox ~±2h (local time): ${dt}`,
    sun: "Sun",
    moon: "Moon",
    moonAge: "Moon age",
    tarot: "Tarot",
    anno: "Anno",
    ev: "E.V.",
    dawn: "Sunrise",
    noon: "Noon",
    sunset: "Sunset",
    midnight: "Midnight",
    tomorrowNote: "(tomorrow)",
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
    dayUnit: "days",
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

const DEFAULT_LOCATION = {
  name: "Stockholm",
  latitude: 59.3293,
  longitude: 18.0686,
  elevation: 0,
};

let location = DEFAULT_LOCATION;

/* ==============================
   HELPERS
================================ */

function mod360(x){const m=x%360;return m<0?m+360:m;}
function wrap180(x){let y=(x+180)%360;if(y<0)y+=360;return y-180;}

function roman(n,upper=true){
  if(n===0)return"0";
  const map=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],
  [100,"C"],[90,"XC"],[50,"L"],[40,"XL"],
  [10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let x=n,out="";
  for(const[v,s]of map)while(x>=v){out+=s;x-=v;}
  return upper?out:out.toLowerCase();
}

function formatLonAsSign(lon){
  const l=mod360(lon);
  const sign=Math.floor(l/30);
  const deg=l-sign*30;
  return{deg:Number(deg.toFixed(1)),sign:signLatinGen[sign]};
}

function moonPhaseInfo(sunLon,moonLon){
  const phaseAngle=mod360(moonLon-sunLon);
  const illum=(1-Math.cos((phaseAngle*Math.PI)/180))/2;
  const icons=["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
  const idx=Math.round(phaseAngle/45)%8;
  const moonAge=(phaseAngle/360)*SYNODIC_MONTH_DAYS;
  return{
    icon:icons[idx],
    name:T().phaseNames[idx],
    illumPct:Math.round(illum*100),
    moonAgeDays:Number(moonAge.toFixed(1))
  };
}

function fmtDate(now){
  return new Intl.DateTimeFormat(
    settings.lang==="sv"?"sv-SE":"en-GB",
    {day:"numeric",month:"long",year:"numeric"}
  ).format(now);
}

function fmtTime(date){
  if(!date)return"—";
  return date.toLocaleTimeString(
    settings.lang==="sv"?"sv-SE":"en-GB",
    {hour:"2-digit",minute:"2-digit",hour12:false}
  );
}

function fmtDateTime(date){
  return date.toLocaleString(
    settings.lang==="sv"?"sv-SE":"en-GB",
    {year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}
  );
}

function msToHMS(ms){
  const s=Math.max(0,Math.floor(ms/1000));
  const hh=Math.floor(s/3600);
  const mm=Math.floor((s%3600)/60);
  const ss=s%60;
  const pad=n=>String(n).padStart(2,"0");
  return`${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

/* ==============================
   EQUINOX & YEAR
================================ */

function vernalEquinoxUTC(year){
  let a=new Date(Date.UTC(year,2,19));
  let b=new Date(Date.UTC(year,2,22));
  const f=d=>wrap180(Astronomy.SunPosition(d).elon);
  let fa=f(a),fb=f(b);

  for(let i=0;i<4&&fa*fb>0;i++){
    a=new Date(a.getTime()-86400000);
    b=new Date(b.getTime()+86400000);
    fa=f(a);fb=f(b);
  }
  for(let i=0;i<60;i++){
    const mid=new Date((a.getTime()+b.getTime())/2);
    const fm=f(mid);
    if(Math.abs(fm)<1e-7)return mid;
    if(fa*fm<=0)b=mid;else a=mid;
  }
  return new Date((a.getTime()+b.getTime())/2);
}

function thelemicYearFor(now){
  const y=now.getUTCFullYear();
  const eq=vernalEquinoxUTC(y);
  const startYear=now>=eq?y:y-1;
  const offset=startYear-1904;
  return{
    docosade:Math.floor(offset/22),
    within:((offset%22)+22)%22
  };
}

function nextVernalEquinoxUTC(now){
  const y=now.getUTCFullYear();
  const eq=vernalEquinoxUTC(y);
  return now<eq?eq:vernalEquinoxUTC(y+1);
}

/* ==============================
   RESH
================================ */

function reshTimes(now){
  const obs=new Astronomy.Observer(
    location.latitude,location.longitude,location.elevation
  );
  const start=Astronomy.MakeTime(new Date(now.setHours(0,0,0,0)));
  const sunrise=Astronomy.SearchRiseSet("Sun",obs,+1,start,2)?.date||null;
  const sunset=Astronomy.SearchRiseSet("Sun",obs,-1,start,2)?.date||null;

  const noon=sunrise&&sunset?
    new Date((sunrise.getTime()+sunset.getTime())/2):
    new Date(new Date().setHours(12,0,0,0));

  const midnight=new Date(noon.getTime()+12*3600000);

  return{sunrise,noon,sunset,midnight};
}

function nextReshEvent(now,r){
  const list=[
    {k:"dawn",i:"🌅",l:T().dawn,t:r.sunrise},
    {k:"noon",i:"☀️",l:T().noon,t:r.noon},
    {k:"sunset",i:"🌇",l:T().sunset,t:r.sunset},
    {k:"midnight",i:"🌌",l:T().midnight,t:r.midnight},
  ].filter(e=>e.t);

  list.sort((a,b)=>a.t-b.t);
  for(const e of list)if(e.t>now)return e;

  return list[0];
}

/* ==============================
   UI
================================ */

const elTitle=document.getElementById("title");
const elMain=document.getElementById("mainPanel");
const elResh=document.getElementById("reshGrid");
const elCountdown=document.getElementById("countdown");
const elFooter=document.getElementById("footerPanel");

document.getElementById("langBtn")?.addEventListener("click",()=>{
  settings.lang=settings.lang==="sv"?"en":"sv";
  saveSettings();
  document.documentElement.lang=settings.lang;
  update();
});

/* ==============================
   UPDATE LOOP
================================ */

function update(){
  const now=new Date();
  const t=T();

  elTitle.textContent=weekdayLatin[now.getDay()];

  const sun=Astronomy.SunPosition(now);
  const moon=Astronomy.EclipticGeoMoon(now);

  const sunFmt=formatLonAsSign(sun.elon);
  const moonFmt=formatLonAsSign(moon.lon);

  const phase=moonPhaseInfo(sun.elon,moon.lon);

  const ty=thelemicYearFor(now);
  const doc=((ty.docosade%22)+22)%22;
  const yr=((ty.within%22)+22)%22;

  const tarotLine=
    settings.lang==="sv"
      ?`${t.tarot}: ${ATU()[yr]} i ${ATU()[doc]}`
      :`${t.tarot}: ${ATU()[yr]} in ${ATU()[doc]}`;

  elMain.innerHTML=`
    <div class="mainLine">☉ ${t.sun} in ${sunFmt.deg}° ${sunFmt.sign}</div>
    <div class="mainLine">☾ ${t.moon} in ${moonFmt.deg}° ${moonFmt.sign}</div>

    <div class="annoLine">${t.anno} ${roman(ty.docosade)}:${roman(ty.within,false)}</div>
    <div class="tarotLine">${tarotLine}</div>

    <div class="veLine">${fmtDate(now)} ${t.ev}</div>

    <div class="moonLine">${phase.icon} ${t.moon}: ${phase.name} (${phase.illumPct}%)</div>
    <div class="moonSub">${t.moonAge}: ${phase.moonAgeDays} ${t.dayUnit}</div>
  `;

  const r=reshTimes(now);
  const next=nextReshEvent(now,r);

  elResh.innerHTML=`
    <div class="reshItem ${next.k==="dawn"?"next":""}">
      <div class="reshLeft"><div>🌅</div><div>${t.dawn}</div></div>
      <div>${fmtTime(r.sunrise)}</div>
    </div>
    <div class="reshItem ${next.k==="noon"?"next":""}">
      <div class="reshLeft"><div>☀️</div><div>${t.noon}</div></div>
      <div>${fmtTime(r.noon)}</div>
    </div>
    <div class="reshItem ${next.k==="sunset"?"next":""}">
      <div class="reshLeft"><div>🌇</div><div>${t.sunset}</div></div>
      <div>${fmtTime(r.sunset)}</div>
    </div>
    <div class="reshItem ${next.k==="midnight"?"next":""}">
      <div class="reshLeft"><div>🌌</div><div>${t.midnight}</div></div>
      <div>${fmtTime(r.midnight)}</div>
    </div>
  `;

  const until=next.t-now;
  elCountdown.textContent=t.nextResh(next.i,next.l,"",msToHMS(until));

  const nextEq=roundToNearest2Hours(nextVernalEquinoxUTC(now));
  elFooter.innerHTML=`${t.equinoxNext(fmtDateTime(nextEq))}`;
}

update();
setInterval(update,1000);
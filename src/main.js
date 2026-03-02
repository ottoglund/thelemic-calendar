import "./style.css";
import * as Astronomy from "astronomy-engine";

const APP_VERSION = "v1.0.4";

/* =========================
   I18N
   ========================= */

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

const weekdayLatin = [
  "Dies Solis","Dies Lunae","Dies Martis","Dies Mercurii",
  "Dies Jovis","Dies Veneris","Dies Saturnii"
];

const signLatinGen = [
  "Arietis","Tauri","Geminorum","Cancri","Leonis","Virginis",
  "Librae","Scorpii","Sagittarii","Capricorni","Aquarii","Piscium"
];

/* =========================
   Utilities
   ========================= */

function mod360(x){ const m = x % 360; return m < 0 ? m + 360 : m; }
function pad2(n){ return String(n).padStart(2,"0"); }
function isValidDate(d){ return d instanceof Date && !isNaN(d.getTime()); }

function formatLonAsSign(lonDeg){
  const lon = mod360(lonDeg);
  const sign = Math.floor(lon/30);
  const deg = lon - sign*30;
  return { deg, sign: signLatinGen[sign] };
}

function formatTimeLocal(d){
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateLongLocal(date, lang){
  return date.toLocaleDateString(
    lang==="sv"?"sv-SE":"en-GB",
    { day:"2-digit", month:"long", year:"numeric" }
  );
}

function formatCountdown(ms){
  ms = Math.max(0,ms);
  const total = Math.floor(ms/1000);
  const hh = Math.floor(total/3600);
  const mm = Math.floor((total%3600)/60);
  const ss = total%60;
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
}

function roman(n, upper=true){
  if(n===0) return "0";
  const map=[
    [1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],
    [100,"C"],[90,"XC"],[50,"L"],[40,"XL"],
    [10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]
  ];
  let x=n,out="";
  for(const [v,s] of map) while(x>=v){ out+=s; x-=v; }
  return upper?out:out.toLowerCase();
}

/* =========================
   Thelemic Year
   ========================= */

function vernalEquinoxUTC(year){
  let a=new Date(Date.UTC(year,2,19));
  let b=new Date(Date.UTC(year,2,22));
  const f=d=>Astronomy.SunPosition(d).elon;
  for(let i=0;i<60;i++){
    const mid=new Date((a.getTime()+b.getTime())/2);
    if(f(mid)%360<0.0001) return mid;
    if(f(a)*f(mid)<=0) b=mid; else a=mid;
  }
  return a;
}

function thelemicYearFor(now){
  const y=now.getUTCFullYear();
  const eqThis=vernalEquinoxUTC(y);
  const startYear= now>=eqThis ? y : y-1;
  const offset=startYear-1904;
  return {
    docosade:Math.floor(offset/22),
    within:((offset%22)+22)%22
  };
}

/* =========================
   Tarot
   ========================= */

const TRUMPS=[
 "Narren","Magikern","Översteprästinnan","Kejsarinnan",
 "Kejsaren","Hierofanten","De älskande","Vagnen",
 "Justering","Eremiten","Lyckohjulet","Lustan",
 "Den Hängde","Döden","Konsten","Djävulen",
 "Tornet","Stjärnan","Månen","Solen","Aeonen","Universum"
];

function svInForm(name){
  if (name === "Lust") return "Lustan";
  return name;
}

function tarotFor(d,w){
  return `${svInForm(TRUMPS[w])} i ${TRUMPS[d]}`;
}

/* =========================
   Resh
   ========================= */

function midpoint(a,b){
  return new Date((a.getTime()+b.getTime())/2);
}

function reshTimes(lat,lon,now){
  const observer=new Astronomy.Observer(lat,lon,0);
  const sunrise=Astronomy.SearchRiseSet(Astronomy.Body.Sun,observer,+1,now,1)?.date;
  const sunset=Astronomy.SearchRiseSet(Astronomy.Body.Sun,observer,-1,now,1)?.date;
  const noon=isValidDate(sunrise)&&isValidDate(sunset)? midpoint(sunrise,sunset):null;
  const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,0);
  return {sunrise,noon,sunset,midnight};
}

/* =========================
   Main
   ========================= */

function computeAndRender(){
  const now=new Date();
  const t=I18N.sv;

  const sun= Astronomy.SunPosition(now);
  const moon=Astronomy.EclipticGeoMoon(now);

  const sunFmt=formatLonAsSign(sun.elon);
  const moonFmt=formatLonAsSign(moon.lon);

  const ty=thelemicYearFor(now);
  const anno=`${t.annoLegis} ${roman(ty.docosade)}:${roman(ty.within,false)}`;
  const tarot=`${t.tarot}: ${tarotFor(ty.docosade,ty.within)}`;

  const resh=reshTimes(59.3293,18.0686,now);

  const candidates=[
    {label:t.sunrise,icon:"🌅",when:resh.sunrise},
    {label:t.noon,icon:"☀️",when:resh.noon},
    {label:t.sunset,icon:"🌇",when:resh.sunset},
    {label:t.midnight,icon:"🌌",when:resh.midnight}
  ].filter(x=>isValidDate(x.when));

  let next=null;
  for(const c of candidates){
    if(c.when>now && (!next||c.when<next.when)) next=c;
  }

  document.getElementById("mainPanel").innerHTML=`
    <div>☉ in ${sunFmt.deg.toFixed(1)}° ${sunFmt.sign}</div>
    <div>☾ in ${moonFmt.deg.toFixed(1)}° ${moonFmt.sign}</div>
    <div class="anno">${anno}</div>
    <div class="tarot">${tarot}</div>
    <div class="ve">${formatDateLongLocal(now,"sv")} ${t.era}</div>
  `;

  document.getElementById("countdown").textContent=
    next?`${t.nextResh}: ${next.icon} ${next.label} ${t.inWord} ${formatCountdown(next.when-now)}`:"";

  document.getElementById("footerPanel").textContent=
    `${t.equinoxNext} • ${APP_VERSION}`;
}

computeAndRender();
setInterval(computeAndRender,1000);
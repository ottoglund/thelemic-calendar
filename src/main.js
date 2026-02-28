import * as Astronomy from "astronomy-engine";

/* =========================
   I18N
========================= */

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
    equinoxNext: "Nästa vårdagjämning ~±2h (lokal tid)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Lokal plats",
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
    equinoxNext: "Next Vernal Equinox ~±2h (local time)",
    tarot: "Tarot",
    placeStockholm: "Stockholm",
    placeLocal: "Local",
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
  "Dies Solis",
  "Dies Lunae",
  "Dies Martis",
  "Dies Mercurii",
  "Dies Jovis",
  "Dies Veneris",
  "Dies Saturnii",
];

const signLatinGen = [
  "Arietis","Tauri","Geminorum","Cancri","Leonis","Virginis",
  "Librae","Scorpii","Sagittarii","Capricorni","Aquarii","Piscium"
];

/* =========================
   Utilities
========================= */

function mod360(x){ const m=x%360; return m<0?m+360:m; }
function pad2(n){ return String(n).padStart(2,"0"); }
function isValidDate(d){ return d instanceof Date && !isNaN(d); }

function formatTimeLocal(date){
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function formatLonAsSign(lonDeg){
  const lon = mod360(lonDeg);
  const sign = Math.floor(lon/30);
  const deg = lon - sign*30;
  return { deg, sign: signLatinGen[sign] };
}

function midpointDate(a,b){
  if(!isValidDate(a)||!isValidDate(b)) return null;
  return new Date((a.getTime()+b.getTime())/2);
}

function toDate(x){
  if(!x) return null;
  if(x instanceof Date) return x;
  if(x.date instanceof Date) return x.date;
  if(typeof x.ToDate==="function") return x.ToDate();
  return null;
}

/* =========================
   Thelemic Year
========================= */

function vernalEquinoxUTC(year){
  let a=new Date(Date.UTC(year,2,19));
  let b=new Date(Date.UTC(year,2,22));
  const f=(d)=>Astronomy.SunPosition(d).elon;

  for(let i=0;i<60;i++){
    const mid=new Date((a.getTime()+b.getTime())/2);
    if(f(mid)%360<180) a=mid; else b=mid;
  }
  return new Date((a.getTime()+b.getTime())/2);
}

function thelemicYearFor(now){
  const y=now.getUTCFullYear();
  const eqThis=vernalEquinoxUTC(y);
  const startYear= now>=eqThis?y:y-1;
  const offset=startYear-1904;
  const docosade=Math.floor(offset/22);
  const within=((offset%22)+22)%22;
  return {docosade,within};
}

function roman(n,upper=true){
  const map=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],
  [100,"C"],[90,"XC"],[50,"L"],[40,"XL"],
  [10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let x=n,out="";
  for(const [v,s] of map) while(x>=v){out+=s;x-=v;}
  return upper?out:out.toLowerCase();
}

/* =========================
   Moon phase
========================= */

function moonPhaseInfo(date){
  const elong=Astronomy.MoonPhase(date);
  const phaseAngle=mod360(elong);
  const frac=(1-Math.cos(phaseAngle*Math.PI/180))/2;
  const age=(phaseAngle/360)*29.53059;

  let key="new";
  if(phaseAngle<67.5) key="waxingCrescent";
  if(phaseAngle>=67.5&&phaseAngle<112.5) key="firstQuarter";
  if(phaseAngle>=112.5&&phaseAngle<157.5) key="waxingGibbous";
  if(phaseAngle>=157.5&&phaseAngle<202.5) key="full";
  if(phaseAngle>=202.5&&phaseAngle<247.5) key="waningGibbous";
  if(phaseAngle>=247.5&&phaseAngle<292.5) key="lastQuarter";
  if(phaseAngle>=292.5&&phaseAngle<337.5) key="waningCrescent";

  return {frac,age,key};
}

/* =========================
   Resh Times (FIXED NOON)
========================= */

function reshTimesFor(lat,lon){
  const observer=new Astronomy.Observer(lat,lon,0);
  const now=new Date();

  const y=now.getFullYear();
  const m=now.getMonth();
  const d=now.getDate();

  const anchor=new Date(y,m,d,12,0,0);

  const sunrise=toDate(Astronomy.SearchRiseSet(Astronomy.Body.Sun,observer,+1,anchor,1));
  const sunset =toDate(Astronomy.SearchRiseSet(Astronomy.Body.Sun,observer,-1,anchor,1));

  // NOON = midpoint same calendar day
  let noon=midpointDate(sunrise,sunset);

  if(!isValidDate(noon)){
    const tr=Astronomy.SearchTransit(Astronomy.Body.Sun,observer,anchor,1);
    noon=toDate(tr);
  }

  const midnight=new Date(y,m,d+1,0,0,0);

  return {sunrise,noon,sunset,midnight};
}

/* =========================
   State
========================= */

const state={
  lang:"sv",
  stockholm:{lat:59.3293,lon:18.0686}
};

/* =========================
   Render
========================= */

function setText(id,text){
  const el=document.getElementById(id);
  if(el) el.textContent=text;
}

function computeAndRender(now=new Date()){
  const t=I18N[state.lang];

  setText("title",t.title(weekdayLatin[now.getDay()]));

  const sun=Astronomy.SunPosition(now);
  const moon=Astronomy.EclipticGeoMoon(now);

  const sunFmt=formatLonAsSign(sun.elon);
  const moonFmt=formatLonAsSign(moon.lon);

  const ty=thelemicYearFor(now);
  const anno=`${t.annoLegis} ${roman(ty.docosade)}:${roman(ty.within,false)}`;

  const mp=moonPhaseInfo(now);
  const pct=Math.round(mp.frac*100);
  const moonAge=Math.round(mp.age*10)/10;

  const resh=reshTimesFor(state.stockholm.lat,state.stockholm.lon);

  document.getElementById("mainPanel").innerHTML=`
    <div>☉ ${t.sun} in ${sunFmt.deg.toFixed(1)}° ${sunFmt.sign}</div>
    <div>☾ ${t.moon} in ${moonFmt.deg.toFixed(1)}° ${moonFmt.sign}</div>
    <div>${anno}</div>
    <div>${now.toLocaleDateString("sv-SE")} ${t.era}</div>
    <div>🌕 ${t.moon}: ${t.moonPhase[mp.key]} (${pct}%)</div>
    <div>${t.moonAge}: ${moonAge} ${t.days}</div>
  `;

  const rows=[
    {label:t.sunrise, value:formatTimeLocal(resh.sunrise)},
    {label:t.noon, value:formatTimeLocal(resh.noon)},
    {label:t.sunset, value:formatTimeLocal(resh.sunset)},
    {label:t.midnight, value:formatTimeLocal(resh.midnight)}
  ];

  const grid=document.getElementById("reshGrid");
  grid.innerHTML="";
  rows.forEach(r=>{
    const div=document.createElement("div");
    div.className="reshItem";
    div.innerHTML=`<div>${r.label}</div><div>${r.value}</div>`;
    grid.appendChild(div);
  });
}

function boot(){
  computeAndRender();
  setInterval(()=>computeAndRender(),1000);
}

boot();
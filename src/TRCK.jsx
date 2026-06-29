import { useState, useEffect } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  TRCK — Francisco's personal training coach. No quiz, data baked in.
//  206→145 · sub-20 5K · 5-day split · fully editable.
// ════════════════════════════════════════════════════════════════════════════

const C = {
  bg:"#0A0A0A", surface:"#111111", surface2:"#1A1A1A", border:"#222222",
  gold:"#F5C842", emerald:"#10B981", red:"#EF4444", purple:"#8B5CF6",
  orange:"#F97316", blue:"#3B82F6", cyan:"#06B6D4", pink:"#EC4899",
  text:"#FFFFFF", muted:"#666666",
};
const FONT = `'Inter', system-ui, -apple-system, sans-serif`;

const PROFILE = {
  name:"Francisco", startWeight:206, goalWeight:145, heightIn:67, age:26,
  goal5k:"20:00", current5k:"28:00", calories:1800, protein:148,
  refeedCalories:2600, refeedDay:6, weighDays:[3,6],
};

// Fixed weekly split by day-of-week (0=Sun)
const TEMPLATE = {
  0:{type:"Rest",title:"Rest Day",effort:"Rest"},
  1:{type:"Push",title:"Push + Core",effort:"Moderate"},
  2:{type:"Easy Run",title:"Easy Run",effort:"Easy"},
  3:{type:"Pull",title:"Pull + Core",effort:"Moderate"},
  4:{type:"Intervals",title:"Speed Intervals",effort:"Hard"},
  5:{type:"Legs",title:"Easy Run + Legs",effort:"Moderate"},
  6:{type:"Long Run",title:"Long Run",effort:"Moderate"},
};

const PHASES = [
  {name:"Base", weeks:"1–10", color:"#10B981", desc:"Build aerobic engine + drop weight fastest. Mostly easy miles, lift to hold muscle."},
  {name:"Build", weeks:"11–20", color:"#F5C842", desc:"Add real speed as you get lighter. Paces drop. Strength maintains."},
  {name:"Sharpen", weeks:"21–28", color:"#F97316", desc:"Race-specific. Closing on 145 & sub-20. Peak then taper."},
];

// ── STYLES ───────────────────────────────────────────────────────────────────
const S = {
  app:{background:C.bg,minHeight:"100vh",fontFamily:FONT,color:C.text,display:"flex",flexDirection:"column"},
  nav:{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100},
  logo:{fontWeight:900,fontSize:20,letterSpacing:"0.2em",color:C.gold},
  main:{flex:1,padding:"20px 16px",maxWidth:680,margin:"0 auto",width:"100%",boxSizing:"border-box"},
  card:{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:18,marginBottom:14},
  ct:{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",marginBottom:12},
  h1:{fontSize:26,fontWeight:800,marginBottom:4},
  label:{fontSize:13,color:C.muted,marginBottom:6,display:"block"},
  input:{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,width:"100%",outline:"none",fontFamily:FONT,boxSizing:"border-box"},
  select:{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:14,width:"100%",outline:"none",fontFamily:FONT,boxSizing:"border-box",appearance:"none"},
  btnGold:{background:C.gold,color:"#000",border:"none",borderRadius:10,padding:"12px 22px",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:FONT},
  btnEmerald:{background:C.emerald,color:"#000",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:FONT},
  btnGhost:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 18px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:FONT},
  btnRed:{background:"transparent",color:C.red,border:`1px solid ${C.red}`,borderRadius:8,padding:"8px 16px",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:FONT},
  tag:(c)=>({display:"inline-block",background:c+"22",color:c,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,letterSpacing:"0.05em"}),
  grid2:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},
  grid3:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12},
  divider:{borderTop:`1px solid ${C.border}`,margin:"16px 0"},
};

// ── API + STORAGE ─────────────────────────────────────────────────────────────
async function callClaude(system, user, maxTokens=2000){
  const res = await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system,max_tokens:maxTokens,messages:[{role:"user",content:user}]})});
  const data = await res.json();
  if(data.error) throw new Error(data.error.message||JSON.stringify(data.error));
  return data.content?.[0]?.text||"";
}
function extractJSON(raw){
  let s=raw.replace(/```json|```/g,"").trim();
  const start=s.indexOf("{"); if(start>0) s=s.slice(start);
  try{return JSON.parse(s);}catch(e){}
  let inStr=false,prev="",lastGood=-1; const stack=[];
  for(let i=0;i<s.length;i++){const c=s[i];
    if(inStr){if(c==='"'&&prev!=="\\")inStr=false;prev=c;continue;}
    if(c==='"')inStr=true; else if(c==="{"||c==="[")stack.push(c==="{"?"}":"]");
    else if(c==="}"||c==="]"){stack.pop();if(stack.length===0)lastGood=i;} prev=c;}
  if(lastGood>0){try{return JSON.parse(s.slice(0,lastGood+1));}catch(e){}}
  let fix=s; if(inStr)fix+='"'; while(stack.length)fix+=stack.pop();
  return JSON.parse(fix);
}
async function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
async function load(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch{return null;}}

// ── DATES ─────────────────────────────────────────────────────────────────────
const DAY_ABBR=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function todayStr(){return iso(new Date());}
function addDays(s,n){const d=new Date(s+"T00:00:00");d.setDate(d.getDate()+n);return iso(d);}
function fmtDate(s){const d=new Date(s+"T00:00:00");return `${DAY_ABBR[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`;}
function dow(s){return new Date(s+"T00:00:00").getDay();}
function prettyToday(){const d=new Date();return `${DAY_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;}

// ── PACE ENGINE ───────────────────────────────────────────────────────────────
function paceTimeToSec(str){if(!str)return null;const p=String(str).trim().split(":").map(Number);if(p.some(isNaN))return null;return p.length===2?p[0]*60+p[1]:p.length===3?p[0]*3600+p[1]*60+p[2]:null;}
function secToPace(s){if(s==null||isNaN(s))return "—";let m=Math.floor(s/60),sec=Math.round(s%60);if(sec===60){m+=1;sec=0;}return `${m}:${String(sec).padStart(2,"0")}`;}
function computePaces(f){const sec=paceTimeToSec(f);if(!sec)return null;const rp=sec/3.10686;return{racePace5k:rp,interval:rp*0.985,threshold:rp*1.06,tempo:rp*1.08,marathon:rp*1.13,easy:rp*1.22,long:rp*1.25,recovery:rp*1.30};}
function paceZones(f){const p=computePaces(f);if(!p)return null;const r=(s,sp)=>`${secToPace(s-sp)}–${secToPace(s+sp)}/mi`;return{Recovery:r(p.recovery,8),Easy:r(p.easy,8),Long:r(p.long,8),Marathon:r(p.marathon,5),Tempo:r(p.tempo,4),Threshold:r(p.threshold,4),Interval:r(p.interval,3),"5K Race":r(p.racePace5k,3)};}

// ── WEIGHT / GOAL DATE ────────────────────────────────────────────────────────
function weeklyAverage(history){if(!history||!history.length)return null;const cutoff=addDays(todayStr(),-7);const recent=history.filter(h=>h.date>=cutoff);const use=recent.length?recent:history.slice(-3);return use.reduce((s,h)=>s+h.weight,0)/use.length;}
function projectGoalDate(history){
  if(!history||history.length<2)return null;
  const start=history[0],last=history[history.length-1];
  const daysElapsed=(new Date(last.date)-new Date(start.date))/86400000;
  if(daysElapsed<5)return {date:null,note:"Need ~1 week of data for an estimate"};
  const lost=start.weight-last.weight; const rate=lost/(daysElapsed/7);
  if(rate<=0.1)return {date:null,rate,note:"No clear loss trend yet — keep going"};
  const remaining=last.weight-PROFILE.goalWeight;
  if(remaining<=0)return {date:"Goal reached! 🎉",rate,weeksLeft:0};
  const weeksLeft=remaining/rate; const d=new Date(); d.setDate(d.getDate()+Math.round(weeksLeft*7));
  return {date:`${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,rate,weeksLeft};
}

// ── COLORS ────────────────────────────────────────────────────────────────────
function typeColor(t){if(!t)return C.muted;t=t.toLowerCase();if(t.includes("rest"))return C.muted;if(t.includes("push"))return C.blue;if(t.includes("pull"))return C.cyan;if(t.includes("leg"))return C.red;if(t.includes("core"))return C.pink;if(t.includes("interval")||t.includes("speed"))return C.orange;if(t.includes("tempo")||t.includes("threshold"))return C.gold;if(t.includes("long"))return C.purple;if(t.includes("easy")||t.includes("recovery")||t.includes("run"))return C.emerald;return C.text;}
function isRun(t){t=(t||"").toLowerCase();return t.includes("run")||t.includes("interval")||t.includes("tempo")||t.includes("long")||t.includes("recovery")||t.includes("threshold")||t.includes("speed");}

// ── PLAN BUILDER (deterministic skeleton + AI detail) ──────────────────────────
function buildSkeleton(startISO, numWeeks){
  let cur=new Date(startISO+"T00:00:00");
  while(cur.getDay()!==1) cur.setDate(cur.getDate()+1); // next Monday
  const weeks=[];
  for(let w=0;w<numWeeks;w++){
    const workouts=[];
    for(let d=0;d<7;d++){
      const date=new Date(cur); date.setDate(date.getDate()+w*7+d);
      const n=date.getDay();
      workouts.push({date:iso(date),...TEMPLATE[n],distance:0,unit:"miles",paceTarget:"N/A",hrZone:"N/A",description:"",exercises:null,warmup:null,mainSet:null,cooldown:null});
    }
    weeks.push({weekNumber:w+1,workouts});
  }
  return weeks;
}
async function fillWeekDetail(week, weekNum, totalWeeks){
  const zones=paceZones(PROFILE.current5k);
  const prompt=`You are Francisco's elite coach. Fill in workout DETAIL for week ${weekNum} of a ${totalWeeks}-week plan (206→145lbs, sub-20 5K goal, currently 28:00).

His paces right now:
${Object.entries(zones).map(([k,v])=>`- ${k}: ${v}`).join("\n")}

This week's fixed structure (DO NOT change days or types, only add detail):
${week.workouts.map(w=>`- ${DAY_ABBR[dow(w.date)]}: ${w.type} (${w.title})`).join("\n")}

Periodization: week ${weekNum}/${totalWeeks}. Early=base (easy volume), middle=build (speed), late=sharpen/taper.
Keep most running EASY. Intervals/tempo use his exact paces above. Lifts need full sets×reps×rest×tempo.

Return ONLY JSON, no markdown:
{"workouts":[{"dow":1,"distance":number,"paceTarget":"string or N/A","hrZone":"Z1-Z5 or N/A","description":"1-2 sentences","exercises":"for lifts: 'Move — 4×6, rest 2-3min | Move2 — 3×8...' with | separators; runs: null","warmup":"runs only or null","mainSet":"concrete e.g. '6 × 800m @ 8:45/mi, 90s jog' or null","cooldown":"runs only or null"}]}
Provide one entry per day (dow 0-6 matching the structure). For Rest day use zeros/nulls.`;
  const raw=await callClaude("Return only valid JSON. No markdown.",prompt,4000);
  const result=extractJSON(raw);
  // merge detail into skeleton by dow
  const byDow={}; (result.workouts||[]).forEach(d=>byDow[d.dow]=d);
  week.workouts=week.workouts.map(w=>{
    const d=byDow[dow(w.date)]; if(!d)return w;
    return {...w,distance:d.distance??w.distance,paceTarget:d.paceTarget??w.paceTarget,hrZone:d.hrZone??w.hrZone,description:d.description||w.description,exercises:d.exercises??w.exercises,warmup:d.warmup??w.warmup,mainSet:d.mainSet??w.mainSet,cooldown:d.cooldown??w.cooldown};
  });
  // compute week mileage
  week.totalMiles=Math.round(week.workouts.filter(w=>isRun(w.type)).reduce((s,w)=>s+(w.distance||0),0));
  week.phase = weekNum<=10?"Base":weekNum<=20?"Build":"Sharpen";
  return week;
}

// ════════════════════════════════════════════════════════════════════════════
//  UI COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

// ── TODAY CARD ────────────────────────────────────────────────────────────────
function TodayCard({ workout, paces, onLog, logged, onOpen }) {
  if(!workout) return <div style={S.card}><div style={S.ct}>Today</div><div style={{color:C.muted}}>No workout today.</div></div>;
  const color=typeColor(workout.type), run=isRun(workout.type), rest=workout.type==="Rest";
  return (
    <div style={{...S.card, borderColor:color+"44"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div><div style={S.ct}>Today · {fmtDate(workout.date)}</div><div style={{fontSize:22,fontWeight:800}}>{workout.title}</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
          <span style={S.tag(color)}>{workout.type}</span>
          {logged && <span style={S.tag(C.emerald)}>✓ DONE</span>}
        </div>
      </div>
      {run && !rest && (
        <div style={{...S.grid3,marginBottom:14}}>
          <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>DISTANCE</div><div style={{fontWeight:800,fontSize:18,color:C.gold}}>{workout.distance||"—"}</div><div style={{color:C.muted,fontSize:11}}>{workout.unit}</div></div>
          <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>PACE</div><div style={{fontWeight:700,fontSize:12}}>{workout.paceTarget}</div></div>
          <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>ZONE</div><div style={{fontWeight:800,fontSize:18,color}}>{workout.hrZone}</div></div>
        </div>
      )}
      {!run && !rest && workout.exercises && (
        <div style={{background:C.surface2,borderRadius:8,padding:14,marginBottom:14}}>
          <div style={{color,fontSize:11,fontWeight:700,marginBottom:6}}>THE SESSION</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {workout.exercises.split("|").map((e,i)=><div key={i} style={{fontSize:13,lineHeight:1.4}}>• {e.trim()}</div>)}
          </div>
        </div>
      )}
      {workout.mainSet && <div style={{background:C.gold+"11",border:`1px solid ${C.gold}33`,borderRadius:8,padding:12,marginBottom:12,fontSize:13}}><b style={{color:C.gold}}>Main Set:</b> {workout.mainSet}</div>}
      {workout.description && <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:14}}>{workout.description}</div>}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {!rest && !logged && <button style={S.btnEmerald} onClick={()=>onLog(workout)}>Log Workout</button>}
        <button style={{...S.btnGhost,fontSize:12}} onClick={()=>onOpen(workout)}>View / Edit</button>
      </div>
    </div>
  );
}

// ── FUEL CARD ─────────────────────────────────────────────────────────────────
function FuelCard({ isRefeed }) {
  const cals=isRefeed?PROFILE.refeedCalories:PROFILE.calories;
  const carbs=isRefeed?Math.round((cals-PROFILE.protein*4-50*9)/4):Math.round((cals-PROFILE.protein*4-50*9)/4);
  return (
    <div style={S.card}>
      <div style={S.ct}>Today's Fuel {isRefeed && <span style={{color:C.emerald}}>· 🍚 REFEED</span>}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:80,background:C.surface2,borderRadius:8,padding:12}}><div style={{color:C.gold,fontWeight:800,fontSize:20}}>{cals.toLocaleString()}</div><div style={{color:C.muted,fontSize:11}}>calories</div></div>
        <div style={{flex:1,minWidth:80,background:C.surface2,borderRadius:8,padding:12}}><div style={{color:C.emerald,fontWeight:800,fontSize:20}}>{PROFILE.protein}g</div><div style={{color:C.muted,fontSize:11}}>protein</div></div>
        <div style={{flex:1,minWidth:80,background:C.surface2,borderRadius:8,padding:12}}><div style={{fontWeight:800,fontSize:20}}>~{Math.max(carbs,0)}g</div><div style={{color:C.muted,fontSize:11}}>carbs</div></div>
        <div style={{flex:1,minWidth:80,background:C.surface2,borderRadius:8,padding:12}}><div style={{fontWeight:800,fontSize:20}}>~50g</div><div style={{color:C.muted,fontSize:11}}>fat</div></div>
      </div>
      {isRefeed && <div style={{color:C.muted,fontSize:11,marginTop:10,lineHeight:1.5}}>Carbs up, protein steady, fat low. Fuels your long run + legs, protects testosterone & leptin. Clean carbs — not a cheat day.</div>}
    </div>
  );
}

// ── WEIGH-IN / GOAL DATE ──────────────────────────────────────────────────────
function GoalDateCard({ history }) {
  const proj=projectGoalDate(history);
  const avg=weeklyAverage(history);
  const start=PROFILE.startWeight, goal=PROFILE.goalWeight;
  const cur=history&&history.length?history[history.length-1].weight:start;
  const pct=Math.min(Math.max((start-cur)/(start-goal),0),1);
  return (
    <div style={{...S.card,borderColor:C.emerald+"44"}}>
      <div style={S.ct}>On Track To Goal</div>
      {proj&&proj.date&&proj.weeksLeft!==0 ? (
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontSize:26,fontWeight:800,color:C.emerald}}>{proj.date}</div><div style={{color:C.muted,fontSize:12}}>Est. 145 lbs · from your real trend</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:16}}>~{Math.round(proj.weeksLeft)} wks</div><div style={{color:C.muted,fontSize:11}}>{proj.rate.toFixed(1)} lb/wk</div></div>
        </div>
      ) : (
        <div style={{color:C.muted,fontSize:14,marginBottom:8}}>{proj?.note || "Log your weight on Wed & Sat to see your estimated goal date."}</div>
      )}
      <div style={{background:C.surface2,borderRadius:6,height:8,overflow:"hidden",marginBottom:8}}><div style={{background:C.emerald,height:"100%",width:`${pct*100}%`}}/></div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
        <span style={{color:C.muted}}>{start} start</span>
        {avg && <span style={{color:C.gold,fontWeight:700}}>{avg.toFixed(1)} avg now</span>}
        <span style={{color:C.muted}}>{goal} goal</span>
      </div>
    </div>
  );
}

function WeighInCard({ history, onLog }) {
  const [val,setVal]=useState("");
  const today=todayStr(), isWeighDay=PROFILE.weighDays.includes(new Date().getDay());
  const loggedToday=history?.some(h=>h.date===today);
  return (
    <div style={S.card}>
      <div style={S.ct}>Weigh-In {isWeighDay && <span style={{color:C.gold}}>· today is a weigh day ⚖️</span>}</div>
      {loggedToday ? (
        <div style={{color:C.emerald,fontSize:14,marginBottom:10}}>✓ Logged today: {history[history.length-1].weight} lbs</div>
      ) : (
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <input style={{...S.input,flex:1}} type="number" step="0.1" placeholder="Weight (lbs)" value={val} onChange={e=>setVal(e.target.value)} />
          <button style={S.btnEmerald} onClick={()=>{if(val){onLog(parseFloat(val));setVal("");}}}>Log</button>
        </div>
      )}
      <div style={{color:C.muted,fontSize:11,lineHeight:1.5}}>Weigh first thing — after bathroom, before eating. Days: <b>Wed + Sat</b>. We track the weekly average, not daily bounces.</div>
    </div>
  );
}

// ── ARC OVERVIEW ──────────────────────────────────────────────────────────────
function ArcOverview({ plan, currentWeekNum }) {
  return (
    <div style={S.card}>
      <div style={S.ct}>The Arc · {plan.totalWeeks}-Week Journey</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {PHASES.map(p=>{
          const active=(p.name==="Base"&&currentWeekNum<=10)||(p.name==="Build"&&currentWeekNum>10&&currentWeekNum<=20)||(p.name==="Sharpen"&&currentWeekNum>20);
          return (
            <div key={p.name} style={{flex:1,minWidth:110,background:active?p.color+"18":C.surface2,border:`1px solid ${active?p.color:C.border}`,borderRadius:10,padding:12}}>
              <div style={{fontWeight:800,fontSize:14,color:active?p.color:C.text}}>{p.name}{active?" ●":""}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:2}}>Weeks {p.weeks}</div>
              <div style={{fontSize:11,marginTop:6,lineHeight:1.4,color:C.muted}}>{p.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{color:C.muted,fontSize:11,marginTop:12,lineHeight:1.5}}>You see the whole map. Detailed weeks build out as you go — shaped by your real progress, not a guess from day one.</div>
    </div>
  );
}

// ── WEEK CALENDAR (with rearrange) ────────────────────────────────────────────
function WeekCalendar({ plan, logs, weekIdx, setWeekIdx, onSelect, onSwap, onExtend, extending }) {
  const [rearrange,setRearrange]=useState(false);
  const [picked,setPicked]=useState(null);
  const week=plan.weeks[weekIdx];
  const needsMore=weekIdx===plan.weeks.length-1 && plan.weeks.length<plan.totalWeeks;
  if(!week) return (
    <div style={S.card}><div style={{textAlign:"center",padding:20}}>
      <div style={{color:C.muted,marginBottom:14}}>Week {weekIdx+1} isn't built yet.</div>
      <button style={S.btnGold} onClick={onExtend} disabled={extending}>{extending?"Coach is building…":"Build Next Weeks →"}</button>
    </div></div>
  );
  function tap(i){
    if(!rearrange){onSelect(week.workouts[i]);return;}
    if(picked===null){setPicked(i);return;}
    if(picked===i){setPicked(null);return;}
    onSwap(weekIdx,picked,i); setPicked(null);
  }
  return (
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={S.ct}>Week {week.weekNumber} of {plan.totalWeeks} · {week.phase||"Base"}</div>
          <div style={{color:C.muted,fontSize:12}}>{week.totalMiles||0} mi running this week</div>
        </div>
        {!rearrange && <div style={{display:"flex",gap:8}}>
          <button style={{...S.btnGhost,padding:"6px 12px"}} onClick={()=>setWeekIdx(w=>Math.max(0,w-1))} disabled={weekIdx===0}>‹</button>
          <button style={{...S.btnGhost,padding:"6px 12px"}} onClick={()=>setWeekIdx(w=>Math.min(plan.totalWeeks-1,w+1))} disabled={weekIdx===plan.totalWeeks-1}>›</button>
        </div>}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        {rearrange ? <div style={{color:picked===null?C.gold:C.emerald,fontSize:12,fontWeight:600}}>{picked===null?"Tap a workout to move":"Now tap where it goes"}</div>
          : <div style={{color:C.muted,fontSize:11}}>Tap a day for detail</div>}
        <button style={{...(rearrange?S.btnEmerald:S.btnGhost),padding:"6px 14px",fontSize:12}} onClick={()=>{setRearrange(r=>!r);setPicked(null);}}>{rearrange?"Done":"⇅ Rearrange"}</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {week.workouts.map((w,i)=>{
          const isToday=w.date===todayStr(), done=logs.some(l=>l.date===w.date), color=typeColor(w.type);
          const picked_=picked===i, target=rearrange&&picked!==null&&picked!==i;
          const weigh=PROFILE.weighDays.includes(dow(w.date)), refeed=dow(w.date)===PROFILE.refeedDay;
          return (
            <button key={i} onClick={()=>tap(i)} style={{background:picked_?C.gold+"33":isToday?color+"18":C.surface2,border:`1px solid ${picked_?C.gold:target?C.emerald+"66":isToday?color:done?C.emerald+"44":C.border}`,borderStyle:target?"dashed":"solid",borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",fontFamily:FONT}}>
              {rearrange && <span style={{color:picked_?C.gold:C.muted,fontSize:16}}>⇅</span>}
              <div style={{width:38,color:isToday?color:C.muted,fontSize:12,fontWeight:700,flexShrink:0}}>{DAY_ABBR[dow(w.date)].toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{color:C.text,fontWeight:600,fontSize:13}}>{w.title}</div>
                <div style={{color:C.muted,fontSize:11}}>{isRun(w.type)&&w.type!=="Rest"?`${w.distance||"?"} mi · ${w.paceTarget}`:w.type==="Rest"?"Rest Day":w.type}</div>
              </div>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {weigh && !rearrange && <span title="weigh-in" style={{fontSize:12}}>⚖️</span>}
                {refeed && !rearrange && <span title="refeed" style={{fontSize:12}}>🍚</span>}
                {done && !rearrange && <span style={{color:C.emerald,fontSize:14}}>✓</span>}
                <span style={S.tag(color)}>{w.effort}</span>
              </div>
            </button>
          );
        })}
      </div>
      {rearrange && <div style={{color:C.muted,fontSize:11,marginTop:10,lineHeight:1.5}}>Swaps the two sessions so the week stays in order. Heads up: avoid stacking two hard days back-to-back.</div>}
      {!rearrange && needsMore && <button style={{...S.btnGold,marginTop:14,width:"100%"}} onClick={onExtend} disabled={extending}>{extending?"Coach is building next block…":"Build Next 2 Weeks →"}</button>}
    </div>
  );
}

// ── PACES SCREEN ──────────────────────────────────────────────────────────────
function PacesScreen({ customPaces, onSave }) {
  const auto=paceZones(PROFILE.current5k);
  const live=customPaces||auto;
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(live);
  const info={Recovery:"Super easy. Flush legs.",Easy:"Conversational. Most miles.",Long:"Steady aerobic base.",Marathon:"Sustained effort.",Tempo:"Comfortably hard.",Threshold:"Hard but repeatable.",Interval:"VO2max. Short reps.","5K Race":"Goal race pace."};
  return (
    <div style={S.card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={S.ct}>Training Paces · @ {PROFILE.current5k} 5K</div>
        <button style={{...(editing?S.btnEmerald:S.btnGhost),padding:"6px 14px",fontSize:12}} onClick={()=>{if(editing)onSave(draft);else setDraft(live);setEditing(e=>!e);}}>{editing?"Save":"Edit"}</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {Object.entries(live).map(([z,v])=>(
          <div key={z} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:C.surface2,borderRadius:8}}>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{z}</div><div style={{color:C.muted,fontSize:11}}>{info[z]}</div></div>
            {editing?<input style={{...S.input,width:140,padding:"6px 10px",fontSize:13}} value={draft[z]||""} onChange={e=>setDraft(d=>({...d,[z]:e.target.value}))}/>:<div style={{fontWeight:700,color:C.gold,fontSize:14}}>{v}</div>}
          </div>
        ))}
      </div>
      <div style={{color:C.muted,fontSize:11,marginTop:12,lineHeight:1.5}}>Goal: sub-20 5K ({secToPace(computePaces(PROFILE.goal5k).racePace5k)}/mi). These tighten toward it as you lean out — every pound makes you faster.</div>
      {customPaces && <button style={{...S.btnGhost,marginTop:10,fontSize:12}} onClick={()=>onSave(null)}>Reset to auto</button>}
    </div>
  );
}

// ── PROGRESS PHOTOS ───────────────────────────────────────────────────────────
function PhotosCard({ lastPhoto, onMark }) {
  const next=lastPhoto?addDays(lastPhoto,30):todayStr();
  const due=todayStr()>=next;
  return (
    <div style={S.card}>
      <div style={S.ct}>Progress Photos</div>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:28}}>📸</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:14}}>{due?"Due now — take today's photos":`Next: ${fmtDate(next)}`}</div>
          <div style={{color:C.muted,fontSize:11,marginTop:2}}>Your goal's visual. Scale lies, photos don't. Same lighting & time, front/side/back.</div>
        </div>
        <button style={{...(due?S.btnGold:S.btnGhost),padding:"8px 14px",fontSize:12}} onClick={()=>onMark(todayStr())}>{due?"Mark Done":"Done early"}</button>
      </div>
    </div>
  );
}

// ── SUNDAY CHECK-IN ───────────────────────────────────────────────────────────
function CheckInCard({ plan, logs, weightHistory }) {
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(false);
  async function run(){
    setLoading(true);
    // gather last 7 days facts
    const weekAgo=addDays(todayStr(),-7);
    const recentLogs=logs.filter(l=>l.date>=weekAgo);
    const recentRuns=recentLogs.filter(l=>isRun(l.workoutType));
    const avgFelt=recentLogs.length?(recentLogs.reduce((s,l)=>s+(l.felt||3),0)/recentLogs.length).toFixed(1):"n/a";
    const wRecent=weightHistory.filter(h=>h.date>=weekAgo);
    const wLost=wRecent.length>=2?(wRecent[0].weight-wRecent[wRecent.length-1].weight).toFixed(1):"n/a";
    const planned=plan.weeks.flatMap(w=>w.workouts).filter(w=>w.date>=weekAgo&&w.date<=todayStr()&&w.type!=="Rest").length;
    const prompt=`You are Francisco's honest, direct running+strength coach. Give a Sunday check-in. Be real, call out problems, no empty praise. Under 110 words.

THIS WEEK:
- Weight change: ${wLost} lbs (target ~2/wk; too fast=muscle risk, too slow=deficit slipping)
- Workouts logged: ${recentLogs.length} of ${planned} planned (${recentRuns.length} runs)
- Avg how-it-felt: ${avgFelt}/5
- Goal: 206→145, sub-20 5K

Flag honestly: weight trend on track or not, missed sessions, anything concerning. End with one specific focus for next week. Talk directly to him.`;
    try{ setReport(await callClaude("You are a direct, honest coach. No empty praise.",prompt,500)); }
    catch(e){ setReport("Couldn't generate check-in right now. Try again in a sec."); }
    setLoading(false);
  }
  return (
    <div style={S.card}>
      <div style={S.ct}>Sunday Coach Check-In · honest</div>
      {report ? (
        <div style={{fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{report}</div>
      ) : (
        <div style={{color:C.muted,fontSize:13,marginBottom:12,lineHeight:1.5}}>Your weekly truth-teller. Flags junk paces, skipped lifts, losing too fast or slow. No gold stars for nothing.</div>
      )}
      <button style={{...S.btnGold,marginTop:12}} onClick={run} disabled={loading}>{loading?"Coach is reviewing…":report?"Refresh Check-In":"Run This Week's Check-In"}</button>
    </div>
  );
}

// ── LOG MODAL ─────────────────────────────────────────────────────────────────
function LogModal({ workout, onSave, onClose }) {
  const run=isRun(workout?.type);
  const [f,setF]=useState({distance:workout?.distance||"",time:"",notes:"",felt:"3"});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <div style={{position:"fixed",inset:0,background:"#000000CC",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24,width:"100%",maxWidth:420}}>
        <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Log Workout</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:20}}>{workout?.title}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {run&&<div style={S.grid2}>
            <div><label style={S.label}>Distance (mi)</label><input style={S.input} type="number" step="0.1" value={f.distance} onChange={e=>set("distance",e.target.value)}/></div>
            <div><label style={S.label}>Time (mm:ss)</label><input style={S.input} placeholder="28:30" value={f.time} onChange={e=>set("time",e.target.value)}/></div>
          </div>}
          <div><label style={S.label}>How did it feel? ({["😴","😓","😐","😊","🔥"][parseInt(f.felt)-1]})</label><input type="range" min="1" max="5" value={f.felt} onChange={e=>set("felt",e.target.value)} style={{width:"100%",accentColor:C.gold}}/></div>
          <div><label style={S.label}>Notes</label><textarea style={{...S.input,minHeight:70,resize:"vertical"}} value={f.notes} onChange={e=>set("notes",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={S.btnGhost} onClick={onClose}>Cancel</button>
          <button style={{...S.btnEmerald,flex:1}} onClick={()=>{onSave({date:workout.date,workoutTitle:workout.title,workoutType:workout.type,distance:run?(parseFloat(f.distance)||0):0,time:f.time,notes:f.notes,felt:parseInt(f.felt),loggedAt:Date.now()});onClose();}}>Save ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── WORKOUT DETAIL + EDIT MODAL ───────────────────────────────────────────────
function WorkoutModal({ workout, onClose, onLog, onSaveEdit, logged }) {
  const [editing,setEditing]=useState(false);
  const [f,setF]=useState({...workout});
  const run=isRun(workout?.type), color=typeColor(workout?.type);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  if(!workout) return null;
  const exList=workout.exercises?workout.exercises.split("|").map(s=>s.trim()).filter(Boolean):[];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000DD",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={onClose}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:22,width:"100%",maxWidth:460,maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        {!editing ? (
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div><div style={{color:C.muted,fontSize:12,marginBottom:4}}>{fmtDate(workout.date)}</div><div style={{fontWeight:800,fontSize:18}}>{workout.title}</div></div>
              <span style={S.tag(color)}>{workout.type}</span>
            </div>
            {run&&workout.type!=="Rest"&&<div style={S.grid3}>
              <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>DISTANCE</div><div style={{fontWeight:800,fontSize:18,color:C.gold}}>{workout.distance||"—"}</div><div style={{color:C.muted,fontSize:11}}>{workout.unit}</div></div>
              <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>PACE</div><div style={{fontWeight:600,fontSize:12}}>{workout.paceTarget}</div></div>
              <div style={{background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{color:C.muted,fontSize:10,fontWeight:700}}>ZONE</div><div style={{fontWeight:800,fontSize:18,color}}>{workout.hrZone}</div></div>
            </div>}
            {!run&&exList.length>0&&<div style={{marginTop:12}}>
              <div style={{color,fontSize:11,fontWeight:700,marginBottom:8}}>THE SESSION</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {exList.map((ex,i)=><div key={i} style={{display:"flex",gap:10,alignItems:"center",background:C.surface2,borderRadius:8,padding:"10px 12px"}}><div style={{width:22,height:22,borderRadius:6,background:color+"22",color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>{i+1}</div><div style={{fontSize:13,lineHeight:1.4}}>{ex}</div></div>)}
              </div>
            </div>}
            {run&&workout.warmup&&<div style={{marginTop:12,fontSize:12}}><b style={{color:C.muted}}>WARM-UP</b> · {workout.warmup}</div>}
            {workout.mainSet&&<div style={{marginTop:10,background:C.gold+"11",border:`1px solid ${C.gold}33`,borderRadius:8,padding:12,fontSize:13}}><b style={{color:C.gold}}>Main Set:</b> {workout.mainSet}</div>}
            {run&&workout.cooldown&&<div style={{marginTop:10,fontSize:12}}><b style={{color:C.muted}}>COOL-DOWN</b> · {workout.cooldown}</div>}
            {workout.description&&<div style={{marginTop:14,fontSize:13,color:C.muted,lineHeight:1.7}}>{workout.description}</div>}
            <div style={{display:"flex",gap:10,marginTop:18,flexWrap:"wrap"}}>
              <button style={S.btnGhost} onClick={onClose}>Close</button>
              <button style={{...S.btnGhost,borderColor:C.gold+"66",color:C.gold}} onClick={()=>{setF({...workout});setEditing(true);}}>✎ Edit</button>
              {!logged&&workout.type!=="Rest"&&<button style={{...S.btnEmerald,flex:1}} onClick={()=>{onLog(workout);onClose();}}>Log This</button>}
              {logged&&<span style={{...S.tag(C.emerald),padding:"10px 16px"}}>✓ Logged</span>}
            </div>
          </>
        ) : (
          <>
            <div style={{fontWeight:800,fontSize:18,marginBottom:16}}>Edit Workout</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div><label style={S.label}>Title</label><input style={S.input} value={f.title||""} onChange={e=>set("title",e.target.value)}/></div>
              <div><label style={S.label}>Type</label><select style={S.select} value={f.type} onChange={e=>set("type",e.target.value)}>{["Easy Run","Tempo","Intervals","Long Run","Recovery Run","Push","Pull","Legs","Core","Upper Body","Rest","Cross Training"].map(t=><option key={t}>{t}</option>)}</select></div>
              {isRun(f.type)&&f.type!=="Rest"&&<>
                <div style={S.grid2}>
                  <div><label style={S.label}>Distance (mi)</label><input style={S.input} type="number" step="0.1" value={f.distance||""} onChange={e=>set("distance",parseFloat(e.target.value)||0)}/></div>
                  <div><label style={S.label}>Pace</label><input style={S.input} value={f.paceTarget||""} onChange={e=>set("paceTarget",e.target.value)}/></div>
                </div>
                <div><label style={S.label}>Warm-up</label><input style={S.input} value={f.warmup||""} onChange={e=>set("warmup",e.target.value)}/></div>
                <div><label style={S.label}>Main set</label><textarea style={{...S.input,minHeight:60,resize:"vertical"}} value={f.mainSet||""} onChange={e=>set("mainSet",e.target.value)}/></div>
                <div><label style={S.label}>Cool-down</label><input style={S.input} value={f.cooldown||""} onChange={e=>set("cooldown",e.target.value)}/></div>
              </>}
              {!isRun(f.type)&&f.type!=="Rest"&&<div><label style={S.label}>Exercises (use | between movements)</label><textarea style={{...S.input,minHeight:120,resize:"vertical"}} value={f.exercises||""} onChange={e=>set("exercises",e.target.value)} placeholder="Back Squat — 4×6, rest 2-3min | RDL — 3×8"/></div>}
              <div><label style={S.label}>Description</label><textarea style={{...S.input,minHeight:50,resize:"vertical"}} value={f.description||""} onChange={e=>set("description",e.target.value)}/></div>
              <div><label style={S.label}>Effort</label><select style={S.select} value={f.effort} onChange={e=>set("effort",e.target.value)}>{["Easy","Moderate","Hard","Rest"].map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:18}}>
              <button style={S.btnGhost} onClick={()=>setEditing(false)}>Cancel</button>
              <button style={{...S.btnGold,flex:1}} onClick={()=>{onSaveEdit(f);setEditing(false);onClose();}}>Save Changes</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
function History({ logs }) {
  if(!logs.length) return <div style={S.card}><div style={S.ct}>History</div><div style={{color:C.muted,fontSize:13}}>No workouts logged yet.</div></div>;
  return (
    <div style={S.card}>
      <div style={S.ct}>Recent History</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[...logs].reverse().slice(0,12).map((l,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:C.surface2,borderRadius:8}}>
            <div><div style={{fontWeight:600,fontSize:13}}>{l.workoutTitle}</div><div style={{color:C.muted,fontSize:11}}>{fmtDate(l.date)}</div></div>
            <div style={{textAlign:"right"}}>{l.distance>0&&<div style={{color:C.gold,fontWeight:700}}>{l.distance} mi</div>}<div style={{color:C.muted,fontSize:11}}>{["😴","😓","😐","😊","🔥"][l.felt-1]}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS=[{id:"today",label:"Today"},{id:"plan",label:"Plan"},{id:"paces",label:"Paces"},{id:"progress",label:"Progress"},{id:"coach",label:"Coach"}];

// ════════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════════════════════
export default function TRCK() {
  const [plan,setPlan]=useState(null);
  const [logs,setLogs]=useState([]);
  const [weightHistory,setWeightHistory]=useState([]);
  const [customPaces,setCustomPaces]=useState(null);
  const [lastPhoto,setLastPhoto]=useState(null);
  const [tab,setTab]=useState("today");
  const [weekIdx,setWeekIdx]=useState(0);
  const [logTarget,setLogTarget]=useState(null);
  const [openWorkout,setOpenWorkout]=useState(null);
  const [booting,setBooting]=useState(true);
  const [building,setBuilding]=useState(false);
  const [extending,setExtending]=useState(false);

  useEffect(()=>{(async()=>{
    const p=await load("trck_plan"), lg=await load("trck_logs"), wh=await load("trck_weight"), cp=await load("trck_paces"), ph=await load("trck_photo");
    if(p) setPlan(p);
    setLogs(lg||[]); setWeightHistory(wh||[]); setCustomPaces(cp||null); setLastPhoto(ph||null);
    setBooting(false);
  })();},[]);

  useEffect(()=>{ if(!plan)return; const t=todayStr(); const idx=plan.weeks.findIndex(w=>w.workouts.some(wk=>wk.date>=t)); if(idx>=0)setWeekIdx(idx); },[plan]);

  async function buildInitialPlan(){
    setBuilding(true);
    try{
      const totalWeeks=28;
      let weeks=buildSkeleton(todayStr(),2); // build 2 detailed weeks
      for(let i=0;i<weeks.length;i++){ await fillWeekDetail(weeks[i],i+1,totalWeeks); }
      const newPlan={planName:"Lean & Fast — 206 → 145",totalWeeks,goal5k:PROFILE.goal5k,weeks};
      setPlan(newPlan); await save("trck_plan",newPlan);
      // seed starting weight
      const wh=[{date:todayStr(),weight:PROFILE.startWeight}];
      setWeightHistory(wh); await save("trck_weight",wh);
    }catch(e){ alert("Couldn't build plan — try again. ("+e.message+")"); }
    setBuilding(false);
  }

  async function extendPlan(){
    setExtending(true);
    try{
      const built=plan.weeks.length;
      const lastDate=plan.weeks[built-1].workouts[plan.weeks[built-1].workouts.length-1].date;
      let newWeeks=buildSkeleton(addDays(lastDate,1),2);
      for(let i=0;i<newWeeks.length;i++){ await fillWeekDetail(newWeeks[i],built+i+1,plan.totalWeeks); }
      const updated={...plan,weeks:[...plan.weeks,...newWeeks]};
      setPlan(updated); await save("trck_plan",updated);
      setWeekIdx(built);
    }catch(e){ alert("Couldn't build next weeks — try again."); }
    setExtending(false);
  }

  async function saveLog(entry){ const u=[...logs,entry]; setLogs(u); await save("trck_logs",u); }
  async function logWeight(weight){ const u=[...weightHistory,{date:todayStr(),weight}]; setWeightHistory(u); await save("trck_weight",u); }
  async function savePaces(p){ setCustomPaces(p); await save("trck_paces",p); }
  async function markPhoto(d){ setLastPhoto(d); await save("trck_photo",d); }
  async function swapWorkouts(wi,from,to){
    const updated={...plan,weeks:plan.weeks.map((w,i)=>{ if(i!==wi)return w; const ws=w.workouts.map(x=>({...x})); const a=ws[from].date,b=ws[to].date; ws[from].date=b; ws[to].date=a; ws.sort((x,y)=>x.date.localeCompare(y.date)); return {...w,workouts:ws}; })};
    setPlan(updated); await save("trck_plan",updated);
  }
  async function saveEdit(edited){
    const fixed={...plan,weeks:plan.weeks.map(w=>({...w,workouts:w.workouts.map(x=>(x.date===openWorkout.date&&x.title===openWorkout.title&&x.type===openWorkout.type)?{...x,...edited}:x)}))};
    setPlan(fixed); await save("trck_plan",fixed);
  }
  async function resetAll(){
    if(!confirm("Reset everything and rebuild your plan?"))return;
    ["trck_plan","trck_logs","trck_weight","trck_paces","trck_photo"].forEach(k=>localStorage.removeItem(k));
    setPlan(null); setLogs([]); setWeightHistory([]); setCustomPaces(null); setLastPhoto(null);
  }

  if(booting) return <div style={{...S.app,alignItems:"center",justifyContent:"center"}}><div style={{color:C.gold,fontWeight:900,fontSize:28,letterSpacing:"0.2em"}}>TRCK</div></div>;

  // First run — build the plan
  if(!plan) return (
    <div style={S.app}>
      <nav style={S.nav}><div style={S.logo}>TRCK</div></nav>
      <div style={{...S.main,maxWidth:460,paddingTop:48}}>
        <div style={{fontSize:30,fontWeight:900,marginBottom:6}}>Welcome back,<br/>Francisco.</div>
        <div style={{color:C.muted,fontSize:15,lineHeight:1.5,marginBottom:24}}>Your plan's ready to build — 206→145, sub-20 5K, your 5-day split. Paces, fuel, refeeds, weigh-ins, all dialed to you.</div>
        <div style={S.card}>
          <div style={S.ct}>Your Setup</div>
          {[["Goal","206 → 145 lbs · sub-20 5K"],["Split","4 runs + 3 lifts / week"],["Fuel","1,800 cal · 148g protein · Sat refeed"],["Weigh-ins","Wed + Sat (weekly avg)"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`,fontSize:13}}><span style={{color:C.muted}}>{k}</span><span style={{fontWeight:600,textAlign:"right"}}>{v}</span></div>
          ))}
        </div>
        <button style={{...S.btnGold,width:"100%",marginTop:8}} onClick={buildInitialPlan} disabled={building}>{building?"Coach is building your plan…":"Build My Plan →"}</button>
        {building && <div style={{color:C.muted,fontSize:12,marginTop:10,textAlign:"center"}}>Building your first 2 weeks in detail. Takes a few seconds.</div>}
      </div>
    </div>
  );

  const today=todayStr();
  const todayWorkout=plan.weeks.flatMap(w=>w.workouts).find(w=>w.date===today);
  const isRefeed=new Date().getDay()===PROFILE.refeedDay;
  const isSunday=new Date().getDay()===0;
  const curWeekNum=plan.weeks[weekIdx]?.weekNumber||1;
  const zones=customPaces||paceZones(PROFILE.current5k);
  const proj=projectGoalDate(weightHistory);

  return (
    <div style={S.app}>
      <nav style={S.nav}><div style={S.logo}>TRCK</div><div style={{color:C.muted,fontSize:13}}>{PROFILE.name}</div></nav>

      {/* goal strip */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"10px 16px"}}>
        <div style={{display:"flex",gap:20,maxWidth:680,margin:"0 auto",overflowX:"auto"}}>
          {[["Goal","Sub-20 5K"],["Weight",`${weightHistory.length?weightHistory[weightHistory.length-1].weight:206}→145`],["ETA",proj&&proj.weeksLeft?`~${Math.round(proj.weeksLeft)} wks`:"—"],["Week",`${curWeekNum}/${plan.totalWeeks}`]].map(([l,v])=>(
            <div key={l} style={{flexShrink:0}}><div style={{color:C.muted,fontSize:10,fontWeight:700,letterSpacing:"0.08em"}}>{l.toUpperCase()}</div><div style={{fontWeight:700,fontSize:14,color:C.gold}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* tabs */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 16px"}}>
        <div style={{display:"flex",gap:4,maxWidth:680,margin:"0 auto"}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?C.gold:"transparent"}`,color:tab===t.id?C.gold:C.muted,padding:"14px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>{t.label}</button>)}
        </div>
      </div>

      <div style={S.main}>
        {tab==="today"&&<>
          <div style={{marginBottom:16}}>
            <div style={{color:C.muted,fontSize:13,fontWeight:600}}>{prettyToday()}</div>
            <div style={{fontSize:22,fontWeight:800,marginTop:2}}>Sub-20 5K{proj&&proj.weeksLeft?` · ~${Math.round(proj.weeksLeft)} wks to 145`:""}</div>
          </div>
          <TodayCard workout={todayWorkout} paces={zones} onLog={setLogTarget} logged={logs.some(l=>l.date===today)} onOpen={setOpenWorkout}/>
          <FuelCard isRefeed={isRefeed}/>
          <WeighInCard history={weightHistory} onLog={logWeight}/>
          {isSunday && <CheckInCard plan={plan} logs={logs} weightHistory={weightHistory}/>}
        </>}

        {tab==="plan"&&<>
          <div style={{marginBottom:16}}><div style={S.h1}>{plan.planName}</div><div style={{color:C.muted,fontSize:14}}>{plan.totalWeeks} weeks · 4 runs + 3 lifts / week</div></div>
          <ArcOverview plan={plan} currentWeekNum={curWeekNum}/>
          <WeekCalendar plan={plan} logs={logs} weekIdx={weekIdx} setWeekIdx={setWeekIdx} onSelect={setOpenWorkout} onSwap={swapWorkouts} onExtend={extendPlan} extending={extending}/>
        </>}

        {tab==="paces"&&<>
          <PacesScreen customPaces={customPaces} onSave={savePaces}/>
        </>}

        {tab==="progress"&&<>
          <GoalDateCard history={weightHistory}/>
          <WeighInCard history={weightHistory} onLog={logWeight}/>
          <PhotosCard lastPhoto={lastPhoto} onMark={markPhoto}/>
          <History logs={logs}/>
        </>}

        {tab==="coach"&&<>
          <CheckInCard plan={plan} logs={logs} weightHistory={weightHistory}/>
          <FuelCard isRefeed={isRefeed}/>
          <div style={S.card}>
            <div style={S.ct}>Plan Info</div>
            <div style={{color:C.muted,fontSize:13,marginBottom:14,lineHeight:1.5}}>206→145 · sub-20 5K · started {weightHistory.length?fmtDate(weightHistory[0].date):"today"}. Built {plan.weeks.length} of {plan.totalWeeks} weeks.</div>
            <button style={S.btnRed} onClick={resetAll}>Reset & Rebuild Plan</button>
          </div>
        </>}
      </div>

      {logTarget && <LogModal workout={logTarget} onSave={saveLog} onClose={()=>setLogTarget(null)}/>}
      {openWorkout && <WorkoutModal workout={openWorkout} logged={logs.some(l=>l.date===openWorkout.date)} onClose={()=>setOpenWorkout(null)} onLog={setLogTarget} onSaveEdit={saveEdit}/>}
    </div>
  );
}

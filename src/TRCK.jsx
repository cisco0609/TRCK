import { useState, useEffect } from "react";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0A0A", surface: "#111111", surface2: "#1A1A1A", border: "#222222",
  gold: "#F5C842", emerald: "#10B981", red: "#EF4444", purple: "#8B5CF6",
  orange: "#F97316", text: "#FFFFFF", muted: "#666666",
};
const FONT = `'Inter', system-ui, -apple-system, sans-serif`;

// ── STYLES ─────────────────────────────────────────────────────────────────────
const S = {
  app: { background: C.bg, minHeight: "100vh", fontFamily: FONT, color: C.text, display: "flex", flexDirection: "column" },
  nav: { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 },
  logo: { fontWeight: 900, fontSize: 20, letterSpacing: "0.15em", color: C.gold },
  main: { flex: 1, padding: "24px 16px", maxWidth: 900, margin: "0 auto", width: "100%", boxSizing: "border-box" },
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase", marginBottom: 12 },
  h1: { fontSize: 26, fontWeight: 800, marginBottom: 4 },
  label: { fontSize: 13, color: C.muted, marginBottom: 6, display: "block" },
  input: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: FONT, boxSizing: "border-box" },
  select: { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, width: "100%", outline: "none", fontFamily: FONT, boxSizing: "border-box", appearance: "none" },
  btnGold: { background: C.gold, color: "#000", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: FONT, letterSpacing: "0.05em" },
  btnEmerald: { background: C.emerald, color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT },
  btnGhost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: FONT },
  btnRed: { background: "transparent", color: C.red, border: `1px solid ${C.red}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: FONT },
  tag: (color) => ({ display: "inline-block", background: color + "22", color, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }),
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  divider: { borderTop: `1px solid ${C.border}`, margin: "16px 0" },
  pill: (active) => ({ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: active ? `1px solid ${C.gold}` : `1px solid ${C.border}`, background: active ? C.gold + "22" : "transparent", color: active ? C.gold : C.muted, fontFamily: FONT }),
};

// ── API ────────────────────────────────────────────────────────────────────────
async function callClaude(system, user, maxTokens = 1000) {
  const res = await fetch("/api/claude", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, max_tokens: maxTokens, messages: [{ role: "user", content: user }] }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── STORAGE ────────────────────────────────────────────────────────────────────
async function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
async function load(key) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; } }
async function del(key) { try { localStorage.removeItem(key); } catch {} }

// ── HELPERS ────────────────────────────────────────────────────────────────────
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function fmtDate(str) { const d = new Date(str+"T00:00:00"); return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`; }

function typeColor(type) {
  if (!type) return C.muted;
  const t = type.toLowerCase();
  if (t.includes("rest")) return C.muted;
  if (t.includes("push")) return "#3B82F6";
  if (t.includes("pull")) return "#06B6D4";
  if (t.includes("leg")) return C.red;
  if (t.includes("core")) return "#EC4899";
  if (t.includes("strength") || t.includes("lift") || t.includes("upper") || t.includes("lower")) return "#3B82F6";
  if (t.includes("interval") || t.includes("speed") || t.includes("repeat")) return C.orange;
  if (t.includes("tempo") || t.includes("threshold")) return C.gold;
  if (t.includes("long")) return C.purple;
  if (t.includes("easy") || t.includes("recovery")) return C.emerald;
  if (t.includes("run")) return C.emerald;
  return C.text;
}
function isRun(type) {
  const t = (type || "").toLowerCase();
  return t.includes("run") || t.includes("interval") || t.includes("tempo") || t.includes("long") || t.includes("recovery") || t.includes("threshold") || t.includes("speed") || t.includes("repeat");
}

// ── NUTRITION MATH ─────────────────────────────────────────────────────────────
// Mifflin-St Jeor + activity, then apply deficit by diet personality
function computeNutrition({ weightLbs, goalWeightLbs, heightIn, age, sex, dietMode }) {
  const kg = weightLbs * 0.453592;
  const cm = heightIn * 2.54;
  let bmr = 10 * kg + 6.25 * cm - 5 * age + (sex === "female" ? -161 : 5);
  // Active: training + on-feet overnight job
  const tdee = Math.round(bmr * 1.55);
  const deficits = { balanced: 0.20, moderate: 0.27, aggressive: 0.35 };
  const lossRate = { balanced: "0.5-1 lb/wk", moderate: "1-1.5 lb/wk", aggressive: "~2 lb/wk" };
  const cals = Math.round(tdee * (1 - (deficits[dietMode] || 0.27)));
  // Protein anchored to GOAL weight (~1 g/lb) to protect muscle without overshooting
  const goal = goalWeightLbs || weightLbs;
  const protein = Math.round(goal * 1.0);
  const fat = Math.round((cals * 0.25) / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { tdee, cals, protein, carbs: Math.max(carbs, 0), fat, lossRate: lossRate[dietMode] || lossRate.moderate };
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", goals: [], raceDistance: "", raceDate: "", fiveKTime: "",
    weightLbs: "206", goalWeightLbs: "145", heightIn: "67", age: "26", sex: "male",
    dietMode: "aggressive",
    runDaysPerWeek: "4", liftDaysPerWeek: "3", longRunDay: "Saturday",
    experience: "intermediate", trainingNotes: "", shoes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleGoal = (g) => setForm(f => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g] }));
  const racingGoal = form.goals.some(g => g.startsWith("Race"));

  const nutritionPreview = computeNutrition({
    weightLbs: parseFloat(form.weightLbs) || 206,
    goalWeightLbs: parseFloat(form.goalWeightLbs) || 145,
    heightIn: parseFloat(form.heightIn) || 67,
    age: parseFloat(form.age) || 26,
    sex: form.sex, dietMode: form.dietMode,
  });

  const steps = [
    {
      title: "Welcome to TRCK", sub: "Your personal coach. Let's learn about you and build a real plan.",
      fields: <div><label style={S.label}>Your name</label><input style={S.input} placeholder="Francisco" value={form.name} onChange={e => set("name", e.target.value)} /></div>,
    },
    {
      title: "Your Goals", sub: "Pick everything that matters — the coach builds one plan around all of it.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { g: "Lose weight", d: "Drop body fat toward your goal weight" },
          { g: "Get fit", d: "Build overall conditioning and consistency" },
          { g: "Build endurance", d: "Go longer, raise your aerobic base" },
          { g: "Race (5K)", d: "Train to race a 5K" },
          { g: "Race (10K)", d: "Train to race a 10K" },
          { g: "Race (Half Marathon)", d: "Train to race a half" },
          { g: "Race (Marathon)", d: "Train to race a marathon" },
        ].map(({ g, d }) => {
          const on = form.goals.includes(g);
          return (
            <button key={g} style={{ ...S.btnGhost, textAlign: "left", padding: "12px 16px", borderColor: on ? C.gold : C.border, display: "flex", alignItems: "center", gap: 12 }} onClick={() => toggleGoal(g)}>
              <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: `2px solid ${on ? C.gold : C.muted}`, background: on ? C.gold : "transparent", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>{on ? "✓" : ""}</div>
              <div><div style={{ color: on ? C.gold : C.text, fontWeight: 700 }}>{g}</div><div style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{d}</div></div>
            </button>
          );
        })}
        {form.goals.filter(g => g.startsWith("Race")).length > 1 && (
          <div style={{ color: C.orange, fontSize: 12, marginTop: 2 }}>Heads up — pick one race distance to train toward. The coach peaks you for a single race.</div>
        )}
      </div>,
    },
    {
      title: racingGoal ? "Race Date" : "Goal Date",
      sub: racingGoal ? "When's your race? This sets your peak and timeline." : "When do you want to hit your goal? This sets your timeline.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={S.label}>{racingGoal ? "Race date" : "Target date"}</label><input style={S.input} type="date" value={form.raceDate} onChange={e => set("raceDate", e.target.value)} /></div>
        <div><label style={S.label}>Current 5K time (e.g. 28:00) — optional but sharpens paces</label><input style={S.input} placeholder="28:00" value={form.fiveKTime} onChange={e => set("fiveKTime", e.target.value)} /></div>
      </div>,
    },
    {
      title: "Your Body", sub: "This powers your calorie and weight-loss targets.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={S.grid2}>
          <div><label style={S.label}>Current weight (lbs)</label><input style={S.input} type="number" value={form.weightLbs} onChange={e => set("weightLbs", e.target.value)} /></div>
          <div><label style={S.label}>Goal weight (lbs)</label><input style={S.input} type="number" value={form.goalWeightLbs} onChange={e => set("goalWeightLbs", e.target.value)} /></div>
        </div>
        <div style={S.grid3}>
          <div><label style={S.label}>Height (in)</label><input style={S.input} type="number" value={form.heightIn} onChange={e => set("heightIn", e.target.value)} /></div>
          <div><label style={S.label}>Age</label><input style={S.input} type="number" value={form.age} onChange={e => set("age", e.target.value)} /></div>
          <div><label style={S.label}>Sex</label><select style={S.select} value={form.sex} onChange={e => set("sex", e.target.value)}><option value="male">Male</option><option value="female">Female</option></select></div>
        </div>
      </div>,
    },
    {
      title: "Diet Personality", sub: "How fast do you want to lose? Protein stays high either way to protect muscle.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { k: "balanced", l: "Balanced", s: "0.5–1 lb/wk · easiest to sustain" },
          { k: "moderate", l: "Moderate", s: "1–1.5 lb/wk · steady progress" },
          { k: "aggressive", l: "Aggressive", s: "~2 lb/wk · fastest safe rate" },
        ].map(({ k, l, s }) => (
          <button key={k} style={{ ...S.btnGhost, textAlign: "left", padding: "12px 16px", borderColor: form.dietMode === k ? C.gold : C.border }} onClick={() => set("dietMode", k)}>
            <div style={{ color: form.dietMode === k ? C.gold : C.text, fontWeight: 700 }}>{l}</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{s}</div>
          </button>
        ))}
        <div style={{ background: C.surface2, borderRadius: 8, padding: 14, marginTop: 4 }}>
          <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>YOUR DAILY TARGET</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div><span style={{ color: C.gold, fontWeight: 800, fontSize: 20 }}>{nutritionPreview.cals}</span><span style={{ color: C.muted, fontSize: 12 }}> cal</span></div>
            <div><span style={{ color: C.emerald, fontWeight: 800, fontSize: 20 }}>{nutritionPreview.protein}g</span><span style={{ color: C.muted, fontSize: 12 }}> protein</span></div>
            <div><span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{nutritionPreview.carbs}g</span><span style={{ color: C.muted, fontSize: 12 }}> carbs</span></div>
            <div><span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{nutritionPreview.fat}g</span><span style={{ color: C.muted, fontSize: 12 }}> fat</span></div>
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>~{nutritionPreview.lossRate} · maintenance ≈ {nutritionPreview.tdee} cal</div>
        </div>
      </div>,
    },
    {
      title: "Training Style", sub: "How do you want to train each week? The coach organizes it all freely.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={S.label}>Run days per week</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["3","4","5"].map(d => <button key={d} style={S.pill(form.runDaysPerWeek === d)} onClick={() => set("runDaysPerWeek", d)}>{d} runs</button>)}</div>
        </div>
        <div>
          <label style={S.label}>Lift days per week (push/pull/legs/core)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{["0","2","3","4"].map(d => <button key={d} style={S.pill(form.liftDaysPerWeek === d)} onClick={() => set("liftDaysPerWeek", d)}>{d === "0" ? "No lifting" : `${d} lifts`}</button>)}</div>
        </div>
        <div>
          <label style={S.label}>Protected long run day</label>
          <select style={S.select} value={form.longRunDay} onChange={e => set("longRunDay", e.target.value)}>{["Saturday","Sunday","Friday"].map(d => <option key={d}>{d}</option>)}</select>
        </div>
      </div>,
    },
    {
      title: "Anything I should know?", sub: "Constraints, injuries, your schedule — the coach plans around it.",
      fields: <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={S.label}>Experience level</label>
          <select style={S.select} value={form.experience} onChange={e => set("experience", e.target.value)}>
            <option value="beginner">Beginner — under 6 months</option>
            <option value="intermediate">Intermediate — 6–18 months</option>
            <option value="advanced">Advanced — 18+ months, raced before</option>
          </select>
        </div>
        <div><label style={S.label}>Notes for your coach (optional)</label>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} placeholder="e.g. I work overnight Sun–Thu, prefer Sunday rest, bad left knee, no gym on weekends..." value={form.trainingNotes} onChange={e => set("trainingNotes", e.target.value)} />
        </div>
        <div><label style={S.label}>Current shoe (optional)</label><input style={S.input} placeholder="Nike Pegasus 41" value={form.shoes} onChange={e => set("shoes", e.target.value)} /></div>
      </div>,
    },
  ];

  const canNext = () => {
    if (step === 0) return form.name.trim();
    if (step === 1) return form.goals.length > 0;
    if (step === 3) return form.weightLbs && form.goalWeightLbs && form.heightIn;
    return true;
  };

  async function generate() {
    setLoading(true); setError("");
    try {
      const today = todayStr();
      const weeks = form.raceDate ? Math.max(4, Math.min(40, Math.round((new Date(form.raceDate) - new Date(today)) / 86400000 / 7))) : 12;
      const nutrition = computeNutrition({ weightLbs: parseFloat(form.weightLbs), goalWeightLbs: parseFloat(form.goalWeightLbs), heightIn: parseFloat(form.heightIn), age: parseFloat(form.age), sex: form.sex, dietMode: form.dietMode });

      // Generate only first 4 weeks in detail to stay within token limits; rest generated on demand
      const buildWeeks = Math.min(weeks, 4);
      const raceGoal = form.goals.find(g => g.startsWith("Race"));
      const wantsWeightLoss = form.goals.includes("Lose weight");
      const goalsLine = form.goals.join(", ");
      const prompt = `You are an elite running + strength coach. Build the FIRST ${buildWeeks} weeks of a ${weeks}-week plan.

ATHLETE:
- Name: ${form.name}, ${form.weightLbs}lbs → goal ${form.goalWeightLbs}lbs, ${form.heightIn}in, age ${form.age}
- GOALS (all matter, balance them): ${goalsLine}${raceGoal && form.raceDate ? ` — target race ${raceGoal} on ${form.raceDate}` : ""}
- Current 5K: ${form.fiveKTime || "unknown"}, Experience: ${form.experience}
- Wants ${form.runDaysPerWeek} runs/week + ${form.liftDaysPerWeek} lift days/week (push/pull/legs/core)
- Protected long run: ${form.longRunDay}
- Daily nutrition target: ${nutrition.cals} cal, ${nutrition.protein}g protein (${form.dietMode} cut)
- Coach notes: ${form.trainingNotes || "none"}

COACHING RULES:
- Balance multiple goals by PERIODIZING, don't ignore any: ${wantsWeightLoss && raceGoal ? "athlete wants BOTH weight loss AND to race — lean into easy/aerobic volume and the cut in early weeks (fat loss + base), then in the final 2-3 weeks shift toward race-specific sharpening and protect performance (less fatigue, taper into race day)." : wantsWeightLoss ? "prioritize sustainable aerobic volume and consistency to support the fat-loss deficit; keep most runs easy/Z2 so the athlete can recover in a calorie deficit." : "build fitness progressively toward the goal."}
- Organize runs AND lifts intelligently. Never put a hard run the day after leg day. Easy runs can follow upper-body lifts. Protect the long run. Build real rest — especially important while cutting calories.
- Keep most running easy (Z2) early; reserve hard intervals/tempo for when it serves the race goal.
- Periodize: weeks progress (base → build${raceGoal ? " → peak → taper" : ""}). Week 1 starts conservative.
- Each day is exactly one of: a run, a lift session, a combo, or rest.
- Plan start date: ${today}

Return ONLY valid JSON, no markdown:
{
  "planName": "string (reflects their combined goals)",
  "totalWeeks": ${weeks},
  "weeks": [
    {
      "weekNumber": 1, "theme": "string", "totalMiles": number, "focus": "string (1 sentence)",
      "workouts": [
        { "date": "YYYY-MM-DD", "type": "Easy Run|Tempo|Intervals|Long Run|Recovery Run|Push|Pull|Legs|Core|Upper Body|Rest|Cross Training",
          "title": "string", "distance": number, "unit": "miles", "paceTarget": "string or N/A", "hrZone": "Z1|Z2|Z3|Z4|Z5|N/A",
          "description": "string 1-2 sentences", "exercises": "string (for lifts: list key movements; for runs: null)",
          "warmup": "string or null", "mainSet": "string or null", "cooldown": "string or null", "effort": "Easy|Moderate|Hard|Rest" }
      ]
    }
  ]
}`;

      const raw = await callClaude("Return only valid JSON. No markdown. No commentary.", prompt, 4000);
      const plan = JSON.parse(raw.replace(/```json|```/g, "").trim());
      plan.totalWeeks = weeks;

      const profile = { ...form, startDate: today, createdAt: Date.now(), nutrition, totalWeeks: weeks, weightHistory: [{ date: today, weight: parseFloat(form.weightLbs) }] };
      await save("trck_profile", profile);
      await save("trck_plan", plan);
      await save("trck_logs", []);
      onDone(profile, plan, []);
    } catch (e) {
      setError("Failed to generate plan. Please try again."); console.error(e);
    }
    setLoading(false);
  }

  const cur = steps[step];
  return (
    <div style={{ ...S.main, maxWidth: 480, paddingTop: 40 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>{steps.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.gold : C.border }} />)}</div>
        <div style={{ color: C.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Step {step + 1} of {steps.length}</div>
        <div style={S.h1}>{cur.title}</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>{cur.sub}</div>
        {cur.fields}
        {error && <div style={{ color: C.red, fontSize: 13, marginTop: 12 }}>{error}</div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {step > 0 && <button style={S.btnGhost} onClick={() => setStep(s => s - 1)}>Back</button>}
        {step < steps.length - 1
          ? <button style={{ ...S.btnGold, flex: 1, opacity: canNext() ? 1 : 0.4 }} onClick={() => canNext() && setStep(s => s + 1)}>Continue</button>
          : <button style={{ ...S.btnGold, flex: 1 }} onClick={generate} disabled={loading}>{loading ? "Coach is building your plan..." : "Build My Plan →"}</button>}
      </div>
    </div>
  );
}

// ── TODAY CARD ─────────────────────────────────────────────────────────────────
function TodayCard({ workout, onLog, logs, setNotFeeling, notFeeling }) {
  const [briefing, setBriefing] = useState("");
  const [loadingBrief, setLoadingBrief] = useState(false);
  const isLogged = logs.some(l => l.date === workout?.date);

  async function getBriefing() {
    if (!workout || briefing) return;
    setLoadingBrief(true);
    const text = await callClaude("You are a motivational running + strength coach. Under 70 words. Direct, energetic, personal.",
      `Pre-workout briefing for: ${workout.title} — ${workout.description}. ${workout.paceTarget !== "N/A" ? "Pace: " + workout.paceTarget : ""} Effort: ${workout.effort}. Make it motivating and specific.`);
    setBriefing(text); setLoadingBrief(false);
  }

  if (!workout) return <div style={S.card}><div style={S.cardTitle}>Today</div><div style={{ color: C.muted }}>No workout scheduled today. Check your plan.</div></div>;
  const color = typeColor(workout.type);
  const run = isRun(workout.type);

  return (
    <div style={{ ...S.card, borderColor: color + "44" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div><div style={S.cardTitle}>Today · {fmtDate(workout.date)}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{workout.title}</div></div>
        <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
          <span style={S.tag(color)}>{workout.type}</span>
          {isLogged && <span style={S.tag(C.emerald)}>✓ DONE</span>}
        </div>
      </div>

      {run && workout.type !== "Rest" && (
        <div style={{ ...S.grid3, marginBottom: 14 }}>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>DISTANCE</div><div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>{workout.distance}</div><div style={{ color: C.muted, fontSize: 11 }}>{workout.unit}</div></div>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>PACE</div><div style={{ fontWeight: 700, fontSize: 13 }}>{workout.paceTarget}</div></div>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>ZONE</div><div style={{ fontWeight: 800, fontSize: 18, color }}>{workout.hrZone}</div></div>
        </div>
      )}

      {!run && workout.exercises && workout.type !== "Rest" && (
        <div style={{ background: C.surface2, borderRadius: 8, padding: 14, marginBottom: 14 }}>
          <div style={{ color: color, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>SESSION</div>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{workout.exercises}</div>
        </div>
      )}

      {run && workout.type !== "Rest" && (
        <div style={{ marginBottom: 14 }}>
          {workout.warmup && <div style={{ marginBottom: 8 }}><div style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>WARM-UP</div><div style={{ fontSize: 13 }}>{workout.warmup}</div></div>}
          {workout.mainSet && <div style={{ marginBottom: 8 }}><div style={{ color: C.gold, fontSize: 11, fontWeight: 700 }}>MAIN SET</div><div style={{ fontSize: 13 }}>{workout.mainSet}</div></div>}
          {workout.cooldown && <div><div style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>COOL-DOWN</div><div style={{ fontSize: 13 }}>{workout.cooldown}</div></div>}
        </div>
      )}

      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 14 }}>{workout.description}</div>
      <div style={S.divider} />

      {briefing
        ? <div style={{ background: C.emerald + "11", border: `1px solid ${C.emerald}33`, borderRadius: 8, padding: 12, marginBottom: 14 }}><div style={{ color: C.emerald, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>COACH BRIEFING</div><div style={{ fontSize: 13, lineHeight: 1.6 }}>{briefing}</div></div>
        : workout.type !== "Rest" && <button style={{ ...S.btnGhost, marginBottom: 14, fontSize: 12 }} onClick={getBriefing} disabled={loadingBrief}>{loadingBrief ? "Loading..." : "⚡ Get Coach Briefing"}</button>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!isLogged && workout.type !== "Rest" && <button style={S.btnEmerald} onClick={() => onLog(workout)}>Log This Workout</button>}
        {workout.type !== "Rest" && <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={() => setNotFeeling(true)}>Not Feeling 100%?</button>}
      </div>
      {notFeeling && <NotFeeling100 workout={workout} onClose={() => setNotFeeling(false)} />}
    </div>
  );
}

// ── NOT FEELING 100% ───────────────────────────────────────────────────────────
function NotFeeling100({ workout, onClose }) {
  const [advice, setAdvice] = useState(""); const [loading, setLoading] = useState(false); const [selected, setSelected] = useState("");
  const reasons = ["Feeling sick", "Minor ache/pain", "Super tired/fatigued", "Short on time", "Just not feeling it"];
  async function getAdvice() {
    if (!selected) return; setLoading(true);
    const text = await callClaude("You are a running + strength coach. Concise, practical. Max 60 words.",
      `Athlete isn't 100%: "${selected}". Scheduled: ${workout.title} (${workout.type}). Give a specific modified plan or clear guidance.`);
    setAdvice(text); setLoading(false);
  }
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Not Feeling 100%</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>{reasons.map(r => <button key={r} style={{ ...S.btnGhost, textAlign: "left", padding: "8px 12px", borderColor: selected === r ? C.gold : C.border, color: selected === r ? C.gold : C.muted, fontSize: 13 }} onClick={() => setSelected(r)}>{r}</button>)}</div>
      {advice ? <div style={{ background: C.emerald + "11", border: `1px solid ${C.emerald}33`, borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{advice}</div>
        : <button style={{ ...S.btnGold, marginBottom: 10 }} onClick={getAdvice} disabled={!selected || loading}>{loading ? "Thinking..." : "Get Modified Plan"}</button>}
      <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={onClose}>Close</button>
    </div>
  );
}

// ── LOG MODAL ──────────────────────────────────────────────────────────────────
function LogModal({ workout, onSave, onClose }) {
  const run = isRun(workout?.type);
  const [form, setForm] = useState({ distance: workout?.distance || "", time: "", notes: "", felt: "3" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 420 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Log Workout</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>{workout?.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {run && <div style={S.grid2}>
            <div><label style={S.label}>Distance (mi)</label><input style={S.input} type="number" step="0.1" value={form.distance} onChange={e => set("distance", e.target.value)} /></div>
            <div><label style={S.label}>Time (mm:ss)</label><input style={S.input} placeholder="28:30" value={form.time} onChange={e => set("time", e.target.value)} /></div>
          </div>}
          <div><label style={S.label}>How did it feel? ({["😴","😓","😐","😊","🔥"][parseInt(form.felt)-1]})</label><input type="range" min="1" max="5" value={form.felt} onChange={e => set("felt", e.target.value)} style={{ width: "100%", accentColor: C.gold }} /></div>
          <div><label style={S.label}>Notes</label><textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} placeholder="How'd it go?" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button style={S.btnGhost} onClick={onClose}>Cancel</button>
          <button style={{ ...S.btnEmerald, flex: 1 }} onClick={() => { onSave({ date: workout.date, workoutTitle: workout.title, workoutType: workout.type, distance: run ? (parseFloat(form.distance) || 0) : 0, time: form.time, notes: form.notes, felt: parseInt(form.felt), loggedAt: Date.now() }); onClose(); }}>Save ✓</button>
        </div>
      </div>
    </div>
  );
}

// ── WEEK CALENDAR ──────────────────────────────────────────────────────────────
function WeekCalendar({ plan, logs, currentWeek, setCurrentWeek, onSelectWorkout, onExtendPlan, extending, onSwap }) {
  const [rearrange, setRearrange] = useState(false);
  const [picked, setPicked] = useState(null); // index of workout picked up
  if (!plan) return null;
  const week = plan.weeks[currentWeek];
  const today = todayStr();
  const needsMore = currentWeek === plan.weeks.length - 1 && plan.weeks.length < plan.totalWeeks;

  if (!week) return (
    <div style={S.card}>
      <div style={{ textAlign: "center", padding: 20 }}>
        <div style={{ color: C.muted, marginBottom: 14 }}>Week {currentWeek + 1} isn't built yet.</div>
        <button style={S.btnGold} onClick={onExtendPlan} disabled={extending}>{extending ? "Coach is building..." : "Build Next Weeks →"}</button>
      </div>
    </div>
  );

  function handleTap(i) {
    if (!rearrange) { onSelectWorkout(week.workouts[i]); return; }
    if (picked === null) { setPicked(i); return; }
    if (picked === i) { setPicked(null); return; } // tap same to cancel
    onSwap(currentWeek, picked, i);
    setPicked(null);
  }

  function exitRearrange() { setRearrange(false); setPicked(null); }

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={S.cardTitle}>Week {week.weekNumber} of {plan.totalWeeks} — {week.theme}</div>
          <div style={{ color: C.muted, fontSize: 12 }}>{week.totalMiles} mi running{week.focus ? ` · ${week.focus}` : ""}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!rearrange && <><button style={{ ...S.btnGhost, padding: "6px 12px" }} onClick={() => setCurrentWeek(w => Math.max(0, w - 1))} disabled={currentWeek === 0}>‹</button>
          <button style={{ ...S.btnGhost, padding: "6px 12px" }} onClick={() => setCurrentWeek(w => Math.min(plan.totalWeeks - 1, w + 1))} disabled={currentWeek === plan.totalWeeks - 1}>›</button></>}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        {rearrange
          ? <div style={{ color: picked === null ? C.gold : C.emerald, fontSize: 12, fontWeight: 600 }}>{picked === null ? "Tap a workout to move it" : "Now tap where it should go"}</div>
          : <div style={{ color: C.muted, fontSize: 11 }}>Tap a day for details</div>}
        <button style={{ ...(rearrange ? S.btnEmerald : S.btnGhost), padding: "6px 14px", fontSize: 12 }} onClick={() => rearrange ? exitRearrange() : setRearrange(true)}>
          {rearrange ? "Done" : "⇅ Rearrange"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {week.workouts.map((w, i) => {
          const isToday = w.date === today, isDone = logs.some(l => l.date === w.date), color = typeColor(w.type);
          const isPicked = picked === i;
          const isTarget = rearrange && picked !== null && picked !== i;
          return (
            <button key={i} onClick={() => handleTap(i)} style={{
              background: isPicked ? C.gold + "33" : isToday ? color + "18" : C.surface2,
              border: `1px solid ${isPicked ? C.gold : isTarget ? C.emerald + "66" : isToday ? color : isDone ? C.emerald + "44" : C.border}`,
              borderStyle: isTarget ? "dashed" : "solid",
              borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer", textAlign: "left", fontFamily: FONT,
              transform: isPicked ? "scale(0.98)" : "none", transition: "transform 0.1s",
            }}>
              {rearrange && <span style={{ color: isPicked ? C.gold : C.muted, fontSize: 16, flexShrink: 0 }}>⇅</span>}
              <div style={{ width: 42, color: isToday ? color : C.muted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{fmtDate(w.date).split(" ")[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{w.title}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{isRun(w.type) && w.type !== "Rest" ? `${w.distance} mi · ${w.paceTarget}` : w.type === "Rest" ? "Rest Day" : w.type}</div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{isDone && !rearrange && <span style={{ color: C.emerald, fontSize: 14 }}>✓</span>}<span style={S.tag(color)}>{w.effort}</span></div>
            </button>
          );
        })}
      </div>

      {rearrange && <div style={{ color: C.muted, fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>Moving a workout swaps it with the day you tap, so your week stays in order. Heads up: stacking two hard days back-to-back isn't ideal for recovery.</div>}
      {!rearrange && needsMore && <button style={{ ...S.btnGold, marginTop: 14, width: "100%" }} onClick={onExtendPlan} disabled={extending}>{extending ? "Coach is building next block..." : "Build Next 4 Weeks →"}</button>}
    </div>
  );
}

// ── NUTRITION CARD ─────────────────────────────────────────────────────────────
function NutritionCard({ profile }) {
  const n = profile.nutrition;
  if (!n) return null;
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Daily Nutrition Target</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 80, background: C.surface2, borderRadius: 8, padding: 12 }}><div style={{ color: C.gold, fontWeight: 800, fontSize: 22 }}>{n.cals}</div><div style={{ color: C.muted, fontSize: 11 }}>calories</div></div>
        <div style={{ flex: 1, minWidth: 80, background: C.surface2, borderRadius: 8, padding: 12 }}><div style={{ color: C.emerald, fontWeight: 800, fontSize: 22 }}>{n.protein}g</div><div style={{ color: C.muted, fontSize: 11 }}>protein</div></div>
        <div style={{ flex: 1, minWidth: 80, background: C.surface2, borderRadius: 8, padding: 12 }}><div style={{ fontWeight: 800, fontSize: 22 }}>{n.carbs}g</div><div style={{ color: C.muted, fontSize: 11 }}>carbs</div></div>
        <div style={{ flex: 1, minWidth: 80, background: C.surface2, borderRadius: 8, padding: 12 }}><div style={{ fontWeight: 800, fontSize: 22 }}>{n.fat}g</div><div style={{ color: C.muted, fontSize: 11 }}>fat</div></div>
      </div>
      <div style={{ color: C.muted, fontSize: 12 }}>{profile.dietMode[0].toUpperCase() + profile.dietMode.slice(1)} · ~{n.lossRate} · maintenance ≈ {n.tdee} cal/day</div>
    </div>
  );
}

// ── WEIGHT TRACKER ─────────────────────────────────────────────────────────────
function WeightTracker({ profile, onLogWeight }) {
  const [val, setVal] = useState("");
  const hist = profile.weightHistory || [];
  const current = hist.length ? hist[hist.length - 1].weight : parseFloat(profile.weightLbs);
  const start = parseFloat(profile.weightLbs);
  const goal = parseFloat(profile.goalWeightLbs);
  const lost = (start - current).toFixed(1);
  const toGo = (current - goal).toFixed(1);
  const pct = Math.min(Math.max((start - current) / (start - goal), 0), 1);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Weight Progress</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div><span style={{ fontSize: 26, fontWeight: 800, color: C.gold }}>{current}</span><span style={{ color: C.muted, fontSize: 13 }}> lbs</span></div>
        <div style={{ textAlign: "right" }}><div style={{ color: C.emerald, fontWeight: 700, fontSize: 13 }}>−{lost} lbs lost</div><div style={{ color: C.muted, fontSize: 12 }}>{toGo} to go → {goal}</div></div>
      </div>
      <div style={{ background: C.surface2, borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 12 }}><div style={{ background: C.emerald, height: "100%", width: `${pct * 100}%`, borderRadius: 4 }} /></div>
      <div style={{ display: "flex", gap: 10 }}>
        <input style={{ ...S.input, flex: 1 }} type="number" step="0.1" placeholder="Log today's weight" value={val} onChange={e => setVal(e.target.value)} />
        <button style={S.btnEmerald} onClick={() => { if (val) { onLogWeight(parseFloat(val)); setVal(""); } }}>Log</button>
      </div>
    </div>
  );
}

// ── MILEAGE GRAPH ──────────────────────────────────────────────────────────────
function MileageGraph({ plan, logs }) {
  if (!plan) return null;
  const built = plan.weeks;
  const maxMiles = Math.max(...built.map(w => w.totalMiles), 1);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Weekly Mileage</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
        {built.map((w, i) => {
          const logged = logs.filter(l => w.workouts.some(wk => wk.date === l.date)).reduce((s, l) => s + l.distance, 0);
          const pct = w.totalMiles / maxMiles, lPct = Math.min(logged / maxMiles, 1);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: "100%", position: "relative", height: 60, display: "flex", alignItems: "flex-end" }}>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.border, borderRadius: "4px 4px 0 0", height: `${pct * 100}%` }} />
                {lPct > 0 && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.emerald, borderRadius: "4px 4px 0 0", height: `${lPct * 100}%` }} />}
              </div>
              <div style={{ fontSize: 9, color: C.muted }}>{w.weekNumber}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, background: C.border, borderRadius: 2 }} /><span style={{ fontSize: 11, color: C.muted }}>Planned</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, background: C.emerald, borderRadius: 2 }} /><span style={{ fontSize: 11, color: C.muted }}>Logged</span></div>
      </div>
    </div>
  );
}

// ── RACE CALC ──────────────────────────────────────────────────────────────────
function RaceCalc() {
  const [fiveK, setFiveK] = useState(""); const [result, setResult] = useState(null);
  function calc() {
    const p = fiveK.split(":").map(Number);
    if (p.length !== 2 || isNaN(p[0]) || isNaN(p[1])) return;
    const secs = p[0] * 60 + p[1];
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    setResult({ "1 Mile": fmt(secs / 3.1 * 0.92), "5K": fiveK, "10K": fmt(secs * 2.09), "Half Marathon": fmt(secs * 4.667), "Marathon": fmt(secs * 9.7) });
  }
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Race Time Predictor</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}><input style={{ ...S.input, flex: 1 }} placeholder="5K time (28:00)" value={fiveK} onChange={e => setFiveK(e.target.value)} /><button style={S.btnGold} onClick={calc}>Predict</button></div>
      {result && <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{Object.entries(result).map(([d, t]) => <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.surface2, borderRadius: 6 }}><span style={{ color: C.muted, fontSize: 13 }}>{d}</span><span style={{ fontWeight: 700, color: C.gold }}>{t}</span></div>)}</div>}
    </div>
  );
}

// ── SHOE TRACKER ───────────────────────────────────────────────────────────────
function ShoeTracker({ profile, logs }) {
  const total = logs.reduce((s, l) => s + (l.distance || 0), 0), limit = 500, pct = Math.min(total / limit, 1);
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>Shoe Tracker</div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{profile?.shoes || "No shoe added"}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ color: C.muted, fontSize: 13 }}>{total.toFixed(1)} mi logged</span><span style={{ color: pct > 0.8 ? C.red : C.muted, fontSize: 13, fontWeight: 700 }}>{limit - total < 0 ? "Replace now!" : `${(limit - total).toFixed(0)} mi left`}</span></div>
      <div style={{ background: C.surface2, borderRadius: 4, height: 6, overflow: "hidden" }}><div style={{ background: pct > 0.8 ? C.red : C.gold, height: "100%", width: `${pct * 100}%`, borderRadius: 4 }} /></div>
    </div>
  );
}

// ── LOG HISTORY ────────────────────────────────────────────────────────────────
function LogHistory({ logs }) {
  if (!logs.length) return <div style={S.card}><div style={S.cardTitle}>History</div><div style={{ color: C.muted, fontSize: 13 }}>No workouts logged yet.</div></div>;
  return (
    <div style={S.card}>
      <div style={S.cardTitle}>History</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[...logs].reverse().slice(0, 12).map((l, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.surface2, borderRadius: 8 }}>
            <div><div style={{ fontWeight: 600, fontSize: 13 }}>{l.workoutTitle}</div><div style={{ color: C.muted, fontSize: 11 }}>{fmtDate(l.date)}</div></div>
            <div style={{ textAlign: "right" }}>{l.distance > 0 && <div style={{ color: C.gold, fontWeight: 700 }}>{l.distance} mi</div>}<div style={{ color: C.muted, fontSize: 11 }}>{["😴","😓","😐","😊","🔥"][l.felt-1]}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WORKOUT DETAIL MODAL ───────────────────────────────────────────────────────
function WorkoutDetailModal({ workout, onClose, onLog, logs }) {
  const isLogged = logs.some(l => l.date === workout?.date);
  const color = typeColor(workout?.type), run = isRun(workout?.type);
  if (!workout) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div><div style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>{fmtDate(workout.date)}</div><div style={{ fontWeight: 800, fontSize: 18 }}>{workout.title}</div></div>
          <span style={S.tag(color)}>{workout.type}</span>
        </div>
        {run && workout.type !== "Rest" && <div style={S.grid3}>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>DISTANCE</div><div style={{ fontWeight: 800, fontSize: 18, color: C.gold }}>{workout.distance}</div><div style={{ color: C.muted, fontSize: 11 }}>{workout.unit}</div></div>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>PACE</div><div style={{ fontWeight: 600, fontSize: 12 }}>{workout.paceTarget}</div></div>
          <div style={{ background: C.surface2, borderRadius: 8, padding: "10px 12px" }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>ZONE</div><div style={{ fontWeight: 800, fontSize: 18, color }}>{workout.hrZone}</div></div>
        </div>}
        {!run && workout.exercises && <div style={{ marginTop: 12, background: color + "11", border: `1px solid ${color}33`, borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.6 }}><b style={{ color }}>Movements:</b> {workout.exercises}</div>}
        <div style={{ marginTop: 14, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{workout.description}</div>
        {workout.mainSet && <div style={{ marginTop: 10, background: C.gold + "11", border: `1px solid ${C.gold}33`, borderRadius: 8, padding: 12, fontSize: 13 }}><b style={{ color: C.gold }}>Main Set:</b> {workout.mainSet}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button style={S.btnGhost} onClick={onClose}>Close</button>
          {!isLogged && workout.type !== "Rest" && <button style={{ ...S.btnEmerald, flex: 1 }} onClick={() => { onLog(workout); onClose(); }}>Log This</button>}
          {isLogged && <span style={{ ...S.tag(C.emerald), padding: "10px 16px" }}>✓ Logged</span>}
        </div>
      </div>
    </div>
  );
}

const TABS = [{ id: "today", label: "Today" }, { id: "plan", label: "Plan" }, { id: "progress", label: "Progress" }, { id: "tools", label: "Tools" }];

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function TRCK() {
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("today");
  const [currentWeek, setCurrentWeek] = useState(0);
  const [logTarget, setLogTarget] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [notFeeling, setNotFeeling] = useState(false);
  const [booting, setBooting] = useState(true);
  const [extending, setExtending] = useState(false);

  useEffect(() => { (async () => {
    const p = await load("trck_profile"), pl = await load("trck_plan"), lg = await load("trck_logs");
    if (p && pl) { setProfile(p); setPlan(pl); setLogs(lg || []); }
    setBooting(false);
  })(); }, []);

  useEffect(() => { if (!plan) return; const t = todayStr(); const idx = plan.weeks.findIndex(w => w.workouts.some(wk => wk.date >= t)); if (idx >= 0) setCurrentWeek(idx); }, [plan]);

  const todayWorkout = plan?.weeks.flatMap(w => w.workouts).find(w => w.date === todayStr());

  async function saveLog(entry) { const u = [...logs, entry]; setLogs(u); await save("trck_logs", u); }

  async function swapWorkouts(weekIdx, fromIdx, toIdx) {
    const updated = { ...plan, weeks: plan.weeks.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const workouts = w.workouts.map(x => ({ ...x }));
      // swap the date fields so the two sessions trade calendar slots
      const dA = workouts[fromIdx].date, dB = workouts[toIdx].date;
      workouts[fromIdx].date = dB; workouts[toIdx].date = dA;
      workouts.sort((a, b) => a.date.localeCompare(b.date));
      return { ...w, workouts };
    }) };
    setPlan(updated); await save("trck_plan", updated);
  }

  async function logWeight(weight) {
    const hist = [...(profile.weightHistory || []), { date: todayStr(), weight }];
    const updated = { ...profile, weightHistory: hist };
    // Recompute nutrition as weight drops
    updated.nutrition = computeNutrition({ weightLbs: weight, goalWeightLbs: parseFloat(profile.goalWeightLbs), heightIn: parseFloat(profile.heightIn), age: parseFloat(profile.age), sex: profile.sex, dietMode: profile.dietMode });
    setProfile(updated); await save("trck_profile", updated);
  }

  async function extendPlan() {
    setExtending(true);
    try {
      const built = plan.weeks.length;
      const nextStart = built + 1;
      const nextEnd = Math.min(built + 4, plan.totalWeeks);
      const lastDate = plan.weeks[built - 1].workouts[plan.weeks[built - 1].workouts.length - 1].date;
      const startDate = `${new Date(new Date(lastDate).getTime() + 86400000).toISOString().slice(0,10)}`;
      const recentLogs = logs.slice(-10).map(l => `${l.date}: ${l.workoutTitle} (felt ${l.felt}/5)`).join("; ");
      const prompt = `Continue this training plan. Build weeks ${nextStart} to ${nextEnd} of ${plan.totalWeeks}.
ATHLETE: ${profile.name}, goals: ${(profile.goals || []).join(", ")}, ${profile.runDaysPerWeek} runs + ${profile.liftDaysPerWeek} lifts/week, long run ${profile.longRunDay}, ${profile.experience}.
Coach notes: ${profile.trainingNotes || "none"}
Recent training (adapt based on how they felt): ${recentLogs || "none yet"}
These weeks start ${startDate}. Progress the periodization appropriately (this is week ${nextStart}+ of ${plan.totalWeeks}).
Same coaching rules: no hard run after legs, protect long run, real rest, progress load.
Return ONLY valid JSON: { "weeks": [ {same schema as before with weekNumber ${nextStart}+} ] }`;
      const raw = await callClaude("Return only valid JSON. No markdown.", prompt, 4000);
      const result = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const updated = { ...plan, weeks: [...plan.weeks, ...result.weeks] };
      setPlan(updated); await save("trck_plan", updated);
      setCurrentWeek(built);
    } catch (e) { console.error(e); alert("Couldn't build next weeks. Try again."); }
    setExtending(false);
  }

  async function resetApp() {
    if (!confirm("Reset TRCK and start over?")) return;
    await del("trck_profile"); await del("trck_plan"); await del("trck_logs");
    setProfile(null); setPlan(null); setLogs([]);
  }

  if (booting) return <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}><div style={{ color: C.gold, fontWeight: 900, fontSize: 28, letterSpacing: "0.15em" }}>TRCK</div><div style={{ color: C.muted, marginTop: 8 }}>Loading...</div></div>;
  if (!profile || !plan) return <div style={S.app}><nav style={S.nav}><div style={S.logo}>TRCK</div></nav><Onboarding onDone={(p, pl, lg) => { setProfile(p); setPlan(pl); setLogs(lg); }} /></div>;

  const totalLogged = logs.reduce((s, l) => s + (l.distance || 0), 0);
  const completed = logs.length;
  const totalWorkouts = plan.weeks.flatMap(w => w.workouts).filter(w => w.type !== "Rest").length;

  return (
    <div style={S.app}>
      <nav style={S.nav}><div style={S.logo}>TRCK</div><div style={{ color: C.muted, fontSize: 13 }}>{profile.name}</div></nav>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
        <div style={{ display: "flex", gap: 20, maxWidth: 900, margin: "0 auto", overflowX: "auto" }}>
          {[{ l: "Goals", v: (profile.goals || []).length === 1 ? profile.goals[0] : `${(profile.goals || []).length} goals` }, { l: "Logged", v: `${totalLogged.toFixed(0)} mi` }, { l: "Done", v: `${completed}/${totalWorkouts}+` }, { l: "Week", v: `${currentWeek + 1}/${plan.totalWeeks}` }].map(({ l, v }) => (
            <div key={l} style={{ flexShrink: 0 }}><div style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>{l.toUpperCase()}</div><div style={{ fontWeight: 700, fontSize: 14, color: C.gold }}>{v}</div></div>
          ))}
        </div>
      </div>
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 16px" }}>
        <div style={{ display: "flex", gap: 4, maxWidth: 900, margin: "0 auto" }}>
          {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "transparent", border: "none", borderBottom: `2px solid ${tab === t.id ? C.gold : "transparent"}`, color: tab === t.id ? C.gold : C.muted, padding: "14px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>{t.label}</button>)}
        </div>
      </div>

      <div style={S.main}>
        {tab === "today" && <>
          <TodayCard workout={todayWorkout} onLog={setLogTarget} logs={logs} setNotFeeling={setNotFeeling} notFeeling={notFeeling} />
          <NutritionCard profile={profile} />
        </>}
        {tab === "plan" && <>
          <div style={{ marginBottom: 16 }}><div style={S.h1}>{plan.planName}</div><div style={{ color: C.muted, fontSize: 14 }}>{plan.totalWeeks} weeks · {profile.runDaysPerWeek} runs + {profile.liftDaysPerWeek} lifts/week</div></div>
          <WeekCalendar plan={plan} logs={logs} currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} onSelectWorkout={setSelectedWorkout} onExtendPlan={extendPlan} extending={extending} onSwap={swapWorkouts} />
        </>}
        {tab === "progress" && <>
          <WeightTracker profile={profile} onLogWeight={logWeight} />
          <MileageGraph plan={plan} logs={logs} />
          <ShoeTracker profile={profile} logs={logs} />
          <LogHistory logs={logs} />
        </>}
        {tab === "tools" && <>
          <NutritionCard profile={profile} />
          <RaceCalc />
          <div style={S.card}>
            <div style={S.cardTitle}>Plan Info</div>
            <div style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>Started {fmtDate(profile.startDate)} · {profile.experience} · {profile.dietMode} diet</div>
            <button style={S.btnRed} onClick={resetApp}>Reset & Start New Plan</button>
          </div>
        </>}
      </div>

      {logTarget && <LogModal workout={logTarget} onSave={saveLog} onClose={() => setLogTarget(null)} />}
      {selectedWorkout && <WorkoutDetailModal workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} onLog={setLogTarget} logs={logs} />}
    </div>
  );
}

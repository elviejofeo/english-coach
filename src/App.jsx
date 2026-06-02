import { useState, useEffect, useRef } from "react";

// ─── Profile ──────────────────────────────────────────────────────────────────
const PROFILE = `You are a specialized English coach.
User: Demand Planning Chief with 20 years of supply chain experience. Mexican professional, intermediate B1-B2 English, works with SAP, manages two manufacturing plants, runs S&OP processes, forecast reviews, inventory planning. Needs to understand and speak with native US English speakers in meetings, calls, and emails.
Goal: Understand native American English and use natural business English confidently.
ALWAYS respond with valid JSON only — no markdown fences, no preamble, no explanation. Vary supply chain topics each session.`;

async function askClaude(prompt, tokens = 1400) {
  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_tokens: tokens,
        system: PROFILE,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await res.json();
    return (d.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
  } catch { return ""; }
}

// ─── TTS ──────────────────────────────────────────────────────────────────────
function speak(text, onEnd) {
  window.speechSynthesis.cancel();
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  let i = 0;
  function next() {
    if (i >= sentences.length) { if (onEnd) onEnd(); return; }
    const u = new SpeechSynthesisUtterance(sentences[i].trim());
    u.lang = "en-US"; u.rate = 0.87;
    const v = window.speechSynthesis.getVoices();
    const voice = v.find(x => x.lang === "en-US" && /google|samantha|karen/i.test(x.name)) || v.find(x => x.lang === "en-US");
    if (voice) u.voice = voice;
    u.onend = () => { i++; next(); };
    window.speechSynthesis.speak(u);
  }
  next();
}
function stopSpeech() { window.speechSynthesis.cancel(); }

// ─── Colors & styles ─────────────────────────────────────────────────────────
const C = {
  teal: "#0d9488", blue: "#0369a1", purple: "#7c3aed", amber: "#d97706",
  dark: "#080f1a", card: "#0d1825", border: "#162030",
  text: "#f1f5f9", muted: "#475569", hint: "#4a6080",
  green: "#064e3b", greenBorder: "#16a34a",
  red: "#450a0a", redBorder: "#dc2626",
};
const btn = (bg, ex = {}) => ({
  background: bg, color: C.text, border: "none", borderRadius: 9,
  padding: "11px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  fontFamily: "inherit", transition: "all .15s", WebkitTapHighlightColor: "transparent",
  ...ex,
});
const cardStyle = (hi = false, ex = {}) => ({
  background: hi ? "#0c1e38" : C.card,
  border: `1px solid ${hi ? "#2a5080" : C.border}`,
  borderRadius: 13, padding: "14px 16px", ...ex,
});
function shuffle(arr) { return [...arr].sort(() => Math.random() - .5); }

// ─── Shared: Progress bar ─────────────────────────────────────────────────────
function ProgBar({ val, max, color = C.purple }) {
  return (
    <div style={{ background: C.border, borderRadius: 20, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (val / max) * 100)}%`, background: color, height: "100%", transition: "width .35s ease" }} />
    </div>
  );
}

// ─── Shared: Answer feedback ──────────────────────────────────────────────────
function Feedback({ correct, hint, onNext }) {
  return (
    <div style={{
      background: correct ? C.green : C.red,
      border: `1px solid ${correct ? C.greenBorder : C.redBorder}`,
      borderRadius: 12, padding: "13px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: correct ? "#4ade80" : "#f87171" }}>
          {correct ? "✓ Correct!" : "✗ Not quite"}
        </div>
        {hint && <div style={{ fontSize: 13, color: correct ? "#86efac" : "#fca5a5", marginTop: 3 }}>{hint}</div>}
      </div>
      <button onClick={onNext} style={btn(correct ? "#16a34a" : "#dc2626", { padding: "8px 16px", fontSize: 13 })}>
        Continue →
      </button>
    </div>
  );
}

// ─── Shared: Multiple choice question ────────────────────────────────────────
function MCQ({ question, sublabel, opts, ans, onAnswer, answered, extra }) {
  return (
    <>
      <div style={cardStyle(false, { padding: "14px 15px" })}>
        {sublabel && <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{sublabel}</div>}
        <div style={{ fontSize: 15, color: C.text, lineHeight: 1.55 }}>{question}</div>
        {extra}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {opts.map((opt, i) => {
          let bg = C.card, borderC = C.border;
          if (answered !== null) {
            if (i === ans) { bg = C.green; borderC = C.greenBorder; }
            else if (i === answered && i !== ans) { bg = C.red; borderC = C.redBorder; }
          }
          return (
            <button key={i} onClick={() => onAnswer(i)} disabled={answered !== null} style={{
              background: bg, border: `1px solid ${borderC}`, borderRadius: 10,
              padding: "13px 14px", color: C.text, fontSize: 14, cursor: answered !== null ? "default" : "pointer",
              textAlign: "left", fontFamily: "inherit", transition: "background .2s",
            }}>{opt}</button>
          );
        })}
      </div>
    </>
  );
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────
function XPBar({ xp, streak }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0 12px" }}>
      <span style={{ fontSize: 15 }}>🔥</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#fb923c", minWidth: 22 }}>{streak}</span>
      <div style={{ flex: 1, background: C.border, borderRadius: 20, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, xp % 100)}%`, background: "linear-gradient(90deg,#0d9488,#0ea5e9)", height: "100%", borderRadius: 20, transition: "width .4s" }} />
      </div>
      <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, minWidth: 44, textAlign: "right" }}>{xp} XP</span>
    </div>
  );
}

// ─── Session Timer ─────────────────────────────────────────────────────────────
function SessionTimer({ active, elapsed }) {
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const target = 25 * 60;
  const pct = Math.min(100, (elapsed / target) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 12, color: pct > 90 ? "#4ade80" : C.muted, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        ⏱ {String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}
      </div>
      <div style={{ width: 48, background: C.border, borderRadius: 10, height: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: pct > 90 ? "#4ade80" : C.teal, height: "100%", transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VOCAB MODULE
// ══════════════════════════════════════════════════════════════════════════════
function VocabModule({ addXP, sessionMode, onSessionDone }) {
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("cards");
  const [tests, setTests] = useState([]);
  const [tIdx, setTIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [done, setDone] = useState(false);

  async function load() {
    setLoading(true); setCards([]); setIdx(0); setFlipped(false);
    setMode("cards"); setDone(false); setScore({ c: 0, t: 0 });
    const raw = await askClaude(`Generate 5 vocabulary flashcards for a supply chain professional. 
IMPORTANT: Pick a RANDOM and VERY SPECIFIC supply chain subtopic — be creative and granular. Examples of good subtopics: OTIF metrics, cycle counting, ABC analysis, bullwhip effect, MRP logic, VMI agreements, DRP planning, frozen horizon, SIOP process, takt time, COGS analysis, slotting optimization, landed cost, days of supply, fill rate, backorder management, kanban systems, rough-cut capacity, demand sensing, statistical safety stock, supplier scorecards, purchase price variance, inbound freight, cross-docking, ATP logic, CTP, master scheduling, rough-cut planning, intercompany transfers, consignment inventory, dead stock, slow movers, write-off process, annual physical inventory, perpetual inventory, shrinkage, receiving discrepancies, PO management, blanket orders, release orders, expediting, de-expediting, allocation logic, available-to-promise, customer service level, order fulfillment, pick-pack-ship, 3PL management, freight audit, incoterms, customs clearance, duty drawback, carbon footprint in logistics, reverse logistics, returns management, warranty claims, product lifecycle planning, new product introduction, end-of-life planning, promotional planning, causal forecasting, collaborative forecasting, forecast bias, MAD, MAPE, tracking signal.
Choose ONE specific subtopic from this universe (or similar ones not listed) — never pick a broad generic topic. Use ONLY words native US supply chain professionals actually say in meetings and emails.
Return ONLY a JSON array — each item must have exactly these fields:
[{"word":"...","phonetic":"...pronunciation hint easy for Spanish speaker...","definition":"...1 sentence English definition...","spanish":"...Spanish translation...","example":"...realistic work sentence using the word...","tip":"...one native US usage tip...","wrong":["...wrong Spanish 1...","...wrong Spanish 2...","...wrong Spanish 3..."]}]`);
    try {
      const data = JSON.parse(raw);
      setCards(data);
      buildTests(data);
    } catch { setCards([]); }
    setLoading(false);
  }

  function buildTests(data) {
    const q = [];
    data.forEach(c => {
      // Q1: translation
      const tOpts = shuffle([...c.wrong, c.spanish]);
      q.push({ type: "translate", q: `What does "${c.word}" mean in Spanish?`, opts: tOpts, ans: tOpts.indexOf(c.spanish), word: c.word });
      // Q2: fill blank
      const blanked = c.example.replace(new RegExp(`\\b${c.word}\\b`, "gi"), "______");
      const wordOpts = shuffle(data.map(x => x.word)).slice(0, 4);
      if (!wordOpts.includes(c.word)) wordOpts[0] = c.word;
      const wShuffle = shuffle(wordOpts);
      q.push({ type: "fill", q: `Fill in the blank:`, sentence: blanked, opts: wShuffle, ans: wShuffle.indexOf(c.word), word: c.word });
    });
    setTests(shuffle(q).slice(0, 8));
    setTIdx(0); setAnswered(null);
  }

  function answer(i) {
    if (answered !== null) return;
    const correct = i === tests[tIdx].ans;
    setAnswered(i);
    setScore(s => ({ c: s.c + (correct ? 1 : 0), t: s.t + 1 }));
    if (correct) addXP(10);
  }

  function nextQ() {
    if (tIdx + 1 >= tests.length) { setDone(true); if (sessionMode && onSessionDone) onSessionDone(score.c + (answered === tests[tIdx].ans ? 1 : 0)); return; }
    setTIdx(i => i + 1); setAnswered(null);
  }

  const c = cards[idx];
  const t = tests[tIdx];

  useEffect(() => { if (sessionMode) load(); }, [sessionMode]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!sessionMode && (
        <button onClick={load} disabled={loading} style={btn(C.teal)}>
          {loading ? "⏳ Loading…" : "✦ New Cards"}
        </button>
      )}
      {loading && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Generating vocabulary…</div>}

      {/* ── CARDS ── */}
      {cards.length > 0 && mode === "cards" && c && (
        <>
          <ProgBar val={idx} max={cards.length - 1} color={C.teal} />
          <div style={{ fontSize: 11, color: C.hint, marginTop: -6 }}>{idx + 1} / {cards.length}</div>

          {/* Card face */}
          <div style={cardStyle(false, { padding: "18px 16px", minHeight: 230, position: "relative", userSelect: "none" })}>
            {/* Word + phonetic always visible */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: -1 }}>{c.word}</div>
                <div style={{ fontSize: 12, color: C.hint, marginTop: 2 }}>{c.phonetic}</div>
              </div>
              <button onClick={() => speak(c.word + ". " + c.example)} style={btn(C.blue, { fontSize: 12, padding: "6px 12px" })}>🔊</button>
            </div>

            {/* Definition always visible */}
            <div style={{ marginTop: 12, padding: "10px 13px", background: "#080f1a", borderRadius: 9, borderLeft: `3px solid ${C.teal}` }}>
              <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Definition</div>
              <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.55 }}>{c.definition}</div>
              <div style={{ fontSize: 12, color: C.hint, marginTop: 3 }}>🇲🇽 {c.spanish}</div>
            </div>

            {/* Example — tap to reveal */}
            {!flipped ? (
              <button onClick={() => setFlipped(true)} style={btn(C.border, { marginTop: 12, fontSize: 12, padding: "7px 14px" })}>
                Show example & tip →
              </button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.6 }}>"{c.example}"</div>
                <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 7 }}>💡 {c.tip}</div>
                <button onClick={() => speak(c.example)} style={btn(C.blue, { fontSize: 12, padding: "6px 12px", marginTop: 8 })}>🔊 Example</button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false); }} style={btn(C.border, { padding: "9px 16px" })} disabled={idx === 0}>← Prev</button>
            <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }} style={btn(C.border, { padding: "9px 16px" })} disabled={idx === cards.length - 1}>Next →</button>
          </div>
          <button onClick={() => { setMode("test"); setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 }); }} style={btn(C.purple, { marginTop: 4 })}>
            🧠 Start Mini Test
          </button>
        </>
      )}

      {/* ── TEST ── */}
      {mode === "test" && !done && t && (
        <>
          <ProgBar val={tIdx} max={tests.length} color={C.purple} />
          <div style={{ fontSize: 11, color: C.hint }}>{tIdx + 1} / {tests.length} · ✅ {score.c}</div>
          <MCQ
            question={t.q}
            sublabel={t.type === "fill" ? "Complete the sentence" : "Translation"}
            opts={t.opts}
            ans={t.ans}
            answered={answered}
            onAnswer={answer}
            extra={t.type === "fill" && <div style={{ fontSize: 14, color: "#93c5fd", fontStyle: "italic", marginTop: 8 }}>"{t.sentence}"</div>}
          />
          {answered !== null && (
            <Feedback correct={answered === t.ans} hint={answered !== t.ans ? `Answer: "${t.opts[t.ans]}"` : "+10 XP"} onNext={nextQ} />
          )}
        </>
      )}

      {/* ── DONE ── */}
      {mode === "test" && done && !sessionMode && (
        <div style={cardStyle(true, { textAlign: "center", padding: 26 })}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>{score.c >= score.t * .7 ? "🎉" : "💪"}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{score.c}/{score.t}</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 5 }}>
            {score.c >= score.t * .8 ? "Excellent! You know these words." : score.c >= score.t * .5 ? "Good — review the cards and retry." : "Study the cards more before testing."}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={() => { setMode("cards"); setIdx(0); setFlipped(false); }} style={btn(C.border, { fontSize: 13 })}>Review cards</button>
            <button onClick={() => { setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 }); }} style={btn(C.purple, { fontSize: 13 })}>Retry test</button>
            <button onClick={load} style={btn(C.teal, { fontSize: 13 })}>New topic</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LISTENING MODULE
// ══════════════════════════════════════════════════════════════════════════════
function ListeningModule({ addXP, sessionMode, onSessionDone }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState(-1);
  const [mode, setMode] = useState("listen");
  const [tests, setTests] = useState([]);
  const [tIdx, setTIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [done, setDone] = useState(false);
  const playRef = useRef(false);

  async function load() {
    setLoading(true); setData(null); setRevealed(false); setMode("listen");
    setDone(false); setScore({ c: 0, t: 0 }); stopSpeech();
    playRef.current = false; setPlaying(false); setActiveLine(-1);
    const raw = await askClaude(`Create a 6-line dialogue between two US supply chain professionals. Use natural native American English: contractions, phrasal verbs, idioms, fillers like "alright","so basically","I mean","you know".
Return ONLY this JSON object:
{"title":"...","context":"...one sentence scene...","speakers":["Name (role)","Name (role)"],"lines":[{"speaker":"...","text":"...","note":"...optional short Spanish note only if very tricky..."}],"keyPhrases":[{"phrase":"...","spanish":"..."}],"tests":[{"q":"...comprehension or meaning question in English...","opts":["...correct...","...wrong...","...wrong...","...wrong..."],"ans":0}]}
Include 4 test questions. ans is always 0 (the first option is always correct — I will shuffle them).`, 1600);
    try {
      const parsed = JSON.parse(raw);
      const normalized = (parsed.tests || []).map(t => {
        const correct = t.opts[0];
        const shuffled = shuffle(t.opts);
        return { ...t, opts: shuffled, ans: shuffled.indexOf(correct) };
      });
      setData({ ...parsed, tests: normalized });
      setTests(normalized);
    } catch { setData(null); }
    setLoading(false);
  }

  function playAll() {
    if (!data || playing) return;
    setPlaying(true); playRef.current = true;
    let i = 0;
    function next() {
      if (!playRef.current || i >= data.lines.length) { setPlaying(false); setActiveLine(-1); playRef.current = false; return; }
      setActiveLine(i);
      speak(data.lines[i].text, () => { i++; setTimeout(next, 380); });
    }
    next();
  }
  function stop() { playRef.current = false; stopSpeech(); setPlaying(false); setActiveLine(-1); }

  function answer(i) {
    if (answered !== null) return;
    const correct = i === tests[tIdx].ans;
    setAnswered(i);
    setScore(s => ({ c: s.c + (correct ? 1 : 0), t: s.t + 1 }));
    if (correct) addXP(10);
  }
  function nextQ() {
    if (tIdx + 1 >= tests.length) { setDone(true); if (sessionMode && onSessionDone) onSessionDone(score.c); return; }
    setTIdx(i => i + 1); setAnswered(null);
  }

  useEffect(() => { if (sessionMode) load(); }, [sessionMode]);
  useEffect(() => () => { playRef.current = false; stopSpeech(); }, []);

  const t = tests[tIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!sessionMode && (
        <button onClick={load} disabled={loading} style={btn(C.teal)}>
          {loading ? "⏳ Generating…" : "✦ New Dialogue"}
        </button>
      )}
      {loading && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Creating dialogue…</div>}

      {data && mode === "listen" && (
        <>
          <div style={cardStyle(false, { padding: "11px 14px" })}>
            <div style={{ fontSize: 10, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Scene</div>
            <div style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5 }}>{data.context}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
              {(data.speakers || []).map(s => (
                <span key={s} style={{ fontSize: 10, background: C.border, color: C.hint, padding: "2px 9px", borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={playing ? stop : playAll} style={btn(playing ? "#7f1d1d" : C.blue)}>{playing ? "⏹ Stop" : "▶ Play"}</button>
            <button onClick={() => setRevealed(r => !r)} style={btn(C.border)}>{revealed ? "🙈 Hide" : "📄 Transcript"}</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(data.lines || []).map((line, i) => {
              const left = i % 2 === 0;
              const active = activeLine === i;
              return (
                <div key={i} style={{ display: "flex", flexDirection: left ? "row" : "row-reverse" }}>
                  <div style={{
                    background: active ? (left ? "#0c3a5e" : "#064035") : (left ? C.card : "#090f18"),
                    border: `1px solid ${active ? "#38bdf8" : C.border}`,
                    borderRadius: 11, padding: "9px 12px", maxWidth: "82%", transition: "all .2s",
                  }}>
                    <div style={{ fontSize: 10, color: C.hint, marginBottom: 2 }}>{line.speaker}</div>
                    {revealed
                      ? <div style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 1.55 }}>{line.text}</div>
                      : <div style={{ fontSize: 13, color: "#2a3a50", fontStyle: "italic" }}>🎧 Listen first…</div>
                    }
                    {revealed && line.note && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>💡 {line.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {revealed && (data.keyPhrases || []).length > 0 && (
            <div style={cardStyle(false, { padding: "12px 14px" })}>
              <div style={{ fontSize: 10, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Key Phrases</div>
              {data.keyPhrases.map((kp, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, color: C.text, fontWeight: 700 }}>"{kp.phrase}"</span>
                  <span style={{ fontSize: 13, color: C.hint }}>→ {kp.spanish}</span>
                  <button onClick={() => speak(kp.phrase)} style={btn("#0a121e", { fontSize: 11, padding: "3px 8px" })}>🔊</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setMode("test"); setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 }); }} style={btn(C.purple, { marginTop: 4 })}>
            🧠 Context Test
          </button>
        </>
      )}

      {data && mode === "test" && !done && t && (
        <>
          <ProgBar val={tIdx} max={tests.length} color={C.purple} />
          <div style={{ fontSize: 11, color: C.hint }}>{tIdx + 1} / {tests.length} · ✅ {score.c}</div>
          <MCQ question={t.q} sublabel="Comprehension" opts={t.opts} ans={t.ans} answered={answered} onAnswer={answer} />
          {answered !== null && (
            <Feedback correct={answered === t.ans} hint={answered !== t.ans ? `Answer: "${t.opts[t.ans]}"` : "+10 XP"} onNext={nextQ} />
          )}
        </>
      )}

      {data && mode === "test" && done && !sessionMode && (
        <div style={cardStyle(true, { textAlign: "center", padding: 26 })}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>{score.c >= score.t * .7 ? "🎉" : "💪"}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{score.c}/{score.t}</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 5 }}>
            {score.c >= score.t * .8 ? "You understood the context perfectly!" : "Listen again and try to catch the details."}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={() => { setMode("listen"); setRevealed(false); }} style={btn(C.border, { fontSize: 13 })}>Back to dialogue</button>
            <button onClick={() => { setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 }); }} style={btn(C.purple, { fontSize: 13 })}>Retry</button>
            <button onClick={load} style={btn(C.teal, { fontSize: 13 })}>New dialogue</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PHRASES MODULE  (fixed: two separate API calls — simple then tests)
// ══════════════════════════════════════════════════════════════════════════════
function PhrasesModule({ addXP, sessionMode, onSessionDone }) {
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(null);
  const [mode, setMode] = useState("browse");
  const [tests, setTests] = useState([]);
  const [tIdx, setTIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [score, setScore] = useState({ c: 0, t: 0 });
  const [done, setDone] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);

  async function load() {
    setLoading(true); setPhrases([]); setOpen(null); setMode("browse"); setDone(false); setTests([]);
    // Step 1: simple phrases (no nested test data — this is what was failing)
    const raw = await askClaude(`Generate 6 English phrases native US supply chain professionals actually use daily. Pick ONE specific theme: meetings, emails, negotiations, or status updates.
Return ONLY a JSON array. Keep it simple — no nested objects inside objects:
[{"phrase":"...","spanish":"...translation...","use":"email|meeting|both","example":"...one work sentence using the phrase...","warning":"...common Spanish-speaker mistake, or empty string if none..."}]`);
    try {
      const data = JSON.parse(raw);
      setPhrases(data);
    } catch { setPhrases([]); }
    setLoading(false);
  }

  async function loadTests(data) {
    setLoadingTests(true);
    const phraseList = data.map((p, i) => `${i + 1}. "${p.phrase}" (means: ${p.spanish})`).join("\n");
    const raw = await askClaude(`Given these 6 supply chain English phrases:
${phraseList}

Generate 8 multiple-choice questions testing understanding of these phrases. Mix question types: when to use it, what it means in context, which situation fits, complete the sentence.
Return ONLY a JSON array:
[{"q":"...question...","context_phrase":"...the phrase being tested...","opts":["...correct answer...","...wrong...","...wrong...","...wrong..."],"ans":0}]
ans is always 0 — correct answer is always first option (I will shuffle).`);
    try {
      const data2 = JSON.parse(raw);
      const normalized = data2.map(t => {
        const correct = t.opts[0];
        const shuffled = shuffle(t.opts);
        return { ...t, opts: shuffled, ans: shuffled.indexOf(correct) };
      });
      setTests(normalized);
    } catch { setTests([]); }
    setLoadingTests(false);
  }

  function startTest() {
    if (tests.length === 0) { loadTests(phrases).then(() => setMode("test")); }
    else setMode("test");
    setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 });
  }

  function answer(i) {
    if (answered !== null) return;
    const correct = i === tests[tIdx].ans;
    setAnswered(i);
    setScore(s => ({ c: s.c + (correct ? 1 : 0), t: s.t + 1 }));
    if (correct) addXP(10);
  }

  function nextQ() {
    if (tIdx + 1 >= tests.length) { setDone(true); if (sessionMode && onSessionDone) onSessionDone(score.c); return; }
    setTIdx(i => i + 1); setAnswered(null);
  }

  useEffect(() => { if (sessionMode) load(); }, [sessionMode]);

  const useColor = { email: "#38bdf8", meeting: "#34d399", both: "#a78bfa" };
  const t = tests[tIdx];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!sessionMode && (
        <button onClick={load} disabled={loading} style={btn(C.teal)}>
          {loading ? "⏳ Loading…" : "✦ New Phrases"}
        </button>
      )}
      {loading && <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: 20 }}>Loading phrases…</div>}

      {phrases.length > 0 && mode === "browse" && (
        <>
          {phrases.map((p, i) => (
            <div key={i} onClick={() => setOpen(open === i ? null : i)}
              style={{ ...cardStyle(open === i), cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>"{p.phrase}"</div>
                  <div style={{ fontSize: 12, color: C.hint, marginTop: 2 }}>{p.spanish}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, background: (useColor[p.use] || "#94a3b8") + "22", color: useColor[p.use] || "#94a3b8", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{p.use}</span>
                  <button onClick={e => { e.stopPropagation(); speak(p.phrase); }} style={btn("#0a121e", { fontSize: 11, padding: "3px 8px" })}>🔊</button>
                </div>
              </div>
              {open === i && (
                <div style={{ marginTop: 11, borderTop: `1px solid ${C.border}`, paddingTop: 11 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontStyle: "italic", lineHeight: 1.6, marginBottom: 9 }}>"{p.example}"</div>
                  <button onClick={e => { e.stopPropagation(); speak(p.example); }} style={btn(C.blue, { fontSize: 12, padding: "6px 12px" })}>🔊 Hear example</button>
                  {p.warning && <div style={{ marginTop: 9, fontSize: 12, color: "#fb923c", background: "#2d1200", borderRadius: 8, padding: "8px 11px" }}>⚠️ {p.warning}</div>}
                </div>
              )}
            </div>
          ))}
          <button onClick={startTest} disabled={loadingTests} style={btn(C.purple, { marginTop: 4 })}>
            {loadingTests ? "⏳ Preparing test…" : "🧠 Start Mini Test"}
          </button>
        </>
      )}

      {mode === "test" && !done && t && (
        <>
          <ProgBar val={tIdx} max={tests.length} color={C.purple} />
          <div style={{ fontSize: 11, color: C.hint }}>{tIdx + 1} / {tests.length} · ✅ {score.c}</div>
          <MCQ
            question={t.q}
            sublabel="Phrases test"
            opts={t.opts}
            ans={t.ans}
            answered={answered}
            onAnswer={answer}
            extra={t.context_phrase && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 13, color: "#7dd3fc", fontWeight: 700 }}>"{t.context_phrase}"</span>
                <button onClick={() => speak(t.context_phrase)} style={btn(C.blue, { fontSize: 11, padding: "3px 9px" })}>🔊</button>
              </div>
            )}
          />
          {answered !== null && (
            <Feedback correct={answered === t.ans} hint={answered !== t.ans ? `Answer: "${t.opts[t.ans]}"` : "+10 XP"} onNext={nextQ} />
          )}
        </>
      )}

      {mode === "test" && done && !sessionMode && (
        <div style={cardStyle(true, { textAlign: "center", padding: 26 })}>
          <div style={{ fontSize: 38, marginBottom: 8 }}>{score.c >= score.t * .7 ? "🎉" : "💪"}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{score.c}/{score.t}</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 5 }}>
            {score.c >= score.t * .8 ? "You're using these phrases like a native!" : "Review and try again."}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
            <button onClick={() => { setMode("browse"); setOpen(null); }} style={btn(C.border, { fontSize: 13 })}>Review</button>
            <button onClick={() => { setTIdx(0); setAnswered(null); setDone(false); setScore({ c: 0, t: 0 }); }} style={btn(C.purple, { fontSize: 13 })}>Retry</button>
            <button onClick={load} style={btn(C.teal, { fontSize: 13 })}>New topic</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SESSION MODE  (~25 min guided session)
// ══════════════════════════════════════════════════════════════════════════════
const SESSION_STEPS = [
  { id: "vocab",     label: "Vocabulary",   icon: "📦", desc: "Learn 5 words + mini test" },
  { id: "listening", label: "Listening",    icon: "🎧", desc: "Dialogue + context test" },
  { id: "phrases",   label: "Phrases",      icon: "💬", desc: "6 phrases + usage test" },
];

function SessionMode({ addXP, onExit }) {
  const [step, setStep] = useState(0);         // 0=intro, 1=vocab, 2=listening, 3=phrases, 4=done
  const [elapsed, setElapsed] = useState(0);
  const [scores, setScores] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function onStepDone(sc) {
    setScores(s => [...s, sc]);
    setStep(s => s + 1);
  }

  const totalXP = scores.reduce((a, b) => a + b, 0) * 10;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Session header */}
      <div style={cardStyle(false, { padding: "12px 15px" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: 1 }}>Daily Session</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2 }}>
              {step === 0 ? "Ready to start" : step <= 3 ? SESSION_STEPS[step - 1].label : "Complete!"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <SessionTimer elapsed={elapsed} />
            <span style={{ fontSize: 11, color: C.hint }}>~25 min session</span>
          </div>
        </div>
        {/* Step dots */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
          {SESSION_STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: step > i + 1 ? C.teal : step === i + 1 ? C.purple : C.border,
                border: `1px solid ${step === i + 1 ? C.purple : "transparent"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, transition: "all .3s",
              }}>
                {step > i + 1 ? "✓" : s.icon}
              </div>
              {i < SESSION_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: step > i + 1 ? C.teal : C.border, borderRadius: 2, transition: "background .3s" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Intro */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SESSION_STEPS.map((s, i) => (
            <div key={i} style={cardStyle(false, { padding: "12px 15px", display: "flex", alignItems: "center", gap: 12 })}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.label}</div>
                <div style={{ fontSize: 12, color: C.hint }}>{s.desc}</div>
              </div>
            </div>
          ))}
          <button onClick={() => setStep(1)} style={btn(C.teal, { marginTop: 4, textAlign: "center" })}>
            ▶ Start 25-min Session
          </button>
          <button onClick={onExit} style={btn(C.border, { fontSize: 13 })}>← Back to modules</button>
        </div>
      )}

      {step === 1 && <VocabModule addXP={addXP} sessionMode onSessionDone={onStepDone} />}
      {step === 2 && <ListeningModule addXP={addXP} sessionMode onSessionDone={onStepDone} />}
      {step === 3 && <PhrasesModule addXP={addXP} sessionMode onSessionDone={onStepDone} />}

      {step === 4 && (
        <div style={cardStyle(true, { textAlign: "center", padding: 28 })}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Session Complete!</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>
            {`${mins}:${String(secs).padStart(2,"0")} min · ${totalXP}+ XP earned`}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
            {scores.map((sc, i) => (
              <div key={i} style={{ background: C.border, borderRadius: 9, padding: "8px 14px", fontSize: 13, color: C.text }}>
                {SESSION_STEPS[i].icon} {sc > 0 ? `${sc * 10} XP` : "0 XP"}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#4ade80", marginTop: 16 }}>
            {scores.reduce((a, b) => a + b, 0) >= 15 ? "Outstanding session! You're on track." : "Good work. Come back tomorrow to keep the streak!"}
          </div>
          <button onClick={onExit} style={btn(C.teal, { marginTop: 20 })}>← Back to modules</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP
// ══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "session",   icon: "⚡", label: "Session"    },
  { id: "vocab",     icon: "📦", label: "Vocabulary" },
  { id: "listening", icon: "🎧", label: "Listening"  },
  { id: "phrases",   icon: "💬", label: "Phrases"    },
];

export default function App() {
  const [tab, setTab] = useState("session");
  const [xp, setXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sessionKey, setSessionKey] = useState(0);

  function addXP(n) {
    setXP(x => x + n);
    setStreak(s => s + 1);
  }

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.getVoices();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.dark, color: C.text, fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button:disabled { opacity: .4; cursor: not-allowed; }
        button:not(:disabled):active { opacity: .72; transform: scale(.97); }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #162030; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#050c17", borderBottom: `1px solid ${C.border}`, padding: "14px 16px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#0ea5e9", textTransform: "uppercase" }}>Supply Chain · B1→B2</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.3 }}>English Pro Coach 🎧</div>
            </div>
          </div>
          <XPBar xp={xp} streak={streak} />
          <div style={{ display: "flex", borderTop: `1px solid ${C.border}` }}>
            {TABS.map(m => (
              <button key={m.id} onClick={() => setTab(m.id)} style={{
                flex: 1, background: "none", border: "none",
                borderBottom: `2px solid ${tab === m.id ? "#0ea5e9" : "transparent"}`,
                color: tab === m.id ? C.text : C.muted,
                padding: "7px 0 10px", fontSize: 10, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit", transition: "all .2s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, letterSpacing: .3,
              }}>
                <span style={{ fontSize: 16 }}>{m.icon}</span>
                {m.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "18px 14px" }}>
        {tab === "session"   && <SessionMode key={sessionKey} addXP={addXP} onExit={() => setTab("vocab")} />}
        {tab === "vocab"     && <VocabModule addXP={addXP} />}
        {tab === "listening" && <ListeningModule addXP={addXP} />}
        {tab === "phrases"   && <PhrasesModule addXP={addXP} />}
      </div>
    </div>
  );
}

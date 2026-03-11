import { useState, useEffect, useRef } from "react";

const Y = "#F5C800", BK = "#1A1A1A", DG = "#222", MG = "#777";

const SYSTEM_PROMPT = `당신은 일반고 학생의 수시면접을 코칭하는 AI입니다.
PREP 또는 STAR 기법으로 작성된 답변을 분석해 JSON으로만 응답하세요. 마크다운 없이 순수 JSON만 출력하세요.
{
  "scores": { "logic": <1-10>, "specificity": <1-10>, "technique": <1-10>, "expression": <1-10> },
  "strengths": ["잘한 점 1", "잘한 점 2"],
  "improvements": ["개선점 1 (방법 포함)", "개선점 2"],
  "tip": "핵심 조언 1~2문장",
  "improved_answer": "개선된 답변 전문 (완성형)"
}`;

const QBANK = {
  PREP: {
    "지원동기·진로": [
      "우리 학과에 지원한 이유는 무엇인가요?",
      "본인의 강점이 이 학과에서 어떻게 발휘될 수 있을까요?",
      "10년 후 본인의 모습을 구체적으로 말해보세요.",
      "관심 있는 학문 분야와 그 이유를 설명해보세요.",
    ],
    "가치관·인성": [
      "좋은 리더의 조건은 무엇이라고 생각하나요?",
      "협력과 경쟁 중 어느 것이 더 중요하다고 생각하나요?",
      "실패를 대하는 본인만의 태도를 말해보세요.",
      "AI 시대에 인간에게 가장 중요한 역량은 무엇일까요?",
    ],
    "사회·시사": [
      "환경 문제 해결을 위해 개인과 사회는 각각 어떤 역할을 해야 할까요?",
      "청소년의 사회 참여가 왜 중요하다고 생각하나요?",
      "독서가 왜 중요하다고 생각하나요?",
    ],
  },
  STAR: {
    "협력·리더십": [
      "팀 활동에서 갈등을 해결하거나 팀을 이끈 경험을 말해보세요.",
      "공동의 목표를 위해 자신의 의견을 조율한 경험이 있나요?",
      "처음 만나는 사람들과 협력하여 성과를 낸 경험이 있나요?",
    ],
    "도전·성취": [
      "목표를 세우고 끝까지 노력해서 이뤄낸 경험을 말해보세요.",
      "실패를 경험했지만 포기하지 않고 재도전한 사례가 있나요?",
      "자신의 단점을 인식하고 개선하기 위해 노력한 경험이 있나요?",
    ],
    "학교생활·탐구": [
      "교과 수업 중 가장 흥미롭게 탐구했던 주제와 과정을 말해보세요.",
      "동아리 활동에서 기억에 남는 경험을 구체적으로 말해보세요.",
      "봉사 또는 진로 탐색 활동에서 배운 점을 이야기해보세요.",
    ],
  },
};

const PREP_INFO = [
  { key:"P1", label:"P — Point",   color:"#F5C800", desc:"결론·주장 먼저",   ex:"저는 ○○학과에 진학하여 ～가 되고 싶습니다." },
  { key:"R",  label:"R — Reason",  color:"#FFD740", desc:"이유 2가지 이상",  ex:"왜냐하면 첫째 ～, 둘째 ～이기 때문입니다." },
  { key:"E",  label:"E — Example", color:"#FFC107", desc:"생기부 구체 사례", ex:"실제로 ○○활동에서 ～한 경험이 있습니다." },
  { key:"P2", label:"P — Point",   color:"#FFB300", desc:"결론 재강조·포부", ex:"따라서 귀 학과에서 ～하겠습니다." },
];
const STAR_INFO = [
  { key:"S", label:"S — Situation", color:"#F5C800", desc:"상황·배경",        ex:"2학년 때 동아리에서 ○○대회를 준비하던 중 ～한 상황이었습니다." },
  { key:"T", label:"T — Task",      color:"#FFD740", desc:"나의 역할·어려움", ex:"저는 팀장으로서 ～을 해결해야 했습니다." },
  { key:"A", label:"A — Action",    color:"#FFC107", desc:"내가 한 구체 행동",ex:"저는 매일 ～하고, ～했습니다." },
  { key:"R", label:"R — Result",    color:"#FFB300", desc:"결과·배운 점",     ex:"결과적으로 ～을 이루었고, ～을 배웠습니다." },
];

function ScoreBar({ label, score }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(score * 10), 150); return () => clearTimeout(t); }, [score]);
  const c = score >= 8 ? "#4CAF50" : score >= 6 ? Y : "#FF7043";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 13, color:"#bbb" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: c, fontFamily:"monospace" }}>{score}/10</span>
      </div>
      <div style={{ background:"#333", borderRadius: 99, height: 7, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius: 99, width:`${w}%`, background: c, transition:"width 1.1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function Timer({ seconds }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setLeft(l => {
        if (l <= 1) { clearInterval(ref.current); setRunning(false); return 0; }
        return l - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  const c = left > 30 ? "#4CAF50" : left > 10 ? Y : "#FF5252";
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div style={{ background: DG, borderRadius: 14, padding:"16px 20px", marginBottom: 16, border:`1.5px solid ${c}44` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color:"#aaa" }}>⏱ 1분 스피치 타이머</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: c, fontFamily:"monospace", letterSpacing: 2 }}>{mm}:{ss}</span>
      </div>
      <div style={{ background:"#333", borderRadius: 99, height: 8, overflow:"hidden", marginBottom: 12 }}>
        <div style={{ height:"100%", borderRadius: 99, width:`${(left/seconds)*100}%`, background: c, transition:"width 1s linear" }} />
      </div>
      <div style={{ display:"flex", gap: 8 }}>
        <button onClick={() => setRunning(r => !r)} style={{ flex:1, background: running ? "#3a0000" : "#1a3a1a",
          border:`1.5px solid ${running ? "#FF5252" : "#4CAF50"}`, borderRadius: 8, padding:"8px",
          color: running ? "#FF5252" : "#4CAF50", fontSize: 13, fontWeight: 800, cursor:"pointer", fontFamily:"inherit" }}>
          {running ? "⏸ 일시정지" : left === seconds ? "▶ 시작" : "▶ 계속"}
        </button>
        <button onClick={() => { setLeft(seconds); setRunning(false); }} style={{ background:"#2a2a2a",
          border:"1.5px solid #444", borderRadius: 8, padding:"8px 16px", color:"#888",
          fontSize: 13, fontWeight: 700, cursor:"pointer", fontFamily:"inherit" }}>↺ 리셋</button>
      </div>
    </div>
  );
}

const PEER_ITEMS = [
  { id:"logic",   label:"논리성",   max:5, desc:"주장이 명확하고 이유가 자연스러웠나요?" },
  { id:"example", label:"구체성",   max:5, desc:"구체적인 경험이나 예시가 있었나요?" },
  { id:"tech",    label:"기법활용", max:5, desc:"PREP 또는 STAR 구조가 잘 지켜졌나요?" },
  { id:"voice",   label:"전달력",   max:5, desc:"목소리·속도·자세가 자연스러웠나요?" },
  { id:"eye",     label:"눈맞춤",   max:5, desc:"원고를 보지 않고 면접관을 바라봤나요?" },
  { id:"total",   label:"전체인상", max:5, desc:"전반적으로 합격 가능성이 있다고 느꼈나요?" },
];

function PeerFeedback({ studentName, onDone }) {
  const [scores, setScores] = useState({});
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const total = PEER_ITEMS.reduce((a, b) => a + (scores[b.id] || 0), 0);
  const maxTotal = PEER_ITEMS.reduce((a, b) => a + b.max, 0);
  if (submitted) return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: Y, marginBottom: 8 }}>평가 완료!</div>
      <div style={{ fontSize: 15, color:"#bbb", marginBottom: 6 }}>{studentName} 학생 피드백</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: Y, fontFamily:"monospace" }}>{total} / {maxTotal}점</div>
      {comment && <div style={{ marginTop: 16, background: DG, borderRadius: 12, padding:"14px",
        fontSize: 14, color:"#ddd", textAlign:"left", lineHeight:1.7 }}>💬 {comment}</div>}
      <button onClick={onDone} style={{ marginTop: 24, background: Y, border:"none", borderRadius: 12,
        padding:"14px 32px", fontSize: 15, fontWeight: 900, cursor:"pointer", color: BK, fontFamily:"inherit" }}>닫기</button>
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 900, color:"#fff", marginBottom: 4 }}>
        동료 평가 — <span style={{ color: Y }}>{studentName}</span> 학생
      </div>
      <div style={{ fontSize: 12, color: MG, marginBottom: 20 }}>짝의 발표를 듣고 솔직하게 평가해주세요</div>
      {PEER_ITEMS.map(item => (
        <div key={item.id} style={{ marginBottom: 16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 4 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color:"#ddd" }}>{item.label}</span>
              <span style={{ fontSize: 12, color: MG, marginLeft: 8 }}>{item.desc}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: Y, fontFamily:"monospace" }}>{scores[item.id]||0}/{item.max}</span>
          </div>
          <div style={{ display:"flex", gap: 6 }}>
            {Array.from({ length: item.max }, (_, i) => i + 1).map(v => (
              <button key={v} onClick={() => setScores(s => ({ ...s, [item.id]: v }))}
                style={{ flex:1, height: 36, borderRadius: 8,
                  background: (scores[item.id]||0) >= v ? Y : "#2a2a2a",
                  border:`1.5px solid ${(scores[item.id]||0) >= v ? Y : "#444"}`,
                  cursor:"pointer", color: (scores[item.id]||0) >= v ? BK : "#666",
                  fontSize: 13, fontWeight: 800 }}>{v}</button>
            ))}
          </div>
        </div>
      ))}
      <textarea value={comment} onChange={e => setComment(e.target.value)}
        placeholder="한마디 코멘트 (잘한 점, 응원의 말 등)..." rows={3}
        style={{ width:"100%", background:"#1a1a1a", border:"1.5px solid #3a3a3a", borderRadius: 10,
          padding:"12px 14px", color:"#eee", fontSize: 14, fontFamily:"inherit",
          resize:"vertical", boxSizing:"border-box", outline:"none", marginBottom: 14 }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
        <span style={{ fontSize: 14, color:"#bbb" }}>총점</span>
        <span style={{ fontSize: 22, fontWeight: 900, color: Y, fontFamily:"monospace" }}>{total} / {maxTotal}</span>
      </div>
      <button onClick={() => setSubmitted(true)} disabled={Object.keys(scores).length < PEER_ITEMS.length}
        style={{ width:"100%", background: Object.keys(scores).length >= PEER_ITEMS.length ? Y : "#2a2a2a",
          border:"none", borderRadius: 12, padding:"15px", fontSize: 15, fontWeight: 900,
          cursor: Object.keys(scores).length >= PEER_ITEMS.length ? "pointer" : "not-allowed",
          color: Object.keys(scores).length >= PEER_ITEMS.length ? BK : "#555", fontFamily:"inherit" }}>
        평가 제출
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [technique, setTechnique] = useState(null);
  const [category, setCategory] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showImproved, setShowImproved] = useState(false);
  const [showPeer, setShowPeer] = useState(false);
  const [peerName, setPeerName] = useState("");
  const [err, setErr] = useState("");
  const topRef = useRef();

  useEffect(() => { topRef.current?.scrollIntoView({ behavior:"smooth" }); }, [step]);

  const info = technique === "PREP" ? PREP_INFO : STAR_INFO;
  const fullAnswer = info.map(l => {
    const t = (answers[l.key]||"").trim();
    return t ? `[${l.label}] ${t}` : "";
  }).filter(Boolean).join("\n");
  const canSubmit = info.every(l => (answers[l.key]||"").trim()) && question;

  async function getAI() {
    setLoading(true); setErr(""); setFeedback(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `이름: ${name}\n질문: ${question}\n기법: ${technique}\n\n${fullAnswer}` }]
        }),
      });
      const data = await res.json();
      const raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      setFeedback(JSON.parse(raw));
      setStep("ai");
    } catch {
      setErr("피드백을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  const Header = ({ title, sub, back }) => (
    <div style={{ background: Y, padding:"16px 20px 14px", position:"sticky", top:0, zIndex:50, boxShadow:`0 4px 20px ${Y}33` }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {back && <button onClick={back} style={{ background:"none", border:"none", cursor:"pointer", color:BK, fontSize:20, padding:0 }}>←</button>}
        <div style={{ flex:1 }}>
          {sub && <div style={{ fontSize:11, color:"rgba(0,0,0,.5)", fontWeight:700, letterSpacing:1.5 }}>{sub}</div>}
          <div style={{ fontSize:17, fontWeight:900, color:BK }}>{title}</div>
        </div>
        {name && <div style={{ background:BK, borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:800, color:Y }}>{name}</div>}
      </div>
      <div style={{ display:"flex", gap:4, marginTop:10 }}>
        {["name","guide","select","question","answer","ai","peer"].map((s,i) => (
          <div key={s} style={{ flex:1, height:3, borderRadius:99,
            background: ["name","guide","select","question","answer","ai","peer"].indexOf(step) >= i ? BK : "rgba(0,0,0,.2)",
            transition:"background .3s" }} />
        ))}
      </div>
    </div>
  );

  const card = { background: DG, borderRadius:16, padding:"20px", marginBottom:14 };
  const inp = { width:"100%", background:"#1a1a1a", border:"1.5px solid #3a3a3a", borderRadius:10,
    padding:"12px 14px", color:"#eee", fontSize:14, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none" };
  const btn = (active=true, big=false) => ({
    width:"100%", background: active ? Y : "#2a2a2a", border:"none", borderRadius:12,
    padding: big ? "18px" : "14px", fontSize: big ? 16 : 14, fontWeight:900,
    cursor: active ? "pointer" : "not-allowed", color: active ? BK : "#555",
    fontFamily:"inherit", transition:"all .2s", boxShadow: active ? `0 0 24px ${Y}33` : "none",
  });

  if (step === "name") return (
    <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }} ref={topRef}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:13, fontWeight:800, color:MG, letterSpacing:2, marginBottom:8 }}>교육콘텐츠 전문기업 ㈜삼양문화</div>
          <div style={{ fontSize:36, fontWeight:900, color:Y, lineHeight:1.1, marginBottom:6 }}>AI 수시면접</div>
          <div style={{ fontSize:36, fontWeight:900, color:"#fff", lineHeight:1.1, marginBottom:12 }}>코치</div>
          <div style={{ fontSize:13, color:MG }}>PREP · STAR 기법으로 합격 답변 완성</div>
        </div>
        <div style={{ background:DG, borderRadius:20, padding:"28px 24px" }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#fff", marginBottom:6 }}>시작하기 전에</div>
          <div style={{ fontSize:13, color:MG, marginBottom:20 }}>본인의 이름을 입력해주세요</div>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key==="Enter" && name.trim() && setStep("guide")}
            placeholder="예: 김민준" autoFocus
            style={{ ...inp, fontSize:18, padding:"14px 16px", marginBottom:16, border:`1.5px solid ${name ? Y+"66" : "#3a3a3a"}` }} />
<button onClick={() => name.trim() && setStep("guide")} disabled={!name.trim()}
  style={{ width:"100%", background: name.trim() ? Y : "#333", border: name.trim() ? "none" : `1.5px solid ${Y}`,
    borderRadius:12, padding:"18px", fontSize:16, fontWeight:900,
    cursor: name.trim() ? "pointer" : "not-allowed",
    color: name.trim() ? BK : Y,
    fontFamily:"inherit", transition:"all .3s" }}>
  시작하기 →
</button>
        </div>
      </div>
    </div>
  );

  if (step === "guide") return (
    <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif", paddingBottom:60 }} ref={topRef}>
      <Header title="면접 기법 가이드" sub="시작 전 꼭 읽어보세요" />
      <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ fontSize:15, fontWeight:900, color:"#fff", marginBottom:4 }}>안녕하세요, <span style={{ color:Y }}>{name}</span> 학생! 👋</div>
        <div style={{ fontSize:13, color:MG, marginBottom:24 }}>오늘 사용할 두 가지 면접 기법을 먼저 익혀볼게요.</div>
        {[{ title:"PREP", sub:"의견·가치관을 묻는 질문에 사용", ex:"예) \"지원동기는?\", \"~에 대해 어떻게 생각하나요?\"", info:PREP_INFO },
          { title:"STAR", sub:"경험·사례를 묻는 질문에 사용", ex:"예) \"~한 경험이 있나요?\", \"~을 극복한 사례를 말해보세요\"", info:STAR_INFO }
        ].map(({ title, sub, ex, info:inf }) => (
          <div key={title} style={{ ...card, border:`1.5px solid ${Y}44`, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ background: title==="PREP"?Y:"#fff", color:BK, fontWeight:900, fontSize:18, padding:"4px 14px", borderRadius:99 }}>{title}</div>
              <div style={{ fontSize:13, color:"#aaa" }}>{sub}</div>
            </div>
            <div style={{ fontSize:12, color:MG, marginBottom:10, fontStyle:"italic" }}>{ex}</div>
            {inf.map(p => (
              <div key={p.key} style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:8 }}>
                <div style={{ background:p.color, color:BK, fontSize:11, fontWeight:900,
                  padding:"3px 10px", borderRadius:99, flexShrink:0, minWidth:90, textAlign:"center" }}>{p.label}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#ddd" }}>{p.desc}</div>
                  <div style={{ fontSize:11, color:MG, marginTop:2, fontStyle:"italic" }}>{p.ex}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ background:"#1a1a00", border:`1.5px solid ${Y}44`, borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:800, color:Y, marginBottom:10 }}>💡 어떤 기법을 써야 할지 모르겠을 때</div>
          <div style={{ fontSize:13, color:"#ddd", marginBottom:8 }}>→ 질문에 <b>"경험", "사례", "적이 있나요"</b>가 있으면 → <b style={{color:Y}}>STAR</b></div>
          <div style={{ fontSize:13, color:"#ddd" }}>→ 질문에 <b>"생각", "의견", "이유", "중요성"</b>이 있으면 → <b style={{color:Y}}>PREP</b></div>
        </div>
        <button onClick={() => setStep("select")} style={btn(true, true)}>기법 선택하러 가기 →</button>
      </div>
    </div>
  );

  if (step === "select") return (
    <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif", paddingBottom:60 }} ref={topRef}>
      <Header title="기법 선택" sub="오늘 연습할 기법을 고르세요" back={() => setStep("guide")} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ fontSize:14, color:MG, marginBottom:20 }}>질문 유형을 보고 알맞은 기법을 선택하세요</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          {["PREP","STAR"].map(t => (
            <button key={t} onClick={() => { setTechnique(t); setCategory(null); setQuestion(null); setStep("question"); }}
              style={{ background:DG, border:`2px solid ${Y}33`, borderRadius:16, padding:"28px 16px",
                cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
              <div style={{ fontSize:36, fontWeight:900, color:Y, marginBottom:8 }}>{t}</div>
              <div style={{ fontSize:12, fontWeight:800, color:"#bbb", marginBottom:4 }}>{t==="PREP"?"의견·가치관 질문":"경험·사례 질문"}</div>
              <div style={{ fontSize:11, color:"#555", lineHeight:1.8 }}>{t==="PREP"?"Point → Reason → Example → Point":"Situation → Task → Action → Result"}</div>
            </button>
          ))}
        </div>
        <button onClick={() => setStep("guide")} style={{ ...btn(false), color:MG }}>← 가이드 다시 보기</button>
      </div>
    </div>
  );

  if (step === "question") {
    const cats = Object.keys(QBANK[technique]);
    return (
      <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif", paddingBottom:60 }} ref={topRef}>
        <Header title={`${technique} — 질문 선택`} back={() => setStep("select")} />
        <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ background: category===c?Y:"#2a2a2a", border:"none", borderRadius:20,
                  padding:"7px 16px", cursor:"pointer", color: category===c?BK:"#aaa",
                  fontSize:12, fontWeight: category===c?800:400, fontFamily:"inherit" }}>{c}</button>
            ))}
          </div>
          {category ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {QBANK[technique][category].map((q,i) => (
                <button key={i} onClick={() => { setQuestion(q); setAnswers({}); setStep("answer"); }}
                  style={{ background:"#1e1e1e", border:`1.5px solid #333`, borderRadius:10,
                    padding:"14px 16px", cursor:"pointer", textAlign:"left", color:"#aaa",
                    fontSize:14, fontFamily:"inherit", lineHeight:1.5 }}>{q}</button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"60px 0", color:MG, fontSize:13 }}>위에서 카테고리를 먼저 선택해주세요</div>
          )}
        </div>
      </div>
    );
  }

  if (step === "answer") return (
    <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif", paddingBottom:60 }} ref={topRef}>
      <Header title="답변 작성" sub={`${technique} 기법`} back={() => setStep("question")} />
      <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
        <div style={{ background:"#1a1400", border:`1.5px solid ${Y}55`, borderLeft:`4px solid ${Y}`,
          borderRadius:"0 12px 12px 0", padding:"14px 16px", marginBottom:20 }}>
          <div style={{ fontSize:11, color:Y, fontWeight:800, marginBottom:4, letterSpacing:1 }}>면접 질문</div>
          <div style={{ fontSize:15, color:"#eee", lineHeight:1.6 }}>Q. {question}</div>
        </div>
        <Timer seconds={60} />
        {info.map(l => (
          <div key={l.key} style={{ marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ background:l.color, color:BK, fontSize:11, fontWeight:900, padding:"3px 10px", borderRadius:99 }}>{l.label}</span>
              <span style={{ fontSize:12, color:MG }}>{l.desc}</span>
            </div>
            <div style={{ fontSize:11, color:"#555", marginBottom:6, fontStyle:"italic", paddingLeft:2 }}>예) {l.ex}</div>
            <textarea value={answers[l.key]||""} onChange={e => setAnswers(p => ({...p,[l.key]:e.target.value}))}
              placeholder={`${l.desc}...`} rows={3}
              style={{ ...inp, borderColor: answers[l.key]?l.color+"88":"#3a3a3a" }} />
          </div>
        ))}
        {err && <div style={{ color:"#ff6b6b", fontSize:13, marginBottom:10 }}>{err}</div>}
        <button onClick={getAI} disabled={!canSubmit||loading} style={btn(canSubmit&&!loading, true)}>
          {loading ? "🤖 AI가 분석 중..." : "🤖 AI 피드백 받기"}
        </button>
      </div>
    </div>
  );

  if (step === "ai" && feedback) {
    const avg = Math.round(Object.values(feedback.scores).reduce((a,b)=>a+b,0)/4);
    const grade = avg>=9?["S","#FFD700"]:avg>=7?["A","#4CAF50"]:avg>=5?["B",Y]:["C","#FF7043"];
    return (
      <div style={{ minHeight:"100vh", background:BK, fontFamily:"'Noto Sans KR', sans-serif", paddingBottom:60 }} ref={topRef}>
        <Header title="AI 피드백" sub={`${name} 학생 결과`} />
        <div style={{ maxWidth:600, margin:"0 auto", padding:"24px 20px" }}>
          <div style={{ background:"#1a1400", border:`1px solid ${Y}33`, borderLeft:`4px solid ${Y}`,
            borderRadius:"0 10px 10px 0", padding:"12px 14px", marginBottom:16, fontSize:13, color:"#ccc" }}>Q. {question}</div>
          <div style={{ ...card, border:`2px solid ${Y}44`, textAlign:"center" }}>
            <div style={{ fontSize:11, color:MG, letterSpacing:1, marginBottom:8 }}>종합 점수</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, marginBottom:20 }}>
              <div style={{ fontSize:72, fontWeight:900, color:Y, lineHeight:1, fontFamily:"monospace" }}>{avg}</div>
              <div>
                <div style={{ fontSize:14, color:MG }}>/10</div>
                <div style={{ fontSize:28, fontWeight:900, color:grade[1] }}>등급 {grade[0]}</div>
              </div>
            </div>
            <ScoreBar label="논리성" score={feedback.scores.logic} />
            <ScoreBar label="구체성" score={feedback.scores.specificity} />
            <ScoreBar label="기법 활용" score={feedback.scores.technique} />
            <ScoreBar label="표현력" score={feedback.scores.expression} />
          </div>
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:800, color:"#4CAF50", marginBottom:12 }}>👍 잘한 점</div>
            {feedback.strengths.map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8, fontSize:14, color:"#ddd", lineHeight:1.6 }}>
                <span style={{ color:"#4CAF50", flexShrink:0 }}>✓</span><span>{s}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontSize:13, fontWeight:800, color:"#FF7043", marginBottom:12 }}>💡 개선할 점</div>
            {feedback.improvements.map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8, fontSize:14, color:"#ddd", lineHeight:1.6 }}>
                <span style={{ color:"#FF7043", flexShrink:0 }}>→</span><span>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ background:Y, borderRadius:14, padding:"18px 20px", marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#555", marginBottom:6 }}>🎯 핵심 조언</div>
            <div style={{ fontSize:15, fontWeight:700, color:BK, lineHeight:1.7 }}>{feedback.tip}</div>
          </div>
          <div style={card}>
            <button onClick={() => setShowImproved(v=>!v)} style={{ background:"none", border:"none",
              cursor:"pointer", display:"flex", justifyContent:"space-between", width:"100%", padding:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#aaa" }}>✨ AI가 다듬은 답변 보기</span>
              <span style={{ color:Y, fontSize:16, transform: showImproved?"rotate(180deg)":"none" }}>▼</span>
            </button>
            {showImproved && (
              <div style={{ marginTop:14, padding:"16px", background:"#1a1a1a", borderRadius:10,
                borderLeft:`3px solid ${Y}`, fontSize:14, color:"#ddd", lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                {feedback.improved_answer}
              </div>
            )}
          </div>
          <div style={{ ...card, border:`1.5px solid #ffffff22` }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#fff", marginBottom:8 }}>👥 짝 피드백 (동료 평가)</div>
            <div style={{ fontSize:12, color:MG, marginBottom:14 }}>짝의 발표를 들었나요? 짝의 이름을 입력하고 평가해주세요.</div>
            <input value={peerName} onChange={e => setPeerName(e.target.value)}
              placeholder="평가할 친구 이름 입력..." style={{ ...inp, marginBottom:10 }} />
            <button onClick={() => setShowPeer(true)} disabled={!peerName.trim()} style={btn(!!peerName.trim())}>
              동료 평가 시작하기
            </button>
          </div>
          {showPeer && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:200,
              display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ background:"#1e1e1e", borderRadius:20, padding:"28px 24px",
                width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
                <PeerFeedback studentName={peerName} onDone={() => setShowPeer(false)} />
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button onClick={() => { setAnswers({}); setStep("answer"); }}
              style={{ flex:1, background:DG, border:`1.5px solid ${Y}`, borderRadius:12,
                padding:"14px", fontSize:14, fontWeight:700, cursor:"pointer", color:Y, fontFamily:"inherit" }}>
              같은 질문 다시
            </button>
            <button onClick={() => { setStep("select"); setTechnique(null); setQuestion(null);
              setAnswers({}); setFeedback(null); setShowImproved(false); }}
              style={{ flex:1, background:Y, border:"none", borderRadius:12,
                padding:"14px", fontSize:14, fontWeight:900, cursor:"pointer", color:BK, fontFamily:"inherit" }}>
              새 문제 풀기
            </button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

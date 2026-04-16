import { useState, useEffect, useCallback, useRef } from "react";

// ─── MOCK DATA ───────────────────────────────────────────────
const MOCK_AGENTS = [
  { id: "strategist", name: "전략가", role: "core", model: "sonnet", status: "active", icon: "◆", desc: "방향 · 기획 · 목표", tasks: 3, completed: 1, color: "#00D4AA" },
  { id: "executor", name: "실행가", role: "core", model: "sonnet", desc: "구체적 구현 · 자동 전환", status: "active", icon: "▶", tasks: 5, completed: 3, color: "#4ECDC4" },
  { id: "critic", name: "비판가", role: "core", model: "sonnet", desc: "맹점 · 리스크 · 반론", status: "active", icon: "◎", tasks: 4, completed: 2, color: "#FF6B6B" },
  { id: "designer", name: "디자이너", role: "module", model: "sonnet", desc: "웹·앱 UI/UX", status: "idle", icon: "◇", tasks: 0, completed: 0, color: "#A78BFA" },
  { id: "marketer", name: "마케터", role: "module", model: "sonnet", desc: "공개 · 홍보 전략", status: "off", icon: "▣", tasks: 0, completed: 0, color: "#F59E0B" },
  { id: "bm", name: "BM설계", role: "module", model: "sonnet", desc: "수익 모델 설계", status: "off", icon: "◈", tasks: 0, completed: 0, color: "#EC4899" },
];

const MOCK_TICKETS = [
  { id: "T-001", title: "사용자 페르소나 정의", agent: "strategist", status: "done", priority: "high", created: "2026-04-14", level: "L1" },
  { id: "T-002", title: "핵심 기능 목록 작성", agent: "strategist", status: "in_progress", priority: "high", created: "2026-04-15", level: "L1" },
  { id: "T-003", title: "경쟁사 분석 리포트", agent: "strategist", status: "pending", priority: "medium", created: "2026-04-16", level: "L1" },
  { id: "T-004", title: "프론트엔드 컴포넌트 설계", agent: "executor", status: "done", priority: "high", created: "2026-04-14", level: "L1" },
  { id: "T-005", title: "API 엔드포인트 구현", agent: "executor", status: "done", priority: "high", created: "2026-04-14", level: "L1" },
  { id: "T-006", title: "DB 스키마 설계", agent: "executor", status: "done", priority: "medium", created: "2026-04-15", level: "L1" },
  { id: "T-007", title: "인증 모듈 구현", agent: "executor", status: "in_progress", priority: "high", created: "2026-04-15", level: "L2" },
  { id: "T-008", title: "성능 병목 분석", agent: "executor", status: "in_progress", priority: "medium", created: "2026-04-16", level: "L2" },
  { id: "T-009", title: "보안 취약점 리뷰", agent: "critic", status: "done", priority: "critical", created: "2026-04-14", level: "L1" },
  { id: "T-010", title: "UX 흐름 일관성 검토", agent: "critic", status: "done", priority: "high", created: "2026-04-15", level: "L1" },
  { id: "T-011", title: "규칙 준수 감사", agent: "critic", status: "in_progress", priority: "high", created: "2026-04-15", level: "L2" },
  { id: "T-012", title: "통합 테스트 시나리오", agent: "critic", status: "pending", priority: "medium", created: "2026-04-16", level: "L2" },
];

const MOCK_CHECKPOINTS = [
  { id: "CP1", name: "체크포인트 1", desc: "부서 내부 안 검토", command: "/checkpoint-l1", status: "passed", level: "L1", timestamp: "2026-04-15 14:30", feedback: "전략가 출력 안정. 실행가 DB 스키마 보완 필요 → 피드백 전달 완료." },
  { id: "CP2", name: "체크포인트 2", desc: "부서 간 통합 검토", command: "/checkpoint-l2", status: "in_review", level: "L2", timestamp: null, feedback: null },
  { id: "CP3", name: "체크포인트 3", desc: "사용자 최종 승인", command: "dashboard", status: "waiting", level: "User", timestamp: null, feedback: null },
];

const MOCK_RULES = {
  global: {
    name: "CLAUDE.md",
    type: "전역 규칙",
    rules: [
      { id: "G1", text: "사용자 승인 없이 실행 금지", category: "불변", mutable: false },
      { id: "G2", text: "완결성 · 일관성 · 규칙준수 · 추적가능성", category: "수렴기준", mutable: false },
      { id: "G3", text: "서브에이전트가 규칙을 자동 상속", category: "상속", mutable: false },
      { id: "G4", text: "비판가 N회 연속 맹점 없음 시 수렴 인정", category: "수렴기준", mutable: true },
    ]
  },
  project: {
    name: "PROJECT_CLAUDE.md",
    type: "프로젝트 규칙",
    rules: [
      { id: "P1", text: "L1 수렴: 단일 에이전트 출력 변경량 < 5% · 3회 연속 안정", category: "L1 수렴", mutable: true },
      { id: "P2", text: "L2 수렴: 에이전트 간 충돌 0건 · 통합 변경량 안정", category: "L2 수렴", mutable: true },
      { id: "P3", text: "[슬롯] 경험으로 추가될 기준", category: "경험 슬롯", mutable: true },
    ]
  }
};

const MOCK_BUDGET = {
  gemma: { label: "Gemma (로컬)", cost: 0, unit: "₩", iterations: 847, note: "Ollama 무료" },
  claude: { label: "Claude Code (Max)", cost: 0, unit: "₩", monthly: "정액제", checkpoints: 3, note: "Max 구독 정액" },
  total: { api: 0, infrastructure: 0, subscription: "Max 구독" }
};

const MOCK_LOGS = [
  { ts: "14:32:01", level: "info", agent: "system", msg: "시즌 S01 시작 — 프로젝트 '사이드 프로젝트 MVP' 활성화" },
  { ts: "14:32:05", level: "info", agent: "strategist", msg: "L1 반복 시작 — 사용자 페르소나 정의 착수" },
  { ts: "14:35:12", level: "info", agent: "executor", msg: "L1 반복 시작 — 프론트엔드 컴포넌트 설계" },
  { ts: "14:35:18", level: "info", agent: "critic", msg: "L1 반복 시작 — 보안 취약점 사전 점검" },
  { ts: "14:42:30", level: "warn", agent: "critic", msg: "맹점 감지: 전략가 페르소나에 접근성 고려 누락" },
  { ts: "14:45:00", level: "info", agent: "strategist", msg: "L1 수렴 — 변경량 2.1% · 3회 연속 안정" },
  { ts: "14:48:22", level: "info", agent: "executor", msg: "L1 수렴 — DB 스키마 확정" },
  { ts: "14:50:00", level: "success", agent: "claude", msg: "CP1 통과 — 부서 내부 안 검토 완료" },
  { ts: "14:52:10", level: "info", agent: "system", msg: "L2 크로스 피드백 루프 진입" },
  { ts: "14:55:33", level: "warn", agent: "critic", msg: "전략가-실행가 간 기능 우선순위 충돌 감지" },
  { ts: "14:58:00", level: "info", agent: "executor", msg: "충돌 조율 중 — API 엔드포인트 재설계" },
  { ts: "15:01:45", level: "info", agent: "strategist", msg: "L2 피드백 반영 — 우선순위 재조정 완료" },
];

const MOCK_SEASONS = [
  { id: "S01", name: "사이드 프로젝트 MVP", status: "active", progress: 65, startDate: "2026-04-14" },
];

const MOCK_RETROSPECTIVE = {
  season: "S00 (예시)",
  positives: ["에이전트 간 역할 분리가 명확했음", "비판가의 맹점 탐지가 효과적"],
  improvements: ["L2 수렴까지 시간이 오래 걸림", "마케터 모듈 활용도 낮음"],
  rulesAdded: ["P3: 외부 API 연동 시 반드시 에러 핸들링 포함"]
};

// ─── STYLES ──────────────────────────────────────────────────
const COLORS = {
  bg: "#0A0812",
  surface: "#120F1E",
  surfaceHover: "#1a1530",
  border: "#231B3A",
  borderActive: "#A855F7",
  text: "#E2E8F0",
  textMuted: "#64748B",
  textDim: "#4A3F6B",
  accent: "#A855F7",
  accentSoft: "rgba(168,85,247,0.12)",
  accentGlow: "rgba(168,85,247,0.18)",
  warn: "#F59E0B",
  warnSoft: "rgba(245,158,11,0.12)",
  error: "#EF4444",
  errorSoft: "rgba(239,68,68,0.12)",
  success: "#10B981",
  successSoft: "rgba(16,185,129,0.12)",
  purple: "#7C3AED",
  purpleSoft: "rgba(124,58,237,0.14)",
};

// ─── HELPER COMPONENTS ───────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    active: { label: "활성", bg: COLORS.accentSoft, color: COLORS.accent, dot: COLORS.accent },
    idle: { label: "대기", bg: COLORS.warnSoft, color: COLORS.warn, dot: COLORS.warn },
    off: { label: "OFF", bg: "rgba(100,116,139,0.12)", color: COLORS.textMuted, dot: COLORS.textMuted },
    done: { label: "완료", bg: COLORS.successSoft, color: COLORS.success, dot: COLORS.success },
    in_progress: { label: "진행중", bg: COLORS.accentSoft, color: COLORS.accent, dot: COLORS.accent },
    pending: { label: "대기", bg: COLORS.warnSoft, color: COLORS.warn, dot: COLORS.warn },
    passed: { label: "통과", bg: COLORS.successSoft, color: COLORS.success, dot: COLORS.success },
    in_review: { label: "검토중", bg: COLORS.purpleSoft, color: COLORS.purple, dot: COLORS.purple },
    waiting: { label: "대기", bg: COLORS.warnSoft, color: COLORS.warn, dot: COLORS.warn },
    critical: { label: "긴급", bg: COLORS.errorSoft, color: COLORS.error, dot: COLORS.error },
    high: { label: "높음", bg: COLORS.warnSoft, color: COLORS.warn, dot: COLORS.warn },
    medium: { label: "보통", bg: COLORS.accentSoft, color: COLORS.accent, dot: COLORS.accent },
    low: { label: "낮음", bg: "rgba(100,116,139,0.12)", color: COLORS.textMuted, dot: COLORS.textMuted },
  };
  const s = map[status] || map.off;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, boxShadow: `0 0 6px ${s.dot}` }} />
      {s.label}
    </span>
  );
};

const Card = ({ children, style, onClick, hover }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && hover ? COLORS.surfaceHover : COLORS.surface,
        border: `1px solid ${hovered && hover ? COLORS.borderActive : COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const MetricCard = ({ label, value, sub, icon, color }) => (
  <Card style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: 18, opacity: 0.5 }}>{icon}</span>
    </div>
    <span style={{ fontSize: 28, fontWeight: 700, color: color || COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    {sub && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{sub}</span>}
  </Card>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
    <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, letterSpacing: 0.5, textTransform: "uppercase", margin: 0 }}>{children}</h3>
    {action}
  </div>
);

const TabButton = ({ active, children, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "8px 16px", borderRadius: 8, border: "none",
      background: active ? COLORS.accentSoft : "transparent",
      color: active ? COLORS.accent : COLORS.textMuted,
      fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
    {children}
  </button>
);

const ProgressBar = ({ value, max, color, height = 6 }) => (
  <div style={{ width: "100%", height, borderRadius: height, background: "rgba(255,255,255,0.06)" }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`,
      height: "100%", borderRadius: height,
      background: `linear-gradient(90deg, ${color}, ${color}88)`,
      transition: "width 0.5s ease",
    }} />
  </div>
);

// ─── PAGE: OVERVIEW ──────────────────────────────────────────
const OverviewPage = ({ setPage }) => {
  const totalTasks = MOCK_TICKETS.length;
  const doneTasks = MOCK_TICKETS.filter(t => t.status === "done").length;
  const activeAgents = MOCK_AGENTS.filter(a => a.status === "active").length;
  const currentPhase = MOCK_CHECKPOINTS.find(c => c.status === "in_review") || MOCK_CHECKPOINTS.find(c => c.status === "waiting");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Season Banner */}
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.surface} 0%, rgba(0,212,170,0.05) 100%)`, border: `1px solid ${COLORS.borderActive}30`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${COLORS.accent}08, transparent)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>시즌 {MOCK_SEASONS[0].id}</span>
              <StatusBadge status="active" />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.text }}>{MOCK_SEASONS[0].name}</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.textMuted }}>시작일: {MOCK_SEASONS[0].startDate} · 현재 단계: Level 2 크로스 피드백</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace" }}>{MOCK_SEASONS[0].progress}%</span>
            <ProgressBar value={MOCK_SEASONS[0].progress} max={100} color={COLORS.accent} height={4} />
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <MetricCard label="활성 에이전트" value={activeAgents} sub={`전체 ${MOCK_AGENTS.length}개 중`} icon="◆" color={COLORS.accent} />
        <MetricCard label="완료 태스크" value={`${doneTasks}/${totalTasks}`} sub={`${Math.round(doneTasks/totalTasks*100)}% 완료`} icon="✓" color={COLORS.success} />
        <MetricCard label="API 비용" value="₩0" sub="Gemma 로컬 + Max 구독" icon="◎" color={COLORS.accent} />
        <MetricCard label="현재 단계" value={currentPhase?.id || "—"} sub={currentPhase?.desc} icon="▸" color={COLORS.purple} />
      </div>

      {/* Pipeline Visualization */}
      <Card>
        <SectionTitle>오케스트레이션 파이프라인</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "10px 0" }}>
          {[
            { label: "인풋", icon: "②", status: "done", sub: "아이디어 입력 완료" },
            { label: "L1 반복", icon: "④", status: "done", sub: "부서 내부 수렴" },
            { label: "CP1 감독", icon: "⑤", status: "passed", sub: "통과" },
            { label: "L2 반복", icon: "⑥", status: "in_progress", sub: "크로스 피드백 중" },
            { label: "CP2 감독", icon: "⑦", status: "in_review", sub: "검토 대기" },
            { label: "CP3 승인", icon: "⑧", status: "waiting", sub: "사용자 승인" },
            { label: "실행", icon: "⑨", status: "pending", sub: "대기" },
            { label: "회고", icon: "⑩", status: "pending", sub: "대기" },
          ].map((step, i, arr) => {
            const colorMap = { done: COLORS.success, passed: COLORS.success, in_progress: COLORS.accent, in_review: COLORS.purple, waiting: COLORS.warn, pending: COLORS.textDim };
            const c = colorMap[step.status] || COLORS.textDim;
            const isActive = step.status === "in_progress" || step.status === "in_review";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 90,
                  opacity: step.status === "pending" ? 0.35 : 1,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? `${c}20` : step.status === "done" || step.status === "passed" ? `${c}15` : "rgba(255,255,255,0.03)",
                    border: `2px solid ${isActive ? c : step.status === "done" || step.status === "passed" ? `${c}50` : COLORS.border}`,
                    fontSize: 16, color: c, fontWeight: 700,
                    boxShadow: isActive ? `0 0 16px ${c}30` : "none",
                    animation: isActive ? "pulse 2s ease-in-out infinite" : "none",
                  }}>
                    {step.status === "done" || step.status === "passed" ? "✓" : step.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c, textAlign: "center" }}>{step.label}</span>
                  <span style={{ fontSize: 9, color: COLORS.textMuted, textAlign: "center" }}>{step.sub}</span>
                </div>
                {i < arr.length - 1 && (
                  <div style={{
                    width: 30, height: 2, margin: "0 2px",
                    background: step.status === "done" || step.status === "passed" ? c : COLORS.border,
                    marginBottom: 30,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two Column: Agents + Logs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Agent Status */}
        <Card>
          <SectionTitle action={<button onClick={() => setPage("agents")} style={{ background: "none", border: "none", color: COLORS.accent, fontSize: 12, cursor: "pointer" }}>전체 보기 →</button>}>에이전트 현황</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK_AGENTS.filter(a => a.role === "core").map(agent => (
              <div key={agent.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.02)",
                border: `1px solid ${COLORS.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, color: agent.color }}>{agent.icon}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{agent.name}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: 8 }}>{agent.desc}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>{agent.completed}/{agent.tasks} 태스크</span>
                  <StatusBadge status={agent.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Logs */}
        <Card>
          <SectionTitle action={<button onClick={() => setPage("logs")} style={{ background: "none", border: "none", color: COLORS.accent, fontSize: 12, cursor: "pointer" }}>전체 로그 →</button>}>실시간 로그</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 240, overflowY: "auto" }}>
            {MOCK_LOGS.slice(-8).reverse().map((log, i) => {
              const lc = { info: COLORS.textMuted, warn: COLORS.warn, success: COLORS.success, error: COLORS.error };
              return (
                <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", borderRadius: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", background: i === 0 ? "rgba(0,212,170,0.04)" : "transparent" }}>
                  <span style={{ color: COLORS.textDim, minWidth: 60 }}>{log.ts}</span>
                  <span style={{ color: lc[log.level] || COLORS.textMuted, minWidth: 16 }}>
                    {log.level === "warn" ? "⚠" : log.level === "success" ? "✓" : log.level === "error" ? "✗" : "·"}
                  </span>
                  <span style={{ color: COLORS.textMuted, minWidth: 60 }}>[{log.agent}]</span>
                  <span style={{ color: COLORS.text }}>{log.msg}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── PAGE: AGENTS ────────────────────────────────────────────
const AgentsPage = () => {
  const [selected, setSelected] = useState(null);
  const [moduleStates, setModuleStates] = useState(
    Object.fromEntries(MOCK_AGENTS.filter(a => a.role === "module").map(a => [a.id, a.status !== "off"]))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle>코어 에이전트 (항상 ON)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {MOCK_AGENTS.filter(a => a.role === "core").map(agent => (
          <Card key={agent.id} hover onClick={() => setSelected(selected === agent.id ? null : agent.id)}
            style={{ borderColor: selected === agent.id ? agent.color : COLORS.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `${agent.color}15`, border: `1px solid ${agent.color}30`, fontSize: 20, color: agent.color }}>{agent.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{agent.desc}</div>
                </div>
              </div>
              <StatusBadge status={agent.status} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>태스크 진행률</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{agent.completed}/{agent.tasks}</span>
            </div>
            <ProgressBar value={agent.completed} max={agent.tasks || 1} color={agent.color} />
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: COLORS.textMuted }}>{agent.model}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: COLORS.textMuted }}>claude/agents/core/{agent.id}.md</span>
            </div>
            {selected === agent.id && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 8, background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>할당된 태스크</div>
                {MOCK_TICKETS.filter(t => t.agent === agent.id).map(t => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11, borderBottom: `1px solid ${COLORS.border}30` }}>
                    <span style={{ color: COLORS.textMuted }}>{t.id}</span>
                    <span style={{ color: COLORS.text, flex: 1, marginLeft: 8 }}>{t.title}</span>
                    <StatusBadge status={t.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <SectionTitle>선택 모듈</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {MOCK_AGENTS.filter(a => a.role === "module").map(agent => (
          <Card key={agent.id} style={{ opacity: moduleStates[agent.id] ? 1 : 0.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, color: agent.color }}>{agent.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{agent.desc}</div>
                </div>
              </div>
              {/* Toggle Switch */}
              <div
                onClick={(e) => { e.stopPropagation(); setModuleStates(s => ({ ...s, [agent.id]: !s[agent.id] })); }}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                  background: moduleStates[agent.id] ? COLORS.accent : COLORS.border,
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  position: "absolute", top: 3, left: moduleStates[agent.id] ? 23 : 3,
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── PAGE: TICKETS ───────────────────────────────────────────
const TicketsPage = () => {
  const [filter, setFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const filtered = MOCK_TICKETS.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (levelFilter !== "all" && t.level !== levelFilter) return false;
    return true;
  });

  const columns = { pending: "대기", in_progress: "진행중", done: "완료" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[["all", "전체"], ["pending", "대기"], ["in_progress", "진행중"], ["done", "완료"]].map(([v, l]) => (
          <TabButton key={v} active={filter === v} onClick={() => setFilter(v)}>{l} ({v === "all" ? MOCK_TICKETS.length : MOCK_TICKETS.filter(t => t.status === v).length})</TabButton>
        ))}
        <div style={{ width: 1, background: COLORS.border, margin: "0 4px" }} />
        {[["all", "전체 레벨"], ["L1", "L1"], ["L2", "L2"]].map(([v, l]) => (
          <TabButton key={v} active={levelFilter === v} onClick={() => setLevelFilter(v)}>{l}</TabButton>
        ))}
      </div>

      {filter === "all" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {Object.entries(columns).map(([status, label]) => {
            const col = filtered.filter(t => t.status === status);
            return (
              <div key={status}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                  <StatusBadge status={status} />
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>({col.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.map(t => {
                    const agent = MOCK_AGENTS.find(a => a.id === t.agent);
                    return (
                      <Card key={t.id} hover style={{ padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{t.id}</span>
                          <StatusBadge status={t.priority} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>{t.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ color: agent?.color, fontSize: 12 }}>{agent?.icon}</span>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{agent?.name}</span>
                          </div>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: COLORS.textMuted }}>{t.level}</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(t => {
            const agent = MOCK_AGENTS.find(a => a.id === t.agent);
            return (
              <Card key={t.id} hover style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace", minWidth: 48 }}>{t.id}</span>
                  <span style={{ color: agent?.color, fontSize: 14 }}>{agent?.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{t.title}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: COLORS.textMuted }}>{t.level}</span>
                  <StatusBadge status={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── PAGE: CHECKPOINTS ───────────────────────────────────────
const CheckpointsPage = () => {
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectTarget, setRejectTarget] = useState("L2");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Checkpoint Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {MOCK_CHECKPOINTS.map(cp => {
          const isActive = cp.status === "in_review" || cp.status === "waiting";
          const color = cp.status === "passed" ? COLORS.success : cp.status === "in_review" ? COLORS.purple : COLORS.warn;
          return (
            <Card key={cp.id} style={{ borderColor: isActive ? color : COLORS.border, position: "relative", overflow: "hidden" }}>
              {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}50)` }} />}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{cp.id}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{cp.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{cp.desc}</div>
                </div>
                <StatusBadge status={cp.status} />
              </div>
              {cp.command && (
                <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace", display: "inline-block", marginBottom: 12 }}>
                  {cp.command}
                </div>
              )}
              {cp.timestamp && <div style={{ fontSize: 11, color: COLORS.textMuted }}>완료: {cp.timestamp}</div>}
              {cp.feedback && (
                <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: `${COLORS.success}08`, border: `1px solid ${COLORS.success}20`, fontSize: 12, color: COLORS.text }}>
                  {cp.feedback}
                </div>
              )}
              <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 8 }}>
                검사 항목: 완결성 · 일관성 · 규칙 준수 · 추적가능성{cp.level === "L2" ? " · 충돌 해결" : ""}
              </div>
            </Card>
          );
        })}
      </div>

      {/* CP3 User Approval Gate */}
      <Card style={{ border: `1px solid ${COLORS.warn}30`, background: `linear-gradient(135deg, ${COLORS.surface} 0%, ${COLORS.warnSoft} 100%)` }}>
        <SectionTitle>⑧ 사용자 최종 승인 게이트 (CP3)</SectionTitle>
        <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
          Claude Code가 정리한 통합 제안서를 검토하고 승인 또는 거절합니다.
        </p>
        <div style={{ padding: 16, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>통합 제안서 미리보기</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8 }}>
            CP2 통과 후 Claude Code가 작성한 최종 제안서가 여기에 렌더링됩니다.<br />
            현재 상태: L2 크로스 피드백 진행 중 — CP2 검토 대기
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>승인/거절 코멘트</label>
          <textarea
            value={approvalNote}
            onChange={e => setApprovalNote(e.target.value)}
            placeholder="피드백을 입력하세요..."
            style={{
              width: "100%", height: 70, padding: 12, borderRadius: 8,
              background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}`,
              color: COLORS.text, fontSize: 12, resize: "none", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button disabled style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: COLORS.success, color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "not-allowed", opacity: 0.5,
          }}>
            ✓ 승인 → 실행
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button disabled style={{
              padding: "10px 20px", borderRadius: 8, border: `1px solid ${COLORS.error}50`,
              background: COLORS.errorSoft, color: COLORS.error, fontSize: 13, fontWeight: 600,
              cursor: "not-allowed", opacity: 0.5,
            }}>
              ✗ 거절
            </button>
            <select
              value={rejectTarget}
              onChange={e => setRejectTarget(e.target.value)}
              style={{
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, fontSize: 11,
              }}
            >
              <option value="L2">→ 거절A: L2 재진입 (미세조정)</option>
              <option value="INPUT">→ 거절B: 인풋 재진입 (방향전환)</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── PAGE: RULES ─────────────────────────────────────────────
const RulesPage = () => {
  const [tab, setTab] = useState("global");
  const data = tab === "global" ? MOCK_RULES.global : MOCK_RULES.project;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <TabButton active={tab === "global"} onClick={() => setTab("global")} icon="◆">CLAUDE.md (전역)</TabButton>
        <TabButton active={tab === "project"} onClick={() => setTab("project")} icon="◇">PROJECT_CLAUDE.md (프로젝트)</TabButton>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{data.name}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{data.type} · 자동 상속</div>
          </div>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: "rgba(0,0,0,0.3)", color: COLORS.accent, fontFamily: "'JetBrains Mono', monospace" }}>
            .claude/{data.name}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.rules.map(rule => (
            <div key={rule.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
              borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
                color: rule.mutable ? COLORS.accent : COLORS.error, minWidth: 28,
              }}>{rule.id}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.text }}>{rule.text}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 4, background: rule.mutable ? COLORS.accentSoft : COLORS.errorSoft, color: rule.mutable ? COLORS.accent : COLORS.error }}>
                    {rule.mutable ? "수정 가능" : "불변"}
                  </span>
                  <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: COLORS.textMuted }}>
                    {rule.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>수렴 기준 프레임워크</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 8, background: `${COLORS.accent}06`, border: `1px solid ${COLORS.accent}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent, marginBottom: 8 }}>L1 수렴 (부서 내부)</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
              <li>단일 에이전트 출력 변경량 감소</li>
              <li>N회 연속 안정 시 자동 종료</li>
              <li>비판가 맹점 0건 연속</li>
            </ul>
          </div>
          <div style={{ padding: 16, borderRadius: 8, background: `${COLORS.purple}06`, border: `1px solid ${COLORS.purple}20` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.purple, marginBottom: 8 }}>L2 수렴 (부서 간)</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
              <li>에이전트 간 충돌 해소</li>
              <li>통합 변경량 안정</li>
              <li>피드백 반복 패턴 감지 → 종료</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── PAGE: BUDGET ────────────────────────────────────────────
const BudgetPage = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      <MetricCard label="Gemma 반복 비용" value="₩0" sub={`${MOCK_BUDGET.gemma.iterations}회 반복 · Ollama 로컬`} icon="◎" color={COLORS.accent} />
      <MetricCard label="Claude Code" value="정액" sub={`체크포인트 ${MOCK_BUDGET.claude.checkpoints}회 · Max 구독`} icon="◆" color={COLORS.purple} />
      <MetricCard label="API 과금" value="₩0" sub="v3 아키텍처: API 비용 없음" icon="✓" color={COLORS.success} />
    </div>

    <Card>
      <SectionTitle>비용 구조 상세</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { phase: "L1 반복 (부서 내부)", engine: "Gemma via Ollama", cost: "무료", detail: "로컬 GPU 실행", color: COLORS.accent },
          { phase: "L2 반복 (부서 간)", engine: "Gemma via Ollama", cost: "무료", detail: "로컬 GPU 실행", color: COLORS.accent },
          { phase: "CP1 감독", engine: "Claude Code", cost: "정액", detail: "Max 구독 포함", color: COLORS.purple },
          { phase: "CP2 감독", engine: "Claude Code", cost: "정액", detail: "Max 구독 포함", color: COLORS.purple },
          { phase: "CP3 승인", engine: "대시보드 UI", cost: "무료", detail: "사용자 직접 조작", color: COLORS.warn },
          { phase: "실행", engine: "Claude Code", cost: "정액", detail: "Bash, Write, Edit", color: COLORS.purple },
          { phase: "회고", engine: "Claude Code", cost: "정액", detail: "경험 기준 업데이트", color: COLORS.purple },
        ].map((row, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "2fr 1.5fr 0.8fr 2fr",
            gap: 12, alignItems: "center", padding: "10px 16px",
            borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: row.color }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{row.phase}</span>
            </div>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>{row.engine}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: row.cost === "무료" ? COLORS.accent : COLORS.purple, fontFamily: "'JetBrains Mono', monospace" }}>{row.cost}</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{row.detail}</span>
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <SectionTitle>Gemma 반복 통계</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {MOCK_AGENTS.filter(a => a.role === "core").map(agent => (
          <div key={agent.id} style={{ padding: 16, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ color: agent.color, fontSize: 16 }}>{agent.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{agent.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>L1 반복</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(Math.random() * 200 + 100)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>L2 반복</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{Math.floor(Math.random() * 150 + 50)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

// ─── PAGE: LOGS ──────────────────────────────────────────────
const LogsPage = () => {
  const [logFilter, setLogFilter] = useState("all");
  const filtered = logFilter === "all" ? MOCK_LOGS : MOCK_LOGS.filter(l => l.level === logFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["all", "info", "warn", "success", "error"].map(f => (
          <TabButton key={f} active={logFilter === f} onClick={() => setLogFilter(f)}>
            {f === "all" ? "전체" : f}
          </TabButton>
        ))}
      </div>
      <Card style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 600, overflowY: "auto" }}>
          {filtered.map((log, i) => {
            const lc = { info: COLORS.textMuted, warn: COLORS.warn, success: COLORS.success, error: COLORS.error };
            const agent = MOCK_AGENTS.find(a => a.id === log.agent);
            return (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "8px 12px", borderRadius: 6,
                background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                fontSize: 12,
              }}>
                <span style={{ color: COLORS.textDim, minWidth: 70 }}>{log.ts}</span>
                <span style={{
                  minWidth: 50, textAlign: "center", padding: "0 6px", borderRadius: 3,
                  background: `${lc[log.level]}12`, color: lc[log.level],
                  fontSize: 10, fontWeight: 600, lineHeight: "20px",
                }}>{log.level.toUpperCase()}</span>
                <span style={{ color: agent?.color || COLORS.textMuted, minWidth: 70 }}>[{log.agent}]</span>
                <span style={{ color: COLORS.text, flex: 1 }}>{log.msg}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ─── PAGE: RETROSPECTIVE ─────────────────────────────────────
const RetrospectivePage = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    <Card style={{ background: `linear-gradient(135deg, ${COLORS.surface} 0%, rgba(139,92,246,0.05) 100%)`, border: `1px solid ${COLORS.purple}20` }}>
      <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>⑩ 시즌 회고</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.text }}>경험 기준 업데이트 & 아카이브</h2>
      <p style={{ fontSize: 13, color: COLORS.textMuted, margin: "8px 0 0" }}>
        실행 결과 평가 · 잘된 점/개선점 기록 · PROJECT_CLAUDE.md 경험 슬롯에 학습 내용 자동 추가 → 아카이브 → 다음 시즌
      </p>
    </Card>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card>
        <SectionTitle>✓ 잘된 점</SectionTitle>
        {MOCK_RETROSPECTIVE.positives.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: i < MOCK_RETROSPECTIVE.positives.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
            <span style={{ color: COLORS.success, fontSize: 14 }}>+</span>
            <span style={{ fontSize: 13, color: COLORS.text }}>{item}</span>
          </div>
        ))}
      </Card>
      <Card>
        <SectionTitle>△ 개선점</SectionTitle>
        {MOCK_RETROSPECTIVE.improvements.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: i < MOCK_RETROSPECTIVE.improvements.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
            <span style={{ color: COLORS.warn, fontSize: 14 }}>△</span>
            <span style={{ fontSize: 13, color: COLORS.text }}>{item}</span>
          </div>
        ))}
      </Card>
    </div>

    <Card>
      <SectionTitle>경험 슬롯 업데이트</SectionTitle>
      <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>회고에서 도출된 새 규칙이 PROJECT_CLAUDE.md에 자동 추가됩니다.</p>
      {MOCK_RETROSPECTIVE.rulesAdded.map((rule, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 6, background: COLORS.accentSoft, border: `1px solid ${COLORS.accent}20` }}>
          <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 11 }}>NEW</span>
          <span style={{ fontSize: 13, color: COLORS.text }}>{rule}</span>
        </div>
      ))}
    </Card>
  </div>
);

// ─── MAIN APP ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", label: "개요", icon: "◈" },
  { id: "agents", label: "에이전트", icon: "◆" },
  { id: "tickets", label: "태스크", icon: "▤" },
  { id: "checkpoints", label: "체크포인트", icon: "◎" },
  { id: "rules", label: "규칙", icon: "⚙" },
  { id: "budget", label: "비용", icon: "◇" },
  { id: "logs", label: "로그", icon: "▸" },
  { id: "retro", label: "회고", icon: "↺" },
];

export default function App() {
  const [page, setPage] = useState("overview");
  const [time, setTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "overview": return <OverviewPage setPage={setPage} />;
      case "agents": return <AgentsPage />;
      case "tickets": return <TicketsPage />;
      case "checkpoints": return <CheckpointsPage />;
      case "rules": return <RulesPage />;
      case "budget": return <BudgetPage />;
      case "logs": return <LogsPage />;
      case "retro": return <RetrospectivePage />;
      default: return <OverviewPage setPage={setPage} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Pretendard', -apple-system, sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${COLORS.textDim}; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(168,85,247,0.25); }
          50% { box-shadow: 0 0 20px rgba(168,85,247,0.5); }
        }
        select, textarea, input { font-family: inherit; }
        select option { background: ${COLORS.surface}; color: ${COLORS.text}; }
      `}</style>

      {/* Sidebar */}
      <nav style={{
        width: sidebarCollapsed ? 60 : 220, minWidth: sidebarCollapsed ? 60 : 220,
        background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column", transition: "all 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarCollapsed ? "20px 10px" : "20px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", gap: 10, justifyContent: sidebarCollapsed ? "center" : "flex-start",
          cursor: "pointer",
        }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`,
            fontSize: 16, fontWeight: 700, color: COLORS.bg,
          }}>
            ◈
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: -0.3 }}>Orchestrator</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>v3 · Claude Code</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: sidebarCollapsed ? "10px" : "10px 14px",
                  borderRadius: 8, border: "none", width: "100%",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  background: active ? COLORS.accentSoft : "transparent",
                  color: active ? COLORS.accent : COLORS.textMuted,
                  fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 15, minWidth: 18, textAlign: "center" }}>{item.icon}</span>
                {!sidebarCollapsed && item.label}
              </button>
            );
          })}
        </div>

        {/* System Status */}
        {!sidebarCollapsed && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${COLORS.border}`, fontSize: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: COLORS.textMuted }}>Ollama</span>
              <span style={{ color: COLORS.success }}>● Connected</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: COLORS.textMuted }}>Claude Code</span>
              <span style={{ color: COLORS.success }}>● Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: COLORS.textMuted }}>Dashboard</span>
              <span style={{ color: COLORS.accent }}>● Live</span>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <header style={{
          height: 56, minHeight: 56, padding: "0 28px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: COLORS.surface,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: 0 }}>
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </h2>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: COLORS.accentSoft, color: COLORS.accent, fontWeight: 600 }}>
              {MOCK_SEASONS[0].id}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {time.toLocaleTimeString("ko-KR")}
            </span>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: COLORS.success,
              boxShadow: `0 0 8px ${COLORS.success}`,
              animation: "pulse 2s ease-in-out infinite",
            }} />
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 28 }}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

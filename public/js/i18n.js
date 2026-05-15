'use strict';
// ═══════════════════════════════════════════════════════
//  CEO SIMULATOR — Internationalization (i18n)
//  Supports: 한국어(ko) · English(en)
// ═══════════════════════════════════════════════════════

// ── Language state ────────────────────────────────────────────────────────────
const LANG = {
  current: (typeof localStorage !== 'undefined' && localStorage.getItem('ceoSimLang')) || 'ko',
};

/** Get a UI string. Falls back to Korean if key not found in current lang. */
function t(key, vars) {
  const dict = UI_STRINGS[LANG.current] || UI_STRINGS.ko;
  let s = dict[key] ?? UI_STRINGS.ko[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  }
  return s;
}

/** Get translated era name. */
function tEraName(eraIdx) {
  return LANG.current === 'en'
    ? (ERA_NAMES_EN[eraIdx] || ERA_NAMES_EN[0])
    : (ERA_NAMES_KO[eraIdx] || ERA_NAMES_KO[0]);
}

/** Get translated era description. */
function tEraDesc(eraIdx) {
  return LANG.current === 'en'
    ? (ERA_DESCS_EN[eraIdx] || '')
    : (ERA_DESCS_KO[eraIdx] || '');
}

/** Get translated event field. Returns null if no translation found. */
function tEvent(koTitle, field, choiceIdx) {
  const tr = EVENTS_EN[koTitle];
  if (!tr) return null;
  if (LANG.current !== 'en') return null;
  if (field === 'title')  return tr.title ?? null;
  if (field === 'desc')   return tr.desc  ?? null;
  if (field === 'choice' && tr.choices) return tr.choices[choiceIdx] ?? null;
  return null;
}

/** Switch language and refresh UI. */
function setLang(lang) {
  LANG.current = lang;
  if (typeof localStorage !== 'undefined') localStorage.setItem('ceoSimLang', lang);
  applyI18n();
}

/** Apply translations to all [data-i18n] elements and re-render game UI. */
function applyI18n() {
  // Static elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.getAttribute('data-i18n-attr') === 'placeholder') el.placeholder = val;
    else if (el.getAttribute('data-i18n-attr') === 'title')  el.title = val;
    else el.textContent = val;
  });
  // HTML elements with data-i18n-html (for bold/spans inside)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
  // Page title
  document.title = t('page.title');
  // html lang attr
  document.documentElement.lang = LANG.current;
  // Language toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === LANG.current);
  });
  // Dynamic game UI — only if game is running
  if (typeof renderAll === 'function' && typeof G !== 'undefined' && G.history && G.history.length) {
    renderAll();
  }
}

// ═══════════════════════════════════════════════════════
// UI STRING DICTIONARY
// ═══════════════════════════════════════════════════════
const UI_STRINGS = {
  ko: {
    'page.title': 'CEO 시뮬레이터 — 소프트웨어 제국 1980–2050',
    // ── Intro ──
    'intro.title.span': '시뮬레이터',
    'intro.lead': '1980년 차고 창업부터 2050년 글로벌 소프트웨어 제국까지.<br>역사적 산업 변화를 헤쳐나가며 경쟁사를 압도하세요.',
    'intro.form.name': '회사명',
    'intro.form.product': '대표 제품명',
    'intro.form.difficulty': '난이도',
    'intro.diff.easy': '쉬움',
    'intro.diff.normal': '보통',
    'intro.diff.hard': '어려움',
    'intro.diff.easy.tip': '초기현금 2배 · 경쟁사 약화 · 위기피해 50% · 대출이자 할인',
    'intro.diff.normal.tip': '기본 설정',
    'intro.diff.hard.tip': '초기현금 절반 · 경쟁사 강화 · 위기피해 1.8배 · 고금리',
    'intro.btn.start': '창업 시작 →',
    'intro.btn.continue': '▶ 이전 게임 이어하기',
    'intro.slots.title': '💾 저장된 게임 불러오기',
    'intro.slot.empty': '빈 슬롯',
    'intro.feat.1': '경쟁사 AI 성장 시뮬레이션',
    'intro.feat.2': '역사적 산업 변화 이벤트',
    'intro.feat.3': '포터 전략·BCG 이론 접목',
    'intro.feat.4': '임금·비용 시대별 인플레이션',
    // ── Header KPIs ──
    'hd.cash': '현금',
    'hd.rev': '분기 매출',
    'hd.share': '시장점유율',
    'hd.emp': '직원 수',
    'hd.equity': '지분율',
    'hd.loan': '대출 잔액',
    'btn.save': '저장',
    // ── Mobile bar ──
    'mb.cash': '현금',
    'mb.rev': '매출',
    'mb.share': '점유율',
    'mb.emp': '직원',
    'mb.loan': '대출',
    'mb.tab.decision': '📋 의사결정',
    'mb.tab.report': '📊 보고서',
    // ── Decision panel ──
    'panel.title': '분기 의사결정',
    'section.strategy': '경쟁 전략',
    'strategy.tip': 'Porter의 본원적 전략',
    'strat.diff.name': '💎 차별화',
    'strat.diff.desc': 'R&D → 품질↑',
    'strat.cost.name': '💰 원가우위',
    'strat.cost.desc': '효율↑ 가격↓',
    'strat.focus.name': '🎯 집중화',
    'strat.focus.desc': '기술 특화',
    'section.budget': '예산 배분',
    'budget.tip': '자원기반관점(RBV): 핵심역량에 집중 투자',
    'sl.rd': 'R&D / 제품개발',
    'sl.rd.hint': '품질↑ 기술력↑ (NPS·시장점유율 향상)',
    'sl.mkt': '마케팅 / 영업',
    'sl.mkt.hint': '브랜드↑ 신규고객↑ (점유율 확대)',
    'sl.hr': 'HR / 인재개발',
    'mob.edit': '편집',
    'section.hiring': '채용 / 조정',
    'hiring.tip': '인적자원관리: 규모와 생산성 균형',
    'hire.min.prefix': '최소:',
    'hire.max.prefix': '최대:',
    'hire.cost.prefix': '채용비',
    'hire.fill.prefix': '최소 인원 충원:',
    'section.price': '가격 포지셔닝',
    'price.tip': '가격 전략: 시장 평균 대비',
    'price.label': '시장평균 대비',
    'mob.direct': '직접입력',
    'section.funding': '자금 조달',
    'funding.tip': '스타트업 파이낸싱: 시드→시리즈A/B/C→IPO',
    'funding.equity.label': '창업자 지분',
    'funding.loan.label': '대출 상환',
    'btn.fund': '💰 투자 유치 / 대출',
    'btn.launch': '🚀 신제품 출시',
    // ── Cost preview ──
    'cp.sal': '인건비',
    'cp.rd': 'R&D',
    'cp.mkt': '마케팅',
    'cp.ops': '기타 운영',
    'cp.cogs': '매출원가',
    'cp.cogs.sub': '(인프라·지원)',
    'cp.loan': '대출 상환',
    'cp.total': '총 비용',
    'cp.profit': '예상 순이익',
    // ── Tabs ──
    'tab.financial': '📋 재무제표',
    'tab.market': '🏆 시장 현황',
    'tab.history': '📈 성과 추이',
    'tab.theory': '📚 경영 이론',
    // ── Financial Statement ──
    'fs.income.title': '📄 손익계산서 (분기)',
    'fs.revenue': '매출액',
    'fs.cogs': '(-) 매출원가',
    'fs.gross': '매출총이익',
    'fs.rd': '(-) R&D 비용',
    'fs.mkt': '(-) 마케팅 비용',
    'fs.hr': '(-) 인건비',
    'fs.opinc': '영업이익',
    'fs.interest': '(-) 이자비용',
    'fs.net': '당기순이익',
    'fs.status.title': '🏦 재무상태 (현재)',
    'fs.cash': '현금 및 현금성자산',
    'fs.arr': '연간 환산 매출 (ARR)',
    'fs.loan': '차입금 (대출)',
    'fs.netcash': '순현금 (현금-대출)',
    'fs.mktshare': '시장점유율',
    'fs.employees': '임직원 수',
    'fs.cap.title': '⚙️ 역량 지표',
    'fs.quality': '제품 품질',
    'fs.brand': '브랜드 파워',
    'fs.tech': '기술 수준',
    'fs.morale': '직원 사기',
    'fs.attrition': '분기 이탈',
    'chart.revprofit': '매출 & 순이익 추이 (분기별)',
    'news.title': '최근 동향',
    'news.empty': '아직 동향이 없습니다.',
    // ── Menu ──
    'menu.save': '💾 저장하기',
    'menu.mainmenu': '🏠 메인 메뉴로',
    // ── Event modal ──
    'ev.era.suffix': '— 이벤트 발생',
    'ev.type.opportunity': '기회',
    'ev.type.crisis': '위기',
    'ev.type.revolution': '혁명',
    'ev.type.boom': '호황',
    'ev.type.shift': '패러다임 전환',
    'ev.cost.free': '투자금 없음',
    'ev.cost.prefix': '투자금:',
    'ev.cost.pct': '분기매출의 {pct}%',
    'ev.cost.floor': '역사적 최소 {amt} 적용',
    'ev.cost.debt': '+ 부채청산 {amt}',
    'ev.cost.total': '= 총 {amt}',
    'ev.req.cash': '💸 현금 부족',
    'ev.req.emp': '👥 인원 부족 (최소 {n}명)',
    'ev.debt.warn.title': '기술 부채 자동 청산 경고',
    'ev.debt.warn.body': '투자를 선택하면 아래 기술 부채가 자동 청산됩니다 (추가 비용 발생):',
    'ev.debt.warn.total': '총 추가 비용: 분기매출의 {pct}% 추가 지출',
    // ── Results modal ──
    'res.title.suffix': '— 결과',
    'res.rev': '분기 매출',
    'res.profit': '순이익',
    'res.cash': '현금 잔고',
    'res.share': '시장점유율',
    'res.emp': '직원 수',
    'res.quality': '제품 품질',
    'res.margin.elite': '🏆 최우수',
    'res.margin.good': '✅ 양호 — 이 시대 평균 {pct}% 상회',
    'res.margin.ok': '⚠️ 보통 — 목표 {pct}%+',
    'res.margin.loss': '🔴 적자 — 성장 투자 중',
    'res.margin.severe': '💸 심각한 적자',
    'res.news.title': '이번 분기 동향',
    'res.btn.next': '다음 분기로 →',
    // ── Pre-quarter check ──
    'pq.title': '분기 실행 전 점검',
    'pq.budget': '예산 배분',
    'pq.hr.ok': '충원 충분',
    'pq.hr.after': '채용 후 충원 충족',
    'pq.hr.warn': '⚠️ 인원 부족 — {gap}명 추가 필요 (현재 {cur}명 / 최소 {min}명)',
    'pq.cash.ok': '현금 충분',
    'pq.cash.warn': '⚠️ 현금 위험 — 예상 손실 {amt}',
    'pq.cash.burn': '주의: 예상 {amt} 손실',
    'pq.strategy.diff': '💎 차별화 — R&D 중심 품질 전략',
    'pq.strategy.cost': '💰 원가우위 — 효율·가격 경쟁 전략',
    'pq.strategy.focus': '🎯 집중화 — 기술 특화 전략',
    'pq.btn.run': '▶ 분기 실행',
    'pq.btn.back': '← 돌아가기',
    // ── News messages ──
    'news.profit.tag': '📈 흑자 달성',
    'news.profit.pos': '이번 분기 +{amt} 순이익',
    'news.loss.tag': '📉 적자 발생',
    'news.profit.neg': '이번 분기 {amt} 손실',
    'news.share.up.tag': '🏆 점유율 상승',
    'news.share.up.msg': '시장점유율 +{delta}%p 증가',
    'news.share.dn.tag': '⚠️ 점유율 하락',
    'news.share.dn.msg': '시장점유율 {delta}%p 감소',
    'news.bankrupt': '💀 {name} 파산',
    'news.bankrupt.msg': '경쟁사가 파산했습니다. 시장 재편 기회!',
    // ── Market tab ──
    'mkt.total.size': '총 시장 규모',
    'mkt.my.share': '내 점유율',
    'mkt.growth': '시장 성장률 (연)',
    'mkt.current.era': '현재 시대',
    'chart.share': '시장 점유율 경쟁 (분기별)',
    'chart.tam': '총 시장 규모 성장 (연간 TAM)',
    'comp.title': '경쟁사 현황',
    // ── History tab ──
    'chart.cash': '현금 잔고 추이',
    'chart.org': '직원 수 & 품질 추이',
    'hist.col.qtr': '분기',
    'hist.col.rev': '매출',
    'hist.col.profit': '순이익',
    'hist.col.share': '점유율',
    'hist.col.cash': '현금',
    'hist.col.emp': '직원',
    // ── Theory tab ──
    'theory.porter.head': '♟ Porter의 본원적 경쟁 전략',
    'theory.porter.body': '<b>차별화 전략</b>: 고품질·고가격으로 프리미엄 시장 공략. R&D 투자 효과 30% 증폭.<br><b>원가우위 전략</b>: 효율적 운영으로 저가 제공. 대규모 시장 점유 가능.<br><b>집중화 전략</b>: 특정 기술·틈새시장에 집중. 높은 진입 장벽 구축.',
    'theory.bcg.head': '📊 BCG 매트릭스 — 현재 제품 포지션',
    'theory.bcg.body': '<b>Star ⭐</b>: 고성장·고점유 → 집중 투자<br><b>Cash Cow 🐄</b>: 저성장·고점유 → 수익 창출<br><b>Question Mark ❓</b>: 고성장·저점유 → 전략적 투자 결정<br><b>Dog 🐕</b>: 저성장·저점유 → 철수 또는 최소 유지',
    'theory.plc.head': '🔄 제품 생명주기 (PLC)',
    'theory.plc.body': '현재 제품의 시장 단계와 권장 투자 전략을 보여줍니다.',
    'theory.blueocean.head': '🌊 Blue Ocean 지수',
    'theory.blueocean.body': '경쟁이 없는 새로운 시장 공간을 얼마나 개척했는지 측정합니다.<br>R&D로 새 기능을 개발하고 기술 선도력을 높일수록 지수가 상승합니다.',
    // ── Buttons ──
    'btn.next.quarter': '다음 분기 실행 →',
    'btn.briefing': '비서 브리핑 받기 →',
    'btn.brief.next': '다음 ›',
    'btn.brief.close': '다음 분기 준비 →',
    'btn.preq.run': '실행하기 →',
    'btn.preq.back': '수정하기',
    'preq.check.title': '분기 실행 전 점검',
    'qrun.running': '분기 진행 중',
    'qrun.skip': '건너뛰기 ›',
    // ── Briefing tabs ──
    'brief.tab.results': '📊 실적',
    'brief.tab.competition': '⚔️ 경쟁',
    'brief.tab.finance': '💰 자금',
    'brief.tab.strategy': '🧭 전략',
    'brief.date.suffix': '분기 브리핑',
    // ── Save/Load modal ──
    'save.title': '게임 저장',
    'save.slot.select': '저장 슬롯 선택',
    'save.slot.prefix': '슬롯',
    'save.empty': '빈 슬롯',
    'save.overwrite': '덮어쓰기',
    'save.btn.close': '닫기',
    'btn.cancel': '취소',
    // ── Funding modal ──
    'fund.title': '자금 조달',
    'fund.era.tag': '자금 조달 옵션',
    'fund.modal.title': '투자 유치 / 대출',
    'fund.equity.current': '현재 지분율:',
    'fund.loan.balance': '대출 잔액:',
    'fund.credit.loading': '신용등급 계산 중…',
    'fund.tab.loan': '은행 대출',
    'fund.tab.vc': 'VC 투자',
    'fund.tab.ipo': 'IPO',
    'btn.close': '닫기',
    // ── Acquisition modal ──
    'acq.era.tag': '기업 인수',
    'acq.confirm': '🤝 인수 확정',
    // ── Game over / win ──
    'gameover.title': '게임 오버',
    'gameover.body': '3분기 연속 적자로 파산했습니다.',
    'win.title': '🏆 축하합니다!',
    'win.body': '소프트웨어 제국을 완성했습니다!',
    'btn.restart': '↺ 다시 시작',
    'btn.mainmenu': '메인으로',
  },

  en: {
    'page.title': 'CEO Simulator — Software Empire 1980–2050',
    // ── Intro ──
    'intro.title.span': 'Simulator',
    'intro.lead': 'From a 1980s garage startup to a 2050 global software empire.<br>Navigate historic industry shifts and outcompete your rivals.',
    'intro.form.name': 'Company Name',
    'intro.form.product': 'Flagship Product',
    'intro.form.difficulty': 'Difficulty',
    'intro.diff.easy': 'Easy',
    'intro.diff.normal': 'Normal',
    'intro.diff.hard': 'Hard',
    'intro.diff.easy.tip': '2× starting cash · weaker rivals · 50% crisis damage · discounted loans',
    'intro.diff.normal.tip': 'Default settings',
    'intro.diff.hard.tip': '½ starting cash · stronger rivals · 1.8× crisis damage · high interest',
    'intro.btn.start': 'Start Company →',
    'intro.btn.continue': '▶ Continue Previous Game',
    'intro.slots.title': '💾 Load Saved Game',
    'intro.slot.empty': 'Empty Slot',
    'intro.feat.1': 'Competitor AI Growth Simulation',
    'intro.feat.2': 'Historic Industry Events',
    'intro.feat.3': 'Porter Strategy & BCG Theory',
    'intro.feat.4': 'Era-Based Wage & Cost Inflation',
    // ── Header KPIs ──
    'hd.cash': 'Cash',
    'hd.rev': 'Qtr Revenue',
    'hd.share': 'Market Share',
    'hd.emp': 'Employees',
    'hd.equity': 'Equity',
    'hd.loan': 'Loan Balance',
    'btn.save': 'Save',
    // ── Mobile bar ──
    'mb.cash': 'Cash',
    'mb.rev': 'Revenue',
    'mb.share': 'Share',
    'mb.emp': 'Staff',
    'mb.loan': 'Loan',
    'mb.tab.decision': '📋 Decisions',
    'mb.tab.report': '📊 Report',
    // ── Decision panel ──
    'panel.title': 'Quarterly Decisions',
    'section.strategy': 'Competitive Strategy',
    'strategy.tip': "Porter's Generic Strategies",
    'strat.diff.name': '💎 Differentiation',
    'strat.diff.desc': 'R&D → quality↑',
    'strat.cost.name': '💰 Cost Leadership',
    'strat.cost.desc': 'efficiency↑ price↓',
    'strat.focus.name': '🎯 Focus',
    'strat.focus.desc': 'tech specialization',
    'section.budget': 'Budget Allocation',
    'budget.tip': 'Resource-Based View (RBV): invest in core competencies',
    'sl.rd': 'R&D / Product Dev',
    'sl.rd.hint': 'Quality↑ Tech↑ (NPS & market share boost)',
    'sl.mkt': 'Marketing / Sales',
    'sl.mkt.hint': 'Brand↑ New customers↑ (expand market share)',
    'sl.hr': 'HR / Talent Dev',
    'mob.edit': 'Edit',
    'section.hiring': 'Hiring / Adjustment',
    'hiring.tip': 'HRM: balance headcount and productivity',
    'hire.min.prefix': 'Min:',
    'hire.max.prefix': 'Max:',
    'hire.cost.prefix': 'Hire cost',
    'hire.fill.prefix': 'Minimum staffing:',
    'section.price': 'Price Positioning',
    'price.tip': 'Pricing strategy vs. market average',
    'price.label': 'vs. Market Avg',
    'mob.direct': 'Enter',
    'section.funding': 'Funding',
    'funding.tip': 'Startup financing: Seed → Series A/B/C → IPO',
    'funding.equity.label': 'Founder Equity',
    'funding.loan.label': 'Loan Repayment',
    'btn.fund': '💰 Raise Capital / Loan',
    'btn.launch': '🚀 Launch New Product',
    // ── Cost preview ──
    'cp.sal': 'Salaries',
    'cp.rd': 'R&D',
    'cp.mkt': 'Marketing',
    'cp.ops': 'Other Operating',
    'cp.cogs': 'Cost of Revenue',
    'cp.cogs.sub': '(infra & support)',
    'cp.loan': 'Loan Payment',
    'cp.total': 'Total Costs',
    'cp.profit': 'Est. Net Income',
    // ── Tabs ──
    'tab.financial': '📋 Financials',
    'tab.market': '🏆 Market',
    'tab.history': '📈 Performance',
    'tab.theory': '📚 Theory',
    // ── Financial Statement ──
    'fs.income.title': '📄 Income Statement (Quarterly)',
    'fs.revenue': 'Revenue',
    'fs.cogs': '(-) Cost of Revenue',
    'fs.gross': 'Gross Profit',
    'fs.rd': '(-) R&D Expense',
    'fs.mkt': '(-) Marketing Expense',
    'fs.hr': '(-) Personnel Costs',
    'fs.opinc': 'Operating Income',
    'fs.interest': '(-) Interest Expense',
    'fs.net': 'Net Income',
    'fs.status.title': '🏦 Financial Position (Current)',
    'fs.cash': 'Cash & Equivalents',
    'fs.arr': 'Annual Run Rate (ARR)',
    'fs.loan': 'Total Debt',
    'fs.netcash': 'Net Cash (Cash − Debt)',
    'fs.mktshare': 'Market Share',
    'fs.employees': 'Headcount',
    'fs.cap.title': '⚙️ Capability Metrics',
    'fs.quality': 'Product Quality',
    'fs.brand': 'Brand Power',
    'fs.tech': 'Tech Level',
    'fs.morale': 'Staff Morale',
    'fs.attrition': 'Qtr Attrition',
    'chart.revprofit': 'Revenue & Net Income Trend (Quarterly)',
    'news.title': 'Recent Updates',
    'news.empty': 'No updates yet.',
    // ── Menu ──
    'menu.save': '💾 Save Game',
    'menu.mainmenu': '🏠 Main Menu',
    // ── Event modal ──
    'ev.era.suffix': '— Event',
    'ev.type.opportunity': 'Opportunity',
    'ev.type.crisis': 'Crisis',
    'ev.type.revolution': 'Revolution',
    'ev.type.boom': 'Boom',
    'ev.type.shift': 'Paradigm Shift',
    'ev.cost.free': 'No investment required',
    'ev.cost.prefix': 'Investment:',
    'ev.cost.pct': '{pct}% of quarterly revenue',
    'ev.cost.floor': 'Historical min ${amt} applied',
    'ev.cost.debt': '+ debt clearance {amt}',
    'ev.cost.total': '= total {amt}',
    'ev.req.cash': '💸 Insufficient cash',
    'ev.req.emp': '👥 Need {n} more staff',
    'ev.debt.warn.title': 'Tech Debt Auto-Settlement Warning',
    'ev.debt.warn.body': 'Choosing to invest will automatically settle your tech debts (extra cost):',
    'ev.debt.warn.total': 'Total extra cost: {pct}% of quarterly revenue',
    // ── Results modal ──
    'res.title.suffix': '— Results',
    'res.rev': 'Quarterly Revenue',
    'res.profit': 'Net Income',
    'res.cash': 'Cash Balance',
    'res.share': 'Market Share',
    'res.emp': 'Employees',
    'res.quality': 'Product Quality',
    'res.margin.elite': '🏆 Elite',
    'res.margin.good': '✅ Good — above era avg {pct}%',
    'res.margin.ok': '⚠️ Fair — target {pct}%+',
    'res.margin.loss': '🔴 Loss — growth investment phase',
    'res.margin.severe': '💸 Severe loss',
    'res.news.title': 'This Quarter',
    'res.btn.next': 'Next Quarter →',
    // ── Pre-quarter check ──
    'pq.title': 'Pre-Quarter Review',
    'pq.budget': 'Budget Allocation',
    'pq.hr.ok': 'Staffing sufficient',
    'pq.hr.after': 'Staffing sufficient after hiring',
    'pq.hr.warn': '⚠️ Understaffed — need {gap} more (have {cur} / need {min})',
    'pq.cash.ok': 'Cash healthy',
    'pq.cash.warn': '⚠️ Cash risk — projected loss {amt}',
    'pq.cash.burn': 'Note: projected {amt} loss',
    'pq.strategy.diff': '💎 Differentiation — R&D-driven quality strategy',
    'pq.strategy.cost': '💰 Cost Leadership — efficiency & price competition',
    'pq.strategy.focus': '🎯 Focus — tech specialization strategy',
    'pq.btn.run': '▶ Run Quarter',
    'pq.btn.back': '← Back',
    // ── News messages ──
    'news.profit.tag': '📈 Profitable',
    'news.profit.pos': 'This quarter: +{amt} net income',
    'news.loss.tag': '📉 Loss',
    'news.profit.neg': 'This quarter: {amt} loss',
    'news.share.up.tag': '🏆 Share gained',
    'news.share.up.msg': 'Market share +{delta}%p',
    'news.share.dn.tag': '⚠️ Share lost',
    'news.share.dn.msg': 'Market share {delta}%p decline',
    'news.bankrupt': '💀 {name} bankrupt',
    'news.bankrupt.msg': 'Competitor went bankrupt. Market opportunity!',
    // ── Market tab ──
    'mkt.total.size': 'Total Market Size',
    'mkt.my.share': 'My Share',
    'mkt.growth': 'Market Growth (YoY)',
    'mkt.current.era': 'Current Era',
    'chart.share': 'Market Share Race (Quarterly)',
    'chart.tam': 'Total Market Growth (Annual TAM)',
    'comp.title': 'Competitor Overview',
    // ── History tab ──
    'chart.cash': 'Cash Balance Trend',
    'chart.org': 'Headcount & Quality Trend',
    'hist.col.qtr': 'Quarter',
    'hist.col.rev': 'Revenue',
    'hist.col.profit': 'Net Income',
    'hist.col.share': 'Share',
    'hist.col.cash': 'Cash',
    'hist.col.emp': 'Staff',
    // ── Theory tab ──
    'theory.porter.head': "♟ Porter's Generic Competitive Strategies",
    'theory.porter.body': '<b>Differentiation</b>: High quality & price for premium market. R&D investment amplified 30%.<br><b>Cost Leadership</b>: Efficient operations for low-price offering. Capture large market.<br><b>Focus</b>: Specialize in niche tech or market. Build high entry barriers.',
    'theory.bcg.head': '📊 BCG Matrix — Current Product Position',
    'theory.bcg.body': '<b>Star ⭐</b>: High growth & high share → invest heavily<br><b>Cash Cow 🐄</b>: Low growth & high share → harvest profits<br><b>Question Mark ❓</b>: High growth & low share → make strategic investment call<br><b>Dog 🐕</b>: Low growth & low share → exit or minimal maintenance',
    'theory.plc.head': '🔄 Product Lifecycle (PLC)',
    'theory.plc.body': 'Shows the market stage of your current product and the recommended investment strategy.',
    'theory.blueocean.head': '🌊 Blue Ocean Index',
    'theory.blueocean.body': "Measures how much you've pioneered untapped market space free of competition.<br>The more you invest in R&D to develop new capabilities and lead in tech, the higher this index rises.",
    // ── Buttons ──
    'btn.next.quarter': 'Run Next Quarter →',
    'btn.briefing': 'Secretary Briefing →',
    'btn.brief.next': 'Next ›',
    'btn.brief.close': 'Prepare Next Quarter →',
    'btn.preq.run': 'Run Quarter →',
    'btn.preq.back': 'Go Back',
    'preq.check.title': 'Pre-Quarter Check',
    'qrun.running': 'Quarter in Progress',
    'qrun.skip': 'Skip ›',
    // ── Briefing tabs ──
    'brief.tab.results': '📊 Results',
    'brief.tab.competition': '⚔️ Competition',
    'brief.tab.finance': '💰 Finance',
    'brief.tab.strategy': '🧭 Strategy',
    'brief.date.suffix': 'Quarterly Briefing',
    // ── Save/Load ──
    'save.title': 'Save Game',
    'save.slot.select': 'Select Save Slot',
    'save.slot.prefix': 'Slot',
    'save.empty': 'Empty',
    'save.overwrite': 'Overwrite',
    'save.btn.close': 'Close',
    'btn.cancel': 'Cancel',
    // ── Funding ──
    'fund.title': 'Raise Capital',
    'fund.era.tag': 'Funding Options',
    'fund.modal.title': 'Raise Capital / Loan',
    'fund.equity.current': 'Current equity:',
    'fund.loan.balance': 'Loan balance:',
    'fund.credit.loading': 'Calculating credit rating…',
    'fund.tab.loan': 'Bank Loan',
    'fund.tab.vc': 'VC Investment',
    'fund.tab.ipo': 'IPO',
    'btn.close': 'Close',
    // ── Acquisition modal ──
    'acq.era.tag': 'Acquisition',
    'acq.confirm': '🤝 Confirm Acquisition',
    // ── Game over / win ──
    'gameover.title': 'Game Over',
    'gameover.body': 'Bankrupt after 3 consecutive loss quarters.',
    'win.title': '🏆 Congratulations!',
    'win.body': 'Your software empire is complete!',
    'btn.restart': '↺ Play Again',
    'btn.mainmenu': 'Main Menu',
  },
};

// ═══════════════════════════════════════════════════════
// ERA TRANSLATIONS
// ═══════════════════════════════════════════════════════
const ERA_NAMES_KO = [
  'PC 소프트웨어 시대',
  '인터넷 혁명 시대',
  '모바일·클라우드 시대',
  'AI 혁명 시대',
  'AGI 이후 시대',
];
const ERA_NAMES_EN = [
  'PC Software Era',
  'Internet Revolution Era',
  'Mobile & Cloud Era',
  'AI Revolution Era',
  'Post-AGI Era',
];
const ERA_DESCS_KO = [
  '개인용 PC가 보급되며 비즈니스 소프트웨어 황금기가 시작됩니다.',
  '월드와이드웹이 소프트웨어 배포와 비즈니스 모델을 완전히 바꿉니다.',
  '스마트폰과 SaaS가 산업 표준이 됩니다.',
  '생성형 AI가 소프트웨어 개발과 사용을 근본적으로 변화시킵니다.',
  '범용 인공지능이 소프트웨어 산업 자체를 재정의합니다.',
];
const ERA_DESCS_EN = [
  'Personal computers proliferate, igniting the golden age of business software.',
  'The World Wide Web transforms software distribution and business models entirely.',
  'Smartphones and SaaS become the new industry standard.',
  'Generative AI fundamentally reshapes how software is built and used.',
  'Artificial General Intelligence redefines the software industry itself.',
];

// ═══════════════════════════════════════════════════════
// EVENT TRANSLATIONS  (keyed by Korean title)
// ═══════════════════════════════════════════════════════
const EVENTS_EN = {
  // ── 1980s ──────────────────────────────────────────────────────────────────
  'IBM PC 출시!': {
    title: 'IBM PC Launch!',
    desc: 'IBM has released the personal computer. The business software market is about to explode!',
    choices: [
      '📦 Urgent investment in PC-compatible product development',
      '⏳ Watch the market, then enter when stable',
    ],
  },
  'Lotus 1-2-3 스프레드시트 열풍': {
    title: 'Lotus 1-2-3 Spreadsheet Boom',
    desc: 'Spreadsheet software has become the killer app for PCs. Demand for productivity software is surging.',
    choices: [
      '📊 Strengthen productivity software lineup',
      '🔄 Focus on improving current product quality',
    ],
  },
  'Apple Macintosh — GUI 혁명': {
    title: 'Apple Macintosh — GUI Revolution',
    desc: 'A GUI-based OS has arrived. User experience is now a core competitive factor.',
    choices: [
      '🎨 Full GUI/UX overhaul — invest in the future',
      '🔧 Keep existing text-based interface',
    ],
  },
  'Microsoft Windows 1.0 출시': {
    title: 'Microsoft Windows 1.0 Launch',
    desc: 'Microsoft unveiled Windows. The GUI software ecosystem is opening up — rough but this is the future.',
    choices: [
      '🖥️ Join the Windows ecosystem early',
      '⏳ Enter after Windows matures',
    ],
  },
  '블랙 먼데이 — 주식시장 대폭락': {
    title: 'Black Monday — Stock Market Crash',
    desc: 'October 19, 1987 — the Dow plunged 22.6% in a single day! Corporate IT budgets are being cut immediately.',
    choices: [
      '✂️ Emergency cost reduction — preserve cash',
      '🎯 Target niche customers through the downturn',
    ],
  },
  '데스크탑 퍼블리싱 붐': {
    title: 'Desktop Publishing Boom',
    desc: 'DTP software like PageMaker and QuarkXPress is revolutionizing the print industry. The professional software market is open.',
    choices: [
      '🖨️ Enter the DTP & media software market',
      '🏢 Stay focused on enterprise software',
    ],
  },
  '걸프전·경기침체 — IT 예산 삭감': {
    title: 'Gulf War & Recession — IT Budget Cuts',
    desc: "Iraq's invasion of Kuwait and the US recession hit simultaneously. Companies are drastically cutting IT spending.",
    choices: [
      '🛡️ Enter government & defense software market',
      '⚙️ Position product as cost-saving solution',
    ],
  },
  'Windows 3.0 출시 — PC 소프트웨어 대폭발!': {
    title: 'Windows 3.0 Launch — PC Software Explosion!',
    desc: 'Microsoft Windows 3.0 is here! PC adoption is exploding. The software market is expected to grow 5× in the next 5 years.',
    choices: [
      '🚀 Launch full Windows-native product line',
      '⚡ Gradually add Windows support',
      '💾 Stay with DOS products (wait and see)',
    ],
  },
  // ── 1990s ──────────────────────────────────────────────────────────────────
  'Windows NT — 기업용 OS 시장 개막': {
    title: 'Windows NT — Enterprise OS Market Opens',
    desc: 'Microsoft Windows NT launches targeting corporate servers. The enterprise software market is opening up.',
    choices: [
      '🏢 Move into enterprise software first',
      '🏠 Stay focused on the SMB market',
    ],
  },
  '멀티미디어 PC & CD-ROM 붐': {
    title: 'Multimedia PC & CD-ROM Boom',
    desc: 'Demand for CD-ROM and multimedia content software is surging. A whole new software category has opened.',
    choices: [
      '🎮 Add multimedia & gaming features',
      '📌 Stay focused on business software',
    ],
  },
  'Mosaic 브라우저 & WWW — 인터넷 여명': {
    title: 'Mosaic Browser & WWW — Dawn of the Internet',
    desc: 'NCSA Mosaic has opened the internet to the public. The web will become a new software platform — companies preparing now will own the future.',
    choices: [
      '🌐 Proactively develop web-based product',
      '📡 Build internet marketing channels',
      '⏳ Wait for internet to mature, then respond',
    ],
  },
  '멕시코 페소 위기 — 신흥시장 충격': {
    title: 'Mexican Peso Crisis — Emerging Market Shock',
    desc: "The Mexican peso collapsed 50%, shaking all emerging markets. Latin America's IT market is contracting rapidly.",
    choices: [
      '🌍 Focus on developed markets: North America & Europe',
      '💡 Maintain emerging market presence with low-cost offering',
    ],
  },
  '인터넷 혁명 시작! — 넷스케이프 IPO': {
    title: 'Internet Revolution Begins! — Netscape IPO',
    desc: 'The Netscape IPO signals the internet era! Web-based software is the future. Failing to pivot in 5 years may mean being pushed out of the market.',
    choices: [
      '🌐 Full-scale pivot to web-based products (large)',
      '🔄 Gradually add internet features',
      '💻 Stick with existing desktop software',
    ],
  },
  'Java 혁명 — Write Once Run Anywhere': {
    title: 'Java Revolution — Write Once Run Anywhere',
    desc: "Sun Microsystems' Java revolutionizes cross-platform software development. It will become the new enterprise standard.",
    choices: [
      '☕ Rebuild product architecture on Java',
      '🔌 Add partial Java API support',
    ],
  },
  'ERP·엔터프라이즈 소프트웨어 붐': {
    title: 'ERP & Enterprise Software Boom',
    desc: "SAP and Oracle's success drives explosive growth in enterprise ERP & CRM software markets.",
    choices: [
      '🏭 Massively expand enterprise feature set',
      '🏠 Stay focused on SMB market',
    ],
  },
  '아시아 금융위기 — IMF 구제금융': {
    title: 'Asian Financial Crisis — IMF Bailout',
    desc: "The Thai baht collapse triggered the Asian financial crisis, hitting South Korea, Indonesia, and Malaysia hard. Asia's IT market is cut in half.",
    choices: [
      '🌏 Exit Asian markets — focus on the West',
      '💰 Acquire undervalued Asian talent & offices',
    ],
  },
  '러시아 디폴트 & LTCM 붕괴': {
    title: 'Russian Default & LTCM Collapse',
    desc: 'Russia declared a debt default and hedge fund LTCM collapsed. Shockwaves spread through the global financial system.',
    choices: [
      '🛡️ Build safe assets — strengthen cash reserves',
      '📈 Emphasize software that grows even in recessions',
    ],
  },
  '닷컴 골드러시!': {
    title: 'Dot-com Gold Rush!',
    desc: 'Internet bubble peak! VC money is flooding in and every software company valuation is skyrocketing.',
    choices: [
      '🚀 Aggressive marketing & hiring (ride the bubble)',
      '💡 Focus on strengthening product quality',
    ],
  },
  'Y2K 버그 대응 — 레거시 IT 폭발': {
    title: 'Y2K Bug Response — Legacy IT Explosion',
    desc: 'Year 2000 compliance has pushed corporate IT budgets to all-time highs. Demand for legacy system replacement is exploding.',
    choices: [
      '🔧 Urgently launch Y2K-compliant solution',
      '📋 Offer consulting & migration services',
    ],
  },
  // ── 2000s ──────────────────────────────────────────────────────────────────
  '닷컴 버블 붕괴!': {
    title: 'Dot-com Bubble Burst!',
    desc: 'NASDAQ dropped 78%. IT budgets are being slashed 30–50%. Unprofitable companies are going bankrupt in droves.',
    choices: [
      '✂️ Massive cost reduction — lay off staff',
      '🛡️ Defend core products and customers',
      '🏃 Seize M&A opportunity from competitors',
    ],
  },
  '9/11 테러 — 경기 침체': {
    title: '9/11 Terror Attack — Economic Recession',
    desc: 'Corporate IT investment collapsed after 9/11. Global uncertainty is extremely high.',
    choices: [
      '📉 Focus on cutting operating costs',
      '🔍 Strengthen niche market targeting',
    ],
  },
  'SARS 사태 — 아시아 경제 충격': {
    title: 'SARS Outbreak — Asian Economic Shock',
    desc: 'Severe Acute Respiratory Syndrome struck Asia. In-person sales became impossible; demand for remote software surged.',
    choices: [
      '📡 Boost remote collaboration & video conferencing features',
      '📦 Maintain offline support',
    ],
  },
  '오픈소스 혁명 — Linux·Apache 전성기': {
    title: 'Open Source Revolution — Linux & Apache Peak',
    desc: 'Linux and the open-source ecosystem are dominating enterprise IT. Companies without an open-source strategy will fall behind.',
    choices: [
      '🐧 Convert product to open-source foundation',
      '🔒 Stick with proprietary software strategy',
    ],
  },
  '소셜 네트워크 & Facebook 시대': {
    title: 'Social Networks & the Facebook Era',
    desc: 'Social platforms are booming. Integrating social features and viral marketing become new competitive weapons.',
    choices: [
      '📱 Large-scale social feature integration',
      '🏢 Focus on strengthening enterprise features',
    ],
  },
  'Web 2.0 혁명 — AJAX·YouTube': {
    title: 'Web 2.0 Revolution — AJAX & YouTube',
    desc: 'Dynamic web technology (AJAX) and YouTube ushered in the Web 2.0 era. User-participation software is the new norm.',
    choices: [
      '🌐 Full Web 2.0 UX redesign',
      '📺 Add video & media features',
    ],
  },
  'AWS S3·EC2 출시 — 클라우드 인프라 혁명': {
    title: 'AWS S3 & EC2 Launch — Cloud Infrastructure Revolution',
    desc: 'Amazon launched cloud infrastructure services. You can now run global software without owning a server. The cloud-native era begins.',
    choices: [
      '☁️ Migrate to AWS-based cloud architecture',
      '🔄 Hybrid: own servers + cloud',
    ],
  },
  // ── 2007–2015 ──────────────────────────────────────────────────────────────
  'iPhone 출시 — 모바일 혁명!': {
    title: 'iPhone Launch — Mobile Revolution!',
    desc: 'The Apple iPhone is here! The mobile software era begins. Without mobile apps, survival in the future market is nearly impossible.',
    choices: [
      '📱 Full-scale mobile app development (large)',
      '🔄 Mobile web optimization + app development',
      '💻 Stay focused on desktop and web',
    ],
  },
  '글로벌 금융 위기 — 리먼 브라더스 파산': {
    title: 'Global Financial Crisis — Lehman Brothers Bankruptcy',
    desc: 'Lehman Brothers collapsed, shaking the financial system. IT budgets are being cut 20%. Paradoxically, demand for cloud cost-saving solutions is rising.',
    choices: [
      '☁️ Launch cloud-based cost-reduction solution',
      '✂️ Cut internal costs & preserve cash',
      '💰 Seize opportunity to acquire undervalued competitors',
    ],
  },
  '앱스토어 경제 — 모바일 앱 황금기': {
    title: 'App Store Economy — Mobile App Golden Age',
    desc: 'Apple App Store and Google Play are revolutionizing software distribution. You can now reach millions of customers directly.',
    choices: [
      '📲 Launch App Store strategic product',
      '🔌 Connect existing products to mobile',
    ],
  },
  '클라우드·SaaS 혁명!': {
    title: 'Cloud & SaaS Revolution!',
    desc: 'AWS and Azure democratized the cloud. The SaaS subscription model becomes the new standard for software businesses.',
    choices: [
      '☁️ Full SaaS pivot — strategic investment',
      '🔄 Hybrid strategy (cloud + on-premise)',
      '📦 Stick with existing license model',
    ],
  },
  '유럽 재정위기 — 그리스·스페인 디폴트 위기': {
    title: 'European Debt Crisis — Greece & Spain Default Risk',
    desc: "Greece faces default, and Spain, Italy, and Portugal are wobbling. Europe's IT market is contracting sharply.",
    choices: [
      '🌍 Reduce European exposure — strengthen Asia & Americas',
      '💶 Launch austerity-focused solution for Europe',
    ],
  },
  '빅데이터 시대': {
    title: 'Big Data Era',
    desc: "Demand for data analytics & BI software is exploding. Data-driven decision-making has become every company's top priority.",
    choices: [
      '📊 Add large-scale data analytics & BI features',
      '🔗 Provide third-party analytics tool API integration',
    ],
  },
  '동일본 대지진 — 글로벌 공급망 충격': {
    title: 'Great East Japan Earthquake — Global Supply Chain Shock',
    desc: 'The 9.0 earthquake and tsunami devastated Japan. Global semiconductor and electronics supply chains are paralyzed.',
    choices: [
      '🌏 Diversify supply chain — strengthen cloud infrastructure',
      '🤝 Target Japan reconstruction IT demand',
    ],
  },
  'Docker·컨테이너 혁명': {
    title: 'Docker & Container Revolution',
    desc: 'Docker is revolutionizing software deployment. The shift to microservices architecture is beginning.',
    choices: [
      '🐳 Migrate to containers & microservices',
      '🔄 Optimize monolithic architecture',
    ],
  },
  'IoT 붐 — 모든 것이 연결된다': {
    title: 'IoT Boom — Everything Gets Connected',
    desc: 'The Internet of Things market is emerging. 50 billion devices are expected to be connected by 2020. Software platforms are key.',
    choices: [
      '📡 Proactively build IoT platform',
      '🔌 Provide IoT integration API',
    ],
  },
  '중국 증시 대폭락 — 신흥시장 패닉': {
    title: 'China Stock Market Crash — Emerging Market Panic',
    desc: "Shanghai's stock market dropped 40% in 3 months. All emerging markets are in panic; global IT investment sentiment plummets.",
    choices: [
      '🛡️ Focus on developed markets — avoid risk',
      '🇨🇳 Target China market at its bottom',
    ],
  },
  // ── 2016–2021 ──────────────────────────────────────────────────────────────
  'AI·딥러닝 기술 대중화': {
    title: 'AI & Deep Learning Goes Mainstream',
    desc: 'TensorFlow and PyTorch democratized AI development. Products with built-in AI features are starting to command a premium.',
    choices: [
      '🤖 Proactively integrate AI & ML features',
      '📈 Prioritize upgrading existing features',
    ],
  },
  '블록체인·암호화폐 광풍': {
    title: 'Blockchain & Crypto Frenzy',
    desc: 'Bitcoin surpassed $20,000 and enterprise demand for blockchain technology is exploding. Distributed-ledger software markets open up.',
    choices: [
      '⛓️ Launch blockchain-based product',
      '🔍 Proceed with blockchain technology review only',
    ],
  },
  'GDPR 시행 — 데이터 규제 쓰나미': {
    title: 'GDPR Enforcement — Data Regulation Tsunami',
    desc: "EU GDPR is in effect. Violations carry fines of 4% of global revenue or €20 million. Privacy compliance is now mandatory.",
    choices: [
      '🔒 Build full GDPR-compliant system',
      '📋 Minimal compliance response',
    ],
  },
  '구독 SaaS 시장 성숙': {
    title: 'Subscription SaaS Market Matures',
    desc: 'The SaaS subscription model is now fully established. Customer Lifetime Value (LTV) and Net Revenue Retention (NRR) are the key metrics.',
    choices: [
      '🎯 Greatly expand customer success team',
      '⚙️ Strengthen product automation features',
    ],
  },
  '5G 상용화 — 초연결 시대 개막': {
    title: '5G Goes Commercial — Ultra-Connected Era Begins',
    desc: '5G networks are live. Ultra-low latency and high speed open a new era for edge computing and real-time software.',
    choices: [
      '📶 Develop 5G-optimized real-time software',
      '🔌 Gradually add 5G capabilities',
    ],
  },
  'COVID-19 — 디지털 대전환 대폭발!': {
    title: 'COVID-19 — Digital Transformation Explosion!',
    desc: 'The entire world goes remote! Demand for video conferencing, collaboration, SaaS and cloud is at an all-time high.',
    choices: [
      '🚀 Massively strengthen remote work features (large investment)',
      '📈 Focus marketing on existing cloud products',
      '⏳ Focus on product stability first',
    ],
  },
  '메타버스·NFT 광풍': {
    title: 'Metaverse & NFT Frenzy',
    desc: "Meta's metaverse announcement and the NFT craze are heating up virtual-world software markets.",
    choices: [
      '🌐 Enter metaverse platform market',
      '🔍 Watch and wait — assess bubble risk',
    ],
  },
  // ── 2022–2030 ──────────────────────────────────────────────────────────────
  '금리 급등 — 테크 겨울': {
    title: 'Rate Hike Shock — Tech Winter',
    desc: "The Fed's aggressive rate hikes burst the tech bubble. Nasdaq fell 30% and VC funding was halved. Unprofitable startups are going under.",
    choices: [
      '✂️ Mass restructuring — prioritize profitability',
      '🛡️ Defend core products and customers',
      '💰 Seize opportunity to acquire undervalued competitors',
    ],
  },
  'ChatGPT — 생성형 AI 혁명!': {
    title: 'ChatGPT — Generative AI Revolution!',
    desc: 'OpenAI ChatGPT has launched! Generative AI is changing everything in the software industry.',
    choices: [
      '🤖 Full Generative AI integration — all-in on innovation',
      '⚡ Fast AI feature addition (MVP approach)',
      '🔍 Careful AI adoption after validation (conservative)',
    ],
  },
  'SVB 파산 — 스타트업 뱅킹 위기': {
    title: 'SVB Collapse — Startup Banking Crisis',
    desc: "Silicon Valley Bank failed! Thousands of tech startups couldn't access their deposits. Trust in the financial system is crumbling.",
    choices: [
      '🏦 Spread deposits across multiple banks — risk management',
      '💳 Strengthen fintech alternative financial channels',
    ],
  },
  'AI 코파일럿 — 개발생산성 혁명': {
    title: 'AI Copilot — Developer Productivity Revolution',
    desc: 'AI coding tools like GitHub Copilot and Cursor are boosting developer productivity 2–5×. AI lets fewer people build more products.',
    choices: [
      '🤖 Full AI dev tool rollout + team restructuring',
      '⚙️ Proactive adoption in select teams',
    ],
  },
  'AI 에이전트 시대 — 자율 소프트웨어': {
    title: 'AI Agent Era — Autonomous Software',
    desc: 'AI agents based on GPT-4, Claude, and Gemini can autonomously perform complex tasks. Software that runs itself is here.',
    choices: [
      '🚀 Proactively launch AI agent platform',
      '🔌 Add agent features to existing products',
    ],
  },
  'AI 에이전트·자율 코딩 시대': {
    title: 'AI Agents & Autonomous Coding Era',
    desc: 'Autonomous AI agents automate 70% of software development. Developer productivity rises 10× but competitive intensity also explodes.',
    choices: [
      '🚀 Build dedicated AI agent development team',
      '🔧 Add agent features to existing products',
    ],
  },
  'AI 규제 — EU AI법 전면 시행': {
    title: 'AI Regulation — EU AI Act Takes Full Effect',
    desc: 'The EU AI Act is fully enforced. Strong regulations on high-risk AI systems cause compliance costs to skyrocket.',
    choices: [
      '🔒 Proactively build AI compliance system',
      '🌍 Focus on non-EU markets',
    ],
  },
  'AR·공간 컴퓨팅 시장 개화': {
    title: 'AR & Spatial Computing Market Blooms',
    desc: 'The spread of spatial computing devices opens entirely new software categories.',
    choices: [
      '🥽 Proactively develop spatial computing apps',
      '🔌 Extend existing products to spatial computing',
    ],
  },
  '양자컴퓨팅 상용화 원년': {
    title: 'Quantum Computing Commercialization Year One',
    desc: 'Quantum computers have finally been commercialized! A completely new era opens for encryption, optimization, and simulation software.',
    choices: [
      '⚛️ Proactively develop quantum algorithms',
      '🔄 Quantum-optimize existing products',
    ],
  },
  // ── 2031–2050 ──────────────────────────────────────────────────────────────
  'AI 일자리 대란 — 사회적 격변': {
    title: 'AI Jobs Crisis — Social Upheaval',
    desc: 'AI automation has eliminated 35% of white-collar jobs worldwide. Governments are beginning to impose automation taxes on AI companies.',
    choices: [
      '🤝 Launch AI retraining platform — corporate responsibility',
      '🛡️ Strengthen lobbying & compliance',
    ],
  },
  'AGI 등장 — 소프트웨어의 종말과 부활': {
    title: 'AGI Arrives — End and Rebirth of Software',
    desc: 'Artificial General Intelligence has emerged! The software development paradigm is fundamentally transformed.',
    choices: [
      '✨ Pivot to AGI-native platform — complete reinvention',
      '🤝 Integrate AGI APIs to innovate features',
      '🛡️ Defend existing customer base',
    ],
  },
  '디지털 대재앙 — 글로벌 사이버 공격': {
    title: 'Digital Catastrophe — Global Cyberattack',
    desc: 'Nation-state hackers attacked major software infrastructure worldwide. Companies with weak security suffer devastating blows.',
    choices: [
      '🔐 Build full zero-trust security system',
      '🛡️ Apply essential security patches only',
    ],
  },
  '디지털-물리 통합 (사이버-피지컬)': {
    title: 'Digital-Physical Integration (Cyber-Physical)',
    desc: 'Digital twins and cyber-physical integration become the norm. Software that directly controls the physical world enters a new era.',
    choices: [
      '🌍 Proactively build cyber-physical integration platform',
      '📡 Add IoT & digital twin features',
    ],
  },
  '뇌-컴퓨터 인터페이스 대중화': {
    title: 'Brain-Computer Interface Goes Mainstream',
    desc: 'BCI technology reaches mass adoption, introducing an entirely new software interface paradigm.',
    choices: [
      '🧠 Develop BCI-native software',
      '🔌 Add BCI support to existing software',
    ],
  },
};

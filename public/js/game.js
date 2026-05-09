'use strict';
// ═══════════════════════════════════════════════════════
//  CEO SIMULATOR 1980–2050  ·  game.js
//  Sections:
//   1. CONSTANTS & GAME DATA
//   2. GAME STATE
//   3. CALCULATIONS (market, finance)
//   4. TURN ENGINE
//   5. COMPETITOR AI
//   6. UI RENDERING
//   7. CHARTS
//   8. MODALS & EVENT FLOW
//   9. INITIALIZATION
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// 1. CONSTANTS & GAME DATA
// ═══════════════════════════════════════════════════════

// Market sizes: annual TAM in USD millions
// Built by linear interpolation between key anchor points
const MARKET_TAM = (() => {
  // 단위: $M (연간). 실제 글로벌 엔터프라이즈 소프트웨어 시장 기준으로 조정.
  // 2050년 $6T → 직원 수/매출 현실성 유지 (이전 $360T는 지나치게 과도)
  const pts = [
    [1980,   5000],  [1985,  12000],  [1990,  38000],
    [1994,  90000],  [1996, 130000],  [2000, 280000],
    [2001,  210000], [2003, 200000],  [2005, 280000],
    [2007,  360000], [2008, 320000],  [2010, 450000],
    [2015,  720000], [2019,1000000],  [2020,1200000],
    [2022, 1500000], [2025,1900000],  [2030,2600000],
    [2040, 4000000], [2050,6000000],
  ];
  const m = {};
  for (let i = 0; i < pts.length - 1; i++) {
    const [y0,v0] = pts[i], [y1,v1] = pts[i+1];
    for (let y = y0; y < y1; y++) {
      m[y] = v0 + (v1-v0)*(y-y0)/(y1-y0);
    }
  }
  m[2050] = 6000000;
  return m;
})();

// Annual salary per employee (USD)
const SALARY_RATE = (() => {
  const pts = [
    [1980,28000],[1985,38000],[1990,56000],[1995,74000],
    [2000,108000],[2003,100000],[2005,105000],[2010,122000],
    [2015,148000],[2020,182000],[2025,235000],
    [2030,310000],[2040,510000],[2050,840000],
  ];
  const m = {};
  for (let i = 0; i < pts.length-1; i++) {
    const [y0,v0]= pts[i],[y1,v1]= pts[i+1];
    for (let y=y0; y<y1; y++) m[y] = v0+(v1-v0)*(y-y0)/(y1-y0);
  }
  m[2050]=840000; return m;
})();

// Annual revenue per employee benchmark (USD) — how much revenue one FTE can "carry"
// Below this ratio → understaffed / quality suffers
const REV_PER_EMP_BENCH = (() => {
  const pts = [
    [1980, 80000],[1990,130000],[2000,200000],[2010,280000],
    [2020,420000],[2030,650000],[2040,950000],[2050,1500000],
  ];
  const m = {};
  for (let i = 0; i < pts.length-1; i++) {
    const [y0,v0]= pts[i],[y1,v1]= pts[i+1];
    for (let y=y0; y<y1; y++) m[y] = v0+(v1-v0)*(y-y0)/(y1-y0);
  }
  m[2050]=1500000; return m;
})();

// Total addressable customers in market (individuals + businesses)
const MARKET_CUSTOMERS = (() => {
  const pts = [
    [1980,    200000], [1985,    800000], [1990,   5000000],
    [1995,  80000000], [2000,  400000000],[2005,  900000000],
    [2010,2000000000], [2015, 3000000000],[2020, 4500000000],
    [2030,6000000000], [2050, 9000000000],
  ];
  const m = {};
  for (let i = 0; i < pts.length-1; i++) {
    const [y0,v0] = pts[i], [y1,v1] = pts[i+1];
    for (let y = y0; y < y1; y++) m[y] = Math.round(v0+(v1-v0)*(y-y0)/(y1-y0));
  }
  m[2050] = 9000000000; return m;
})();

const ERAS = [
  { year:1980, end:1994, name:'PC 소프트웨어 시대', icon:'💾', color:'#3b82f6', desc:'개인용 PC가 보급되며 비즈니스 소프트웨어 황금기가 시작됩니다.' },
  { year:1995, end:2006, name:'인터넷 혁명 시대',   icon:'🌐', color:'#8b5cf6', desc:'월드와이드웹이 소프트웨어 배포와 비즈니스 모델을 완전히 바꿉니다.' },
  { year:2007, end:2021, name:'모바일·클라우드 시대',icon:'☁️', color:'#ec4899', desc:'스마트폰과 SaaS가 산업 표준이 됩니다.' },
  { year:2022, end:2035, name:'AI 혁명 시대',       icon:'🤖', color:'#f59e0b', desc:'생성형 AI가 소프트웨어 개발과 사용을 근본적으로 변화시킵니다.' },
  { year:2036, end:2050, name:'AGI 이후 시대',      icon:'✨', color:'#10b981', desc:'범용 인공지능이 소프트웨어 산업 자체를 재정의합니다.' },
];

// ── 난이도별 게임 파라미터 ────────────────────────────────────────────────
// 7개 축으로 난이도 차이를 현실적으로 구분
const DIFF_MULTS = {
  //              현금    경쟁사  경쟁사   초기      대출    VC희석   위기   경쟁사
  //              배율    스탯    예산     점유율    이자    배율     피해   구제
  easy:   { cash:2.0, compStr:0.60, compBudget:0.65, shareBonus:1.80, loanRate:0.70, vcDil:0.75, crisis:0.50, rescue:1.80 },
  normal: { cash:1.0, compStr:1.00, compBudget:1.00, shareBonus:1.00, loanRate:1.00, vcDil:1.00, crisis:1.00, rescue:1.00 },
  hard:   { cash:0.5, compStr:1.40, compBudget:1.40, shareBonus:0.50, loanRate:1.60, vcDil:1.40, crisis:1.80, rescue:0.35 },
};

// ── 시대별 실제 기업 재무 데이터 DB ────────────────────────────────────────────
// 출처: SEC Filing / 각사 Annual Report (단위: rev = $M 연간, emp = 연말 직원 수)
// 게임 내 COGS 비율, 이익률 벤치마크 산출 기준으로 활용
const ERA_FINANCIALS = [

  // ══ PC 소프트웨어 시대 (1980–1994) ══════════════════════════════════════════
  { eraIdx: 0,
    refs: [
      // 패키지 소프트웨어: 디스크 복제 비용 낮음 → 총이익률 75–85%
      { co:'Microsoft',  yr:1990, rev:1180,  opMg:0.322, grsMg:0.82, rpe:211000, emp:5600,  note:'DOS·Windows 초기 황금기' },
      { co:'Microsoft',  yr:1993, rev:3753,  opMg:0.343, grsMg:0.83, rpe:220000, emp:17130, note:'Office 독점 강화' },
      { co:'Lotus',      yr:1990, rev:685,   opMg:0.178, grsMg:0.75, rpe:171000, emp:4000,  note:'1-2-3 전성기' },
      { co:'WordPerfect',yr:1992, rev:690,   opMg:0.215, grsMg:0.77, rpe:153000, emp:4500,  note:'워드프로세서 1위' },
      { co:'Borland',    yr:1992, rev:483,   opMg:0.074, grsMg:0.70, rpe:138000, emp:3500,  note:'개발도구·스프레드시트' },
      { co:'Intuit',     yr:1993, rev:299,   opMg:0.142, grsMg:0.79, rpe:199000, emp:1500,  note:'Quicken 개인 재무' },
    ],
    cogsPct:       0.20,  // 총이익률 ~80% (패키지 SW 배포·제조)
    opMgGood:      0.20,  // 이 시대 양호 영업이익률
    opMgElite:     0.34,  // 최우수 (Microsoft 수준)
    opMgWeak:      0.05,  // 취약 (Borland 수준)
    rpeRef:        170000,// 인당 연매출 기준
    desc:          'PC 패키지 SW — 디스크 배포, 높은 총이익률',
  },

  // ══ 인터넷 혁명 시대 (1995–2006) ════════════════════════════════════════════
  { eraIdx: 1,
    refs: [
      // 온라인 배포 → COGS↓, 그러나 닷컴 버블로 극단적 분화
      { co:'Microsoft',  yr:2000, rev:22956, opMg:0.435, grsMg:0.87, rpe:586000, emp:39170, note:'Windows·Office 독점 절정' },
      { co:'Microsoft',  yr:2003, rev:32187, opMg:0.371, grsMg:0.85, rpe:531000, emp:55000, note:'IE 독점·닷컴 이후 안정' },
      { co:'Oracle',     yr:2000, rev:10130, opMg:0.281, grsMg:0.77, rpe:231000, emp:43800, note:'엔터프라이즈 DB 강자' },
      { co:'Oracle',     yr:2004, rev:10156, opMg:0.264, grsMg:0.76, rpe:232000, emp:43800, note:'닷컴 이후 회복' },
      { co:'SAP',        yr:2000, rev:7000,  opMg:0.168, grsMg:0.70, rpe:174000, emp:24000, note:'ERP 글로벌 표준 (EUR→USD 환산)' },
      { co:'Siebel',     yr:2001, rev:1460,  opMg:0.195, grsMg:0.76, rpe:195000, emp:7500,  note:'CRM 1위, 닷컴 이후 급락' },
      { co:'Salesforce', yr:2004, rev:96,    opMg:-0.15, grsMg:0.68, rpe:125000, emp:767,   note:'SaaS 선구자 — 성장 투자 단계' },
      { co:'Intuit',     yr:2003, rev:1650,  opMg:0.218, grsMg:0.80, rpe:220000, emp:7500,  note:'SaaS 전환 준비' },
    ],
    cogsPct:       0.18,  // 총이익률 ~82% (온라인 배포, 인터넷 유통 비용↓)
    opMgGood:      0.20,  // 닷컴 이후 생존 기업 평균
    opMgElite:     0.43,  // Microsoft 황금기
    opMgWeak:     -0.10,  // 닷컴 스타트업 성장 투자 적자
    rpeRef:        350000,
    desc:          '인터넷 배포 → COGS 최소화, 닷컴 거품·붕괴 공존',
  },

  // ══ 모바일·클라우드 시대 (2007–2021) ════════════════════════════════════════
  { eraIdx: 2,
    refs: [
      // SaaS 구독모델 + 클라우드 인프라 비용 → 총이익률 65–80%
      { co:'Microsoft',  yr:2015, rev:93580, opMg:0.194, grsMg:0.65, rpe:793000, emp:118000,note:'Surface·전화 손실 포함, 클라우드 전환기' },
      { co:'Microsoft',  yr:2020, rev:143015,opMg:0.370, grsMg:0.68, rpe:877000, emp:163000,note:'Azure·Teams 성장, 코로나 수혜' },
      { co:'Salesforce', yr:2015, rev:6670,  opMg:0.012, grsMg:0.74, rpe:440000, emp:15150, note:'CRM SaaS 1위 — 공격적 성장' },
      { co:'Salesforce', yr:2020, rev:17098, opMg:0.021, grsMg:0.74, rpe:349000, emp:49000, note:'대형 인수합병으로 마진 압박' },
      { co:'Adobe',      yr:2020, rev:12868, opMg:0.356, grsMg:0.86, rpe:585000, emp:22000, note:'Creative Cloud 구독 전환 성공' },
      { co:'ServiceNow', yr:2020, rev:4519,  opMg:0.024, grsMg:0.75, rpe:407000, emp:11100, note:'엔터프라이즈 워크플로우 강자' },
      { co:'Zoom',       yr:2020, rev:2651,  opMg:0.271, grsMg:0.72, rpe:497000, emp:5300,  note:'코로나 특수 — 폭발적 성장' },
      { co:'Workday',    yr:2020, rev:4319,  opMg:-0.07, grsMg:0.72, rpe:361000, emp:12000, note:'HCM/재무 SaaS, 성장 우선 전략' },
      { co:'Atlassian',  yr:2021, rev:2095,  opMg:-0.09, grsMg:0.83, rpe:370000, emp:5700,  note:'DevOps SaaS — R&D 집중 투자' },
    ],
    cogsPct:       0.25,  // SaaS 클라우드 인프라 비용 (AWS/GCP/Azure)
    opMgGood:      0.15,  // 클라우드 성숙 기업 평균
    opMgElite:     0.37,  // Adobe 수준 구독 전환 성공
    opMgWeak:     -0.07,  // 공격적 성장 SaaS (Workday, Atlassian)
    rpeRef:        550000,
    desc:          'SaaS 구독 + 클라우드 인프라 비용, 성장 vs 마진 트레이드오프',
  },

  // ══ AI 혁명 시대 (2022–2035) ═════════════════════════════════════════════════
  { eraIdx: 3,
    refs: [
      // GPU 추론 비용 → COGS 급증, 그러나 AI 효율 기업은 슈퍼마진
      { co:'Microsoft',  yr:2023, rev:211915,opMg:0.416, grsMg:0.70, rpe:958000, emp:221000,note:'Azure AI + Copilot, OpenAI 투자 수혜' },
      { co:'Google',     yr:2023, rev:307394,opMg:0.270, grsMg:0.56, rpe:1415000,emp:182000,note:'광고+클라우드, AI 전환 비용 반영' },
      { co:'Nvidia',     yr:2024, rev:60922, opMg:0.549, grsMg:0.74, rpe:3588000,emp:17000, note:'AI 반도체 독점 — 역대급 마진' },
      { co:'OpenAI',     yr:2024, rev:3400,  opMg:-1.10, grsMg:0.50, rpe:382000, emp:3000,  note:'GPU 추론 비용 막대 (추정치)' },
      { co:'Anthropic',  yr:2024, rev:850,   opMg:-3.50, grsMg:0.45, rpe:654000, emp:1000,  note:'AI 안전 연구·추론 비용 (추정치)' },
      { co:'Palantir',   yr:2023, rev:2229,  opMg:0.160, grsMg:0.81, rpe:397000, emp:3609,  note:'AI 플랫폼 정부·기업 시장' },
    ],
    cogsPct:       0.30,  // AI 추론 비용 (GPU 집약) — 높은 COGS
    opMgGood:      0.22,  // AI 효율화 성숙 기업
    opMgElite:     0.55,  // Nvidia 수준 (AI 인프라 독점적 지위)
    opMgWeak:     -0.50,  // AI 연구개발 스타트업 (OpenAI·Anthropic 초기)
    rpeRef:        900000,
    desc:          'AI 추론 GPU 비용 급증, 그러나 AI 인프라 선점 기업 슈퍼마진',
  },

  // ══ AGI 이후 시대 (2036–2050) ════════════════════════════════════════════════
  { eraIdx: 4,
    refs: [], // 미래 예측 — 역사적 데이터 없음
    cogsPct:       0.15,  // AGI로 인프라 자동화 → COGS 최소화
    opMgGood:      0.35,
    opMgElite:     0.65,  // 소프트웨어·AI 완전 자동화
    opMgWeak:      0.05,
    rpeRef:        2500000,
    desc:          'AGI 자동화로 인프라 비용↓, 인당 생산성 폭증',
  },
];

// 현재 시대 재무 파라미터 조회 헬퍼
function getEraFinancials() {
  const idx = Math.min(getEraIndex(), ERA_FINANCIALS.length - 1);
  return ERA_FINANCIALS[idx];
}

// Historical events: { y, q, type, title, desc, effects, choices }
const EVENTS = [
  // ══════════════════════════════════
  // 1980s — PC 소프트웨어 시대
  // ══════════════════════════════════
  { y:1981,q:3, type:'opportunity', title:'IBM PC 출시!',
    desc:'IBM이 개인용 컴퓨터를 출시했습니다. 비즈니스 소프트웨어 시장이 폭발적으로 성장할 것입니다!',
    effects:{ marketMult:1.3 },
    choices:[
      { label:'📦 PC 호환 제품 긴급 개발 투자', cost:0.10, effect:{ quality:6, brand:3 } },
      { label:'⏳ 시장 관망 후 안정적 진입',   cost:0,    effect:{ quality:2, brand:1 } },
    ]},
  { y:1983,q:2, type:'opportunity', title:'Lotus 1-2-3 스프레드시트 열풍',
    desc:'스프레드시트 소프트웨어가 PC의 킬러앱이 되었습니다. 생산성 소프트웨어 수요가 급증하고 있습니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'📊 생산성 소프트웨어 라인업 강화', cost:0.07, effect:{ quality:4, brand:3 } },
      { label:'🔄 현 제품 품질 개선에 집중',    cost:0,    effect:{ quality:3 } },
    ]},
  { y:1984,q:1, type:'shift', title:'Apple Macintosh — GUI 혁명',
    desc:'GUI 기반 OS가 등장했습니다. 소프트웨어의 사용자 경험이 이제 핵심 경쟁 요소입니다.',
    effects:{},
    choices:[
      { label:'🎨 GUI/UX 전면 개편 — 미래에 투자', cost:0.15, effect:{ quality:7, brand:4, tech:3 } },
      { label:'🔧 기존 텍스트 인터페이스 유지',    cost:0,    effect:{ quality:-2, brand:-2 } },
    ]},
  { y:1985,q:4, type:'opportunity', title:'Microsoft Windows 1.0 출시',
    desc:'Microsoft가 Windows를 공개했습니다. GUI 소프트웨어 생태계가 열리고 있습니다. 아직 조악하지만 미래는 여기에 있습니다.',
    effects:{ marketMult:1.1 },
    choices:[
      { label:'🖥️ Windows 생태계 조기 참여', cost:0.10, effect:{ quality:4, tech:4, brand:2 } },
      { label:'⏳ Windows 성숙 후 진입',     cost:0,    effect:{ quality:1 } },
    ]},
  { y:1987,q:4, type:'crisis', title:'블랙 먼데이 — 주식시장 대폭락',
    desc:'1987년 10월 19일, 다우존스가 하루 만에 22.6% 폭락했습니다! 기업 IT 예산이 긴급 삭감되고 있습니다.',
    effects:{ marketMult:0.85, cashPenalty:0.06 },
    choices:[
      { label:'✂️ 긴급 비용 절감 — 현금 보존',     cost:0,    effect:{ employees:-2, quality:-2 } },
      { label:'🎯 불황 속 틈새 고객 집중 공략',     cost:0.04, effect:{ quality:3, brand:2 } },
    ]},
  { y:1987,q:3, type:'opportunity', title:'데스크탑 퍼블리싱 붐',
    desc:'PageMaker, QuarkXPress 등 DTP 소프트웨어가 인쇄 산업을 혁신합니다. 전문 소프트웨어 시장이 열렸습니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🖨️ DTP·미디어 소프트웨어 진출', cost:0.08, effect:{ quality:4, brand:3 } },
      { label:'🏢 기업용 소프트웨어 집중',      cost:0,    effect:{ quality:2 } },
    ]},
  { y:1990,q:3, type:'crisis', title:'걸프전·경기침체 — IT 예산 삭감',
    desc:'이라크의 쿠웨이트 침공과 미국 경기침체가 겹쳤습니다. 기업들이 IT 지출을 대폭 줄이고 있습니다.',
    effects:{ marketMult:0.88, cashPenalty:0.04 },
    choices:[
      { label:'🛡️ 정부·국방 분야 소프트웨어 진출', cost:0.06, effect:{ quality:3, brand:2 } },
      { label:'⚙️ 비용 절감형 제품으로 포지셔닝',  cost:0.03, effect:{ quality:2, brand:3 } },
    ]},
  { y:1990,q:2, type:'boom', title:'Windows 3.0 출시 — PC 소프트웨어 대폭발!',
    desc:'Microsoft Windows 3.0이 출시되었습니다! PC 보급률이 폭발적으로 증가하고 소프트웨어 시장이 5년 안에 5배 성장할 것으로 예상됩니다.',
    effects:{ marketMult:1.8 },
    choices:[
      { label:'🚀 Windows 네이티브 제품 전면 출시', cost:0.28, effect:{ quality:9, brand:6, tech:4 } },
      { label:'⚡ 점진적 Windows 지원 추가',        cost:0.12, effect:{ quality:4, brand:3 } },
      { label:'💾 DOS 제품 유지 (시장 관망)',        cost:0,    effect:{ quality:-3, brand:-2 } },
    ]},

  // ══════════════════════════════════
  // 1990s — 인터넷 혁명 시대
  // ══════════════════════════════════
  { y:1992,q:2, type:'opportunity', title:'Windows NT — 기업용 OS 시장 개막',
    desc:'Microsoft Windows NT가 출시되어 기업 서버 시장을 공략합니다. 엔터프라이즈 소프트웨어 시장이 열립니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🏢 엔터프라이즈 소프트웨어 선제 진출', cost:0.18, effect:{ quality:5, tech:4, brand:2 } },
      { label:'🏠 SMB 시장 집중 유지',               cost:0,    effect:{ quality:2, brand:2 } },
    ]},
  { y:1993,q:3, type:'opportunity', title:'멀티미디어 PC & CD-ROM 붐',
    desc:'CD-ROM과 멀티미디어 콘텐츠 소프트웨어 수요가 급증합니다. 새로운 소프트웨어 카테고리가 열렸습니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🎮 멀티미디어·게임 기능 추가', cost:0.09, effect:{ quality:4, brand:4 } },
      { label:'📌 비즈니스 소프트웨어 집중',  cost:0,    effect:{ quality:2 } },
    ]},
  { y:1994,q:2, type:'revolution', title:'Mosaic 브라우저 & WWW — 인터넷 여명',
    desc:'NCSA Mosaic 브라우저가 인터넷을 일반인에게 열었습니다. 웹이 새로운 소프트웨어 플랫폼이 될 것입니다. 지금 준비하는 기업이 미래를 가져갑니다.',
    effects:{ marketMult:1.3 },
    choices:[
      { label:'🌐 웹 기반 제품 선제 개발 착수', cost:0.18, effect:{ quality:5, tech:6, brand:3 } },
      { label:'📡 인터넷 마케팅 채널 구축',     cost:0.06, effect:{ brand:5, quality:1 } },
      { label:'⏳ 인터넷 성숙 후 대응',         cost:0,    effect:{ quality:1 } },
    ]},
  { y:1994,q:4, type:'crisis', title:'멕시코 페소 위기 — 신흥시장 충격',
    desc:'멕시코 페소화가 50% 폭락하며 신흥시장 전체가 흔들립니다. 라틴아메리카 IT 시장이 급격히 위축됩니다.',
    effects:{ marketMult:0.93, cashPenalty:0.03 },
    choices:[
      { label:'🌍 북미·유럽 선진국 시장 집중',   cost:0,    effect:{ brand:2, quality:1 } },
      { label:'💡 저가형 제품으로 신흥시장 유지', cost:0.04, effect:{ brand:3, quality:1 } },
    ]},
  { y:1995,q:3, type:'revolution', title:'인터넷 혁명 시작! — 넷스케이프 IPO',
    desc:'넷스케이프 IPO와 함께 인터넷 시대가 열렸습니다! 웹 기반 소프트웨어가 미래입니다. 지금 전환하지 않으면 5년 안에 시장에서 퇴출될 수도 있습니다.',
    effects:{ marketMult:2.0, eraShift:1 },
    choices:[
      { label:'🌐 웹 기반 제품 전면 전환 (대규모)',  cost:0.55, effect:{ quality:12, brand:8, tech:8 } },
      { label:'🔄 점진적 인터넷 기능 추가',          cost:0.22, effect:{ quality:5, brand:4, tech:4 } },
      { label:'💻 기존 데스크탑 소프트웨어 고수',    cost:0,    effect:{ quality:-6, brand:-4, tech:-2 } },
    ]},
  { y:1996,q:2, type:'opportunity', title:'Java 혁명 — Write Once Run Anywhere',
    desc:'Sun Microsystems의 Java가 크로스플랫폼 소프트웨어 개발을 혁신합니다. 엔터프라이즈 시장의 새 표준이 될 것입니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'☕ Java 기반 제품 아키텍처 전환', cost:0.22, effect:{ tech:7, quality:4, brand:2 } },
      { label:'🔌 Java API 부분 지원',           cost:0.07, effect:{ tech:3, quality:2 } },
    ]},
  { y:1997,q:2, type:'opportunity', title:'ERP·엔터프라이즈 소프트웨어 붐',
    desc:'SAP, Oracle의 성공으로 기업용 ERP·CRM 소프트웨어 시장이 폭발적으로 성장합니다.',
    effects:{ marketMult:1.25 },
    choices:[
      { label:'🏭 엔터프라이즈 기능 대폭 강화', cost:0.28, effect:{ quality:6, brand:4, tech:3 } },
      { label:'🏠 중소기업 시장 집중 유지',     cost:0,    effect:{ quality:2, brand:2 } },
    ]},
  { y:1997,q:4, type:'crisis', title:'아시아 금융위기 — IMF 구제금융',
    desc:'태국 밧화 폭락으로 시작된 아시아 금융위기가 한국·인도네시아·말레이시아를 강타했습니다. 아시아 IT 시장이 반토막납니다.',
    effects:{ marketMult:0.87, cashPenalty:0.05 },
    choices:[
      { label:'🌏 아시아 시장 철수 — 서구 집중',    cost:0,    effect:{ brand:2, employees:-1 } },
      { label:'💰 저평가된 아시아 인재·사무소 인수', cost:0.18, effect:{ tech:5, employees:3 } },
    ]},
  { y:1998,q:3, type:'crisis', title:'러시아 디폴트 & LTCM 붕괴',
    desc:'러시아가 채무불이행을 선언하고 헤지펀드 LTCM이 붕괴했습니다. 글로벌 금융 시스템에 충격파가 퍼집니다.',
    effects:{ marketMult:0.91, cashPenalty:0.04 },
    choices:[
      { label:'🛡️ 안전자산 확보 — 현금 유보 강화',   cost:0,    effect:{ quality:1 } },
      { label:'📈 불황에도 성장하는 소프트웨어 강조',  cost:0.07, effect:{ brand:4, quality:2 } },
    ]},
  { y:1999,q:1, type:'boom', title:'닷컴 골드러시!',
    desc:'인터넷 버블 절정! VC 투자가 넘쳐나고 모든 소프트웨어 회사의 가치가 치솟고 있습니다.',
    effects:{ marketMult:1.4, cashBonus:0.15 },
    choices:[
      { label:'🚀 공격적 마케팅·채용 확대 (버블 활용)', cost:0.42, effect:{ brand:10, employees:5 } },
      { label:'💡 제품 품질 강화에 집중',               cost:0.18, effect:{ quality:6, brand:3 } },
    ]},
  { y:1999,q:4, type:'opportunity', title:'Y2K 버그 대응 — 레거시 IT 폭발',
    desc:'2000년 문제(Y2K) 대응으로 기업 IT 예산이 사상 최대로 늘었습니다. 레거시 시스템 교체 수요가 폭발합니다.',
    effects:{ marketMult:1.35, cashBonus:0.08 },
    choices:[
      { label:'🔧 Y2K 호환 솔루션 긴급 출시', cost:0.20, effect:{ quality:4, brand:6, tech:2 } },
      { label:'📋 컨설팅·마이그레이션 서비스', cost:0.09, effect:{ brand:7, quality:2 } },
    ]},

  // ══════════════════════════════════
  // 2000s — 닷컴 버스트 & 모바일 여명
  // ══════════════════════════════════
  { y:2000,q:4, type:'crisis', title:'닷컴 버블 붕괴!',
    desc:'NASDAQ이 78% 폭락했습니다. IT 예산이 30~50% 삭감되고 있습니다. 수익성 없는 회사들이 줄줄이 파산합니다.',
    effects:{ marketMult:0.72, cashPenalty:0.1 },
    choices:[
      { label:'✂️ 비용 대규모 절감 — 직원 감축', cost:0,    effect:{ employees:-4, quality:-3, brand:-2 } },
      { label:'🛡️ 핵심 제품·고객 방어에 집중',  cost:0.12, effect:{ quality:3, brand:3 } },
      { label:'🏃 경쟁사 M&A — 기회 포착',       cost:0.55, effect:{ quality:6, brand:4, tech:4 } },
    ]},
  { y:2001,q:4, type:'crisis', title:'9/11 테러 — 경기 침체',
    desc:'9/11 테러 이후 기업 IT 투자가 급감했습니다. 글로벌 불확실성이 극도로 높습니다.',
    effects:{ marketMult:0.88, cashPenalty:0.05 },
    choices:[
      { label:'📉 운영 비용 절감 집중', cost:0,    effect:{ employees:-2, quality:-1 } },
      { label:'🔍 틈새시장 공략 강화', cost:0.09,  effect:{ quality:3, brand:2 } },
    ]},
  { y:2003,q:1, type:'crisis', title:'SARS 사태 — 아시아 경제 충격',
    desc:'중증급성호흡기증후군(SARS)이 아시아를 강타했습니다. 대면 영업이 불가능해지고 원격 소프트웨어 수요가 급등합니다.',
    effects:{ marketMult:0.93 },
    choices:[
      { label:'📡 원격 협업·화상회의 기능 강화', cost:0.12, effect:{ quality:4, brand:5, tech:3 } },
      { label:'📦 오프라인 대응 유지',           cost:0,    effect:{ quality:1 } },
    ]},
  { y:2003,q:3, type:'opportunity', title:'오픈소스 혁명 — Linux·Apache 전성기',
    desc:'리눅스와 오픈소스 생태계가 기업 IT를 장악합니다. 오픈소스 전략이 없는 기업은 뒤처집니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🐧 오픈소스 기반 제품 전환',   cost:0.14, effect:{ tech:7, brand:4, quality:3 } },
      { label:'🔒 독점 소프트웨어 전략 고수', cost:0,    effect:{ quality:2, brand:-2 } },
    ]},
  { y:2004,q:2, type:'opportunity', title:'소셜 네트워크 & Facebook 시대',
    desc:'소셜 플랫폼이 급성장합니다. 소셜 기능 통합과 바이럴 마케팅이 새로운 경쟁 무기가 됩니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'📱 소셜 기능 대규모 통합', cost:0.18, effect:{ quality:4, brand:6, tech:2 } },
      { label:'🏢 기업용 기능 집중 강화', cost:0.10, effect:{ quality:5, brand:1 } },
    ]},
  { y:2005,q:2, type:'opportunity', title:'Web 2.0 혁명 — AJAX·YouTube',
    desc:'동적 웹 기술(AJAX)과 YouTube로 대표되는 Web 2.0 시대가 열렸습니다. 사용자 참여형 소프트웨어가 대세입니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'🌐 Web 2.0 UX 전면 리뉴얼', cost:0.22, effect:{ quality:6, brand:5, tech:4 } },
      { label:'📺 동영상·미디어 기능 추가',  cost:0.10, effect:{ brand:6, quality:2 } },
    ]},
  { y:2006,q:3, type:'revolution', title:'AWS S3·EC2 출시 — 클라우드 인프라 혁명',
    desc:'Amazon이 클라우드 인프라 서비스를 시작했습니다. 이제 서버 없이도 글로벌 소프트웨어를 운영할 수 있습니다. 클라우드 네이티브 시대의 시작입니다.',
    effects:{ marketMult:1.25 },
    choices:[
      { label:'☁️ AWS 기반 클라우드 아키텍처 전환', cost:0.28, effect:{ tech:8, quality:5, brand:3 } },
      { label:'🔄 자체 서버 + 클라우드 하이브리드',  cost:0.10, effect:{ tech:3, quality:2 } },
    ]},

  // ══════════════════════════════════
  // 2007-2015 — 모바일·클라우드 시대
  // ══════════════════════════════════
  { y:2007,q:3, type:'revolution', title:'iPhone 출시 — 모바일 혁명!',
    desc:'Apple iPhone이 출시되었습니다! 모바일 소프트웨어 시대가 열립니다. 모바일 앱 없이는 미래 시장에서 생존이 불가능합니다.',
    effects:{ marketMult:1.6, eraShift:2 },
    choices:[
      { label:'📱 모바일 앱 전면 개발 (대규모)', cost:0.65, effect:{ quality:11, brand:9, tech:7 } },
      { label:'🔄 모바일 웹 최적화 + 앱 개발',   cost:0.28, effect:{ quality:6, brand:4, tech:4 } },
      { label:'💻 데스크탑·웹 집중 유지',         cost:0,    effect:{ quality:-4, brand:-5, tech:-2 } },
    ]},
  { y:2008,q:4, type:'crisis', title:'글로벌 금융 위기 — 리먼 브라더스 파산',
    desc:'리먼 브라더스 파산으로 금융 시스템이 흔들립니다. IT 예산이 20% 삭감되고 있습니다. 클라우드 기반 비용 절감 솔루션 수요는 역설적으로 증가합니다.',
    effects:{ marketMult:0.82, cashPenalty:0.08 },
    choices:[
      { label:'☁️ 클라우드 기반 비용절감 솔루션 출시', cost:0.18, effect:{ quality:5, brand:5, tech:4 } },
      { label:'✂️ 내부 비용 절감 & 현금 보존',         cost:0,    effect:{ employees:-3, quality:-2 } },
      { label:'💰 경쟁사 저가 인수 기회 포착',         cost:0.45, effect:{ quality:7, brand:4, tech:5 } },
    ]},
  { y:2009,q:2, type:'opportunity', title:'앱스토어 경제 — 모바일 앱 황금기',
    desc:'Apple App Store와 Google Play가 새로운 소프트웨어 유통 혁명을 일으킵니다. 수백만 명의 고객에게 직접 도달할 수 있습니다.',
    effects:{ marketMult:1.3 },
    choices:[
      { label:'📲 앱스토어 전략 제품 출시', cost:0.20, effect:{ quality:6, brand:8, tech:3 } },
      { label:'🔌 기존 제품 모바일 연동',  cost:0.07, effect:{ quality:3, brand:4 } },
    ]},
  { y:2010,q:2, type:'revolution', title:'클라우드·SaaS 혁명!',
    desc:'AWS와 Azure가 클라우드를 민주화했습니다. SaaS 구독 모델이 소프트웨어 비즈니스의 새 표준이 됩니다.',
    effects:{ marketMult:1.55 },
    choices:[
      { label:'☁️ SaaS 전면 전환 — 전략적 투자',          cost:0.90, effect:{ quality:9, brand:7, tech:8 } },
      { label:'🔄 하이브리드 (클라우드+온프레미스) 전략',  cost:0.30, effect:{ quality:4, brand:3, tech:4 } },
      { label:'📦 기존 라이선스 모델 고수',                cost:0,    effect:{ quality:-5, brand:-6, tech:-3 } },
    ]},
  { y:2010,q:4, type:'crisis', title:'유럽 재정위기 — 그리스·스페인 디폴트 위기',
    desc:'그리스가 디폴트 위기에 처하고 스페인·이탈리아·포르투갈도 흔들립니다. 유럽 IT 시장이 급격히 위축됩니다.',
    effects:{ marketMult:0.91, cashPenalty:0.04 },
    choices:[
      { label:'🌍 유럽 의존도 축소 — 아시아·미주 강화', cost:0.10, effect:{ brand:4, quality:2 } },
      { label:'💶 유럽 긴축 솔루션 출시',               cost:0.07, effect:{ quality:3, brand:3 } },
    ]},
  { y:2011,q:1, type:'opportunity', title:'빅데이터 시대',
    desc:'데이터 분석·BI 소프트웨어 수요가 폭발합니다. 데이터 기반 의사결정이 모든 기업의 최우선 과제가 되었습니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'📊 데이터 분석·BI 기능 대규모 추가', cost:0.24, effect:{ quality:7, brand:4, tech:5 } },
      { label:'🔗 써드파티 분석 도구 API 연동',     cost:0.07, effect:{ quality:3, brand:2, tech:2 } },
    ]},
  { y:2011,q:2, type:'crisis', title:'동일본 대지진 — 글로벌 공급망 충격',
    desc:'규모 9.0의 대지진과 쓰나미가 일본을 강타했습니다. 글로벌 반도체·전자부품 공급망이 마비되었습니다.',
    effects:{ marketMult:0.94, cashPenalty:0.03 },
    choices:[
      { label:'🌏 공급망 분산 — 클라우드 인프라 강화', cost:0.10, effect:{ tech:4, brand:3 } },
      { label:'🤝 일본 재건 IT 수요 공략',             cost:0.06, effect:{ brand:5, quality:2 } },
    ]},
  { y:2013,q:3, type:'opportunity', title:'Docker·컨테이너 혁명',
    desc:'Docker가 소프트웨어 배포 방식을 혁신합니다. 마이크로서비스 아키텍처로의 전환이 시작됩니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🐳 컨테이너·마이크로서비스 전환', cost:0.18, effect:{ tech:8, quality:4, brand:2 } },
      { label:'🔄 모놀리식 아키텍처 최적화',     cost:0.05, effect:{ tech:3, quality:2 } },
    ]},
  { y:2014,q:2, type:'opportunity', title:'IoT 붐 — 모든 것이 연결된다',
    desc:'사물인터넷(IoT) 시장이 개화합니다. 2020년까지 500억 개의 기기가 연결될 전망입니다. 소프트웨어 플랫폼이 핵심입니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'📡 IoT 플랫폼 선제 개발', cost:0.28, effect:{ tech:8, quality:5, brand:4 } },
      { label:'🔌 IoT 연동 API 제공',   cost:0.08, effect:{ tech:4, brand:3 } },
    ]},
  { y:2015,q:3, type:'crisis', title:'중국 증시 대폭락 — 신흥시장 패닉',
    desc:'중국 상하이 증시가 3개월 만에 40% 폭락했습니다. 신흥시장 전체가 패닉에 빠지고 글로벌 IT 투자 심리가 급랭합니다.',
    effects:{ marketMult:0.9, cashPenalty:0.04 },
    choices:[
      { label:'🛡️ 선진국 시장 집중 — 리스크 회피', cost:0,    effect:{ brand:2 } },
      { label:'🇨🇳 중국 시장 저점 공략',            cost:0.15, effect:{ brand:6, quality:3 } },
    ]},

  // ══════════════════════════════════
  // 2016-2021 — AI·규제·팬데믹
  // ══════════════════════════════════
  { y:2016,q:2, type:'shift', title:'AI·딥러닝 기술 대중화',
    desc:'TensorFlow와 PyTorch가 AI 개발을 대중화했습니다. AI 기능을 탑재한 제품이 시장에서 프리미엄을 받기 시작합니다.',
    effects:{ marketMult:1.25 },
    choices:[
      { label:'🤖 AI·ML 기능 선제적 통합', cost:0.40, effect:{ quality:9, brand:6, tech:8 } },
      { label:'📈 기존 기능 고도화 우선',   cost:0.10, effect:{ quality:5, brand:2, tech:3 } },
    ]},
  { y:2017,q:4, type:'opportunity', title:'블록체인·암호화폐 광풍',
    desc:'비트코인이 $20,000을 돌파하고 블록체인 기술에 대한 기업 수요가 폭발합니다. 분산원장 기반 소프트웨어 시장이 열립니다.',
    effects:{ marketMult:1.2, cashBonus:0.05 },
    choices:[
      { label:'⛓️ 블록체인 기반 제품 출시',  cost:0.20, effect:{ tech:7, brand:6, quality:3 } },
      { label:'🔍 블록체인 기술 검토만 진행', cost:0.04, effect:{ tech:3, brand:2 } },
    ]},
  { y:2018,q:2, type:'crisis', title:'GDPR 시행 — 데이터 규제 쓰나미',
    desc:'EU 일반개인정보보호법(GDPR)이 시행됩니다. 위반 시 전 세계 매출의 4% 또는 2천만 유로 벌금입니다. 개인정보 컴플라이언스가 필수가 됩니다.',
    effects:{ marketMult:0.95, cashPenalty:0.05 },
    choices:[
      { label:'🔒 GDPR 완전 준수 시스템 구축', cost:0.18, effect:{ quality:4, brand:6, tech:3 } },
      { label:'📋 최소한의 컴플라이언스 대응',  cost:0.05, effect:{ quality:1, brand:2 } },
    ]},
  { y:2018,q:3, type:'opportunity', title:'구독 SaaS 시장 성숙',
    desc:'SaaS 구독 모델이 완전히 정착했습니다. 고객 생애가치(LTV)와 순수익유지율(NRR)이 핵심 지표가 됩니다.',
    effects:{ marketMult:1.15 },
    choices:[
      { label:'🎯 고객 성공팀 대폭 확충', cost:0.14, effect:{ brand:8, quality:3 } },
      { label:'⚙️ 제품 자동화 기능 강화', cost:0.12, effect:{ quality:6, tech:5 } },
    ]},
  { y:2019,q:2, type:'opportunity', title:'5G 상용화 — 초연결 시대 개막',
    desc:'5G 네트워크가 상용화되었습니다. 초저지연·초고속 통신으로 엣지 컴퓨팅과 실시간 소프트웨어의 새 시대가 열립니다.',
    effects:{ marketMult:1.2 },
    choices:[
      { label:'📶 5G 최적화 실시간 소프트웨어 개발', cost:0.28, effect:{ tech:8, quality:5, brand:4 } },
      { label:'🔌 5G 기능 점진적 추가',             cost:0.07, effect:{ tech:3, quality:2 } },
    ]},
  { y:2020,q:1, type:'boom', title:'COVID-19 — 디지털 대전환 대폭발!',
    desc:'전 세계 원격근무 전환! 화상회의·협업·SaaS·클라우드 수요가 역대 최고입니다.',
    effects:{ marketMult:2.5, cashBonus:0.1 },
    choices:[
      { label:'🚀 원격근무 기능 전면 강화 (대규모 투자)', cost:0.70, effect:{ quality:12, brand:12, tech:5 } },
      { label:'📈 기존 클라우드 제품 마케팅 집중',        cost:0.28, effect:{ quality:4, brand:9 } },
      { label:'⏳ 제품 안정성 강화에 집중',               cost:0.07, effect:{ quality:6, brand:2 } },
    ]},
  { y:2021,q:4, type:'opportunity', title:'메타버스·NFT 광풍',
    desc:'Meta(구 Facebook)의 메타버스 선언과 NFT 열풍이 가상세계 소프트웨어 시장을 뜨겁게 달구고 있습니다.',
    effects:{ marketMult:1.25, cashBonus:0.05 },
    choices:[
      { label:'🌐 메타버스 플랫폼 진출', cost:0.30, effect:{ tech:6, brand:8, quality:3 } },
      { label:'🔍 관망 — 거품 판단',    cost:0,    effect:{ quality:1 } },
    ]},

  // ══════════════════════════════════
  // 2022-2030 — AI 혁명 시대
  // ══════════════════════════════════
  { y:2022,q:2, type:'crisis', title:'금리 급등 — 테크 겨울',
    desc:'Fed가 금리를 급격히 올리며 테크 버블이 꺼집니다. 나스닥이 30% 폭락하고 VC 투자가 반토막납니다. 수익성 없는 스타트업들이 줄도산합니다.',
    effects:{ marketMult:0.82, cashPenalty:0.08 },
    choices:[
      { label:'✂️ 대규모 구조조정 — 수익성 우선', cost:0,    effect:{ employees:-5, quality:-2, brand:-3 } },
      { label:'🛡️ 핵심 제품·고객 방어 집중',     cost:0.12, effect:{ quality:4, brand:3 } },
      { label:'💰 저평가 경쟁사 인수 기회 포착',  cost:0.50, effect:{ quality:6, brand:4, tech:5 } },
    ]},
  { y:2022,q:4, type:'revolution', title:'ChatGPT — 생성형 AI 혁명!',
    desc:'OpenAI ChatGPT가 출시되었습니다! 생성형 AI가 소프트웨어 산업의 모든 것을 바꿉니다.',
    effects:{ marketMult:3.0, eraShift:3 },
    choices:[
      { label:'🤖 Generative AI 전면 통합 — 혁신 올인', cost:1.20, effect:{ quality:18, brand:14, tech:12 } },
      { label:'⚡ AI 기능 빠른 추가 (MVP 방식)',          cost:0.45, effect:{ quality:9, brand:7, tech:6 } },
      { label:'🔍 검증 후 AI 도입 (보수적 접근)',         cost:0.06, effect:{ quality:3, brand:-2, tech:2 } },
    ]},
  { y:2023,q:1, type:'crisis', title:'SVB 파산 — 스타트업 뱅킹 위기',
    desc:'실리콘밸리은행(SVB)이 파산했습니다! 수천 개의 테크 스타트업이 예금을 인출하지 못해 위기에 처했습니다. 금융 시스템에 대한 불신이 커집니다.',
    effects:{ marketMult:0.92, cashPenalty:0.06 },
    choices:[
      { label:'🏦 복수 은행 분산 예금 — 리스크 관리', cost:0,    effect:{ brand:3 } },
      { label:'💳 핀테크 대안 금융 채널 강화',         cost:0.04, effect:{ tech:3, brand:4 } },
    ]},
  { y:2023,q:3, type:'opportunity', title:'AI 코파일럿 — 개발생산성 혁명',
    desc:'GitHub Copilot, Cursor 등 AI 코딩 도구가 개발 생산성을 2~5배 향상시킵니다. AI로 더 적은 인력으로 더 많은 제품을 만들 수 있습니다.',
    effects:{ marketMult:1.3, prodBonus:0.3 },
    choices:[
      { label:'🤖 AI 개발 도구 전면 도입 + 팀 재편성', cost:0.24, effect:{ tech:8, quality:6, brand:4 } },
      { label:'⚙️ 일부 팀에 선제적 도입',             cost:0.09, effect:{ tech:4, quality:3 } },
    ]},
  { y:2024,q:2, type:'opportunity', title:'AI 에이전트 시대 — 자율 소프트웨어',
    desc:'GPT-4, Claude, Gemini 기반 AI 에이전트가 복잡한 업무를 자율 수행합니다. 소프트웨어가 스스로 작동하는 시대입니다.',
    effects:{ marketMult:1.5 },
    choices:[
      { label:'🚀 AI 에이전트 플랫폼 선제 출시',   cost:0.60, effect:{ quality:12, tech:10, brand:8 } },
      { label:'🔌 기존 제품에 에이전트 기능 추가',  cost:0.15, effect:{ quality:6, tech:5, brand:4 } },
    ]},
  { y:2025,q:2, type:'revolution', title:'AI 에이전트·자율 코딩 시대',
    desc:'자율 AI 에이전트가 소프트웨어 개발의 70%를 자동화합니다. 개발 생산성이 10배 향상되지만 경쟁 강도도 동시에 폭발적으로 증가합니다.',
    effects:{ marketMult:2.0, prodBonus:0.5 },
    choices:[
      { label:'🚀 AI 에이전트 개발팀 전문 구축',   cost:0.80, effect:{ quality:13, brand:9, tech:10 } },
      { label:'🔧 기존 제품에 에이전트 기능 추가',  cost:0.22, effect:{ quality:6, brand:4, tech:5 } },
    ]},
  { y:2026,q:3, type:'crisis', title:'AI 규제 — EU AI법 전면 시행',
    desc:'EU AI Act가 전면 시행됩니다. 고위험 AI 시스템에 대한 강력한 규제로 컴플라이언스 비용이 폭증합니다.',
    effects:{ marketMult:0.9, cashPenalty:0.05 },
    choices:[
      { label:'🔒 AI 컴플라이언스 시스템 선제 구축', cost:0.28, effect:{ quality:4, brand:7, tech:3 } },
      { label:'🌍 EU 외 시장 집중',                  cost:0.08, effect:{ brand:3, quality:2 } },
    ]},
  { y:2028,q:1, type:'opportunity', title:'AR·공간 컴퓨팅 시장 개화',
    desc:'공간 컴퓨팅 기기 보급으로 완전히 새로운 소프트웨어 카테고리가 열립니다.',
    effects:{ marketMult:1.4 },
    choices:[
      { label:'🥽 공간 컴퓨팅 앱 선제 개발',   cost:0.90, effect:{ quality:14, brand:8, tech:10 } },
      { label:'🔌 기존 제품 공간 컴퓨팅 확장', cost:0.28, effect:{ quality:6, brand:4, tech:5 } },
    ]},
  { y:2030,q:1, type:'revolution', title:'양자컴퓨팅 상용화 원년',
    desc:'양자 컴퓨터가 마침내 상용화되었습니다! 암호화·최적화·시뮬레이션 소프트웨어에 완전히 새로운 시대가 열립니다.',
    effects:{ marketMult:1.5 },
    choices:[
      { label:'⚛️ 양자 알고리즘 선제 개발',  cost:1.40, effect:{ quality:16, brand:9, tech:12 } },
      { label:'🔄 기존 제품 양자 최적화',     cost:0.35, effect:{ quality:7, brand:3, tech:6 } },
    ]},

  // ══════════════════════════════════
  // 2031-2050 — AGI 이후 시대
  // ══════════════════════════════════
  { y:2032,q:2, type:'crisis', title:'AI 일자리 대란 — 사회적 격변',
    desc:'AI 자동화로 전 세계 사무직 일자리 35%가 사라졌습니다. 각국 정부가 AI 기업에 자동화세를 부과하기 시작합니다.',
    effects:{ marketMult:0.85, cashPenalty:0.07 },
    choices:[
      { label:'🤝 AI 재교육 플랫폼 출시 — 사회적 책임', cost:0.40, effect:{ brand:10, quality:4, tech:3 } },
      { label:'🛡️ 로비·컴플라이언스 강화',              cost:0.14, effect:{ brand:5, quality:2 } },
    ]},
  { y:2035,q:3, type:'revolution', title:'AGI 등장 — 소프트웨어의 종말과 부활',
    desc:'범용 인공지능(AGI)이 등장했습니다! 소프트웨어 개발 패러다임이 근본적으로 변화합니다.',
    effects:{ marketMult:5.0, eraShift:4, prodBonus:2.0 },
    choices:[
      { label:'✨ AGI 네이티브 플랫폼 전환 — 완전한 혁신', cost:1.80, effect:{ quality:22, brand:16, tech:15 } },
      { label:'🤝 AGI API 통합으로 기능 혁신',             cost:0.60, effect:{ quality:11, brand:8, tech:8 } },
      { label:'🛡️ 기존 고객 기반 방어 집중',               cost:0.10, effect:{ quality:3, brand:2 } },
    ]},
  { y:2038,q:1, type:'crisis', title:'디지털 대재앙 — 글로벌 사이버 공격',
    desc:'국가급 해커집단이 전 세계 주요 소프트웨어 인프라를 공격했습니다. 보안이 취약한 기업들이 치명적 타격을 입습니다.',
    effects:{ marketMult:0.88, cashPenalty:0.06 },
    choices:[
      { label:'🔐 제로트러스트 보안 시스템 전면 구축', cost:0.70, effect:{ quality:5, brand:8, tech:5 } },
      { label:'🛡️ 필수 보안 패치만 적용',             cost:0.10, effect:{ quality:2, brand:3 } },
    ]},
  { y:2040,q:2, type:'opportunity', title:'디지털-물리 통합 (사이버-피지컬)',
    desc:'디지털 트윈과 물리-사이버 통합이 일반화됩니다. 소프트웨어가 물리 세계를 직접 제어하는 새로운 시대입니다.',
    effects:{ marketMult:2.0 },
    choices:[
      { label:'🌍 물리-사이버 통합 플랫폼 선제 개발', cost:1.80, effect:{ quality:18, brand:11, tech:13 } },
      { label:'📡 IoT·디지털트윈 기능 추가',          cost:0.45, effect:{ quality:8, brand:5, tech:7 } },
    ]},
  { y:2045,q:3, type:'revolution', title:'뇌-컴퓨터 인터페이스 대중화',
    desc:'BCI 기술이 대중화되면서 완전히 새로운 소프트웨어 인터페이스 패러다임이 등장합니다.',
    effects:{ marketMult:2.5 },
    choices:[
      { label:'🧠 BCI 네이티브 소프트웨어 개발',   cost:2.20, effect:{ quality:24, brand:14, tech:18 } },
      { label:'🔌 기존 소프트웨어 BCI 지원 추가',  cost:0.50, effect:{ quality:10, brand:6, tech:8 } },
    ]},
];

// Software company revenue multiple (ARR multiple) by era
// Used for valuation = annualRevenue × multiple
const REV_MULTIPLE = (() => {
  const pts = [
    [1980,2],[1990,3],[1994,4],[1995,14],[1999,22],[2001,5],
    [2003,4],[2005,5],[2007,7],[2010,8],[2015,10],[2019,12],
    [2020,15],[2022,18],[2025,20],[2030,25],[2040,30],[2050,40],
  ];
  const m = {};
  for (let i=0;i<pts.length-1;i++){
    const [y0,v0]=pts[i],[y1,v1]=pts[i+1];
    for(let y=y0;y<y1;y++) m[y]=v0+(v1-v0)*(y-y0)/(y1-y0);
  }
  m[2050]=40; return m;
})();

// ── 시대별 경쟁사 세트 ─────────────────────────────────────
// ERA_COMPETITOR_SETS[1980]: 게임 시작 시 등장하는 실제 역사적 초창기 PC 소프트웨어 기업들
// (1990/2000/2010/2020 키는 사용되지 않음 — 시대 전환 진입은 ERA_ENTRANTS가 담당)
// _s stats: 실제 기업의 1980년대 초 시장 지위를 게임 스케일로 변환
//   q(품질): 제품 완성도·고객 만족도 (0-200)
//   b(브랜드): 시장 인지도·점유율 반영 (0-200)
//   t(기술): R&D 역량·기술 혁신성 (0-200)
//   emp: 실제 직원 수 / ~10 (게임 스케일)
//   cash: 실제 자본금 기반 (게임 스케일)
const ERA_COMPETITOR_SETS = {
  1980: [

    // ── Lotus Development Corp (1982년 창업, 게임 목적상 1980 스타트업으로 표현) ──────
    // 1-2-3 스프레드시트로 PC 소프트웨어 혁명. 1983년 $53M→1988년 $468M 매출.
    // 실적 피크: 1990년 $684M 매출, 직원 4,000명, 영업이익률 ~17.8%
    // 실패 원인: Windows용 제품 개발 지연·버그 → Excel에 완패 → 1995년 IBM이 $3.5B 인수
    { name:'Lotus',     icon:'📊', color:'#c0392b', style:'quality',
      desc:'1-2-3 스프레드시트 혁명. 빠른 성장 후 Windows 전환 실패로 몰락.',
      entryMsg: null,
      w:{ rd:.50, mkt:.22, hr:.14, ops:.14 }, eraLimit:1,
      // 실제 데이터: 1983 rev $54M→1990 rev $684M, opMg 17.8%, emp 4000
      _hist:{ peak:{ yr:1990, rev:684,  opMg:0.178, emp:4000, rpe:171000 },
              fate:'1995년 IBM에 $3.5B 인수. Windows 전환 실패의 교과서 사례.' },
      _s:{ emp:5, q:22, b:18, t:20, cash:320000, giant:false } },

    // ── WordPerfect Corp (1979년 창업, Satellite Software Intl→WordPerfect) ──────────
    // WP 5.1 for DOS가 1988-1991 워드프로세서 시장 압도적 1위 (~70% 점유율).
    // 실적 피크: 1991년 매출 ~$900M, 직원 5,500명
    // 실패 원인: Windows용 WP 개발 늦어짐·버그 → Word에 추월 → Novell 인수 $1.4B(1994) → Corel $124M(1996)
    { name:'WordPerfect', icon:'📝', color:'#8b5cf6', style:'focus',
      desc:'DOS 시대 워드프로세서 절대 강자. Windows 전환 실패로 급몰락.',
      entryMsg: null,
      w:{ rd:.45, mkt:.22, hr:.14, ops:.19 }, eraLimit:1,
      _hist:{ peak:{ yr:1991, rev:900,  opMg:0.210, emp:5500, rpe:164000 },
              fate:'Novell $1.4B 인수(1994) → Corel $124M 매각(1996). 99% 가치 증발.' },
      _s:{ emp:4, q:20, b:16, t:16, cash:280000, giant:false } },

    // ── Ashton-Tate (1980년 창업) ─────────────────────────────────────────────────────
    // dBase II/III/IV — PC용 데이터베이스 시장 창시자이자 지배자.
    // 실적 피크: 1987년 $304M 매출, 직원 2,800명, 영업이익률 ~14%
    // 실패 원인: dBase IV(1988) 심각한 버그·성능 문제 → 신뢰 붕괴 → 1991년 Borland에 $439M 인수
    { name:'Ashton-Tate', icon:'🗃️', color:'#f59e0b', style:'aggressive',
      desc:'dBase로 PC 데이터베이스 시장 개척. 품질 위기로 인터넷 이전에 소멸.',
      entryMsg: null,
      w:{ rd:.28, mkt:.40, hr:.12, ops:.20 }, eraLimit:0,
      _hist:{ peak:{ yr:1987, rev:304,  opMg:0.138, emp:2800, rpe:109000 },
              fate:'dBase IV 품질 재앙 → 1991년 Borland에 $439M 인수. 브랜드 소멸.' },
      _s:{ emp:5, q:18, b:18, t:14, cash:350000, giant:false } },

    // ── Intuit (1983년 창업) ──────────────────────────────────────────────────────────
    // Quicken 개인 재무 소프트웨어로 시작 → QuickBooks(1992) → TurboTax.
    // 1993년 IPO. 모든 시대 생존한 PC 시대 유일한 장수 기업.
    // 현재(2024): 매출 $16B, 직원 18,000명, 영업이익률 ~20%
    { name:'Intuit',    icon:'💰', color:'#10b981', style:'focus',
      desc:'Quicken·QuickBooks·TurboTax. 핀테크 틈새에서 시작해 모든 시대 생존한 독보적 장수 기업.',
      entryMsg: null,
      w:{ rd:.44, mkt:.26, hr:.16, ops:.14 }, eraLimit:4,
      _hist:{ peak:{ yr:2023, rev:14367, opMg:0.198, emp:17800, rpe:807000 },
              fate:'창업 40년 후에도 핀테크 SaaS로 건재. PC 시대 창업 기업 중 최장수.' },
      _s:{ emp:3, q:16, b:12, t:14, cash:220000, giant:false } },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// COMPANY_LIFECYCLE_DB — 기업별 역사적 생애주기 이벤트 DB
// ────────────────────────────────────────────────────────────────────────────
// 이 DB만 수정하면 기업 진입·쇠퇴·복귀·퇴장이 자동 반영됩니다.
// checkCompanyLifecycle() 함수가 매 분기마다 읽어 처리합니다.
//
// 필드 설명:
//   retireYear/Q    : 강제 퇴장 (인수·파산·소멸). alive=false 처리 + 뉴스
//   retireFate      : 퇴장 사유 (뉴스에 표시)
//   retireType      : 'acquired' | 'bankrupt' | 'merged' | 'obsolete'
//   declineYear/Q   : 쇠퇴 시작 — eraLimit을 현재 시대로 고정해 서서히 몰락
//   declineMsg      : 쇠퇴 뉴스 (표시용)
//   comebackYear/Q  : 반등 — 스탯 회복 + eraLimit 연장
//   comebackMsg     : 반등 뉴스
//   comebackStats   : { q, b, t } — 반등 시 스탯 보너스
//   comebackEraLimit: 반등 후 새 eraLimit (미지정 시 4=AGI까지)
// ════════════════════════════════════════════════════════════════════════════
const COMPANY_LIFECYCLE_DB = {

  // ── PC 시대 창업 기업 ─────────────────────────────────────────────────────
  'Lotus': {
    retireYear:1995, retireQ:3, retireType:'acquired',
    retireFate:'IBM에 $3.5B 인수. Excel에 완패한 스프레드시트 제왕의 몰락.',
  },
  'WordPerfect': {
    retireYear:1994, retireQ:3, retireType:'acquired',
    retireFate:'Novell에 $1.4B 인수. 이후 Corel에 $124M 재매각 — 99% 가치 증발.',
  },
  'Ashton-Tate': {
    retireYear:1991, retireQ:2, retireType:'acquired',
    retireFate:'Borland에 $439M 인수. dBase IV 품질 재앙이 브랜드를 소멸시켰다.',
  },

  // ── 인터넷 시대 진입 기업 ─────────────────────────────────────────────────
  'Netscape': {
    retireYear:2003, retireQ:1, retireType:'acquired',
    retireFate:'AOL 합병 후 IE 무료 번들에 완패. 브라우저 종료.',
  },
  'Novell': {
    retireYear:2011, retireQ:2, retireType:'acquired',
    retireFate:'Attachmate에 $2.2B 매각. NetWare 사업 완전 소멸.',
  },
  'Oracle': {
    // 클라우드 전환 거부로 쇠퇴, OCI·Autonomous DB로 복귀
    declineYear:2008, declineQ:1,
    declineMsg:'🔴 Oracle: Larry Ellison "클라우드는 헛소리" 발언 — 클라우드 시장 후퇴 가속화',
    comebackYear:2016, comebackQ:2,
    comebackMsg:'🔴 Oracle Cloud(OCI) + Autonomous DB 출시 — 클라우드 시장 재진입 선언!',
    comebackStats:{ q:18, b:12, t:22 },
    comebackEraLimit:4,
  },
  'SAP': {
    declineYear:2013, declineQ:1,
    declineMsg:'🏭 SAP: 클라우드 전환 지연 — Salesforce·Workday에 핵심 시장 잠식당함',
    comebackYear:2020, comebackQ:1,
    comebackMsg:'🏭 SAP RISE with SAP — 클라우드 전환 완성. AI 시대 재도약 선언!',
    comebackStats:{ q:10, b:8, t:14 },
    comebackEraLimit:4,
  },
  'Yahoo': {
    declineYear:2008, declineQ:3,
    declineMsg:'🟣 Yahoo: Google 검색에 완패 + MS $44.6B 인수 제안 거절 — 장기 침체 돌입',
    retireYear:2017, retireQ:2, retireType:'acquired',
    retireFate:'Verizon에 $4.5B 매각. 전성기 시총 $125B에서 96% 하락.',
  },
  'Sun Microsystems': {
    declineYear:2002, declineQ:1,
    declineMsg:'☀️ Sun Microsystems: 닷컴 버블 붕괴로 주가 98% 폭락, Java 수익화 실패',
    retireYear:2010, retireQ:1, retireType:'acquired',
    retireFate:'Oracle에 $7.4B 인수. Java·Solaris·MySQL 흡수.',
  },
  'Borland': {
    declineYear:1997, declineQ:2,
    declineMsg:'🔵 Borland: MS Visual Studio 무료화로 개발 도구 시장 급격히 잠식당함',
    retireYear:2009, retireQ:2, retireType:'acquired',
    retireFate:'Micro Focus에 매각. 한때 $1B 개발 도구 제국의 종말.',
  },
  'Siebel': {
    retireYear:2005, retireQ:4, retireType:'acquired',
    retireFate:'Oracle에 $5.85B 인수. Salesforce CRM에 완패한 레거시 CRM의 끝.',
  },
  'Macromedia': {
    retireYear:2005, retireQ:3, retireType:'acquired',
    retireFate:'Adobe에 $3.4B 인수. Flash·Dreamweaver·ColdFusion 흡수.',
  },
  'BEA Systems': {
    retireYear:2008, retireQ:1, retireType:'acquired',
    retireFate:'Oracle에 $8.5B 인수. J2EE 미들웨어 시장 종식.',
  },

  // ── 모바일·클라우드 시대 진입 기업 ───────────────────────────────────────
  'VMware': {
    retireYear:2023, retireQ:4, retireType:'acquired',
    retireFate:'Broadcom에 $61B 인수. 구독 가격 폭등으로 고객 대거 이탈.',
  },
  'Red Hat': {
    retireYear:2019, retireQ:3, retireType:'acquired',
    retireFate:'IBM에 $34B 인수. 오픈소스 하이브리드 클라우드 전략 편입.',
  },
  'Twitter': {
    declineYear:2019, declineQ:2,
    declineMsg:'🐦 Twitter: 광고 매출 정체·사용자 성장 둔화 — 수익성 위기 본격화',
    retireYear:2022, retireQ:4, retireType:'acquired',
    retireFate:'Elon Musk에 $44B 인수. X로 리브랜딩, 광고주·직원 대거 이탈.',
  },
  'BlackBerry': {
    declineYear:2008, declineQ:2,
    declineMsg:'📱 BlackBerry: iPhone 출시 후 기업 스마트폰 시장 급격히 잠식 — 터치스크린 대응 실패',
    retireYear:2016, retireQ:3, retireType:'obsolete',
    retireFate:'스마트폰 하드웨어 사업 종료. 보안 소프트웨어 회사로 전환 시도.',
  },
  'Zendesk': {
    retireYear:2022, retireQ:3, retireType:'acquired',
    retireFate:'KKR·Permira 컨소시엄에 $10.2B 인수. 상장 폐지.',
  },
  'Slack': {
    retireYear:2021, retireQ:4, retireType:'acquired',
    retireFate:'Salesforce에 $27.7B 인수. 독립 브랜드 유지하며 Salesforce 생태계 편입.',
  },
  'Workday': {
    declineYear:2023, declineQ:2,
    declineMsg:'🏢 Workday: AI 네이티브 HR 솔루션에 성장 둔화 — 구조조정 착수',
    comebackYear:2025, comebackQ:1,
    comebackMsg:'🏢 Workday AI — 생성형 AI 통합으로 HR 플랫폼 재도약!',
    comebackStats:{ q:8, b:6, t:12 },
    comebackEraLimit:4,
  },

  // ── AI 혁명 시대 진입 기업 ─────────────────────────────────────────────────
  'Snowflake': {
    declineYear:2024, declineQ:2,
    declineMsg:'❄️ Snowflake: CEO 교체 + Databricks·Google BigQuery 경쟁 심화로 성장 둔화',
    comebackYear:2026, comebackQ:1,
    comebackMsg:'❄️ Snowflake Arctic LLM + AI Data Cloud — 데이터+AI 통합으로 반격!',
    comebackStats:{ q:10, b:7, t:14 },
    comebackEraLimit:4,
  },
  'Mistral AI': {
    declineYear:2026, declineQ:3,
    declineMsg:'🌬️ Mistral AI: 대형 빅테크 오픈소스 공세에 독립 스타트업 한계 — 투자 유치 난항',
  },
  'Cohere': {
    declineYear:2026, declineQ:1,
    declineMsg:'🔗 Cohere: 기업 AI 시장 OpenAI·Anthropic 양강 구도에 포지셔닝 어려움',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ERA_NARRATIVES — 패러다임 전환별 역사적 서사 데이터
// ════════════════════════════════════════════════════════════════════════════
// eraIdx: 전환 후 도달한 새 시대의 인덱스 (1=인터넷, 2=모바일·클라우드, 3=AI, 4=AGI)
const ERA_NARRATIVES = {

  // ── 인터넷 혁명 (1995) ─────────────────────────────────────────────────────
  1: {
    // 이 시대 전환으로 몰락한 기업들과 그 이유 (역사적 사실)
    casualties: [
      { match: /WordPerfect|Lotus|dBase|Ashton/i,
        reason: '워드프로세서·스프레드시트 전문 기업들은 GUI·인터넷 전환에 실패. WordPerfect는 윈도우 지원을 1년 늦추며 MS Word에 시장을 내줬고, Lotus는 Excel에 완패 후 1995년 IBM에 $3.5B에 매각됐다.' },
      { match: /Novell/i,
        reason: '오프라인 LAN OS(NetWare)로 성장했으나 TCP/IP 인터넷 전환에 늦었고, WordPerfect 무리한 인수($1.4B)로 재정 악화. Windows NT가 기업 네트워크를 잠식하며 점유율이 붕괴됐다.' },
    ],
    // 시대 전환의 역사적 배경
    context: [
      '🌐 1995년 Windows 95 출시·Netscape IPO·Java 발표가 겹치며 인터넷 혁명이 폭발적으로 시작됐다.',
      '📉 오프라인 패키지 소프트웨어 기업들은 배포 채널(플로피→인터넷)과 비즈니스 모델(영구 라이선스→구독)이 동시에 바뀌는 이중 충격을 받았다.',
      '💡 인터넷 접속이 기업 필수 인프라가 되면서 웹 기반 SaaS의 씨앗이 뿌려졌다.',
    ],
    // 새로운 경쟁자 등장 배경
    entrantContext: '🚀 인터넷 붐과 닷컴 투자 열풍이 PC 시대의 거인들에 도전하는 새로운 강자들을 불러왔다. Microsoft는 인터넷으로 진화했고, Oracle·SAP은 엔터프라이즈 DB·ERP를 선점했다. 그러나 Netscape, Yahoo, Sun 같은 인터넷 퍼스트 기업들도 이 시대를 함께 정의하게 된다.',
    // 생존한 기업에 대한 코멘트
    survivorContext: 'PC 시대를 살아남아 인터넷 혁명에 성공적으로 적응한 기업은 배포 채널 전환과 인터넷 기반 제품 재설계에 일찍 투자했다는 공통점이 있다.',
  },

  // ── 모바일·클라우드 (2007) ─────────────────────────────────────────────────
  2: {
    casualties: [
      { match: /Netscape|Yahoo|Sun|Borland|BEA|Novell|Siebel/i,
        reason: '닷컴 버블(2000~2002)과 AWS 클라우드 충격(2006~)의 이중 파고를 넘지 못했다. Netscape는 IE 끼워팔기에 2003년 소멸, Yahoo는 Google 검색에 패배 후 장기 쇠퇴, Sun Microsystems는 닷컴 버블 후 주가 98% 폭락해 2010년 Oracle에 흡수됐다.' },
      { match: /Siebel/i,
        reason: '온프레미스 CRM의 황제였지만 Salesforce의 SaaS 모델에 속절없이 무너졌다. "소프트웨어는 구입하지 않고 빌린다"는 패러다임 전환을 끝내 이해하지 못했다.' },
    ],
    context: [
      '📱 2007년 iPhone 출시는 소프트웨어 배포와 소비 방식을 영구적으로 바꿨다. App Store가 탄생했고, "모바일 퍼스트"가 기업 전략의 기본 원칙이 됐다.',
      '☁️ AWS(2006)·Azure(2010)·GCP(2011) 삼파전이 시작되며 자체 서버를 운영하던 기업들의 인프라 비용 구조가 무너졌다. 클라우드로 전환하지 않은 기업은 비용 경쟁력을 잃었다.',
      '📉 닷컴 버블 때 과도하게 팽창했던 인터넷 1세대 기업들은 자본 소진과 비즈니스 모델 미검증으로 하나씩 소멸했다.',
    ],
    entrantContext: '☁️ SaaS 구독 모델과 스마트폰 생태계가 새 시대의 문법이다. iPhone이 App Store를, AWS가 클라우드를 열며 Google·Apple·Salesforce·Adobe·Workday 같은 새 거인들이 기업 소프트웨어 시장을 재편하고 있다. 막대한 벤처 자본이 유입되며 DevOps·HCM·협업 도구 스타트업들도 속속 등장했다.',
    survivorContext: '인터넷 시대의 강자 중 모바일·클라우드로 살아남은 기업들은 하나같이 "클라우드 퍼스트" 전환에 막대한 R&D를 투자하고, 기존 온프레미스 매출의 잠식을 두려워하지 않은 공통점이 있다.',
  },

  // ── AI 혁명 (2022) ─────────────────────────────────────────────────────────
  3: {
    casualties: [
      { match: /Workday|Atlassian|Zendesk|HubSpot|Twilio/i,
        reason: 'AI 코파일럿과 자동화가 HR·CRM·CS 워크플로우를 대체하기 시작했다. 차별화된 AI 역량 없이 기존 기능에 머문 SaaS는 "AI-native" 신흥 플레이어에게 빠르게 시장을 잃었다.' },
      { match: /Dropbox|Box/i,
        reason: '클라우드 스토리지 자체는 범용재(commodity)가 됐고, AI 기반 협업·검색·자동화 기능 없이는 차별화가 불가능해졌다. Microsoft 365 Copilot이 직접 경쟁자로 들어오며 독립 생존이 어려워졌다.' },
    ],
    context: [
      '🤖 ChatGPT(2022.11) 출시는 역사상 가장 빠른 기술 확산이었다. 출시 5일 만에 100만 사용자, 2개월 만에 1억 사용자. 기업 소프트웨어의 UI·UX·가격 책정 방식이 모두 재검토됐다.',
      '⚡ GitHub Copilot(2022)·Claude(2023)·Gemini(2023)가 개발자 생산성을 2~10배 높이며 "인당 코드 생산량" 패러다임이 무너졌다. 개발자 팀 규모와 소프트웨어 개발 단가가 동시에 압박받았다.',
      '💰 OpenAI($86B)·Anthropic($18B)·Mistral 등 AI 기반 신규 기업들이 전통 SaaS 밸류에이션을 위협하기 시작했다. 기존 SaaS는 AI를 내재화하지 못하면 "마진 압착 + 성장 정체"의 이중고를 맞았다.',
    ],
    entrantContext: '🤖 생성형 AI가 소프트웨어 개발·운영·판매의 모든 단계를 변화시키고 있다. OpenAI·Anthropic·Microsoft Copilot·Google Gemini가 시장에 진입하며 기존 SaaS 기업들을 위협하고 있다. AI-native 스타트업들은 전통 SaaS 대비 1/10의 인력으로 동일한 기능을 제공하기 시작했다.',
    survivorContext: '클라우드 시대의 생존자 중 AI 혁명에 적응한 기업들은 자체 LLM 또는 주요 AI 파트너십을 통해 제품에 AI를 깊이 내재화하고, 단순 기능 제공에서 "AI 에이전트 플랫폼"으로 전환하는 데 성공했다.',
  },

  // ── AGI 이후 (2036) ──────────────────────────────────────────────────────
  4: {
    casualties: [
      { match: /OpenAI|Anthropic|Mistral/i,
        reason: 'AGI 전환점 이후, 특정 모달리티에 특화된 초기 AI 기업들은 범용 AGI 시스템에 의해 경쟁력을 잃었다. 모델 자체보다 응용 레이어·데이터·신뢰 네트워크가 핵심 자산이 됐다.' },
      { match: /Zoom|Slack|Teams/i,
        reason: '협업 도구의 경계가 흐려졌다. AGI 에이전트가 회의 준비·요약·후속 조치를 자동화하면서 사람 간 "동기 협업" 시간 자체가 80% 이상 줄었다.' },
    ],
    context: [
      '✨ 2036년경, AGI 시스템이 특정 지식 영역에서 최고 수준 인간 전문가를 능가하기 시작했다. 소프트웨어 개발·데이터 분석·고객 서비스의 완전 자동화가 현실화됐다.',
      '🔄 비즈니스 소프트웨어의 패러다임이 "사람이 도구를 사용"에서 "AI 에이전트가 사람을 보조"로 역전됐다. 전통적인 SaaS 사용자 인터페이스 개념이 사라지고 있다.',
      '🌐 AGI 기반 자율 에이전트들이 기업의 반복 업무 대부분을 처리하며, 소프트웨어 산업의 가치는 "기능의 수"에서 "신뢰·보안·거버넌스"로 이동했다.',
    ],
    entrantContext: '✨ AGI 이후 시대의 새로운 강자들은 "기능을 파는 SaaS"가 아닌 "자율 에이전트 생태계"를 구축하는 기업들이다. 기존 거대 기술 기업들은 AGI 인프라 계층을 통제하려 하고, 새로운 스타트업들은 특정 산업 수직 시장에서 AGI를 완전히 내재화한 솔루션으로 틈새를 파고들고 있다.',
    survivorContext: 'AI 혁명기의 생존자 중 AGI 이후 시대에 살아남은 기업들은 단순 AI 기능 추가가 아닌, 비즈니스 프로세스 전체를 AGI 에이전트로 재설계하고, 신뢰·규제 준수·데이터 주권을 핵심 가치로 내세운 기업들이었다.',
  },
};

// ── 시대 전환 시 자동 진입하는 실제 역사 기업들 ─────────────────────────────────
// eraIdx: 0=PC(1980), 1=인터넷(1995), 2=모바일·클라우드(2007), 3=AI(2022), 4=AGI(2036)
// _hist: 진입 시점 전후 실제 재무 데이터 (SEC Filing / Annual Report 기반)
//   · yr: 기준 연도  · rev: 연매출 $M  · opMg: 영업이익률
//   · emp: 실제 직원 수  · rpe: 인당 연매출 $
const ERA_ENTRANTS = [

  // ══ Era 1: 인터넷 혁명 (1995) ═══════════════════════════════════════════════════
  { eraIdx: 1, competitors: [

    // Microsoft — Windows 95, Office 독점으로 인터넷 시대 제패
    // 1995: 매출 $5.94B / opMg 34.2% / 직원 17,801명 / 인당매출 $334K
    // 2000: 매출 $22.96B / opMg 43.5% (역대 소프트웨어 최고 수익성)
    { name:'Microsoft', icon:'🪟', color:'#0078d4', style:'focus',
      desc:'Windows 95·Office 독점. 인터넷 시대 모든 패러다임에서 1위 유지. 역대 최고 소프트웨어 수익성.',
      entryMsg:'🪟 Windows 95 출시! Microsoft가 당신의 시장에 공식 진입합니다.',
      w:{ rd:.42, mkt:.22, hr:.16, ops:.20 }, eraLimit:4,
      _hist:{ yr:1995, rev:5940, opMg:0.342, emp:17801, rpe:334000,
              note:'OS·Office 독점 → 2000년 opMg 43.5% 달성. 전 시대 생존 유일 기업.' },
      _s:{ emp:320, q:90, b:96, t:92, cash:55000000, giant:true } },

    // Oracle — 인터넷 시대 엔터프라이즈 DB 절대 강자
    // 2000: 매출 $10.13B / opMg 28.1% / 직원 43,800명 / 인당매출 $231K
    // 클라우드 전환 지연 → 모바일 시대 고전 (Larry Ellison "클라우드는 헛소리" 발언)
    { name:'Oracle', icon:'🔴', color:'#c0392b', style:'quality',
      desc:'엔터프라이즈 DB 독점. 인터넷 최강 수익성. 클라우드 전환 늦어 모바일 시대 고전.',
      entryMsg:'🔴 Oracle이 엔터프라이즈 DB·ERP로 당신의 시장에 진입합니다.',
      w:{ rd:.40, mkt:.22, hr:.14, ops:.24 }, eraLimit:2,
      _hist:{ yr:2000, rev:10130, opMg:0.281, emp:43800, rpe:231000,
              note:'"클라우드는 헛소리" 발언 후 AWS에 추월. 뒤늦게 OCI 출시하나 시장점유율 낮음.' },
      _s:{ emp:280, q:90, b:86, t:80, cash:62000000, giant:true } },

    // Netscape — 웹 브라우저 혁명, 닷컴 버블의 상징
    // 1995: IPO 당일 시총 $2.9B (전례 없는 닷컴 IPO 신호탄)
    // 1998: 매출 $534M, MS IE 무료 끼워팔기에 패배 → AOL 인수 → 2003년 소멸
    { name:'Netscape', icon:'🌐', color:'#ff6600', style:'aggressive',
      desc:'웹 브라우저 혁명 선구자. 닷컴 버블 상징. MS IE 끼워팔기에 패배해 소멸.',
      entryMsg:'🌐 Netscape가 인터넷 브라우저로 시장에 진입! 브라우저 전쟁의 서막.',
      w:{ rd:.38, mkt:.44, hr:.10, ops:.08 }, eraLimit:1,
      _hist:{ yr:1996, rev:346, opMg:-0.08, emp:2685, rpe:129000,
              note:'1995 IPO $2.9B. MS가 IE를 Windows에 무료 번들 → 독점 소송 → Netscape 종료(2003).' },
      _s:{ emp:85, q:72, b:86, t:78, cash:18000000, giant:false } },

    // Novell — NetWare PC LAN OS 제왕, 인터넷 시대 무너짐
    // 1993: 매출 $2.03B / opMg 19.5% / NetWare PC LAN 70% 점유율
    // WordPerfect 무리한 인수($1.4B) → Windows NT에 밀림 → 2011년 소멸
    { name:'Novell', icon:'🔗', color:'#e74c3c', style:'focus',
      desc:'NetWare LAN OS 70% 점유율. WordPerfect 무리한 인수 후 Windows NT에 추월당해 몰락.',
      entryMsg:'🔗 Novell이 네트워크 OS·그룹웨어로 기업 시장에 진입합니다.',
      w:{ rd:.35, mkt:.28, hr:.18, ops:.19 }, eraLimit:1,
      _hist:{ yr:1993, rev:2030, opMg:0.195, emp:6500, rpe:312000,
              note:'LAN 70% 장악(1993). WordPerfect $1.4B 인수(1994) 실수 → Windows NT 전환 실패.' },
      _s:{ emp:200, q:78, b:80, t:72, cash:30000000, giant:true } },

    // SAP — ERP 글로벌 표준, 인터넷 전환도 성공
    // 1995: 매출 €3B (~$3.8B) / 직원 12,605명
    // 2000: 매출 €6.3B (~$7B) / opMg 16.8% / 직원 24,000명
    { name:'SAP', icon:'🏭', color:'#0070f2', style:'quality',
      desc:'ERP 글로벌 표준. 제조·유통·금융 대기업 필수 솔루션. 인터넷·클라우드 전환도 성공.',
      entryMsg:'🏭 SAP가 ERP 솔루션으로 대기업 시장에 진입합니다.',
      w:{ rd:.38, mkt:.20, hr:.20, ops:.22 }, eraLimit:3,
      _hist:{ yr:2000, rev:7000, opMg:0.168, emp:24000, rpe:292000,
              note:'ERP 시장 25%+ 점유율. S/4HANA 클라우드 전환 2015년 착수, AI 시대 적응 중.' },
      _s:{ emp:260, q:88, b:85, t:78, cash:48000000, giant:true } },

    // Intuit (업그레이드) — 1980 set에서 성장, 핀테크 SaaS 전환
    // 1995: 매출 $654M / MS $1.5B 인수 시도 → DOJ 반대로 무산 → 독자 생존
    { name:'Intuit', icon:'💰', color:'#10b981', style:'focus',
      desc:'Quicken·QuickBooks·TurboTax 핀테크 독점. MS 인수 시도 무산 후 SaaS 전환 성공.',
      entryMsg:'💰 Intuit이 인터넷 시대 핀테크 SaaS로 진화합니다.',
      w:{ rd:.44, mkt:.26, hr:.16, ops:.14 }, eraLimit:4,
      _hist:{ yr:1995, rev:654, opMg:0.218, emp:3500, rpe:187000,
              note:'MS 인수 시도 $1.5B DOJ 반대로 무산(1995). QuickBooks SaaS 전환 → $16B 기업.' },
      _s:{ emp:62, q:70, b:72, t:58, cash:8000000, giant:false } },

    // Yahoo — 인터넷 포털 황제, 검색 전쟁 패배 후 몰락
    // 1995 창업, 1996 IPO $848M / 1999 시총 $125B 정점
    // 2000: 매출 $1.11B / 직원 3,251명 → 2017: Verizon에 $4.5B 매각
    { name:'Yahoo', icon:'🟣', color:'#7b0099', style:'aggressive',
      desc:'초기 인터넷 포털 황제. 검색·광고 혁신 선구자. Google에 검색 패배 후 장기 몰락.',
      entryMsg:'🟣 Yahoo가 인터넷 포털과 디렉토리 검색으로 시장을 장악합니다!',
      w:{ rd:.28, mkt:.52, hr:.10, ops:.10 }, eraLimit:1,
      _hist:{ yr:2000, rev:1110, opMg:0.082, emp:3251, rpe:341000,
              note:'1999 시총 $125B. Google 검색 패배 + MS 인수 $44.6B 거절 → 2017년 Verizon 매각.' },
      _s:{ emp:50, q:68, b:88, t:72, cash:15000000, giant:false } },

    // Sun Microsystems — Java 창시자, 닷컴 버블 최대 피해자
    // 1982 창업 / 1995: 매출 $5.9B / opMg 11% / 직원 16,000명
    // Java·Solaris·SPARC 으로 인터넷 인프라 장악, 닷컴 버블 붕괴로 98% 폭락
    { name:'Sun Microsystems', icon:'☀️', color:'#f59e0b', style:'quality',
      desc:'Java 창시·Unix 워크스테이션 황제. 인터넷 인프라 석권 후 닷컴 버블 붕괴에 치명타.',
      entryMsg:'☀️ Sun Microsystems가 Java와 Unix 서버로 인터넷 인프라를 장악합니다.',
      w:{ rd:.48, mkt:.22, hr:.16, ops:.14 }, eraLimit:1,
      _hist:{ yr:1997, rev:8598, opMg:0.112, emp:21400, rpe:402000,
              note:'Java(1995) 발명. 2001 닷컴 버블 후 주가 98% 폭락. 2010년 Oracle에 $7.4B 인수.' },
      _s:{ emp:220, q:82, b:80, t:90, cash:38000000, giant:true } },

    // Borland — 개발 도구 제국, MS Visual Studio에 잠식
    // 1983 창업 / 1992 정점: 매출 $492M / Turbo Pascal·Delphi·C++
    // MS VS 무료화로 시장 붕괴 → 2009년 Micro Focus 매각
    { name:'Borland', icon:'🔵', color:'#2563eb', style:'focus',
      desc:'Turbo Pascal·Delphi·C++ Builder. 개발 도구 시장 창시자. MS VS 무료화로 서서히 소멸.',
      entryMsg:'🔵 Borland가 세계 최고 개발 도구로 개발자 시장을 공략합니다.',
      w:{ rd:.55, mkt:.20, hr:.14, ops:.11 }, eraLimit:1,
      _hist:{ yr:1992, rev:492, opMg:0.148, emp:3200, rpe:154000,
              note:'1992년 정점 후 MS가 VS를 번들·무료화 → 점유율 급락. 2009년 Micro Focus 매각.' },
      _s:{ emp:42, q:72, b:65, t:76, cash:4500000, giant:false } },

    // Siebel Systems — CRM 선구자, Salesforce에 시장 빼앗김
    // 1993 창업 / 2000 정점: 매출 $1.46B / 직원 5,000명 / CRM 시장 45% 점유
    { name:'Siebel', icon:'🏷️', color:'#dc2626', style:'quality',
      desc:'온프레미스 CRM 왕. 2000년 CRM 시장 45% 지배. Salesforce SaaS에 완패 후 Oracle 인수.',
      entryMsg:'🏷️ Siebel이 기업용 CRM 솔루션으로 영업·마케팅 소프트웨어 시장에 진입합니다.',
      w:{ rd:.40, mkt:.30, hr:.14, ops:.16 }, eraLimit:1,
      _hist:{ yr:2000, rev:1460, opMg:0.228, emp:5000, rpe:292000,
              note:'CRM 시장 45% 점유(2000). Salesforce SaaS 모델에 온프레미스로 대응 실패 → Oracle $5.85B 인수.' },
      _s:{ emp:55, q:72, b:68, t:64, cash:7000000, giant:false } },

    // Macromedia — Flash·웹 디자인 도구, Adobe에 흡수
    // 1992 창업 / 2000 정점: 매출 $320M / Flash로 인터넷 멀티미디어 장악
    { name:'Macromedia', icon:'🎬', color:'#dc2626', style:'quality',
      desc:'Flash·Dreamweaver·ColdFusion. 인터넷 시대 웹 디자인·멀티미디어 도구 표준. Adobe에 인수.',
      entryMsg:'🎬 Macromedia Flash가 인터넷 멀티미디어 시대를 열고 있습니다.',
      w:{ rd:.45, mkt:.28, hr:.14, ops:.13 }, eraLimit:2,
      _hist:{ yr:2000, rev:320, opMg:0.065, emp:1800, rpe:178000,
              note:'Flash로 인터넷 애니메이션·게임 표준 장악. 2005년 Adobe에 $3.4B 인수.' },
      _s:{ emp:32, q:76, b:72, t:74, cash:3800000, giant:false } },

    // BEA Systems — J2EE 미들웨어 황제, Oracle에 흡수
    // 1995 창업 / 2001 정점: 매출 $1.47B / WebLogic 서버로 기업 미들웨어 장악
    { name:'BEA Systems', icon:'⚙️', color:'#7c3aed', style:'quality',
      desc:'WebLogic J2EE 서버. 기업 미들웨어 시장 지배자. 닷컴 이후 성장 둔화, Oracle에 인수.',
      entryMsg:'⚙️ BEA Systems이 J2EE 미들웨어로 기업 애플리케이션 서버 시장을 장악합니다.',
      w:{ rd:.42, mkt:.22, hr:.18, ops:.18 }, eraLimit:1,
      _hist:{ yr:2001, rev:1472, opMg:0.098, emp:4200, rpe:351000,
              note:'WebLogic 미들웨어 시장 선도. 닷컴 버블 후 성장 정체. 2008년 Oracle에 $8.5B 인수.' },
      _s:{ emp:65, q:74, b:65, t:72, cash:9000000, giant:false } },

  ]},

  // ══ Era 2: 모바일·클라우드 (2007) ════════════════════════════════════════════════
  { eraIdx: 2, competitors: [

    // Google — Android·G Suite·GCP로 클라우드 시대 장악
    // 2007: 매출 $16.59B / opMg 24.7% / 직원 16,805명 / 인당매출 $987K
    // 2020: 매출 $182.5B / opMg 22.6% / 직원 135,301명
    { name:'Google', icon:'🔍', color:'#4285f4', style:'focus',
      desc:'검색 독점·Android·GCP. 압도적 데이터와 기술력. 클라우드·AI 전 시대 생존.',
      entryMsg:'🔍 Google이 기업용 소프트웨어·클라우드 시장에 본격 진출합니다!',
      w:{ rd:.55, mkt:.22, hr:.13, ops:.10 }, eraLimit:4,
      _hist:{ yr:2007, rev:16594, opMg:0.247, emp:16805, rpe:987000,
              note:'Android(2007)·G Suite·GCP 삼각 생태계. 2023년 Gemini AI로 완전 전환.' },
      _s:{ emp:380, q:125, b:138, t:142, cash:180000000, giant:true } },

    // Salesforce — SaaS CRM 혁명, 공격적 인수합병으로 생태계 확장
    // 2007: 매출 $749M / opMg 1.2% / 직원 3,879명 (성장 우선)
    // 2020: 매출 $17.1B / 직원 49,000명 (Slack $27.7B, Tableau $15.7B 인수)
    { name:'Salesforce', icon:'☁️', color:'#00a1e0', style:'aggressive',
      desc:'CRM SaaS 교과서. "No Software" 슬로건. 공격적 인수로 CRM 생태계 제국 구축.',
      entryMsg:'☁️ Salesforce가 클라우드 CRM으로 시장 판도를 바꾸고 있습니다.',
      w:{ rd:.34, mkt:.44, hr:.12, ops:.10 }, eraLimit:4,
      _hist:{ yr:2007, rev:749, opMg:0.012, emp:3879, rpe:193000,
              note:'성장 우선 전략(opMg ~1%). Slack $27.7B·Tableau $15.7B 인수로 CRM 제국 완성.' },
      _s:{ emp:160, q:100, b:98, t:102, cash:42000000, giant:false } },

    // Apple — iPhone·App Store로 소프트웨어 생태계 재정의
    // 2007: 매출 $24.01B / opMg 18.6% / 직원 21,600명 / 인당매출 $1.11M
    // 2020: 서비스 매출 $53.77B (순이익률 ~70%), 총매출 $274.5B
    { name:'Apple', icon:'🍎', color:'#555555', style:'focus',
      desc:'iPhone·App Store 생태계 잠금. 하드웨어+소프트웨어 수직 통합으로 역대급 수익성.',
      entryMsg:'🍎 iPhone 출시! Apple이 모바일 소프트웨어 시대를 열었습니다.',
      w:{ rd:.48, mkt:.28, hr:.14, ops:.10 }, eraLimit:4,
      _hist:{ yr:2007, rev:24006, opMg:0.186, emp:21600, rpe:1111000,
              note:'App Store 생태계 잠금 효과. 서비스 부문 영업이익률 ~70% → 전체 수익 핵심.' },
      _s:{ emp:280, q:130, b:160, t:128, cash:250000000, giant:true } },

    // Adobe — 패키지 SW → Creative Cloud 구독 전환의 교과서
    // 2007: 매출 $3.16B / opMg 28.1% / 직원 7,904명 / 인당매출 $400K
    // 2020: 매출 $12.87B / opMg 35.6% (구독 전환 완성)
    { name:'Adobe', icon:'🎨', color:'#ff0000', style:'quality',
      desc:'Photoshop·Creative Cloud. 패키지→구독 전환 완벽 성공. AI Firefly 통합으로 AI 시대도 적응.',
      entryMsg:'🎨 Adobe가 Creative Cloud로 소프트웨어 구독 혁명을 시작합니다.',
      w:{ rd:.48, mkt:.22, hr:.16, ops:.14 }, eraLimit:4,
      _hist:{ yr:2007, rev:3158, opMg:0.281, emp:7904, rpe:400000,
              note:'패키지→구독 전환(2012). 2020 opMg 35.6% — SaaS 전환 교과서. AI Firefly 출시.' },
      _s:{ emp:140, q:115, b:108, t:112, cash:38000000, giant:false } },

    // Workday — 클라우드 HCM·재무 선두주자, 의도적 성장 투자
    // 2012: IPO $6B / 매출 $274M
    // 2020: 매출 $4.32B / opMg -7% (성장 투자 우선)
    { name:'Workday', icon:'🏢', color:'#f9a825', style:'quality',
      desc:'HR·재무 클라우드 선두. PeopleSoft 고객 대거 흡수. 성장 우선으로 마진 희생.',
      entryMsg:'🏢 Workday가 클라우드 HR·재무 소프트웨어로 시장에 진입합니다.',
      w:{ rd:.50, mkt:.20, hr:.20, ops:.10 }, eraLimit:3,
      _hist:{ yr:2012, rev:274, opMg:-0.35, emp:2300, rpe:119000,
              note:'IPO $6B(2012). PeopleSoft Oracle 인수 후 불만 고객 흡수로 급성장.' },
      _s:{ emp:120, q:88, b:78, t:90, cash:20000000, giant:false } },

    // Atlassian — DevOps 협업, 영업 없는 PLG 혁명
    // 2002 창업 (호주), 2015 IPO $5.8B
    // 2021: 매출 $2.09B / opMg -9% / 직원 8,000+ / 인당매출 $261K
    { name:'Atlassian', icon:'🔧', color:'#0052cc', style:'focus',
      desc:'Jira·Confluence·Trello. 영업팀 없는 PLG 모델로 DevOps 협업 장악.',
      entryMsg:'🔧 Atlassian이 개발자 협업 도구로 기업 소프트웨어 시장에 진입합니다.',
      w:{ rd:.52, mkt:.16, hr:.18, ops:.14 }, eraLimit:3,
      _hist:{ yr:2015, rev:320, opMg:-0.12, emp:2300, rpe:139000,
              note:'영업 인력 없는 PLG(Product-Led Growth). 2021 opMg -9%는 R&D 집중 투자 결과.' },
      _s:{ emp:80, q:88, b:72, t:85, cash:10000000, giant:false } },

    // ServiceNow — ITSM·워크플로 SaaS, 클라우드 시대 숨은 강자
    // 2004 창업, 2012 IPO $2.5B / 2023: 매출 $8.97B / opMg 4.5% / 직원 22,000명
    { name:'ServiceNow', icon:'🔔', color:'#62d84e', style:'quality',
      desc:'ITSM·엔터프라이즈 워크플로 SaaS. 낮은 인지도 불구 기업 IT 운영 핵심 플랫폼으로 성장.',
      entryMsg:'🔔 ServiceNow가 기업 IT 서비스 관리 자동화로 엔터프라이즈 시장에 진입합니다.',
      w:{ rd:.46, mkt:.22, hr:.18, ops:.14 }, eraLimit:4,
      _hist:{ yr:2012, rev:245, opMg:-0.08, emp:1400, rpe:175000,
              note:'2012 IPO $2.5B. 2023 rev $8.97B — 클라우드 워크플로 독점 구조 확립.' },
      _s:{ emp:32, q:78, b:65, t:76, cash:5500000, giant:false } },

    // VMware — 가상화 기술 황제, 클라우드 인프라 표준
    // 1998 창업, 2007 IPO(EMC 분사) / 2007: 매출 $1.33B / opMg 20.6% / 직원 6,020명
    { name:'VMware', icon:'🖥️', color:'#607d8b', style:'quality',
      desc:'서버 가상화 기술 창시자. vSphere·NSX로 데이터센터 인프라 표준. Broadcom에 인수.',
      entryMsg:'🖥️ VMware가 서버 가상화 기술로 기업 IT 인프라 시장을 혁신합니다.',
      w:{ rd:.46, mkt:.20, hr:.16, ops:.18 }, eraLimit:3,
      _hist:{ yr:2007, rev:1330, opMg:0.206, emp:6020, rpe:221000,
              note:'가상화 특허 독점. vSphere 시장점유율 75%+. 2023년 Broadcom $61B 인수.' },
      _s:{ emp:128, q:85, b:84, t:88, cash:26000000, giant:false } },

    // Red Hat — 오픈소스 기업화, 리눅스 엔터프라이즈 표준
    // 1993 창업, 1999 IPO / 2007: 매출 $523M / opMg 7.6% / 직원 3,000명
    { name:'Red Hat', icon:'🎩', color:'#ee0000', style:'quality',
      desc:'엔터프라이즈 Linux 표준. 오픈소스 비즈니스 모델 증명. IBM에 $34B 역사적 인수.',
      entryMsg:'🎩 Red Hat이 엔터프라이즈 Linux·오픈소스 플랫폼으로 기업 시장에 진입합니다.',
      w:{ rd:.50, mkt:.18, hr:.18, ops:.14 }, eraLimit:3,
      _hist:{ yr:2007, rev:523, opMg:0.076, emp:3000, rpe:174000,
              note:'RHEL(Red Hat Enterprise Linux) 기업 구독 모델. 2019년 IBM에 $34B 인수.' },
      _s:{ emp:95, q:78, b:74, t:80, cash:11000000, giant:false } },

    // HubSpot — 인바운드 마케팅 SaaS, PLG 성장의 교과서
    // 2006 창업, 2014 IPO $125M / 2023: 매출 $2.17B / opMg -3% / 직원 7,400명
    { name:'HubSpot', icon:'🧲', color:'#ff7a59', style:'aggressive',
      desc:'인바운드 마케팅·CRM 올인원. 무료 티어로 SMB 장악 후 엔터프라이즈 확장.',
      entryMsg:'🧲 HubSpot이 인바운드 마케팅 플랫폼으로 중소기업 시장을 공략합니다.',
      w:{ rd:.38, mkt:.44, hr:.12, ops:.06 }, eraLimit:4,
      _hist:{ yr:2014, rev:115, opMg:-0.28, emp:880, rpe:131000,
              note:'Freemium PLG 모델로 SMB CRM 장악. 2023년 rev $2.17B — Salesforce 대항마.' },
      _s:{ emp:10, q:62, b:55, t:58, cash:1200000, giant:false } },

    // Twitter — 소셜 플랫폼 혁명, 광고 한계로 몰락
    // 2006 창업, 2013 IPO $14.2B / 2021: 매출 $5.08B / opMg -3.8% / MAU 3.96억
    { name:'Twitter', icon:'🐦', color:'#1da1f2', style:'aggressive',
      desc:'140자 마이크로블로그 혁명. 실시간 정보 플랫폼. 광고 수익 한계 + Musk 인수로 X 변신.',
      entryMsg:'🐦 Twitter가 실시간 소셜 플랫폼으로 정보 소비 방식을 바꿉니다.',
      w:{ rd:.30, mkt:.52, hr:.10, ops:.08 }, eraLimit:2,
      _hist:{ yr:2013, rev:665, opMg:-0.042, emp:2712, rpe:245000,
              note:'2013 IPO $14.2B. 광고 사업 한계 노출. 2022년 Musk에 $44B 인수 → X 리브랜딩.' },
      _s:{ emp:18, q:60, b:74, t:66, cash:2200000, giant:false } },

    // BlackBerry — 기업 모바일 황제, 스마트폰 혁명에 패배
    // 1984 창업(RIM), 2007: 매출 $3.0B / opMg 28% / 직원 8,000명 / 기업폰 1위
    { name:'BlackBerry', icon:'📱', color:'#2d2d2d', style:'focus',
      desc:'기업용 스마트폰 황제. QWERTY 키보드·보안 이메일 독점. iPhone 터치스크린에 완패.',
      entryMsg:'📱 BlackBerry가 보안 기업 스마트폰으로 모바일 업무 시장을 제패하고 있습니다.',
      w:{ rd:.35, mkt:.28, hr:.18, ops:.19 }, eraLimit:2,
      _hist:{ yr:2007, rev:3037, opMg:0.282, emp:8000, rpe:380000,
              note:'2007 기업폰 점유율 50%+. iPhone 출시 후 터치UI 대응 실패 → 2016년 하드웨어 종료.' },
      _s:{ emp:122, q:78, b:82, t:68, cash:24000000, giant:false } },

    // Zendesk — 고객 서비스 SaaS 선구자
    // 2007 창업, 2014 IPO / 2021: 매출 $1.34B / opMg -9% / 직원 5,300명
    { name:'Zendesk', icon:'💬', color:'#03363d', style:'focus',
      desc:'클라우드 고객 서비스 플랫폼. B2B SaaS 시대 CS 소프트웨어 표준. KKR에 인수.',
      entryMsg:'💬 Zendesk가 클라우드 기반 고객 지원 플랫폼으로 헬프데스크 시장을 혁신합니다.',
      w:{ rd:.42, mkt:.30, hr:.14, ops:.14 }, eraLimit:3,
      _hist:{ yr:2014, rev:312, opMg:-0.14, emp:1800, rpe:173000,
              note:'2014 IPO. 2021 rev $1.34B. 2022년 KKR·Permira에 $10.2B 인수 → 상장폐지.' },
      _s:{ emp:8, q:62, b:50, t:58, cash:600000, giant:false } },

    // Slack — 기업 메신저 혁명, Salesforce에 인수
    // 2013 창업, 2019 IPO / 2021: 매출 $902M / opMg -19% / 직원 2,500명
    { name:'Slack', icon:'💜', color:'#4a154b', style:'aggressive',
      desc:'기업 커뮤니케이션 혁명. 이메일 대체 채널 창조. Salesforce에 $27.7B 인수.',
      entryMsg:'💜 Slack이 기업 채널 메시징으로 이메일 중심 업무 문화를 바꿉니다.',
      w:{ rd:.44, mkt:.38, hr:.12, ops:.06 }, eraLimit:3,
      _hist:{ yr:2019, rev:630, opMg:-0.098, emp:2000, rpe:315000,
              note:'2019 직상장 $23B. Teams 무료 번들에 압박. 2021년 Salesforce $27.7B 인수.' },
      _s:{ emp:38, q:82, b:85, t:82, cash:8000000, giant:false } },

  ]},

  // ══ Era 3: AI 혁명 (2022) ════════════════════════════════════════════════════════
  { eraIdx: 3, competitors: [

    // OpenAI — ChatGPT로 생성형 AI 혁명 선언
    // 2022: ChatGPT 출시 2개월 만에 MAU 1억 (역대 최속)
    // 2024: 연매출 $3.4B 추정 / opMg -110% (GPU 비용 막대) / 직원 770명
    { name:'OpenAI', icon:'🤖', color:'#10a37f', style:'focus',
      desc:'ChatGPT·GPT-4o. 생성형 AI 혁명 선두주자. MS $13B 투자. GPU 비용으로 막대한 적자.',
      entryMsg:'🤖 ChatGPT 출시! OpenAI가 AI 시대를 선언합니다. 당신의 전략을 바꿔야 합니다.',
      w:{ rd:.65, mkt:.18, hr:.12, ops:.05 }, eraLimit:4,
      _hist:{ yr:2023, rev:1600, opMg:-1.10, emp:770, rpe:2078000,
              note:'ChatGPT 2개월 MAU 1억. GPU 비용으로 -110% opMg. MS OpenAI 파트너십 $13B.' },
      _s:{ emp:85, q:158, b:148, t:178, cash:500000000, giant:true } },

    // Anthropic — 안전 AI, OpenAI 출신 창업, Amazon·Google 양쪽 투자 유치
    // 2021 창업, 2024: 연매출 $850M 추정 / Amazon $4B + Google $2B 투자
    { name:'Anthropic', icon:'✨', color:'#c97f3a', style:'quality',
      desc:'Claude·Constitutional AI. OpenAI 출신 창업. 안전 AI로 규제 친화적 포지션.',
      entryMsg:'✨ Anthropic이 Claude AI로 시장에 진입합니다. 안전 AI의 새로운 기준.',
      w:{ rd:.62, mkt:.15, hr:.15, ops:.08 }, eraLimit:4,
      _hist:{ yr:2024, rev:850, opMg:-3.50, emp:1000, rpe:850000,
              note:'Amazon $4B + Google $2B 전략 투자. Claude 3.5 Sonnet GPT-4o와 동등 평가.' },
      _s:{ emp:52, q:150, b:88, t:168, cash:200000000, giant:false } },

    // Microsoft (AI 재진입) — Azure OpenAI·Copilot으로 AI 시대 재제패
    // 2023: 매출 $211.9B / opMg 41.6% / 직원 221,000명 / 인당매출 $958K
    { name:'Microsoft', icon:'🪟', color:'#0078d4', style:'focus',
      desc:'Azure OpenAI·Copilot 전 제품 통합. AI 시대 가장 빠른 수익화. opMg 41.6% 최고 수익성.',
      entryMsg:'🪟 Microsoft Copilot이 모든 제품에 AI를 통합합니다.',
      w:{ rd:.40, mkt:.22, hr:.18, ops:.20 }, eraLimit:4,
      _hist:{ yr:2023, rev:211915, opMg:0.416, emp:221000, rpe:958000,
              note:'OpenAI $13B 투자 → Copilot 통합. AI 수익화 $1B ARR 최속 달성.' },
      _s:{ emp:500, q:148, b:170, t:155, cash:500000000, giant:true } },

    // Palantir — AI 플랫폼으로 정부·기업 시장 공략
    // 2003 창업, 2020 IPO / 2023: 매출 $2.23B / opMg 16% / 직원 3,609명
    { name:'Palantir', icon:'🔭', color:'#101827', style:'focus',
      desc:'AI 운영 플랫폼 AIP. 정부·국방 독점 계약. 데이터 분석 AI 높은 마진.',
      entryMsg:'🔭 Palantir가 AI 운영 플랫폼으로 기업·정부 시장을 공략합니다.',
      w:{ rd:.50, mkt:.22, hr:.18, ops:.10 }, eraLimit:4,
      _hist:{ yr:2023, rev:2229, opMg:0.160, emp:3609, rpe:617000,
              note:'AIP(AI Platform) 출시 후 기업 계약 급증. 정부 계약 높은 마진 구조.' },
      _s:{ emp:65, q:118, b:85, t:128, cash:80000000, giant:false } },

    // Snowflake — 클라우드 데이터 플랫폼, AI 경쟁 격화
    // 2020 IPO $120B / 2023: 매출 $2.81B / opMg -10% / 직원 6,808명
    { name:'Snowflake', icon:'❄️', color:'#29b5e8', style:'quality',
      desc:'클라우드 데이터 플랫폼. 역대 최대 SW IPO($120B). AI 경쟁으로 성장 둔화.',
      entryMsg:'❄️ Snowflake가 클라우드 데이터 플랫폼으로 AI 시장을 공략합니다.',
      w:{ rd:.50, mkt:.26, hr:.14, ops:.10 }, eraLimit:3,
      _hist:{ yr:2023, rev:2814, opMg:-0.10, emp:6808, rpe:413000,
              note:'2020 IPO $120B — 역대 SW 최대. Databricks·Google BigQuery와 치열한 경쟁.' },
      _s:{ emp:150, q:115, b:95, t:118, cash:50000000, giant:false } },

    // Meta AI — LLaMA 오픈소스 + Reality Labs, 소셜 AI 통합
    // 2023: Meta 전체 매출 $134.9B / AI 투자 연간 $35B+ / LLaMA 2·3 오픈소스 공개
    { name:'Meta AI', icon:'🌐', color:'#0668e1', style:'aggressive',
      desc:'LLaMA 오픈소스 AI·Ray-Ban AI 안경·Quest VR. 소셜+AI 생태계 통합으로 AI 시대 재도약.',
      entryMsg:'🌐 Meta AI가 LLaMA 오픈소스와 소셜 AI로 생성형 AI 시장을 공략합니다.',
      w:{ rd:.55, mkt:.30, hr:.10, ops:.05 }, eraLimit:4,
      _hist:{ yr:2023, rev:134900, opMg:0.347, emp:66185, rpe:2038000,
              note:'LLaMA 2·3 오픈소스 공개로 AI 생태계 주도. Reality Labs 연간 $16B 손실 감수.' },
      _s:{ emp:200, q:125, b:132, t:140, cash:300000000, giant:true } },

    // Databricks — 데이터+AI 통합 플랫폼, 유니콘의 제왕
    // 2013 창업, 2024: 매출 $1.6B / 직원 6,000명 / 기업가치 $43B
    { name:'Databricks', icon:'⚡', color:'#ff3621', style:'quality',
      desc:'Apache Spark 창시·Lakehouse 아키텍처. 데이터+AI 통합 플랫폼으로 Snowflake 최대 경쟁자.',
      entryMsg:'⚡ Databricks가 데이터 레이크하우스 + AI 플랫폼으로 엔터프라이즈를 공략합니다.',
      w:{ rd:.58, mkt:.22, hr:.14, ops:.06 }, eraLimit:4,
      _hist:{ yr:2023, rev:1600, opMg:-0.25, emp:5000, rpe:320000,
              note:'DBRX 오픈소스 LLM 공개. Mosaic ML $1.3B 인수. 기업가치 $43B(2024).' },
      _s:{ emp:102, q:105, b:82, t:112, cash:80000000, giant:false } },

    // Hugging Face — AI 모델 허브, 오픈소스 AI의 GitHub
    // 2016 창업, 2023: 기업가치 $4.5B / 직원 250명 / 모델 허브 50만+ 모델 보유
    { name:'Hugging Face', icon:'🤗', color:'#ff9d00', style:'focus',
      desc:'AI 모델 허브·Transformers 라이브러리. "AI의 GitHub". 오픈소스 AI 생태계 핵심 인프라.',
      entryMsg:'🤗 Hugging Face가 AI 모델 공유 플랫폼으로 오픈소스 AI 생태계를 장악합니다.',
      w:{ rd:.62, mkt:.18, hr:.14, ops:.06 }, eraLimit:4,
      _hist:{ yr:2023, rev:70, opMg:-0.80, emp:250, rpe:280000,
              note:'Transformers 라이브러리 13만+ stars. $4.5B 기업가치. AWS·Google·Nvidia 투자.' },
      _s:{ emp:28, q:92, b:105, t:118, cash:50000000, giant:false } },

    // Mistral AI — 유럽 AI 스타트업, 오픈 웨이트 모델
    // 2023 창업 (DeepMind·Meta 출신) / Series A $415M / 기업가치 $2B
    { name:'Mistral AI', icon:'🌬️', color:'#7c3aed', style:'focus',
      desc:'유럽 대표 AI 스타트업. Mixtral 오픈소스 MoE 모델. 규제 친화적 EU AI 포지션.',
      entryMsg:'🌬️ Mistral AI가 유럽 오픈소스 AI로 GPT·Claude에 도전장을 내밉니다.',
      w:{ rd:.65, mkt:.18, hr:.12, ops:.05 }, eraLimit:3,
      _hist:{ yr:2023, rev:10, opMg:-5.00, emp:30, rpe:333000,
              note:'Series A $415M. Mixtral 8x7B MoE 아키텍처. EU AI Act 친화적 전략.' },
      _s:{ emp:14, q:88, b:72, t:112, cash:38000000, giant:false } },

    // Cohere — 기업용 AI API, 엔터프라이즈 특화
    // 2019 창업 (Google Brain 출신) / 2023: 기업가치 $2.2B / 직원 500명
    { name:'Cohere', icon:'🔗', color:'#39594d', style:'quality',
      desc:'기업용 AI API 특화. RAG·임베딩 기술 선도. Command·Embed로 엔터프라이즈 LLM 공급.',
      entryMsg:'🔗 Cohere가 기업용 AI API로 엔터프라이즈 LLM 시장을 공략합니다.',
      w:{ rd:.60, mkt:.20, hr:.14, ops:.06 }, eraLimit:3,
      _hist:{ yr:2023, rev:35, opMg:-3.50, emp:400, rpe:88000,
              note:'Series C $270M. Oracle·Salesforce 전략 파트너십. 기업 RAG 솔루션 선도.' },
      _s:{ emp:42, q:85, b:70, t:105, cash:32000000, giant:false } },

  ]},

  // ══ Era 4: AGI 이후 (2036) ════════════════════════════════════════════════════════
  { eraIdx: 4, competitors: [

    // DeepMind — Google 산하 AGI 연구소, 범용 지능 소프트웨어화
    // 2010 창업, 2014 Google $625M 인수
    // AlphaGo(2016)·AlphaFold(2020)·Gemini 등 AGI 핵심 기술 개발
    { name:'DeepMind', icon:'🧠', color:'#9c27b0', style:'focus',
      desc:'Google DeepMind AGI 연구소. AlphaFold·Gemini 기반 범용 AI 소프트웨어 독립 출시.',
      entryMsg:'🧠 DeepMind가 AGI 기반 소프트웨어로 모든 산업을 재정의합니다.',
      w:{ rd:.70, mkt:.14, hr:.10, ops:.06 }, eraLimit:4,
      _hist:{ yr:2024, rev:0, opMg:null, emp:2300, rpe:null,
              note:'Google 산하 비공개. AlphaFold 과학 혁명 → AGI 기반 소프트웨어 플랫폼화 예정.' },
      _s:{ emp:120, q:175, b:110, t:188, cash:800000000, giant:true } },

    // NexusAI — 가상 AGI 시대 신흥 강자 (2030년대 예측)
    // AGI 기반 자율 소프트웨어 생성 플랫폼 — 인간 개발자 대체
    { name:'NexusAI', icon:'🌌', color:'#6366f1', style:'focus',
      desc:'AGI 기반 소프트웨어 자동 생성. 소수 직원 + AGI 자동화로 대형 소프트웨어 생산.',
      entryMsg:'🌌 NexusAI가 AGI로 소프트웨어 개발 자체를 자동화합니다.',
      w:{ rd:.72, mkt:.16, hr:.08, ops:.04 }, eraLimit:4,
      _hist:{ yr:2036, rev:0, opMg:null, emp:50, rpe:null,
              note:'가상 기업. AGI 시대 초소수 직원 + 자동화 소프트웨어 팩토리 모델 예측.' },
      _s:{ emp:20, q:168, b:92, t:180, cash:300000000, giant:false } },

    // Scale AI — AI 데이터 인프라, AGI 시대 데이터 공급자
    // 2016 창업 / 2024: 기업가치 $13.8B / 직원 800명
    // AGI 시대: AI 학습 데이터·RLHF 인프라 핵심 공급자로 독점적 지위
    { name:'Scale AI', icon:'📐', color:'#f43f5e', style:'focus',
      desc:'AI 학습 데이터 인프라 독점. RLHF·데이터 레이블링 핵심 공급자. AGI 시대 AI 연료 공급자.',
      entryMsg:'📐 Scale AI가 AGI 훈련 데이터 인프라로 AI 소프트웨어 생태계 기반을 장악합니다.',
      w:{ rd:.52, mkt:.20, hr:.18, ops:.10 }, eraLimit:4,
      _hist:{ yr:2024, rev:670, opMg:0.08, emp:800, rpe:838000,
              note:'2024 기업가치 $13.8B. 미 국방부 계약 + 주요 AI 기업 독점 데이터 파트너.' },
      _s:{ emp:45, q:118, b:82, t:125, cash:120000000, giant:false } },

    // QuantumSoft — 가상 양자 소프트웨어 기업 (2030년대 예측)
    // 양자 알고리즘 기반 최적화·시뮬레이션 플랫폼 — AGI와 결합한 초지능 소프트웨어
    { name:'QuantumSoft', icon:'⚛️', color:'#0ea5e9', style:'quality',
      desc:'양자-AGI 하이브리드 플랫폼. 양자 알고리즘으로 고전 컴퓨터 한계 돌파. 신약·기후·금융 혁신.',
      entryMsg:'⚛️ QuantumSoft가 양자컴퓨팅 + AGI 융합으로 소프트웨어의 물리적 한계를 넘습니다.',
      w:{ rd:.75, mkt:.14, hr:.08, ops:.03 }, eraLimit:4,
      _hist:{ yr:2036, rev:0, opMg:null, emp:35, rpe:null,
              note:'가상 기업. 양자 우위(Quantum Advantage) 달성 후 소프트웨어 산업 재편 예측.' },
      _s:{ emp:18, q:160, b:88, t:182, cash:250000000, giant:false } },

  ]},
];

// ═══════════════════════════════════════════════════════
// 2. GAME STATE
// ═══════════════════════════════════════════════════════

let G = {};           // global game state
let charts = {};      // Chart.js instances
let pendingEvent = null;
let decisionState = { rd:50000, mkt:20000, hr:0, hire:0, price:1.0, strategy:'differentiation' };

function newGame(cfg) {
  const yr    = cfg.startYear || 1980;
  const diff  = cfg.difficulty || 'normal';
  const dm    = DIFF_MULTS[diff] || DIFF_MULTS.normal;  // difficulty multipliers

  // legacy aliases (used in competitor init below)
  const cashMult = dm.cash;
  const compStr  = dm.compStr;
  const shareBonus = (yr - 1980) * 0.00002;

  G = {
    name:        cfg.name || 'ACME Software',
    productName: cfg.product || 'Business Suite',
    ceoName:     cfg.ceo || 'CEO',
    startYear:   yr,
    difficulty:  diff,
    diffMults:   dm,   // ← 전 게임에 걸쳐 참조 가능

    year: yr, quarter: 1,

    // Company stats
    cash:      Math.round(500000 * dm.cash),
    employees: Math.max(3, Math.round(3 + (yr-1980)*0.1)),
    quality:   Math.min(80, 20 + (yr-1980)*0.7),
    brand:     Math.min(60, 12 + (yr-1980)*0.5),
    tech:      Math.min(70, 10 + (yr-1980)*0.8),

    // Market
    marketShare: (0.00005 + shareBonus) * dm.shareBonus,
    revenue:  0,
    profit:   0,
    strategy: 'differentiation',

    // Product life cycle
    productStage:  'growth',   // intro/growth/maturity/decline
    productStageQ: 0,          // quarters in stage

    // Competitors — 항상 1980 초창기 세트로 시작, 이후 시대 전환 시 실제 기업 자동 진입
    competitors: (() => {
      const set = ERA_COMPETITOR_SETS[1980];
      return set.map(t => {
        const s = t._s;
        const scale = s.giant ? 1.0 : compStr;
        return {
          name: t.name, icon: t.icon, color: t.color,
          style: t.style, desc: t.desc, w: { ...t.w },
          eraLimit: t.eraLimit !== undefined ? t.eraLimit : 4,
          cash:        Math.round(s.cash * cashMult * scale),
          employees:   Math.max(1, Math.round(s.emp * scale)),
          quality:     Math.min(200, s.q * scale),
          brand:       Math.min(200, s.b * scale),
          tech:        Math.min(200, s.t * scale),
          priceIndex:  t.priceIndex || defaultPriceIndex(t.style),
          marketShare: 0, revenue: 0, profit: 0,
          alive: true, consecLoss: 0,
          ipo: s.giant, ipoYear: s.giant ? 1980 : null,
          _hist: t._hist || null,
          _profitableQ: 0,
        };
      });
    })(),

    // Lifecycle event tracking
    firedEvents: new Set(),
    eventBoostQ: 0,
    eventMarketMult: 1.0,
    eventProdBonus: 1.0,

    // History
    history: [],
    newsLog: [],

    // HR & Morale
    morale:          60,   // 0–100, affects attrition
    lastAttrition:   0,    // employees who left last quarter

    // Financing
    equity:          100,   // % founder ownership (diluted by VC rounds)
    loans:           [],    // [{name, principal, qPay, quartersLeft}]
    fundingHistory:  [],    // which rounds have been taken
    ipo:             false,

    // Tech debt — accrues when revolution/shift events are underfunded
    // [{title, baseFrac, quartDebt, resolved, _lastCatchupQ}]
    techDebt: [],

    // End conditions
    consecLoss: 0,
    gameOver:   false,
    win:        false,
    totalRevenue:     0,
    peakRevenue:      0,
    peakMarketShare:  0,
    peakCash:         0,
  };

  // Calculate initial player score to set incumbent baseline
  // Incumbent represents thousands of other market players
  const initScore = compScore({
    quality: G.quality, brand: G.brand, tech: G.tech,
    employees: G.employees, priceIndex: 1.0, strategy: 'differentiation'
  });
  // Era-based multipliers: the more mature the era, the less dominant incumbents are
  // This creates dramatic "market opening" moments at each tech revolution
  const eraMults = [8000, 3000, 1200, 400, 80]; // PC→Internet→Mobile→AI→AGI
  G.incumbentBaseScore = initScore * eraMults[0];
  G.eraMults = eraMults;
  G.lastEraIdx      = 0; // 시대 전환 감지용
  G.eraTransitionQ  = 0; // 패러다임 전환 후 재투자 압박 카운트다운
  G._lastMinEmp     = 0; // 전 분기 최소 인원 (급증 스무딩용)
}

// ═══════════════════════════════════════════════════════
// 3. CALCULATIONS
// ═══════════════════════════════════════════════════════

function lerp(map, yr) {
  if (map[yr] !== undefined) return map[yr];
  const keys = Object.keys(map).map(Number).sort((a,b)=>a-b);
  if (yr <= keys[0]) return map[keys[0]];
  if (yr >= keys[keys.length-1]) return map[keys[keys.length-1]];
  const lo = keys.filter(k=>k<=yr).pop();
  const hi = keys.filter(k=>k>yr)[0];
  return map[lo] + (map[hi]-map[lo])*(yr-lo)/(hi-lo);
}

function getMarketSize(year, quarter) {
  // Annual TAM in $M, convert to quarterly $ by dividing by 4
  const annualM = lerp(MARKET_TAM, year);
  const qMult   = 1 + (quarter-1)*0.02; // slight intra-year growth
  return annualM * 1e6 / 4 * qMult * G.eventMarketMult;
}

function getSalary(year) {
  return lerp(SALARY_RATE, year);
}

// ── 기업별 임금 배율 — 전략·규모·재무건전성·기술집약도 반영 ──────────────────
// 시장 평균(getSalary) 대비 각 기업이 실제로 지급하는 임금 배율 (0.65 ~ 1.55).
//
// 실제 사례:
//   Google/Apple (quality·대형): × ~1.45  — RSU + 높은 현금 보상
//   Microsoft/Oracle (focus·대형): × ~1.25
//   스타트업 (aggressive): × ~1.00  — 주식으로 현금 부족 상쇄
//   비용절감 전략 기업:    × ~0.80  — 인건비 압박으로 이직률 상승
//
// 높은 임금 배율 → 비용↑, 이직률↓, 우수 인재 유치
// 낮은 임금 배율 → 비용↓, 이직률↑
function getCompanyWageMult(entity, isPlayer) {
  let mult = 1.0;

  // ① 전략/스타일별 기본 임금 기조
  let style;
  if (isPlayer) {
    // 플레이어 전략 → 임금 기조 매핑
    const stratMap = {
      differentiation: 'quality',       // 품질 차별화 → 프리미엄 인재 필요
      growth:          'aggressive',     // 빠른 성장 → 시장 평균
      cost_leadership: 'cost_leadership',// 비용 절감 → 시장 하회
      stability:       'focus',          // 안정화 → 전문 인재 집중
    };
    style = stratMap[G.strategy] || 'focus';
  } else {
    style = entity.style || 'focus';
  }
  const styleAdj = {
    quality:          0.18,  // 최고 인재 필수 → +18%
    focus:            0.08,  // 전문직 프리미엄 → +8%
    aggressive:       0.00,  // 시장 평균
    cost_leadership: -0.18,  // 명시적 인건비 절감 → -18%
  };
  mult += (styleAdj[style] || 0);

  // ② 규모·상장 프리미엄: 대기업·IPO는 스톡옵션+복지+명성으로 최상위 인재 확보
  const emp     = isPlayer ? (G.employees || 0) : (entity.employees || 0);
  const isGiant = isPlayer ? (G.ipo || false)   : (entity.ipo || entity.giant || false);
  if (isGiant)        mult += 0.15;  // IPO 대기업: +15%
  else if (emp > 2000) mult += 0.08; // 중대형: +8%
  else if (emp > 500)  mult += 0.04; // 중형: +4%

  // ③ 재무 건전성: 수익성 높은 기업은 인재에 더 투자할 여력이 있음
  const rev    = isPlayer ? (G.revenue || 0) : (entity.revenue || 0);
  const prof   = isPlayer ? (G.profit  || 0) : (entity.profit  || 0);
  const margin = rev > 0 ? prof / rev : 0;
  mult += Math.max(-0.12, Math.min(0.12, margin * 0.5));

  // ④ 기술 집약도: 고기술 기업은 상위 엔지니어 확보 비용이 높음
  const tech = isPlayer ? (G.tech || 0) : (entity.tech || 0);
  if (tech > 130)     mult += 0.10;
  else if (tech > 90) mult += 0.05;

  return Math.max(0.65, Math.min(1.55, mult));
}

function getCurrentEra() {
  for (let i = ERAS.length-1; i >= 0; i--) {
    if (G.year >= ERAS[i].year) return ERAS[i];
  }
  return ERAS[0];
}

function getEraIndex() {
  for (let i = ERAS.length-1; i >= 0; i--) {
    if (G.year >= ERAS[i].year) return i;
  }
  return 0;
}

// ── 이벤트별 역사적 최소 투자금 DB ($M 단위) ──────────────────────────────────
// 키: "연도_분기" → 선택지 순서대로 최소 투자금 배열
// 실제 역사 기록 기반: SEC 연간보고서, IDC/Gartner 시장조사, Bloomberg/Forbes 투자 보도
// ※ 이 값은 floor: 플레이어 매출이 크면 costFrac 기반 금액이 더 클 수 있음
const EVENT_FLOOR_DB = {
  // ── 1980s PC 시대 ──────────────────────────────────────────────────────────────
  // IBM PC 호환 개발: 소규모 PC SW사 이식 $0.3M~$2M (Ashton-Tate 초기 투자 ~$0.5M)
  '1981_3': [0.5, 0],
  // Lotus 1-2-3 경쟁 대응: 스프레드시트 경쟁 개발 $0.3M~$1.5M
  '1983_2': [0.3, 0],
  // Mac GUI 전면 개편: Apple 자체 $50M. 중소 SW사 GUI 전환 $1M~$5M
  '1984_1': [1.0, 0],
  // Windows 1.0 조기 채택: Windows 개발 생태계 진입 $0.5M~$2M
  '1985_4': [0.5, 0],
  // 블랙 먼데이: 비용절감 0, 틈새마케팅 $0.2M~$1M
  '1987_4': [0, 0.2],
  // DTP 붐: Aldus(PageMaker) 개발비 $5M, 소규모 DTP 진출 $0.3M~$1M
  '1987_3': [0.5, 0],
  // 걸프전 대응: 정부계약 진출 $0.5M, 저가 포지셔닝 $0.2M
  '1990_3': [0.5, 0.2],
  // Windows 3.0: Lotus/WordPerfect Windows판 개발 $5M~$30M, 점진적 $1M, 관망 0
  '1990_2': [5.0, 1.0, 0],

  // ── 1990s 인터넷 전환 시대 ─────────────────────────────────────────────────
  // Windows NT 엔터프라이즈: 기업용 NT 포팅 프로젝트 $5M~$30M
  '1992_2': [5.0, 0],
  // CD-ROM 멀티미디어: 멀티미디어 SW 개발 $0.5M~$3M
  '1993_3': [0.5, 0],
  // Mosaic/WWW: 웹 개발 착수 $2M, 인터넷 마케팅 $0.5M, 관망 0
  '1994_2': [2.0, 0.5, 0],
  // 멕시코 페소 위기: 선진국 집중 0, 신흥시장 저가 $0.2M
  '1994_4': [0, 0.2],
  // 넷스케이프 IPO·인터넷 혁명: MS $400M+ 인터넷 투자, 중견 $20M~$100M, 점진 $8M, 관망 0
  '1995_3': [20.0, 8.0, 0],
  // Java 혁명: Sun $1B 투자. 기업 Java 전환 $8M~$50M, 부분지원 $2M
  '1996_2': [8.0, 2.0],
  // ERP 붐: SAP 구현 평균 프로젝트 $15M~$100M, 중소기업 집중 0
  '1997_2': [15.0, 0],
  // 아시아 금융위기: 철수 0, 저평가 인재·사무소 인수 $8M~$30M
  '1997_4': [0, 8.0],
  // 러시아 LTCM: 현금보존 0, SW 불황방어 마케팅 $1.5M
  '1998_3': [0, 1.5],
  // 닷컴 골드러시: Pets.com $11.2M 광고비, 평균 마케팅 $30M~$200M. 제품집중 $12M
  '1999_1': [40.0, 12.0],
  // Y2K: 기업 Y2K 대응 평균 지출 $8M~$50M (Gartner). 컨설팅 서비스 $3M
  '1999_4': [8.0, 3.0],

  // ── 2000s 닷컴 버스트 & 회복 ───────────────────────────────────────────────
  // 닷컴 붕괴: 비용절감 0, 핵심방어 $8M, M&A (AOL Time Warner $182B 교훈) 중형 $50M
  '2000_4': [0, 8.0, 50.0],
  // 9/11: 비용절감 0, 틈새공략 $3M
  '2001_4': [0, 3.0],
  // SARS: Webex 원격협업 급성장 배경, 원격 기능 개발 $5M, 오프라인 0
  '2003_1': [5.0, 0],
  // 오픈소스: Red Hat $50M R&D, 중견기업 전환 $8M, 독점 유지 0
  '2003_3': [8.0, 0],
  // 소셜/Facebook: 소셜기능 $8M, 기업용 강화 $4M
  '2004_2': [8.0, 4.0],
  // Web 2.0: AJAX 전면 리뉴얼 $15M, 동영상·미디어 $5M
  '2005_2': [15.0, 5.0],
  // AWS EC2: Netflix 클라우드 마이그레이션 $100M+, 기업 클라우드 전환 $20M, 하이브리드 $5M
  '2006_3': [20.0, 5.0],

  // ── 2007-2015 모바일·클라우드 시대 ────────────────────────────────────────
  // iPhone 모바일: Facebook 모바일 투자 $50M+, 모바일웹 $20M, 관망 0
  '2007_3': [50.0, 20.0, 0],
  // 금융위기: 클라우드 비용절감 솔루션 $15M, 내부절감 0, M&A 중형 $80M
  '2008_4': [15.0, 0, 80.0],
  // 앱스토어: 전략 앱 $12M, 기존제품 모바일 연동 $3M
  '2009_2': [12.0, 3.0],
  // 클라우드·SaaS 혁명: Salesforce SaaS 전환 $100M+, 하이브리드 $25M, 관망 0
  '2010_2': [100.0, 25.0, 0],
  // 유럽 재정위기: 지역 다각화 $8M, 긴축 솔루션 $4M
  '2010_4': [8.0, 4.0],
  // 빅데이터: Hadoop 도입 평균 $20M (IDC), API 연동 $3M
  '2011_1': [20.0, 3.0],
  // 동일본 대지진: 클라우드 인프라 강화 $8M, 일본 IT 수요 $2M
  '2011_2': [8.0, 2.0],
  // Docker·컨테이너: 마이크로서비스 전환 평균 $15M~$50M, 모놀리식 최적화 $2M
  '2013_3': [15.0, 2.0],
  // IoT: Cisco IoT 투자 $1.4B, 중견기업 플랫폼 $30M, IoT API $4M
  '2014_2': [30.0, 4.0],
  // 중국 증시: 선진국 집중 0, 중국 저점 공략 $10M
  '2015_3': [0, 10.0],

  // ── 2016-2021 AI·규제·팬데믹 ──────────────────────────────────────────────
  // AI·딥러닝: Google Brain 연간 $50M+, 기업 AI 통합 $40M, 기존 강화 $8M
  '2016_2': [40.0, 8.0],
  // 블록체인: IBM Blockchain $200M 투자, 기업 출시 $20M, 기술 검토 $2M
  '2017_4': [20.0, 2.0],
  // GDPR: 대기업 평균 GDPR 준수 비용 $13M (PwC 2018 조사), 최소대응 $3M
  '2018_2': [15.0, 3.0],
  // SaaS 성숙: 고객성공팀 $10M, 제품 자동화 $8M
  '2018_3': [10.0, 8.0],
  // 5G: Ericsson 5G R&D 연간 $3B, 기업 SW 5G 최적화 $30M, 점진 $3M
  '2019_2': [30.0, 3.0],
  // COVID 디지털 전환: Zoom 인프라 확장 $150M+, 클라우드 마케팅 $50M, 안정성 $8M
  '2020_1': [150.0, 50.0, 8.0],
  // 메타버스: Meta $10B+ Reality Labs, 기업 진출 $40M, 관망 0
  '2021_4': [40.0, 0],

  // ── 2022-2030 AI 혁명 시대 ────────────────────────────────────────────────
  // 금리급등·테크 겨울: 구조조정 0, 핵심방어 $12M, M&A (Broadcom VMware $61B 시대적 배경) $80M
  '2022_2': [0, 12.0, 80.0],
  // ChatGPT 생성형 AI: MS OpenAI $13B 투자, 전면통합 $300M, MVP $80M, 보수적 $5M
  '2022_4': [300.0, 80.0, 5.0],
  // SVB 파산: 분산예금 0, 핀테크 대안 $1M
  '2023_1': [0, 1.0],
  // AI 코파일럿: GitHub Copilot 개발 $40M+, 전면도입 $40M, 선제도입 $12M
  '2023_3': [40.0, 12.0],
  // AI 에이전트: 대형 에이전트 플랫폼 구축 $100M, 기능추가 $25M
  '2024_2': [100.0, 25.0],
  // 자율 AI 코딩: 전문 AI 개발팀 $150M, 기존 제품 AI 기능 $40M
  '2025_2': [150.0, 40.0],
  // EU AI법: 컴플라이언스 시스템 평균 $50M (대기업 기준), EU 외 집중 $12M
  '2026_3': [50.0, 12.0],
  // AR·공간 컴퓨팅: Apple Vision Pro 개발 $1B+, 기업 앱 진출 $200M, 기존 확장 $50M
  '2028_1': [200.0, 50.0],
  // 양자컴퓨팅: IBM 양자 R&D 누적 $15B, 기업 알고리즘 $400M, 최적화 $100M
  '2030_1': [400.0, 100.0],

  // ── 2031-2050 AGI 이후 시대 ────────────────────────────────────────────────
  // AI 일자리 대란: 재교육 플랫폼 $100M, 로비·컴플라이언스 $25M
  '2032_2': [100.0, 25.0],
  // AGI 등장: 완전 AGI 네이티브 전환 $800M, API 통합 $150M, 방어 $15M
  '2035_3': [800.0, 150.0, 15.0],
  // 글로벌 사이버 공격: 제로트러스트 구축 $150M, 필수 패치 $15M
  '2038_1': [150.0, 15.0],
  // 디지털-물리 통합: 사이버피지컬 플랫폼 $600M, IoT·디지털트윈 확장 $100M
  '2040_2': [600.0, 100.0],
  // BCI 대중화: BCI 네이티브 SW $1,000M, BCI 지원 추가 $150M
  '2045_3': [1000.0, 150.0],
};

// ── 이벤트 투자금 계산 ──
// costFrac: 연매출 대비 비율 (0.10 = 10%). 직전 분기 매출 × 4 를 기준으로 산출.
// floorM: 역사적 최소 투자금 ($M). EVENT_FLOOR_DB 에서 조회해 전달.
// 매출이 없을 때는 시장규모 0.04%를 baseRev floor로 사용.
function getEventChoiceCost(costFrac, floorM = 0) {
  if (!costFrac || costFrac <= 0) return 0;
  const lastQRev = G.history.length ? G.history[G.history.length - 1].rev : 0;
  // 연매출(ARR) 기준 — 분기 매출의 4배를 투자 베이스로 사용하여 전략적 투자 규모 현실화
  const mktFloor = getMarketSize(G.year, G.quarter) * 0.0004; // ~0.04% of annual market
  const baseRev  = Math.max(lastQRev * 4, mktFloor);
  const fracCost = Math.round(baseRev * costFrac);
  // 역사적 최소 투자금 floor 적용 (소규모 플레이어도 현실적 금액 표시)
  const minCost  = Math.round((floorM || 0) * 1_000_000);
  return Math.max(fracCost, minCost);
}

// ── 이벤트 최소 직원 요건 — 투자 비율 × 현재 회사 규모 비례 ──
// 고정 숫자가 아닌 현재 필요 인원(calcMinEmployees)에 비례해 산정.
// 초반 소규모 기업엔 절대 최솟값(floor)으로 진입 장벽 유지,
// 대규모 기업엔 의미 있는 실행 조직 규모를 요구.
function getEventChoiceMinEmp(costFrac) {
  if (!costFrac || costFrac <= 0) return 0;
  // 현재 회사 스케일 기준 (최소 20명 floor → 초기 게임 안정성)
  const scale = Math.max(20, calcMinEmployees());
  // costFrac 구간별 scale 대비 비율 (+ 절대 floor 유지)
  if (costFrac < 0.06) return Math.max(2,  Math.round(scale * 0.010)); // ~1%
  if (costFrac < 0.14) return Math.max(5,  Math.round(scale * 0.030)); // ~3%
  if (costFrac < 0.28) return Math.max(12, Math.round(scale * 0.060)); // ~6%
  if (costFrac < 0.58) return Math.max(25, Math.round(scale * 0.120)); // ~12%
  if (costFrac < 1.10) return Math.max(45, Math.round(scale * 0.200)); // ~20%
  return Math.max(80,  Math.round(scale * 0.300));                      // ~30%
}

// ── Company valuation (estimated enterprise value) ──
function getValuation(entity) {
  const rev = entity.revenue || 0;
  if (rev <= 0) return 0;
  const annualRev = rev * 4;
  const multiple  = lerp(REV_MULTIPLE, G.year);
  // Profitable companies trade at premium; loss-makers at discount
  const profitMult = entity.profit > 0
    ? 1.0 + Math.min(0.5, entity.profit / rev * 1.5)
    : Math.max(0.4, 0.7 + entity.profit / rev);
  return Math.round(annualRev * multiple * profitMult);
}

// ── HR 투자 지수 계산 ─────────────────────────────────────────────────────
// hrIdx = HR투자액 / HR기준치 (1.0 = 적정 투자, 0 = 무투자, 2+ = 공격적 투자)
// 이 값이 생산성·이직률·채용력·임금에 연쇄적으로 영향.
function getHrIndex(hrSpend, employees, year) {
  const salQ    = getSalary(year || G.year) / 4;
  const empRoot = Math.sqrt(Math.max(1, employees || G.employees));
  const hrBase  = Math.max(5000, salQ * 0.15 * empRoot);
  return Math.max(0, (hrSpend || 0) / hrBase);
}

// ── HR 지수 → 4가지 효과 계산 ─────────────────────────────────────────────
// hrIdx별 효과 (기준 hrIdx=1.0). 과잉투자 방지: 4.0 이상은 효과 수렴 (체감 수익 모델).
//   생산성:  hrIdx=0 → ×0.80, idx=1 → ×1.00, idx=2 → ×1.14, idx=4 → ×1.20 (상한)
//   이직률:  hrIdx=0 → +0.8%p, idx=1 → 0, idx=4 → -2.4%p (상한)
//   채용력:  hrIdx=0 → ×0.70, idx=1 → ×1.00, idx=4 → ×1.90 (상한)
//   임금할증: hrIdx=0 → 0%, idx=1 → 7.5%, idx=4 → 30% (상한)
function getHrEffects(hrIdx) {
  const raw = hrIdx || 0;
  // 체감 수익: 1.0 이하는 선형, 초과분은 sqrt로 수렴 → 과잉투자 시 수치 폭발 방지
  // effIdx 예: raw=1→1, raw=4→2.73, raw=9→3.83, raw=60→8.7 → 상한 clamp로 마무리
  const effIdx = raw <= 1.0
    ? raw
    : 1.0 + Math.sqrt(raw - 1.0);
  // 최종 상한: 4.0 (실제 기업 HR 투자 효과의 현실적 천장)
  const idx = Math.min(effIdx, 4.0);
  return {
    prod:        Math.max(0.7,  1.0 + (idx - 1.0) * 0.20),  // 최대 ×1.60 (+60%)
    attrAdj:     -(idx - 1.0) * 0.008,                        // 최대 -2.4%p/분기
    recruitMult: Math.max(0.5,  0.7 + idx * 0.30),            // 최대 ×1.90
    wagePremium: Math.max(0, (idx - 0.5) * 0.10),             // 최대 +35% (임금 할증 상한 조정)
  };
}

// ── Minimum headcount required for current revenue level ──
// projected revenue (market share × market size) 기반 — 인력부족 패널티로 줄어든 G.revenue 사용 금지
// 기술력·HR·AI 생산성 보너스를 반영하여 고투자 기업은 적은 인원으로 동일 매출 달성 가능.
function calcMinEmployees() {
  const mktSize = getMarketSize(G.year, G.quarter);
  const projRev = mktSize * Math.max(G.marketShare || 0, 0.000001);
  const bench   = lerp(REV_PER_EMP_BENCH, G.year);

  // 기술력 생산성: tech 50 기준, 이후 포인트당 +0.5%
  const techProd = 1.0 + Math.max(0, (G.tech || 0) - 50) / 200;
  // 이벤트 생산성 보너스
  const evProd   = G.eventProdBonus || 1.0;
  // HR 생산성: 인재개발 투자에 따른 1인당 성과 향상
  const hrIdx    = getHrIndex(decisionState.hr, G.employees, G.year);
  const hrProd   = getHrEffects(hrIdx).prod;

  // ── 시대별 생산성 배율 ──────────────────────────────────────────────────
  // 기술 발전(SaaS 툴링·클라우드·AI 자동화)으로 1인당 처리 가능한 매출이 시대별로 증가.
  // 이 배율이 클수록 더 적은 인원으로 동일 매출을 달성 가능.
  //   PC(1980)     : 1.00× — 모든 것을 수동 처리
  //   인터넷(1995) : 1.15× — 이메일·웹 도구로 생산성 향상
  //   모바일·클라우드(2007): 1.35× — SaaS·클라우드 자동화
  //   AI 혁명(2022): 1.80× — AI 코파일럿이 개발·CS·마케팅 40%+ 대체
  //   AGI 이후(2036): 3.50× — AGI 에이전트가 반복 업무 대부분 처리
  const ERA_PROD_MULT = [1.00, 1.15, 1.35, 1.80, 3.50];
  const eraIdx = getEraIndex();
  const eraProd = ERA_PROD_MULT[eraIdx] || 1.0;

  const rawMin = Math.max(1, Math.ceil(
    projRev * 4 / (bench * techProd * evProd * hrProd * eraProd)
  ));

  // ── 분기별 급증 방지: 전 분기 대비 최대 +20% 증가 ─────────────────────
  // 시장 점유율·시장 크기 급변으로 인한 채용 요구치 스파이크를 완화.
  // (단, 초기(0명) 또는 전환 직후에는 스무딩 없이 바로 적용)
  const last = G._lastMinEmp || 0;
  const smoothed = last <= 1
    ? rawMin
    : Math.min(rawMin, Math.ceil(last * 1.20));
  G._lastMinEmp = smoothed;

  return smoothed;
}

// ── Target morale (0–100) based on HR investment, workload, finances ──
function calcTargetMorale() {
  // 1. HR investment per employee vs. 5% of annual salary (market training budget)
  const hrPerEmp = G.employees > 0 ? Math.max(0, decisionState.hr) / G.employees : 0;
  const hrBench  = getSalary(G.year) * 0.05 / 4; // quarterly benchmark per emp
  const hrScore  = Math.min(35, Math.sqrt(hrPerEmp / Math.max(1, hrBench)) * 25);

  // 2. Financial health — are we profitable?
  const margin   = G.revenue > 0 ? G.profit / G.revenue : -1;
  const finScore = Math.max(-15, Math.min(15, margin * 25));

  // 3. Workload — understaffing demoralises employees
  const minEmp       = calcMinEmployees();
  const staffRatio   = G.employees / Math.max(1, minEmp);
  const overloadPenalty = staffRatio < 1.0 ? Math.min(25, (1 - staffRatio) * 35) : 0;

  // 4. Growth trend — people like working at a growing company
  const growthBonus = G.history.length >= 4 &&
    G.history[G.history.length-1].rev > G.history[G.history.length-4].rev ? 8 : 0;

  return Math.max(0, Math.min(100, 30 + hrScore + finScore - overloadPenalty + growthBonus));
}

// ── Quarterly attrition count ──
// 이직률 3축: 사기(morale) + HR 직접 효과 + 인력과부하
function calcQuarterlyAttrition() {
  const baseRate   = 0.015;                              // 기본 1.5%/분기
  const moraleAdj  = (50 - G.morale) / 100 * 0.025;    // 사기 ±2.5%p
  const hrIdx      = getHrIndex(decisionState.hr, G.employees, G.year);
  const hrAdj      = getHrEffects(hrIdx).attrAdj;       // HR 직접 효과
  // 임금 수준 이직률 효과: 시장 대비 임금이 낮으면 인재 유출 가속
  const compWage   = getCompanyWageMult(G, true);
  const wageAdj    = compWage < 0.80 ?  0.018   // 심각한 저임금: +1.8%p
                   : compWage < 0.90 ?  0.008   // 저임금: +0.8%p
                   : compWage < 1.00 ?  0.003   // 약간 낮음: +0.3%p
                   : compWage > 1.25 ? -0.010   // 고임금: -1.0%p
                   : compWage > 1.10 ? -0.005   // 약간 높음: -0.5%p
                   : 0;
  const rate       = Math.max(0.002, Math.min(0.12, baseRate + moraleAdj + hrAdj + wageAdj));
  const raw        = G.employees * rate;
  const whole      = Math.floor(raw);
  return whole + (Math.random() < (raw - whole) ? 1 : 0);
}

// Porter-based competitive score
// compScore = 시장에서 얼마나 많은 고객을 끌어들이는지 (→ 시장점유율 비례)
// 가격 탄력성: wp 지수를 높여 고가정책 → 점유율 급감, 저가정책 → 점유율 급증 반영
// 실제 B2B SaaS 탄력성 ≈ −1.2 ~ −1.8 에 근사
function compScore(c) {
  const q = Math.max(1, c.quality);
  const b = Math.max(1, c.brand);
  const t = Math.max(1, c.tech);
  const e = Math.max(1, c.employees);
  const p = c.priceIndex !== undefined ? c.priceIndex : 1.0;

  // ── 스탯 정규화: 기준값 50 대비 비율로 환산 후 지수 적용 ──
  // 기존 q^0.42: 품질46 vs 60 → 9% 차이 (너무 작음)
  // 개선 (q/50)^1.5:
  //   q=24 → 0.48^1.5 = 0.333  (-67% 패널티)
  //   q=46 → 0.92^1.5 = 0.882  (-12% 패널티)
  //   q=60 → 1.20^1.5 = 1.315  (+32% 보너스)
  //   q=100 → 2.00^1.5 = 2.828 (+183% 보너스)
  //   q=150 → 3.00^1.5 = 5.196 (+420% 보너스)
  // → 품질 46 vs 60 점수 비율: 1.315/0.882 = 1.491 (49% 우위, 이전 9% → 현실적)
  const qS = Math.pow(q / 50, 1.5);  // 품질: 강한 비선형 보상
  const bS = Math.pow(b / 50, 1.2);  // 브랜드: 중간 곡선
  const tS = Math.pow(t / 50, 1.0);  // 기술: 선형 (과도한 집중 방지)
  // 직원: 로그 정규화 (50명 = 기준 1.0, 규모 수익 체감)
  const eS = Math.pow(Math.log(e + 1) / Math.log(51), 0.3);

  // ── 전략별 가중치 ──
  // 전략명 통일: player는 strategy, 경쟁사는 style/personality 혼재
  const strat = c.strategy || c.style || c.personality || 'differentiation';

  let wq=0.65, wb=0.45, wt=0.30, we=0.12, wp=1.50; // 기본: 차별화
  if (strat === 'cost_leadership' || strat === 'value') {
    // 원가우위: 가격 민감도 최고, 품질·기술 덜 중요, 직원 규모 중요
    wq=0.40; wb=0.28; wt=0.20; we=0.18; wp=2.00;
  } else if (strat === 'focus' || strat === 'niche') {
    // 집중화: 전문성(기술+품질) 극대화, 가격 탄력성 최소
    wq=0.75; wt=0.55; wb=0.22; we=0.10; wp=0.30;
  } else if (strat === 'quality') {
    // 품질 우선: 품질 가중치 극대화, 가격도 어느 정도 부담
    wq=0.80; wb=0.40; wt=0.35; we=0.10; wp=1.70;
  } else if (strat === 'aggressive') {
    // 공격적 성장: 브랜드·가격으로 점유율 공격, 기술 약함
    wq=0.55; wb=0.50; wt=0.25; we=0.20; wp=1.80;
  }
  // differentiation: 기본값 사용

  return Math.pow(qS,wq) * Math.pow(bS,wb) * Math.pow(tS,wt) * Math.pow(eS,we) * Math.pow(1/p, wp);
}

// ── 가격 레이블 헬퍼 ──
function priceLabel(p) {
  if (p <= 0.75) return { text:'초저가',  color:'#06b6d4' };
  if (p <= 0.90) return { text:'할인가',  color:'#10b981' };
  if (p <= 1.10) return { text:'시장가',  color:'var(--muted)' };
  if (p <= 1.30) return { text:'프리미엄', color:'#f59e0b' };
  return                 { text:'초고가',  color:'#ef4444' };
}

// ── 전략·스타일별 기본 가격 포지셔닝 ──
function defaultPriceIndex(style) {
  return {
    aggressive:      0.85,  // 공격적 점유율 → 할인가
    quality:         1.25,  // 품질 우선 → 프리미엄
    value:           0.75,  // 원가우위 → 초저가
    cost_leadership: 0.78,
    focus:           1.30,  // 니치 전문 → 초고가
    niche:           1.28,
    differentiation: 1.05,
  }[style] || 1.0;
}

function getIncumbentScore() {
  // As each tech era arrives, incumbents who couldn't adapt lose relevance
  // This is Clayton Christensen's Disruptive Innovation theory in practice
  const eraIdx = getEraIndex();
  const mult   = (G.eraMults || [8000,3000,1200,400,80])[Math.min(eraIdx, 4)];
  return G.incumbentBaseScore * mult / (G.eraMults || [8000])[0];
}

function calcAllMarketShares() {
  const playerScore    = compScore({ ...G, priceIndex: decisionState.price, strategy: decisionState.strategy });
  const compScores     = G.competitors.map(c => c.alive ? compScore(c) : 0);
  const incumbentScore = getIncumbentScore();
  const total = playerScore + compScores.reduce((s,x)=>s+x, 0) + incumbentScore;
  if (total <= 0) return;
  G.marketShare = playerScore / total;
  G.competitors.forEach((c,i) => { if (c.alive) c.marketShare = compScores[i] / total; });
}

// ── Tech debt: quarterly stat degradation when revolution/shift events were underfunded ──
// Called each turn BEFORE market share calculation so degraded stats affect compScore.
// baseFrac = fraction of quarterly revenue that was "missed" at the original event.
// Penalty grows ~12% per quarter (compounding urgency).
function processTechDebt() {
  if (!G.techDebt || !G.techDebt.length) return;
  let activeCount = 0;
  let totalSeverity = 0;

  G.techDebt.forEach(debt => {
    if (debt.resolved) return;
    debt.quartDebt++;
    activeCount++;

    // Severity = missed fraction × compounding growth factor
    const severity = debt.baseFrac * (1 + debt.quartDebt * 0.12);
    totalSeverity += severity;

    // Persistent quality / tech / brand decay — serious but capped so game stays playable
    const qLoss = Math.min(severity * 4,  12);  // max −12 quality/quarter
    const tLoss = Math.min(severity * 3.5, 10); // max −10 tech/quarter
    const bLoss = Math.min(severity * 2,   7);  // max −7  brand/quarter

    G.quality = Math.max(1, G.quality - qLoss);
    G.tech    = Math.max(1, G.tech    - tLoss);
    G.brand   = Math.max(1, G.brand   - bLoss);
  });

  if (activeCount > 0) {
    if (totalSeverity > 1.0) {
      pushNews(`🕰️ 기술 부채 ${activeCount}건 진행 중 (심각): 품질·기술·브랜드 급격히 하락 중`, 'bad');
    } else if (totalSeverity > 0.3) {
      pushNews(`⚠️ 기술 부채 ${activeCount}건: 품질·기술·브랜드 계속 저하 중`, 'warn');
    }
  }
}

// ── 투자 효율 이익률 프리미엄 계산 ───────────────────────────────────────────
// R&D·마케팅·HR 예산 집중 투자 → 운영 효율화·가격경쟁력 향상 → 이익률 개선
//
// 실제 사례:
//   Apple·Adobe: R&D+브랜드 투자로 프리미엄 가격 유지 → 35~40% 순이익률
//   저투자 기업: 비용은 낮지만 가격경쟁력 약화 → 15~20% 이익률에 수렴
//
// 반환값:
//   premium  — 매출 대비 이익률 직접 보너스 (최대 +5%p)
//   capMult  — 이익률 상한 배율 조정 (저투자 ×0.80 ~ 고투자 ×1.55)
//
// 수익 체감(sqrt 곡선) 적용: 처음엔 투자 효과가 빠르게 오르다가 포화됨
function calcInvestPremium(totalInvest, revenue) {
  if (!revenue || revenue <= 0) return { premium: 0, capMult: 0.80 };
  const investRatio = Math.max(0, totalInvest) / revenue;

  // 이익률 프리미엄: 투자 비율 5% 미만은 보너스 없음, 이후 점진적 상승 (상한 +5%p)
  // investRatio 10%→+1.8%, 25%→+3.6%, 50%→+5% (상한)
  const premium = Math.min(0.05, Math.sqrt(Math.max(0, investRatio - 0.05)) * 0.08);

  // 이익률 상한 배율: 저투자 ×0.80(이 시대 elite의 80%가 한계), 고투자 ×1.55
  // investRatio 0%→×0.80, 10%→×1.05, 25%→×1.20, 50%→×1.37, 100%+→×1.55
  const capMult = Math.min(1.55, 0.80 + Math.sqrt(investRatio) * 0.80);

  return { premium, capMult };
}

// overrideRev: 예상 계산 시 실제 G.revenue 대신 사용할 매출 (renderCostPreview에서 전달)
// null이면 G.revenue(현재 분기 매출) 사용 — processTurn 내부 호출용
function calcPlayerCosts(overrideRev = null) {
  const baseSal    = getSalary(G.year) / 4;
  // 기업 임금 배율: 전략·규모·재무·기술 집약도에 따른 시장 평균 대비 임금 수준
  const compWage   = getCompanyWageMult(G, true);
  // HR 임금 할증: 인재개발 투자 → 우수 인재 유치 → 기업 기준 임금에 추가 가산
  const hrIdx      = getHrIndex(decisionState.hr, G.employees, G.year);
  const wagePrem   = getHrEffects(hrIdx).wagePremium;
  const salPerEmp  = baseSal * compWage * (1 + wagePrem);
  const sal        = G.employees * salPerEmp;
  const talentCost = G.employees * baseSal * (compWage - 1.0 + wagePrem); // 프리미엄분 (표시용)

  const rd   = decisionState.rd;
  const mkt  = decisionState.mkt;
  const hr   = decisionState.hr;
  const hire = Math.max(0, decisionState.hire) * salPerEmp * 0.3; // 채용비도 할증 임금 반영
  const opsPerEmp = G.employees < 50  ? 1200 :
                    G.employees < 200  ? 900  :
                    G.employees < 1000 ? 650  : 450;
  const ops  = G.employees * opsPerEmp + 8000;
  const loan = (G.loans || []).reduce((s, l) => s + l.qPay, 0);

  // COGS (매출원가): 시대별 실제 기업 데이터 DB 기반 산출
  // ERA_FINANCIALS.cogsPct = 해당 시대 업계 평균 총이익률에서 역산한 COGS 비율
  // overrideRev 사용: 예상 계산 시 예상 매출 기준으로 COGS를 맞춤 (G.revenue는 이전 분기 값)
  const rev      = overrideRev !== null ? overrideRev : (G.revenue || 0);
  const eraFin   = getEraFinancials();
  const baseCogs = eraFin ? eraFin.cogsPct : 0.22;
  // 전략 조정: 원가우위 → 인프라 효율화로 COGS↓, 차별화/집중 → 품질 인프라로 COGS↑
  const stratAdj = decisionState.strategy === 'cost_leadership' ? -0.04
                 : decisionState.strategy === 'focus'           ?  0.02
                 :                                                  0.00;
  // 기술력 조정: tech 높을수록 자동화·효율화로 COGS 소폭↓ (최대 -3%)
  const techAdj  = -Math.min(0.03, Math.max(0, (G.tech || 0) - 60) / 2000);
  const cogsRate = Math.max(0.10, Math.min(0.45, baseCogs + stratAdj + techAdj));
  const cogs     = Math.round(rev * cogsRate);

  return { sal, talentCost, wagePrem, rd, mkt, hr, hire, ops, loan, cogs,
           total: sal+rd+mkt+hr+hire+ops+loan+cogs };
}

// ═══════════════════════════════════════════════════════
// 4. TURN ENGINE
// ═══════════════════════════════════════════════════════

function processTurn() {
  const ds = decisionState;

  // 0. 시대 전환 체크 → 새 경쟁사 진입
  checkEraEntrants();
  // 0b. 기업 생애주기 체크 → 쇠퇴·퇴장·컴백 (COMPANY_LIFECYCLE_DB 기반)
  checkCompanyLifecycle();

  // 0. Morale update (inertia: 70% old + 30% target)
  const targetMorale = calcTargetMorale();
  G.morale = Math.round(G.morale * 0.7 + targetMorale * 0.3);

  // 0a. Natural attrition BEFORE hiring this quarter
  const attrition = calcQuarterlyAttrition();
  G.employees      = Math.max(1, G.employees - attrition);
  G.lastAttrition  = attrition;
  if (attrition >= 3) pushNews(`😤 직원 이탈: ${attrition}명 퇴사 (사기 ${G.morale}/100)`, attrition >= 8 ? 'bad' : 'warn');

  // 1. Apply hiring
  const hired = Math.max(-Math.floor(G.employees*0.3), ds.hire);
  G.employees  = Math.max(1, G.employees + hired);

  // 2. Apply investments → update company attributes
  // ── 투자 효과 공식 ──────────────────────────────────────────────────────
  // 현상 유지 투자 = rdBase × 50%. 그 이하 → 스탯 급락, 그 이상 → 성장.
  // 공식: eff = (sqrt(spend/base) - sqrt(0.5)) × scale
  //   spend=0:    -0.707 × scale (급락)
  //   spend=50%:  0              (현상 유지)
  //   spend=100%: +0.293 × scale (성장)
  //   spend=200%: +0.707 × scale (빠른 성장)
  const salQ    = getSalary(G.year) / 4;
  const empRoot = Math.sqrt(Math.max(1, G.employees));

  // ── 패러다임 전환기 기준치 상향 ──────────────────────────────────────────────
  // 새 시대 진입 후 8분기 동안 rd/mkt 기준이 1.5배 → 이전 투자 규모로는 "부족" 판정
  // 실제로 패러다임이 바뀌면 완전히 새로운 기술 스택에 재투자해야 하는 압박을 반영
  if (G.eraTransitionQ === undefined) G.eraTransitionQ = 0;
  const eraTransMult = G.eraTransitionQ > 0 ? 1.5 : 1.0;
  if (G.eraTransitionQ > 0) G.eraTransitionQ--;

  const rdBase  = Math.max(15000, salQ * 0.4 * empRoot) * eraTransMult;
  const mktBase = Math.max(8000,  salQ * 0.25 * empRoot) * eraTransMult;
  const hrBase  = Math.max(5000,  salQ * 0.15 * empRoot);

  const MAINT     = Math.sqrt(0.5); // 50% 투자 = 유지점 (≈0.707)

  // ── 투자 부족 패널티 증폭 ────────────────────────────────────────────────────
  // 기준의 30% 미만: 하락 2.5배 / 50% 미만: 1.5배
  // 단기 이익 극대화(투자 아낌) → 장기 stats 급락 트레이드오프 강화
  const rdRatio  = Math.max(0, ds.rd)  / rdBase;
  const mktRatio = Math.max(0, ds.mkt) / mktBase;
  const hrRatio  = Math.max(0, ds.hr)  / hrBase;

  const rdDecayBoost  = rdRatio  < 0.30 ? 2.5 : rdRatio  < 0.50 ? 1.5 : 1.0;
  const mktDecayBoost = mktRatio < 0.30 ? 2.0 : mktRatio < 0.50 ? 1.4 : 1.0;

  const rdRaw  = (Math.sqrt(rdRatio)  - MAINT) * 1.8;
  const mktRaw = (Math.sqrt(mktRatio) - MAINT) * 1.2;
  const hrRaw  = (Math.sqrt(hrRatio)  - MAINT) * 0.7;

  const rdEff  = rdRaw  < 0 ? rdRaw  * rdDecayBoost  : rdRaw;
  const mktEff = mktRaw < 0 ? mktRaw * mktDecayBoost : mktRaw;
  const hrEff  = hrRaw;

  // Strategy multipliers
  const stratMult = { differentiation: { rd:1.3, mkt:1.0, hr:1.0 },
                      cost_leadership:  { rd:0.8, mkt:1.0, hr:1.1 },
                      focus:            { rd:1.4, mkt:0.7, hr:1.1 } }[ds.strategy];

  // 성장: statDamper 적용 (고스탯 구간 체감 감소)
  // 하락: 전속력 (statDamper 없음 — 고스탯 회사도 방치 시 급락)
  const applyEff = (stat, eff, mult) => {
    if (eff >= 0) return Math.min(200, stat + eff * mult * statDamper(stat));
    return Math.max(0, stat + eff * mult); // 하락 시 damper 미적용
  };

  G.quality = applyEff(G.quality, rdEff,  stratMult.rd);
  G.tech    = applyEff(G.tech,    rdEff * 0.7 + hrEff * stratMult.hr, 1.0);
  G.brand   = applyEff(G.brand,   mktEff, 1.0);
  if (G.brand < 0) G.brand = 0;

  G.strategy = ds.strategy;

  // 2b. Tech debt penalties — persistent quarterly degradation from missed revolution/shift events
  processTechDebt();

  // Price index (cost leadership → lower price)
  let priceIdx = ds.price;
  if (ds.strategy === 'cost_leadership') priceIdx *= 0.9;
  if (ds.strategy === 'differentiation') priceIdx = Math.max(priceIdx, 1.0);

  // 3. Recalculate market shares
  calcAllMarketShares();

  // 4. Calculate revenue
  // priceIdx > 1 = premium pricing: fewer customers but more revenue per customer
  // priceIdx < 1 = discount pricing: more customers captured, less revenue per customer
  const mktSize   = getMarketSize(G.year, G.quarter);
  const prevRev   = G.revenue;
  G.revenue       = mktSize * G.marketShare * priceIdx * G.eventProdBonus;

  // 5. Calculate costs & profit
  const costs    = calcPlayerCosts();
  G.profit       = G.revenue - costs.total;

  // 5b. 투자 효율 이익률 프리미엄 + 이익률 상한 (투자 강도 연동)
  if (G.revenue > 0) {
    const totalInvest = Math.max(0, costs.rd) + Math.max(0, costs.mkt) + Math.max(0, costs.hr);
    const { premium, capMult } = calcInvestPremium(totalInvest, G.revenue);

    // ① 투자 프리미엄: 운영 효율화·가격경쟁력 향상으로 직접 이익 개선
    G.profit += Math.round(G.revenue * premium);

    // ② 이익률 상한: 저투자 기업은 elite 80%까지, 고투자 기업은 155%까지 달성 가능
    const _eraFin    = getEraFinancials();
    const _maxMargin = _eraFin ? Math.min(0.70, _eraFin.opMgElite * capMult) : (0.35 + premium);
    const _profitCap = Math.round(G.revenue * _maxMargin);
    if (G.profit > _profitCap) G.profit = _profitCap;
  }

  G.cash        += G.profit;

  // Update peaks
  G.totalRevenue    += G.revenue;
  G.peakRevenue      = Math.max(G.peakRevenue,   G.revenue);
  // 경쟁사 간 상대 점유율 기준으로 피크 추적
  const _peakNamedTotal = G.marketShare +
    G.competitors.reduce((s, c) => s + (c.alive ? (c.marketShare || 0) : 0), 0);
  const _peakRelShare = _peakNamedTotal > 0 ? G.marketShare / _peakNamedTotal : 0;
  G.peakMarketShare  = Math.max(G.peakMarketShare, _peakRelShare);
  G.peakCash         = Math.max(G.peakCash,        G.cash);

  // 5a. Understaffing check — revenue takes direct hit proportional to shortage
  const minEmp = calcMinEmployees();
  if (G.employees < minEmp) {
    const staffRatio = G.employees / minEmp;  // 0.0 ~ 1.0
    const deficit    = 1 - staffRatio;

    // Revenue penalty: linear with staffing ratio
    // e.g. 8명/19명 = 42% → 매출 42%로 직접 감소
    const revLost = Math.round(G.revenue * deficit);
    G.revenue  = Math.max(0, G.revenue - revLost);
    G.profit   = G.revenue - costs.total;
    G.cash    -= revLost; // undo excess cash already added

    // Quality & tech decay (more severe when severely understaffed)
    G.quality = Math.max(1, G.quality - deficit * 5);
    G.tech    = Math.max(1, G.tech    - deficit * 3);

    if (deficit > 0.4)
      pushNews(`🚨 극심한 인력 부족 (${G.employees}/${minEmp}명): 매출 ${Math.round(deficit*100)}% 손실 · 품질 급락`, 'bad');
    else if (deficit > 0.2)
      pushNews(`⚠️ 심각한 인력 부족 (${G.employees}/${minEmp}명): 매출 ${Math.round(deficit*100)}% 손실`, 'bad');
    else
      pushNews(`⚠️ 인력 부족 (${G.employees}/${minEmp}명): 매출 ${Math.round(deficit*100)}% 손실`, 'warn');
  }

  // 6. Product life cycle
  G.productStageQ++;
  updateProductStage(mktSize);

  // 7a. Tick down loans
  if (G.loans && G.loans.length) {
    G.loans = G.loans.map(l => ({ ...l, quartersLeft: l.quartersLeft - 1 })).filter(l => l.quartersLeft > 0);
    if (G.loans.length === 0) pushNews('✅ 대출 전액 상환 완료!', 'good');
  }

  // 7. Event boost countdown
  if (G.eventBoostQ > 0) {
    G.eventBoostQ--;
    if (G.eventBoostQ === 0) { G.eventMarketMult = 1.0; G.eventProdBonus = 1.0; }
  }

  // 8. Process competitors
  processCompetitors();

  // 9. Build news
  const news = buildNews(prevRev, costs);

  // 10. Record history — 상대 점유율 (경쟁사 간 합계 100%) 도 함께 저장
  const _namedTotal = G.marketShare +
    G.competitors.reduce((s, c) => s + (c.alive ? (c.marketShare || 0) : 0), 0);
  const _relShare = _namedTotal > 0 ? G.marketShare / _namedTotal : 0;
  G.history.push({
    yr: G.year, q: G.quarter,
    rev: G.revenue, profit: G.profit, cash: G.cash,
    share: G.marketShare, relShare: _relShare, emp: G.employees,
    quality: G.quality, brand: G.brand, tech: G.tech,
    morale: G.morale, attrition: G.lastAttrition,
    compShares:    G.competitors.map(c => c.alive ? c.marketShare : 0),
    compRelShares: G.competitors.map(c =>
      c.alive && _namedTotal > 0 ? c.marketShare / _namedTotal : 0),
    compRevenues: G.competitors.map(c => c.revenue  || 0),
    compProfits:  G.competitors.map(c => c.profit   || 0),
  });

  // 11. Check game conditions
  if (G.cash < 0) {
    G.consecLoss++;
    if (G.consecLoss >= 3) { G.gameOver = true; G.win = false; }
  } else {
    G.consecLoss = 0;
  }
  if (G.year >= 2050 && G.quarter >= 4) { G.gameOver = true; G.win = true; }

  // 12. Advance time
  const prevQ = G.quarter, prevY = G.year;
  G.quarter++;
  if (G.quarter > 4) { G.quarter = 1; G.year++; }

  return { news, prevQ, prevY, costs, prevRev };
}

function updateProductStage(mktSize) {
  const stages     = ['intro', 'growth', 'maturity', 'decline'];
  const stageLimits = [6, 20, 32, 999]; // quarters per stage
  const idx = stages.indexOf(G.productStage);
  if (idx < 0 || G.productStageQ >= stageLimits[idx]) {
    if (idx < stages.length - 1) {
      G.productStage  = stages[idx + 1];
      G.productStageQ = 0;
      const msgs = ['', '', '🐄 제품이 성숙기에 진입했습니다. 새 제품 개발을 고려하세요.',
                    '📉 제품이 쇠퇴기에 접어들었습니다. R&D로 혁신이 필요합니다.'];
      if (msgs[idx+1]) pushNews(msgs[idx+1], 'warn');
    }
  }
  // In decline: quality naturally erodes without heavy R&D
  if (G.productStage === 'decline') {
    G.quality  = Math.max(5, G.quality  - 0.5);
    G.tech     = Math.max(5, G.tech     - 0.3);
  }
}

function buildNews(prevRev, costs) {
  const lines = [];
  // 경쟁사 간 상대 점유율 delta 기준
  const _namedNow = G.marketShare +
    G.competitors.reduce((s,c) => s+(c.alive?(c.marketShare||0):0), 0);
  const _relNow = _namedNow > 0 ? G.marketShare / _namedNow : 0;
  const _prevRelShare = G.history.length > 1 ? (G.history[G.history.length-2].relShare ?? 0) : 0;
  const shareDelta = _relNow - _prevRelShare;

  if (G.profit > 0)  lines.push({ t:'📈 흑자 달성', msg:`이번 분기 +${fmt(G.profit)} 순이익`, type:'good' });
  else               lines.push({ t:'📉 적자 발생', msg:`이번 분기 ${fmt(G.profit)} 손실`, type:'bad' });

  if (shareDelta > 0.001)  lines.push({ t:'🏆 점유율 상승', msg:`시장점유율 +${(shareDelta*100).toFixed(3)}%p 증가`, type:'good' });
  if (shareDelta < -0.001) lines.push({ t:'⚠️ 점유율 하락', msg:`시장점유율 ${(shareDelta*100).toFixed(3)}%p 감소`, type:'bad' });

  const dead = G.competitors.filter(c => !c.alive && c._justDied);
  dead.forEach(c => { c._justDied = false; lines.push({ t:`💀 ${c.name} 파산`, msg:'경쟁사가 파산했습니다. 시장 재편 기회!', type:'info' }); });

  return lines;
}

function pushNews(msg, type='info') {
  G.newsLog.unshift({ msg, type, yr: G.year, q: G.quarter });
  if (G.newsLog.length > 30) G.newsLog.pop();
}

// ═══════════════════════════════════════════════════════
// 5. COMPETITOR AI
// ═══════════════════════════════════════════════════════

// 시대 전환 감지 → 해당 시대의 실제 기업 자동 진입
// ── 패러다임 전환 시 스탯 리셋 ──────────────────────────────────────────
// 새로운 시대에서는 이전 시대 기술/품질의 상당 부분이 무효화됨.
// (예: 메인프레임 전문성 → PC 시대엔 거의 무가치)
// 적응도(현재 tech vs 새 시대 요구치)가 높을수록 이월 비율 높음.
function processParadigmReset(newEraIdx) {
  const era        = getCurrentEra();
  const newReq     = newEraIdx * 22; // 새 시대 tech 요구치
  const narr       = ERA_NARRATIVES[newEraIdx] || null;

  // ── 플레이어·경쟁사 적응도 계산 ──────────────────────────────────────────
  const calcAdapt = (entity) => {
    const tech  = entity.tech || 1;
    return Math.min(1.5, tech / Math.max(1, newReq));
  };

  const applyReset = (entity, isPlayer) => {
    const adapt    = calcAdapt(entity);
    // 이월 비율: 미적응 15~25%, 충분 적응 45~65%
    const techKo   = Math.max(0.15, Math.min(0.65, 0.20 + adapt * 0.30));
    const qualKo   = Math.max(0.20, Math.min(0.55, 0.25 + adapt * 0.20));
    const brandKo  = 0.75; // 브랜드 인지도는 시대 전환에도 어느 정도 유지

    const prevTech  = Math.round(entity.tech);
    const prevQual  = Math.round(entity.quality);
    entity.tech     = Math.max(3, Math.round(entity.tech    * techKo));
    entity.quality  = Math.max(2, Math.round(entity.quality * qualKo));
    entity.brand    = Math.max(2, Math.round(entity.brand   * brandKo));

    if (isPlayer) {
      const adaptPct = Math.round(adapt / 1.5 * 100);
      pushNews(
        `🌐 ${era.name} 패러다임 전환! 기술 ${prevTech}→${entity.tech} / 품질 ${prevQual}→${entity.quality} ` +
        `(적응도 ${adaptPct}% — ${adaptPct >= 80 ? '선도 전환 성공' : adaptPct >= 50 ? '부분 전환' : '⚠ 미적응 — 재투자 시급'})`,
        adaptPct >= 80 ? 'good' : adaptPct >= 50 ? 'warn' : 'bad'
      );
      // 전환 후 8분기 재투자 압박 활성화 (기준치 1.5배)
      G.eraTransitionQ = 8;
      pushNews(
        `🔄 새 패러다임 전환기 돌입 — 향후 8분기 R&D·마케팅 기준치 ×1.5 (이전 규모 투자는 부족 판정)`,
        'warn'
      );
    }
  };

  // 플레이어 리셋
  applyReset(G, true);

  // ── 경쟁사 리셋 + 적응도 분류 ──────────────────────────────────────────
  const survivors = [], struggling = [];
  G.competitors.forEach(c => {
    if (!c.alive) return;
    const adapt = calcAdapt(c);
    applyReset(c, false);
    if (adapt >= 0.75)      survivors.push(c.name);
    else if (adapt >= 0.40) struggling.push(c.name);
    // adapt < 0.40 → 심각 위기 (뉴스 별도 출력)
  });

  // ── 역사적 서사 뉴스 ────────────────────────────────────────────────────
  if (narr) {
    // 1. 시대 전환 역사적 배경
    narr.context.forEach(line => pushNews(line, 'info'));

    // 2. 생존 경쟁사 서사
    if (survivors.length > 0 && narr.survivorContext) {
      pushNews(
        `✅ 생존 기업 (${survivors.join(', ')}): ${narr.survivorContext}`,
        'good'
      );
    }

    // 3. 개별 기업별 패배 이유 (COMPANY_LIFECYCLE_DB의 퇴장 이벤트와 별도 — 시대 전환 맥락 서사)
    if (narr.casualties) {
      const aliveNames = G.competitors.filter(c => c.alive).map(c => c.name);
      narr.casualties.forEach(cas => {
        const matched = aliveNames.filter(n => cas.match.test(n));
        if (matched.length > 0) {
          pushNews(
            `⚠️ 위기 경고 — ${matched.join('·')}: ${cas.reason}`,
            'bad'
          );
        }
      });
    }
  }
}

function checkEraEntrants() {
  const currentEraIdx = getEraIndex();
  const prevEraIdx    = G.lastEraIdx !== undefined ? G.lastEraIdx : currentEraIdx;
  if (currentEraIdx === prevEraIdx) return; // 시대 변화 없음

  // ── 패러다임 전환 스탯 리셋 (새로운 시대 진입 시) ──
  processParadigmReset(currentEraIdx);

  const era = getCurrentEra();
  const groups = ERA_ENTRANTS.filter(e => e.eraIdx === currentEraIdx);
  const cashMult = { easy:1.8, normal:1.0, hard:0.55 }[G.difficulty] || 1.0;
  const newNames = [];

  groups.forEach(group => {
    group.competitors.forEach(t => {
      if (G.competitors.some(c => c.name === t.name)) return; // 이미 존재하면 스킵
      const s = t._s;
      G.competitors.push({
        name: t.name, icon: t.icon, color: t.color,
        style: t.style, desc: t.desc, w: { ...t.w },
        eraLimit:   t.eraLimit !== undefined ? t.eraLimit : 4,
        cash:       Math.round(s.cash * (s.giant ? 1.0 : cashMult)),
        employees:  s.emp,
        quality:    s.q,
        brand:      s.b,
        tech:       s.t,
        priceIndex: t.priceIndex || defaultPriceIndex(t.style),
        marketShare:0, revenue:0, profit:0,
        alive: true, consecLoss: 0,
        ipo: s.giant, ipoYear: s.giant ? G.year : null,
        _hist: t._hist || null, // 실제 기업 재무 데이터 참조
        _profitableQ: 0,
      });
      newNames.push({ name: t.name, msg: t.entryMsg || t.desc });
    });
  });

  if (newNames.length > 0) {
    // ── 새 시대 진입 서사 ───────────────────────────────────────────────
    const narr = ERA_NARRATIVES[currentEraIdx] || null;
    pushNews(`⚡ ${era.name} 개막! 새로운 강자들이 시장에 진입합니다.`, 'warn');

    // 시대 전환으로 재편된 경쟁 구도 — 역사적 배경 서사
    if (narr && narr.entrantContext) {
      pushNews(narr.entrantContext, 'info');
    }

    // 새 진입 기업 개별 뉴스
    newNames.forEach(n => pushNews(`📢 ${n.name} 등장: ${n.msg}`, 'info'));
  }

  G.lastEraIdx = currentEraIdx;
}

// ── 기업 생애주기 처리 — COMPANY_LIFECYCLE_DB 기반 ───────────────────────────
// 매 분기 processTurn()에서 호출. DB만 수정하면 모든 기업 이벤트 자동 반영.
function checkCompanyLifecycle() {
  G.competitors.forEach(c => {
    const lc = COMPANY_LIFECYCLE_DB[c.name];
    if (!lc) return;

    const yr = G.year, q = G.quarter;
    const afterOrAt = (ly, lq) =>
      yr > ly || (yr === ly && q >= (lq || 1));

    // ── 1. 강제 퇴장 (인수·파산·소멸) ──────────────────────────────────────
    if (lc.retireYear && !c._retired && c.alive && afterOrAt(lc.retireYear, lc.retireQ)) {
      c._retired    = true;
      c.alive       = false;
      c.marketShare = 0;
      const icon = lc.retireType === 'acquired' ? '💼'
                 : lc.retireType === 'bankrupt'  ? '💥'
                 : lc.retireType === 'merged'     ? '🤝'
                 :                                  '📭';
      pushNews(`${icon} ${c.name} 퇴장: ${lc.retireFate}`, 'info');
    }

    // ── 2. 쇠퇴 시작 ─────────────────────────────────────────────────────────
    if (lc.declineYear && !c._declining && !c._retired && c.alive &&
        afterOrAt(lc.declineYear, lc.declineQ)) {
      c._declining = true;
      // eraLimit을 현재 시대로 고정 → processCompetitors의 eraLimit 패널티 즉시 발동
      c.eraLimit = getEraIndex();
      pushNews(lc.declineMsg, 'warn');
    }

    // ── 3. 반등·컴백 ─────────────────────────────────────────────────────────
    if (lc.comebackYear && c._declining && !c._comeback && !c._retired && c.alive &&
        afterOrAt(lc.comebackYear, lc.comebackQ)) {
      c._comeback  = true;
      c._declining = false;
      // eraLimit 연장 (미지정 시 4 = AGI 시대까지 생존)
      c.eraLimit = lc.comebackEraLimit !== undefined ? lc.comebackEraLimit : 4;
      // 스탯 회복 보너스
      if (lc.comebackStats) {
        if (lc.comebackStats.q) c.quality = Math.min(200, c.quality + lc.comebackStats.q);
        if (lc.comebackStats.b) c.brand   = Math.min(200, c.brand   + lc.comebackStats.b);
        if (lc.comebackStats.t) c.tech    = Math.min(200, c.tech    + lc.comebackStats.t);
      }
      // 현금 수혈 (반등 투자 = 기존 현금의 50% 추가)
      c.cash = Math.max(c.cash, c.cash + Math.abs(c.cash) * 0.5);
      pushNews(lc.comebackMsg, 'info');
    }
  });
}

function processCompetitors() {
  const eraIdx = getEraIndex();
  // Did the player gain share this turn? → competitors feel the threat
  const prevShare = G.history.length > 1 ? G.history[G.history.length - 2].share : 0;
  const playerGrew = G.marketShare > prevShare + 0.0005;

  G.competitors.forEach(c => {
    if (!c.alive) return;

    // ── 1. Budget: cash-aware, keeps 2-quarter salary buffer ──
    const salaryBuffer = getSalary(G.year) * c.employees * 0.5; // half-year buffer
    // Scale efficiency: larger companies get more leverage per dollar, so discretionary
    // spend as a % of revenue is lower → bigger companies keep more profit (economies of scale)
    const revScaleFactor = Math.min(1.0, 300000 / Math.max(1, c.revenue)); // 1.0 for tiny, ~0.13 for $2M+
    const revenueInvestRate = 0.15 + 0.20 * revScaleFactor; // 35% for small → ~17% for large
    const investable   = Math.max(0, c.cash - salaryBuffer) * 0.25 + c.revenue * revenueInvestRate;

    // Competitive response: threatened companies boost spending
    const threatBoost  = (playerGrew && c.marketShare > 0.0005) ? 1 + Math.random() * 0.35 : 1.0;

    // Era disruption: tech-lagging companies panic-invest in R&D
    const techRequired = eraIdx * 22;
    const techGap      = Math.max(0, techRequired - c.tech);
    const eraBoost     = techGap > 0 ? 1 + techGap / 100 : 1.0;

    // ── AUSTERITY: companies in distress cut spending sharply ──
    // Ratio: 1.0 = healthy; 0 = exactly at buffer; negative = below buffer
    const cashRatio = c.cash / Math.max(1, salaryBuffer * 2);
    const austerityMult = c.cash < 0         ? 0.08   // deeply in the red: bare minimum
                        : cashRatio < 0.4    ? 0.30   // danger zone: heavy cuts
                        : cashRatio < 0.8    ? 0.60   // cautious: moderate cuts
                        : 1.0;

    // 난이도에 따른 경쟁사 예산 배율 (hard: 경쟁사가 더 공격적으로 투자)
    const diffBudget = (G.diffMults && G.diffMults.compBudget) || 1.0;
    // 시대별 경쟁 격화: 패러다임이 바뀔수록 업계 전체가 더 공격적으로 투자
    // Era0: +0%, Era1: +15%, Era2: +30%, Era3: +45%, Era4: +60%
    const eraCompBoost = 1.0 + eraIdx * 0.15;
    const budget = investable * threatBoost * eraBoost * austerityMult * diffBudget * eraCompBoost;

    // ── 2. Adaptive weight adjustment based on weakness ──
    const w = { ...c.w };
    if (c.tech < c.quality * 0.75) { w.rd   = Math.min(0.65, w.rd   + 0.10); w.ops -= 0.05; w.mkt -= 0.05; }
    if (c.brand < 18)               { w.mkt  = Math.min(0.45, w.mkt  + 0.08); w.ops -= 0.04; w.rd  -= 0.04; }
    if (c.cash  < salaryBuffer * 2) { w.ops  = Math.min(0.55, w.ops  + 0.10); w.rd  -= 0.05; w.mkt -= 0.05; }

    const rdSpend  = Math.max(0, budget * w.rd);
    const mktSpend = Math.max(0, budget * w.mkt);
    const hrSpend  = Math.max(0, budget * w.hr);

    // ── 3. Invest → stats update (동일한 50% 유지점 공식 적용) ──
    const cSalQ    = getSalary(G.year) / 4;
    const cEmpRoot = Math.sqrt(Math.max(1, c.employees));
    const cRdBase  = Math.max(12000, cSalQ * 0.4  * cEmpRoot);
    const cMktBase = Math.max(6500,  cSalQ * 0.25 * cEmpRoot);
    const cHrBase  = Math.max(4000,  cSalQ * 0.15 * cEmpRoot);

    const cMAINT   = Math.sqrt(0.5);
    // rd 효과 계수 상향 (1.6 → 2.0): 경쟁사가 투자하면 더 빠르게 stats 오름
    // → 플레이어가 투자 안 하면 상대적 격차가 빠르게 벌어짐
    const cRdEff   = (Math.sqrt(rdSpend  / cRdBase)  - cMAINT) * 2.0;
    const cMktEff  = (Math.sqrt(mktSpend / cMktBase) - cMAINT) * 1.4;
    const cHrStatEff = (Math.sqrt(hrSpend  / cHrBase)  - cMAINT) * 0.6;

    const cApply = (stat, eff) =>
      eff >= 0 ? Math.min(200, stat + eff * statDamper(stat))
               : Math.max(0,   stat + eff); // 하락 시 damper 없음

    c.quality = cApply(c.quality, cRdEff);
    c.brand   = cApply(c.brand,   cMktEff);
    c.tech    = cApply(c.tech,    cRdEff * 0.65 + cHrStatEff * 0.20);
    if (c.brand < 0) c.brand = 0;

    // ── 4. Competitor HR index & morale & attrition ──
    const cHrIdx     = getHrIndex(hrSpend, c.employees, G.year);
    const cHrEff     = getHrEffects(cHrIdx);
    const cMorale    = Math.min(100, Math.max(0,
      40 + Math.sqrt(hrSpend / Math.max(1, c.employees)) * 0.6 + (c.profit > 0 ? 8 : -8)));
    c.morale = cMorale; // 렌더링용 저장
    // 임금 배율: 전략·규모·재무·기술 집약도 반영
    const cCompWage  = getCompanyWageMult(c, false);
    // 이직률: 사기 + HR 직접 효과 + 임금 수준
    const cWageAdj   = cCompWage < 0.80 ?  0.018 : cCompWage < 0.90 ?  0.008
                     : cCompWage < 1.00 ?  0.003 : cCompWage > 1.25 ? -0.010
                     : cCompWage > 1.10 ? -0.005 : 0;
    const cAttrRate  = Math.max(0.002, 0.015 + (50 - cMorale) / 100 * 0.025 + cHrEff.attrAdj + cWageAdj);
    const cAttrRaw   = c.employees * cAttrRate;
    const cAttrition = Math.floor(cAttrRaw) + (Math.random() < (cAttrRaw % 1) ? 1 : 0);
    c.employees = Math.max(1, c.employees - cAttrition);

    // ── 5. Revenue-driven hiring — HR 생산성·채용력 반영 ──
    const cBench     = lerp(REV_PER_EMP_BENCH, G.year);
    // HR 생산성 → 필요 인원 감소
    const minNeeded  = Math.max(2, Math.ceil(c.revenue * 4 / Math.max(1, cBench * cHrEff.prod)));
    const ambition   = c.w.hr + c.w.rd * 0.3;
    const growTarget = Math.round(c.employees * (1 + ambition * 0.15 + Math.random() * 0.08));
    const target     = Math.max(minNeeded, growTarget);
    // HR 채용력 → 분기 최대 채용 증가
    const baseMaxH   = c.cash < 0 ? 0 : Math.max(2, Math.ceil(c.employees * 0.25));
    const maxHire    = Math.round(baseMaxH * cHrEff.recruitMult);
    const maxFire    = c.cash < 0      ? Math.max(2, Math.ceil(c.employees * 0.30))
                     : cashRatio < 0.4 ? Math.max(2, Math.ceil(c.employees * 0.22))
                     :                   Math.max(1, Math.ceil(c.employees * 0.15));
    const rawHire    = Math.min(maxHire, Math.max(-maxFire, target - c.employees));
    // HR 임금 할증 반영한 채용 비용 체크
    const cWageMult  = cCompWage * (1 + cHrEff.wagePremium); // 기업 임금 배율 × HR 프리미엄
    const hireCost   = Math.max(0, rawHire) * getSalary(G.year) / 4 * cWageMult;
    if (hireCost < c.cash * 0.5 || rawHire < 0) {
      c.employees = Math.max(1, c.employees + rawHire);
    }

    // ── 6. Revenue (market share × price: premium pricing = more revenue per customer) ──
    const mktSize = getMarketSize(G.year, G.quarter);
    c.revenue = mktSize * c.marketShare * (c.priceIndex || 1.0);

    // ── 7. Costs — 기업 임금 배율 × HR 할증 + 시대별 COGS 포함 ──
    const sal       = c.employees * getSalary(G.year) / 4 * cWageMult; // cCompWage × (1+hrPrem)
    const opsPerEmp = c.employees < 50 ? 1200 : c.employees < 200 ? 900 : 650;
    const ops       = c.employees * opsPerEmp + 8000;
    // COGS: 시대별 ERA_FINANCIALS 데이터 기반 (플레이어와 동일 기준)
    const cEraFin  = getEraFinancials();
    const cCogsPct = cEraFin ? cEraFin.cogsPct : 0.22;
    const cCogs    = Math.round(c.revenue * cCogsPct);
    c.profit = c.revenue - (sal + rdSpend + mktSpend + hrSpend + ops + cCogs);
    c.cash  += c.profit;

    // ── 8. Era disruption: 기술 뒤처진 회사 가속 붕괴 ──
    // 기준: eraIdx * 22 tech 필요. 못 따라가면 품질·브랜드·점유율 모두 하락.
    // 역사적 사례: Lotus(PC→인터넷), Borland(인터넷), Oracle(모바일), Nokia(스마트폰)
    if (techGap > 10) {
      const lag = techGap / 100; // 0.1 ~ 2.0
      // 스탯 붕괴 (이전보다 2배 강함)
      c.quality = Math.max(1, c.quality - lag * 5.0);
      c.brand   = Math.max(1, c.brand   - lag * 3.0);
      c.tech    = Math.max(1, c.tech    - lag * 1.5);
      // 직접 시장점유율 손실: 기술 뒤처지면 고객이 떠남
      c.marketShare = Math.max(0, c.marketShare * (1 - lag * 0.12));
      // 긴급 전환 비용 (현금 소모)
      c.cash -= c.revenue * lag * 0.15;
    }

    // ── 8b. eraLimit 초과: 역사적 운명 — 시대를 못 따라간 회사 ──
    // Lotus는 PC시대(era0)까지, Borland도 PC시대까지, Oracle은 인터넷(era1)까지
    if (c.eraLimit !== undefined && eraIdx > c.eraLimit) {
      const eraBehind = eraIdx - c.eraLimit; // 몇 시대나 뒤처졌나
      const fateFactor = Math.min(0.30, eraBehind * 0.08); // 최대 30%/분기 패널티
      c.quality     = Math.max(1, c.quality     * (1 - fateFactor * 0.6));
      c.brand       = Math.max(1, c.brand       * (1 - fateFactor * 0.4));
      c.tech        = Math.max(1, c.tech        * (1 - fateFactor * 0.5));
      c.marketShare = Math.max(0, c.marketShare * (1 - fateFactor));
      // 고객 이탈로 인한 매출 손실 → 현금 직접 감소
      c.cash -= c.revenue * fateFactor * 0.25;
      // 직원 대량 이직 (희망 잃은 조직)
      const fateAttrition = Math.ceil(c.employees * fateFactor * 0.3);
      c.employees = Math.max(1, c.employees - fateAttrition);
    }

    // ── 8c. Dynamic price adjustment ──
    // Each turn, competitors slowly converge toward their target price.
    // Under cash pressure they discount aggressively; recovering they return to target.
    {
      const targetPrice = defaultPriceIndex(c.style || c.personality);
      const currentP    = c.priceIndex !== undefined ? c.priceIndex : 1.0;

      // Under severe cash pressure: discount hard to win back customers
      let adjustedTarget = targetPrice;
      if (c.cash < 0) {
        adjustedTarget = Math.min(targetPrice, 0.75); // deep discount mode
      } else if (cashRatio < 0.4) {
        adjustedTarget = Math.min(targetPrice, 0.88); // mild discount mode
      }

      // Converge 15% of the gap per quarter (gradual, not instant)
      const newP = currentP + (adjustedTarget - currentP) * 0.15;
      c.priceIndex = Math.max(0.50, Math.min(2.0, +newP.toFixed(3)));
    }

    // ── 9. Bankruptcy ──
    // Realistic condition: cash < 0 AND this quarter's profit is also negative.
    // A company with negative accumulated cash but positive profit is recovering → no penalty.
    if (c.cash < 0 && c.profit < 0) {
      c.consecLoss = (c.consecLoss || 0) + 1;

      // Emergency bridge funding: industry/VC rescue round (hard → 낮음, easy → 높음)
      const rescueMult  = (G.diffMults && G.diffMults.rescue) || 1.0;
      const rescueChance = Math.max(0, (0.30 - c.consecLoss * 0.03) * rescueMult);
      if (Math.random() < rescueChance) {
        // Bridge = meaningful fraction of quarterly revenue (not just payroll)
        const bridge = Math.max(
          getSalary(G.year) * c.employees,          // at least one quarter of payroll
          Math.min(c.revenue * 0.5, Math.abs(c.cash) * 0.25) // up to 25% of deficit
        );
        c.cash += bridge;
        // No consecLoss credit — only organic cash recovery does that
      }

      // Threshold scales with depth of deficit relative to payroll
      const payroll = getSalary(G.year) * c.employees;
      const threshold = c.cash < -payroll * 3 ? 6    // deeply negative: 6 quarters
                      : c.cash < -payroll     ? 10   // moderately negative: 10 quarters
                      : 12;                          // shallow negative: 12 quarters

      if (c.consecLoss >= threshold) {
        c.alive = false; c._justDied = true; c.marketShare = 0;
      }
    } else {
      c.consecLoss = 0; // cash positive OR profit positive → recovering, reset counter
    }

    // ── 10. IPO trigger ──
    // Goes public when quarterly revenue ≥ $5M AND profitable for 2+ consecutive quarters
    if (!c.ipo && c.alive && c.revenue >= 5000000 && c.profit > 0) {
      c._profitableQ = (c._profitableQ || 0) + 1;
      if (c._profitableQ >= 2) {
        c.ipo = true;
        c.ipoYear = G.year;
        const cap = getValuation(c);
        pushNews(`📈 ${c.name} IPO 상장! 시가총액 ${fmt(cap)}`, 'info');
      }
    } else if (!c.ipo && c.profit <= 0) {
      c._profitableQ = 0;
    }
  });
}

// ═══════════════════════════════════════════════════════
// 6. UI RENDERING
// ═══════════════════════════════════════════════════════

function fmt(n) {
  const a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1e12) return s+'$'+(a/1e12).toFixed(2)+'T';
  if (a >= 1e9)  return s+'$'+(a/1e9).toFixed(2)+'B';
  if (a >= 1e6)  return s+'$'+(a/1e6).toFixed(2)+'M';
  if (a >= 1e3)  return s+'$'+(a/1e3).toFixed(1)+'K';
  return s+'$'+Math.round(a).toLocaleString();
}

function fmtPct(n, dp=2) { return (n*100).toFixed(dp)+'%'; }
function fmtNum(n)        { return Math.round(n).toLocaleString(); }

// Format customer count with Korean units
function fmtCustomers(n) {
  if (n >= 1e8)  return (n/1e8).toFixed(1)+'억명';
  if (n >= 1e4)  return Math.round(n/1e4)+'만명';
  if (n >= 1e3)  return (n/1e3).toFixed(1)+'K명';
  return Math.round(n)+'명';
}

// Get total market customer count for a year
function getMarketCustomers(year) { return lerp(MARKET_CUSTOMERS, year); }

// Diminishing returns damper for stats above 100
// Growth becomes significantly harder once a stat reaches 100
function statDamper(current) {
  if (current <  90) return 1.00;
  if (current < 100) return 0.70;
  if (current < 115) return 0.28;
  if (current < 130) return 0.14;
  if (current < 150) return 0.07;
  return 0.03;
}

// Generate a stat bar HTML snippet (handles values > 100 with gold excellence style)
function statBarHtml(label, val, baseColor) {
  const rounded = Math.round(val);
  const excel   = val >= 100;
  const barW    = Math.min(100, val);
  const barCol  = val >= 130 ? '#a78bfa'   // purple — mastery
                : val >= 100 ? '#f59e0b'   // gold — excellence
                : baseColor;
  const suffix  = val >= 130 ? ' ✦' : val >= 100 ? ' ★' : '';
  return `
    <div class="comp-bar-item">
      <div class="cb-val${excel?' stat-excel':''}">${label} ${rounded}${suffix}</div>
      <div class="kpi-bar-wrap${excel?' stat-bar-excel':''}">
        <div class="kpi-bar" style="width:${barW}%;background:${barCol}"></div>
      </div>
    </div>`;
}

function renderAll() {
  updateSliderMaxes();
  renderHeader();
  renderEraBanner();
  renderCostPreview();
  renderHireButtons();
  renderFundingStatus();
  renderDashboard();
  renderMarketTab();
  renderHistoryTab();
  renderTheoryTab();
}

function renderHeader() {
  const era = getCurrentEra();
  document.getElementById('hd-company').textContent = G.name;
  document.getElementById('hd-era').textContent     = era.name;
  document.getElementById('hd-time').textContent    = `Q${G.quarter} ${G.year}`;
  document.getElementById('hd-cash').textContent    = fmt(G.cash);
  document.getElementById('hd-rev').textContent     = G.history.length ? fmt(G.history[G.history.length-1].rev) : '—';
  const _hdNamed = G.marketShare + G.competitors.reduce((s,c)=>s+(c.alive?(c.marketShare||0):0),0);
  document.getElementById('hd-share').textContent   = _hdNamed > 0 ? (G.marketShare/_hdNamed*100).toFixed(1)+'%' : '—';
  document.getElementById('hd-emp').textContent     = G.employees+'명';
  document.getElementById('hd-equity').textContent  = (G.equity || 100).toFixed(1)+'%';
  document.getElementById('btn-qinfo').textContent  = `Q${G.quarter} ${G.year}`;
  document.getElementById('hd-cash').className = G.cash < 0 ? 'hd-kpi-v' : '';

  // 대출 잔액 (있을 때만 표시)
  const totalLoanBal = (G.loans || []).reduce((s, l) => s + l.qPay * l.quartersLeft, 0);
  // 대출 잔액 표시 (데스크탑 + 모바일 공통)
  [
    { kpiId:'hd-loan-kpi', valId:'hd-loan' },
    { kpiId:'mb-loan-kpi', valId:'mb-loan' },
  ].forEach(({ kpiId, valId }) => {
    const kpiEl = document.getElementById(kpiId);
    if (!kpiEl) return;
    if (totalLoanBal > 0) {
      document.getElementById(valId).textContent = fmt(totalLoanBal);
      kpiEl.style.display = '';
    } else {
      kpiEl.style.display = 'none';
    }
  });

  // 모바일 KPI 바 업데이트
  const mbCash = document.getElementById('mb-cash');
  if (mbCash) {
    mbCash.textContent  = fmt(G.cash);
    mbCash.style.color  = G.cash < 0 ? 'var(--red)' : '';
    document.getElementById('mb-rev').textContent   = G.history.length ? fmt(G.history[G.history.length-1].rev) : '—';
    document.getElementById('mb-share').textContent = _hdNamed > 0 ? (G.marketShare/_hdNamed*100).toFixed(1)+'%' : '—';
    document.getElementById('mb-emp').textContent   = G.employees+'명';
  }
}

// 모바일 패널 전환 (의사결정 ↔ 대시보드)
function switchMobilePanel(panel) {
  const left  = document.querySelector('.panel-left');
  const right = document.querySelector('.panel-right');
  const tabD  = document.getElementById('mb-tab-decision');
  const tabDB = document.getElementById('mb-tab-dashboard');
  if (!left || !right) return;
  if (panel === 'decision') {
    left.classList.remove('mob-hidden');
    right.classList.add('mob-hidden');
    tabD.classList.add('active');
    tabDB.classList.remove('active');
  } else {
    left.classList.add('mob-hidden');
    right.classList.remove('mob-hidden');
    tabD.classList.remove('active');
    tabDB.classList.add('active');
  }
}

function renderEraBanner() {
  const era  = getCurrentEra();
  document.getElementById('era-icon').textContent = era.icon;
  document.getElementById('era-name').textContent = era.name;
  const nextEra = ERAS.find(e => e.year > G.year);
  document.getElementById('era-year').textContent = nextEra
    ? `${era.year}–${era.year + (nextEra.year - era.year - 1)}`
    : `${era.year}–2050`;
  document.getElementById('era-banner').style.borderLeftColor = era.color;
}

function renderCostPreview() {
  const mktSize = getMarketSize(G.year, G.quarter);

  // ── 예상 매출: processTurn과 동일한 공식으로 계산 ──
  // ① strategy에 따른 priceIdx 보정 (cost_leadership→×0.9, differentiation→≥1.0)
  let priceIdx = decisionState.price || 1.0;
  if (decisionState.strategy === 'cost_leadership') priceIdx *= 0.9;
  if (decisionState.strategy === 'differentiation') priceIdx = Math.max(priceIdx, 1.0);
  // ② eventProdBonus 반영 (이벤트 투자 누적 생산성 보너스)
  const projRevRaw = mktSize * G.marketShare * priceIdx * (G.eventProdBonus || 1.0);
  // ③ 인력 부족 패널티 반영 (인원 < 최소 요구 시 매출 직접 삭감)
  const minEmpProj = calcMinEmployees();
  const projRev = G.employees < minEmpProj
    ? projRevRaw * (G.employees / minEmpProj)
    : projRevRaw;

  // ④ 비용: 예상 매출 기준 COGS 사용 (이전 분기 G.revenue 아님)
  const c = calcPlayerCosts(projRev);
  // ⑤ 투자 효율 프리미엄 반영 (processTurn과 동일한 로직)
  const totalInvest = Math.max(0, c.rd) + Math.max(0, c.mkt) + Math.max(0, c.hr);
  const { premium: investPrem, capMult: investCapMult } = calcInvestPremium(totalInvest, projRev);
  const investBonus = projRev > 0 ? Math.round(projRev * investPrem) : 0;
  const rawProfit   = projRev - c.total + investBonus;
  // 이익률 상한 적용
  const _ef = getEraFinancials();
  const _cap = _ef ? Math.min(0.70, _ef.opMgElite * investCapMult) : (0.35 + investPrem);
  const projProfit  = projRev > 0 ? Math.min(rawProfit, Math.round(projRev * _cap)) : rawProfit;
  const projCash    = (G.cash || 0) + projProfit;

  document.getElementById('cp-sal').textContent   = fmt(c.sal);
  const wageBadge = document.getElementById('cp-wage-badge');
  if (wageBadge) wageBadge.textContent = '';
  document.getElementById('cp-rd').textContent    = fmt(c.rd);
  document.getElementById('cp-mkt').textContent   = fmt(c.mkt);
  document.getElementById('cp-ops').textContent   = fmt(c.ops + c.hire);
  // COGS: 매출 기반 — 매출이 없는 초기에는 0 표시
  const cogsEl = document.getElementById('cp-cogs');
  const cogsRow = document.getElementById('cp-cogs-row');
  if (cogsEl && cogsRow) {
    if ((c.cogs || 0) > 0) {
      cogsEl.textContent = fmt(c.cogs);
      cogsRow.style.display = '';
    } else {
      cogsRow.style.display = 'none';
    }
  }
  const loanRow = document.getElementById('cp-loan-row');
  if (c.loan > 0) {
    loanRow.style.display = '';
    document.getElementById('cp-loan').textContent = fmt(c.loan);
  } else {
    loanRow.style.display = 'none';
  }
  document.getElementById('cp-total').textContent = fmt(c.total);

  const profEl = document.getElementById('cp-profit');
  const marginPct = projRev > 0 ? Math.round(projProfit / projRev * 100) : 0;
  // 투자 프리미엄 배지 (투자 보너스가 있을 때만 표시)
  const premBadge = investBonus > 0
    ? ` <span style="font-size:10px;color:#a78bfa;font-weight:400">+${Math.round(investPrem*100)}%p 투자보너스</span>`
    : '';
  profEl.innerHTML = `${fmt(projProfit)} <span style="font-size:11px;opacity:.7">(${marginPct}%)</span>${premBadge}`;
  profEl.className = 'cp-row cp-profit' + (projProfit < 0 ? ' neg' : '');

  // ── 인력 부족 매출 손실 경고 ──
  let staffWarnEl = document.getElementById('cp-staff-warn');
  if (G.employees < minEmpProj) {
    const deficit   = 1 - G.employees / minEmpProj;
    const revLost   = Math.round(projRevRaw * deficit);
    if (!staffWarnEl) {
      staffWarnEl = document.createElement('div');
      staffWarnEl.id = 'cp-staff-warn';
      staffWarnEl.className = 'cp-fund-warn';
      staffWarnEl.style.borderColor = 'var(--red)';
      const profRow = profEl.closest ? profEl.closest('.cp-row') : profEl.parentElement;
      profRow ? profRow.after(staffWarnEl) : profEl.after(staffWarnEl);
    }
    staffWarnEl.innerHTML =
      `<div class="cpfw-label">🚨 인력 부족 — 매출 ${Math.round(deficit*100)}% 손실 예상</div>` +
      `<div class="cpfw-amount">손실액: <strong>${fmt(revLost)}</strong> · ` +
      `현원 ${G.employees}명 / 최소 ${minEmpProj}명 필요</div>`;
    staffWarnEl.style.display = '';
  } else if (staffWarnEl) {
    staffWarnEl.style.display = 'none';
  }

  // ── 패러다임 전환기 경고 ──
  let eraTransEl = document.getElementById('cp-era-trans-warn');
  if ((G.eraTransitionQ || 0) > 0) {
    if (!eraTransEl) {
      eraTransEl = document.createElement('div');
      eraTransEl.id = 'cp-era-trans-warn';
      eraTransEl.className = 'cp-fund-warn';
      eraTransEl.style.borderColor = 'var(--amber)';
      const profRow = profEl.closest ? profEl.closest('.cp-row') : profEl.parentElement;
      profRow ? profRow.after(eraTransEl) : profEl.after(eraTransEl);
    }
    eraTransEl.innerHTML =
      `<div class="cpfw-label">🔄 패러다임 전환기 — R&D·마케팅 기준 ×1.5 적용 중</div>` +
      `<div class="cpfw-amount">잔여 <strong>${G.eraTransitionQ}분기</strong> · 이전 규모 투자는 부족 판정 → stats 하락</div>`;
    eraTransEl.style.display = '';
  } else if (eraTransEl) {
    eraTransEl.style.display = 'none';
  }

  // ── 자금 부족 경고 + 자금 조달 바로가기 ──
  let fundWarnEl = document.getElementById('cp-fund-warn');
  if (projCash < 0) {
    const shortfall = Math.abs(projCash);
    if (!fundWarnEl) {
      fundWarnEl = document.createElement('div');
      fundWarnEl.id = 'cp-fund-warn';
      fundWarnEl.className = 'cp-fund-warn';
      // insert after cp-profit row
      const profRow = profEl.closest ? profEl.closest('.cp-row') : profEl.parentElement;
      profRow ? profRow.after(fundWarnEl) : profEl.after(fundWarnEl);
    }
    fundWarnEl.innerHTML = `
      <div class="cpfw-label">⚠ 분기 종료 시 현금 부족 예상</div>
      <div class="cpfw-amount">부족액: <strong>${fmt(shortfall)}</strong>
        (보유: ${fmt(G.cash)} → 예상: ${fmt(projCash)})</div>
      <button class="cpfw-btn" onclick="openFundingModal()">
        💰 자금 조달 (대출·IPO)
      </button>`;
    fundWarnEl.style.display = '';
  } else if (fundWarnEl) {
    fundWarnEl.style.display = 'none';
  }
}

function renderDashboard() {
  if (!G.history.length) return;
  const h = G.history[G.history.length-1];
  const prev = G.history.length > 1 ? G.history[G.history.length-2] : null;

  const annualRev = h.rev * 4;
  const prevAR    = prev ? prev.rev * 4 : null;
  setKPI('k-arr',    fmt(annualRev), prevAR ? delta(annualRev, prevAR) : null);
  setKPI('k-profit', fmt(h.profit),  prev   ? delta(h.profit, prev.profit) : null);
  // 경쟁사 간 상대 점유율 (합계 100%) 로 표시
  const relShare = h.relShare ?? h.share;
  const prevRelShare = prev ? (prev.relShare ?? prev.share) : null;
  setKPI('k-share', (relShare * 100).toFixed(1) + '%',
    prevRelShare !== null ? shareDelta(relShare, prevRelShare) : null);

  // Stats can exceed 100 — show excellence indicator and gold color
  const setStatKPI = (valId, barId, val, baseColor) => {
    const el = document.getElementById(valId);
    const rounded = Math.round(val);
    const excel = val >= 100;
    const suffix = val >= 130 ? ' ✦' : val >= 100 ? ' ★' : '';
    el.textContent = rounded + suffix;
    el.style.color = val >= 130 ? 'var(--purple)' : val >= 100 ? 'var(--amber)' : '';
    const barColor = val >= 130 ? '#a78bfa' : val >= 100 ? '#f59e0b' : baseColor;
    setBar(barId, Math.min(100, val), barColor);
  };
  setStatKPI('k-quality', 'k-q-bar', h.quality, '#3b82f6');
  setStatKPI('k-brand',   'k-b-bar', h.brand,   '#10b981');
  setStatKPI('k-tech',    'k-t-bar', h.tech,    '#8b5cf6');

  // Morale KPI
  const moraleColor = G.morale >= 70 ? '#10b981' : G.morale >= 40 ? '#f59e0b' : '#ef4444';
  const moraleLabel = G.morale >= 70 ? '높음 😊' : G.morale >= 40 ? '보통 😐' : '낮음 😟';
  document.getElementById('k-morale').textContent = G.morale + '/100 ' + moraleLabel;
  setBar('k-morale-bar', G.morale, moraleColor);
  document.getElementById('k-attrition').textContent = G.lastAttrition + '명/분기';
  const minEmp = calcMinEmployees();
  const minEmpEl = document.getElementById('k-min-emp');
  if (minEmpEl) {
    // 생산성 보너스 정보 함께 표시
    const techProd = 1.0 + Math.max(0, (G.tech || 0) - 50) / 200;
    const evProd   = G.eventProdBonus || 1.0;
    const totalProd = techProd * evProd;
    minEmpEl.textContent = minEmp + '명 필요';
    minEmpEl.style.color = G.employees < minEmp ? 'var(--red)' : 'var(--green)';
  }

  // Tech debt status panel
  const tdPanel = document.getElementById('tech-debt-panel');
  if (tdPanel) {
    const activeDebts = (G.techDebt || []).filter(d => !d.resolved);
    if (activeDebts.length === 0) {
      tdPanel.style.display = 'none';
    } else {
      tdPanel.style.display = '';
      tdPanel.innerHTML = `
        <div class="td-header">🕰️ 기술 부채 <span class="td-count">${activeDebts.length}건</span></div>` +
        activeDebts.map(d => {
          const periods   = Math.floor(d.quartDebt / 4);
          const catchFrac = +(d.baseFrac * (1 + periods * 0.40)).toFixed(2);
          const cost      = getEventChoiceCost(catchFrac);
          const urgency   = d.quartDebt >= 8 ? 'td-urgent' : d.quartDebt >= 4 ? 'td-warn' : '';
          return `
          <div class="td-item ${urgency}">
            <div class="td-title">${d.title}</div>
            <div class="td-meta">
              ${d.quartDebt}분기 경과 · 현재 추격비용: ${fmt(cost)}
              (분기매출의 ${Math.round(catchFrac * 100)}%)
            </div>
          </div>`;
        }).join('');
    }
  }

  // News
  const nl = document.getElementById('news-list');
  const items = G.newsLog.slice(0, 8).map(n => `
    <div class="news-item">
      <span class="ni-tag ${n.type}">${n.type==='good'?'▲':n.type==='bad'?'▼':n.type==='warn'?'⚠':'ℹ'}</span>
      ${n.msg} <span style="color:var(--muted);font-size:9px">Q${n.q} ${n.yr}</span>
    </div>`).join('');
  nl.innerHTML = items || '<div class="news-item" style="color:var(--muted)">아직 동향이 없습니다.</div>';

  updateCharts();
}

function setKPI(id, val, deltaStr) {
  document.getElementById(id).textContent = val;
  const dEl = document.getElementById(id+'-d');
  if (dEl && deltaStr) {
    dEl.textContent  = deltaStr.str;
    dEl.className    = 'kpi-delta ' + deltaStr.cls;
  }
}

function setBar(id, val, color='#3b82f6') {
  const el = document.getElementById(id);
  if (el) { el.style.width = Math.min(100, val)+'%'; el.style.background = color; }
}

function delta(curr, prev) {
  if (!prev || prev === 0) return null;
  const pct = (curr - prev) / Math.abs(prev) * 100;
  return { str: (pct>=0?'▲ +':'▼ ')+Math.abs(pct).toFixed(1)+'%', cls: pct>=0?'pos':'neg' };
}

function shareDelta(curr, prev) {
  const diff = (curr-prev)*100;
  return { str: (diff>=0?'▲ +':'▼ ')+Math.abs(diff).toFixed(3)+'%p', cls: diff>=0?'pos':'neg' };
}

function renderMarketTab() {
  const mktSize = getMarketSize(G.year, G.quarter) * 4; // annual

  // Relative share among named companies — computed early for header display
  // (also reused below for pie bar; declared with let to avoid duplicate const)
  const _namedShareEarly = G.marketShare +
    G.competitors.reduce((s, c) => s + (c.alive ? (c.marketShare || 0) : 0), 0);
  const myRelShare = _namedShareEarly > 0 ? (G.marketShare / _namedShareEarly * 100) : 0;

  document.getElementById('mkt-size').textContent     = fmt(mktSize) + '/년';
  document.getElementById('mkt-my-share').textContent = myRelShare.toFixed(1) + '%';
  document.getElementById('mkt-era').textContent      = getCurrentEra().name;

  // Growth rate YoY approximation
  const nextMkt = getMarketSize(G.year+1, 1)*4;
  const growth  = (nextMkt - mktSize) / mktSize * 100;
  document.getElementById('mkt-growth').textContent   = '+'+growth.toFixed(1)+'%';

  // TAM chart update
  updateTamChart();

  // Competitor table — include player for comparison
  const lastH   = G.history.length ? G.history[G.history.length-1] : null;
  const prevH   = G.history.length > 1 ? G.history[G.history.length-2] : null;
  const all = [
    { name:G.name, icon:'🏢', style:G.strategy,
      quality:G.quality, brand:G.brand, tech:G.tech, share:G.marketShare,
      employees:G.employees, cash:G.cash,
      revenue: lastH ? lastH.rev    : 0,
      profit:  lastH ? lastH.profit : 0,
      prevRevenue: prevH ? prevH.rev : null,
      priceIndex: decisionState.price || 1.0,
      alive:true, isPlayer:true },
    ...G.competitors.map((c, ci) => ({
      ...c,
      _idx:        ci,
      share:       c.marketShare,
      style:       c.style || c.personality,
      prevRevenue: (prevH && prevH.compRevenues) ? prevH.compRevenues[ci] : null,
    }))
  ].sort((a,b) => b.share - a.share);

  // ── Market share pie bar (named companies relative = 100%) ──
  const totalNamedShare = all.reduce((s, c) => s + (c.alive ? c.share : 0), 0);
  const totalMarketCustomers = getMarketCustomers(G.year);

  // Build pie segments using RELATIVE share among named companies (sums to 100%)
  const pieSegs = all
    .filter(c => c.alive && c.share > 0)
    .map(c => {
      const relPct = totalNamedShare > 0 ? (c.share / totalNamedShare * 100) : 0;
      const col = c.isPlayer ? 'var(--blue)' : '';
      return `<div class="mpb-seg" style="width:${relPct.toFixed(2)}%;${col?'background:'+col:''}" title="${c.name}: ${relPct.toFixed(1)}%"></div>`;
    }).join('');

  const pieBar = `
    <div class="market-pie-wrap">
      <div class="market-pie-label">경쟁사 간 점유율 (합계 100%) — 전체 시장 침투율: ${fmtPct(totalNamedShare,2)}</div>
      <div class="market-pie-bar">${pieSegs}</div>
      <div class="market-pie-legend">
        ${all.filter(c=>c.alive).map(c=>{
          const relPct = totalNamedShare > 0 ? (c.share/totalNamedShare*100) : 0;
          return `<span class="mpl-item${c.isPlayer?' mpl-player':''}">${c.icon||'🏭'} ${c.name}: ${relPct.toFixed(1)}%</span>`;
        }).join('')}
      </div>
    </div>`;

  // ── Competitor comparison TABLE ──────────────────────────────────
  // 인라인 미니바: width를 style로 직접 지정 (CSS 클래스 불필요)
  const miniBar = (val, color, max=200) => {
    const w = Math.min(100, val / max * 100).toFixed(1);
    const c = val >= 130 ? '#a78bfa' : val >= 100 ? '#f59e0b' : color;
    const star = val >= 130 ? '✦' : val >= 100 ? '★' : '';
    return `<div class="ct-bar-wrap">
      <div class="ct-bar" style="width:${w}%;background:${c}"></div>
      <span class="ct-bar-val">${Math.round(val)}${star}</span>
    </div>`;
  };

  // 패러다임 적응도 계산 헬퍼
  const eraIdx     = getEraIndex();
  const eraReq     = eraIdx * 22;
  const paradigmBadge = (tech) => {
    if (eraIdx === 0) return ''; // PC 시대 = 요건 없음
    const ratio = eraReq > 0 ? tech / eraReq : 2;
    if (ratio >= 1.0)  return `<span class="para-badge para-ok">✅ 적응</span>`;
    if (ratio >= 0.6)  return `<span class="para-badge para-mid">⚡ 전환중</span>`;
    return                     `<span class="para-badge para-bad">🔴 미적응</span>`;
  };

  const tableRows = all.map(c => {
    const relPct    = totalNamedShare > 0 ? (c.share / totalNamedShare * 100) : 0;
    const val       = getValuation(c);
    const acqPrice  = Math.round(val * 1.5);
    const canAfford = !c.isPlayer && c.alive && G.cash >= acqPrice && acqPrice > 0;
    const revGrowth = c.prevRevenue && c.revenue > 0
      ? ((c.revenue - c.prevRevenue) / c.prevRevenue * 100) : null;

    const profColor = !c.alive ? 'var(--muted)' : c.profit >= 0 ? 'var(--green)' : 'var(--red)';
    const revArrow  = revGrowth === null ? ''
      : revGrowth > 0 ? `<span class="ct-up">▲${revGrowth.toFixed(1)}%</span>`
                      : `<span class="ct-dn">▼${Math.abs(revGrowth).toFixed(1)}%</span>`;

    // 인당 생산성 (연매출 / 직원)
    const annualRev   = c.revenue * 4;
    const revPerEmp   = c.alive && c.employees > 0 ? annualRev / c.employees : 0;
    const salaryAmt   = getSalary(G.year);
    const prodRatio   = revPerEmp > 0 && salaryAmt > 0 ? revPerEmp / salaryAmt : 0;
    const prodColor   = prodRatio >= 3 ? '#a78bfa' : prodRatio >= 1.5 ? '#10b981' : prodRatio >= 0.8 ? 'var(--muted)' : '#ef4444';

    const statusBadge = !c.alive
      ? `<span class="ct-badge dead">💀파산</span>`
      : c.cash < 0
        ? `<span class="ct-badge warn">⚠적자</span>`
        : c.ipo
          ? `<span class="ct-badge ipo">📈상장</span>`
          : '';

    const acqCell = !c.isPlayer && c.alive
      ? `<button class="ct-acq-btn ${canAfford?'':'disabled'}"
           onclick="${canAfford?`openAcquisitionModal(${c._idx})`:''}"
           title="${canAfford?'인수 제안':'자금 부족 '+fmt(acqPrice)}">
           🤝 ${fmt(acqPrice)}
         </button>`
      : `<span style="color:var(--muted);font-size:10px">${c.isPlayer?'(본사)':'—'}</span>`;

    // 실제 기업 역사 데이터 미니 표시
    const histLine = (() => {
      if (c.isPlayer || !c._hist || !c._hist.yr) return '';
      const h = c._hist;
      const revStr = h.rev >= 1000 ? `$${(h.rev/1000).toFixed(1)}B` : h.rev > 0 ? `$${h.rev}M` : '비공개';
      const mgStr  = h.opMg !== null ? `${Math.round(h.opMg*100)}%` : '비공개';
      const rpeStr = h.rpe  ? `$${Math.round(h.rpe/1000)}K/인` : '';
      return `<div class="ct-hist-ref" title="${h.note||''}">${h.yr}년 매출 ${revStr} · 영업이익 ${mgStr}${rpeStr?' · '+rpeStr:''}</div>`;
    })();

    return `
    <tr class="ct-row${c.isPlayer?' ct-player':''}${!c.alive?' ct-dead':''}">
      <td class="ct-name">
        <span class="ct-icon">${c.icon||'🏭'}</span>
        <div>
          <div class="ct-nm">${c.name}${c.isPlayer?' 👑':''}</div>
          <div class="ct-strat">${styleLabel(c.style)}</div>
          ${histLine}
        </div>
        ${statusBadge}
      </td>
      <td class="ct-share-cell">
        <div class="ct-share-pct" style="${c.isPlayer?'color:var(--blue);font-weight:700':''}">${relPct.toFixed(1)}%</div>
        <div class="ct-share-bar-wrap">
          <div class="ct-share-bar" style="width:${relPct.toFixed(1)}%;background:${c.isPlayer?'var(--blue)':'var(--purple)'}"></div>
        </div>
      </td>
      <td>${c.alive ? fmt(c.revenue) : '—'}${revArrow}</td>
      <td style="color:${profColor}">${c.alive ? (c.profit>=0?'+':'')+fmt(c.profit) : '—'}</td>
      <td style="${c.cash<0?'color:var(--red)':''}">${fmt(c.cash)}</td>
      <td style="color:var(--muted)">${c.alive ? fmt(val) : '—'}</td>
      <td>
        ${c.alive ? (c.employees||0).toLocaleString()+'명' : '—'}
        ${c.alive && eraIdx > 0 ? '<br>'+paradigmBadge(c.tech || 0) : ''}
        ${c.alive ? (() => {
          const m = c.isPlayer ? G.morale : (c.morale ?? 50);
          const mColor = m >= 70 ? '#10b981' : m >= 40 ? '#f59e0b' : '#ef4444';
          const mIcon  = m >= 70 ? '😊' : m >= 40 ? '😐' : '😟';
          return `<br><span style="font-size:10px;color:${mColor}">${mIcon} 사기 ${Math.round(m)}</span>`;
        })() : ''}
      </td>
      <td>${c.alive ? miniBar(c.quality, '#3b82f6') : '—'}</td>
      <td>${c.alive ? miniBar(c.brand,   '#10b981') : '—'}</td>
      <td>${c.alive ? miniBar(c.tech,    '#8b5cf6') : '—'}</td>
      <td>${c.alive ? (() => {
        const cWm    = getCompanyWageMult(c, false);
        const cSal   = Math.round(getSalary(G.year) * cWm);
        const wColor = cWm >= 1.20 ? '#a78bfa'
                     : cWm >= 1.05 ? '#60a5fa'
                     : cWm >= 0.95 ? 'var(--muted)'
                     : cWm >= 0.82 ? '#f59e0b' : '#ef4444';
        const wLabel = cWm >= 1.20 ? '↑↑' : cWm >= 1.05 ? '↑' : cWm >= 0.95 ? '—' : cWm >= 0.82 ? '↓' : '↓↓';
        return `<span style="font-size:10px;color:var(--muted)">임금</span><br>
           <span style="font-size:11px;color:${wColor}">${fmt(cSal)}/년 ${wLabel}</span><br>
           <span style="font-size:10px;color:var(--muted)">생산성</span><br>
           <span style="font-size:11px;color:${prodColor}">${fmt(revPerEmp)}/인</span>`;
      })() : '—'}</td>
      <td>${(() => {
        if (!c.alive) return '—';
        const pi = c.priceIndex !== undefined ? c.priceIndex : (c.isPlayer ? (decisionState.price||1.0) : 1.0);
        const pl = priceLabel(pi);
        return `<span style="color:${pl.color};font-size:11px;font-weight:600">${pl.text}</span><br><span style="color:var(--muted);font-size:10px">${Math.round(pi*100)}%</span>`;
      })()}</td>
      <td>${acqCell}</td>
    </tr>`;
  }).join('');

  const table = `
  <div class="ct-wrap">
    <table class="comp-table-grid">
      <thead>
        <tr>
          <th>기업</th>
          <th>점유율</th>
          <th>분기 매출</th>
          <th>순이익</th>
          <th>현금</th>
          <th>기업가치</th>
          <th>직원/사기</th>
          <th>품질</th>
          <th>브랜드</th>
          <th>기술</th>
          <th>임금/생산성</th>
          <th>가격</th>
          <th>인수</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>`;

  document.getElementById('comp-table').innerHTML = pieBar + table;
}

function styleLabel(s) {
  const m = { differentiation:'차별화', cost_leadership:'원가우위', focus:'집중화',
              aggressive:'공격적 성장', quality:'품질 우선', value:'원가우위', niche:'집중화' };
  return m[s] || s;
}

function renderHistoryTab() {
  const body = document.getElementById('hist-body');
  const rows = [...G.history].reverse().slice(0,24).map(h => `
    <tr>
      <td>Q${h.q} ${h.yr}</td>
      <td>${fmt(h.rev)}</td>
      <td style="color:${h.profit>=0?'var(--green)':'var(--red)'}">${fmt(h.profit)}</td>
      <td>${((h.relShare ?? h.share) * 100).toFixed(1)}%</td>
      <td>${fmt(h.cash)}</td>
      <td>${h.emp}</td>
    </tr>`).join('');
  body.innerHTML = rows;
}

function renderTheoryTab() {
  // BCG Matrix
  const mktGrowth = getMarketSize(G.year+1,1) / getMarketSize(G.year,1) - 1;
  const isHighGrowth = mktGrowth > 0.15;
  const isHighShare  = G.marketShare > 0.01;
  let pos = '', posColor = '';
  if (isHighGrowth  && isHighShare)  { pos='⭐ Star — 집중 투자!';      posColor='#f59e0b'; }
  if (!isHighGrowth && isHighShare)  { pos='🐄 Cash Cow — 수익 창출';   posColor='#10b981'; }
  if (isHighGrowth  && !isHighShare) { pos='❓ Question Mark — 투자 결정'; posColor='#8b5cf6'; }
  if (!isHighGrowth && !isHighShare) { pos='🐕 Dog — 재검토 필요';      posColor='#ef4444'; }

  document.getElementById('bcg-display').innerHTML = `
    <div style="font-size:13px;font-weight:700;color:${posColor};margin-top:6px">${pos}</div>
    <div style="font-size:10px;color:var(--muted);margin-top:3px">
      시장 성장률: ${(mktGrowth*100).toFixed(1)}% | 점유율: ${fmtPct(G.marketShare,3)}
    </div>`;

  const bcgCells = [
    {name:'⭐ Star',label:'고성장·고점유',active:isHighGrowth&&isHighShare},
    {name:'❓ Q.Mark',label:'고성장·저점유',active:isHighGrowth&&!isHighShare},
    {name:'🐄 Cash Cow',label:'저성장·고점유',active:!isHighGrowth&&isHighShare},
    {name:'🐕 Dog',label:'저성장·저점유',active:!isHighGrowth&&!isHighShare},
  ];
  document.getElementById('bcg-matrix').innerHTML = `
    <div class="bcg-grid">${bcgCells.map(c=>`
      <div class="bcg-cell ${c.active?'active':''}">
        <div style="font-size:14px">${c.name.split(' ')[0]}</div>
        <div style="font-size:9px;font-weight:600;margin-top:2px">${c.name.split(' ').slice(1).join(' ')}</div>
        <div style="font-size:8px;color:var(--muted)">${c.label}</div>
      </div>`).join('')}
    </div>`;

  // PLC
  const stages = ['intro','growth','maturity','decline'];
  const stageNames = ['도입기','성장기','성숙기','쇠퇴기'];
  const stageColors = ['#06b6d4','#10b981','#f59e0b','#ef4444'];
  const curIdx = stages.indexOf(G.productStage);
  document.getElementById('plc-display').innerHTML = `
    <div class="plc-bar">${stages.map((s,i)=>`
      <div class="plc-stage ${i===curIdx?'active':''}"
           style="background:${i===curIdx?stageColors[i]:'rgba(255,255,255,.05)'}">
        ${stageNames[i]}
      </div>`).join('')}
    </div>
    <div style="font-size:10px;color:var(--muted);margin-top:6px">
      현재 단계: <strong style="color:${stageColors[curIdx]}">${stageNames[curIdx]}</strong>
      (${G.productStageQ}분기째)
    </div>`;

  // Blue Ocean index
  const boScore = Math.min(100, G.tech * 0.5 + (G.quality-G.brand)*0.3 + G.employees*0.2);
  setBar('blue-ocean-bar', boScore, '#06b6d4');
  document.getElementById('blue-ocean-val').textContent =
    boScore.toFixed(0) + '/100 — ' + (boScore>60?'블루오션 개척 중':'레드오션 경쟁 중');
}

// ═══════════════════════════════════════════════════════
// 7. CHARTS
// ═══════════════════════════════════════════════════════

function initCharts() {
  Chart.defaults.color = '#64748b';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

  const makeChart = (id, cfg) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    // Chart.js 4.x: use getChart() to find and destroy any existing chart on this canvas
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();
    return new Chart(ctx, cfg);
  };

  charts.rev = makeChart('chart-rev', {
    type:'line',
    data:{ labels:[], datasets:[
      { label:'매출',    data:[], borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.1)', fill:true, tension:.3 },
      { label:'순이익',  data:[], borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.1)', fill:true, tension:.3 },
    ]},
    options:{ responsive:true, plugins:{legend:{position:'top'}},
              scales:{y:{ticks:{callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.04)'}},
                      x:{grid:{color:'rgba(255,255,255,.04)'}}} }
  });

  charts.tam = makeChart('chart-tam', {
    type:'line',
    data:{ labels:[], datasets:[
      { label:'과거/현재', data:[], borderColor:'#06b6d4', backgroundColor:'rgba(6,182,212,.12)', fill:true, tension:.4, borderWidth:2 },
      { label:'예측', data:[], borderColor:'#8b5cf6', backgroundColor:'rgba(139,92,246,.06)', fill:true, tension:.4, borderWidth:2, borderDash:[5,4] },
    ]},
    options:{ responsive:true, plugins:{legend:{position:'top'}},
              scales:{y:{ticks:{callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.04)'}},
                      x:{grid:{color:'rgba(255,255,255,.04)'}}} }
  });

  charts.share = makeChart('chart-share', {
    type:'line',
    data:{ labels:[], datasets:[] },
    options:{ responsive:true, plugins:{legend:{position:'top'}},
              scales:{y:{ticks:{callback:v=>(v*100).toFixed(2)+'%'},grid:{color:'rgba(255,255,255,.04)'}},
                      x:{grid:{color:'rgba(255,255,255,.04)'}}} }
  });

  charts.cash = makeChart('chart-cash', {
    type:'line',
    data:{ labels:[], datasets:[
      { label:'현금', data:[], borderColor:'#f59e0b', backgroundColor:'rgba(245,158,11,.1)', fill:true, tension:.3 }
    ]},
    options:{ responsive:true, plugins:{legend:{display:false}},
              scales:{y:{ticks:{callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.04)'}},
                      x:{grid:{color:'rgba(255,255,255,.04)'}}} }
  });

  charts.org = makeChart('chart-org', {
    type:'bar',
    data:{ labels:[], datasets:[
      { label:'직원 수', data:[], backgroundColor:'rgba(139,92,246,.5)', yAxisID:'y1' },
      { label:'품질',    data:[], type:'line', borderColor:'#10b981', tension:.3, yAxisID:'y2' },
      { label:'사기',    data:[], type:'line', borderColor:'#f59e0b', tension:.3, yAxisID:'y2', borderDash:[4,3] },
    ]},
    options:{ responsive:true, plugins:{legend:{position:'top'}},
              scales:{
                y1:{type:'linear',position:'left',grid:{color:'rgba(255,255,255,.04)'}},
                y2:{type:'linear',position:'right',min:0,max:100,grid:{display:false}} } }
  });
}

function updateCharts() {
  const N    = 16;
  const hist = G.history.slice(-N);
  const lbls = hist.map(h=>`Q${h.q} ${h.yr}`);

  if (charts.rev) {
    charts.rev.data.labels = lbls;
    charts.rev.data.datasets[0].data = hist.map(h=>h.rev);
    charts.rev.data.datasets[1].data = hist.map(h=>h.profit);
    charts.rev.update('none');
  }

  if (charts.share) {
    const compColors = ['#ef4444','#8b5cf6','#f59e0b','#10b981','#06b6d4','#f97316','#84cc16'];
    charts.share.data.labels = lbls;
    // 경쟁사 간 상대 점유율 (합계 100%) 기준 — 시장현황과 동일한 지표
    const ds = [{ label: G.name + ' (경쟁사 간)',
                  data: hist.map(h => h.relShare != null ? +(h.relShare * 100).toFixed(2) : null),
                  borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.08)',
                  fill:true, tension:.3, borderWidth:2.5 }];
    G.competitors.forEach((c,i) => {
      ds.push({
        label: c.name + (c.alive ? '' : ' 💀'),
        data: hist.map(h => h.compRelShares
          ? +(((h.compRelShares[i] ?? 0) * 100).toFixed(2))
          : (h.compShares ? +(((h.compShares[i] ?? 0) / Math.max(0.000001,
              (h.share || 0) + (h.compShares || []).reduce((s,x)=>s+(x||0),0))) * 100).toFixed(2)
            : null)),
        borderColor: compColors[i % compColors.length],
        tension:.3, borderWidth:1.5,
        borderDash: c.alive ? [4,4] : [2,6],
        pointRadius: 0,
      });
    });
    charts.share.data.datasets = ds;
    charts.share.update('none');
  }

  if (charts.cash) {
    charts.cash.data.labels = lbls;
    charts.cash.data.datasets[0].data = hist.map(h=>h.cash);
    charts.cash.update('none');
  }

  if (charts.org) {
    charts.org.data.labels = lbls;
    charts.org.data.datasets[0].data = hist.map(h=>h.emp);
    charts.org.data.datasets[1].data = hist.map(h=>h.quality);
    charts.org.data.datasets[2].data = hist.map(h=>h.morale ?? 60);
    charts.org.update('none');
  }
}

function updateTamChart() {
  if (!charts.tam) return;
  // Show game-start to game-end range in steps of 2 years
  const startY = G.startYear || G.year;
  const endY   = 2050;
  const pastLabels = [], pastVals = [], futureLabels = [], futureVals = [];
  for (let y = startY; y <= endY; y += 2) {
    const v = getMarketSize(y, 1) * 4; // annual TAM
    if (y <= G.year) { pastLabels.push(y+''); pastVals.push(v); }
    else             { futureLabels.push(y+''); futureVals.push(v); }
  }
  // Merge labels; past dataset has nulls for future slots, vice versa
  const allLabels = [...pastLabels, ...futureLabels];
  const pastData  = [...pastVals,  ...futureLabels.map(()=>null)];
  const futureData= [...pastLabels.map((_,i) => i === pastLabels.length-1 ? pastVals[i] : null), ...futureVals];
  charts.tam.data.labels            = allLabels;
  charts.tam.data.datasets[0].data  = pastData;
  charts.tam.data.datasets[1].data  = futureData;
  charts.tam.update('none');
}

// ═══════════════════════════════════════════════════════
// 8. MODALS & EVENT FLOW
// ═══════════════════════════════════════════════════════

// ─── FUNDING SYSTEM ────────────────────────────────────

// Scale funding amounts by salary inflation index vs 1980 baseline
// Seed $300K in 1980 → ~$2M in 2020, Series A $2M → ~$13M, IPO $200M → ~$1.3B
function getFundingEraMult() {
  return getSalary(G.year) / getSalary(1980);
}

// ── 신용등급 계산 ──────────────────────────────────────────────────────────────
// 수익성·부채비율·현금런웨이·성장률 → 7등급 (AAA ~ C)
// 등급이 높을수록 대출 한도 증가 + 금리 하락
function getCreditRating() {
  const hist = G.history.slice(-4);
  if (!hist.length) return { grade: 'BB', score: 50 };

  let score = 50;

  // 1. 평균 이익률 (최대 ±25점)
  const avgMargin = hist.reduce((s,h) =>
    s + (h.rev > 0 ? h.profit / h.rev : -0.3), 0) / hist.length;
  score += Math.max(-25, Math.min(25, avgMargin * 70));

  // 2. 부채비율 — 대출 잔여 / 연매출 (최대 ±15점)
  const annualRev = (hist[hist.length-1]?.rev || 0) * 4;
  const totalDebt = (G.loans || []).reduce((s,l) => s + l.qPay * l.quartersLeft, 0);
  const debtRatio = annualRev > 0 ? totalDebt / annualRev : 2;
  score += Math.max(-15, Math.min(10, (0.4 - debtRatio) * 25));

  // 3. 현금런웨이 — 보유현금 / 분기비용 (최대 ±10점)
  const lastH = hist[hist.length-1];
  const lastCost = lastH ? Math.max(1, lastH.rev - lastH.profit) : 1;
  const runway = G.cash / lastCost;
  score += Math.max(-10, Math.min(12, runway * 4));

  // 4. 성장률 — 최근 4분기 (최대 +8점)
  if (hist.length >= 2 && hist[0].rev > 0) {
    const growthRate = (hist[hist.length-1].rev - hist[0].rev) / hist[0].rev;
    score += Math.max(-5, Math.min(8, growthRate * 12));
  }

  score = Math.max(0, Math.min(100, score));
  const grade = score >= 85 ? 'AAA'
              : score >= 73 ? 'AA'
              : score >= 62 ? 'A'
              : score >= 50 ? 'BBB'
              : score >= 38 ? 'BB'
              : score >= 25 ? 'B'
              :               'C';
  return { grade, score: Math.round(score) };
}

// 등급별 대출 한도 배율 · 연이자율 · 표시 색상
const CREDIT_PARAMS = {
  'AAA': { loanMult: 4.0, rate: 0.045, color: '#10b981', label: '최우수' },
  'AA':  { loanMult: 3.0, rate: 0.055, color: '#34d399', label: '우수'   },
  'A':   { loanMult: 2.0, rate: 0.070, color: '#60a5fa', label: '양호'   },
  'BBB': { loanMult: 1.4, rate: 0.085, color: '#93c5fd', label: '적정'   },
  'BB':  { loanMult: 1.0, rate: 0.105, color: '#fbbf24', label: '주의'   },
  'B':   { loanMult: 0.6, rate: 0.135, color: '#f97316', label: '위험'   },
  'C':   { loanMult: 0.3, rate: 0.180, color: '#ef4444', label: '매우위험'},
};

// 마지막 특정 라운드 유치 시점 (G.history.length 기준), 없으면 -Infinity
function getLastFundingQ(id) {
  const recs = (G.fundingHistory || []).filter(h =>
    typeof h === 'string' ? h === id : h.id === id);
  if (!recs.length) return -Infinity;
  const last = recs[recs.length - 1];
  return typeof last === 'string' ? 0 : (last.histLen ?? 0);
}

// VC 라운드: 8분기(2년) 쿨다운 + equity > 5% 이면 반복 유치 가능
// 대출: 기본 금액은 신용등급 loanMult로 스케일, 이자율은 신용등급 rate 적용
// (아래 amount/annualRate는 BB 등급 기준값 — openFundingModal에서 동적 보정)
const FUNDING_OPTS = [
  {
    id: 'seed', label: '🌱 시드 투자 (엔젤)', badge: 'vc', badgeLabel: 'VC',
    amount: 300000, desc: '엔젤 투자자 유치. 초기 성장 자금을 확보합니다.',
    dilution: 8,
    // 시드는 게임 초반 한 번만 (창업 단계 특성상)
    cond: g => g.history.length <= 12 && getLastFundingQ('seed') === -Infinity,
    condMsg: '게임 시작 후 3년 이내 · 1회만 가능',
  },
  {
    id: 'seriesA', label: '🅐 시리즈 A',  badge: 'vc', badgeLabel: 'VC',
    amount: 2000000, desc: '벤처캐피털 시리즈 A 투자. 8분기 쿨다운 후 재유치 가능.',
    dilution: 18,
    cond: g => g.history.length
               && g.history[g.history.length-1].rev >= 200000
               && g.equity > 5
               && (g.history.length - getLastFundingQ('seriesA')) >= 8,
    condMsg: '분기 매출 $200K 이상 · 지분 5% 초과 · 마지막 유치 후 2년 경과',
  },
  {
    id: 'seriesB', label: '🅑 시리즈 B',  badge: 'vc', badgeLabel: 'VC',
    amount: 10000000, desc: '대규모 VC 투자. 글로벌 확장과 공격적 채용이 가능합니다. 반복 유치 가능.',
    dilution: 15,
    cond: g => g.history.length
               && g.history[g.history.length-1].rev >= 2000000
               && g.equity > 5
               && (g.history.length - getLastFundingQ('seriesB')) >= 8,
    condMsg: '분기 매출 $2M 이상 · 지분 5% 초과 · 마지막 유치 후 2년 경과',
  },
  {
    id: 'seriesC', label: '🅒 시리즈 C',  badge: 'vc', badgeLabel: 'VC',
    amount: 50000000, desc: '후기 성장 단계 대형 투자. 반복 유치 가능.',
    dilution: 12,
    cond: g => g.history.length
               && g.history[g.history.length-1].rev >= 20000000
               && g.equity > 5
               && (g.history.length - getLastFundingQ('seriesC')) >= 8,
    condMsg: '분기 매출 $20M 이상 · 지분 5% 초과 · 마지막 유치 후 2년 경과',
  },
  {
    id: 'ipo', label: '🏛 IPO (기업공개)', badge: 'ipo', badgeLabel: 'IPO',
    amount: 200000000, desc: '주식시장 상장. 대규모 공개 자금 조달. 공개 기업 의무가 부과됩니다.',
    dilution: 20,
    cond: g => g.history.length && g.history[g.history.length-1].rev >= 100000000
               && g.equity > 30 && !g.ipo,
    condMsg: '분기 매출 $100M 이상 & 지분 30% 초과 보유 필요 · 1회만 가능',
  },
  {
    // 기준 금액: BB 등급 기준. 실제 표시는 신용등급 loanMult 적용
    id: 'loan_sm', label: '🏦 소기업 대출', badge: 'loan', badgeLabel: '대출',
    amount: 500000, quarters: 8,  annualRate: 0.105, // BB 기준
    desc: '은행 중소기업 대출. 8분기(2년) 분할 상환. 신용등급에 따라 한도·금리 변동.',
    cond: g => g.loans.filter(l=>l.type==='loan_sm').length < 2,
    condMsg: '소기업 대출 2건 동시 한도 초과',
  },
  {
    id: 'loan_md', label: '🏦 중기업 대출', badge: 'loan', badgeLabel: '대출',
    amount: 5000000, quarters: 12, annualRate: 0.105,
    desc: '은행 중기업 대출. 12분기(3년) 분할 상환. 신용등급에 따라 한도·금리 변동.',
    cond: g => g.history.length && g.history[g.history.length-1].rev >= 1000000
               && g.loans.filter(l=>l.type==='loan_md').length === 0,
    condMsg: '분기 매출 $1M 이상 · 동일 대출 상환 중 중복 불가',
  },
  {
    id: 'loan_lg', label: '🏦 대기업 대출', badge: 'loan', badgeLabel: '대출',
    amount: 50000000, quarters: 16, annualRate: 0.105,
    desc: '대형 신디케이트 대출. 16분기(4년) 분할 상환. 신용등급에 따라 한도·금리 변동.',
    cond: g => g.history.length && g.history[g.history.length-1].rev >= 50000000
               && g.loans.filter(l=>l.type==='loan_lg').length === 0,
    condMsg: '분기 매출 $50M 이상 · 동일 대출 상환 중 중복 불가',
  },
  {
    id: 'loan_emergency', label: '🚨 긴급 브릿지 대출', badge: 'loan', badgeLabel: '긴급',
    amount: 200000, quarters: 6, annualRate: 0.28,
    desc: '조건 없이 언제든 가능한 단기 긴급 대출. 연 28% 고금리 · 6분기 상환. 파산 직전 최후 수단.',
    cond: g => g.loans.filter(l => l.type === 'loan_emergency').length < 3,
    condMsg: '긴급 대출 3건 동시 한도 초과',
  },
];

function openFundingModal() {
  const totalLoan = (G.loans || []).reduce((s,l) => s + l.qPay * l.quartersLeft, 0);
  document.getElementById('fm-equity').textContent = (G.equity||100).toFixed(1)+'%';
  document.getElementById('fm-loans').textContent  = totalLoan > 0 ? fmt(totalLoan)+' 잔여' : '없음';

  // 신용등급 표시
  const cr    = getCreditRating();
  const crp   = CREDIT_PARAMS[cr.grade];
  const fmCrEl = document.getElementById('fm-credit');
  if (fmCrEl) {
    fmCrEl.innerHTML =
      `신용등급 <strong style="color:${crp.color}">${cr.grade}</strong>` +
      ` <span style="opacity:.65">(${crp.label} · 점수 ${cr.score})</span>` +
      ` &nbsp;·&nbsp; 대출금리 <strong>${(crp.rate*100).toFixed(1)}%</strong>` +
      ` &nbsp;·&nbsp; 한도배율 <strong>×${crp.loanMult}</strong>`;
  }

  const eraMult = getFundingEraMult();
  const dm2     = G.diffMults || DIFF_MULTS.normal;
  const isCrisis = (G.cash || 0) < 0; // 현금 위기 여부

  const renderOpt = opt => {
    const ok = opt.cond(G);

    // 긴급 대출은 신용등급 배율 미적용 (고정 고금리 상품)
    const isEmergency = opt.id === 'loan_emergency';
    const isLoan      = !!opt.quarters;
    const loanMult    = (isLoan && !isEmergency) ? crp.loanMult : 1;
    const loanRate    = (isLoan && !isEmergency) ? crp.rate * dm2.loanRate : opt.annualRate;
    const scaledAmt   = Math.round(opt.amount * eraMult * loanMult);

    const effDil  = opt.dilution ? Math.min(50, opt.dilution * dm2.vcDil) : 0;
    const effRate = loanRate || 0;

    let cooldownNote = '';
    if (opt.badge === 'vc' && opt.id !== 'seed' && opt.id !== 'ipo') {
      const lastQ    = getLastFundingQ(opt.id);
      const elapsed  = lastQ === -Infinity ? Infinity : G.history.length - lastQ;
      const remaining = Math.max(0, 8 - elapsed);
      if (remaining > 0)
        cooldownNote = `<div class="fo-cond" style="color:var(--amber)">⏳ 재유치 가능까지 ${remaining}분기</div>`;
      else if (lastQ !== -Infinity)
        cooldownNote = `<div class="fo-cond" style="color:var(--green)">✅ 재유치 가능 (이전 유치: ${elapsed}분기 전)</div>`;
    }

    const crNote  = (isLoan && !isEmergency) ? ` (신용등급 ${cr.grade})` : '';
    const detailText = opt.dilution
      ? `+${fmt(scaledAmt)} 현금 · 지분 ${effDil.toFixed(0)}% 희석`
      : `+${fmt(scaledAmt)} · ${opt.quarters}분기 상환 · 연 ${(effRate*100).toFixed(1)}%${crNote}`;
    const eraTag = eraMult > 1.5 ? ` <span style="font-size:9px;color:var(--muted)">(${G.year}년 기준)</span>` : '';
    const emStyle = isEmergency ? ' style="border-color:var(--red);background:rgba(239,68,68,0.06)"' : '';

    return `<div class="fund-option ${ok?'':'disabled'}"${emStyle} ${ok?`onclick="applyFunding('${opt.id}')"`:''}>
      <div class="fo-header">
        <span class="fo-title">${opt.label}</span>
        <span class="fo-badge ${opt.badge}">${opt.badgeLabel}</span>
      </div>
      <div class="fo-amount">${fmt(scaledAmt)} ${opt.dilution ? '조달' : '대출'}${eraTag}</div>
      <div class="fo-detail">${detailText}</div>
      <div class="fo-detail">${opt.desc}</div>
      ${cooldownNote}
      ${!ok ? `<div class="fo-cond">🔒 ${opt.condMsg}</div>` : ''}
    </div>`;
  };

  // 가능한 옵션 먼저, 잠긴 옵션 나중에 — 긴급 대출은 항상 맨 위
  const emergency  = FUNDING_OPTS.filter(o => o.id === 'loan_emergency');
  const available  = FUNDING_OPTS.filter(o => o.id !== 'loan_emergency' &&  o.cond(G));
  const locked     = FUNDING_OPTS.filter(o => o.id !== 'loan_emergency' && !o.cond(G));

  const crisisHeader = isCrisis
    ? `<div style="background:rgba(239,68,68,0.12);border:1px solid var(--red);border-radius:6px;
                   padding:8px 12px;margin-bottom:12px;font-size:11px;color:var(--red);font-weight:600">
         🚨 현금 부족 — 즉시 자금 조달이 필요합니다
       </div>`
    : '';

  const lockedSection = locked.length
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line2);
                   font-size:10px;color:var(--muted);margin-bottom:4px">
         🔒 현재 조건 미충족 옵션
       </div>${locked.map(renderOpt).join('')}`
    : '';

  const html = crisisHeader
    + emergency.map(renderOpt).join('')
    + available.map(renderOpt).join('')
    + lockedSection;

  document.getElementById('fund-options').innerHTML = html;
  document.getElementById('fund-modal').classList.add('open');
}

function applyFunding(id) {
  const opt = FUNDING_OPTS.find(o => o.id === id);
  if (!opt || !opt.cond(G)) return;

  const eraMult = getFundingEraMult();
  const dm      = G.diffMults || DIFF_MULTS.normal;
  const cr      = getCreditRating();
  const crp     = CREDIT_PARAMS[cr.grade];
  const isLoan  = !!opt.quarters;

  // 대출은 신용등급 loanMult, 긴급 대출·VC는 배율 없음
  const isEmergency = opt.id === 'loan_emergency';
  const loanMult  = (isLoan && !isEmergency) ? crp.loanMult : 1;
  const scaledAmt = Math.round(opt.amount * eraMult * loanMult);
  G.cash += scaledAmt;

  if (opt.dilution) {
    // VC/IPO: 희석률에 난이도 배율 적용
    const effectiveDil = Math.min(50, opt.dilution * dm.vcDil);
    G.equity = G.equity * (1 - effectiveDil / 100);
    // fundingHistory: {id, histLen} 형태로 저장 (반복 유치 쿨다운 추적)
    G.fundingHistory.push({ id, histLen: G.history.length });
    if (id === 'ipo') G.ipo = true;
    const dilLabel = dm.vcDil !== 1 ? ` (난이도 보정 ${effectiveDil.toFixed(0)}%)` : '';
    pushNews(
      `💰 ${opt.label} 완료! +${fmt(scaledAmt)} 현금 유치 · 지분 ${G.equity.toFixed(1)}% 보유${dilLabel}`,
      'good'
    );
  } else {
    // 대출: 긴급 대출은 고정 고금리, 일반 대출은 신용등급 금리 × 난이도 배율
    const effectiveRate = isEmergency ? opt.annualRate : crp.rate * dm.loanRate;
    const rate = effectiveRate / 4;
    const q    = opt.quarters;
    const qPay = scaledAmt * rate / (1 - Math.pow(1 + rate, -q));
    G.loans.push({
      type: id, name: opt.label, principal: scaledAmt,
      qPay: Math.round(qPay), quartersLeft: q,
    });
    pushNews(
      `🏦 ${opt.label} 실행! +${fmt(scaledAmt)} · 연 ${(effectiveRate*100).toFixed(1)}% (신용등급 ${cr.grade}) · 분기 상환 ${fmt(Math.round(qPay))}`,
      'info'
    );
  }

  closeFundingModal();
  renderAll();
}

function closeFundingModal() {
  document.getElementById('fund-modal').classList.remove('open');
}

// ─── ACQUISITION SYSTEM ──────────────────────────────────

function openAcquisitionModal(idx) {
  const c       = G.competitors[idx];
  if (!c || !c.alive) return;

  const val      = getValuation(c);
  const premium  = 1.5;
  const price    = Math.round(val * premium);
  const absorbed = Math.round(c.employees * 0.80); // 20% churn during acquisition
  const qGain    = Math.round((c.quality - G.quality) * 0.4);
  const bGain    = Math.round((c.brand   - G.brand)   * 0.35);
  const tGain    = Math.round((c.tech    - G.tech)     * 0.4);
  const canAfford = G.cash >= price;

  const warningHtml = !canAfford
    ? `<div style="background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);
         border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:var(--red)">
         ⚠ 현금 부족 — 필요: ${fmt(price)} / 보유: ${fmt(G.cash)}
       </div>` : '';

  const percentCash = G.cash > 0 ? Math.round(price / G.cash * 100) : 999;
  const cashWarnHtml = canAfford && percentCash > 60
    ? `<div style="background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.3);
         border-radius:6px;padding:8px 12px;margin-bottom:12px;font-size:11px;color:var(--amber)">
         ⚠ 현금의 ${percentCash}%를 사용합니다. 운영 자금을 확인하세요.
       </div>` : '';

  document.getElementById('acq-target-name').textContent = c.icon + ' ' + c.name;
  document.getElementById('acq-ipo-badge').style.display = c.ipo ? '' : 'none';
  document.getElementById('acq-ipo-badge').textContent   = c.ipo ? `📈 상장사 (${c.ipoYear})` : '';

  document.getElementById('acq-details').innerHTML = `
    <div class="acq-grid">
      <div class="acq-stat"><div class="acq-s-label">분기 매출</div><div class="acq-s-val">${fmt(c.revenue)}</div></div>
      <div class="acq-stat"><div class="acq-s-label">순이익</div><div class="acq-s-val" style="color:${c.profit>=0?'var(--green)':'var(--red)'}">${c.profit>=0?'+':''}${fmt(c.profit)}</div></div>
      <div class="acq-stat"><div class="acq-s-label">현금</div><div class="acq-s-val">${fmt(c.cash)}</div></div>
      <div class="acq-stat"><div class="acq-s-label">직원</div><div class="acq-s-val">${c.employees}명</div></div>
      <div class="acq-stat"><div class="acq-s-label">품질</div><div class="acq-s-val">${Math.round(c.quality)}/100</div></div>
      <div class="acq-stat"><div class="acq-s-label">기술력</div><div class="acq-s-val">${Math.round(c.tech)}/100</div></div>
    </div>
    <div class="acq-price-section">
      <div class="acq-price-row"><span>기업가치(ARR × ${lerp(REV_MULTIPLE,G.year).toFixed(1)}배)</span><span>${fmt(val)}</span></div>
      <div class="acq-price-row"><span>인수 프리미엄</span><span>× ${premium.toFixed(1)}</span></div>
      <div class="acq-price-row acq-total"><span>총 인수 비용</span><span style="color:var(--amber)">${fmt(price)}</span></div>
    </div>
    ${warningHtml}${cashWarnHtml}
    <div class="acq-gain-section">
      <div style="font-size:10px;color:var(--muted);margin-bottom:6px">인수 후 효과</div>
      <div class="acq-gain-row">👥 직원 +${absorbed}명 <span style="color:var(--muted);font-size:9px">(인수 이탈 20% 제외)</span></div>
      ${qGain > 0 ? `<div class="acq-gain-row">🔵 품질 +${qGain}</div>` : ''}
      ${bGain > 0 ? `<div class="acq-gain-row">🟢 브랜드 +${bGain}</div>` : ''}
      ${tGain > 0 ? `<div class="acq-gain-row">🟣 기술력 +${tGain}</div>` : ''}
      <div class="acq-gain-row" style="color:var(--amber)">💛 직원 사기 -8 (통합 진통)</div>
    </div>`;

  document.getElementById('acq-confirm-btn').disabled = !canAfford;
  document.getElementById('acq-confirm-btn').onclick   = () => executeAcquisition(idx);
  document.getElementById('acq-modal').classList.add('open');
}

function executeAcquisition(idx) {
  const c     = G.competitors[idx];
  if (!c || !c.alive) return;

  const val   = getValuation(c);
  const price = Math.round(val * 1.5);
  if (G.cash < price) return;

  G.cash -= price;

  // Absorb stats (weighted merge, 20% churn)
  const absorbed = Math.round(c.employees * 0.80);
  G.employees   += absorbed;
  G.quality      = Math.min(200, G.quality  + Math.round((c.quality - G.quality) * 0.4));
  G.brand        = Math.min(200, G.brand    + Math.round((c.brand   - G.brand)   * 0.35));
  G.tech         = Math.min(200, G.tech     + Math.round((c.tech    - G.tech)    * 0.4));
  G.morale       = Math.max(0,   G.morale   - 8); // integration friction

  // Remove competitor
  c.alive       = false;
  c.marketShare = 0;
  c._acquired   = true;

  pushNews(`🤝 ${c.name} 인수 완료! 비용 ${fmt(price)} · 직원 +${absorbed}명 흡수`, 'good');
  document.getElementById('acq-modal').classList.remove('open');
  renderAll();
}

function closeAcquisitionModal() {
  document.getElementById('acq-modal').classList.remove('open');
}

function renderFundingStatus() {
  if (!G) return;
  const eq = (G.equity || 100);
  document.getElementById('fs-equity').textContent = eq.toFixed(1)+'%';
  const totalQPay = (G.loans || []).reduce((s,l) => s + l.qPay, 0);
  const loanRow = document.getElementById('fs-loan-row');
  if (totalQPay > 0) {
    loanRow.style.display = '';
    document.getElementById('fs-loan-pay').textContent = fmt(totalQPay)+'/분기';
  } else {
    loanRow.style.display = 'none';
  }
  // Show new product button when product is in decline
  const launchBtn = document.getElementById('btn-launch');
  if (launchBtn) launchBtn.style.display = G.productStage === 'decline' ? 'block' : 'none';
}

function launchNewProduct() {
  const cost = Math.max(100000, G.employees * getSalary(G.year) / 8);
  if (G.cash < cost) {
    pushNews(`💸 신제품 출시 실패 — 자금 부족 (필요: ${fmt(cost)})`, 'bad');
    return;
  }
  G.cash -= cost;
  G.productStage  = 'intro';
  G.productStageQ = 0;
  G.quality = Math.min(200, G.quality + 12);
  G.tech    = Math.min(200, G.tech    + 6);
  pushNews(`🚀 ${G.productName} 신버전 출시! 비용 ${fmt(cost)} · 제품 품질 리셋`, 'good');
  renderAll();
}

function checkAndFireEvent() {
  // Find event matching current year/quarter that hasn't fired
  const ev = EVENTS.find(e => e.y === G.year && e.q === G.quarter
                           && !G.firedEvents.has(`${e.y}-${e.q}`));
  if (!ev) return false;
  G.firedEvents.add(`${ev.y}-${ev.q}`);
  pendingEvent = ev;
  showEventModal(ev);
  return true;
}

function showEventModal(ev) {
  document.getElementById('ev-era-tag').textContent = getCurrentEra().name + ' — 이벤트 발생';
  const badge = document.getElementById('ev-type-badge');
  const typeLabels = { opportunity:'기회', crisis:'위기', revolution:'혁명', boom:'호황', shift:'패러다임 전환' };
  badge.textContent  = typeLabels[ev.type] || ev.type;
  badge.className    = 'modal-type-badge ' + ev.type;
  document.getElementById('ev-title').textContent = ev.title;
  document.getElementById('ev-body').textContent  = ev.desc;

  // Clean up any previous debt warning from last event
  const prevWarn = document.getElementById('ev-debt-warning');
  if (prevWarn) prevWarn.remove();

  // ── 기술 부채 경고: 새 혁명/전환 이벤트 + 미해소 부채 → 비용 폭증 알림 ──
  const evBodyEl = document.getElementById('ev-body');
  const activeDebts = (G.techDebt || []).filter(d => !d.resolved);
  if ((ev.type === 'revolution' || ev.type === 'shift') && !ev._catchup && activeDebts.length > 0) {
    let debtTotalFrac = 0;
    const debtLines = activeDebts.map(d => {
      const periods  = Math.floor(d.quartDebt / 4);
      const addFrac  = +(d.baseFrac * (1 + periods * 0.40)).toFixed(2);
      debtTotalFrac += addFrac;
      return `• ${d.title}: +${Math.round(addFrac * 100)}% (${d.quartDebt}분기 누적)`;
    }).join('\n');
    const debtWarnEl = document.createElement('div');
    debtWarnEl.id = 'ev-debt-warning';
    debtWarnEl.className = 'tech-debt-event-warning';
    debtWarnEl.innerHTML =
      `⚠️ <strong>기술 부채 자동 청산 경고</strong><br>` +
      `투자를 선택하면 아래 기술 부채가 자동 청산됩니다 (추가 비용 발생):<br>` +
      `<pre style="margin:4px 0;font-size:10px;color:var(--amber)">${debtLines}</pre>` +
      `<strong>총 추가 비용: 분기매출의 ${Math.round(debtTotalFrac * 100)}% 추가 지출</strong>`;
    evBodyEl.after(debtWarnEl);
  }

  // ── 혁명/전환 이벤트: 투자 선택지에 기술 부채 청산 비용 포함 표시 ──
  const debtAddFrac = (!ev._catchup && (ev.type === 'revolution' || ev.type === 'shift'))
    ? activeDebts.reduce((sum, d) => {
        const p = Math.floor(d.quartDebt / 4);
        return sum + d.baseFrac * (1 + p * 0.40);
      }, 0)
    : 0;

  // 이 이벤트의 역사적 최소 투자금 배열 조회
  const evFloors = EVENT_FLOOR_DB[`${ev.y}_${ev.q}`] || [];

  const choicesEl = document.getElementById('ev-choices');
  choicesEl.innerHTML = (ev.choices || []).map((c,i) => {
    const floorM     = evFloors[i] || 0;
    const actualCost = getEventChoiceCost(c.cost, floorM);
    // For investing options in revolution events, show total cost (own + debt clearance)
    const debtExtra  = (debtAddFrac > 0 && (c.cost || 0) > 0)
      ? getEventChoiceCost(debtAddFrac) : 0;
    const totalDisplayCost = actualCost + debtExtra;
    const minEmp     = getEventChoiceMinEmp(c.cost);

    // 요건 충족 여부 — check against TOTAL cost including debt
    const canAfford  = totalDisplayCost <= 0 || G.cash >= totalDisplayCost;
    const hasStaff   = minEmp <= 0 || G.employees >= minEmp;
    const canDo      = canAfford && hasStaff;

    // 비용 표시 (분기 매출 대비 비율 함께 표시)
    let costLabel;
    if (totalDisplayCost <= 0) {
      costLabel = '투자금 없음';
    } else {
      const fracOnly = (() => {
        if (!c.cost || c.cost <= 0) return 0;
        const lqr = G.history.length ? G.history[G.history.length - 1].rev : 0;
        const mf   = getMarketSize(G.year, G.quarter) * 0.0004;
        return Math.round(Math.max(lqr * 4, mf) * c.cost);
      })();
      const isFloorActive = floorM > 0 && actualCost > fracOnly;
      const pct = c.cost > 0 ? `연매출의 ${Math.round(c.cost * 100)}%` : '';
      const floorNote = isFloorActive ? ` · 역사적 최소 $${floorM >= 1000 ? (floorM/1000).toFixed(1)+'B' : floorM+'M'} 적용` : '';
      const debtPct = debtExtra > 0 ? ` + 부채청산 ${fmt(debtExtra)}` : '';
      costLabel = `투자금: ${fmt(actualCost)}${pct ? ` (${pct}${floorNote})` : ''}${debtPct}` +
        (debtExtra > 0 ? ` = 총 ${fmt(totalDisplayCost)}` : '');
    }

    // 요건 안내
    const reqParts = [];
    if (minEmp > 0) {
      const staffOk = G.employees >= minEmp;
      reqParts.push(`<span class="choice-req${staffOk ? '' : ' unmet'}">` +
        `직원 ${minEmp}명 이상 필요 (현재 ${G.employees}명${staffOk ? ' ✓' : ' ✗'})` +
        `</span>`);
    }
    if (!canAfford) {
      reqParts.push(`<span class="choice-req unmet">현금 부족 (필요 ${fmt(totalDisplayCost)})</span>`);
    }
    const reqHtml = reqParts.join('');

    // 효과 미리보기
    const effLines = [];
    if (c.effect) {
      const e = c.effect;
      if (e.quality)   effLines.push(`품질 ${e.quality > 0 ? '+' : ''}${Math.round(e.quality)}`);
      if (e.brand)     effLines.push(`브랜드 ${e.brand > 0 ? '+' : ''}${Math.round(e.brand)}`);
      if (e.tech)      effLines.push(`기술력 ${e.tech > 0 ? '+' : ''}${Math.round(e.tech)}`);
      if (e.employees !== undefined) {
        if (e.employees < 0) {
          // 실제 감축 인원 계산 (applyEventChoice와 동일 공식)
          const crisisMult = (G.diffMults && G.diffMults.crisis) || 1.0;
          const layoffPct  = Math.min(0.70, Math.abs(e.employees) * 0.10 * crisisMult);
          const layoffN    = Math.max(1, Math.round(G.employees * layoffPct));
          effLines.push(`직원 -${layoffN}명 (${Math.round(layoffPct*100)}% 감축)`);
        } else if (e.employees > 0) {
          effLines.push(`직원 +${e.employees}명`);
        }
      }
    }
    const effPreview = effLines.length
      ? `<span class="choice-effects">${effLines.join(' · ')}</span>`
      : '';

    return `
    <button class="choice-btn" onclick="applyEventChoice(${i})" ${canDo ? '' : 'disabled'}>
      ${c.label}
      <span class="choice-cost">${costLabel}</span>
      ${reqHtml}
      ${effPreview}
    </button>`;
  }).join('');

  // ── 모든 선택지가 불가능할 때: 대응 불가 버튼 자동 추가 ──
  // 현금 부족 + 인력 부족으로 아무 선택도 못하면 게임이 멈추는 것을 방지
  const allBlocked = (ev.choices || []).every((c, i) => {
    const floorM_     = (EVENT_FLOOR_DB[`${ev.y}_${ev.q}`] || [])[i] || 0;
    const cost_       = getEventChoiceCost(c.cost, floorM_);
    const debtExtra_  = (debtAddFrac > 0 && (c.cost || 0) > 0) ? getEventChoiceCost(debtAddFrac) : 0;
    const totalCost_  = cost_ + debtExtra_;
    const canAfford_  = totalCost_ <= 0 || G.cash >= totalCost_;
    const hasStaff_   = getEventChoiceMinEmp(c.cost) <= 0 || G.employees >= getEventChoiceMinEmp(c.cost);
    return !(canAfford_ && hasStaff_);
  });

  if (allBlocked) {
    choicesEl.innerHTML += `
    <button class="choice-btn choice-skip" onclick="applyEventSkip()" style="margin-top:8px;border-color:var(--red);opacity:0.85">
      🚨 대응 불가 — 현금·인력 부족으로 이벤트 패스
      <span class="choice-cost" style="color:var(--red)">추가 패널티: 브랜드 -3 · 품질 -2</span>
      <span class="choice-effects">이벤트 기본 효과(시장 위축 등)는 그대로 적용됨</span>
    </button>`;
  }

  document.getElementById('ev-modal').classList.add('open');
}

function applyEventSkip() {
  const ev = pendingEvent;
  if (!ev) return;

  // 이벤트 market/cash effects만 적용 (선택지 효과는 없음)
  if (ev.effects) {
    if (ev.effects.marketMult)  { G.eventMarketMult = ev.effects.marketMult; G.eventBoostQ = 16; }
    if (ev.effects.prodBonus)   { G.eventProdBonus  = 1 + ev.effects.prodBonus; }
    if (ev.effects.cashPenalty) G.cash *= (1 - ev.effects.cashPenalty);
    if (ev.effects.cashBonus)   G.cash *= (1 + ev.effects.cashBonus);
  }

  // 추가 패널티: 대응 못한 것에 대한 브랜드·품질 하락
  G.brand   = Math.max(0, G.brand   - 3);
  G.quality = Math.max(1, G.quality - 2);

  pushNews(`⛔ ${ev.title}: 현금·인력 부족으로 대응 불가 — 브랜드·품질 추가 하락`, 'bad');

  document.getElementById('ev-modal').classList.remove('open');
  pendingEvent = null;

  if (_pendingTurn) _executeTurn();
  else renderAll();
}

function applyEventChoice(i) {
  const ev  = pendingEvent;
  if (!ev)  return;
  const ch  = ev.choices[i];

  // 요건 재검증 (disabled 버튼을 JS로 우회하는 경우 방어)
  const evFloorArr = EVENT_FLOOR_DB[`${ev.y}_${ev.q}`] || [];
  const floorM     = evFloorArr[i] || 0;
  const actualCost = getEventChoiceCost(ch.cost, floorM);
  const minEmp     = getEventChoiceMinEmp(ch.cost);
  // Note: actualCost alone doesn't include debt clearing cost — full check is done below
  if (minEmp > 0 && G.employees < minEmp) return;

  // Apply effect
  if (ch.effect) {
    const e = ch.effect;
    if (e.quality)   G.quality   = Math.min(200, G.quality   + Math.round(e.quality));
    if (e.brand)     G.brand     = Math.min(200, G.brand     + Math.round(e.brand));
    if (e.tech)      G.tech      = Math.min(200, G.tech      + Math.round(e.tech));
    if (e.employees !== undefined) {
      if (e.employees < 0) {
        // 인원 감축: 이벤트 수치 → 현 인원 대비 비율 (난이도별 위기 강도 반영)
        // 보통: -1=10%, -2=20%, -3=30%, -4=40%, -5=50%
        // 어려움(×1.8): -1=18%, -2=36%, -3=54%...  쉬움(×0.5): -1=5%...
        const crisisMult = (G.diffMults && G.diffMults.crisis) || 1.0;
        const layoffPct  = Math.min(0.70, Math.abs(e.employees) * 0.10 * crisisMult);
        const layoff     = Math.max(1, Math.round(G.employees * layoffPct));
        G.employees      = Math.max(1, G.employees - layoff);
        // 퇴직금/일시해고 비용: 해고 1인당 분기 급여 × 1.0배
        const severance  = layoff * getSalary(G.year) / 4 * 1.0;
        G.cash          -= severance;
        pushNews(
          `✂️ 대규모 구조조정: ${layoff}명 감축 (${Math.round(layoffPct*100)}%) · 퇴직금 ${fmt(severance)}`,
          'bad'
        );
      } else if (e.employees > 0) {
        G.employees = Math.max(1, G.employees + e.employees);
      }
    }
  }

  // ── Tech debt: charge existing debt catch-up cost when investing in new revolution/shift ──
  // If player invests in a revolution/shift event AND has unresolved debt,
  // the debt catch-up cost is automatically added (they're paying to catch up AND move forward).
  let debtClearCost = 0;
  if ((ev.type === 'revolution' || ev.type === 'shift') && !ev._catchup && (ch.cost || 0) > 0) {
    (G.techDebt || []).forEach(debt => {
      if (debt.resolved) return;
      const periods  = Math.floor(debt.quartDebt / 4);
      const addFrac  = debt.baseFrac * (1 + periods * 0.40);
      debtClearCost += getEventChoiceCost(addFrac);
    });
  }

  const totalCost = actualCost + debtClearCost;
  if (totalCost > 0 && G.cash < totalCost) {
    // Re-validate with debt included
    pushNews(`💸 현금 부족 — 기존 기술 부채 포함 총 ${fmt(totalCost)} 필요`, 'bad');
    return;
  }

  if (actualCost > 0) G.cash -= actualCost;

  // Settle tech debt compounding cost when investing in a new revolution
  if (debtClearCost > 0) {
    G.cash -= debtClearCost;
    const resolved = G.techDebt.filter(d => !d.resolved);
    resolved.forEach(d => { d.resolved = true; });
    pushNews(`💸 기술 부채 자동 청산 (+${fmt(debtClearCost)}) — ${resolved.length}건 해소`, 'bad');
  }

  // ── Catch-up event resolution ──
  if (ev._catchup) {
    const debt = G.techDebt[ev._debtIdx];
    if (debt) {
      if (ch._resolveFull) {
        debt.resolved = true;
        pushNews(`✅ ${debt.title} 기술 부채 완전 해소!`, 'good');
      } else if (ch._resolvePartial) {
        debt.baseFrac *= 0.45; // 55% reduction in remaining debt
        debt._lastCatchupQ = -1; // reset so next catch-up fires after 4 more quarters
        pushNews(`⚡ ${debt.title} 부분 추격 완료 — 기술 부채 절반 이상 감소`, 'good');
      } else {
        pushNews(`⏳ ${debt.title} 추격 연기 — 4분기 후 더 비싸진 기회가 제공됩니다`, 'warn');
      }
    }
  }

  // ── Record NEW tech debt if player under-invested in a revolution/shift event ──
  if ((ev.type === 'revolution' || ev.type === 'shift') && !ev._catchup) {
    const maxCost    = Math.max(...(ev.choices || []).map(c => c.cost || 0));
    const missedFrac = +(maxCost - (ch.cost || 0)).toFixed(2);
    if (missedFrac > 0.04) {
      G.techDebt.push({
        title:          ev.title,
        baseFrac:       missedFrac,
        quartDebt:      0,
        resolved:       false,
        _lastCatchupQ:  -1,
      });
      const severity = missedFrac > 0.6 ? '심각한' : missedFrac > 0.2 ? '상당한' : '경미한';
      pushNews(
        `🕰️ ${ev.title}: ${severity} 기술 부채 발생 (미투자 ${Math.round(missedFrac*100)}%) ` +
        `— 매 분기 품질·기술·브랜드 지속 하락`,
        missedFrac > 0.3 ? 'bad' : 'warn'
      );
    }
  }

  // Market effect
  if (ev.effects) {
    if (ev.effects.marketMult)  { G.eventMarketMult = ev.effects.marketMult; G.eventBoostQ = 16; }
    if (ev.effects.prodBonus)   { G.eventProdBonus  = 1 + ev.effects.prodBonus; }
    if (ev.effects.cashBonus)   G.cash *= (1 + ev.effects.cashBonus);
    if (ev.effects.cashPenalty) G.cash *= (1 - ev.effects.cashPenalty);
  }

  const costStr = totalCost > 0 ? ` · 비용 ${fmt(totalCost)}` : '';
  pushNews(`⚡ ${ev.title}: "${ch.label.replace(/[^\w가-힣 ·!]/g,'').trim()}" 선택${costStr}`, 'info');

  document.getElementById('ev-modal').classList.remove('open');
  pendingEvent = null;

  // If an event fired mid-quarter (before turn execution), now run the turn
  if (_pendingTurn) _executeTurn();
  else renderAll();
}

function showResultsModal(info) {
  const { prevQ, prevY, news, costs } = info;
  const h = G.history[G.history.length-1];
  const prev = G.history.length > 1 ? G.history[G.history.length-2] : null;

  document.getElementById('res-q').textContent   = `Q${prevQ} ${prevY} — 결과`;
  document.getElementById('res-era').textContent  = getCurrentEra().name;

  // 경쟁사 간 상대 점유율 (합계 100%)
  const _namedSum = G.marketShare +
    G.competitors.reduce((s, c) => s + (c.alive ? (c.marketShare||0) : 0), 0);
  const _myRel = _namedSum > 0 ? (G.marketShare / _namedSum * 100) : 0;

  const margin = h.rev > 0 ? Math.round(h.profit / h.rev * 100) : 0;

  // 시대 실제 기업 이익률 벤치마크 비교
  const eraFin  = getEraFinancials();
  let marginTag = '';
  if (eraFin && h.rev > 0) {
    const eg = Math.round(eraFin.opMgGood  * 100);
    const ee = Math.round(eraFin.opMgElite * 100);
    const ew = Math.round(eraFin.opMgWeak  * 100);
    // 실제 기업 중 대표 레퍼런스 찾기
    const rep = eraFin.refs.length
      ? eraFin.refs.reduce((a, b) => Math.abs(b.opMg - eraFin.opMgElite) < Math.abs(a.opMg - eraFin.opMgElite) ? b : a)
      : null;
    const repStr = rep ? ` (${rep.co} ${rep.yr}: ${Math.round(rep.opMg*100)}%)` : '';
    if (margin >= ee)      marginTag = `🏆 최우수${repStr}`;
    else if (margin >= eg) marginTag = `✅ 양호 — 이 시대 평균 ${eg}% 상회`;
    else if (margin >= 0)  marginTag = `⚠️ 보통 — 목표 ${eg}%+`;
    else if (margin >= ew) marginTag = `🔴 적자 — 성장 투자 중`;
    else                   marginTag = `💸 심각한 적자`;
  }

  const grid = [
    { l:'분기 매출', v:fmt(h.rev),    d: prev ? delta(h.rev, prev.rev) : null },
    { l:'순이익', v:`${fmt(h.profit)} <span style="font-size:11px;opacity:.7">(${margin}%)</span>`, d: null },
    { l:'현금 잔고', v:fmt(h.cash),   d: null },
    { l:'시장점유율',v:_myRel.toFixed(1)+'%', d: prev ? shareDelta(h.share,prev.share) : null },
    { l:'직원 수',   v:h.emp+'명',    d: null },
    { l:'제품 품질', v:Math.round(h.quality)+'/100', d: null },
  ];

  document.getElementById('res-grid').innerHTML = grid.map(g=>`
    <div class="res-card">
      <div class="rc-label">${g.l}</div>
      <div class="rc-val">${g.v}</div>
      ${g.d?`<div class="rc-delta ${g.d.cls}">${g.d.str}</div>`:''}
    </div>`).join('');

  const newsHtml = news.map(n=>`<div>• ${n.t}: ${n.msg}</div>`).join('') || '특이사항 없음';
  document.getElementById('res-news').innerHTML = newsHtml;

  // 이익률 벤치마크 배지
  const mgTagEl = document.getElementById('res-margin-tag');
  if (mgTagEl) mgTagEl.textContent = marginTag;


  document.getElementById('res-modal').classList.add('open');
}

function closeResults() {
  document.getElementById('res-modal').classList.remove('open');
  if (G.gameOver) { showGameOver(); return; }
  // 분기 브리핑 모달 열기
  showBriefingModal();
}

// ═══════════════════════════════════════════════════════
// 비서 브리핑 시스템
// ═══════════════════════════════════════════════════════

let _briefTabs = [];
let _briefTabIdx = 0;

function showBriefingModal() {
  if (!G) return;
  const h    = G.history[G.history.length - 1];
  const prev = G.history.length > 1 ? G.history[G.history.length - 2] : null;

  // 비서 분위기 결정
  const margin = h.rev > 0 ? h.profit / h.rev : 0;
  let mood, moodEmoji;
  if (margin >= 0.20)       { mood = 'excellent'; moodEmoji = '😊'; }
  else if (margin >= 0.05)  { mood = 'good';      moodEmoji = '🙂'; }
  else if (margin >= 0)     { mood = 'neutral';   moodEmoji = '😐'; }
  else if (margin >= -0.15) { mood = 'concern';   moodEmoji = '😟'; }
  else                      { mood = 'urgent';    moodEmoji = '😰'; }

  document.getElementById('brief-mood').textContent  = moodEmoji;
  document.getElementById('brief-date').textContent  =
    `Q${G.history.length > 0 ? (((G.history.length-1) % 4) + 1) : G.quarter} ${G.year} — 분기 브리핑`;

  // 탭 콘텐츠 생성
  _briefTabs = [
    { label:'📊 실적',  html: _briefPerformance(h, prev, mood) },
    { label:'⚔️ 경쟁',  html: _briefCompetitors(h) },
    { label:'💰 자금',  html: _briefFinance(h) },
    { label:'🧭 전략',  html: _briefStrategy(h, prev, mood) },
  ];

  _briefTabIdx = 0;
  _renderBriefTab(0);

  // 탭 버튼 동기화
  document.querySelectorAll('.brief-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === 0);
  });
  _updateBriefFooter();

  document.getElementById('brief-modal').classList.add('open');
}

function _renderBriefTab(idx) {
  document.getElementById('brief-body').innerHTML = _briefTabs[idx].html;
  document.querySelectorAll('.brief-tab').forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
  _updateBriefFooter();
}

function briefTab(idx) {
  _briefTabIdx = idx;
  _renderBriefTab(idx);
}

function briefNextTab() {
  if (_briefTabIdx < _briefTabs.length - 1) {
    _briefTabIdx++;
    _renderBriefTab(_briefTabIdx);
  }
}

function _updateBriefFooter() {
  const isLast = _briefTabIdx === _briefTabs.length - 1;
  document.getElementById('brief-next-btn').style.display  = isLast ? 'none' : '';
  document.getElementById('brief-close-btn').style.display = isLast ? ''     : 'none';
}

function closeBrief() {
  document.getElementById('brief-modal').classList.remove('open');
  renderAll();
}

// ── 탭1: 실적 브리핑 ──────────────────────────────────────────────────────
function _briefPerformance(h, prev, mood) {
  const revDelta   = prev ? ((h.rev - prev.rev) / Math.max(prev.rev, 1) * 100).toFixed(1) : null;
  const shareDelta = prev ? ((h.share - prev.share) * 100).toFixed(2) : null;
  const margin     = h.rev > 0 ? Math.round(h.profit / h.rev * 100) : 0;

  const kpiCards = [
    { label:'분기 매출',   val: fmt(h.rev),
      delta: revDelta !== null ? (revDelta >= 0 ? `▲ ${revDelta}%` : `▼ ${Math.abs(revDelta)}%`) : null,
      pos: revDelta >= 0 },
    { label:'순이익 (마진)', val: `${fmt(h.profit)} (${margin}%)`,
      delta: margin >= 0 ? '흑자' : '적자', pos: margin >= 0 },
    { label:'시장점유율',  val: (h.share * 100).toFixed(2) + '%',
      delta: shareDelta !== null ? (shareDelta >= 0 ? `▲ ${shareDelta}%p` : `▼ ${Math.abs(shareDelta)}%p`) : null,
      pos: shareDelta >= 0 },
    { label:'현금 잔고',   val: fmt(h.cash), delta: null, pos: true },
  ];

  const kpiHtml = `
    <div class="brief-kpi-row">
      ${kpiCards.map(k => `
        <div class="brief-kpi">
          <div class="brief-kpi-label">${k.label}</div>
          <div class="brief-kpi-val">${k.val}</div>
          ${k.delta ? `<div class="brief-kpi-delta ${k.pos ? 'pos' : 'neg'}">${k.delta}</div>` : ''}
        </div>`).join('')}
    </div>`;

  // 비서 코멘트
  const commentLines = [];
  if (mood === 'excellent')
    commentLines.push(`이번 분기도 매우 훌륭한 실적입니다, 대표님. 영업이익률 <strong>${margin}%</strong>는 업계 최상위 수준이에요.`);
  else if (mood === 'good')
    commentLines.push(`안정적인 분기였습니다. 매출 <strong>${fmt(h.rev)}</strong>로 전분기 대비 ${revDelta !== null ? revDelta + '%' : '—'} 성장했어요.`);
  else if (mood === 'neutral')
    commentLines.push(`수익성이 다소 낮습니다. 비용 구조를 점검하거나 가격 포지셔닝 조정을 검토해 보세요.`);
  else if (mood === 'concern')
    commentLines.push(`적자가 지속되고 있습니다. 현금 소진 속도에 주의가 필요합니다. 자금 탭을 확인해 주세요.`);
  else
    commentLines.push(`⚠️ 대표님, 상황이 위급합니다. 즉각적인 비용 절감과 자금 조달이 필요합니다.`);

  if (prev && h.share < prev.share)
    commentLines.push(`시장점유율이 <strong>${(Math.abs(h.share - prev.share)*100).toFixed(2)}%p</strong> 하락했습니다. 경쟁사 탭을 확인해 주세요.`);
  if (h.quality >= 80)
    commentLines.push(`제품 품질 점수 <strong>${Math.round(h.quality)}/100</strong> — 고객 만족도가 높게 유지되고 있습니다.`);

  return `
    <div class="brief-section">
      <div class="brief-section-title">핵심 지표</div>
      ${kpiHtml}
    </div>
    <div class="brief-bubble">${commentLines.join('<br>')}</div>`;
}

// ── 탭2: 경쟁사 브리핑 ──────────────────────────────────────────────────────
function _briefCompetitors(h) {
  const alive = G.competitors.filter(c => c.alive);
  const dead  = G.competitors.filter(c => !c.alive);

  // 절대 점유율 기준 (전체 TAM 대비) — 실적 탭과 동일한 기준으로 통일
  const myShare = G.marketShare || 0;
  const maxShare = Math.max(myShare, ...alive.map(c => c.marketShare || 0), 0.001);

  const compRows = alive
    .sort((a, b) => (b.marketShare || 0) - (a.marketShare || 0))
    .map(c => {
      const absShare = (c.marketShare || 0) * 100;
      const isThreat = (c.marketShare || 0) >= myShare * 0.7;
      const rowClass = isThreat ? 'threat' : ((c.marketShare || 0) < myShare * 0.3 ? 'weak' : '');
      return `
        <tr class="${rowClass}">
          <td class="comp-name">${c.name}</td>
          <td>${absShare.toFixed(2)}%
            <div class="brief-share-bar">
              <div class="brief-share-bar-fill" style="width:${Math.min(100, (c.marketShare||0) / maxShare * 100)}%;
                background:${isThreat ? 'var(--amber)' : 'var(--blue)'}"></div>
            </div>
          </td>
          <td style="font-size:10px;color:var(--muted)">${c.strategy || '—'}</td>
          <td style="font-size:10px">${(c.quality || 0) > (h.quality || 0) ? '🔴 품질우위' : '🟢'}</td>
        </tr>`;
    }).join('');

  const tableHtml = alive.length > 0 ? `
    <table class="brief-comp-table">
      <thead><tr>
        <th>경쟁사</th><th>점유율 (시장 전체)</th><th>전략</th><th>위협</th>
      </tr></thead>
      <tbody>${compRows}</tbody>
    </table>` : `<div class="brief-ok">✅ 현재 살아있는 경쟁사가 없습니다. 시장을 독점하고 있어요.</div>`;

  // 인수 검토 대상 — 내 점유율보다 낮은 경쟁사
  const acquirables = alive.filter(c => (c.marketShare || 0) < myShare * 0.8 && G.cash > 500000);
  const acquireHtml = acquirables.length > 0 ? `
    <div class="brief-section">
      <div class="brief-section-title">💡 인수 검토 대상</div>
      ${acquirables.slice(0, 2).map(c => {
        const estPrice = Math.round((c.marketShare || 0.005) * getMarketSize(G.year, G.quarter) * 8 / 1e5) * 1e5;
        return `<div class="brief-acquire-card">
          <div class="brief-acquire-name">${c.name}</div>
          <div class="brief-acquire-desc">점유율 ${((c.marketShare||0)*100).toFixed(2)}% — 우리보다 점유율이 낮은 경쟁사입니다. 인수 시 기술·고객 흡수 가능.</div>
          <div class="brief-acquire-price">💰 추정 인수가 ${fmt(estPrice)} (이벤트 발생 시 선택 가능)</div>
        </div>`;
      }).join('')}
    </div>` : '';

  // 비서 코멘트
  const topThreat = alive.slice().sort((a,b)=>(b.marketShare||0)-(a.marketShare||0))[0];
  const comment = topThreat
    ? `현재 가장 강력한 경쟁사는 <strong>${topThreat.name}</strong> (점유율 ${((topThreat.marketShare||0)*100).toFixed(2)}%)입니다.${
        (topThreat.quality || 0) > (h.quality || 0) ? ' 제품 품질에서도 우위에 있어 R&D 투자 강화를 권고드립니다.' : ''}`
    : '현재 시장에서 우리 회사의 위치가 안정적입니다.';

  return `
    <div class="brief-section">
      <div class="brief-section-title">경쟁사 현황 (내 점유율 ${(myShare*100).toFixed(2)}%)</div>
      ${tableHtml}
    </div>
    ${acquireHtml}
    <div class="brief-bubble">${comment}${dead.length > 0 ? `<br>이미 시장에서 퇴출된 경쟁사 ${dead.length}개사.` : ''}</div>`;
}

// ── 탭3: 자금 브리핑 ──────────────────────────────────────────────────────
function _briefFinance(h) {
  const loans    = G.loans || [];
  // 대출 객체 구조: { name, principal, qPay, quartersLeft }
  const totalDebt= loans.reduce((s, l) => s + (l.qPay || 0) * (l.quartersLeft || 0), 0);
  const qPay     = loans.reduce((s, l) => s + (l.qPay || 0), 0);
  const debtRatio= h.rev > 0 ? totalDebt / (h.rev * 4) : 0; // 연매출 대비

  // 현금 런웨이 바
  const cashSafe   = Math.max(h.rev * 2, 200000);
  const cashPct    = Math.min(100, h.cash / cashSafe * 100);
  const cashStatus = h.cash < cashSafe * 0.3 ? 'danger' : h.cash < cashSafe * 0.6 ? 'warn' : '';

  const loanHtml = loans.length > 0 ? loans.map(l => {
    const remaining = (l.qPay || 0) * (l.quartersLeft || 0);
    const loanName  = l.name || l.type || '대출';
    return `<div class="brief-fund-row">
      <div class="brief-fund-label">
        <span>${loanName}</span>
        <span style="color:var(--amber)">${fmt(remaining)} (${l.quartersLeft || 0}분기 잔여 · 분기 ${fmt(l.qPay || 0)})</span>
      </div>
    </div>`;
  }).join('') : `<div class="brief-ok">✅ 현재 부채 없음</div>`;

  // 비서 코멘트
  let comment = '';
  if (h.cash < 50000)
    comment = `⚠️ <strong>현금이 위험 수위입니다</strong> (${fmt(h.cash)}). 즉시 자금 조달을 검토하세요.`;
  else if (cashStatus === 'warn')
    comment = `현금 보유량이 다소 낮습니다. 향후 2~3분기 내 자금 조달을 고려해 주세요.`;
  else if (debtRatio > 0.5)
    comment = `부채 비율이 높습니다 (연매출 대비 ${Math.round(debtRatio*100)}%). 상환 일정을 점검하세요.`;
  else
    comment = `자금 상황은 안정적입니다. 현금 <strong>${fmt(h.cash)}</strong> 보유 중이며 분기 상환액은 ${qPay > 0 ? fmt(qPay) : '없음'}입니다.`;

  return `
    <div class="brief-section">
      <div class="brief-section-title">현금 상태</div>
      <div class="brief-fund-row">
        <div class="brief-fund-label">
          <span>현금 잔고</span>
          <span style="color:${cashStatus === 'danger' ? 'var(--red)' : cashStatus === 'warn' ? 'var(--amber)' : 'var(--green)'}">${fmt(h.cash)}</span>
        </div>
        <div class="brief-fund-bar-bg">
          <div class="brief-fund-bar-fill ${cashStatus}" style="width:${cashPct}%"></div>
        </div>
      </div>
    </div>
    <div class="brief-section">
      <div class="brief-section-title">대출 현황 (총 잔액 ${fmt(totalDebt)} · 분기 상환 ${qPay > 0 ? fmt(qPay) : '없음'})</div>
      ${loanHtml}
    </div>
    <div class="brief-bubble">${comment}</div>`;
}

// ── 탭4: 전략 브리핑 ──────────────────────────────────────────────────────
function _briefStrategy(h, prev, mood) {
  const era      = getCurrentEra();
  const margin   = h.rev > 0 ? h.profit / h.rev : 0;
  const alive    = G.competitors.filter(c => c.alive);
  const named    = G.marketShare + alive.reduce((s,c) => s + (c.marketShare||0), 0);
  const myRel    = named > 0 ? G.marketShare / named : 0;
  const cashBurn = prev ? prev.cash - h.cash + h.profit : 0; // 투자 지출

  // 경영이론 선택 + 전략 추천
  const strategies = [];

  // 1. Porter's Generic Strategies
  if (myRel > 0.4) {
    strategies.push({
      theory: "Porter의 경쟁우위론",
      title:  "시장 리더십 방어",
      body:   `현재 ${(myRel*100).toFixed(0)}% 상대 점유율로 시장을 선도하고 있습니다. <strong>비용 리더십</strong> 또는 <strong>차별화</strong> 전략을 유지하여 진입장벽을 높이세요.`,
    });
  } else if (myRel < 0.15) {
    strategies.push({
      theory: "Porter의 집중화 전략",
      title:  "틈새 집중 — 작은 시장 지배",
      body:   `점유율이 낮은 지금은 <strong>집중화(Focus) 전략</strong>이 유효합니다. 특정 고객군에 집중해 최고의 제품을 제공하고, 점유율을 점진적으로 확장하세요.`,
    });
  }

  // 2. 파괴적 혁신 — 클라우드(2007~) 이후 빠른 기술 전환 시대에 적용
  if (era && era.year >= 2007) {
    strategies.push({
      theory: "파괴적 혁신 이론 (Christensen)",
      title:  `${era.name} — 파괴자가 되거나 파괴당하거나`,
      body:   `현재 시대는 기술 전환이 빠릅니다. <strong>R&D 투자 강화</strong>로 기술 우위를 확보하거나, <strong>기존 경쟁사 M&A</strong>로 빠르게 역량을 흡수하는 전략을 고려하세요.`,
    });
  }

  // 3. Burn rate / Growth
  if (margin < -0.05 && G.cash > 300000) {
    strategies.push({
      theory: "블리츠스케일링 (Hoffman)",
      title:  "성장 우선 — 적자는 투자다",
      body:   `현재 적자(마진 ${Math.round(margin*100)}%)이지만 현금 ${fmt(G.cash)} 보유 중. 초기 성장 단계라면 점유율 확보를 위한 <strong>공격적 마케팅 투자</strong>가 합리적입니다.`,
    });
  } else if (margin < 0 && G.cash < 200000) {
    strategies.push({
      theory: "현금흐름 우선 원칙",
      title:  "⚠️ 생존 모드 전환 필요",
      body:   `현금이 ${fmt(G.cash)}로 부족합니다. 당장 <strong>비용 절감(HR/마케팅 축소)</strong>과 <strong>가격 인상</strong>으로 현금흐름을 플러스로 전환하는 것이 최우선입니다.`,
    });
  }

  // 4. Market share momentum
  if (prev && h.share > prev.share * 1.05) {
    strategies.push({
      theory: "네트워크 효과 & 규모의 경제",
      title:  "성장 모멘텀 — 가속 투자 시점",
      body:   `점유율이 빠르게 상승 중입니다. 이 모멘텀을 활용해 <strong>마케팅 예산을 증가</strong>시키면 고객 기반이 확대되어 단위 비용이 낮아지는 선순환이 만들어집니다.`,
    });
  }

  // 5. Quality signal
  if (h.quality < 50) {
    strategies.push({
      theory: "품질 경영 (Deming / TQM)",
      title:  "제품 품질 위기",
      body:   `현재 제품 품질 <strong>${Math.round(h.quality)}/100</strong>. 이는 고객 이탈과 NPS 하락으로 이어집니다. R&D 및 HR 예산을 늘려 <strong>품질 회복을 최우선</strong>으로 삼으세요.`,
    });
  }

  // 기본 전략 (아무것도 해당 안될 때)
  if (strategies.length === 0) {
    strategies.push({
      theory: "앤소프 성장 매트릭스",
      title:  "안정적 성장 — 시장 침투 전략",
      body:   `현재 지표가 안정적입니다. <strong>기존 제품의 시장 침투율 향상</strong>에 집중하세요. 마케팅 강화로 점유율을 높이고, 내실을 다지는 시기입니다.`,
    });
  }

  const stratHtml = strategies.slice(0, 3).map(s => `
    <div class="brief-strategy-card">
      <div class="brief-theory-badge">${s.theory}</div>
      <strong>${s.title}</strong>
      ${s.body}
    </div>`).join('');

  // 내 현재 전략 설정 표시
  const curStrategy = decisionState.strategy || 'differentiation';
  const stratNames  = { differentiation:'차별화', cost_leadership:'비용 리더십', focus:'집중화' };

  return `
    <div class="brief-section">
      <div class="brief-section-title">현재 시대 — ${era ? era.name : '—'}</div>
      <div class="brief-kpi-row">
        <div class="brief-kpi" style="min-width:unset">
          <div class="brief-kpi-label">내 전략</div>
          <div class="brief-kpi-val" style="font-size:13px">${stratNames[curStrategy] || curStrategy}</div>
        </div>
        <div class="brief-kpi" style="min-width:unset">
          <div class="brief-kpi-label">이익률</div>
          <div class="brief-kpi-val" style="font-size:13px;color:${margin>=0?'var(--green)':'var(--red)'}">${Math.round(margin*100)}%</div>
        </div>
        <div class="brief-kpi" style="min-width:unset">
          <div class="brief-kpi-label">상대 점유율</div>
          <div class="brief-kpi-val" style="font-size:13px">${(myRel*100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
    <div class="brief-section">
      <div class="brief-section-title">전략 제언</div>
      ${stratHtml}
    </div>`;
}

function showGameOver() {
  showScreen('sc-gameover');
  const win = G.win;
  document.getElementById('go-label').textContent = win ? '게임 클리어!' : '게임 오버';
  const titleEl = document.getElementById('go-title');
  titleEl.textContent = win ? '제국 완성!' : '파산';
  titleEl.className   = 'go-title ' + (win ? 'win' : 'lose');
  document.getElementById('go-sub').textContent = win
    ? `${G.name}이 2050년까지 생존하여 소프트웨어 제국을 완성했습니다!`
    : `${G.name}의 현금이 소진되어 파산했습니다. (${G.year}년 Q${G.quarter})`;

  const grid = [
    { l:'최고 분기 매출', v: fmt(G.peakRevenue) },
    { l:'연간 환산 최고', v: fmt(G.peakRevenue*4) },
    { l:'최고 점유율(경쟁사간)', v: (G.peakMarketShare * 100).toFixed(1) + '%' },
    { l:'최고 현금 잔고', v: fmt(G.peakCash) },
  ];
  document.getElementById('go-grid').innerHTML = grid.map(g=>`
    <div class="go-card"><div class="go-card-l">${g.l}</div><div class="go-card-v">${g.v}</div></div>`).join('');

  // Evaluation
  const yrsRun = G.year - G.startYear + (G.quarter-1)/4;
  const score  = G.peakMarketShare * G.peakRevenue * 0.000001;
  const evals  = [
    ['연간 환산 매출 $1B+ 달성', G.peakRevenue*4 >= 1e9],
    ['연간 환산 매출 $100B+ 달성', G.peakRevenue*4 >= 1e11],
    ['경쟁사간 점유율 10% 이상', G.peakMarketShare >= 0.10],
    ['경쟁사간 점유율 50% 이상', G.peakMarketShare >= 0.50],
    ['모든 경쟁사 파산', G.competitors.every(c=>!c.alive)],
    [`${Math.round(yrsRun)}년 이상 생존`, yrsRun >= 20],
  ];
  document.getElementById('go-eval').innerHTML =
    '<strong style="display:block;margin-bottom:8px">달성 목표</strong>' +
    evals.map(([t,v]) => `<div style="color:${v?'var(--green)':'var(--muted)'}">${v?'✅':'☐'} ${t}</div>`).join('');
}

// ═══════════════════════════════════════════════════════
// 9. INITIALIZATION & EVENT HANDLERS
// ═══════════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
}

function selectStrat(el) {
  document.querySelectorAll('.strat-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  decisionState.strategy = el.dataset.s;
  applyStrategyPreset(el.dataset.s);
  renderCostPreview();
}

function applyStrategyPreset(strategy) {
  if (!G || !G.year) return;
  const qSal     = G.employees * getSalary(G.year) / 4;
  const qRev     = G.history.length ? G.history[G.history.length-1].rev : qSal;
  // 연매출 기준 프리셋 — 공격적 투자를 기본값으로
  const annualRev = qRev * 4;
  const base      = Math.max(qSal, annualRev);

  // 전략별 예산 배분 비율 (연매출 기준 %) — 분기 투자액으로 표시됨
  // 예: differentiation rd=0.30 → 연매출의 30%를 이번 분기에 R&D 투자
  const presets = {
    differentiation: { rd: 0.30, mkt: 0.22, hr: 0.08 },
    cost_leadership: { rd: 0.10, mkt: 0.18, hr: 0.14 },
    focus:           { rd: 0.42, mkt: 0.07, hr: 0.10 },
  };
  const p = presets[strategy];
  if (!p) return;

  // 슬라이더 step 단위와 동일하게 반올림
  const step = base >= 100e6 ? 5000 : base >= 10e6 ? 500
             : base >= 1e6  ? 50   : base >= 100e3 ? 5 : 1;
  const snap = val => Math.max(step, Math.round(val / 1000 / step) * step) * 1000;

  decisionState.rd  = Math.min(snap(base * p.rd),  Math.max(10000, base * 0.60));
  decisionState.mkt = Math.min(snap(base * p.mkt), Math.max(5000,  base * 0.40));
  decisionState.hr  = Math.min(snap(base * p.hr),  Math.max(2000,  base * 0.25));

  // DOM 슬라이더 & 표시값 동기화
  const set = (id, val) => {
    const sl = document.getElementById(id);
    const vl = document.getElementById(id + '-v');
    if (sl) sl.value = val / 1000;
    if (vl) vl.textContent = fmt(val);
  };
  set('sl-rd',  decisionState.rd);
  set('sl-mkt', decisionState.mkt);
  set('sl-hr',  decisionState.hr);
}

function niceMax(n) {
  // Round up to nearest clean number for slider max
  if (n <= 0) return 1000;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / mag) * mag;
}

function updateSliderMaxes() {
  if (!G || !G.year) return;
  const qSal     = G.employees * getSalary(G.year) / 4;
  const qRev     = G.history.length ? G.history[G.history.length-1].rev : qSal;
  // 연매출(ARR) 기준 — 분기 슬라이더이지만 연간 투자 여력으로 상한 결정
  // 실제 SaaS: 연매출의 20-40%를 R&D에 투자. 공격적 성장기엔 100%+
  const annualRev = qRev * 4;
  const base      = Math.max(qSal, annualRev);   // was: max(qSal, qRev)

  // R&D: 연매출의 최대 60% (분기 투자로 표시) — 고성장 SaaS 현실 반영
  // Marketing: 40%, HR: 25%
  const maxRD  = niceMax(Math.max(10000,  base * 0.60));
  const maxMkt = niceMax(Math.max(5000,   base * 0.40));
  const maxHR  = niceMax(Math.max(2000,   base * 0.25));

  document.getElementById('sl-rd').max  = maxRD  / 1000;
  document.getElementById('sl-mkt').max = maxMkt / 1000;
  document.getElementById('sl-hr').max  = maxHR  / 1000;

  // Step size scales with magnitude so slider stays usable at any scale
  // step is in $K units (slider value * 1000 = dollars)
  const step = base >= 100e6 ? 5000   // $5M steps
             : base >= 10e6  ? 500    // $500K steps
             : base >= 1e6   ? 50     // $50K steps
             : base >= 100e3 ? 5      // $5K steps
             :                 1;     // $1K steps
  ['sl-rd','sl-mkt','sl-hr'].forEach(id => {
    document.getElementById(id).step = step;
  });

  // 모바일 스테퍼 버튼 라벨 업데이트
  const stepAmt  = step * 1000; // 달러
  const stepLg   = stepAmt * 5;
  const stepLabel = v => v >= 1e6 ? `${(v/1e6).toFixed(v%1e6?1:0)}M`
                       : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : `${v}`;
  ['rd','mkt','hr'].forEach(key => {
    const btns = document.querySelectorAll(`[onclick*="stepBudget('${key}'"]`);
    btns.forEach(btn => {
      const n = parseInt(btn.getAttribute('onclick').match(/([-+]\d+)\)/)?.[1] || '0');
      if (Math.abs(n) === 1) btn.textContent = n > 0 ? `+${stepLabel(stepAmt)}` : `−${stepLabel(stepAmt)}`;
      if (Math.abs(n) === 5) btn.textContent = n > 0 ? `+${stepLabel(stepLg)}`  : `−${stepLabel(stepLg)}`;
    });
  });
}

// ── 채용 표시 바 업데이트 ────────────────────────────────────────────────
function _updateHireBar() {
  const fillEl    = document.getElementById('hire-bar-fill');
  const pendingEl = document.getElementById('hire-bar-pending');
  const markerEl  = document.getElementById('hire-bar-min-marker');
  const curEl     = document.getElementById('hire-bar-cur');
  const minEl     = document.getElementById('hire-bar-min');
  const maxEl     = document.getElementById('hire-bar-max');
  if (!fillEl || !G) return;

  const cur     = G.employees || 0;
  const pending = decisionState.hire || 0;
  const minEmp  = calcMinEmployees();
  const maxHire = getMaxHire();
  const barMax  = Math.max(cur + maxHire, minEmp, cur + 1); // 바의 최대값

  const fillPct    = Math.min(100, cur / barMax * 100);
  const pendPct    = pending > 0
    ? Math.min(100, pending / barMax * 100) : 0;
  const pendLeft   = fillPct;
  const minPct     = Math.min(99, minEmp / barMax * 100);

  fillEl.style.width      = fillPct + '%';
  pendingEl.style.left    = pendLeft + '%';
  pendingEl.style.width   = pendPct + '%';
  markerEl.style.left     = minPct + '%';
  markerEl.style.display  = minEmp > cur ? '' : 'none';

  if (curEl) curEl.textContent = cur.toLocaleString() + '명';
  if (minEl) minEl.textContent = minEmp.toLocaleString() + '명';
  if (maxEl) maxEl.textContent = '+' + maxHire.toLocaleString() + '명';
}

// ── 가격 스테퍼 ──────────────────────────────────────────────────────────
function stepPrice(steps) {
  const sl   = document.getElementById('sl-price');
  const step = parseInt(sl.step) || 5;
  const cur  = parseInt(sl.value);
  sl.value   = Math.max(parseInt(sl.min), Math.min(parseInt(sl.max), cur + step * steps));
  syncPrice();
}
function promptPrice() {
  const cur = Math.round((decisionState.price || 1.0) * 100);
  const val = window.prompt(`가격 포지셔닝 입력 (60~160%)\n현재: ${cur}%`, cur);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n)) return;
  const sl = document.getElementById('sl-price');
  sl.value = Math.max(60, Math.min(160, Math.round(n / 5) * 5));
  syncPrice();
}

// ── 모바일 스테퍼: 스텝 단위로 예산 조정 ──────────────────────────────────
function stepBudget(key, steps) {
  const sl   = document.getElementById('sl-' + key);
  const step = parseInt(sl.step) || 1;          // 슬라이더 현재 step 단위 ($K)
  const max  = parseInt(sl.max)  || 1000;
  const cur  = Math.round((decisionState[key] || 0) / 1000); // $K
  const next = Math.max(0, Math.min(max, cur + step * steps));
  sl.value   = next;
  syncSlider(key);
}

// 모바일 스테퍼: 탭으로 직접 금액 입력
function promptBudget(key) {
  const labels = { rd: 'R&D', mkt: '마케팅', hr: 'HR' };
  const cur    = (decisionState[key] || 0);
  const sl     = document.getElementById('sl-' + key);
  const max    = parseInt(sl.max) * 1000 || 999999999;
  const step   = parseInt(sl.step) * 1000 || 1000;

  // 간단한 인라인 prompt 대신 모달 스타일 입력
  const val = window.prompt(`${labels[key]} 예산 입력 ($K 단위)\n현재: ${fmt(cur)}\n최대: ${fmt(max)}`,
    Math.round(cur / 1000));
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) return;
  const clamped = Math.min(Math.max(0, n * 1000), max);
  sl.value = Math.round(clamped / 1000);
  syncSlider(key);
}

function syncSlider(key) {
  const sl = document.getElementById('sl-'+key);
  const val = parseInt(sl.value) * 1000;
  decisionState[key] = val;
  document.getElementById('sl-'+key+'-v').textContent = fmt(val);

  // HR 슬라이더: 4개 효과 실시간 힌트
  if (key === 'hr') {
    const hrIdx = getHrIndex(val, G ? G.employees : 10, G ? G.year : 1980);
    const ef    = getHrEffects(hrIdx);
    const hintEl = document.getElementById('hr-hint');
    if (hintEl) {
      const prodPct  = Math.round((ef.prod - 1) * 100);
      const attrPpt  = (ef.attrAdj * 100).toFixed(1);
      const recPct   = Math.round((ef.recruitMult - 1) * 100);
      const wagePct  = Math.round(ef.wagePremium * 100);
      // 표시용 실효 지수: 체감 수익 후 상한 4.0 반영
      const dispIdx  = hrIdx <= 1.0 ? hrIdx : Math.min(4.0, 1.0 + Math.sqrt(hrIdx - 1.0));
      const idxLabel = dispIdx < 0.5 ? '미투자' : dispIdx < 1.0 ? '부족' : dispIdx < 2.0 ? '적정' : dispIdx < 3.5 ? '공격적' : '최대';
      // 기업 임금 배율 표시 (전략+규모+재무+기술)
      const cWage    = getCompanyWageMult(G, true);
      const totalWage = Math.round((cWage * (1 + ef.wagePremium) - 1) * 100);
      const wageColor = cWage >= 1.15 ? '#a78bfa' : cWage >= 1.02 ? '#60a5fa' : cWage >= 0.95 ? 'var(--muted)' : '#f59e0b';
      hintEl.innerHTML =
        `HR지수 <b>${dispIdx.toFixed(1)}×</b> (${idxLabel}) &nbsp;|&nbsp; ` +
        `이직률 <b style="color:${ef.attrAdj<=0?'#10b981':'#ef4444'}">${attrPpt>=0?'+':''}${attrPpt}%p</b> &nbsp;` +
        `채용력 <b style="color:${recPct>=0?'#10b981':'#ef4444'}">${recPct>=0?'+':''}${recPct}%</b> &nbsp;|&nbsp; ` +
        `실효임금 <b style="color:${wageColor}">시장×${cWage.toFixed(2)}</b> <span style="color:var(--muted);font-size:10px">(총 ${totalWage>=0?'+':''}${totalWage}%)</span>`;
    }
  }

  renderCostPreview();
}

function syncPrice() {
  const v = parseInt(document.getElementById('sl-price').value) / 100;
  decisionState.price = v;
  const pl = priceLabel(v);
  document.getElementById('price-v').textContent = Math.round(v*100) + '%';

  // Elasticity preview: estimate share impact
  // compScore uses Math.pow(1/p, wp). For differentiation wp=1.50.
  // Relative to baseline (1.0), factor = (1/v)^1.50
  const wp = G.strategy === 'cost_leadership' ? 2.00
           : G.strategy === 'focus'            ? 0.30 : 1.50;
  const shareFactor = Math.pow(1 / v, wp);   // >1 if v<1, <1 if v>1
  const revFactor   = shareFactor * v;        // net revenue effect vs baseline
  const shareChg    = Math.round((shareFactor - 1) * 100);
  const revChg      = Math.round((revFactor   - 1) * 100);
  const shareStr = shareChg >= 0 ? `점유율 +${shareChg}%` : `점유율 ${shareChg}%`;
  const revStr   = revChg   >= 0 ? `매출 +${revChg}%`    : `매출 ${revChg}%`;

  let hint;
  if (v <= 0.75)      hint = `초저가 — ${shareStr} / ${revStr} (마진 극히 낮음)`;
  else if (v <= 0.90) hint = `할인가 — ${shareStr} / ${revStr}`;
  else if (v <= 1.10) hint = `시장 기준가 — 점유율·수익 균형`;
  else if (v <= 1.30) hint = `프리미엄 — ${shareStr} / ${revStr} (마진 높음)`;
  else                hint = `초고가 — ${shareStr} / ${revStr} ⚠탄력성 주의`;

  document.getElementById('price-hint').textContent = `${pl.text}: ${hint}`;
  renderCostPreview();
}

function getMaxHire() {
  // HR 투자 → 채용력(recruitMult) 향상: 더 많은 인재를 더 빠르게 채용 가능
  const hrIdx       = getHrIndex(decisionState.hr, G.employees, G.year);
  const recruitMult = getHrEffects(hrIdx).recruitMult;

  // 기본 채용 여력 (분기당 현재 인원 대비 %)
  let normal;
  if (G.employees < 20)       normal = Math.max(5,  Math.ceil(G.employees * 0.40));
  else if (G.employees < 100) normal = Math.max(10, Math.ceil(G.employees * 0.30));
  else if (G.employees < 500) normal = Math.max(30, Math.ceil(G.employees * 0.20));
  else                        normal = Math.ceil(G.employees * 0.15);

  normal = Math.round(normal * recruitMult); // HR 채용력 배율 적용

  // 인력 부족 시 긴급 채용: 갭만큼 추가 허용하되 현재 인원 25% 이내로 제한.
  // 실제로 한 분기에 현원 25% 이상을 신규 채용하면 조직 혼란·문화 희석이 심각해짐.
  const minEmp    = calcMinEmployees();
  const gap       = Math.max(0, minEmp - G.employees);
  const emergCap  = Math.ceil(G.employees * 0.25); // 분기 긴급 채용 최대
  const emergency = Math.min(gap, emergCap);

  return Math.max(normal, emergency);
}

function adjustHire(n) {
  const maxHire = getMaxHire();
  const maxFire = Math.max(3, Math.floor(G.employees * 0.25));
  decisionState.hire = Math.max(-maxFire, Math.min(maxHire, (decisionState.hire||0)+n));
  _refreshHireDisplay();
}

// 최소 인원까지 한 번에 채용 설정
function fillToMinEmp() {
  const minEmp  = calcMinEmployees();
  const gap     = Math.max(0, minEmp - G.employees);
  if (gap <= 0) return;
  const maxHire = getMaxHire();
  const fill    = Math.min(gap, maxHire);
  decisionState.hire = fill;
  // 입력창 직접 갱신 (tagName 무관하게 모두 처리)
  const el = document.getElementById('hire-count');
  if (el) {
    if (el.tagName === 'INPUT') el.value = fill;
    else el.textContent = '+' + fill;
  }
  _refreshHireDisplay();
}

function setHireInput(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return;
  const maxHire = getMaxHire();
  const maxFire = Math.max(3, Math.floor(G.employees * 0.25));
  decisionState.hire = Math.max(-maxFire, Math.min(maxHire, n));
  _refreshHireDisplay();
}

// 최소 인원 충원 버튼 상태 갱신 — _refreshHireDisplay / renderHireButtons 공통 사용
function _refreshFillButton() {
  const fillBtn = document.getElementById('btn-fill-min-emp');
  if (!fillBtn || !G || G.employees === undefined) return;
  const minEmp  = calcMinEmployees();
  const gap     = Math.max(0, minEmp - G.employees);
  const pending = decisionState.hire || 0;
  if (gap > 0 && pending < gap) {
    const fill   = Math.min(gap, getMaxHire());
    const capped = fill < gap;
    document.getElementById('fill-min-label').textContent = `+${fill.toLocaleString()}명`;
    document.getElementById('fill-min-sub').textContent   = capped
      ? ` (분기 한도 — 총 ${gap.toLocaleString()}명 필요)`
      : ` (${minEmp.toLocaleString()}명 목표)`;
    fillBtn.style.display = '';
  } else {
    fillBtn.style.display = 'none';
  }
}

function _refreshHireDisplay() {
  _updateHireBar();
  const el = document.getElementById('hire-count');
  if (el.tagName === 'INPUT') {
    el.value = decisionState.hire;
  } else {
    el.textContent = decisionState.hire >= 0 ? '+'+decisionState.hire : ''+decisionState.hire;
  }
  const compWage = getCompanyWageMult(G, true);
  const hrIdx    = getHrIndex(decisionState.hr, G.employees, G.year);
  const wagePrem = getHrEffects(hrIdx).wagePremium;
  const hireCost = Math.max(0, decisionState.hire) * getSalary(G.year) / 4 * compWage * (1 + wagePrem) * 0.3;
  document.getElementById('hire-cost-txt').textContent = '채용비 '+fmt(hireCost);
  document.getElementById('cur-emp').textContent = G.employees;
  document.getElementById('hire-max-disp').textContent = getMaxHire();

  _refreshFillButton();
  renderCostPreview();
}

function renderHireButtons() {
  if (!G || !G.employees) return;
  _updateHireBar();
  const maxHire = getMaxHire();
  const maxFire = Math.max(3, Math.floor(G.employees * 0.25));
  document.getElementById('hire-max-disp').textContent = maxHire;
  document.getElementById('cur-emp').textContent = G.employees;
  document.getElementById('hire-row-lg').style.display = G.employees >= 30  ? 'flex' : 'none';
  document.getElementById('hire-row-xl').style.display = G.employees >= 300 ? 'flex' : 'none';
  if (decisionState.hire > maxHire)  decisionState.hire = maxHire;
  if (decisionState.hire < -maxFire) decisionState.hire = -maxFire;

  // Morale bar
  const morale = G.morale || 60;
  const moraleBar = document.getElementById('morale-bar-fill');
  if (moraleBar) {
    moraleBar.style.width    = morale + '%';
    moraleBar.style.background = morale >= 70 ? 'var(--green)' : morale >= 40 ? 'var(--amber)' : 'var(--red)';
  }
  const moraleLabel = document.getElementById('morale-label');
  if (moraleLabel) moraleLabel.textContent = morale + '/100';

  // Min employees & attrition preview
  const minEmp  = calcMinEmployees();
  const attrEst = calcQuarterlyAttrition();
  const minEl = document.getElementById('min-emp-disp');
  if (minEl) {
    minEl.textContent = minEmp.toLocaleString();
    minEl.style.color = G.employees < minEmp ? 'var(--red)' : 'var(--green)';
  }

  _refreshFillButton();
  const attrEl = document.getElementById('attrition-disp');
  if (attrEl) {
    attrEl.textContent = attrEst;
    attrEl.style.color = attrEst >= 5 ? 'var(--red)' : attrEst >= 2 ? 'var(--amber)' : 'var(--mist)';
  }

  // 추가 필요 인원 표시
  const capEl = document.getElementById('emp-cap-disp');
  if (capEl) {
    const minNeeded = calcMinEmployees();
    const shortage  = minNeeded - G.employees;
    if (shortage > 0) {
      capEl.textContent = `최소 ${shortage.toLocaleString()}명 추가 채용 필요`;
      capEl.style.color = shortage > G.employees * 0.3 ? 'var(--red)' : 'var(--amber)';
    } else {
      capEl.textContent = '인원 충족';
      capEl.style.color = 'var(--muted)';
    }
  }
}

let _pendingTurn = false;

// ── Catch-up event: fires every 4 quarters per unresolved tech debt entry ──
// Returns true if a catch-up modal was shown (caller should set _pendingTurn).
function checkCatchupEvent() {
  if (!G.techDebt || !G.techDebt.length) return false;
  const INTERVAL = 4; // quarters between catch-up opportunities
  for (let idx = 0; idx < G.techDebt.length; idx++) {
    const debt = G.techDebt[idx];
    if (debt.resolved) continue;
    if (debt.quartDebt > 0
        && debt.quartDebt % INTERVAL === 0
        && debt._lastCatchupQ !== debt.quartDebt) {
      debt._lastCatchupQ = debt.quartDebt;
      showCatchupModal(idx);
      return true;
    }
  }
  return false;
}

function showCatchupModal(debtIdx) {
  const debt    = G.techDebt[debtIdx];
  const periods = Math.floor(debt.quartDebt / 4); // how many 4Q periods elapsed
  // Cost grows 40% per period (compounding)
  const fullFrac    = +(debt.baseFrac * (1 + periods * 0.40)).toFixed(2);
  const partialFrac = +(fullFrac * 0.50).toFixed(2);

  // Stat recovery (full catch-up doesn't fully compensate — permanent cost for missing it)
  const qGain = Math.round(debt.baseFrac * 18 + periods * 3);
  const tGain = Math.round(debt.baseFrac * 14 + periods * 2);
  const bGain = Math.round(debt.baseFrac * 8  + periods * 1);

  const multLabel = (fullFrac / debt.baseFrac).toFixed(2);
  const qWarning  = debt.quartDebt >= 8
    ? ` ⚠️ ${debt.quartDebt}분기 지연 — 다음 혁명 이벤트에서 비용이 추가로 폭증합니다!`
    : '';

  pendingEvent = {
    _catchup:  true,
    _debtIdx:  debtIdx,
    y: G.year, q: G.quarter,
    type: 'shift',
    title: `⏪ ${debt.title} — 추격 투자 기회`,
    desc:  `${debt.title}에 투자를 미뤄 ${debt.quartDebt}분기(약 ${(debt.quartDebt/4).toFixed(1)}년)간 ` +
           `기술이 뒤처졌습니다. 초기 투자 대비 ${multLabel}배 비용이 필요합니다.` +
           `${qWarning}\n\n` +
           `지금 투자하지 않으면 다음 기회(4분기 후)는 더 비쌉니다.`,
    effects: {},
    choices: [
      {
        label: `🚀 전면 추격 투자 — 기술 부채 완전 해소`,
        cost:   fullFrac,
        effect: { quality: qGain, tech: tGain, brand: bGain },
        _resolveFull: true,
      },
      {
        label: `⚡ 부분 추격 (절반 투자) — 기술 부채 50% 감소`,
        cost:   partialFrac,
        effect: { quality: Math.round(qGain * 0.50), tech: Math.round(tGain * 0.50), brand: Math.round(bGain * 0.50) },
        _resolvePartial: true,
      },
      {
        label: `⏳ 다음 기회까지 연기 — 비용 계속 증가`,
        cost:   0,
        effect: {},
      },
    ],
  };
  showEventModal(pendingEvent);
}

function nextQuarter() {
  // 0. Catch-up opportunities for unresolved tech debt fire BEFORE regular events
  if (checkCatchupEvent()) {
    _pendingTurn = true;
    return;
  }
  // 1. Check for regular historical events
  // (Disruptive innovation theory: market events force strategic responses)
  if (checkAndFireEvent()) {
    _pendingTurn = true;
    return;
  }
  _executeTurn();
}

function _executeTurn() {
  _pendingTurn = false;
  const info = processTurn();
  info.news.forEach(n => pushNews(n.t+': '+n.msg, n.type));
  decisionState.hire = 0;
  const hcEl = document.getElementById('hire-count');
  if (hcEl.tagName === 'INPUT') hcEl.value = 0; else hcEl.textContent = '0';
  document.getElementById('hire-cost-txt').textContent = '채용비 $0';
  showResultsModal(info);
  // 모바일: 분기 실행 후 대시보드로 자동 전환
  if (window.innerWidth <= 700) switchMobilePanel('dashboard');
}

function startGame() {
  const name    = document.getElementById('in-name').value.trim() || 'ACME Software';
  const product = document.getElementById('in-product').value.trim() || 'Business Suite';
  const difEl   = document.querySelector('#in-diff .radio-opt.selected');
  const startYear   = 1980; // 항상 초창기 1980 고정
  const difficulty  = difEl ? difEl.dataset.v             : 'normal';

  newGame({ name, product, startYear, difficulty });
  pendingEvent = null;
  decisionState = { rd:50000, mkt:20000, hr:0, hire:0, price:1.0, strategy:'differentiation' };

  // Init slider UI — values in $K on the slider, stored as $ in decisionState
  updateSliderMaxes();
  const initRD  = Math.round(getSalary(startYear) / 4 / 1000 * 2); // ~2 engineer-quarters
  const initMkt = Math.round(initRD * 0.65);
  document.getElementById('sl-rd').value   = initRD;
  document.getElementById('sl-mkt').value  = initMkt;
  document.getElementById('sl-hr').value   = 0;
  decisionState.rd  = initRD  * 1000;
  decisionState.mkt = initMkt * 1000;
  decisionState.hr  = 0;
  document.getElementById('sl-rd-v').textContent  = fmt(decisionState.rd);
  document.getElementById('sl-mkt-v').textContent = fmt(decisionState.mkt);
  document.getElementById('sl-hr-v').textContent  = '$0';

  showScreen('sc-game');
  initCharts();
  calcAllMarketShares(); // 시작 시점 시장점유율 즉시 계산 (stats 기반)
  renderAll();
}

// ─── SAVE / LOAD SYSTEM ────────────────────────────────


function _fmtSaveSlot(s) {
  if (!s || s.empty) return null;
  return {
    name:    s.name    || '(무제)',
    product: s.product || '',
    year:    s.year    || '—',
    quarter: s.quarter || '—',
    cash:    s.cash    != null ? fmt(s.cash) : '—',
    rev:     s.revenue != null ? fmt(s.revenue) : '—',
    emp:     s.employees != null ? s.employees + '명' : '—',
    share:   s.marketShare != null ? fmtPct(s.marketShare, 2) : '—',
  };
}

// ── Storage abstraction: localStorage (works on web AND Capacitor mobile) ──
const Storage = {
  key: slot => `ceosim_save_slot${slot}`,

  save(slot, data) {
    try {
      localStorage.setItem(this.key(slot), JSON.stringify(data));
      return true;
    } catch(e) { return false; }
  },

  load(slot) {
    try {
      const raw = localStorage.getItem(this.key(slot));
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  listAll() {
    return [1, 2, 3].map(slot => {
      const s = this.load(slot);
      if (!s) return { slot, empty: true };
      return { slot, name: s.name, year: s.year, quarter: s.quarter,
               cash: s.cash, revenue: s.revenue, employees: s.employees,
               marketShare: s.marketShare };
    });
  },

  delete(slot) {
    localStorage.removeItem(this.key(slot));
  }
};

function refreshSaveSlots(containerId, mode) {
  // mode: 'load' (intro screen) | 'save' (in-game modal)
  const slots = Storage.listAll();
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = slots.map(s => {
    const d = _fmtSaveSlot(s);
    if (!d) {
      return `<div class="save-slot empty" onclick="${mode==='save'?`saveToSlot(${s.slot})`:`loadGame(${s.slot})`}">
        <span class="ss-num">${s.slot}</span>
        <span class="ss-empty">빈 슬롯${mode==='save'?' — 여기에 저장':''}</span>
      </div>`;
    }
    return `<div class="save-slot filled" onclick="${mode==='save'?`saveToSlot(${s.slot})`:`loadGame(${s.slot})`}">
      <div class="ss-top">
        <span class="ss-num">${s.slot}</span>
        <span class="ss-company">${d.name}</span>
        <span class="ss-time">Q${d.quarter} ${d.year}</span>
      </div>
      <div class="ss-stats">
        <span>💰 ${d.cash}</span>
        <span>📈 ${d.rev}/분기</span>
        <span>👤 ${d.emp}</span>
      </div>
      ${mode==='save'?'<div class="ss-overwrite">⚠ 덮어쓰기</div>':''}
    </div>`;
  }).join('');
}

function openSaveModal() {
  refreshSaveSlots('save-modal-slots', 'save');
  document.getElementById('save-modal').classList.add('open');
}

function closeSaveModal() {
  document.getElementById('save-modal').classList.remove('open');
}

function saveToSlot(slot) {
  const data = { ...G, firedEvents: [...G.firedEvents], _decisionState: decisionState };
  const ok = Storage.save(slot, data);
  closeSaveModal();
  const b = document.querySelector('.btn-save');
  b.textContent = ok ? `저장됨 ✓ (슬롯${slot})` : '저장 실패 ✗';
  setTimeout(() => b.textContent = '저장', 2000);
}

function saveGame() { openSaveModal(); }

function loadGame(slot) {
  const saved = Storage.load(slot);
  if (!saved) {
    alert(`슬롯 ${slot}에 저장된 게임이 없습니다.`);
    return;
  }
  Object.assign(G, saved);
  G.firedEvents = new Set(saved.firedEvents || []);
  if (saved._decisionState) Object.assign(decisionState, saved._decisionState);

  showScreen('sc-game');
  initCharts();
  renderAll();

  // Sync sliders (slider value = $ amount / 1000)
  const ds = decisionState;
  document.getElementById('sl-rd').value    = Math.round((ds.rd    || 50000) / 1000);
  document.getElementById('sl-mkt').value   = Math.round((ds.mkt   || 20000) / 1000);
  document.getElementById('sl-hr').value    = Math.round((ds.hr    || 0)     / 1000);
  document.getElementById('sl-price').value = Math.round((ds.price || 1.0)   * 100);
  syncSlider('rd'); syncSlider('mkt'); syncSlider('hr'); syncPrice();
}

function toggleGameMenu() {
  const el = document.getElementById('game-menu-dropdown');
  el.classList.toggle('open');
  // Close when clicking outside
  if (el.classList.contains('open')) {
    setTimeout(() => document.addEventListener('click', _closeMenuOutside, { once: true }), 0);
  }
}
function _closeMenuOutside(e) {
  const el = document.getElementById('game-menu-dropdown');
  if (el && !el.contains(e.target)) el.classList.remove('open');
}
function confirmMainMenu() {
  document.getElementById('game-menu-dropdown').classList.remove('open');
  if (confirm('메인 메뉴로 돌아가시겠습니까?\n(저장하지 않은 진행상황은 사라집니다)')) {
    resetGame();
  }
}

function resetGame() {
  showScreen('sc-intro');
  refreshSaveSlots('save-slots', 'load');
}

// Radio group clicks
// 난이도 설명 텍스트 맵
const DIFF_DESC = {
  easy:   '💚 쉬움 — 초기현금 ×2.0 · 경쟁사 스탯 ×0.6 · 경쟁사 예산 ×0.65 · 초기점유율 ×1.8\n대출이자 ×0.7 · VC희석 ×0.75 · 위기피해 ×0.5 · 경쟁사 구제확률 ×1.8',
  normal: '🟡 보통 — 모든 수치 기본값 (×1.0)',
  hard:   '🔴 어려움 — 초기현금 ×0.5 · 경쟁사 스탯 ×1.4 · 경쟁사 예산 ×1.4 · 초기점유율 ×0.5\n대출이자 ×1.6 · VC희석 ×1.4 · 위기피해 ×1.8 · 경쟁사 구제확률 ×0.35',
};

document.querySelectorAll('.radio-group').forEach(g => {
  const updateDiffDesc = () => {
    const sel = g.querySelector('.radio-opt.selected');
    const descEl = document.getElementById('diff-desc');
    if (descEl && sel && g.id === 'in-diff') {
      descEl.style.whiteSpace = 'pre-line';
      descEl.textContent = DIFF_DESC[sel.dataset.v] || '';
    }
  };
  g.addEventListener('click', e => {
    const opt = e.target.closest('.radio-opt');
    if (!opt) return;
    g.querySelectorAll('.radio-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    updateDiffDesc();
  });
  updateDiffDesc(); // 초기 표시
});

// Initial slider sync + load save slot previews
window.addEventListener('DOMContentLoaded', () => {
  syncSlider('rd');
  syncSlider('mkt');
  syncSlider('hr');
  syncPrice();
  refreshSaveSlots('save-slots', 'load');
});

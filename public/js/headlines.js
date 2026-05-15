// ═══════════════════════════════════════════════════════════════════
// 분기 진행 인터루드 — 시대별 뉴스 헤드라인 DB
// ─────────────────────────────────────────────────────────────────
// 헤드라인 추가 방법:
//   해당 연도 배열에 문자열 한 줄을 추가하면 됩니다.
//   예) HEADLINES[1985].push('📰 새 헤드라인');
//   없는 연도는 가장 가까운 연도의 헤드라인을 자동으로 사용합니다.
// ═══════════════════════════════════════════════════════════════════
const HEADLINES = {

  // ─── 1980s: PC 혁명기 ────────────────────────────────────────────
  1980: [
    '📰 IBM, 최초의 개인용 컴퓨터(PC) 출시 — 가격 $1,565의 혁명',
    '📰 Microsoft, IBM PC용 DOS 공급 계약 체결 — 빌 게이츠의 역사적 도박',
    '📰 미국 인플레이션 13.5% 기록 — 소프트웨어 시장도 요동치다',
    '📰 Apple, Lisa 프로젝트 착수 — 최초의 상업용 GUI 개발 시작',
    '📰 Atari, 가정용 게임 시장 석권 — 소프트웨어 산업의 새 지평',
  ],

  1981: [
    '📰 IBM PC 출시 4개월 만에 5만 대 판매 — 개인용 컴퓨터 시대 개막',
    '📰 MS-DOS 1.0 공식 배포 — PC 소프트웨어 생태계의 기반 완성',
    '📰 Xerox PARC, 마우스·GUI·이더넷 기술 공개 — 실리콘밸리에 충격',
    '📰 미국 연방준비제도, 기준금리 20% 돌파 — IT 스타트업 자금 조달 위기',
    '📰 Hayes 모뎀 표준 제정 — PC 통신 시대의 서막',
  ],

  1982: [
    '📰 Compaq, IBM PC 호환 클론 출시 — PC 시장 경쟁 시대 본격화',
    '📰 AutoCAD 출시 — 소프트웨어가 설계 산업을 바꾸기 시작',
    '📰 Time지 "올해의 인물"로 개인용 컴퓨터 선정 — PC 시대 공인',
    '📰 Intel 286 프로세서 발표 — 소프트웨어 성능의 한계 다시 한번 확장',
    '📰 Lotus 1-2-3 개발 착수 — 스프레드시트 소프트웨어 혁명 예고',
  ],

  1983: [
    '📰 Apple Lisa 출시 — GUI 기반 컴퓨터 $9,995에 판매 시작',
    '📰 Lotus 1-2-3 출시 즉시 베스트셀러 — 기업용 소프트웨어 시장 열다',
    '📰 Microsoft Word 1.0 출시 — 워드프로세서 전쟁의 시작',
    '📰 Nintendo Famicom(패미컴) 일본 출시 — 비디오 게임 산업 부활',
    '📰 ARPANET, TCP/IP 프로토콜 채택 — 현대 인터넷의 기반 완성',
  ],

  1984: [
    '📰 Apple Macintosh 출시 — "1984" 광고와 함께 컴퓨터 역사 새로 쓰다',
    '📰 AT&T 강제 분리 — 통신 시장 자유화로 IT 인프라 비용 급감',
    '📰 Michael Dell, 기숙사에서 Dell Computer 창업 — 직판 모델의 탄생',
    '📰 Gibson, 소설 "Neuromancer" 출간 — 사이버스페이스 개념 대중화',
    '📰 Borland, Turbo Pascal 출시 $49.95 — 저가 개발툴 혁명',
  ],

  1985: [
    '📰 Microsoft Windows 1.0 출시 — 빌 게이츠의 GUI 도전 시작',
    '📰 Aldus PageMaker 출시 — 데스크탑 퍼블리싱 산업 탄생',
    '📰 Steve Jobs, Apple 이사회에서 축출 — 실리콘밸리 역사의 한 장',
    '📰 Intel 386 프로세서 발표 — 32비트 PC 시대의 서막',
    '📰 Plaza Accord 체결 — 달러 약세 유도로 IT 수출 구조 재편',
    '📰 Commodore Amiga 출시 — 멀티미디어 PC의 선구자',
  ],

  1986: [
    '📰 Microsoft, NASDAQ 상장 — 빌 게이츠 순식간에 억만장자 등극',
    '📰 Compaq, 386 기반 PC 출시 — IBM보다 빠른 클론 업체의 도약',
    '📰 Pixar, Lucasfilm에서 독립 — 컴퓨터 그래픽 스튜디오의 탄생',
    '📰 Thinking Machines, Connection Machine 출시 — 병렬 컴퓨팅 시대 예고',
    '📰 체르노빌 원전 사고 — 소련 체제 균열, 냉전 기술 경쟁에 영향',
  ],

  1987: [
    '📰 HyperCard 출시 — 링크 기반 정보 구조의 원형, 웹의 전신',
    '📰 블랙 먼데이(10월 19일) — 다우 22% 폭락, IT 투자 심리 급랭',
    '📰 GIF 이미지 포맷 등장 — 인터넷 이미지 공유의 시대 예고',
    '📰 Motorola 68030 출시 — Mac과 워크스테이션 성능 비약적 향상',
    '📰 Novell NetWare, 기업 LAN 시장 장악 — 사무실 네트워크 표준화',
  ],

  1988: [
    '📰 NeXT 컴퓨터 출시 — Jobs의 귀환, 객체지향 OS의 선구자',
    '📰 Morris Worm, 최초의 인터넷 웜 확산 — 보안의 시대 도래',
    '📰 Adobe Photoshop 개발 시작 — 디지털 이미지 편집의 혁명 준비',
    '📰 NEC와 IBM, 특허 분쟁 격화 — PC 시장 지식재산권 전쟁 본격화',
    '📰 Intel 80486 개발 완료 발표 — 1천만 트랜지스터의 시대',
  ],

  1989: [
    '📰 Tim Berners-Lee, World Wide Web 제안서 제출 — 인터넷 혁명의 씨앗',
    '📰 베를린 장벽 붕괴 — 동유럽 IT 시장 개방, 새로운 기회의 땅',
    '📰 Intel 80486 출시 — 486 PC 시대, 소프트웨어 복잡성 새 지평',
    '📰 Game Boy 출시 — 닌텐도, 휴대용 게임 시장 독점 시작',
    '📰 Adobe Photoshop 1.0 출시 — 크리에이티브 소프트웨어 혁명 개막',
    '📰 Lotus Notes 출시 — 그룹웨어·기업 협업 소프트웨어 시장 탄생',
  ],

  // ─── 1990s: 웹 혁명기 ────────────────────────────────────────────
  1990: [
    '📰 Microsoft Windows 3.0 출시 — PC 대중화 임계점 돌파',
    '📰 World Wide Web 공개 소프트웨어로 배포 — 인터넷의 민주화 시작',
    '📰 걸프전 위기 — 유가 급등, 글로벌 IT 공급망 불안',
    '📰 Arpanet 공식 종료 — 민간 인터넷 시대의 완전한 개막',
    '📰 Wolfram Research, Mathematica 출시 — 과학용 소프트웨어 혁명',
  ],

  1991: [
    '📰 Linux 0.0.1 공개 — 리누스 토르발스의 역사적 첫 커밋',
    '📰 WWW 첫 웹사이트 개설 — 인터넷의 새로운 얼굴 등장',
    '📰 소련 붕괴 — 냉전 종식, 글로벌 IT 시장 재편 신호탄',
    '📰 Apple PowerBook 출시 — 현대 노트북 디자인의 원형',
    '📰 Visual Basic 1.0 출시 — RAD(빠른 앱 개발) 시대의 시작',
  ],

  1992: [
    '📰 Windows 3.1 출시, 1개월 만에 100만 카피 판매',
    '📰 CompuServe·America Online, 인터넷 접속 서비스 개시 — PC통신 전성기',
    '📰 IBM, 대규모 구조조정 발표 — IT 공룡도 혁신 없이는 살아남지 못한다',
    '📰 Sun Microsystems, Java 개발 착수(코드명 Oak) — 플랫폼 독립의 꿈',
    '📰 Nokia, 첫 GSM 휴대폰 출시 — 모바일 시대의 서막',
  ],

  1993: [
    '📰 Mosaic 웹 브라우저 출시 — 그래픽 인터넷 시대의 개막',
    '📰 Intel Pentium 출시 — 486 시대 종식, 멀티미디어 PC 대중화',
    '📰 Microsoft Office, 기업 소프트웨어 시장 석권 — 번들 전략의 승리',
    '📰 클린턴 정부, 정보 고속도로(Information Superhighway) 비전 발표',
    '📰 Apple Newton PDA 출시 — 모바일 컴퓨팅의 초기 실험',
  ],

  1994: [
    '📰 Netscape Navigator 출시 — 웹 브라우저 전쟁의 서막',
    '📰 Amazon.com 창업 — 제프 베조스의 온라인 서점, 세상을 바꾸다',
    '📰 Yahoo! 창업 — 디렉토리 방식 웹 포털의 등장',
    '📰 인터넷 사용자 수 2500만 명 돌파 — 폭발적 성장 시작',
    '📰 Pentium FDIV 버그 스캔들 — 소프트웨어 품질 신뢰의 중요성 재인식',
    '📰 PlayStation 일본 출시 — CD-ROM 기반 게임 시대 개막',
  ],

  1995: [
    '📰 Windows 95 출시 — "Start Me Up"과 함께 OS 패러다임 전환',
    '📰 Netscape IPO 대박 — 인터넷 버블의 시작을 알리는 신호',
    '📰 Java 1.0 공식 발표 — "Write Once, Run Anywhere" 시대 개막',
    '📰 eBay 창업 — 개인 간 온라인 거래 플랫폼 탄생',
    '📰 DVD 규격 확정 — 디지털 미디어 배포 방식의 전환점',
    '📰 Amazon 첫 책 판매 — 전자상거래 원년',
  ],

  1996: [
    '📰 Microsoft Internet Explorer, Netscape와 브라우저 전쟁 본격화',
    '📰 Google 창업자들, 스탠퍼드 대학원에서 BackRub 검색엔진 연구 시작',
    '📰 Palm Pilot 출시 — 진정한 의미의 포켓 컴퓨터 시대',
    '📰 Nintendo 64 출시 — 3D 게임의 황금기 시작',
    '📰 도쿄 통신 규제 완화 — 아시아 IT 시장 급성장 예고',
  ],

  1997: [
    '📰 Steve Jobs, Apple CEO 복귀 — 최악의 위기에서 전설의 부활',
    '📰 Deep Blue, 체스 챔피언 카스파로프 격파 — AI 역사의 이정표',
    '📰 아시아 외환위기 — 한국·태국 등 IT 기업 구조조정 파도',
    '📰 Amazon, 도서 외 음악·DVD로 카테고리 확장 — e커머스 팽창',
    '📰 HDTV 방송 표준 확정 — 디지털 방송 시대의 시작',
  ],

  1998: [
    '📰 Google 창업 — 페이지·브린의 검색엔진이 실리콘밸리를 뒤흔들다',
    '📰 iMac G3 출시 — 조니 아이브의 디자인 혁명, Apple 부활의 신호탄',
    '📰 Windows 98 출시 — 인터넷 통합 OS의 완성',
    '📰 Microsoft, 독점금지법 위반 소송 직면 — 빅테크 규제의 시초',
    '📰 인터넷 사용자 1억 명 돌파 — 닷컴 붐 절정을 향해',
    '📰 한국 정부, 초고속 인터넷 인프라 투자 발표 — IT 강국의 기반',
  ],

  1999: [
    '📰 Napster 출시 — P2P 파일 공유, 음악 산업과의 전쟁 선포',
    '📰 인터넷 기업 IPO 광풍 — 이익 없는 회사도 시총 수십억 달러',
    '📰 Y2K 버그 공포 — 전 세계 IT 인프라 긴급 점검',
    '📰 Wi-Fi(802.11b) 표준 제정 — 무선 인터넷 시대의 기반',
    '📰 BlackBerry 첫 스마트폰 출시 — 모바일 이메일 시대 개막',
    '📰 Linux 커널 2.2 릴리즈 — 오픈소스의 기업 서버 시장 진입',
  ],

  // ─── 2000s: 닷컴 버블 붕괴 → Web 2.0 ────────────────────────────
  2000: [
    '📰 닷컴 버블 붕괴 — NASDAQ 78% 폭락, IT 스타트업 대량 도산',
    '📰 Y2K 우려 기우로 끝나 — 수십억 달러 투자 소프트웨어 안전',
    '📰 Windows 2000 출시 — 기업용 OS의 새 표준',
    '📰 USB 2.0 규격 확정 — 주변기기 연결 방식의 혁신',
    '📰 PlayStation 2 출시 — DVD 재생 가능한 게임기로 소니 대박',
  ],

  2001: [
    '📰 Wikipedia 창설 — 집단 지성이 만드는 세계 최대 백과사전',
    '📰 애플, iTunes 출시 — 디지털 음악 유통 혁명의 시작',
    '📰 9·11 테러 — 미국 경기 침체, IT 투자 급감',
    '📰 Microsoft XP 출시 — 소비자·기업용 Windows 통합',
    '📰 최초의 iPod 출시 — "1,000곡을 주머니에" 스티브 잡스의 선언',
    '📰 닷컴 버블 여파 — Amazon·eBay 등 생존 기업만 남는 구조조정',
  ],

  2002: [
    '📰 구글, AdWords 수익 모델 안착 — 검색 광고의 황금 시대 개막',
    '📰 PayPal, eBay에 15억 달러에 인수 — 온라인 결제 인프라 통합',
    '📰 Friendster 창립 — SNS(소셜네트워크서비스)의 원조',
    '📰 Sarbanes-Oxley 법 제정 — 회계 투명성 요구로 ERP 소프트웨어 수요 급증',
    '📰 BlackBerry 6710 출시 — QWERTY 키패드 스마트폰의 기업 시장 장악',
  ],

  2003: [
    '📰 iTunes Store 개설 — 곡당 $0.99로 디지털 음악 합법 구매 시대',
    '📰 MySpace 창립 — 소셜 미디어 붐의 선구자',
    '📰 LinkedIn 창립 — 비즈니스 SNS 시장 탄생',
    '📰 이라크 전쟁 — 사이버 보안·군사 IT 예산 급증',
    '📰 Skype 창립 — VoIP로 국제 전화 요금 체계 붕괴',
    '📰 오픈소스 MySQL, 기업용 DB 시장 도전장 — LAMP 스택 전성기',
  ],

  2004: [
    '📰 Google IPO — 주당 $85, 첫날 시총 230억 달러 돌파',
    '📰 Facebook 창립 — 마크 저커버그의 하버드 기숙사 프로젝트',
    '📰 Mozilla Firefox 1.0 출시 — IE 독점 브라우저 시장에 균열',
    '📰 Web 2.0 컨퍼런스 — 사용자 참여형 인터넷 패러다임 선언',
    '📰 플리커(Flickr) 서비스 시작 — 사진 공유 플랫폼 시대 개막',
    '📰 Gmail 베타 서비스 — 1GB 무료 이메일로 웹메일 혁신',
  ],

  2005: [
    '📰 YouTube 창립 — "Broadcast Yourself", 동영상 공유 혁명',
    '📰 Google, Android 인수 — 모바일 OS 전쟁의 복선',
    '📰 Ajax 기술 부상 — Google Maps로 웹앱 인터랙티비티 혁명',
    '📰 Podcasting 붐 — 오디오 콘텐츠 민주화',
    '📰 Digg 성장 — 소셜 뉴스 집계 플랫폼의 전성기',
    '📰 Sun, Java를 오픈소스로 전환 검토 — 오픈소스 물결 거스를 수 없다',
  ],

  2006: [
    '📰 Twitter 창립 — 140자의 혁명, 실시간 소셜 미디어 시대',
    '📰 Amazon Web Services(AWS) 출시 — 클라우드 컴퓨팅 시대의 개막',
    '📰 Google, YouTube 16.5억 달러에 인수',
    '📰 Nintendo Wii 출시 — 모션 컨트롤로 게임의 대중화',
    '📰 최초의 iPhone 개발 소문 — 업계 긴장감 고조',
    '📰 Facebook, 대학 밖으로 확장 — 2000만 사용자 돌파',
  ],

  2007: [
    '📰 Apple iPhone 출시 — 스마트폰 역사를 다시 쓰다',
    '📰 Kindle 출시 — 전자책 시장의 새로운 패러다임',
    '📰 서브프라임 모기지 위기 — 금융 위기의 전주곡',
    '📰 Android OS 발표 — 구글의 모바일 생태계 구축 선언',
    '📰 Dropbox 창립 — 클라우드 스토리지 대중화의 시작',
    '📰 Facebook 플랫폼 공개 — 소셜 앱 생태계 탄생',
  ],

  2008: [
    '📰 글로벌 금융위기 — 리먼브라더스 파산, IT 투자 급속 위축',
    '📰 App Store 출시 — 모바일 앱 경제의 탄생',
    '📰 Android 첫 단말기 HTC Dream 출시 — iOS vs Android 양강 구도 형성',
    '📰 Spotify 유럽 서비스 시작 — 음악 스트리밍 구독 모델 등장',
    '📰 GitHub 창립 — 오픈소스 협업 플랫폼의 중심지',
    '📰 SaaS 모델 급부상 — 경기 침체 속 소프트웨어 구독형 전환 가속',
  ],

  2009: [
    '📰 비트코인 창시 — 사토시 나카모토의 블록체인 백서 현실화',
    '📰 WhatsApp 창립 — 모바일 메신저 혁명의 시작',
    '📰 Foursquare 등장 — 위치 기반 소셜 서비스 붐',
    '📰 구글 크롬 OS 발표 — 브라우저 중심 컴퓨팅 비전',
    '📰 Slack의 전신 Glitch 개발 시작 — 팀 협업 툴 혁명의 씨앗',
    '📰 클라우드 컴퓨팅 기업들, 경기 침체 속 오히려 성장 — SaaS의 저력',
  ],

  // ─── 2010s: 모바일·클라우드·빅데이터 시대 ─────────────────────────
  2010: [
    '📰 iPad 출시 — 태블릿 시장의 재정의',
    '📰 Instagram 창립 — 사진 필터 하나로 10억 명 사용자',
    '📰 Salesforce, 클라우드 CRM 시장 독주 — SaaS B2B 성장 증명',
    '📰 Pinterest 창립 — 비주얼 소셜 북마크의 탄생',
    '📰 한국 4G LTE 서비스 세계 최초 상용화 — 모바일 인터넷 속도 혁명',
  ],

  2011: [
    '📰 스티브 잡스 별세 — 실리콘밸리와 IT 업계 깊은 애도',
    '📰 Siri 출시 — AI 음성 비서 대중화의 시작',
    '📰 LinkedIn IPO 성공 — 비즈니스 SNS 가치 증명',
    '📰 Watson, 제퍼디! 챔피언 격파 — AI의 현실적 도약',
    '📰 클라우드 인프라 지출 1000억 달러 돌파 — IT 소비 패턴 완전 전환',
    '📰 Twilio 상장 준비 — API 이코노미의 부상',
  ],

  2012: [
    '📰 Facebook IPO — 시총 1040억 달러, 당시 역대 최대 기술 기업 IPO',
    '📰 Microsoft Azure 기업 서비스 확대 — 클라우드 3강 구도 형성',
    '📰 Instagram, Facebook에 10억 달러에 인수',
    '📰 Dropbox, 1억 명 사용자 돌파 — 개인 클라우드 시대',
    '📰 Big Data 화두 부상 — Hadoop 생태계와 데이터 분석 수요 폭발',
  ],

  2013: [
    '📰 에드워드 스노든 NSA 감시 폭로 — 개인정보 보호·암호화 수요 급증',
    '📰 Docker 출시 — 컨테이너 기술로 DevOps 혁명 시작',
    '📰 Snapchat 급성장 — 소셜 미디어 젊은 세대의 이동',
    '📰 SaaS 기업 가치 평가 기준으로 ARR 지표 정착 — 구독 경제 주류화',
    '📰 Tesla, 전기차 시장 개척 — 소프트웨어 정의 자동차 시대 예고',
  ],

  2014: [
    '📰 Slack 공식 출시 — 기업 내부 커뮤니케이션의 혁명',
    '📰 Microsoft, 모바일 퍼스트·클라우드 퍼스트 전략 선언 — 사티아 나델라 취임',
    '📰 WhatsApp, Facebook에 190억 달러에 인수 — 역대 최대 규모 M&A',
    '📰 Twitch, Amazon에 9.7억 달러에 인수 — 라이브 스트리밍 전쟁 시작',
    '📰 머신러닝 오픈소스 라이브러리 급증 — AI 민주화 가속',
  ],

  2015: [
    '📰 GitHub, 기업 가치 20억 달러로 평가 — 개발자 플랫폼의 황금기',
    '📰 Google, Alphabet으로 지주회사 체제 전환',
    '📰 OpenAI 창립 — 비영리 AI 안전 연구 조직의 탄생',
    '📰 SaaS 기업 Zendesk·HubSpot 등 상장 물결 — B2B SaaS 투자 열풍',
    '📰 Swift 오픈소스 공개 — Apple 개발 생태계 확장',
    '📰 전 세계 스마트폰 사용자 25억 명 돌파',
  ],

  2016: [
    '📰 알파고 vs 이세돌 — AI가 바둑 세계 챔피언을 이기다',
    '📰 Slack, 기업가치 37억 달러 — 협업툴 시장의 새로운 왕자',
    '📰 Microsoft, LinkedIn 262억 달러에 인수 — 엔터프라이즈 SNS 장악',
    '📰 Uber, 차량 공유 서비스로 전통 운수업 위협 — 플랫폼 비즈니스 모델 전성기',
    '📰 딥러닝 기반 이미지·음성 인식 정확도 인간 수준 돌파',
  ],

  2017: [
    '📰 AWS·Azure·GCP 3강 체제 확립 — 클라우드 시장 연 2000억 달러 돌파',
    '📰 iPhone X 출시 — Face ID와 OLED로 스마트폰 디자인 재정의',
    '📰 비트코인 $20,000 돌파 — 암호화폐 광풍',
    '📰 GDPR 준비 — 유럽 개인정보 보호 규정으로 SaaS 컴플라이언스 부담 급증',
    '📰 GitHub, 2700만 개발자 플랫폼으로 성장',
  ],

  2018: [
    '📰 GitHub, Microsoft에 75억 달러에 인수 — 개발자 생태계의 대통합',
    '📰 GDPR 시행 — 유럽 데이터 보호 강화로 SaaS 기업 대응 비용 급증',
    '📰 Zoom Video Communications, 기업 시장에서 급부상',
    '📰 Slack·Dropbox 등 SaaS 유니콘 기업 IPO 준비 — 투자 시장 과열',
    '📰 오픈소스 라이선스 논쟁 — MongoDB·Redis 등 서버사이드 공개 라이선스 전환',
  ],

  2019: [
    '📰 Zoom·Slack·Cloudflare 연이어 IPO — SaaS 투자 시장의 절정',
    '📰 WeWork IPO 실패 — 거품 경고, 스타트업 밸류에이션 재점검',
    '📰 5G 상용 서비스 시작 — 한국·미국 등 차세대 통신 시대 개막',
    '📰 Microsoft, 연 매출 1000억 달러 돌파 — 클라우드로 완벽한 부활',
    '📰 구글 양자우월성 달성 발표 — 양자컴퓨팅 시대의 예고',
    '📰 미중 무역 전쟁 — 기술 공급망 재편, 반도체·소프트웨어 국산화 가속',
  ],

  // ─── 2020s: AI 혁명기 ────────────────────────────────────────────
  2020: [
    '📰 COVID-19 팬데믹 — 재택근무 폭발, Zoom·Slack·SaaS 기업 특수',
    '📰 원격 근무 전환으로 클라우드 인프라 수요 300% 급등',
    '📰 GPT-3 발표 — 대형 언어 모델이 AI의 새 지평을 열다',
    '📰 Snowflake IPO — 역대 최대 소프트웨어 IPO 기록 갱신',
    '📰 M1 칩 발표 — Apple 실리콘으로 컴퓨터 성능 패러다임 전환',
    '📰 게임·스트리밍 산업 사상 최대 성장 — 비대면 엔터테인먼트 시대',
  ],

  2021: [
    '📰 Coinbase IPO — 암호화폐 거래소 나스닥 상장, 코인 주류화',
    '📰 NFT 열풍 — 디지털 자산 소유권 혁명인가, 투기인가',
    '📰 반도체 글로벌 공급 부족 — 자동차·전자기기 생산 차질',
    '📰 Microsoft Teams 사용자 2.7억 명 — 협업툴 시장 재편',
    '📰 Log4Shell 취약점 — 오픈소스 보안 위기의 교훈',
    '📰 메타버스 열풍 — Facebook Horizon, 가상 업무 공간의 미래?',
  ],

  2022: [
    '📰 ChatGPT 출시 — AI 챗봇이 1억 사용자 돌파, IT 역사상 최고 속도',
    '📰 글로벌 금리 인상 사이클 — 테크 기업 밸류에이션 50% 폭락',
    '📰 Twitter, 일론 머스크에 440억 달러에 인수 — 소셜 미디어 격변',
    '📰 AWS·Azure·GCP 수익성 압박 — 클라우드 비용 최적화 수요 급증',
    '📰 GitHub Copilot — AI 코드 생성 도구가 개발자 생산성 혁신',
    '📰 SaaS 기업 주가 평균 70% 하락 — 수익성 없는 성장의 종말',
  ],

  2023: [
    '📰 ChatGPT·GPT-4 출시 — 생성 AI 붐, 모든 소프트웨어 기업 AI 통합 경쟁',
    '📰 Microsoft, OpenAI에 100억 달러 투자 — AI 패권 전쟁 본격화',
    '📰 Google Bard, Meta LLaMA 등 LLM 경쟁 격화',
    '📰 SVB(실리콘밸리은행) 파산 — 스타트업 금융 생태계 충격',
    '📰 생성 AI 저작권 소송 봇물 — AI 학습 데이터 법적 지위 불명확',
    '📰 Figma, Adobe 인수 불발 — 빅테크 M&A 규제 강화',
  ],

  2024: [
    '📰 AI 에이전트 시대 개막 — GPT-4o·Claude 3·Gemini 경쟁',
    '📰 NVIDIA 시총 3조 달러 돌파 — AI 인프라 수요로 반도체 황금기',
    '📰 애플 Apple Intelligence 발표 — 온디바이스 AI 시대',
    '📰 오픈소스 LLM(Llama 3·Mistral 등) 급성장 — AI 민주화 가속',
    '📰 규제 당국, AI·빅테크 독점 집중 감시 — 글로벌 AI 규제 프레임워크 경쟁',
    '📰 AI 코딩 어시스턴트 채택률 급증 — 소프트웨어 개발 생산성 혁명',
  ],

  2025: [
    '📰 AI 에이전트 상용화 — 자율 소프트웨어 에이전트가 기업 업무 자동화',
    '📰 양자 컴퓨팅 상용화 첫 사례 등장 — 암호화 패러다임 전환 임박',
    '📰 SaaS + AI 결합 — "지능형 SaaS" 시장 급성장',
    '📰 글로벌 반도체 공급망 재편 — 미국·유럽·한국·일본 자국 생산 경쟁',
    '📰 AI 규제 글로벌 표준 논의 — EU AI Act 시행, 기업 컴플라이언스 비용 증가',
    '📰 엣지 AI 확산 — 클라우드 의존 줄이고 단말에서 직접 AI 추론',
  ],

};

// ═══════════════════════════════════════════════════════════════════
// English Headlines (parallel to HEADLINES, keyed by same years)
// ═══════════════════════════════════════════════════════════════════
const HEADLINES_EN = {

  // ─── 1980s: PC Revolution ────────────────────────────────────────
  1980: [
    '📰 IBM releases the first Personal Computer — a $1,565 revolution',
    '📰 Microsoft signs DOS supply deal with IBM — Bill Gates\'s historic gamble',
    '📰 US inflation hits 13.5% — software market feeling the turbulence',
    '📰 Apple begins the Lisa project — first commercial GUI development starts',
    '📰 Atari dominates home gaming — new frontier for the software industry',
  ],

  1981: [
    '📰 IBM PC sells 50,000 units in 4 months — Personal Computer era dawns',
    '📰 MS-DOS 1.0 officially released — foundation of the PC software ecosystem',
    '📰 Xerox PARC unveils mouse, GUI & Ethernet — Silicon Valley shocked',
    '📰 US Fed pushes interest rate past 20% — IT startup funding in crisis',
    '📰 Hayes modem standard established — dawn of the PC communications era',
  ],

  1982: [
    '📰 Compaq launches IBM PC-compatible clone — PC market competition heats up',
    '📰 AutoCAD released — software begins transforming the design industry',
    '📰 Time magazine names the Personal Computer "Person of the Year"',
    '📰 Intel announces 286 processor — software performance ceiling pushed again',
    '📰 Lotus 1-2-3 development begins — spreadsheet software revolution incoming',
  ],

  1983: [
    '📰 Apple Lisa ships — GUI-based computer goes on sale at $9,995',
    '📰 Lotus 1-2-3 instant bestseller — business software market opens up',
    '📰 Microsoft Word 1.0 released — the word processor wars begin',
    '📰 Nintendo Famicom launches in Japan — video game industry revives',
    '📰 ARPANET adopts TCP/IP — modern internet\'s foundation complete',
  ],

  1984: [
    '📰 Apple Macintosh launches — "1984" ad rewrites computer history',
    '📰 AT&T breakup — telecom deregulation slashes IT infrastructure costs',
    '📰 Michael Dell founds Dell Computer in a dorm room — direct-sales model born',
    '📰 Gibson\'s "Neuromancer" published — cyberspace concept goes mainstream',
    '📰 Borland releases Turbo Pascal for $49.95 — low-cost dev tools revolution',
  ],

  1985: [
    '📰 Microsoft Windows 1.0 released — Bill Gates\'s GUI challenge begins',
    '📰 Aldus PageMaker launches — desktop publishing industry is born',
    '📰 Steve Jobs ousted from Apple board — a defining moment in Silicon Valley history',
    '📰 Intel announces 386 processor — dawn of the 32-bit PC era',
    '📰 Plaza Accord signed — weaker dollar reshapes IT export structure',
    '📰 Commodore Amiga ships — pioneer of multimedia computing',
  ],

  1986: [
    '📰 Microsoft lists on NASDAQ — Bill Gates becomes a billionaire overnight',
    '📰 Compaq ships 386-based PC — clone maker leaps ahead of IBM',
    '📰 Pixar spins off from Lucasfilm — computer graphics studio is born',
    '📰 Thinking Machines ships Connection Machine — parallel computing era previewed',
    '📰 Chernobyl disaster — cracks in Soviet system, impact on Cold War tech race',
  ],

  1987: [
    '📰 HyperCard released — link-based information prototype, forerunner of the web',
    '📰 Black Monday (Oct 19) — Dow plunges 22%, IT investment sentiment craters',
    '📰 GIF image format emerges — foreshadows the age of internet image sharing',
    '📰 Motorola 68030 ships — Mac and workstation performance leaps forward',
    '📰 Novell NetWare dominates enterprise LAN market — office networking standardized',
  ],

  1988: [
    '📰 NeXT Computer launched — Jobs returns, pioneer of object-oriented OS',
    '📰 Morris Worm spreads — first internet worm ushers in the security era',
    '📰 Adobe Photoshop development begins — digital image editing revolution in the making',
    '📰 NEC vs IBM patent battle intensifies — IP wars rock the PC market',
    '📰 Intel 80486 development complete — the era of 10 million transistors',
  ],

  1989: [
    '📰 Tim Berners-Lee submits World Wide Web proposal — seeds of the internet revolution',
    '📰 Berlin Wall falls — Eastern Europe opens, new IT market opportunities emerge',
    '📰 Intel 80486 ships — 486 PC era, software complexity reaches new heights',
    '📰 Game Boy launches — Nintendo begins monopolizing handheld gaming',
    '📰 Adobe Photoshop 1.0 released — creative software revolution begins',
    '📰 Lotus Notes ships — groupware and enterprise collaboration software market born',
  ],

  // ─── 1990s: Web Revolution ───────────────────────────────────────
  1990: [
    '📰 Microsoft Windows 3.0 released — PC mass adoption crosses the tipping point',
    '📰 World Wide Web released as open software — democratization of the internet begins',
    '📰 Gulf War crisis — oil price spike, global IT supply chain rattled',
    '📰 ARPANET officially decommissioned — civilian internet era fully underway',
    '📰 Wolfram Research releases Mathematica — scientific software revolution',
  ],

  1991: [
    '📰 Linux 0.0.1 released — Linus Torvalds\'s historic first commit',
    '📰 First website goes live — the internet gets a new face',
    '📰 Soviet Union collapses — Cold War ends, global IT market reshapes',
    '📰 Apple PowerBook launches — the blueprint for the modern laptop',
    '📰 Visual Basic 1.0 released — the age of RAD (Rapid Application Development) begins',
  ],

  1992: [
    '📰 Windows 3.1 ships — 1 million copies sold in one month',
    '📰 CompuServe & America Online launch internet access services — online era begins',
    '📰 IBM announces massive restructuring — even tech giants must innovate or die',
    '📰 Sun Microsystems begins Java development (codename Oak) — platform independence dream',
    '📰 Nokia ships first GSM mobile phone — dawn of the mobile era',
  ],

  1993: [
    '📰 Mosaic browser released — graphical internet era begins',
    '📰 Intel Pentium ships — 486 era ends, multimedia PCs go mainstream',
    '📰 Microsoft Office dominates business software — bundling strategy wins',
    '📰 Clinton administration unveils Information Superhighway vision',
    '📰 Apple Newton PDA ships — early experiment in mobile computing',
  ],

  1994: [
    '📰 Netscape Navigator released — browser wars begin',
    '📰 Amazon.com founded — Jeff Bezos\'s online bookstore changes the world',
    '📰 Yahoo! founded — directory-style web portal emerges',
    '📰 Internet users surpass 25 million — explosive growth underway',
    '📰 Pentium FDIV bug scandal — software quality trust becomes critical',
    '📰 PlayStation launches in Japan — CD-ROM-based gaming era opens',
  ],

  1995: [
    '📰 Windows 95 launches — "Start Me Up" heralds an OS paradigm shift',
    '📰 Netscape IPO blockbuster — signals the start of the dot-com bubble',
    '📰 Java 1.0 announced — "Write Once, Run Anywhere" era begins',
    '📰 eBay founded — person-to-person online marketplace born',
    '📰 DVD standard finalized — digital media distribution at an inflection point',
    '📰 Amazon makes first book sale — e-commerce year zero',
  ],

  1996: [
    '📰 Microsoft Internet Explorer vs Netscape — browser war goes full throttle',
    '📰 Google founders begin BackRub search engine research at Stanford',
    '📰 Palm Pilot ships — the true pocket computer era arrives',
    '📰 Nintendo 64 launches — golden age of 3D gaming begins',
    '📰 Tokyo telecom deregulation — Asian IT market rapid growth signals',
  ],

  1997: [
    '📰 Steve Jobs returns as Apple CEO — legend reborn from worst-ever crisis',
    '📰 Deep Blue defeats chess champion Kasparov — AI history milestone',
    '📰 Asian financial crisis — IT restructuring wave hits Korea, Thailand and beyond',
    '📰 Amazon expands beyond books into music & DVDs — e-commerce explodes',
    '📰 HDTV broadcast standard finalized — digital broadcasting era begins',
  ],

  1998: [
    '📰 Google founded — Page & Brin\'s search engine shakes Silicon Valley',
    '📰 iMac G3 ships — Jony Ive\'s design revolution signals Apple\'s comeback',
    '📰 Windows 98 released — internet-integrated OS complete',
    '📰 Microsoft faces antitrust lawsuit — the dawn of big-tech regulation',
    '📰 Internet users surpass 100 million — dot-com boom heading for peak',
    '📰 Korean government announces broadband infrastructure investment — IT powerhouse foundation',
  ],

  1999: [
    '📰 Napster launched — P2P file sharing declares war on the music industry',
    '📰 Internet IPO frenzy — money-losing companies valued at billions',
    '📰 Y2K bug panic — global IT infrastructure emergency checks',
    '📰 Wi-Fi (802.11b) standard established — wireless internet foundation laid',
    '📰 BlackBerry ships first smartphone — mobile email era opens',
    '📰 Linux kernel 2.2 released — open source enters the enterprise server market',
  ],

  // ─── 2000s: Dot-com Bust → Web 2.0 ──────────────────────────────
  2000: [
    '📰 Dot-com bubble bursts — NASDAQ drops 78%, IT startups fail en masse',
    '📰 Y2K fears proved baseless — billions in software investment safe',
    '📰 Windows 2000 released — new standard for enterprise OS',
    '📰 USB 2.0 standard finalized — peripheral connectivity revolutionized',
    '📰 PlayStation 2 ships — Sony scores big with DVD-capable gaming console',
  ],

  2001: [
    '📰 Wikipedia launched — collective intelligence builds the world\'s largest encyclopedia',
    '📰 Apple releases iTunes — digital music distribution revolution begins',
    '📰 9/11 attacks — US recession, IT investment collapses',
    '📰 Windows XP released — consumer and enterprise Windows unified',
    '📰 First iPod ships — "1,000 songs in your pocket," Steve Jobs declares',
    '📰 Dot-com fallout — only survivors like Amazon & eBay remain after restructuring',
  ],

  2002: [
    '📰 Google AdWords revenue model matures — golden age of search advertising begins',
    '📰 PayPal acquired by eBay for $1.5B — online payment infrastructure consolidated',
    '📰 Friendster founded — the original social network',
    '📰 Sarbanes-Oxley Act passed — accounting transparency requirements spike ERP demand',
    '📰 BlackBerry 6710 ships — QWERTY smartphone dominates enterprise market',
  ],

  2003: [
    '📰 iTunes Store opens — legal digital music at $0.99 per track',
    '📰 MySpace founded — pioneer of the social media boom',
    '📰 LinkedIn founded — business social network market born',
    '📰 Iraq War begins — cybersecurity and military IT budgets surge',
    '📰 Skype founded — VoIP collapses international calling rates',
    '📰 Open-source MySQL challenges enterprise DB market — LAMP stack peaks',
  ],

  2004: [
    '📰 Google IPO — $85 per share, day-one market cap surpasses $23B',
    '📰 Facebook founded — Mark Zuckerberg\'s Harvard dorm project',
    '📰 Mozilla Firefox 1.0 released — cracks appear in IE\'s browser monopoly',
    '📰 Web 2.0 Conference — user-participatory internet paradigm declared',
    '📰 Flickr launches — photo-sharing platform era begins',
    '📰 Gmail beta — 1 GB free email reinvents web mail',
  ],

  2005: [
    '📰 YouTube founded — "Broadcast Yourself", video sharing revolution',
    '📰 Google acquires Android — mobile OS war foreshadowed',
    '📰 Ajax technology rises — Google Maps revolutionizes web app interactivity',
    '📰 Podcasting boom — audio content democratized',
    '📰 Digg grows — social news aggregation platform in its prime',
    '📰 Sun considers open-sourcing Java — open source tide is unstoppable',
  ],

  2006: [
    '📰 Twitter founded — 140-character revolution, real-time social media era',
    '📰 Amazon Web Services (AWS) launches — cloud computing era begins',
    '📰 Google acquires YouTube for $1.65B',
    '📰 Nintendo Wii ships — motion controls bring gaming to the masses',
    '📰 Rumors of first iPhone — industry on edge',
    '📰 Facebook expands beyond college campuses — 20M users surpassed',
  ],

  2007: [
    '📰 Apple iPhone launches — rewrites smartphone history',
    '📰 Kindle ships — new paradigm for the e-book market',
    '📰 Subprime mortgage crisis — prelude to financial meltdown',
    '📰 Android OS announced — Google declares mobile ecosystem ambitions',
    '📰 Dropbox founded — cloud storage goes mainstream',
    '📰 Facebook Platform opens — social app ecosystem born',
  ],

  2008: [
    '📰 Global financial crisis — Lehman Brothers collapses, IT investment contracts fast',
    '📰 App Store launches — the mobile app economy is born',
    '📰 HTC Dream ships first Android device — iOS vs Android duopoly forms',
    '📰 Spotify launches in Europe — music streaming subscription model emerges',
    '📰 GitHub founded — center of the open source collaboration universe',
    '📰 SaaS model surges — subscription software accelerates amid economic downturn',
  ],

  2009: [
    '📰 Bitcoin created — Satoshi Nakamoto\'s blockchain white paper becomes reality',
    '📰 WhatsApp founded — mobile messaging revolution begins',
    '📰 Foursquare emerges — location-based social service boom',
    '📰 Google Chrome OS announced — browser-centric computing vision',
    '📰 Glitch development begins (Slack precursor) — team collaboration tool revolution seeds planted',
    '📰 Cloud companies grow through recession — SaaS proves its resilience',
  ],

  // ─── 2010s: Mobile, Cloud & Big Data ─────────────────────────────
  2010: [
    '📰 iPad launches — tablet market redefined',
    '📰 Instagram founded — one photo filter, one billion users',
    '📰 Salesforce dominates cloud CRM — B2B SaaS growth proven',
    '📰 Pinterest founded — visual social bookmarking born',
    '📰 Korea first to commercialize 4G LTE — mobile internet speed revolution',
  ],

  2011: [
    '📰 Steve Jobs passes away — Silicon Valley and tech industry mourn deeply',
    '📰 Siri launches — AI voice assistant goes mainstream',
    '📰 LinkedIn IPO success — business SNS value proven',
    '📰 Watson defeats Jeopardy! champions — AI makes a real-world leap',
    '📰 Cloud infrastructure spending surpasses $100B — IT consumption fully transformed',
    '📰 Twilio prepares for IPO — rise of the API economy',
  ],

  2012: [
    '📰 Facebook IPO — $104B market cap, largest tech IPO at the time',
    '📰 Microsoft Azure expands enterprise services — cloud three-way race forms',
    '📰 Instagram acquired by Facebook for $1B',
    '📰 Dropbox surpasses 100M users — personal cloud era',
    '📰 Big Data rises — Hadoop ecosystem and analytics demand explode',
  ],

  2013: [
    '📰 Edward Snowden exposes NSA surveillance — privacy and encryption demand spikes',
    '📰 Docker released — container technology sparks DevOps revolution',
    '📰 Snapchat surges — younger generation migrates on social media',
    '📰 ARR metric entrenched as SaaS valuation standard — subscription economy mainstream',
    '📰 Tesla pioneers EV market — software-defined car era foreshadowed',
  ],

  2014: [
    '📰 Slack officially launches — revolution in enterprise internal communication',
    '📰 Microsoft declares Mobile First, Cloud First strategy — Satya Nadella takes helm',
    '📰 WhatsApp acquired by Facebook for $19B — largest M&A ever at the time',
    '📰 Twitch acquired by Amazon for $970M — live streaming wars begin',
    '📰 Open-source ML libraries proliferate — AI democratization accelerates',
  ],

  2015: [
    '📰 GitHub valued at $2B — developer platform golden age',
    '📰 Google restructures under Alphabet holding company',
    '📰 OpenAI founded — non-profit AI safety research organization born',
    '📰 Zendesk, HubSpot and other SaaS firms go public — B2B SaaS investment frenzy',
    '📰 Swift open-sourced — Apple developer ecosystem expands',
    '📰 Global smartphone users surpass 2.5 billion',
  ],

  2016: [
    '📰 AlphaGo vs Lee Se-dol — AI defeats world Go champion',
    '📰 Slack valued at $3.7B — new king of the collaboration tools market',
    '📰 Microsoft acquires LinkedIn for $26.2B — enterprise SNS locked down',
    '📰 Uber disrupts traditional transport with ride-sharing — platform business model peaks',
    '📰 Deep learning image and speech recognition surpasses human accuracy',
  ],

  2017: [
    '📰 AWS, Azure & GCP consolidate as the big three — cloud market tops $200B annually',
    '📰 iPhone X ships — Face ID and OLED redefine smartphone design',
    '📰 Bitcoin surpasses $20,000 — crypto mania',
    '📰 GDPR preparations — EU privacy regulations spike SaaS compliance costs',
    '📰 GitHub grows to 27 million developers',
  ],

  2018: [
    '📰 GitHub acquired by Microsoft for $7.5B — developer ecosystem mega-merger',
    '📰 GDPR takes effect — EU data protection forces SaaS compliance spending surge',
    '📰 Zoom Video Communications surges in the enterprise market',
    '📰 Slack, Dropbox and other SaaS unicorns prepare IPOs — investment market overheats',
    '📰 Open-source license debate — MongoDB, Redis switch to server-side public licenses',
  ],

  2019: [
    '📰 Zoom, Slack, Cloudflare IPOs in quick succession — SaaS market at its peak',
    '📰 WeWork IPO collapses — bubble warning, startup valuations reassessed',
    '📰 5G commercial services launch — Korea, US and others enter next-gen telecom era',
    '📰 Microsoft annual revenue tops $100B — cloud-powered comeback complete',
    '📰 Google claims quantum supremacy — quantum computing era previewed',
    '📰 US-China trade war — tech supply chain reshuffled, semiconductor & software localization accelerates',
  ],

  // ─── 2020s: AI Revolution ────────────────────────────────────────
  2020: [
    '📰 COVID-19 pandemic — remote work explodes, Zoom / Slack / SaaS companies boom',
    '📰 Cloud infrastructure demand surges 300% as the world goes remote',
    '📰 GPT-3 announced — large language models open a new frontier for AI',
    '📰 Snowflake IPO — breaks record as largest-ever software IPO',
    '📰 M1 chip unveiled — Apple Silicon shifts the computing performance paradigm',
    '📰 Gaming & streaming see greatest growth ever — contactless entertainment era',
  ],

  2021: [
    '📰 Coinbase IPO — crypto exchange lists on NASDAQ, coins go mainstream',
    '📰 NFT craze — digital asset ownership revolution, or speculation?',
    '📰 Global semiconductor shortage — auto and electronics production disrupted',
    '📰 Microsoft Teams hits 270 million users — collaboration tool market reshuffled',
    '📰 Log4Shell vulnerability — lessons from the open-source security crisis',
    '📰 Metaverse mania — Facebook Horizon, future of virtual workspaces?',
  ],

  2022: [
    '📰 ChatGPT launches — AI chatbot hits 100M users at fastest pace in IT history',
    '📰 Global rate-hike cycle — tech company valuations drop 50%',
    '📰 Twitter acquired by Elon Musk for $44B — social media upheaval',
    '📰 AWS, Azure & GCP face profitability pressure — cloud cost optimization demand spikes',
    '📰 GitHub Copilot — AI code generation tool revolutionizes developer productivity',
    '📰 SaaS stocks fall 70% on average — the end of growth without profits',
  ],

  2023: [
    '📰 ChatGPT & GPT-4 launch — generative AI boom, every software company races to integrate AI',
    '📰 Microsoft invests $10B in OpenAI — AI supremacy war goes full throttle',
    '📰 Google Bard, Meta LLaMA intensify LLM competition',
    '📰 SVB (Silicon Valley Bank) collapses — startup financial ecosystem shocked',
    '📰 Generative AI copyright lawsuits flood courts — AI training data legal status unclear',
    '📰 Figma-Adobe acquisition blocked — big-tech M&A regulation tightens',
  ],

  2024: [
    '📰 AI agent era begins — GPT-4o, Claude 3 & Gemini compete head-to-head',
    '📰 NVIDIA market cap tops $3 trillion — AI infrastructure demand fuels semiconductor golden age',
    '📰 Apple Intelligence announced — on-device AI era arrives',
    '📰 Open-source LLMs (Llama 3, Mistral, etc.) surge — AI democratization accelerates',
    '📰 Regulators intensify scrutiny of AI & big-tech monopolies — global AI regulation frameworks race ahead',
    '📰 AI coding assistant adoption soars — software development productivity revolution',
  ],

  2025: [
    '📰 AI agents go commercial — autonomous software agents automate enterprise workflows',
    '📰 First quantum computing commercial case emerges — encryption paradigm shift imminent',
    '📰 SaaS + AI convergence — "Intelligent SaaS" market surges',
    '📰 Global semiconductor supply chain reshuffles — US, Europe, Korea & Japan race for domestic production',
    '📰 Global AI regulation standards debated — EU AI Act in force, enterprise compliance costs rise',
    '📰 Edge AI proliferates — AI inference moves on-device, reducing cloud dependency',
  ],

};

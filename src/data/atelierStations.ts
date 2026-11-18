export type StopId =
  | 'overview'
  | 'law-office'
  | 'mcp-tower'
  | 'mass-study'
  | 'comp-audit'
  | 'drawing-qa'
  | 'supervision-post'
  | 'bookstand'
  | 'cabinet'
  | 'board';

export type LightingMode = 'day' | 'night';

export interface StationVariable {
  key: string;
  label: string;
  defaultValue: string;
  placeholder: string;
}

export interface BookChapter {
  number: string;
  title: string;
  durationOrPages: string;
  summary: string;
  keyTopics: string[];
  sampleSnippet: string;
}

export interface StudioStop {
  id: StopId;
  indexLabel: string;
  shortTitle: string;
  title: string;
  category: 'OVERVIEW' | 'PROMPT' | 'MCP' | 'BOOK' | 'PORTFOLIO' | 'BOARD';
  drawingNo: string;
  recommendedModel: string;
  isSample: boolean;
  /** Optional path to a custom .glb asset that replaces procedural architecture */
  modelUrl?: string;
  summary: string;
  usageNote: string;
  variables: StationVariable[];
  template: string;
  authorLine?: string;
  chapters?: BookChapter[];
}

export const STUDIO_STOPS: StudioStop[] = [
  {
    id: 'overview',
    indexLabel: '00',
    shortTitle: '단지 전경',
    title: '이든 디지털 아틀리에 미니어처 단지',
    category: 'OVERVIEW',
    drawingNo: 'SITE-00',
    recommendedModel: 'E:DEN AI × Architecture',
    isSample: false,
    summary:
      '책상 위 청사진에서 피어난 6개 건축 AI·MCP 건물 단지와 우측 교재 북스탠드입니다. 스크롤하거나 미니맵·건물을 선택하면 청사진 및 교재 시트가 자동으로 펼쳐집니다.',
    usageNote: '',
    variables: [],
    template: '',
  },
  {
    id: 'law-office',
    indexLabel: '01',
    shortTitle: '법규 검토소',
    title: '법규 · 인허가 사전검토',
    category: 'PROMPT',
    drawingNo: 'PROMPT-01',
    recommendedModel: 'Claude Sonnet / GPT-4o',
    isSample: true,
    summary: '대지 조건별 건폐·용적률, 일조사선, 주차대수 핵심 체크리스트를 도출합니다.',
    usageNote: '',
    variables: [
      { key: 'municipality', label: '지자체', defaultValue: '경북 포항시 북구', placeholder: '서울 강남구' },
      { key: 'zoning', label: '용도지역', defaultValue: '제2종일반주거지역', placeholder: '준주거지역' },
      { key: 'scale', label: '대지·규모', defaultValue: '486㎡ · 3층 근생', placeholder: '330㎡ · 지상 2층' },
    ],
    template: `대상지: {{municipality}} | {{zoning}} | {{scale}}

위 조건을 기준으로 건축법 및 지자체 조례 사전검토표를 작성하세요.
1. 건폐율·용적률 법정 상한 및 여유율
2. 정북 일조사선 및 대지경계선 이격거리
3. 법정 부설주차장 대수 및 세움터 보완 리스크
출력: [위험 / 주의 / 양호] 요약표 + 근거 조문`,
  },
  {
    id: 'mcp-tower',
    indexLabel: '02',
    shortTitle: '대장 MCP',
    title: '건축물대장 · 토지이음 MCP',
    category: 'MCP',
    drawingNo: 'MCP-01',
    recommendedModel: 'MCP Stdio (JSON-RPC 2.0)',
    isSample: true,
    summary: '건축물대장·토지이용계획 공공 API 연결용 MCP 예시 설정입니다. (실제 서버·키로 교체 사용)',
    usageNote: '',
    variables: [
      { key: 'sigunguCode', label: '시군구코드', defaultValue: '47111', placeholder: '47111' },
      { key: 'bjdongCode', label: '법정동코드', defaultValue: '10100', placeholder: '10100' },
    ],
    template: `{
  "mcpServers": {
    "eden-arch-registry": {
      "command": "npx",
      "args": ["-y", "@eden-atelier/arch-registry-mcp"],
      "env": {
        "PUBLIC_DATA_API_KEY": "\${DATA_GO_KR_KEY}",
        "SIGUNGU_CD": "{{sigunguCode}}",
        "BJDONG_CD": "{{bjdongCode}}"
      }
    }
  }
}`,
  },
  {
    id: 'mass-study',
    indexLabel: '03',
    shortTitle: '매스 스터디관',
    title: '경사지 · 조망축 매스 스터디',
    category: 'PROMPT',
    drawingNo: 'PROMPT-02',
    recommendedModel: 'Claude Sonnet / Gemini Pro',
    isSample: true,
    summary: '대지 고저차와 주조망축을 반영한 초기 매스 대안 3가지를 비교합니다.',
    usageNote: '',
    variables: [
      { key: 'slopeDelta', label: '고저차', defaultValue: '3.6m', placeholder: '3.6m' },
      { key: 'viewAxis', label: '주조망축', defaultValue: '남동향 (영일만)', placeholder: '남향' },
      { key: 'program', label: '프로그램', defaultValue: '카페 · 근생 (150%)', placeholder: '단독주택' },
    ],
    template: `대지 조건: 고저차 {{slopeDelta}} | 주조망 {{viewAxis}} | {{program}}

지형과 조망을 반영한 초기 매스 대안 3가지를 비교 제안하세요.
- A안 (지형 순응형): 스킵플로어 및 절성토 최소화
- B안 (조망 특화형): {{viewAxis}} 개방 및 하부 필로티 주차
- C안 (중정 분동형): 채광·환기 중정 및 프라이버시 확보
출력: 안별 층수·면적 효율·공사비 증감 비교표`,
  },
  {
    id: 'comp-audit',
    indexLabel: '04',
    shortTitle: '설계공모 분석실',
    title: '설계공모 지침 · 면적 검산',
    category: 'PROMPT',
    drawingNo: 'PROMPT-03',
    recommendedModel: 'Claude Sonnet / GPT-4o',
    isSample: true,
    summary: '설계공모 지침서의 실격 조건과 소요실 면적 오차를 검산합니다.',
    usageNote: '',
    variables: [
      { key: 'totalGfa', label: '기준 연면적', defaultValue: '1,850㎡', placeholder: '1,850㎡' },
      { key: 'tolerance', label: '허용 오차', defaultValue: '±5% 이내', placeholder: '±5%' },
      { key: 'keyFacility', label: '필수 소요실', defaultValue: '다목적홀 · 수장고', placeholder: '강당 · 사무실' },
    ],
    template: `공모 기준: 연면적 {{totalGfa}} ({{tolerance}}) | 필수실: {{keyFacility}}

첨부된 설계공모 지침서와 면적표를 대조해 다음을 검산하세요.
1. 익명성·도서 규격·대지경계 등 실격 사유 저촉 여부
2. 실별 전용·공용 합계 대비 {{totalGfa}} ({{tolerance}}) 준수 여부
3. 심사 배점 항목별 핵심 대응 누락 사항
출력: 실격 체크표 + 면적 오차 검산표`,
  },
  {
    id: 'drawing-qa',
    indexLabel: '05',
    shortTitle: '도면 검수원',
    title: '실시설계 도면 정합성 MCP',
    category: 'MCP',
    drawingNo: 'MCP-02',
    recommendedModel: 'MCP Stdio + Python DXF Parser',
    isSample: true,
    summary: '도면목록표·도번·창호기호 불일치 검수용 MCP 예시 설정입니다. (실제 서버·경로로 교체 사용)',
    usageNote: '',
    variables: [
      { key: 'disciplineSet', label: '검수 공종', defaultValue: 'A, S, M, E', placeholder: 'A, S, M, E' },
      { key: 'cadFormat', label: '도면 포맷', defaultValue: 'DXF / PDF', placeholder: 'DXF / PDF' },
    ],
    template: `{
  "mcpServers": {
    "eden-sheet-qa": {
      "command": "uv",
      "args": ["run", "eden-sheet-qa-mcp"],
      "env": {
        "DISCIPLINE_SCOPE": "{{disciplineSet}}",
        "DRAWING_FORMAT": "{{cadFormat}}"
      }
    }
  }
}`,
  },
  {
    id: 'supervision-post',
    indexLabel: '06',
    shortTitle: '공사감리 포스트',
    title: '현장 공사감리 · 배근 체크',
    category: 'PROMPT',
    drawingNo: 'PROMPT-04',
    recommendedModel: 'Claude Sonnet (Vision + Doc)',
    isSample: true,
    summary: '검측 단계별 KDS 구조기준 확인 항목과 시정요청 문안을 생성합니다.',
    usageNote: '',
    variables: [
      { key: 'structureType', label: '구조 형식', defaultValue: '철근콘크리트(RC)', placeholder: 'RC조' },
      { key: 'inspectionStage', label: '검측 공정', defaultValue: '3층 슬래브·보 배근', placeholder: '기초 배근' },
      { key: 'seismicGrade', label: '적용 기준', defaultValue: 'KDS 41 17 00', placeholder: '내진 1등급' },
    ],
    template: `검측 대상: {{structureType}} | {{inspectionStage}} | {{seismicGrade}}

현장 감리 검측 시 필수 확인 항목과 시정요청 문안을 작성하세요.
1. 주근·스트럽 정착길이(135° 갈고리) 및 피복두께 스페이서 확인
2. 설비 슬리브 관통부 보강근 누락 여부 점검
3. 부적합 사항 발견 시 감리일지용 [위치 · 근거 · 시정요구] 초안`,
  },
  {
    id: 'bookstand',
    indexLabel: '07',
    shortTitle: '교재 북스탠드',
    title: '건축 AI · 바이브 코딩 실무 교재 & 강의안',
    category: 'BOOK',
    drawingNo: 'BOOK-01',
    recommendedModel: 'Curriculum · TextBook Slot',
    isSample: true,
    authorLine: '강진호 대표건축사 · 한동대학교 겸임교수 (SAMPLE 교재 목차)',
    summary:
      '책상 우측 원목 독서대에 펼쳐진 건축 AI 워크플로우 · MCP 활용 교재 및 대학/실무 특강 커리큘럼입니다. 실제 출판·강의 링크가 준비되면 바로 연결됩니다.',
    usageNote: '챕터를 선택하면 핵심 강의 주제와 실습 프롬프트 예시를 바로 확인하고 복사할 수 있습니다.',
    variables: [],
    template: `[E:DEN 아틀리에 건축 AI 교재 요약 (SAMPLE)]
저자: 강진호 대표건축사 ((주)이든건축사사무소 / 한동대학교 겸임교수)
구성: 총 5장 · 건축 설계 실무 AI 프롬프트, 공공데이터 MCP 구축, 도면·감리 자동화`,
    chapters: [
      {
        number: 'Ch.01',
        title: '건축사사무소의 AI 워크플로우 재설계',
        durationOrPages: 'PART 01 · pp. 12–48',
        summary: '설계 도면과 법규 검토 사이에서 반복되는 수작업을 구조화된 프롬프트 체계로 전환하는 설계자 관점의 기준을 다룹니다.',
        keyTopics: ['기획설계-실시설계-감리 단계별 AI 개입 지도', '할루시네이션 차단용 대지 제원 고정 템플릿', '건축사 판단(APPROVED)과 AI 보조의 책임 경계'],
        sampleSnippet: `// Ch.01 실습: 프로젝트 컨텍스트 락(Context Lock) 헤더\n[SITE_CONTEXT]\n지자체: 경북 포항시 | 용도: 근린생활시설 | 원칙: 법규 조문 미확인 시 '추정 금지'`,
      },
      {
        number: 'Ch.02',
        title: '법규 · 세움터 인허가 프롬프트 엔지니어링',
        durationOrPages: 'PART 02 · pp. 49–96',
        summary: '건축법·국토계획법 및 지자체 조례 조건을 입력 변수({{}})로 모듈화하여 세움터 보완 리스크를 줄이는 실습입니다.',
        keyTopics: ['건폐율·용적률·정북 일조사선 단계별 계산 체인', '부설주차장 및 소방·피난 교차 검증 표 생성', '허가권자 질의 대응용 법령 근거 정리'],
        sampleSnippet: `// Ch.02 실습: 일조권 체크 매크로 지시문\n조건: 전용/일반주거지역 정북방향 9m 이하 1.5m, 초과 시 높이 1/2 이격 수치 산출`,
      },
      {
        number: 'Ch.03',
        title: '공공데이터 · 건축물대장 MCP 서버 구축',
        durationOrPages: 'PART 03 · pp. 97–154',
        summary: '국토교통부 건축물대장 표제부·토지이용계획 API를 Model Context Protocol(MCP) 도구로 묶어 에이전트와 직접 연결합니다.',
        keyTopics: ['MCP Stdio JSON-RPC 서버 기본 구조', '시군구·법정동·지번 파라미터 조회 Tool 정의', '표제부 위반건축물·내진설계 여부 자동 파싱'],
        sampleSnippet: `// Ch.03 실습: MCP Tool 정의 스키마\ntool: "get_building_title_summary" -> args: { sigunguCd: "47111", bjdongCd: "10100" }`,
      },
      {
        number: 'Ch.04',
        title: '초기 매스 스터디와 설계공모 지침 검증',
        durationOrPages: 'PART 04 · pp. 155–208',
        summary: '경사지 레벨 차와 조망축을 반영한 대안 매스 시나리오 및 수십 쪽짜리 설계공모 지침서의 실격·면적 오차 자동 검산을 익힙니다.',
        keyTopics: ['지형 고저차 기반 스킵플로어·캔틸레버 매스 매트릭스', '공공건축 설계공모 스페이스 프로그램 ±5% 자동 검산', '심사 배점 지표 대비 설계 개념 점검'],
        sampleSnippet: `// Ch.04 실습: 공모 면적 오차 검산\nsum(실별 전용면적) * (1 + 공용률) in [기준연면적 * 0.95, 기준연면적 * 1.05]`,
      },
      {
        number: 'Ch.05',
        title: '도면 · 시방 정합성 검수 및 현장 감리 자동화',
        durationOrPages: 'PART 05 · pp. 209–260',
        summary: '납품 전 도면목록표-표제란 정합 검수 MCP 활용법과 KDS 내진·배근 현장 감리 체크리스트 생성 워크플로우를 다룹니다.',
        keyTopics: ['DXF/PDF 도면목록표 vs 파일명·도번 상호 대조', '창호기호 및 특기시방서 누락 코드 탐지', '현장 검측 사진·기상 조건 연동 감리 일지 작성'],
        sampleSnippet: `// Ch.05 실습: 감리 시정요청 문안 포맷\n[지적위치] 3F B12 보 단부 | [근거] KDS 41 17 00 | [요구] 135° 후프 간격 100mm 재배근`,
      },
    ],
  },
  {
    id: 'cabinet',
    indexLabel: '08',
    shortTitle: '수상작 장식장',
    title: '이든건축 대표 수상·준공작 9선 쇼케이스',
    category: 'PORTFOLIO',
    drawingNo: 'ARC-01~09',
    recommendedModel: '(주)이든건축사사무소 검증 아카이브',
    isSample: false,
    summary:
      '책상 우측 3×3 박공 원목 장식장에 진열된 이든건축사사무소 대표 수상작·준공작 9선 모형과 실제 제원입니다. 칸을 클릭하면 모형이 하이라이트됩니다.',
    usageNote: '수상작 및 준공작의 공식 제원·상훈·공식 웹사이트 상세 링크를 확인할 수 있습니다.',
    variables: [],
    template: '',
  },
  {
    id: 'board',
    indexLabel: '09',
    shortTitle: '벽면 게시판',
    title: '아틀리에 전체 요약 핀보드 · 사무소 아카이브',
    category: 'BOARD',
    drawingNo: 'BOARD-ALL',
    recommendedModel: 'E:DEN AI + Architecture Index',
    isSample: false,
    summary:
      '벽면 대형 코르크 게시판에 꽂힌 AI 프롬프트·MCP·교재·수상작 9선 전체 카드와 강진호 대표건축사 및 사무소 공식 정보를 한눈에 탐색합니다.',
    usageNote: '',
    variables: [],
    template: '',
  },
];

export const ROADMAP_PREVIEW_NODES = [
  { id: '08', label: '수상작 9선 장식장', stopId: 'cabinet' as StopId },
  { id: '09', label: '벽면 전체 게시판', stopId: 'board' as StopId },
] as const;

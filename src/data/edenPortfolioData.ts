export interface FeaturedProject {
  id: string;
  code: string;
  shelfRow: 0 | 1 | 2;
  shelfCol: 0 | 1 | 2;
  name: string;
  location: string;
  usage: string;
  siteArea: string;
  buildingArea: string;
  grossFloorArea: string;
  scale: string;
  structure: string;
  year: string;
  award: string | null;
  summary: string;
  url: string | null;
}

export const EDEN_FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'arc-01',
    code: 'ARC-01',
    shelfRow: 0,
    shelfCol: 0,
    name: 'Breath Taking',
    location: '경북 포항시 북구 여남동',
    usage: '제2종근린생활시설 (카페·상업)',
    siteArea: '486.00 ㎡',
    buildingArea: '96.90 ㎡',
    grossFloorArea: '199.19 ㎡',
    scale: '지상 3층',
    structure: '철근콘크리트구조',
    year: '2024',
    award: '2024 경상북도 건축문화상 우수상',
    summary: '영일만 바다를 조망하는 과감한 개구부와 매스 분절, 미니멀한 노출콘크리트 질감 구현.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/200',
  },
  {
    id: 'arc-02',
    code: 'ARC-02',
    shelfRow: 0,
    shelfCol: 1,
    name: 'POETIES (포이티스)',
    location: '경북 포항시 북구 환호동',
    usage: '제2종근린생활시설',
    siteArea: '267.00 ㎡',
    buildingArea: '114.77 ㎡',
    grossFloorArea: '244.60 ㎡',
    scale: '지상 3층',
    structure: '철근콘크리트구조',
    year: '2022',
    award: '2022 제14회 포항시 건축문화상 우수상',
    summary: '환호공원과 해안선이 교차하는 지점에서 빛과 그림자의 시적 변주를 담아냄.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/198',
  },
  {
    id: 'arc-03',
    code: 'ARC-03',
    shelfRow: 0,
    shelfCol: 2,
    name: '구름 속 산책',
    location: '경북 포항시 남구 이동',
    usage: '단독주택',
    siteArea: '363.00 ㎡',
    buildingArea: '145.22 ㎡',
    grossFloorArea: '231.80 ㎡',
    scale: '지상 2층',
    structure: '철근콘크리트구조',
    year: '2021',
    award: '2021 제13회 포항시 건축문화상 우수상',
    summary: '도심 구릉지형의 경사를 활용해 구름 위를 거니는 듯한 층별 입체적 동선과 프라이빗 중정 설계.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/199',
  },
  {
    id: 'arc-04',
    code: 'ARC-04',
    shelfRow: 1,
    shelfCol: 0,
    name: '소행성K',
    location: '경북 포항시',
    usage: '단독주택',
    siteArea: '공개 기록 없음',
    buildingArea: '공개 기록 없음',
    grossFloorArea: '공개 기록 없음',
    scale: '지상 2층',
    structure: '철근콘크리트구조',
    year: '2018',
    award: '2018 제11회 포항시 건축문화상 장려상 (소호건축사사무소 시기)',
    summary: '소호건축사사무소 시절 강진호 대표 수상작.',
    url: null,
  },
  {
    id: 'arc-05',
    code: 'ARC-05',
    shelfRow: 1,
    shelfCol: 1,
    name: 'Tan Tan Bi (탄탄비)',
    location: '경북 포항시 북구 기계면',
    usage: '단독주택 (전원주택)',
    siteArea: '1,440.00 ㎡',
    buildingArea: '99.88 ㎡',
    grossFloorArea: '99.88 ㎡',
    scale: '지상 1층',
    structure: '철근콘크리트구조',
    year: '2024 준공',
    award: null,
    summary: '자연과 맞닿은 낮은 단층 매스, 단단하고 비워진 수평적 공간미와 목재/콘크리트의 조화.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/197',
  },
  {
    id: 'arc-06',
    code: 'ARC-06',
    shelfRow: 1,
    shelfCol: 2,
    name: 'ONE MORE DAY',
    location: '경북 포항시 남구 지곡동',
    usage: '단독주택',
    siteArea: '330.00 ㎡',
    buildingArea: '131.88 ㎡',
    grossFloorArea: '197.80 ㎡',
    scale: '지상 2층',
    structure: '철근콘크리트구조',
    year: '2023 준공',
    award: null,
    summary: '도심 주거단지 내에서 가족의 프라이버시를 보호하면서도 햇살을 최대한 끌어들이는 중정형 주택.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/196',
  },
  {
    id: 'arc-07',
    code: 'ARC-07',
    shelfRow: 2,
    shelfCol: 0,
    name: '이순당 (耳順堂)',
    location: '경북 포항시 북구 청하면',
    usage: '단독주택',
    siteArea: '496.00 ㎡',
    buildingArea: '99.30 ㎡',
    grossFloorArea: '99.30 ㎡',
    scale: '지상 1층',
    structure: '경량목구조 / 철근콘크리트',
    year: '2023 준공',
    award: null,
    summary: '귀가 순해진다는 "이순"의 나이에 자연의 소리를 듣는 집. 전통 한옥의 채 나눔을 현대적으로 재해석.',
    url: 'http://www.e-den.kr/myboard/ma_galler3/195',
  },
  {
    id: 'arc-08',
    code: 'ARC-08',
    shelfRow: 2,
    shelfCol: 1,
    name: 'LAYERED',
    location: '경북 포항시 남구 대잠동',
    usage: '제2종근린생활시설',
    siteArea: '248.00 ㎡',
    buildingArea: '148.20 ㎡',
    grossFloorArea: '398.50 ㎡',
    scale: '지상 4층',
    structure: '철근콘크리트구조',
    year: '2023 준공',
    award: null,
    summary: '입면의 레이어를 통해 내부 프라이버시 조절 및 도시 가로에 역동적인 파사드 제공.',
    url: null,
  },
  {
    id: 'arc-09',
    code: 'ARC-09',
    shelfRow: 2,
    shelfCol: 2,
    name: 'Double Triangle',
    location: '경북 포항시 북구 흥해읍',
    usage: '제2종근린생활시설',
    siteArea: '512.00 ㎡',
    buildingArea: '198.40 ㎡',
    grossFloorArea: '385.10 ㎡',
    scale: '지상 3층',
    structure: '철근콘크리트구조',
    year: '2022 준공',
    award: null,
    summary: '대지의 예각 조건을 역이용해 두 개의 삼각형 매스가 교차하는 조형적 랜드마크 형성.',
    url: null,
  },
];

export const EDEN_OFFICE_INFO = {
  nameKo: '주식회사 이든건축사사무소',
  shortNameKo: '(주)이든건축사사무소',
  nameEn: 'E:DEN Architects & Associates',
  slogan: '건축(E:)을 담다(DEN)',
  addressRoad: '경상북도 포항시 남구 대이로1번길 16 (대잠동), 철길숲빌딩 2층',
  phones: ['054-283-9141', '054-282-9141'],
  fax: '054-284-9141',
  emails: {
    official: 'e-den9141@naver.com',
    principal: 'jinho9210@naver.com',
  },
  website: 'http://www.e-den.kr',
  totalWorksCount: 89,
  registrations: [
    '대한건축사협회(KIRA) 경상북도건축사회 포항지역건축사회 정회원사',
    '세움터 인허가 등록업체',
    '조달청 나라장터 공공입찰·설계공모 참가 등록업체',
  ],
};

export const PRINCIPAL_ARCHITECT_INFO = {
  nameKo: '강진호',
  nameHanja: '姜振鎬',
  role: '대표이사 · 대표건축사 (김동효 건축사와 공동대표)',
  education: ['포항고등학교 졸업', '영남대학교 공과대학 건축공학과 졸업'],
  career: [
    '2015.02 ~ 2019.04 : 소호건축사사무소 대표',
    '2019.05 ~ 현재 : (주)이든건축사사무소 대표이사 / 대표건축사',
    '2021.03 ~ 현재 : 한동대학교 공간환경시스템공학부 겸임교수',
  ],
  activities: [
    '대한민국 공인건축사 · 대한건축사협회(KIRA) 정회원',
    '한국건축가협회(KIA) 정회원 · 포항지역건축사회 정회원',
    '공공건축 설계공모 심사위원 (경주여고 체육관·생활관 보수 설계용역 공모 등)',
  ],
  awards: [
    { year: '2016', title: '경북건축문화제 초대작가상', project: '' },
    { year: '2017', title: '포항시 지진피해복구유공 표창장', project: '' },
    { year: '2018', title: '제11회 포항시 건축문화상 우수상 / 장려상', project: '소행성K' },
    { year: '2021', title: '제13회 포항시 건축문화상 우수상', project: '구름 속 산책' },
    { year: '2022', title: '제14회 포항시 건축문화상 우수상', project: 'POETIES (포이티스)' },
    { year: '2023', title: '경북건축문화제 초대작가상', project: '' },
    { year: '2024', title: '경상북도 건축문화상 우수상', project: 'Breath Taking' },
  ],
  corePhilosophy: '형태의 기교나 과시보다는 사람의 삶과 일상을 정직하게 담아내는 그릇으로서의 건축',
  quote:
    '급변하는 사회와 환경 속에서 건축사의 업무 영역은 단순히 건축 인허가와 도면 작성에 머물러서는 안 되며, 삶의 방식과 공공성, 도시 환경을 종합적으로 재설계하는 포괄적인 역할로 재정립되어야 합니다.',
  quoteSource: '대한건축사협회 건축사신문 기고 (2026-09-02)',
};

export interface MediaRecord {
  typeLabel: string;
  outlet: string;
  title: string;
  dateNote: string;
  url: string;
}

export const EDEN_MEDIA_RECORDS: MediaRecord[] = [
  {
    typeLabel: '인터뷰',
    outlet: '월간 아키월드 (Archiworld Journal)',
    title: '[ZOOM IN] 삶을 담아내는 정직한 그릇을 짓다 - 강진호·김동효 건축사',
    dateNote: 'POETIES·구름 속 산책 도면 해설',
    url: 'http://www.archiworldjournal.com/news/articleView.html?idxno=3610',
  },
  {
    typeLabel: '기획',
    outlet: '이슈메이커 (Issue Maker)',
    title: '소통과 신뢰로 완성하는 건축 - (주)이든건축사사무소 강진호·김동효 대표',
    dateNote: '2019 법인 통합 및 내진 안전 철학',
    url: 'http://www.issuemaker.kr/news/articleView.html?idxno=23384',
  },
  {
    typeLabel: '기고',
    outlet: '대한건축사협회 건축사신문 (ANC News)',
    title: '[발언대] 건축사의 업무를 다시 설계해야 하는 시대',
    dateNote: '2026-09-02',
    url: 'http://www.ancnews.kr/news/articleView.html?idxno=21037',
  },
  {
    typeLabel: '심사',
    outlet: '주택폴리오 (Jootek Folio)',
    title: '공공건축 설계공모 심사위원 기록 (경주여자고등학교 체육관·생활관)',
    dateNote: '공공건축 심사 이력',
    url: 'https://jootek.com/folio/judges/21890',
  },
];

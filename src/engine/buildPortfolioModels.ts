import * as THREE from 'three';
import { addPart } from '@/engine/buildArchitecture';
import { makeToonMat } from '@/engine/toonMaterials';

export interface PortfolioCubbyModel {
  group: THREE.Group;
  padMat: THREE.MeshToonMaterial;
  glowMaterials: THREE.MeshToonMaterial[];
}

function addExtrudedShape(
  parent: THREE.Object3D,
  shape: THREE.Shape,
  depth: number,
  mat: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number]
): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  if (rot) mesh.rotation.set(...rot);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Watertight curved concrete shell built via outer/inner arc extrusion (lies horizontally centered around origin).
 */
function addCurvedWall(
  parent: THREE.Object3D,
  rInner: number,
  rOuter: number,
  height: number,
  startAng: number,
  endAng: number,
  mat: THREE.Material,
  pos: [number, number, number]
): void {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOuter, startAng, endAng, false);
  s.absarc(0, 0, rInner, endAng, startAng, true);
  s.closePath();
  addExtrudedShape(parent, s, height, mat, pos, [-Math.PI / 2, 0, 0]);
}

function createWindowPanel(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  pos: [number, number, number],
  cols = 2,
  rotY = 0
): void {
  const g = new THREE.Group();
  g.position.set(...pos);
  g.rotation.y = rotY;
  addPart(g, new THREE.BoxGeometry(w + 0.03, h + 0.03, d * 0.65), frameMat, [0, 0, -0.004]);
  addPart(g, new THREE.BoxGeometry(w, h, d), glassMat, [0, 0, 0.004]);
  for (let i = 1; i < cols; i += 1) {
    const mx = -w / 2 + (w * i) / cols;
    addPart(g, new THREE.BoxGeometry(0.022, h + 0.01, d + 0.018), frameMat, [mx, 0, 0.008]);
  }
  parent.add(g);
}

function addScaleTree(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  scale: number,
  crownMat: THREE.Material,
  trunkMat: THREE.Material
): void {
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.scale.setScalar(scale);
  addPart(tree, new THREE.CylinderGeometry(0.018, 0.026, 0.16, 7), trunkMat, [0, 0.08, 0]);
  addPart(tree, new THREE.IcosahedronGeometry(0.105, 1), crownMat, [0, 0.2, 0]);
  addPart(tree, new THREE.IcosahedronGeometry(0.072, 1), crownMat, [0.055, 0.17, 0.03]);
  parent.add(tree);
}

/**
 * Project 01: Breath Taking (경주 감포 — 경사지 계단식 노출콘크리트 곡선 풀빌라 4동)
 */
function buildBreathTaking(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const hillsideMat = makeToonMat(gradientMap, 0x8ea171);
  const foliageMat = makeToonMat(gradientMap, 0x5c7d48);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const roadMat = makeToonMat(gradientMap, 0xd4ccbe);
  const concreteMat = makeToonMat(gradientMap, 0xe4e0d8);
  const darkConcreteMat = makeToonMat(gradientMap, 0x5c6066);
  const cedarDeckMat = makeToonMat(gradientMap, 0xb88656);
  const poolMat = makeToonMat(gradientMap, 0x5bbcd9);
  const glassRailMat = makeToonMat(gradientMap, 0x9bd2e8);
  const windowMat = makeToonMat(gradientMap, 0x325878, { emissive: 0xffd072, emissiveIntensity: 0.12 });
  glowMaterials.push(windowMat);

  // Stepped hillside terrain pads & central stepped drive spine
  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), hillsideMat, [0, baseY + 0.04, 0]);
  addPart(root, new THREE.BoxGeometry(2.22, 0.14, 1.44), hillsideMat, [0, baseY + 0.11, -0.3]);
  addPart(root, new THREE.BoxGeometry(2.18, 0.18, 0.84), hillsideMat, [0, baseY + 0.22, -0.58]);
  addPart(root, new THREE.BoxGeometry(0.28, 0.12, 1.94), roadMat, [0, baseY + 0.14, 0.05], [-0.14, 0, 0]);

  for (let s = 0; s < 5; s += 1) {
    addPart(root, new THREE.BoxGeometry(0.16, 0.06, 0.34), roadMat, [-0.96, baseY + 0.1 + s * 0.06, 0.78 - s * 0.35]);
  }

  // Coastal hillside architectural shrubs & scale trees
  addScaleTree(root, -0.96, baseY + 0.08, 0.08, 0.9, foliageMat, trunkMat);
  addScaleTree(root, 0.98, baseY + 0.18, -0.06, 0.86, foliageMat, trunkMat);
  addScaleTree(root, 0.0, baseY + 0.31, -0.84, 0.82, foliageMat, trunkMat);

  const villas = [
    { x: -0.53, y: baseY + 0.14, z: 0.54, towerD: [0.38, 0.44, 0.38] as const, arcR: 0.42, start: -0.4, end: 2.35 },
    { x: 0.53, y: baseY + 0.18, z: 0.46, towerD: [0.4, 0.48, 0.36] as const, arcR: 0.44, start: 0.7, end: 3.4 },
    { x: -0.55, y: baseY + 0.3, z: -0.5, towerD: [0.38, 0.5, 0.38] as const, arcR: 0.42, start: -0.2, end: 2.5 },
    { x: 0.53, y: baseY + 0.34, z: -0.55, towerD: [0.42, 0.54, 0.38] as const, arcR: 0.44, start: 0.6, end: 3.3 },
  ];

  villas.forEach((v, vi) => {
    const g = new THREE.Group();
    g.position.set(v.x, v.y, v.z);

    // Courtyard slab, timber terrace deck, infinity pool & glass pool edge + sun loungers
    addPart(g, new THREE.BoxGeometry(0.86, 0.06, 0.82), concreteMat, [0, 0.03, 0]);
    const poolSideX = vi % 2 === 0 ? 0.14 : -0.14;
    addPart(g, new THREE.BoxGeometry(0.48, 0.04, 0.44), cedarDeckMat, [poolSideX, 0.07, 0.13]);
    addPart(g, new THREE.BoxGeometry(0.32, 0.03, 0.24), poolMat, [poolSideX, 0.085, 0.17]);
    addPart(g, new THREE.BoxGeometry(0.34, 0.05, 0.016), glassRailMat, [poolSideX, 0.105, 0.3]);
    addPart(g, new THREE.BoxGeometry(0.11, 0.025, 0.055), concreteMat, [poolSideX + (vi % 2 === 0 ? 0.12 : -0.12), 0.1, 0.01]);

    // Sweeping semicircular exposed concrete privacy shell + dark coping cap ring
    addCurvedWall(g, v.arcR - 0.07, v.arcR, 0.34, v.start, v.end, concreteMat, [0, 0.06, 0.02]);
    addCurvedWall(g, v.arcR - 0.076, v.arcR + 0.008, 0.032, v.start, v.end, darkConcreteMat, [0, 0.4, 0.02]);

    // Two-story rectangular concrete guest wing + corner mullion + skylight penthouse
    const tx = vi % 2 === 0 ? -0.18 : 0.18;
    const [tw, th, td] = v.towerD;
    addPart(g, new THREE.BoxGeometry(tw, th, td), concreteMat, [tx, 0.06 + th / 2, -0.14]);
    addPart(g, new THREE.BoxGeometry(tw * 0.48, 0.08, td * 0.48), darkConcreteMat, [tx, 0.06 + th + 0.04, -0.14]);
    addPart(g, new THREE.BoxGeometry(0.026, th, 0.026), darkConcreteMat, [tx + (tx < 0 ? -tw / 2 : tw / 2), 0.06 + th / 2, -0.14 + td / 2]);
    createWindowPanel(g, tw * 0.68, th * 0.52, 0.03, darkConcreteMat, windowMat, [tx, 0.06 + th * 0.52, -0.14 + td / 2], 2);

    root.add(g);
  });
}

/**
 * Project 02: POETIES (포이티스 — V자형 대칭 경사 콘크리트 트윈 빌라 & 중앙 진입 계단)
 */
function buildPoeties(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const concreteMat = makeToonMat(gradientMap, 0xe8e4dc);
  const darkConcreteMat = makeToonMat(gradientMap, 0x70747b);
  const frameMat = makeToonMat(gradientMap, 0x2b3036);
  const poolMat = makeToonMat(gradientMap, 0x56bad8);
  const courtyardMat = makeToonMat(gradientMap, 0xd4cec4);
  const foliageMat = makeToonMat(gradientMap, 0x62844c);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const glassMat = makeToonMat(gradientMap, 0x3b6586, { emissive: 0xffd175, emissiveIntensity: 0.15 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.1, 2.08), courtyardMat, [0, baseY + 0.05, 0]);
  addPart(root, new THREE.BoxGeometry(0.75, 0.28, 0.08), concreteMat, [-0.62, baseY + 0.2, 0.8], [0, 0.24, 0]);
  addPart(root, new THREE.BoxGeometry(0.75, 0.28, 0.08), concreteMat, [0.62, baseY + 0.2, 0.8], [0, -0.24, 0]);

  addScaleTree(root, -0.98, baseY + 0.1, 0.62, 0.85, foliageMat, trunkMat);
  addScaleTree(root, 0.98, baseY + 0.1, 0.62, 0.85, foliageMat, trunkMat);

  // Central exterior staircase ascending between the two villas + slender steel handrail & canopy
  for (let s = 0; s < 7; s += 1) {
    addPart(root, new THREE.BoxGeometry(0.24, 0.08, 0.14), concreteMat, [0, baseY + 0.12 + s * 0.075, 0.56 - s * 0.12]);
  }
  addPart(root, new THREE.BoxGeometry(0.022, 0.024, 0.88), frameMat, [-0.13, baseY + 0.48, 0.2], [0.56, 0, 0]);
  addPart(root, new THREE.BoxGeometry(0.022, 0.024, 0.88), frameMat, [0.13, baseY + 0.48, 0.2], [0.56, 0, 0]);
  addPart(root, new THREE.BoxGeometry(0.34, 0.035, 0.24), darkConcreteMat, [0, baseY + 0.72, -0.22]);

  // Twin V-angled Villas (Left angled +14 deg, Right angled -14 deg)
  [-1, 1].forEach((side) => {
    const wing = new THREE.Group();
    wing.position.set(side * 0.57, baseY + 0.1, -0.05);
    wing.rotation.y = side * -0.24;

    // 1F Recessed Concrete Podium + Glazing
    addPart(wing, new THREE.BoxGeometry(0.84, 0.52, 0.96), concreteMat, [0, 0.26, -0.06]);
    createWindowPanel(wing, 0.68, 0.36, 0.04, frameMat, glassMat, [0, 0.24, 0.42], 3);

    // 1F Terrace Rooftop Turquoise Pool Strip + Clear Parapet Coping
    addPart(wing, new THREE.BoxGeometry(0.76, 0.04, 0.22), poolMat, [0, 0.54, 0.26]);
    addPart(wing, new THREE.BoxGeometry(0.78, 0.08, 0.03), glassMat, [0, 0.58, 0.38]);

    // Sloped concrete wing wall bracing side facade + horizontal form-tie reveal bands
    addPart(wing, new THREE.BoxGeometry(0.08, 0.58, 0.92), darkConcreteMat, [side * -0.4, 0.3, -0.04]);
    addPart(wing, new THREE.BoxGeometry(0.095, 0.018, 0.9), frameMat, [side * -0.4, 0.26, -0.04]);
    addPart(wing, new THREE.BoxGeometry(0.095, 0.018, 0.9), frameMat, [side * -0.4, 0.45, -0.04]);

    // 2F Cantilevered Horizontal Panoramic Box Volume + Projecting Hood Frame + Porthole detail
    addPart(wing, new THREE.BoxGeometry(0.92, 0.54, 0.86), concreteMat, [side * 0.03, 0.82, -0.15]);
    createWindowPanel(wing, 0.78, 0.38, 0.04, frameMat, glassMat, [side * 0.03, 0.82, 0.27], 4);
    // Projecting upper/lower/side concrete frame fins giving deep 3D overhang shadow
    addPart(wing, new THREE.BoxGeometry(0.92, 0.055, 0.1), concreteMat, [side * 0.03, 1.07, 0.3]);
    addPart(wing, new THREE.BoxGeometry(0.92, 0.055, 0.1), concreteMat, [side * 0.03, 0.57, 0.3]);
    addPart(wing, new THREE.BoxGeometry(0.055, 0.54, 0.1), concreteMat, [side * 0.03 - 0.43, 0.82, 0.3]);
    addPart(wing, new THREE.BoxGeometry(0.055, 0.54, 0.1), concreteMat, [side * 0.03 + 0.43, 0.82, 0.3]);

    if (side === 1) {
      addPart(wing, new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16), frameMat, [-0.3, 0.84, 0.31], [Math.PI / 2, 0, 0]);
    }

    if (side === -1) {
      addPart(wing, new THREE.BoxGeometry(0.32, 0.18, 0.28), darkConcreteMat, [0.1, 1.18, -0.18]);
    }

    root.add(wing);
  });
}

/**
 * Project 03: 구름 속 산책 (포항 — 6원통 필로티 + 유선형 4연 원통 구름 매스 + 2개의 흰 원형 링 캐노피)
 */
function buildCloudWalk(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const plazaMat = makeToonMat(gradientMap, 0xd8d3c9);
  const deckMat = makeToonMat(gradientMap, 0xbe8958);
  const whiteCloudMat = makeToonMat(gradientMap, 0xfaf8f3);
  const frameMat = makeToonMat(gradientMap, 0x2f3640);
  const parasolMat = makeToonMat(gradientMap, 0xe8e2d5);
  const foliageMat = makeToonMat(gradientMap, 0x5c7d48);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const glassMat = makeToonMat(gradientMap, 0x3b6587, { emissive: 0xffd070, emissiveIntensity: 0.16 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), plazaMat, [0, baseY + 0.04, 0]);

  // Curved scalloped cedar deck & recessed 1F cafe glass core
  addPart(root, new THREE.CylinderGeometry(0.66, 0.68, 0.07, 20), deckMat, [-0.2, baseY + 0.11, 0.12]);
  addPart(root, new THREE.CylinderGeometry(0.54, 0.56, 0.07, 20), deckMat, [0.42, baseY + 0.11, 0.18]);
  addPart(root, new THREE.BoxGeometry(1.18, 0.44, 0.72), glassMat, [0.05, baseY + 0.34, -0.05]);
  addPart(root, new THREE.BoxGeometry(1.22, 0.06, 0.76), frameMat, [0.05, baseY + 0.56, -0.05]);

  // Outdoor terrace parasol cafe tables on cedar deck + perimeter tree
  [-0.45, 0.5].forEach((tx) => {
    const tz = tx < 0 ? 0.52 : 0.48;
    addPart(root, new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), frameMat, [tx, baseY + 0.24, tz]);
    addPart(root, new THREE.CylinderGeometry(0.11, 0.11, 0.018, 12), parasolMat, [tx, baseY + 0.25, tz]);
    addPart(root, new THREE.ConeGeometry(0.15, 0.05, 12), parasolMat, [tx, baseY + 0.34, tz]);
  });
  addScaleTree(root, 0.96, baseY + 0.08, 0.64, 0.85, foliageMat, trunkMat);

  // Tall slender cylindrical pilotis supporting upper clouds & floating rings
  const cols: [number, number, number][] = [
    [-0.78, 0.48, 1.56],
    [-0.22, 0.58, 1.56],
    [0.36, 0.56, 1.56],
    [0.78, 0.32, 0.92],
    [-0.64, -0.45, 0.92],
    [0.58, -0.45, 0.92],
  ];
  cols.forEach(([cx, cz, ch]) => {
    addPart(root, new THREE.CylinderGeometry(0.038, 0.042, ch, 12), whiteCloudMat, [cx, baseY + 0.08 + ch / 2, cz]);
  });

  // 2F Sculpted Cluster of 4 Overlapping White Cylindrical Cloud Lobes + Slab Edge Trim Rings
  const lobes = [
    { x: -0.58, z: 0.02, r: 0.36, h: 0.74 },
    { x: -0.1, z: 0.16, r: 0.46, h: 0.78 },
    { x: 0.44, z: 0.12, r: 0.44, h: 0.78 },
    { x: 0.12, z: -0.34, r: 0.42, h: 0.84 },
  ];
  lobes.forEach((lb) => {
    addPart(root, new THREE.CylinderGeometry(lb.r, lb.r, lb.h, 24), whiteCloudMat, [lb.x, baseY + 0.56 + lb.h / 2, lb.z]);
    addPart(root, new THREE.CylinderGeometry(lb.r + 0.028, lb.r + 0.028, 0.042, 24), whiteCloudMat, [lb.x, baseY + 0.58, lb.z]);
    addPart(root, new THREE.CylinderGeometry(lb.r + 0.028, lb.r + 0.028, 0.042, 24), whiteCloudMat, [lb.x, baseY + 0.56 + lb.h, lb.z]);
  });

  // Scattered Square & Vertical Punched Windows across Curved Cloud Facade
  [
    [-0.56, baseY + 0.96, 0.37, 0.12, 0.12, -0.15],
    [-0.25, baseY + 0.82, 0.59, 0.11, 0.11, -0.28],
    [-0.08, baseY + 1.04, 0.625, 0.12, 0.18, 0.04],
    [0.24, baseY + 0.92, 0.56, 0.12, 0.24, -0.35],
    [0.52, baseY + 1.06, 0.558, 0.11, 0.11, 0.18],
    [0.48, baseY + 0.78, 0.562, 0.2, 0.12, 0.1],
  ].forEach(([wx, wy, wz, ww, wh, rotY]) => {
    createWindowPanel(root, ww, wh, 0.03, frameMat, glassMat, [wx, wy, wz], 1, rotY);
  });

  // 3F Terrace Penthouse + Glass Parapet Rail + Dual Floating Ring Canopy Halos with Radial Louvers
  addPart(root, new THREE.BoxGeometry(0.95, 0.32, 0.56), whiteCloudMat, [-0.02, baseY + 1.48, -0.1]);
  createWindowPanel(root, 0.78, 0.22, 0.03, frameMat, glassMat, [-0.02, baseY + 1.48, 0.18], 4);
  addPart(root, new THREE.BoxGeometry(0.98, 0.11, 0.025), glassMat, [0, baseY + 1.4, 0.28]);
  addPart(root, new THREE.BoxGeometry(1.0, 0.02, 0.035), frameMat, [0, baseY + 1.455, 0.28]);

  const ringSpecs = [
    { x: -0.32, z: 0.14, rOut: 0.56, rIn: 0.28 },
    { x: 0.3, z: 0.08, rOut: 0.62, rIn: 0.32 },
  ];
  ringSpecs.forEach((rg) => {
    const sh = new THREE.Shape();
    sh.absarc(0, 0, rg.rOut, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, rg.rIn, 0, Math.PI * 2, true);
    sh.holes.push(hole);
    addExtrudedShape(root, sh, 0.06, whiteCloudMat, [rg.x, baseY + 1.66, rg.z], [-Math.PI / 2, 0, 0]);
    [-0.38, 0.16, 0.7].forEach((ang) => {
      addPart(root, new THREE.BoxGeometry(rg.rIn * 2.02, 0.03, 0.032), whiteCloudMat, [rg.x, baseY + 1.69, rg.z], [0, ang, 0]);
    });
  });
}

/**
 * Project 04: 소행성K / 각설탕 (포항 — 4층 순백색 도시형 코너 큐브 & 1층 필로티 그린 벽체 & 옥상 프레임 포털)
 */
function buildSohaengsung(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const streetMat = makeToonMat(gradientMap, 0xc7ccd2);
  const baseGreyMat = makeToonMat(gradientMap, 0xadb4be);
  const whiteCubeMat = makeToonMat(gradientMap, 0xfaf8f2);
  const cedarMat = makeToonMat(gradientMap, 0xb88656);
  const greenCoreMat = makeToonMat(gradientMap, 0x43784a);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const frameMat = makeToonMat(gradientMap, 0x353c45);
  const glassMat = makeToonMat(gradientMap, 0x385e7c, { emissive: 0xffd070, emissiveIntensity: 0.14 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), streetMat, [0, baseY + 0.04, 0]);
  addScaleTree(root, 0.88, baseY + 0.08, 0.78, 0.85, greenCoreMat, trunkMat);

  // 1F Cool-Grey Street Base + Recessed Entry Canopy & Glass + Pilotis Green Core
  addPart(root, new THREE.BoxGeometry(1.12, 0.44, 1.38), baseGreyMat, [-0.34, baseY + 0.3, -0.06]);
  addPart(root, new THREE.BoxGeometry(0.82, 0.32, 0.04), glassMat, [-0.14, baseY + 0.26, 0.64]);
  addPart(root, new THREE.BoxGeometry(0.56, 0.04, 0.22), frameMat, [-0.14, baseY + 0.44, 0.72]);
  addPart(root, new THREE.BoxGeometry(0.68, 0.4, 0.08), greenCoreMat, [0.48, baseY + 0.28, -0.18]);
  addPart(root, new THREE.BoxGeometry(0.14, 0.44, 0.14), whiteCubeMat, [0.82, baseY + 0.3, 0.56]);
  addPart(root, new THREE.BoxGeometry(0.14, 0.44, 0.14), whiteCubeMat, [0.36, baseY + 0.3, 0.56]);

  // 2F-3F Pure White Interlocking Cube Body + Architectural Slab Reveal Lines
  addPart(root, new THREE.BoxGeometry(1.76, 0.86, 1.42), whiteCubeMat, [-0.02, baseY + 0.95, -0.06]);
  addPart(root, new THREE.BoxGeometry(1.78, 0.018, 1.44), baseGreyMat, [-0.02, baseY + 0.74, -0.06]);
  addPart(root, new THREE.BoxGeometry(1.78, 0.018, 1.44), baseGreyMat, [-0.02, baseY + 1.37, -0.06]);

  // Upper-left 4F stepped cube + pitched rear dormer + rooftop terrace timber deck & planter
  addPart(root, new THREE.BoxGeometry(1.1, 0.46, 1.18), whiteCubeMat, [-0.3, baseY + 1.61, -0.16]);
  addPart(root, new THREE.BoxGeometry(0.96, 0.2, 0.6), whiteCubeMat, [0.05, baseY + 1.92, -0.26]);
  addPart(root, new THREE.BoxGeometry(0.72, 0.03, 0.46), cedarMat, [-0.48, baseY + 1.4, 0.36]);
  addPart(root, new THREE.BoxGeometry(0.18, 0.09, 0.18), greenCoreMat, [-0.7, baseY + 1.45, 0.4]);

  // Open White Rooftop Portal Frame + Guardrail
  addPart(root, new THREE.BoxGeometry(0.08, 0.64, 0.12), whiteCubeMat, [-0.84, baseY + 1.7, 0.54]);
  addPart(root, new THREE.BoxGeometry(0.08, 0.64, 0.12), whiteCubeMat, [-0.12, baseY + 1.7, 0.54]);
  addPart(root, new THREE.BoxGeometry(0.8, 0.09, 0.12), whiteCubeMat, [-0.48, baseY + 2.02, 0.54]);
  addPart(root, new THREE.BoxGeometry(0.76, 0.16, 0.04), frameMat, [-0.48, baseY + 1.46, 0.62]);

  // Projecting Dark Metal Window Hoods & Recessed Windows
  const wins: [number, number, number, number, number][] = [
    [-0.52, baseY + 1.18, 0.66, 0.48, 0.28],
    [0.54, baseY + 0.82, 0.66, 0.36, 0.32],
    [-0.26, baseY + 0.86, 0.66, 0.14, 0.14],
    [0.12, baseY + 1.14, 0.66, 0.24, 0.2],
    [-0.44, baseY + 1.64, 0.44, 0.26, 0.22],
  ];
  wins.forEach(([wx, wy, wz, ww, wh], idx) => {
    createWindowPanel(root, ww, wh, 0.04, frameMat, glassMat, [wx, wy, wz], idx < 2 ? 2 : 1);
    addPart(root, new THREE.BoxGeometry(ww + 0.05, 0.025, 0.045), frameMat, [wx, wy + wh / 2 + 0.012, wz + 0.015]);
  });
}

/**
 * Project 05: Tan Tan Bi / 탄탄비 (포항 — 3개 수직 리브 모노타일 매스 & 45도 대각선 삼각형 커튼월)
 */
function buildTanTanBi(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const groundMat = makeToonMat(gradientMap, 0xd8ceb2);
  const deckMat = makeToonMat(gradientMap, 0xc39666);
  const foliageMat = makeToonMat(gradientMap, 0x5c7d48);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const tileMat = makeToonMat(gradientMap, 0xa89f92);
  const ribMat = makeToonMat(gradientMap, 0x8a8175);
  const frameMat = makeToonMat(gradientMap, 0x353b42);
  const glassMat = makeToonMat(gradientMap, 0x3d688a, { emissive: 0xffd070, emissiveIntensity: 0.14 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), groundMat, [0, baseY + 0.04, 0]);
  for (let s = 0; s < 3; s += 1) {
    addPart(root, new THREE.BoxGeometry(0.68 - s * 0.12, 0.05, 0.42), deckMat, [-0.56, baseY + 0.08 + s * 0.04, 0.62]);
  }
  addScaleTree(root, -0.94, baseY + 0.08, 0.72, 0.85, foliageMat, trunkMat);
  addPart(root, new THREE.BoxGeometry(0.32, 0.12, 0.16), foliageMat, [0.58, baseY + 0.14, 0.68]);

  const addDiagonalCutVolume = (
    cx: number,
    cz: number,
    w: number,
    h: number,
    d: number,
    leftCut: number,
    rightCut: number,
    hasRoofNotch = false
  ) => {
    const g = new THREE.Group();
    g.position.set(cx, baseY + 0.08, cz);

    const glassH = Math.min(h * 0.62, 0.65);
    addPart(g, new THREE.BoxGeometry(w - 0.06, glassH, d - 0.12), glassMat, [0, glassH / 2, -0.02]);
    for (let m = -1; m <= 1; m += 1) {
      addPart(g, new THREE.BoxGeometry(0.022, glassH, d - 0.08), frameMat, [(m * w) / 4, glassH / 2, -0.01]);
    }

    const s = new THREE.Shape();
    s.moveTo(-w / 2, leftCut);
    s.lineTo(-w / 2 + leftCut, 0);
    s.lineTo(w / 2 - rightCut, 0);
    s.lineTo(w / 2, rightCut);
    s.lineTo(w / 2, h);
    if (hasRoofNotch) {
      s.lineTo(0.05, h);
      s.lineTo(-0.08, h - 0.2);
      s.lineTo(-0.08, h);
    }
    s.lineTo(-w / 2, h);
    s.closePath();
    addExtrudedShape(g, s, d, tileMat, [0, 0, -d / 2]);

    // Diagonal 45-deg structural steel edge trim highlighting triangular curtain-wall cutouts
    if (leftCut > 0.05) {
      addPart(
        g,
        new THREE.BoxGeometry(leftCut * Math.SQRT2, 0.026, d + 0.03),
        frameMat,
        [-w / 2 + leftCut / 2, leftCut / 2, 0],
        [0, 0, -Math.PI / 4]
      );
    }
    if (rightCut > 0.05) {
      addPart(
        g,
        new THREE.BoxGeometry(rightCut * Math.SQRT2, 0.026, d + 0.03),
        frameMat,
        [w / 2 - rightCut / 2, rightCut / 2, 0],
        [0, 0, Math.PI / 4]
      );
    }
    // Crisp dark-metal roof parapet cap
    if (!hasRoofNotch) {
      addPart(g, new THREE.BoxGeometry(w + 0.02, 0.032, d + 0.02), frameMat, [0, h + 0.016, 0]);
    } else {
      // Recessed double entry door frame on central block
      addPart(g, new THREE.BoxGeometry(0.24, 0.3, 0.04), frameMat, [0.18, 0.16, d / 2 + 0.015]);
    }

    const finCount = Math.floor(w / 0.085);
    for (let f = 0; f < finCount; f += 1) {
      const fx = -w / 2 + 0.05 + f * (w / finCount);
      const bottomY =
        fx < -w / 2 + leftCut
          ? leftCut - (fx + w / 2)
          : fx > w / 2 - rightCut
          ? rightCut - (w / 2 - fx)
          : 0;
      const finH = Math.max(0.08, h - bottomY - 0.04);
      if (finH > 0.12) {
        addPart(g, new THREE.BoxGeometry(0.018, finH, 0.02), ribMat, [fx, bottomY + finH / 2, d / 2 + 0.01]);
      }
    }

    root.add(g);
  };

  addDiagonalCutVolume(-0.68, -0.22, 0.62, 0.94, 0.84, 0.34, 0.34, false);
  addDiagonalCutVolume(0.68, -0.18, 0.66, 0.9, 0.86, 0.32, 0.34, false);
  addDiagonalCutVolume(0.0, 0.14, 0.72, 1.38, 0.96, 0.56, 0.16, true);
  addPart(root, new THREE.BoxGeometry(0.64, 0.14, 0.03), frameMat, [0.68, baseY + 1.04, 0.22]);
}

/**
 * Project 06: ONE MORE DAY (포항 장길리 — 에메랄드 포인트 1F + 다크 캔틸레버 2F + 타공 파라펫 옥상 수영장)
 */
function buildOneMoreDay(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const courtyardMat = makeToonMat(gradientMap, 0xd8d3ca);
  const lawnMat = makeToonMat(gradientMap, 0x678f50);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const stoneWallMat = makeToonMat(gradientMap, 0x87898d);
  const whiteMat = makeToonMat(gradientMap, 0xf6f3ec);
  const greenAccentMat = makeToonMat(gradientMap, 0x266b47);
  const darkSlateBoxMat = makeToonMat(gradientMap, 0x454a52);
  const deckMat = makeToonMat(gradientMap, 0xbe8958);
  const poolMat = makeToonMat(gradientMap, 0x5bbcd9);
  const brassMat = makeToonMat(gradientMap, 0xe4b855);
  const frameMat = makeToonMat(gradientMap, 0x2a2f36);
  const glassMat = makeToonMat(gradientMap, 0x3b6587, { emissive: 0xffd175, emissiveIntensity: 0.18 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), courtyardMat, [0, baseY + 0.04, 0]);
  addPart(root, new THREE.BoxGeometry(0.68, 0.02, 0.52), lawnMat, [0.56, baseY + 0.09, 0.36]);
  addScaleTree(root, 0.66, baseY + 0.1, 0.44, 0.85, lawnMat, trunkMat);

  // Horizontal courtyard wall + slatted vertical cedar entry gate
  addPart(root, new THREE.BoxGeometry(1.14, 0.28, 0.09), stoneWallMat, [0.38, baseY + 0.22, 0.72]);
  addPart(root, new THREE.BoxGeometry(0.09, 0.28, 0.78), stoneWallMat, [0.92, baseY + 0.22, 0.36]);
  addPart(root, new THREE.BoxGeometry(1.18, 0.04, 0.12), whiteMat, [0.38, baseY + 0.37, 0.72]);
  [-0.32, -0.27, -0.22].forEach((gx) => {
    addPart(root, new THREE.BoxGeometry(0.025, 0.26, 0.025), deckMat, [gx, baseY + 0.21, 0.72]);
  });

  // 1F: White wall + Signature Emerald Green Panel + Full-height Corner Glass Living Room
  addPart(root, new THREE.BoxGeometry(0.76, 0.62, 1.12), whiteMat, [-0.52, baseY + 0.39, -0.18]);
  addPart(root, new THREE.BoxGeometry(0.18, 0.34, 0.04), greenAccentMat, [-0.74, baseY + 0.36, 0.39]);
  createWindowPanel(root, 0.22, 0.42, 0.03, frameMat, glassMat, [-0.46, baseY + 0.39, 0.39], 1);

  addPart(root, new THREE.BoxGeometry(0.96, 0.6, 0.96), glassMat, [0.22, baseY + 0.38, -0.14]);
  addPart(root, new THREE.BoxGeometry(0.04, 0.6, 0.04), frameMat, [0.7, baseY + 0.38, 0.34]);
  addPart(root, new THREE.BoxGeometry(0.04, 0.6, 0.04), frameMat, [0.22, baseY + 0.38, 0.34]);

  // 2F: Cantilevered Dark-Charcoal Stone Frame Box + Horizontal Coursing Grooves
  const box2Y = baseY + 0.7;
  addPart(root, new THREE.BoxGeometry(1.66, 0.62, 1.18), darkSlateBoxMat, [-0.04, box2Y + 0.31, -0.06]);
  addPart(root, new THREE.BoxGeometry(1.68, 0.016, 1.2), frameMat, [-0.04, box2Y + 0.14, -0.06]);
  addPart(root, new THREE.BoxGeometry(1.68, 0.016, 1.2), frameMat, [-0.04, box2Y + 0.48, -0.06]);
  createWindowPanel(root, 1.18, 0.44, 0.04, frameMat, glassMat, [0.16, box2Y + 0.31, 0.54], 5);
  createWindowPanel(root, 0.96, 0.44, 0.04, frameMat, glassMat, [0.8, box2Y + 0.31, -0.02], 3, Math.PI / 2);

  // Roof: Turquoise Rooftop Lap Pool + Stepped Timber Deck Stairs + Handrail + Pierced White Parapet Screen Wall
  const roofY = box2Y + 0.62;
  addPart(root, new THREE.BoxGeometry(1.24, 0.04, 0.86), deckMat, [0.05, roofY + 0.02, -0.1]);
  addPart(root, new THREE.BoxGeometry(0.84, 0.05, 0.44), poolMat, [0.12, roofY + 0.04, -0.05]);
  addPart(root, new THREE.BoxGeometry(0.24, 0.06, 0.14), deckMat, [-0.46, roofY + 0.05, -0.24]);
  addPart(root, new THREE.BoxGeometry(0.025, 0.1, 0.18), brassMat, [-0.28, roofY + 0.08, -0.04]);

  const parapet = new THREE.Shape();
  parapet.moveTo(-0.84, 0);
  parapet.lineTo(0.32, 0);
  parapet.lineTo(0.32, 0.42);
  parapet.lineTo(-0.84, 0.28);
  parapet.closePath();
  const holeRect = new THREE.Path();
  holeRect.moveTo(-0.62, 0.14);
  holeRect.lineTo(-0.34, 0.14);
  holeRect.lineTo(-0.34, 0.24);
  holeRect.lineTo(-0.62, 0.24);
  holeRect.closePath();
  const holeTri = new THREE.Path();
  holeTri.moveTo(0.14, 0.18);
  holeTri.lineTo(0.26, 0.18);
  holeTri.lineTo(0.24, 0.34);
  holeTri.closePath();
  parapet.holes.push(holeRect, holeTri);
  addExtrudedShape(root, parapet, 0.07, whiteMat, [0, roofY, 0.42]);
}

/**
 * Project 07: 이순당 耳順堂 (포항 — 1F 적벽돌+코너 투명 계단실 / 2F 백색 캔틸레버 박공+오목 발코니)
 */
function buildIsundang(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const streetMat = makeToonMat(gradientMap, 0xd4cdc2);
  const redBrickMat = makeToonMat(gradientMap, 0xa25040);
  const whiteStuccoMat = makeToonMat(gradientMap, 0xfaf7f0);
  const timberStairMat = makeToonMat(gradientMap, 0xb88555);
  const foliageMat = makeToonMat(gradientMap, 0x5c7d48);
  const frameMat = makeToonMat(gradientMap, 0x2c333b);
  const glassMat = makeToonMat(gradientMap, 0x3b6587, { emissive: 0xffd175, emissiveIntensity: 0.16 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), streetMat, [0, baseY + 0.04, 0]);
  // Split red-brick garden boundary wall + entry piers + timber gate slats + tree
  addPart(root, new THREE.BoxGeometry(0.96, 0.18, 0.07), redBrickMat, [0.42, baseY + 0.17, 0.76]);
  addPart(root, new THREE.BoxGeometry(0.46, 0.18, 0.07), redBrickMat, [-0.66, baseY + 0.17, 0.76]);
  [-0.24, -0.18, -0.12].forEach((gx) => {
    addPart(root, new THREE.BoxGeometry(0.025, 0.18, 0.025), timberStairMat, [gx, baseY + 0.17, 0.76]);
  });
  addScaleTree(root, -0.84, baseY + 0.08, 0.52, 0.82, foliageMat, timberStairMat);

  // 1F: Red-Brick Wing + Transparent Corner Entry Glass Box with 6 Stepped Timber Stair Treads
  addPart(root, new THREE.BoxGeometry(0.95, 0.62, 1.24), redBrickMat, [0.34, baseY + 0.39, -0.18]);
  addPart(root, new THREE.BoxGeometry(0.86, 0.62, 0.92), glassMat, [-0.26, baseY + 0.39, 0.05]);
  [-0.68, -0.05, 0.56].forEach((cx) => {
    addPart(root, new THREE.BoxGeometry(0.055, 0.62, 0.055), whiteStuccoMat, [cx, baseY + 0.39, 0.52]);
  });
  for (let s = 0; s < 6; s += 1) {
    addPart(root, new THREE.BoxGeometry(0.32, 0.04, 0.11), timberStairMat, [-0.2, baseY + 0.16 + s * 0.09, 0.24 - s * 0.095]);
  }

  // White Steel Channel Cantilever Collar Belt
  const y2 = baseY + 0.7;
  addPart(root, new THREE.BoxGeometry(1.66, 0.12, 1.48), whiteStuccoMat, [0, y2 + 0.06, 0.02]);

  // 2F Cantilevered White Gable Volume + Warm Timber Soffit Lining & Dark Zinc Ridge Trim
  const yWall = y2 + 0.12;
  const gableBody = new THREE.Shape();
  gableBody.moveTo(-0.78, 0);
  gableBody.lineTo(0.78, 0);
  gableBody.lineTo(0.78, 0.54);
  gableBody.lineTo(0, 0.92);
  gableBody.lineTo(-0.78, 0.54);
  gableBody.closePath();
  addExtrudedShape(root, gableBody, 0.92, whiteStuccoMat, [0, yWall, -0.68]);

  // Recessed front gable balcony framing + warm cedar ceiling soffit + crisp dark eave trim
  addPart(root, new THREE.BoxGeometry(0.14, 0.56, 0.48), whiteStuccoMat, [-0.71, yWall + 0.28, 0.48]);
  addPart(root, new THREE.BoxGeometry(0.14, 0.56, 0.48), whiteStuccoMat, [0.71, yWall + 0.28, 0.48]);
  addPart(root, new THREE.BoxGeometry(0.88, 0.1, 0.48), whiteStuccoMat, [-0.39, yWall + 0.73, 0.48], [0, 0, 0.45]);
  addPart(root, new THREE.BoxGeometry(0.88, 0.1, 0.48), whiteStuccoMat, [0.39, yWall + 0.73, 0.48], [0, 0, -0.45]);
  addPart(root, new THREE.BoxGeometry(0.8, 0.03, 0.45), timberStairMat, [-0.37, yWall + 0.675, 0.48], [0, 0, 0.45]);
  addPart(root, new THREE.BoxGeometry(0.8, 0.03, 0.45), timberStairMat, [0.37, yWall + 0.675, 0.48], [0, 0, -0.45]);
  addPart(root, new THREE.BoxGeometry(0.88, 0.035, 1.44), frameMat, [-0.39, yWall + 0.75, 0.03], [0, 0, 0.45]);
  addPart(root, new THREE.BoxGeometry(0.88, 0.035, 1.44), frameMat, [0.39, yWall + 0.75, 0.03], [0, 0, -0.45]);

  addPart(root, new THREE.BoxGeometry(1.24, 0.58, 0.04), glassMat, [0, yWall + 0.34, 0.26]);
  for (let m = -2; m <= 2; m += 1) {
    addPart(root, new THREE.BoxGeometry(0.025, 0.62, 0.06), frameMat, [m * 0.28, yWall + 0.35, 0.27]);
  }
  addPart(root, new THREE.BoxGeometry(1.26, 0.18, 0.03), glassMat, [0, yWall + 0.1, 0.69]);
  addPart(root, new THREE.BoxGeometry(1.28, 0.025, 0.04), frameMat, [0, yWall + 0.19, 0.69]);

  [-0.4, -0.16, 0.08, 0.32].forEach((wz) => {
    createWindowPanel(root, 0.11, 0.34, 0.03, frameMat, glassMat, [0.79, yWall + 0.32, wz], 1, Math.PI / 2);
  });
}

/**
 * Project 08: LAYERED (포항 효자동 — 1F 필로티 주차장 상가주택 + 베이지 벽돌 2F + 2중 레이어 박공 지붕)
 */
function buildLayered(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const asphaltMat = makeToonMat(gradientMap, 0x565a60);
  const paintLineMat = makeToonMat(gradientMap, 0xf2eee4);
  const concreteMat = makeToonMat(gradientMap, 0xbec0c2);
  const cedarMat = makeToonMat(gradientMap, 0xb88656);
  const sandBrickMat = makeToonMat(gradientMap, 0xd8cec0);
  const darkZincMat = makeToonMat(gradientMap, 0x2f353b);
  const glassMat = makeToonMat(gradientMap, 0x3b6587, { emissive: 0xffd070, emissiveIntensity: 0.18 });
  glowMaterials.push(glassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), asphaltMat, [0, baseY + 0.04, 0]);
  [-0.2, 0.22, 0.64].forEach((lx) => {
    addPart(root, new THREE.BoxGeometry(0.03, 0.015, 0.64), paintLineMat, [lx, baseY + 0.085, 0.56]);
  });
  // Wheel-stops in the 2 right-hand pilotis bays
  [0.01, 0.43].forEach((wx) => {
    addPart(root, new THREE.BoxGeometry(0.24, 0.035, 0.04), paintLineMat, [wx, baseY + 0.095, -0.12]);
  });

  // 1F: Café Storefront + Timber Bench + Fascia Canopy + Open Concrete Pilotis
  addPart(root, new THREE.BoxGeometry(1.1, 0.56, 0.9), glassMat, [-0.28, baseY + 0.36, -0.22]);
  addPart(root, new THREE.BoxGeometry(1.14, 0.05, 0.2), darkZincMat, [-0.28, baseY + 0.6, 0.31]);
  addPart(root, new THREE.BoxGeometry(0.32, 0.06, 0.12), cedarMat, [-0.64, baseY + 0.12, 0.4]);
  for (let m = -2; m <= 1; m += 1) {
    addPart(root, new THREE.BoxGeometry(0.028, 0.56, 0.04), darkZincMat, [-0.28 + m * 0.28, baseY + 0.36, 0.24]);
  }
  addPart(root, new THREE.BoxGeometry(0.14, 0.58, 0.14), concreteMat, [0.76, baseY + 0.37, 0.54]);
  addPart(root, new THREE.BoxGeometry(0.14, 0.58, 0.14), concreteMat, [0.16, baseY + 0.37, 0.54]);
  addPart(root, new THREE.BoxGeometry(0.14, 0.58, 0.14), concreteMat, [0.76, baseY + 0.37, -0.58]);

  // 2F Cantilevered Warm Sand-Brick Facade with Asymmetric Slanted Parapet + Recessed Balcony Niche
  const y2 = baseY + 0.66;
  const frontMass = new THREE.Shape();
  frontMass.moveTo(-0.84, 0);
  frontMass.lineTo(0.84, 0);
  frontMass.lineTo(0.84, 0.38);
  frontMass.lineTo(0.16, 0.72);
  frontMass.lineTo(-0.84, 0.52);
  frontMass.closePath();
  addExtrudedShape(root, frontMass, 0.92, sandBrickMat, [0, y2, -0.22]);

  createWindowPanel(root, 0.44, 0.24, 0.04, darkZincMat, glassMat, [0.24, y2 + 0.36, 0.71], 2);
  createWindowPanel(root, 0.18, 0.22, 0.04, darkZincMat, glassMat, [-0.46, y2 + 0.34, 0.71], 1);
  // 2F Recessed side-front balcony guardrail
  addPart(root, new THREE.BoxGeometry(0.28, 0.12, 0.03), glassMat, [-0.46, y2 + 0.18, 0.72]);
  addPart(root, new THREE.BoxGeometry(0.3, 0.025, 0.04), darkZincMat, [-0.46, y2 + 0.24, 0.72]);

  // Layered Rear Second Gable Roof
  const rearGable = new THREE.Shape();
  rearGable.moveTo(-0.56, 0);
  rearGable.lineTo(0.78, 0);
  rearGable.lineTo(0.78, 0.46);
  rearGable.lineTo(0.1, 0.84);
  rearGable.lineTo(-0.56, 0.52);
  rearGable.closePath();
  addExtrudedShape(root, rearGable, 0.52, sandBrickMat, [0, y2 + 0.12, -0.74]);

  // Dark-zinc roof fascia outlines + Standing-seam zinc ribs across front and rear gables
  addPart(root, new THREE.BoxGeometry(1.06, 0.05, 0.98), darkZincMat, [-0.34, y2 + 0.63, 0.24], [0, 0, 0.2]);
  addPart(root, new THREE.BoxGeometry(0.78, 0.05, 0.98), darkZincMat, [0.51, y2 + 0.56, 0.24], [0, 0, -0.45]);
  addPart(root, new THREE.BoxGeometry(0.76, 0.05, 0.6), darkZincMat, [-0.22, y2 + 0.82, -0.48], [0, 0, 0.44]);
  addPart(root, new THREE.BoxGeometry(0.78, 0.05, 0.6), darkZincMat, [0.46, y2 + 0.78, -0.48], [0, 0, -0.49]);

  [-0.16, 0.08, 0.34, 0.58].forEach((sz) => {
    addPart(root, new THREE.BoxGeometry(1.04, 0.026, 0.022), darkZincMat, [-0.34, y2 + 0.665, sz], [0, 0, 0.2]);
    addPart(root, new THREE.BoxGeometry(0.76, 0.026, 0.022), darkZincMat, [0.51, y2 + 0.595, sz], [0, 0, -0.45]);
  });
  [-0.68, -0.48, -0.28].forEach((sz) => {
    addPart(root, new THREE.BoxGeometry(0.74, 0.026, 0.022), darkZincMat, [-0.22, y2 + 0.855, sz], [0, 0, 0.44]);
    addPart(root, new THREE.BoxGeometry(0.76, 0.026, 0.022), darkZincMat, [0.46, y2 + 0.815, sz], [0, 0, -0.49]);
  });
}

/**
 * Project 09: Double Triangle (포항 대잠동 — 급경사 단일 박공 회색 벽돌 매스 + 2F 캔틸레버 블루 커튼월 삼각 매스)
 */
function buildDoubleTriangle(
  root: THREE.Group,
  baseY: number,
  gradientMap: THREE.DataTexture,
  glowMaterials: THREE.MeshToonMaterial[]
): void {
  const plazaMat = makeToonMat(gradientMap, 0xd8d3c9);
  const foliageMat = makeToonMat(gradientMap, 0x5c7d48);
  const trunkMat = makeToonMat(gradientMap, 0x745034);
  const greyBrickMat = makeToonMat(gradientMap, 0xa8a59e);
  const darkRoofMat = makeToonMat(gradientMap, 0x41464d);
  const whiteCapMat = makeToonMat(gradientMap, 0xf6f3ec);
  const frameMat = makeToonMat(gradientMap, 0x2a313a);
  const blueGlassMat = makeToonMat(gradientMap, 0x3b86c9, { emissive: 0x2665a3, emissiveIntensity: 0.24 });
  glowMaterials.push(blueGlassMat);

  addPart(root, new THREE.BoxGeometry(2.26, 0.08, 2.08), plazaMat, [0, baseY + 0.04, 0]);
  addPart(root, new THREE.BoxGeometry(0.78, 0.04, 0.58), greyBrickMat, [0.52, baseY + 0.1, 0.56]);
  addScaleTree(root, 0.78, baseY + 0.12, 0.72, 0.86, foliageMat, trunkMat);

  // 1. Rear-Right Grey Brick Wedge Building with Steep Mono-Pitch Roof & Standing-Seam Ribs
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(-0.56, 0);
  wedgeShape.lineTo(0.84, 0);
  wedgeShape.lineTo(0.84, 0.96);
  wedgeShape.lineTo(-0.18, 1.72);
  wedgeShape.lineTo(-0.56, 1.48);
  wedgeShape.closePath();
  addExtrudedShape(root, wedgeShape, 1.12, greyBrickMat, [0, baseY + 0.08, -0.78]);

  addPart(root, new THREE.BoxGeometry(1.36, 0.06, 1.24), darkRoofMat, [0.35, baseY + 1.36, -0.22], [0, 0, -0.64]);
  [-0.68, -0.44, -0.2, 0.04, 0.28].forEach((rz) => {
    addPart(root, new THREE.BoxGeometry(1.36, 0.03, 0.025), frameMat, [0.35, baseY + 1.4, rz], [0, 0, -0.64]);
  });

  createWindowPanel(root, 0.62, 0.42, 0.04, frameMat, blueGlassMat, [-0.14, baseY + 1.2, 0.34], 3);
  createWindowPanel(root, 0.44, 0.12, 0.03, frameMat, blueGlassMat, [0.85, baseY + 0.72, -0.28], 1, Math.PI / 2);
  createWindowPanel(root, 0.44, 0.12, 0.03, frameMat, blueGlassMat, [0.85, baseY + 0.34, -0.28], 1, Math.PI / 2);

  // 2. Front-Left Cantilevered Blue Glass Triangular Volume + Metallic Soffit + Grid Curtain-Wall Mullions
  addPart(root, new THREE.BoxGeometry(0.14, 0.62, 0.14), greyBrickMat, [-0.72, baseY + 0.39, 0.64]);
  addPart(root, new THREE.BoxGeometry(0.68, 0.58, 0.58), blueGlassMat, [-0.2, baseY + 0.37, 0.34]);

  const triPlan = new THREE.Shape();
  triPlan.moveTo(-0.78, -0.68);
  triPlan.lineTo(0.26, -0.58);
  triPlan.lineTo(-0.16, 0.35);
  triPlan.closePath();
  // Metallic lower soffit plate, main prism, and rooftop cap
  addExtrudedShape(root, triPlan, 0.04, whiteCapMat, [0, baseY + 0.66, 0], [-Math.PI / 2, 0, 0]);
  addExtrudedShape(root, triPlan, 0.56, blueGlassMat, [0, baseY + 0.7, 0], [-Math.PI / 2, 0, 0]);
  addExtrudedShape(root, triPlan, 0.06, whiteCapMat, [0, baseY + 1.26, 0], [-Math.PI / 2, 0, 0]);

  // Crisp front mullions aligned cleanly along sloped face (-0.78, +0.685) -> (+0.26, +0.585) & side diagonal
  [
    [-0.76, 0.684],
    [-0.51, 0.66],
    [-0.26, 0.635],
    [0.0, 0.61],
    [0.24, 0.586],
    [0.05, 0.11],
  ].forEach(([mx, mz]) => {
    addPart(root, new THREE.BoxGeometry(0.028, 0.58, 0.028), frameMat, [mx, baseY + 0.99, mz]);
  });
  addPart(root, new THREE.BoxGeometry(1.06, 0.028, 0.034), frameMat, [-0.26, baseY + 0.98, 0.635], [0, 0.096, 0]);
}

/**
 * Builds true-to-photo miniature museum models for all 9 featured built works of E:DEN Architects.
 */
export function buildPortfolioScaleModel(
  idx: number,
  gradientMap: THREE.DataTexture
): PortfolioCubbyModel {
  const group = new THREE.Group();
  const glowMaterials: THREE.MeshToonMaterial[] = [];

  // Two-tier architectural presentation plinth (walnut frame + highlightable site board + tiny brass spec tag)
  const walnutBaseMat = makeToonMat(gradientMap, 0x6e492a);
  const padMat = makeToonMat(gradientMap, 0xe6d6bc);
  const brassTagMat = makeToonMat(gradientMap, 0xe4b855);

  addPart(group, new THREE.BoxGeometry(2.64, 0.14, 2.38), walnutBaseMat, [0, 0.07, 0]);
  addPart(group, new THREE.BoxGeometry(2.44, 0.1, 2.2), padMat, [0, 0.19, 0]);
  const tag = addPart(group, new THREE.BoxGeometry(0.46, 0.055, 0.045), brassTagMat, [0, 0.125, 1.19]);
  tag.castShadow = false;

  const baseY = 0.24;

  switch (idx) {
    case 0:
      buildBreathTaking(group, baseY, gradientMap, glowMaterials);
      break;
    case 1:
      buildPoeties(group, baseY, gradientMap, glowMaterials);
      break;
    case 2:
      buildCloudWalk(group, baseY, gradientMap, glowMaterials);
      break;
    case 3:
      buildSohaengsung(group, baseY, gradientMap, glowMaterials);
      break;
    case 4:
      buildTanTanBi(group, baseY, gradientMap, glowMaterials);
      break;
    case 5:
      buildOneMoreDay(group, baseY, gradientMap, glowMaterials);
      break;
    case 6:
      buildIsundang(group, baseY, gradientMap, glowMaterials);
      break;
    case 7:
      buildLayered(group, baseY, gradientMap, glowMaterials);
      break;
    default:
      buildDoubleTriangle(group, baseY, gradientMap, glowMaterials);
      break;
  }

  return { group, padMat, glowMaterials };
}

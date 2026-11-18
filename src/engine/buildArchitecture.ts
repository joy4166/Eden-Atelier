import * as THREE from 'three';
import {
  createKoreanSignTexture,
  createModelPlaqueTexture,
  makeToonMat,
  tagStopHierarchy,
} from '@/engine/toonMaterials';

export interface AnimatedBuildingRig {
  root: THREE.Group;
  foundation: THREE.Group;
  structure: THREE.Group;
  roof: THREE.Group;
  props: THREE.Group;
  glowMaterials: THREE.MeshToonMaterial[];
}

export function addPart(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number]
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function createColumn(
  height: number,
  radius: number,
  mat: THREE.Material,
  trimMat: THREE.Material
): THREE.Group {
  const col = new THREE.Group();
  const baseH = 0.08;
  const capH = 0.08;
  const shaftH = Math.max(0.2, height - baseH - capH);

  addPart(col, new THREE.BoxGeometry(radius * 2.5, baseH, radius * 2.5), trimMat, [0, baseH / 2, 0]);
  addPart(col, new THREE.CylinderGeometry(radius * 0.88, radius, shaftH, 16), mat, [0, baseH + shaftH / 2, 0]);
  addPart(col, new THREE.CylinderGeometry(radius * 1.25, radius * 0.88, capH * 0.65, 16), trimMat, [0, baseH + shaftH + capH * 0.32, 0]);
  addPart(col, new THREE.BoxGeometry(radius * 2.45, capH * 0.35, radius * 2.45), trimMat, [0, height - capH * 0.18, 0]);
  return col;
}

function createSteps(
  parent: THREE.Object3D,
  stepCount: number,
  width: number,
  totalH: number,
  totalD: number,
  stepMat: THREE.Material,
  cheekMat: THREE.Material,
  origin: [number, number, number]
): void {
  const group = new THREE.Group();
  group.position.set(...origin);
  const h = totalH / stepCount;
  const d = totalD / stepCount;

  for (let i = 0; i < stepCount; i += 1) {
    const sh = h * (stepCount - i);
    addPart(group, new THREE.BoxGeometry(width, sh, d), stepMat, [0, sh / 2, (i + 0.5) * d]);
  }
  addPart(group, new THREE.BoxGeometry(0.13, totalH * 0.72, totalD), cheekMat, [-width / 2 - 0.065, totalH * 0.36, totalD / 2]);
  addPart(group, new THREE.BoxGeometry(0.13, totalH * 0.72, totalD), cheekMat, [width / 2 + 0.065, totalH * 0.36, totalD / 2]);
  parent.add(group);
}

function createWindowBay(
  w: number,
  h: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material
): THREE.Group {
  const win = new THREE.Group();
  addPart(win, new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.07), frameMat, [0, 0, 0]);
  addPart(win, new THREE.BoxGeometry(w, h, 0.08), glassMat, [0, 0, 0]);
  addPart(win, new THREE.BoxGeometry(0.035, h, 0.13), frameMat, [0, 0, 0.025]);
  addPart(win, new THREE.BoxGeometry(w, 0.035, 0.13), frameMat, [0, 0.09, 0.025]);
  addPart(win, new THREE.BoxGeometry(w + 0.15, 0.055, 0.15), frameMat, [0, -h / 2 - 0.03, 0.035]);
  return win;
}

export function createWoodenSign(
  title: string,
  badge: string,
  accentHex: string,
  postMat: THREE.Material,
  boardW = 2.02
): THREE.Group {
  const group = new THREE.Group();
  const boardH = 0.6;

  addPart(group, new THREE.CylinderGeometry(0.042, 0.05, 1.35, 10), postMat, [-boardW * 0.35, 0.675, 0]);
  addPart(group, new THREE.CylinderGeometry(0.042, 0.05, 1.35, 10), postMat, [boardW * 0.35, 0.675, 0]);
  addPart(group, new THREE.BoxGeometry(boardW + 0.09, boardH + 0.09, 0.08), postMat, [0, 1.14, 0]);
  addPart(group, new THREE.BoxGeometry(boardW + 0.16, 0.05, 0.13), postMat, [0, 1.14 + boardH / 2 + 0.048, 0]);

  const tex = createKoreanSignTexture(title, badge, accentHex);
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), faceMat);
  face.position.set(0, 1.14, 0.045);
  group.add(face);

  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), postMat);
  backFace.position.set(0, 1.14, -0.045);
  backFace.rotation.y = Math.PI;
  group.add(backFace);

  return group;
}

export function createRoofSign(
  title: string,
  badge: string,
  accentHex: string,
  frameMat: THREE.Material,
  boardW = 2.2,
  strutHeight = 0.28,
  boardH = 0.56
): THREE.Group {
  const group = new THREE.Group();
  const centerY = strutHeight + boardH * 0.5 - 0.04;
  const strutThick = Math.max(0.08, boardW * 0.036);

  // Compact vertical structural mounting brackets anchored onto roof/cornice deck (y = 0)
  addPart(group, new THREE.BoxGeometry(strutThick, strutHeight + 0.06, strutThick), frameMat, [-boardW * 0.34, strutHeight * 0.5, 0]);
  addPart(group, new THREE.BoxGeometry(strutThick, strutHeight + 0.06, strutThick), frameMat, [boardW * 0.34, strutHeight * 0.5, 0]);
  addPart(group, new THREE.BoxGeometry(boardW + 0.14, boardH + 0.14, 0.12), frameMat, [0, centerY, 0]);
  addPart(group, new THREE.BoxGeometry(boardW + 0.24, 0.06, 0.16), frameMat, [0, centerY + boardH / 2 + 0.06, 0]);

  const tex = createKoreanSignTexture(title, badge, accentHex);
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), faceMat);
  face.position.set(0, centerY, 0.065);
  group.add(face);

  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(boardW, boardH), frameMat);
  backFace.position.set(0, centerY, -0.065);
  backFace.rotation.y = Math.PI;
  group.add(backFace);

  return group;
}

/**
 * Low museum-style slanted architectural model nameplate anchored on forecourt (y = 0).
 */
export function createModelPlaque(
  title: string,
  badge: string,
  accentHex: string,
  pedestalMat: THREE.Material,
  brassMat: THREE.Material,
  width = 1.56,
  height = 0.46
): THREE.Group {
  const group = new THREE.Group();

  // Compact ground pedestal base + raised angled neck so nameplate stays visible cleanly
  addPart(group, new THREE.BoxGeometry(width * 0.72, 0.16, 0.3), pedestalMat, [0, 0.08, 0]);
  addPart(group, new THREE.BoxGeometry(width * 0.42, 0.22, 0.16), pedestalMat, [0, 0.26, -0.02]);

  const head = new THREE.Group();
  head.position.set(0, 0.42, 0.03);
  head.rotation.x = -0.44;

  addPart(head, new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.06), brassMat, [0, 0, 0]);
  addPart(head, new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.04), pedestalMat, [0, 0, -0.02]);

  const tex = createModelPlaqueTexture(title, badge, accentHex, true, width / height);
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMat);
  face.position.set(0, 0, 0.036);
  head.add(face);

  group.add(head);
  return group;
}

/**
 * Flush walnut-and-brass architectural plate mounted directly on rails or pediments (no stilts).
 */
export function createFlushPlaque(
  title: string,
  badge: string,
  accentHex: string,
  frameMat: THREE.Material,
  brassMat: THREE.Material,
  width: number,
  height: number,
  showSample = true
): THREE.Group {
  const group = new THREE.Group();

  addPart(group, new THREE.BoxGeometry(width + 0.12, height + 0.12, 0.1), frameMat, [0, 0, 0]);
  addPart(group, new THREE.BoxGeometry(width + 0.04, height + 0.04, 0.11), brassMat, [0, 0, 0]);

  const tex = createModelPlaqueTexture(title, badge, accentHex, showSample, width / height);
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), faceMat);
  face.position.set(0, 0, 0.06);
  group.add(face);

  return group;
}

function createGableRoof(
  w: number,
  d: number,
  ridgeH: number,
  overhang: number,
  roofMat: THREE.Material,
  trimMat: THREE.Material,
  wallMat: THREE.Material,
  ribs = 5
): THREE.Group {
  const roof = new THREE.Group();
  const tw = w + overhang * 2;
  const td = d + overhang * 2;
  const halfW = tw / 2;
  const slopeLen = Math.hypot(halfW, ridgeH);
  const angle = Math.atan2(ridgeH, halfW);

  addPart(roof, new THREE.BoxGeometry(slopeLen, 0.085, td), roofMat, [-halfW / 2, ridgeH / 2, 0], [0, 0, angle]);
  addPart(roof, new THREE.BoxGeometry(slopeLen, 0.085, td), roofMat, [halfW / 2, ridgeH / 2, 0], [0, 0, -angle]);

  for (let i = 0; i < ribs; i += 1) {
    const rz = -td * 0.42 + (td * 0.84 * i) / Math.max(ribs - 1, 1);
    addPart(roof, new THREE.BoxGeometry(slopeLen, 0.032, 0.04), trimMat, [-halfW / 2, ridgeH / 2 + 0.04, rz], [0, 0, angle]);
    addPart(roof, new THREE.BoxGeometry(slopeLen, 0.032, 0.04), trimMat, [halfW / 2, ridgeH / 2 + 0.04, rz], [0, 0, -angle]);
  }
  addPart(roof, new THREE.BoxGeometry(0.15, 0.11, td + 0.07), trimMat, [0, ridgeH + 0.03, 0]);

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(0, ridgeH - 0.08);
  shape.closePath();

  const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  gableGeo.translate(0, 0, -d / 2);
  const gable = new THREE.Mesh(gableGeo, wallMat);
  gable.castShadow = true;
  gable.receiveShadow = true;
  roof.add(gable);

  return roof;
}

/**
 * Building 01: 법규 · 인허가 검토소 at (-9.0, 0, 4.8)
 */
export function buildLawReviewHall(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(-9.0, 0, 4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const stoneBaseMat = makeToonMat(gradientMap, 0xddd2c0);
  const stoneTrimMat = makeToonMat(gradientMap, 0xc8bba7);
  const plasterWallMat = makeToonMat(gradientMap, 0xfaf3e8);
  const woodDoorMat = makeToonMat(gradientMap, 0x9b6e45);
  const sageRoofMat = makeToonMat(gradientMap, 0x5c9070);
  const roofTrimMat = makeToonMat(gradientMap, 0x3b4f43);
  const planterSoilMat = makeToonMat(gradientMap, 0x6f533c);
  const bushMat = makeToonMat(gradientMap, 0x769f62);
  const brassMat = makeToonMat(gradientMap, 0xd8ad4a);
  const glassMat = makeToonMat(gradientMap, 0x385e7c, { emissive: 0xffcf70, emissiveIntensity: 0 });

  addPart(foundation, new THREE.BoxGeometry(4.2, 0.18, 3.9), stoneTrimMat, [0, 0.09, 0.1]);
  addPart(foundation, new THREE.BoxGeometry(3.85, 0.24, 3.5), stoneBaseMat, [0, 0.3, 0.02]);
  createSteps(foundation, 4, 1.85, 0.42, 0.86, stoneBaseMat, stoneTrimMat, [0, 0, 1.78]);

  [-1.35, 1.35].forEach((px) => {
    addPart(foundation, new THREE.BoxGeometry(0.62, 0.24, 0.42), stoneTrimMat, [px, 0.54, 1.5]);
    addPart(foundation, new THREE.BoxGeometry(0.5, 0.06, 0.3), planterSoilMat, [px, 0.65, 1.5]);
    addPart(foundation, new THREE.IcosahedronGeometry(0.19, 1), bushMat, [px, 0.77, 1.5]);
  });

  const podiumY = 0.42;
  addPart(structure, new THREE.BoxGeometry(3.25, 1.75, 2.45), plasterWallMat, [0, podiumY + 0.875, -0.32]);
  addPart(structure, new THREE.BoxGeometry(3.42, 0.1, 2.6), stoneTrimMat, [0, podiumY + 1.75, -0.32]);

  [[-1.6, -1.52], [1.6, -1.52], [-1.6, 0.88], [1.6, 0.88]].forEach(([px, pz]) => {
    addPart(structure, new THREE.BoxGeometry(0.2, 1.75, 0.2), stoneBaseMat, [px, podiumY + 0.875, pz]);
  });

  addPart(structure, new THREE.BoxGeometry(0.9, 1.24, 0.12), stoneTrimMat, [0, podiumY + 0.62, 0.9]);
  addPart(structure, new THREE.BoxGeometry(0.35, 1.08, 0.14), woodDoorMat, [-0.19, podiumY + 0.56, 0.91]);
  addPart(structure, new THREE.BoxGeometry(0.35, 1.08, 0.14), woodDoorMat, [0.19, podiumY + 0.56, 0.91]);
  addPart(structure, new THREE.BoxGeometry(0.74, 0.22, 0.14), glassMat, [0, podiumY + 1.34, 0.91]);

  [-0.92, 0.92].forEach((wx) => {
    const fWin = createWindowBay(0.48, 0.9, woodDoorMat, glassMat);
    fWin.position.set(wx, podiumY + 0.92, 0.92);
    structure.add(fWin);
  });
  [-0.86, 0.05].forEach((wz) => {
    const lWin = createWindowBay(0.54, 0.92, woodDoorMat, glassMat);
    lWin.rotation.y = -Math.PI / 2;
    lWin.position.set(-1.64, podiumY + 0.92, wz);
    structure.add(lWin);

    const rWin = createWindowBay(0.54, 0.92, woodDoorMat, glassMat);
    rWin.rotation.y = Math.PI / 2;
    rWin.position.set(1.64, podiumY + 0.92, wz);
    structure.add(rWin);
  });

  [-1.3, -0.5, 0.5, 1.3].forEach((cx) => {
    const col = createColumn(1.72, 0.09, plasterWallMat, stoneTrimMat);
    col.position.set(cx, podiumY, 1.42);
    structure.add(col);
  });
  addPart(structure, new THREE.BoxGeometry(3.15, 0.2, 0.82), stoneBaseMat, [0, podiumY + 1.81, 1.2]);

  const mainRoof = createGableRoof(3.35, 3.55, 0.95, 0.32, sageRoofMat, roofTrimMat, plasterWallMat);
  mainRoof.position.set(0, podiumY + 1.85, -0.14);
  roof.add(mainRoof);

  addPart(roof, new THREE.BoxGeometry(0.92, 0.33, 0.7), plasterWallMat, [0, podiumY + 2.62, 0.08]);
  addPart(roof, new THREE.BoxGeometry(0.68, 0.18, 0.73), glassMat, [0, podiumY + 2.62, 0.08]);
  const dormerCap = createGableRoof(0.92, 0.74, 0.27, 0.12, sageRoofMat, roofTrimMat, plasterWallMat, 3);
  dormerCap.position.set(0, podiumY + 2.78, 0.08);
  roof.add(dormerCap);

  const plaque = createModelPlaque('법규 · 인허가 검토소', 'PROMPT-01', '#2E5A44', woodDoorMat, brassMat, 1.56, 0.46);
  plaque.position.set(-1.78, 0, 1.88);
  plaque.rotation.y = -0.28;
  props.add(plaque);

  addPart(props, new THREE.BoxGeometry(0.92, 0.08, 0.32), woodDoorMat, [1.5, 0.25, 2.25]);
  addPart(props, new THREE.BoxGeometry(0.11, 0.21, 0.26), stoneTrimMat, [1.18, 0.11, 2.25]);
  addPart(props, new THREE.BoxGeometry(0.11, 0.21, 0.26), stoneTrimMat, [1.82, 0.11, 2.25]);

  tagStopHierarchy(root, 'law-office');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

/**
 * Building 02: 건축물대장 MCP 타워 at (0.0, 0, 4.8)
 */
export function buildMcpTower(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(0.0, 0, 4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const limestoneMat = makeToonMat(gradientMap, 0xede5d6);
  const slateTrimMat = makeToonMat(gradientMap, 0x43515f);
  const terracottaCedarMat = makeToonMat(gradientMap, 0xd6774f);
  const louverWoodMat = makeToonMat(gradientMap, 0xa46a42);
  const steelMat = makeToonMat(gradientMap, 0x4c5866);
  const brassMat = makeToonMat(gradientMap, 0xe4b855);
  const navyAccentMat = makeToonMat(gradientMap, 0x224c78);
  const foliageMat = makeToonMat(gradientMap, 0x6f9959);
  const glassMat = makeToonMat(gradientMap, 0x355c82, { emissive: 0xffcf70, emissiveIntensity: 0 });

  addPart(foundation, new THREE.BoxGeometry(4.3, 0.16, 3.95), slateTrimMat, [0, 0.08, 0.08]);
  addPart(foundation, new THREE.BoxGeometry(3.95, 0.22, 3.6), limestoneMat, [0, 0.27, 0.02]);
  createSteps(foundation, 3, 1.65, 0.38, 0.76, limestoneMat, slateTrimMat, [-0.5, 0, 1.82]);

  addPart(foundation, new THREE.BoxGeometry(1.1, 0.23, 0.4), limestoneMat, [1.15, 0.49, 1.52]);
  addPart(foundation, new THREE.IcosahedronGeometry(0.22, 1), foliageMat, [0.95, 0.7, 1.52]);
  addPart(foundation, new THREE.IcosahedronGeometry(0.18, 1), foliageMat, [1.35, 0.66, 1.5]);

  const podiumY = 0.38;
  addPart(structure, new THREE.BoxGeometry(2.75, 1.2, 2.25), limestoneMat, [0.18, podiumY + 0.6, -0.25]);
  addPart(structure, new THREE.BoxGeometry(2.45, 0.98, 0.14), glassMat, [0.12, podiumY + 0.56, 0.9]);
  for (let i = -3; i <= 3; i += 1) {
    addPart(structure, new THREE.BoxGeometry(0.05, 1.04, 0.18), slateTrimMat, [0.12 + i * 0.38, podiumY + 0.56, 0.9]);
  }
  addPart(structure, new THREE.BoxGeometry(0.14, 0.98, 1.75), glassMat, [-1.22, podiumY + 0.56, -0.1]);
  addPart(structure, new THREE.BoxGeometry(1.35, 0.09, 0.72), slateTrimMat, [-0.45, podiumY + 1.05, 1.28]);

  const upperY = podiumY + 1.22;
  addPart(structure, new THREE.BoxGeometry(3.25, 1.28, 2.55), terracottaCedarMat, [-0.14, upperY + 0.64, -0.05]);
  addPart(structure, new THREE.BoxGeometry(2.15, 0.72, 0.16), glassMat, [-0.52, upperY + 0.66, 1.2]);
  addPart(structure, new THREE.BoxGeometry(0.16, 0.72, 1.75), glassMat, [-1.7, upperY + 0.66, -0.05]);

  for (let i = 0; i < 8; i += 1) {
    addPart(structure, new THREE.BoxGeometry(0.055, 1.15, 0.17), louverWoodMat, [-1.45 + i * 0.24, upperY + 0.64, 1.29]);
  }

  for (let s = 0; s < 6; s += 1) {
    addPart(structure, new THREE.BoxGeometry(0.48, 0.06, 0.22), steelMat, [1.7, podiumY + 0.22 + s * 0.2, 0.8 - s * 0.26]);
  }
  addPart(structure, new THREE.BoxGeometry(0.06, 0.09, 1.75), steelMat, [1.92, podiumY + 0.7, 0.14], [0.58, 0, 0]);

  const roofY = upperY + 1.28;
  addPart(roof, new THREE.BoxGeometry(3.42, 0.12, 2.72), slateTrimMat, [-0.14, roofY + 0.06, -0.05]);
  addPart(roof, new THREE.BoxGeometry(3.05, 0.05, 2.35), louverWoodMat, [-0.14, roofY + 0.14, -0.05]);
  addPart(roof, new THREE.BoxGeometry(1.5, 0.4, 1.05), navyAccentMat, [-0.45, roofY + 0.35, -0.15]);
  addPart(roof, new THREE.BoxGeometry(1.56, 0.08, 1.12), slateTrimMat, [-0.45, roofY + 0.56, -0.15]);
  addPart(roof, new THREE.BoxGeometry(1.24, 0.2, 1.09), glassMat, [-0.45, roofY + 0.36, -0.15]);

  addPart(roof, new THREE.BoxGeometry(0.42, 0.26, 0.42), limestoneMat, [0.92, roofY + 0.26, -0.45]);
  addPart(roof, new THREE.CylinderGeometry(0.035, 0.05, 1.1, 10), steelMat, [0.92, roofY + 0.9, -0.45]);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.08, 0.1, 16), navyAccentMat);
  dish.position.set(0.92, roofY + 1.18, -0.45);
  dish.rotation.x = 0.55;
  dish.castShadow = true;
  roof.add(dish);
  addPart(roof, new THREE.SphereGeometry(0.08, 12, 12), brassMat, [0.92, roofY + 1.48, -0.45]);

  const plaque = createModelPlaque('건축물대장 MCP 타워', 'MCP-01', '#1B4674', slateTrimMat, brassMat, 1.58, 0.46);
  plaque.position.set(1.26, 0, 1.9);
  plaque.rotation.y = 0.28;
  props.add(plaque);

  tagStopHierarchy(root, 'mcp-tower');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

/**
 * Building 03: 매스 · 조망 스터디관 at (9.0, 0, 4.8)
 * 3-tier cascading ivory/cedar terraced architecture with golden brass sun-path arch
 */
export function buildMassStudyPavilion(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(9.0, 0, 4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const stoneMat = makeToonMat(gradientMap, 0xe0d6c6);
  const darkSlateMat = makeToonMat(gradientMap, 0x3b444f);
  const whiteMassMat = makeToonMat(gradientMap, 0xfaf6ee);
  const woodDeckMat = makeToonMat(gradientMap, 0xbe8958);
  const brassMat = makeToonMat(gradientMap, 0xefc058);
  const shrubMat = makeToonMat(gradientMap, 0x6f985b);
  const glassMat = makeToonMat(gradientMap, 0x3c6687, { emissive: 0xffcf70, emissiveIntensity: 0 });

  // Stepped Slope Base Terrace echoing terraced terrain study
  addPart(foundation, new THREE.BoxGeometry(4.2, 0.2, 3.9), darkSlateMat, [0, 0.1, 0.05]);
  addPart(foundation, new THREE.BoxGeometry(3.85, 0.24, 3.45), stoneMat, [0, 0.32, 0]);
  createSteps(foundation, 3, 1.55, 0.42, 0.78, stoneMat, darkSlateMat, [-0.85, 0, 1.74]);

  // Tier 1 Mass (wide south podium terrace)
  const baseY = 0.44;
  addPart(structure, new THREE.BoxGeometry(3.3, 0.92, 2.75), whiteMassMat, [0, baseY + 0.46, -0.1]);
  addPart(structure, new THREE.BoxGeometry(2.85, 0.62, 0.12), glassMat, [0, baseY + 0.45, 1.25]);
  // Wood terrace deck overlooking south
  addPart(structure, new THREE.BoxGeometry(3.15, 0.06, 0.95), woodDeckMat, [0, baseY + 0.95, 0.85]);

  // Tier 2 Mass (stepped back & shifted right)
  const tier2Y = baseY + 0.95;
  addPart(structure, new THREE.BoxGeometry(2.55, 0.9, 2.0), whiteMassMat, [0.22, tier2Y + 0.45, -0.35]);
  addPart(structure, new THREE.BoxGeometry(2.15, 0.6, 0.12), glassMat, [0.18, tier2Y + 0.46, 0.64]);
  // Slanted brise-soleil timber louvers shading tier 2 glazing
  for (let i = 0; i < 6; i += 1) {
    addPart(structure, new THREE.BoxGeometry(0.05, 0.66, 0.18), woodDeckMat, [-0.6 + i * 0.32, tier2Y + 0.46, 0.7], [0, 0.22, 0]);
  }
  // Pocket terrace garden on Tier 2 deck
  addPart(structure, new THREE.IcosahedronGeometry(0.22, 1), shrubMat, [-1.1, tier2Y + 0.22, 0.75]);
  addPart(structure, new THREE.IcosahedronGeometry(0.18, 1), shrubMat, [1.22, tier2Y + 0.2, 0.8]);

  // Tier 3 Cantilevered Panorama Pavilion & Brass Heliodon Sun-Path Arch
  const tier3Y = tier2Y + 0.9;
  addPart(roof, new THREE.BoxGeometry(1.75, 0.78, 1.45), whiteMassMat, [0.35, tier3Y + 0.39, -0.5]);
  addPart(roof, new THREE.BoxGeometry(1.45, 0.52, 0.12), glassMat, [0.35, tier3Y + 0.42, 0.2]);
  addPart(roof, new THREE.BoxGeometry(1.92, 0.09, 1.62), darkSlateMat, [0.35, tier3Y + 0.82, -0.5]);

  // Golden Sun-Path Arch crowning the rooftop mass study pavilion
  const sunArcGeo = new THREE.TorusGeometry(1.22, 0.045, 10, 28, Math.PI);
  const sunArc = new THREE.Mesh(sunArcGeo, brassMat);
  sunArc.position.set(0.15, tier3Y + 0.84, -0.25);
  sunArc.rotation.y = 0.25;
  sunArc.castShadow = true;
  roof.add(sunArc);
  addPart(roof, new THREE.SphereGeometry(0.12, 12, 12), brassMat, [-0.88, tier3Y + 1.56, -0.52]);

  const plaque = createModelPlaque('매스 · 조망 스터디관', 'PROMPT-02', '#9A5B25', darkSlateMat, brassMat, 1.58, 0.46);
  plaque.position.set(1.06, 0, 1.9);
  plaque.rotation.y = 0.32;
  props.add(plaque);

  tagStopHierarchy(root, 'mass-study');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

/**
 * Building 04: 설계공모 지침 분석실 at (9.0, 0, -4.8)
 * Warm terracotta brick studio topped by 3-bay North-Light Sawtooth Roofs
 */
export function buildCompAuditAtelier(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(9.0, 0, -4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const graniteMat = makeToonMat(gradientMap, 0xd8cfc2);
  const brickMat = makeToonMat(gradientMap, 0xb85b46);
  const mortarTrimMat = makeToonMat(gradientMap, 0xf0e8da);
  const charcoalMat = makeToonMat(gradientMap, 0x383f47);
  const timberMat = makeToonMat(gradientMap, 0x9b6b42);
  const sagePinMat = makeToonMat(gradientMap, 0x4b745d);
  const brassMat = makeToonMat(gradientMap, 0xd8ad4a);
  const glassMat = makeToonMat(gradientMap, 0x3b6385, { emissive: 0xffd072, emissiveIntensity: 0 });

  addPart(foundation, new THREE.BoxGeometry(4.25, 0.18, 3.85), charcoalMat, [0, 0.09, 0.05]);
  addPart(foundation, new THREE.BoxGeometry(3.9, 0.22, 3.45), graniteMat, [0, 0.29, 0]);
  createSteps(foundation, 3, 1.8, 0.4, 0.82, graniteMat, charcoalMat, [0, 0, 1.75]);

  const podiumY = 0.4;
  // Red-brick atelier hall
  addPart(structure, new THREE.BoxGeometry(3.45, 1.56, 2.65), brickMat, [0, podiumY + 0.78, -0.18]);
  addPart(structure, new THREE.BoxGeometry(3.56, 0.1, 2.75), mortarTrimMat, [0, podiumY + 1.56, -0.18]);

  // Entrance recessed timber gallery + miniature pin-up exhibition panels flanking door
  addPart(structure, new THREE.BoxGeometry(0.95, 1.15, 0.14), mortarTrimMat, [0, podiumY + 0.58, 1.14]);
  addPart(structure, new THREE.BoxGeometry(0.75, 0.98, 0.16), glassMat, [0, podiumY + 0.56, 1.15]);
  [-1.08, 1.08].forEach((px) => {
    const win = createWindowBay(0.62, 0.94, mortarTrimMat, glassMat);
    win.position.set(px, podiumY + 0.84, 1.16);
    structure.add(win);
  });

  // 3-Bay Sawtooth Clerestory Roof Monitors (distinctive competition studio silhouette)
  const sawY = podiumY + 1.61;
  const bayW = 1.08;
  [-1.12, 0, 1.12].forEach((bx) => {
    // Dark structural frame backing behind crisp front glazing + mullion + top cornice
    addPart(roof, new THREE.BoxGeometry(bayW, 0.68, 0.08), charcoalMat, [bx, sawY + 0.34, 0.9]);
    addPart(roof, new THREE.BoxGeometry(bayW - 0.12, 0.54, 0.09), glassMat, [bx, sawY + 0.33, 0.95]);
    addPart(roof, new THREE.BoxGeometry(0.045, 0.56, 0.11), mortarTrimMat, [bx, sawY + 0.33, 0.97]);
    addPart(roof, new THREE.BoxGeometry(bayW + 0.04, 0.07, 0.14), mortarTrimMat, [bx, sawY + 0.68, 0.95]);
    // Sloped metal roof deck back
    addPart(roof, new THREE.BoxGeometry(bayW, 0.1, 2.48), sagePinMat, [bx, sawY + 0.32, -0.18], [0.28, 0, 0]);
    // Cheek walls closing each sawtooth bay
    addPart(roof, new THREE.BoxGeometry(0.08, 0.42, 2.38), mortarTrimMat, [bx - bayW / 2 + 0.04, sawY + 0.22, -0.18]);
    addPart(roof, new THREE.BoxGeometry(0.08, 0.42, 2.38), mortarTrimMat, [bx + bayW / 2 - 0.04, sawY + 0.22, -0.18]);
  });

  // Timber easel exhibition pin-board prop beside forecourt
  const easel = new THREE.Group();
  easel.position.set(1.48, 0, 1.92);
  easel.rotation.y = -0.35;
  addPart(easel, new THREE.BoxGeometry(0.65, 0.5, 0.06), mortarTrimMat, [0, 0.62, 0], [-0.2, 0, 0]);
  addPart(easel, new THREE.BoxGeometry(0.5, 0.36, 0.08), sagePinMat, [0, 0.62, 0.01], [-0.2, 0, 0]);
  addPart(easel, new THREE.BoxGeometry(0.06, 0.72, 0.06), timberMat, [-0.22, 0.34, 0.04]);
  addPart(easel, new THREE.BoxGeometry(0.06, 0.72, 0.06), timberMat, [0.22, 0.34, 0.04]);
  props.add(easel);

  const plaque = createModelPlaque('설계공모 지침 분석실', 'PROMPT-03', '#A34836', charcoalMat, brassMat, 1.56, 0.46);
  plaque.position.set(-1.78, 0, 1.88);
  plaque.rotation.y = -0.26;
  props.add(plaque);

  tagStopHierarchy(root, 'comp-audit');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

/**
 * Building 05: 도면 · 시방 검수원 at (0.0, 0, -4.8)
 * Symmetrical Twin-Gable Timber Archive linked by a 2-story Illuminated Glass Atrium Bridge
 */
export function buildDrawingQaArchive(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(0.0, 0, -4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const basaltMat = makeToonMat(gradientMap, 0x454b54);
  const oakStoneMat = makeToonMat(gradientMap, 0xe5dccb);
  const cedarWingMat = makeToonMat(gradientMap, 0xd9be95);
  const darkSlateRoofMat = makeToonMat(gradientMap, 0x3b4d5e);
  const trimWoodMat = makeToonMat(gradientMap, 0x7d5634);
  const brassMat = makeToonMat(gradientMap, 0xefc058);
  const glassMat = makeToonMat(gradientMap, 0x3c6486, { emissive: 0xffcf70, emissiveIntensity: 0 });

  addPart(foundation, new THREE.BoxGeometry(4.35, 0.18, 3.85), basaltMat, [0, 0.09, 0.05]);
  addPart(foundation, new THREE.BoxGeometry(4.0, 0.2, 3.45), oakStoneMat, [0, 0.28, 0]);
  createSteps(foundation, 3, 1.75, 0.38, 0.78, oakStoneMat, basaltMat, [0, 0, 1.74]);

  const podiumY = 0.38;
  // Twin symmetrical wing blocks (-1.08 & +1.08) + luminous central glass bridge core
  [-1.08, 1.08].forEach((wx) => {
    addPart(structure, new THREE.BoxGeometry(1.42, 1.62, 2.55), cedarWingMat, [wx, podiumY + 0.81, -0.14]);
    addPart(structure, new THREE.BoxGeometry(1.5, 0.09, 2.64), oakStoneMat, [wx, podiumY + 1.62, -0.14]);
    const wBay = createWindowBay(0.68, 0.96, trimWoodMat, glassMat);
    wBay.position.set(wx, podiumY + 0.85, 1.15);
    structure.add(wBay);
  });

  // Central luminous glass bridge connecting both archive wings
  addPart(structure, new THREE.BoxGeometry(1.05, 1.44, 1.95), glassMat, [0, podiumY + 0.74, -0.1]);
  addPart(structure, new THREE.BoxGeometry(1.12, 0.1, 2.04), basaltMat, [0, podiumY + 1.48, -0.1]);
  addPart(structure, new THREE.BoxGeometry(0.06, 1.44, 1.98), basaltMat, [0, podiumY + 0.74, 0.86]);

  // Twin pitched slate gable roofs + Brass precision spire
  [-1.08, 1.08].forEach((wx) => {
    const wingRoof = createGableRoof(1.46, 2.65, 0.78, 0.18, darkSlateRoofMat, basaltMat, cedarWingMat, 4);
    wingRoof.position.set(wx, podiumY + 1.66, -0.14);
    roof.add(wingRoof);
  });
  addPart(roof, new THREE.CylinderGeometry(0.03, 0.045, 0.85, 10), brassMat, [0, podiumY + 1.92, -0.1]);
  addPart(roof, new THREE.OctahedronGeometry(0.12, 0), brassMat, [0, podiumY + 2.38, -0.1]);

  const plaque = createModelPlaque('도면 · 시방 검수원', 'MCP-02', '#26466D', basaltMat, brassMat, 1.56, 0.46);
  plaque.position.set(-1.74, 0, 1.86);
  plaque.rotation.y = 0.18;
  props.add(plaque);

  tagStopHierarchy(root, 'drawing-qa');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

/**
 * Building 06: 공사감리 체크 포스트 at (-9.0, 0, -4.8)
 * Exposed Architectural Concrete + Dark-Steel Seismic X-Bracing + Glazed Observation Cabin
 */
export function buildSupervisionPost(gradientMap: THREE.DataTexture): AnimatedBuildingRig {
  const root = new THREE.Group();
  root.position.set(-9.0, 0, -4.8);

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const darkConcreteMat = makeToonMat(gradientMap, 0x4b4e54);
  const concreteMat = makeToonMat(gradientMap, 0xd8d2c7);
  const steelMat = makeToonMat(gradientMap, 0x343a40);
  const safetyAmberMat = makeToonMat(gradientMap, 0xe09f3e);
  const brassMat = makeToonMat(gradientMap, 0xd8ad4a);
  const glassMat = makeToonMat(gradientMap, 0x3b6587, { emissive: 0xffd175, emissiveIntensity: 0 });

  addPart(foundation, new THREE.BoxGeometry(4.05, 0.18, 3.85), darkConcreteMat, [0, 0.09, 0.05]);
  addPart(foundation, new THREE.BoxGeometry(3.7, 0.2, 3.45), concreteMat, [0, 0.28, 0]);
  createSteps(foundation, 3, 1.5, 0.38, 0.78, concreteMat, darkConcreteMat, [-0.35, 0, 1.74]);

  const podiumY = 0.38;
  // Open Pilotis Frame & Exposed Concrete Rear Core with Visible Dark-Steel Seismic X-Bracing
  addPart(structure, new THREE.BoxGeometry(2.35, 1.5, 1.85), concreteMat, [-0.15, podiumY + 0.75, -0.35]);

  // 4 Steel H-Column Legs supporting Upper Control Room
  [[-1.35, 0.85], [1.05, 0.85], [-1.35, -1.25], [1.05, -1.25]].forEach(([cx, cz]) => {
    addPart(structure, new THREE.BoxGeometry(0.14, 1.65, 0.14), steelMat, [cx, podiumY + 0.825, cz]);
  });

  // Crisp Structural Diagonal Steel X-Bracing on Front & Side Bays
  addPart(structure, new THREE.BoxGeometry(0.07, 2.38, 0.07), steelMat, [-0.15, podiumY + 0.82, 0.86], [0, 0, 0.88]);
  addPart(structure, new THREE.BoxGeometry(0.07, 2.38, 0.07), steelMat, [-0.15, podiumY + 0.82, 0.86], [0, 0, -0.88]);
  addPart(structure, new THREE.BoxGeometry(0.07, 2.15, 0.07), steelMat, [1.06, podiumY + 0.82, -0.2], [0.85, 0, 0]);
  addPart(structure, new THREE.BoxGeometry(0.07, 2.15, 0.07), steelMat, [1.06, podiumY + 0.82, -0.2], [-0.85, 0, 0]);

  // Exterior Steel Stair leading up right side to observation tower
  for (let i = 0; i < 6; i += 1) {
    addPart(structure, new THREE.BoxGeometry(0.42, 0.05, 0.2), steelMat, [1.36, podiumY + 0.24 + i * 0.25, 0.9 - i * 0.28]);
  }

  // Upper 360° Cantilevered Observation Cabin with Safety-Amber Fascia Trim
  const deckY = podiumY + 1.64;
  addPart(roof, new THREE.BoxGeometry(3.2, 0.16, 2.65), steelMat, [-0.1, deckY + 0.08, -0.15]);
  addPart(roof, new THREE.BoxGeometry(2.8, 0.88, 2.25), glassMat, [-0.1, deckY + 0.58, -0.15]);
  // Corner window mullions
  [[-1.48, 0.94], [1.28, 0.94], [-1.48, -1.24], [1.28, -1.24]].forEach(([mx, mz]) => {
    addPart(roof, new THREE.BoxGeometry(0.14, 0.9, 0.14), darkConcreteMat, [mx, deckY + 0.58, mz]);
  });
  addPart(roof, new THREE.BoxGeometry(3.32, 0.18, 2.75), safetyAmberMat, [-0.1, deckY + 1.08, -0.15]);

  // Miniature rooftop crane calibration boom & amber beacon
  addPart(roof, new THREE.CylinderGeometry(0.05, 0.07, 0.72, 10), steelMat, [0.85, deckY + 1.5, -0.6]);
  addPart(roof, new THREE.BoxGeometry(1.1, 0.08, 0.08), safetyAmberMat, [0.45, deckY + 1.8, -0.6], [0, 0, 0.14]);
  addPart(roof, new THREE.SphereGeometry(0.095, 10, 10), safetyAmberMat, [-0.08, deckY + 1.72, -0.6]);

  const plaque = createModelPlaque('공사감리 체크 포스트', 'PROMPT-04', '#C47D1D', steelMat, brassMat, 1.56, 0.46);
  plaque.position.set(1.26, 0, 1.88);
  plaque.rotation.y = 0.3;
  props.add(plaque);

  tagStopHierarchy(root, 'supervision-post');
  return { root, foundation, structure, roof, props, glowMaterials: [glassMat] };
}

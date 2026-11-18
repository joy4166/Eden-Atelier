import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * 3-step illustrated toon gradient map matching crisp architectural illustration shading.
 */
export function createToonGradientMap(): THREE.DataTexture {
  const data = new Uint8Array([168, 216, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export function makeToonMat(
  gradientMap: THREE.DataTexture,
  color: number,
  options?: { emissive?: number; emissiveIntensity?: number }
): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap,
    emissive: options?.emissive !== undefined ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: options?.emissiveIntensity ?? 0,
  });
  return mat;
}

/**
 * Crisp timber-framed Korean architectural signboard CanvasTexture.
 */
export function createKoreanSignTexture(
  title: string,
  badge: string,
  accentColor = '#2E5A44'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  // Warm ivory placard card
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer charcoal architectural border
  ctx.strokeStyle = '#2B221B';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Accent header strip on top
  ctx.fillStyle = accentColor;
  ctx.fillRect(14, 14, canvas.width - 28, 42);

  // Badge label (monospace)
  ctx.fillStyle = '#FFFDF7';
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(badge, 28, 36);

  // Right small "SAMPLE" chip inside header strip
  ctx.fillStyle = 'rgba(242, 196, 100, 0.96)';
  ctx.fillRect(canvas.width - 134, 21, 106, 28);
  ctx.fillStyle = '#221C17';
  ctx.font = '700 17px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPLE', canvas.width - 81, 36);

  // Main Korean Hangul title
  ctx.fillStyle = '#221C17';
  ctx.font = '800 48px "Pretendard Variable", Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, canvas.width / 2, 120);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Museum-grade warm ivory & brushed brass architectural plaque texture with 1:1 canvas aspect matching Mesh plane.
 */
export function createModelPlaqueTexture(
  title: string,
  badge: string,
  accentColor = '#2E5A44',
  showSample = true,
  aspectRatio = 3.5
): THREE.CanvasTexture {
  const height = 220;
  const width = Math.max(440, Math.round(height * aspectRatio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FAF5EA';
  ctx.fillRect(0, 0, width, height);

  // Espresso walnut outer border & brushed brass inner hairline rule
  ctx.strokeStyle = '#2B221B';
  ctx.lineWidth = 9;
  ctx.strokeRect(4.5, 4.5, width - 9, height - 9);

  ctx.strokeStyle = '#D8AD4A';
  ctx.lineWidth = 3;
  ctx.strokeRect(13, 13, width - 26, height - 26);

  // Top accent badge pill
  ctx.font = '700 20px "JetBrains Mono", monospace';
  const badgeW = Math.max(130, Math.ceil(ctx.measureText(badge).width) + 30);
  ctx.fillStyle = accentColor;
  ctx.fillRect(26, 24, badgeW, 32);

  ctx.fillStyle = '#FFFDF7';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(badge, 26 + badgeW / 2, 40);

  // Optional subtle brass-tinted SAMPLE chip on top-right
  if (showSample) {
    ctx.fillStyle = 'rgba(216, 173, 74, 0.24)';
    ctx.fillRect(width - 126, 26, 100, 28);
    ctx.strokeStyle = '#B8863B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(width - 126, 26, 100, 28);
    ctx.fillStyle = '#584222';
    ctx.font = '700 15px "JetBrains Mono", monospace';
    ctx.fillText('SAMPLE', width - 76, 40);
  }

  // Crisp Hangul architectural title auto-fitted up to 64px bold
  let fontPx = 64;
  while (fontPx > 32) {
    ctx.font = `800 ${fontPx}px "Pretendard Variable", Pretendard, sans-serif`;
    if (ctx.measureText(title).width <= width - 64) break;
    fontPx -= 2;
  }
  ctx.fillStyle = '#221C17';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, width / 2, 136);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates crisp Prussian Blueprint ground texture containing real site footprints
 * across all 6 plots (board: 28 x 19, x in [-14, 14], z in [-9.5, 9.5]).
 */
export function createBlueprintSiteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1792;
  canvas.height = 1216;
  const ctx = canvas.getContext('2d')!;

  // Deep architectural blueprint Prussian base
  ctx.fillStyle = '#1B4674';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Minor CAD grid (32px)
  ctx.strokeStyle = 'rgba(220, 236, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Major 5m grid (128px)
  ctx.strokeStyle = 'rgba(220, 236, 255, 0.28)';
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= canvas.width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // World (x in [-15, 15], z in [-10.5, 10.5]) -> Canvas pixel mapper
  const toPx = (wx: number, wz: number): [number, number] => [
    ((wx + 15) / 30) * canvas.width,
    ((wz + 10.5) / 21) * canvas.height,
  ];

  // Outer dashed setback boundary line
  ctx.save();
  ctx.strokeStyle = 'rgba(242, 196, 100, 0.72)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  const [bx0, by0] = toPx(-13.6, -9.1);
  const [bx1, by1] = toPx(13.6, 9.1);
  ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
  ctx.restore();

  // U-Loop promenade centerline connecting front row -> east turn -> central courtyard
  ctx.save();
  ctx.strokeStyle = 'rgba(244, 248, 255, 0.72)';
  ctx.lineWidth = 3.5;
  const loopPts = [
    [-11.8, 7.9],
    [-9.0, 7.9],
    [0.0, 7.9],
    [9.0, 7.9],
    [12.4, 3.8],
    [12.2, 0.1],
    [0.0, 0.1],
    [-11.6, 0.1],
  ] as const;
  ctx.beginPath();
  loopPts.forEach(([wx, wz], idx) => {
    const [px, py] = toPx(wx, wz);
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
  ctx.restore();

  // Draw all 6 Architectural Plot Footprints
  const plots = [
    { x: -9.0, z: 4.8, tag: 'PLOT 01 // 법규 검토소', w: 4.1, d: 3.8, cols: true },
    { x: 0.0, z: 4.8, tag: 'PLOT 02 // 건축물대장 MCP', w: 4.2, d: 3.8, cols: false },
    { x: 9.0, z: 4.8, tag: 'PLOT 03 // 매스 스터디관', w: 4.1, d: 3.8, cols: false },
    { x: 9.0, z: -4.8, tag: 'PLOT 04 // 설계공모 분석실', w: 4.2, d: 3.8, cols: false },
    { x: 0.0, z: -4.8, tag: 'PLOT 05 // 도면·시방 검수원', w: 4.3, d: 3.8, cols: false },
    { x: -9.0, z: -4.8, tag: 'PLOT 06 // 공사감리 포스트', w: 4.0, d: 3.8, cols: false },
  ];

  plots.forEach((p) => {
    const [x0, y0] = toPx(p.x - p.w / 2, p.z - p.d / 2);
    const [x1, y1] = toPx(p.x + p.w / 2, p.z + p.d / 2);
    ctx.fillStyle = 'rgba(244, 248, 255, 0.14)';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

    // Structural axis crosshairs inside footprint
    const [mx, my] = toPx(p.x, p.z);
    ctx.strokeStyle = 'rgba(244, 248, 255, 0.42)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, my);
    ctx.lineTo(x1, my);
    ctx.moveTo(mx, y0);
    ctx.lineTo(mx, y1);
    ctx.stroke();

    if (p.cols) {
      ctx.fillStyle = '#F2C464';
      for (const cxOff of [-1.25, -0.45, 0.45, 1.25]) {
        const [cx, cy] = toPx(p.x + cxOff, p.z + 1.45);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = 'rgba(244, 248, 255, 0.88)';
    ctx.font = '700 18px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    const [tx, ty] = toPx(p.x - p.w / 2, p.z - p.d / 2 - 0.36);
    ctx.fillText(p.tag, tx, ty);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates high-DPI 2-page open Korean textbook spread CanvasTexture for the 3D Bookstand.
 */
export function createBookSpreadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 680;
  const ctx = canvas.getContext('2d')!;

  // Warm cream textbook paper
  ctx.fillStyle = '#FAF4E8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle center spine crease shadow
  const spineGrad = ctx.createLinearGradient(canvas.width / 2 - 36, 0, canvas.width / 2 + 36, 0);
  spineGrad.addColorStop(0, 'rgba(43, 34, 27, 0)');
  spineGrad.addColorStop(0.5, 'rgba(43, 34, 27, 0.22)');
  spineGrad.addColorStop(1, 'rgba(43, 34, 27, 0)');
  ctx.fillStyle = spineGrad;
  ctx.fillRect(canvas.width / 2 - 36, 0, 72, canvas.height);

  // Left Page: Course Header & Architectural Sketch Diagram
  ctx.fillStyle = '#2E5A44';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('E:DEN ARCHITECTURE × AI', 52, 66);

  ctx.fillStyle = '#221C17';
  ctx.font = '800 32px "Pretendard Variable", sans-serif';
  ctx.fillText('건축 실무 바이브 코딩', 52, 114);
  ctx.font = '500 18px "Pretendard Variable", sans-serif';
  ctx.fillStyle = '#58493D';
  ctx.fillText('강진호 대표건축사 · 실전 교재 SAMPLE', 52, 148);

  // Crisp blueprint vignette rectangle on left page
  ctx.fillStyle = '#1B4674';
  ctx.fillRect(52, 184, 396, 200);
  ctx.strokeStyle = '#F4F8FF';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(102, 234, 150, 108);
  ctx.strokeRect(272, 214, 128, 128);
  ctx.strokeStyle = '#F2C464';
  ctx.beginPath();
  ctx.moveTo(82, 342);
  ctx.lineTo(418, 342);
  ctx.stroke();

  // Chapter list summary lines on left bottom
  ctx.fillStyle = '#221C17';
  ctx.font = '700 18px "Pretendard Variable", sans-serif';
  ['Ch.01 AI 워크플로우', 'Ch.02 법규·세움터', 'Ch.03 건축물대장 MCP', 'Ch.04 매스·공모 검산', 'Ch.05 도면·감리 QA'].forEach(
    (line, idx) => {
      ctx.fillText(line, 52, 434 + idx * 36);
    }
  );

  // Right Page: Prompt & MCP Snippet Spread
  ctx.fillStyle = '#2E5A44';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText('PART 03 // MCP & PROMPT', 562, 66);

  ctx.fillStyle = '#221C17';
  ctx.font = '700 24px "Pretendard Variable", sans-serif';
  ctx.fillText('공공 API · 세움터 실무 연결', 562, 114);

  // Simulated text lines
  ctx.fillStyle = '#C9B9A3';
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(562, 156 + i * 24, 390 - (i % 2) * 45, 9);
  }

  // Highlighted Code Snippet Box
  ctx.fillStyle = '#221C17';
  ctx.fillRect(562, 276, 404, 186);
  ctx.fillStyle = '#F2C464';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.fillText('{ "mcpServers": {', 582, 316);
  ctx.fillStyle = '#F4F8FF';
  ctx.fillText('  "eden-arch-registry": {', 582, 346);
  ctx.fillText('    "cmd": "npx",', 582, 376);
  ctx.fillText('    "sigungu": "47111"', 582, 406);
  ctx.fillStyle = '#F2C464';
  ctx.fillText('} } }', 582, 436);

  // Simulated bottom paragraph + page numbers
  ctx.fillStyle = '#C9B9A3';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillRect(562, 496 + i * 24, 370 - i * 32, 9);
  }
  ctx.fillStyle = '#786759';
  ctx.font = '600 15px "JetBrains Mono", monospace';
  ctx.fillText('— 104 —', 225, 646);
  ctx.fillText('— 105 —', 740, 646);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Future-proof .glb swap loader: attaches a custom external GLTF model cleanly onto any plinth.
 */
export async function loadOptionalGlb(url: string, targetHeight = 2.6): Promise<THREE.Group> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const scale = targetHeight / Math.max(size.y, 0.01);
  root.scale.setScalar(scale);
  root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  const wrapper = new THREE.Group();
  wrapper.add(root);
  return wrapper;
}

export function tagStopHierarchy(root: THREE.Object3D, stopId: string): void {
  root.traverse((obj) => {
    obj.userData.stopId = stopId;
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

export function disposeObjectHierarchy(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((m) => {
      if (!m) return;
      const anyMat = m as THREE.MeshStandardMaterial;
      if (anyMat.map) anyMat.map.dispose();
      m.dispose();
    });
  });
}

import * as THREE from 'three';
import type { LightingMode, StopId } from '@/data/atelierStations';
import {
  buildCompAuditAtelier,
  buildDrawingQaArchive,
  buildLawReviewHall,
  buildMassStudyPavilion,
  buildMcpTower,
  buildSupervisionPost,
  type AnimatedBuildingRig,
} from '@/engine/buildArchitecture';
import { InkDofPass } from '@/engine/InkDofPass';
import { buildSurroundingAtelier } from '@/engine/studioSurround';
import { createToonGradientMap, disposeObjectHierarchy, loadOptionalGlb } from '@/engine/toonMaterials';

interface StopCameraConfig {
  pos: [number, number, number];
  lookAt: [number, number, number];
  focusPoint: [number, number, number];
  focusRange: number;
  maxBlur: number;
}

const CAMERA_CONFIGS: Record<StopId, StopCameraConfig> = {
  overview: {
    pos: [3.8, 18.4, 42.6],
    lookAt: [3.8, 3.6, -4.6],
    focusPoint: [2.8, 2.2, -3.4],
    focusRange: 35.0,
    maxBlur: 1.25,
  },
  'law-office': {
    // Stop 01: Left-Front Low 3/4 (-19 deg) highlighting classical columns & west plaque
    pos: [-11.65, 2.68, 12.65],
    lookAt: [-9.0, 1.38, 4.9],
    focusPoint: [-9.0, 1.45, 5.2],
    focusRange: 4.2,
    maxBlur: 4.6,
  },
  'mcp-tower': {
    // Stop 02: Right-Front Mid 3/4 (+22 deg) highlighting exterior stair, louvers & east plaque
    pos: [2.95, 3.45, 12.55],
    lookAt: [0.0, 1.52, 4.85],
    focusPoint: [0.0, 1.55, 5.1],
    focusRange: 4.2,
    maxBlur: 4.6,
  },
  'mass-study': {
    // Stop 03: East-Turn Elevated Terrace 3/4 (+25 deg) showcasing 3 decks, sun-path arch & plaque
    pos: [12.35, 4.05, 12.35],
    lookAt: [9.0, 1.52, 4.8],
    focusPoint: [9.0, 1.55, 5.1],
    focusRange: 4.4,
    maxBlur: 4.4,
  },
  'comp-audit': {
    // Stop 04: Inner Courtyard Left-Front 3/4 (-18 deg), framing brick facade, sawtooth bays & plaque
    pos: [6.4, 2.95, 3.15],
    lookAt: [9.0, 1.36, -4.65],
    focusPoint: [9.0, 1.4, -4.4],
    focusRange: 4.2,
    maxBlur: 4.6,
  },
  'drawing-qa': {
    // Stop 05: Composed Near-Symmetrical Axial Low View (-3 deg) honoring twin-gable symmetry & plaque
    pos: [-0.35, 2.58, 3.15],
    lookAt: [0.0, 1.34, -4.65],
    focusPoint: [0.0, 1.4, -4.4],
    focusRange: 4.0,
    maxBlur: 4.6,
  },
  'supervision-post': {
    // Stop 06: Low Right-Front Structural 3/4 (+21 deg) emphasizing X-bracing, pilotis & right plaque
    pos: [-6.05, 2.52, 3.15],
    lookAt: [-9.0, 1.42, -4.65],
    focusPoint: [-9.0, 1.45, -4.4],
    focusRange: 4.2,
    maxBlur: 4.6,
  },
  bookstand: {
    // Stop 07: Clean Desk Reader's View clearing Building 05 gables below
    pos: [0.35, 10.2, 0.4],
    lookAt: [0.0, 3.3, -14.5],
    focusPoint: [0.0, 3.3, -14.5],
    focusRange: 5.5,
    maxBlur: 3.4,
  },
  cabinet: {
    // Stop 08: Studio-Right Gallery Angle facing the 3x3 Architectural Showcase Cabinet
    pos: [30.8, 2.3, 21.0],
    lookAt: [29.4, 2.1, -4.2],
    focusPoint: [29.4, 2.1, -4.2],
    focusRange: 11.5,
    maxBlur: 2.2,
  },
  board: {
    // Stop 09: Symmetrical Head-On Zoom into Wall Pin-Up Corkboard
    pos: [0.0, 13.0, -1.2],
    lookAt: [0.0, 13.0, -19.75],
    focusPoint: [0.0, 13.0, -19.5],
    focusRange: 10.0,
    maxBlur: 2.0,
  },
};

function easeOutBack(t: number): number {
  const c1 = 1.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function segmentScale(p: number, start: number, end: number): { visible: boolean; scale: number } {
  if (p < start) return { visible: false, scale: 0.001 };
  const t = Math.min(1, (p - start) / Math.max(end - start, 0.001));
  return { visible: true, scale: Math.max(0.01, easeOutBack(t)) };
}

export interface DioramaEngineCallbacks {
  onIntroProgress: (pct: number, phaseLabel: string, done: boolean) => void;
  onSelectStop: (id: StopId) => void;
  onSelectProject?: (projectIdx: number) => void;
  onHoverStop: (id: StopId | null) => void;
  onToggleLighting?: () => void;
  onHoverLamp?: (hovered: boolean) => void;
  onWebglFallback: () => void;
}

export class DioramaEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private inkDof!: InkDofPass;
  private gradientMap!: THREE.DataTexture;

  private activeStop: StopId = 'overview';
  private flightT = 1.0;
  private lighting: LightingMode = 'day';
  private callbacks: DioramaEngineCallbacks;

  private introDone = false;
  private introPaused = false;
  private introProgress = 0;
  private introDuration = 5400;
  private introStartTime = 0;
  private orbitOffset = { az: 0, po: 0 };

  private camCurPos = new THREE.Vector3(-7.2, 16.2, 46.8);
  private camCurLook = new THREE.Vector3(3.2, 2.8, -4.8);
  private camFocusPos = new THREE.Vector3(2.0, 1.5, -3.0);
  private viewOffsetRatio = 0;
  private viewOffsetYRatio = 0;

  private rafId = 0;
  private destroyed = false;
  private disposeSceneExtras: (() => void) | null = null;
  private cubbyHighlightFn: ((idx: number) => void) | null = null;
  private cabinetZoomed = false;
  private selectedCubbyIdx = 0;
  private reducedMotion = false;
  private clearHoverFn: (() => void) | null = null;

  constructor(
    container: HTMLElement,
    initialSkipIntro: boolean,
    callbacks: DioramaEngineCallbacks,
    initialStop: StopId = 'overview',
    initialCubbyIdx = 0,
    initialCabinetZoom = false
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSkip = initialSkipIntro || this.reducedMotion;
    this.introDone = effectiveSkip;
    this.introProgress = effectiveSkip ? 1 : 0;
    this.selectedCubbyIdx = Math.max(0, Math.min(8, initialCubbyIdx));
    this.cabinetZoomed = initialCabinetZoom;
    if (effectiveSkip) {
      this.activeStop = initialStop;
      const cfg = CAMERA_CONFIGS[initialStop];
      this.camCurPos.set(...cfg.pos);
      this.camCurLook.set(...cfg.lookAt);
      this.camFocusPos.set(...cfg.focusPoint);
      const isDesktop = Math.max(container.clientWidth, 320) >= 768;
      if (initialStop !== 'overview' && initialStop !== 'board') {
        this.viewOffsetRatio = isDesktop ? 0.225 : 0;
        this.viewOffsetYRatio = isDesktop ? 0 : 0.19;
      }
    }

    if (!this.init()) {
      callbacks.onWebglFallback();
      return;
    }
  }

  private init(): boolean {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return false;

    const w = Math.max(this.container.clientWidth, 320);
    const h = Math.max(this.container.clientHeight, 320);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    const dayBg = new THREE.Color(0xf3ece0);
    const nightBg = new THREE.Color(0x2c241d);

    this.scene = new THREE.Scene();
    this.scene.background = dayBg.clone();
    const fog = new THREE.FogExp2(0xf3ece0, 0.0042);
    this.scene.fog = fog;

    const aspect = w / h;
    const baseFov = aspect < 0.85 ? 44 + (0.85 - Math.max(0.42, aspect)) * 82 : 44;
    this.camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.5, 190);
    if (Math.abs(this.viewOffsetRatio) > 0.001 || Math.abs(this.viewOffsetYRatio) > 0.001) {
      this.camera.setViewOffset(w, h, w * this.viewOffsetRatio, h * this.viewOffsetYRatio, w, h);
    }
    if (!this.introDone && w < 640) {
      this.camCurPos.set(-8.0, 19.0, 54.0);
    }
    this.gradientMap = createToonGradientMap();

    // Lighting Rig: Warm Morning Sunlight + Soft Room Fill + Night Glow
    const hemiLight = new THREE.HemisphereLight(0xfff6e6, 0xb89e82, 0.86);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff0d4, 1.55);
    sunLight.position.set(16, 26, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -32;
    sunLight.shadow.camera.right = 34;
    sunLight.shadow.camera.top = 28;
    sunLight.shadow.camera.bottom = -24;
    sunLight.shadow.camera.near = 2;
    sunLight.shadow.camera.far = 95;
    sunLight.shadow.bias = -0.0008;
    sunLight.shadow.normalBias = 0.025;
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xd9e9f7, 0.35);
    rimLight.position.set(-12, 9, -11);
    this.scene.add(rimLight);

    // Build Studio Surround, Desk-side Stop 07 Bookstand & All 6 Hero Architectural Buildings
    const studioCtx = buildSurroundingAtelier(this.gradientMap);
    this.scene.add(studioCtx.group);

    const rig01 = buildLawReviewHall(this.gradientMap);
    const rig02 = buildMcpTower(this.gradientMap);
    const rig03 = buildMassStudyPavilion(this.gradientMap);
    const rig04 = buildCompAuditAtelier(this.gradientMap);
    const rig05 = buildDrawingQaArchive(this.gradientMap);
    const rig06 = buildSupervisionPost(this.gradientMap);
    const allBuildingRigs: AnimatedBuildingRig[] = [rig01, rig02, rig03, rig04, rig05, rig06];
    allBuildingRigs.forEach((r) => this.scene.add(r.root));

    const interactiveRoots: THREE.Object3D[] = [
      ...allBuildingRigs.map((r) => r.root),
      studioCtx.bookstandRig.root,
      studioCtx.deskLampRoot,
      studioCtx.cabinetRoot,
      studioCtx.boardRoot,
    ];

    this.cubbyHighlightFn = studioCtx.setHighlightedCubby;
    studioCtx.setHighlightedCubby(this.selectedCubbyIdx);
    if (this.introDone && this.activeStop === 'cabinet') {
      const cabPose = studioCtx.getCabinetCameraPose(this.cabinetZoomed, this.selectedCubbyIdx);
      this.camCurPos.copy(cabPose.pos);
      this.camCurLook.copy(cabPose.lookAt);
      this.camFocusPos.copy(cabPose.focusPoint);
    }

    this.inkDof = new InkDofPass(w, h, dpr, this.renderer.capabilities.isWebGL2);

    // Drag Orbit + Stop / Cubby / Desk Lamp Click Raycasting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;
    let dragDist = 0;
    let lastPtr = { x: 0, y: 0 };
    let currentHovered: StopId | null = null;
    let currentHoveredLamp = false;

    const getHitTarget = (
      cx: number,
      cy: number
    ): { stopId: StopId | null; isLamp: boolean; projectIndex: number | null } => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.camera);
      const hits = raycaster.intersectObjects(interactiveRoots, true);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data.isLampToggle) {
          return { stopId: null, isLamp: true, projectIndex: null };
        }
        return {
          stopId: (data.stopId as StopId) ?? null,
          isLamp: false,
          projectIndex: typeof data.projectIndex === 'number' ? data.projectIndex : null,
        };
      }
      return { stopId: null, isLamp: false, projectIndex: null };
    };

    const domEl = this.renderer.domElement;

    const clearHoverState = () => {
      if (currentHovered !== null) {
        currentHovered = null;
        this.callbacks.onHoverStop(null);
      }
      if (currentHoveredLamp) {
        currentHoveredLamp = false;
        this.callbacks.onHoverLamp?.(false);
      }
    };
    this.clearHoverFn = clearHoverState;

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      dragDist = 0;
      lastPtr = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragging) {
        const dx = e.clientX - lastPtr.x;
        const dy = e.clientY - lastPtr.y;
        dragDist += Math.hypot(dx, dy);
        this.orbitOffset.az = Math.max(-0.9, Math.min(0.9, this.orbitOffset.az - dx * 0.005));
        this.orbitOffset.po = Math.max(-0.28, Math.min(0.28, this.orbitOffset.po - dy * 0.0038));
        lastPtr = { x: e.clientX, y: e.clientY };
        return;
      }
      if (!this.introDone || this.activeStop === 'board' || e.target !== domEl) {
        clearHoverState();
        return;
      }
      const hit = getHitTarget(e.clientX, e.clientY);
      if (hit.stopId !== currentHovered) {
        currentHovered = hit.stopId;
        this.callbacks.onHoverStop(hit.stopId);
      }
      if (hit.isLamp !== currentHoveredLamp) {
        currentHoveredLamp = hit.isLamp;
        this.callbacks.onHoverLamp?.(hit.isLamp);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (
        dragging &&
        dragDist < 6 &&
        this.introDone &&
        this.activeStop !== 'board' &&
        e.target === domEl
      ) {
        const hit = getHitTarget(e.clientX, e.clientY);
        if (hit.isLamp) {
          this.callbacks.onToggleLighting?.();
        } else {
          if (hit.projectIndex !== null) {
            this.callbacks.onSelectProject?.(hit.projectIndex);
          }
          if (hit.stopId) {
            this.callbacks.onSelectStop(hit.stopId);
          }
        }
      }
      dragging = false;
    };

    domEl.addEventListener('pointerdown', onPointerDown);
    domEl.addEventListener('pointerleave', clearHoverState);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const onResize = () => {
      if (this.destroyed) return;
      const rw = Math.max(this.container.clientWidth, 320);
      const rh = Math.max(this.container.clientHeight, 320);
      const rdpr = Math.min(window.devicePixelRatio || 1, 2);
      const rAspect = rw / rh;
      this.camera.aspect = rAspect;
      this.camera.fov = rAspect < 0.85 ? 44 + (0.85 - Math.max(0.42, rAspect)) * 82 : 44;
      if (Math.abs(this.viewOffsetRatio) > 0.001 || Math.abs(this.viewOffsetYRatio) > 0.001) {
        this.camera.setViewOffset(rw, rh, rw * this.viewOffsetRatio, rh * this.viewOffsetYRatio, rw, rh);
      } else {
        this.camera.clearViewOffset();
      }
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(rw, rh);
      this.inkDof.setSize(rw, rh, rdpr);
    };
    window.addEventListener('resize', onResize);

    this.introStartTime = performance.now();
    const clock = new THREE.Clock();
    const tmpTargetPos = new THREE.Vector3();
    const tmpTargetLook = new THREE.Vector3();

    let lastReportedPct = -1;
    let lastReportedDone = false;
    let nightFactor = this.lighting === 'night' ? 1 : 0;
    let zoomLightFactor = this.activeStop === 'cabinet' && this.cabinetZoomed ? 1 : 0;
    let lastAppliedOffsetX = this.viewOffsetRatio;
    let lastAppliedOffsetY = this.viewOffsetYRatio;

    const applyBuildingConstruction = (rig: AnimatedBuildingRig, p: number, offset: number) => {
      const f = segmentScale(p, 0.52 + offset, 0.64 + offset);
      rig.foundation.visible = f.visible;
      rig.foundation.scale.set(1, f.scale, 1);

      const s = segmentScale(p, 0.58 + offset, 0.72 + offset);
      rig.structure.visible = s.visible;
      rig.structure.scale.set(1, s.scale, 1);

      const r = segmentScale(p, 0.65 + offset, 0.79 + offset);
      rig.roof.visible = r.visible;
      rig.roof.scale.set(1, r.scale, 1);

      const pr = segmentScale(p, 0.72 + offset, 0.85 + offset);
      rig.props.visible = pr.visible;
      rig.props.scale.setScalar(pr.scale);
    };

    const tick = () => {
      if (this.destroyed) return;
      const dt = clock.getDelta();
      const elapsed = clock.elapsedTime;

      // 1. Wide Studio Room -> Desk Zoom-In -> Blueprint Unroll -> 6-Building Extrusion -> Fade-Out
      if (!this.introDone && lastReportedDone) {
        lastReportedPct = -1;
        lastReportedDone = false;
      }

      if (!this.introDone && !this.introPaused) {
        const ms = performance.now() - this.introStartTime;
        this.introProgress = Math.min(1, ms / this.introDuration);
        if (this.introProgress >= 1) {
          this.introDone = true;
        }
        const pct = this.introDone ? 100 : Math.min(99, Math.floor(this.introProgress * 100));
        if (pct !== lastReportedPct || this.introDone !== lastReportedDone) {
          lastReportedPct = pct;
          lastReportedDone = this.introDone;
          const label = this.introDone
            ? '단지 준공 완료'
            : pct < 30
            ? '아틀리에 작업실 전경에서 책상으로 줌인 중'
            : pct < 56
            ? '책상 위 청사진을 펼치는 중'
            : pct < 82
            ? '도면선 위로 6개 건축 모형이 올라오는 중'
            : '청사진 페이드아웃 · 단지 전경 전환 중';
          this.callbacks.onIntroProgress(pct, label, this.introDone);
        }
      } else if (this.introDone && !lastReportedDone) {
        lastReportedPct = 100;
        lastReportedDone = true;
        this.callbacks.onIntroProgress(100, '단지 준공 완료', true);
      }

      const p = this.introProgress;
      allBuildingRigs.forEach((rig, idx) => {
        applyBuildingConstruction(rig, p, idx * 0.015);
      });
      // Bookstand (독서대) and Desk Lamp (조명) stay permanently visible from p = 0.0

      const treeAnim = segmentScale(p, 0.7, 0.94);
      studioCtx.treesGroup.visible = treeAnim.visible;
      studioCtx.treesGroup.scale.set(1, treeAnim.scale, 1);

      // Physical Blue Blueprint Scroll Unroll on Desk (-14.5 -> +14.1 across p = 0.26..0.56)
      const unrollLinear = Math.max(0, Math.min(1, (p - 0.26) / 0.3));
      const unrollT = 1 - Math.pow(1 - unrollLinear, 3);
      const rollX = THREE.MathUtils.lerp(-14.5, 14.1, unrollT);
      studioCtx.groundShaderUniforms.uUnrollX.value = this.introDone
        ? 16.0
        : p < 0.26
        ? -15.2
        : rollX;

      const siteReveal = Math.max(0, Math.min(1, (p - 0.68) / 0.22));
      const fadeRaw = Math.max(0, Math.min(1, (p - 0.74) / 0.22));
      const fadeSmooth = fadeRaw * fadeRaw * (3 - 2 * fadeRaw);
      studioCtx.groundShaderUniforms.uSiteReveal.value = this.introDone ? 1.0 : siteReveal;
      studioCtx.groundShaderUniforms.uBlueprintOpacity.value = this.introDone ? 0.0 : 1.0 - fadeSmooth;

      studioCtx.blueprintRoll.visible = !this.introDone && p < 0.95;
      if (studioCtx.blueprintRoll.visible) {
        const rollScale =
          p < 0.26
            ? 1.08
            : p < 0.78
            ? THREE.MathUtils.lerp(1.08, 0.82, unrollT)
            : Math.max(0.001, 0.82 * (1 - (p - 0.78) / 0.17));
        studioCtx.blueprintRoll.position.set(p < 0.26 ? -14.5 : rollX, 0.58 * rollScale, 0);
        studioCtx.blueprintRoll.scale.set(rollScale, rollScale, 1);
        studioCtx.blueprintRoll.rotation.z = -unrollT * Math.PI * 5.8;
      }

      const safeDt = Math.min(dt, 0.14);
      const instant = this.introPaused || (this.reducedMotion && this.introDone);
      const dampLight = instant ? 1.0 : 1 - Math.exp(-6.5 * safeDt);
      const dampCam = instant ? 1.0 : 1 - Math.exp(-6.8 * safeDt);

      // 2. Day / Night Desk Lamp Interpolation & Horizon Fog Sync
      const desiredNight = this.lighting === 'night' ? 1 : 0;
      nightFactor += (desiredNight - nightFactor) * dampLight;
      const desiredZoom = this.activeStop === 'cabinet' && this.cabinetZoomed ? 1 : 0;
      zoomLightFactor += (desiredZoom - zoomLightFactor) * dampLight;
      const focusRoomDim = 1 - 0.26 * zoomLightFactor;

      studioCtx.groundShaderUniforms.uNightFactor.value = nightFactor;
      (this.scene.background as THREE.Color).copy(dayBg).lerp(nightBg, nightFactor);
      fog.color.copy(this.scene.background as THREE.Color);
      const postFog = THREE.MathUtils.lerp(0.0068, 0.0085, nightFactor);
      fog.density = this.introDone
        ? postFog
        : THREE.MathUtils.lerp(0.0042, postFog, Math.max(0, (p - 0.62) / 0.38));

      hemiLight.intensity = THREE.MathUtils.lerp(0.86, 0.38, nightFactor) * focusRoomDim;
      sunLight.intensity = THREE.MathUtils.lerp(1.55, 0.34, nightFactor) * focusRoomDim;
      rimLight.intensity = THREE.MathUtils.lerp(0.35, 0.52, nightFactor);
      studioCtx.updateDeskLampLighting(nightFactor);

      const winGlow = THREE.MathUtils.lerp(0.0, 0.85, nightFactor);
      allBuildingRigs.forEach((rig) => {
        rig.glowMaterials.forEach((m) => {
          m.emissiveIntensity = winGlow;
        });
      });
      studioCtx.updateCabinetFocusLighting(this.selectedCubbyIdx, zoomLightFactor, nightFactor);
      studioCtx.lampBulbs.forEach((b) => {
        b.emissiveIntensity = THREE.MathUtils.lerp(0.25, 2.2, nightFactor);
      });
      studioCtx.lampLights.forEach((l) => {
        l.intensity = THREE.MathUtils.lerp(0.15, 3.2, nightFactor);
      });

      if (!this.reducedMotion) {
        const posAttr = studioCtx.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < posAttr.count; i += 1) {
          let py = posAttr.getY(i) + dt * 0.22;
          if (py > 5.8) py = 0.6;
          posAttr.setY(i, py);
        }
        posAttr.needsUpdate = true;
      }

      // 3. Responsive Camera Framing & Parabolic Crane Flight
      this.flightT = Math.min(1, this.flightT + dt * 1.45);
      const isDesktop = this.container.clientWidth >= 768;
      const isMobileNarrow = this.container.clientWidth < 640;

      const cfg = CAMERA_CONFIGS[this.activeStop];
      const cabPose =
        this.activeStop === 'cabinet'
          ? studioCtx.getCabinetCameraPose(this.cabinetZoomed, this.selectedCubbyIdx)
          : null;
      const basePos = cabPose ? cabPose.pos.clone() : new THREE.Vector3(...cfg.pos);
      const baseLook = cabPose ? cabPose.lookAt.clone() : new THREE.Vector3(...cfg.lookAt);
      const activeFocusPoint = cabPose ? cabPose.focusPoint : new THREE.Vector3(...cfg.focusPoint);
      const activeFocusRange =
        this.activeStop === 'cabinet' ? (this.cabinetZoomed ? 3.2 : 11.5) : cfg.focusRange;
      const activeMaxBlur =
        this.activeStop === 'cabinet' ? (this.cabinetZoomed ? 4.2 : 2.2) : cfg.maxBlur;

      if (this.activeStop === 'overview' && isMobileNarrow) {
        basePos.multiplyScalar(1.32);
      } else if (this.activeStop === 'cabinet' && !this.cabinetZoomed && isMobileNarrow) {
        baseLook.y -= 0.4;
        const pullBack = basePos.clone().sub(baseLook).multiplyScalar(1.16);
        basePos.copy(baseLook).add(pullBack);
      } else if (this.activeStop !== 'overview' && isMobileNarrow) {
        baseLook.y += 0.18;
        const pullBack = basePos.clone().sub(baseLook).multiplyScalar(1.02);
        basePos.copy(baseLook).add(pullBack);
      }

      const arm = basePos.clone().sub(baseLook);
      const spherical = new THREE.Spherical().setFromVector3(arm);
      const idleDrift =
        !this.reducedMotion && this.introDone && this.activeStop === 'overview'
          ? Math.sin(elapsed * 0.28) * 0.08
          : 0;
      spherical.theta += this.orbitOffset.az + idleDrift;
      spherical.phi = Math.max(0.45, Math.min(1.36, spherical.phi + this.orbitOffset.po));

      arm.setFromSpherical(spherical);
      tmpTargetPos.copy(baseLook).add(arm);
      tmpTargetLook.copy(baseLook);

      // Wide Studio Room (책상·보드·장식장·큰 독서대·조명) -> Symmetrical Desk Zoom-In -> Blueprint Unroll -> Overview
      if (!this.introDone) {
        const roomWidePos = new THREE.Vector3(
          isMobileNarrow ? -6.5 : -7.2,
          isMobileNarrow ? 19.5 : 16.2,
          isMobileNarrow ? 56.0 : 46.8
        );
        const roomWideLook = new THREE.Vector3(3.2, 2.8, -4.8);
        const deskZoomPos = new THREE.Vector3(
          0.0,
          isMobileNarrow ? 31.0 : 24.8,
          isMobileNarrow ? 28.0 : 23.2
        );
        const deskZoomLook = new THREE.Vector3(0.0, 1.2, -3.8);

        if (p < 0.32) {
          const zoomLinear = Math.max(0, Math.min(1, p / 0.32));
          const zoomSmooth = zoomLinear * zoomLinear * (3 - 2 * zoomLinear);
          tmpTargetPos.lerpVectors(roomWidePos, deskZoomPos, zoomSmooth);
          tmpTargetLook.lerpVectors(roomWideLook, deskZoomLook, zoomSmooth);
        } else if (p < 0.62) {
          tmpTargetPos.copy(deskZoomPos);
          tmpTargetLook.copy(deskZoomLook);
        } else {
          const swoopRaw = Math.max(0, Math.min(1, (p - 0.62) / 0.38));
          const swoop = swoopRaw * swoopRaw * (3 - 2 * swoopRaw);
          tmpTargetPos.lerpVectors(deskZoomPos, tmpTargetPos, swoop);
          tmpTargetLook.lerpVectors(deskZoomLook, tmpTargetLook, swoop);
        }
      }

      const arcLift =
        !this.reducedMotion && this.flightT < 1 && this.activeStop !== 'cabinet'
          ? Math.sin(Math.PI * this.flightT) * 1.1
          : 0;
      tmpTargetPos.y += arcLift;

      this.camCurPos.lerp(tmpTargetPos, dampCam);
      this.camCurLook.lerp(tmpTargetLook, dampCam);

      this.camera.position.copy(this.camCurPos);
      this.camera.lookAt(this.camCurLook);

      // True Optical Frustum Shift: left-half centering on desktop, top-half centering on mobile (Stops 01..08)
      const hasSideSheet = this.activeStop !== 'overview' && this.activeStop !== 'board';
      const desiredOffsetX = isDesktop && hasSideSheet ? 0.225 : 0;
      const desiredOffsetY = !isDesktop && hasSideSheet ? 0.19 : 0;
      this.viewOffsetRatio += (desiredOffsetX - this.viewOffsetRatio) * dampCam;
      this.viewOffsetYRatio += (desiredOffsetY - this.viewOffsetYRatio) * dampCam;
      if (
        Math.abs(this.viewOffsetRatio - lastAppliedOffsetX) > 0.0004 ||
        Math.abs(this.viewOffsetYRatio - lastAppliedOffsetY) > 0.0004
      ) {
        lastAppliedOffsetX = this.viewOffsetRatio;
        lastAppliedOffsetY = this.viewOffsetYRatio;
        const cw = Math.max(this.container.clientWidth, 320);
        const ch = Math.max(this.container.clientHeight, 320);
        if (Math.abs(this.viewOffsetRatio) > 0.001 || Math.abs(this.viewOffsetYRatio) > 0.001) {
          this.camera.setViewOffset(
            cw,
            ch,
            cw * this.viewOffsetRatio,
            ch * this.viewOffsetYRatio,
            cw,
            ch
          );
        } else {
          this.camera.clearViewOffset();
        }
      }

      this.camFocusPos.lerp(activeFocusPoint, dampCam);
      const focusDist = this.camera.position.distanceTo(this.camFocusPos);
      const effectiveRange = this.introDone ? activeFocusRange : 75.0;
      const swoopBlurT = Math.max(0, Math.min(1, (p - 0.75) / 0.25));
      const effectiveMaxBlur = this.introDone
        ? activeMaxBlur
        : THREE.MathUtils.lerp(0.6, activeMaxBlur, swoopBlurT * swoopBlurT * (3 - 2 * swoopBlurT));
      this.inkDof.setFocus(
        this.camera.near,
        this.camera.far,
        focusDist,
        effectiveRange,
        effectiveMaxBlur,
        nightFactor
      );

      this.inkDof.render(this.renderer, this.scene, this.camera, studioCtx.hideFromNormalPass);
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);

    this.disposeSceneExtras = () => {
      domEl.removeEventListener('pointerdown', onPointerDown);
      domEl.removeEventListener('pointerleave', clearHoverState);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      studioCtx.dispose();
    };

    return true;
  }

  public setStop(stopId: StopId): void {
    if (this.activeStop === stopId) return;
    this.activeStop = stopId;
    if (stopId === 'board') {
      this.clearHoverFn?.();
    }
    this.flightT = 0;
    this.orbitOffset.az *= 0.25;
    this.orbitOffset.po *= 0.25;
  }

  public resetOverviewCamera(): void {
    this.ensureIntroCompleteForNavigation();
    this.activeStop = 'overview';
    this.flightT = 0;
    this.orbitOffset.az = 0;
    this.orbitOffset.po = 0;
  }

  public setLighting(mode: LightingMode): void {
    this.lighting = mode;
  }

  public replayIntro(): void {
    this.introDone = false;
    this.introPaused = false;
    this.introProgress = 0;
    this.introStartTime = performance.now();
    this.activeStop = 'overview';
    this.flightT = 1.0;
    this.orbitOffset.az = 0;
    this.orbitOffset.po = 0;
    const isMobileNarrow = this.container.clientWidth < 640;
    this.viewOffsetRatio = 0;
    this.viewOffsetYRatio = 0;
    this.camera?.clearViewOffset();
    this.camCurPos.set(
      isMobileNarrow ? -6.5 : -7.2,
      isMobileNarrow ? 19.5 : 16.2,
      isMobileNarrow ? 56.0 : 46.8
    );
    this.camCurLook.set(3.2, 2.8, -4.8);
    this.callbacks.onIntroProgress(0, '아틀리에 작업실 전경에서 책상으로 줌인 중', false);
  }

  public skipIntro(): void {
    this.introPaused = false;
    this.introProgress = 1;
    this.introDone = true;
    this.callbacks.onIntroProgress(100, '단지 준공 완료', true);
  }

  public ensureIntroCompleteForNavigation(): void {
    if (!this.introDone && !this.introPaused) {
      this.skipIntro();
    }
  }

  public freezeIntroAt(fraction: number): void {
    this.introDone = false;
    this.introPaused = true;
    this.introProgress = Math.max(0, Math.min(1, fraction));
    this.callbacks.onIntroProgress(
      Math.round(this.introProgress * 100),
      '청사진에서 단지 시공 중',
      false
    );
  }

  public setHighlightedCubby(idx: number): void {
    this.cubbyHighlightFn?.(idx);
  }

  public setCabinetFocus(idx: number, zoomed: boolean): void {
    const safeIdx = Math.max(0, Math.min(8, idx));
    this.cubbyHighlightFn?.(safeIdx);
    if (this.selectedCubbyIdx !== safeIdx || this.cabinetZoomed !== zoomed) {
      this.selectedCubbyIdx = safeIdx;
      this.cabinetZoomed = zoomed;
      if (this.activeStop === 'cabinet') {
        this.flightT = 0;
        this.orbitOffset.az = 0;
        this.orbitOffset.po = 0;
      }
    }
  }

  public async swapStationGlb(stopId: StopId, glbUrl: string): Promise<THREE.Group> {
    void stopId;
    return loadOptionalGlb(glbUrl);
  }

  public dispose(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.disposeSceneExtras?.();
    this.inkDof?.dispose();
    this.gradientMap?.dispose();
    if (this.scene) disposeObjectHierarchy(this.scene);
    this.renderer?.dispose();
  }
}

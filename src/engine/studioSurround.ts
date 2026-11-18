import * as THREE from 'three';
import { addPart, createFlushPlaque, type AnimatedBuildingRig } from '@/engine/buildArchitecture';
import { buildPortfolioScaleModel } from '@/engine/buildPortfolioModels';
import {
  createBlueprintSiteTexture,
  createBookSpreadTexture,
  makeToonMat,
  tagStopHierarchy,
} from '@/engine/toonMaterials';

export interface StudioContextResult {
  group: THREE.Group;
  groundShaderUniforms: {
    uUnrollX: { value: number };
    uBlueprintOpacity: { value: number };
    uSiteReveal: { value: number };
    uNightFactor: { value: number };
  };
  blueprintRoll: THREE.Group;
  treesGroup: THREE.Group;
  bookstandRig: AnimatedBuildingRig;
  deskLampRoot: THREE.Group;
  deskSpotLight: THREE.SpotLight;
  updateDeskLampLighting: (nightFactor: number) => void;
  cabinetRoot: THREE.Group;
  boardRoot: THREE.Group;
  setHighlightedCubby: (idx: number) => void;
  updateCabinetFocusLighting: (cubbyIdx: number, zoomFactor: number, nightFactor: number) => void;
  getCabinetCameraPose: (
    zoomed: boolean,
    cubbyIdx: number
  ) => { pos: THREE.Vector3; lookAt: THREE.Vector3; focusPoint: THREE.Vector3 };
  lampBulbs: THREE.MeshToonMaterial[];
  lampLights: THREE.PointLight[];
  motes: THREE.Points;
  hideFromNormalPass: THREE.Object3D[];
  dispose: () => void;
}

function tagLampHierarchy(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    child.userData.isLampToggle = true;
  });
}

/**
 * Rear-Center Desk Stop 07: Permanent Sculpted Oak Bookstand (독서대) facing +Z
 */
function buildBookstandStation(gradientMap: THREE.DataTexture): {
  rig: AnimatedBuildingRig;
  bookTex: THREE.CanvasTexture;
} {
  const root = new THREE.Group();
  root.position.set(0.0, 0.0, -14.6);
  root.rotation.y = 0;

  const foundation = new THREE.Group();
  const structure = new THREE.Group();
  const roof = new THREE.Group();
  const props = new THREE.Group();
  root.add(foundation, structure, roof, props);

  const walnutMat = makeToonMat(gradientMap, 0x8d5e37);
  const cedarMat = makeToonMat(gradientMap, 0xb88555);
  const clothCoverMat = makeToonMat(gradientMap, 0x2e5a44);
  const paperStackMat = makeToonMat(gradientMap, 0xf3ead7);
  const brassMat = makeToonMat(gradientMap, 0xe8bc57);
  const crimsonRibbonMat = makeToonMat(gradientMap, 0xb8362a);

  // 1. Human-Desk-Scale Oak Bookstand Plinth & Front Lip
  addPart(foundation, new THREE.BoxGeometry(10.8, 0.42, 4.8), walnutMat, [0, 0.21, 0]);
  addPart(foundation, new THREE.BoxGeometry(9.8, 0.44, 0.42), cedarMat, [0, 0.52, 1.85]);

  // 2. Large Angled Easel Backboard + Forest-Green Textbook + Open Spread
  const easelTilt = -0.44;
  const bookHolder = new THREE.Group();
  bookHolder.position.set(0, 3.25, -0.15);
  bookHolder.rotation.x = easelTilt;

  // Timber reading board + lower ledger bar
  addPart(bookHolder, new THREE.BoxGeometry(9.8, 5.8, 0.26), cedarMat, [0, 0, -0.18]);
  addPart(bookHolder, new THREE.BoxGeometry(10.0, 0.32, 0.68), walnutMat, [0, -2.78, 0.16]);
  // Two brass corner page-holder clips
  addPart(bookHolder, new THREE.BoxGeometry(0.55, 0.22, 0.32), brassMat, [-3.2, -2.65, 0.42]);
  addPart(bookHolder, new THREE.BoxGeometry(0.55, 0.22, 0.32), brassMat, [3.2, -2.65, 0.42]);

  // Cloth hardcover spine/covers + thick cream pages
  addPart(bookHolder, new THREE.BoxGeometry(9.0, 5.2, 0.22), clothCoverMat, [0, 0.05, 0.02]);
  addPart(bookHolder, new THREE.BoxGeometry(8.65, 4.9, 0.28), paperStackMat, [0, 0.05, 0.16]);

  // Crisp High-DPI Open 2-Page Spread Plane
  const bookTex = createBookSpreadTexture();
  const spreadMat = new THREE.MeshBasicMaterial({ map: bookTex });
  const spreadPlane = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.8), spreadMat);
  spreadPlane.position.set(0, 0.05, 0.31);
  bookHolder.add(spreadPlane);

  // Crimson silk bookmark ribbon draped over lower lip
  addPart(bookHolder, new THREE.BoxGeometry(0.24, 2.2, 0.05), crimsonRibbonMat, [0.45, -1.95, 0.34], [0.2, 0, 0]);
  structure.add(bookHolder);

  // Easel rear A-frame support strut
  addPart(structure, new THREE.BoxGeometry(1.4, 4.2, 0.28), walnutMat, [0, 2.0, -1.65], [0.44, 0, 0]);

  // 3. Real-Scale Stacked Field Notebooks, Pen & Flush Rail Plaque
  addPart(props, new THREE.BoxGeometry(2.1, 0.24, 1.55), clothCoverMat, [-6.4, 0.12, 0.85], [0, 0.22, 0]);
  addPart(props, new THREE.BoxGeometry(1.95, 0.2, 1.42), paperStackMat, [-6.34, 0.32, 0.85], [0, 0.08, 0]);
  addPart(props, new THREE.CylinderGeometry(0.07, 0.07, 1.65, 8), brassMat, [-5.9, 0.46, 0.9], [Math.PI / 2, 0, 0.65]);

  const flushPlaque = createFlushPlaque('건축 AI 교재 · 강의', 'BOOK-01', '#2E5A44', walnutMat, brassMat, 3.6, 0.98, true);
  flushPlaque.position.set(0, 3.32, 0.08);
  bookHolder.add(flushPlaque);

  tagStopHierarchy(root, 'bookstand');

  return {
    rig: { root, foundation, structure, roof, props, glowMaterials: [] },
    bookTex,
  };
}

function addRodBetween(
  parent: THREE.Object3D,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  radiusTop: number,
  radiusBot: number,
  mat: THREE.Material,
  radialSegments = 12
): THREE.Mesh {
  const dir = p2.clone().sub(p1);
  const len = dir.length();
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBot, len, radialSegments),
    mat
  );
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createSoftLightVolumeMaterial(
  colorHex: number,
  fresnelPower = 2.4,
  axialPower = 2.15,
  useGroundFade = true
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 0 },
      uFresnelPower: { value: fresnelPower },
      uAxialPower: { value: axialPower },
      uUseGroundFade: { value: useGroundFade ? 1.0 : 0.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vNormalView = normalMatrix * normal;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mvPos.xyz;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uFresnelPower;
      uniform float uAxialPower;
      uniform float uUseGroundFade;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      varying vec3 vWorldPos;

      void main() {
        float distFromMouth = 1.0 - vUv.y;
        float mouthFadeIn = smoothstep(0.0, 0.16, distFromMouth);
        float farFadeOut = pow(clamp(1.0 - distFromMouth, 0.0, 1.0), uAxialPower);
        vec3 n = normalize(vNormalView);
        vec3 v = normalize(-vViewPos);
        float edgeFeather = pow(abs(dot(n, v)), uFresnelPower);
        float groundFeather = mix(1.0, smoothstep(-0.2, 1.35, vWorldPos.y), uUseGroundFade);
        float alpha = uOpacity * mouthFadeIn * farFadeOut * edgeFeather * groundFeather;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function createRadialGlowMaterial(colorHex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vNormalView = normalMatrix * normal;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        float rim = pow(max(0.0, dot(normalize(vNormalView), normalize(-vViewPos))), 3.1);
        gl_FragColor = vec4(uColor, uOpacity * rim);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

/**
 * Rear-Right Interactive Architect's Desk Lamp (조명 / 야간모드)
 * Built symmetrically on X = 0 (+Z = forward reach/aim), then angled inward across the desk.
 */
function buildDeskLamp(gradientMap: THREE.DataTexture): {
  lampRoot: THREE.Group;
  shadeGroup: THREE.Group;
  innerShadeMesh: THREE.Mesh;
  innerShadeMat: THREE.MeshToonMaterial;
  bulbMat: THREE.MeshToonMaterial;
  lampLight: THREE.PointLight;
  deskSpotLight: THREE.SpotLight;
  spotTarget: THREE.Object3D;
} {
  const lampRoot = new THREE.Group();
  lampRoot.position.set(14.2, 0, -13.4);
  lampRoot.rotation.y = -0.85;
  lampRoot.scale.setScalar(1.24);

  const brassMat = makeToonMat(gradientMap, 0xd8ad4a);
  const darkMetalMat = makeToonMat(gradientMap, 0x3b3530);
  const shadeGreenMat = makeToonMat(gradientMap, 0x244938);
  const innerShadeMat = makeToonMat(gradientMap, 0xfff2d2, {
    emissive: 0xffc65c,
    emissiveIntensity: 0.18,
  });
  innerShadeMat.side = THREE.BackSide;
  const bulbMat = makeToonMat(gradientMap, 0xfff5d6, { emissive: 0xffcf70, emissiveIntensity: 0.28 });

  // 1. Stepped weighted base + turret collar + rotary power switch
  addPart(lampRoot, new THREE.CylinderGeometry(1.38, 1.48, 0.24, 24), brassMat, [0, 0.12, 0]);
  addPart(lampRoot, new THREE.CylinderGeometry(1.12, 1.24, 0.2, 24), darkMetalMat, [0, 0.32, 0]);
  addPart(lampRoot, new THREE.CylinderGeometry(0.32, 0.4, 0.26, 16), brassMat, [0, 0.5, 0]);
  addPart(lampRoot, new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12), brassMat, [0, 0.45, 0.78]);

  // 2. Lower stem + rear tension rod leaning slightly back (-Z) to elbow knuckle J1
  const j0 = new THREE.Vector3(0, 0.56, 0);
  const j1 = new THREE.Vector3(0, 3.32, -0.76);
  addRodBetween(lampRoot, j0, j1, 0.14, 0.18, brassMat, 14);
  addRodBetween(
    lampRoot,
    new THREE.Vector3(0, 0.62, -0.22),
    new THREE.Vector3(0, 3.18, -0.96),
    0.052,
    0.052,
    darkMetalMat,
    10
  );
  addPart(lampRoot, new THREE.CylinderGeometry(0.23, 0.23, 0.36, 16), darkMetalMat, [0, 3.32, -0.76], [0, 0, Math.PI / 2]);
  addPart(lampRoot, new THREE.CylinderGeometry(0.13, 0.13, 0.46, 14), brassMat, [0, 3.32, -0.76], [0, 0, Math.PI / 2]);

  // 3. Twin upper swing-arm rods + rear counterweight reaching forward (+Z) to wrist swivel J2
  [-0.1, 0.1].forEach((rx) => {
    addRodBetween(
      lampRoot,
      new THREE.Vector3(rx, 3.05, -1.16),
      new THREE.Vector3(rx, 4.92, 1.56),
      0.072,
      0.082,
      brassMat,
      12
    );
  });
  addPart(lampRoot, new THREE.CylinderGeometry(0.19, 0.19, 0.42, 14), darkMetalMat, [0, 3.05, -1.16], [0, 0, Math.PI / 2]);
  addPart(lampRoot, new THREE.BoxGeometry(0.3, 0.14, 0.16), darkMetalMat, [0, 4.12, 0.4]);
  addPart(lampRoot, new THREE.SphereGeometry(0.19, 14, 14), brassMat, [0, 4.92, 1.56]);

  // 4. Hollow open-ended enamel shade pitched forward-down (-0.84 rad around +X -> mouth toward +Z/-Y)
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(0, 4.92, 1.56);
  shadeGroup.rotation.x = -0.84;
  lampRoot.add(shadeGroup);

  addPart(shadeGroup, new THREE.CylinderGeometry(0.11, 0.14, 0.24, 14), brassMat, [0, -0.1, 0]);
  addPart(shadeGroup, new THREE.CylinderGeometry(0.28, 0.42, 0.36, 20), brassMat, [0, -0.34, 0]);
  addPart(shadeGroup, new THREE.BoxGeometry(0.34, 0.07, 0.13), brassMat, [0.32, -0.32, 0]);
  addPart(shadeGroup, new THREE.CylinderGeometry(0.41, 0.44, 0.08, 24), shadeGreenMat, [0, -0.5, 0]);
  addPart(shadeGroup, new THREE.CylinderGeometry(0.43, 1.24, 1.08, 28, 1, true), shadeGreenMat, [0, -1.04, 0]);

  const innerShadeMesh = addPart(
    shadeGroup,
    new THREE.CylinderGeometry(0.415, 1.22, 1.06, 28, 1, true),
    innerShadeMat,
    [0, -1.04, 0]
  );
  innerShadeMesh.castShadow = false;
  innerShadeMesh.receiveShadow = false;

  const brassRim = addPart(
    shadeGroup,
    new THREE.TorusGeometry(1.235, 0.045, 10, 28),
    brassMat,
    [0, -1.58, 0],
    [Math.PI / 2, 0, 0]
  );
  brassRim.castShadow = false;

  // Recessed warm frosted bulb inside open shade cavity
  const bulbMesh = addPart(shadeGroup, new THREE.SphereGeometry(0.33, 16, 16), bulbMat, [0, -0.86, 0]);
  bulbMesh.castShadow = false;

  // 5. Illumination rig mounted at the shade opening
  const lampLight = new THREE.PointLight(0xffcf70, 0.15, 30, 1.35);
  lampLight.position.set(0, -1.05, 0);
  shadeGroup.add(lampLight);

  const spotTarget = new THREE.Object3D();
  const deskSpotLight = new THREE.SpotLight(0xffca68, 0, 54, 1.04, 0.92, 1.1);
  deskSpotLight.position.set(0, -0.95, 0);
  deskSpotLight.castShadow = false;
  deskSpotLight.target = spotTarget;
  shadeGroup.add(deskSpotLight);

  tagLampHierarchy(lampRoot);
  return {
    lampRoot,
    shadeGroup,
    innerShadeMesh,
    innerShadeMat,
    bulbMat,
    lampLight,
    deskSpotLight,
    spotTarget,
  };
}

/**
 * Expanded 40x28 Oak Studio Desk, 28x19 Unrolling/Fading Ground Shader (U-Loop Road),
 * Perimeter Landscaping, Stop 07 Bookstand & Milestone 3 Cabinet Silhouette.
 */
export function buildSurroundingAtelier(gradientMap: THREE.DataTexture): StudioContextResult {
  const group = new THREE.Group();
  const lampBulbs: THREE.MeshToonMaterial[] = [];
  const lampLights: THREE.PointLight[] = [];

  const oakTableMat = makeToonMat(gradientMap, 0xc39666);
  const oakEdgeMat = makeToonMat(gradientMap, 0x9b6e44);
  const brassMat = makeToonMat(gradientMap, 0xe4b855);
  const paperRulerMat = makeToonMat(gradientMap, 0xf2e7d2);
  const cedarMat = makeToonMat(gradientMap, 0xb88656);
  const darkInkMat = makeToonMat(gradientMap, 0x2e241d);

  // 0. Studio Room Floor & Warm Plaster Back Wall
  const studioFloorMat = makeToonMat(gradientMap, 0xe4dac8);
  const studioFloor = new THREE.Mesh(new THREE.PlaneGeometry(160, 120), studioFloorMat);
  studioFloor.rotation.x = -Math.PI / 2;
  studioFloor.position.y = -13.5;
  studioFloor.receiveShadow = true;
  group.add(studioFloor);

  const wallMat = makeToonMat(gradientMap, 0xefe7d8);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(140, 58, 0.8), wallMat);
  backWall.position.set(1.5, 16.0, -20.4);
  backWall.castShadow = false;
  backWall.receiveShadow = true;
  group.add(backWall);
  addPart(group, new THREE.BoxGeometry(140, 0.9, 0.3), oakEdgeMat, [1.5, -13.05, -19.9]);

  // 1. 4-Legged Wooden Architect's Desk (34.8 x 29.8 centered at [0, -0.45, -2.7], top y = 0)
  addPart(group, new THREE.BoxGeometry(34.8, 0.9, 29.8), oakTableMat, [0, -0.45, -2.7]);
  // Under-desk aprons
  addPart(group, new THREE.BoxGeometry(31.6, 1.35, 0.7), oakEdgeMat, [0, -1.55, 10.5]);
  addPart(group, new THREE.BoxGeometry(31.6, 1.35, 0.7), oakEdgeMat, [0, -1.55, -15.9]);
  addPart(group, new THREE.BoxGeometry(0.7, 1.35, 26.4), oakEdgeMat, [-15.6, -1.55, -2.7]);
  addPart(group, new THREE.BoxGeometry(0.7, 1.35, 26.4), oakEdgeMat, [15.6, -1.55, -2.7]);
  // 4 Solid Oak Legs reaching down to studio floor (y = -13.5)
  [
    [-15.6, 10.5],
    [15.6, 10.5],
    [-15.6, -15.9],
    [15.6, -15.9],
  ].forEach(([lx, lz]) => {
    addPart(group, new THREE.BoxGeometry(1.45, 13.0, 1.45), oakEdgeMat, [lx, -7.0, lz]);
  });

  // Raised oak perimeter trim framing the 30 x 21 central diorama pad (x in [-15, 15], z in [-10.5, 10.5])
  addPart(group, new THREE.BoxGeometry(31.1, 0.24, 0.55), oakEdgeMat, [0, 0.02, -10.78]);
  addPart(group, new THREE.BoxGeometry(31.1, 0.24, 0.55), oakEdgeMat, [0, 0.02, 10.78]);
  addPart(group, new THREE.BoxGeometry(0.55, 0.24, 21.0), oakEdgeMat, [-15.28, 0.02, 0]);
  addPart(group, new THREE.BoxGeometry(0.55, 0.24, 21.0), oakEdgeMat, [15.28, 0.02, 0]);

  [[-15.28, -10.78], [15.28, -10.78], [-15.28, 10.78], [15.28, 10.78]].forEach(([cx, cz]) => {
    addPart(group, new THREE.BoxGeometry(0.68, 0.26, 0.68), brassMat, [cx, 0.02, cz]);
  });

  // Human-Scale Architect Scale Ruler & Cedar Pencil on front-left desk surface (y = 0)
  addPart(group, new THREE.BoxGeometry(6.4, 0.12, 0.72), paperRulerMat, [-7.8, 0.06, 11.45], [0, 0.05, 0]);
  addPart(group, new THREE.CylinderGeometry(0.095, 0.095, 3.2, 8), cedarMat, [-3.2, 0.09, 11.25], [Math.PI / 2, 0, -0.42]);

  // 2. Vivid Blue 3D Rolled Blueprint Cylinder + Dual-State Ground Shader (30 x 21)
  const blueprintRoll = new THREE.Group();
  blueprintRoll.position.set(-14.5, 0.58, 0);
  const rollPaperMat = makeToonMat(gradientMap, 0x2b6cb0);
  addPart(blueprintRoll, new THREE.CylinderGeometry(0.58, 0.58, 21.08, 24), rollPaperMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addPart(blueprintRoll, new THREE.CylinderGeometry(0.38, 0.38, 21.14, 20), paperRulerMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  addPart(blueprintRoll, new THREE.CylinderGeometry(0.18, 0.18, 21.2, 16), darkInkMat, [0, 0, 0], [Math.PI / 2, 0, 0]);
  group.add(blueprintRoll);

  const blueprintTex = createBlueprintSiteTexture();
  const groundShaderUniforms = {
    uUnrollX: { value: -15.2 },
    uBlueprintOpacity: { value: 1.0 },
    uSiteReveal: { value: 0.0 },
    uNightFactor: { value: 0.0 },
  };

  const groundMat = new THREE.ShaderMaterial({
    uniforms: {
      tBlueprint: { value: blueprintTex },
      uUnrollX: groundShaderUniforms.uUnrollX,
      uBlueprintOpacity: groundShaderUniforms.uBlueprintOpacity,
      uSiteReveal: groundShaderUniforms.uSiteReveal,
      uNightFactor: groundShaderUniforms.uNightFactor,
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec2 vWorldXZ;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldXZ = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tBlueprint;
      uniform float uUnrollX;
      uniform float uBlueprintOpacity;
      uniform float uSiteReveal;
      uniform float uNightFactor;
      varying vec2 vUv;
      varying vec2 vWorldXZ;

      float distToSegment(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      void main() {
        vec3 bpCol = texture2D(tBlueprint, vUv).rgb;

        // Warm honey-oak drafting table planks underneath before site reveal
        vec3 woodDay = vec3(0.765, 0.588, 0.400);
        vec3 woodNight = vec3(0.28, 0.20, 0.14);
        vec3 woodCol = mix(woodDay, woodNight, uNightFactor);
        float plankTone = mod(floor(vWorldXZ.y * 0.65), 2.0);
        woodCol *= mix(1.0, 0.955, plankTone);
        float plankLine = smoothstep(0.03, 0.0, abs(fract(vWorldXZ.y * 0.65) - 0.5) - 0.485);
        woodCol *= mix(1.0, 0.86, plankLine);

        // Warm miniature garden lawn
        vec3 grassDay = vec3(0.735, 0.824, 0.585);
        vec3 grassNight = vec3(0.20, 0.25, 0.19);
        vec3 lawn = mix(grassDay, grassNight, uNightFactor);
        float checker = mod(floor(vWorldXZ.x * 0.72) + floor(vWorldXZ.y * 0.72), 2.0);
        lawn *= mix(1.0, 0.96, checker);

        // U-Loop Promenade & Central Courtyard Plaza connecting all 6 Plots
        float dPath = 999.0;
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(-11.8, 7.9), vec2(9.0, 7.9)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(9.0, 7.9), vec2(12.4, 3.8)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(12.4, 3.8), vec2(12.2, 0.1)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(12.2, 0.1), vec2(-11.6, 0.1)));

        // Spur access paths into each of the 6 buildings (at z = +4.8 / -4.8)
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(-9.0, 7.9), vec2(-9.0, 6.2)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(0.0, 7.9), vec2(0.0, 6.2)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(9.0, 7.9), vec2(9.0, 6.2)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(9.0, 0.1), vec2(9.0, -2.8)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(0.0, 0.1), vec2(0.0, -2.8)));
        dPath = min(dPath, distToSegment(vWorldXZ, vec2(-9.0, 0.1), vec2(-9.0, -2.8)));

        float dPlaza = length(vWorldXZ - vec2(0.0, 0.1)) - 1.65;
        float roadDist = min(dPath - 0.56, dPlaza);

        vec3 stoneDay = vec3(0.935, 0.896, 0.820);
        vec3 stoneNight = vec3(0.32, 0.28, 0.24);
        vec3 stoneCol = mix(stoneDay, stoneNight, uNightFactor);
        vec3 borderCol = mix(vec3(0.75, 0.68, 0.59), vec3(0.24, 0.20, 0.17), uNightFactor);

        float isRoad = 1.0 - smoothstep(-0.04, 0.04, roadDist);
        float isCurb = (1.0 - smoothstep(-0.04, 0.04, roadDist - 0.09)) * (1.0 - isRoad);

        vec3 siteCol = mix(lawn, borderCol, isCurb);
        siteCol = mix(siteCol, stoneCol, isRoad);

        vec3 underCol = mix(woodCol, siteCol, clamp(uSiteReveal, 0.0, 1.0));

        float unrolled = 1.0 - smoothstep(uUnrollX - 0.2, uUnrollX + 0.08, vWorldXZ.x);
        float rollShadow = (1.0 - smoothstep(0.0, 0.78, abs(vWorldXZ.x - uUnrollX))) * step(uUnrollX, 14.75) * step(0.05, uBlueprintOpacity);
        underCol *= mix(1.0, 0.78, rollShadow);

        float bpLuma = dot(bpCol, vec3(0.299, 0.587, 0.114));
        float isCadLine = smoothstep(0.34, 0.72, bpLuma);
        float sheetAlpha = unrolled * clamp(uBlueprintOpacity + isCadLine * 0.22 * step(0.02, uBlueprintOpacity), 0.0, 1.0);
        vec3 finalGround = mix(underCol, bpCol, sheetAlpha);

        vec2 lampRel = vWorldXZ - vec2(11.66, -11.17);
        float lampAlong = dot(lampRel, vec2(-0.751, 0.660));
        float lampAcross = dot(lampRel, vec2(0.660, 0.751));
        float lampHotspot = exp(-((lampAlong - 5.6) * (lampAlong - 5.6) / 28.0 + (lampAcross * lampAcross) / 18.0));
        float lampWash = exp(-((lampAlong - 11.2) * (lampAlong - 11.2) / 140.0 + (lampAcross * lampAcross) / 96.0));
        finalGround += (vec3(0.23, 0.15, 0.058) * lampHotspot + vec3(0.13, 0.088, 0.036) * lampWash) * uNightFactor;

        gl_FragColor = vec4(finalGround, 1.0);
      }
    `,
  });

  const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(30, 21, 1, 1), groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = 0.005;
  groundPlane.receiveShadow = true;
  group.add(groundPlane);

  // 3. Sightline-Safe Curated Miniature Trees & Streetlamps across 6-Building Promenade
  const treesGroup = new THREE.Group();
  const trunkMat = makeToonMat(gradientMap, 0x7a563a);
  const pineMat = makeToonMat(gradientMap, 0x456e52);
  const oliveMat = makeToonMat(gradientMap, 0x7c9d58);
  const autumnMat = makeToonMat(gradientMap, 0xd07747);
  const lampPostMat = makeToonMat(gradientMap, 0x3b3530);

  const treeSpecs = [
    { x: -13.2, z: 4.4, type: 'pine', s: 1.05 },
    { x: -13.2, z: -1.2, type: 'olive', s: 0.94 },
    { x: -13.1, z: -7.8, type: 'autumn', s: 0.96 },
    { x: -4.5, z: 4.4, type: 'olive', s: 0.88 },
    { x: 4.5, z: 4.4, type: 'pine', s: 0.9 },
    { x: -4.5, z: -5.2, type: 'pine', s: 1.02 },
    { x: 4.5, z: -5.2, type: 'autumn', s: 0.95 },
    { x: 13.1, z: -5.5, type: 'pine', s: 1.04 },
    { x: 13.3, z: 6.8, type: 'olive', s: 0.88 },
    { x: -12.2, z: 8.8, type: 'autumn', s: 0.82 },
    { x: -4.5, z: 8.8, type: 'pine', s: 0.84 },
    { x: 4.5, z: 8.8, type: 'olive', s: 0.8 },
  ] as const;

  treeSpecs.forEach((spec) => {
    const t = new THREE.Group();
    t.position.set(spec.x, 0, spec.z);
    t.scale.setScalar(spec.s);

    if (spec.type === 'pine') {
      addPart(t, new THREE.CylinderGeometry(0.07, 0.11, 0.55, 8), trunkMat, [0, 0.27, 0]);
      addPart(t, new THREE.ConeGeometry(0.56, 0.72, 9), pineMat, [0, 0.74, 0]);
      addPart(t, new THREE.ConeGeometry(0.42, 0.62, 9), pineMat, [0, 1.14, 0]);
      addPart(t, new THREE.ConeGeometry(0.26, 0.48, 9), pineMat, [0, 1.5, 0]);
    } else {
      const fMat = spec.type === 'autumn' ? autumnMat : oliveMat;
      addPart(t, new THREE.CylinderGeometry(0.065, 0.1, 0.7, 8), trunkMat, [0, 0.35, 0]);
      addPart(t, new THREE.IcosahedronGeometry(0.46, 1), fMat, [0, 0.98, 0]);
      addPart(t, new THREE.IcosahedronGeometry(0.32, 1), fMat, [0.24, 0.86, 0.12]);
      addPart(t, new THREE.IcosahedronGeometry(0.28, 1), fMat, [-0.22, 0.9, -0.14]);
    }
    treesGroup.add(t);
  });

  // Brass Streetlamps along Front Lane & Courtyard Promenade (clear of Stop 04/05/06 sightlines)
  [
    [-4.5, 6.8],
    [4.5, 6.8],
    [12.3, 1.8],
    [4.5, 0.3],
    [-4.5, 0.3],
  ].forEach(([lx, lz]) => {
    const post = new THREE.Group();
    post.position.set(lx, 0, lz);
    addPart(post, new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8), lampPostMat, [0, 0.06, 0]);
    addPart(post, new THREE.CylinderGeometry(0.025, 0.032, 0.96, 8), lampPostMat, [0, 0.54, 0]);
    const bulbMat = makeToonMat(gradientMap, 0xfff3c8, { emissive: 0xffc857, emissiveIntensity: 0.25 });
    lampBulbs.push(bulbMat);
    addPart(post, new THREE.SphereGeometry(0.09, 10, 10), bulbMat, [0, 1.04, 0]);
    addPart(post, new THREE.ConeGeometry(0.14, 0.08, 10), brassMat, [0, 1.13, 0]);

    const pt = new THREE.PointLight(0xffcb66, 0, 4.5, 1.8);
    pt.position.set(0, 1.0, 0);
    post.add(pt);
    lampLights.push(pt);
    treesGroup.add(post);
  });
  group.add(treesGroup);

  // 4. Desk-Rear Center Stop 07: Permanent Bookstand (독서대) + Rear-Right Interactive Desk Lamp (조명)
  const hideFromNormalPass: THREE.Object3D[] = [];
  const bookBuilt = buildBookstandStation(gradientMap);
  group.add(bookBuilt.rig.root);

  const lampBuilt = buildDeskLamp(gradientMap);
  hideFromNormalPass.push(lampBuilt.innerShadeMesh);
  group.add(lampBuilt.spotTarget);
  group.add(lampBuilt.lampRoot);

  // Align world-space SpotLight target & multi-layered soft illumination along open shade axis
  lampBuilt.lampRoot.updateMatrixWorld(true);
  const mouthStartWorld = lampBuilt.shadeGroup.localToWorld(new THREE.Vector3(0, -0.92, 0));
  const mouthRimWorld = lampBuilt.shadeGroup.localToWorld(new THREE.Vector3(0, -1.58, 0));
  const axisToBulbWorld = mouthStartWorld.clone().sub(mouthRimWorld).normalize();
  lampBuilt.spotTarget.position.copy(mouthRimWorld).addScaledVector(axisToBulbWorld, -10.5);

  const lampBounceLight = new THREE.PointLight(0xffbe66, 0, 24, 1.55);
  lampBounceLight.position.set(7.2, 2.5, -7.2);
  group.add(lampBounceLight);

  const beamQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axisToBulbWorld);

  const mouthHaloMat = createRadialGlowMaterial(0xffdf9a);
  const mouthHaloMesh = new THREE.Mesh(new THREE.SphereGeometry(0.96, 20, 20), mouthHaloMat);
  mouthHaloMesh.position.copy(mouthRimWorld).addScaledVector(axisToBulbWorld, 0.28);
  mouthHaloMesh.raycast = () => {};
  mouthHaloMesh.visible = false;
  group.add(mouthHaloMesh);

  const lampCoreHazeMat = createSoftLightVolumeMaterial(0xffcf75, 2.6, 2.25, true);
  const lampCoreHaze = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 3.2, 6.4, 36, 16, true), lampCoreHazeMat);
  lampCoreHaze.position.copy(mouthStartWorld).addScaledVector(axisToBulbWorld, -3.2);
  lampCoreHaze.quaternion.copy(beamQuat);
  lampCoreHaze.raycast = () => {};
  lampCoreHaze.visible = false;
  group.add(lampCoreHaze);

  const lampWideHazeMat = createSoftLightVolumeMaterial(0xffe0a6, 2.95, 2.45, true);
  const lampWideHaze = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 6.8, 12.6, 36, 16, true), lampWideHazeMat);
  lampWideHaze.position.copy(mouthStartWorld).addScaledVector(axisToBulbWorld, -6.3);
  lampWideHaze.quaternion.copy(beamQuat);
  lampWideHaze.raycast = () => {};
  lampWideHaze.visible = false;
  group.add(lampWideHaze);

  hideFromNormalPass.push(mouthHaloMesh, lampCoreHaze, lampWideHaze);

  const updateDeskLampLighting = (nightFactor: number) => {
    lampBuilt.deskSpotLight.intensity = THREE.MathUtils.lerp(0.0, 10.6, nightFactor);
    lampBuilt.bulbMat.emissiveIntensity = THREE.MathUtils.lerp(0.28, 2.3, nightFactor);
    lampBuilt.innerShadeMat.emissiveIntensity = THREE.MathUtils.lerp(0.18, 1.35, nightFactor);
    lampBuilt.lampLight.intensity = THREE.MathUtils.lerp(0.15, 2.7, nightFactor);
    lampBounceLight.intensity = THREE.MathUtils.lerp(0.0, 1.65, nightFactor);
    mouthHaloMat.uniforms.uOpacity.value = 0.22 * nightFactor;
    lampCoreHazeMat.uniforms.uOpacity.value = 0.082 * nightFactor;
    lampWideHazeMat.uniforms.uOpacity.value = 0.046 * nightFactor;
    const hazeVisible = nightFactor > 0.005;
    mouthHaloMesh.visible = hazeVisible;
    lampCoreHaze.visible = hazeVisible;
    lampWideHaze.visible = hazeVisible;
  };

  // 5. Back-Wall Architectural Pin-Up Corkboard (보드) positioned cleanly inside overview frustum
  const board = new THREE.Group();
  board.position.set(0, 13.0, -19.75);
  const corkMat = makeToonMat(gradientMap, 0xd8c3a5);
  const sheetMat = makeToonMat(gradientMap, 0xfaf4e6);
  const blueprintChipMat = makeToonMat(gradientMap, 0x1b4674);
  const pinMat = makeToonMat(gradientMap, 0xc24936);

  addPart(board, new THREE.BoxGeometry(28.6, 13.8, 0.5), oakEdgeMat, [0, 0, 0]);
  addPart(board, new THREE.BoxGeometry(27.4, 12.6, 0.32), corkMat, [0, 0, 0.14]);

  const pinSheets = [
    { x: -9.4, y: 2.65, rz: 0.02 },
    { x: -3.2, y: 2.65, rz: -0.02 },
    { x: 3.0, y: 2.65, rz: 0.01 },
    { x: 9.3, y: 2.65, rz: -0.24 }, // Top-right tilted pinned sheet matching user sketch
    { x: -7.6, y: -2.65, rz: -0.03 },
    { x: -0.6, y: -2.65, rz: 0.015 },
    { x: 6.5, y: -2.65, rz: 0.03 },
  ];
  pinSheets.forEach((s) => {
    const sheet = new THREE.Group();
    sheet.position.set(s.x, s.y, 0.44);
    sheet.rotation.z = s.rz;
    addPart(sheet, new THREE.BoxGeometry(4.5, 3.4, 0.14), sheetMat, [0, 0, 0]);

    const headerDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.42), blueprintChipMat);
    headerDecal.position.set(0, 0.92, 0.076);
    headerDecal.castShadow = false;
    sheet.add(headerDecal);

    const bodyDecal = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.35), corkMat);
    bodyDecal.position.set(-0.2, -0.35, 0.076);
    bodyDecal.castShadow = false;
    sheet.add(bodyDecal);

    hideFromNormalPass.push(headerDecal, bodyDecal);
    addPart(sheet, new THREE.SphereGeometry(0.24, 10, 10), pinMat, [0, 1.42, 0.16]);
    board.add(sheet);
  });
  tagStopHierarchy(board, 'board');
  group.add(board);

  // 6. Right-Side Open Museum Credenza & 3x3 Architectural Showcase Vitrine (장식장 · Stop 08)
  const cabinet = new THREE.Group();
  cabinet.position.set(29.0, -13.5, -4.4);
  cabinet.rotation.y = -0.18;
  const cabinetLinenMat = makeToonMat(gradientMap, 0xf5efe2);
  const darkBronzeMat = makeToonMat(gradientMap, 0x3b3129);

  // Base Plinth & Tall Lower Storage Credenza (y_local = 0 .. 8.8, raising lowest shelf to tabletop level)
  addPart(cabinet, new THREE.BoxGeometry(14.0, 1.0, 4.4), oakEdgeMat, [0, 0.5, 0]);
  addPart(cabinet, new THREE.BoxGeometry(13.8, 7.8, 4.15), oakEdgeMat, [0, 4.9, 0]);
  // 3 Flush Walnut Credenza Doors with Brass Bar Pulls on Lower Base
  [-4.42, 0.0, 4.42].forEach((dx) => {
    addPart(cabinet, new THREE.BoxGeometry(4.24, 6.9, 0.24), oakTableMat, [dx, 4.9, 2.04]);
    addPart(cabinet, new THREE.BoxGeometry(0.12, 1.25, 0.16), brassMat, [dx + (dx > 0 ? -1.65 : 1.65), 5.2, 2.22]);
  });

  // Open 3x3 Museum Gallery Vitrine Backboard & Narrow Side Trim Stiles (zero tunnel walls blocking 3/4 view)
  const noCastMeshes: THREE.Mesh[] = [];
  addPart(cabinet, new THREE.BoxGeometry(13.6, 14.0, 0.28), oakTableMat, [0, 15.7, -1.85]);
  const linenBackdrop = addPart(cabinet, new THREE.BoxGeometry(13.1, 13.6, 0.12), cabinetLinenMat, [0, 15.7, -1.66]);
  const leftStile = addPart(cabinet, new THREE.BoxGeometry(0.34, 14.0, 1.55), oakEdgeMat, [-6.68, 15.7, -1.2]);
  const rightStile = addPart(cabinet, new THREE.BoxGeometry(0.34, 14.0, 1.55), oakEdgeMat, [6.68, 15.7, -1.2]);
  noCastMeshes.push(linenBackdrop, leftStile, rightStile);

  // 4 Wide Open Display Shelves (y_local = 8.8 .. 22.6) + Brass Gallery Front Edge Trim
  const shelfRows = [18.0, 13.4, 8.8];
  const shelfCols = [-4.3, 0.0, 4.3];
  [8.8, 13.4, 18.0, 22.6].forEach((sy) => {
    const shelf = addPart(cabinet, new THREE.BoxGeometry(13.5, 0.28, 3.85), oakTableMat, [0, sy, 0.08]);
    const brassEdge = addPart(cabinet, new THREE.BoxGeometry(13.54, 0.1, 0.08), brassMat, [0, sy + 0.08, 2.02]);
    noCastMeshes.push(shelf, brassEdge);
  });

  // Slender Brass Vitrine Support Rods (replacing heavy divider walls so all 9 models stay wide open)
  [-6.45, -2.15, 2.15, 6.45].forEach((rx) => {
    [-1.35, 1.78].forEach((rz) => {
      const rod = addPart(cabinet, new THREE.CylinderGeometry(0.065, 0.065, 13.8, 10), brassMat, [rx, 15.7, rz]);
      noCastMeshes.push(rod);
    });
  });

  // Architectural Gallery Cornice Crown, Low-Slope Cap, Brass Finial & Enlarged Header Plaque
  addPart(cabinet, new THREE.BoxGeometry(14.1, 1.85, 4.15), oakEdgeMat, [0, 23.52, 0.08]);
  const cabHalfW = 7.25;
  const cabRidgeH = 1.55;
  const cabSlopeLen = Math.hypot(cabHalfW, cabRidgeH);
  const cabAngle = Math.atan2(cabRidgeH, cabHalfW);
  addPart(cabinet, new THREE.BoxGeometry(cabSlopeLen, 0.34, 4.35), oakEdgeMat, [-cabHalfW / 2, 24.45 + cabRidgeH / 2, 0.08], [0, 0, cabAngle]);
  addPart(cabinet, new THREE.BoxGeometry(cabSlopeLen, 0.34, 4.35), oakEdgeMat, [cabHalfW / 2, 24.45 + cabRidgeH / 2, 0.08], [0, 0, -cabAngle]);

  const cabPedimentShape = new THREE.Shape();
  cabPedimentShape.moveTo(-6.9, 0);
  cabPedimentShape.lineTo(6.9, 0);
  cabPedimentShape.lineTo(0, cabRidgeH - 0.15);
  cabPedimentShape.closePath();
  const cabPedGeo = new THREE.ExtrudeGeometry(cabPedimentShape, { depth: 3.9, bevelEnabled: false });
  cabPedGeo.translate(0, 24.45, -1.87);
  const cabPedMesh = new THREE.Mesh(cabPedGeo, oakTableMat);
  cabPedMesh.castShadow = true;
  cabPedMesh.receiveShadow = true;
  cabinet.add(cabPedMesh);
  addPart(cabinet, new THREE.SphereGeometry(0.32, 12, 12), brassMat, [0, 26.25, 0.08]);

  const cabPlaque = createFlushPlaque('대표 건축작 9선', 'ARC-01~09', '#7C5329', oakEdgeMat, brassMat, 6.4, 1.42, false);
  cabPlaque.position.set(0, 23.55, 2.22);
  cabinet.add(cabPlaque);

  // Three-Tier Gallery Fill Lights (keeping all 9 cubbies crisp & bright in overview)
  const cabinetShowcaseLights: THREE.PointLight[] = [];
  [20.4, 15.8, 11.2].forEach((ly) => {
    const pt = new THREE.PointLight(0xfff0d2, 1.05, 22, 1.15);
    pt.position.set(0, ly, 4.8);
    cabinet.add(pt);
    cabinetShowcaseLights.push(pt);
  });

  // Dedicated Museum Focus SpotLight + Cool Rim Light + Soft Downlight Cone Beam when zoomed on a single cubby
  const cubbySpotTarget = new THREE.Object3D();
  cubbySpotTarget.position.set(shelfCols[0], shelfRows[0] + 0.95, 0.24);
  cabinet.add(cubbySpotTarget);

  const cubbyFocusSpot = new THREE.SpotLight(0xfff2d2, 0, 16, 0.56, 0.54, 1.15);
  cubbyFocusSpot.position.set(shelfCols[0] + 1.1, shelfRows[0] + 4.35, 3.2);
  cubbyFocusSpot.castShadow = false;
  cubbyFocusSpot.target = cubbySpotTarget;
  cabinet.add(cubbyFocusSpot);

  const cubbyRimLight = new THREE.PointLight(0xd8ecff, 0, 8.5, 1.35);
  cubbyRimLight.position.set(shelfCols[0] - 1.35, shelfRows[0] + 2.1, 2.6);
  cabinet.add(cubbyRimLight);

  const cubbyBeamMat = createSoftLightVolumeMaterial(0xffe9a6, 2.35, 1.9, false);
  const cubbyBeamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 1.85, 4.15, 32, 12, true), cubbyBeamMat);
  cubbyBeamMesh.position.set(shelfCols[0], shelfRows[0] + 2.34, 0.26);
  cubbyBeamMesh.raycast = () => {};
  cubbyBeamMesh.visible = false;
  cabinet.add(cubbyBeamMesh);
  hideFromNormalPass.push(cubbyBeamMesh);

  // Tag outer frame with 'cabinet', then disable shadow-casting on open shelves & slender rods
  tagStopHierarchy(cabinet, 'cabinet');
  noCastMeshes.forEach((m) => {
    m.castShadow = false;
  });

  const padMats: THREE.MeshToonMaterial[] = [];
  const perCubbyGlowMats: THREE.MeshToonMaterial[][] = [];
  const puckMats: THREE.MeshToonMaterial[] = [];

  for (let idx = 0; idx < 9; idx += 1) {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const cx = shelfCols[col];
    const sy = shelfRows[row];

    const builtModel = buildPortfolioScaleModel(idx, gradientMap);
    const cubby = builtModel.group;
    cubby.scale.setScalar(1.22);
    cubby.position.set(cx, sy + 0.14, 0.24);
    padMats.push(builtModel.padMat);
    perCubbyGlowMats.push(builtModel.glowMaterials);

    cubby.traverse((child) => {
      child.userData.stopId = 'cabinet';
      child.userData.projectIndex = idx;
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    cabinet.add(cubby);

    // Physical Recessed Brass Gallery Downlight Puck in Ceiling Above Each Model
    const housing = addPart(cabinet, new THREE.CylinderGeometry(0.34, 0.34, 0.06, 16), darkBronzeMat, [cx, sy + 4.44, 0.28]);
    housing.castShadow = false;
    const puckMat = makeToonMat(gradientMap, 0xfff4d4, { emissive: 0xffd26e, emissiveIntensity: 0.35 });
    puckMats.push(puckMat);
    const disc = addPart(cabinet, new THREE.CylinderGeometry(0.24, 0.24, 0.07, 16), puckMat, [cx, sy + 4.41, 0.28]);
    disc.castShadow = false;

    // Front brass shelf spec nameplate aligned on gallery shelf rail
    const plate = addPart(cabinet, new THREE.BoxGeometry(2.1, 0.18, 0.1), brassMat, [cx, sy + 0.09, 2.07]);
    plate.castShadow = false;
  }

  const setHighlightedCubby = (activeIdx: number) => {
    padMats.forEach((m, i) => {
      const active = i === activeIdx;
      m.color.setHex(active ? 0xf2c464 : 0xe6d6bc);
      m.emissive.setHex(active ? 0xc48b20 : 0x000000);
      m.emissiveIntensity = active ? 0.35 : 0;
    });
  };
  setHighlightedCubby(0);

  const updateCabinetFocusLighting = (cubbyIdx: number, zoomFactor: number, nightFactor: number) => {
    const safeIdx = Math.max(0, Math.min(8, cubbyIdx));
    const row = Math.floor(safeIdx / 3);
    const col = safeIdx % 3;
    const cx = shelfCols[col];
    const sy = shelfRows[row];

    cubbyFocusSpot.position.set(cx + (col === 2 ? -1.1 : 1.1), sy + 4.35, 3.2);
    cubbySpotTarget.position.set(cx, sy + 0.95, 0.24);
    cubbyRimLight.position.set(cx + (col === 2 ? 1.35 : -1.35), sy + 2.1, 2.6);
    cubbyBeamMesh.position.set(cx, sy + 2.34, 0.26);
    cubbyBeamMesh.visible = zoomFactor > 0.01;

    cubbyFocusSpot.intensity = zoomFactor * THREE.MathUtils.lerp(9.8, 14.2, nightFactor);
    cubbyRimLight.intensity = zoomFactor * THREE.MathUtils.lerp(2.2, 3.2, nightFactor);
    cubbyBeamMat.uniforms.uOpacity.value = zoomFactor * THREE.MathUtils.lerp(0.13, 0.22, nightFactor);

    const showcaseDim = 1 - 0.42 * zoomFactor;
    const showcaseBase = THREE.MathUtils.lerp(1.05, 2.1, nightFactor) * showcaseDim;
    cabinetShowcaseLights.forEach((l) => {
      l.intensity = showcaseBase;
    });

    const basePuck = 0.35 + nightFactor * 0.65;
    puckMats.forEach((pm, i) => {
      pm.emissiveIntensity =
        i === safeIdx
          ? THREE.MathUtils.lerp(basePuck, 2.8, zoomFactor)
          : THREE.MathUtils.lerp(basePuck, 0.12, zoomFactor);
    });

    const baseGlow = THREE.MathUtils.lerp(0.14, 0.85, nightFactor);
    const boostGlow = THREE.MathUtils.lerp(0.92, 1.35, nightFactor);
    perCubbyGlowMats.forEach((mats, i) => {
      const targetIntensity = i === safeIdx ? Math.max(baseGlow, zoomFactor * boostGlow) : baseGlow;
      mats.forEach((gm) => {
        gm.emissiveIntensity = targetIntensity;
      });
    });
  };

  group.add(cabinet);
  cabinet.updateMatrixWorld(true);

  const getCabinetCameraPose = (zoomed: boolean, cubbyIdx: number) => {
    cabinet.updateMatrixWorld(true);
    if (!zoomed) {
      const worldPos = cabinet.localToWorld(new THREE.Vector3(-2.6, 15.8, 25.2));
      const worldLook = cabinet.localToWorld(new THREE.Vector3(0.4, 15.6, 0.2));
      return { pos: worldPos, lookAt: worldLook, focusPoint: worldLook.clone() };
    }
    const safeIdx = Math.max(0, Math.min(8, cubbyIdx));
    const row = Math.floor(safeIdx / 3);
    const col = safeIdx % 3;
    const cx = shelfCols[col];
    const sy = shelfRows[row];
    const dx = col === 0 ? 0.88 : col === 2 ? -0.88 : 0.68;
    const worldPos = cabinet.localToWorld(new THREE.Vector3(cx + dx, sy + 2.45, 5.45));
    const worldLook = cabinet.localToWorld(new THREE.Vector3(cx, sy + 1.15, 0.26));
    return { pos: worldPos, lookAt: worldLook, focusPoint: worldLook.clone() };
  };

  // Floating Sunlit Studio Dust Motes
  const moteCount = 52;
  const positions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.45) * 28;
    positions[i * 3 + 1] = 0.8 + Math.random() * 5.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const moteMat = new THREE.PointsMaterial({ color: 0xf4cc70, size: 0.08, transparent: true, opacity: 0.55 });
  const motes = new THREE.Points(moteGeo, moteMat);
  group.add(motes);
  hideFromNormalPass.push(motes);

  return {
    group,
    groundShaderUniforms,
    blueprintRoll,
    treesGroup,
    bookstandRig: bookBuilt.rig,
    deskLampRoot: lampBuilt.lampRoot,
    deskSpotLight: lampBuilt.deskSpotLight,
    updateDeskLampLighting,
    cabinetRoot: cabinet,
    boardRoot: board,
    setHighlightedCubby,
    updateCabinetFocusLighting,
    getCabinetCameraPose,
    lampBulbs,
    lampLights,
    motes,
    hideFromNormalPass,
    dispose: () => {
      blueprintTex.dispose();
      bookBuilt.bookTex.dispose();
    },
  };
}

import * as THREE from 'three';

const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const INK_DOF_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 uResolution;
uniform float uNear;
uniform float uFar;
uniform float uFocusDist;
uniform float uFocusRange;
uniform float uMaxBlur;
uniform vec3 uInkColor;
uniform float uNightFactor;

varying vec2 vUv;

float linearizeDepth(float d) {
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / max(uFar + uNear - z * (uFar - uNear), 0.0001);
}

float computeInkEdge(vec2 uv, vec2 texel, float dC, vec3 nC) {
  if (dC > uFar * 0.92) return 0.0;

  vec2 o1 = vec2(1.1, 0.0) * texel;
  vec2 o2 = vec2(0.0, 1.1) * texel;
  vec2 o3 = vec2(0.85, 0.85) * texel;
  vec2 o4 = vec2(-0.85, 0.85) * texel;

  float d1 = linearizeDepth(texture2D(tDepth, uv + o1).r);
  float d2 = linearizeDepth(texture2D(tDepth, uv - o1).r);
  float d3 = linearizeDepth(texture2D(tDepth, uv + o2).r);
  float d4 = linearizeDepth(texture2D(tDepth, uv - o2).r);

  float depthScale = max(dC * 0.032, 0.14);
  float dLap = abs((d1 + d2 + d3 + d4) - 4.0 * dC) / depthScale;
  float silhouetteDiff = max(max(abs(d1 - dC), abs(d2 - dC)), max(abs(d3 - dC), abs(d4 - dC))) / max(dC * 0.055, 0.22);
  float depthEdge = smoothstep(0.62, 1.45, max(dLap * 0.55, silhouetteDiff));

  vec3 n1 = texture2D(tNormal, uv + o3).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(tNormal, uv - o3).rgb * 2.0 - 1.0;
  vec3 n3 = texture2D(tNormal, uv + o4).rgb * 2.0 - 1.0;
  vec3 n4 = texture2D(tNormal, uv - o4).rgb * 2.0 - 1.0;

  float nDot = min(min(dot(nC, n1), dot(nC, n2)), min(dot(nC, n3), dot(nC, n4)));
  float normEdge = smoothstep(0.68, 0.34, nDot);

  float distFade = 1.0 - smoothstep(82.0, 120.0, dC);
  return clamp(max(depthEdge, normEdge * 0.85) * distFade, 0.0, 0.88);
}

void main() {
  vec2 texel = 1.0 / uResolution;
  float rawD = texture2D(tDepth, vUv).r;
  float dC = linearizeDepth(rawD);
  vec3 nC = normalize(texture2D(tNormal, vUv).rgb * 2.0 - 1.0);

  vec4 centerSample = texture2D(tColor, vUv);
  float centerInk = computeInkEdge(vUv, texel, dC, nC);
  vec3 baseInked = mix(centerSample.rgb, uInkColor, centerInk * mix(0.86, 0.72, uNightFactor));

  // Tilt-shift Golden Angle 12-tap Bokeh DoF
  float distFromFocus = abs(dC - uFocusDist);
  float coc = smoothstep(uFocusRange, uFocusRange + 9.5, distFromFocus);
  float blurRadius = coc * uMaxBlur;

  if (blurRadius < 0.35) {
    gl_FragColor = vec4(baseInked, 1.0);
    return;
  }

  vec3 accum = baseInked;
  float totalWeight = 1.0;
  const float GOLDEN_ANGLE = 2.39996323;

  for (int i = 1; i <= 12; i++) {
    float fi = float(i);
    float r = sqrt(fi / 12.0) * blurRadius;
    float angle = fi * GOLDEN_ANGLE;
    vec2 tapUv = clamp(vUv + vec2(cos(angle), sin(angle)) * texel * r, vec2(0.002), vec2(0.998));

    float dTap = linearizeDepth(texture2D(tDepth, tapUv).r);
    vec3 tapCol = texture2D(tColor, tapUv).rgb;

    // Prevent focused foreground silhouettes from bleeding harshly or softening near focus edge
    float fgGuard = (dTap < dC - 1.4 && coc < 0.35) ? 0.18 : 1.0;
    float tapCoc = smoothstep(uFocusRange * 0.5, uFocusRange + 8.0, abs(dTap - uFocusDist));
    float w = mix(0.35, 1.0, tapCoc) * fgGuard;

    accum += tapCol * w;
    totalWeight += w;
  }

  vec3 dofColor = accum / totalWeight;
  // Blend softly from crisp inked focal plane to bokeh background
  vec3 finalColor = mix(baseInked, dofColor, smoothstep(0.08, 0.55, coc));
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class InkDofPass {
  public enabled = true;
  private normalRT: THREE.WebGLRenderTarget;
  private colorRT: THREE.WebGLRenderTarget;
  private normalMat: THREE.MeshNormalMaterial;
  private quadScene: THREE.Scene;
  private quadCam: THREE.OrthographicCamera;
  private quadMat: THREE.ShaderMaterial;
  private width = 1;
  private height = 1;

  constructor(width: number, height: number, dpr: number, isWebGL2: boolean) {
    this.width = Math.max(1, Math.floor(width * dpr));
    this.height = Math.max(1, Math.floor(height * dpr));

    const depthTex = new THREE.DepthTexture(this.width, this.height, THREE.UnsignedIntType);
    depthTex.format = THREE.DepthFormat;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.magFilter = THREE.NearestFilter;

    this.normalRT = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      depthTexture: depthTex,
      samples: 0,
    });

    this.colorRT = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.UnsignedByteType,
      samples: isWebGL2 ? 4 : 0,
    });

    this.normalMat = new THREE.MeshNormalMaterial();

    this.quadMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: INK_DOF_FRAG,
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: depthTex },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uNear: { value: 0.5 },
        uFar: { value: 110.0 },
        uFocusDist: { value: 16.0 },
        uFocusRange: { value: 5.5 },
        uMaxBlur: { value: 4.5 },
        uInkColor: { value: new THREE.Color(0x281e16) },
        uNightFactor: { value: 0 },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.quadScene = new THREE.Scene();
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quadScene.add(new THREE.Mesh(quadGeo, this.quadMat));
  }

  public setSize(width: number, height: number, dpr: number): void {
    const rw = Math.max(1, Math.floor(width * dpr));
    const rh = Math.max(1, Math.floor(height * dpr));
    if (rw === this.width && rh === this.height) return;
    this.width = rw;
    this.height = rh;

    this.normalRT.setSize(rw, rh);
    this.colorRT.setSize(rw, rh);
    this.quadMat.uniforms.uResolution.value.set(rw, rh);
  }

  public setFocus(near: number, far: number, focusDist: number, focusRange: number, maxBlur: number, nightFactor: number): void {
    this.quadMat.uniforms.uNear.value = near;
    this.quadMat.uniforms.uFar.value = far;
    this.quadMat.uniforms.uFocusDist.value = focusDist;
    this.quadMat.uniforms.uFocusRange.value = focusRange;
    this.quadMat.uniforms.uMaxBlur.value = maxBlur;
    this.quadMat.uniforms.uNightFactor.value = nightFactor;
  }

  public render(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    hideDuringNormalPass: THREE.Object3D[] = []
  ): void {
    if (!this.enabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    const prevBg = scene.background;
    const prevOverride = scene.overrideMaterial;
    const prevVisible = hideDuringNormalPass.map((obj) => obj.visible);
    hideDuringNormalPass.forEach((obj) => {
      obj.visible = false;
    });

    // Pass 1: Normals + Depth (clear bg to neutral normal away from geometry)
    scene.background = null;
    scene.overrideMaterial = this.normalMat;
    renderer.setRenderTarget(this.normalRT);
    renderer.setClearColor(0x8080ff, 1);
    renderer.clear();
    renderer.render(scene, camera);

    // Pass 2: Full Lit Toon + Soft Shadows into MSAA color target
    hideDuringNormalPass.forEach((obj, idx) => {
      obj.visible = prevVisible[idx];
    });
    scene.overrideMaterial = prevOverride;
    scene.background = prevBg;
    renderer.setRenderTarget(this.colorRT);
    renderer.clear();
    renderer.render(scene, camera);

    // Pass 3: Screen-space Espresso Ink Edges + Bokeh DoF composite
    renderer.setRenderTarget(null);
    renderer.render(this.quadScene, this.quadCam);
  }

  public dispose(): void {
    this.normalRT.depthTexture?.dispose();
    this.normalRT.dispose();
    this.colorRT.dispose();
    this.normalMat.dispose();
    this.quadMat.dispose();
  }
}

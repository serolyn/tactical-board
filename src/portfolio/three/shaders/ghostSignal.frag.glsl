uniform float uTime;
uniform float uLayer;
uniform float uOpacity;
uniform float uSignal;
uniform vec3 uBlue;
uniform vec3 uViolet;
uniform vec3 uEmber;

varying vec2 vUv;
varying float vWave;
varying float vDepth;

void main() {
  float sideFade = smoothstep(0.0, 0.16, vUv.x) * smoothstep(0.0, 0.16, 1.0 - vUv.x);
  float endFade = smoothstep(0.0, 0.10, vUv.y) * smoothstep(0.0, 0.14, 1.0 - vUv.y);
  float shiftingBand = 0.5 + 0.5 * sin(vUv.y * 8.0 - uTime * 0.34 + vWave * 2.2);
  float glassThread = pow(0.5 + 0.5 * sin(vUv.x * 24.0 + vWave * 3.0), 12.0);
  float longVein = pow(
    0.5 + 0.5 * sin(vUv.y * 13.0 + vUv.x * 4.2 - uTime * 0.18 + vWave),
    18.0
  );
  float depthLight = smoothstep(-0.18, 0.22, vDepth);

  vec3 blueViolet = mix(uBlue, uViolet, clamp(vUv.y * 0.58 + shiftingBand * 0.34, 0.0, 1.0));
  blueViolet += vec3(0.07, 0.09, 0.15) * depthLight;

  // One restrained ember travels through the material during the shared long cycle.
  vec2 emberCenter = vec2(0.64 + sin(uTime * 0.21) * 0.08, 0.58);
  float emberDistance = length((vUv - emberCenter) * vec2(1.45, 1.0));
  float ember = (1.0 - smoothstep(0.0, 0.19, emberDistance)) * uSignal;
  vec3 color = mix(blueViolet, uEmber, ember * 0.86);

  float alpha = (0.19 + shiftingBand * 0.16 + glassThread * 0.14 + longVein * 0.1 + ember * 0.22)
    * sideFade
    * endFade
    * uOpacity;

  gl_FragColor = vec4(color, alpha);
}

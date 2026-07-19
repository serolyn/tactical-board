uniform float uTime;
uniform float uLayer;
uniform float uQuality;
uniform vec2 uPointer;

varying vec2 vUv;
varying float vWave;
varying float vDepth;

void main() {
  vUv = uv;

  // Several low-frequency waves keep the membrane organic without looking liquid.
  float breath = uTime * 0.39;
  float broadWave = sin(position.y * 1.35 + breath + uLayer * 1.17);
  float crossWave = sin(position.x * 2.15 - breath * 0.73 + position.y * 0.38);
  float fineWave = sin((position.x + position.y) * 3.45 + breath * 0.41);
  float edgeRestraint = 0.42 + sin(uv.x * 3.14159265) * 0.58;

  vec3 transformed = position;
  float verticalTaper = 0.72 + sin(uv.y * 3.14159265) * 0.28;
  transformed.x *= verticalTaper;
  float displacement = (broadWave * 0.12 + crossWave * 0.065 + fineWave * 0.025)
    * edgeRestraint
    * mix(0.72, 1.0, uQuality);

  transformed.z += displacement;
  transformed.x += broadWave * 0.075 + sin(position.y * 0.72 - breath * 0.24) * 0.055
    + uPointer.x * 0.035;
  transformed.y += crossWave * 0.018 + uPointer.y * 0.025;

  vWave = broadWave * 0.5 + crossWave * 0.32 + fineWave * 0.18;
  vDepth = transformed.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}

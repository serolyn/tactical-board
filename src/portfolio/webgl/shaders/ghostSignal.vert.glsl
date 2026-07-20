uniform float uTime;
uniform float uLayer;
uniform float uQuality;
uniform vec2 uPointer;
uniform float uScroll;

varying vec2 vUv;
varying vec3 vLocalPosition;
varying vec3 vViewPosition;
varying float vRidge;
varying float vVertical;

const float PI = 3.14159265359;

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

void main() {
  float vertical = clamp(position.y / 4.25 + 0.5, 0.0, 1.0);
  float centeredY = vertical * 2.0 - 1.0;
  float angle = atan(position.z, position.x);
  float slowTime = uTime * 0.16;

  // Le cylindre fermé devient un éclat spectral asymétrique, effilé et torsadé.
  // La déformation conserve de vraies faces avant, arrière et latérales.
  float taper = 0.34 + pow(max(0.0, sin(vertical * PI)), 0.62) * 0.78;
  float angularLobes = 1.0
    + sin(angle * 3.0 + centeredY * 1.8 + uLayer * 0.7) * 0.16
    + sin(angle * 5.0 - centeredY * 2.7) * 0.075;
  float breathing = 1.0 + sin(slowTime * 1.4 + centeredY * 2.1 + uLayer) * 0.025;

  vec3 transformed = position;
  transformed.xz *= taper * angularLobes * breathing;
  transformed.z *= 0.72;

  float twist = centeredY * 0.58
    + sin(slowTime + centeredY * 2.4 + uLayer * 0.45) * 0.075;
  transformed.xz = rotate2d(twist) * transformed.xz;

  float broadFold = sin(centeredY * 4.15 - slowTime * 1.25 + angle * 1.7);
  float opposingFold = sin(centeredY * 6.2 + slowTime * 0.72 - angle * 2.15);
  float detail = mix(0.45, 1.0, uQuality);
  transformed.x += sin(centeredY * 2.75 + slowTime + uLayer * 0.6) * 0.18
    + centeredY * 0.11
    + broadFold * 0.045 * detail;
  transformed.z += broadFold * 0.11 + opposingFold * 0.035 * detail;
  transformed += normal * (broadFold * 0.028 + opposingFold * 0.012) * detail;

  // Le pointeur et le début du défilement modifient le pli interne et le rig externe.
  transformed.x += uPointer.x * (0.025 + uLayer * 0.012);
  transformed.z += (uPointer.y * 0.035 + uScroll * 0.055) * (0.5 + vertical * 0.5);

  vUv = uv;
  vLocalPosition = transformed;
  vRidge = broadFold * 0.65 + opposingFold * 0.35;
  vVertical = vertical;

  vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
  vViewPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}

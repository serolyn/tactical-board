uniform float uTime;
uniform float uLayer;
uniform float uMode;
uniform float uOpacity;
uniform float uSignal;
uniform vec2 uPointer;
uniform float uScroll;
uniform vec3 uBlue;
uniform vec3 uViolet;
uniform vec3 uEmber;

varying vec2 vUv;
varying vec3 vLocalPosition;
varying vec3 vViewPosition;
varying float vRidge;
varying float vVertical;

const float PI = 3.14159265359;

void main() {
  // Derivatives reconstruct the normal after vertex deformation, so highlights
  // describe the real folded volume instead of painting bands in UV space.
  vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
  if (!gl_FrontFacing) normal *= -1.0;
  vec3 viewDirection = normalize(-vViewPosition);
  vec3 lightDirection = normalize(vec3(
    -0.48 + uPointer.x * 0.2,
    0.38 + uPointer.y * 0.16 - uScroll * 0.08,
    0.82
  ));

  float diffuse = max(dot(normal, lightDirection), 0.0);
  float opposingLight = max(dot(normal, normalize(vec3(0.62, -0.18, 0.42))), 0.0);
  float rim = pow(1.0 - abs(dot(normal, viewDirection)), 1.72);
  float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 30.0);
  float verticalBand = 0.5 + 0.5 * sin(vVertical * 17.0 - uTime * 0.23 + vRidge * 2.8);
  float fineVein = pow(0.5 + 0.5 * sin(
    vLocalPosition.y * 7.8 + vLocalPosition.x * 5.1 - uTime * 0.14 + vRidge
  ), 20.0);

  vec3 coldBody = mix(uBlue * 0.38, uViolet * 0.64, clamp(
    vVertical * 0.5 + opposingLight * 0.35 + verticalBand * 0.18,
    0.0,
    1.0
  ));

  // A permanent dark fissure acquires a travelling red core only during the
  // rare shared pulse near the end of the 16.2 second breathing cycle.
  float horizontal = vLocalPosition.x * 0.56 + 0.5;
  float crackCenter = 0.52
    + sin(vVertical * 18.0 + vRidge * 1.8) * 0.045
    + sin(vVertical * 43.0) * 0.012;
  float crackWidth = 0.012 + fwidth(horizontal) * 1.5;
  float crack = 1.0 - smoothstep(crackWidth, crackWidth * 2.7, abs(horizontal - crackCenter));
  float frontMask = smoothstep(-0.14, 0.26, vLocalPosition.z);
  crack *= frontMask * smoothstep(0.1, 0.2, vVertical) * smoothstep(0.08, 0.2, 1.0 - vVertical);

  float cycle = mod(uTime, 16.2) / 16.2;
  float travel = clamp((cycle - 0.68) / 0.16, 0.0, 1.0);
  float emberHead = exp(-pow((vVertical - mix(0.14, 0.9, travel)) * 8.0, 2.0));
  float ember = crack * uSignal * (0.24 + emberHead * 1.45);

  vec3 color;
  float alpha;

  if (uMode < 0.5) {
    // Opaque, almost-black inner mass provides silhouettes and true occultation.
    color = vec3(0.012, 0.016, 0.035);
    color += coldBody * (0.08 + diffuse * 0.2 + opposingLight * 0.08);
    color += uViolet * rim * 0.09 + uBlue * specular * 0.22;
    color = mix(color, vec3(0.002, 0.003, 0.009), crack * 0.82);
    color += uEmber * ember * 1.45;
    alpha = 1.0;
  } else if (uMode < 1.5) {
    // Back faces create a glassy interior visible through the front shell.
    color = coldBody * 0.65 + uViolet * rim * 0.7 + uBlue * fineVein * 0.18;
    color += uEmber * ember;
    alpha = (0.12 + rim * 0.38 + verticalBand * 0.055) * uOpacity;
  } else if (uMode < 2.5) {
    // Front shell carries the strong blue-violet contour and sharp specular edge.
    color = coldBody * (0.5 + diffuse * 0.34)
      + uBlue * rim * 1.28
      + uViolet * (specular * 1.2 + fineVein * 0.24);
    color = mix(color, uEmber, ember * 0.92);
    alpha = (0.2 + rim * 0.56 + specular * 0.24 + fineVein * 0.1 + ember * 0.22)
      * uOpacity;
  } else {
    // Echoes remain recognisable silhouettes but recede into atmospheric depth.
    color = mix(uBlue, uViolet, 0.55 + vRidge * 0.08) * (0.46 + rim * 0.52);
    alpha = (0.055 + rim * 0.16 + verticalBand * 0.025) * uOpacity;
  }

  gl_FragColor = vec4(color, alpha);
}

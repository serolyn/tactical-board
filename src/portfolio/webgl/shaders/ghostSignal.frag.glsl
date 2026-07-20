// Three injecte ce préambule au rendu ; ce repli sert aux validateurs du fichier isolé.
#ifndef SHADER_TYPE
#extension GL_OES_standard_derivatives : enable
precision highp float;
#endif

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
  // Les dérivées reconstruisent la normale après déformation des sommets : les
  // reflets décrivent ainsi le volume plié réel plutôt que des bandes UV.
  vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
  if (!gl_FrontFacing) normal *= -1.0;
  vec3 viewDirection = normalize(-vViewPosition);
  vec3 lightDirection = normalize(vec3(
    -0.48 + uPointer.x * 0.2,
    0.38 + uPointer.y * 0.16 - uScroll * 0.08,
    0.82
  ));

  float diffuse = clamp(
  dot(normal, lightDirection) * 0.45 + 0.55,
  0.0,
  1.0
);
  float opposingLight = max(dot(normal, normalize(vec3(0.62, -0.18, 0.42))), 0.0);
  float rim = pow(
  1.0 - abs(dot(normal, viewDirection)),
  2.6
);
  float specularBase = max(
    dot(reflect(-lightDirection, normal), viewDirection),
    0.0
  );
  float specular = pow(specularBase, 18.0) * 0.38;
  float verticalBand = 0.5 + 0.5 * sin(vVertical * 17.0 - uTime * 0.23 + vRidge * 2.8);
  float fineVein = pow(0.5 + 0.5 * sin(
    vLocalPosition.y * 7.8 + vLocalPosition.x * 5.1 - uTime * 0.14 + vRidge
  ), 20.0);

  vec3 coldBody = mix(uBlue * 0.18, uViolet * 0.44, clamp(
    vVertical * 0.5 + opposingLight * 0.35 + verticalBand * 0.18,
    0.0,
    1.0
  ));

  // La fissure sombre reçoit un cœur rouge mobile uniquement pendant la rare
  // impulsion commune, vers la fin du cycle respiratoire de 16,2 secondes.
  float horizontal = vLocalPosition.x * 0.56 + 0.5;

  // Bande centrale
  float crackCenter0 = 0.52
    + sin(vVertical * 18.0 + vRidge * 1.8) * 0.045
    + sin(vVertical * 43.0) * 0.012;

  float crackWidth0 = 0.012 + fwidth(horizontal) * 1.5;

  float crack0 = 1.0 - smoothstep(
    crackWidth0,
    crackWidth0 * 2.7,
    abs(horizontal - crackCenter0)
  );

  // Bande gauche
  float crackCenter1 = 0.34
    + sin(vVertical * 15.0 + vRidge * 1.4 + 1.3) * 0.03
    + sin(vVertical * 36.0 + 0.8) * 0.008;

  float crackWidth1 = 0.008 + fwidth(horizontal) * 1.5;

  float crack1 = 1.0 - smoothstep(
    crackWidth1,
    crackWidth1 * 2.7,
    abs(horizontal - crackCenter1)
  );

  // Bande droite
  float crackCenter2 = 0.68
    + sin(vVertical * 21.0 + vRidge * 1.6 - 1.1) * 0.035
    + sin(vVertical * 47.0 - 0.5) * 0.007;

  float crackWidth2 = 0.009 + fwidth(horizontal) * 1.5;

  float crack2 = 1.0 - smoothstep(
    crackWidth2,
    crackWidth2 * 2.7,
    abs(horizontal - crackCenter2)
  );

  // Réunion des trois bandes dans la variable utilisée par la suite du shader
  float crack = clamp(
    crack0
    + crack1 * 0.75
    + crack2 * 0.6,
    0.0,
    1.0
  );

  float frontMask = smoothstep(-0.14, 0.26, vLocalPosition.z);
  crack *= frontMask * smoothstep(0.1, 0.2, vVertical) * smoothstep(0.08, 0.2, 1.0 - vVertical);

  float cycle = mod(uTime, 16.2) / 16.2;
  float travel = clamp((cycle - 0.68) / 0.16, 0.0, 1.0);
  float emberHead = exp(-pow((vVertical - mix(0.14, 0.9, travel)) * 8.0, 2.0));
  float ember = crack * uSignal * (0.24 + emberHead * 1.45);

  vec3 color;
  float alpha;

  if (uMode < 0.5) {
    // La masse interne opaque et presque noire assure silhouette et occultation.
    color = vec3(0.0);
    color += coldBody * (0.02 + diffuse * 0.02 + opposingLight * 0.48);
    color += uViolet * rim * 0.04 + uBlue * specular * 0.22;
    color = mix(color, vec3(0.002, 0.003, 0.009), crack * 0.82);
    color += uEmber * ember * 1.45;
    alpha = 1.0;
  } else if (uMode < 1.5) {
    // Les faces arrière créent un intérieur vitreux visible à travers l'enveloppe.
    color = coldBody * 0.65 + uViolet * rim * 0.4 + uBlue * fineVein * 0.18;
    color += uEmber * ember;
    alpha = (0.12 + rim * 0.38 + verticalBand * 0.055) * uOpacity;
  } else if (uMode < 2.5) {
    // L'enveloppe avant porte le contour bleu-violet et l'arête spéculaire nette.
    color = coldBody * (0.58 + diffuse * 0.14)
      + uBlue * rim * 1.28
      + uViolet * (specular * 1.2 + fineVein * 0.24);
    color = mix(color, uEmber, ember * 0.92);
    alpha = (0.2 + rim * 0.22 + specular * 0.24 + fineVein * 0.1 + ember * 0.22)
      * uOpacity;
  } else {
    // Les échos restent reconnaissables tout en reculant dans la profondeur atmosphérique.
    color = mix(uBlue, uViolet, 0.55 + vRidge * 0.08) * (0.46 + rim * 0.52);
    alpha = (0.055 + rim * 0.16 + verticalBand * 0.025) * uOpacity;
  }

  gl_FragColor = vec4(color, alpha);
}

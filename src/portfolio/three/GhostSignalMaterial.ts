import {
  Color,
  DoubleSide,
  ShaderMaterial,
  Vector2,
  type IUniform,
} from 'three'
import fragmentShader from './shaders/ghostSignal.frag.glsl?raw'
import vertexShader from './shaders/ghostSignal.vert.glsl?raw'

export interface GhostSignalUniforms {
  readonly uTime: IUniform<number>
  readonly uLayer: IUniform<number>
  readonly uQuality: IUniform<number>
  readonly uPointer: IUniform<Vector2>
  readonly uOpacity: IUniform<number>
  readonly uSignal: IUniform<number>
  readonly uBlue: IUniform<Color>
  readonly uViolet: IUniform<Color>
  readonly uEmber: IUniform<Color>
  [uniform: string]: IUniform<unknown>
}
export type GhostSignalShaderMaterial = ShaderMaterial & {
  readonly uniforms: GhostSignalUniforms
}

export interface GhostSignalMaterialOptions {
  readonly layer: number
  readonly opacity: number
  readonly highQuality: boolean
}

export function createGhostSignalMaterial({
  layer,
  opacity,
  highQuality,
}: GhostSignalMaterialOptions): GhostSignalShaderMaterial {
  return new ShaderMaterial({
    name: `GhostSignalMaterial-${layer}`,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uLayer: { value: layer },
      uQuality: { value: highQuality ? 1 : 0 },
      uPointer: { value: new Vector2() },
      uOpacity: { value: opacity },
      uSignal: { value: 0 },
      uBlue: { value: new Color('#536bad') },
      uViolet: { value: new Color('#7766be') },
      uEmber: { value: new Color('#cf4b46') },
    },
  }) as GhostSignalShaderMaterial
}

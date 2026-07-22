import {
  BackSide,
  Color,
  FrontSide,
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
  readonly uMode: IUniform<number>
  readonly uPointer: IUniform<Vector2>
  readonly uScroll: IUniform<number>
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
  readonly mode: GhostSignalMaterialMode
  readonly layer: number
  readonly opacity: number
  readonly highQuality: boolean
}

export type GhostSignalMaterialMode = 'core' | 'back' | 'front' | 'echo'

const MATERIAL_MODES: Record<GhostSignalMaterialMode, number> = {
  core: 0,
  back: 1,
  front: 2,
  echo: 3,
}

/** Construit le matériau partagé par les différentes enveloppes du signal fantôme. */
export function createGhostSignalMaterial({
  mode,
  layer,
  opacity,
  highQuality,
}: GhostSignalMaterialOptions): GhostSignalShaderMaterial {
  const core = mode === 'core'
  return new ShaderMaterial({
    name: `GhostSignalMaterial-${mode}-${layer}`,
    vertexShader,
    fragmentShader,
    transparent: !core,
    depthWrite: core,
    depthTest: true,
    side: mode === 'back' ? BackSide : FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uLayer: { value: layer },
      uQuality: { value: highQuality ? 1 : 0 },
      uMode: { value: MATERIAL_MODES[mode] },
      uPointer: { value: new Vector2() },
      uScroll: { value: 0 },
      uOpacity: { value: opacity },
      uSignal: { value: 0 },
      uBlue: { value: new Color('#456fe8') },
      uViolet: { value: new Color('#9a79ef') },
      uEmber: { value: new Color('#f05a52') },
    },
  }) as GhostSignalShaderMaterial
}

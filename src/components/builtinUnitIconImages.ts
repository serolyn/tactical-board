import baseIconUrl from '../assets/base-icon-game.png'
import obstacleIconUrl from '../assets/obstacle-icon-game.png'

const BUILTIN_UNIT_ICON_IMAGES: Readonly<Record<string, string>> = Object.freeze({
  base: baseIconUrl,
  obstacle: obstacleIconUrl,
  'triangle-alert': obstacleIconUrl,
  warehouse: baseIconUrl,
})

export function resolveBuiltinUnitIconImage(iconKey: string): string | undefined {
  const normalized = iconKey.trim().toLowerCase().replaceAll('_', '-').replaceAll(' ', '-')
  return BUILTIN_UNIT_ICON_IMAGES[normalized]
}

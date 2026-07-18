import type { ComponentType, SVGProps } from 'react'
import {
  Castle,
  BrainCircuit,
  BriefcaseMedical,
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Crosshair,
  Crown,
  Flag,
  Plane,
  Puzzle,
  ShieldPlus,
  Ship,
  Shield,
  Sparkles,
  Target,
  TriangleAlert,
  UserRound,
  Warehouse,
  Wrench,
} from 'lucide-react'
import { resolveBuiltinUnitIconImage } from '../../components/builtinUnitIconImages'

type SvgComponent = ComponentType<SVGProps<SVGSVGElement>>

const ICONS: Record<string, SvgComponent> = {
  commander: Crown,
  crown: Crown,
  strategist: Sparkles,
  'brain-circuit': BrainCircuit,
  infantry: UserRound,
  shield: Shield,
  artillery: Crosshair,
  aircraft: Plane,
  airplane: Plane,
  ship: Ship,
  medic: ShieldPlus,
  'briefcase-medical': BriefcaseMedical,
  base: Warehouse,
  objective: Flag,
  target: Target,
  wrench: Wrench,
  'triangle-alert': TriangleAlert,
  puzzle: Puzzle,
  'chess-king': ChessKing,
  'chess-queen': ChessQueen,
  'chess-rook': ChessRook,
  'chess-bishop': ChessBishop,
  'chess-knight': ChessKnight,
  'chess-pawn': ChessPawn,
  castle: Castle,
}

function TankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 10.5h13.5l2.5 3v3H4z" />
      <path d="M8 10.5V7h6l2 3.5M14 8.5h7" />
      <circle cx="7" cy="18" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </svg>
  )
}

function CavalryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M7 20h11M8 20c0-4 1.5-5.5 4-7-2-1-3-2.8-2.6-5.2L13 4l1.2 3.1L18 9c.7 3.5-.7 6.2-4.4 7.5" />
      <path d="M14 9.5h.01" />
    </svg>
  )
}

function ArtilleryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="17" r="3" />
      <path d="m11 14 2-3 8-4M13 11l2 4M4 20h14" />
    </svg>
  )
}

export interface BuiltinIconProps {
  'aria-hidden'?: boolean
  className?: string
  iconKey: string
}

export function BuiltinIcon({ iconKey, ...props }: BuiltinIconProps) {
  const imageUrl = resolveBuiltinUnitIconImage(iconKey)
  if (imageUrl) {
    return <img alt="" draggable={false} src={imageUrl} {...props} />
  }
  if (iconKey === 'tank') return <TankIcon {...props} />
  if (iconKey === 'cavalry' || iconKey === 'horse') return <CavalryIcon {...props} />
  if (iconKey === 'artillery') return <ArtilleryIcon {...props} />
  const Icon = ICONS[iconKey] ?? Target
  return <Icon {...props} />
}

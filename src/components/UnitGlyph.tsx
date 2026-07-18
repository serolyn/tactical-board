import {
  Brain,
  BrainCircuit,
  BriefcaseMedical,
  Castle,
  ChessBishop,
  ChessKing,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Circle,
  CircleDot,
  Cross,
  Crosshair,
  Crown,
  Flag,
  HeartPulse,
  Plane,
  Puzzle,
  Shield,
  Ship,
  Sparkles,
  Swords,
  Target,
  TriangleAlert,
  Truck,
  UserRound,
  Warehouse,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import styles from './UnitGlyph.module.css'

const ICONS: Record<string, LucideIcon> = {
  aircraft: Plane,
  artillery: Crosshair,
  base: Castle,
  bishop: Cross,
  brain_circuit: BrainCircuit,
  briefcase_medical: BriefcaseMedical,
  cavalry: ChessKnight,
  chess_bishop: ChessBishop,
  chess_king: ChessKing,
  chess_knight: ChessKnight,
  chess_pawn: ChessPawn,
  chess_queen: ChessQueen,
  chess_rook: ChessRook,
  commander: Crown,
  crown: Crown,
  crosshair: Crosshair,
  flag: Flag,
  horse: ChessKnight,
  infantry: UserRound,
  king: Crown,
  knight: Swords,
  medic: HeartPulse,
  objective: Flag,
  pawn: CircleDot,
  queen: Sparkles,
  rook: Castle,
  ship: Ship,
  shield: Shield,
  soldier: Shield,
  strategist: Brain,
  tank: Truck,
  target: Target,
  triangle_alert: TriangleAlert,
  warehouse: Warehouse,
  wrench: Wrench,
  puzzle: Puzzle,
}

export interface UnitGlyphProps {
  alt?: string
  className?: string
  color?: string
  iconKey?: string
  imageUrl?: string
}

export function UnitGlyph({
  alt = '',
  className = '',
  color,
  iconKey = '',
  imageUrl,
}: UnitGlyphProps) {
  if (imageUrl) {
    return (
      <img
        alt={alt}
        className={`${styles.image} ${className}`}
        draggable={false}
        src={imageUrl}
      />
    )
  }

  const normalized = iconKey.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
  const Icon = ICONS[normalized] ?? Circle
  return (
    <Icon
      aria-hidden={alt ? undefined : 'true'}
      aria-label={alt || undefined}
      className={`${styles.icon} ${className}`}
      color={color}
      role={alt ? 'img' : undefined}
    />
  )
}

/**
 * @packageDocumentation
 * Modèle métier pur de Tactical Board.
 *
 * Ce dossier décrit les règles du jeu de données: documents, sélection,
 * historique, unités, campagnes et migrations. Il ne dépend pas de React.
 */

/** Catalogue immuable des types d'unités livrés avec l'application. */
import type { BuiltInUnitType, UnitType } from './tacticalBoardTypes'
/**
 * Cette fonction intervient sur le sujet “built In” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/unitCatalog.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord builtIn dans unitCatalog.ts.
 */


const builtIn = (
  id: string,
  name: string,
  category: string,
  defaultColor: string,
  iconName: string,
): BuiltInUnitType =>
  Object.freeze({
    id,
    name,
    category,
    defaultColor,
    icon: Object.freeze({ kind: 'catalog' as const, name: iconName }),
    builtin: true as const,
    archived: false as const,
  })

export const BUILT_IN_UNIT_TYPES: readonly BuiltInUnitType[] = Object.freeze([
  builtIn('commander', 'Commandant', 'Commandement', '#fbbf24', 'crown'),
  builtIn('strategist', 'Stratège', 'Commandement', '#c084fc', 'brain-circuit'),
  builtIn('infantry', 'Infanterie', 'Terrestre', '#94a3b8', 'shield'),
  builtIn('cavalry', 'Cavalier', 'Terrestre', '#a78bfa', 'horse'),
  builtIn('tank', 'Char', 'Terrestre', '#84cc16', 'tank'),
  builtIn('artillery', 'Artillerie', 'Terrestre', '#f97316', 'crosshair'),
  builtIn('aircraft', 'Avion', 'Aérien', '#38bdf8', 'plane'),
  builtIn('ship', 'Navire', 'Naval', '#22d3ee', 'ship'),
  builtIn('medic', 'Médecin', 'Soutien', '#4ade80', 'briefcase-medical'),
  builtIn('engineer', 'Ingénieur', 'Soutien', '#2dd4bf', 'wrench'),
  builtIn('base', 'Base', 'Infrastructure', '#d1d5db', 'warehouse'),
  builtIn('objective', 'Objectif', 'Mission', '#facc15', 'flag'),
  builtIn('fortress', 'Forteresse', 'Infrastructure', '#a8a29e', 'castle'),
  builtIn('obstacle', 'Obstacle', 'Infrastructure', '#f87171', 'triangle-alert'),
  builtIn('custom-piece', 'Pièce personnalisée', 'Personnalisé', '#cbd5e1', 'puzzle'),
  builtIn('chess-king', 'Roi', 'Échecs', '#f8fafc', 'chess-king'),
  builtIn('chess-queen', 'Reine', 'Échecs', '#f8fafc', 'chess-queen'),
  builtIn('chess-rook', 'Tour', 'Échecs', '#f8fafc', 'chess-rook'),
  builtIn('chess-bishop', 'Fou', 'Échecs', '#f8fafc', 'chess-bishop'),
  builtIn('chess-knight', 'Cavalier (échecs)', 'Échecs', '#f8fafc', 'chess-knight'),
  builtIn('chess-pawn', 'Pion', 'Échecs', '#f8fafc', 'chess-pawn'),
])

export const BUILT_IN_UNIT_TYPE_BY_ID: ReadonlyMap<string, BuiltInUnitType> = new Map(
  BUILT_IN_UNIT_TYPES.map((unitType) => [unitType.id, unitType]),
)
/**
 * Cette fonction intervient sur le sujet “find Unit Type” dans tactical-board.
 *
 * Fichier: src/tactical-board/model/unitCatalog.ts
 * Si tu lis ce fichier pour apprendre, regarde d’abord findUnitType dans unitCatalog.ts.
 */


export function findUnitType(
  typeId: string,
  customUnitTypes: readonly UnitType[],
): UnitType | undefined {
  return BUILT_IN_UNIT_TYPE_BY_ID.get(typeId) ?? customUnitTypes.find((unitType) => unitType.id === typeId)
}

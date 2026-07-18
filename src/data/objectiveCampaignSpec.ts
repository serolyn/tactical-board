export const OBJECTIVE_CAMPAIGN_VERSION = 2

export const OBJECTIVE_CAMPAIGN_NAME = 'L’objectif'
export const OBJECTIVE_CAMPAIGN_OBJECTIVE =
  'Commencer la L2 dans une ville viable avec inscription, logement, déménagement et situation financière suffisamment sécurisés.'

export const OBJECTIVE_CAMPAIGN_PERIOD = {
  start: '2026-07-18',
  current: '2026-07-18',
  target: '2026-09-01',
} as const

export type CampaignFactionRole =
  | 'own'
  | 'obstacle'
  | 'rally'
  | 'uncertain'
  | 'objective'

export interface CampaignUnitSpec {
  key: string
  name: string
  typeId: string
  factionRole: CampaignFactionRole
  row: number
  column: number
  status?: 'active' | 'wounded' | 'neutralized' | 'hidden' | 'destroyed'
}

export const OBJECTIVE_CAMPAIGN_UNITS: readonly CampaignUnitSpec[] = [
  { key: 'walid', name: 'Walid', typeId: 'commander', factionRole: 'own', row: 18, column: 1 },
  { key: 'results-l1', name: 'Résultats L1 — 14,5/20, 13e/130', typeId: 'tank', factionRole: 'own', row: 19, column: 0 },
  { key: 'projects', name: 'Projets — 20/20, 17/20, 16,5/20', typeId: 'artillery', factionRole: 'own', row: 17, column: 0 },
  { key: 'financial-reserve', name: 'Réserve financière — crédit étudiant', typeId: 'base', factionRole: 'own', row: 19, column: 2 },
  { key: 'lille-exemption-file', name: 'Dossier exonération Lille complet', typeId: 'artillery', factionRole: 'own', row: 17, column: 2 },
  { key: 'tax-file', name: 'Dossier fiscal reçu par le SIP', typeId: 'engineer', factionRole: 'own', row: 16, column: 1 },
  { key: 'residency', name: 'Situation de séjour favorable', typeId: 'base', factionRole: 'own', row: 19, column: 4 },
  { key: 'health', name: 'Santé et énergie', typeId: 'medic', factionRole: 'own', row: 18, column: 4, status: 'wounded' },
  { key: 'serolyn', name: 'Serolyn — musique', typeId: 'objective', factionRole: 'own', row: 17, column: 4 },

  { key: 'city-lille', name: 'Lille', typeId: 'fortress', factionRole: 'rally', row: 13, column: 5 },
  { key: 'city-strasbourg', name: 'Strasbourg', typeId: 'fortress', factionRole: 'rally', row: 10, column: 9 },
  { key: 'city-nantes', name: 'Nantes', typeId: 'base', factionRole: 'rally', row: 15, column: 9 },
  { key: 'city-bordeaux', name: 'Bordeaux', typeId: 'fortress', factionRole: 'rally', row: 13, column: 13 },
  { key: 'city-nice', name: 'Nice', typeId: 'base', factionRole: 'rally', row: 7, column: 14 },
  { key: 'city-marseille', name: 'Marseille Luminy', typeId: 'base', factionRole: 'rally', row: 9, column: 17 },
  { key: 'city-aix', name: 'Aix Montperrin', typeId: 'base', factionRole: 'rally', row: 12, column: 17 },

  { key: 'uncertain-paris-applied', name: 'Paris Cité — Informatique appliquée', typeId: 'fortress', factionRole: 'uncertain', row: 17, column: 12, status: 'hidden' },
  { key: 'uncertain-gustave', name: 'Gustave Eiffel', typeId: 'fortress', factionRole: 'uncertain', row: 18, column: 14, status: 'hidden' },
  { key: 'uncertain-tax-reply', name: 'Réponse fiscale du SIP', typeId: 'obstacle', factionRole: 'uncertain', row: 16, column: 7, status: 'hidden' },
  { key: 'lost-saclay', name: 'Paris-Saclay — capacité atteinte', typeId: 'fortress', factionRole: 'uncertain', row: 19, column: 13, status: 'destroyed' },
  { key: 'lost-paris-fundamental', name: 'Paris Cité — Informatique fondamentale', typeId: 'fortress', factionRole: 'uncertain', row: 19, column: 16, status: 'destroyed' },
  { key: 'lost-spn', name: 'Sorbonne Paris Nord', typeId: 'fortress', factionRole: 'uncertain', row: 19, column: 19, status: 'hidden' },

  { key: 'general-decision', name: 'Décision finale avant le 10 août', typeId: 'obstacle', factionRole: 'obstacle', row: 15, column: 3 },
  { key: 'general-fees', name: 'Risque de frais proches de 3 000 €', typeId: 'obstacle', factionRole: 'obstacle', row: 14, column: 8 },
  { key: 'general-income', name: 'Revenu actuel : 0 €', typeId: 'obstacle', factionRole: 'obstacle', row: 18, column: 7 },
  { key: 'general-caf', name: 'Fin des droits CAF/APL', typeId: 'obstacle', factionRole: 'obstacle', row: 18, column: 9 },
  { key: 'general-rent', name: 'Logement à 600 € maximum', typeId: 'obstacle', factionRole: 'obstacle', row: 16, column: 11 },
  { key: 'general-moving', name: 'Déménagement — six grandes valises', typeId: 'obstacle', factionRole: 'obstacle', row: 14, column: 3 },
  { key: 'general-registration', name: 'Inscription universitaire', typeId: 'obstacle', factionRole: 'obstacle', row: 12, column: 10 },
  { key: 'general-residence-card', name: 'Carte de séjour après le 7 août', typeId: 'obstacle', factionRole: 'obstacle', row: 16, column: 4 },
  { key: 'general-student-job', name: 'Trouver un emploi étudiant', typeId: 'obstacle', factionRole: 'obstacle', row: 15, column: 12 },
  { key: 'general-workload', name: 'Charge L2 + emploi', typeId: 'obstacle', factionRole: 'obstacle', row: 11, column: 12 },
  { key: 'general-anxiety', name: 'Anxiété et énergie', typeId: 'obstacle', factionRole: 'obstacle', row: 16, column: 0 },
  { key: 'general-music', name: 'Temps musical menacé', typeId: 'obstacle', factionRole: 'obstacle', row: 15, column: 0 },

  { key: 'lille-exemption', name: 'Exonération — décision du 21 juillet', typeId: 'obstacle', factionRole: 'obstacle', row: 13, column: 4 },
  { key: 'lille-housing', name: 'Logement', typeId: 'obstacle', factionRole: 'obstacle', row: 12, column: 5 },
  { key: 'lille-job', name: 'Emploi étudiant', typeId: 'obstacle', factionRole: 'obstacle', row: 14, column: 5 },
  { key: 'strasbourg-budget', name: 'Logement et budget à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 10, column: 8 },
  { key: 'strasbourg-moving', name: 'Logistique du déménagement', typeId: 'obstacle', factionRole: 'obstacle', row: 11, column: 9 },
  { key: 'nantes-budget', name: 'Logement et budget à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 15, column: 8 },
  { key: 'nantes-job', name: 'Emploi à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 14, column: 9 },
  { key: 'bordeaux-fees', name: 'Frais et paiement à sécuriser', typeId: 'obstacle', factionRole: 'obstacle', row: 13, column: 12 },
  { key: 'bordeaux-housing', name: 'Logement', typeId: 'obstacle', factionRole: 'obstacle', row: 14, column: 13 },
  { key: 'nice-housing', name: 'Coût du logement à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 7, column: 13 },
  { key: 'nice-distance', name: 'Éloignement et déménagement', typeId: 'obstacle', factionRole: 'obstacle', row: 8, column: 14 },
  { key: 'marseille-logistics', name: 'Logement et transport à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 9, column: 16 },
  { key: 'aix-logistics', name: 'Logement et emploi à évaluer', typeId: 'obstacle', factionRole: 'obstacle', row: 12, column: 16 },

  { key: 'final-objective', name: 'Départ en L2 stabilisé — septembre 2026', typeId: 'objective', factionRole: 'objective', row: 1, column: 18 },
]

export interface CampaignArrowSpec {
  key: string
  from: string
  to: string
  style: 'attack' | 'movement' | 'support'
  color: string
}

const route = (key: string, from: string, to: string): CampaignArrowSpec => ({
  key,
  from,
  to,
  style: 'movement',
  color: '#d4a72c',
})
const threat = (key: string, from: string, to: string): CampaignArrowSpec => ({
  key,
  from,
  to,
  style: 'attack',
  color: '#ef4444',
})
const support = (key: string, from: string, to: string): CampaignArrowSpec => ({
  key,
  from,
  to,
  style: 'support',
  color: '#3b82f6',
})

const cityKeys = [
  'city-lille',
  'city-strasbourg',
  'city-nantes',
  'city-bordeaux',
  'city-nice',
  'city-marseille',
  'city-aix',
] as const

export const OBJECTIVE_CAMPAIGN_ARROWS: readonly CampaignArrowSpec[] = [
  ...cityKeys.flatMap((city) => [
    route(`walid-${city}`, 'walid', city),
    route(`${city}-objective`, city, 'final-objective'),
  ]),
  support('results-walid', 'results-l1', 'walid'),
  support('projects-walid', 'projects', 'walid'),
  support('reserve-walid', 'financial-reserve', 'walid'),
  support('exemption-lille', 'lille-exemption-file', 'city-lille'),
  support('tax-walid', 'tax-file', 'walid'),
  support('residency-walid', 'residency', 'walid'),
  threat('lille-exemption-threat', 'lille-exemption', 'city-lille'),
  threat('lille-housing-threat', 'lille-housing', 'city-lille'),
  threat('lille-job-threat', 'lille-job', 'city-lille'),
  threat('strasbourg-budget-threat', 'strasbourg-budget', 'city-strasbourg'),
  threat('strasbourg-moving-threat', 'strasbourg-moving', 'city-strasbourg'),
  threat('nantes-budget-threat', 'nantes-budget', 'city-nantes'),
  threat('nantes-job-threat', 'nantes-job', 'city-nantes'),
  threat('bordeaux-fees-threat', 'bordeaux-fees', 'city-bordeaux'),
  threat('bordeaux-housing-threat', 'bordeaux-housing', 'city-bordeaux'),
  threat('nice-housing-threat', 'nice-housing', 'city-nice'),
  threat('nice-distance-threat', 'nice-distance', 'city-nice'),
  threat('marseille-logistics-threat', 'marseille-logistics', 'city-marseille'),
  threat('aix-logistics-threat', 'aix-logistics', 'city-aix'),
]

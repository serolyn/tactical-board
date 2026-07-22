export const OBJECTIVE_CAMPAIGN_VERSION = 3

export const OBJECTIVE_CAMPAIGN_NAME = 'L’objectif'
export const OBJECTIVE_CAMPAIGN_OBJECTIVE =
  'Conquérir une vie libre en France : autonomie financière, stabilité, études et création artistique préservée.'

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
  
/** Permet une représentation symbolique différente de l'icône du type. */
  iconName?: string
  factionRole: CampaignFactionRole
  row: number
  column: number
  status?: 'active' | 'wounded' | 'neutralized' | 'hidden' | 'destroyed'
}

/**
 * Deux campagnes partent de SEROLYN : la conquête matérielle au centre et la
 * protection de la citadelle artistique sur le flanc gauche. Elles convergent
 * vers LIBRE, sans saturer le plateau ni transformer la scène en planning.
 */
export const OBJECTIVE_CAMPAIGN_UNITS: readonly CampaignUnitSpec[] = [
  // Armée de départ — bas gauche.
  { key: 'serolyn', name: 'SEROLYN', typeId: 'commander', factionRole: 'own', row: 18, column: 3 },
  { key: 'code-ia', name: 'Code / IA', typeId: 'artillery', factionRole: 'own', row: 18, column: 5 },
  { key: 'musique', name: 'Musique', typeId: 'strategist', factionRole: 'own', row: 17, column: 2 },
  { key: 'health', name: 'Santé', typeId: 'medic', factionRole: 'own', row: 19, column: 2 },
  { key: 'dossier', name: 'Dossier', typeId: 'engineer', factionRole: 'own', row: 19, column: 4 },

  // Citadelle artistique — flanc gauche.
  { key: 'music-art', name: 'MUSIQUE & ART', typeId: 'fortress', factionRole: 'own', row: 10, column: 3 },
  { key: 'creation', name: 'Création', typeId: 'artillery', factionRole: 'own', row: 8, column: 2 },
  { key: 'published-work', name: 'EP / Œuvre publié', typeId: 'strategist', iconName: 'flag', factionRole: 'objective', row: 5, column: 5 },
  { key: 'identity-expression', name: 'Identité / Expression', typeId: 'infantry', factionRole: 'own', row: 11, column: 2 },

  // Forces qui assiègent la création.
  { key: 'lack-of-time', name: 'Manque de temps', typeId: 'artillery', factionRole: 'obstacle', row: 9, column: 0 },
  { key: 'fatigue', name: 'Fatigue', typeId: 'artillery', factionRole: 'obstacle', row: 8, column: 1 },
  { key: 'anxiety', name: 'Anxiété', typeId: 'obstacle', factionRole: 'obstacle', row: 11, column: 0 },
  { key: 'self-censorship', name: 'Autocensure', typeId: 'infantry', factionRole: 'obstacle', row: 12, column: 1 },

  // Campagne de Lille et progression universitaire.
  { key: 'lille', name: 'Lille', typeId: 'fortress', factionRole: 'rally', row: 11, column: 9 },
  { key: 'l2-admission', name: 'Admission L2', typeId: 'base', factionRole: 'own', row: 11, column: 8 },
  { key: 'exemption', name: 'Exonération', typeId: 'artillery', factionRole: 'rally', row: 12, column: 11 },
  { key: 'validated-l2', name: 'L2 Info validée', typeId: 'base', factionRole: 'objective', row: 7, column: 9 },

  // Front financier — droite du centre.
  { key: 'precarity', name: 'Précarité', typeId: 'commander', factionRole: 'obstacle', row: 15, column: 13 },
  { key: 'no-income', name: 'Sans revenu', typeId: 'fortress', factionRole: 'obstacle', row: 14, column: 14 },
  { key: 'university-fees', name: 'Frais universitaires', typeId: 'artillery', factionRole: 'obstacle', row: 13, column: 12 },
  { key: 'expenses-unexpected', name: 'Dépenses / Imprévus', typeId: 'artillery', factionRole: 'obstacle', row: 15, column: 15 },
  { key: 'financial-exhaustion', name: 'Épuisement financier', typeId: 'obstacle', factionRole: 'obstacle', row: 16, column: 12 },

  // Blocus administratif et immobilier — flanc droit.
  { key: 'housing', name: 'Logement', typeId: 'ship', factionRole: 'obstacle', row: 9, column: 16 },
  { key: 'moving', name: 'Déménagement', typeId: 'ship', factionRole: 'obstacle', row: 10, column: 17 },
  { key: 'papers-caf', name: 'Papiers / CAF', typeId: 'ship', factionRole: 'obstacle', row: 11, column: 16 },
  { key: 'isolation', name: 'Isolement', typeId: 'obstacle', factionRole: 'obstacle', row: 12, column: 18 },

  // Armées dorées à rallier, entre SEROLYN et Lille.
  { key: 'student-job', name: 'Job étudiant', typeId: 'commander', factionRole: 'rally', row: 17, column: 7 },
  { key: 'monthly-income-1', name: 'Revenu mensuel I', typeId: 'infantry', factionRole: 'rally', row: 15, column: 7 },
  { key: 'monthly-income-2', name: 'Revenu mensuel II', typeId: 'infantry', factionRole: 'rally', row: 18, column: 8 },
  { key: 'network', name: 'Réseau pro', typeId: 'ship', factionRole: 'rally', row: 15, column: 8 },
  { key: 'internship', name: 'Stage / Alternance', typeId: 'base', factionRole: 'rally', row: 17, column: 5 },
  { key: 'opportunity', name: 'Opportunité', typeId: 'aircraft', factionRole: 'rally', row: 18, column: 6 },
  { key: 'experience-skills', name: 'Expérience / Compétences', typeId: 'artillery', factionRole: 'rally', row: 16, column: 6 },

  // Horizon supérieur et forteresse commune aux deux campagnes.
  { key: 'master-ai', name: 'Master IA / Paris', typeId: 'fortress', factionRole: 'objective', row: 4, column: 10 },
  { key: 'public-recognition', name: 'Public / Reconnaissance', typeId: 'ship', factionRole: 'objective', row: 3, column: 7 },
  { key: 'free', name: 'LIBRE', typeId: 'objective', iconName: 'warehouse', factionRole: 'objective', row: 1, column: 10 },
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

const rallyAttack = (key: string, from: string, to: string): CampaignArrowSpec => ({
  key,
  from,
  to,
  style: 'attack',
  color: '#f59e0b',
})

const support = (key: string, from: string, to: string): CampaignArrowSpec => ({
  key,
  from,
  to,
  style: 'support',
  color: '#60a5fa',
})

/**
 * Douze flèches seulement. Le ralliement SEROLYN → Job étudiant est porté par
 * la proximité des formations afin de réserver deux flèches distinctes pour
 * la convergence matérielle et artistique sur LIBRE.
 */
export const OBJECTIVE_CAMPAIGN_ARROWS: readonly CampaignArrowSpec[] = [
  route('serolyn-lille', 'serolyn', 'lille'),
  support('serolyn-art', 'serolyn', 'music-art'),
  rallyAttack('job-finance', 'student-job', 'precarity'),
  rallyAttack('exemption-fees', 'exemption', 'university-fees'),
  threat('finance-lille', 'precarity', 'lille'),
  threat('blockade-lille', 'housing', 'lille'),
  threat('time-art', 'lack-of-time', 'music-art'),
  route('lille-l2', 'lille', 'validated-l2'),
  route('l2-master', 'validated-l2', 'master-ai'),
  support('art-work', 'music-art', 'published-work'),
  route('master-free', 'master-ai', 'free'),
  support('public-free', 'public-recognition', 'free'),
]

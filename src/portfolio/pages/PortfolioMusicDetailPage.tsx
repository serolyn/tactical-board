import type { ReactNode } from 'react'
import { useParams } from 'react-router'

import { EntryHero } from '../components/PortfolioEntryHero'
import { EntrySections } from '../components/PortfolioEntrySections'
import {
  getPublishedMusicBySlug,
  type MusicEntry,
} from '../content/portfolioContent'
import { NotFoundPage } from './PortfolioNotFoundPage'

/*
 * Type des informations reçues par MusicDetailView.
 * Cette vue attend obligatoirement une entrée musicale.
 */
type MusicDetailViewProps = {
  entry: MusicEntry
}

/*
 * Affiche le contenu complet d'une musique :
 * hero, animation éventuelle, lecteur audio et sections.
 */
export function MusicDetailView({ entry }: MusicDetailViewProps) {
  /*
   * Prépare l'image principale.
   * EntryHero attend soit une adresse d'image, soit undefined.
   */
  const artwork = entry.artwork ?? undefined

  /*
   * Prépare la durée affichée.
   */
  let duration: string

  if (entry.duration) {
    duration = entry.duration
  } else {
    duration = 'Non renseignée'
  }

  /*
   * Transforme les crédits en textes lisibles.
   *
   * Exemple :
   * { role: "Production", name: "SEROLYN" }
   * devient :
   * "Production — SEROLYN"
   */
  const formattedCredits = entry.credits.map((credit) => {
    return `${credit.role} — ${credit.name}`
  })

  let credits: string | string[]

  if (formattedCredits.length > 0) {
    credits = formattedCredits
  } else {
    credits = 'Non renseignés'
  }

  /*
   * Prépare le statut du lecteur audio.
   */
  let audioAvailability: string

  if (entry.audioSrc) {
    audioAvailability = 'Disponible'
  } else {
    audioAvailability = 'Non disponible'
  }

  /*
   * Prépare la scène animée.
   * Elle reste vide si aucune scène n'est associée à la musique.
   */
  let storyOverlay: ReactNode = null

  if (entry.storyOverlay) {
    const StoryOverlay = entry.storyOverlay
    storyOverlay = <StoryOverlay />
  }

  /*
   * Prépare le lecteur audio.
   * Aucun lecteur n'apparaît si aucun fichier audio n'est renseigné.
   */
  let audioPlayer: ReactNode = null

  if (entry.audioSrc) {
    audioPlayer = (
      <div className="page-boundary">
        <audio
          className="audio-player"
          controls
          preload="metadata"
          src={entry.audioSrc}
        >
          Votre navigateur ne prend pas en charge la lecture audio.
        </audio>
      </div>
    )
  }

  return (
    <article className="editorial-page">
      <EntryHero
        cover={artwork}
        eyebrow={`SCÈNE SONORE / ${entry.year}`}
        metadata={[
          {
            label: 'Statut',
            value: entry.status,
          },
          {
            label: 'Durée',
            value: duration,
          },
          {
            label: 'Crédits',
            value: credits,
          },
          {
            label: 'Lecture',
            value: audioAvailability,
          },
        ]}
        summary={entry.summary}
        title={entry.title}
      />

      {storyOverlay}

      {audioPlayer}

      <EntrySections
        links={entry.links}
        sections={entry.sections}
      />
    </article>
  )
}

/*
 * Lit le slug présent dans l'adresse et recherche la musique correspondante.
 *
 * Exemple :
 * /music/mon-morceau
 * donne :
 * slug = "mon-morceau"
 */
export function MusicDetailPage() {
  const parameters = useParams()
  const slug = parameters.slug

  /*
   * Si l'adresse ne contient pas de slug, on affiche la page introuvable.
   */
  if (!slug) {
    return <NotFoundPage detail />
  }

  const entry = getPublishedMusicBySlug(slug)

  /*
   * Si aucune musique publiée ne possède ce slug,
   * on affiche également la page introuvable.
   */
  if (!entry) {
    return <NotFoundPage detail />
  }

  /*
   * À partir d'ici, TypeScript sait que l'entrée existe.
   */
  return <MusicDetailView entry={entry} />
}

export default MusicDetailPage
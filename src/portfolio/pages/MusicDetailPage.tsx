import { useParams } from 'react-router'
import { EntryHero } from '../components/EntryHero'
import { EntrySections } from '../components/EntrySections'
import { getPublishedMusicBySlug, type MusicEntry } from '../content'
import { NotFoundPage } from './NotFoundPage'

export function MusicDetailView({ entry }: { entry: MusicEntry }) {
  const credits = entry.credits.map((credit) => `${credit.role} — ${credit.name}`)

  return (
    <article className="editorial-page">
      <EntryHero
        cover={entry.artwork ?? undefined}
        eyebrow={`SCÈNE SONORE / ${entry.year}`}
        metadata={[
          { label: 'Statut', value: entry.status },
          { label: 'Durée', value: entry.duration ?? 'Non renseignée' },
          { label: 'Crédits', value: credits.length ? credits : 'Non renseignés' },
          { label: 'Lecture', value: entry.audioSrc ? 'Disponible' : 'Non disponible' },
        ]}
        summary={entry.summary}
        title={entry.title}
      />
      {entry.audioSrc ? (
        <div className="page-boundary">
          <audio className="audio-player" controls preload="metadata" src={entry.audioSrc}>
            Votre navigateur ne prend pas en charge la lecture audio.
          </audio>
        </div>
      ) : null}
      <EntrySections links={entry.links} sections={entry.sections} />
    </article>
  )
}

export function MusicDetailPage() {
  const { slug = '' } = useParams()
  const entry = getPublishedMusicBySlug(slug)
  return entry ? <MusicDetailView entry={entry} /> : <NotFoundPage detail />
}

export default MusicDetailPage

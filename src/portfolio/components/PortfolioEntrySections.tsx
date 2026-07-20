/**
 * @packageDocumentation
 * Composant visuel réutilisable du portfolio.
 *
 * Ce fichier découpe l'interface en une petite pièce lisible: en-tête, carte,
 * section, indice ou bloc de liens. Si tu veux modifier ce que l'utilisateur
 * voit à l'écran, c'est souvent ici qu'il faut commencer.
 */

import type { ContentLink, ContentSection, MetadataSection } from '../content/portfolioContentTypes'
import { Reveal } from '../motion/Reveal'
import { ContentLinkAction, EntryLinks } from './PortfolioEntryLinks'
/**
 * Cette fonction intervient sur le sujet “signal Palette” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntrySections.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord SignalPalette dans EntrySections.tsx.
 */


function SignalPalette({ section }: { section: MetadataSection }) {
  const paletteClasses = [
    'signal-palette__void',
    'signal-palette__deep',
    'signal-palette__mist',
    'signal-palette__ash',
    'signal-palette__signal',
    'signal-palette__ember',
    'signal-palette__warmth',
  ]

  return (
    <ul className="signal-palette" aria-label="Palette Signal fantôme">
      {section.items.map((item, index) => (
        <li className={paletteClasses[index]} key={item.label}>
          <span aria-hidden="true" />
          <code>{item.value}</code>
        </li>
      ))}
    </ul>
  )
}
/**
 * Cette fonction intervient sur le sujet “signal Typography” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntrySections.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord SignalTypography dans EntrySections.tsx.
 */


function SignalTypography({ section }: { section: MetadataSection }) {
  return (
    <div className="signal-type-sample">
      <strong>ENTRE PLUSIEURS VIES</strong>
      <em>ce qui flotte.</em>
      <span>{section.items.map((item) => item.value).join(' / ')}</span>
    </div>
  )
}

interface EntrySectionsProps {
  sections: readonly ContentSection[]
  links?: readonly ContentLink[]
}
/**
 * Cette fonction intervient sur le sujet “entry Sections” dans portfolio.
 *
 * Fichier: src/portfolio/components/EntrySections.tsx
 * Si tu lis ce fichier pour apprendre, regarde d’abord EntrySections dans EntrySections.tsx.
 */


export function EntrySections({ sections, links = [] }: EntrySectionsProps) {
  return (
    <div className="entry-sections page-boundary">
      {sections.map((section, index) => {
        const sectionNumber = String(index + 1).padStart(2, '0')
        const className = `entry-section entry-section--${section.type} entry-section--${section.id}`

        return (
          <Reveal as="section" className={className} id={section.id} key={section.id}>
            <p className="entry-section__index">{sectionNumber} / {section.type.toUpperCase()}</p>

            {section.type === 'text' ? (
              <div className="entry-section__content">
                {section.title ? <h2>{section.title}</h2> : null}
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            ) : null}

            {section.type === 'image' ? (
              <figure className="entry-section__image">
                {section.title ? <h2 className="visually-hidden">{section.title}</h2> : null}
                <img
                  alt={section.image.alt}
                  decoding="async"
                  height={section.image.height}
                  loading="lazy"
                  src={section.image.src}
                  style={{ objectPosition: section.image.position }}
                  width={section.image.width}
                />
                {section.caption || section.title ? (
                  <figcaption>{section.caption ?? section.title}</figcaption>
                ) : null}
              </figure>
            ) : null}

            {section.type === 'quote' ? (
              <blockquote className="entry-section__content entry-section__quote">
                <p>« {section.quote} »</p>
                {section.attribution ? <cite>{section.attribution}</cite> : null}
              </blockquote>
            ) : null}

            {section.type === 'metadata' ? (
              <div className="entry-section__content">
                {section.title ? <h2>{section.title}</h2> : null}
                {section.id === 'palette' ? <SignalPalette section={section} /> : null}
                {section.id === 'typographie' ? <SignalTypography section={section} /> : null}
                {section.id !== 'palette' && section.id !== 'typographie' ? (
                  <ul className="entry-section__list">
                    {section.items.map((item) => (
                      <li key={item.label}>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {section.type === 'link' ? (
              <div className="entry-section__content">
                {section.title ? <h2>{section.title}</h2> : null}
                {section.description ? <p>{section.description}</p> : null}
                <div className="entry-section__link">
                  <ContentLinkAction link={section.link} />
                </div>
              </div>
            ) : null}

            {section.type === 'component' ? (
              <div className="entry-section__content entry-section__content--component">
                <section.component />
              </div>
            ) : null}
          </Reveal>
        )
      })}
      <EntryLinks links={links} />
    </div>
  )
}

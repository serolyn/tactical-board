import { Reveal } from '../motion'

interface SectionHeadingProps {
  index: string
  eyebrow: string
  title: string
  introduction?: string
  id?: string
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  introduction,
  id,
}: SectionHeadingProps) {
  return (
    <Reveal as="header" className="section-heading">
      <p className="section-heading__index">{index}</p>
      <div className="section-heading__title-group">
        <p className="portfolio-meta">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      {introduction ? <p className="section-heading__introduction">{introduction}</p> : null}
    </Reveal>
  )
}

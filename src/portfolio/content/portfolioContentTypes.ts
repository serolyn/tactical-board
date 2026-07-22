import type { ComponentType } from 'react'

/*
 * Ces types décrivent les objets écrits dans les trois fichiers de contenu.
 * Ils servent surtout à détecter les fautes de structure pendant le développement.
 */

export type EntryStatus =
  | 'Brouillon'
  | 'En développement'
  | 'Direction validée'
  | 'Publié'
  | 'Archivé'

export type ContentLinkKind = 'internal' | 'external' | 'static'

export type ContentLink = {
  readonly label: string
  readonly href: string
  readonly kind: ContentLinkKind
}

export type ContentImage = {
  readonly src: string
  readonly alt: string
  readonly width?: number
  readonly height?: number
  readonly position?: string
}

export type TextSection = {
  readonly id: string
  readonly type: 'text'
  readonly title?: string
  readonly paragraphs: readonly string[]
}

export type ImageSection = {
  readonly id: string
  readonly type: 'image'
  readonly title?: string
  readonly image: ContentImage
  readonly caption?: string
}

export type QuoteSection = {
  readonly id: string
  readonly type: 'quote'
  readonly quote: string
  readonly attribution?: string
}

export type MetadataItem = {
  readonly label: string
  readonly value: string
}

export type MetadataSection = {
  readonly id: string
  readonly type: 'metadata'
  readonly title?: string
  readonly items: readonly MetadataItem[]
}

export type ComponentSection = {
  readonly id: string
  readonly type: 'component'
  readonly component: ComponentType
}

/* Seuls les formats réellement utilisés par le portfolio sont conservés. */
export type ContentSection =
  | TextSection
  | ImageSection
  | QuoteSection
  | MetadataSection
  | ComponentSection

export type ContentCredit = {
  readonly role: string
  readonly name: string
  readonly link?: ContentLink
}

type BaseEntry = {
  readonly slug: string
  readonly title: string
  readonly year: number
  readonly status: EntryStatus
  readonly summary: string
  readonly sections: readonly ContentSection[]

  /*
   * true  : l'entrée apparaît dans le portfolio.
   * false : elle reste disponible dans le code comme brouillon, sans être publiée.
   */
  readonly published: boolean
}

export type ProjectEntry = BaseEntry & {
  readonly introduction: string
  readonly cover: ContentImage
  readonly tags: readonly string[]
  readonly role: readonly string[]
  readonly stack: readonly string[]
  readonly links: readonly ContentLink[]
}

export type MusicEntry = BaseEntry & {
  /** Un brouillon peut omettre son visuel plutôt que présenter une fausse pochette. */
  readonly artwork: ContentImage | null
  readonly storyOverlay?: ComponentType

  /**
   * `hero` convient aux calques absolus comme la scène Nemyl.
   * `afterHero` convient aux scènes autonomes possédant leur propre boîte, comme Miku.
   */
  readonly storyOverlayPlacement?: 'hero' | 'afterHero'
  readonly audioSrc?: string
  readonly duration?: string
  readonly credits: readonly ContentCredit[]
  readonly links: readonly ContentLink[]
}

export type LabKind = 'Système interactif' | 'Système visuel' | 'Prototype' | 'Recherche'

export type LabEntry = BaseEntry & {
  readonly overline: string
  readonly kind: LabKind
  readonly statement?: string
  readonly cover: ContentImage
  readonly tags: readonly string[]
  readonly links: readonly ContentLink[]
}

export type PortfolioEntry = ProjectEntry | MusicEntry | LabEntry

export type SiteIdentity = {
  readonly name: string
  readonly location: string
  readonly year: number
}

export type SiteContent = {
  readonly identity: SiteIdentity
  readonly home: {
    readonly overline: string
    readonly title: string
    readonly introduction: string
    readonly visual: ContentImage
    readonly projectLink: ContentLink
    readonly musicLink: ContentLink
    readonly aboutFragment: string
  }
  readonly projects: {
    readonly title: string
    readonly emptyState: string
  }
  readonly music: {
    readonly title: string
    readonly introduction: string
    readonly emptyState: string
    readonly atmosphere: ContentImage
  }
  readonly lab: {
    readonly title: string
  }
  readonly about: {
    readonly title: string
    readonly introduction: string
    readonly approach: string
    readonly current: string
    readonly technologies: readonly string[]
  }

  /** Les tableaux vides sont volontaires : aucun lien vide n'est rendu à l'écran. */
  readonly socialLinks: readonly ContentLink[]
  readonly contactLinks: readonly ContentLink[]
}

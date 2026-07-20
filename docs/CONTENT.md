# Ajouter du contenu au portfolio

Le portfolio n’utilise pas de CMS. Ses textes et métadonnées sont des objets
TypeScript dans `src/portfolio/content/` :

| Fichier | Rôle |
| --- | --- |
| `projects.ts` | projets |
| `music.ts` | scènes sonores |
| `lab.ts` | expériences et prototypes |
| `site.ts` | textes généraux du site |
| `types.ts` | formes communes du contenu |
| `validation.ts` | contrôles exécutés au chargement |

Une entrée avec `published: false` reste dans le dépôt mais n’apparaît ni dans
les index ni dans les routes publiques.

## Slugs

Le `slug` devient la fin de l’adresse : `mon-projet` donne
`/projects/mon-projet`. Utiliser uniquement des minuscules non accentuées, des
chiffres et des tirets. Le slug doit être unique dans tout le portfolio et ne
peut pas être `about`, `art-direction`, `board`, `lab`, `music` ou `projects`.

## Images et fichiers audio

1. Optimiser le fichier avant de l’ajouter au dépôt.
2. Le placer dans `src/portfolio/assets/`.
3. Documenter sa source, sa licence et ses transformations dans
   [DESIGN.md](./DESIGN.md).
4. L’importer avec l’alias `@/` afin que Vite produise une URL compatible avec
   GitHub Pages.

```ts
import cover from '@/portfolio/assets/mon-projet.webp'

const image = {
  src: cover,
  alt: 'Description concise de ce qui est visible.',
  width: 1600,
  height: 900,
  position: 'center',
}
```

Les images peuvent être WebP, AVIF, PNG ou JPEG. Un fichier audio local
s’importe de la même manière, par exemple
`import audioSrc from '@/portfolio/assets/ma-scene.mp3'`. Aucun son n’est lancé
automatiquement.

## Ajouter un projet

Ajouter un objet dans `projects.ts`, d’abord masqué :

```ts
{
  slug: 'mon-projet',
  title: 'MON PROJET',
  year: 2026,
  status: 'En préparation',
  summary: 'Résumé court visible dans l’index.',
  introduction: 'Introduction de la page de détail.',
  cover: image,
  tags: ['Interface', 'Prototype'],
  role: ['Conception', 'Développement'],
  stack: ['React', 'TypeScript'],
  links: [],
  sections: [],
  published: false,
}
```

## Ajouter un morceau

Ajouter un objet dans `music.ts` :

```ts
{
  slug: 'ma-scene',
  title: 'MA SCÈNE',
  year: 2026,
  status: 'En préparation',
  summary: 'Description courte du lieu émotionnel.',
  artwork: image,
  audioSrc,
  duration: '04:12',
  credits: [{ role: 'Composition', name: 'Nom à renseigner' }],
  links: [],
  sections: [],
  published: false,
}
```

Pour une scène sans audio, omettre `audioSrc` et `duration`. Une scène publiée
doit néanmoins conserver une image `artwork`.

## Ajouter un élément Lab

Ajouter un objet dans `lab.ts` :

```ts
{
  slug: 'mon-experience',
  title: 'MON EXPÉRIENCE',
  year: 2026,
  status: 'En développement',
  overline: 'LAB / PROTOTYPE / 2026',
  kind: 'Prototype',
  summary: 'Résumé de l’expérience.',
  cover: image,
  tags: ['Prototype', 'TypeScript'],
  links: [],
  sections: [],
  published: false,
}
```

Les valeurs de `kind` sont `Système interactif`, `Système visuel`, `Prototype`
et `Recherche`.

## Liens

```ts
// Route gérée par React Router
{ label: 'Ouvrir le tableau', href: '/board', kind: 'internal' }

// Site extérieur
{ label: 'Voir la source', href: 'https://example.com', kind: 'external' }

// Fichier public, chemin relatif au base path Vite
{ label: 'Ouvrir la planche', href: 'art-direction/', kind: 'static' }
```

Ne pas remplacer un lien absent par `#` : supprimer plutôt l’entrée concernée.

## Sections disponibles

Chaque section possède un `id` unique dans son entrée. Les formats pris en
charge sont :

```ts
{ id: 'idee', type: 'text', title: 'Idée', paragraphs: ['Un paragraphe.'] }
{ id: 'detail', type: 'image', image, caption: 'Légende facultative.' }
{ id: 'fragment', type: 'quote', quote: 'Un fragment court.' }
{
  id: 'fiche',
  type: 'metadata',
  title: 'Fiche',
  items: [{ label: 'Année', value: '2026' }],
}
{
  id: 'suite',
  type: 'link',
  description: 'Continuer vers l’expérience.',
  link: { label: 'Ouvrir', href: '/board', kind: 'internal' },
}
```

## Publier et vérifier

Passer `published` à `true` uniquement après vérification locale. Le champ
`status` est informatif et ne contrôle pas la visibilité.

```bash
npm run dev
npm run test
npm run typecheck
npm run lint
npm run build
```

La validation du contenu détecte notamment les slugs dupliqués ou réservés,
les champs essentiels manquants, les sections incomplètes et les liens mal
formés.

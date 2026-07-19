# Ajouter du contenu au portfolio SEROLYN

Le portfolio n’utilise ni CMS ni fichiers Markdown spéciaux. Son contenu est composé de simples objets TypeScript dans [`src/portfolio/content`](../src/portfolio/content). Cette approche permet de garder les textes, images, liens et états de publication au même endroit, avec l’aide de TypeScript pour repérer les oublis.

## Repères rapides

| Fichier | Ce qu’il contient |
| --- | --- |
| `projects.ts` | Projets construits ou documentés |
| `music.ts` | Morceaux conçus comme des scènes sonores |
| `lab.ts` | Expériences, prototypes et systèmes personnels |
| `site.ts` | Textes généraux de l’accueil, des index et de la page À propos |
| `types.ts` | Forme attendue pour chaque objet |
| `validation.ts` | Contrôles automatiques du contenu |

Les pages publiques lisent uniquement `publishedProjects`, `publishedMusic` et `publishedLab` depuis `content/index.ts`. Une entrée avec `published: false` reste donc modifiable dans le dépôt sans apparaître sur le site.

## Choisir un slug

Le `slug` devient la dernière partie de l’adresse :

```text
slug: "mon-premier-projet"  →  /projects/mon-premier-projet
slug: "une-scene-sonore"    →  /music/une-scene-sonore
slug: "mon-experience"      →  /lab/mon-experience
```

Utiliser seulement des lettres minuscules non accentuées, des chiffres et des tirets simples. Chaque slug doit être unique dans tout le portfolio. Ne pas utiliser les routes réservées `about`, `art-direction`, `board`, `lab`, `music` ou `projects`.

## Ajouter une image locale

1. Optimiser l’image en WebP, AVIF, PNG ou JPEG.
2. La placer dans `src/assets/portfolio/`.
3. L’importer au début du fichier de contenu.
4. Renseigner un texte alternatif qui décrit l’image.

```ts
import projectCover from '../../assets/portfolio/mon-projet.webp'

const cover = {
  src: projectCover,
  alt: 'Description concise de ce qui est visible dans l’image.',
  width: 1600,
  height: 900,
  position: 'center',
}
```

Un import TypeScript, plutôt qu’un chemin écrit à la main, permet à Vite de produire une URL compatible avec le sous-dossier GitHub Pages.

Documenter aussi la source, la licence et les transformations de tout nouvel asset dans `docs/ASSET_MANIFEST.md`.

## Ajouter un projet

Dans `projects.ts`, copier l’objet de modèle présent dans le tableau `projects`, puis remplacer tous les champs de démonstration :

```ts
{
  slug: 'mon-projet',
  title: 'MON PROJET',
  year: 2026,
  status: 'Publié',
  summary: 'Résumé court visible dans les index.',
  introduction: 'Introduction de la page de détail.',
  cover: {
    src: projectCover,
    alt: 'Description de la couverture du projet.',
    width: 1600,
    height: 900,
  },
  tags: ['Interface', 'Prototype'],
  role: ['Conception', 'Développement'],
  stack: ['React', 'TypeScript'],
  links: [],
  sections: [
    {
      id: 'contexte',
      type: 'text',
      title: 'Contexte',
      paragraphs: ['Premier paragraphe.', 'Deuxième paragraphe.'],
    },
  ],
  published: false,
},
```

Laisser d’abord `published: false`, vérifier la page localement, puis passer à `true` lorsque le contenu est prêt.

## Ajouter un morceau

Une entrée Musique peut rester sans lecteur. Le lecteur n’est rendu que si `audioSrc` existe.

```ts
import artwork from '../../assets/portfolio/ma-scene.webp'
import audioSrc from '../../assets/portfolio/ma-scene.mp3'

{
  slug: 'ma-scene',
  title: 'MA SCÈNE',
  year: 2026,
  status: 'Publié',
  summary: 'Une description courte du lieu émotionnel.',
  artwork: {
    src: artwork,
    alt: 'Description de l’image associée au morceau.',
    width: 1200,
    height: 1200,
  },
  audioSrc,
  duration: '04:12',
  credits: [
    { role: 'Composition', name: 'Nom à renseigner' },
  ],
  links: [],
  sections: [
    {
      id: 'notes',
      type: 'quote',
      quote: 'Un fragment ou une note liée au morceau.',
    },
  ],
  published: false,
},
```

Pour une scène sans fichier audio, supprimer simplement les lignes `import audioSrc`, `audioSrc,` et `duration`. Aucun son n’est lancé automatiquement. Une entrée publiée doit en revanche avoir une image `artwork` et non `null`.

## Ajouter une entrée Lab

```ts
{
  slug: 'mon-experience',
  title: 'MON EXPÉRIENCE',
  year: 2026,
  status: 'En développement',
  overline: 'LAB / PROTOTYPE / 2026',
  kind: 'Prototype',
  statement: 'Une phrase courte facultative.',
  summary: 'Résumé de l’expérience.',
  cover: {
    src: experimentCover,
    alt: 'Description de la couverture de l’expérience.',
  },
  tags: ['Prototype', 'TypeScript'],
  links: [],
  sections: [],
  published: false,
},
```

Les valeurs de `kind` disponibles sont `Système interactif`, `Système visuel`, `Prototype` et `Recherche`.

## Créer un lien

Trois sortes de liens sont prises en charge :

```ts
// Route gérée par React Router
{ label: 'Ouvrir le tableau', href: '/board', kind: 'internal' }

// Site extérieur — utiliser une URL complète
{ label: 'Voir la source', href: 'https://example.com', kind: 'external' }

// Fichier statique copié dans le build — chemin relatif au base path
{ label: 'Ouvrir la planche', href: 'art-direction/', kind: 'static' }
```

Un lien social ou de contact non renseigné ne doit pas être remplacé par `#`. Le laisser absent de `socialLinks` ou `contactLinks` dans `site.ts`.

## Ajouter une section

Chaque section possède un `id` unique dans l’entrée et un `type`. Les cinq formats disponibles sont :

```ts
// Texte
{ id: 'idee', type: 'text', title: 'Idée', paragraphs: ['Un paragraphe.'] }

// Image
{ id: 'detail', type: 'image', image: cover, caption: 'Légende facultative.' }

// Citation ou fragment
{ id: 'fragment', type: 'quote', quote: 'Un fragment court.' }

// Liste de métadonnées
{
  id: 'fiche',
  type: 'metadata',
  title: 'Fiche',
  items: [
    { label: 'Année', value: '2026' },
    { label: 'Rôle', value: 'Conception' },
  ],
}

// Appel vers un lien
{
  id: 'suite',
  type: 'link',
  description: 'Continuer vers l’expérience.',
  link: { label: 'Ouvrir', href: '/board', kind: 'internal' },
}
```

## Publier ou masquer une entrée

```ts
published: false // brouillon, absent des index et des pages publiques
published: true  // entrée visible et accessible par son slug
```

Ne pas utiliser `status: 'Brouillon'` comme seul mécanisme de masquage : c’est toujours `published` qui décide de la visibilité publique.

## Vérifier le résultat localement

Depuis la racine du dépôt :

```bash
npm run dev
```

Ouvrir ensuite l’URL indiquée par Vite et tester l’index puis la page de détail. Avant de commit, exécuter les quatre validations du dépôt :

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

La validation de `content/index.ts` s’exécute dès que le contenu est importé par l’application. Elle signale notamment les slugs dupliqués ou réservés, les champs essentiels manquants, les sections incomplètes et les liens mal formés.

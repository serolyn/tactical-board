# Design, assets et licences

Ce document est la référence visuelle commune du dépôt. Il décrit les deux
identités sans les confondre et conserve la provenance des ressources locales.

## Portfolio SEROLYN

La direction associe 80 % de clarté éditoriale à 20 % d’étrangeté. Le fond
reste nocturne, les espaces sont généreux et les signaux colorés restent rares.

| Rôle | Couleur |
| --- | --- |
| Void, fond principal | `#07080D` |
| Deep night, plans secondaires | `#11121C` |
| Mist, texte principal | `#DDDDE5` |
| Ash, texte secondaire | `#8D8E9C` |
| Signal bleu-violet | `#6964C7` |
| Ember rouge, anomalie rare | `#CF4B46` |
| Residual warmth | `#C99B70` |

Les titres et le texte courant utilisent **Manrope**. **Newsreader Italic** est
réservée aux fragments plus sensibles ; **IBM Plex Mono** sert aux dates,
indices et métadonnées. Les animations doivent rester lentes et discrètes,
respecter `prefers-reduced-motion` et ne jamais gêner la lecture.

Ghost Signal est une scène procédurale originale. Sa géométrie, ses fragments
et ses couleurs sont produits par le code WebGL du dépôt ; aucun modèle 3D,
shader ou visuel tiers n’y est incorporé. L’image `signal-horizon.webp` reste le
repli statique lorsque WebGL ou le mouvement ne sont pas disponibles.

## Tactical Board

Le Board conserve une identité utilitaire de poste de commandement : surfaces
charbon et vert olive, typographie système, contraste net, texture de terrain
et densité maîtrisée. Ses accents principaux sont `#A4B58B` pour l’action,
`#CF7470` pour le danger et `#C6A461` pour l’avertissement.

Le plateau reste en DOM/CSS et les annotations en SVG. Les conventions
éditoriales, fontes et effets WebGL du portfolio ne doivent pas entrer dans le
code du Board.

## Ressources du portfolio

Les fichiers ci-dessous existent dans `src/portfolio/assets/`. Les trois images
et les trois fontes nécessaires à la planche autonome ont une copie identique
dans `public/art-direction/assets/`, car son HTML statique n’est pas transformé
par Vite.

### Images

| Fichier | Source et auteur | Licence | Usage |
| --- | --- | --- | --- |
| `signal-horizon.webp` | [Kloppenheim 07 (Pure Sky)](https://polyhaven.com/a/kloppenheim_07_puresky), Greg Zaal, Jarod Guest et Poly Haven | CC0 1.0 | Hero, repli Ghost Signal et planche |
| `fog-reflections.webp` | [Tugboat Boss on a foggy night 5](https://commons.wikimedia.org/wiki/File:Tugboat_Boss_on_a_foggy_night_5.jpg), W.carter | CC0 1.0 | Scènes sonores et planche |
| `moonlit-harbor.webp` | [A Moonlit Harbor](https://www.nga.gov/artworks/204946-moonlit-harbor), Norbert Goeneutte et National Gallery of Art | CC0 / Open Access NGA | Lab et planche |
| `signal-preview-desktop.png` | Capture interne de la planche SEROLYN | Droits du projet ; composants incorporés sous CC0/OFL | Illustration Signal Fantôme |
| `signal-preview-mobile.png` | Capture interne de la planche SEROLYN | Droits du projet ; composants incorporés sous CC0/OFL | Illustration Signal Fantôme |

Transformations locales :

- `signal-horizon.webp` : recadrage 16:9, réduction à 1 600 × 900,
  assombrissement, désaturation et conversion WebP ;
- `fog-reflections.webp` : recadrage sur les reflets à droite, réduction à
  720 × 1 440, refroidissement et conversion WebP ;
- `moonlit-harbor.webp` : retrait de la marge papier, réduction à 1 200 × 869,
  contraste et conversion WebP.

Les métadonnées ont été supprimées lors de l’optimisation. Ces trois sources
autorisent la modification et la publication, y compris commerciale ; leur
attribution visible n’est pas obligatoire mais leurs crédits sont conservés ici.

### Fontes

| Fichier | Auteur | Source | Licence |
| --- | --- | --- | --- |
| `Manrope-Variable-400-700-latin.woff2` | Mikhail Sharanda | [Google Fonts / Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | SIL OFL 1.1 |
| `Newsreader-Italic-400-latin.woff2` | Production Type | [Google Fonts / Newsreader](https://github.com/google/fonts/tree/main/ofl/newsreader) | SIL OFL 1.1 |
| `IBMPlexMono-Regular-400-latin.woff2` | Mike Abbink, Bold Monday et IBM | [Google Fonts / IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono) | SIL OFL 1.1 |

Les binaires WOFF2 officiels n’ont pas été modifiés ; seuls leurs noms locaux
sont explicites. Leur incorporation et leur redistribution restent soumises à
la [SIL Open Font License 1.1](https://openfontlicense.org/).

## Ressources partagées et Tactical Board

| Fichier | Emplacement | Provenance connue | Statut |
| --- | --- | --- | --- |
| `tactical-terrain.webp` | `src/shared/assets/` | Image fournie par le propriétaire du dépôt | Utilisée par le plateau et sa présentation dans le Lab ; provenance détaillée à confirmer |
| `base-icon-game.png` | `src/tactical-board/assets/` | Icône fournie par le propriétaire du dépôt | Usage interne au Board ; provenance détaillée à confirmer |
| `obstacle-icon-game.png` | `src/tactical-board/assets/` | Icône fournie par le propriétaire du dépôt | Usage interne au Board ; provenance détaillée à confirmer |
| `favicon.svg` | `public/` | Création vectorielle interne au dépôt | Usage autorisé dans le site |

Les trois fichiers signalés comme « à confirmer » sont de vrais assets du
produit et ne doivent pas être supprimés. Avant une réutilisation extérieure au
projet, le propriétaire doit préciser leur source d’origine et les droits
associés.

## Ajouter un asset

- Employer un fichier local optimisé et un nom descriptif en minuscules.
- Le ranger dans l’application qui l’utilise, ou dans `shared/assets` seulement
  s’il sert réellement aux deux applications.
- Noter ici sa source, son auteur, sa licence, ses transformations et son usage.
- Ne jamais intégrer une ressource dont les droits sont ambigus.

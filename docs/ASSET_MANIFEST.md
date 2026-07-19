# Manifeste d’assets — SEROLYN / Signal fantôme

- **Date de constitution :** 19 juillet 2026
- **Périmètre :** planche autonome `docs/art-direction/` et copies runtime du
  portfolio ajoutées en phase 3B
- **Politique :** fichiers locaux uniquement, aucune hotlink, aucune image générée par IA

## Budget

| Groupe | Fichiers | Poids |
| --- | ---: | ---: |
| Visuels optimisés | 3 WebP | 177 442 octets (173,3 Kio) |
| Polices locales | 3 WOFF2 | 63 884 octets (62,4 Kio) |
| Assets chargés par la planche | 6 | **241 326 octets (235,7 Kio)** |
| Captures de validation | 2 PNG | 910 065 octets (888,7 Kio) |
| Total, captures comprises | 8 | **1 151 391 octets (1,10 Mio)** |

Le total reste sous la cible d’environ 1,5 Mio, même en comptant les captures qui
ne sont pas chargées par la page. Le rouge diffus, les lignes, la grille du seul
aperçu Tactical Board et le grain visuel sont produits en CSS/SVG.

## Intégration runtime — phase 3B

La phase 3B réutilise exclusivement les fichiers déjà documentés dans la planche
3A. Les huit fichiers sous `src/assets/portfolio/` sont des copies binaires
strictement identiques à leurs sources canoniques sous `docs/art-direction/` :
aucun nouvel asset externe, téléchargement ou régime de licence n'a été
introduit. L'ensemble des copies runtime pèse **1 151 391 octets (1,10 Mio)**.

| Source canonique | Copie runtime | Usage dans le portfolio | Poids | SHA-256 |
| --- | --- | --- | ---: | --- |
| `docs/art-direction/assets/signal-horizon.webp` | `src/assets/portfolio/signal-horizon.webp` | Hero de l'accueil, étude Signal fantôme et couverture du modèle de projet non publié | 17 818 octets | `c1f0c5e877fbc848d3a496d07b4c151949db89b56e4e66a24c59d8c8cd1fab3e` |
| `docs/art-direction/assets/fog-reflections.webp` | `src/assets/portfolio/fog-reflections.webp` | Atmosphère de Scènes sonores et étude Signal fantôme | 25 364 octets | `34b4be7a0772b1275dc59e2498b7c7496c7750e581ca6387ba5bda15edef997d` |
| `docs/art-direction/assets/moonlit-harbor.webp` | `src/assets/portfolio/moonlit-harbor.webp` | Couverture et étude Signal fantôme | 134 260 octets | `c6c4a3ba1264a359dbad7e7efcad2adf9dbe2ff919b1e2b5819025910ef43aea` |
| `docs/art-direction/assets/fonts/Manrope-Variable-400-700-latin.woff2` | `src/assets/portfolio/fonts/Manrope-Variable-400-700-latin.woff2` | Titres, navigation et texte courant du portfolio | 24 836 octets | `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972` |
| `docs/art-direction/assets/fonts/Newsreader-Italic-400-latin.woff2` | `src/assets/portfolio/fonts/Newsreader-Italic-400-latin.woff2` | Fragments éditoriaux en italique | 24 340 octets | `fa9b900403949d9a723106752a5c8ad2797012a0c9057427b1da2db72d552148` |
| `docs/art-direction/assets/fonts/IBMPlexMono-Regular-400-latin.woff2` | `src/assets/portfolio/fonts/IBMPlexMono-Regular-400-latin.woff2` | Dates, index et métadonnées techniques | 14 708 octets | `08949f728dc52d528e69b1667d15c89a5686a4ee9a296ff90983985f99c380f7` |
| `docs/art-direction/preview-desktop.png` | `src/assets/portfolio/signal-preview-desktop.png` | Illustration éditoriale desktop de l'étude Signal fantôme | 701 577 octets | `88b3cca1bf3a6135882b0257f23cbf6ead5892d4075064eb3dda30366d60c3f0` |
| `docs/art-direction/preview-mobile.png` | `src/assets/portfolio/signal-preview-mobile.png` | Illustration éditoriale mobile de l'étude Signal fantôme | 208 488 octets | `d058fc00f050042a1c45e64ebba2977d8b767314cfe438424f7749f289429688` |

Les deux PNG renommés ci-dessus sont les captures de validation **de la planche
3A**, désormais réemployées comme contenu éditorial. Ils ne doivent pas être
confondus avec les captures de recette du portfolio de phase 3B, documentées
séparément dans [`portfolio-previews/README.md`](./portfolio-previews/README.md).

## Visuels

### `assets/signal-horizon.webp`

- **Titre original :** *Kloppenheim 07 (Pure Sky)*.
- **Auteurs :** Greg Zaal (original), Jarod Guest (édition du ciel) ; Poly Haven.
- **Page source exacte :** [polyhaven.com/a/kloppenheim_07_puresky](https://polyhaven.com/a/kloppenheim_07_puresky).
- **Téléchargement exact :** [JPG tonemapped 8K](https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/kloppenheim_07_puresky.jpg).
- **Licence :** CC0 1.0 ; [politique Poly Haven](https://polyhaven.com/license), [texte CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- **Source téléchargée :** 8 192 × 4 096 px, 21 091 680 octets, JPEG.
- **Fichier local :** 1 600 × 900 px, 17 818 octets, WebP ; SHA-256 `c1f0c5e877fbc848d3a496d07b4c151949db89b56e4e66a24c59d8c8cd1fab3e`.
- **Modifications :** recadrage central 16:9, réduction, assombrissement,
  contraste augmenté, saturation réduite, dominante bleu nuit légère,
  conversion WebP qualité 72 et suppression des métadonnées.
- **Usage envisagé :** image principale du hero et fond de l’aperçu mobile.
- **Date de récupération :** 19 juillet 2026.

### `assets/fog-reflections.webp`

- **Titre original :** *Tugboat Boss on a foggy night 5*.
- **Auteur :** W.carter ; photographie originale du 29 décembre 2018.
- **Page source exacte :** [Wikimedia Commons — fichier](https://commons.wikimedia.org/wiki/File:Tugboat_Boss_on_a_foggy_night_5.jpg).
- **Téléchargement exact :** [JPEG original Wikimedia](https://upload.wikimedia.org/wikipedia/commons/5/55/Tugboat_Boss_on_a_foggy_night_5.jpg).
- **Licence :** CC0 1.0 ; [texte CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- **Source téléchargée :** 4 898 × 3 283 px, 5 475 337 octets, JPEG.
- **Fichier local :** 720 × 1 440 px, 25 364 octets, WebP ; SHA-256 `34b4be7a0772b1275dc59e2498b7c7496c7750e581ca6387ba5bda15edef997d`.
- **Modifications :** micro-recadrage extrême à droite (598 × 1 200 px aux
  coordonnées x 4 300 / y 1 650) afin de retirer le remorqueur et ses décorations
  et de ne conserver que la brume, les lumières du port et leurs reflets ; mise à
  l’échelle, assombrissement, saturation réduite, refroidissement léger,
  conversion WebP qualité 72 et suppression des métadonnées.
- **Usage envisagé :** entrée « Scènes sonores » et échantillon de reflet nocturne.
- **Date de récupération :** 19 juillet 2026.

### `assets/moonlit-harbor.webp`

- **Titre original :** *A Moonlit Harbor*, années 1890.
- **Auteur / institution :** Norbert Goeneutte ; National Gallery of Art,
  accession 2016.43.2.
- **Page source exacte :** [National Gallery of Art — œuvre 204946](https://www.nga.gov/artworks/204946-moonlit-harbor).
- **Téléchargement exact utilisé :** [dérivé IIIF 2 000 px](https://api.nga.gov/iiif/14d83a23-d0dc-4074-98f2-237f883dcfc2/full/2000,/0/default.jpg) ; [informations IIIF de l’original](https://api.nga.gov/iiif/14d83a23-d0dc-4074-98f2-237f883dcfc2/info.json).
- **Licence :** CC0 / Open Access NGA ; [politique Open Access](https://www.nga.gov/terms-and-notices#open-access-policy), [texte CC0](https://creativecommons.org/publicdomain/zero/1.0/).
- **Original IIIF :** 3 694 × 2 986 px. Dérivé téléchargé : 2 000 × 1 617 px,
  828 598 octets, JPEG.
- **Fichier local :** 1 200 × 869 px, 134 260 octets, WebP ; SHA-256 `c6c4a3ba1264a359dbad7e7efcad2adf9dbe2ff919b1e2b5819025910ef43aea`.
- **Modifications :** retrait de la marge papier par recadrage, réduction,
  assombrissement léger, contraste augmenté, saturation réduite, conversion
  WebP qualité 74 et suppression des métadonnées.
- **Usage envisagé :** section « Formes en cours » et matière d’archive nocturne.
- **Date de récupération :** 19 juillet 2026.

## Polices

Les trois fichiers proviennent des réponses officielles de Google Fonts pour le
sous-ensemble Latin, qui couvre le français (`é`, `à`, `ç`, `œ`, etc.). Les
binaires ne sont pas modifiés ; seuls leurs noms locaux ont été rendus explicites.
Les plages de graisse réellement exposées sont limitées dans `art-direction.css`.

### `assets/fonts/Manrope-Variable-400-700-latin.woff2`

- **Famille / face :** Manrope Variable, romain, graisses CSS 400 à 700.
- **Auteur :** Mikhail Sharanda.
- **Page source exacte :** [Google Fonts — Manrope](https://fonts.google.com/specimen/Manrope) ; [catalogue source](https://github.com/google/fonts/tree/main/ofl/manrope).
- **Téléchargement exact :** [WOFF2 Latin officiel](https://fonts.gstatic.com/s/manrope/v20/xn7gYHE41ni1AdIRggexSg.woff2).
- **Licence :** SIL Open Font License 1.1 ; [OFL officiel](https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt).
- **Modifications :** aucune modification du binaire ; renommage local uniquement.
- **Dimensions / poids :** sans dimensions raster ; 24 836 octets ; SHA-256 `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972`.
- **Usage envisagé :** structure principale, texte courant et grands titres.
- **Date de récupération :** 19 juillet 2026.

### `assets/fonts/Newsreader-Italic-400-latin.woff2`

- **Famille / face :** Newsreader Italic, graisse CSS 400.
- **Auteur :** Production Type.
- **Page source exacte :** [Google Fonts — Newsreader](https://fonts.google.com/specimen/Newsreader) ; [catalogue source](https://github.com/google/fonts/tree/main/ofl/newsreader) ; [projet amont](https://github.com/productiontype/Newsreader).
- **Téléchargement exact :** [WOFF2 Latin officiel](https://fonts.gstatic.com/s/newsreader/v26/cY9kfjOCX1hbuyalUrK439vogqC9yFZCYg7oRZaLP4obnf7fTXglsMwoT9ZHFjQ.woff2).
- **Licence :** SIL Open Font License 1.1 ; [OFL officiel](https://raw.githubusercontent.com/google/fonts/main/ofl/newsreader/OFL.txt).
- **Modifications :** aucune modification du binaire ; renommage local uniquement.
- **Dimensions / poids :** sans dimensions raster ; 24 340 octets ; SHA-256 `fa9b900403949d9a723106752a5c8ad2797012a0c9057427b1da2db72d552148`.
- **Usage envisagé :** phrases fantômes et fragments émotionnels uniquement.
- **Date de récupération :** 19 juillet 2026.

### `assets/fonts/IBMPlexMono-Regular-400-latin.woff2`

- **Famille / face :** IBM Plex Mono Regular, graisse CSS 400.
- **Auteurs :** Mike Abbink, Bold Monday ; IBM.
- **Page source exacte :** [Google Fonts — IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) ; [catalogue source](https://github.com/google/fonts/tree/main/ofl/ibmplexmono) ; [projet IBM](https://github.com/IBM/plex/tree/master/packages/plex-mono).
- **Téléchargement exact :** [WOFF2 Latin officiel](https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q1w.woff2).
- **Licence :** SIL Open Font License 1.1 ; [OFL officiel](https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/OFL.txt). Le nom réservé « Plex » est conservé car le binaire est inchangé.
- **Modifications :** aucune modification du binaire ; renommage local uniquement.
- **Dimensions / poids :** sans dimensions raster ; 14 708 octets ; SHA-256 `08949f728dc52d528e69b1667d15c89a5686a4ee9a296ff90983985f99c380f7`.
- **Usage envisagé :** dates, index, coordonnées et métadonnées techniques.
- **Date de récupération :** 19 juillet 2026.

## Captures de validation

Ces fichiers sont des sorties de validation locales, pas des sources graphiques.
Ils ont été générés avec Chromium 150 en mode headless, sans extension ni
dépendance ajoutée au projet.

| Fichier | Dimensions | Poids | Usage |
| --- | ---: | ---: | --- |
| `preview-desktop.png` | 1 440 × 900 px | 701 577 octets | Validation du hero desktop |
| `preview-mobile.png` | 390 × 844 px | 208 488 octets | Validation du hero mobile |

## Décisions de sélection

- Aucun portrait, personnage, fan art, wallpaper, visuel d’album ou asset à
  licence ambiguë n’a été retenu.
- Le recadrage Wikimedia est volontairement abstrait : le sujet documentaire
  original n’est pas utilisé comme motif narratif.
- L’anomalie rouge et le grain restent des effets CSS/SVG afin d’éviter un
  quatrième visuel décoratif et toute lecture cyberpunk ou « clip musical ».
- L’unique grille de la planche apparaît dans l’aperçu de Tactical Board ; elle
  n’est pas un motif général du portfolio.

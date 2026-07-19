# Captures de recette — portfolio Phase 3B

Ces huit captures valident le rendu statique livré en phase 3B. Elles sont des
preuves de recette conservées dans la documentation et ne sont pas chargées par
le portfolio en production.

- **Date :** 19 juillet 2026
- **Source :** build Vite de production servi sous `/tactical-board/`
- **Navigateur :** Chromium 150.0.7871.124, DPR 1, délai virtuel de 3 secondes
- **Encodage :** WebP qualité 88 avec FFmpeg 6.1.1
- **Poids total :** 383 920 octets (374,9 Kio)

| Capture | Route | Fenêtre | Poids | SHA-256 |
| --- | --- | ---: | ---: | --- |
| [`home-desktop-1440x900.webp`](./home-desktop-1440x900.webp) | `/` | 1 440 × 900 | 36 522 octets | `9bd3f9c48aa6e79c1daae0174f195e5c58d3accb8c3f377482255b702f558d86` |
| [`home-mobile-390x844.webp`](./home-mobile-390x844.webp) | `/` | 390 × 844 | 15 250 octets | `4f424c05fc07a81ff1dbe2f468ddcdea5605222aa2c69a1b26cecfd808dacd03` |
| [`projects-1440x900.webp`](./projects-1440x900.webp) | `/projects` | 1 440 × 900 | 15 626 octets | `23d46958583cdc21b838085cb3a510205503728420a608a472c6abc5f5135269` |
| [`music-1440x900.webp`](./music-1440x900.webp) | `/music` | 1 440 × 900 | 34 014 octets | `9dc4ffeb4bcc1ebae0782c44c00895ed290523b3c3abfd570fbdb640607f785a` |
| [`lab-1440x900.webp`](./lab-1440x900.webp) | `/lab` | 1 440 × 900 | 19 474 octets | `0edb422723af549af2f14f0a5cea8199c3a175e0aca3c47ef7b95602484653e0` |
| [`about-1440x900.webp`](./about-1440x900.webp) | `/about` | 1 440 × 900 | 28 332 octets | `04e5ea4c4e30717a2f32051f7238bb3b0e802f4050ab2cc16257c13a901096ba` |
| [`lab-tactical-board-1440x900.webp`](./lab-tactical-board-1440x900.webp) | `/lab/tactical-board` | 1 440 × 900 | 149 476 octets | `416d54b2b087846ea6f9c784c151b0b797ef3a3dd11d31379c16b2f02045436e` |
| [`lab-signal-fantome-1440x900.webp`](./lab-signal-fantome-1440x900.webp) | `/lab/signal-fantome` | 1 440 × 900 | 85 226 octets | `9da7b0d7b6278f0cda18d47adc656ea8667d5d2a488c39fc5f613b4521e14559` |

La recette responsive complémentaire a couvert les largeurs 320, 390, 768,
1 024 et 1 440 px sur les sept pages principales, soit 35 combinaisons. Aucun
débordement horizontal, contenu coupé ou échec de chargement d’image n’a été
observé après les corrections finales.

## Phase 3C — Ghost Signal et mouvement

La recette Phase 3C est conservée dans [`phase3c/`](./phase3c/). Elle est
reproductible avec `npm run build`, puis `npm run capture:portfolio`. Le script
utilise directement le protocole CDP de Chromium et FFmpeg déjà présents sur la
machine ; aucune dépendance de navigateur supplémentaire n’est installée.

- **Date :** 20 juillet 2026
- **Navigateur :** Chromium 150.0.7871.124, SwiftShader WebGL2 en headless
- **Viewport desktop :** 1 440 × 900, DPR 1
- **Viewport mobile :** 390 × 844, DPR 1, profil Ghost Signal Low
- **Reduced motion :** média émulé `prefers-reduced-motion: reduce`
- **Poids total des preuves :** 1 971 571 octets (1,88 Mio)

| Preuve | État vérifié | Dimensions / durée | Poids | SHA-256 |
| --- | --- | ---: | ---: | --- |
| [`ghost-signal-desktop.png`](./phase3c/ghost-signal-desktop.png) | WebGL High prêt, pointeur décalé | 1 440 × 900 | 812 054 octets | `7b2708d26ff2acb99f685c00042869f28ef46e981d70b24b8787b2f62f368e42` |
| [`ghost-signal-mobile-low.png`](./phase3c/ghost-signal-mobile-low.png) | WebGL Low prêt | 390 × 844 | 221 291 octets | `7d4191e475bbca3aecec431d1915c8e406f536974df1d0eb8d2ee8535c2daed4` |
| [`ghost-signal-reduced-motion.png`](./phase3c/ghost-signal-reduced-motion.png) | fallback statique, aucun Canvas | 1 440 × 900 | 782 980 octets | `71b9ead42921b3bb58f08b19bcf6eae5dc67d84b734a214341d6fa80046cae24` |
| [`ghost-signal-hero.webm`](./phase3c/ghost-signal-hero.webm) | profondeur et réponse amortie au pointeur | 3,334 s | 53 331 octets | `8ec6adf65edd9b28e2651a9fba845f92e7e53d4768f87ee619d6d5b451adb9cb` |
| [`portfolio-route-transition.webm`](./phase3c/portfolio-route-transition.webm) | sortie accueil puis entrée Lab | 1,667 s | 97 259 octets | `b81a7d6f799e66218efe5fecd7fa65176482f3b5972c02c91ea99dcec7d88de2` |
| [`browser-audit.json`](./phase3c/browser-audit.json) | ressources, Canvas, cycle de vie et console | — | 4 656 octets | `a4f63cc5ae87eff4425f98374c99df644b5d8bbb85f397b1caf40cdef4292252` |

Le journal de recette confirme : état `ready` sur desktop et mobile, profil
statique sans chargement du chunk Ghost en reduced-motion, pause lorsque le
hero sort du viewport, restauration réussie après perte volontaire du contexte
WebGL et aucune erreur console. Chromium remonte uniquement l’avertissement
amont de dépréciation `THREE.Clock` émis par React Three Fiber avec Three
0.185.1 ; aucun défaut de shader ou exception applicative n’est observé.

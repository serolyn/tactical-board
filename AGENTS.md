# Instructions du dépôt

- Rédiger les commentaires et la documentation en français.
- Employer des noms de code anglais, explicites et cohérents.
- Maintenir une séparation stricte entre `portfolio` et `tactical-board` ; seul le routeur racine peut choisir entre les deux applications.
- Réserver `shared` au code et aux assets réellement utilisés par les deux applications.
- Ne jamais charger IndexedDB hors de `/board`.
- Ne jamais importer Three.js, React Three Fiber ou Motion dans Tactical Board.
- Conserver le plateau en DOM/CSS et les flèches en SVG.
- Préserver les schémas documentaires, migrations, clés de persistance et échanges existants.
- Accompagner toute modification de persistance d’un test ciblé.
- Ne pas ajouter de test pour un changement purement visuel ; maintenir la suite globale sous 40 tests.
- Ne pas ajouter de dépendance sans nécessité démontrée.
- Ne pas créer d’abstraction pour un usage unique et évident.
- Garder les assets locaux, correctement licenciés et documentés dans `docs/DESIGN.md`.
- Ne produire ni capture, ni vidéo, ni rapport de phase sans demande explicite.
- Privilégier une vérification courte et proportionnée, puis valider avec Vitest, TypeScript, Oxlint et le build Vite.
- Maintenir le déploiement et les liens directs compatibles avec le base path GitHub Pages.

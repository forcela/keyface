# CLAUDE.md — Keyface

À lire avant d'éditer. Ce fichier ne garde que ce que le code ne dit pas : pièges, raisons, interdits.
Le code fait foi en cas de divergence — corriger ce fichier dans la même PR.
Stack et versions → `package.json`. Structure du projet → `README.md`. Conventions de contribution → `CONTRIBUTING.md`.

## 0. Une tâche visuelle n'est PAS terminée tant qu'elle n'a pas été regardée dans un vrai navigateur

`ng test` + `ng lint` + `ng build` verts ne prouvent rien sur le rendu : jsdom n'a pas de canvas, les
tests ne voient que des appels enregistrés. Pour tout ce qui touche un style, un template ou une classe
Tailwind :

1. Lancer `pnpm start`, ouvrir la page dans le Browser pane.
2. **Prendre une vraie capture et la regarder**, à taille réelle (interrupteur « Voir les pixels »), en
   clair et en sombre. Un texte ne doit jamais dépasser de sa boîte.
3. Ne jamais écrire « terminé » / « vérifié » sans 1-2. Sans accès navigateur : « non vérifié visuellement ».

Incident réel (prototype) : un pourcentage de batterie dépassait de sa tuile parce que sa position était
écrite en dur au lieu d'être calculée depuis la largeur mesurée du texte.

## 1. Le dessin vit dans `core/render` et ne connaît pas Angular

- Une fonction de dessin reçoit un contexte canvas et une position de boucle `t` dans [0, 1). Rien
  d'autre : pas d'injection, pas de signal, pas d'accès au DOM. C'est ce qui la rend testable.
- **Tout ce qui bouge fait un nombre entier de cycles de `t`** (`sin(TAU * t)`, `mod(…, période)`), sinon
  l'animation saute à chaque tour. Une période de défilement doit égaler la longueur du bouclage
  (bug réel : la neige utilisait `S` comme vitesse et `S + 8` comme période, les flocons se
  téléportaient). Les rares éléments qui repartent volontairement à chaque tour (lunettes qui tombent,
  barre de progression lo-fi) sont signalés par un commentaire.
- **Mesurer le texte (`measureText`) avant de placer ce qui l'entoure.** Jamais de largeur en dur pour
  un libellé qui change (pourcentage, heure, titre saisi).
- Un contour noir se perd sur fond sombre : le perso est posé sur un disque un peu plus clair que le fond.
- Toute valeur numérique passe par `seeded()` (pseudo-aléatoire déterministe), jamais `Math.random()` :
  l'aperçu et l'export doivent donner exactement les mêmes images.

## 2. État et fichiers

- Deux stores `providedIn: 'root'` : `StudioStore` (style, boucle) et `EditorStore` (calques). Les
  composants les lisent, ne les dupliquent pas.
- Le calque est une union discriminée (`layer.model.ts`). Ajouter un type = étendre l'union **et** la
  fabrique, la géométrie, le rendu, les propriétés, et la liste des valeurs autorisées de `style-file.ts`.
- **Un fichier de style est une entrée non fiable** (l'utilisateur peut l'avoir modifié ou reçu d'un
  tiers). `restoreLayers` jette les types inconnus, les champs inconnus et les valeurs hors liste, et
  n'accepte une image que si c'est un `data:image/…`. Ne jamais contourner en copiant l'objet tel quel.
- Une image est stockée en data URL dans le calque (le fichier de style est autonome) et décodée à
  part dans `EditorStore.images`. Les ids de calques sont réattribués à chaque chargement.

## 3. Vérité produit

- **Le clavier ne reçoit pas de données en direct.** L'animation est stockée dedans. L'heure, la
  batterie et tout état (Verr. Maj, connexion) dessinés dans un style sont figés à l'export. Ne jamais
  écrire qu'on peut les afficher en temps réel.
- Limites de l'écran (128 × 128, RGB565, ≈140 images, 2 à 510 ms) = observations de la communauté,
  pas une spec officielle. Les présenter comme telles.
- Le projet est indépendant : ne pas laisser penser qu'il est affilié à Ajazz ou Epomaker.
- Toute affirmation de l'UI ou du README se vérifie. Pas de « compatible avec… » non testé.

## 3bis. Écrire dans un vrai clavier : règles de sécurité

L'envoi (`core/device`) écrit dans la mémoire d'un appareil de l'utilisateur. Un octet faux peut abîmer
ses réglages, donc :

- **Seules les commandes de `ak820-protocol.ts` sont envoyées** (écran et heure : `0x18`, `0x72`, `0x02`,
  `0xf0`, `0x28`). Jamais de touches, de disposition ni d'éclairage, jamais de commande « pour voir ».
  Ne pas ajouter de scanner de commandes ni d'envoi d'octets bruts. Le test `safety` de
  `ak820-session.spec.ts` le vérifie : l'étendre avant d'ajouter une commande, pas après.
- **Un clavier non reconnu n'est jamais écrit** (`ready` exige un modèle connu), même s'il expose les
  mêmes interfaces. Ajouter un modèle = un identifiant observé sur du vrai matériel, pas une supposition.
- Les identifiants USB sont identiques pour toutes les dispositions : on ne peut pas distinguer ISO d'ANSI.
  Le protocole d'envoi a été confirmé par le projet de référence (kabelklaus, MIT) sur un ISO-DE ; les ANSI
  ne sont pas testés. Ne jamais écrire qu'ils sont compatibles.
- **Avant toute écriture, l'utilisateur coche « mon clavier est bien un AK820 Pro ISO (pas ANSI) »** : le bouton
  « Envoyer » reste bloqué sinon. Les identifiants USB ne distinguent pas ISO d'ANSI, donc la page ne peut pas le
  vérifier elle-même. Ne jamais pré-cocher.
- **L'éclairage est un deuxième type d'écriture** (`applyLighting` : `0x18`, `0x13`, paquet de mode, `0x02`). Les
  numéros d'effets sont propres à un clavier (`keyboard-profiles.ts`), le `kind` d'un effet ne l'est pas
  (il pilote l'aperçu). L'aperçu est un dessin approximatif, jamais une promesse de rendu.
- **VIA : lecture + éclairage expérimental** (`core/device/via`). Écriture permise **seulement** par `via-lighting.ts` :
  `set_value` (`0x07`) sur les canaux 1, 2, 3, 5 avec les valeurs luminosité / effet / vitesse / couleur que le canal
  connaît, et `save` (`0x09`) sur un clic « Enregistrer ». Le réglage direct ne touche que la RAM du clavier (QMK
  `_noeeprom`, vérifié dans `via.c`). `isSafeLightingWrite` refuse tout le reste (canal 0, audio, keymap, macros,
  reset, bootloader) et `writeViaLighting` l'appelle avant chaque envoi ; `via-write.spec.ts` le fige. Case de
  consentement « expérimental » obligatoire (`viaConsent`). **Jamais testé sur un vrai clavier VIA** : le dire.
  Les numéros d'effets dépendent du firmware, aucun nom d'effet n'est promis. Pas d'écran via VIA.
  Côté lecture : seules 4 requêtes de lecture existent (version du protocole `0x01`,
  nombre de couches `0x11`, version du firmware `0x02`/`0x04`, éclairage `0x08` sur les canaux 1, 2, 3 et 5 avec la
  valeur « luminosité »). `isSafeRead` refuse tout le reste et la sonde l'appelle avant chaque envoi ; ses tests
  nomment les commandes d'écriture (`0x03`, `0x05`, `0x06`, `0x07`, `0x09`, `0x0a`, `0x0b`, `0x0f`, `0x10`, `0x13`,
  `0x15`). Ne jamais interroger le canal 0 (propre au clavier). La détection d'éclairage VIA est **indicative** : le
  clavier ne peut pas dire « voici mon éclairage », seules des définitions JSON de modèle le font. Vial n'est pas géré.
  Écrire sur un clavier VIA demande une fiche de modèle vérifiée sur du vrai matériel, comme pour l'AK820.
- **LampArray (page 0x59) = détection seulement** : `lampArray` dit qu'un clavier annonce l'interface, rien n'est lu ni
  envoyé. Les numéros de rapports viennent du descripteur de chaque appareil, jamais en dur. Le plan et ses sources
  (vérifié / non vérifié) sont dans `docs/PLAN.md` : le relire avant d'ajouter une famille de claviers.
- **Un clavier = une fiche** (`KeyboardProfile`) : identifiants USB, capacités (rétroéclairage, écran), niveau de
  preuve, dispositions confirmées. Ajouter un modèle = une fiche (+ un pilote si le protocole diffère), avec des
  observations sur du vrai matériel. Pas de fiche = jamais d'écriture.
- Un envoi s'ouvre sur une confirmation explicite, se déclenche sur un clic, et ferme toujours les
  interfaces (même après une erreur ou une annulation).
- Les sources communautaires se contredisent sur trois octets (variantes A et B). Tant qu'une variante
  n'est pas prouvée sur du matériel, les deux restent proposées.
- **Rien de ceci ne se vérifie sans clavier** : les tests utilisent un faux appareil. Écrire « non testé
  sur un vrai clavier » tant que ce n'est pas le cas.

## 4. Conventions Angular (lint-enforced — `pnpm lint` doit rester vert)

- `ChangeDetectionStrategy.OnPush` explicite sur **tout** composant. Sélecteur `kf-`.
- `inject()` en champ, jamais d'injection par constructeur. Le constructeur sert aux `effect()`.
- Signals partout : `input()` / `output()` / `model()` / `viewChild()`. Pas de décorateurs.
- `@if` / `@for` (avec `track`) / `@switch`, jamais `*ngIf` / `*ngFor`.
- Un `output()` ne porte jamais le nom d'un événement DOM natif.
- **Pas de classe Tailwind à crochets dans `[class.xxx]`** (`[class.py-[7px]]` ne compile pas) : passer
  par une chaîne `[class]` calculée.
- Tailwind dans le template d'abord ; CSS global seulement pour la chrome native (`input[type=range]`,
  pseudo-éléments), en bas de `src/styles.css`.
- Cible ~140 lignes par fichier (`.ts` et `.html` comptés séparément). Un tableau statique de plus de
  ~20 lignes va dans un `*.constants.ts` frère.
- **Chercher (Grep) un composant ou un utilitaire avant d'en créer un** : `shared/ui/*`,
  `core/render/canvas.utils.ts`. Extraire à la 3ᵉ répétition réelle (les boutons-icônes de la liste de
  calques l'ont justifié).
- Pas de code mort, pas de bloc commenté « au cas où » — git garde l'historique.

## 5. Tests et build

- Avant de dire une tâche finie : `pnpm check` (tests avec couverture, lint, build de production).
- Plancher de couverture : **70 % de lignes sur `src/app/core`** (`angular.json`). Le build échoue
  en dessous.
- jsdom n'a ni `canvas` ni `OffscreenCanvas` : utiliser `src/testing/recording-context.ts`. Ce faux
  contexte enregistre les appels ; il prouve qu'un style se dessine sans exception et sans NaN, et que
  décor et effets bouclent. **Il ne prouve pas que le résultat est beau** (cf. §0).
- `tsc --noEmit` ne vérifie pas les templates : un `ng build` complet est nécessaire après avoir touché
  un `.html`.
- Un changement de perf ou de config dont l'effet n'est pas mesuré ne reste pas. Exemple réel : redessiner
  les vignettes moins souvent « pour accélérer l'export » — l'export prenait ~1 s pour 48 images, rien
  à gagner, rien n'a été changé.

## 6. Dépendances

- Une dépendance runtime pas nécessaire au premier rendu se charge en `import()` (cf. `jszip`, chargé
  à l'export), et s'ajoute à `allowedCommonJsDependencies` si elle est en CommonJS.
- Les polices sont embarquées (`@fontsource/*`) : le canvas dessine le texte avec elles, elles doivent
  être présentes hors ligne.
- **Check version stable à chaque tâche d'architecture** : avant de proposer une refonte ou un choix de
  stack, vérifier s'il existe une version stable plus récente (Angular, Node LTS, dépendance majeure) et
  le signaler dans une section dédiée. Ne jamais upgrader sans consigne explicite.

## 7. Known gaps

- L'interface est en français uniquement (pas d'i18n).
- `ExportService`, `KeyboardService`, `decode-image`, `AnimationClock` et `FrameRenderer` n'ont pas de
  test dédié (ils dépendent du canvas, de WebHID ou de `requestAnimationFrame`) : à vérifier dans le
  navigateur, et pour le clavier sur un vrai appareil.
- L'envoi direct n'a **jamais** été essayé sur un vrai clavier.
- La taille d'écran est une constante (`SCREEN_SIZE`) : un autre clavier demande d'en faire un réglage.

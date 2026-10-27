# Plan de Keyface : un seul clavier pour l'instant, une base prête pour d'autres

Ce document dit où on en est, ce que les recherches ont montré, et ce qu'on fait ensuite. Chaque affirmation
est marquée **[vérifié]** (lu dans une source primaire : code QMK, code Chromium, spec USB) ou **[non vérifié]**.

## 1. Où on en est

- Un seul clavier réel connu : **Ajazz / Epomaker AK820 Pro, disposition ISO**. Il n'est **pas encore arrivé** :
  rien de l'envoi (écran, éclairage, heure) n'a été essayé sur un vrai clavier.
- Fonctionne dans le navigateur : éditeur d'écran, aperçu de l'éclairage, export `.zip`.
- Écrit dans le clavier (bêta, non testé) : écran, éclairage, heure, pour l'AK820 Pro uniquement.
- Lit sans écrire : claviers **VIA** (version du protocole, couches, firmware, éclairage détecté) ; détecte les
  claviers qui annoncent **LampArray** (standard « Éclairage dynamique »).

## 2. Ce que les recherches ont montré

**Il n'existe pas de standard unique qui règle tous les claviers de la même façon.**

| Famille | Statut | Marques |
| --- | --- | --- |
| VIA / QMK (page 0xFF60, usage 0x61, paquets de 32 octets) | Protocole ouvert **[vérifié]**, le plus proche d'un standard pour les claviers « custom ». | Keychron, Lemokey, certains Epomaker, claviers DIY. Akko, MonsGeek, Ajazz : **[non vérifié]**, à considérer fermés. |
| HID LampArray (page 0x59) | Vrai standard USB **[vérifié]**, soutenu par Windows. Seulement sur les claviers dont le firmware l'a. Pas d'écran, pas d'effets propres à la marque, numéros de rapports propres à chaque appareil. | Surtout le gaming (Razer, Logitech, ASUS ROG, HP/HyperX d'après Microsoft **[vérifié]**) ; modèles précis **[non vérifié]**. |
| Protocoles propres à une marque | Un pilote par marque. OpenRGB et SignalRGB sont des collections de pilotes, pas un standard **[vérifié]**. | Sonix/AK820 (nous), Wooting, Logitech HID++, Razer, Corsair, SteelSeries. |

Autres résultats :

- « Les marques fermées interdisent WebHID » est **faux [vérifié]** : la liste de blocage de Chromium ne contient
  aucune de ces marques. Elle bloque les clés de sécurité, quelques appareils, et l'interface « clavier standard »
  d'un appareil. Le réglage passe par une interface propre au constructeur, qui reste ouverte.
- Des outils web officiels en WebHID existent **[vérifié]** : Wootility Web, Keychron Launcher.
- Logitech (HID++ 2.0) : numéros de fonctions d'éclairage lus dans le projet communautaire Solaar **[vérifié]**,
  aucune doc officielle trouvée.
- Les identifiants VIA de la note de Google étaient faux **[vérifié]** contre le code QMK.
- Pour un clavier VIA, la liste de ses effets n'est pas lisible sur le clavier : elle vient d'un fichier de
  définition par modèle (dépôt GPL-3.0, licence à vérifier avant tout usage) **[vérifié]**.
- Aucune preuve que d'autres claviers Sonix (AK680, AK870, etc.) partagent le protocole de l'AK820 **[non trouvé]**.

## 3. Alerte : deux familles de firmware AK820 ?

Un dépôt communautaire affirme que l'AK820 Pro existe en deux familles de firmware, distinguées par leurs
interfaces USB et non par l'identifiant (A : contrôle 0xFF68 / affichage 0xFF67 ; B : contrôle 0xFF13 / données
0xFF68), et classe le modèle ISO-DE en famille A. Deux autres dépôts et notre référence placent le contrôle sur
0xFF13. **Ces sources se contredisent et rien ne les départage sans clavier [non vérifié].**

Ce que fait déjà Keyface : il n'écrit que si les interfaces 0xFF13 **et** 0xFF68 sont visibles. Si le clavier
expose autre chose, il affiche « Incomplet » et n'écrit rien. Sûr, mais l'envoi pourrait ne pas fonctionner.

## 4. Architecture cible : un pilote par protocole, une fiche par clavier

```
fiche (KeyboardProfile)  →  ce que ce modèle sait faire + niveau de preuve
pilote (driver)          →  comment parler à une famille (Sonix-AK, VIA, LampArray, Wooting, HID++)
détection                →  lit seulement les interfaces USB annoncées (jamais d'envoi)
```

Règles qui ne bougent pas (détail dans `CLAUDE.md` §3bis) :

1. Pas de fiche = jamais d'écriture.
2. Une fiche vient d'une **observation sur du vrai matériel** : identifiant USB, liste des interfaces, test de
   chaque commande, disposition, testeur nommé. « Compatible » écrit dans un README ne suffit pas.
3. Seules les commandes listées sont envoyables ; confirmation explicite avant chaque écriture ; clic de
   l'utilisateur ; interfaces refermées après, même en cas d'erreur.
4. Écrire en mémoire flash une seule fois, sur « Appliquer », jamais à chaque mouvement de curseur.

## 5. Objectif : écrire sur tous les claviers, marque par marque

Lecture seule = inutile pour un éditeur. Le but est de **piloter** les claviers. On avance marque par marque,
en commençant par ce qui est le plus facile et le mieux documenté. Ce qui est trop dur est **sauté et noté ici**.

Pourquoi on peut écrire sans clavier de test, mais avec des garde-fous : pour VIA, le réglage direct (sans
sauvegarde) ne touche que la RAM du clavier (`_noeeprom` dans le code QMK **[vérifié]**) ; un débranchement
remet l'état d'avant. La sauvegarde en mémoire n'a lieu que sur un clic « Enregistrer sur le clavier ».

| # | Marque / famille | Voie | Difficulté | Décision |
| --- | --- | --- | --- | --- |
| 0 | Ajazz AK820 Pro | pilote Sonix-AK | fait (bêta) | Attend le clavier pour valider. |
| 1 | **Keychron, Lemokey** | VIA (firmware QMK) | facile | **Prochaine étape.** Réglage direct des canaux 1/2/3/5 + enregistrer sur clic. Effets : liste générique QMK, à confirmer par modèle. |
| 2 | **Epomaker** | VIA sur certains modèles (non vérifié) ; Sonix-AK sur l'AK820 ; le reste est propriétaire (hub.epomaker.com) | facile à moyen | Les modèles VIA passent par la voie 1. Les autres : on relève leurs interfaces (diagnostic) avant tout. |
| 3 | **Acer, ASUS (ROG), HP/HyperX, Razer (modèles LampArray)** | LampArray (standard) | moyen | Un seul pilote, générique : lire le descripteur de rapports, jamais d'identifiants en dur. Windows requis côté firmware ; modèles précis non vérifiés. |
| 4 | Akko, MonsGeek | propriétaire fermé | difficile | **Sauté** pour l'instant. Piste : inspecter le bundle de leur driver web (aucun accès clavier nécessaire). |
| 5 | Logitech | HID++ 2.0 (doc communautaire Solaar) | moyen à difficile | Après 1–3. Sans-fil et récepteur compliquent. Nécessite un clavier Logitech. |
| 6 | Wooting | protocole propre, Wootility Web prouve WebHID | difficile | Après Logitech. Protocole d'éclairage non documenté dans ce qu'on a trouvé. |
| 7 | Razer (hors LampArray) | Chroma, paquets de 90 octets (openrazer) | difficile | Sauté : modèles et CRC propres à chacun. |
| 8 | Corsair, SteelSeries | aucun outil web, aucune doc trouvée | très difficile | **Sauté**, noté. |

Garde-fous communs à toute écriture sur un modèle pas encore vu en vrai :

1. Écriture marquée **expérimentale** dans l'interface, case à cocher explicite avant envoi.
2. Seules les commandes d'éclairage de la liste blanche du pilote ; test automatique qui fige cette liste.
3. Lecture de l'état avant d'écrire, pour pouvoir le remettre.
4. Jamais : canal 0 de VIA, réinitialisation de la mémoire, saut en bootloader, touches, macros.
5. Rapport de ce qui a marché sur un vrai clavier → la fiche passe de « expérimental » à « confirmé ».

**À l'arrivée du clavier AK820** (rien n'est validable avant) :

1. Brancher en USB, mode filaire, « Avancé → Copier le diagnostic » : donne l'identifiant et les interfaces
   réelles. Tranche la question des deux familles.
2. Tester l'heure, puis l'éclairage, puis l'écran (variante A, sinon B). Noter ce qui marche.
3. Mettre à jour la fiche (`evidence: 'hardware'`) et retirer « non testé » seulement pour ce qui a marché.

**Autres chantiers** : sélecteur de plusieurs claviers, interface en anglais.

## 6. Ce qu'on ne fait pas

- Pas de scanner de commandes ni d'envoi d'octets bruts « pour voir ».
- Pas de support annoncé pour un clavier qu'on n'a pas vu fonctionner.
- Pas de copie des définitions VIA dans le dépôt sans avoir vérifié leur licence.

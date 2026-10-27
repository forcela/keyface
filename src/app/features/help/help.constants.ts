export const REPO_URL = 'https://github.com/forcela/keyboard-screen-studio';

export interface OfficialTool {
  label: string;
  url: string;
  kind: 'En ligne' | 'Windows';
}

/** Epomaker's own tools for the AK820 Pro, as listed on its software pages (checked 2026-10-27). */
export const OFFICIAL_TOOLS: readonly OfficialTool[] = [
  { label: 'Outil en ligne Ajazz', url: 'https://ajazz.driveall.cn/#/', kind: 'En ligne' },
  { label: 'ISO-ES : outil en ligne', url: 'https://a-jazz-es.driveall.cn', kind: 'En ligne' },
  { label: 'ANSI : application Windows', url: 'https://epomaker.com/blogs/software/ajazz-ak820-pro-driver', kind: 'Windows' },
];

export const INSTALL_STEPS: readonly string[] = [
  'Exporte le .zip et décompresse-le : frame_000.png, frame_001.png…',
  'Branche le clavier avec le câble USB, interrupteur en mode filaire.',
  'Ouvre l\'outil officiel de ton modèle : une page web dans Chrome ou Edge pour les versions ISO, une application Windows pour l\'ANSI.',
  'Dans la partie écran (TFT), importe toutes les images d\'un coup, puis envoie-les au clavier.',
  'Écran noir ? Réessaie avec moins d\'images (24 à 60). Fn + Suppr bascule entre ton animation et l\'horloge.',
];

export const INSTALL_DISCLAIMER =
  'Les noms exacts des boutons changent selon l\'outil et sa version : je n\'ai pas pu tester celui de ton clavier.';

export interface ScreenFact {
  tag: 'Oui' | 'Non' | 'Libre';
  text: string;
}

export const SCREEN_FACTS: readonly ScreenFact[] = [
  { tag: 'Oui', text: 'Animation perso jusqu\'à ≈140 images, 2 à 510 ms chacune (observé par la communauté)' },
  { tag: 'Non', text: 'Affichage en direct depuis le PC : l\'animation est stockée dans le clavier' },
];

export const COMMUNITY_PROJECTS: readonly { name: string; url: string }[] = [
  { name: 'open-ak820-pro', url: 'https://github.com/anthonymolinam/open-ak820-pro' },
  { name: 'ak820-linux', url: 'https://github.com/hcristosm/ak820-linux' },
  { name: 'ak820pro-modder', url: 'https://github.com/wsclx/ak820pro-modder' },
];

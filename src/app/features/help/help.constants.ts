export const DRIVER_URL = 'https://epomaker.com/blogs/software/ajazz-ak820-pro-driver';
export const REPO_URL = 'https://github.com/forcela/keyboard-screen-studio';

export const INSTALL_STEPS: readonly string[] = [
  'Exporte le .zip et décompresse-le : frame_000.png, frame_001.png…',
  'Branche le clavier avec le câble USB, interrupteur en mode filaire. Sans fil, l\'option écran n\'apparaît pas.',
  'Ouvre le pilote AK820 Pro (version ISO), onglet TFT, puis New et +.',
  'Sélectionne toutes les images d\'un coup, valide, envoie.',
  'Écran noir ? Réessaie avec moins d\'images (24 à 60). Fn + Suppr bascule entre ton animation et l\'horloge.',
];

export interface ScreenFact {
  tag: 'Oui' | 'Non' | 'Libre';
  text: string;
}

export const SCREEN_FACTS: readonly ScreenFact[] = [
  { tag: 'Oui', text: 'Animation perso jusqu\'à ≈140 images, 2 à 510 ms chacune' },
  { tag: 'Oui', text: 'Synchro de l\'heure depuis le pilote (TFT → Time Sync)' },
  { tag: 'Non', text: 'Affichage en direct depuis le PC : l\'animation est stockée dans le clavier' },
];

export const COMMUNITY_PROJECTS: readonly { name: string; url: string }[] = [
  { name: 'open-ak820-pro', url: 'https://github.com/anthonymolinam/open-ak820-pro' },
  { name: 'ak820-linux', url: 'https://github.com/hcristosm/ak820-linux' },
  { name: 'ak820pro-modder', url: 'https://github.com/wsclx/ak820pro-modder' },
];

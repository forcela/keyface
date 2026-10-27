/**
 * Pixel-art sprites, one string per row, one character per pixel. `.` is transparent;
 * every other character is a key of the matching palette. All sprites are 14 px wide.
 */
export type Sprite = readonly string[];
export type Palette = Readonly<Record<string, string>>;

export const CAT: Sprite = [
  '..k........k..',
  '.kok......kok.',
  '.kpok....kopk.',
  '.kppokkkkoppk.',
  'koooodoodooook',
  'kooooooooooook',
  'koheooooooheok',
  'koeeooooooeeok',
  'kpowwwppwwwopk',
  'koowwkwwkwwook',
  'kooowwkkwwoook',
  '.kooooooooook.',
  '.kodoowwoodok.',
  'kooodowwodoook',
  'kooowwwwwwoook',
  'kowwkooookwwok',
  '.kkkkkkkkkkkk.',
];
export const CAT_COLORS: Palette = {
  k: '#000000',
  o: '#8a909b',
  d: '#686d77',
  w: '#d4d8df',
  p: '#c97f8b',
  e: '#000000',
  h: '#ffffff',
};

export const GHOST: Sprite = [
  '....kkkkkk....',
  '..kkoooooodk..',
  '.kooooooooodk.',
  'kooooooooooodk',
  'kooooooooooodk',
  'kooooooooooodk',
  'koeeooooeeoodk',
  'koeeooooeeoodk',
  'kobooooooboodk',
  'koooookkoooodk',
  'kooooooooooodk',
  'kooooooooooodk',
  'kooooooooooodk',
  'kook.kook.kook',
  '.kk...kk...kk.',
];
export const GHOST_COLORS: Palette = { k: '#000000', o: '#eef1f6', d: '#c3c9d4', e: '#000000', b: '#f2a7b6' };

export const FROG: Sprite = [
  '..kkk....kkk..',
  '.kwwek..kwwek.',
  '.kwwek..kwwek.',
  'kggggggggggggk',
  'kggggggggggggk',
  'kgpggggggggpgk',
  'kggkggggggkggk',
  'kgggkkkkkkgggk',
  'kgllllllllllgk',
  'kgllllllllllgk',
  '.kgllllllllgk.',
  'kggkggggggkggk',
  'kkk..kkkk..kkk',
];
export const FROG_COLORS: Palette = {
  k: '#000000',
  g: '#79c267',
  l: '#d3ebab',
  w: '#ffffff',
  e: '#000000',
  p: '#ec9696',
};

/** Sunglasses, aligned on the eye row (row 6) of 14-px-wide sprites. */
export const SHADES: Sprite = ['.gggggggggggg.', '.gwwggggwwggg.', '.gwgggg.gwggg.', '..ggg....ggg..'];
export const SHADES_COLORS: Palette = { g: '#000000', w: '#ffffff' };

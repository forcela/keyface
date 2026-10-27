import { BacklightCapability, LightEffect } from '@core/lighting/lighting.model';

/**
 * A keyboard model this project knows: how to recognise it, what it can do, and how well that is
 * established. A keyboard with no profile is never written to. Adding a model means adding a profile
 * here (and a driver if its family speaks a different protocol).
 */

export type Layout = 'iso' | 'ansi';
export type DriverId = 'ak820';
/** `community`: described by projects that reverse-engineered the vendor tool. `hardware`: tried by this project. */
export type Evidence = 'community' | 'hardware';

export interface ScreenCapability {
  width: number;
  height: number;
  maxFrames: number;
}

export interface KeyboardProfile {
  id: string;
  name: string;
  /** `vvvv:pppp`, lowercase hex. */
  usbIds: readonly string[];
  driver: DriverId;
  capabilities: { screen?: ScreenCapability; backlight?: BacklightCapability };
  evidence: Evidence;
  /** Layouts the write sequences were confirmed on. USB ids do not tell layouts apart. */
  confirmedLayouts: readonly Layout[];
}

/** The 20 modes of the AK820 Pro, with the mode numbers the keyboard expects. Labels are ours. */
const AK820_EFFECTS: readonly LightEffect[] = [
  { id: 0x00, kind: 'off', label: 'Éteint', usesColor: false, usesDirection: false },
  { id: 0x01, kind: 'static', label: 'Fixe', usesColor: true, usesDirection: false },
  { id: 0x02, kind: 'key-on', label: 'Touche allumée', usesColor: true, usesDirection: false },
  { id: 0x03, kind: 'key-off', label: 'Touche éteinte', usesColor: true, usesDirection: false },
  { id: 0x04, kind: 'glitter', label: 'Scintillement', usesColor: true, usesDirection: false },
  { id: 0x05, kind: 'falling', label: 'Chute', usesColor: true, usesDirection: false },
  { id: 0x06, kind: 'colourful', label: 'Multicolore', usesColor: false, usesDirection: false },
  { id: 0x07, kind: 'breathe', label: 'Respiration', usesColor: true, usesDirection: false },
  { id: 0x08, kind: 'spectrum', label: 'Spectre', usesColor: false, usesDirection: false },
  { id: 0x09, kind: 'outward', label: 'Vers l’extérieur', usesColor: true, usesDirection: false },
  { id: 0x0a, kind: 'scroll', label: 'Défilement', usesColor: true, usesDirection: true },
  { id: 0x0b, kind: 'roll', label: 'Rouleau', usesColor: false, usesDirection: true },
  { id: 0x0c, kind: 'rotate', label: 'Rotation', usesColor: false, usesDirection: false },
  { id: 0x0d, kind: 'explode', label: 'Explosion', usesColor: true, usesDirection: false },
  { id: 0x0e, kind: 'launch', label: 'Lancement', usesColor: true, usesDirection: false },
  { id: 0x0f, kind: 'ripple', label: 'Ondes', usesColor: true, usesDirection: false },
  { id: 0x10, kind: 'flow', label: 'Flux', usesColor: false, usesDirection: true },
  { id: 0x11, kind: 'pulse', label: 'Pulsation', usesColor: true, usesDirection: false },
  { id: 0x12, kind: 'tilt', label: 'Inclinaison', usesColor: true, usesDirection: true },
  { id: 0x13, kind: 'shuttle', label: 'Navette', usesColor: true, usesDirection: true },
];

export const AK820_PRO: KeyboardProfile = {
  id: 'ajazz-ak820-pro',
  name: 'Ajazz AK820 Pro',
  usbIds: ['0c45:8009', '0c45:800a'],
  driver: 'ak820',
  capabilities: {
    screen: { width: 128, height: 128, maxFrames: 140 },
    backlight: { effects: AK820_EFFECTS, brightnessMax: 5, speedMax: 5 },
  },
  evidence: 'community',
  // The reference project was confirmed on an ISO-DE model. ISO-FR and ANSI are not tried here.
  confirmedLayouts: ['iso'],
};

export const PROFILES: readonly KeyboardProfile[] = [AK820_PRO];

export const findProfile = (usbId: string): KeyboardProfile | null =>
  PROFILES.find((profile) => profile.usbIds.includes(usbId)) ?? null;

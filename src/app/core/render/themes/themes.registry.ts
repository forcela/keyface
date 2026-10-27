import { customTheme } from './custom.theme';
import { genzTheme } from './genz.theme';
import { landscapeTheme } from './landscape.theme';
import { lofiTheme } from './lofi.theme';
import { minimalTheme } from './minimal.theme';
import { LoopDefaults, ThemeId } from './theme.model';

export interface ThemeSummary {
  id: ThemeId;
  name: string;
  description: string;
  defaults: LoopDefaults;
}

/** Display order of the style picker. */
export const THEMES: readonly ThemeSummary[] = [minimalTheme, landscapeTheme, genzTheme, lofiTheme, customTheme];

export const themeById = (id: ThemeId): ThemeSummary => THEMES.find((theme) => theme.id === id) ?? minimalTheme;

/**
 * Global Color Tokens for the game's UI system.
 * Matches the game's true UI art style (Almanac theme).
 */

export type ColorRGBA = [number, number, number, number];

export const color = {
  // Whites & Yellows
  white: (a = 255): ColorRGBA => [255, 255, 255, a],
  veryLightYellow: (a = 255): ColorRGBA => [255, 246, 176, a],
  lightYellow: (a = 255): ColorRGBA => [255, 237, 88, a],
  yellow: (a = 255): ColorRGBA => [255, 194, 0, a],
  darkYellow: (a = 255): ColorRGBA => [255, 132, 0, a],

  // Greens
  lightGreen: (a = 255): ColorRGBA => [56, 255, 135, a],
  green: (a = 255): ColorRGBA => [0, 105, 65, a],
  darkGreen: (a = 255): ColorRGBA => [10, 49, 32, a],

  // Reds
  lightRed: (a = 255): ColorRGBA => [255, 100, 100, a],
  red: (a = 255): ColorRGBA => [255, 56, 60, a],

  // Blues & UI Container Hierarchy (Almanac Art Style)
  lightBlue: (a = 255): ColorRGBA => [54, 62, 114, a],     // Borders, Active Tabs, Accents
  blue: (a = 255): ColorRGBA => [40, 47, 96, a],            // Hover highlights, secondary frames
  panelBlue: (a = 255): ColorRGBA => [27, 31, 57, a],      // Main Modal Container Background
  darkBlue: (a = 255): ColorRGBA => [19, 21, 44, a],        // Inactive Tabs, Dark Cards, Sub-panels
  veryDarkBlue: (a = 255): ColorRGBA => [12, 12, 27, a],    // Inset panels, Input backgrounds

  // Cyans & Purples
  cyan: (a = 255): ColorRGBA => [0, 231, 226, a],
  lightPurple: (a = 255): ColorRGBA => [133, 85, 196, a],
  purple: (a = 255): ColorRGBA => [99, 34, 151, a],

  // Grays
  lightGray: (a = 255): ColorRGBA => [210, 215, 225, a],
  gray: (a = 255): ColorRGBA => [175, 180, 195, a],
  darkGray: (a = 255): ColorRGBA => [110, 115, 130, a],

  // Blacks
  black: (a = 255): ColorRGBA => [0, 0, 0, a]
};

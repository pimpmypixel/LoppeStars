import * as eva from '@eva-design/eva';
import customTheme from './custom-theme.json';

export const lightTheme = {
  ...eva.light,
  ...customTheme,
};

export const darkTheme = {
  ...eva.dark,
  ...customTheme,
};

// Meetup-inspired mapping
export const mapping = eva.mapping;

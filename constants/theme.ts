/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#D4AF37'; // Ouro antigo (mais neutro)
const tintColorDark = '#C9A961'; // Ouro fosco

export const Colors = {
  light: {
    text: '#D4AF37', // Ouro antigo para texto
    background: '#0F0F0F', // Cinza muito escuro (mais suave que preto)
    tint: tintColorLight,
    icon: '#FF8C42', // Laranja suave
    tabIconDefault: '#E67E22', // Laranja médio
    tabIconSelected: tintColorLight,
    // Cores adicionais para customização
    primary: '#D4AF37', // Ouro antigo
    secondary: '#D2691E', // Chocolate (laranja escuro)
    accent: '#FF7F50', // Coral (laranja claro)
    button: '#FF6B35', // Laranja vibrante para botões
    surface: '#1E1E1E', // Cinza escuro para superfícies
  },
  dark: {
    text: '#D4AF37', // Ouro antigo para texto no modo escuro
    background: '#0F0F0F', // Cinza muito escuro (mais suave que preto)
    tint: tintColorDark,
    icon: '#FF8C42', // Laranja suave
    tabIconDefault: '#E67E22', // Laranja médio
    tabIconSelected: tintColorDark,
    // Cores adicionais para customização
    primary: '#C9A961', // Ouro fosco
    secondary: '#D2691E', // Chocolate (laranja escuro)
    accent: '#FF7F50', // Coral (laranja claro)
    button: '#FF6B35', // Laranja vibrante para botões
    surface: '#1E1E1E', // Cinza escuro para superfícies
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

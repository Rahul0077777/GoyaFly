// Centralized theme colors helper for all screens
// Usage: const t = useThemeColors();  then use t.bg, t.card, t.text, etc.

import { useAppTheme } from '../context/ThemeContext';

export function useThemeColors() {
    const { colorScheme, toggleTheme } = useAppTheme();
    const isDark = colorScheme === 'dark';

    return {
        isDark,
        toggleTheme,
        // Backgrounds
        bg: isDark ? '#0f172a' : '#f4f7fe',
        card: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#f3f4f6',
        input: isDark ? '#0f172a' : '#f9fafb',
        inputBorder: isDark ? '#334155' : '#f3f4f6',
        // Text
        text: isDark ? '#f1f5f9' : '#111827',
        textSecondary: isDark ? '#94a3b8' : '#6b7280',
        textMuted: isDark ? '#64748b' : '#9ca3af',
        textInvert: isDark ? '#0f172a' : '#ffffff',
        // Dividers
        divider: isDark ? '#1e293b' : '#f3f4f6',
        // Status bar
        statusBar: isDark ? 'light' : 'dark',
        // Brand
        primary: '#1D4171',
        secondary: '#F07E21',
        accent: '#48A0D4',
        // Placeholder
        placeholder: isDark ? '#475569' : '#9ca3af',
    };
}

/**
 * next-themes ThemeProvider wrapper. SSR 시 system → resolvedTheme 결정 깜빡임을
 * 막기 위해 attribute='class' + suppressHydrationWarning을 root에 함께 적용한다.
 *
 * (next-themes는 Next.js 전용이 아니라 React 환경에서 동작.)
 */

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

/**
 * Common breakpoint values for responsive design
 * These match the tailwind breakpoints and can be used in media queries
 */
export const breakpoints = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Media query strings for common breakpoints
 * Example usage: 
 * const Component = styled.div`
 *   color: blue;
 *   ${mediaQueries.md} {
 *     color: red;
 *   }
 * `;
 */
export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
} as const;

/**
 * Common device types with their respective breakpoints
 */
export const devices = {
  mobile: { min: 0, max: breakpoints.md - 1 },
  tablet: { min: breakpoints.md, max: breakpoints.lg - 1 },
  desktop: { min: breakpoints.lg, max: Infinity },
} as const;

/**
 * CSS classes for hiding elements at different breakpoints
 * Can be used with className prop
 */
export const hideAt = {
  xs: 'hidden xs:block',
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
  xl: 'hidden xl:block',
  '2xl': 'hidden 2xl:block',
  mobile: 'hidden md:block',
  desktop: 'md:hidden',
} as const;

/**
 * CSS classes for showing elements at different breakpoints
 * Can be used with className prop
 */
export const showAt = {
  xs: 'xs:hidden block',
  sm: 'sm:hidden block',
  md: 'md:hidden block',
  lg: 'lg:hidden block',
  xl: 'xl:hidden block',
  '2xl': '2xl:hidden block',
  mobile: 'md:hidden block',
  desktop: 'hidden md:block',
} as const;

/**
 * Tailwind CSS spacing utility that adjusts based on screen size
 * 
 * @param mobile - The mobile value (default)
 * @param desktop - The desktop value
 * @returns A string with both values together
 */
export function responsiveSpacing(mobile: number, desktop: number): string {
  if (mobile === desktop) {
    return `p-${mobile}`;
  }
  return `p-${mobile} md:p-${desktop}`;
}

/**
 * Helper function to generate classes for grid columns at different breakpoints
 * 
 * @param columns - Object with breakpoint keys and column count values
 * @returns A string with combined class names
 */
export function gridCols(columns: { 
  xs?: number;
  sm?: number; 
  md?: number; 
  lg?: number; 
  xl?: number; 
  '2xl'?: number; 
}): string {
  const classes: string[] = [];
  
  // Default grid
  classes.push(`grid-cols-1`);
  
  // Add breakpoint specific classes
  if (columns.xs) classes.push(`xs:grid-cols-${columns.xs}`);
  if (columns.sm) classes.push(`sm:grid-cols-${columns.sm}`);
  if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
  if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
  if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
  if (columns['2xl']) classes.push(`2xl:grid-cols-${columns['2xl']}`);
  
  return classes.join(' ');
}

/**
 * Helper function to generate responsive gap classes
 * 
 * @param gaps - Object with breakpoint keys and gap values
 * @returns A string with combined class names
 */
export function responsiveGap(gaps: {
  base?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
}): string {
  const classes: string[] = [];
  
  // Default gap
  if (gaps.base !== undefined) classes.push(`gap-${gaps.base}`);
  
  // Add breakpoint specific classes
  if (gaps.xs !== undefined) classes.push(`xs:gap-${gaps.xs}`);
  if (gaps.sm !== undefined) classes.push(`sm:gap-${gaps.sm}`);
  if (gaps.md !== undefined) classes.push(`md:gap-${gaps.md}`);
  if (gaps.lg !== undefined) classes.push(`lg:gap-${gaps.lg}`);
  if (gaps.xl !== undefined) classes.push(`xl:gap-${gaps.xl}`);
  if (gaps['2xl'] !== undefined) classes.push(`2xl:gap-${gaps['2xl']}`);
  
  return classes.join(' ');
} 
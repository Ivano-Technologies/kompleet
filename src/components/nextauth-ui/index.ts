/**
 * NextAuth-style UI Component Library
 * 
 * Pixel-perfect implementation of NextAuth.js design language
 * with Nigerian green (#008751) accents.
 * 
 * Design principles:
 * - Extreme minimalism (flat design, no shadows, no glassmorphism)
 * - High contrast (pure black/white backgrounds)
 * - Bold typography (Inter font, heavy weights)
 * - Color discipline (Nigerian green for primary actions only)
 * - Generous spacing (64-96px gaps)
 * - Subtle interactions (200ms transitions)
 */

// Components
export { Button, type ButtonProps } from './Button';
export { Card, CardHeader, CardTitle, CardContent, type CardProps } from './Card';
export { Input, Textarea, type InputProps, type TextareaProps } from './Input';

// Layout
export { Container, type ContainerProps } from './Container';
export { Navigation, Logo, type NavigationProps, type NavLink, type LogoProps } from './Navigation';
export { Footer, type FooterProps, type FooterColumn } from './Footer';
export { Section, SectionHeader, type SectionProps, type SectionHeaderProps } from './Section';
export { Grid, type GridProps } from './Grid';
export { Hero, type HeroProps } from './Hero';
export { FloatingLogos, type FloatingLogosProps, type FloatingLogo } from './FloatingLogos';

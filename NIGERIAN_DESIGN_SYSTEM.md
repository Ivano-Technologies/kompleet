# Nigerian-Inspired Design System for KOMPLEET

## Color Palette

### Primary Colors
- **Brand Green:** `#1B5E4F` (Deep professional green - main brand color)
- **Vibrant Green:** `#00A86B` (Nigerian flag green - accent)
- **Forest Green:** `#0D3B2E` (Dark variant for text/headers)

### Accent Colors (Nigerian-Inspired)
- **Sunset Orange:** `#FF6B35` (Energy, warmth - CTA buttons)
- **Golden Yellow:** `#F7B801` (Prosperity, optimism - highlights)
- **Royal Blue:** `#004E89` (Trust, professionalism - secondary actions)
- **Coral Red:** `#E63946` (Alerts, important actions)

### Neutral Colors
- **Cream White:** `#FFF8F0` (Warm background)
- **Soft Beige:** `#F5E6D3` (Card backgrounds)
- **Charcoal:** `#2D3142` (Text)
- **Light Gray:** `#E8E8E8` (Borders)

### Glassmorphism Colors
- **Glass White:** `rgba(255, 255, 255, 0.15)` (Light glass effect)
- **Glass Dark:** `rgba(27, 94, 79, 0.2)` (Green-tinted glass)
- **Glass Accent:** `rgba(255, 107, 53, 0.1)` (Orange-tinted glass)

## Typography

### Font Families
- **Headings:** `'Plus Jakarta Sans', 'Inter', sans-serif` (Bold, modern)
- **Body:** `'Inter', 'Segoe UI', sans-serif` (Clean, readable)
- **Accent:** `'Playfair Display', serif` (For KOMPLEET logo/tagline)

### Font Sizes
- **Hero Title:** `4.5rem` (72px) - Bold 800
- **H1:** `3rem` (48px) - Bold 700
- **H2:** `2.25rem` (36px) - Bold 700
- **H3:** `1.875rem` (30px) - SemiBold 600
- **Body Large:** `1.125rem` (18px) - Regular 400
- **Body:** `1rem` (16px) - Regular 400
- **Small:** `0.875rem` (14px) - Regular 400

## Button Styles

### Primary Button (CTA)
- Background: `linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)`
- Border Radius: `12px`
- Padding: `16px 32px`
- Font Size: `1.125rem`
- Font Weight: `600`
- Shadow: `0 8px 24px rgba(255, 107, 53, 0.3)`
- Hover: Scale `1.05` + Shadow `0 12px 32px rgba(255, 107, 53, 0.4)`

### Secondary Button
- Background: `rgba(255, 255, 255, 0.2)` (Glassmorphism)
- Backdrop Filter: `blur(10px)`
- Border: `2px solid rgba(255, 255, 255, 0.3)`
- Border Radius: `12px`
- Padding: `16px 32px`
- Color: `#FFFFFF`
- Hover: Background `rgba(255, 255, 255, 0.3)`

### Tertiary Button
- Background: Transparent
- Border: `2px solid #1B5E4F`
- Border Radius: `12px`
- Color: `#1B5E4F`
- Hover: Background `#1B5E4F`, Color `#FFFFFF`

## Glassmorphism Components

### Glass Card
```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 24px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### Glass Navigation
```css
background: rgba(27, 94, 79, 0.8);
backdrop-filter: blur(20px);
border-bottom: 1px solid rgba(255, 255, 255, 0.1);
```

### Glass Feature Card
```css
background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
backdrop-filter: blur(15px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 20px;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
```

## Nigerian Cultural Patterns

### Subtle Background Patterns
- **Adire Pattern:** Indigo tie-dye inspired gradient overlay
- **Ankara Geometric:** Subtle repeating triangular/diamond patterns
- **Aso-Oke Texture:** Woven fabric texture as background overlay

### Pattern Implementation
- Opacity: `0.05` to `0.1` (very subtle)
- Use as SVG background or CSS pattern
- Apply to hero sections and large cards

## Spacing & Layout

### Container Max Width
- Desktop: `1280px`
- Tablet: `100%` with `32px` padding
- Mobile: `100%` with `16px` padding

### Section Spacing
- Large: `120px` vertical
- Medium: `80px` vertical
- Small: `48px` vertical

### Card Spacing
- Gap: `24px` between cards
- Padding: `32px` inside cards

## Shadows

### Elevation Levels
- **Level 1:** `0 2px 8px rgba(0, 0, 0, 0.08)`
- **Level 2:** `0 4px 16px rgba(0, 0, 0, 0.12)`
- **Level 3:** `0 8px 24px rgba(0, 0, 0, 0.15)`
- **Level 4:** `0 12px 32px rgba(0, 0, 0, 0.2)`

### Colored Shadows (for emphasis)
- **Green:** `0 8px 24px rgba(27, 94, 79, 0.3)`
- **Orange:** `0 8px 24px rgba(255, 107, 53, 0.3)`
- **Gold:** `0 8px 24px rgba(247, 184, 1, 0.3)`

## Animation & Transitions

### Standard Transitions
- Duration: `300ms`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

### Hover Effects
- Scale: `1.02` to `1.05`
- Shadow: Increase elevation by 1 level
- Opacity: `0.9` for subtle elements

### Page Transitions
- Fade In: `400ms`
- Slide Up: `500ms` with `cubic-bezier(0.16, 1, 0.3, 1)`

## Responsive Breakpoints

- **Mobile:** `< 640px`
- **Tablet:** `640px - 1024px`
- **Desktop:** `> 1024px`
- **Large Desktop:** `> 1440px`

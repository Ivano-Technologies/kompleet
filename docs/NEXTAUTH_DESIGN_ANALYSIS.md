# NextAuth.js Design Language Analysis

**Source:** UIDesignIdeaforKompleet.docx (8 pages of screenshots)  
**Purpose:** Extract design patterns to replicate for KOMPLEET web app redesign  
**Date:** February 8, 2026

---

## Design System Extraction

### Color Palette

**Dark Theme (Primary):**

- Background: Pure black (#000000)
- Surface: Dark gray (#1a1a1a, #2a2a2a)
- Text Primary: White (#FFFFFF)
- Text Secondary: Light gray (#A0A0A0, #808080)
- Accent/CTA: Bright cyan/blue (#00D4FF, #00B8E6)
- Gradient accents: Purple-to-cyan, pink-to-orange, blue-to-green (circular icons)

**Light Theme:**

- Background: White (#FFFFFF)
- Surface: Light gray (#F5F5F5, #FAFAFA)
- Text Primary: Black (#000000)
- Text Secondary: Dark gray (#666666)
- Accent/CTA: Same bright cyan (#00D4FF)
- Subtle background icons: Very light gray (#E0E0E0)

### Typography

**Font Family:**

- Primary: Sans-serif (appears to be Inter, system-ui, or similar modern sans)
- Monospace: For code examples

**Font Sizes & Weights:**

- Hero Heading: ~72px, Bold (900)
- Section Heading: ~48px, Bold (800)
- Subheading: ~32px, Bold (700)
- Body Text: ~16px, Regular (400)
- Small Text: ~14px, Regular (400)
- Footer/Caption: ~12px, Regular (400)

**Line Height:**

- Headings: 1.1-1.2
- Body: 1.5-1.6

### Layout & Spacing

**Container:**

- Max width: ~1200px
- Padding: 40px horizontal on desktop
- Centered content

**Spacing Scale:**

- XS: 8px
- S: 16px
- M: 24px
- L: 40px
- XL: 64px
- XXL: 96px

**Grid:**

- 3-column layout for feature cards
- Equal spacing between columns
- Responsive: stacks to 1-column on mobile

### Components

#### 1. **Navigation Bar (Header)**

- Height: ~64px
- Background: Transparent or solid (depending on scroll)
- Logo: Left-aligned (gradient shield icon + text)
- Nav links: Horizontal, center-aligned
- Right side: Version dropdown, NPM icon, GitHub icon, theme toggle, search
- Sticky on scroll

#### 2. **Hero Section**

- Full viewport height
- Centered content (logo + heading + tagline + CTA buttons)
- Large gradient logo/icon
- Heading: Extra large, bold
- Tagline: Medium size, gray
- CTA buttons: Side-by-side (primary + secondary)

#### 3. **Feature Cards (Circular Icons)**

- Circular gradient backgrounds (purple, pink, blue)
- Illustration inside circle
- Heading below circle
- Description text below heading
- Equal sizing, evenly spaced

#### 4. **Feature Columns (Text-Heavy)**

- 3-column layout
- Heading at top
- Bulleted list of features
- Consistent height

#### 5. **Buttons**

- Primary: Bright cyan background, white text, rounded (24px radius)
- Secondary: White/transparent background, border, cyan text
- Hover: Slightly darker/lighter shade
- Padding: 12px 32px
- Font: 16px, medium weight (500-600)

#### 6. **Footer**

- 3-column layout
- Section headings: Bold
- Links: Regular weight, gray
- Copyright: Center-aligned, small text
- Background: Same as page background (no contrast)

### Visual Effects

- **Subtle background patterns:** Large faded logos/icons behind content
- **Gradients:** Used in icons, not in backgrounds
- **Shadows:** Minimal or none (flat design)
- **Borders:** Subtle, 1px, low contrast
- **Rounded corners:** Buttons (24px), cards (16px)
- **Hover states:** Subtle color shift, no transform

---

## Key Design Principles Observed

1. **Minimalism:** Clean, uncluttered layouts with ample whitespace
2. **High contrast:** Strong text contrast for readability
3. **Bold typography:** Large, confident headings
4. **Flat design:** No heavy shadows or 3D effects
5. **Accent color discipline:** Cyan used sparingly for CTAs and highlights
6. **Icon-driven:** Visual icons/illustrations to communicate concepts
7. **Responsive:** Mobile-first approach with stacking layouts
8. **Accessibility:** High contrast ratios, clear focus states

---

## Mapping to KOMPLEET

### Pages to Redesign

1. **Landing Page (/)** → NextAuth hero pattern
2. **Sign-In Page (/sign-in)** → Centered card, minimal
3. **Dashboard (/dashboard)** → Feature card grid for quick actions
4. **Tax Calculators** → Clean form layouts with feature columns
5. **Transactions** → Table with subtle borders, high contrast
6. **E-Invoicing** → Form-heavy, use NextAuth's clean input style
7. **Bank Uploads** → Drag-and-drop zone with circular icon
8. **Filing Center** → Status cards with circular progress indicators
9. **Reports** → Data-heavy, use subtle backgrounds
10. **Profile/Settings** → Simple form layouts

### Component Library to Build

- **Button** (primary, secondary, danger)
- **Card** (feature card, data card, status card)
- **Input** (text, email, password, file upload)
- **Table** (transactions, reports)
- **Navigation** (header, sidebar, footer)
- **Modal** (confirmation, alerts)
- **Progress** (circular, linear)
- **Badge** (status indicators)
- **Dropdown** (select, menu)
- **Tabs** (navigation within pages)

---

## Implementation Notes

- Use Tailwind CSS for styling (already in use)
- Create design tokens in `tailwind.config.js`
- Build reusable components in `src/components/ui/`
- Implement dark theme using CSS variables
- Ensure WCAG AA contrast ratios
- Test responsive breakpoints: 320px, 768px, 1024px, 1440px

---

## Next Steps

1. **Clarify with user:**
   - Brand font (use Inter or keep current?)
   - Adjust cyan accent to KOMPLEET green?
   - Tone of voice for UI copy
   - Dashboard landing view preference
   - User segments to optimize for (SMEs, freelancers, accountants)

2. **Design system approval:**
   - Present color palette with KOMPLEET branding
   - Typography scale
   - Spacing system
   - Component patterns

3. **Wireframe approval:**
   - Homepage/dashboard layout
   - Navigation hierarchy
   - Feature prioritization

4. **Implementation:**
   - Build component library
   - Redesign all pages
   - Implement light/dark themes
   - Test accessibility
   - Deploy to production

---
name: Luminescent Companion
colors:
  surface: '#13121c'
  surface-dim: '#13121c'
  surface-bright: '#393843'
  surface-container-lowest: '#0e0d17'
  surface-container-low: '#1c1a25'
  surface-container: '#201e29'
  surface-container-high: '#2a2934'
  surface-container-highest: '#35333f'
  on-surface: '#e5e0f0'
  on-surface-variant: '#ddbfc8'
  inverse-surface: '#e5e0f0'
  inverse-on-surface: '#312f3a'
  outline: '#a58993'
  outline-variant: '#574149'
  surface-tint: '#ffb0ce'
  primary: '#ffb0ce'
  on-primary: '#63003a'
  primary-container: '#f454a3'
  on-primary-container: '#570033'
  inverse-primary: '#b2196e'
  secondary: '#cabeff'
  on-secondary: '#31009a'
  secondary-container: '#4816cb'
  on-secondary-container: '#b9aaff'
  tertiary: '#f1be68'
  on-tertiary: '#422c00'
  tertiary-container: '#b68938'
  on-tertiary-container: '#3a2600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e5'
  primary-fixed-dim: '#ffb0ce'
  on-primary-fixed: '#3e0022'
  on-primary-fixed-variant: '#8c0054'
  secondary-fixed: '#e6deff'
  secondary-fixed-dim: '#cabeff'
  on-secondary-fixed: '#1c0062'
  on-secondary-fixed-variant: '#4816cb'
  tertiary-fixed: '#ffdeab'
  tertiary-fixed-dim: '#f1be68'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#13121c'
  on-background: '#e5e0f0'
  surface-variant: '#35333f'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  urdu-headline:
    fontFamily: Noto Nastaliq Urdu
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 54px
  urdu-body:
    fontFamily: Noto Nastaliq Urdu
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 36px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an intimate, premium AI voice companion aesthetic tailored for personalized, ambient interactions. The atmosphere is warm, ethereal, and distinctly non-corporate—avoiding cold sterility in favor of soft luminance, organic fluid gradients, and tactile elegance. 

### Visual Philosophy
- **Atmospheric Depth:** Built on an abyssal violet-black foundation, light emanates from interactive and dynamic voice states rather than static fills.
- **Glassmorphism & Luster:** Translucent frosted planes, feathered violet borders, and specular light accents evoke a refined crystal apparatus.
- **Responsive Bioluminescence:** The interface responds to vocal rhythm and presence with gentle, breathing glows, soft diffusion, and liquid-like transitions.
- **Bilingual Grace:** Designed natively to accommodate bilingual typography, balancing modern Latin letterforms with generous, poetic Urdu script metrics.

## Colors

The palette relies on luminous jewel tones cast against deep chromatic darks. Neutral surfaces are infused with deep violet rather than pure achromatic grey to maintain an organic, warm presence.

### Functional Palette Roles
- **Background Deep (`#0B0A14`):** Canvas grounding. Provides the absolute dark baseline for voice luminescence.
- **Surface / Card (`#161426`):** Primary base layer for cards and static containers, styled with low alpha overlay (`rgba(22, 20, 38, 0.7)`).
- **Surface Elevated (`#1F1C36`):** Active sheets, flyouts, and floating controls (`rgba(31, 28, 54, 0.85)`).
- **Border Structural (`#2E2A4D`):** Architectural boundary definition at varying opacities (`rgba(46, 42, 77, 0.6)`).
- **Primary / Rose Magenta (`#E94B9A`):** Core voice entity color, primary action points, and active pulse state.
- **Secondary / Electric Violet (`#7C5CFF`):** Neural response paths, active listening states, and ambient focus glows.
- **Accent / Soft Gold (`#F5C26B`):** Premium markers, assistant suggestions, memory highlights, and warm feedback.
- **Semantic Channels:** Success (`#3DDC97`), Warning (`#FFB547`), Danger (`#FF5C6C`).
- **Typography Channels:** Text Primary (`#F4F1FF`), Text Secondary (`#A8A3C7`), Text Muted (`#69638E`).

### Gradient Structures
- **Core Luminescence:** `linear-gradient(135deg, #E94B9A 0%, #7C5CFF 100%)` used for primary call-to-actions, active voice orbs, and illuminated strokes.
- **Ethereal Sheen:** `linear-gradient(180deg, rgba(244, 241, 255, 0.12) 0%, rgba(244, 241, 255, 0.02) 100%)` for glass highlights.

## Typography

Typography balances geometric modernity with fluid humanism. 

- **Primary Headings (`Plus Jakarta Sans`):** Warm geometric construction with smooth terminals. Tighter tracking at larger scales preserves structural density.
- **Body & Dialogue (`Inter`):** Neutral, hyper-legible rendering for synthesized transcripts, system responses, and settings.
- **Urdu Script (`Noto Nastaliq Urdu`):** Implemented for high-fidelity RTL linguistic expression. Demands a minimum of `2.0x` to `2.2x` line-height compensation relative to font size to avoid ascender/descender clipping in dialogue transcripts.

## Layout & Spacing

The layout is grounded in a fluid-first arrangement optimized for voice-centric mobile viewports and floating desktop companion widgets.

- **Breakpoints:**
  - Mobile: `< 768px` (single column fluid, 16px lateral padding, floating voice puck fixed to bottom zone).
  - Tablet: `768px - 1024px` (8-column grid, modular cards, contextual side sheet).
  - Desktop: `> 1024px` (12-column grid, centered assistant workspace capped at `1280px` max-width, or persistent floating overlay of `420px`).
- **Vertical Rhythm:** Generous vertical distribution around the central voice visualizer. Breathing room (`space-xl`) between conversational blocks prevents claustrophobic dense feeds.
- **Urdu Spacing Rules:** RTL layouts invert padding directions; element gaps retain standard tokens, but container vertical paddings increase by `4px` to preserve baseline optical harmony.

## Elevation & Depth

Visual hierarchy uses frosted glassmorphic stratification, translucent separation, and dynamic ambient bioluminescence instead of opaque drop shadows.

### Elevation Levels
- **Tier 0 (Canvas):** Pure `#0B0A14` with ambient background gradient radials (`rgba(124, 92, 255, 0.08)` and `rgba(233, 75, 154, 0.06)`) positioned off-center.
- **Tier 1 (Passive Card):** `background: rgba(22, 20, 38, 0.65)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(46, 42, 77, 0.6)`. Shadow: `0 8px 32px -4px rgba(0, 0, 0, 0.35)`.
- **Tier 2 (Elevated Popovers & Trays):** `background: rgba(31, 28, 54, 0.85)`, `backdrop-filter: blur(32px)`, `border: 1px solid rgba(124, 92, 255, 0.25)`. Shadow: `0 16px 48px -8px rgba(0, 0, 0, 0.5)`.
- **Tier 3 (Active Voice Core & Highlights):** Borderless or gradient-bordered, carrying the signature aura: `box-shadow: 0 0 40px 8px rgba(233, 75, 154, 0.35), 0 0 80px 24px rgba(124, 92, 255, 0.2)`.

## Shapes

The interface embraces curvilinear geometry. Radical curvature conveys human warmth, softness, and biological responsiveness.

- **Pill System (`rounded-full`):** Buttons, interactive voice status chips, input search pills, and active badges.
- **Standard Surfaces:** Containers and major dialogue cards use explicit `20px` corner radii.
- **Form Controls:** Text entry fields, selection items, and audio control plates use explicit `14px` corner radii.
- **Iconography System:** Rounded endpoints, geometry featuring continuous curves, and an exact line stroke weight of `1.75px`.

## Components

### Buttons
- **Primary Glow Button:** Fully pill-shaped (`9999px`), styled with `linear-gradient(135deg, #E94B9A 0%, #7C5CFF 100%)`. Label in `#F4F1FF`. Resting glow: `0 4px 20px rgba(233, 75, 154, 0.4)`. Active press shrinks scale to `0.98` with heightened glow diffusion (`0 6px 30px rgba(124, 92, 255, 0.6)`).
- **Secondary Glass Button:** Translucent background (`rgba(244, 241, 255, 0.05)`), border `1px solid rgba(46, 42, 77, 0.8)`. Hover introduces a violet hue tint (`rgba(124, 92, 255, 0.15)`).

### Glass Cards
- Built with a uniform `20px` border radius, frosted backdrops, and `1px` gradient border strokes (`linear-gradient(180deg, rgba(244, 241, 255, 0.15) 0%, rgba(46, 42, 77, 0.3) 100%)`).
- Cards house voice logs, contextual smart cards (weather, reminders), and speech transcriptions.

### Form Inputs
- Radius fixed to `14px`. Base fill is `rgba(11, 10, 20, 0.6)` enclosed by `1px solid #2E2A4D`.
- Focus state: Border transitions to `#7C5CFF` accompanied by an exterior ring shadow (`0 0 0 3px rgba(124, 92, 255, 0.25)`). Placeholder styled with `#A8A3C7` at 50% opacity.

### Chips & Filters
- Compact pill-shaped modules (`height: 32px`, `padding: 0 14px`). Glassmorphic inactive state; active state displays a soft rose-to-violet gradient fill with white label typography.

### Checkboxes & Radio Buttons
- Formed with `1.75px` stroke frames. Active checks trigger a gradient fill (`#E94B9A` to `#7C5CFF`) with a soft drop-glow. Checkmark vector utilizes smooth, rounded terminals.

### Voice Visualizer & Orb (Specialized Component)
- Multi-layered central sphere or wave element with continuous radial gradient animation.
- Incorporates dynamic amplitude reactive scaling, enveloped by CSS multi-stop drop shadows emitting dynamic hues based on voice intent: Rose Magenta (speaking), Violet (processing/thinking), Soft Gold (suggesting/insights).
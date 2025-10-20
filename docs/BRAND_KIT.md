# Valcee Couture — Brand Kit

This document captures the core tokens and guidance for the Valcee Couture storefront.

Palette
- Sand: #fbfaf1 (CSS var: --valcee-sand)
- Gold: #c1936b (CSS var: --valcee-gold)
- Cocoa: #634b37 (CSS var: --valcee-cocoa)
- Ink: #262f3b (CSS var: --valcee-ink)
- Slate: #3f4a59 (CSS var: --valcee-slate)

Usage
- Primary background: Sand
- Accent / CTAs: Gold
- Text primary: Ink
- Secondary text / UI: Slate
- Support color: Cocoa for brand elements and small accents

Typography
- Primary: Helvetica Neue (system sans fallback)
- Secondary: IBM Plex Serif for editorial headings
- Mobile first scale: base 16px, lead 18px, heading 28-36px responsive

Spacing & Layout
- Mobile-first layout with 1rem base padding on small screens and 2rem on md+
- Use generous whitespace and large imagery; keep components minimal and tactile

Accessibility
- Maintain contrast ratios for text on background; use Ink on Sand for body copy
- Provide focus states and visible outlines for keyboard users

Design Direction
- Keep UI minimal; remove decorative borders and unnecessary icons
- Prioritize product imagery and concise copy
- Microinteractions: subtle fades and transform on hover

Notes
- Palette tokens are available in `app/styles/app.css` and Tailwind classes are exposed in `tailwind.config.js`.

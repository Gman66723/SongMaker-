---
name: google-song-maker-web-style
version: 1.0.0
description: Design web pages and music tools in Chrome Music Lab Song Maker's playful minimalist style, while applying Google's documentation-writing, accessibility, and HTML/CSS guidelines. Use when implementing or redesigning Song Maker+ or when a user explicitly requests this visual language.
---

# Google Song Maker web style

## Scope and source priority

This is a **community-authored skill**, not an official Google design system. It deliberately combines separate references:

1. **Product reference:** Chrome Music Lab Song Maker — this determines the visual identity.
2. **Google developer documentation style guide:** https://developers.google.com/style — determines plain-language interface writing, inclusive language, and accessibility.
3. **Google HTML/CSS style guide:** https://google.github.io/styleguide/htmlcssguide.html — determines code conventions.
4. Material Design principles may help with form labels and keyboard navigation, but must **never** replace the Song Maker layout with dashboards, sidebars, dark cards, or generic Material styling.

When rules conflict, preserve the source product's recognizable look while making sensible accessibility improvements.

## Visual contract (mandatory for Song Maker+)

- Use a predominantly **white** page, no dark theme, gradient header, neon glow, or large boxed panels.
- Header: short, centered, uppercase **SONG MAKER+** title in clean sans-serif; secondary navigation is understated.
- Make the **wide matrix of square notes** the focus. Grid background should be white or near-white; fine thin cyan vertical beat bars and pale-blue grid lines.
- Melody notes use the familiar rainbow/diatonic pitch coloring. Color is associated with the **pitch row**, not only the chosen track.
- Beneath the melody grid, display visually small percussion lanes. A filled cyan dot represents a kick; a cyan triangle represents a high hat. Give percussion notes accessible textual labels.
- Use cyan-blue for play and tempo accents. Main play control is round. Keep instrument and settings actions small and directly below the canvas.
- Extra features (custom tracks, samples, mixing, export options) belong behind labeled **Tracks** and **Settings** controls; they must not dominate or distort the classic layout.
- Control text should be sentence case (except the product name), short, and easy to scan.
- Prefer `Arial`, `Helvetica`, and generic sans-serif fallback; avoid decorative display fonts.
- Preserve the same hierarchy on mobile; allow horizontally scrollable grid rather than shrinking notes to unusable touch targets.

## UX writing and accessibility rules

These are adapted from Google's developer documentation style guide and accessibility chapter, not direct quotations:

- Write in active voice and address the reader as **you** where helpful.
- Give actions brief, concrete names: **Play**, **Tracks**, **Upload**, **Save**, **Settings**.
- Keep headings and labels in sentence case.
- Explain unfamiliar formats once, such as WAV or JSON, in optional help rather than prominent marketing text.
- Make errors actionable: “Could not read the sound file. Choose a WAV, MP3, or OGG file.”
- Provide accessible names for icon-only buttons and every note cell. Surface toggle states with `aria-pressed` and `aria-expanded` as appropriate.
- Keep key navigation possible. Support focus-visible outlines that have sufficient contrast against white.
- Do not rely on rainbow colors or cyan percussion symbols alone to convey note or track state.
- When documenting UI interactions, refer to the actual control names instead of their physical position.
- Aim for readable, succinct, globally understandable language.

## HTML/CSS conventions

- Use semantic HTML (`header`, `main`, `button`, `label`, `input`, `aside`) when sensible.
- Use two-space indentation, lowercase element and attribute names, quoted attribute values, and valid nesting.
- Use HTTPS for external assets; prefer zero external dependencies for GitHub Pages.
- Use classes for repeated CSS rules; keep related rules grouped.
- Do not use inline JavaScript handlers.
- Test HTML loading, CSS, JavaScript syntax, color contrast, keyboard control, narrow viewport scrolling, and reduced-motion behavior.

## Implementation sequence

1. Inspect the existing Song Maker+ HTML, CSS, and JavaScript. Preserve working sound-generation code and event IDs.
2. Compare composition to the source reference: header, 13–14 row melody grid, two small percussion lanes, footer transport.
3. Build the white/cyan/rainbow visual baseline **before** adding expanded music-production features.
4. Make advanced track management and sample import unobtrusive, but discoverable.
5. Test at desktop and mobile viewport sizes, including keyboard and pointer editing.
6. Verify playback, upload, save, and WAV export. Run `node --check app.js`, capture a browser screenshot, and audit any console errors.

## Anti-patterns (reject before shipping)

- Dark DAW dashboard styling, gradient backgrounds, oversized cards, visualizer backgrounds.
- A track sidebar that permanently takes width from the music grid.
- Selected notes all in the same track color rather than a rainbow pitch palette.
- Controls that are visually prominent but nonfunctional.
- Generic “Google-inspired” design that no longer resembles the Song Maker reference.

## Source references

- Chrome Music Lab Song Maker: https://musiclab.chromeexperiments.com/Song-Maker/
- Google developer documentation style guide: https://developers.google.com/style
- Highlights: https://developers.google.com/style/highlights
- Voice and tone: https://developers.google.com/style/tone
- Accessibility: https://developers.google.com/style/accessibility
- UI elements and interaction: https://developers.google.com/style/ui-elements
- Google HTML/CSS style guide: https://google.github.io/styleguide/htmlcssguide.html
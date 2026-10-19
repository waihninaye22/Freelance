---
name: burmese-i18n
description: Build and refine Archer's English/Burmese interface, translations, and language-aware typography and layout.
---

# Burmese i18n for Archer

Use this skill when changing Burmese translations or any UI shared by English and Burmese. Keep wording in the app's translation resources and make layout and typography respond to the selected language.

## Translation choices

- Do not translate every English term by default. Burmese interfaces commonly use English technical vocabulary and familiar UI labels, so retain terms such as `API`, `profile`, `settings`, `dashboard`, `Save`, and `Cancel` when they are clearer and more recognizable to Archer's users.
- Choose wording term by term for the intended audience. Keep established product names, technical terms, acronyms, and widely recognized UI labels in English; translate the surrounding instructions, explanations, and less familiar concepts into natural Burmese.
- Prefer natural Burmese-English code-switching over forced or overly literal Burmese equivalents. A translation should read naturally as a whole, even when it includes English terms.
- Follow terminology already used consistently in Archer's Burmese resources. When adding a term, check nearby screens and existing translations before choosing a new rendering.
- This is not a blanket rule to leave UI untranslated: translate terms when Burmese is clearer or more familiar to users, and avoid switching languages inconsistently within the same concept.

## Language-aware UI

- Use the current language state and language switch. Keep the document language in sync (`en` or `my-MM`) so assistive technology, browser language rules, and CSS can respond to it.
- Give English and Burmese separate typography tokens or selectors. Prefer `:lang(my-MM)` (or a language attribute on the relevant app root) over language checks scattered through components.
- Use a font stack with Burmese glyph coverage, falling back through `Noto Sans Myanmar`, `Myanmar Text`, `Padauk`, and a generic sans-serif. Do not add or download a font dependency without a project need.
- Burmese glyphs need more vertical room in many fonts. Avoid fixed pixel line heights and fixed-height text containers. Prefer the font's natural line box or a generous unitless line height; give Burmese headings, body copy, labels, buttons, and chips room to wrap without clipping.
- Keep language-specific letter spacing, font weight, and control padding independent where needed. Do not force Burmese into the English typography scale just to preserve identical component dimensions.
- Use content-driven heights and `min-height` where a control needs a minimum. Verify narrow widths, multiline labels, navigation, cards, errors, and empty states in both languages.

## Archer app notes

- The web app's language state and translation helper live in `app/app/i18n/`; the root `lang` attribute is updated by `LanguageProvider`.
- Keep English and Burmese translation keys aligned in `en.ts` and `my.ts`.
- Check the actual font fallback and rendering in a browser. A successful build does not confirm Burmese text has enough line height or padding.

# Design System Specification: Celestial Editorial

## 1. Overview & Creative North Star
This design system is anchored by the **"The Celestial Manuscript"** Creative North Star. It rejects the utilitarian "grid-of-boxes" approach common in mobile apps, opting instead for a high-end editorial experience that feels like an ancient star map reimagined for a digital age. 

We achieve an authoritative and mystical vibe through **Intentional Asymmetry** and **Tonal Depth**. Elements should feel like they are floating in a cosmic void or resting on fine silk, using overlapping layers and extreme typographic contrast to guide the user’s eye through complex astrological data.

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated interplay between the deep cosmic shadows of the `surface` and the radiant energy of `primary` (Amethyst) and `secondary` (Gold).

### The "No-Line" Rule
To maintain a premium, seamless feel, **designers are prohibited from using 1px solid borders for sectioning.** Boundaries must be defined through:
- **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
- **Negative Space:** Using large increments from our spacing scale (e.g., `8` or `12`) to define groups.
- **Textural Transitions:** Using subtle parchment-like gradients in the background to separate the header from the content.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-translucent materials. 
- **Base Level:** `surface` (#161218) for the main background.
- **Secondary Level:** Use `surface-container-low` (#1E1A20) for large content areas.
- **Tertiary Level:** Use `surface-container-highest` (#38333A) for interactive elements like cards or inputs.

### The "Glass & Gradient" Rule
Floating elements (modals, bottom sheets) must utilize **Glassmorphism**. Apply a semi-transparent `surface-container` color with a `backdrop-blur` of 20px–40px. Main CTAs should use a linear gradient from `primary` (#EAB2FF) to `primary-container` (#54236A) at a 135-degree angle to provide a "soulful" glow.

---

## 3. Typography
The typography strategy balances the authority of tradition with the precision of modern data.

- **Display & Headlines (Newsreader):** Used for astrological terms, star names, and section titles. The serif nature of Newsreader mimics high-end traditional Chinese typesetting. Use `headline-lg` for impactful vertical titles to evoke scroll-like aesthetics.
- **Body & Labels (Manrope):** All functional data—house descriptions, celestial coordinates, and UI labels—must use Manrope. This clean sans-serif ensures the app feels "professional" and readable at small sizes on WeChat.
- **Hierarchy Hint:** Use `display-lg` for the "Main Star" of a chart, and `label-sm` in `on-surface-variant` for metadata. The contrast in scale is what creates the "Editorial" feel.

---

## 4. Elevation & Depth
Depth is a narrative tool in this system, conveying the distance between the observer and the stars.

### The Layering Principle
Avoid traditional shadows where possible. Instead, stack `surface-container-lowest` (#110D13) underneath `surface-container` (#221E24) to create a recessed "carved" effect, or use `surface-bright` (#3C373E) to lift a card forward.

### Ambient Shadows
If an element must "float" (e.g., a critical astrological pop-up), use a **Shadow Tint**. The shadow should be 8% opacity of the `primary` color (#EAB2FF) with a blur of `32px` and a `16px` Y-offset. This creates a mystical "aura" rather than a dirty grey drop shadow.

### The "Ghost Border" Fallback
Where containment is required for accessibility, use a **Ghost Border**: `outline-variant` (#4B444D) at 20% opacity. For high-end decorative elements, use the `secondary` (#E9C349) at 15% opacity to create a "whisper of gold."

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `md` (0.375rem) rounded corners. Text in `on-primary` (#4A1960) `title-sm` Bold.
- **Secondary (The Gold Accent):** `outline` style using `secondary` at 40% opacity. No solid fill. 
- **Tertiary:** Text-only in `secondary_fixed_dim`. Use for "Cancel" or "Back" actions.

### Cards (The "Astrological House")
Cards should never have borders. Use `surface-container-low` with `lg` (0.5rem) corner radius. To separate cards, use `spacing-6` (2rem) rather than lines. Incorporate a very subtle `secondary` gold motif (star map pattern) at 5% opacity in the top-right corner of cards.

### Inputs & Selectors
- **Fields:** `surface-container-highest` background. The active state is indicated by a "Ghost Border" of `secondary` (#E9C349) and a tiny `primary` glow.
- **Chips:** For selecting "Years" or "Palaces." Use `full` roundedness. Selected state uses `primary_container` with `on_primary_container` text.

### Specialized Component: The Star Map
For Zi Wei Dou Shu charts, the 12-palace grid should be borderless. Use subtle shifts between `surface-container-low` and `surface-container-lowest` to create a checkerboard-like distinction that feels integrated into the background.

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Place titles off-center or allow images/patterns to bleed off the edge of the screen.
- **Embrace the Dark:** Keep the `surface` dominant. The "mystical" vibe relies on the contrast between the dark void and the amethyst/gold light.
- **Micro-interactions:** Use soft fades (300ms) for all state transitions to mimic the movement of clouds or stars.

### Don't:
- **Don't use 100% White:** Use `on_surface_variant` (#CEC3CE) for secondary text to keep the UI soft and high-end.
- **No Harsh Corners:** Avoid `none` (0px) roundedness. Even a "sharp" look should use `sm` (0.125rem) to feel premium and "finished."
- **No Grid Clutter:** If the screen feels busy, remove a background container and use more whitespace (`spacing-8` or `spacing-10`) instead.

---

## 7. Spacing Scale
Always favor larger spacing increments to maintain the "Editorial" feel.
- **Container Padding:** `4` (1.4rem) or `5` (1.7rem).
- **Section Gaps:** `8` (2.75rem) or `12` (4rem).
- **Inline Elements:** `1.5` (0.5rem) or `2` (0.7rem).

This system is designed to feel like an unveiling. Every pixel should serve the purpose of making the user feel they are interacting with an authoritative, spiritual relic.
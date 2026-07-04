# Virtuoso Practice Suite — Style and Brand Guidelines

This document establishes the permanent visual identity, architectural rules, and interface craft patterns for the **Virtuoso Practice Suite** application. All future modifications, features, or page components must strictly adhere to these specifications to preserve design cohesiveness.

---

## 1. Visual Identity & Mood (The "Ocean Slate" Archetype)

The visual tone is pragmatic, focused, scholarly, and distraction-free. It avoids neon, game-like, or overly decorated dashboard interfaces, utilizing an organic, premium material feel that mimics physical high-end studio gear.
- **Personality**: Quietly professional, high contrast, tactile, and quiet.
- **Design Intent**: Feels like modern European audio instrumentation—sleek, deliberate, and high-fidelity, keeping negative space generous so musicians can focus on their performance and sound.
- **Aesthetic Principle**: Architectural Honesty. No simulated matrix code, faux-terminal logging, or excessive telemetry. Layout elements are humble, clearly named, and built with explicit, high-end finishing.

---

## 2. Color Palette & Spatial System

Colors are optimized for extreme eye comfort during long practice hours in both dim-lit studio settings and bright stage/rehearsal environments.

### A. Primary Palette
*   **Core Brand Blue (`#0c4a6e` / `--color-slate-deep`)**: Represented under the token `--color-slate-deep` inside Tailwind. This is a deep, luxurious Ocean Blue. It is the dominant identifier for active states, key action buttons, and critical UI focal points (such as the rotating pitch wheel lock zone and metronome accent rings).
*   **Slate Ink (`#0f172a` / `--color-slate-900`)**: The deep neutral charcoal used for primary titles, heavy display headers, and main dark text, ensuring excellent readability and contrast.
*   **Muted Steel (`#64748b` / `--color-slate-500`)**: Used for secondary typography, descriptions, and secondary control tabs.
*   **Studio Milk (`#ffffff`)**: The pristine container base background for active workspaces in light mode.
*   **Studio Cream (`#f8fafc` / `#f1f5f9`)**: Soft off-white backdrops that separate distinct panels without needing harsh solid lines.

### B. Functional Indicators & Accents
*   **Accent Crimson**: Specifically used for irreversible actions (e.g., deleting a song, clearing custom data ranges) to create a protective friction layer.
*   **Interactive Sky Blue & Amber**: Applied to custom micro-pulsing items, measure indicator tags, and active selection filters.

---

## 3. Typography & Sizing Matrix

The system integrates clean, highly legible fonts designed to be read from a distance (e.g., when the device is sitting on a music stand 2–3 feet away).

### A. Font Definitions (via `src/index.css`)
```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
  --font-condensed: "Roboto Condensed", "Oswald", sans-serif;
  --font-ultra-condensed: "Oswald", sans-serif;
  --font-jazz: "Architects Daughter", "Patrick Hand", cursive, sans-serif;
  --font-justhand: "Just Another Hand", cursive, sans-serif;
  --font-cossette: "Cossette Titre", "Just Another Hand", cursive, sans-serif;
  --font-spacemono: "Space Mono", monospace;
  --font-intertight: "Inter Tight", "Inter", sans-serif;
  --font-bigshoulders: "Big Shoulders Display", "Space Mono", monospace, sans-serif;
}
```

### B. Font Sizing Rules
*   **Display Numbers (BPM & Pitch Indicators)**: Large, high-impact block typography (`text-5xl` to `text-7xl`) styled with extra structural tracking adjustments. This matches tactile metronome dial markings and displays clearly from a distance.
*   **Section Headers & Section Labels**: Strict, capitalized tracking-wider headings using premium semi-bold or extra-bold weights (`font-extrabold uppercase`).
*   **Interface Controls**: Medium body font sizes (`text-sm` or `text-xs`) with medium weights (`font-semibold` or `font-medium`) to maintain structural balance.

---

## 4. Tactile UI Components & Interaction Patterns

Every key view features custom-designed mechanics that elevate them from standard digital sliders to high-fidelity physical instruments.

### A. The Metronome Swing & Interface
*   **Pulse Visualizer**: Balanced using a high-fidelity inline horizontal expansion card that reacts instantly to beats.
*   **Speed Adjustment**: Dual control structures—both ultra-responsive large-increment touch taps (`+`/`-` buttons) and quick-toggle presets based on standard orchestral terms (e.g., Largo, Adagio, Andante, Moderato, Allegro, Presto).
*   **Sound Library Drawer**: Uses physical card mockups that overlay as sliding sheets, letting the user listen to and switch between Classic Click, Woodblock, Digital Beep, Resonant Bell, and Synth Cowbell with single-click actions.

### B. The Circular Pitch Wheel (Tuner / Pitch Pipe)
*   **Polar Layout**: Centered around a beautiful virtual analog turntable circle containing all 12 equal-temperament chromatic notes.
*   **Rotary Touch Mechanics**: Sliding around the circle uses polar trigonometry (`Math.atan2`) to map pointer drag directly to the nearest pitch, allowing smooth legato sweeping.
*   **Double-Tap / Swipe Latching**: Supports fluid, physical slide-to-center latching. Sliding your finger into the inner circle latches the pitch so it rings indefinitely until dismissed.

### C. The Randomizer & Drill Matrix
Provides a split slate control split into distinct rows:
*   **Pool categories**: Separated into dedicated action columns (HYMN, JAZZ, NUMBER, CHORD, KEY).
*   **Immediate random generation**: Uses large-button organic interactive shapes that trigger fluid state transformations on tap.
*   **Dynamic custom ranges**: Allows live, inline database editing where musicians can type custom strings to instantly repopulate their practice queues.

### D. The Practice Log System
*   **Keep-Style Note Cards**: Designed like soft paper slips pinned to the dashboard, providing instant previews of titles, dates, and content snippets.
*   **Bottom Writing Trigger**: Stays anchored for natural thumb access on mobile devices, pulling up an elegant, distraction-free sheet that auto-saves actions immediately to localStorage.

---

## 5. Motion, Framing, & Micro-animations

Animations are purposeful, designed to communicate change of state and depth without causing interactive lag.
*   **Transitions**: Tab adjustments and custom slide-up panel overlays employ custom CSS transition properties with customized spring curves (`duration-200 ease-out` and `active:scale-98`).
*   **Staggered Entry**: Practice notes, cards, and menu list items fade into existence using a fast, high-contrast entry transition.
*   **Pulse Effects**: The metronome employs a tight visual beat flash which is throttled to 80ms to match the rapid transient cycle of a woodblock striking, providing comfortable visual feedback.
*   **Touch-friendliness**: All interactive targets (buttons, wheel slices, notes list) feature a minimum of 44px boundaries to prevent friction when operating a mobile device or tablet while holding an instrument in the other hand.

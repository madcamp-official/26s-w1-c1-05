# ScrumMate Design System

ScrumMate is a web application that helps small teams manage their workflow — sprints, boards, backlogs, and standups without the ceremony overhead of enterprise tools. Built for teams of 3–12 who want structure, not bureaucracy.

**Sources provided:** none (no codebase, Figma, or brand files were attached). This system was authored from scratch per the brief: *neat image, black & white theme*. All components are original designs. **No logo was provided and none was invented** — wherever a mark would appear, the brand name is set in plain type (`ScrumMate`, Instrument Sans semibold, tight tracking).

---

## CONTENT FUNDAMENTALS

**Voice:** calm, direct, slightly dry. ScrumMate talks like a competent teammate, not a coach. No exclamation marks, no cheerleading, no emoji — ever.

**Rules:**
- Sentence case everywhere: buttons ("Add task", not "Add Task"), headings, labels. The only uppercase is tiny overline labels (IN PROGRESS, SPRINT 14).
- Second person, active voice: "You have 3 tasks due today", "Assign this to someone".
- Verbs first on actions: "Start sprint", "Move to done", "Invite teammate".
- Numbers as numerals, always: "2 blocked", not "two blocked".
- Task IDs are mono and uppercase: `SM-142`.
- Empty states are one short sentence plus one action: "No tasks in this sprint yet." → [Add task]
- Confirmation over celebration: "Sprint 14 started." Never "🎉 Woohoo!"
- Destructive copy is explicit: "Delete this task? This can't be undone."

**Vibe:** a well-kept notebook. Terse, legible, trustworthy.

---

## VISUAL FOUNDATIONS

**Color.** Strictly monochrome: one ink (`#0a0a0a`), one paper (`#ffffff`), a 12-step gray ramp. Hierarchy comes from weight and value, never hue. The single permitted color is a muted red (`#b42318`) reserved exclusively for destructive actions and blocked status. Status is expressed with filled/half/empty monochrome dots, not colored badges.

**Type.** One sans (Instrument Sans) for everything; IBM Plex Mono for data — task IDs, counts, dates, shortcuts. Headings are semibold with tight (-0.02em) tracking. Overlines are 11px semibold uppercase with +0.06em tracking. Body is 14px/1.5.

**Backgrounds.** Flat white pages; sunken `#fafafa` panels for rails and wells. No gradients, no textures, no imagery, no illustration. The interface *is* the graphic.

**Borders & shadows.** Hairlines (`1px #e4e4e4`) do the structural work. Cards are bordered, never shadowed. Shadow exists only on overlays (menus, dialogs) — soft, gray, never colored. Strong borders (`1px #0a0a0a`) mark selection and focus-adjacent emphasis.

**Corner radii.** Neat and small: 3px (checkboxes, tags), 5px (controls, inputs), 8px (cards), 12px (dialogs), full (avatars, pills).

**Spacing & layout.** 4px grid. Fixed left sidebar (232px, sunken), 52px top bar, content max 1120px. Density is medium-tight: 34px default control height.

**Interaction states.** Hover: background shifts one gray step (`#f4f4f4`); on inverse elements, opacity to 0.9. Press: one more step darker (`#ececec`), no scale/shrink. Focus: 2px white gap + 2px ink ring (`--focus-ring`). Selected: inverted — ink background, white text.

**Motion.** Restrained. 120–180ms ease-out fades and small translates. Nothing bounces, nothing loops. Dialogs fade+scale from 0.98; menus fade+4px rise.

**Transparency & blur.** Essentially none. The only transparency is the 40% black scrim behind dialogs.

**Imagery.** None in-product. Avatars are initials on gray circles.

---

## ICONOGRAPHY

- **Icon set:** [Lucide](https://lucide.dev) via CDN (`lucide@latest` UMD script or copied SVGs). Chosen for its 1.5px stroke, geometric neatness — matches the hairline system. No icon font, no PNGs, no emoji, no unicode-glyph icons.
- **Usage:** 16px default (`width/height 16`), stroke `currentColor`, stroke-width 2 at small sizes reads best. Icons always accompany text in buttons except IconButton.
- **Status dots** are not icons: they are 8px CSS circles (filled = done, gray = in progress, outlined = todo, red = blocked).
- **Logo:** none provided, none created. Wordmark = plain type.

Load in HTML: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`, or inline-copy specific SVGs.

---

## INDEX

- `styles.css` — global entry; imports everything in `tokens/`.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css`, `base.css`.
- `guidelines/` — specimen cards shown in the Design System tab.
- `components/`
  - `forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch
  - `display/` — Card, Badge, Tag, Avatar, StatusDot
  - `navigation/` — Tabs, Sidebar (kit-level)
  - `feedback/` — Dialog, Toast, Tooltip
- `ui_kits/scrummate/` — Board, Backlog, Standup screens + interactive `index.html`.
- `SKILL.md` — agent skill entry point.

**Intentional additions:** `StatusDot` and `Avatar` (a workflow tool can't render tasks/people without them).

**Font substitution flag:** no brand font files were provided; Instrument Sans + IBM Plex Mono (Google Fonts) are stand-ins. Provide real font files to replace `tokens/fonts.css`.

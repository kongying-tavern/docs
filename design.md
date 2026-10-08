# 空荧酒馆 Docs — Style Reference

> A green-khaki tavern ledger on a clean white bar — calm, legible, and quietly game-flavored

**Theme:** light (with a maintained dark variant via `.dark`)

空荧酒馆 (Kongying Tavern) docs are a Genshin Impact community wiki + client manual, and the visual identity follows a tavern-keeping philosophy: a clean white page, hairline dividers, and one unmistakable brand green that echoes the game's own signature green. The palette is built exclusively on the three-tier hierarchy of the VitePress default theme (solid / hover / soft with translucent alpha), recolored from stock indigo to a mint-to-deep-emerald gradient `#60bf90 → #008858`. Typography runs entirely on locally subset, self-hosted CJK fonts: Sarasa Gothic SC for reading, HYWenHei 85W for display titles, and HYWenHei 65W for UI emphasis — no web font services, no flash of unstyled text. Depth is deliberately flat: cards separate themselves with hairline borders and soft translucent washes rather than hard shadows, and interactivity speaks through the same green vocabulary as the brand (links hover to brand-2, buttons fill with brand-light, focus rings glow primary green). The one deliberate whimsy is the mascot Paimon, who eats broken images, and the logo lantern that anchors the hero. This is a docs system that treats its game audience seriously but never heavily — every stroke stays crisp, aligned, and just a little playful.

> **Source website:** [空荧酒馆 (Kongying Tavern)](https://yuanshen.site) — Compare this extracted reference with the live site, which remains authoritative. Canonical origin: `https://yuanshen.site` (`SITE_ORIGIN` in `src/constants/site.ts`).

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| White | `#ffffff` | `--vp-c-white` | Pure whites, button text, overlay text |
| Page Background | `#ffffff` | `--vp-c-bg` | Main canvas (light mode) |
| Background Alt | `#f6f6f7` | `--vp-c-bg-alt` | Sidebar background, code block fills, secondary sections |
| Background Elevated | `#ffffff` | `--vp-c-bg-elv` | Floating surfaces: dialogs, dropdowns, popovers |
| Background Soft | `#f6f6f7` | `--vp-c-bg-soft` | Code-copy buttons, subtle raised fills |
| Dark Background | `#1b1b1f` | `--vp-c-bg` (`.dark`) | Page canvas in dark mode |
| Dark Background Alt | `#161618` | `--vp-c-bg-alt` (`.dark`) | Sidebar / code fills in dark mode |
| Dark Background Elevated | `#202127` | `--vp-c-bg-elv` (`.dark`) | Floating surfaces in dark mode |
| Brand Mint | `#60bf90` | `--vp-c-brand-1` | Link text, colored text on soft green, active nav, topic-type "feat" badge |
| Brand Green | `#3aa374` | `--vp-c-brand-2` | Hover state for links and brand elements |
| Brand Deep Green | `#008858` | `--vp-c-brand-3` | Solid brand fills that must carry white text, timeline accents |
| Brand Green (legacy) | `#44bd87` | `--vp-c-brand` | Primary button background, `vp-link` color, topmost timeline dot, logo anchor |
| Brand Light | `#34d399` | `--vp-c-brand-light` | Brand button hover background and border |
| Brand Soft | `rgba(0, 108, 69, 0.16)` | `--vp-c-brand-soft` | Subtle green washes: home feature icon chips, doc-link hover, topic references (dark: `rgba(96, 191, 144, 0.14)`) |
| Text 1 | `#3c3c43` | `--vp-c-text-1` | Primary text, headings (dark: `#dfdfd6`) |
| Text 2 | `#67676c` | `--vp-c-text-2` | Muted text, meta, captions, blockquote (dark: `#98989f`; custom light: `rgba(56 56 56 / 70%)`) |
| Text 3 | `#929295` | `--vp-c-text-3` | Placeholders, subtle labels, outline counts (dark: `#6a6a71`) |
| Code Text | `#476582` | `--vp-c-text-code` | Inline code color (dark: `#aac8e4`) |
| Accent | `#35495e` | `--vp-c-accent` | Secondary accent color (Vue-themed legacy) |
| Border | `#c2c2c4` | `--vp-c-border` | Interactive component borders, inputs (dark: `#3c3f44`) |
| Divider | `#e2e2e3` | `--vp-c-divider` | Section separators, h2 top rules, feature-card borders (dark: `#2e2e32`) |
| Gutter | `#e2e2e3` | `--vp-c-gutter` | Column/page gutters, `vp-divider` shortcut (dark: `#000000`) |
| Gray 1 | `#dddde3` | `--vp-c-gray-1` | Alt button active state (dark: `#515c67`) |
| Gray 2 | `#e4e4e9` | `--vp-c-gray-2` | Alt button hover state (dark: `#414853`) |
| Gray 3 | `#ebebef` | `--vp-c-gray-3` | Alt button background, scrollbar thumbs (dark: `#32363f`) |
| Gray Soft | `rgba(142, 150, 170, 0.14)` | `--vp-c-default-soft` | Subtle gray fills, inline code background (dark: `rgba(101, 117, 133, 0.16)`) |
| Success | `#18794e` | `--vp-c-success-1` | Success feedback; reaction success icon uses `--vp-c-green-2` `#299764` (dark: `#3dd68c`) |
| Warning | `#915930` | `--vp-c-warning-1` | Warning containers, official `@role` tag, topic-type "bug" (dark: `#f9b44e`) |
| Danger | `#b8272c` | `--vp-c-danger-1` | Errors, destructive actions, official role badge (dark: `#f66f81`) |
| Purple | `#6f42c1` | `--vp-c-purple-1` | Author role badge, topic-type "announcement"/"post" (dark: `#c8abfa`) |
| Tip Text / Tip BG | `#003100` / `#e6f6e6` | `--vp-custom-block-tip-text` / `--vp-custom-block-tip-bg` | Tip containers: green-tinted custom override |
| Required Asterisk | `#e63e3e` | `required` shortcut (`before:color-[#e63e3e]`) | Required-field markers in forms |
| Banner | `#383636` | `--banner-bg` | Announcement banner bar (always dark) |
| Nav Glass | `rgba(255, 255, 255, 0.7)` | `--nav-c-bg` / `--vp-local-nav-bg-color` | Navbar / local-nav translucency (dark: `rgba(27, 27, 31, 0.7)`) |
| Disabled | `rgba(125, 125, 125, 0.2)` | `--vp-c-disabled-bg` | Disabled state fills |
| Skeleton Gradient | `rgba(0, 0, 0, 0.04)` | `--skeleton-animation-gradient` | Skeleton shimmer (dark: `rgba(255, 255, 255, 0.06)`) |

### Decorative / Gradient

| Name | Value | Token | Role |
|------|-------|-------|------|
| Hero Name Gradient | `-webkit-linear-gradient(120deg, #60bf90, #008858)` | `--vp-home-hero-name-background` | Home hero title text (brand-1 → brand-3) |
| Hero Image Wash | `linear-gradient(-45deg, rgba(68, 189, 135, 0.28) 30%, rgba(0, 136, 88, 0.12))` | `--vp-home-hero-image-background-image` | Soft green halo behind hero logo |
| Timeline Fade | `linear-gradient(180deg, var(--vp-c-divider) calc(100% - 24px), transparent)` | `.timeline-dot::after` | Timeline rail fade-out at the last entry |
| Timeline Dot Halo | `0 0 0 2px var(--vp-c-bg), 0 0 0 6px color-mix(in srgb, var(--vp-c-brand) 16%, transparent)` | `.timeline-dot::before` | Ring around the topmost timeline dot |

## Tokens — Typography

All three families are self-hosted, subset WOFF2 files (40–80 KB per chunk) generated by the `scripts/fonts/` pipeline, shipped as real weights (400/600/700 for Sarasa, one weight each for the HYWenHei faces) so no weight is synthesized. Chinese punctuation width, CJK–Latin spacing and line breaking are declared once in `.vitepress/theme/styles/main.css`; this section only covers which family and size to use.

### Sarasa Gothic SC (Min) — Body and UI text · `--vp-font-family-base`

- **Sizes:** 14px, 16px, 18px
- **Line height:** 24px, 28px
- **Role:** Default reading type, paragraphs, textarea, form fields, `--font-sans`/`--font-serif` stacks in the shadcn layer. Smooth CJK+Latin blend with generous metrics.

### HYWenHei-85W (Min) — Display and page titles · `--vp-font-family-title`

- **Weights:** heavy cut (85W), weight encoded in the family name
- **Sizes:** 28px – 56px
- **Line height:** 40px – 64px
- **Letter spacing:** -0.02em down to -0.4px at display sizes
- **Role:** `h1`, hero name, page title, outline title, header anchors. The boldest stroke in the system; reserved for ≤1 element per page.

### HYWenHei-65W (Min) — Subtitle and UI emphasis · `--vp-font-family-subtitle`

- **Weights:** medium-bold cut (65W)
- **Sizes:** 12px – 24px
- **Line height:** 24px – 32px
- **Role:** `h2`–`h6`, buttons, nav, menu/dropdown items, `strong`, `kbd`, `thead`, custom-block titles, timeline titles, hero tagline, `summary`, `.VPButton`. The workhorse of UI hierarchy — any non-body emphasized text.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| hero-display (≥960px) | 56px | 64px | -0.4px | `VPHero .name` |
| hero-name (≥640px) | 48px | 56px | -0.4px | `VPHero .name` |
| hero-name (base) | 32px | 40px | -0.4px | `VPHero .name` |
| h1 | 28px (32px ≥768px) | 40px | -0.02em | `.vp-doc h1` |
| h2 | 24px | 32px | -0.02em | `.vp-doc h2` |
| h3 | 20px | 28px | -0.01em | `.vp-doc h3` |
| h4 | 18px | 24px | -0.01em | `.vp-doc h4` |
| tagline | 18px → 24px | 28px → 36px | — | `VPHero .tagline` |
| body | 16px | 28px | — | `.vp-doc p`, `base.css` |
| nav-link | 14px | nav height (64px) | — | `VPNavBarMenuLink` |
| code | 0.875em | 1.7 | — | `--vp-code-font-size` / `--vp-code-line-height` |
| small / meta | 12px | 24px | — | `.vp-doc` small, page meta |

Headings are weight 600 and use the subtitle/title families per the tier above; body text is no less than 16px (14px minimum for nav and dense UI).

### Type Rendering

Five details that keep text still, snug in its box, and evenly wrapped. Each is declared once — in `.vitepress/theme/styles/main.css` or a component's own scoped style — and never patched per instance.

**Weight without reflow.** `html { font-synthesis: style }` switches synthesised weight off document-wide, portaled dialogs and form controls included: a family asked for a weight it does not own snaps to the nearest real face instead of smearing a faux bold, so a label that turns `font-weight: 600` keeps its measured width. Emphasis therefore switches *cut*, not weight — `HYWenHei-65W-min` is registered at 600, `HYWenHei-85W-min` at 400, and Sarasa carries real 400/600/700. The optical-size axis a variable font would carry is encoded as one family per optical cut (`-65W` / `-85W`); the pipeline ships static subsets, so `font-optical-sizing` and `font-variation-settings` appear nowhere, and a new optical size means a new family in `scripts/fonts/`, not a CSS axis.

**Steady numbers.** A figure that can change in place, or that is read down a column, carries `tabular-nums`: every digit takes the same advance, so the words after the number hold still.

| Surface | Figure |
|---------|--------|
| Reaction pills (`ForumTopicReactionButton`, `ForumCommentReactionButtons`, `ForumQuoteTopicButton`) | like / dislike counts |
| Reaction stats dialog (`ForumReactionStatsDialog`) | per-reaction counts and views |
| Sidebar topic rows (`ForumSidebarSection`) | comment counts |
| Editor toolbar (`ForumEditorTools`) | image counter (`n / 8`) |
| Topic ID badge (`ForumTopicLifecycle`) | topic number |
| Timeline date column (`Post.vue`, `.timeline-dot-date`) | dates on the rail |

**Trimmed labels.** `text-box: trim-both cap alphabetic` removes the leading a line box adds above the capitals, so the padding a label declares is the space you see. Nothing applies it yet, and its scope is deliberately narrow: the trim is measured against Latin cap-height and alphabetic metrics while CJK ink extends past both, so it belongs on Latin/numeric labels (counters, `kbd`, version tags) and never on Chinese copy.

**Balanced headings.** Short display lines take `text-wrap: balance` so their lines come out even instead of leaving a stub — the blog post header (`ForumBlogPostHeader`), the blog page title and lead (`ForumBlogPage`, `Post.vue`), the publish paper's headline (`ForumPublishTopicForm.css`), and the `Empty` primitives. Balancing is capped at a handful of lines, which is exactly the display case, so it is never applied to a reading column.

**Pretty paragraphs.** `text-wrap: pretty` on short prose, so a paragraph does not end on a lone word — the aside cards (`ForumAsideLoginPrompt`, `ForumAsideRecentUpdates`, `ForumAsideTeamBlog`) — plus `text-balance` on empty-state copy (`ui/empty`, `ui/empty-motion/EmptySwap`). Long-form reading text (`.vp-doc`, topic bodies, comments) keeps the default `wrap`.

## Tokens — Spacing & Shapes

**Density:** comfortable

Spacing is utility-driven: UnoCSS base unit `--spacing: 0.25rem` (4px), with explicit `px` utilities (`py-8px`, `pl-24px`) used at component boundaries.

### Vertical Rhythm

**Space goes above a block.** Every vertical gap is authored as space *above* the block that needs it — `margin-top` on the block itself, or `gap` on the column holding the stack — so a block that appears later never shifts text already on screen. A block that can appear and disappear (a translation status, a loading row, an error line) contributes no space while it is empty, and the block below keeps its own `margin-top`.

| Gap | Value | Where |
|-----|-------|-------|
| Above a document section (`.vp-doc h2`) | 24px (`padding-top: 1.5rem`) plus up to 16px of collapsed margin; the stock `3rem` is overridden to 10px and the divider rule is removed | `main.css` |
| Between aside sections | 28px | `.forum-context-aside` grid `gap: 28px` |
| Above an aside section header | 14px to the card below | `.aside-section-header` (`margin-bottom` — the one space-below holdout) |
| Above a topic title | 4px (`mt-1`), 12px below it (`mb-xs`) | `ForumTopicDetailPanel` |
| Above topic metadata / body | 12px (`mt-3`) / 14px (`mt-3.5`) | `ForumTopicDetailPanel` |
| Above topic tags, quote strip, action row | 8px (`mt-2`); 16px for the action row in card mode (`mt-4`) | `ForumTopicCard` |
| Inside a comment | 2px container (`mt-.5`), 8px header (`mt-2`), 6px body (`mt-1.5`) | `commentStyles.ts` |
| Between comment rows | 12px `padding-bottom` on the row plus a 1px `border-bottom` — a divider, not a margin | `commentStyles.ts` |
| Between sidebar sections | 8px vertical padding plus a `border-top` hairline | `ForumSidebarSection` |
| Between menu / select rows | 4px content padding, rows at `padding: 8px 10px` | `DropdownMenuContent`, `ForumSidebarMenuItems` |
| Between dialog rows | 16px (`gap-4`) inside 24px of padding | `DialogContent` |
| Between forum body paragraphs | no margin at all — the blank line kept by the container's `white-space: pre-wrap` is the entire gap (one line box, ≈24px at 16/24) | topic and comment content containers |

Dividers follow the same idea: they are drawn as a `border-top` / `border-bottom` on the row itself with that row's padding as the air around them, never as a standalone spacer element. The one place in the forum where a gap is cancelled rather than authored is the translation slot — `ForumTopicDetailPanel` wraps it in `-mb-3.5` to cancel the body's `mt-3.5`, so an empty slot leaves no gap.

Density is not a second mode. There is no compact variant of the scale: below the 959px mobile breakpoint the touch targets *grow* (44px buttons) while the gaps stay on this scale, and the density knob a user actually has is `--site-ui-scale`, which scales UI type and control metrics rather than the spacing scale. The one place the space-above rule is not applied is prose inherited from VitePress — `.vp-doc` paragraphs, lists and tables keep the stock symmetric `margin: 1rem 0`.

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing: 0.25rem` (1 unit) |
| 8 | 8px | `--spacing-2` / `py-8px` |
| 12 | 12px | `--spacing-3` |
| 16 | 16px | `--spacing-4` |
| 20 | 20px | `--spacing-5` |
| 24 | 24px | `--spacing-6` |
| 32 | 32px | `--spacing-8` |
| 48 | 48px | `--spacing-12` |
| 64 | 64px | `--spacing-16` |

### Border Radius

| Name | Value | Token |
|------|-------|-------|
| sm | calc(var(--radius) - 4px) → 6px | `rounded-sm` |
| md | calc(var(--radius) - 2px) → 8px | `rounded-md` |
| base | 10px | `--radius: 0.625rem` / `rounded-lg` |
| xl | calc(var(--radius) + 4px) → 14px | `rounded-xl` |
| 2xl | calc(var(--radius) + 8px) → 18px | `rounded-2xl` |
| pill | 9999px | `rounded-full` |

| Element | Value |
|---------|-------|
| buttons (VPButton) | 20px (medium) / 24px (big) |
| custom blocks | 8px |
| feature icon chips | 10px (`var(--radius)`) |
| topic reference chips | 4px |
| avatars | 50% (circle) |
| scrollbar thumbs (sidebar) | 4px |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| shadow-xs | `0 1px 3px 0px hsl(0 0% 0% / 0.05)` | `--shadow-xs` |
| shadow-sm | `0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)` | `--shadow-sm` |
| shadow-md | `0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 2px 4px -1px hsl(0 0% 0% / 0.1)` | `--shadow-md` |
| shadow-xl | `0 1px 3px 0px hsl(0 0% 0% / 0.1), 0 8px 10px -1px hsl(0 0% 0% / 0.1)` | `--shadow-xl` |
| shadow-2xl | `0 1px 3px 0px hsl(0 0% 0% / 0.25)` | `--shadow-2xl` |
| vp-shadow-1 | `0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)` | `--vp-shadow-1` |
| vp-shadow-2 | `0 3px 12px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.07)` | `--vp-shadow-2` |
| vp-shadow-3 | `0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08)` | `--vp-shadow-3` |
| vp-shadow-4 | `0 14px 44px rgba(0, 0, 0, 0.12), 0 3px 9px rgba(0, 0, 0, 0.12)` | `--vp-shadow-4` |
| vp-shadow-5 | `0 18px 56px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.16)` | `--vp-shadow-5` |

Shadow usage is sparing by design: cards and sections are separated by hairline `--vp-c-divider` borders, and elevation (dialogs, dropdowns) uses `--vp-shadow-2`–`--vp-shadow-3`.

### Layout

- **Nav height:** 64px (glass)
- **Local nav (mobile):** 52px (`--locale-nav-height`)
- **Sidebar width:** 295px (`--vp-sidebar-width`, custom; VitePress default 272px)
- **Max content width:** 1440px (`--vp-layout-max-width`)
- **Section gap:** 48px (h2 top margin); **element gap:** 16px (paragraph margin)
- **Custom block padding:** 16px 16px 8px
- **Nav glass:** `backdrop-filter: saturate(180%) blur(20px)`
- **Layout top dock:** 0.1px (`--vp-layout-top-height`, banner anchor point)

## Components

### Brand Button (`.VPButton.brand`)

**Role:** Primary CTA — home hero actions, download links

Background: Brand Green `#44bd87` (`--vp-button-brand-bg`). Text: `rgba(255, 255, 245, 0.86)` (`--vp-button-brand-text`). Border: 1px Brand Light `#34d399`. Font: 16px/600 (big) or 14px/600 (medium), family subtitle. Radius: 24px (big) / 20px (medium). Sizes: `padding: 0 24px; line-height: 46px` / `padding: 0 20px; line-height: 38px`. Transition: color/border/bg 0.25s.

- **Hover:** background Brand Light `#34d399`, text pure white.
- **Focus:** unified `:focus-visible` ring (outline + 2px primary ring).
- **Active:** background returns to `--vp-button-brand-bg` `#44bd87`, text white, transition fast 0.1s.

### Alt Button (`.VPButton.alt`)

**Role:** Secondary / neutral action

Background: Gray 3 `#ebebef` (`--vp-button-alt-bg`). Text: Text 1. Same geometry as Brand Button.

- **Hover:** Gray 2 `#e4e4e9`. **Active:** Gray 1 `#dddde3`.

### Navbar (`.VPNav`)

**Role:** Top navigation, fixed

Background: Nav Glass `rgba(255, 255, 255, 0.7)` with `backdrop-filter: saturate(180%) blur(20px)`. Height: 64px. Logo left (24px lantern mark), menu center, user avatar + locale switch right. Links: 14px, subtitle family. Scroll behavior: hide-on-scroll with `top 0.35s ease-out` and `background-color 0.5s` transitions; `.reached-top` compensates the banner dock.

- **Hover:** link color → Brand Mint `#60bf90`; menu items get a soft gray wash.
- **Focus:** ring on `a`/`button` (`:focus-visible`).
- **Active:** menu item highlighted in Brand Mint; dropdown menus on elevated white surfaces.

### Sidebar (`.VPSidebar`)

**Role:** Section navigation, 295px left rail

Background: `--vp-c-bg-alt` (light `#f6f6f7`). Group links: `padding: 3px 0`, subtitle family when active; custom thin scrollbar (8px track, 4px-radius thumb from `--vp-button-alt-bg`). Outline markers hidden; active link inherits brand-1. Fixed on desktop; drawers on mobile (`≤960px`). Link labels keep `line-height: 28px` in menus.

- **Hover:** link text → Text 1 on soft gray wash. **Active:** Brand Mint text.
- **Focus:** visible ring on links per global rule.

### Feature Cards (`.VPHomeFeatures`)

**Role:** Homepage value-proposition grid

Background: `--vp-c-bg`; border: 1px `--vp-c-divider` (hairline). Icon chip: 48px, font-size 24px emoji, brand-soft wash with `border-radius: var(--radius)` (10px — overrides the default 6px). Card title: subtitle family; details: body 16px/28px Text 2. Grid: flex-wrap with 8px item padding (16px effective gap), 1 col → 2 → 4 (`grid-4`, ≥960px). Entry animation: `slide-enter` stagger (90ms step).

- **Hover:** border-color → Brand Green `#3aa374`.
- **Focus/Active:** whole card is a link (`VPFeature.link`) with the global focus ring.

### Custom Blocks (`.custom-block`)

**Role:** Tip / Warning / Danger / Info / Details containers in Markdown

Radius: 8px. Padding: `16px 16px 8px`. Title in subtitle family; body Text 2, 24px line height. Unstyled border (transparent) + translucent soft fills; tip is custom overridden to `#e6f6e6` bg / `#003100` text — a green-tinted block unique to this site.

- Links inside tinted to the block's accent (tip → brand, warning → yellow-1, danger → red-1), hover → `-2` shade.
- **Focus:** links get the global ring.

### Inline Links & Doc Links

**Role:** Body copy links, forum document references

Links: Brand Mint `#60bf90`, hover Brand Green `#3aa374`, underline on hover. Forum document links (`a.forum-document-link`): no underline, inline-flex with 1em file-text icon, `vertical-align: -0.25em`, transition `background-color 160ms ease`.

- **Hover:** `background-color: var(--vp-c-brand-soft)` wash.
- **Focus:** global ring. Banner links: underline with 2px offset.

### Timeline (`.timeline-dot`)

**Role:** Changelog / update history rail

Left rail at 92px; entries pad `28px 0 20px 120px`. Dot: 16px circle. The topmost dot is a **solid** Brand Green disc (drawn with an 8px border so `[border-*]` still recolours it), ringed by a 2px page-background gap and a 4px 16% Brand Green halo. Every later dot is a hollow 3px ring in Border `#c2c2c4` on the page background, no halo. Rail: 2px continuous Divider, beginning at the topmost dot's center (nothing above it) and fading out via gradient + clip-path at the last entry. Date: 64px column left, 16px/500 Text 2. Title: title family, Text 1; in-entry `h2`/`h3` headings (subtitle family) share that Text 1 so the entry reads as one column. Non-interactive — no hover/focus states.

### Code Blocks & Inline Code

**Role:** Technical content

Block background: `rgba(125, 125, 125, 0.04)` (custom, near-invisible), copy button `rgba(125, 125, 125, 0.1)` → hover `0.2`. Inline code: Code Text `#476582` on default-soft (light; `#aac8e4` for dark). Line highlight `rgba(125, 125, 125, 0.2)`.

- **Hover (copy button):** `--vp-code-copy-code-hover-bg` `rgba(125, 125, 125, 0.2)`.
- **Focus:** ring on the copy button; active text Text 2.

### Banner

**Role:** Announcement strip docked above the navbar

Fixed top, z-index `--vp-z-index-layout-top`. Background: `#383636`; text white; padding `8px 24px 8px 8px` (32px horizontal on md+). Content centered, max-width `calc(1440px - 64px)`. Entry: `slide-enter-inverse` 1s, 0.3s delay. Links inside: Brand Mint text with 2px-offset underline. Contains a close (×) button and the language-suggest bar variant.

### Focus Styles (global)

**Role:** Keyboard accessibility contract

```css
#app a:focus-visible,
#app button:focus-visible,
#app input[type='checkbox']:focus-visible {
  --at-apply: outline-1 outline-primary ring-2 ring-primary;
}
```

One ring everywhere: 1px outline + 2px ring in primary green (`oklch(0.7168 0.1343 160.53)` ≈ `#44bd87`). Focus is never removed except for components that provide their own visible affordance (scratch-to-reveal spoilers keep `outline: none` by design).

## Motion

**The highlight glides; it never blinks.** A row list does not toggle a background per row. One highlight layer lives in the container and slides to whichever row sits nearest the pointer, so the highlight is always under the cursor and there is no dead zone in gaps, padding, or the space past the last row. This is the house rule for any list or menu that highlights rows — reach for `FluidHoverList` instead of writing per-row `hover:bg-*`.

`FluidHoverList` (`.vitepress/theme/components/ui/fluid-hover/`) wraps the headless core in `.vitepress/theme/hooks/fluid-hover/`: a pure nearest-centre pick (`geometry.ts`) plus a single absolutely-positioned indicator driven by a critically damped closed-form spring (the framer-motion `{ type: 'spring', duration, bounce: 0 }` curve). Its transform, size and opacity are written per frame — never through a CSS transition — so the pointer can retarget mid-flight without a restart.

| Motion | Value |
|--------|-------|
| Highlight tier `fast` (default) | 0.08s spring |
| Highlight tiers `moderate` / `slow` | 0.16s / 0.24s |
| Highlight fade in / out | 0.08s / 0.06s |
| Hover and small state changes | 120–180ms `ease` / `ease-out` |
| Larger reorders and panel moves | 200–420ms `cubic-bezier(0.22, 1, 0.36, 1)` or `cubic-bezier(0.32, 0.72, 0, 1)` |
| Navbar chrome (hide-on-scroll, background) | 350ms / 500ms |
| View transitions | fade out 240ms, fade in 320ms; mobile page slide 360ms |
| `slide-enter` stagger (docs only, 90ms step) | 800ms |

Container contract: the container is `position: relative` (a Reka popper needs its own wrapper — the teleported `$el` is a placeholder, not the content element) and every row carries `data-fluid-hover-item`, sub-menu trigger rows included, or the trigger and its neighbours light up together. Inside a fluid container a global rule in `main.css` suppresses each row's `:focus` background, so the sliding layer is the only highlight and keyboard focus is rendered by the indicator too — with `[data-variant='destructive']` rows keeping their semantic red above it.

Navigation adds a second, independent layer: an always-visible active marker (`active` selector + `active-indicator-class`) pinned to the current section, ignoring hover, positioned directly with no transition. `sectionIds` and `scroller` wire it to a section scroll-spy that is suppressed while a programmatic scroll is in flight. The marker never uses brand green — an active row reads through text (brand-1, weight) only, never a second background stacked under the highlight.

**Reduced motion.** The site resolves the motion preference once at boot into `data-reduced-motion` on `<html>` (`sitePreferences.ts`), defaulting to the system `prefers-reduced-motion`; a global rule then collapses every CSS transition and animation to 0.01ms. JS-driven motion reads that same dataset rather than the media query, so an explicit in-site preference wins over the OS setting: the highlight snaps to the row while its fades still run, and programmatic scrolling falls back from `smooth` to `auto`.

## Do's and Don'ts

### Do

- Use the green scale as the single interactive color: links and text on brand-1 `#60bf90`, hovers on brand-2 `#3aa374`, solid fills on brand-3 `#008858`, legacy brand `#44bd87` for buttons and the topmost timeline dot.
- Keep the three-family type hierarchy: Sarasa for reading, 85W for the one title per page, 65W for every other emphasized UI text.
- Separate surfaces with hairline `--vp-c-divider` borders and translucent alpha washes — depth comes from alpha, not from hard shadows.
- Always style hover **and** focus (`:focus-visible` ring) together on interactive elements; the ring color is primary green, nothing else.
- Run new copy through the font subset pipeline — adding common characters only widens the `cjk.min` layer.
- Reserve red (`--vp-c-danger-*`) for destructive/errors, yellow for warnings, purple for author/mod roles and announcements.
- Mirror light/dark via the `.dark` token set; both themes are first-class.
- Author vertical space above the block that needs it (`margin-top`, or `gap` on the column); a block that appears later must never shift what is already rendered.
- Give every changing count `tabular-nums`, every short display heading `text-wrap: balance`, and short prose `text-wrap: pretty`.
- Switch family for emphasis (`-65W` ↔ `-85W`) instead of asking a face for a weight it does not carry; synthesised weight is off on purpose.
- Reach for `FluidHoverList` when a list or menu highlights rows — one highlight per container, gliding, with the active marker as a separate layer.
- Route any JS-driven motion through `data-reduced-motion` rather than reading the media query directly.

### Don't

- Do not reintroduce the VitePress default indigo (`#3451b2`) or any blue as a brand accent — brand-2/brand-3 and the `#34d399` light are the only interactive greens.
- Do not hardcode hex colors in components; every surface, text, and border level has a token.
- Do not add new webfonts or external font services — all fonts are self-hosted subsets built by the `scripts/fonts/` pipeline, and Google Fonts pins are frozen.
- Do not flatten the heading letter-spacing (`-0.02em` at h1/h2, `-0.01em` at h3/h4, `-0.4px` on the hero name).
- Do not drop below 16px for body text or 14px for dense UI/nav.
- Do not apply hard shadows to cards or sections in page flow — elevation is for floating layers (dialogs, dropdowns) only.
- Do not introduce new mobile breakpoints; the forum and component hierarchy hinge on the 959px `mobile` breakpoint (derived from `FORUM_MOBILE_BREAKPOINT_PX`).
- Do not change the legacy `--vp-c-brand` (#44bd87) alias — brand-1/2/3 and brand coexist on purpose (button fills vs. link tints).
- Do not author space below a block — no new `margin-bottom` + `:last-child` resets, no `space-y-*` (Wind4 emits it as `margin-block-end`); convert what is there as you touch it.
- Do not add `font-variation-settings` or `font-optical-sizing` — the subsets are static faces; a new optical cut is a new family in `scripts/fonts/`.
- Do not trim label boxes with `text-box` on CJK copy — the trim metrics are Latin cap-height and alphabetic baseline, and Chinese ink extends past both.
- Do not `text-wrap: balance` or `pretty` a reading column (`.vp-doc`, topic bodies, comments); those values are for short display blocks.
- Do not give a row its own hover or `:focus` background inside a fluid-hover container — the shared indicator is the only highlight.

## Imagery

Imagery is deliberately light and functional. The brand mark is a round lantern badge (`/imgs/common/logo/logo_256.png`, plus 32/64/128/512 variants and online-instance variants) — it anchors the nav at 24px and floats in the hero at 256px behind a soft green blur halo (`--vp-home-hero-image-background-image` + 30–72px blur). Home feature cards use emoji glyphs rather than illustrations, sitting in brand-soft chips. Manual pages use client screenshots of the in-game map overlay. Blog covers are generated OG images (1200×630 via `genshin.og.interknot.site`) — a platinum template for short titles and a blackboard template with oversized type for update logs — with per-article `cover` frontmatter. The footer renders a client-side SVG QR code leading to the community group. Icons are lucide (reaction morph icons, file-text doc icons) plus a custom icon collection (bilibili, QQ, PayPal, WeChat pay logos). The one piece of personality: broken images fall back to `images/noImage.png` and tag the caption "图片被派蒙吃掉了！" — Paimon ate the image.

## Layout

The site follows the classic VitePress three-zone document layout, recolored and re-typographed:

- **Top:** optional fixed announcement banner (`#383636`) docks at `--vp-layout-top-height` (0.1px); the 64px glass navbar (logo · menu · locale · avatar) sits beneath it and compensates on scroll.
- **Desktop (≥961px):** 295px sidebar left (`--vp-c-bg-alt`), centered content column, aside outline right (hidden for the forum and full-width pages).
- **Mobile (≤960px):** sidebar collapses into a drawer; a 52px local nav with outline dropdown replaces both rails.
- **Home layout:** hero (gradient name, tagline, brand + alt CTAs, blurred logo), then the default feature grid (flex wrap, 1/2/4 columns, 16px effective gap) with slide-enter stagger.
- **Content flow:** h2 sections open with 24px of padding (`padding-top: 1.5rem`) rather than VitePress's divider rule, which `main.css` removes and whose `margin-top: 3rem` it overrides to 10px; figures center with bold captions; blockquotes get a 2px divider-left rule.
- **Footer:** multi-column navigation, QR card right, then a license row — "MIT Licensed, Made with ❤ by Kongying Tavern" — with social icon links.
- **Forum pages:** the layout widens beyond the doc column (full width up to 1279px); keep components `/docs/`-relative and respect the 959px mobile breakpoint for stacking.
- **Scroll behavior:** smooth globally (`scroll-behavior: smooth`), disabled inside the forum; scroll anchoring disabled there to avoid hash-jump drift.

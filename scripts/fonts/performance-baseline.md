# Font Subsetting Performance Baseline

Baseline for the script-split subsetting scheme introduced in
`9bab8095` (`feat: split font subsets by script and dot-separate chunk hashes`)
and refactored in `007f670f`. Use it to judge whether future changes to the
font pipeline (chunking, script sets, extraction roles) regress page-load cost.

## Reproducing

Static upper-bound measurement (parses generated CSS, scans locale markdown,
assumes every font family renders every character on the page):

```bash
pnpm build:fonts
python scripts/fonts/measure_font_loading.py
```

Real-browser measurement (full rendered page including UI chrome; only laid-out
text triggers fetches, so scroll/expand interactive regions for completeness):

```bash
pnpm build
node node_modules/vitepress/bin/vitepress.js preview --base=/docs/ --port 4173
```

Then open a page and run in the console:

```ts
performance.getEntriesByType('resource')
  .map(e => e.name)
  .filter(n => n.includes('/fonts/'))
```

## Chunk inventory (72 chunks, 3 weights)

Per-group totals; all `*.woff2` chunks and both generated stylesheets
(`fonts-subset.css`, `fonts-standard.css`) are gitignored and rebuilt
deterministically by `pnpm build:fonts` from the committed source TTFs (the
font-subset Vite plugin runs the pipeline automatically on dev/build start).

| group | chunks | KiB | min-max KiB |
| --- | --- | --- | --- |
| sarasa_gothic_sc.cjk.min | 5 | 265 | 39-63 |
| sarasa_gothic_sc.cjk.l1 | 9 | 525 | 45-73 |
| sarasa_gothic_sc.cjk.l2l3 | 11 | 758 | 63-77 |
| sarasa_gothic_sc.latin | 1 | 20 | 20-20 |
| sarasa_gothic_sc.latin-ext | 2 | 33 | 12-21 |
| sarasa_gothic_sc.symbols | 1 | 27 | 27-27 |
| sarasa_gothic_sc.kana | 1 | 46 | 46-46 |
| sarasa_gothic_sc.cjk-punct | 1 | 11 | 11-11 |
| hywenhei_65w.cjk.min | 4 | 203 | 46-58 |
| hywenhei_65w.cjk.l1 | 9 | 555 | 48-78 |
| hywenhei_65w.cjk.l2l3 | 8 | 565 | 55-81 |
| hywenhei_65w.latin | 1 | 8 | 8-8 |
| hywenhei_65w.latin-ext | 1 | 1 | 1-1 |
| hywenhei_65w.symbols | 1 | 7 | 7-7 |
| hywenhei_65w.kana | 1 | 16 | 16-16 |
| hywenhei_65w.cjk-punct | 1 | 9 | 9-9 |
| hywenhei_85w.cjk.min | 1 | 31 | 31-31 |
| hywenhei_85w.cjk.l1 | 9 | 560 | 48-78 |
| hywenhei_85w.latin | 1 | 15 | 15-15 |
| hywenhei_85w.latin-ext | 1 | 3 | 3-3 |
| hywenhei_85w.symbols | 1 | 7 | 7-7 |
| hywenhei_85w.kana | 1 | 15 | 15-15 |
| hywenhei_85w.cjk-punct | 1 | 12 | 12-12 |

Site characters per font: sarasa_gothic_sc=2283, 65w=1871, 85w=527.
Source cmap coverage: Sarasa Gothic SC 46272 glyphs (latin 287/389,
latin-ext 726/1162, kana 268/271, symbols 437/1408); 65W 10315 glyphs
(latin 135, latin-ext 24, kana 176, symbols 114); 85W 33540 glyphs
(latin 222, latin-ext 54, kana 176, symbols 116).

## Per-page averages (static, upper bound)

| locale | pages | avg files/page | avg KiB/page | pages fetching cjk.* |
| --- | --- | --- | --- | --- |
| en | 40 | 11.4 | 389 | 25/40 |
| ja | 36 | 22.1 | 918 | 33/36 |
| zh | 46 | 22.0 | 966 | 45/46 |

## Comparison with the pre-split scheme

Old scheme: `{stem}_{min|l1|l2l3}_{NN}_{hash}.woff2`, site chunks mixed
latin/kana/punctuation with Han. Old min chunk sizes are estimated at 55 KiB
(they were gitignored, not measurable after the fact); old l1/l2l3 chunks are
byte-identical to the new `cjk.l1`/`cjk.l2l3` ones (content hashes unchanged).

| locale | old avg KiB/page | new avg KiB/page | old cjk-touching pages | new |
| --- | --- | --- | --- | --- |
| en | ~590 | 389 | 29/40 | 25/40 |
| ja | ~1039 | 918 | 34/36 | 33/36 |
| zh | ~1133 | 966 | 45/46 | 45/46 |

Spotlight: an English page containing no Han characters now fetches only the
three `latin.01` chunks (43 KiB total); before, it fetched ~165 KiB of mixed
min chunks because Latin shared files with CJK.

## Browser measurements (Chrome, vitepress preview)

> Measured on the pre-Sarasa baseline (HYWenHei-45W as the content font);
> the 45w chunk numbers below are stale and kept only as a reference for the
> measurement procedure and layout triggers.

The language-suggest bar (`LanguageSuggestBar`) only renders when the browser's
preferred language differs from the page language, and its text is in the
*browser's* language — so measurements depend on the emulated
`navigator.languages`:

- `en/` with an `en-US` browser: 4 files, ~38 KiB — latin x3, symbols (65w).
  No suggest bar, zero CJK fetches.
- `en/` with a `zh-CN` browser: 10 files, ~320 KiB — adds cjk-punct (45w),
  cjk.min 01+02 (45w) and cjk.min 01+02+04 (65w), because the bar renders
  "我想更改此页面的语言为：…" (17 Han characters).
- `ja/` with a `zh-CN` browser: 22 files, ~518 KiB — adds kana x3; 85w
  additionally fetches cjk.l1.01-04 (see role-mapping note below).

Browser numbers are lower than the static upper bound because each family only
renders its own role (title/subtitle/content), and higher than markdown-only
content because UI chrome (nav, sidebar, suggest bar) adds characters.

## Findings worth preserving

- The language-suggest bar ("我想更改此页面的语言为：…" / "I want to change the
  language of this page to:…" / "このページの言語を変更したい:…") renders only when
  the browser's preferred language differs from the page language, and always
  in the browser's language (`useBannerState`: `isShowLanguageSuggestBar =
  (frontmatter.languageSuggest || external referrer on index) &&
  !pageLang.includes(suggestLanguage)`). Visitors browsing their own language
  never pay for it; a zh-CN visitor on an en page pays ~2 min chunks per
  weight for its 17 Han characters. Ordering min chunks by Google slicing
  frequency (emitting the omitted ultra-common base set — 的, 中 are in no
  bucket — first) keeps those characters inside the earliest chunks.
- Google's slicing buckets omit the most common Han characters entirely; any
  bucket-ordered chunking must handle this base set explicitly.
- Role-mapping nuance: some headings are extracted under the `subtitle` role
  but rendered with the title (85W) family, so their characters fall back to
  `85w.cjk.l1` chunks via unicode-range instead of `85w.cjk.min`. Correct but
  suboptimal; revisit the extraction role map if 85w l1 fetches grow.
- East Asian Ambiguous punctuation (curly quotes, ellipsis, dashes) is
  deliberately kept in the `latin` tier (VitePress excludes it): all tiers
  share one typeface, and every page loads latin anyway, so CJK pages pay
  nothing extra and English pages never fetch CJK chunks for quotes.

## Invariants to check after pipeline changes

- `pnpm build:fonts --force` twice produces identical file names (content-hash
  determinism).
- A site-text-only change must print `reused standard tiers` and leave
  standard-tier chunks byte-identical (only CSS unicode-range declarations
  move).
- `reuse` and `rebuild` paths must produce byte-identical
  `fonts-standard.css` for identical inputs.
